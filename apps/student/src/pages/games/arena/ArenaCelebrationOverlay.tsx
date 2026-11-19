import React, { useEffect, useState } from 'react';
import { Sparkles, Flame, Zap, Award } from 'lucide-react';

export interface ArenaCelebrationProps {
  show: boolean;
  score: number;
  streak?: number;
  speedMs?: number | null;
  onComplete?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  shape: 'star' | 'circle' | 'square' | 'sparkle';
  speedX: number;
  speedY: number;
}

const COLORS = [
  '#10B981', // Emerald
  '#34D399', // Mint
  '#F59E0B', // Amber
  '#FCD34D', // Gold
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#EC4899', // Pink
];

export const ArenaCelebrationOverlay: React.FC<ArenaCelebrationProps> = ({
  show,
  score,
  streak = 0,
  speedMs,
  onComplete,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) {
      setVisible(false);
      setParticles([]);
      return;
    }

    setVisible(true);

    // Generate 36 explosive particles
    const generated: Particle[] = Array.from({ length: 36 }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / 36 + (Math.random() - 0.5) * 0.3;
      const speed = Math.random() * 220 + 120;
      return {
        id: i,
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed - 60, // Slight upward bias
        color: COLORS[i % COLORS.length],
        size: Math.random() * 10 + 6,
        rotation: Math.random() * 360,
        shape: (['star', 'circle', 'square', 'sparkle'] as const)[i % 4],
        speedX: Math.cos(angle),
        speedY: Math.sin(angle),
      };
    });

    setParticles(generated);

    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [show, onComplete]);

  if (!visible) return null;

  const isFast = speedMs && speedMs < 2500;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      {/* 1. Screen Border Emerald Flash */}
      <div className="absolute inset-0 border-4 border-emerald-400/80 shadow-[inset_0_0_80px_rgba(52,211,153,0.45)] animate-pulse" />

      {/* 2. Confetti Particles Flying Out */}
      <div className="absolute inset-0 flex items-center justify-center">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute transition-all duration-1000 ease-out"
            style={{
              transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rotation * 2}deg)`,
              opacity: 0,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.shape === 'star' ? 'transparent' : p.color,
              borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'square' ? '2px' : '0',
            }}
          >
            {p.shape === 'star' && (
              <span style={{ color: p.color, fontSize: `${p.size * 1.4}px` }}>★</span>
            )}
            {p.shape === 'sparkle' && (
              <span style={{ color: p.color, fontSize: `${p.size * 1.4}px` }}>✦</span>
            )}
          </div>
        ))}
      </div>

      {/* 3. Hero Floating Badge */}
      <div className="relative flex flex-col items-center gap-2 animate-bounce-short drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-2.5 px-6 py-3 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 border-2 border-emerald-200 text-white font-black shadow-2xl shadow-emerald-500/50">
          <Sparkles className="w-6 h-6 text-yellow-300 animate-spin" />
          <span className="text-xl sm:text-2xl tracking-wider">CHÍNH XÁC!</span>
          <span className="text-2xl sm:text-3xl font-mono text-amber-300 drop-shadow">
            +{score} XP
          </span>
        </div>

        {/* Combo Streak Pill */}
        {streak > 1 && (
          <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-2xl bg-gradient-to-r from-amber-600 via-rose-600 to-orange-600 border border-amber-300 text-white text-xs sm:text-sm font-black shadow-lg animate-pulse">
            <Flame className="w-4 h-4 text-amber-200 fill-amber-300 animate-bounce" />
            <span>CHUỖI ĐÚNG X{streak}! COMBO RỰC LỬA!</span>
          </div>
        )}

        {/* Speedy reflex pill */}
        {isFast && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-900/90 border border-indigo-400 text-indigo-200 text-[11px] font-bold">
            <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>Phản xạ thần tốc ({Math.round(speedMs)}ms)</span>
          </div>
        )}
      </div>
    </div>
  );
};
