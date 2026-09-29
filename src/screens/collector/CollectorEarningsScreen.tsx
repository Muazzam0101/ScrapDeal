import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuthStore } from '../../store/useAuthStore';
import { transactionRepository } from '../../services/sqlite/repositories/transactionRepository';
import { AppHeader } from '../../components/AppHeader';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { TransactionCard } from '../../components/TransactionCard';
import { Transaction } from '../../types';

interface CollectorEarningsScreenProps {
  navigation: any;
}

export const CollectorEarningsScreen: React.FC<CollectorEarningsScreenProps> = ({
  navigation,
}) => {
  const { t } = useLanguage();
  const { currentUser } = useAuthStore();
  const [activeFilter, setActiveFilter] = useState<'thisMonth' | 'lastMonth' | 'all'>('thisMonth');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [earningsSummary, setEarningsSummary] = useState({
    totalEarnings: 0,
    totalWeight: 0,
    transactionCount: 0,
  });

  const collectorId = currentUser?.id || 'COLLECTOR-LOCAL';

  const loadData = async () => {
    try {
      setError(null);
      const [summary, txList] = await Promise.all([
        transactionRepository.getCollectorEarningsSummary(collectorId),
        transactionRepository.getTransactionsForUser(collectorId, 'collector'),
      ]);
      setEarningsSummary(summary);
      setTransactions(txList);
    } catch (e: any) {
      console.warn('[CollectorEarnings] Error loading earnings:', e);
      setError(t('failedToLoadData'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [collectorId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filters = [
    { key: 'thisMonth', label: t('filterThisMonth') },
    { key: 'lastMonth', label: t('filterLastMonth') },
    { key: 'all', label: t('filterAll') },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <AppHeader
        title={t('myEarnings')}
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
        {/* Total Earnings Summary Card */}
        <View style={[styles.earningsBanner, shadows.md]}>
          <View style={styles.bannerIconCircle}>
            <Ionicons name="wallet" size={32} color={colors.textLight} />
          </View>
          <Text style={styles.earningsLabel}>{t('totalEarningsLabel')}</Text>
          <Text style={styles.earningsAmount}>
            ₹ {earningsSummary.totalEarnings.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.earningsSub}>
            {earningsSummary.transactionCount} {t('dealsCountLabel')} • {earningsSummary.totalWeight} {t('kg')} {t('recycledLabel')}
          </Text>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filtersRow}>
          {filters.map((f) => {
            const isSelected = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setActiveFilter(f.key as any)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextSelected,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Real Dynamic States */}
        {isLoading && transactions.length === 0 && (
          <LoadingState message={t('loadingTransactionHistory')} />
        )}

        {error && transactions.length === 0 && (
          <ErrorState message={error} onRetry={loadData} />
        )}

        {!isLoading && transactions.length === 0 && (
          <EmptyState
            icon="receipt-outline"
            title={t('noTransactionsYet')}
            description={t('noTransactionsDesc')}
            actionTitle={t('sellScrapCTA')}
            onActionPress={() => navigation.navigate('TakePhoto')}
          />
        )}

        {transactions.length > 0 && (
          <View style={styles.txList}>
            {transactions.map((tx) => (
              <TransactionCard
                key={tx.localId || tx.id}
                transaction={tx}
                onPress={() => navigation.navigate('Receipt', { transactionId: tx.localId || tx.id })}
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
  earningsBanner: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  bannerIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  earningsLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
  },
  earningsAmount: {
    ...typography.displayLarge,
    color: colors.textLight,
    marginTop: 2,
  },
  earningsSub: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  filterChipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextSelected: {
    color: colors.textLight,
    fontWeight: '700',
  },
  txList: {
    gap: spacing.md,
  },
});
