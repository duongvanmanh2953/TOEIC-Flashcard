import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MeadowAudioEngine } from '../services/audio/MeadowAudioEngine';
import { meadowStore, MeadowState } from '../core/meadowStateStore';
import { SUNNY_MEADOW_GAMES, SunnyGameItem } from '../games/sunny-meadow/sunnyMeadowRegistry';

import Game1_HungryPicnic from '../games/sunny-meadow/Game1_HungryPicnic';
import Game2_ColorSplashPond from '../games/sunny-meadow/Game2_ColorSplashPond';
import Game3_FireflyLanterns from '../games/sunny-meadow/Game3_FireflyLanterns';
import Game4_MagicVoiceWindmill from '../games/sunny-meadow/Game4_MagicVoiceWindmill';
import Game5_HideAndSeekTree from '../games/sunny-meadow/Game5_HideAndSeekTree';

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
    MeadowAudioEngine.playWoodTap('G5');
    setActiveGameId(id);
    setSearchParams({ game: id });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExitGame = () => {
    MeadowAudioEngine.playWoodTap('D4');
    setActiveGameId(null);
    setSearchParams({});
  };

  // If a game is active, render its interactive stage
  if (activeGameId === 'hungry_picnic') {
    return <Game1_HungryPicnic onExit={handleExitGame} />;
  }
  if (activeGameId === 'color_pond') {
    return <Game2_ColorSplashPond onExit={handleExitGame} />;
  }
  if (activeGameId === 'firefly_phonics') {
    return <Game3_FireflyLanterns onExit={handleExitGame} />;
  }
  if (activeGameId === 'voice_windmill') {
    return <Game4_MagicVoiceWindmill onExit={handleExitGame} />;
  }
  if (activeGameId === 'hide_seek') {
    return <Game5_HideAndSeekTree onExit={handleExitGame} />;
  }

  // Otherwise render the 5 Next-Gen Games Catalog
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col space-y-8 select-none animate-fadeIn pb-16 px-3 sm:px-4">
      {/* 1. Header with Stars counter */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-b border-amber-200/60 pb-5">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3.5 py-1 rounded-full font-display">
            🌿 Sunny Meadow English V2.0
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E293B] font-display mt-1.5 tracking-tight">
            5 Trò Chơi Tương Tác Sinh Thái
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-[#475569] font-body mt-1">
            Không bài tập trắc nghiệm khô khan — Chạm, đút quả, pha màu và thổi gió cùng Cáo Sunny!
          </p>
        </div>

        {/* Child Stars & Streaks HUD */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-950 font-display font-extrabold text-sm shadow-xs">
            <svg className="w-6 h-6"><use href="#svg-star-badge"></use></svg>
            <span>{state.totalStars} Sao Vàng</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-900 font-display font-extrabold text-sm shadow-xs">
            <span className="text-xl">🔥</span>
            <span>{state.streakDays} Ngày</span>
          </div>
        </div>
      </header>

      {/* 2. Featured Game Hero Banner (Game 1: Hungry Woodland Picnic) */}
      <section className="meadow-clay-card p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-[#FFF8EE] via-[#FFF3DF] to-[#FFEBD0] border-4 border-amber-200 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white text-xs font-extrabold uppercase tracking-wider text-amber-900 font-display shadow-2xs border border-amber-300">
              <span>⭐ Trò Chơi Nổi Bật Hôm Nay</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1E293B] font-display leading-tight">
              Tiệc Picnic Đút Quả Cho Thú Rừng
            </h2>

            <p className="text-sm sm:text-base font-semibold text-[#475569] font-body leading-relaxed">
              Bạn Thỏ và Cáo đang rất đói bụng dưới gốc sồi già! Bé hãy lắng nghe câu tiếng Anh để chọn đúng số lượng dâu tây, cà rốt và nghe tiếng nhai <em>"Nom nom nom! Yummy!"</em> giòn tan nhé.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4">
              <button
                type="button"
                onClick={() => handleLaunchGame('hungry_picnic')}
                className="toy-btn toy-btn-green px-8 py-3 text-lg"
              >
                <span>🧺 Đút Thú Ăn Ngay →</span>
              </button>

              <span className="text-xs font-extrabold text-amber-900 bg-white px-3.5 py-2 rounded-xl border border-amber-200 font-display shadow-2xs">
                ⭐ Thưởng +10 Sao & Nhãn Dán
              </span>
            </div>
          </div>

          {/* Hero Art with Chubby Bunny & Picnic Basket */}
          <div className="relative w-48 h-48 sm:w-60 sm:h-60 flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-3xl bg-white/80 p-3 shadow-md border-2 border-amber-200 flex items-center justify-center">
              <svg className="w-36 h-36 animate-bounce-subtle">
                <use href="#svg-chubby-bunny"></use>
              </svg>
            </div>
            {/* Overlay mini basket */}
            <div className="absolute -bottom-2 -right-2 w-16 h-16">
              <svg className="w-full h-full drop-shadow-md">
                <use href="#svg-picnic-basket"></use>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The 5 Next-Gen Games Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E293B] font-display">
            Chọn Thế Giới Nhập Vai Của Bé
          </h2>
          <span className="text-xs font-bold text-slate-500 font-body">
            5 / 5 trò chơi sinh thái đã sẵn sàng
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {SUNNY_MEADOW_GAMES.map((game, idx) => (
            <div
              key={game.id}
              onClick={() => handleLaunchGame(game.id)}
              className="meadow-clay-card p-6 flex flex-col justify-between hover:scale-[1.02] active:scale-[0.98] cursor-pointer transition-all duration-200 bg-white group border-2 border-white hover:border-amber-300 min-h-[300px]"
            >
              {/* Card Top: Badge & SVG Icon */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-display">
                    {game.badge}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-display font-extrabold text-sm flex items-center justify-center">
                    #{idx + 1}
                  </div>
                </div>

                {/* Big Visual Symbol */}
                <div className="w-24 h-24 mx-auto my-3 flex items-center justify-center rounded-3xl bg-gradient-to-tr from-[#FFFDF5] to-amber-50 border border-amber-100 group-hover:scale-110 transition-transform">
                  <svg className="w-16 h-16 drop-shadow-sm">
                    <use href={game.svgIcon}></use>
                  </svg>
                </div>

                <h3 className="text-xl font-extrabold text-[#1E293B] font-display mt-2 group-hover:text-emerald-700 transition-colors text-center">
                  {game.titleVi}
                </h3>
                <p className="text-xs font-bold text-emerald-800 font-display text-center mt-0.5">
                  {game.titleEn}
                </p>
                <p className="text-xs font-semibold text-slate-500 font-body mt-2 text-center leading-relaxed">
                  {game.descriptionVi}
                </p>
              </div>

              {/* Card Bottom Button */}
              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-800 font-display flex items-center gap-1">
                  <svg className="w-4 h-4"><use href="#svg-star-badge"></use></svg>
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
