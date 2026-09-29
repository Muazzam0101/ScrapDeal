import { FieldFeedback, FieldFeedbackIssueType } from '../../../types';
import { getDatabase } from '../database';

function mapRowToFeedback(row: any): FieldFeedback {
  return {
    id: row.id,
    userType: row.userType as 'collector' | 'recycler',
    screen: row.screen,
    issueType: row.issueType as FieldFeedbackIssueType,
    comments: row.comments || undefined,
    language: row.language,
    createdAt: row.createdAt,
    syncStatus: row.syncStatus || 'pending',
  };
}

export const fieldFeedbackRepository = {
  /**
   * Saves a field feedback record to local SQLite and marks it pending for sync queue.
   */
  async saveFeedback(feedback: FieldFeedback): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO field_feedback (
        id, userType, screen, issueType, comments, language, syncStatus, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        feedback.id,
        feedback.userType,
        feedback.screen,
        feedback.issueType,
        feedback.comments || null,
        feedback.language || 'hi',
        feedback.syncStatus || 'pending',
        feedback.createdAt || new Date().toISOString(),
      ]
    );
  },

  /**
   * Retrieves all pending feedback waiting to be synced to Firebase.
   */
  async getPendingFeedback(): Promise<FieldFeedback[]> {
    const db = await getDatabase();
    const rows: any[] = await db.getAllAsync(
      'SELECT * FROM field_feedback WHERE syncStatus = "pending" ORDER BY createdAt ASC'
    );
    return (rows || []).map(mapRowToFeedback);
  },

  /**
   * Updates sync status of a field feedback entry.
   */
  async updateSyncStatus(id: string, syncStatus: 'pending' | 'synced'): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE field_feedback SET syncStatus = ?, lastSyncedAt = ? WHERE id = ?',
      [syncStatus, new Date().toISOString(), id]
    );
  },

  /**
   * Retrieves all feedback records recorded on this device.
   */
  async getAllFeedback(): Promise<FieldFeedback[]> {
    const db = await getDatabase();
    const rows: any[] = await db.getAllAsync(
      'SELECT * FROM field_feedback ORDER BY createdAt DESC'
    );
    return (rows || []).map(mapRowToFeedback);
  },
};
