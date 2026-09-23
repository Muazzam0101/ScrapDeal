import { MaterialPrice, MaterialCategoryId, PriceSourceType } from '../../../types';
import { getDatabase } from '../database';

function mapRowToPrice(row: any): MaterialPrice {
  return {
    id: row.localId,
    localId: row.localId,
    remoteId: row.remoteId || undefined,
    materialCategory: row.materialCategory as MaterialCategoryId,
    materialName: row.materialName || undefined,
    recyclerId: row.recyclerId || undefined,
    recyclerName: row.recyclerName || undefined,
    ratePerKg: Number(row.ratePerKg),
    minRatePerKg: row.minRatePerKg ? Number(row.minRatePerKg) : undefined,
    maxRatePerKg: row.maxRatePerKg ? Number(row.maxRatePerKg) : undefined,
    effectiveFrom: row.effectiveFrom,
    effectiveUntil: row.effectiveUntil || undefined,
    locationCity: row.locationCity || undefined,
    locationArea: row.locationArea || undefined,
    sourceType: (row.sourceType as PriceSourceType) || 'recycler_rate',
    syncStatus: row.syncStatus || 'pending',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastSyncedAt: row.lastSyncedAt || undefined,
  };
}

export const priceRepository = {
  async createPrice(price: MaterialPrice): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO material_prices (
        localId, remoteId, materialCategory, materialName, recyclerId, recyclerName,
        ratePerKg, minRatePerKg, maxRatePerKg, effectiveFrom, effectiveUntil,
        locationCity, locationArea, sourceType, syncStatus, createdAt, updatedAt, lastSyncedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        price.localId,
        price.remoteId || null,
        price.materialCategory,
        price.materialName || null,
        price.recyclerId || null,
        price.recyclerName || null,
        price.ratePerKg,
        price.minRatePerKg || null,
        price.maxRatePerKg || null,
        price.effectiveFrom || new Date().toISOString(),
        price.effectiveUntil || null,
        price.locationCity || null,
        price.locationArea || null,
        price.sourceType || 'recycler_rate',
        price.syncStatus || 'pending',
        price.createdAt || new Date().toISOString(),
        price.updatedAt || new Date().toISOString(),
        price.lastSyncedAt || null,
      ]
    );
  },

  async updatePrice(price: Partial<MaterialPrice> & { localId: string }): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE material_prices SET
        ratePerKg = COALESCE(?, ratePerKg),
        minRatePerKg = COALESCE(?, minRatePerKg),
        maxRatePerKg = COALESCE(?, maxRatePerKg),
        effectiveUntil = COALESCE(?, effectiveUntil),
        syncStatus = COALESCE(?, syncStatus),
        updatedAt = ?
      WHERE localId = ?`,
      [
        price.ratePerKg !== undefined ? price.ratePerKg : null,
        price.minRatePerKg !== undefined ? price.minRatePerKg : null,
        price.maxRatePerKg !== undefined ? price.maxRatePerKg : null,
        price.effectiveUntil !== undefined ? price.effectiveUntil : null,
        price.syncStatus || null,
        now,
        price.localId,
      ]
    );
  },

  async getPriceById(localId: string): Promise<MaterialPrice | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM material_prices WHERE localId = ? OR remoteId = ?`,
      [localId, localId]
    );
    return row ? mapRowToPrice(row) : null;
  },

  async getPricesByMaterial(category: MaterialCategoryId): Promise<MaterialPrice[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM material_prices WHERE materialCategory = ? ORDER BY updatedAt DESC`,
      [category]
    );
    return rows.map(mapRowToPrice);
  },

  async getPricesByRecycler(recyclerId: string): Promise<MaterialPrice[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM material_prices WHERE recyclerId = ? ORDER BY updatedAt DESC`,
      [recyclerId]
    );
    return rows.map(mapRowToPrice);
  },

  async getAllPrices(): Promise<MaterialPrice[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM material_prices ORDER BY updatedAt DESC`
    );
    return rows.map(mapRowToPrice);
  },

  /**
   * Returns the most recent observed price for each material category
   */
  async getLatestObservedPrices(): Promise<Record<string, MaterialPrice>> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM material_prices
       WHERE localId IN (
         SELECT localId FROM material_prices
         GROUP BY materialCategory
         HAVING MAX(updatedAt)
       )`
    );
    const result: Record<string, MaterialPrice> = {};
    for (const row of rows) {
      const price = mapRowToPrice(row);
      result[price.materialCategory] = price;
    }
    return result;
  },

  async deletePrice(localId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM material_prices WHERE localId = ?`, [localId]);
  },
};
