import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  PieChart,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BarChart3,
} from 'lucide-react';

export interface AnswerVoteDetail {
  optionLetter: string; // 'A' | 'B' | 'C' | 'D'
  text?: string;
  count: number;
  percentage: number;
  isCorrect?: boolean;
  respondents: Array<{
    userId: string;
    displayName: string;
    avatarUrl?: string;
    isCorrect?: boolean;
    speedMs?: number;
  }>;
}

export interface GroupedTextAnswer {
  normalizedWord: string;
  count: number;
  percentage: number;
  isCorrect?: boolean;
  respondents: Array<{
    userId: string;
    displayName: string;
    avatarUrl?: string;
    speedMs?: number;
  }>;
}

interface QuestionAnalyticsPanelProps {
  totalParticipants: number;
  roundAnswerCount: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  optionsAnalytics?: AnswerVoteDetail[];
  textAnalytics?: GroupedTextAnswer[];
  isFillInTheBlank?: boolean;
  correctOptionIndex?: number;
  className?: string;
}

export const QuestionAnalyticsPanel: React.FC<QuestionAnalyticsPanelProps> = ({
  totalParticipants,
  roundAnswerCount,
  correctCount,
  incorrectCount,
  accuracy,
  optionsAnalytics = [],
  textAnalytics = [],
  isFillInTheBlank = false,
  correctOptionIndex,
  className = '',
}) => {
  const [expandedOption, setExpandedOption] = useState<string | null>(null);
  const unansweredCount = Math.max(0, totalParticipants - roundAnswerCount);

  const toggleExpand = (key: string) => {
    setExpandedOption((prev) => (prev === key ? null : key));
  };

  const optionColorStyles: Record<string, { bar: string; badge: string; text: string }> = {
    A: { bar: 'bg-blue-500', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40', text: 'text-blue-400' },
    B: { bar: 'bg-emerald-500', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', text: 'text-emerald-400' },
    C: { bar: 'bg-amber-500', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40', text: 'text-amber-400' },
    D: { bar: 'bg-rose-500', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40', text: 'text-rose-400' },
  };

  return (
    <section
      aria-label="Question Analytics"
      className={`rounded-3xl bg-[#12182B]/90 border border-white/10 p-4 sm:p-5 shadow-2xl backdrop-blur-xl space-y-4 ${className}`}
    >
      {/* 1. Header with title & High-level KPIs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2041F6] to-[#947AFF] flex items-center justify-center shadow-md">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-black text-xs sm:text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>QUESTION ANALYTICS</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Thống Kê Vòng Này
              </span>
            </h3>
            <p className="text-[11px] text-[#929CB4]">Dữ liệu thời gian thực từ các phản hồi hợp lệ</p>
          </div>
        </div>

        {/* Global Round Accuracy Pill */}
        <div className="flex items-center gap-2 bg-[#1B2440] px-3 py-1.5 rounded-2xl border border-white/5">
          <PieChart className="w-4 h-4 text-[#25C98A]" />
          <span className="text-[11px] text-[#929CB4] font-semibold">Tỷ lệ đúng:</span>
          <span className="font-mono font-black text-sm text-[#25C98A]">{Math.round(accuracy)}%</span>
        </div>
      </div>

      {/* 2. Top Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-[#1B2440]/80 border border-white/5 flex flex-col justify-between">
          <span className="text-[10px] text-[#929CB4] uppercase font-bold tracking-wider flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Tổng người chơi</span>
          </span>
          <span className="text-xl font-black text-white font-mono mt-1">{totalParticipants}</span>
        </div>

        <div className="p-3 rounded-2xl bg-[#1B2440]/80 border border-white/5 flex flex-col justify-between">
          <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đã trả lời đúng</span>
          </span>
          <span className="text-xl font-black text-[#25C98A] font-mono mt-1">{correctCount}</span>
        </div>

        <div className="p-3 rounded-2xl bg-[#1B2440]/80 border border-white/5 flex flex-col justify-between">
          <span className="text-[10px] text-rose-400 uppercase font-bold tracking-wider flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>Trả lời sai</span>
          </span>
          <span className="text-xl font-black text-[#F26B76] font-mono mt-1">{incorrectCount}</span>
        </div>

        <div className="p-3 rounded-2xl bg-[#1B2440]/80 border border-white/5 flex flex-col justify-between">
          <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Chưa trả lời</span>
          </span>
          <span className="text-xl font-black text-[#F6C453] font-mono mt-1">{unansweredCount}</span>
        </div>
      </div>

      {/* 3. Distribution Breakdown */}
      {!isFillInTheBlank ? (
        /* Multiple Choice: 4 Options Breakdown */
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>PHÂN BỐ LỰA CHỌN (A / B / C / D)</span>
            <span className="text-[#929CB4] text-[11px] font-medium">Nhấn vào đáp án để xem danh sách người chọn</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {optionsAnalytics.map((opt) => {
              const letter = opt.optionLetter.toUpperCase();
              const style = optionColorStyles[letter] || optionColorStyles.A;
              const isExpanded = expandedOption === letter;
              const isMarkedCorrect = opt.isCorrect ?? (typeof correctOptionIndex === 'number' && ['A', 'B', 'C', 'D'][correctOptionIndex] === letter);

              return (
                <div
                  key={letter}
                  className={`rounded-2xl border transition-all ${
                    isMarkedCorrect
                      ? 'bg-emerald-950/30 border-emerald-500/40 ring-1 ring-emerald-500/30'
                      : 'bg-[#1B2440]/60 border-white/5 hover:border-white/15'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(letter)}
                    className="w-full p-3 flex items-center justify-between text-left cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center border ${style.badge}`}>
                        {letter}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {opt.text && (
                            <span className="text-xs font-semibold text-white truncate max-w-[130px] sm:max-w-[160px]">
                              {opt.text}
                            </span>
                          )}
                          {isMarkedCorrect && (
                            <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-emerald-500/20 text-[#25C98A] border border-emerald-500/40">
                              ĐÁP ÁN ĐÚNG
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#929CB4] font-medium block">
                          {opt.count} người ({Math.round(opt.percentage)}%)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-slate-900 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isMarkedCorrect ? 'bg-[#25C98A]' : style.bar} transition-all duration-300`}
                          style={{ width: `${Math.min(100, Math.max(0, opt.percentage))}%` }}
                        />
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>

                  {/* Expandable Respondents list */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-white/5 space-y-1.5 animate-fade-in">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Danh sách người chọn ({opt.respondents.length}):
                      </div>
                      {opt.respondents.length === 0 ? (
                        <div className="text-[11px] text-slate-500 italic py-1">Chưa có ai chọn đáp án này</div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                          {opt.respondents.map((r) => (
                            <span
                              key={r.userId}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${
                                r.isCorrect
                                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                  : 'bg-slate-900 border-white/10 text-slate-300'
                              }`}
                            >
                              {r.avatarUrl && <img src={r.avatarUrl} alt="" className="w-3.5 h-3.5 rounded-full" />}
                              <span>{r.displayName}</span>
                              {r.speedMs && (
                                <span className="text-[9px] font-mono opacity-70">
                                  {(r.speedMs / 1000).toFixed(1)}s
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Fill in the Blank: Grouped Normalized Words */
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>TỪ ĐƯỢC GỬI (ĐÃ CHUẨN HOÁ & LỌC SPAM)</span>
            <span className="text-[#929CB4] text-[11px] font-medium">{textAnalytics.length} nhóm từ</span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {textAnalytics.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500 italic">
                Chưa có từ nào được gửi trong vòng này.
              </div>
            ) : (
              textAnalytics.map((item) => {
                const isExpanded = expandedOption === item.normalizedWord;
                return (
                  <div
                    key={item.normalizedWord}
                    className={`rounded-xl border transition ${
                      item.isCorrect
                        ? 'bg-emerald-950/30 border-emerald-500/40'
                        : 'bg-[#1B2440]/60 border-white/5'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.normalizedWord)}
                      className="w-full p-2.5 flex items-center justify-between text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-white">"{item.normalizedWord}"</span>
                        {item.isCorrect && (
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-emerald-500/20 text-[#25C98A] border border-emerald-500/40">
                            Chính xác
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">({item.count} lượt • {Math.round(item.percentage)}%)</span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-2.5 pt-1 border-t border-white/5 flex flex-wrap gap-1">
                        {item.respondents.map((r) => (
                          <span
                            key={r.userId}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] bg-slate-900 border border-white/10 text-slate-300"
                          >
                            <span>{r.displayName}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </section>
  );
};
