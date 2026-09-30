// ============================================================================
// TREASURE MAP ANIMATION — MOTION UTILITIES & PARTICLE GENERATORS
// Smooth path interpolation, particle bursts, and camera focus helpers
// ============================================================================

export interface SparkleParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  alpha: number;
}

export function generateBurstParticles(originX: number, originY: number, count = 20): SparkleParticle[] {
  const colors = ['#fde047', '#facc15', '#38bdf8', '#fb7185', '#4ade80', '#c084fc'];
  const particles: SparkleParticle[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const speed = 2.5 + Math.random() * 4.5;
    particles.push({
      id: Math.random(),
      x: originX,
      y: originY,
      size: 4 + Math.random() * 6,
      color: colors[i % colors.length],
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
    });
  }

  return particles;
}

// EaseInOut Quad for smooth character transition
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
