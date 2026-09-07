import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { GlassCard } from '../components/common/GlassCard';
import { CustomDropdown } from '../components/common/CustomDropdown';
import {
  MessageSquarePlus,
  ThumbsUp,
  Sparkles,
  Bug,
  Lightbulb,
  CheckCircle2,
  Clock,
  Send,
  Plus,
  Compass,
  Layers,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

interface FeedbackItem {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  adminReply?: string;
  votesCount: number;
  hasVoted?: boolean;
  createdAt: string;
  user?: { displayName: string };
}

export const FeedbackPortalPage: React.FC = () => {
  const { user, isGuest, promptLogin } = useAuth();
  const [activeTab, setActiveTab] = useState<'ROADMAP' | 'MY_FEEDBACK' | 'NEW'>('ROADMAP');
  const [roadmapItems, setRoadmapItems] = useState<FeedbackItem[]>([]);
  const [myItems, setMyItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Submit form state
  const [type, setType] = useState('FEATURE_REQUEST');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'ROADMAP') {
      fetchRoadmap();
    } else if (activeTab === 'MY_FEEDBACK') {
      fetchMyFeedback();
    }
  }, [activeTab]);

  const fetchRoadmap = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/feedback/public');
      setRoadmapItems(res?.data || res || []);
    } catch (err) {
      console.error('Failed to load roadmap', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyFeedback = async () => {
    if (isGuest) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res: any = await api.get('/feedback/my');
      setMyItems(res?.data || res || []);
    } catch (err) {
      console.error('Failed to load feedback', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (feedbackId: string) => {
    if (isGuest) {
      promptLogin('Bình chọn tính năng yêu thích');
      return;
    }
    try {
      const res: any = await api.post(`/feedback/${feedbackId}/vote`);
      const { voted, votesCount } = res?.data || res;
      setRoadmapItems((prev) =>
        prev.map((item) =>
          item.id === feedbackId ? { ...item, votesCount, hasVoted: voted } : item,
        ),
      );
    } catch (err) {
      console.error('Vote failed', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      promptLogin('Gửi đóng góp ý kiến');
      return;
    }
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      await api.post('/feedback', {
        type,
        title,
        description,
      });
      setSuccessMsg('Ý kiến của bạn đã được gửi thành công tới Ban Quản Trị!');
      setTitle('');
      setDescription('');
      setTimeout(() => {
        setSuccessMsg(null);
        setActiveTab('MY_FEEDBACK');
      }, 2000);
    } catch (err) {
      console.error('Submit feedback failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UNDER_REVIEW':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 text-[10px] font-black uppercase">Đang Xem Xét</span>;
      case 'PLANNED':
        return <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 text-[10px] font-black uppercase">Đã Lên Lộ Trình</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-600 text-[10px] font-black uppercase">Đang Thực Hiện</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 text-[10px] font-black uppercase">Đã Hoàn Thành</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase">Mới Gửi</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in p-4 sm:p-6 lg:p-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1 border border-indigo-500/20">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Community Feedback & Ideas</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Đóng Góp Ý Kiến & Lộ Trình Phát Triển
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cùng xây dựng VocabFlow thông minh hơn. Đề xuất tính năng, báo lỗi hoặc bình chọn cho ý kiến cộng đồng.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('NEW')}
          className="btn-glass-primary text-xs !py-2.5 !px-4 self-start sm:self-auto flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Đóng góp ý kiến mới</span>
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
        <button
          onClick={() => setActiveTab('ROADMAP')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'ROADMAP'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Lộ Trình Cộng Đồng (Roadmap)</span>
        </button>

        <button
          onClick={() => setActiveTab('MY_FEEDBACK')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'MY_FEEDBACK'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ý Kiến Của Tôi</span>
        </button>

        <button
          onClick={() => setActiveTab('NEW')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'NEW'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          <span>Gửi Ý Kiến</span>
        </button>
      </div>

      {/* TAB 1: PUBLIC ROADMAP */}
      {activeTab === 'ROADMAP' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Ý kiến được bình chọn nhiều nhất
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Bấm nút 👍 để ưu tiên đưa vào bản cập nhật tới
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[250px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : roadmapItems.length === 0 ? (
            <GlassCard className="p-12 text-center space-y-3">
              <Lightbulb className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Chưa có đề xuất nào trên Lộ Trình
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Hãy là người đầu tiên gửi ý tưởng nâng cấp sản phẩm mà bạn mong đợi nhất!
              </p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roadmapItems.map((item) => (
                <GlassCard key={item.id} className="p-5 flex flex-col justify-between space-y-3 shadow-xs border border-slate-200/80 dark:border-slate-800">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        [{item.type}]
                      </span>
                      {getStatusBadge(item.status)}
                    </div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                      {item.description}
                    </p>
                  </div>

                  {item.adminReply && (
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-900 dark:text-indigo-200">
                      <strong className="block text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 mb-0.5">
                        Phản hồi từ Đội Ngũ Phát Triển:
                      </strong>
                      {item.adminReply}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Bởi {item.user?.displayName || 'Thành viên VocabFlow'}
                    </span>
                    <button
                      onClick={() => handleVote(item.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs ${
                        item.hasVoted
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{item.votesCount || 0}</span>
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY FEEDBACK */}
      {activeTab === 'MY_FEEDBACK' && (
        <div className="space-y-4">
          {isGuest ? (
            <GlassCard className="p-12 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-indigo-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Đăng nhập để theo dõi ý kiến của bạn
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Khi đăng nhập, bạn sẽ nhận được thông báo ngay khi Ban Quản Trị duyệt và trả lời ý kiến.
              </p>
              <button
                onClick={() => promptLogin('Theo dõi đóng góp của bạn')}
                className="btn-glass-primary text-xs !py-2.5 !px-5"
              >
                Đăng nhập ngay
              </button>
            </GlassCard>
          ) : loading ? (
            <div className="flex items-center justify-center min-h-[250px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : myItems.length === 0 ? (
            <GlassCard className="p-12 text-center space-y-3">
              <MessageSquarePlus className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Bạn chưa gửi ý kiến nào
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Bất kỳ lỗi giao diện, gợi ý từ vựng TOEIC mới hay ý tưởng tính năng đều rất quý giá với chúng tôi!
              </p>
              <button
                onClick={() => setActiveTab('NEW')}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Gửi ý kiến đầu tiên &rarr;
              </button>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {myItems.map((item) => (
                <GlassCard key={item.id} className="p-5 border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      [{item.type}] • {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.description}
                  </p>

                  {item.adminReply && (
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200">
                      <div className="flex items-center gap-1.5 font-black uppercase text-[10px] text-emerald-600 dark:text-emerald-400 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Phản hồi từ Quản Trị Viên VocabFlow:</span>
                      </div>
                      {item.adminReply}
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SUBMIT FORM */}
      {activeTab === 'NEW' && (
        <GlassCard className="max-w-2xl mx-auto p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Gửi Ý Kiến & Đề Xuất Phát Triển
            </h2>
            <p className="text-xs text-slate-500">
              Đội ngũ sản phẩm sẽ xem xét và phản hồi trực tiếp vào Notification của bạn.
            </p>
          </div>

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Phân loại đóng góp
              </label>
              <CustomDropdown
                value={type}
                onChange={setType}
                options={[
                  { value: 'FEATURE_REQUEST', label: '💡 Đề xuất tính năng mới' },
                  { value: 'BUG_REPORT', label: '🐛 Báo cáo lỗi kỹ thuật / hiển thị' },
                  { value: 'CONTENT_CORRECTION', label: '📝 Sửa nội dung từ vựng / ví dụ TOEIC' },
                  { value: 'VOCABULARY_SUGGESTION', label: '📚 Gợi ý thêm từ vựng mới vào kho' },
                  { value: 'UX_FEEDBACK', label: '🎨 Góp ý giao diện & trải nghiệm học' },
                  { value: 'GENERAL', label: '💬 Ý kiến khác' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tiêu đề ngắn gọn
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Thêm chế độ làm bài thi thử TOEIC bấm giờ 120 phút"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mô tả chi tiết ý tưởng hoặc các bước gặp lỗi
              </label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả cụ thể lợi ích hoặc tình huống gặp phải để chúng tôi nắm bắt rõ nhất..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('ROADMAP')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Quay lại
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-glass-primary text-xs !py-2.5 !px-6 shadow-md flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Đang gửi...' : 'Gửi đóng góp'}</span>
              </button>
            </div>
          </form>
        </GlassCard>
      )}
    </div>
  );
};
