import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Presentation,
  CheckCircle2,
  AlertTriangle,
  X,
  Edit2,
  Save,
  Download,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';
import { ParsedExamQuestion, InvalidExamQuestionRow } from '../../utils/examTemplate';

export interface ExamImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileType: 'excel' | 'pptx' | 'csv';
  validQuestions: ParsedExamQuestion[];
  invalidQuestions: InvalidExamQuestionRow[];
  onConfirmImport: (finalQuestions: ParsedExamQuestion[]) => void;
}

export const ExamImportPreviewModal: React.FC<ExamImportPreviewModalProps> = ({
  isOpen,
  onClose,
  fileName,
  fileType,
  validQuestions: initialValid,
  invalidQuestions: initialInvalid,
  onConfirmImport,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'all' | 'valid' | 'warning' | 'invalid'>(
    initialInvalid.length > 0 ? 'invalid' : 'all'
  );
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const [validQuestions, setValidQuestions] = useState<ParsedExamQuestion[]>(initialValid);
  const [invalidQuestions, setInvalidQuestions] = useState<InvalidExamQuestionRow[]>(initialInvalid);
  const [editingRow, setEditingRow] = useState<number | null>(null);

  // Edit draft state
  const [draftPrompt, setDraftPrompt] = useState('');
  const [draftOptA, setDraftOptA] = useState('');
  const [draftOptB, setDraftOptB] = useState('');
  const [draftOptC, setDraftOptC] = useState('');
  const [draftOptD, setDraftOptD] = useState('');
  const [draftAnswer, setDraftAnswer] = useState('');
  const [draftExplanation, setDraftExplanation] = useState('');
  const [draftGrammar, setDraftGrammar] = useState('');

  const [selectedPartFilter, setSelectedPartFilter] = useState<string>('ALL');

  // Extract distinct parts / categories
  const availableParts = React.useMemo(() => {
    const parts = new Set<string>();
    validQuestions.forEach((q) => {
      const p = q.skill || q.category || 'Chung';
      parts.add(p);
    });
    return Array.from(parts);
  }, [validQuestions]);

  // Calculate warning count
  const warningQuestions = validQuestions.filter((q) => q.warnings && q.warnings.length > 0);
  const totalCount = validQuestions.length + invalidQuestions.length;

  const handleStartEdit = (inv: InvalidExamQuestionRow) => {
    setEditingRow(inv.rowNumber);
    setDraftPrompt(inv.questionText || '');
    setDraftOptA(inv.rawRow?.lua_chon_a || inv.rawRow?.option_a || '');
    setDraftOptB(inv.rawRow?.lua_chon_b || inv.rawRow?.option_b || '');
    setDraftOptC(inv.rawRow?.lua_chon_c || inv.rawRow?.option_c || '');
    setDraftOptD(inv.rawRow?.lua_chon_d || inv.rawRow?.option_d || '');
    setDraftAnswer(inv.rawRow?.dap_an_dung || inv.rawRow?.correct_answer || '');
    setDraftExplanation(inv.rawRow?.giai_thich_chi_tiet || inv.rawRow?.explanation || '');
    setDraftGrammar(inv.rawRow?.chu_diem_ngu_phap || inv.rawRow?.grammar_type || '');
  };

  const handleStartEditValid = (val: ParsedExamQuestion, idx: number) => {
    const rowId = val.rowNumber || val.questionNumber || idx + 1;
    setEditingRow(rowId);
    setDraftPrompt(val.questionText || '');
    setDraftOptA(val.options.find((o) => o.key === 'A')?.text || '');
    setDraftOptB(val.options.find((o) => o.key === 'B')?.text || '');
    setDraftOptC(val.options.find((o) => o.key === 'C')?.text || '');
    setDraftOptD(val.options.find((o) => o.key === 'D')?.text || '');
    setDraftAnswer(Array.isArray(val.correctAnswer) ? val.correctAnswer[0] : (val.correctAnswer || 'A'));
    setDraftExplanation(val.explanation || '');
    setDraftGrammar(val.grammarType || '');
  };

  const handleSaveFixedQuestion = (rowNumber: number) => {
    if (!draftPrompt.trim() || !draftAnswer.trim()) {
      alert('Vui lòng nhập đầy đủ nội dung câu hỏi và đáp án đúng.');
      return;
    }

    const options = [
      { key: 'A', text: draftOptA.trim() },
      { key: 'B', text: draftOptB.trim() },
      { key: 'C', text: draftOptC.trim() },
      { key: 'D', text: draftOptD.trim() },
    ].filter((o) => Boolean(o.text));

    const validKeys = options.map((o) => o.key);
    if (!validKeys.includes(draftAnswer.trim().toUpperCase())) {
      alert(`Đáp án đúng "${draftAnswer}" phải là một trong các lựa chọn có sẵn (${validKeys.join(', ')}).`);
      return;
    }

    const isExistingValid = validQuestions.some(
      (q) => q.rowNumber === rowNumber || q.questionNumber === rowNumber
    );

    if (isExistingValid) {
      setValidQuestions((prev) =>
        prev.map((q) => {
          if (q.rowNumber === rowNumber || q.questionNumber === rowNumber) {
            return {
              ...q,
              questionText: draftPrompt.trim(),
              options,
              correctAnswer: draftAnswer.trim().toUpperCase(),
              explanation: draftExplanation.trim() || undefined,
              grammarType: draftGrammar.trim() || undefined,
              warnings: [],
            };
          }
          return q;
        })
      );
    } else {
      const newValidQuestion: ParsedExamQuestion = {
        rowNumber,
        questionNumber: rowNumber,
        questionText: draftPrompt.trim(),
        questionType: 'MULTIPLE_CHOICE',
        options,
        correctAnswer: draftAnswer.trim().toUpperCase(),
        acceptedAnswers: [],
        explanation: draftExplanation.trim() || undefined,
        grammarType: draftGrammar.trim() || undefined,
        category: 'Grammar',
        skill: 'Reading',
        difficulty: 'MEDIUM',
        points: 1.0,
        tags: ['fixed-in-preview'],
      };

      setValidQuestions((prev) =>
        [...prev, newValidQuestion].sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0))
      );
      setInvalidQuestions((prev) => prev.filter((item) => item.rowNumber !== rowNumber));
    }
    setEditingRow(null);
  };

  const handleDownloadErrorReport = () => {
    let report = `=== BÁO CÁO LỖI IMPORT BỘ ĐỀ THI ===\n`;
    report += `Tên file: ${fileName}\n`;
    report += `Thời gian: ${new Date().toLocaleString('vi-VN')}\n`;
    report += `Tổng số dòng/slide lỗi: ${invalidQuestions.length}\n\n`;

    invalidQuestions.forEach((inv) => {
      report += `[Dòng/Slide ${inv.rowNumber}] - Câu ${inv.questionNumber || 'N/A'}\n`;
      report += `Nội dung: ${inv.questionText || 'Trống'}\n`;
      report += `Các lỗi phát hiện:\n`;
      inv.errors.forEach((err) => {
        report += `  - ${err}\n`;
      });
      report += `--------------------------------------------------\n`;
    });

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bao_cao_loi_import_${fileName.replace(/[^a-z0-9_.]+/gi, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-200/60 dark:border-indigo-800/60">
                {fileType === 'excel' ? (
                  <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                ) : fileType === 'csv' ? (
                  <FileText className="w-5 h-5 text-sky-500" />
                ) : (
                  <Presentation className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white truncate">
                    Xem trước kết quả nhập file bộ đề
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {fileType.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">{fileName}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats Bar & View Switcher */}
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>Tất cả</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
                  {totalCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('valid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'valid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Hợp lệ</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-extrabold">
                  {validQuestions.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('warning')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'warning'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Cảnh báo</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-extrabold">
                  {warningQuestions.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('invalid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'invalid'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Lỗi</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-extrabold">
                  {invalidQuestions.length}
                </span>
              </button>
            </div>

            {/* View Mode Toggle & Error Download */}
            <div className="flex items-center gap-2">
              <div className="inline-flex p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Bảng
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('card')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    viewMode === 'card'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Từng câu
                </button>
              </div>

              {invalidQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadErrorReport}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-semibold ml-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Báo cáo lỗi ({invalidQuestions.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* CARD VIEW MODE */}
            {viewMode === 'card' && (
              <div className="space-y-4 max-w-2xl mx-auto">
                {validQuestions.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    Chưa có câu hỏi hợp lệ nào để xem dạng thẻ. Hãy kiểm tra các câu lỗi ở tab "Lỗi".
                  </div>
                ) : (
                  <>
                    {/* Carousel Navigation */}
                    <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                      <button
                        type="button"
                        disabled={currentCardIndex === 0}
                        onClick={() => setCurrentCardIndex((prev) => Math.max(0, prev - 1))}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                      >
                        ← Câu trước
                      </button>

                      <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                        Câu {currentCardIndex + 1} / {validQuestions.length}
                      </div>

                      <button
                        type="button"
                        disabled={currentCardIndex >= validQuestions.length - 1}
                        onClick={() => setCurrentCardIndex((prev) => Math.min(validQuestions.length - 1, prev + 1))}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                      >
                        Câu tiếp →
                      </button>
                    </div>

                    {/* Active Question Card */}
                    {(() => {
                      const q = validQuestions[currentCardIndex];
                      if (!q) return null;
                      return (
                        <div className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-indigo-600 text-white">
                              Question {q.questionNumber || currentCardIndex + 1}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Đáp án: {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}
                            </span>
                          </div>

                          <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-relaxed">
                            {q.questionText}
                          </h4>

                          {/* Options grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                            {q.options.map((opt) => {
                              const isCorrect =
                                opt.key.toUpperCase() === String(q.correctAnswer).toUpperCase();
                              return (
                                <div
                                  key={opt.key}
                                  className={`p-3 rounded-2xl text-xs font-medium border flex items-center gap-2.5 ${
                                    isCorrect
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/60 text-emerald-900 dark:text-emerald-200 font-bold'
                                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 text-slate-800 dark:text-slate-300'
                                  }`}
                                >
                                  <span
                                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                                      isCorrect
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    {opt.key}
                                  </span>
                                  <span className="leading-snug">{opt.text}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Explanation and metadata */}
                          {q.explanation && (
                            <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-900/50 space-y-1">
                              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                Lời giải chi tiết:
                              </span>
                              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                {q.explanation}
                              </p>
                            </div>
                          )}

                          {q.warnings && q.warnings.length > 0 && (
                            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                              <span className="font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Cảnh báo dữ liệu:
                              </span>
                              <ul className="list-disc list-inside text-[11px] space-y-0.5">
                                {q.warnings.map((w, wIdx) => (
                                  <li key={wIdx}>{w}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            )}

            {/* TABLE VIEW MODE */}
            {viewMode === 'table' && (
              <div className="space-y-4">
                {/* INVALIDS LIST FIRST IF ANY */}
                {(activeTab === 'all' || activeTab === 'invalid') && invalidQuestions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Các dòng cần sửa lỗi ({invalidQuestions.length})</span>
                    </h4>

                    {invalidQuestions.map((inv) => (
                      <div
                        key={`inv-${inv.rowNumber}`}
                        className="p-4 rounded-2xl border border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-rose-500 text-white">
                                Dòng/Slide {inv.rowNumber}
                              </span>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {inv.questionText || '(Không có nội dung câu hỏi)'}
                              </span>
                            </div>
                            <div className="space-y-0.5 pt-1">
                              {inv.errors.map((err, eIdx) => (
                                <p key={eIdx} className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                  <span>{err}</span>
                                </p>
                              ))}
                            </div>
                          </div>

                          {editingRow !== inv.rowNumber && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(inv)}
                              className="btn-glass-primary text-xs !py-1.5 !px-3 shrink-0 flex items-center gap-1 font-bold"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Sửa ngay</span>
                            </button>
                          )}
                        </div>

                        {/* Inline Fix Form */}
                        {editingRow === inv.rowNumber && (
                          <div className="pt-3 border-t border-rose-200/80 dark:border-rose-900/60 space-y-2.5 animate-fade-in bg-white dark:bg-slate-900 p-3.5 rounded-xl border">
                            <div className="font-bold text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>Sửa lỗi câu hỏi này trực tiếp:</span>
                            </div>

                            <div>
                              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Nội dung câu hỏi:</label>
                              <input
                                type="text"
                                value={draftPrompt}
                                onChange={(e) => setDraftPrompt(e.target.value)}
                                className="w-full text-xs px-3 py-1.5 rounded-lg border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] font-semibold text-slate-500">Lựa chọn A:</label>
                                <input
                                  type="text"
                                  value={draftOptA}
                                  onChange={(e) => setDraftOptA(e.target.value)}
                                  className="w-full text-xs px-2.5 py-1 rounded-lg border bg-slate-50 dark:bg-slate-800"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-slate-500">Lựa chọn B:</label>
                                <input
                                  type="text"
                                  value={draftOptB}
                                  onChange={(e) => setDraftOptB(e.target.value)}
                                  className="w-full text-xs px-2.5 py-1 rounded-lg border bg-slate-50 dark:bg-slate-800"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-slate-500">Lựa chọn C:</label>
                                <input
                                  type="text"
                                  value={draftOptC}
                                  onChange={(e) => setDraftOptC(e.target.value)}
                                  className="w-full text-xs px-2.5 py-1 rounded-lg border bg-slate-50 dark:bg-slate-800"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-slate-500">Lựa chọn D:</label>
                                <input
                                  type="text"
                                  value={draftOptD}
                                  onChange={(e) => setDraftOptD(e.target.value)}
                                  className="w-full text-xs px-2.5 py-1 rounded-lg border bg-slate-50 dark:bg-slate-800"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="text-[10px] font-bold text-emerald-600">Đáp án đúng (A/B/C/D):</label>
                                <input
                                  type="text"
                                  value={draftAnswer}
                                  onChange={(e) => setDraftAnswer(e.target.value.toUpperCase())}
                                  className="w-full text-xs px-2.5 py-1 rounded-lg border border-emerald-500 font-extrabold uppercase bg-slate-50 dark:bg-slate-800"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-slate-500">Chủ điểm ngữ pháp:</label>
                                <input
                                  type="text"
                                  value={draftGrammar}
                                  onChange={(e) => setDraftGrammar(e.target.value)}
                                  className="w-full text-xs px-2.5 py-1 rounded-lg border bg-slate-50 dark:bg-slate-800"
                                />
                              </div>
                              <div className="col-span-2 sm:col-span-1">
                                <label className="text-[10px] font-semibold text-slate-500">Lời giải thích:</label>
                                <input
                                  type="text"
                                  value={draftExplanation}
                                  onChange={(e) => setDraftExplanation(e.target.value)}
                                  className="w-full text-xs px-2.5 py-1 rounded-lg border bg-slate-50 dark:bg-slate-800"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingRow(null)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                              >
                                Hủy
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveFixedQuestion(inv.rowNumber)}
                                className="btn-glass-primary text-xs !py-1 !px-3 flex items-center gap-1 font-bold"
                              >
                                <Save className="w-3 h-3" />
                                <span>Lưu sửa đổi</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* TABLE OF VALID / WARNING QUESTIONS */}
                {(activeTab === 'all' || activeTab === 'valid' || activeTab === 'warning') && (
                  <div className="space-y-3">
                    {/* Part / Section Filter */}
                    {availableParts.length > 1 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                        <span className="text-[11px] font-bold text-slate-500 shrink-0">Lọc theo phần:</span>
                        <button
                          type="button"
                          onClick={() => setSelectedPartFilter('ALL')}
                          className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition ${
                            selectedPartFilter === 'ALL'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          Tất cả ({validQuestions.length})
                        </button>
                        {availableParts.map((part) => {
                          const count = validQuestions.filter((q) => (q.skill || q.category || 'Chung') === part).length;
                          return (
                            <button
                              key={part}
                              type="button"
                              onClick={() => setSelectedPartFilter(part)}
                              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition ${
                                selectedPartFilter === part
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              {part} ({count})
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[11px]">
                            <tr>
                              <th className="py-2.5 px-3 w-12 text-center">#</th>
                              <th className="py-2.5 px-3 min-w-[240px]">Nội dung câu hỏi</th>
                              <th className="py-2.5 px-3 w-16 text-center">Đáp án</th>
                              <th className="py-2.5 px-3 w-28">Loại</th>
                              <th className="py-2.5 px-3 w-24">Độ khó</th>
                              <th className="py-2.5 px-3 w-28 text-center">Trạng thái</th>
                              <th className="py-2.5 px-3 w-20 text-center">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/40">
                            {validQuestions
                              .filter((q) => {
                                if (activeTab === 'warning' && (!q.warnings || q.warnings.length === 0)) return false;
                                if (selectedPartFilter !== 'ALL') {
                                  const p = q.skill || q.category || 'Chung';
                                  if (p !== selectedPartFilter) return false;
                                }
                                return true;
                              })
                              .map((val, idx) => {
                                const rowId = val.rowNumber || val.questionNumber || idx + 1;
                                const isEditing = editingRow === rowId;
                                const hasWarning = val.warnings && val.warnings.length > 0;

                                return (
                                  <React.Fragment key={`tbl-${val.questionNumber || idx}`}>
                                    <tr
                                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                                        hasWarning ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                                      } ${isEditing ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''}`}
                                    >
                                      <td className="py-2.5 px-3 font-black text-center text-slate-500">
                                        {val.questionNumber || idx + 1}
                                      </td>
                                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                                        <div className="line-clamp-2">{val.questionText}</div>
                                        {val.explanation && (
                                          <div className="text-[10px] text-slate-500 italic line-clamp-1 mt-0.5">
                                            {val.explanation}
                                          </div>
                                        )}
                                      </td>
                                      <td className="py-2.5 px-3 text-center">
                                        <span className="px-2 py-0.5 rounded-md font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                                          {Array.isArray(val.correctAnswer) ? val.correctAnswer.join(', ') : val.correctAnswer}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                                        {val.questionType}
                                      </td>
                                      <td className="py-2.5 px-3">
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                          {val.difficulty}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3 text-center">
                                        {hasWarning ? (
                                          <span
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                                            title={val.warnings?.join('; ')}
                                          >
                                            <AlertTriangle className="w-3 h-3" />
                                            Cảnh báo
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Hợp lệ
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2.5 px-3 text-center">
                                        <button
                                          type="button"
                                          onClick={() => isEditing ? setEditingRow(null) : handleStartEditValid(val, idx)}
                                          className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition ${
                                            isEditing
                                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                                              : 'bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60'
                                          }`}
                                          title="Chỉnh sửa câu hỏi này"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                          <span>{isEditing ? 'Đóng' : 'Sửa'}</span>
                                        </button>
                                      </td>
                                    </tr>

                                    {/* Inline Edit Row for Valid Question */}
                                    {isEditing && (
                                      <tr>
                                        <td colSpan={7} className="p-4 bg-indigo-50/40 dark:bg-slate-800/60 border-y border-indigo-200 dark:border-indigo-900/60">
                                          <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm animate-fade-in">
                                            <div className="font-extrabold text-xs text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                                              <span className="flex items-center gap-1.5">
                                                <Edit2 className="w-3.5 h-3.5" />
                                                <span>Chỉnh sửa nội dung Câu #{val.questionNumber || idx + 1}:</span>
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => setEditingRow(null)}
                                                className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
                                              >
                                                ✕ Hủy
                                              </button>
                                            </div>

                                            <div>
                                              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Nội dung đề bài:</label>
                                              <textarea
                                                value={draftPrompt}
                                                onChange={(e) => setDraftPrompt(e.target.value)}
                                                rows={2}
                                                className="w-full text-xs p-2.5 rounded-xl border mt-0.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                                              />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                              <div>
                                                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Lựa chọn A:</label>
                                                <input
                                                  type="text"
                                                  value={draftOptA}
                                                  onChange={(e) => setDraftOptA(e.target.value)}
                                                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border bg-slate-50 dark:bg-slate-800"
                                                />
                                              </div>
                                              <div>
                                                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Lựa chọn B:</label>
                                                <input
                                                  type="text"
                                                  value={draftOptB}
                                                  onChange={(e) => setDraftOptB(e.target.value)}
                                                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border bg-slate-50 dark:bg-slate-800"
                                                />
                                              </div>
                                              <div>
                                                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Lựa chọn C:</label>
                                                <input
                                                  type="text"
                                                  value={draftOptC}
                                                  onChange={(e) => setDraftOptC(e.target.value)}
                                                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border bg-slate-50 dark:bg-slate-800"
                                                />
                                              </div>
                                              <div>
                                                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Lựa chọn D:</label>
                                                <input
                                                  type="text"
                                                  value={draftOptD}
                                                  onChange={(e) => setDraftOptD(e.target.value)}
                                                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border bg-slate-50 dark:bg-slate-800"
                                                />
                                              </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                              <div>
                                                <label className="text-[10px] font-black text-emerald-600">Đáp án đúng (A / B / C / D):</label>
                                                <input
                                                  type="text"
                                                  value={draftAnswer}
                                                  onChange={(e) => setDraftAnswer(e.target.value.toUpperCase())}
                                                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border-2 border-emerald-500 font-black uppercase bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                                                />
                                              </div>
                                              <div>
                                                <label className="text-[10px] font-semibold text-slate-500">Chủ điểm ngữ pháp:</label>
                                                <input
                                                  type="text"
                                                  value={draftGrammar}
                                                  onChange={(e) => setDraftGrammar(e.target.value)}
                                                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border bg-slate-50 dark:bg-slate-800"
                                                />
                                              </div>
                                              <div>
                                                <label className="text-[10px] font-semibold text-slate-500">Lời giải thích chi tiết:</label>
                                                <input
                                                  type="text"
                                                  value={draftExplanation}
                                                  onChange={(e) => setDraftExplanation(e.target.value)}
                                                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border bg-slate-50 dark:bg-slate-800"
                                                />
                                              </div>
                                            </div>

                                            <div className="flex items-center justify-end gap-2 pt-1">
                                              <button
                                                type="button"
                                                onClick={() => setEditingRow(null)}
                                                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                                              >
                                                Hủy
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleSaveFixedQuestion(rowId)}
                                                className="btn-glass-primary text-xs !py-1.5 !px-4 flex items-center gap-1.5 font-bold shadow-xs"
                                              >
                                                <Save className="w-3.5 h-3.5" />
                                                <span>Lưu cập nhật</span>
                                              </button>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
            <button
              type="button"
              onClick={onClose}
              className="btn-glass-secondary text-xs !py-2 !px-4 font-bold"
            >
              Hủy
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={validQuestions.length === 0}
                onClick={() => {
                  const sanitized = validQuestions.map((q, idx) => ({
                    questionNumber: q.questionNumber || idx + 1,
                    questionText: q.questionText?.trim() || '',
                    questionType: q.questionType || 'MULTIPLE_CHOICE',
                    options: (q.options || []).map((o) => ({ key: o.key, text: o.text?.trim() || '' })),
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation?.trim() || undefined,
                    sourceExplanation: q.sourceExplanation?.trim() || undefined,
                    optionExplanations: q.optionExplanations || undefined,
                    grammarType: q.grammarType?.trim() || undefined,
                    category: q.category || 'Grammar',
                    skill: q.skill || 'Reading',
                    difficulty: q.difficulty || 'MEDIUM',
                    points: q.points || 1.0,
                    tags: Array.isArray(q.tags) ? q.tags : [],
                  }));
                  onConfirmImport(sanitized as any);
                }}
                className="btn-glass-primary text-xs !py-2.5 !px-5 flex items-center gap-1.5 font-bold shadow-lg disabled:opacity-50"
              >
                <span>Nhập {validQuestions.length} câu hợp lệ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

