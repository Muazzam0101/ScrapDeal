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
    const location = collector?.location || collector?.operatingCity || recycler?.city || null;
    const verificationStatus = (isCollector ? collector?.verificationStatus : recycler?.verificationStatus) || 'pending';

    const identityVerificationStatus = user.identityVerificationStatus || 'not_started';
    const identityVerificationProvider = user.identityVerificationProvider || null;
    const identityVerificationRef = user.identityVerificationRef || null;
    const identityVerifiedAt = user.identityVerifiedAt || null;

    const authorizationVerificationStatus = recycler?.authorizationVerificationStatus || 'not_started';
    const authorizationVerificationProvider = recycler?.authorizationVerificationProvider || null;
    const authorizationVerificationRef = recycler?.authorizationVerificationRef || null;
    const authorizationVerifiedAt = recycler?.authorizationVerifiedAt || null;

    const serviceRadiusKm = recycler?.serviceRadiusKm !== undefined ? recycler.serviceRadiusKm : 25;
    const serviceArea = recycler?.serviceArea || null;
    const acceptedMaterials = recycler?.acceptedMaterials ? JSON.stringify(recycler.acceptedMaterials) : null;
    const pickupAvailable = recycler?.pickupAvailable !== undefined ? (recycler.pickupAvailable ? 1 : 0) : 1;
    const isAvailable = recycler?.isAvailable !== undefined ? (recycler.isAvailable ? 1 : 0) : 1;

    const latitude = user.latitude !== undefined ? user.latitude : null;
    const longitude = user.longitude !== undefined ? user.longitude : null;

    await db.runAsync(
      `INSERT INTO users (
        id, phoneNumber, role, name, businessName, contactName, address,
        location, language, verificationStatus,
        identityVerificationStatus, identityVerificationProvider, identityVerificationRef, identityVerifiedAt,
        authorizationVerificationStatus, authorizationVerificationProvider, authorizationVerificationRef, authorizationVerifiedAt,
        serviceRadiusKm, serviceArea, acceptedMaterials, pickupAvailable, isAvailable,
        latitude, longitude,
        remoteId, syncStatus, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        identityVerificationStatus = excluded.identityVerificationStatus,
        identityVerificationProvider = excluded.identityVerificationProvider,
        identityVerificationRef = excluded.identityVerificationRef,
        identityVerifiedAt = excluded.identityVerifiedAt,
        authorizationVerificationStatus = excluded.authorizationVerificationStatus,
        authorizationVerificationProvider = excluded.authorizationVerificationProvider,
        authorizationVerificationRef = excluded.authorizationVerificationRef,
        authorizationVerifiedAt = excluded.authorizationVerifiedAt,
        serviceRadiusKm = excluded.serviceRadiusKm,
        serviceArea = excluded.serviceArea,
        acceptedMaterials = excluded.acceptedMaterials,
        pickupAvailable = excluded.pickupAvailable,
        isAvailable = excluded.isAvailable,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
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
        identityVerificationStatus,
        identityVerificationProvider,
        identityVerificationRef,
        identityVerifiedAt,
        authorizationVerificationStatus,
        authorizationVerificationProvider,
        authorizationVerificationRef,
        authorizationVerifiedAt,
        serviceRadiusKm,
        serviceArea,
        acceptedMaterials,
        pickupAvailable,
        isAvailable,
        latitude,
        longitude,
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
    const existing = await this.getUserById(id);
    if (!existing) return;

    const merged = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    } as User;

    await this.saveUser(merged);
  },

  /**
   * Helper to map a DB row to User object.
   */
  mapRowToUser(row: any): User {
    const role = (row.role as UserRole) || 'collector';
    let acceptedMaterialsList: string[] = [];
    if (row.acceptedMaterials) {
      try {
        acceptedMaterialsList = JSON.parse(row.acceptedMaterials);
      } catch {
        acceptedMaterialsList = [];
      }
    }

    const base = {
      id: row.id,
      phoneNumber: row.phoneNumber,
      role,
      language: (row.language as LanguageCode) || 'hi',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      remoteId: row.remoteId || undefined,
      syncStatus: row.syncStatus,
      identityVerificationStatus: row.identityVerificationStatus || 'not_started',
      identityVerificationProvider: row.identityVerificationProvider || undefined,
      identityVerificationRef: row.identityVerificationRef || undefined,
      identityVerifiedAt: row.identityVerifiedAt || undefined,
      latitude: row.latitude !== null && row.latitude !== undefined ? Number(row.latitude) : undefined,
      longitude: row.longitude !== null && row.longitude !== undefined ? Number(row.longitude) : undefined,
    };

    if (role === 'collector') {
      const collector: CollectorProfile = {
        ...base,
        role: 'collector',
        name: row.name || undefined,
        location: row.location || undefined,
        operatingCity: row.location || undefined,
        verificationStatus: row.verificationStatus || 'pending',
        rating: 4.8,
        totalTransactions: 0,
        safetyScore: 95,
      };
      return collector;
    } else {
      const recycler: RecyclerProfile = {
        ...base,
        role: 'recycler',
        firmName: row.businessName || undefined,
        businessName: row.businessName || undefined,
        contactName: row.contactName || undefined,
        contactPerson: row.contactName || undefined,
        facilityAddress: row.address || undefined,
        address: row.address || undefined,
        city: row.location || undefined,
        isVerified: row.authorizationVerificationStatus === 'verified' && row.identityVerificationStatus === 'verified',
        verificationStatus: row.verificationStatus || 'pending',
        authorizationVerificationStatus: row.authorizationVerificationStatus || 'not_started',
        authorizationVerificationProvider: row.authorizationVerificationProvider || undefined,
        authorizationVerificationRef: row.authorizationVerificationRef || undefined,
        authorizationVerifiedAt: row.authorizationVerifiedAt || undefined,
        serviceRadiusKm: row.serviceRadiusKm !== null && row.serviceRadiusKm !== undefined ? Number(row.serviceRadiusKm) : 25,
        serviceArea: row.serviceArea || undefined,
        acceptedMaterials: acceptedMaterialsList,
        pickupAvailable: row.pickupAvailable !== null ? Boolean(row.pickupAvailable) : true,
        isAvailable: row.isAvailable !== null ? Boolean(row.isAvailable) : true,
      };
      return recycler;
    }
  },
};
