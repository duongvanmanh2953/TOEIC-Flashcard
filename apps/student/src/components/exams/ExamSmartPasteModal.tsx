import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  X,
  AlertTriangle,
  CheckCircle,
  Copy,
  Info,
  HelpCircle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';
import {
  parseAndValidateRawText,
  ParsedExamQuestion,
  InvalidExamQuestionRow,
} from '../../utils/examTemplate';

export interface ExamSmartPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: {
    validQuestions: ParsedExamQuestion[];
    invalidQuestions: InvalidExamQuestionRow[];
    sourceText: string;
  }) => void;
}

const SAMPLE_TEMPLATES = {
  standard: `Câu 1: What is the main purpose of the announcement?
A. To introduce a new employee policy
B. To announce the annual company retreat
C. To explain the updated safety guidelines
D. To reschedule the monthly sales meeting
Đáp án: C
Giải thích: Safety guidelines được nhấn mạnh ở đoạn 2.

Câu 2: When will the new policy take effect?
A. Next Monday
*B. At the beginning of next month
C. Immediately after the audit
D. By the end of this year
Giải thích: Dấu * trước phương án B ký hiệu đáp án đúng.`,

  withMedia: `Câu 1: Look at the image and choose the statement that best describes what you see.
[Ảnh: https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800]
[Audio: https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg]
A. A man is typing on a laptop computer.
B. People are walking across a pedestrian bridge.
C. Customers are ordering food at a restaurant counter.
D. The meeting room is completely empty.
Đáp án: A
Giải thích: Người đàn ông trong ảnh đang gõ phím trên máy tính xách tay.

Câu 2: Listen to the audio and answer: What is the speaker asking the listener to do?
[Audio: https://actions.google.com/sounds/v1/transportation/subway_ambient.ogg]
A. Submit the proposal by 5 PM today
B. Sign the confirmation receipt
C. Pick up the package from the reception desk
D. Review the financial report with the team
Đáp án: A
Giải thích: Người nói yêu cầu nộp đề xuất trước 5 giờ chiều.`,

  trueFalse: `Câu 1: The company has reported a 15% increase in annual net profit.
A. Đúng (True)
B. Sai (False)
Đáp án: A
Giải thích: Theo báo cáo quý 4, lợi nhuận ròng tăng chính xác 15%.

Câu 2: All employees are required to work on weekends during peak season.
A. Đúng (True)
B. Sai (False)
Đáp án: B
Giải thích: Chỉ những nhân viên thuộc ca trực đặc biệt mới làm việc cuối tuần.`,
};

export const ExamSmartPasteModal: React.FC<ExamSmartPasteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const [rawText, setRawText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<{
    valid: ParsedExamQuestion[];
    invalid: InvalidExamQuestionRow[];
  } | null>(null);

  const handleParse = () => {
    if (!rawText.trim()) return;
    setParsing(true);
    try {
      const res = parseAndValidateRawText(rawText);
      setParseResult({
        valid: res.validQuestions,
        invalid: res.invalidQuestions,
      });
    } finally {
      setParsing(false);
    }
  };

  const handleApply = () => {
    if (!parseResult) {
      const res = parseAndValidateRawText(rawText);
      onSuccess({
        validQuestions: res.validQuestions,
        invalidQuestions: res.invalidQuestions,
        sourceText: rawText,
      });
    } else {
      onSuccess({
        validQuestions: parseResult.valid,
        invalidQuestions: parseResult.invalid,
        sourceText: rawText,
      });
    }
    onClose();
  };

  const loadSample = (key: keyof typeof SAMPLE_TEMPLATES) => {
    setRawText(SAMPLE_TEMPLATES[key]);
    setParseResult(null);
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-200/60 dark:border-indigo-800/60">
                <Sparkles className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-slate-900 dark:text-white truncate">
                    Cào & Dán đề nhanh thông minh (Smart Paste)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                    Cào tự do
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  Sao chép và dán trực tiếp từ Word, Web, PDF, Chat, tài liệu số vào đây để tự động trích xuất
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Guidance & Sample Templates Toolbar */}
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
              <span className="font-bold text-slate-800 dark:text-slate-200">Dán mẫu thử:</span>
              <button
                type="button"
                onClick={() => loadSample('standard')}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600 transition cursor-pointer font-semibold shadow-2xs"
              >
                Mẫu trắc nghiệm A-D
              </button>
              <button
                type="button"
                onClick={() => loadSample('withMedia')}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600 transition cursor-pointer font-semibold shadow-2xs"
              >
                Mẫu kèm Link Ảnh & Audio
              </button>
              <button
                type="button"
                onClick={() => loadSample('trueFalse')}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600 transition cursor-pointer font-semibold shadow-2xs"
              >
                Mẫu Đúng / Sai
              </button>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>Hỗ trợ thẻ <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">[Ảnh: url]</code> và <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">[Audio: url]</code></span>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Nội dung đề thi dạng văn bản thô (Raw Text):
                </label>
                <span className="text-slate-400 text-[11px]">
                  {rawText.length > 0 ? `${rawText.length} ký tự` : 'Chưa có nội dung'}
                </span>
              </div>
              <textarea
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  setParseResult(null);
                }}
                placeholder={`Dán đề thi của bạn vào đây. Ví dụ:\n\nCâu 1: Nội dung câu hỏi 1...\nA. Phương án A\nB. Phương án B\nC. Phương án C\nD. Phương án D\nĐáp án: B\nGiải thích: Vì phương án B đúng theo ngữ pháp.\n\nCâu 2: Nghe đoạn hội thoại sau...\n[Audio: https://example.com/audio.mp3]\n[Ảnh: https://example.com/photo.jpg]\n*A. Đáp án đúng (đánh dấu sao *)\nB. Phương án khác...`}
                rows={12}
                className="w-full text-xs font-mono p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition leading-relaxed resize-y"
              />
            </div>

            {/* Parse Status Indicator */}
            {parseResult && (
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Kết quả phân tích cú pháp tự động:</span>
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                      ✓ {parseResult.valid.length} câu hợp lệ
                    </span>
                    {parseResult.invalid.length > 0 && (
                      <span className="px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-800">
                        ⚠ {parseResult.invalid.length} câu cần chỉnh sửa
                      </span>
                    )}
                  </div>
                </div>

                {parseResult.valid.length === 0 && parseResult.invalid.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Không tìm thấy câu hỏi nào theo định dạng quy chuẩn. Vui lòng kiểm tra lại tiền tố câu hỏi (như "Câu 1:", "Question 1:", "1.") và các phương án (A. B. C. D.).
                  </p>
                )}

                {/* Quick preview of detected items */}
                {parseResult.valid.length > 0 && (
                  <div className="space-y-1.5">
                    {parseResult.valid.slice(0, 5).map((q, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center text-[10px] shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {q.questionText}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {q.imageUrl && <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold">🖼️ Ảnh</span>}
                          {q.audioUrl && <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-bold">🎧 Audio</span>}
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            Đáp án: {q.correctAnswer}
                          </span>
                        </div>
                      </div>
                    ))}
                    {parseResult.valid.length > 5 && (
                      <p className="text-[11px] text-slate-500 italic text-center pt-1">
                        ... và còn {parseResult.valid.length - 5} câu hỏi khác
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleParse}
              disabled={!rawText.trim() || parsing}
              className="btn-glass-secondary text-xs !py-2.5 !px-4 flex items-center gap-2 font-bold cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>{parsing ? 'Đang phân tích...' : 'Phân tích cú pháp trước'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Đóng
              </button>

              <button
                type="button"
                disabled={!rawText.trim() || parsing || (parseResult !== null && parseResult.valid.length === 0)}
                onClick={handleApply}
                className="btn-glass-primary text-xs !py-2.5 !px-5 flex items-center gap-2 font-black shadow-md cursor-pointer disabled:opacity-50"
              >
                <span>
                  {parseResult && parseResult.valid.length > 0
                    ? `Thêm ${parseResult.valid.length} câu vào đề thi`
                    : 'Phân tích & Thêm vào đề'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
    </ModalPortal>
  );
};
