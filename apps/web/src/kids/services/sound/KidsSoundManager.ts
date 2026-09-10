/**
 * KidsSoundManager.ts
 * Web Audio API Sound Synthesizer for Kids English Learning System
 * - Zero external mp3 dependencies (100% offline & instant playback)
 * - Safe for iOS Safari & Android Chrome
 * - Synthesizes friendly, child-safe chimes, bubble pops, and victory fanfares
 * - Global sound ON/OFF toggle persisted in localStorage
 */

export type SoundEffectType =
  | 'click'
  | 'pop'
  | 'correct'
  | 'wrong'
  | 'star'
  | 'success'
  | 'level_up'
  | 'unlock'
  | 'celebration'
  | 'encourage';

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
          // Playful wooden/bubble pop sound (freq rapid sweep down)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(520, now);
          osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.09);
          break;
        }

        case 'correct': {
          // Melodic happy two-tone chime: C5 (523Hz) -> G5 (784Hz)
          const notes = [523.25, 783.99];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.1);

            gain.gain.setValueAtTime(0, now + idx * 0.1);
            gain.gain.linearRampToValueAtTime(0.35, now + idx * 0.1 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.28);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.1);
            osc.stop(now + idx * 0.1 + 0.3);
          });
          break;
        }

        case 'wrong':
        case 'encourage': {
          // Soft, non-aggressive gentle 'try again' wobble chime
          const notes = [392.0, 349.23];
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

        case 'star': {
          // Sparkle high ping: E6 (1318Hz) -> A6 (1760Hz)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1318.51, now);
          osc.frequency.exponentialRampToValueAtTime(1760.0, now + 0.18);

          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.36);
          break;
        }

        case 'success':
        case 'unlock':
        case 'level_up': {
          // Major chord arpeggio: C5 -> E5 -> G5 -> C6
          const chord = [523.25, 659.25, 783.99, 1046.5];
          chord.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.09);

            gain.gain.setValueAtTime(0, now + idx * 0.09);
            gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.09 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.09);
            osc.stop(now + idx * 0.09 + 0.38);
          });
          break;
        }

        case 'celebration': {
          // Victory Fanfare: C5 -> C5 -> C5 -> G5 -> C6
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
    } catch (_) {
      // AudioContext fallback silent catch
    }
  }

  public playPop() { this.play('pop'); }
  public playDing() { this.play('correct'); }
  public playCorrect() { this.play('correct'); }
  public playIncorrect() { this.play('wrong'); }
  public playFanfare() { this.play('celebration'); }
}

export const kidsSound = new KidsSoundManager();
export const soundManager = kidsSound;
export default kidsSound;
