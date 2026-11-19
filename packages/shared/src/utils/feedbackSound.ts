/**
 * Global Quiz, Battle & Live Stream Audio Engine (Web Audio API)
 * 100% zero-dependency, works offline, instant response with tactile haptics & synthesized BGM
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Unlock audio on first user touch/click for mobile browsers (iOS / Android)
if (typeof window !== 'undefined') {
  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    ['click', 'touchstart', 'keydown'].forEach((e) => window.removeEventListener(e, unlock));
  };
  ['click', 'touchstart', 'keydown'].forEach((e) => window.addEventListener(e, unlock, { once: true, passive: true }));
}

/**
 * Play a vibrant, crisp, rewarding "Correct" chime (C5 -> G5)
 */
export function playCorrectSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [523.25, 783.99]; // C5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.25, now + i * 0.08 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.3);
    });

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }
  } catch (_) {}
}

/**
 * Play an informative low "Wrong" buzz/thud with tactile vibration
 */
export function playWrongSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.25);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 50, 40]);
    }
  } catch (_) {}
}

/**
 * Play an ambient futuristic chime upon entering a Live Game room
 */
export function playRoomEnterSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Harmonic triad: F4, A4, C5, E5
    const chords = [349.23, 440.0, 523.25, 659.25];
    chords.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.06 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.65);
    });
  } catch (_) {}
}

/**
 * Play energetic game kickoff chime when Host presses Start
 */
export function playGameStartSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Ascending arpeggio: C4 -> E4 -> G4 -> C5
    const freqs = [261.63, 329.63, 392.0, 523.25];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.09);

      gain.gain.setValueAtTime(0, now + i * 0.09);
      gain.gain.linearRampToValueAtTime(0.25, now + i * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.4);
    });
  } catch (_) {}
}

/**
 * Play a dynamic cyber whoosh / sweep when switching to the next question
 */
export function playQuestionTransitionSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch (_) {}
}

/**
 * Play subtle urgent tick for last 5 seconds countdown
 */
export function playCountdownTickSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  } catch (_) {}
}

/**
 * Play grand victory fanfare for the top podium announcement
 */
export function playVictoryFanfare() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Victory fanfare notes: C5, E5, G5, C6 (extended sustain)
    const melody = [
      { f: 523.25, t: 0.0, d: 0.12 },
      { f: 523.25, t: 0.12, d: 0.12 },
      { f: 523.25, t: 0.24, d: 0.12 },
      { f: 659.25, t: 0.38, d: 0.2 },
      { f: 783.99, t: 0.6, d: 0.2 },
      { f: 1046.5, t: 0.82, d: 0.6 },
    ];

    melody.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + note.t);

      gain.gain.setValueAtTime(0, now + note.t);
      gain.gain.linearRampToValueAtTime(0.28, now + note.t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.t);
      osc.stop(now + note.t + note.d + 0.05);
    });
  } catch (_) {}
}

/**
 * Synthesized Procedural Game BGM Engine (Cyberpunk / Lo-Fi Electronic Pulse)
 * Zero external audio files required, perfectly looping and lightweight.
 */
class LiveBgmPlayer {
  private isPlaying = false;
  private intervalId: any = null;
  private volumeNode: GainNode | null = null;
  private step = 0;
  private volume = 0.15; // Soft default background volume

  // Chill upbeat pentatonic arpeggio sequence
  private bassNotes = [130.81, 146.83, 164.81, 196.0]; // C3, D3, E3, G3
  private melodyNotes = [261.63, 329.63, 392.0, 440.0, 523.25]; // C4, E4, G4, A4, C5

  public start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.step = 0;

    const ctx = getAudioContext();
    if (!ctx) return;

    // Master volume gain node
    this.volumeNode = ctx.createGain();
    this.volumeNode.gain.setValueAtTime(this.volume, ctx.currentTime);
    this.volumeNode.connect(ctx.destination);

    // 120 BPM = 125ms per 16th note
    this.intervalId = setInterval(() => {
      if (!this.isPlaying) return;
      this.tick();
    }, 250);
  }

  private tick() {
    const ctx = getAudioContext();
    if (!ctx || !this.volumeNode) return;
    const now = ctx.currentTime;

    // Bass note every 2 steps
    if (this.step % 2 === 0) {
      const bassFreq = this.bassNotes[(this.step / 2) % this.bassNotes.length];
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();

      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(bassFreq, now);

      bassGain.gain.setValueAtTime(0.2, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      bassOsc.connect(bassGain);
      bassGain.connect(this.volumeNode);

      bassOsc.start(now);
      bassOsc.stop(now + 0.38);
    }

    // Melodic ping on odd steps with pentatonic variation
    if (this.step % 4 === 1 || this.step % 4 === 3) {
      const melIdx = (this.step * 3) % this.melodyNotes.length;
      const melFreq = this.melodyNotes[melIdx];

      const melOsc = ctx.createOscillator();
      const melGain = ctx.createGain();

      melOsc.type = 'triangle';
      melOsc.frequency.setValueAtTime(melFreq, now);

      melGain.gain.setValueAtTime(0.12, now);
      melGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      melOsc.connect(melGain);
      melGain.connect(this.volumeNode);

      melOsc.start(now);
      melOsc.stop(now + 0.25);
    }

    this.step++;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.volumeNode) {
      const ctx = getAudioContext();
      if (ctx) {
        this.volumeNode.gain.setValueAtTime(this.volume, ctx.currentTime);
      }
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.volumeNode) {
      try {
        this.volumeNode.disconnect();
      } catch (_) {}
      this.volumeNode = null;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const liveBgmEngine = new LiveBgmPlayer();
