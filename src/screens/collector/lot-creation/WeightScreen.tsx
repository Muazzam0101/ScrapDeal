import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../../theme';
import { useLanguage } from '../../../context/LanguageContext';
import { useCreateLot } from '../../../context/CreateLotContext';
import { AppHeader } from '../../../components/AppHeader';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { WeightSelector } from '../../../components/WeightSelector';

interface WeightScreenProps {
  navigation: any;
  route: any;
}

export const WeightScreen: React.FC<WeightScreenProps> = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { weightKg, setWeightKg, categoryId } = useCreateLot();

  const handleContinue = () => {
    navigation.navigate('TakePhoto', {
      categoryId: categoryId || 'pcb',
      weightKg,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <AppHeader
        title={t('weightTitle')}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        showNotification={false}
        showRoleSwitch={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.promptTitle}>{t('weightTitle')}</Text>

        {/* Large Stepper & KG input */}
        <WeightSelector
          value={weightKg}
          onChange={setWeightKg}
          unit={t('kg')}
        />

        {/* Price Estimation Card - STRICT NO FAKE DATA: Informative Empty State */}
        <View style={styles.estimateCard}>
          <View style={styles.estimateHeader}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.estimateTitle}>{t('estimatedValue')}</Text>
          </View>

          <Text style={styles.estimateNotice}>
            {t('pricesEmptyDesc')}
          </Text>

          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{t('priceUnavailable')}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Button */}
      <View style={styles.bottomBar}>
        <PrimaryButton
          title={t('proceedButton')}
          icon="arrow-forward"
          onPress={handleContinue}
          disabled={weightKg <= 0}
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
    alignItems: 'center',
  },
  promptTitle: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  estimateCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  estimateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  estimateTitle: {
    ...typography.h4,
    color: colors.textSecondary,
  },
  estimateNotice: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs,
    backgroundColor: colors.cardAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warning,
  },
  statusText: {
    ...typography.badge,
    color: colors.textSecondary,
  },
  bottomBar: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
