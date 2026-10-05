import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Plus,
  Loader2,
  X,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Check,
  Search,
  RefreshCw,
  FolderPlus,
  Info,
} from 'lucide-react';
import api from '../../lib/api';
import { ModalPortal } from '../common/ModalPortal';
import { SUPPORTED_LANGUAGES } from '../../config/languages';
import { CountryFlag } from '../language/CountryFlag';

export interface AdminMergeDecksModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceDeckIds: string[];
  sourceDecks: Array<{
    id: string;
    title: string;
    languageId?: string;
    cefrLevel?: string;
    wordCount?: number;
    authorName?: string;
  }>;
  onSuccess: (targetTitle: string, addedCount: number, skippedCount: number) => void;
}

interface DuplicateItem {
  id: string;
  word: string;
  phonetic?: string | null;
  meaning: string;
  partOfSpeech?: string | null;
  sourceDeckId: string;
  sourceDeckTitle: string;
  reason: 'ALREADY_IN_TARGET' | 'DUPLICATE_IN_SOURCES';
  conflictWith: string;
}

export const AdminMergeDecksModal: React.FC<AdminMergeDecksModalProps> = ({
  isOpen,
  onClose,
  sourceDeckIds,
  sourceDecks,
  onSuccess,
}) => {
  const [targetMode, setTargetMode] = useState<'existing' | 'new'>('existing');
  const [officialDecks, setOfficialDecks] = useState<any[]>([]);
  const [loadingOfficial, setLoadingOfficial] = useState(false);
  const [selectedTargetDeckId, setSelectedTargetDeckId] = useState<string>('');

  // Form create new admin system deck
  const firstSource = sourceDecks[0];
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newCefr, setNewCefr] = useState('B1');
  const [newLanguageId, setNewLanguageId] = useState(firstSource?.languageId || 'en');

  // Duplicate analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{
    totalSourceWords: number;
    duplicateCount: number;
    duplicates: DuplicateItem[];
    validWordsCount: number;
    validWords: any[];
    targetDeck?: any;
  } | null>(null);

  // Set of duplicate word IDs that admin chose to eliminate / remove
  const [excludedDuplicateIds, setExcludedDuplicateIds] = useState<Set<string>>(new Set());
  const [duplicateSearch, setDuplicateSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'duplicates' | 'valid'>('duplicates');
  const [merging, setMerging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Set default title for new deck when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (sourceDecks.length === 1) {
        setNewTitle(`[Hệ thống] ${sourceDecks[0].title}`);
      } else {
        setNewTitle(`[Tổng hợp Hệ thống] Bộ từ vựng ${sourceDecks.length} kho từ vựng`);
      }
      setNewLanguageId(sourceDecks[0]?.languageId || 'en');
      fetchOfficialDecks();
    }
  }, [isOpen, sourceDeckIds]);

  const fetchOfficialDecks = async () => {
    setLoadingOfficial(true);
    try {
      const res: any = await api.get('/admin/shared-vocabulary/official-targets');
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setOfficialDecks(list);
      if (list.length > 0) {
        // Prefer a deck matching the language of sources
        const match = list.find((d: any) => d.languageId === (sourceDecks[0]?.languageId || 'en'));
        setSelectedTargetDeckId(match ? match.id : list[0].id);
      } else {
        setTargetMode('new');
      }
    } catch (err) {
      console.error('Failed to load official decks:', err);
    } finally {
      setLoadingOfficial(false);
    }
  };

  // Run duplicate analysis whenever target changes
  const runDuplicateAnalysis = async () => {
    if (!sourceDeckIds || sourceDeckIds.length === 0) return;
    setAnalyzing(true);
    setErrorMsg(null);
    try {
      const targetId = targetMode === 'existing' ? selectedTargetDeckId : undefined;
      const res: any = await api.post('/admin/shared-vocabulary/check-merge-duplicates', {
        sourceDeckIds,
        targetDeckId: targetId || undefined,
      });
      const data = res?.data || res;
      setAnalysis(data);

      // By default: automatically exclude ALL duplicates so no duplicate enters the system
      const allDupIds = new Set<string>((data.duplicates || []).map((d: DuplicateItem) => d.id));
      setExcludedDuplicateIds(allDupIds);

      if (data.duplicateCount > 0) {
        setActiveTab('duplicates');
      } else {
        setActiveTab('valid');
      }
    } catch (err: any) {
      console.error('Check duplicates error:', err);
      setErrorMsg(err?.response?.data?.message || 'Không thể kiểm tra trùng lặp từ vựng.');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (isOpen && sourceDeckIds.length > 0) {
      runDuplicateAnalysis();
    }
  }, [isOpen, targetMode, selectedTargetDeckId]);

  const toggleExcludeDuplicate = (dupId: string) => {
    setExcludedDuplicateIds((prev) => {
      const next = new Set(prev);
      if (next.has(dupId)) {
        next.delete(dupId);
      } else {
        next.add(dupId);
      }
      return next;
    });
  };

  const excludeAllDuplicates = () => {
    if (!analysis) return;
    const allIds = new Set(analysis.duplicates.map((d) => d.id));
    setExcludedDuplicateIds(allIds);
  };

  const restoreAllDuplicates = () => {
    setExcludedDuplicateIds(new Set());
  };

  // Filtered duplicates for search
  const filteredDuplicates = useMemo(() => {
    if (!analysis?.duplicates) return [];
    const q = duplicateSearch.toLowerCase().trim();
    if (!q) return analysis.duplicates;
    return analysis.duplicates.filter(
      (d) =>
        d.word.toLowerCase().includes(q) ||
        (d.meaning && d.meaning.toLowerCase().includes(q)) ||
        (d.sourceDeckTitle && d.sourceDeckTitle.toLowerCase().includes(q)),
    );
  }, [analysis?.duplicates, duplicateSearch]);

  const handleConfirmMerge = async () => {
    if (targetMode === 'new' && !newTitle.trim()) {
      setErrorMsg('Vui lòng nhập tên cho kho hệ thống mới!');
      return;
    }
    if (targetMode === 'existing' && !selectedTargetDeckId) {
      setErrorMsg('Vui lòng chọn một kho hệ thống đích!');
      return;
    }

    setMerging(true);
    setErrorMsg(null);
    try {
      const payload: any = {
        sourceDeckIds,
        createNewDeck: targetMode === 'new',
        targetDeckId: targetMode === 'existing' ? selectedTargetDeckId : undefined,
        newDeckData:
          targetMode === 'new'
            ? {
                title: newTitle.trim(),
                description: newDesc.trim() || undefined,
                category: newCategory,
                cefrLevel: newCefr,
                languageId: newLanguageId,
              }
            : undefined,
        excludedWordIds: Array.from(excludedDuplicateIds),
      };

      const res: any = await api.post('/admin/shared-vocabulary/merge-into-system-deck', payload);
      const data = res?.data || res;

      onSuccess(
        data.targetDeck?.title || newTitle.trim() || 'Kho hệ thống',
        data.addedCount || 0,
        data.skippedCount || 0,
      );
      onClose();
    } catch (err: any) {
      console.error('Merge error:', err);
      setErrorMsg(err?.response?.data?.message || 'Có lỗi xảy ra khi đẩy từ vào kho hệ thống.');
    } finally {
      setMerging(false);
    }
  };

  if (!isOpen) return null;

  const totalSourceCount = analysis?.totalSourceWords || 0;
  const duplicateCount = analysis?.duplicateCount || 0;
  const eliminatedCount = excludedDuplicateIds.size;
  const validWordsToImport = Math.max(0, (analysis?.validWordsCount || 0) + (duplicateCount - eliminatedCount));

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
        <div
          className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* MODAL HEADER */}
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-950/90 via-slate-900 to-purple-950/90 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-inner">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-white">
                    Đẩy & Clone Từ Vựng Vào Kho Hệ Thống (Kho Admin)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {sourceDeckIds.length} kho nguồn
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Kiểm tra và tự động loại bỏ từ trùng lặp trước khi clone vào kho chính của Admin
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* EXPLANATORY NOTICE */}
          <div className="px-6 py-2.5 bg-indigo-950/40 border-b border-indigo-900/40 flex items-start gap-2.5 text-xs text-indigo-200">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong>Quy trình Clone an toàn:</strong> Các từ vựng sẽ được nhân bản độc lập vào kho hệ thống của Admin. Kho gốc của học viên vẫn được giữ nguyên bản. Sau khi clone, kho đích thuộc toàn quyền sở hữu của Admin để thêm bớt và chỉnh sửa từ điển.
            </div>
          </div>

          {/* SCROLLABLE BODY */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* STEP 1: CHOOSE TARGET SYSTEM DECK */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-black">
                    1
                  </span>
                  <span>Chọn Kho Hệ Thống Đích Của Admin</span>
                </label>

                {/* Target Mode Toggle */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setTargetMode('existing')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      targetMode === 'existing'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Kho có sẵn ({officialDecks.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMode('new')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      targetMode === 'new'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>Tạo kho mới</span>
                  </button>
                </div>
              </div>

              {/* Mode: Existing Deck Selection */}
              {targetMode === 'existing' ? (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400">
                    Chọn kho chính / Kho hệ thống nhận từ:
                  </label>
                  {loadingOfficial ? (
                    <div className="flex items-center gap-2 py-3 text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>Đang tải danh sách kho hệ thống...</span>
                    </div>
                  ) : officialDecks.length === 0 ? (
                    <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-900/60 text-amber-300 text-xs">
                      Chưa có kho hệ thống nào sẵn sàng. Vui lòng chuyển sang tab <strong>"Tạo kho mới"</strong> bên trên.
                    </div>
                  ) : (
                    <select
                      value={selectedTargetDeckId}
                      onChange={(e) => setSelectedTargetDeckId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-hidden focus:border-indigo-500"
                    >
                      {officialDecks.map((d) => (
                        <option key={d.id} value={d.id}>
                          ⭐ {d.title} ({d._count?.words || 0} từ) • {d.category} • Ngôn ngữ: {d.languageId?.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                /* Mode: Create New System Deck Form */
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Tên kho hệ thống mới <span className="text-rose-400">*</span>:
                      </label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Nhập tên kho từ vựng..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-indigo-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Không gian ngôn ngữ:
                      </label>
                      <select
                        value={newLanguageId}
                        onChange={(e) => setNewLanguageId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-indigo-500 font-medium"
                      >
                        {SUPPORTED_LANGUAGES.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name} ({l.nativeName})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Cấp độ CEFR:
                      </label>
                      <select
                        value={newCefr}
                        onChange={(e) => setNewCefr(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-indigo-500 font-medium"
                      >
                        {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                          <option key={lvl} value={lvl}>
                            Cấp độ {lvl}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: DUPLICATE ANALYSIS & RECONCILIATION */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-black">
                    2
                  </span>
                  <span>Kiểm Tra & Loại Bỏ Từ Vựng Trùng Lặp</span>
                </label>

                <button
                  type="button"
                  onClick={runDuplicateAnalysis}
                  disabled={analyzing}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition"
                >
                  <RefreshCw className={`w-3 h-3 ${analyzing ? 'animate-spin text-indigo-400' : ''}`} />
                  <span>Quét lại</span>
                </button>
              </div>

              {/* Statistical KPI Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Tổng từ quét được
                  </span>
                  <div className="text-xl font-extrabold text-white mt-1">
                    {analyzing ? <Loader2 className="w-5 h-5 animate-spin text-indigo-400" /> : totalSourceCount}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5">từ {sourceDeckIds.length} kho nguồn</span>
                </div>

                <div
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                    duplicateCount > 0
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    {duplicateCount > 0 && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                    <span>Từ bị trùng lặp</span>
                  </span>
                  <div className="text-xl font-extrabold text-amber-400 mt-1">
                    {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : duplicateCount}
                  </div>
                  <span className="text-[10px] text-amber-300/80 mt-0.5">
                    {eliminatedCount > 0 ? `Đã loại bỏ ${eliminatedCount} từ` : 'Cần kiểm tra'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Sẽ thêm vào kho</span>
                  </span>
                  <div className="text-xl font-extrabold text-emerald-400 mt-1">
                    {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : validWordsToImport}
                  </div>
                  <span className="text-[10px] text-emerald-300/80 mt-0.5">từ vựng sạch duy nhất</span>
                </div>
              </div>

              {/* DUPLICATE / VALID WORDS TABS */}
              {analysis && (
                <div className="space-y-3 mt-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('duplicates')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          activeTab === 'duplicates'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Từ trùng lặp ({duplicateCount})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('valid')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          activeTab === 'valid'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Từ hợp lệ ({analysis.validWordsCount})</span>
                      </button>
                    </div>

                    {activeTab === 'duplicates' && duplicateCount > 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={excludeAllDuplicates}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                          title="Loại bỏ toàn bộ các từ trùng ra khỏi đợt clone này"
                        >
                          <Trash2 className="w-3 h-3 text-rose-400" />
                          <span>Loại bỏ tất cả từ trùng ({duplicateCount})</span>
                        </button>
                        <button
                          type="button"
                          onClick={restoreAllDuplicates}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold cursor-pointer transition"
                        >
                          Khôi phục tất cả
                        </button>
                      </div>
                    )}
                  </div>

                  {/* TAB 1: DUPLICATE WORDS LIST */}
                  {activeTab === 'duplicates' && (
                    <div className="space-y-2">
                      {duplicateCount === 0 ? (
                        <div className="p-6 text-center rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300">
                          <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
                          <p className="font-bold">Không phát hiện từ vựng nào bị trùng lặp!</p>
                          <p className="text-[11px] text-emerald-400/80 mt-0.5">
                            Tất cả {analysis.validWordsCount} từ từ các kho nguồn đều sẵn sàng được clone vào kho hệ thống.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                              type="text"
                              value={duplicateSearch}
                              onChange={(e) => setDuplicateSearch(e.target.value)}
                              placeholder="Tìm từ bị trùng theo từ vựng hoặc nghĩa..."
                              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
                            />
                          </div>

                          <div className="overflow-x-auto rounded-2xl border border-slate-800 max-h-56">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase font-bold sticky top-0 border-b border-slate-800">
                                <tr>
                                  <th className="py-2.5 px-3">Từ vựng</th>
                                  <th className="py-2.5 px-3">Nghĩa tiếng Việt</th>
                                  <th className="py-2.5 px-3">Kho nguồn</th>
                                  <th className="py-2.5 px-3">Lý do trùng</th>
                                  <th className="py-2.5 px-3 text-right">Trạng thái</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800 font-medium">
                                {filteredDuplicates.map((dup) => {
                                  const isExcluded = excludedDuplicateIds.has(dup.id);
                                  return (
                                    <tr
                                      key={dup.id}
                                      className={`hover:bg-slate-800/40 transition ${
                                        isExcluded ? 'opacity-60 bg-rose-950/10' : ''
                                      }`}
                                    >
                                      <td className="py-2 px-3 font-bold text-white">
                                        <div className="flex items-center gap-1.5">
                                          <span>{dup.word}</span>
                                          {dup.phonetic && (
                                            <span className="text-[10px] text-slate-400 font-normal">
                                              /{dup.phonetic}/
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-2 px-3 text-slate-300 max-w-xs truncate">
                                        {dup.meaning}
                                      </td>
                                      <td className="py-2 px-3 text-slate-400 text-[11px] max-w-[140px] truncate">
                                        {dup.sourceDeckTitle}
                                      </td>
                                      <td className="py-2 px-3">
                                        {dup.reason === 'ALREADY_IN_TARGET' ? (
                                          <span className="px-2 py-0.5 rounded-md bg-rose-950/60 text-rose-300 border border-rose-800/60 text-[10px] font-bold">
                                            Đã có trong kho đích
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-300 border border-amber-800/60 text-[10px] font-bold">
                                            Trùng với: {dup.conflictWith}
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3 text-right whitespace-nowrap">
                                        <button
                                          type="button"
                                          onClick={() => toggleExcludeDuplicate(dup.id)}
                                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                            isExcluded
                                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                                          }`}
                                        >
                                          {isExcluded ? '✓ Đã loại bỏ' : 'Giữ lại'}
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* TAB 2: VALID WORDS PREVIEW */}
                  {activeTab === 'valid' && (
                    <div className="overflow-x-auto rounded-2xl border border-slate-800 max-h-56">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase font-bold sticky top-0 border-b border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3">Từ vựng</th>
                            <th className="py-2.5 px-3">Nghĩa tiếng Việt</th>
                            <th className="py-2.5 px-3">Từ loại</th>
                            <th className="py-2.5 px-3">Kho nguồn</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 font-medium text-slate-300">
                          {analysis.validWords.map((w: any, idx: number) => (
                            <tr key={w.id || idx} className="hover:bg-slate-800/40 transition">
                              <td className="py-2 px-3 font-bold text-white">
                                {w.word}{' '}
                                {w.phonetic && (
                                  <span className="text-[10px] text-slate-400 font-normal">/{w.phonetic}/</span>
                                )}
                              </td>
                              <td className="py-2 px-3 max-w-sm truncate">{w.meaning}</td>
                              <td className="py-2 px-3 text-slate-400 text-[11px]">{w.partOfSpeech || 'n.'}</td>
                              <td className="py-2 px-3 text-slate-400 text-[11px] truncate max-w-[150px]">
                                {w.sourceDeckTitle}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* MODAL FOOTER */}
          <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-400">
              Sẽ clone <strong className="text-emerald-400 font-bold">{validWordsToImport}</strong> từ vựng vào kho hệ thống
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={merging}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirmMerge}
                disabled={merging || analyzing || validWordsToImport === 0}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {merging ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang clone vào kho hệ thống...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Xác nhận đẩy vào kho hệ thống ({validWordsToImport} từ)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
