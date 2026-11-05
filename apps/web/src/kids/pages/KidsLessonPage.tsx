import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WORLDS_DATA, KidsLesson, KidsWorld } from '../curriculum/kidsCurriculum';
import { KidsActivityRenderer } from '../components/KidsActivityRenderer';
import { KidsRewardModal } from '../components/KidsRewardModal';
import { KidsParentPinModal } from '../components/KidsParentPinModal';
import { KidsIcon } from '../assets/icons/KidsIcons';
import { KidsIllustration } from '../assets/illustrations/KidsIllustration';
import { completeLesson, getNextLessonToLearn } from '../curriculum/curriculumProgress';
import { soundManager } from '../services/sound/KidsSoundManager';
import { celebrationManager } from '../services/celebration/CelebrationManager';
import { Lock, Maximize2, Minimize2, Target } from 'lucide-react';

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
  const [isActivityBusy, setIsActivityBusy] = useState(false);

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
    if (isActivityBusy) return; // Never advance while child is speaking or system is evaluating
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
    <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4 md:space-y-6 animate-fadeIn pb-12 px-2 sm:px-0">
      {/* Top Focus Mode Header with Caterpillar Progress & Parent-Protected Exit */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 border-2 border-amber-300 flex items-center justify-between gap-2 sm:gap-3">
        {/* Protected Back / Exit button (Requires Parent confirmation) */}
        <button
          onClick={() => {
            soundManager.playPop();
            setParentExitModalOpen(true);
          }}
          className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer border border-slate-300 text-xs font-black shrink-0"
          title="Thoát bài học (Bố Mẹ mở khóa)"
        >
          <Lock className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden sm:inline">Thoát</span>
        </button>

        {/* Caterpillar Steps Indicator */}
        <div className="flex-1 min-w-0 max-w-md">
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-black text-slate-800 mb-1 px-0.5 sm:px-1">
            <span className="truncate mr-1.5 flex items-center gap-1">
              <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">{targetLesson.title}</span>
            </span>
            <span className="text-amber-700 shrink-0 font-mono">
              {currentStep + 1}/{activities.length}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            {activities.map((act, idx) => {
              const isDone = idx < currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div
                  key={act.id}
                  className={`h-2 sm:h-3.5 rounded-full flex-1 transition-all duration-300 ${
                    isDone
                      ? 'bg-emerald-500'
                      : isCurrent
                      ? 'bg-amber-400 scale-y-125 ring-2 ring-amber-300 animate-pulse'
                      : 'bg-slate-200'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Fullscreen & Lesson Emoji Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={handleToggleFullscreen}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 flex items-center justify-center text-slate-700 transition cursor-pointer text-xs sm:text-sm font-black"
            title="Toàn màn hình tập trung"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center p-1 overflow-hidden shadow-2xs">
            <KidsIllustration
              name={targetLesson.id || 'star'}
              className="w-full h-full object-contain"
              alt={targetLesson.title}
            />
          </div>
        </div>
      </div>

      {/* Main Activity Card */}
      {currentActivity && (
        <KidsActivityRenderer
          activity={currentActivity}
          onComplete={handleActivityComplete}
          onBusyStateChange={setIsActivityBusy}
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
