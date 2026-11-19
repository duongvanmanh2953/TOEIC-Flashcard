import React from 'react';
import { ARENA_THEME } from '../../arena/arenaTheme';
import { ArenaIconVolume2 } from './ArenaIcons';

export interface QuestionCardProps {
  prompt: string;
  targetWord?: string;
  phonetic?: string;
  partOfSpeech?: string;
  level?: string;
  languageCode?: string;
  category?: string;
  exampleSentence?: string;
  onPlayAudio?: () => void;
  className?: string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  prompt,
  targetWord,
  phonetic,
  partOfSpeech,
  level,
  languageCode,
  category,
  exampleSentence,
  onPlayAudio,
  className = '',
}) => {
  return (
    <div
      className={`relative w-full p-6 sm:p-8 rounded-3xl bg-[#12182B] border-2 border-[#232D4E] shadow-2xl shadow-indigo-950/50 space-y-4 text-center sm:text-left ${className}`}
    >
      {/* Top Metadata Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#232D4E]/80 pb-3">
        <div className="flex items-center gap-2">
          {category && (
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#19213A] text-indigo-300 border border-[#232D4E]">
              {category}
            </span>
          )}
          {level && (
            <span className="px-2 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider bg-[#2041F6]/20 text-[#8B75FF] border border-[#2041F6]/40">
              {level}
            </span>
          )}
          {partOfSpeech && (
            <span className="text-xs italic text-slate-400">
              ({partOfSpeech})
            </span>
          )}
        </div>

        {onPlayAudio && (
          <button
            type="button"
            onClick={onPlayAudio}
            className="p-2 rounded-xl bg-[#19213A] hover:bg-[#2041F6] text-indigo-300 hover:text-white transition cursor-pointer border border-[#232D4E]"
            title="Phát âm từ vựng"
          >
            <ArenaIconVolume2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Question / Target Word */}
      <div className="space-y-2 py-2">
        <h2 className="text-xl sm:text-3xl font-black text-[#F4F6FF] leading-snug tracking-tight">
          {prompt}
        </h2>

        {targetWord && (
          <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
            <span className="text-2xl sm:text-4xl font-black text-[#F6C453] tracking-wide">
              {targetWord}
            </span>
            {phonetic && (
              <span className="text-sm sm:text-base font-mono text-slate-400">
                [{phonetic}]
              </span>
            )}
          </div>
        )}

        {exampleSentence && (
          <p className="text-xs sm:text-sm text-slate-400 italic pt-1 border-t border-[#232D4E]/40">
            &ldquo;{exampleSentence}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
};
