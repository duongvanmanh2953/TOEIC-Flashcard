import React, { useState, useEffect, useCallback, useTransition } from 'react';
import {
  MessageSquare,
  ThumbsUp,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Send,
  RefreshCw,
  LayoutGrid,
  List,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  User,
  Tag,
  Shield,
  FileText,
  X,
  Bug,
  Lightbulb,
  BookOpen,
  Eye,
} from 'lucide-react';
import api, { extractApiList } from '../../lib/api';
import { useTranslation } from '../../i18n';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { getSocket } from '../../lib/socket';

export interface FeedbackUser {
  id: string;
  email: string;
  displayName: string | null;
  role?: string;
}

export interface FeedbackItem {
  id: string;
  userId: string;
  type:
    | 'FEATURE_REQUEST'
    | 'BUG_REPORT'
    | 'CONTENT_CORRECTION'
    | 'VOCABULARY_SUGGESTION'
    | 'UX_FEEDBACK'
    | 'GENERAL';
  title: string;
  description: string;
  status:
    | 'NEW'
    | 'ACKNOWLEDGED'
    | 'UNDER_REVIEW'
    | 'PLANNED'
    | 'IN_PROGRESS'
    | 'RESOLVED'
    | 'DECLINED'
    | 'DUPLICATE';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  votesCount?: number;
  adminReply: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  user?: FeedbackUser;
  _count?: {
    votes: number;
  };
}

export const AdminFeedbackPage: React.FC = () => {
  const { t, locale } = useTranslation();
  const [, startTransition] = useTransition();

  // Data & State
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Status counts
  const [statusCounts, setStatusCounts] = useState<{
    new: number;
    underReview: number;
    planned: number;
    inProgress: number;
    resolved: number;
  }>({ new: 0, underReview: 0, planned: 0, inProgress: 0, resolved: 0 });

  // State flags
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Selected Detail Modal
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [internalNotesText, setInternalNotesText] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Main fetch function with comprehensive pipeline tracing
  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);
    setErrorDetail(null);

    try {
      const params: Record<string, any> = {
        page,
        limit: pageSize,
      };

      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (typeFilter !== 'ALL') params.type = typeFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (debouncedSearch) params.search = debouncedSearch;

      // Try primary endpoint /admin/feedback first, fallback to /feedback/admin
      let res: any;
      try {
        res = await api.get('/admin/feedback', { params });
      } catch {
        res = await api.get('/feedback/admin', { params });
      }

      const extracted = extractApiList<FeedbackItem>(res);
      setFeedbacks(extracted.items || []);
      setTotal(extracted.total ?? extracted.items.length);
      setTotalPages(extracted.totalPages || Math.ceil((extracted.total || 1) / pageSize) || 1);

      if (extracted.counts) {
        setStatusCounts(extracted.counts);
      }
    } catch (err: any) {
      console.error('[AdminFeedbackPage] GET failed:', err);
      setError(locale === 'vi' ? 'Không thể tải danh sách ý kiến đóng góp.' : 'Unable to load feedback submissions.');
      setErrorDetail(err?.message || (typeof err === 'string' ? err : JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, typeFilter, priorityFilter, debouncedSearch, locale]);

  // Fetch when filters or pagination changes
  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  // Real-time socket sync: update list when learner submits feedback
  useEffect(() => {
    const socket = getSocket();

    const handleAdminEvent = (event: any) => {
      if (event?.type === 'NEW_FEEDBACK' || event?.type === 'NEW_BUG_REPORT') {
        startTransition(() => {
          fetchFeedback();
        });
      }
    };

    socket.on('admin_event:new', handleAdminEvent);
    socket.on('admin_badge_update', fetchFeedback);

    return () => {
      socket.off('admin_event:new', handleAdminEvent);
      socket.off('admin_badge_update', fetchFeedback);
    };
  }, [fetchFeedback]);

  // Status update mutation
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setSubmittingAction(true);
    setActionSuccess(null);
    try {
      await api.patch(`/admin/feedback/${id}/status`, { status: newStatus });
      setFeedbacks((prev) => prev.map((f) => (f.id === id ? { ...f, status: newStatus as any } : f)));
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem((prev) => (prev ? { ...prev, status: newStatus as any } : null));
      }
      setActionSuccess(locale === 'vi' ? 'Đã cập nhật trạng thái thành công!' : 'Status updated successfully!');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to update status:', err);
      // Fallback endpoint
      try {
        await api.patch(`/feedback/admin/${id}/status`, { status: newStatus });
        setFeedbacks((prev) => prev.map((f) => (f.id === id ? { ...f, status: newStatus as any } : f)));
      } catch (err2) {
        console.error('Fallback update status failed:', err2);
      }
    } finally {
      setSubmittingAction(false);
    }
  };

  // Public reply mutation
  const handleSendPublicReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !replyText.trim()) return;

    setSubmittingAction(true);
    setActionSuccess(null);
    try {
      await api.post(`/admin/feedback/${selectedItem.id}/reply`, {
        adminReply: replyText.trim(),
      });

      const updatedStatus = selectedItem.status === 'NEW' ? 'ACKNOWLEDGED' : selectedItem.status;
      setFeedbacks((prev) =>
        prev.map((f) =>
          f.id === selectedItem.id ? { ...f, adminReply: replyText.trim(), status: updatedStatus as any } : f
        )
      );
      setSelectedItem((prev) =>
        prev ? { ...prev, adminReply: replyText.trim(), status: updatedStatus as any } : null
      );
      setActionSuccess(locale === 'vi' ? 'Đã gửi phản hồi và gửi thông báo tới học viên!' : 'Reply sent to user!');
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Internal notes mutation
  const handleSaveInternalNotes = async () => {
    if (!selectedItem) return;
    setSubmittingAction(true);
    try {
      await api.patch(`/admin/feedback/${selectedItem.id}/status`, {
        status: selectedItem.status,
        adminNotes: internalNotesText.trim(),
      });
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === selectedItem.id ? { ...f, adminNotes: internalNotesText.trim() } : f))
      );
      setSelectedItem((prev) => (prev ? { ...prev, adminNotes: internalNotesText.trim() } : null));
      setActionSuccess(locale === 'vi' ? 'Đã lưu ghi chú nội bộ!' : 'Internal notes saved!');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to save internal notes:', err);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setPriorityFilter('ALL');
    setSearchQuery('');
    setPage(1);
  };

  // Helper Badge Renderers
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/40">
            {locale === 'vi' ? 'Đã giải quyết' : 'Resolved'}
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300/40">
            {locale === 'vi' ? 'Đang triển khai' : 'In Progress'}
          </span>
        );
      case 'PLANNED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300/40">
            {locale === 'vi' ? 'Lên kế hoạch' : 'Planned'}
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/40">
            {locale === 'vi' ? 'Đang xem xét' : 'Under Review'}
          </span>
        );
      case 'ACKNOWLEDGED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-300/40">
            {locale === 'vi' ? 'Đã ghi nhận' : 'Acknowledged'}
          </span>
        );
      case 'DECLINED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300/40">
            {locale === 'vi' ? 'Đã từ chối' : 'Declined'}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-300/40">
            {locale === 'vi' ? 'Mới (New)' : 'New'}
          </span>
        );
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'BUG_REPORT':
        return (
          <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold text-xs">
            <Bug className="w-3.5 h-3.5" />
            <span>{locale === 'vi' ? 'Báo lỗi' : 'Bug Report'}</span>
          </span>
        );
      case 'FEATURE_REQUEST':
        return (
          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-xs">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>{locale === 'vi' ? 'Tính năng mới' : 'Feature Request'}</span>
          </span>
        );
      case 'CONTENT_CORRECTION':
        return (
          <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{locale === 'vi' ? 'Sửa nội dung' : 'Content Correction'}</span>
          </span>
        );
      case 'VOCABULARY_SUGGESTION':
        return (
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
            <Tag className="w-3.5 h-3.5" />
            <span>{locale === 'vi' ? 'Gợi ý từ vựng' : 'Vocabulary Suggestion'}</span>
          </span>
        );
      case 'UX_FEEDBACK':
        return (
          <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{locale === 'vi' ? 'Giao diện & UX' : 'UX Feedback'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium text-xs">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{locale === 'vi' ? 'Ý kiến chung' : 'General'}</span>
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-400">URGENT</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">HIGH</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-500/20 text-slate-400">LOW</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400">NORMAL</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-indigo-500" />
            {t('feedback.title', 'Góp Ý, Báo Cáo Lỗi & Lộ Trình Phát Triển')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t(
              'feedback.subtitle',
              'Xem xét đề xuất tính năng của cộng đồng, xử lý lỗi và cập nhật cột mốc sản phẩm công khai.'
            )}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-medium transition ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium transition ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={fetchFeedback}
            disabled={loading}
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-slate-200 dark:border-slate-700"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Status Strip */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 text-xs">
        <div className="bg-white dark:bg-slate-800/90 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex items-center justify-between xs:flex-col xs:items-start">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Mới tiếp nhận</span>
          <p className="text-lg font-bold text-violet-600 dark:text-violet-400 mt-0.5">{statusCounts.new || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/90 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex items-center justify-between xs:flex-col xs:items-start">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Đang xem xét</span>
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">{statusCounts.underReview || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/90 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex items-center justify-between xs:flex-col xs:items-start">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Đã lên Roadmap</span>
          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{statusCounts.planned || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/90 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex items-center justify-between xs:flex-col xs:items-start">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Đang code / Fix</span>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5">{statusCounts.inProgress || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/90 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex items-center justify-between xs:flex-col xs:items-start">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Đã giải quyết</span>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{statusCounts.resolved || 0}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={locale === 'vi' ? 'Tìm theo tiêu đề, nội dung, email...' : 'Search feedback by keyword or email...'}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Status Filter */}
        <div className="w-44">
          <FilterSelect
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            options={[
              { value: 'ALL', label: locale === 'vi' ? 'Tất cả Trạng thái' : 'All Statuses' },
              { value: 'NEW', label: locale === 'vi' ? 'Mới (New)' : 'New' },
              { value: 'ACKNOWLEDGED', label: locale === 'vi' ? 'Đã ghi nhận' : 'Acknowledged' },
              { value: 'UNDER_REVIEW', label: locale === 'vi' ? 'Đang xem xét' : 'Under Review' },
              { value: 'PLANNED', label: locale === 'vi' ? 'Đã lên Roadmap' : 'Planned' },
              { value: 'IN_PROGRESS', label: locale === 'vi' ? 'Đang triển khai' : 'In Progress' },
              { value: 'RESOLVED', label: locale === 'vi' ? 'Đã hoàn thành' : 'Resolved' },
              { value: 'DECLINED', label: locale === 'vi' ? 'Đã từ chối' : 'Declined' },
            ]}
            size="sm"
          />
        </div>

        {/* Type Filter */}
        <div className="w-48">
          <FilterSelect
            value={typeFilter}
            onChange={(val) => {
              setTypeFilter(val);
              setPage(1);
            }}
            options={[
              { value: 'ALL', label: locale === 'vi' ? 'Tất cả Phân loại' : 'All Types' },
              { value: 'FEATURE_REQUEST', label: locale === 'vi' ? 'Đề xuất tính năng' : 'Feature Request' },
              { value: 'BUG_REPORT', label: locale === 'vi' ? 'Báo cáo lỗi (Bug)' : 'Bug Report' },
              { value: 'CONTENT_CORRECTION', label: locale === 'vi' ? 'Sửa nội dung' : 'Content Correction' },
              { value: 'VOCABULARY_SUGGESTION', label: locale === 'vi' ? 'Gợi ý từ vựng' : 'Vocab Suggestion' },
              { value: 'UX_FEEDBACK', label: locale === 'vi' ? 'Giao diện & UX' : 'UX Feedback' },
              { value: 'GENERAL', label: locale === 'vi' ? 'Ý kiến chung' : 'General' },
            ]}
            size="sm"
          />
        </div>

        {/* Priority Filter */}
        <div className="w-36">
          <FilterSelect
            value={priorityFilter}
            onChange={(val) => {
              setPriorityFilter(val);
              setPage(1);
            }}
            options={[
              { value: 'ALL', label: locale === 'vi' ? 'Mọi mức độ' : 'All Priorities' },
              { value: 'URGENT', label: 'Urgent' },
              { value: 'HIGH', label: 'High' },
              { value: 'NORMAL', label: 'Normal' },
              { value: 'LOW', label: 'Low' },
            ]}
            size="sm"
          />
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xs">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchFeedback}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{locale === 'vi' ? 'Thử lại' : 'Try again'}</span>
            </button>
          </div>
          {errorDetail && (
            <details className="text-[11px] tabular-nums text-rose-700 dark:text-rose-300/80 bg-rose-100/50 dark:bg-rose-900/30 p-2 rounded-lg">
              <summary className="cursor-pointer font-bold">Technical Details (Dev Mode)</summary>
              <p className="mt-1 break-all">{errorDetail}</p>
            </details>
          )}
        </div>
      )}

      {/* LIST TABLE VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs overflow-hidden">
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full min-w-[720px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-900/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Votes</th>
                  <th className="py-3.5 px-4">Tiêu đề & Nội dung</th>
                  <th className="py-3.5 px-4">Phân loại</th>
                  <th className="py-3.5 px-4">Ưu tiên</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4">Người gửi</th>
                  <th className="py-3.5 px-4">Thời gian</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40 text-xs">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-4">
                        <div className="w-10 h-6 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                      </td>
                      <td className="py-4 px-4 space-y-2">
                        <div className="w-48 h-3.5 bg-slate-200 dark:bg-slate-700 rounded" />
                        <div className="w-72 h-3 bg-slate-100 dark:bg-slate-800 rounded" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="w-20 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="w-14 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="w-16 h-5 bg-slate-200 dark:bg-slate-700 rounded-full" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="w-24 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="w-16 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : feedbacks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-3">
                        <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                        <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                          {statusFilter !== 'ALL' || typeFilter !== 'ALL' || debouncedSearch
                            ? locale === 'vi'
                              ? 'Không có ý kiến nào phù hợp với bộ lọc.'
                              : 'No feedback matches your filters.'
                            : locale === 'vi'
                            ? 'Chưa có ý kiến đóng góp nào được gửi.'
                            : 'No feedback yet.'}
                        </p>
                        {(statusFilter !== 'ALL' || typeFilter !== 'ALL' || debouncedSearch) && (
                          <button
                            onClick={handleResetFilters}
                            className="px-3.5 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            {locale === 'vi' ? 'Đặt lại bộ lọc' : 'Reset filters'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  feedbacks.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => {
                        setSelectedItem(item);
                        setReplyText(item.adminReply || '');
                        setInternalNotesText(item.adminNotes || '');
                      }}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition cursor-pointer group"
                    >
                      {/* Votes */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-bold text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-200/40 dark:border-indigo-800/40">
                          <ThumbsUp className="w-3 h-3" />
                          <span>{item.votesCount || item._count?.votes || 0}</span>
                        </span>
                      </td>

                      {/* Title & Description */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <p className="font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-500 transition">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {item.description}
                        </p>
                        {item.adminReply && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{locale === 'vi' ? 'Đã phản hồi' : 'Admin replied'}</span>
                          </p>
                        )}
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">{getTypeBadge(item.type)}</td>

                      {/* Priority */}
                      <td className="py-3.5 px-4 whitespace-nowrap">{getPriorityBadge(item.priority)}</td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">{getStatusBadge(item.status)}</td>

                      {/* User */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        <div className="truncate max-w-[130px]">
                          <span className="font-medium">{item.user?.displayName || item.user?.email || 'Học viên'}</span>
                          <span className="block text-[10px] text-slate-400 truncate">{item.user?.email}</span>
                        </div>
                      </td>

                      {/* Created */}
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                        {new Date(item.createdAt).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(item);
                            setReplyText(item.adminReply || '');
                            setInternalNotesText(item.adminNotes || '');
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition"
                        >
                          {locale === 'vi' ? 'Xem chi tiết' : 'Review'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-3.5 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between text-xs text-slate-500">
            <div>
              {locale === 'vi'
                ? `Hiển thị ${feedbacks.length} / ${total} ý kiến đóng góp`
                : `Showing ${feedbacks.length} of ${total} submissions`}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-bold text-slate-900 dark:text-white">
                {page} / {Math.max(1, totalPages)}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {feedbacks.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setSelectedItem(item);
                setReplyText(item.adminReply || '');
                setInternalNotesText(item.adminNotes || '');
              }}
              className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs hover:border-indigo-500/50 transition cursor-pointer space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  {getTypeBadge(item.type)}
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{item.title}</h4>
                </div>
                {getStatusBadge(item.status)}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{item.description}</p>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/50 text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400">
                  <ThumbsUp className="w-3 h-3" />
                  <span>{item.votesCount || 0} votes</span>
                </span>
                <span>{item.user?.displayName || item.user?.email || 'Học viên'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAIL & TRIAGE MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {getTypeBadge(selectedItem.type)}
                  {getPriorityBadge(selectedItem.priority)}
                  {getStatusBadge(selectedItem.status)}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">{selectedItem.title}</h3>
                <p className="text-xs text-slate-400">
                  ID: <span className="tabular-nums text-[10px]">{selectedItem.id}</span> •{' '}
                  {new Date(selectedItem.createdAt).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US')}
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action Success Toast */}
            {actionSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Original Submission Body */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {locale === 'vi' ? 'Nội dung phản ánh từ học viên' : 'Learner Message'}
              </label>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedItem.description}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>
                  Gửi bởi: <strong className="text-slate-700 dark:text-slate-300">{selectedItem.user?.displayName || 'Ẩn danh'}</strong> ({selectedItem.user?.email || 'No email'})
                </span>
                <span className="font-bold text-indigo-500">
                  {selectedItem.votesCount || 0} {locale === 'vi' ? 'lượt upvote' : 'upvotes'}
                </span>
              </div>
            </div>

            {/* Quick Status Triage */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {locale === 'vi' ? 'Chuyển trạng thái quy trình' : 'Update Workflow Status'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
                {[
                  { key: 'UNDER_REVIEW', label: locale === 'vi' ? 'Xem xét' : 'Under Review' },
                  { key: 'PLANNED', label: locale === 'vi' ? 'Đưa vào Roadmap' : 'Planned' },
                  { key: 'IN_PROGRESS', label: locale === 'vi' ? 'Đang triển khai' : 'In Progress' },
                  { key: 'RESOLVED', label: locale === 'vi' ? 'Hoàn thành' : 'Resolved' },
                ].map((st) => (
                  <button
                    key={st.key}
                    disabled={submittingAction || selectedItem.status === st.key}
                    onClick={() => handleUpdateStatus(selectedItem.id, st.key)}
                    className={`p-2 rounded-xl border transition whitespace-nowrap text-center ${
                      selectedItem.status === st.key
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Public Admin Reply */}
            <form onSubmit={handleSendPublicReply} className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>{locale === 'vi' ? 'Phản hồi công khai cho học viên' : 'Public Reply to Learner'}</span>
                <span className="text-[10px] text-indigo-400 lowercase font-normal">
                  {locale === 'vi' ? 'Học viên sẽ nhận được thông báo in-app' : 'User receives an in-app notification'}
                </span>
              </label>
              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={
                  locale === 'vi'
                    ? 'Nhập nội dung phản hồi chính thức từ Ban Quản Trị...'
                    : 'Write an official reply visible to the student...'
                }
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingAction || !replyText.trim()}
                  className="btn-glass-primary !shadow-none px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{locale === 'vi' ? 'Gửi phản hồi chính thức' : 'Send Public Reply'}</span>
                </button>
              </div>
            </form>

            {/* Internal Admin Notes */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>{locale === 'vi' ? 'Ghi chú nội bộ Admin (Chỉ Admin xem)' : 'Internal Admin Notes'}</span>
                <Shield className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <textarea
                rows={2}
                value={internalNotesText}
                onChange={(e) => setInternalNotesText(e.target.value)}
                placeholder={
                  locale === 'vi'
                    ? 'Ghi chú kỹ thuật, branch git hoặc assign cho dev xử lý...'
                    : 'Technical note, git branch or assignee details...'
                }
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveInternalNotes}
                  disabled={submittingAction}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition whitespace-nowrap shrink-0 shadow-xs"
                >
                  {locale === 'vi' ? 'Lưu ghi chú nội bộ' : 'Save Notes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeedbackPage;
