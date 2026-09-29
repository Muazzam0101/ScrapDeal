import { AppNotification, NotificationType, NotificationEntityType, DeviceToken } from '../../types';
import { notificationRepository } from '../sqlite/repositories/notificationRepository';
import { deviceTokenRepository } from '../sqlite/repositories/deviceTokenRepository';
import { syncQueueRepository } from '../sqlite/repositories/syncQueueRepository';
import { networkService } from '../connectivity/networkService';
import { syncEngine } from '../sync/syncEngine';

class NotificationService {
  /**
   * Registers or updates an FCM device token for a user.
   * Supports multiple devices/tokens per user.
   */
  async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'android' | 'ios' | 'web' = 'android',
    deviceModel?: string
  ): Promise<DeviceToken> {
    if (!userId || !token) {
      throw new Error('UserId and token are required for device registration');
    }

    const id = `DT-${userId}-${platform}-${token.slice(-6)}`;
    const now = new Date().toISOString();

    const deviceToken: DeviceToken = {
      id,
      userId,
      token,
      platform,
      deviceModel,
      updatedAt: now,
    };

    // 1. Save to SQLite
    await deviceTokenRepository.saveDeviceToken(deviceToken);

    // 2. Queue for Firebase sync
    await syncQueueRepository.enqueueOperation({
      entityType: 'device_token',
      localId: id,
      operationType: 'CREATE',
      payload: deviceToken,
    });

    if (networkService.isOnline()) {
      syncEngine.triggerSync().catch((e) => console.warn('[NotificationService] Sync token error:', e));
    }

    return deviceToken;
  }

  /**
   * Dispatches a real event notification to a user.
   * Strictly triggered by real events — never creates mock or synthetic notifications.
   */
  async sendNotification(params: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    entityType: NotificationEntityType;
    entityId: string;
  }): Promise<AppNotification> {
    const notificationId = `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const notification: AppNotification = {
      notificationId,
      id: notificationId,
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      entityType: params.entityType,
      entityId: params.entityId,
      read: false,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    };

    // 1. Save locally in SQLite cache
    await notificationRepository.createNotification(notification);

    // 2. Queue in sync queue for Cloud Firestore & FCM delivery
    await syncQueueRepository.enqueueOperation({
      entityType: 'notification',
      localId: notificationId,
      operationType: 'CREATE',
      payload: notification,
    });

    // 3. Trigger sync if online
    if (networkService.isOnline()) {
      syncEngine.triggerSync().catch((e) => console.warn('[NotificationService] Sync notification error:', e));
    }

    return notification;
  }

  /**
   * Retrieves all notifications for a user from local SQLite cache.
   */
  async getNotifications(userId: string): Promise<AppNotification[]> {
    return notificationRepository.getNotificationsForUser(userId);
  }

  /**
   * Retrieves unread count for badge indicators.
   */
  async getUnreadCount(userId: string): Promise<number> {
    return notificationRepository.getUnreadCount(userId);
  }

  /**
   * Marks a notification as read and queues sync update.
   */
  async markAsRead(notificationId: string): Promise<void> {
    await notificationRepository.markAsRead(notificationId);

    await syncQueueRepository.enqueueOperation({
      entityType: 'notification',
      localId: notificationId,
      operationType: 'UPDATE',
      payload: {
        notificationId,
        read: true,
        updatedAt: new Date().toISOString(),
      },
    });

    if (networkService.isOnline()) {
      syncEngine.triggerSync().catch((e) => console.warn('[NotificationService] Sync markAsRead error:', e));
    }
  }

  /**
   * Marks all notifications for a user as read.
   */
  async markAllAsRead(userId: string): Promise<void> {
    await notificationRepository.markAllAsRead(userId);
  }

  /**
   * Maps a notification to deep link screen navigation parameters.
   */
  getDeepLinkForNotification(
    notification: AppNotification,
    userRole: 'collector' | 'recycler'
  ): { screen: string; params: any } {
    switch (notification.type) {
      case 'new_offer':
        return {
          screen: 'OfferDetails',
          params: { offerId: notification.entityId },
        };

      case 'offer_accepted':
      case 'deal_created':
      case 'deal_confirmed':
        return {
          screen: 'DealDetails',
          params: { dealId: notification.entityId },
        };

      case 'handover_pending':
      case 'handover_confirmed':
        return {
          screen: userRole === 'collector' ? 'Payment' : 'RecyclerPayment',
          params: { dealId: notification.entityId },
        };

      case 'payment_pending':
        return {
          screen: userRole === 'collector' ? 'Payment' : 'RecyclerPayment',
          params: { dealId: notification.entityId },
        };

      case 'payment_completed':
        return {
          screen: 'Receipt',
          params: { transactionId: notification.entityId, dealId: notification.entityId },
        };

      case 'payment_failed':
        return {
          screen: userRole === 'collector' ? 'Payment' : 'RecyclerPayment',
          params: { dealId: notification.entityId },
        };

      default:
        return {
          screen: 'DealDetails',
          params: { dealId: notification.entityId },
        };
    }
  }
}

export const notificationService = new NotificationService();
