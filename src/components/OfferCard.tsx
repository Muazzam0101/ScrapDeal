import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';

interface OfferCardProps {
  title: string;
  ratePerKg: number;
  totalAmount: number;
  actorRole: 'collector' | 'recycler' | 'system';
  timestamp?: string;
  isAccepted?: boolean;
}

export const OfferCard: React.FC<OfferCardProps> = ({
  title,
  ratePerKg,
  totalAmount,
  actorRole,
  timestamp = '11:30 AM',
  isAccepted = false,
}) => {
  const isRecycler = actorRole === 'recycler';

  return (
    <View
      style={[
        styles.card,
        isAccepted && styles.cardAccepted,
        shadows.sm,
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.actorBadge}>
          <Ionicons
            name={isRecycler ? 'business-outline' : 'person-outline'}
            size={16}
            color={colors.primaryDark}
          />
          <Text style={styles.title}>{title}</Text>
        </View>

        {timestamp && <Text style={styles.timestamp}>{timestamp}</Text>}
      </View>

      <View style={styles.amountRow}>
        <View>
          <Text style={styles.rateLabel}>रेट (प्रति किलो)</Text>
          <Text style={styles.rateValue}>₹ {ratePerKg} /kg</Text>
        </View>

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>कुल राशि</Text>
          <Text style={styles.totalValue}>₹ {totalAmount.toLocaleString('en-IN')}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  cardAccepted: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryUltraLight,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  actorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    ...typography.h4,
    color: colors.text,
  },
  timestamp: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  rateLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  rateValue: {
    ...typography.h3,
    color: colors.primaryDark,
    marginTop: 2,
  },
  totalBox: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  totalValue: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '800',
    marginTop: 2,
  },
});
