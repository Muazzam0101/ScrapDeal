import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { useLotStore } from '../../store/useLotStore';
import { AppHeader } from '../../components/AppHeader';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { LotCard } from '../../components/LotCard';

interface RecyclerLotsScreenProps {
  navigation: any;
}

export const RecyclerLotsScreen: React.FC<RecyclerLotsScreenProps> = ({ navigation }) => {
  const { t } = useLanguage();
  const { availableLots, fetchAvailableLots, isLoading, error } = useLotStore();
  const [activeTab, setActiveTab] = useState<'new' | 'offered' | 'accepted'>('new');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAvailableLots();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAvailableLots();
    setRefreshing(false);
  };

  const tabs = [
    { key: 'new', label: t('tabNewLots') },
    { key: 'offered', label: t('tabOffersGiven') },
    { key: 'accepted', label: t('tabAccepted') },
  ];

  const filteredLots = availableLots.filter((lot) => {
    if (activeTab === 'new') {
      return lot.status === 'created' || lot.status === 'ready' || lot.status === 'matching';
    } else if (activeTab === 'offered') {
      return lot.status === 'offered';
    } else {
      return (
        lot.status === 'deal_locked' ||
        lot.status === 'accepted' ||
        lot.status === 'handover_pending' ||
        lot.status === 'paid' ||
        lot.status === 'completed'
      );
    }
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title={t('tabLots')}
        showBack={false}
        showRoleSwitch={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Tabs */}
        <View style={styles.tabsRow}>
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, isSelected && styles.tabActive]}
                onPress={() => setActiveTab(tab.key as any)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabText,
                    isSelected && styles.tabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Real Dynamic States */}
        {isLoading && filteredLots.length === 0 && (
          <LoadingState message="आसपास के नए लॉट खोजे जा रहे हैं..." />
        )}

        {error && filteredLots.length === 0 && (
          <ErrorState message="लॉट लोड करने में विफल।" onRetry={fetchAvailableLots} />
        )}

        {!isLoading && filteredLots.length === 0 && (
          <EmptyState
            icon="cube-outline"
            title={t('noNewLots')}
            description={t('noNewLotsDesc')}
            actionTitle="रिफ्रेश करें (Refresh)"
            onActionPress={fetchAvailableLots}
          />
        )}

        {filteredLots.length > 0 && (
          <View style={styles.lotsList}>
            {filteredLots.map((lot) => (
              <LotCard
                key={lot.localId || lot.id}
                lot={lot}
                onPress={() => navigation.navigate('RecyclerLotDetails', { lot })}
              />
            ))}
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
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: 4,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.lg,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.textLight,
  },
  lotsList: {
    gap: spacing.md,
  },
});
