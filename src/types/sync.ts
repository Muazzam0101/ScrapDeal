export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export type OperationType = 'CREATE' | 'UPDATE' | 'DELETE';

export type EntityType = 'material_lot' | 'user' | 'offer' | 'transaction' | 'deal' | 'handover' | 'photo';

export interface SyncMetadata {
  localId: string;
  remoteId?: string;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt?: string;
}

export interface SyncQueueItem {
  id: string;
  entityType: EntityType;
  localId: string;
  remoteId?: string;
  operationType: OperationType;
  payload: string; // Serialized JSON of the entity
  status: SyncStatus;
  retryCount: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: Array<{ localId: string; error: string }>;
}
