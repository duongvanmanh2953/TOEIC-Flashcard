/**
 * KidsSoundManager.ts
 * High-Quality Web Audio API Sound Synthesizer for Kids English Learning System
 * - 100% Offline, zero external MP3 dependencies
 * - Safe for iOS Safari & Android Chrome
 * - Authentic child-friendly sound effects: Bubbly pops, crystal sparkles, card whoosh, victory fanfares
 */

export type SoundEffectType =
  | 'click'
  | 'pop'
  | 'bubble_burst'
  | 'sparkle'
  | 'whoosh'
  | 'correct'
  | 'wrong'
  | 'star'
  | 'success'
  | 'level_up'
  | 'unlock'
  | 'celebration'
  | 'encourage'
  | 'train_whistle';

class KidsSoundManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('kids_sound_enabled');
      this.soundEnabled = stored !== 'false';
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('kids_sound_enabled', String(this.soundEnabled));
    }
    if (this.soundEnabled) {
      this.play('pop');
    }
    return this.soundEnabled;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('kids_sound_enabled', String(enabled));
    }
  }

  /**
   * Play synthesized sound effect
   */
  public play(type: SoundEffectType) {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      switch (type) {
        case 'click':
        case 'pop': {
          // Playful bubble/pop sound
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(620, now);
          osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);

          gain.gain.setValueAtTime(0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.1);
          break;
        }

        case 'bubble_burst': {
          // Double pop for soap bubble bursting
          [0, 0.035].forEach((offset, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            const baseFreq = idx === 0 ? 750 : 920;
            osc.frequency.setValueAtTime(baseFreq, now + offset);
            osc.frequency.exponentialRampToValueAtTime(220, now + offset + 0.08);

            gain.gain.setValueAtTime(0.3, now + offset);
            gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + offset);
            osc.stop(now + offset + 0.09);
          });
          break;
        }

        case 'whoosh': {
          // Soft card flip whoosh (filtered white noise + sine sweep)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(280, now);
          osc.frequency.linearRampToValueAtTime(540, now + 0.06);
          osc.frequency.exponentialRampToValueAtTime(160, now + 0.14);

          gain.gain.setValueAtTime(0.01, now);
          gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        }

        case 'sparkle':
        case 'star': {
          // High crystal ping arpeggio
          const sparkleNotes = [1046.5, 1318.5, 1567.98, 2093.0];
          sparkleNotes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);

            gain.gain.setValueAtTime(0.2, now + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.22);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.24);
          });
          break;
        }

        case 'correct': {
          // Melodic happy two-tone chime: C5 (523Hz) -> G5 (784Hz) -> C6 (1046Hz)
          const notes = [523.25, 659.25, 783.99, 1046.5];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);

            gain.gain.setValueAtTime(0, now + idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.35, now + idx * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.28);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.3);
          });
          break;
        }

        case 'wrong':
        case 'encourage': {
          // Gentle warm two-tone try again
          const notes = [392.0, 329.63];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.12);

            gain.gain.setValueAtTime(0.2, now + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.2);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.12);
            osc.stop(now + idx * 0.12 + 0.22);
          });
          break;
        }

        case 'success':
        case 'unlock':
        case 'level_up': {
          // Major chord fanfare
          const chord = [523.25, 659.25, 783.99, 1046.5];
          chord.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);

            gain.gain.setValueAtTime(0, now + idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.38);
          });
          break;
        }

        case 'celebration': {
          // Grand victory fanfare
          const fanfare = [
            { f: 523.25, t: 0.0, d: 0.1 },
            { f: 523.25, t: 0.12, d: 0.1 },
            { f: 523.25, t: 0.24, d: 0.1 },
            { f: 659.25, t: 0.38, d: 0.2 },
            { f: 783.99, t: 0.6, d: 0.2 },
            { f: 1046.5, t: 0.85, d: 0.55 },
          ];
          fanfare.forEach((n) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(n.f, now + n.t);

            gain.gain.setValueAtTime(0, now + n.t);
            gain.gain.linearRampToValueAtTime(0.35, now + n.t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + n.t);
            osc.stop(now + n.t + n.d + 0.05);
          });
          break;
        }
      }
    } catch (_) {}
  }

  /**
   * Synthesize rocket engine rumble / ignition
   */
  public playEngineIgnition(duration: number = 0.6) {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Low rumble oscillator with frequency modulation
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65, now);
      osc.frequency.linearRampToValueAtTime(110, now + duration);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      // Lowpass filter for deep muffled rumble
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, now);
      filter.frequency.linearRampToValueAtTime(380, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (_) {}
  }

  /**
   * Synthesize rocket launch accelerating whoosh
   */
  public playRocketLaunch(duration: number = 1.0) {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      // Rising pitch whoosh accelerating upwards
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + duration * 0.8);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (_) {}
  }

  /**
   * Springy squash/stretch bounce feedback
   */
  public playBounce() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(440, now + 0.05);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch (_) {}
  }

  /**
   * Authentic dual-tone steam train whistle
   */
  public playTrainWhistle() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Classic whistle notes: D5 (587Hz) + F#5 (740Hz)
      const freqs = [587.33, 739.99];
      // Two blasts: short toot (0.2s) followed by long blast (0.5s)
      const blasts = [
        { start: 0, dur: 0.22 },
        { start: 0.28, dur: 0.55 },
      ];
      blasts.forEach((blast) => {
        freqs.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + blast.start);
          osc.frequency.linearRampToValueAtTime(freq * 1.03, now + blast.start + blast.dur);

          // Bandpass filter to create resonant steam chamber acoustic
          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(freq, now + blast.start);
          filter.Q.setValueAtTime(8, now + blast.start);

          gain.gain.setValueAtTime(0.01, now + blast.start);
          gain.gain.linearRampToValueAtTime(0.2, now + blast.start + 0.04);
          gain.gain.setValueAtTime(0.18, now + blast.start + blast.dur - 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + blast.start + blast.dur);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + blast.start);
          osc.stop(now + blast.start + blast.dur + 0.02);
        });
      });
    } catch (_) {}
  }

  public playPop() { this.play('pop'); }
  public playBubbleBurst() { this.play('bubble_burst'); }
  public playWhoosh() { this.play('whoosh'); }
  public playSparkle() { this.play('sparkle'); }
  public playDing() { this.play('correct'); }
  public playCorrect() { this.play('correct'); }
  public playIncorrect() { this.play('wrong'); }
  public playFanfare() { this.play('celebration'); }
}

export const kidsSound = new KidsSoundManager();
export const soundManager = kidsSound;
export default kidsSound;

