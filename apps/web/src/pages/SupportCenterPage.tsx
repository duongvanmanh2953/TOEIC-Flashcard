import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GlassCard } from '../components/common/GlassCard';
import {
  Headphones,
  Send,
  LifeBuoy,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Sparkles,
  ChevronRight,
  RefreshCw,
  HelpCircle,
  FileText,
  User,
  ShieldCheck,
} from 'lucide-react';
import api from '../lib/api';
import { getSocket } from '../lib/socket';

interface Ticket {
  id: string;
  ticketId: string;
  subject: string;
  status: string;
  priority: string;
  tags: string[];
  createdAt: string;
  lastMessageAt: string;
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

  // Realtime Socket.io join room & listener
  useEffect(() => {
    if (!selectedTicket?.id) return;
    fetchMessages(selectedTicket.id);

    const socket = getSocket();
    socket.emit('join_conversation', {
      conversationId: selectedTicket.id,
      userId: user?.id,
    });

    const onNewMessage = (msg: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on('new_message', onNewMessage);

    return () => {
      socket.off('new_message', onNewMessage);
    };
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
      const created = res?.data?.data || res?.data || res;
      setTickets((prev) => [created, ...prev]);
      setSelectedTicket(created);
      setMessages(created.messages || []);
      setCreateModalOpen(false);
      setNewSubject('');
      setNewMessage('');
    } catch (err: any) {
      setTicketError(err.response?.data?.error?.message || 'Không thể gửi yêu cầu hỗ trợ.');
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !selectedTicket || sendingReply) return;
    const content = replyInput.trim();
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
      const saved = res?.data?.data || res?.data || res;
      setMessages((prev) => {
        if (prev.some((m) => m.id === saved.id)) {
          return prev.filter((m) => m.id !== optimistic.id);
        }
        return prev.map((m) => (m.id === optimistic.id ? saved : m));
      });
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
          <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-wider">
            Chờ Tiếp Nhận
          </span>
        );
      case 'WAITING':
        return (
          <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-wider">
            Đã Phản Hồi
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider">
            Đã Xử Lý Xong
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 text-[9px] font-black uppercase">
            Đã Đóng
          </span>
        );
    }
  };

  if (isGuest) {
    return (
      <div className="max-w-md mx-auto p-8 text-center space-y-3 animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
          <Headphones className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          Trung Tâm Hỗ Trợ Khách Hàng VocabFlow
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Đăng nhập tài khoản để chat trực tiếp với chuyên viên hỗ trợ 24/7 và theo dõi tiến độ ticket.
        </p>
        <button
          onClick={() => promptLogin('Liên hệ CSKH VocabFlow')}
          className="btn-glass-primary text-xs !py-2.5 !px-5 shadow-sm"
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-fade-in p-2 sm:p-4 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider mb-1 border border-indigo-500/20">
            <LifeBuoy className="w-3 h-3" />
            <span>Realtime CSKH Helpdesk</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Hỗ Trợ Học Viên & Kỹ Thuật 24/7
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Chat trực tiếp với đội ngũ hỗ trợ. Cập nhật trạng thái Realtime qua Socket.io.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="btn-glass-primary text-xs !py-2 !px-3.5 self-start sm:self-auto flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Gửi yêu cầu mới</span>
        </button>
      </div>

      {/* Main Support Grid (Left: Ticket List, Right: Ticket Thread) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Tickets List */}
        <div className="lg:col-span-4 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
              Yêu cầu của bạn ({tickets.length})
            </span>
            <button
              onClick={fetchTickets}
              className="text-slate-400 hover:text-indigo-600 transition p-1 rounded-md"
              title="Tải lại danh sách"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            </div>
          ) : tickets.length === 0 ? (
            <GlassCard className="p-6 text-center space-y-2">
              <MessageSquare className="w-7 h-7 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500">Bạn chưa có yêu cầu hỗ trợ nào.</p>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Tạo yêu cầu đầu tiên &rarr;
              </button>
            </GlassCard>
          ) : (
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`text-[9px] font-mono font-bold ${
                          isSelected ? 'text-indigo-200' : 'text-slate-400'
                        }`}
                      >
                        {t.ticketId}
                      </span>
                      {getStatusBadge(t.status)}
                    </div>
                    <h4
                      className={`text-xs font-bold truncate leading-tight ${
                        isSelected ? 'text-white' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {t.subject}
                    </h4>
                    <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-200/40 dark:border-slate-800/40 text-[9px]">
                      <span className={isSelected ? 'text-indigo-200' : 'text-slate-400'}>
                        {new Date(t.lastMessageAt).toLocaleDateString()}
                      </span>
                      <span className={`capitalize ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                        {t.tags?.[0] || 'Chung'}
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
            <GlassCard className="p-0 overflow-hidden flex flex-col h-[520px] shadow-md border border-slate-200/80 dark:border-slate-800">
              {/* Thread Header */}
              <div className="p-3 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {selectedTicket.ticketId}
                    </span>
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white truncate mt-0.5">
                    {selectedTicket.subject}
                  </h3>
                </div>

                {selectedTicket.status !== 'RESOLVED' && (
                  <button
                    onClick={handleResolveTicket}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition flex items-center gap-1 shrink-0"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Xong</span>
                  </button>
                )}
              </div>

              {/* Chat Messages Feed */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-slate-50/30 dark:bg-slate-950/20">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Chưa có tin nhắn nào trong yêu cầu này.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === user?.id || m.senderRole === 'USER';
                    return (
                      <div
                        key={m.id}
                        className={`flex gap-2 items-start ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            isMe
                              ? 'bg-indigo-600 text-white'
                              : 'bg-emerald-600 text-white shadow-xs'
                          }`}
                        >
                          {isMe ? <User className="w-3 h-3" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        </div>

                        <div className={`max-w-[75%] space-y-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {m.senderName || (isMe ? 'Bạn' : 'Hỗ Trợ Viên VocabFlow')}
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(m.createdAt).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div
                            className={`p-2.5 rounded-2xl text-[12.5px] leading-relaxed shadow-xs ${
                              isMe
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-tl-none'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-2.5 border-t border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  placeholder={
                    selectedTicket.status === 'RESOLVED'
                      ? 'Yêu cầu đã được giải quyết. Gửi thêm phản hồi để mở lại...'
                      : 'Nhập tin nhắn trao đổi với tư vấn viên...'
                  }
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!replyInput.trim() || sendingReply}
                  className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </GlassCard>
          ) : (
            <GlassCard className="p-12 text-center space-y-2 h-[520px] flex flex-col items-center justify-center">
              <Headphones className="w-10 h-10 text-slate-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Chọn một yêu cầu để xem cuộc hội thoại
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Đội ngũ chăm sóc khách hàng và cố vấn TOEIC luôn sẵn sàng phản hồi trong giây lát.
              </p>
            </GlassCard>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-200 dark:border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <LifeBuoy className="w-4 h-4 text-indigo-500" />
                Tạo yêu cầu hỗ trợ mới
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {ticketError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 rounded-lg text-xs text-rose-600">
                {ticketError}
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Chủ đề / Vấn đề cần hỗ trợ
                </label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Hỏi về kích hoạt gói PRO VietQR, lỗi thuật toán FSRS..."
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Danh mục
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="GENERAL">Tư vấn chung</option>
                  <option value="BILLING">Thanh toán VietQR / PayOS</option>
                  <option value="TECH">Lỗi kỹ thuật / Đồng bộ Flashcard</option>
                  <option value="AI_TUTOR">Trợ lý AI & Lộ trình TOEIC</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Nội dung chi tiết
                </label>
                <textarea
                  rows={4}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Mô tả cụ thể sự cố hoặc thắc mắc của bạn để chuyên viên kiểm tra ngay..."
                  required
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingTicket || !newSubject.trim() || !newMessage.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
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
export default SupportCenterPage;
