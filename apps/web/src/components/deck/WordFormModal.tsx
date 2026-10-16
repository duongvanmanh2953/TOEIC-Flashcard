import React from 'react';
import {
  Edit3,
  FileSpreadsheet,
  Plus,
  X,
  Download,
  Upload,
  RefreshCw,
  Check,
} from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';
import { CustomDropdown } from '../common/CustomDropdown';
import { EditableVocabularyStagingTable } from './EditableVocabularyStagingTable';
import { LocalDeck } from '../../lib/indexedDB';
import { ParsedWordItem } from '../../utils/excelTemplate';

export interface WordFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  showEditWordModal: boolean;
  addWordMode: 'manual' | 'file';
  setAddWordMode: (mode: 'manual' | 'file') => void;
  onSubmit: (e: React.FormEvent) => void;
  selectedDeck: LocalDeck | null;
  wordFormTargetDeck: string;
  setWordFormTargetDeck: (val: string) => void;
  decks: LocalDeck[];
  handleOpenCreateDeck: () => void;
  wordModalLang: { name: string; code: string };
  wordFormWord: string;
  setWordFormWord: (val: string) => void;
  wordFormPhonetic: string;
  setWordFormPhonetic: (val: string) => void;
  wordFormMeaning: string;
  setWordFormMeaning: (val: string) => void;
  wordFormPos: string;
  setWordFormPos: (val: string) => void;
  wordFormTopic: string;
  setWordFormTopic: (val: string) => void;
  wordFormCefr: string;
  setWordFormCefr: (val: string) => void;
  activeLanguage: { nativeName?: string; supportedLevels?: string[] };
  wordFormExample: string;
  setWordFormExample: (val: string) => void;
  wordFormExampleTrans: string;
  setWordFormExampleTrans: (val: string) => void;

  // File import inside AddWordModal
  downloadVocabularyTemplate: (format: 'xlsx' | 'csv') => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedFile: File | null;
  handleAddManualPreviewWord: () => void;
  isParsing: boolean;
  parsingError: string | null;
  parsedWords: ParsedWordItem[];
  setParsedWords: React.Dispatch<React.SetStateAction<ParsedWordItem[]>>;
  handleConfirmBatchImport: () => void;
  isImporting: boolean;
}

/**
 * WordFormModal - Dedicated Add / Edit Word Modal
 * Extracted according to `vercel-react-best-practices` to eliminate monolithic JSX
 * and optimize rendering in `MyWordBankPage.tsx`.
 */
export const WordFormModal: React.FC<WordFormModalProps> = React.memo(
  ({
    isOpen,
    onClose,
    showEditWordModal,
    addWordMode,
    setAddWordMode,
    onSubmit,
    selectedDeck,
    wordFormTargetDeck,
    setWordFormTargetDeck,
    decks,
    handleOpenCreateDeck,
    wordModalLang,
    wordFormWord,
    setWordFormWord,
    wordFormPhonetic,
    setWordFormPhonetic,
    wordFormMeaning,
    setWordFormMeaning,
    wordFormPos,
    setWordFormPos,
    wordFormTopic,
    setWordFormTopic,
    wordFormCefr,
    setWordFormCefr,
    activeLanguage,
    wordFormExample,
    setWordFormExample,
    wordFormExampleTrans,
    setWordFormExampleTrans,
    downloadVocabularyTemplate,
    fileInputRef,
    handleFileUpload,
    selectedFile,
    handleAddManualPreviewWord,
    isParsing,
    parsingError,
    parsedWords,
    setParsedWords,
    handleConfirmBatchImport,
    isImporting,
  }) => {
    return (
      <ModalPortal isOpen={isOpen} onClose={onClose}>
        <form
          onSubmit={onSubmit}
          className={`m-auto ${
            addWordMode === 'file' && !showEditWordModal ? 'max-w-7xl w-[96vw]' : 'max-w-4xl w-full'
          } max-h-[94vh] flex flex-col rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-700/80 p-5 sm:p-7 shadow-2xl animate-fade-in text-left overflow-hidden`}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                {showEditWordModal ? (
                  <Edit3 className="w-5 h-5" />
                ) : addWordMode === 'file' ? (
                  <FileSpreadsheet className="w-5 h-5" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {showEditWordModal
                    ? 'Chỉnh Sửa Từ Vựng'
                    : addWordMode === 'file'
                    ? 'Nạp Từ Vựng Từ File (Excel / CSV)'
                    : 'Thêm Từ Vựng Mới'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {showEditWordModal
                    ? 'Chỉnh sửa chi tiết từ vựng, phiên âm và nghĩa'
                    : addWordMode === 'file'
                    ? 'Tải file Excel/CSV, xem trước và chỉnh sửa danh sách trước khi nạp vào kho'
                    : 'Nhập thông tin chi tiết của từ vựng, phiên âm, định nghĩa và ví dụ minh họa'}
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

          {/* Mode Switcher Tabs (Only when Adding new word) */}
          {!showEditWordModal && (
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 my-3 shrink-0">
              <button
                type="button"
                onClick={() => setAddWordMode('manual')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  addWordMode === 'manual'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nhập thủ công</span>
              </button>
              <button
                type="button"
                onClick={() => setAddWordMode('file')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  addWordMode === 'file'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span>Nạp từ tệp (Excel / CSV)</span>
              </button>
            </div>
          )}

          {/* Form Body */}
          <div className="space-y-4 text-xs flex-1 min-h-0 overflow-y-auto py-3 pr-1">
            {/* Mode File Upload */}
            {addWordMode === 'file' && !showEditWordModal ? (
              <div className="space-y-4 animate-fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                      Kho từ mục tiêu:
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                      {selectedDeck?.title || wordFormTargetDeck || 'General'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => downloadVocabularyTemplate('xlsx')}
                      className="btn-glass-secondary btn-glass-sm !py-1 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Mẫu .xlsx</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadVocabularyTemplate('csv')}
                      className="btn-glass-secondary btn-glass-sm !py-1 text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Mẫu .csv</span>
                    </button>
                  </div>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-4 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/30"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {selectedFile ? selectedFile.name : 'Chọn file Excel (.xlsx) hoặc CSV từ máy tính'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Nhận diện tự động 7 cột: Word, Phonetic, PartOfSpeech, Meaning, Example, CEFR, Topic
                  </p>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Hoặc nạp từng từ vào danh sách:
                  </span>
                  <button
                    type="button"
                    onClick={handleAddManualPreviewWord}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm từ vào danh sách</span>
                  </button>
                </div>

                {isParsing && (
                  <div className="py-2 text-center text-xs text-indigo-600 font-bold flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang giải mã và đọc file dữ liệu...</span>
                  </div>
                )}

                {parsingError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 text-rose-700 dark:text-rose-300 text-xs font-medium">
                    {parsingError}
                  </div>
                )}

                {/* Parsed Staging Preview Table */}
                {parsedWords.length > 0 && (
                  <div className="pt-2">
                    <EditableVocabularyStagingTable
                      words={parsedWords}
                      onChangeWords={setParsedWords}
                      defaultCefrLevel={wordFormCefr}
                      defaultTopic={wordFormTopic || 'General'}
                    />
                  </div>
                )}
              </div>
            ) : null}

            {/* Mode Manual Add / Edit */}
            {(addWordMode === 'manual' || showEditWordModal) && (
              <>
                {decks.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-200 text-center space-y-3 my-2">
                    <p className="font-bold text-base">Chưa có kho từ vựng nào!</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                      Để thêm từ vựng, trước tiên bạn cần tạo ít nhất một kho từ để lưu trữ và quản lý từ vựng của bạn.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        handleOpenCreateDeck();
                      }}
                      className="btn-glass-purple btn-glass-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tạo kho từ vựng ngay</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Row 1: Word & Phonetic */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 text-xs">
                          Từ vựng ({wordModalLang.name}) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={wordFormWord}
                          onChange={(e) => setWordFormWord(e.target.value)}
                          placeholder="Ví dụ: agreement"
                          className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-bold text-sm text-slate-900 dark:text-white transition"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 text-xs">
                          Phiên âm IPA
                        </label>
                        <input
                          type="text"
                          value={wordFormPhonetic}
                          onChange={(e) => setWordFormPhonetic(e.target.value)}
                          placeholder="/əˈɡriː.mənt/"
                          className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono text-xs text-indigo-600 dark:text-indigo-400 transition"
                        />
                      </div>
                    </div>

                    {/* Row 2: Meaning & Part of Speech */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 text-xs">
                          Nghĩa tiếng Việt <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={wordFormMeaning}
                          onChange={(e) => setWordFormMeaning(e.target.value)}
                          placeholder="sự thỏa thuận, hợp đồng..."
                          className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium text-xs text-slate-900 dark:text-white transition"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 text-xs">
                          Loại từ
                        </label>
                        <CustomDropdown
                          value={wordFormPos}
                          onChange={(val) => setWordFormPos(val)}
                          options={[
                            { value: 'noun', label: 'Danh từ (noun)', badge: 'n' },
                            { value: 'verb', label: 'Động từ (verb)', badge: 'v' },
                            { value: 'adjective', label: 'Tính từ (adjective)', badge: 'adj' },
                            { value: 'adverb', label: 'Trạng từ (adverb)', badge: 'adv' },
                            { value: 'preposition', label: 'Giới từ (preposition)', badge: 'prep' },
                          ]}
                          size="md"
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Row 3: Real Topic & Target Deck */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 text-xs">
                          Chủ đề thực tế của từ (Topic) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={wordFormTopic}
                          onChange={(e) => setWordFormTopic(e.target.value)}
                          placeholder="Ví dụ: Contracts, Marketing, Travel, Finance..."
                          className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium text-xs text-slate-900 dark:text-white transition"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Lưu ý: Đây là chủ đề thực tế của từ (như Hợp đồng, Du lịch...), không phải tên kho.
                        </p>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 text-xs">
                          Kho từ vựng chứa
                        </label>
                        <CustomDropdown
                          value={wordFormTargetDeck}
                          onChange={(val) => setWordFormTargetDeck(val)}
                          options={decks.map((d) => ({
                            value: d.title,
                            label: `Kho: ${d.title}`,
                            badge: d.cefrLevel,
                          }))}
                          size="md"
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Row 4: Level */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 text-xs">
                          Cấp độ ({activeLanguage.nativeName})
                        </label>
                        <CustomDropdown
                          value={wordFormCefr}
                          onChange={(val) => setWordFormCefr(val)}
                          options={(activeLanguage.supportedLevels || ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).map((lvl) => ({
                            value: lvl,
                            label: `${lvl} — Trình độ ${lvl}`,
                            badge: lvl,
                          }))}
                          size="md"
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Examples */}
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 text-xs">
                        Câu ví dụ ({wordModalLang.name})
                      </label>
                      <textarea
                        rows={2}
                        value={wordFormExample}
                        onChange={(e) => setWordFormExample(e.target.value)}
                        placeholder="They reached an agreement after a lengthy negotiation."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium text-xs text-slate-900 dark:text-white transition"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 text-xs">
                        Dịch câu ví dụ
                      </label>
                      <input
                        type="text"
                        value={wordFormExampleTrans}
                        onChange={(e) => setWordFormExampleTrans(e.target.value)}
                        placeholder="Họ đã đạt được thỏa thuận sau một cuộc đàm phán kéo dài."
                        className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium text-xs text-slate-900 dark:text-white transition"
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="btn-glass-secondary btn-glass-sm"
            >
              Hủy
            </button>
            {addWordMode === 'file' && !showEditWordModal ? (
              <button
                type="button"
                onClick={handleConfirmBatchImport}
                disabled={isImporting || parsedWords.length === 0}
                className="btn-glass-primary btn-glass-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isImporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{isImporting ? 'Đang nạp từ...' : `Nạp ${parsedWords.length} từ vào kho`}</span>
              </button>
            ) : (
              <button
                type="submit"
                className="btn-glass-primary btn-glass-sm"
              >
                {showEditWordModal ? 'Lưu thay đổi' : 'Thêm từ vựng'}
              </button>
            )}
          </div>
        </form>
      </ModalPortal>
    );
  }
);

WordFormModal.displayName = 'WordFormModal';
