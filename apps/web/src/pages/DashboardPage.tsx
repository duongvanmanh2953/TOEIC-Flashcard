import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth, isProUser } from '../contexts/AuthContext';
import { useTranslation } from '../i18n';
import { GlassCard } from '../components/common/GlassCard';
import { MemoryRescueCard } from '../components/dashboard/MemoryRescueCard';
import { QuotaMeter } from '../components/common/QuotaMeter';
import { PremiumBadge } from '../components/common/PremiumBadge';
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
  LockOpen,
  X,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, isGuest } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [memoryRescue, setMemoryRescue] = useState<any>(null);
  const [quotas, setQuotas] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSpotlight, setShowSpotlight] = useState(() => {
    return localStorage.getItem('leximind_hide_dash_spotlight') !== 'true';
  });

  const dismissSpotlight = () => {
    setShowSpotlight(false);
    localStorage.setItem('leximind_hide_dash_spotlight', 'true');
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const quotaEndpoint = isGuest ? '/subscriptions/guest-quotas' : '/subscriptions/my-quotas';
        const [dashRes, heatRes, rescueRes, quotaRes]: any = await Promise.all([
          api.get('/dashboard').catch(() => ({ data: {} })),
          api.get('/dashboard/heatmap').catch(() => ({ data: [] })),
          api.get('/reviews/memory-rescue').catch(() => ({ data: null })),
          api.get(quotaEndpoint).catch(() => ({ data: null })),
        ]);
        setData(dashRes.data || dashRes || {});
        setHeatmap(heatRes.data || heatRes || []);
        setMemoryRescue(rescueRes?.data || rescueRes || null);
        setQuotas(quotaRes?.data || quotaRes || null);
      } catch (err) {
        console.error('Error loading dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [isGuest]);

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

  // Real 7-day activity data from API
  const weeklyData = data?.weeklyData && data.weeklyData.length > 0 ? data.weeklyData : [
    { day: 'T2', reviews: 0, retention: 0 },
    { day: 'T3', reviews: 0, retention: 0 },
    { day: 'T4', reviews: 0, retention: 0 },
    { day: 'T5', reviews: 0, retention: 0 },
    { day: 'T6', reviews: 0, retention: 0 },
    { day: 'T7', reviews: 0, retention: 0 },
    { day: 'CN', reviews: completedToday, retention: data?.accuracy || 100 },
  ];

  const maxWeeklyReviews = Math.max(...weeklyData.map((d: any) => d.reviews), 10);

  // Real CEFR Distribution from API
  const cefrStats = data?.cefrStats && data.cefrStats.length > 0 ? data.cefrStats : [
    { level: 'A2', count: 0, percent: 0, color: 'bg-emerald-500' },
    { level: 'B1', count: 0, percent: 0, color: 'bg-indigo-500' },
    { level: 'B2', count: 0, percent: 0, color: 'bg-amber-500' },
    { level: 'C1', count: 0, percent: 0, color: 'bg-rose-500' },
  ];

  return (
    <div className="w-full space-y-5 animate-fade-in">
      {/* 1. Hero / Today's Plan — High Contrast Translucent Card (Compact & Focused) */}
      <GlassCard variant="liquid" className="p-4 sm:p-5 md:p-6 relative overflow-hidden bg-white/95 dark:bg-slate-900/95 border border-indigo-500/25 dark:border-indigo-500/30 shadow-lg rounded-2xl">
        <div className="max-w-3xl relative z-10 space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Spaced Repetition System • VocabFlow AI</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-snug tracking-tight">
            {timeGreeting}, {user?.displayName || 'Learner'} 👋
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Hôm nay bạn có{' '}
            <strong className="text-indigo-600 dark:text-indigo-400 font-black">
              {reviewDue} từ vựng
            </strong>{' '}
            {t('dashboard.heroSubtitle', 'đang trong thời điểm vàng cần kích hoạt trí nhớ dài hạn.')}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/review')}
              className="btn-glass-primary text-xs sm:text-sm !py-2.5 !px-5 gap-2 shadow-lg shadow-indigo-500/25"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              <span>{t('dashboard.startReviewCTA', 'Bắt đầu phiên ôn tập')}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>

            <button
              onClick={() => navigate('/word-bank')}
              className="btn-glass-secondary text-xs sm:text-sm !py-2.5 !px-4"
            >
              Kho từ của tôi
            </button>

            <button
              onClick={() => navigate('/vocabulary')}
              className="btn-glass-secondary text-xs sm:text-sm !py-2.5 !px-4"
            >
              Thư viện 600+ từ
            </button>
          </div>

          {/* Quick Win Micro-Learning Selector (2, 5, 10, 15 min) */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <span>⚡ Quick Win:</span>
            </span>
            <button
              onClick={() => navigate('/review?limit=3')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-700/60 transition"
              title="3 từ nhanh trong 2 phút"
            >
              2 phút
            </button>
            <button
              onClick={() => navigate('/review?limit=5')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-700/60 transition"
              title="5 từ trong 5 phút"
            >
              5 phút
            </button>
            <button
              onClick={() => navigate('/review?limit=10')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-700/60 transition"
              title="10 từ trong 10 phút"
            >
              10 phút
            </button>
            <button
              onClick={() => navigate('/review?limit=15')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-700/60 transition"
              title="15 từ trong 15 phút"
            >
              15 phút
            </button>
            <span className="text-[11px] text-slate-400 italic hidden sm:inline">
              (Học vi mô mọi lúc rảnh rỗi)
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Next Best Action Spotlight with Dismiss X */}
      {showSpotlight && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-emerald-500/15 border-2 border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm relative pr-10 animate-fade-in">
          <button
            onClick={dismissSpotlight}
            className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
            title="Ẩn thông báo này"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/30">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-indigo-600 dark:text-indigo-400">
                🎯 Next Best Action • Khuyến Nghị Trí Não
              </span>
              <p className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                {reviewDue > 0
                  ? `${reviewDue} từ vựng đã chạm ngưỡng quên (SRS Retrievability < 75%)`
                  : 'Mục tiêu ngày đã sẵn sàng: Củng cố 10 từ vựng cốt lõi TOEIC'}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/review')}
            className="btn-glass-primary text-xs !py-2 !px-4 shrink-0 gap-1.5 shadow-sm"
          >
            <span>Khởi động ngay</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Memory Rescue Slipping Words Alert Widget */}
      {memoryRescue && memoryRescue.rescueCount > 0 && (
        <MemoryRescueCard
          rescueCount={memoryRescue.rescueCount}
          slippingWords={memoryRescue.slippingWords}
          averageMastery={memoryRescue.averageMastery}
          onStartRescue={() => navigate('/review?type=MEMORY_RESCUE')}
        />
      )}

      {/* Daily Quota Balance & Entitlements Bar */}
      {quotas && (() => {
        const isPro = isProUser(user) || quotas?.isPro || quotas?.tier === 'PRO';
        const effectiveTier = isPro ? 'PRO' : (quotas?.tier || 'FREE');

        return (
          <GlassCard className="p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 bg-white/90 dark:bg-slate-900/90">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2.5">
                <PremiumBadge tier={effectiveTier} />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {isPro ? 'Gói VocabFlow Pro (Đang kích hoạt)' : effectiveTier === 'PLUS' ? 'Gói VocabFlow Plus' : 'Tài khoản Miễn Phí'}
                </span>
              </div>
              {!isPro && effectiveTier === 'FREE' && (
                <button
                  onClick={() => navigate('/upgrade')}
                  className="relative overflow-hidden text-xs font-black text-amber-900 dark:text-amber-100 flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-amber-400/20 dark:bg-amber-400/15 backdrop-blur-md border border-amber-400/60 hover:border-amber-300 hover:scale-105 transition group"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                  <span>Mở khóa toàn bộ tính năng Pro</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <QuotaMeter
                feature="AI_TUTOR"
                used={quotas.aiTutor?.used ?? quotas.AI_TUTOR?.used ?? 0}
                limit={isPro ? 200 : (quotas.aiTutor?.limit ?? quotas.AI_TUTOR?.limit ?? 10)}
                remaining={isPro ? Math.max(0, 200 - (quotas.aiTutor?.used ?? quotas.AI_TUTOR?.used ?? 0)) : (quotas.aiTutor?.remaining ?? quotas.AI_TUTOR?.remaining ?? 10)}
                tier={effectiveTier}
                onUpgrade={() => navigate('/subscription')}
              />
              <QuotaMeter
                feature="TEXT_TO_VOCAB"
                used={quotas.textToVocab?.used ?? quotas.TEXT_TO_VOCAB?.used ?? 0}
                limit={isPro ? 50 : (quotas.textToVocab?.limit ?? quotas.TEXT_TO_VOCAB?.limit ?? 3)}
                remaining={isPro ? Math.max(0, 50 - (quotas.textToVocab?.used ?? quotas.TEXT_TO_VOCAB?.used ?? 0)) : (quotas.textToVocab?.remaining ?? quotas.TEXT_TO_VOCAB?.remaining ?? 3)}
                tier={effectiveTier}
                onUpgrade={() => navigate('/subscription')}
              />
              <QuotaMeter
                feature="STORY_GEN"
                used={quotas.storyGen?.used ?? quotas.AI_STORY?.used ?? 0}
                limit={isPro ? 20 : (quotas.storyGen?.limit ?? quotas.AI_STORY?.limit ?? 1)}
                remaining={isPro ? Math.max(0, 20 - (quotas.storyGen?.used ?? quotas.AI_STORY?.used ?? 0)) : (quotas.storyGen?.remaining ?? quotas.AI_STORY?.remaining ?? 1)}
                tier={effectiveTier}
                onUpgrade={() => navigate('/subscription')}
              />
            </div>
          </GlassCard>
        );
      })()}

      {/* 2. Key Metrics Row — 4 Rich Feature Cards with Distinct Liquid Glass Palettes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Daily Goal Card (Indigo / Violet Theme) */}
        <div className="liquid-glass-card card-metric-indigo p-5 rounded-3xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {t('dashboard.dailyGoal', 'Mục tiêu ngày')}
            </span>
            <div className="p-2 rounded-xl bg-indigo-500 text-white">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {completedToday}
            </span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">/ {dailyGoal} từ</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-indigo-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-300"
              style={{ width: `${goalPercent}%` }}
            />
          </div>
          <span className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-2 block font-extrabold">{goalPercent}% hoàn thành</span>
        </div>

        {/* 2. Streak Card (Warm Amber / Flame Theme) */}
        <div className="liquid-glass-card card-metric-amber p-5 rounded-3xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {t('dashboard.streak', 'Chuỗi liên tiếp')}
            </span>
            <div className="p-2 rounded-xl bg-amber-500 text-white animate-pulse">
              <Flame className="w-4 h-4 fill-white" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight mt-1">
            {data?.streak?.currentStreak || 0} <span className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400">ngày 🔥</span>
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-3 font-semibold">
            Kỷ lục cao nhất: <strong className="font-black text-amber-800 dark:text-amber-200">{data?.streak?.longestStreak || 0} ngày</strong>
          </p>
        </div>

        {/* 3. Total Mastered (Emerald / Mint Crystal Theme) */}
        <div className="liquid-glass-card card-metric-emerald p-5 rounded-3xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {t('dashboard.totalWords', 'Từ đã thành thạo')}
            </span>
            <div className="p-2 rounded-xl bg-emerald-500 text-white">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight mt-1">
            {data?.masteredCount || 0} <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">từ</span>
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-3 font-semibold">
            Độ bền trí nhớ SRS &gt; 85%
          </p>
        </div>

        {/* 4. Learning Level & XP (Sky / Cyan Theme) */}
        <div className="liquid-glass-card card-metric-cyan p-5 rounded-3xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              {t('dashboard.level', 'Cấp độ & XP')}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-cyan-500 text-white">
              CEFR {data?.profile?.englishLevel || 'B1'}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight mt-1">
            Lvl {user?.xp?.currentLevel || 1}
          </p>
          <p className="text-xs text-cyan-700 dark:text-cyan-300 mt-3 font-semibold">
            <strong className="font-black text-cyan-800 dark:text-cyan-200">{user?.xp?.totalXP || 0} XP</strong> tích lũy
          </p>
        </div>
      </div>

      {/* 3. Visual Statistical Charts Section (User Requested Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Weekly Retention & Review Activity Chart (Violet / Indigo Accent) */}
        <GlassCard
          variant="liquid"
          className="lg:col-span-2 p-5 md:p-6 bg-gradient-to-br from-indigo-500/[0.04] via-white/90 to-transparent dark:from-indigo-950/30 dark:via-slate-900/90 dark:to-transparent border border-indigo-400/30 dark:border-indigo-500/25 shadow-md"
        >
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
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50">
              <span className="text-[10px] uppercase font-bold text-slate-400">Tổng từ tuần này</span>
              <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                {weeklyData.reduce((acc, curr) => acc + curr.reviews, 0)} từ
              </p>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-400/30">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Độ nhớ trung bình</span>
              <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">89.5%</p>
            </div>
            <div className="p-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-400/30">
              <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">Dự báo ngày mai</span>
              <p className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">18 từ</p>
            </div>
          </div>
        </GlassCard>

        {/* CEFR Level Mastery Distribution Chart (Purple / Magenta Accent) */}
        <GlassCard
          variant="liquid"
          className="p-5 md:p-6 bg-gradient-to-br from-purple-500/[0.05] via-white/90 to-transparent dark:from-purple-950/35 dark:via-slate-900/90 dark:to-transparent border border-purple-400/30 dark:border-purple-500/25 shadow-md flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Phân Bổ Từ Vựng CEFR</span>
              </h3>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-400/30">
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
              className="w-full py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/15 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-400/20 transition flex items-center justify-center gap-1.5"
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
        <GlassCard
          variant="liquid"
          className="lg:col-span-2 p-5 md:p-6 bg-gradient-to-br from-indigo-500/[0.03] via-white/90 to-transparent dark:from-indigo-950/20 dark:via-slate-900/90 dark:to-transparent border border-slate-200/80 dark:border-slate-800/80 shadow-md"
        >
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
                  className={`w-4 h-4 ${completedToday >= 10 ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'
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
                  className={`w-4 h-4 ${reviewDue === 0 ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'
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

        {/* Memory Rescue & Weak Words Alert (Ruby / Rose Accent) */}
        <GlassCard
          variant="liquid"
          className="p-5 md:p-6 bg-gradient-to-br from-rose-500/[0.08] via-white/90 to-amber-500/[0.04] dark:from-rose-950/40 dark:via-slate-900/90 dark:to-amber-950/20 border border-rose-400/40 dark:border-rose-500/35 shadow-md flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>Memory Rescue</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
              Cứu Từ Vựng Có Nguy Cơ Quên
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Dự đoán xác suất ghi nhớ đang dưới 60%. Cần kích hoạt 1 lần phản xạ để đưa từ trở lại vùng an toàn.
            </p>

            <div className="mt-3 space-y-1.5">
              {[
                { word: 'compromise', score: 42, reason: 'Phản xạ chậm' },
                { word: 'accommodate', score: 48, reason: 'Nhầm spelling' },
                { word: 'resilient', score: 55, reason: 'Sắp tới hạn' },
              ].map((w, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/20 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{w.word}</span>
                    <span className="text-[10px] text-slate-400 block">{w.reason}</span>
                  </div>
                  <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                    {w.score}% nhớ
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/review?mode=rescue')}
            className="btn-glass-danger w-full mt-4 !py-2.5 text-xs gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 fill-white" />
            <span>Cứu 3 từ vựng này ngay</span>
          </button>
        </GlassCard>
      </div>

      {/* 5. Vocabulary Health & Flexible Journey Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard variant="liquid" className="p-4 sm:p-5 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Độ Bền Trí Nhớ (Retention)</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Tốt</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">84%</p>
          <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '84%' }} />
          </div>
        </GlassCard>

        <GlassCard variant="liquid" className="p-4 sm:p-5 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Tính Đều Đặn (Consistency)</span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Rất Cao</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">91%</p>
          <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: '91%' }} />
          </div>
        </GlassCard>

        <GlassCard variant="liquid" className="p-4 sm:p-5 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Tốc Độ Phản Xạ (Recall)</span>
            <span className="text-xs font-bold text-amber-500">Ổn Định</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">78%</p>
          <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: '78%' }} />
          </div>
        </GlassCard>
      </div>

      {/* Flexible Journey Reassurance */}
      <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🌱</span>
          <span className="font-semibold">
            Hành trình học tập linh hoạt: Dù bạn có bận một ngày, trí nhớ vẫn được bảo tồn và tối ưu tự động khi quay lại.
          </span>
        </div>
        <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-white/50 dark:bg-slate-900/50 px-2 py-0.5 rounded-md">
          Zero-Pressure Learning
        </span>
      </div>
    </div>
  );
};
