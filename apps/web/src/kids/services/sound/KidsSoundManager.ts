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
  | 'chew'
  | 'bubble_burst'
  | 'fruit_pop'
  | 'star_burst'
  | 'sparkle'
  | 'whoosh'
  | 'correct'
  | 'wrong'
  | 'star'
  | 'success'
  | 'level_up'
  | 'unlock'
  | 'chest_open'
  | 'water_splash'
  | 'celebration'
  | 'encourage'
  | 'train_whistle'
  | 'robot_snap'
  | 'robot_boot'
  | 'cut_vine'
  | 'rocket_blast'
  | 'coin_clink'
  | 'spring_bounce'
  | 'rock_crack'
  | 'dino_roar'
  | 'magic_portal'
  | 'cash_register';

export type KidsSoundMode = 'all' | 'voice_only' | 'muted';

class KidsSoundManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private soundMode: KidsSoundMode = 'all';
  private isUnlocked: boolean = false;
  private listeners: Set<(mode: KidsSoundMode) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const storedMode = localStorage.getItem('kids_sound_mode') as KidsSoundMode | null;
      if (storedMode === 'all' || storedMode === 'voice_only' || storedMode === 'muted') {
        this.soundMode = storedMode;
        this.soundEnabled = storedMode !== 'muted';
      } else {
        const stored = localStorage.getItem('kids_sound_enabled');
        this.soundEnabled = stored !== 'false';
        this.soundMode = this.soundEnabled ? 'all' : 'muted';
      }
      this.setupIOSUnlockListeners();
    }
  }

  /**
   * Global iOS Safari audio unlocker
   * Automatically unlocks suspended Web Audio Context & primes SpeechSynthesis on first touch/click
   */
  private setupIOSUnlockListeners() {
    if (typeof window === 'undefined') return;

    const unlockHandler = () => {
      this.unlockAudioForIOS();
      window.removeEventListener('touchstart', unlockHandler, true);
      window.removeEventListener('touchend', unlockHandler, true);
      window.removeEventListener('pointerdown', unlockHandler, true);
      window.removeEventListener('click', unlockHandler, true);
    };

    window.addEventListener('touchstart', unlockHandler, { once: true, capture: true });
    window.addEventListener('touchend', unlockHandler, { once: true, capture: true });
    window.addEventListener('pointerdown', unlockHandler, { once: true, capture: true });
    window.addEventListener('click', unlockHandler, { once: true, capture: true });
  }

  public unlockAudioForIOS() {
    if (typeof window === 'undefined') return;
    try {
      const ctx = this.getContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        // Play 1-sample silent buffer to unlock WebKit audio session
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      }

      // Prime iOS Safari SpeechSynthesis
      if ('speechSynthesis' in window && !window.speechSynthesis.speaking) {
        const silentUtterance = new SpeechSynthesisUtterance(' ');
        silentUtterance.volume = 0.01;
        silentUtterance.rate = 1.0;
        window.speechSynthesis.speak(silentUtterance);
      }
      this.isUnlocked = true;
    } catch (_) {}
  }

  public getContext(): AudioContext | null {
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
    return this.soundMode !== 'muted';
  }

  public getSoundMode(): KidsSoundMode {
    return this.soundMode;
  }

  public setSoundMode(mode: KidsSoundMode) {
    this.soundMode = mode;
    this.soundEnabled = mode !== 'muted';
    if (typeof window !== 'undefined') {
      localStorage.setItem('kids_sound_mode', mode);
      localStorage.setItem('kids_sound_enabled', String(this.soundEnabled));
    }
    this.notifyListeners();
    if (mode !== 'muted') {
      this.play('pop');
    }
  }

  public setMuted(muted: boolean) {
    this.setSoundMode(muted ? 'muted' : 'all');
  }

  public cycleSoundMode(): KidsSoundMode {
    const nextMode: KidsSoundMode =
      this.soundMode === 'all'
        ? 'voice_only'
        : this.soundMode === 'voice_only'
        ? 'muted'
        : 'all';
    this.setSoundMode(nextMode);
    return nextMode;
  }

  public subscribe(listener: (mode: KidsSoundMode) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((l) => {
      try {
        l(this.soundMode);
      } catch (_) {}
    });
  }

  public toggleSound(): boolean {
    const nextMode = this.soundMode === 'muted' ? 'all' : 'muted';
    this.setSoundMode(nextMode);
    return this.soundEnabled;
  }

  public setSoundEnabled(enabled: boolean) {
    this.setSoundMode(enabled ? 'all' : 'muted');
  }

  /**
   * Play synthesized sound effect
   */
  public play(type: SoundEffectType) {
    // If muted or voice_only, SFX are muted
    if (this.soundMode !== 'all') return;
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

        case 'fruit_pop': {
          // Juicy squishy bounce pop for fruits (Apple, Banana, Orange)
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(540, now);
          osc1.frequency.exponentialRampToValueAtTime(160, now + 0.11);

          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(820, now);
          osc2.frequency.exponentialRampToValueAtTime(320, now + 0.08);

          gain.gain.setValueAtTime(0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.13);
          osc2.stop(now + 0.13);
          break;
        }

        case 'star_burst': {
          // 5-note sparkling crystal arpeggio burst
          const notes = [1046.5, 1318.5, 1567.98, 2093.0, 2637.0];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.04);

            gain.gain.setValueAtTime(0.25, now + idx * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.25);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.04);
            osc.stop(now + idx * 0.04 + 0.27);
          });
          break;
        }

        case 'chest_open': {
          // Wooden latch click + golden sparkle chime
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.linearRampToValueAtTime(420, now + 0.15);

          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.24);

          // Golden chime follow-up
          [659.25, 1046.5].forEach((f, i) => {
            const chime = ctx.createOscillator();
            const g = ctx.createGain();
            chime.type = 'sine';
            chime.frequency.setValueAtTime(f, now + 0.12 + i * 0.08);
            g.gain.setValueAtTime(0.2, now + 0.12 + i * 0.08);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.12 + i * 0.08 + 0.3);
            chime.connect(g);
            g.connect(ctx.destination);
            chime.start(now + 0.12 + i * 0.08);
            chime.stop(now + 0.12 + i * 0.08 + 0.32);
          });
          break;
        }

        case 'water_splash': {
          // Bubbly splash for water drops / watering garden
          [520, 780, 1050].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);
            osc.frequency.exponentialRampToValueAtTime(220, now + idx * 0.05 + 0.09);

            gain.gain.setValueAtTime(0.25, now + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.1);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.11);
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

        case 'robot_snap': {
          // Sharp mechanical lock click + bright chime
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'square';
          osc1.frequency.setValueAtTime(800, now);
          osc1.frequency.exponentialRampToValueAtTime(200, now + 0.04);
          gain1.gain.setValueAtTime(0.3, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.06);

          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1046.5, now + 0.03);
          gain2.gain.setValueAtTime(0.25, now + 0.03);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(now + 0.03);
          osc2.stop(now + 0.16);
          break;
        }

        case 'robot_boot': {
          // Arpeggiated computer bootup chime + energetic rising tone
          const bootNotes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
          bootNotes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);
            gain.gain.setValueAtTime(0.18, now + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.18);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.2);
          });
          break;
        }

        case 'cut_vine': {
          // Crisp scissors snip (rapid swoosh and high pop)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1800, now);
          osc.frequency.exponentialRampToValueAtTime(320, now + 0.07);
          gain.gain.setValueAtTime(0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.09);
          break;
        }

        case 'rocket_blast': {
          // Deep rocket thruster blast
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(90, now);
          osc.frequency.linearRampToValueAtTime(260, now + 0.5);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.linearRampToValueAtTime(0.4, now + 0.2);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.85);
          break;
        }

        case 'coin_clink': {
          // Bright metallic coin ring
          [1760, 2093].forEach((f, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now + idx * 0.05);
            gain.gain.setValueAtTime(0.28, now + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.28);
          });
          break;
        }

        case 'spring_bounce': {
          // Boing bounce sound
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(260, now);
          osc.frequency.linearRampToValueAtTime(520, now + 0.08);
          osc.frequency.linearRampToValueAtTime(320, now + 0.16);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.22);
          break;
        }

        case 'rock_crack': {
          // Sharp rock fracture sound with crunch
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);
          gain.gain.setValueAtTime(0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.1);
          break;
        }

        case 'dino_roar': {
          // Playful baby dinosaur friendly roar
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(180, now);
          osc.frequency.linearRampToValueAtTime(380, now + 0.15);
          osc.frequency.exponentialRampToValueAtTime(140, now + 0.45);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0.35, now + 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.52);
          break;
        }

        case 'magic_portal': {
          // Shimmering mystical portal chime
          const notes = [659.25, 783.99, 987.77, 1318.51, 1567.98, 2093.0];
          notes.forEach((f, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now + idx * 0.05);
            gain.gain.setValueAtTime(0.2, now + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.45);
          });
          break;
        }

        case 'cash_register': {
          // Cheerful market register "Ka-ching!"
          const clickOsc = ctx.createOscillator();
          const clickGain = ctx.createGain();
          clickOsc.type = 'square';
          clickOsc.frequency.setValueAtTime(1200, now);
          clickOsc.frequency.exponentialRampToValueAtTime(400, now + 0.03);
          clickGain.gain.setValueAtTime(0.25, now);
          clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          clickOsc.connect(clickGain);
          clickGain.connect(ctx.destination);
          clickOsc.start(now);
          clickOsc.stop(now + 0.05);

          const bellOsc = ctx.createOscillator();
          const bellGain = ctx.createGain();
          bellOsc.type = 'sine';
          bellOsc.frequency.setValueAtTime(2093, now + 0.04);
          bellGain.gain.setValueAtTime(0.3, now + 0.04);
          bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          bellOsc.connect(bellGain);
          bellGain.connect(ctx.destination);
          bellOsc.start(now + 0.04);
          bellOsc.stop(now + 0.42);
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

  /**
   * Mechanical servo motor whir
   */
  public playServoSound(duration: number = 0.25) {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.linearRampToValueAtTime(480, now + duration * 0.5);
      osc.frequency.exponentialRampToValueAtTime(180, now + duration);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, now);
      filter.Q.setValueAtTime(4, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch (_) {}
  }

  /**
   * Crisp mechanical magnetic lock & snap
   */
  public playMagneticSnap() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // High click transient
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(1200, now);
      clickOsc.frequency.exponentialRampToValueAtTime(240, now + 0.04);
      clickGain.gain.setValueAtTime(0.35, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      // Low resonant latch thump
      const thumpOsc = ctx.createOscillator();
      const thumpGain = ctx.createGain();
      thumpOsc.type = 'sine';
      thumpOsc.frequency.setValueAtTime(180, now + 0.02);
      thumpOsc.frequency.exponentialRampToValueAtTime(60, now + 0.09);
      thumpGain.gain.setValueAtTime(0.3, now + 0.02);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      clickOsc.connect(clickGain);
      clickGain.connect(ctx.destination);
      thumpOsc.connect(thumpGain);
      thumpGain.connect(ctx.destination);

      clickOsc.start(now);
      clickOsc.stop(now + 0.06);
      thumpOsc.start(now + 0.02);
      thumpOsc.stop(now + 0.11);
    } catch (_) {}
  }

  /**
   * Low electronic power grid hum & system scan beeps
   */
  public playBootHum() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Sub-bass boot drone (60Hz -> 90Hz)
      const humOsc = ctx.createOscillator();
      const humGain = ctx.createGain();
      humOsc.type = 'sine';
      humOsc.frequency.setValueAtTime(55, now);
      humOsc.frequency.exponentialRampToValueAtTime(110, now + 1.2);
      humGain.gain.setValueAtTime(0.01, now);
      humGain.gain.linearRampToValueAtTime(0.28, now + 0.3);
      humGain.gain.exponentialRampToValueAtTime(0.01, now + 1.4);

      humOsc.connect(humGain);
      humGain.connect(ctx.destination);
      humOsc.start(now);
      humOsc.stop(now + 1.45);

      // High-tech system scan arpeggio (beeps)
      const beeps = [880, 1320, 1760, 2640];
      beeps.forEach((freq, idx) => {
        const beepOsc = ctx.createOscillator();
        const beepGain = ctx.createGain();
        const t = now + 0.2 + idx * 0.14;
        beepOsc.type = 'sine';
        beepOsc.frequency.setValueAtTime(freq, t);
        beepGain.gain.setValueAtTime(0.08, t);
        beepGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        beepOsc.connect(beepGain);
        beepGain.connect(ctx.destination);
        beepOsc.start(t);
        beepOsc.stop(t + 0.09);
      });
    } catch (_) {}
  }

  /**
   * Confident heroic chord fanfare
   */
  public playHeroicSting() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Triumphant chord: C4 (261.63), E4 (329.63), G4 (392.00), C5 (523.25)
      const notes = [261.63, 329.63, 392.00, 523.25];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.2 - i * 0.03, now + 0.08);
        gain.gain.setValueAtTime(0.18 - i * 0.03, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.25);
      });
    } catch (_) {}
  }

  public playClick() { this.play('click'); }
  public playPop() { this.play('pop'); }
  public playBubbleBurst() { this.play('bubble_burst'); }
  public playWhoosh() { this.play('whoosh'); }
  public playSparkle() { this.play('sparkle'); }
  public playDing() { this.play('correct'); }
  public playCorrect() { this.play('correct'); }
  public playIncorrect() { this.play('wrong'); }
  public playWrong() { this.play('wrong'); }
  public playFanfare() { this.play('celebration'); }
  public playStar() { this.play('star'); }
  public playSuccess() { this.play('success'); }
  public playLevelUp() { this.play('level_up'); }
}


export const kidsSound = new KidsSoundManager();
export const soundManager = kidsSound;
export default kidsSound;

