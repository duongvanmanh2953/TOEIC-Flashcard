import React from 'react';
import { ARENA_THEME } from '../../arena/arenaTheme';
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

export const ArenaPodium: React.FC<ArenaPodiumProps> = ({ topPlayers, className = '' }) => {
  const p1 = topPlayers[0];
  const p2 = topPlayers[1];
  const p3 = topPlayers[2];

  return (
    <div className={`w-full py-6 flex items-end justify-center gap-3 sm:gap-6 select-none ${className}`}>
      {/* Rank 2 (Silver - Left) */}
      {p2 ? (
        <div className="flex flex-col items-center flex-1 max-w-[130px] sm:max-w-[170px] animate-fade-in group">
          <div className="relative mb-2">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-slate-400 to-slate-200 opacity-40 blur-sm group-hover:opacity-75 transition" />
            <PlayerAvatar
              avatarUrl={p2.avatar}
              displayName={p2.name}
              size="md"
              tier="silver"
              level={p2.level}
            />
            <span className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950 font-black text-xs flex items-center justify-center border-2 border-slate-900 shadow-md">
              🥈 2
            </span>
          </div>

          <span className="text-xs sm:text-sm font-bold text-slate-100 truncate w-full text-center tracking-tight">
            {p2.name}
          </span>
          <span className="text-xs font-black text-slate-300 tabular-nums font-mono">
            {p2.score.toLocaleString()} XP
          </span>

          {/* Pedestal */}
          <div className="w-full h-24 sm:h-28 mt-2 rounded-t-2xl bg-gradient-to-t from-slate-950 via-slate-900/90 to-slate-700/40 border-t-2 border-x-2 border-slate-400/50 shadow-lg shadow-slate-900/50 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-radial-gradient from-slate-300/10 to-transparent pointer-events-none" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Á Quân</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-200 font-mono tracking-wider drop-shadow">2ND</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 max-w-[130px] sm:max-w-[170px]" />
      )}

      {/* Rank 1 (Gold Champion - Center, Highest) */}
      {p1 && (
        <div className="flex flex-col items-center flex-1 max-w-[160px] sm:max-w-[210px] animate-fade-in z-10 group">
          <div className="relative mb-2.5">
            {/* Luminous Champion Aura */}
            <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-orange-500 opacity-60 blur-md animate-pulse" />
            <ArenaIconCrown className="w-8 h-8 sm:w-10 sm:h-10 text-amber-300 absolute -top-6 left-1/2 -translate-x-1/2 drop-shadow-[0_0_15px_rgba(251,191,36,0.9)] animate-bounce" />
            <PlayerAvatar
              avatarUrl={p1.avatar}
              displayName={p1.name}
              size="lg"
              tier="gold"
              level={p1.level}
            />
            <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center border-2 border-slate-900 shadow-xl">
              👑 1
            </span>
          </div>

          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-[10px] font-black text-amber-300 uppercase tracking-wider mb-0.5">
            <span>QUÁN QUÂN MVP</span>
          </div>

          <span className="text-sm sm:text-base font-black text-white truncate w-full text-center tracking-tight drop-shadow-sm">
            {p1.name}
          </span>
          <span className="text-sm font-black text-amber-400 tabular-nums font-mono drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]">
            {p1.score.toLocaleString()} XP
          </span>

          {p1.streak && p1.streak >= 2 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-400 pt-0.5">
              <ArenaIconFlame className="w-3.5 h-3.5 fill-rose-500" />
              <span>Streak {p1.streak}x</span>
            </span>
          )}

          {/* Pedestal */}
          <div className="w-full h-32 sm:h-40 mt-2 rounded-t-2xl bg-gradient-to-t from-slate-950 via-amber-950/40 to-amber-500/30 border-t-2 border-x-2 border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.35)] flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-radial-gradient from-amber-400/20 to-transparent pointer-events-none" />
            <ArenaIconTrophy className="w-7 h-7 text-amber-400 mb-0.5 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            <span className="text-xs font-bold text-amber-300 uppercase tracking-widest">Vô Địch</span>
            <span className="text-2xl sm:text-4xl font-black text-amber-300 font-mono tracking-wider drop-shadow-md">1ST</span>
          </div>
        </div>
      )}

      {/* Rank 3 (Bronze - Right) */}
      {p3 ? (
        <div className="flex flex-col items-center flex-1 max-w-[130px] sm:max-w-[170px] animate-fade-in group">
          <div className="relative mb-2">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-700 to-amber-900 opacity-40 blur-sm group-hover:opacity-75 transition" />
            <PlayerAvatar
              avatarUrl={p3.avatar}
              displayName={p3.name}
              size="md"
              tier="bronze"
              level={p3.level}
            />
            <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-white font-black text-xs flex items-center justify-center border-2 border-slate-900 shadow-md">
              🥉 3
            </span>
          </div>

          <span className="text-xs sm:text-sm font-bold text-slate-100 truncate w-full text-center tracking-tight">
            {p3.name}
          </span>
          <span className="text-xs font-black text-amber-500 tabular-nums font-mono">
            {p3.score.toLocaleString()} XP
          </span>

          {/* Pedestal */}
          <div className="w-full h-20 sm:h-24 mt-2 rounded-t-2xl bg-gradient-to-t from-slate-950 via-slate-900/90 to-amber-900/30 border-t-2 border-x-2 border-amber-700/50 shadow-lg shadow-slate-900/50 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-radial-gradient from-amber-700/10 to-transparent pointer-events-none" />
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Hạng Ba</span>
            <span className="text-xl sm:text-2xl font-black text-amber-500 font-mono tracking-wider drop-shadow">3RD</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 max-w-[130px] sm:max-w-[170px]" />
      )}
    </div>
  );
};
