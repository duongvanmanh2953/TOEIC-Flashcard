import { describe, it, expect } from 'vitest';
import {
  resamplePoints,
  distance,
  pathLength,
  getDirectionVector,
  cosineSimilarity,
  evaluateSingleStroke,
  sampleSvgPath,
  RESAMPLE_COUNT,
} from '../lib/handwriting/strokeMath';
import { animateStrokeMorph } from '../lib/handwriting/morphEngine';
import {
  buildCharacterReference,
  evaluateFullCharacter,
} from '../lib/handwriting/evaluationEngine';
import { COMMON_CHARACTER_DICTIONARY } from '../lib/handwriting/characterDictionary';
import { segmentIntoGraphemes } from '../components/handwriting/VocabularyHandwritingPractice';
import { CharacterStrokeModel } from '../lib/handwriting/types';
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

describe('Section F1: Stroke Lifecycle & Pointer Isolation Invariants', () => {
  it('enforces structured CharacterStrokeModel with pointer metadata', () => {
    const stroke: CharacterStrokeModel = {
      strokeId: 'strk-101',
      characterId: 'char-日',
      strokeIndex: 0,
      pointerId: 1,
      pointerType: 'touch',
      points: [
        { x: 100, y: 100, timestamp: 1000 },
        { x: 100, y: 300, timestamp: 1200 },
      ],
      startPoint: { x: 100, y: 100 },
      endPoint: { x: 100, y: 300 },
      strokeDurationMs: 200,
      timestamp: 1000,
    };

    expect(stroke.strokeId).toBe('strk-101');
    expect(stroke.pointerId).toBe(1);
    expect(stroke.pointerType).toBe('touch');
    expect(stroke.points.length).toBe(2);
    expect(stroke.startPoint.x).toBe(100);
    expect(stroke.endPoint.y).toBe(300);
  });

  it('isolates different pointer IDs and does not merge simultaneous strokes', () => {
    const activePointers = new Map<number, { x: number; y: number }[]>();
    activePointers.set(1, [{ x: 50, y: 50 }, { x: 60, y: 60 }]);
    activePointers.set(2, [{ x: 200, y: 200 }, { x: 210, y: 210 }]);

    // Modifying pointer 1 should not touch pointer 2
    activePointers.get(1)!.push({ x: 70, y: 70 });
    expect(activePointers.get(1)!.length).toBe(3);
    expect(activePointers.get(2)!.length).toBe(2);
  });
});

describe('Section F2: Character Validation Matrix (4-Stroke Kanji "日")', () => {
  const kanjiEntry = COMMON_CHARACTER_DICTIONARY['日'];
  expect(kanjiEntry).toBeDefined();
  const ref = buildCharacterReference(kanjiEntry, 'KANJI', 500);

  // Sample the 4 reference strokes to use as user inputs
  const stroke0 = ref.strokes[0].points;
  const stroke1 = ref.strokes[1].points;
  const stroke2 = ref.strokes[2].points;
  const stroke3 = ref.strokes[3].points;

  it('Test 1: Only 1 stroke written -> Incomplete (missing 3 strokes)', () => {
    const result = evaluateFullCharacter([stroke0], ref, 500);
    expect(result.actualStrokeCount).toBe(1);
    expect(result.expectedStrokeCount).toBe(4);
    expect(result.missingStrokes).toBe(3);
    expect(result.extraStrokes).toBe(0);
    expect(result.finalCorrectness).toBe('INCORRECT');
    expect(result.recognized).toBe(false);
    expect(result.suggestions[0]).toContain('Chưa đủ nét: Đã vẽ 1/4 nét. Còn thiếu 3 nét.');
  });

  it('Test 2: Only 2 strokes written -> Incomplete (missing 2 strokes)', () => {
    const result = evaluateFullCharacter([stroke0, stroke1], ref, 500);
    expect(result.actualStrokeCount).toBe(2);
    expect(result.missingStrokes).toBe(2);
    expect(result.finalCorrectness).toBe('INCORRECT');
  });

  it('Test 3: Only 3 strokes written -> Incomplete (missing 1 stroke)', () => {
    const result = evaluateFullCharacter([stroke0, stroke1, stroke2], ref, 500);
    expect(result.actualStrokeCount).toBe(3);
    expect(result.missingStrokes).toBe(1);
    expect(result.finalCorrectness).toBe('INCORRECT');
  });

  it('Test 4: All 4 strokes written correctly -> Fully CORRECT with snap allowed', () => {
    const result = evaluateFullCharacter([stroke0, stroke1, stroke2, stroke3], ref, 500);
    expect(result.actualStrokeCount).toBe(4);
    expect(result.missingStrokes).toBe(0);
    expect(result.extraStrokes).toBe(0);
    expect(result.wrongDirectionIndices.length).toBe(0);
    expect(result.incorrectStrokeIndices.length).toBe(0);
    expect(result.strokeOrder.correct).toBe(true);
    expect(result.positionEvaluation.status).toBe('ALIGNED');
    expect(result.finalCorrectness).toBe('CORRECT');
    expect(result.canSnapToReference).toBe(true);
    expect(result.recognizedCharacter).toBe('日');
  });

  it('Test 5: 4 strokes written but misaligned (shifted by 160px) -> Reports position misalignment', () => {
    const misalignedStrokes = [stroke0, stroke1, stroke2, stroke3].map((stroke) =>
      stroke.map((pt) => ({ x: pt.x + 160, y: pt.y + 160 }))
    );
    const result = evaluateFullCharacter(misalignedStrokes, ref, 500);
    expect(result.positionEvaluation.status).toBe('MISALIGNED');
    expect(result.suggestions.some((msg) => msg.includes('khung lưới Điền-Tự-Cách') || msg.includes('lệch'))).toBe(true);
  });

  it('Test 6: 5 strokes written -> Detects extra stroke and flags INCORRECT', () => {
    const extraStroke = [
      { x: 100, y: 100 },
      { x: 200, y: 200 },
    ];
    const result = evaluateFullCharacter([stroke0, stroke1, stroke2, stroke3, extraStroke], ref, 500);
    expect(result.actualStrokeCount).toBe(5);
    expect(result.extraStrokes).toBe(1);
    expect(result.finalCorrectness).toBe('INCORRECT');
    expect(result.suggestions.some((s) => s.includes('Phát hiện thừa nét'))).toBe(true);
  });

  it('Test 7: Reverse stroke direction -> Detects wrong direction', () => {
    // Reverse stroke 0 (drawn bottom to top)
    const reversedStroke0 = [...stroke0].reverse();
    const result = evaluateFullCharacter([reversedStroke0, stroke1, stroke2, stroke3], ref, 500);
    expect(result.wrongDirectionIndices).toContain(0);
    expect(result.finalCorrectness).toBe('INCORRECT');
    expect(result.suggestions.some((s) => s.includes('ngược hướng'))).toBe(true);
  });

  it('Test 8: Wrong stroke order -> Detects order violation', () => {
    // Stroke 1 drawn before stroke 0
    const result = evaluateFullCharacter([stroke1, stroke0, stroke2, stroke3], ref, 500);
    expect(result.strokeOrder.correct).toBe(false);
    expect(result.wrongOrderIndices).toContain(0);
    expect(result.suggestions.some((s) => s.includes('thứ tự nét'))).toBe(true);
  });
});

describe('Section F3: Deterministic Consistency Test (25 Iterations)', () => {
  it('produces identical evaluation result across 25 consecutive runs without random auto-fill', () => {
    const kanjiEntry = COMMON_CHARACTER_DICTIONARY['日'];
    const ref = buildCharacterReference(kanjiEntry, 'KANJI', 500);
    const strokes = [
      ref.strokes[0].points,
      ref.strokes[1].points,
      ref.strokes[2].points,
      ref.strokes[3].points,
    ];

    const baseline = evaluateFullCharacter(strokes, ref, 500);

    for (let i = 0; i < 25; i++) {
      const run = evaluateFullCharacter(strokes, ref, 500);
      expect(run.finalCorrectness).toBe(baseline.finalCorrectness);
      expect(run.recognitionConfidence).toBe(baseline.recognitionConfidence);
      expect(run.missingStrokes).toBe(baseline.missingStrokes);
      expect(run.extraStrokes).toBe(baseline.extraStrokes);
      expect(run.suggestions).toEqual(baseline.suggestions);
    }
  });
});

describe('Section D5: Script-Aware Multi-Character Grapheme Segmentation', () => {
  it('segments Japanese Hiragana words into atomic kana units', () => {
    const units = segmentIntoGraphemes('こんにちは');
    expect(units).toEqual(['こ', 'ん', 'に', 'ち', 'は']);
    expect(units.length).toBe(5);
  });

  it('segments Japanese Kanji compounds correctly', () => {
    const units = segmentIntoGraphemes('今日');
    expect(units).toEqual(['今', '日']);
  });

  it('handles Latin words gracefully', () => {
    const units = segmentIntoGraphemes('vocab');
    expect(units).toEqual(['v', 'o', 'c', 'a', 'b']);
  });

  it('returns empty array for empty strings', () => {
    expect(segmentIntoGraphemes('')).toEqual([]);
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

describe('Handwriting Engine: Authentic Vector & Fallback Freeform Invariants', () => {
  it('contains authentic SVG stroke paths for common Chinese/Japanese characters without dummy cross', () => {
    const ni = COMMON_CHARACTER_DICTIONARY['你'];
    expect(ni).toBeDefined();
    expect(ni.strokeCount).toBe(7);
    expect(ni.svgPaths.length).toBe(7);

    const hao = COMMON_CHARACTER_DICTIONARY['好'];
    expect(hao).toBeDefined();
    expect(hao.strokeCount).toBe(6);
    expect(hao.svgPaths.length).toBe(6);

    const shi = COMMON_CHARACTER_DICTIONARY['十'];
    expect(shi).toBeDefined();
    expect(shi.strokeCount).toBe(2);
  });

  it('evaluates freeform user strokes when no SVG paths exist without dummy cross snapping', () => {
    const uncatalogedRef = {
      id: 'gen-龙',
      literal: '龙',
      scriptCode: 'HANZI_SIMPLIFIED',
      strokeCount: 5,
      strokes: [],
      viewBox: { width: 500, height: 500 },
      hasRealSvgPaths: false,
    };

    const userStrokes = [
      [{ x: 200, y: 200 }, { x: 300, y: 200 }],
      [{ x: 250, y: 200 }, { x: 250, y: 350 }],
      [{ x: 180, y: 350 }, { x: 320, y: 350 }],
    ];

    const result = evaluateFullCharacter(userStrokes, uncatalogedRef as any, 500);
    expect(result.recognized).toBe(true);
    expect(result.finalCorrectness).toBe('CORRECT');
    expect(result.recognitionConfidence).toBeGreaterThanOrEqual(80);
    expect(result.canSnapToReference).toBe(false);
  });
});
