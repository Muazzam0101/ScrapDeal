import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { lotRepository } from '../../services/sqlite/repositories/lotRepository';
import { getCategoryDisplayName } from '../../constants/materialCategories';
import { MaterialLot } from '../../types';
import { AppHeader } from '../../components/AppHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
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
  const passedLot: MaterialLot | undefined = route.params?.lot;
  const lotId: string | undefined = route.params?.lotId || passedLot?.localId || passedLot?.id;

  const [lot, setLot] = useState<MaterialLot | null>(passedLot || null);
  const [loading, setLoading] = useState(!passedLot);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (!lot && lotId) {
      setLoading(true);
      lotRepository.getLotById(lotId).then((found) => {
        setLot(found);
        setLoading(false);
      }).catch((e) => {
        console.warn('[RecyclerLotDetails] Load error:', e);
        setLoading(false);
      });
    }
  }, [lotId]);

  const handleMakeOffer = () => {
    if (!lot) return;
    navigation.navigate('RecyclerMakeOffer', {
      lot,
      lotId: lot.localId,
      materialName: getCategoryDisplayName(lot.categoryId),
      weightKg: lot.weightKg,
    });
  };

  const handleReject = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title={t('lotDetailsTitle')} showBack={true} onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>लॉट विवरण लोड किया जा रहा है...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!lot) {
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
            title="कोई लॉट विवरण उपलब्ध नहीं है"
            description="इस लॉट का विवरण देखने के लिए सक्रिय सूची से चयन करें।"
            actionTitle="वापस सूची पर जाएँ"
            onActionPress={() => navigation.goBack()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const photos = lot.photos && lot.photos.length > 0 ? lot.photos : (lot.photoUrls || []);
  const activePhotoUri = photos[activeImageIndex];
  const materialName = getCategoryDisplayName(lot.categoryId);

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title={t('lotDetailsTitle')}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        showRoleSwitch={false}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Real Material Photos Section */}
        <View style={styles.imageContainer}>
          {activePhotoUri ? (
            <View style={styles.photoWrapper}>
              <Image source={{ uri: activePhotoUri }} style={styles.photo} resizeMode="cover" />
              {photos.length > 1 && (
                <View style={styles.pageBadge}>
                  <Text style={styles.pageBadgeText}>{activeImageIndex + 1}/{photos.length}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.noPhotoPlaceholder}>
              <MaterialCommunityIcons name="chip" size={64} color="rgba(255,255,255,0.6)" />
              <Text style={styles.noPhotoText}>कोई फोटो उपलब्ध नहीं</Text>
            </View>
          )}

          {/* Dots Indicator if multiple photos */}
          {photos.length > 1 && (
            <View style={styles.dotsRow}>
              {photos.map((_, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.dot, activeImageIndex === idx && styles.dotActive]}
                  onPress={() => setActiveImageIndex(idx)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.materialName}>{materialName}</Text>
          <Text style={styles.lotIdText}>लॉट नंबर: {lot.lotNumber || lot.localId}</Text>
        </View>

        {/* Weight & Status Badges */}
        <View style={styles.tagsRow}>
          <View style={styles.tagBadge}>
            <MaterialCommunityIcons name="weight" size={20} color={colors.primaryDark} />
            <View>
              <Text style={styles.tagValue}>{lot.weightKg} {t('kg')}</Text>
              <Text style={styles.tagLabel}>अनुमानित वजन (Weight)</Text>
            </View>
          </View>

          <View style={styles.tagBadge}>
            <Ionicons name="information-circle-outline" size={20} color={colors.softBlue} />
            <View>
              <Text style={styles.tagValue}>{lot.status.toUpperCase()}</Text>
              <Text style={styles.tagLabel}>वर्तमान स्थिति (Status)</Text>
            </View>
          </View>
        </View>

        {/* Location Section */}
        {lot.locationCity && (
          <View style={styles.locationSection}>
            <Ionicons name="location-sharp" size={20} color={colors.primary} />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationName}>
                {lot.locationCity}{lot.locationArea ? `, ${lot.locationArea}` : ''}
              </Text>
              <Text style={styles.pickupLabel}>
                पिकअप प्राथमिकता: {lot.pickupOption === 'recycler_pickup' ? 'रीसाइक्लर पिकअप' : 'कलेक्टर ड्रॉप'}
              </Text>
            </View>
          </View>
        )}

        {/* Created Timestamp */}
        <View style={styles.infoCard}>
          <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            लॉट निर्माण तिथि:{' '}
            {new Date(lot.createdAt).toLocaleDateString('hi-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action: Make Offer */}
      <View style={styles.bottomBar}>
        <SecondaryButton
          title="वापस (Back)"
          onPress={handleReject}
          style={styles.backBtn}
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
  loadingBox: {
    paddingVertical: spacing.huge,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  emptyContainer: {
    padding: spacing.lg,
  },
  imageContainer: {
    alignItems: 'center',
  },
  photoWrapper: {
    width: '100%',
    height: 220,
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  noPhotoPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#1E293B',
    borderRadius: borderRadius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPhotoText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing.xs,
  },
  pageBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  pageBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '700',
  },
  dotsRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
  titleSection: {
    marginTop: spacing.xs,
  },
  materialName: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  lotIdText: {
    ...typography.caption,
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
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  tagLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
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
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  pickupLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.md,
  },
  backBtn: {
    flex: 1,
  },
  offerBtn: {
    flex: 2,
  },
});
