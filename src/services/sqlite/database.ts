import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';

const DB_NAME = 'scrapdeal.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let isInitialized = false;

/**
 * Gets or initializes the SQLite database singleton.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance && isInitialized) {
    return dbInstance;
  }

  try {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    try {
      await dbInstance.execAsync('PRAGMA foreign_keys = ON;');
    } catch {}
    // Execute DDL schema
    await dbInstance.execAsync(CREATE_TABLES_SQL);
    await runPhase4Migrations(dbInstance);
    await runPhase5Migrations(dbInstance);
    isInitialized = true;
    return dbInstance;
  } catch (error) {
    console.error('[SQLite] Failed to initialize database:', error);
    throw error;
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

/**
 * Synchronous accessor if already open.
 */
export function getDatabaseSync(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync(DB_NAME);
    dbInstance.execSync(CREATE_TABLES_SQL);
    isInitialized = true;
  }
  return dbInstance;
}

export function setDatabaseInstanceForTesting(customDb: any) {
  dbInstance = customDb;
  isInitialized = true;
}

/**
 * Clears all local data (for testing / reset flows).
 */
export async function clearAllLocalData(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM sync_queue;
    DELETE FROM transactions;
    DELETE FROM offers;
    DELETE FROM material_lots;
    DELETE FROM users;
    DELETE FROM deals;
    DELETE FROM handovers;
    DELETE FROM material_prices;
    DELETE FROM ai_predictions;
    DELETE FROM ai_price_estimates;
    DELETE FROM ai_anomaly_events;
  `);
}
