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
import { vietnameseAudioFallback } from '../audio/VietnameseAudioFallback';

/**
 * Generate Google TTS audio URL (browser-native, pure Web API, no Node url dependency)
 * Produces authentic Northern Vietnamese Female voice ('vi' locale, tw-ob client)
 */
function getGoogleTTSAudioUrl(text: string, lang = 'vi', slow = false): string {
  const params = new URLSearchParams({
    ie: 'UTF-8',
    q: text,
    tl: lang,
    total: '1',
    idx: '0',
    textlen: String(text.length),
    client: 'tw-ob',
    prev: 'input',
    ttsspeed: slow ? '0.24' : '1',
  });
  return `https://translate.google.com/translate_tts?${params.toString()}`;
}

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
      'ngọc huyền 2.0',
      'ngọc huyền',
      'ngoc huyen 2.0',
      'ngoc huyen',
      'huyền',
      'huyen',
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
  private activeAudio: HTMLAudioElement | null = null;
  private isSpeaking = false;
  private isInstructionSpeaking = false;
  private listeners: Set<(speaking: boolean) => void> = new Set();
  private audioCache: Map<string, HTMLAudioElement> = new Map();

  constructor() {
    this.init();
    this.preloadCommonPhrases();
  }

  /**
   * Preload frequent short Vietnamese UI sentences into memory cache
   * Provides 0ms instant playback for cheers and praises on Safari
   */
  public preloadCommonPhrases() {
    if (typeof window === 'undefined') return;
    const phrases = [
      'Chào bé!',
      'Giỏi quá!',
      'Yeahhh!',
      'Tuyệt!',
      'Thử lại nhé!',
      'Đúng rồi!',
      'Bé làm tốt lắm!',
      'Cùng chơi nhé!',
      'Bé hãy lắng nghe!',
    ];
    phrases.forEach((phrase) => {
      try {
        const url = getGoogleTTSAudioUrl(phrase, 'vi');
        const audio = new Audio(url);
        audio.preload = 'auto';
        this.audioCache.set(phrase, audio);
      } catch (_) {}
    });
  }

  public isInstructionActive(): boolean {
    return this.isInstructionSpeaking;
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
    if (this.activeAudio) {
      try {
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
      } catch (_) {}
      this.activeAudio = null;
    }
    try {
      vietnameseAudioFallback.stop();
    } catch (_) {}
    if (this.isSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    this.isSpeaking = false;
    this.activeUtterance = null;
    (window as any).__kidsVoiceUtterance = null;
    this.notify(false);
    try {
      kidsAudioManager.restoreMusic();
    } catch (_) {}
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
    const cleanText = (text || '').trim();
    if (!cleanText) {
      options.onEnd?.();
      return;
    }

    // Always stop any previous speech (English or Vietnamese) to prevent voice overlapping!
    this.stop();

    if (!this.isSupported()) {
      this.speakEnglishBackendFallback(cleanText, options);
      return;
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = VOICE_CONFIG.english.language;
      utterance.rate = options.rate ?? VOICE_CONFIG.english.rate;
      utterance.pitch = options.pitch ?? VOICE_CONFIG.english.pitch;
      utterance.volume = options.volume ?? 1;

      const voice = this.getBestEnglishVoice();
      if (voice) utterance.voice = voice;

      this.activeUtterance = utterance;
      // Strong global reference preventing iOS Safari garbage collection
      (window as any).__kidsVoiceUtterance = utterance;

      utterance.onstart = () => {
        this.notify(true);
        kidsAudioManager.duckMusic();
        options.onStart?.();
      };

      utterance.onend = () => {
        this.notify(false);
        kidsAudioManager.restoreMusic();
        this.activeUtterance = null;
        (window as any).__kidsVoiceUtterance = null;
        options.onEnd?.();
      };

      utterance.onerror = (e) => {
        this.notify(false);
        kidsAudioManager.restoreMusic();
        this.activeUtterance = null;
        (window as any).__kidsVoiceUtterance = null;
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          // Fallback to backend TTS proxy for English
          this.speakEnglishBackendFallback(cleanText, options);
        } else {
          options.onEnd?.();
        }
      };

      // Slight delay for iOS Safari speech queue stability
      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance);
        } catch (_) {
          this.speakEnglishBackendFallback(cleanText, options);
        }
      }, 10);
    } catch (err) {
      this.speakEnglishBackendFallback(cleanText, options);
    }
  }

  /**
   * Speak Vietnamese text using authentic Northern female voice (Hanoi accent)
   * Powered by google-tts-api for 100% reliable iOS Safari & tablet playback
   */
  public speakVietnameseNorthern(text: string, options: VoiceOptions = {}) {
    return this.speakVietnamese(text, options);
  }

  public speakVietnamese(text: string, options: VoiceOptions = {}) {
    const cleanText = (text || '').trim();
    if (!cleanText) {
      options.onEnd?.();
      return;
    }

    this.stop();

    // 1. High-Quality Northern Female Voice via Backend Proxy TTS
    // Solves Safari/iOS bug where Google TTS is blocked by CORS/Referer
    // and prevents Safari from reading Vietnamese in an English accent!
    try {
      if (cleanText.length <= 300) {
        let audio: HTMLAudioElement;
        const cached = this.audioCache.get(`vi:${cleanText}`);
        if (cached) {
          audio = cached.cloneNode(true) as HTMLAudioElement;
        } else {
          // Direct backend proxy route that streams authentic Vietnamese TTS (Northern female voice)
          const proxyUrl = `/api/v1/vocabulary/tts?text=${encodeURIComponent(cleanText)}&lang=vi`;
          audio = new Audio(proxyUrl);
          this.audioCache.set(`vi:${cleanText}`, audio);
        }

        this.activeAudio = audio;
        this.notify(true);
        kidsAudioManager.duckMusic();
        options.onStart?.();

        audio.onended = () => {
          this.notify(false);
          kidsAudioManager.restoreMusic();
          this.activeAudio = null;
          options.onEnd?.();
        };

        audio.onerror = () => {
          // If proxy fails, try direct Google TTS before falling back
          this.fallbackToDirectGoogleTTS(cleanText, options);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            this.fallbackToDirectGoogleTTS(cleanText, options);
          });
        }
        return;
      }
    } catch (_) {}

    // 2. Fallback to Browser SpeechSynthesis if text is very long or offline
    this.speakVietnameseBrowserFallback(cleanText, options);
  }

  public speakEnglishBackendFallback(cleanText: string, options: VoiceOptions = {}) {
    try {
      let audio: HTMLAudioElement;
      const cached = this.audioCache.get(`en:${cleanText}`);
      if (cached) {
        audio = cached.cloneNode(true) as HTMLAudioElement;
      } else {
        const proxyUrl = `/api/v1/vocabulary/tts?text=${encodeURIComponent(cleanText)}&lang=en`;
        audio = new Audio(proxyUrl);
        this.audioCache.set(`en:${cleanText}`, audio);
      }

      this.activeAudio = audio;
      this.notify(true);
      kidsAudioManager.duckMusic();
      options.onStart?.();

      audio.onended = () => {
        this.notify(false);
        kidsAudioManager.restoreMusic();
        this.activeAudio = null;
        options.onEnd?.();
      };

      audio.onerror = () => {
        this.notify(false);
        kidsAudioManager.restoreMusic();
        this.activeAudio = null;
        options.onEnd?.();
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          this.notify(false);
          kidsAudioManager.restoreMusic();
          this.activeAudio = null;
          options.onEnd?.();
        });
      }
    } catch (_) {
      this.notify(false);
      kidsAudioManager.restoreMusic();
      options.onEnd?.();
    }
  }

  private fallbackToDirectGoogleTTS(cleanText: string, options: VoiceOptions = {}) {
    try {
      const url = getGoogleTTSAudioUrl(cleanText, 'vi');
      const audio = new Audio(url);
      this.activeAudio = audio;

      audio.onended = () => {
        this.notify(false);
        kidsAudioManager.restoreMusic();
        this.activeAudio = null;
        options.onEnd?.();
      };

      audio.onerror = () => {
        this.speakVietnameseBrowserFallback(cleanText, options);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          this.speakVietnameseBrowserFallback(cleanText, options);
        });
      }
    } catch (_) {
      this.speakVietnameseBrowserFallback(cleanText, options);
    }
  }

  /**
   * Dedicated Instruction Speaker that tracks instruction playback state
   * Used by GameGuide and Activities so user interaction is strictly disabled until speech ends
   */
  public speakInstruction(text: string, lang: 'vi' | 'en' = 'vi', options: VoiceOptions = {}) {
    this.isInstructionSpeaking = true;
    const wrappedOptions: VoiceOptions = {
      ...options,
      onStart: () => {
        this.isInstructionSpeaking = true;
        options.onStart?.();
      },
      onEnd: () => {
        this.isInstructionSpeaking = false;
        options.onEnd?.();
      },
      onError: (err) => {
        this.isInstructionSpeaking = false;
        options.onError?.(err);
      },
    };

    if (lang === 'vi') {
      this.speakVietnamese(text, wrappedOptions);
    } else {
      this.speakEnglish(text, wrappedOptions);
    }
  }

  private speakVietnameseBrowserFallback(cleanText: string, options: VoiceOptions = {}) {
    const viVoice = this.getNorthernFemaleVietnameseVoice();

    // CRITICAL PROTECTION FOR SAFARI / IOS:
    // If no genuine Vietnamese voice is downloaded, Safari will silently fall back to
    // Samantha / Siri English, reading Vietnamese words with an English accent ("bee lahm doong roy").
    // To prevent this disastrous UX, we NEVER pass Vietnamese to speechSynthesizer unless
    // a genuine Vietnamese voice is verified and available.
    const isRealViVoice = viVoice && (
      viVoice.lang.toLowerCase().startsWith('vi') ||
      viVoice.name.toLowerCase().includes('vietnam') ||
      viVoice.name.toLowerCase().includes('linh') ||
      viVoice.name.toLowerCase().includes('mai') ||
      viVoice.name.toLowerCase().includes('an')
    );

    const isSafari = typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    // On iOS Safari, if the Vietnamese voice is not local, Safari defaults to English
    const isSafeToSpeakNative = isRealViVoice && (!isSafari || viVoice.localService !== false);

    if (!isSafeToSpeakNative || !this.isSupported()) {
      vietnameseAudioFallback.playPraiseChime(cleanText, () => {
        this.notify(false);
        kidsAudioManager.restoreMusic();
        options.onEnd?.();
      });
      return;
    }

    try {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = VOICE_CONFIG.vietnamese.language;
      utterance.rate = options.rate ?? VOICE_CONFIG.vietnamese.rate;
      utterance.pitch = options.pitch ?? VOICE_CONFIG.vietnamese.pitch;
      utterance.volume = options.volume ?? 1;
      utterance.voice = viVoice;

      this.activeUtterance = utterance;
      // Strong global reference preventing iOS Safari garbage collection
      (window as any).__kidsVoiceUtterance = utterance;

      utterance.onstart = () => {
        this.notify(true);
        kidsAudioManager.duckMusic();
        options.onStart?.();
      };

      utterance.onend = () => {
        this.notify(false);
        kidsAudioManager.restoreMusic();
        this.activeUtterance = null;
        (window as any).__kidsVoiceUtterance = null;
        options.onEnd?.();
      };

      utterance.onerror = (e) => {
        this.notify(false);
        kidsAudioManager.restoreMusic();
        this.activeUtterance = null;
        (window as any).__kidsVoiceUtterance = null;
        vietnameseAudioFallback.playPraiseChime(cleanText, () => {
          options.onEnd?.();
        });
      };

      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance);
        } catch (_) {
          vietnameseAudioFallback.playPraiseChime(cleanText, () => {
            options.onEnd?.();
          });
        }
      }, 10);
    } catch (err) {
      this.notify(false);
      kidsAudioManager.restoreMusic();
      vietnameseAudioFallback.playPraiseChime(cleanText, () => {
        options.onEnd?.();
      });
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

  /**
   * Confident, futuristic robot voice (Deep pitch, clear robotic cadence)
   */
  public speakRobotVoice(phrase: string, options: VoiceOptions = {}) {
    this.speakEnglish(phrase, {
      pitch: 0.65, // Deeper, mechanical pitch
      rate: 0.84,  // Measured, authoritative robotic cadence
      ...options,
    });
  }
}

export const voiceService = new VoiceService();

export default voiceService;
