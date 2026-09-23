import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { AppHeader } from '../../components/AppHeader';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';

export const RecyclerReportsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useLanguage();
  const [viewState, setViewState] = useState<'empty' | 'loading' | 'error'>('empty');

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

        {/* Dynamic Empty / Loading / Error States (Strict No Fake Analytics/Charts) */}
        {viewState === 'empty' && (
          <EmptyState
            icon="bar-chart-outline"
            title="रिपोर्ट उपलब्ध नहीं है"
            description="Transaction data available होने के बाद reports दिखाई जाएंगी।"
            actionTitle="लॉट्स पर जाएं"
            onActionPress={() => navigation.navigate('RecyclerLots')}
          />
        )}

        {viewState === 'loading' && (
          <LoadingState message="विश्लेषण और रिपोर्ट तैयार की जा रही है..." />
        )}

        {viewState === 'error' && (
          <ErrorState
            message="रिपोर्ट डेटा लोड करने में त्रुटि।"
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
