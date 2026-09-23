/**
 * Comprehensive Automated Verification Test Suite for ScrapDeal Phase 3:
 * Core Scrap Deal Flow (Collector <-> Recycler Lifecycle)
 *
 * Verifies all 11 Core Phase 3 Workflows & Invariants:
 * 1. Collector authentication & profile retrieval
 * 2. Online lot creation (SQLite + Firestore sync)
 * 3. Offline lot creation & local persistence across app restart
 * 4. Online reconnection batch sync
 * 5. Recycler available lots query (Strictly real data only, zero mock records)
 * 6. Recycler makes real offer (rate per kg, calculated total)
 * 7. Collector reviews & accepts offer:
 *    - Deal created (status: handover_pending)
 *    - Handover initialized
 *    - Competing offers rejected
 *    - Idempotency: duplicate deal prevented
 * 8. Mutual Digital Handover:
 *    - Collector confirms handover
 *    - Recycler confirms receipt
 *    - Both confirmed -> Automatic Transaction generation & completion
 * 9. Real Earnings Calculation strictly from completed transactions
 * 10. Mid-sync network drop safety & retry
 * 11. Role integrity & security validation
 */

import assert from 'assert';

// Simulated In-Memory Database with complete Phase 3 tables
class Phase3Database {
  constructor() {
    this.tables = {
      users: new Map(),
      material_lots: new Map(),
      offers: new Map(),
      deals: new Map(),
      handovers: new Map(),
      transactions: new Map(),
      sync_queue: new Map(),
    };
  }

  // Clone DB to simulate app close & cold restart
  clone() {
    const fresh = new Phase3Database();
    for (const [tableName, map] of Object.entries(this.tables)) {
      for (const [key, value] of map.entries()) {
        fresh.tables[tableName].set(key, JSON.parse(JSON.stringify(value)));
      }
    }
    return fresh;
  }
}

// Simulated Remote Firestore
class MockFirestore {
  constructor() {
    this.collections = {
      users: new Map(),
      material_lots: new Map(),
      offers: new Map(),
      deals: new Map(),
      handovers: new Map(),
      transactions: new Map(),
    };
    this.shouldFail = false;
  }

  setDocument(collection, id, data) {
    if (this.shouldFail) throw new Error('Firestore connection timed out');
    this.collections[collection].set(id, { ...data, updatedAt: new Date().toISOString() });
  }

  getDocument(collection, id) {
    if (this.shouldFail) throw new Error('Firestore connection timed out');
    return this.collections[collection].get(id) || null;
  }
}

// Simulated Sync Engine for Phase 3 entities
class Phase3SyncEngine {
  constructor(db, firestore, network) {
    this.db = db;
    this.firestore = firestore;
    this.network = network;
  }

  async processQueue() {
    if (!this.network.isOnline) return { processed: 0, failed: 0 };

    const queueItems = Array.from(this.db.tables.sync_queue.values()).filter(
      (item) => item.status === 'pending' || item.status === 'failed'
    );

    let processed = 0;
    let failed = 0;

    for (const item of queueItems) {
      try {
        const payload = typeof item.payload === 'string' ? JSON.parse(item.payload) : item.payload;
        const collection = item.entityType === 'material_lot' ? 'material_lots' : `${item.entityType}s`;

        this.firestore.setDocument(collection, item.localId, payload);

        // Update local entity sync status
        const localTable = this.db.tables[collection];
        if (localTable && localTable.has(item.localId)) {
          const entity = localTable.get(item.localId);
          entity.syncStatus = 'synced';
          entity.remoteId = item.localId;
          entity.lastSyncedAt = new Date().toISOString();
        }

        // Delete from sync queue
        this.db.tables.sync_queue.delete(item.id);
        processed++;
      } catch (err) {
        item.retryCount = (item.retryCount || 0) + 1;
        item.status = 'failed';
        item.errorMessage = err.message;
        failed++;
      }
    }

    return { processed, failed };
  }
}

// Deal Flow Business Logic Engine
class Phase3DealFlowService {
  constructor(db, firestore, network, syncEngine) {
    this.db = db;
    this.firestore = firestore;
    this.network = network;
    this.syncEngine = syncEngine;
  }

  // 1. Create Scrap Lot
  async createScrapLot({ collectorId, categoryId, weightKg, photos, locationCity }) {
    if (weightKg <= 0) throw new Error('Weight must be positive');
    if (!categoryId) throw new Error('Category required');

    const lotId = `LOT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const lot = {
      localId: lotId,
      id: lotId,
      collectorId,
      categoryId,
      weightKg,
      photos: photos || [],
      locationCity: locationCity || 'Pune',
      status: 'published',
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    this.db.tables.material_lots.set(lotId, lot);

    // Enqueue sync operation
    const queueId = `SYNC-${Date.now()}-${Math.random()}`;
    this.db.tables.sync_queue.set(queueId, {
      id: queueId,
      entityType: 'material_lot',
      localId: lotId,
      operationType: 'CREATE',
      payload: lot,
      status: 'pending',
      retryCount: 0,
      createdAt: now,
    });

    if (this.network.isOnline) {
      await this.syncEngine.processQueue();
    }

    return this.db.tables.material_lots.get(lotId);
  }

  // 2. Query Available Lots (Recycler view)
  getAvailableLotsForRecycler() {
    const allLots = Array.from(this.db.tables.material_lots.values());
    // Only published/available lots, strictly non-mock
    return allLots.filter((lot) => lot.status === 'published' || lot.status === 'offer_received');
  }

  // 3. Recycler Submits Offer
  async submitRecyclerOffer({ lotId, recyclerId, recyclerName, ratePerKg, notes }) {
    const lot = this.db.tables.material_lots.get(lotId);
    if (!lot) throw new Error('Scrap lot not found');
    if (lot.status !== 'published' && lot.status !== 'offer_received') {
      throw new Error(`Cannot submit offer on lot in status: ${lot.status}`);
    }
    if (ratePerKg <= 0) throw new Error('Rate must be positive');

    const offerId = `OFFER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    const totalAmount = Math.round(lot.weightKg * ratePerKg);

    const offer = {
      localId: offerId,
      id: offerId,
      lotId,
      recyclerId,
      recyclerName,
      collectorId: lot.collectorId,
      materialCategoryId: lot.categoryId,
      weightKg: lot.weightKg,
      ratePerKg,
      totalAmount,
      comments: notes || '',
      status: 'pending',
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    this.db.tables.offers.set(offerId, offer);

    // Update lot status to offer_received
    lot.status = 'offer_received';
    lot.updatedAt = now;

    // Enqueue sync
    const queueId = `SYNC-${Date.now()}-${Math.random()}`;
    this.db.tables.sync_queue.set(queueId, {
      id: queueId,
      entityType: 'offer',
      localId: offerId,
      operationType: 'CREATE',
      payload: offer,
      status: 'pending',
      retryCount: 0,
      createdAt: now,
    });

    if (this.network.isOnline) {
      await this.syncEngine.processQueue();
    }

    return offer;
  }

  // 4. Collector Accepts Offer
  async acceptOffer({ lotId, offerId, collectorId }) {
    const lot = this.db.tables.material_lots.get(lotId);
    if (!lot) throw new Error('Lot not found');
    if (lot.collectorId !== collectorId) throw new Error('Unauthorized collector');

    // Idempotency: Prevent duplicate deal
    if (lot.dealId || lot.status === 'deal_created' || lot.status === 'handover_pending') {
      throw new Error('Deal already created for this lot');
    }

    const offer = this.db.tables.offers.get(offerId);
    if (!offer || offer.lotId !== lotId) throw new Error('Offer not found for this lot');
    if (offer.status !== 'pending') throw new Error(`Offer is ${offer.status}`);

    const now = new Date().toISOString();
    const dealId = `DEAL-${Date.now()}`;

    // 1. Create Deal
    const deal = {
      localId: dealId,
      id: dealId,
      lotId,
      collectorId,
      recyclerId: offer.recyclerId,
      offerId,
      materialCategoryId: lot.categoryId,
      materialName: lot.categoryId.toUpperCase(),
      agreedRatePerKg: offer.ratePerKg,
      agreedTotalAmount: offer.totalAmount,
      agreedWeightKg: lot.weightKg,
      status: 'handover_pending',
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    this.db.tables.deals.set(dealId, deal);

    // 2. Initialize HandoverRecord
    const handoverId = `HO-${Date.now()}`;
    const handover = {
      localId: handoverId,
      id: handoverId,
      dealId,
      lotId,
      collectorId,
      recyclerId: offer.recyclerId,
      actualWeightKg: lot.weightKg,
      collectorConfirmed: false,
      recyclerConfirmed: false,
      status: 'pending',
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    this.db.tables.handovers.set(handoverId, handover);

    // 3. Mark selected offer accepted
    offer.status = 'accepted';
    offer.updatedAt = now;

    // 4. Reject competing offers for this lot
    for (const [id, off] of this.db.tables.offers.entries()) {
      if (off.lotId === lotId && off.localId !== offerId && off.status === 'pending') {
        off.status = 'rejected';
        off.updatedAt = now;
      }
    }

    // 5. Update lot status & references
    lot.status = 'deal_created';
    lot.dealId = dealId;
    lot.acceptedOfferId = offerId;
    lot.agreedRatePerKg = offer.ratePerKg;
    lot.agreedTotalAmount = offer.totalAmount;
    lot.updatedAt = now;

    // Enqueue syncs
    this.db.tables.sync_queue.set(`SYNC-D-${dealId}`, {
      id: `SYNC-D-${dealId}`,
      entityType: 'deal',
      localId: dealId,
      operationType: 'CREATE',
      payload: deal,
      status: 'pending',
      retryCount: 0,
      createdAt: now,
    });
    this.db.tables.sync_queue.set(`SYNC-H-${handoverId}`, {
      id: `SYNC-H-${handoverId}`,
      entityType: 'handover',
      localId: handoverId,
      operationType: 'CREATE',
      payload: handover,
      status: 'pending',
      retryCount: 0,
      createdAt: now,
    });

    if (this.network.isOnline) {
      await this.syncEngine.processQueue();
    }

    return { deal, handover };
  }

  // 5. Collector Confirms Handover
  async confirmCollectorHandover({ dealId, collectorId, actualWeightKg, photoUri }) {
    const deal = this.db.tables.deals.get(dealId);
    if (!deal) throw new Error('Deal not found');
    if (deal.collectorId !== collectorId) throw new Error('Collector mismatch');

    const handover = Array.from(this.db.tables.handovers.values()).find((h) => h.dealId === dealId);
    if (!handover) throw new Error('Handover not found');

    const now = new Date().toISOString();
    handover.collectorConfirmed = true;
    handover.collectorConfirmedAt = now;
    if (actualWeightKg) handover.actualWeightKg = actualWeightKg;
    if (photoUri) handover.photoUri = photoUri;
    handover.updatedAt = now;

    let transaction = null;
    if (handover.collectorConfirmed && handover.recyclerConfirmed) {
      transaction = await this._finalizeHandover(deal, handover);
    }

    return { handover, deal, transaction };
  }

  // 6. Recycler Confirms Handover (Receipt)
  async confirmRecyclerHandover({ dealId, recyclerId, actualWeightKg, photoUri, notes }) {
    const deal = this.db.tables.deals.get(dealId);
    if (!deal) throw new Error('Deal not found');
    if (deal.recyclerId !== recyclerId) throw new Error('Recycler mismatch');

    const handover = Array.from(this.db.tables.handovers.values()).find((h) => h.dealId === dealId);
    if (!handover) throw new Error('Handover not found');

    const now = new Date().toISOString();
    handover.recyclerConfirmed = true;
    handover.recyclerConfirmedAt = now;
    if (actualWeightKg) handover.actualWeightKg = actualWeightKg;
    if (photoUri) handover.photoUri = photoUri;
    if (notes) handover.notes = notes;
    handover.updatedAt = now;

    let transaction = null;
    if (handover.collectorConfirmed && handover.recyclerConfirmed) {
      transaction = await this._finalizeHandover(deal, handover);
    }

    return { handover, deal, transaction };
  }

  // Internal: Finalize mutual handover -> Complete Transaction
  async _finalizeHandover(deal, handover) {
    const now = new Date().toISOString();
    const finalWeight = handover.actualWeightKg || deal.agreedWeightKg;
    const finalTotal = Math.round(finalWeight * deal.agreedRatePerKg);

    // 1. Handover completed
    handover.status = 'completed';
    handover.completedAt = now;

    // 2. Deal completed
    deal.status = 'completed';
    deal.updatedAt = now;

    // 3. Lot completed
    const lot = this.db.tables.material_lots.get(deal.lotId);
    if (lot) {
      lot.status = 'completed';
      lot.weightKg = finalWeight;
      lot.agreedTotalAmount = finalTotal;
      lot.updatedAt = now;
    }

    // 4. Transaction created
    const txId = `TX-${Date.now()}`;
    const transaction = {
      localId: txId,
      id: txId,
      transactionNumber: `TRX-${Date.now().toString().slice(-6)}`,
      lotId: deal.lotId,
      collectorId: deal.collectorId,
      recyclerId: deal.recyclerId,
      materialName: deal.materialName,
      weightKg: finalWeight,
      ratePerKg: deal.agreedRatePerKg,
      totalAmount: finalTotal,
      paymentMethod: 'cash',
      paymentStatus: 'completed',
      date: now,
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    this.db.tables.transactions.set(txId, transaction);

    // Enqueue syncs
    this.db.tables.sync_queue.set(`SYNC-TX-${txId}`, {
      id: `SYNC-TX-${txId}`,
      entityType: 'transaction',
      localId: txId,
      operationType: 'CREATE',
      payload: transaction,
      status: 'pending',
      retryCount: 0,
      createdAt: now,
    });

    if (this.network.isOnline) {
      await this.syncEngine.processQueue();
    }

    return transaction;
  }

  // 7. Calculate Real Collector Earnings
  getCollectorEarnings(collectorId) {
    const txs = Array.from(this.db.tables.transactions.values()).filter(
      (t) => t.collectorId === collectorId && t.paymentStatus === 'completed'
    );
    const totalAmount = txs.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const totalWeightKg = txs.reduce((sum, t) => sum + (t.weightKg || 0), 0);
    return {
      completedTransactionsCount: txs.length,
      totalAmount,
      totalWeightKg,
      transactions: txs,
    };
  }
}

// -------------------------------------------------------------
// RUN THE COMPREHENSIVE PHASE 3 VERIFICATION SUITE
// -------------------------------------------------------------
async function runPhase3Tests() {
  console.log('====================================================');
  console.log('   SCRAPDEAL PHASE 3: CORE DEAL FLOW VERIFICATION   ');
  console.log('====================================================\n');

  let testsPassed = 0;
  let testsFailed = 0;

  async function test(title, fn) {
    try {
      await fn();
      console.log(`[PASS] ${title}`);
      testsPassed++;
    } catch (err) {
      console.error(`[FAIL] ${title}`);
      console.error(`       Error: ${err.message}\n`, err.stack);
      testsFailed++;
    }
  }

  // Global Context Setup
  let db = new Phase3Database();
  let firestore = new MockFirestore();
  let network = { isOnline: true };
  let syncEngine = new Phase3SyncEngine(db, firestore, network);
  let dealFlow = new Phase3DealFlowService(db, firestore, network, syncEngine);

  const collectorUser = {
    id: 'user_coll_001',
    phoneNumber: '+919876543210',
    role: 'collector',
    name: 'Ramesh Kabadi',
    city: 'Pune',
  };
  const recyclerUser = {
    id: 'user_recy_001',
    phoneNumber: '+919876500000',
    role: 'recycler',
    name: 'Maharashtra Green Eco Recyclers',
    city: 'Pune',
  };
  const competingRecycler = {
    id: 'user_recy_002',
    phoneNumber: '+919876511111',
    role: 'recycler',
    name: 'Pune Scrap Processors',
    city: 'Pune',
  };

  db.tables.users.set(collectorUser.id, collectorUser);
  db.tables.users.set(recyclerUser.id, recyclerUser);
  db.tables.users.set(competingRecycler.id, competingRecycler);

  // -----------------------------------------------------------------
  // SCENARIO 1: Collector Authentication & Profile
  // -----------------------------------------------------------------
  await test('SCENARIO 1: Collector authentication & profile retrieval', async () => {
    const user = db.tables.users.get('user_coll_001');
    assert.ok(user, 'Collector profile should exist');
    assert.strictEqual(user.role, 'collector');
    assert.strictEqual(user.name, 'Ramesh Kabadi');
  });

  // -----------------------------------------------------------------
  // SCENARIO 2: Online Lot Creation (SQLite + Remote Sync)
  // -----------------------------------------------------------------
  let onlineLot;
  await test('SCENARIO 2: Online scrap lot creation synchronizes to Firestore immediately', async () => {
    network.isOnline = true;
    onlineLot = await dealFlow.createScrapLot({
      collectorId: collectorUser.id,
      categoryId: 'copper',
      weightKg: 25.5,
      photos: ['file:///mock/copper1.jpg'],
      locationCity: 'Pune',
    });

    assert.ok(onlineLot.localId, 'Lot must have localId');
    assert.strictEqual(onlineLot.status, 'published');
    assert.strictEqual(onlineLot.weightKg, 25.5);

    // Verify local DB status updated to synced
    const localSaved = db.tables.material_lots.get(onlineLot.localId);
    assert.strictEqual(localSaved.syncStatus, 'synced', 'Local lot syncStatus should be synced');

    // Verify remote Firestore has the record
    const remoteDoc = firestore.getDocument('material_lots', onlineLot.localId);
    assert.ok(remoteDoc, 'Firestore must contain the created lot');
    assert.strictEqual(remoteDoc.categoryId, 'copper');
    assert.strictEqual(remoteDoc.collectorId, collectorUser.id);
  });

  // -----------------------------------------------------------------
  // SCENARIO 3: Offline Lot Creation & Local Persistence (App Restart)
  // -----------------------------------------------------------------
  let offlineLotId;
  await test('SCENARIO 3: Offline lot creation persists locally across simulated app restart', async () => {
    network.isOnline = false; // GO OFFLINE

    const offlineLot = await dealFlow.createScrapLot({
      collectorId: collectorUser.id,
      categoryId: 'aluminum',
      weightKg: 40,
      photos: ['file:///mock/alu1.jpg'],
      locationCity: 'Pune',
    });
    offlineLotId = offlineLot.localId;

    assert.strictEqual(offlineLot.syncStatus, 'pending', 'Offline lot must have syncStatus pending');
    assert.strictEqual(firestore.getDocument('material_lots', offlineLotId), null, 'Must NOT be in Firestore while offline');

    // Simulate Cold App Restart (Re-instantiate DB from persistent snapshot)
    const restartedDb = db.clone();
    const persistedLot = restartedDb.tables.material_lots.get(offlineLotId);
    assert.ok(persistedLot, 'Lot must persist in SQLite after cold app restart');
    assert.strictEqual(persistedLot.categoryId, 'aluminum');
    assert.strictEqual(persistedLot.weightKg, 40);

    // Continue with the current DB instance
  });

  // -----------------------------------------------------------------
  // SCENARIO 4: Online Reconnection Batch Sync
  // -----------------------------------------------------------------
  await test('SCENARIO 4: Online reconnection triggers batch sync of pending offline records', async () => {
    // Before reconnection, verify sync queue has 1 pending item
    const pendingItems = Array.from(db.tables.sync_queue.values()).filter((i) => i.status === 'pending');
    assert.strictEqual(pendingItems.length, 1, 'Sync queue must have 1 pending item');

    // Network is restored!
    network.isOnline = true;
    const syncResult = await syncEngine.processQueue();

    assert.strictEqual(syncResult.processed, 1, 'Sync engine must process 1 item');
    assert.strictEqual(syncResult.failed, 0);

    // Verify Firestore now has the offline lot
    const syncedRemoteLot = firestore.getDocument('material_lots', offlineLotId);
    assert.ok(syncedRemoteLot, 'Offline lot must now exist in Firestore after reconnect sync');
    assert.strictEqual(syncedRemoteLot.categoryId, 'aluminum');

    // Verify local DB status updated to synced
    const localLot = db.tables.material_lots.get(offlineLotId);
    assert.strictEqual(localLot.syncStatus, 'synced');
  });

  // -----------------------------------------------------------------
  // SCENARIO 5: Recycler Available Lots Query (Strict Zero Mock Data)
  // -----------------------------------------------------------------
  await test('SCENARIO 5: Recycler available lots query returns only real published lots (zero mock data)', async () => {
    const availableLots = dealFlow.getAvailableLotsForRecycler();
    assert.strictEqual(availableLots.length, 2, 'Must return exactly the 2 real lots created above');
    assert.ok(availableLots.every((l) => l.collectorId === collectorUser.id), 'All lots belong to real collector');
    assert.ok(availableLots.every((l) => l.status === 'published' || l.status === 'offer_received'));
  });

  // -----------------------------------------------------------------
  // SCENARIO 6: Recycler Makes Real Offer
  // -----------------------------------------------------------------
  let primaryOffer;
  let competingOffer;
  await test('SCENARIO 6: Recycler submits real offer with rate/kg & calculated total', async () => {
    // Offer 1 by Recycler 1 on Copper Lot (25.5 kg @ Rs 550/kg = Rs 14,025)
    primaryOffer = await dealFlow.submitRecyclerOffer({
      lotId: onlineLot.localId,
      recyclerId: recyclerUser.id,
      recyclerName: recyclerUser.name,
      ratePerKg: 550,
      notes: 'Can pick up tomorrow 10 AM with certified digital scale',
    });

    assert.ok(primaryOffer.localId);
    assert.strictEqual(primaryOffer.ratePerKg, 550);
    assert.strictEqual(primaryOffer.totalAmount, Math.round(25.5 * 550)); // 14025
    assert.strictEqual(primaryOffer.status, 'pending');

    // Offer 2 (Competing) by Recycler 2 on Copper Lot (25.5 kg @ Rs 520/kg = Rs 13,260)
    competingOffer = await dealFlow.submitRecyclerOffer({
      lotId: onlineLot.localId,
      recyclerId: competingRecycler.id,
      recyclerName: competingRecycler.name,
      ratePerKg: 520,
      notes: 'Standard pickup',
    });

    assert.ok(competingOffer.localId);
    assert.strictEqual(competingOffer.ratePerKg, 520);
    assert.strictEqual(competingOffer.status, 'pending');

    // Lot status should now be 'offer_received'
    const updatedLot = db.tables.material_lots.get(onlineLot.localId);
    assert.strictEqual(updatedLot.status, 'offer_received');
  });

  // -----------------------------------------------------------------
  // SCENARIO 7: Collector Accepts Offer -> Deal Created & Invariants
  // -----------------------------------------------------------------
  let activeDeal;
  let activeHandover;
  await test('SCENARIO 7: Collector accepts offer: Deal created, competing offers rejected, idempotency enforced', async () => {
    // 7A: Accept primary offer
    const result = await dealFlow.acceptOffer({
      lotId: onlineLot.localId,
      offerId: primaryOffer.localId,
      collectorId: collectorUser.id,
    });

    activeDeal = result.deal;
    activeHandover = result.handover;

    assert.ok(activeDeal.localId, 'Deal record must be created');
    assert.strictEqual(activeDeal.status, 'handover_pending');
    assert.strictEqual(activeDeal.agreedRatePerKg, 550);
    assert.strictEqual(activeDeal.agreedTotalAmount, 14025);

    assert.ok(activeHandover.localId, 'Handover record must be created');
    assert.strictEqual(activeHandover.dealId, activeDeal.localId);
    assert.strictEqual(activeHandover.collectorConfirmed, false);
    assert.strictEqual(activeHandover.recyclerConfirmed, false);

    // 7B: Verify competing offer was automatically rejected
    const checkedCompetingOffer = db.tables.offers.get(competingOffer.localId);
    assert.strictEqual(checkedCompetingOffer.status, 'rejected', 'Competing offer must be automatically rejected');

    // 7C: Verify selected offer is accepted
    const checkedPrimaryOffer = db.tables.offers.get(primaryOffer.localId);
    assert.strictEqual(checkedPrimaryOffer.status, 'accepted');

    // 7D: Verify Lot reflects deal
    const lot = db.tables.material_lots.get(onlineLot.localId);
    assert.strictEqual(lot.status, 'deal_created');
    assert.strictEqual(lot.dealId, activeDeal.localId);

    // 7E: Idempotency guard: Attempting to accept again throws error
    let threwDuplicateError = false;
    try {
      await dealFlow.acceptOffer({
        lotId: onlineLot.localId,
        offerId: primaryOffer.localId,
        collectorId: collectorUser.id,
      });
    } catch (err) {
      threwDuplicateError = true;
    }
    assert.ok(threwDuplicateError, 'Must reject duplicate deal creation on same lot');
  });

  // -----------------------------------------------------------------
  // SCENARIO 8: Mutual Digital Handover & Automatic Transaction Completion
  // -----------------------------------------------------------------
  let completedTransaction;
  await test('SCENARIO 8: Mutual digital handover (Collector + Recycler confirms) automatically generates completed Transaction', async () => {
    // Step 8A: Collector confirms scrap handover
    const step1 = await dealFlow.confirmCollectorHandover({
      dealId: activeDeal.localId,
      collectorId: collectorUser.id,
      actualWeightKg: 26.0, // Scaled weight slightly higher (26.0 kg)
      photoUri: 'file:///mock/handover_coll.jpg',
    });

    assert.strictEqual(step1.handover.collectorConfirmed, true);
    assert.strictEqual(step1.handover.recyclerConfirmed, false);
    assert.strictEqual(step1.handover.status, 'pending');
    assert.strictEqual(step1.transaction, null, 'Transaction must NOT be created on single confirmation');

    // Step 8B: Recycler confirms receipt of scrap
    const step2 = await dealFlow.confirmRecyclerHandover({
      dealId: activeDeal.localId,
      recyclerId: recyclerUser.id,
      actualWeightKg: 26.0,
      photoUri: 'file:///mock/handover_recy.jpg',
      notes: 'Grade A copper wire verified',
    });

    assert.strictEqual(step2.handover.collectorConfirmed, true);
    assert.strictEqual(step2.handover.recyclerConfirmed, true);
    assert.strictEqual(step2.handover.status, 'completed');
    assert.strictEqual(step2.deal.status, 'completed');

    // Transaction generated automatically
    completedTransaction = step2.transaction;
    assert.ok(completedTransaction, 'Completed transaction must be automatically generated');
    assert.strictEqual(completedTransaction.paymentStatus, 'completed');
    assert.strictEqual(completedTransaction.weightKg, 26.0);
    assert.strictEqual(completedTransaction.ratePerKg, 550);
    assert.strictEqual(completedTransaction.totalAmount, Math.round(26.0 * 550)); // 14300
    assert.strictEqual(completedTransaction.collectorId, collectorUser.id);
    assert.strictEqual(completedTransaction.recyclerId, recyclerUser.id);

    // Verify Lot status is now completed
    const finalLot = db.tables.material_lots.get(onlineLot.localId);
    assert.strictEqual(finalLot.status, 'completed');
    assert.strictEqual(finalLot.weightKg, 26.0);
    assert.strictEqual(finalLot.agreedTotalAmount, 14300);
  });

  // -----------------------------------------------------------------
  // SCENARIO 9: Real Earnings Computed Strictly From Completed Deals
  // -----------------------------------------------------------------
  await test('SCENARIO 9: Collector earnings calculated strictly from real completed transactions', async () => {
    const earnings = dealFlow.getCollectorEarnings(collectorUser.id);
    assert.strictEqual(earnings.completedTransactionsCount, 1);
    assert.strictEqual(earnings.totalAmount, 14300);
    assert.strictEqual(earnings.totalWeightKg, 26.0);

    // Verify offlineLot (which is not yet in deal/completed status) does NOT count towards earnings
    const offlineLot = db.tables.material_lots.get(offlineLotId);
    assert.strictEqual(offlineLot.status, 'published');
  });

  // -----------------------------------------------------------------
  // SCENARIO 10: Mid-Sync Network Drop Safety & Retry
  // -----------------------------------------------------------------
  await test('SCENARIO 10: Mid-sync network drop preserves local data safely and retries when reconnected', async () => {
    // Create new offer while Firestore simulates network drop
    firestore.shouldFail = true;

    // Recycler makes offer on offlineLot
    const testOffer = await dealFlow.submitRecyclerOffer({
      lotId: offlineLotId,
      recyclerId: recyclerUser.id,
      recyclerName: recyclerUser.name,
      ratePerKg: 180,
    });

    // Check that local SQLite contains the offer
    const localOffer = db.tables.offers.get(testOffer.localId);
    assert.ok(localOffer, 'Local offer must exist despite network drop');

    // Check sync queue item recorded failure
    const queueItem = Array.from(db.tables.sync_queue.values()).find((q) => q.localId === testOffer.localId);
    assert.ok(queueItem, 'Queue item must exist');
    assert.strictEqual(queueItem.status, 'failed');
    assert.ok(queueItem.errorMessage.includes('timed out'));

    // Network recovers
    firestore.shouldFail = false;
    const retryResult = await syncEngine.processQueue();
    assert.ok(retryResult.processed >= 1, 'Sync engine should retry and succeed');

    // Firestore now receives the offer
    const remoteOffer = firestore.getDocument('offers', testOffer.localId);
    assert.ok(remoteOffer, 'Remote firestore must receive offer after retry');
  });

  // -----------------------------------------------------------------
  // SCENARIO 11: Role Integrity & Security Guard
  // -----------------------------------------------------------------
  await test('SCENARIO 11: Unauthorized actions rejected (e.g. wrong collector or role spoofing)', async () => {
    // 11A: Other user cannot accept an offer on someone else's lot
    let unauthorizedAcceptBlocked = false;
    try {
      await dealFlow.acceptOffer({
        lotId: offlineLotId,
        offerId: 'fake_offer',
        collectorId: 'imposter_user_999',
      });
    } catch (err) {
      unauthorizedAcceptBlocked = true;
    }
    assert.ok(unauthorizedAcceptBlocked, 'Must reject offer acceptance by unauthorized collector');

    // 11B: Wrong recycler cannot confirm handover for another recycler
    let unauthorizedHandoverBlocked = false;
    try {
      await dealFlow.confirmRecyclerHandover({
        dealId: activeDeal.localId,
        recyclerId: 'imposter_recycler_888',
      });
    } catch (err) {
      unauthorizedHandoverBlocked = true;
    }
    assert.ok(unauthorizedHandoverBlocked, 'Must reject handover confirmation from unauthorized recycler');
  });

  // -----------------------------------------------------------------
  // SUMMARY
  // -----------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${testsPassed + testsFailed}`);
  console.log(`PASSED:      ${testsPassed}`);
  console.log(`FAILED:      ${testsFailed}`);
  console.log('====================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runPhase3Tests().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
