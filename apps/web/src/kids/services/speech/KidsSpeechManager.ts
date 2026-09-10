/**
 * KidsSpeechManager.ts
 * Unified Web Speech API Controller for Kids English Learning System
 * - Strictly English voice selection (en-US / en-GB)
 * - Automatic preloading & voiceschanged event listener
 * - Garbage collection mitigation preventing cutoff mid-sentence
 * - Queue cancellation on route changes or rapid replay
 */

class KidsSpeechManager {
  private voices: SpeechSynthesisVoice[] = [];
  private isReady: boolean = false;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private isCurrentlySpeaking: boolean = false;
  private onStateChangeListeners: Set<(speaking: boolean) => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices && allVoices.length > 0) {
        this.voices = allVoices;
        this.isReady = true;
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public getEnglishVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter((v) => v.lang.startsWith('en'));
  }

  /**
   * Find the clearest, most natural English voice available on this device/browser
   */
  public getBestEnglishVoice(): SpeechSynthesisVoice | null {
    const enVoices = this.getEnglishVoices();
    if (enVoices.length === 0) return null;

    // Prioritize child-friendly, natural, or modern platform voices
    const preferredKeywords = [
      'google us english',
      'natural',
      'samantha',
      'karen',
      'daniel',
      'victoria',
      'zira',
      'jenny',
      'guy',
      'aria',
      'en-us',
    ];

    for (const kw of preferredKeywords) {
      const match = enVoices.find(
        (v) =>
          v.name.toLowerCase().includes(kw) ||
          v.voiceURI.toLowerCase().includes(kw) ||
          v.lang.toLowerCase() === kw
      );
      if (match) return match;
    }

    // Default to first English voice
    return enVoices[0];
  }

  /**
   * Speak English text with smooth kids-friendly playback rate
   */
  public speak(
    text: string,
    options: {
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ) {
    if (!this.isSupported() || !text.trim()) {
      options.onEnd?.();
      return;
    }

    // Always stop prior speech to prevent overlapping queues
    this.stop();

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.lang = 'en-US';
      // Slightly relaxed, clear speaking rate for kids (0.85 - 0.95 by default)
      utterance.rate = options.rate ?? 0.88;
      utterance.pitch = options.pitch ?? 1.05; // Slightly cheerful, higher pitch

      const voice = this.getBestEnglishVoice();
      if (voice) {
        utterance.voice = voice;
      }

      this.activeUtterance = utterance;

      utterance.onstart = () => {
        this.isCurrentlySpeaking = true;
        this.notifyListeners(true);
        options.onStart?.();
      };

      utterance.onend = () => {
        this.isCurrentlySpeaking = false;
        this.activeUtterance = null;
        this.notifyListeners(false);
        options.onEnd?.();
      };

      utterance.onerror = (e) => {
        this.isCurrentlySpeaking = false;
        this.activeUtterance = null;
        this.notifyListeners(false);
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          options.onError?.(e);
        }
        options.onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      this.isCurrentlySpeaking = false;
      this.notifyListeners(false);
      options.onError?.(err);
      options.onEnd?.();
    }
  }

  public stop() {
    if (this.isSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
    this.isCurrentlySpeaking = false;
    this.activeUtterance = null;
    this.notifyListeners(false);
  }

  public get speaking(): boolean {
    return this.isCurrentlySpeaking;
  }

  public subscribeState(listener: (speaking: boolean) => void): () => void {
    this.onStateChangeListeners.add(listener);
    listener(this.isCurrentlySpeaking);
    return () => {
      this.onStateChangeListeners.delete(listener);
    };
  }

  private notifyListeners(speaking: boolean) {
    this.onStateChangeListeners.forEach((fn) => {
      try {
        fn(speaking);
      } catch (_) {}
    });
  }
}

export const kidsSpeech = new KidsSpeechManager();
export const speechManager = kidsSpeech;
export default kidsSpeech;
