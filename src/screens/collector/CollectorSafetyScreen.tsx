import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { AppHeader } from '../../components/AppHeader';
import { LanguageCode } from '../../types';
import { translations } from '../../i18n';
import { ttsService } from '../../services/audio/ttsService';

interface CollectorSafetyScreenProps {
  navigation: any;
}

const AUDIO_LANG_OPTIONS: { code: LanguageCode; label: string; flag: string }[] = [
  { code: 'mr', label: 'मराठी', flag: '🇮🇳' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
  { code: 'en', label: 'English', flag: '🌐' },
];

export const CollectorSafetyScreen: React.FC<CollectorSafetyScreenProps> = ({
  navigation,
}) => {
  const { language: appLang, t } = useLanguage();
  const [selectedAudioLang, setSelectedAudioLang] = useState<LanguageCode>(appLang);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [isReadingAll, setIsReadingAll] = useState<boolean>(false);
  const [nowPlayingText, setNowPlayingText] = useState<string>('');

  // Pulse animation for active playback badge
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Keep default audio language in sync if user changes app language,
    // unless they explicitly picked a different audio option
    setSelectedAudioLang(appLang);
  }, [appLang]);

  useEffect(() => {
    // Pulse animation loop when playing
    if (activeItemId || isReadingAll) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [activeItemId, isReadingAll, pulseAnim]);

  // Stop TTS immediately on screen blur or unmount
  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('blur', () => {
      stopAllAudio();
    });

    return () => {
      stopAllAudio();
      if (unsubscribe) unsubscribe();
    };
  }, [navigation]);

  const stopAllAudio = async () => {
    await ttsService.stop();
    setActiveItemId(null);
    setIsReadingAll(false);
    setNowPlayingText('');
  };

  // Get localized texts based on the currently selected audio language
  const audioDict = translations[selectedAudioLang] || translations[appLang];

  const safetyItems = [
    {
      id: 'wires',
      icon: 'fire-alert',
      title: audioDict.safety1Title,
      desc: audioDict.safety1Desc,
      appTitle: t('safety1Title'),
      appDesc: t('safety1Desc'),
      color: colors.danger,
      bg: colors.dangerBg,
      isDanger: true,
      textToSpeak: `${audioDict.safety1Title}. ${audioDict.safety1Desc}`,
    },
    {
      id: 'acid',
      icon: 'flask-round-bottom-empty',
      title: audioDict.safety2Title,
      desc: audioDict.safety2Desc,
      appTitle: t('safety2Title'),
      appDesc: t('safety2Desc'),
      color: colors.softPeach,
      bg: colors.softPeachBg,
      isDanger: true,
      textToSpeak: `${audioDict.safety2Title}. ${audioDict.safety2Desc}`,
    },
    {
      id: 'battery',
      icon: 'battery-alert-variant-outline',
      title: audioDict.safety3Title,
      desc: audioDict.safety3Desc,
      appTitle: t('safety3Title'),
      appDesc: t('safety3Desc'),
      color: colors.warning,
      bg: colors.warningBg,
      isDanger: true,
      textToSpeak: `${audioDict.safety3Title}. ${audioDict.safety3Desc}`,
    },
    {
      id: 'crt',
      icon: 'television-classic',
      title: audioDict.safety4Title,
      desc: audioDict.safety4Desc,
      appTitle: t('safety4Title'),
      appDesc: t('safety4Desc'),
      color: colors.softPurple,
      bg: colors.softPurpleBg,
      isDanger: true,
      textToSpeak: `${audioDict.safety4Title}. ${audioDict.safety4Desc}`,
    },
    {
      id: 'authorized',
      icon: 'shield-check-outline',
      title: audioDict.safety5Title,
      desc: audioDict.safety5Desc,
      appTitle: t('safety5Title'),
      appDesc: t('safety5Desc'),
      color: colors.success,
      bg: colors.successBg,
      isDanger: false,
      textToSpeak: `${audioDict.safety5Title}. ${audioDict.safety5Desc}`,
    },
  ];

  // Play a single item
  const handlePlaySingle = async (item: (typeof safetyItems)[0]) => {
    if (activeItemId === item.id) {
      // Toggle off if already playing this item
      await stopAllAudio();
      return;
    }

    await stopAllAudio();
    setActiveItemId(item.id);
    setIsReadingAll(false);
    setNowPlayingText(item.title);

    await ttsService.speak(item.textToSpeak, {
      language: selectedAudioLang,
      onDone: () => {
        setActiveItemId(null);
        setNowPlayingText('');
      },
      onStopped: () => {
        setActiveItemId(null);
        setNowPlayingText('');
      },
      onError: () => {
        setActiveItemId(null);
        setNowPlayingText('');
      },
    });
  };

  // Play all guidelines sequentially
  const handlePlayAll = async () => {
    if (isReadingAll) {
      await stopAllAudio();
      return;
    }

    await stopAllAudio();
    setIsReadingAll(true);

    const sequence = [
      {
        id: 'intro',
        textToSpeak: `${audioDict.safetyGuidelines}. ${audioDict.safetyListenPrompt}.`,
      },
      ...safetyItems.map((item, index) => ({
        id: item.id,
        textToSpeak: `${selectedAudioLang === 'en' ? `Rule ${index + 1}` : selectedAudioLang === 'mr' ? `नियम ${index + 1}` : `नियम ${index + 1}`}. ${item.textToSpeak}`,
      })),
    ];

    await ttsService.playSequence(
      sequence,
      selectedAudioLang,
      (_index, id) => {
        setActiveItemId(id);
        const currentItem = safetyItems.find((s) => s.id === id);
        if (currentItem) {
          setNowPlayingText(currentItem.title);
        } else {
          setNowPlayingText(audioDict.safetyGuidelines);
        }
      },
      () => {
        setIsReadingAll(false);
        setActiveItemId(null);
        setNowPlayingText('');
      }
    );
  };

  const handleLanguageChange = async (newLang: LanguageCode) => {
    setSelectedAudioLang(newLang);
    // If currently playing, stop so the next tap speaks in the selected language
    if (isReadingAll || activeItemId) {
      await stopAllAudio();
    }
  };

  const isAudioActive = isReadingAll || activeItemId !== null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <AppHeader
        title={t('safetyGuidelines')}
        showBack={true}
        onBackPress={() => {
          stopAllAudio();
          navigation.goBack();
        }}
        showRoleSwitch={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* =========================================
            PROMINENT TTS AUDIO BARRIER & CONTROLLER
            ========================================= */}
        <View style={[styles.listenBanner, isAudioActive && styles.listenBannerActive, shadows.md]}>
          {/* Header row */}
          <View style={styles.bannerTopRow}>
            <View style={styles.bannerIconCircle}>
              <Ionicons
                name={isAudioActive ? 'volume-high' : 'volume-medium-outline'}
                size={26}
                color={colors.primary}
              />
            </View>
            <View style={styles.listenTextContainer}>
              <Text style={styles.listenTitle}>
                {audioDict.safetyAudioTitle || audioDict.safetyGuidelines}
              </Text>
              <Text style={styles.listenPrompt}>
                {audioDict.safetyListenPrompt || t('safetyListenPrompt')}
              </Text>
            </View>
          </View>

          {/* Audio Language Selection Chips (3 options: Marathi, Hindi, English) */}
          <View style={styles.languageSection}>
            <Text style={styles.languageSectionLabel}>
              {audioDict.audioLanguage || 'Audio Language'}:
            </Text>
            <View style={styles.languageChipsRow}>
              {AUDIO_LANG_OPTIONS.map((opt) => {
                const isSelected = selectedAudioLang === opt.code;
                return (
                  <TouchableOpacity
                    key={opt.code}
                    style={[styles.langChip, isSelected && styles.langChipSelected]}
                    onPress={() => handleLanguageChange(opt.code)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Audio Language ${opt.label}`}
                  >
                    <Text style={styles.chipFlag}>{opt.flag}</Text>
                    <Text style={[styles.langChipText, isSelected && styles.langChipTextSelected]}>
                      {opt.label}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={colors.textLight}
                        style={{ marginLeft: 3 }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Main Action Buttons: Listen All / Stop */}
          <View style={styles.controlsRow}>
            {!isAudioActive ? (
              <TouchableOpacity
                style={styles.playAllButton}
                onPress={handlePlayAll}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Listen All Guidelines"
              >
                <Ionicons name="play" size={20} color={colors.textLight} />
                <Text style={styles.playAllButtonText}>
                  {audioDict.listenAll || 'Listen All Guidelines'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.stopButton}
                onPress={stopAllAudio}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Stop Audio"
              >
                <Ionicons name="stop" size={20} color={colors.textLight} />
                <Text style={styles.stopButtonText}>
                  {audioDict.stopAudio || 'Stop'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Real-time speech status readout */}
          {isAudioActive && (
            <View style={styles.nowPlayingBox}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Ionicons name="radio" size={18} color={colors.primary} />
              </Animated.View>
              <Text style={styles.nowPlayingText} numberOfLines={1}>
                {audioDict.nowReading || 'Playing'}: {nowPlayingText || audioDict.safetyGuidelines}
              </Text>
            </View>
          )}
        </View>

        {/* =========================================
            VISUAL SAFETY CARDS LIST WITH INDIVIDUAL TTS
            ========================================= */}
        <View style={styles.cardsList}>
          {safetyItems.map((item) => {
            const isThisItemPlaying = activeItemId === item.id;

            return (
              <View
                key={item.id}
                style={[
                  styles.safetyCard,
                  { borderColor: item.isDanger ? colors.borderLight : colors.primaryLight },
                  isThisItemPlaying && styles.safetyCardActivePlaying,
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
                    {item.isDanger ? (
                      <Ionicons name="close-circle" size={20} color={colors.danger} />
                    ) : (
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    )}
                  </View>

                  <Text style={styles.cardDesc}>{item.desc}</Text>

                  {/* Individual Listen Button for this specific card */}
                  <View style={styles.cardFooter}>
                    <TouchableOpacity
                      style={[
                        styles.individualListenBtn,
                        isThisItemPlaying && styles.individualListenBtnPlaying,
                      ]}
                      onPress={() => handlePlaySingle(item)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Listen ${item.title}`}
                    >
                      <Ionicons
                        name={isThisItemPlaying ? 'stop-circle' : 'volume-high'}
                        size={18}
                        color={isThisItemPlaying ? colors.textLight : colors.primaryDark}
                      />
                      <Text
                        style={[
                          styles.individualListenText,
                          isThisItemPlaying && styles.individualListenTextPlaying,
                        ]}
                      >
                        {isThisItemPlaying
                          ? (audioDict.stopAudio || 'Stop')
                          : (audioDict.tapToListen || 'Listen')}
                      </Text>
                    </TouchableOpacity>

                    {isThisItemPlaying && (
                      <View style={styles.playingIndicatorBadge}>
                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                          <Ionicons name="mic-outline" size={14} color={colors.primary} />
                        </Animated.View>
                        <Text style={styles.playingIndicatorText}>
                          {audioDict.audioPlaying || 'Speaking...'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
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
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    marginBottom: spacing.xl,
  },
  listenBannerActive: {
    borderColor: colors.primary,
    backgroundColor: '#F2FAF5',
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  bannerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listenTextContainer: {
    flex: 1,
  },
  listenTitle: {
    ...typography.h3,
    color: colors.primaryDark,
    fontSize: 18,
  },
  listenPrompt: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  languageSection: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    backgroundColor: colors.cardAlt,
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  languageSectionLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  languageChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  langChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 4,
  },
  langChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  chipFlag: {
    fontSize: 14,
  },
  langChipText: {
    ...typography.buttonSmall,
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  langChipTextSelected: {
    color: colors.textLight,
    fontWeight: '700',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  playAllButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  playAllButtonText: {
    ...typography.buttonMedium,
    color: colors.textLight,
    fontWeight: '800',
    fontSize: 15,
  },
  stopButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  stopButtonText: {
    ...typography.buttonMedium,
    color: colors.textLight,
    fontWeight: '800',
    fontSize: 15,
  },
  nowPlayingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.primaryPale,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  nowPlayingText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
    flex: 1,
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
  safetyCardActivePlaying: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: '#FAFCFA',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
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
    marginBottom: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  individualListenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryPale,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    gap: 6,
  },
  individualListenBtnPlaying: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  individualListenText: {
    ...typography.buttonSmall,
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 12,
  },
  individualListenTextPlaying: {
    color: colors.textLight,
  },
  playingIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryPale,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
  },
  playingIndicatorText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
  },
});
