import React, { useRef, useState } from 'react';
import {
  Trophy,
  Crown,
  Medal,
  Flame,
  Target,
  ArrowUp,
  ArrowDown,
  Minus,
  UserCheck,
  MessageSquare,
  Users,
} from 'lucide-react';
import { ArenaBangVangCeremony, BangVangPlayer } from './ArenaBangVangCeremony';

export interface ArenaRankPlayer {
  userId: string;
  displayName: string;
  avatar: string;
  score: number;
  streak: number;
  bestStreak: number;
  correctCount: number;
  totalAnswered?: number;
  rank: number;
  rankChange?: number; // e.g. +2, -1, 0
  level?: number;
  isCommenter?: boolean;
}

interface ArenaRankingPanelProps {
  players: ArenaRankPlayer[];
  commenters?: ArenaRankPlayer[];
  currentUserId?: string;
  totalParticipants?: number;
  className?: string;
}

export const ArenaRankingPanel: React.FC<ArenaRankingPanelProps> = ({
  players = [],
  commenters = [],
  currentUserId,
  totalParticipants,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'players' | 'commenters'>('players');
  const [viewMode, setViewMode] = useState<'bang_vang' | 'list'>('bang_vang');

  const activeList = activeTab === 'players' ? players : commenters;

  // Transform players to BangVangPlayer format
  const bangVangPlayers: BangVangPlayer[] = activeList.map((p, idx) => ({
    rank: p.rank || idx + 1,
    displayName: p.displayName,
    avatar: p.avatar,
    score: p.score,
    isCurrentUser: p.userId === currentUserId,
  }));

  return (
    <div
      aria-label="Arena Ranking & Bảng Vàng"
      className={`flex flex-col h-full rounded-3xl bg-slate-900/90 border border-indigo-500/30 p-4 sm:p-5 shadow-2xl backdrop-blur-2xl overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 ${className}`}
    >
      {/* 1. Header with Tabs & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3 mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center shadow-md">
            <Trophy className="w-4 h-4 text-slate-950" />
          </div>
          <div>
            <h3 className="font-black text-xs sm:text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
              <span className="text-amber-400">BẢNG VÀNG ARENA</span>
            </h3>
            <p className="text-[11px] text-slate-400">Xếp hạng vinh danh trực tiếp</p>
          </div>
        </div>

        {/* Tab switchers: Players vs Commenters */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('players')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'players'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>Đấu thủ ({players.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('commenters')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'commenters'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Comment ({commenters.length})</span>
          </button>
        </div>
      </div>

      {/* 2. BẢNG VÀNG CEREMONY VIEW */}
      <div className="flex-1">
        <ArenaBangVangCeremony
          topPlayers={bangVangPlayers}
          totalPlayersCount={totalParticipants || players.length || '1.2K'}
          accuracyRate="78%"
          correctCommentsCount={commenters.length || '642'}
          showTable4To10={true}
        />
      </div>
    </div>
  );
};
