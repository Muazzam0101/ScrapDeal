import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { useLanguage } from '../context/LanguageContext';

interface WeightSelectorProps {
  value: number;
  onChange: (value: number) => void;
  unit?: string;
}

export const WeightSelector: React.FC<WeightSelectorProps> = ({
  value,
  onChange,
  unit = 'किलो',
}) => {
  const { t } = useLanguage();

  const handleIncrement = (amount: number) => {
    onChange(Math.max(0, Math.round((value + amount) * 10) / 10));
  };

  const handleDecrement = (amount: number) => {
    onChange(Math.max(0, Math.round((value - amount) * 10) / 10));
  };

  const handleTextChange = (text: string) => {
    const num = parseFloat(text);
    if (isNaN(num)) {
      onChange(0);
    } else {
      onChange(Math.max(0, num));
    }
  };

  return (
    <View style={styles.container}>
      {/* Visual Weight Bag Emblem */}
      <View style={styles.weightIconWrapper}>
        <View style={styles.weightBadge}>
          <MaterialCommunityIcons name="weight-kilogram" size={38} color={colors.card} />
          <Text style={styles.kgBadgeText}>KG</Text>
        </View>
      </View>

      {/* Main Large Stepper */}
      <View style={styles.stepperRow}>
        <TouchableOpacity
          style={[styles.stepperButton, value <= 0 && styles.stepperButtonDisabled]}
          onPress={() => handleDecrement(1)}
          disabled={value <= 0}
          accessibilityLabel="Decrease weight by 1 kg"
        >
          <Ionicons
            name="remove"
            size={32}
            color={value <= 0 ? colors.textMuted : colors.textLight}
          />
        </TouchableOpacity>

        <View style={styles.valueContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.numericInput}
              keyboardType="decimal-pad"
              value={value === 0 ? '' : value.toString()}
              placeholder="0.0"
              placeholderTextColor={colors.textMuted}
              onChangeText={handleTextChange}
            />
          </View>
          <Text style={styles.unitText}>{unit}</Text>
        </View>

        <TouchableOpacity
          style={styles.stepperButton}
          onPress={() => handleIncrement(1)}
          accessibilityLabel="Increase weight by 1 kg"
        >
          <Ionicons name="add" size={32} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* Quick Add Chips */}
      <View style={styles.chipsRow}>
        {[1, 5, 10, 25].map((chip) => (
          <TouchableOpacity
            key={chip}
            style={styles.chip}
            onPress={() => handleIncrement(chip)}
            activeOpacity={0.7}
          >
            <Text style={styles.chipText}>+{chip} kg</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  weightIconWrapper: {
    marginBottom: spacing.xl,
  },
  weightBadge: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  kgBadgeText: {
    ...typography.badge,
    color: colors.textLight,
    letterSpacing: 1,
    marginTop: 2,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: spacing.xl,
    marginBottom: spacing.xl,
  },
  stepperButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  stepperButtonDisabled: {
    backgroundColor: colors.border,
  },
  valueContainer: {
    alignItems: 'center',
    minWidth: 120,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  numericInput: {
    ...typography.displayLarge,
    color: colors.text,
    textAlign: 'center',
    minWidth: 80,
    padding: 0,
  },
  unitText: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.primaryPale,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.primaryDark,
    fontWeight: '700',
  },
});
