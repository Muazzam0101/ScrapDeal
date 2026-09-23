import { PickupOption } from './lot';

export type OfferStatus =
  | 'sent'
  | 'viewed'
  | 'countered'
  | 'final_offer'
  | 'accepted'
  | 'rejected'
  | 'expired';

export interface OfferTimelineEvent {
  step: 'offer_sent' | 'viewed' | 'counter_offer' | 'final_offer' | 'accepted';
  timestamp?: string;
  actorRole: 'collector' | 'recycler' | 'system';
  ratePerKg: number;
  totalAmount: number;
  note?: string;
}

export interface Offer {
  id: string;
  lotId: string;
  recyclerId: string;
  ratePerKg: number;
  totalAmount: number;
  pickupOption: PickupOption;
  comments?: string;
  status: OfferStatus;
  timeline: OfferTimelineEvent[];
  createdAt: string;
  expiresAt?: string;
}
