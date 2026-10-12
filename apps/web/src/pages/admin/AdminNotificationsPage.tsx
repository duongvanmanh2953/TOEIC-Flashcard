import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Send,
  Users,
  Sparkles,
  CheckCircle2,
  History,
  AlertCircle,
  AlertTriangle,
  Info,
  Gift,
  Zap,
  ShieldAlert,
  RefreshCw,
  ListFilter,
  User,
  Clock,
  CheckCheck,
  Eye,
  Trash2,
  ExternalLink,
  CreditCard,
  Headphones,
  MessageSquarePlus,
  Cpu,
  Activity,
  Check,
} from 'lucide-react';
import api, { extractApiList } from '../../lib/api';
import { useTranslation } from '../../i18n';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { getSocket } from '../../lib/socket';

export type AlertSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertCategory =
  | 'ALL'
  | 'UNREAD'
  | 'CRITICAL'
  | 'SUPPORT'
  | 'FEEDBACK'
  | 'BILLING'
  | 'AI'
  | 'SECURITY'
  | 'SYSTEM'
  | 'BROADCAST';

export interface OperationalAlert {
  id: string;
  type: string;
  priority: AlertSeverity;
  title: string;
  message: string;
  targetType?: string;
  targetId?: string;
  route?: string;
  isRead: boolean;
  createdAt: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  audience: string;
  status: string;
  targetCount: number;
  createdAt: string;
  sentAt?: string;
}

export const AdminNotificationsPage: React.FC = () => {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState<AlertCategory>('ALL');
  const [alerts, setAlerts] = useState<OperationalAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clearAllModalOpen, setClearAllModalOpen] = useState(false);

  // Broadcast & Announcement Form
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'FREE' | 'PREMIUM' | 'INACTIVE_7D'>('ALL');
  const [broadcastType, setBroadcastType] = useState('INFO');
  const [actionUrl, setActionUrl] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch alerts from backend
  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.get('/notifications/admin/all', { params: { limit: 60 } });
      const extracted = extractApiList(res);
      const items = extracted.items || [];

      const mapped: OperationalAlert[] = items.map((item: any) => {
        const p: AlertSeverity =
          item.data?.priority ||
          (item.type?.includes('CRITICAL') || item.type?.includes('BREACH')
            ? 'CRITICAL'
            : item.type?.includes('FAILED') || item.type?.includes('BUG') || item.type?.includes('HIGH')
            ? 'HIGH'
            : item.type?.includes('FEEDBACK') || item.type?.includes('CONVERSATION')
            ? 'MEDIUM'
            : 'INFO');

        return {
          id: item.id,
          type: item.type || 'SYSTEM_INFO',
          priority: p,
          title: item.title,
          message: item.body || item.message || '',
          targetType: item.data?.targetType || item.type?.split('_')[0],
          targetId: item.data?.targetId || item.data?.feedbackId || item.data?.conversationId,
          route: item.data?.route,
          isRead: Boolean(item.readAt),
          createdAt: item.createdAt,
        };
      });

      setAlerts(mapped);
    } catch (err: any) {
      console.error('Failed to load operational alerts:', err);
      setError(locale === 'vi' ? 'Không thể tải trung tâm cảnh báo vận hành.' : 'Unable to load operational alerts.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    setLoadingAnnouncements(true);
    try {
      const res: any = await api.get('/notifications/announcements');
      const extracted = extractApiList(res);
      setAnnouncements(extracted.items || []);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetchAnnouncements();

    // Listen on real-time operational events
    const socket = getSocket();
    socket.emit('join_admin_support');

    const onNewAdminEvent = (event: any) => {
      const newAlert: OperationalAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        type: event.type || 'NEW_EVENT',
        priority: event.priority || 'INFO',
        title: event.title || 'Sự kiện vận hành mới',
        message: event.message || '',
        targetType: event.targetType,
        targetId: event.targetId,
        isRead: false,
        createdAt: event.timestamp || new Date().toISOString(),
      };
      setAlerts((prev) => [newAlert, ...prev]);
    };

    socket.on('admin_event:new', onNewAdminEvent);

    return () => {
      socket.off('admin_event:new', onNewAdminEvent);
    };
  }, []);

  // Action handlers
  const handleMarkRead = async (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)),
    );
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    try {
      await api.post('/notifications/read-all');
    } catch {
      // silent
    }
  };

  const handleDeleteAlert = async (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    try {
      await api.delete(`/notifications/${id}`);
    } catch {
      // silent
    }
  };

  const handleOpenDestination = (alert: OperationalAlert) => {
    handleMarkRead(alert.id);
    if (alert.route) {
      let r = alert.route;
      if (r.includes('/vocabulary?tab=moderation') || r.includes('tab=moderation')) {
        navigate('/admin/shared-vocabulary?status=PENDING');
        return;
      }
      navigate(r);
      return;
    }
    const tType = alert.targetType?.toUpperCase() || '';
    if (tType.includes('CONV') || tType.includes('SUPPORT')) {
      navigate('/admin/conversations');
    } else if (tType.includes('FEEDBACK') || tType.includes('BUG')) {
      navigate('/admin/feedback');
    } else if (tType.includes('PAY') || tType.includes('BILL')) {
      navigate('/admin/finance');
    } else if (tType.includes('AI')) {
      navigate('/admin/ai');
    } else if (tType.includes('USER')) {
      navigate('/admin/users');
    } else {
      navigate('/admin/dashboard');
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastContent.trim()) return;

    setBroadcasting(true);
    setSuccessMsg('');

    try {
      await api.post('/notifications/broadcast', {
        title: broadcastTitle,
        message: broadcastContent,
        type: broadcastType,
        targetAudience,
        data: actionUrl ? { link: actionUrl, route: actionUrl } : undefined,
      });

      setSuccessMsg('Đã phát sóng thông báo thành công tới các học viên mục tiêu!');
      const newAnnouncement: OperationalAnnouncement = {
        id: `bc_${Date.now()}`,
        title: broadcastTitle,
        message: broadcastContent,
        createdAt: new Date().toISOString(),
        author: 'Admin',
        type: broadcastType,
        targetAudience,
      };
      setAnnouncements((prev) => [newAnnouncement, ...prev]);
      setBroadcastTitle('');
      setBroadcastContent('');
      setActionUrl('');
      setShowBroadcastModal(false);
    } catch (err) {
      console.error('Failed to send broadcast:', err);
    } finally {
      setBroadcasting(false);
    }
  };

  // Filter alerts by active category
  const filteredAlerts = alerts.filter((a) => {
    if (activeCategory === 'UNREAD') return !a.isRead;
    if (activeCategory === 'CRITICAL') return a.priority === 'CRITICAL' || a.priority === 'HIGH';
    if (activeCategory === 'SUPPORT')
      return a.type.includes('SUPPORT') || a.type.includes('CONVERSATION');
    if (activeCategory === 'FEEDBACK')
      return a.type.includes('FEEDBACK') || a.type.includes('BUG') || a.type.includes('FEATURE');
    if (activeCategory === 'BILLING')
      return a.type.includes('PAYMENT') || a.type.includes('SUBSCRIPTION') || a.type.includes('BILLING');
    if (activeCategory === 'AI') return a.type.includes('AI');
    if (activeCategory === 'SECURITY') return a.type.includes('SECURITY') || a.type.includes('ROLE');
    if (activeCategory === 'SYSTEM') return a.type.includes('SYSTEM') || a.type.includes('ERROR');
    return true;
  });

  const criticalCount = alerts.filter((a) => a.priority === 'CRITICAL' || a.priority === 'HIGH').length;
  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const getPriorityBadge = (priority: AlertSeverity) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[9px] font-black uppercase border border-rose-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black uppercase border border-amber-500/30">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-bold uppercase border border-indigo-500/30">
            MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px] font-bold uppercase">
            LOW
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[9px] font-bold uppercase">
            INFO
          </span>
        );
    }
  };

  const getCategoryIcon = (alert: OperationalAlert) => {
    const t = alert.type;
    if (t.includes('SUPPORT') || t.includes('CONVERSATION')) {
      return <Headphones className="w-4 h-4 text-indigo-400 shrink-0" />;
    }
    if (t.includes('BUG') || t.includes('FEEDBACK') || t.includes('FEATURE')) {
      return <MessageSquarePlus className="w-4 h-4 text-amber-400 shrink-0" />;
    }
    if (t.includes('PAYMENT') || t.includes('BILLING')) {
      return <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    if (t.includes('AI')) {
      return <Cpu className="w-4 h-4 text-purple-400 shrink-0" />;
    }
    if (t.includes('SECURITY')) {
      return <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />;
    }
    return <Activity className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Operational Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-400" />
              <span>Trung Tâm Cảnh Báo & Điều Hành Vận Hành (Alert Center)</span>
            </h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                {unreadCount} Chưa đọc
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Giám sát cảnh báo SLA, sự cố thanh toán, đề xuất tính năng, lỗi AI và phát thanh học viên
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchAlerts}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Tải lại cảnh báo"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition shadow-xs"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Đọc tất cả</span>
            </button>
          )}

          {alerts.length > 0 && (
            <button
              onClick={() => setClearAllModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition"
              title="Xóa sạch cảnh báo"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa tất cả</span>
            </button>
          )}

          <button
            onClick={() => setShowBroadcastModal(true)}
            className="btn-glass-primary !shadow-none flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Soạn Phát Sóng</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="underline text-xs">
            Đóng
          </button>
        </div>
      )}

      {/* Tabs Filter Bar (9 Categories) */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto chat-scrollbar">
        {[
          { id: 'ALL', label: 'Tất cả', count: alerts.length },
          { id: 'UNREAD', label: 'Chưa đọc', count: unreadCount, badgeColor: 'bg-rose-500 text-white' },
          { id: 'CRITICAL', label: 'Khẩn cấp', count: criticalCount, badgeColor: 'bg-rose-500/20 text-rose-300' },
          { id: 'SUPPORT', label: 'Hỗ trợ CSKH' },
          { id: 'FEEDBACK', label: 'Góp ý & Bug' },
          { id: 'BILLING', label: 'Tài chính' },
          { id: 'AI', label: 'AI Engine' },
          { id: 'SECURITY', label: 'Bảo mật' },
          { id: 'SYSTEM', label: 'Hạ tầng' },
        ].map((tab) => {
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as AlertCategory)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                    tab.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300')
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Alert Feed List */}
      <div className="space-y-2.5">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-200">Không có cảnh báo nào trong danh mục này</h3>
            <p className="text-xs text-slate-500">Mọi sự cố vận hành đã được giải quyết hoặc chưa có cảnh báo mới.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-2xl border transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                alert.isRead
                  ? 'bg-slate-900/50 border-slate-800/70 text-slate-300'
                  : 'bg-slate-900 border-indigo-500/40 text-white shadow-md'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="mt-0.5 p-2 rounded-xl bg-slate-950 border border-slate-800">
                  {getCategoryIcon(alert)}
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getPriorityBadge(alert.priority)}
                    <span className="text-[10px] tabular-nums text-slate-400">{alert.type}</span>
                    <span className="text-[10px] text-slate-500">•</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(alert.createdAt).toLocaleString([], {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {!alert.isRead && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500" title="Chưa đọc" />
                    )}
                  </div>

                  <h3 className="text-xs font-bold text-white leading-snug truncate">{alert.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{alert.message}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => handleOpenDestination(alert)}
                  className="btn-glass-primary !shadow-none flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Xem chi tiết</span>
                </button>

                {!alert.isRead ? (
                  <button
                    onClick={() => handleMarkRead(alert.id)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    title="Đánh dấu đã đọc"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                    title="Xóa thông báo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Broadcast Announcement Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Soạn Phát Sóng Cho Học Viên</h3>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Đối tượng nhận tin</label>
                  <CustomSelect
                    value={targetAudience}
                    onChange={(val) => setTargetAudience(val as any)}
                    options={[
                      { value: 'ALL', label: 'Toàn bộ học viên (ALL Learners)' },
                      { value: 'FREE', label: 'Học viên gói Free (Cần khuyến mãi)' },
                      { value: 'PREMIUM', label: 'Học viên VIP Pro (Đặc quyền VIP)' },
                      { value: 'INACTIVE_7D', label: 'Học viên chưa học > 7 ngày' },
                    ]}
                    size="sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Loại thông báo</label>
                  <CustomSelect
                    value={broadcastType}
                    onChange={(val) => setBroadcastType(val)}
                    options={[
                      { value: 'INFO', label: 'Thông tin & Cập nhật (INFO)' },
                      { value: 'PROMOTION', label: 'Khuyến mãi & Nâng cấp (PROMOTION)' },
                      { value: 'SYSTEM', label: 'Cảnh báo hệ thống (SYSTEM)' },
                      { value: 'FEATURE', label: 'Tính năng học tập mới (FEATURE)' },
                    ]}
                    size="sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Tiêu đề phát sóng</label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="VD: Ra mắt tính năng luyện thi TOEIC thông minh 2026..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Nội dung chi tiết</label>
                <textarea
                  required
                  rows={4}
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  placeholder="Mô tả cụ thể thông báo hoặc chương trình ưu đãi..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Đường dẫn hành động (Action URL - Tùy chọn)</label>
                <input
                  type="text"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  placeholder="VD: /upgrade hoặc /community"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={broadcasting}
                  className="btn-glass-primary !shadow-none px-5 py-2 rounded-xl font-bold transition flex items-center gap-2"
                >
                  {broadcasting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Phát Sóng Ngay</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {clearAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Xác nhận xóa toàn bộ thông báo</h3>
                <p className="text-xs text-slate-400">Dọn dẹp sạch sẽ trung tâm cảnh báo vận hành</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa toàn bộ cảnh báo và thông báo hiện có? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClearAllModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl bg-slate-800 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={async () => {
                  setAlerts([]);
                  setClearAllModalOpen(false);
                  try {
                    await api.delete('/notifications/admin/all');
                  } catch {
                    try {
                      await api.delete('/notifications');
                    } catch {
                      // silent
                    }
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition"
              >
                Xác nhận xóa sạch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationsPage;
