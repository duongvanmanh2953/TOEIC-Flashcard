import React from 'react';
import { ARENA_THEME } from '../../arena/arenaTheme';
import { LeaderboardPlayer } from './ArenaPodium';
import { PlayerAvatar } from './PlayerAvatar';
import { ArenaIconFlame, ArenaIconTrophy } from './ArenaIcons';

export interface ArenaLeaderboardProps {
  players: LeaderboardPlayer[];
  currentUserId?: string;
  isCompact?: boolean;
  className?: string;
}

export const ArenaLeaderboard: React.FC<ArenaLeaderboardProps> = ({
  players,
  currentUserId,
  isCompact = false,
  className = '',
}) => {
  return (
    <div
      className={`w-full rounded-2xl bg-[#12182B] border border-[#232D4E] p-4 flex flex-col gap-2 select-none ${className}`}
    >
      <div className="flex items-center justify-between border-b border-[#232D4E] pb-2 px-1">
        <div className="flex items-center gap-2">
          <ArenaIconTrophy className="w-4 h-4 text-[#F6C453]" />
          <span className="text-xs font-black uppercase tracking-wider text-white">
            BẢNG XẾP HẠNG
          </span>
        </div>
        <span className="text-[11px] font-bold text-slate-400">
          {players.length} người thi đấu
        </span>
      </div>

      <div className="divide-y divide-[#232D4E]/40 overflow-y-auto max-h-[380px] pr-1">
        {players.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 italic">
            Chưa có người chơi ghi điểm
          </div>
        ) : (
          players.map((p, index) => {
            const rank = p.rank || index + 1;
            const isSelf = p.id === currentUserId;
            const isTop1 = rank === 1;
            const isTop2 = rank === 2;
            const isTop3 = rank === 3;

            let rankBadgeClass = 'text-slate-400 bg-[#19213A]';
            if (isTop1) rankBadgeClass = 'text-slate-950 bg-[#F6C453] font-black';
            else if (isTop2) rankBadgeClass = 'text-slate-950 bg-slate-300 font-black';
            else if (isTop3) rankBadgeClass = 'text-slate-950 bg-[#CD7F32] font-black';

            return (
              <div
                key={p.id || index}
                className={`py-2 px-2 rounded-xl flex items-center justify-between gap-2 transition-all ${
                  isSelf ? 'bg-[#2041F6]/20 border border-[#8B75FF]/40' : 'hover:bg-[#19213A]/50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Rank badge */}
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono shrink-0 ${rankBadgeClass}`}
                  >
                    {rank}
                  </span>

                  {/* Avatar */}
                  <PlayerAvatar
                    avatarUrl={p.avatar}
                    displayName={p.name}
                    size="sm"
                    tier={isTop1 ? 'gold' : isTop2 ? 'silver' : isTop3 ? 'bronze' : 'bronze'}
                  />

                  {/* Name and Delta */}
                  <div className="min-w-0">
                    <span
                      className={`text-xs block truncate ${
                        isSelf ? 'text-white font-black' : isTop1 ? 'text-[#F6C453] font-bold' : 'text-slate-200 font-medium'
                      }`}
                    >
                      {p.name} {isSelf && '(Bạn)'}
                    </span>

                    {/* Rank delta indicator */}
                    {typeof p.rankDelta === 'number' && p.rankDelta !== 0 && (
                      <span
                        className={`text-[10px] font-mono font-bold flex items-center gap-0.5 ${
                          p.rankDelta > 0 ? 'text-[#25C98A]' : 'text-[#F26B76]'
                        }`}
                      >
                        {p.rankDelta > 0 ? `▲ +${p.rankDelta}` : `▼ ${p.rankDelta}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Score & Streak */}
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-white tabular-nums font-mono block">
                    {p.score.toLocaleString()}
                  </span>
                  {p.streak && p.streak >= 2 ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-400">
                      <ArenaIconFlame className="w-2.5 h-2.5" />
                      <span>{p.streak}x</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">pts</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
