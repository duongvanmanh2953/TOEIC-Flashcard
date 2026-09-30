// ============================================================================
// VOCALFLOW KIDS — REVAMPED GAME LIST & ADVENTURE CATALOG
// Clean Hierarchy: Page Header -> Featured Game -> Continue Playing -> Categories -> Game Tiles
// ============================================================================

import React, { useState, useEffect, useMemo, memo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { soundManager } from '../services/sound/KidsSoundManager';
import { kidsAudioManager } from '../services/audio/KidsAudioManager';
import { getKidsProgress, updateKidsProgress } from '../curriculum/curriculumProgress';
import {
  KIDS_GAMES_REGISTRY,
  GameId,
  GameDefinition,
  GameSkillType,
} from '../data/games/gamesRegistry';
import { GameCard } from '../components/GameCard';
import { KidsIllustration } from '../assets/illustrations/KidsIllustration';
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
import { Star, Flame, Trophy, Play, ArrowRight, Sparkles } from 'lucide-react';

type GameCategoryFilter = 'all' | 'vocabulary' | 'memory' | 'listening' | 'reflex' | 'challenge';

interface CategoryTab {
  id: GameCategoryFilter;
  label: string;
  icon: string;
}

const CATEGORIES: CategoryTab[] = [
  { id: 'all', label: 'Tất Cả', icon: '🧭' },
  { id: 'vocabulary', label: 'Từ Vựng', icon: '📚' },
  { id: 'memory', label: 'Trí Nhớ', icon: '🧠' },
  { id: 'listening', label: 'Luyện Nghe', icon: '🎧' },
  { id: 'reflex', label: 'Phản Xạ', icon: '⚡' },
  { id: 'challenge', label: 'Thử Thách', icon: '🏆' },
];

export const KidsGamesPage: React.FC = () => {
  const navigate = useNavigate();
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

  // Featured Game (1 game duy nhất ở đầu trang: Memory Flip / Memory Match)
  const featuredGame: GameDefinition = useMemo(() => {
    return (
      KIDS_GAMES_REGISTRY.find((g) => g.id === 'memory_flip') ||
      KIDS_GAMES_REGISTRY[0]
    );
  }, []);

  // Continue Playing (1-3 game đang học hoặc gần nhất)
  const continueGames: GameDefinition[] = useMemo(() => {
    return [
      KIDS_GAMES_REGISTRY.find((g) => g.id === 'memory_flip'),
      KIDS_GAMES_REGISTRY.find((g) => g.id === 'listen_find'),
      KIDS_GAMES_REGISTRY.find((g) => g.id === 'word_pop'),
    ].filter(Boolean) as GameDefinition[];
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

  // If a game is active: Render the FULL-BLEED GAME WORLD
  if (activeGameId) {
    return (
      <div className="w-full select-none flex flex-col items-center justify-center">
        {renderActiveGame()}
      </div>
    );
  }

  // Otherwise: Render the REVAMPED GAME CATALOG
  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col space-y-8 select-none animate-fadeIn pb-16 px-3 sm:px-6">
      {/* ================================================================ */}
      {/* 1. PAGE HEADER                                                   */}
      {/* ================================================================ */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[11px] font-black uppercase tracking-wider text-indigo-700">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Khu Vườn Trò Chơi VocalFlow</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Chào bé! Cùng học qua trò chơi nhé!
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
            Lựa chọn trò chơi yêu thích để rèn luyện từ vựng và phản xạ
          </p>
        </div>

        {/* Player Stats Pills */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-400 text-amber-950 font-black text-xs shadow-xs">
            <Star className="w-4 h-4 fill-amber-300 text-amber-800" />
            <span>{progress?.totalStars || 0} Sao</span>
          </div>
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-rose-500 text-white font-black text-xs shadow-xs">
            <Flame className="w-4 h-4 fill-rose-200" />
            <span>{progress?.streakDays || 1} Ngày</span>
          </div>
        </div>
      </header>

      {/* ================================================================ */}
      {/* 2. FEATURED GAME (1 GAME DUY NHẤT RỘNG THOÁNG, ARTWORK ĐẸP)      */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden rounded-[32px] sm:rounded-[36px] bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-700 text-white p-6 sm:p-8 lg:p-10 shadow-[0_16px_36px_-8px_rgba(79,70,229,0.28)]">
        {/* Soft Ambient Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl space-y-3 text-center md:text-left">
            <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-black uppercase tracking-wider text-sky-100">
              Khám Phá Hôm Nay
            </span>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {featuredGame.titleVi}
            </h2>

            <p className="text-xs sm:text-base font-semibold text-sky-100 max-w-md leading-relaxed">
              {featuredGame.descriptionVi || 'Lật thẻ tìm từ vựng và hình ảnh tương ứng trên bàn chơi ma thuật!'}
            </p>

            <div className="pt-2 flex items-center justify-center md:justify-start gap-4">
              <button
                type="button"
                onClick={() => handleSelectGame(featuredGame.id)}
                className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-sm sm:text-base shadow-lg shadow-amber-400/25 flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Chơi Ngay</span>
              </button>

              <span className="text-xs font-bold text-sky-200">
                ⭐ +{featuredGame.starsAwarded} Sao Vàng
              </span>
            </div>
          </div>

          {/* Hero Artwork */}
          <div className="relative w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-3xl bg-white/15 backdrop-blur-md border border-white/20 p-4 flex items-center justify-center shadow-inner filter drop-shadow-xl animate-gentle-float">
              <KidsIllustration
                name="memory_flip"
                className="w-full h-full object-contain filter drop-shadow-md"
                alt="Featured Game"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 3. CONTINUE PLAYING (1-3 GAME GẦN NHẤT CÓ TIẾN ĐỘ)              */}
      {/* ================================================================ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Tiếp Tục Chơi</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </h3>
          <span className="text-xs font-bold text-slate-400">
            Lưu tiến độ của bé
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {continueGames.map((game, idx) => {
            const fakeProgress = idx === 0 ? 80 : idx === 1 ? 50 : 25;

            return (
              <div
                key={game.id}
                onClick={() => handleSelectGame(game.id)}
                className="group p-3.5 sm:p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-100 hover:border-indigo-200 shadow-[0_4px_16px_-4px_rgba(20,40,70,0.06)] hover:shadow-[0_12px_24px_-6px_rgba(20,40,70,0.12)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-center gap-3.5"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-50/80 border border-indigo-100/60 p-2 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <KidsIllustration
                    name={game.id}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="text-sm font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                    {game.titleVi}
                  </h4>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${fakeProgress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pt-0.5">
                    <span>{fakeProgress}% Hoàn thành</span>
                    <span className="text-indigo-600 font-black group-hover:translate-x-0.5 transition-transform">
                      Tiếp tục →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================================================================ */}
      {/* 4. COMPACT CATEGORY NAVIGATION (SEGMENTED CONTROL)               */}
      {/* ================================================================ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Kho Trò Chơi ({filteredGames.length})
          </h3>
        </div>

        {/* Compact Segmented Control (Single wrap line, no multi-row mess) */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-100/80 backdrop-blur-md border border-slate-200/60 w-fit">
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
                className={`flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl font-black text-xs sm:text-sm cursor-pointer select-none transition-all duration-200 active:scale-95 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span className="text-sm leading-none">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* ============================================================== */}
        {/* 5. GAME TILES GRID (2 COLS MOBILE, 3-4 COLS DESKTOP)          */}
        {/* ============================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 items-stretch pt-2">
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
