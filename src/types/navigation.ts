import { NavigatorScreenParams } from '@react-navigation/native';
import { MaterialCategoryId } from './material';

export type RootStackParamList = {
  RoleSelection: undefined;
  CollectorRoot: NavigatorScreenParams<CollectorTabParamList> | undefined;
  RecyclerRoot: NavigatorScreenParams<RecyclerTabParamList> | undefined;

  // Collector Creation Flow
  TakePhoto: undefined;
  MaterialCategory: undefined;
  WeightInput: { categoryId: MaterialCategoryId };
  PriceValue: { categoryId: MaterialCategoryId; weightKg: number };
  RecyclerMatching: { categoryId: MaterialCategoryId; weightKg: number };
  DealConfirmation: { categoryId: MaterialCategoryId; weightKg: number; ratePerKg?: number };
  Handover: { lotId?: string };
  Payment: { amount?: number; lotId?: string };
  Success: { lotId?: string; amount?: number; recyclerName?: string };

  // Collector Extra Screens
  CollectorPriceBoard: undefined;
  CollectorEarnings: undefined;
  CollectorSafety: undefined;

  // Recycler Flow Screens
  RecyclerLotDetails: { lotId?: string; isSamplePreview?: boolean };
  RecyclerMakeOffer: { lotId?: string; materialName?: string; weightKg?: number };
  RecyclerOfferStatus: { offerId?: string; lotId?: string };
  RecyclerRates: undefined;
  RecyclerPickup: undefined;
  RecyclerReports: undefined;
};

export type CollectorTabParamList = {
  CollectorHome: undefined;
  CollectorDeals: undefined;
  CollectorSafetyTab: undefined;
  CollectorProfile: undefined;
};

export type RecyclerTabParamList = {
  RecyclerHome: undefined;
  RecyclerLots: undefined;
  RecyclerRateCard: undefined;
  RecyclerProfile: undefined;
};
