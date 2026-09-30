import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { soundManager } from '../services/sound/KidsSoundManager';
import { kidsAudioManager } from '../services/audio/KidsAudioManager';
import { getKidsProgress, updateKidsProgress } from '../curriculum/curriculumProgress';
import {
  KIDS_GAMES_REGISTRY,
  KIDS_GAME_WORLDS,
  GameId,
  GameWorldId,
  GameDefinition,
  GameWorld,
} from '../data/games/gamesRegistry';
import { GameRecommendationEngine, GameRecommendation } from '../services/recommendation/GameRecommendationEngine';
import { getGameTheme } from '../data/games/gameThemes';
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
import { BrightFoxSpellingGame } from '../games/spelling/BrightFoxSpellingGame';
import { kidAsset } from '../utils/kidAsset';
import {
  Star,
  Sparkles,
  Flame,
  Trophy,
  ArrowRight,
  Compass,
  Play,
  RotateCcw,
  Volume2,
  CheckCircle,
  MapPin,
  ChevronDown,
  Clock,
  CheckCircle2,
  Globe2,
} from 'lucide-react';

interface WorldVisualInfo {
  illustration: string;
  backdropImage: string;
  ambientGradient: string;
  cardBg: string;
  themeColor: string;
  badgeBg: string;
}

const WORLD_VISUALS: Record<string, WorldVisualInfo> = {
  starter: {
    illustration: 'forest',
    backdropImage: '/kid/worlds/world-word-forest.png',
    ambientGradient: 'from-emerald-500 via-teal-600 to-emerald-700',
    cardBg: 'from-emerald-50 to-teal-50',
    themeColor: '#059669',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  nature: {
    illustration: 'lion',
    backdropImage: '/kid/worlds/world-word-forest.png',
    ambientGradient: 'from-amber-500 via-orange-600 to-amber-700',
    cardBg: 'from-amber-50 to-orange-50',
    themeColor: '#d97706',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  adventure: {
    illustration: 'treasure-chest',
    backdropImage: '/kid/worlds/world-listening-lake.png',
    ambientGradient: 'from-yellow-500 via-amber-600 to-yellow-700',
    cardBg: 'from-yellow-50 to-amber-50',
    themeColor: '#ca8a04',
    badgeBg: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  magic: {
    illustration: 'island',
    backdropImage: '/kid/worlds/world-grammar-castle.png',
    ambientGradient: 'from-purple-600 via-indigo-600 to-violet-800',
    cardBg: 'from-purple-50 to-indigo-50',
    themeColor: '#7c3aed',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  creativity: {
    illustration: 'book',
    backdropImage: '/kid/worlds/world-speaking-mountain.png',
    ambientGradient: 'from-rose-500 via-pink-600 to-rose-700',
    cardBg: 'from-rose-50 to-pink-50',
    themeColor: '#e11d48',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  mastery: {
    illustration: 'trophy',
    backdropImage: '/kid/worlds/world-challenge-arena.png',
    ambientGradient: 'from-red-600 via-purple-700 to-indigo-900',
    cardBg: 'from-rose-50 to-purple-50',
    themeColor: '#4f46e5',
    badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
};

export const KidsGamesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialGameParam = searchParams.get('game') as GameId | null;

  // Active game state
  const [activeGameId, setActiveGameId] = useState<GameId | null>(initialGameParam || null);
  const [selectedWorldTab, setSelectedWorldTab] = useState<'all' | GameWorldId>('all');

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

  // Recommendations for the child
  const recommendations: GameRecommendation[] = useMemo(() => {
    return GameRecommendationEngine.getRecommendations(3);
  }, []);

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

  // Next game sequence in the 17-game adventure journey
  const getNextGameId = (currentId: GameId): GameId => {
    const sequence: GameId[] = [
      'listen_find',
      'memory_flip',
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
    return 'listen_find';
  };

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
      case 'magic_door':
      case 'magic_castle':
        return <SpeakUnlockGame {...commonProps} />;
      case 'simon_says':
        return <SimonSaysGame {...commonProps} />;
      case 'build_sentence':
      case 'train_builder':
      case 'animal_train':
        return <BuildSentenceGame {...commonProps} />;
      case 'story_quest':
      case 'magic_storybook':
      case 'weather_adventure':
        return <StoryQuestGame {...commonProps} />;
      case 'dress_character':
      case 'build_my_robot':
        return <DressCharacterGame {...commonProps} />;
      case 'cooking_time':
        return <CookingTimeGame {...commonProps} />;
      case 'word_builder':
        return (
          <BrightFoxSpellingGame
            onExit={handleBackToCatalog}
            onStarsAwarded={handleAwardStars}
            onNextGame={() => handleSelectGame(getNextGameId(activeGameId))}
          />
        );
      case 'word_catcher':
      case 'listen_catch':
      case 'feed_animal':
        return <WordCatcherGame {...commonProps} />;
      case 'boss_challenge':
      case 'dinosaur_dig':
        return <BossChallengeGame {...commonProps} />;
      case 'animal_rescue':
        return <AnimalRescueGame {...commonProps} />;
      default:
        return <ListenFindGame {...commonProps} />;
    }
  };

  // If a game is active: Render the FULL-BLEED GAME WORLD without nested dashboards
  if (activeGameId) {
    return (
      <div className="w-full select-none flex flex-col items-center justify-center">
        {renderActiveGame()}
      </div>
    );
  }

  // Otherwise: Render the ADVENTURE JOURNEY MAP Catalog
  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col space-y-8 select-none animate-fadeIn pb-12">
      {/* ================================================================ */}
      {/* 1. WORLD WELCOME HERO                                            */}
      {/* ================================================================ */}
      <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 p-6 sm:p-8 lg:p-10 text-white shadow-[0_16px_36px_-8px_rgba(37,99,235,0.25)]">
        {/* Subtle decorative background scenery */}
        <img
          src={kidAsset('/kid/worlds/world-challenge-arena.png')}
          alt="Adventure Backdrop"
          className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-overlay pointer-events-none"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6 min-w-0 flex-1">
            {/* Mascot in tactile glowing pedestal */}
            <div
              onClick={() => soundManager.playPop()}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center p-2.5 shadow-[0_8px_20px_rgba(0,0,0,0.1)] shrink-0 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              <img
                src={kidAsset('/kid/mascot/vivi-trophy.png')}
                alt="Vivi the Fox"
                className="w-full h-full object-contain filter drop-shadow-md animate-gentle-float"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/kid/mascot/vivi-celebrate.png';
                }}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] sm:text-xs font-black uppercase tracking-wider text-sky-100">
                <Compass className="w-3.5 h-3.5 text-white shrink-0" />
                <span>Thế Giới Trò Chơi VocalFlow</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mt-1.5 tracking-tight drop-shadow-xs">
                Chào bé! Cùng bắt đầu phiêu lưu nhé!
              </h1>
              <p className="text-xs sm:text-sm lg:text-base font-semibold text-sky-100 max-w-xl leading-relaxed mt-1">
                Chinh phục 17 trò chơi vui nhộn qua 6 vùng đất kỳ thú để thu thập hàng ngàn sao vàng!
              </p>
            </div>
          </div>

          {/* Player Progress Stats */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 bg-white/15 backdrop-blur-md p-3 rounded-3xl border border-white/30 shadow-xs shrink-0 self-stretch sm:self-auto justify-around sm:justify-start">
            <div className="flex items-center gap-2 px-3.5 py-2 bg-amber-400/95 rounded-2xl text-amber-950 font-black text-xs sm:text-sm shadow-xs">
              <Star className="w-4 h-4 fill-amber-300 text-amber-700" />
              <span>{progress?.totalStars || 0} Sao Vàng</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 bg-rose-500 rounded-2xl text-white font-black text-xs sm:text-sm shadow-xs">
              <Flame className="w-4 h-4 fill-rose-200 text-rose-200" />
              <span>{progress?.streakDays || 1} Ngày</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 bg-indigo-500 rounded-2xl text-white font-black text-xs sm:text-sm shadow-xs">
              <Trophy className="w-4 h-4 text-indigo-200" />
              <span>{progress?.xp || 0} XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 2. TODAY'S ADVENTURE ("Gợi Ý Cho Bé Hôm Nay")                     */}
      {/* ================================================================ */}
      <div className="p-5 sm:p-7 rounded-[36px] bg-white/75 backdrop-blur-xl border-2 border-white/80 shadow-[0_12px_32px_-6px_rgba(20,40,70,0.06)] space-y-5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Nhiệm Vụ Hôm Nay Của Bé
              </h2>
              <p className="text-xs font-bold text-slate-400">
                Bé thử 3 thử thách này để rèn luyện kỹ năng nhé!
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-500 hidden sm:inline">
            3 thử thách nhanh
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {recommendations.map((rec) => {
            const game = rec.game;
            const theme = getGameTheme(game.id);

            return (
              <div
                key={game.id}
                onClick={() => handleSelectGame(game.id)}
                className="group relative overflow-hidden rounded-[28px] bg-white/90 backdrop-blur-md p-4 sm:p-5 shadow-[0_8px_24px_-6px_rgba(20,40,70,0.06)] hover:shadow-[0_16px_32px_-6px_rgba(20,40,70,0.14)] hover:-translate-y-1 transition-all duration-300 cursor-pointer flex items-center justify-between gap-4 border border-white hover:border-sky-300"
              >
                {/* Hero focal mini illustration in soft tinted container */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl ${theme.heroCanvasBg} flex items-center justify-center p-2.5 shrink-0 transform group-hover:scale-105 group-hover:-translate-y-1 transition-transform filter drop-shadow-xs`}
                  >
                    <KidsIllustration
                      name={theme.illustration}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${theme.tagStyle}`}
                    >
                      {rec.badgeLabel || 'Thử thách'}
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-sky-600 transition-colors truncate">
                      {game.titleVi}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Khoảng {game.estimatedMinutes || 3} phút</span>
                    </div>
                  </div>
                </div>

                {/* Tactile Play CTA */}
                <button
                  type="button"
                  className={`px-3.5 py-2 rounded-2xl bg-gradient-to-r ${theme.accentGradient} text-white font-black text-xs flex items-center gap-1.5 shadow-xs group-hover:scale-105 active:scale-95 transition-all shrink-0`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Chơi</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================================================================ */}
      {/* 3. WORLD NAVIGATION / BUTTON TABS (BỎ TOÀN BỘ SCROLL NGANG)       */}
      {/* ================================================================ */}
      <div className="p-5 sm:p-6 rounded-[32px] bg-white/80 backdrop-blur-xl border-2 border-white/85 shadow-[0_10px_30px_-6px_rgba(20,40,70,0.06)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shadow-xs">
              <Globe2 className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Bản Đồ Thế Giới Các Vùng Đất
              </h2>
              <p className="text-xs font-bold text-slate-400">
                Bấm vào một vùng đất để lọc nhanh các chặng thử thách
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-600 self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/60 shadow-2xs">
            {selectedWorldTab === 'all'
              ? '⭐ Đang xem tất cả 17 trò chơi'
              : `⭐ Vùng đất: ${KIDS_GAME_WORLDS.find((w) => w.id === selectedWorldTab)?.nameVi || ''}`}
          </span>
        </div>

        {/* Clean Wrap Button List (No Horizontal Scroll, No Ugly Scrollbar, Crisp Contrast) */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1">
          {/* Button: "Tất Cả Vùng Đất" */}
          <button
            type="button"
            onClick={() => {
              soundManager.playPop();
              setSelectedWorldTab('all');
            }}
            className={`group relative flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl font-black text-xs sm:text-sm cursor-pointer select-none transition-all duration-200 active:scale-95 ${
              selectedWorldTab === 'all'
                ? 'bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30 ring-2 ring-indigo-400 -translate-y-0.5'
                : 'bg-white/90 hover:bg-white text-slate-800 hover:text-indigo-600 border border-slate-200/90 hover:border-indigo-300 shadow-2xs hover:-translate-y-0.5'
            }`}
          >
            <Compass
              className={`w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 ${
                selectedWorldTab === 'all' ? 'text-white' : 'text-indigo-600'
              }`}
            />
            <span className="tracking-tight">Tất Cả Bản Đồ</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-black shrink-0 ${
                selectedWorldTab === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-600'
              }`}
            >
              17
            </span>
          </button>

          {/* Buttons for each World */}
          {KIDS_GAME_WORLDS.map((world) => {
            const isSelected = selectedWorldTab === world.id;

            return (
              <button
                key={world.id}
                type="button"
                onClick={() => {
                  soundManager.playPop();
                  setSelectedWorldTab(world.id);
                }}
                className={`group relative flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl font-black text-xs sm:text-sm cursor-pointer select-none transition-all duration-200 active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30 ring-2 ring-indigo-400 -translate-y-0.5'
                    : 'bg-white/90 hover:bg-white text-slate-800 hover:text-indigo-600 border border-slate-200/90 hover:border-indigo-300 shadow-2xs hover:-translate-y-0.5'
                }`}
              >
                <span className="text-base sm:text-lg leading-none shrink-0 drop-shadow-2xs">
                  {world.icon}
                </span>
                <span className="tracking-tight">{world.nameVi}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-black shrink-0 ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                  }`}
                >
                  {world.gameIds.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================================================================ */}
      {/* 4. WORLD CHAPTERS & GAME CARD GRIDS                              */}
      {/* ================================================================ */}
      <div className="space-y-16">
        {KIDS_GAME_WORLDS.filter(
          (w) => selectedWorldTab === 'all' || w.id === selectedWorldTab
        ).map((world, worldIdx) => {
          const worldGames = KIDS_GAMES_REGISTRY.filter((g) => world.gameIds.includes(g.id));
          const visual = WORLD_VISUALS[world.id] || WORLD_VISUALS.starter;

          return (
            <div key={world.id} className="space-y-6">
              {/* WORLD HERO HEADER (Polished world environment banner) */}
              <div
                className={`relative overflow-hidden rounded-[32px] bg-gradient-to-r ${visual.ambientGradient} p-6 sm:p-8 text-white shadow-[0_12px_32px_-6px_rgba(0,0,0,0.18)] flex flex-col md:flex-row items-center justify-between gap-6`}
              >
                {/* World thematic illustration (Hero of World Header) */}
                <div className="flex items-center gap-5 z-10 min-w-0 flex-1">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center p-3 shadow-inner shrink-0 transform hover:scale-105 transition-transform">
                    <KidsIllustration
                      name={visual.illustration}
                      className="w-full h-full object-contain filter drop-shadow-md animate-gentle-float"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="inline-block px-3 py-0.5 rounded-full bg-black/20 backdrop-blur-md text-[10px] sm:text-xs font-black uppercase tracking-wider text-white">
                      {world.badgeVi}
                    </span>
                    <h2 className="text-xl sm:text-3xl font-black text-white mt-1 tracking-tight drop-shadow-xs">
                      {world.nameVi}
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold text-white/90 max-w-xl leading-relaxed mt-1">
                      {world.descriptionVi}
                    </p>
                  </div>
                </div>

                {/* World Progress Pill & Chapter count */}
                <div className="flex flex-col items-end gap-2 shrink-0 z-10 w-full sm:w-auto">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/30 text-xs font-black">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>{world.gameIds.length} / {world.gameIds.length} Chặng Mở</span>
                  </div>
                </div>
              </div>

              {/* GAME CARDS GRID (3-4 cols desktop, 2 cols tablet, 1 col mobile) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
                {worldGames.map((game, gameIdx) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    onSelect={handleSelectGame}
                    chapterNumber={game.gameNumber}
                  />
                ))}
              </div>

              {/* Connecting Stepping-Stones Trail between worlds */}
              {worldIdx < KIDS_GAME_WORLDS.length - 1 && selectedWorldTab === 'all' && (
                <div className="flex flex-col items-center justify-center py-6 text-slate-300 pointer-events-none select-none space-y-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <div className="w-0.5 h-6 border-l-2 border-dashed border-amber-300" />
                  <div className="w-3.5 h-3.5 rounded-full bg-sky-400" />
                  <div className="w-0.5 h-6 border-l-2 border-dashed border-sky-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KidsGamesPage;
