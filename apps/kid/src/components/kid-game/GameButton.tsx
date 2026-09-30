// ============================================================================
// GAME BUTTON — TACTILE 3D MOBILE-READY BUTTON
// 44px+ touch target • GPU active translation • Sound integrated • Zero layout jump
// ============================================================================

import React, { memo } from 'react';
import { soundManager } from '../../services/sound/KidsSoundManager';

export type GameButtonVariant = 'primary' | 'secondary' | 'amber' | 'danger' | 'ghost' | 'icon';

interface GameButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GameButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children?: React.ReactNode;
  playSound?: boolean;
}

export const GameButton: React.FC<GameButtonProps> = memo(({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  playSound = true,
  className = '',
  onClick,
  disabled,
  ...rest
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (playSound) soundManager.playPop();
    if (onClick) onClick(e);
  };

  const baseStyles =
    'relative inline-flex items-center justify-center font-black tracking-wide rounded-2xl select-none cursor-pointer transition-all duration-150 touch-manipulation active:translate-y-1 focus:outline-none';

  const sizeStyles = {
    sm: 'min-h-[40px] px-3.5 py-1.5 text-xs gap-1.5',
    md: 'min-h-[48px] px-5 py-2.5 text-sm sm:text-base gap-2',
    lg: 'min-h-[56px] px-7 py-3 text-base sm:text-lg gap-2.5',
  }[size];

  const variantStyles = {
    primary:
      'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-[0_5px_0_#059669,0_8px_16px_rgba(5,150,105,0.3)] hover:brightness-105 active:shadow-[0_2px_0_#059669]',
    secondary:
      'bg-gradient-to-b from-sky-400 to-sky-600 text-white shadow-[0_5px_0_#0284c7,0_8px_16px_rgba(2,132,199,0.3)] hover:brightness-105 active:shadow-[0_2px_0_#0284c7]',
    amber:
      'bg-gradient-to-b from-amber-400 to-amber-500 text-amber-950 shadow-[0_5px_0_#d97706,0_8px_16px_rgba(217,119,6,0.3)] hover:brightness-105 active:shadow-[0_2px_0_#d97706]',
    danger:
      'bg-gradient-to-b from-rose-400 to-rose-600 text-white shadow-[0_5px_0_#e11d48,0_8px_16px_rgba(225,29,72,0.3)] hover:brightness-105 active:shadow-[0_2px_0_#e11d48]',
    ghost:
      'bg-white/15 hover:bg-white/25 active:bg-white/30 text-slate-800 dark:text-white border border-white/20 backdrop-blur-xs shadow-xs',
    icon:
      'min-w-[44px] min-h-[44px] p-2.5 rounded-full bg-white/20 hover:bg-white/35 active:scale-95 text-slate-800 dark:text-white border border-white/30 backdrop-blur-xs shadow-xs',
  }[variant];

  const disabledStyles = disabled
    ? 'opacity-50 cursor-not-allowed pointer-events-none shadow-none transform-none'
    : '';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`${baseStyles} ${variant === 'icon' ? 'min-w-[44px] min-h-[44px] p-2.5 rounded-full' : sizeStyles} ${variantStyles} ${disabledStyles} ${className}`}
      {...rest}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
});
