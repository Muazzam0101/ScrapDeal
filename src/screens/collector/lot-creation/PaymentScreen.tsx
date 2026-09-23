import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../../theme';
import { useLanguage } from '../../../context/LanguageContext';
import { useCreateLot } from '../../../context/CreateLotContext';
import { AppHeader } from '../../../components/AppHeader';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { PaymentMethodCard } from '../../../components/PaymentMethodCard';

interface PaymentScreenProps {
  navigation: any;
  route: any;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { paymentMethod, setPaymentMethod, weightKg, ratePerKg } = useCreateLot();

  const totalCalculated = Math.round(weightKg * (ratePerKg || 280));

  const handleFinishPayment = () => {
    navigation.navigate('Success', {
      lotId: 'LOT-202609',
      amount: totalCalculated,
      recyclerName: 'Authorized Recycler',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title={t('paymentTitle')}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        showNotification={false}
        showRoleSwitch={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenHeading}>{t('paymentTitle')}</Text>
        <Text style={styles.screenSub}>{t('paymentSubtitle')}</Text>

        {/* Amount to be received */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>प्राप्त होने वाली कुल राशि</Text>
          <Text style={styles.amountValue}>
            ₹ {totalCalculated.toLocaleString('en-IN')}
          </Text>
        </View>

        {/* Cash Option - Highlighted with Cash Fully Supported Notice */}
        <PaymentMethodCard
          method="cash"
          title={t('payCash')}
          subtitle="कलेक्टर को सीधे नकद भुगतान करें"
          badgeText="प्राथमिक / आसान"
          isSelected={paymentMethod === 'cash'}
          onSelect={() => setPaymentMethod('cash')}
        />

        {/* UPI Option - Clearly labeled optional */}
        <PaymentMethodCard
          method="upi"
          title={t('payUpi')}
          subtitle="Google Pay / PhonePe / Paytm"
          badgeText="वैकल्पिक (Optional)"
          isSelected={paymentMethod === 'upi'}
          onSelect={() => setPaymentMethod('upi')}
        />

        {/* Informative Security Notice for low-literacy users */}
        <View style={styles.noticeBox}>
          <Ionicons name="information-circle" size={20} color={colors.primaryDark} />
          <Text style={styles.noticeText}>
            {t('upiOptionalNotice')}
          </Text>
        </View>
      </ScrollView>

      {/* Primary CTA */}
      <View style={styles.bottomBar}>
        <PrimaryButton
          title={t('payNowCTA')}
          icon="arrow-forward"
          onPress={handleFinishPayment}
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
  screenHeading: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
  },
  screenSub: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  amountCard: {
    backgroundColor: colors.primaryUltraLight,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.primaryPale,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  amountLabel: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  amountValue: {
    ...typography.displayLarge,
    color: colors.primaryDark,
    marginTop: 4,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  noticeText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  bottomBar: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
