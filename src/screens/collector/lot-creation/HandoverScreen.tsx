import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../../theme';
import { useLanguage } from '../../../context/LanguageContext';
import { useCreateLot } from '../../../context/CreateLotContext';
import { AppHeader } from '../../../components/AppHeader';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { HandoverChecklist } from '../../../components/HandoverChecklist';

interface HandoverScreenProps {
  navigation: any;
  route: any;
}

export const HandoverScreen: React.FC<HandoverScreenProps> = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { checklist, toggleChecklistItem } = useCreateLot();
  const [photoTaken, setPhotoTaken] = useState(true);

  const handleCaptureHandoverPhoto = () => {
    setPhotoTaken(true);
  };

  const handleCompleteHandover = () => {
    navigation.navigate('Payment', {
      lotId: route.params?.lotId || 'LOT-2026',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title={t('handoverTitle')}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        showNotification={false}
        showRoleSwitch={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenHeading}>{t('handoverTitle')}</Text>
        <Text style={styles.screenSub}>{t('handoverSubtitle')}</Text>

        {/* Handover Photo Capture Section */}
        <View style={styles.photoSection}>
          <View style={styles.photoFrame}>
            <Ionicons
              name={photoTaken ? 'checkmark-circle' : 'camera'}
              size={48}
              color={photoTaken ? colors.primary : colors.textMuted}
            />
            <Text style={styles.photoStatusText}>
              {photoTaken ? 'हैंडओवर फोटो सत्यापित' : 'फोटो आवश्यक'}
            </Text>
          </View>

          <SecondaryButton
            title={t('takeHandoverPhoto')}
            icon="camera-outline"
            onPress={handleCaptureHandoverPhoto}
            style={styles.photoBtn}
          />
        </View>

        {/* Interactive Checklist */}
        <Text style={styles.checklistHeading}>सत्यापन चेकलिस्ट (Checklist)</Text>
        <HandoverChecklist
          checklist={checklist}
          onToggle={toggleChecklistItem}
          labels={{
            weightVerified: t('chkWeightLogged'),
            photoCaptured: t('chkPhotoTaken'),
            locationConfirmed: t('chkLocationLogged'),
            timestampConfirmed: t('chkTimeLogged'),
          }}
        />
      </ScrollView>

      {/* Sticky Primary CTA */}
      <View style={styles.bottomBar}>
        <PrimaryButton
          title={t('completeHandoverCTA')}
          icon="shield-checkmark"
          onPress={handleCompleteHandover}
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
    color: colors.text,
    textAlign: 'center',
  },
  screenSub: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  photoSection: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.xl,
  },
  photoFrame: {
    width: 140,
    height: 100,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  photoStatusText: {
    ...typography.bodySmall,
    color: colors.primaryDark,
    fontWeight: '700',
    marginTop: 4,
  },
  photoBtn: {
    width: '100%',
  },
  checklistHeading: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  bottomBar: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
