import { AIPrediction, AIPriceEstimate, AIAnomalyEvent, MaterialCategoryId, SyncStatus } from '../../../types';
import { getDatabase } from '../database';

function mapRowToPrediction(row: any): AIPrediction {
  return {
    localId: row.localId,
    remoteId: row.remoteId || undefined,
    entityId: row.entityId,
    modelName: row.modelName,
    modelVersion: row.modelVersion,
    predictedCategory: row.predictedCategory as MaterialCategoryId,
    confidence: Number(row.confidence),
    alternatives: row.alternativesJson ? JSON.parse(row.alternativesJson) : [],
    userConfirmed: Boolean(row.userConfirmed),
    finalCategory: row.finalCategory as MaterialCategoryId,
    feedbackNotes: row.feedbackNotes || undefined,
    syncStatus: row.syncStatus || 'pending',
    createdAt: row.createdAt,
    lastSyncedAt: row.lastSyncedAt || undefined,
  };
}

function mapRowToPriceEstimate(row: any): AIPriceEstimate {
  return {
    localId: row.localId,
    remoteId: row.remoteId || undefined,
    lotId: row.lotId,
    modelName: row.modelName,
    modelVersion: row.modelVersion,
    estimatedMin: Number(row.estimatedMin),
    estimatedMax: Number(row.estimatedMax),
    estimatedAverage: Number(row.estimatedAverage),
    confidence: Number(row.confidence),
    basis: row.basisJson ? JSON.parse(row.basisJson) : [],
    dataPointCount: Number(row.dataPointCount || 0),
    lastMarketDataAt: row.lastMarketDataAt || undefined,
    syncStatus: row.syncStatus || 'pending',
    createdAt: row.createdAt,
    lastSyncedAt: row.lastSyncedAt || undefined,
  };
}

function mapRowToAnomalyEvent(row: any): AIAnomalyEvent {
  return {
    localId: row.localId,
    remoteId: row.remoteId || undefined,
    transactionId: row.transactionId || undefined,
    lotId: row.lotId || undefined,
    modelName: row.modelName,
    modelVersion: row.modelVersion,
    anomalyScore: Number(row.anomalyScore),
    status: row.status as 'normal' | 'flagged',
    reason: row.reason || undefined,
    signals: row.signalsJson ? JSON.parse(row.signalsJson) : [],
    syncStatus: row.syncStatus || 'pending',
    createdAt: row.createdAt,
    lastSyncedAt: row.lastSyncedAt || undefined,
  };
}

export const aiRepository = {
  // --- Predictions ---
  async savePrediction(pred: AIPrediction): Promise<void> {
    const db = await getDatabase();
    try {
      await db.runAsync(
        `INSERT OR REPLACE INTO ai_predictions (
          localId, remoteId, entityId, modelName, modelVersion,
          predictedCategory, confidence, alternativesJson,
          userConfirmed, finalCategory, feedbackNotes,
          syncStatus, createdAt, lastSyncedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pred.localId,
          pred.remoteId || null,
          pred.entityId,
          pred.modelName,
          pred.modelVersion,
          pred.predictedCategory,
          pred.confidence,
          JSON.stringify(pred.alternatives || []),
          pred.userConfirmed ? 1 : 0,
          pred.finalCategory,
          pred.feedbackNotes || null,
          pred.syncStatus || 'pending',
          pred.createdAt || new Date().toISOString(),
          pred.lastSyncedAt || null,
        ]
      );
    } catch (err) {
      console.warn('[aiRepository] savePrediction retry with explicit table creation:', err);
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS ai_predictions (
          localId TEXT PRIMARY KEY,
          remoteId TEXT,
          entityId TEXT NOT NULL,
          modelName TEXT NOT NULL,
          modelVersion TEXT NOT NULL,
          predictedCategory TEXT NOT NULL,
          confidence REAL NOT NULL,
          alternativesJson TEXT,
          userConfirmed INTEGER NOT NULL DEFAULT 1,
          finalCategory TEXT NOT NULL,
          feedbackNotes TEXT,
          syncStatus TEXT NOT NULL DEFAULT 'pending',
          createdAt TEXT NOT NULL,
          lastSyncedAt TEXT
        );
      `);
      await db.runAsync(
        `INSERT OR REPLACE INTO ai_predictions (
          localId, remoteId, entityId, modelName, modelVersion,
          predictedCategory, confidence, alternativesJson,
          userConfirmed, finalCategory, feedbackNotes,
          syncStatus, createdAt, lastSyncedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pred.localId,
          pred.remoteId || null,
          pred.entityId,
          pred.modelName,
          pred.modelVersion,
          pred.predictedCategory,
          pred.confidence,
          JSON.stringify(pred.alternatives || []),
          pred.userConfirmed ? 1 : 0,
          pred.finalCategory,
          pred.feedbackNotes || null,
          pred.syncStatus || 'pending',
          pred.createdAt || new Date().toISOString(),
          pred.lastSyncedAt || null,
        ]
      );
    }
  },

  async updatePredictionFeedback(
    localId: string,
    finalCategory: MaterialCategoryId,
    userConfirmed: boolean,
    feedbackNotes?: string
  ): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE ai_predictions
       SET finalCategory = ?, userConfirmed = ?, feedbackNotes = ?, syncStatus = 'pending'
       WHERE localId = ?`,
      [finalCategory, userConfirmed ? 1 : 0, feedbackNotes || null, localId]
    );
  },

  async getPrediction(localId: string): Promise<AIPrediction | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM ai_predictions WHERE localId = ?`,
      [localId]
    );
    return row ? mapRowToPrediction(row) : null;
  },

  async getPredictionByEntity(entityId: string): Promise<AIPrediction | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM ai_predictions WHERE entityId = ? ORDER BY createdAt DESC LIMIT 1`,
      [entityId]
    );
    return row ? mapRowToPrediction(row) : null;
  },

  // --- Price Estimates ---
  async savePriceEstimate(est: AIPriceEstimate): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO ai_price_estimates (
        localId, remoteId, lotId, modelName, modelVersion,
        estimatedMin, estimatedMax, estimatedAverage, confidence,
        basisJson, dataPointCount, lastMarketDataAt,
        syncStatus, createdAt, lastSyncedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        est.localId,
        est.remoteId || null,
        est.lotId,
        est.modelName,
        est.modelVersion,
        est.estimatedMin,
        est.estimatedMax,
        est.estimatedAverage,
        est.confidence,
        JSON.stringify(est.basis || []),
        est.dataPointCount || 0,
        est.lastMarketDataAt || null,
        est.syncStatus || 'pending',
        est.createdAt || new Date().toISOString(),
        est.lastSyncedAt || null,
      ]
    );
  },

  async getPriceEstimateByLot(lotId: string): Promise<AIPriceEstimate | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM ai_price_estimates WHERE lotId = ? ORDER BY createdAt DESC LIMIT 1`,
      [lotId]
    );
    return row ? mapRowToPriceEstimate(row) : null;
  },

  // --- Anomaly Events ---
  async saveAnomalyEvent(evt: AIAnomalyEvent): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO ai_anomaly_events (
        localId, remoteId, transactionId, lotId, modelName, modelVersion,
        anomalyScore, status, reason, signalsJson,
        syncStatus, createdAt, lastSyncedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        evt.localId,
        evt.remoteId || null,
        evt.transactionId || null,
        evt.lotId || null,
        evt.modelName,
        evt.modelVersion,
        evt.anomalyScore,
        evt.status,
        evt.reason || null,
        JSON.stringify(evt.signals || []),
        evt.syncStatus || 'pending',
        evt.createdAt || new Date().toISOString(),
        evt.lastSyncedAt || null,
      ]
    );
  },

  async getAnomalyEventsByTransaction(txId: string): Promise<AIAnomalyEvent[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM ai_anomaly_events WHERE transactionId = ? ORDER BY createdAt DESC`,
      [txId]
    );
    return rows.map(mapRowToAnomalyEvent);
  },

  async getAnomalyEventsByLot(lotId: string): Promise<AIAnomalyEvent[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM ai_anomaly_events WHERE lotId = ? ORDER BY createdAt DESC`,
      [lotId]
    );
    return rows.map(mapRowToAnomalyEvent);
  },

  // --- Sync helper ---
  async updateSyncStatus(
    table: 'ai_predictions' | 'ai_price_estimates' | 'ai_anomaly_events',
    localId: string,
    syncStatus: SyncStatus,
    remoteId?: string
  ): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    if (remoteId) {
      await db.runAsync(
        `UPDATE ${table} SET syncStatus = ?, remoteId = ?, lastSyncedAt = ? WHERE localId = ?`,
        [syncStatus, remoteId, now, localId]
      );
    } else {
      await db.runAsync(
        `UPDATE ${table} SET syncStatus = ?, lastSyncedAt = ? WHERE localId = ?`,
        [syncStatus, now, localId]
      );
    }
  },
};
