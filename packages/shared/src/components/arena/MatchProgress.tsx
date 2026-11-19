import React from 'react';
import { ARENA_THEME } from '../../arena/arenaTheme';

export interface MatchProgressProps {
  currentRound: number;
  totalRounds: number;
  roundMultiplier?: number;
  modeTitle?: string;
  className?: string;
}

export const MatchProgress: React.FC<MatchProgressProps> = ({
  currentRound,
  totalRounds,
  roundMultiplier = 1.0,
  modeTitle,
  className = '',
}) => {
  const safeCurrent = Math.max(1, currentRound);
  const safeTotal = Math.max(1, totalRounds);
  const percentage = Math.min(100, Math.round((safeCurrent / safeTotal) * 100));

  return (
    <div className={`space-y-1.5 w-full select-none ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono font-black text-white text-sm">
            CÂU {safeCurrent} <span className="text-slate-500 font-normal">/ {safeTotal}</span>
          </span>
          {modeTitle && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#19213A] text-slate-300 border border-[#232D4E]">
              {modeTitle}
            </span>
          )}
        </div>

        {roundMultiplier > 1.0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#F6C453]/20 text-[#F6C453] border border-[#F6C453]/40 animate-pulse">
            x{roundMultiplier} Điểm Thưởng
          </span>
        )}
      </div>

      {/* Progress Track */}
      <div className="w-full h-2 rounded-full bg-[#12182B] border border-[#232D4E] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#2041F6] to-[#8B75FF] transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
