import { SyncStatus } from './sync';

export type NotificationType =
  | 'new_offer'
  | 'offer_accepted'
  | 'deal_created'
  | 'deal_confirmed'
  | 'handover_pending'
  | 'handover_confirmed'
  | 'payment_pending'
  | 'payment_completed'
  | 'payment_failed'
  | 'safety_warning';

export type NotificationEntityType =
  | 'lot'
  | 'offer'
  | 'deal'
  | 'handover'
  | 'payment'
  | 'transaction';

export interface AppNotification {
  notificationId: string;
  id?: string;
  localId?: string;
  remoteId?: string;

  userId: string;
  type: NotificationType;

  title: string;
  body: string;

  entityType: NotificationEntityType;
  entityId: string;

  read: boolean;

  createdAt: string;
  updatedAt?: string;

  syncStatus: SyncStatus;
}

export interface DeviceToken {
  id: string;
  userId: string;
  token: string;
  platform: 'android' | 'ios' | 'web';
  deviceModel?: string;
  updatedAt: string;
}
