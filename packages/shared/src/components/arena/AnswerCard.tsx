import React from 'react';
import { ArenaIconCheck, ArenaIconX } from './ArenaIcons';

export type AnswerCardState = 'idle' | 'selected' | 'correct' | 'incorrect' | 'locked' | 'disabled';

export interface AnswerCardProps {
  optionLetter: string; // 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  text: string;
  state?: AnswerCardState;
  dimmed?: boolean; // When another answer has been chosen while open, or unselected during reveal
  percentVote?: number; // Realtime audience % if in live mode
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

// Distinct, vibrant color themes with high contrast
// Option D is Violet (preserving Emerald exclusively for the Correct Answer reveal)
interface OptionTheme {
  idleBorder: string;
  idleBadge: string;
  idleText: string;
  idleGlow: string;
  accentBar: string;
  shapeSymbol: string;
}

const OPTION_THEMES: Record<string, OptionTheme> = {
  A: {
    idleBorder: 'border-rose-500/80 hover:border-rose-400 bg-gradient-to-br from-rose-950/85 via-[#3D142B]/90 to-[#1e0d22] hover:from-rose-900/90 hover:to-[#2e1233]',
    idleBadge: 'bg-gradient-to-br from-rose-500 to-rose-600 text-white font-black border-rose-300 shadow-md shadow-rose-500/50 group-hover:scale-105',
    idleText: 'text-rose-100 group-hover:text-white',
    idleGlow: 'shadow-[0_4px_25px_rgba(244,63,94,0.3)] hover:shadow-[0_6px_32px_rgba(244,63,94,0.45)]',
    accentBar: 'bg-gradient-to-r from-rose-500 to-pink-500',
    shapeSymbol: '▲',
  },
  B: {
    idleBorder: 'border-blue-500/80 hover:border-blue-400 bg-gradient-to-br from-blue-950/85 via-[#132A5C]/90 to-[#0e172e] hover:from-blue-900/90 hover:to-[#172b54]',
    idleBadge: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black border-blue-300 shadow-md shadow-blue-500/50 group-hover:scale-105',
    idleText: 'text-blue-100 group-hover:text-white',
    idleGlow: 'shadow-[0_4px_25px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_32px_rgba(59,130,246,0.45)]',
    accentBar: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    shapeSymbol: '◆',
  },
  C: {
    idleBorder: 'border-amber-500/80 hover:border-amber-400 bg-gradient-to-br from-amber-950/85 via-[#4A320C]/90 to-[#22180c] hover:from-amber-900/90 hover:to-[#38260d]',
    idleBadge: 'bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 font-black border-amber-200 shadow-md shadow-amber-500/50 group-hover:scale-105',
    idleText: 'text-amber-100 group-hover:text-white',
    idleGlow: 'shadow-[0_4px_25px_rgba(245,158,11,0.3)] hover:shadow-[0_6px_32px_rgba(245,158,11,0.45)]',
    accentBar: 'bg-gradient-to-r from-amber-400 to-yellow-500',
    shapeSymbol: '●',
  },
  D: {
    idleBorder: 'border-purple-500/80 hover:border-purple-400 bg-gradient-to-br from-purple-950/85 via-[#3D145A]/90 to-[#1e0f2b] hover:from-purple-900/90 hover:to-[#311447]',
    idleBadge: 'bg-gradient-to-br from-purple-500 to-violet-600 text-white font-black border-purple-300 shadow-md shadow-purple-500/50 group-hover:scale-105',
    idleText: 'text-purple-100 group-hover:text-white',
    idleGlow: 'shadow-[0_4px_25px_rgba(168,85,247,0.3)] hover:shadow-[0_6px_32px_rgba(168,85,247,0.45)]',
    accentBar: 'bg-gradient-to-r from-purple-500 to-violet-500',
    shapeSymbol: '■',
  },
  E: {
    idleBorder: 'border-cyan-500/80 hover:border-cyan-400 bg-gradient-to-br from-[#082832] via-[#0A1F26] to-[#12182B]/95 hover:from-[#0E3A49] hover:to-[#181D33]',
    idleBadge: 'bg-gradient-to-br from-cyan-500 to-teal-600 text-white font-black border-cyan-400 shadow-md shadow-cyan-500/35 group-hover:scale-105',
    idleText: 'text-cyan-50 group-hover:text-white',
    idleGlow: 'shadow-[0_4px_20px_rgba(6,182,212,0.18)] hover:shadow-[0_4px_30px_rgba(6,182,212,0.35)]',
    accentBar: 'bg-gradient-to-r from-cyan-400 to-teal-500',
    shapeSymbol: '⬟',
  },
  F: {
    idleBorder: 'border-pink-500/80 hover:border-pink-400 bg-gradient-to-br from-[#320822] via-[#240A1C] to-[#12182B]/95 hover:from-[#470D31] hover:to-[#181D33]',
    idleBadge: 'bg-gradient-to-br from-pink-500 to-rose-600 text-white font-black border-pink-400 shadow-md shadow-pink-500/35 group-hover:scale-105',
    idleText: 'text-pink-50 group-hover:text-white',
    idleGlow: 'shadow-[0_4px_20px_rgba(236,72,153,0.18)] hover:shadow-[0_4px_30px_rgba(236,72,153,0.35)]',
    accentBar: 'bg-gradient-to-r from-pink-400 to-rose-500',
    shapeSymbol: '✦',
  },
};

const DEFAULT_THEME: OptionTheme = {
  idleBorder: 'border-[#2041F6]/40 hover:border-[#947AFF] bg-gradient-to-r from-[#171D38] via-[#131B30] to-[#12182B]',
  idleBadge: 'bg-indigo-600 text-white font-black border-indigo-400',
  idleText: 'text-slate-100 group-hover:text-white',
  idleGlow: 'shadow-md hover:shadow-[0_0_25px_rgba(148,122,255,0.3)]',
  accentBar: 'bg-[#947AFF]',
  shapeSymbol: '★',
};

export const AnswerCard: React.FC<AnswerCardProps> = ({
  optionLetter,
  text,
  state = 'idle',
  dimmed = false,
  percentVote,
  onClick,
  disabled = false,
  className = '',
}) => {
  const isSelected = state === 'selected';
  const isCorrect = state === 'correct';
  const isIncorrect = state === 'incorrect';
  const isLocked = state === 'locked';
  const isDisabled = disabled || state === 'disabled';

  const normalizedLetter = (optionLetter || '').trim().toUpperCase();
  const theme = OPTION_THEMES[normalizedLetter] || DEFAULT_THEME;

  // Dynamic styling based on authoritative state & distinct color theme
  let borderStyle = theme.idleBorder;
  let badgeStyle = theme.idleBadge;
  let textStyle = theme.idleText;
  let glowStyle = theme.idleGlow;
  let dimmingStyle = '';

  if (isSelected) {
    // Selected state: Radiant Gold / Amber highlight with pulse glow
    borderStyle = 'border-amber-400 bg-gradient-to-r from-[#3A2A08] via-[#2A1E06] to-[#1A1405] ring-4 ring-amber-400/60';
    badgeStyle = 'bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 font-black border-amber-300 shadow-xl shadow-amber-500/40 scale-105';
    textStyle = 'text-amber-100 font-bold';
    glowStyle = 'shadow-[0_0_35px_rgba(245,158,11,0.55)]';
  } else if (isCorrect) {
    // Correct reveal state: Emerald green with triumphant glow
    borderStyle = 'border-emerald-400 bg-gradient-to-r from-[#06331E] via-[#092B1E] to-[#0A2018] ring-4 ring-emerald-400/60';
    badgeStyle = 'bg-emerald-400 text-slate-950 font-black border-emerald-200 shadow-xl shadow-emerald-500/40 scale-105';
    textStyle = 'text-emerald-100 font-black';
    glowStyle = 'shadow-[0_0_35px_rgba(37,201,138,0.6)] animate-pulse';
  } else if (isIncorrect) {
    // Incorrect reveal state: Rose Red with subtle alert vibration
    borderStyle = 'border-rose-500 bg-gradient-to-r from-[#360C14] via-[#270A10] to-[#18060A] ring-4 ring-rose-500/60';
    badgeStyle = 'bg-rose-500 text-white font-black border-rose-300 shadow-xl shadow-rose-500/40';
    textStyle = 'text-rose-100 font-semibold';
    glowStyle = 'shadow-[0_0_30px_rgba(242,107,118,0.5)]';
  } else if (isLocked || isDisabled) {
    // Unselected cards during reveal or locked cards: dimmed but text remains legible
    borderStyle = 'border-white/5 bg-[#0E1322]/85 opacity-40 cursor-not-allowed';
    badgeStyle = 'bg-[#19213A] text-slate-500 border-white/10';
    textStyle = 'text-slate-400';
    glowStyle = 'shadow-none';
  } else if (dimmed) {
    // When an option is chosen, other idle options have reduced emphasis while preserving colors
    dimmingStyle = 'opacity-65 hover:opacity-85 scale-[0.99]';
  }

  return (
    <button
      type="button"
      onClick={!isDisabled && !isLocked ? onClick : undefined}
      disabled={isDisabled || isLocked}
      aria-pressed={isSelected}
      aria-label={`Đáp án ${optionLetter}: ${text}${isCorrect ? ' - Đúng' : isIncorrect ? ' - Sai' : isSelected ? ' - Đã chọn' : ''}`}
      className={`relative w-full min-h-[60px] sm:min-h-[74px] p-2.5 sm:p-4 rounded-2xl border-2 text-left transition-all duration-300 flex items-center justify-between gap-2 sm:gap-3 group select-none cursor-pointer ${borderStyle} ${glowStyle} ${dimmingStyle} ${className}`}
    >
      <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1">
        {/* Key Letter Badge with vector check/X icons */}
        <span
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-xs sm:text-base border shrink-0 transition-all ${badgeStyle}`}
        >
          {isCorrect ? (
            <ArenaIconCheck className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 stroke-[3]" />
          ) : isIncorrect ? (
            <ArenaIconX className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[3]" />
          ) : (
            <span className="flex items-center gap-0.5">
              <span>{optionLetter}</span>
            </span>
          )}
        </span>

        {/* Option text */}
        <span className={`text-xs sm:text-sm md:text-base font-bold break-words leading-tight sm:leading-snug tracking-tight sm:tracking-wide line-clamp-3 sm:line-clamp-2 ${textStyle}`}>
          {text}
        </span>
      </div>

      {/* Accessible status indicator badges (combines icons + text for colorblind support) */}
      {isCorrect && (
        <span className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-emerald-400/25 border border-emerald-400 text-emerald-300 font-black text-[10px] sm:text-xs uppercase tracking-wider shrink-0 shadow-md animate-bounce flex items-center gap-1">
          ✓ ĐÚNG
        </span>
      )}
      {isIncorrect && (
        <span className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-rose-500/25 border border-rose-400 text-rose-300 font-black text-[10px] sm:text-xs uppercase tracking-wider shrink-0 shadow-md flex items-center gap-1">
          ✗ SAI
        </span>
      )}
      {isSelected && !isCorrect && !isIncorrect && (
        <span className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-amber-400/25 border border-amber-400 text-amber-300 font-black text-[10px] sm:text-xs uppercase tracking-wider shrink-0 animate-pulse flex items-center gap-1">
          ĐÃ CHỌN
        </span>
      )}

      {/* Realtime % Vote Bar if provided */}
      {typeof percentVote === 'number' && (
        <div className="flex items-center gap-1.5 shrink-0 bg-black/50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-xl border border-white/10">
          <span className="text-[10px] sm:text-xs font-mono font-black text-slate-200 tabular-nums">
            {Math.round(percentVote)}%
          </span>
          <div className="w-8 sm:w-14 h-1.5 sm:h-2 rounded-full bg-slate-900 overflow-hidden border border-white/10">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isCorrect ? 'bg-emerald-400' : isIncorrect ? 'bg-rose-500' : isSelected ? 'bg-amber-400' : theme.accentBar
              }`}
              style={{ width: `${Math.min(100, Math.max(0, percentVote))}%` }}
            />
          </div>
        </div>
      )}
    </button>
  );
};
