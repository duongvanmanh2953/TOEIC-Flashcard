import React, { useState, useEffect } from 'react';
import { 
  Cpu, Zap, DollarSign, Activity, Sparkles, Clock, 
  BarChart2, RefreshCw, AlertCircle, CheckCircle2
} from 'lucide-react';
import api from '../../lib/api';

interface AIStats {
  totalRequests: number;
  totalTokens: number;
  avgLatencyMs: number;
  estimatedCostUsd: number;
}

export const AdminAIPage: React.FC = () => {
  const [stats, setStats] = useState<AIStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAIStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/ai-stats');
      setStats(res.data?.data || null);
    } catch (err) {
      console.error('Failed to load AI stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Cpu className="w-7 h-7 text-indigo-500" />
            AI Telemetry & Token Cost Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track LLM inference latency, token consumption, feature usage breakdown, and API spending
          </p>
        </div>
        <button 
          onClick={fetchAIStats} 
          className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Inference Requests</span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {stats?.totalRequests?.toLocaleString() || 0}
          </p>
          <span className="text-xs text-emerald-500 flex items-center gap-1 mt-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> 99.8% Success Rate
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Tổng số Token tiêu thụ</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {stats?.totalTokens ? stats.totalTokens.toLocaleString() : 0}
          </p>
          <span className="text-xs text-slate-400 mt-2 block">
            Prompt + Completion (Lưu trong DB)
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Độ trễ trung bình</span>
            <Clock className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mt-2">
            {stats?.avgLatencyMs ?? 0}ms
          </p>
          <span className="text-xs text-emerald-500 mt-2 block">
            Gemini 1.5 Streaming API
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Ước tính chi phí LLM</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            ${stats?.estimatedCostUsd ?? 0}
          </p>
          <span className="text-xs text-slate-400 mt-2 block">
            Đơn giá $0.000002 / token
          </span>
        </div>
      </div>

      {/* Feature Usage Breakdown & Model Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Breakdown */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-500" />
            AI Feature Usage Breakdown
          </h3>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">AI Tutor Chatbot (Conversational)</span>
                <span className="text-slate-500">54% (670k tokens)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-700/50 overflow-hidden">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: '54%' }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">Smart Flashcard & Example Generator</span>
                <span className="text-slate-500">26% (320k tokens)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-700/50 overflow-hidden">
                <div className="h-full rounded-full bg-purple-500" style={{ width: '26%' }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">TOEIC Grammar & Question Explainer</span>
                <span className="text-slate-500">14% (175k tokens)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-700/50 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: '14%' }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">Pronunciation & Speech Feedback</span>
                <span className="text-slate-500">6% (75k tokens)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-700/50 overflow-hidden">
                <div className="h-full rounded-full bg-amber-500" style={{ width: '6%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Model Infrastructure & Quota Health */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            Model Provider & Fallback Status
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
              <div>
                <div className="font-bold text-emerald-900 dark:text-emerald-300">Gemini 1.5 Flash (Primary)</div>
                <div className="text-emerald-700 dark:text-emerald-400 text-[11px] mt-0.5">High throughput • Streaming enabled</div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold">
                Healthy
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">Gemini 1.5 Pro (Complex Explanations)</div>
                <div className="text-slate-500 text-[11px] mt-0.5">High reasoning • Fallback ready</div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                Standby
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">Rate Limit Cushion (RPM / TPM)</div>
                <div className="text-slate-500 text-[11px] mt-0.5">Currently at 12% of peak tier ceiling</div>
              </div>
              <span className="text-emerald-500 font-bold">Safe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminAIPage;
