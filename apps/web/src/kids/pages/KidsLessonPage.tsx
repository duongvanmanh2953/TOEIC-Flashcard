import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import { WORLDS_DATA, KidsLesson, KidsWorld } from '../curriculum/kidsCurriculum';
import { KidsActivityRenderer } from '../components/KidsActivityRenderer';
import { KidsRewardModal } from '../components/KidsRewardModal';
import { KidsIcon } from '../assets/icons/KidsIcons';
import { completeLesson, getNextLessonToLearn } from '../curriculum/curriculumProgress';
import { soundManager } from '../services/sound/KidsSoundManager';
import { speechManager } from '../services/speech/KidsSpeechManager';

export const KidsLessonPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
  const progressPercent = Math.round(((currentStep) / activities.length) * 100);

  const handleActivityComplete = (isCorrect: boolean) => {
    let newCorrect = correctCount;
    if (isCorrect) {
      newCorrect += 1;
      setCorrectCount(newCorrect);
    } else {
      // Record weak word if activity has target word
      if (currentActivity.data.word && !weakWords.includes(currentActivity.data.word)) {
        setWeakWords(prev => [...prev, currentActivity.data.word]);
      }
    }

    // Step to next activity or finish
    if (currentStep + 1 < activities.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Finish lesson!
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
    soundManager.playFanfare();
    speechManager.speak("Awesome job! You finished the adventure!");
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

  return (
    <div className="max-w-3xl mx-auto space-y-4 md:space-y-6 animate-fadeIn pb-12">
      {/* Top Lesson Navigation & Caterpillar Progress Bar */}
      <div className="bg-white rounded-3xl p-4 md:p-5 border-2 border-slate-100 shadow-sm flex items-center justify-between gap-4">
        {/* Back / Exit button */}
        <button
          onClick={() => {
            soundManager.playPop();
            navigate('/kids/journey');
          }}
          className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
          title="Exit to Map"
        >
          <KidsIcon name="home" size={20} />
        </button>

        {/* Caterpillar Steps Indicator */}
        <div className="flex-1 max-w-md">
          <div className="flex items-center justify-between text-xs font-black text-slate-600 mb-1.5 px-1">
            <span>{targetLesson.title}</span>
            <span>{currentStep + 1} / {activities.length}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {activities.map((act, idx) => {
              const isDone = idx < currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div
                  key={act.id}
                  className={`h-3 rounded-full flex-1 transition-all duration-300 ${
                    isDone
                      ? 'bg-emerald-400'
                      : isCurrent
                      ? 'bg-amber-400 scale-y-125'
                      : 'bg-slate-200'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Lesson Mascot Tag */}
        <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-xl">
          {targetLesson.emoji || '⭐'}
        </div>
      </div>

      {/* Main Activity Card */}
      {currentActivity && (
        <KidsActivityRenderer
          activity={currentActivity}
          onComplete={handleActivityComplete}
        />
      )}

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
