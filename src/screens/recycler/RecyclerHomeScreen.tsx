import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { AppHeader } from '../../components/AppHeader';
import { VerificationBadge } from '../../components/VerificationBadge';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';

interface RecyclerHomeScreenProps {
  navigation: any;
}

export const RecyclerHomeScreen: React.FC<RecyclerHomeScreenProps> = ({ navigation }) => {
  const { t } = useLanguage();
  const [viewState, setViewState] = useState<'empty' | 'loading'>('empty');

  const quickActions = [
    {
      id: 'lots',
      title: t('actionNewLots'),
      icon: 'cube-outline',
      color: colors.softBlue,
      bg: colors.softBlueBg,
      route: 'RecyclerLots',
    },
    {
      id: 'rates',
      title: t('actionMyRates'),
      icon: 'pricetag-outline',
      color: colors.softYellow,
      bg: colors.softYellowBg,
      route: 'RecyclerRates',
    },
    {
      id: 'pickup',
      title: t('actionPickupSchedule'),
      icon: 'car-outline',
      color: colors.primaryDark,
      bg: colors.primaryPale,
      route: 'RecyclerPickup',
    },
    {
      id: 'transactions',
      title: t('actionTransactions'),
      icon: 'receipt-outline',
      color: colors.softPurple,
      bg: colors.softPurpleBg,
      route: 'RecyclerTransactions',
    },
    {
      id: 'reports',
      title: t('actionReports'),
      icon: 'bar-chart-outline',
      color: colors.softPeach,
      bg: colors.softPeachBg,
      route: 'RecyclerReports',
    },
    {
      id: 'profile',
      title: t('actionProfile'),
      icon: 'person-outline',
      color: colors.textSecondary,
      bg: colors.cardAlt,
      route: 'RecyclerProfile',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        showBack={false}
        showRoleSwitch={true}
        location={t('collectorLocation')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Recycler Facility Header Banner */}
        <View style={styles.firmCard}>
          <View style={styles.firmTopRow}>
            <View style={styles.firmLogo}>
              <MaterialCommunityIcons name="recycle" size={28} color={colors.primary} />
            </View>
            <View style={styles.firmInfo}>
              <Text style={styles.firmName}>Green Earth Recycling</Text>
              <VerificationBadge label={t('authorizedRecycler')} size="small" />
              <Text style={styles.firmLocation}>
                <Ionicons name="location-outline" size={13} color={colors.textSecondary} /> {t('collectorLocation')}
              </Text>
            </View>
          </View>
        </View>

        {/* Dashboard Metrics - Aaj ka Sankshipt Vivaran (Clean Zero / No-Data State) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('recyclerSummaryTitle')}</Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>0</Text>
            <Text style={styles.metricLabel}>{t('statNewLots')}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>0</Text>
            <Text style={styles.metricLabel}>{t('statActiveDeals')}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>₹ 0</Text>
            <Text style={styles.metricLabel}>{t('statTodayPurchases')}</Text>
          </View>
        </View>

        {/* Quick Actions Grid (6 Clean Cards) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
        </View>

        <View style={styles.quickGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[styles.quickCard, { backgroundColor: action.bg }]}
              onPress={() => navigation.navigate(action.route)}
              activeOpacity={0.8}
            >
              <View style={[styles.quickIconCircle, { backgroundColor: colors.card }]}>
                <Ionicons name={action.icon as any} size={24} color={action.color} />
              </View>
              <Text style={styles.quickCardTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* New Lots Section with Empty State (Strict No Fake Lots) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('tabLots')}</Text>
        </View>

        <EmptyState
          icon="cube-outline"
          title={t('noNewLots')}
          description={t('noNewLotsDesc')}
          actionTitle="लॉट विवरण देखें (Preview Lot Details)"
          onActionPress={() => navigation.navigate('RecyclerLotDetails', { isSamplePreview: true })}
        />
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
  firmCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
  },
  firmTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  firmLogo: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  firmInfo: {
    flex: 1,
    gap: 3,
  },
  firmName: {
    ...typography.h3,
    color: colors.text,
  },
  firmLocation: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  metricNumber: {
    ...typography.h2,
    color: colors.primaryDark,
    fontWeight: '800',
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  quickCard: {
    width: '30.5%',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 96,
  },
  quickIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  quickCardTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
});
