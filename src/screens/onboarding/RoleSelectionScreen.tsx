import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { useRole } from '../../context/RoleContext';
import { useAuthStore } from '../../store/useAuthStore';
import { LanguageSelector } from '../../components/LanguageSelector';

interface RoleSelectionScreenProps {
  navigation: any;
}

export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ navigation }) => {
  const { t } = useLanguage();
  const { setRole } = useRole();
  const { selectRoleQuick } = useAuthStore();

  const handleSelectRole = async (selectedRole: 'collector' | 'recycler') => {
    try {
      await selectRoleQuick(selectedRole);
    } catch (e) {
      console.warn('[RoleSelection] Quick profile error:', e);
    }
    setRole(selectedRole);
    if (selectedRole === 'collector') {
      navigation.replace('CollectorRoot');
    } else {
      navigation.replace('RecyclerRoot');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.brandSection}>
          <View style={styles.logoBadge}>
            <Ionicons name="sync" size={38} color={colors.card} />
          </View>
          <Text style={styles.brandTitle}>SCRAPDEAL</Text>
          <Text style={styles.brandTagline}>{t('tagline')}</Text>
        </View>

        {/* Mascot / Friendly Emblem */}
        <View style={styles.mascotCard}>
          <View style={styles.mascotCircle}>
            <MaterialCommunityIcons name="account-hard-hat" size={48} color={colors.primary} />
          </View>
          <Text style={styles.sloganText}>{t('slogan')}</Text>
        </View>

        {/* Prompt */}
        <View style={styles.promptSection}>
          <Text style={styles.promptTitle}>{t('roleTitle')}</Text>
        </View>

        {/* Two Large Role Cards */}
        <View style={styles.cardsContainer}>
          {/* Kabadiwala / Collector Card */}
          <TouchableOpacity
            style={[styles.roleCard, styles.collectorCard, shadows.md]}
            onPress={() => handleSelectRole('collector')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Kabadiwala: Sell Scrap"
          >
            <View style={[styles.roleIconCircle, { backgroundColor: colors.primary }]}>
              <Ionicons name="person" size={34} color={colors.card} />
            </View>
            <View style={styles.roleTextContainer}>
              <Text style={styles.roleTitle}>{t('kabadiwala')}</Text>
              <Text style={styles.roleSubtitle}>
                "{t('kabadiwalaSubtitle')}"
              </Text>
            </View>
            <View style={[styles.arrowCircle, { backgroundColor: colors.primaryPale }]}>
              <Ionicons name="arrow-forward" size={20} color={colors.primaryDark} />
            </View>
          </TouchableOpacity>

          {/* Recycler Card */}
          <TouchableOpacity
            style={[styles.roleCard, styles.recyclerCard, shadows.md]}
            onPress={() => handleSelectRole('recycler')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Recycler: Buy Scrap"
          >
            <View style={[styles.roleIconCircle, { backgroundColor: colors.softBlue }]}>
              <MaterialCommunityIcons name="recycle" size={36} color={colors.card} />
            </View>
            <View style={styles.roleTextContainer}>
              <Text style={styles.roleTitle}>{t('recycler')}</Text>
              <Text style={styles.roleSubtitle}>
                "{t('recyclerSubtitle')}"
              </Text>
            </View>
            <View style={[styles.arrowCircle, { backgroundColor: colors.softBlueBg }]}>
              <Ionicons name="arrow-forward" size={20} color={colors.softBlue} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Login & Signup Entry Buttons */}
        <View style={styles.authActionsContainer}>
          <TouchableOpacity
            style={styles.authPrimaryBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Ionicons name="log-in-outline" size={20} color={colors.card} />
            <Text style={styles.authPrimaryBtnText}>{t('loginWithPhone')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.authSecondaryBtn}
            onPress={() => navigation.navigate('Signup')}
            activeOpacity={0.85}
          >
            <Ionicons name="person-add-outline" size={18} color={colors.primaryDark} />
            <Text style={styles.authSecondaryBtnText}>{t('createNewAccount')}</Text>
          </TouchableOpacity>
        </View>

        {/* Language Selection */}
        <View style={styles.languageSection}>
          <Text style={styles.languageLabel}>{t('chooseLanguage')}</Text>
          <LanguageSelector />
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  brandTitle: {
    ...typography.h1,
    fontSize: 32,
    fontWeight: '900',
    color: colors.primaryDark,
    letterSpacing: 1,
  },
  brandTagline: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  mascotCard: {
    alignItems: 'center',
    backgroundColor: colors.primaryUltraLight,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.primaryPale,
    marginBottom: spacing.xl,
    width: '100%',
  },
  mascotCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  sloganText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  promptSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  promptTitle: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
  },
  cardsContainer: {
    width: '100%',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    minHeight: 96,
    borderWidth: 2,
  },
  collectorCard: {
    borderColor: colors.primary,
  },
  recyclerCard: {
    borderColor: colors.softBlueLight,
  },
  roleIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    ...typography.h3,
    color: colors.text,
  },
  roleSubtitle: {
    ...typography.bodyMedium,
    color: colors.primaryDark,
    fontWeight: '700',
    marginTop: 2,
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  authActionsContainer: {
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  authPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  authPrimaryBtnText: {
    ...typography.button,
    color: colors.card,
  },
  authSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  authSecondaryBtnText: {
    ...typography.button,
    color: colors.primaryDark,
  },
  languageSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  languageLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
