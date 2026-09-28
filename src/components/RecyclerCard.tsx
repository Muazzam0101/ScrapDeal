import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { VerificationBadge } from './VerificationBadge';
import { useLanguage } from '../context/LanguageContext';

interface RecyclerCardProps {
  name: string;
  distance: string;
  materials?: string;
  rate?: string;
  isVerified?: boolean;
  onSelect?: () => void;
  onCall?: () => void;
  selected?: boolean;
}

export const RecyclerCard: React.FC<RecyclerCardProps> = ({
  name,
  distance,
  materials,
  rate,
  isVerified = true,
  onSelect,
  onCall,
  selected = false,
}) => {
  const { t } = useLanguage();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && styles.cardSelected,
        shadows.sm,
      ]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <View style={styles.avatarCircle}>
        <Ionicons name="business" size={24} color={colors.primary} />
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
        </View>

        <View style={styles.badgeRow}>
          {isVerified && <VerificationBadge size="small" />}
          <View style={styles.distanceBadge}>
            <Ionicons name="navigate-outline" size={12} color={colors.primaryDark} />
            <Text style={styles.distanceText}>{distance}</Text>
          </View>
        </View>

        {materials && (
          <Text style={styles.materialsText} numberOfLines={1}>
            {materials}
          </Text>
        )}

        {rate && (
          <Text style={styles.rateText}>
            {t('rate')}: <Text style={styles.rateHighlight}>{rate}</Text>
          </Text>
        )}
      </View>

      <View style={styles.actionColumn}>
        {onCall && (
          <TouchableOpacity
            style={styles.callButton}
            onPress={onCall}
            accessibilityLabel={`Call ${name}`}
          >
            <Ionicons name="call" size={18} color={colors.card} />
          </TouchableOpacity>
        )}

        {selected && (
          <View style={styles.checkIcon}>
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryUltraLight,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  detailsContainer: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    ...typography.h4,
    color: colors.text,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  distanceText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  materialsText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  rateText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  rateHighlight: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  actionColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  callButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    marginTop: spacing.xs,
  },
});
