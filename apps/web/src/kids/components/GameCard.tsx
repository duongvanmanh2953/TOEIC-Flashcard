import React from 'react';
import { GameDefinition } from '../data/games/gamesRegistry';
import { GameVisualTheme } from '../data/games/gameThemes';
import { KidsIllustration } from '../assets/illustrations/KidsIllustration';
import { RewardCount } from './RewardCount';
import { Play } from 'lucide-react';

interface GameCardProps {
  game: GameDefinition;
  theme: GameVisualTheme;
  onSelect: (gameId: GameDefinition['id']) => void;
  isSelected?: boolean;
}

/**
 * Standardized Kids GameCard Component
 * - Large visual game art canvas (50% card height)
 * - Clear, separate rows: Category Pill -> Title -> Subtitle -> Description -> Dedicated RewardCount -> CTA
 * - Zero cramped inline text / star collision
 * - Max typography text-lg (strictly under text-2xl)
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
      className={`group relative h-full min-h-[460px] flex flex-col rounded-3xl bg-white border-2 transition-all duration-300 cursor-pointer select-none overflow-hidden active:scale-[0.98] ${
        isSelected
          ? 'border-amber-500 shadow-xl ring-4 ring-amber-300 -translate-y-1'
          : `${theme.borderColor} hover:border-amber-400 hover:-translate-y-1 hover:shadow-lg shadow-sm`
      }`}
    >
      {/* ========================================================= */}
      {/* 1. TOP 50%: GAME ART VISUAL CANVAS                       */}
      {/* ========================================================= */}
      <div
        className={`relative h-[220px] w-full ${theme.bgLight} flex items-center justify-center p-6 overflow-hidden border-b-2 border-slate-100 transition-colors`}
      >
        {/* Soft atmospheric background radial gradient */}
        <div
          className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity"
          style={{
            background: `radial-gradient(circle at center, ${theme.glowColor} 0%, transparent 70%)`,
          }}
        />

        {/* Category badge */}
        <div className="absolute top-3.5 left-3.5 z-10">
          <span className={`text-[10px] sm:text-xs font-black px-3 py-1 rounded-full border shadow-xs ${theme.badgeStyle}`}>
            {game.category.toUpperCase()}
          </span>
        </div>

        {/* Large Friendly Illustration with gentle float */}
        <div
          style={{ WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }}
          className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white border-2 border-amber-200/60 shadow-sm flex items-center justify-center p-4 transform transition-transform duration-300 group-hover:scale-[1.06] shrink-0"
        >
          <KidsIllustration
            name={theme.illustration}
            className="w-full h-full object-contain animate-gentle-float"
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. BOTTOM 50%: SPACIOUS CONTENT & ACTION HIERARCHY       */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col justify-between p-5 bg-white space-y-3">
        {/* Title & Bilingual Subtitle */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-xs ${theme.badgeStyle}`}
            >
              <IconComponent className="w-5 h-5" />
            </div>

            <div className="overflow-hidden">
              <h3 className="text-base sm:text-lg font-black text-slate-900 truncate tracking-tight">
                {game.titleVi}
              </h3>
              <p className="text-xs font-bold text-amber-700 truncate">
                {game.titleEn}
              </p>
            </div>
          </div>

          {/* Clean Description */}
          <p className="text-xs font-medium text-slate-600 line-clamp-2 leading-relaxed pt-1">
            {game.descriptionVi}
          </p>
        </div>

        {/* Dedicated Reward Row (Never crowded into title) */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <RewardCount stars={game.starsAwarded} xp={game.xpAwarded} size="sm" />

          <span className="text-[11px] font-bold text-slate-500">
            {game.difficultyVi}
          </span>
        </div>

        {/* Full-width / Prominent CTA Button */}
        <button
          type="button"
          className={`w-full py-2.5 rounded-2xl bg-gradient-to-r ${theme.accentGradient} hover:brightness-105 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xs border-b-2 border-black/20 group-hover:shadow-sm transition-all cursor-pointer active:scale-95`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>CHƠI NGAY</span>
        </button>
      </div>
    </div>
  );
};

export default GameCard;

