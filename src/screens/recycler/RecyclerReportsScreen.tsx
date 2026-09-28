import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { AppHeader } from '../../components/AppHeader';
import { EmptyState } from '../../components/EmptyState';

export const RecyclerReportsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <AppHeader
        title={t('tabReports')}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        showRoleSwitch={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Metric Cards Outline Placeholder */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>{t('totalPurchases')}</Text>
            <Text style={styles.metricValue}>₹ 0</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>{t('totalWeight')}</Text>
            <Text style={styles.metricValue}>0 {t('kg')}</Text>
          </View>
        </View>

        {/* Dynamic Empty State */}
        <EmptyState
          icon="bar-chart-outline"
          title={t('noReportsAvailable')}
          description={t('noReportsDesc')}
          actionTitle={t('exploreLots')}
          onActionPress={() => navigation.navigate('RecyclerLots')}
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
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  metricValue: {
    ...typography.h2,
    color: colors.primaryDark,
    marginTop: 4,
    fontWeight: '800',
  },
});
