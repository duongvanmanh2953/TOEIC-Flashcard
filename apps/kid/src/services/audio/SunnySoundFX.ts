/**
 * SUNNY MEADOW V2.0 / V3.0 - SYNTHESIZER SOUND ENGINE (SunnySoundFX)
 * Zero external .mp3 files (zero 404s). Built 100% on native Web Audio API.
 */

class SunnySoundFXService {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private bgmEnabled: boolean = false;
  private bgmIntervalId: number | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedSound = localStorage.getItem('sunny_sound_fx');
      if (savedSound !== null) this.soundEnabled = savedSound === 'true';

      const savedBgm = localStorage.getItem('sunny_ambient_bgm');
      if (savedBgm !== null) this.bgmEnabled = savedBgm === 'true';
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('sunny_sound_fx', String(this.soundEnabled));
    if (!this.soundEnabled && this.bgmEnabled) {
      this.stopAmbientBGM();
    }
    return this.soundEnabled;
  }

  public isBGMEnabled(): boolean {
    return this.bgmEnabled;
  }

  public toggleAmbientBGM(): boolean {
    this.bgmEnabled = !this.bgmEnabled;
    localStorage.setItem('sunny_ambient_bgm', String(this.bgmEnabled));
    if (this.bgmEnabled) {
      this.startAmbientBGM();
    } else {
      this.stopAmbientBGM();
    }
    return this.bgmEnabled;
  }

  private noteFreq(note: string): number {
    const table: Record<string, number> = {
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
      C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
      C6: 1046.5, D6: 1174.66, E6: 1318.51, G6: 1567.98,
    };
    return table[note] || 440;
  }

  // 1. playButtonClick: Tiếng "pop" bong bóng / phím gỗ mềm
  public playButtonClick(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {}
  }

  // 2. playCardSelect: Âm thanh chạm chọn thẻ bài / item
  public playCardSelect(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, now); // E5

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {}
  }

  // 3. playCardFlip: Âm thanh lật thẻ bài 3D ("whoosh" gió lướt êm ái)
  public playCardFlip(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.linearRampToValueAtTime(520, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.22);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.28, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch {}
  }

  // 4. playCorrect: Hợp âm vui tươi (C5 - E5 - G5 - C6)
  public playCorrect(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      ['C5', 'E5', 'G5', 'C6'].forEach((n, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(this.noteFreq(n), now + idx * 0.07);

        gain.gain.setValueAtTime(0.28, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.5);
      });
    } catch {}
  }

  // 5. playWrong: Nhún nhẹ đàn hồi F4 -> D4 (Zero-punishment, không gây sợ)
  public playWrong(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [{ note: 'F4', t: now }, { note: 'D4', t: now + 0.12 }].forEach(({ note, t }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(this.noteFreq(note), t);

        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.25);
      });
    } catch {}
  }

  // 6. playStarAward(starIndex: 1 | 2 | 3): Ting lấp lánh tăng dần cao độ (C5 -> E5 -> G5)
  public playStarAward(starIndex: 1 | 2 | 3): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const starNotes = ['C5', 'E5', 'G5'];
      const mainNote = starNotes[starIndex - 1] || 'G5';

      // Primary tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(this.noteFreq(mainNote), now);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);

      // Shimmer sparkle harmonic
      const sparkle = ctx.createOscillator();
      const sparkleGain = ctx.createGain();

      sparkle.type = 'triangle';
      sparkle.frequency.setValueAtTime(this.noteFreq(mainNote) * 2, now + 0.05);

      sparkleGain.gain.setValueAtTime(0.18, now + 0.05);
      sparkleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      sparkle.connect(sparkleGain);
      sparkleGain.connect(ctx.destination);

      sparkle.start(now + 0.05);
      sparkle.stop(now + 0.5);
    } catch {}
  }

  // 7. playFireworkBurst: Tiếng pháo hoa nổ lách tách rực rỡ
  public playFireworkBurst(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Low boom
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);

      // Sparkles cascade
      ['C6', 'E6', 'G6'].forEach((n, i) => {
        const sp = ctx.createOscillator();
        const spg = ctx.createGain();

        sp.type = 'triangle';
        sp.frequency.setValueAtTime(this.noteFreq(n), now + 0.1 + i * 0.08);

        spg.gain.setValueAtTime(0.2, now + 0.1 + i * 0.08);
        spg.gain.exponentialRampToValueAtTime(0.001, now + 0.1 + i * 0.08 + 0.3);

        sp.connect(spg);
        spg.connect(ctx.destination);

        sp.start(now + 0.1 + i * 0.08);
        sp.stop(now + 0.1 + i * 0.08 + 0.35);
      });
    } catch {}
  }

  // 8. playVictoryFanfare: Kèn chiến thắng tưng bừng
  public playVictoryFanfare(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const melody = [
        { note: 'C5', time: now + 0.00, dur: 0.14 },
        { note: 'E5', time: now + 0.15, dur: 0.14 },
        { note: 'G5', time: now + 0.30, dur: 0.14 },
        { note: 'C6', time: now + 0.45, dur: 0.55 },
      ];

      melody.forEach(({ note, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(this.noteFreq(note), time);

        gain.gain.setValueAtTime(0.35, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + dur + 0.05);
      });
    } catch {}
  }

  // 9. Specific Game Sounds (Crunch for picnic, Splash for pond, Breeze for windmill)
  public playCrunch(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(70, now + 0.12);

      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {}
  }

  public playSplash(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.09);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.25);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }

  public playBreeze(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(380, now + 0.25);
      osc.frequency.linearRampToValueAtTime(160, now + 0.65);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.75);
    } catch {}
  }

  // 10. Ambient BGM (Soft Kalimba arpeggios looping in the background)
  public startAmbientBGM(): void {
    if (!this.bgmEnabled || !this.soundEnabled) return;
    if (this.bgmIntervalId) return;

    const kalimbaNotes = ['C5', 'E5', 'G5', 'A5', 'G5', 'E5', 'D5', 'C5'];
    let noteIdx = 0;

    const playStep = () => {
      if (!this.bgmEnabled || !this.soundEnabled) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;
      try {
        const note = kalimbaNotes[noteIdx % kalimbaNotes.length];
        noteIdx++;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(this.noteFreq(note), now);

        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.8);
      } catch {}
    };

    playStep();
    this.bgmIntervalId = window.setInterval(playStep, 1400);
  }

  public stopAmbientBGM(): void {
    if (this.bgmIntervalId) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }
}

export const SunnySoundFX = new SunnySoundFXService();
export default SunnySoundFX;
