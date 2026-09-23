import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { AppHeader } from '../../components/AppHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { VerificationBadge } from '../../components/VerificationBadge';
import { EmptyState } from '../../components/EmptyState';

interface RecyclerLotDetailsScreenProps {
  navigation: any;
  route: any;
}

export const RecyclerLotDetailsScreen: React.FC<RecyclerLotDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const { t } = useLanguage();
  const isSamplePreview = route.params?.isSamplePreview ?? true;
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [hasData, setHasData] = useState(isSamplePreview);

  const handleMakeOffer = () => {
    navigation.navigate('RecyclerMakeOffer', {
      materialName: 'PCB (Mixed)',
      weightKg: 15,
      lotId: 'LOT-2026-0012',
    });
  };

  const handleReject = () => {
    navigation.goBack();
  };

  if (!hasData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader
          title={t('lotDetailsTitle')}
          showBack={true}
          onBackPress={() => navigation.goBack()}
          showRoleSwitch={false}
        />
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="cube-outline"
            title="कोई Lot विवरण उपलब्ध नहीं है"
            description="इस लॉट का विवरण देखने के लिए सक्रिय सूची से चयन करें।"
            actionTitle="नमूना विवरण देखें (View Preview)"
            onActionPress={() => setHasData(true)}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title={t('lotDetailsTitle')}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        showRoleSwitch={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Large Material Image View with Gallery Indicators */}
        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder}>
            {/* Viewfinder corners */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            <MaterialCommunityIcons name="chip" size={80} color="rgba(255,255,255,0.7)" />

            {/* Gallery Page Indicator */}
            <View style={styles.pageBadge}>
              <Text style={styles.pageBadgeText}>{activeImageIndex + 1}/3</Text>
            </View>
          </View>

          {/* Dots Indicator */}
          <View style={styles.dotsRow}>
            {[0, 1, 2].map((idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.dot, activeImageIndex === idx && styles.dotActive]}
                onPress={() => setActiveImageIndex(idx)}
              />
            ))}
          </View>
        </View>

        {/* Lot Title & ID */}
        <View style={styles.titleSection}>
          <Text style={styles.materialName}>PCB (Mixed)</Text>
          <Text style={styles.lotIdText}>Lot ID: L2026-0012</Text>
        </View>

        {/* Weight & Condition Tags */}
        <View style={styles.tagsRow}>
          <View style={styles.tagBadge}>
            <MaterialCommunityIcons name="weight" size={18} color={colors.primaryDark} />
            <View>
              <Text style={styles.tagValue}>15 kg</Text>
              <Text style={styles.tagLabel}>{t('approxWeightTag')}</Text>
            </View>
          </View>

          <View style={styles.tagBadge}>
            <Ionicons name="sparkles-outline" size={18} color={colors.softBlue} />
            <View>
              <Text style={styles.tagValue}>Used</Text>
              <Text style={styles.tagLabel}>{t('conditionTag')}</Text>
            </View>
          </View>
        </View>

        {/* Location Info */}
        <View style={styles.locationSection}>
          <Ionicons name="location-sharp" size={20} color={colors.primary} />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationName}>पुणे, महाराष्ट्र (Pune, MH)</Text>
            <Text style={styles.distanceText}>2.8 km from your facility</Text>
          </View>
        </View>

        {/* Estimated Market Value Card */}
        <View style={styles.valueCard}>
          <Text style={styles.valueTitle}>{t('estimatedValue')}</Text>
          <Text style={styles.valueAmount}>₹ 4,000 - 4,350</Text>
          <Text style={styles.valueRate}>(₹ 260 - 290 / kg)</Text>
        </View>

        {/* Collector Information Card */}
        <View style={styles.collectorCard}>
          <Text style={styles.collectorSectionTitle}>{t('collectorInfoTitle')}</Text>
          <View style={styles.collectorRow}>
            <View style={styles.collectorAvatar}>
              <MaterialCommunityIcons name="account-hard-hat" size={28} color={colors.primary} />
            </View>
            <View style={styles.collectorDetails}>
              <View style={styles.verifiedRow}>
                <Text style={styles.collectorStatus}>Verified Collector</Text>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              </View>
              <Text style={styles.transactionsCount}>24 successful transactions</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color={colors.softYellow} />
              <Text style={styles.ratingText}>4.8</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Actions: Reject and Make Offer */}
      <View style={styles.bottomBar}>
        <SecondaryButton
          title={t('rejectCTA')}
          variant="dangerOutline"
          onPress={handleReject}
          style={styles.rejectBtn}
        />
        <PrimaryButton
          title={t('makeOfferCTA')}
          onPress={handleMakeOffer}
          style={styles.offerBtn}
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
    gap: spacing.md,
  },
  emptyContainer: {
    padding: spacing.lg,
  },
  imageContainer: {
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: '#1E293B',
    borderRadius: borderRadius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.textLight,
  },
  topLeft: { top: 12, left: 12, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
  topRight: { top: 12, right: 12, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
  bottomLeft: { bottom: 12, left: 12, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
  bottomRight: { bottom: 12, right: 12, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },
  pageBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  pageBadgeText: {
    ...typography.badge,
    color: colors.textLight,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
  titleSection: {
    marginTop: spacing.xs,
  },
  materialName: {
    ...typography.h2,
    color: colors.text,
  },
  lotIdText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  tagBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.sm,
  },
  tagValue: {
    ...typography.h4,
    color: colors.text,
  },
  tagLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.sm,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationName: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.text,
  },
  distanceText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 1,
  },
  valueCard: {
    backgroundColor: colors.primaryUltraLight,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.primaryPale,
    alignItems: 'center',
  },
  valueTitle: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  valueAmount: {
    ...typography.displayLarge,
    color: colors.primaryDark,
    marginVertical: 2,
  },
  valueRate: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  collectorCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  collectorSectionTitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  collectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collectorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  collectorDetails: {
    flex: 1,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  collectorStatus: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.text,
  },
  transactionsCount: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.softYellowBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  ratingText: {
    ...typography.badge,
    color: colors.softYellow,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.md,
  },
  rejectBtn: {
    flex: 1,
  },
  offerBtn: {
    flex: 2,
  },
});
