import React from 'react';
import { GameDefinition } from '../data/games/gamesRegistry';
import { GameVisualTheme, getGameTheme } from '../data/games/gameThemes';
import { KidsIllustration } from '../assets/illustrations/KidsIllustration';
import { Play, Sparkles, Star } from 'lucide-react';

interface GameCardProps {
  game: GameDefinition;
  theme?: GameVisualTheme;
  onSelect: (gameId: GameDefinition['id']) => void;
  isSelected?: boolean;
  chapterNumber?: number;
}

/**
 * Redesigned Kids GameCard Component
 * - Premium, tactile EdTech card with character personality
 * - Illustration is the HERO: floats organically without nested square border boxes
 * - Layered elevation, soft shadows, warm pastel color identities
 * - Tactile game CTA "▶ Chơi ngay"
 * - High readability, zero clutter
 */
export const GameCard: React.FC<GameCardProps> = ({
  game,
  theme: customTheme,
  onSelect,
  isSelected = false,
  chapterNumber,
}) => {
  const theme = customTheme || getGameTheme(game.id);
  const IconComponent = theme.icon;
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
      className={`group relative h-full min-h-[420px] flex flex-col rounded-[32px] bg-white/85 backdrop-blur-xl transition-all duration-300 ease-out cursor-pointer select-none overflow-hidden border-2 ${
        isSelected
          ? 'border-indigo-400 ring-4 ring-indigo-300/60 shadow-[0_20px_40px_-10px_rgba(99,102,241,0.3)] -translate-y-2'
          : `border-white/80 shadow-[0_10px_28px_-6px_rgba(20,40,70,0.06)] hover:shadow-[0_22px_45px_-8px_rgba(20,40,70,0.14)] hover:-translate-y-2 hover:border-sky-200 ${theme.hoverBorderColor}`
      }`}
    >
      {/* ========================================================= */}
      {/* 1. TOP 55%: HERO ILLUSTRATION CANVAS                      */}
      {/* ========================================================= */}
      <div
        className={`relative h-[220px] w-full ${theme.heroCanvasBg} flex items-center justify-center p-6 overflow-hidden transition-colors`}
      >
        {/* Soft Organic Backdrop Aura / Blob */}
        <div
          className={`absolute w-44 h-44 rounded-full ${theme.heroBlobBg} blur-2xl opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500`}
        />

        {/* Decorative subtle circles in background */}
        <div className="absolute top-4 right-6 w-12 h-12 rounded-full border border-white/40 pointer-events-none opacity-40" />
        <div className="absolute bottom-3 left-6 w-8 h-8 rounded-full border border-white/30 pointer-events-none opacity-30" />

        {/* Top Floating Badges (Subtle, non-intrusive) */}
        <div className="absolute top-3.5 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          {/* Chapter Milestone Tag */}
          <span
            className={`text-[10px] sm:text-[11px] font-black tracking-wider uppercase px-3 py-1 rounded-full border backdrop-blur-md shadow-2xs ${theme.tagStyle}`}
          >
            Chặng {String(chapter).padStart(2, '0')}
          </span>

          {/* Star Reward Tag */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/90 backdrop-blur-md text-amber-950 font-black text-[11px] shadow-2xs">
            <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-900" />
            <span>+{game.starsAwarded}</span>
          </div>
        </div>

        {/* FLOATING HERO ILLUSTRATION (NO SQUARE BOX! Free-floating with soft drop shadow) */}
        <div className="relative z-10 w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center transform transition-transform duration-300 ease-out group-hover:scale-105 group-hover:-translate-y-1.5 filter drop-shadow-[0_12px_18px_rgba(0,0,0,0.12)]">
          <KidsIllustration
            name={theme.illustration}
            className="w-full h-full object-contain animate-gentle-float"
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. BOTTOM 45%: CONTENT & TACTILE ACTION                   */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col justify-between p-5 bg-white/70 backdrop-blur-md space-y-3">
        {/* Title, Bilingual Subtitle & Description */}
        <div className="space-y-1">
          <div className="flex items-start gap-2.5">
            <div className="flex-1 overflow-hidden">
              <h3
                className={`text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug line-clamp-1 transition-colors ${theme.titleHoverColor}`}
              >
                {game.titleVi}
              </h3>
              <p className="text-xs font-bold text-slate-400 tracking-wide truncate">
                {game.titleEn}
              </p>
            </div>
          </div>

          <p className="text-xs font-medium text-slate-600 line-clamp-2 leading-relaxed pt-1">
            {game.descriptionVi}
          </p>
        </div>

        {/* Action & Reward Row */}
        <div className="pt-2 flex items-center justify-between gap-3">
          {/* Difficulty / Category micro-label */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{game.difficultyVi}</span>
            <span className="text-slate-300">•</span>
            <span>+{game.xpAwarded} XP</span>
          </div>

          {/* Tactile Game CTA Button */}
          <button
            type="button"
            className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl bg-gradient-to-r ${theme.accentGradient} text-white font-black text-xs flex items-center gap-1.5 ${theme.ctaShadow} hover:brightness-105 group-hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shrink-0`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Chơi ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameCard;
