export const CREATE_TABLES_SQL = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

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
`;
