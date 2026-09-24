import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Search,
  Clock,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Play,
  Bookmark,
  Share2,
  FileSpreadsheet,
  Presentation,
  Download,
  Filter,
  Flame,
  Award,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Lock,
  Key,
  Layers,
  HelpCircle,
  Trash2,
  Edit,
  Copy,
  Upload,
  Send,
  Check,
  X,
  FileText,
  AlertCircle,
  Eye,
  User as UserIcon,
  ChevronDown,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard } from '../../components/common/GlassCard';
import { ModalPortal } from '../../components/common/ModalPortal';
import { CustomDropdown } from '../../components/common/CustomDropdown';
import { CommunityCommentSection } from '../../components/community/CommunityCommentSection';
import { ExamImportPreviewModal } from '../../components/exams/ExamImportPreviewModal';
import { AccessKeyManagementModal } from '../../components/community/AccessKeyManagementModal';
import { VerifyAccessKeyModal } from '../../components/community/VerifyAccessKeyModal';
import { confirmModal } from '../../components/common/ConfirmDialog';
import {
  downloadExamExcelTemplate,
  downloadExamCsvTemplate,
  parseAndValidateExamExcel,
  exportExamToExcel,
  ParsedExamQuestion,
  InvalidExamQuestionRow,
} from '../../utils/examTemplate';
import {
  downloadExamPptxTemplate,
  parseAndValidateExamPptx,
} from '../../utils/examPptxTemplate';

import { useLearningContext } from '../../contexts/LearningContext';

export const ExamBankPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isGuest, promptLogin } = useAuth();
  const { activeLanguage } = useLearningContext();

  const [activeTab, setActiveTab] = useState<'explore' | 'my-exams' | 'saved' | 'history' | 'wrong-answers'>('explore');
  const [myExamStatusFilter, setMyExamStatusFilter] = useState<'ALL' | 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED'>('ALL');
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [examType, setExamType] = useState('ALL');
  const [level, setLevel] = useState('ALL');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'attempts'>('popular');

  // Exam Detail Modal state (Blog / Post Detail style)
  const [detailModalExam, setDetailModalExam] = useState<any | null>(null);

  // Modern Upload Dropzone Modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);

  // Import Parser & Preview State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importFileType, setImportFileType] = useState<'excel' | 'pptx' | 'csv'>('excel');
  const [validImportQuestions, setValidImportQuestions] = useState<ParsedExamQuestion[]>([]);
  const [invalidImportQuestions, setInvalidImportQuestions] = useState<InvalidExamQuestionRow[]>([]);
  const [parsingFile, setParsingFile] = useState(false);

  // Password Unlock modal
  const [unlockExam, setUnlockExam] = useState<any | null>(null);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [unlockedExamIds, setUnlockedExamIds] = useState<Record<string, boolean>>({});
  const [pendingExamAction, setPendingExamAction] = useState<'start' | 'like' | 'dislike' | 'duplicate' | null>(null);

  const isExamLocked = (exam: any) => {
    if (!exam) return false;
    const isOwner = Boolean(user?.id && (exam.authorId === user.id || exam.isOwner));
    const isAdmin = Boolean(user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'));
    const isKeyUnlocked = sessionStorage.getItem(`vf_unlocked_EXAM_${exam.id}`) === 'true';
    return Boolean(exam.isProtected && !isOwner && !isAdmin && !unlockedExamIds[exam.id] && !isKeyUnlocked);
  };

  // Exam Access Key Management & Verification State
  const [accessKeyManageExam, setAccessKeyManageExam] = useState<any | null>(null);
  const [verifyAccessKeyExam, setVerifyAccessKeyExam] = useState<any | null>(null);

  const handleContactExamAuthor = (exam: any) => {
    if (isGuest || !user) {
      promptLogin('Đăng nhập để liên hệ với tác giả bộ đề');
      return;
    }
    const targetUserId = exam.authorId || exam.author?.id;
    if (targetUserId === user.id) {
      window.dispatchEvent(
        new CustomEvent('open_vocabflow_chat', {
          detail: {
            context: {
              bankType: 'EXAM',
              bankId: exam.id,
              bankTitle: exam.title,
              bankOwnerId: user.id,
              languageSpaceId: exam.languageId || activeLanguage.id,
            },
          },
        }),
      );
      return;
    }
    window.dispatchEvent(
      new CustomEvent('open_vocabflow_chat', {
        detail: {
          targetUser: {
            id: targetUserId,
            displayName: exam.author?.displayName || 'Tác giả đề thi',
            avatar: exam.author?.avatar,
          },
          context: {
            bankType: 'EXAM',
            bankId: exam.id,
            bankTitle: exam.title,
            bankOwnerId: targetUserId,
            languageSpaceId: exam.languageId || activeLanguage.id,
          },
        },
      }),
    );
  };

  // History & Wrong Answers state
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [wrongAnswersData, setWrongAnswersData] = useState<{ totalWrong: number; groupedByGrammar: Record<string, number>; wrongAnswers: any[] } | null>(null);


  const fetchExams = async () => {
    try {
      setLoading(true);
      if (activeTab === 'explore') {
        const params: any = {};
        if (search.trim()) params.search = search.trim();
        if (examType !== 'ALL') params.examType = examType;
        if (level !== 'ALL') params.level = level;
        if (sortBy) params.sortBy = sortBy;

        const res: any = await api.get('/exams', { params });
        setExams(res?.data?.data || res?.data || res || []);
      } else if (activeTab === 'my-exams') {
        if (!user || user.isAnonymous) {
          setExams([]);
          return;
        }
        const res: any = await api.get('/exams/my-exams');
        setExams(res?.data?.data || res?.data || res || []);
      } else if (activeTab === 'saved') {
        if (!user || user.isAnonymous) {
          setExams([]);
          return;
        }
        const res: any = await api.get('/exams/saved');
        setExams(res?.data?.data || res?.data || res || []);
      } else if (activeTab === 'history') {
        if (!user || user.isAnonymous) return;
        const res: any = await api.get('/exams/history');
        setHistoryList(res?.data?.data || res?.data || res || []);
      } else if (activeTab === 'wrong-answers') {
        if (!user || isGuest) return;
        const res: any = await api.get('/exams/wrong-answers');
        setWrongAnswersData(res?.data?.data || res?.data || res || null);
      }
    } catch (err) {
      console.error('Failed to load exams data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [activeTab, examType, level, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExams();
  };

  const handleToggleLike = async (examId: string) => {
    if (!user || isGuest) {
      promptLogin('Đăng nhập để đánh giá thích bộ đề');
      return;
    }
    const target = exams.find((e) => e.id === examId) || (detailModalExam?.id === examId ? detailModalExam : null);
    if (isExamLocked(target)) {
      setUnlockExam(target);
      setPendingExamAction('like');
      setUnlockPassword('');
      setUnlockError('');
      return;
    }
    try {
      const res: any = await api.post(`/exams/${examId}/like`);
      const data = res?.data?.data || res?.data || res;
      const updateFn = (e: any) =>
        e.id === examId
          ? {
              ...e,
              userLiked: data.liked,
              userDisliked: data.disliked,
              likeCount: data.likeCount,
              dislikeCount: data.dislikeCount,
            }
          : e;

      setExams((prev) => prev.map(updateFn));
      setDetailModalExam((prev: any) => (prev && prev.id === examId ? updateFn(prev) : prev));
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleToggleDislike = async (examId: string) => {
    if (!user || isGuest) {
      promptLogin('Đăng nhập để đánh giá bộ đề');
      return;
    }
    const target = exams.find((e) => e.id === examId) || (detailModalExam?.id === examId ? detailModalExam : null);
    if (isExamLocked(target)) {
      setUnlockExam(target);
      setPendingExamAction('dislike');
      setUnlockPassword('');
      setUnlockError('');
      return;
    }
    try {
      const res: any = await api.post(`/exams/${examId}/dislike`);
      const data = res?.data?.data || res?.data || res;
      const updateFn = (e: any) =>
        e.id === examId
          ? {
              ...e,
              userLiked: data.liked,
              userDisliked: data.disliked,
              likeCount: data.likeCount,
              dislikeCount: data.dislikeCount,
            }
          : e;

      setExams((prev) => prev.map(updateFn));
      setDetailModalExam((prev: any) => (prev && prev.id === examId ? updateFn(prev) : prev));
    } catch (err) {
      console.error('Dislike error:', err);
    }
  };

  const handleToggleSave = async (examId: string) => {
    if (!user || isGuest) {
      promptLogin('Đăng nhập để lưu bộ đề vào danh sách cá nhân');
      return;
    }
    try {
      const res: any = await api.post(`/exams/${examId}/save`);
      const data = res?.data?.data || res?.data || res;
      const updateFn = (e: any) =>
        e.id === examId ? { ...e, userSaved: data.saved } : e;

      setExams((prev) => prev.map(updateFn));
      setDetailModalExam((prev: any) => (prev && prev.id === examId ? updateFn(prev) : prev));

      if (activeTab === 'saved') {
        fetchExams();
      }
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const handleStartExam = async (exam: any) => {
    if (!user || isGuest) {
      promptLogin('Đăng nhập để bắt đầu làm bài thi và lưu lịch sử điểm số');
      return;
    }

    if (isExamLocked(exam)) {
      setUnlockExam(exam);
      setPendingExamAction('start');
      setUnlockPassword('');
      setUnlockError('');
      return;
    }

    try {
      const res: any = await api.post(`/exams/${exam.id}/start`);
      const data = res?.data?.data || res?.data || res;
      navigate(`/exams/session/${data.attemptId}`, { state: { examData: data } });
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể bắt đầu bài thi.');
    }
  };

  const handleUnlockAndStart = async () => {
    if (!unlockExam || !unlockPassword.trim()) return;
    try {
      await api.get(`/exams/${unlockExam.id}`, { params: { password: unlockPassword.trim() } });
      const currentExam = unlockExam;
      const action = pendingExamAction;
      setUnlockedExamIds((prev) => ({ ...prev, [currentExam.id]: true }));

      if (action === 'start' || !action) {
        const res: any = await api.post(`/exams/${currentExam.id}/start`);
        const data = res?.data?.data || res?.data || res;
        setUnlockExam(null);
        setPendingExamAction(null);
        navigate(`/exams/session/${data.attemptId}`, { state: { examData: data } });
      } else {
        setUnlockExam(null);
        setPendingExamAction(null);
        if (action === 'like') {
          handleToggleLike(currentExam.id);
        } else if (action === 'dislike') {
          handleToggleDislike(currentExam.id);
        } else if (action === 'duplicate') {
          handleDuplicateExam(currentExam.id);
        }
      }
    } catch (err: any) {
      setUnlockError(err?.response?.data?.message || 'Mật khẩu bảo vệ không đúng.');
    }
  };

  const handleOpenDetailModal = async (exam: any) => {
    setDetailModalExam(exam);
    try {
      const res: any = await api.get(`/exams/${exam.id}`);
      const data = res?.data?.data || res?.data || res;
      if (data && data.id === exam.id) {
        setDetailModalExam((prev: any) => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.warn('Failed to load full exam detail preview:', err);
    }
  };

  const handleDuplicateExam = async (examId: string) => {
    if (!user || isGuest) {
      promptLogin('Đăng nhập để sao chép bộ đề vào danh sách của bạn');
      return;
    }
    const targetExam = exams.find((e) => e.id === examId) || (detailModalExam?.id === examId ? detailModalExam : null);
    if (targetExam && (targetExam.isOwner || targetExam.authorId === user.id)) {
      alert('Bạn là tác giả của bộ đề này, không cần sao chép!');
      return;
    }
    if (targetExam?.isCloned) {
      alert('Bộ đề này đã có trong danh sách đề thi của bạn!');
      return;
    }
    if (isExamLocked(targetExam)) {
      setUnlockExam(targetExam);
      setPendingExamAction('duplicate');
      setUnlockPassword('');
      setUnlockError('');
      return;
    }
    try {
      const res: any = await api.post(`/exams/${examId}/duplicate`);
      const data = res?.data?.data || res?.data || res;
      if (data?.alreadyCloned) {
        alert(data.message || 'Bộ đề này đã có trong bộ đề thi của bạn.');
      } else {
        alert('Đã sao chép bộ đề về danh sách "Đề thi của tôi" thành công!');
      }
      setExams((prev) =>
        prev.map((e) => (e.id === examId ? { ...e, isCloned: true } : e))
      );
      if (detailModalExam && detailModalExam.id === examId) {
        setDetailModalExam((prev: any) => ({ ...prev, isCloned: true }));
      }
      fetchExams();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể sao chép đề thi.');
    }
  };

  const handleDeleteMyExam = async (examId: string) => {
    const ok = await confirmModal({
      title: 'Xóa vĩnh viễn bộ đề thi',
      message: 'Bạn có chắc chắn muốn xóa vĩnh viễn bộ đề này? Toàn bộ danh sách câu hỏi và kết quả làm bài liên quan sẽ bị gỡ bỏ khỏi hệ thống.',
      type: 'danger',
      confirmText: 'Xóa vĩnh viễn',
      cancelText: 'Giữ lại',
    });
    if (!ok) return;
    try {
      await api.delete(`/exams/${examId}`);
      fetchExams();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể xóa đề thi.');
    }
  };

  const handleSubmitReview = async (examId: string) => {
    if (!user || isGuest) return;
    try {
      await api.post(`/exams/${examId}/submit-review`);
      alert('Đã gửi bộ đề lên hệ thống kiểm duyệt thành công!');
      fetchExams();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể gửi duyệt bộ đề.');
    }
  };

  const handleApproveExam = async (examId: string) => {
    try {
      await api.post(`/exams/${examId}/approve`);
      alert('Đã duyệt và xuất bản bộ đề lên cộng đồng!');
      fetchExams();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể duyệt bộ đề.');
    }
  };

  const handleRejectExam = async (examId: string) => {
    const reason = prompt('Nhập lý do từ chối bộ đề (sẽ hiển thị cho tác giả):');
    if (!reason) return;
    try {
      await api.post(`/exams/${examId}/reject`, { reason });
      alert('Đã từ chối duyệt bộ đề.');
      fetchExams();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể từ chối bộ đề.');
    }
  };

  // Upload and parse file helper
  const processUploadedFile = async (file: File) => {
    setParsingFile(true);
    setImportFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase();
    const fileType: 'excel' | 'pptx' | 'csv' = ext === 'pptx' ? 'pptx' : ext === 'csv' ? 'csv' : 'excel';
    setImportFileType(fileType);

    try {
      if (fileType === 'pptx') {
        const result = await parseAndValidateExamPptx(file);
        setValidImportQuestions(result.validQuestions);
        setInvalidImportQuestions(result.invalidQuestions);
      } else {
        const result = await parseAndValidateExamExcel(file);
        setValidImportQuestions(result.validQuestions);
        setInvalidImportQuestions(result.invalidQuestions);
      }
      setUploadModalOpen(false);
      setSelectedUploadFile(null);
      setImportModalOpen(true);
    } catch (err: any) {
      alert(err?.message || 'Không thể đọc hoặc phân tích file.');
    } finally {
      setParsingFile(false);
    }
  };

  const handleConfirmImport = async (finalQuestions: ParsedExamQuestion[]) => {
    if (!user || isGuest) {
      promptLogin('Đăng nhập để lưu bộ đề từ file import');
      return;
    }

    try {
      const defaultTitle = importFileName.replace(/\.[^/.]+$/, '').replace(/[_.-]+/g, ' ');
      await api.post('/exams', {
        title: defaultTitle,
        description: `Bộ đề được tạo tự động từ file ${importFileName}`,
        examType: 'TOEIC',
        durationMinutes: 60,
        status: 'DRAFT',
        questions: finalQuestions,
      });

      setImportModalOpen(false);
      alert(`Đã nhập thành công ${finalQuestions.length} câu hỏi vào bản nháp bộ đề "${defaultTitle}"!`);
      setActiveTab('my-exams');
      fetchExams();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Lỗi khi tạo bộ đề từ file import.');
    }
  };


  return (
    <div className="space-y-6 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 animate-fade-in">
      {/* Top Banner / Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Exam Bank & Smart Evaluation System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Ngân Hàng Bộ Đề & Thi Thử Cộng Đồng
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/80 leading-relaxed">
              Luyện thi trực tiếp đa định dạng (TOEIC, IELTS, HSK, JLPT, SAT...), chấm điểm chi tiết, giải thích chuyên sâu từng câu sai và liên kết đưa từ vựng vào kho ôn tập cá nhân.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                if (!user || isGuest) {
                  promptLogin('Đăng nhập để tạo bộ đề mới');
                  return;
                }
                navigate('/exams/editor');
              }}
              className="btn-solid-primary text-xs !py-2.5 !px-4 flex items-center gap-2 font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo bộ đề mới</span>
            </button>

            {/* Tải mẫu bộ đề Dropdown */}
            <CustomDropdown
              trigger={
                <button className="btn-glass-secondary text-xs !py-2.5 !px-3.5 flex items-center gap-2 font-semibold">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Tải mẫu bộ đề</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                </button>
              }
              options={[
                {
                  value: 'download_excel',
                  label: 'Mẫu Excel (.xlsx)',
                  icon: FileSpreadsheet,
                },
                {
                  value: 'download_csv',
                  label: 'Mẫu CSV (.csv)',
                  icon: FileText,
                },
                {
                  value: 'download_pptx',
                  label: 'Mẫu PowerPoint (.pptx)',
                  icon: Presentation,
                },
              ]}
              onSelect={(val) => {
                if (val === 'download_excel') downloadExamExcelTemplate();
                else if (val === 'download_csv') downloadExamCsvTemplate();
                else if (val === 'download_pptx') downloadExamPptxTemplate();
              }}
              align="right"
            />
          </div>
        </div>
      </div>


      {/* Main Tabs Navigation */}
      <div className="tab-pill-container self-start overflow-x-auto max-w-full scrollbar-none flex-nowrap">
        <button
          onClick={() => setActiveTab('explore')}
          className={`tab-pill ${activeTab === 'explore' ? 'tab-pill-active' : ''}`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Khám phá bộ đề</span>
          <span className="tab-pill-badge">
            {activeTab === 'explore' ? exams.length : '...'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('my-exams')}
          className={`tab-pill ${activeTab === 'my-exams' ? 'tab-pill-active' : ''}`}
        >
          <Layers className="w-4 h-4" />
          <span>Đề của tôi</span>
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`tab-pill ${activeTab === 'saved' ? 'tab-pill-active' : ''}`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Đề đã lưu</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`tab-pill ${activeTab === 'history' ? 'tab-pill-active' : ''}`}
        >
          <Clock className="w-4 h-4" />
          <span>Lịch sử làm bài</span>
        </button>

        <button
          onClick={() => setActiveTab('wrong-answers')}
          className={`tab-pill ${activeTab === 'wrong-answers' ? 'tab-pill-active' : ''}`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Ôn câu sai</span>
        </button>
      </div>

      {/* FILTER & SEARCH BAR (Available in 'explore' tab) */}
      {activeTab === 'explore' && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm đề theo tên, từ khóa, tag..."
              className="w-full text-xs pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {/* Exam Type Selector */}
            <CustomDropdown
              trigger={
                <button className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border text-xs font-semibold flex items-center justify-between gap-2 min-w-[140px]">
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Kỳ thi: {examType}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
              }
              options={[
                { value: 'ALL', label: 'Tất cả kỳ thi' },
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
            />

            {/* Sort Selector */}
            <CustomDropdown
              trigger={
                <button className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border text-xs font-semibold flex items-center justify-between gap-2 min-w-[150px]">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>Sắp xếp: {sortBy === 'popular' ? 'Phổ biến' : sortBy === 'attempts' ? 'Lượt làm' : 'Mới nhất'}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
              }
              options={[
                { value: 'popular', label: 'Nhiều Like & Yêu thích nhất' },
                { value: 'attempts', label: 'Nhiều lượt làm nhất' },
                { value: 'newest', label: 'Mới đăng gần đây' },
              ]}
              onSelect={(val: any) => setSortBy(val)}
            />
          </div>
        </div>
      )}

      {/* STATUS FILTER FOR MY EXAMS */}
      {activeTab === 'my-exams' && (
        <div className="tab-pill-container self-start overflow-x-auto pb-1 scrollbar-none flex-nowrap max-w-full">
          <span className="text-slate-500 text-[11px] px-2 uppercase tracking-wider self-center">Trạng thái:</span>
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'DRAFT', label: 'Bản nháp' },
            { key: 'PENDING_REVIEW', label: 'Chờ duyệt' },
            { key: 'PUBLISHED', label: 'Đã xuất bản' },
            { key: 'REJECTED', label: 'Bị từ chối' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setMyExamStatusFilter(tab.key as any)}
              className={`tab-pill shrink-0 ${
                myExamStatusFilter === tab.key ? 'tab-pill-active' : ''
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* CONTENT SECTIONS */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-semibold">Đang tải danh sách bộ đề...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: EXPLORE & TAB 2: MY EXAMS & TAB 3: SAVED */}
          {(activeTab === 'explore' || activeTab === 'my-exams' || activeTab === 'saved') && (
            <div>
              {(() => {
                const displayedExams =
                  activeTab === 'my-exams' && myExamStatusFilter !== 'ALL'
                    ? exams.filter((e) => e.status === myExamStatusFilter)
                    : exams;

                if (displayedExams.length === 0) {
                  return (
                    <div className="py-16 text-center space-y-4 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 p-8">
                      <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                      <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                        {activeTab === 'my-exams'
                          ? 'Chưa có bộ đề nào trong danh mục này'
                          : activeTab === 'saved'
                          ? 'Bạn chưa lưu bộ đề nào'
                          : 'Không tìm thấy bộ đề phù hợp'}
                      </h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        {activeTab === 'my-exams'
                          ? 'Tạo bộ đề mới hoặc tải file Excel / PowerPoint / CSV lên để luyện tập và chia sẻ với cộng đồng.'
                          : 'Hãy khám phá các đề thi chất lượng từ cộng đồng và lưu vào đây để làm khi rảnh.'}
                      </p>
                      {activeTab === 'my-exams' && (
                        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                          <button
                            onClick={() => navigate('/exams/editor')}
                            className="btn-glass-primary text-xs !py-2 !px-4 inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tạo bộ đề mới</span>
                          </button>
                          <button
                            onClick={() => setUploadModalOpen(true)}
                            className="btn-glass-secondary text-xs !py-2 !px-4 inline-flex items-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Tải tệp lên</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {displayedExams.map((exam) => {
                      const isOwner = Boolean(user?.id && (exam.authorId === user.id || exam.isOwner));
                      const isCloned = Boolean(exam.isCloned);
                      return (
                        <GlassCard
                          key={exam.id}
                          onClick={() => handleOpenDetailModal(exam)}
                          className="p-5 flex flex-col justify-between space-y-4 hover:shadow-xl hover:border-indigo-400/50 transition group cursor-pointer"
                        >
                          <div className="space-y-3">
                            {/* Top Badges */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                                  {exam.examType}
                                </span>
                                {exam.level && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    {exam.level}
                                  </span>
                                )}
                                {isOwner ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                    Của tôi
                                  </span>
                                ) : isCloned ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                                    Đã có trong bộ đề
                                  </span>
                                ) : null}
                                {exam.status === 'DRAFT' && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                                    Bản nháp
                                  </span>
                                )}
                                {exam.status === 'PENDING_REVIEW' && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                                    Chờ duyệt
                                  </span>
                                )}
                                {exam.status === 'PUBLISHED' && !isOwner && !isCloned && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                                    Đã xuất bản
                                  </span>
                                )}
                                {exam.status === 'REJECTED' && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
                                    Bị từ chối
                                  </span>
                                )}
                              </div>

                              {exam.isProtected && (
                                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500" title="Đề thi có mật mã bảo vệ">
                                  <Lock className="w-3.5 h-3.5" />
                                </div>
                              )}
                            </div>

                            {/* Title & Description */}
                            <div>
                              <h3 className="font-extrabold text-base text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                                {exam.title}
                              </h3>
                              {exam.description && (
                                <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                                  {exam.description}
                                </p>
                              )}
                            </div>

                            {/* Rejection Alert if Rejected */}
                            {exam.status === 'REJECTED' && (
                              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 space-y-0.5">
                                <span className="font-extrabold flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  Lý do từ chối:
                                </span>
                                <p className="line-clamp-2">{exam.rejectionReason || 'Vui lòng kiểm tra lại nội dung câu hỏi hoặc đáp án chưa hợp lệ.'}</p>
                              </div>
                            )}

                            {/* Meta stats bar */}
                            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 pt-1">
                              <div className="flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                <span>{exam.totalQuestions || exam._count?.questions || 0} câu hỏi</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                <span>{exam.durationMinutes} phút</span>
                              </div>
                              {exam.attemptCount > 0 && (
                                <div className="flex items-center gap-1.5 text-slate-400">
                                  <span>{exam.attemptCount} lượt làm</span>
                                </div>
                              )}
                            </div>

                            {/* Author info & quick message */}
                            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100/80 dark:border-slate-800/80">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                                  {exam.author?.displayName?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <span className="truncate text-slate-600 dark:text-slate-400 text-[11px] font-medium">
                                  {exam.author?.displayName || (isOwner ? 'Bạn' : 'Cộng đồng VocalFlow')}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleContactExamAuthor(exam);
                                }}
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                                title={isOwner ? 'Xem tin nhắn kho đề' : 'Nhắn tin với tác giả bộ đề'}
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>{isOwner ? 'Tin nhắn' : 'Nhắn tin'}</span>
                              </button>
                            </div>
                          </div>

                          {/* Card Bottom: Interactions & Action */}
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                            {/* Moderation Action for Author */}
                            {isOwner && (exam.status === 'DRAFT' || exam.status === 'REJECTED') && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSubmitReview(exam.id);
                                }}
                                className="w-full py-1.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-indigo-100"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Gửi kiểm duyệt xuất bản</span>
                              </button>
                            )}

                            {/* Admin Moderation Actions */}
                            {user?.role === 'ADMIN' && exam.status === 'PENDING_REVIEW' && (
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => handleApproveExam(exam.id)}
                                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Duyệt đề</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectExam(exam.id)}
                                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Từ chối</span>
                                </button>
                              </div>
                            )}

                            {/* Community Reactions Bar */}
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-1.5">
                                {/* Like Button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleLike(exam.id);
                                  }}
                                  className={`px-2 py-1 rounded-lg flex items-center gap-1 font-bold transition ${
                                    exam.userLiked
                                      ? 'bg-indigo-600 text-white shadow-xs'
                                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                  }`}
                                >
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                  <span>{exam.likeCount || 0}</span>
                                </button>

                                {/* Dislike Button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleDislike(exam.id);
                                  }}
                                  className={`px-2 py-1 rounded-lg flex items-center gap-1 font-bold transition ${
                                    exam.userDisliked
                                      ? 'bg-rose-600 text-white shadow-xs'
                                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                  }`}
                                >
                                  <ThumbsDown className="w-3.5 h-3.5" />
                                  {exam.dislikeCount > 0 && <span>{exam.dislikeCount}</span>}
                                </button>

                                {/* Comments Button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDetailModalExam(exam);
                                  }}
                                  className="px-2 py-1 rounded-lg flex items-center gap-1 font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>{exam.commentCount || exam._count?.comments || 0}</span>
                                </button>
                              </div>

                              {/* Save Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleSave(exam.id);
                                }}
                                className={`p-1.5 rounded-lg transition ${
                                  exam.userSaved
                                    ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                                title={exam.userSaved ? 'Đã lưu' : 'Lưu bộ đề'}
                              >
                                <Bookmark className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartExam(exam);
                                }}
                                className="btn-glass-primary text-xs !py-2 flex-1 min-w-[120px] flex items-center justify-center gap-1.5 font-bold shadow-md cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Làm đề ngay</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleContactExamAuthor(exam);
                                }}
                                className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                                title={isOwner ? 'Xem các tin nhắn về kho đề này' : 'Nhắn tin với tác giả bộ đề'}
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>{isOwner ? 'Tin nhắn' : 'Nhắn tin'}</span>
                              </button>

                              {isOwner && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAccessKeyManageExam(exam);
                                  }}
                                  className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/80 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                                  title="Quản lý và cấp quyền Access Key cho học viên"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                  <span>Quyền truy cập</span>
                                </button>
                              )}

                              {exam.isProtected && isExamLocked(exam) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setVerifyAccessKeyExam(exam);
                                  }}
                                  className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                                  title="Mở khóa bằng mã Access Key cá nhân"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                  <span>Nhập Key</span>
                                </button>
                              )}

                              {/* More Actions (Fork, Export, Edit/Delete if owner) */}
                              <div onClick={(e) => e.stopPropagation()}>
                                <CustomDropdown
                                  trigger={
                                    <button className="p-2 rounded-xl border bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-500">
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                  }
                                  options={[
                                    ...(isOwner
                                      ? [
                                          { value: 'manage_access', label: 'Quản lý quyền (Access Key)', icon: Key },
                                          { value: 'edit', label: 'Chỉnh sửa đề thi', icon: Edit },
                                          { value: 'export_excel', label: 'Xuất ra Excel (.xlsx)', icon: FileSpreadsheet },
                                          { value: 'delete', label: 'Xóa đề thi', icon: Trash2 },
                                        ]
                                      : [
                                          { value: 'contact_author', label: 'Liên hệ tác giả đề', icon: MessageSquare },
                                          ...(exam.isProtected && isExamLocked(exam)
                                            ? [{ value: 'verify_key', label: 'Mở khóa bằng Access Key', icon: Key }]
                                            : []),
                                          {
                                            value: isCloned ? 'already_cloned' : 'duplicate',
                                            label: isCloned ? 'Đã có trong đề của tôi' : 'Sao chép về đề của tôi',
                                            icon: isCloned ? CheckCircle : Copy,
                                            disabled: isCloned,
                                          },
                                          { value: 'export_excel', label: 'Xuất ra Excel (.xlsx)', icon: FileSpreadsheet },
                                        ]),
                                  ]}
                                  onSelect={(val) => {
                                    if (val === 'manage_access') setAccessKeyManageExam(exam);
                                    else if (val === 'contact_author') handleContactExamAuthor(exam);
                                    else if (val === 'verify_key') setVerifyAccessKeyExam(exam);
                                    else if (val === 'duplicate') handleDuplicateExam(exam.id);
                                    else if (val === 'already_cloned') setActiveTab('my-exams');
                                    else if (val === 'export_excel') exportExamToExcel(exam);
                                    else if (val === 'edit') navigate(`/exams/editor/${exam.id}`);
                                    else if (val === 'delete') handleDeleteMyExam(exam.id);
                                  }}
                                  align="right"
                                />
                              </div>
                            </div>
                          </div>
                        </GlassCard>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}


          {/* TAB 4: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {historyList.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  Chưa có lịch sử làm bài thi nào. Hãy bắt đầu làm một bài thi ở tab Khám phá!
                </div>
              ) : (
                <div className="space-y-3">
                  {historyList.map((att) => (
                    <GlassCard key={att.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                            {att.examType}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {att.examTitle}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500">
                          {new Date(att.submittedAt).toLocaleString('vi-VN')} • Thời gian làm:{' '}
                          {Math.floor(att.durationSeconds / 60)}m {att.durationSeconds % 60}s
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-base font-black text-indigo-600 dark:text-indigo-400">
                            {att.score} / {att.totalPossibleScore}
                          </div>
                          <div className="text-xs font-semibold text-slate-400">
                            {att.percentage}% • {att.correctCount} đúng / {att.wrongCount} sai
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(`/exams/result/${att.id}`)}
                          className="btn-glass-primary text-xs !py-2 !px-3.5"
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: WRONG ANSWERS REVIEW */}
          {activeTab === 'wrong-answers' && (
            <div className="space-y-6">
              {!wrongAnswersData || wrongAnswersData.totalWrong === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs rounded-2xl bg-slate-50 dark:bg-slate-900">
                  Tuyệt vời! Bạn chưa có câu hỏi nào bị sai hoặc chưa từng làm đề.
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Summary bar */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 font-black">
                        {wrongAnswersData.totalWrong}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          Tổng số câu đã từng làm sai
                        </h4>
                        <p className="text-xs text-slate-500">
                          Gom nhóm theo chủ điểm ngữ pháp để ôn tập tập trung
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate('/exams/review-wrong')}
                      className="btn-glass-primary text-xs !py-2 !px-4 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Bắt đầu ôn tất cả câu sai ({wrongAnswersData.totalWrong})</span>
                    </button>
                  </div>

                  {/* Grouped by Grammar Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(wrongAnswersData.groupedByGrammar).map(([grammar, count]) => (
                      <div
                        key={grammar}
                        className="p-4 rounded-2xl border bg-white dark:bg-slate-900 flex items-center justify-between gap-3"
                      >
                        <div>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                            {grammar}
                          </span>
                          <p className="text-[11px] text-slate-400">{count} câu sai</p>
                        </div>
                        <button
                          onClick={() => navigate(`/exams/review-wrong?grammar=${encodeURIComponent(grammar)}`)}
                          className="btn-glass-secondary text-xs !py-1 !px-2.5"
                        >
                          Ôn dạng này
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* EXAM DETAIL MODAL (BLOG / POST DETAIL STYLE) */}
      {detailModalExam && (() => {
        const isOwner = Boolean(user?.id && (detailModalExam.authorId === user.id || detailModalExam.isOwner));
        const isCloned = Boolean(detailModalExam.isCloned);
        const displayTags = (detailModalExam.tags || []).filter(
          (t: string) => !t.startsWith('source:') && !t.startsWith('cloned_from:')
        );

        return (
          <ModalPortal isOpen={Boolean(detailModalExam)} onClose={() => setDetailModalExam(null)}>
            <div
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto"
              onClick={(e) => e.stopPropagation()}
            >
                {/* Header / Cover Banner */}
                <div className="relative p-6 sm:p-8 bg-gradient-to-br from-indigo-900 via-indigo-950 to-purple-950 text-white shrink-0">
                  <button
                    onClick={() => setDetailModalExam(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition z-10"
                    title="Đóng modal"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="space-y-3 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider bg-indigo-500/30 border border-indigo-400/40 text-indigo-200">
                        {detailModalExam.examType}
                      </span>
                      {detailModalExam.level && (
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-white/15 text-white">
                          {detailModalExam.level}
                        </span>
                      )}
                      {detailModalExam.section && (
                        <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-white/10 text-indigo-200">
                          {detailModalExam.section}
                        </span>
                      )}
                      {detailModalExam.languageId && (
                        <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-white/10 text-indigo-200 uppercase">
                          {detailModalExam.languageId}
                        </span>
                      )}
                      {isOwner ? (
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider bg-emerald-500/25 border border-emerald-400/40 text-emerald-200">
                          Của tôi
                        </span>
                      ) : isCloned ? (
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider bg-blue-500/25 border border-blue-400/40 text-blue-200">
                          Đã có trong bộ đề
                        </span>
                      ) : null}
                      {detailModalExam.isProtected && (
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Có mã bảo vệ
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black leading-tight tracking-tight text-white">
                      {detailModalExam.title}
                    </h2>

                    {/* Author & Published Info */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-indigo-200/90 font-medium">
                      <div className="flex items-center gap-2">
                        {detailModalExam.author?.avatar ? (
                          <img
                            src={detailModalExam.author.avatar}
                            alt="Avatar"
                            className="w-6 h-6 rounded-full object-cover border border-white/20"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-indigo-500/40 border border-white/20 flex items-center justify-center font-bold text-xs text-white">
                            {detailModalExam.author?.displayName?.[0]?.toUpperCase() || <UserIcon className="w-3.5 h-3.5" />}
                          </div>
                        )}
                        <span className="font-bold text-white">
                          {detailModalExam.author?.displayName || (isOwner ? 'Bạn' : 'Cộng đồng VocalFlow')}
                        </span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {detailModalExam.createdAt
                            ? new Date(detailModalExam.createdAt).toLocaleDateString('vi-VN')
                            : 'Gần đây'}
                        </span>
                      </div>
                      <span>•</span>
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-[11px] font-semibold">
                        {detailModalExam.status === 'PUBLISHED' ? 'Công khai' : 'Bản nháp'}
                      </span>
                    </div>

                    {/* Tags */}
                    {displayTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {displayTags.map((tag: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-indigo-100 border border-white/15"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 px-6 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Lượt thi</span>
                      <strong className="text-sm font-bold text-slate-900 dark:text-white">
                        {detailModalExam.attemptCount || 0}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-indigo-500" />
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Lượt thích</span>
                      <strong className="text-sm font-bold text-slate-900 dark:text-white">
                        {detailModalExam.likeCount || 0}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ThumbsDown className="w-4 h-4 text-rose-500" />
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Không thích</span>
                      <strong className="text-sm font-bold text-slate-900 dark:text-white">
                        {detailModalExam.dislikeCount || 0}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Bình luận</span>
                      <strong className="text-sm font-bold text-slate-900 dark:text-white">
                        {detailModalExam.commentCount || detailModalExam._count?.comments || 0}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-amber-500" />
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Lưu trữ</span>
                      <strong className="text-sm font-bold text-slate-900 dark:text-white">
                        {detailModalExam.userSaved ? 'Đã lưu' : 'Có thể lưu'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Scrollable Content Body */}
                <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6">
                  {/* Description */}
                  {detailModalExam.description && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Giới thiệu bộ đề</h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {detailModalExam.description}
                      </p>
                    </div>
                  )}

                  {/* Functional Information Grid */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Thông tin chi tiết</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                        <span className="text-[11px] font-semibold text-slate-500 block">Số câu hỏi</span>
                        <span className="text-base font-black text-slate-900 dark:text-white mt-0.5 block">
                          {detailModalExam.totalQuestions || detailModalExam._count?.questions || 0} câu
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                        <span className="text-[11px] font-semibold text-slate-500 block">Thời gian làm</span>
                        <span className="text-base font-black text-slate-900 dark:text-white mt-0.5 block">
                          {detailModalExam.durationMinutes} phút
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                        <span className="text-[11px] font-semibold text-slate-500 block">Tổng điểm</span>
                        <span className="text-base font-black text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                          {detailModalExam.totalScore || 100} điểm
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                        <span className="text-[11px] font-semibold text-slate-500 block">Điểm đạt</span>
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                          {detailModalExam.passingScore || 50} điểm
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sample Questions Preview Section */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Một số câu hỏi mẫu (Preview)</span>
                      </h4>
                      {detailModalExam.questions && detailModalExam.questions.length > 0 && (
                        <span className="text-[11px] font-semibold text-slate-400">
                          Hiển thị {Math.min(3, detailModalExam.questions.length)} / {detailModalExam.totalQuestions || detailModalExam.questions.length} câu
                        </span>
                      )}
                    </div>

                    {isExamLocked(detailModalExam) ? (
                      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
                        <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          <Lock className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h5 className="font-bold text-sm text-slate-900 dark:text-white">Bộ đề có mật khẩu bảo vệ</h5>
                          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                            Nội dung chi tiết các câu hỏi được tác giả bảo mật. Bạn có thể xem bình luận thảo luận bên dưới hoặc nhập mật khẩu xác thực để mở khóa và bắt đầu làm bài.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleStartExam(detailModalExam)}
                          className="btn-glass-primary text-xs !py-2.5 !px-5 inline-flex items-center gap-2 font-bold cursor-pointer"
                        >
                          <Lock className="w-4 h-4" />
                          <span>Nhập mật khẩu mở khóa</span>
                        </button>
                      </div>
                    ) : detailModalExam.questions && detailModalExam.questions.length > 0 ? (
                      <div className="space-y-3">
                        {detailModalExam.questions.slice(0, 3).map((q: any, idx: number) => (
                          <div
                            key={q.id || idx}
                            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold">
                                Câu {q.questionNumber || idx + 1}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {q.grammarType && (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-semibold">
                                    {q.grammarType}
                                  </span>
                                )}
                                {q.difficulty && (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-semibold">
                                    {q.difficulty}
                                  </span>
                                )}
                              </div>
                            </div>

                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                              {q.questionText}
                            </p>

                            {/* Options preview */}
                            {q.options && q.options.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                {q.options.map((opt: any) => (
                                  <div
                                    key={opt.id || opt.key}
                                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/60 text-xs flex items-center gap-2 text-slate-700 dark:text-slate-300"
                                  >
                                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                                      {opt.key}.
                                    </span>
                                    <span className="truncate">{opt.text}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}

                        {detailModalExam.totalQuestions > 3 && (
                          <div className="py-2 text-center text-xs font-semibold text-slate-400">
                            +{detailModalExam.totalQuestions - 3} câu hỏi khác trong bài thi chính thức
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400 border border-dashed rounded-2xl">
                        Bấm "Làm đề ngay" để tải và hoàn thành toàn bộ bài thi.
                      </div>
                    )}
                  </div>

                  {/* Primary & Secondary Action Buttons Bar */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const examToRun = detailModalExam;
                        if (!isExamLocked(examToRun)) {
                          setDetailModalExam(null);
                        }
                        handleStartExam(examToRun);
                      }}
                      className="btn-solid-primary text-sm !py-3.5 !px-6 flex-1 w-full flex items-center justify-center gap-2 font-black cursor-pointer"
                    >
                      {isExamLocked(detailModalExam) ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 fill-current" />
                      )}
                      <span>
                        {isExamLocked(detailModalExam)
                          ? 'XÁC THỰC MẬT KHẨU & VÀO LÀM ĐỀ'
                          : 'LÀM ĐỀ NGAY'}
                      </span>
                    </button>

                    {isOwner ? (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => setAccessKeyManageExam(detailModalExam)}
                          className="btn-glass-secondary text-xs !py-3 !px-4 font-bold flex items-center justify-center gap-1.5 flex-1 sm:flex-initial text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800 cursor-pointer"
                        >
                          <Key className="w-3.5 h-3.5 text-amber-500" />
                          <span>Quản lý quyền</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigate(`/exams/editor/${detailModalExam.id}`);
                          }}
                          className="btn-glass-secondary text-xs !py-3 !px-4 font-bold flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Chỉnh sửa đề</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleDeleteMyExam(detailModalExam.id);
                            setDetailModalExam(null);
                          }}
                          className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition"
                          title="Xóa đề thi của tôi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleContactExamAuthor(detailModalExam)}
                          className="btn-glass-secondary text-xs !py-3 !px-4 font-bold flex items-center justify-center gap-1.5 flex-1 sm:flex-initial text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-800 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Liên hệ tác giả</span>
                        </button>
                        {isExamLocked(detailModalExam) && (
                          <button
                            type="button"
                            onClick={() => setVerifyAccessKeyExam(detailModalExam)}
                            className="btn-glass-secondary text-xs !py-3 !px-4 font-bold flex items-center justify-center gap-1.5 flex-1 sm:flex-initial text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800 cursor-pointer"
                          >
                            <Key className="w-3.5 h-3.5 text-amber-500" />
                            <span>Nhập Access Key</span>
                          </button>
                        )}
                        {isCloned ? (
                          <button
                            type="button"
                            onClick={() => {
                              setDetailModalExam(null);
                              setActiveTab('my-exams');
                            }}
                            className="btn-glass-secondary text-xs !py-3 !px-4 font-bold flex items-center justify-center gap-1.5 flex-1 sm:flex-initial text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-800"
                          >
                            <CheckCircle className="w-4 h-4 text-blue-500" />
                            <span>Đã có trong bộ đề của tôi</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDuplicateExam(detailModalExam.id)}
                            className="btn-glass-secondary text-xs !py-3 !px-4 font-bold flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Sao chép về đề của tôi</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Social Reaction Bar: 👍 Like | 👎 Dislike | 💬 Comment | ↗ Share */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-b border-slate-100 dark:border-slate-800/80 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleLike(detailModalExam.id)}
                        className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition ${
                          detailModalExam.userLiked
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span> {detailModalExam.likeCount || 0}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleDislike(detailModalExam.id)}
                        className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition ${
                          detailModalExam.userDisliked
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        <ThumbsDown className="w-4 h-4" />
                        <span> {detailModalExam.dislikeCount || 0}</span>
                      </button>

                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 px-2">
                        <MessageSquare className="w-4 h-4" />
                        <span> {detailModalExam.commentCount || detailModalExam._count?.comments || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleSave(detailModalExam.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                          detailModalExam.userSaved
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        <Bookmark className="w-4 h-4" />
                        <span>{detailModalExam.userSaved ? 'Đã lưu' : 'Lưu'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.origin + '/exams?exam=' + detailModalExam.id);
                          alert('Đã sao chép liên kết bộ đề vào bộ nhớ tạm!');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition"
                        title="Chia sẻ liên kết đề thi"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>↗ Chia sẻ</span>
                      </button>
                    </div>
                  </div>

                  {/* Embedded Blog-style Comments Section */}
                  <div className="pt-2">
                    <CommunityCommentSection
                      targetType="exam"
                      targetId={detailModalExam.id}
                      isLocked={isExamLocked(detailModalExam)}
                      onRequireUnlock={() => {
                        setUnlockExam(detailModalExam);
                        setPendingExamAction(null);
                        setUnlockPassword('');
                        setUnlockError('');
                      }}
                    />
                  </div>
                </div>
              </div>
          </ModalPortal>
        );
      })()}

      {/* MODERN UPLOAD DROPZONE MODAL */}
      {uploadModalOpen && (
        <ModalPortal isOpen={uploadModalOpen} onClose={() => { setUploadModalOpen(false); setSelectedUploadFile(null); }}>
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      Tạo & nhập bộ đề
                    </h3>
                    <p className="text-xs text-slate-500">
                      Hỗ trợ Excel (.xlsx, .xls), CSV (.csv), PowerPoint (.pptx)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setUploadModalOpen(false);
                    setSelectedUploadFile(null);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) setSelectedUploadFile(file);
                }}
                className={`p-8 rounded-3xl border-2 border-dashed transition text-center space-y-3 cursor-pointer ${
                  dragOver
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:border-indigo-400'
                }`}
                onClick={() => document.getElementById('dropzone-file-input')?.click()}
              >
                <input
                  id="dropzone-file-input"
                  type="file"
                  accept=".xlsx,.xls,.csv,.pptx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setSelectedUploadFile(file);
                    e.target.value = '';
                  }}
                />

                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
                  <Upload className="w-6 h-6" />
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                    Upload exam file
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Excel · CSV · PowerPoint
                  </p>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    className="btn-glass-primary text-xs !py-2 !px-4 inline-flex items-center gap-1.5 font-bold pointer-events-none"
                  >
                    <span>Chọn tệp</span>
                  </button>
                  <p className="text-[11px] text-slate-400 mt-2">hoặc kéo thả file vào đây</p>
                </div>
              </div>

              {/* Selected File Details Box */}
              {selectedUploadFile && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 flex items-center justify-between gap-3 animate-fade-in">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {selectedUploadFile.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {(selectedUploadFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => document.getElementById('dropzone-file-input')?.click()}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
                  >
                    Thay file
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setUploadModalOpen(false);
                    setSelectedUploadFile(null);
                  }}
                  className="btn-glass-secondary text-xs !py-2 !px-4 font-bold"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  disabled={!selectedUploadFile || parsingFile}
                  onClick={() => {
                    if (selectedUploadFile) processUploadedFile(selectedUploadFile);
                  }}
                  className="btn-glass-primary text-xs !py-2 !px-5 font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {parsingFile ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Đang phân tích...</span>
                    </>
                  ) : (
                    <>
                      <span>Tiếp tục kiểm tra</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {/* Quick Template Download Section */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center space-y-1.5">
                <p className="text-[11px] font-semibold text-slate-400">Bạn chưa có file chuẩn? Tải mẫu:</p>
                <div className="flex items-center justify-center gap-4 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <button
                    type="button"
                    onClick={downloadExamExcelTemplate}
                    className="hover:underline flex items-center gap-1"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Excel (.xlsx)
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={downloadExamCsvTemplate}
                    className="hover:underline flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    CSV (.csv)
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={downloadExamPptxTemplate}
                    className="hover:underline flex items-center gap-1"
                  >
                    <Presentation className="w-3.5 h-3.5" />
                    PowerPoint (.pptx)
                  </button>
                </div>
              </div>
            </div>
        </ModalPortal>
      )}

      {/* UNLOCK PASSWORD MODAL */}
      {unlockExam && (
        <ModalPortal isOpen={Boolean(unlockExam)} onClose={() => setUnlockExam(null)}>
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border w-full max-w-sm p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Mở khóa bộ đề thi
                </h3>
                <p className="text-xs text-slate-500">
                  Bộ đề "{unlockExam.title}" được tác giả bảo vệ. Vui lòng nhập mã Access Key riêng được cấp cho bạn.
                </p>
              </div>

              <div>
                <input
                  type="text"
                  value={unlockPassword}
                  onChange={(e) => setUnlockPassword(e.target.value)}
                  placeholder="VD: VF-EXM-XXXX-XXXXXXXXXXXXXXXX"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
                />
                {unlockError && <p className="text-xs text-rose-500 mt-1">{unlockError}</p>}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUnlockExam(null)}
                  className="btn-glass-secondary text-xs !py-2 !px-4"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleUnlockAndStart}
                  className="btn-glass-primary text-xs !py-2 !px-4 font-bold"
                >
                  Bắt đầu làm
                </button>
              </div>
            </div>
        </ModalPortal>
      )}

      {/* IMPORT PREVIEW MODAL */}
      <ExamImportPreviewModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        fileName={importFileName}
        fileType={importFileType}
        validQuestions={validImportQuestions}
        invalidQuestions={invalidImportQuestions}
        onConfirmImport={handleConfirmImport}
      />

      {/* Exam Access Key Management Modal (Owner View) */}
      {accessKeyManageExam && (
        <AccessKeyManagementModal
          isOpen={Boolean(accessKeyManageExam)}
          onClose={() => setAccessKeyManageExam(null)}
          bankType="EXAM"
          bankId={accessKeyManageExam.id}
          bankTitle={accessKeyManageExam.title}
          isProtected={Boolean(accessKeyManageExam.isProtected)}
          onOpenChatWithUser={(targetUserId, targetUserName) => {
            window.dispatchEvent(
              new CustomEvent('open_vocabflow_chat', {
                detail: {
                  targetUser: { id: targetUserId, displayName: targetUserName },
                  context: {
                    bankType: 'EXAM',
                    bankId: accessKeyManageExam.id,
                    bankTitle: accessKeyManageExam.title,
                    bankOwnerId: accessKeyManageExam.authorId,
                    languageSpaceId: accessKeyManageExam.languageId || activeLanguage.id,
                  },
                },
              }),
            );
          }}
        />
      )}

      {/* Student Input Access Key Modal (Guest / Student Unlock) */}
      {verifyAccessKeyExam && (
        <VerifyAccessKeyModal
          isOpen={Boolean(verifyAccessKeyExam)}
          onClose={() => setVerifyAccessKeyExam(null)}
          bankType="EXAM"
          bankId={verifyAccessKeyExam.id}
          bankTitle={verifyAccessKeyExam.title}
          bankOwnerName={verifyAccessKeyExam.author?.displayName}
          onSuccess={() => {
            setUnlockedExamIds((prev) => ({ ...prev, [verifyAccessKeyExam.id]: true }));
            sessionStorage.setItem(`vf_unlocked_EXAM_${verifyAccessKeyExam.id}`, 'true');
            alert(`Đã mở khóa thành công đề thi "${verifyAccessKeyExam.title}"!`);
            handleStartExam(verifyAccessKeyExam);
          }}
          onContactOwner={() => handleContactExamAuthor(verifyAccessKeyExam)}
        />
      )}
    </div>
  );
};

