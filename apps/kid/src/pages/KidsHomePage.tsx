import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SunnySoundFX } from '../services/audio/SunnySoundFX';
import { BilingualVoiceEngine } from '../services/audio/BilingualVoiceEngine';
import { SunnyAudioEngine } from '../services/audio/SunnyAudioEngine';
import { meadowStore, MeadowState } from '../core/meadowStateStore';
import { SUNNY_MEADOW_GAMES } from '../games/sunny-meadow/sunnyMeadowRegistry';
import StickerBookModal from '../components/StickerBookModal';

export const KidsHomePage: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<MeadowState>(() => meadowStore.getState());
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [stickerModalOpen, setStickerModalOpen] = useState(false);

  useEffect(() => {
    const unsub = meadowStore.subscribe((s) => setState(s));
    return () => unsub();
  }, []);

  useEffect(() => {
    // Gentle bilingual greeting once per session
    const alreadyGreeted = sessionStorage.getItem('sunny_meadow_greeted');
    if (!alreadyGreeted) {
      sessionStorage.setItem('sunny_meadow_greeted', 'true');
      const timer = setTimeout(() => {
        SunnySoundFX.playStarAward(1);
        BilingualVoiceEngine.speakBilingual(
          'Xin chào bé yêu! Chào mừng bé đến với Sunny Meadow English! Cùng Cáo Sunny học tiếng Anh thật vui nhé!',
          'Hello little friend! Welcome to Sunny Meadow English! Let us learn and have fun together!'
        );
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSpeakWord = (word: string, meaning: string, e: React.MouseEvent) => {
    e.stopPropagation();
    SunnyAudioEngine.playClick();
    setPlayingWord(word);
    SunnyAudioEngine.speakBilingual(meaning, word);
    setTimeout(() => setPlayingWord(null), 1200);
  };

  const handleLaunchGame = (gameId: string) => {
    SunnyAudioEngine.playClick();
    navigate(`/games?game=${gameId}`);
  };

  const dailyWords = [
    { word: 'apple', meaning: 'Quả táo đỏ', symbol: '#svg-apple' },
    { word: 'banana', meaning: 'Quả chuối vàng', symbol: '#svg-banana' },
    { word: 'strawberry', meaning: 'Dâu tây đỏ', symbol: '#svg-strawberry' },
    { word: 'orange', meaning: 'Quả cam ngọt', symbol: '#svg-orange' },
    { word: 'cat', meaning: 'Con mèo cam', symbol: '#svg-cat' },
  ];

  const unlockedStickersCount = state.stickers.length;

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col space-y-6 sm:space-y-8 select-none animate-fadeIn pb-16 px-3 sm:px-4">
      {/* ===================================================================== */}
      {/* 1. LARGE HERO CLAY CARD: SUNNY MEADOW EXPEDITION                     */}
      {/* ===================================================================== */}
      <section className="meadow-clay-card p-6 sm:p-8 lg:p-10 bg-gradient-to-r from-[#D8F3FF] via-[#FFFDF5] to-[#80ED99]/40 border-4 border-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Soft floating nature particles */}
        <div className="absolute top-3 left-10 text-2xl animate-bounce">🍃</div>
        <div className="absolute bottom-4 left-1/3 text-xl animate-pulse">✨</div>
        <div className="absolute top-4 right-1/4 text-2xl animate-pulse">🦋</div>

        {/* Hero Text */}
        <div className="relative z-10 max-w-lg space-y-3 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-xs font-extrabold uppercase tracking-wider text-emerald-800 font-display shadow-2xs border border-emerald-200">
            <span>🦊 Khu Rừng Học Tiếng Anh Cho Bé (V3.0)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#0F172A] font-display tracking-tight leading-tight">
            Cùng Cáo Sunny Khám Phá Rừng Xanh!
          </h1>

          <p className="text-sm sm:text-base font-semibold text-[#475569] font-body leading-relaxed">
            Học tiếng Anh tự nhiên qua 5 trò chơi sinh thái: lật thẻ 3D, đút quả picnic, pha màu hồ sen, bắt đom đóm chữ cái và thổi cối xay gió!
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4">
            <button
              onClick={() => handleLaunchGame('sunny_memory_flip')}
              className="toy-btn toy-btn-green px-8 py-3 text-lg"
            >
              <span>🎴 Khám Phá Trò Chơi Ngay ▶</span>
            </button>

            <button
              onClick={() => {
                SunnySoundFX.playButtonClick();
                setStickerModalOpen(true);
              }}
              className="toy-btn toy-btn-amber px-6 py-3 text-base"
            >
              <span>📖 Sổ Nhãn Dán ({unlockedStickersCount}/12)</span>
            </button>
          </div>
        </div>

        {/* Mascot Hero: Sunny the Fox */}
        <div
          onClick={() => {
            SunnySoundFX.playButtonClick();
            BilingualVoiceEngine.speakBilingual(
              'Xin chào bé! Tớ là Cáo Sunny! Cùng tớ khám phá rừng xanh và học tiếng Anh thật vui nhé!',
              'Hello little friend! I am Sunny the Fox! Let us play and learn English together!'
            );
          }}
          className="relative w-52 h-52 sm:w-64 sm:h-64 flex items-center justify-center shrink-0 cursor-pointer group"
          title="Chạm vào bạn Cáo Sunny để nghe giọng nói"
        >
          <div className="w-full h-full rounded-full bg-white/80 p-4 shadow-lg border-4 border-amber-300 flex items-center justify-center group-hover:scale-105 transition-transform">
            <svg className="w-full h-full drop-shadow-md">
              <use href="#svg-sunny-fox"></use>
            </svg>
          </div>
          {/* Mini speech balloon */}
          <div className="absolute -top-2 right-2 bg-white px-3.5 py-1.5 rounded-2xl border-2 border-emerald-400 shadow-md font-display font-extrabold text-emerald-800 text-xs sm:text-sm animate-bounce">
            "Hello, Friend!" 🦊
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 2. 5 PLAYABLE ECOLOGICAL MINI-GAMES CARDS                            */}
      {/* ===================================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-display">
              5 Trò Chơi Tương Tác Sinh Thái Mới
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 font-body">
              Chạm và tương tác trực quan — Cáo Sunny hướng dẫn song ngữ Việt - Anh ấm áp!
            </p>
          </div>
          <button
            onClick={() => navigate('/games')}
            className="text-sm font-extrabold text-emerald-700 hover:text-emerald-800 font-display flex items-center gap-1 cursor-pointer"
          >
            <span>Xem tất cả</span>
            <span>→</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SUNNY_MEADOW_GAMES.map((game) => (
            <div
              key={game.id}
              onClick={() => handleLaunchGame(game.id)}
              className="meadow-clay-card p-6 flex flex-col justify-between hover:scale-[1.02] active:scale-[0.98] cursor-pointer transition-all duration-200 bg-white group border-2 border-[#BAE6FD] hover:border-amber-400 min-h-[260px] shadow-sm hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-display">
                    {game.badge}
                  </span>
                  <span className="text-xs font-extrabold text-amber-800 font-display flex items-center gap-1">
                    <svg className="w-4 h-4">
                      <use href="#svg-star-gold"></use>
                    </svg>
                    <span>+{game.starsAwarded} Sao</span>
                  </span>
                </div>

                <div className="w-20 h-20 mx-auto my-2 flex items-center justify-center rounded-2xl bg-[#FFFDF5] border border-amber-100 group-hover:scale-110 transition-transform">
                  <svg className="w-14 h-14 drop-shadow-xs">
                    <use href={game.svgIcon}></use>
                  </svg>
                </div>

                <h3 className="text-lg font-extrabold text-[#0F172A] font-display text-center mt-1 group-hover:text-emerald-700 transition-colors">
                  {game.titleVi}
                </h3>
                <p className="text-xs font-semibold text-slate-500 font-body text-center mt-1 leading-snug">
                  {game.descriptionVi}
                </p>
              </div>

              <div className="pt-3 mt-2 border-t border-slate-100 flex justify-center">
                <button
                  type="button"
                  className="toy-btn toy-btn-green !min-h-[42px] !py-1 !px-5 text-sm w-full"
                >
                  Vào Chơi Ngay ▶
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. DAILY MEADOW VOCABULARY TRAY (TAP-TO-SPEAK)                       */}
      {/* ===================================================================== */}
      <section className="meadow-clay-card p-6 sm:p-8 bg-[#FFFDF5] border-4 border-white shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl font-display">
              🔊
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] font-display">
                Từ Vựng Tự Nhiên Hôm Nay (Tap-to-Speak)
              </h2>
              <p className="text-xs font-semibold text-slate-500 font-body">
                Bé chạm vào từng quả và vật phẩm để nghe phát âm tiếng Anh chuẩn nhé!
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 pt-1">
          {dailyWords.map((item) => (
            <button
              key={item.word}
              type="button"
              onClick={(e) => handleSpeakWord(item.word, item.meaning, e)}
              className={`meadow-clay-card p-4 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all active:scale-95 min-h-[140px] bg-white hover:border-amber-300 ${
                playingWord === item.word ? 'ring-4 ring-amber-400 scale-105' : 'hover:scale-105'
              }`}
            >
              <div className="w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full drop-shadow-sm">
                  <use href={item.symbol}></use>
                </svg>
              </div>

              <div>
                <p className="font-display font-extrabold text-[#0F172A] text-lg leading-tight uppercase">
                  {item.word}
                </p>
                <p className="font-body text-xs font-bold text-slate-500 mt-0.5">
                  {item.meaning}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 4. STICKER BOOK MODAL                                                 */}
      {/* ===================================================================== */}
      <StickerBookModal
        isOpen={stickerModalOpen}
        onClose={() => setStickerModalOpen(false)}
      />
    </div>
  );
};

export default KidsHomePage;
