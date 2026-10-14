/**
 * SUNNY MEADOW V2.0 - NATURAL AUDIO & SPEECH ENGINE
 * Implements Section 4 of KidRequired.md:
 * - Synthesizes natural acoustic wood & water tones using Web Audio API (Marimba, Kalimba, Glissando Harp, Soft Bounce)
 * - Zero external .mp3 files (zero 404 broken assets)
 * - Pedagogy-first Web Speech API with child-friendly pitch & cadence
 */

class MeadowAudioEngineService {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    // Check if user previously muted
    const saved = localStorage.getItem('sunny_meadow_sound');
    if (saved !== null) {
      this.soundEnabled = saved === 'true';
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('sunny_meadow_sound', String(this.soundEnabled));
    return this.soundEnabled;
  }

  /**
   * Note to Frequency helper
   */
  private noteToFreq(note: string): number {
    const notes: Record<string, number> = {
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
      C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
      C6: 1046.50, D6: 1174.66, E6: 1318.51, G6: 1567.98
    };
    return notes[note] || 523.25;
  }

  /**
   * 1. Âm thanh Kalimba/Marimba khi bé chạm vào vật phẩm (playWoodTap)
   */
  public playWoodTap(note: string = 'C5'): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(this.noteToFreq(note), now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.45, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // AudioContext fallback
    }
  }

  /**
   * 2. Âm thanh Đàn Hạc Nước (Water Harp Glissando) khi bé hoàn thành nhiệm vụ
   */
  public playMagicalSuccess(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const chord = ['C5', 'E5', 'G5', 'B5', 'C6', 'E6'];

      chord.forEach((note, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(this.noteToFreq(note), now + idx * 0.09);

        gain.gain.setValueAtTime(0, now + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.7);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.75);
      });
    } catch {
      // AudioContext fallback
    }
  }

  /**
   * 3. Âm thanh Nhún Nhẹ khi bé chọn chưa đúng (Zero-Punishment: F4 -> D4 ấm áp)
   */
  public playSoftBounce(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [
        { note: 'F4', time: now },
        { note: 'D4', time: now + 0.12 },
      ].forEach(({ note, time }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(this.noteToFreq(note), time);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.25, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.25);
      });
    } catch {
      // AudioContext fallback
    }
  }

  /**
   * 4. Âm thanh Nhai Giòn Tan ("Crunch! Nom nom!") khi đút thú rừng ăn
   */
  public playCrunch(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Filtered noise burst for crisp crunch
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.12);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);

      // Follow up with happy wood pop
      setTimeout(() => {
        this.playWoodTap('G5');
      }, 100);
    } catch {
      // Fallback
    }
  }

  /**
   * 5. Âm thanh Giọt Nước Tung Tóe (Water Splash & Ripple)
   */
  public playSplash(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.25);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Fallback
    }
  }

  /**
   * 6. Âm thanh Đom Đóm Phát Sáng (Firefly Chime)
   */
  public playFireflyChime(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      ['E6', 'B5', 'G6'].forEach((n, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(this.noteToFreq(n), now + i * 0.07);

        gain.gain.setValueAtTime(0.2, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.38);
      });
    } catch {
      // Fallback
    }
  }

  /**
   * 7. Âm thanh Cơn Gió Thổi (Breeze whoosh)
   */
  public playBreeze(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(320, now + 0.3);
      osc.frequency.linearRampToValueAtTime(150, now + 0.7);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.8);
    } catch {
      // Fallback
    }
  }

  /**
   * 8. Giọng đọc tiếng Anh chuẩn Sư phạm Nhi khoa (Chậm rãi, Tươi vui)
   * rate: 0.85, pitch: 1.18
   */
  public speak(
    text: string,
    options: { rate?: number; pitch?: number; lang?: string; onEnd?: () => void } = {}
  ): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const { rate = 0.85, pitch = 1.18, lang = 'en-US', onEnd } = options;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = rate;
    utter.pitch = pitch;

    if (onEnd) {
      utter.onend = onEnd;
      utter.onerror = onEnd;
    }

    // Try finding friendly US/UK voice
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith(lang.substring(0, 2)) &&
          (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Victoria'))
      );
      if (preferred) utter.voice = preferred;
    }

    window.speechSynthesis.speak(utter);
  }

  public cancelSpeech(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const MeadowAudioEngine = new MeadowAudioEngineService();
export default MeadowAudioEngine;
