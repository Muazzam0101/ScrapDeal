import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../../theme';
import { useLanguage } from '../../../context/LanguageContext';
import { useCreateLot } from '../../../context/CreateLotContext';
import { AppHeader } from '../../../components/AppHeader';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { EmptyState } from '../../../components/EmptyState';
import { LoadingState } from '../../../components/LoadingState';
import { ErrorState } from '../../../components/ErrorState';
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
  const [viewState, setViewState] = useState<'empty' | 'loading' | 'error'>('empty');

  const handleContinueToDeal = () => {
    navigation.navigate('DealConfirmation', {
      categoryId: categoryId || 'pcb',
      weightKg,
      ratePerKg: 280,
    });
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
      >
        {/* Top Location Bar with Audio Button */}
        <View style={styles.locationBar}>
          <View style={styles.locationInfo}>
            <Ionicons name="location-sharp" size={20} color={colors.primary} />
            <Text style={styles.locationText}>{t('collectorLocation')}</Text>
          </View>
          <AudioSpeakerButton label={t('listen')} size="small" />
        </View>

        {/* State Toggle for UI Inspection */}
        <View style={styles.stateToggleContainer}>
          <Text style={styles.stateToggleLabel}>UI State Preview:</Text>
          <View style={styles.stateToggleRow}>
            {(['empty', 'loading', 'error'] as const).map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.toggleBtn, viewState === st && styles.toggleBtnActive]}
                onPress={() => setViewState(st)}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    viewState === st && styles.toggleBtnTextActive,
                  ]}
                >
                  {st.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Main Empty / Loading / Error States (Strict No Fake Data) */}
        {viewState === 'empty' && (
          <EmptyState
            icon="business-outline"
            title={t('noRecyclersNearby')}
            description={t('noRecyclersDesc')}
            actionTitle="पुनः खोजें (Refresh)"
            onActionPress={() => setViewState('loading')}
          />
        )}

        {viewState === 'loading' && (
          <LoadingState
            message={t('searchingRecyclers')}
          />
        )}

        {viewState === 'error' && (
          <ErrorState
            message="GPS या नेटवर्क समस्या के कारण रीसाइक्लर नहीं मिल सके।"
            onRetry={() => setViewState('empty')}
          />
        )}

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
  stateToggleContainer: {
    backgroundColor: colors.cardAlt,
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  stateToggleLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 4,
  },
  stateToggleRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  toggleBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
  },
  toggleBtnText: {
    ...typography.badge,
    color: colors.textSecondary,
    fontSize: 11,
  },
  toggleBtnTextActive: {
    color: colors.textLight,
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
