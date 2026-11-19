import React from 'react';
import { Users, CheckCircle2, MessageSquare, Trophy, Flame } from 'lucide-react';

export interface ArenaStatsBarProps {
  totalParticipants: number;
  roundAnswerCount: number;
  correctCommentersCount?: number;
  topPlayerName?: string;
  topPlayerScore?: number;
  myStreak?: number;
  myScore?: number;
  className?: string;
}

export const ArenaStatsBar: React.FC<ArenaStatsBarProps> = ({
  totalParticipants,
  roundAnswerCount,
  correctCommentersCount = 0,
  topPlayerName,
  topPlayerScore,
  myStreak = 0,
  myScore = 0,
  className = '',
}) => {
  return (
    <div
      aria-label="Room Fast Statistics Bar"
      className={`grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 ${className}`}
    >
      {/* 1. Total Participants */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-[#12182B]/90 border border-white/10 shadow-lg backdrop-blur-md flex items-center justify-between">
        <div className="min-w-0">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#929CB4] uppercase tracking-wider block">
            Người tham gia
          </span>
          <span className="text-base sm:text-xl font-black font-mono text-white mt-0.5 block truncate">
            {totalParticipants}
          </span>
        </div>
        <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0">
          <Users className="w-4 h-4 text-indigo-400" />
        </div>
      </div>

      {/* 2. Round Answered Count */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-[#12182B]/90 border border-white/10 shadow-lg backdrop-blur-md flex items-center justify-between">
        <div className="min-w-0">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#929CB4] uppercase tracking-wider block">
            Đã trả lời câu này
          </span>
          <span className="text-base sm:text-xl font-black font-mono text-amber-400 mt-0.5 block truncate">
            {roundAnswerCount}/{totalParticipants}
          </span>
        </div>
        <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
        </div>
      </div>

      {/* 3. Correct Commenters Count */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-[#12182B]/90 border border-white/10 shadow-lg backdrop-blur-md flex items-center justify-between">
        <div className="min-w-0">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#929CB4] uppercase tracking-wider block">
            Comment trả lời đúng
          </span>
          <span className="text-base sm:text-xl font-black font-mono text-[#25C98A] mt-0.5 block truncate">
            {correctCommentersCount}
          </span>
        </div>
        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
        </div>
      </div>

      {/* 4. Top Player or Personal Performance */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-[#12182B]/90 border border-white/10 shadow-lg backdrop-blur-md flex items-center justify-between">
        <div className="min-w-0">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#929CB4] uppercase tracking-wider block truncate">
            {topPlayerName ? `Top 1: ${topPlayerName}` : 'Điểm của bạn'}
          </span>
          <span className="text-base sm:text-xl font-black font-mono text-amber-300 mt-0.5 block truncate">
            {typeof topPlayerScore === 'number'
              ? `${topPlayerScore.toLocaleString()} XP`
              : `${myScore.toLocaleString()} XP`}
          </span>
        </div>
        <div className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shrink-0">
          <Trophy className="w-4 h-4 text-amber-400" />
        </div>
      </div>
    </div>
  );
};
