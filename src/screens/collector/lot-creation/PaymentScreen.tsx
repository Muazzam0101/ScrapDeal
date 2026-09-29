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
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme';
import { useLanguage } from '../../../context/LanguageContext';
import { useCreateLot } from '../../../context/CreateLotContext';
import { useAuthStore } from '../../../store/useAuthStore';
import { dealRepository } from '../../../services/sqlite/repositories/dealRepository';
import { handoverRepository } from '../../../services/sqlite/repositories/handoverRepository';
import { paymentRepository } from '../../../services/sqlite/repositories/paymentRepository';
import { transactionRepository } from '../../../services/sqlite/repositories/transactionRepository';
import { userRepository } from '../../../services/sqlite/repositories/userRepository';
import { paymentService } from '../../../services/payment/paymentService';
import { networkService } from '../../../services/connectivity/networkService';
import { AppHeader } from '../../../components/AppHeader';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { PaymentMethodCard } from '../../../components/PaymentMethodCard';
import { LoadingState } from '../../../components/LoadingState';
import { Deal, HandoverRecord, Payment, Transaction, PaymentMethod } from '../../../types';

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
  const [handover, setHandover] = useState<HandoverRecord | null>(null);
  const [recyclerName, setRecyclerName] = useState<string>('');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isOfflineSavedNotice, setIsOfflineSavedNotice] = useState(false);

  const collectorId = currentUser?.id || 'COLLECTOR-LOCAL';

  const loadData = async () => {
    try {
      let loadedDeal: Deal | null = null;
      if (dealId) {
        loadedDeal = await dealRepository.getDealById(dealId);
      } else if (activeLotId) {
        loadedDeal = await dealRepository.getDealByLotId(activeLotId);
      }

      if (loadedDeal) {
        setDeal(loadedDeal);
        const [ho, p, tRecord, recycler] = await Promise.all([
          handoverRepository.getHandoverByDealId(loadedDeal.localId || loadedDeal.id),
          paymentRepository.getPaymentByDealId(loadedDeal.localId || loadedDeal.id),
          transactionRepository.getTransactionByDealId(loadedDeal.localId || loadedDeal.id),
          userRepository.getUserById(loadedDeal.recyclerId),
        ]);
        setHandover(ho);
        setPayment(p);
        setTx(tRecord);
        const recyclerProfile = recycler as any;
        if (recyclerProfile?.businessName || recyclerProfile?.name) {
          setRecyclerName(recyclerProfile.businessName || recyclerProfile.name);
        }
      }
    } catch (err) {
      console.warn('[PaymentScreen] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeLotId, dealId]);

  const finalWeight = handover?.actualWeightKg || deal?.agreedWeightKg || 0;
  const agreedRate = deal?.agreedRatePerKg || 0;
  const totalAmount = Math.round(finalWeight * agreedRate) || tx?.totalAmount || deal?.agreedTotalAmount || 0;
  const materialName = tx?.materialName || deal?.materialName || t('scrapMaterial') || 'Scrap';

  const isCompleted = payment?.status === 'completed' || tx?.paymentStatus === 'completed';
  const recyclerHasPaidCash = Boolean(payment?.cashPaidConfirmedByRecycler);

  // Collector confirms "Cash Received"
  const handleConfirmCashReceived = async () => {
    if (submitting || !payment) return;
    setSubmitting(true);
    try {
      const result = await paymentService.confirmCollectorCashReceived(payment.paymentId, collectorId);
      setPayment(result.payment);
      setTx(result.transaction);

      if (!networkService.isOnline()) {
        setIsOfflineSavedNotice(true);
      }

      Alert.alert(
        t('paymentReceivedSuccessTitle') || 'भुगतान प्राप्त (Payment Received)',
        t('paymentReceivedSuccessBody') || 'नकद भुगतान की पुष्टि सफलतापूर्वक हो गई है।',
        [
          {
            text: t('viewReceipt') || 'रसीद देखें (View Receipt)',
            onPress: () =>
              navigation.navigate('Receipt', {
                transactionId: result.transaction.localId || result.transaction.id,
              }),
          },
          { text: t('done') || 'ठीक है', style: 'cancel' },
        ]
      );
    } catch (e: any) {
      Alert.alert(t('error') || 'Error', e.message || 'Confirmation failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader title={t('paymentTitle') || 'Payment'} showBack onBackPress={() => navigation.goBack()} />
        <LoadingState message={t('loadingPaymentDetails') || 'Loading payment...'} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <AppHeader
        title={t('paymentTitle') || 'Payment'}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        showNotification={false}
        showRoleSwitch={false}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Offline Banner if offline action recorded */}
        {isOfflineSavedNotice && (
          <View style={styles.offlineNoticeBanner}>
            <Ionicons name="cloud-offline" size={18} color="#92400E" />
            <Text style={styles.offlineNoticeText}>
              {t('offlineSavedNotice') || 'Saved offline — will sync when internet returns.'}
            </Text>
          </View>
        )}

        {/* Status Header */}
        <View style={styles.statusRow}>
          <Ionicons
            name={isCompleted ? 'checkmark-circle' : 'time'}
            size={24}
            color={isCompleted ? '#00875A' : '#D97706'}
          />
          <Text style={[styles.statusTitle, isCompleted && styles.statusTitleCompleted]}>
            {isCompleted
              ? t('paymentCompletedBadge') || 'भुगतान संपन्न (Payment Successful)'
              : t('paymentPendingTitle') || 'भुगतान लंबित (Payment Pending)'}
          </Text>
        </View>

        {/* Real Amount Summary Card */}
        <View style={[styles.amountCard, shadows.sm]}>
          <Text style={styles.amountLabel}>{t('totalAmountDue') || 'देय राशि (Total Amount)'}</Text>
          <Text style={styles.amountValue}>
            ₹ {totalAmount.toLocaleString('en-IN')}
          </Text>

          <View style={styles.cardDetailsList}>
            <Text style={styles.cardDetailText}>
              👤 {t('recycler') || 'रीसाइक्लर'}: {recyclerName || deal?.recyclerId || t('registeredRecycler')}
            </Text>
            <Text style={styles.cardDetailText}>
              📦 {t('materialCategory') || 'सामग्री'}: {materialName} • {finalWeight} {t('kg') || 'kg'}
            </Text>
            {agreedRate > 0 && (
              <Text style={styles.cardDetailText}>
                💰 {t('agreedRate') || 'दर'}: ₹{agreedRate} / {t('kg') || 'kg'}
              </Text>
            )}
          </View>
        </View>

        {/* Completed State */}
        {isCompleted ? (
          <View style={styles.completedSection}>
            <View style={styles.sealCard}>
              <Ionicons name="shield-checkmark" size={48} color="#00875A" />
              <Text style={styles.sealTitle}>{t('transactionCompletedTitle') || 'लेनदेन पूर्ण हुआ'}</Text>
              <Text style={styles.sealSub}>
                {t('paymentReceivedConfirmationText') || 'आपके द्वारा राशि की प्राप्ति दर्ज कर ली गई है।'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.viewReceiptBtn}
              onPress={() =>
                navigation.navigate('Receipt', {
                  transactionId: tx?.localId || tx?.id || deal?.localId,
                })
              }
              activeOpacity={0.8}
            >
              <Ionicons name="receipt-outline" size={22} color={colors.textLight} />
              <Text style={styles.viewReceiptText}>{t('viewReceipt') || 'रसीद देखें (View Receipt)'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Pending Payment Options */
          <View style={styles.paymentMethodsSection}>
            <Text style={styles.methodsTitle}>{t('paymentMethod') || 'भुगतान का प्रकार (Payment Method)'}</Text>

            {/* Cash Card */}
            <PaymentMethodCard
              method="cash"
              title={t('payCash') || 'नकद (Cash)'}
              subtitle={
                recyclerHasPaidCash
                  ? t('recyclerPaidCashNotice') || '✓ रीसाइक्लर ने नकद दे दिया है'
                  : t('payCashSubtitle') || 'हैंडओवर के समय नकद लेनदेन'
              }
              badgeText={recyclerHasPaidCash ? t('cashPaidConfirmedBadge') || 'Paid by Recycler' : t('cash') || 'CASH'}
              isSelected={paymentMethod === 'cash'}
              onSelect={() => setPaymentMethod('cash')}
            />

            {/* UPI Card */}
            <PaymentMethodCard
              method="upi"
              title="UPI (ऑनलाइन)"
              subtitle="Google Pay / PhonePe / Paytm / BHIM"
              badgeText="UPI"
              isSelected={paymentMethod === 'upi'}
              onSelect={() => setPaymentMethod('upi')}
            />

            {/* If Cash chosen: Mutual Confirmation Prompt */}
            {paymentMethod === 'cash' && (
              <View style={styles.cashConfirmBox}>
                <Ionicons
                  name={recyclerHasPaidCash ? 'checkmark-circle' : 'hourglass-outline'}
                  size={24}
                  color={recyclerHasPaidCash ? '#00875A' : '#D97706'}
                />
                <View style={styles.cashConfirmTextCol}>
                  <Text style={styles.cashConfirmTitle}>
                    {recyclerHasPaidCash
                      ? t('cashReceivedPrompt') || 'क्या आपको नकद राशि मिल गई है?'
                      : t('awaitingRecyclerCash') || 'रीसाइक्लर द्वारा नकद भुगतान की प्रतीक्षा है'}
                  </Text>
                  <Text style={styles.cashConfirmSub}>
                    {recyclerHasPaidCash
                      ? t('cashReceivedPromptSub') || 'राशि की जांच कर नीचे "नकद प्राप्त हुआ" बटन दबाएं।'
                      : t('awaitingRecyclerCashSub') || 'रीसाइक्लर द्वारा भुगतान दर्ज करते ही आप पुष्टि कर सकेंगे।'}
                  </Text>
                </View>
              </View>
            )}

            {/* If UPI chosen: Clean notice */}
            {paymentMethod === 'upi' && (
              <View style={styles.upiNoticeBox}>
                <Ionicons name="information-circle" size={20} color="#2563EB" />
                <Text style={styles.upiNoticeText}>
                  {t('upiOfflineVerificationNotice') ||
                    'Internet connection required to verify UPI payment. Status updates once provider verifies.'}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Collector Action Button when not completed */}
      {!isCompleted && paymentMethod === 'cash' && recyclerHasPaidCash && (
        <View style={styles.bottomBar}>
          <PrimaryButton
            title={submitting ? t('confirming') || 'पुष्टि हो रही है...' : t('cashReceivedCTA') || '✓ नकद प्राप्त हुआ (Cash Received)'}
            icon="checkmark-circle"
            onPress={handleConfirmCashReceived}
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
  offlineNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEF3C7',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  offlineNoticeText: {
    ...typography.bodySmall,
    color: '#92400E',
    fontWeight: '600',
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  statusTitle: {
    ...typography.h3,
    color: '#D97706',
  },
  statusTitleCompleted: {
    color: '#00875A',
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
  cardDetailsList: {
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  cardDetailText: {
    ...typography.bodySmall,
    color: '#00875A',
    fontWeight: '600',
  },
  paymentMethodsSection: {
    gap: spacing.xs,
  },
  methodsTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  cashConfirmBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginTop: spacing.sm,
  },
  cashConfirmTextCol: {
    flex: 1,
  },
  cashConfirmTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  cashConfirmSub: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  upiNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  upiNoticeText: {
    fontSize: 12,
    color: '#1E40AF',
    flex: 1,
    lineHeight: 18,
  },
  completedSection: {
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  sealCard: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ABF5D1',
  },
  sealTitle: {
    ...typography.h2,
    color: '#00875A',
    marginTop: spacing.sm,
  },
  sealSub: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  viewReceiptBtn: {
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
  viewReceiptText: {
    ...typography.h4,
    color: colors.textLight,
  },
  bottomBar: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
