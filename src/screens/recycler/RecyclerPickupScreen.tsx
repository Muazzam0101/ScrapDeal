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
import { useAuthStore } from '../../store/useAuthStore';
import { dealRepository } from '../../services/sqlite/repositories/dealRepository';
import { Deal } from '../../types';
import { AppHeader } from '../../components/AppHeader';
import { EmptyState } from '../../components/EmptyState';

export const RecyclerPickupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuthStore();
  const recyclerId = currentUser?.id || 'RECYCLER-LOCAL';

  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDeals = async () => {
    try {
      const allDeals = await dealRepository.getDealsForRecycler(recyclerId);
      setDeals(allDeals);
    } catch (e) {
      console.warn('[RecyclerPickup] Load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, [recyclerId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDeals();
  };

  const upcomingDeals = deals.filter((d) => d.status !== 'completed' && d.status !== 'cancelled');
  const completedDeals = deals.filter((d) => d.status === 'completed');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <AppHeader
        title={t('actionPickupSchedule')}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        showRoleSwitch={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Tabs: Upcoming vs Completed */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'upcoming' && styles.tabTextActive,
              ]}
            >
              {t('upcomingPickups')} ({upcomingDeals.length})
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
              {t('completedPickups')} ({completedDeals.length})
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('loadingPickupList')}</Text>
          </View>
        ) : activeTab === 'upcoming' ? (
          upcomingDeals.length === 0 ? (
            <EmptyState
              icon="car-outline"
              title={t('noPickups')}
              description={t('noPickupsDesc')}
              actionTitle={t('refresh')}
              onActionPress={loadDeals}
            />
          ) : (
            <View style={styles.dealsList}>
              {upcomingDeals.map((deal) => (
                <TouchableOpacity
                  key={deal.localId || deal.id}
                  style={styles.dealCard}
                  onPress={() => navigation.navigate('Handover', { dealId: deal.localId, lotId: deal.lotId })}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardTopRow}>
                    <View style={styles.materialIconCircle}>
                      <MaterialCommunityIcons name="chip" size={24} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dealMaterial}>{deal.materialName}</Text>
                      <Text style={styles.dealWeight}>{deal.agreedWeightKg} {t('kg')} • {t('rate')}: ₹{deal.agreedRatePerKg}/{t('kg')}</Text>
                    </View>
                    <Text style={styles.dealTotal}>₹{deal.agreedTotalAmount}</Text>
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusPillText}>
                        {deal.status === 'handover_pending' ? t('handoverPending') : t('dealAcceptedStatus')}
                      </Text>
                    </View>

                    <View style={styles.actionPrompt}>
                      <Text style={styles.actionPromptText}>{t('confirmReceipt')}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )
        ) : (
          completedDeals.length === 0 ? (
            <EmptyState
              icon="checkmark-circle-outline"
              title={t('noCompletedPickups')}
              description={t('noCompletedPickupsDesc')}
              actionTitle={t('refresh')}
              onActionPress={loadDeals}
            />
          ) : (
            <View style={styles.dealsList}>
              {completedDeals.map((deal) => (
                <View key={deal.localId || deal.id} style={styles.dealCard}>
                  <View style={styles.cardTopRow}>
                    <View style={[styles.materialIconCircle, { backgroundColor: '#E3FCEF' }]}>
                      <Ionicons name="checkmark-done" size={24} color="#00875A" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dealMaterial}>{deal.materialName}</Text>
                      <Text style={styles.dealWeight}>{deal.agreedWeightKg} {t('kg')} • {t('rate')}: ₹{deal.agreedRatePerKg}/{t('kg')}</Text>
                    </View>
                    <Text style={[styles.dealTotal, { color: '#00875A' }]}>₹{deal.agreedTotalAmount}</Text>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.completedDate}>
                      {t('completedDate')}: {new Date(deal.updatedAt).toLocaleDateString()}
                    </Text>
                    <View style={[styles.statusPill, { backgroundColor: '#E3FCEF' }]}>
                      <Text style={[styles.statusPillText, { color: '#00875A' }]}>{t('completedStatus')}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )
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
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textLight,
  },
  loadingBox: {
    paddingVertical: spacing.huge,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  dealsList: {
    gap: spacing.md,
  },
  dealCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  materialIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3FCEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  dealMaterial: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  dealWeight: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dealTotal: {
    ...typography.h3,
    color: colors.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  statusPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  actionPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionPromptText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  completedDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
