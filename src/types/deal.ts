import { SyncStatus } from './sync';

export type DealStatus = 'accepted' | 'handover_pending' | 'completed' | 'cancelled';

export interface Deal {
  id: string; // localId
  localId: string;
  remoteId?: string;
  lotId: string;
  collectorId: string;
  recyclerId: string;
  offerId: string;
  materialCategoryId: string;
  materialName: string;
  agreedRatePerKg: number;
  agreedTotalAmount: number;
  agreedWeightKg: number;
  status: DealStatus;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt?: string;
  syncStatus?: SyncStatus;
}
