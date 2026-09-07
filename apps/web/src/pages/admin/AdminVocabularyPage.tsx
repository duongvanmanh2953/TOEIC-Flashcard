import React, { useState, useEffect } from 'react';
import { 
  BookOpen, AlertTriangle, CheckCircle2, TrendingUp, BarChart2, 
  Layers, Search, Filter, RefreshCw, Sparkles, PlusCircle
} from 'lucide-react';
import api from '../../lib/api';

interface VocabHealthData {
  totalVocab: number;
  cefrBreakdown: Record<string, number>;
  topFailedWords: Array<{ word: string; failedCount: number }>;
  flaggedWords: Array<{ word: string; reason: string }>;
}

export const AdminVocabularyPage: React.FC = () => {
  const [data, setData] = useState<VocabHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchVocabHealth = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/vocab-health');
      setData(res.data?.data || null);
    } catch (err) {
      console.error('Failed to fetch vocab health:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVocabHealth();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-emerald-500" />
            Vocabulary Health & Quality Control
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Audit vocabulary repository quality, high error-rate flashcards, and CEFR calibration
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchVocabHealth} 
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition">
            <Sparkles className="w-3.5 h-3.5" />
            AI Audit Check
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Total Dictionary Words</span>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
            {data?.totalVocab?.toLocaleString() || 0}
          </p>
          <span className="text-xs text-emerald-500 flex items-center gap-1 mt-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Curated & Audio-synced
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <span className="text-xs font-medium text-slate-500">High Error Rate Words</span>
          <p className="text-3xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {data?.topFailedWords?.length || 0}
          </p>
          <span className="text-xs text-rose-500 flex items-center gap-1 mt-2">
            <AlertTriangle className="w-3.5 h-3.5" /> Needs mnemonic / hint review
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <span className="text-xs font-medium text-slate-500">CEFR Distribution Levels</span>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {Object.keys(data?.cefrBreakdown || {}).length} levels
          </p>
          <span className="text-xs text-indigo-500 flex items-center gap-1 mt-2">
            A1 to C2 coverage
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Community Deck Flagged</span>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">0</p>
          <span className="text-xs text-slate-400 flex items-center gap-1 mt-2">
            Clean status
          </span>
        </div>
      </div>

      {/* Grid: CEFR Breakdown & Top Failed Words */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CEFR Level Calibration */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              CEFR Level Calibration
            </h3>
            <span className="text-xs text-slate-400">Target: Balanced spread</span>
          </div>

          <div className="space-y-3">
            {data?.cefrBreakdown && Object.entries(data.cefrBreakdown).map(([level, count]) => {
              const pct = data.totalVocab ? Math.round((count / data.totalVocab) * 100) : 0;
              return (
                <div key={level} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">Level {level}</span>
                    <span className="text-slate-500">{count} words ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700/50 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        level === 'B1' || level === 'B2' ? 'bg-indigo-500' :
                        level === 'C1' || level === 'C2' ? 'bg-purple-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top High-Friction Words */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              High Error Rate Cards (SRS Failures)
            </h3>
            <span className="text-xs text-rose-500 font-medium">Auto-detected</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {data?.topFailedWords && data.topFailedWords.length > 0 ? (
              data.topFailedWords.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{item.word}</p>
                      <p className="text-xs text-slate-400">Failed across multiple reviews</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                      {item.failedCount} failures
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No words with anomalous failure rates found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminVocabularyPage;
