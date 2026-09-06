import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Info, Gift, Zap, ShieldAlert, ChevronRight, MessageSquare } from 'lucide-react';
import api from '../../lib/api';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export const NotificationBell: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      const payload = res.data?.data || res.data || {};
      setUnreadCount(payload.unreadCount ?? payload.count ?? 0);
    } catch {
      // Ignore if not logged in
    }
  };

  const fetchRecent = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      const payload = res.data?.data || res.data || {};
      const list = payload.items || (Array.isArray(payload) ? payload : []);
      const normalized = list.map((item: any) => ({
        ...item,
        message: item.body || item.message || '',
        isRead: !!item.readAt || item.isRead || false,
      }));
      setRecentNotifications(normalized.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (dropdownOpen) {
      fetchRecent();
    }
  }, [dropdownOpen]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setRecentNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setRecentNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="relative p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        title="Thông báo hệ thống"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Thông báo</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  {unreadCount} chưa đọc
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
              >
                <Check className="w-3 h-3" />
                Đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              <div className="py-8 text-center text-slate-400 text-xs">Đang tải thông báo...</div>
            ) : recentNotifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Không có thông báo mới nào
              </div>
            ) : (
              recentNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/notifications');
                  }}
                  className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition flex items-start gap-3 ${
                    !n.isRead ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {n.type === 'PROMOTION' ? (
                      <Gift className="w-3.5 h-3.5" />
                    ) : n.type === 'ACHIEVEMENT' ? (
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                    ) : n.type === 'SUPPORT' ? (
                      <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                    ) : (
                      <Info className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {new Date(n.createdAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={(e) => handleMarkAsRead(n.id, e)}
                      className="p-1 text-slate-400 hover:text-indigo-600 flex-shrink-0"
                      title="Đánh dấu đã đọc"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              onClick={() => {
                setDropdownOpen(false);
                navigate('/notifications');
              }}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center justify-center gap-1 mx-auto"
            >
              <span>Xem toàn bộ thông báo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default NotificationBell;
