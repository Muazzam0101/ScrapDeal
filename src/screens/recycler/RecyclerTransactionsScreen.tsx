import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { AppHeader } from '../../components/AppHeader';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';

export const RecyclerTransactionsScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<'thisMonth' | 'lastMonth' | 'all'>('thisMonth');
  const [viewState, setViewState] = useState<'empty' | 'loading' | 'error'>('empty');

  const filters = [
    { key: 'thisMonth', label: t('filterThisMonth') },
    { key: 'lastMonth', label: t('filterLastMonth') },
    { key: 'all', label: t('filterAll') },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title={t('tabTransactions')}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        showRoleSwitch={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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

        {/* State Toggle for UI Review */}
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

        {/* Dynamic Empty / Loading / Error States (Strict No Fake Transactions) */}
        {viewState === 'empty' && (
          <EmptyState
            icon="receipt-outline"
            title="अभी कोई transaction नहीं है"
            description="आपके द्वारा खरीदे गए लॉट्स और भुगतान का इतिहास यहाँ दिखाई देगा।"
            actionTitle="लॉट्स देखें (Explore Lots)"
            onActionPress={() => navigation.navigate('RecyclerLots')}
          />
        )}

        {viewState === 'loading' && (
          <LoadingState message="लेन-देन इतिहास लोड हो रहा है..." />
        )}

        {viewState === 'error' && (
          <ErrorState
            message="लेन-देन लोड करने में असमर्थ।"
            onRetry={() => setViewState('empty')}
          />
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
});
