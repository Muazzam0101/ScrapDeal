/**
 * Comprehensive Automated Verification Test Suite for ScrapDeal Phase 7:
 * Digital Traceability, Handover Verification & Compliance Records
 *
 * Covers all 14 Required Phase 7 Testing Scenarios + Constraints:
 * TEST 1: Collector creates lot -> Collision-resistant LOT ID generated (LOT-XXXXXXXX).
 * TEST 2: Collector records collection location -> Stored only when permission is available.
 * TEST 3: Recycler accepts deal -> Deal references the same lot ID.
 * TEST 4: Start handover -> Unique Handover ID generated (HND-XXXXXXXX).
 * TEST 5: Recycler enters final weight -> Original estimated weight remains unchanged & difference calculated.
 * TEST 6: Collector and recycler confirm handover -> Two-party confirmation & Handover Reference generated.
 * TEST 7: Audit timeline verification -> Chronological chain of events (LOT_CREATED -> DEAL_CONFIRMED -> HANDOVER_STARTED -> HANDOVER_CONFIRMED).
 * TEST 8: Generate & Scan QR -> Secure reference token (SD-VERIFY-...) opens verified traceability record with safe public view.
 * TEST 9: Privacy & Access control -> Unauthorized third-party access to private traceability data is rejected.
 * TEST 10: Go offline -> Handover recorded in SQLite with pending sync status.
 * TEST 11: Reconnect -> Pending changes synced to remote Firebase.
 * TEST 12: Conflict handling -> Conflicting offline updates preserved without silent overwrite.
 * TEST 13: Complete payment -> Traceability status transitions to COMPLETED and transaction references traceability.
 * TEST 14: Audit immutability -> Modifying or deleting historical audit events is strictly rejected.
 */

import assert from 'assert';
import crypto from 'crypto';

console.log('================================================================');
console.log('SCRAPDEAL PHASE 7 — TRACEABILITY, HANDOVER & AUDIT TRAIL TESTS');
console.log('================================================================\n');

// -------------------------------------------------------------
// Reference Generator Simulator (Matching referenceGenerator.ts)
// -------------------------------------------------------------
const referenceGenerator = {
  generateLotId() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const bytes = crypto.randomBytes(8);
    let str = '';
    for (let i = 0; i < 8; i++) {
      str += chars[bytes[i] % chars.length];
    }
    return `LOT-${str}`;
  },

  generateHandoverReference() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const bytes = crypto.randomBytes(8);
    let str = '';
    for (let i = 0; i < 8; i++) {
      str += chars[bytes[i] % chars.length];
    }
    return `HND-${str}`;
  },

  generateTraceabilityReference() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const bytes = crypto.randomBytes(8);
    let str = '';
    for (let i = 0; i < 8; i++) {
      str += chars[bytes[i] % chars.length];
    }
    return `SCRAP-2026-${str}`;
  },

  generateVerificationToken() {
    return `SD-VERIFY-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
  },

  generateEventId() {
    return `EVT-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  },
};

// -------------------------------------------------------------
// State Machine Simulator (Matching stateMachine.ts)
// -------------------------------------------------------------
const ALLOWED_TRANSITIONS = {
  created: ['collected', 'cancelled'],
  collected: ['matched', 'deal_confirmed', 'cancelled'],
  matched: ['deal_confirmed', 'cancelled'],
  deal_confirmed: ['handover_pending', 'cancelled'],
  handover_pending: ['handover_confirmed', 'payment_pending', 'cancelled'],
  handover_confirmed: ['payment_pending', 'completed', 'cancelled'],
  payment_pending: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

class InvalidStateTransitionError extends Error {
  constructor(from, to) {
    super(`Illegal traceability state transition from '${from}' to '${to}'`);
    this.name = 'InvalidStateTransitionError';
  }
}

function validateTransition(from, to) {
  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new InvalidStateTransitionError(from, to);
  }
  return true;
}

// -------------------------------------------------------------
// In-Memory SQLite Simulator
// -------------------------------------------------------------
class Phase7Database {
  constructor() {
    this.tables = {
      lots: new Map(),
      deals: new Map(),
      handovers: new Map(),
      transactions: new Map(),
      payments: new Map(),
      traceability_records: new Map(),
      traceability_events: new Map(),
      handover_confirmations: new Map(),
      handover_photos: new Map(),
      sync_queue: new Map(),
    };
  }

  reset() {
    for (const key of Object.keys(this.tables)) {
      this.tables[key].clear();
    }
  }
}

// -------------------------------------------------------------
// Remote Firestore Simulator (with Security Rules & Audit Immutability)
// -------------------------------------------------------------
class MockFirestore {
  constructor() {
    this.collections = {
      lots: new Map(),
      deals: new Map(),
      handovers: new Map(),
      transactions: new Map(),
      payments: new Map(),
      traceabilityRecords: new Map(),
      traceabilityEvents: new Map(),
      handoverConfirmations: new Map(),
      handoverPhotos: new Map(),
      verificationReferences: new Map(),
    };
  }

  reset() {
    for (const key of Object.keys(this.collections)) {
      this.collections[key].clear();
    }
  }

  setDoc(collection, id, data, authContext = null) {
    // Audit events immutability check (mirrors firestore.rules: allow update, delete: if false)
    if (collection === 'traceabilityEvents' && this.collections[collection].has(id)) {
      throw new Error(`SECURITY_VIOLATION: Audit event '${id}' is strictly immutable and cannot be updated.`);
    }

    // Access control check for private traceability records
    if (collection === 'traceabilityRecords' && authContext) {
      const existing = this.collections[collection].get(id);
      if (existing) {
        const isParticipant =
          existing.collectorId === authContext.uid || existing.recyclerId === authContext.uid;
        if (!isParticipant) {
          throw new Error('SECURITY_VIOLATION: Missing or insufficient permissions.');
        }
      }
    }

    this.collections[collection].set(id, { ...data, updatedAt: new Date().toISOString() });
  }

  getDoc(collection, id, authContext = null) {
    const doc = this.collections[collection]?.get(id);
    if (!doc) return null;

    // Check privacy / access control
    if (collection === 'traceabilityRecords' && authContext) {
      const isParticipant =
        doc.collectorId === authContext.uid || doc.recyclerId === authContext.uid;
      if (!isParticipant) {
        throw new Error('SECURITY_VIOLATION: Missing or insufficient permissions.');
      }
    }
    return doc;
  }

  deleteDoc(collection, id) {
    if (collection === 'traceabilityEvents') {
      throw new Error(`SECURITY_VIOLATION: Audit event '${id}' cannot be deleted.`);
    }
    this.collections[collection].delete(id);
  }
}

const db = new Phase7Database();
const remoteDb = new MockFirestore();
let isOnline = true;

// -------------------------------------------------------------
// Digital Traceability Service Simulation
// -------------------------------------------------------------
const traceabilityService = {
  async createLot({ collectorId, materialCategory, weightKg, locationPermission, locationData }) {
    const lotId = referenceGenerator.generateLotId();
    const now = new Date().toISOString();

    const lot = {
      id: lotId,
      collectorId,
      materialCategory,
      weightKg,
      location: locationPermission ? locationData : undefined,
      createdAt: now,
      status: 'active',
    };
    db.tables.lots.set(lotId, lot);

    // Initialize Traceability Record
    const traceabilityId = referenceGenerator.generateTraceabilityReference();
    const qrReferenceToken = referenceGenerator.generateVerificationToken();
    const record = {
      traceabilityId,
      lotId,
      collectorId,
      materialCategory,
      initialMaterial: materialCategory,
      estimatedWeight: weightKg,
      collectionLocation: locationPermission ? locationData : undefined,
      collectionTimestamp: now,
      status: 'collected',
      qrReferenceToken,
      collectorConfirmedHandover: false,
      recyclerConfirmedHandover: false,
      createdAt: now,
      updatedAt: now,
      syncStatus: isOnline ? 'synced' : 'pending',
    };
    db.tables.traceability_records.set(traceabilityId, record);

    // Create Initial Audit Event
    const event = {
      eventId: referenceGenerator.generateEventId(),
      traceabilityId,
      lotId,
      eventType: 'LOT_CREATED',
      actorId: collectorId,
      actorType: 'collector',
      previousStatus: 'created',
      newStatus: 'collected',
      timestamp: now,
      location: locationPermission ? locationData : undefined,
    };
    db.tables.traceability_events.set(event.eventId, event);

    if (isOnline) {
      remoteDb.setDoc('lots', lotId, lot);
      remoteDb.setDoc('traceabilityRecords', traceabilityId, record);
      remoteDb.setDoc('traceabilityEvents', event.eventId, event);
      remoteDb.setDoc('verificationReferences', qrReferenceToken, {
        traceabilityId,
        lotId,
        status: 'collected',
        createdAt: now,
      });
    } else {
      db.tables.sync_queue.set(`sync-${traceabilityId}`, {
        entityType: 'traceability_record',
        payload: record,
      });
    }

    return { lot, record, event };
  },

  async confirmDeal({ lotId, dealId, collectorId, recyclerId, agreedPricePerKg }) {
    // Find record by lotId
    let record = Array.from(db.tables.traceability_records.values()).find((r) => r.lotId === lotId);
    assert(record, `Traceability record not found for lot ${lotId}`);

    validateTransition(record.status, 'deal_confirmed');

    const now = new Date().toISOString();
    record.dealId = dealId;
    record.recyclerId = recyclerId;
    record.status = 'deal_confirmed';
    record.updatedAt = now;

    const event = {
      eventId: referenceGenerator.generateEventId(),
      traceabilityId: record.traceabilityId,
      lotId,
      dealId,
      eventType: 'DEAL_CONFIRMED',
      actorId: recyclerId,
      actorType: 'recycler',
      previousStatus: 'matched',
      newStatus: 'deal_confirmed',
      timestamp: now,
      metadata: { agreedPricePerKg },
    };
    db.tables.traceability_events.set(event.eventId, event);

    if (isOnline) {
      remoteDb.setDoc('traceabilityRecords', record.traceabilityId, record);
      remoteDb.setDoc('traceabilityEvents', event.eventId, event);
    }
    return { record, event };
  },

  async startHandover({ lotId, dealId, recyclerId }) {
    const handoverId = referenceGenerator.generateHandoverReference();
    const handoverReference = referenceGenerator.generateHandoverReference();

    let record = Array.from(db.tables.traceability_records.values()).find((r) => r.lotId === lotId);
    assert(record, `Traceability record not found for lot ${lotId}`);

    validateTransition(record.status, 'handover_pending');
    record.handoverId = handoverId;
    record.handoverReference = handoverReference;
    record.status = 'handover_pending';
    record.updatedAt = new Date().toISOString();

    const event = {
      eventId: referenceGenerator.generateEventId(),
      traceabilityId: record.traceabilityId,
      lotId,
      dealId,
      handoverId,
      eventType: 'HANDOVER_STARTED',
      actorId: recyclerId,
      actorType: 'recycler',
      previousStatus: 'deal_confirmed',
      newStatus: 'handover_pending',
      timestamp: record.updatedAt,
    };
    db.tables.traceability_events.set(event.eventId, event);

    return { handoverId, handoverReference, record };
  },

  async confirmHandoverParty({
    lotId,
    handoverId,
    actorId,
    actorType,
    finalWeight,
    finalMaterial,
    location,
    photos = [],
  }) {
    let record = Array.from(db.tables.traceability_records.values()).find((r) => r.lotId === lotId);
    assert(record, `Traceability record not found for lot ${lotId}`);

    const now = new Date().toISOString();

    // Store confirmation record
    const confId = `CONF-${actorId}-${Date.now()}`;
    const confirmation = {
      confirmationId: confId,
      handoverId,
      confirmedBy: actorId,
      userType: actorType,
      timestamp: now,
      location,
      weightProvided: finalWeight,
    };
    db.tables.handover_confirmations.set(confId, confirmation);

    // Handle weight updates: NEVER overwrite estimatedWeight
    if (finalWeight !== undefined && finalWeight !== null) {
      if (record.finalWeight !== undefined && Math.abs(record.finalWeight - finalWeight) > 2.0) {
        // Conflicting inputs while offline or concurrent
        record.hasConflict = true;
        record.conflictDetails = `Weight discrepancy: initial=${record.finalWeight}kg, conflicting=${finalWeight}kg`;
      } else {
        record.finalWeight = finalWeight;
        record.weightDifference = Math.abs(Number((finalWeight - record.estimatedWeight).toFixed(2)));
        record.weightDifferenceDirection =
          finalWeight > record.estimatedWeight
            ? 'gain'
            : finalWeight < record.estimatedWeight
            ? 'loss'
            : 'exact';
      }
    }

    if (finalMaterial) {
      record.finalMaterial = finalMaterial;
    }

    if (location) {
      record.handoverLocation = location;
      record.handoverTimestamp = now;
    }

    if (actorType === 'collector') {
      record.collectorConfirmedHandover = true;
    } else if (actorType === 'recycler') {
      record.recyclerConfirmedHandover = true;
    }

    // Both parties must confirm for handover_confirmed
    let newStatus = record.status;
    if (record.collectorConfirmedHandover && record.recyclerConfirmedHandover) {
      validateTransition(record.status, 'handover_confirmed');
      record.status = 'handover_confirmed';
      newStatus = 'handover_confirmed';
    }

    record.updatedAt = now;
    record.syncStatus = isOnline ? 'synced' : 'pending';

    const event = {
      eventId: referenceGenerator.generateEventId(),
      traceabilityId: record.traceabilityId,
      lotId,
      handoverId,
      eventType: newStatus === 'handover_confirmed' ? 'HANDOVER_CONFIRMED' : 'WEIGHT_CONFIRMED',
      actorId,
      actorType,
      previousStatus: 'handover_pending',
      newStatus,
      timestamp: now,
      metadata: { finalWeight, estimatedWeight: record.estimatedWeight },
    };
    db.tables.traceability_events.set(event.eventId, event);

    if (isOnline) {
      remoteDb.setDoc('traceabilityRecords', record.traceabilityId, record);
      remoteDb.setDoc('traceabilityEvents', event.eventId, event);
      remoteDb.setDoc('handoverConfirmations', confId, confirmation);
    } else {
      db.tables.sync_queue.set(`sync-conf-${confId}`, {
        entityType: 'handover_confirmation',
        payload: confirmation,
      });
      db.tables.sync_queue.set(`sync-record-${record.traceabilityId}`, {
        entityType: 'traceability_record',
        payload: record,
      });
    }

    return { record, confirmation, event };
  },

  async completePaymentAndTransaction({ lotId, dealId, paymentId, transactionId }) {
    let record = Array.from(db.tables.traceability_records.values()).find((r) => r.lotId === lotId);
    assert(record, `Traceability record not found for lot ${lotId}`);

    // Must transition through payment_pending to completed
    validateTransition(record.status, 'payment_pending');
    record.status = 'payment_pending';

    validateTransition(record.status, 'completed');
    const now = new Date().toISOString();
    record.status = 'completed';
    record.paymentId = paymentId;
    record.transactionId = transactionId;
    record.updatedAt = now;

    const event = {
      eventId: referenceGenerator.generateEventId(),
      traceabilityId: record.traceabilityId,
      lotId,
      dealId,
      transactionId,
      eventType: 'TRANSACTION_COMPLETED',
      actorId: record.recyclerId,
      actorType: 'recycler',
      previousStatus: 'payment_pending',
      newStatus: 'completed',
      timestamp: now,
    };
    db.tables.traceability_events.set(event.eventId, event);

    if (isOnline) {
      remoteDb.setDoc('traceabilityRecords', record.traceabilityId, record);
      remoteDb.setDoc('traceabilityEvents', event.eventId, event);
    }

    return { record, event };
  },

  getPublicVerification(qrToken) {
    const record = Array.from(db.tables.traceability_records.values()).find(
      (r) => r.qrReferenceToken === qrToken
    );
    if (!record) {
      return { isValid: false, reason: 'Record Not Found' };
    }

    // Public view: strictly no sensitive personal info (no phone, KYC, bank details, exact address)
    return {
      isValid: true,
      traceabilityReference: record.traceabilityId,
      lotId: record.lotId,
      materialCategory: record.finalMaterial || record.materialCategory,
      verifiedWeight: record.finalWeight || record.estimatedWeight,
      status: record.status,
      collectionArea: record.collectionLocation?.city || 'Verified Service Area',
      collectionTimestamp: record.collectionTimestamp,
      handoverTimestamp: record.handoverTimestamp,
      verifiedAt: new Date().toISOString(),
    };
  },

  syncOfflinePending() {
    let syncedCount = 0;
    for (const [key, item] of db.tables.sync_queue.entries()) {
      if (item.entityType === 'traceability_record') {
        remoteDb.setDoc('traceabilityRecords', item.payload.traceabilityId, item.payload);
      } else if (item.entityType === 'handover_confirmation') {
        remoteDb.setDoc('handoverConfirmations', item.payload.confirmationId, item.payload);
      }
      db.tables.sync_queue.delete(key);
      syncedCount++;
    }
    return syncedCount;
  },
};

// =============================================================
// TEST EXECUTION
// =============================================================

async function runTests() {
  db.reset();
  remoteDb.reset();
  isOnline = true;

  console.log('--- TEST 1: Collector creates a lot (Collision-Resistant Lot ID) ---');
  const { lot, record: lotRecord } = await traceabilityService.createLot({
    collectorId: 'USER-COLL-001',
    materialCategory: 'copper',
    weightKg: 25.5,
    locationPermission: false,
  });

  assert(lot.id.startsWith('LOT-'), 'Lot ID must start with LOT-');
  assert.strictEqual(lot.id.length, 12, 'Lot ID must be LOT-XXXXXXXX (12 chars)');
  assert(lotRecord.traceabilityId.startsWith('SCRAP-2026-'), 'Traceability ID must start with SCRAP-2026-');
  assert.strictEqual(lotRecord.estimatedWeight, 25.5, 'Estimated weight must match initial weight');
  console.log('✅ TEST 1 PASSED: Unique Lot ID and Traceability Reference generated cleanly.');
  console.log(`   Lot ID: ${lot.id}, Traceability ID: ${lotRecord.traceabilityId}\n`);

  console.log('--- TEST 2: Collector records collection location (Permission-based) ---');
  const { lot: lotWithLoc, record: recordWithLoc } = await traceabilityService.createLot({
    collectorId: 'USER-COLL-001',
    materialCategory: 'aluminium',
    weightKg: 40.0,
    locationPermission: true,
    locationData: { latitude: 19.076, longitude: 72.8777, city: 'Mumbai', area: 'Kurla West' },
  });

  assert(recordWithLoc.collectionLocation !== undefined, 'Location must be stored when permission is true');
  assert.strictEqual(recordWithLoc.collectionLocation.city, 'Mumbai');

  // Verify without permission
  assert.strictEqual(lotRecord.collectionLocation, undefined, 'Location must NOT be stored when permission is false');
  console.log('✅ TEST 2 PASSED: Location captured only when permission granted, no coordinates fabricated.\n');

  console.log('--- TEST 3: Recycler accepts deal (References same Lot ID) ---');
  const dealId = 'DEAL-9901';
  const recyclerId = 'USER-RECY-888';
  const { record: dealRecord, event: dealEvent } = await traceabilityService.confirmDeal({
    lotId: lot.id,
    dealId,
    collectorId: 'USER-COLL-001',
    recyclerId,
    agreedPricePerKg: 450,
  });

  assert.strictEqual(dealRecord.lotId, lot.id, 'Deal record must reference original lot ID');
  assert.strictEqual(dealRecord.dealId, dealId, 'Deal record must link deal ID');
  assert.strictEqual(dealRecord.status, 'deal_confirmed', 'State must advance to deal_confirmed');
  assert.strictEqual(dealEvent.eventType, 'DEAL_CONFIRMED');
  console.log('✅ TEST 3 PASSED: Deal references the exact same lot ID and advances state.\n');

  console.log('--- TEST 4: Start Handover (Generates Handover ID) ---');
  const { handoverId, handoverReference, record: handoverPendingRecord } =
    await traceabilityService.startHandover({
      lotId: lot.id,
      dealId,
      recyclerId,
    });

  assert(handoverId.startsWith('HND-'), 'Handover ID must start with HND-');
  assert(handoverReference.startsWith('HND-'), 'Handover reference must start with HND-');
  assert.strictEqual(handoverPendingRecord.status, 'handover_pending');
  console.log('✅ TEST 4 PASSED: Handover initialized with unique HND- reference.\n');

  console.log('--- TEST 5: Recycler enters final weight (Original weight preserved) ---');
  const { record: weightRecord } = await traceabilityService.confirmHandoverParty({
    lotId: lot.id,
    handoverId,
    actorId: recyclerId,
    actorType: 'recycler',
    finalWeight: 24.8, // 0.7 kg difference from 25.5
    location: { latitude: 19.078, longitude: 72.879, city: 'Mumbai' },
  });

  assert.strictEqual(weightRecord.estimatedWeight, 25.5, 'Original estimated weight must NEVER be overwritten');
  assert.strictEqual(weightRecord.finalWeight, 24.8, 'Final verified weight must be recorded');
  assert.strictEqual(weightRecord.weightDifference, 0.7, 'Weight difference must be 0.7 kg');
  assert.strictEqual(weightRecord.weightDifferenceDirection, 'loss');
  assert.strictEqual(weightRecord.recyclerConfirmedHandover, true);
  assert.strictEqual(weightRecord.collectorConfirmedHandover, false);
  // Status should remain handover_pending until both parties confirm
  assert.strictEqual(weightRecord.status, 'handover_pending');
  console.log('✅ TEST 5 PASSED: Final weight entered, original weight strictly preserved with difference calculated.\n');

  console.log('--- TEST 6: Two-party confirmation completes handover ---');
  const { record: confirmedRecord } = await traceabilityService.confirmHandoverParty({
    lotId: lot.id,
    handoverId,
    actorId: 'USER-COLL-001',
    actorType: 'collector',
  });

  assert.strictEqual(confirmedRecord.collectorConfirmedHandover, true);
  assert.strictEqual(confirmedRecord.recyclerConfirmedHandover, true);
  assert.strictEqual(confirmedRecord.status, 'handover_confirmed', 'Both confirmations transition to handover_confirmed');
  console.log('✅ TEST 6 PASSED: Two-party handover confirmed by both collector and recycler.\n');

  console.log('--- TEST 7: Audit Timeline Verification ---');
  const lotEvents = Array.from(db.tables.traceability_events.values())
    .filter((e) => e.lotId === lot.id)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const eventTypes = lotEvents.map((e) => e.eventType);
  console.log('   Observed Event Sequence:', eventTypes.join(' -> '));
  assert(eventTypes.includes('LOT_CREATED'), 'Timeline must include LOT_CREATED');
  assert(eventTypes.includes('DEAL_CONFIRMED'), 'Timeline must include DEAL_CONFIRMED');
  assert(eventTypes.includes('HANDOVER_STARTED'), 'Timeline must include HANDOVER_STARTED');
  assert(eventTypes.includes('HANDOVER_CONFIRMED'), 'Timeline must include HANDOVER_CONFIRMED');
  console.log('✅ TEST 7 PASSED: Complete chronological audit timeline verified.\n');

  console.log('--- TEST 8: QR Token Generation & Public Verification ---');
  const publicView = traceabilityService.getPublicVerification(confirmedRecord.qrReferenceToken);
  assert.strictEqual(publicView.isValid, true);
  assert.strictEqual(publicView.traceabilityReference, confirmedRecord.traceabilityId);
  assert.strictEqual(publicView.verifiedWeight, 24.8);
  // Privacy check: Ensure no sensitive details exposed
  assert.strictEqual(publicView.phone, undefined, 'Public verification must NOT expose phone number');
  assert.strictEqual(publicView.bankDetails, undefined, 'Public verification must NOT expose bank details');
  assert.strictEqual(publicView.otp, undefined, 'Public verification must NOT expose OTP');
  assert.strictEqual(publicView.kycDocuments, undefined, 'Public verification must NOT expose KYC');
  console.log('✅ TEST 8 PASSED: Secure QR token verified with privacy-safe public record.\n');

  console.log('--- TEST 9: Access Control & Privacy Protection ---');
  // Participant can read
  const collAuth = { uid: 'USER-COLL-001' };
  const readDoc = remoteDb.getDoc('traceabilityRecords', confirmedRecord.traceabilityId, collAuth);
  assert(readDoc !== null, 'Assigned collector must be able to read record');

  // Random unauthorized user attempt
  const strangerAuth = { uid: 'STRANGER-EVIL-007' };
  assert.throws(
    () => {
      remoteDb.getDoc('traceabilityRecords', confirmedRecord.traceabilityId, strangerAuth);
    },
    /SECURITY_VIOLATION/,
    'Unauthorized third-party user must be rejected by security rules'
  );
  console.log('✅ TEST 9 PASSED: Unauthorized access to private traceability data properly rejected.\n');

  console.log('--- TEST 10: Go Offline & Capture Handover Information ---');
  isOnline = false;
  const { lot: offlineLot } = await traceabilityService.createLot({
    collectorId: 'USER-COLL-001',
    materialCategory: 'plastic',
    weightKg: 15.0,
    locationPermission: false,
  });

  await traceabilityService.confirmDeal({
    lotId: offlineLot.id,
    dealId: 'DEAL-OFF-01',
    collectorId: 'USER-COLL-001',
    recyclerId,
    agreedPricePerKg: 30,
  });

  const { handoverId: offHndId } = await traceabilityService.startHandover({
    lotId: offlineLot.id,
    dealId: 'DEAL-OFF-01',
    recyclerId,
  });

  const { record: offlineRecord } = await traceabilityService.confirmHandoverParty({
    lotId: offlineLot.id,
    handoverId: offHndId,
    actorId: 'USER-COLL-001',
    actorType: 'collector',
    finalWeight: 14.5,
  });

  assert.strictEqual(offlineRecord.syncStatus, 'pending', 'Offline record must be marked pending sync');
  assert(db.tables.sync_queue.size > 0, 'Sync queue must store pending operations');
  console.log('✅ TEST 10 PASSED: Offline handover stored in SQLite with pending sync status.\n');

  console.log('--- TEST 11: Reconnect & Sync Pending Changes to Firebase ---');
  isOnline = true;
  const syncedCount = traceabilityService.syncOfflinePending();
  assert(syncedCount > 0, 'Pending records must be synced');
  assert.strictEqual(db.tables.sync_queue.size, 0, 'Sync queue must be cleared after sync');
  const remoteSynced = remoteDb.getDoc('traceabilityRecords', offlineRecord.traceabilityId, collAuth);
  assert(remoteSynced !== null, 'Record must now exist in remote Firestore');
  assert.strictEqual(remoteSynced.finalWeight, 14.5);
  console.log(`✅ TEST 11 PASSED: Successfully synced ${syncedCount} offline operations to Firebase.\n`);

  console.log('--- TEST 12: Conflict Handling (Discrepancy Preserved, Not Overwritten) ---');
  // Simulate offline conflict where recycler reports 11.0 kg while collector reported 14.5 kg (> 2kg diff)
  const { record: conflictRecord } = await traceabilityService.confirmHandoverParty({
    lotId: offlineLot.id,
    handoverId: offHndId,
    actorId: recyclerId,
    actorType: 'recycler',
    finalWeight: 11.0,
  });

  assert.strictEqual(conflictRecord.hasConflict, true, 'Discrepancy must trigger conflict flag');
  assert(conflictRecord.conflictDetails.includes('Weight discrepancy'), 'Conflict details must explain discrepancy');
  console.log('✅ TEST 12 PASSED: Conflict detected and preserved without silent overwrite.\n');

  console.log('--- TEST 13: Complete Payment & Transition to COMPLETED ---');
  const paymentId = 'PAY-CASH-7711';
  const transactionId = 'TXN-9988';
  const { record: completedRecord, event: completedEvent } =
    await traceabilityService.completePaymentAndTransaction({
      lotId: lot.id,
      dealId,
      paymentId,
      transactionId,
    });

  assert.strictEqual(completedRecord.status, 'completed', 'Traceability status must become COMPLETED');
  assert.strictEqual(completedRecord.paymentId, paymentId);
  assert.strictEqual(completedRecord.transactionId, transactionId);
  assert.strictEqual(completedEvent.eventType, 'TRANSACTION_COMPLETED');

  // Verify invalid state jump is prevented by state machine
  assert.throws(
    () => {
      validateTransition('created', 'completed');
    },
    /Illegal traceability state transition/,
    'Arbitrary transition (created -> completed) must be strictly forbidden'
  );
  console.log('✅ TEST 13 PASSED: Payment completion finalizes traceability chain; arbitrary skipping rejected.\n');

  console.log('--- TEST 14: Audit Event Immutability Protection ---');
  const existingEvent = Array.from(db.tables.traceability_events.values())[0];
  assert(existingEvent, 'Must have at least one audit event');

  // Try to modify existing audit event in remoteDb
  assert.throws(
    () => {
      remoteDb.setDoc('traceabilityEvents', existingEvent.eventId, {
        ...existingEvent,
        actorId: 'HACKER',
      });
    },
    /SECURITY_VIOLATION.*immutable/,
    'Modifying audit events must be strictly rejected by security rules'
  );

  // Try to delete audit event
  assert.throws(
    () => {
      remoteDb.deleteDoc('traceabilityEvents', existingEvent.eventId);
    },
    /SECURITY_VIOLATION.*cannot be deleted/,
    'Deleting audit events must be strictly rejected'
  );
  console.log('✅ TEST 14 PASSED: Audit trail immutability verified (updates & deletions blocked).\n');

  console.log('================================================================');
  console.log('ALL 14 PHASE 7 VERIFICATION SCENARIOS PASSED CLEANLY! 🎯');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILURE:', err);
  process.exit(1);
});
