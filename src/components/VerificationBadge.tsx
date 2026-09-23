import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme';

interface VerificationBadgeProps {
  label?: string;
  size?: 'small' | 'medium';
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  label = 'Authorized Recycler',
  size = 'small',
}) => {
  const isSmall = size === 'small';

  return (
    <View style={[styles.container, isSmall && styles.containerSmall]}>
      <Ionicons
        name="checkmark-circle"
        size={isSmall ? 14 : 16}
        color={colors.primary}
      />
      <Text style={[styles.text, isSmall && styles.textSmall]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryPale,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    gap: 4,
    alignSelf: 'flex-start',
  },
  containerSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    ...typography.badge,
    color: colors.primaryDark,
  },
  textSmall: {
    fontSize: 11,
  },
});
