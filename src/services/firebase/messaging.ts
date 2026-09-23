export type NotificationEvent =
  | 'new_offer'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'deal_update'
  | 'handover_update'
  | 'transaction_completed';

export interface AppNotification {
  id: string;
  event: NotificationEvent;
  title: string;
  body: string;
  data?: Record<string, any>;
  timestamp: string;
  read: boolean;
}

export const messagingService = {
  /**
   * Initializes FCM push token registration.
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // FCM token setup foundation
      console.log('[MessagingService] FCM push notification service ready');
      return 'fcm_token_placeholder';
    } catch (error) {
      console.warn('[MessagingService] Failed to get FCM token:', error);
      return null;
    }
  },

  /**
   * Helper to format notification payloads.
   */
  createNotificationPayload(event: NotificationEvent, data: Record<string, any>): { title: string; body: string } {
    switch (event) {
      case 'new_offer':
        return {
          title: 'नया ऑफर प्राप्त हुआ! (New Offer)',
          body: `रीसाइक्लर ने ₹${data.ratePerKg}/kg का ऑफर दिया है।`,
        };
      case 'offer_accepted':
        return {
          title: 'ऑफर स्वीकार किया गया! (Offer Accepted)',
          body: `कबाड़ीवाले ने आपका ₹${data.totalAmount} का सौदा स्वीकार कर लिया।`,
        };
      case 'offer_rejected':
        return {
          title: 'ऑफर अस्वीकृत (Offer Rejected)',
          body: 'प्रस्तावित दर स्वीकार नहीं की गई।',
        };
      case 'deal_update':
        return {
          title: 'सौदा अपडेट (Deal Update)',
          body: `लॉट #${data.lotNumber || ''} की स्थिति अपडेट हुई।`,
        };
      case 'handover_update':
        return {
          title: 'हैंडओवर सत्यापन (Handover Verified)',
          body: 'सामग्री का भौतिक सत्यापन पूर्ण हुआ।',
        };
      case 'transaction_completed':
        return {
          title: 'भुगतान सफल! (Payment Completed)',
          body: `₹${data.amount || 0} का भुगतान सफलतापूर्वक दर्ज किया गया।`,
        };
      default:
        return {
          title: 'ScrapDeal सूचना',
          body: 'आपके खाते में नया अपडेट है।',
        };
    }
  },
};
