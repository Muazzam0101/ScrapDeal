import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'neutral',
  icon,
}) => {
  const getBadgeColors = () => {
    switch (variant) {
      case 'success':
        return { bg: colors.successBg, text: colors.success };
      case 'warning':
        return { bg: colors.warningBg, text: colors.warning };
      case 'danger':
        return { bg: colors.dangerBg, text: colors.danger };
      case 'info':
        return { bg: colors.softBlueBg, text: colors.softBlue };
      default:
        return { bg: colors.cardAlt, text: colors.textSecondary };
    }
  };

  const { bg, text } = getBadgeColors();

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {icon && (
        <Ionicons
          name={icon}
          size={12}
          color={text}
          style={styles.icon}
        />
      )}
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    ...typography.badge,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
