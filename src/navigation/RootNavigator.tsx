import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

import { RoleSelectionScreen } from '../screens/onboarding/RoleSelectionScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { CollectorNavigator } from './CollectorNavigator';
import { RecyclerNavigator } from './RecyclerNavigator';

// Collector Flow Screens
import { TakePhotoScreen } from '../screens/collector/lot-creation/TakePhotoScreen';
import { MaterialCategoryScreen } from '../screens/collector/lot-creation/MaterialCategoryScreen';
import { WeightScreen } from '../screens/collector/lot-creation/WeightScreen';
import { PriceValueScreen } from '../screens/collector/lot-creation/PriceValueScreen';
import { RecyclerMatchingScreen } from '../screens/collector/lot-creation/RecyclerMatchingScreen';
import { DealConfirmationScreen } from '../screens/collector/lot-creation/DealConfirmationScreen';
import { HandoverScreen } from '../screens/collector/lot-creation/HandoverScreen';
import { PaymentScreen } from '../screens/collector/lot-creation/PaymentScreen';
import { SuccessScreen } from '../screens/collector/lot-creation/SuccessScreen';

import { CollectorPriceBoardScreen } from '../screens/collector/CollectorPriceBoardScreen';
import { CollectorEarningsScreen } from '../screens/collector/CollectorEarningsScreen';
import { CollectorSafetyScreen } from '../screens/collector/CollectorSafetyScreen';

// Recycler Flow Screens
import { RecyclerLotDetailsScreen } from '../screens/recycler/RecyclerLotDetailsScreen';
import { RecyclerMakeOfferScreen } from '../screens/recycler/RecyclerMakeOfferScreen';
import { RecyclerOfferStatusScreen } from '../screens/recycler/RecyclerOfferStatusScreen';
import { RecyclerPaymentScreen } from '../screens/recycler/RecyclerPaymentScreen';
import { RecyclerTransactionsScreen } from '../screens/recycler/RecyclerTransactionsScreen';
import { RecyclerRatesScreen } from '../screens/recycler/RecyclerRatesScreen';
import { RecyclerPickupScreen } from '../screens/recycler/RecyclerPickupScreen';
import { RecyclerReportsScreen } from '../screens/recycler/RecyclerReportsScreen';

// Phase 6 Common Screens
import { ReceiptScreen } from '../screens/common/ReceiptScreen';
import { NotificationsScreen } from '../screens/common/NotificationsScreen';

// Phase 7 Digital Traceability Screens
import { TrackMaterialScreen } from '../screens/common/TrackMaterialScreen';
import { VerifyRecordScreen } from '../screens/common/VerifyRecordScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="RoleSelection"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Role Selection Onboarding & Auth */}
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />

      {/* Main Role Hubs */}
      <Stack.Screen name="CollectorRoot" component={CollectorNavigator} />
      <Stack.Screen name="RecyclerRoot" component={RecyclerNavigator} />

      {/* Collector Create Lot Flow (9 Steps) */}
      <Stack.Screen name="TakePhoto" component={TakePhotoScreen} />
      <Stack.Screen name="MaterialCategory" component={MaterialCategoryScreen} />
      <Stack.Screen name="WeightInput" component={WeightScreen} />
      <Stack.Screen name="PriceValue" component={PriceValueScreen} />
      <Stack.Screen name="RecyclerMatching" component={RecyclerMatchingScreen} />
      <Stack.Screen name="DealConfirmation" component={DealConfirmationScreen} />
      <Stack.Screen name="Handover" component={HandoverScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="Receipt" component={ReceiptScreen} />
      <Stack.Screen name="Success" component={SuccessScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />

      {/* Collector Extra Screens */}
      <Stack.Screen name="CollectorPriceBoard" component={CollectorPriceBoardScreen} />
      <Stack.Screen name="CollectorEarnings" component={CollectorEarningsScreen} />
      <Stack.Screen name="CollectorSafety" component={CollectorSafetyScreen} />

      {/* Recycler Workflows */}
      <Stack.Screen name="RecyclerLotDetails" component={RecyclerLotDetailsScreen} />
      <Stack.Screen name="RecyclerMakeOffer" component={RecyclerMakeOfferScreen} />
      <Stack.Screen name="RecyclerOfferStatus" component={RecyclerOfferStatusScreen} />
      <Stack.Screen name="RecyclerPayment" component={RecyclerPaymentScreen} />
      <Stack.Screen name="RecyclerTransactions" component={RecyclerTransactionsScreen} />
      <Stack.Screen name="RecyclerRates" component={RecyclerRatesScreen} />
      <Stack.Screen name="RecyclerPickup" component={RecyclerPickupScreen} />
      <Stack.Screen name="RecyclerReports" component={RecyclerReportsScreen} />

      {/* Phase 7 Digital Traceability */}
      <Stack.Screen name="TrackMaterial" component={TrackMaterialScreen} />
      <Stack.Screen name="VerifyRecord" component={VerifyRecordScreen} />
    </Stack.Navigator>
  );
};

