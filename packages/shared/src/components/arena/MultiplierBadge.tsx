import React from 'react';
import { ArenaIconSparkles } from './ArenaIcons';

export interface MultiplierBadgeProps {
  multiplier: number;
  label?: string;
  className?: string;
}

export const MultiplierBadge: React.FC<MultiplierBadgeProps> = ({
  multiplier,
  label = 'BONUS',
  className = '',
}) => {
  if (multiplier <= 1.0) return null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F6C453]/20 border border-[#F6C453]/50 text-[#F6C453] shadow-[0_0_15px_rgba(246,196,83,0.35)] select-none animate-pulse ${className}`}
    >
      <ArenaIconSparkles className="w-3.5 h-3.5" />
      <span className="text-xs font-black uppercase tracking-wider">
        {multiplier}X {label}
      </span>
    </div>
  );
};
