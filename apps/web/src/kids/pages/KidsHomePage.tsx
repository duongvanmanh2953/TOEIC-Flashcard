import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { soundManager } from '../services/sound/KidsSoundManager';
import { celebrationManager } from '../services/celebration/CelebrationManager';
import { voiceService } from '../services/voice/voiceService';
import {
  ViviHeroAdventureScene,
  ViviSleepingCloudScene,
  IllustrationBeachCrab,
  IllustrationRestaurantPlate,
  IllustrationGrammarBus,
  IllustrationPandaBamboo,
  IllustrationHotAirBalloon,
} from '../assets/illustrations/KidsViviUniverse';
import {
  Play,
  Volume2,
  BookOpen,
  Headphones,
  ClipboardList,
  Star,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Mic,
  Sparkles,
} from 'lucide-react';
import { kidAsset } from '../utils/kidAsset';
import { BrightFoxActivityCards } from '../components/BrightFoxActivityCards';
import { BrightFoxHeroHeader } from '../components/BrightFoxHeroHeader';

export const KidsHomePage: React.FC = () => {
  const navigate = useNavigate();
  const [playingWord, setPlayingWord] = useState<string | null>(null);

  useEffect(() => {
    // Gentle audio greeting once per session
    const alreadyGreeted = sessionStorage.getItem('kids_home_greeted');
    if (!alreadyGreeted) {
      sessionStorage.setItem('kids_home_greeted', 'true');
      const timer = setTimeout(() => {
        celebrationManager.greetChild();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleStartLearn = () => {
    soundManager.playPop();
    navigate('/kids/flashcards');
  };

  const handleSignClick = (destination: string) => {
    soundManager.playPop();
    switch (destination) {
      case 'words':
        navigate('/kids/flashcards');
        break;
      case 'listening':
        navigate('/kids/games?game=listen_find');
        break;
      case 'speaking':
        navigate('/kids/games?game=speak_unlock');
        break;
      case 'test':
        navigate('/kids/games');
        break;
      default:
        navigate('/kids/flashcards');
    }
  };

  const handleSpeakTopWord = (word: string, meaning: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playDing();
    setPlayingWord(word);
    voiceService.speakWord(word, {
      onEnd: () => {
        setPlayingWord(null);
      },
      onError: () => {
        setPlayingWord(null);
      },
    });
  };

  // Top daily vocabulary items with audio
  const topDailyWords = [
    { rank: 1, word: 'happy', phonetic: '/ˈhæpi/', meaning: 'vui vẻ', color: 'bg-amber-400' },
    { rank: 2, word: 'school', phonetic: '/skuːl/', meaning: 'trường học', color: 'bg-indigo-400' },
    { rank: 3, word: 'friend', phonetic: '/frend/', meaning: 'bạn bè', color: 'bg-rose-400' },
    { rank: 4, word: 'book', phonetic: '/bʊk/', meaning: 'quyển sách', color: 'bg-emerald-400' },
    { rank: 5, word: 'tree', phonetic: '/triː/', meaning: 'cái cây', color: 'bg-sky-400' },
  ];

  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex-1 bg-white/75 backdrop-blur-2xl rounded-[36px] border border-white/90 shadow-[0_12px_40px_rgba(0,0,0,0.06)] p-4 sm:p-5 lg:p-6 flex flex-col lg:flex-row items-stretch gap-4 sm:gap-5 select-none animate-fadeIn">
      {/* ===================================================================== */}
      {/* LEFT & CENTER MAIN LEARNING STREAM (Flex-1)                           */}
      {/* ===================================================================== */}
      <div className="flex-1 min-w-0 w-full flex flex-col space-y-4 sm:space-y-5">
        {/* 1. LARGE HERO BANNER: "Cùng khám phá thế giới từ vựng!" */}
        <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-sky-200/80 via-sky-100/90 to-emerald-100/70 backdrop-blur-xl border border-white/90 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-5">
          {/* Subtle clouds background */}
          <div className="absolute top-3 left-10 w-24 h-12 bg-white/60 rounded-full blur-xs pointer-events-none" />
          <div className="absolute bottom-4 left-1/3 w-36 h-14 bg-white/40 rounded-full blur-xs pointer-events-none" />

          {/* Left Text Block */}
          <div className="relative z-10 max-w-md space-y-2 text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-black text-[#17345B] tracking-tight leading-snug">
              Cùng khám phá<br />thế giới từ vựng!
            </h1>
            <p className="text-sm sm:text-base font-bold text-[#64748B] pt-1">
              Mỗi ngày một từ mới, tiến bộ từng chút một!
            </p>

            <div className="pt-3">
              <button
                onClick={handleStartLearn}
                className="px-7 py-3 rounded-full bg-gradient-to-r from-[#FFD866] to-[#F59E0B] hover:brightness-105 text-[#431407] font-black text-sm sm:text-base shadow-md active:scale-95 flex items-center gap-2.5 cursor-pointer transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-white/40 flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 fill-[#431407] text-[#431407] ml-0.5" />
                </div>
                <span>Bắt đầu học</span>
              </button>
            </div>
          </div>

          {/* Right Cropped Asset (Vivi Fox with Backpack & Wooden Signpost) */}
          <div className="w-full md:w-[300px] lg:w-[340px] h-[200px] sm:h-[220px] relative shrink-0 flex items-center justify-center">
            <img
              src={kidAsset('/kid/ui/hero-mascot-signpost.png')}
              alt="Vivi and wooden signpost"
              className="w-full h-full object-contain drop-shadow-md rounded-2xl cursor-pointer hover:scale-102 transition-transform"
              onClick={handleStartLearn}
              onError={(e) => { (e.target as HTMLImageElement).src = '/kid/mascot/vivi-wave.png'; }}
            />
            {/* Interactive signpost click areas aligned directly with the 4 wooden arrows */}
            <div className="absolute right-1 sm:right-2 top-3 bottom-4 w-28 sm:w-32 flex flex-col justify-between py-1 z-20 pointer-events-auto">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleSignClick('words'); }}
                title="Words • Học từ vựng"
                className="w-full h-9 rounded-xl hover:bg-amber-400/25 active:scale-95 transition-all cursor-pointer border border-transparent hover:border-amber-300/60"
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleSignClick('listening'); }}
                title="Listening • Luyện nghe"
                className="w-full h-9 rounded-xl hover:bg-amber-400/25 active:scale-95 transition-all cursor-pointer border border-transparent hover:border-amber-300/60"
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleSignClick('speaking'); }}
                title="Speaking • Luyện nói"
                className="w-full h-9 rounded-xl hover:bg-amber-400/25 active:scale-95 transition-all cursor-pointer border border-transparent hover:border-amber-300/60"
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleSignClick('test'); }}
                title="Test • Trò chơi vui nhộn"
                className="w-full h-9 rounded-xl hover:bg-amber-400/25 active:scale-95 transition-all cursor-pointer border border-transparent hover:border-amber-300/60"
              />
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* BRIGHTFOX 4 CORE ACTIVITY CARDS (NUMBERS • READING • PUZZLES • DRAWING) */}
        {/* ===================================================================== */}
        <BrightFoxActivityCards />

        {/* 2. QUICK ACCESS DESTINATION TILES */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
          {/* Card 1: Học từ vựng */}
          <div
            onClick={() => {
              soundManager.playPop();
              navigate('/kids/flashcards');
            }}
            className="p-4 sm:p-5 rounded-3xl bg-sky-50/85 backdrop-blur-xl border border-sky-200/90 hover:border-sky-400 hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[140px]"
          >
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#17345B]">
                Học từ vựng
              </h2>
              <p className="text-[11px] sm:text-xs font-bold text-[#64748B] mt-0.5 leading-snug">
                Flashcard thông minh, ghi nhớ lâu hơn
              </p>
            </div>
            <div className="w-6 h-6 rounded-full bg-white/90 text-sky-600 flex items-center justify-center self-end shadow-2xs">
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 2: Luyện nghe nói */}
          <div
            onClick={() => {
              soundManager.playPop();
              navigate('/kids/world');
            }}
            className="p-4 sm:p-5 rounded-3xl bg-purple-50/85 backdrop-blur-xl border border-purple-200/90 hover:border-purple-400 hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[140px]"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#17345B]">
                Luyện nghe nói
              </h2>
              <p className="text-[11px] sm:text-xs font-bold text-[#64748B] mt-0.5 leading-snug">
                Nghe chuẩn – Nói hay cùng AI
              </p>
            </div>
            <div className="w-6 h-6 rounded-full bg-white/90 text-purple-600 flex items-center justify-center self-end shadow-2xs">
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3: Trò chơi vui nhộn */}
          <div
            onClick={() => {
              soundManager.playPop();
              navigate('/kids/games');
            }}
            className="p-4 sm:p-5 rounded-3xl bg-emerald-50/85 backdrop-blur-xl border border-emerald-200/90 hover:border-emerald-400 hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[140px]"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#17345B]">
                Trò chơi vui nhộn
              </h2>
              <p className="text-[11px] sm:text-xs font-bold text-[#64748B] mt-0.5 leading-snug">
                Làm quen dạng bài TOEIC, thật tự tin
              </p>
            </div>
            <div className="w-6 h-6 rounded-full bg-white/90 text-emerald-600 flex items-center justify-center self-end shadow-2xs">
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 4: Tiến độ học tập */}
          <div
            onClick={() => {
              soundManager.playPop();
              navigate('/kids/parent');
            }}
            className="p-4 sm:p-5 rounded-3xl bg-amber-50/85 backdrop-blur-xl border border-amber-200/90 hover:border-amber-400 hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[140px]"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#17345B]">
                Tiến độ học tập
              </h2>
              <p className="text-[11px] sm:text-xs font-bold text-[#64748B] mt-0.5 leading-snug">
                Xem kết quả, nhận huy hiệu
              </p>
            </div>
            <div className="w-6 h-6 rounded-full bg-white/90 text-amber-600 flex items-center justify-center self-end shadow-2xs">
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* 3. SECTION "BÀI HỌC GỢI Ý CHO BẠN" */}
        <div className="space-y-4 bg-white/80 backdrop-blur-xl p-4 sm:p-5 rounded-3xl shadow-xs border border-white/90">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-[#17345B] flex items-center gap-2">
              <span className="text-emerald-500">🌱</span>
              <span>Bài học gợi ý cho bạn</span>
            </h2>
            <button
              onClick={() => {
                soundManager.playPop();
                navigate('/kids/journey');
              }}
              className="text-xs font-black text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {/* Lesson 1: Beach */}
            <div
              onClick={() => {
                soundManager.playPop();
                navigate('/kids/flashcards');
              }}
              className="bg-white p-3.5 rounded-3xl border border-slate-200/90 hover:border-sky-300 hover:shadow-sm transition-all cursor-pointer space-y-2.5"
            >
              <div className="h-28 w-full rounded-2xl overflow-hidden relative bg-white">
                <img
                  src={kidAsset('/kid/lessons/lesson-beach-crab.png')}
                  alt="At the Beach"
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/kid/mascot/vivi-study.png'; }}
                />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/90 text-[10px] font-black text-slate-700 shadow-2xs">
                  12 từ
                </span>
              </div>
              <div>
                <p className="text-xs font-black text-[#17345B]">Từ vựng theo chủ đề</p>
                <p className="text-[11px] font-bold text-slate-500">At the Beach</p>
                <div className="flex items-center gap-1 pt-1 text-amber-400 text-xs">
                  ★ ★ ★
                </div>
              </div>
            </div>

            {/* Lesson 2: Restaurant */}
            <div
              onClick={() => {
                soundManager.playPop();
                navigate('/kids/world');
              }}
              className="bg-white p-3.5 rounded-3xl border border-slate-200/90 hover:border-sky-300 hover:shadow-sm transition-all cursor-pointer space-y-2.5"
            >
              <div className="h-28 w-full rounded-2xl overflow-hidden relative bg-white">
                <img
                  src={kidAsset('/kid/lessons/lesson-restaurant-food.png')}
                  alt="At the Restaurant"
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/kid/mascot/vivi-celebrate.png'; }}
                />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/90 text-[10px] font-black text-slate-700 shadow-2xs">
                  8 bài
                </span>
              </div>
              <div>
                <p className="text-xs font-black text-[#17345B]">Giao tiếp hàng ngày</p>
                <p className="text-[11px] font-bold text-slate-500">At the Restaurant</p>
                <div className="flex items-center gap-1 pt-1 text-amber-400 text-xs">
                  ★ ★ ★
                </div>
              </div>
            </div>

            {/* Lesson 3: Grammar Bus */}
            <div
              onClick={() => {
                soundManager.playPop();
                navigate('/kids/games');
              }}
              className="bg-white p-3.5 rounded-3xl border border-slate-200/90 hover:border-sky-300 hover:shadow-sm transition-all cursor-pointer space-y-2.5"
            >
              <div className="h-28 w-full rounded-2xl overflow-hidden relative bg-white">
                <img
                  src={kidAsset('/kid/lessons/lesson-grammar-bus.png')}
                  alt="Present Simple"
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/kid/mascot/vivi-running.png'; }}
                />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/90 text-[10px] font-black text-slate-700 shadow-2xs">
                  10 bài
                </span>
              </div>
              <div>
                <p className="text-xs font-black text-[#17345B]">Ngữ pháp vui</p>
                <p className="text-[11px] font-bold text-slate-500">Present Simple</p>
                <div className="flex items-center gap-1 pt-1 text-amber-400 text-xs">
                  ★ ★ ★
                </div>
              </div>
            </div>

            {/* Lesson 4: Animals */}
            <div
              onClick={() => {
                soundManager.playPop();
                navigate('/kids/games?game=word_builder');
              }}
              className="bg-white p-3.5 rounded-3xl border border-slate-200/90 hover:border-sky-300 hover:shadow-sm transition-all cursor-pointer space-y-2.5"
            >
              <div className="h-28 w-full rounded-2xl overflow-hidden relative bg-white">
                <img
                  src={kidAsset('/kid/lessons/lesson-animals-panda.png')}
                  alt="Animals"
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/kid/animals/panda.png'; }}
                />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/90 text-[10px] font-black text-slate-700 shadow-2xs">
                  6 bài
                </span>
              </div>
              <div>
                <p className="text-xs font-black text-[#17345B]">Nghe hiểu</p>
                <p className="text-[11px] font-bold text-slate-500">Animals</p>
                <div className="flex items-center gap-1 pt-1 text-amber-400 text-xs">
                  ★ ★ ★
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. BOTTOM MOTIVATION CALLOUT BANNER WITH BALLOON */}
        <div className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-r from-sky-100/95 via-white/85 to-emerald-50/95 backdrop-blur-xl border border-white/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Crisp Colorful Hot Air Balloon */}
            <div className="w-12 h-14 shrink-0 flex items-center justify-center animate-bounce-subtle drop-shadow-sm">
              <svg viewBox="0 0 60 74" className="w-full h-full">
                <defs>
                  <linearGradient id="kidBalloonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
                <path d="M 30 2 C 14 2 4 16 4 32 C 4 44 18 54 24 60 L 36 60 C 42 54 56 44 56 32 C 56 16 46 2 30 2 Z" fill="url(#kidBalloonGrad)" />
                <path d="M 30 2 C 22 2 16 16 16 32 C 16 44 24 57 26 60 L 34 60 C 36 57 44 44 44 32 C 44 16 38 2 30 2 Z" fill="#fbbf24" opacity="0.85" />
                <path d="M 30 2 C 26 2 24 16 24 32 C 24 44 28 58 29 60 L 31 60 C 32 58 36 44 36 32 C 36 16 34 2 30 2 Z" fill="#38bdf8" opacity="0.9" />
                <line x1="24" y1="60" x2="26" y2="67" stroke="#b45309" strokeWidth="1.5" />
                <line x1="36" y1="60" x2="34" y2="67" stroke="#b45309" strokeWidth="1.5" />
                <line x1="30" y1="60" x2="30" y2="67" stroke="#b45309" strokeWidth="1" />
                <rect x="24" y="67" width="12" height="7" rx="2" fill="#d97706" stroke="#92400e" strokeWidth="1" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-sm sm:text-base font-black text-[#17345B]">
                Bạn đã sẵn sàng cho thử thách tiếp theo chưa?
              </h3>
              <p className="text-xs font-bold text-[#64748B] mt-0.5">
                Hoàn thành 5 bài học để nhận huy hiệu hôm nay!
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playPop();
              navigate('/kids/journey');
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#3C9FE8] hover:bg-[#258cd6] text-white font-black text-xs sm:text-sm shadow-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer transition-all shrink-0"
          >
            <span>Bắt đầu ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* RIGHT COMPANION / PROGRESS PANEL (w-full lg:w-72 xl:w-80 shrink-0)    */}
      {/* ===================================================================== */}
      <div className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col space-y-4">
        {/* CARD 1 (PRIORITY #1 AT TOP): TOP TỪ VỰNG HÔM NAY */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/90 shadow-xs space-y-3 text-left">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#17345B] flex items-center gap-1.5">
              <span>⭐</span>
              <span>Top từ vựng hôm nay</span>
            </h3>
            <button
              onClick={() => {
                soundManager.playPop();
                navigate('/kids/flashcards');
              }}
              className="text-xs font-black text-sky-600 hover:text-sky-700 flex items-center gap-0.5 cursor-pointer"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {topDailyWords.map((item) => (
              <div
                key={item.word}
                onClick={(e) => handleSpeakTopWord(item.word, item.meaning, e)}
                className="flex items-center justify-between p-2 rounded-2xl bg-white/60 hover:bg-sky-50/80 border border-slate-100 hover:border-sky-200 transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-full ${item.color} text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs`}>
                    {item.rank}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 leading-tight">
                      {item.word}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500">
                      {item.phonetic} • {item.meaning}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  title="Nghe phát âm"
                  className={`p-1.5 rounded-full ${
                    playingWord === item.word
                      ? 'bg-sky-500 text-white scale-110 shadow-xs'
                      : 'text-sky-500 hover:bg-sky-100'
                  } transition-all`}
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* CARD 2: THÀNH TÍCH HÔM NAY */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/90 shadow-xs space-y-3.5 text-left">
          <h3 className="text-sm font-black text-[#17345B]">
            Thành tích hôm nay
          </h3>

          <div className="space-y-3">
            {/* Task 1: Hoàn thành bài học */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="flex items-center gap-2 text-slate-800">
                  <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center">
                    <Star className="w-3 h-3 fill-current" />
                  </div>
                  <span>Hoàn thành bài học</span>
                </span>
                <span className="text-sky-700">3 / 5</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#3C9FE8] h-full rounded-full w-[60%]" />
              </div>
            </div>

            {/* Task 2: Từ vựng mới */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="flex items-center gap-2 text-slate-800">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <span>Từ vựng mới</span>
                </span>
                <span className="text-emerald-700">12 từ</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#52C7A0] h-full rounded-full w-[80%]" />
              </div>
            </div>

            {/* Task 3: Luyện nói */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="flex items-center gap-2 text-slate-800">
                  <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                    <Mic className="w-3 h-3" />
                  </div>
                  <span>Luyện nói</span>
                </span>
                <span className="text-purple-700">1 / 3</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#B8A4F5] h-full rounded-full w-[33%]" />
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: COMPANION CLOUD CARD (SLEEPING MASCOT) */}
        <div className="p-4 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/90 shadow-xs flex flex-col items-center text-center space-y-2">
          <p className="text-xs font-bold text-slate-700 leading-snug px-2">
            Học mỗi ngày để trở thành phiên bản tốt hơn của chính mình! <span className="text-rose-500">❤️</span>
          </p>
          <div className="w-full h-24 flex items-center justify-center overflow-hidden rounded-2xl">
            <img
              src={kidAsset('/kid/ui/cloud-sleeping-fox.png')}
              alt="Sleeping Vivi"
              className="w-full h-full object-contain drop-shadow-xs"
              onError={(e) => { (e.target as HTMLImageElement).src = '/kid/mascot/vivi-sleep.png'; }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default KidsHomePage;
