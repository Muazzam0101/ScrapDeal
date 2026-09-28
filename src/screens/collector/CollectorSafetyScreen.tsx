import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { AppHeader } from '../../components/AppHeader';
import { AudioSpeakerButton } from '../../components/AudioSpeakerButton';

interface CollectorSafetyScreenProps {
  navigation: any;
}

export const CollectorSafetyScreen: React.FC<CollectorSafetyScreenProps> = ({
  navigation,
}) => {
  const { t } = useLanguage();

  const safetyItems = [
    {
      id: 'wires',
      icon: 'fire-alert',
      title: t('safety1Title'),
      desc: t('safety1Desc'),
      color: colors.danger,
      bg: colors.dangerBg,
      isDanger: true,
    },
    {
      id: 'acid',
      icon: 'flask-round-bottom-empty',
      title: t('safety2Title'),
      desc: t('safety2Desc'),
      color: colors.softPeach,
      bg: colors.softPeachBg,
      isDanger: true,
    },
    {
      id: 'battery',
      icon: 'battery-alert-variant-outline',
      title: t('safety3Title'),
      desc: t('safety3Desc'),
      color: colors.warning,
      bg: colors.warningBg,
      isDanger: true,
    },
    {
      id: 'crt',
      icon: 'television-classic',
      title: t('safety4Title'),
      desc: t('safety4Desc'),
      color: colors.softPurple,
      bg: colors.softPurpleBg,
      isDanger: true,
    },
    {
      id: 'authorized',
      icon: 'shield-check-outline',
      title: t('safety5Title'),
      desc: t('safety5Desc'),
      color: colors.success,
      bg: colors.successBg,
      isDanger: false,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <AppHeader
        title={t('safetyGuidelines')}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        showRoleSwitch={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Prominent Audio Listen Banner for Low-Literacy Users */}
        <View style={styles.listenBanner}>
          <View style={styles.listenTextContainer}>
            <Text style={styles.listenTitle}>{t('safetyGuidelines')}</Text>
            <Text style={styles.listenPrompt}>{t('safetyListenPrompt')}</Text>
          </View>
          <AudioSpeakerButton label={t('listen')} size="medium" />
        </View>

        {/* Visual Safety Cards */}
        <View style={styles.cardsList}>
          {safetyItems.map((item) => (
            <View
              key={item.id}
              style={[
                styles.safetyCard,
                { borderColor: item.isDanger ? colors.borderLight : colors.primaryLight },
                shadows.sm,
              ]}
            >
              <View style={[styles.cardIconBox, { backgroundColor: item.bg }]}>
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={36}
                  color={item.color}
                />
              </View>

              <View style={styles.cardDetails}>
                <View style={styles.titleRow}>
                  <Text style={[styles.cardTitle, { color: item.color }]}>
                    {item.title}
                  </Text>
                  {item.isDanger && (
                    <Ionicons name="close-circle" size={20} color={colors.danger} />
                  )}
                  {!item.isDanger && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  )}
                </View>
                <Text style={styles.cardDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
  listenBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  listenTextContainer: {
    flex: 1,
  },
  listenTitle: {
    ...typography.h3,
    color: colors.primaryDark,
  },
  listenPrompt: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardsList: {
    gap: spacing.lg,
  },
  safetyCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardIconBox: {
    width: 58,
    height: 58,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardDetails: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    ...typography.h4,
    fontWeight: '800',
    flex: 1,
  },
  cardDesc: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
