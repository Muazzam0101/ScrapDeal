import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuthStore } from '../../store/useAuthStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useSyncStore } from '../../store/useSyncStore';
import { AppHeader } from '../../components/AppHeader';
import { FieldFeedbackModal } from '../../components/FieldFeedbackModal';

interface CollectorHomeScreenProps {
  navigation: any;
}

export const CollectorHomeScreen: React.FC<CollectorHomeScreenProps> = ({ navigation }) => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuthStore();
  const { isOnline } = useNetworkStore();
  const { isSyncing, pendingCount } = useSyncStore();
  const [fieldMode, setFieldMode] = useState<boolean>(true); // Default to Field Mode for collectors
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);

  const userName = (currentUser as any)?.name || (language === 'mr' ? 'कबाडीवाला' : language === 'hi' ? 'कबाड़ीवाला' : 'Collector');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader
        location={t('collectorLocation')}
        showBack={false}
        showRoleSwitch={true}
      />

      {/* ==================================================
          CONNECTIVITY & SYNC STATUS BAR (LOW-LITERACY FRIENDLY)
          ================================================== */}
      <View
        style={[
          styles.statusBar,
          isOnline ? styles.statusBarOnline : styles.statusBarOffline,
        ]}
      >
        <View style={styles.statusLeft}>
          <View style={[styles.statusDot, isOnline ? styles.dotOnline : styles.dotOffline]} />
          <Ionicons
            name={isOnline ? 'wifi' : 'cloud-offline-outline'}
            size={15}
            color={isOnline ? '#166534' : '#92400E'}
          />
          <Text style={[styles.statusText, isOnline ? styles.textOnline : styles.textOffline]}>
            {isOnline
              ? (language === 'mr' ? 'ऑनलाइन' : language === 'hi' ? 'ऑनलाइन' : 'Online')
              : `${t('offlineMode')} (${t('savedOnPhone')})`}
          </Text>
        </View>

        {/* Sync Status Badge */}
        <View style={styles.statusRight}>
          {pendingCount > 0 ? (
            <View style={styles.syncBadgePending}>
              <Ionicons name="phone-portrait-outline" size={13} color="#92400E" />
              <Text style={styles.syncBadgePendingText}>
                {t('savedOnPhone')} ({pendingCount})
              </Text>
            </View>
          ) : (
            <View style={styles.syncBadgeSynced}>
              <Ionicons name="checkmark-done" size={14} color="#166534" />
              <Text style={styles.syncBadgeSyncedText}>{t('savedSynced')}</Text>
            </View>
          )}

          {/* Field Mode Toggle Badge */}
          <TouchableOpacity
            style={[styles.fieldModeBadge, fieldMode && styles.fieldModeBadgeActive]}
            onPress={() => setFieldMode(!fieldMode)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Toggle Field Mode"
          >
            <Ionicons
              name={fieldMode ? 'sunny' : 'sunny-outline'}
              size={13}
              color={fieldMode ? colors.textLight : colors.textSecondary}
            />
            <Text style={[styles.fieldModeText, fieldMode && styles.fieldModeTextActive]}>
              {t('fieldMode')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, fieldMode && styles.fieldScrollContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* Collector Greeting Banner */}
        <View style={[styles.greetingRow, shadows.sm]}>
          <View style={styles.avatarCircle}>
            <MaterialCommunityIcons name="account-hard-hat" size={32} color={colors.primary} />
          </View>
          <View style={styles.greetingTextContainer}>
            <Text style={styles.greetingTitle}>
              {t('greetingHello')}, {userName}!
            </Text>
            <Text style={styles.greetingSub}>{t('greetingCollector')}</Text>
          </View>
        </View>

        {/* ==================================================
            PRIMARY HERO ACTION: SELL SCRAP (LARGE TOUCH TARGET)
            ================================================== */}
        <TouchableOpacity
          style={[styles.heroCard, shadows.lg]}
          onPress={() => navigation.navigate('MaterialCategory')}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Sell Scrap: Take Photo and Check Price"
        >
          <View style={styles.heroIconWrapper}>
            <Ionicons name="camera" size={48} color={colors.textLight} />
          </View>
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>
              {t('sellGoodsCTA')}
            </Text>
            <Text style={styles.heroSubtitle}>
              ({t('sellGoodsSub')} →)
            </Text>
          </View>
        </TouchableOpacity>

        {/* ==================================================
            CORE 5 GRID ACTIONS (LARGE TOUCH TARGETS ≥48dp)
            Recommended conceptual structure:
            1. Today's Rates
            2. My Scrap
            3. My Deals
            4. My Earnings
            5. Safety
            ================================================== */}
        <View style={styles.gridContainer}>
          {/* 1. Today's Rates */}
          <TouchableOpacity
            style={[styles.gridCard, styles.rateCard]}
            onPress={() => navigation.navigate('CollectorPriceBoard')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Today's Rates: Check scrap market prices"
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="cash-outline" size={32} color="#0284C7" />
            </View>
            <Text style={styles.gridCardTitle}>{t('todaysRate')}</Text>
            <Text style={styles.gridCardSub}>({t('todaysRateSub')})</Text>
          </TouchableOpacity>

          {/* 2. My Scrap / Lots */}
          <TouchableOpacity
            style={[styles.gridCard, styles.lotsCard]}
            onPress={() => navigation.navigate('CollectorDeals', { initialTab: 'lots' })}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="My Scrap: View my created scrap lots"
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="cube-outline" size={32} color="#D97706" />
            </View>
            <Text style={styles.gridCardTitle}>{t('myLots')}</Text>
            <Text style={styles.gridCardSub}>
              ({language === 'mr' ? 'साठवलेले भंगार' : language === 'hi' ? 'सहेजा हुआ स्क्रैप' : 'Active Lots'})
            </Text>
          </TouchableOpacity>

          {/* 3. My Deals */}
          <TouchableOpacity
            style={[styles.gridCard, styles.dealsCard]}
            onPress={() => navigation.navigate('CollectorDeals', { initialTab: 'deals' })}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="My Deals: Active deals with recyclers"
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="hand-left-outline" size={32} color="#7C3AED" />
            </View>
            <Text style={styles.gridCardTitle}>{t('myDeals')}</Text>
            <Text style={styles.gridCardSub}>
              ({language === 'mr' ? 'सौदा व व्यवहार' : language === 'hi' ? 'सौदा और हैंडओवर' : 'Offers & Deals'})
            </Text>
          </TouchableOpacity>

          {/* 4. My Earnings */}
          <TouchableOpacity
            style={[styles.gridCard, styles.earningsCard]}
            onPress={() => navigation.navigate('CollectorEarnings')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="My Earnings: Cash and online payment ledger"
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="wallet-outline" size={32} color="#16A34A" />
            </View>
            <Text style={styles.gridCardTitle}>{t('myEarnings')}</Text>
            <Text style={styles.gridCardSub}>({t('myEarningsSub')})</Text>
          </TouchableOpacity>

          {/* 5. Safety (Prominent dedicated entry point) */}
          <TouchableOpacity
            style={[styles.gridCard, styles.safetyCard, styles.gridCardFullWidth]}
            onPress={() => navigation.navigate('CollectorSafety')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Safety: Guidelines for battery, CRT, PCB, and cable safety"
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="shield-checkmark" size={34} color="#DC2626" />
            </View>
            <View style={styles.safetyCardTextContainer}>
              <Text style={styles.safetyCardTitle}>{t('safetyInfo')}</Text>
              <Text style={styles.safetyCardSub}>
                {language === 'mr'
                  ? 'बॅटरी, काच, वायर सुरक्षा आणि ऑडिओ सूचना'
                  : language === 'hi'
                  ? 'बैटरी, CRT, तार सुरक्षा और ऑडियो निर्देश'
                  : 'Battery, CRT, Cable burning, & Audio guidance'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#DC2626" />
          </TouchableOpacity>
        </View>

        {/* Report Usability Issue / Field Research Feedback */}
        <TouchableOpacity
          style={styles.feedbackBtn}
          onPress={() => setShowFeedbackModal(true)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Report usability issue or feedback"
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.feedbackBtnText}>{t('giveFeedback')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Field Usability Feedback Modal */}
      <FieldFeedbackModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        currentScreen="CollectorHomeScreen"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    minHeight: 44,
  },
  statusBarOnline: {
    backgroundColor: '#F0FDF4',
    borderBottomColor: '#BBF7D0',
  },
  statusBarOffline: {
    backgroundColor: '#FFFBEB',
    borderBottomColor: '#FDE68A',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 2,
  },
  dotOnline: {
    backgroundColor: '#16A34A',
  },
  dotOffline: {
    backgroundColor: '#D97706',
  },
  statusText: {
    ...typography.badge,
    fontSize: 12,
    fontWeight: '700',
  },
  textOnline: {
    color: '#166534',
  },
  textOffline: {
    color: '#92400E',
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  syncBadgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  syncBadgePendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  syncBadgeSynced: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  syncBadgeSyncedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  fieldModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.card,
  },
  fieldModeBadgeActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  fieldModeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  fieldModeTextActive: {
    color: colors.textLight,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  fieldScrollContent: {
    backgroundColor: colors.background,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    minHeight: 64,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  greetingTextContainer: {
    flex: 1,
  },
  greetingTitle: {
    ...typography.h3,
    color: colors.text,
  },
  greetingSub: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: 2,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: spacing.lg,
    minHeight: 110,
    gap: spacing.md,
  },
  heroIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    ...typography.h1,
    fontSize: 22,
    color: colors.textLight,
    fontWeight: '800',
  },
  heroSubtitle: {
    ...typography.bodyMedium,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '600',
    marginTop: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '47.5%',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 130, // Touch target
    borderWidth: 1.5,
    backgroundColor: colors.card,
  },
  rateCard: {
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
  },
  lotsCard: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  dealsCard: {
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
  },
  earningsCard: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  safetyCard: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  gridCardFullWidth: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.lg,
    minHeight: 80,
    gap: spacing.md,
  },
  safetyCardTextContainer: {
    flex: 1,
  },
  safetyCardTitle: {
    ...typography.h3,
    fontSize: 16,
    color: '#991B1B',
  },
  safetyCardSub: {
    ...typography.caption,
    color: '#7F1D1D',
    marginTop: 2,
  },
  gridIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  gridCardTitle: {
    ...typography.h4,
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  gridCardSub: {
    ...typography.bodySmall,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  feedbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  feedbackBtnText: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
