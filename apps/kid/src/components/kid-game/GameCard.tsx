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

  // State-specific styling using the new 3D Claymorphism system
  const stateStyles = {
    idle:
      'toy-game-card',
    selected:
      'toy-game-card is-selected',
    correct:
      'toy-game-card is-correct animate-[pulse_1.5s_ease-in-out]',
    wrong:
      'toy-game-card is-wrong',
    disabled:
      'bg-slate-100 border-2 border-slate-200 opacity-50 cursor-not-allowed pointer-events-none shadow-none',
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
      className={`relative p-4 sm:p-5 flex flex-col items-center justify-between select-none cursor-pointer transition-all duration-200 ease-out touch-manipulation overflow-hidden ${aspectClass} ${stateStyles} ${className}`}
      style={{ willChange: 'transform' }}
    >
      {/* State Badge Icon (Top-Right) */}
      {state === 'correct' && (
        <div className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-slate-900 animate-scaleUp">
          <CheckCircle2 className="w-5 h-5 stroke-[3]" />
        </div>
      )}
      {state === 'wrong' && (
        <div className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md border-2 border-slate-900 animate-scaleUp">
          <XCircle className="w-5 h-5 stroke-[3]" />
        </div>
      )}

      {/* Main 3D Kawaii Image Area */}
      <div className="relative z-10 w-full flex-1 flex items-center justify-center p-2 min-h-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.22)] transition-transform duration-200 group-hover:scale-105 pointer-events-none"
          />
        ) : (
          image
        )}
        {children}
      </div>

      {/* High Contrast Typography Label with Solid Border */}
      {(title || subtitle) && (
        <div className="relative z-10 w-full text-center pt-2.5 mt-1 border-t-2 border-slate-900 shrink-0 bg-slate-50/70 -mx-4 -mb-4 px-4 py-2">
          {title && (
            <h3 className="text-base sm:text-lg font-black text-slate-950 capitalize tracking-tight leading-tight truncate">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs sm:text-sm font-black text-slate-700 truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
});
