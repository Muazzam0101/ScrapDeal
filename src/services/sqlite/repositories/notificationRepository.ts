import { getDatabase } from '../database';
import { AppNotification, NotificationType, NotificationEntityType, SyncStatus } from '../../../types';

export const notificationRepository = {
  /**
   * Inserts a notification locally in SQLite.
   */
  async createNotification(notif: AppNotification): Promise<AppNotification> {
    const db = await getDatabase();
    const notificationId = notif.notificationId || notif.id || `NOTIF-${Date.now()}`;
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO notifications (
        notificationId, remoteId, userId, type, title, body,
        entityType, entityId, read, createdAt, updatedAt,
        syncStatus, lastSyncedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        notificationId,
        notif.remoteId || null,
        notif.userId,
        notif.type,
        notif.title,
        notif.body,
        notif.entityType,
        notif.entityId,
        notif.read ? 1 : 0,
        notif.createdAt || now,
        notif.updatedAt || now,
        notif.syncStatus || 'pending',
        null,
      ]
    );

    return {
      ...notif,
      id: notificationId,
      notificationId,
    };
  },

  /**
   * Retrieves all notifications for a specific user, sorted newest first.
   */
  async getNotificationsForUser(userId: string): Promise<AppNotification[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC`,
      [userId]
    );
    return rows.map((r) => this.mapRowToNotification(r));
  },

  /**
   * Counts unread notifications for a user.
   */
  async getUnreadCount(userId: string): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND read = 0`,
      [userId]
    );
    return result?.count || 0;
  },

  /**
   * Marks a specific notification as read.
   */
  async markAsRead(notificationId: string): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE notifications SET read = 1, updatedAt = ?, syncStatus = 'pending' WHERE notificationId = ? OR remoteId = ?`,
      [now, notificationId, notificationId]
    );
  },

  /**
   * Marks all notifications for a user as read.
   */
  async markAllAsRead(userId: string): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE notifications SET read = 1, updatedAt = ?, syncStatus = 'pending' WHERE userId = ? AND read = 0`,
      [now, userId]
    );
  },

  /**
   * Updates sync status and remoteId for a notification.
   */
  async updateNotificationSyncStatus(
    notificationId: string,
    syncStatus: SyncStatus,
    remoteId?: string
  ): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    if (remoteId) {
      await db.runAsync(
        `UPDATE notifications SET syncStatus = ?, remoteId = ?, lastSyncedAt = ? WHERE notificationId = ?`,
        [syncStatus, remoteId, now, notificationId]
      );
    } else {
      await db.runAsync(
        `UPDATE notifications SET syncStatus = ?, lastSyncedAt = ? WHERE notificationId = ?`,
        [syncStatus, now, notificationId]
      );
    }
  },

  /**
   * Saves or merges remote notifications into SQLite cache.
   */
  async saveNotificationsFromRemote(notifications: AppNotification[]): Promise<void> {
    const db = await getDatabase();
    for (const notif of notifications) {
      const notificationId = notif.notificationId || notif.id || '';
      await db.runAsync(
        `INSERT INTO notifications (
          notificationId, remoteId, userId, type, title, body,
          entityType, entityId, read, createdAt, updatedAt,
          syncStatus, lastSyncedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)
        ON CONFLICT(notificationId) DO UPDATE SET
          read = excluded.read,
          updatedAt = excluded.updatedAt,
          syncStatus = 'synced',
          lastSyncedAt = excluded.lastSyncedAt`,
        [
          notificationId,
          notif.remoteId || notif.id || null,
          notif.userId,
          notif.type,
          notif.title,
          notif.body,
          notif.entityType,
          notif.entityId,
          notif.read ? 1 : 0,
          notif.createdAt,
          notif.updatedAt || notif.createdAt,
          new Date().toISOString(),
        ]
      );
    }
  },

  mapRowToNotification(row: any): AppNotification {
    return {
      notificationId: row.notificationId,
      id: row.notificationId,
      remoteId: row.remoteId || undefined,
      userId: row.userId,
      type: row.type as NotificationType,
      title: row.title,
      body: row.body,
      entityType: row.entityType as NotificationEntityType,
      entityId: row.entityId,
      read: row.read === 1,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt || undefined,
      syncStatus: (row.syncStatus || 'pending') as SyncStatus,
    };
  },
};
