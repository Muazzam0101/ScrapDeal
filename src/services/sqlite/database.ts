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
    isInitialized = true;
    return dbInstance;
  } catch (error) {
    console.error('[SQLite] Failed to initialize database:', error);
    throw error;
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
