import { getDatabase } from '../database';
import { Payment, PaymentStatus, PaymentMethod, SyncStatus } from '../../../types';

export const paymentRepository = {
  /**
   * Creates a payment record locally in SQLite.
   */
  async createPayment(payment: Payment): Promise<Payment> {
    const db = await getDatabase();
    const paymentId = payment.paymentId || payment.id || `PAY-${Date.now()}`;
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO payments (
        paymentId, remoteId, dealId, transactionId, lotId,
        collectorId, recyclerId, amount, currency, method,
        status, initiatedAt, completedAt, provider, providerReference,
        cashPaidConfirmedByRecycler, cashPaidConfirmedAt,
        cashReceivedConfirmedByCollector, cashReceivedConfirmedAt,
        createdAt, updatedAt, syncStatus, lastSyncedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentId,
        payment.remoteId || null,
        payment.dealId,
        payment.transactionId || null,
        payment.lotId || null,
        payment.collectorId,
        payment.recyclerId,
        payment.amount,
        payment.currency || 'INR',
        payment.method,
        payment.status || 'pending',
        payment.initiatedAt || now,
        payment.completedAt || null,
        payment.provider || null,
        payment.providerReference || null,
        payment.cashPaidConfirmedByRecycler ? 1 : 0,
        payment.cashPaidConfirmedAt || null,
        payment.cashReceivedConfirmedByCollector ? 1 : 0,
        payment.cashReceivedConfirmedAt || null,
        payment.createdAt || now,
        payment.updatedAt || now,
        payment.syncStatus || 'pending',
        payment.lastSyncedAt || null,
      ]
    );

    return {
      ...payment,
      id: paymentId,
      paymentId,
    };
  },

  /**
   * Gets a payment by paymentId or remoteId.
   */
  async getPaymentById(paymentId: string): Promise<Payment | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM payments WHERE paymentId = ? OR remoteId = ? LIMIT 1`,
      [paymentId, paymentId]
    );
    return row ? this.mapRowToPayment(row) : null;
  },

  /**
   * Gets the active or latest payment for a given dealId.
   */
  async getPaymentByDealId(dealId: string): Promise<Payment | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM payments WHERE dealId = ? ORDER BY createdAt DESC LIMIT 1`,
      [dealId]
    );
    return row ? this.mapRowToPayment(row) : null;
  },

  /**
   * Gets all payments for a given dealId.
   */
  async getAllPaymentsForDeal(dealId: string): Promise<Payment[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM payments WHERE dealId = ? ORDER BY createdAt DESC`,
      [dealId]
    );
    return rows.map((r) => this.mapRowToPayment(r));
  },

  /**
   * Updates payment status and associated metadata.
   */
  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    metadata?: {
      completedAt?: string;
      provider?: string;
      providerReference?: string;
      cashPaidConfirmedByRecycler?: boolean;
      cashPaidConfirmedAt?: string;
      cashReceivedConfirmedByCollector?: boolean;
      cashReceivedConfirmedAt?: string;
      transactionId?: string;
    }
  ): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    const existing = await this.getPaymentById(paymentId);
    if (!existing) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    const completedAt = metadata?.completedAt ?? existing.completedAt;
    const provider = metadata?.provider ?? existing.provider;
    const providerReference = metadata?.providerReference ?? existing.providerReference;
    const cashPaidConfirmed = metadata?.cashPaidConfirmedByRecycler !== undefined
      ? (metadata.cashPaidConfirmedByRecycler ? 1 : 0)
      : (existing.cashPaidConfirmedByRecycler ? 1 : 0);
    const cashPaidAt = metadata?.cashPaidConfirmedAt ?? existing.cashPaidConfirmedAt;
    const cashReceivedConfirmed = metadata?.cashReceivedConfirmedByCollector !== undefined
      ? (metadata.cashReceivedConfirmedByCollector ? 1 : 0)
      : (existing.cashReceivedConfirmedByCollector ? 1 : 0);
    const cashReceivedAt = metadata?.cashReceivedConfirmedAt ?? existing.cashReceivedConfirmedAt;
    const transactionId = metadata?.transactionId ?? existing.transactionId;

    await db.runAsync(
      `UPDATE payments SET
        status = ?,
        completedAt = ?,
        provider = ?,
        providerReference = ?,
        cashPaidConfirmedByRecycler = ?,
        cashPaidConfirmedAt = ?,
        cashReceivedConfirmedByCollector = ?,
        cashReceivedConfirmedAt = ?,
        transactionId = ?,
        updatedAt = ?,
        syncStatus = 'pending'
      WHERE paymentId = ? OR remoteId = ?`,
      [
        status,
        completedAt || null,
        provider || null,
        providerReference || null,
        cashPaidConfirmed,
        cashPaidAt || null,
        cashReceivedConfirmed,
        cashReceivedAt || null,
        transactionId || null,
        now,
        paymentId,
        paymentId,
      ]
    );
  },

  /**
   * Gets payments for a user (collector or recycler).
   */
  async getPaymentsForUser(userId: string, role: 'collector' | 'recycler'): Promise<Payment[]> {
    const db = await getDatabase();
    const query = role === 'collector'
      ? `SELECT * FROM payments WHERE collectorId = ? ORDER BY createdAt DESC`
      : `SELECT * FROM payments WHERE recyclerId = ? ORDER BY createdAt DESC`;

    const rows = await db.getAllAsync<any>(query, [userId]);
    return rows.map((r) => this.mapRowToPayment(r));
  },

  /**
   * Update sync status for a local payment.
   */
  async updatePaymentSyncStatus(
    paymentId: string,
    syncStatus: SyncStatus,
    remoteId?: string
  ): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    if (remoteId) {
      await db.runAsync(
        `UPDATE payments SET syncStatus = ?, remoteId = ?, lastSyncedAt = ? WHERE paymentId = ?`,
        [syncStatus, remoteId, now, paymentId]
      );
    } else {
      await db.runAsync(
        `UPDATE payments SET syncStatus = ?, lastSyncedAt = ? WHERE paymentId = ?`,
        [syncStatus, now, paymentId]
      );
    }
  },

  /**
   * Saves or merges remote payments into local SQLite cache.
   */
  async savePaymentsFromRemote(payments: Payment[]): Promise<void> {
    const db = await getDatabase();
    for (const p of payments) {
      const paymentId = p.paymentId || p.id || '';
      await db.runAsync(
        `INSERT INTO payments (
          paymentId, remoteId, dealId, transactionId, lotId,
          collectorId, recyclerId, amount, currency, method,
          status, initiatedAt, completedAt, provider, providerReference,
          cashPaidConfirmedByRecycler, cashPaidConfirmedAt,
          cashReceivedConfirmedByCollector, cashReceivedConfirmedAt,
          createdAt, updatedAt, syncStatus, lastSyncedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)
        ON CONFLICT(paymentId) DO UPDATE SET
          status = excluded.status,
          completedAt = excluded.completedAt,
          providerReference = excluded.providerReference,
          cashPaidConfirmedByRecycler = excluded.cashPaidConfirmedByRecycler,
          cashPaidConfirmedAt = excluded.cashPaidConfirmedAt,
          cashReceivedConfirmedByCollector = excluded.cashReceivedConfirmedByCollector,
          cashReceivedConfirmedAt = excluded.cashReceivedConfirmedAt,
          transactionId = excluded.transactionId,
          syncStatus = 'synced',
          updatedAt = excluded.updatedAt,
          lastSyncedAt = excluded.lastSyncedAt`,
        [
          paymentId,
          p.remoteId || p.id || null,
          p.dealId,
          p.transactionId || null,
          p.lotId || null,
          p.collectorId,
          p.recyclerId,
          p.amount,
          p.currency || 'INR',
          p.method,
          p.status,
          p.initiatedAt,
          p.completedAt || null,
          p.provider || null,
          p.providerReference || null,
          p.cashPaidConfirmedByRecycler ? 1 : 0,
          p.cashPaidConfirmedAt || null,
          p.cashReceivedConfirmedByCollector ? 1 : 0,
          p.cashReceivedConfirmedAt || null,
          p.createdAt || new Date().toISOString(),
          p.updatedAt || new Date().toISOString(),
          new Date().toISOString(),
        ]
      );
    }
  },

  mapRowToPayment(row: any): Payment {
    return {
      paymentId: row.paymentId,
      id: row.paymentId,
      remoteId: row.remoteId || undefined,
      dealId: row.dealId,
      transactionId: row.transactionId || undefined,
      lotId: row.lotId || undefined,
      collectorId: row.collectorId,
      recyclerId: row.recyclerId,
      amount: row.amount,
      currency: row.currency || 'INR',
      method: row.method as PaymentMethod,
      status: row.status as PaymentStatus,
      initiatedAt: row.initiatedAt,
      completedAt: row.completedAt || undefined,
      provider: row.provider || undefined,
      providerReference: row.providerReference || undefined,
      cashPaidConfirmedByRecycler: row.cashPaidConfirmedByRecycler === 1,
      cashPaidConfirmedAt: row.cashPaidConfirmedAt || undefined,
      cashReceivedConfirmedByCollector: row.cashReceivedConfirmedByCollector === 1,
      cashReceivedConfirmedAt: row.cashReceivedConfirmedAt || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      syncStatus: (row.syncStatus || 'pending') as SyncStatus,
      lastSyncedAt: row.lastSyncedAt || undefined,
    };
  },
};
