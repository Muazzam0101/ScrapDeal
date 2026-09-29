import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuthStore } from '../../store/useAuthStore';
import { useLotStore } from '../../store/useLotStore';
import { offerRepository } from '../../services/sqlite/repositories/offerRepository';
import { syncQueueRepository } from '../../services/sqlite/repositories/syncQueueRepository';
import { syncEngine } from '../../services/sync/syncEngine';
import { networkService } from '../../services/connectivity/networkService';
import { AppHeader } from '../../components/AppHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { dealFlowService } from '../../services/deal/dealFlowService';

interface RecyclerMakeOfferScreenProps {
  navigation: any;
  route: any;
}

export const RecyclerMakeOfferScreen: React.FC<RecyclerMakeOfferScreenProps> = ({
  navigation,
  route,
}) => {
  const { t } = useLanguage();
  const { currentUser } = useAuthStore();
  const { updateLotStatus } = useLotStore();

  const lotId = route.params?.lotId || route.params?.lot?.localId || 'LOT-2026';
  const weightKg = route.params?.weightKg ?? (route.params?.lot?.weightKg ?? 15);
  const materialName = route.params?.materialName ?? (route.params?.lot?.categoryId?.toUpperCase() ?? 'PCB');

  const [rateText, setRateText] = useState('275');
  const [pickupOption, setPickupOption] = useState<'collector_drop' | 'recycler_pickup'>('collector_drop');
  const [comments, setComments] = useState('');

  const numericRate = parseFloat(rateText) || 0;
  const totalAmount = Math.round(numericRate * weightKg);

  const handleSendOffer = async () => {
    if (numericRate <= 0) {
      alert(t('pleaseEnterValidRate'));
      return;
    }

    const recyclerId = currentUser?.id || 'RECYCLER-GREEN-EARTH';
    const recyclerName = (currentUser as any)?.firmName || (currentUser as any)?.businessName || t('registeredRecycler');

    try {
      const offer = await dealFlowService.submitRecyclerOffer({
        lotId,
        recyclerId,
        recyclerName,
        ratePerKg: numericRate,
        totalAmount,
        pickupOption,
        comments,
      });

      navigation.navigate('RecyclerOfferStatus', {
        offerId: offer.localId,
        ratePerKg: numericRate,
        totalAmount,
      });
    } catch (e: any) {
      console.warn('[MakeOffer] Error creating offer:', e?.stack || e);
      alert(e?.message || t('errorSendingOffer'));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <AppHeader
        title={t('makeOfferTitle')}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        showRoleSwitch={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Lot Recap Header */}
        <View style={styles.lotRecapCard}>
          <View style={styles.lotRecapIcon}>
            <MaterialCommunityIcons name="chip" size={28} color={colors.primary} />
          </View>
          <View style={styles.lotRecapDetails}>
            <Text style={styles.recapTitle}>{materialName}</Text>
            <Text style={styles.recapSub}>{weightKg} kg • Pune, Maharashtra</Text>
          </View>
        </View>

        {/* Aapka Offer Input Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>{t('yourOfferLabel')}</Text>

          <View style={styles.rateInputRow}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={styles.rateInput}
              keyboardType="numeric"
              value={rateText}
              onChangeText={setRateText}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.rateUnit}>/ kg</Text>
          </View>

          {/* Auto Calculated Total */}
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>{t('autoTotalAmount')}</Text>
            <Text style={styles.totalAmount}>
              ₹ {totalAmount.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Pickup Option Radio Selection */}
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>{t('pickupChoiceLabel')}</Text>

          {/* Option 1: Collector Drop */}
          <TouchableOpacity
            style={[
              styles.radioOption,
              pickupOption === 'collector_drop' && styles.radioOptionSelected,
            ]}
            onPress={() => setPickupOption('collector_drop')}
            activeOpacity={0.8}
          >
            <Ionicons
              name={pickupOption === 'collector_drop' ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={pickupOption === 'collector_drop' ? colors.primary : colors.textMuted}
            />
            <Text style={styles.radioText}>{t('pickupCollectorDrop')}</Text>
          </TouchableOpacity>

          {/* Option 2: Recycler Pickup */}
          <TouchableOpacity
            style={[
              styles.radioOption,
              pickupOption === 'recycler_pickup' && styles.radioOptionSelected,
            ]}
            onPress={() => setPickupOption('recycler_pickup')}
            activeOpacity={0.8}
          >
            <Ionicons
              name={pickupOption === 'recycler_pickup' ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={pickupOption === 'recycler_pickup' ? colors.primary : colors.textMuted}
            />
            <Text style={styles.radioText}>{t('pickupRecyclerPickup')}</Text>
          </TouchableOpacity>
        </View>

        {/* Comments Input (Optional) */}
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>{t('commentsOptional')}</Text>
          <TextInput
            style={styles.commentsInput}
            multiline
            numberOfLines={3}
            value={comments}
            onChangeText={setComments}
            placeholder={t('notesPlaceholder')}
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </ScrollView>

      {/* Sticky Bottom Primary CTA */}
      <View style={styles.bottomBar}>
        <PrimaryButton
          title={t('sendOfferCTA')}
          icon="paper-plane-outline"
          onPress={handleSendOffer}
          disabled={numericRate <= 0}
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
    gap: spacing.lg,
  },
  lotRecapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  lotRecapIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  lotRecapDetails: {
    flex: 1,
  },
  recapTitle: {
    ...typography.h4,
    color: colors.text,
  },
  recapSub: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  formSection: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  rateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  currencyPrefix: {
    ...typography.h2,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  rateInput: {
    ...typography.h1,
    color: colors.text,
    flex: 1,
    padding: 0,
  },
  rateUnit: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  totalBox: {
    marginTop: spacing.md,
    backgroundColor: colors.primaryUltraLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  totalLabel: {
    ...typography.caption,
    color: colors.primaryDark,
  },
  totalAmount: {
    ...typography.h2,
    color: colors.primaryDark,
    fontWeight: '800',
    marginTop: 2,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  radioOptionSelected: {
    backgroundColor: colors.primaryUltraLight,
  },
  radioText: {
    ...typography.bodyMedium,
    color: colors.text,
    flex: 1,
  },
  commentsInput: {
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.bodyMedium,
    color: colors.text,
    textAlignVertical: 'top',
    minHeight: 72,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bottomBar: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
