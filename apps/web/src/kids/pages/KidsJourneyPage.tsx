import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  KidsMapIcon,
  KidsStarIcon,
  KidsLockIcon,
  KidsTrophyIcon,
  KidsPlayIcon,
  KidsCheckIcon,
} from '../assets/icons/KidsIcons';
import { KidsMascot } from '../components/KidsMascot';
import { WORLDS_DATA, KidsWorld, KidsLesson } from '../curriculum/kidsCurriculum';
import { getKidsProgress } from '../curriculum/curriculumProgress';
import { soundManager } from '../services/sound/KidsSoundManager';
import { celebrationManager } from '../services/celebration/CelebrationManager';
import { VectorTrophy } from '../assets/illustrations/KidsVectors';
import { Play, RotateCcw, Lock, Flag, Compass, ChevronRight, Star, Trophy } from 'lucide-react';

export const KidsJourneyPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [progress, setProgress] = useState(getKidsProgress());

  // Current selected world
  const initialWorldId = searchParams.get('world') || WORLDS_DATA[0].id;
  const [selectedWorldId, setSelectedWorldId] = useState(initialWorldId);

  useEffect(() => {
    setProgress(getKidsProgress());
  }, []);

  const currentWorld: KidsWorld =
    WORLDS_DATA.find((w) => w.id === selectedWorldId) || WORLDS_DATA[0];

  const isWorldUnlocked =
    currentWorld.id === WORLDS_DATA[0].id ||
    (progress.unlockedWorlds || []).includes(currentWorld.id);

  // Flatten lessons in current world with chapter context
  const allWorldLessons: { lesson: KidsLesson; chapterTitle: string; index: number }[] = [];
  let globalLessonIdx = 0;
  currentWorld.chapters.forEach((chap) => {
    chap.lessons.forEach((lesson) => {
      allWorldLessons.push({
        lesson,
        chapterTitle: chap.title,
        index: globalLessonIdx++,
      });
    });
  });

  const handleSelectLesson = (lesson: KidsLesson, isUnlocked: boolean) => {
    if (isUnlocked) {
      soundManager.playDing();
      navigate(`/kids/lesson/${lesson.id}`);
    } else {
      soundManager.playIncorrect();
      celebrationManager.speakPraise('Bé hãy hoàn thành các trạm đèo phía trước để mở khóa nhé!');
    }
  };

  // Find active lesson index
  let activeLessonIdx = 0;
  for (let i = 0; i < allWorldLessons.length; i++) {
    const lId = allWorldLessons[i].lesson.id;
    const isUnlocked =
      ((i === 0 && isWorldUnlocked) || (progress.unlockedLessons || []).includes(lId)) && isWorldUnlocked;
    const score = (progress.lessonScores || {})[lId];
    if (isUnlocked && (!score || score.stars === 0)) {
      activeLessonIdx = i;
      break;
    }
    if (isUnlocked) {
      activeLessonIdx = i;
    }
  }

  const activeLesson = allWorldLessons[activeLessonIdx]?.lesson;

  // Split lessons into horizontal zigzag rows of 4 stations each
  const STATIONS_PER_ROW = 4;
  const zigzagRows: typeof allWorldLessons[] = [];
  for (let i = 0; i < allWorldLessons.length; i += STATIONS_PER_ROW) {
    const slice = allWorldLessons.slice(i, i + STATIONS_PER_ROW);
    // If row index is odd, reverse order for true zigzag S-curve flow
    const rowIndex = Math.floor(i / STATIONS_PER_ROW);
    zigzagRows.push(rowIndex % 2 === 1 ? [...slice].reverse() : slice);
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn max-w-5xl mx-auto pb-24 select-none">
      {/* ================================================================ */}
      {/* 1. WORLD TABS SWITCHER                                           */}
      {/* ================================================================ */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
        {WORLDS_DATA.map((world, wIdx) => {
          const unlocked = wIdx === 0 || (progress.unlockedWorlds || []).includes(world.id);
          const active = world.id === selectedWorldId;
          return (
            <button
              key={world.id}
              onClick={() => {
                soundManager.playPop();
                setSelectedWorldId(world.id);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer border-2 ${
                active
                  ? 'bg-amber-400 text-amber-950 border-amber-500 scale-102'
                  : 'kids-liquid-card text-slate-800 border-amber-200 hover:bg-amber-50'
              }`}
            >
              <Compass className="w-4 h-4 text-amber-800" />
              <span>{world.title}</span>
              {!unlocked && (
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full font-bold inline-flex items-center">
                  <Lock className="w-2.5 h-2.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ================================================================ */}
      {/* 2. EXPEDITION BANNER (MOUNTAIN ADVENTURE HEADER)                 */}
      {/* ================================================================ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 text-white p-6 sm:p-8 border-2 border-emerald-400 shadow-sm">

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/25 backdrop-blur-md text-xs font-black uppercase tracking-wider mb-2 border border-white/30">
              <KidsMapIcon size={18} />
              <span>Cung Đường Vượt Núi Gấp Khúc</span>
              <span>•</span>
              <span>Cấp độ {currentWorld.level}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white">{currentWorld.title}</h1>
            <p className="text-emerald-100 font-bold text-xs sm:text-sm mt-1 max-w-md">
              Vượt qua từng trạm kiểm soát uốn lượn liên hoàn để cắm cờ tại Đỉnh Núi Vinh Quang!
            </p>
          </div>

          <div className="kids-liquid-card p-3.5 rounded-2xl border-2 border-white/40 flex items-center gap-3 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black">
              <Flag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">Mục tiêu đỉnh đèo</p>
              <p className="text-sm font-black text-slate-950">{allWorldLessons.length} Trạm Kiểm Soát</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 3. DEDICATED BOBBY COMPANION BAR (NEVER OVERLAPS TITLES OR NODES) */}
      {/* ================================================================ */}
      <div className="kids-liquid-amber p-4 sm:p-5 rounded-3xl border-2 border-amber-400 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div
            onClick={() => {
              soundManager.playDing();
              celebrationManager.speakPraise('Cố lên bé ơi! Đỉnh núi sắp tới rồi!');
            }}
            className="cursor-pointer hover:scale-110 transition-transform shrink-0"
          >
            <KidsMascot mood="excited" size={68} speechText="Leo đèo cùng Bobby nào!" />
          </div>
          <div>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 border border-amber-300 inline-flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              Bạn Đồng Hành Leo Núi
            </span>
            <h3 className="font-black text-slate-950 text-base sm:text-lg mt-0.5">
              Trạm kế tiếp: {activeLesson ? activeLesson.title : 'Đỉnh Núi Vinh Quang'}
            </h3>
            <p className="text-xs font-bold text-amber-900">
              Bé đã vượt qua {activeLessonIdx} / {allWorldLessons.length} trạm kiểm soát.
            </p>
          </div>
        </div>

        {activeLesson && (
          <button
            onClick={() => handleSelectLesson(activeLesson, true)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm flex items-center justify-center gap-2 border-b-4 border-emerald-700 cursor-pointer active:scale-95 shrink-0 animate-bounce"
          >
            <KidsPlayIcon size={20} />
            <span>VÀO TRẠM NÀY NGAY</span>
            <Play className="w-4 h-4 fill-current" />
          </button>
        )}
      </div>

      {/* ================================================================ */}
      {/* 4. CONTINUOUS HORIZONTAL ZIGZAG MOUNTAIN TRAIL CONTAINER         */}
      {/* ================================================================ */}
      <div className="relative rounded-3xl bg-gradient-to-b from-sky-100/90 via-amber-50/80 to-emerald-100/90 border-2 border-amber-300 p-6 sm:p-10 overflow-hidden">
        {/* SUMMIT: Castle & Golden Trophy Destination */}
        <div className="relative z-10 flex flex-col items-center justify-center mb-8 text-center">
          <div className="relative group cursor-pointer hover:scale-105 transition-transform">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 border-4 border-white flex flex-col items-center justify-center shadow-md">
              <KidsTrophyIcon size={64} />
            </div>
            <span className="absolute -top-2 -right-2 p-1.5 rounded-full bg-white shadow-xs border border-slate-200">
              <Flag className="w-5 h-5 text-rose-500 fill-rose-500" />
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 mt-2 flex items-center justify-center gap-1.5">
            <span>Đỉnh Núi Vinh Quang</span>
            <Trophy className="w-6 h-6 text-amber-500" />
          </h2>
          <p className="text-xs font-black text-amber-900 bg-white/80 px-3 py-1 rounded-full border border-amber-300 mt-1">
            Rương kho báu vàng đang chờ bé ở đích đến!
          </p>
        </div>

        {/* ZIGZAG S-CURVE HORIZONTAL ROWS WITH SEAMLESS CONTINUOUS ROAD */}
        <div className="relative z-10 space-y-12 sm:space-y-16">
          {zigzagRows.map((rowItems, rIdx) => {
            const isReversed = rIdx % 2 === 1;

            return (
              <div key={`row-${rIdx}`} className="relative">
                {/* Horizontal Road Trail - Solid Amber Ribbon with Center Trail Marks */}
                <div className="hidden sm:flex items-center absolute top-1/2 left-8 right-8 h-8 -translate-y-1/2 rounded-full bg-amber-400 border-4 border-amber-500 shadow-md z-0 overflow-hidden">
                  <div className="w-full h-1 border-t-2 border-dashed border-amber-100/90" />
                </div>

                {/* Seamless Connecting Turnaround Horseshoe Loop between rows (Exact width match) */}
                {rIdx < zigzagRows.length - 1 && (
                  <div
                    className={`hidden sm:block absolute -bottom-16 w-24 h-24 z-0 ${
                      isReversed ? '-left-4' : '-right-4'
                    }`}
                  >
                    <svg viewBox="0 0 96 96" className="w-full h-full overflow-visible">
                      {isReversed ? (
                        // Loop from Row bottom-left curving to Next Row top-left
                        <g>
                          <path
                            d="M 64,0 C 10,0 10,96 64,96"
                            fill="none"
                            stroke="#fbbf24"
                            strokeWidth="32"
                            strokeLinecap="round"
                          />
                          <path
                            d="M 64,0 C 10,0 10,96 64,96"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="4"
                          />
                          <path
                            d="M 64,0 C 10,0 10,96 64,96"
                            fill="none"
                            stroke="#fef3c7"
                            strokeWidth="3"
                            strokeDasharray="6,6"
                          />
                        </g>
                      ) : (
                        // Loop from Row bottom-right curving to Next Row top-right
                        <g>
                          <path
                            d="M 32,0 C 86,0 86,96 32,96"
                            fill="none"
                            stroke="#fbbf24"
                            strokeWidth="32"
                            strokeLinecap="round"
                          />
                          <path
                            d="M 32,0 C 86,0 86,96 32,96"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="4"
                          />
                          <path
                            d="M 32,0 C 86,0 86,96 32,96"
                            fill="none"
                            stroke="#fef3c7"
                            strokeWidth="3"
                            strokeDasharray="6,6"
                          />
                        </g>
                      )}
                    </svg>
                  </div>
                )}

                {/* Checkpoint Nodes in this Row (z-10, 100% Solid Opacity to completely block background line) */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6 relative z-10">
                  {rowItems.map((item) => {
                    const isUnlocked =
                      ((item.index === 0 && isWorldUnlocked) ||
                        (progress.unlockedLessons || []).includes(item.lesson.id)) &&
                      isWorldUnlocked;
                    const score = (progress.lessonScores || {})[item.lesson.id];
                    const stars = score?.stars || 0;
                    const isCurrentActive = item.index === activeLessonIdx;

                    return (
                      <div
                        key={item.lesson.id}
                        onClick={() => handleSelectLesson(item.lesson, isUnlocked)}
                        className={`relative rounded-3xl p-4 sm:p-5 border-3 transition-all flex flex-col items-center text-center justify-between gap-3 cursor-pointer shadow-md bg-white ${
                          isCurrentActive
                            ? '!bg-amber-100 border-amber-500 ring-4 ring-amber-400/60 scale-105 animate-pulse'
                            : stars > 0
                            ? '!bg-emerald-50 border-emerald-500 hover:scale-102 hover:border-emerald-600'
                            : isUnlocked
                            ? '!bg-white border-sky-400 hover:border-amber-400 hover:scale-102 hover:shadow-lg'
                            : '!bg-slate-100 border-slate-300 opacity-90 cursor-not-allowed'
                        }`}
                      >
                        {/* Station Number Header */}
                        <div className="w-full flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full bg-white border-2 border-slate-300 text-[10px] font-black text-slate-950">
                            Trạm {item.index + 1}
                          </span>

                          {stars > 0 ? (
                            <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-400 text-amber-500 text-xs font-black">
                              {[1, 2, 3].map((s) => (
                                <KidsStarIcon key={s} size={14} filled={s <= stars} />
                              ))}
                            </div>
                          ) : isCurrentActive ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black animate-pulse flex items-center gap-1">
                              <span>ĐANG ĐẾN</span>
                              <Compass className="w-3 h-3" />
                            </span>
                          ) : null}
                        </div>

                        {/* Station Center Orb */}
                        <div className="relative my-1">
                          <div
                            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-3xl sm:text-4xl border-2 transition-transform ${
                              isCurrentActive
                                ? 'bg-amber-300 border-amber-500 scale-110'
                                : stars > 0
                                ? 'bg-emerald-200 border-emerald-400'
                                : isUnlocked
                                ? 'bg-sky-100 border-sky-300 hover:scale-105'
                                : 'bg-slate-200 border-slate-400'
                            }`}
                          >
                            {isUnlocked ? (
                              item.lesson.emoji || '⭐'
                            ) : (
                              <KidsLockIcon size={28} />
                            )}
                          </div>

                          {/* Completed Checkmark Badge */}
                          {stars > 0 && (
                            <div className="absolute -top-1 -right-1">
                              <KidsCheckIcon size={22} />
                            </div>
                          )}
                        </div>

                        {/* Station Info */}
                        <div className="w-full">
                          <h4 className="font-black text-slate-950 text-xs sm:text-sm line-clamp-1">
                            {item.lesson.title}
                          </h4>
                          <p className="text-[11px] font-bold text-slate-600 line-clamp-1 mt-0.5">
                            {item.chapterTitle}
                          </p>
                        </div>

                        {/* Action CTA Button */}
                        <div className="w-full pt-1">
                          {isCurrentActive ? (
                            <div className="w-full py-2 rounded-xl bg-amber-500 text-amber-950 font-black text-xs border-b-2 border-amber-700 text-center flex items-center justify-center gap-1.5 shadow-sm">
                              <span>BẮT ĐẦU NGAY</span>
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </div>
                          ) : stars > 0 ? (
                            <div className="w-full py-1.5 rounded-xl bg-white text-emerald-800 font-black text-[11px] border border-emerald-300 text-center flex items-center justify-center gap-1.5 shadow-sm">
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Luyện Lại</span>
                            </div>
                          ) : isUnlocked ? (
                            <div className="w-full py-1.5 rounded-xl bg-sky-100 text-sky-950 font-black text-[11px] border border-sky-300 text-center flex items-center justify-center gap-1.5 shadow-sm">
                              <span>Mở Khóa</span>
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </div>
                          ) : (
                            <div className="w-full py-1.5 rounded-xl bg-slate-200 text-slate-500 font-black text-[11px] text-center flex items-center justify-center gap-1.5">
                              <Lock className="w-3.5 h-3.5" />
                              <span>Chưa Mở</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default KidsJourneyPage;
