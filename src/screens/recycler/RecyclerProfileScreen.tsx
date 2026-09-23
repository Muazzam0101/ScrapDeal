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
import { AppHeader } from '../../components/AppHeader';
import { VerificationBadge } from '../../components/VerificationBadge';
import { LanguageSelector } from '../../components/LanguageSelector';
import { PrimaryButton } from '../../components/PrimaryButton';

export const RecyclerProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useLanguage();
  const { switchRole } = useRole();

  const acceptedMaterials = ['PCB', 'Wires/Cables', 'Battery', 'LCD', 'CRT', 'Motors', 'Mixed Plastic'];

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
          <Text style={styles.firmName}>Green Earth Recycling</Text>
          <VerificationBadge label="Authorized Recycler" size="small" />
          <Text style={styles.firmId}>Recycler ID: REC-PUNE-0785</Text>
        </View>

        {/* Contact Information Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('contactInfo')}</Text>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color={colors.primary} />
            <Text style={styles.infoText}>+91 98765 43210</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={18} color={colors.primary} />
            <Text style={styles.infoText}>contact@scrapdeal.in</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <Text style={styles.infoText}>MIDC, Bhosari, Pune, MH</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="compass-outline" size={18} color={colors.primary} />
            <Text style={styles.infoText}>Service Area: Pune + 50 km</Text>
          </View>
        </View>

        {/* Materials Accepted */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('materialsAccepted')}</Text>
          <View style={styles.chipsRow}>
            {acceptedMaterials.map((mat) => (
              <View key={mat} style={styles.chip}>
                <Text style={styles.chipText}>{mat}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Authorization Details (CPCB) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('authorizationDetails')}</Text>

          <View style={styles.authRow}>
            <Text style={styles.authLabel}>{t('cpcbRegNo')}:</Text>
            <Text style={styles.authValue}>CPCB/MAH/2026/01234</Text>
          </View>

          <View style={styles.authRow}>
            <Text style={styles.authLabel}>{t('validTill')}:</Text>
            <Text style={styles.authValue}>31 Dec 2028</Text>
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
            onPress={switchRole}
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
    marginBottom: spacing.md,
  },
  firmName: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 6,
  },
  firmId: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: 8,
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
    marginBottom: spacing.md,
  },
  sectionDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
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
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: colors.primaryPale,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  authRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  authLabel: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  authValue: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '700',
  },
});
