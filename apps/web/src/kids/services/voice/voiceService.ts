/**
 * voiceService.ts
 * Centralized Voice Management Service for Kids Learning System
 * 
 * Rules & Guarantees:
 * - Clear English pronunciation tailored for kids (slower, friendly cadence)
 * - Authentic Northern Vietnamese Female voice ("Giọng nữ miền Bắc") for Vietnamese
 * - Centralized VOICE_CONFIG with smart browser voice detection & fallback
 * - Unified API: speakEnglish, speakVietnamese, speakWord, speakSentence
 */

import { kidsAudioManager } from '../audio/KidsAudioManager';

export interface VoiceOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export const VOICE_CONFIG = {
  english: {
    language: 'en-US',
    rate: 0.82, // Friendly, clear pacing for young learners
    pitch: 1.06,
    preferredKeywords: [
      'google us english',
      'natural',
      'samantha',
      'karen',
      'jenny',
      'aria',
      'en-us',
    ],
  },
  vietnamese: {
    language: 'vi-VN',
    rate: 0.88, // Natural, clear Northern female pacing
    pitch: 1.15, // Sweet, gentle pitch
    northernFemaleKeywords: [
      'hoaimy',
      'hoài my',
      'an online',
      'an (natural)',
      'an - vietnamese',
      'microsoft an',
      'linh',
      'mai',
      'huong',
      'hương',
      'ngoc',
      'ngọc',
      'ha',
      'hà',
      'phuong',
      'phương',
      'chi',
      'trang',
      'thao',
      'northern',
      'hanoi',
      'female',
    ],
  },
};

class VoiceService {
  private voices: SpeechSynthesisVoice[] = [];
  private isReady = false;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private listeners: Set<(speaking: boolean) => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const load = () => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) {
        this.voices = v;
        this.isReady = true;
      }
    };

    load();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = load;
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0 && this.isSupported()) {
      this.voices = window.speechSynthesis.getVoices() || [];
    }
    return this.voices;
  }

  /**
   * Detect best English voice for children
   */
  public getBestEnglishVoice(): SpeechSynthesisVoice | null {
    const all = this.getAvailableVoices();
    const enVoices = all.filter((v) => v.lang.toLowerCase().startsWith('en'));
    if (enVoices.length === 0) return null;

    for (const kw of VOICE_CONFIG.english.preferredKeywords) {
      const match = enVoices.find(
        (v) =>
          v.name.toLowerCase().includes(kw) ||
          v.voiceURI.toLowerCase().includes(kw)
      );
      if (match) return match;
    }

    return enVoices[0];
  }

  /**
   * Detect authentic Northern Vietnamese Female Voice ("Giọng nữ miền Bắc")
   * Explicitly avoids any male voice (e.g. NamMinh)
   */
  public getNorthernFemaleVietnameseVoice(): SpeechSynthesisVoice | null {
    const all = this.getAvailableVoices();
    const viVoices = all.filter(
      (v) =>
        v.lang.toLowerCase().startsWith('vi') ||
        v.lang.toLowerCase() === 'vi-vn' ||
        v.name.toLowerCase().includes('vietnam')
    );

    if (viVoices.length === 0) return null;

    // 1. Search for prioritized Northern female voice names
    for (const kw of VOICE_CONFIG.vietnamese.northernFemaleKeywords) {
      const match = viVoices.find((v) => {
        const name = v.name.toLowerCase();
        const uri = v.voiceURI.toLowerCase();
        const isMale = name.includes('namminh') || name.includes('male') || uri.includes('namminh');
        return !isMale && (name.includes(kw) || uri.includes(kw));
      });
      if (match) return match;
    }

    // 2. Fallback: Any non-male Vietnamese voice
    const femaleVoice = viVoices.find((v) => {
      const name = v.name.toLowerCase();
      const uri = v.voiceURI.toLowerCase();
      return !name.includes('namminh') && !name.includes('male') && !uri.includes('namminh');
    });

    return femaleVoice || viVoices[0];
  }

  public stop() {
    if (!this.isSupported()) return;
    try {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.activeUtterance = null;
      this.notify(false);
    } catch {}
  }

  private notify(speaking: boolean) {
    this.isSpeaking = speaking;
    this.listeners.forEach((fn) => fn(speaking));
  }

  public onSpeakingChange(fn: (speaking: boolean) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /**
   * Speak English text with child-friendly cadence
   */
  public speakEnglish(text: string, options: VoiceOptions = {}) {
    if (!this.isSupported() || !text.trim()) {
      options.onEnd?.();
      return;
    }

    try {
      this.stop();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.lang = VOICE_CONFIG.english.language;
      utterance.rate = options.rate ?? VOICE_CONFIG.english.rate;
      utterance.pitch = options.pitch ?? VOICE_CONFIG.english.pitch;
      utterance.volume = options.volume ?? 1;

      const voice = this.getBestEnglishVoice();
      if (voice) utterance.voice = voice;

      this.activeUtterance = utterance;

      utterance.onstart = () => {
        this.notify(true);
        kidsAudioManager.duckMusic();
        options.onStart?.();
      };

      utterance.onend = () => {
        this.notify(false);
        kidsAudioManager.restoreMusic();
        this.activeUtterance = null;
        options.onEnd?.();
      };

      utterance.onerror = (e) => {
        this.notify(false);
        kidsAudioManager.restoreMusic();
        this.activeUtterance = null;
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          options.onError?.(e);
        }
        options.onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      this.notify(false);
      kidsAudioManager.restoreMusic();
      options.onError?.(err);
      options.onEnd?.();
    }
  }

  /**
   * Speak Vietnamese text using authentic Northern female voice (Hanoi accent)
   */
  public speakVietnamese(text: string, options: VoiceOptions = {}) {
    if (!this.isSupported() || !text.trim()) {
      options.onEnd?.();
      return;
    }

    try {
      this.stop();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.lang = VOICE_CONFIG.vietnamese.language;
      utterance.rate = options.rate ?? VOICE_CONFIG.vietnamese.rate;
      utterance.pitch = options.pitch ?? VOICE_CONFIG.vietnamese.pitch;
      utterance.volume = options.volume ?? 1;

      const viVoice = this.getNorthernFemaleVietnameseVoice();
      if (viVoice) utterance.voice = viVoice;

      this.activeUtterance = utterance;

      utterance.onstart = () => {
        this.notify(true);
        kidsAudioManager.duckMusic();
        options.onStart?.();
      };

      utterance.onend = () => {
        this.notify(false);
        kidsAudioManager.restoreMusic();
        this.activeUtterance = null;
        options.onEnd?.();
      };

      utterance.onerror = (e) => {
        this.notify(false);
        kidsAudioManager.restoreMusic();
        this.activeUtterance = null;
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          options.onError?.(e);
        }
        options.onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      this.notify(false);
      kidsAudioManager.restoreMusic();
      options.onError?.(err);
      options.onEnd?.();
    }
  }

  /**
   * Dual Bilingual Speech: Speaks English first, pauses slightly, then speaks Northern Vietnamese
   */
  public speakBilingual(englishText: string, vietnameseText: string, onFinish?: () => void) {
    this.speakEnglish(englishText, {
      onEnd: () => {
        setTimeout(() => {
          this.speakVietnamese(vietnameseText, {
            onEnd: onFinish,
          });
        }, 350);
      },
      onError: () => {
        this.speakVietnamese(vietnameseText, { onEnd: onFinish });
      },
    });
  }

  /**
   * Convenience: Speak single English word clearly
   */
  public speakWord(word: string, options: VoiceOptions = {}) {
    this.speakEnglish(word, {
      rate: options.rate ?? 0.78, // Extra clear for single words
      ...options,
    });
  }

  /**
   * Convenience: Speak full English sentence
   */
  public speakSentence(sentence: string, options: VoiceOptions = {}) {
    this.speakEnglish(sentence, {
      rate: options.rate ?? 0.85,
      ...options,
    });
  }
}

export const voiceService = new VoiceService();
export default voiceService;
