// ============================================================================
// KIDS GAMES SUITE — GAME VISUAL THEMES
// Styling tokens, gradients, badges, and Lucide icons for every mini-game card
// ============================================================================

import React from 'react';
import {
  Headphones,
  Sparkles,
  Gamepad2,
  Compass,
  Rocket,
  Star,
  Volume2,
  BookOpen,
  Heart,
  Palette,
  Utensils,
  Trophy,
  Flame,
  Layers,
  Search,
  Mic,
  Smile,
  LucideIcon,
} from 'lucide-react';
import { KidsIllustrationName } from '../../assets/illustrations/KidsIllustration';
import { GameId } from './gamesRegistry';

export interface GameVisualTheme {
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  borderColor: string;
  bgLight: string;
  glowColor: string;
  badgeStyle: string;
  illustration: KidsIllustrationName;
  accentGradient: string;
}

export const GAME_THEMES: Record<string, GameVisualTheme> = {
  listen_find: {
    icon: Headphones,
    borderColor: 'border-sky-300',
    bgLight: 'bg-gradient-to-b from-sky-50 to-sky-100/60',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    badgeStyle: 'bg-sky-100 text-sky-900 border-sky-300',
    illustration: 'cat',
    accentGradient: 'from-sky-400 to-blue-500',
  },
  memory_flip: {
    icon: Sparkles,
    borderColor: 'border-amber-300',
    bgLight: 'bg-gradient-to-b from-amber-50 to-amber-100/60',
    glowColor: 'rgba(251, 191, 36, 0.4)',
    badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300',
    illustration: 'dog',
    accentGradient: 'from-amber-400 to-orange-500',
  },
  word_pop: {
    icon: Gamepad2,
    borderColor: 'border-rose-300',
    bgLight: 'bg-gradient-to-b from-rose-50 to-rose-100/60',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    badgeStyle: 'bg-rose-100 text-rose-900 border-rose-300',
    illustration: 'balloons',
    accentGradient: 'from-rose-400 to-pink-500',
  },
  sort_match: {
    icon: Layers,
    borderColor: 'border-emerald-300',
    bgLight: 'bg-gradient-to-b from-emerald-50 to-emerald-100/60',
    glowColor: 'rgba(52, 211, 153, 0.4)',
    badgeStyle: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    illustration: 'apple',
    accentGradient: 'from-emerald-400 to-teal-500',
  },
  animal_hunt: {
    icon: Search,
    borderColor: 'border-orange-300',
    bgLight: 'bg-gradient-to-b from-orange-50 to-orange-100/60',
    glowColor: 'rgba(251, 146, 60, 0.4)',
    badgeStyle: 'bg-orange-100 text-orange-900 border-orange-300',
    illustration: 'lion',
    accentGradient: 'from-orange-400 to-amber-500',
  },
  phonics_monster: {
    icon: Smile,
    borderColor: 'border-purple-300',
    bgLight: 'bg-gradient-to-b from-purple-50 to-purple-100/60',
    glowColor: 'rgba(192, 132, 252, 0.4)',
    badgeStyle: 'bg-purple-100 text-purple-900 border-purple-300',
    illustration: 'cookie',
    accentGradient: 'from-purple-400 to-indigo-500',
  },
  listen_catch: {
    icon: Volume2,
    borderColor: 'border-teal-300',
    bgLight: 'bg-gradient-to-b from-teal-50 to-teal-100/60',
    glowColor: 'rgba(45, 212, 191, 0.4)',
    badgeStyle: 'bg-teal-100 text-teal-900 border-teal-300',
    illustration: 'forest',
    accentGradient: 'from-teal-400 to-emerald-500',
  },
  rocket_words: {
    icon: Rocket,
    borderColor: 'border-indigo-300',
    bgLight: 'bg-gradient-to-b from-indigo-50 to-indigo-100/60',
    glowColor: 'rgba(129, 140, 248, 0.4)',
    badgeStyle: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    illustration: 'rocket',
    accentGradient: 'from-indigo-500 to-purple-600',
  },
  mountain_climb: {
    icon: Compass,
    borderColor: 'border-cyan-300',
    bgLight: 'bg-gradient-to-b from-cyan-50 to-cyan-100/60',
    glowColor: 'rgba(34, 211, 238, 0.4)',
    badgeStyle: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    illustration: 'sun',
    accentGradient: 'from-cyan-400 to-blue-500',
  },
  speak_unlock: {
    icon: Mic,
    borderColor: 'border-violet-300',
    bgLight: 'bg-gradient-to-b from-violet-50 to-violet-100/60',
    glowColor: 'rgba(167, 139, 250, 0.4)',
    badgeStyle: 'bg-violet-100 text-violet-900 border-violet-300',
    illustration: 'island',
    accentGradient: 'from-violet-400 to-fuchsia-500',
  },
  build_sentence: {
    icon: BookOpen,
    borderColor: 'border-blue-300',
    bgLight: 'bg-gradient-to-b from-blue-50 to-blue-100/60',
    glowColor: 'rgba(96, 165, 250, 0.4)',
    badgeStyle: 'bg-blue-100 text-blue-900 border-blue-300',
    illustration: 'train',
    accentGradient: 'from-blue-400 to-indigo-500',
  },
  cooking_time: {
    icon: Utensils,
    borderColor: 'border-amber-300',
    bgLight: 'bg-gradient-to-b from-amber-50 to-amber-100/60',
    glowColor: 'rgba(251, 191, 36, 0.4)',
    badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300',
    illustration: 'kitchen',
    accentGradient: 'from-amber-400 to-rose-400',
  },
  story_quest: {
    icon: BookOpen,
    borderColor: 'border-emerald-300',
    bgLight: 'bg-gradient-to-b from-emerald-50 to-emerald-100/60',
    glowColor: 'rgba(52, 211, 153, 0.4)',
    badgeStyle: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    illustration: 'book',
    accentGradient: 'from-emerald-400 to-teal-600',
  },
  dress_character: {
    icon: Palette,
    borderColor: 'border-pink-300',
    bgLight: 'bg-gradient-to-b from-pink-50 to-pink-100/60',
    glowColor: 'rgba(244, 114, 182, 0.4)',
    badgeStyle: 'bg-pink-100 text-pink-900 border-pink-300',
    illustration: 'rabbit',
    accentGradient: 'from-pink-400 to-rose-500',
  },
  treasure_hunt: {
    icon: Compass,
    borderColor: 'border-yellow-300',
    bgLight: 'bg-gradient-to-b from-yellow-50 to-yellow-100/60',
    glowColor: 'rgba(250, 204, 21, 0.4)',
    badgeStyle: 'bg-yellow-100 text-yellow-900 border-yellow-300',
    illustration: 'treasure-chest',
    accentGradient: 'from-yellow-400 to-amber-500',
  },
  boss_challenge: {
    icon: Trophy,
    borderColor: 'border-red-400',
    bgLight: 'bg-gradient-to-b from-red-50 to-red-100/60',
    glowColor: 'rgba(248, 113, 113, 0.4)',
    badgeStyle: 'bg-red-100 text-red-900 border-red-300',
    illustration: 'lion',
    accentGradient: 'from-red-500 to-purple-600',
  },
};

export const DEFAULT_GAME_THEME: GameVisualTheme = {
  icon: Star,
  borderColor: 'border-amber-300',
  bgLight: 'bg-gradient-to-b from-amber-50 to-amber-100/60',
  glowColor: 'rgba(251, 191, 36, 0.4)',
  badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300',
  illustration: 'island',
  accentGradient: 'from-amber-400 to-orange-500',
};

export const getGameTheme = (gameId: string): GameVisualTheme => {
  return GAME_THEMES[gameId] || DEFAULT_GAME_THEME;
};
