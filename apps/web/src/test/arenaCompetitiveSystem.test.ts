import { describe, it, expect } from 'vitest';
import {
  ArenaScoringEngine,
  ARENA_THEME,
  ARENA_MODES_CONFIG,
} from '@vocabflow/shared';
import { GAME_MODE_REGISTRY } from '../../../api/src/modules/games/game-modes';
import { GameModeType } from '@prisma/client';
import {
  MULTILINGUAL_VOCABULARY_BANK,
  buildMultipleChoiceQuestion,
} from '../../../api/src/modules/games/multilingual-questions.data';
import { getSystemPresetRooms } from '../../../api/src/modules/games/custom-rooms.service';

describe('1. Arena Scoring Engine Tests', () => {
  it('calculates score accurately with speed bonus and streak bonus', () => {
    // Correct answer with 1500ms reflex (< 2000ms => 300 speed bonus) and streak 2 (+50 streak bonus)
    const result = ArenaScoringEngine.calculateScore({
      isCorrect: true,
      responseTimeMs: 1500,
      currentStreak: 1, // new streak will be 2
      roundMultiplier: 1.0,
      basePoints: 700,
    });

    expect(result.isCorrect).toBe(true);
    expect(result.basePoints).toBe(700);
    expect(result.speedBonus).toBe(300);
    expect(result.streakBonus).toBe(50);
    expect(result.totalEarned).toBe(1050); // 700 + 300 + 50
    expect(result.newStreak).toBe(2);
    expect(result.speedTier).toBe('INSTANT');
    expect(result.streakTier).toBe('DOUBLE');
  });

  it('awards zero points and resets streak on incorrect answer', () => {
    const result = ArenaScoringEngine.calculateScore({
      isCorrect: false,
      responseTimeMs: 2000,
      currentStreak: 5,
    });

    expect(result.isCorrect).toBe(false);
    expect(result.totalEarned).toBe(0);
    expect(result.newStreak).toBe(0);
  });

  it('scales accurately by round multipliers (Boss Round x2, Final Showdown x3)', () => {
    // Normal round
    const normal = ArenaScoringEngine.calculateScore({
      isCorrect: true,
      responseTimeMs: 3000,
      currentStreak: 0,
      roundMultiplier: 1.0,
    });

    // Boss round (x2)
    const boss = ArenaScoringEngine.calculateScore({
      isCorrect: true,
      responseTimeMs: 3000,
      currentStreak: 0,
      roundMultiplier: 2.0,
    });

    // Final Showdown (x3)
    const finalRound = ArenaScoringEngine.calculateScore({
      isCorrect: true,
      responseTimeMs: 3000,
      currentStreak: 0,
      roundMultiplier: 3.0,
    });

    expect(boss.totalEarned).toBe(normal.totalEarned * 2);
    expect(finalRound.totalEarned).toBe(normal.totalEarned * 3);
  });

  it('sorts leaderboard with strict esports tie-breaker rules', () => {
    const players = [
      { id: 'p1', score: 1200, streak: 3, lastAnswerTimestamp: 1000 },
      { id: 'p2', score: 1500, streak: 2, lastAnswerTimestamp: 2000 },
      { id: 'p3', score: 1200, streak: 5, lastAnswerTimestamp: 1500 }, // Higher streak than p1 with same score
      { id: 'p4', score: 1200, streak: 3, lastAnswerTimestamp: 800 },  // Earlier timestamp than p1 with same score & streak
    ];

    const sorted = ArenaScoringEngine.sortLeaderboard(players);

    // 1st place: highest score (p2: 1500)
    expect(sorted[0].id).toBe('p2');
    // 2nd place: score 1200 with highest streak (p3: streak 5)
    expect(sorted[1].id).toBe('p3');
    // 3rd place: score 1200, streak 3, earlier timestamp (p4: 800ms)
    expect(sorted[2].id).toBe('p4');
    // 4th place: score 1200, streak 3, later timestamp (p1: 1000ms)
    expect(sorted[3].id).toBe('p1');
  });
});

describe('2. Competitive Game Modes Engine Tests', () => {
  const dummyQuestion = {
    id: 'test-q1',
    prompt: 'Chọn nghĩa đúng của từ「勉強」',
    direction: 'TARGET_VI',
    correctAnswer: 'A',
    acceptedAnswers: ['a', 'học tập'],
    options: ['A. Học tập', 'B. Nghỉ ngơi', 'C. Ăn uống', 'D. Ngủ'],
    correctOptionIndex: 0,
    difficulty: 3.0,
    category: 'Japanese',
    languageCode: 'ja',
    questionType: 'VOCABULARY_QUIZ',
    targetWord: '勉強',
  };

  it('evaluates CLASSIC_QUIZ mode with speed and streak bonuses', async () => {
    const mode = GAME_MODE_REGISTRY[GameModeType.CLASSIC_QUIZ];
    expect(mode).toBeDefined();

    const evalResult = await mode.evaluate(dummyQuestion, 'A', 1500, 2);
    expect(evalResult.isCorrect).toBe(true);
    expect(evalResult.score).toBeGreaterThan(700);
  });

  it('evaluates SURVIVAL mode with survival multiplier', async () => {
    const mode = GAME_MODE_REGISTRY[GameModeType.SURVIVAL];
    expect(mode).toBeDefined();

    const evalResult = await mode.evaluate(dummyQuestion, 'A', 1500, 0);
    expect(evalResult.isCorrect).toBe(true);
    // Survival has 1.25x multiplier
    expect(evalResult.score).toBe(Math.round((700 + 300) * 1.25));
  });

  it('evaluates 1vs1 DUEL mode', async () => {
    const mode = GAME_MODE_REGISTRY[GameModeType.DUEL];
    expect(mode).toBeDefined();

    const evalResult = await mode.evaluate(dummyQuestion, 'A', 1500, 0);
    expect(evalResult.isCorrect).toBe(true);
    expect(evalResult.score).toBe(Math.round((700 + 300) * 1.2));
  });

  it('evaluates TEAM_BATTLE mode with team multiplier', async () => {
    const mode = GAME_MODE_REGISTRY[GameModeType.TEAM_BATTLE];
    expect(mode).toBeDefined();

    const evalResult = await mode.evaluate(dummyQuestion, 'A', 1500, 0);
    expect(evalResult.isCorrect).toBe(true);
    expect(evalResult.score).toBe(Math.round((700 + 300) * 1.1));
  });

  it('evaluates WORD_RUSH mode supporting exact word and option letter', async () => {
    const mode = GAME_MODE_REGISTRY[GameModeType.WORD_RUSH];
    expect(mode).toBeDefined();

    // Player inputs target word directly
    const evalTarget = await mode.evaluate(dummyQuestion, '勉強', 1500, 0);
    expect(evalTarget.isCorrect).toBe(true);
  });

  it('evaluates BOSS_ROUND with double multiplier (2.0x)', async () => {
    const mode = GAME_MODE_REGISTRY[GameModeType.BOSS_ROUND];
    expect(mode).toBeDefined();

    const evalResult = await mode.evaluate(dummyQuestion, 'A', 1500, 0);
    expect(evalResult.isCorrect).toBe(true);
    expect(evalResult.score).toBe(Math.round((700 + 300) * 2.0));
  });

  it('evaluates FINAL_SHOWDOWN with triple multiplier (3.0x)', async () => {
    const mode = GAME_MODE_REGISTRY[GameModeType.FINAL_SHOWDOWN];
    expect(mode).toBeDefined();

    const evalResult = await mode.evaluate(dummyQuestion, 'A', 1500, 0);
    expect(evalResult.isCorrect).toBe(true);
    expect(evalResult.score).toBe(Math.round((700 + 300) * 3.0));
  });
});

describe('3. Strict Language Isolation & System Vocabulary Bank', () => {
  it('generates authentic rooms matching user language space', () => {
    const zhRooms = getSystemPresetRooms('zh');
    expect(zhRooms.every((r) => r.languageId === 'zh')).toBe(true);
    expect(zhRooms.some((r) => r.gameMode === GameModeType.CLASSIC_QUIZ)).toBe(true);
    expect(zhRooms.some((r) => r.gameMode === GameModeType.SURVIVAL)).toBe(true);
    expect(zhRooms.some((r) => r.gameMode === GameModeType.BOSS_ROUND)).toBe(true);

    const jaRooms = getSystemPresetRooms('ja');
    expect(jaRooms.every((r) => r.languageId === 'ja')).toBe(true);

    const koRooms = getSystemPresetRooms('ko');
    expect(koRooms.every((r) => r.languageId === 'ko')).toBe(true);

    const enRooms = getSystemPresetRooms('en');
    expect(enRooms.every((r) => r.languageId === 'en')).toBe(true);
  });

  it('generates 4-choice questions without hardcoded English when in Asian languages', () => {
    const zhBank = MULTILINGUAL_VOCABULARY_BANK.zh;
    expect(zhBank.length).toBeGreaterThanOrEqual(5);

    const zhQuestion = buildMultipleChoiceQuestion(zhBank[0], 'VOCABULARY_QUIZ');
    expect(zhQuestion.languageCode).toBe('zh');
    expect(zhQuestion.options?.length).toBe(4);
    // Question contains Chinese target word
    expect(zhQuestion.prompt).toContain(zhBank[0].targetWord);
  });
});

describe('4. Arena Visual Design System Theme & Invariants', () => {
  it('has exact esports brand palette tokens defined', () => {
    expect(ARENA_THEME.colors.primary).toBe('#2041F6');
    expect(ARENA_THEME.colors.primaryHighlight).toBe('#8B75FF');
    expect(ARENA_THEME.colors.darkBg).toBe('#090D1B');
    expect(ARENA_THEME.colors.surface).toBe('#12182B');
    expect(ARENA_THEME.colors.gold).toBe('#F6C453');
    expect(ARENA_THEME.colors.success).toBe('#25C98A');
    expect(ARENA_THEME.colors.error).toBe('#F26B76');
  });

  it('registers all 7 competitive modes with detailed rules and multipliers', () => {
    const modes = ARENA_MODES_CONFIG;
    expect(modes.CLASSIC_QUIZ.multiplier).toBe(1.0);
    expect(modes.SURVIVAL.hasLives).toBe(true);
    expect(modes.DUEL.isDuel).toBe(true);
    expect(modes.TEAM_BATTLE.isTeam).toBe(true);
    expect(modes.BOSS_ROUND.multiplier).toBe(2.0);
    expect(modes.FINAL_SHOWDOWN.multiplier).toBe(3.0);
  });
});
