import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Trash2,
  ArrowLeft,
  FileSpreadsheet,
  Presentation,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Lock,
  ChevronDown,
  ChevronUp,
  FileText,
  Upload,
  Copy,
  Edit2,
  Layers,
  Check,
  AlertTriangle,
  Sliders,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Headphones,
  CheckCircle2,
  Eye,
  EyeOff,
  Filter,
  Plus,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard } from '../../components/common/GlassCard';
import { CustomDropdown } from '../../components/common/CustomDropdown';
import { ToggleSwitch } from '../../components/common/ToggleSwitch';
import { CountryFlag } from '../../components/language/CountryFlag';
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

  // Metadata Collapsible State
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(!examId);

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
      category: 'Part 5',
      skill: 'Reading',
      difficulty: 'MEDIUM',
      points: 1.0,
      tags: [],
    },
  ]);

  // View & Filter modes for Question Management
  const [viewMode, setViewMode] = useState<'compact' | 'expanded'>('compact');
  const [expandedIndices, setExpandedIndices] = useState<Record<number, boolean>>({ 0: true });
  const [selectedPartFilter, setSelectedPartFilter] = useState<string>('ALL');

  // Per-question toggle states for advanced options
  const [showWhyWrongMap, setShowWhyWrongMap] = useState<Record<number, boolean>>({});
  const [showMediaMap, setShowMediaMap] = useState<Record<number, boolean>>({});

  // Import Modal State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importFileType, setImportFileType] = useState<'excel' | 'pptx' | 'csv'>('excel');
  const [validImportQuestions, setValidImportQuestions] = useState<ParsedExamQuestion[]>([]);
  const [invalidImportQuestions, setInvalidImportQuestions] = useState<InvalidExamQuestionRow[]>([]);

  // Distinct parts / categories extracted from questions
  const availableParts = useMemo(() => {
    const parts = new Set<string>();
    questions.forEach((q) => {
      const p = q.section || q.skill || q.category || 'Part 5';
      parts.add(p);
    });
    return Array.from(parts);
  }, [questions]);

  // Validity stats
  const validQuestionsCount = useMemo(() => {
    return questions.filter(
      (q) =>
        q.questionText?.trim() &&
        Array.isArray(q.options) &&
        q.options.filter((o: any) => o.text?.trim()).length >= 2 &&
        q.correctAnswer
    ).length;
  }, [questions]);

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
            if (data.questions.length > 2) {
              setViewMode('compact');
              setExpandedIndices({});
            }
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
    const newQ = {
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
      category: selectedPartFilter !== 'ALL' ? selectedPartFilter : 'Part 5',
      skill: 'Reading',
      difficulty: 'MEDIUM',
      points: 1.0,
      tags: [],
    };
    setQuestions((prev) => [...prev, newQ]);
    setExpandedIndices((prev) => ({ ...prev, [questions.length]: true }));
    setTimeout(() => {
      const el = document.getElementById(`question-card-${questions.length}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleBatchAddQuestions = (count: number) => {
    const startNum = questions.length;
    const newBatch = Array.from({ length: count }, (_, i) => ({
      questionNumber: startNum + i + 1,
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
      category: selectedPartFilter !== 'ALL' ? selectedPartFilter : 'Part 5',
      skill: 'Reading',
      difficulty: 'MEDIUM',
      points: 1.0,
      tags: [],
    }));
    setQuestions((prev) => [...prev, ...newBatch]);
  };

  const handleDuplicateQuestion = (index: number) => {
    const q = questions[index];
    const newQ = {
      ...q,
      questionNumber: questions.length + 1,
      options: (q.options || []).map((o: any) => ({ ...o })),
      optionExplanations: { ...(q.optionExplanations || {}) },
      tags: [...(q.tags || [])],
    };
    setQuestions((prev) => [...prev, newQ]);
    setExpandedIndices((prev) => ({ ...prev, [questions.length]: true }));
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

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    setQuestions((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next.map((q, idx) => ({ ...q, questionNumber: idx + 1 }));
    });
    setExpandedIndices((prev) => ({
      ...prev,
      [targetIndex]: true,
      [index]: false,
    }));
  };

  const handleRemoveEmptyQuestions = () => {
    const nonEmpty = questions.filter((q) => q.questionText && q.questionText.trim() !== '');
    if (nonEmpty.length === 0) {
      alert('Không thể xóa toàn bộ câu hỏi. Vui lòng giữ lại ít nhất 1 câu.');
      return;
    }
    const removedCount = questions.length - nonEmpty.length;
    if (removedCount === 0) {
      alert('Không có câu hỏi trống nào cần xóa.');
      return;
    }
    setQuestions(nonEmpty.map((q, idx) => ({ ...q, questionNumber: idx + 1 })));
    alert(`Đã dọn dẹp ${removedCount} câu hỏi trống.`);
  };

  const handleRenumberQuestions = () => {
    setQuestions((prev) => prev.map((q, idx) => ({ ...q, questionNumber: idx + 1 })));
    alert('Đã đánh lại số thứ tự câu hỏi từ 1 đến ' + questions.length);
  };

  const toggleExpand = (idx: number) => {
    setExpandedIndices((prev) => ({ ...prev, [idx]: !prev[idx] }));
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

  const handleSaveExam = async (status: 'DRAFT' | 'PUBLISHED' = 'PUBLISHED') => {
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề bộ đề thi.');
      setIsMetadataExpanded(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validate that questions have prompt
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText?.trim()) {
        alert(`Câu hỏi ${i + 1} chưa có nội dung đề bài.`);
        setExpandedIndices((prev) => ({ ...prev, [i]: true }));
        const el = document.getElementById(`question-card-${i}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    try {
      setSaving(true);

      // Clean & sanitize questions payload (remove client parsing fields like rowNumber, warnings)
      const cleanQuestions = questions.map((q, idx) => {
        const { rowNumber, warnings, rawRow, errors, ...rest } = q;
        return {
          ...rest,
          questionNumber: Number(q.questionNumber) || idx + 1,
          questionText: q.questionText?.trim() || '',
          questionType: q.questionType || 'MULTIPLE_CHOICE',
          options: (q.options || []).map((o: any) => ({
            key: o.key,
            text: o.text?.trim() || '',
          })),
          correctAnswer: q.correctAnswer,
          explanation: q.explanation?.trim() || undefined,
          sourceExplanation: q.sourceExplanation?.trim() || undefined,
          optionExplanations: q.optionExplanations || undefined,
          grammarType: q.grammarType?.trim() || undefined,
          partOfSpeech: q.partOfSpeech?.trim() || undefined,
          category: q.category || 'Part 5',
          skill: q.skill || 'Reading',
          difficulty: q.difficulty || 'MEDIUM',
          points: Number(q.points) || 1.0,
          audioUrl: q.audioUrl?.trim() || undefined,
          imageUrl: q.imageUrl?.trim() || undefined,
          tags: Array.isArray(q.tags) ? q.tags : [],
        };
      });

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
        questions: cleanQuestions,
      };

      if (examId) {
        await api.put(`/exams/${examId}`, payload);
        alert('Đã cập nhật bộ đề thi thành công!');
      } else {
        await api.post('/exams', payload);
        alert(`Đã lưu và xuất bản bộ đề "${title}" thành công!`);
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
      const filteredPrev = prev.filter((p) => p.questionText && p.questionText.trim() !== '');
      const startNum = filteredPrev.length;
      const renumbered = imported.map((q, idx) => {
        const { rowNumber, warnings, rawRow, errors, ...rest } = q as any;
        return {
          ...rest,
          questionNumber: startNum + idx + 1,
        };
      });
      return [...filteredPrev, ...renumbered];
    });
    setImportModalOpen(false);
    setViewMode('compact');
    setExpandedIndices({});
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pb-28">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/exams')}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
            title="Quay lại danh sách đề thi"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{examId ? 'Chỉnh sửa bộ đề thi' : 'Tạo mới bộ đề thi'}</span>
              <CountryFlag languageId={activeLanguage.id} size="sm" />
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Soạn thảo câu hỏi, tải lên từ Excel/CSV/PowerPoint và xuất bản đề thi trực quan
            </p>
          </div>
        </div>

        {/* Action Controls: File Upload Buttons with descriptive labels and specific tool icons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => document.getElementById('editor-excel-upload')?.click()}
            className="btn-glass-secondary text-xs !py-2.5 !px-3.5 flex items-center gap-2 font-semibold shadow-xs hover:border-emerald-500/50 cursor-pointer"
            title="Tải lên và trộn câu hỏi từ file Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Nhập từ file Excel (.xlsx)</span>
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
            className="btn-glass-secondary text-xs !py-2.5 !px-3.5 flex items-center gap-2 font-semibold shadow-xs hover:border-sky-500/50 cursor-pointer"
            title="Tải lên và trộn câu hỏi từ file CSV (.csv)"
          >
            <FileText className="w-4 h-4 text-sky-500" />
            <span>Nhập từ file CSV (.csv)</span>
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
            className="btn-glass-secondary text-xs !py-2.5 !px-3.5 flex items-center gap-2 font-semibold shadow-xs hover:border-amber-500/50 cursor-pointer"
            title="Tải lên và trích xuất câu hỏi từ bài giảng PowerPoint (.pptx)"
          >
            <Presentation className="w-4 h-4 text-amber-500" />
            <span>Nhập từ PowerPoint (.pptx)</span>
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
            onClick={() => handleSaveExam('PUBLISHED')}
            className="btn-glass-primary text-xs !py-2.5 !px-5 font-bold shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{saving ? 'Đang lưu đề thi...' : 'Lưu & Xuất bản đề thi'}</span>
          </button>
        </div>
      </div>

      {/* 1. Collapsible Metadata Section */}
      <GlassCard className="p-5 sm:p-6 transition-all duration-200">
        <div
          className="flex items-center justify-between cursor-pointer select-none"
          onClick={() => setIsMetadataExpanded(!isMetadataExpanded)}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>1. Cài đặt thông tin đề thi</span>
                {title && (
                  <span className="text-xs font-normal text-slate-500 truncate max-w-xs sm:max-w-md">
                    — {title}
                  </span>
                )}
              </h2>
              {!isMetadataExpanded && (
                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                    <CountryFlag languageId={activeLanguage.id} size="xs" />
                    <span>{examType}</span>
                  </span>
                  <span>•</span>
                  <span>{level}</span>
                  <span>•</span>
                  <span>{durationMinutes} phút</span>
                  <span>•</span>
                  <span>Điểm đạt: {passingScore}%</span>
                  <span>•</span>
                  <span className={isProtected ? 'text-amber-500' : 'text-emerald-500'}>
                    {isProtected ? '🔒 Có mã bảo vệ' : '🌐 Công khai'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
          >
            {isMetadataExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isMetadataExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 mt-4 border-t border-slate-100 dark:border-slate-800/80 animate-fade-in">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tiêu đề bộ đề <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: TOEIC Reading Practice Test 01 (Part 5 & 6)"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border mt-1 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                className="w-full text-xs p-3 rounded-xl border mt-1 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Không gian học tập (Tự động kế thừa)
              </label>
              <div className="flex items-center gap-2.5 h-[38px] px-3.5 rounded-xl border mt-1 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white">
                <CountryFlag languageId={activeLanguage.id} size="sm" />
                <span>{activeLanguage.nativeName} ({activeLanguage.name})</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Loại kỳ thi</label>
              <CustomDropdown
                trigger={
                  <button className="w-full text-xs p-2.5 rounded-xl border mt-1 bg-white dark:bg-slate-900 flex items-center justify-between cursor-pointer">
                    <span className="flex items-center gap-2">
                      <CountryFlag languageId={examType === 'THPT' ? 'vi' : examType === 'HSK' ? 'zh' : examType === 'JLPT' ? 'ja' : examType === 'TOPIK' ? 'ko' : 'en'} size="xs" />
                      <span>{examType}</span>
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                }
                options={[
                  { value: 'TOEIC', label: 'TOEIC', icon: <CountryFlag languageId="en" size="xs" /> },
                  { value: 'IELTS', label: 'IELTS', icon: <CountryFlag languageId="en" size="xs" /> },
                  { value: 'HSK', label: 'HSK (Tiếng Trung)', icon: <CountryFlag languageId="zh" size="xs" /> },
                  { value: 'JLPT', label: 'JLPT (Tiếng Nhật)', icon: <CountryFlag languageId="ja" size="xs" /> },
                  { value: 'TOPIK', label: 'TOPIK (Tiếng Hàn)', icon: <CountryFlag languageId="ko" size="xs" /> },
                  { value: 'THPT', label: 'THPT Quốc Gia', icon: <CountryFlag languageId="vi" size="xs" /> },
                  { value: 'SAT', label: 'SAT', icon: <CountryFlag countryCode="us" size="xs" /> },
                  { value: 'GENERAL_QUIZ', label: 'Quiz Tiếng Anh tổng hợp', icon: <CountryFlag languageId="en" size="xs" /> },
                ]}
                onSelect={(val) => setExamType(val)}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Cấp độ ({activeLanguage.nativeName})
              </label>
              <CustomDropdown
                trigger={
                  <button className="w-full text-xs p-2.5 rounded-xl border mt-1 bg-white dark:bg-slate-900 flex items-center justify-between cursor-pointer">
                    <span>{level || 'Chọn cấp độ...'}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                }
                options={[
                  ...(activeLanguage.supportedLevels || ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).map((lvl) => ({
                    value: lvl,
                    label: `${lvl} — Trình độ ${lvl}`,
                  })),
                  { value: 'Beginner', label: 'Beginner (Sơ cấp)' },
                  { value: 'Intermediate', label: 'Intermediate (Trung cấp)' },
                  { value: 'Advanced', label: 'Advanced (Nâng cao)' },
                ]}
                onSelect={(val) => setLevel(val)}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Thời gian (Phút)
                </label>
                <input
                  type="number"
                  min={1}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 60)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border mt-1 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Điểm đạt (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={passingScore}
                  onChange={(e) => setPassingScore(parseFloat(e.target.value) || 50)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border mt-1 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
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
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border mt-1 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                  placeholder="Nhập mã bảo vệ truy cập..."
                  className="w-full text-xs px-3 py-2 rounded-xl border bg-white dark:bg-slate-900 mt-2"
                />
              )}
            </div>
          </div>
        )}
      </GlassCard>

      {/* 2. Questions Section with Matrix Navigator & Batch Tools */}
      <div className="space-y-4">
        {/* Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <span>2. Danh sách câu hỏi ({questions.length} câu)</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                {validQuestionsCount}/{questions.length} câu hoàn chỉnh
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Nhấp vào số câu trên ma trận hoặc chuyển chế độ để sửa từng câu, từng phần trực quan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="inline-flex p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setViewMode('compact');
                  setExpandedIndices({});
                }}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'compact'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Thu gọn danh sách
              </button>
              <button
                type="button"
                onClick={() => setViewMode('expanded')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'expanded'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Mở rộng tất cả
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddQuestion}
              className="btn-glass-primary text-xs !py-2 !px-4 flex items-center gap-1.5 font-bold shadow-xs cursor-pointer"
            >
              <span>Thêm câu hỏi mới</span>
            </button>
          </div>
        </div>

        {/* Matrix Navigator & Batch Utilities */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Ma trận điều hướng nhanh ({questions.length} câu):</span>
            </span>

            {/* Quick Batch Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleBatchAddQuestions(5)}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-bold text-[11px] transition cursor-pointer"
                title="Tạo nhanh 5 khung câu hỏi để soạn"
              >
                Thêm nhanh 5 câu
              </button>
              <button
                type="button"
                onClick={handleRemoveEmptyQuestions}
                className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 font-bold text-[11px] transition cursor-pointer"
                title="Xóa các câu hỏi chưa nhập nội dung"
              >
                Xóa câu trống
              </button>
              <button
                type="button"
                onClick={handleRenumberQuestions}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 font-bold text-[11px] transition cursor-pointer"
                title="Đánh lại số thứ tự từ 1 đến hết"
              >
                Đánh lại STT
              </button>
            </div>
          </div>

          {/* Matrix Grid */}
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const isFilled = Boolean(
                q.questionText?.trim() &&
                Array.isArray(q.options) &&
                q.options.filter((o: any) => o.text?.trim()).length >= 2 &&
                q.correctAnswer
              );
              const isExpanded = viewMode === 'expanded' || Boolean(expandedIndices[idx]);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setExpandedIndices((prev) => ({ ...prev, [idx]: true }));
                    const el = document.getElementById(`question-card-${idx}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                    isExpanded
                      ? 'ring-2 ring-indigo-500 bg-indigo-600 text-white shadow-xs'
                      : isFilled
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-100'
                  }`}
                  title={`Câu ${idx + 1}: ${isFilled ? 'Đầy đủ' : 'Cần nhập thêm đề/đáp án'}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Part Filter Strip if multiple parts exist */}
          {availableParts.length > 1 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs">
              <span className="text-[11px] font-bold text-slate-500 shrink-0">Lọc phần thi:</span>
              <button
                type="button"
                onClick={() => setSelectedPartFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition cursor-pointer ${
                  selectedPartFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Tất cả ({questions.length})
              </button>
              {availableParts.map((part) => {
                const count = questions.filter(
                  (q) => (q.section || q.skill || q.category || 'Part 5') === part
                ).length;
                return (
                  <button
                    key={part}
                    type="button"
                    onClick={() => setSelectedPartFilter(part)}
                    className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition cursor-pointer ${
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
        </div>

        {/* Question Cards List */}
        {questions
          .map((q, idx) => ({ q, idx }))
          .filter(({ q }) => {
            if (selectedPartFilter === 'ALL') return true;
            const p = q.section || q.skill || q.category || 'Part 5';
            return p === selectedPartFilter;
          })
          .map(({ q, idx }) => {
            const isExpanded = viewMode === 'expanded' || Boolean(expandedIndices[idx]);
            const isFilled = Boolean(
              q.questionText?.trim() &&
              Array.isArray(q.options) &&
              q.options.filter((o: any) => o.text?.trim()).length >= 2 &&
              q.correctAnswer
            );

            return (
              <GlassCard
                key={idx}
                id={`question-card-${idx}`}
                className={`p-4 sm:p-5 transition-all duration-200 space-y-4 ${
                  isExpanded
                    ? 'ring-1 ring-indigo-500/50 shadow-md'
                    : 'hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                      Câu hỏi #{idx + 1}
                    </span>

                    {/* Part badge */}
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                      {q.section || q.skill || q.category || 'Part 5'}
                    </span>

                    {/* Difficulty badge */}
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {q.difficulty || 'MEDIUM'}
                    </span>

                    {isFilled ? (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Hợp lệ
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Chưa xong
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Move Up / Down Buttons */}
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveQuestion(idx, 'up')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Di chuyển câu hỏi lên trên"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === questions.length - 1}
                      onClick={() => handleMoveQuestion(idx, 'down')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Di chuyển câu hỏi xuống dưới"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicateQuestion(idx)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Nhân bản câu hỏi này"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(idx)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      title="Xóa câu hỏi này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleExpand(idx)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition cursor-pointer ml-1"
                    >
                      <Edit2 className="w-3 h-3 text-indigo-500" />
                      <span>{isExpanded ? 'Thu gọn' : 'Sửa câu này'}</span>
                    </button>
                  </div>
                </div>

                {/* COMPACT VIEW (Summary card) */}
                {!isExpanded && (
                  <div className="space-y-3 cursor-pointer" onClick={() => toggleExpand(idx)}>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed line-clamp-2">
                      {q.questionText || <span className="italic text-slate-400">(Chưa có nội dung đề bài - bấm để sửa)</span>}
                    </p>

                    {/* Options summary pills */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {['A', 'B', 'C', 'D'].map((key) => {
                        const opt = (q.options || []).find((o: any) => o.key === key);
                        const isCorrect = q.correctAnswer === key;
                        return (
                          <div
                            key={key}
                            className={`px-3 py-1.5 rounded-xl text-xs flex items-center justify-between border ${
                              isCorrect
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="truncate">
                              <span className="font-black mr-1.5">{key}.</span>
                              {opt?.text || <span className="italic text-slate-400">(Trống)</span>}
                            </span>
                            {isCorrect && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-emerald-600 text-white shrink-0 ml-1">
                                Đáp án đúng
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <p className="text-[11px] text-slate-500 italic line-clamp-1">
                        💡 Giải thích: {q.explanation}
                      </p>
                    )}
                  </div>
                )}

                {/* EXPANDED VIEW (Full intuitive editor) */}
                {isExpanded && (
                  <div className="space-y-4 pt-1 animate-fade-in">
                    {/* Prompt */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Nội dung câu hỏi <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowMediaMap((p) => ({ ...p, [idx]: !p[idx] }))}
                            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>{showMediaMap[idx] || q.imageUrl || q.audioUrl ? 'Đóng Media' : '+ Thêm Ảnh/Âm thanh'}</span>
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={q.questionText}
                        onChange={(e) => handleUpdateQuestion(idx, 'questionText', e.target.value)}
                        placeholder="Nhập nội dung đề bài câu hỏi (hỗ trợ chỗ trống điền từ _____)..."
                        rows={2}
                        className="w-full text-xs p-3 rounded-xl border mt-1 bg-white dark:bg-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Media Attachments (Optional, revealed by toggle) */}
                    {(showMediaMap[idx] || q.imageUrl || q.audioUrl) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 animate-fade-in">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                            <span>URL Hình ảnh câu hỏi (Part 1, Biểu đồ...)</span>
                          </label>
                          <input
                            type="text"
                            value={q.imageUrl || ''}
                            onChange={(e) => handleUpdateQuestion(idx, 'imageUrl', e.target.value)}
                            placeholder="https://example.com/photo.jpg"
                            className="w-full text-xs px-3 py-1.5 rounded-lg border mt-1 bg-white dark:bg-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Headphones className="w-3.5 h-3.5 text-indigo-500" />
                            <span>URL File Audio nghe (Listening Part 1-4)</span>
                          </label>
                          <input
                            type="text"
                            value={q.audioUrl || ''}
                            onChange={(e) => handleUpdateQuestion(idx, 'audioUrl', e.target.value)}
                            placeholder="https://example.com/audio.mp3"
                            className="w-full text-xs px-3 py-1.5 rounded-lg border mt-1 bg-white dark:bg-slate-900"
                          />
                        </div>
                      </div>
                    )}

                    {/* Part, Difficulty & Points */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Phần thi / Part
                        </label>
                        <input
                          type="text"
                          value={q.section || q.skill || q.category || ''}
                          onChange={(e) => {
                            handleUpdateQuestion(idx, 'section', e.target.value);
                            handleUpdateQuestion(idx, 'category', e.target.value);
                          }}
                          placeholder="Part 5, Part 6, Reading..."
                          className="w-full text-xs px-3 py-1.5 rounded-lg border mt-1 bg-white dark:bg-slate-900"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Độ khó
                        </label>
                        <select
                          value={q.difficulty || 'MEDIUM'}
                          onChange={(e) => handleUpdateQuestion(idx, 'difficulty', e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border mt-1 bg-white dark:bg-slate-900 cursor-pointer"
                        >
                          <option value="EASY">Dễ (EASY)</option>
                          <option value="MEDIUM">Trung bình (MEDIUM)</option>
                          <option value="HARD">Khó (HARD)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Điểm số
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={q.points || 1.0}
                          onChange={(e) => handleUpdateQuestion(idx, 'points', parseFloat(e.target.value) || 1.0)}
                          className="w-full text-xs px-3 py-1.5 rounded-lg border mt-1 bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>

                    {/* Options A, B, C, D */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Các phương án lựa chọn:
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowWhyWrongMap((p) => ({ ...p, [idx]: !p[idx] }))}
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                        >
                          {showWhyWrongMap[idx] ? 'Ẩn lý do vì sao chọn/sai' : '+ Thêm giải thích chi tiết cho từng lựa chọn'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {['A', 'B', 'C', 'D'].map((key) => {
                          const opt = (q.options || []).find((o: any) => o.key === key);
                          const isCorrect = q.correctAnswer === key;

                          return (
                            <div
                              key={key}
                              className={`p-3 rounded-2xl border space-y-2 transition ${
                                isCorrect
                                  ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs'
                                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-black text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
                                    isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                  }`}>
                                    {key}
                                  </span>
                                  <span>Lựa chọn {key}</span>
                                </span>

                                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-emerald-600">
                                  <input
                                    type="radio"
                                    name={`correct-${idx}`}
                                    checked={isCorrect}
                                    onChange={() => handleUpdateQuestion(idx, 'correctAnswer', key)}
                                    className="text-emerald-600 cursor-pointer"
                                  />
                                  <span>{isCorrect ? '✓ Đáp án đúng' : 'Chọn đúng'}</span>
                                </label>
                              </div>

                              <input
                                type="text"
                                value={opt?.text || ''}
                                onChange={(e) => handleUpdateOption(idx, key, e.target.value)}
                                placeholder={`Nhập nội dung đáp án ${key}...`}
                                className="w-full text-xs px-3 py-1.5 rounded-lg border bg-slate-50/50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />

                              {showWhyWrongMap[idx] && (
                                <input
                                  type="text"
                                  value={q.optionExplanations?.[key] || ''}
                                  onChange={(e) => handleUpdateWhyWrong(idx, key, e.target.value)}
                                  placeholder={`Vì sao ${key} ${isCorrect ? 'đúng' : 'sai'}? (Tùy chọn)`}
                                  className="w-full text-[11px] px-2.5 py-1 rounded-lg border bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Overall Explanation & Grammar */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Giải thích chi tiết toàn câu
                        </label>
                        <input
                          type="text"
                          value={q.explanation || ''}
                          onChange={(e) => handleUpdateQuestion(idx, 'explanation', e.target.value)}
                          placeholder="Dịch nghĩa và lý giải chi tiết câu..."
                          className="w-full text-xs px-3 py-2 rounded-xl border mt-1 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                          className="w-full text-xs px-3 py-2 rounded-xl border mt-1 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => toggleExpand(idx)}
                        className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer transition"
                      >
                        ✓ Hoàn tất câu này
                      </button>
                    </div>
                  </div>
                )}
              </GlassCard>
            );
          })}

        {/* Bottom Add Question Button */}
        <button
          type="button"
          onClick={handleAddQuestion}
          className="w-full py-4 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-2 transition cursor-pointer bg-white/40 dark:bg-slate-900/40"
        >
          <span>+ Thêm một câu hỏi mới vào bộ đề</span>
        </button>
      </div>

      {/* Floating Sticky Action Bar at the bottom */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-4xl w-[94%] bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-xl border border-slate-700 text-white p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center shrink-0">
            <CountryFlag languageId={activeLanguage.id} size="xs" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate">
              {title || <span className="italic text-slate-400">(Chưa có tiêu đề đề thi)</span>}
            </p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>{questions.length} câu hỏi</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">{validQuestionsCount} câu hợp lệ</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleAddQuestion}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition cursor-pointer"
          >
            + Thêm câu
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveExam('PUBLISHED')}
            className="btn-glass-primary text-xs !py-2 !px-4 font-black shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{saving ? 'Đang lưu...' : 'Lưu & Xuất bản'}</span>
          </button>
        </div>
      </div>

      {/* Import Preview Modal for previewing and editing Excel/PPTX questions before appending */}
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

export default ExamEditorPage;
