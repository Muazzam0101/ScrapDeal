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
    // Execute DDL schema
    await dbInstance.execAsync(CREATE_TABLES_SQL);
    await runPhase4Migrations(dbInstance);
    isInitialized = true;
    return dbInstance;
  } catch (error) {
    console.error('[SQLite] Failed to initialize database:', error);
    throw error;
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
  `);
}
