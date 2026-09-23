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
import { useAuthStore } from '../../store/useAuthStore';
import { useLotStore } from '../../store/useLotStore';
import { AppHeader } from '../../components/AppHeader';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { LotCard } from '../../components/LotCard';

interface CollectorDealsScreenProps {
  navigation: any;
}

export const CollectorDealsScreen: React.FC<CollectorDealsScreenProps> = ({
  navigation,
}) => {
  const { t } = useLanguage();
  const { currentUser } = useAuthStore();
  const { collectorLots, fetchCollectorLots, isLoading, error } = useLotStore();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [refreshing, setRefreshing] = useState(false);

  const collectorId = currentUser?.id || 'COLLECTOR-LOCAL';

  useEffect(() => {
    fetchCollectorLots(collectorId);
  }, [collectorId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCollectorLots(collectorId);
    setRefreshing(false);
  };

  const filteredLots = collectorLots.filter((lot) => {
    if (activeTab === 'active') {
      return lot.status !== 'completed' && lot.status !== 'paid' && lot.status !== 'cancelled';
    } else {
      return lot.status === 'completed' || lot.status === 'paid';
    }
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title={t('tabDeals')}
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
        {/* Tabs: Active Deals vs Completed */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' && styles.tabActive]}
            onPress={() => setActiveTab('active')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'active' && styles.tabTextActive,
              ]}
            >
              सक्रिय सौदे ({collectorLots.filter((l) => l.status !== 'completed' && l.status !== 'paid').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
            onPress={() => setActiveTab('completed')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'completed' && styles.tabTextActive,
              ]}
            >
              पूर्ण सौदे ({collectorLots.filter((l) => l.status === 'completed' || l.status === 'paid').length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Real Dynamic States */}
        {isLoading && filteredLots.length === 0 && (
          <LoadingState message="सौदों की स्थिति जांची जा रही है..." />
        )}

        {error && filteredLots.length === 0 && (
          <ErrorState
            message="डेटा लोड करने में विफल।"
            onRetry={() => fetchCollectorLots(collectorId)}
          />
        )}

        {!isLoading && filteredLots.length === 0 && (
          <EmptyState
            icon="hand-left-outline"
            title={activeTab === 'active' ? "अभी कोई सक्रिय सौदा नहीं है" : "कोई पूर्ण सौदा नहीं है"}
            description={activeTab === 'active' ? "जब आप रीसाइक्लर को सामान का ऑफर देंगे, तो वह यहाँ दिखाई देगा।" : "पूरे हो चुके लेन-देन यहाँ संग्रहीत होंगे।"}
            actionTitle={t('sellGoodsCTA')}
            onActionPress={() => navigation.navigate('TakePhoto')}
          />
        )}

        {filteredLots.length > 0 && (
          <View style={styles.lotsContainer}>
            {filteredLots.map((lot) => (
              <LotCard
                key={lot.localId || lot.id}
                lot={lot}
                onPress={() => {
                  if (lot.status === 'deal_locked') {
                    navigation.navigate('Handover', { lotId: lot.localId || lot.id });
                  } else {
                    navigation.navigate('DealConfirmation', { lotId: lot.localId || lot.id });
                  }
                }}
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
    ...typography.buttonSmall,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textLight,
    fontWeight: '700',
  },
  lotsContainer: {
    gap: spacing.md,
  },
});
