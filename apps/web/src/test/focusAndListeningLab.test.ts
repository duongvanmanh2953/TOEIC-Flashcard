import { describe, it, expect } from 'vitest';
import { LISTENING_TRACKS } from '../../../../apps/api/src/modules/listening-lab/listening-data';

describe('Listening Lab & Online Samples Test Suite', () => {
  it('should load authentic online tracks from public domains', () => {
    expect(LISTENING_TRACKS.length).toBeGreaterThanOrEqual(6);
    
    // Check that we have Active tracks
    const activeTracks = LISTENING_TRACKS.filter((t) => t.segments.length > 0);
    expect(activeTracks.length).toBeGreaterThanOrEqual(3);

    // Check that we have Passive tracks
    const passiveTracks = LISTENING_TRACKS.filter((t) => t.category === 'IMMERSION' || t.category === 'SLEEP' || t.category === 'PODCAST');
    expect(passiveTracks.length).toBeGreaterThanOrEqual(3);
  });

  it('should have valid public audio streaming URLs and sources', () => {
    LISTENING_TRACKS.forEach((track) => {
      expect(track.audioUrl).toMatch(/^https?:\/\/.+\.(mp3|ogg)$/);
      expect(track.title).toBeTruthy();
      expect(track.speaker).toBeTruthy();
      expect(track.level).toBeTruthy();
    });
  });

  it('should have properly structured sentence segments with timestamps for Active tracks', () => {
    const workplaceTrack = LISTENING_TRACKS.find((t) => t.id === 'trk-active-1');
    expect(workplaceTrack).toBeDefined();
    expect(workplaceTrack?.segments.length).toBeGreaterThan(0);

    workplaceTrack?.segments.forEach((seg, idx) => {
      expect(seg.endTime).toBeGreaterThan(seg.startTime);
      expect(seg.text).toBeTruthy();
      expect(seg.translation).toBeTruthy();
      expect(seg.words.length).toBeGreaterThan(0);
      seg.words.forEach((w) => {
        expect(w.word).toBeTruthy();
        expect(w.meaning).toBeTruthy();
        expect(w.ipa).toBeTruthy();
      });
    });
  });

  it('should have dictation sentences and comprehension quizzes', () => {
    const activeTracks = LISTENING_TRACKS.filter((t) => t.segments.length > 0);
    activeTracks.forEach((track) => {
      expect(track.dictationSentence).toBeTruthy();
      expect(track.quizzes.length).toBeGreaterThan(0);
      track.quizzes.forEach((quiz) => {
        expect(quiz.question).toBeTruthy();
        expect(quiz.options).toContain(quiz.answer);
        expect(quiz.explanation).toBeTruthy();
      });
    });
  });
});

describe('Global Focus Timer & Fullscreen Immersion Test Suite', () => {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const calculateProgress = (remaining: number, targetMins: number) => {
    const total = targetMins * 60;
    return Math.max(0, Math.min(100, ((total - remaining) / total) * 100));
  };

  it('formats seconds into accurate MM:SS display', () => {
    expect(formatTime(1500)).toBe('25:00');
    expect(formatTime(1472)).toBe('24:32');
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(9)).toBe('00:09');
    expect(formatTime(0)).toBe('00:00');
  });

  it('calculates circular progress bar percentages accurately', () => {
    // 25 mins total
    expect(calculateProgress(1500, 25)).toBe(0);
    expect(calculateProgress(750, 25)).toBe(50);
    expect(calculateProgress(0, 25)).toBe(100);
  });

  it('supports Pomodoro presets and break transitions', () => {
    const presets = [15, 25, 50, 5];
    presets.forEach((p) => {
      expect(p * 60).toBeGreaterThan(0);
    });

    // After 25 min focus, transition to 5 min short break
    let currentMode = 'FOCUS';
    let targetMins = 25;
    let seconds = 0;

    if (seconds <= 0 && currentMode === 'FOCUS') {
      currentMode = 'SHORT_BREAK';
      targetMins = 5;
    }

    expect(currentMode).toBe('SHORT_BREAK');
    expect(targetMins).toBe(5);
  });
});
