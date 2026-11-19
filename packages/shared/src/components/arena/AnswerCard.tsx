import React from 'react';
import { ARENA_THEME } from '../../arena/arenaTheme';
import { ArenaIconCheck, ArenaIconX } from './ArenaIcons';

export type AnswerCardState = 'idle' | 'selected' | 'correct' | 'incorrect' | 'locked' | 'disabled';

export interface AnswerCardProps {
  optionLetter: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
  state?: AnswerCardState;
  percentVote?: number; // Realtime audience % if in live mode
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const AnswerCard: React.FC<AnswerCardProps> = ({
  optionLetter,
  text,
  state = 'idle',
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

  // Styling based on state
  let borderStyle = 'border-[#232D4E] hover:border-[#8B75FF]/60 hover:bg-[#19213A]';
  let badgeStyle = 'bg-[#19213A] text-slate-300 border-[#232D4E]';
  let textStyle = 'text-[#F4F6FF]';
  let glowStyle = '';

  if (isSelected) {
    borderStyle = 'border-[#8B75FF] bg-[#2041F6]/20 ring-2 ring-[#8B75FF]/50';
    badgeStyle = 'bg-[#8B75FF] text-white border-[#8B75FF]';
    textStyle = 'text-white font-bold';
    glowStyle = 'shadow-[0_0_20px_rgba(139,117,255,0.35)]';
  } else if (isCorrect) {
    borderStyle = 'border-[#25C98A] bg-[#25C98A]/20 ring-2 ring-[#25C98A]/60';
    badgeStyle = 'bg-[#25C98A] text-slate-950 font-black border-[#25C98A]';
    textStyle = 'text-[#25C98A] font-black';
    glowStyle = 'shadow-[0_0_25px_rgba(37,201,138,0.4)] animate-pulse';
  } else if (isIncorrect) {
    borderStyle = 'border-[#F26B76] bg-[#F26B76]/15 ring-2 ring-[#F26B76]/50';
    badgeStyle = 'bg-[#F26B76] text-white border-[#F26B76]';
    textStyle = 'text-[#F26B76]';
    glowStyle = 'shadow-[0_0_20px_rgba(242,107,118,0.3)]';
  } else if (isLocked || isDisabled) {
    borderStyle = 'border-[#1E263D] bg-[#0E1322] opacity-60 cursor-not-allowed';
    badgeStyle = 'bg-[#19213A] text-slate-500 border-[#1E263D]';
    textStyle = 'text-slate-400';
  }

  return (
    <button
      type="button"
      onClick={!isDisabled && !isLocked ? onClick : undefined}
      disabled={isDisabled || isLocked}
      className={`relative w-full p-4 sm:p-5 rounded-2xl bg-[#12182B] border-2 text-left transition-all duration-200 flex items-center justify-between gap-3 group select-none cursor-pointer ${borderStyle} ${glowStyle} ${className}`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Key Letter Badge */}
        <span
          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-black text-sm sm:text-base border shrink-0 transition-all ${badgeStyle}`}
        >
          {isCorrect ? (
            <ArenaIconCheck className="w-5 h-5 text-slate-950" />
          ) : isIncorrect ? (
            <ArenaIconX className="w-5 h-5 text-white" />
          ) : (
            optionLetter
          )}
        </span>

        {/* Option text */}
        <span className={`text-sm sm:text-base font-medium break-words leading-snug ${textStyle}`}>
          {text}
        </span>
      </div>

      {/* Realtime % Vote Bar if provided */}
      {typeof percentVote === 'number' && (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-400 tabular-nums">
            {Math.round(percentVote)}%
          </span>
          <div className="w-12 sm:w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isCorrect ? 'bg-[#25C98A]' : 'bg-[#8B75FF]'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, percentVote))}%` }}
            />
          </div>
        </div>
      )}
    </button>
  );
};
