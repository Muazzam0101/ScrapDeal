import { getDatabase } from '../database';
import { MaterialLot, SyncStatus, LotStatus, MaterialCategoryId, MaterialCondition, PickupOption } from '../../../types';

export const lotRepository = {
  /**
   * Inserts a locally created lot into SQLite.
   */
  async createLot(lot: MaterialLot): Promise<MaterialLot> {
    const db = await getDatabase();
    const photosJson = JSON.stringify(lot.photos || lot.photoUrls || []);

    const params = [
      String(lot.localId || `LOT-${Date.now()}`),
      lot.remoteId ? String(lot.remoteId) : null,
      String(lot.lotNumber || `LOT-${Date.now().toString().slice(-6)}`),
      String(lot.collectorId || 'COLLECTOR-LOCAL'),
      String(lot.categoryId || 'copper'),
      String(lot.condition || 'mixed'),
      Number(lot.weightKg) || 1,
      photosJson,
      String(lot.locationCity || 'पुणे'),
      String(lot.locationArea || 'महाराष्ट्र'),
      String(lot.status || 'created'),
      lot.estimatedMinAmount !== undefined && lot.estimatedMinAmount !== null ? Number(lot.estimatedMinAmount) : null,
      lot.estimatedMaxAmount !== undefined && lot.estimatedMaxAmount !== null ? Number(lot.estimatedMaxAmount) : null,
      lot.agreedRatePerKg !== undefined && lot.agreedRatePerKg !== null ? Number(lot.agreedRatePerKg) : null,
      lot.agreedTotalAmount !== undefined && lot.agreedTotalAmount !== null ? Number(lot.agreedTotalAmount) : null,
      lot.selectedRecyclerId ? String(lot.selectedRecyclerId) : null,
      String(lot.pickupOption || 'collector_drop'),
      String(lot.syncStatus || 'pending'),
      String(lot.createdAt || new Date().toISOString()),
      String(lot.updatedAt || new Date().toISOString()),
      lot.lastSyncedAt ? String(lot.lastSyncedAt) : null,
    ];

    try {
      await db.runAsync(
        `INSERT INTO material_lots (
          localId, remoteId, lotNumber, collectorId, categoryId, condition, weightKg,
          photos, locationCity, locationArea, status, estimatedMinAmount,
          estimatedMaxAmount, agreedRatePerKg, agreedTotalAmount, selectedRecyclerId,
          pickupOption, syncStatus, createdAt, updatedAt, lastSyncedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params
      );
    } catch (insertErr) {
      console.warn('[lotRepository] createLot insert failed, ensuring table schema and retrying:', insertErr);
      await this.ensureTableSchema(db);
      await db.runAsync(
        `INSERT INTO material_lots (
          localId, remoteId, lotNumber, collectorId, categoryId, condition, weightKg,
          photos, locationCity, locationArea, status, estimatedMinAmount,
          estimatedMaxAmount, agreedRatePerKg, agreedTotalAmount, selectedRecyclerId,
          pickupOption, syncStatus, createdAt, updatedAt, lastSyncedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params
      );
    }

    return lot;
  },

  /**
   * Ensures the material_lots table and all required columns exist in SQLite.
   */
  async ensureTableSchema(db: any): Promise<void> {
    try {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS material_lots (
          localId TEXT PRIMARY KEY,
          remoteId TEXT,
          lotNumber TEXT,
          collectorId TEXT NOT NULL,
          categoryId TEXT NOT NULL,
          condition TEXT DEFAULT 'mixed',
          weightKg REAL NOT NULL,
          photos TEXT,
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
      `);

      const columns = [
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

      for (const col of columns) {
        try {
          await db.execAsync(`ALTER TABLE material_lots ADD COLUMN ${col};`);
        } catch {}
      }
    } catch (e) {
      console.warn('[lotRepository] ensureTableSchema notice:', e);
    }
  },

  /**
   * Fetches a lot by localId or remoteId.
   */
  async getLotById(id: string): Promise<MaterialLot | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM material_lots WHERE localId = ? OR remoteId = ?`,
      [id, id]
    );

    if (!row) return null;
    return this.mapRowToLot(row);
  },

  /**
   * Gets all lots created by a specific collector.
   */
  async getLotsByCollector(collectorId: string): Promise<MaterialLot[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM material_lots WHERE collectorId = ? ORDER BY createdAt DESC`,
      [collectorId]
    );
    return rows.map((r) => this.mapRowToLot(r));
  },

  /**
   * Gets all available lots for recyclers to browse.
   */
  async getAvailableLots(): Promise<MaterialLot[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM material_lots WHERE status IN ('created', 'ready', 'published', 'matching', 'offered', 'offer_received') ORDER BY createdAt DESC`
    );
    return rows.map((r) => this.mapRowToLot(r));
  },

  /**
   * Updates lot fields in SQLite.
   */
  async updateLot(lot: Partial<MaterialLot> & { localId: string }): Promise<void> {
    const db = await getDatabase();
    const existing = await this.getLotById(lot.localId);
    if (!existing) return;

    const updatedAt = lot.updatedAt || new Date().toISOString();
    const photosJson = lot.photos ? JSON.stringify(lot.photos) : JSON.stringify(existing.photos);

    await db.runAsync(
      `UPDATE material_lots SET
        status = ?,
        weightKg = ?,
        agreedRatePerKg = ?,
        agreedTotalAmount = ?,
        selectedRecyclerId = ?,
        pickupOption = ?,
        photos = ?,
        syncStatus = ?,
        updatedAt = ?
      WHERE localId = ?`,
      [
        lot.status || existing.status,
        lot.weightKg !== undefined ? lot.weightKg : existing.weightKg,
        lot.agreedRatePerKg !== undefined ? lot.agreedRatePerKg : existing.agreedRatePerKg || null,
        lot.agreedTotalAmount !== undefined ? lot.agreedTotalAmount : existing.agreedTotalAmount || null,
        lot.selectedRecyclerId !== undefined ? lot.selectedRecyclerId : existing.selectedRecyclerId || null,
        lot.pickupOption || existing.pickupOption || null,
        photosJson,
        lot.syncStatus || 'pending',
        updatedAt,
        lot.localId,
      ]
    );
  },

  /**
   * Updates synchronization status and remoteId after a successful sync to Firebase.
   */
  async updateLotSyncStatus(
    localId: string,
    syncStatus: SyncStatus,
    remoteId?: string,
    lastSyncedAt?: string
  ): Promise<void> {
    const db = await getDatabase();
    const syncedTime = lastSyncedAt || new Date().toISOString();

    if (remoteId) {
      await db.runAsync(
        `UPDATE material_lots SET syncStatus = ?, remoteId = ?, lastSyncedAt = ? WHERE localId = ?`,
        [syncStatus, remoteId, syncedTime, localId]
      );
    } else {
      await db.runAsync(
        `UPDATE material_lots SET syncStatus = ?, lastSyncedAt = ? WHERE localId = ?`,
        [syncStatus, syncedTime, localId]
      );
    }
  },

  /**
   * Upserts remote Firestore lots into SQLite cache for offline availability.
   */
  async saveLotsFromRemote(lots: MaterialLot[]): Promise<void> {
    const db = await getDatabase();
    for (const lot of lots) {
      const photosJson = JSON.stringify(lot.photos || lot.photoUrls || []);
      const localId = lot.localId || lot.id;

      await db.runAsync(
        `INSERT INTO material_lots (
          localId, remoteId, lotNumber, collectorId, categoryId, condition, weightKg,
          photos, locationCity, locationArea, status, estimatedMinAmount,
          estimatedMaxAmount, agreedRatePerKg, agreedTotalAmount, selectedRecyclerId,
          pickupOption, syncStatus, createdAt, updatedAt, lastSyncedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?, ?)
        ON CONFLICT(localId) DO UPDATE SET
          remoteId = excluded.remoteId,
          status = excluded.status,
          agreedRatePerKg = excluded.agreedRatePerKg,
          agreedTotalAmount = excluded.agreedTotalAmount,
          selectedRecyclerId = excluded.selectedRecyclerId,
          syncStatus = 'synced',
          updatedAt = excluded.updatedAt,
          lastSyncedAt = excluded.lastSyncedAt`,
        [
          localId,
          lot.remoteId || lot.id,
          lot.lotNumber || `LOT-${lot.id.slice(-6)}`,
          lot.collectorId,
          lot.categoryId,
          lot.condition || 'mixed',
          lot.weightKg,
          photosJson,
          lot.locationCity || 'पुणे',
          lot.locationArea || 'महाराष्ट्र',
          lot.status,
          lot.estimatedMinAmount || null,
          lot.estimatedMaxAmount || null,
          lot.agreedRatePerKg || null,
          lot.agreedTotalAmount || null,
          lot.selectedRecyclerId || null,
          lot.pickupOption || 'collector_drop',
          lot.createdAt,
          lot.updatedAt,
          new Date().toISOString(),
        ]
      );
    }
  },

  /**
   * Helper to map a raw database row to MaterialLot interface.
   */
  mapRowToLot(row: any): MaterialLot {
    let photos: string[] = [];
    try {
      photos = row.photos ? JSON.parse(row.photos) : [];
    } catch {
      photos = [];
    }

    return {
      id: row.localId,
      localId: row.localId,
      remoteId: row.remoteId || undefined,
      lotNumber: row.lotNumber || `LOT-${row.localId.slice(-6)}`,
      collectorId: row.collectorId,
      categoryId: row.categoryId as MaterialCategoryId,
      condition: (row.condition || 'mixed') as MaterialCondition,
      weightKg: row.weightKg,
      approximateWeight: row.weightKg,
      photos,
      photoUrls: photos,
      locationCity: row.locationCity || 'पुणे',
      locationArea: row.locationArea || 'महाराष्ट्र',
      status: row.status as LotStatus,
      estimatedMinAmount: row.estimatedMinAmount || undefined,
      estimatedMaxAmount: row.estimatedMaxAmount || undefined,
      agreedRatePerKg: row.agreedRatePerKg || undefined,
      agreedTotalAmount: row.agreedTotalAmount || undefined,
      selectedRecyclerId: row.selectedRecyclerId || undefined,
      pickupOption: (row.pickupOption || 'collector_drop') as PickupOption,
      syncStatus: (row.syncStatus || 'pending') as SyncStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      lastSyncedAt: row.lastSyncedAt || undefined,
    };
  },
};
