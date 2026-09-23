import { MaterialCategoryId, MaterialCondition } from './material';

export type LotStatus =
  | 'draft'
  | 'created'
  | 'matching'
  | 'offer_received'
  | 'deal_locked'
  | 'handover_pending'
  | 'handover_completed'
  | 'paid'
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

export interface HandoverRecord {
  id: string;
  lotId: string;
  handoverTime: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
  collectorConfirmed: boolean;
  recyclerConfirmed: boolean;
  checklist: HandoverChecklistState;
}

export interface MaterialLot {
  id: string;
  lotNumber: string;
  collectorId: string;
  categoryId: MaterialCategoryId;
  condition: MaterialCondition;
  weightKg: number;
  photoUrls: string[];
  locationCity: string;
  locationArea: string;
  status: LotStatus;
  estimatedMinAmount?: number;
  estimatedMaxAmount?: number;
  agreedRatePerKg?: number;
  agreedTotalAmount?: number;
  selectedRecyclerId?: string;
  pickupOption?: PickupOption;
  createdAt: string;
  updatedAt: string;
}
