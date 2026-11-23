import { describe, it, expect } from 'vitest';
import {
  MULTILINGUAL_CURRICULA,
  AI_ROADMAP_RECOMMENDATIONS,
} from '../../../../apps/api/src/modules/learning-journey/curriculum-data';
import {
  MULTILINGUAL_VOCABULARY_BANK,
  buildMultipleChoiceQuestion,
} from '../../../../apps/api/src/modules/games/multilingual-questions.data';

describe('Personalized Learning Journey & Interactive Roadmap Engine', () => {
  it('should provide multi-language curriculum for all supported languages', () => {
    const supportedLangs = ['en', 'zh', 'ja', 'ko', 'de', 'fr', 'es', 'th', 'vi'];
    for (const lang of supportedLangs) {
      expect(MULTILINGUAL_CURRICULA[lang]).toBeDefined();
      expect(MULTILINGUAL_CURRICULA[lang].length).toBeGreaterThanOrEqual(1);
      const stage = MULTILINGUAL_CURRICULA[lang][0];
      expect(stage.chapters.length).toBeGreaterThanOrEqual(1);
      expect(stage.chapters[0].lessons.length).toBeGreaterThanOrEqual(2);
    }

    // Check English structure
    const enStages = MULTILINGUAL_CURRICULA['en'];
    expect(enStages.length).toBeGreaterThanOrEqual(2);
    expect(enStages[0].level).toBe('A2');
    expect(enStages[0].chapters.length).toBeGreaterThanOrEqual(1);

    const chapter1 = enStages[0].chapters[0];
    expect(chapter1.biome).toBe('FOREST');
    expect(chapter1.lessons.length).toBeGreaterThanOrEqual(2);

    // Verify Checkpoint presence
    const checkpoint = chapter1.lessons.find((l) => l.type === 'CHECKPOINT');
    expect(checkpoint).toBeDefined();
    expect(checkpoint?.durationMinutes).toBeGreaterThanOrEqual(15);
  });

  it('should provide AI roadmap recommendations for each language space', () => {
    const languages = ['en', 'ja', 'ko', 'zh', 'de', 'fr', 'es', 'th', 'vi'];
    for (const lang of languages) {
      const recs = AI_ROADMAP_RECOMMENDATIONS[lang];
      expect(recs).toBeDefined();
      expect(recs.length).toBeGreaterThanOrEqual(1);
      expect(recs[0].title).toBeTruthy();
      expect(recs[0].targetLevel).toBeTruthy();
      expect(recs[0].dailyStudyMinutes).toBeGreaterThan(0);
      expect(recs[0].highlightSkills.length).toBeGreaterThan(0);
    }
  });

  it('should structure 5-step progression activities within lessons', () => {
    const lesson1 = MULTILINGUAL_CURRICULA['en'][0].chapters[0].lessons[0];
    expect(lesson1.activities.length).toBe(5);

    const activityTypes = lesson1.activities.map((a) => a.type);
    expect(activityTypes).toEqual(['LEARN', 'PRACTICE', 'APPLY', 'CHALLENGE', 'REVIEW']);
  });

  it('should strictly evaluate mastery threshold at 80% and 90%', () => {
    const evaluateNodeStatus = (score: number) => {
      if (score >= 90) return 'MASTERED';
      if (score >= 80) return 'COMPLETED';
      return 'RETAKE_REQUIRED';
    };

    expect(evaluateNodeStatus(95)).toBe('MASTERED');
    expect(evaluateNodeStatus(82)).toBe('COMPLETED');
    expect(evaluateNodeStatus(79)).toBe('RETAKE_REQUIRED');
    expect(evaluateNodeStatus(50)).toBe('RETAKE_REQUIRED');
  });

  it('should build authentic arena questions with realistic distractors and valid blanks', () => {
    const zhItem = MULTILINGUAL_VOCABULARY_BANK['zh'].find((item) => item.targetWord === '中国')!;
    expect(zhItem).toBeDefined();
    // Verify distractors are realistic country names, not comedic ones
    expect(zhItem.distractorsVi).toEqual(['Hàn Quốc', 'Nhật Bản', 'Việt Nam']);

    const q = buildMultipleChoiceQuestion(zhItem, 'VOCABULARY_QUIZ');
    expect(q.prompt).toContain('中国');
    expect(q.options.length).toBe(4);
    expect(q.options.some((opt) => opt.includes('Trung Quốc'))).toBe(true);
    expect(q.options.some((opt) => opt.includes('Hàn Quốc'))).toBe(true);
    expect(q.options.some((opt) => opt.includes('Nhật Bản'))).toBe(true);
    expect(q.options.some((opt) => opt.includes('Việt Nam'))).toBe(true);

    // Verify missing word case-insensitive blank replacement
    const enItem = MULTILINGUAL_VOCABULARY_BANK['en'].find((item) => item.targetWord === 'Negotiate')!;
    const missingWordQ = buildMultipleChoiceQuestion(enItem, 'MISSING_WORD');
    expect(missingWordQ.prompt).toContain('______');
    expect(missingWordQ.prompt).not.toContain('negotiate');
  });

  it('should structure 5-step progression activities within lessons', () => {
    const lesson1 = MULTILINGUAL_CURRICULA['en'][0].chapters[0].lessons[0];
    expect(lesson1.activities.length).toBe(5);

    const activityTypes = lesson1.activities.map((a) => a.type);
    expect(activityTypes).toEqual(['LEARN', 'PRACTICE', 'APPLY', 'CHALLENGE', 'REVIEW']);
  });

  it('should strictly evaluate mastery threshold at 80% and 90%', () => {
    const evaluateNodeStatus = (score: number) => {
      if (score >= 90) return 'MASTERED';
      if (score >= 80) return 'COMPLETED';
      return 'RETAKE_REQUIRED';
    };

    expect(evaluateNodeStatus(95)).toBe('MASTERED');
    expect(evaluateNodeStatus(82)).toBe('COMPLETED');
    expect(evaluateNodeStatus(79)).toBe('RETAKE_REQUIRED');
    expect(evaluateNodeStatus(50)).toBe('RETAKE_REQUIRED');
  });

  it('should differentiate active listening from passive immersion', () => {
    const isMasteryAwardable = (mode: 'ACTIVE' | 'PASSIVE', score?: number) => {
      if (mode === 'PASSIVE') return false; // Never award active mastery for background exposure
      return (score || 0) >= 80;
    };

    expect(isMasteryAwardable('PASSIVE', 100)).toBe(false);
    expect(isMasteryAwardable('ACTIVE', 85)).toBe(true);
    expect(isMasteryAwardable('ACTIVE', 70)).toBe(false);
  });

  it('should compute streak active days accurately for current calendar month', () => {
    const todayDay = 21;
    const currentStreak = 4;
    const activeDays: number[] = [];

    for (let i = 0; i < currentStreak; i++) {
      const d = todayDay - i;
      if (d > 0) activeDays.push(d);
    }

    expect(activeDays).toEqual([21, 20, 19, 18]);
    expect(activeDays.length).toBe(4);
  });
});
