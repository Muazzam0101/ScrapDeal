import { syncQueueRepository } from '../sqlite/repositories/syncQueueRepository';
import { lotRepository } from '../sqlite/repositories/lotRepository';
import { userRepository } from '../sqlite/repositories/userRepository';
import { offerRepository } from '../sqlite/repositories/offerRepository';
import { transactionRepository } from '../sqlite/repositories/transactionRepository';
import { firestoreService } from '../firebase/firestore';
import { storageService } from '../firebase/storage';
import { networkService } from '../connectivity/networkService';
import { SyncQueueItem, MaterialLot, User, Offer, Transaction } from '../../types';

export type SyncEngineListener = (status: {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  error: string | null;
}) => void;

class SyncEngine {
  private _isSyncing = false;
  private _lastSyncedAt: string | null = null;
  private _lastError: string | null = null;
  private listeners: Set<SyncEngineListener> = new Set();

  constructor() {
    // Automatically trigger sync when connectivity is restored
    networkService.setOnOnlineCallback(() => {
      console.log('[SyncEngine] Network restored callback triggered');
      this.triggerSync();
    });
  }

  get isSyncing(): boolean {
    return this._isSyncing;
  }

  get lastSyncedAt(): string | null {
    return this._lastSyncedAt;
  }

  get lastError(): string | null {
    return this._lastError;
  }

  subscribe(listener: SyncEngineListener): () => void {
    this.listeners.add(listener);
    // emit current state
    this.emitState();
    return () => this.listeners.delete(listener);
  }

  private emitState() {
    syncQueueRepository.getPendingCount().then((pendingCount) => {
      this.listeners.forEach((l) =>
        l({
          isSyncing: this._isSyncing,
          pendingCount,
          lastSyncedAt: this._lastSyncedAt,
          error: this._lastError,
        })
      );
    });
  }

  /**
   * Main sync trigger.
   * Flushes local SQLite sync_queue to Firebase (Firestore & Storage),
   * and refreshes remote data into local SQLite cache.
   */
  async triggerSync(): Promise<{ success: boolean; syncedCount: number; failedCount: number }> {
    if (this._isSyncing) {
      console.log('[SyncEngine] Sync is already running. Skipping.');
      const pendingCount = await syncQueueRepository.getPendingCount();
      return { success: false, syncedCount: 0, failedCount: 0 };
    }

    if (!networkService.isOnline()) {
      console.log('[SyncEngine] Device is offline. Cannot sync right now.');
      this._lastError = 'डिवाइस ऑफलाइन है (Device is offline)';
      this.emitState();
      return { success: false, syncedCount: 0, failedCount: 0 };
    }

    this._isSyncing = true;
    this._lastError = null;
    this.emitState();

    let syncedCount = 0;
    let failedCount = 0;

    try {
      const pendingOps = await syncQueueRepository.getPendingOperations();
      console.log(`[SyncEngine] Found ${pendingOps.length} pending operations to sync.`);

      for (const op of pendingOps) {
        // Double check network connectivity before each op
        if (!networkService.isOnline()) {
          console.log('[SyncEngine] Network dropped during sync queue processing. Halting safely.');
          break;
        }

        try {
          await syncQueueRepository.updateOperationStatus(op.id, 'syncing');
          await this.processOperation(op);
          await syncQueueRepository.removeCompletedOperation(op.id);
          syncedCount++;
        } catch (opError: any) {
          console.error(`[SyncEngine] Failed to sync operation ${op.id} (${op.entityType}):`, opError);
          // NO DATA LOSS: Record remains in SQLite and stays in queue marked as failed
          await syncQueueRepository.incrementRetry(
            op.id,
            opError?.message || 'Synchronization request failed'
          );
          failedCount++;
        }
      }

      // Refresh remote data into SQLite cache for offline reads
      await this.pullRemoteData();

      this._lastSyncedAt = new Date().toISOString();
      if (failedCount > 0) {
        this._lastError = `${failedCount} ऑपरेशन्स सिंक नहीं हो सके (Will retry)`;
      } else {
        this._lastError = null;
      }
    } catch (globalError: any) {
      console.error('[SyncEngine] Global sync error:', globalError);
      this._lastError = globalError?.message || 'Sync failed';
    } finally {
      this._isSyncing = false;
      this.emitState();
    }

    return {
      success: failedCount === 0,
      syncedCount,
      failedCount,
    };
  }

  /**
   * Process a single mutation operation from the sync queue.
   */
  private async processOperation(op: SyncQueueItem): Promise<void> {
    const payload = typeof op.payload === 'string' ? JSON.parse(op.payload) : op.payload;

    switch (op.entityType) {
      case 'material_lot': {
        const lot: MaterialLot = payload;
        // Step 1: Upload photos to Firebase Storage if they are local file URIs
        if (lot.photos && lot.photos.length > 0) {
          try {
            const uploadedUrls = await storageService.uploadLotPhotos(lot.localId, lot.photos);
            lot.photos = uploadedUrls;
            lot.photoUrls = uploadedUrls;
          } catch (storageErr) {
            console.warn('[SyncEngine] Photo upload failed, proceeding with local paths:', storageErr);
          }
        }

        // Step 2: Push lot document to Cloud Firestore
        const remoteDocId = await firestoreService.saveLotDoc(lot);

        // Step 3: Update SQLite local record to 'synced' with the remote doc ID
        await lotRepository.updateLotSyncStatus(lot.localId, 'synced', remoteDocId);
        break;
      }

      case 'user': {
        const user: User = payload;
        await firestoreService.saveUserDoc(user);
        await userRepository.saveUser({ ...user, syncStatus: 'synced' });
        break;
      }

      case 'offer': {
        const offer: Offer = payload;
        const remoteOfferId = await firestoreService.saveOfferDoc(offer);
        const localId = offer.localId || offer.id;
        await offerRepository.updateOfferSyncStatus(localId, 'synced', remoteOfferId);
        break;
      }

      case 'transaction': {
        const tx: Transaction = payload;
        const remoteTxId = await firestoreService.saveTransactionDoc(tx);
        const localId = tx.localId || tx.id;
        await transactionRepository.updateTransactionSyncStatus(localId, 'synced', remoteTxId);
        break;
      }

      default:
        console.warn(`[SyncEngine] Unrecognized entityType: ${op.entityType}`);
    }
  }

  /**
   * Pulls fresh records from Firestore into SQLite cache for offline read capability.
   */
  private async pullRemoteData(): Promise<void> {
    try {
      const currentUser = await userRepository.getCurrentUser();
      if (!currentUser) return;

      if (currentUser.role === 'collector') {
        const remoteLots = await firestoreService.getLotsByCollector(currentUser.id);
        if (remoteLots && remoteLots.length > 0) {
          await lotRepository.saveLotsFromRemote(remoteLots);
        }
      } else {
        const availableLots = await firestoreService.getAvailableLots();
        if (availableLots && availableLots.length > 0) {
          await lotRepository.saveLotsFromRemote(availableLots);
        }
      }
    } catch (e) {
      console.warn('[SyncEngine] Pull remote data warning:', e);
    }
  }
}

export const syncEngine = new SyncEngine();
