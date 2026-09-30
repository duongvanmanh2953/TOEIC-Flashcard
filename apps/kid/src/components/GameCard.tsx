// ============================================================================
// VOCALFLOW KIDS — REFINED GAME LIBRARY TILE
// Clear Silhouette • Radius: 18px • Crisp Border • Distinct Hover Elevation
// Artwork is HERO • Concise Legible Metadata • Clean 'Play →' Action
// ============================================================================

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

export const GameCard: React.FC<GameCardProps> = memo(({
  game,
  theme: customTheme,
  onSelect,
  isSelected = false,
  chapterNumber,
}) => {
  const theme = customTheme || getGameTheme(game.id);

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
      className={`group relative h-full flex flex-col rounded-[18px] bg-white transition-all duration-200 ease-out cursor-pointer select-none overflow-hidden border ${
        isSelected
          ? 'border-indigo-400 ring-2 ring-indigo-300/40 shadow-lg -translate-y-1'
          : 'border-slate-200/90 hover:border-indigo-300 shadow-[0_4px_16px_-2px_rgba(45,55,72,0.06)] hover:shadow-[0_14px_28px_-4px_rgba(45,55,72,0.12)] hover:-translate-y-1 hover:bg-[#FDFCF9]'
      }`}
    >
      {/* ========================================================= */}
      {/* 1. ARTWORK CANVAS (HERO VISUAL ANCHOR)                    */}
      {/* ========================================================= */}
      <div
        className={`relative h-[160px] sm:h-[180px] w-full ${theme.heroCanvasBg} flex items-center justify-center p-3 overflow-hidden border-b border-slate-100`}
      >
        {/* Soft Organic Backdrop Blob */}
        <div
          className={`absolute w-32 h-32 rounded-full ${theme.heroBlobBg} blur-xl opacity-50 group-hover:scale-105 group-hover:opacity-70 transition-all duration-300`}
        />

        {/* Floating Illustration */}
        <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center transform transition-transform duration-200 ease-out group-hover:scale-[1.03] filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.08)]">
          <KidsIllustration
            name={theme.illustration}
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. CONCISE METADATA & PLAY ACTION                         */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col justify-between p-3.5 sm:p-4 bg-white group-hover:bg-[#FDFCF9] transition-colors space-y-3">
        {/* Game Title */}
        <div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-snug truncate group-hover:text-indigo-600 transition-colors">
            {game.titleVi}
          </h3>
          <p className="text-[11px] sm:text-xs font-semibold text-slate-400 truncate mt-0.5">
            {game.titleEn}
          </p>
        </div>

        {/* Footer: Small Metadata + Play CTA */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
            <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="truncate">{game.difficultyVi || 'Phù hợp cho bé'}</span>
          </div>

          <div className="inline-flex items-center gap-1 text-xs font-black text-indigo-600 group-hover:text-indigo-700 transition-colors">
            <span>Chơi</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
});

export default GameCard;
