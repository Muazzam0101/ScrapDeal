import { syncQueueRepository } from '../sqlite/repositories/syncQueueRepository';
import { lotRepository } from '../sqlite/repositories/lotRepository';
import { userRepository } from '../sqlite/repositories/userRepository';
import { offerRepository } from '../sqlite/repositories/offerRepository';
import { transactionRepository } from '../sqlite/repositories/transactionRepository';
import { dealRepository } from '../sqlite/repositories/dealRepository';
import { handoverRepository } from '../sqlite/repositories/handoverRepository';
import { priceRepository } from '../sqlite/repositories/priceRepository';
import { aiRepository } from '../sqlite/repositories/aiRepository';
import { paymentRepository } from '../sqlite/repositories/paymentRepository';
import { notificationRepository } from '../sqlite/repositories/notificationRepository';
import { deviceTokenRepository } from '../sqlite/repositories/deviceTokenRepository';
import { traceabilityRepository } from '../sqlite/repositories/traceabilityRepository';
import { fieldFeedbackRepository } from '../sqlite/repositories/fieldFeedbackRepository';
import { safetyRepository } from '../sqlite/repositories/safetyRepository';
import { firestoreService } from '../firebase/firestore';
import { storageService } from '../firebase/storage';
import { networkService } from '../connectivity/networkService';
import {
  SyncQueueItem,
  MaterialLot,
  User,
  Offer,
  Transaction,
  MaterialPrice,
  Payment,
  AppNotification,
  DeviceToken,
} from '../../types';

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
          const isPermError =
            opError?.code === 'permission-denied' ||
            opError?.code === 'storage/unauthorized' ||
            opError?.message?.includes('Missing or insufficient permissions') ||
            opError?.message?.includes('permission-denied') ||
            opError?.message?.includes('storage/unauthorized') ||
            opError?.message?.includes('User does not have permission');

          if (isPermError) {
            console.info(
              `[SyncEngine] Cloud sync deferred for ${op.id} (${op.entityType}): Firebase permissions/rules required. Data is safely persisted in local SQLite.`
            );
            await syncQueueRepository.incrementRetry(
              op.id,
              'Firebase cloud permissions required'
            );
            failedCount++;
            // Gracefully halt the rest of the cloud batch to avoid flooding identical permission errors
            console.log(
              '[SyncEngine] Deferring remaining cloud mutations until Firebase rules are deployed. Local SQLite remains active source of truth.'
            );
            break;
          } else {
            console.error(`[SyncEngine] Failed to sync operation ${op.id} (${op.entityType}):`, opError);
            // NO DATA LOSS: Record remains in SQLite and stays in queue marked as failed
            await syncQueueRepository.incrementRetry(
              op.id,
              opError?.message || 'Synchronization request failed'
            );
            failedCount++;
          }
        }
      }

      // Refresh remote data into SQLite cache for offline reads
      await this.pullRemoteData();

      this._lastSyncedAt = new Date().toISOString();
      if (failedCount > 0) {
        this._lastError = `${failedCount} ऑपरेशन्स सिंक नहीं हो सके (Local SQLite active)`;
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
        const localId = tx.localId || tx.id || tx.transactionId || '';
        await transactionRepository.updateTransactionSyncStatus(localId, 'synced', remoteTxId);
        break;
      }

      case 'deal': {
        const deal = payload;
        const remoteDealId = await firestoreService.saveDealDoc(deal);
        const localId = deal.localId || deal.id;
        await dealRepository.updateDealSyncStatus(localId, 'synced', remoteDealId);
        break;
      }

      case 'handover': {
        const handover = payload;
        // If handover has a local photo, upload to storage
        if (handover.photoUri && !handover.photoUri.startsWith('http')) {
          try {
            const uploadedUrl = await storageService.uploadPhoto(
              handover.photoUri,
              `handovers/${handover.dealId}/handover_${Date.now()}.jpg`
            );
            handover.photoUrl = uploadedUrl;
          } catch (storageErr) {
            console.warn('[SyncEngine] Handover photo upload failed, keeping local uri:', storageErr);
          }
        }
        const remoteHoId = await firestoreService.saveHandoverDoc(handover);
        const localId = handover.localId || handover.id;
        await handoverRepository.updateHandoverSyncStatus(localId, 'synced', remoteHoId);
        break;
      }

      case 'material_price': {
        const price = payload;
        const remotePriceId = await firestoreService.savePriceDoc(price);
        const localId = price.localId || price.id;
        await priceRepository.updatePrice({ localId, syncStatus: 'synced' });
        break;
      }

      case 'ai_prediction': {
        const pred = payload;
        const remotePredId = await firestoreService.saveAIPredictionDoc(pred);
        const localId = pred.localId || pred.id;
        await aiRepository.updateSyncStatus('ai_predictions', localId, 'synced', remotePredId);
        break;
      }

      case 'ai_price_estimate': {
        const est = payload;
        const remoteEstId = await firestoreService.saveAIPriceEstimateDoc(est);
        const localId = est.localId || est.id;
        await aiRepository.updateSyncStatus('ai_price_estimates', localId, 'synced', remoteEstId);
        break;
      }

      case 'ai_anomaly_event': {
        const evt = payload;
        const remoteEvtId = await firestoreService.saveAIAnomalyEventDoc(evt);
        const localId = evt.localId || evt.id;
        await aiRepository.updateSyncStatus('ai_anomaly_events', localId, 'synced', remoteEvtId);
        break;
      }

      case 'payment': {
        const payment: Payment = payload;
        const remotePaymentId = await firestoreService.savePaymentDoc(payment);
        const localId = payment.paymentId || payment.id || '';
        await paymentRepository.updatePaymentSyncStatus(localId, 'synced', remotePaymentId);
        break;
      }

      case 'notification': {
        const notif: AppNotification = payload;
        const remoteNotifId = await firestoreService.saveNotificationDoc(notif);
        const localId = notif.notificationId || notif.id || '';
        await notificationRepository.updateNotificationSyncStatus(localId, 'synced', remoteNotifId);
        break;
      }

      case 'device_token': {
        const token: DeviceToken = payload;
        await firestoreService.saveDeviceTokenDoc(token);
        break;
      }

      case 'traceability_record': {
        const record = payload;
        const remoteRecId = await firestoreService.saveTraceabilityDoc(record);
        await traceabilityRepository.updateRecord({
          traceabilityId: record.traceabilityId,
          syncStatus: 'synced',
          lastSyncedAt: new Date().toISOString(),
        });
        break;
      }

      case 'traceability_event': {
        const event = payload;
        await firestoreService.saveTraceabilityEventDoc(event);
        break;
      }

      case 'handover_confirmation': {
        const confirmation = payload;
        await firestoreService.saveHandoverConfirmationDoc(confirmation);
        break;
      }

      case 'handover_photo': {
        const photo = payload;
        if (photo.storageReference && !photo.storageReference.startsWith('http')) {
          try {
            const uploadedUrl = await storageService.uploadPhoto(
              photo.storageReference,
              `handovers/${photo.handoverId}/${photo.photoId}.jpg`
            );
            photo.storageReference = uploadedUrl;
          } catch (storageErr) {
            console.warn('[SyncEngine] Handover photo upload failed, keeping local uri:', storageErr);
          }
        }
        await firestoreService.saveHandoverPhotoDoc(photo);
        break;
      }

      case 'field_feedback': {
        const fb = payload;
        await firestoreService.saveFieldFeedbackDoc(fb);
        await fieldFeedbackRepository.updateSyncStatus(fb.id, 'synced');
        break;
      }

      case 'safety_guide': {
        const guide = payload;
        await safetyRepository.saveSafetyGuide(guide);
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

      // Pull fresh material prices for offline price board
      const remotePrices = await firestoreService.getAllPriceDocs();
      for (const p of remotePrices) {
        await priceRepository.createPrice({ ...p, syncStatus: 'synced' });
      }

      // Pull user transactions
      const remoteTransactions = await firestoreService.getTransactionsForUser(
        currentUser.id,
        currentUser.role as 'collector' | 'recycler'
      );
      if (remoteTransactions && remoteTransactions.length > 0) {
        await transactionRepository.saveTransactionsFromRemote(remoteTransactions);
      }

      // Pull user payments
      const remotePayments = await firestoreService.getPaymentsForUser(
        currentUser.id,
        currentUser.role as 'collector' | 'recycler'
      );
      if (remotePayments && remotePayments.length > 0) {
        await paymentRepository.savePaymentsFromRemote(remotePayments);
      }

      // Pull user notifications
      const remoteNotifications = await firestoreService.getNotificationsForUser(currentUser.id);
      if (remoteNotifications && remoteNotifications.length > 0) {
        await notificationRepository.saveNotificationsFromRemote(remoteNotifications);
      }

      // Pull updated safety guides from Cloud Firestore into SQLite cache if available
      const remoteSafetyGuides = await firestoreService.getSafetyGuidesDocs();
      if (remoteSafetyGuides && remoteSafetyGuides.length > 0) {
        for (const g of remoteSafetyGuides) {
          await safetyRepository.saveSafetyGuide(g);
        }
      }
    } catch (e: any) {
      if (e?.code === 'permission-denied' || e?.message?.includes('Missing or insufficient permissions')) {
        console.log('[SyncEngine] Cloud data pull requires Firebase rules/permissions; maintaining local SQLite cache.');
      } else {
        console.warn('[SyncEngine] Pull remote data warning:', e);
      }
    }
  }
}

export const syncEngine = new SyncEngine();
