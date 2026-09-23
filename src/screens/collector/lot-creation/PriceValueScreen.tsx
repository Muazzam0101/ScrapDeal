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
import { AppHeader } from '../../../components/AppHeader';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { getCategoryDisplayName } from '../../../constants/materialCategories';

interface PriceValueScreenProps {
  navigation: any;
  route: any;
}

export const PriceValueScreen: React.FC<PriceValueScreenProps> = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { categoryId, weightKg } = useCreateLot();

  const handleContinue = () => {
    navigation.navigate('DealConfirmation');
  };

  const materialName = categoryId ? getCategoryDisplayName(categoryId) : 'PCB';

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
        <Text style={styles.promptTitle}>{t('priceScreenTitle')}</Text>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={32} color={colors.primary} />
          <Text style={styles.infoTitle}>मूल्य निर्धारण (Offer-Based Pricing)</Text>
          <Text style={styles.infoText}>
            ScrapDeal में कोई कृत्रिम भाव नहीं है। आपके द्वारा लॉट बनाए जाने के बाद, अधिकृत रीसाइक्लर सामग्री ({materialName}) व वजन ({weightKg} किग्रा) के आधार पर वास्तविक ऑफर भेजेंगे।
          </Text>
        </View>
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
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  infoTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  infoText: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomBar: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
