import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Volume2,
  Check,
  X,
  Layers,
  FileText,
  Sliders,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import api, { extractApiList } from '../../lib/api';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { useI18n } from '../../i18n';

interface VocabularyItem {
  id: string;
  word: string;
  normalizedWord: string;
  definition: string;
  shortDefinition?: string;
  phonetic?: string;
  pronunciation?: string;
  partOfSpeech?: string;
  difficulty: number;
  cefrLevel: string;
  frequencyRank?: number;
  imageUrl?: string;
  audioUrl?: string;
  examples?: Array<{ sentence: string; translation?: string }>;
  qualityScore?: number;
  qualityFlags?: string[];
  createdAt: string;
  updatedAt: string;
}

export const AdminVocabularyPage: React.FC = () => {
  const { t } = useI18n();

  // Table Data State
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cefrFilter, setCefrFilter] = useState('ALL');
  const [posFilter, setPosFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Modals State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<VocabularyItem> | null>(null);
  const [modalSaving, setModalSaving] = useState(false);

  // Batch Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importValidation, setImportValidation] = useState<{
    validItems: any[];
    duplicateCount: number;
    invalidCount: number;
  } | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  // Feedback Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchVocabulary = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/vocabulary', {
        params: {
          page,
          limit: 15,
          search: search.trim() || undefined,
          cefrLevel: cefrFilter !== 'ALL' ? cefrFilter : undefined,
          cefr: cefrFilter !== 'ALL' ? cefrFilter : undefined,
          partOfSpeech: posFilter !== 'ALL' ? posFilter : undefined,
        },
      });

      const raw = res?.data?.data || res?.data || res;
      const list = Array.isArray(raw?.items) ? raw.items : Array.isArray(raw) ? raw : [];
      const total = raw?.total || list.length;
      const pages = raw?.totalPages || Math.ceil(total / 15) || 1;

      // Calculate Quality Scores & Flags
      const enhanced = list.map((item: any) => {
        let score = 40;
        const flags: string[] = [];

        if (item.definition && item.definition.length > 5) score += 25;
        else flags.push('Thiếu định nghĩa');

        if (item.phonetic) score += 15;
        else flags.push('Thiếu IPA');

        if (item.examples && item.examples.length > 0) score += 20;
        else flags.push('Thiếu ví dụ');

        return {
          ...item,
          qualityScore: Math.min(100, score),
          qualityFlags: flags,
        };
      });

      setItems(enhanced);
      setTotalCount(total);
      setTotalPages(pages);
    } catch (err) {
      console.error('Failed to load vocabulary list:', err);
      showToast('error', 'Không thể tải danh sách từ vựng.');
    } finally {
      setLoading(false);
    }
  }, [page, search, cefrFilter, posFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVocabulary();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchVocabulary]);

  // Bulk selection toggles
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(items.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleBulkAction = async (action: string, value?: any) => {
    if (selectedIds.length === 0) return;
    setBulkActionLoading(true);
    try {
      await api.post('/vocabulary/admin/bulk', {
        ids: selectedIds,
        action,
        value,
      });
      showToast('success', `Đã thực hiện thao tác trên ${selectedIds.length} mục từ.`);
      setSelectedIds([]);
      fetchVocabulary();
    } catch (err: any) {
      console.error('Bulk action error:', err);
      showToast('error', err?.response?.data?.message || 'Có lỗi khi thao tác hàng loạt.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Create / Update Save
  const handleSaveItem = async () => {
    if (!editingItem?.word || !editingItem?.definition) {
      showToast('error', 'Vui lòng nhập từ vựng và định nghĩa.');
      return;
    }

    setModalSaving(true);
    try {
      if (editingItem.id) {
        await api.patch(`/vocabulary/admin/${editingItem.id}`, editingItem);
        showToast('success', `Đã cập nhật từ vựng "${editingItem.word}"!`);
      } else {
        await api.post('/vocabulary/admin', editingItem);
        showToast('success', `Đã thêm từ vựng mới "${editingItem.word}"!`);
      }
      setShowEditModal(false);
      setEditingItem(null);
      fetchVocabulary();
    } catch (err: any) {
      console.error('Save error:', err);
      showToast('error', err?.response?.data?.message || 'Không thể lưu từ vựng.');
    } finally {
      setModalSaving(false);
    }
  };

  // Delete Single Item
  const handleDeleteItem = async (id: string, word: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa từ vựng "${word}"?`)) return;
    try {
      await api.delete(`/vocabulary/admin/${id}`);
      showToast('success', `Đã xóa từ vựng "${word}".`);
      fetchVocabulary();
    } catch (err: any) {
      console.error('Delete error:', err);
      showToast('error', err?.response?.data?.message || 'Không thể xóa từ vựng.');
    }
  };

  // Batch Import Parsing & Validation Engine
  const handleValidateImport = () => {
    if (!importText.trim()) return;

    let rows: any[] = [];
    try {
      // Try JSON first
      if (importText.trim().startsWith('[') || importText.trim().startsWith('{')) {
        const parsed = JSON.parse(importText.trim());
        rows = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        // Parse CSV format: word,partOfSpeech,cefr,definition,phonetic
        const lines = importText.trim().split('\n');
        rows = lines.map((line) => {
          const parts = line.split(',').map((p) => p.trim());
          return {
            word: parts[0] || '',
            partOfSpeech: parts[1] || 'n.',
            cefrLevel: parts[2] || 'B1',
            definition: parts[3] || '',
            phonetic: parts[4] || '',
          };
        });
      }
    } catch (err) {
      showToast('error', 'Định dạng dữ liệu không hợp lệ. Vui lòng kiểm tra CSV hoặc JSON.');
      return;
    }

    const validItems: any[] = [];
    let duplicateCount = 0;
    let invalidCount = 0;
    const seenWords = new Set<string>();

    rows.forEach((r) => {
      const w = (r.word || '').trim();
      if (!w || !r.definition) {
        invalidCount++;
      } else if (seenWords.has(w.toLowerCase())) {
        duplicateCount++;
      } else {
        seenWords.add(w.toLowerCase());
        validItems.push({
          word: w,
          partOfSpeech: r.partOfSpeech || 'n.',
          cefrLevel: r.cefrLevel || 'B1',
          definition: r.definition,
          phonetic: r.phonetic || '',
          difficulty: 3.0,
        });
      }
    });

    setImportValidation({
      validItems,
      duplicateCount,
      invalidCount,
    });
  };

  const handleExecuteImport = async () => {
    if (!importValidation || importValidation.validItems.length === 0) return;
    setImportLoading(true);
    try {
      const res: any = await api.post('/vocabulary/admin/import', {
        items: importValidation.validItems,
      });
      showToast(
        'success',
        res?.data?.message || `Đã nạp thành công ${importValidation.validItems.length} từ vựng!`,
      );
      setShowImportModal(false);
      setImportText('');
      setImportValidation(null);
      fetchVocabulary();
    } catch (err: any) {
      console.error('Import error:', err);
      showToast('error', err?.response?.data?.message || 'Có lỗi khi nạp dữ liệu.');
    } finally {
      setImportLoading(false);
    }
  };

  // Filter Options
  const cefrOptions = [
    { value: 'ALL', label: 'Tất cả cấp độ CEFR' },
    { value: 'A1', label: 'A1 • Sơ cấp 1' },
    { value: 'A2', label: 'A2 • Sơ cấp 2' },
    { value: 'B1', label: 'B1 • Trung cấp 1' },
    { value: 'B2', label: 'B2 • Trung cấp 2' },
    { value: 'C1', label: 'C1 • Nâng cao 1' },
    { value: 'C2', label: 'C2 • Nâng cao 2' },
  ];

  const posOptions = [
    { value: 'ALL', label: 'Tất cả loại từ (POS)' },
    { value: 'noun', label: 'Danh từ (Noun)' },
    { value: 'verb', label: 'Động từ (Verb)' },
    { value: 'adjective', label: 'Tính từ (Adjective)' },
    { value: 'adverb', label: 'Trạng từ (Adverb)' },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl backdrop-blur-xl border shadow-xl flex items-center gap-3 transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
              : 'bg-rose-950/90 text-rose-300 border-rose-500/40'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Quản Trị Từ Vựng Hệ Thống (Vocabulary Master Bank)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quản lý toàn bộ {totalCount.toLocaleString()} từ vựng chuẩn hóa, kiểm soát Quality Score và nạp dữ liệu hàng loạt.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setImportText('');
              setImportValidation(null);
              setShowImportModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700/60 transition shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Nạp CSV / JSON</span>
          </button>

          <button
            onClick={() => {
              setEditingItem({
                word: '',
                partOfSpeech: 'noun',
                cefrLevel: 'B1',
                difficulty: 3.0,
                definition: '',
                phonetic: '',
              });
              setShowEditModal(true);
            }}
            className="btn-glass-primary !py-2 !px-4 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Từ Mới</span>
          </button>
        </div>
      </div>

      {/* Search & Custom Filter Bar (0 native select) */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 glass-card p-4 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 rounded-2xl shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm từ vựng, định nghĩa hoặc phiên âm IPA..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect
            value={cefrFilter}
            onChange={setCefrFilter}
            options={cefrOptions}
            className="w-48"
          />

          <FilterSelect
            value={posFilter}
            onChange={setPosFilter}
            options={posOptions}
            className="w-48"
          />

          <button
            onClick={fetchVocabulary}
            title="Tải lại dữ liệu"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Bulk Action Sticky Bar (Appears when rows selected) */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shadow-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center">
              {selectedIds.length}
            </span>
            <span className="text-xs font-semibold text-indigo-200">mục từ đã được chọn</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction('ASSIGN_CEFR', 'B2')}
              disabled={bulkActionLoading}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
            >
              Gán CEFR: B2
            </button>
            <button
              onClick={() => handleBulkAction('DELETE')}
              disabled={bulkActionLoading}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa Hàng Loạt</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Vocabulary Table */}
      <div className="glass-card bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Đang tải kho từ vựng...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-500">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-300">Không tìm thấy từ vựng</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Không có từ vựng nào khớp với từ khóa tìm kiếm hoặc bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full min-w-[700px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/40 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === items.length && items.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded-sm border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                    />
                  </th>
                  <th className="py-3.5 px-4">Từ Vựng & Phiên Âm</th>
                  <th className="py-3.5 px-4">Định Nghĩa</th>
                  <th className="py-3.5 px-4">CEFR / POS</th>
                  <th className="py-3.5 px-4">Độ Khó</th>
                  <th className="py-3.5 px-4">Chất Lượng (Quality)</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {items.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const score = item.qualityScore || 0;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-800/40 transition ${
                        isSelected ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(item.id)}
                          className="rounded-sm border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-white text-sm flex items-center gap-1.5">
                          <span>{item.word}</span>
                          {item.audioUrl && (
                            <Volume2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          )}
                        </div>
                        {item.phonetic && (
                          <span className="text-[11px] text-slate-500 tabular-nums">
                            /{item.phonetic}/
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-200 line-clamp-1">{item.definition}</p>
                        {item.shortDefinition && (
                          <p className="text-[10px] text-slate-500 line-clamp-1">
                            {item.shortDefinition}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                            {item.cefrLevel}
                          </span>
                          <span className="text-[10px] tabular-nums text-slate-400">
                            {item.partOfSpeech || 'n.'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-300">
                          {item.difficulty?.toFixed(1) || '3.0'} / 5.0
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${
                                score >= 80
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : score >= 60
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {score}%
                            </span>
                            <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full ${
                                  score >= 80
                                    ? 'bg-emerald-500'
                                    : score >= 60
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${score}%` }}
                              />
                            </div>
                          </div>
                          {item.qualityFlags && item.qualityFlags.length > 0 && (
                            <p className="text-[9px] text-amber-400/80">
                              ⚠️ {item.qualityFlags.join(', ')}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setShowEditModal(true);
                            }}
                            title="Chỉnh sửa từ"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id, item.word)}
                            title="Xóa từ"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <span>
            Hiển thị trang <strong className="text-white">{page}</strong> trên{' '}
            <strong className="text-white">{totalPages}</strong> ({totalCount.toLocaleString()} từ)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Trước</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition flex items-center gap-1"
            >
              <span>Sau</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create / Edit Vocabulary Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingItem.id ? `Chỉnh Sửa Từ Vựng: ${editingItem.word}` : 'Thêm Từ Vựng Mới'}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Từ tiếng Anh (Word) *</label>
                <input
                  type="text"
                  value={editingItem.word || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, word: e.target.value })}
                  placeholder="e.g. Accomplish"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-bold focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Phiên âm IPA</label>
                <input
                  type="text"
                  value={editingItem.phonetic || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, phonetic: e.target.value })}
                  placeholder="e.g. /əˈkʌm.plɪʃ/"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 tabular-nums focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Cấp độ CEFR</label>
                <FilterSelect
                  value={editingItem.cefrLevel || 'B1'}
                  onChange={(val) => setEditingItem({ ...editingItem, cefrLevel: val })}
                  options={[
                    { value: 'A1', label: 'A1' },
                    { value: 'A2', label: 'A2' },
                    { value: 'B1', label: 'B1' },
                    { value: 'B2', label: 'B2' },
                    { value: 'C1', label: 'C1' },
                    { value: 'C2', label: 'C2' },
                  ]}
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Loại từ (Part of Speech)</label>
                <FilterSelect
                  value={editingItem.partOfSpeech || 'noun'}
                  onChange={(val) => setEditingItem({ ...editingItem, partOfSpeech: val })}
                  options={[
                    { value: 'noun', label: 'Danh từ (n.)' },
                    { value: 'verb', label: 'Động từ (v.)' },
                    { value: 'adjective', label: 'Tính từ (adj.)' },
                    { value: 'adverb', label: 'Trạng từ (adv.)' },
                    { value: 'phrase', label: 'Cụm từ (phrase)' },
                  ]}
                  className="w-full"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-slate-400 font-medium">Định nghĩa tiếng Việt *</label>
                <textarea
                  rows={2}
                  value={editingItem.definition || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, definition: e.target.value })}
                  placeholder="Nghĩa tiếng Việt rõ ràng, chính xác..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-slate-400 font-medium">Định nghĩa ngắn (Short Def)</label>
                <input
                  type="text"
                  value={editingItem.shortDefinition || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, shortDefinition: e.target.value })
                  }
                  placeholder="Tóm tắt ngắn gọn trong 1 cụm từ..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveItem}
                disabled={modalSaving}
                className="btn-glass-primary !py-2 !px-5 text-xs font-bold shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {modalSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Import Modal with Pre-Validation Preview */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Nạp Từ Vựng Hàng Loạt (Batch Import)</h3>
                <p className="text-xs text-slate-400">
                  Hỗ trợ định dạng CSV (word,partOfSpeech,cefr,definition,phonetic) hoặc mảng JSON.
                </p>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <textarea
                rows={6}
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  setImportValidation(null);
                }}
                placeholder={`Ví dụ định dạng CSV:\nnegotiate,verb,B2,thương lượng đàm phán,/nəˈɡoʊ.ʃi.eɪt/\nstrategy,noun,B1,chiến lược,/ˈstræt.ə.dʒi/`}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 tabular-nums text-[11px] focus:border-indigo-500 focus:outline-hidden"
              />

              <div className="flex items-center justify-between">
                <button
                  onClick={handleValidateImport}
                  disabled={!importText.trim()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition disabled:opacity-40"
                >
                  Kiểm Tra & Phân Tích Dữ Liệu (Validate Preview)
                </button>

                {importValidation && (
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-[11px] border border-emerald-500/30">
                      Hợp lệ: {importValidation.validItems.length}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-[11px] border border-amber-500/30">
                      Trùng lặp: {importValidation.duplicateCount}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 font-bold text-[11px] border border-rose-500/30">
                      Lỗi: {importValidation.invalidCount}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Đóng
              </button>
              <button
                onClick={handleExecuteImport}
                disabled={!importValidation || importValidation.validItems.length === 0 || importLoading}
                className="btn-glass-primary !py-2 !px-5 text-xs font-bold shadow-lg shadow-indigo-600/20 disabled:opacity-40"
              >
                {importLoading
                  ? 'Đang nạp...'
                  : `Xác Nhận Nạp ${importValidation?.validItems.length || 0} Từ`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVocabularyPage;
