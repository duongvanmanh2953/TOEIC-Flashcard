import React, { useState, useEffect } from 'react';
import {
  Clock, Zap, Target, BookOpen, PenTool, 
  RotateCcw, Sparkles, ChevronRight, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

interface QueueItem {
  id: string;
  word: string;
  meaningVi: string;
  cefrLevel: string;
  category: 'DUE' | 'CONTEXT_WEAK' | 'PRODUCTION_WEAK' | 'FORGOTTEN';
  recommendedMode: string;
}

export const SmartQueueBar: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'ALL' | 'DUE' | 'CONTEXT' | 'PRODUCTION' | 'FORGOTTEN'>('ALL');
  const [sessionMinutes, setSessionMinutes] = useState<3 | 5 | 10>(5);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/vocabulary/smart-queue', {
        params: { filter, minutes: sessionMinutes },
      });
      const data = res?.data || res;
      setQueue(data?.items || []);
    } catch (err) {
      console.warn('Failed to load smart queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [filter, sessionMinutes]);

  const handleStartSmartReview = () => {
    navigate(`/review?mode=SMART&filter=${filter}&duration=${sessionMinutes}`);
  };

  return (
    <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/30 text-white shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Hàng Đợi Trí Nhớ Thông Minh (Smart Review Queue)</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-indigo-500/30 text-indigo-300">
                FSRS AI
              </span>
            </h4>
            <p className="text-[11px] text-slate-300">
              Lọc theo điểm yếu nhận thức & chế độ học siêu ngắn (Micro-learning)
            </p>
          </div>
        </div>

        {/* Micro-learning Presets */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800 text-xs font-semibold self-start sm:self-auto">
          <span className="text-[10px] text-slate-400 px-2 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Thời gian:
          </span>
          {([3, 5, 10] as const).map((mins) => (
            <button
              key={mins}
              onClick={() => setSessionMinutes(mins)}
              className={`px-2.5 py-1 rounded-lg transition text-xs font-bold ${
                sessionMinutes === mins
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs">
        {[
          { key: 'ALL', label: 'Tất cả từ cần học' },
          { key: 'DUE', label: 'Tới hạn ôn (SRS Due)' },
          { key: 'CONTEXT', label: 'Yếu ngữ cảnh câu' },
          { key: 'PRODUCTION', label: 'Yếu tạo câu (Active)' },
          { key: 'FORGOTTEN', label: 'Vừa bị quên' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={`px-3 py-1 rounded-xl transition text-[11px] font-semibold shrink-0 ${
              filter === f.key
                ? 'bg-white text-slate-900 font-bold'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Summary and Action */}
      <div className="flex items-center justify-between pt-1">
        <div className="text-xs text-slate-300">
          {loading ? (
            <span className="flex items-center gap-1.5 text-indigo-300">
              <Loader2 className="w-3 h-3 animate-spin" /> Đang tối ưu hàng đợi học...
            </span>
          ) : (
            <span>
              Đã tuyển chọn <strong>{queue.length}</strong> từ vựng phù hợp cho phiên <strong>{sessionMinutes} phút</strong>.
            </span>
          )}
        </div>

        <button
          onClick={handleStartSmartReview}
          disabled={loading || queue.length === 0}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-indigo-900/30"
        >
          <span>Bắt đầu ôn {sessionMinutes}m</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
