import {
  MaterialLot,
  Offer,
  Deal,
  HandoverRecord,
  Transaction,
  LotStatus,
  PaymentMethod,
} from '../../types';
import { lotRepository } from '../sqlite/repositories/lotRepository';
import { offerRepository } from '../sqlite/repositories/offerRepository';
import { dealRepository } from '../sqlite/repositories/dealRepository';
import { handoverRepository } from '../sqlite/repositories/handoverRepository';
import { transactionRepository } from '../sqlite/repositories/transactionRepository';
import { syncQueueRepository } from '../sqlite/repositories/syncQueueRepository';
import { syncEngine } from '../sync/syncEngine';
import { networkService } from '../connectivity/networkService';
import { traceabilityService } from '../traceability/traceabilityService';
import { traceabilityRepository } from '../sqlite/repositories/traceabilityRepository';

export const dealFlowService = {
  /**
   * Creates a new scrap lot locally, enqueues sync mutation, and syncs if online.
   */
  async createScrapLot(params: {
    collectorId: string;
    categoryId: any;
    weightKg: number;
    photos: string[];
    pickupOption?: any;
    locationCity?: string;
    locationArea?: string;
  }): Promise<MaterialLot> {
    if (params.weightKg <= 0) {
      throw new Error('वजन 0 से अधिक होना चाहिए (Weight must be greater than 0)');
    }
    if (!params.categoryId) {
      throw new Error('सामग्री का चयन आवश्यक है (Material category is required)');
    }

    const localId = `LOT-${Date.now()}`;
    const now = new Date().toISOString();

    const lot: MaterialLot = {
      id: localId,
      localId,
      lotNumber: `LOT-${Date.now().toString().slice(-6)}`,
      collectorId: params.collectorId,
      categoryId: params.categoryId,
      weightKg: params.weightKg,
      photos: params.photos,
      locationCity: params.locationCity || 'पुणे',
      locationArea: params.locationArea || 'महाराष्ट्र',
      pickupOption: params.pickupOption || 'collector_drop',
      status: 'published', // Published and ready for recycler matching & offers
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    // 1. Save to SQLite
    await lotRepository.createLot(lot);

    // 2. Queue sync operation
    await syncQueueRepository.enqueueOperation({
      entityType: 'material_lot',
      localId,
      operationType: 'CREATE',
      payload: lot,
    });

    // 2b. Initialize digital traceability chain & immutable audit event
    try {
      await traceabilityService.initializeLotTraceability({
        lot,
        collectorId: params.collectorId,
        location: params.locationCity ? { city: params.locationCity, area: params.locationArea } : undefined,
      });
    } catch (traceErr) {
      console.warn('[DealFlow] Traceability init error on lot creation:', traceErr);
    }

    // 3. Trigger sync if online
    if (networkService.isOnline()) {
      syncEngine.triggerSync().catch((e) => console.warn('[DealFlow] Sync error on lot creation:', e));
    }

    return lot;
  },

  /**
   * Recycler submits an offer on an available lot.
   */
  async submitRecyclerOffer(params: {
    lotId: string;
    recyclerId: string;
    recyclerName?: string;
    ratePerKg: number;
    totalAmount?: number;
    pickupOption?: any;
    comments?: string;
  }): Promise<Offer> {
    if (params.ratePerKg <= 0) {
      throw new Error('प्रस्तावित दर 0 से अधिक होनी चाहिए (Rate must be greater than 0)');
    }

    const lot = await lotRepository.getLotById(params.lotId);
    if (!lot) {
      throw new Error('लॉट नहीं मिला (Lot not found)');
    }

    const validLotStatuses: LotStatus[] = ['created', 'ready', 'published', 'matching', 'offered', 'offer_received'];
    if (!validLotStatuses.includes(lot.status)) {
      throw new Error(`इस लॉट पर ऑफर स्वीकार्य नहीं है (Lot is in ${lot.status} status)`);
    }

    const localId = `OFFER-${Date.now()}`;
    const now = new Date().toISOString();
    const calculatedTotal = params.totalAmount || Math.round(params.ratePerKg * lot.weightKg);

    const offer: Offer = {
      id: localId,
      localId,
      lotId: params.lotId,
      collectorId: lot.collectorId,
      materialCategoryId: lot.categoryId,
      weightKg: lot.weightKg,
      recyclerId: params.recyclerId,
      recyclerName: params.recyclerName || 'Authorized Recycler',
      ratePerKg: params.ratePerKg,
      totalAmount: calculatedTotal,
      pickupOption: params.pickupOption || lot.pickupOption || 'collector_drop',
      comments: params.comments,
      status: 'pending',
      timeline: [
        {
          step: 'offer_sent',
          timestamp: now,
          actorRole: 'recycler',
          ratePerKg: params.ratePerKg,
          totalAmount: calculatedTotal,
          note: params.comments,
        },
      ],
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    // 1. Save offer to SQLite
    await offerRepository.createOffer(offer);

    // 2. Update lot status to 'offer_received'
    await lotRepository.updateLot({
      localId: lot.localId,
      status: 'offer_received',
      updatedAt: now,
    });

    // 3. Queue sync operations
    await syncQueueRepository.enqueueOperation({
      entityType: 'offer',
      localId,
      operationType: 'CREATE',
      payload: offer,
    });

    await syncQueueRepository.enqueueOperation({
      entityType: 'material_lot',
      localId: lot.localId,
      operationType: 'UPDATE',
      payload: { ...lot, status: 'offer_received', updatedAt: now },
    });

    // 4. Send real notification to Collector
    try {
      const { notificationService } = await import('../notification/notificationService');
      await notificationService.sendNotification({
        userId: lot.collectorId,
        type: 'new_offer',
        title: 'नया ऑफर प्राप्त हुआ (New Offer Received)',
        body: `${offer.recyclerName} ने ₹${offer.ratePerKg}/किग्रा (कुल ₹${offer.totalAmount}) का ऑफर दिया है।`,
        entityType: 'offer',
        entityId: localId,
      });
    } catch (notifErr) {
      console.warn('[DealFlow] Notification error on submit offer:', notifErr);
    }

    // 5. Trigger sync if online
    if (networkService.isOnline()) {
      syncEngine.triggerSync().catch((e) => console.warn('[DealFlow] Sync error on submit offer:', e));
    }

    return offer;
  },

  /**
   * Collector accepts an offer.
   * Central invariant enforcement:
   * - Prevents duplicate deals for the same lot.
   * - Creates Deal record.
   * - Marks accepted offer as 'accepted'.
   * - Automatically marks other pending offers as 'rejected'.
   * - Creates HandoverRecord in 'pending' state.
   * - Updates lot status to 'deal_created'.
   */
  async acceptOffer(lotId: string, offerId: string, collectorId: string): Promise<Deal> {
    const lot = await lotRepository.getLotById(lotId);
    if (!lot) {
      throw new Error('लॉट नहीं मिला (Lot not found)');
    }

    // Safety check 1: Prevent duplicate deal creation
    const existingDeal = await dealRepository.getDealByLotId(lotId);
    if (existingDeal && existingDeal.status !== 'cancelled') {
      throw new Error('इस लॉट के लिए पहले से एक सौदा बन चुका है (A deal already exists for this lot)');
    }

    // Safety check 2: Verify lot status
    const acceptableStatuses: LotStatus[] = ['published', 'matching', 'offered', 'offer_received', 'created', 'ready'];
    if (!acceptableStatuses.includes(lot.status)) {
      throw new Error(`वर्तमान स्थिति में ऑफर स्वीकार नहीं किया जा सकता (Cannot accept offer for lot in status: ${lot.status})`);
    }

    // Retrieve offers for this lot
    const offers = await offerRepository.getOffersForLot(lotId);
    const selectedOffer = offers.find((o) => o.localId === offerId || o.id === offerId || o.remoteId === offerId);
    if (!selectedOffer) {
      throw new Error('चुना गया ऑफर नहीं मिला (Selected offer not found)');
    }

    if (selectedOffer.status === 'rejected' || selectedOffer.status === 'expired' || selectedOffer.status === 'cancelled') {
      throw new Error(`यह ऑफर ${selectedOffer.status} हो चुका है (Offer is already ${selectedOffer.status})`);
    }

    const now = new Date().toISOString();
    const dealId = `DEAL-${Date.now()}`;

    // 1. Create Deal record
    const deal: Deal = {
      id: dealId,
      localId: dealId,
      lotId: lot.localId,
      collectorId: collectorId || lot.collectorId,
      recyclerId: selectedOffer.recyclerId,
      offerId: selectedOffer.localId || selectedOffer.id,
      materialCategoryId: lot.categoryId,
      materialName: lot.categoryId?.toUpperCase() || 'SCRAP',
      agreedRatePerKg: selectedOffer.ratePerKg,
      agreedTotalAmount: selectedOffer.totalAmount,
      agreedWeightKg: lot.weightKg,
      status: 'handover_pending',
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    };
    await dealRepository.createDeal(deal);

    // 2. Create initial HandoverRecord linked to this deal
    const handoverId = `HO-${Date.now()}`;
    const handover: HandoverRecord = {
      id: handoverId,
      localId: handoverId,
      dealId,
      lotId: lot.localId,
      collectorId: deal.collectorId,
      recyclerId: deal.recyclerId,
      actualWeightKg: lot.weightKg,
      collectorConfirmed: false,
      recyclerConfirmed: false,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    };
    await handoverRepository.createHandover(handover);

    // 3. Mark accepted offer as 'accepted'
    await offerRepository.updateOfferStatus(selectedOffer.localId || selectedOffer.id, 'accepted');

    // 4. Reject other competing offers for this lot safely
    const rejectedOfferIds = await offerRepository.rejectOtherOffersForLot(
      lot.localId,
      selectedOffer.localId || selectedOffer.id
    );

    // 5. Update lot status to 'deal_created' / 'handover_pending'
    const updatedLot: MaterialLot = {
      ...lot,
      status: 'deal_created',
      selectedRecyclerId: selectedOffer.recyclerId,
      agreedRatePerKg: selectedOffer.ratePerKg,
      agreedTotalAmount: selectedOffer.totalAmount,
      dealId,
      acceptedOfferId: selectedOffer.localId || selectedOffer.id,
      updatedAt: now,
    };
    await lotRepository.updateLot(updatedLot);

    // 6. Enqueue all mutations in sync queue
    await syncQueueRepository.enqueueOperation({
      entityType: 'deal',
      localId: dealId,
      operationType: 'CREATE',
      payload: deal,
    });

    await syncQueueRepository.enqueueOperation({
      entityType: 'handover',
      localId: handoverId,
      operationType: 'CREATE',
      payload: handover,
    });

    await syncQueueRepository.enqueueOperation({
      entityType: 'offer',
      localId: selectedOffer.localId || selectedOffer.id,
      operationType: 'UPDATE',
      payload: { ...selectedOffer, status: 'accepted', updatedAt: now },
    });

    for (const rejId of rejectedOfferIds) {
      await syncQueueRepository.enqueueOperation({
        entityType: 'offer',
        localId: rejId,
        operationType: 'UPDATE',
        payload: { id: rejId, status: 'rejected', updatedAt: now },
      });
    }

    await syncQueueRepository.enqueueOperation({
      entityType: 'material_lot',
      localId: lot.localId,
      operationType: 'UPDATE',
      payload: updatedLot,
    });

    // 6b. Update Digital Traceability chain to deal_confirmed / handover_pending
    try {
      await traceabilityService.onDealConfirmed({
        lotId: lot.localId,
        deal,
        actorId: collectorId || lot.collectorId,
      });
    } catch (traceErr) {
      console.warn('[DealFlow] Traceability deal confirm error:', traceErr);
    }

    // 7. Send real notification to Recycler
    try {
      const { notificationService } = await import('../notification/notificationService');
      await notificationService.sendNotification({
        userId: selectedOffer.recyclerId,
        type: 'offer_accepted',
        title: 'ऑफर स्वीकार किया गया (Offer Accepted)',
        body: `कलेक्टर ने आपका ऑफर स्वीकार कर लिया है। सौदा #${dealId.slice(-6)} बन गया है।`,
        entityType: 'deal',
        entityId: dealId,
      });
    } catch (notifErr) {
      console.warn('[DealFlow] Notification error on accept offer:', notifErr);
    }

    // 8. Trigger sync if online
    if (networkService.isOnline()) {
      syncEngine.triggerSync().catch((e) => console.warn('[DealFlow] Sync error on accept offer:', e));
    }

    return deal;
  },

  /**
   * Rejects an offer.
   */
  async rejectOffer(offerId: string): Promise<void> {
    const now = new Date().toISOString();
    await offerRepository.updateOfferStatus(offerId, 'rejected');

    await syncQueueRepository.enqueueOperation({
      entityType: 'offer',
      localId: offerId,
      operationType: 'UPDATE',
      payload: { id: offerId, status: 'rejected', updatedAt: now },
    });

    if (networkService.isOnline()) {
      syncEngine.triggerSync().catch((e) => console.warn('[DealFlow] Sync error on reject offer:', e));
    }
  },

  /**
   * Collector confirms handover of scrap.
   * If recycler has already confirmed, automatically completes the deal & generates a completed Transaction!
   */
  async confirmCollectorHandover(params: {
    dealId: string;
    actualWeightKg?: number;
    photoUri?: string;
    notes?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<{ handover: HandoverRecord; deal: Deal; transaction?: Transaction }> {
    const deal = await dealRepository.getDealById(params.dealId);
    if (!deal) {
      throw new Error('सौदा नहीं मिला (Deal not found)');
    }

    const handover = await handoverRepository.getHandoverByDealId(params.dealId);
    if (!handover) {
      throw new Error('हैंडओवर रिकॉर्ड नहीं मिला (Handover record not found)');
    }

    const now = new Date().toISOString();
    const confirmedWeight = params.actualWeightKg || handover.actualWeightKg || deal.agreedWeightKg;

    // 1. Confirm collector side
    await handoverRepository.confirmCollector(
      handover.localId,
      confirmedWeight,
      params.photoUri,
      params.notes,
      params.latitude,
      params.longitude
    );

    // Refresh handover state
    const updatedHandover = (await handoverRepository.getHandoverById(handover.localId))!;

    // 1b. Update digital traceability record & emit audit event
    try {
      await traceabilityService.recordHandoverConfirmation({
        dealId: deal.localId,
        handoverId: handover.localId,
        lotId: deal.lotId,
        confirmedBy: deal.collectorId,
        userType: 'collector',
        finalWeight: confirmedWeight,
        photoUri: params.photoUri,
        notes: params.notes,
        location: params.latitude ? { latitude: params.latitude, longitude: params.longitude } : undefined,
      });
    } catch (traceErr) {
      console.warn('[DealFlow] Traceability collector handover error:', traceErr);
    }

    // 2. Check if both parties confirmed
    let createdTx: Transaction | undefined;
    if (updatedHandover.collectorConfirmed && updatedHandover.recyclerConfirmed) {
      createdTx = await this.finalizeCompletedHandover(deal, updatedHandover, confirmedWeight);
    } else {
      // Just enqueue partial handover confirmation
      await syncQueueRepository.enqueueOperation({
        entityType: 'handover',
        localId: updatedHandover.localId,
        operationType: 'UPDATE',
        payload: updatedHandover,
      });
    }

    if (networkService.isOnline()) {
      syncEngine.triggerSync().catch((e) => console.warn('[DealFlow] Sync error on collector handover:', e));
    }

    const freshDeal = (await dealRepository.getDealById(params.dealId))!;
    return { handover: updatedHandover, deal: freshDeal, transaction: createdTx };
  },

  /**
   * Recycler confirms receipt of scrap.
   * If collector has already confirmed, automatically completes the deal & generates a completed Transaction!
   */
  async confirmRecyclerHandover(params: {
    dealId: string;
    actualWeightKg?: number;
    photoUri?: string;
    notes?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<{ handover: HandoverRecord; deal: Deal; transaction?: Transaction }> {
    const deal = await dealRepository.getDealById(params.dealId);
    if (!deal) {
      throw new Error('सौदा नहीं मिला (Deal not found)');
    }

    const handover = await handoverRepository.getHandoverByDealId(params.dealId);
    if (!handover) {
      throw new Error('हैंडओवर रिकॉर्ड नहीं मिला (Handover record not found)');
    }

    const confirmedWeight = params.actualWeightKg || handover.actualWeightKg || deal.agreedWeightKg;

    // 1. Confirm recycler side
    await handoverRepository.confirmRecycler(
      handover.localId,
      confirmedWeight,
      params.photoUri,
      params.notes,
      params.latitude,
      params.longitude
    );

    // Refresh handover state
    const updatedHandover = (await handoverRepository.getHandoverById(handover.localId))!;

    // 1b. Update digital traceability record & emit audit event
    try {
      await traceabilityService.recordHandoverConfirmation({
        dealId: deal.localId,
        handoverId: handover.localId,
        lotId: deal.lotId,
        confirmedBy: deal.recyclerId,
        userType: 'recycler',
        finalWeight: confirmedWeight,
        photoUri: params.photoUri,
        notes: params.notes,
        location: params.latitude ? { latitude: params.latitude, longitude: params.longitude } : undefined,
      });
    } catch (traceErr) {
      console.warn('[DealFlow] Traceability recycler handover error:', traceErr);
    }

    // 2. Check if both parties confirmed
    let createdTx: Transaction | undefined;
    if (updatedHandover.collectorConfirmed && updatedHandover.recyclerConfirmed) {
      createdTx = await this.finalizeCompletedHandover(deal, updatedHandover, confirmedWeight);
    } else {
      await syncQueueRepository.enqueueOperation({
        entityType: 'handover',
        localId: updatedHandover.localId,
        operationType: 'UPDATE',
        payload: updatedHandover,
      });
    }

    if (networkService.isOnline()) {
      syncEngine.triggerSync().catch((e) => console.warn('[DealFlow] Sync error on recycler handover:', e));
    }

    const freshDeal = (await dealRepository.getDealById(params.dealId))!;
    return { handover: updatedHandover, deal: freshDeal, transaction: createdTx };
  },

  /**
   * Finalizes handover and transitions Deal & Lot to 'payment_pending'.
   * Initializes Transaction in 'payment_pending' state.
   * Transaction is ONLY settled as completed after explicit payment confirmation.
   */
  async finalizeCompletedHandover(
    deal: Deal,
    handover: HandoverRecord,
    finalWeight: number
  ): Promise<Transaction> {
    const now = new Date().toISOString();
    const finalTotal = Math.round(finalWeight * deal.agreedRatePerKg);

    // 1. Complete Handover
    await handoverRepository.updateHandoverStatus(handover.localId, 'completed');

    // 2. Set Deal to payment_pending
    await dealRepository.updateDealStatus(deal.localId, 'payment_pending');

    // 3. Set Lot to payment_pending
    await lotRepository.updateLot({
      localId: deal.lotId,
      status: 'payment_pending',
      weightKg: finalWeight,
      agreedTotalAmount: finalTotal,
      updatedAt: now,
    });

    // 4. Fetch linked Traceability Record for reference
    const traceRecord = await traceabilityRepository.getRecordByLotId(deal.lotId);

    // 5. Create Transaction with payment_pending status and traceability references
    const txId = `TX-${Date.now()}`;
    const tx: Transaction = {
      id: txId,
      localId: txId,
      transactionId: txId,
      transactionNumber: `TRX-${Date.now().toString().slice(-6)}`,
      dealId: deal.localId || deal.id,
      lotId: deal.lotId,
      collectorId: deal.collectorId,
      recyclerId: deal.recyclerId,
      materialCategory: deal.materialCategoryId || 'mixed',
      materialName: deal.materialName,
      finalWeight,
      weightKg: finalWeight,
      agreedPrice: deal.agreedRatePerKg,
      ratePerKg: deal.agreedRatePerKg,
      totalAmount: finalTotal,
      paymentMethod: 'cash', // Default recorded method until chosen
      paymentStatus: 'pending',
      handoverStatus: 'completed',
      transactionStatus: 'payment_pending',
      traceabilityId: traceRecord?.traceabilityId,
      traceabilityReference: traceRecord?.traceabilityId,
      handoverReference: traceRecord?.handoverReference,
      date: now,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    };
    await transactionRepository.createTransaction(tx);

    // 5. Enqueue operations in sync queue
    await syncQueueRepository.enqueueOperation({
      entityType: 'handover',
      localId: handover.localId,
      operationType: 'UPDATE',
      payload: { ...handover, status: 'completed', completedAt: now, updatedAt: now },
    });

    await syncQueueRepository.enqueueOperation({
      entityType: 'deal',
      localId: deal.localId,
      operationType: 'UPDATE',
      payload: { ...deal, status: 'payment_pending', updatedAt: now },
    });

    await syncQueueRepository.enqueueOperation({
      entityType: 'material_lot',
      localId: deal.lotId,
      operationType: 'UPDATE',
      payload: { localId: deal.lotId, status: 'payment_pending', updatedAt: now },
    });

    await syncQueueRepository.enqueueOperation({
      entityType: 'transaction',
      localId: txId,
      operationType: 'CREATE',
      payload: tx,
    });

    // 6. Send real notifications to Collector and Recycler
    try {
      const { notificationService } = await import('../notification/notificationService');
      await notificationService.sendNotification({
        userId: deal.collectorId,
        type: 'handover_confirmed',
        title: 'हैंडओवर पूरा हुआ (Handover Confirmed)',
        body: `सामग्री का हैंडओवर पूरा हुआ। ₹${finalTotal} का भुगतान लंबित है।`,
        entityType: 'deal',
        entityId: deal.localId || deal.id,
      });

      await notificationService.sendNotification({
        userId: deal.recyclerId,
        type: 'handover_confirmed',
        title: 'हैंडओवर पूरा हुआ (Handover Confirmed)',
        body: `हैंडओवर पूरा हुआ। कृपया ₹${finalTotal} का भुगतान करें।`,
        entityType: 'deal',
        entityId: deal.localId || deal.id,
      });
    } catch (notifErr) {
      console.warn('[DealFlow] Notification error on handover completion:', notifErr);
    }

    return tx;
  },

  /**
   * Records payment method (cash / upi) on transaction.
   * NOTE: Does NOT pretend a UPI gateway verified payment; records chosen method honestly.
   */
  async recordPayment(lotOrTxId: string, paymentMethod: PaymentMethod): Promise<void> {
    const tx = await transactionRepository.getTransactionByLotId(lotOrTxId);
    if (!tx) {
      console.warn('[DealFlow] Transaction not found for payment recording:', lotOrTxId);
      return;
    }

    const now = new Date().toISOString();
    const txKey = tx.localId || tx.id || tx.transactionId || '';
    await transactionRepository.updatePaymentStatus(txKey, 'completed', paymentMethod);

    await syncQueueRepository.enqueueOperation({
      entityType: 'transaction',
      localId: txKey,
      operationType: 'UPDATE',
      payload: {
        ...tx,
        paymentMethod,
        paymentStatus: 'completed',
        updatedAt: now,
      },
    });

    if (networkService.isOnline()) {
      syncEngine.triggerSync().catch((e) => console.warn('[DealFlow] Sync error on record payment:', e));
    }
  },
};
