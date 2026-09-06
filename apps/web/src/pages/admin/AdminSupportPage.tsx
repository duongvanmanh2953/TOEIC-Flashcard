import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
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
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { getSocket } from '../../lib/socket';

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
    const nearBottom = distanceFromBottom < 80;
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
      // Background silent fetch: do NOT wipe screen or reset active conversation
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
        // Update unread count / last message preview in conversation list
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
        // Prevent duplicate append
        if (currentMsgs.some((m: any) => m.id === msg.id)) return prev;
        // Clean up any optimistic message matching the content
        const cleaned = currentMsgs.filter(
          (m: any) => !(m.isOptimistic && m.content === msg.content)
        );
        return {
          ...prev,
          messages: [...cleaned, msg],
        };
      });

      // Auto scroll if user was near bottom, else show floating pill
      if (isNearBottomRef.current) {
        requestAnimationFrame(() => scrollToBottom(true));
      } else {
        setHasUnreadBelow(true);
      }
    };

    socket.on('new_message', onNewMsg);

    return () => {
      socket.off('new_message', onNewMsg);
    };
  }, [selectedConv?.id]);

  useEffect(() => {
    fetchConversations(false);
  }, [activeFilter, search]);

  // When switching conversations, fetch detail and scroll to bottom instantly
  const handleSelectConversation = (conv: any) => {
    if (selectedConvIdRef.current === conv.id) return;
    setSelectedConv(conv);
    selectedConvIdRef.current = conv.id;
    fetchDetail(conv.id);
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

      // If we are actively viewing a conversation, ensure it stays visible in list
      if (selectedConvIdRef.current) {
        const found = items.find((c: any) => c.id === selectedConvIdRef.current);
        if (!found && selectedConv) {
          items = [selectedConv, ...items];
        }
      }

      setConversations(items);

      // Only auto-select first conversation on initial clean mount
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
    // Only show spinner if we don't have messages yet
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
        // Instant scroll on ticket switch (no 500ms sliding jitter)
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

    // 1. Optimistic append - Instant UI feedback
    setSelectedConv((prev: any) => {
      if (!prev || prev.id !== activeId) return prev;
      return {
        ...prev,
        status: isInternalNote ? prev.status : 'WAITING',
        messages: [...(prev.messages || []), optimisticMsg],
      };
    });

    // 2. Instant scroll to bottom for sender
    requestAnimationFrame(() => scrollToBottom(true));

    try {
      const endpoint = isInternalNote
        ? `/support/admin/conversations/${activeId}/note`
        : `/support/admin/conversations/${activeId}/messages`;

      const res: any = await api.post(endpoint, { content });
      const savedMsg = res?.data?.data || res?.data || res;

      // 3. Reconcile temporary ID with real saved message
      setSelectedConv((prev: any) => {
        if (!prev || prev.id !== activeId) return prev;
        const currentMsgs = prev.messages || [];
        return {
          ...prev,
          status: isInternalNote ? prev.status : 'WAITING',
          messages: currentMsgs.map((m: any) => (m.id === tempId ? savedMsg : m)),
        };
      });

      // 4. Update conversation in list without full page reset
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
      // Mark optimistic message as failed
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
          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase">
            Khẩn Cấp
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase">
            Cao
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold uppercase">
            Bình Thường
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Headphones className="w-5 h-5 text-indigo-400" />
            <span>Hộp Thư Hỗ Trợ Khách Hàng (Support Inbox)</span>
          </h1>
          <p className="text-xs text-slate-400">
            Hội thoại thời gian thực, quản lý SLA, phản hồi học viên và lưu trữ ghi chú nội bộ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

          {/* Purge Mock Data Action */}
          <button
            onClick={() => setPurgeMockModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition"
            title="Xóa toàn bộ dữ liệu mẫu (tickets, feedback, orders), chỉ giữ user và từ vựng"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Xóa sạch data mẫu</span>
          </button>

          {/* Cleanup old messages */}
          <button
            onClick={() => setCleanModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
            title="Dọn dẹp tin nhắn cũ hơn 3 ngày"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Dọn tin &gt;3 ngày</span>
          </button>

          <button
            onClick={() => fetchConversations(false)}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {cleanResult && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{cleanResult}</span>
          </div>
          <button onClick={() => setCleanResult(null)} className="font-bold underline text-xs ml-4">
            Đóng
          </button>
        </div>
      )}

      {/* Confirmation Modal for Purge Mock Data */}
      {purgeMockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Xóa Sạch Toàn Bộ Dữ Liệu Mẫu</h3>
                <p className="text-xs text-slate-400">Vận hành dữ liệu thực 100%</p>
              </div>
            </div>
            <div className="text-xs text-slate-300 leading-relaxed space-y-2">
              <p>
                Thao tác này sẽ dọn sạch toàn bộ dữ liệu mẫu (mock data) hiện có trên Database:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                <li>Xóa toàn bộ tin nhắn & phiếu hỗ trợ (Tickets) mẫu</li>
                <li>Xóa toàn bộ đóng góp ý kiến (Feedbacks) mẫu</li>
                <li>Xóa toàn bộ đơn hàng giao dịch giả lập</li>
                <li>Xóa toàn bộ thông báo hệ thống mẫu</li>
              </ul>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                🛡️ BẢO LƯU 100%: Tài khoản người dùng (Users) và toàn bộ Kho từ vựng (Vocabulary).
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={cleaning}
                onClick={() => setPurgeMockModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl bg-slate-800 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={cleaning}
                onClick={handlePurgeMockData}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl transition flex items-center gap-1.5"
              >
                {cleaning && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Xác nhận xóa sạch data mẫu</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Message Purge (> 3 days) */}
      {cleanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Xác nhận dọn dẹp tin nhắn cũ</h3>
                <p className="text-xs text-slate-400">Chỉ Admin mới có quyền thực thi thao tác này</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Thao tác này sẽ xóa sạch nội dung tin nhắn cũ hơn <strong>3 ngày</strong>.
              <br /><br />
              <span className="text-emerald-400 font-semibold">Lưu ý:</span> Hồ sơ yêu cầu (Tickets) và thông tin học viên vẫn được bảo lưu an toàn.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCleanModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl bg-slate-800 transition"
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
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition flex items-center gap-1.5"
              >
                {cleaning && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
                    onClick={() => handleSelectConversation(c)}
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
                      <div className="flex items-center gap-1.5">
                        {c.unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-indigo-500 text-white text-[9px] font-bold">
                            {c.unreadCount}
                          </span>
                        )}
                        {getPriorityBadge(c.priority)}
                      </div>
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
              <div className="xl:col-span-8 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col h-[640px] overflow-hidden shadow-lg relative">
                {/* Header */}
                <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2 shrink-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-400">
                        {selectedConv.ticketId}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          selectedConv.status === 'OPEN'
                            ? 'bg-amber-500/20 text-amber-400'
                            : selectedConv.status === 'WAITING'
                            ? 'bg-sky-500/20 text-sky-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
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

                {/* Message Body Container: Virtualized smooth scroll, zero jitter */}
                <div
                  ref={messagesContainerRef}
                  onScroll={handleContainerScroll}
                  className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-950/30 text-xs relative"
                  style={{ willChange: 'transform' }}
                >
                  {detailLoading && (!selectedConv.messages || selectedConv.messages.length === 0) ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                    </div>
                  ) : selectedConv.messages?.length === 0 ? (
                    <p className="text-center text-slate-500 my-auto py-12">Chưa có tin nhắn trong hội thoại này.</p>
                  ) : (
                    selectedConv.messages?.map((m: any) => {
                      const isInternal = m.isInternalNote;
                      const isAdmin = m.senderRole === 'ADMIN' || m.senderRole === 'SUPER_ADMIN';

                      if (isInternal) {
                        return (
                          <div
                            key={m.id}
                            className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs my-2 animate-fade-in"
                          >
                            <div className="flex items-center gap-1.5 font-black uppercase text-[9px] text-amber-400 mb-1">
                              <Lock className="w-3 h-3" />
                              <span>Ghi chú nội bộ (Chỉ Admin nhìn thấy) • {m.senderName}</span>
                            </div>
                            <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} animate-fade-in`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-400">
                            <span className="font-bold text-slate-300">{m.senderName}</span>
                            <span>
                              {new Date(m.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {m.isOptimistic && (
                              <span className="text-indigo-400 animate-pulse text-[9px] font-semibold">
                                • Đang gửi...
                              </span>
                            )}
                            {m.isFailed && (
                              <span className="text-rose-400 text-[9px] font-semibold">
                                • Gửi thất bại
                              </span>
                            )}
                          </div>
                          <div
                            className={`p-3 rounded-2xl leading-relaxed max-w-[85%] shadow-xs break-words whitespace-pre-wrap ${
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

                  {/* Floating New Messages Pill (When user has scrolled up) */}
                  {hasUnreadBelow && (
                    <div className="sticky bottom-2 left-0 right-0 flex justify-center pointer-events-none z-20">
                      <button
                        type="button"
                        onClick={() => scrollToBottom(true)}
                        className="pointer-events-auto px-3.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg text-[11px] font-bold flex items-center gap-1.5 transition-all transform hover:scale-105 active:scale-95 animate-bounce border border-indigo-400/40"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>Tin nhắn mới bên dưới</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Composer with Public Reply vs Internal Note toggle */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900 space-y-2 shrink-0">
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
                      {isInternalNote ? 'Khách hàng KHÔNG thấy nội dung này' : 'Gửi trực tiếp tới học viên'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={
                        isInternalNote
                          ? 'Viết ghi chú bàn giao hoặc tiến độ điều tra...'
                          : 'Viết phản hồi gửi trực tiếp tới học viên...'
                      }
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
