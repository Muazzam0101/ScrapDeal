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
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuthStore } from '../../store/useAuthStore';
import { transactionRepository } from '../../services/sqlite/repositories/transactionRepository';
import { AppHeader } from '../../components/AppHeader';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { TransactionCard } from '../../components/TransactionCard';
import { Transaction } from '../../types';

export const RecyclerTransactionsScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { t } = useLanguage();
  const { currentUser } = useAuthStore();
  const [activeFilter, setActiveFilter] = useState<'thisMonth' | 'lastMonth' | 'all'>('thisMonth');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const recyclerId = currentUser?.id || 'RECYCLER-GREEN-EARTH';

  const loadData = async () => {
    try {
      setError(null);
      const list = await transactionRepository.getTransactionsForUser(recyclerId, 'recycler');
      setTransactions(list);
    } catch (e: any) {
      console.warn('[RecyclerTransactions] Error loading transactions:', e);
      setError(t('failedToLoadTransactions'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [recyclerId]);

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
        title={t('tabTransactions')}
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
        {/* Filters Row */}
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
            description={t('transactionsEmptyDesc')}
            actionTitle={t('exploreLots')}
            onActionPress={() => navigation.navigate('RecyclerLots')}
          />
        )}

        {transactions.length > 0 && (
          <View style={styles.txList}>
            {transactions.map((tx) => (
              <TransactionCard key={tx.localId || tx.id} transaction={tx} />
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
