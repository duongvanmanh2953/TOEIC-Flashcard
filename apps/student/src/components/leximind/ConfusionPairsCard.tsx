import React, { useState, useEffect } from 'react';
import {
  Zap, Check, X, ArrowRight, HelpCircle, 
  Lightbulb, RefreshCw, Loader2, Sparkles
} from 'lucide-react';
import api from '../../lib/api';

interface ConfusionPairItem {
  id: string;
  wordA: string;
  wordB: string;
  distinctionTip: string;
  exampleA: string;
  exampleB: string;
  meaningA: string;
  meaningB: string;
  userConfusionCount?: number;
}

export const ConfusionPairsCard: React.FC = () => {
  const [pairs, setPairs] = useState<ConfusionPairItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPair, setSelectedPair] = useState<ConfusionPairItem | null>(null);

  const fetchConfusionPairs = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/vocabulary/confusion-pairs');
      const data = res?.data || res;
      const list = data?.items || (Array.isArray(data) ? data : []);
      setPairs(list);
      if (list.length > 0) setSelectedPair(list[0]);
    } catch (err) {
      console.warn('Failed to load confusion pairs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfusionPairs();
  }, []);

  if (loading) {
    return (
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    );
  }

  if (pairs.length === 0) return null;

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Động Cơ Phân Biệt Từ Dễ Nhầm (Confusion Engine)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                {pairs.length} Cặp từ
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Nhận diện và hóa giải các cặp từ vựng hay gây nhầm lẫn nhất trong bài thi TOEIC & giao tiếp
            </p>
          </div>
        </div>

        <button
          onClick={fetchConfusionPairs}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Selected Pair Comparison Box */}
      {selectedPair && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Word A */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                  {selectedPair.wordA}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  Từ A
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {selectedPair.meaningA}
              </p>
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-slate-600 dark:text-slate-300 italic">
                "{selectedPair.exampleA}"
              </div>
            </div>

            {/* Word B */}
            <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-base font-extrabold text-purple-600 dark:text-purple-400">
                  {selectedPair.wordB}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  Từ B
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {selectedPair.meaningB}
              </p>
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-purple-100 dark:border-purple-900/40 text-[11px] text-slate-600 dark:text-slate-300 italic">
                "{selectedPair.exampleB}"
              </div>
            </div>
          </div>

          {/* Distinction Tip */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <div>
              <strong className="font-bold">Mẹo ghi nhớ khác biệt:</strong>{' '}
              {selectedPair.distinctionTip}
            </div>
          </div>
        </div>
      )}

      {/* Pair Selector Chips */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs pt-1">
        {pairs.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPair(p)}
            className={`px-3 py-1.5 rounded-xl transition text-xs font-bold shrink-0 ${
              selectedPair?.id === p.id
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {p.wordA} vs {p.wordB}
          </button>
        ))}
      </div>
    </div>
  );
};
