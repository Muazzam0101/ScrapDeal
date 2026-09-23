import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';

interface PriceCardProps {
  materialName: string;
  category?: string;
  rateRange: string;
  trend?: 'up' | 'down' | 'stable';
  onPress?: () => void;
  onEdit?: () => void;
  showEdit?: boolean;
}

export const PriceCard: React.FC<PriceCardProps> = ({
  materialName,
  category,
  rateRange,
  trend = 'stable',
  onPress,
  onEdit,
  showEdit = false,
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return colors.success;
      case 'down':
        return colors.danger;
      default:
        return colors.textSecondary;
    }
  };

  const getTrendIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'remove-outline';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, shadows.sm]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconBox}>
        <MaterialCommunityIcons name="chip" size={26} color={colors.primary} />
      </View>

      <View style={styles.content}>
        <Text style={styles.name}>{materialName}</Text>
        {category && <Text style={styles.category}>{category}</Text>}
      </View>

      <View style={styles.priceContainer}>
        <View style={styles.priceRow}>
          <Text style={styles.rateText}>{rateRange}</Text>
          <Ionicons
            name={getTrendIcon()}
            size={16}
            color={getTrendColor()}
            style={styles.trendIcon}
          />
        </View>
      </View>

      {showEdit && onEdit && (
        <TouchableOpacity
          style={styles.editButton}
          onPress={onEdit}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="pencil" size={16} color={colors.primaryDark} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  name: {
    ...typography.h4,
    color: colors.text,
  },
  category: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 1,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rateText: {
    ...typography.h4,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  trendIcon: {
    marginLeft: 2,
  },
  editButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
});
