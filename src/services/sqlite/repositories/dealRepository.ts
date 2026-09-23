import { getDatabase } from '../database';
import { Deal, DealStatus, SyncStatus } from '../../../types';

export const dealRepository = {
  /**
   * Creates a deal record locally in SQLite.
   */
  async createDeal(deal: Deal): Promise<Deal> {
    const db = await getDatabase();
    const localId = deal.localId || deal.id || `DEAL-${Date.now()}`;
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO deals (
        localId, remoteId, lotId, collectorId, recyclerId, offerId,
        materialCategoryId, materialName, agreedRatePerKg, agreedTotalAmount,
        agreedWeightKg, status, createdAt, updatedAt, lastSyncedAt, syncStatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        localId,
        deal.remoteId || null,
        deal.lotId,
        deal.collectorId,
        deal.recyclerId,
        deal.offerId,
        deal.materialCategoryId,
        deal.materialName,
        deal.agreedRatePerKg,
        deal.agreedTotalAmount,
        deal.agreedWeightKg,
        deal.status || 'accepted',
        deal.createdAt || now,
        deal.updatedAt || now,
        deal.lastSyncedAt || null,
        deal.syncStatus || 'pending',
      ]
    );

    return {
      ...deal,
      id: localId,
      localId,
    };
  },

  /**
   * Retrieves a deal by its local or remote ID.
   */
  async getDealById(dealId: string): Promise<Deal | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM deals WHERE localId = ? OR remoteId = ? LIMIT 1`,
      [dealId, dealId]
    );
    return row ? this.mapRowToDeal(row) : null;
  },

  /**
   * Retrieves a deal for a given lot ID.
   */
  async getDealByLotId(lotId: string): Promise<Deal | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM deals WHERE lotId = ? LIMIT 1`,
      [lotId]
    );
    return row ? this.mapRowToDeal(row) : null;
  },

  /**
   * Retrieves all deals for a collector.
   */
  async getDealsForCollector(collectorId: string): Promise<Deal[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM deals WHERE collectorId = ? ORDER BY createdAt DESC`,
      [collectorId]
    );
    return rows.map((r) => this.mapRowToDeal(r));
  },

  /**
   * Retrieves all deals for a recycler.
   */
  async getDealsForRecycler(recyclerId: string): Promise<Deal[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM deals WHERE recyclerId = ? ORDER BY createdAt DESC`,
      [recyclerId]
    );
    return rows.map((r) => this.mapRowToDeal(r));
  },

  /**
   * Updates deal status.
   */
  async updateDealStatus(dealId: string, status: DealStatus): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE deals SET status = ?, updatedAt = ?, syncStatus = 'pending' WHERE localId = ? OR remoteId = ?`,
      [status, now, dealId, dealId]
    );
  },

  /**
   * Updates sync status and optional remote Firestore ID.
   */
  async updateDealSyncStatus(localId: string, syncStatus: SyncStatus, remoteId?: string): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    if (remoteId) {
      await db.runAsync(
        `UPDATE deals SET syncStatus = ?, remoteId = ?, lastSyncedAt = ? WHERE localId = ?`,
        [syncStatus, remoteId, now, localId]
      );
    } else {
      await db.runAsync(
        `UPDATE deals SET syncStatus = ?, lastSyncedAt = ? WHERE localId = ?`,
        [syncStatus, now, localId]
      );
    }
  },

  mapRowToDeal(row: any): Deal {
    return {
      id: row.localId,
      localId: row.localId,
      remoteId: row.remoteId || undefined,
      lotId: row.lotId,
      collectorId: row.collectorId,
      recyclerId: row.recyclerId,
      offerId: row.offerId,
      materialCategoryId: row.materialCategoryId,
      materialName: row.materialName,
      agreedRatePerKg: Number(row.agreedRatePerKg),
      agreedTotalAmount: Number(row.agreedTotalAmount),
      agreedWeightKg: Number(row.agreedWeightKg),
      status: row.status as DealStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      lastSyncedAt: row.lastSyncedAt || undefined,
      syncStatus: row.syncStatus as SyncStatus,
    };
  },
};
