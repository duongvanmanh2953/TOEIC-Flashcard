/**
 * Mobile-First Audio Engine for VocabFlow
 * Solves iOS Safari & Android Chrome Autoplay Restrictions, AudioContext Suspensions,
 * SpeechSynthesis GC bugs, and provides dual-tier (Dictionary Audio + Web Speech API) playback.
 */

// Global registry preventing V8 / WebKit garbage collection from cutting off speech mid-sentence
const activeSpeechUtterances = new Set<SpeechSynthesisUtterance>();

class AudioEngine {
  private sharedAudio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private isUnlocked = false;
  private currentSessionId = 0;
  private isCurrentlyPlaying = false;
  private activeStopCallback: (() => void) | null = null;

  constructor() {
    this.initAutoUnlock();
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
    const lang = options.lang || 'en-US';

    this.isCurrentlyPlaying = true;
    options.onStart?.();

    // Setup cleanup handler for this session
    this.activeStopCallback = () => {
      if (this.currentSessionId === sessionId) {
        options.onEnd?.();
      }
    };

    // 1. Direct audioUrl playback if available
    if (options.audioUrl) {
      const success = await this.playFromUrl(options.audioUrl, rate, sessionId, options);
      if (success) return;
    }

    // 2. For single clean English words, attempt high-quality Free Dictionary CDN
    const cleanWord = text.trim().toLowerCase();
    const isSingleWord = /^[a-zA-Z\s'-]+$/.test(cleanWord) && cleanWord.split(/\s+/).length === 1;

    if (isSingleWord && cleanWord.length > 1) {
      const dictAudioUrl = `https://api.dictionaryapi.dev/media/pronunciations/en/${encodeURIComponent(cleanWord)}-us.mp3`;
      const dictSuccess = await this.playFromUrl(dictAudioUrl, rate, sessionId, options);
      if (dictSuccess) return;
    }

    // 3. Robust Web Speech API implementation
    this.playViaSpeechSynthesis(text, rate, lang, sessionId, options);
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

      const audio = this.getSharedAudio();
      audio.playbackRate = rate;
      audio.src = url;

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
        resolve(false); // Fallback to SpeechSynthesis
      };

      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError, { once: true });

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          cleanup();
          resolve(false);
        });
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
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.isCurrentlyPlaying = false;
      callbacks.onEnd?.();
      return;
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;

      // Select optimal English voice
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const preferredVoice = voices.find(
          (v) =>
            (v.lang.startsWith('en') &&
              (v.name.includes('Google') ||
                v.name.includes('Natural') ||
                v.name.includes('Samantha') ||
                v.name.includes('Daniel') ||
                v.name.includes('Karen') ||
                v.name.includes('Siri'))) ||
            v.lang === lang
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      // Retain utterance to prevent GC bug on Chrome & iOS
      activeSpeechUtterances.add(utterance);

      utterance.onend = () => {
        activeSpeechUtterances.delete(utterance);
        if (this.currentSessionId === sessionId) {
          this.isCurrentlyPlaying = false;
          callbacks.onEnd?.();
        }
      };

      utterance.onerror = (e: any) => {
        activeSpeechUtterances.delete(utterance);
        if (this.currentSessionId === sessionId) {
          this.isCurrentlyPlaying = false;
          // Ignore canceled event if another word was triggered
          if (e.error !== 'canceled' && e.error !== 'interrupted') {
            callbacks.onError?.(e);
          }
          callbacks.onEnd?.();
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      this.isCurrentlyPlaying = false;
      callbacks.onError?.(err);
      callbacks.onEnd?.();
    }
  }

  public get isPlaying(): boolean {
    return this.isCurrentlyPlaying;
  }
}

export const audioEngine = new AudioEngine();
export default audioEngine;
