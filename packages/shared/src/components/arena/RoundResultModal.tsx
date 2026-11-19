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
  className?: string;
}

export const RoundResultModal: React.FC<RoundResultModalProps> = ({
  result,
  countdownSec,
  className = '',
}) => {
  return (
    <div
      className={`w-full max-w-lg mx-auto p-6 rounded-3xl bg-[#12182B] border-2 ${
        result.isCorrect ? 'border-[#25C98A]/60 shadow-[0_0_30px_rgba(37,201,138,0.25)]' : 'border-[#F26B76]/50 shadow-[0_0_25px_rgba(242,107,118,0.2)]'
      } space-y-5 animate-scale-up select-none ${className}`}
    >
      {/* Result Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
              result.isCorrect ? 'bg-[#25C98A] text-slate-950' : 'bg-[#F26B76] text-white'
            }`}
          >
            {result.isCorrect ? <ArenaIconCheck className="w-7 h-7" /> : <ArenaIconX className="w-7 h-7" />}
          </div>
          <div>
            <h3
              className={`text-lg sm:text-xl font-black ${
                result.isCorrect ? 'text-[#25C98A]' : 'text-[#F26B76]'
              }`}
            >
              {result.isCorrect ? 'CHÍNH XÁC!' : 'CHƯA CHÍNH XÁC'}
            </h3>
            <span className="text-xs text-slate-400">
              {result.isCorrect ? 'Phản xạ tuyệt vời' : 'Cố gắng ở câu tiếp theo nhé'}
            </span>
          </div>
        </div>

        {typeof countdownSec === 'number' && (
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Câu tiếp sau</span>
            <span className="text-lg font-black font-mono text-[#F6C453] tabular-nums">
              {countdownSec}s
            </span>
          </div>
        )}
      </div>

      {/* Correct Answer & Explanation Box */}
      <div className="p-4 rounded-2xl bg-[#19213A] border border-[#232D4E] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Đáp án đúng:
          </span>
          {result.onPlayAudio && (
            <button
              type="button"
              onClick={result.onPlayAudio}
              className="p-1 rounded-lg bg-[#12182B] text-indigo-300 hover:text-white border border-[#232D4E]"
              title="Nghe phát âm"
            >
              <ArenaIconVolume2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-lg bg-[#25C98A] text-slate-950 text-xs font-black">
            {result.correctAnswerLetter}
          </span>
          <span className="text-sm sm:text-base font-bold text-white">
            {result.correctAnswerText}
          </span>
          {result.phonetic && (
            <span className="text-xs text-slate-400 font-mono">[{result.phonetic}]</span>
          )}
        </div>

        {result.explanation && (
          <p className="text-xs text-slate-300 leading-relaxed pt-1 border-t border-[#232D4E]/50">
            {result.explanation}
          </p>
        )}

        {result.exampleSentence && (
          <p className="text-xs text-indigo-300/80 italic">
            &ldquo;{result.exampleSentence}&rdquo;
          </p>
        )}
      </div>

      {/* Points & Bonuses Breakdown */}
      {result.isCorrect && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-[#090D1B] border border-[#232D4E]">
            <span className="text-[10px] text-slate-400 block font-semibold">Điểm gốc</span>
            <span className="text-sm font-black font-mono text-white tabular-nums">
              +{result.basePoints}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#090D1B] border border-[#232D4E]">
            <span className="text-[10px] text-slate-400 block font-semibold">Tốc độ</span>
            <span className="text-sm font-black font-mono text-[#8B75FF] tabular-nums">
              +{result.speedBonus}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#090D1B] border border-[#232D4E]">
            <span className="text-[10px] text-slate-400 block font-semibold">Chuỗi</span>
            <span className="text-sm font-black font-mono text-amber-400 tabular-nums">
              +{result.streakBonus}
            </span>
          </div>
        </div>
      )}

      {/* Total Earned Badge */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-[#2041F6]/15 border border-[#8B75FF]/30">
        <div className="flex items-center gap-2">
          <ArenaIconSparkles className="w-4 h-4 text-[#F6C453]" />
          <span className="text-xs font-bold text-slate-200">
            {result.isCorrect ? 'Tổng điểm vòng này:' : 'Điểm nhận được:'}
          </span>
        </div>
        <span className="text-base sm:text-lg font-black font-mono text-white tabular-nums">
          +{result.earnedPoints.toLocaleString()} pts
        </span>
      </div>
    </div>
  );
};
