import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  colors,
  spacing,
  typography,
  borderRadius,
  rf,
  useResponsive,
  responsiveContainer,
  TAB_BAR_BOTTOM_PADDING,
} from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { useRole } from '../../context/RoleContext';
import { useAuthStore } from '../../store/useAuthStore';
import { AppHeader } from '../../components/AppHeader';
import { VerificationBadge } from '../../components/VerificationBadge';
import { LanguageSelector } from '../../components/LanguageSelector';
import { PrimaryButton } from '../../components/PrimaryButton';
import { verificationService } from '../../services/verification/verificationProvider';

interface CollectorProfileScreenProps {
  navigation: any;
}

export const CollectorProfileScreen: React.FC<CollectorProfileScreenProps> = ({
  navigation,
}) => {
  const { t } = useLanguage();
  const { switchRole: switchContextRole, setRole: setContextRole } = useRole();
  const { currentUser, switchRole: switchAuthRole, updateProfile, logout } = useAuthStore();
  const { horizontalPadding, tabBarBottomPadding } = useResponsive();
  const [submittingVerification, setSubmittingVerification] = React.useState(false);

  const handleRoleSwitch = () => {
    switchContextRole();
    switchAuthRole();
    try {
      navigation.reset({
        index: 0,
        routes: [{ name: 'RecyclerRoot' }],
      });
    } catch (e) {
      console.warn('[CollectorProfile] Navigation error:', e);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('logoutConfirmTitle'),
      t('logoutConfirmMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              setContextRole(null);
              navigation.reset({
                index: 0,
                routes: [{ name: 'RoleSelection' }],
              });
            } catch (e) {
              console.warn('[CollectorProfile] Logout error:', e);
            }
          },
        },
      ]
    );
  };

  const handleStartIdentityVerification = async () => {
    if (!currentUser) return;
    setSubmittingVerification(true);
    try {
      const res = await verificationService.initiateIdentityVerification(currentUser.id, 'collector');
      await updateProfile({
        identityVerificationStatus: res.status,
        identityVerificationProvider: res.provider,
        identityVerificationRef: res.referenceId,
        identityVerifiedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('[CollectorProfile] Verification error:', e);
    } finally {
      setSubmittingVerification(false);
    }
  };

  const displayName = (currentUser as any)?.name || t('collectorPartner');
  const displayLocation = (currentUser as any)?.location || t('collectorLocation');
  const displayPhone = currentUser?.phoneNumber || '+91 98765 43210';
  const idStatus = currentUser?.identityVerificationStatus || 'not_started';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader
        title={t('tabProfile')}
        showBack={false}
        showRoleSwitch={false}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: tabBarBottomPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={responsiveContainer}>
          {/* Profile Header Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarLarge}>
              <MaterialCommunityIcons name="account-hard-hat" size={38} color={colors.primary} />
            </View>
            <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.userPhone}>{displayPhone}</Text>
            <Text style={styles.userLocation} numberOfLines={1}>
              <Ionicons name="location-sharp" size={13} color={colors.primary} /> {displayLocation}
            </Text>

            <View style={{ marginTop: spacing.sm }}>
              <VerificationBadge type="identity" status={idStatus} size="medium" />
            </View>
          </View>

          {/* Identity Verification Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('identityVerification')}</Text>
            <Text style={styles.sectionDesc}>
              {idStatus === 'verified'
                ? t('identityVerifiedDesc')
                : idStatus === 'pending'
                ? t('identityPendingDesc')
                : t('identityStartDesc')}
            </Text>
            {idStatus !== 'verified' && (
              <PrimaryButton
                title={
                  idStatus === 'pending'
                    ? t('checkStatus')
                    : t('verifyIdentity')
                }
                variant={idStatus === 'pending' ? 'secondary' : 'primary'}
                icon="shield-checkmark-outline"
                loading={submittingVerification}
                onPress={handleStartIdentityVerification}
              />
            )}
          </View>

          {/* Language Selection Card */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('chooseLanguage')}</Text>
            <LanguageSelector />
          </View>

          {/* Role Switcher Action */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('switchRole')}</Text>
            <Text style={styles.sectionDesc}>
              {t('recyclerSwitchDesc')}
            </Text>
            <PrimaryButton
              title={t('switchToRecycler')}
              icon="sync"
              variant="secondary"
              onPress={handleRoleSwitch}
              style={styles.switchBtn}
            />
          </View>

          {/* Account Actions / Logout */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('accountActions')}</Text>
            <PrimaryButton
              title={t('logout')}
              icon="log-out-outline"
              iconPosition="left"
              variant="danger"
              onPress={handleLogout}
              style={styles.logoutBtn}
            />
          </View>

          {/* Safety & Help */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('helpAndSafety')}</Text>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('CollectorSafety')}
            >
              <View style={styles.menuLeft}>
                <Ionicons name="shield-outline" size={20} color={colors.primary} />
                <Text style={styles.menuText}>{t('safetyGuidelines')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuRow}>
              <View style={styles.menuLeft}>
                <Ionicons name="call-outline" size={20} color={colors.primary} />
                <Text style={styles.menuText}>{t('helplineSupport')} (1800-XXX-XXXX)</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
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
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.xs,
  },
  avatarLarge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  userName: {
    ...typography.h3,
    fontSize: rf(18),
    fontWeight: '700',
    color: colors.text,
  },
  userPhone: {
    ...typography.bodySmall,
    fontSize: rf(12),
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  userLocation: {
    ...typography.bodyMedium,
    fontSize: rf(13),
    color: colors.textSecondary,
    marginTop: 3,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h4,
    fontSize: rf(15),
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  sectionDesc: {
    ...typography.bodySmall,
    fontSize: rf(12),
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  switchBtn: {
    marginTop: 2,
  },
  logoutBtn: {
    marginTop: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs + 2,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuText: {
    ...typography.bodyMedium,
    fontSize: rf(13),
    color: colors.text,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 4,
  },
});

