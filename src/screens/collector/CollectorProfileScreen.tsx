import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { useRole } from '../../context/RoleContext';
import { useAuthStore } from '../../store/useAuthStore';
import { AppHeader } from '../../components/AppHeader';
import { VerificationBadge } from '../../components/VerificationBadge';
import { LanguageSelector } from '../../components/LanguageSelector';
import { PrimaryButton } from '../../components/PrimaryButton';
import { verificationService } from '../../services/verification/verificationProvider';
import { userRepository } from '../../services/sqlite/repositories/userRepository';

interface CollectorProfileScreenProps {
  navigation: any;
}

export const CollectorProfileScreen: React.FC<CollectorProfileScreenProps> = ({
  navigation,
}) => {
  const { t } = useLanguage();
  const { switchRole: switchContextRole } = useRole();
  const { currentUser, switchRole: switchAuthRole, updateProfile } = useAuthStore();
  const [submittingVerification, setSubmittingVerification] = React.useState(false);

  const handleRoleSwitch = () => {
    switchContextRole();
    switchAuthRole();
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

  const displayName = (currentUser as any)?.name || 'कबाड़ी मित्र';
  const displayLocation = (currentUser as any)?.location || t('collectorLocation');
  const displayPhone = currentUser?.phoneNumber || '+91 98765 43210';
  const idStatus = currentUser?.identityVerificationStatus || 'not_started';

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title={t('tabProfile')}
        showBack={false}
        showRoleSwitch={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <MaterialCommunityIcons name="account-hard-hat" size={48} color={colors.primary} />
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userPhone}>{displayPhone}</Text>
          <Text style={styles.userLocation}>
            <Ionicons name="location-sharp" size={14} color={colors.primary} /> {displayLocation}
          </Text>

          <View style={{ marginTop: spacing.md }}>
            <VerificationBadge type="identity" status={idStatus} size="medium" />
          </View>
        </View>

        {/* Identity Verification Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>पहचान सत्यापन (Identity Verification)</Text>
          <Text style={styles.sectionDesc}>
            {idStatus === 'verified'
              ? 'आपकी पहचान डिजिटल रूप से सत्यापित है। (Identity is verified)'
              : idStatus === 'pending'
              ? 'सत्यापन अनुरोध प्रक्रियाधीन है। (Verification is under digital review)'
              : 'अधिक रीसाइक्लर्स से बेहतर मूल्य प्राप्त करने के लिए पहचान सत्यापन शुरू करें।'}
          </Text>
          {idStatus !== 'verified' && (
            <PrimaryButton
              title={
                idStatus === 'pending'
                  ? 'सत्यापन स्थिति जांचें (Check Status)'
                  : 'पहचान सत्यापन शुरू करें (Verify Identity)'
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
            यदि आप सामग्री खरीदना चाहते हैं तो रीसाइक्लर मोड में बदलें।
          </Text>
          <PrimaryButton
            title="Recycler मोड में बदलें (Switch to Recycler)"
            icon="sync"
            variant="secondary"
            onPress={handleRoleSwitch}
            style={styles.switchBtn}
          />
        </View>

        {/* Safety & Help */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>मदद व सुरक्षा (Help & Safety)</Text>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('CollectorSafety')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="shield-outline" size={22} color={colors.primary} />
              <Text style={styles.menuText}>सुरक्षा नियम व दिशानिर्देश</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuRow}>
            <View style={styles.menuLeft}>
              <Ionicons name="call-outline" size={22} color={colors.primary} />
              <Text style={styles.menuText}>हेल्पलाइन सहायता (1800-XXX-XXXX)</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
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
    paddingBottom: spacing.huge,
    gap: spacing.lg,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  avatarLarge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  userName: {
    ...typography.h2,
    color: colors.text,
  },
  userPhone: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  userLocation: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: 4,
  },
  verificationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryPale,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 6,
    marginTop: spacing.md,
  },
  verificationTagText: {
    ...typography.badge,
    color: colors.primaryDark,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
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
  switchBtn: {
    marginTop: spacing.xs,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuText: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.xs,
  },
});
