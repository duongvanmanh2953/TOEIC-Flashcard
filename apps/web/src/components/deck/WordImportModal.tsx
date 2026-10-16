import React from 'react';
import {
  FileSpreadsheet,
  X,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Trash2,
  Check,
  Edit2,
  ArrowRight,
} from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';
import { CustomDropdown } from '../common/CustomDropdown';
import { DeckStandardFields } from './DeckStandardFields';
import { LocalDeck } from '../../lib/indexedDB';
import { ParsedWordItem } from '../../utils/excelTemplate';
import {
  getDefaultCategoryForLanguage,
  getDefaultLevelForLanguage,
  getDefaultCertificateForLanguage,
} from '../../config/languageStandards';

export interface WordImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  decks: LocalDeck[];
  importDeckMode: 'existing' | 'new';
  setImportDeckMode: (mode: 'existing' | 'new') => void;
  importTargetDeckName: string;
  setImportTargetDeckName: (name: string) => void;
  importNewDeckLang: string;
  setImportNewDeckLang: (lang: string) => void;
  importNewDeckCert: string;
  setImportNewDeckCert: (cert: string) => void;
  importNewDeckLevel: string;
  setImportNewDeckLevel: (level: string) => void;
  importNewDeckCategory: string;
  setImportNewDeckCategory: (category: string) => void;
  customCategories: string[];
  onAddCustomCategory: (cat: string) => void;
  selectedFile: File | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isParsing: boolean;
  parsingError: string | null;
  parsedWords: ParsedWordItem[];
  setParsedWords: React.Dispatch<React.SetStateAction<ParsedWordItem[]>>;
  handleAddManualPreviewWord: () => void;
  handleClearAllParsed: () => void;
  editingParsedIdx: number | null;
  setEditingParsedIdx: (idx: number | null) => void;
  editingParsedItem: ParsedWordItem | null;
  setEditingParsedItem: (item: ParsedWordItem | null) => void;
  handleSaveParsedEdit: () => void;
  handleDeleteParsedWord: (idx: number) => void;
  importProgressMsg: string;
  isImporting: boolean;
  handleConfirmBatchImport: () => void;
  downloadVocabularyTemplate: (format: 'xlsx' | 'csv') => void;
}

/**
 * WordImportModal - Dedicated modular Excel/CSV Vocabulary Importer
 * Complies with `vercel-react-best-practices` by isolating staging table state
 * and preventing main word bank re-renders during spreadsheet parsing.
 */
export const WordImportModal: React.FC<WordImportModalProps> = React.memo(
  ({
    isOpen,
    onClose,
    decks,
    importDeckMode,
    setImportDeckMode,
    importTargetDeckName,
    setImportTargetDeckName,
    importNewDeckLang,
    setImportNewDeckLang,
    importNewDeckCert,
    setImportNewDeckCert,
    importNewDeckLevel,
    setImportNewDeckLevel,
    importNewDeckCategory,
    setImportNewDeckCategory,
    customCategories,
    onAddCustomCategory,
    selectedFile,
    fileInputRef,
    handleFileUpload,
    isParsing,
    parsingError,
    parsedWords,
    handleAddManualPreviewWord,
    handleClearAllParsed,
    editingParsedIdx,
    setEditingParsedIdx,
    editingParsedItem,
    setEditingParsedItem,
    handleSaveParsedEdit,
    handleDeleteParsedWord,
    importProgressMsg,
    isImporting,
    handleConfirmBatchImport,
    downloadVocabularyTemplate,
  }) => {
    return (
      <ModalPortal isOpen={isOpen} onClose={onClose}>
        <div className="m-auto max-w-5xl w-full max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-2xl animate-fade-in text-left overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Nhập Dữ Liệu Từ Vựng từ Excel / CSV
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tự động nhận diện 7 cột chuẩn: Word, Phonetic, PartOfSpeech, Meaning, Example, CEFR, Topic.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-glass-secondary btn-glass-icon text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 py-3 pr-1">
            {/* Options: Target Deck & Template Download */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nạp vào Kho Từ Vựng nào?
                  </label>
                  <div className="flex items-center gap-2">
                    <CustomDropdown
                      value={decks.length === 0 ? 'new' : importDeckMode}
                      onChange={(val) => setImportDeckMode(val as any)}
                      options={
                        decks.length === 0
                          ? [{ value: 'new', label: 'Tạo kho mới' }]
                          : [
                              { value: 'existing', label: 'Kho có sẵn' },
                              { value: 'new', label: 'Tạo kho mới' },
                            ]
                      }
                      size="md"
                      className="w-36"
                    />

                    {importDeckMode === 'existing' && decks.length > 0 ? (
                      <CustomDropdown
                        value={importTargetDeckName}
                        onChange={(val) => setImportTargetDeckName(val)}
                        options={decks.map((d) => ({
                          value: d.title,
                          label: d.title,
                          badge: d.cefrLevel,
                        }))}
                        size="md"
                        className="flex-1"
                      />
                    ) : (
                      <input
                        type="text"
                        value={importTargetDeckName}
                        onChange={(e) => setImportTargetDeckName(e.target.value)}
                        placeholder={decks.length === 0 ? 'Nhập tên kho mới cho các từ...' : 'Nhập tên kho mới...'}
                        className="flex-1 h-10 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-xs text-slate-900 dark:text-white"
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-start sm:justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => downloadVocabularyTemplate('xlsx')}
                    className="btn-glass-secondary btn-glass-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải mẫu .xlsx</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadVocabularyTemplate('csv')}
                    className="btn-glass-secondary btn-glass-sm text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải mẫu .csv</span>
                  </button>
                </div>
              </div>

              {/* Dynamic language, certificate, level, category when creating a new deck */}
              {importDeckMode === 'new' && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 mt-3">
                  <DeckStandardFields
                    languageId={importNewDeckLang}
                    allowLanguageChange={true}
                    onLanguageChange={(newLang) => {
                      setImportNewDeckLang(newLang);
                      const defCert = getDefaultCertificateForLanguage(newLang);
                      setImportNewDeckCert(defCert.id);
                      setImportNewDeckCategory(getDefaultCategoryForLanguage(newLang));
                      setImportNewDeckLevel(getDefaultLevelForLanguage(newLang).name);
                    }}
                    certificateId={importNewDeckCert}
                    onCertificateChange={setImportNewDeckCert}
                    level={importNewDeckLevel}
                    onLevelChange={setImportNewDeckLevel}
                    category={importNewDeckCategory}
                    onCategoryChange={setImportNewDeckCategory}
                    customCategories={customCategories}
                    onAddCustomCategory={onAddCustomCategory}
                    gridCols={3}
                  />
                </div>
              )}
            </div>

            {/* File Upload Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-5 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/30"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {selectedFile ? selectedFile.name : 'Bấm vào đây để chọn file Excel (.xlsx) hoặc CSV từ máy tính'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Dung lượng tối đa 100MB • Tự động đọc và kiểm tra dữ liệu trước khi nạp</p>
            </div>

            {isParsing && (
              <div className="py-4 text-center text-xs text-indigo-600 font-bold flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang đọc và giải mã file...</span>
              </div>
            )}

            {parsingError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 text-rose-700 dark:text-rose-300 text-xs font-medium">
                {parsingError}
              </div>
            )}

            {/* Staging Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Danh sách từ chuẩn bị nạp:
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {parsedWords.length} từ
                </span>
                {parsedWords.length > 0 && (
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    (Hợp lệ: <strong className="text-emerald-600 dark:text-emerald-400">{parsedWords.filter((w) => w.word?.trim() && w.meaning?.trim()).length}</strong>)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddManualPreviewWord}
                  className="btn-glass-primary btn-glass-sm inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm từ thủ công</span>
                </button>
                {parsedWords.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllParsed}
                    className="btn-glass-danger btn-glass-sm inline-flex items-center gap-1.5"
                    title="Xóa toàn bộ danh sách xem trước tạm thời"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa tất cả</span>
                  </button>
                )}
              </div>
            </div>

            {/* Parsed Interactive Staging Preview Table */}
            {parsedWords.length > 0 ? (
              <div className="min-h-[200px] max-h-[380px] overflow-y-auto overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl shadow-inner bg-white dark:bg-slate-900/60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xs sticky top-0 font-bold text-slate-700 dark:text-slate-300 text-[11px] z-10">
                    <tr>
                      <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 w-10 text-center">#</th>
                      <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 min-w-[130px]">Từ vựng (Word) *</th>
                      <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 min-w-[100px]">Phiên âm</th>
                      <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 min-w-[95px]">Loại từ</th>
                      <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 min-w-[170px]">Nghĩa tiếng Việt *</th>
                      <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 min-w-[120px]">Chủ đề (Topic)</th>
                      <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 min-w-[70px]">CEFR</th>
                      <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 min-w-[180px]">Ví dụ / Câu mẫu</th>
                      <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 w-24 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                    {parsedWords.map((row, idx) => {
                      const isEditing = editingParsedIdx === idx;
                      const isValid = Boolean(row.word?.trim() && row.meaning?.trim());

                      if (isEditing && editingParsedItem) {
                        return (
                          <tr key={idx} className="bg-indigo-50/50 dark:bg-indigo-950/40">
                            <td className="p-2 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={editingParsedItem.word}
                                onChange={(e) =>
                                  setEditingParsedItem({ ...editingParsedItem, word: e.target.value })
                                }
                                placeholder="word *"
                                className="w-full h-8 px-2 rounded-lg border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-slate-900 text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                                autoFocus
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={editingParsedItem.phonetic || ''}
                                onChange={(e) =>
                                  setEditingParsedItem({ ...editingParsedItem, phonetic: e.target.value })
                                }
                                placeholder="/.../"
                                className="w-full h-8 px-2 rounded-lg border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={editingParsedItem.pos || ''}
                                onChange={(e) =>
                                  setEditingParsedItem({ ...editingParsedItem, pos: e.target.value })
                                }
                                placeholder="n, v, adj"
                                className="w-full h-8 px-2 rounded-lg border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={editingParsedItem.meaning}
                                onChange={(e) =>
                                  setEditingParsedItem({ ...editingParsedItem, meaning: e.target.value })
                                }
                                placeholder="nghĩa *"
                                className="w-full h-8 px-2 rounded-lg border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={editingParsedItem.topic || ''}
                                onChange={(e) =>
                                  setEditingParsedItem({ ...editingParsedItem, topic: e.target.value })
                                }
                                placeholder="Chủ đề thực tế"
                                className="w-full h-8 px-2 rounded-lg border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={editingParsedItem.cefrLevel || ''}
                                onChange={(e) =>
                                  setEditingParsedItem({ ...editingParsedItem, cefrLevel: e.target.value })
                                }
                                placeholder="B1, B2..."
                                className="w-full h-8 px-2 rounded-lg border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={editingParsedItem.example || ''}
                                onChange={(e) =>
                                  setEditingParsedItem({ ...editingParsedItem, example: e.target.value })
                                }
                                placeholder="Câu ví dụ..."
                                className="w-full h-8 px-2 rounded-lg border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="p-2 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={handleSaveParsedEdit}
                                  className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition"
                                  title="Lưu dòng đang sửa"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingParsedIdx(null);
                                    setEditingParsedItem(null);
                                  }}
                                  className="p-1 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition"
                                  title="Hủy sửa"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${
                            !isValid ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                          }`}
                        >
                          <td className="p-2 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="p-2 font-bold text-indigo-600 dark:text-indigo-400">
                            {row.word || <span className="text-rose-500 italic font-normal">[thiếu từ]</span>}
                          </td>
                          <td className="p-2 font-mono text-[11px] text-slate-500">
                            {row.phonetic || '—'}
                          </td>
                          <td className="p-2 text-slate-500">
                            {row.pos || '—'}
                          </td>
                          <td className="p-2 font-semibold">
                            {row.meaning || <span className="text-rose-500 italic font-normal">[thiếu nghĩa]</span>}
                          </td>
                          <td className="p-2">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                              {row.topic || 'General'}
                            </span>
                          </td>
                          <td className="p-2">
                            <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-mono text-[10px] font-bold">
                              {row.cefrLevel || 'B1'}
                            </span>
                          </td>
                          <td className="p-2 text-slate-500 max-w-[200px] truncate" title={row.example}>
                            {row.example || '—'}
                          </td>
                          <td className="p-2 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingParsedIdx(idx);
                                  setEditingParsedItem({ ...row });
                                }}
                                className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                title="Chỉnh sửa dòng này"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteParsedWord(idx)}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                title="Xóa dòng này"
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
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                Chưa có dữ liệu từ vựng nào. Hãy chọn file Excel/CSV mẫu hoặc bấm "Thêm từ thủ công" ở trên.
              </div>
            )}

            {importProgressMsg && (
              <div className="p-3 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold text-center space-y-2 animate-in fade-in">
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                  <span>{importProgressMsg}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-indigo-200/60 dark:bg-indigo-900/60 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500 rounded-full animate-pulse w-full"></div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <span className="text-xs font-bold text-slate-500">
              Tổng số từ hợp lệ: <strong className="text-indigo-600">{parsedWords.filter((w) => w.word?.trim() && w.meaning?.trim()).length}</strong> từ
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-glass-secondary btn-glass-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchImport}
                disabled={isImporting || parsedWords.length === 0}
                className="btn-glass-emerald btn-glass-sm inline-flex items-center gap-1.5"
              >
                {isImporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                <span>{isImporting ? 'Đang nạp...' : 'Xác nhận nạp vào kho'}</span>
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    );
  }
);

WordImportModal.displayName = 'WordImportModal';
