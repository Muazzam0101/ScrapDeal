import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Switch,
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
import { SecondaryButton } from '../../components/SecondaryButton';
import { verificationService } from '../../services/verification/verificationProvider';
import { MATERIAL_CATEGORIES } from '../../constants/materialCategories';
import { RecyclerProfile } from '../../types';

export const RecyclerProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useLanguage();
  const { switchRole: switchContextRole } = useRole();
  const { currentUser, switchRole: switchAuthRole, updateProfile } = useAuthStore();

  const recycler = (currentUser?.role === 'recycler' ? currentUser : null) as RecyclerProfile | null;

  const [cpcbInput, setCpcbInput] = useState(recycler?.cpcbRegistrationNo || '');
  const [gstinInput, setGstinInput] = useState(recycler?.gstin || '');
  const [submittingAuth, setSubmittingAuth] = useState(false);

  const handleRoleSwitch = () => {
    switchContextRole();
    switchAuthRole();
  };

  const firmName = recycler?.firmName || recycler?.businessName || 'पंजीकृत रीसाइक्लिंग केंद्र';
  const contactName = recycler?.contactName || recycler?.contactPerson || 'व्यवस्थापक';
  const phoneNumber = currentUser?.phoneNumber || '+91 98765 43211';
  const address = recycler?.facilityAddress || recycler?.address || 'औद्योगिक क्षेत्र, पुणे';
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
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title={t('recyclerProfileTitle')}
        showBack={false}
        showRoleSwitch={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
          <Text style={styles.sectionTitle}>दुकान / केंद्र स्थिति (Operating Status)</Text>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>स्क्रैप खरीद सक्रिय है (Accepting Scrap)</Text>
              <Text style={styles.toggleSub}>
                {isAvailable ? 'कबाड़ीवालों को मैचिंग में दिखाई देंगे' : 'अस्थायी रूप से बंद'}
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
          <Text style={styles.sectionTitle}>सेवा क्षेत्र दायरा (Service Area Radius)</Text>
          <Text style={styles.sectionDesc}>
            कितनी दूरी तक आप स्क्रैप खरीद या पिकअप प्रदान करते हैं:
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
              <Text style={styles.toggleLabel}>पिकअप सुविधा (Scrap Pickup Available)</Text>
              <Text style={styles.toggleSub}>
                क्या आप कबाड़ीवाले के स्थान से स्क्रैप पिकअप कर सकते हैं?
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
            वे सामग्रियां चुनें जिन्हें आप खरीदते हैं (सामग्री मैचिंग के लिए उपयोग की जाएगी):
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
          <Text style={styles.sectionTitle}>नियामक प्राधिकरण (Regulatory Authorization)</Text>
          <Text style={styles.sectionDesc}>
            {authStatus === 'verified'
              ? 'आपका व्यावसायिक व CPCB प्राधिकरण डिजिटल रूप से सत्यापित है।'
              : authStatus === 'pending'
              ? 'प्राधिकरण समीक्षा प्रक्रियाधीन है। (Authorization is under review)'
              : 'CPCB / राज्य प्रदूषण नियंत्रण बोर्ड पंजीकरण संख्या दर्ज करें:'}
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
                title={authStatus === 'pending' ? 'प्राधिकरण पुनः सबमिट करें' : 'प्राधिकरण सत्यापन हेतु सबमिट करें'}
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
            यदि आप सामान बेचना चाहते हैं तो कबाड़ीवाला मोड चुनें।
          </Text>
          <PrimaryButton
            title="कबाड़ीवाला मोड में बदलें (Switch to Collector)"
            variant="secondary"
            icon="sync"
            onPress={handleRoleSwitch}
          />
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
  firmCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  firmName: {
    ...typography.h2,
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
