import React from 'react';
import { Crown, Trophy, Star, Users, CheckCircle2, MessageSquare } from 'lucide-react';

export interface BangVangPlayer {
  rank: number;
  displayName: string;
  avatar?: string;
  score: number;
  isCurrentUser?: boolean;
}

export interface ArenaBangVangCeremonyProps {
  topPlayers?: BangVangPlayer[];
  totalPlayersCount?: string | number;
  accuracyRate?: string | number;
  correctCommentsCount?: string | number;
  showTable4To10?: boolean;
  className?: string;
}

export const ArenaBangVangCeremony: React.FC<ArenaBangVangCeremonyProps> = ({
  topPlayers = [],
  totalPlayersCount = '1.2K',
  accuracyRate = '78%',
  correctCommentsCount = '642',
  showTable4To10 = true,
  className = '',
}) => {
  // Ensure top 3 players exist with fallback mock data matching reference
  const p1 = topPlayers.find((p) => p.rank === 1) || {
    rank: 1,
    displayName: 'Player123',
    score: 12850,
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=p1',
  };
  const p2 = topPlayers.find((p) => p.rank === 2) || {
    rank: 2,
    displayName: 'GameMaster',
    score: 11720,
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=p2',
  };
  const p3 = topPlayers.find((p) => p.rank === 3) || {
    rank: 3,
    displayName: 'QuizStar',
    score: 10930,
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=p3',
  };

  // Top 4 to 10 list
  const ranks4to10: BangVangPlayer[] =
    topPlayers.filter((p) => p.rank >= 4 && p.rank <= 10).length >= 4
      ? topPlayers.filter((p) => p.rank >= 4 && p.rank <= 10)
      : [4, 5, 6, 7, 8, 9, 10].map((r) => {
          const found = topPlayers.find((p) => p.rank === r);
          return (
            found || {
              rank: r,
              displayName: `Học viên #${r}`,
              score: 12345 - (r - 4) * 320,
              avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=rank${r}`,
            }
          );
        });

  return (
    <div
      className={`relative w-full overflow-hidden flex flex-col items-center justify-start text-white select-none ${className}`}
    >
      {/* ======================================================== */}
      {/* 1. TOP RIBBON BANNER: 👑 BẢNG VÀNG 👑                     */}
      {/* ======================================================== */}
      <div className="relative z-10 pt-2 pb-1 flex flex-col items-center">
        {/* Ribbon Shape Container */}
        <div className="relative inline-flex items-center justify-center px-8 sm:px-14 py-2 sm:py-3 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 border-2 border-amber-400/80 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.5)]">
          {/* Gold Star Left */}
          <Star className="w-5 h-5 text-amber-400 fill-amber-400 mr-2 drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]" />

          {/* Ribbon Title */}
          <h1 className="font-black text-xl sm:text-3xl tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-yellow-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] uppercase">
            BẢNG VÀNG
          </h1>

          {/* Gold Star Right */}
          <Star className="w-5 h-5 text-amber-400 fill-amber-400 ml-2 drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]" />

          {/* Ribbon tail wing decor */}
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-3 h-5 bg-purple-950 border-l border-y border-amber-400/60 rounded-l" />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-3 h-5 bg-purple-950 border-r border-y border-amber-400/60 rounded-r" />
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MAJESTIC GOLDEN TROPHY CUP CENTERPIECE                */}
      {/* ======================================================== */}
      <div className="relative z-10 -mt-2 flex flex-col items-center">
        {/* God-ray light bloom behind trophy */}
        <div className="absolute -top-10 w-48 h-48 bg-amber-400/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-32 h-32 sm:w-44 sm:h-44 flex items-center justify-center">
          <img
            src="/game-assets/arena/gold-trophy-cup.png"
            alt="Gold Championship Trophy"
            className="w-full h-full object-contain filter drop-shadow-[0_0_25px_rgba(245,158,11,0.7)]"
            onError={(e) => {
              // Graceful SVG fallback if PNG loading fails
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. 3D TIERED PODIUM (RANK 2 - RANK 1 - RANK 3)           */}
      {/* ======================================================== */}
      <div className="relative z-10 w-full max-w-xl mx-auto px-2 -mt-4 grid grid-cols-3 gap-2 sm:gap-4 items-end">
        {/* RANK 2: SILVER PODIUM (LEFT) */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-2">
            <Crown className="w-5 h-5 text-slate-300 fill-slate-300 absolute -top-4 left-1/2 -translate-x-1/2 drop-shadow" />
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-slate-300 shadow-xl overflow-hidden bg-slate-800">
              <img
                src={p2.avatar}
                alt={p2.displayName}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-black text-xs flex items-center justify-center shadow-lg">
              2
            </span>
          </div>

          {/* Name & Score pill */}
          <div className="w-full py-1.5 px-2 rounded-xl bg-slate-900/90 border border-slate-500/40 shadow-md">
            <span className="font-bold text-xs text-white truncate block">
              {p2.displayName}
            </span>
            <span className="font-mono font-black text-xs text-amber-300 flex items-center justify-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>{p2.score.toLocaleString()}</span>
            </span>
          </div>

          {/* Silver Tier Pedestal */}
          <div className="w-full h-20 sm:h-24 mt-2 rounded-t-2xl bg-gradient-to-t from-slate-900 via-slate-800 to-slate-700/80 border-t-2 border-slate-400 shadow-lg flex flex-col items-center justify-center">
            <span className="font-black font-mono text-2xl text-slate-300">2</span>
          </div>
        </div>

        {/* RANK 1: GOLD PODIUM (CENTER ELEVATED) */}
        <div className="flex flex-col items-center text-center -mt-6">
          <div className="relative mb-2">
            <Crown className="w-7 h-7 text-amber-400 fill-amber-400 absolute -top-6 left-1/2 -translate-x-1/2 animate-bounce drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-3 border-amber-400 shadow-2xl ring-4 ring-amber-400/40 overflow-hidden bg-slate-800">
              <img
                src={p1.avatar}
                alt={p1.displayName}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-xl">
              1
            </span>
          </div>

          {/* Name & Score pill */}
          <div className="w-full py-2 px-2.5 rounded-xl bg-slate-900/95 border border-amber-400/60 shadow-xl shadow-amber-500/20">
            <span className="font-black text-xs sm:text-sm text-white truncate block">
              {p1.displayName}
            </span>
            <span className="font-mono font-black text-xs sm:text-sm text-amber-400 flex items-center justify-center gap-1 drop-shadow">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{p1.score.toLocaleString()}</span>
            </span>
          </div>

          {/* Gold Tier Pedestal */}
          <div className="w-full h-28 sm:h-32 mt-2 rounded-t-2xl bg-gradient-to-t from-amber-950/80 via-amber-800/80 to-amber-500/80 border-t-4 border-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.5)] flex flex-col items-center justify-center">
            <span className="font-black font-mono text-3xl text-amber-200">1</span>
          </div>
        </div>

        {/* RANK 3: BRONZE PODIUM (RIGHT) */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-2">
            <Crown className="w-5 h-5 text-amber-700 fill-amber-700 absolute -top-4 left-1/2 -translate-x-1/2 drop-shadow" />
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-amber-700 shadow-xl overflow-hidden bg-slate-800">
              <img
                src={p3.avatar}
                alt={p3.displayName}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow-lg">
              3
            </span>
          </div>

          {/* Name & Score pill */}
          <div className="w-full py-1.5 px-2 rounded-xl bg-slate-900/90 border border-amber-700/50 shadow-md">
            <span className="font-bold text-xs text-white truncate block">
              {p3.displayName}
            </span>
            <span className="font-mono font-black text-xs text-amber-300 flex items-center justify-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>{p3.score.toLocaleString()}</span>
            </span>
          </div>

          {/* Bronze Tier Pedestal */}
          <div className="w-full h-16 sm:h-20 mt-2 rounded-t-2xl bg-gradient-to-t from-slate-900 via-amber-950/60 to-amber-800/60 border-t-2 border-amber-600 shadow-lg flex flex-col items-center justify-center">
            <span className="font-black font-mono text-xl text-amber-400">3</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. SUMMARY STATS PILLS (FROM USER DESIGN IMAGE 2)        */}
      {/* ======================================================== */}
      <div className="relative z-10 w-full max-w-xl mx-auto px-3 mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        {/* Pill 1: Người chơi 1.2K */}
        <div className="flex items-center justify-center gap-2 py-2 px-2 rounded-2xl bg-slate-900/90 border border-indigo-500/30 backdrop-blur-md shadow-lg">
          <div className="w-7 h-7 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="min-w-0 text-left">
            <span className="text-[10px] text-slate-400 block truncate">Người chơi</span>
            <span className="font-black font-mono text-xs sm:text-sm text-white block truncate">
              {totalPlayersCount}
            </span>
          </div>
        </div>

        {/* Pill 2: Trả lời đúng 78% */}
        <div className="flex items-center justify-center gap-2 py-2 px-2 rounded-2xl bg-slate-900/90 border border-emerald-500/30 backdrop-blur-md shadow-lg">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0 text-left">
            <span className="text-[10px] text-slate-400 block truncate">Trả lời đúng</span>
            <span className="font-black font-mono text-xs sm:text-sm text-emerald-400 block truncate">
              {accuracyRate}
            </span>
          </div>
        </div>

        {/* Pill 3: Comment đúng 642 */}
        <div className="flex items-center justify-center gap-2 py-2 px-2 rounded-2xl bg-slate-900/90 border border-purple-500/30 backdrop-blur-md shadow-lg">
          <div className="w-7 h-7 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4 text-purple-400" />
          </div>
          <div className="min-w-0 text-left">
            <span className="text-[10px] text-slate-400 block truncate">Comment đúng</span>
            <span className="font-black font-mono text-xs sm:text-sm text-purple-300 block truncate">
              {correctCommentsCount}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. TOP 4 - 10 LEADERBOARD TABLE (FROM USER DESIGN IMAGE 1)*/}
      {/* ======================================================== */}
      {showTable4To10 && (
        <div className="relative z-10 w-full max-w-xl mx-auto px-3 mt-4 mb-4">
          <div className="rounded-3xl bg-slate-900/85 border border-indigo-500/30 p-3 sm:p-4 shadow-2xl backdrop-blur-2xl space-y-2">
            {ranks4to10.map((player) => (
              <div
                key={player.rank}
                className="flex items-center justify-between gap-3 p-2 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank Number */}
                  <span className="w-6 font-mono font-black text-sm text-slate-400 text-center shrink-0">
                    {player.rank}
                  </span>

                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full border border-indigo-400/40 overflow-hidden bg-slate-800 shrink-0">
                    <img
                      src={player.avatar}
                      alt={player.displayName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Player Name */}
                  <span className="font-bold text-xs sm:text-sm text-slate-200 truncate">
                    {player.displayName}
                  </span>
                </div>

                {/* Score with Gold Star */}
                <div className="flex items-center gap-1 font-mono font-black text-xs sm:text-sm text-amber-300 shrink-0">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>{player.score.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. CONCENTRIC CIRCULAR STAGE FLOOR & CROWD SILHOUETTE    */}
      {/* ======================================================== */}
      <div className="relative w-full h-24 overflow-hidden pointer-events-none mt-2">
        {/* Glowing concentric rings */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] max-w-3xl h-36 rounded-[100%] border-4 border-amber-400/40 shadow-[0_0_50px_rgba(245,158,11,0.5),inset_0_0_40px_rgba(245,158,11,0.3)] bg-gradient-to-t from-indigo-950 via-purple-950/60 to-transparent">
          <div className="absolute inset-3 rounded-[100%] border-2 border-cyan-400/40" />
        </div>

        {/* Cheering crowd silhouette */}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#060812] to-transparent" />
      </div>
    </div>
  );
};
