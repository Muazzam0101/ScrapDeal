import { getDatabase } from '../database';
import { DeviceToken } from '../../../types';

export const deviceTokenRepository = {
  /**
   * Saves or updates a device FCM token for a user.
   */
  async saveDeviceToken(deviceToken: DeviceToken): Promise<void> {
    const db = await getDatabase();
    const id = deviceToken.id || `${deviceToken.userId}_${deviceToken.platform}_${Date.now()}`;
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO device_tokens (id, userId, token, platform, deviceModel, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         token = excluded.token,
         platform = excluded.platform,
         deviceModel = excluded.deviceModel,
         updatedAt = excluded.updatedAt`,
      [
        id,
        deviceToken.userId,
        deviceToken.token,
        deviceToken.platform,
        deviceToken.deviceModel || null,
        deviceToken.updatedAt || now,
      ]
    );
  },

  /**
   * Retrieves all device tokens for a given user.
   */
  async getTokensForUser(userId: string): Promise<DeviceToken[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM device_tokens WHERE userId = ?`,
      [userId]
    );
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      token: r.token,
      platform: r.platform,
      deviceModel: r.deviceModel || undefined,
      updatedAt: r.updatedAt,
    }));
  },

  /**
   * Removes a device token upon logout or token invalidation.
   */
  async deleteToken(userId: string, token: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `DELETE FROM device_tokens WHERE userId = ? AND token = ?`,
      [userId, token]
    );
  },
};
