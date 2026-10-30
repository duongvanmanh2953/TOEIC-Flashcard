/**
 * Smooth Stroke Morphing Engine
 * Executes fluid 220ms cubic Bezier interpolation from user's drawn stroke
 * into the canonical reference stroke trajectory.
 *
 * Invariant: Never alters the original raw stroke coordinates used for mastery calculation.
 */

import { HandwritingPoint, HandwritingStroke } from './types';
import { resamplePoints, RESAMPLE_COUNT } from './strokeMath';

export interface MorphController {
  cancel: () => void;
  isCompleted: () => boolean;
}

const safeRequestAnimationFrame =
  typeof requestAnimationFrame !== 'undefined'
    ? requestAnimationFrame
    : (cb: (now: number) => void) => (setTimeout(() => cb(Date.now()), 16) as unknown as number);

const safeCancelAnimationFrame =
  typeof cancelAnimationFrame !== 'undefined'
    ? cancelAnimationFrame
    : (id: number) => clearTimeout(id as unknown as any);

/**
 * Standard cubic ease-out curve: fast startup, gentle landing
 */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}


/**
 * Animate smooth morphing of a stroke from origin points to target points
 */
export function animateStrokeMorph(
  originPoints: HandwritingStroke,
  targetPoints: HandwritingPoint[],
  durationMs: number = 220,
  onProgress: (currentMorphedPoints: HandwritingStroke) => void,
  onComplete: () => void
): MorphController {
  let isCancelled = false;
  let completed = false;
  let rafId: number | null = null;

  // Resample both to identical point count for 1:1 point interpolation
  const startPts = resamplePoints(originPoints, RESAMPLE_COUNT);
  const endPts = targetPoints.length === RESAMPLE_COUNT ? targetPoints : resamplePoints(targetPoints, RESAMPLE_COUNT);

  const startTime = performance.now();

  function step(now: number) {
    if (isCancelled) return;

    const elapsed = now - startTime;
    const progress = Math.min(1, Math.max(0, elapsed / durationMs));
    const easeProgress = easeOutCubic(progress);

    // Interpolate each point along vector trajectory
    const currentPoints: HandwritingStroke = [];
    for (let i = 0; i < RESAMPLE_COUNT; i++) {
      const pStart = startPts[i];
      const pEnd = endPts[i];
      currentPoints.push({
        x: pStart.x + (pEnd.x - pStart.x) * easeProgress,
        y: pStart.y + (pEnd.y - pStart.y) * easeProgress,
      });
    }

    onProgress(currentPoints);

    if (progress < 1) {
      rafId = safeRequestAnimationFrame(step);
    } else {
      completed = true;
      onComplete();
    }
  }

  rafId = safeRequestAnimationFrame(step);

  return {
    cancel: () => {
      isCancelled = true;
      if (rafId !== null) {
        safeCancelAnimationFrame(rafId);
      }
    },
    isCompleted: () => completed,
  };
}

