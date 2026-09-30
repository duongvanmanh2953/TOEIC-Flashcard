/**
 * kidsIconSystem.ts
 * Centralized Semantic Icon System for Kids Learning Experience
 * 
 * Rules:
 * - Strictly imports from project standard icon library: 'lucide-react'
 * - Zero emojis or unicode text symbols used as UI icons
 * - Semantic categorization: actions, navigation, gamification, and status
 */

import {
  Compass,
  BookOpen,
  Gamepad2,
  Trophy,
  Mic,
  Headphones,
  Heart,
  Award,
  Volume2,
  VolumeX,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Star,
  Sparkles,
  Flame,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Play,
  Pause,
  Home,
  MapPin,
  Lock,
  Unlock,
  Smile,
  HelpCircle,
  Search,
  Layers,
  Rocket,
  Puzzle,
  Target,
  Clock,
  Shirt,
  Utensils,
  Sun,
  CloudSun,
  Car,
  Languages,
  Trash2,
  X,
  Plus,
  LucideIcon,
} from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  // Navigation & Core Hubs
  home: Home,
  journey: Compass,
  mountain: Compass,
  vocabulary: BookOpen,
  games: Gamepad2,
  island: MapPin,
  world: MapPin,
  parent: ShieldCheck,

  // Gamification & Progression
  progress: Trophy,
  trophy: Trophy,
  award: Award,
  star: Star,
  sparkles: Sparkles,
  streak: Flame,
  heart: Heart,

  // Media & Interaction
  speaking: Mic,
  mic: Mic,
  listening: Headphones,
  soundOn: Volume2,
  soundOff: VolumeX,
  volume: Volume2,
  replay: RotateCcw,
  play: Play,
  pause: Pause,
  languages: Languages,

  // Verification & Status
  correct: CheckCircle2,
  wrong: XCircle,
  lock: Lock,
  unlock: Unlock,
  close: X,
  trash: Trash2,
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
  help: HelpCircle,
  search: Search,

  // Thematic
  puzzle: Puzzle,
  target: Target,
  rocket: Rocket,
  cards: Layers,
  smile: Smile,
  food: Utensils,
  nature: Sun,
  weather: CloudSun,
  clothes: Shirt,
  clock: Clock,
  transport: Car,
};

export function getKidsIcon(name: string, fallback: LucideIcon = Sparkles): LucideIcon {
  return ICON_MAP[name] || fallback;
}
