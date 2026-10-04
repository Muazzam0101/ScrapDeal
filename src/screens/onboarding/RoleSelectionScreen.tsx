import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  rf,
  useResponsive,
  responsiveContainer,
} from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { useRole } from '../../context/RoleContext';
import { LanguageSelector } from '../../components/LanguageSelector';

interface RoleSelectionScreenProps {
  navigation: any;
}

export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ navigation }) => {
  const { t } = useLanguage();
  const { setRole: setContextRole } = useRole();
  const { isSmall, horizontalPadding } = useResponsive();
  const [selectedRole, setSelectedRole] = React.useState<'collector' | 'recycler'>('collector');

  const handleSelectRole = (role: 'collector' | 'recycler') => {
    setSelectedRole(role);
    setContextRole(role);
  };

  const handleNavigateToLogin = (role?: 'collector' | 'recycler') => {
    const targetRole = role || selectedRole;
    setSelectedRole(targetRole);
    setContextRole(targetRole);
    navigation.navigate('Login', { defaultRole: targetRole });
  };

  const handleNavigateToSignup = (role?: 'collector' | 'recycler') => {
    const targetRole = role || selectedRole;
    setSelectedRole(targetRole);
    setContextRole(targetRole);
    navigation.navigate('Signup', { defaultRole: targetRole });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={responsiveContainer}>
          {/* Brand Header */}
          <View style={styles.brandSection}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.heroLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandTagline}>{t('tagline')}</Text>
          </View>

          {/* Slogan Banner */}
          <View style={styles.mascotBanner}>
            <View style={styles.mascotCircle}>
              <MaterialCommunityIcons name="account-hard-hat" size={20} color={colors.primary} />
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
              style={[
                styles.roleCard,
                selectedRole === 'collector'
                  ? styles.collectorCardActive
                  : styles.roleCardInactive,
                shadows.sm,
              ]}
              onPress={() => handleSelectRole('collector')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Kabadiwala: Sell Scrap"
            >
              <View style={[styles.roleIconCircle, { backgroundColor: colors.primary }]}>
                <Ionicons name="person" size={24} color={colors.card} />
              </View>
              <View style={styles.roleTextContainer}>
                <View style={styles.roleTitleRow}>
                  <Text style={styles.roleTitle} numberOfLines={1}>{t('kabadiwala')}</Text>
                  {selectedRole === 'collector' && (
                    <View style={styles.selectedBadgeCollector}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.primaryDark} />
                    </View>
                  )}
                </View>
                <Text style={styles.roleSubtitle} numberOfLines={1}>
                  "{t('kabadiwalaSubtitle')}"
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.arrowCircle, { backgroundColor: colors.primaryPale }]}
                onPress={() => handleNavigateToLogin('collector')}
                accessibilityLabel="Login as Kabadiwala"
              >
                <Ionicons name="arrow-forward" size={18} color={colors.primaryDark} />
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Recycler Card */}
            <TouchableOpacity
              style={[
                styles.roleCard,
                selectedRole === 'recycler'
                  ? styles.recyclerCardActive
                  : styles.roleCardInactive,
                shadows.sm,
              ]}
              onPress={() => handleSelectRole('recycler')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Recycler: Buy Scrap"
            >
              <View style={[styles.roleIconCircle, { backgroundColor: colors.softBlue }]}>
                <MaterialCommunityIcons name="recycle" size={26} color={colors.card} />
              </View>
              <View style={styles.roleTextContainer}>
                <View style={styles.roleTitleRow}>
                  <Text style={styles.roleTitle} numberOfLines={1}>{t('recycler')}</Text>
                  {selectedRole === 'recycler' && (
                    <View style={styles.selectedBadgeRecycler}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.softBlue} />
                    </View>
                  )}
                </View>
                <Text style={styles.roleSubtitle} numberOfLines={1}>
                  "{t('recyclerSubtitle')}"
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.arrowCircle, { backgroundColor: colors.softBlueBg }]}
                onPress={() => handleNavigateToLogin('recycler')}
                accessibilityLabel="Login as Recycler"
              >
                <Ionicons name="arrow-forward" size={18} color={colors.softBlue} />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>

          {/* Login & Signup Entry Buttons */}
          <View style={styles.authActionsContainer}>
            <TouchableOpacity
              style={styles.authPrimaryBtn}
              onPress={() => handleNavigateToLogin()}
              activeOpacity={0.85}
            >
              <Ionicons name="log-in-outline" size={20} color={colors.card} />
              <Text style={styles.authPrimaryBtnText} numberOfLines={1}>
                {t('loginWithPhone')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.authSecondaryBtn}
              onPress={() => handleNavigateToSignup()}
              activeOpacity={0.85}
            >
              <Ionicons name="person-add-outline" size={18} color={colors.primaryDark} />
              <Text style={styles.authSecondaryBtnText} numberOfLines={1}>
                {t('createNewAccount')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Language Selection */}
          <View style={styles.languageSection}>
            <Text style={styles.languageLabel}>{t('chooseLanguage')}</Text>
            <LanguageSelector />
          </View>
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
    paddingVertical: spacing.md,
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  heroLogo: {
    width: 210,
    height: 58,
    marginBottom: 2,
  },
  brandTagline: {
    ...typography.bodyMedium,
    fontSize: rf(13),
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  mascotBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryUltraLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primaryPale,
    marginVertical: spacing.sm,
    alignSelf: 'center',
    gap: spacing.xs,
  },
  mascotCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sloganText: {
    ...typography.caption,
    fontSize: rf(11),
    color: colors.primaryDark,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  promptSection: {
    width: '100%',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  promptTitle: {
    ...typography.h3,
    fontSize: rf(18),
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  cardsContainer: {
    width: '100%',
    gap: spacing.sm + 2,
    marginVertical: spacing.sm,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    minHeight: 74,
    borderWidth: 2,
  },
  collectorCardActive: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  recyclerCardActive: {
    borderColor: colors.softBlue,
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
  },
  roleCardInactive: {
    borderColor: colors.borderLight,
    borderWidth: 1.5,
    backgroundColor: colors.card,
  },
  roleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedBadgeCollector: {
    backgroundColor: colors.primaryPale,
    borderRadius: 10,
    padding: 2,
  },
  selectedBadgeRecycler: {
    backgroundColor: colors.softBlueBg,
    borderRadius: 10,
    padding: 2,
  },
  roleIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  roleTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  roleTitle: {
    ...typography.h4,
    fontSize: rf(15),
    fontWeight: '700',
    color: colors.text,
  },
  roleSubtitle: {
    ...typography.bodySmall,
    fontSize: rf(12),
    color: colors.primaryDark,
    fontWeight: '700',
    marginTop: 1,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  authActionsContainer: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  authPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    minHeight: 48,
    ...shadows.sm,
  },
  authPrimaryBtnText: {
    ...typography.button,
    fontSize: rf(15),
    color: colors.card,
    fontWeight: '700',
  },
  authSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    minHeight: 48,
  },
  authSecondaryBtnText: {
    ...typography.button,
    fontSize: rf(14),
    color: colors.primaryDark,
    fontWeight: '700',
  },
  languageSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 2,
  },
  languageLabel: {
    ...typography.caption,
    fontSize: rf(11),
    color: colors.textMuted,
    fontWeight: '600',
  },
});

