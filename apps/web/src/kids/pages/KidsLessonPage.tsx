import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WORLDS_DATA, KidsLesson, KidsWorld } from '../curriculum/kidsCurriculum';
import { KidsActivityRenderer } from '../components/KidsActivityRenderer';
import { KidsRewardModal } from '../components/KidsRewardModal';
import { KidsParentPinModal } from '../components/KidsParentPinModal';
import { KidsIcon } from '../assets/icons/KidsIcons';
import { completeLesson, getNextLessonToLearn } from '../curriculum/curriculumProgress';
import { soundManager } from '../services/sound/KidsSoundManager';
import { celebrationManager } from '../services/celebration/CelebrationManager';

export const KidsLessonPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  // Find target lesson and its parent world
  let targetLesson: KidsLesson | undefined;
  let parentWorld: KidsWorld | undefined;

  for (const world of WORLDS_DATA) {
    for (const chap of world.chapters) {
      const found = chap.lessons.find(l => l.id === lessonId);
      if (found) {
        targetLesson = found;
        parentWorld = world;
        break;
      }
    }
    if (targetLesson) break;
  }

  const [currentStep, setCurrentStep] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [weakWords, setWeakWords] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [earnedStars, setEarnedStars] = useState(3);
  const [earnedXp, setEarnedXp] = useState(50);
  const [nextLesson, setNextLesson] = useState<KidsLesson | null>(null);
  const [parentExitModalOpen, setParentExitModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // If lesson doesn't exist, redirect
  useEffect(() => {
    if (!targetLesson) {
      navigate('/kids/journey', { replace: true });
    }
  }, [targetLesson, navigate]);

  if (!targetLesson || !parentWorld) {
    return null;
  }

  const activities = targetLesson.activities;
  const currentActivity = activities[currentStep];

  const handleActivityComplete = (isCorrect: boolean) => {
    let newCorrect = correctCount;
    if (isCorrect) {
      newCorrect += 1;
      setCorrectCount(newCorrect);
    } else {
      const targetWord = currentActivity?.targetWord;
      if (targetWord && !weakWords.includes(targetWord)) {
        setWeakWords(prev => [...prev, targetWord]);
      }
    }

    // Step to next activity or finish
    if (currentStep + 1 < activities.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      finishLesson(newCorrect);
    }
  };

  const finishLesson = (finalCorrect: number) => {
    const accuracy = Math.round((finalCorrect / activities.length) * 100);
    let stars = 1;
    if (accuracy >= 85) stars = 3;
    else if (accuracy >= 60) stars = 2;

    const xp = stars * 25 + 25;
    setEarnedStars(stars);
    setEarnedXp(xp);

    // Persist to store
    completeLesson(targetLesson!.id, stars, accuracy, weakWords);

    // Check next lesson
    const nextInfo = getNextLessonToLearn();
    if (nextInfo && nextInfo.lesson.id !== targetLesson!.id) {
      setNextLesson(nextInfo.lesson);
    }

    setIsCompleted(true);
    celebrationManager.celebrate('lessonComplete');
  };

  const handleNextLesson = () => {
    if (nextLesson) {
      navigate(`/kids/lesson/${nextLesson.id}`);
      setCurrentStep(0);
      setCorrectCount(0);
      setIsCompleted(false);
    } else {
      navigate('/kids/journey');
    }
  };

  const handlePlayAgain = () => {
    setCurrentStep(0);
    setCorrectCount(0);
    setWeakWords([]);
    setIsCompleted(false);
  };

  const handleToggleFullscreen = () => {
    soundManager.playPop();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 md:space-y-6 animate-fadeIn pb-12">
      {/* Top Focus Mode Header with Caterpillar Progress & Parent-Protected Exit */}
      <div className="bg-white rounded-3xl p-3.5 sm:p-5 border-2 border-amber-300 shadow-md flex items-center justify-between gap-3">
        {/* Protected Back / Exit button (Requires Parent confirmation) */}
        <button
          onClick={() => {
            soundManager.playPop();
            setParentExitModalOpen(true);
          }}
          className="px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer border border-slate-300 text-xs font-black shadow-xs shrink-0"
          title="Thoát bài học (Bố Mẹ mở khóa)"
        >
          <span>🔒</span>
          <span className="hidden sm:inline">Thoát</span>
        </button>

        {/* Caterpillar Steps Indicator */}
        <div className="flex-1 max-w-md">
          <div className="flex items-center justify-between text-xs font-black text-slate-800 mb-1.5 px-1">
            <span className="truncate mr-2">🎯 {targetLesson.title}</span>
            <span className="text-amber-700 shrink-0">
              Trạm {currentStep + 1} / {activities.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {activities.map((act, idx) => {
              const isDone = idx < currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div
                  key={act.id}
                  className={`h-3.5 rounded-full flex-1 transition-all duration-300 ${
                    isDone
                      ? 'bg-emerald-500 shadow-xs'
                      : isCurrent
                      ? 'bg-amber-400 scale-y-125 ring-2 ring-amber-300 shadow-sm animate-pulse'
                      : 'bg-slate-200'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Fullscreen & Lesson Emoji Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleToggleFullscreen}
            className="w-10 h-10 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 flex items-center justify-center text-slate-700 transition cursor-pointer text-sm font-black shadow-xs"
            title="Toàn màn hình tập trung"
          >
            {isFullscreen ? '✕' : '⛶'}
          </button>
          <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-xl shadow-xs">
            {targetLesson.emoji || '⭐'}
          </div>
        </div>
      </div>

      {/* Main Activity Card */}
      {currentActivity && (
        <KidsActivityRenderer
          activity={currentActivity}
          onComplete={handleActivityComplete}
        />
      )}

      {/* Parent Exit Verification Gate */}
      <KidsParentPinModal
        isOpen={parentExitModalOpen}
        onClose={() => setParentExitModalOpen(false)}
        onVerified={() => {
          setParentExitModalOpen(false);
          navigate('/kids/journey');
        }}
      />

      {/* Completion Modal */}
      <KidsRewardModal
        isOpen={isCompleted}
        stars={earnedStars}
        xpEarned={earnedXp}
        nextLessonTitle={nextLesson ? nextLesson.title : undefined}
        onNext={handleNextLesson}
        onReplay={handlePlayAgain}
        onClose={() => navigate('/kids/journey')}
      />
    </div>
  );
};
