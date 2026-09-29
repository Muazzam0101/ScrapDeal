import { getDatabase } from '../database';
import { Transaction, PaymentMethod, PaymentStatus, TransactionStatus, SyncStatus } from '../../../types';

export const transactionRepository = {
  /**
   * Creates a transaction record locally in SQLite.
   */
  async createTransaction(tx: Transaction): Promise<Transaction> {
    const db = await getDatabase();
    const localId = tx.localId || tx.id || tx.transactionId || `TX-${Date.now()}`;
    const now = new Date().toISOString();
    const finalWeight = tx.finalWeight ?? tx.weightKg ?? 0;
    const agreedPrice = tx.agreedPrice ?? tx.ratePerKg ?? 0;
    const materialCategory = tx.materialCategory || tx.materialName || 'mixed';
    const materialName = tx.materialName || tx.materialCategory || 'Mixed Scrap';
    const handoverStatus = tx.handoverStatus || 'completed';
    const transactionStatus = tx.transactionStatus || 'payment_pending';
    const paymentStatus = tx.paymentStatus || 'pending';

    await db.runAsync(
      `INSERT INTO transactions (
        localId, remoteId, transactionNumber, lotId, dealId, collectorId, recyclerId,
        materialName, materialCategory, weightKg, finalWeight, ratePerKg, agreedPrice,
        totalAmount, paymentId, paymentMethod, paymentStatus, handoverStatus,
        transactionStatus, date, completedAt, syncStatus, createdAt, updatedAt, lastSyncedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        localId,
        tx.remoteId || null,
        tx.transactionNumber || `TRX-${Date.now().toString().slice(-6)}`,
        tx.lotId,
        tx.dealId || null,
        tx.collectorId,
        tx.recyclerId,
        materialName,
        materialCategory,
        finalWeight,
        finalWeight,
        agreedPrice,
        agreedPrice,
        tx.totalAmount,
        tx.paymentId || null,
        tx.paymentMethod,
        paymentStatus,
        handoverStatus,
        transactionStatus,
        tx.date || now,
        tx.completedAt || null,
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
      transactionId: localId,
      finalWeight,
      weightKg: finalWeight,
      agreedPrice,
      ratePerKg: agreedPrice,
      materialCategory,
      materialName,
      handoverStatus,
      transactionStatus,
      paymentStatus,
    };
  },

  /**
   * Gets a transaction by id, localId, or remoteId.
   */
  async getTransactionById(transactionId: string): Promise<Transaction | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM transactions WHERE localId = ? OR remoteId = ? LIMIT 1`,
      [transactionId, transactionId]
    );
    return row ? this.mapRowToTransaction(row) : null;
  },

  /**
   * Gets a transaction by dealId.
   */
  async getTransactionByDealId(dealId: string): Promise<Transaction | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM transactions WHERE dealId = ? ORDER BY createdAt DESC LIMIT 1`,
      [dealId]
    );
    return row ? this.mapRowToTransaction(row) : null;
  },

  /**
   * Gets all transactions for a collector or recycler.
   */
  async getTransactionsForUser(userId: string, role: 'collector' | 'recycler'): Promise<Transaction[]> {
    const db = await getDatabase();
    const query = role === 'collector'
      ? `SELECT * FROM transactions WHERE collectorId = ? ORDER BY createdAt DESC`
      : `SELECT * FROM transactions WHERE recyclerId = ? ORDER BY createdAt DESC`;

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
   * Updates payment status and optional payment method on a transaction.
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
   * Updates transaction settlement status and completion timestamp.
   */
  async updateTransactionSettlement(
    transactionId: string,
    transactionStatus: TransactionStatus,
    paymentStatus?: PaymentStatus,
    paymentId?: string,
    completedAt?: string
  ): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const compAt = completedAt || (transactionStatus === 'completed' ? now : null);

    const existing = await this.getTransactionById(transactionId);
    if (!existing) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const payStatus = paymentStatus || existing.paymentStatus;
    const payId = paymentId || existing.paymentId || null;

    await db.runAsync(
      `UPDATE transactions SET
        transactionStatus = ?,
        paymentStatus = ?,
        paymentId = ?,
        completedAt = ?,
        updatedAt = ?,
        syncStatus = 'pending'
      WHERE localId = ? OR remoteId = ?`,
      [
        transactionStatus,
        payStatus,
        payId,
        compAt,
        now,
        transactionId,
        transactionId,
      ]
    );
  },

  /**
   * Computes earnings statistics for a collector strictly from COMPLETED transactions.
   * Total Earnings = SUM(completed transaction amounts)
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
      `SELECT SUM(totalAmount) as totalEarnings, SUM(finalWeight) as totalWeight, COUNT(*) as count
       FROM transactions
       WHERE collectorId = ? AND transactionStatus = 'completed' AND paymentStatus = 'completed'`,
      [collectorId]
    );

    return {
      totalEarnings: result?.totalEarnings || 0,
      totalWeight: result?.totalWeight || 0,
      transactionCount: result?.count || 0,
    };
  },

  /**
   * Computes spending statistics for a recycler strictly from COMPLETED transactions.
   * Total Spending = SUM(completed transaction amounts)
   */
  async getRecyclerSpendingSummary(recyclerId: string): Promise<{
    totalSpending: number;
    totalWeight: number;
    transactionCount: number;
  }> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{
      totalSpending: number | null;
      totalWeight: number | null;
      count: number;
    }>(
      `SELECT SUM(totalAmount) as totalSpending, SUM(finalWeight) as totalWeight, COUNT(*) as count
       FROM transactions
       WHERE recyclerId = ? AND transactionStatus = 'completed' AND paymentStatus = 'completed'`,
      [recyclerId]
    );

    return {
      totalSpending: result?.totalSpending || 0,
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
      const localId = tx.localId || tx.id || tx.transactionId;
      const finalWeight = tx.finalWeight ?? tx.weightKg ?? 0;
      const agreedPrice = tx.agreedPrice ?? tx.ratePerKg ?? 0;
      const materialCategory = tx.materialCategory || tx.materialName || 'mixed';
      const materialName = tx.materialName || tx.materialCategory || 'Mixed Scrap';

      await db.runAsync(
        `INSERT INTO transactions (
          localId, remoteId, transactionNumber, lotId, dealId, collectorId, recyclerId,
          materialName, materialCategory, weightKg, finalWeight, ratePerKg, agreedPrice,
          totalAmount, paymentId, paymentMethod, paymentStatus, handoverStatus,
          transactionStatus, date, completedAt, syncStatus, createdAt, updatedAt, lastSyncedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?, ?)
        ON CONFLICT(localId) DO UPDATE SET
          dealId = excluded.dealId,
          paymentId = excluded.paymentId,
          paymentStatus = excluded.paymentStatus,
          transactionStatus = excluded.transactionStatus,
          handoverStatus = excluded.handoverStatus,
          completedAt = excluded.completedAt,
          syncStatus = 'synced',
          updatedAt = excluded.updatedAt,
          lastSyncedAt = excluded.lastSyncedAt`,
        [
          localId,
          tx.remoteId || tx.id || tx.transactionId,
          tx.transactionNumber,
          tx.lotId,
          tx.dealId || null,
          tx.collectorId,
          tx.recyclerId,
          materialName,
          materialCategory,
          finalWeight,
          finalWeight,
          agreedPrice,
          agreedPrice,
          tx.totalAmount,
          tx.paymentId || null,
          tx.paymentMethod,
          tx.paymentStatus,
          tx.handoverStatus || 'completed',
          tx.transactionStatus || 'completed',
          tx.date || tx.createdAt,
          tx.completedAt || null,
          tx.createdAt || new Date().toISOString(),
          tx.updatedAt || new Date().toISOString(),
          new Date().toISOString(),
        ]
      );
    }
  },

  /**
   * Gets completed transactions for a material name/category.
   */
  async getTransactionsByMaterial(materialName: string): Promise<Transaction[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM transactions
       WHERE (LOWER(materialName) LIKE ? OR LOWER(materialCategory) LIKE ?)
       ORDER BY createdAt DESC`,
      [`%${materialName.toLowerCase()}%`, `%${materialName.toLowerCase()}%`]
    );
    return rows.map((r) => this.mapRowToTransaction(r));
  },

  mapRowToTransaction(row: any): Transaction {
    const finalWeight = row.finalWeight !== null && row.finalWeight !== undefined ? row.finalWeight : (row.weightKg || 0);
    const agreedPrice = row.agreedPrice !== null && row.agreedPrice !== undefined ? row.agreedPrice : (row.ratePerKg || 0);

    return {
      id: row.localId,
      localId: row.localId,
      transactionId: row.localId,
      remoteId: row.remoteId || undefined,
      transactionNumber: row.transactionNumber,
      lotId: row.lotId,
      dealId: row.dealId || '',
      collectorId: row.collectorId,
      recyclerId: row.recyclerId,
      materialCategory: row.materialCategory || row.materialName || 'mixed',
      materialName: row.materialName || row.materialCategory || 'Mixed Scrap',
      finalWeight,
      weightKg: finalWeight,
      agreedPrice,
      ratePerKg: agreedPrice,
      totalAmount: row.totalAmount,
      paymentId: row.paymentId || undefined,
      paymentMethod: row.paymentMethod as PaymentMethod,
      paymentStatus: row.paymentStatus as PaymentStatus,
      handoverStatus: row.handoverStatus || 'completed',
      transactionStatus: (row.transactionStatus || 'completed') as TransactionStatus,
      completedAt: row.completedAt || undefined,
      date: row.date || row.createdAt,
      syncStatus: (row.syncStatus || 'pending') as SyncStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt || undefined,
      lastSyncedAt: row.lastSyncedAt || undefined,
    };
  },
};
