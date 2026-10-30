import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import {
  Award,
  Flame,
  TrendingUp,
  Brain,
  Sparkles,
  Zap,
  BookCheck,
  PenTool,
  GraduationCap,
  Headphones,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Activity,
  Layers,
} from 'lucide-react';
import { FeatureLock } from '../components/common/FeatureLock';
import { useAuth } from '../contexts/AuthContext';
import { VocabularyXRay } from '../components/vocabflow/VocabularyXRay';
import { SmartQueueBar } from '../components/vocabflow/SmartQueueBar';
import { ConfusionPairsCard } from '../components/vocabflow/ConfusionPairsCard';
import { VocabularyCaptureModal } from '../components/vocabflow/VocabularyCaptureModal';
import { WordDiagnosticModal } from '../components/vocabflow/WordDiagnosticModal';

interface UnifiedSummary {
  ums: number;
  componentScores: {
    vocab: number;
    grammar: number;
    exam: number;
    writing: number;
    listening: number;
  };
  radarMetrics: Array<{
    subject: string;
    score: number;
    fullMark: number;
  }>;
  heatmapData: Array<{
    date: string;
    count: number;
    level: number;
  }>;
  forgettingCurve: Array<{
    day: string;
    retention: number;
  }>;
  slipRiskWords: Array<{
    word: string;
    pos: string;
    meaning: string;
    riskScore: number;
  }>;
  recommendations: Array<{
    type: string;
    title: string;
    desc: string;
    actionUrl: string;
  }>;
}

export const ProgressAnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [unifiedSummary, setUnifiedSummary] = useState<UnifiedSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // VocabFlow Modals
  const [captureModalOpen, setCaptureModalOpen] = useState(false);
  const [inspectedWordId, setInspectedWordId] = useState<string | null>(null);

  useEffect(() => {
    Promise.allSettled([
      api.get('/dashboard'),
      api.get('/progress/unified-summary'),
    ]).then(([dashRes, progRes]) => {
      if (dashRes.status === 'fulfilled' && dashRes.value?.data) {
        const payload = dashRes.value.data?.data || dashRes.value.data;
        setData(payload);
      }
      if (progRes.status === 'fulfilled' && progRes.value?.data) {
        const progData = progRes.value.data?.data || progRes.value.data;
        setUnifiedSummary(progData);
      }
      setLoading(false);
    });
  }, []);

  const achievements = [
    { code: 'FIRST_WORD', name: 'Bước Đầu Tiên', desc: 'Học từ vựng đầu tiên', unlocked: true },
    { code: 'STREAK_3', name: 'Khởi Động Thói Quen', desc: 'Duy trì chuỗi 3 ngày', unlocked: (data?.streak || 0) >= 3 },
    { code: 'STREAK_7', name: 'Bậc Thầy Bền Bỉ', desc: 'Duy trì chuỗi 7 ngày', unlocked: (data?.streak || 0) >= 7 },
    { code: 'VOCAB_50', name: 'Xây Dựng Vốn Từ', desc: 'Thực hành 50 từ vựng', unlocked: (data?.stats?.totalTracked || 0) >= 50 },
    { code: 'MASTER_10', name: 'Ghi Nhớ Vĩnh Viễn', desc: 'Đạt 100% Mastery cho 10 từ', unlocked: (data?.stats?.mastered || 0) >= 10 },
  ];

  // Helper for SVG Radar chart
  const renderRadarPolygon = (metrics: Array<{ score: number }>, radius: number, center: number) => {
    const total = metrics.length;
    return metrics
      .map((m, i) => {
        const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
        const dist = (m.score / 100) * radius;
        const x = center + dist * Math.cos(angle);
        const y = center + dist * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(' ');
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 4:
        return 'bg-emerald-500 shadow-sm shadow-emerald-500/40';
      case 3:
        return 'bg-emerald-600/80';
      case 2:
        return 'bg-emerald-700/50';
      case 1:
        return 'bg-emerald-800/30';
      default:
        return 'bg-slate-200 dark:bg-slate-800/60';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const umsScore = unifiedSummary?.ums ?? 72;
  const radarMetrics = unifiedSummary?.radarMetrics || [
    { subject: 'Từ vựng (Vocab)', score: 75, fullMark: 100 },
    { subject: 'Ngữ pháp (Grammar)', score: 68, fullMark: 100 },
    { subject: 'Kỹ năng Nghe (Listening)', score: 70, fullMark: 100 },
    { subject: 'Đọc hiểu (Reading)', score: 65, fullMark: 100 },
    { subject: 'Viết chữ (Writing)', score: 58, fullMark: 100 },
    { subject: 'Phản xạ (Reaction)', score: 80, fullMark: 100 },
  ];

  const radarCenter = 130;
  const radarRadius = 90;

  return (
    <div className="w-full space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Tiến Độ & Phân Tích Khoa Học Trí Nhớ (UMS)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xs">
              FSRS AI
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Chỉ số năng lực đồng bộ hóa 5 trục: Từ vựng, Ngữ pháp, Nghe, Viết và Bộ đề
          </p>
        </div>

        <button
          onClick={() => setCaptureModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:opacity-95 text-white font-bold text-xs transition shadow-md shadow-indigo-600/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Quét văn bản thực tế</span>
        </button>
      </div>

      {/* Hero UMS Banner: Unified Mastery Score Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 p-6 md:p-8 text-white border border-indigo-500/30 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Gauge & Score */}
          <div className="lg:col-span-4 flex flex-col items-center sm:flex-row sm:items-center lg:flex-col lg:items-center gap-5 text-center sm:text-left lg:text-center">
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="transparent"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="transparent"
                  stroke="url(#umsGradient)"
                  strokeWidth="10"
                  strokeDasharray={`${(umsScore / 100) * 314} 314`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="umsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#c084fc" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black tracking-tight">{umsScore}</span>
                <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">/ 100 UMS</span>
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-black tracking-wide text-amber-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {umsScore >= 85 ? 'Cấp độ: Cao thủ (Mastery)' : umsScore >= 70 ? 'Cấp độ: Tinh thông (Proficient)' : 'Cấp độ: Đang phát triển'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-2 max-w-xs">
                Chỉ số thông thạo tổng hợp tính bằng trọng số khoa học theo tiêu chuẩn CEFR & FSRS v4.
              </p>
            </div>
          </div>

          {/* Breakdown Formula & Component Chips */}
          <div className="lg:col-span-8 space-y-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <span>Công thức Unified Mastery Score:</span>
                </span>
                <span className="text-[11px] font-mono text-indigo-300">
                  0.35V + 0.25G + 0.15L + 0.10W + 0.15E
                </span>
              </div>

              {/* 5 Component Progress Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5 font-bold text-slate-200">
                      <Brain className="w-3.5 h-3.5 text-blue-400" /> Từ vựng (35%)
                    </span>
                    <span className="font-mono font-bold text-blue-300">
                      {unifiedSummary?.componentScores?.vocab ?? 75}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full"
                      style={{ width: `${unifiedSummary?.componentScores?.vocab ?? 75}%` }}
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5 font-bold text-slate-200">
                      <BookCheck className="w-3.5 h-3.5 text-emerald-400" /> Ngữ pháp (25%)
                    </span>
                    <span className="font-mono font-bold text-emerald-300">
                      {unifiedSummary?.componentScores?.grammar ?? 68}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${unifiedSummary?.componentScores?.grammar ?? 68}%` }}
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5 font-bold text-slate-200">
                      <Headphones className="w-3.5 h-3.5 text-purple-400" /> Nghe (15%)
                    </span>
                    <span className="font-mono font-bold text-purple-300">
                      {unifiedSummary?.componentScores?.listening ?? 70}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-purple-400 rounded-full"
                      style={{ width: `${unifiedSummary?.componentScores?.listening ?? 70}%` }}
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5 font-bold text-slate-200">
                      <PenTool className="w-3.5 h-3.5 text-pink-400" /> Viết chữ (10%)
                    </span>
                    <span className="font-mono font-bold text-pink-300">
                      {unifiedSummary?.componentScores?.writing ?? 58}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-pink-400 rounded-full"
                      style={{ width: `${unifiedSummary?.componentScores?.writing ?? 58}%` }}
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 sm:col-span-2 md:col-span-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5 font-bold text-slate-200">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-400" /> Bài thi (15%)
                    </span>
                    <span className="font-mono font-bold text-amber-300">
                      {unifiedSummary?.componentScores?.exam ?? 65}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${unifiedSummary?.componentScores?.exam ?? 65}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Review Queue Micro-learning Bar */}
      <SmartQueueBar />

      {/* Core Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Tổng từ đang theo dõi</span>
            <Brain className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-slate-100">
            {data?.stats?.totalTracked || 0}
          </p>
          <div className="text-xs text-slate-400">
            {data?.stats?.mastered || 0} từ đã thuộc vĩnh viễn (Mastered)
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Độ nhớ trung bình (Retention)</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {data?.mastery || 0}%
          </p>
          <div className="text-xs text-slate-400">Dựa trên xác suất gợi nhớ FSRS v4</div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Chuỗi kỷ lục</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-amber-500">{data?.longestStreak || 0} ngày</p>
          <div className="text-xs text-slate-400">Chuỗi hiện tại: {data?.streak || 0} ngày</div>
        </div>
      </div>

      {/* 2 Columns: 6-Axis Radar Spiderweb + Ebbinghaus Forgetting Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Radar Năng Lực 6 Chiều (Skill Radar)</span>
              </h3>
              <p className="text-xs text-slate-500">Đánh giá cân bằng giữa tiếp nhận (receptive) và sản sinh (productive)</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
              6D
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* SVG Spiderweb Chart */}
            <div className="relative shrink-0">
              <svg width="260" height="260" className="overflow-visible">
                {/* Concentric grid polygons */}
                {[0.2, 0.4, 0.6, 0.8, 1.0].map((ratio) => {
                  const points = radarMetrics.map((_, i) => {
                    const angle = (Math.PI * 2 / radarMetrics.length) * i - Math.PI / 2;
                    const dist = ratio * radarRadius;
                    return `${radarCenter + dist * Math.cos(angle)},${radarCenter + dist * Math.sin(angle)}`;
                  }).join(' ');
                  return (
                    <polygon
                      key={ratio}
                      points={points}
                      fill="none"
                      stroke="currentColor"
                      className="text-slate-200 dark:text-slate-800"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Axes radiating outward */}
                {radarMetrics.map((_, i) => {
                  const angle = (Math.PI * 2 / radarMetrics.length) * i - Math.PI / 2;
                  const x2 = radarCenter + radarRadius * Math.cos(angle);
                  const y2 = radarCenter + radarRadius * Math.sin(angle);
                  return (
                    <line
                      key={i}
                      x1={radarCenter}
                      y1={radarCenter}
                      x2={x2}
                      y2={y2}
                      stroke="currentColor"
                      className="text-slate-200 dark:text-slate-800"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Player polygon */}
                <polygon
                  points={renderRadarPolygon(radarMetrics, radarRadius, radarCenter)}
                  fill="rgba(99, 102, 241, 0.25)"
                  stroke="#6366f1"
                  strokeWidth="2.5"
                />

                {/* Markers at points */}
                {radarMetrics.map((m, i) => {
                  const angle = (Math.PI * 2 / radarMetrics.length) * i - Math.PI / 2;
                  const dist = (m.score / 100) * radarRadius;
                  const x = radarCenter + dist * Math.cos(angle);
                  const y = radarCenter + dist * Math.sin(angle);
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#6366f1"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  );
                })}
              </svg>
            </div>

            {/* Metrics List */}
            <div className="w-full space-y-2 flex-1">
              {radarMetrics.map((metric, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400 font-medium truncate pr-2">
                    {metric.subject}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 dark:bg-indigo-400 rounded-full"
                        style={{ width: `${metric.score}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-white w-7 text-right">
                      {metric.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ebbinghaus Forgetting Curve */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Đường Cong Quên Lãng (Forgetting Curve)</span>
              </h3>
              <p className="text-xs text-slate-500">Dự báo suy giảm xác suất gợi nhớ FSRS theo thời gian</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
              Ebbinghaus
            </span>
          </div>

          <div className="space-y-4">
            <div className="h-36 w-full flex items-end gap-2 pt-4 px-2">
              {(unifiedSummary?.forgettingCurve || [
                { day: '0d', retention: 100 },
                { day: '1d', retention: 78 },
                { day: '3d', retention: 65 },
                { day: '7d', retention: 55 },
                { day: '14d', retention: 48 },
                { day: '30d', retention: 42 },
                { day: '60d', retention: 38 },
              ]).map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="relative w-full flex items-end justify-center h-full">
                    <div
                      className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${
                        item.retention >= 70
                          ? 'bg-emerald-500 group-hover:bg-emerald-400'
                          : item.retention >= 50
                            ? 'bg-amber-500 group-hover:bg-amber-400'
                            : 'bg-rose-500 group-hover:bg-rose-400'
                      }`}
                      style={{ height: `${item.retention}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{item.day}</span>
                  <span className="text-[9px] font-mono text-slate-400">{item.retention}%</span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300">
                Ngưỡng ôn tập tối ưu để giữ độ nhớ trên 85%:
              </span>
              <span className="font-black text-indigo-600 dark:text-indigo-400">Chu kỳ ngày 1, 3 và 7</span>
            </div>
          </div>
        </div>
      </div>

      {/* 365-Day Activity Heatmap (Activity Calendar) */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Nhật Ký Hoạt Động & Chuỗi Học Tập (Activity Heatmap)
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Ít</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((lvl) => (
                <div key={lvl} className={`w-3 h-3 rounded-xs ${getLevelColor(lvl)}`} />
              ))}
            </div>
            <span>Nhiều</span>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="inline-grid grid-rows-7 grid-flow-col gap-1.5 min-w-[640px]">
            {(unifiedSummary?.heatmapData || Array.from({ length: 70 }, (_, i) => ({
              date: `2026-10-${(i % 30) + 1}`,
              count: i % 4 === 0 ? 15 : i % 2 === 0 ? 5 : 0,
              level: i % 4 === 0 ? 3 : i % 2 === 0 ? 1 : 0,
            }))).map((item, idx) => (
              <div
                key={idx}
                title={`${item.date}: ${item.count} lượt tương tác`}
                className={`w-3.5 h-3.5 rounded-xs transition-colors hover:ring-2 hover:ring-indigo-400 cursor-pointer ${getLevelColor(
                  item.level,
                )}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Slip Risk Words & Personalized Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Slip Risk Words */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Từ Vựng Có Nguy Cơ Quên (Slip Risk)
              </h3>
            </div>
            <button
              onClick={() => navigate('/review')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Ôn tập ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {(unifiedSummary?.slipRiskWords && unifiedSummary.slipRiskWords.length > 0) ? (
              unifiedSummary.slipRiskWords.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/40 flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {item.word}
                      </span>
                      {item.pos && (
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          ({item.pos})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
                      {item.meaning}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block">
                      Rủi ro
                    </span>
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400 font-mono">
                      {item.riskScore}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                Chúc mừng! Không có từ vựng nào nằm trong vùng nguy cơ trượt nhớ lúc này.
              </div>
            )}
          </div>
        </div>

        {/* Personalized Recommendations */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Zap className="w-5 h-5" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Khuyến Nghị Học Tập Từ AI (FSRS Guidance)
            </h3>
          </div>

          <div className="space-y-3">
            {(unifiedSummary?.recommendations && unifiedSummary.recommendations.length > 0) ? (
              unifiedSummary.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(rec.actionUrl)}
                  className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900/40 hover:border-indigo-400 transition-all cursor-pointer group flex items-start justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs font-black text-indigo-950 dark:text-indigo-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {rec.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {rec.desc}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5 group-hover:translate-x-1 transition-transform" />
                </div>
              ))
            ) : (
              <div
                onClick={() => navigate('/review')}
                className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900/40 hover:border-indigo-400 transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-black text-indigo-950 dark:text-indigo-200">
                    Duy trì nhịp học hôm nay
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Hoàn thành phiên ôn tập flashcard đa chế độ để nâng điểm UMS lên nấc tiếp theo.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-500 shrink-0" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vocabulary X-Ray Cognitive 5D Engine */}
      <VocabularyXRay
        onInspectWord={(wordId) => setInspectedWordId(wordId)}
        onOpenCapture={() => setCaptureModalOpen(true)}
      />

      {/* Confusion Engine: Frequently Confused Pairs */}
      <ConfusionPairsCard />

      {/* Achievements Section */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              Danh Hiệu & Huy Chương (Achievements)
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {achievements.filter((a) => a.unlocked).length} / {achievements.length} Mở khóa
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((ach) => (
            <div
              key={ach.code}
              className={`p-4 rounded-2xl border transition flex items-center gap-3 ${
                ach.unlocked
                  ? 'bg-indigo-500/[0.06] dark:bg-indigo-500/[0.12] border-indigo-400/40 backdrop-blur-md'
                  : 'bg-transparent border-slate-200/50 dark:border-slate-800/50 opacity-40'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                  ach.unlocked
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                }`}
              >
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight text-slate-900 dark:text-white">{ach.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{ach.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* VocabFlow Modals */}
      <VocabularyCaptureModal
        isOpen={captureModalOpen}
        onClose={() => setCaptureModalOpen(false)}
      />

      <WordDiagnosticModal
        vocabularyId={inspectedWordId}
        onClose={() => setInspectedWordId(null)}
      />
    </div>
  );
};
