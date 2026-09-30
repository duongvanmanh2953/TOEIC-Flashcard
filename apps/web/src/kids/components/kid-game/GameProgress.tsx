// ============================================================================
// GAME PROGRESS — UNIFIED SYSTEM COMPONENT
// GPU-accelerated animated progress bar • Pill indicator • High visibility
// ============================================================================

import React, { memo } from 'react';

interface GameProgressProps {
  current: number;
  total: number;
  className?: string;
  showText?: boolean;
}

export const GameProgress: React.FC<GameProgressProps> = memo(({
  current,
  total,
  className = '',
  showText = true,
}) => {
  const percentage = Math.min(100, Math.max(0, (current / Math.max(1, total)) * 100));

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Track */}
      <div className="relative w-28 sm:w-44 md:w-56 h-3 sm:h-3.5 rounded-full bg-slate-900/10 dark:bg-white/15 p-0.5 overflow-hidden backdrop-blur-xs border border-white/20">
        {/* Fill bar */}
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-400 transition-[width] duration-300 ease-out shadow-[0_0_12px_rgba(52,211,153,0.6)]"
          style={{
            width: `${percentage}%`,
            willChange: 'width',
          }}
        />
      </div>

      {/* Label count */}
      {showText && (
        <span className="text-xs sm:text-sm font-black font-mono tracking-tight text-slate-700 dark:text-white/90 select-none whitespace-nowrap">
          {current}/{total}
        </span>
      )}
    </div>
  );
});
