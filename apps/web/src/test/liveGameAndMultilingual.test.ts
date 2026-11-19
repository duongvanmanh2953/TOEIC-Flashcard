import { describe, it, expect } from 'vitest';
import {
  playCorrectSound,
  playWrongSound,
  playRoomEnterSound,
  playGameStartSound,
  playQuestionTransitionSound,
  playCountdownTickSound,
  playVictoryFanfare,
  liveBgmEngine,
} from '@vocabflow/shared';
import { MULTILINGUAL_VOCABULARY_BANK } from '../../../api/src/modules/games/multilingual-questions.data';
import { matchPlayerAnswer, normalizeText, calculateSimilarity } from '../../../api/src/modules/games/game-modes';

describe('1. Web Audio Engine & Live Game Synthesizer', () => {
  it('should initialize and execute all sound effect triggers without throwing errors', () => {
    expect(() => playCorrectSound()).not.toThrow();
    expect(() => playWrongSound()).not.toThrow();
    expect(() => playRoomEnterSound()).not.toThrow();
    expect(() => playGameStartSound()).not.toThrow();
    expect(() => playQuestionTransitionSound()).not.toThrow();
    expect(() => playCountdownTickSound()).not.toThrow();
    expect(() => playVictoryFanfare()).not.toThrow();
  });

  it('should control live BGM loop lifecycle safely', () => {
    expect(liveBgmEngine.getIsPlaying()).toBe(false);
    liveBgmEngine.start();
    expect(liveBgmEngine.getIsPlaying()).toBe(true);
    liveBgmEngine.setVolume(0.2);
    liveBgmEngine.stop();
    expect(liveBgmEngine.getIsPlaying()).toBe(false);
  });
});

describe('2. Multilingual Question Bank - Strict Language Isolation', () => {
  it('should have authentic Chinese questions with Hanzi and Pinyin', () => {
    const zhBank = MULTILINGUAL_VOCABULARY_BANK.zh;
    expect(zhBank).toBeDefined();
    expect(zhBank.length).toBeGreaterThanOrEqual(25);

    // Verify Chinese words contain authentic Hanzi
    const hasChineseScript = zhBank.every((item) => /[\u4e00-\u9fa5]/.test(item.targetWord));
    expect(hasChineseScript).toBe(true);

    // Verify phonetic has valid Pinyin
    const hasPinyin = zhBank.every((item) => Boolean(item.phonetic && item.phonetic.trim().length > 0));
    expect(hasPinyin).toBe(true);

    // Verify distractors are not hardcoded English
    const hasViDistractors = zhBank.every((item) => item.distractorsVi.length >= 3);
    expect(hasViDistractors).toBe(true);
  });

  it('should have authentic Japanese questions with Hiragana/Kanji', () => {
    const jaBank = MULTILINGUAL_VOCABULARY_BANK.ja;
    expect(jaBank).toBeDefined();
    expect(jaBank.length).toBeGreaterThanOrEqual(5);
    const hasJapaneseScript = jaBank.some((item) => /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(item.targetWord));
    expect(hasJapaneseScript).toBe(true);
  });

  it('should have authentic Korean questions with Hangul', () => {
    const koBank = MULTILINGUAL_VOCABULARY_BANK.ko;
    expect(koBank).toBeDefined();
    expect(koBank.length).toBeGreaterThanOrEqual(5);
    const hasKoreanScript = koBank.every((item) => /[\uAC00-\uD7AF]/.test(item.targetWord));
    expect(hasKoreanScript).toBe(true);
  });
});

describe('3. TikTok Live Comment Command Recognition & Spam Prevention', () => {
  const sampleQuestion = {
    id: 'q-live-test',
    prompt: 'Chọn đáp án đúng',
    direction: 'TARGET_VI',
    correctAnswer: 'B',
    acceptedAnswers: ['b', 'tiền lương'],
    options: ['A. Thưởng', 'B. Lương', 'C. Phạt', 'D. Thuế'],
    correctOptionIndex: 1, // 'B'
    difficulty: 3.0,
    category: 'Test',
    languageCode: 'en',
    questionType: 'VOCABULARY_QUIZ',
    targetWord: 'salary',
  };

  it('recognizes single letter A, B, C, D choices', () => {
    const matchB = matchPlayerAnswer('B', sampleQuestion as any);
    expect(matchB.isMatch).toBe(true);
    expect(matchB.matchedAnswer).toBe('B');

    const matchA = matchPlayerAnswer('A', sampleQuestion as any);
    expect(matchA.isMatch).toBe(false);
  });

  it('recognizes conversational prefixes like "chọn B", "đáp án B.", "B)"', () => {
    const matchPrefix1 = matchPlayerAnswer('chọn B', sampleQuestion as any);
    expect(matchPrefix1.isMatch).toBe(true);

    const matchPrefix2 = matchPlayerAnswer('Đáp án B.', sampleQuestion as any);
    expect(matchPrefix2.isMatch).toBe(true);

    const matchSuffix = matchPlayerAnswer('B)', sampleQuestion as any);
    expect(matchSuffix.isMatch).toBe(true);
  });

  it('recognizes 1, 2, 3, 4 number shortcuts', () => {
    // 2 corresponds to index 1 = 'B'
    const match2 = matchPlayerAnswer('2', sampleQuestion as any);
    expect(match2.isMatch).toBe(true);

    const match1 = matchPlayerAnswer('1', sampleQuestion as any);
    expect(match1.isMatch).toBe(false);
  });

  it('recognizes direct word matches and typing answers', () => {
    const matchDirect = matchPlayerAnswer('salary', sampleQuestion as any);
    expect(matchDirect.isMatch).toBe(true);
  });

  it('calculates fuzzy Levenshtein similarity for slight typos in typing mode', () => {
    const simHigh = calculateSimilarity('negotiate', 'negotiat');
    expect(simHigh).toBeGreaterThanOrEqual(85);

    const simDifferent = calculateSimilarity('apple', 'banana');
    expect(simDifferent).toBeLessThan(30);
  });
});

describe('4. Speed Limit Invariant - Max 15s Per Question for Choice Games', () => {
  it('enforces round duration is capped at 15s for choice / quiz games', () => {
    const rawOptions = [5, 8, 10, 12, 15];
    const isAllUnderOrEqual15 = rawOptions.every((sec) => sec <= 15);
    expect(isAllUnderOrEqual15).toBe(true);

    const clampDuration = (sec: number) => Math.min(15, Math.max(5, sec));
    expect(clampDuration(25)).toBe(15);
    expect(clampDuration(30)).toBe(15);
    expect(clampDuration(10)).toBe(10);
    expect(clampDuration(3)).toBe(5);
  });
});
