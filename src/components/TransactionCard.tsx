import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { StatusBadge } from './StatusBadge';
import { Transaction } from '../types';

interface TransactionCardProps {
  transaction?: Transaction;
  materialName?: string;
  weight?: string;
  amount?: string;
  date?: string;
  counterpart?: string;
  paymentMethod?: 'cash' | 'upi';
  isCompleted?: boolean;
  onPress?: () => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  materialName,
  weight,
  amount,
  date,
  counterpart,
  paymentMethod = 'cash',
  isCompleted = true,
  onPress,
}) => {
  const displayMaterial = materialName || transaction?.materialName || 'Scrap Material';
  const displayWeight = weight || (transaction ? `${transaction.weightKg} kg` : '');
  const displayAmount = amount || (transaction ? `₹ ${transaction.totalAmount.toLocaleString('en-IN')}` : '');
  const displayDate = date || (transaction ? new Date(transaction.date).toLocaleDateString() : '');
  const displayPaymentMethod = (transaction ? transaction.paymentMethod : paymentMethod) || 'cash';
  const displayCompleted = transaction ? transaction.paymentStatus === 'completed' : isCompleted;

  return (
    <TouchableOpacity
      style={[styles.card, shadows.sm]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
    >
      <View style={styles.leftIconWrapper}>
        <MaterialCommunityIcons
          name={displayPaymentMethod === 'cash' ? 'cash' : 'cellphone'}
          size={26}
          color={colors.primary}
        />
      </View>

      <View style={styles.details}>
        <Text style={styles.title}>{displayMaterial}</Text>
        <Text style={styles.subText}>
          {displayWeight} {counterpart ? `• ${counterpart}` : ''}
        </Text>
        <Text style={styles.dateText}>{displayDate}</Text>
      </View>

      <View style={styles.rightContainer}>
        <Text style={styles.amount}>{displayAmount}</Text>
        <StatusBadge
          label={displayCompleted ? 'Completed' : 'Pending'}
          variant={displayCompleted ? 'success' : 'warning'}
          icon={displayCompleted ? 'checkmark-circle' : 'time-outline'}
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
