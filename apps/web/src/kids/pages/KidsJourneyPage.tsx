import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import { KidsIcon } from '../assets/icons/KidsIcons';
import { KidsMascot } from '../components/KidsMascot';
import { WORLDS_DATA, KidsWorld, KidsLesson } from '../curriculum/kidsCurriculum';
import { getKidsProgress } from '../curriculum/curriculumProgress';
import { soundManager } from '../services/sound/KidsSoundManager';
import { speechManager } from '../services/speech/KidsSpeechManager';

export const KidsJourneyPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [progress, setProgress] = useState(getKidsProgress());

  // Current selected world
  const initialWorldId = searchParams.get('world') || 'world-1';
  const [selectedWorldId, setSelectedWorldId] = useState(initialWorldId);

  useEffect(() => {
    setProgress(getKidsProgress());
  }, []);

  const currentWorld: KidsWorld =
    WORLDS_DATA.find(w => w.id === selectedWorldId) || WORLDS_DATA[0];

  const isWorldUnlocked = progress.unlockedWorlds.includes(currentWorld.id);

  // Flatten lessons in current world with chapter context
  const allWorldLessons: { lesson: KidsLesson; chapterTitle: string; index: number }[] = [];
  let globalLessonIdx = 0;
  currentWorld.chapters.forEach(chap => {
    chap.lessons.forEach(lesson => {
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
      speechManager.speak("Finish earlier adventures first to unlock this!");
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn max-w-4xl mx-auto pb-16">
      {/* World Tabs Switcher */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {WORLDS_DATA.map(world => {
          const unlocked = progress.unlockedWorlds.includes(world.id);
          const active = world.id === selectedWorldId;
          return (
            <button
              key={world.id}
              onClick={() => {
                soundManager.playPop();
                setSelectedWorldId(world.id);
              }}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-black text-sm md:text-base whitespace-nowrap transition-all cursor-pointer border-2 ${
                active
                  ? 'bg-white shadow-md border-orange-400 text-slate-800 scale-102'
                  : 'bg-white/60 text-slate-600 border-transparent hover:bg-white/80'
              }`}
            >
              <span className="text-xl">
                {world.icon || '🌴'}
              </span>
              <span>{world.title}</span>
              {!unlocked && (
                <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                  🔒
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* World Header Info */}
      <div
        className="rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg"
        style={{ backgroundColor: currentWorld.themeColor }}
      >
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-black/20 text-xs font-black uppercase tracking-wider mb-2">
              Level {currentWorld.level} Journey
            </span>
            <h1 className="text-2xl md:text-4xl font-extrabold">{currentWorld.title}</h1>
            <p className="text-white/90 text-sm md:text-base mt-1 max-w-md">
              {currentWorld.description}
            </p>
          </div>
          <div className="hidden sm:block">
            <KidsMascot mood="happy" size={90} speechText="Follow the path!" />
          </div>
        </div>
      </div>

      {/* Visual Roadmap Path */}
      <div className="relative py-8">
        {/* Curved / Zigzag Connecting S-Line */}
        <div className="absolute left-1/2 top-10 bottom-10 w-2.5 -translate-x-1/2 bg-gradient-to-b from-orange-300 via-amber-300 to-emerald-300 rounded-full border-2 border-white/60 shadow-inner z-0 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-12 md:gap-16">
          {allWorldLessons.map((item, idx) => {
            const isUnlocked = progress.unlockedLessons.includes(item.lesson.id) && isWorldUnlocked;
            const score = progress.lessonScores[item.lesson.id];
            const stars = score?.stars || 0;
            const isNext = isUnlocked && stars === 0;

            // Zigzag offset: left, center, right
            const offsetCycle = idx % 3;
            let offsetClass = 'translate-x-0';
            if (offsetCycle === 0) offsetClass = 'md:-translate-x-24 -translate-x-8';
            if (offsetCycle === 2) offsetClass = 'md:translate-x-24 translate-x-8';

            return (
              <div
                key={item.lesson.id}
                className={`relative flex flex-col items-center transition-all ${offsetClass}`}
              >
                {/* Mascot cheerleader perched next to the active lesson */}
                {isNext && (
                  <div className="absolute -top-14 -right-16 z-20 animate-bounce">
                    <KidsMascot mood="excited" size={60} speechText="Next here!" />
                  </div>
                )}

                {/* Node Button */}
                <button
                  onClick={() => handleSelectLesson(item.lesson, isUnlocked)}
                  className={`relative w-20 h-20 md:w-24 md:h-24 rounded-3xl flex flex-col items-center justify-center transition-all transform cursor-pointer border-4 ${
                    isUnlocked
                      ? isNext
                        ? 'bg-gradient-to-tr from-amber-400 to-orange-400 border-white shadow-xl shadow-orange-400/40 ring-4 ring-orange-300 ring-offset-2 scale-110 animate-pulse'
                        : 'bg-white border-orange-200 shadow-md hover:scale-108 hover:border-orange-400'
                      : 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span className="text-2xl md:text-3xl mb-1">{item.lesson.emoji || '⭐'}</span>
                  <span
                    className={`text-xs font-black ${
                      isNext ? 'text-white' : isUnlocked ? 'text-slate-800' : 'text-slate-600'
                    }`}
                  >
                    #{idx + 1}
                  </span>

                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px] rounded-3xl flex items-center justify-center">
                      <KidsIcon name="lock" size={24} className="text-white" />
                    </div>
                  )}
                </button>

                {/* Title & Stars under node */}
                <div className="mt-2 text-center max-w-[140px]">
                  <div className="text-xs md:text-sm font-extrabold text-slate-800 line-clamp-1">
                    {item.lesson.title}
                  </div>
                  {/* Star Rating */}
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    {[1, 2, 3].map(starIdx => (
                      <KidsIcon
                        key={starIdx}
                        name="star"
                        size={14}
                        className={
                          starIdx <= stars
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300 fill-slate-300'
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Treasure Chest Goal at the end of the world path */}
          <div className="flex flex-col items-center mt-4">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-purple-500 to-pink-500 border-4 border-white shadow-xl flex items-center justify-center text-4xl animate-bounce">
              🎁
            </div>
            <span className="mt-2 font-black text-sm text-purple-700">World Grand Prize</span>
          </div>
        </div>
      </div>
    </div>
  );
};
