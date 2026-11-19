import React from 'react';
import { ARENA_THEME } from '../../arena/arenaTheme';

export type AvatarTier = 'bronze' | 'silver' | 'gold' | 'diamond' | 'champion';

export interface PlayerAvatarProps {
  avatarUrl?: string | null;
  displayName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  tier?: AvatarTier;
  level?: number;
  isEliminated?: boolean;
  className?: string;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  avatarUrl,
  displayName = 'Player',
  size = 'md',
  tier = 'bronze',
  level,
  isEliminated = false,
  className = '',
}) => {
  const sizeMap = {
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

  return (
    <div className={`relative inline-block shrink-0 select-none ${className}`}>
      <div
        className={`rounded-2xl overflow-hidden bg-[#19213A] flex items-center justify-center font-black text-white ${
          sizeMap[size]
        } ${ringMap[tier]} ${isEliminated ? 'grayscale opacity-50' : ''}`}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <span>{initial}</span>
        )}
      </div>

      {/* Level Tag */}
      {typeof level === 'number' && (
        <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-[#2041F6] text-[9px] font-black text-white border border-[#8B75FF] shadow-xs">
          Lv.{level}
        </span>
      )}

      {/* Eliminated indicator */}
      {isEliminated && (
        <span className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center text-[10px] font-black text-rose-400">
          OUT
        </span>
      )}
    </div>
  );
};
