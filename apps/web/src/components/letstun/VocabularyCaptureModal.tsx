import React, { useState } from 'react';
import {
  Sparkles, X, Check, BookOpen, Layers, CheckSquare, 
  Square, ArrowRight, Loader2, AlertCircle, FileText, 
  Lightbulb, ExternalLink
} from 'lucide-react';
import api from '../../lib/api';

interface CandidateWord {
  word: string;
  phonetic?: string;
  contextualMeaningVi: string;
  cefrLevel: string;
  contextSentence: string;
  collocations: string[];
  isInVocabulary: boolean;
  selected?: boolean;
}

interface VocabularyCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const VocabularyCaptureModal: React.FC<VocabularyCaptureModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [sourceText, setSourceText] = useState('');
  const [sourceType, setSourceType] = useState('ARTICLE');
  const [sourceTitle, setSourceTitle] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [candidates, setCandidates] = useState<CandidateWord[]>([]);
  const [analyzed, setAnalyzed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!sourceText.trim() || sourceText.trim().length < 20) {
      setErrorMsg('Vui lòng nhập đoạn văn bản tiếng Anh có độ dài tối thiểu 20 ký tự.');
      return;
    }
    setAnalyzing(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res: any = await api.post('/vocabulary/capture/analyze', {
        text: sourceText,
        sourceType,
        sourceTitle: sourceTitle || 'Tài liệu thực tế',
      });
      const data = res?.data || res;
      const items: CandidateWord[] = (data?.candidates || []).map((c: any) => ({
        ...c,
        selected: !c.isInVocabulary, // Auto-select new words
      }));
      setCandidates(items);
      setAnalyzed(true);
      if (items.length === 0) {
        setErrorMsg('Không tìm thấy từ vựng mới nổi bật trong văn bản này.');
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Không thể phân tích ngữ cảnh từ vựng. Vui lòng thử lại.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleToggleCandidate = (index: number) => {
    setCandidates((prev) =>
      prev.map((c, i) => (i === index ? { ...c, selected: !c.selected } : c))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setCandidates((prev) => prev.map((c) => ({ ...c, selected: select })));
  };

  const handleSaveToLearningLoop = async () => {
    const selectedWords = candidates.filter((c) => c.selected);
    if (selectedWords.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất một từ vựng để lưu vào lộ trình.');
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    try {
      await api.post('/vocabulary/capture/save', {
        sourceText,
        sourceType,
        sourceTitle: sourceTitle || 'Tài liệu thực tế',
        selectedWords,
      });
      setSuccessMsg(`Đã kết nối thành công ${selectedWords.length} từ vựng vào vòng lặp trí nhớ LetStuN!`);
      setTimeout(() => {
        if (onSaved) onSaved();
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Không thể lưu từ vựng. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const selectedCount = candidates.filter((c) => c.selected).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 text-slate-200 shadow-2xl animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Real-World Vocabulary Capture
              </h3>
              <p className="text-[11px] text-slate-400">
                Thu thập từ vựng từ email, tin tức, bài đọc và gắn ngữ cảnh thực tế
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content area */}
        <div className="py-4 overflow-y-auto space-y-4 grow pr-1 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2 font-bold">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {!analyzed ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Loại nguồn tài liệu
                  </label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="ARTICLE">Bài báo / Tin tức (Article/News)</option>
                    <option value="EMAIL">Email công việc (Business Email)</option>
                    <option value="PODCAST">Transcript Video / Podcast</option>
                    <option value="MEETING">Biên bản cuộc họp (Meeting Notes)</option>
                    <option value="OTHER">Văn bản tiếng Anh khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Tiêu đề hoặc đường dẫn (tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={sourceTitle}
                    onChange={(e) => setSourceTitle(e.target.value)}
                    placeholder="VD: Bloomberg tech report..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Dán nội dung tiếng Anh thực tế vào đây:
                </label>
                <textarea
                  rows={8}
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder="Paste English paragraphs, work emails, or news excerpts here..."
                  className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-hidden focus:border-indigo-500 font-sans leading-relaxed text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
                <span>
                  Hệ thống AI sẽ tự động: Loại bỏ từ bạn đã thành thạo, trích xuất nghĩa tiếng Việt chuẩn theo đúng ngữ cảnh câu, xác định cấp độ CEFR và các cụm Collocation tự nhiên.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-white text-xs">
                  Phát hiện {candidates.length} từ vựng tiềm năng:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSelectAll(true)}
                    className="text-[11px] text-indigo-400 hover:underline"
                  >
                    Chọn tất cả
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    onClick={() => handleSelectAll(false)}
                    className="text-[11px] text-slate-400 hover:underline"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {candidates.map((c, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleToggleCandidate(idx)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                      c.selected
                        ? 'bg-indigo-950/40 border-indigo-500/50 shadow-xs'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 opacity-70'
                    }`}
                  >
                    <div className="mt-0.5 text-indigo-400">
                      {c.selected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </div>

                    <div className="space-y-1 grow">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm">{c.word}</span>
                        {c.phonetic && (
                          <span className="text-slate-400 font-mono text-[11px]">{c.phonetic}</span>
                        )}
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-400">
                          {c.cefrLevel || 'B1'}
                        </span>
                        {c.isInVocabulary ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-400">
                            Đã trong não bộ
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400">
                            Mới hoàn toàn
                          </span>
                        )}
                      </div>

                      <p className="text-indigo-200 font-medium text-xs">
                        {c.contextualMeaningVi}
                      </p>

                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 italic">
                        "{c.contextSentence}"
                      </div>

                      {c.collocations && c.collocations.length > 0 && (
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                          <span className="font-bold text-slate-500">Collocations:</span>
                          <span className="text-slate-300">{c.collocations.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 shrink-0">
          {!analyzed ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={analyzing || !sourceText.trim()}
                onClick={handleAnalyze}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-indigo-900/30"
              >
                {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Phân tích ngữ cảnh AI</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setAnalyzed(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
              >
                Quay lại sửa văn bản
              </button>
              <button
                type="button"
                disabled={saving || selectedCount === 0}
                onClick={handleSaveToLearningLoop}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-900/30"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Lưu {selectedCount} từ vào lộ trình học</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
