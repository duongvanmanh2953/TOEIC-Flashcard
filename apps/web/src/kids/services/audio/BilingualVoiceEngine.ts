/**
 * SUNNY MEADOW V2.0 / V3.0 - BILINGUAL VOICE ENGINE (BilingualVoiceEngine)
 * Pedagogy-first Vietnamese & English Voice Narrator for Sunny the Fox Mascot.
 * Vietnamese (warm, guiding) -> English (native, clear, rate 0.82)
 * Dispatches speech state events so Sunny the Fox animates mouth speaking.
 */

export type SpeakingLang = 'vi' | 'en' | null;
type SpeakingListener = (isSpeaking: boolean, lang: SpeakingLang, activeText: string) => void;

class BilingualVoiceEngineService {
  private listeners: Set<SpeakingListener> = new Set();
  private isSpeaking: boolean = false;
  private currentLang: SpeakingLang = null;
  private currentText: string = '';

  public onSpeakingChange(fn: SpeakingListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(isSpeaking: boolean, lang: SpeakingLang, text: string): void {
    this.isSpeaking = isSpeaking;
    this.currentLang = lang;
    this.currentText = text;
    this.listeners.forEach((fn) => fn(isSpeaking, lang, text));
  }

  public getSpeakingState() {
    return {
      isSpeaking: this.isSpeaking,
      currentLang: this.currentLang,
      currentText: this.currentText,
    };
  }

  public cancel(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.notify(false, null, '');
    }
  }

  /**
   * 1. Speak Vietnamese guidance
   */
  public speakVietnamese(
    text: string,
    options: { rate?: number; pitch?: number; onEnd?: () => void } = {}
  ): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (options.onEnd) options.onEnd();
      return;
    }
    this.cancel();

    const { rate = 0.9, pitch = 1.05, onEnd } = options;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'vi-VN';
    utter.rate = rate;
    utter.pitch = pitch;

    // Pick best Vietnamese voice if available
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find((v) => v.lang.includes('vi') || v.lang.includes('VN'));
    if (viVoice) utter.voice = viVoice;

    this.notify(true, 'vi', text);

    utter.onend = () => {
      this.notify(false, null, '');
      if (onEnd) onEnd();
    };

    utter.onerror = () => {
      this.notify(false, null, '');
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utter);
  }

  /**
   * 2. Speak English Target Word / Sentence (Pedagogy rate 0.82)
   */
  public speakEnglish(
    text: string,
    options: { rate?: number; pitch?: number; onEnd?: () => void } = {}
  ): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (options.onEnd) options.onEnd();
      return;
    }
    this.cancel();

    const { rate = 0.82, pitch = 1.15, onEnd } = options;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = rate;
    utter.pitch = pitch;

    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Google'))
    );
    if (enVoice) utter.voice = enVoice;

    this.notify(true, 'en', text);

    utter.onend = () => {
      this.notify(false, null, '');
      if (onEnd) onEnd();
    };

    utter.onerror = () => {
      this.notify(false, null, '');
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utter);
  }

  /**
   * 3. Speak Bilingual Sequence:
   * First speaks Vietnamese guide, pauses 350ms, then speaks English target!
   */
  public speakBilingual(
    viText: string,
    enText: string,
    options: { onEnd?: () => void } = {}
  ): void {
    this.speakVietnamese(viText, {
      onEnd: () => {
        setTimeout(() => {
          this.speakEnglish(enText, {
            onEnd: options.onEnd,
          });
        }, 350);
      },
    });
  }
}

export const BilingualVoiceEngine = new BilingualVoiceEngineService();
export default BilingualVoiceEngine;
