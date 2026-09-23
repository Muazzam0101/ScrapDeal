import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../../theme';
import { useLanguage } from '../../../context/LanguageContext';
import { useCreateLot } from '../../../context/CreateLotContext';
import { AppHeader } from '../../../components/AppHeader';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { EmptyState } from '../../../components/EmptyState';
import { AudioSpeakerButton } from '../../../components/AudioSpeakerButton';

interface RecyclerMatchingScreenProps {
  navigation: any;
  route: any;
}

export const RecyclerMatchingScreen: React.FC<RecyclerMatchingScreenProps> = ({
  navigation,
  route,
}) => {
  const { t } = useLanguage();
  const { categoryId, weightKg } = useCreateLot();
  const [refreshing, setRefreshing] = useState(false);

  const handleContinueToDeal = () => {
    navigation.navigate('DealConfirmation', {
      categoryId: categoryId || 'pcb',
      weightKg,
      ratePerKg: 280,
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title={t('nearbyRecyclers')}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        showNotification={false}
        showRoleSwitch={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Top Location Bar with Audio Button */}
        <View style={styles.locationBar}>
          <View style={styles.locationInfo}>
            <Ionicons name="location-sharp" size={20} color={colors.primary} />
            <Text style={styles.locationText}>{t('collectorLocation')}</Text>
          </View>
          <AudioSpeakerButton label={t('listen')} size="small" />
        </View>

        {/* Dynamic Empty State (Strict No Fake Data) */}
        <EmptyState
          icon="business-outline"
          title={t('noRecyclersNearby')}
          description={t('noRecyclersDesc')}
          actionTitle="पुनः खोजें (Refresh)"
          onActionPress={onRefresh}
        />

        {/* Map View Action Button */}
        <SecondaryButton
          title={t('viewOnMap')}
          icon="map-outline"
          onPress={() => {}}
          style={styles.mapButton}
        />
      </ScrollView>

      {/* Primary Action to Advance through the Flow */}
      <View style={styles.bottomBar}>
        <PrimaryButton
          title="सौदा तय करें (Proceed to Deal) →"
          onPress={handleContinueToDeal}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    ...typography.h4,
    color: colors.text,
  },
  mapButton: {
    marginTop: spacing.md,
  },
  bottomBar: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
