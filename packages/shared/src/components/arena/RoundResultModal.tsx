import React from 'react';
import { ARENA_THEME } from '../../arena/arenaTheme';
import {
  ArenaIconCheck,
  ArenaIconX,
  ArenaIconFlame,
  ArenaIconSparkles,
  ArenaIconVolume2,
} from './ArenaIcons';

export interface RoundResultData {
  isCorrect: boolean;
  correctAnswerLetter: string;
  correctAnswerText: string;
  explanation?: string;
  phonetic?: string;
  exampleSentence?: string;
  earnedPoints: number;
  basePoints: number;
  speedBonus: number;
  streakBonus: number;
  roundMultiplier: number;
  newStreak: number;
  currentRank?: number;
  rankDelta?: number;
  totalCorrectCount?: number;
  totalWrongCount?: number;
  onPlayAudio?: () => void;
}

export interface RoundResultModalProps {
  result: RoundResultData;
  countdownSec?: number;
  isModal?: boolean;
  onClose?: () => void;
  className?: string;
}

export const RoundResultModal: React.FC<RoundResultModalProps> = ({
  result,
  countdownSec,
  isModal = true,
  onClose,
  className = '',
}) => {
  const content = (
    <div
      className={`w-full max-w-lg mx-auto p-4 sm:p-6 rounded-3xl bg-[#0F1426]/95 border-2 ${
        result.isCorrect
          ? 'border-emerald-400/80 shadow-[0_0_40px_rgba(37,201,138,0.35)]'
          : 'border-rose-500/80 shadow-[0_0_35px_rgba(242,107,118,0.3)]'
      } space-y-4 animate-scale-up select-none backdrop-blur-2xl ${className}`}
    >
      {/* Result Status Header */}
      <div className="flex items-center justify-between pb-1 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-black shadow-lg ${
              result.isCorrect ? 'bg-emerald-400 text-slate-950 shadow-emerald-400/30' : 'bg-rose-500 text-white shadow-rose-500/30'
            }`}
          >
            {result.isCorrect ? <ArenaIconCheck className="w-6 h-6 stroke-[3]" /> : <ArenaIconX className="w-6 h-6 stroke-[3]" />}
          </div>
          <div>
            <h3
              className={`text-base sm:text-xl font-black tracking-tight ${
                result.isCorrect ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {result.isCorrect ? 'CHÍNH XÁC! 🎉' : 'CHƯA CHÍNH XÁC 💡'}
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {result.isCorrect ? 'Phản xạ tuyệt vời, duy trì phong độ nhé!' : 'Quan sát đáp án đúng và lời giải thích bên dưới'}
            </span>
          </div>
        </div>

        {typeof countdownSec === 'number' && (
          <div className="text-right bg-black/40 px-3 py-1 rounded-xl border border-white/10 shrink-0">
            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Tiếp theo</span>
            <span className="text-base sm:text-lg font-black font-mono text-amber-400 tabular-nums">
              {countdownSec}s
            </span>
          </div>
        )}
      </div>

      {/* Target Word & Vietnamese Translation / Explanation Box */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#161D36] border border-white/10 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
            <span>🎯 ĐÁP ÁN CHÍNH XÁC:</span>
          </span>
          {result.onPlayAudio && (
            <button
              type="button"
              onClick={result.onPlayAudio}
              className="p-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 hover:text-white border border-indigo-500/40 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="Nghe phát âm từ vựng"
            >
              <ArenaIconVolume2 className="w-3.5 h-3.5" />
              <span>Phát âm</span>
            </button>
          )}
        </div>

        {/* Correct option badge + text */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-400 text-slate-950 text-xs font-black shadow-sm">
            {result.correctAnswerLetter}
          </span>
          <span className="text-sm sm:text-base font-black text-white">
            {result.correctAnswerText}
          </span>
          {result.phonetic && (
            <span className="text-xs text-indigo-300 font-mono font-bold bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-500/30">
              /{result.phonetic}/
            </span>
          )}
        </div>

        {/* Detailed Explanation Note */}
        {result.explanation && (
          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/25 space-y-1 mt-2">
            <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider block">
              📖 Dịch nghĩa & Giải thích:
            </span>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              {result.explanation}
            </p>
          </div>
        )}

        {/* Example Sentence */}
        {result.exampleSentence && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider block mb-0.5">
              💬 Ví dụ ngữ cảnh:
            </span>
            <p className="text-xs text-amber-100 italic leading-snug">
              &ldquo;{result.exampleSentence}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* Points & Bonuses Breakdown */}
      {result.isCorrect && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 sm:p-2.5 rounded-xl bg-[#0B0F1E] border border-white/10">
            <span className="text-[10px] text-slate-400 block font-semibold">Điểm gốc</span>
            <span className="text-xs sm:text-sm font-black font-mono text-white tabular-nums">
              +{result.basePoints}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-[#0B0F1E] border border-white/10">
            <span className="text-[10px] text-slate-400 block font-semibold">Tốc độ</span>
            <span className="text-xs sm:text-sm font-black font-mono text-indigo-400 tabular-nums">
              +{result.speedBonus}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-[#0B0F1E] border border-white/10">
            <span className="text-[10px] text-slate-400 block font-semibold">Chuỗi</span>
            <span className="text-xs sm:text-sm font-black font-mono text-amber-400 tabular-nums">
              +{result.streakBonus}
            </span>
          </div>
        </div>
      )}

      {/* Total Earned Badge */}
      <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-pink-900/30 border border-indigo-500/30">
        <div className="flex items-center gap-2">
          <ArenaIconSparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-slate-200">
            {result.isCorrect ? 'Tổng điểm vòng này:' : 'Điểm tích lũy:'}
          </span>
        </div>
        <span className="text-base sm:text-lg font-black font-mono text-amber-300 tabular-nums">
          +{result.earnedPoints.toLocaleString()} XP
        </span>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold transition cursor-pointer"
        >
          Đóng cửa sổ
        </button>
      )}
    </div>
  );

  if (!isModal) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {content}
      </div>
    </div>
  );
};
