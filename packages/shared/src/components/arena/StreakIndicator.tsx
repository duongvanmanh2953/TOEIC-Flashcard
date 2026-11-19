import React from 'react';
import { ArenaIconFlame } from './ArenaIcons';

export interface StreakIndicatorProps {
  streak: number;
  className?: string;
}

export const StreakIndicator: React.FC<StreakIndicatorProps> = ({ streak, className = '' }) => {
  if (streak <= 0) return null;

  const isElite = streak >= 5;
  const isLegendary = streak >= 7;

  let colorStyle = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  let flameColor = 'text-amber-400';
  let glow = '';

  if (isLegendary) {
    colorStyle = 'bg-rose-500/20 text-rose-300 border-rose-500/50';
    flameColor = 'text-rose-400 animate-bounce';
    glow = 'shadow-[0_0_15px_rgba(244,63,94,0.4)]';
  } else if (isElite) {
    colorStyle = 'bg-orange-500/20 text-orange-300 border-orange-500/40';
    flameColor = 'text-orange-400 animate-pulse';
    glow = 'shadow-[0_0_12px_rgba(249,115,22,0.35)]';
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black select-none ${colorStyle} ${glow} ${className}`}
    >
      <ArenaIconFlame className={`w-4 h-4 shrink-0 ${flameColor}`} />
      <span className="tabular-nums font-mono">
        CHUỖI {streak}x
      </span>
      {isLegendary && (
        <span className="text-[10px] uppercase tracking-wider text-rose-300 font-bold">
          (+200 Điểm)
        </span>
      )}
    </div>
  );
};
