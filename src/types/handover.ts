import { SyncStatus } from './sync';

export type HandoverStatus = 'pending' | 'completed' | 'cancelled';

export interface HandoverRecord {
  id: string; // localId
  localId: string;
  remoteId?: string;
  dealId: string;
  lotId: string;
  collectorId: string;
  recyclerId: string;
  actualWeightKg?: number;
  photoUri?: string;
  photoUrl?: string;
  notes?: string;
  collectorConfirmed: boolean;
  recyclerConfirmed: boolean;
  collectorConfirmedAt?: string;
  recyclerConfirmedAt?: string;
  latitude?: number;
  longitude?: number;
  status: HandoverStatus;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt?: string;
  syncStatus?: SyncStatus;
}
