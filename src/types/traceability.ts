import { SyncStatus } from './sync';

export type TraceabilityStatus =
  | 'created'
  | 'collected'
  | 'matched'
  | 'deal_confirmed'
  | 'handover_pending'
  | 'handover_confirmed'
  | 'payment_pending'
  | 'completed'
  | 'cancelled';

export type TraceabilityEventType =
  | 'LOT_CREATED'
  | 'MATERIAL_UPDATED'
  | 'OFFER_CREATED'
  | 'DEAL_CONFIRMED'
  | 'HANDOVER_STARTED'
  | 'WEIGHT_CONFIRMED'
  | 'HANDOVER_CONFIRMED'
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_COMPLETED'
  | 'TRANSACTION_COMPLETED';

export interface LocationData {
  latitude?: number;
  longitude?: number;
  city?: string;
  area?: string;
  timestamp?: string;
}

export interface TraceabilityRecord {
  id?: string;
  traceabilityId: string; // Format: SCRAP-2026-XXXXXXXX (collision-resistant)
  lotId: string; // Format: LOT-XXXXXXXX
  dealId?: string;
  handoverId?: string;
  transactionId?: string;
  paymentId?: string;

  collectorId: string;
  recyclerId?: string;

  materialCategory: string;
  initialMaterial: string;
  finalMaterial?: string;
  aiPredictedMaterial?: string;

  estimatedWeight: number; // Original approximate weight (NEVER overwritten)
  finalWeight?: number; // Verified final weight at handover
  weightDifference?: number; // Absolute difference
  weightDifferenceDirection?: 'loss' | 'gain' | 'exact';

  collectionLocation?: LocationData;
  handoverLocation?: LocationData;

  collectionTimestamp: string;
  handoverTimestamp?: string;
  completionTimestamp?: string;

  status: TraceabilityStatus;
  handoverReference?: string; // Format: HND-XXXXXXXX
  qrReferenceToken: string; // Secure random non-guessable verification token

  collectorConfirmedHandover: boolean;
  recyclerConfirmedHandover: boolean;

  paymentMethod?: string;
  paymentStatus?: string;
  agreedRatePerKg?: number;
  agreedTotalAmount?: number;

  hasConflict?: boolean;
  conflictDetails?: string;

  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  lastSyncedAt?: string;
}

export interface TraceabilityEvent {
  eventId: string; // Format: EVT-XXXXXXXX
  id?: string;
  traceabilityId: string;
  lotId: string;
  dealId?: string;
  handoverId?: string;
  transactionId?: string;

  eventType: TraceabilityEventType;
  actorId: string;
  actorType: 'collector' | 'recycler' | 'system';

  previousStatus?: TraceabilityStatus;
  newStatus: TraceabilityStatus;

  timestamp: string;
  location?: LocationData;
  metadata?: Record<string, any>;

  syncStatus: SyncStatus;
  createdAt: string;
}

export interface HandoverConfirmation {
  confirmationId: string;
  id?: string;
  handoverId: string;
  lotId: string;
  dealId: string;

  confirmedBy: string;
  userType: 'collector' | 'recycler';
  confirmationType: 'handover_dispatched' | 'handover_received';

  timestamp: string;
  location?: LocationData;
  weightConfirmed: number;
  notes?: string;

  syncStatus: SyncStatus;
  createdAt: string;
}

export interface HandoverPhotoRecord {
  photoId: string;
  id?: string;
  lotId: string;
  handoverId: string;
  storageReference: string; // Storage path or local URI
  capturedAt: string;
  capturedBy: string;
  photoType: 'before_handover' | 'at_handover' | 'packaging';

  syncStatus: SyncStatus;
  createdAt: string;
}

export interface PublicTraceabilityView {
  traceabilityId: string;
  lotId: string;
  materialCategory: string;
  status: TraceabilityStatus;
  estimatedWeight: number;
  finalWeight?: number;
  collectionDate: string;
  collectionGeneralArea?: string;
  handoverDate?: string;
  handoverGeneralArea?: string;
  recyclerFacilityName?: string;
  isVerified: boolean;
  verificationTimestamp: string;
}
