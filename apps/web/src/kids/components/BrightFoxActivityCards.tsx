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
      <div className="w-full bg-gradient-to-b from-sky-400 via-sky-200 to-sky-100 rounded-[36px] p-5 sm:p-7 lg:p-8 shadow-md border-4 border-white/90 relative overflow-hidden">
        {/* Soft Background Clouds */}
        <div className="absolute top-8 left-4 w-28 h-12 bg-white/60 rounded-full blur-[1px] pointer-events-none" />
        <div className="absolute top-12 right-6 w-36 h-14 bg-white/60 rounded-full blur-[1px] pointer-events-none" />

        {/* TOP TAG & TITLE */}
        <div className="relative z-10 flex flex-col items-center text-center mb-6">
          <div className="self-end px-4 py-1.5 rounded-full bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-md mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cho bé 3–8 tuổi • Ages 3–5</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1E3A8A] tracking-tight drop-shadow-xs">
            What do you want to do?
          </h2>
          <p className="text-xs sm:text-sm font-bold text-sky-800/80 mt-1">
            Bé muốn tham gia hoạt động thú vị nào hôm nay?
          </p>
        </div>

        {/* 4 BRIGHT SQUIRCLE ACTIVITY CARDS (2x2 GRID) */}
        <div className="relative z-10 grid grid-cols-2 gap-4 sm:gap-5 mb-8">
          {/* 1. NUMBERS (ORANGE) */}
          <div
            onClick={() => handleCardClick('/kids/games?game=word_builder')}
            className="group relative h-44 sm:h-52 rounded-[32px] bg-[#FF9633] hover:bg-[#ff8a1a] border-4 border-white/90 shadow-xl cursor-pointer p-4 sm:p-5 flex flex-col justify-between items-center text-white transition-all duration-200 hover:-translate-y-1.5 hover:shadow-2xl active:scale-95 overflow-hidden"
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/15 rounded-full pointer-events-none" />
            <h3 className="text-xl sm:text-2xl font-black tracking-wide drop-shadow-sm">
              Numbers
            </h3>

            {/* 3D 1 2 3 visual */}
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 text-4xl sm:text-5xl font-black drop-shadow-md group-hover:scale-110 transition-transform">
              <span className="text-[#FFEB3B] -rotate-6">1</span>
              <span className="text-[#E91E63] translate-y-1">2</span>
              <span className="text-[#00E676] rotate-6">3</span>
            </div>

            <span className="text-[11px] sm:text-xs font-bold text-amber-100 bg-black/15 px-3 py-1 rounded-full">
              Học đếm số
            </span>
          </div>

          {/* 2. READING (SKY BLUE) */}
          <div
            onClick={() => handleCardClick('/kids/flashcards')}
            className="group relative h-44 sm:h-52 rounded-[32px] bg-[#3FA9F5] hover:bg-[#3298e2] border-4 border-white/90 shadow-xl cursor-pointer p-4 sm:p-5 flex flex-col justify-between items-center text-white transition-all duration-200 hover:-translate-y-1.5 hover:shadow-2xl active:scale-95 overflow-hidden"
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/15 rounded-full pointer-events-none" />
            <h3 className="text-xl sm:text-2xl font-black tracking-wide drop-shadow-sm">
              Reading
            </h3>

            {/* Cute open book face */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-rose-500 rounded-2xl border-3 border-white flex flex-col items-center justify-center shadow-lg relative group-hover:scale-110 transition-transform">
              <div className="w-12 h-10 bg-amber-50 rounded-xl flex items-center justify-center gap-2 relative">
                {/* Eyes */}
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                {/* Smile */}
                <div className="absolute bottom-1.5 w-3 h-1.5 border-b-2 border-slate-900 rounded-full" />
              </div>
            </div>

            <span className="text-[11px] sm:text-xs font-bold text-sky-100 bg-black/15 px-3 py-1 rounded-full">
              Từ vựng & Truyện
            </span>
          </div>

          {/* 3. PUZZLES (GRASS GREEN) */}
          <div
            onClick={() => handleCardClick('/kids/games')}
            className="group relative h-44 sm:h-52 rounded-[32px] bg-[#4CD964] hover:bg-[#43c45a] border-4 border-white/90 shadow-xl cursor-pointer p-4 sm:p-5 flex flex-col justify-between items-center text-white transition-all duration-200 hover:-translate-y-1.5 hover:shadow-2xl active:scale-95 overflow-hidden"
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/15 rounded-full pointer-events-none" />
            <h3 className="text-xl sm:text-2xl font-black tracking-wide drop-shadow-sm">
              Puzzles
            </h3>

            {/* 3D Interlocking Puzzle Blocks */}
            <div className="grid grid-cols-2 gap-1 w-16 h-16 sm:w-20 sm:h-20 p-2 bg-white/20 rounded-2xl backdrop-blur-xs group-hover:scale-110 transition-transform">
              <div className="bg-amber-400 rounded-lg shadow-sm" />
              <div className="bg-sky-400 rounded-lg shadow-sm" />
              <div className="bg-rose-500 rounded-lg shadow-sm" />
              <div className="bg-emerald-300 rounded-lg shadow-sm" />
            </div>

            <span className="text-[11px] sm:text-xs font-bold text-emerald-100 bg-black/15 px-3 py-1 rounded-full">
              Ghép hình & Đố vui
            </span>
          </div>

          {/* 4. DRAWING (PURPLE) */}
          <div
            onClick={() => handleCardClick('/kids/world')}
            className="group relative h-44 sm:h-52 rounded-[32px] bg-[#8054C7] hover:bg-[#7245b8] border-4 border-white/90 shadow-xl cursor-pointer p-4 sm:p-5 flex flex-col justify-between items-center text-white transition-all duration-200 hover:-translate-y-1.5 hover:shadow-2xl active:scale-95 overflow-hidden"
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/15 rounded-full pointer-events-none" />
            <h3 className="text-xl sm:text-2xl font-black tracking-wide drop-shadow-sm">
              Drawing
            </h3>

            {/* Cute Yellow Pencil Character */}
            <div className="flex flex-col items-center group-hover:scale-110 transition-transform">
              <div className="w-8 sm:w-10 h-16 sm:h-20 bg-amber-300 border-2 border-white rounded-t-full rounded-b-md flex flex-col items-center justify-center relative shadow-md">
                {/* Eyes */}
                <div className="flex gap-1.5 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                </div>
                {/* Smile */}
                <div className="w-2.5 h-1 border-b-2 border-slate-900 rounded-full" />
                {/* Pencil Tip */}
                <div className="w-0 h-0 border-x-4 border-x-transparent border-t-8 border-t-amber-800 absolute -bottom-2" />
              </div>
            </div>

            <span className="text-[11px] sm:text-xs font-bold text-purple-100 bg-black/15 px-3 py-1 rounded-full">
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
            onClick={() => handleCardClick('/kids/parents')}
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
