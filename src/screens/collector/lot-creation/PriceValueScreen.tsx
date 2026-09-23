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
import { colors, spacing, typography, borderRadius } from '../../../theme';
import { useLanguage } from '../../../context/LanguageContext';
import { useCreateLot } from '../../../context/CreateLotContext';
import { AppHeader } from '../../../components/AppHeader';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { EmptyState } from '../../../components/EmptyState';
import { LoadingState } from '../../../components/LoadingState';
import { ErrorState } from '../../../components/ErrorState';

interface PriceValueScreenProps {
  navigation: any;
  route: any;
}

export const PriceValueScreen: React.FC<PriceValueScreenProps> = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { categoryId, weightKg } = useCreateLot();

  // State switcher to preview Empty, Loading, and Error states cleanly
  const [viewState, setViewState] = useState<'empty' | 'loading' | 'error'>('empty');

  const handleContinue = () => {
    navigation.navigate('RecyclerMatching', {
      categoryId: categoryId || 'pcb',
      weightKg,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title={t('priceScreenTitle')}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        showNotification={false}
        showRoleSwitch={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.promptTitle}>{t('priceScreenTitle')}</Text>

        {/* State Toggle for UI Inspection */}
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

        {/* Render Selected UI State */}
        {viewState === 'empty' && (
          <EmptyState
            icon="calculator-outline"
            title={t('priceUnavailable')}
            description={t('pricesEmptyDesc')}
            actionTitle="पुनः जाँच करें"
            onActionPress={() => setViewState('loading')}
          />
        )}

        {viewState === 'loading' && (
          <LoadingState
            message="ताजा मंडी भाव प्राप्त किया जा रहा है..."
          />
        )}

        {viewState === 'error' && (
          <ErrorState
            message="मूल्य सर्वर से संपर्क नहीं हो पाया। इंटरनेट जाँचें।"
            onRetry={() => setViewState('empty')}
          />
        )}

        {/* Selected Material Recap */}
        <View style={styles.recapCard}>
          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>सामग्री (Category):</Text>
            <Text style={styles.recapValue}>
              {categoryId ? t(`cat${categoryId.charAt(0).toUpperCase() + categoryId.slice(1)}` as any) : 'PCB'}
            </Text>
          </View>
          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>वजन (Weight):</Text>
            <Text style={styles.recapValue}>{weightKg} {t('kg')}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <PrimaryButton
          title="Recycler खोजें →"
          onPress={handleContinue}
        />
      </View>
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
  promptTitle: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
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
  recapCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  recapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  recapLabel: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  recapValue: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '700',
  },
  bottomBar: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
