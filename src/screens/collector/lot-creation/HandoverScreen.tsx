import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius } from '../../../theme';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuthStore } from '../../../store/useAuthStore';
import { useDealStore } from '../../../store/useDealStore';
import { dealRepository } from '../../../services/sqlite/repositories/dealRepository';
import { handoverRepository } from '../../../services/sqlite/repositories/handoverRepository';
import { lotRepository } from '../../../services/sqlite/repositories/lotRepository';
import { Deal, HandoverRecord } from '../../../types';
import { AppHeader } from '../../../components/AppHeader';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';

interface HandoverScreenProps {
  navigation: any;
  route: any;
}

export const HandoverScreen: React.FC<HandoverScreenProps> = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuthStore();
  const { confirmCollectorHandover, confirmRecyclerHandover } = useDealStore();

  const lotId = route.params?.lotId;
  const dealId = route.params?.dealId;

  const isCollector = currentUser?.role === 'collector';

  const [deal, setDeal] = useState<Deal | null>(null);
  const [handover, setHandover] = useState<HandoverRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [confirmedWeight, setConfirmedWeight] = useState('');
  const [handoverPhoto, setHandoverPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [locationRecorded, setLocationRecorded] = useState(false);

  useEffect(() => {
    const loadDealAndHandover = async () => {
      setLoading(true);
      try {
        let loadedDeal: Deal | null = null;
        if (dealId) {
          loadedDeal = await dealRepository.getDealById(dealId);
        } else if (lotId) {
          loadedDeal = await dealRepository.getDealByLotId(lotId);
        }

        if (loadedDeal) {
          setDeal(loadedDeal);
          setConfirmedWeight(String(loadedDeal.agreedWeightKg));

          let loadedHo = await handoverRepository.getHandoverByDealId(loadedDeal.localId);
          if (!loadedHo) {
            // Create default handover record if missing
            loadedHo = await handoverRepository.createHandover({
              id: `HO-${Date.now()}`,
              localId: `HO-${Date.now()}`,
              dealId: loadedDeal.localId,
              lotId: loadedDeal.lotId,
              collectorId: loadedDeal.collectorId,
              recyclerId: loadedDeal.recyclerId,
              actualWeightKg: loadedDeal.agreedWeightKg,
              collectorConfirmed: false,
              recyclerConfirmed: false,
              status: 'pending',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncStatus: 'pending',
            });
          }
          setHandover(loadedHo);
          if (loadedHo.photoUri) setHandoverPhoto(loadedHo.photoUri);
          if (loadedHo.notes) setNotes(loadedHo.notes);
        }
      } catch (err) {
        console.warn('[HandoverScreen] Load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDealAndHandover();
  }, [dealId, lotId]);

  const handleCapturePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        // Fallback simulation
        const fallback = `file:///handover_photo_${Date.now()}.jpg`;
        setHandoverPhoto(fallback);
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setHandoverPhoto(res.assets[0].uri);
      }
    } catch {
      setHandoverPhoto(`file:///handover_photo_${Date.now()}.jpg`);
    }
  };

  const handleConfirmHandover = async () => {
    if (!deal) {
      Alert.alert(t('errorTitle'), t('dealNotFound'));
      return;
    }

    const weightNum = parseFloat(confirmedWeight) || deal.agreedWeightKg;
    if (weightNum <= 0) {
      Alert.alert(t('errorTitle'), t('pleaseEnterValidWeight'));
      return;
    }

    setSubmitting(true);
    try {
      if (isCollector) {
        const res = await confirmCollectorHandover({
          dealId: deal.localId,
          actualWeightKg: weightNum,
          photoUri: handoverPhoto || undefined,
          notes: notes || undefined,
        });
        setHandover(res.handover);

        if (res.transaction) {
          // Both confirmed!
          Alert.alert(
            t('handoverCompleteTitle'),
            t('handoverCompleteDesc').replace('{amount}', String(res.transaction.totalAmount)),
            [
              {
                text: t('viewPaymentCTA'),
                onPress: () => navigation.navigate('Payment', { lotId: deal.lotId, dealId: deal.localId }),
              },
            ]
          );
        } else {
          Alert.alert(
            t('collectorHandoverRecordedTitle'),
            t('collectorHandoverRecordedDesc'),
            [
              {
                text: t('goToPaymentCTA'),
                onPress: () => navigation.navigate('Payment', { lotId: deal.lotId, dealId: deal.localId }),
              },
            ]
          );
        }
      } else {
        // Recycler confirming receipt
        const res = await confirmRecyclerHandover({
          dealId: deal.localId,
          actualWeightKg: weightNum,
          photoUri: handoverPhoto || undefined,
          notes: notes || undefined,
        });
        setHandover(res.handover);

        if (res.transaction) {
          Alert.alert(
            t('handoverCompleteTitle'),
            t('handoverCompleteDesc').replace('{amount}', String(res.transaction.totalAmount)),
            [
              {
                text: t('viewTransactionsCTA'),
                onPress: () => navigation.navigate('RecyclerRoot', { screen: 'RecyclerTransactions' }),
              },
            ]
          );
        } else {
          Alert.alert(
            t('recyclerReceiptConfirmedTitle'),
            t('recyclerReceiptConfirmedDesc'),
            [
              {
                text: t('ok'),
                onPress: () => navigation.goBack(),
              },
            ]
          );
        }
      }
    } catch (e: any) {
      Alert.alert(t('errorTitle'), e?.message || t('handoverFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader title={t('handoverTitle')} showBack={true} onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('loadingHandoverDetails')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const alreadyConfirmed = isCollector ? handover?.collectorConfirmed : handover?.recyclerConfirmed;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <AppHeader
        title={t('handoverTitle')}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        showNotification={false}
        showRoleSwitch={false}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenHeading}>{t('handoverTitle')}</Text>
        <Text style={styles.screenSub}>
          {t('handoverSubtitle')}
        </Text>

        {/* Deal Summary Box */}
        {deal && (
          <View style={styles.dealSummaryCard}>
            <View style={styles.dealSummaryRow}>
              <Text style={styles.dealSummaryLabel}>{t('materialCategory')}:</Text>
              <Text style={styles.dealSummaryValue}>{deal.materialName}</Text>
            </View>
            <View style={styles.dealSummaryRow}>
              <Text style={styles.dealSummaryLabel}>{t('agreedRate')}:</Text>
              <Text style={styles.dealSummaryValue}>₹{deal.agreedRatePerKg} {t('perKg')}</Text>
            </View>
            <View style={styles.dealSummaryRow}>
              <Text style={styles.dealSummaryLabel}>{t('agreedTotalAmount')}:</Text>
              <Text style={styles.dealSummaryTotal}>₹{deal.agreedTotalAmount}</Text>
            </View>
          </View>
        )}

        {/* Verification Status Matrix */}
        <View style={styles.verificationMatrix}>
          <Text style={styles.matrixTitle}>{t('confirmationStatus')}:</Text>
          <View style={styles.matrixRow}>
            <View style={styles.matrixItem}>
              <Ionicons
                name={handover?.collectorConfirmed ? 'checkmark-circle' : 'time-outline'}
                size={22}
                color={handover?.collectorConfirmed ? '#00875A' : colors.textMuted}
              />
              <Text style={styles.matrixText}>
                {t('collectorVerified')}: {handover?.collectorConfirmed ? t('verifiedBadge') : t('pendingBadge')}
              </Text>
            </View>
            <View style={styles.matrixItem}>
              <Ionicons
                name={handover?.recyclerConfirmed ? 'checkmark-circle' : 'time-outline'}
                size={22}
                color={handover?.recyclerConfirmed ? '#00875A' : colors.textMuted}
              />
              <Text style={styles.matrixText}>
                {t('recyclerVerified')}: {handover?.recyclerConfirmed ? t('verifiedBadge') : t('pendingBadge')}
              </Text>
            </View>
          </View>
        </View>

        {/* Actual Confirmed Weight Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>{t('actualVerifiedWeight')}:</Text>
          <View style={styles.weightInputRow}>
            <TextInput
              style={styles.weightInput}
              value={confirmedWeight}
              onChangeText={setConfirmedWeight}
              keyboardType="numeric"
              placeholder="0"
            />
            <Text style={styles.unitText}>{t('kg')}</Text>
          </View>
        </View>

        {/* Handover Photo Capture */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>{t('handoverPhoto')}:</Text>
          {handoverPhoto ? (
            <View style={styles.photoPreviewWrapper}>
              <Image source={{ uri: handoverPhoto }} style={styles.photoPreview} />
              <TouchableOpacity style={styles.changePhotoBtn} onPress={handleCapturePhoto}>
                <Ionicons name="camera" size={16} color="#fff" />
                <Text style={styles.changePhotoBtnText}>{t('changePhoto')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <SecondaryButton
              title={t('takeHandoverPhoto')}
              icon="camera-outline"
              onPress={handleCapturePhoto}
            />
          )}
        </View>

        {/* Optional Notes Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>{t('optionalNotes')}:</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('notesPlaceholder')}
            multiline
          />
        </View>
      </ScrollView>

      {/* Primary Confirmation Action */}
      <View style={styles.bottomBar}>
        <PrimaryButton
          title={
            submitting
              ? t('confirming')
              : alreadyConfirmed
              ? t('alreadyConfirmed')
              : isCollector
              ? t('handOverScrapCTA')
              : t('confirmReceiptCTA')
          }
          onPress={handleConfirmHandover}
          disabled={submitting || Boolean(alreadyConfirmed)}
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
  loadingBox: {
    paddingVertical: spacing.huge,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
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
  dealSummaryCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  dealSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dealSummaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  dealSummaryValue: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  dealSummaryTotal: {
    ...typography.h3,
    color: colors.primary,
  },
  verificationMatrix: {
    backgroundColor: '#F9FAFB',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  matrixTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  matrixRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  matrixItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  matrixText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  inputSection: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  weightInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
  },
  weightInput: {
    flex: 1,
    height: 48,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  unitText: {
    ...typography.bodyBold,
    color: colors.textMuted,
  },
  photoPreviewWrapper: {
    position: 'relative',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: 160,
    backgroundColor: '#E5E7EB',
  },
  changePhotoBtn: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changePhotoBtnText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    minHeight: 60,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
  bottomBar: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
