import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { MaterialCategoryId } from '../types';

interface MaterialCategoryCardProps {
  id: MaterialCategoryId;
  title: string;
  subtitle?: string;
  icon: string;
  isSelected?: boolean;
  onPress: () => void;
  accentColor?: string;
}

export const MaterialCategoryCard: React.FC<MaterialCategoryCardProps> = ({
  title,
  subtitle,
  icon,
  isSelected = false,
  onPress,
  accentColor = colors.primary,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.cardSelected,
        isSelected && shadows.md,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: isSelected ? colors.primaryPale : colors.cardAlt },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={36}
          color={isSelected ? colors.primaryDark : accentColor}
        />
      </View>

      <Text
        style={[styles.title, isSelected && styles.titleSelected]}
        numberOfLines={2}
      >
        {title}
      </Text>

      {subtitle && (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      )}

      {isSelected && (
        <View style={styles.selectedBadge}>
          <Ionicons name="checkmark" size={14} color={colors.textLight} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 110,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.borderLight,
    position: 'relative',
    margin: spacing.xs,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryUltraLight,
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  titleSelected: {
    color: colors.primaryDark,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
