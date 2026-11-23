import React from 'react';

export interface ArenaPillOptionButtonProps {
  letter: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
  isSelected?: boolean;
  isCorrect?: boolean;
  isIncorrect?: boolean;
  disabled?: boolean;
  keepReadableWhenDisabled?: boolean;
  percentVote?: number;
  onClick?: () => void;
  className?: string;
}

/**
 * ArenaPillOptionButton
 * - No text saying "Đúng" / "Sai", no check/cross icons.
 * - Uniform, balanced base colors across all options (A, B, C, D).
 * - Pure color illumination communicates selection and reveal state.
 * - Proportional typography, multi-line wrap protection so text is never stuck together or cut off.
 */
export const ArenaPillOptionButton: React.FC<ArenaPillOptionButtonProps> = ({
  letter,
  text,
  isSelected = false,
  isCorrect = false,
  isIncorrect = false,
  disabled = false,
  keepReadableWhenDisabled = false,
  percentVote,
  onClick,
  className = '',
}) => {
  // Determine color styling based strictly on state
  let styleClasses = '';
  let badgeClasses = '';

  if (isCorrect) {
    // Correct reveal: Radiant Emerald glow
    styleClasses =
      'bg-emerald-950/80 border-emerald-400 text-emerald-50 shadow-[0_0_30px_rgba(16,185,129,0.5)] ring-2 ring-emerald-400/60 scale-[1.01] font-bold';
    badgeClasses =
      'bg-emerald-500 text-slate-950 border-emerald-300 font-black shadow-sm';
  } else if (isIncorrect) {
    // Incorrect reveal: Rose/Crimson accent (only if chosen by user)
    styleClasses =
      'bg-rose-950/70 border-rose-500/80 text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.35)] ring-2 ring-rose-500/40 font-semibold';
    badgeClasses =
      'bg-rose-600 text-white border-rose-400 font-black';
  } else if (isSelected) {
    // Selected state before reveal: Vibrant Electric Indigo / Cyan
    styleClasses =
      'bg-indigo-600/30 border-indigo-400 text-white shadow-[0_0_25px_rgba(99,102,241,0.45)] ring-2 ring-indigo-400/50 scale-[1.01] font-bold';
    badgeClasses =
      'bg-indigo-500 text-white border-indigo-300 font-black';
  } else {
    // Unified, balanced idle state for all options (đồng đều màu nhau)
    styleClasses =
      'bg-[#0f172a]/85 border-slate-700/70 text-slate-100 hover:border-cyan-400/80 hover:bg-[#1e293b]/90 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] shadow-md font-medium';
    badgeClasses =
      'bg-slate-800 text-cyan-300 border-slate-600/60 group-hover:border-cyan-400 group-hover:text-cyan-200';
  }

  const isDimmed = disabled && !isSelected && !isCorrect && !isIncorrect && percentVote === undefined && !keepReadableWhenDisabled;

  return (
    <button
      type="button"
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      aria-pressed={isSelected}
      aria-label={isCorrect ? `${letter}. ${text} — Đáp án đúng` : isIncorrect ? `${letter}. ${text} — Đáp án sai` : undefined}
      className={`relative w-full min-h-[50px] sm:min-h-[58px] py-2.5 sm:py-3 px-3 sm:px-4 rounded-2xl text-left transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 flex items-center justify-between gap-2.5 group select-none cursor-pointer border-2 overflow-hidden ${styleClasses} ${
        isDimmed ? 'opacity-40 cursor-not-allowed border-slate-800' : ''
      } ${className}`}
    >
      {/* Background Pick Rate Fill */}
      {percentVote !== undefined && percentVote > 0 && (
        <div
          className="absolute inset-y-0 left-0 bg-cyan-400/15 rounded-2xl pointer-events-none transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, percentVote))}%` }}
        />
      )}
      <div className="relative z-10 flex items-center gap-2.5 min-w-0 flex-1">
        {/* Uniform Letter Badge (A, B, C, D) */}
        <span
          className={`w-8 h-8 rounded-xl border flex items-center justify-center font-black font-mono text-xs sm:text-sm shrink-0 transition-all ${badgeClasses}`}
        >
          {letter}
        </span>

        {/* Option Text: balanced, proportional, no awkward collision */}
        <span className="text-sm sm:text-base break-words leading-snug flex-1">
          {text}
        </span>
      </div>

      {/* Real-time Vote Percentage (if provided) */}
      {percentVote !== undefined && (
        <span
          className={`font-mono font-black text-xs px-2 py-0.5 rounded-lg border shrink-0 transition-all ${
            isCorrect
              ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
              : isSelected
              ? 'bg-indigo-500/20 border-indigo-400/50 text-indigo-300'
              : 'bg-white/5 border-white/10 text-slate-400'
          }`}
        >
          {Math.round(percentVote)}%
        </span>
      )}
    </button>
  );
};
