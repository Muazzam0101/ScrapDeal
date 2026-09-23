import { getDatabase } from '../database';
import { Offer, OfferStatus, SyncStatus, PickupOption } from '../../../types';

export const offerRepository = {
  /**
   * Creates a new offer in SQLite.
   */
  async createOffer(offer: Offer): Promise<Offer> {
    const db = await getDatabase();
    const localId = offer.localId || offer.id || `OFFER-${Date.now()}`;
    const now = new Date().toISOString();
    const timelineJson = JSON.stringify(offer.timeline || []);

    await db.runAsync(
      `INSERT INTO offers (
        localId, remoteId, lotId, recyclerId, recyclerName, ratePerKg,
        totalAmount, pickupOption, comments, status, timeline, syncStatus,
        createdAt, updatedAt, lastSyncedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        localId,
        offer.remoteId || null,
        offer.lotId,
        offer.recyclerId,
        offer.recyclerName || 'Authorized Recycler',
        offer.ratePerKg,
        offer.totalAmount,
        offer.pickupOption,
        offer.comments || null,
        offer.status || 'sent',
        timelineJson,
        offer.syncStatus || 'pending',
        offer.createdAt || now,
        offer.updatedAt || now,
        offer.lastSyncedAt || null,
      ]
    );

    return {
      ...offer,
      id: localId,
      localId,
    };
  },

  /**
   * Gets offers for a specific lot.
   */
  async getOffersForLot(lotId: string): Promise<Offer[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM offers WHERE lotId = ? ORDER BY createdAt DESC`,
      [lotId]
    );
    return rows.map((r) => this.mapRowToOffer(r));
  },

  /**
   * Gets offers made by a recycler.
   */
  async getOffersByRecycler(recyclerId: string): Promise<Offer[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM offers WHERE recyclerId = ? ORDER BY createdAt DESC`,
      [recyclerId]
    );
    return rows.map((r) => this.mapRowToOffer(r));
  },

  /**
   * Updates status of an offer (e.g. accepted, rejected, countered).
   */
  async updateOfferStatus(localId: string, status: OfferStatus): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE offers SET status = ?, syncStatus = 'pending', updatedAt = ? WHERE localId = ?`,
      [status, now, localId]
    );
  },

  /**
   * Updates sync status and remoteId.
   */
  async updateOfferSyncStatus(
    localId: string,
    syncStatus: SyncStatus,
    remoteId?: string
  ): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    if (remoteId) {
      await db.runAsync(
        `UPDATE offers SET syncStatus = ?, remoteId = ?, lastSyncedAt = ? WHERE localId = ?`,
        [syncStatus, remoteId, now, localId]
      );
    } else {
      await db.runAsync(
        `UPDATE offers SET syncStatus = ?, lastSyncedAt = ? WHERE localId = ?`,
        [syncStatus, now, localId]
      );
    }
  },

  /**
   * Saves remote offers into local cache.
   */
  async saveOffersFromRemote(offers: Offer[]): Promise<void> {
    const db = await getDatabase();
    for (const o of offers) {
      const localId = o.localId || o.id;
      const timelineJson = JSON.stringify(o.timeline || []);

      await db.runAsync(
        `INSERT INTO offers (
          localId, remoteId, lotId, recyclerId, recyclerName, ratePerKg,
          totalAmount, pickupOption, comments, status, timeline, syncStatus,
          createdAt, updatedAt, lastSyncedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?, ?)
        ON CONFLICT(localId) DO UPDATE SET
          status = excluded.status,
          ratePerKg = excluded.ratePerKg,
          totalAmount = excluded.totalAmount,
          syncStatus = 'synced',
          updatedAt = excluded.updatedAt,
          lastSyncedAt = excluded.lastSyncedAt`,
        [
          localId,
          o.remoteId || o.id,
          o.lotId,
          o.recyclerId,
          o.recyclerName || 'Authorized Recycler',
          o.ratePerKg,
          o.totalAmount,
          o.pickupOption,
          o.comments || null,
          o.status,
          timelineJson,
          o.createdAt,
          o.updatedAt || o.createdAt,
          new Date().toISOString(),
        ]
      );
    }
  },

  mapRowToOffer(row: any): Offer {
    let timeline = [];
    try {
      timeline = row.timeline ? JSON.parse(row.timeline) : [];
    } catch {
      timeline = [];
    }

    return {
      id: row.localId,
      localId: row.localId,
      remoteId: row.remoteId || undefined,
      lotId: row.lotId,
      recyclerId: row.recyclerId,
      recyclerName: row.recyclerName || undefined,
      ratePerKg: row.ratePerKg,
      totalAmount: row.totalAmount,
      pickupOption: (row.pickupOption || 'collector_drop') as PickupOption,
      comments: row.comments || undefined,
      status: row.status as OfferStatus,
      timeline,
      syncStatus: (row.syncStatus || 'pending') as SyncStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt || undefined,
      lastSyncedAt: row.lastSyncedAt || undefined,
    };
  },
};
