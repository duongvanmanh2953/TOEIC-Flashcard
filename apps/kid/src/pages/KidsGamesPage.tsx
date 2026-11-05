// ============================================================================
// VOCALFLOW KIDS — BRIGHT GAME LIBRARY
// Warm Bright Palette: #FFFDF7 • Single Featured Game Anchor • Clean Categories
// Refined Tiles with Crisp Silhouettes • Responsive Desktop/Tablet/Mobile Grid
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { soundManager } from '../services/sound/KidsSoundManager';
import { kidsAudioManager } from '../services/audio/KidsAudioManager';
import { getKidsProgress, updateKidsProgress } from '../curriculum/curriculumProgress';
import {
  KIDS_GAMES_REGISTRY,
  GameId,
  GameDefinition,
} from '../data/games/gamesRegistry';
import { GameCard } from '../components/GameCard';
import { GameErrorBoundary } from '../components/kid-game';
import {
  ListenFindGame,
  MemoryFlipGame,
  WordPopGame,
  SortMatchGame,
  AnimalHuntGame,
  PhonicsMonsterGame,
  TreasureMapGame,
  RocketWordsGame,
  SpeakUnlockGame,
  SimonSaysGame,
  BuildSentenceGame,
  StoryQuestGame,
  DressCharacterGame,
  CookingTimeGame,
  WordBuilderGame,
  WordCatcherGame,
  BossChallengeGame,
  AnimalRescueGame,
} from '../games';
import { Star, Flame, Play, Sparkles } from 'lucide-react';

type GameCategoryFilter = 'all' | 'vocabulary' | 'memory' | 'listening' | 'reflex' | 'challenge';

interface CategoryTab {
  id: GameCategoryFilter;
  label: string;
}

const CATEGORIES: CategoryTab[] = [
  { id: 'all', label: 'Tất Cả' },
  { id: 'vocabulary', label: 'Từ Vựng' },
  { id: 'memory', label: 'Trí Nhớ' },
  { id: 'listening', label: 'Luyện Nghe' },
  { id: 'reflex', label: 'Phản Xạ' },
  { id: 'challenge', label: 'Thử Thách' },
];

export const KidsGamesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialGameParam = searchParams.get('game') as GameId | null;

  // Active game state
  const [activeGameId, setActiveGameId] = useState<GameId | null>(initialGameParam || null);
  const [selectedCategory, setSelectedCategory] = useState<GameCategoryFilter>('all');

  // Kids progress
  const [progress, setProgress] = useState(() => getKidsProgress());

  // Listen to searchParams changes
  useEffect(() => {
    if (initialGameParam && KIDS_GAMES_REGISTRY.some((g) => g.id === initialGameParam)) {
      setActiveGameId(initialGameParam);
    } else if (!initialGameParam) {
      setActiveGameId(null);
    }
  }, [initialGameParam]);

  // Sync progress
  useEffect(() => {
    setProgress(getKidsProgress());
  }, [activeGameId]);

  const handleSelectGame = (gameId: GameId) => {
    soundManager.playPop();
    setActiveGameId(gameId);
    setSearchParams({ game: gameId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToCatalog = () => {
    soundManager.playWhoosh();
    setActiveGameId(null);
    setSearchParams({});
    kidsAudioManager.playGameAmbience('world');
    setProgress(getKidsProgress());
  };

  const handleAwardStars = (earnedStars: number) => {
    const current = getKidsProgress();
    const updated = {
      ...current,
      totalStars: (current.totalStars || 0) + earnedStars,
      xp: (current.xp || 0) + earnedStars * 10,
    };
    updateKidsProgress(updated);
    setProgress(updated);
  };

  // Next game sequence
  const getNextGameId = (currentId: GameId): GameId => {
    const sequence: GameId[] = [
      'memory_flip',
      'listen_find',
      'word_pop',
      'sort_match',
      'animal_hunt',
      'phonics_monster',
      'treasure_hunt',
      'rocket_words',
      'speak_unlock',
      'simon_says',
      'build_sentence',
      'story_quest',
      'dress_character',
      'cooking_time',
      'word_builder',
      'word_catcher',
      'boss_challenge',
    ];
    const idx = sequence.indexOf(currentId);
    if (idx >= 0 && idx < sequence.length - 1) {
      return sequence[idx + 1];
    }
    return 'memory_flip';
  };

  // Featured Game: Memory Match (Card Stack & Swipe Game)
  const featuredGame: GameDefinition = useMemo(() => {
    return (
      KIDS_GAMES_REGISTRY.find((g) => g.id === 'memory_flip') ||
      KIDS_GAMES_REGISTRY[0]
    );
  }, []);

  // Filtered Games by Category
  const filteredGames = useMemo(() => {
    if (selectedCategory === 'all') return KIDS_GAMES_REGISTRY;
    if (selectedCategory === 'vocabulary') {
      return KIDS_GAMES_REGISTRY.filter((g) => g.category === 'vocabulary' || g.category === 'starter');
    }
    if (selectedCategory === 'memory') {
      return KIDS_GAMES_REGISTRY.filter((g) => g.category === 'memory' || g.skillType === 'memory');
    }
    if (selectedCategory === 'listening') {
      return KIDS_GAMES_REGISTRY.filter((g) => g.category === 'listening' || g.skillType === 'listening');
    }
    if (selectedCategory === 'reflex') {
      return KIDS_GAMES_REGISTRY.filter((g) => g.category === 'reflex' || g.category === 'nature');
    }
    if (selectedCategory === 'challenge') {
      return KIDS_GAMES_REGISTRY.filter(
        (g) => g.category === 'challenge' || g.category === 'mastery' || g.category === 'magic'
      );
    }
    return KIDS_GAMES_REGISTRY;
  }, [selectedCategory]);

  // Render the selected active game component
  const renderActiveGame = () => {
    if (!activeGameId) return null;

    const commonProps = {
      onExit: handleBackToCatalog,
      onStarsAwarded: handleAwardStars,
      onNextGame: () => handleSelectGame(getNextGameId(activeGameId)),
    };

    switch (activeGameId) {
      case 'listen_find':
        return <ListenFindGame {...commonProps} />;
      case 'memory_flip':
      case 'match_cards':
        return <MemoryFlipGame {...commonProps} />;
      case 'word_pop':
      case 'balloon_pop':
        return <WordPopGame {...commonProps} />;
      case 'sort_match':
        return <SortMatchGame {...commonProps} />;
      case 'animal_hunt':
        return <AnimalHuntGame {...commonProps} />;
      case 'phonics_monster':
      case 'monster_snack_shop':
        return <PhonicsMonsterGame {...commonProps} />;
      case 'treasure_hunt':
      case 'treasure_island':
      case 'mountain_climb':
        return <TreasureMapGame {...commonProps} />;
      case 'rocket_words':
      case 'sky_words':
      case 'space_rescue':
        return <RocketWordsGame {...commonProps} />;
      case 'speak_unlock':
        return <SpeakUnlockGame {...commonProps} />;
      case 'simon_says':
        return <SimonSaysGame {...commonProps} />;
      case 'build_sentence':
        return <BuildSentenceGame {...commonProps} />;
      case 'story_quest':
        return <StoryQuestGame {...commonProps} />;
      case 'dress_character':
        return <DressCharacterGame {...commonProps} />;
      case 'cooking_time':
        return <CookingTimeGame {...commonProps} />;
      case 'word_builder':
        return <WordBuilderGame {...commonProps} />;
      case 'word_catcher':
        return <WordCatcherGame {...commonProps} />;
      case 'boss_challenge':
        return <BossChallengeGame {...commonProps} />;
      case 'animal_rescue':
        return <AnimalRescueGame {...commonProps} />;
      default:
        return <ListenFindGame {...commonProps} />;
    }
  };

  // If a game is active: Render the FULL-BLEED GAME WORLD with Error Boundary protection
  if (activeGameId) {
    return (
      <GameErrorBoundary onExit={handleBackToCatalog}>
        <div className="w-full select-none flex flex-col items-center justify-center">
          {renderActiveGame()}
        </div>
      </GameErrorBoundary>
    );
  }

  // Otherwise: Render the BRIGHT GAME LIBRARY
  return (
    <div className="w-full max-w-[1240px] mx-auto flex flex-col space-y-5 sm:space-y-7 select-none animate-fadeIn pb-16 px-2 sm:px-6">
      {/* ================================================================ */}
      {/* 1. HEADER (CLEAN, COMPACT, NOT OVERSIZED)                        */}
      {/* ================================================================ */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pt-1 sm:pt-2 border-b border-slate-200/60 pb-3 sm:pb-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Thư Viện Trò Chơi
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
            Chọn trò chơi yêu thích và bắt đầu rèn luyện từ vựng mỗi ngày
          </p>
        </div>

        {/* Player Stats Pills */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 font-black text-xs shadow-2xs">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>{progress?.totalStars || 0} Sao</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 font-black text-xs shadow-2xs">
            <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-600" />
            <span>{progress?.streakDays || 1} Ngày</span>
          </div>
        </div>
      </header>

      {/* ================================================================ */}
      {/* 2. FEATURED GAME (SINGLE VISUAL ANCHOR WITH BIG ARTWORK)         */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-[28px] bg-gradient-to-br from-[#FFF8EE] via-[#FFF3DF] to-[#FFEBD0] border border-amber-200/80 p-4 sm:p-8 lg:p-10 shadow-[0_12px_32px_-6px_rgba(230,160,80,0.14)]">
        {/* Soft Ambient Radiance */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-white/60 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-8">
          <div className="max-w-xl space-y-2.5 sm:space-y-3.5 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-amber-300/80 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-800 shadow-2xs">
              <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-amber-600" />
              <span>⭐ Trò Chơi Nổi Bật</span>
            </div>

            <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-snug">
              Memory Match — Rút Thẻ Trí Nhớ
            </h2>

            <p className="text-xs sm:text-base font-semibold text-slate-600 max-w-lg leading-relaxed">
              Trải nghiệm bộ bài thật nằm trên bàn học! Kéo lá bài trên cùng xuống để khám phá từ vựng, hình minh hoạ sinh động và ghi nhớ tự nhiên.
            </p>

            <div className="pt-1.5 sm:pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2.5 sm:gap-4">
              <button
                type="button"
                onClick={() => handleSelectGame('memory_flip')}
                className="px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs sm:text-base shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                <span>Chơi Ngay →</span>
              </button>

              <span className="text-[11px] sm:text-xs font-bold text-amber-900 bg-white/70 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-amber-200">
                ⭐ +{featuredGame.starsAwarded} Sao Vàng
              </span>
            </div>
          </div>

          {/* BIG ARTWORK (HERO ANCHOR) */}
          <div className="relative w-full max-w-[240px] sm:w-64 sm:h-52 md:w-80 md:h-60 h-36 flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-2xl sm:rounded-[20px] overflow-hidden border border-amber-200/90 shadow-[0_12px_28px_rgba(150,110,60,0.15)] bg-white p-1.5 sm:p-2">
              <img
                src="/assets/games/memory-match/cover.webp"
                alt="Memory Match Deck Cover"
                className="w-full h-full object-cover rounded-xl sm:rounded-[14px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 3. CATEGORY PILLS (HORIZONTAL SCROLL ON MOBILE, CLEAN)           */}
      {/* ================================================================ */}
      <section className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pb-1 -mx-2 px-2 sm:mx-0 sm:px-0 flex-nowrap">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  soundManager.playPop();
                  setSelectedCategory(cat.id);
                }}
                className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl font-black text-xs sm:text-sm cursor-pointer select-none transition-all duration-180 active:scale-95 border whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-amber-400 text-amber-950 border-amber-400 shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200/80 shadow-2xs'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* ============================================================== */}
        {/* 4. GAME TILES GRID (2 COLS MOBILE, 3-4 COLS DESKTOP, GAP 18-24)*/}
        {/* ============================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-5 lg:gap-6 items-stretch pt-1">
          {filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onSelect={handleSelectGame}
              chapterNumber={game.gameNumber}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default KidsGamesPage;
