import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { LanguageCode } from '../../types';

export interface TTSOptions {
  language?: LanguageCode;
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onDone?: () => void;
  onStopped?: () => void;
  onError?: (error: any) => void;
}

export type PlaybackState = 'idle' | 'playing' | 'paused' | 'stopped';

// BCP-47 language tags for Marathi, Hindi, English
export const LANG_MAP: Record<LanguageCode, { primary: string; fallbacks: string[] }> = {
  mr: { primary: 'mr-IN', fallbacks: ['mr', 'hi-IN', 'hi'] },
  hi: { primary: 'hi-IN', fallbacks: ['hi', 'mr-IN', 'en-IN'] },
  en: { primary: 'en-IN', fallbacks: ['en-US', 'en-GB', 'en'] },
};

export const FALLBACK_VOICE_MESSAGES: Record<LanguageCode, string> = {
  hi: 'आवाज उपलब्ध नहीं है। कृपया निर्देश पढ़ें।',
  mr: 'आवाज उपलब्ध नाही. कृपया सूचना वाचा.',
  en: 'Voice unavailable. Please read the instructions.',
};

class TTSService {
  private playbackState: PlaybackState = 'idle';
  private currentQueue: Array<{ id?: string; text: string; options?: TTSOptions }> = [];
  private queueIndex: number = 0;
  private currentText: string = '';
  private currentLanguage: LanguageCode = 'hi';
  private onQueueProgress?: (index: number, id?: string) => void;
  private onQueueComplete?: () => void;

  /**
   * Returns current playback state
   */
  getState(): PlaybackState {
    return this.playbackState;
  }

  /**
   * Checks if language voice is available on device.
   */
  async checkVoiceAvailability(langCode: LanguageCode): Promise<{ available: boolean; fallbackMessage: string }> {
    const fallbackMessage = FALLBACK_VOICE_MESSAGES[langCode] || FALLBACK_VOICE_MESSAGES.en;

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        return { available: true, fallbackMessage };
      }
      return { available: false, fallbackMessage };
    }

    try {
      const voices = await Speech.getAvailableVoicesAsync();
      if (!voices || voices.length === 0) {
        // Many Android devices do not enumerate voices via Expo API but still speak using Google TTS engine
        return { available: true, fallbackMessage };
      }

      const target = LANG_MAP[langCode];
      const match = voices.some((v) => {
        const vl = (v.language || '').toLowerCase();
        return vl.startsWith(target.primary.toLowerCase()) || target.fallbacks.some((f) => vl.startsWith(f.toLowerCase()));
      });

      return { available: match || voices.length > 0, fallbackMessage };
    } catch {
      // Default to optimistic true so speech engine attempts native speech
      return { available: true, fallbackMessage };
    }
  }

  /**
   * Speaks given text in the requested language.
   */
  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    try {
      await this.stop();

      const langCode = options.language || 'hi';
      this.currentLanguage = langCode;
      this.currentText = text;
      const langConfig = LANG_MAP[langCode] || LANG_MAP.hi;
      const rate = options.rate ?? 0.88; // Clear and slightly slower for informal collectors
      const pitch = options.pitch ?? 1.0;

      this.playbackState = 'playing';

      // Web platform check
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        this.speakWeb(text, langConfig, rate, pitch, options);
        return;
      }

      // Native Expo Speech (Android & iOS)
      Speech.speak(text, {
        language: langConfig.primary,
        rate,
        pitch,
        onStart: () => {
          this.playbackState = 'playing';
          if (options.onStart) options.onStart();
        },
        onDone: () => {
          this.playbackState = 'idle';
          if (options.onDone) options.onDone();
        },
        onStopped: () => {
          this.playbackState = 'stopped';
          if (options.onStopped) options.onStopped();
        },
        onError: (err) => {
          console.warn('[TTSService] Speech error with primary lang, trying fallback:', err);
          if (langConfig.fallbacks.length > 0) {
            Speech.speak(text, {
              language: langConfig.fallbacks[0],
              rate,
              pitch,
              onStart: options.onStart,
              onDone: () => {
                this.playbackState = 'idle';
                if (options.onDone) options.onDone();
              },
              onStopped: () => {
                this.playbackState = 'stopped';
                if (options.onStopped) options.onStopped();
              },
              onError: (fallbackErr) => {
                this.playbackState = 'idle';
                if (options.onError) options.onError(fallbackErr);
              },
            });
          } else {
            this.playbackState = 'idle';
            if (options.onError) options.onError(err);
          }
        },
      });
    } catch (err) {
      this.playbackState = 'idle';
      console.error('[TTSService] speak exception:', err);
      if (options.onError) options.onError(err);
    }
  }

  /**
   * Pauses audio guidance where supported.
   */
  async pause(): Promise<void> {
    if (this.playbackState !== 'playing') return;

    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.pause();
        this.playbackState = 'paused';
        return;
      } catch {}
    }

    try {
      await Speech.pause();
      this.playbackState = 'paused';
    } catch {
      // If native pause not supported on Android version, stop gracefully
      await this.stop();
      this.playbackState = 'paused';
    }
  }

  /**
   * Resumes paused audio guidance where supported.
   */
  async resume(): Promise<void> {
    if (this.playbackState !== 'paused') return;

    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
        this.playbackState = 'playing';
        return;
      } catch {}
    }

    try {
      await Speech.resume();
      this.playbackState = 'playing';
    } catch {
      // Re-trigger current text if resume not supported natively
      if (this.currentText) {
        await this.speak(this.currentText, { language: this.currentLanguage });
      }
    }
  }

  private speakWeb(
    text: string,
    langConfig: { primary: string; fallbacks: string[] },
    rate: number,
    pitch: number,
    options: TTSOptions
  ) {
    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;

      const voices = window.speechSynthesis.getVoices();
      const allCandidates = [langConfig.primary, ...langConfig.fallbacks];
      let matchedVoice = null;

      for (const lang of allCandidates) {
        matchedVoice = voices.find(
          (v) =>
            v.lang.toLowerCase() === lang.toLowerCase() ||
            v.lang.toLowerCase().startsWith(lang.toLowerCase().slice(0, 2))
        );
        if (matchedVoice) {
          utterance.voice = matchedVoice;
          utterance.lang = matchedVoice.lang;
          break;
        }
      }

      if (!matchedVoice) {
        utterance.lang = langConfig.primary;
      }

      utterance.onstart = () => {
        this.playbackState = 'playing';
        if (options.onStart) options.onStart();
      };

      utterance.onend = () => {
        this.playbackState = 'idle';
        if (options.onDone) options.onDone();
      };

      utterance.onerror = (e) => {
        this.playbackState = 'idle';
        console.warn('[TTSService] Web speech error:', e);
        if (options.onError) options.onError(e);
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      this.playbackState = 'idle';
      if (options.onError) options.onError(e);
    }
  }

  /**
   * Reads a sequence of safety guidelines step by step.
   */
  async playSequence(
    items: Array<{ id: string; textToSpeak: string }>,
    language: LanguageCode,
    onStepStart: (index: number, id: string) => void,
    onComplete: () => void
  ): Promise<void> {
    await this.stop();
    if (!items || items.length === 0) {
      onComplete();
      return;
    }

    this.currentLanguage = language;
    this.currentQueue = items.map((item) => ({
      id: item.id,
      text: item.textToSpeak,
      options: { language },
    }));
    this.queueIndex = 0;
    this.onQueueProgress = (idx, id) => onStepStart(idx, id || items[idx].id);
    this.onQueueComplete = onComplete;

    this.playNextInQueue();
  }

  private playNextInQueue() {
    if (this.queueIndex >= this.currentQueue.length) {
      this.playbackState = 'idle';
      if (this.onQueueComplete) this.onQueueComplete();
      return;
    }

    const currentItem = this.currentQueue[this.queueIndex];
    const currentIndex = this.queueIndex;

    if (this.onQueueProgress) {
      this.onQueueProgress(currentIndex, currentItem.id);
    }

    this.speak(currentItem.text, {
      ...currentItem.options,
      onDone: () => {
        this.queueIndex++;
        setTimeout(() => {
          if (this.playbackState === 'playing' || this.queueIndex < this.currentQueue.length) {
            this.playNextInQueue();
          }
        }, 500);
      },
      onStopped: () => {
        this.playbackState = 'stopped';
        this.currentQueue = [];
      },
      onError: () => {
        this.queueIndex++;
        this.playNextInQueue();
      },
    });
  }

  /**
   * Immediately stops any speech playback and clears queues.
   */
  async stop(): Promise<void> {
    this.playbackState = 'stopped';
    this.currentQueue = [];
    this.queueIndex = 0;
    this.currentText = '';

    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {}

    try {
      await Speech.stop();
    } catch {
      // Ignore if already stopped
    }
  }

  /**
   * Checks if TTS is currently active.
   */
  async isSpeaking(): Promise<boolean> {
    if (this.playbackState === 'playing') return true;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return window.speechSynthesis.speaking;
    }
    try {
      return await Speech.isSpeakingAsync();
    } catch {
      return false;
    }
  }
}

export const ttsService = new TTSService();
