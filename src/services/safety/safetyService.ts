import {
  SafetyGuide,
  SafetyProfile,
  FieldFeedback,
  FieldFeedbackIssueType,
  LanguageCode,
} from '../../types';
import { safetyRepository } from '../sqlite/repositories/safetyRepository';
import { fieldFeedbackRepository } from '../sqlite/repositories/fieldFeedbackRepository';
import { syncQueueRepository } from '../sqlite/repositories/syncQueueRepository';
import {
  getSafetyProfile,
  isHazardousCategory,
  getAllBundledSafetyGuides,
} from './safetyRulesEngine';

export const safetyService = {
  /**
   * Retrieves deterministic safety profile for immediate UI display and warnings.
   */
  getProfile(materialCategory: string, language: LanguageCode = 'hi'): SafetyProfile {
    return getSafetyProfile(materialCategory, language);
  },

  /**
   * Checks if category has safety hazards.
   */
  isHazardous(materialCategory: string): boolean {
    return isHazardousCategory(materialCategory);
  },

  /**
   * Fetches safety guides from SQLite local cache. Works 100% offline.
   */
  async getGuides(language: LanguageCode = 'hi'): Promise<SafetyGuide[]> {
    try {
      const guides = await safetyRepository.getSafetyGuides(language);
      if (guides && guides.length > 0) return guides;
    } catch (e) {
      console.warn('[SafetyService] Error reading SQLite guides, fallback to bundled:', e);
    }
    return getAllBundledSafetyGuides(language);
  },

  /**
   * Fetches single guide by category.
   */
  async getGuideForCategory(
    category: string,
    language: LanguageCode = 'hi'
  ): Promise<SafetyGuide | null> {
    try {
      return await safetyRepository.getSafetyGuideByCategory(category, language);
    } catch (e) {
      console.warn('[SafetyService] Error fetching guide by category:', e);
      const bundled = getAllBundledSafetyGuides(language);
      return bundled.find((b) => b.materialCategory === category) || null;
    }
  },

  /**
   * Submits field feedback from real field testing or collector usage.
   * Saves to SQLite immediately, then enqueues to sync queue for Firebase upload.
   */
  async submitFieldFeedback(params: {
    userType: 'collector' | 'recycler';
    screen: string;
    issueType: FieldFeedbackIssueType;
    comments?: string;
    language?: string;
  }): Promise<FieldFeedback> {
    const feedback: FieldFeedback = {
      id: `FEEDBACK-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userType: params.userType,
      screen: params.screen,
      issueType: params.issueType,
      comments: params.comments,
      language: params.language || 'hi',
      createdAt: new Date().toISOString(),
      syncStatus: 'pending',
    };

    // 1. Save to SQLite
    await fieldFeedbackRepository.saveFeedback(feedback);

    // 2. Enqueue for Cloud Sync
    await syncQueueRepository.enqueueOperation({
      entityType: 'field_feedback',
      localId: feedback.id,
      operationType: 'CREATE',
      payload: feedback,
    });

    return feedback;
  },

  /**
   * Synchronizes remote safety guides into local SQLite cache.
   * Preserves existing content if Firebase is offline.
   */
  async syncRemoteSafetyGuides(remoteGuides: SafetyGuide[]): Promise<void> {
    if (!remoteGuides || remoteGuides.length === 0) return;
    for (const guide of remoteGuides) {
      await safetyRepository.saveSafetyGuide(guide);
    }
  },
};
