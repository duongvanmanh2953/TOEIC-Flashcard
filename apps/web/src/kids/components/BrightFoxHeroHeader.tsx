import React from 'react';
import { useNavigate } from 'react-router-dom';
import { soundManager } from '../services/sound/KidsSoundManager';
import { voiceService } from '../services/voice/voiceService';
import { kidAsset } from '../utils/kidAsset';
import { Play, Volume2, Lock, Sparkles } from 'lucide-react';

export const BrightFoxHeroHeader: React.FC = () => {
  const navigate = useNavigate();

  const handleHearMe = () => {
    soundManager.playDing();
    voiceService.speakWord('Hello! Welcome to BrightFox!', {
      onEnd: () => {
        voiceService.speakVietnamese('Chào bé yêu! Cùng Vivi khám phá thế giới tiếng Anh diệu kỳ nhé!');
      },
    });
  };

  const handleStartAge = (ageRange: '3-5' | '6-8') => {
    soundManager.playPop();
    if (ageRange === '3-5') {
      navigate('/kids/games?game=word_builder');
    } else {
      navigate('/kids/flashcards');
    }
  };

  return (
    <div className="w-full flex flex-col items-center select-none py-2">
      <div className="w-full max-w-xl bg-gradient-to-b from-sky-400 via-sky-200 to-sky-100 rounded-[40px] p-6 sm:p-8 shadow-xl border-4 border-white/90 relative overflow-hidden flex flex-col items-center text-center">
        {/* Soft Background Clouds */}
        <div className="absolute top-6 left-6 w-24 h-10 bg-white/60 rounded-full blur-[1px] pointer-events-none" />
        <div className="absolute top-10 right-8 w-28 h-12 bg-white/60 rounded-full blur-[1px] pointer-events-none" />

        {/* HANGING WOODEN SIGNPOST */}
        <div className="relative z-10 flex flex-col items-center mb-4">
          {/* Vine & Leaves */}
          <div className="w-48 sm:w-64 h-3 bg-amber-900 rounded-full relative">
            <span className="absolute -top-3 left-4 text-emerald-500 text-base">🍃</span>
            <span className="absolute -top-3 right-6 text-emerald-500 text-base">🌿</span>
          </div>

          {/* Wooden Board */}
          <div className="px-8 py-2 rounded-2xl bg-gradient-to-b from-[#FFA726] to-[#FB8C00] border-3 border-amber-900 shadow-md text-white font-black text-xl sm:text-2xl tracking-wider uppercase mt-1 relative">
            <span>BrightFox</span>
            {/* Hanging Ropes */}
            <div className="w-1 h-3 bg-amber-950 absolute -top-3 left-4" />
            <div className="w-1 h-3 bg-amber-950 absolute -top-3 right-4" />
          </div>
        </div>

        {/* CIRCULAR MASCOT AVATAR WITH MICROPHONE BADGE */}
        <div className="relative z-10 flex flex-col items-center my-2">
          <div
            onClick={handleHearMe}
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 border-4 border-white shadow-xl flex items-center justify-center p-2 relative cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          >
            <img
              src={kidAsset('/kid/mascot/vivi-wave.png')}
              alt="BrightFox Mascot"
              className="w-full h-full object-contain"
            />
            {/* Mic Overlay Badge */}
            <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-white text-sky-500 border-2 border-sky-300 shadow-md flex items-center justify-center">
              <Volume2 className="w-5 h-5 fill-current" />
            </div>
          </div>

          <p
            onClick={handleHearMe}
            className="text-xs sm:text-sm font-black text-sky-900 mt-2 cursor-pointer hover:underline"
          >
            Tap to hear me! • Chạm để nghe Vivi nói
          </p>

          {/* 3 Circular Action Buttons */}
          <div className="flex items-center gap-4 mt-3">
            <button
              onClick={() => handleStartAge('3-5')}
              className="w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer border-2 border-white"
              title="Chơi ngay"
            >
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </button>
            <button
              onClick={handleHearMe}
              className="w-11 h-11 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer border-2 border-white"
              title="Nghe giọng nói"
            >
              <Volume2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/kids/parents')}
              className="w-11 h-11 rounded-full bg-purple-500 hover:bg-purple-400 text-white flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer border-2 border-white"
              title="Góc phụ huynh"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SUBTITLE */}
        <div className="relative z-10 my-4">
          <h3 className="text-xl sm:text-2xl font-black text-[#1E3A8A] tracking-tight">
            Learning Through Play
          </h3>
          <p className="text-xs sm:text-sm font-bold text-sky-800/80">
            Học mà chơi, chơi mà học thật vui!
          </p>
        </div>

        {/* 2 AGE SELECTOR CARDS */}
        <div className="relative z-10 grid grid-cols-2 gap-4 w-full max-w-sm">
          {/* Card 1: 3-5 Years */}
          <div className="bg-[#FFF0F5] border-4 border-[#FF69B4] rounded-3xl p-3 sm:p-4 flex flex-col items-center justify-between shadow-md hover:scale-102 transition-transform">
            <span className="px-3 py-1 rounded-full bg-[#FF69B4] text-white font-black text-xs">
              3–5 Years
            </span>
            <div className="w-16 h-16 my-2 flex items-center justify-center">
              <img
                src={kidAsset('/kid/mascot/vivi-study.png')}
                alt="3-5 Years"
                className="w-full h-full object-contain"
              />
            </div>
            <button
              onClick={() => handleStartAge('3-5')}
              className="w-full py-2 rounded-full bg-[#00E5FF] hover:bg-[#00d0e6] text-[#004D40] font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer"
            >
              START
            </button>
          </div>

          {/* Card 2: 6-8 Years */}
          <div className="bg-[#F0FFF4] border-4 border-[#8BC34A] rounded-3xl p-3 sm:p-4 flex flex-col items-center justify-between shadow-md hover:scale-102 transition-transform">
            <span className="px-3 py-1 rounded-full bg-[#8BC34A] text-white font-black text-xs">
              6–8 Years
            </span>
            <div className="w-16 h-16 my-2 flex items-center justify-center">
              <img
                src={kidAsset('/kid/mascot/vivi-reading-headphones.png')}
                alt="6-8 Years"
                className="w-full h-full object-contain"
              />
            </div>
            <button
              onClick={() => handleStartAge('6-8')}
              className="w-full py-2 rounded-full bg-[#FFA726] hover:bg-[#fb9811] text-[#E65100] font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer"
            >
              START
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
