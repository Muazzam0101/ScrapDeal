import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../theme';
import { LanguageCode } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const options: { code: LanguageCode; label: string }[] = [
    { code: 'hi', label: 'हिंदी' },
    { code: 'mr', label: 'मराठी' },
    { code: 'en', label: 'English' },
  ];

  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const isSelected = language === opt.code;
        return (
          <TouchableOpacity
            key={opt.code}
            style={[styles.pill, isSelected && styles.pillSelected]}
            onPress={() => setLanguage(opt.code)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              style={[styles.pillText, isSelected && styles.pillTextSelected]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginVertical: spacing.md,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.cardAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    minWidth: 84,
    alignItems: 'center',
  },
  pillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  pillText: {
    ...typography.buttonSmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  pillTextSelected: {
    color: colors.textLight,
    fontWeight: '700',
  },
});
