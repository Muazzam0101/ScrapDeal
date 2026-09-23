import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { AppHeader } from '../../components/AppHeader';
import { EmptyState } from '../../components/EmptyState';

export const RecyclerReportsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.safeArea}>
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
            <Text style={styles.metricLabel}>कुल खरीद (Total Purchase)</Text>
            <Text style={styles.metricValue}>₹ 0</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>कुल वजन (Total Quantity)</Text>
            <Text style={styles.metricValue}>0 kg</Text>
          </View>
        </View>

        {/* Dynamic Empty State */}
        <EmptyState
          icon="bar-chart-outline"
          title="रिपोर्ट उपलब्ध नहीं है"
          description="Transaction data available होने के बाद reports दिखाई जाएंगी।"
          actionTitle="लॉट्स पर जाएं"
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
