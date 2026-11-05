import React from 'react';
import { useNavigate } from 'react-router-dom';
import { soundManager } from '../services/sound/KidsSoundManager';
import { kidAsset } from '../utils/kidAsset';
import { Home, LayoutGrid, Info, Sparkles } from 'lucide-react';

export const BrightFoxActivityCards: React.FC = () => {
  const navigate = useNavigate();

  const handleCardClick = (path: string) => {
    soundManager.playPop();
    navigate(path);
  };

  return (
    <div className="w-full flex flex-col select-none py-1">
      {/* Container simulating the playful clean card frame */}
      <div className="w-full bg-gradient-to-b from-sky-400 via-sky-200 to-sky-100 rounded-2xl sm:rounded-[36px] p-3.5 sm:p-7 lg:p-8 shadow-md border-2 sm:border-4 border-white/90 relative overflow-hidden">
        {/* Soft Background Clouds */}
        <div className="absolute top-8 left-4 w-28 h-12 bg-white/60 rounded-full blur-[1px] pointer-events-none" />
        <div className="absolute top-12 right-6 w-36 h-14 bg-white/60 rounded-full blur-[1px] pointer-events-none" />

        {/* TOP TAG & TITLE */}
        <div className="relative z-10 flex flex-col items-center text-center mb-4 sm:mb-6">
          <div className="self-center sm:self-end px-3 sm:px-4 py-1 rounded-full bg-emerald-500 text-white font-black text-[11px] sm:text-sm shadow-md mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            <span>Cho bé 3–8 tuổi • Ages 3–5</span>
          </div>

          <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-[#1E3A8A] tracking-tight drop-shadow-xs">
            What do you want to do?
          </h2>
          <p className="text-[11px] sm:text-sm font-bold text-sky-800/80 mt-0.5 sm:mt-1">
            Bé muốn tham gia hoạt động thú vị nào hôm nay?
          </p>
        </div>

        {/* 4 BRIGHT SQUIRCLE ACTIVITY CARDS (2x2 GRID) */}
        <div className="relative z-10 grid grid-cols-2 gap-2.5 sm:gap-5 mb-5 sm:mb-8">
          {/* 1. NUMBERS (ORANGE) */}
          <div
            onClick={() => handleCardClick('/kids/games?game=sort_match')}
            className="group relative h-36 sm:h-52 rounded-2xl sm:rounded-[32px] bg-[#FF9633] hover:bg-[#ff8a1a] border-2 sm:border-4 border-white/90 shadow-lg sm:shadow-xl cursor-pointer p-3 sm:p-5 flex flex-col justify-between items-center text-white transition-all duration-200 hover:-translate-y-1.5 hover:shadow-2xl active:scale-95 overflow-hidden"
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/15 rounded-full pointer-events-none" />
            <div className="flex items-center justify-between w-full px-0.5 sm:px-1">
              <h3 className="text-base sm:text-2xl font-black tracking-wide drop-shadow-sm">
                Numbers
              </h3>
              <div className="flex items-center gap-0.5 sm:gap-1 font-black text-amber-200 text-xs sm:text-sm">
                <span>1</span>
                <span>2</span>
                <span>3</span>
              </div>
            </div>

            {/* Vivi Study Mascot with Number Badge */}
            <div className="relative flex items-center justify-center group-hover:scale-110 transition-transform my-1 sm:my-0">
              <img
                src={kidAsset('/kid/mascot/vivi-study.png')}
                alt="Numbers Vivi"
                className="w-12 h-12 sm:w-20 sm:h-20 object-contain drop-shadow-md"
                onError={(e) => { (e.target as HTMLImageElement).src = '/kid/rewards/star.png'; }}
              />
              <span className="absolute -bottom-1 -right-2 px-1.5 py-0.5 rounded-full bg-amber-300 text-amber-950 font-black text-[9px] sm:text-[11px] shadow-sm">
                🔢 123
              </span>
            </div>

            <span className="text-[10px] sm:text-xs font-bold text-amber-100 bg-black/15 px-2.5 py-0.5 sm:py-1 rounded-full truncate max-w-full">
              Học đếm số
            </span>
          </div>

          {/* 2. READING (SKY BLUE) */}
          <div
            onClick={() => handleCardClick('/kids/flashcards')}
            className="group relative h-36 sm:h-52 rounded-2xl sm:rounded-[32px] bg-[#3FA9F5] hover:bg-[#3298e2] border-2 sm:border-4 border-white/90 shadow-lg sm:shadow-xl cursor-pointer p-3 sm:p-5 flex flex-col justify-between items-center text-white transition-all duration-200 hover:-translate-y-1.5 hover:shadow-2xl active:scale-95 overflow-hidden"
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/15 rounded-full pointer-events-none" />
            <div className="flex items-center justify-between w-full px-0.5 sm:px-1">
              <h3 className="text-base sm:text-2xl font-black tracking-wide drop-shadow-sm">
                Reading
              </h3>
              <span className="text-sky-200 text-xs sm:text-sm font-black">📖 ABC</span>
            </div>

            {/* Vivi Reading with Headphones */}
            <div className="relative flex items-center justify-center group-hover:scale-110 transition-transform my-1 sm:my-0">
              <img
                src={kidAsset('/kid/mascot/vivi-reading-headphones.png')}
                alt="Reading Vivi"
                className="w-12 h-12 sm:w-20 sm:h-20 object-contain drop-shadow-md"
                onError={(e) => { (e.target as HTMLImageElement).src = '/kid/mascot/vivi-study.png'; }}
              />
            </div>

            <span className="text-[10px] sm:text-xs font-bold text-sky-100 bg-black/15 px-2.5 py-0.5 sm:py-1 rounded-full truncate max-w-full">
              Từ vựng & Truyện
            </span>
          </div>

          {/* 3. PUZZLES (GRASS GREEN) */}
          <div
            onClick={() => handleCardClick('/kids/games?game=memory_flip')}
            className="group relative h-36 sm:h-52 rounded-2xl sm:rounded-[32px] bg-[#4CD964] hover:bg-[#43c45a] border-2 sm:border-4 border-white/90 shadow-lg sm:shadow-xl cursor-pointer p-3 sm:p-5 flex flex-col justify-between items-center text-white transition-all duration-200 hover:-translate-y-1.5 hover:shadow-2xl active:scale-95 overflow-hidden"
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/15 rounded-full pointer-events-none" />
            <div className="flex items-center justify-between w-full px-0.5 sm:px-1">
              <h3 className="text-base sm:text-2xl font-black tracking-wide drop-shadow-sm">
                Puzzles
              </h3>
              <span className="text-emerald-200 text-xs sm:text-sm font-black">🧩 3D</span>
            </div>

            {/* Treasure Chest & Puzzle Magic */}
            <div className="relative flex items-center justify-center group-hover:scale-110 transition-transform my-1 sm:my-0">
              <img
                src={kidAsset('/kid/rewards/chest.png')}
                alt="Puzzles Treasure"
                className="w-12 h-12 sm:w-20 sm:h-20 object-contain drop-shadow-md"
                onError={(e) => { (e.target as HTMLImageElement).src = '/kid/rewards/badge-challenge.png'; }}
              />
            </div>

            <span className="text-[10px] sm:text-xs font-bold text-emerald-100 bg-black/15 px-2.5 py-0.5 sm:py-1 rounded-full truncate max-w-full">
              Ghép hình & Đố vui
            </span>
          </div>

          {/* 4. DRAWING (PURPLE) */}
          <div
            onClick={() => handleCardClick('/kids/world')}
            className="group relative h-36 sm:h-52 rounded-2xl sm:rounded-[32px] bg-[#8054C7] hover:bg-[#7245b8] border-2 sm:border-4 border-white/90 shadow-lg sm:shadow-xl cursor-pointer p-3 sm:p-5 flex flex-col justify-between items-center text-white transition-all duration-200 hover:-translate-y-1.5 hover:shadow-2xl active:scale-95 overflow-hidden"
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/15 rounded-full pointer-events-none" />
            <div className="flex items-center justify-between w-full px-0.5 sm:px-1">
              <h3 className="text-base sm:text-2xl font-black tracking-wide drop-shadow-sm">
                Drawing
              </h3>
              <span className="text-purple-200 text-xs sm:text-sm font-black">🎨 Đảo</span>
            </div>

            {/* Vivi Pointing Character */}
            <div className="relative flex items-center justify-center group-hover:scale-110 transition-transform my-1 sm:my-0">
              <img
                src={kidAsset('/kid/mascot/vivi-pointing.png')}
                alt="Drawing Vivi"
                className="w-12 h-12 sm:w-20 sm:h-20 object-contain drop-shadow-md"
                onError={(e) => { (e.target as HTMLImageElement).src = '/kid/mascot/vivi-celebrate.png'; }}
              />
            </div>

            <span className="text-[10px] sm:text-xs font-bold text-purple-100 bg-black/15 px-2.5 py-0.5 sm:py-1 rounded-full truncate max-w-full">
              Sáng tạo & Luyện viết
            </span>
          </div>
        </div>

        {/* BOTTOM CAPSULE NAVIGATION BAR */}
        <div className="relative z-10 max-w-xs mx-auto h-14 rounded-full bg-gradient-to-r from-cyan-400 to-sky-400 border-3 border-white/90 shadow-lg flex items-center justify-around px-6">
          <button
            onClick={() => handleCardClick('/kids')}
            className="w-10 h-10 rounded-full bg-white/90 text-sky-700 flex items-center justify-center shadow-sm hover:scale-110 transition-transform cursor-pointer"
            title="Trang chủ"
          >
            <Home className="w-5 h-5 fill-current" />
          </button>
          <button
            onClick={() => handleCardClick('/kids/games')}
            className="w-10 h-10 rounded-full text-white hover:bg-white/30 flex items-center justify-center transition-all cursor-pointer"
            title="Trò chơi"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleCardClick('/kids/parent')}
            className="w-10 h-10 rounded-full text-white hover:bg-white/30 flex items-center justify-center transition-all cursor-pointer"
            title="Góc phụ huynh"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
