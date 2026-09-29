import React, { useState, useEffect, useMemo } from 'react';
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
} from '../data/games/gamesRegistry';
import { GameRecommendationEngine, RecommendedGame } from '../services/recommendation/GameRecommendationEngine';
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
} from 'lucide-react';

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
  const recommendations: RecommendedGame[] = useMemo(() => {
    return GameRecommendationEngine.getRecommendations(progress, 3);
  }, [progress]);

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
        return <WordBuilderGame {...commonProps} />;
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
    <div className="w-full space-y-6 sm:space-y-8 select-none pb-6">
      {/* ================================================================ */}
      {/* 1. HERO BANNER: ADVENTURE STATS & WELCOME                        */}
      {/* ================================================================ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-500 p-5 sm:p-7 lg:p-8 text-white shadow-sm border border-sky-300/40">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-3 right-10 text-5xl opacity-20 select-none pointer-events-none animate-pulse">
          ✨
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl sm:text-4xl lg:text-5xl shadow-inner shrink-0 animate-bounce">
              🐻
            </div>
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] sm:text-xs font-black uppercase tracking-wider text-white">
                <Compass className="w-3.5 h-3.5 text-white shrink-0" />
                <span>Hành Trình Thám Hiểm Tiếng Anh</span>
              </div>
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-white mt-1 drop-shadow-xs">
                👋 Chào bé! Cùng phiêu lưu nhé!
              </h1>
              <p className="text-xs sm:text-sm lg:text-base font-semibold text-sky-100 max-w-xl leading-snug mt-0.5">
                Khám phá 6 Thế giới kỳ diệu qua 17 trò chơi độc bản: Nghe, Chạm, Nói, Đánh vần và Ghép câu!
              </p>
            </div>
          </div>

          {/* Liquid Glass Player Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-white/20 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-white/30 shadow-xs shrink-0 self-stretch sm:self-auto justify-around sm:justify-start">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-400/90 rounded-xl text-amber-950 font-black text-xs sm:text-sm shadow-2xs">
              <Star className="w-4 h-4 fill-amber-300 text-amber-600" />
              <span>{progress?.totalStars || 0} Sao</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500 rounded-xl text-white font-black text-xs sm:text-sm shadow-2xs">
              <Flame className="w-4 h-4 fill-rose-200 text-rose-200" />
              <span>{progress?.streak || 1} Ngày</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500 rounded-xl text-white font-black text-xs sm:text-sm shadow-2xs">
              <Trophy className="w-4 h-4 text-indigo-200" />
              <span>{progress?.xp || 0} XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 2. RECOMMENDED SPOTLIGHT FOR THE DAY                             */}
      {/* ================================================================ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              Gợi Ý Cho Bé Hôm Nay
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-500">
            Dựa trên kỹ năng cần rèn luyện
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {recommendations.map((rec) => {
            const game = rec.game;
            return (
              <div
                key={rec.gameId}
                onClick={() => handleSelectGame(rec.gameId)}
                className="group relative overflow-hidden rounded-3xl bg-white p-5 border border-slate-200/90 hover:border-sky-300 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer flex items-center justify-between hover:-translate-y-1 select-none"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-150 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform shadow-2xs">
                    {game.icon}
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-150 text-[10px] font-black uppercase">
                      {rec.reason}
                    </span>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-sky-600 transition-colors mt-0.5">
                      {game.titleVi}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold line-clamp-1">
                      {game.titleEn}
                    </p>
                  </div>
                </div>

                <button className="p-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black shadow-xs group-hover:scale-105 active:scale-95 transition-all">
                  <Play className="w-4 h-4 fill-current" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================================================================ */}
      {/* 3. WORLD NAVIGATION QUICK ANCHORS                                */}
      {/* ================================================================ */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedWorldTab('all')}
          className={`h-11 px-4 rounded-2xl font-black text-xs sm:text-sm shrink-0 flex items-center gap-2 border transition-all cursor-pointer ${
            selectedWorldTab === 'all'
              ? 'bg-sky-500 text-white border-sky-500 shadow-xs scale-102'
              : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300'
          }`}
        >
          <span>🌟</span>
          <span>Toàn Bộ Bản Đồ (17 Game)</span>
        </button>

        {KIDS_GAME_WORLDS.map((world) => (
          <button
            key={world.id}
            onClick={() => setSelectedWorldTab(world.id)}
            className={`h-11 px-4 rounded-2xl font-black text-xs sm:text-sm shrink-0 flex items-center gap-2 border transition-all cursor-pointer ${
              selectedWorldTab === world.id
                ? `bg-gradient-to-r ${world.gradient} text-white border-transparent shadow-xs scale-102`
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
            }`}
          >
            <span>{world.icon}</span>
            <span>{world.nameVi}</span>
            <span className="text-[10px] opacity-80 px-1.5 py-0.5 rounded-full bg-black/10">
              {world.gameIds.length}
            </span>
          </button>
        ))}
      </div>

      {/* ================================================================ */}
      {/* 4. THE ADVENTURE JOURNEY MAP (WINDING TRAIL ACROSS 6 WORLDS)     */}
      {/* ================================================================ */}
      <div className="space-y-12 relative">
        {KIDS_GAME_WORLDS.filter(
          (w) => selectedWorldTab === 'all' || w.id === selectedWorldTab
        ).map((world, worldIdx) => {
          const worldGames = KIDS_GAMES_REGISTRY.filter((g) => world.gameIds.includes(g.id));

          return (
            <div key={world.id} className="space-y-6 relative">
              {/* World Kingdom Banner */}
              <div
                className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${world.gradient} p-5 sm:p-6 text-white shadow-xs border border-white/40 flex items-center justify-between`}
              >
                <div className="flex items-center gap-3 z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-3xl shadow-inner">
                    {world.icon}
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-black/15 text-[10px] font-black uppercase tracking-wider">
                      {world.badgeVi}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black drop-shadow-xs mt-0.5">
                      {world.nameEn} — {world.nameVi}
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold opacity-90">
                      {world.descriptionVi}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/30 text-xs font-black">
                  <span>{world.gameIds.length} Chặng</span>
                </div>
              </div>

              {/* Game Milestone Cards (Artwork occupies 65% of card) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {worldGames.map((game) => (
                  <div
                    key={game.id}
                    onClick={() => handleSelectGame(game.id)}
                    className="group relative overflow-hidden rounded-3xl bg-white p-5 border border-slate-200/90 hover:border-sky-300 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1 select-none"
                  >
                    {/* Card Header: Milestone number & Difficulty */}
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black tracking-wider">
                        CHẶNG #{String(game.gameNumber).padStart(2, '0')}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-black border border-amber-200/80">
                        {game.difficultyVi}
                      </span>
                    </div>

                    {/* Massive 65% Artwork Canvas */}
                    <div className="my-6 flex flex-col items-center justify-center relative">
                      <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-center text-6xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-2xs">
                        {game.icon}
                      </div>

                      {/* Fantasy Badge Tag */}
                      <span className="mt-3 px-3 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {game.fantasyVi}
                      </span>
                    </div>

                    {/* Game Details */}
                    <div className="space-y-1 text-center">
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-sky-600 transition-colors">
                        {game.titleVi}
                      </h3>
                      <p className="text-xs font-bold text-sky-600">
                        {game.titleEn}
                      </p>
                      <p className="text-xs text-slate-600 font-medium line-clamp-2 pt-1">
                        {game.coreMechanicVi}
                      </p>
                    </div>

                    {/* Play Button & Reward Footer */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs font-black text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>+{game.starsAwarded} Sao</span>
                      </div>

                      <button className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-all">
                        <span>CHƠI NGAY</span>
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Connecting Stepping-Stones Trail between worlds */}
              {worldIdx < KIDS_GAME_WORLDS.length - 1 && selectedWorldTab === 'all' && (
                <div className="flex flex-col items-center justify-center py-6 text-slate-300 pointer-events-none select-none space-y-1">
                  <span className="text-2xl animate-bounce">👣</span>
                  <div className="w-1 h-6 border-l-2 border-dashed border-amber-300" />
                  <span className="text-lg">⭐</span>
                  <div className="w-1 h-6 border-l-2 border-dashed border-amber-300" />
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
