import { NavigatorScreenParams } from '@react-navigation/native';
import { MaterialCategoryId } from './material';
import { UserRole } from './user';

export type RootStackParamList = {
  RoleSelection: undefined;
  Login: { defaultRole?: UserRole } | undefined;
  Signup: { defaultRole?: UserRole } | undefined;
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
  Payment: { amount?: number; lotId?: string; dealId?: string };
  Receipt: { transactionId: string; dealId?: string };
  Success: { lotId?: string; amount?: number; recyclerName?: string; transactionId?: string };
  Notifications: undefined;
  TrackMaterial: { lotId?: string; dealId?: string };
  VerifyRecord: { token?: string; reference?: string } | undefined;

  // Collector Extra Screens
  CollectorPriceBoard: undefined;
  CollectorEarnings: undefined;
  CollectorSafety: undefined;

  // Recycler Flow Screens
  RecyclerLotDetails: { lotId?: string; isSamplePreview?: boolean };
  RecyclerMakeOffer: { lotId?: string; materialName?: string; weightKg?: number };
  RecyclerOfferStatus: { offerId?: string; lotId?: string };
  RecyclerPayment: { dealId: string; lotId?: string; amount?: number };
  RecyclerTransactions: undefined;
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
