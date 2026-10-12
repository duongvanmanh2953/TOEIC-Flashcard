import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Archive,
  Download,
  AlertTriangle,
  Loader2,
  Filter,
  Eye,
  ShieldCheck,
  BrainCircuit,
  Star,
  RefreshCw,
} from 'lucide-react';
import {
  communityKnowledgeService,
  CommunityPostItem,
  CommunityTopic,
} from '../../services/communityKnowledge.service';
import { VirtualScrollList } from '../../components/common/VirtualScrollList';
import { FilterSelect } from '../../components/ui/FilterSelect';

export const AdminCommunityModerationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED'>('PENDING_REVIEW');
  const [topics, setTopics] = useState<CommunityTopic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [search, setSearch] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

  // Posts & Pagination
  const [posts, setPosts] = useState<CommunityPostItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingPostId, setRejectingPostId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // AI Training Data export state
  const [exportingAi, setExportingAi] = useState(false);
  const [exportMinScore, setExportMinScore] = useState(0.8);
  const [exportTopicId, setExportTopicId] = useState('');

  // 1. Fetch Topics & Pending Count Badge
  const loadStatsAndTopics = async () => {
    try {
      const [topicsData, pendingData] = await Promise.all([
        communityKnowledgeService.getTopics(),
        communityKnowledgeService.getPendingCount(),
      ]);
      setTopics(topicsData);
      setPendingCount(pendingData.pendingCount);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadStatsAndTopics();
  }, []);

  // 2. Fetch Posts for Active Moderation Tab
  const fetchAdminPosts = useCallback(
    async (isInitial = true, cursorToUse?: string) => {
      if (isInitial) setIsLoadingInitial(true);
      else setIsLoadingMore(true);

      try {
        const res = await communityKnowledgeService.getAdminPosts({
          status: activeTab,
          search: search.trim() || undefined,
          topicId: selectedTopicId || undefined,
          cursor: cursorToUse,
          limit: 20,
        });

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
    [activeTab, search, selectedTopicId],
  );

  useEffect(() => {
    fetchAdminPosts(true);
  }, [activeTab, search, selectedTopicId]);

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore && nextCursor) {
      fetchAdminPosts(false, nextCursor);
    }
  };

  // 3. Moderation Actions: Approve
  const handleApprove = async (id: string) => {
    try {
      await communityKnowledgeService.approvePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      loadStatsAndTopics();
      window.dispatchEvent(
        new CustomEvent('VOCABFLOW_TOAST', {
          detail: {
            type: 'success',
            title: 'Đã duyệt bài viết',
            message: 'Bài viết đã xuất hiện công khai trên bảng tin cộng đồng.',
          },
        }),
      );
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Moderation Actions: Reject
  const handleOpenReject = (id: string) => {
    setRejectingPostId(id);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPostId || !rejectionReason.trim()) return;

    setIsSubmittingReject(true);
    try {
      await communityKnowledgeService.rejectPost(rejectingPostId, rejectionReason.trim());
      setPosts((prev) => prev.filter((p) => p.id !== rejectingPostId));
      setRejectModalOpen(false);
      loadStatsAndTopics();
      window.dispatchEvent(
        new CustomEvent('VOCABFLOW_TOAST', {
          detail: {
            type: 'info',
            title: 'Đã từ chối bài viết',
            message: 'Đã lưu lý do và thông báo cho tác giả.',
          },
        }),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReject(false);
    }
  };

  // 5. Moderation Actions: Archive
  const handleArchive = async (id: string) => {
    try {
      await communityKnowledgeService.archivePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      loadStatsAndTopics();
    } catch (err) {
      console.error(err);
    }
  };

  // 6. AI Training Eligibility Toggle
  const handleToggleTraining = async (post: CommunityPostItem) => {
    const nextEligible = !post.isTrainingEligible;
    try {
      await communityKnowledgeService.updateTrainingStatus(post.id, {
        isTrainingEligible: nextEligible,
      });
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, isTrainingEligible: nextEligible } : p)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  // 7. Trigger AI Training JSONL Dataset Export
  const handleExportAiDataset = async () => {
    setExportingAi(true);
    try {
      await communityKnowledgeService.exportTrainingData({
        topicId: exportTopicId || undefined,
        minQualityScore: exportMinScore,
        limit: 1000,
      });
      window.dispatchEvent(
        new CustomEvent('VOCABFLOW_TOAST', {
          detail: {
            type: 'success',
            title: 'Xuất dữ liệu AI thành công',
            message: 'Tệp JSONL đã được tải về máy của bạn.',
          },
        }),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setExportingAi(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-rose-500">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Từ chối duyệt bài viết
              </h3>
            </div>
            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Lý do từ chối (Tác giả sẽ thấy thông tin này để chỉnh sửa lại) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="VD: Thiếu ví dụ minh họa thực tế; giải thích cấu trúc ngữ pháp chưa chuẩn xác..."
                  className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="btn-glass-secondary btn-glass-sm font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReject || !rejectionReason.trim()}
                  className="btn-glass-danger btn-glass-sm font-bold"
                >
                  {isSubmittingReject && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Xác nhận từ chối</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase border border-indigo-500/20">
              Admin Moderation
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> Hệ thống kiểm duyệt tri thức
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Kiểm Duyệt Bài Viết & Dữ Liệu Huấn Luyện AI
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Duyệt các bài chia sẻ từ vựng, ngữ pháp tiếng Anh và xuất dữ liệu sạch chuẩn JSONL cho VocabFlow AI.
          </p>
        </div>

        {/* AI Dataset Quick Export Card */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider">
              AI Training Pipeline
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Xuất tệp JSONL từ bài đã duyệt & đủ điều kiện
            </p>
          </div>
          <button
            onClick={handleExportAiDataset}
            disabled={exportingAi}
            className="btn-glass-primary btn-glass-sm shrink-0 ml-2 font-bold cursor-pointer"
          >
            {exportingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Xuất JSONL</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar with Pending Badge */}
      <div className="tab-pill-container self-start overflow-x-auto pb-1 scrollbar-none flex-nowrap max-w-full">
        <button
          onClick={() => setActiveTab('PENDING_REVIEW')}
          className={`tab-pill ${activeTab === 'PENDING_REVIEW' ? 'tab-pill-active' : ''}`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Chờ duyệt</span>
          {pendingCount > 0 && (
            <span className="tab-pill-badge">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('APPROVED')}
          className={`tab-pill ${activeTab === 'APPROVED' ? 'tab-pill-active' : ''}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Đã xuất bản (Approved)</span>
        </button>

        <button
          onClick={() => setActiveTab('REJECTED')}
          className={`tab-pill ${activeTab === 'REJECTED' ? 'tab-pill-active' : ''}`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Bị từ chối</span>
        </button>

        <button
          onClick={() => setActiveTab('ARCHIVED')}
          className={`tab-pill ${activeTab === 'ARCHIVED' ? 'tab-pill-active' : ''}`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Lưu trữ (Archived)</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tiêu đề bài viết hoặc tên tác giả..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <FilterSelect
            value={selectedTopicId}
            onChange={(val) => setSelectedTopicId(String(val))}
            options={[
              { value: '', label: 'Tất cả chủ đề' },
              ...topics.map((t) => ({
                value: t.id,
                label: t.name,
                icon: (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: t.color || '#6366f1' }}
                  />
                ),
              })),
            ]}
            size="sm"
          />
        </div>
      </div>

      {/* Virtualized Moderation Feed */}
      <div className="min-h-[500px]">
        <VirtualScrollList<CommunityPostItem>
          items={posts}
          itemKey={(item) => item.id}
          estimatedItemHeight={220}
          hasMore={hasMore}
          isLoadingInitial={isLoadingInitial}
          isLoadingMore={isLoadingMore}
          onLoadMore={handleLoadMore}
          onRetry={() => fetchAdminPosts(true)}
          containerClassName="h-[calc(100vh-320px)]"
          contentClassName="pb-4"
          renderItem={(item) => (
            <div
              key={item.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 mb-3"
            >
              {/* Row 1: Author, Topic, Date & AI Training Badge */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {item.author.displayName.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      {item.author.displayName}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-2">
                      Gửi lúc: {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.topic && (
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                      style={{
                        backgroundColor: `${item.topic.color}15`,
                        color: item.topic.color,
                        border: `1px solid ${item.topic.color}35`,
                      }}
                    >
                      {item.topic.name}
                    </span>
                  )}

                  {/* AI Training Eligibility Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleTraining(item)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 ${
                      item.isTrainingEligible
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                    title="Bật/tắt đưa bài viết vào tập dữ liệu huấn luyện VocabFlow AI"
                  >
                    <BrainCircuit className="w-3 h-3" />
                    <span>{item.isTrainingEligible ? 'Đủ đ/k AI Training' : 'Loại khỏi AI'}</span>
                  </button>
                </div>
              </div>

              {/* Title & Preview */}
              <div>
                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-3 leading-relaxed">
                  {item.summary || item.content}
                </p>
              </div>

              {/* Tags */}
              {item.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {item.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-semibold text-indigo-500 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                <a
                  href={`/community-knowledge/${item.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem toàn bộ nội dung</span>
                </a>

                <div className="flex items-center gap-2">
                  {activeTab === 'PENDING_REVIEW' && (
                    <>
                      <button
                        onClick={() => handleOpenReject(item.id)}
                        className="btn-glass-danger btn-glass-sm font-bold"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Từ chối</span>
                      </button>

                      <button
                        onClick={() => handleApprove(item.id)}
                        className="btn-glass-emerald btn-glass-sm font-bold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Duyệt xuất bản</span>
                      </button>
                    </>
                  )}

                  {activeTab === 'APPROVED' && (
                    <button
                      onClick={() => handleArchive(item.id)}
                      className="btn-glass-secondary btn-glass-sm font-semibold"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Lưu trữ</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
};
