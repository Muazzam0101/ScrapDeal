import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuthStore } from '../../store/useAuthStore';
import { dealRepository } from '../../services/sqlite/repositories/dealRepository';
import { handoverRepository } from '../../services/sqlite/repositories/handoverRepository';
import { paymentRepository } from '../../services/sqlite/repositories/paymentRepository';
import { transactionRepository } from '../../services/sqlite/repositories/transactionRepository';
import { userRepository } from '../../services/sqlite/repositories/userRepository';
import { paymentService } from '../../services/payment/paymentService';
import { networkService } from '../../services/connectivity/networkService';
import { AppHeader } from '../../components/AppHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { PaymentMethodCard } from '../../components/PaymentMethodCard';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { Deal, HandoverRecord, Payment, Transaction, PaymentMethod } from '../../types';

interface RecyclerPaymentScreenProps {
  navigation: any;
  route: any;
}

export const RecyclerPaymentScreen: React.FC<RecyclerPaymentScreenProps> = ({
  navigation,
  route,
}) => {
  const { t } = useLanguage();
  const { currentUser } = useAuthStore();
  const dealId = route.params?.dealId;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [handover, setHandover] = useState<HandoverRecord | null>(null);
  const [collectorName, setCollectorName] = useState<string>('');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [tx, setTx] = useState<Transaction | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recyclerId = currentUser?.id || 'RECYCLER-LOCAL';

  const loadData = async () => {
    if (!dealId) {
      setError(t('dealNotFound') || 'Deal ID missing');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const d = await dealRepository.getDealById(dealId);
      if (!d) {
        setError(t('dealNotFound') || 'Deal not found');
        setLoading(false);
        return;
      }
      setDeal(d);

      const [ho, p, tRecord, collector] = await Promise.all([
        handoverRepository.getHandoverByDealId(dealId),
        paymentRepository.getPaymentByDealId(dealId),
        transactionRepository.getTransactionByDealId(dealId),
        userRepository.getUserById(d.collectorId),
      ]);

      setHandover(ho);
      setPayment(p);
      setTx(tRecord);
      const collectorProfile = collector as any;
      if (collectorProfile?.name || collectorProfile?.phoneNumber) {
        setCollectorName(collectorProfile.name || collectorProfile.phoneNumber);
      }
    } catch (e: any) {
      console.warn('[RecyclerPayment] Load error:', e);
      setError(e.message || 'Error loading payment details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dealId]);

  const finalWeight = handover?.actualWeightKg || deal?.agreedWeightKg || 0;
  const agreedRate = deal?.agreedRatePerKg || 0;
  const totalAmount = Math.round(finalWeight * agreedRate);

  const isPaymentCompleted = payment?.status === 'completed' || tx?.paymentStatus === 'completed';
  const isAwaitingCollectorConfirmation =
    payment?.method === 'cash' &&
    payment?.cashPaidConfirmedByRecycler &&
    !payment?.cashReceivedConfirmedByCollector;

  // Handle Cash Paid Confirmation by Recycler
  const handleConfirmCashPaid = async () => {
    if (submitting) return; // Prevent double tap
    setSubmitting(true);
    try {
      // 1. Initiate payment if not already initialized
      const p = await paymentService.initiatePayment({
        dealId: deal!.localId || deal!.id,
        method: 'cash',
        actorId: recyclerId,
        actorRole: 'recycler',
      });

      // 2. Recycler confirms "Cash Paid"
      const updated = await paymentService.confirmRecyclerCashPaid(p.paymentId, recyclerId);
      setPayment(updated);
      Alert.alert(
        t('cashPaidConfirmedTitle') || 'नकद भुगतान दर्ज (Cash Paid Confirmed)',
        t('cashPaidConfirmedBody') || 'आपने नकद भुगतान की पुष्टि की है। अब कलेक्टर द्वारा नकद प्राप्ति की पुष्टि की प्रतीक्षा है।'
      );
    } catch (err: any) {
      Alert.alert(t('error') || 'Error', err.message || 'Failed to record cash payment');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle UPI Flow
  const handleInitiateUPI = async () => {
    if (submitting) return; // Prevent double tap
    if (!networkService.isOnline()) {
      Alert.alert(
        t('offlineTitle') || 'इंटरनेट आवश्यक (Offline)',
        t('upiOfflineNotice') || 'Internet connection required to verify UPI payment.'
      );
      return;
    }

    setSubmitting(true);
    try {
      await paymentService.initiatePayment({
        dealId: deal!.localId || deal!.id,
        method: 'upi',
        actorId: recyclerId,
        actorRole: 'recycler',
      });
    } catch (err: any) {
      Alert.alert(
        'UPI Notice',
        err.message || 'UPI payment is not configured yet. Live gateway credentials required.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader title={t('paymentRequiredTitle') || 'Payment'} showBack onBackPress={() => navigation.goBack()} />
        <LoadingState message={t('loadingPaymentDetails') || 'Loading payment details...'} />
      </SafeAreaView>
    );
  }

  if (error || !deal) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader title={t('paymentRequiredTitle') || 'Payment'} showBack onBackPress={() => navigation.goBack()} />
        <ErrorState message={error || 'Deal not found'} onRetry={loadData} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <AppHeader
        title={t('paymentRequiredTitle') || 'Payment Required'}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        showNotification={false}
        showRoleSwitch={false}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Deal Summary Card */}
        <View style={[styles.amountCard, shadows.sm]}>
          <Text style={styles.amountLabel}>{t('totalAmountDue') || 'Total Amount to Pay'}</Text>
          <Text style={styles.amountValue}>₹ {totalAmount.toLocaleString('en-IN')}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              {t('collector') || 'Collector'}: {collectorName || deal.collectorId}
            </Text>
            <Text style={styles.metaText}>
              {deal.materialName} • {finalWeight} {t('kg') || 'kg'} @ ₹{agreedRate}/{t('kg') || 'kg'}
            </Text>
            <Text style={styles.dealRefText}>
              {t('dealId') || 'Deal ID'}: #{deal.localId?.slice(-6) || deal.id?.slice(-6)}
            </Text>
          </View>
        </View>

        {/* State 1: Payment Completed */}
        {isPaymentCompleted ? (
          <View style={styles.completedContainer}>
            <View style={styles.completedSeal}>
              <Ionicons name="checkmark-circle" size={48} color="#00875A" />
              <Text style={styles.completedTitle}>{t('paymentCompletedBadge') || 'Payment Completed'}</Text>
              <Text style={styles.completedSub}>
                {t('transactionSettled') || 'Transaction settled and recorded.'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.receiptButton}
              onPress={() =>
                navigation.navigate('Receipt', {
                  transactionId: tx?.localId || tx?.id || deal.localId,
                })
              }
              activeOpacity={0.8}
            >
              <Ionicons name="receipt-outline" size={20} color={colors.textLight} />
              <Text style={styles.receiptButtonText}>{t('viewReceipt') || 'View Receipt'}</Text>
            </TouchableOpacity>
          </View>
        ) : isAwaitingCollectorConfirmation ? (
          /* State 2: Awaiting Collector Confirmation */
          <View style={styles.waitingContainer}>
            <View style={styles.waitingIconWrapper}>
              <Ionicons name="time" size={36} color="#D97706" />
            </View>
            <Text style={styles.waitingTitle}>
              {t('cashConfirmationAwaiting') || 'Awaiting Collector Confirmation'}
            </Text>
            <Text style={styles.waitingDesc}>
              {t('cashConfirmationAwaitingDesc') ||
                'You have confirmed cash payment. The collector has been notified to confirm receipt.'}
            </Text>

            <TouchableOpacity style={styles.refreshButton} onPress={loadData} activeOpacity={0.8}>
              <Ionicons name="refresh" size={18} color={colors.primary} />
              <Text style={styles.refreshButtonText}>{t('checkStatus') || 'Check Status'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* State 3: Method Selection & Payment Initiation */
          <View style={styles.methodSelectionSection}>
            <Text style={styles.sectionHeading}>{t('selectPaymentMethod') || 'Select Payment Method'}</Text>

            {/* Cash Option */}
            <PaymentMethodCard
              method="cash"
              title={t('payCash') || 'Pay Cash'}
              subtitle={t('payCashSubtitle') || 'Pay physical cash to collector during handover'}
              badgeText={t('cashRecordBadge') || 'Mutual Verification'}
              isSelected={selectedMethod === 'cash'}
              onSelect={() => setSelectedMethod('cash')}
            />

            {/* UPI Option */}
            <PaymentMethodCard
              method="upi"
              title={t('payUpi') || 'Pay via UPI'}
              subtitle="Google Pay / PhonePe / BHIM"
              badgeText={t('upiRecordBadge') || 'Online Verification'}
              isSelected={selectedMethod === 'upi'}
              onSelect={() => setSelectedMethod('upi')}
            />

            {/* Notice */}
            <View style={styles.noticeBox}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#00875A" />
              <Text style={styles.noticeText}>
                {selectedMethod === 'cash'
                  ? t('cashSettlementNotice') || 'Both parties must confirm cash exchange to complete transaction settlement.'
                  : t('upiSettlementNotice') || 'UPI verification requires active internet and legitimate server validation.'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Footer if payment not completed and not awaiting */}
      {!isPaymentCompleted && !isAwaitingCollectorConfirmation && (
        <View style={styles.bottomBar}>
          <PrimaryButton
            title={
              submitting
                ? t('processing') || 'Processing...'
                : selectedMethod === 'cash'
                ? t('confirmCashPaid') || 'Confirm Cash Paid'
                : t('payViaUpiCTA') || 'Pay via UPI'
            }
            icon={selectedMethod === 'cash' ? 'cash-outline' : 'qr-code-outline'}
            onPress={selectedMethod === 'cash' ? handleConfirmCashPaid : handleInitiateUPI}
            disabled={submitting}
          />
        </View>
      )}
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
  amountCard: {
    backgroundColor: '#E3FCEF',
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
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
    ...typography.displayLarge,
    color: '#00875A',
    fontWeight: '800',
    marginVertical: spacing.xs,
  },
  metaRow: {
    alignItems: 'center',
    gap: 2,
    marginTop: spacing.xs,
  },
  metaText: {
    ...typography.bodySmall,
    color: '#00875A',
    fontWeight: '600',
  },
  dealRefText: {
    ...typography.caption,
    color: '#006644',
    marginTop: 4,
  },
  sectionHeading: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  methodSelectionSection: {
    marginTop: spacing.xs,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3FCEF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  noticeText: {
    fontSize: 12,
    color: '#00875A',
    flex: 1,
    lineHeight: 18,
  },
  completedContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.lg,
  },
  completedSeal: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ABF5D1',
  },
  completedTitle: {
    ...typography.h2,
    color: '#00875A',
    marginTop: spacing.md,
  },
  completedSub: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: 4,
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    width: '100%',
  },
  receiptButtonText: {
    ...typography.h4,
    color: colors.textLight,
  },
  waitingContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: '#FEF3C7',
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: spacing.md,
  },
  waitingIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  waitingTitle: {
    ...typography.h3,
    color: '#92400E',
    textAlign: 'center',
  },
  waitingDesc: {
    ...typography.bodySmall,
    color: '#92400E',
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  refreshButtonText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '700',
  },
  bottomBar: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
