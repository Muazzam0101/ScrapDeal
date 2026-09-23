import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { StatusBadge } from './StatusBadge';

interface TransactionCardProps {
  materialName: string;
  weight: string;
  amount: string;
  date: string;
  counterpart?: string;
  paymentMethod?: 'cash' | 'upi';
  isCompleted?: boolean;
  onPress?: () => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  materialName,
  weight,
  amount,
  date,
  counterpart,
  paymentMethod = 'cash',
  isCompleted = true,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.card, shadows.sm]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
    >
      <View style={styles.leftIconWrapper}>
        <MaterialCommunityIcons
          name={paymentMethod === 'cash' ? 'cash' : 'cellphone'}
          size={26}
          color={colors.primary}
        />
      </View>

      <View style={styles.details}>
        <Text style={styles.title}>{materialName}</Text>
        <Text style={styles.subText}>
          {weight} {counterpart ? `• ${counterpart}` : ''}
        </Text>
        <Text style={styles.dateText}>{date}</Text>
      </View>

      <View style={styles.rightContainer}>
        <Text style={styles.amount}>{amount}</Text>
        <StatusBadge
          label={isCompleted ? 'Completed' : 'Pending'}
          variant={isCompleted ? 'success' : 'warning'}
          icon={isCompleted ? 'checkmark-circle' : 'time-outline'}
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
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  leftIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  details: {
    flex: 1,
  },
  title: {
    ...typography.h4,
    color: colors.text,
  },
  subText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dateText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: 2,
  },
  rightContainer: {
    alignItems: 'flex-end',
    gap: 6,
  },
  amount: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '800',
  },
});
