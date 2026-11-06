/**
 * Mobile-First Audio Engine for VocabFlow
 * Solves iOS Safari & Android Chrome Autoplay Restrictions, AudioContext Suspensions,
 * SpeechSynthesis GC bugs, and provides dual-tier (Dictionary Audio + Web Speech API) playback.
 */

import { Capacitor } from '@capacitor/core';
import { resolveApiBaseUrl } from './api';

// Global registry preventing V8 / WebKit garbage collection from cutting off speech mid-sentence
const activeSpeechUtterances = new Set<SpeechSynthesisUtterance>();

class AudioEngine {
  private sharedAudio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private isUnlocked = false;
  private currentSessionId = 0;
  private isCurrentlyPlaying = false;
  private activeStopCallback: (() => void) | null = null;
  private preferredVoiceLang: 'vi' | 'en' | 'auto' = 'vi'; // Default to Vietnamese voice
  private preferredVoiceGender: 'male' | 'female' = 'male'; // Default: Giọng Nam chuẩn bản xứ

  constructor() {
    this.initAutoUnlock();
  }

  public setPreferredVoiceGender(gender: 'male' | 'female') {
    this.preferredVoiceGender = gender;
    try {
      localStorage.setItem('vocabflow_voice_gender', gender);
    } catch (_) {}
  }

  public getPreferredVoiceGender(): 'male' | 'female' {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vocabflow_voice_gender');
      if (saved === 'male' || saved === 'female') {
        this.preferredVoiceGender = saved;
      }
    }
    return this.preferredVoiceGender;
  }

  public setPreferredVoiceLang(mode: 'vi' | 'en' | 'auto') {
    this.preferredVoiceLang = mode;
    try {
      localStorage.setItem('vocabflow_voice_lang', mode);
    } catch (_) {}
  }

  public getPreferredVoiceLang(): 'vi' | 'en' | 'auto' {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vocabflow_voice_lang');
      if (saved === 'vi' || saved === 'en' || saved === 'auto') {
        this.preferredVoiceLang = saved;
      }
    }
    return this.preferredVoiceLang;
  }

  private preferredTargetLocale: string = 'en-US';

  public setPreferredTargetLocale(locale: string) {
    if (!locale) return;
    this.preferredTargetLocale = locale;
    try {
      localStorage.setItem('vocabflow_target_locale', locale);
    } catch (_) {}
  }

  public getPreferredTargetLocale(): string {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vocabflow_target_locale');
      if (saved) {
        this.preferredTargetLocale = saved;
      }
    }
    return this.preferredTargetLocale;
  }

  /**
   * Automatically detects the script / language family of a given text to ensure
   * the correct SpeechSynthesis voice or TTS engine is used even if the default
   * or passed locale does not match the actual text script (e.g. Chinese Hanzi, Japanese Kana, Korean Hangul).
   */
  public detectScriptLocale(text: string, defaultLocale: string = 'en-US'): string {
    const clean = (text || '').trim();
    if (!clean) return defaultLocale;

    // Detect CJK Chinese Hanzi characters (Unified Ideographs & Extensions)
    if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(clean)) {
      return 'zh-CN';
    }
    // Detect Japanese Hiragana / Katakana
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(clean)) {
      return 'ja-JP';
    }
    // Detect Korean Hangul
    if (/[\uac00-\ud7af\u1100-\u11ff]/.test(clean)) {
      return 'ko-KR';
    }
    // Detect Thai script
    if (/[\u0e00-\u0e7f]/.test(clean)) {
      return 'th-TH';
    }
    // Detect Cyrillic (Russian)
    if (/[\u0400-\u04ff]/.test(clean)) {
      return 'ru-RU';
    }
    // Detect Arabic script
    if (/[\u0600-\u06ff]/.test(clean)) {
      return 'ar-SA';
    }
    // Detect Vietnamese tone marks
    if (/[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(clean)) {
      return 'vi-VN';
    }

    return defaultLocale;
  }

  /**
   * Resolves any relative API or TTS path into an absolute URL when running on Native Capacitor (Android/iOS)
   * to prevent ERR_CONNECTION_REFUSED or 404 against localhost in WebView.
   */
  public resolveFullAudioUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }
    const baseUrl = resolveApiBaseUrl();
    const cleanPath = url.replace(/^\/?api\/v1\/?/, '').replace(/^\/+/, '');
    return `${baseUrl}/${cleanPath}`;
  }

  /**
   * Initializes automatic unlocking of audio primitives on the first user interaction.
   * Mobile browsers (iOS Safari, Chrome Mobile) require a user gesture to unlock Audio and AudioContext.
   */
  private initAutoUnlock() {
    if (typeof window === 'undefined') return;

    const unlockHandler = () => {
      this.unlock();
      // Remove listeners once unlocked
      ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown'].forEach((evt) => {
        window.removeEventListener(evt, unlockHandler);
      });
    };

    ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown'].forEach((evt) => {
      window.addEventListener(evt, unlockHandler, { once: true, passive: true });
    });
  }

  /**
   * Unlocks HTML5 Audio, Web Audio AudioContext, and SpeechSynthesis
   */
  public unlock() {
    if (this.isUnlocked || typeof window === 'undefined') return;

    try {
      // 1. Unlock shared HTMLAudioElement using a silent 1-pixel audio data URI
      const audio = this.getSharedAudio();
      audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
            this.isUnlocked = true;
          })
          .catch(() => {
            // Will retry on next interaction
          });
      }

      // 2. Unlock AudioContext if suspended
      const ctx = this.getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      // 3. Unlock SpeechSynthesis
      if ('speechSynthesis' in window) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }
    } catch {
      // Silent catch
    }
  }

  public getSharedAudio(): HTMLAudioElement {
    if (!this.sharedAudio && typeof window !== 'undefined') {
      this.sharedAudio = new Audio();
      this.sharedAudio.preload = 'auto';
      // Inline playback attribute for iOS WebKit
      this.sharedAudio.setAttribute('playsinline', 'true');
      this.sharedAudio.setAttribute('webkit-playsinline', 'true');
    }
    return this.sharedAudio!;
  }

  public getAudioContext(): AudioContext | null {
    if (!this.audioContext && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    return this.audioContext;
  }

  /**
   * Stop any currently playing audio or speech synthesis immediately
   */
  public stop() {
    this.currentSessionId++;
    this.isCurrentlyPlaying = false;

    if (this.activeStopCallback) {
      try {
        this.activeStopCallback();
      } catch (_) {}
      this.activeStopCallback = null;
    }

    if (this.sharedAudio) {
      try {
        this.sharedAudio.pause();
        this.sharedAudio.currentTime = 0;
        this.sharedAudio.removeAttribute('src');
      } catch (_) {}
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        // Clear active utterances set
        activeSpeechUtterances.clear();
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
  }

  /**
   * Primary method to speak or play pronunciation of a word or sentence.
   * Priority:
   * 1. If audioUrl is passed directly -> play via unlocked HTML5 Audio
   * 2. If single English word -> try high quality human dictionary audio CDN
   * 3. Fallback to Web Speech API (with mobile iOS/Chrome fixes)
   */
  public async playWord(
    text: string,
    options: {
      audioUrl?: string;
      rate?: number;
      lang?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): Promise<void> {
    if (!text && !options.audioUrl) return;

    this.stop();
    const sessionId = ++this.currentSessionId;
    const rate = options.rate || 1.0;
    const lang = options.lang || this.getPreferredTargetLocale() || 'en-US';

    this.isCurrentlyPlaying = true;
    options.onStart?.();

    // Setup cleanup handler for this session
    this.activeStopCallback = () => {
      if (this.currentSessionId === sessionId) {
        options.onEnd?.();
      }
    };

    // 1. Direct audioUrl playback if provided
    if (options.audioUrl && options.audioUrl.trim()) {
      const success = await this.playFromUrl(options.audioUrl.trim(), rate, sessionId, options);
      if (success) return;
    }

    const cleanText = text.replace(/[*#_`]/g, '').trim();
    if (!cleanText) {
      this.isCurrentlyPlaying = false;
      options.onEnd?.();
      return;
    }

    const targetLocale = this.detectScriptLocale(cleanText, lang);
    const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();

    // 2. On Native Mobile (Capacitor Android/iOS), WebView SpeechSynthesis often lacks voices or is silent.
    // Directly stream from backend Google TTS proxy via HTML5 Audio for 100% reliable pronunciation.
    if (isNative) {
      const serverTtsUrl = this.resolveFullAudioUrl(
        `/vocabulary/tts?text=${encodeURIComponent(cleanText)}&lang=${encodeURIComponent(targetLocale)}`
      );
      const success = await this.playFromUrl(serverTtsUrl, rate, sessionId, options);
      if (success) return;
    }

    // 3. Direct instantaneous Web Speech API playback (Zero network latency on Desktop / Web Browsers)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.playViaSpeechSynthesis(cleanText, rate, targetLocale, sessionId, options);
      return;
    }

    // 4. Direct backend proxy TTS if Web Speech API is unavailable
    const fallbackUrl = this.resolveFullAudioUrl(
      `/vocabulary/tts?text=${encodeURIComponent(cleanText)}&lang=${encodeURIComponent(targetLocale)}`
    );
    await this.playFromUrl(fallbackUrl, rate, sessionId, options);
  }

  /**
   * Unified Multilingual Speech Synthesis (Nova Voice):
   * Speaks the entire message continuously in ONE single natural voice (Nova - Multilingual).
   * No longer switches between voices or breaks sentences.
   */
  public async playBilingualText(
    text: string,
    options: {
      rate?: number;
      targetLocale?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): Promise<void> {
    const cleanText = text
      .replace(/###\s*/g, '')
      .replace(/[*_`#]/g, '')
      .replace(/^[0-9]+[.)]\s*/gm, '')
      .replace(/[💡📌🔗🎯•]+/g, '')
      .replace(/^[🇬🇧🇻🇳\s]+/gm, '')
      .trim();

    if (!cleanText) return;

    this.stop();
    const sessionId = ++this.currentSessionId;
    this.isCurrentlyPlaying = true;
    options.onStart?.();

    const effectiveLocale = options.targetLocale || this.getPreferredTargetLocale() || 'en-US';

    this.playMultilingualMaleTTS(
      cleanText,
      sessionId,
      {
        onEnd: () => {
          if (this.currentSessionId === sessionId) {
            this.isCurrentlyPlaying = false;
            options.onEnd?.();
          }
        },
        onError: (err) => {
          if (this.currentSessionId === sessionId) {
            this.isCurrentlyPlaying = false;
            options.onError?.(err);
          }
        },
      },
      options.rate || 1.14,
      effectiveLocale
    );
  }

  /**
   * Fluid Multilingual Male Speech (Windows / OS Speech Synthesis & Neural Male Fallback):
   * Plays Target Language with authentic native voice and Vietnamese with genuine Northern Male voice (Nam Minh),
   * seamlessly queued with zero network pauses at balanced 1.14x tempo.
   */
  public playMultilingualMaleTTS(
    text: string,
    sessionId: number,
    callbacks: { onEnd?: () => void; onError?: (err: any) => void },
    rate: number = 1.14,
    targetLocale: string = 'en-US'
  ) {
    if (this.currentSessionId !== sessionId) {
      callbacks.onEnd?.();
      return;
    }

    const clean = text.replace(/[*#_`]/g, '').trim();
    if (!clean) {
      callbacks.onEnd?.();
      return;
    }

    const effectiveLocale = targetLocale || this.getPreferredTargetLocale() || 'en-US';
    const targetLangPrefix = effectiveLocale.split(/[-_]/)[0].toLowerCase();
    const genderPref = this.getPreferredVoiceGender();

    // 1. If SpeechSynthesis is available, use seamless in-browser queueing (zero network latency)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.cancel();

        const voices = window.speechSynthesis.getVoices();

        // Find Northern Vietnamese Male voice (NamMinh)
        let viVoice = voices.find((v) => {
          const name = v.name.toLowerCase();
          return v.lang.toLowerCase().startsWith('vi') && (name.includes('nam') || name.includes('minh') || name.includes('male'));
        });
        if (!viVoice) {
          viVoice = voices.find((v) => v.lang.toLowerCase().startsWith('vi'));
        }

        // Find American Male voice (Christopher, Guy, David, Brian)
        let enVoice = voices.find((v) => {
          const name = v.name.toLowerCase();
          const isEn = v.lang.toLowerCase().startsWith('en');
          return (
            isEn &&
            (name.includes('guy') ||
              name.includes('christopher') ||
              name.includes('david') ||
              name.includes('brian') ||
              (name.includes('male') && !name.includes('female')))
          );
        });
        if (!enVoice) {
          enVoice = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
        }

        // Find Target Language voice matching language prefix & gender
        let targetVoice = voices.find((v) => {
          const isTargetLang = v.lang.toLowerCase().replace('_', '-').startsWith(targetLangPrefix);
          if (!isTargetLang) return false;
          const name = v.name.toLowerCase();
          if (genderPref === 'male') {
            return (
              !name.includes('female') &&
              !name.includes('woman') &&
              (name.includes('male') ||
                name.includes('guy') ||
                name.includes('christopher') ||
                name.includes('david') ||
                name.includes('brian') ||
                name.includes('stefan') ||
                name.includes('keita') ||
                name.includes('yunxi') ||
                name.includes('martin'))
            );
          } else {
            return (
              name.includes('female') ||
              name.includes('woman') ||
              name.includes('zira') ||
              name.includes('samantha') ||
              name.includes('kyoko') ||
              name.includes('xiaoxiao') ||
              name.includes('katja') ||
              name.includes('monica')
            );
          }
        });
        if (!targetVoice) {
          targetVoice = voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith(targetLangPrefix));
        }
        if (!targetVoice && targetLangPrefix === 'en') {
          targetVoice = enVoice;
        }

        // Parse into large bilingual blocks (merge consecutive sentences of same language)
        const rawLines = clean.split(/\n+/).filter((p) => p.trim());
        const blocks: { text: string; isVi: boolean }[] = [];

        for (const line of rawLines) {
          const sentences = line.split(/(?<=[.!?])\s+/).filter((s) => s.trim());
          for (const s of sentences) {
            const isVi = /[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(s);
            const lastBlock = blocks[blocks.length - 1];
            if (lastBlock && lastBlock.isVi === isVi) {
              lastBlock.text += ' ' + s;
            } else {
              blocks.push({ text: s, isVi });
            }
          }
        }

        if (blocks.length === 0) {
          callbacks.onEnd?.();
          return;
        }

        // Check if device lacks Vietnamese voice when Vietnamese blocks are present
        const hasViBlock = blocks.some((b) => b.isVi);
        if (hasViBlock && !viVoice) {
          // Fallback to server Edge Neural TTS
          const url = this.resolveFullAudioUrl(`/ai/tts?text=${encodeURIComponent(clean)}&voice=namminh&lang=vi`);
          this.playFromUrl(url, 1.0, sessionId, callbacks);
          return;
        }

        const hasNonViBlock = blocks.some((b) => !b.isVi);
        if (hasNonViBlock && !targetVoice) {
          // Fallback to server TTS for target language
          const url = this.resolveFullAudioUrl(`/vocabulary/tts?text=${encodeURIComponent(clean)}&lang=${encodeURIComponent(effectiveLocale)}`);
          this.playFromUrl(url, 1.0, sessionId, callbacks);
          return;
        }

        let completedBlocks = 0;
        blocks.forEach((block) => {
          const utterance = new SpeechSynthesisUtterance(block.text);
          utterance.rate = rate; // 1.14x (tự nhiên, không quá nhanh, không ngập ngừng)
          if (block.isVi) {
            utterance.lang = 'vi-VN';
            if (viVoice) utterance.voice = viVoice;
          } else {
            utterance.lang = effectiveLocale;
            if (targetVoice) utterance.voice = targetVoice;
            else if (enVoice && targetLangPrefix === 'en') utterance.voice = enVoice;
          }

          activeSpeechUtterances.add(utterance);

          utterance.onend = () => {
            activeSpeechUtterances.delete(utterance);
            completedBlocks++;
            if (completedBlocks >= blocks.length) {
              if (this.currentSessionId === sessionId) {
                this.isCurrentlyPlaying = false;
                callbacks.onEnd?.();
              }
            }
          };

          utterance.onerror = (e: any) => {
            activeSpeechUtterances.delete(utterance);
            if (this.currentSessionId === sessionId) {
              this.isCurrentlyPlaying = false;
              if (e.error !== 'canceled' && e.error !== 'interrupted') {
                callbacks.onError?.(e);
              }
              callbacks.onEnd?.();
            }
          };

          window.speechSynthesis.speak(utterance);
        });

        return;
      } catch (err) {
        console.warn('SpeechSynthesis error, falling back to server TTS:', err);
      }
    }

    // 2. Direct Server-Side Neural Male Stream Fallback
    const hasVi = /[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(clean);
    const url = this.resolveFullAudioUrl(`/ai/tts?text=${encodeURIComponent(clean)}&voice=namminh&lang=${hasVi ? 'vi' : targetLangPrefix}`);
    this.playFromUrl(url, 1.0, sessionId, callbacks);
  }

  // Backward compatibility alias
  public playNovaMultilingualTTS = this.playMultilingualMaleTTS.bind(this);

  /**
   * Universal Speech Synthesis Method
   * Directly speaks given text in the requested language (or current target locale),
   * providing instant client-side Web Speech playback with resilient fallback.
   */
  public speak(
    text: string,
    langOrLocale: string = 'en',
    onEnd?: () => void,
    onError?: (err: any) => void
  ): void {
    const clean = text.replace(/[*#_`]/g, '').trim();
    if (!clean) {
      onEnd?.();
      return;
    }

    this.stop();
    const sessionId = ++this.currentSessionId;
    this.isCurrentlyPlaying = true;

    // Detect target locale from language code
    let targetLocale = 'en-US';
    const lang = (langOrLocale || 'en').toLowerCase().trim();
    if (lang === 'vi' || lang.startsWith('vi-')) targetLocale = 'vi-VN';
    else if (lang === 'ja' || lang.startsWith('ja-')) targetLocale = 'ja-JP';
    else if (lang === 'ko' || lang.startsWith('ko-')) targetLocale = 'ko-KR';
    else if (lang === 'zh' || lang.startsWith('zh-')) targetLocale = 'zh-CN';
    else if (lang === 'fr' || lang.startsWith('fr-')) targetLocale = 'fr-FR';
    else if (lang === 'de' || lang.startsWith('de-')) targetLocale = 'de-DE';
    else if (lang === 'es' || lang.startsWith('es-')) targetLocale = 'es-ES';
    else if (lang.includes('-')) targetLocale = lang;

    this.playMultilingualMaleTTS(
      clean,
      sessionId,
      {
        onEnd: () => {
          this.isCurrentlyPlaying = false;
          onEnd?.();
        },
        onError: (err) => {
          this.isCurrentlyPlaying = false;
          onError?.(err);
          onEnd?.();
        },
      },
      1.05,
      targetLocale
    );
  }

  /**
   * High-Fidelity Native Vietnamese TTS using direct Google Neural Audio Stream.
   * Guarantees 100% genuine Vietnamese pronunciation with crisp, fast conversational tempo.
   */
  public playGoogleVietnameseTTS(
    text: string,
    sessionId: number,
    callbacks: { onEnd?: () => void; onError?: (err: any) => void },
    rate: number = 1.12
  ) {
    if (this.currentSessionId !== sessionId) {
      callbacks.onEnd?.();
      return;
    }

    const clean = text.replace(/[*#_`]/g, '').trim();
    if (!clean) {
      callbacks.onEnd?.();
      return;
    }

    // Split into readable audio chunks (<= 140 chars) for high-fidelity Vietnamese TTS stream
    const chunks: string[] = [];
    const rawSentences = clean.split(/(?<=[.!?,:;\n])\s+/);
    for (const s of rawSentences) {
      const trimmed = s.trim();
      if (!trimmed) continue;
      if (trimmed.length <= 130) {
        chunks.push(trimmed);
      } else {
        const words = trimmed.split(/\s+/);
        let curr = '';
        for (const w of words) {
          if ((curr + ' ' + w).length <= 120) {
            curr = curr ? curr + ' ' + w : w;
          } else {
            if (curr) chunks.push(curr);
            curr = w;
          }
        }
        if (curr) chunks.push(curr);
      }
    }

    if (chunks.length === 0) {
      callbacks.onEnd?.();
      return;
    }

    let chunkIdx = 0;
    const playNextChunk = () => {
      if (this.currentSessionId !== sessionId || chunkIdx >= chunks.length) {
        callbacks.onEnd?.();
        return;
      }
      const chunk = chunks[chunkIdx++];
      // Use local server proxy /api/v1/ai/tts with crisp fast playbackRate
      const url = this.resolveFullAudioUrl(`/ai/tts?text=${encodeURIComponent(chunk)}&lang=vi`);
      this.playFromUrl(url, rate, sessionId, {
        onEnd: playNextChunk,
        onError: () => {
          // Fallback direct URL if proxy fails
          const fallbackUrl = this.resolveFullAudioUrl(`/vocabulary/tts?text=${encodeURIComponent(chunk)}&lang=vi`);
          this.playFromUrl(fallbackUrl, rate, sessionId, {
            onEnd: playNextChunk,
            onError: playNextChunk,
          });
        },
      });
    };

    playNextChunk();
  }

  /**
   * Play an audio file from URL using the unlocked shared HTMLAudioElement
   */
  private playFromUrl(
    url: string,
    rate: number,
    sessionId: number,
    callbacks: { onEnd?: () => void; onError?: (err: any) => void }
  ): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.currentSessionId !== sessionId) {
        resolve(false);
        return;
      }

      const fullUrl = this.resolveFullAudioUrl(url);
      const audio = this.getSharedAudio();
      audio.playbackRate = rate;

      let hasEnded = false;
      const cleanup = () => {
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
      };

      const handleEnded = () => {
        if (hasEnded) return;
        hasEnded = true;
        cleanup();
        if (this.currentSessionId === sessionId) {
          this.isCurrentlyPlaying = false;
          callbacks.onEnd?.();
        }
        resolve(true);
      };

      const handleError = (e: any) => {
        cleanup();
        callbacks.onError?.(e);
        resolve(false);
      };

      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError, { once: true });

      try {
        audio.src = fullUrl;
        audio.load();
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            cleanup();
            callbacks.onError?.(err);
            resolve(false);
          });
        }
      } catch (err) {
        cleanup();
        callbacks.onError?.(err);
        resolve(false);
      }
    });
  }

  /**
   * Play speech synthesis with specific iOS Safari & Android Chrome fixes
   */
  private playViaSpeechSynthesis(
    text: string,
    rate: number,
    lang: string,
    sessionId: number,
    callbacks: { onEnd?: () => void; onError?: (err: any) => void }
  ) {
    if (this.currentSessionId !== sessionId) {
      callbacks.onEnd?.();
      return;
    }

    const cleanText = text.replace(/[*#_`]/g, '').trim();
    if (!cleanText) {
      this.isCurrentlyPlaying = false;
      callbacks.onEnd?.();
      return;
    }

    // Auto-detect script or use resolved language locale
    const targetLocale = this.detectScriptLocale(cleanText, lang || 'en-US');
    const langPrefix = targetLocale.split(/[-_]/)[0].toLowerCase();

    const fallbackToServerTTS = () => {
      const fallbackUrl = this.resolveFullAudioUrl(`/vocabulary/tts?text=${encodeURIComponent(cleanText)}&lang=${encodeURIComponent(targetLocale)}`);
      this.playFromUrl(fallbackUrl, rate, sessionId, callbacks);
    };

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      fallbackToServerTTS();
      return;
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();

      // Select optimal OS voice matching language and gender preference
      const voices = window.speechSynthesis.getVoices();
      let chosenVoice: SpeechSynthesisVoice | undefined;

      if (voices && voices.length > 0) {
        const matchingVoices = voices.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith(langPrefix));
        const genderPref = this.getPreferredVoiceGender(); // 'male' | 'female'

        if (matchingVoices.length > 0) {
          if (genderPref === 'female') {
            chosenVoice = matchingVoices.find((v) => {
              const n = v.name.toLowerCase();
              return (
                n.includes('female') ||
                n.includes('woman') ||
                n.includes('zira') ||
                n.includes('samantha') ||
                n.includes('kyoko') ||
                n.includes('yuna') ||
                n.includes('xiaoxiao') ||
                n.includes('huihui') ||
                n.includes('katja') ||
                n.includes('monica')
              );
            });
          } else {
            chosenVoice = matchingVoices.find((v) => {
              const n = v.name.toLowerCase();
              return (
                n.includes('male') ||
                n.includes('guy') ||
                n.includes('christopher') ||
                n.includes('david') ||
                n.includes('brian') ||
                n.includes('stefan') ||
                n.includes('nam') ||
                n.includes('yunxi') ||
                n.includes('kangkang') ||
                n.includes('jorge')
              );
            });
          }

          if (!chosenVoice) {
            chosenVoice = matchingVoices[0];
          }
        }
      }

      if (!chosenVoice) {
        // If device has no local voice for this language (e.g. Linux without Chinese/Asian voices), stream from server TTS
        fallbackToServerTTS();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = rate;
      utterance.lang = targetLocale;
      utterance.voice = chosenVoice;

      let hasStarted = false;
      let watchdogTimer: any = null;

      activeSpeechUtterances.add(utterance);

      const cleanupWatchdog = () => {
        if (watchdogTimer) {
          clearTimeout(watchdogTimer);
          watchdogTimer = null;
        }
      };

      utterance.onstart = () => {
        hasStarted = true;
        cleanupWatchdog();
      };

      utterance.onend = () => {
        cleanupWatchdog();
        activeSpeechUtterances.delete(utterance);
        if (this.currentSessionId === sessionId) {
          this.isCurrentlyPlaying = false;
          callbacks.onEnd?.();
        }
      };

      utterance.onerror = (e: any) => {
        cleanupWatchdog();
        activeSpeechUtterances.delete(utterance);
        if (this.currentSessionId === sessionId) {
          if (e.error !== 'canceled' && e.error !== 'interrupted') {
            console.warn('SpeechSynthesis error, falling back to server TTS:', e);
            fallbackToServerTTS();
          } else {
            this.isCurrentlyPlaying = false;
            callbacks.onEnd?.();
          }
        }
      };

      // Speak synchronously to preserve mobile touch activation context
      window.speechSynthesis.speak(utterance);

      // Watchdog: If speech synthesis does not start within 1500ms (silent/frozen WebView speech engine),
      // fallback to server TTS stream
      watchdogTimer = setTimeout(() => {
        if (!hasStarted && this.currentSessionId === sessionId) {
          console.warn('SpeechSynthesis hung without starting, falling back to server TTS');
          activeSpeechUtterances.delete(utterance);
          try {
            window.speechSynthesis.cancel();
          } catch (_) {}
          fallbackToServerTTS();
        }
      }, 1500);
    } catch (err) {
      console.warn('SpeechSynthesis failed, falling back to server TTS:', err);
      fallbackToServerTTS();
    }
  }

  public get isPlaying(): boolean {
    return this.isCurrentlyPlaying;
  }
}

export const audioEngine = new AudioEngine();
export default audioEngine;
