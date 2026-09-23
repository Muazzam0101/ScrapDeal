import { PickupOption } from './lot';
import { SyncStatus } from './sync';

export type OfferStatus =
  | 'pending'
  | 'sent'
  | 'viewed'
  | 'countered'
  | 'final_offer'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export interface OfferTimelineEvent {
  step: 'offer_sent' | 'viewed' | 'counter_offer' | 'final_offer' | 'accepted' | 'rejected';
  timestamp?: string;
  actorRole: 'collector' | 'recycler' | 'system';
  ratePerKg: number;
  totalAmount: number;
  note?: string;
}

export interface Offer {
  id: string;
  localId?: string;
  remoteId?: string;
  lotId: string;
  collectorId?: string;
  materialCategoryId?: string;
  weightKg?: number;
  recyclerId: string;
  recyclerName?: string;
  ratePerKg: number;
  totalAmount: number;
  pickupOption: PickupOption;
  comments?: string;
  status: OfferStatus;
  timeline: OfferTimelineEvent[];
  syncStatus?: SyncStatus;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
  lastSyncedAt?: string;
}
