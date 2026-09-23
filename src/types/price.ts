import { MaterialCategoryId } from './material';
import { SyncStatus } from './sync';

export type PriceSourceType = 'recycler_rate' | 'completed_transaction' | 'market_reference';

export interface MaterialPrice {
  id: string; // localId
  localId: string;
  remoteId?: string;
  materialCategory: MaterialCategoryId;
  materialName?: string;
  recyclerId?: string;
  recyclerName?: string;
  ratePerKg: number;
  minRatePerKg?: number;
  maxRatePerKg?: number;
  effectiveFrom: string;
  effectiveUntil?: string;
  locationCity?: string;
  locationArea?: string;
  sourceType: PriceSourceType;
  createdAt: string;
  updatedAt: string;
  syncStatus?: SyncStatus;
  lastSyncedAt?: string;
}

export interface PriceHistoryRecord {
  id: string;
  materialCategory: MaterialCategoryId;
  date: string;
  ratePerKg: number;
  volumeKg?: number;
  sourceType: PriceSourceType;
}

export interface PriceBoardItem {
  category: MaterialCategoryId;
  categoryLabel: string;
  iconName: string;
  color: string;
  latestRatePerKg?: number;
  minObservedRate?: number;
  maxObservedRate?: number;
  activeRecyclersCount: number;
  lastUpdated?: string;
  isStale?: boolean;
  sourceType?: PriceSourceType;
}
