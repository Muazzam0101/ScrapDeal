import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuthStore } from '../../store/useAuthStore';
import { AppHeader } from '../../components/AppHeader';

interface CollectorHomeScreenProps {
  navigation: any;
}

export const CollectorHomeScreen: React.FC<CollectorHomeScreenProps> = ({ navigation }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuthStore();
  const userName = (currentUser as any)?.name || 'नमस्ते!';

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        location={t('collectorLocation')}
        showBack={false}
        showRoleSwitch={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Greeting Banner */}
        <View style={styles.greetingRow}>
          <View style={styles.avatarCircle}>
            <MaterialCommunityIcons name="account-hard-hat" size={32} color={colors.primary} />
          </View>
          <View style={styles.greetingTextContainer}>
            <Text style={styles.greetingTitle}>नमस्ते, {userName}!</Text>
            <Text style={styles.greetingSub}>{t('greetingCollector')}</Text>
          </View>
        </View>

        {/* HERO MAIN CTA: "सामान बेचना है" */}
        <TouchableOpacity
          style={[styles.heroCard, shadows.lg]}
          onPress={() => navigation.navigate('MaterialCategory')}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Sell scrap: Take photo and check price"
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroIconWrapper}>
              <Ionicons name="camera" size={44} color={colors.textLight} />
            </View>
          </View>

          <Text style={styles.heroTitle}>{t('sellGoodsCTA')}</Text>
          <Text style={styles.heroSubtitle}>({t('sellGoodsSub')} →)</Text>
        </TouchableOpacity>

        {/* SECONDARY FEATURE GRID (4 Visual Cards) */}
        <View style={styles.gridContainer}>
          {/* Card 1: आज का भाव (Soft Blue) */}
          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: colors.softBlueBg, borderColor: colors.softBlueLight }]}
            onPress={() => navigation.navigate('CollectorPriceBoard')}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: colors.card }]}>
              <Ionicons name="cash-outline" size={28} color={colors.softBlue} />
            </View>
            <Text style={styles.gridCardTitle}>{t('todaysRate')}</Text>
            <Text style={styles.gridCardSub}>({t('todaysRateSub')})</Text>
          </TouchableOpacity>

          {/* Card 2: पास के Recycler (Soft Amber) */}
          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: colors.softYellowBg, borderColor: colors.softYellowLight }]}
            onPress={() => navigation.navigate('RecyclerMatching', { categoryId: 'pcb', weightKg: 15 })}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: colors.card }]}>
              <Ionicons name="location-outline" size={28} color={colors.softYellow} />
            </View>
            <Text style={styles.gridCardTitle}>{t('nearbyRecyclers')}</Text>
            <Text style={styles.gridCardSub}>({t('nearbyRecyclersSub')})</Text>
          </TouchableOpacity>

          {/* Card 3: मेरी कमाई (Soft Purple) */}
          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: colors.softPurpleBg, borderColor: colors.softPurpleLight }]}
            onPress={() => navigation.navigate('CollectorEarnings')}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: colors.card }]}>
              <Ionicons name="wallet-outline" size={28} color={colors.softPurple} />
            </View>
            <Text style={styles.gridCardTitle}>{t('myEarnings')}</Text>
            <Text style={styles.gridCardSub}>({t('myEarningsSub')})</Text>
          </TouchableOpacity>

          {/* Card 4: सुरक्षा जानकारी (Soft Peach) */}
          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: colors.softPeachBg, borderColor: colors.softPeachLight }]}
            onPress={() => navigation.navigate('CollectorSafety')}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: colors.card }]}>
              <Ionicons name="shield-checkmark-outline" size={28} color={colors.softPeach} />
            </View>
            <Text style={styles.gridCardTitle}>{t('safetyInfo')}</Text>
            <Text style={styles.gridCardSub}>({t('safetyInfoSub')})</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingBottom: spacing.xxxl,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  greetingTextContainer: {
    flex: 1,
  },
  greetingTitle: {
    ...typography.h3,
    color: colors.text,
  },
  greetingSub: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: 2,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    minHeight: 180,
  },
  heroTopRow: {
    marginBottom: spacing.md,
  },
  heroIconWrapper: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    ...typography.h1,
    fontSize: 26,
    color: colors.textLight,
    fontWeight: '800',
    textAlign: 'center',
  },
  heroSubtitle: {
    ...typography.bodyLarge,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridCard: {
    width: '47.5%',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 130,
    borderWidth: 1.5,
  },
  gridIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  gridCardTitle: {
    ...typography.h4,
    color: colors.text,
    textAlign: 'center',
  },
  gridCardSub: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
});
