import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard } from '../../components/common/GlassCard';
import { CustomDropdown } from '../../components/common/CustomDropdown';
import {
  Headphones,
  Search,
  Filter,
  Send,
  Lock,
  MessageSquare,
  CheckCircle2,
  Clock,
  User,
  Crown,
  AlertCircle,
  Tag,
  RefreshCw,
  FileText,
  Flame,
  Award,
  Zap,
} from 'lucide-react';

export const AdminSupportPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialPriority = searchParams.get('priority');

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'OPEN' | 'WAITING' | 'RESOLVED'>('ALL');
  const [search, setSearch] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, [activeFilter, search]);

  useEffect(() => {
    if (selectedConv?.id) {
      fetchDetail(selectedConv.id);
    }
  }, [selectedConv?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConv?.messages]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/support/admin/conversations', {
        params: {
          status: activeFilter === 'ALL' ? undefined : activeFilter,
          priority: initialPriority || undefined,
          search: search.trim() || undefined,
        },
      });
      const data = res?.data?.data || res?.data || res;
      const items = data.items || (Array.isArray(data) ? data : []);
      setConversations(items);
      if (items.length > 0 && !selectedConv) {
        setSelectedConv(items[0]);
      }
    } catch (err) {
      console.error('Failed to load admin conversations', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res: any = await api.get(`/support/admin/conversations/${id}`);
      setSelectedConv(res?.data?.data || res?.data || res);
    } catch (err) {
      console.error('Failed to load conversation detail', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConv || sending) return;

    const content = replyText;
    setReplyText('');
    setSending(true);

    try {
      const endpoint = isInternalNote
        ? `/support/admin/conversations/${selectedConv.id}/note`
        : `/support/admin/conversations/${selectedConv.id}/messages`;

      const res: any = await api.post(endpoint, { content });
      const savedMsg = res?.data || res;

      setSelectedConv((prev: any) => ({
        ...prev,
        status: isInternalNote ? prev.status : 'WAITING',
        messages: [...(prev.messages || []), savedMsg],
      }));

      // Update conversations list in left column
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConv.id
            ? { ...c, status: isInternalNote ? c.status : 'WAITING', lastMessageAt: new Date().toISOString() }
            : c,
        ),
      );
    } catch (err) {
      console.error('Failed to post reply', err);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedConv) return;
    try {
      await api.patch(`/support/admin/conversations/${selectedConv.id}/status`, {
        status: newStatus,
      });
      setSelectedConv((prev: any) => ({ ...prev, status: newStatus }));
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedConv.id ? { ...c, status: newStatus } : c)),
      );
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!selectedConv) return;
    try {
      await api.patch(`/support/admin/conversations/${selectedConv.id}/priority`, {
        priority: newPriority,
      });
      setSelectedConv((prev: any) => ({ ...prev, priority: newPriority }));
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedConv.id ? { ...c, priority: newPriority } : c)),
      );
    } catch (err) {
      console.error('Failed to update priority', err);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase">Khẩn Cấp</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase">Cao</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold uppercase">Bình Thường</span>;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Title & Quick Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Headphones className="w-5 h-5 text-sky-400" />
            <span>Hộp Thư Hỗ Trợ Khách Hàng (Support Inbox)</span>
          </h1>
          <p className="text-xs text-slate-400">
            Hội thoại thời gian thực, quản lý SLA, phân công chuyên viên và lưu trữ ghi chú nội bộ.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'OPEN', 'WAITING', 'RESOLVED'].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f as any)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                activeFilter === f
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {f === 'ALL' ? 'Tất cả' : f === 'OPEN' ? 'Chờ nhận' : f === 'WAITING' ? 'Đã trả lời' : 'Đã xong'}
            </button>
          ))}
          <button
            onClick={fetchConversations}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
            title="Tải lại danh sách"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2-COLUMN INBOX LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Ticket List */}
        <div className="lg:col-span-4 space-y-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo Ticket ID, email, tiêu đề..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-xs text-slate-400">
              Không có hội thoại nào phù hợp.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[640px] overflow-y-auto pr-1">
              {conversations.map((c) => {
                const isSelected = selectedConv?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedConv(c)}
                    className={`p-3 rounded-2xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono font-bold text-indigo-400">
                        {c.ticketId}
                      </span>
                      {getPriorityBadge(c.priority)}
                    </div>
                    <h4 className="text-xs font-bold truncate leading-tight text-white">
                      {c.subject}
                    </h4>
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400">
                      <span className="truncate">{c.user?.displayName || c.user?.email || 'Học viên'}</span>
                      <span>{new Date(c.lastMessageAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active Conversation & Context Panel */}
        <div className="lg:col-span-8 space-y-4">
          {selectedConv ? (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              {/* Main Chat Thread (8 cols) */}
              <div className="xl:col-span-8 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col h-[640px] overflow-hidden shadow-lg">
                {/* Header */}
                <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-400">
                        {selectedConv.ticketId}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        [{selectedConv.status}]
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-white truncate mt-0.5">
                      {selectedConv.subject}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {selectedConv.status !== 'RESOLVED' ? (
                      <button
                        onClick={() => handleStatusChange('RESOLVED')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/30 transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Đóng Ticket</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange('OPEN')}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
                      >
                        Mở lại
                      </button>
                    )}
                  </div>
                </div>

                {/* Message Body */}
                <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-950/30 text-xs">
                  {detailLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                    </div>
                  ) : selectedConv.messages?.length === 0 ? (
                    <p className="text-center text-slate-500 my-auto">Chưa có tin nhắn.</p>
                  ) : (
                    selectedConv.messages?.map((m: any) => {
                      const isInternal = m.isInternalNote;
                      const isAdmin = m.senderRole === 'ADMIN' || m.senderRole === 'SUPER_ADMIN';

                      if (isInternal) {
                        return (
                          <div
                            key={m.id}
                            className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs my-2"
                          >
                            <div className="flex items-center gap-1.5 font-black uppercase text-[9px] text-amber-400 mb-1">
                              <Lock className="w-3 h-3" />
                              <span>Ghi chú nội bộ (Chỉ Admin nhìn thấy) • {m.senderName}</span>
                            </div>
                            <p className="leading-relaxed">{m.content}</p>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-400">
                            <span className="font-bold text-slate-300">{m.senderName}</span>
                            <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div
                            className={`p-3 rounded-2xl leading-relaxed max-w-[85%] shadow-xs ${
                              isAdmin
                                ? 'bg-indigo-600 text-white rounded-tr-xs'
                                : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-xs'
                            }`}
                          >
                            {m.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Composer with Public Reply vs Internal Note toggle */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsInternalNote(false)}
                        className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition ${
                          !isInternalNote
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Trả lời khách hàng
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsInternalNote(true)}
                        className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                          isInternalNote
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Lock className="w-3 h-3" />
                        <span>Ghi chú nội bộ</span>
                      </button>
                    </div>

                    <span className="text-[10px] text-slate-500">
                      {isInternalNote ? 'Khách hàng KHÔNG thấy nội dung này' : 'Tự động gửi thông báo tới học viên'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={isInternalNote ? 'Viết ghi chú bàn giao hoặc tiến độ điều tra...' : 'Viết phản hồi gửi trực tiếp tới học viên...'}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 ${
                        isInternalNote
                          ? 'bg-amber-500/10 border border-amber-500/30 focus:ring-amber-400'
                          : 'bg-slate-800 border border-slate-700 focus:ring-indigo-500'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim() || sending}
                      className={`p-2 rounded-xl text-white transition disabled:opacity-50 ${
                        isInternalNote ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>

              {/* Customer Context Sidebar (4 cols) */}
              <div className="xl:col-span-4 bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-4 text-xs">
                <div className="border-b border-slate-800 pb-2.5">
                  <h4 className="font-black text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Hồ Sơ Học Viên</span>
                  </h4>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Họ và tên</span>
                    <p className="font-bold text-white text-xs">
                      {selectedConv.user?.displayName || 'Chưa cập nhật'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Email</span>
                    <p className="font-mono text-slate-300 text-xs truncate">
                      {selectedConv.user?.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Gói tài khoản</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-black text-indigo-300">
                        {selectedConv.user?.subscriptions?.[0]?.plan?.name || selectedConv.user?.role || 'Miễn Phí'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Trình độ CEFR</span>
                    <p className="font-bold text-emerald-400">
                      {selectedConv.user?.profile?.englishLevel || 'B1'} &rarr; {selectedConv.user?.profile?.targetLevel || 'C1'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Chuỗi học Streak / XP</span>
                    <p className="text-slate-300 font-bold">
                      🔥 {selectedConv.user?.streak?.currentStreak || 0} ngày • {selectedConv.user?.xp?.totalXP || 0} XP
                    </p>
                  </div>
                </div>

                {/* Priority & Status Controls */}
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Cập nhật độ ưu tiên
                  </span>
                  <div className="grid grid-cols-3 gap-1 text-[10px] font-bold">
                    {['LOW', 'NORMAL', 'URGENT'].map((p) => (
                      <button
                        key={p}
                        onClick={() => handlePriorityChange(p)}
                        className={`py-1 rounded-lg transition text-center ${
                          selectedConv.priority === p
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-16 text-center text-xs text-slate-400 min-h-[450px] flex items-center justify-center">
              Chọn một yêu cầu bên trái để xem hội thoại và thông tin học viên.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
