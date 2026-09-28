import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme';
import { useLanguage } from '../../../context/LanguageContext';
import { useCreateLot } from '../../../context/CreateLotContext';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { StatusBadge } from '../../../components/StatusBadge';

interface SuccessScreenProps {
  navigation: any;
  route: any;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { resetLot, weightKg, ratePerKg, paymentMethod, categoryId } = useCreateLot();

  const finalAmount = Math.round(weightKg * (ratePerKg || 280));

  const handleGoHome = () => {
    resetLot();
    navigation.navigate('CollectorHome');
  };

  const handleViewEarnings = () => {
    resetLot();
    navigation.navigate('CollectorEarnings');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated-feel Green Check Emblem */}
        <View style={styles.emblemContainer}>
          <View style={[styles.emblemOuter, shadows.lg]}>
            <View style={styles.emblemInner}>
              <Ionicons name="checkmark" size={54} color={colors.textLight} />
            </View>
          </View>
          <Text style={styles.title}>{t('dealSuccessTitle')}</Text>
          <Text style={styles.subtitle}>{t('dealSuccessSub')}</Text>
        </View>

        {/* Transaction Summary Card */}
        <View style={styles.receiptCard}>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>{t('finalAmountLabel')}</Text>
            <Text style={styles.amountValue}>
              ₹ {finalAmount.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('materialCategory')}</Text>
            <Text style={styles.detailValue}>
              {categoryId ? t(`cat${categoryId.charAt(0).toUpperCase() + categoryId.slice(1)}` as any) : 'PCB'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('weight')}</Text>
            <Text style={styles.detailValue}>{weightKg} {t('kg')}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('paymentModeLabel')}</Text>
            <Text style={styles.detailValue}>
              {paymentMethod === 'cash' ? t('payCash') : t('payUpi')}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('recyclerLabel')}</Text>
            <Text style={styles.detailValue}>{t('authorizedRecycler')}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('status') || 'Status'}</Text>
            <StatusBadge label={t('statusSuccess')} variant="success" icon="checkmark-circle" />
          </View>
        </View>

        {/* Navigation Action Buttons */}
        <View style={styles.buttonStack}>
          <PrimaryButton
            title={t('backToHome')}
            icon="home-outline"
            onPress={handleGoHome}
          />
          <SecondaryButton
            title={t('viewEarnings')}
            icon="wallet-outline"
            onPress={handleViewEarnings}
          />
        </View>
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
    paddingTop: spacing.xxl,
    paddingBottom: spacing.huge,
    alignItems: 'center',
  },
  emblemContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emblemOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emblemInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.primaryDark,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  receiptCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    marginBottom: spacing.xxl,
  },
  receiptRow: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  receiptLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  amountValue: {
    ...typography.displayLarge,
    color: colors.primaryDark,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '700',
  },
  buttonStack: {
    width: '100%',
    gap: spacing.md,
  },
});
