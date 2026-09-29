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
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme';
import { useLanguage } from '../../../context/LanguageContext';
import { useCreateLot } from '../../../context/CreateLotContext';
import { AppHeader } from '../../../components/AppHeader';
import { PrimaryButton } from '../../../components/PrimaryButton';
import {
  materialRecognitionService,
  RECOGNIZABLE_CATEGORIES,
  getScrapComponentBreakdown,
} from '../../../services/ai/materialRecognitionService';
import { MaterialRecognitionResult, MaterialCategoryId } from '../../../types';
import { getCategoryDisplayName } from '../../../constants/materialCategories';

interface TakePhotoScreenProps {
  navigation: any;
  route?: any;
}

const APPLIANCE_ITEMS: Array<{ id: MaterialCategoryId; label: string; icon: string }> = [
  { id: 'tv_crt', label: 'TV (CRT)', icon: 'tv-outline' },
  { id: 'lcd_panel', label: 'LCD / Monitor', icon: 'desktop-outline' },
  { id: 'motor', label: 'Fan / Motor', icon: 'disc-outline' },
  { id: 'wires', label: 'Wires & Cables', icon: 'git-commit-outline' },
  { id: 'battery', label: 'Battery', icon: 'battery-charging-outline' },
  { id: 'pcb', label: 'Circuit Board (PCB)', icon: 'hardware-chip-outline' },
  { id: 'iron_steel', label: 'Iron / Steel', icon: 'construct-outline' },
  { id: 'copper', label: 'Pure Copper', icon: 'flash-outline' },
  { id: 'aluminium', label: 'Aluminium', icon: 'cube-outline' },
  { id: 'mixed_plastic', label: 'Plastic', icon: 'trash-outline' },
  { id: 'e_waste', label: 'AC / Fridge / Other', icon: 'snow-outline' },
];

export const TakePhotoScreen: React.FC<TakePhotoScreenProps> = ({ navigation, route }) => {
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
    setAiPredictionData,
  } = useCreateLot();

  const routeCategory = route?.params?.categoryId as MaterialCategoryId | undefined;
  const initialCategory: MaterialCategoryId = routeCategory || categoryId || 'tv_crt';
  const [selectedAppliance, setSelectedAppliance] = useState<MaterialCategoryId>(initialCategory);

  const [flashOn, setFlashOn] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<(MaterialRecognitionResult & { localPredictionId?: string }) | null>(null);

  // Compute constituent breakdown for the selected appliance
  const currentBreakdown = getScrapComponentBreakdown(selectedAppliance, selectedAppliance);

  const [selectedMaterials, setSelectedMaterials] = useState<MaterialCategoryId[]>(() => {
    if (selectedCategories && selectedCategories.length > 0) return selectedCategories;
    const initialMats = currentBreakdown.possibleScrapMaterials.map((m) => m.categoryId);
    return initialMats.length > 0 ? Array.from(new Set(initialMats)) : [initialCategory];
  });

  const activePhotoUri = photoUris.length > 0 ? photoUris[photoUris.length - 1] : null;

  const analyzePhoto = async (
    uri: string,
    options?: { base64?: string; fileName?: string },
    overrideCategory?: MaterialCategoryId
  ) => {
    setIsAnalyzing(true);
    const catToUse = overrideCategory || selectedAppliance;
    try {
      const result = await materialRecognitionService.classifyScrapPhoto(uri, {
        ...options,
        selectedCategory: catToUse,
        categoryId: catToUse,
      });
      setAiResult(result);
      if (result.isAvailable) {
        // Auto-select detected constituent materials from the object
        const detectedMats: MaterialCategoryId[] =
          result.possibleScrapMaterials && result.possibleScrapMaterials.length > 0
            ? (Array.from(new Set(result.possibleScrapMaterials.map((m) => m.categoryId))) as MaterialCategoryId[])
            : result.predictedCategory
            ? [result.predictedCategory]
            : [catToUse];

        setSelectedMaterials(detectedMats);
        setSelectedCategories(detectedMats);
        const primary = result.predictedCategory || detectedMats[0] || catToUse;
        setCategoryId(primary);

        setAiPredictionData({
          predictionId: result.localPredictionId,
          predictedCategory: primary,
          confidence: result.confidence,
          userConfirmed: true,
        });
      }
    } catch (e) {
      console.warn('[TakePhotoScreen] AI analysis warning:', e);
      const fallback = getScrapComponentBreakdown(catToUse, catToUse);
      const detectedMats = Array.from(new Set(fallback.possibleScrapMaterials.map((m) => m.categoryId))) as MaterialCategoryId[];
      setSelectedMaterials(detectedMats);
      setSelectedCategories(detectedMats);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSwitchAppliance = (newCat: MaterialCategoryId) => {
    setSelectedAppliance(newCat);
    const breakdown = getScrapComponentBreakdown(newCat, newCat);
    const detectedMats = Array.from(new Set(breakdown.possibleScrapMaterials.map((m) => m.categoryId))) as MaterialCategoryId[];
    const nextMats = detectedMats.length > 0 ? detectedMats : [newCat];
    setSelectedMaterials(nextMats);
    setSelectedCategories(nextMats);
    setCategoryId(nextMats[0] || newCat);
    if (activePhotoUri) {
      analyzePhoto(activePhotoUri, undefined, newCat);
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
      console.warn('[TakePhotoScreen] Gallery pick error, using fallback:', err);
      const fallbackUri = `file:///scrapdeal_offline_photo_${Date.now()}.jpg`;
      addPhotoUri(fallbackUri);
      await analyzePhoto(fallbackUri);
    }
  };

  const handleToggleMaterial = (mat: MaterialCategoryId) => {
    setSelectedMaterials((prev) => {
      const exists = prev.includes(mat);
      const next = exists ? prev.filter((m) => m !== mat) : [...prev, mat];
      setSelectedCategories(next);
      if (next.length > 0) {
        setCategoryId(next[0]);
      }
      return next;
    });
  };

  const handleSelectAllDetected = () => {
    const allMats = Array.from(
      new Set(currentBreakdown.possibleScrapMaterials.map((m) => m.categoryId))
    ) as MaterialCategoryId[];
    setSelectedMaterials(allMats);
    setSelectedCategories(allMats);
    if (allMats.length > 0) setCategoryId(allMats[0]);
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
    const initialMats = currentBreakdown.possibleScrapMaterials.map((m) => m.categoryId);
    const mats = initialMats.length > 0 ? Array.from(new Set(initialMats)) : [selectedAppliance];
    setSelectedMaterials(mats);
    setSelectedCategories(mats);
    setCategoryId(mats[0]);
  };

  const handleContinue = () => {
    if (photoUris.length === 0) {
      const fallbackUri = `file:///scrapdeal_lot_${Date.now()}.jpg`;
      addPhotoUri(fallbackUri);
    }
    const finalMats: MaterialCategoryId[] =
      selectedMaterials.length > 0 ? selectedMaterials : [selectedAppliance || 'iron_steel'];
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

      {photoUris.length === 0 ? (
        /* Camera Capture Viewfinder Screen */
        <View style={styles.captureContainer}>
          <View style={styles.viewfinderContainer}>
            <View style={styles.viewfinder}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              <View style={styles.reticle}>
                <Ionicons name="camera-outline" size={54} color={colors.textLight} />
              </View>

              <View style={styles.guidanceBox}>
                <Ionicons name="scan-outline" size={18} color={colors.primaryDark} />
                <Text style={styles.guidanceText}>{t('takePhotoGuidance')}</Text>
              </View>
            </View>
          </View>

          {/* Shutter / Picker Controls */}
          <View style={styles.controlsContainer}>
            <View style={styles.shutterRow}>
              <TouchableOpacity
                style={styles.galleryButton}
                onPress={handlePickFromGallery}
                activeOpacity={0.7}
              >
                <Ionicons name="images-outline" size={32} color={colors.text} />
                <Text style={styles.galleryText}>{t('chooseGallery')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shutterOuter}
                onPress={handleCameraSnap}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Capture Scrap Photo"
              >
                <View style={styles.shutterInner} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.galleryButton}
                onPress={() => {
                  const fallbackUri = `file:///scrapdeal_mock_lot_${Date.now()}.jpg`;
                  addPhotoUri(fallbackUri);
                  analyzePhoto(fallbackUri);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="color-wand-outline" size={28} color={colors.textSecondary} />
                <Text style={styles.galleryText}>Quick Demo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        /* Post Capture: Object Scrap Breakdown & Multi-Material Selection */
        <View style={styles.mainContainer}>
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Captured Photo Card with Retake Header */}
            <View style={styles.previewCard}>
              <Image source={{ uri: activePhotoUri || '' }} style={styles.previewImage} resizeMode="cover" />
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

            {/* Selected Scrap Item Header & Quick Switcher */}
            <View style={styles.itemHeaderCard}>
              <View style={styles.itemHeaderRow}>
                <View style={styles.itemBadge}>
                  <Ionicons name="cube-outline" size={16} color={colors.primaryDark} />
                  <Text style={styles.itemBadgeText}>Scrap Item</Text>
                </View>
                <Text style={styles.itemTitle}>{currentBreakdown.detectedObject}</Text>
              </View>

              <Text style={styles.itemSwitcherPrompt}>
                Tap below if this photo is a different scrap item:
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.appliancePillsRow}
              >
                {APPLIANCE_ITEMS.map((item) => {
                  const isCur = selectedAppliance === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.appliancePill, isCur && styles.appliancePillActive]}
                      onPress={() => handleSwitchAppliance(item.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={15}
                        color={isCur ? colors.card : colors.textSecondary}
                      />
                      <Text style={[styles.appliancePillText, isCur && styles.appliancePillTextActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Object Breakdown & Multi-Material Checklist */}
            <View style={styles.aiCard}>
              <View style={styles.breakdownHeader}>
                <Ionicons name="sparkles" size={18} color={colors.primary} />
                <Text style={styles.objectSubtitle}>
                  This object contains multiple scrap materials. Multi-select what is included in your lot:
                </Text>
              </View>

              {/* Multi-Select Components Breakdown List */}
              <View style={styles.componentsList}>
                {currentBreakdown.possibleScrapMaterials.map((comp) => {
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

              {/* Select All / Clear All Buttons */}
              <View style={styles.multiActionRow}>
                <TouchableOpacity
                  style={styles.miniActionButton}
                  onPress={handleSelectAllDetected}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark-done" size={14} color={colors.primary} />
                  <Text style={styles.miniActionText}>Select All</Text>
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
            </View>

            {/* All Scrap Categories (Multi-Select Grid) */}
            <View style={styles.quickSelectionCard}>
              <View style={styles.quickSelectionHeader}>
                <Text style={styles.quickSelectionTitle}>
                  All Scrap Categories ({selectedMaterials.length} selected)
                </Text>
                <Text style={styles.quickSelectionSubtitle}>
                  Multi-select any additional scrap materials in this lot:
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

            {/* Retake / Gallery Secondary Options */}
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
          </ScrollView>

          {/* Sticky Bottom Bar - ALWAYS VISIBLE, IMMEDIATE CLICK, NO TOUCH CANCELLATION */}
          <View style={styles.bottomBar}>
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
            />
          </View>
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
  mainContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
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
  previewImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
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
  itemHeaderCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryPale,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  itemBadgeText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 11,
  },
  itemTitle: {
    ...typography.bodyBold,
    color: colors.text,
    fontSize: 15,
    flex: 1,
  },
  itemSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  itemSwitcherPrompt: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 6,
    marginBottom: 4,
  },
  appliancePillsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
  },
  appliancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  appliancePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  appliancePillText: {
    ...typography.caption,
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  appliancePillTextActive: {
    color: colors.card,
    fontWeight: '700',
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 8,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginVertical: spacing.md,
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
    alignSelf: 'center',
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
  objectSubtitle: {
    ...typography.bodyBold,
    color: colors.text,
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  componentsList: {
    gap: 8,
    marginTop: 4,
  },
  componentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.cardAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.sm,
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
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    ...shadows.md,
  },
  disclaimerText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 10,
    marginTop: 2,
  },
});
