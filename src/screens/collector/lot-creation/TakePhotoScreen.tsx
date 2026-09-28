import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme';
import { useLanguage } from '../../../context/LanguageContext';
import { useCreateLot } from '../../../context/CreateLotContext';
import { AppHeader } from '../../../components/AppHeader';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { materialRecognitionService, RECOGNIZABLE_CATEGORIES } from '../../../services/ai/materialRecognitionService';
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
    selectedCategories,
    setSelectedCategories,
    toggleCategory,
    weightKg,
    setAiPredictionData,
  } = useCreateLot();

  const [flashOn, setFlashOn] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<(MaterialRecognitionResult & { localPredictionId?: string }) | null>(null);
  const [selectedMaterials, setSelectedMaterials] = useState<MaterialCategoryId[]>(
    selectedCategories && selectedCategories.length > 0
      ? selectedCategories
      : categoryId
      ? [categoryId]
      : ['iron_steel']
  );

  const activePhotoUri = photoUris.length > 0 ? photoUris[photoUris.length - 1] : null;

  const analyzePhoto = async (uri: string, options?: { base64?: string; fileName?: string }) => {
    setIsAnalyzing(true);
    try {
      const result = await materialRecognitionService.classifyScrapPhoto(uri, options);
      setAiResult(result);
      if (result.isAvailable) {
        // Auto-select detected constituent materials from the object
        const detectedMats: MaterialCategoryId[] =
          result.possibleScrapMaterials && result.possibleScrapMaterials.length > 0
            ? (Array.from(new Set(result.possibleScrapMaterials.map((m) => m.categoryId))) as MaterialCategoryId[])
            : result.predictedCategory
            ? [result.predictedCategory]
            : ['iron_steel'];

        setSelectedMaterials(detectedMats);
        setSelectedCategories(detectedMats);
        const primary = result.predictedCategory || detectedMats[0];
        setCategoryId(primary);

        setAiPredictionData({
          predictionId: result.localPredictionId,
          predictedCategory: primary,
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
        addPhotoUri(photoUri);
        await analyzePhoto(photoUri);
      } else {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          base64: true,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          photoUri = asset.uri;
          addPhotoUri(photoUri);
          await analyzePhoto(photoUri, {
            base64: asset.base64 || undefined,
            fileName: asset.fileName || undefined,
          });
        }
      }
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
        addPhotoUri(photoUri);
        await analyzePhoto(photoUri);
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          base64: true,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          photoUri = asset.uri;
          addPhotoUri(photoUri);
          await analyzePhoto(photoUri, {
            base64: asset.base64 || undefined,
            fileName: asset.fileName || undefined,
          });
        }
      }
    } catch (err) {
      console.warn('[TakePhotoScreen] Gallery launch error, using fallback:', err);
      const fallbackUri = `file:///scrapdeal_offline_photo_${Date.now()}.jpg`;
      addPhotoUri(fallbackUri);
      await analyzePhoto(fallbackUri);
    }
  };

  const handleToggleMaterial = (catId: MaterialCategoryId) => {
    setSelectedMaterials((prev) => {
      const exists = prev.includes(catId);
      const next = exists ? prev.filter((c) => c !== catId) : [...prev, catId];
      setSelectedCategories(next);
      if (next.length > 0) {
        setCategoryId(next[0]);
      } else {
        setCategoryId(null);
      }
      return next;
    });
  };

  const handleSelectAllDetected = () => {
    if (aiResult?.possibleScrapMaterials && aiResult.possibleScrapMaterials.length > 0) {
      const allDetected = Array.from(
        new Set(aiResult.possibleScrapMaterials.map((m) => m.categoryId))
      ) as MaterialCategoryId[];
      setSelectedMaterials(allDetected);
      setSelectedCategories(allDetected);
      if (allDetected.length > 0) setCategoryId(allDetected[0]);
    }
  };

  const handleClearSelection = () => {
    setSelectedMaterials([]);
    setSelectedCategories([]);
    setCategoryId(null);
  };

  const handleRetake = () => {
    setPhotoUris([]);
    setPhotoCaptured(false);
    setAiResult(null);
    setSelectedMaterials(['iron_steel']);
    setSelectedCategories(['iron_steel']);
    setAiPredictionData({
      predictionId: null,
      predictedCategory: null,
      confidence: null,
      userConfirmed: true,
    });
  };

  const handleContinue = () => {
    if (photoUris.length === 0) {
      const fallbackUri = `file:///scrapdeal_lot_${Date.now()}.jpg`;
      addPhotoUri(fallbackUri);
    }
    const finalMats: MaterialCategoryId[] =
      selectedMaterials.length > 0 ? selectedMaterials : ['iron_steel'];
    setSelectedCategories(finalMats);
    setCategoryId(finalMats[0]);
    navigation.navigate('WeightInput', { categoryId: finalMats[0] });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
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

      {!activePhotoUri ? (
        // STATE 1: CAMERA VIEWFINDER (Ready to capture)
        <View style={styles.captureContainer}>
          <View style={styles.viewfinderContainer}>
            <View style={styles.viewfinder}>
              {/* Viewfinder Corner Markers */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              {/* Center Reticle */}
              <View style={styles.reticle}>
                <MaterialCommunityIcons
                  name="camera-metering-center"
                  size={72}
                  color="rgba(255, 255, 255, 0.4)"
                />
              </View>
            </View>

            <View style={styles.guidanceBox}>
              <Ionicons name="sparkles" size={16} color={colors.primaryDark} />
              <Text style={styles.guidanceText}>{t('takePhotoGuidance')}</Text>
            </View>
          </View>

          {/* Shutter / Bottom Controls */}
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

              {/* Spacer for symmetrical alignment */}
              <View style={{ minWidth: 72 }} />
            </View>
          </View>
        </View>
      ) : (
        // STATE 2: PHOTO CAPTURED & MATERIAL CONFIRMATION (Scrollable & fully responsive)
        <View style={{ flex: 1 }}>
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Captured Photo Preview Card */}
            <View style={styles.previewCard}>
              <Image source={{ uri: activePhotoUri }} style={styles.previewImage} resizeMode="cover" />
              <View style={styles.previewOverlay}>
                <View style={styles.capturedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  <Text style={styles.capturedText}>{t('photoSaved')}</Text>
                </View>

                <TouchableOpacity
                  style={styles.retakeIconButton}
                  onPress={handleRetake}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={16} color={colors.card} />
                  <Text style={styles.retakeIconText}>{t('retake')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* AI Analysis Loading Box */}
            {isAnalyzing && (
              <View style={styles.aiLoadingBox}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.aiLoadingText}>{t('aiAnalyzing')}</Text>
              </View>
            )}

            {/* AI Object Identification & Multi-Material Breakdown */}
            {!isAnalyzing && aiResult?.isAvailable && (
              <View style={styles.aiCard}>
                <View style={styles.aiHeaderRow}>
                  <View style={styles.aiTag}>
                    <Ionicons name="sparkles" size={14} color={colors.primaryDark} />
                    <Text style={styles.aiTagText}>Object Breakdown</Text>
                  </View>
                  <Text style={styles.confidenceText}>
                    AI CONFIDENCE: {Math.round((aiResult.confidence || 0) * 100)}%
                  </Text>
                </View>

                <Text style={styles.objectTitle}>
                  Identified Item:{' '}
                  <Text style={styles.objectHighlight}>
                    {aiResult.detectedObject ||
                      (aiResult.predictedCategory
                        ? getCategoryDisplayName(aiResult.predictedCategory)
                        : 'Recyclable Item')}
                  </Text>
                </Text>

                <Text style={styles.objectSubtitle}>
                  This object contains multiple scrap materials. Multi-select what is included in your lot:
                </Text>

                {/* Multi-Select Components Breakdown List */}
                {aiResult.possibleScrapMaterials && aiResult.possibleScrapMaterials.length > 0 && (
                  <View style={styles.componentsList}>
                    {aiResult.possibleScrapMaterials.map((comp) => {
                      const isChecked = selectedMaterials.includes(comp.categoryId);
                      return (
                        <TouchableOpacity
                          key={comp.categoryId + comp.componentName}
                          style={[styles.componentRow, isChecked && styles.componentRowActive]}
                          onPress={() => handleToggleMaterial(comp.categoryId)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={isChecked ? 'checkbox' : 'square-outline'}
                            size={22}
                            color={isChecked ? colors.primary : colors.textSecondary}
                          />
                          <View style={styles.componentInfo}>
                            <View style={styles.componentNameRow}>
                              <Text
                                style={[
                                  styles.componentMaterialName,
                                  isChecked && styles.componentMaterialNameActive,
                                ]}
                              >
                                {getCategoryDisplayName(comp.categoryId)}
                              </Text>
                              <Text style={styles.componentPartName}>• {comp.componentName}</Text>
                            </View>
                            {comp.description && (
                              <Text style={styles.componentDesc}>{comp.description}</Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                <View style={styles.multiActionRow}>
                  <TouchableOpacity
                    style={styles.miniActionButton}
                    onPress={handleSelectAllDetected}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="checkmark-done" size={14} color={colors.primary} />
                    <Text style={styles.miniActionText}>Select All Detected</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.miniActionButton}
                    onPress={handleClearSelection}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.miniActionText}>Clear All</Text>
                  </TouchableOpacity>
                </View>

                {aiResult.requiresManualConfirmation && (
                  <View style={styles.confirmPrompt}>
                    <Ionicons name="alert-circle-outline" size={16} color={colors.warning} />
                    <Text style={styles.confirmPromptText}>
                      Please confirm or adjust the materials selected above.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {!isAnalyzing && aiResult && !aiResult.isAvailable && (
              <View style={styles.aiUnavailableBox}>
                <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.aiUnavailableText}>
                  {t('aiEstimateUnavailable')}
                </Text>
              </View>
            )}

            {/* All Scrap Categories (Multi-Select Grid) */}
            <View style={styles.quickSelectionCard}>
              <View style={styles.quickSelectionHeader}>
                <Text style={styles.quickSelectionTitle}>
                  All Scrap Categories ({selectedMaterials.length} selected)
                </Text>
                <Text style={styles.quickSelectionSubtitle}>
                  Multi-select any other scrap materials in this lot:
                </Text>
              </View>
              <View style={styles.quickChipsGrid}>
                {RECOGNIZABLE_CATEGORIES.map((catId) => {
                  const isSelected = selectedMaterials.includes(catId);
                  return (
                    <TouchableOpacity
                      key={catId}
                      style={[
                        styles.quickChip,
                        isSelected && styles.quickChipActive,
                      ]}
                      onPress={() => handleToggleMaterial(catId)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isSelected ? 'checkbox' : 'square-outline'}
                        size={15}
                        color={isSelected ? colors.card : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.quickChipText,
                          isSelected && styles.quickChipTextActive,
                        ]}
                      >
                        {getCategoryDisplayName(catId)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Bottom Actions inside ScrollView to ensure full responsiveness */}
            <View style={styles.postCaptureActions}>
              <PrimaryButton
                title={
                  selectedMaterials.length === 0
                    ? 'Select At Least 1 Material'
                    : selectedMaterials.length === 1
                    ? `${t('continue')} • ${getCategoryDisplayName(selectedMaterials[0])}`
                    : `${t('continue')} • ${selectedMaterials.length} Materials (${selectedMaterials
                        .map(getCategoryDisplayName)
                        .slice(0, 2)
                        .join(', ')}${selectedMaterials.length > 2 ? '...' : ''})`
                }
                disabled={selectedMaterials.length === 0}
                icon="arrow-forward"
                onPress={handleContinue}
                style={styles.continueButton}
              />

              <View style={styles.secondaryActionsRow}>
                <TouchableOpacity
                  style={styles.textActionButton}
                  onPress={handleRetake}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera-reverse-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.textActionText}>{t('retake')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.textActionButton}
                  onPress={handlePickFromGallery}
                  activeOpacity={0.7}
                >
                  <Ionicons name="images-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.textActionText}>{t('chooseGallery')}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.disclaimerText}>
                {t('aiDisclaimer')}
              </Text>
            </View>
          </ScrollView>
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
  captureContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    justifyContent: 'space-between',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  previewCard: {
    width: '100%',
    height: 180,
    backgroundColor: '#1E293B',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.md,
  },
  previewOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  retakeIconButton: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    gap: 6,
  },
  retakeIconText: {
    ...typography.badge,
    color: colors.card,
    fontSize: 11,
    fontWeight: '700',
  },
  postCaptureActions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginVertical: 4,
  },
  textActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
  },
  textActionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
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
  objectTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 2,
  },
  objectHighlight: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  objectSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: spacing.sm,
    lineHeight: 16,
  },
  componentsList: {
    gap: 8,
    marginVertical: 4,
  },
  componentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.cardAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
  },
  componentRowActive: {
    backgroundColor: colors.primaryUltraLight,
    borderColor: colors.primary,
  },
  componentInfo: {
    flex: 1,
  },
  componentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  componentMaterialName: {
    ...typography.bodyBold,
    color: colors.text,
    fontSize: 13,
  },
  componentMaterialNameActive: {
    color: colors.primaryDark,
  },
  componentPartName: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
  componentDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  multiActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  miniActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  miniActionText: {
    ...typography.badge,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
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
  detectedFeaturesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryUltraLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: colors.primaryPale,
  },
  detectedFeaturesText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  quickSelectionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  quickSelectionHeader: {
    marginBottom: spacing.xs,
  },
  quickSelectionTitle: {
    ...typography.bodyBold,
    color: colors.text,
    fontSize: 13,
  },
  quickSelectionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  quickChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  quickChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickChipText: {
    ...typography.caption,
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  quickChipTextActive: {
    color: colors.card,
    fontWeight: '700',
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
