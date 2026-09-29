import { LanguageCode } from './user';

export type HazardSeverity = 'low' | 'medium' | 'high';

export type SafetyCategoryKey =
  | 'battery'
  | 'crt'
  | 'lcd_panel'
  | 'pcb'
  | 'cables'
  | 'unknown'
  | 'sharp_metals'
  | 'broken_parts'
  | 'chemicals'
  | 'fire_hazard';

export interface SafetyGuide {
  id: string;
  materialCategory: SafetyCategoryKey | string;
  title: string;
  severity: HazardSeverity;
  doItems: string[];
  dontItems: string[];
  imageReferences?: string[];
  audioReferences?: string[];
  language: LanguageCode | string;
  version: number;
  updatedAt: string;
}

export interface SafetyProfile {
  materialCategory: SafetyCategoryKey | string;
  title: string;
  hazardLevel: HazardSeverity;
  isHazardous: boolean;
  warningBanner: string;
  doList: string[];
  dontList: string[];
  emergencyGuidance: string;
  audioGuidance: string;
  icon: string;
}

export type FieldFeedbackIssueType =
  | 'confusing'
  | 'slow'
  | 'hard_to_read'
  | 'translation'
  | 'button_issue'
  | 'offline_issue'
  | 'camera_issue'
  | 'other';

export interface FieldFeedback {
  id: string;
  userType: 'collector' | 'recycler';
  screen: string;
  issueType: FieldFeedbackIssueType;
  comments?: string;
  language: string;
  createdAt: string;
  syncStatus?: 'pending' | 'synced';
}
