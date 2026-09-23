import { getDatabase } from '../database';
import { SyncQueueItem, EntityType, OperationType, SyncStatus } from '../../../types';

export const syncQueueRepository = {
  /**
   * Enqueues a new sync operation into the local queue.
   */
  async enqueueOperation(params: {
    entityType: EntityType;
    localId: string;
    remoteId?: string;
    operationType: OperationType;
    payload: any;
  }): Promise<SyncQueueItem> {
    const db = await getDatabase();
    const id = `SYNC-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();
    const payloadStr = typeof params.payload === 'string' ? params.payload : JSON.stringify(params.payload);

    await db.runAsync(
      `INSERT INTO sync_queue (
        id, entityType, localId, remoteId, operationType, payload, status, retryCount, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?)`,
      [
        id,
        params.entityType,
        params.localId,
        params.remoteId || null,
        params.operationType,
        payloadStr,
        now,
        now,
      ]
    );

    return {
      id,
      entityType: params.entityType,
      localId: params.localId,
      remoteId: params.remoteId,
      operationType: params.operationType,
      payload: payloadStr,
      status: 'pending',
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    };
  },

  /**
   * Gets pending or failed operations eligible for retry (ordered chronologically).
   */
  async getPendingOperations(): Promise<SyncQueueItem[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM sync_queue WHERE status IN ('pending', 'failed') ORDER BY createdAt ASC`
    );

    return rows.map((r) => ({
      id: r.id,
      entityType: r.entityType as EntityType,
      localId: r.localId,
      remoteId: r.remoteId || undefined,
      operationType: r.operationType as OperationType,
      payload: r.payload,
      status: r.status as SyncStatus,
      retryCount: r.retryCount,
      errorMessage: r.errorMessage || undefined,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  },

  /**
   * Updates an item's status (e.g. syncing, synced, failed).
   */
  async updateOperationStatus(
    id: string,
    status: SyncStatus,
    errorMessage?: string
  ): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE sync_queue SET status = ?, errorMessage = ?, updatedAt = ? WHERE id = ?`,
      [status, errorMessage || null, now, id]
    );
  },

  /**
   * Increments retry count and sets status to 'failed'.
   */
  async incrementRetry(id: string, errorMessage: string): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE sync_queue SET retryCount = retryCount + 1, status = 'failed', errorMessage = ?, updatedAt = ? WHERE id = ?`,
      [errorMessage, now, id]
    );
  },

  /**
   * Removes a completed queue item.
   */
  async removeCompletedOperation(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [id]);
  },

  /**
   * Gets the total number of items waiting to be synced.
   */
  async getPendingCount(): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM sync_queue WHERE status IN ('pending', 'failed')`
    );
    return result?.count || 0;
  },
};
