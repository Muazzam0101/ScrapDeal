import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme';
import { HandoverChecklistState } from '../types';

interface HandoverChecklistProps {
  checklist: HandoverChecklistState;
  onToggle: (key: keyof HandoverChecklistState) => void;
  labels?: {
    weightVerified: string;
    photoCaptured: string;
    locationConfirmed: string;
    timestampConfirmed: string;
  };
}

export const HandoverChecklist: React.FC<HandoverChecklistProps> = ({
  checklist,
  onToggle,
  labels = {
    weightVerified: 'वजन दर्ज हुआ (Weight Recorded)',
    photoCaptured: 'फोटो ली गई (Photo Verified)',
    locationConfirmed: 'लोकेशन दर्ज होगी (Location Logged)',
    timestampConfirmed: 'समय व तारीख (Timestamp Logged)',
  },
}) => {
  const items: { key: keyof HandoverChecklistState; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    {
      key: 'weightVerified',
      icon: 'scale-outline',
      label: labels.weightVerified,
    },
    {
      key: 'photoCaptured',
      icon: 'camera-outline',
      label: labels.photoCaptured,
    },
    {
      key: 'locationConfirmed',
      icon: 'location-outline',
      label: labels.locationConfirmed,
    },
    {
      key: 'timestampConfirmed',
      icon: 'time-outline',
      label: labels.timestampConfirmed,
    },
  ];

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const isChecked = checklist[item.key];
        return (
          <TouchableOpacity
            key={item.key}
            style={[styles.row, isChecked && styles.rowChecked]}
            onPress={() => onToggle(item.key)}
            activeOpacity={0.7}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isChecked }}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: isChecked ? colors.primaryPale : colors.cardAlt },
              ]}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={isChecked ? colors.primaryDark : colors.textSecondary}
              />
            </View>

            <Text style={[styles.label, isChecked && styles.labelChecked]}>
              {item.label}
            </Text>

            <View
              style={[
                styles.checkbox,
                isChecked && styles.checkboxChecked,
              ]}
            >
              {isChecked && (
                <Ionicons name="checkmark" size={16} color={colors.textLight} />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  rowChecked: {
    backgroundColor: colors.primaryUltraLight,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.text,
    flex: 1,
    fontWeight: '500',
  },
  labelChecked: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
