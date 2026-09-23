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

  -- Offline Sync Queue table
  CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    entityType TEXT NOT NULL, -- 'material_lot', 'user', 'offer', 'transaction', 'photo'
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

  -- Indices for faster lookups
  CREATE INDEX IF NOT EXISTS idx_lots_collector ON material_lots(collectorId);
  CREATE INDEX IF NOT EXISTS idx_lots_status ON material_lots(status);
  CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
  CREATE INDEX IF NOT EXISTS idx_offers_lot ON offers(lotId);
  CREATE INDEX IF NOT EXISTS idx_tx_collector ON transactions(collectorId);
  CREATE INDEX IF NOT EXISTS idx_tx_recycler ON transactions(recyclerId);
`;
