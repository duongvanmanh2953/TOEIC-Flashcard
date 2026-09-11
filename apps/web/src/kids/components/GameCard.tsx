import React from 'react';
import { GameDefinition } from '../data/games/gamesRegistry';
import { GameVisualTheme } from '../data/games/gameThemes';
import { KidsIllustration } from '../assets/illustrations/KidsIllustration';
import { Star, Play } from 'lucide-react';

interface GameCardProps {
  game: GameDefinition;
  theme: GameVisualTheme;
  onSelect: (gameId: GameDefinition['id']) => void;
  isSelected?: boolean;
}

/**
 * Standardized Kids GameCard Component (Strict adherence to Kids V5 Design Standards)
 * - 45-55% Game Art visual canvas with large friendly children's illustration
 * - 45-55% Informative content hierarchy
 * - Desktop: Title 20-24px, Vietnamese 14-17px, Description 13-15px
 * - Mobile: Title 18-21px, Vietnamese 13-15px
 * - Equal height in grid rows (h-full flex flex-col min-h-[440px])
 * - Subtle hover (translateY(-4px), shadow enhancement, art scale(1.03))
 * - Click scale(0.98) transition
 */
export const GameCard: React.FC<GameCardProps> = ({
  game,
  theme,
  onSelect,
  isSelected = false,
}) => {
  const IconComponent = theme.icon;

  return (
    <div
      onClick={() => onSelect(game.id)}
      className={`group relative h-full min-h-[440px] flex flex-col rounded-3xl bg-white border-3 transition-all duration-300 cursor-pointer select-none overflow-hidden active:scale-[0.98] ${
        isSelected
          ? 'border-amber-500 shadow-xl ring-4 ring-amber-300 -translate-y-1'
          : `${theme.borderColor} hover:border-amber-400 hover:-translate-y-1 hover:shadow-xl shadow-md`
      }`}
    >
      {/* ========================================================= */}
      {/* 1. TOP 45-55%: GAME ART VISUAL CANVAS                    */}
      {/* ========================================================= */}
      <div
        className={`relative h-[50%] min-h-[200px] sm:min-h-[220px] w-full ${theme.bgLight} flex items-center justify-center p-6 overflow-hidden border-b-2 border-slate-100 transition-colors`}
      >
        {/* Soft atmospheric background radial gradient */}
        <div
          className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity"
          style={{
            background: `radial-gradient(circle at center, ${theme.glowColor} 0%, transparent 70%)`,
          }}
        />

        {/* Category & Reward badges */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
          <span className={`text-xs font-black px-3 py-1 rounded-full border shadow-xs ${theme.badgeStyle}`}>
            {game.category.toUpperCase()}
          </span>

          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-950 border border-amber-300 flex items-center gap-1 shadow-xs">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
            <span>+{game.starsAwarded} Sao</span>
          </span>
        </div>

        {/* Large Friendly Illustration (Scales subtly on card hover) */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white/80 backdrop-blur-xs border-2 border-white/90 shadow-sm flex items-center justify-center p-4 transform transition-transform duration-300 group-hover:scale-[1.05]">
          <KidsIllustration
            name={theme.illustration}
            className="w-full h-full object-contain animate-gentle-float"
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. BOTTOM 45-55%: CONTENT & ACTION HIERARCHY             */}
      {/* ========================================================= */}
      <div className="h-[50%] flex-1 flex flex-col justify-between p-5 sm:p-6 bg-white space-y-3">
        {/* Title & Bilingual Branding */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${theme.badgeStyle}`}
            >
              <IconComponent className="w-5 h-5" />
            </div>

            <div className="overflow-hidden">
              <h3 className="text-lg sm:text-xl font-black text-slate-950 truncate tracking-tight">
                {game.titleEn}
              </h3>
              <p className="text-xs sm:text-sm font-bold text-amber-700 truncate">
                {game.titleVi}
              </p>
            </div>
          </div>

          {/* Bilingual Description (Standard 13-15px text) */}
          <p className="text-xs sm:text-sm font-medium text-slate-600 line-clamp-2 leading-relaxed pt-1">
            {game.descriptionVi}
          </p>
        </div>

        {/* Footer Actions: Difficulty Indicator + Play Button */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-500">
            Độ khó: <span className="font-black text-slate-800">{game.difficultyVi}</span>
          </span>

          <button
            type="button"
            className={`px-4 sm:px-5 py-2.5 rounded-2xl bg-gradient-to-r ${theme.accentGradient} hover:brightness-110 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-sm border-b-2 border-black/20 group-hover:shadow-md transition-all cursor-pointer`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>CHƠI NGAY</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameCard;
