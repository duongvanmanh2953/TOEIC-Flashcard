/**
 * Stroke Evaluation Engine & Multi-Script Evaluator
 * Comprehensive character-level and stroke-level evaluation.
 * Calculates true geometric scores, detects missing/extra strokes,
 * out-of-order strokes, reverse strokes, and produces actionable feedback.
 */

import {
  CharacterReference,
  HandwritingStroke,
  CharacterEvaluationResult,
  SingleStrokeEvaluation,
} from './types';
import { evaluateSingleStroke, sampleSvgPath, distance, resamplePoints } from './strokeMath';

/**
 * Build CharacterReference from database/API character object
 */
export function buildCharacterReference(
  charData: {
    id: string;
    literal: string;
    strokeCount: number;
    svgPaths: string[];
    readings?: any;
    meanings?: string[];
    radicals?: string;
    level?: string;
  },
  scriptCode: string,
  canvasSize: number = 500
): CharacterReference {
  // SVG paths in KanjiVG / Hanzi are authored inside a 109x109 or 1024x1024 coordinate system.
  // Standard KanjiVG is 109x109. If max coordinate > 200, assume 1024x1024.
  const firstPath = charData.svgPaths[0] || '';
  const is1024 = /1024|[4-9]\d{2}/.test(firstPath);
  const authoringSize = is1024 ? 1024 : 109;
  const scale = canvasSize / authoringSize;

  const strokes = charData.svgPaths.map((pathStr, index) => {
    const pts = sampleSvgPath(pathStr, 32, scale);
    return {
      index,
      pathString: pathStr,
      points: pts,
      length: pts.length,
    };
  });

  return {
    id: charData.id,
    literal: charData.literal,
    scriptCode,
    strokeCount: charData.strokeCount || charData.svgPaths.length,
    strokes,
    meanings: charData.meanings,
    readings: charData.readings,
    radicals: charData.radicals,
    level: charData.level,
    viewBox: { width: canvasSize, height: canvasSize },
    hasRealSvgPaths: Boolean(charData.svgPaths && charData.svgPaths.length > 0 && !(charData as any).isFallback),
  };
}

/**
 * Full Character Evaluation
 */
export function evaluateFullCharacter(
  userStrokes: HandwritingStroke[],
  reference: CharacterReference,
  canvasSize: number = 500
): CharacterEvaluationResult {
  const expectedCount = reference.strokeCount;
  const actualCount = userStrokes.length;
  const countCorrect = expectedCount === actualCount;

  const strokeEvaluations: SingleStrokeEvaluation[] = [];
  const mistakes: number[] = [];
  const suggestions: string[] = [];

  // Check stroke count discrepancies
  if (actualCount < expectedCount) {
    suggestions.push(`Bạn mới vẽ ${actualCount}/${expectedCount} nét. Hãy hoàn thành các nét còn lại!`);
  } else if (actualCount > expectedCount) {
    suggestions.push(`Ký tự này chỉ có ${expectedCount} nét chuẩn, bạn đã vẽ thừa ${actualCount - expectedCount} nét.`);
  }

  // Evaluate strokes in sequential order
  let totalStrokeScore = 0;
  const evalCount = Math.min(actualCount, expectedCount);

  for (let i = 0; i < evalCount; i++) {
    const userStroke = userStrokes[i];
    const refStroke = reference.strokes[i];
    if (!refStroke) continue;

    const evalResult = evaluateSingleStroke(userStroke, refStroke.points, i, canvasSize, canvasSize);
    strokeEvaluations.push(evalResult);

    if (!evalResult.correct) {
      mistakes.push(i);
      suggestions.push(`Nét thứ ${i + 1}: ${evalResult.feedbackMessage}`);
    }
    totalStrokeScore += evalResult.confidence;
  }

  // Stroke order check: check if any subsequent stroke was actually drawn earlier
  let strokeOrderCorrect = true;
  if (actualCount >= 2 && expectedCount >= 2) {
    // Check if user drew stroke 1 before stroke 0
    if (userStrokes[0] && reference.strokes[1] && reference.strokes[0]) {
      const matchWithStroke1 = evaluateSingleStroke(userStrokes[0], reference.strokes[1].points, 0, canvasSize, canvasSize);
      const matchWithStroke0 = evaluateSingleStroke(userStrokes[0], reference.strokes[0].points, 0, canvasSize, canvasSize);
      if (matchWithStroke1.confidence > matchWithStroke0.confidence + 25) {
        strokeOrderCorrect = false;
        suggestions.push('Cảnh báo thứ tự nét: Bạn đã vẽ nét thứ 2 trước nét thứ 1!');
      }
    }
  }

  // Overall confidence
  const avgStrokeScore = evalCount > 0 ? totalStrokeScore / evalCount : 0;
  // Penalty for count mismatch
  const countPenalty = Math.abs(expectedCount - actualCount) * 15;
  const orderPenalty = strokeOrderCorrect ? 0 : 20;

  const rawConfidence = Math.max(0, Math.min(100, Math.round(avgStrokeScore - countPenalty - orderPenalty)));
  const recognized = rawConfidence >= 75 && countCorrect && strokeOrderCorrect;

  if (recognized && suggestions.length === 0) {
    suggestions.push('Xuất sắc! Ký tự chuẩn xác cả về cấu trúc, hướng nét và thứ tự viết.');
  }

  // Pre-morph mastery score (authentic measure of independent writing skill)
  const preMorphMasteryScore = Math.max(0, Math.min(100, rawConfidence));

  return {
    recognized,
    confidence: rawConfidence,
    strokeCount: {
      expected: expectedCount,
      actual: actualCount,
      correct: countCorrect,
    },
    strokeOrder: {
      correct: strokeOrderCorrect,
      mistakes,
    },
    strokeEvaluations,
    suggestions,
    canSnapToReference: recognized,
    preMorphMasteryScore,
  };
}
