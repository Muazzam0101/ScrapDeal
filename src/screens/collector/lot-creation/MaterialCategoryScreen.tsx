import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../../theme';
import { useLanguage } from '../../../context/LanguageContext';
import { useCreateLot } from '../../../context/CreateLotContext';
import { AppHeader } from '../../../components/AppHeader';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { MaterialCategoryCard } from '../../../components/MaterialCategoryCard';
import { MaterialCategoryId } from '../../../types';
import { materialRecognitionService } from '../../../services/ai/materialRecognitionService';

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
  const { t } = useLanguage();
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

        {/* 3-column / 2-column responsive visual cards */}
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
