import { describe, it, expect } from 'vitest';
import {
  resamplePoints,
  distance,
  pathLength,
  getDirectionVector,
  cosineSimilarity,
  evaluateSingleStroke,
  RESAMPLE_COUNT,
} from '../lib/handwriting/strokeMath';
import { animateStrokeMorph } from '../lib/handwriting/morphEngine';
import {
  getLanguageCapabilities,
  isHandwritingSupportedForLanguage,
  getSupportedScriptsForLanguage,
} from '@vocabflow/shared';

describe('Handwriting Engine: Geometric Vector Math & Resampling', () => {
  it('correctly calculates distance and path length', () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 300, y: 400 };
    expect(distance(p1, p2)).toBe(500);

    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ];
    expect(pathLength(points)).toBe(200);
  });

  it('resamples arbitrary points into exactly 32 equidistant points', () => {
    const points = [
      { x: 10, y: 10 },
      { x: 50, y: 50 },
      { x: 200, y: 300 },
      { x: 450, y: 480 },
    ];
    const resampled = resamplePoints(points, RESAMPLE_COUNT);
    expect(resampled.length).toBe(RESAMPLE_COUNT);
    expect(resampled[0].x).toBe(10);
    expect(resampled[0].y).toBe(10);
    expect(resampled[RESAMPLE_COUNT - 1].x).toBe(450);
    expect(resampled[RESAMPLE_COUNT - 1].y).toBe(480);
  });

  it('computes directional vector and detects reverse stroke drawing via cosine similarity', () => {
    // Normal horizontal stroke: Left-to-Right
    const ltrStroke = [
      { x: 100, y: 200 },
      { x: 400, y: 200 },
    ];
    const ltrDir = getDirectionVector(ltrStroke);
    expect(ltrDir.dx).toBeCloseTo(1.0);
    expect(ltrDir.dy).toBeCloseTo(0.0);

    // Opposite horizontal stroke: Right-to-Left (user drew backwards!)
    const rtlStroke = [
      { x: 400, y: 200 },
      { x: 100, y: 200 },
    ];
    const rtlDir = getDirectionVector(rtlStroke);
    expect(rtlDir.dx).toBeCloseTo(-1.0);

    // Cosine similarity between standard reference and backwards user stroke must be -1.0
    const cosSim = cosineSimilarity(ltrDir, rtlDir);
    expect(cosSim).toBeCloseTo(-1.0);
  });
});

describe('Handwriting Engine: Authentic Stroke Evaluation (No Fake Scoring)', () => {
  const canonicalHorizontalStroke = resamplePoints([
    { x: 150, y: 250 },
    { x: 350, y: 250 },
  ], RESAMPLE_COUNT);

  it('grants high confidence and snap permission when drawn accurately', () => {
    const accurateUserStroke = [
      { x: 155, y: 252 },
      { x: 250, y: 248 },
      { x: 345, y: 251 },
    ];
    const result = evaluateSingleStroke(accurateUserStroke, canonicalHorizontalStroke, 0, 500, 500);
    expect(result.correct).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(75);
    expect(result.directionCorrect).toBe(true);
    expect(result.canSnapToReference).toBe(true);
    expect(result.feedbackMessage).toContain('chuẩn xác');
  });

  it('detects backwards/reverse drawing and strictly rejects snap', () => {
    // User drew from right to left
    const reverseUserStroke = [
      { x: 350, y: 250 },
      { x: 250, y: 250 },
      { x: 150, y: 250 },
    ];
    const result = evaluateSingleStroke(reverseUserStroke, canonicalHorizontalStroke, 0, 500, 500);
    expect(result.correct).toBe(false);
    expect(result.confidence).toBeLessThanOrEqual(35);
    expect(result.canSnapToReference).toBe(false);
    expect(result.directionCosine).toBeLessThan(-0.5);
    expect(result.feedbackMessage).toContain('ngược hướng');
  });

  it('rejects strokes that are too short or incomplete', () => {
    const tinyStroke = [{ x: 200, y: 200 }];
    const result = evaluateSingleStroke(tinyStroke, canonicalHorizontalStroke, 0, 500, 500);
    expect(result.correct).toBe(false);
    expect(result.confidence).toBe(0);
    expect(result.canSnapToReference).toBe(false);
  });
});

describe('Handwriting Engine: Smooth Morphing Invariant', () => {
  it('does not mutate original stroke coordinates during morphing', () => {
    const rawUserPoints = [
      { x: 100, y: 100 },
      { x: 200, y: 200 },
    ];
    const targetPoints = [
      { x: 110, y: 90 },
      { x: 210, y: 210 },
    ];

    const controller = animateStrokeMorph(
      rawUserPoints,
      targetPoints,
      100,
      (_morphed) => {},
      () => {}
    );

    // Original points must remain untouched
    expect(rawUserPoints[0].x).toBe(100);
    expect(rawUserPoints[1].x).toBe(200);
    controller.cancel();
  });
});

describe('Language Learning Capability Registry', () => {
  it('enables handwriting board for Asian ideographic & syllable scripts (ja, zh, ko)', () => {
    expect(isHandwritingSupportedForLanguage('ja')).toBe(true);
    expect(isHandwritingSupportedForLanguage('zh')).toBe(true);
    expect(isHandwritingSupportedForLanguage('ko')).toBe(true);

    const jaScripts = getSupportedScriptsForLanguage('ja');
    expect(jaScripts.map((s) => s.scriptCode)).toEqual(['HIRAGANA', 'KATAKANA', 'KANJI']);

    const zhScripts = getSupportedScriptsForLanguage('zh');
    expect(zhScripts.map((s) => s.scriptCode)).toEqual(['HANZI_SIMPLIFIED']);
  });

  it('strictly disables handwriting board for Latin and pending scripts (en, es, fr, de, th)', () => {
    expect(isHandwritingSupportedForLanguage('en')).toBe(false);
    expect(isHandwritingSupportedForLanguage('es')).toBe(false);
    expect(isHandwritingSupportedForLanguage('fr')).toBe(false);
    expect(isHandwritingSupportedForLanguage('de')).toBe(false);
    expect(isHandwritingSupportedForLanguage('th')).toBe(false);

    const enCaps = getLanguageCapabilities('en');
    expect(enCaps.handwriting.handwritingBoard).toBe(false);
    expect(enCaps.general.vocabularyPractice).toBe(true);
    expect(enCaps.supportedScripts.length).toBe(0);
  });
});
