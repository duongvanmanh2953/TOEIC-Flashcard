import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { GlassCard } from '../components/common/GlassCard';
import { CustomDropdown } from '../components/common/CustomDropdown';
import {
  LifeBuoy,
  MessageSquare,
  Send,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Shield,
  Search,
  Filter,
  ArrowRight,
  User,
  Headphones,
  Tag,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface Ticket {
  id: string;
  ticketId: string;
  subject: string;
  status: 'OPEN' | 'WAITING' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  tags: string[];
  lastMessageAt: string;
  createdAt: string;
  messages?: { content: string; createdAt: string }[];
}

interface Message {
  id: string;
  senderId: string;
  senderRole: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export const SupportCenterPage: React.FC = () => {
  const { user, isGuest, promptLogin } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTicketId = searchParams.get('id');

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [replyInput, setReplyInput] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // New ticket form
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newCategory, setNewCategory] = useState('GENERAL');
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isGuest) {
      fetchTickets();
    } else {
      setLoading(false);
    }
  }, [isGuest]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
    }
  }, [selectedTicket?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/support/conversations');
      const payload = res?.data?.data || res?.data || res || [];
      const items = payload.items || (Array.isArray(payload) ? payload : []);
      setTickets(items);
      if (initialTicketId) {
        const found = items.find((t: Ticket) => t.id === initialTicketId);
        if (found) setSelectedTicket(found);
      } else if (items.length > 0 && !selectedTicket) {
        setSelectedTicket(items[0]);
      }
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    setMessagesLoading(true);
    try {
      const res: any = await api.get(`/support/conversations/${ticketId}`);
      const conv = res?.data?.data || res?.data || res || {};
      setMessages(conv.messages || []);
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) return;
    setCreatingTicket(true);
    setTicketError(null);
    try {
      const res: any = await api.post('/support/conversations', {
        subject: newSubject,
        message: newMessage,
        tags: [newCategory],
      });
      const created = res?.data || res;
      setTickets((prev) => [created, ...prev]);
      setSelectedTicket(created);
      setCreateModalOpen(false);
      setNewSubject('');
      setNewMessage('');
    } catch (err: any) {
      setTicketError(err.response?.data?.message || 'Không thể tạo yêu cầu hỗ trợ.');
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !selectedTicket || sendingReply) return;
    const content = replyInput;
    setReplyInput('');
    setSendingReply(true);

    const optimistic: Message = {
      id: Date.now().toString(),
      senderId: user?.id || 'me',
      senderRole: user?.role || 'USER',
      senderName: user?.displayName || user?.email || 'Học viên',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res: any = await api.post(`/support/conversations/${selectedTicket.id}/messages`, {
        content,
      });
      const saved = res?.data || res;
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? saved : m)));
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicket) return;
    try {
      await api.post(`/support/conversations/${selectedTicket.id}/resolve`);
      setSelectedTicket({ ...selectedTicket, status: 'RESOLVED' });
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicket.id ? { ...t, status: 'RESOLVED' } : t)),
      );
    } catch (err) {
      console.error('Error resolving ticket', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider">
            Chờ Tiếp Nhận
          </span>
        );
      case 'WAITING':
        return (
          <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider">
            Đã Phản Hồi
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
            Đã Giải Quyết
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-600 text-[10px] font-black uppercase">
            Đã Đóng
          </span>
        );
    }
  };

  if (isGuest) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mx-auto shadow-md">
          <Headphones className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          Trung Tâm Hỗ Trợ Khách Hàng VocabFlow
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          Đăng nhập tài khoản để gửi yêu cầu hỗ trợ kỹ thuật, thắc mắc lộ trình TOEIC hoặc liên hệ tư vấn viên 24/7.
        </p>
        <button
          onClick={() => promptLogin('Liên hệ chuyên viên CSKH VocabFlow')}
          className="btn-glass-primary text-xs !py-3 !px-6 shadow-md"
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in p-4 sm:p-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1 border border-indigo-500/20">
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Support & Realtime Helpdesk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Hỗ Trợ Học Viên & CSKH 24/7
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kết nối trực tiếp chuyên viên ngôn ngữ & kỹ sư nền tảng. Thời gian phản hồi trung bình dưới 15 phút.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="btn-glass-primary text-xs !py-2.5 !px-4 self-start sm:self-auto flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Gửi yêu cầu hỗ trợ mới</span>
        </button>
      </div>

      {/* Main Support Grid (Left: Ticket List, Right: Ticket Thread) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Tickets List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Yêu cầu của bạn ({tickets.length})
            </span>
            <button
              onClick={fetchTickets}
              className="text-slate-400 hover:text-indigo-600 transition"
              title="Tải lại danh sách"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            </div>
          ) : tickets.length === 0 ? (
            <GlassCard className="p-8 text-center space-y-3">
              <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500">Bạn chưa có yêu cầu hỗ trợ nào.</p>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Tạo yêu cầu đầu tiên &rarr;
              </button>
            </GlassCard>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {t.ticketId}
                      </span>
                      {getStatusBadge(t.status)}
                    </div>
                    <h4 className={`text-xs font-bold truncate leading-tight ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                      {t.subject}
                    </h4>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 text-[10px]">
                      <span className={isSelected ? 'text-indigo-200' : 'text-slate-400'}>
                        {new Date(t.lastMessageAt).toLocaleDateString()}
                      </span>
                      <span className={`capitalize ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                        Tag: {t.tags?.[0] || 'Chung'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Selected Ticket Detail & Chat Thread */}
        <div className="lg:col-span-8">
          {selectedTicket ? (
            <GlassCard className="p-0 overflow-hidden flex flex-col h-[650px] shadow-lg border border-slate-200/90 dark:border-slate-800">
              {/* Thread Header */}
              <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {selectedTicket.ticketId}
                    </span>
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white truncate mt-0.5">
                    {selectedTicket.subject}
                  </h3>
                </div>

                {selectedTicket.status !== 'RESOLVED' && (
                  <button
                    onClick={handleResolveTicket}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition flex items-center gap-1 shrink-0"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Đã giải quyết xong</span>
                  </button>
                )}
              </div>

              {/* Messages Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/30 dark:bg-slate-950/30">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 my-auto">Chưa có tin nhắn.</p>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === user?.id;
                    const isAdmin = m.senderRole === 'ADMIN' || m.senderRole === 'SUPER_ADMIN';

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          {isAdmin && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-600 text-white text-[9px] font-black uppercase">
                              CSKH
                            </span>
                          )}
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            {isMe ? 'Bạn' : m.senderName}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[85%] shadow-xs ${
                            isMe
                              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-tl-xs'
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

              {/* Message Composer */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
                <input
                  type="text"
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  placeholder={selectedTicket.status === 'RESOLVED' ? 'Yêu cầu đã đóng. Nhập để mở lại thảo luận...' : 'Nhập tin nhắn phản hồi tới đội CSKH...'}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={!replyInput.trim() || sendingReply}
                  className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </GlassCard>
          ) : (
            <GlassCard className="p-16 text-center space-y-3 flex flex-col items-center justify-center min-h-[450px]">
              <Headphones className="w-12 h-12 text-slate-300 dark:text-slate-600" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Chọn một yêu cầu để xem chi tiết
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Toàn bộ lịch sử trao đổi giữa bạn và đội ngũ kỹ thuật VocabFlow được mã hóa bảo mật và lưu trữ xuyên suốt.
              </p>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Modal: Create Support Ticket */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Tạo Yêu Cầu Hỗ Trợ Mới
                </h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Đóng
              </button>
            </div>

            {ticketError && (
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 text-xs font-bold">
                {ticketError}
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Danh mục yêu cầu
                </label>
                <CustomDropdown
                  value={newCategory}
                  onChange={setNewCategory}
                  options={[
                    { value: 'GENERAL', label: 'Hỗ trợ học tập chung' },
                    { value: 'PAYMENT', label: 'Nâng cấp / Thanh toán VIP' },
                    { value: 'AI_TUTOR', label: 'Vấn đề Gia sư AI' },
                    { value: 'CONTENT', label: 'Báo lỗi từ vựng / Đề thi' },
                    { value: 'BUG', label: 'Lỗi ứng dụng / Kỹ thuật' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tiêu đề vấn đề
                </label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="VD: Không kích hoạt được gói Pro sau khi chuyển khoản"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả chi tiết nội dung
                </label>
                <textarea
                  required
                  rows={4}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Mô tả cụ thể khó khăn hoặc thông báo lỗi bạn gặp phải để chúng tôi xử lý nhanh nhất..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingTicket}
                  className="btn-glass-primary text-xs !py-2.5 !px-5 shadow-sm"
                >
                  {creatingTicket ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
