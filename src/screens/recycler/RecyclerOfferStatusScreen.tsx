import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { AppHeader } from '../../components/AppHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { OfferCard } from '../../components/OfferCard';

interface RecyclerOfferStatusScreenProps {
  navigation: any;
  route: any;
}

export const RecyclerOfferStatusScreen: React.FC<RecyclerOfferStatusScreenProps> = ({
  navigation,
  route,
}) => {
  const { t } = useLanguage();
  const [currentStepIndex, setCurrentStepIndex] = useState(4); // 4 = Deal Accepted

  const timelineSteps = [
    { key: 'sent', title: t('statusOfferSent'), role: 'recycler' as const, rate: 275, amount: 4125 },
    { key: 'viewed', title: t('statusViewed'), role: 'system' as const, rate: 275, amount: 4125 },
    { key: 'counter', title: t('statusCounterOffer'), role: 'collector' as const, rate: 280, amount: 4200 },
    { key: 'final', title: t('statusFinalOffer'), role: 'recycler' as const, rate: 280, amount: 4200 },
    { key: 'accepted', title: t('statusDealAccepted'), role: 'collector' as const, rate: 280, amount: 4200 },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title={t('offerStatusTitle')}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        showRoleSwitch={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Deal Accepted Green Banner (if current step is accepted) */}
        {currentStepIndex >= 4 && (
          <View style={[styles.acceptedBanner, shadows.md]}>
            <Ionicons name="shield-checkmark" size={40} color={colors.textLight} />
            <Text style={styles.acceptedTitle}>{t('statusDealAccepted')}</Text>
            <Text style={styles.acceptedSubtitle}>
              कलेक्टर ने आपका ऑफर स्वीकार कर लिया है।
            </Text>
          </View>
        )}

        {/* Interactive Timeline Stepper */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>प्रक्रिया का क्रम (Offer Timeline)</Text>

          {timelineSteps.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isLast = idx === timelineSteps.length - 1;

            return (
              <View key={step.key} style={styles.timelineItem}>
                {/* Indicator Circle & Vertical Connector */}
                <View style={styles.indicatorColumn}>
                  <View
                    style={[
                      styles.stepCircle,
                      isCompleted && styles.stepCircleCompleted,
                    ]}
                  >
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={14} color={colors.textLight} />
                    ) : (
                      <Text style={styles.stepNum}>{idx + 1}</Text>
                    )}
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        styles.connectorLine,
                        idx < currentStepIndex && styles.connectorLineCompleted,
                      ]}
                    />
                  )}
                </View>

                {/* Step Content Card */}
                <View style={styles.stepContent}>
                  <OfferCard
                    title={step.title}
                    ratePerKg={step.rate}
                    totalAmount={step.amount}
                    actorRole={step.role}
                    isAccepted={idx === 4}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.bottomBar}>
        <PrimaryButton
          title={t('scheduleHandoverCTA')}
          icon="calendar-outline"
          onPress={() => navigation.navigate('RecyclerPickup')}
        />
        <SecondaryButton
          title={t('chatWhatsAppCTA')}
          icon="logo-whatsapp"
          onPress={() => {}}
          style={styles.whatsappBtn}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
  },
  acceptedBanner: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  acceptedTitle: {
    ...typography.h2,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  acceptedSubtitle: {
    ...typography.bodyMedium,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
    textAlign: 'center',
  },
  timelineSection: {
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  indicatorColumn: {
    alignItems: 'center',
    width: 32,
    marginRight: spacing.sm,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepCircleCompleted: {
    backgroundColor: colors.primary,
  },
  stepNum: {
    ...typography.badge,
    fontSize: 10,
    color: colors.textSecondary,
  },
  connectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 4,
  },
  connectorLineCompleted: {
    backgroundColor: colors.primary,
  },
  stepContent: {
    flex: 1,
    marginBottom: spacing.xs,
  },
  bottomBar: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.sm,
  },
  whatsappBtn: {
    borderColor: '#25D366',
  },
});
