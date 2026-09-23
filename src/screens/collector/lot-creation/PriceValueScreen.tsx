import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme';
import { useLanguage } from '../../../context/LanguageContext';
import { useCreateLot } from '../../../context/CreateLotContext';
import { AppHeader } from '../../../components/AppHeader';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { getCategoryDisplayName } from '../../../constants/materialCategories';
import { priceEstimationService } from '../../../services/ai/priceEstimationService';
import { priceRepository } from '../../../services/sqlite/repositories/priceRepository';
import { PriceEstimationResult, MaterialPrice } from '../../../types';

interface PriceValueScreenProps {
  navigation: any;
  route: any;
}

export const PriceValueScreen: React.FC<PriceValueScreenProps> = ({ navigation }) => {
  const { t } = useLanguage();
  const { categoryId, weightKg, createdLotId } = useCreateLot();

  const [isLoading, setIsLoading] = useState(true);
  const [estimateResult, setEstimateResult] = useState<PriceEstimationResult | null>(null);
  const [activeRecyclerRates, setActiveRecyclerRates] = useState<MaterialPrice[]>([]);

  const materialName = categoryId ? getCategoryDisplayName(categoryId) : 'Material';

  useEffect(() => {
    let isMounted = true;
    async function loadPricingData() {
      if (!categoryId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Run AI price estimation regression/quantile model on real market data
        const estimate = await priceEstimationService.estimateLotPrice({
          materialCategory: categoryId,
          weightKg: weightKg || 1,
          lotId: createdLotId || undefined,
        });

        // Load active recycler rates to display separately
        const rates = await priceRepository.getPricesByMaterial(categoryId);

        if (isMounted) {
          setEstimateResult(estimate);
          setActiveRecyclerRates(rates);
        }
      } catch (err) {
        console.warn('[PriceValueScreen] Failed to load price estimate:', err);
        if (isMounted) {
          setEstimateResult({
            isAvailable: false,
            message: 'Not enough market data for AI estimate.',
          });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadPricingData();
    return () => {
      isMounted = false;
    };
  }, [categoryId, weightKg, createdLotId]);

  const handleContinue = () => {
    navigation.navigate('DealConfirmation');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title={t('priceScreenTitle')}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        showNotification={false}
        showRoleSwitch={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.promptTitle}>मूल्य निर्धारण व बाजार अनुमान</Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>बाजार डेटा और AI अनुमान लोड हो रहा है...</Text>
          </View>
        ) : (
          <>
            {/* SECTION 1: AI ESTIMATED MARKET RANGE */}
            {estimateResult?.isAvailable ? (
              <View style={[styles.aiEstimateCard, shadows.md]}>
                <View style={styles.cardHeader}>
                  <View style={styles.badgeRow}>
                    <Ionicons name="sparkles" size={16} color={colors.primaryDark} />
                    <Text style={styles.badgeText}>AI अनुमानित बाजार सीमा (AI Estimated Range)</Text>
                  </View>
                  <Text style={styles.confidenceText}>
                    AI विश्वास: {Math.round((estimateResult.confidence || 0) * 100)}%
                  </Text>
                </View>

                {/* Range Amount */}
                <View style={styles.rangeBox}>
                  <Text style={styles.rangeValue}>
                    ₹{estimateResult.estimatedMin?.toLocaleString('en-IN')} — ₹
                    {estimateResult.estimatedMax?.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.rangeAverage}>
                    अनुमानित औसत (Estimated Avg): ₹
                    {estimateResult.estimatedAverage?.toLocaleString('en-IN')}
                  </Text>
                </View>

                {/* Basis */}
                <View style={styles.basisContainer}>
                  <Text style={styles.basisHeader}>अनुमान का आधार (Based on):</Text>
                  {estimateResult.basis?.map((item, idx) => (
                    <View key={idx} style={styles.basisRow}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                      <Text style={styles.basisItem}>{item}</Text>
                    </View>
                  ))}
                  {estimateResult.lastMarketDataAt && (
                    <Text style={styles.timestampText}>
                      अंतिम अपडेट: {new Date(estimateResult.lastMarketDataAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>

                {/* Transparent Disclaimer */}
                <View style={styles.disclaimerBox}>
                  <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.disclaimerText}>
                    AI अनुमान उपलब्ध ScrapDeal बाजार व लेन-देन डेटा पर आधारित हैं और बाध्यकारी नहीं हैं।
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.unavailableCard}>
                <Ionicons name="stats-chart-outline" size={32} color={colors.textMuted} />
                <Text style={styles.unavailableTitle}>बाजार अनुमान अनुपलब्ध</Text>
                <Text style={styles.unavailableText}>
                  {estimateResult?.message || 'Not enough market data for AI estimate.'}
                </Text>
                <Text style={styles.unavailableSubtext}>
                  इस सामग्री के लिए पर्याप्त ऐतिहासिक लेन-देन दर्ज नहीं हैं। कोई कृत्रिम भाव नहीं दिखाया जा रहा है।
                </Text>
              </View>
            )}

            {/* SECTION 2: ACTUAL RECYCLER RATES & OFFERS (VISUALLY SEPARATE) */}
            <View style={styles.separatorContainer}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>वास्तविक बाजार दरें (Actual Recycler Rates)</Text>
              <View style={styles.separatorLine} />
            </View>

            <View style={styles.recyclerSection}>
              <Text style={styles.sectionHeader}>सक्रिय रीसाइक्लर दरें ({materialName})</Text>

              {activeRecyclerRates.length > 0 ? (
                activeRecyclerRates.map((rate, idx) => (
                  <View key={rate.localId || idx} style={styles.rateCard}>
                    <View style={styles.rateHeader}>
                      <Text style={styles.recyclerName}>
                        {rate.recyclerName || 'अधिकृत रीसाइक्लर'}
                      </Text>
                      {rate.locationCity && (
                        <Text style={styles.locationBadge}>{rate.locationCity}</Text>
                      )}
                    </View>
                    <View style={styles.rateBody}>
                      <Text style={styles.rateFigure}>
                        ₹{rate.ratePerKg}
                        <Text style={styles.rateUnit}> /किग्रा</Text>
                      </Text>
                      <Text style={styles.rateTotal}>
                        अनुमानित कुल ({weightKg} किग्रा): ₹{Math.round(rate.ratePerKg * (weightKg || 1))}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyRatesBox}>
                  <Ionicons name="chatbubbles-outline" size={24} color={colors.primary} />
                  <Text style={styles.emptyRatesTitle}>सीधे ऑफर प्राप्त होंगे</Text>
                  <Text style={styles.emptyRatesText}>
                    लॉट प्रकाशित होने पर रीसाइक्लर आपको सीधे वास्तविक ऑफर भेजेंगे। आप अपनी पसंद का ऑफर स्वीकार कर सकते हैं।
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <PrimaryButton
          title="लॉट सारांश देखें (View Summary) →"
          onPress={handleContinue}
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
  promptTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  loadingText: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
  },
  aiEstimateCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryPale,
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryPale,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 6,
  },
  badgeText: {
    ...typography.badge,
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
  },
  confidenceText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  rangeBox: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rangeValue: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  rangeAverage: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  basisContainer: {
    marginBottom: spacing.md,
    gap: 4,
  },
  basisHeader: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  basisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  basisItem: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  timestampText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 6,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cardAlt,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  disclaimerText: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
    fontSize: 10,
    lineHeight: 14,
  },
  unavailableCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  unavailableTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  unavailableText: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  unavailableSubtext: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    gap: spacing.sm,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  separatorText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  recyclerSection: {
    gap: spacing.md,
  },
  sectionHeader: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 15,
  },
  rateCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  rateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  recyclerName: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  locationBadge: {
    ...typography.caption,
    color: colors.textSecondary,
    backgroundColor: colors.cardAlt,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rateBody: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  rateFigure: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  rateUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  rateTotal: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  emptyRatesBox: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 6,
  },
  emptyRatesTitle: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyRatesText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomBar: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
