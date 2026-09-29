export const CREATE_TABLES_SQL = `
  -- Users table (cached profile & auth metadata)
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phoneNumber TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT,
    businessName TEXT,
    contactName TEXT,
    address TEXT,
    location TEXT,
    language TEXT DEFAULT 'hi',
    verificationStatus TEXT DEFAULT 'pending',
    identityVerificationStatus TEXT DEFAULT 'not_started',
    identityVerificationProvider TEXT,
    identityVerificationRef TEXT,
    identityVerifiedAt TEXT,
    authorizationVerificationStatus TEXT DEFAULT 'not_started',
    authorizationVerificationProvider TEXT,
    authorizationVerificationRef TEXT,
    authorizationVerifiedAt TEXT,
    serviceRadiusKm REAL DEFAULT 25,
    serviceArea TEXT,
    acceptedMaterials TEXT,
    pickupAvailable INTEGER DEFAULT 1,
    isAvailable INTEGER DEFAULT 1,
    latitude REAL,
    longitude REAL,
    remoteId TEXT,
    syncStatus TEXT DEFAULT 'synced',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    lastSyncedAt TEXT
  );

  -- Material lots table
  CREATE TABLE IF NOT EXISTS material_lots (
    localId TEXT PRIMARY KEY,
    remoteId TEXT,
    lotNumber TEXT,
    collectorId TEXT NOT NULL,
    categoryId TEXT NOT NULL,
    condition TEXT DEFAULT 'mixed',
    weightKg REAL NOT NULL,
    photos TEXT, -- JSON array of local/remote photo paths
    locationCity TEXT,
    locationArea TEXT,
    status TEXT NOT NULL DEFAULT 'created',
    estimatedMinAmount REAL,
    estimatedMaxAmount REAL,
    agreedRatePerKg REAL,
    agreedTotalAmount REAL,
    selectedRecyclerId TEXT,
    pickupOption TEXT,
    syncStatus TEXT NOT NULL DEFAULT 'pending',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    lastSyncedAt TEXT
  );

  -- Offers table
  CREATE TABLE IF NOT EXISTS offers (
    localId TEXT PRIMARY KEY,
    remoteId TEXT,
    lotId TEXT NOT NULL,
    recyclerId TEXT NOT NULL,
    recyclerName TEXT,
    ratePerKg REAL NOT NULL,
    totalAmount REAL NOT NULL,
    pickupOption TEXT NOT NULL,
    comments TEXT,
    status TEXT NOT NULL DEFAULT 'sent',
    timeline TEXT, -- JSON array of OfferTimelineEvent
    syncStatus TEXT NOT NULL DEFAULT 'pending',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    lastSyncedAt TEXT
  );

  -- Transactions table
  CREATE TABLE IF NOT EXISTS transactions (
    localId TEXT PRIMARY KEY,
    remoteId TEXT,
    transactionNumber TEXT NOT NULL,
    lotId TEXT NOT NULL,
    collectorId TEXT NOT NULL,
    recyclerId TEXT NOT NULL,
    materialName TEXT NOT NULL,
    weightKg REAL NOT NULL,
    ratePerKg REAL NOT NULL,
    totalAmount REAL NOT NULL,
    paymentMethod TEXT NOT NULL,
    paymentStatus TEXT NOT NULL,
    date TEXT NOT NULL,
    syncStatus TEXT NOT NULL DEFAULT 'pending',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    lastSyncedAt TEXT
  );

  -- Deals table
  CREATE TABLE IF NOT EXISTS deals (
    localId TEXT PRIMARY KEY,
    remoteId TEXT,
    lotId TEXT NOT NULL,
    collectorId TEXT NOT NULL,
    recyclerId TEXT NOT NULL,
    offerId TEXT NOT NULL,
    materialCategoryId TEXT NOT NULL,
    materialName TEXT NOT NULL,
    agreedRatePerKg REAL NOT NULL,
    agreedTotalAmount REAL NOT NULL,
    agreedWeightKg REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'accepted',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    lastSyncedAt TEXT,
    syncStatus TEXT DEFAULT 'pending'
  );

  -- Handovers table
  CREATE TABLE IF NOT EXISTS handovers (
    localId TEXT PRIMARY KEY,
    remoteId TEXT,
    dealId TEXT NOT NULL,
    lotId TEXT NOT NULL,
    collectorId TEXT NOT NULL,
    recyclerId TEXT NOT NULL,
    actualWeightKg REAL,
    photoUri TEXT,
    notes TEXT,
    collectorConfirmed INTEGER NOT NULL DEFAULT 0,
    recyclerConfirmed INTEGER NOT NULL DEFAULT 0,
    collectorConfirmedAt TEXT,
    recyclerConfirmedAt TEXT,
    latitude REAL,
    longitude REAL,
    status TEXT NOT NULL DEFAULT 'pending',
    completedAt TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    lastSyncedAt TEXT,
    syncStatus TEXT DEFAULT 'pending'
  );

  -- Offline Sync Queue table
  CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    entityType TEXT NOT NULL, -- 'material_lot', 'user', 'offer', 'transaction', 'deal', 'handover', 'photo'
    localId TEXT NOT NULL,
    remoteId TEXT,
    operationType TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
    payload TEXT NOT NULL, -- Serialized JSON of record
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'syncing', 'synced', 'failed'
    retryCount INTEGER NOT NULL DEFAULT 0,
    errorMessage TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  -- Material Prices table
  CREATE TABLE IF NOT EXISTS material_prices (
    localId TEXT PRIMARY KEY,
    remoteId TEXT,
    materialCategory TEXT NOT NULL,
    materialName TEXT,
    recyclerId TEXT,
    recyclerName TEXT,
    ratePerKg REAL NOT NULL,
    minRatePerKg REAL,
    maxRatePerKg REAL,
    effectiveFrom TEXT NOT NULL,
    effectiveUntil TEXT,
    locationCity TEXT,
    locationArea TEXT,
    sourceType TEXT NOT NULL DEFAULT 'recycler_rate', -- 'recycler_rate', 'completed_transaction', 'market_reference'
    syncStatus TEXT NOT NULL DEFAULT 'pending',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    lastSyncedAt TEXT
  );

  -- AI Predictions table
  CREATE TABLE IF NOT EXISTS ai_predictions (
    localId TEXT PRIMARY KEY,
    remoteId TEXT,
    entityId TEXT NOT NULL,
    modelName TEXT NOT NULL,
    modelVersion TEXT NOT NULL,
    predictedCategory TEXT NOT NULL,
    confidence REAL NOT NULL,
    alternativesJson TEXT,
    userConfirmed INTEGER NOT NULL DEFAULT 1,
    finalCategory TEXT NOT NULL,
    feedbackNotes TEXT,
    syncStatus TEXT NOT NULL DEFAULT 'pending',
    createdAt TEXT NOT NULL,
    lastSyncedAt TEXT
  );

  -- AI Price Estimates table
  CREATE TABLE IF NOT EXISTS ai_price_estimates (
    localId TEXT PRIMARY KEY,
    remoteId TEXT,
    lotId TEXT NOT NULL,
    modelName TEXT NOT NULL,
    modelVersion TEXT NOT NULL,
    estimatedMin REAL NOT NULL,
    estimatedMax REAL NOT NULL,
    estimatedAverage REAL NOT NULL,
    confidence REAL NOT NULL,
    basisJson TEXT,
    dataPointCount INTEGER NOT NULL DEFAULT 0,
    lastMarketDataAt TEXT,
    syncStatus TEXT NOT NULL DEFAULT 'pending',
    createdAt TEXT NOT NULL,
    lastSyncedAt TEXT
  );

  -- AI Anomaly Events table
  CREATE TABLE IF NOT EXISTS ai_anomaly_events (
    localId TEXT PRIMARY KEY,
    remoteId TEXT,
    transactionId TEXT,
    lotId TEXT,
    modelName TEXT NOT NULL,
    modelVersion TEXT NOT NULL,
    anomalyScore REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'normal',
    reason TEXT,
    signalsJson TEXT,
    syncStatus TEXT NOT NULL DEFAULT 'pending',
    createdAt TEXT NOT NULL,
    lastSyncedAt TEXT
  );

  -- Payments table (Phase 6)
  CREATE TABLE IF NOT EXISTS payments (
    paymentId TEXT PRIMARY KEY,
    remoteId TEXT,
    dealId TEXT NOT NULL,
    transactionId TEXT,
    lotId TEXT,
    collectorId TEXT NOT NULL,
    recyclerId TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'INR',
    method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    initiatedAt TEXT NOT NULL,
    completedAt TEXT,
    provider TEXT,
    providerReference TEXT,
    cashPaidConfirmedByRecycler INTEGER DEFAULT 0,
    cashPaidConfirmedAt TEXT,
    cashReceivedConfirmedByCollector INTEGER DEFAULT 0,
    cashReceivedConfirmedAt TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    syncStatus TEXT NOT NULL DEFAULT 'pending',
    lastSyncedAt TEXT
  );

  -- Notifications table (Phase 6)
  CREATE TABLE IF NOT EXISTS notifications (
    notificationId TEXT PRIMARY KEY,
    remoteId TEXT,
    userId TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    entityType TEXT NOT NULL,
    entityId TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT,
    syncStatus TEXT NOT NULL DEFAULT 'pending',
    lastSyncedAt TEXT
  );

  -- Device Tokens table (Phase 6)
  CREATE TABLE IF NOT EXISTS device_tokens (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    token TEXT NOT NULL,
    platform TEXT NOT NULL,
    deviceModel TEXT,
    updatedAt TEXT NOT NULL
  );

  -- Traceability Records table (Phase 7)
  CREATE TABLE IF NOT EXISTS traceability_records (
    traceabilityId TEXT PRIMARY KEY,
    lotId TEXT NOT NULL,
    dealId TEXT,
    handoverId TEXT,
    transactionId TEXT,
    paymentId TEXT,
    collectorId TEXT NOT NULL,
    recyclerId TEXT,
    materialCategory TEXT NOT NULL,
    initialMaterial TEXT NOT NULL,
    finalMaterial TEXT,
    aiPredictedMaterial TEXT,
    estimatedWeight REAL NOT NULL,
    finalWeight REAL,
    weightDifference REAL,
    weightDifferenceDirection TEXT DEFAULT 'exact',
    collectionLocation TEXT,
    handoverLocation TEXT,
    collectionTimestamp TEXT NOT NULL,
    handoverTimestamp TEXT,
    completionTimestamp TEXT,
    status TEXT NOT NULL DEFAULT 'created',
    handoverReference TEXT,
    qrReferenceToken TEXT NOT NULL,
    collectorConfirmedHandover INTEGER DEFAULT 0,
    recyclerConfirmedHandover INTEGER DEFAULT 0,
    paymentMethod TEXT,
    paymentStatus TEXT,
    agreedRatePerKg REAL,
    agreedTotalAmount REAL,
    hasConflict INTEGER DEFAULT 0,
    conflictDetails TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    syncStatus TEXT NOT NULL DEFAULT 'pending',
    lastSyncedAt TEXT
  );

  -- Traceability Events table (Phase 7 - Immutable audit trail)
  CREATE TABLE IF NOT EXISTS traceability_events (
    eventId TEXT PRIMARY KEY,
    traceabilityId TEXT NOT NULL,
    lotId TEXT NOT NULL,
    dealId TEXT,
    handoverId TEXT,
    transactionId TEXT,
    eventType TEXT NOT NULL,
    actorId TEXT NOT NULL,
    actorType TEXT NOT NULL,
    previousStatus TEXT,
    newStatus TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    location TEXT,
    metadata TEXT,
    syncStatus TEXT NOT NULL DEFAULT 'pending',
    createdAt TEXT NOT NULL
  );

  -- Handover Confirmations table (Phase 7)
  CREATE TABLE IF NOT EXISTS handover_confirmations (
    confirmationId TEXT PRIMARY KEY,
    handoverId TEXT NOT NULL,
    lotId TEXT NOT NULL,
    dealId TEXT NOT NULL,
    confirmedBy TEXT NOT NULL,
    userType TEXT NOT NULL,
    confirmationType TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    location TEXT,
    weightConfirmed REAL NOT NULL,
    notes TEXT,
    syncStatus TEXT NOT NULL DEFAULT 'pending',
    createdAt TEXT NOT NULL
  );

  -- Handover Photos table (Phase 7)
  CREATE TABLE IF NOT EXISTS handover_photos (
    photoId TEXT PRIMARY KEY,
    lotId TEXT NOT NULL,
    handoverId TEXT NOT NULL,
    storageReference TEXT NOT NULL,
    capturedAt TEXT NOT NULL,
    capturedBy TEXT NOT NULL,
    photoType TEXT NOT NULL DEFAULT 'at_handover',
    syncStatus TEXT NOT NULL DEFAULT 'pending',
    createdAt TEXT NOT NULL
  );

  -- Indices for faster lookups
  CREATE INDEX IF NOT EXISTS idx_lots_collector ON material_lots(collectorId);
  CREATE INDEX IF NOT EXISTS idx_lots_status ON material_lots(status);
  CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
  CREATE INDEX IF NOT EXISTS idx_offers_lot ON offers(lotId);
  CREATE INDEX IF NOT EXISTS idx_deals_collector ON deals(collectorId);
  CREATE INDEX IF NOT EXISTS idx_deals_recycler ON deals(recyclerId);
  CREATE INDEX IF NOT EXISTS idx_deals_lot ON deals(lotId);
  CREATE INDEX IF NOT EXISTS idx_handovers_deal ON handovers(dealId);
  CREATE INDEX IF NOT EXISTS idx_tx_collector ON transactions(collectorId);
  CREATE INDEX IF NOT EXISTS idx_tx_recycler ON transactions(recyclerId);
  CREATE INDEX IF NOT EXISTS idx_prices_material ON material_prices(materialCategory);
  CREATE INDEX IF NOT EXISTS idx_prices_recycler ON material_prices(recyclerId);
  CREATE INDEX IF NOT EXISTS idx_ai_predictions_entity ON ai_predictions(entityId);
  CREATE INDEX IF NOT EXISTS idx_ai_prices_lot ON ai_price_estimates(lotId);
  CREATE INDEX IF NOT EXISTS idx_ai_anomaly_tx ON ai_anomaly_events(transactionId);
  CREATE INDEX IF NOT EXISTS idx_payments_deal ON payments(dealId);
  CREATE INDEX IF NOT EXISTS idx_payments_tx ON payments(transactionId);
  CREATE INDEX IF NOT EXISTS idx_payments_collector ON payments(collectorId);
  CREATE INDEX IF NOT EXISTS idx_payments_recycler ON payments(recyclerId);
  CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userId);
  CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(userId, read);
  CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens(userId);
  CREATE INDEX IF NOT EXISTS idx_traceability_lot ON traceability_records(lotId);
  CREATE INDEX IF NOT EXISTS idx_traceability_deal ON traceability_records(dealId);
  CREATE INDEX IF NOT EXISTS idx_traceability_handover ON traceability_records(handoverId);
  CREATE INDEX IF NOT EXISTS idx_traceability_qr ON traceability_records(qrReferenceToken);
  CREATE INDEX IF NOT EXISTS idx_traceability_status ON traceability_records(status);
  CREATE INDEX IF NOT EXISTS idx_events_traceability ON traceability_events(traceabilityId);
  CREATE INDEX IF NOT EXISTS idx_events_lot ON traceability_events(lotId);
  CREATE INDEX IF NOT EXISTS idx_events_type ON traceability_events(eventType);
  CREATE INDEX IF NOT EXISTS idx_ho_conf_handover ON handover_confirmations(handoverId);
  CREATE INDEX IF NOT EXISTS idx_ho_photos_handover ON handover_photos(handoverId);
`;
