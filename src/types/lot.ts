import { MaterialCategoryId, MaterialCondition } from './material';
import { SyncStatus } from './sync';

export type LotStatus =
  | 'draft'
  | 'ready'
  | 'created'
  | 'published'
  | 'matching'
  | 'matched'
  | 'offered'
  | 'offer_received'
  | 'deal_locked'
  | 'deal_created'
  | 'accepted'
  | 'handover_pending'
  | 'handed_over'
  | 'handover_completed'
  | 'payment_pending'
  | 'paid'
  | 'completed'
  | 'cancelled';

export type PickupOption = 'collector_drop' | 'recycler_pickup';

export interface HandoverChecklistState {
  weightVerified: boolean;
  photoCaptured: boolean;
  locationConfirmed: boolean;
  timestampConfirmed: boolean;
}

export interface TraceabilityRecord {
  lotId: string;
  sourceCollectorId: string;
  assignedRecyclerId: string;
  materialCategory: MaterialCategoryId;
  verifiedWeightKg: number;
  originGeoHash?: string;
  destinationFacilityId?: string;
  chainOfCustodyTimestamp: string;
  manifestNumber?: string;
}


export interface MaterialLot {
  id: string; // Compatible with id
  localId: string;
  remoteId?: string;
  lotNumber?: string;
  collectorId: string;
  categoryId: MaterialCategoryId;
  materialCategory?: string;
  condition?: MaterialCondition;
  weightKg: number;
  approximateWeight?: number;
  photos: string[];
  photoUrls?: string[];
  locationCity?: string;
  locationArea?: string;
  status: LotStatus;
  estimatedMinAmount?: number;
  estimatedMaxAmount?: number;
  agreedRatePerKg?: number;
  agreedTotalAmount?: number;
  selectedRecyclerId?: string;
  pickupOption?: PickupOption;
  dealId?: string;
  acceptedOfferId?: string;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt?: string;
}
