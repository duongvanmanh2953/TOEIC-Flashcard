// ============================================================================
// GAME CARD — UNIFIED TACTILE EDUCATIONAL CARD
// Image-first layout • 60fps GPU hover/active scale • Rich state feedback
// ============================================================================

import React, { memo } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { soundManager } from '../../services/sound/KidsSoundManager';

export type GameCardState = 'idle' | 'selected' | 'correct' | 'wrong' | 'disabled';

interface GameCardProps {
  id?: string;
  image?: React.ReactNode;
  imageUrl?: string;
  imageAlt?: string;
  title?: string;
  subtitle?: string;
  state?: GameCardState;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
}

export const GameCard: React.FC<GameCardProps> = memo(({
  image,
  imageUrl,
  imageAlt = 'Card image',
  title,
  subtitle,
  state = 'idle',
  onClick,
  className = '',
  children,
  aspectRatio = 'portrait',
}) => {
  const handleClick = () => {
    if (state === 'disabled' || state === 'correct') return;
    if (onClick) {
      soundManager.playPop();
      onClick();
    }
  };

  // State-specific styling
  const stateStyles = {
    idle:
      'bg-white dark:bg-slate-800/95 border-2 border-white/80 dark:border-slate-700 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.08),0_4px_10px_rgba(0,0,0,0.03)] hover:-translate-y-1.5 hover:shadow-[0_16px_32px_-4px_rgba(0,0,0,0.14)] active:translate-y-0 active:scale-95',
    selected:
      'bg-amber-50 dark:bg-amber-950/40 border-3 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.35)] -translate-y-1',
    correct:
      'bg-emerald-50 dark:bg-emerald-950/40 border-3 border-emerald-500 shadow-[0_0_24px_rgba(16,185,129,0.4)] scale-102 pointer-events-none animate-[pulse_1.5s_ease-in-out]',
    wrong:
      'bg-rose-50 dark:bg-rose-950/40 border-3 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.35)] animate-[shake_0.4s_ease-in-out]',
    disabled:
      'bg-slate-100 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed pointer-events-none shadow-none',
  }[state];

  const aspectClass = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
  }[aspectRatio];

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      className={`relative rounded-[22px] sm:rounded-[26px] p-3 sm:p-4 flex flex-col items-center justify-between select-none cursor-pointer transition-all duration-200 ease-out touch-manipulation overflow-hidden ${aspectClass} ${stateStyles} ${className}`}
      style={{ willChange: 'transform' }}
    >
      {/* State Badge Icon (Top-Right) */}
      {state === 'correct' && (
        <div className="absolute top-2.5 right-2.5 z-20 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md animate-scaleUp">
          <CheckCircle2 className="w-4 h-4 stroke-[3]" />
        </div>
      )}
      {state === 'wrong' && (
        <div className="absolute top-2.5 right-2.5 z-20 w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md animate-scaleUp">
          <XCircle className="w-4 h-4 stroke-[3]" />
        </div>
      )}

      {/* Main Image Area */}
      <div className="relative w-full flex-1 flex items-center justify-center p-2 min-h-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)] transition-transform duration-200 group-hover:scale-105 pointer-events-none"
          />
        ) : (
          image
        )}
        {children}
      </div>

      {/* Typography Label */}
      {(title || subtitle) && (
        <div className="w-full text-center pt-2 border-t border-slate-100 dark:border-slate-700/60 shrink-0">
          {title && (
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white capitalize tracking-tight leading-tight truncate">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
});
