import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';

interface LotCardProps {
  lotId?: string;
  materialName: string;
  weight: string;
  distance?: string;
  location?: string;
  estimatedValue?: string;
  timestamp?: string;
  actionText?: string;
  onAction?: () => void;
  onPress?: () => void;
}

export const LotCard: React.FC<LotCardProps> = ({
  lotId,
  materialName,
  weight,
  distance,
  location,
  estimatedValue,
  timestamp,
  actionText = 'Offer Dein',
  onAction,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.card, shadows.sm]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.topRow}>
        <View style={styles.materialIconWrapper}>
          <MaterialCommunityIcons name="chip" size={28} color={colors.primary} />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.materialName}>{materialName}</Text>
          <Text style={styles.weightText}>{weight}</Text>

          {(distance || location) && (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.metaText}>
                {[distance, location].filter(Boolean).join(' • ')}
              </Text>
            </View>
          )}

          {timestamp && (
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={13} color={colors.textMuted} />
              <Text style={styles.metaTextMuted}>{timestamp}</Text>
            </View>
          )}
        </View>

        <View style={styles.rightColumn}>
          {estimatedValue && (
            <Text style={styles.valueText}>{estimatedValue}</Text>
          )}

          {onAction && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onAction}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>{actionText}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  materialIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoContainer: {
    flex: 1,
  },
  materialName: {
    ...typography.h4,
    color: colors.text,
  },
  weightText: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 3,
  },
  metaText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  metaTextMuted: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  rightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: spacing.sm,
  },
  valueText: {
    ...typography.h4,
    color: colors.primaryDark,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
  },
  actionButtonText: {
    ...typography.buttonSmall,
    color: colors.textLight,
  },
});
