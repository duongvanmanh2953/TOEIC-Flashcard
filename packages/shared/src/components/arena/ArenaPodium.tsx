import React from 'react';
import { PlayerAvatar } from './PlayerAvatar';
import { ArenaIconCrown, ArenaIconFlame, ArenaIconTrophy } from './ArenaIcons';

export interface LeaderboardPlayer {
  id: string;
  name: string;
  avatar?: string | null;
  score: number;
  streak?: number;
  rank?: number;
  rankDelta?: number; // e.g. +2 (moved up), -1 (moved down), 0
  level?: number;
}

export interface ArenaPodiumProps {
  topPlayers: LeaderboardPlayer[]; // [Rank1, Rank2, Rank3]
  className?: string;
}

/**
 * Tier-specific mini championship cups for the podium steps
 */
export const PodiumTrophyCup: React.FC<{
  tier: 'gold' | 'silver' | 'bronze';
  className?: string;
  size?: number;
}> = ({ tier, className = '', size = 24 }) => {
  const config = {
    gold: {
      id: 'sharedPodiumGold',
      stop1: '#FFFDE7',
      stop2: '#FDE047',
      stop3: '#EAB308',
      stop4: '#A16207',
      rim: '#FEF08A',
      star: '#FFFBEB',
      glow: 'rgba(250, 204, 21, 0.85)',
      num: '1',
    },
    silver: {
      id: 'sharedPodiumSilver',
      stop1: '#FFFFFF',
      stop2: '#E2E8F0',
      stop3: '#94A3B8',
      stop4: '#475569',
      rim: '#F8FAFC',
      star: '#FFFFFF',
      glow: 'rgba(226, 232, 240, 0.75)',
      num: '2',
    },
    bronze: {
      id: 'sharedPodiumBronze',
      stop1: '#FFEDD5',
      stop2: '#FB923C',
      stop3: '#D97706',
      stop4: '#7C2D12',
      rim: '#FED7AA',
      star: '#FFF7ED',
      glow: 'rgba(217, 119, 6, 0.7)',
      num: '3',
    },
  }[tier];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-[0_4px_10px_${config.glow}] ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${config.id}_body`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={config.stop1} />
          <stop offset="30%" stopColor={config.stop2} />
          <stop offset="70%" stopColor={config.stop3} />
          <stop offset="100%" stopColor={config.stop4} />
        </linearGradient>
        <linearGradient id={`${config.id}_handle`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={config.stop1} />
          <stop offset="100%" stopColor={config.stop4} />
        </linearGradient>
      </defs>

      <path
        d="M20 18 C11 18 9 32 19 35 C19.5 35 20 33.5 19.5 32 C13 30 14 21 21 21 Z"
        fill={`url(#${config.id}_handle)`}
      />
      <path
        d="M44 18 C53 18 55 32 45 35 C44.5 35 44 33.5 44.5 32 C51 30 50 21 43 21 Z"
        fill={`url(#${config.id}_handle)`}
      />

      <path
        d="M18 14 H46 C46 14 47 30 32 38 C17 30 18 14 18 14 Z"
        fill={`url(#${config.id}_body)`}
        stroke={config.rim}
        strokeWidth="1"
      />

      <ellipse cx="32" cy="14" rx="14" ry="3.5" fill={config.rim} />
      <ellipse cx="32" cy="14" rx="11" ry="2" fill={config.stop4} opacity="0.6" />

      <path d="M29 37 H35 L34 46 H30 Z" fill={`url(#${config.id}_body)`} />

      <ellipse cx="32" cy="46" rx="8" ry="2.5" fill={config.rim} />
      <path d="M25 47 L39 47 L41 54 L23 54 Z" fill={`url(#${config.id}_body)`} stroke={config.rim} strokeWidth="0.8" />
      <rect x="21" y="54" width="22" height="3" rx="1.5" fill="#1E293B" stroke={config.stop3} strokeWidth="0.8" />

      <circle cx="32" cy="24" r="5" fill="#0F172A" opacity="0.45" />
      <text
        x="32"
        y="27"
        textAnchor="middle"
        fontSize="8"
        fontWeight="900"
        fill={config.star}
        fontFamily="sans-serif"
      >
        {config.num}
      </text>
    </svg>
  );
};

export const ArenaPodium: React.FC<ArenaPodiumProps> = ({ topPlayers, className = '' }) => {
  const validPlayers = (topPlayers || []).filter(Boolean);
  const p1 = validPlayers[0] || null;
  const p2 = validPlayers[1] || null;
  const p3 = validPlayers[2] || null;

  if (!p1) {
    return (
      <div className="py-8 text-center text-slate-500 text-xs italic">
        Chưa có dữ liệu người chiến thắng.
      </div>
    );
  }

  return (
    <div className={`w-full py-3 sm:py-6 select-none ${className}`}>
      {/* ======================================================== */}
      {/* UNIFIED GRAND ESPORTS PODIUM (MOBILE & DESKTOP)          */}
      {/* ======================================================== */}
      <div className="flex items-end justify-center gap-1.5 sm:gap-6 py-2 px-1 max-w-2xl mx-auto">
        {/* ---------------------------------------------------- */}
        {/* RANK 2: SILVER Á QUÂN (LEFT)                         */}
        {/* ---------------------------------------------------- */}
        {p2 ? (
          <div className="flex flex-col items-center flex-1 max-w-[105px] sm:max-w-[180px] animate-fade-in group">
            <div className="relative mb-2">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-slate-400 to-slate-200 opacity-30 blur-sm group-hover:opacity-75 transition" />
              <PlayerAvatar
                avatarUrl={p2.avatar}
                displayName={p2.name}
                size="sm"
                tier="silver"
                level={p2.level}
                className="w-11 h-11 sm:w-16 sm:h-16"
              />
              <span className="absolute -top-1.5 -right-2 z-20">
                <PodiumTrophyCup tier="silver" size={20} className="sm:w-6 sm:h-6" />
              </span>
              <span className="absolute -bottom-1 -left-1 w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950 font-black text-[10px] sm:text-xs flex items-center justify-center border-2 border-slate-900 shadow-md z-20">
                🥈 2
              </span>
            </div>

            <span className="text-[11px] sm:text-sm font-bold text-slate-100 truncate w-full text-center tracking-tight">
              {p2.name}
            </span>
            <span className="text-[10px] sm:text-xs font-black text-slate-300 tabular-nums font-mono">
              {p2.score.toLocaleString()} XP
            </span>

            {/* Silver Pedestal Step */}
            <div className="w-full h-20 sm:h-28 mt-2 rounded-t-2xl bg-gradient-to-t from-slate-950 via-slate-900/90 to-slate-800/80 border-t-3 sm:border-t-4 border-x border-slate-300/80 shadow-lg shadow-slate-900/60 flex flex-col items-center justify-center relative overflow-hidden py-1.5 sm:py-2">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-radial-gradient from-slate-300/15 to-transparent pointer-events-none" />
              <span className="text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-300 font-mono tracking-wider drop-shadow">2ND</span>
              <span className="text-[9px] sm:text-xs font-black text-slate-300 uppercase tracking-widest mt-0.5">Á QUÂN</span>
            </div>
          </div>
        ) : validPlayers.length >= 2 ? (
          <div className="flex-1 max-w-[105px] sm:max-w-[180px]" />
        ) : null}

        {/* ---------------------------------------------------- */}
        {/* RANK 1: GOLD QUÁN QUÂN (CENTER, HIGHEST DAIS)        */}
        {/* ---------------------------------------------------- */}
        {p1 && (
          <div className="flex flex-col items-center flex-1 max-w-[125px] sm:max-w-[210px] animate-fade-in z-10 group -mt-4 sm:-mt-6">
            <div className="relative mb-2.5">
              {/* Luminous Grand Aura */}
              <div className="absolute -inset-2.5 sm:-inset-4 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-orange-500 opacity-60 blur-md animate-pulse" />
              <ArenaIconCrown className="w-7 h-7 sm:w-10 sm:h-10 text-amber-300 absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2 drop-shadow-[0_0_15px_rgba(251,191,36,0.9)] animate-bounce z-20 pointer-events-none" />
              <PlayerAvatar
                avatarUrl={p1.avatar}
                displayName={p1.name}
                size="md"
                tier="gold"
                level={p1.level}
                className="w-14 h-14 sm:w-20 sm:h-20"
              />
              <span className="absolute -top-2 -right-2.5 z-20">
                <PodiumTrophyCup tier="gold" size={24} className="sm:w-8 sm:h-8" />
              </span>
              <span className="absolute -bottom-1 -left-1 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center border-2 border-slate-900 shadow-xl z-20">
                👑 1
              </span>
            </div>

            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-[9px] sm:text-[10px] font-black text-amber-300 uppercase tracking-wider mb-0.5 shadow-sm">
              <span>QUÁN QUÂN</span>
            </div>

            <span className="text-xs sm:text-base font-black text-white truncate w-full text-center tracking-tight drop-shadow-sm">
              {p1.name}
            </span>
            <span className="text-xs sm:text-sm font-black text-amber-400 tabular-nums font-mono drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]">
              {p1.score.toLocaleString()} XP
            </span>

            {/* Gold Champion Pedestal Step */}
            <div className="w-full h-32 sm:h-44 mt-2 rounded-t-2xl bg-gradient-to-t from-slate-950 via-amber-950/80 to-amber-900/50 border-t-4 border-x border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.5)] flex flex-col items-center justify-center relative overflow-hidden py-1.5 sm:py-2">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-yellow-200 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-radial-gradient from-amber-400/25 to-transparent pointer-events-none" />
              <span className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-amber-300 to-amber-500 font-mono tracking-wider drop-shadow-[0_2px_15px_rgba(251,191,36,0.8)]">1ST</span>
              <span className="text-[10px] sm:text-xs font-black text-amber-300 uppercase tracking-widest mt-0.5 drop-shadow">VÔ ĐỊCH</span>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* RANK 3: BRONZE HẠNG 3 (RIGHT)                        */}
        {/* ---------------------------------------------------- */}
        {p3 ? (
          <div className="flex flex-col items-center flex-1 max-w-[105px] sm:max-w-[180px] animate-fade-in group">
            <div className="relative mb-2">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-700 to-amber-500 opacity-30 blur-sm group-hover:opacity-75 transition" />
              <PlayerAvatar
                avatarUrl={p3.avatar}
                displayName={p3.name}
                size="sm"
                tier="bronze"
                level={p3.level}
                className="w-11 h-11 sm:w-16 sm:h-16"
              />
              <span className="absolute -top-1.5 -right-2 z-20">
                <PodiumTrophyCup tier="bronze" size={20} className="sm:w-6 sm:h-6" />
              </span>
              <span className="absolute -bottom-1 -left-1 w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-white font-black text-[10px] sm:text-xs flex items-center justify-center border-2 border-slate-900 shadow-md z-20">
                🥉 3
              </span>
            </div>

            <span className="text-[11px] sm:text-sm font-bold text-slate-100 truncate w-full text-center tracking-tight">
              {p3.name}
            </span>
            <span className="text-[10px] sm:text-xs font-black text-amber-500 tabular-nums font-mono">
              {p3.score.toLocaleString()} XP
            </span>

            {/* Bronze Pedestal Step */}
            <div className="w-full h-14 sm:h-20 mt-2 rounded-t-2xl bg-gradient-to-t from-slate-950 via-[#271207]/90 to-amber-900/50 border-t-3 sm:border-t-4 border-x border-amber-600/80 shadow-lg shadow-amber-950/60 flex flex-col items-center justify-center relative overflow-hidden py-1.5 sm:py-2">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-300/60 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-radial-gradient from-amber-700/20 to-transparent pointer-events-none" />
              <span className="text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-400 to-amber-600 font-mono tracking-wider drop-shadow">3RD</span>
              <span className="text-[9px] sm:text-xs font-black text-amber-400 uppercase tracking-widest mt-0.5">HẠNG 3</span>
            </div>
          </div>
        ) : validPlayers.length >= 3 ? (
          <div className="flex-1 max-w-[105px] sm:max-w-[180px]" />
        ) : null}
      </div>
    </div>
  );
};
