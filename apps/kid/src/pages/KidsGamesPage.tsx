import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SunnyAudioEngine } from '../services/audio/SunnyAudioEngine';
import { meadowStore, MeadowState } from '../core/meadowStateStore';
import { SUNNY_MEADOW_GAMES, SunnyGameItem } from '../games/sunny-meadow/sunnyMeadowRegistry';

import Game1_SunnyMemoryFlip from '../games/sunny-meadow/Game1_SunnyMemoryFlip';
import Game2_PictureWordMatch from '../games/sunny-meadow/Game2_PictureWordMatch';
import Game3_HungryFoxPicnic from '../games/sunny-meadow/Game3_HungryFoxPicnic';
import Game4_SpellingBlocks from '../games/sunny-meadow/Game4_SpellingBlocks';

export const KidsGamesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const gameParam = searchParams.get('game') as SunnyGameItem['id'] | null;

  const [activeGameId, setActiveGameId] = useState<SunnyGameItem['id'] | null>(gameParam);
  const [state, setState] = useState<MeadowState>(() => meadowStore.getState());

  useEffect(() => {
    const unsub = meadowStore.subscribe((s) => setState(s));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (gameParam && SUNNY_MEADOW_GAMES.some((g) => g.id === gameParam)) {
      setActiveGameId(gameParam);
    } else {
      setActiveGameId(null);
    }
  }, [gameParam]);

  const handleLaunchGame = (id: SunnyGameItem['id']) => {
    SunnyAudioEngine.playClick();
    setActiveGameId(id);
    setSearchParams({ game: id });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExitGame = () => {
    SunnyAudioEngine.playClick();
    setActiveGameId(null);
    setSearchParams({});
  };

  // If a game is active, render its interactive stage
  if (activeGameId === 'sunny_memory_flip') {
    return <Game1_SunnyMemoryFlip onExit={handleExitGame} />;
  }
  if (activeGameId === 'picture_word_match') {
    return <Game2_PictureWordMatch onExit={handleExitGame} />;
  }
  if (activeGameId === 'hungry_fox_picnic') {
    return <Game3_HungryFoxPicnic onExit={handleExitGame} />;
  }
  if (activeGameId === 'woodland_spelling') {
    return <Game4_SpellingBlocks onExit={handleExitGame} />;
  }

  // Otherwise render the Games Catalog
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col space-y-8 select-none animate-fadeIn pb-16 px-3 sm:px-4">
      {/* 1. Header with Stars counter */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-b border-amber-200/60 pb-5">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3.5 py-1 rounded-full font-display border border-emerald-300">
            🌿 Sunny Meadow English V4.0
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0F172A] font-display mt-1.5 tracking-tight">
            Trò Chơi Tương Tác Sân Khấu Căn Giữa
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-[#475569] font-body mt-1">
            Không tràn chữ, 100% thẻ bài có hình ảnh SVG minh họa sinh động cùng Cáo Sunny!
          </p>
        </div>

        {/* Child Stars & Streaks HUD */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 font-display font-black text-sm shadow-xs">
            <svg className="w-6 h-6">
              <use href="#svg-star-gold"></use>
            </svg>
            <span>{state.totalStars} Sao Vàng</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-900 font-display font-black text-sm shadow-xs">
            <span className="text-xl">🔥</span>
            <span>{state.streakDays} Ngày</span>
          </div>
        </div>
      </header>

      {/* 2. Featured Game Hero Banner (Game 1: Sunny's Memory Flip Cards) */}
      <section className="meadow-clay-card p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-[#FFF8EE] via-[#FFF3DF] to-[#FFEBD0] border-4 border-amber-200 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white text-xs font-black uppercase tracking-wider text-amber-900 font-display shadow-2xs border border-amber-300">
              <span>⭐ Trò Chơi Nổi Bật: Lật Thẻ Rừng Xanh</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0F172A] font-display leading-tight">
              Lật Thẻ Trí Nhớ Rừng Xanh
            </h2>

            <p className="text-sm sm:text-base font-semibold text-[#475569] font-body leading-relaxed">
              Lưới thẻ bài căn giữa hoàn hảo, mặt trước kết hợp cả [Hình SVG + Chữ viết] giúp bé vừa học vừa nhớ lâu, tuyệt đối không bị tràn viền!
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4">
              <button
                type="button"
                onClick={() => handleLaunchGame('sunny_memory_flip')}
                className="toy-btn toy-btn-green px-8 py-3 text-lg"
              >
                <span>🎴 Chơi Lật Thẻ Ngay →</span>
              </button>

              <span className="text-xs font-black text-amber-900 bg-white px-3.5 py-2 rounded-xl border border-amber-200 font-display shadow-2xs">
                ⭐ Thưởng +15 Sao & Đánh giá 3 Sao
              </span>
            </div>
          </div>

          {/* Hero Art with Sunny Fox & 3D Card Leaf */}
          <div className="relative w-48 h-48 sm:w-60 sm:h-60 flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-3xl bg-white/80 p-3 shadow-md border-2 border-amber-200 flex items-center justify-center">
              <svg className="w-36 h-36 animate-bounce-subtle">
                <use href="#svg-sunny-fox"></use>
              </svg>
            </div>
            <div className="absolute -bottom-2 -right-2 w-16 h-20 shadow-lg rounded-xl overflow-hidden">
              <svg className="w-full h-full">
                <use href="#svg-card-back"></use>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The 4 Games Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] font-display">
            Chọn Thế Giới Nhập Vai Của Bé
          </h2>
          <span className="text-xs font-bold text-slate-500 font-body">
            4 / 4 trò chơi sinh thái V4.0 sẵn sàng
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SUNNY_MEADOW_GAMES.map((game, idx) => (
            <div
              key={game.id}
              onClick={() => handleLaunchGame(game.id)}
              className="meadow-clay-card p-6 flex flex-col justify-between hover:scale-[1.02] active:scale-[0.98] cursor-pointer transition-all duration-200 bg-white group border-2 border-[#BAE6FD] hover:border-amber-400 min-h-[310px] shadow-sm hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-display">
                    {game.badge}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-display font-black text-sm flex items-center justify-center">
                    #{idx + 1}
                  </div>
                </div>

                {/* Big Visual Symbol */}
                <div className="w-24 h-24 mx-auto my-3 flex items-center justify-center rounded-3xl bg-gradient-to-tr from-[#FFFDF5] to-amber-50 border border-amber-100 group-hover:scale-110 transition-transform">
                  <svg className="w-16 h-16 drop-shadow-sm">
                    <use href={game.svgIcon}></use>
                  </svg>
                </div>

                <h3 className="text-lg font-black text-[#0F172A] font-display mt-2 group-hover:text-emerald-700 transition-colors text-center">
                  {game.titleVi}
                </h3>
                <p className="text-xs font-bold text-emerald-800 font-display text-center mt-0.5">
                  {game.titleEn}
                </p>
                <p className="text-xs font-semibold text-slate-600 font-body mt-2 text-center leading-relaxed">
                  {game.descriptionVi}
                </p>
              </div>

              {/* Card Bottom Button */}
              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-black text-amber-800 font-display flex items-center gap-1">
                  <svg className="w-4 h-4">
                    <use href="#svg-star-gold"></use>
                  </svg>
                  <span>+{game.starsAwarded} Sao</span>
                </span>
                <button
                  type="button"
                  className="toy-btn toy-btn-green !min-h-[44px] !py-1.5 !px-4 text-sm"
                >
                  Chơi Ngay ▶
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default KidsGamesPage;
