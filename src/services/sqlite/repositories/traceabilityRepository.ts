import { getDatabase } from '../database';
import {
  TraceabilityRecord,
  TraceabilityEvent,
  HandoverConfirmation,
  HandoverPhotoRecord,
  TraceabilityStatus,
  SyncStatus,
} from '../../../types';

export const traceabilityRepository = {
  /**
   * Creates or inserts a new traceability record in SQLite.
   */
  async createRecord(record: TraceabilityRecord): Promise<TraceabilityRecord> {
    const db = await getDatabase();
    const id = record.traceabilityId;
    const now = new Date().toISOString();

    const collectionLocJson = record.collectionLocation ? JSON.stringify(record.collectionLocation) : null;
    const handoverLocJson = record.handoverLocation ? JSON.stringify(record.handoverLocation) : null;

    const params = [
      id,
      record.lotId,
      record.dealId || null,
      record.handoverId || null,
      record.transactionId || null,
      record.paymentId || null,
      record.collectorId,
      record.recyclerId || null,
      record.materialCategory,
      record.initialMaterial,
      record.finalMaterial || null,
      record.aiPredictedMaterial || null,
      Number(record.estimatedWeight) || 0,
      record.finalWeight !== undefined && record.finalWeight !== null ? Number(record.finalWeight) : null,
      record.weightDifference !== undefined && record.weightDifference !== null ? Number(record.weightDifference) : null,
      record.weightDifferenceDirection || 'exact',
      collectionLocJson,
      handoverLocJson,
      record.collectionTimestamp || now,
      record.handoverTimestamp || null,
      record.completionTimestamp || null,
      record.status || 'created',
      record.handoverReference || null,
      record.qrReferenceToken,
      record.collectorConfirmedHandover ? 1 : 0,
      record.recyclerConfirmedHandover ? 1 : 0,
      record.paymentMethod || null,
      record.paymentStatus || null,
      record.agreedRatePerKg || null,
      record.agreedTotalAmount || null,
      record.hasConflict ? 1 : 0,
      record.conflictDetails || null,
      record.createdAt || now,
      record.updatedAt || now,
      record.syncStatus || 'pending',
      record.lastSyncedAt || null,
    ];

    try {
      await db.runAsync(
        `INSERT OR REPLACE INTO traceability_records (
          traceabilityId, lotId, dealId, handoverId, transactionId, paymentId,
          collectorId, recyclerId, materialCategory, initialMaterial, finalMaterial,
          aiPredictedMaterial, estimatedWeight, finalWeight, weightDifference,
          weightDifferenceDirection, collectionLocation, handoverLocation,
          collectionTimestamp, handoverTimestamp, completionTimestamp, status,
          handoverReference, qrReferenceToken, collectorConfirmedHandover,
          recyclerConfirmedHandover, paymentMethod, paymentStatus, agreedRatePerKg,
          agreedTotalAmount, hasConflict, conflictDetails, createdAt, updatedAt,
          syncStatus, lastSyncedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params
      );
    } catch (insertErr) {
      console.warn('[traceabilityRepository] insert failed, ensuring schema:', insertErr);
      await this.ensureTableSchema(db);
      await db.runAsync(
        `INSERT OR REPLACE INTO traceability_records (
          traceabilityId, lotId, dealId, handoverId, transactionId, paymentId,
          collectorId, recyclerId, materialCategory, initialMaterial, finalMaterial,
          aiPredictedMaterial, estimatedWeight, finalWeight, weightDifference,
          weightDifferenceDirection, collectionLocation, handoverLocation,
          collectionTimestamp, handoverTimestamp, completionTimestamp, status,
          handoverReference, qrReferenceToken, collectorConfirmedHandover,
          recyclerConfirmedHandover, paymentMethod, paymentStatus, agreedRatePerKg,
          agreedTotalAmount, hasConflict, conflictDetails, createdAt, updatedAt,
          syncStatus, lastSyncedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params
      );
    }

    return {
      ...record,
      id,
    };
  },

  /**
   * Updates an existing traceability record.
   */
  async updateRecord(record: Partial<TraceabilityRecord> & { traceabilityId: string }): Promise<void> {
    const db = await getDatabase();
    const existing = await this.getRecordByTraceabilityId(record.traceabilityId);
    if (!existing) {
      throw new Error(`Traceability record not found: ${record.traceabilityId}`);
    }

    const merged: TraceabilityRecord = {
      ...existing,
      ...record,
      updatedAt: new Date().toISOString(),
    };

    await this.createRecord(merged);
  },

  /**
   * Retrieves a traceability record by lotId.
   */
  async getRecordByLotId(lotId: string): Promise<TraceabilityRecord | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM traceability_records WHERE lotId = ? LIMIT 1`,
      [lotId]
    );
    return row ? this.mapRowToRecord(row) : null;
  },

  /**
   * Retrieves a traceability record by traceabilityId.
   */
  async getRecordByTraceabilityId(traceabilityId: string): Promise<TraceabilityRecord | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM traceability_records WHERE traceabilityId = ? LIMIT 1`,
      [traceabilityId]
    );
    return row ? this.mapRowToRecord(row) : null;
  },

  /**
   * Retrieves a traceability record by QR verification token.
   */
  async getRecordByQrToken(qrReferenceToken: string): Promise<TraceabilityRecord | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM traceability_records WHERE qrReferenceToken = ? OR traceabilityId = ? LIMIT 1`,
      [qrReferenceToken, qrReferenceToken]
    );
    return row ? this.mapRowToRecord(row) : null;
  },

  /**
   * Retrieves all traceability records for a given user (as collector or recycler).
   */
  async getRecordsForUser(userId: string): Promise<TraceabilityRecord[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM traceability_records WHERE collectorId = ? OR recyclerId = ? ORDER BY createdAt DESC`,
      [userId, userId]
    );
    return rows.map((r) => this.mapRowToRecord(r));
  },

  // -------------------------------------------------------------
  // AUDIT EVENTS REPOSITORY METHODS
  // -------------------------------------------------------------

  /**
   * Records an immutable audit event in SQLite.
   */
  async recordEvent(event: TraceabilityEvent): Promise<TraceabilityEvent> {
    const db = await getDatabase();
    const eventId = event.eventId || `EVT-${Date.now()}`;
    const now = new Date().toISOString();
    const locJson = event.location ? JSON.stringify(event.location) : null;
    const metaJson = event.metadata ? JSON.stringify(event.metadata) : null;

    const params = [
      eventId,
      event.traceabilityId,
      event.lotId,
      event.dealId || null,
      event.handoverId || null,
      event.transactionId || null,
      event.eventType,
      event.actorId,
      event.actorType,
      event.previousStatus || null,
      event.newStatus,
      event.timestamp || now,
      locJson,
      metaJson,
      event.syncStatus || 'pending',
      event.createdAt || now,
    ];

    try {
      await db.runAsync(
        `INSERT INTO traceability_events (
          eventId, traceabilityId, lotId, dealId, handoverId, transactionId,
          eventType, actorId, actorType, previousStatus, newStatus,
          timestamp, location, metadata, syncStatus, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params
      );
    } catch (insertErr) {
      console.warn('[traceabilityRepository] event insert failed, ensuring schema:', insertErr);
      await this.ensureTableSchema(db);
      await db.runAsync(
        `INSERT INTO traceability_events (
          eventId, traceabilityId, lotId, dealId, handoverId, transactionId,
          eventType, actorId, actorType, previousStatus, newStatus,
          timestamp, location, metadata, syncStatus, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params
      );
    }

    return {
      ...event,
      eventId,
    };
  },

  /**
   * Retrieves all audit events for a lot chronologically.
   */
  async getEventsForLot(lotId: string): Promise<TraceabilityEvent[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM traceability_events WHERE lotId = ? ORDER BY timestamp ASC`,
      [lotId]
    );
    return rows.map((r) => this.mapRowToEvent(r));
  },

  /**
   * Retrieves all audit events for a traceabilityId chronologically.
   */
  async getEventsForTraceability(traceabilityId: string): Promise<TraceabilityEvent[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM traceability_events WHERE traceabilityId = ? ORDER BY timestamp ASC`,
      [traceabilityId]
    );
    return rows.map((r) => this.mapRowToEvent(r));
  },

  // -------------------------------------------------------------
  // HANDOVER CONFIRMATIONS & PHOTOS
  // -------------------------------------------------------------

  /**
   * Records a handover confirmation.
   */
  async recordHandoverConfirmation(confirmation: HandoverConfirmation): Promise<HandoverConfirmation> {
    const db = await getDatabase();
    const confirmationId = confirmation.confirmationId || `CONF-${Date.now()}`;
    const now = new Date().toISOString();
    const locJson = confirmation.location ? JSON.stringify(confirmation.location) : null;

    const params = [
      confirmationId,
      confirmation.handoverId,
      confirmation.lotId,
      confirmation.dealId,
      confirmation.confirmedBy,
      confirmation.userType,
      confirmation.confirmationType,
      confirmation.timestamp || now,
      locJson,
      Number(confirmation.weightConfirmed) || 0,
      confirmation.notes || null,
      confirmation.syncStatus || 'pending',
      confirmation.createdAt || now,
    ];

    try {
      await db.runAsync(
        `INSERT INTO handover_confirmations (
          confirmationId, handoverId, lotId, dealId, confirmedBy, userType,
          confirmationType, timestamp, location, weightConfirmed, notes,
          syncStatus, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params
      );
    } catch (insertErr) {
      await this.ensureTableSchema(db);
      await db.runAsync(
        `INSERT INTO handover_confirmations (
          confirmationId, handoverId, lotId, dealId, confirmedBy, userType,
          confirmationType, timestamp, location, weightConfirmed, notes,
          syncStatus, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params
      );
    }

    return {
      ...confirmation,
      confirmationId,
    };
  },

  /**
   * Gets confirmations for a handover.
   */
  async getConfirmationsForHandover(handoverId: string): Promise<HandoverConfirmation[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM handover_confirmations WHERE handoverId = ? ORDER BY timestamp ASC`,
      [handoverId]
    );
    return rows.map((r) => ({
      confirmationId: r.confirmationId,
      handoverId: r.handoverId,
      lotId: r.lotId,
      dealId: r.dealId,
      confirmedBy: r.confirmedBy,
      userType: r.userType,
      confirmationType: r.confirmationType,
      timestamp: r.timestamp,
      location: r.location ? JSON.parse(r.location) : undefined,
      weightConfirmed: Number(r.weightConfirmed) || 0,
      notes: r.notes || undefined,
      syncStatus: r.syncStatus as SyncStatus,
      createdAt: r.createdAt,
    }));
  },

  /**
   * Records a handover photo.
   */
  async recordHandoverPhoto(photo: HandoverPhotoRecord): Promise<HandoverPhotoRecord> {
    const db = await getDatabase();
    const photoId = photo.photoId || `HPHOTO-${Date.now()}`;
    const now = new Date().toISOString();

    const params = [
      photoId,
      photo.lotId,
      photo.handoverId,
      photo.storageReference,
      photo.capturedAt || now,
      photo.capturedBy,
      photo.photoType || 'at_handover',
      photo.syncStatus || 'pending',
      photo.createdAt || now,
    ];

    try {
      await db.runAsync(
        `INSERT INTO handover_photos (
          photoId, lotId, handoverId, storageReference, capturedAt,
          capturedBy, photoType, syncStatus, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params
      );
    } catch (insertErr) {
      await this.ensureTableSchema(db);
      await db.runAsync(
        `INSERT INTO handover_photos (
          photoId, lotId, handoverId, storageReference, capturedAt,
          capturedBy, photoType, syncStatus, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params
      );
    }

    return {
      ...photo,
      photoId,
    };
  },

  /**
   * Gets photos for a handover.
   */
  async getPhotosForHandover(handoverId: string): Promise<HandoverPhotoRecord[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM handover_photos WHERE handoverId = ? ORDER BY capturedAt ASC`,
      [handoverId]
    );
    return rows.map((r) => ({
      photoId: r.photoId,
      lotId: r.lotId,
      handoverId: r.handoverId,
      storageReference: r.storageReference,
      capturedAt: r.capturedAt,
      capturedBy: r.capturedBy,
      photoType: r.photoType,
      syncStatus: r.syncStatus as SyncStatus,
      createdAt: r.createdAt,
    }));
  },

  // -------------------------------------------------------------
  // TABLE SCHEMA ENSURANCE (Self-Healing)
  // -------------------------------------------------------------
  async ensureTableSchema(db: any): Promise<void> {
    try {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS traceability_records (
          traceabilityId TEXT PRIMARY KEY,
          lotId TEXT NOT NULL,
          dealId TEXT,
          handoverId TEXT,
          transactionId TEXT,
          paymentId TEXT,
          collectorId TEXT NOT NULL,
          recyclerId TEXT,
          materialCategory TEXT NOT NULL,
          initialMaterial TEXT NOT NULL,
          finalMaterial TEXT,
          aiPredictedMaterial TEXT,
          estimatedWeight REAL NOT NULL,
          finalWeight REAL,
          weightDifference REAL,
          weightDifferenceDirection TEXT DEFAULT 'exact',
          collectionLocation TEXT,
          handoverLocation TEXT,
          collectionTimestamp TEXT NOT NULL,
          handoverTimestamp TEXT,
          completionTimestamp TEXT,
          status TEXT NOT NULL DEFAULT 'created',
          handoverReference TEXT,
          qrReferenceToken TEXT NOT NULL,
          collectorConfirmedHandover INTEGER DEFAULT 0,
          recyclerConfirmedHandover INTEGER DEFAULT 0,
          paymentMethod TEXT,
          paymentStatus TEXT,
          agreedRatePerKg REAL,
          agreedTotalAmount REAL,
          hasConflict INTEGER DEFAULT 0,
          conflictDetails TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          syncStatus TEXT NOT NULL DEFAULT 'pending',
          lastSyncedAt TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_traceability_lot ON traceability_records (lotId);
        CREATE INDEX IF NOT EXISTS idx_traceability_deal ON traceability_records (dealId);
        CREATE INDEX IF NOT EXISTS idx_traceability_handover ON traceability_records (handoverId);
        CREATE INDEX IF NOT EXISTS idx_traceability_qr ON traceability_records (qrReferenceToken);
        CREATE INDEX IF NOT EXISTS idx_traceability_status ON traceability_records (status);

        CREATE TABLE IF NOT EXISTS traceability_events (
          eventId TEXT PRIMARY KEY,
          traceabilityId TEXT NOT NULL,
          lotId TEXT NOT NULL,
          dealId TEXT,
          handoverId TEXT,
          transactionId TEXT,
          eventType TEXT NOT NULL,
          actorId TEXT NOT NULL,
          actorType TEXT NOT NULL,
          previousStatus TEXT,
          newStatus TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          location TEXT,
          metadata TEXT,
          syncStatus TEXT NOT NULL DEFAULT 'pending',
          createdAt TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_events_traceability ON traceability_events (traceabilityId);
        CREATE INDEX IF NOT EXISTS idx_events_lot ON traceability_events (lotId);
        CREATE INDEX IF NOT EXISTS idx_events_type ON traceability_events (eventType);

        CREATE TABLE IF NOT EXISTS handover_confirmations (
          confirmationId TEXT PRIMARY KEY,
          handoverId TEXT NOT NULL,
          lotId TEXT NOT NULL,
          dealId TEXT NOT NULL,
          confirmedBy TEXT NOT NULL,
          userType TEXT NOT NULL,
          confirmationType TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          location TEXT,
          weightConfirmed REAL NOT NULL,
          notes TEXT,
          syncStatus TEXT NOT NULL DEFAULT 'pending',
          createdAt TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_ho_conf_handover ON handover_confirmations (handoverId);

        CREATE TABLE IF NOT EXISTS handover_photos (
          photoId TEXT PRIMARY KEY,
          lotId TEXT NOT NULL,
          handoverId TEXT NOT NULL,
          storageReference TEXT NOT NULL,
          capturedAt TEXT NOT NULL,
          capturedBy TEXT NOT NULL,
          photoType TEXT NOT NULL DEFAULT 'at_handover',
          syncStatus TEXT NOT NULL DEFAULT 'pending',
          createdAt TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_ho_photos_handover ON handover_photos (handoverId);
      `);
    } catch (e) {
      console.warn('[traceabilityRepository] ensureTableSchema warning:', e);
    }
  },

  // -------------------------------------------------------------
  // ROW MAPPERS
  // -------------------------------------------------------------
  mapRowToRecord(row: any): TraceabilityRecord {
    return {
      traceabilityId: row.traceabilityId,
      lotId: row.lotId,
      dealId: row.dealId || undefined,
      handoverId: row.handoverId || undefined,
      transactionId: row.transactionId || undefined,
      paymentId: row.paymentId || undefined,
      collectorId: row.collectorId,
      recyclerId: row.recyclerId || undefined,
      materialCategory: row.materialCategory,
      initialMaterial: row.initialMaterial || row.materialCategory,
      finalMaterial: row.finalMaterial || undefined,
      aiPredictedMaterial: row.aiPredictedMaterial || undefined,
      estimatedWeight: Number(row.estimatedWeight) || 0,
      finalWeight: row.finalWeight !== null && row.finalWeight !== undefined ? Number(row.finalWeight) : undefined,
      weightDifference: row.weightDifference !== null && row.weightDifference !== undefined ? Number(row.weightDifference) : undefined,
      weightDifferenceDirection: row.weightDifferenceDirection || 'exact',
      collectionLocation: row.collectionLocation ? JSON.parse(row.collectionLocation) : undefined,
      handoverLocation: row.handoverLocation ? JSON.parse(row.handoverLocation) : undefined,
      collectionTimestamp: row.collectionTimestamp,
      handoverTimestamp: row.handoverTimestamp || undefined,
      completionTimestamp: row.completionTimestamp || undefined,
      status: row.status as TraceabilityStatus,
      handoverReference: row.handoverReference || undefined,
      qrReferenceToken: row.qrReferenceToken,
      collectorConfirmedHandover: Boolean(row.collectorConfirmedHandover),
      recyclerConfirmedHandover: Boolean(row.recyclerConfirmedHandover),
      paymentMethod: row.paymentMethod || undefined,
      paymentStatus: row.paymentStatus || undefined,
      agreedRatePerKg: row.agreedRatePerKg !== null ? Number(row.agreedRatePerKg) : undefined,
      agreedTotalAmount: row.agreedTotalAmount !== null ? Number(row.agreedTotalAmount) : undefined,
      hasConflict: Boolean(row.hasConflict),
      conflictDetails: row.conflictDetails || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      syncStatus: row.syncStatus as SyncStatus,
      lastSyncedAt: row.lastSyncedAt || undefined,
    };
  },

  mapRowToEvent(row: any): TraceabilityEvent {
    return {
      eventId: row.eventId,
      traceabilityId: row.traceabilityId,
      lotId: row.lotId,
      dealId: row.dealId || undefined,
      handoverId: row.handoverId || undefined,
      transactionId: row.transactionId || undefined,
      eventType: row.eventType,
      actorId: row.actorId,
      actorType: row.actorType,
      previousStatus: row.previousStatus as TraceabilityStatus | undefined,
      newStatus: row.newStatus as TraceabilityStatus,
      timestamp: row.timestamp,
      location: row.location ? JSON.parse(row.location) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      syncStatus: row.syncStatus as SyncStatus,
      createdAt: row.createdAt,
    };
  },
};
