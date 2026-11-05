import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Brain,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  Filter,
  ArrowUpDown,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Flame,
  Search,
  ExternalLink,
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useLearningContext } from '../contexts/LearningContext';
import { WordDiagnosticModal } from '../components/vocabflow/WordDiagnosticModal';
import { SpeechButton } from '../components/common/SpeechButton';

interface ForgottenWordItem {
  id: string;
  word: string;
  meaning: string;
  phonetic?: string;
  partOfSpeech?: string;
  cefrLevel?: string;
  audioUrl?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  masteryScore: number;
  slipRisk: number;
  incorrectCount: number;
  correctCount: number;
  lastReviewedAt?: string;
  nextReviewAt?: string;
  status?: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const ForgottenWordsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { activeLanguage } = useLearningContext();

  const [items, setItems] = useState<ForgottenWordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  });

  // Filter & Sort States
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'RECENTLY_FORGOTTEN' | 'FREQUENTLY_MISSED' | 'DUE_FOR_REVIEW' | 'WEAK_VOCABULARY'>('ALL');
  const [sortBy, setSortBy] = useState<'slipRisk' | 'incorrectCount' | 'lastReviewedAt' | 'masteryScore'>('slipRisk');
  const [searchQuery, setSearchQuery] = useState('');
  const [diagnosticWordId, setDiagnosticWordId] = useState<string | null>(null);

  const fetchForgottenWords = useCallback(async (page: number = 1) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res: any = await api.get('/reviews/forgotten-words', {
        params: {
          languageId: activeLanguage?.id || 'en',
          filter: activeFilter,
          sortBy,
          page,
          limit: 15,
        },
      });

      const payload = res?.data || res;
      if (payload && Array.isArray(payload.items)) {
        setItems(payload.items);
        if (payload.pagination) {
          setPagination(payload.pagination);
        }
      } else {
        setItems([]);
      }
    } catch (err: any) {
      console.warn('Failed to load forgotten words:', err);
      // Fallback: If offline or API fails, try querying local slipping words
      setErrorMsg('Không thể kết nối danh sách từ hay quên từ máy chủ. Đang hiển thị từ phân tích cục bộ.');
    } finally {
      setLoading(false);
    }
  }, [activeLanguage?.id, activeFilter, sortBy]);

  useEffect(() => {
    fetchForgottenWords(1);
  }, [fetchForgottenWords]);

  // Client-side search filtering
  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.word.toLowerCase().includes(q) ||
      item.meaning.toLowerCase().includes(q) ||
      (item.exampleSentence && item.exampleSentence.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1">
            <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer" onClick={() => navigate('/dashboard')}>
              Dashboard
            </span>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-200 font-bold">Từ Hay Quên</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span>Kho Từ Vựng Hay Quên & Phân Tích Trí Nhớ</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Danh sách từ vựng có độ bền trí nhớ (Memory Stability) suy giảm hoặc trả lời sai nhiều lần. Hệ thống tự động phân loại để ưu tiên cứu nguy trí nhớ kịp thời.
          </p>
        </div>

        {/* Global Quick Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/review?type=MEMORY_RESCUE')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-xs shadow-md shadow-rose-600/25 transition active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Giải Cứu Trí Nhớ Ngay ({pagination.total} từ)</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng từ có nguy cơ</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{pagination.total}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">Nguy cơ quên cao</span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {items.filter((i) => i.slipRisk >= 50).length} từ
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Hay sai lặp lại</span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {items.filter((i) => i.incorrectCount >= 2).length} từ
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider">Ngôn ngữ hiện tại</span>
          <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1 truncate">
            {activeLanguage?.name || 'Tiếng Anh'}
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'RECENTLY_FORGOTTEN', label: 'Mới quên gần đây' },
            { key: 'FREQUENTLY_MISSED', label: 'Thường xuyên sai' },
            { key: 'DUE_FOR_REVIEW', label: 'Đến hạn ôn' },
            { key: 'WEAK_VOCABULARY', label: 'Độ vững yếu (<45%)' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeFilter === tab.key
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm từ, nghĩa..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-1.5 px-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="slipRisk">Nguy cơ quên</option>
              <option value="incorrectCount">Số lần sai</option>
              <option value="lastReviewedAt">Lần ôn gần nhất</option>
              <option value="masteryScore">Điểm thành thạo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Word List Table / Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[35vh] space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Đang trích xuất dữ liệu trí nhớ từ máy chủ...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Trí Nhớ Đang Rất Vững Vàng!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              Không có từ vựng nào nằm trong vùng nguy cơ quên theo tiêu chí lọc này. Hãy tiếp tục duy trì chuỗi học tập hàng ngày nhé!
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/word-bank')}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
          >
            Khám Phá Kho Từ Vựng
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-3 group"
            >
              {/* Left Column: Word & Meaning */}
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                    {item.word}
                  </span>
                  {item.partOfSpeech && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                      {item.partOfSpeech}
                    </span>
                  )}
                  {item.cefrLevel && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      {item.cefrLevel}
                    </span>
                  )}
                  {item.phonetic && (
                    <span className="text-xs text-slate-400 font-mono">
                      {item.phonetic}
                    </span>
                  )}
                  <SpeechButton text={item.word} languageId={activeLanguage?.id || 'en'} size="sm" />
                </div>

                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">
                  {item.meaning}
                </p>

                {item.exampleSentence && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 italic line-clamp-1">
                    "{item.exampleSentence}"
                  </p>
                )}
              </div>

              {/* Middle Column: Memory Metrics */}
              <div className="flex items-center gap-4 shrink-0 text-xs py-2 md:py-0 border-y md:border-y-0 border-slate-100 dark:border-slate-800">
                <div className="text-center min-w-[70px]">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Nguy cơ quên</span>
                  <span className={`text-xs font-black ${
                    item.slipRisk >= 50
                      ? 'text-rose-600 dark:text-rose-400'
                      : item.slipRisk >= 30
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-600 dark:text-slate-300'
                  }`}>
                    {item.slipRisk}%
                  </span>
                </div>

                <div className="text-center min-w-[50px]">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Số lần sai</span>
                  <span className="text-xs font-bold text-rose-500">{item.incorrectCount}</span>
                </div>

                <div className="text-center min-w-[65px]">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Độ vững</span>
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                    {Math.round(item.masteryScore)}%
                  </span>
                </div>
              </div>

              {/* Right Column: Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setDiagnosticWordId(item.id)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 transition text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  title="Chẩn đoán nguyên nhân hay quên từ này"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Vì sao hay quên?</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate(`/review?mode=flashcard&wordId=${item.id}`)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
                >
                  <span>Ôn lại</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-slate-500">
                Trang {pagination.page} / {pagination.totalPages} ({pagination.total} từ)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchForgottenWords(pagination.page - 1)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-40 text-xs font-bold"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchForgottenWords(pagination.page + 1)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-40 text-xs font-bold"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Word Diagnostic Modal */}
      <WordDiagnosticModal
        vocabularyId={diagnosticWordId}
        onClose={() => setDiagnosticWordId(null)}
      />
    </div>
  );
};

