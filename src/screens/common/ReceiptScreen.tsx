import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { paymentService } from '../../services/payment/paymentService';
import { AppHeader } from '../../components/AppHeader';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { TransactionReceipt } from '../../types';

interface ReceiptScreenProps {
  navigation: any;
  route: any;
}

export const ReceiptScreen: React.FC<ReceiptScreenProps> = ({ navigation, route }) => {
  const { t } = useLanguage();
  const transactionId = route.params?.transactionId || route.params?.dealId;

  const [receipt, setReceipt] = useState<TransactionReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceipt = async () => {
      if (!transactionId) {
        setError(t('receiptNotFound') || 'Receipt not found');
        setLoading(false);
        return;
      }
      try {
        const data = await paymentService.generateReceipt(transactionId);
        setReceipt(data);
      } catch (err: any) {
        console.warn('[ReceiptScreen] Error loading receipt:', err);
        setError(err.message || 'Could not load receipt');
      } finally {
        setLoading(false);
      }
    };
    fetchReceipt();
  }, [transactionId]);

  const handleShare = async () => {
    if (!receipt) return;
    try {
      const shareMessage = [
        `=== SCRAPDEAL TRANSACTION RECEIPT ===`,
        `Receipt #: ${receipt.receiptNumber}`,
        `Transaction ID: ${receipt.transactionId}`,
        `Material: ${receipt.materialName} (${receipt.materialCategory})`,
        `Final Weight: ${receipt.finalWeightKg} kg`,
        `Agreed Rate: ₹${receipt.ratePerKg}/kg`,
        `Total Amount: ₹${receipt.totalAmount.toLocaleString('en-IN')}`,
        `Payment Method: ${receipt.paymentMethod.toUpperCase()}`,
        `Status: ${receipt.paymentStatus.toUpperCase()}`,
        receipt.providerReference ? `Provider Ref: ${receipt.providerReference}` : '',
        `Completed At: ${new Date(receipt.completedAt).toLocaleString()}`,
        `======================================`,
      ].filter(Boolean).join('\n');

      await Share.share({
        message: shareMessage,
        title: `ScrapDeal Receipt - ${receipt.receiptNumber}`,
      });
    } catch (e) {
      console.warn('[ReceiptScreen] Share error:', e);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader title={t('receiptTitle') || 'Transaction Receipt'} showBack onBackPress={() => navigation.goBack()} />
        <LoadingState message={t('loadingReceipt') || 'Generating receipt...'} />
      </SafeAreaView>
    );
  }

  if (error || !receipt) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader title={t('receiptTitle') || 'Transaction Receipt'} showBack onBackPress={() => navigation.goBack()} />
        <ErrorState message={error || 'Receipt not available'} onRetry={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <AppHeader
        title={t('receiptTitle') || 'Transaction Receipt'}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        showNotification={false}
        showRoleSwitch={false}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Receipt Container Card */}
        <View style={[styles.receiptCard, shadows.md]}>
          {/* Header Branding */}
          <View style={styles.brandRow}>
            <View style={styles.brandBadge}>
              <Ionicons name="shield-checkmark" size={24} color="#00875A" />
            </View>
            <View>
              <Text style={styles.brandName}>SCRAPDEAL</Text>
              <Text style={styles.brandTagline}>{t('officialReceipt') || 'Official Digital Transaction Receipt'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Success Status Seal */}
          <View style={styles.statusSeal}>
            <Ionicons name="checkmark-circle" size={20} color="#00875A" />
            <Text style={styles.statusText}>{t('paymentCompletedBadge') || 'PAYMENT COMPLETED & SETTLED'}</Text>
          </View>

          {/* Amount Showcase */}
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>{t('totalSettledAmount') || 'Total Amount'}</Text>
            <Text style={styles.amountValue}>₹ {receipt.totalAmount.toLocaleString('en-IN')}</Text>
            <Text style={styles.currencyTag}>{receipt.currency || 'INR'}</Text>
          </View>

          {/* Details Table */}
          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.label}>{t('receiptNumber') || 'Receipt Number'}</Text>
              <Text style={styles.value}>{receipt.receiptNumber}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>{t('transactionId') || 'Transaction ID'}</Text>
              <Text style={styles.value}>{receipt.transactionId}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>{t('dealId') || 'Deal ID'}</Text>
              <Text style={styles.value}>{receipt.dealId}</Text>
            </View>

            <View style={styles.dividerLight} />

            <View style={styles.row}>
              <Text style={styles.label}>{t('collector') || 'Collector'}</Text>
              <Text style={styles.value}>{receipt.collectorName || receipt.collectorId}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>{t('recycler') || 'Recycler'}</Text>
              <Text style={styles.value}>{receipt.recyclerName || receipt.recyclerId}</Text>
            </View>

            <View style={styles.dividerLight} />

            <View style={styles.row}>
              <Text style={styles.label}>{t('materialCategory') || 'Material'}</Text>
              <Text style={styles.value}>{receipt.materialName} ({receipt.materialCategory})</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>{t('finalWeight') || 'Final Weight'}</Text>
              <Text style={styles.value}>{receipt.finalWeightKg} {t('kg') || 'kg'}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>{t('agreedRate') || 'Agreed Rate'}</Text>
              <Text style={styles.value}>₹{receipt.ratePerKg} / {t('kg') || 'kg'}</Text>
            </View>

            <View style={styles.dividerLight} />

            <View style={styles.row}>
              <Text style={styles.label}>{t('paymentMethod') || 'Payment Method'}</Text>
              <Text style={[styles.value, styles.capitalize]}>
                {receipt.paymentMethod === 'cash' ? t('cash') || 'CASH' : 'UPI'}
              </Text>
            </View>

            {receipt.providerReference ? (
              <View style={styles.row}>
                <Text style={styles.label}>{t('providerRef') || 'Provider Reference / UTR'}</Text>
                <Text style={styles.value}>{receipt.providerReference}</Text>
              </View>
            ) : null}

            <View style={styles.row}>
              <Text style={styles.label}>{t('completedAt') || 'Completed At'}</Text>
              <Text style={styles.value}>{new Date(receipt.completedAt).toLocaleString()}</Text>
            </View>
          </View>

          {/* Security Stamp / Assurance */}
          <View style={styles.securityBox}>
            <Ionicons name="lock-closed" size={16} color="#00875A" />
            <Text style={styles.securityText}>
              {t('receiptSecurityNotice') || 'Verified digital settlement ledger. Sensitive banking passwords/credentials are never stored.'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Ionicons name="share-social-outline" size={20} color={colors.primary} />
            <Text style={styles.shareBtnText}>{t('shareReceipt') || 'Share'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-done" size={20} color={colors.textLight} />
            <Text style={styles.doneBtnText}>{t('done') || 'Done'}</Text>
          </TouchableOpacity>
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
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
  },
  receiptCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  brandBadge: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: '#E3FCEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    ...typography.h3,
    color: colors.primaryDark,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandTagline: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  dividerLight: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: spacing.xs,
  },
  statusSeal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: '#E3FCEF',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  statusText: {
    ...typography.caption,
    color: '#00875A',
    fontWeight: '700',
  },
  amountContainer: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  amountLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  amountValue: {
    ...typography.displayLarge,
    color: colors.textPrimary,
    fontWeight: '800',
    marginVertical: 2,
  },
  currencyTag: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
  },
  table: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  value: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1.2,
    textAlign: 'right',
  },
  capitalize: {
    textTransform: 'uppercase',
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#E3FCEF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  securityText: {
    fontSize: 11,
    color: '#00875A',
    flex: 1,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  shareBtnText: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '700',
  },
  doneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
  },
  doneBtnText: {
    ...typography.bodyMedium,
    color: colors.textLight,
    fontWeight: '700',
  },
});
