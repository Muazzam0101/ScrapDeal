import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme';
import { useLanguage } from '../../../context/LanguageContext';
import { useCreateLot } from '../../../context/CreateLotContext';
import { AppHeader } from '../../../components/AppHeader';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { MaterialCategoryCard } from '../../../components/MaterialCategoryCard';
import { MaterialCategoryId } from '../../../types';
import { materialRecognitionService } from '../../../services/ai/materialRecognitionService';
import { getSafetyProfile, isHazardousCategory } from '../../../services/safety/safetyRulesEngine';

interface MaterialCategoryScreenProps {
  navigation: any;
}

interface CategoryDef {
  id: MaterialCategoryId;
  titleKey: 'catPcb' | 'catWires' | 'catBattery' | 'catTvCrt' | 'catLcd' | 'catMotor' | 'catMagnet' | 'catPlastic' | 'catOther';
  icon: string;
  accent: string;
}

const CATEGORIES: CategoryDef[] = [
  { id: 'pcb', titleKey: 'catPcb', icon: 'chip', accent: '#16A34A' },
  { id: 'wires', titleKey: 'catWires', icon: 'transit-connection-variant', accent: '#0284C7' },
  { id: 'battery', titleKey: 'catBattery', icon: 'battery-high', accent: '#D97706' },
  { id: 'tv_crt', titleKey: 'catTvCrt', icon: 'television-classic', accent: '#7C3AED' },
  { id: 'lcd_panel', titleKey: 'catLcd', icon: 'monitor-screenshot', accent: '#0284C7' },
  { id: 'motor', titleKey: 'catMotor', icon: 'fan', accent: '#EA580C' },
  { id: 'magnet', titleKey: 'catMagnet', icon: 'magnet', accent: '#DC2626' },
  { id: 'mixed_plastic', titleKey: 'catPlastic', icon: 'recycle-variant', accent: '#0D9488' },
  { id: 'other', titleKey: 'catOther', icon: 'package-variant-closed', accent: '#475569' },
];

export const MaterialCategoryScreen: React.FC<MaterialCategoryScreenProps> = ({
  navigation,
}) => {
  const { t, language } = useLanguage();
  const {
    categoryId,
    setCategoryId,
    aiPredictionId,
    aiPredictedCategory,
    setAiPredictionData,
  } = useCreateLot();

  const handleSelect = async (id: MaterialCategoryId) => {
    setCategoryId(id);
    if (aiPredictionId && aiPredictedCategory && id !== aiPredictedCategory) {
      await materialRecognitionService.recordFeedback({
        predictionLocalId: aiPredictionId,
        finalCategory: id,
        userConfirmed: false,
        feedbackNotes: `Collector corrected AI prediction from ${aiPredictedCategory} to ${id}`,
      });
      setAiPredictionData({ userConfirmed: false });
    }
  };

  const handleContinue = () => {
    if (categoryId) {
      navigation.navigate('TakePhoto', { categoryId });
    }
  };

  const handleNotSure = () => {
    setCategoryId('other');
    navigation.navigate('TakePhoto', { categoryId: 'other', isNotSure: true });
  };

  // Deterministic Safety Profile check for currently selected material
  const isHazardous = categoryId ? isHazardousCategory(categoryId) : false;
  const safetyProfile = categoryId ? getSafetyProfile(categoryId, language) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <AppHeader
        title={t('materialCategoryTitle')}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        showNotification={false}
        showRoleSwitch={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.promptText}>{t('materialCategoryTitle')}</Text>

        {/* ==================================================
            "NOT SURE?" UNKNOWN MATERIAL BUTTON
            Never encourage dismantling an unknown hazardous object.
            ================================================== */}
        <TouchableOpacity
          style={[styles.notSureCard, shadows.sm]}
          onPress={handleNotSure}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Not sure about material? Tap to photograph and let AI inspect"
        >
          <View style={styles.notSureLeft}>
            <View style={styles.notSureIconBox}>
              <Ionicons name="help-circle" size={26} color="#B45309" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.notSureTitle}>{t('notSure')}</Text>
              <Text style={styles.notSureSubtitle}>{t('notSureDesc')}</Text>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={20} color="#B45309" />
        </TouchableOpacity>

        {/* ==================================================
            DETERMINISTIC HAZARD WARNING (Non-blocking)
            Shows practical action: Handle Carefully
            ================================================== */}
        {isHazardous && safetyProfile && (
          <View style={[styles.hazardBanner, shadows.sm]}>
            <View style={styles.hazardHeader}>
              <Ionicons name="warning" size={20} color={colors.danger} />
              <Text style={styles.hazardTitle}>
                {language === 'mr'
                  ? 'काळजीपूर्वक हाताळा (Handle Carefully)'
                  : language === 'hi'
                  ? 'सावधानी से संभालें (Handle Carefully)'
                  : 'Handle Carefully'}
              </Text>
            </View>
            <Text style={styles.hazardText}>{safetyProfile.warningBanner}</Text>
            <View style={styles.dontsRow}>
              {safetyProfile.dontList.slice(0, 2).map((dont, idx) => (
                <View key={idx} style={styles.dontItemRow}>
                  <Ionicons name="close-circle" size={14} color={colors.danger} />
                  <Text style={styles.dontItemText}>{dont}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 3-column responsive visual cards */}
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => (
            <View key={cat.id} style={styles.gridItem}>
              <MaterialCategoryCard
                id={cat.id}
                title={t(cat.titleKey)}
                icon={cat.icon}
                isSelected={categoryId === cat.id}
                onPress={() => handleSelect(cat.id)}
                accentColor={cat.accent}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky Bottom Action */}
      <View style={styles.bottomBar}>
        <PrimaryButton
          title={t('continue')}
          icon="arrow-forward"
          onPress={handleContinue}
          disabled={!categoryId}
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
  },
  promptText: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  notSureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    minHeight: 56, // Large touch target
  },
  notSureLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  notSureIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notSureTitle: {
    ...typography.h4,
    fontSize: 15,
    color: '#92400E',
  },
  notSureSubtitle: {
    ...typography.caption,
    color: '#78350F',
    marginTop: 2,
  },
  hazardBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  hazardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  hazardTitle: {
    ...typography.h4,
    fontSize: 14,
    color: colors.danger,
    fontWeight: '800',
  },
  hazardText: {
    ...typography.caption,
    color: '#991B1B',
    fontWeight: '700',
    marginBottom: 6,
  },
  dontsRow: {
    gap: 4,
  },
  dontItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dontItemText: {
    ...typography.caption,
    color: '#7F1D1D',
    fontSize: 11,
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  gridItem: {
    width: '33.33%',
    padding: spacing.xs,
  },
  bottomBar: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
