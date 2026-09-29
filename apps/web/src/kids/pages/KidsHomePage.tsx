import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KidsMascot } from '../components/KidsMascot';
import { getKidsProgress, getNextLessonToLearn } from '../curriculum/curriculumProgress';
import { soundManager } from '../services/sound/KidsSoundManager';
import { celebrationManager } from '../services/celebration/CelebrationManager';
import { voiceService } from '../services/voice/voiceService';
import {
  HeroApple,
  HeroElephant,
  HeroRobotChest,
  HeroAchievementBadge,
} from '../assets/illustrations/KidsHeroAssets';
import {
  Play,
  Volume2,
  Sparkles,
  Mountain,
  Gamepad2,
  Compass,
  Flame,
  Star,
  ArrowRight,
} from 'lucide-react';

export const KidsHomePage: React.FC = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(getKidsProgress());
  const [nextLessonInfo, setNextLessonInfo] = useState(getNextLessonToLearn());

  useEffect(() => {
    setProgress(getKidsProgress());
    setNextLessonInfo(getNextLessonToLearn());

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

  const handleStartContinue = () => {
    soundManager.playPop();
    if (nextLessonInfo) {
      navigate(`/kids/lesson/${nextLessonInfo.lesson.id}`);
    } else {
      navigate('/kids/journey');
    }
  };

  const handlePlayWordAudio = () => {
    soundManager.playPop();
    voiceService.speakWord('Apple', {
      onEnd: () => {
        setTimeout(() => voiceService.speakVietnamese('Quả táo đỏ ngon ngọt!'), 200);
      },
    });
  };

  const currentWorldTitle = nextLessonInfo ? nextLessonInfo.world.title : 'Rừng Rậm Diệu Kỳ';
  const currentLessonTitle = nextLessonInfo ? nextLessonInfo.lesson.title : 'Đỉnh Núi Cầu Vồng';

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-6 select-none max-w-7xl mx-auto">
      {/* ================================================================ */}
      {/* ================================================================ */}
      {/* 1. TOP HEADER & GREETING                                         */}
      {/* ================================================================ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-500 text-xl shrink-0">
            🌟
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Chào bé yêu!
            </h1>
            <p className="text-xs sm:text-sm font-bold text-slate-600">
              Hôm nay cùng khám phá những cuộc phiêu lưu kỳ thú nhé!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <button
            onClick={handleStartContinue}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 text-white font-black text-xs sm:text-sm shadow-xs flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Vào học ngay</span>
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 2. MAIN 70% / SECONDARY 30% GRID ARCHITECTURE                   */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
        {/* ============================================================== */}
        {/* LEFT COLUMN: MAIN CONTENT (70% - Col span 7)                   */}
        {/* ============================================================== */}
        <div className="lg:col-span-7 space-y-8">
          {/* A. CURRENT ADVENTURE HERO BANNER */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-100/90 via-sky-50 to-indigo-50/60 p-6 sm:p-8 border border-sky-200/80 shadow-xs">
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-2 max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-sky-200 text-xs font-black text-sky-800 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                  <span>Hành Trình Hiện Tại</span>
                  <span>•</span>
                  <span>{currentWorldTitle}</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  {currentLessonTitle}
                </h2>
                <p className="text-xs sm:text-sm font-bold text-slate-600 leading-relaxed">
                  Vượt qua các thử thách tương tác trực quan để mở khóa vùng đất mới và thu thập huy hiệu danh giá!
                </p>
              </div>

              <button
                onClick={handleStartContinue}
                className="w-full sm:w-auto px-7 py-3.5 sm:py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm sm:text-base active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm"
              >
                <span>TIẾP TỤC HÀNH TRÌNH</span>
                <Play className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>

          {/* B. RECOMMENDED ADVENTURES (Only 2 Large Cards - No Clutter) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  Trò Chơi Tiêu Điểm Hôm Nay
                </h3>
                <p className="text-xs font-bold text-slate-500">
                  Thao tác vật lý thật trong thế giới game tương tác
                </p>
              </div>
              <button
                onClick={() => navigate('/kids/games')}
                className="text-xs font-black text-sky-600 hover:text-sky-800 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* CARD 1: ROBOT LAB */}
              <div
                onClick={() => navigate('/kids/games?game=build_my_robot')}
                className="p-6 rounded-3xl bg-white hover:bg-sky-50/30 border border-slate-200 hover:border-sky-300 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between cursor-pointer group select-none"
              >
                <div className="flex items-center justify-center py-4 group-hover:scale-105 transition-transform duration-300">
                  <HeroRobotChest size={120} />
                </div>
                <div className="space-y-1.5 mt-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-150 text-[10px] font-black text-sky-700 uppercase">
                    Cơ khí tương lai
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-sky-600 transition-colors">
                    Xưởng Robot (Robot Lab)
                  </h4>
                  <p className="text-xs font-bold text-slate-600 line-clamp-2">
                    Lắp ráp người máy hiện đại trên bàn cơ khí studio trắng và ngắm nhìn tư thế anh hùng!
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-black text-sky-600 flex items-center gap-1">
                    <span>Khám phá ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs font-black text-slate-600 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200/80">4-10 tuổi</span>
                </div>
              </div>

              {/* CARD 2: ANIMAL RESCUE */}
              <div
                onClick={() => navigate('/kids/games?game=animal_rescue')}
                className="p-6 rounded-3xl bg-white hover:bg-emerald-50/30 border border-slate-200 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between cursor-pointer group select-none"
              >
                <div className="flex items-center justify-center py-4 group-hover:scale-105 transition-transform duration-300">
                  <HeroElephant size={120} />
                </div>
                <div className="space-y-1.5 mt-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-150 text-[10px] font-black text-emerald-700 uppercase">
                    Rừng nhiệt đới
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                    Giải Cứu Động Vật
                  </h4>
                  <p className="text-xs font-bold text-slate-600 line-clamp-2">
                    Cầm kéo thần kỳ cắt đứt dây leo trói và mở lồng đưa bạn Voi dũng mãnh thoát nạn!
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                    <span>Giải cứu ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs font-black text-slate-600 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200/80">4-9 tuổi</span>
                </div>
              </div>
            </div>
          </div>

          {/* C. DAILY WORD SHOWCASE (Vật Thể Học Tập Khổng Lồ) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-rose-100/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center justify-center">
              <HeroApple size={160} onClick={handlePlayWordAudio} />
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <span className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs font-black text-rose-700">
                Từ Vựng Tiêu Điểm
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-wide">
                APPLE
              </h3>
              <p className="text-sm font-bold text-slate-700">
                /ˈæp.əl/ • <span className="text-rose-600 font-black">Quả Táo</span>
              </p>
              <p className="text-xs font-bold text-slate-600 max-w-sm">
                "The apple is sweet, red and crunchy!" (Quả táo đỏ giòn ngọt thơm lành).
              </p>

              <div className="pt-2">
                <button
                  onClick={handlePlayWordAudio}
                  className="px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black text-sm flex items-center justify-center sm:justify-start gap-2 cursor-pointer transition-all active:scale-95 shadow-xs"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Nghe Phát Âm Chuẩn</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: SECONDARY COMPANION & BADGES (30% - Col span 3) */}
        {/* ============================================================== */}
        <div className="lg:col-span-3 space-y-6">
          {/* A. BOBBY MASCOT GREETING COMPANION CARD */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col items-center text-center space-y-4">
            <div
              className="cursor-pointer hover:scale-105 transition-transform duration-300"
              onClick={() => {
                soundManager.playPop();
                celebrationManager.speakPraise('Chào bé! Chúc bé một ngày học tập thật vui!');
              }}
            >
              <KidsMascot
                mood="excited"
                size={120}
                speechText="Cùng học với Bobby nhé!"
              />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-black text-slate-900">Bạn Gấu Bobby</h4>
              <p className="text-xs font-bold text-slate-600">
                Người bạn đồng hành khám phá thế giới tiếng Anh diệu kỳ!
              </p>
            </div>
          </div>

          {/* B. HALL OF FAME / LARGE ACHIEVEMENT BADGES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Huy Hiệu Vinh Dự
              </h4>
              <span className="text-[11px] font-bold text-slate-500">3 Danh hiệu</span>
            </div>

            <div className="space-y-3">
              <HeroAchievementBadge
                title="Nhà Thám Hiểm Núi"
                subtitle="Vượt qua 5 trạm kiểm soát đèo"
                icon="🏔️"
                stars={3}
                size={280}
                className="w-full"
              />

              <HeroAchievementBadge
                title="Kỹ Sư Người Máy"
                subtitle="Lắp ráp hoàn chỉnh Robot Lab"
                icon="🤖"
                stars={3}
                size={280}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KidsHomePage;
