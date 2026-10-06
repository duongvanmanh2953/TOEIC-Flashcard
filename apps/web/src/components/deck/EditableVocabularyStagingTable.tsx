import React, { useState, useMemo } from 'react';
import { ParsedWordItem } from '../../utils/excelTemplate';
import {
  Search,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Eraser,
  Copy,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Layers,
  Sparkles,
} from 'lucide-react';

export interface EditableVocabularyStagingTableProps {
  words: ParsedWordItem[];
  onChangeWords: (updatedWords: ParsedWordItem[]) => void;
  defaultCefrLevel?: string;
  defaultTopic?: string;
  className?: string;
}

const POS_OPTIONS = [
  { value: 'noun', label: 'Danh từ' },
  { value: 'verb', label: 'Động từ' },
  { value: 'adjective', label: 'Tính từ' },
  { value: 'adverb', label: 'Trạng từ' },
  { value: 'phrase', label: 'Cụm từ' },
  { value: 'idiom', label: 'Thành ngữ' },
  { value: 'preposition', label: 'Giới từ' },
  { value: 'conjunction', label: 'Liên từ' },
  { value: 'pronoun', label: 'Đại từ' },
  { value: 'interjection', label: 'Thán từ' },
  { value: 'other', label: 'Khác' },
];

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const EditableVocabularyStagingTable: React.FC<EditableVocabularyStagingTableProps> = ({
  words,
  onChangeWords,
  defaultCefrLevel = 'B1',
  defaultTopic = 'General',
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'invalid'>('all');
  const [pageSize, setPageSize] = useState<number | 'all'>(50);
  const [currentPage, setCurrentPage] = useState(1);

  // Stats calculation
  const validCount = useMemo(() => {
    return words.filter((w) => w.word?.trim() && w.meaning?.trim()).length;
  }, [words]);

  const invalidCount = words.length - validCount;

  // Filtered list
  const filteredWordsWithIndices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return words
      .map((item, originalIndex) => ({ item, originalIndex }))
      .filter(({ item }) => {
        const hasWord = Boolean(item.word?.trim());
        const hasMeaning = Boolean(item.meaning?.trim());
        const isValid = hasWord && hasMeaning;

        if (filterMode === 'valid' && !isValid) return false;
        if (filterMode === 'invalid' && isValid) return false;

        if (!q) return true;

        const wMatch = item.word?.toLowerCase().includes(q);
        const mMatch = item.meaning?.toLowerCase().includes(q);
        const pMatch = item.phonetic?.toLowerCase().includes(q);
        const tMatch = item.topic?.toLowerCase().includes(q);
        const exMatch = item.example?.toLowerCase().includes(q);

        return Boolean(wMatch || mMatch || pMatch || tMatch || exMatch);
      });
  }, [words, searchQuery, filterMode]);

  // Pagination calculation
  const totalItems = filteredWordsWithIndices.length;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));

  const paginatedItems = useMemo(() => {
    if (pageSize === 'all') return filteredWordsWithIndices;
    const start = (currentPage - 1) * pageSize;
    return filteredWordsWithIndices.slice(start, start + pageSize);
  }, [filteredWordsWithIndices, currentPage, pageSize]);

  // Adjust page if needed
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  // Update cell handler
  const handleCellChange = (
    originalIndex: number,
    field: keyof ParsedWordItem,
    value: string
  ) => {
    const updated = [...words];
    updated[originalIndex] = {
      ...updated[originalIndex],
      [field]: value,
    };
    onChangeWords(updated);
  };

  // Delete row handler
  const handleDeleteRow = (originalIndex: number) => {
    const updated = words.filter((_, idx) => idx !== originalIndex);
    onChangeWords(updated);
  };

  // Add new empty row at top
  const handleAddNewRow = () => {
    const newRow: ParsedWordItem = {
      word: '',
      phonetic: '',
      partOfSpeech: 'noun',
      meaning: '',
      example: '',
      exampleTranslation: '',
      cefrLevel: defaultCefrLevel,
      topic: defaultTopic,
    };
    onChangeWords([newRow, ...words]);
    setCurrentPage(1);
  };

  // Clear empty rows
  const handleClearEmptyRows = () => {
    const cleaned = words.filter((w) => w.word?.trim() || w.meaning?.trim());
    const removedCount = words.length - cleaned.length;
    if (removedCount > 0) {
      onChangeWords(cleaned);
    }
  };

  // Deduplicate words
  const handleDeduplicate = () => {
    const seen = new Set<string>();
    const cleaned: ParsedWordItem[] = [];
    for (const w of words) {
      const key = (w.word || '').trim().toLowerCase();
      if (!key) {
        cleaned.push(w);
      } else if (!seen.has(key)) {
        seen.add(key);
        cleaned.push(w);
      }
    }
    onChangeWords(cleaned);
  };

  // Clear all rows
  const handleClearAll = () => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa toàn bộ ${words.length} từ vựng trong danh sách?`)) {
      onChangeWords([]);
      setCurrentPage(1);
    }
  };

  return (
    <div className={`flex flex-col h-full min-h-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden ${className}`}>
      {/* Top Controls Bar */}
      <div className="p-3 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 shrink-0 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Search & Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Search */}
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo từ, nghĩa, chủ đề..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>

          {/* Filter Status Chips */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-200/60 dark:bg-slate-800 border border-slate-300/50 dark:border-slate-700 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => {
                setFilterMode('all');
                setCurrentPage(1);
              }}
              className={`px-2 py-1 rounded-lg transition ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Tất cả ({words.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterMode('valid');
                setCurrentPage(1);
              }}
              className={`px-2 py-1 rounded-lg transition flex items-center gap-1 ${
                filterMode === 'valid'
                  ? 'bg-emerald-500 text-white shadow-xs font-bold'
                  : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Hợp lệ ({validCount})</span>
            </button>
            {invalidCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setFilterMode('invalid');
                  setCurrentPage(1);
                }}
                className={`px-2 py-1 rounded-lg transition flex items-center gap-1 ${
                  filterMode === 'invalid'
                    ? 'bg-rose-500 text-white shadow-xs font-bold'
                    : 'text-rose-600 dark:text-rose-400 hover:text-rose-700'
                }`}
                title="Bấm để lọc ra các từ thiếu Từ vựng hoặc Nghĩa"
              >
                <AlertCircle className="w-3 h-3" />
                <span>Cần sửa ({invalidCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleAddNewRow}
            className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm từ mới</span>
          </button>

          <button
            type="button"
            onClick={handleClearEmptyRows}
            title="Xóa các dòng trống chưa có dữ liệu"
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition text-xs font-medium flex items-center gap-1"
          >
            <Eraser className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Dọn trống</span>
          </button>

          <button
            type="button"
            onClick={handleDeduplicate}
            title="Lọc bỏ các từ vựng bị trùng lặp"
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition text-xs font-medium flex items-center gap-1"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Lọc trùng</span>
          </button>

          {words.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              title="Xóa toàn bộ danh sách từ"
              className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 transition text-xs font-medium flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Xóa hết</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="flex-1 min-h-0 overflow-auto chat-scrollbar relative">
        {words.length === 0 ? (
          <div className="h-full min-h-[220px] flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Chưa có từ vựng nào trong danh sách
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Tải file Excel / CSV lên hoặc bấm nút bên dưới để bắt đầu điền từ vựng trực tiếp trên bảng.
            </p>
            <button
              type="button"
              onClick={handleAddNewRow}
              className="mt-3.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm dòng từ đầu tiên</span>
            </button>
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="h-full min-h-[160px] flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-1" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Không tìm thấy từ vựng phù hợp với bộ lọc
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterMode('all');
              }}
              className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <table className="w-full border-collapse text-left text-xs min-w-[1050px]">
            {/* Sticky Table Header */}
            <thead className="sticky top-0 z-10 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider select-none shadow-xs">
              <tr>
                <th className="py-2.5 px-2 text-center w-12">STT</th>
                <th className="py-2.5 px-3 min-w-[150px] w-44">
                  Từ vựng <span className="text-rose-500">*</span>
                </th>
                <th className="py-2.5 px-3 min-w-[130px] w-36">Phiên âm</th>
                <th className="py-2.5 px-3 min-w-[120px] w-32">Loại từ</th>
                <th className="py-2.5 px-3 min-w-[200px] flex-1">
                  Nghĩa <span className="text-rose-500">*</span>
                </th>
                <th className="py-2.5 px-3 min-w-[210px] w-60">Ví dụ</th>
                <th className="py-2.5 px-3 min-w-[190px] w-52">Dịch ví dụ</th>
                <th className="py-2.5 px-3 min-w-[90px] w-24">Trình độ</th>
                <th className="py-2.5 px-3 min-w-[120px] w-32">Chủ đề</th>
                <th className="py-2.5 px-2 text-center w-12">Xóa</th>
              </tr>
            </thead>

            {/* Table Body with Direct In-Cell Inputs */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedItems.map(({ item, originalIndex }, displayIdx) => {
                const isWordMissing = !item.word?.trim();
                const isMeaningMissing = !item.meaning?.trim();
                const isRowIncomplete = isWordMissing || isMeaningMissing;

                const rowNumber =
                  pageSize === 'all'
                    ? originalIndex + 1
                    : (currentPage - 1) * (pageSize as number) + displayIdx + 1;

                return (
                  <tr
                    key={originalIndex}
                    className={`transition-colors group hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      isRowIncomplete
                        ? 'bg-rose-50/40 dark:bg-rose-950/20'
                        : displayIdx % 2 === 1
                        ? 'bg-slate-50/20 dark:bg-slate-900/40'
                        : ''
                    }`}
                  >
                    {/* STT */}
                    <td className="py-2 px-2 text-center text-[11px] font-mono text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                      {rowNumber}
                    </td>

                    {/* Word (Editable) */}
                    <td className="py-1.5 px-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={item.word || ''}
                          onChange={(e) =>
                            handleCellChange(originalIndex, 'word', e.target.value)
                          }
                          placeholder="Từ vựng..."
                          className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold transition focus:outline-none focus:ring-2 ${
                            isWordMissing
                              ? 'bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100 focus:ring-rose-400'
                              : 'bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500/20'
                          }`}
                        />
                        {isWordMissing && (
                          <span
                            title="Thiếu từ vựng"
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-rose-500 animate-pulse"
                          />
                        )}
                      </div>
                    </td>

                    {/* Phonetic (Editable) */}
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        value={item.phonetic || ''}
                        onChange={(e) =>
                          handleCellChange(originalIndex, 'phonetic', e.target.value)
                        }
                        placeholder="Phiên âm..."
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </td>

                    {/* Part of Speech (Dropdown Select) */}
                    <td className="py-1.5 px-2">
                      <select
                        value={item.partOfSpeech || 'noun'}
                        onChange={(e) =>
                          handleCellChange(originalIndex, 'partOfSpeech', e.target.value)
                        }
                        className="w-full px-2 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                      >
                        {POS_OPTIONS.map((pos) => (
                          <option key={pos.value} value={pos.value}>
                            {pos.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Meaning (Editable) */}
                    <td className="py-1.5 px-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={item.meaning || ''}
                          onChange={(e) =>
                            handleCellChange(originalIndex, 'meaning', e.target.value)
                          }
                          placeholder="Nghĩa..."
                          className={`w-full px-2.5 py-1.5 rounded-lg text-xs transition focus:outline-none focus:ring-2 ${
                            isMeaningMissing
                              ? 'bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100 focus:ring-rose-400'
                              : 'bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                          }`}
                        />
                        {isMeaningMissing && (
                          <span
                            title="Thiếu nghĩa"
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-rose-500 animate-pulse"
                          />
                        )}
                      </div>
                    </td>

                    {/* Example (Editable) */}
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        value={item.example || ''}
                        onChange={(e) =>
                          handleCellChange(originalIndex, 'example', e.target.value)
                        }
                        placeholder="Ví dụ..."
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </td>

                    {/* Example Translation (Editable) */}
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        value={item.exampleTranslation || ''}
                        onChange={(e) =>
                          handleCellChange(
                            originalIndex,
                            'exampleTranslation',
                            e.target.value
                          )
                        }
                        placeholder="Dịch ví dụ..."
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </td>

                    {/* CEFR Level (Select) */}
                    <td className="py-1.5 px-2">
                      <select
                        value={item.cefrLevel || defaultCefrLevel}
                        onChange={(e) =>
                          handleCellChange(originalIndex, 'cefrLevel', e.target.value)
                        }
                        className="w-full px-2 py-1.5 rounded-lg text-xs font-semibold text-center bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                      >
                        {CEFR_LEVELS.map((lvl) => (
                          <option key={lvl} value={lvl}>
                            {lvl}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Topic (Editable) */}
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        value={item.topic || ''}
                        onChange={(e) =>
                          handleCellChange(originalIndex, 'topic', e.target.value)
                        }
                        placeholder="Chủ đề..."
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </td>

                    {/* Action: Delete Row */}
                    <td className="py-1.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(originalIndex)}
                        title="Xóa từ vựng này"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Bottom Pagination & Status Footer */}
      {words.length > 0 && (
        <div className="p-2.5 px-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 shrink-0 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Summary info */}
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
            <span>
              Tổng cộng: <strong className="text-slate-900 dark:text-white font-bold">{words.length}</strong> từ
            </span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {validCount} hợp lệ
            </span>
            {invalidCount > 0 && (
              <>
                <span>•</span>
                <span className="text-rose-600 dark:text-rose-400 font-bold">
                  {invalidCount} cần bổ sung
                </span>
              </>
            )}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <span>Hiển thị:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                  setPageSize(val);
                  setCurrentPage(1);
                }}
                className="px-1.5 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value="all">Tất cả</option>
              </select>
            </div>

            {pageSize !== 'all' && totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium px-1">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                  title="Trang tiếp"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableVocabularyStagingTable;
