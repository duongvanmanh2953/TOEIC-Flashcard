import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  Trash2,
  Send,
  Eye,
  Archive,
  AlertTriangle,
} from 'lucide-react';
import {
  communityKnowledgeService,
  CommunityPostItem,
} from '../../services/communityKnowledge.service';
import { VirtualScrollList } from '../../components/common/VirtualScrollList';

const STATUS_TABS = [
  { id: '', label: 'Tất cả' },
  { id: 'PENDING_REVIEW', label: 'Chờ duyệt' },
  { id: 'APPROVED', label: 'Đã duyệt' },
  { id: 'DRAFT', label: 'Bản nháp' },
  { id: 'REJECTED', label: 'Bị từ chối' },
  { id: 'ARCHIVED', label: 'Đã lưu trữ' },
];

export const MyPostsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [posts, setPosts] = useState<CommunityPostItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchMyPosts = useCallback(
    async (isInitial = true, cursorToUse?: string) => {
      if (isInitial) setIsLoadingInitial(true);
      else setIsLoadingMore(true);

      try {
        const res = await communityKnowledgeService.getMyPosts(
          selectedStatus || undefined,
          cursorToUse,
          20,
        );

        if (isInitial) {
          setPosts(res.items);
        } else {
          setPosts((prev) => {
            const existing = new Set(prev.map((p) => p.id));
            const newOnes = res.items.filter((p) => !existing.has(p.id));
            return [...prev, ...newOnes];
          });
        }

        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingInitial(false);
        setIsLoadingMore(false);
      }
    },
    [selectedStatus],
  );

  useEffect(() => {
    fetchMyPosts(true);
  }, [selectedStatus]);

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore && nextCursor) {
      fetchMyPosts(false, nextCursor);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    try {
      await communityKnowledgeService.deletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitDraft = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await communityKnowledgeService.submitDraft(id);
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã duyệt
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Chờ duyệt
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> Bị từ chối
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 text-xs font-bold border border-slate-500/20">
            <FileEdit className="w-3.5 h-3.5" /> Bản nháp
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold border border-purple-500/20">
            <Archive className="w-3.5 h-3.5" /> Đã lưu trữ
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
          <button
            onClick={() => navigate('/community-knowledge')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Bảng tin</span>
          </button>

          <button
            onClick={() => navigate('/community-knowledge/new')}
            className="btn-glass-primary btn-glass-sm font-bold shadow-sm shadow-indigo-500/25"
          >
            <Plus className="w-4 h-4" />
            <span>Đăng bài mới</span>
          </button>
        </div>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Bài viết của tôi
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi trạng thái kiểm duyệt, cập nhật hoặc gửi lại bài viết kiến thức của bạn.
          </p>
        </div>

        {/* Tabs Bar */}
        <div className="tab-pill-container self-start overflow-x-auto pb-1 scrollbar-none flex-nowrap max-w-full">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`tab-pill ${selectedStatus === tab.id ? 'tab-pill-active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Virtualized My Posts List */}
        <div className="min-h-[400px]">
          <VirtualScrollList<CommunityPostItem>
            items={posts}
            itemKey={(item) => item.id}
            estimatedItemHeight={175}
            hasMore={hasMore}
            isLoadingInitial={isLoadingInitial}
            isLoadingMore={isLoadingMore}
            onLoadMore={handleLoadMore}
            onRetry={() => fetchMyPosts(true)}
            containerClassName="h-[calc(100vh-280px)]"
            contentClassName="pb-4"
            renderItem={(item) => (
              <div
                onClick={() => {
                  if (item.status === 'APPROVED') {
                    navigate(`/community-knowledge/${item.id}`);
                  } else {
                    navigate(`/community-knowledge/edit/${item.id}`);
                  }
                }}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 cursor-pointer hover:border-indigo-500/50 transition mb-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(item.status)}
                    <span className="text-xs text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {(item.status === 'DRAFT' || item.status === 'REJECTED') && (
                      <button
                        onClick={(e) => handleSubmitDraft(item.id, e)}
                        className="btn-glass-primary btn-glass-sm !py-1 !px-2.5 font-bold"
                      >
                        <Send className="w-3 h-3" />
                        <span>Gửi duyệt</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/community-knowledge/edit/${item.id}`);
                      }}
                      className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
                      title="Chỉnh sửa bài viết"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Xóa bài viết"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {item.summary || 'Không có mô tả ngắn...'}
                  </p>
                </div>

                {/* Rejection Alert if rejected */}
                {item.status === 'REJECTED' && item.rejectionReason && (
                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Lý do từ chối:</p>
                      <p className="mt-0.5">{item.rejectionReason}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
};
