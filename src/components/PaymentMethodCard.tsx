import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme';
import { PaymentMethod } from '../types';

interface PaymentMethodCardProps {
  method: PaymentMethod;
  title: string;
  subtitle: string;
  badgeText?: string;
  isSelected: boolean;
  onSelect: () => void;
}

export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  method,
  title,
  subtitle,
  badgeText,
  isSelected,
  onSelect,
}) => {
  const isCash = method === 'cash';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.cardSelected,
      ]}
      onPress={onSelect}
      activeOpacity={0.8}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
    >
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: isCash ? colors.primaryPale : colors.softBlueBg },
        ]}
      >
        <MaterialCommunityIcons
          name={isCash ? 'cash-multiple' : 'cellphone-wireless'}
          size={30}
          color={isCash ? colors.primaryDark : colors.softBlue}
        />
      </View>

      <View style={styles.textContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, isSelected && styles.titleSelected]}>
            {title}
          </Text>
          {badgeText && (
            <View
              style={[
                styles.badge,
                { backgroundColor: isCash ? colors.primaryPale : colors.cardAlt },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: isCash ? colors.primaryDark : colors.textSecondary },
                ]}
              >
                {badgeText}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.radioContainer}>
        <Ionicons
          name={isSelected ? 'radio-button-on' : 'radio-button-off'}
          size={24}
          color={isSelected ? colors.primary : colors.textMuted}
        />
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
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.borderLight,
    minHeight: 76,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryUltraLight,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  title: {
    ...typography.h4,
    color: colors.text,
  },
  titleSelected: {
    color: colors.primaryDark,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    ...typography.badge,
    fontSize: 10,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  radioContainer: {
    marginLeft: spacing.sm,
  },
});
