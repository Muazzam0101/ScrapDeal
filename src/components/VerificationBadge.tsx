import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme';
import { VerificationStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface VerificationBadgeProps {
  status?: VerificationStatus;
  type?: 'identity' | 'authorization' | 'custom';
  label?: string;
  size?: 'small' | 'medium';
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  status = 'pending',
  type = 'identity',
  label,
  size = 'small',
}) => {
  const { t } = useLanguage();
  const isSmall = size === 'small';

  // Determine label if not explicitly provided
  let badgeLabel = label;
  if (!badgeLabel) {
    if (type === 'identity') {
      switch (status) {
        case 'verified':
          badgeLabel = t('identityVerifiedBadge');
          break;
        case 'pending':
          badgeLabel = t('verificationPendingBadge');
          break;
        case 'failed':
          badgeLabel = t('verificationFailedBadge');
          break;
        case 'expired':
          badgeLabel = t('verificationExpiredBadge');
          break;
        case 'not_started':
        default:
          badgeLabel = t('notVerifiedBadge');
          break;
      }
    } else if (type === 'authorization') {
      switch (status) {
        case 'verified':
          badgeLabel = t('authVerifiedBadge');
          break;
        case 'pending':
          badgeLabel = t('authPendingBadge');
          break;
        case 'failed':
          badgeLabel = t('authRejectedBadge');
          break;
        case 'expired':
          badgeLabel = t('licenseExpiredBadge');
          break;
        case 'not_started':
        default:
          badgeLabel = t('noAuthBadge');
          break;
      }
    } else {
      badgeLabel = t('status');
    }
  }

  // Determine styling based on verification status
  let bgColor = '#F1F5F9';
  let textColor = '#64748B';
  let iconName: any = 'help-circle-outline';
  let iconColor = '#64748B';

  if (status === 'verified') {
    bgColor = colors.primaryPale;
    textColor = colors.primaryDark;
    iconName = 'shield-checkmark';
    iconColor = colors.primary;
  } else if (status === 'pending') {
    bgColor = '#FEF3C7';
    textColor = '#B45309';
    iconName = 'time-outline';
    iconColor = '#D97706';
  } else if (status === 'failed') {
    bgColor = '#FEE2E2';
    textColor = '#B91C1C';
    iconName = 'close-circle-outline';
    iconColor = '#DC2626';
  } else if (status === 'expired') {
    bgColor = '#F3F4F6';
    textColor = '#4B5563';
    iconName = 'alert-circle-outline';
    iconColor = '#6B7280';
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: bgColor },
        isSmall && styles.containerSmall,
      ]}
    >
      <Ionicons name={iconName} size={isSmall ? 13 : 16} color={iconColor} />
      <Text style={[styles.text, { color: textColor }, isSmall && styles.textSmall]}>
        {badgeLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    gap: 4,
    alignSelf: 'flex-start',
  },
  containerSmall: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  text: {
    ...typography.badge,
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 10,
  },
});
