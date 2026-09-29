import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../../theme';
import { useLanguage } from '../../../context/LanguageContext';
import { useCreateLot } from '../../../context/CreateLotContext';
import { useAuthStore } from '../../../store/useAuthStore';
import { dealFlowService } from '../../../services/deal/dealFlowService';
import { networkService } from '../../../services/connectivity/networkService';
import { getCategoryDisplayName } from '../../../constants/materialCategories';
import { AppHeader } from '../../../components/AppHeader';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { notificationService } from '../../../services/notification/notificationService';
import { isHazardousCategory, getSafetyProfile } from '../../../services/safety/safetyRulesEngine';

interface DealConfirmationScreenProps {
  navigation: any;
  route: any;
}

export const DealConfirmationScreen: React.FC<DealConfirmationScreenProps> = ({
  navigation,
  route,
}) => {
  const { t } = useLanguage();
  const { categoryId, weightKg, photoUris, pickupOption, setCreatedLotId } = useCreateLot();
  const { currentUser } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);

  const isOnline = networkService.isOnline();
  const activePhotoUri = photoUris.length > 0 ? photoUris[photoUris.length - 1] : null;
  const materialLabel = categoryId ? getCategoryDisplayName(categoryId) : 'PCB';

  const handleCreateLot = async () => {
    const validWeight = Number(weightKg) || 0;
    if (validWeight <= 0) {
      Alert.alert(t('errorTitle'), t('pleaseEnterValidWeight'));
      return;
    }
    const finalCategory = categoryId || 'copper';

    setSubmitting(true);
    try {
      const collectorId = currentUser?.id || 'COLLECTOR-LOCAL';
      const photosToSave = photoUris.length > 0 ? photoUris : [`file:///scrapdeal_photo_${Date.now()}.jpg`];

      // Execute Real Lot Creation via dealFlowService
      const lot = await dealFlowService.createScrapLot({
        collectorId,
        categoryId: finalCategory,
        weightKg: validWeight,
        photos: photosToSave,
        pickupOption: pickupOption || 'collector_drop',
        locationCity: (currentUser as any)?.operatingCity || (currentUser as any)?.location || 'पुणे',
        locationArea: (currentUser as any)?.operatingArea || 'महाराष्ट्र',
      });

      setCreatedLotId(lot.localId);

      // Phase 8: Safety Notification for hazardous scrap lots (e.g. Battery, CRT, PCB, Cables)
      if (isHazardousCategory(finalCategory)) {
        try {
          const profile = getSafetyProfile(finalCategory, (currentUser?.language as any) || 'hi');
          await notificationService.sendNotification({
            userId: collectorId,
            type: 'safety_warning',
            title: `Safety Notice: ${profile.title}`,
            body: profile.warningBanner,
            entityType: 'lot',
            entityId: lot.localId,
          });
        } catch (notifErr) {
          console.warn('[DealConfirmationScreen] Safety notification dispatch notice:', notifErr);
        }
      }

      setSubmitting(false);

      // Navigate to Recycler Discovery (rule-based matching)
      navigation.navigate('RecyclerMatching', { lotId: lot.localId, lot });
    } catch (e: any) {
      setSubmitting(false);
      console.error('[DealConfirmationScreen] Lot creation error:', e);
      Alert.alert(t('errorTitle'), e?.message || t('failedToLoadData'));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <AppHeader
        title={t('dealConfirmationTitle')}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        showNotification={false}
        showRoleSwitch={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenHeading}>{t('dealConfirmationTitle')}</Text>
        <Text style={styles.screenSub}>
          {t('dealConfirmationSubtitle')}
        </Text>

        {/* Phase 8: Deterministic Safety Warning for hazardous materials (Non-blocking) */}
        {isHazardousCategory(categoryId || 'other') && (
          <View style={styles.hazardWarningCard}>
            <View style={styles.hazardWarningHeader}>
              <Ionicons name="warning" size={20} color={colors.danger} />
              <Text style={styles.hazardWarningTitle}>
                {materialLabel} - Handle Carefully
              </Text>
            </View>
            <Text style={styles.hazardWarningText}>
              {getSafetyProfile(categoryId || 'other', (currentUser?.language as any) || 'hi').warningBanner}
            </Text>
          </View>
        )}

        {/* Real Summary Card */}
        <View style={styles.summaryCard}>
          {/* Material Category Row */}
          <View style={styles.detailRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#E3FCEF' }]}>
              <MaterialCommunityIcons name="chip" size={24} color="#00875A" />
            </View>
            <View style={styles.rowDetails}>
              <Text style={styles.rowLabel}>{t('materialCategory')}</Text>
              <Text style={styles.rowValue}>{materialLabel}</Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
          </View>

          {/* Weight Row */}
          <View style={styles.detailRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="scale-outline" size={24} color="#2563EB" />
            </View>
            <View style={styles.rowDetails}>
              <Text style={styles.rowLabel}>{t('weight')}</Text>
              <Text style={styles.rowValue}>{weightKg} {t('kg')}</Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
          </View>

          {/* Pickup Preference Row */}
          <View style={styles.detailRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="car-outline" size={24} color="#D97706" />
            </View>
            <View style={styles.rowDetails}>
              <Text style={styles.rowLabel}>{t('pickupOptionLabel')}</Text>
              <Text style={styles.rowValue}>
                {pickupOption === 'recycler_pickup' ? t('pickupOptionPickup') : t('pickupOptionDrop')}
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
          </View>

          {/* Photo Preview Section */}
          <View style={styles.photoContainer}>
            <Text style={styles.photoLabel}>{t('materialPhoto')}:</Text>
            {activePhotoUri ? (
              <Image source={{ uri: activePhotoUri }} style={styles.photoPreview} resizeMode="cover" />
            ) : (
              <View style={styles.noPhotoBox}>
                <Ionicons name="camera-outline" size={36} color={colors.textMuted} />
                <Text style={styles.noPhotoText}>{t('noPhotoAvailable')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Sync Mode Notification */}
        <View style={[styles.syncBadge, isOnline ? styles.syncOnline : styles.syncOffline]}>
          <Ionicons
            name={isOnline ? 'cloud-done-outline' : 'cloud-offline-outline'}
            size={20}
            color={isOnline ? '#00875A' : '#D97706'}
          />
          <Text style={[styles.syncBadgeText, { color: isOnline ? '#00875A' : '#D97706' }]}>
            {isOnline
              ? t('onlineModeNotice')
              : t('offlineModeNotice')}
          </Text>
        </View>
      </ScrollView>

      {/* Primary CTA Button */}
      <View style={styles.bottomBar}>
        <PrimaryButton
          title={submitting ? t('creatingLot') : t('createLotCTA')}
          onPress={handleCreateLot}
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
    marginBottom: spacing.xs,
  },
  screenSub: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rowDetails: {
    flex: 1,
  },
  rowLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  rowValue: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  photoContainer: {
    marginTop: spacing.md,
  },
  photoLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.lg,
    backgroundColor: '#E5E7EB',
  },
  noPhotoBox: {
    width: '100%',
    height: 120,
    borderRadius: borderRadius.lg,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  noPhotoText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  syncOnline: {
    backgroundColor: '#E3FCEF',
  },
  syncOffline: {
    backgroundColor: '#FEF3C7',
  },
  syncBadgeText: {
    ...typography.caption,
    fontWeight: '600',
    marginLeft: spacing.sm,
    flex: 1,
  },
  bottomBar: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  hazardWarningCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  hazardWarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  hazardWarningTitle: {
    ...typography.h4,
    fontSize: 14,
    color: colors.danger,
    fontWeight: '800',
  },
  hazardWarningText: {
    ...typography.caption,
    color: '#991B1B',
    fontWeight: '600',
  },
});
