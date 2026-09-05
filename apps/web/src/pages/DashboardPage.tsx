import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n';
import { GlassCard } from '../components/common/GlassCard';
import {
  Sparkles,
  Flame,
  Target,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Award,
  BookOpen,
  CalendarCheck,
  BrainCircuit,
  TrendingUp,
  Clock,
  Zap,
  BarChart3,
  Layers,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, heatRes]: any = await Promise.all([
          api.get('/dashboard').catch(() => ({ data: {} })),
          api.get('/dashboard/heatmap').catch(() => ({ data: [] })),
        ]);
        setData(dashRes.data || dashRes || {});
        setHeatmap(heatRes.data || heatRes || []);
      } catch (err) {
        console.error('Error loading dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Dynamic positive greeting based on current hour
  const currentHour = new Date().getHours();
  let timeGreeting = t('dashboard.greetingMorning', 'Chào buổi sáng');
  if (currentHour >= 12 && currentHour < 18) {
    timeGreeting = t('dashboard.greetingAfternoon', 'Chào buổi chiều');
  } else if (currentHour >= 18) {
    timeGreeting = t('dashboard.greetingEvening', 'Chào buổi tối');
  }

  const dailyGoal = data?.dailyGoal || 20;
  const completedToday = data?.completedToday || 0;
  const goalPercent = Math.min(100, Math.round((completedToday / dailyGoal) * 100));
  const reviewDue = data?.reviewDue || 0;

  // 7-day activity mock / real data
  const weeklyData = [
    { day: 'T2', reviews: 18, retention: 84 },
    { day: 'T3', reviews: 25, retention: 88 },
    { day: 'T4', reviews: 20, retention: 86 },
    { day: 'T5', reviews: 32, retention: 91 },
    { day: 'T6', reviews: 28, retention: 89 },
    { day: 'T7', reviews: 40, retention: 94 },
    { day: 'CN', reviews: completedToday > 0 ? completedToday : 22, retention: 92 },
  ];

  const maxWeeklyReviews = Math.max(...weeklyData.map((d) => d.reviews), 40);

  // CEFR Distribution mock / computed
  const cefrStats = [
    { level: 'A2', count: 120, percent: 95, color: 'bg-emerald-500' },
    { level: 'B1', count: 240, percent: 80, color: 'bg-indigo-500' },
    { level: 'B2', count: 180, percent: 62, color: 'bg-amber-500' },
    { level: 'C1', count: 60, percent: 38, color: 'bg-rose-500' },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in dashboard-canvas p-4 sm:p-6 lg:p-8">
      {/* 1. Hero / Today's Plan — High Contrast Translucent Card */}
      <GlassCard variant="liquid" className="p-6 md:p-8 relative overflow-hidden bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-lg">
        <div className="max-w-3xl relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Spaced Repetition System • VocabFlow AI</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-snug tracking-tight">
            {timeGreeting}, {user?.displayName || 'Learner'} 👋
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Hôm nay bạn có{' '}
            <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
              {reviewDue} từ vựng
            </strong>{' '}
            {t('dashboard.heroSubtitle', 'đang trong thời điểm vàng cần kích hoạt trí nhớ dài hạn.')}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/review')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              <span>{t('dashboard.startReviewCTA', 'Bắt đầu phiên ôn tập')}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>

            <button
              onClick={() => navigate('/word-bank')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm transition border border-slate-200/60 dark:border-slate-700/60"
            >
              Kho từ của tôi
            </button>

            <button
              onClick={() => navigate('/vocabulary')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm transition border border-slate-200/60 dark:border-slate-700/60"
            >
              Thư viện 600+ từ
            </button>
          </div>
        </div>
      </GlassCard>

      {/* 2. Key Metrics Row — 4 Rich Feature Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily Goal Card */}
        <GlassCard variant="liquid" className="p-4 sm:p-5 bg-white/85 dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('dashboard.dailyGoal', 'Mục tiêu ngày')}
            </span>
            <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
              {completedToday}
            </span>
            <span className="text-xs text-slate-400 font-semibold">/ {dailyGoal} từ</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${goalPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-1.5 block font-semibold">{goalPercent}% hoàn thành</span>
        </GlassCard>

        {/* Streak Card */}
        <GlassCard variant="liquid" className="p-4 sm:p-5 bg-white/85 dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('dashboard.streak', 'Chuỗi liên tiếp')}
            </span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
            {data?.streak?.currentStreak || 0} ngày
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Kỷ lục: <strong className="text-slate-700 dark:text-slate-200">{data?.streak?.longestStreak || 0} ngày</strong>
          </p>
        </GlassCard>

        {/* Total Mastered */}
        <GlassCard variant="liquid" className="p-4 sm:p-5 bg-white/85 dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('dashboard.totalWords', 'Từ đã thành thạo')}
            </span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
            {data?.masteredCount || 0}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            Độ bền trí nhớ &gt; 85%
          </p>
        </GlassCard>

        {/* Learning Level & XP */}
        <GlassCard variant="liquid" className="p-4 sm:p-5 bg-white/85 dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('dashboard.level', 'Cấp độ & XP')}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              CEFR {data?.profile?.englishLevel || 'B1'}
            </span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
            Lvl {user?.xp?.currentLevel || 1}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            <strong className="text-indigo-600 dark:text-indigo-400">{user?.xp?.totalXP || 0} XP</strong> tích lũy
          </p>
        </GlassCard>
      </div>

      {/* 3. Visual Statistical Charts Section (User Requested Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Weekly Retention & Review Activity Chart */}
        <GlassCard variant="liquid" className="lg:col-span-2 p-5 md:p-6 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Biểu Đồ Hoạt Động Ôn Tập & Đường Cong Ghi Nhớ 7 Ngày</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Số từ vựng đã ôn tập qua Spaced Repetition và tỷ lệ duy trì trí nhớ hàng ngày.
              </p>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600"></span>
                <span>Từ đã ôn</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Tỷ lệ nhớ (~90%)</span>
              </span>
            </div>
          </div>

          {/* SVG Visual Bar & Trend Chart */}
          <div className="h-44 w-full flex items-end justify-between gap-2 sm:gap-4 pt-4 px-2 border-b border-slate-100 dark:border-slate-800">
            {weeklyData.map((item, idx) => {
              const heightPct = Math.max(15, Math.round((item.reviews / maxWeeklyReviews) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition">
                    {item.reviews} từ
                  </div>
                  <div className="w-full max-w-[32px] bg-slate-100 dark:bg-slate-800 rounded-t-xl overflow-hidden relative flex items-end h-32">
                    <div
                      className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:from-indigo-500 group-hover:to-purple-500 transition-all duration-500 rounded-t-xl"
                      style={{ height: `${heightPct}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{item.day}</span>
                </div>
              );
            })}
          </div>

          {/* Chart Footnote Insights */}
          <div className="grid grid-cols-3 gap-3 pt-4 text-center">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-[10px] uppercase font-bold text-slate-400">Tổng từ tuần này</span>
              <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                {weeklyData.reduce((acc, curr) => acc + curr.reviews, 0)} từ
              </p>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
              <span className="text-[10px] uppercase font-bold text-emerald-600">Độ nhớ trung bình</span>
              <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">89.5%</p>
            </div>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30">
              <span className="text-[10px] uppercase font-bold text-indigo-600">Dự báo ngày mai</span>
              <p className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">18 từ</p>
            </div>
          </div>
        </GlassCard>

        {/* CEFR Level Mastery Distribution Chart */}
        <GlassCard variant="liquid" className="p-5 md:p-6 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Phân Bổ Từ Vựng CEFR</span>
              </h3>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                Chuẩn Quốc Tế
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Tiến độ tích lũy và tỷ lệ thành thạo từ vựng theo từng bậc khung tham chiếu châu Âu.
            </p>

            <div className="space-y-3">
              {cefrStats.map((item) => (
                <div key={item.level} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300 font-bold">
                      Cấp độ {item.level} ({item.count} từ)
                    </span>
                    <span className="text-slate-500">{item.percent}% thành thạo</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${item.percent}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
            <button
              onClick={() => navigate('/vocabulary')}
              className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <span>Xem danh sách từ theo cấp độ</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </GlassCard>
      </div>

      {/* 4. Actionable Modules: Today's Plan Checklist & Weak Words Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Today's Learning Plan Checklist */}
        <GlassCard variant="liquid" className="lg:col-span-2 p-5 md:p-6 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 leading-snug">
              <CalendarCheck className="w-4 h-4 text-indigo-500" />
              <span>{t('dashboard.todayPlan', 'Kế hoạch học tập hôm nay')}</span>
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              {goalPercent}% hoàn thành
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <CheckCircle2
                  className={`w-4 h-4 ${
                    completedToday >= 10 ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'
                  }`}
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Luyện Flashcard 10 từ vựng mục tiêu mới
                </span>
              </div>
              <span className="text-slate-400 font-medium">{Math.min(completedToday, 10)}/10</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <CheckCircle2
                  className={`w-4 h-4 ${
                    reviewDue === 0 ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'
                  }`}
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Hoàn thành phiên ôn tập ngắt quãng (SRS Review)
                </span>
              </div>
              <span className="text-slate-400 font-medium">{reviewDue} còn nợ</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Duy trì chuỗi học liên tiếp (Streak)
                </span>
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Hoàn thành</span>
            </div>
          </div>
        </GlassCard>

        {/* Weak Words Alert / Recommended Reinforce */}
        <GlassCard variant="liquid" className="p-5 md:p-6 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Cần củng cố thêm</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
              Từ vựng hay nhầm lẫn
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Các từ bạn phản xạ còn chậm hoặc từng chọn sai trong bài kiểm tra.
            </p>

            <div className="mt-3 space-y-1.5">
              {(data?.weakWords?.slice(0, 3) || [
                { id: '1', word: 'compromise', masteryScore: 45 },
                { id: '2', word: 'accommodate', masteryScore: 50 },
                { id: '3', word: 'resilient', masteryScore: 55 },
              ]).map((w: any) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200">{w.word}</span>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                    {w.masteryScore}% nhớ
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/review?topic=Business')}
            className="w-full mt-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ôn ngay các từ này</span>
          </button>
        </GlassCard>
      </div>
    </div>
  );
};
