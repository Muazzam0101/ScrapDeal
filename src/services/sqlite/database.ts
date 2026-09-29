import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';

const DB_NAME = 'scrapdeal.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Gets or initializes the SQLite database singleton with mutex protection.
 * Ensures only one connection instance is opened and DDL migrations are serialized.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const db = await SQLite.openDatabaseAsync(DB_NAME);

      try {
        await db.execAsync('PRAGMA foreign_keys = ON;');
      } catch {}

      // Execute DDL schema statement by statement to guarantee all tables are created
      const statements = CREATE_TABLES_SQL.split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        try {
          await db.execAsync(`${statement};`);
        } catch (stmtErr) {
          // Table or index may already exist
        }
      }

      // Run incremental schema migrations for older local databases
      await runLotMigrations(db);
      await runSyncQueueMigrations(db);
      await runPhase4Migrations(db);
      await runPhase5Migrations(db);
      await runPhase6Migrations(db);
      await runPhase7Migrations(db);
      await runPhase8Migrations(db);

      dbInstance = db;
      return db;
    } catch (error) {
      initPromise = null; // Reset so retry can succeed
      console.error('[SQLite] Failed to initialize database:', error);
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Ensures all columns for material_lots exist even on databases created in earlier phases.
 */
async function runLotMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const lotColumns = [
    'remoteId TEXT',
    'lotNumber TEXT',
    'collectorId TEXT DEFAULT "COLLECTOR-LOCAL"',
    'categoryId TEXT DEFAULT "copper"',
    'condition TEXT DEFAULT "mixed"',
    'weightKg REAL DEFAULT 1',
    'photos TEXT',
    'locationCity TEXT DEFAULT "पुणे"',
    'locationArea TEXT DEFAULT "महाराष्ट्र"',
    'status TEXT DEFAULT "created"',
    'estimatedMinAmount REAL',
    'estimatedMaxAmount REAL',
    'agreedRatePerKg REAL',
    'agreedTotalAmount REAL',
    'selectedRecyclerId TEXT',
    'pickupOption TEXT DEFAULT "collector_drop"',
    'syncStatus TEXT DEFAULT "pending"',
    'createdAt TEXT',
    'updatedAt TEXT',
    'lastSyncedAt TEXT',
  ];

  for (const col of lotColumns) {
    try {
      await db.execAsync(`ALTER TABLE material_lots ADD COLUMN ${col};`);
    } catch {
      // Column already exists
    }
  }
}

/**
 * Ensures all columns for sync_queue exist.
 */
async function runSyncQueueMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const queueColumns = [
    'remoteId TEXT',
    'operationType TEXT DEFAULT "CREATE"',
    'payload TEXT',
    'status TEXT DEFAULT "pending"',
    'retryCount INTEGER DEFAULT 0',
    'errorMessage TEXT',
    'createdAt TEXT',
    'updatedAt TEXT',
  ];

  for (const col of queueColumns) {
    try {
      await db.execAsync(`ALTER TABLE sync_queue ADD COLUMN ${col};`);
    } catch {
      // Column already exists
    }
  }
}

async function runPhase5Migrations(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    await db.execAsync(`
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

      CREATE INDEX IF NOT EXISTS idx_ai_predictions_entity ON ai_predictions(entityId);
      CREATE INDEX IF NOT EXISTS idx_ai_prices_lot ON ai_price_estimates(lotId);
      CREATE INDEX IF NOT EXISTS idx_ai_anomaly_tx ON ai_anomaly_events(transactionId);
    `);
  } catch (e) {
    console.warn('[SQLite] Phase 5 migration notice:', e);
  }
}

async function runPhase4Migrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const userColumns = [
    'identityVerificationStatus TEXT DEFAULT "not_started"',
    'identityVerificationProvider TEXT',
    'identityVerificationRef TEXT',
    'identityVerifiedAt TEXT',
    'authorizationVerificationStatus TEXT DEFAULT "not_started"',
    'authorizationVerificationProvider TEXT',
    'authorizationVerificationRef TEXT',
    'authorizationVerifiedAt TEXT',
    'serviceRadiusKm REAL DEFAULT 25',
    'serviceArea TEXT',
    'acceptedMaterials TEXT',
    'pickupAvailable INTEGER DEFAULT 1',
    'isAvailable INTEGER DEFAULT 1',
    'latitude REAL',
    'longitude REAL',
  ];

  for (const col of userColumns) {
    try {
      await db.execAsync(`ALTER TABLE users ADD COLUMN ${col};`);
    } catch {
      // Column likely already exists
    }
  }
}

async function runPhase6Migrations(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    const txColumns = [
      'dealId TEXT',
      'paymentId TEXT',
      'handoverStatus TEXT DEFAULT "pending"',
      'transactionStatus TEXT DEFAULT "pending"',
      'materialCategory TEXT',
      'finalWeight REAL',
      'agreedPrice REAL',
      'completedAt TEXT',
    ];
    for (const col of txColumns) {
      try {
        await db.execAsync(`ALTER TABLE transactions ADD COLUMN ${col};`);
      } catch {}
    }

    await db.execAsync(`
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

      CREATE TABLE IF NOT EXISTS device_tokens (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        token TEXT NOT NULL,
        platform TEXT NOT NULL,
        deviceModel TEXT,
        updatedAt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_payments_deal ON payments(dealId);
      CREATE INDEX IF NOT EXISTS idx_payments_tx ON payments(transactionId);
      CREATE INDEX IF NOT EXISTS idx_payments_collector ON payments(collectorId);
      CREATE INDEX IF NOT EXISTS idx_payments_recycler ON payments(recyclerId);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userId);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(userId, read);
      CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens(userId);
    `);
  } catch (e) {
    console.warn('[SQLite] Phase 6 migration notice:', e);
  }
}

/**
 * Ensures Phase 7 Digital Traceability tables and indices exist in local SQLite.
 */
async function runPhase7Migrations(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    await db.execAsync(`
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
    `);
  } catch (e) {
    console.warn('[SQLite] Phase 7 migration notice:', e);
  }
}

/**
 * Phase 8 Schema Migration: Safety Guides and Field Feedback.
 */
async function runPhase8Migrations(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS safety_guides (
        id TEXT PRIMARY KEY,
        materialCategory TEXT NOT NULL,
        title TEXT NOT NULL,
        severity TEXT NOT NULL,
        doItems TEXT NOT NULL,
        dontItems TEXT NOT NULL,
        imageReferences TEXT,
        audioReferences TEXT,
        language TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        updatedAt TEXT NOT NULL,
        syncStatus TEXT DEFAULT 'synced',
        lastSyncedAt TEXT
      );

      CREATE TABLE IF NOT EXISTS field_feedback (
        id TEXT PRIMARY KEY,
        userType TEXT NOT NULL,
        screen TEXT NOT NULL,
        issueType TEXT NOT NULL,
        comments TEXT,
        language TEXT NOT NULL,
        syncStatus TEXT DEFAULT 'pending',
        createdAt TEXT NOT NULL,
        lastSyncedAt TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_safety_guides_cat ON safety_guides(materialCategory);
      CREATE INDEX IF NOT EXISTS idx_safety_guides_lang ON safety_guides(language);
      CREATE INDEX IF NOT EXISTS idx_field_feedback_sync ON field_feedback(syncStatus);
    `);
  } catch (e) {
    console.warn('[SQLite] Phase 8 migration notice:', e);
  }
}

/**
 * Synchronous accessor if already open.
 */
export function getDatabaseSync(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync(DB_NAME);
    const statements = CREATE_TABLES_SQL.split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const stmt of statements) {
      try {
        dbInstance.execSync(`${stmt};`);
      } catch {}
    }
  }
  return dbInstance;
}

export function setDatabaseInstanceForTesting(customDb: any) {
  dbInstance = customDb;
  initPromise = Promise.resolve(customDb);
}

/**
 * Clears all local data (for testing / reset flows).
 */
export async function clearAllLocalData(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM sync_queue;
    DELETE FROM transactions;
    DELETE FROM payments;
    DELETE FROM notifications;
    DELETE FROM device_tokens;
    DELETE FROM offers;
    DELETE FROM material_lots;
    DELETE FROM users;
    DELETE FROM deals;
    DELETE FROM handovers;
    DELETE FROM material_prices;
    DELETE FROM ai_predictions;
    DELETE FROM ai_price_estimates;
    DELETE FROM ai_anomaly_events;
    DELETE FROM traceability_records;
    DELETE FROM traceability_events;
    DELETE FROM handover_confirmations;
    DELETE FROM handover_photos;
    DELETE FROM safety_guides;
    DELETE FROM field_feedback;
  `);
}
