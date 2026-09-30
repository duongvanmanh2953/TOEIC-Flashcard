// ============================================================================
// GAME LOADING — INSTANT ASSET PRELOADER SCREEN
// Quick 300ms transition • Zero white flash • Mascot animation
// ============================================================================

import React, { memo } from 'react';
import { Loader2 } from 'lucide-react';

interface GameLoadingProps {
  message?: string;
  gameTitle?: string;
}

export const GameLoading: React.FC<GameLoadingProps> = memo(({
  message = 'Đang tải trò chơi...',
  gameTitle,
}) => {
  return (
    <div className="absolute inset-0 z-[80] flex flex-col items-center justify-center p-6 bg-[#FFFDF7] select-none animate-fadeIn">
      {/* Mascot loading */}
      <div className="relative w-28 h-28 mb-4">
        <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl animate-pulse" />
        <img
          src="/assets/kid/mascot/vivi-study.png"
          alt="Loading Vivi"
          className="w-full h-full object-contain pointer-events-none animate-bounce"
        />
      </div>

      {gameTitle && (
        <h3 className="text-xl font-black text-slate-900 mb-1 tracking-tight">
          {gameTitle}
        </h3>
      )}

      <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
        <span>{message}</span>
      </div>
    </div>
  );
});
