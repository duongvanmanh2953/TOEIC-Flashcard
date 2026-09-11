import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KidsMascot } from '../components/KidsMascot';
import { KidsIcon } from '../assets/icons/KidsIcons';
import { getKidsProgress, getNextLessonToLearn } from '../curriculum/curriculumProgress';
import { WORLDS_DATA } from '../curriculum/kidsCurriculum';
import { soundManager } from '../services/sound/KidsSoundManager';
import { celebrationManager } from '../services/celebration/CelebrationManager';
import {
  Play,
  Volume2,
  Star,
  Sparkles,
  Mountain,
  Gamepad2,
  Compass,
  ShieldCheck,
  Trophy,
  Map,
  ArrowRight,
  Flame,
} from 'lucide-react';

export const KidsHomePage: React.FC = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(getKidsProgress());
  const [nextLessonInfo, setNextLessonInfo] = useState(getNextLessonToLearn());

  useEffect(() => {
    const updated = getKidsProgress();
    setProgress(updated);
    setNextLessonInfo(getNextLessonToLearn());

    // Friendly short greeting once per session
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

  const handleWorldClick = (worldId: string, isUnlocked: boolean) => {
    if (isUnlocked) {
      soundManager.playPop();
      navigate(`/kids/journey?world=${worldId}`);
    } else {
      soundManager.playIncorrect();
      celebrationManager.speakPraise('Bé hãy vượt qua các chặng núi trước để mở khóa nhé!');
    }
  };

  // 6 Audited Kids V5 Games
  const featuredGames = [
    {
      id: 'animal_rescue',
      title: 'Giải Cứu Động Vật',
      subtitle: 'Lần theo dấu chân đưa cún về nhà',
      route: '/kids/games?game=animal_rescue',
      styleClass: 'bg-emerald-50 border-emerald-300 text-emerald-950',
    },
    {
      id: 'train_builder',
      title: 'Đoàn Tàu Ghép Câu',
      subtitle: 'Lắp ráp các toa tàu từ vựng',
      route: '/kids/games?game=train_builder',
      styleClass: 'bg-orange-50 border-orange-300 text-orange-950',
    },
    {
      id: 'feed_animal',
      title: 'Cho Thú Cưng Ăn',
      subtitle: 'Chọn đúng món ăn cho thú cưng',
      route: '/kids/games?game=feed_animal',
      styleClass: 'bg-amber-50 border-amber-300 text-amber-950',
    },
    {
      id: 'match_cards',
      title: 'Lật Thẻ Trí Nhớ 3D',
      subtitle: 'Tìm các cặp thẻ tương ứng',
      route: '/kids/games?game=match_cards',
      styleClass: 'bg-purple-50 border-purple-300 text-purple-950',
    },
    {
      id: 'balloon_pop',
      title: 'Bắn Nổ Bóng Bay',
      subtitle: 'Bắn nổ bóng từ vựng đúng',
      route: '/kids/games?game=balloon_pop',
      styleClass: 'bg-rose-50 border-rose-300 text-rose-950',
    },
    {
      id: 'treasure_island',
      title: 'Đảo Giấu Vàng',
      subtitle: 'Vượt sông khám phá hòm kho báu',
      route: '/kids/games?game=treasure_island',
      styleClass: 'bg-yellow-50 border-yellow-300 text-yellow-950',
    },
  ];

  const currentWorldTitle = nextLessonInfo ? nextLessonInfo.world.title : 'Rừng Rậm Diệu Kỳ';
  const currentLessonTitle = nextLessonInfo ? nextLessonInfo.lesson.title : 'Đỉnh Núi Vinh Quang';
  const progressPercent = Math.min(100, Math.round(((progress.level || 1) / 10) * 100));

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn pb-16 select-none">
      {/* ================================================================ */}
      {/* 1. ABOVE-THE-FOLD: "MY ENGLISH ADVENTURE" HERO BANNER            */}
      {/* ================================================================ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 p-5 sm:p-7 md:p-8 text-slate-950 border-2 border-amber-400 shadow-sm">
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/30 pointer-events-none blur-sm" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/25 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 justify-between">
          {/* Mascot Bobby & Short Greeting */}
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left w-full md:w-auto">
            <div className="hover:scale-105 transition-transform duration-300 shrink-0 cursor-pointer">
              <KidsMascot
                mood="excited"
                size={110}
                speechText="Mình học nhé!"
                onClick={() => {
                  soundManager.playDing();
                  celebrationManager.speakPraise('Chào bé! Bé giỏi quá!');
                }}
              />
            </div>

            <div className="flex-1">
              {/* Top Greeting Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs sm:text-sm font-black text-amber-950 mb-2 border-2 border-amber-400">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Chào bé!</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> {progress.totalStars} Sao</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-400" /> {progress.streakDays} ngày</span>
              </div>

              {/* Adventure Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950 leading-tight">
                Chuyến Phiêu Lưu Của Bé
              </h1>

              {/* Dynamic Next Lesson Milestone */}
              <div className="mt-3 flex flex-col sm:flex-row items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-950/10 backdrop-blur-sm border border-amber-950/20 text-xs font-black">
                  <span className="text-amber-900 uppercase tracking-wider">Chặng kế tiếp:</span>
                  <span className="underline decoration-amber-950 font-black">{currentLessonTitle}</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                  <span>{currentWorldTitle}</span>
                  <span>•</span>
                  <span>Tiến độ {progressPercent}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Big Action Button */}
          <div className="w-full md:w-auto shrink-0 flex justify-center">
            <button
              onClick={handleStartContinue}
              className="w-full sm:w-auto px-8 py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-base sm:text-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 border-b-4 border-emerald-700 cursor-pointer min-h-[52px]"
            >
              <span>TIẾP TỤC HÀNH TRÌNH</span>
              <Play className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 2. 4 QUICK ACTION HUB CARDS (No Emojis, Pure Lucide Icons)       */}
      {/* ================================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <button
          onClick={() => {
            soundManager.playPop();
            navigate('/kids/journey');
          }}
          className="p-4 sm:p-5 rounded-3xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 hover:scale-102 transition-all flex flex-col items-center text-center gap-2 cursor-pointer active:scale-95 min-h-[110px]"
        >
          <div className="w-13 h-13 rounded-2xl bg-amber-200 text-amber-950 flex items-center justify-center border-2 border-amber-400">
            <Mountain className="w-7 h-7 text-amber-800" />
          </div>
          <span className="font-black text-slate-950 text-sm sm:text-base">Vượt Núi</span>
          <span className="text-[11px] text-amber-900 font-bold">Bản đồ leo đèo</span>
        </button>

        <button
          onClick={() => {
            soundManager.playPop();
            navigate('/kids/games');
          }}
          className="p-4 sm:p-5 rounded-3xl bg-sky-50 hover:bg-sky-100 border-2 border-sky-300 hover:scale-102 transition-all flex flex-col items-center text-center gap-2 cursor-pointer active:scale-95 min-h-[110px]"
        >
          <div className="w-13 h-13 rounded-2xl bg-sky-200 text-sky-950 flex items-center justify-center border-2 border-sky-400">
            <Gamepad2 className="w-7 h-7 text-sky-800" />
          </div>
          <span className="font-black text-slate-950 text-sm sm:text-base">Khu Trò Chơi</span>
          <span className="text-[11px] text-sky-900 font-bold">12 Game hấp dẫn</span>
        </button>

        <button
          onClick={() => {
            soundManager.playPop();
            navigate('/kids/world');
          }}
          className="p-4 sm:p-5 rounded-3xl bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-300 hover:scale-102 transition-all flex flex-col items-center text-center gap-2 cursor-pointer active:scale-95 min-h-[110px]"
        >
          <div className="w-13 h-13 rounded-2xl bg-emerald-200 text-emerald-950 flex items-center justify-center border-2 border-emerald-400">
            <Compass className="w-7 h-7 text-emerald-800" />
          </div>
          <span className="font-black text-slate-950 text-sm sm:text-base">Đảo Của Bé</span>
          <span className="text-[11px] text-emerald-900 font-bold">Vườn từ & Giao tiếp</span>
        </button>

        <button
          onClick={() => {
            soundManager.playFanfare();
            navigate('/kids/parent');
          }}
          className="p-4 sm:p-5 rounded-3xl bg-purple-50 hover:bg-purple-100 border-2 border-purple-300 hover:scale-102 transition-all flex flex-col items-center text-center gap-2 cursor-pointer active:scale-95 min-h-[110px]"
        >
          <div className="w-13 h-13 rounded-2xl bg-purple-200 text-purple-950 flex items-center justify-center border-2 border-purple-400">
            <ShieldCheck className="w-7 h-7 text-purple-800" />
          </div>
          <span className="font-black text-slate-950 text-sm sm:text-base">Góc Bố Mẹ</span>
          <span className="text-[11px] text-purple-900 font-bold">Báo cáo & Cài đặt</span>
        </button>
      </div>

      {/* ================================================================ */}
      {/* 3. FEATURED PLAY & LEARN GAME HUB                                 */}
      {/* ================================================================ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-amber-600" />
              <span>Trò Chơi Học Tiếng Anh</span>
            </h2>
            <p className="text-xs sm:text-sm font-bold text-slate-700">
              Vừa chơi vừa nghe - không cần biết chữ vẫn học siêu vui!
            </p>
          </div>
          <button
            onClick={() => navigate('/kids/games')}
            className="text-xs sm:text-sm font-black text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer bg-white px-3.5 py-1.5 rounded-full border-2 border-indigo-200 hover:border-indigo-400 transition min-h-[36px]"
          >
            <span>Xem tất cả 12 game</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {featuredGames.map((game) => (
            <div
              key={game.id}
              onClick={() => {
                soundManager.playPop();
                navigate(game.route);
              }}
              className={`p-5 rounded-3xl border-2 ${game.styleClass} hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between shadow-xs`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-300 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white/95 text-slate-950 border border-slate-300 flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-slate-700" />
                    <span>Có âm thanh</span>
                  </span>
                </div>
                <h3 className="font-black text-base text-slate-950 leading-tight">
                  {game.title}
                </h3>
                <p className="text-xs font-bold text-slate-600 mt-1">
                  {game.subtitle}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-300/80 flex items-center justify-between text-xs font-black text-slate-950">
                <span>Chơi ngay</span>
                <Play className="w-4 h-4 fill-current" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================================================================ */}
      {/* 4. TODAY'S MISSION (DAILY QUESTS)                                */}
      {/* ================================================================ */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-amber-300 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-200 text-amber-950 flex items-center justify-center border-2 border-amber-400">
              <Trophy className="w-6 h-6 text-amber-800" />
            </div>
            <div>
              <h2 className="font-black text-slate-950 text-base sm:text-lg">
                Nhiệm Vụ Hôm Nay
              </h2>
              <p className="text-xs text-slate-700 font-extrabold">
                Hoàn thành nhiệm vụ nhận thêm sao vàng thưởng!
              </p>
            </div>
          </div>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-100 text-amber-950 border-2 border-amber-400">
            Làm mới mỗi ngày
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {(progress.dailyQuests || []).map((quest) => {
            const isDone = quest.progress >= quest.target;
            const pct = Math.min(100, Math.round((quest.progress / quest.target) * 100));

            let viTitle = quest.title;
            if (quest.title.toLowerCase().includes('learn')) viTitle = 'Học 5 từ mới';
            else if (quest.title.toLowerCase().includes('listen')) viTitle = 'Luyện nghe 5 lần';
            else if (quest.title.toLowerCase().includes('speak')) viTitle = 'Luyện phát âm 3 từ';
            else if (quest.title.toLowerCase().includes('game')) viTitle = 'Chơi 1 trò chơi';

            return (
              <div
                key={quest.id}
                className={`p-3.5 rounded-2xl border-2 transition-all ${
                  isDone
                    ? 'bg-emerald-50 border-emerald-400'
                    : 'bg-slate-50 border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-black text-xs text-slate-950">
                    {viTitle}
                  </span>
                  <span className="text-xs font-black text-amber-600 flex items-center gap-0.5">
                    +{quest.rewardStars} <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 inline" />
                  </span>
                </div>

                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-1.5">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isDone ? 'bg-emerald-500' : 'bg-amber-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-700 font-black">
                  <span>{quest.progress}/{quest.target}</span>
                  <span>{isDone ? 'Đã đạt!' : `${pct}%`}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================================================================ */}
      {/* 5. ADVENTURE WORLDS PREVIEW                                      */}
      {/* ================================================================ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2">
              <Map className="w-6 h-6 text-orange-600" />
              <span>Các Vùng Đất Phiêu Lưu</span>
            </h2>
            <p className="text-xs sm:text-sm font-bold text-slate-700">
              Chinh phục các chặng núi để mở khóa toàn bộ thế giới diệu kỳ!
            </p>
          </div>
          <button
            onClick={() => navigate('/kids/journey')}
            className="text-xs sm:text-sm font-black text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer bg-white px-3.5 py-1.5 rounded-full border-2 border-orange-200 hover:border-orange-400 transition min-h-[36px]"
          >
            <span>Xem Bản Đồ Vượt Núi</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {WORLDS_DATA.map((world, idx) => {
            const isUnlocked = idx === 0 || (progress.unlockedWorlds || []).includes(world.id);
            let worldStars = 0;
            let totalLessons = 0;
            world.chapters.forEach((ch) => {
              ch.lessons.forEach((ls) => {
                totalLessons++;
                worldStars += (progress.lessonScores || {})[ls.id]?.stars || 0;
              });
            });
            const maxStars = totalLessons * 3;

            return (
              <div
                key={world.id}
                onClick={() => handleWorldClick(world.id, isUnlocked)}
                className={`relative rounded-3xl p-5 border-2 transition-all cursor-pointer overflow-hidden ${
                  isUnlocked
                    ? 'bg-white hover:scale-102 border-amber-300 hover:border-orange-400 shadow-sm'
                    : 'bg-slate-100/90 border-dashed border-slate-300 opacity-80'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center border border-black/5"
                    style={{ backgroundColor: `${world.themeColor}30` }}
                  >
                    <Compass className="w-6 h-6 text-slate-800" />
                  </div>

                  {isUnlocked ? (
                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 border-2 border-amber-300 text-amber-950 text-xs font-black">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{worldStars}/{maxStars}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-xs font-black">
                      <KidsIcon name="lock" size={12} />
                      <span>Khóa</span>
                    </div>
                  )}
                </div>

                <h3 className="font-black text-slate-950 text-base mb-0.5">{world.title}</h3>
                <p className="text-xs text-slate-600 font-bold mb-3 line-clamp-1">{world.description}</p>

                <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-slate-200">
                  <span className="text-slate-600">{totalLessons} Bài học</span>
                  <span
                    className="font-black"
                    style={{ color: isUnlocked ? world.themeColor : '#64748b' }}
                  >
                    {isUnlocked ? 'Khám phá →' : `Mở Cấp ${idx + 1}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default KidsHomePage;
