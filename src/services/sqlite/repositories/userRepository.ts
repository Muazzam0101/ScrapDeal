import { getDatabase } from '../database';
import { User, CollectorProfile, RecyclerProfile, UserRole, LanguageCode } from '../../../types';

export const userRepository = {
  /**
   * Saves or updates a user profile locally.
   */
  async saveUser(user: User): Promise<User> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    const isCollector = user.role === 'collector';
    const collector = isCollector ? (user as CollectorProfile) : null;
    const recycler = !isCollector ? (user as RecyclerProfile) : null;

    const name = collector?.name || null;
    const businessName = recycler?.firmName || recycler?.businessName || null;
    const contactName = recycler?.contactName || recycler?.contactPerson || null;
    const address = recycler?.facilityAddress || recycler?.address || null;
    const location = collector?.location || collector?.operatingCity || recycler?.city || 'पुणे';
    const verificationStatus = (isCollector ? collector?.verificationStatus : recycler?.verificationStatus) || 'verified';

    await db.runAsync(
      `INSERT INTO users (
        id, phoneNumber, role, name, businessName, contactName, address,
        location, language, verificationStatus, remoteId, syncStatus, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        phoneNumber = excluded.phoneNumber,
        role = excluded.role,
        name = excluded.name,
        businessName = excluded.businessName,
        contactName = excluded.contactName,
        address = excluded.address,
        location = excluded.location,
        language = excluded.language,
        verificationStatus = excluded.verificationStatus,
        remoteId = excluded.remoteId,
        syncStatus = excluded.syncStatus,
        updatedAt = excluded.updatedAt`,
      [
        user.id,
        user.phoneNumber,
        user.role,
        name,
        businessName,
        contactName,
        address,
        location,
        user.language || 'hi',
        verificationStatus,
        user.remoteId || null,
        user.syncStatus || 'synced',
        user.createdAt || now,
        user.updatedAt || now,
      ]
    );

    return user;
  },

  /**
   * Retrieves a user by their ID.
   */
  async getUserById(id: string): Promise<User | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM users WHERE id = ? OR remoteId = ?`,
      [id, id]
    );

    if (!row) return null;
    return this.mapRowToUser(row);
  },

  /**
   * Retrieves the most recently active user locally (for offline session persistence).
   */
  async getCurrentUser(): Promise<User | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM users ORDER BY updatedAt DESC LIMIT 1`
    );

    if (!row) return null;
    return this.mapRowToUser(row);
  },

  /**
   * Retrieves all registered recyclers from local SQLite cache.
   */
  async getAllRecyclers(): Promise<RecyclerProfile[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM users WHERE role = 'recycler' ORDER BY createdAt DESC`
    );
    return rows.map((r) => this.mapRowToUser(r) as RecyclerProfile);
  },

  /**
   * Updates profile fields.
   */
  async updateProfile(id: string, updates: Partial<User>): Promise<void> {
    const db = await getDatabase();
    const existing = await this.getUserById(id);
    if (!existing) return;

    if (existing.role === 'collector') {
      const merged: CollectorProfile = {
        ...existing,
        ...(updates as Partial<CollectorProfile>),
        role: 'collector',
        updatedAt: new Date().toISOString(),
      };
      await this.saveUser(merged);
    } else {
      const merged: RecyclerProfile = {
        ...existing,
        ...(updates as Partial<RecyclerProfile>),
        role: 'recycler',
        updatedAt: new Date().toISOString(),
      };
      await this.saveUser(merged);
    }
  },

  /**
   * Helper to map a DB row to User object.
   */
  mapRowToUser(row: any): User {
    const role = (row.role as UserRole) || 'collector';
    const base = {
      id: row.id,
      phoneNumber: row.phoneNumber,
      role,
      language: (row.language as LanguageCode) || 'hi',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      remoteId: row.remoteId || undefined,
      syncStatus: row.syncStatus,
    };

    if (role === 'collector') {
      const collector: CollectorProfile = {
        ...base,
        role: 'collector',
        name: row.name || 'कबाड़ी मित्र',
        location: row.location || 'पुणे, महाराष्ट्र',
        operatingCity: row.location || 'पुणे',
        verificationStatus: row.verificationStatus || 'verified',
        rating: 4.8,
        totalTransactions: 0,
        safetyScore: 95,
      };
      return collector;
    } else {
      const recycler: RecyclerProfile = {
        ...base,
        role: 'recycler',
        firmName: row.businessName || 'Green Earth Recycling',
        businessName: row.businessName || 'Green Earth Recycling',
        contactName: row.contactName || 'व्यवस्थापक',
        contactPerson: row.contactName || 'व्यवस्थापक',
        facilityAddress: row.address || 'भोसरी MIDC, पुणे',
        address: row.address || 'भोसरी MIDC, पुणे',
        city: row.location || 'पुणे',
        isVerified: true,
        verificationStatus: row.verificationStatus || 'verified',
        serviceRadiusKm: 25,
      };
      return recycler;
    }
  },
};
