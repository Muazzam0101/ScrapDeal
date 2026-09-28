import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../../theme';
import { useLanguage } from '../../../context/LanguageContext';
import { useCreateLot } from '../../../context/CreateLotContext';
import { matchingService, MatchingResult } from '../../../services/recycler/matchingService';
import { lotRepository } from '../../../services/sqlite/repositories/lotRepository';
import { useLocationStore } from '../../../store/useLocationStore';
import { AppHeader } from '../../../components/AppHeader';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { EmptyState } from '../../../components/EmptyState';
import { VerificationBadge } from '../../../components/VerificationBadge';

interface RecyclerMatchingScreenProps {
  navigation: any;
  route: any;
}

export const RecyclerMatchingScreen: React.FC<RecyclerMatchingScreenProps> = ({
  navigation,
  route,
}) => {
  const { t } = useLanguage();
  const { categoryId, weightKg, createdLotId } = useCreateLot();
  const { coords, hasPermission, requestPermission, permissionDenied, selectedCity } = useLocationStore();

  const [matches, setMatches] = useState<MatchingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requestingLoc, setRequestingLoc] = useState(false);

  const lotId = route.params?.lotId || createdLotId;

  const loadMatches = async (userCoords = coords) => {
    setLoading(true);
    try {
      let lot = route.params?.lot;
      if (!lot && lotId) {
        lot = await lotRepository.getLotById(lotId);
      }
      if (!lot) {
        lot = {
          id: 'TEMP',
          localId: 'TEMP',
          collectorId: 'COLLECTOR',
          categoryId: categoryId || 'pcb',
          weightKg: weightKg || 1,
          photos: [],
          status: 'published',
          syncStatus: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      const results = await matchingService.findSuitableRecyclers(lot, userCoords);
      setMatches(results);
    } catch (e) {
      console.warn('[RecyclerMatching] Error finding matches:', e);
      setMatches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [lotId, coords]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMatches();
  };

  const handleEnableLocation = async () => {
    setRequestingLoc(true);
    const granted = await requestPermission();
    setRequestingLoc(false);
    if (granted) {
      loadMatches();
    }
  };

  const handleGoToDeals = () => {
    navigation.navigate('CollectorRoot', { screen: 'CollectorDeals' });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
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
        <Text style={styles.screenHeading}>{t('nearbyRecyclers')}</Text>
        <Text style={styles.screenSub}>
          {t('ruleBasedMatchingSubtitle')}
        </Text>

        {/* Location Banner (Real GPS or Manual Non-blocking Fallback) */}
        <View style={styles.locationBanner}>
          <View style={styles.locationBannerLeft}>
            <Ionicons
              name={hasPermission ? 'location' : 'location-outline'}
              size={22}
              color={hasPermission ? colors.primary : '#D97706'}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.locationBannerTitle}>
                {hasPermission
                  ? t('accurateDistanceEnabled')
                  : t('coarseAreaMode')}
              </Text>
              <Text style={styles.locationBannerSub}>
                {hasPermission
                  ? t('realDistanceShowingDesc')
                  : t('enableLocationPrompt').replace('{city}', selectedCity || 'Pune')}
              </Text>
            </View>
          </View>

          {!hasPermission && (
            <TouchableOpacity
              style={styles.enableLocBtn}
              onPress={handleEnableLocation}
              disabled={requestingLoc}
            >
              {requestingLoc ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.enableLocBtnText}>{t('enableLocationBtn')}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('searchingSuitableRecyclers')}</Text>
          </View>
        ) : matches.length === 0 ? (
          <EmptyState
            icon="business-outline"
            title={t('noMatchingRecyclers')}
            description={t('noMatchingRecyclersDesc')}
            actionTitle={t('refresh')}
            onActionPress={() => loadMatches()}
          />
        ) : (
          <View style={styles.matchesList}>
            <Text style={styles.matchCount}>
              {t('foundSuitableRecyclers').replace('{count}', String(matches.length))}
            </Text>
            {matches.map(({ recycler, matchReasons, distanceText }, idx) => (
              <View key={recycler.id || idx} style={styles.recyclerCard}>
                <View style={styles.recyclerHeader}>
                  <View style={styles.recyclerAvatar}>
                    <MaterialCommunityIcons name="factory" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.recyclerInfo}>
                    <Text style={styles.firmName}>
                      {recycler.firmName || recycler.businessName || t('registeredRecycler')}
                    </Text>
                    <View style={styles.locDistanceRow}>
                      <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                      <Text style={styles.locationText}>
                        {recycler.city || recycler.serviceArea || 'Pune'}
                      </Text>
                      {distanceText && (
                        <View style={styles.distanceBadge}>
                          <Text style={styles.distanceBadgeText}>{distanceText}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Separate Verification Badges */}
                <View style={styles.verificationRow}>
                  <VerificationBadge
                    type="authorization"
                    status={recycler.authorizationVerificationStatus || 'not_started'}
                    size="small"
                  />
                  <VerificationBadge
                    type="identity"
                    status={recycler.identityVerificationStatus || 'not_started'}
                    size="small"
                  />
                </View>

                {/* Transparent Match Badges */}
                <View style={styles.badgesRow}>
                  {matchReasons.map((reason, rIdx) => (
                    <View key={rIdx} style={styles.reasonBadge}>
                      <Ionicons name="checkmark" size={12} color="#00875A" />
                      <Text style={styles.reasonText}>{reason}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Primary Action to view deals */}
      <View style={styles.bottomBar}>
        <PrimaryButton
          title={t('viewDealsCTA')}
          onPress={handleGoToDeals}
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
  screenHeading: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  screenSub: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  locationBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  locationBannerTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text,
  },
  locationBannerSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  enableLocBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryPale,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  enableLocBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  loadingContainer: {
    paddingVertical: spacing.huge,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  matchesList: {
    marginTop: spacing.xs,
  },
  matchCount: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  recyclerCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  recyclerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  recyclerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryPale,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  recyclerInfo: {
    flex: 1,
  },
  firmName: {
    ...typography.bodyBold,
    color: colors.text,
  },
  locDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  distanceBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.xs,
  },
  distanceBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  verificationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  badgesRow: {
    flexDirection: 'column',
    gap: 4,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  reasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reasonText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  bottomBar: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
