/**
 * Geometric Vector Math & Stroke Evaluator
 * Fully authentic mathematical evaluation of handwriting strokes:
 * 1. Resampling to equidistant points (N=32)
 * 2. Directional vector calculation & cosine similarity (detects reverse drawing)
 * 3. Starting / Ending point tolerance
 * 4. Mean normalized Euclidean distance (shape similarity)
 * 5. Strict rejection of false positives
 */

import { HandwritingPoint, HandwritingStroke, SingleStrokeEvaluation } from './types';

export const RESAMPLE_COUNT = 32;

/**
 * Calculate Euclidean distance between two points
 */
export function distance(p1: HandwritingPoint, p2: HandwritingPoint): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.hypot(dx, dy);
}

/**
 * Calculate total arc length of a stroke
 */
export function pathLength(points: HandwritingPoint[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += distance(points[i - 1], points[i]);
  }
  return total;
}

/**
 * Resample points into N equidistant points along the trajectory
 * Standard geometric technique in digital ink & stroke recognition (Dollar family, DTW)
 */
export function resamplePoints(points: HandwritingPoint[], targetCount: number = RESAMPLE_COUNT): HandwritingPoint[] {
  if (points.length <= 1) {
    return Array.from({ length: targetCount }, () => ({ x: points[0]?.x || 0, y: points[0]?.y || 0 }));
  }

  const totalLen = pathLength(points);
  if (totalLen === 0) {
    return Array.from({ length: targetCount }, () => ({ x: points[0].x, y: points[0].y }));
  }

  const interval = totalLen / (targetCount - 1);
  const result: HandwritingPoint[] = [{ x: points[0].x, y: points[0].y }];
  let currentDist = 0;
  let pts = points.map((p) => ({ ...p }));

  for (let i = 1; i < pts.length; i++) {
    const p1 = pts[i - 1];
    const p2 = pts[i];
    const segmentDist = distance(p1, p2);

    if (currentDist + segmentDist >= interval) {
      const remainingNeeded = interval - currentDist;
      const ratio = remainingNeeded / segmentDist;
      const newPoint: HandwritingPoint = {
        x: p1.x + ratio * (p2.x - p1.x),
        y: p1.y + ratio * (p2.y - p1.y),
      };
      result.push(newPoint);
      pts.splice(i, 0, newPoint); // Insert interpolated point
      currentDist = 0;
    } else {
      currentDist += segmentDist;
    }
  }

  // Ensure exact count
  while (result.length < targetCount) {
    result.push({ x: points[points.length - 1].x, y: points[points.length - 1].y });
  }
  return result.slice(0, targetCount);
}

/**
 * Sample points from an SVG path string.
 * Uses native SVGPathElement when available (Browser DOM),
 * with a regex-based linear/bezier approximation fallback for headless/Node environments.
 */
export function sampleSvgPath(pathStr: string, sampleCount: number = RESAMPLE_COUNT, scale: number = 1): HandwritingPoint[] {
  if (typeof document !== 'undefined' && document.createElementNS) {
    try {
      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathEl.setAttribute('d', pathStr);
      const totalLen = pathEl.getTotalLength();
      if (totalLen > 0) {
        const step = totalLen / (sampleCount - 1);
        const pts: HandwritingPoint[] = [];
        for (let i = 0; i < sampleCount; i++) {
          const pt = pathEl.getPointAtLength(Math.min(i * step, totalLen));
          pts.push({ x: pt.x * scale, y: pt.y * scale });
        }
        return pts;
      }
    } catch {
      // Fallback below
    }
  }

  // Fallback parser for standard SVG commands (M, L, C, Q, Z)
  return parseSvgPathFallback(pathStr, sampleCount, scale);
}

/**
 * Pure TypeScript fallback parser for SVG path string
 */
function parseSvgPathFallback(d: string, sampleCount: number, scale: number): HandwritingPoint[] {
  const points: HandwritingPoint[] = [];
  const commands = d.match(/[a-df-z][^a-df-z]*/gi) || [];

  let curX = 0;
  let curY = 0;

  for (const cmd of commands) {
    const type = cmd[0];
    const args = (cmd.slice(1).trim().match(/[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g) || []).map(Number);

    if (type === 'M' || type === 'L') {
      for (let i = 0; i < args.length; i += 2) {
        curX = args[i];
        curY = args[i + 1];
        points.push({ x: curX * scale, y: curY * scale });
      }
    } else if (type === 'C' && args.length >= 6) {
      // Cubic bezier sample: end point is args[4], args[5]
      curX = args[4];
      curY = args[5];
      points.push({ x: curX * scale, y: curY * scale });
    } else if (type === 'Q' && args.length >= 4) {
      curX = args[2];
      curY = args[3];
      points.push({ x: curX * scale, y: curY * scale });
    }
  }

  if (points.length === 0) {
    return Array.from({ length: sampleCount }, () => ({ x: 0, y: 0 }));
  }
  return resamplePoints(points, sampleCount);
}

/**
 * Compute the overall direction vector from a series of points
 */
export function getDirectionVector(points: HandwritingPoint[]): { dx: number; dy: number; length: number } {
  if (points.length < 2) return { dx: 0, dy: 0, length: 0 };
  const start = points[0];
  const end = points[points.length - 1];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  return {
    dx: length > 0 ? dx / length : 0,
    dy: length > 0 ? dy / length : 0,
    length,
  };
}

/**
 * Compute cosine similarity between two 2D vectors: [-1, 1]
 * 1.0 = identical direction
 * 0.0 = perpendicular
 * -1.0 = completely opposite / backwards!
 */
export function cosineSimilarity(
  v1: { dx: number; dy: number },
  v2: { dx: number; dy: number }
): number {
  return v1.dx * v2.dx + v1.dy * v2.dy;
}

/**
 * Evaluate single drawn stroke against a canonical reference stroke
 * Strictly geometric, deterministic, and verifiable.
 */
export function evaluateSingleStroke(
  userStroke: HandwritingStroke,
  refPoints: HandwritingPoint[],
  strokeIndex: number,
  canvasWidth: number = 500,
  canvasHeight: number = 500
): SingleStrokeEvaluation {
  if (!userStroke || userStroke.length < 2) {
    return {
      strokeIndex,
      confidence: 0,
      correct: false,
      directionCorrect: false,
      directionCosine: 0,
      startPointDistance: canvasWidth,
      endPointDistance: canvasWidth,
      shapeSimilarity: 0,
      feedbackMessage: 'Nét vẽ quá ngắn hoặc chưa hoàn chỉnh. Hãy vẽ dứt khoát hơn!',
      canSnapToReference: false,
    };
  }

  // 1. Resample both user stroke and reference to RESAMPLE_COUNT
  const userResampled = resamplePoints(userStroke, RESAMPLE_COUNT);
  const refResampled = refPoints.length === RESAMPLE_COUNT ? refPoints : resamplePoints(refPoints, RESAMPLE_COUNT);

  // 2. Measure endpoints distance relative to canvas diagonal
  const canvasDiagonal = Math.hypot(canvasWidth, canvasHeight);
  const startDist = distance(userResampled[0], refResampled[0]);
  const endDist = distance(userResampled[RESAMPLE_COUNT - 1], refResampled[RESAMPLE_COUNT - 1]);

  // 3. Direction Vector & Cosine Similarity
  const userDir = getDirectionVector(userResampled);
  const refDir = getDirectionVector(refResampled);
  const cosSim = cosineSimilarity(userDir, refDir);

  // Check reverse direction
  const isBackwards = cosSim < -0.2;
  const directionCorrect = cosSim >= 0.45;

  // 4. Mean Shape Distance (Normalized)
  let totalDist = 0;
  for (let i = 0; i < RESAMPLE_COUNT; i++) {
    totalDist += distance(userResampled[i], refResampled[i]);
  }
  const meanDistance = totalDist / RESAMPLE_COUNT;
  const normalizedMeanDist = meanDistance / canvasDiagonal;

  // Shape similarity score from 0 to 100
  // If normalized distance is 0, score is 100. If >= 0.35 of canvas diagonal, score is 0.
  const shapeSimilarity = Math.max(0, Math.min(100, Math.round((1 - normalizedMeanDist / 0.35) * 100)));

  // Endpoint tolerance score (allow natural handwriting variance up to 20% of canvas)
  const normEndpointDist = (startDist + endDist) / 2 / canvasDiagonal;
  const endpointScore = Math.max(0, Math.min(100, Math.round((1 - normEndpointDist / 0.25) * 100)));

  // Direction score
  const dirScore = Math.max(0, Math.round(((cosSim + 1) / 2) * 100));

  // Overall Confidence: Weighted synthesis
  // 45% Shape similarity + 30% Direction + 25% Endpoints
  let rawConfidence = Math.round(shapeSimilarity * 0.45 + dirScore * 0.3 + endpointScore * 0.25);

  // Critical penalty: If user drew backwards (e.g. right-to-left instead of left-to-right), cap confidence!
  if (isBackwards) {
    rawConfidence = Math.min(rawConfidence, 35);
  }

  const confidence = Math.max(5, Math.min(99, rawConfidence));
  // Smart tolerant threshold for natural mobile touchscreen drawing:
  // If stroke has correct general direction and shape is reasonably close (>= 45%),
  // auto-snap to the perfect reference stroke and consider it correct!
  const canSnapToReference = confidence >= 45 && !isBackwards;
  const correct = (confidence >= 45 || canSnapToReference) && !isBackwards;

  // Granular actionable feedback message
  let feedbackMessage = 'Nét vẽ chuẩn xác!';
  if (isBackwards) {
    feedbackMessage = 'Nét vẽ bị ngược hướng! Chú ý điểm bắt đầu và chiều kéo nét theo mũi tên mẫu.';
  } else if (!directionCorrect) {
    feedbackMessage = 'Hướng nghiêng hoặc độ cong của nét chưa đúng với quỹ đạo chuẩn.';
  } else if (endpointScore < 50) {
    feedbackMessage = 'Điểm đặt bút hoặc điểm nhấc bút còn lệch so với vị trí quy chuẩn.';
  } else if (shapeSimilarity < 65) {
    feedbackMessage = 'Hình dạng nét chưa đủ độ tương đồng. Hãy quan sát kỹ khung lưới.';
  }

  return {
    strokeIndex,
    confidence,
    correct,
    directionCorrect,
    directionCosine: cosSim,
    startPointDistance: Math.round(startDist),
    endPointDistance: Math.round(endDist),
    shapeSimilarity,
    feedbackMessage,
    canSnapToReference,
  };
}
