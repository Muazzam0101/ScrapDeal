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

interface CollectorDealsScreenProps {
  navigation: any;
}

export const CollectorDealsScreen: React.FC<CollectorDealsScreenProps> = ({
  navigation,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [viewState, setViewState] = useState<'empty' | 'loading' | 'error'>('empty');

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
              सक्रिय सौदे (Active)
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
              पूर्ण सौदे (Completed)
            </Text>
          </TouchableOpacity>
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

        {/* Dynamic Empty / Loading / Error States (Strict No Fake Data) */}
        {viewState === 'empty' && (
          <EmptyState
            icon="hand-left-outline"
            title="अभी कोई सक्रिय सौदा नहीं है"
            description="जब आप रीसाइक्लर को सामान का ऑफर देंगे, तो वह यहाँ दिखाई देगा।"
            actionTitle={t('sellGoodsCTA')}
            onActionPress={() => navigation.navigate('TakePhoto')}
          />
        )}

        {viewState === 'loading' && (
          <LoadingState
            message="सौदों की स्थिति जांची जा रही है..."
          />
        )}

        {viewState === 'error' && (
          <ErrorState
            message="डेटा प्राप्त नहीं हो सका।"
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
    ...typography.buttonSmall,
    color: colors.textSecondary,
  },
  tabTextActive: {
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
