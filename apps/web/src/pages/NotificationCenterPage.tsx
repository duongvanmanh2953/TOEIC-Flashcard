import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { GlassCard } from '../components/common/GlassCard';
import {
  Bell,
  CheckCircle2,
  Trash2,
  Sparkles,
  MessageSquare,
  Award,
  CreditCard,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  RefreshCw,
  Clock,
  Layers,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: any;
  readAt?: string | null;
  createdAt: string;
}

export const NotificationCenterPage: React.FC = () => {
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'SUPPORT' | 'LEARNING' | 'BILLING' | 'SYSTEM'>('ALL');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, [activeTab]);

  const fetchNotifications = async () => {
    if (isGuest) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const typeParam = activeTab === 'UNREAD' || activeTab === 'ALL' ? undefined : activeTab;
      const unreadOnly = activeTab === 'UNREAD';
      const res: any = await api.get('/notifications', {
        params: {
          type: typeParam,
          unreadOnly: unreadOnly ? 'true' : undefined,
          limit: 30,
        },
      });
      const data = res?.data?.data || res?.data || res;
      const items = data.items || (Array.isArray(data) ? data : []);
      const normalized = items.map((item: any) => ({
        ...item,
        body: item.body || item.message || '',
        readAt: item.readAt || (item.isRead ? new Date().toISOString() : null),
      }));
      setNotifications(normalized);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string, route?: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      if (route) {
        navigate(route);
      }
    } catch (err) {
      console.error('Error marking as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() })),
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read', err);
    }
  };

  const clearAll = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ thông báo?')) return;
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error clearing notifications', err);
    }
  };

  const deleteOne = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUPPORT_REPLY':
      case 'SUPPORT_TICKET_UPDATE':
        return <MessageSquare className="w-4 h-4 text-sky-500" />;
      case 'LEARNING_REMINDER':
      case 'REVIEW_READY':
        return <Sparkles className="w-4 h-4 text-indigo-500" />;
      case 'ACHIEVEMENT':
        return <Award className="w-4 h-4 text-amber-500" />;
      case 'BILLING':
      case 'SUBSCRIPTION_CHANGED':
      case 'PAYMENT_SUCCESS':
        return <CreditCard className="w-4 h-4 text-emerald-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in p-4 sm:p-6 lg:p-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1 border border-indigo-500/20">
            <Bell className="w-3.5 h-3.5" />
            <span>Notification Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Thông Báo Hệ Thống
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cập nhật tức thì phản hồi CSKH, nhắc nhở SRS thời điểm vàng và đặc quyền tài khoản.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Đánh dấu đã đọc tất cả</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
              title="Xóa toàn bộ thông báo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
        {[
          { id: 'ALL', label: 'Tất cả' },
          { id: 'UNREAD', label: `Chưa đọc ${unreadCount > 0 ? `(${unreadCount})` : ''}` },
          { id: 'SUPPORT', label: 'Hỗ trợ CSKH' },
          { id: 'LEARNING', label: 'Học tập & SRS' },
          { id: 'BILLING', label: 'Gói cước VIP' },
          { id: 'SYSTEM', label: 'Hệ thống' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl transition shrink-0 ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : notifications.length === 0 ? (
        <GlassCard className="p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
            <Bell className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Bạn đã xem hết mọi thông báo!
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Hiện không có thông báo mới nào trong danh mục này. Hãy tiếp tục duy trì chuỗi học tập hàng ngày nhé.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => {
            const isUnread = !n.readAt;
            const targetRoute = n.data?.route;

            return (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id, targetRoute)}
                className={`p-4 rounded-2xl border transition cursor-pointer group flex items-start gap-3.5 ${
                  isUnread
                    ? 'bg-indigo-500/[0.04] dark:bg-indigo-500/[0.08] border-indigo-500/30 hover:border-indigo-500/50 shadow-xs'
                    : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm tracking-tight truncate ${isUnread ? 'font-black text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                        {n.title}
                      </h4>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {n.body}
                  </p>

                  {targetRoute && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                      <span>Xem chi tiết</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => deleteOne(n.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition shrink-0"
                  title="Xóa thông báo này"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
