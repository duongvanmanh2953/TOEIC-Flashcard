import React, { memo } from 'react';
import { GameDefinition } from '../data/games/gamesRegistry';
import { GameVisualTheme, getGameTheme } from '../data/games/gameThemes';
import { KidsIllustration } from '../assets/illustrations/KidsIllustration';
import { ArrowRight, Sparkles } from 'lucide-react';

interface GameCardProps {
  game: GameDefinition;
  theme?: GameVisualTheme;
  onSelect: (gameId: GameDefinition['id']) => void;
  isSelected?: boolean;
  chapterNumber?: number;
}

/**
 * Premium Game Tile Component
 * - Artwork is HERO (floats with depth on soft organic canvas)
 * - Concise, legible metadata (title, concept subtitle, difficulty)
 * - Tactile hover: translateY(-4px), scale(1.01), subtle shadow elevation
 * - Zero visual noise (no nested card-in-card or cluttered badges)
 */
export const GameCard: React.FC<GameCardProps> = memo(({
  game,
  theme: customTheme,
  onSelect,
  isSelected = false,
  chapterNumber,
}) => {
  const theme = customTheme || getGameTheme(game.id);
  const chapter = chapterNumber ?? game.gameNumber;

  return (
    <div
      onClick={() => onSelect(game.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(game.id);
        }
      }}
      className={`group relative h-full min-h-[300px] sm:min-h-[330px] flex flex-col rounded-3xl bg-white/95 backdrop-blur-md transition-all duration-200 ease-out cursor-pointer select-none overflow-hidden border ${
        isSelected
          ? 'border-indigo-400 ring-4 ring-indigo-300/40 shadow-xl -translate-y-1.5'
          : 'border-slate-100 hover:border-indigo-200 shadow-[0_4px_16px_-4px_rgba(20,40,70,0.06)] hover:shadow-[0_16px_32px_-6px_rgba(20,40,70,0.12)] hover:-translate-y-1 hover:scale-[1.01]'
      }`}
    >
      {/* ========================================================= */}
      {/* 1. TOP 65%: HERO ARTWORK CANVAS                           */}
      {/* ========================================================= */}
      <div
        className={`relative h-[180px] sm:h-[200px] w-full ${theme.heroCanvasBg} flex items-center justify-center p-4 overflow-hidden transition-colors`}
      >
        {/* Soft Organic Backdrop Blob */}
        <div
          className={`absolute w-36 h-36 rounded-full ${theme.heroBlobBg} blur-2xl opacity-60 group-hover:scale-110 group-hover:opacity-80 transition-all duration-500`}
        />

        {/* Milestone Tag */}
        <div className="absolute top-3 left-3.5 z-20 pointer-events-none">
          <span
            className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full border backdrop-blur-md shadow-2xs ${theme.tagStyle}`}
          >
            Chặng {String(chapter).padStart(2, '0')}
          </span>
        </div>

        {/* FLOATING HERO ILLUSTRATION */}
        <div className="relative z-10 w-28 h-28 sm:w-34 sm:h-34 flex items-center justify-center transform transition-transform duration-200 ease-out group-hover:scale-105 group-hover:-translate-y-1 filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.1)]">
          <KidsIllustration
            name={theme.illustration}
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. BOTTOM 35%: CLEAN METADATA & ARROW ACTION              */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col justify-between p-4 sm:p-5 bg-white space-y-2.5">
        {/* Title & Subtitle */}
        <div className="space-y-0.5">
          <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-snug truncate group-hover:text-indigo-600 transition-colors">
            {game.titleVi}
          </h3>
          <p className="text-xs font-semibold text-slate-400 truncate">
            {game.titleEn}
          </p>
        </div>

        {/* Footer: Difficulty + Arrow CTA */}
        <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-100/80">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>{game.difficultyVi || 'Phù hợp cho bé'}</span>
          </div>

          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 group-hover:bg-indigo-600 text-slate-500 group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-2xs group-hover:translate-x-0.5">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
});

export default GameCard;
