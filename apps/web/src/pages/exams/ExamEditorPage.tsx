import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  FileSpreadsheet,
  Presentation,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Lock,
  ChevronDown,
  FileText,
  Upload,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard } from '../../components/common/GlassCard';
import { CustomDropdown } from '../../components/common/CustomDropdown';
import { ToggleSwitch } from '../../components/common/ToggleSwitch';
import { ExamImportPreviewModal } from '../../components/exams/ExamImportPreviewModal';
import {
  parseAndValidateExamExcel,
  ParsedExamQuestion,
  InvalidExamQuestionRow,
} from '../../utils/examTemplate';
import { parseAndValidateExamPptx } from '../../utils/examPptxTemplate';
import { useLearningContext } from '../../contexts/LearningContext';

export const ExamEditorPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeLanguage } = useLearningContext();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [examType, setExamType] = useState('TOEIC');
  const [level, setLevel] = useState('Intermediate');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [passingScore, setPassingScore] = useState(50);
  const [isProtected, setIsProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [tags, setTags] = useState('');

  // Questions State
  const [questions, setQuestions] = useState<any[]>([
    {
      questionNumber: 1,
      questionText: '',
      questionType: 'MULTIPLE_CHOICE',
      options: [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' },
      ],
      correctAnswer: 'A',
      explanation: '',
      sourceExplanation: '',
      optionExplanations: { A: '', B: '', C: '', D: '' },
      grammarType: '',
      category: 'Grammar',
      skill: 'Reading',
      difficulty: 'MEDIUM',
      points: 1.0,
      tags: [],
    },
  ]);

  // Import Modal State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importFileType, setImportFileType] = useState<'excel' | 'pptx' | 'csv'>('excel');
  const [validImportQuestions, setValidImportQuestions] = useState<ParsedExamQuestion[]>([]);
  const [invalidImportQuestions, setInvalidImportQuestions] = useState<InvalidExamQuestionRow[]>([]);

  // Load existing exam for editing
  useEffect(() => {
    if (examId) {
      setLoading(true);
      api
        .get(`/exams/${examId}`)
        .then((res: any) => {
          const data = res?.data?.data || res?.data || res;
          setTitle(data.title || '');
          setDescription(data.description || '');
          setExamType(data.examType || 'TOEIC');
          setLevel(data.level || 'Intermediate');
          setDurationMinutes(data.durationMinutes || 60);
          setPassingScore(data.passingScore || 50);
          setIsProtected(Boolean(data.isProtected));
          setTags((data.tags || []).join(', '));
          if (data.questions && data.questions.length > 0) {
            setQuestions(data.questions);
          }
        })
        .catch((err) => {
          alert(err?.response?.data?.message || 'Không thể tải đề thi để chỉnh sửa.');
          navigate('/exams');
        })
        .finally(() => setLoading(false));
    }
  }, [examId]);

  const handleAddQuestion = () => {
    const nextNum = questions.length + 1;
    setQuestions((prev) => [
      ...prev,
      {
        questionNumber: nextNum,
        questionText: '',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          { key: 'A', text: '' },
          { key: 'B', text: '' },
          { key: 'C', text: '' },
          { key: 'D', text: '' },
        ],
        correctAnswer: 'A',
        explanation: '',
        sourceExplanation: '',
        optionExplanations: { A: '', B: '', C: '', D: '' },
        grammarType: '',
        category: 'Grammar',
        skill: 'Reading',
        difficulty: 'MEDIUM',
        points: 1.0,
        tags: [],
      },
    ]);
  };

  const handleDeleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      alert('Bộ đề cần có ít nhất 1 câu hỏi.');
      return;
    }
    setQuestions((prev) =>
      prev.filter((_, idx) => idx !== index).map((q, idx) => ({ ...q, questionNumber: idx + 1 }))
    );
  };

  const handleUpdateQuestion = (index: number, field: string, val: any) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleUpdateOption = (qIndex: number, optKey: string, text: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      const q = { ...next[qIndex] };
      q.options = (q.options || []).map((o: any) => (o.key === optKey ? { ...o, text } : o));
      next[qIndex] = q;
      return next;
    });
  };

  const handleUpdateWhyWrong = (qIndex: number, optKey: string, reason: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      const q = { ...next[qIndex] };
      q.optionExplanations = { ...(q.optionExplanations || {}), [optKey]: reason };
      next[qIndex] = q;
      return next;
    });
  };

  const handleSaveExam = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề bộ đề thi.');
      return;
    }

    // Validate that questions have prompt and at least 2 non-empty options
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText?.trim()) {
        alert(`Câu hỏi ${i + 1} chưa có nội dung đề bài.`);
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        title: title.trim(),
        description: description.trim(),
        examType,
        level,
        languageId: activeLanguage.id,
        durationMinutes,
        passingScore,
        status,
        isProtected,
        password: isProtected ? password : undefined,
        tags: tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
        questions,
      };

      if (examId) {
        await api.put(`/exams/${examId}`, payload);
        alert('Đã cập nhật bộ đề thi thành công!');
      } else {
        await api.post('/exams', payload);
        alert(`Đã tạo bộ đề "${title}" (${status === 'PUBLISHED' ? 'Đã xuất bản' : 'Bản nháp'}) thành công!`);
      }
      navigate('/exams');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu bộ đề.');
    } finally {
      setSaving(false);
    }
  };

  // Import handler for file button inside editor (mix multiple sources)
  const handleEditorFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'excel' | 'pptx' | 'csv') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportFileType(type);

    try {
      if (type === 'excel' || type === 'csv') {
        const result = await parseAndValidateExamExcel(file);
        setValidImportQuestions(result.validQuestions);
        setInvalidImportQuestions(result.invalidQuestions);
        setImportModalOpen(true);
      } else {
        const result = await parseAndValidateExamPptx(file);
        setValidImportQuestions(result.validQuestions);
        setInvalidImportQuestions(result.invalidQuestions);
        setImportModalOpen(true);
      }
    } catch (err: any) {
      alert(err?.message || 'Không thể đọc file.');
    } finally {
      e.target.value = '';
    }
  };

  const handleAppendImportedQuestions = (imported: ParsedExamQuestion[]) => {
    setQuestions((prev) => {
      const startNum = prev.length;
      const renumbered = imported.map((q, idx) => ({
        ...q,
        questionNumber: startNum + idx + 1,
      }));
      // Filter out empty initial question if only 1 exists with empty text
      const filteredPrev = prev.filter((p) => p.questionText && p.questionText.trim() !== '');
      return [...filteredPrev, ...renumbered];
    });
    setImportModalOpen(false);
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/exams')}
            className="p-2 rounded-xl border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {examId ? 'Chỉnh sửa bộ đề thi' : 'Tạo mới bộ đề thi'}
            </h1>
            <p className="text-xs text-slate-500">
              Soạn thảo câu hỏi, trộn file Excel/CSV/PowerPoint, xem trước và lưu nháp hoặc xuất bản cộng đồng
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* File Upload buttons */}
          <button
            type="button"
            onClick={() => document.getElementById('editor-excel-upload')?.click()}
            className="btn-glass-secondary text-xs !py-2 !px-3 flex items-center gap-1.5"
            title="Trộn thêm câu hỏi từ file Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>+ Excel</span>
          </button>
          <input
            id="editor-excel-upload"
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => handleEditorFileUpload(e, 'excel')}
          />

          <button
            type="button"
            onClick={() => document.getElementById('editor-csv-upload')?.click()}
            className="btn-glass-secondary text-xs !py-2 !px-3 flex items-center gap-1.5"
            title="Trộn thêm câu hỏi từ file CSV (.csv)"
          >
            <FileText className="w-3.5 h-3.5 text-sky-500" />
            <span>+ CSV</span>
          </button>
          <input
            id="editor-csv-upload"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => handleEditorFileUpload(e, 'csv')}
          />

          <button
            type="button"
            onClick={() => document.getElementById('editor-pptx-upload')?.click()}
            className="btn-glass-secondary text-xs !py-2 !px-3 flex items-center gap-1.5"
            title="Trộn thêm câu hỏi từ bài giảng PowerPoint (.pptx)"
          >
            <Presentation className="w-3.5 h-3.5 text-amber-500" />
            <span>+ PPTX</span>
          </button>
          <input
            id="editor-pptx-upload"
            type="file"
            accept=".pptx"
            className="hidden"
            onChange={(e) => handleEditorFileUpload(e, 'pptx')}
          />

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveExam('DRAFT')}
            className="btn-glass-secondary text-xs !py-2 !px-4"
          >
            Lưu bản nháp
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveExam('PUBLISHED')}
            className="btn-glass-primary text-xs !py-2 !px-4 font-bold shadow-md flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{saving ? 'Đang lưu...' : 'Xuất bản & Chia sẻ'}</span>
          </button>
        </div>
      </div>

      {/* Basic Metadata Box */}
      <GlassCard className="p-6 space-y-4">
        <h2 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>1. Thông tin tổng quan bộ đề</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tiêu đề bộ đề <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: TOEIC Reading Practice Test 01 (Part 5 & 6)"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border mt-1 bg-white dark:bg-slate-900"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Mô tả chi tiết
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Giới thiệu nội dung, nguồn gốc đề thi, mẹo làm bài..."
              rows={2}
              className="w-full text-xs p-3 rounded-xl border mt-1 bg-white dark:bg-slate-900"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Loại kỳ thi</label>
            <CustomDropdown
              trigger={
                <button className="w-full text-xs p-2.5 rounded-xl border mt-1 bg-white dark:bg-slate-900 flex items-center justify-between">
                  <span>{examType}</span>
                </button>
              }
              options={[
                { value: 'TOEIC', label: 'TOEIC' },
                { value: 'IELTS', label: 'IELTS' },
                { value: 'HSK', label: 'HSK (Tiếng Trung)' },
                { value: 'JLPT', label: 'JLPT (Tiếng Nhật)' },
                { value: 'TOPIK', label: 'TOPIK (Tiếng Hàn)' },
                { value: 'THPT', label: 'THPT Quốc Gia' },
                { value: 'SAT', label: 'SAT' },
                { value: 'GENERAL_QUIZ', label: 'Quiz Tiếng Anh tổng hợp' },
              ]}
              onSelect={(val) => setExamType(val)}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Cấp độ (Level)</label>
            <input
              type="text"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              placeholder="B1-B2 / Band 6.5 / N3 / HSK4..."
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border mt-1 bg-white dark:bg-slate-900"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Thời gian làm bài (Phút)
            </label>
            <input
              type="number"
              min={1}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 60)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border mt-1 bg-white dark:bg-slate-900"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Điểm đạt yêu cầu (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={passingScore}
              onChange={(e) => setPassingScore(parseFloat(e.target.value) || 50)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border mt-1 bg-white dark:bg-slate-900"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Từ khóa Tags (phân cách bằng dấu phẩy)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="toeic, part-5, past-simple, reading..."
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border mt-1 bg-white dark:bg-slate-900"
            />
          </div>

          {/* Password Protection */}
          <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Đặt mã bảo vệ bộ đề thi (Tùy chọn)
                </span>
              </div>
              <ToggleSwitch checked={isProtected} onChange={(v) => setIsProtected(v)} size="sm" />
            </div>

            {isProtected && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mã bảo vệ..."
                className="w-full text-xs px-3 py-2 rounded-xl border bg-white dark:bg-slate-900 mt-2"
              />
            )}
          </div>
        </div>
      </GlassCard>

      {/* Questions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-500" />
            <span>2. Danh sách câu hỏi ({questions.length})</span>
          </h2>

          <button
            type="button"
            onClick={handleAddQuestion}
            className="btn-glass-primary text-xs !py-1.5 !px-3.5 flex items-center gap-1 font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm câu hỏi</span>
          </button>
        </div>

        {questions.map((q, idx) => (
          <GlassCard key={idx} className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Câu hỏi #{idx + 1}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteQuestion(idx)}
                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                title="Xóa câu hỏi này"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Prompt */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Nội dung câu hỏi <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={q.questionText}
                onChange={(e) => handleUpdateQuestion(idx, 'questionText', e.target.value)}
                placeholder="Nhập đề bài câu hỏi..."
                rows={2}
                className="w-full text-xs p-3 rounded-xl border mt-1 bg-white dark:bg-slate-900"
              />
            </div>

            {/* Options A, B, C, D */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Các phương án lựa chọn:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['A', 'B', 'C', 'D'].map((key) => {
                  const opt = (q.options || []).find((o: any) => o.key === key);
                  const isCorrect = q.correctAnswer === key;

                  return (
                    <div
                      key={key}
                      className={`p-3 rounded-2xl border space-y-2 ${
                        isCorrect
                          ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-xs text-indigo-600">Lựa chọn {key}</span>
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-emerald-600">
                          <input
                            type="radio"
                            name={`correct-${idx}`}
                            checked={isCorrect}
                            onChange={() => handleUpdateQuestion(idx, 'correctAnswer', key)}
                            className="text-emerald-600"
                          />
                          <span>Đáp án đúng</span>
                        </label>
                      </div>

                      <input
                        type="text"
                        value={opt?.text || ''}
                        onChange={(e) => handleUpdateOption(idx, key, e.target.value)}
                        placeholder={`Nội dung đáp án ${key}...`}
                        className="w-full text-xs px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-900"
                      />

                      <input
                        type="text"
                        value={q.optionExplanations?.[key] || ''}
                        onChange={(e) => handleUpdateWhyWrong(idx, key, e.target.value)}
                        placeholder={`Tại sao ${key} ${isCorrect ? 'đúng' : 'sai'}? (Tùy chọn)`}
                        className="w-full text-[11px] px-2.5 py-1 rounded-lg border bg-slate-50 dark:bg-slate-800 text-slate-500"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanation & Grammar details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Giải thích chi tiết đáp án
                </label>
                <input
                  type="text"
                  value={q.explanation || ''}
                  onChange={(e) => handleUpdateQuestion(idx, 'explanation', e.target.value)}
                  placeholder="Giải thích vì sao đáp án đúng..."
                  className="w-full text-xs px-3 py-2 rounded-xl border mt-1 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Chủ điểm ngữ pháp
                </label>
                <input
                  type="text"
                  value={q.grammarType || ''}
                  onChange={(e) => handleUpdateQuestion(idx, 'grammarType', e.target.value)}
                  placeholder="Past Simple, Preposition..."
                  className="w-full text-xs px-3 py-2 rounded-xl border mt-1 bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          </GlassCard>
        ))}

        <button
          type="button"
          onClick={handleAddQuestion}
          className="w-full py-4 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm một câu hỏi mới</span>
        </button>
      </div>

      {/* Import Preview Modal for previewing Excel/PPTX before appending */}
      <ExamImportPreviewModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        fileName={importFileName}
        fileType={importFileType}
        validQuestions={validImportQuestions}
        invalidQuestions={invalidImportQuestions}
        onConfirmImport={handleAppendImportedQuestions}
      />
    </div>
  );
};
