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

interface RecyclerLotsScreenProps {
  navigation: any;
}

export const RecyclerLotsScreen: React.FC<RecyclerLotsScreenProps> = ({ navigation }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'new' | 'offered' | 'accepted'>('new');
  const [viewState, setViewState] = useState<'empty' | 'loading' | 'error'>('empty');

  const tabs = [
    { key: 'new', label: t('tabNewLots') },
    { key: 'offered', label: t('tabOffersGiven') },
    { key: 'accepted', label: t('tabAccepted') },
  ];

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

        {/* Dynamic Empty / Loading / Error States (Strict No Fake Lots) */}
        {viewState === 'empty' && (
          <EmptyState
            icon="cube-outline"
            title={t('noNewLots')}
            description={t('noNewLotsDesc')}
            actionTitle="लॉट विवरण स्क्रीन देखें (Lot Details)"
            onActionPress={() => navigation.navigate('RecyclerLotDetails', { isSamplePreview: true })}
          />
        )}

        {viewState === 'loading' && (
          <LoadingState message="आसपास के नए लॉट खोजे जा रहे हैं..." />
        )}

        {viewState === 'error' && (
          <ErrorState
            message="लॉट लोड करने में विफल।"
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
