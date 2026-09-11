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
   * Prioritize authentic Northern Vietnamese Female voice ("Giọng nữ miền Bắc")
   * 1. Microsoft HoaiMy Online (Natural) - standard clear Hanoi female voice
   * 2. Microsoft An Online (Natural) / Microsoft An - clear Hanoi female voice
   * 3. Apple Linh / Mai / Huong (iOS/macOS Northern female voices)
   * 4. Google Tiếng Việt (Female)
   * Excludes any male voice (e.g. Microsoft NamMinh).
   */
  public getVietnameseVoice(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

    if (this.voices.length === 0) {
      this.voices = window.speechSynthesis.getVoices() || [];
    }

    const viVoices = this.voices.filter(
      (v) =>
        v.lang.toLowerCase().startsWith('vi') ||
        v.lang.toLowerCase() === 'vi-vn' ||
        v.name.toLowerCase().includes('vietnam')
    );
    if (viVoices.length === 0) return null;

    const northernFemaleKeywords = [
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
    ];

    // 1. Try prioritized Northern female keywords
    for (const kw of northernFemaleKeywords) {
      const match = viVoices.find((v) => {
        const name = v.name.toLowerCase();
        const uri = v.voiceURI.toLowerCase();
        const isMale = name.includes('namminh') || name.includes('male') || uri.includes('namminh');
        return !isMale && (name.includes(kw) || uri.includes(kw));
      });
      if (match) return match;
    }

    // 2. Any female voice (strictly exclude male voices like NamMinh)
    const femaleVoice = viVoices.find((v) => {
      const name = v.name.toLowerCase();
      const uri = v.voiceURI.toLowerCase();
      return !name.includes('namminh') && !name.includes('male') && !uri.includes('namminh');
    });

    return femaleVoice || viVoices[0];
  }

  /**
   * Speak Vietnamese UI greetings and praise with authentic Northern Female Voice
   * Uses Web Speech API configured with Hanoi female pitch and pacing.
   */
  public speakVi(
    text: string,
    options: {
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ) {
    const cleanText = text.trim();
    if (!cleanText) {
      options.onEnd?.();
      return;
    }

    this.speakViWebSpeech(cleanText, options);
  }

  /**
   * Web Speech API fallback tuned specifically to Northern Female vocal pitch & cadence
   */
  private speakViWebSpeech(
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

    try {
      this.stop();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.lang = 'vi-VN';
      // Sweet, friendly, clear Northern female cadence (Hanoi accent)
      utterance.rate = options.rate ?? 0.88;
      utterance.pitch = options.pitch ?? 1.16;

      const viVoice = this.getVietnameseVoice();
      if (viVoice) {
        utterance.voice = viVoice;
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

  /**
   * Helper to look up common Vietnamese translation for vocabulary
   */
  public getViMeaning(enWord: string): string {
    const key = (enWord || '').toLowerCase().trim();
    const map: Record<string, string> = {
      hello: 'Xin chào',
      goodbye: 'Tạm biệt',
      lion: 'Con sư tử',
      elephant: 'Con voi',
      monkey: 'Con khỉ',
      apple: 'Quả táo',
      banana: 'Quả chuối',
      orange: 'Quả cam',
      cat: 'Con mèo',
      dog: 'Con chó',
      fish: 'Con cá',
      bird: 'Con chim',
      rabbit: 'Con thỏ',
      tiger: 'Con hổ',
      bear: 'Con gấu',
      red: 'Màu đỏ',
      blue: 'Màu xanh dương',
      green: 'Màu xanh lá',
      yellow: 'Màu vàng',
      pink: 'Màu hồng',
      purple: 'Màu tím',
      one: 'Số một',
      two: 'Số hai',
      three: 'Số ba',
      four: 'Số bốn',
      five: 'Số năm',
      sun: 'Mặt trời',
      rain: 'Cơn mưa',
      water: 'Nước uống',
      milk: 'Sữa tươi',
      cake: 'Bánh ngọt',
      bread: 'Bánh mì',
      house: 'Ngôi nhà',
      star: 'Ngôi sao',
      tree: 'Cái cây',
      car: 'Xe ô tô',
      train: 'Đoàn tàu',
    };
    return map[key] || '';
  }

  /**
   * Speak bilingual pronunciation:
   * First speaks English (e.g. "Lion"), pauses, then speaks Vietnamese meaning (e.g. "Con sư tử")
   * Essential for young children who cannot read text yet!
   */
  public speakBilingual(
    enText: string,
    viText?: string,
    options: { onEnd?: () => void } = {}
  ) {
    const meaning = viText || this.getViMeaning(enText);

    // Speak English first
    this.speak(enText, {
      onEnd: () => {
        if (meaning) {
          // Small natural pause between English and Vietnamese
          setTimeout(() => {
            this.speakVi(meaning, {
              onEnd: () => options.onEnd?.(),
            });
          }, 350);
        } else {
          options.onEnd?.();
        }
      },
    });
  }

  /**
   * Explains the word in Vietnamese, pronounces in English, and prompts the child to repeat:
   * "Đây là [Con sư tử]! [Lion]! Bé hãy đọc lại nhé: [Lion]!"
   * Won't cut off speech prematurely.
   */
  public explainAndPromptRepeat(
    enWord: string,
    viMeaning?: string,
    callbacks: {
      onStart?: () => void;
      onReadyForChild?: () => void;
    } = {}
  ) {
    this.stop();
    callbacks.onStart?.();

    const meaning = viMeaning || this.getViMeaning(enWord);
    const introText = meaning ? `Đây là ${meaning}!` : `Bé nhìn từ này nhé!`;

    // 1. Vietnamese intro
    this.speakVi(introText, {
      onEnd: () => {
        // 2. English pronunciation
        setTimeout(() => {
          this.speak(enWord, {
            onEnd: () => {
              // 3. Prompt child to repeat
              setTimeout(() => {
                this.speakVi('Bé đọc lại nhé!', {
                  onEnd: () => {
                    setTimeout(() => {
                      this.speak(enWord, {
                        onEnd: () => {
                          callbacks.onReadyForChild?.();
                        },
                      });
                    }, 200);
                  },
                });
              }, 300);
            },
          });
        }, 300);
      },
    });
  }

  public stop() {
    if (this.activeAudio) {
      try {
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
      } catch (_) {}
      this.activeAudio = null;
    }
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
