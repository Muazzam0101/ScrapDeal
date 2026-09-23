import { getDatabase } from '../database';
import { Transaction, PaymentMethod, PaymentStatus, SyncStatus } from '../../../types';

export const transactionRepository = {
  /**
   * Creates a transaction record locally in SQLite.
   */
  async createTransaction(tx: Transaction): Promise<Transaction> {
    const db = await getDatabase();
    const localId = tx.localId || tx.id || `TX-${Date.now()}`;
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO transactions (
        localId, remoteId, transactionNumber, lotId, collectorId, recyclerId,
        materialName, weightKg, ratePerKg, totalAmount, paymentMethod,
        paymentStatus, date, syncStatus, createdAt, updatedAt, lastSyncedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        localId,
        tx.remoteId || null,
        tx.transactionNumber || `TRX-${Date.now().toString().slice(-6)}`,
        tx.lotId,
        tx.collectorId,
        tx.recyclerId,
        tx.materialName,
        tx.weightKg,
        tx.ratePerKg,
        tx.totalAmount,
        tx.paymentMethod,
        tx.paymentStatus,
        tx.date || now,
        tx.syncStatus || 'pending',
        tx.createdAt || now,
        tx.updatedAt || now,
        tx.lastSyncedAt || null,
      ]
    );

    return {
      ...tx,
      id: localId,
      localId,
    };
  },

  /**
   * Gets all transactions for a collector or recycler.
   */
  async getTransactionsForUser(userId: string, role: 'collector' | 'recycler'): Promise<Transaction[]> {
    const db = await getDatabase();
    const query = role === 'collector'
      ? `SELECT * FROM transactions WHERE collectorId = ? ORDER BY date DESC`
      : `SELECT * FROM transactions WHERE recyclerId = ? ORDER BY date DESC`;

    const rows = await db.getAllAsync<any>(query, [userId]);
    return rows.map((r) => this.mapRowToTransaction(r));
  },

  /**
   * Gets a transaction by its lotId.
   */
  async getTransactionByLotId(lotId: string): Promise<Transaction | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM transactions WHERE lotId = ? OR localId = ? LIMIT 1`,
      [lotId, lotId]
    );
    return row ? this.mapRowToTransaction(row) : null;
  },

  /**
   * Updates payment method and status for a transaction.
   */
  async updatePaymentStatus(id: string, status: PaymentStatus, method?: PaymentMethod): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    if (method) {
      await db.runAsync(
        `UPDATE transactions SET paymentStatus = ?, paymentMethod = ?, updatedAt = ?, syncStatus = 'pending' WHERE localId = ? OR remoteId = ?`,
        [status, method, now, id, id]
      );
    } else {
      await db.runAsync(
        `UPDATE transactions SET paymentStatus = ?, updatedAt = ?, syncStatus = 'pending' WHERE localId = ? OR remoteId = ?`,
        [status, now, id, id]
      );
    }
  },

  /**
   * Computes earnings statistics for a collector.
   */
  async getCollectorEarningsSummary(collectorId: string): Promise<{
    totalEarnings: number;
    totalWeight: number;
    transactionCount: number;
  }> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{
      totalEarnings: number | null;
      totalWeight: number | null;
      count: number;
    }>(
      `SELECT SUM(totalAmount) as totalEarnings, SUM(weightKg) as totalWeight, COUNT(*) as count
       FROM transactions WHERE collectorId = ? AND paymentStatus = 'completed'`,
      [collectorId]
    );

    return {
      totalEarnings: result?.totalEarnings || 0,
      totalWeight: result?.totalWeight || 0,
      transactionCount: result?.count || 0,
    };
  },

  /**
   * Updates sync status and remoteId.
   */
  async updateTransactionSyncStatus(
    localId: string,
    syncStatus: SyncStatus,
    remoteId?: string
  ): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    if (remoteId) {
      await db.runAsync(
        `UPDATE transactions SET syncStatus = ?, remoteId = ?, lastSyncedAt = ? WHERE localId = ?`,
        [syncStatus, remoteId, now, localId]
      );
    } else {
      await db.runAsync(
        `UPDATE transactions SET syncStatus = ?, lastSyncedAt = ? WHERE localId = ?`,
        [syncStatus, now, localId]
      );
    }
  },

  /**
   * Saves remote transactions into local cache.
   */
  async saveTransactionsFromRemote(transactions: Transaction[]): Promise<void> {
    const db = await getDatabase();
    for (const tx of transactions) {
      const localId = tx.localId || tx.id;
      await db.runAsync(
        `INSERT INTO transactions (
          localId, remoteId, transactionNumber, lotId, collectorId, recyclerId,
          materialName, weightKg, ratePerKg, totalAmount, paymentMethod,
          paymentStatus, date, syncStatus, createdAt, updatedAt, lastSyncedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?, ?)
        ON CONFLICT(localId) DO UPDATE SET
          paymentStatus = excluded.paymentStatus,
          syncStatus = 'synced',
          updatedAt = excluded.updatedAt,
          lastSyncedAt = excluded.lastSyncedAt`,
        [
          localId,
          tx.remoteId || tx.id,
          tx.transactionNumber,
          tx.lotId,
          tx.collectorId,
          tx.recyclerId,
          tx.materialName,
          tx.weightKg,
          tx.ratePerKg,
          tx.totalAmount,
          tx.paymentMethod,
          tx.paymentStatus,
          tx.date,
          tx.createdAt || tx.date,
          tx.updatedAt || tx.date,
          new Date().toISOString(),
        ]
      );
    }
  },

  mapRowToTransaction(row: any): Transaction {
    return {
      id: row.localId,
      localId: row.localId,
      remoteId: row.remoteId || undefined,
      transactionNumber: row.transactionNumber,
      lotId: row.lotId,
      collectorId: row.collectorId,
      recyclerId: row.recyclerId,
      materialName: row.materialName,
      weightKg: row.weightKg,
      ratePerKg: row.ratePerKg,
      totalAmount: row.totalAmount,
      paymentMethod: row.paymentMethod as PaymentMethod,
      paymentStatus: row.paymentStatus as PaymentStatus,
      date: row.date,
      syncStatus: (row.syncStatus || 'pending') as SyncStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt || undefined,
      lastSyncedAt: row.lastSyncedAt || undefined,
    };
  },
};
