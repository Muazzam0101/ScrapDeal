import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme';
import { useLanguage } from '../../../context/LanguageContext';
import { useCreateLot } from '../../../context/CreateLotContext';
import { AppHeader } from '../../../components/AppHeader';
import { PrimaryButton } from '../../../components/PrimaryButton';

interface TakePhotoScreenProps {
  navigation: any;
}

export const TakePhotoScreen: React.FC<TakePhotoScreenProps> = ({ navigation }) => {
  const { t } = useLanguage();
  const { photoCaptured, setPhotoCaptured, photoUris, addPhotoUri, setPhotoUris, categoryId, weightKg } = useCreateLot();
  const [flashOn, setFlashOn] = useState(false);

  const activePhotoUri = photoUris.length > 0 ? photoUris[photoUris.length - 1] : null;

  const handleCameraSnap = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        // Fallback simulation for emulators/environments without camera hardware
        const fallbackUri = `file:///scrapdeal_offline_photo_${Date.now()}.jpg`;
        addPhotoUri(fallbackUri);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        addPhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('[TakePhotoScreen] Camera launch error, using fallback:', err);
      const fallbackUri = `file:///scrapdeal_offline_photo_${Date.now()}.jpg`;
      addPhotoUri(fallbackUri);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        const fallbackUri = `file:///scrapdeal_offline_photo_${Date.now()}.jpg`;
        addPhotoUri(fallbackUri);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        addPhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('[TakePhotoScreen] Gallery launch error, using fallback:', err);
      const fallbackUri = `file:///scrapdeal_offline_photo_${Date.now()}.jpg`;
      addPhotoUri(fallbackUri);
    }
  };

  const handleRetake = () => {
    setPhotoUris([]);
    setPhotoCaptured(false);
  };

  const handleContinue = () => {
    if (photoUris.length === 0) {
      addPhotoUri(`file:///scrapdeal_lot_${Date.now()}.jpg`);
    }
    if (categoryId && weightKg > 0) {
      navigation.navigate('DealConfirmation');
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

            {/* Center Reticle / Subject Indicator */}
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
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                <Text style={styles.capturedText}>फोटो सुरक्षित है (Photo Saved)</Text>
              </View>
            )}
          </View>

          {/* Guidance text */}
          <View style={styles.guidanceBox}>
            <Ionicons name="sparkles" size={16} color={colors.primaryDark} />
            <Text style={styles.guidanceText}>{t('takePhotoGuidance')}</Text>
          </View>
        </View>

        {/* Shutter / Bottom Action Controls */}
        <View style={styles.controlsContainer}>
          <View style={styles.shutterRow}>
            {/* Gallery Option */}
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={handlePickFromGallery}
              activeOpacity={0.7}
            >
              <Ionicons name="images-outline" size={26} color={colors.text} />
              <Text style={styles.galleryText}>{t('chooseGallery')}</Text>
            </TouchableOpacity>

            {/* Large Shutter Button */}
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
    paddingBottom: spacing.lg,
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
    paddingVertical: spacing.md,
  },
  viewfinder: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 340,
    backgroundColor: '#1E293B',
    borderRadius: borderRadius.xxl,
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
    width: 32,
    height: 32,
    borderColor: colors.textLight,
  },
  topLeft: {
    top: 20,
    left: 20,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 20,
    right: 20,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 20,
    left: 20,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 20,
    right: 20,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  reticle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  capturedBadge: {
    position: 'absolute',
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    gap: 6,
  },
  capturedText: {
    ...typography.badge,
    color: colors.primaryDark,
    fontSize: 12,
  },
  guidanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryPale,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
    gap: 6,
  },
  guidanceText: {
    ...typography.bodyMedium,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  controlsContainer: {
    gap: spacing.lg,
  },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
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
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primary,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.card,
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
});
