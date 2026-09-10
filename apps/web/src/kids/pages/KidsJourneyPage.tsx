import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KidsIcon } from '../assets/icons/KidsIcons';
import { KidsMascot } from '../components/KidsMascot';
import { WORLDS_DATA, KidsWorld, KidsLesson } from '../curriculum/kidsCurriculum';
import { getKidsProgress } from '../curriculum/curriculumProgress';
import { soundManager } from '../services/sound/KidsSoundManager';
import { celebrationManager } from '../services/celebration/CelebrationManager';

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
      celebrationManager.speakPraise('Bé hãy hoàn thành các chặng đèo phía dưới trước nhé!');
    }
  };

  // Find the active (next) lesson index
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

  // 8 World Definitions aligned with spec
  const worldThemeBadges = [
    { id: 'world-1-jungle', label: 'Rừng Rậm', icon: '🌳', color: '#10b981' },
    { id: 'world-2-farm', label: 'Nông Trại', icon: '🍎', color: '#f59e0b' },
    { id: 'world-3-town', label: 'Thị Trấn', icon: '⚽', color: '#6366f1' },
    { id: 'world-ocean', label: 'Đại Dương', icon: '🌊', color: '#0ea5e9' },
    { id: 'world-desert', label: 'Sa Mạc', icon: '🏜️', color: '#ea580c' },
    { id: 'world-castle', label: 'Lâu Đài', icon: '🏰', color: '#a855f7' },
    { id: 'world-space', label: 'Vũ Trụ', icon: '🚀', color: '#ec4899' },
    { id: 'world-dino', label: 'Khủng Long', icon: '🦖', color: '#14b8a6' },
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn max-w-4xl mx-auto pb-24">
      {/* ================================================================ */}
      {/* 1. WORLD TABS SWITCHER (8 THEMED ADVENTURE WORLDS)               */}
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
                  ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-md scale-102'
                  : 'kids-liquid-card text-slate-800 border-amber-200 hover:bg-amber-50'
              }`}
            >
              <span className="text-xl">{world.icon || '🌴'}</span>
              <span>{world.title}</span>
              {!unlocked && (
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full font-bold">
                  🔒
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ================================================================ */}
      {/* 2. EXPEDITION BANNER (MOUNTAIN PASS THEME)                       */}
      {/* ================================================================ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 text-white p-6 sm:p-8 shadow-md border-3 border-emerald-400">
        <div className="absolute inset-0 pointer-events-none opacity-20 flex items-end justify-between select-none">
          <span className="text-9xl leading-none -mb-8">⛰️</span>
          <span className="text-8xl leading-none -mb-6">🏔️</span>
          <span className="text-9xl leading-none -mb-10">⛰️</span>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/25 backdrop-blur-md text-xs font-black uppercase tracking-wider mb-2 border border-white/30">
              <span>🧗 Cung Đường Vượt Núi</span>
              <span>•</span>
              <span>Cấp độ {currentWorld.level}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white">{currentWorld.title}</h1>
            <p className="text-emerald-100 font-bold text-xs sm:text-sm mt-1 max-w-md">
              Cùng gấu Bobby leo qua các khúc cua hiểm trở để cắm cờ tại Đỉnh Núi Vinh Quang!
            </p>
          </div>

          <div className="kids-liquid-card p-3 rounded-2xl border-2 border-white/40 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center text-2xl font-black shadow-xs">
              🚩
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">Mục tiêu đỉnh đèo</p>
              <p className="text-sm font-black text-slate-950">{allWorldLessons.length} Trạm Kiểm Soát</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 3. WINDING MOUNTAIN PASS MAP CONTAINER                           */}
      {/* ================================================================ */}
      <div className="relative rounded-3xl bg-gradient-to-b from-sky-100/80 via-amber-50/70 to-emerald-100/80 border-3 border-amber-300 p-4 sm:p-8 shadow-xs overflow-hidden">
        {/* Soft mountain scenery background accents */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          <div className="absolute top-8 left-6 text-3xl opacity-40 animate-gentle-float">☁️</div>
          <div className="absolute top-28 right-8 text-4xl opacity-50 animate-gentle-float" style={{ animationDelay: '1s' }}>☁️</div>
          <div className="absolute top-1/2 left-4 text-3xl opacity-40 animate-gentle-float" style={{ animationDelay: '2s' }}>☁️</div>
          <div className="absolute bottom-40 right-6 text-4xl opacity-50 animate-gentle-float" style={{ animationDelay: '3s' }}>☁️</div>

          {/* Pine trees along the slopes */}
          <div className="absolute top-24 left-16 text-3xl opacity-50">🌲</div>
          <div className="absolute top-72 right-12 text-3xl opacity-50">🌲</div>
          <div className="absolute top-1/3 left-10 text-4xl opacity-60">🌲</div>
          <div className="absolute top-2/3 right-16 text-4xl opacity-60">🌲</div>
          <div className="absolute bottom-20 left-12 text-4xl opacity-60">🌲</div>
          <div className="absolute bottom-10 right-20 text-3xl opacity-50">🏕️</div>
        </div>

        {/* SUMMIT: Summit Castle & Golden Trophy Banner */}
        <div className="relative z-20 flex flex-col items-center justify-center mb-10 text-center">
          <div className="relative group cursor-pointer hover:scale-105 transition-transform">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 border-4 border-white shadow-xl flex flex-col items-center justify-center text-4xl sm:text-5xl">
              🏆
              <span className="text-[10px] sm:text-xs font-black bg-white text-amber-950 px-2 py-0.5 rounded-full mt-1 border border-amber-400">
                ĐỈNH NÚI
              </span>
            </div>
            <div className="absolute -top-3 -right-3 text-3xl animate-bounce">
              🚩
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 mt-2">
            Đỉnh Núi Vinh Quang
          </h2>
          <p className="text-xs font-black text-amber-900">
            Rương kho báu vàng đang chờ bé ở đích đến!
          </p>
        </div>

        {/* Winding S-Curved Mountain Pass Nodes */}
        <div className="relative z-10 flex flex-col items-center gap-12 sm:gap-16 py-4">
          {/* Central dashed mountain trail line */}
          <div className="absolute top-4 bottom-4 left-1/2 -translate-x-1/2 w-6 sm:w-8 bg-amber-200/90 rounded-full border-2 border-dashed border-amber-400 shadow-inner z-0 pointer-events-none" />

          {allWorldLessons.map((item, idx) => {
            const isUnlocked =
              ((idx === 0 && isWorldUnlocked) || (progress.unlockedLessons || []).includes(item.lesson.id)) &&
              isWorldUnlocked;
            const score = (progress.lessonScores || {})[item.lesson.id];
            const stars = score?.stars || 0;
            const isCurrentActive = idx === activeLessonIdx;

            // Meandering mountain road offsets (zigzag left -> center -> right)
            const zigzag = idx % 4;
            let offsetClass = 'translate-x-0';
            if (zigzag === 0) offsetClass = 'sm:-translate-x-28 -translate-x-14';
            else if (zigzag === 1) offsetClass = 'translate-x-0';
            else if (zigzag === 2) offsetClass = 'sm:translate-x-28 translate-x-14';
            else if (zigzag === 3) offsetClass = 'translate-x-0';

            return (
              <div
                key={item.lesson.id}
                className={`relative flex flex-col items-center transition-all ${offsetClass}`}
              >
                {/* Bobby the Bear Hiker at the Current Active Checkpoint */}
                {isCurrentActive && (
                  <div
                    onClick={() => {
                      soundManager.playDing();
                      celebrationManager.speakPraise('Cố lên bé ơi! Đỉnh núi sắp tới rồi!');
                    }}
                    className="absolute -top-20 -right-20 sm:-right-24 z-30 cursor-pointer animate-bounce group"
                  >
                    <div className="relative">
                      <KidsMascot
                        mood="excited"
                        size={80}
                        speechText="Leo đèo cùng mình!"
                      />
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-500 text-white font-black text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap shadow-xs border border-white">
                        Trạm đang leo! 🎒
                      </span>
                    </div>
                  </div>
                )}

                {/* Altitude checkpoint sign */}
                <div className="mb-2 px-3 py-0.5 rounded-full bg-white/95 border-2 border-amber-300 text-[10px] font-black text-slate-950 shadow-xs flex items-center gap-1">
                  <span>Trạm {idx + 1}</span>
                  <span>•</span>
                  <span>{stars > 0 ? `${stars} ⭐` : isUnlocked ? 'Sẵn sàng' : 'Khóa 🔒'}</span>
                </div>

                {/* Big 3D Checkpoint Button */}
                <button
                  onClick={() => handleSelectLesson(item.lesson, isUnlocked)}
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex flex-col items-center justify-center transition-all cursor-pointer relative shadow-md ${
                    stars > 0
                      ? 'kids-liquid-emerald text-slate-950 border-4 border-emerald-500 hover:scale-105 active:scale-95'
                      : isCurrentActive
                      ? 'kids-liquid-amber text-slate-950 border-4 border-amber-400 ring-4 ring-amber-400/50 hover:scale-110 active:scale-95 animate-pulse'
                      : isUnlocked
                      ? 'kids-liquid-sky text-slate-950 border-4 border-sky-400 hover:scale-105 active:scale-95'
                      : 'bg-slate-200 text-slate-400 border-4 border-slate-300 cursor-not-allowed opacity-80'
                  }`}
                  title={item.lesson.title}
                >
                  <span className="text-3xl sm:text-4xl filter drop-shadow-xs">
                    {stars > 0 ? '⭐' : isCurrentActive ? '✨' : isUnlocked ? '🎒' : '🔒'}
                  </span>

                  {stars > 0 && (
                    <div className="absolute -bottom-2 bg-white px-2 py-0.5 rounded-full shadow-xs border border-emerald-400 flex items-center gap-0.5">
                      {[1, 2, 3].map((s) => (
                        <span
                          key={s}
                          className={`text-[11px] ${
                            s <= stars ? 'text-amber-500' : 'text-slate-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  )}
                </button>

                {/* Station Title Label in High Contrast */}
                <div className="mt-2 text-center max-w-[130px] sm:max-w-[160px]">
                  <p className="font-black text-xs sm:text-sm text-slate-950 leading-tight">
                    {item.lesson.title}
                  </p>
                  <p className="text-[10px] font-bold text-slate-600 mt-0.5">
                    {item.chapterTitle}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Base of the Mountain Marker */}
          <div className="relative z-10 flex flex-col items-center text-center mt-6 pt-4 border-t-2 border-dashed border-amber-400 w-full max-w-xs">
            <div className="w-14 h-14 rounded-2xl kids-liquid-emerald border-2 border-emerald-500 flex items-center justify-center text-2xl shadow-xs mb-1">
              🏕️
            </div>
            <p className="font-black text-xs sm:text-sm text-slate-950">
              Trạm Xuất Phát (Chân Núi)
            </p>
            <p className="text-[11px] font-bold text-slate-700">
              Bắt đầu hành trình leo đèo vượt núi cùng Gấu Bobby!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KidsJourneyPage;
