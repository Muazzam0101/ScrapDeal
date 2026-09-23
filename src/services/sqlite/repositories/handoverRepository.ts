import { getDatabase } from '../database';
import { HandoverRecord, HandoverStatus, SyncStatus } from '../../../types';

export const handoverRepository = {
  /**
   * Creates a handover record locally in SQLite.
   */
  async createHandover(record: HandoverRecord): Promise<HandoverRecord> {
    const db = await getDatabase();
    const localId = record.localId || record.id || `HO-${Date.now()}`;
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO handovers (
        localId, remoteId, dealId, lotId, collectorId, recyclerId,
        actualWeightKg, photoUri, notes, collectorConfirmed, recyclerConfirmed,
        collectorConfirmedAt, recyclerConfirmedAt, latitude, longitude,
        status, completedAt, createdAt, updatedAt, lastSyncedAt, syncStatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        localId,
        record.remoteId || null,
        record.dealId,
        record.lotId,
        record.collectorId,
        record.recyclerId,
        record.actualWeightKg || null,
        record.photoUri || null,
        record.notes || null,
        record.collectorConfirmed ? 1 : 0,
        record.recyclerConfirmed ? 1 : 0,
        record.collectorConfirmedAt || null,
        record.recyclerConfirmedAt || null,
        record.latitude || null,
        record.longitude || null,
        record.status || 'pending',
        record.completedAt || null,
        record.createdAt || now,
        record.updatedAt || now,
        record.lastSyncedAt || null,
        record.syncStatus || 'pending',
      ]
    );

    return {
      ...record,
      id: localId,
      localId,
    };
  },

  /**
   * Retrieves a handover by deal ID.
   */
  async getHandoverByDealId(dealId: string): Promise<HandoverRecord | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM handovers WHERE dealId = ? LIMIT 1`,
      [dealId]
    );
    return row ? this.mapRowToHandover(row) : null;
  },

  /**
   * Retrieves a handover by local or remote ID.
   */
  async getHandoverById(id: string): Promise<HandoverRecord | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM handovers WHERE localId = ? OR remoteId = ? LIMIT 1`,
      [id, id]
    );
    return row ? this.mapRowToHandover(row) : null;
  },

  /**
   * Collector confirms scrap handover.
   */
  async confirmCollector(
    localId: string,
    actualWeightKg?: number,
    photoUri?: string,
    notes?: string,
    latitude?: number,
    longitude?: number
  ): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE handovers SET
        collectorConfirmed = 1,
        collectorConfirmedAt = ?,
        actualWeightKg = COALESCE(?, actualWeightKg),
        photoUri = COALESCE(?, photoUri),
        notes = COALESCE(?, notes),
        latitude = COALESCE(?, latitude),
        longitude = COALESCE(?, longitude),
        updatedAt = ?,
        syncStatus = 'pending'
      WHERE localId = ?`,
      [now, actualWeightKg ?? null, photoUri ?? null, notes ?? null, latitude ?? null, longitude ?? null, now, localId]
    );
  },

  /**
   * Recycler confirms receipt of scrap.
   */
  async confirmRecycler(
    localId: string,
    actualWeightKg?: number,
    photoUri?: string,
    notes?: string,
    latitude?: number,
    longitude?: number
  ): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE handovers SET
        recyclerConfirmed = 1,
        recyclerConfirmedAt = ?,
        actualWeightKg = COALESCE(?, actualWeightKg),
        photoUri = COALESCE(?, photoUri),
        notes = COALESCE(?, notes),
        latitude = COALESCE(?, latitude),
        longitude = COALESCE(?, longitude),
        updatedAt = ?,
        syncStatus = 'pending'
      WHERE localId = ?`,
      [now, actualWeightKg ?? null, photoUri ?? null, notes ?? null, latitude ?? null, longitude ?? null, now, localId]
    );
  },

  /**
   * Updates handover status (e.g. 'completed').
   */
  async updateHandoverStatus(localId: string, status: HandoverStatus): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const completedAt = status === 'completed' ? now : null;
    await db.runAsync(
      `UPDATE handovers SET status = ?, completedAt = COALESCE(?, completedAt), updatedAt = ?, syncStatus = 'pending' WHERE localId = ?`,
      [status, completedAt, now, localId]
    );
  },

  /**
   * Updates sync status and optional remote Firestore ID.
   */
  async updateHandoverSyncStatus(localId: string, syncStatus: SyncStatus, remoteId?: string): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    if (remoteId) {
      await db.runAsync(
        `UPDATE handovers SET syncStatus = ?, remoteId = ?, lastSyncedAt = ? WHERE localId = ?`,
        [syncStatus, remoteId, now, localId]
      );
    } else {
      await db.runAsync(
        `UPDATE handovers SET syncStatus = ?, lastSyncedAt = ? WHERE localId = ?`,
        [syncStatus, now, localId]
      );
    }
  },

  mapRowToHandover(row: any): HandoverRecord {
    return {
      id: row.localId,
      localId: row.localId,
      remoteId: row.remoteId || undefined,
      dealId: row.dealId,
      lotId: row.lotId,
      collectorId: row.collectorId,
      recyclerId: row.recyclerId,
      actualWeightKg: row.actualWeightKg !== null ? Number(row.actualWeightKg) : undefined,
      photoUri: row.photoUri || undefined,
      notes: row.notes || undefined,
      collectorConfirmed: Boolean(row.collectorConfirmed),
      recyclerConfirmed: Boolean(row.recyclerConfirmed),
      collectorConfirmedAt: row.collectorConfirmedAt || undefined,
      recyclerConfirmedAt: row.recyclerConfirmedAt || undefined,
      latitude: row.latitude !== null ? Number(row.latitude) : undefined,
      longitude: row.longitude !== null ? Number(row.longitude) : undefined,
      status: row.status as HandoverStatus,
      completedAt: row.completedAt || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      lastSyncedAt: row.lastSyncedAt || undefined,
      syncStatus: row.syncStatus as SyncStatus,
    };
  },
};
