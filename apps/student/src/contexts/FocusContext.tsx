import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { playCorrectSound } from '@vocabflow/shared';
import api from '../lib/api';

export type AmbientSoundType = 'NONE' | 'RAIN' | 'CAFE' | 'LIBRARY' | 'WAVES' | 'WHITE_NOISE';
export type FocusModeType = 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';

interface FocusContextType {
  isRunning: boolean;
  isPaused: boolean;
  secondsRemaining: number;
  targetMinutes: number;
  mode: FocusModeType;
  activeTask: string;
  todayFocusMinutes: number;
  todayCompletedSessions: number;
  ambientSound: AmbientSoundType;
  ambientVolume: number;
  isFullscreenOpen: boolean;
  startSession: (minutes?: number, task?: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  stopSession: (completed?: boolean) => void;
  setTargetMinutes: (minutes: number) => void;
  setActiveTask: (task: string) => void;
  setAmbientSound: (sound: AmbientSoundType) => void;
  setAmbientVolume: (volume: number) => void;
  openFullscreen: () => void;
  closeFullscreen: () => void;
  toggleFullscreen: () => void;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

const STORAGE_KEY = 'vocabflow_global_focus_state';

// Web Audio API Ambient Sound Generator
class AmbientSoundSynthesizer {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private lfoNode: OscillatorNode | null = null;
  private isPlaying = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public play(type: AmbientSoundType, volume: number = 0.5) {
    this.stop();
    if (type === 'NONE') return;

    try {
      this.initContext();
      if (!this.ctx) return;

      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      // Generate Pink / Brown Noise for natural relaxing soundscapes
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'RAIN' || type === 'LIBRARY') {
          // Pink noise filter
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        } else if (type === 'WAVES' || type === 'CAFE') {
          // Brown noise filter (deep ocean / warm murmur)
          b0 = (b0 + (0.02 * white)) / 1.02;
          output[i] = b0 * 3.5;
        } else {
          // White noise
          output[i] = white * 0.15;
        }
      }

      const whiteNoiseSource = this.ctx.createBufferSource();
      whiteNoiseSource.buffer = noiseBuffer;
      whiteNoiseSource.loop = true;

      // Filter
      const filter = this.ctx.createBiquadFilter();
      if (type === 'RAIN') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1100, this.ctx.currentTime);
      } else if (type === 'WAVES') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, this.ctx.currentTime);
        // LFO for surf wave rhythm
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
        lfoGain.gain.setValueAtTime(300, this.ctx.currentTime);
        lfo.connect(filter.frequency);
        lfo.start();
        this.lfoNode = lfo;
      } else if (type === 'CAFE') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(650, this.ctx.currentTime);
        filter.Q.setValueAtTime(0.8, this.ctx.currentTime);
      } else if (type === 'LIBRARY') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, this.ctx.currentTime);
      } else {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(8000, this.ctx.currentTime);
      }

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(Math.max(0.01, Math.min(1, volume * 0.4)), this.ctx.currentTime);

      whiteNoiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoiseSource.start(0);
      this.noiseNode = whiteNoiseSource;
      this.filterNode = filter;
      this.gainNode = gain;
      this.isPlaying = true;
    } catch (err) {
      console.warn('Ambient sound synthesis failed', err);
    }
  }

  public setVolume(vol: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(Math.max(0.01, Math.min(1, vol * 0.4)), this.ctx.currentTime);
    }
  }

  public stop() {
    try {
      if (this.lfoNode) {
        this.lfoNode.stop();
        this.lfoNode.disconnect();
        this.lfoNode = null;
      }
      if (this.noiseNode) {
        (this.noiseNode as AudioBufferSourceNode).stop();
        this.noiseNode.disconnect();
        this.noiseNode = null;
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
      if (this.filterNode) {
        this.filterNode.disconnect();
        this.filterNode = null;
      }
      this.isPlaying = false;
    } catch (_) {}
  }
}

const ambientSynth = new AmbientSoundSynthesizer();

export const FocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [targetMinutes, setTargetMinutes] = useState<number>(25);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [mode, setMode] = useState<FocusModeType>('FOCUS');
  const [activeTask, setActiveTask] = useState<string>('Tập trung học từ vựng TOEIC & Luyện nghe');
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>('NONE');
  const [ambientVolume, setAmbientVolume] = useState<number>(0.6);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState<boolean>(false);

  // Today's tracked stats
  const [todayFocusMinutes, setTodayFocusMinutes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('vocabflow_today_focus_mins');
      return saved ? parseInt(saved, 10) : 25;
    } catch {
      return 25;
    }
  });
  const [todayCompletedSessions, setTodayCompletedSessions] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('vocabflow_today_focus_sessions');
      return saved ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
    }
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isRunning && parsed.savedAt) {
          const elapsedSecs = Math.floor((Date.now() - parsed.savedAt) / 1000);
          const remaining = Math.max(0, parsed.secondsRemaining - (parsed.isPaused ? 0 : elapsedSecs));
          setIsRunning(remaining > 0);
          setIsPaused(parsed.isPaused || false);
          setSecondsRemaining(remaining);
          setTargetMinutes(parsed.targetMinutes || 25);
          setMode(parsed.mode || 'FOCUS');
          setActiveTask(parsed.activeTask || '');
          setAmbientSound(parsed.ambientSound || 'NONE');
          setAmbientVolume(parsed.ambientVolume ?? 0.6);
        }
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      if (isRunning) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            isRunning,
            isPaused,
            secondsRemaining,
            targetMinutes,
            mode,
            activeTask,
            ambientSound,
            ambientVolume,
            savedAt: Date.now(),
          })
        );
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (_) {}
  }, [isRunning, isPaused, secondsRemaining, targetMinutes, mode, activeTask, ambientSound, ambientVolume]);

  useEffect(() => {
    if (isRunning && !isPaused && ambientSound !== 'NONE') {
      ambientSynth.play(ambientSound, ambientVolume);
    } else {
      ambientSynth.stop();
    }
    return () => {
      ambientSynth.stop();
    };
  }, [isRunning, isPaused, ambientSound]);

  useEffect(() => {
    ambientSynth.setVolume(ambientVolume);
  }, [ambientVolume]);

  useEffect(() => {
    let timer: any = null;
    if (isRunning && !isPaused) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleCompleteSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, isPaused, mode, targetMinutes, activeTask]);

  const handleCompleteSession = () => {
    setIsRunning(false);
    setIsPaused(false);
    ambientSynth.stop();
    playCorrectSound();

    if (mode === 'FOCUS') {
      const addedMins = targetMinutes;
      setTodayFocusMinutes((prev) => {
        const updated = prev + addedMins;
        localStorage.setItem('vocabflow_today_focus_mins', updated.toString());
        return updated;
      });
      setTodayCompletedSessions((prev) => {
        const updated = prev + 1;
        localStorage.setItem('vocabflow_today_focus_sessions', updated.toString());
        return updated;
      });

      api.post('/listening-lab/focus/record', {
        targetMinutes,
        actualMinutes: targetMinutes,
        selectedTasks: [activeTask],
        status: 'COMPLETED',
      }).catch(() => {});

      window.dispatchEvent(
        new CustomEvent('VOCABFLOW_SESSION_COMPLETED', {
          detail: {
            xpAwarded: 25,
            message: `Hoàn thành ${targetMinutes} phút tập trung cao độ! +25 XP`,
          },
        })
      );

      setMode('SHORT_BREAK');
      setTargetMinutes(5);
      setSecondsRemaining(5 * 60);
    } else {
      setMode('FOCUS');
      setTargetMinutes(25);
      setSecondsRemaining(25 * 60);
    }
  };

  const startSession = useCallback((minutes = 25, task = 'Tập trung học từ vựng TOEIC & Luyện nghe') => {
    setTargetMinutes(minutes);
    setSecondsRemaining(minutes * 60);
    setActiveTask(task);
    setIsRunning(true);
    setIsPaused(false);
    setMode('FOCUS');
  }, []);

  const pauseSession = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeSession = useCallback(() => {
    setIsPaused(false);
  }, []);

  const stopSession = useCallback((completed = false) => {
    ambientSynth.stop();
    setIsRunning(false);
    setIsPaused(false);
    setSecondsRemaining(targetMinutes * 60);
    localStorage.removeItem(STORAGE_KEY);

    if (completed) {
      handleCompleteSession();
    }
  }, [targetMinutes]);

  const openFullscreen = useCallback(() => {
    setIsFullscreenOpen(true);
  }, []);

  const closeFullscreen = useCallback(() => {
    setIsFullscreenOpen(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreenOpen((prev) => !prev);
  }, []);

  return (
    <FocusContext.Provider
      value={{
        isRunning,
        isPaused,
        secondsRemaining,
        targetMinutes,
        mode,
        activeTask,
        todayFocusMinutes,
        todayCompletedSessions,
        ambientSound,
        ambientVolume,
        isFullscreenOpen,
        startSession,
        pauseSession,
        resumeSession,
        stopSession,
        setTargetMinutes,
        setActiveTask,
        setAmbientSound,
        setAmbientVolume,
        openFullscreen,
        closeFullscreen,
        toggleFullscreen,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
};

export const useFocus = (): FocusContextType => {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error('useFocus must be used within a FocusProvider');
  }
  return context;
};
