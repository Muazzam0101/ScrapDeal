import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { AppHeader } from '../../components/AppHeader';
import { LanguageCode, SafetyGuide, SafetyCategoryKey } from '../../types';
import { translations } from '../../i18n';
import { ttsService, PlaybackState } from '../../services/audio/ttsService';
import { safetyRepository } from '../../services/sqlite/repositories/safetyRepository';
import {
  DETERMINISTIC_SAFETY_CATEGORIES,
  getSafetyProfile,
} from '../../services/safety/safetyRulesEngine';
import { FieldFeedbackModal } from '../../components/FieldFeedbackModal';

interface CollectorSafetyScreenProps {
  navigation: any;
}

const AUDIO_LANG_OPTIONS: { code: LanguageCode; label: string }[] = [
  { code: 'mr', label: 'मराठी' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'en', label: 'English' },
];

export const CollectorSafetyScreen: React.FC<CollectorSafetyScreenProps> = ({
  navigation,
}) => {
  const { language: appLang, t } = useLanguage();
  const [selectedAudioLang, setSelectedAudioLang] = useState<LanguageCode>(appLang);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [guides, setGuides] = useState<SafetyGuide[]>([]);
  const [isLoadingGuides, setIsLoadingGuides] = useState<boolean>(true);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [nowPlayingText, setNowPlayingText] = useState<string>('');
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [showNotSureModal, setShowNotSureModal] = useState<boolean>(false);

  // Pulse animation for active playback badge
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Load guides from SQLite offline cache
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoadingGuides(true);
      try {
        const loaded = await safetyRepository.getSafetyGuides(selectedAudioLang);
        if (isMounted) setGuides(loaded);
      } catch (err) {
        console.warn('[CollectorSafetyScreen] Error loading safety guides:', err);
      } finally {
        if (isMounted) setIsLoadingGuides(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [selectedAudioLang]);

  useEffect(() => {
    setSelectedAudioLang(appLang);
  }, [appLang]);

  useEffect(() => {
    if (playbackState === 'playing') {
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
  }, [playbackState, pulseAnim]);

  // Stop TTS on blur / unmount
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
    setPlaybackState('idle');
    setNowPlayingText('');
  };

  const handlePause = async () => {
    await ttsService.pause();
    setPlaybackState('paused');
  };

  const handleResume = async () => {
    await ttsService.resume();
    setPlaybackState('playing');
  };

  // Play individual guideline
  const handlePlaySingle = async (categoryKey: string, spokenText: string, title: string) => {
    if (activeItemId === categoryKey && playbackState === 'playing') {
      await handlePause();
      return;
    }

    if (activeItemId === categoryKey && playbackState === 'paused') {
      await handleResume();
      return;
    }

    await stopAllAudio();

    // Check voice availability
    const check = await ttsService.checkVoiceAvailability(selectedAudioLang);
    if (!check.available) {
      setVoiceNotice(check.fallbackMessage);
      setTimeout(() => setVoiceNotice(null), 4000);
    }

    setActiveItemId(categoryKey);
    setPlaybackState('playing');
    setNowPlayingText(title);

    await ttsService.speak(spokenText, {
      language: selectedAudioLang,
      onDone: () => {
        setActiveItemId(null);
        setPlaybackState('idle');
        setNowPlayingText('');
      },
      onStopped: () => {
        setActiveItemId(null);
        setPlaybackState('idle');
        setNowPlayingText('');
      },
      onError: () => {
        setActiveItemId(null);
        setPlaybackState('idle');
        setNowPlayingText('');
      },
    });
  };

  // Play all guidelines in sequence
  const handlePlayAll = async () => {
    if (playbackState === 'playing') {
      await handlePause();
      return;
    }
    if (playbackState === 'paused') {
      await handleResume();
      return;
    }

    await stopAllAudio();

    const check = await ttsService.checkVoiceAvailability(selectedAudioLang);
    if (!check.available) {
      setVoiceNotice(check.fallbackMessage);
      setTimeout(() => setVoiceNotice(null), 4000);
    }

    setPlaybackState('playing');
    const filtered = selectedCategory === 'all'
      ? guides
      : guides.filter((g) => g.materialCategory === selectedCategory);

    const sequence = filtered.map((g, idx) => {
      const profile = getSafetyProfile(g.materialCategory, selectedAudioLang);
      const prefix = selectedAudioLang === 'en' ? `Rule ${idx + 1}` : selectedAudioLang === 'mr' ? `नियम ${idx + 1}` : `नियम ${idx + 1}`;
      return {
        id: g.materialCategory,
        textToSpeak: `${prefix}: ${profile.title}. ${profile.audioGuidance}`,
      };
    });

    await ttsService.playSequence(
      sequence,
      selectedAudioLang,
      (_index, id) => {
        setActiveItemId(id);
        const currentGuide = guides.find((g) => g.materialCategory === id);
        if (currentGuide) {
          setNowPlayingText(currentGuide.title);
        }
      },
      () => {
        setPlaybackState('idle');
        setActiveItemId(null);
        setNowPlayingText('');
      }
    );
  };

  const handleLanguageChange = async (newLang: LanguageCode) => {
    setSelectedAudioLang(newLang);
    if (playbackState === 'playing' || activeItemId) {
      await stopAllAudio();
    }
  };

  const audioDict = translations[selectedAudioLang] || translations[appLang];
  const isAudioActive = playbackState === 'playing' || playbackState === 'paused';

  const displayedGuides = selectedCategory === 'all'
    ? guides
    : guides.filter((g) => g.materialCategory === selectedCategory);

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
          <View style={styles.bannerTopRow}>
            <View style={styles.bannerIconCircle}>
              <Ionicons
                name={isAudioActive ? 'volume-high' : 'volume-medium-outline'}
                size={28}
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

          {/* Audio Language Selection Chips (Marathi, Hindi, English) */}
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

          {/* Voice Availability Fallback Alert */}
          {voiceNotice && (
            <View style={styles.fallbackNoticeBox}>
              <Ionicons name="information-circle" size={18} color={colors.warning} />
              <Text style={styles.fallbackNoticeText}>{voiceNotice}</Text>
            </View>
          )}

          {/* Audio Controls (Play, Pause, Stop) with Large Touch Targets (≥48dp) */}
          <View style={styles.controlsRow}>
            {playbackState !== 'playing' ? (
              <TouchableOpacity
                style={[styles.audioCtrlBtn, styles.playAllButton]}
                onPress={handlePlayAll}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Play Audio Guidance"
              >
                <Ionicons name="play" size={24} color={colors.textLight} />
                <Text style={styles.playAllButtonText}>
                  {playbackState === 'paused'
                    ? (audioDict.resumeAudio || 'Resume')
                    : (audioDict.listenAll || 'Listen')}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.audioCtrlBtn, styles.pauseButton]}
                onPress={handlePause}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Pause Audio Guidance"
              >
                <Ionicons name="pause" size={24} color={colors.textLight} />
                <Text style={styles.pauseButtonText}>
                  {audioDict.pauseAudio || 'Pause'}
                </Text>
              </TouchableOpacity>
            )}

            {isAudioActive && (
              <TouchableOpacity
                style={[styles.audioCtrlBtn, styles.stopButton]}
                onPress={stopAllAudio}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Stop Audio Guidance"
              >
                <Ionicons name="stop" size={22} color={colors.textLight} />
                <Text style={styles.stopButtonText}>
                  {audioDict.stopAudio || 'Stop'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Real-time playback status */}
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
            "NOT SURE?" UNKNOWN SCRAP BUTTON
            ========================================= */}
        <TouchableOpacity
          style={[styles.notSureBanner, shadows.sm]}
          onPress={() => setShowNotSureModal(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Not sure about material? Get safe handling guidance"
        >
          <View style={styles.notSureLeft}>
            <View style={styles.notSureIcon}>
              <Ionicons name="help-circle" size={28} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.notSureTitle}>{t('notSure')}</Text>
              <Text style={styles.notSureSub}>{t('notSureDesc')}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#D97706" />
        </TouchableOpacity>

        {/* =========================================
            CATEGORY HORIZONTAL TABS (10 CATEGORIES)
            ========================================= */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabsScroll}
        >
          <TouchableOpacity
            style={[styles.catTab, selectedCategory === 'all' && styles.catTabActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[styles.catTabText, selectedCategory === 'all' && styles.catTabTextActive]}>
              {selectedAudioLang === 'en' ? 'All (10)' : selectedAudioLang === 'mr' ? 'सर्व (१०)' : 'सभी (10)'}
            </Text>
          </TouchableOpacity>

          {DETERMINISTIC_SAFETY_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            const profile = getSafetyProfile(cat.key, selectedAudioLang);
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.catTab, isSelected && styles.catTabActive]}
                onPress={() => setSelectedCategory(cat.key)}
              >
                <MaterialCommunityIcons
                  name={cat.icon as any}
                  size={18}
                  color={isSelected ? colors.textLight : colors.textSecondary}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.catTabText, isSelected && styles.catTabTextActive]}>
                  {profile.title.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* =========================================
            SAFETY GUIDES LIST (PICTORIAL DO / DON'T)
            ========================================= */}
        {isLoadingGuides ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('loading')}</Text>
          </View>
        ) : (
          <View style={styles.cardsList}>
            {displayedGuides.map((guide) => {
              const profile = getSafetyProfile(guide.materialCategory, selectedAudioLang);
              const isPlaying = activeItemId === guide.materialCategory && playbackState === 'playing';
              const isHigh = guide.severity === 'high';

              return (
                <View
                  key={guide.id}
                  style={[
                    styles.guideCard,
                    isHigh ? styles.cardHigh : styles.cardMed,
                    isPlaying && styles.cardPlaying,
                    shadows.sm,
                  ]}
                >
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={[styles.guideIconCircle, { backgroundColor: isHigh ? '#FEE2E2' : '#FEF3C7' }]}>
                        <MaterialCommunityIcons
                          name={profile.icon as any}
                          size={28}
                          color={isHigh ? colors.danger : colors.warning}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.guideTitle}>{profile.title}</Text>
                        <View style={styles.severityBadgeRow}>
                          <View
                            style={[
                              styles.severityBadge,
                              { backgroundColor: isHigh ? '#FEE2E2' : '#FEF3C7' },
                            ]}
                          >
                            <View
                              style={[
                                styles.severityDot,
                                { backgroundColor: isHigh ? colors.danger : '#D97706' },
                              ]}
                            />
                            <Text
                              style={[
                                styles.severityText,
                                { color: isHigh ? colors.danger : '#B45309' },
                              ]}
                            >
                              {isHigh ? 'HIGH RISK' : 'CAUTION'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Listen Button for this guide */}
                    <TouchableOpacity
                      style={[
                        styles.guideListenBtn,
                        isPlaying && styles.guideListenBtnActive,
                      ]}
                      onPress={() =>
                        handlePlaySingle(
                          guide.materialCategory,
                          `${profile.title}. ${profile.audioGuidance}`,
                          profile.title
                        )
                      }
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Listen ${profile.title}`}
                    >
                      <Ionicons
                        name={isPlaying ? 'pause' : 'volume-high'}
                        size={20}
                        color={isPlaying ? colors.textLight : colors.primaryDark}
                      />
                      <Text
                        style={[
                          styles.guideListenText,
                          isPlaying && styles.guideListenTextActive,
                        ]}
                      >
                        {isPlaying ? (audioDict.pauseAudio || 'Pause') : (audioDict.listen || 'Listen')}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Warning Banner */}
                  <View style={styles.warningBox}>
                    <Ionicons name="alert-circle" size={16} color={colors.danger} style={{ marginRight: 6 }} />
                    <Text style={styles.warningText}>{profile.warningBanner}</Text>
                  </View>

                  {/* PICTORIAL DO's SECTION */}
                  <View style={styles.dosSection}>
                    <View style={styles.sectionHeaderRow}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} style={{ marginRight: 4 }} />
                      <Text style={styles.dosHeading}>
                        {selectedAudioLang === 'mr' ? 'करा (DO):' : selectedAudioLang === 'hi' ? 'करें (DO):' : 'DO:'}
                      </Text>
                    </View>
                    {profile.doList.map((item, idx) => (
                      <View key={`do-${idx}`} style={styles.actionRow}>
                        <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
                        <Text style={styles.actionText}>{item}</Text>
                      </View>
                    ))}
                  </View>

                  {/* PICTORIAL DONT's SECTION */}
                  <View style={styles.dontsSection}>
                    <View style={styles.sectionHeaderRow}>
                      <Ionicons name="close-circle" size={16} color={colors.danger} style={{ marginRight: 4 }} />
                      <Text style={styles.dontsHeading}>
                        {selectedAudioLang === 'mr' ? 'करू नका (DON\'T):' : selectedAudioLang === 'hi' ? 'न करें (DON\'T):' : 'DON\'T:'}
                      </Text>
                    </View>
                    {profile.dontList.map((item, idx) => (
                      <View key={`dont-${idx}`} style={styles.actionRow}>
                        <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
                        <Text style={styles.actionText}>{item}</Text>
                      </View>
                    ))}
                  </View>

                  {/* EMERGENCY GUIDANCE */}
                  {profile.emergencyGuidance ? (
                    <View style={styles.emergencyBox}>
                      <Ionicons name="medkit-outline" size={16} color="#B91C1C" />
                      <Text style={styles.emergencyText}>
                        <Text style={{ fontWeight: '700' }}>Emergency: </Text>
                        {profile.emergencyGuidance}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        {/* =========================================
            FIELD FEEDBACK ENTRY BUTTON
            ========================================= */}
        <TouchableOpacity
          style={styles.fieldReportBtn}
          onPress={() => setShowFeedbackModal(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Report usability issue or feedback"
        >
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.fieldReportText}>{t('giveFeedback')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Field Usability Feedback Modal */}
      <FieldFeedbackModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        currentScreen="CollectorSafetyScreen"
      />

      {/* "Not Sure?" Guidance Dialog */}
      {showNotSureModal && (
        <View style={styles.modalBackdrop}>
          <View style={[styles.notSureDialog, shadows.lg]}>
            <View style={styles.dialogTop}>
              <View style={styles.dialogIconBox}>
                <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
              </View>
              <Text style={styles.dialogTitle}>{t('notSure')}</Text>
            </View>

            <Text style={styles.dialogBody}>
              {selectedAudioLang === 'mr'
                ? '१. वस्तू बंद स्थितीत ठेवा, तिला उघडण्याचा प्रयत्न करू नका.\n२. चांगल्या प्रकाशात फोटो काढा.\n३. स्क्रॅपडील AI ला ओळखू द्या.\n४. खात्री नसल्यास अधिकृत रिसायकलरचा सल्ला घ्या.'
                : selectedAudioLang === 'hi'
                ? '1. अज्ञात वस्तु को कभी भी जबरन न खोलें या तोड़ें।\n2. दिन की रोशनी में साफ फोटो लें।\n3. ScrapDeal AI की सहायता लें।\n4. संदेह होने पर केवल अधिकृत रिसाइक्लर को ही सौंपें।'
                : '1. Do NOT force open, puncture, or dismantle unknown devices.\n2. Take a clear photo in good light.\n3. Let ScrapDeal AI suggest the material category.\n4. Hand over directly to a verified recycler.'}
            </Text>

            <TouchableOpacity
              style={styles.dialogBtn}
              onPress={() => {
                setShowNotSureModal(false);
                navigation.navigate('TakePhoto', { categoryId: 'other' });
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={20} color={colors.textLight} />
              <Text style={styles.dialogBtnText}>
                {selectedAudioLang === 'mr' ? 'फोटो काढा (Take Photo)' : selectedAudioLang === 'hi' ? 'फोटो लें (Take Photo)' : 'Take Photo'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dialogCloseBtn}
              onPress={() => setShowNotSureModal(false)}
            >
              <Text style={styles.dialogCloseText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  listenBannerActive: {
    borderColor: colors.primary,
    backgroundColor: '#F0FDF4',
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bannerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  listenTextContainer: {
    flex: 1,
  },
  listenTitle: {
    ...typography.h3,
    color: colors.text,
  },
  listenPrompt: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  languageSection: {
    marginVertical: spacing.sm,
  },
  languageSectionLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  languageChipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
    minHeight: 48, // Touch target
  },
  langChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  chipFlag: {
    marginRight: 4,
    fontSize: 16,
  },
  langChipText: {
    ...typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  langChipTextSelected: {
    color: colors.textLight,
  },
  fallbackNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  fallbackNoticeText: {
    ...typography.caption,
    color: '#92400E',
    fontWeight: '600',
    flex: 1,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  audioCtrlBtn: {
    minHeight: 52, // Large touch target
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  playAllButton: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  playAllButtonText: {
    ...typography.button,
    color: colors.textLight,
  },
  pauseButton: {
    flex: 1,
    backgroundColor: '#D97706',
  },
  pauseButtonText: {
    ...typography.button,
    color: colors.textLight,
  },
  stopButton: {
    backgroundColor: colors.danger,
    minWidth: 100,
  },
  stopButtonText: {
    ...typography.button,
    color: colors.textLight,
  },
  nowPlayingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    backgroundColor: colors.background,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  nowPlayingText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primaryDark,
    flex: 1,
  },
  notSureBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    minHeight: 64, // Large target
  },
  notSureLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  notSureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notSureTitle: {
    ...typography.h3,
    fontSize: 15,
    color: '#92400E',
  },
  notSureSub: {
    ...typography.caption,
    color: '#78350F',
    marginTop: 2,
  },
  categoryTabsScroll: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  catTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    minHeight: 48,
  },
  catTabActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  catTabText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  catTabTextActive: {
    color: colors.textLight,
  },
  loadingBox: {
    paddingVertical: spacing.huge,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  cardsList: {
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  guideCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  cardHigh: {
    borderColor: '#FCA5A5',
  },
  cardMed: {
    borderColor: '#FCD34D',
  },
  cardPlaying: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  guideIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideTitle: {
    ...typography.h3,
    fontSize: 15,
    color: colors.text,
  },
  severityBadgeRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
  },
  severityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  guideListenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: '#DCFCE7',
    minHeight: 48,
  },
  guideListenBtnActive: {
    backgroundColor: colors.primary,
  },
  guideListenText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  guideListenTextActive: {
    color: colors.textLight,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    padding: spacing.sm,
    borderRadius: borderRadius.xs,
    marginBottom: spacing.sm,
  },
  warningText: {
    ...typography.caption,
    fontWeight: '700',
    color: '#991B1B',
    flex: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  dosSection: {
    backgroundColor: '#F0FDF4',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    gap: 4,
  },
  dosHeading: {
    ...typography.caption,
    fontWeight: '800',
    color: '#166534',
  },
  dontsSection: {
    backgroundColor: '#FEF2F2',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    gap: 4,
  },
  dontsHeading: {
    ...typography.caption,
    fontWeight: '800',
    color: '#991B1B',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  actionText: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
    lineHeight: 18,
  },
  emergencyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF1F2',
    padding: spacing.xs,
    borderRadius: borderRadius.xs,
    marginTop: spacing.xs,
  },
  emergencyText: {
    fontSize: 11,
    color: '#9F1239',
    flex: 1,
  },
  fieldReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 48,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  fieldReportText: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  notSureDialog: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 380,
  },
  dialogTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dialogIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogTitle: {
    ...typography.h3,
    color: colors.text,
  },
  dialogBody: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  dialogBtn: {
    minHeight: 52,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  dialogBtnText: {
    ...typography.button,
    color: colors.textLight,
  },
  dialogCloseBtn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogCloseText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
