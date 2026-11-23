import React from 'react';
import { ARENA_THEME } from '../../arena/arenaTheme';

export type AvatarTier = 'bronze' | 'silver' | 'gold' | 'diamond' | 'champion';

export interface PlayerAvatarProps {
  avatarUrl?: string | null;
  displayName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  tier?: AvatarTier;
  level?: number;
  isEliminated?: boolean;
  className?: string;
  shape?: 'circle' | 'squircle';
}

const getInitialColor = (name: string = '') => {
  const gradients = [
    'from-indigo-600 to-violet-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-sky-500 to-blue-600',
    'from-purple-600 to-fuchsia-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  avatarUrl,
  displayName = 'Player',
  size = 'md',
  tier,
  level,
  isEliminated = false,
  className = '',
  shape = 'circle',
}) => {
  const sizeMap = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  };

  const ringMap: Record<AvatarTier, string> = {
    bronze: 'ring-2 ring-[#CD7F32]',
    silver: 'ring-2 ring-slate-300 shadow-[0_0_10px_rgba(203,213,225,0.4)]',
    gold: 'ring-2 ring-[#F6C453] shadow-[0_0_15px_rgba(246,196,83,0.5)]',
    diamond: 'ring-2 ring-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.6)]',
    champion: 'ring-3 ring-[#8B75FF] shadow-[0_0_20px_rgba(139,117,255,0.7)] animate-pulse',
  };

  const initial = displayName ? displayName.trim().charAt(0).toUpperCase() : 'P';
  const hasRealAvatar = Boolean(avatarUrl && avatarUrl.trim().length > 0);
  const gradientClass = getInitialColor(displayName);
  const roundedClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';
  const hasCustomDimension = className.includes('w-') && className.includes('h-');

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${
        hasCustomDimension ? className : `${sizeMap[size] || sizeMap.md} ${className}`
      }`}
    >
      <div
        className={`w-full h-full ${roundedClass} overflow-hidden bg-[#19213A] flex items-center justify-center font-black text-white ${
          tier ? ringMap[tier] : ''
        } ${isEliminated ? 'grayscale opacity-50' : ''}`}
      >
        {hasRealAvatar ? (
          <img
            src={avatarUrl!}
            alt={displayName}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
              const fallback = (e.target as HTMLElement).parentElement?.querySelector('.avatar-initial-fallback');
              if (fallback) (fallback as HTMLElement).classList.remove('hidden');
            }}
          />
        ) : null}
        <span
          className={`avatar-initial-fallback w-full h-full flex items-center justify-center font-black text-white bg-gradient-to-br ${gradientClass} ${
            hasRealAvatar ? 'hidden' : ''
          }`}
        >
          {initial}
        </span>
      </div>

      {/* Level Tag */}
      {typeof level === 'number' && (
        <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-[#2041F6] text-[9px] font-black text-white border border-[#8B75FF] shadow-xs pointer-events-none z-10">
          Lv.{level}
        </span>
      )}

      {/* Eliminated indicator */}
      {isEliminated && (
        <span className={`absolute inset-0 ${roundedClass} bg-black/60 flex items-center justify-center text-[10px] font-black text-rose-400 z-10`}>
          OUT
        </span>
      )}
    </div>
  );
};
