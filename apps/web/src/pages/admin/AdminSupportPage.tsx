import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Headphones,
  Search,
  Send,
  Lock,
  CheckCircle2,
  Clock,
  User,
  Crown,
  AlertCircle,
  RefreshCw,
  Trash2,
  ChevronDown,
  ShieldCheck,
  Check,
  PanelRightClose,
  PanelRightOpen,
  Info,
} from 'lucide-react';
import { getSocket } from '../../lib/socket';
import { VirtualChatPane } from '../../components/chat/VirtualChatPane';

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
  const [showProfile, setShowProfile] = useState(false);

  // Purge state
  const [cleaning, setCleaning] = useState(false);
  const [cleanModalOpen, setCleanModalOpen] = useState(false);
  const [purgeMockModalOpen, setPurgeMockModalOpen] = useState(false);
  const [cleanResult, setCleanResult] = useState<string | null>(null);

  // Scroll & UI refs to prevent resetting and jittering
  const selectedConvIdRef = useRef<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef<boolean>(true);
  const [hasUnreadBelow, setHasUnreadBelow] = useState(false);

  // Sync ref with selectedConv
  useEffect(() => {
    selectedConvIdRef.current = selectedConv?.id || null;
  }, [selectedConv?.id]);

  // Smooth / instant scroll helpers
  const scrollToBottom = (smooth = false) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      el.scrollTop = el.scrollHeight;
    }
    setHasUnreadBelow(false);
  };

  const handleContainerScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceFromBottom < 70;
    isNearBottomRef.current = nearBottom;
    if (nearBottom) {
      setHasUnreadBelow(false);
    }
  };

  // Global socket listener for conversations update
  useEffect(() => {
    const socket = getSocket();
    socket.emit('join_admin_support');

    const onConvUpdated = () => {
      fetchConversations(true);
    };

    socket.on('conversation_updated', onConvUpdated);

    return () => {
      socket.off('conversation_updated', onConvUpdated);
    };
  }, [activeFilter, search]);

  // Socket listener for active ticket messages
  useEffect(() => {
    if (!selectedConv?.id) return;
    const socket = getSocket();
    socket.emit('join_conversation', { conversationId: selectedConv.id });

    const onNewMsg = (msg: any) => {
      if (msg.conversationId !== selectedConvIdRef.current) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === msg.conversationId
              ? { ...c, lastMessageAt: msg.createdAt, unreadCount: (c.unreadCount || 0) + 1 }
              : c
          )
        );
        return;
      }

      setSelectedConv((prev: any) => {
        if (!prev || prev.id !== msg.conversationId) return prev;
        const currentMsgs = prev.messages || [];
        if (currentMsgs.some((m: any) => m.id === msg.id)) return prev;
        const cleaned = currentMsgs.filter(
          (m: any) => !(m.isOptimistic && m.content === msg.content)
        );
        return {
          ...prev,
          messages: [...cleaned, msg],
        };
      });

      if (isNearBottomRef.current) {
        requestAnimationFrame(() => scrollToBottom(true));
      } else {
        setHasUnreadBelow(true);
      }
    };

    socket.on('new_message', onNewMsg);

    const onMessagesRead = (data: any) => {
      if (data?.conversationId === selectedConvIdRef.current) {
        setSelectedConv((prev: any) => {
          if (!prev || prev.id !== data.conversationId) return prev;
          return {
            ...prev,
            messages: (prev.messages || []).map((m: any) =>
              m.senderRole === 'ADMIN' || m.senderRole === 'SUPER_ADMIN'
                ? { ...m, readAt: m.readAt || data.readAt }
                : m
            ),
          };
        });
      }
    };
    socket.on('messages_read', onMessagesRead);

    return () => {
      socket.off('new_message', onNewMsg);
      socket.off('messages_read', onMessagesRead);
    };
  }, [selectedConv?.id]);

  useEffect(() => {
    fetchConversations(false);
  }, [activeFilter, search]);

  const handleMarkAdminRead = async () => {
    if (!selectedConv?.id) return;
    try {
      await api.post(`/support/admin/conversations/${selectedConv.id}/read`);
      const socket = getSocket();
      socket.emit('mark_read', { conversationId: selectedConv.id, role: 'ADMIN' });
    } catch {
      // silent
    }
  };

  const handleSelectConversation = (conv: any) => {
    if (selectedConvIdRef.current === conv.id) return;
    setSelectedConv(conv);
    selectedConvIdRef.current = conv.id;
    fetchDetail(conv.id);
    handleMarkAdminRead();
  };

  const fetchConversations = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res: any = await api.get('/support/admin/conversations', {
        params: {
          status: activeFilter === 'ALL' ? undefined : activeFilter,
          priority: initialPriority || undefined,
          search: search.trim() || undefined,
        },
      });
      const data = res?.data?.data || res?.data || res;
      let items = data.items || (Array.isArray(data) ? data : []);

      if (selectedConvIdRef.current) {
        const found = items.find((c: any) => c.id === selectedConvIdRef.current);
        if (!found && selectedConv) {
          items = [selectedConv, ...items];
        }
      }

      setConversations(items);

      if (!selectedConvIdRef.current && items.length > 0) {
        setSelectedConv(items[0]);
        selectedConvIdRef.current = items[0].id;
        fetchDetail(items[0].id);
      }
    } catch (err) {
      console.error('Failed to load admin conversations', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchDetail = async (id: string) => {
    if (!selectedConv?.messages || selectedConv.id !== id) {
      setDetailLoading(true);
    }
    try {
      const res: any = await api.get(`/support/admin/conversations/${id}`);
      const detail = res?.data?.data || res?.data || res;
      if (selectedConvIdRef.current === id) {
        setSelectedConv((prev: any) => ({
          ...(prev || {}),
          ...detail,
        }));
        requestAnimationFrame(() => {
          scrollToBottom(false);
        });
      }
    } catch (err) {
      console.error('Failed to load conversation detail', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConv || sending) return;

    const content = replyText.trim();
    const activeId = selectedConv.id;
    setReplyText('');
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      conversationId: activeId,
      senderId: user?.id,
      senderRole: user?.role || 'ADMIN',
      senderName: user?.displayName || user?.email || 'Hỗ trợ viên',
      content,
      isInternalNote,
      isOptimistic: true,
      createdAt: new Date().toISOString(),
    };

    setSelectedConv((prev: any) => {
      if (!prev || prev.id !== activeId) return prev;
      return {
        ...prev,
        status: isInternalNote ? prev.status : 'WAITING',
        messages: [...(prev.messages || []), optimisticMsg],
      };
    });

    requestAnimationFrame(() => scrollToBottom(true));

    try {
      const endpoint = isInternalNote
        ? `/support/admin/conversations/${activeId}/note`
        : `/support/admin/conversations/${activeId}/messages`;

      const res: any = await api.post(endpoint, { content });
      const savedMsg = res?.data?.data || res?.data || res;

      setSelectedConv((prev: any) => {
        if (!prev || prev.id !== activeId) return prev;
        const currentMsgs = prev.messages || [];
        return {
          ...prev,
          status: isInternalNote ? prev.status : 'WAITING',
          messages: currentMsgs.map((m: any) => (m.id === tempId ? savedMsg : m)),
        };
      });

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                status: isInternalNote ? c.status : 'WAITING',
                lastMessageAt: new Date().toISOString(),
              }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to post reply', err);
      setSelectedConv((prev: any) => {
        if (!prev || prev.id !== activeId) return prev;
        return {
          ...prev,
          messages: (prev.messages || []).map((m: any) =>
            m.id === tempId ? { ...m, isFailed: true } : m
          ),
        };
      });
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedConv) return;
    const convId = selectedConv.id;
    try {
      await api.patch(`/support/admin/conversations/${convId}/status`, {
        status: newStatus,
      });
      setSelectedConv((prev: any) => (prev && prev.id === convId ? { ...prev, status: newStatus } : prev));
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!selectedConv) return;
    const convId = selectedConv.id;
    try {
      await api.patch(`/support/admin/conversations/${convId}/priority`, {
        priority: newPriority,
      });
      setSelectedConv((prev: any) => (prev && prev.id === convId ? { ...prev, priority: newPriority } : prev));
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, priority: newPriority } : c))
      );
    } catch (err) {
      console.error('Failed to update priority', err);
    }
  };

  const handlePurgeMockData = async () => {
    setCleaning(true);
    try {
      const res: any = await api.post('/admin/purge-mock-data');
      const info = res?.data?.data || res?.data || res;
      setCleanResult(
        info?.message ||
          'Toàn bộ dữ liệu mẫu đã được xóa sạch. Hệ thống chỉ giữ lại tài khoản người dùng và kho từ vựng.'
      );
      setPurgeMockModalOpen(false);
      setSelectedConv(null);
      selectedConvIdRef.current = null;
      await fetchConversations(false);
    } catch (err) {
      console.error('Failed to purge mock data', err);
      setCleanResult('Không thể xóa dữ liệu mẫu lúc này. Vui lòng kiểm tra lại quyền Admin.');
    } finally {
      setCleaning(false);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'URGENT':
        return (
          <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 text-[9px] font-black uppercase">
            Khẩn Cấp
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px] font-black uppercase">
            Cao
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 text-[9px] font-bold uppercase">
            Thường
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden space-y-1 animate-fade-in">
      {/* ULTRA-MINIMAL TOP BAR: Focused on resolving tickets without clutter */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 shrink-0 px-0.5 py-0.5">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold text-slate-200 tracking-tight flex items-center gap-1.5">
            <Headphones className="w-3.5 h-3.5 text-indigo-400" />
            <span>Hỗ Trợ CSKH</span>
          </h2>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800/80 text-slate-400 text-[10px] font-bold border border-slate-700/60">
            {conversations.length}
          </span>

          {/* Quick Filter Pills */}
          <div className="flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold ml-1">
            {(['ALL', 'OPEN', 'WAITING', 'RESOLVED'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-2 py-0.5 rounded-md transition ${
                  activeFilter === f
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f === 'ALL' ? 'Tất cả' : f === 'OPEN' ? 'Chờ nhận' : f === 'WAITING' ? 'Đã trả lời' : 'Đã xong'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Purge Mock Data Action */}
          <button
            onClick={() => setPurgeMockModalOpen(true)}
            className="flex items-center gap-1 px-2 py-0.8 rounded-lg text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition shadow-xs"
            title="Xóa toàn bộ dữ liệu mẫu (tickets, feedback, orders), chỉ giữ user và từ vựng"
          >
            <ShieldCheck className="w-3 h-3" />
            <span className="hidden sm:inline">Dọn data mẫu</span>
          </button>

          {/* Cleanup old messages */}
          <button
            onClick={() => setCleanModalOpen(true)}
            className="flex items-center gap-1 px-2 py-0.8 rounded-lg text-[10px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition shadow-xs"
            title="Dọn dẹp tin nhắn cũ hơn 3 ngày"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Dọn &gt;3 ngày</span>
          </button>

          <button
            onClick={() => fetchConversations(false)}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {cleanResult && (
        <div className="p-2 px-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl flex items-center justify-between shrink-0 animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{cleanResult}</span>
          </div>
          <button onClick={() => setCleanResult(null)} className="font-bold underline text-xs ml-4">
            Đóng
          </button>
        </div>
      )}

      {/* 2. MAIN WORKSPACE: Fills 100% remaining height without page scroll */}
      <div className="flex-1 min-h-0 flex gap-1.5 items-stretch overflow-hidden">
        {/* COLUMN 1: TICKET LIST (Compact width ~260-280px) */}
        <div className="w-64 sm:w-72 shrink-0 flex flex-col h-full min-h-0 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          {/* Search Bar */}
          <div className="p-1.5 border-b border-slate-800 bg-slate-950/40 shrink-0">
            <div className="relative">
              <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm Ticket ID, email, tiêu đề..."
                className="w-full pl-7 pr-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Ticket Items Scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto p-1 space-y-1">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Không có yêu cầu nào phù hợp.
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = selectedConv?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectConversation(c)}
                    className={`p-2 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-xs'
                        : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono font-bold text-indigo-400">
                        {c.ticketId}
                      </span>
                      <div className="flex items-center gap-1">
                        {c.unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-indigo-500 text-white text-[9px] font-bold">
                            {c.unreadCount}
                          </span>
                        )}
                        {getPriorityBadge(c.priority)}
                      </div>
                    </div>
                    <h4 className="text-xs font-semibold truncate leading-tight text-white">
                      {c.subject}
                    </h4>
                    <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-400">
                      <span className="truncate max-w-[130px]">
                        {c.user?.displayName || c.user?.email || 'Học viên'}
                      </span>
                      <span>{new Date(c.lastMessageAt).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 2: ACTIVE CHAT THREAD (Expands to fill center) */}
        {selectedConv ? (
          <div className="flex-1 min-w-0 flex flex-col h-full min-h-0 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden relative shadow-md">
            {/* Header */}
            <div className="p-2.5 px-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-2 shrink-0">
              <div className="min-w-0 flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-indigo-400 shrink-0">
                  {selectedConv.ticketId}
                </span>
                <span
                  className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded shrink-0 ${
                    selectedConv.status === 'OPEN'
                      ? 'bg-amber-500/20 text-amber-400'
                      : selectedConv.status === 'WAITING'
                      ? 'bg-sky-500/20 text-sky-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  [{selectedConv.status}]
                </span>
                <h3 className="text-xs font-bold text-white truncate max-w-sm sm:max-w-md">
                  {selectedConv.subject}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {selectedConv.status !== 'RESOLVED' ? (
                  <button
                    onClick={() => handleStatusChange('RESOLVED')}
                    className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-[11px] font-bold hover:bg-emerald-500/25 transition flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Đóng Ticket</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange('OPEN')}
                    className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-bold hover:bg-slate-700 transition"
                  >
                    Mở lại
                  </button>
                )}

                {/* Toggle Profile Context Button */}
                <button
                  onClick={() => setShowProfile((prev) => !prev)}
                  className={`p-1 px-2 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                    showProfile
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Xem hồ sơ học viên & SLA"
                >
                  <User className="w-3 h-3" />
                  <span className="hidden sm:inline">Hồ sơ</span>
                </button>
              </div>
            </div>

            {/* Virtualized Message Body Container with strictly bounded height & overflow-y */}
            <div className="flex-1 min-h-0 relative overflow-hidden bg-slate-950/40 text-xs">
              <div className="absolute inset-0">
                <VirtualChatPane
                  conversationId={selectedConv.id}
                  rawMessages={selectedConv.messages || []}
                  currentUserId={user?.id}
                  currentUserRole={user?.role || 'ADMIN'}
                  isLoading={detailLoading}
                  emptyPlaceholder="Chưa có tin nhắn trong hội thoại này."
                  onMarkRead={handleMarkAdminRead}
                  isCompact={false}
                />
              </div>
            </div>

            {/* Composer */}
            <form onSubmit={handleSendMessage} className="p-2 border-t border-slate-800 bg-slate-900 space-y-1.5 shrink-0">
              <div className="flex items-center justify-between text-xs px-0.5">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(false)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition ${
                      !isInternalNote
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Trả lời học viên
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(true)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
                      isInternalNote
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Lock className="w-2.5 h-2.5" />
                    <span>Ghi chú nội bộ</span>
                  </button>
                </div>

                <span className="text-[9px] text-slate-500 hidden sm:inline">
                  {isInternalNote ? 'Học viên không thấy ghi chú này' : 'Gửi trực tiếp tới học viên'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    isInternalNote
                      ? 'Viết ghi chú bàn giao ca trực hoặc điều tra...'
                      : 'Nhập phản hồi gửi tới học viên...'
                  }
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 ${
                    isInternalNote
                      ? 'bg-amber-500/10 border border-amber-500/30 focus:ring-amber-400'
                      : 'bg-slate-800 border border-slate-700 focus:ring-indigo-500'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || sending}
                  className={`p-1.5 rounded-lg text-white transition disabled:opacity-50 shrink-0 ${
                    isInternalNote ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-900 rounded-xl border border-slate-800 p-8 text-center text-xs text-slate-400">
            Chọn một yêu cầu bên trái để xem cuộc trao đổi.
          </div>
        )}

        {/* COLUMN 3: COLLAPSIBLE CUSTOMER CONTEXT SIDEBAR */}
        {selectedConv && showProfile && (
          <div className="w-60 xl:w-64 shrink-0 flex flex-col h-full min-h-0 bg-slate-900 rounded-xl border border-slate-800 p-3 space-y-3 text-xs overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="font-bold text-white uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <User className="w-3 h-3 text-indigo-400" />
                <span>Hồ Sơ Học Viên</span>
              </h4>
              <button
                onClick={() => setShowProfile(false)}
                className="text-slate-500 hover:text-white p-0.5 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-[11px]">
              <div>
                <span className="text-[9px] text-slate-500 uppercase font-bold">Họ và tên</span>
                <p className="font-bold text-white text-xs truncate">
                  {selectedConv.user?.displayName || 'Chưa cập nhật'}
                </p>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase font-bold">Email</span>
                <p className="font-mono text-slate-300 text-[10px] truncate">
                  {selectedConv.user?.email || 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase font-bold">Gói tài khoản</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span className="font-bold text-indigo-300 text-xs">
                    {selectedConv.user?.subscriptions?.[0]?.plan?.name || selectedConv.user?.role || 'Miễn Phí'}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase font-bold">Trình độ CEFR</span>
                <p className="font-bold text-emerald-400 text-xs">
                  {selectedConv.user?.profile?.englishLevel || 'B1'} &rarr; {selectedConv.user?.profile?.targetLevel || 'C1'}
                </p>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase font-bold">Chuỗi học / XP</span>
                <p className="text-slate-300 font-semibold text-xs">
                  🔥 {selectedConv.user?.streak?.currentStreak || 0} ngày • {selectedConv.user?.xp?.totalXP || 0} XP
                </p>
              </div>
            </div>

            {/* Priority Controls */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <span className="text-[9px] text-slate-500 uppercase font-bold block">
                Độ ưu tiên xử lý
              </span>
              <div className="grid grid-cols-3 gap-1 text-[9px] font-bold">
                {['LOW', 'NORMAL', 'URGENT'].map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePriorityChange(p)}
                    className={`py-1 rounded-md transition text-center ${
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
        )}
      </div>

      {/* MODAL: Purge Mock Data */}
      {purgeMockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full space-y-3.5 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Xác nhận xóa sạch dữ liệu mẫu</h3>
                <p className="text-[11px] text-slate-400">Vận hành dữ liệu thực 100%</p>
              </div>
            </div>
            <div className="text-xs text-slate-300 leading-relaxed space-y-1.5">
              <p>Thao tác này sẽ xóa vĩnh viễn toàn bộ dữ liệu mẫu (mock data):</p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-400 pl-1 text-[11px]">
                <li>Xóa toàn bộ tin nhắn & yêu cầu hỗ trợ (tickets) mẫu</li>
                <li>Xóa toàn bộ đóng góp ý kiến (feedbacks) mẫu</li>
                <li>Xóa toàn bộ đơn hàng giao dịch giả lập</li>
                <li>Xóa toàn bộ thông báo hệ thống mẫu</li>
              </ul>
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-[11px]">
                🛡️ BẢO LƯU 100%: Tài khoản người dùng (Users) và toàn bộ Kho từ vựng (Vocabulary).
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={cleaning}
                onClick={() => setPurgeMockModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl bg-slate-800 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={cleaning}
                onClick={handlePurgeMockData}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl transition flex items-center gap-1.5"
              >
                {cleaning && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>Xác nhận xóa sạch data mẫu</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Cleanup Old Messages (> 3 days) */}
      {cleanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full space-y-3.5 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Dọn dẹp tin nhắn cũ &gt;3 ngày</h3>
                <p className="text-[11px] text-slate-400">Tối ưu dung lượng Database</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Xóa sạch nội dung tin nhắn cũ hơn <strong>3 ngày</strong>.
              <br />
              <span className="text-emerald-400 font-semibold">Lưu ý:</span> Hồ sơ yêu cầu (tickets) và thông tin học viên vẫn được bảo lưu an toàn.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCleanModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl bg-slate-800 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={cleaning}
                onClick={async () => {
                  setCleaning(true);
                  try {
                    const res: any = await api.post('/support/admin/cleanup-old-messages', { days: 3 });
                    setCleanResult(res?.data?.data?.message || 'Đã dọn dẹp sạch tin nhắn cũ hơn 3 ngày thành công.');
                    setCleanModalOpen(false);
                    if (selectedConv?.id) fetchDetail(selectedConv.id);
                  } catch (err) {
                    console.error('Failed to cleanup messages', err);
                    setCleanResult('Không thể thực hiện dọn dẹp lúc này.');
                  } finally {
                    setCleaning(false);
                  }
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition flex items-center gap-1.5"
              >
                {cleaning && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
