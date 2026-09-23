import { MaterialCategoryId } from './material';
import { SyncStatus } from './sync';

export interface AIPredictionAlternative {
  categoryId: MaterialCategoryId;
  confidence: number; // 0.0 to 1.0
}

export interface AIPrediction {
  localId: string;
  remoteId?: string;
  entityId: string; // e.g. lotId or local photo reference
  modelName: string; // e.g. 'material-mobilenet'
  modelVersion: string; // e.g. 'v1.0.0'
  predictedCategory: MaterialCategoryId;
  confidence: number; // 0.0 to 1.0 from actual model softmax
  alternatives: AIPredictionAlternative[];
  userConfirmed: boolean; // true if collector accepted, false if changed
  finalCategory: MaterialCategoryId; // user-selected or confirmed material
  feedbackNotes?: string;
  syncStatus: SyncStatus;
  createdAt: string;
  lastSyncedAt?: string;
}

export interface MaterialRecognitionResult {
  isAvailable: boolean;
  predictedCategory?: MaterialCategoryId;
  confidence?: number;
  alternatives?: AIPredictionAlternative[];
  requiresManualConfirmation?: boolean;
  modelName?: string;
  modelVersion?: string;
  errorMessage?: string;
}

export interface AIPriceEstimate {
  localId: string;
  remoteId?: string;
  lotId: string;
  modelName: string;
  modelVersion: string;
  estimatedMin: number;
  estimatedMax: number;
  estimatedAverage: number;
  confidence: number; // 0.0 to 1.0 based on data sufficiency and recency
  basis: string[]; // factors used e.g. ['recent_rates', 'completed_transactions', 'weight', 'area']
  dataPointCount: number;
  lastMarketDataAt?: string;
  syncStatus: SyncStatus;
  createdAt: string;
  lastSyncedAt?: string;
}

export interface PriceEstimationResult {
  isAvailable: boolean;
  estimatedMin?: number;
  estimatedMax?: number;
  estimatedAverage?: number;
  confidence?: number;
  basis?: string[];
  dataPointCount?: number;
  lastMarketDataAt?: string;
  message?: string;
  modelName?: string;
  modelVersion?: string;
}

export interface AIAnomalyEvent {
  localId: string;
  remoteId?: string;
  transactionId?: string;
  lotId?: string;
  modelName: string;
  modelVersion: string;
  anomalyScore: number; // 0.0 to 1.0 (higher = more anomalous)
  status: 'normal' | 'flagged';
  reason?: string;
  signals: string[];
  syncStatus: SyncStatus;
  createdAt: string;
  lastSyncedAt?: string;
}

export interface AnomalyEvaluationResult {
  isFlagged: boolean;
  anomalyScore: number;
  status: 'normal' | 'flagged';
  reason?: string;
  signals: string[];
  modelName: string;
  modelVersion: string;
}
