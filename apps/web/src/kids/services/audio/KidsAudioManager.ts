/**
 * KidsAudioManager.ts
 * Global Web Audio-based Ambient Music & Sound Effects Engine for Kids Module.
 * Features:
 *  - Continuous ambient melody across route transitions (never restarts abruptly)
 *  - Theme/World-specific ambient presets (forest, supermarket, kitchen, space, island, world)
 *  - Audio ducking (automatically lowers music volume during voice narration)
 *  - Real-time synthesizers for SFX (footstep, eat, cart, rocket, pop, cheer, ding, unlock)
 *  - Persistent settings in localStorage
 *  - Auto-play policy compliance with polite user-gesture unlocking
 */

export type KidsMusicTheme = 'world' | 'forest' | 'supermarket' | 'kitchen' | 'space' | 'island' | 'bedtime';

class KidsAudioManager {
  private ctx: AudioContext | null = null;
  private musicGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  private masterGainNode: GainNode | null = null;

  private musicEnabled: boolean = true;
  private isSfxEnabled: boolean = true;
  private currentTheme: KidsMusicTheme = 'world';
  private isPlaying: boolean = false;
  private melodyIntervalId: any = null;
  private isDucked: boolean = false;

  private baseMusicVolume: number = 0.16;
  private duckedMusicVolume: number = 0.01;
  private sfxVolume: number = 0.35;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedMusic = localStorage.getItem('kids_music_enabled');
      if (savedMusic !== null) {
        this.musicEnabled = savedMusic === 'true';
      }
      const savedSfx = localStorage.getItem('kids_sfx_enabled');
      if (savedSfx !== null) {
        this.isSfxEnabled = savedSfx === 'true';
      }
    }
  }

  /**
   * Initializes or resumes the AudioContext upon user gesture without recursive loop.
   */
  public initContext(): void {
    if (typeof window === 'undefined') return;
    try {
      if (!this.ctx) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          this.ctx = new AudioCtxClass();

          this.masterGainNode = this.ctx.createGain();
          this.masterGainNode.gain.setValueAtTime(1.0, this.ctx.currentTime);
          this.masterGainNode.connect(this.ctx.destination);

          this.musicGainNode = this.ctx.createGain();
          this.musicGainNode.gain.setValueAtTime(
            this.musicEnabled ? this.baseMusicVolume : 0,
            this.ctx.currentTime
          );
          this.musicGainNode.connect(this.masterGainNode);

          this.sfxGainNode = this.ctx.createGain();
          this.sfxGainNode.gain.setValueAtTime(
            this.isSfxEnabled ? this.sfxVolume : 0,
            this.ctx.currentTime
          );
          this.sfxGainNode.connect(this.masterGainNode);
        }
      }

      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      console.warn('Kids AudioContext initialization deferred:', e);
    }
  }

  /**
   * Toggle music on/off
   */
  public toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('kids_music_enabled', String(this.musicEnabled));
    }

    if (this.ctx && this.musicGainNode) {
      const targetVol = this.musicEnabled
        ? (this.isDucked ? this.duckedMusicVolume : this.baseMusicVolume)
        : 0;
      this.musicGainNode.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.1);
    }

    if (this.musicEnabled) {
      this.startAmbientMusic(this.currentTheme);
    } else {
      this.stopAmbientMusic();
    }

    return this.musicEnabled;
  }

  public isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  public getMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  /**
   * Starts or transitions world ambient music without restarting if already playing
   */
  public startWorldMusic(theme: KidsMusicTheme = 'world'): void {
    if (this.isPlaying && this.currentTheme === theme) return;
    this.setMusicTheme(theme);
  }

  /**
   * Crossfade or switch to game-specific ambience
   */
  public playGameAmbience(theme: KidsMusicTheme): void {
    this.setMusicTheme(theme);
  }

  /**
   * Toggle SFX on/off
   */
  public toggleSfx(): boolean {
    this.isSfxEnabled = !this.isSfxEnabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('kids_sfx_enabled', String(this.isSfxEnabled));
    }
    if (this.ctx && this.sfxGainNode) {
      this.sfxGainNode.gain.setValueAtTime(
        this.isSfxEnabled ? this.sfxVolume : 0,
        this.ctx.currentTime
      );
    }
    return this.isSfxEnabled;
  }

  public getSfxEnabled(): boolean {
    return this.isSfxEnabled;
  }

  /**
   * Duck background music while speech or voice narration is playing
   */
  public duckMusic(): void {
    this.isDucked = true;
    if (this.ctx && this.musicGainNode && this.musicEnabled) {
      this.musicGainNode.gain.setTargetAtTime(this.duckedMusicVolume, this.ctx.currentTime, 0.15);
    }
  }

  /**
   * Restore music volume after voice finishes
   */
  public restoreMusic(): void {
    this.isDucked = false;
    if (this.ctx && this.musicGainNode && this.musicEnabled) {
      this.musicGainNode.gain.setTargetAtTime(this.baseMusicVolume, this.ctx.currentTime, 0.3);
    }
  }

  /**
   * Smoothly changes ambient music theme (crossfade)
   */
  public setMusicTheme(theme: KidsMusicTheme): void {
    if (this.currentTheme === theme && this.isPlaying) return;
    this.currentTheme = theme;
    if (this.musicEnabled) {
      this.startAmbientMusic(theme);
    }
  }

  /**
   * Starts synthesizing cheerful, upbeat bouncy marimba and glockenspiel tunes for kids
   */
  private startAmbientMusic(theme: KidsMusicTheme): void {
    this.stopAmbientMusic();
    this.initContext();
    if (!this.ctx || !this.musicEnabled) return;

    this.isPlaying = true;

    // Upbeat & Playful Melodic Motifs (Happy Marimba & Glockenspiel)
    // C Major & G Major Bright Children Tunes (Do-Mi-Sol-La-Do)
    const melodyPatterns: Record<KidsMusicTheme, { notes: number[]; bass: number[] }> = {
      world: {
        // Cheerful bouncy nursery tune (C4 - E4 - G4 - A4 - C5 - G4 - E4 - D4)
        notes: [261.63, 329.63, 392.0, 440.0, 523.25, 392.0, 329.63, 293.66],
        bass: [130.81, 164.81, 196.0, 146.83],
      },
      forest: {
        // Woodsy flute & xylophone (F4 - A4 - C5 - D5 - C5 - A4 - G4 - F4)
        notes: [349.23, 440.0, 523.25, 587.33, 523.25, 440.0, 392.0, 349.23],
        bass: [174.61, 220.0, 261.63, 196.0],
      },
      supermarket: {
        // Fast, happy shopping chimes
        notes: [392.0, 493.88, 587.33, 659.25, 587.33, 493.88, 440.0, 392.0],
        bass: [196.0, 246.94, 293.66, 220.0],
      },
      kitchen: {
        // Bouncy chef rhythm (D4 - F#4 - A4 - B4)
        notes: [293.66, 369.99, 440.0, 493.88, 440.0, 369.99, 329.63, 293.66],
        bass: [146.83, 185.0, 220.0, 164.81],
      },
      space: {
        // Celestial sparkly bell melody
        notes: [329.63, 392.0, 493.88, 587.33, 659.25, 587.33, 493.88, 392.0],
        bass: [164.81, 196.0, 246.94, 196.0],
      },
      island: {
        // Tropical steelpan bounce
        notes: [261.63, 329.63, 392.0, 523.25, 440.0, 392.0, 329.63, 392.0],
        bass: [130.81, 164.81, 196.0, 174.61],
      },
      bedtime: {
        // Gentle warm music box lullaby
        notes: [261.63, 329.63, 392.0, 349.23, 329.63, 293.66, 261.63, 196.0],
        bass: [130.81, 174.61, 196.0, 130.81],
      },
    };

    const currentPattern = melodyPatterns[theme] || melodyPatterns.world;
    let step = 0;

    const playPlayfulBeat = () => {
      if (!this.ctx || !this.musicEnabled || !this.musicGainNode) return;
      try {
        const now = this.ctx.currentTime;
        const melodyFreq = currentPattern.notes[step % currentPattern.notes.length];
        const bassFreq = currentPattern.bass[Math.floor(step / 2) % currentPattern.bass.length];
        step = (step + 1) % currentPattern.notes.length;

        // 1. Bright Cheerful Glockenspiel / Marimba Chime
        const oscMelody = this.ctx.createOscillator();
        const gainMelody = this.ctx.createGain();
        oscMelody.type = 'triangle';
        oscMelody.frequency.setValueAtTime(melodyFreq, now);

        gainMelody.gain.setValueAtTime(0.0001, now);
        gainMelody.gain.linearRampToValueAtTime(0.12, now + 0.03);
        gainMelody.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

        oscMelody.connect(gainMelody);
        gainMelody.connect(this.musicGainNode);
        oscMelody.start(now);
        oscMelody.stop(now + 0.58);

        // 2. Warm acoustic bass pluck (plays on every other beat for cheerful swing)
        if (step % 2 === 0) {
          const oscBass = this.ctx.createOscillator();
          const gainBass = this.ctx.createGain();
          oscBass.type = 'sine';
          oscBass.frequency.setValueAtTime(bassFreq, now);

          gainBass.gain.setValueAtTime(0.0001, now);
          gainBass.gain.linearRampToValueAtTime(0.09, now + 0.04);
          gainBass.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

          oscBass.connect(gainBass);
          gainBass.connect(this.musicGainNode);
          oscBass.start(now);
          oscBass.stop(now + 0.7);
        }
      } catch (err) {
        // Safe fallback
      }
    };

    if (this.ctx && this.musicGainNode) {
      const targetVol = this.musicEnabled
        ? (this.isDucked ? this.duckedMusicVolume : this.baseMusicVolume)
        : 0;
      try {
        this.musicGainNode.gain.cancelScheduledValues(this.ctx.currentTime);
        this.musicGainNode.gain.setValueAtTime(targetVol, this.ctx.currentTime);
      } catch (e) {}
    }

    // Upbeat rhythmic tempo (360ms per step = 166 BPM lively child tempo)
    playPlayfulBeat();
    this.melodyIntervalId = setInterval(playPlayfulBeat, 380);
  }

  public stopAmbientMusic(): void {
    if (this.melodyIntervalId) {
      clearInterval(this.melodyIntervalId);
      this.melodyIntervalId = null;
    }
    if (this.ctx && this.musicGainNode) {
      try {
        this.musicGainNode.gain.cancelScheduledValues(this.ctx.currentTime);
        this.musicGainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      } catch (e) {}
    }
    this.isPlaying = false;
  }

  /**
   * Stop all music, sfx and suspend AudioContext completely
   */
  public stopAll(): void {
    this.stopAmbientMusic();
    if (this.ctx && this.sfxGainNode) {
      try {
        this.sfxGainNode.gain.cancelScheduledValues(this.ctx.currentTime);
        this.sfxGainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      } catch (e) {}
    }
    if (this.ctx && this.ctx.state === 'running') {
      try {
        this.ctx.suspend().catch(() => {});
      } catch (e) {}
    }
  }

  /* ----------------------------------------------------
   * SOUND EFFECTS (SFX)
   * ---------------------------------------------------- */
  public playSFX(
    effect:
      | 'click'
      | 'pop'
      | 'footstep'
      | 'eat'
      | 'cart'
      | 'rocket'
      | 'ding'
      | 'unlock'
      | 'cheer'
      | 'water'
  ): void {
    if (!this.isSfxEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGainNode) return;

    try {
      const now = this.ctx.currentTime;

      switch (effect) {
        case 'click': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          osc.connect(gain);
          gain.connect(this.sfxGainNode);
          osc.start(now);
          osc.stop(now + 0.06);
          break;
        }

        case 'pop': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc.connect(gain);
          gain.connect(this.sfxGainNode);
          osc.start(now);
          osc.stop(now + 0.09);
          break;
        }

        case 'footstep': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc.connect(gain);
          gain.connect(this.sfxGainNode);
          osc.start(now);
          osc.stop(now + 0.09);
          break;
        }

        case 'eat': {
          // Cute crunchy munching sound
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(240, now);
          osc.frequency.setValueAtTime(320, now + 0.04);
          osc.frequency.setValueAtTime(200, now + 0.08);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.connect(gain);
          gain.connect(this.sfxGainNode);
          osc.start(now);
          osc.stop(now + 0.13);
          break;
        }

        case 'cart': {
          // Shopping cart rolling click
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(450, now);
          osc.frequency.exponentialRampToValueAtTime(650, now + 0.12);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.connect(gain);
          gain.connect(this.sfxGainNode);
          osc.start(now);
          osc.stop(now + 0.13);
          break;
        }

        case 'rocket': {
          // Deep rumble launch whoosh
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(80, now);
          osc.frequency.exponentialRampToValueAtTime(360, now + 0.6);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
          osc.connect(gain);
          gain.connect(this.sfxGainNode);
          osc.start(now);
          osc.stop(now + 0.75);
          break;
        }

        case 'ding': {
          // Harmonic chime
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, now);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
          osc.connect(gain);
          gain.connect(this.sfxGainNode);
          osc.start(now);
          osc.stop(now + 0.55);
          break;
        }

        case 'unlock': {
          // Double chirp unlock
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(523.25, now);
          osc.frequency.setValueAtTime(659.25, now + 0.08);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.connect(gain);
          gain.connect(this.sfxGainNode);
          osc.start(now);
          osc.stop(now + 0.26);
          break;
        }

        case 'cheer': {
          // Triad victory chime
          const notes = [523.25, 659.25, 783.99, 1046.5];
          notes.forEach((freq, idx) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            gain.gain.setValueAtTime(0.2, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.6);
            osc.connect(gain);
            gain.connect(this.sfxGainNode!);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.65);
          });
          break;
        }

        case 'water': {
          // Gentle splash drop
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.exponentialRampToValueAtTime(900, now + 0.15);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          osc.connect(gain);
          gain.connect(this.sfxGainNode);
          osc.start(now);
          osc.stop(now + 0.16);
          break;
        }
      }
    } catch (e) {
      // Safe fallback
    }
  }
}

export const kidsAudioManager = new KidsAudioManager();
