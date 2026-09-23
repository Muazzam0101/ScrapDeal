import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme';
import { useLanguage } from '../../../context/LanguageContext';
import { useCreateLot } from '../../../context/CreateLotContext';
import { AppHeader } from '../../../components/AppHeader';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { materialRecognitionService } from '../../../services/ai/materialRecognitionService';
import { MaterialRecognitionResult, MaterialCategoryId } from '../../../types';
import { getCategoryDisplayName } from '../../../constants/materialCategories';

interface TakePhotoScreenProps {
  navigation: any;
}

export const TakePhotoScreen: React.FC<TakePhotoScreenProps> = ({ navigation }) => {
  const { t } = useLanguage();
  const {
    photoCaptured,
    setPhotoCaptured,
    photoUris,
    addPhotoUri,
    setPhotoUris,
    categoryId,
    setCategoryId,
    weightKg,
    setAiPredictionData,
  } = useCreateLot();

  const [flashOn, setFlashOn] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<(MaterialRecognitionResult & { localPredictionId?: string }) | null>(null);

  const activePhotoUri = photoUris.length > 0 ? photoUris[photoUris.length - 1] : null;

  const analyzePhoto = async (uri: string) => {
    setIsAnalyzing(true);
    try {
      const result = await materialRecognitionService.classifyScrapPhoto(uri);
      setAiResult(result);
      if (result.isAvailable && result.predictedCategory) {
        setAiPredictionData({
          predictionId: result.localPredictionId,
          predictedCategory: result.predictedCategory,
          confidence: result.confidence,
          userConfirmed: !result.requiresManualConfirmation,
        });
      }
    } catch (e) {
      console.warn('[TakePhotoScreen] AI analysis warning:', e);
      setAiResult({
        isAvailable: false,
        errorMessage: 'AI estimate unavailable: Analysis could not complete.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCameraSnap = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      let photoUri: string;
      if (!permission.granted) {
        photoUri = `file:///scrapdeal_offline_photo_${Date.now()}.jpg`;
      } else {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          photoUri = result.assets[0].uri;
        } else {
          return;
        }
      }
      addPhotoUri(photoUri);
      await analyzePhoto(photoUri);
    } catch (err) {
      console.warn('[TakePhotoScreen] Camera launch error, using fallback:', err);
      const fallbackUri = `file:///scrapdeal_offline_photo_${Date.now()}.jpg`;
      addPhotoUri(fallbackUri);
      await analyzePhoto(fallbackUri);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      let photoUri: string;
      if (!permission.granted) {
        photoUri = `file:///scrapdeal_offline_photo_${Date.now()}.jpg`;
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          photoUri = result.assets[0].uri;
        } else {
          return;
        }
      }
      addPhotoUri(photoUri);
      await analyzePhoto(photoUri);
    } catch (err) {
      console.warn('[TakePhotoScreen] Gallery launch error, using fallback:', err);
      const fallbackUri = `file:///scrapdeal_offline_photo_${Date.now()}.jpg`;
      addPhotoUri(fallbackUri);
      await analyzePhoto(fallbackUri);
    }
  };

  const handleRetake = () => {
    setPhotoUris([]);
    setPhotoCaptured(false);
    setAiResult(null);
    setAiPredictionData({
      predictionId: null,
      predictedCategory: null,
      confidence: null,
      userConfirmed: true,
    });
  };

  // Collector confirms the AI suggested material
  const handleConfirmAiMaterial = async () => {
    if (aiResult?.predictedCategory) {
      setCategoryId(aiResult.predictedCategory);
      if (aiResult.localPredictionId) {
        await materialRecognitionService.recordFeedback({
          predictionLocalId: aiResult.localPredictionId,
          finalCategory: aiResult.predictedCategory,
          userConfirmed: true,
          feedbackNotes: 'Collector confirmed AI recommendation',
        });
      }
      setAiPredictionData({
        predictionId: aiResult.localPredictionId,
        predictedCategory: aiResult.predictedCategory,
        confidence: aiResult.confidence,
        userConfirmed: true,
      });
      // Proceed directly to weight input
      navigation.navigate('WeightInput', { categoryId: aiResult.predictedCategory });
    }
  };

  // Collector changes material manually
  const handleChangeMaterial = () => {
    if (aiResult?.localPredictionId && aiResult.predictedCategory) {
      setAiPredictionData({
        predictionId: aiResult.localPredictionId,
        predictedCategory: aiResult.predictedCategory,
        confidence: aiResult.confidence,
        userConfirmed: false,
      });
    }
    navigation.navigate('MaterialCategory');
  };

  const handleContinue = () => {
    if (photoUris.length === 0) {
      const fallbackUri = `file:///scrapdeal_lot_${Date.now()}.jpg`;
      addPhotoUri(fallbackUri);
    }
    if (aiResult?.predictedCategory && !aiResult.requiresManualConfirmation) {
      handleConfirmAiMaterial();
    } else {
      navigation.navigate('MaterialCategory');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title={t('takePhotoTitle')}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        showNotification={false}
        showRoleSwitch={false}
        rightAction={
          <TouchableOpacity
            style={styles.flashButton}
            onPress={() => setFlashOn(!flashOn)}
            accessibilityLabel="Toggle Flash"
          >
            <Ionicons
              name={flashOn ? 'flash' : 'flash-outline'}
              size={20}
              color={flashOn ? colors.softYellow : colors.textSecondary}
            />
          </TouchableOpacity>
        }
      />

      <View style={styles.container}>
        {/* Large Viewfinder Frame */}
        <View style={styles.viewfinderContainer}>
          <View style={styles.viewfinder}>
            {activePhotoUri && !activePhotoUri.includes('file:///') ? (
              <Image source={{ uri: activePhotoUri }} style={styles.previewImage} resizeMode="cover" />
            ) : null}

            {/* Viewfinder Corner Markers */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Center Reticle */}
            {(!activePhotoUri || activePhotoUri.includes('file:///')) && (
              <View style={styles.reticle}>
                <MaterialCommunityIcons
                  name="camera-metering-center"
                  size={72}
                  color="rgba(255, 255, 255, 0.4)"
                />
              </View>
            )}

            {(photoCaptured || photoUris.length > 0) && (
              <View style={styles.capturedBadge}>
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                <Text style={styles.capturedText}>फोटो सुरक्षित है (Photo Saved)</Text>
              </View>
            )}
          </View>

          {/* AI Analysis Loading / Suggestion Card */}
          {isAnalyzing && (
            <View style={styles.aiLoadingBox}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.aiLoadingText}>AI विश्लेषण हो रहा है (Analyzing photo...)</Text>
            </View>
          )}

          {!isAnalyzing && aiResult?.isAvailable && aiResult.predictedCategory && (
            <View style={styles.aiCard}>
              <View style={styles.aiHeaderRow}>
                <View style={styles.aiTag}>
                  <Ionicons name="sparkles" size={14} color={colors.primaryDark} />
                  <Text style={styles.aiTagText}>AI अनुमान (AI Estimate)</Text>
                </View>
                <Text style={styles.confidenceText}>
                  विश्वास (Confidence): {Math.round((aiResult.confidence || 0) * 100)}%
                </Text>
              </View>

              <Text style={styles.suggestionTitle}>
                सुझावित सामग्री:{' '}
                <Text style={styles.suggestionHighlight}>
                  {getCategoryDisplayName(aiResult.predictedCategory)}
                </Text>
              </Text>

              {aiResult.alternatives && aiResult.alternatives.length > 0 && (
                <Text style={styles.alternativeText}>
                  संभावित विकल्प (Alternative): {getCategoryDisplayName(aiResult.alternatives[0].categoryId)} (
                  {Math.round(aiResult.alternatives[0].confidence * 100)}%)
                </Text>
              )}

              {aiResult.requiresManualConfirmation && (
                <View style={styles.confirmPrompt}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.warning} />
                  <Text style={styles.confirmPromptText}>
                    कृपया सामग्री की पुष्टि करें (Please confirm manually)
                  </Text>
                </View>
              )}

              <View style={styles.aiButtonRow}>
                <TouchableOpacity
                  style={[styles.aiConfirmBtn, shadows.sm]}
                  onPress={handleConfirmAiMaterial}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark" size={16} color={colors.card} />
                  <Text style={styles.aiConfirmBtnText}>स्वीकार करें (Confirm)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.aiChangeBtn}
                  onPress={handleChangeMaterial}
                  activeOpacity={0.8}
                >
                  <Text style={styles.aiChangeBtnText}>बदलें (Change)</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {!isAnalyzing && aiResult && !aiResult.isAvailable && (
            <View style={styles.aiUnavailableBox}>
              <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.aiUnavailableText}>
                AI सामग्री पहचान अनुपलब्ध है (AI estimate unavailable) — कृपया स्वयं सामग्री चुनें।
              </Text>
            </View>
          )}

          {!aiResult && !isAnalyzing && (
            <View style={styles.guidanceBox}>
              <Ionicons name="sparkles" size={16} color={colors.primaryDark} />
              <Text style={styles.guidanceText}>{t('takePhotoGuidance')}</Text>
            </View>
          )}
        </View>

        {/* Shutter / Controls */}
        <View style={styles.controlsContainer}>
          <View style={styles.shutterRow}>
            {/* Gallery */}
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={handlePickFromGallery}
              activeOpacity={0.7}
            >
              <Ionicons name="images-outline" size={26} color={colors.text} />
              <Text style={styles.galleryText}>{t('chooseGallery')}</Text>
            </TouchableOpacity>

            {/* Shutter Button */}
            <TouchableOpacity
              style={[styles.shutterOuter, shadows.lg]}
              onPress={handleCameraSnap}
              activeOpacity={0.8}
              accessibilityLabel="Capture Photo"
            >
              <View style={styles.shutterInner} />
            </TouchableOpacity>

            {/* Retake */}
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={handleRetake}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={24} color={colors.textSecondary} />
              <Text style={styles.retakeText}>पुनः लें</Text>
            </TouchableOpacity>
          </View>

          {/* Primary CTA */}
          <PrimaryButton
            title={t('continue')}
            icon="arrow-forward"
            onPress={handleContinue}
            style={styles.continueButton}
          />

          <Text style={styles.disclaimerText}>
            AI अनुमान उपलब्ध आंकड़ों पर आधारित हैं और बाध्यकारी नहीं हैं (Review before accepting).
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    justifyContent: 'space-between',
  },
  flashButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  viewfinder: {
    width: '100%',
    aspectRatio: 1.25,
    maxHeight: 250,
    backgroundColor: '#1E293B',
    borderRadius: borderRadius.xl,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: colors.textLight,
  },
  topLeft: {
    top: 16,
    left: 16,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 6,
  },
  topRight: {
    top: 16,
    right: 16,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 6,
  },
  bottomLeft: {
    bottom: 16,
    left: 16,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 6,
  },
  bottomRight: {
    bottom: 16,
    right: 16,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 6,
  },
  reticle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  capturedBadge: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    gap: 6,
  },
  capturedText: {
    ...typography.badge,
    color: colors.primaryDark,
    fontSize: 11,
  },
  guidanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryPale,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
    gap: 6,
  },
  guidanceText: {
    ...typography.bodyMedium,
    color: colors.primaryDark,
    fontWeight: '600',
    fontSize: 13,
  },
  aiLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  aiLoadingText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  aiCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primaryPale,
    ...shadows.sm,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryPale,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  aiTagText: {
    ...typography.badge,
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
  },
  confidenceText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 11,
  },
  suggestionTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  suggestionHighlight: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  alternativeText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  confirmPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    backgroundColor: '#FEF3C7',
    padding: 6,
    borderRadius: borderRadius.md,
  },
  confirmPromptText: {
    ...typography.caption,
    color: '#92400E',
    fontWeight: '600',
  },
  aiButtonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
  },
  aiConfirmBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  aiConfirmBtnText: {
    ...typography.button,
    color: colors.card,
    fontSize: 13,
  },
  aiChangeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiChangeBtnText: {
    ...typography.button,
    color: colors.textSecondary,
    fontSize: 13,
  },
  aiUnavailableBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    gap: 8,
  },
  aiUnavailableText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  controlsContainer: {
    gap: spacing.sm,
  },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  galleryButton: {
    alignItems: 'center',
    minWidth: 72,
  },
  galleryText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
    marginTop: 4,
  },
  shutterOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primary,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.card,
  },
  shutterInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryPale,
    borderWidth: 2,
    borderColor: colors.primaryDark,
  },
  retakeButton: {
    alignItems: 'center',
    minWidth: 72,
  },
  retakeText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  continueButton: {
    width: '100%',
  },
  disclaimerText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 10,
    marginTop: 2,
  },
});
