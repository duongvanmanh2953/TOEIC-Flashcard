import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KidsMascot } from '../components/KidsMascot';
import { KidsIcon } from '../assets/icons/KidsIcons';
import { getKidsProgress, getNextLessonToLearn } from '../curriculum/curriculumProgress';
import { WORLDS_DATA } from '../curriculum/kidsCurriculum';
import { soundManager } from '../services/sound/KidsSoundManager';
import { celebrationManager } from '../services/celebration/CelebrationManager';

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
      celebrationManager.speakPraise('Bé vượt qua các bài học trước để mở khóa vùng đất này nhé!');
    }
  };

  // Quick Games featured list
  const featuredGames = [
    {
      id: 'find_it',
      title: 'Tìm Hình Theo Tiếng',
      subtitle: 'Nghe tên và chọn đúng hình',
      emoji: '🦁',
      route: '/kids/games?game=find_it',
      styleClass: 'kids-liquid-amber',
      accentColor: '#f59e0b',
    },
    {
      id: 'bubble',
      title: 'Bắt Bong Bóng',
      subtitle: 'Đập bóng từ vựng nổ tung',
      emoji: '🎈',
      route: '/kids/games?game=bubble',
      styleClass: 'kids-liquid-sky',
      accentColor: '#0ea5e9',
    },
    {
      id: 'memory',
      title: 'Lật Thẻ Trí Nhớ',
      subtitle: 'Tìm các cặp hình giống nhau',
      emoji: '🎴',
      route: '/kids/games?game=memory',
      styleClass: 'kids-liquid-purple',
      accentColor: '#a855f7',
    },
    {
      id: 'rocket',
      title: 'Tên Lửa Không Gian',
      subtitle: 'Phóng tên lửa từ vựng bay xa',
      emoji: '🚀',
      route: '/kids/games?game=rocket',
      styleClass: 'kids-liquid-rose',
      accentColor: '#f43f5e',
    },
    {
      id: 'train',
      title: 'Tàu Ghép Chữ',
      subtitle: 'Lắp chữ cái vào toa tàu',
      emoji: '🚂',
      route: '/kids/games?game=train',
      styleClass: 'kids-liquid-emerald',
      accentColor: '#10b981',
    },
    {
      id: 'speak_unlock',
      title: 'Thần Chú Mở Cửa',
      subtitle: 'Luyện đọc tiếng Anh mở rương báu',
      emoji: '🎤',
      route: '/kids/games?game=speak_unlock',
      styleClass: 'kids-liquid-amber',
      accentColor: '#f59e0b',
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn pb-16">
      {/* ================================================================ */}
      {/* 1. ABOVE-THE-FOLD: GREETING & CURRENT ADVENTURE HERO             */}
      {/* ================================================================ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 p-6 md:p-8 text-slate-950 border-3 border-amber-400 shadow-md">
        {/* Soft background decor */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/30 pointer-events-none blur-sm" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/25 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
            <div className="hover:scale-105 transition-transform duration-300">
              <KidsMascot
                mood="excited"
                size={120}
                speechText="Mình học nhé!"
                onClick={() => {
                  soundManager.playDing();
                  celebrationManager.speakPraise('Chào bé! Bé giỏi quá!');
                }}
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md text-xs sm:text-sm font-black text-amber-950 mb-2 border border-amber-400/50 shadow-xs">
                <span>👋 Chào bé!</span>
                <span>•</span>
                <span>⭐ Cấp độ {progress.level}</span>
                <span>•</span>
                <span>🔥 {progress.streakDays} ngày</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950">
                Hành Trình Vượt Núi 🏔️
              </h1>
              <p className="text-slate-800 font-extrabold text-sm sm:text-base mt-1 max-w-md">
                {nextLessonInfo
                  ? `Bài tiếp theo: ${nextLessonInfo.lesson.title} (${nextLessonInfo.world.title})`
                  : 'Bé đã chinh phục toàn bộ chặng đường! Xuất sắc quá!'}
              </p>
            </div>
          </div>

          {/* Primary Action Button (Enticing 3D Press CTA) */}
          <div className="w-full md:w-auto shrink-0">
            <button
              onClick={handleStartContinue}
              className="w-full md:w-auto px-8 py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-lg md:text-xl shadow-lg hover:scale-102 active:scale-95 transition-all flex items-center justify-center gap-3 border-b-4 border-emerald-700 cursor-pointer"
            >
              <KidsIcon name="play" size={26} className="text-white fill-white" />
              <span>TIẾP TỤC HÀNH TRÌNH ▶</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 2. 4 QUICK ACTION HUB CARDS                                      */}
      {/* ================================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <button
          onClick={() => {
            soundManager.playPop();
            navigate('/kids/journey');
          }}
          className="p-4 sm:p-5 rounded-3xl kids-liquid-amber hover:scale-102 transition-all flex flex-col items-center text-center gap-2 cursor-pointer active:scale-95 shadow-xs"
        >
          <div className="w-13 h-13 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center text-2xl border border-amber-300 shadow-inner">
            🧗
          </div>
          <span className="font-black text-slate-950 text-sm sm:text-base">Vượt Núi</span>
          <span className="text-[11px] text-amber-900 font-bold">Bản đồ leo đèo</span>
        </button>

        <button
          onClick={() => {
            soundManager.playPop();
            navigate('/kids/games');
          }}
          className="p-4 sm:p-5 rounded-3xl kids-liquid-sky hover:scale-102 transition-all flex flex-col items-center text-center gap-2 cursor-pointer active:scale-95 shadow-xs"
        >
          <div className="w-13 h-13 rounded-2xl bg-sky-200 text-sky-900 flex items-center justify-center text-2xl border border-sky-300 shadow-inner">
            🎮
          </div>
          <span className="font-black text-slate-950 text-sm sm:text-base">Khu Trò Chơi</span>
          <span className="text-[11px] text-sky-900 font-bold">8 Game vui nhộn</span>
        </button>

        <button
          onClick={() => {
            soundManager.playPop();
            navigate('/kids/world');
          }}
          className="p-4 sm:p-5 rounded-3xl kids-liquid-emerald hover:scale-102 transition-all flex flex-col items-center text-center gap-2 cursor-pointer active:scale-95 shadow-xs"
        >
          <div className="w-13 h-13 rounded-2xl bg-emerald-200 text-emerald-900 flex items-center justify-center text-2xl border border-emerald-300 shadow-inner">
            🏝️
          </div>
          <span className="font-black text-slate-950 text-sm sm:text-base">Đảo Của Bé</span>
          <span className="text-[11px] text-emerald-900 font-bold">Vườn từ & Hình dán</span>
        </button>

        <button
          onClick={() => {
            soundManager.playFanfare();
            navigate('/kids/parent');
          }}
          className="p-4 sm:p-5 rounded-3xl kids-liquid-purple hover:scale-102 transition-all flex flex-col items-center text-center gap-2 cursor-pointer active:scale-95 shadow-xs"
        >
          <div className="w-13 h-13 rounded-2xl bg-purple-200 text-purple-900 flex items-center justify-center text-2xl border border-purple-300 shadow-inner">
            🛡️
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
              <span>🎮</span>
              <span>Trò Chơi Học Tiếng Anh</span>
            </h2>
            <p className="text-xs sm:text-sm font-bold text-slate-600">
              Vừa chơi vừa nghe - không cần biết chữ vẫn học siêu vui!
            </p>
          </div>
          <button
            onClick={() => navigate('/kids/games')}
            className="text-xs sm:text-sm font-black text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
          >
            Tất cả trò chơi →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {featuredGames.map((game) => (
            <div
              key={game.id}
              onClick={() => {
                soundManager.playPop();
                navigate(game.route);
              }}
              className={`p-4 sm:p-5 rounded-3xl ${game.styleClass} hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-4xl filter drop-shadow-xs">{game.emoji}</span>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white/90 text-slate-950 border border-slate-200 shadow-2xs">
                    Âm thanh 🔊
                  </span>
                </div>
                <h3 className="font-black text-sm sm:text-base text-slate-950 leading-tight">
                  {game.title}
                </h3>
                <p className="text-[11px] font-bold text-slate-700 mt-0.5 line-clamp-1">
                  {game.subtitle}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-black/10 flex items-center justify-between text-xs font-black text-slate-900">
                <span>Chơi ngay</span>
                <span>▶</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================================================================ */}
      {/* 4. TODAY'S MISSION (DAILY QUESTS)                                */}
      {/* ================================================================ */}
      <div className="kids-liquid-card p-5 sm:p-6 rounded-3xl border-3 border-amber-300 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center text-xl shadow-inner border border-amber-300">
              🏆
            </div>
            <div>
              <h2 className="font-black text-slate-950 text-base sm:text-lg">
                🌟 Nhiệm Vụ Hôm Nay
              </h2>
              <p className="text-xs text-slate-700 font-extrabold">
                Hoàn thành nhiệm vụ nhận thêm sao vàng thưởng!
              </p>
            </div>
          </div>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-100 text-amber-950 border border-amber-300">
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
                    : 'bg-white/85 border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-black text-xs text-slate-950">
                    {viTitle}
                  </span>
                  <span className="text-xs font-black text-amber-600 flex items-center gap-0.5">
                    +{quest.rewardStars} ⭐
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
                  <span>{isDone ? '🎉 Đã đạt!' : `${pct}%`}</span>
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
              <span>🗺️</span>
              <span>Các Vùng Đất Phiêu Lưu</span>
            </h2>
            <p className="text-xs sm:text-sm font-bold text-slate-600">
              Chinh phục các chặng núi để mở khóa toàn bộ thế giới diệu kỳ!
            </p>
          </div>
          <button
            onClick={() => navigate('/kids/journey')}
            className="text-xs sm:text-sm font-black text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
          >
            Xem Bản Đồ Vượt Núi →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {WORLDS_DATA.slice(0, 3).map((world, idx) => {
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
                className={`relative rounded-3xl p-5 border-3 transition-all cursor-pointer overflow-hidden ${
                  isUnlocked
                    ? 'kids-liquid-card hover:scale-102 border-amber-300 hover:border-orange-400'
                    : 'bg-slate-100/80 border-dashed border-slate-300 opacity-80'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-xs border border-black/5"
                    style={{ backgroundColor: `${world.themeColor}25` }}
                  >
                    {world.icon || '🌴'}
                  </div>

                  {isUnlocked ? (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-950 text-xs font-black">
                      <KidsIcon name="star" size={14} className="fill-amber-500 text-amber-500" />
                      <span>{worldStars}/{maxStars}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-black">
                      <KidsIcon name="lock" size={14} />
                      <span>Đang Khóa</span>
                    </div>
                  )}
                </div>

                <h3 className="font-black text-slate-950 text-base mb-1">{world.title}</h3>
                <p className="text-xs text-slate-700 font-bold mb-3 line-clamp-2">{world.description}</p>

                <div className="flex items-center justify-between text-xs font-bold pt-2.5 border-t border-slate-200">
                  <span className="text-slate-700">{totalLessons} Bài học</span>
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
