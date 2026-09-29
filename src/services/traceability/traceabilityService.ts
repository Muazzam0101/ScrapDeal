import {
  TraceabilityRecord,
  TraceabilityEvent,
  TraceabilityStatus,
  HandoverConfirmation,
  HandoverPhotoRecord,
  PublicTraceabilityView,
  LocationData,
  MaterialLot,
  Deal,
  Transaction,
  Payment,
} from '../../types';
import { traceabilityRepository } from '../sqlite/repositories/traceabilityRepository';
import { referenceGenerator } from './referenceGenerator';
import { traceabilityStateMachine } from './stateMachine';
import { syncQueueRepository } from '../sqlite/repositories/syncQueueRepository';
import { networkService } from '../connectivity/networkService';
import { syncEngine } from '../sync/syncEngine';

class TraceabilityService {
  /**
   * Initializes a digital traceability chain for a newly created scrap lot.
   * Generates a collision-resistant SCRAP-2026-XXXXXXXX identifier and secure QR token.
   */
  async initializeLotTraceability(params: {
    lot: MaterialLot;
    collectorId: string;
    aiPredictedMaterial?: string;
    location?: LocationData;
  }): Promise<{ record: TraceabilityRecord; event: TraceabilityEvent }> {
    const { lot, collectorId, aiPredictedMaterial, location } = params;

    const traceabilityId = referenceGenerator.generateTraceabilityReference();
    const qrReferenceToken = referenceGenerator.generateVerificationToken();
    const now = new Date().toISOString();

    // Validate state machine start
    traceabilityStateMachine.assertValidTransition('created', 'collected');

    const record: TraceabilityRecord = {
      traceabilityId,
      lotId: lot.localId || lot.id,
      collectorId,
      materialCategory: lot.categoryId,
      initialMaterial: lot.categoryId,
      aiPredictedMaterial: aiPredictedMaterial || undefined,
      estimatedWeight: Number(lot.weightKg) || 0,
      collectionLocation: location || (lot.locationCity ? { city: lot.locationCity, area: lot.locationArea } : undefined),
      collectionTimestamp: lot.createdAt || now,
      status: 'collected',
      qrReferenceToken,
      collectorConfirmedHandover: false,
      recyclerConfirmedHandover: false,
      hasConflict: false,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    };

    // 1. Persist record locally
    await traceabilityRepository.createRecord(record);

    // 2. Emit immutable LOT_CREATED audit event
    const eventId = referenceGenerator.generateEventId();
    const event: TraceabilityEvent = {
      eventId,
      traceabilityId,
      lotId: record.lotId,
      eventType: 'LOT_CREATED',
      actorId: collectorId,
      actorType: 'collector',
      previousStatus: 'created',
      newStatus: 'collected',
      timestamp: now,
      location: record.collectionLocation,
      metadata: {
        material: lot.categoryId,
        estimatedWeight: lot.weightKg,
        aiPredictedMaterial,
      },
      syncStatus: 'pending',
      createdAt: now,
    };
    await traceabilityRepository.recordEvent(event);

    // 3. Enqueue for Cloud Sync
    await syncQueueRepository.enqueueOperation({
      entityType: 'traceability_record',
      localId: traceabilityId,
      operationType: 'CREATE',
      payload: record,
    });

    await syncQueueRepository.enqueueOperation({
      entityType: 'traceability_event',
      localId: eventId,
      operationType: 'CREATE',
      payload: event,
    });

    if (networkService.isOnline()) {
      syncEngine.triggerSync().catch((e) => console.warn('[TraceabilityService] Sync error on init:', e));
    }

    return { record, event };
  }

  /**
   * Updates traceability when an offer is created or a recycler is matched to a lot.
   */
  async onRecyclerMatched(params: {
    lotId: string;
    recyclerId: string;
    actorId?: string;
  }): Promise<{ record: TraceabilityRecord; event: TraceabilityEvent }> {
    const { lotId, recyclerId, actorId } = params;
    let record = await traceabilityRepository.getRecordByLotId(lotId);
    const now = new Date().toISOString();

    if (!record) {
      throw new Error(`Traceability record not found for lot ${lotId}`);
    }

    traceabilityStateMachine.assertValidTransition(record.status, 'matched');

    const updatedRecord: TraceabilityRecord = {
      ...record,
      recyclerId,
      status: 'matched',
      updatedAt: now,
      syncStatus: 'pending',
    };

    await traceabilityRepository.updateRecord(updatedRecord);

    const event: TraceabilityEvent = {
      eventId: referenceGenerator.generateEventId(),
      traceabilityId: record.traceabilityId,
      lotId,
      eventType: 'OFFER_CREATED',
      actorId: actorId || recyclerId,
      actorType: 'recycler',
      previousStatus: record.status,
      newStatus: 'matched',
      timestamp: now,
    };

    await traceabilityRepository.createEvent(event);

    return { record: updatedRecord, event };
  }

  /**
   * Updates traceability when an offer matches or deal is confirmed.
   */
  async onDealConfirmed(params: {
    lotId: string;
    deal: Deal;
    actorId: string;
  }): Promise<{ record: TraceabilityRecord; event: TraceabilityEvent }> {
    const { lotId, deal, actorId } = params;
    let record = await traceabilityRepository.getRecordByLotId(lotId);

    const now = new Date().toISOString();

    if (!record) {
      // Fallback self-healing: create baseline record if lot was initialized earlier
      const traceabilityId = referenceGenerator.generateTraceabilityReference();
      const qrReferenceToken = referenceGenerator.generateVerificationToken();
      record = await traceabilityRepository.createRecord({
        traceabilityId,
        lotId,
        collectorId: deal.collectorId,
        recyclerId: deal.recyclerId,
        materialCategory: deal.materialCategoryId,
        initialMaterial: deal.materialCategoryId,
        estimatedWeight: deal.agreedWeightKg,
        collectionTimestamp: deal.createdAt || now,
        status: 'collected',
        qrReferenceToken,
        collectorConfirmedHandover: false,
        recyclerConfirmedHandover: false,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'pending',
      });
    }

    // Validate state transition through state machine
    traceabilityStateMachine.assertValidTransition(record.status, 'deal_confirmed');
    traceabilityStateMachine.assertValidTransition('deal_confirmed', 'handover_pending');

    const handoverReference = referenceGenerator.generateHandoverReference();

    const updatedRecord: TraceabilityRecord = {
      ...record,
      dealId: deal.localId || deal.id,
      recyclerId: deal.recyclerId,
      agreedRatePerKg: deal.agreedRatePerKg,
      agreedTotalAmount: deal.agreedTotalAmount,
      handoverReference,
      status: 'handover_pending',
      updatedAt: now,
      syncStatus: 'pending',
    };

    await traceabilityRepository.createRecord(updatedRecord);

    // Emit DEAL_CONFIRMED audit event
    const eventId = referenceGenerator.generateEventId();
    const event: TraceabilityEvent = {
      eventId,
      traceabilityId: record.traceabilityId,
      lotId,
      dealId: deal.localId || deal.id,
      eventType: 'DEAL_CONFIRMED',
      actorId,
      actorType: actorId === deal.collectorId ? 'collector' : 'recycler',
      previousStatus: record.status,
      newStatus: 'handover_pending',
      timestamp: now,
      metadata: {
        dealId: deal.localId || deal.id,
        recyclerId: deal.recyclerId,
        agreedRate: deal.agreedRatePerKg,
        agreedTotal: deal.agreedTotalAmount,
        handoverReference,
      },
      syncStatus: 'pending',
      createdAt: now,
    };
    await traceabilityRepository.recordEvent(event);

    // Enqueue sync operations
    await syncQueueRepository.enqueueOperation({
      entityType: 'traceability_record',
      localId: record.traceabilityId,
      operationType: 'UPDATE',
      payload: updatedRecord,
    });

    await syncQueueRepository.enqueueOperation({
      entityType: 'traceability_event',
      localId: eventId,
      operationType: 'CREATE',
      payload: event,
    });

    if (networkService.isOnline()) {
      syncEngine.triggerSync().catch((e) => console.warn('[TraceabilityService] Sync error on deal confirm:', e));
    }

    return { record: updatedRecord, event };
  }

  /**
   * Records a party's handover confirmation, preserves both initial & final weights,
   * calculates weight differences, captures photos, and advances chain of custody.
   */
  async recordHandoverConfirmation(params: {
    dealId: string;
    handoverId: string;
    lotId: string;
    confirmedBy: string;
    userType: 'collector' | 'recycler';
    finalWeight: number;
    finalMaterial?: string;
    photoUri?: string;
    notes?: string;
    location?: LocationData;
  }): Promise<{
    record: TraceabilityRecord;
    isFullyConfirmed: boolean;
    confirmation: HandoverConfirmation;
  }> {
    const {
      dealId,
      handoverId,
      lotId,
      confirmedBy,
      userType,
      finalWeight,
      finalMaterial,
      photoUri,
      notes,
      location,
    } = params;

    let record = await traceabilityRepository.getRecordByLotId(lotId);
    const now = new Date().toISOString();

    if (!record) {
      record = await traceabilityRepository.createRecord({
        traceabilityId: referenceGenerator.generateTraceabilityReference(),
        lotId,
        dealId,
        handoverId,
        collectorId: userType === 'collector' ? confirmedBy : 'COLLECTOR-LOCAL',
        recyclerId: userType === 'recycler' ? confirmedBy : undefined,
        materialCategory: finalMaterial || 'mixed',
        initialMaterial: finalMaterial || 'mixed',
        estimatedWeight: finalWeight,
        collectionTimestamp: now,
        status: 'handover_pending',
        qrReferenceToken: referenceGenerator.generateVerificationToken(),
        collectorConfirmedHandover: false,
        recyclerConfirmedHandover: false,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'pending',
      });
    }

    // 1. Record two-party confirmation entity
    const confirmationId = `CONF-${Date.now()}-${userType.slice(0, 3).toUpperCase()}`;
    const confirmation: HandoverConfirmation = {
      confirmationId,
      handoverId,
      lotId,
      dealId,
      confirmedBy,
      userType,
      confirmationType: userType === 'collector' ? 'handover_dispatched' : 'handover_received',
      timestamp: now,
      location,
      weightConfirmed: finalWeight,
      notes,
      syncStatus: 'pending',
      createdAt: now,
    };
    await traceabilityRepository.recordHandoverConfirmation(confirmation);

    // 2. If photo provided, record handover photo metadata
    if (photoUri) {
      const photoId = `HPHOTO-${Date.now()}`;
      await traceabilityRepository.recordHandoverPhoto({
        photoId,
        lotId,
        handoverId,
        storageReference: photoUri,
        capturedAt: now,
        capturedBy: confirmedBy,
        photoType: 'at_handover',
        syncStatus: 'pending',
        createdAt: now,
      });

      await syncQueueRepository.enqueueOperation({
        entityType: 'handover_photo',
        localId: photoId,
        operationType: 'CREATE',
        payload: { photoId, lotId, handoverId, storageReference: photoUri, capturedAt: now, capturedBy: confirmedBy },
      });
    }

    // 3. Compute weight differences without touching original estimated weight
    const originalWeight = record.estimatedWeight;
    const weightDiff = Math.abs(originalWeight - finalWeight);
    const roundedDiff = Math.round(weightDiff * 100) / 100;
    const direction: 'loss' | 'gain' | 'exact' =
      finalWeight < originalWeight ? 'loss' : finalWeight > originalWeight ? 'gain' : 'exact';

    const collectorConfirmed = userType === 'collector' ? true : record.collectorConfirmedHandover;
    const recyclerConfirmed = userType === 'recycler' ? true : record.recyclerConfirmedHandover;
    const isFullyConfirmed = collectorConfirmed && recyclerConfirmed;

    // Check for offline conflict if both parties confirmed different weights (> 2.0 kg tolerance)
    let hasConflict = record.hasConflict || false;
    let conflictDetails = record.conflictDetails;
    if (userType === 'recycler' && record.finalWeight && Math.abs(record.finalWeight - finalWeight) > 2.0) {
      hasConflict = true;
      conflictDetails = `Weight discrepancy: Collector stated ${record.finalWeight}kg, Recycler verified ${finalWeight}kg. Confirmation needs review.`;
    }

    // Determine target status
    let nextStatus: TraceabilityStatus = record.status;
    if (isFullyConfirmed) {
      traceabilityStateMachine.assertValidTransition(record.status, 'handover_confirmed');
      traceabilityStateMachine.assertValidTransition('handover_confirmed', 'payment_pending');
      nextStatus = 'payment_pending';
    }

    const updatedRecord: TraceabilityRecord = {
      ...record,
      handoverId,
      finalWeight,
      weightDifference: roundedDiff,
      weightDifferenceDirection: direction,
      finalMaterial: finalMaterial || record.finalMaterial || record.initialMaterial,
      handoverLocation: location || record.handoverLocation,
      handoverTimestamp: now,
      collectorConfirmedHandover: collectorConfirmed,
      recyclerConfirmedHandover: recyclerConfirmed,
      status: nextStatus,
      hasConflict,
      conflictDetails,
      updatedAt: now,
      syncStatus: 'pending',
    };

    await traceabilityRepository.createRecord(updatedRecord);

    // 4. Record audit events
    // Weight confirmation event
    const weightEventId = referenceGenerator.generateEventId();
    await traceabilityRepository.recordEvent({
      eventId: weightEventId,
      traceabilityId: record.traceabilityId,
      lotId,
      dealId,
      handoverId,
      eventType: 'WEIGHT_CONFIRMED',
      actorId: confirmedBy,
      actorType: userType,
      previousStatus: record.status,
      newStatus: record.status,
      timestamp: now,
      metadata: {
        originalEstimatedWeight: originalWeight,
        finalVerifiedWeight: finalWeight,
        weightDifference: roundedDiff,
        direction,
      },
      syncStatus: 'pending',
      createdAt: now,
    });

    // If both confirmed, emit HANDOVER_CONFIRMED event
    if (isFullyConfirmed) {
      const hoEventId = referenceGenerator.generateEventId();
      await traceabilityRepository.recordEvent({
        eventId: hoEventId,
        traceabilityId: record.traceabilityId,
        lotId,
        dealId,
        handoverId,
        eventType: 'HANDOVER_CONFIRMED',
        actorId: confirmedBy,
        actorType: userType,
        previousStatus: 'handover_pending',
        newStatus: 'payment_pending',
        timestamp: now,
        location,
        metadata: {
          handoverReference: record.handoverReference,
          finalWeight,
          twoPartyMutualConfirmation: true,
        },
        syncStatus: 'pending',
        createdAt: now,
      });

      await syncQueueRepository.enqueueOperation({
        entityType: 'traceability_event',
        localId: hoEventId,
        operationType: 'CREATE',
        payload: { eventId: hoEventId, traceabilityId: record.traceabilityId, eventType: 'HANDOVER_CONFIRMED' },
      });
    }

    // 5. Enqueue sync operations
    await syncQueueRepository.enqueueOperation({
      entityType: 'handover_confirmation',
      localId: confirmationId,
      operationType: 'CREATE',
      payload: confirmation,
    });

    await syncQueueRepository.enqueueOperation({
      entityType: 'traceability_record',
      localId: record.traceabilityId,
      operationType: 'UPDATE',
      payload: updatedRecord,
    });

    if (networkService.isOnline()) {
      syncEngine.triggerSync().catch((e) => console.warn('[TraceabilityService] Sync error on handover:', e));
    }

    return { record: updatedRecord, isFullyConfirmed, confirmation };
  }

  /**
   * Finalizes traceability when payment and transaction settle as completed.
   */
  async onPaymentSettled(params: {
    lotId: string;
    transaction: Transaction;
    payment: Payment;
  }): Promise<TraceabilityRecord> {
    const { lotId, transaction, payment } = params;
    let record = await traceabilityRepository.getRecordByLotId(lotId);
    const now = new Date().toISOString();

    if (!record) {
      record = await traceabilityRepository.createRecord({
        traceabilityId: referenceGenerator.generateTraceabilityReference(),
        lotId,
        dealId: transaction.dealId,
        transactionId: transaction.localId || transaction.id,
        paymentId: payment.paymentId,
        collectorId: transaction.collectorId,
        recyclerId: transaction.recyclerId,
        materialCategory: transaction.materialCategory,
        initialMaterial: transaction.materialCategory,
        estimatedWeight: transaction.finalWeight,
        finalWeight: transaction.finalWeight,
        collectionTimestamp: now,
        status: 'payment_pending',
        qrReferenceToken: referenceGenerator.generateVerificationToken(),
        collectorConfirmedHandover: true,
        recyclerConfirmedHandover: true,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'pending',
      });
    }

    // Validate state machine transition to terminal COMPLETED state
    traceabilityStateMachine.assertValidTransition(record.status, 'completed');

    const updatedRecord: TraceabilityRecord = {
      ...record,
      transactionId: transaction.localId || transaction.id || transaction.transactionId,
      paymentId: payment.paymentId || payment.id,
      paymentMethod: payment.method,
      paymentStatus: 'completed',
      status: 'completed',
      completionTimestamp: now,
      updatedAt: now,
      syncStatus: 'pending',
    };
    await traceabilityRepository.createRecord(updatedRecord);

    // Record PAYMENT_COMPLETED & TRANSACTION_COMPLETED audit events
    const payEventId = referenceGenerator.generateEventId();
    await traceabilityRepository.recordEvent({
      eventId: payEventId,
      traceabilityId: record.traceabilityId,
      lotId,
      dealId: transaction.dealId,
      transactionId: updatedRecord.transactionId,
      eventType: 'PAYMENT_COMPLETED',
      actorId: payment.collectorId,
      actorType: 'collector',
      previousStatus: 'payment_pending',
      newStatus: 'completed',
      timestamp: now,
      metadata: {
        paymentId: payment.paymentId,
        method: payment.method,
        amount: payment.amount,
      },
      syncStatus: 'pending',
      createdAt: now,
    });

    const txEventId = referenceGenerator.generateEventId();
    await traceabilityRepository.recordEvent({
      eventId: txEventId,
      traceabilityId: record.traceabilityId,
      lotId,
      dealId: transaction.dealId,
      transactionId: updatedRecord.transactionId,
      eventType: 'TRANSACTION_COMPLETED',
      actorId: transaction.recyclerId,
      actorType: 'recycler',
      previousStatus: 'payment_pending',
      newStatus: 'completed',
      timestamp: now,
      metadata: {
        transactionId: updatedRecord.transactionId,
        totalAmount: transaction.totalAmount,
        traceabilityReference: record.traceabilityId,
        handoverReference: record.handoverReference,
      },
      syncStatus: 'pending',
      createdAt: now,
    });

    // Enqueue mutations
    await syncQueueRepository.enqueueOperation({
      entityType: 'traceability_record',
      localId: record.traceabilityId,
      operationType: 'UPDATE',
      payload: updatedRecord,
    });

    await syncQueueRepository.enqueueOperation({
      entityType: 'traceability_event',
      localId: txEventId,
      operationType: 'CREATE',
      payload: { eventId: txEventId, traceabilityId: record.traceabilityId, eventType: 'TRANSACTION_COMPLETED' },
    });

    if (networkService.isOnline()) {
      syncEngine.triggerSync().catch((e) => console.warn('[TraceabilityService] Sync error on payment settled:', e));
    }

    return updatedRecord;
  }

  /**
   * Retrieves full chain of custody timeline for a lot.
   */
  async getChainOfCustody(lotId: string): Promise<{
    record: TraceabilityRecord | null;
    events: TraceabilityEvent[];
    confirmations: HandoverConfirmation[];
    photos: HandoverPhotoRecord[];
  }> {
    const record = await traceabilityRepository.getRecordByLotId(lotId);
    const events = await traceabilityRepository.getEventsForLot(lotId);
    let confirmations: HandoverConfirmation[] = [];
    let photos: HandoverPhotoRecord[] = [];

    if (record?.handoverId) {
      confirmations = await traceabilityRepository.getConfirmationsForHandover(record.handoverId);
      photos = await traceabilityRepository.getPhotosForHandover(record.handoverId);
    }

    return {
      record,
      events,
      confirmations,
      photos,
    };
  }

  /**
   * Safe public verification service for QR scanning.
   * Discloses ONLY essential verification data.
   * Strictly shields phone numbers, private addresses, KYC docs, and bank secrets.
   */
  async verifyPublicRecord(tokenOrRef: string): Promise<PublicTraceabilityView | null> {
    if (!tokenOrRef || tokenOrRef.trim().length === 0) {
      return null;
    }

    const clean = tokenOrRef.trim();
    const record = await traceabilityRepository.getRecordByQrToken(clean);
    if (!record) {
      return null;
    }

    return {
      traceabilityId: record.traceabilityId,
      lotId: record.lotId,
      materialCategory: record.finalMaterial || record.materialCategory,
      status: record.status,
      estimatedWeight: record.estimatedWeight,
      finalWeight: record.finalWeight,
      collectionDate: record.collectionTimestamp,
      collectionGeneralArea: record.collectionLocation?.city || record.collectionLocation?.area || 'महाराष्ट्र (Maharashtra)',
      handoverDate: record.handoverTimestamp,
      handoverGeneralArea: record.handoverLocation?.city || 'अधिकृत केंद्र (Authorized Facility)',
      recyclerFacilityName: 'अधिकृत ई-कचरा रिसायकलर (Authorized Recycler)',
      isVerified: record.status === 'completed' || record.status === 'handover_confirmed',
      verificationTimestamp: new Date().toISOString(),
    };
  }
}

export const traceabilityService = new TraceabilityService();
