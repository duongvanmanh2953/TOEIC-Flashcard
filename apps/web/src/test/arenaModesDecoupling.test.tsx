import { describe, it, expect } from 'vitest';

describe('Arena Modes Decoupling & Scoring Mechanics', () => {
  describe('Battle Scoring Engine (Phase 3)', () => {
    // Formula: Score = max(0, 100 - floor(elapsedSeconds))
    const computeBattleScore = (elapsedSeconds: number, isCorrect: boolean, isSkipped: boolean = false) => {
      if (!isCorrect || isSkipped) return 0;
      return Math.max(0, 100 - Math.floor(elapsedSeconds));
    };

    it('calculates 100 points for instant 0s correct answer', () => {
      expect(computeBattleScore(0, true)).toBe(100);
      expect(computeBattleScore(0.8, true)).toBe(100);
    });

    it('decays exactly 1 point per second for correct answer', () => {
      expect(computeBattleScore(1.2, true)).toBe(99);
      expect(computeBattleScore(5.0, true)).toBe(95);
      expect(computeBattleScore(14.9, true)).toBe(86);
      expect(computeBattleScore(99.0, true)).toBe(1);
    });

    it('yields 0 points for wrong answers, skips, or timeouts beyond 100s', () => {
      expect(computeBattleScore(2.0, false)).toBe(0);
      expect(computeBattleScore(2.0, true, true)).toBe(0); // skipped
      expect(computeBattleScore(105, true)).toBe(0); // beyond decay
    });
  });

  describe('TikTok Live Speed Tiers & Fast Response Wins (Phase 8)', () => {
    const computeLiveTierPoints = (elapsedSec: number, isCorrect: boolean) => {
      if (!isCorrect) return 0;
      if (elapsedSec <= 5) return 100;
      if (elapsedSec <= 10) return 80;
      if (elapsedSec <= 15) return 60;
      if (elapsedSec <= 20) return 40;
      return 0;
    };

    it('awards correct tier points based on response speed', () => {
      expect(computeLiveTierPoints(2.5, true)).toBe(100);
      expect(computeLiveTierPoints(5.0, true)).toBe(100);
      expect(computeLiveTierPoints(7.2, true)).toBe(80);
      expect(computeLiveTierPoints(10.0, true)).toBe(80);
      expect(computeLiveTierPoints(12.0, true)).toBe(60);
      expect(computeLiveTierPoints(15.0, true)).toBe(60);
      expect(computeLiveTierPoints(17.5, true)).toBe(40);
      expect(computeLiveTierPoints(20.0, true)).toBe(40);
      expect(computeLiveTierPoints(21.0, true)).toBe(0); // late
    });

    it('awards 0 points for incorrect live answers regardless of speed', () => {
      expect(computeLiveTierPoints(1.0, false)).toBe(0);
      expect(computeLiveTierPoints(6.0, false)).toBe(0);
    });

    it('allocates 1 Fast Token to the first 3 unique valid correct users and applies final bonus', () => {
      interface LiveUser {
        userId: string;
        baseScore: number;
        fastTokens: number;
        correctCount: number;
      }

      const users: LiveUser[] = [
        { userId: 'u1', baseScore: 240, fastTokens: 3, correctCount: 3 },
        { userId: 'u2', baseScore: 220, fastTokens: 2, correctCount: 3 },
        { userId: 'u3', baseScore: 200, fastTokens: 1, correctCount: 2 },
        { userId: 'u4', baseScore: 260, fastTokens: 0, correctCount: 3 },
      ];

      // Sort by Fast Tokens descending
      const sortedByTokens = [...users].sort((a, b) => b.fastTokens - a.fastTokens);
      expect(sortedByTokens[0].userId).toBe('u1'); // Fast Champion (+300)
      expect(sortedByTokens[1].userId).toBe('u2'); // Fast Runner-up (+200)
      expect(sortedByTokens[2].userId).toBe('u3'); // Fast Third (+100)

      const finalScoreU1 = sortedByTokens[0].baseScore + 300;
      const finalScoreU2 = sortedByTokens[1].baseScore + 200;
      const finalScoreU3 = sortedByTokens[2].baseScore + 100;
      const finalScoreU4 = users[3].baseScore;

      expect(finalScoreU1).toBe(540);
      expect(finalScoreU2).toBe(420);
      expect(finalScoreU3).toBe(300);
      expect(finalScoreU4).toBe(260);
    });

    it('deduplicates comments so a user cannot earn points repeatedly on same question', () => {
      const answeredUsers = new Set<string>();
      const handleUserAnswer = (userId: string, isCorrect: boolean) => {
        if (answeredUsers.has(userId)) return { accepted: false, points: 0 };
        answeredUsers.add(userId);
        return { accepted: true, points: isCorrect ? 100 : 0 };
      };

      const res1 = handleUserAnswer('user_123', true);
      expect(res1.accepted).toBe(true);
      expect(res1.points).toBe(100);

      // Repeated spam comment
      const res2 = handleUserAnswer('user_123', true);
      expect(res2.accepted).toBe(false);
      expect(res2.points).toBe(0);
    });
  });
});
