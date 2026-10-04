import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
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
} from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { useRole } from '../../context/RoleContext';
import { useAuthStore } from '../../store/useAuthStore';
import { AppHeader } from '../../components/AppHeader';
import { VerificationBadge } from '../../components/VerificationBadge';
import { LanguageSelector } from '../../components/LanguageSelector';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { verificationService } from '../../services/verification/verificationProvider';
import { MATERIAL_CATEGORIES } from '../../constants/materialCategories';
import { RecyclerProfile } from '../../types';

export const RecyclerProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useLanguage();
  const { switchRole: switchContextRole, setRole: setContextRole } = useRole();
  const { currentUser, switchRole: switchAuthRole, updateProfile, logout } = useAuthStore();
  const { horizontalPadding, tabBarBottomPadding } = useResponsive();

  const recycler = (currentUser?.role === 'recycler' ? currentUser : null) as RecyclerProfile | null;

  const [cpcbInput, setCpcbInput] = useState(recycler?.cpcbRegistrationNo || '');
  const [gstinInput, setGstinInput] = useState(recycler?.gstin || '');
  const [submittingAuth, setSubmittingAuth] = useState(false);

  const handleRoleSwitch = () => {
    switchContextRole();
    switchAuthRole();
    try {
      navigation.reset({
        index: 0,
        routes: [{ name: 'CollectorRoot' }],
      });
    } catch (e) {
      console.warn('[RecyclerProfile] Navigation error:', e);
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
              console.warn('[RecyclerProfile] Logout error:', e);
            }
          },
        },
      ]
    );
  };

  const firmName = recycler?.firmName || recycler?.businessName || t('registeredRecycler');
  const contactName = recycler?.contactName || recycler?.contactPerson || 'Manager';
  const phoneNumber = currentUser?.phoneNumber || '+91 98765 43211';
  const address = recycler?.facilityAddress || recycler?.address || 'Bhosari MIDC, Pune';
  const serviceRadius = recycler?.serviceRadiusKm || 25;
  const acceptedMaterials = recycler?.acceptedMaterials || ['copper', 'aluminum', 'pcb', 'battery'];
  const pickupAvailable = recycler?.pickupAvailable !== false;
  const isAvailable = recycler?.isAvailable !== false;

  const idStatus = recycler?.identityVerificationStatus || 'not_started';
  const authStatus = recycler?.authorizationVerificationStatus || 'not_started';

  // Toggle accepted material
  const handleToggleMaterial = async (categoryId: string) => {
    let nextMaterials: string[];
    if (acceptedMaterials.includes(categoryId)) {
      nextMaterials = acceptedMaterials.filter((m) => m !== categoryId);
    } else {
      nextMaterials = [...acceptedMaterials, categoryId];
    }
    await updateProfile({ acceptedMaterials: nextMaterials } as any);
  };

  // Change service radius
  const handleSelectRadius = async (radius: number) => {
    await updateProfile({ serviceRadiusKm: radius } as any);
  };

  // Toggle pickup
  const handleTogglePickup = async (val: boolean) => {
    await updateProfile({ pickupAvailable: val } as any);
  };

  // Toggle availability
  const handleToggleAvailable = async (val: boolean) => {
    await updateProfile({ isAvailable: val } as any);
  };

  // Submit Authorization Verification
  const handleSubmitAuthorization = async () => {
    if (!currentUser) return;
    setSubmittingAuth(true);
    try {
      const res = await verificationService.initiateAuthorizationVerification(currentUser.id, {
        cpcbRegistrationNo: cpcbInput.trim(),
        gstin: gstinInput.trim(),
        businessName: firmName,
      });
      await updateProfile({
        authorizationVerificationStatus: res.status,
        authorizationVerificationProvider: res.provider,
        authorizationVerificationRef: res.referenceId,
        authorizationVerifiedAt: new Date().toISOString(),
        cpcbRegistrationNo: cpcbInput.trim() || undefined,
        gstin: gstinInput.trim() || undefined,
      } as any);
    } catch (e) {
      console.warn('[RecyclerProfile] Authorization verification error:', e);
    } finally {
      setSubmittingAuth(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader
        title={t('recyclerProfileTitle')}
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
          {/* Recycler Firm Profile Header */}
        <View style={styles.firmCard}>
          <View style={styles.avatarCircle}>
            <MaterialCommunityIcons name="recycle" size={38} color={colors.primary} />
          </View>
          <Text style={styles.firmName}>{firmName}</Text>
          <Text style={styles.firmPhone}>{phoneNumber}</Text>

          {/* Explicit Separate Badges - NEVER MERGED */}
          <View style={styles.badgesStack}>
            <VerificationBadge type="identity" status={idStatus} size="small" />
            <VerificationBadge type="authorization" status={authStatus} size="small" />
          </View>

          <Text style={styles.firmId}>ID: {currentUser?.id || 'REC-LOCAL'}</Text>
        </View>

        {/* Operating Availability Status */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('operatingStatus')}</Text>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>{t('acceptingScrap')}</Text>
              <Text style={styles.toggleSub}>
                {isAvailable ? t('visibleToCollectors') : t('temporarilyClosed')}
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={handleToggleAvailable}
              trackColor={{ false: '#CBD5E1', true: colors.primaryLight }}
              thumbColor={isAvailable ? colors.primary : '#94A3B8'}
            />
          </View>
        </View>

        {/* Service Radius Area Settings */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('serviceAreaRadius')}</Text>
          <Text style={styles.sectionDesc}>
            {t('serviceAreaRadiusDesc')}
          </Text>
          <View style={styles.radiusRow}>
            {[5, 10, 25, 50, 100].map((r) => {
              const isSelected = serviceRadius === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.radiusBtn, isSelected && styles.radiusBtnActive]}
                  onPress={() => handleSelectRadius(r)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.radiusBtnText, isSelected && styles.radiusBtnTextActive]}>
                    {r} km
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Pickup Availability Toggle */}
        <View style={styles.sectionCard}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>{t('pickupFacility')}</Text>
              <Text style={styles.toggleSub}>
                {t('pickupFacilityDesc')}
              </Text>
            </View>
            <Switch
              value={pickupAvailable}
              onValueChange={handleTogglePickup}
              trackColor={{ false: '#CBD5E1', true: colors.primaryLight }}
              thumbColor={pickupAvailable ? colors.primary : '#94A3B8'}
            />
          </View>
        </View>

        {/* Materials Accepted */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('materialsAccepted')}</Text>
          <Text style={styles.sectionDesc}>
            {t('materialsAcceptedDesc')}
          </Text>
          <View style={styles.chipsRow}>
            {MATERIAL_CATEGORIES.map((cat) => {
              const isAccepted = acceptedMaterials.includes(cat.id);
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, isAccepted && styles.chipActive]}
                  onPress={() => handleToggleMaterial(cat.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isAccepted ? 'checkmark-circle' : 'add-circle-outline'}
                    size={16}
                    color={isAccepted ? colors.textLight : colors.textSecondary}
                  />
                  <Text style={[styles.chipText, isAccepted && styles.chipTextActive]}>
                    {cat.labelEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Regulatory Authorization Section (CPCB / GSTIN) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('regulatoryAuthorization')}</Text>
          <Text style={styles.sectionDesc}>
            {authStatus === 'verified'
              ? t('authVerifiedDesc')
              : authStatus === 'pending'
              ? t('authPendingDesc')
              : t('authNotSubmittedDesc')}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>CPCB / SPCB Registration No.</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. CPCB/MAH/2026/01234"
              value={cpcbInput}
              onChangeText={setCpcbInput}
              editable={authStatus !== 'verified'}
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.inputLabel}>GSTIN (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 27AAAAA0000A1Z5"
              value={gstinInput}
              onChangeText={setGstinInput}
              editable={authStatus !== 'verified'}
              placeholderTextColor={colors.textMuted}
            />

            {authStatus !== 'verified' && (
              <PrimaryButton
                title={authStatus === 'pending' ? t('resubmitAuth') : t('submitAuth')}
                loading={submittingAuth}
                onPress={handleSubmitAuthorization}
                style={{ marginTop: spacing.xs }}
              />
            )}
          </View>
        </View>

        {/* Contact Information Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('contactInfo')}</Text>

          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color={colors.primary} />
            <Text style={styles.infoText}>{contactName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color={colors.primary} />
            <Text style={styles.infoText}>{phoneNumber}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <Text style={styles.infoText}>{address}</Text>
          </View>
        </View>

        {/* Language Selection */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('chooseLanguage')}</Text>
          <LanguageSelector />
        </View>

        {/* Switch Role Action */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('switchRole')}</Text>
          <Text style={styles.sectionDesc}>
            {t('collectorSwitchDesc')}
          </Text>
          <PrimaryButton
            title={t('switchToCollector')}
            variant="secondary"
            icon="sync"
            onPress={handleRoleSwitch}
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
              style={{ marginTop: spacing.xs }}
            />
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
    paddingTop: spacing.md,
  },
  firmCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  firmName: {
    ...typography.h3,
    fontSize: rf(20),
    color: colors.text,
    textAlign: 'center',
  },
  firmPhone: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  badgesStack: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    marginVertical: spacing.xs,
  },
  firmId: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 6,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  toggleLabel: {
    ...typography.bodyBold,
    color: colors.text,
  },
  toggleSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  radiusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  radiusBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
  },
  radiusBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  radiusBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  radiusBtnTextActive: {
    color: colors.textLight,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.cardAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.textLight,
  },
  inputContainer: {
    gap: spacing.xs,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...typography.bodyMedium,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  infoText: {
    ...typography.bodyMedium,
    color: colors.text,
  },
});
