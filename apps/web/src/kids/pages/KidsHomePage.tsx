import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import { KidsMascot } from '../components/KidsMascot';
import { KidsIcon } from '../assets/icons/KidsIcons';
import { getKidsProgress, getNextLessonToLearn } from '../curriculum/curriculumProgress';
import { WORLDS_DATA } from '../curriculum/kidsCurriculum';
import { soundManager } from '../services/sound/KidsSoundManager';
import { speechManager } from '../services/speech/KidsSpeechManager';

export const KidsHomePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(getKidsProgress());
  const [nextLessonInfo, setNextLessonInfo] = useState(getNextLessonToLearn());

  useEffect(() => {
    const updated = getKidsProgress();
    setProgress(updated);
    setNextLessonInfo(getNextLessonToLearn());
    
    // Friendly voice greeting when landing on Kids Home
    const timer = setTimeout(() => {
      speechManager.speak("Hello little explorer! Let's learn English today!");
    }, 600);
    return () => clearTimeout(timer);
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
      speechManager.speak("Complete earlier adventures to unlock this world!");
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 p-6 md:p-8 text-white shadow-xl shadow-orange-500/20">
        {/* Background decorative circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/15 pointer-events-none blur-sm" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="hover:scale-105 transition-transform duration-300">
              <KidsMascot
                mood="excited"
                size={130}
                speechText="Ready to explore?"
                onClick={() => {
                  soundManager.playDing();
                  speechManager.speak("I'm Bobby the Bear! Let's have fun!");
                }}
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs md:text-sm font-black tracking-wider uppercase mb-2">
                <span>🔥 {progress.streakDays} {t('kids.home.streak', 'Days Streak')}</span>
                <span>•</span>
                <span>⭐ Level {progress.level}</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight drop-shadow-sm">
                {t('kids.home.welcome', 'Hi Little Explorer!')} 🌟
              </h1>
              <p className="text-amber-100 font-medium text-sm md:text-base mt-1 max-w-md">
                {nextLessonInfo
                  ? `Next up: ${nextLessonInfo.lesson.title} in ${nextLessonInfo.world.title}`
                  : 'You have mastered all available adventures! Great job!'}
              </p>
            </div>
          </div>

          {/* Big Action Button */}
          <div className="w-full md:w-auto">
            <button
              onClick={handleStartContinue}
              className="w-full md:w-auto px-8 py-5 rounded-2xl bg-white text-orange-600 font-black text-lg md:text-xl shadow-lg shadow-black/10 hover:bg-amber-50 active:scale-95 transition-all flex items-center justify-center gap-3 border-4 border-amber-200 cursor-pointer"
            >
              <KidsIcon name="play" size={26} className="text-orange-500 fill-orange-500" />
              <span>{t('kids.home.continueBtn', 'START LESSON')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <button
          onClick={() => {
            soundManager.playPop();
            navigate('/kids/journey');
          }}
          className="group p-4 md:p-5 rounded-2xl bg-white border-2 border-emerald-100 hover:border-emerald-400 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-2 cursor-pointer"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-100 transition-all">
            <KidsIcon name="map" size={30} />
          </div>
          <span className="font-extrabold text-slate-800 text-sm md:text-base">{t('kids.nav.journey', 'Journey')}</span>
          <span className="text-xs text-slate-600 font-bold">Island Map</span>
        </button>

        <button
          onClick={() => {
            soundManager.playPop();
            navigate('/kids/games');
          }}
          className="group p-4 md:p-5 rounded-2xl bg-white border-2 border-amber-100 hover:border-amber-400 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-2 cursor-pointer"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-100 transition-all">
            <KidsIcon name="games" size={30} />
          </div>
          <span className="font-extrabold text-slate-800 text-sm md:text-base">{t('kids.nav.games', 'Games')}</span>
          <span className="text-xs text-slate-600 font-bold">Word Arcade</span>
        </button>

        <button
          onClick={() => {
            soundManager.playPop();
            navigate('/kids/world');
          }}
          className="group p-4 md:p-5 rounded-2xl bg-white border-2 border-sky-100 hover:border-sky-400 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-2 cursor-pointer"
        >
          <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center group-hover:scale-110 group-hover:bg-sky-100 transition-all">
            <KidsIcon name="island" size={30} />
          </div>
          <span className="font-extrabold text-slate-800 text-sm md:text-base">{t('kids.nav.myWorld', 'My Island')}</span>
          <span className="text-xs text-slate-600 font-bold">Stickers & Town</span>
        </button>

        <button
          onClick={() => {
            soundManager.playFanfare();
            navigate('/kids/parent');
          }}
          className="group p-4 md:p-5 rounded-2xl bg-white border-2 border-purple-100 hover:border-purple-400 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-2 cursor-pointer"
        >
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-100 transition-all">
            <KidsIcon name="shield" size={30} />
          </div>
          <span className="font-extrabold text-slate-800 text-sm md:text-base">{t('kids.nav.parent', 'Parents')}</span>
          <span className="text-xs text-slate-600 font-bold">Stats & Gate</span>
        </button>
      </div>

      {/* Daily Quests Widget */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border-2 border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <KidsIcon name="trophy" size={22} />
            </div>
            <div>
              <h2 className="font-black text-slate-800 text-base md:text-lg">
                {t('kids.home.dailyMissions', "Today's Quests")}
              </h2>
              <p className="text-xs text-slate-600 font-bold">Complete tasks to earn bonus stars!</p>
            </div>
          </div>
          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Resets daily
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {progress.dailyQuests.map(quest => {
            const isDone = quest.progress >= quest.target;
            const pct = Math.min(100, Math.round((quest.progress / quest.target) * 100));
            return (
              <div
                key={quest.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isDone
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-800 text-sm">{quest.title}</span>
                  <span className="text-xs font-black text-amber-600">+{quest.rewardStars} ⭐</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden mb-1">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isDone ? 'bg-emerald-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
                  <span>{quest.progress}/{quest.target}</span>
                  <span>{isDone ? '🎉 Complete!' : `${pct}%`}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Adventure Worlds Showcase */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
            <span>🗺️</span>
            <span>{t('kids.home.worlds', 'Adventure Worlds')}</span>
          </h2>
          <button
            onClick={() => navigate('/kids/journey')}
            className="text-xs md:text-sm font-black text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            {t('kids.home.viewAll', 'View Map')} →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {WORLDS_DATA.map((world, idx) => {
            const isUnlocked = progress.unlockedWorlds.includes(world.id);
            // Count total stars earned in this world
            let worldStars = 0;
            let totalLessons = 0;
            world.chapters.forEach(ch => {
              ch.lessons.forEach(ls => {
                totalLessons++;
                worldStars += progress.lessonScores[ls.id]?.stars || 0;
              });
            });
            const maxStars = totalLessons * 3;

            return (
              <div
                key={world.id}
                onClick={() => handleWorldClick(world.id, isUnlocked)}
                className={`relative rounded-3xl p-6 border-2 transition-all cursor-pointer overflow-hidden ${
                  isUnlocked
                    ? 'bg-white hover:-translate-y-1 shadow-md hover:shadow-xl border-slate-100 hover:border-orange-300'
                    : 'bg-slate-50 border-dashed border-slate-300 opacity-80'
                }`}
              >
                {/* World Theme Accent Strip */}
                <div
                  className="h-2 w-full absolute top-0 left-0"
                  style={{ backgroundColor: world.themeColor }}
                />

                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm"
                    style={{ backgroundColor: `${world.themeColor}20` }}
                  >
                    {world.icon || '🌴'}
                  </div>

                  {isUnlocked ? (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-black">
                      <KidsIcon name="star" size={14} className="fill-amber-400 text-amber-400" />
                      <span>{worldStars}/{maxStars}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-200 text-slate-600 text-xs font-black">
                      <KidsIcon name="lock" size={14} />
                      <span>Locked</span>
                    </div>
                  )}
                </div>

                <h3 className="font-extrabold text-slate-800 text-lg mb-1">{world.title}</h3>
                <p className="text-xs text-slate-600 font-medium mb-4 line-clamp-2">{world.description}</p>

                <div className="flex items-center justify-between text-xs font-bold pt-3 border-t border-slate-100">
                  <span className="text-slate-600">{world.chapters.length} Chapters • {totalLessons} Lessons</span>
                  <span
                    className="font-black"
                    style={{ color: isUnlocked ? world.themeColor : '#94a3b8' }}
                  >
                    {isUnlocked ? 'Play Now →' : `Unlock Level ${idx + 1}`}
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
