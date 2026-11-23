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
  CheckSquare,
  ToggleRight,
  PenLine,
  PlusCircle,
  Eye,
  EyeOff,
  Filter,
  Plus,
  X,
  Lightbulb,
  Globe,
  Download,
  FileCode,
  Link2,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard } from '../../components/common/GlassCard';
import { CustomDropdown } from '../../components/common/CustomDropdown';
import { ToggleSwitch } from '../../components/common/ToggleSwitch';
import { CountryFlag } from '../../components/language/CountryFlag';
import { ExamImportPreviewModal } from '../../components/exams/ExamImportPreviewModal';
import { ExamSmartPasteModal } from '../../components/exams/ExamSmartPasteModal';
import {
  parseAndValidateExamExcel,
  parseAndValidateExamWord,
  parseAndValidateExamJson,
  downloadExamExcelTemplate,
  downloadExamCsvTemplate,
  downloadExamWordTemplate,
  downloadExamJsonTemplate,
  ParsedExamQuestion,
  InvalidExamQuestionRow,
} from '../../utils/examTemplate';
import { parseAndValidateExamPptx, downloadExamPptxTemplate } from '../../utils/examPptxTemplate';
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
  const getInitialExamType = (langId: string) => {
    if (langId === 'ko') return 'TOPIK';
    if (langId === 'ja') return 'JLPT';
    if (langId === 'zh') return 'HSK';
    if (langId === 'vi') return 'THPT';
    return 'TOEIC';
  };

  const getInitialExamLevel = (langId: string) => {
    if (langId === 'ko') return 'TOPIK I - Cấp 1';
    if (langId === 'ja') return 'JLPT N5';
    if (langId === 'zh') return 'HSK 1';
    return 'Intermediate';
  };

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [examType, setExamType] = useState(() => getInitialExamType(activeLanguage.id));
  const [level, setLevel] = useState(() => getInitialExamLevel(activeLanguage.id));

  useEffect(() => {
    if (!examId) {
      setExamType(getInitialExamType(activeLanguage.id));
      setLevel(getInitialExamLevel(activeLanguage.id));
    }
  }, [activeLanguage.id, examId]);
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
  const [mediaSourceTabMap, setMediaSourceTabMap] = useState<Record<number, 'link' | 'upload'>>({});

  // Import & Smart Paste Modal State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [smartPasteModalOpen, setSmartPasteModalOpen] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importFileType, setImportFileType] = useState<'excel' | 'pptx' | 'csv' | 'word' | 'json' | 'text'>('excel');
  const [validImportQuestions, setValidImportQuestions] = useState<ParsedExamQuestion[]>([]);
  const [invalidImportQuestions, setInvalidImportQuestions] = useState<InvalidExamQuestionRow[]>([]);

  // Guidance / Help Modal State
  const [showHelpModal, setShowHelpModal] = useState(false);

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
  const handleEditorFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'excel' | 'pptx' | 'csv' | 'word' | 'json'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportFileType(type);

    try {
      if (type === 'word') {
        const result = await parseAndValidateExamWord(file);
        setValidImportQuestions(result.validQuestions);
        setInvalidImportQuestions(result.invalidQuestions);
        setImportModalOpen(true);
      } else if (type === 'json') {
        const result = await parseAndValidateExamJson(file);
        setValidImportQuestions(result.validQuestions);
        setInvalidImportQuestions(result.invalidQuestions);
        setImportModalOpen(true);
      } else if (type === 'excel' || type === 'csv') {
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

  const handleSmartPasteSuccess = (result: {
    validQuestions: ParsedExamQuestion[];
    invalidQuestions: InvalidExamQuestionRow[];
    sourceText: string;
  }) => {
    if (result.invalidQuestions.length > 0) {
      setImportFileName('Văn bản dán nhanh (Smart Paste)');
      setImportFileType('text');
      setValidImportQuestions(result.validQuestions);
      setInvalidImportQuestions(result.invalidQuestions);
      setImportModalOpen(true);
    } else {
      handleAppendImportedQuestions(result.validQuestions);
    }
  };

  // Add Option to a question (flexible options: A, B, C, D, E, F...)
  const handleAddOptionToQuestion = (qIdx: number) => {
    const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    setQuestions((prev) => {
      const next = [...prev];
      const curOptions = next[qIdx].options || [];
      const nextKey = LETTERS[curOptions.length] || `Opt${curOptions.length + 1}`;
      next[qIdx] = {
        ...next[qIdx],
        options: [...curOptions, { key: nextKey, text: '' }],
      };
      return next;
    });
  };

  // Remove option from question (minimum 2 options)
  const handleRemoveOptionFromQuestion = (qIdx: number, optKey: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      const curOptions = next[qIdx].options || [];
      if (curOptions.length <= 2) {
        alert('Mỗi câu hỏi cần tối thiểu 2 phương án lựa chọn.');
        return prev;
      }
      const filtered = curOptions.filter((o: any) => o.key !== optKey);
      next[qIdx] = {
        ...next[qIdx],
        options: filtered,
        correctAnswer: next[qIdx].correctAnswer === optKey ? (filtered[0]?.key || 'A') : next[qIdx].correctAnswer,
      };
      return next;
    });
  };

  // Batch add questions with specific template (MULTIPLE_CHOICE, TRUE_FALSE, etc.)
  const handleBatchAddCustom = (count: number, qType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_IN_BLANK' = 'MULTIPLE_CHOICE') => {
    const startNum = questions.length;
    const newBatch = Array.from({ length: count }, (_, i) => {
      const num = startNum + i + 1;
      if (qType === 'TRUE_FALSE') {
        return {
          questionNumber: num,
          questionText: '',
          questionType: 'TRUE_FALSE',
          options: [
            { key: 'A', text: 'Đúng (True)' },
            { key: 'B', text: 'Sai (False)' },
          ],
          correctAnswer: 'A',
          explanation: '',
          sourceExplanation: '',
          optionExplanations: { A: '', B: '' },
          grammarType: '',
          category: selectedPartFilter !== 'ALL' ? selectedPartFilter : 'Part 5',
          skill: 'Reading',
          difficulty: 'MEDIUM',
          points: 1.0,
          tags: [],
        };
      }
      return {
        questionNumber: num,
        questionText: '',
        questionType: qType,
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
    });
    setQuestions((prev) => [...prev, ...newBatch]);
  };

  const handleMoreAction = (val: string) => {
    if (val === 'smart_paste') {
      setSmartPasteModalOpen(true);
    } else if (val === 'upload_word') {
      document.getElementById('editor-word-upload')?.click();
    } else if (val === 'upload_excel') {
      document.getElementById('editor-excel-upload')?.click();
    } else if (val === 'upload_pptx') {
      document.getElementById('editor-pptx-upload')?.click();
    } else if (val === 'upload_json') {
      document.getElementById('editor-json-upload')?.click();
    } else if (val === 'upload_csv') {
      document.getElementById('editor-csv-upload')?.click();
    } else if (val === 'add_mc_1') {
      handleBatchAddCustom(1, 'MULTIPLE_CHOICE');
    } else if (val === 'add_tf_1') {
      handleBatchAddCustom(1, 'TRUE_FALSE');
    } else if (val === 'add_fill_1') {
      handleBatchAddCustom(1, 'FILL_IN_BLANK');
    } else if (val === 'add_mc_5') {
      handleBatchAddCustom(5, 'MULTIPLE_CHOICE');
    } else if (val === 'add_mc_10') {
      handleBatchAddCustom(10, 'MULTIPLE_CHOICE');
    } else if (val === 'tmpl_word') {
      downloadExamWordTemplate();
    } else if (val === 'tmpl_excel') {
      downloadExamExcelTemplate('xlsx');
    } else if (val === 'tmpl_csv') {
      downloadExamCsvTemplate();
    } else if (val === 'tmpl_json') {
      downloadExamJsonTemplate();
    } else if (val === 'tmpl_pptx') {
      downloadExamPptxTemplate();
    }
  };

  const handleUpdateQuestionType = (qIdx: number, newType: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      const target = next[qIdx];
      if (newType === 'TRUE_FALSE') {
        next[qIdx] = {
          ...target,
          questionType: 'TRUE_FALSE',
          options: [
            { key: 'A', text: target.options?.[0]?.text || 'Đúng (True)' },
            { key: 'B', text: target.options?.[1]?.text || 'Sai (False)' },
          ],
          correctAnswer: target.correctAnswer === 'B' ? 'B' : 'A',
        };
      } else if (newType === 'MULTIPLE_CHOICE') {
        const curOpts = target.options || [];
        const baseOpts = ['A', 'B', 'C', 'D'].map((k, i) => ({
          key: k,
          text: curOpts[i]?.text || '',
        }));
        next[qIdx] = {
          ...target,
          questionType: 'MULTIPLE_CHOICE',
          options: baseOpts,
          correctAnswer: ['A', 'B', 'C', 'D'].includes(target.correctAnswer) ? target.correctAnswer : 'A',
        };
      } else {
        next[qIdx] = {
          ...target,
          questionType: newType,
        };
      }
      return next;
    });
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

        {/* Action Controls: Unified Add Question with Comprehensive More Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          {/* UNIFIED QUESTION CREATION WITH 'MORE' OPTIONS */}
          <div className="inline-flex items-center bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-600/25 transition">
            <button
              type="button"
              onClick={handleAddQuestion}
              className="text-xs h-10 px-3.5 flex items-center gap-2 font-bold cursor-pointer rounded-l-xl transition hover:bg-emerald-700/80"
              title="Thêm một câu hỏi trắc nghiệm mới để nhập đề thủ công"
            >
              <PlusCircle className="w-4 h-4 text-emerald-200" />
              <span>Thêm câu hỏi</span>
            </button>

            <CustomDropdown
              align="right"
              trigger={
                <button
                  type="button"
                  className="h-10 px-2.5 hover:bg-emerald-700 rounded-r-xl border-l border-emerald-500/50 text-white cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                  title="Tùy chọn cào dán đề, nhập file & tải mẫu (More)"
                >
                  <span>More</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              }
              options={[
                {
                  value: 'smart_paste',
                  label: 'Cào / Dán đề nhanh (Smart Paste)',
                  description: 'Dán thô văn bản từ Word, PDF, Web để tự động bóc tách',
                  icon: Sparkles,
                },
                {
                  value: 'upload_word',
                  label: 'Nhập từ file Word (.docx)',
                  description: 'Trích xuất câu hỏi từ tài liệu Word',
                  icon: FileText,
                },
                {
                  value: 'upload_excel',
                  label: 'Nhập từ file Excel (.xlsx)',
                  description: 'Nạp hàng loạt câu hỏi từ bảng tính Excel',
                  icon: FileSpreadsheet,
                },
                {
                  value: 'upload_pptx',
                  label: 'Nhập từ PowerPoint (.pptx)',
                  description: 'Trích xuất câu hỏi từ slide trình chiếu',
                  icon: Presentation,
                },
                {
                  value: 'upload_json',
                  label: 'Nhập từ file JSON (.json)',
                  description: 'Nạp dữ liệu cấu trúc đề thi JSON',
                  icon: FileCode,
                },
                {
                  value: 'upload_csv',
                  label: 'Nhập từ file CSV (.csv)',
                  description: 'Nạp danh sách câu hỏi định dạng CSV',
                  icon: FileText,
                },
                {
                  value: 'add_mc_1',
                  label: '+1 câu trắc nghiệm (A-D)',
                  description: 'Tạo nhanh 1 câu hỏi 4 lựa chọn',
                  icon: CheckSquare,
                },
                {
                  value: 'add_tf_1',
                  label: '+1 câu Đúng / Sai (True / False)',
                  description: 'Tạo nhanh câu hỏi 2 phương án',
                  icon: ToggleRight,
                },
                {
                  value: 'add_fill_1',
                  label: '+1 câu Điền vào chỗ trống',
                  description: 'Câu hỏi điền khuyết từ vựng / ngữ pháp',
                  icon: PenLine,
                },
                {
                  value: 'add_mc_5',
                  label: '+5 câu trắc nghiệm liên tiếp',
                  description: 'Tạo hàng loạt 5 câu hỏi nhanh',
                  icon: Layers,
                },
                {
                  value: 'add_mc_10',
                  label: '+10 câu trắc nghiệm liên tiếp',
                  description: 'Tạo hàng loạt 10 câu hỏi nhanh',
                  icon: Layers,
                },
                {
                  value: 'tmpl_word',
                  label: 'Tải mẫu Word (.docx)',
                  description: 'Mẫu đề chuẩn định dạng Microsoft Word',
                  icon: Download,
                },
                {
                  value: 'tmpl_excel',
                  label: 'Tải mẫu Excel (.xlsx)',
                  description: 'Mẫu đề chuẩn định dạng Excel',
                  icon: Download,
                },
                {
                  value: 'tmpl_csv',
                  label: 'Tải mẫu CSV (.csv)',
                  description: 'Mẫu đề chuẩn định dạng CSV',
                  icon: Download,
                },
                {
                  value: 'tmpl_json',
                  label: 'Tải mẫu JSON (.json)',
                  description: 'Mẫu đề chuẩn định dạng JSON',
                  icon: Download,
                },
                {
                  value: 'tmpl_pptx',
                  label: 'Tải mẫu PowerPoint (.pptx)',
                  description: 'Mẫu đề chuẩn định dạng PowerPoint',
                  icon: Download,
                },
              ]}
              onSelect={handleMoreAction}
            />
          </div>

          {/* Hidden File Inputs for Import Triggers */}
          <input
            id="editor-word-upload"
            type="file"
            accept=".docx,.doc"
            className="hidden"
            onChange={(e) => handleEditorFileUpload(e, 'word')}
          />
          <input
            id="editor-excel-upload"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => handleEditorFileUpload(e, 'excel')}
          />
          <input
            id="editor-pptx-upload"
            type="file"
            accept=".pptx"
            className="hidden"
            onChange={(e) => handleEditorFileUpload(e, 'pptx')}
          />
          <input
            id="editor-json-upload"
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => handleEditorFileUpload(e, 'json')}
          />
          <input
            id="editor-csv-upload"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => handleEditorFileUpload(e, 'csv')}
          />

          {/* Guidance Help Button */}
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="h-10 px-3.5 rounded-xl btn-glass-secondary text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer text-indigo-600 dark:text-indigo-400"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Hướng Dẫn</span>
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
                  <span className={`inline-flex items-center gap-1 ${isProtected ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {isProtected ? (
                      <>
                        <Lock className="w-3 h-3 shrink-0" />
                        <span>Có mã bảo vệ</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-3 h-3 shrink-0" />
                        <span>Công khai</span>
                      </>
                    )}
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
              className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5 font-bold shadow-md shadow-emerald-600/25 cursor-pointer transition hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm câu hỏi</span>
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
                onClick={() => handleBatchAddCustom(1, 'MULTIPLE_CHOICE')}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-bold text-[11px] transition cursor-pointer"
                title="Tạo thêm 1 câu hỏi trắc nghiệm mới"
              >
                + 1 câu
              </button>
              <button
                type="button"
                onClick={() => handleBatchAddCustom(5, 'MULTIPLE_CHOICE')}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-bold text-[11px] transition cursor-pointer"
                title="Tạo nhanh 5 khung câu hỏi trắc nghiệm A-D để soạn"
              >
                + 5 câu trắc nghiệm
              </button>
              <button
                type="button"
                onClick={() => handleBatchAddCustom(5, 'TRUE_FALSE')}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 font-bold text-[11px] transition cursor-pointer"
                title="Tạo nhanh 5 câu Đúng/Sai"
              >
                + 5 câu Đúng/Sai
              </button>
              <button
                type="button"
                onClick={() => handleBatchAddCustom(10, 'MULTIPLE_CHOICE')}
                className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 hover:bg-purple-100 font-bold text-[11px] transition cursor-pointer"
                title="Tạo nhanh 10 khung câu hỏi để soạn"
              >
                + 10 câu
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 shadow-xs ${
                      isFilled
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                        : 'bg-gradient-to-br from-amber-500 to-orange-500 text-white'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                      Câu hỏi #{idx + 1}
                    </span>

                    {/* Question type badge with distinct colorful icon */}
                    {q.questionType === 'TRUE_FALSE' ? (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/60 flex items-center gap-1 shadow-2xs">
                        <ToggleRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Đúng / Sai</span>
                      </span>
                    ) : q.questionType === 'FILL_IN_BLANK' ? (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/60 flex items-center gap-1 shadow-2xs">
                        <PenLine className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Điền từ</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-300/60 dark:border-indigo-800/60 flex items-center gap-1 shadow-2xs">
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Trắc nghiệm (A-D)</span>
                      </span>
                    )}

                    {/* Part badge */}
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
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
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition"
                      title="Di chuyển câu hỏi lên trên"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === questions.length - 1}
                      onClick={() => handleMoveQuestion(idx, 'down')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition"
                      title="Di chuyển câu hỏi xuống dưới"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicateQuestion(idx)}
                      className="p-1.5 rounded-lg text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer transition"
                      title="Nhân bản câu hỏi này"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(idx)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition"
                      title="Xóa câu hỏi này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleExpand(idx)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ml-1 shadow-xs ${
                        isExpanded
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100'
                          : 'bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60'
                      }`}
                    >
                      <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{isExpanded ? 'Thu gọn' : 'Soạn câu này'}</span>
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
                      <p className="text-[11px] text-slate-500 italic line-clamp-1 flex items-center gap-1">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Giải thích: {q.explanation}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* EXPANDED VIEW (Full intuitive editor) */}
                {isExpanded && (
                  <div className="space-y-4 pt-1 animate-fade-in">
                    {/* Manual Question Format Selector Bar */}
                    <div className="flex items-center justify-between flex-wrap gap-2 p-2.5 rounded-xl bg-indigo-50/50 dark:bg-slate-800/50 border border-indigo-100/80 dark:border-slate-700/60 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                        <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Dạng câu hỏi thủ công:</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 font-semibold text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuestionType(idx, 'MULTIPLE_CHOICE')}
                          className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                            (q.questionType || 'MULTIPLE_CHOICE') === 'MULTIPLE_CHOICE'
                              ? 'bg-indigo-600 text-white font-bold shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span>Trắc nghiệm (A, B, C, D)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuestionType(idx, 'TRUE_FALSE')}
                          className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                            q.questionType === 'TRUE_FALSE'
                              ? 'bg-indigo-600 text-white font-bold shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span>Đúng / Sai (True / False)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuestionType(idx, 'FILL_IN_BLANK')}
                          className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                            q.questionType === 'FILL_IN_BLANK'
                              ? 'bg-indigo-600 text-white font-bold shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span>Điền từ vào chỗ trống</span>
                        </button>
                      </div>
                    </div>

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
                            <span>{showMediaMap[idx] || q.imageUrl || q.audioUrl ? 'Đóng Media' : 'Thêm Ảnh/Âm thanh'}</span>
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
                      <div className="p-3.5 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 space-y-3 animate-fade-in">
                        {/* Tab Switcher: Link vs Direct Upload */}
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-indigo-100/60 dark:border-indigo-900/40">
                          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs font-bold">
                            <button
                              type="button"
                              onClick={() => setMediaSourceTabMap((p) => ({ ...p, [idx]: 'link' }))}
                              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                                (mediaSourceTabMap[idx] || 'link') === 'link'
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                              }`}
                            >
                              <Link2 className="w-3.5 h-3.5" />
                              <span>🔗 Dán Link trực tuyến (Khuyến nghị)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setMediaSourceTabMap((p) => ({ ...p, [idx]: 'upload' }))}
                              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                                mediaSourceTabMap[idx] === 'upload'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                              }`}
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>📁 Tải tệp trực tiếp</span>
                            </button>
                          </div>

                          <span className="text-[11px] font-semibold text-slate-500">
                            {(mediaSourceTabMap[idx] || 'link') === 'link'
                              ? '✨ Không tốn dung lượng máy chủ'
                              : '⚠️ Tối đa 01 bộ đề tải tệp trực tiếp'}
                          </span>
                        </div>

                        {/* TAB 1: Online Link (Default & Recommended) */}
                        {(mediaSourceTabMap[idx] || 'link') === 'link' && (
                          <div className="space-y-3">
                            <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>
                                <strong>Khuyến nghị tiết kiệm dung lượng:</strong> Nhập URL ảnh/âm thanh từ Google Drive, Imgur, Cloudinary, Firebase, hoặc CDN công khai để học viên nghe & xem mượt mà nhất.
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* Image Link Input + Live Thumbnail Preview */}
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                  <span className="flex items-center gap-1">
                                    <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
                                    <span>Link Hình ảnh (URL):</span>
                                  </span>
                                  {q.imageUrl && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQuestion(idx, 'imageUrl', '')}
                                      className="text-rose-500 hover:underline text-[10px] font-bold cursor-pointer"
                                    >
                                      ✕ Gỡ ảnh
                                    </button>
                                  )}
                                </label>
                                <input
                                  type="text"
                                  value={q.imageUrl || ''}
                                  onChange={(e) => handleUpdateQuestion(idx, 'imageUrl', e.target.value)}
                                  placeholder="https://example.com/photo.jpg"
                                  className="w-full text-xs px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-900 font-mono"
                                />

                                {q.imageUrl && (
                                  <div className="mt-1 p-2 rounded-xl border bg-white dark:bg-slate-900 flex flex-col items-center">
                                    <img
                                      src={q.imageUrl}
                                      alt="Preview"
                                      className="max-h-36 rounded-lg object-contain"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                      }}
                                    />
                                    <span className="text-[10px] text-slate-400 mt-1 truncate max-w-full">
                                      Xem trước ảnh: {q.imageUrl}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Audio Link Input + Live Player */}
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                  <span className="flex items-center gap-1">
                                    <Headphones className="w-3.5 h-3.5 text-violet-500" />
                                    <span>Link Âm thanh Audio (URL):</span>
                                  </span>
                                  {q.audioUrl && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQuestion(idx, 'audioUrl', '')}
                                      className="text-rose-500 hover:underline text-[10px] font-bold cursor-pointer"
                                    >
                                      ✕ Gỡ audio
                                    </button>
                                  )}
                                </label>
                                <input
                                  type="text"
                                  value={q.audioUrl || ''}
                                  onChange={(e) => handleUpdateQuestion(idx, 'audioUrl', e.target.value)}
                                  placeholder="https://example.com/audio.mp3"
                                  className="w-full text-xs px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-900 font-mono"
                                />

                                {q.audioUrl && (
                                  <div className="mt-1 p-2 rounded-xl border bg-white dark:bg-slate-900 space-y-1">
                                    <span className="text-[10px] font-bold text-slate-500 block">
                                      Thử nghe file âm thanh:
                                    </span>
                                    <audio controls src={q.audioUrl} className="w-full h-8" preload="none" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* TAB 2: Direct File Upload (Warn 1-exam limit) */}
                        {mediaSourceTabMap[idx] === 'upload' && (
                          <div className="space-y-3">
                            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                <strong className="font-extrabold text-rose-600 dark:text-rose-400">
                                  Giới hạn tài nguyên máy chủ:
                                </strong>
                                <p className="text-[11px] leading-relaxed">
                                  Hệ thống <strong>chỉ cho phép đăng tải file trực tiếp cho tối đa 01 bộ đề</strong> duy nhất. Để tạo nhiều đề hơn, bạn hãy chuyển sang tab <em>"Dán Link trực tuyến"</em> ở trên.
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                  Chọn file ảnh từ máy tính (PNG/JPG):
                                </label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = () => {
                                        handleUpdateQuestion(idx, 'imageUrl', reader.result as string);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                                />
                              </div>

                              <div>
                                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                  Chọn file âm thanh từ máy (MP3/WAV/OGG):
                                </label>
                                <input
                                  type="file"
                                  accept="audio/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = () => {
                                        handleUpdateQuestion(idx, 'audioUrl', reader.result as string);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer"
                                />
                              </div>
                            </div>
                          </div>
                        )}
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

                    {/* Flexible Options Management */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <span>Các phương án lựa chọn ({q.options?.length || 0} phương án):</span>
                          <span className="text-[11px] font-normal text-slate-400">
                            (Chọn nút tròn để chỉ định đáp án đúng)
                          </span>
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleAddOptionToQuestion(idx)}
                            className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Thêm lựa chọn ({String.fromCharCode(65 + (q.options?.length || 0))})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowWhyWrongMap((p) => ({ ...p, [idx]: !p[idx] }))}
                            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                          >
                            {showWhyWrongMap[idx] ? 'Ẩn lý do vì sao chọn/sai' : 'Thêm giải thích từng lựa chọn'}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(q.options || []).map((opt: any) => {
                          const key = opt.key;
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

                                <div className="flex items-center gap-2">
                                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-emerald-600">
                                    <input
                                      type="radio"
                                      name={`correct-${idx}`}
                                      checked={isCorrect}
                                      onChange={() => handleUpdateQuestion(idx, 'correctAnswer', key)}
                                      className="text-emerald-600 cursor-pointer"
                                    />
                                    <span>{isCorrect ? '✓ Đúng' : 'Chọn đúng'}</span>
                                  </label>
                                  {(q.options?.length || 0) > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveOptionFromQuestion(idx, key)}
                                      className="text-slate-400 hover:text-rose-500 p-0.5 rounded cursor-pointer"
                                      title={`Xóa phương án ${key}`}
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
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

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          toggleExpand(idx);
                          handleAddQuestion();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-950 text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-sm ring-1 ring-white/10"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                        <span>Lưu & Thêm câu tiếp theo</span>
                      </button>

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
          <Plus className="w-5 h-5" />
          <span>Thêm một câu hỏi mới vào bộ đề</span>
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/30 cursor-pointer h-10 hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm câu hỏi</span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveExam('PUBLISHED')}
            className="h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs shadow-md border border-slate-600 ring-2 ring-slate-500/20 flex items-center gap-1.5 cursor-pointer transition hover:scale-[1.02]"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
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

      {/* Smart Paste / Raw Text Crawler Modal */}
      <ExamSmartPasteModal
        isOpen={smartPasteModalOpen}
        onClose={() => setSmartPasteModalOpen(false)}
        onSuccess={handleSmartPasteSuccess}
      />

      {/* Help / Guidance Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-md" onClick={() => setShowHelpModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Hướng dẫn tạo Bộ Đề thi</h3>
                  <p className="text-xs text-slate-500">Tìm hiểu cách thiết lập một bộ đề tiêu chuẩn</p>
                </div>
              </div>
              <button onClick={() => setShowHelpModal(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6 text-sm text-slate-600 dark:text-slate-300">
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  1. Thông tin cơ bản
                </h4>
                <p>Điền đầy đủ thông tin mô tả bộ đề. Nếu bạn đặt <strong>Mật khẩu bảo vệ</strong>, học viên sẽ phải nhập đúng mật khẩu để vào thi. Hệ thống hỗ trợ nhiều loại đề thi như TOEIC, JLPT, IELTS, v.v.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  2. Quản lý câu hỏi & Phân Part (Phần thi)
                </h4>
                <p>Sử dụng trường <strong>Phần thi / Part</strong> ở mỗi câu hỏi để chia bộ đề thành các Part khác nhau (VD: Part 1, Part 2, Reading...). Học viên sẽ thấy câu hỏi được nhóm theo các Part này khi làm bài.</p>
                <p>Bấm vào nút <strong>+ Thêm ảnh/Âm thanh</strong> để gắn link file nghe (.mp3) hoặc hình ảnh mô tả cho các câu hỏi Listening hoặc biểu đồ.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-500" />
                  3. Giải thích chuyên sâu (Why Wrong?)
                </h4>
                <p>Bấm <strong>+ Thêm giải thích chi tiết cho từng lựa chọn</strong> để viết lời giải thích vì sao phương án đó sai hoặc đúng. Điều này giúp hệ thống AI Tutor hỗ trợ học viên tốt hơn khi họ làm sai.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-cyan-500" />
                  4. Import Hàng Loạt (Excel/PPT)
                </h4>
                <p>Tiết kiệm thời gian bằng cách sử dụng nút <strong>Import Hàng Loạt</strong> ở trên cùng. Tải file Excel mẫu về, điền dữ liệu theo cột có sẵn, và tải lên hệ thống. Bộ đề của bạn sẽ được tự động tạo.</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button onClick={() => setShowHelpModal(false)} className="btn-glass-primary !px-6 !py-2.5 font-bold">
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamEditorPage;
