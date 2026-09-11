import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import { KidsIcon } from '../assets/icons/KidsIcons';
import { getKidsProgress, resetKidsProgress } from '../curriculum/curriculumProgress';
import { WORLDS_DATA } from '../curriculum/kidsCurriculum';
import { speechManager } from '../services/speech/KidsSpeechManager';
import { soundManager } from '../services/sound/KidsSoundManager';
import { Star, Flame, Target, Volume2, Clock, Sparkles } from 'lucide-react';

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

  const completedLessonsCount = Object.keys(progress.lessonScores || {}).length;
  const progressPercent = Math.round((completedLessonsCount / totalCurriculumLessons) * 100);

  // Compute average accuracy across completed lessons
  const scoresArray = Object.values(progress.lessonScores || {});
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
      <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
            <KidsIcon name="shield" size={32} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 text-xs font-black text-purple-700 uppercase tracking-wider mb-0.5">
              <span>Trung Tâm Phụ Huynh</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900">Báo Cáo Tiến Độ Của Bé</h1>
            <p className="text-xs md:text-sm text-slate-600 font-bold">
              Theo dõi phát âm tiếng Anh, khả năng ghi nhớ từ vựng và chuỗi ngày chăm chỉ của bé.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/kids')}
            className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition-all cursor-pointer"
          >
            ← Về Góc Bé Học
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs transition-all cursor-pointer"
          >
            Trang Người Lớn
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border-2 border-amber-200/80">
          <div className="text-xs font-black text-slate-600 uppercase mb-1">Số Sao Tích Lũy</div>
          <div className="text-2xl md:text-3xl font-black text-amber-500 flex items-center gap-1.5">
            <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
            <span>{progress.totalStars}</span>
          </div>
          <div className="text-[11px] text-slate-600 font-bold mt-1">Từ bài học & mini-game</div>
        </div>

        <div className="bg-white rounded-3xl p-5 border-2 border-emerald-200/80">
          <div className="text-xs font-black text-slate-600 uppercase mb-1">Bài Đã Hoàn Thành</div>
          <div className="text-2xl md:text-3xl font-black text-emerald-600">
            {completedLessonsCount} <span className="text-sm font-bold text-slate-500">/ {totalCurriculumLessons}</span>
          </div>
          <div className="text-[11px] text-slate-600 font-bold mt-1">{progressPercent}% lộ trình toàn bộ</div>
        </div>

        <div className="bg-white rounded-3xl p-5 border-2 border-sky-200/80">
          <div className="text-xs font-black text-slate-600 uppercase mb-1">Độ Chuẩn Phát Âm</div>
          <div className="text-2xl md:text-3xl font-black text-sky-600">
            {averageAccuracy}%
          </div>
          <div className="text-[11px] text-slate-600 font-bold mt-1">Độ chính xác luyện nói & nghe</div>
        </div>

        <div className="bg-white rounded-3xl p-5 border-2 border-rose-200/80">
          <div className="text-xs font-black text-slate-600 uppercase mb-1">Thói Quen Mỗi Ngày</div>
          <div className="text-2xl md:text-3xl font-black text-rose-500 flex items-center gap-1.5">
            <Flame className="w-6 h-6 text-rose-500" />
            <span>{progress.streakDays}</span>
            <span className="text-sm font-bold text-slate-600">ngày</span>
          </div>
          <div className="text-[11px] text-slate-600 font-bold mt-1">Chuỗi ngày học liên tục</div>
        </div>
      </div>

      {/* Weak Words & Vocabulary Needs Practice */}
      <div className="bg-white rounded-3xl p-6 md:p-7 border-2 border-amber-200/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-600" />
              <span>Từ Vựng Cần Bố Mẹ Ôn Cùng Bé</span>
            </h2>
            <p className="text-xs text-slate-600 font-bold">Các từ bé cần nghe và luyện phát âm thêm.</p>
          </div>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
            {(progress.weakWords || []).length} từ vựng
          </span>
        </div>

        {(!progress.weakWords || progress.weakWords.length === 0) ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 text-center text-sm font-black flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>Tuyệt vời! Bé đã nắm vững tất cả các từ vựng đã học với độ chính xác rất cao!</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {(progress.weakWords || []).map((word, idx) => (
              <button
                key={idx}
                onClick={() => speechManager.speak(word)}
                className="px-4 py-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold flex items-center gap-2 hover:bg-orange-100 transition-all cursor-pointer"
                title="Tap to hear pronunciation"
              >
                <Volume2 className="w-3.5 h-3.5 text-orange-700" />
                <span>{word}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Study Guardrails & Daily Limits */}
      <div className="bg-white rounded-3xl p-6 md:p-7 border-2 border-slate-100 space-y-4">
        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-600" />
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
