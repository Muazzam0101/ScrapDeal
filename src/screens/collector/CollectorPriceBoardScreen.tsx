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
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { usePriceStore } from '../../store/usePriceStore';
import { useLocationStore } from '../../store/useLocationStore';
import { AppHeader } from '../../components/AppHeader';
import { EmptyState } from '../../components/EmptyState';
import { AudioSpeakerButton } from '../../components/AudioSpeakerButton';

interface CollectorPriceBoardScreenProps {
  navigation: any;
}

export const CollectorPriceBoardScreen: React.FC<CollectorPriceBoardScreenProps> = ({
  navigation,
}) => {
  const { t } = useLanguage();
  const { priceBoardItems, loadPriceBoard, isLoading } = usePriceStore();
  const { selectedCity, refreshLocation } = useLocationStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPriceBoard();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPriceBoard();
    setRefreshing(false);
  };

  const activeItemsWithPrice = priceBoardItems.filter((i) => i.latestRatePerKg !== undefined);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <AppHeader
        title={t('todaysRate')}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        showRoleSwitch={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
      >
        {/* Location Selector Bar + Audio Button */}
        <View style={styles.locationBar}>
          <TouchableOpacity
            style={styles.locationSelector}
            activeOpacity={0.7}
            onPress={refreshLocation}
          >
            <Ionicons name="location-sharp" size={20} color={colors.primary} />
            <Text style={styles.locationText}>{selectedCity}</Text>
          </TouchableOpacity>

          <AudioSpeakerButton label={t('listen')} size="small" />
        </View>

        {/* Dynamic List of Real Observed Prices or Clean Empty State */}
        {activeItemsWithPrice.length === 0 ? (
          <EmptyState
            icon="trending-up-outline"
            title={t('noRatesAvailable')}
            description={t('noRatesAvailableDesc')}
            actionTitle={t('refresh')}
            onActionPress={handleRefresh}
          />
        ) : (
          <View style={styles.pricesContainer}>
            {activeItemsWithPrice.map((item) => {
              const formattedDate = item.lastUpdated
                ? new Date(item.lastUpdated).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : null;

              return (
                <View key={item.category} style={styles.priceCard}>
                  <View style={styles.priceCardTop}>
                    <View style={[styles.iconCircle, { backgroundColor: item.color + '20' }]}>
                      <MaterialCommunityIcons name={item.iconName as any} size={26} color={item.color} />
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryTitle}>{item.categoryLabel}</Text>
                      <Text style={styles.recyclerCountText}>
                        {item.activeRecyclersCount > 0
                          ? t('activeRecyclersCount').replace('{count}', String(item.activeRecyclersCount))
                          : t('marketReference')}
                      </Text>
                    </View>
                    <View style={styles.rateContainer}>
                      <Text style={styles.rateValue}>₹{item.latestRatePerKg}</Text>
                      <Text style={styles.rateUnit}> {t('perKg')}</Text>
                    </View>
                  </View>

                  {/* Range and Freshness Row */}
                  <View style={styles.priceCardBottom}>
                    {item.minObservedRate && item.maxObservedRate && item.minObservedRate !== item.maxObservedRate ? (
                      <Text style={styles.rangeText}>
                        {t('rateRange').replace('{min}', String(item.minObservedRate)).replace('{max}', String(item.maxObservedRate))}
                      </Text>
                    ) : (
                      <Text style={styles.rangeText}>{t('observedRate')}</Text>
                    )}

                    {item.isStale ? (
                      <View style={styles.staleBadge}>
                        <Ionicons name="time-outline" size={12} color="#D97706" />
                        <Text style={styles.staleBadgeText}>
                          {t('cachedPrice').replace('{date}', formattedDate || 'Old')}
                        </Text>
                      </View>
                    ) : formattedDate ? (
                      <Text style={styles.freshText}>
                        {t('lastUpdated')}: {formattedDate}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
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
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  locationText: {
    ...typography.bodyBold,
    color: colors.text,
  },
  pricesContainer: {
    gap: spacing.sm,
  },
  priceCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  priceCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  recyclerCountText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rateContainer: {
    alignItems: 'flex-end',
  },
  rateValue: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700',
  },
  rateUnit: {
    fontSize: 11,
    color: colors.textMuted,
  },
  priceCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  rangeText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  freshText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  staleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  staleBadgeText: {
    fontSize: 10,
    color: '#B45309',
    fontWeight: '600',
  },
});
