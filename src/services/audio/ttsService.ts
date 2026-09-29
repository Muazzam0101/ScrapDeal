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

// BCP-47 language tags for Marathi, Hindi, English
const LANG_MAP: Record<LanguageCode, { primary: string; fallbacks: string[] }> = {
  mr: { primary: 'mr-IN', fallbacks: ['mr', 'hi-IN', 'hi'] },
  hi: { primary: 'hi-IN', fallbacks: ['hi', 'mr-IN', 'en-IN'] },
  en: { primary: 'en-IN', fallbacks: ['en-US', 'en-GB', 'en'] },
};

class TTSService {
  private isCurrentlySpeaking: boolean = false;
  private currentQueue: Array<{ text: string; options?: TTSOptions }> = [];
  private queueIndex: number = 0;
  private onQueueProgress?: (index: number) => void;
  private onQueueComplete?: () => void;

  /**
   * Speaks given text in the requested language.
   */
  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    try {
      // Stop any active speech before starting new one
      await this.stop();

      const langCode = options.language || 'hi';
      const langConfig = LANG_MAP[langCode] || LANG_MAP.hi;
      const rate = options.rate ?? 0.9; // Clear and slightly slower for high comprehension
      const pitch = options.pitch ?? 1.0;

      this.isCurrentlySpeaking = true;

      // Platform check: On web, use SpeechSynthesis if available, or expo-speech
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
          this.isCurrentlySpeaking = true;
          if (options.onStart) options.onStart();
        },
        onDone: () => {
          this.isCurrentlySpeaking = false;
          if (options.onDone) options.onDone();
        },
        onStopped: () => {
          this.isCurrentlySpeaking = false;
          if (options.onStopped) options.onStopped();
        },
        onError: (err) => {
          console.warn('[TTSService] Speech error with primary lang, trying fallback:', err);
          // Fallback to secondary language if primary not supported on device
          if (langConfig.fallbacks.length > 0) {
            Speech.speak(text, {
              language: langConfig.fallbacks[0],
              rate,
              pitch,
              onStart: options.onStart,
              onDone: () => {
                this.isCurrentlySpeaking = false;
                if (options.onDone) options.onDone();
              },
              onStopped: () => {
                this.isCurrentlySpeaking = false;
                if (options.onStopped) options.onStopped();
              },
              onError: (fallbackErr) => {
                this.isCurrentlySpeaking = false;
                if (options.onError) options.onError(fallbackErr);
              },
            });
          } else {
            this.isCurrentlySpeaking = false;
            if (options.onError) options.onError(err);
          }
        },
      });
    } catch (err) {
      this.isCurrentlySpeaking = false;
      console.error('[TTSService] speak exception:', err);
      if (options.onError) options.onError(err);
    }
  }

  /**
   * Speaks using Web SpeechSynthesis for 100% browser fidelity.
   */
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

      // Attempt to find best matching voice
      const voices = window.speechSynthesis.getVoices();
      const allCandidates = [langConfig.primary, ...langConfig.fallbacks];
      let matchedVoice = null;

      for (const lang of allCandidates) {
        matchedVoice = voices.find(
          (v) => v.lang.toLowerCase() === lang.toLowerCase() || v.lang.toLowerCase().startsWith(lang.toLowerCase().slice(0, 2))
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
        this.isCurrentlySpeaking = true;
        if (options.onStart) options.onStart();
      };

      utterance.onend = () => {
        this.isCurrentlySpeaking = false;
        if (options.onDone) options.onDone();
      };

      utterance.onerror = (e) => {
        this.isCurrentlySpeaking = false;
        console.warn('[TTSService] Web speech synthesis error:', e);
        if (options.onError) options.onError(e);
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      this.isCurrentlySpeaking = false;
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

    this.currentQueue = items.map((item) => ({
      text: item.textToSpeak,
      options: { language },
    }));
    this.queueIndex = 0;
    this.onQueueProgress = (idx) => onStepStart(idx, items[idx].id);
    this.onQueueComplete = onComplete;

    this.playNextInQueue();
  }

  private playNextInQueue() {
    if (this.queueIndex >= this.currentQueue.length) {
      this.isCurrentlySpeaking = false;
      if (this.onQueueComplete) this.onQueueComplete();
      return;
    }

    const currentItem = this.currentQueue[this.queueIndex];
    const currentIndex = this.queueIndex;

    if (this.onQueueProgress) {
      this.onQueueProgress(currentIndex);
    }

    this.speak(currentItem.text, {
      ...currentItem.options,
      onDone: () => {
        this.queueIndex++;
        // Small pause between items for natural flow
        setTimeout(() => {
          if (this.isCurrentlySpeaking || this.queueIndex < this.currentQueue.length) {
            this.playNextInQueue();
          }
        }, 600);
      },
      onStopped: () => {
        this.isCurrentlySpeaking = false;
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
    this.isCurrentlySpeaking = false;
    this.currentQueue = [];
    this.queueIndex = 0;

    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {}

    try {
      await Speech.stop();
    } catch (e) {
      // Ignore if not speaking
    }
  }

  /**
   * Checks if TTS is currently active.
   */
  async isSpeaking(): Promise<boolean> {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return window.speechSynthesis.speaking;
    }
    try {
      return await Speech.isSpeakingAsync();
    } catch {
      return this.isCurrentlySpeaking;
    }
  }
}

export const ttsService = new TTSService();
