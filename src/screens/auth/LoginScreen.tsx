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
  const { horizontalPadding } = useResponsive();

  const [selectedRole, setSelectedRole] = useState<UserRole>(
    route?.params?.defaultRole || 'collector'
  );
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [formattedPhone, setFormattedPhone] = useState<string>('');
  const [deliveryMethod, setDeliveryMethod] = useState<'firebase_sms' | 'gateway_sms' | null>(null);
  const [simulatedSmsCode, setSimulatedSmsCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 30s resend countdown timer
  React.useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

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
      setFormattedPhone(res.formattedPhone || `+91 ${cleanPhone.slice(-10)}`);
      setDeliveryMethod(res.deliveryMethod);
      setSimulatedSmsCode(res.simulatedSmsCode || null);
      setOtpCode(''); // Empty for real user input
      setCountdown(30);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send OTP');
    }
  };

  const handleResetPhone = () => {
    setVerificationId(null);
    setOtpCode('');
    setSimulatedSmsCode(null);
    setDeliveryMethod(null);
    setCountdown(0);
    setErrorMessage(null);
  };

  const handleVerifyOtp = async () => {
    setErrorMessage(null);
    if (!verificationId) {
      setErrorMessage(t('sendOtp'));
      return;
    }
    const cleanOtp = otpCode.trim();
    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setErrorMessage(t('invalidOtp'));
      return;
    }

    try {
      const user = await verifyOtp({
        verificationId,
        otpCode: cleanOtp,
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
      setErrorMessage(err.message || t('incorrectOtp'));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: horizontalPadding },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={responsiveContainer}>
            {/* Top Bar with Language Selector */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.navigate('RoleSelection')}
              accessibilityLabel="Back"
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <LanguageSelector compact />
          </View>

          {/* Brand Header */}
          <View style={styles.brandSection}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
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
                numberOfLines={1}
              >
                {t('roleTabCollector')}
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
                numberOfLines={1}
              >
                {t('roleTabRecycler')}
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
            {!verificationId ? (
              <>
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
                  />
                </View>

                {/* Send OTP Button */}
                <View style={{ marginTop: spacing.lg }}>
                  <PrimaryButton
                    title={t('sendOtp')}
                    icon="arrow-forward"
                    loading={isLoading}
                    onPress={handleSendOtp}
                  />
                </View>
              </>
            ) : (
              <>
                {/* Destination Phone Card */}
                <View style={styles.phoneVerifiedBanner}>
                  <View style={styles.phoneVerifiedInfo}>
                    <Ionicons name="phone-portrait-outline" size={20} color={colors.primaryDark} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.phoneVerifiedLabel}>
                        {t('otpSentToPhone', { phone: formattedPhone || `+91 ${phoneNumber}` })}
                      </Text>
                      <Text style={styles.phoneVerifiedHint}>
                        {deliveryMethod === 'firebase_sms'
                          ? t('smsGatewayNotice')
                          : 'SMS verification code sent. (Valid for 5 mins)'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.changePhoneBtn} onPress={handleResetPhone}>
                    <Text style={styles.changePhoneText}>{t('changePhone')}</Text>
                  </TouchableOpacity>
                </View>

                {/* Dynamic SMS Notification Banner */}
                {deliveryMethod === 'gateway_sms' && simulatedSmsCode && (
                  <View style={styles.incomingSmsBanner}>
                    <View style={styles.incomingSmsHeader}>
                      <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primaryDark} />
                      <Text style={styles.incomingSmsTitle}>SMS Notification</Text>
                      <View style={styles.incomingSmsBadge}>
                        <Text style={styles.incomingSmsBadgeText}>Dynamic OTP</Text>
                      </View>
                    </View>
                    <Text style={styles.incomingSmsBody}>
                      Your ScrapDeal verification code is{' '}
                      <Text style={styles.incomingSmsCode}>{simulatedSmsCode}</Text>. Valid for 5 minutes.
                    </Text>
                  </View>
                )}

                {/* OTP Input Field */}
                <View style={{ marginTop: spacing.md }}>
                  <Text style={styles.inputLabel}>{t('enterOtp')}</Text>
                  <TextInput
                    style={styles.otpInput}
                    placeholder="• • • • • •"
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

                {/* Resend OTP Row */}
                <View style={styles.resendRow}>
                  {countdown > 0 ? (
                    <Text style={styles.resendTimerText}>
                      {t('resendOtpIn', { seconds: countdown })}
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleSendOtp} disabled={isLoading}>
                      <Text style={styles.resendActiveText}>{t('resendOtp')}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Verify & Login Action Button */}
                <View style={{ marginTop: spacing.md }}>
                  <PrimaryButton
                    title={t('verifyAndLogin')}
                    icon="checkmark-circle"
                    loading={isLoading}
                    onPress={handleVerifyOtp}
                  />
                </View>
              </>
            )}
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
    marginBottom: spacing.md,
  },
  brandLogo: {
    width: 200,
    height: 56,
    marginBottom: spacing.xs,
  },
  screenTitle: {
    ...typography.h3,
    fontSize: rf(16.5),
    color: colors.text,
    marginTop: 2,
    textAlign: 'center',
  },
  screenSubtitle: {
    ...typography.bodySmall,
    fontSize: rf(12),
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  roleTabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.xl,
    padding: 4,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: 8,
  },
  roleTabActiveCollector: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  roleTabActiveRecycler: {
    backgroundColor: colors.softBlue,
    ...shadows.sm,
  },
  roleTabText: {
    fontSize: rf(13.5),
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'none',
  },
  roleTabTextActive: {
    color: colors.textLight,
    fontWeight: '800',
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
    fontSize: rf(12),
    color: colors.danger,
    flex: 1,
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
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
  phoneVerifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryUltraLight,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primaryPale,
    marginBottom: spacing.xs,
  },
  phoneVerifiedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  phoneVerifiedLabel: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  phoneVerifiedHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  changePhoneBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginLeft: spacing.sm,
  },
  changePhoneText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  incomingSmsBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  incomingSmsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  incomingSmsTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: '#166534',
    flex: 1,
  },
  incomingSmsBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  incomingSmsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  incomingSmsBody: {
    ...typography.caption,
    color: '#14532D',
  },
  incomingSmsCode: {
    fontWeight: '800',
    fontSize: 15,
    color: '#166534',
    letterSpacing: 2,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  resendTimerText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  resendActiveText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
    textDecorationLine: 'underline',
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
