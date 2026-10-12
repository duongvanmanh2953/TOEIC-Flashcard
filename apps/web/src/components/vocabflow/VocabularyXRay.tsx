import React, { useState, useEffect } from 'react';
import {
  Brain, Zap, AlertTriangle, ShieldCheck, HelpCircle, 
  ChevronRight, RefreshCw, BarChart3, TrendingUp, Sparkles,
  BookOpen, Mic, PenTool, Eye, Search, Layers, Loader2
} from 'lucide-react';
import api from '../../lib/api';

interface XRayData {
  totalTracked: number;
  qualityDistribution: {
    strong: number;
    unstable: number;
    atRisk: number;
    forgotten: number;
  };
  dimensionAverages: {
    recognition: number;
    recall: number;
    context: number;
    production: number;
    speaking: number;
  };
  cefrDistribution: Record<string, number>;
  weakestDomains: Array<{ domain: string; count: number; avgStability: number }>;
  recommendedFocus: string;
}

interface VocabularyXRayProps {
  onInspectWord?: (wordId: string) => void;
  onOpenCapture?: () => void;
}

export const VocabularyXRay: React.FC<VocabularyXRayProps> = ({ onInspectWord, onOpenCapture }) => {
  const [data, setData] = useState<XRayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchXRay = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.get('/vocabulary/x-ray');
      const payload = res?.data || res;
      setData(payload);
    } catch (err: any) {
      console.warn('Failed to load Vocabulary X-Ray:', err);
      setError('Chưa thể tải dữ liệu X-Ray từ vựng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchXRay();
  }, []);

  if (loading) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center min-h-[280px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-xs font-semibold text-slate-500">Đang quét đa chiều cấu trúc trí nhớ (VocabFlow X-Ray)...</p>
      </div>
    );
  }

  if (error || !data || data.totalTracked === 0) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
          <Brain className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {data?.totalTracked === 0 ? 'Chưa đủ dữ liệu phân tích X-Ray' : 'Không thể tải X-Ray'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            {data?.totalTracked === 0
              ? 'Học tối thiểu 3 từ vựng hoặc quét tài liệu tiếng Anh thực tế để hệ thống giải mã biểu đồ trí nhớ 5 chiều của bạn.'
              : error}
          </p>
        </div>
        {onOpenCapture && (
          <button
            onClick={onOpenCapture}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-sm inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Quét bài đọc tiếng Anh (Vocabulary Capture)</span>
          </button>
        )}
      </div>
    );
  }

  const { qualityDistribution, dimensionAverages, cefrDistribution, weakestDomains } = data;
  const total = data.totalTracked || 1;

  const qualityItems = [
    { label: 'Bền vững (Strong)', count: qualityDistribution.strong, color: 'bg-emerald-500', text: 'text-emerald-500', percent: Math.round((qualityDistribution.strong / total) * 100) },
    { label: 'Chưa ổn định (Unstable)', count: qualityDistribution.unstable, color: 'bg-indigo-500', text: 'text-indigo-500', percent: Math.round((qualityDistribution.unstable / total) * 100) },
    { label: 'Có nguy cơ quên (At Risk)', count: qualityDistribution.atRisk, color: 'bg-amber-500', text: 'text-amber-500', percent: Math.round((qualityDistribution.atRisk / total) * 100) },
    { label: 'Đã quên (Forgotten)', count: qualityDistribution.forgotten, color: 'bg-rose-500', text: 'text-rose-500', percent: Math.round((qualityDistribution.forgotten / total) * 100) },
  ];

  const dimensions = [
    { name: 'Nhận diện mặt chữ (Recognition)', score: dimensionAverages.recognition, icon: Eye, color: 'text-blue-500', bar: 'bg-blue-500' },
    { name: 'Hồi tưởng ngữ nghĩa (Recall)', score: dimensionAverages.recall, icon: Zap, color: 'text-indigo-500', bar: 'bg-indigo-500' },
    { name: 'Hiểu trong ngữ cảnh (Context)', score: dimensionAverages.context, icon: BookOpen, color: 'text-emerald-500', bar: 'bg-emerald-500' },
    { name: 'Tạo câu & viết (Production)', score: dimensionAverages.production, icon: PenTool, color: 'text-amber-500', bar: 'bg-amber-500' },
    { name: 'Phát âm & nói (Speaking)', score: dimensionAverages.speaking, icon: Mic, color: 'text-rose-500', bar: 'bg-rose-500' },
  ];

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                VocabFlow™ Vocabulary X-Ray
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                Cognitive 5D
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Phân tách ranh giới giữa <em>"Biết từ (Passive)"</em> và <em>"Sử dụng được từ (Active)"</em>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenCapture && (
            <button
              onClick={onOpenCapture}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quét bài đọc AI</span>
            </button>
          )}
          <button
            onClick={fetchXRay}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quality Spectrum Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
            Phổ chất lượng trí nhớ ({total} từ vựng)
          </span>
          <span className="text-slate-400 text-[11px]">
            Khuyên dùng: <strong className="text-indigo-600 dark:text-indigo-400">{data.recommendedFocus}</strong>
          </span>
        </div>

        {/* Stacked Progress Bar */}
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
          {qualityItems.map((item, idx) => (
            <div
              key={idx}
              className={`${item.color} h-full transition-all duration-700`}
              style={{ width: `${item.percent}%` }}
              title={`${item.label}: ${item.count} từ (${item.percent}%)`}
            />
          ))}
        </div>

        {/* Quality Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {qualityItems.map((item, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">{item.count}</span>
                <span className={`text-[11px] font-bold ${item.text}`}>{item.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5 Cognitive Dimensions */}
      <div className="space-y-3 pt-2">
        <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
          Chỉ số thành thạo 5 chiều nhận thức (Active vs Passive)
        </h4>

        <div className="space-y-2.5">
          {dimensions.map((dim, idx) => {
            const Icon = dim.icon;
            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${dim.color}`} />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{dim.name}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{dim.score}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`${dim.bar} h-full rounded-full transition-all duration-700`}
                    style={{ width: `${Math.min(100, Math.max(0, dim.score))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CEFR Level & Weakest Domains */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* CEFR Distribution */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
          <h5 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Phân bố theo khung chuẩn CEFR</span>
          </h5>
          <div className="grid grid-cols-6 gap-1.5 pt-1 text-center">
            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => {
              const count = cefrDistribution[lvl] || 0;
              return (
                <div key={lvl} className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 block">{lvl}</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weakest Domains */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
          <h5 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Lĩnh vực từ vựng cần củng cố</span>
          </h5>
          {weakestDomains && weakestDomains.length > 0 ? (
            <div className="space-y-1.5 pt-1">
              {weakestDomains.slice(0, 3).map((wd, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{wd.domain}</span>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">{wd.count} từ yếu</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3 text-slate-400 text-xs">
              Vốn từ phân bố đồng đều, chưa ghi nhận điểm nghẽn nghiêm trọng.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
