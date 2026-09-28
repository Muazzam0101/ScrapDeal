import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { useRole } from '../../context/RoleContext';
import { useAuthStore } from '../../store/useAuthStore';
import { PrimaryButton } from '../../components/PrimaryButton';
import { LanguageSelector } from '../../components/LanguageSelector';
import { UserRole } from '../../types';

interface LoginScreenProps {
  navigation: any;
  route?: { params?: { defaultRole?: UserRole } };
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { setRole: setContextRole } = useRole();
  const { requestOtp, verifyOtp, isLoading, error: authError } = useAuthStore();

  const [selectedRole, setSelectedRole] = useState<UserRole>(
    route?.params?.defaultRole || 'collector'
  );
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSendOtp = async () => {
    setErrorMessage(null);
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage(t('invalidPhone'));
      return;
    }

    try {
      const res = await requestOtp(cleanPhone);
      setVerificationId(res.verificationId);
      // Pre-fill test OTP for rapid testing ease
      setOtpCode('123456');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMessage(null);
    if (!verificationId) {
      setErrorMessage(t('sendOtp'));
      return;
    }
    if (otpCode.length < 4) {
      setErrorMessage(t('invalidOtp'));
      return;
    }

    try {
      const user = await verifyOtp({
        verificationId,
        otpCode,
        role: selectedRole,
        name: selectedRole === 'collector' ? 'कबाड़ी मित्र' : 'Green Earth Recycling',
        businessName: selectedRole === 'recycler' ? 'Green Earth Recycling' : undefined,
      });

      setContextRole(selectedRole);

      if (selectedRole === 'collector') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'CollectorRoot' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'RecyclerRoot' }],
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'OTP verification failed');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Bar with Language Selector */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.navigate('RoleSelection')}
              accessibilityLabel="Back"
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <LanguageSelector />
          </View>

          {/* Brand Header */}
          <View style={styles.brandSection}>
            <View style={styles.logoBadge}>
              <Ionicons name="sync" size={32} color={colors.card} />
            </View>
            <Text style={styles.brandTitle}>SCRAPDEAL</Text>
            <Text style={styles.screenTitle}>{t('loginTitle')}</Text>
            <Text style={styles.screenSubtitle}>{t('loginSubtitle')}</Text>
          </View>

          {/* Role Switcher Tabs */}
          <View style={styles.roleTabsContainer}>
            <TouchableOpacity
              style={[
                styles.roleTab,
                selectedRole === 'collector' && styles.roleTabActiveCollector,
              ]}
              onPress={() => setSelectedRole('collector')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="person"
                size={18}
                color={selectedRole === 'collector' ? colors.textLight : colors.textSecondary}
              />
              <Text
                style={[
                  styles.roleTabText,
                  selectedRole === 'collector' && styles.roleTabTextActive,
                ]}
              >
                {t('kabadiwala')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleTab,
                selectedRole === 'recycler' && styles.roleTabActiveRecycler,
              ]}
              onPress={() => setSelectedRole('recycler')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="recycle"
                size={20}
                color={selectedRole === 'recycler' ? colors.textLight : colors.textSecondary}
              />
              <Text
                style={[
                  styles.roleTabText,
                  selectedRole === 'recycler' && styles.roleTabTextActive,
                ]}
              >
                {t('recycler')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Message Alert */}
          {(errorMessage || authError) && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{errorMessage || authError}</Text>
            </View>
          )}

          {/* Form Card */}
          <View style={[styles.formCard, shadows.sm]}>
            <Text style={styles.inputLabel}>{t('mobileNumber')}</Text>
            <View style={styles.phoneInputRow}>
              <View style={styles.countryCodeBadge}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="98765 43210"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                editable={!verificationId}
              />
              {verificationId && (
                <TouchableOpacity
                  style={styles.editPhoneBtn}
                  onPress={() => {
                    setVerificationId(null);
                    setOtpCode('');
                  }}
                >
                  <Ionicons name="pencil" size={16} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Test OTP Helper Banner */}
            {verificationId && (
              <View style={styles.testOtpBox}>
                <Ionicons name="information-circle" size={16} color={colors.primaryDark} />
                <Text style={styles.testOtpText}>{t('testOtpBanner')}</Text>
              </View>
            )}

            {/* OTP Input Field */}
            {verificationId && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={styles.inputLabel}>{t('enterOtp')}</Text>
                <TextInput
                  style={styles.otpInput}
                  placeholder="123456"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otpCode}
                  onChangeText={(text) => {
                    setOtpCode(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoFocus
                />
              </View>
            )}

            {/* Action Button */}
            <View style={{ marginTop: spacing.lg }}>
              {!verificationId ? (
                <PrimaryButton
                  title={t('sendOtp')}
                  icon="arrow-forward"
                  loading={isLoading}
                  onPress={handleSendOtp}
                />
              ) : (
                <PrimaryButton
                  title={t('verifyAndLogin')}
                  icon="checkmark-circle"
                  loading={isLoading}
                  onPress={handleVerifyOtp}
                />
              )}
            </View>
          </View>

          {/* Bottom Navigation Links */}
          <View style={styles.bottomLinks}>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('Signup', { defaultRole: selectedRole })}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>{t('dontHaveAccount')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.linkButton, { marginTop: spacing.sm }]}
              onPress={() => navigation.navigate('RoleSelection')}
              activeOpacity={0.7}
            >
              <Text style={styles.subLinkText}>{t('orQuickRole')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingVertical: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    ...shadows.md,
  },
  brandTitle: {
    ...typography.h2,
    fontSize: 24,
    fontWeight: '900',
    color: colors.primaryDark,
    letterSpacing: 1,
  },
  screenTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.xs,
  },
  screenSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  roleTabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.lg,
    padding: 4,
    marginBottom: spacing.lg,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  roleTabActiveCollector: {
    backgroundColor: colors.primary,
  },
  roleTabActiveRecycler: {
    backgroundColor: colors.softBlue,
  },
  roleTabText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  roleTabTextActive: {
    color: colors.textLight,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.danger,
    flex: 1,
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  countryCodeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.primaryPale,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  countryCodeText: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.bodyMedium,
    color: colors.text,
  },
  editPhoneBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  testOtpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryUltraLight,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primaryPale,
  },
  testOtpText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  otpInput: {
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 6,
  },
  bottomLinks: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  linkButton: {
    paddingVertical: spacing.xs,
  },
  linkText: {
    ...typography.bodyMedium,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  subLinkText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
