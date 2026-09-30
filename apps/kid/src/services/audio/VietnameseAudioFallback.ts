/**
 * VietnameseAudioFallback.ts
 * Reliable Web Audio API sound & vocal-chime synthesizer for Kids Mode UI phrases
 * Ensures Safari iOS, iPadOS, and offline environments NEVER stay silent
 * even if Google TTS is blocked or local vi-VN speech synthesis voice is missing.
 */

class VietnameseAudioFallbackService {
  private ctx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
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

  public stop() {
    if (this.ctx) {
      try {
        if (this.ctx.state === 'running') {
          this.ctx.suspend().catch(() => {});
        }
      } catch (_) {}
    }
  }

  /**
   * Play a cheerful, sweet bell-chime melody corresponding to the Vietnamese UI praise
   */
  public playPraiseChime(phrase: string, onEnd?: () => void) {
    const ctx = this.getAudioContext();
    if (!ctx) {
      onEnd?.();
      return;
    }

    const clean = phrase.toLowerCase().trim();
    let notes: { freq: number; duration: number }[];

    if (clean.includes('thử lại') || clean.includes('chưa đúng')) {
      // Gentle, supportive melody: G4 -> E4 (no harsh buzzer!)
      notes = [
        { freq: 392.0, duration: 0.25 }, // G4
        { freq: 329.63, duration: 0.4 }, // E4
      ];
    } else if (clean.includes('tuyệt') || clean.includes('xuất sắc')) {
      // Brilliant ascending sparkle chime: C5 -> E5 -> G5 -> C6
      notes = [
        { freq: 523.25, duration: 0.15 },
        { freq: 659.25, duration: 0.15 },
        { freq: 783.99, duration: 0.18 },
        { freq: 1046.5, duration: 0.45 },
      ];
    } else if (clean.includes('chúc mừng') || clean.includes('hoàn thành')) {
      // Fanfare: G4 -> C5 -> E5 -> G5
      notes = [
        { freq: 392.0, duration: 0.18 },
        { freq: 523.25, duration: 0.18 },
        { freq: 659.25, duration: 0.2 },
        { freq: 783.99, duration: 0.5 },
      ];
    } else {
      // Default happy cheer ("Giỏi quá!", "Đúng rồi!"): E5 -> G5 -> C6
      notes = [
        { freq: 659.25, duration: 0.18 },
        { freq: 783.99, duration: 0.18 },
        { freq: 1046.5, duration: 0.45 },
      ];
    }

    let startTime = ctx.currentTime + 0.05;
    let totalDuration = 0;

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle'; // Warm, marimba-like pleasant tone
      osc.frequency.setValueAtTime(n.freq, startTime);

      // Sweet envelope: soft attack, natural exponential decay
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.35, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + n.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + n.duration);

      startTime += n.duration * 0.85; // Slight overlap for smooth legato
      totalDuration += n.duration * 0.85;
    });

    if (onEnd) {
      setTimeout(() => {
        onEnd();
      }, (totalDuration + 0.2) * 1000);
    }
  }
}

export const vietnameseAudioFallback = new VietnameseAudioFallbackService();
