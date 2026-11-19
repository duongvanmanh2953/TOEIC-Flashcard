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
              <span className="absolute -top-2 -left-1.5 w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950 font-black text-[10px] sm:text-xs flex items-center justify-center border-2 border-slate-900 shadow-md">
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
            <div className="w-full h-20 sm:h-28 mt-2 rounded-t-2xl bg-gradient-to-t from-slate-950 via-slate-900/90 to-slate-700/50 border-t-2 border-x-2 border-slate-400/60 shadow-lg shadow-slate-900/60 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-slate-300/15 to-transparent pointer-events-none" />
              <span className="text-[9px] sm:text-xs font-bold text-slate-300 uppercase tracking-widest">Á QUÂN</span>
              <span className="text-xl sm:text-3xl font-black text-slate-200 font-mono tracking-wider drop-shadow">2ND</span>
            </div>
          </div>
        ) : validPlayers.length >= 2 ? (
          <div className="flex-1 max-w-[105px] sm:max-w-[180px]" />
        ) : null}

        {/* ---------------------------------------------------- */}
        {/* RANK 1: GOLD QUÁN QUÂN (CENTER, HIGHEST DAIS)        */}
        {/* ---------------------------------------------------- */}
        {p1 && (
          <div className="flex flex-col items-center flex-1 max-w-[125px] sm:max-w-[210px] animate-fade-in z-10 group">
            <div className="relative mb-2.5">
              {/* Luminous Grand Aura */}
              <div className="absolute -inset-2.5 sm:-inset-4 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-orange-500 opacity-60 blur-md animate-pulse" />
              <ArenaIconCrown className="w-7 h-7 sm:w-10 sm:h-10 text-amber-300 absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 drop-shadow-[0_0_15px_rgba(251,191,36,0.9)] animate-bounce" />
              <PlayerAvatar
                avatarUrl={p1.avatar}
                displayName={p1.name}
                size="md"
                tier="gold"
                level={p1.level}
                className="w-14 h-14 sm:w-20 sm:h-20"
              />
              <span className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center border-2 border-slate-900 shadow-xl">
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
            <div className="w-full h-28 sm:h-40 mt-2 rounded-t-2xl bg-gradient-to-t from-slate-950 via-amber-950/80 to-amber-500/40 border-t-2 border-x-2 border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.4)] flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-amber-400/25 to-transparent pointer-events-none" />
              <span className="text-[10px] sm:text-xs font-black text-amber-300 uppercase tracking-widest drop-shadow">VÔ ĐỊCH</span>
              <span className="text-2xl sm:text-4xl font-black text-amber-200 font-mono tracking-wider drop-shadow-[0_2px_15px_rgba(251,191,36,0.8)]">1ST</span>
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
              <span className="absolute -top-2 -right-1.5 w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-white font-black text-[10px] sm:text-xs flex items-center justify-center border-2 border-slate-900 shadow-md">
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
            <div className="w-full h-16 sm:h-24 mt-2 rounded-t-2xl bg-gradient-to-t from-slate-950 via-[#271207]/90 to-amber-700/50 border-t-2 border-x-2 border-amber-600/60 shadow-lg shadow-amber-950/60 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-amber-700/20 to-transparent pointer-events-none" />
              <span className="text-[9px] sm:text-xs font-bold text-amber-400 uppercase tracking-widest">HẠNG BA</span>
              <span className="text-xl sm:text-3xl font-black text-amber-300 font-mono tracking-wider drop-shadow">3RD</span>
            </div>
          </div>
        ) : validPlayers.length >= 3 ? (
          <div className="flex-1 max-w-[105px] sm:max-w-[180px]" />
        ) : null}
      </div>
    </div>
  );
};
