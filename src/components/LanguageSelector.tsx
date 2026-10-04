import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius, rf } from '../theme';
import { LanguageCode } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface LanguageSelectorProps {
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ compact = false }) => {
  const { language, setLanguage } = useLanguage();

  const options: { code: LanguageCode; label: string }[] = [
    { code: 'hi', label: 'हिंदी' },
    { code: 'mr', label: 'मराठी' },
    { code: 'en', label: 'English' },
  ];

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {options.map((opt) => {
        const isSelected = language === opt.code;
        return (
          <TouchableOpacity
            key={opt.code}
            style={[
              styles.pill,
              compact && styles.pillCompact,
              isSelected && styles.pillSelected,
            ]}
            onPress={() => setLanguage(opt.code)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              style={[
                styles.pillText,
                compact && styles.pillTextCompact,
                isSelected && styles.pillTextSelected,
              ]}
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
    gap: spacing.sm,
    marginVertical: spacing.sm,
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  containerCompact: {
    marginVertical: 0,
    width: 'auto',
    maxWidth: undefined,
    gap: 6,
    alignSelf: 'center',
  },
  pill: {
    flex: 1,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.cardAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    minWidth: 64,
    maxWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillCompact: {
    flex: 0,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 54,
    maxWidth: 86,
    borderWidth: 1,
  },
  pillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  pillText: {
    ...typography.buttonSmall,
    fontSize: rf(12),
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  pillTextCompact: {
    fontSize: rf(11),
  },
  pillTextSelected: {
    color: colors.textLight,
    fontWeight: '700',
  },
});
