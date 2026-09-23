import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../../theme';
import { useLanguage } from '../../../context/LanguageContext';
import { useCreateLot } from '../../../context/CreateLotContext';
import { useAuthStore } from '../../../store/useAuthStore';
import { useLotStore } from '../../../store/useLotStore';
import { AppHeader } from '../../../components/AppHeader';
import { PrimaryButton } from '../../../components/PrimaryButton';

interface DealConfirmationScreenProps {
  navigation: any;
  route: any;
}

export const DealConfirmationScreen: React.FC<DealConfirmationScreenProps> = ({
  navigation,
  route,
}) => {
  const { t } = useLanguage();
  const { categoryId, weightKg, ratePerKg, photoUris, pickupOption, setCreatedLotId } = useCreateLot();
  const { currentUser } = useAuthStore();
  const { createLot } = useLotStore();

  const totalCalculated = Math.round(weightKg * (ratePerKg || 280));

  const handleConfirmDeal = async () => {
    try {
      const collectorId = currentUser?.id || 'COLLECTOR-LOCAL';
      const lot = await createLot({
        collectorId,
        categoryId: categoryId || 'pcb',
        weightKg,
        photos: photoUris.length > 0 ? photoUris : [`file:///scrapdeal_photo_${Date.now()}.jpg`],
        ratePerKg: ratePerKg || 280,
        pickupOption: pickupOption || 'collector_drop',
        status: 'deal_locked',
      });

      setCreatedLotId(lot.localId);
      navigation.navigate('Handover', { lotId: lot.localId });
    } catch (e) {
      console.warn('[DealConfirmation] Error creating lot, advancing with fallback ID:', e);
      const fallbackId = `LOT-${Date.now()}`;
      setCreatedLotId(fallbackId);
      navigation.navigate('Handover', { lotId: fallbackId });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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

        {/* Deal Summary Card */}
        <View style={styles.dealCard}>
          {/* Row 1: Recycler */}
          <View style={styles.dealRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="business" size={22} color={colors.primaryDark} />
            </View>
            <View style={styles.rowDetails}>
              <Text style={styles.rowLabel}>{t('selectedRecycler')}</Text>
              <Text style={styles.rowValue}>{t('authorizedRecycler')}</Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
          </View>

          {/* Row 2: Agreed Rate */}
          <View style={styles.dealRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="pricetag" size={22} color={colors.softBlue} />
            </View>
            <View style={styles.rowDetails}>
              <Text style={styles.rowLabel}>{t('agreedRate')}</Text>
              <Text style={styles.rowValue}>₹ {ratePerKg} / {t('kg')}</Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
          </View>

          {/* Row 3: Total Amount */}
          <View style={styles.dealRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="cash" size={22} color={colors.softYellow} />
            </View>
            <View style={styles.rowDetails}>
              <Text style={styles.rowLabel}>{t('totalAmount')}</Text>
              <Text style={[styles.rowValue, styles.totalHighlight]}>
                ₹ {totalCalculated.toLocaleString('en-IN')}
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
          </View>

          {/* Row 4: Material & Weight */}
          <View style={styles.dealRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="cube" size={22} color={colors.softPurple} />
            </View>
            <View style={styles.rowDetails}>
              <Text style={styles.rowLabel}>सामग्री व वजन</Text>
              <Text style={styles.rowValue}>
                {categoryId ? t(`cat${categoryId.charAt(0).toUpperCase() + categoryId.slice(1)}` as any) : 'PCB'} • {weightKg} {t('kg')}
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
          </View>

          {/* Row 5: Location */}
          <View style={styles.dealRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="location" size={22} color={colors.softPeach} />
            </View>
            <View style={styles.rowDetails}>
              <Text style={styles.rowLabel}>{t('locationLogged')}</Text>
              <Text style={styles.rowValue}>{t('collectorLocation')}</Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
          </View>
        </View>
      </ScrollView>

      {/* Sticky Primary CTA */}
      <View style={styles.bottomBar}>
        <PrimaryButton
          title={t('confirmDealCTA')}
          icon="checkmark-done"
          onPress={handleConfirmDeal}
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
    marginBottom: spacing.lg,
  },
  dealCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    gap: spacing.sm,
  },
  dealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryUltraLight,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowDetails: {
    flex: 1,
  },
  rowLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  rowValue: {
    ...typography.h4,
    color: colors.text,
    marginTop: 2,
  },
  totalHighlight: {
    color: colors.primaryDark,
    fontWeight: '800',
    fontSize: 20,
  },
  bottomBar: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
