import React from 'react';
import { Check, X } from 'lucide-react';

export interface ArenaPillOptionButtonProps {
  letter: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
  isSelected?: boolean;
  isCorrect?: boolean;
  isIncorrect?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ArenaPillOptionButton: React.FC<ArenaPillOptionButtonProps> = ({
  letter,
  text,
  isSelected = false,
  isCorrect = false,
  isIncorrect = false,
  disabled = false,
  onClick,
  className = '',
}) => {
  // Highlight state: active selection or correct reveal glows radiant amber gold as in Image 2
  const isHighlighted = isSelected || isCorrect;

  return (
    <button
      type="button"
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`relative w-full py-3.5 sm:py-4 px-5 sm:px-7 rounded-full text-left transition-all duration-300 flex items-center justify-between gap-3 group select-none cursor-pointer border-2 ${
        isHighlighted
          ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 border-amber-300 text-slate-950 font-black shadow-[0_0_35px_rgba(245,158,11,0.75)] ring-2 ring-amber-300 scale-[1.01]'
          : isIncorrect
          ? 'bg-gradient-to-r from-rose-950/80 via-rose-900/80 to-rose-950/80 border-rose-500 text-rose-100 font-bold shadow-[0_0_20px_rgba(244,63,94,0.4)]'
          : 'bg-gradient-to-r from-[#111c3a]/90 via-[#162752]/90 to-[#111c3a]/90 border-cyan-500/50 text-white font-bold hover:border-cyan-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] shadow-[0_0_15px_rgba(32,65,246,0.25)]'
      } ${disabled && !isHighlighted ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`font-black font-mono text-base sm:text-lg shrink-0 ${
            isHighlighted ? 'text-slate-950' : 'text-cyan-300 group-hover:text-cyan-200'
          }`}
        >
          {letter}.
        </span>
        <span
          className={`text-sm sm:text-base tracking-wide truncate ${
            isHighlighted ? 'text-slate-950 font-black' : 'text-slate-100 group-hover:text-white'
          }`}
        >
          {text}
        </span>
      </div>

      {/* Right mini status indicator */}
      {isCorrect && (
        <span className="w-6 h-6 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 shadow">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </span>
      )}
      {isIncorrect && (
        <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 shadow">
          <X className="w-3.5 h-3.5 stroke-[3]" />
        </span>
      )}
    </button>
  );
};
