import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../../theme';
import { useLanguage } from '../../../context/LanguageContext';
import { useCreateLot } from '../../../context/CreateLotContext';
import { useAuthStore } from '../../../store/useAuthStore';
import { dealRepository } from '../../../services/sqlite/repositories/dealRepository';
import { transactionRepository } from '../../../services/sqlite/repositories/transactionRepository';
import { dealFlowService } from '../../../services/deal/dealFlowService';
import { AppHeader } from '../../../components/AppHeader';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { PaymentMethodCard } from '../../../components/PaymentMethodCard';
import { PaymentMethod, Deal, Transaction } from '../../../types';

interface PaymentScreenProps {
  navigation: any;
  route: any;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { paymentMethod, setPaymentMethod, createdLotId } = useCreateLot();
  const { currentUser } = useAuthStore();

  const activeLotId = route.params?.lotId || createdLotId || 'LOT-LOCAL';
  const dealId = route.params?.dealId;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [tx, setTx] = useState<Transaction | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        let loadedDeal: Deal | null = null;
        if (dealId) {
          loadedDeal = await dealRepository.getDealById(dealId);
        } else if (activeLotId) {
          loadedDeal = await dealRepository.getDealByLotId(activeLotId);
        }
        if (loadedDeal) setDeal(loadedDeal);

        const loadedTx = await transactionRepository.getTransactionByLotId(activeLotId);
        if (loadedTx) setTx(loadedTx);
      } catch (err) {
        console.warn('[PaymentScreen] Error loading deal/tx:', err);
      }
    };
    loadDetails();
  }, [activeLotId, dealId]);

  const totalAmount = tx?.totalAmount || deal?.agreedTotalAmount || 0;
  const materialName = tx?.materialName || deal?.materialName || 'कबाड़ (Scrap)';

  const handleFinishPayment = async () => {
    setSubmitting(true);
    try {
      await dealFlowService.recordPayment(activeLotId, paymentMethod);

      navigation.navigate('Success', {
        lotId: activeLotId,
        amount: totalAmount,
        recyclerName: 'पंजीकृत रीसाइक्लर',
      });
    } catch (e: any) {
      console.warn('[PaymentScreen] Error recording payment:', e);
      navigation.navigate('Success', {
        lotId: activeLotId,
        amount: totalAmount,
        recyclerName: 'पंजीकृत रीसाइक्लर',
      });
    } finally {
      setSubmitting(false);
    }
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenHeading}>{t('paymentTitle')}</Text>
        <Text style={styles.screenSub}>{t('paymentSubtitle')}</Text>

        {/* Real Amount Summary */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>प्राप्त होने वाली कुल राशि</Text>
          <Text style={styles.amountValue}>
            ₹ {totalAmount.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.materialSub}>
            सामग्री: {materialName} • {tx?.weightKg || deal?.agreedWeightKg || ''} किग्रा
          </Text>
        </View>

        {/* Cash Option */}
        <PaymentMethodCard
          method="cash"
          title={t('payCash')}
          subtitle="कलेक्टर को सीधे नकद भुगतान करें"
          badgeText="नकद (Cash Record)"
          isSelected={paymentMethod === 'cash'}
          onSelect={() => setPaymentMethod('cash')}
        />

        {/* UPI Option */}
        <PaymentMethodCard
          method="upi"
          title={t('payUpi')}
          subtitle="Google Pay / PhonePe / Paytm / BHIM"
          badgeText="UPI रिकॉर्ड (Unverified)"
          isSelected={paymentMethod === 'upi'}
          onSelect={() => setPaymentMethod('upi')}
        />

        {/* Informative Disclaimer: No Fake Payment Gateway Claim */}
        <View style={styles.noticeBox}>
          <Ionicons name="information-circle" size={20} color="#D97706" />
          <Text style={styles.noticeText}>
            ध्यान दें: यह केवल भुगतान का माध्यम दर्ज करता है। ऐप किसी स्वचालित UPI गेटवे से जुड़ा नहीं है। नकद या UPI लेनदेन स्वयं जाँचें।
          </Text>
        </View>
      </ScrollView>

      {/* Primary CTA */}
      <View style={styles.bottomBar}>
        <PrimaryButton
          title={submitting ? 'दर्ज किया जा रहा है...' : 'भुगतान दर्ज करें व समाप्त करें ✓'}
          icon="checkmark-circle"
          onPress={handleFinishPayment}
          disabled={submitting}
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
    color: colors.textPrimary,
    textAlign: 'center',
  },
  screenSub: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  amountCard: {
    backgroundColor: '#E3FCEF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: '#ABF5D1',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  amountLabel: {
    ...typography.caption,
    color: '#00875A',
    fontWeight: '700',
  },
  amountValue: {
    ...typography.h1,
    color: '#00875A',
    marginVertical: spacing.xs,
  },
  materialSub: {
    ...typography.caption,
    color: '#00875A',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  noticeText: {
    fontSize: 12,
    color: '#92400E',
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
