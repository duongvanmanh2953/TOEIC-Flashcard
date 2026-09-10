import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import { KidsIcon } from '../assets/icons/KidsIcons';
import { getKidsProgress, resetKidsProgress } from '../curriculum/curriculumProgress';
import { WORLDS_DATA } from '../curriculum/kidsCurriculum';
import { speechManager } from '../services/speech/KidsSpeechManager';
import { soundManager } from '../services/sound/KidsSoundManager';

export const KidsParentDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(getKidsProgress());
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    setProgress(getKidsProgress());
  }, []);

  // Compute metrics
  let totalCurriculumLessons = 0;
  WORLDS_DATA.forEach(w => {
    w.chapters.forEach(c => {
      totalCurriculumLessons += c.lessons.length;
    });
  });

  const completedLessonsCount = Object.keys(progress.lessonScores).length;
  const progressPercent = Math.round((completedLessonsCount / totalCurriculumLessons) * 100);

  // Compute average accuracy across completed lessons
  const scoresArray = Object.values(progress.lessonScores);
  const averageAccuracy = scoresArray.length > 0
    ? Math.round(scoresArray.reduce((acc, curr) => acc + curr.accuracy, 0) / scoresArray.length)
    : 100;

  const handleReset = () => {
    resetKidsProgress();
    setProgress(getKidsProgress());
    setConfirmReset(false);
    soundManager.playPop();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-fadeIn pb-16">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
            <KidsIcon name="shield" size={32} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 text-xs font-black text-purple-600 uppercase tracking-wider mb-0.5">
              <span>Parental Control Center</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800">Learning Analytics</h1>
            <p className="text-xs md:text-sm text-slate-600 font-medium">
              Monitor your child's English pronunciation, vocabulary retention, and study streak.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/kids')}
            className="px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            ← Back to Kids
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
          >
            Exit to Adult App
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-100 shadow-sm">
          <div className="text-xs font-bold text-slate-600 uppercase mb-1">Stars Earned</div>
          <div className="text-2xl md:text-3xl font-black text-amber-500 flex items-center gap-1.5">
            <span>⭐</span>
            <span>{progress.totalStars}</span>
          </div>
          <div className="text-[11px] text-slate-600 mt-1">From lessons & mini-games</div>
        </div>

        <div className="bg-white rounded-3xl p-5 border-2 border-slate-100 shadow-sm">
          <div className="text-xs font-bold text-slate-600 uppercase mb-1">Lessons Finished</div>
          <div className="text-2xl md:text-3xl font-black text-emerald-600">
            {completedLessonsCount} <span className="text-sm font-bold text-slate-600">/ {totalCurriculumLessons}</span>
          </div>
          <div className="text-[11px] text-slate-600 mt-1">{progressPercent}% of full roadmap</div>
        </div>

        <div className="bg-white rounded-3xl p-5 border-2 border-slate-100 shadow-sm">
          <div className="text-xs font-bold text-slate-600 uppercase mb-1">Pronunciation Avg</div>
          <div className="text-2xl md:text-3xl font-black text-sky-600">
            {averageAccuracy}%
          </div>
          <div className="text-[11px] text-slate-600 mt-1">Speaking & Listening accuracy</div>
        </div>

        <div className="bg-white rounded-3xl p-5 border-2 border-slate-100 shadow-sm">
          <div className="text-xs font-bold text-slate-600 uppercase mb-1">Daily Habit</div>
          <div className="text-2xl md:text-3xl font-black text-orange-500 flex items-center gap-1">
            <span>🔥</span>
            <span>{progress.streakDays}</span>
            <span className="text-sm font-bold text-slate-600">days</span>
          </div>
          <div className="text-[11px] text-slate-600 mt-1">Consecutive learning streak</div>
        </div>
      </div>

      {/* Weak Words & Vocabulary Needs Practice */}
      <div className="bg-white rounded-3xl p-6 md:p-7 border-2 border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <span>🎯</span>
              <span>Words to Practice Together</span>
            </h2>
            <p className="text-xs text-slate-600">Words where your child needed more than 1 attempt.</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            {progress.weakWords.length} words
          </span>
        </div>

        {progress.weakWords.length === 0 ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-center text-sm font-bold">
            🌟 Incredible! Your child has mastered all attempted vocabulary with high accuracy!
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {progress.weakWords.map((word, idx) => (
              <button
                key={idx}
                onClick={() => speechManager.speak(word)}
                className="px-4 py-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold flex items-center gap-2 hover:bg-orange-100 transition-all cursor-pointer"
                title="Tap to hear pronunciation"
              >
                <span>🔊</span>
                <span>{word}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Study Guardrails & Daily Limits */}
      <div className="bg-white rounded-3xl p-6 md:p-7 border-2 border-slate-100 shadow-sm space-y-4">
        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <span>⏱️</span>
          <span>Child Safety & Screen Time</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 flex flex-col justify-between">
            <span className="font-extrabold text-slate-800 text-sm">Session Limit</span>
            <span className="text-xs text-slate-600 mt-1">Prevents eye strain after 20 mins of play.</span>
            <span className="mt-3 text-xs font-bold text-emerald-600">Active (20 min chime)</span>
          </div>
          <div className="p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 flex flex-col justify-between">
            <span className="font-extrabold text-slate-800 text-sm">Parent PIN Math Gate</span>
            <span className="text-xs text-slate-600 mt-1">Stops child from navigating to adult settings.</span>
            <span className="mt-3 text-xs font-bold text-emerald-600">Active (Always on)</span>
          </div>
          <div className="p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 flex flex-col justify-between">
            <span className="font-extrabold text-slate-800 text-sm">100% English Immersion</span>
            <span className="text-xs text-slate-600 mt-1">Lessons contain no Vietnamese translation text.</span>
            <span className="mt-3 text-xs font-bold text-emerald-600">Active (Direct reflex)</span>
          </div>
        </div>
      </div>

      {/* Danger Zone: Reset Progress */}
      <div className="bg-rose-50/60 rounded-3xl p-6 border-2 border-rose-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-rose-800 text-base">Reset Child Learning Data</h3>
          <p className="text-xs text-rose-600 font-medium">Clears stars, badges, and unlocks if you want to restart from lesson 1.</p>
        </div>

        {confirmReset ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer"
            >
              Yes, Reset All
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="px-3 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="px-4 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-100 font-bold text-xs cursor-pointer"
          >
            Reset Progress
          </button>
        )}
      </div>
    </div>
  );
};
