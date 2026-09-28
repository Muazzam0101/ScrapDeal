import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { offerRepository } from '../../services/sqlite/repositories/offerRepository';
import { Offer } from '../../types';
import { AppHeader } from '../../components/AppHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';

interface RecyclerOfferStatusScreenProps {
  navigation: any;
  route: any;
}

export const RecyclerOfferStatusScreen: React.FC<RecyclerOfferStatusScreenProps> = ({
  navigation,
  route,
}) => {
  const { t } = useLanguage();
  const offerId = route.params?.offerId;
  const passedRate = route.params?.ratePerKg;
  const passedTotal = route.params?.totalAmount;

  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(Boolean(offerId));

  useEffect(() => {
    if (offerId) {
      offerRepository.getOfferById(offerId).then((o) => {
        if (o) setOffer(o);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [offerId]);

  const status = offer?.status || 'pending';
  const isAccepted = status === 'accepted';
  const isRejected = status === 'rejected';
  const isPending = status === 'pending' || status === 'sent' || status === 'viewed';

  const ratePerKg = offer?.ratePerKg ?? passedRate ?? 0;
  const totalAmount = offer?.totalAmount ?? passedTotal ?? 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <AppHeader
        title={t('offerStatusTitle')}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        showRoleSwitch={false}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('checkingOfferStatus')}</Text>
          </View>
        ) : (
          <>
            {/* Status Banner */}
            {isAccepted && (
              <View style={[styles.statusBanner, styles.bannerAccepted, shadows.md]}>
                <Ionicons name="checkmark-circle" size={44} color="#fff" />
                <Text style={styles.bannerTitle}>{t('offerAcceptedTitle')}</Text>
                <Text style={styles.bannerSubtitle}>{t('offerAcceptedDesc')}</Text>
              </View>
            )}

            {isPending && (
              <View style={[styles.statusBanner, styles.bannerPending, shadows.md]}>
                <Ionicons name="time" size={44} color="#fff" />
                <Text style={styles.bannerTitle}>{t('offerPendingTitle')}</Text>
                <Text style={styles.bannerSubtitle}>{t('offerPendingDesc')}</Text>
              </View>
            )}

            {isRejected && (
              <View style={[styles.statusBanner, styles.bannerRejected, shadows.md]}>
                <Ionicons name="close-circle" size={44} color="#fff" />
                <Text style={styles.bannerTitle}>{t('offerRejectedTitle')}</Text>
                <Text style={styles.bannerSubtitle}>{t('offerRejectedDesc')}</Text>
              </View>
            )}

            {/* Offer Details Card */}
            <View style={styles.detailsCard}>
              <Text style={styles.detailsHeading}>{t('offerDetailsHeading')}</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('offeredRate')}:</Text>
                <Text style={styles.detailValue}>₹{ratePerKg} / {t('kg')}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('totalAmount')}:</Text>
                <Text style={styles.detailTotal}>₹{totalAmount}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('currentStatus')}:</Text>
                <View
                  style={[
                    styles.statusPill,
                    isAccepted ? styles.pillAccepted : isRejected ? styles.pillRejected : styles.pillPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      isAccepted ? styles.textAccepted : isRejected ? styles.textRejected : styles.textPending,
                    ]}
                  >
                    {isAccepted ? t('dealAcceptedStatus') : isRejected ? t('offerRejectedTitle') : t('pendingBadge')}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.bottomBar}>
        {isAccepted ? (
          <PrimaryButton
            title={t('viewPickupsCTA')}
            onPress={() => navigation.navigate('RecyclerPickup')}
          />
        ) : (
          <SecondaryButton
            title={t('browseLotsCTA')}
            onPress={() => navigation.navigate('RecyclerRoot', { screen: 'RecyclerLots' })}
          />
        )}
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
  loadingBox: {
    paddingVertical: spacing.huge,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  statusBanner: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  bannerAccepted: {
    backgroundColor: '#00875A',
  },
  bannerPending: {
    backgroundColor: '#D97706',
  },
  bannerRejected: {
    backgroundColor: '#DC2626',
  },
  bannerTitle: {
    ...typography.h2,
    color: '#fff',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  bannerSubtitle: {
    ...typography.bodySecondary,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  detailsHeading: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  detailTotal: {
    ...typography.h3,
    color: colors.primary,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  pillPending: {
    backgroundColor: '#FEF3C7',
  },
  pillAccepted: {
    backgroundColor: '#E3FCEF',
  },
  pillRejected: {
    backgroundColor: '#FEE2E2',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textPending: {
    color: '#D97706',
  },
  textAccepted: {
    color: '#00875A',
  },
  textRejected: {
    color: '#DC2626',
  },
  bottomBar: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
