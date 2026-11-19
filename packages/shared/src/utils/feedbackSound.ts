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
 * Play a vibrant, crisp, multi-layered triumphant "Correct" chime with sparkle & combo ascension
 */
export function playCorrectSound(streak: number = 0) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Pitch multiplier based on combo streak (up to 1.35x)
    const pitchFactor = 1 + Math.min(6, Math.max(0, streak)) * 0.05;

    // Layer 1: Sparkling ascending major arpeggio [C5, E5, G5, C6, E6]
    const arpeggio = [523.25, 659.25, 783.99, 1046.5, 1318.5].map((f) => f * pitchFactor);
    arpeggio.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);

      gain.gain.setValueAtTime(0, now + idx * 0.045);
      gain.gain.linearRampToValueAtTime(0.24, now + idx * 0.045 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.38);
    });

    // Layer 2: Warm harmonic brass/pad chord backing (C5 + G5 sustain)
    [523.25 * pitchFactor, 783.99 * pitchFactor].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + 0.08);

      gain.gain.setValueAtTime(0, now + 0.08);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + 0.08);
      osc.stop(now + 0.58);
    });

    // Layer 3: High crystal sparkle chime (C7)
    const sparkleOsc = ctx.createOscillator();
    const sparkleGain = ctx.createGain();
    sparkleOsc.type = 'sine';
    sparkleOsc.frequency.setValueAtTime(2093 * pitchFactor, now + 0.18);
    sparkleGain.gain.setValueAtTime(0, now + 0.18);
    sparkleGain.gain.linearRampToValueAtTime(0.15, now + 0.2);
    sparkleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    sparkleOsc.connect(sparkleGain);
    sparkleGain.connect(ctx.destination);
    sparkleOsc.start(now + 0.18);
    sparkleOsc.stop(now + 0.52);

    // If combo > 1: Power-up ascending frequency sweep
    if (streak > 1) {
      const sweepOsc = ctx.createOscillator();
      const sweepGain = ctx.createGain();
      sweepOsc.type = 'sawtooth';
      sweepOsc.frequency.setValueAtTime(440, now);
      sweepOsc.frequency.exponentialRampToValueAtTime(1760, now + 0.25);

      sweepGain.gain.setValueAtTime(0.08, now);
      sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      sweepOsc.connect(sweepGain);
      sweepGain.connect(ctx.destination);

      sweepOsc.start(now);
      sweepOsc.stop(now + 0.3);
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([25, 30, 45]);
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
 * Play subtle urgent tick for countdown
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
 * Play urgent warning tick for the final 3-2-1 seconds
 */
export function playWarningTickSound(secondsRemaining?: number) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Pitch increases as secondsRemaining drops (3: 880Hz, 2: 1100Hz, 1: 1320Hz)
    const freq = secondsRemaining === 1 ? 1320 : secondsRemaining === 2 ? 1100 : 880;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  } catch (_) {}
}

/**
 * Play crisp electronic chime when round timer reaches 0 and answers are locked
 */
export function playRoundEndSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.3);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
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
 * Synthesized Procedural Game BGM Engine (Arcade Battle & High-Tension Countdown)
 * Zero external audio files required, perfectly looping, dynamic BPM & urgent countdown pacing.
 */
class LiveBgmPlayer {
  private isPlaying = false;
  private isUrgent = false;
  private intervalId: any = null;
  private volumeNode: GainNode | null = null;
  private step = 0;
  private volume = 0.16; // Balanced default background volume

  // Driving Arena minor progression: A2, C3, D3, F3
  private bassNotes = [110.0, 130.81, 146.83, 174.61];
  // Melodic arpeggio in A Minor: A4, C5, D5, E5, G5, A5
  private melodyNotes = [440.0, 523.25, 587.33, 659.25, 783.99, 880.0];
  // High tension countdown pitches
  private tensionNotes = [659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];

  public start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.step = 0;

    const ctx = getAudioContext();
    if (!ctx) return;

    this.volumeNode = ctx.createGain();
    this.volumeNode.gain.setValueAtTime(this.volume, ctx.currentTime);
    this.volumeNode.connect(ctx.destination);

    this.restartLoop();
  }

  private restartLoop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (!this.isPlaying) return;

    // Normal tempo: ~135 BPM (220ms per step)
    // Urgent tempo: ~195 BPM (140ms per step - dồn dập, hồi hộp, hối thúc!)
    const stepDurationMs = this.isUrgent ? 140 : 220;

    this.intervalId = setInterval(() => {
      if (!this.isPlaying) return;
      this.tick();
    }, stepDurationMs);
  }

  private tick() {
    const ctx = getAudioContext();
    if (!ctx || !this.volumeNode) return;
    const now = ctx.currentTime;

    const barStep = this.step % 16;

    // 1. KICK / HEARTBEAT DRUM
    // In normal mode: beats 0 and 8. In urgent mode: beats 0, 4, 8, 12 (intense double-time pulse!)
    const isKickStep = this.isUrgent ? barStep % 4 === 0 : barStep === 0 || barStep === 8;
    if (isKickStep) {
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();

      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(this.isUrgent ? 160 : 130, now);
      kickOsc.frequency.exponentialRampToValueAtTime(38, now + 0.12);

      kickGain.gain.setValueAtTime(this.isUrgent ? 0.32 : 0.22, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      kickOsc.connect(kickGain);
      kickGain.connect(this.volumeNode);

      kickOsc.start(now);
      kickOsc.stop(now + 0.16);
    }

    // 2. SYNTH BASSLINE
    // Plucky electro bassline
    if (this.step % 2 === 0 || this.isUrgent) {
      const bassIndex = Math.floor(barStep / 4) % this.bassNotes.length;
      const bassFreq = this.bassNotes[bassIndex];

      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();

      bassOsc.type = this.isUrgent ? 'sawtooth' : 'triangle';
      bassOsc.frequency.setValueAtTime(bassFreq, now);

      bassGain.gain.setValueAtTime(this.isUrgent ? 0.18 : 0.14, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + (this.isUrgent ? 0.18 : 0.28));

      bassOsc.connect(bassGain);
      bassGain.connect(this.volumeNode);

      bassOsc.start(now);
      bassOsc.stop(now + (this.isUrgent ? 0.2 : 0.3));
    }

    // 3. HI-HAT / CRISP TICK (Urgent ticking clock effect)
    if (barStep % 2 === 1 || this.isUrgent) {
      const hatOsc = ctx.createOscillator();
      const hatGain = ctx.createGain();

      hatOsc.type = 'square';
      // Urgent mode uses higher ticking pitch for intense clock ticking
      hatOsc.frequency.setValueAtTime(this.isUrgent ? 2200 : 1200, now);

      hatGain.gain.setValueAtTime(this.isUrgent ? 0.08 : 0.035, now);
      hatGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.03);

      hatOsc.connect(hatGain);
      hatGain.connect(this.volumeNode);

      hatOsc.start(now);
      hatOsc.stop(now + 0.035);
    }

    // 4. MELODIC ARPEGGIO & TENSION RISER
    if (this.isUrgent) {
      // Escalating tension arpeggio that climbs up the scale
      const tensionIdx = barStep % this.tensionNotes.length;
      const freq = this.tensionNotes[tensionIdx];

      const melOsc = ctx.createOscillator();
      const melGain = ctx.createGain();

      melOsc.type = 'triangle';
      melOsc.frequency.setValueAtTime(freq, now);

      melGain.gain.setValueAtTime(0.12, now);
      melGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      melOsc.connect(melGain);
      melGain.connect(this.volumeNode);

      melOsc.start(now);
      melOsc.stop(now + 0.13);
    } else {
      // Regular upbeat rhythmic ping
      if (barStep % 4 === 1 || barStep % 4 === 3) {
        const melIdx = (this.step * 2 + 1) % this.melodyNotes.length;
        const melFreq = this.melodyNotes[melIdx];

        const melOsc = ctx.createOscillator();
        const melGain = ctx.createGain();

        melOsc.type = 'sine';
        melOsc.frequency.setValueAtTime(melFreq, now);

        melGain.gain.setValueAtTime(0.09, now);
        melGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        melOsc.connect(melGain);
        melGain.connect(this.volumeNode);

        melOsc.start(now);
        melOsc.stop(now + 0.24);
      }
    }

    this.step++;
  }

  /**
   * Toggle urgent high-tempo countdown mode when time is running out (<= 5s)
   */
  public setUrgent(urgent: boolean) {
    if (this.isUrgent === urgent) return;
    this.isUrgent = urgent;
    if (this.isPlaying) {
      this.restartLoop();
    }
  }

  public getIsUrgent(): boolean {
    return this.isUrgent;
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
    this.isUrgent = false;
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
