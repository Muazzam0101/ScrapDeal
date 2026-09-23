import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
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
    <SafeAreaView style={styles.safeArea}>
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
            <Text style={styles.loadingText}>ऑफर स्थिति जांची जा रही है...</Text>
          </View>
        ) : (
          <>
            {/* Status Banner */}
            {isAccepted && (
              <View style={[styles.statusBanner, styles.bannerAccepted, shadows.md]}>
                <Ionicons name="checkmark-circle" size={44} color="#fff" />
                <Text style={styles.bannerTitle}>ऑफर स्वीकृत! (Deal Accepted)</Text>
                <Text style={styles.bannerSubtitle}>
                  कलेक्टर ने आपका ऑफर स्वीकार कर लिया है। सौदा तय हो गया है।
                </Text>
              </View>
            )}

            {isPending && (
              <View style={[styles.statusBanner, styles.bannerPending, shadows.md]}>
                <Ionicons name="time" size={44} color="#fff" />
                <Text style={styles.bannerTitle}>ऑफर भेजा गया (Offer Pending)</Text>
                <Text style={styles.bannerSubtitle}>
                  आपका ऑफर कलेक्टर के पास समीक्षा के लिए भेज दिया गया है।
                </Text>
              </View>
            )}

            {isRejected && (
              <View style={[styles.statusBanner, styles.bannerRejected, shadows.md]}>
                <Ionicons name="close-circle" size={44} color="#fff" />
                <Text style={styles.bannerTitle}>ऑफर अस्वीकृत (Declined)</Text>
                <Text style={styles.bannerSubtitle}>
                  कलेक्टर ने किसी अन्य ऑफर को चुना है या यह ऑफर निरस्त कर दिया है।
                </Text>
              </View>
            )}

            {/* Offer Details Card */}
            <View style={styles.detailsCard}>
              <Text style={styles.detailsHeading}>प्रस्तावित विवरण (Offer Details)</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>प्रस्तावित दर (Offered Rate):</Text>
                <Text style={styles.detailValue}>₹{ratePerKg} / किग्रा</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>कुल प्रस्तावित राशि (Total Amount):</Text>
                <Text style={styles.detailTotal}>₹{totalAmount}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>वर्तमान स्थिति (Current Status):</Text>
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
                    {isAccepted ? 'स्वीकृत (Accepted)' : isRejected ? 'अस्वीकृत (Rejected)' : 'लंबित (Pending)'}
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
            title="पिकअप शेड्यूल देखें (View Pickups) →"
            onPress={() => navigation.navigate('RecyclerPickup')}
          />
        ) : (
          <SecondaryButton
            title="अन्य उपलब्ध लॉट देखें (Browse Lots)"
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
