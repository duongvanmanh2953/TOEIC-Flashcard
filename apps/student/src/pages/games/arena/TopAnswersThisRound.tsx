import React from 'react';
import { Flame, CheckCircle2, XCircle, Zap, ShieldCheck, Timer } from 'lucide-react';
import { PlayerAvatar } from '@vocabflow/shared';

export interface RoundSubmissionItem {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  answer: string;
  isCorrect?: boolean;
  scoreEarned: number;
  responseTimeMs?: number;
  streak: number;
  rank: number;
  timestamp?: number;
}

interface TopAnswersThisRoundProps {
  submissions: RoundSubmissionItem[];
  currentUserId?: string;
  totalSubmissions?: number;
  className?: string;
}

export const TopAnswersThisRound: React.FC<TopAnswersThisRoundProps> = ({
  submissions = [],
  currentUserId,
  totalSubmissions,
  className = '',
}) => {
  // Sort submissions: correct first, then by score descending / response speed ascending
  const sortedSubmissions = [...submissions].sort((a, b) => {
    if (a.isCorrect && !b.isCorrect) return -1;
    if (!a.isCorrect && b.isCorrect) return 1;
    if (b.scoreEarned !== a.scoreEarned) return b.scoreEarned - a.scoreEarned;
    return (a.responseTimeMs || 99999) - (b.responseTimeMs || 99999);
  });

  const getSpeedTier = (ms?: number) => {
    if (!ms) return null;
    if (ms < 1000) return { label: 'Thần tốc', iconColor: 'text-amber-300', bg: 'bg-amber-400/15 border-amber-400/40 text-amber-300' };
    if (ms < 2500) return { label: 'Nhanh', iconColor: 'text-cyan-300', bg: 'bg-cyan-400/15 border-cyan-400/40 text-cyan-300' };
    return { label: 'Chuẩn', iconColor: 'text-slate-300', bg: 'bg-slate-700/30 border-slate-600 text-slate-300' };
  };

  return (
    <div
      aria-label="Top Answers This Round"
      className={`flex flex-col h-full rounded-3xl bg-[#12182B]/90 border border-white/10 p-4 sm:p-5 shadow-2xl backdrop-blur-xl ${className}`}
    >
      {/* 1. Area Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
        <div>
          <h3 className="font-black text-xs sm:text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
            <span className="text-[#947AFF]">TOP ANSWERS THIS ROUND</span>
          </h3>
          <p className="text-[11px] text-[#929CB4]">Xếp hạng phản xạ & độ chính xác câu này</p>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#1B2440] border border-white/5 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-mono font-bold text-white">
            {totalSubmissions ?? sortedSubmissions.length}
          </span>
          <span className="text-[#929CB4] text-[10px]">hợp lệ</span>
        </div>
      </div>

      {/* 2. Scrollable Rows List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px] max-h-[320px]">
        {sortedSubmissions.length === 0 ? (
          <div className="text-center py-10 text-slate-500 italic text-xs space-y-1">
            <Timer className="w-6 h-6 mx-auto text-slate-600 animate-spin" />
            <p>Đang chờ các câu trả lời đầu tiên của vòng này...</p>
            <p className="text-[10px] text-slate-600 not-italic">
              Hãy chọn đáp án hoặc gửi bình luận để vào bảng xếp hạng!
            </p>
          </div>
        ) : (
          sortedSubmissions.map((item, idx) => {
            const isMe = currentUserId && item.userId === currentUserId;
            const speedTier = getSpeedTier(item.responseTimeMs);

            return (
              <div
                key={`${item.userId}_${idx}`}
                className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                  isMe
                    ? 'bg-indigo-600/20 border-indigo-400 ring-1 ring-indigo-400/40'
                    : item.isCorrect
                    ? 'bg-[#1B2440]/80 border-white/5 hover:border-emerald-500/30'
                    : 'bg-[#1B2440]/50 border-white/5 opacity-75'
                }`}
              >
                {/* Left: Rank & Avatar & User Info */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span
                    className={`w-6 text-center font-black text-xs font-mono shrink-0 ${
                      idx === 0
                        ? 'text-[#F6C453]'
                        : idx === 1
                        ? 'text-slate-300'
                        : idx === 2
                        ? 'text-amber-600'
                        : 'text-[#929CB4]'
                    }`}
                  >
                    #{idx + 1}
                  </span>

                  <PlayerAvatar
                    avatarUrl={item.avatarUrl}
                    displayName={item.displayName}
                    size="sm"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white truncate max-w-[110px] sm:max-w-[130px]">
                        {item.displayName}
                      </span>
                      {isMe && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-indigo-500 text-white">
                          BẠN
                        </span>
                      )}
                    </div>

                    {/* Speed & Streak pills */}
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                      {speedTier && item.responseTimeMs && (
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded border font-mono font-bold text-[9px] ${speedTier.bg}`}
                        >
                          <Zap className="w-2.5 h-2.5 fill-current" />
                          <span>{(item.responseTimeMs / 1000).toFixed(1)}s</span>
                        </span>
                      )}
                      {item.streak > 1 && (
                        <span className="inline-flex items-center gap-0.5 text-rose-400 font-bold">
                          <Flame className="w-3 h-3 fill-rose-500" />
                          <span>{item.streak}x</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Chosen Answer & Score Delta */}
                <div className="flex items-center gap-2.5 shrink-0 text-right">
                  {/* Selected Answer Letter Badge */}
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs border ${
                      item.isCorrect
                        ? 'bg-emerald-500/20 text-[#25C98A] border-emerald-500/40'
                        : 'bg-rose-500/20 text-[#F26B76] border-rose-500/40'
                    }`}
                  >
                    {item.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-[#25C98A]" />
                    ) : (
                      <XCircle className="w-4 h-4 text-[#F26B76]" />
                    )}
                  </div>

                  <div className="min-w-[60px] text-right">
                    <div className="font-mono font-black text-xs text-white">
                      {item.answer}
                    </div>
                    {item.scoreEarned > 0 ? (
                      <div className="text-[10px] font-black text-[#25C98A] font-mono">
                        +{item.scoreEarned} XP
                      </div>
                    ) : (
                      <div className="text-[10px] font-bold text-slate-500 font-mono">
                        0 XP
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
