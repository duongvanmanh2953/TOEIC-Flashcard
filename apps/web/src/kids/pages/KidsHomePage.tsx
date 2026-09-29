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
        navigate('/kids/world');
        break;
      case 'speaking':
        navigate('/kids/world');
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
    <div className="w-full flex flex-col lg:flex-row items-start gap-6 select-none animate-fadeIn pb-8">
      {/* ===================================================================== */}
      {/* LEFT & CENTER MAIN LEARNING STREAM (Flex-1)                           */}
      {/* ===================================================================== */}
      <div className="flex-1 min-w-0 w-full space-y-6">
        {/* 1. LARGE HERO BANNER: "Cùng khám phá thế giới từ vựng!" */}
        <div className="rounded-[32px] p-6 sm:p-8 bg-gradient-to-r from-sky-200/50 via-sky-100/60 to-emerald-100/40 border border-sky-200/80 shadow-xs relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
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

            <div className="pt-4">
              <button
                onClick={handleStartLearn}
                className="px-7 py-3.5 rounded-full bg-gradient-to-r from-[#FFD866] to-[#F59E0B] hover:brightness-105 text-[#431407] font-black text-sm sm:text-base shadow-md active:scale-95 flex items-center gap-2.5 cursor-pointer transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-white/40 flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 fill-[#431407] text-[#431407] ml-0.5" />
                </div>
                <span>Bắt đầu học</span>
              </button>
            </div>
          </div>

          {/* Right Vector Illustration (Vivi Fox with Backpack & Wooden Signpost) */}
          <div className="w-full md:w-[320px] lg:w-[360px] h-[220px] sm:h-[240px] relative shrink-0">
            <ViviHeroAdventureScene
              onSignClick={handleSignClick}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* 2. 4 CORE DESTINATION FEATURE CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Học từ vựng */}
          <div
            onClick={() => {
              soundManager.playPop();
              navigate('/kids/flashcards');
            }}
            className="p-4 sm:p-5 rounded-3xl bg-[#F0F9FF] border border-[#BAE6FD] hover:border-sky-300 hover:-translate-y-1 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between min-h-[140px]"
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
            className="p-4 sm:p-5 rounded-3xl bg-[#FAF5FF] border border-[#E9D5FF] hover:border-purple-300 hover:-translate-y-1 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between min-h-[140px]"
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

          {/* Card 3: Luyện đề */}
          <div
            onClick={() => {
              soundManager.playPop();
              navigate('/kids/games');
            }}
            className="p-4 sm:p-5 rounded-3xl bg-[#F0FDF4] border border-[#BBF7D0] hover:border-emerald-300 hover:-translate-y-1 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between min-h-[140px]"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#17345B]">
                Luyện đề
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
              navigate('/kids/journey');
            }}
            className="p-4 sm:p-5 rounded-3xl bg-[#FEFCE8] border border-[#FEF08A] hover:border-amber-300 hover:-translate-y-1 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between min-h-[140px]"
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
        <div className="space-y-3.5">
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
              <div className="h-28 w-full rounded-2xl overflow-hidden relative">
                <IllustrationBeachCrab className="w-full h-full object-cover" />
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
              <div className="h-28 w-full rounded-2xl overflow-hidden relative">
                <IllustrationRestaurantPlate className="w-full h-full object-cover" />
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
              <div className="h-28 w-full rounded-2xl overflow-hidden relative">
                <IllustrationGrammarBus className="w-full h-full object-cover" />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/90 text-[10px] font-black text-slate-700 shadow-2xs">
                  10 bài
                </span>
              </div>
              <div>
                <p className="text-xs font-black text-[#17345B]">Ngữ pháp cơ bản</p>
                <p className="text-[11px] font-bold text-slate-500">Present Simple</p>
                <div className="flex items-center gap-1 pt-1 text-amber-400 text-xs">
                  ★ ★ ★
                </div>
              </div>
            </div>

            {/* Lesson 4: Animals Panda */}
            <div
              onClick={() => {
                soundManager.playPop();
                navigate('/kids/world');
              }}
              className="bg-white p-3.5 rounded-3xl border border-slate-200/90 hover:border-sky-300 hover:shadow-sm transition-all cursor-pointer space-y-2.5"
            >
              <div className="h-28 w-full rounded-2xl overflow-hidden relative">
                <IllustrationPandaBamboo className="w-full h-full object-cover" />
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
        <div className="p-4 sm:p-5 rounded-[28px] bg-gradient-to-r from-sky-100/90 via-sky-50 to-emerald-50/80 border border-sky-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <IllustrationHotAirBalloon className="w-12 h-14 shrink-0 animate-bounce-subtle" />
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
      <div className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4">
        {/* Top Companion Cloud Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-b from-sky-100/50 to-white border border-sky-200/70 shadow-xs flex flex-col items-center text-center space-y-2">
          <p className="text-xs font-bold text-slate-700 leading-snug px-2">
            Học mỗi ngày để trở thành phiên bản tốt hơn của chính mình! <span className="text-rose-500">❤️</span>
          </p>
          <div className="w-full h-24 flex items-center justify-center">
            <ViviSleepingCloudScene className="w-full h-full" />
          </div>
        </div>

        {/* Card: Thành tích hôm nay */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4 text-left">
          <h3 className="text-sm font-black text-[#17345B]">
            Thành tích hôm nay
          </h3>

          <div className="space-y-3">
            {/* Task 1: Hoàn thành bài học */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="flex items-center gap-2 text-slate-800">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center">
                    <Star className="w-3.5 h-3.5 fill-current" />
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
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="flex items-center gap-2 text-slate-800">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
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
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="flex items-center gap-2 text-slate-800">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                    <Mic className="w-3.5 h-3.5" />
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

        {/* Card: Top từ vựng hôm nay */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3.5 text-left">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#17345B]">
              Top từ vựng hôm nay
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

          <div className="space-y-2.5">
            {topDailyWords.map((item) => (
              <div
                key={item.word}
                onClick={(e) => handleSpeakTopWord(item.word, item.meaning, e)}
                className="flex items-center justify-between p-2 rounded-2xl hover:bg-sky-50/60 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-full ${item.color} text-white font-black text-xs flex items-center justify-center shrink-0`}>
                    {item.rank}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 leading-tight">
                      {item.word}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400">
                      {item.phonetic}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  title="Nghe phát âm"
                  className={`p-1.5 rounded-full ${
                    playingWord === item.word
                      ? 'bg-sky-500 text-white scale-110'
                      : 'text-sky-500 hover:bg-sky-100'
                  } transition-all`}
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KidsHomePage;
