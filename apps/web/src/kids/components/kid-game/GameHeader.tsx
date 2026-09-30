// ============================================================================
// GAME HEADER — UNIFIED COMPACT GAME HUD
// Height: 60px (desktop), 52px (mobile) • Standardized HUD across all 20 games
// Exit modal trigger • Audio toggle • Progress • Hearts / Stars
// ============================================================================

import React, { memo } from 'react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Pause,
  Star,
  Heart,
  Flame,
} from 'lucide-react';
import { GameProgress } from './GameProgress';
import { soundManager } from '../../services/sound/KidsSoundManager';

interface GameHeaderProps {
  title: string;
  icon?: React.ReactNode;
  currentRound?: number;
  totalRounds?: number;
  score?: number;
  lives?: number;
  maxLives?: number;
  streak?: number;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onExitClick: () => void;
  onPauseClick?: () => void;
  className?: string;
}

export const GameHeader: React.FC<GameHeaderProps> = memo(({
  title,
  icon,
  currentRound = 1,
  totalRounds = 5,
  score = 0,
  lives,
  maxLives = 3,
  streak = 0,
  isMuted = false,
  onToggleMute,
  onExitClick,
  onPauseClick,
  className = '',
}) => {
  return (
    <header
      className={`h-[52px] sm:h-[60px] px-3 sm:px-5 w-full flex items-center justify-between shrink-0 select-none bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 z-30 transition-all ${className}`}
    >
      {/* LEFT: Exit button & Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={() => {
            soundManager.playPop();
            onExitClick();
          }}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 active:scale-95 transition-transform cursor-pointer border border-slate-200/80 dark:border-slate-700 shrink-0"
          title="Thoát trò chơi"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          {icon && <span className="shrink-0 text-xl hidden xs:inline-flex">{icon}</span>}
          <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate tracking-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* CENTER: Compact Progress Bar */}
      {totalRounds > 0 && (
        <div className="hidden md:flex items-center justify-center">
          <GameProgress current={currentRound} total={totalRounds} />
        </div>
      )}

      {/* RIGHT: Score, Lives, Sound, Pause */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Streak Flame */}
        {streak > 1 && (
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 border border-orange-200 text-xs font-black">
            <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500 animate-pulse" />
            <span>{streak}</span>
          </div>
        )}

        {/* Lives (if enabled) */}
        {typeof lives === 'number' && (
          <div className="flex items-center gap-0.5 sm:gap-1 px-2 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200">
            {Array.from({ length: maxLives }).map((_, i) => (
              <Heart
                key={i}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                  i < lives
                    ? 'fill-rose-500 text-rose-500'
                    : 'fill-slate-200 text-slate-300 dark:fill-slate-700'
                }`}
              />
            ))}
          </div>
        )}

        {/* Star / Score Badge */}
        <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 text-amber-900 dark:text-amber-200 font-black text-xs sm:text-sm shadow-xs">
          <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
          <span>{score}</span>
        </div>

        {/* Audio Mute/Unmute Button */}
        {onToggleMute && (
          <button
            type="button"
            onClick={onToggleMute}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 active:scale-95 transition-transform cursor-pointer border border-slate-200/80 dark:border-slate-700"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-600" />
            )}
          </button>
        )}

        {/* Pause Button (if provided) */}
        {onPauseClick && (
          <button
            type="button"
            onClick={onPauseClick}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 active:scale-95 transition-transform cursor-pointer border border-slate-200/80 dark:border-slate-700"
            title="Tạm dừng"
          >
            <Pause className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
});
