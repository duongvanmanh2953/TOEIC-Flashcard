/**
 * SUNNY MEADOW V4.0 - MASTER AUDIO & BGM SYNTHESIZER ENGINE
 * Strictly satisfies AGENTS.md (Part 5):
 * 100% Web Audio API synthesizer (Kalimba melody + Pentatonic notes),
 * zero external MP3 dependencies, volume controls for BGM & SFX,
 * bilingual speech synthesis (vi-VN first, en-US second), and auto-start on touch.
 */

type SpeakingChangeListener = (isSpeaking: boolean, lang: 'vi' | 'en' | null) => void;

class SunnyAudioEngineClass {
  private ctx: AudioContext | null = null;
  private bgmEnabled: boolean = true;
  private sfxEnabled: boolean = true;
  private voiceEnabled: boolean = true;
  private bgmVolume: number = 0.45;
  private sfxVolume: number = 0.8;
  private bgmInterval: any = null;
  private noteStep: number = 0;
  private speakingListeners: Set<SpeakingChangeListener> = new Set();
  private isUnlocked: boolean = false;

  // Giai điệu Kalimba Rừng Xanh Pentatonic (êm dịu, không gây chói tai)
  private readonly melodyNotes: number[] = [
    261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 392.0, 440.0, 392.0,
  ];

  constructor() {
    // Listen for initial user gesture to unlock audio
    if (typeof window !== 'undefined') {
      const unlockHandler = () => {
        this.unlockAndStart();
        window.removeEventListener('pointerdown', unlockHandler);
        window.removeEventListener('keydown', unlockHandler);
      };
      window.addEventListener('pointerdown', unlockHandler, { once: true });
      window.addEventListener('keydown', unlockHandler, { once: true });
    }
  }

  public initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlockAndStart(): void {
    this.initContext();
    this.isUnlocked = true;
    if (this.bgmEnabled) {
      this.startBGM();
    }
  }

  public playTone(
    freq: number,
    type: OscillatorType = 'sine',
    duration: number = 0.18,
    vol: number = 0.3,
    delay: number = 0
  ): void {
    if (!this.sfxEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const startTime = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      const targetGain = Math.max(0.0001, vol * this.sfxVolume);
      gain.gain.setValueAtTime(targetGain, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch {
      // Graceful fallback
    }
  }

  public startBGM(): void {
    const ctx = this.initContext();
    if (!ctx) return;
    if (this.bgmInterval) return;

    this.bgmInterval = setInterval(() => {
      if (!this.bgmEnabled || !this.ctx || typeof document === 'undefined' || document.hidden) {
        return;
      }
      try {
        const freq = this.melodyNotes[this.noteStep % this.melodyNotes.length];
        this.noteStep++;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Kalimba bell tone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const targetGain = Math.max(0.0001, 0.08 * this.bgmVolume);
        gain.gain.setValueAtTime(targetGain, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 1.0);
      } catch {
        // Audio suspended or backgrounded
      }
    }, 1100);
  }

  public stopBGM(): void {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  // --- SOUND EFFECTS ---
  public playClick(): void {
    this.playTone(520, 'triangle', 0.09, 0.25);
  }
  public playButtonClick(): void {
    this.playClick();
  }

  public playFlip(): void {
    this.playTone(420, 'sine', 0.12, 0.22);
    this.playTone(640, 'sine', 0.12, 0.2, 0.05);
  }
  public playCardFlip(): void {
    this.playFlip();
  }

  public playCardSelect(): void {
    this.playTone(480, 'triangle', 0.1, 0.22);
  }

  public playCorrect(): void {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      this.playTone(f, 'triangle', 0.22, 0.3, i * 0.07)
    );
  }
  public playVictoryFanfare(): void {
    this.playCorrect();
  }

  public playWrong(): void {
    this.playTone(250, 'sine', 0.18, 0.22, 0);
    this.playTone(210, 'sine', 0.24, 0.22, 0.12);
  }

  public playStarAward(starNumber: number): void {
    const starFreqs: Record<number, number> = { 1: 587.33, 2: 783.99, 3: 1046.5 };
    const f = starFreqs[starNumber] || 587.33;
    this.playTone(f, 'triangle', 0.35, 0.4, 0);
    this.playTone(f * 1.5, 'sine', 0.4, 0.28, 0.08);
  }

  public playFireworkBurst(): void {
    const freqs = [350, 480, 620, 800, 950];
    freqs.forEach((f, i) => {
      this.playTone(f, 'triangle', 0.15, 0.18, i * 0.04);
    });
  }

  // --- BILINGUAL SPEECH SYNTHESIS ---
  public speakBilingual(viText: string, enText?: string): void {
    if (!this.voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterVi = new SpeechSynthesisUtterance(viText);
      utterVi.lang = 'vi-VN';
      utterVi.rate = 0.92;
      utterVi.pitch = 1.1;

      this.notifySpeaking(true, 'vi');

      utterVi.onend = () => {
        if (enText) {
          const utterEn = new SpeechSynthesisUtterance(enText);
          utterEn.lang = 'en-US';
          utterEn.rate = 0.82;
          utterEn.pitch = 1.08;

          this.notifySpeaking(true, 'en');

          utterEn.onend = () => {
            this.notifySpeaking(false, null);
          };
          utterEn.onerror = () => {
            this.notifySpeaking(false, null);
          };

          window.speechSynthesis.speak(utterEn);
        } else {
          this.notifySpeaking(false, null);
        }
      };

      utterVi.onerror = () => {
        this.notifySpeaking(false, null);
      };

      window.speechSynthesis.speak(utterVi);
    } catch {
      this.notifySpeaking(false, null);
    }
  }

  public speakEnglish(enText: string): void {
    if (!this.voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(enText);
      utter.lang = 'en-US';
      utter.rate = 0.82;
      utter.pitch = 1.08;

      this.notifySpeaking(true, 'en');
      utter.onend = () => this.notifySpeaking(false, null);
      utter.onerror = () => this.notifySpeaking(false, null);

      window.speechSynthesis.speak(utter);
    } catch {
      this.notifySpeaking(false, null);
    }
  }

  public speakVietnamese(viText: string): void {
    if (!this.voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(viText);
      utter.lang = 'vi-VN';
      utter.rate = 0.92;
      utter.pitch = 1.1;

      this.notifySpeaking(true, 'vi');
      utter.onend = () => this.notifySpeaking(false, null);
      utter.onerror = () => this.notifySpeaking(false, null);

      window.speechSynthesis.speak(utter);
    } catch {
      this.notifySpeaking(false, null);
    }
  }

  public cancelSpeech(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.notifySpeaking(false, null);
    }
  }

  public onSpeakingChange(listener: SpeakingChangeListener): () => void {
    this.speakingListeners.add(listener);
    return () => this.speakingListeners.delete(listener);
  }

  private notifySpeaking(speaking: boolean, lang: 'vi' | 'en' | null): void {
    this.speakingListeners.forEach((l) => l(speaking, lang));
  }

  // --- VOLUME & TOGGLE SETTERS ---
  public setBGMEnabled(val: boolean): void {
    this.bgmEnabled = val;
    if (val) {
      this.startBGM();
    } else {
      this.stopBGM();
    }
  }

  public setSFXEnabled(val: boolean): void {
    this.sfxEnabled = val;
  }

  public setVoiceEnabled(val: boolean): void {
    this.voiceEnabled = val;
    if (!val) {
      this.cancelSpeech();
    }
  }

  public setBGMVolume(val: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, val));
  }

  public setSFXVolume(val: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, val));
  }

  // --- GETTERS ---
  public isBGMEnabled(): boolean {
    return this.bgmEnabled;
  }

  public isSFXEnabled(): boolean {
    return this.sfxEnabled;
  }

  public isVoiceEnabled(): boolean {
    return this.voiceEnabled;
  }

  public getBGMVolume(): number {
    return this.bgmVolume;
  }

  public getSFXVolume(): number {
    return this.sfxVolume;
  }

  public testSoundAndVoice(): void {
    this.playCorrect();
    this.speakBilingual(
      'Xin chào bé yêu! Cáo Sunny sẵn sàng chơi cùng bé rồi!',
      'Hello sweetie! Let us play together!'
    );
  }
}

export const SunnyAudioEngine = new SunnyAudioEngineClass();
export default SunnyAudioEngine;
