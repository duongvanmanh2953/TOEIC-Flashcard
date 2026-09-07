import React, { useState, useEffect } from 'react';
import { 
  Bell, Send, Users, Sparkles, CheckCircle2, History, 
  AlertCircle, Info, Gift, Zap, ShieldAlert, RefreshCw,
  ListFilter, User, Clock, CheckCheck, Eye
} from 'lucide-react';
import api from '../../lib/api';
import { useTranslation } from '../../i18n';

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

interface SystemNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  user?: {
    email: string;
    displayName: string;
    role: string;
  };
}

export const AdminNotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'broadcast' | 'feed'>('broadcast');

  // Broadcast & History state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'FREE' | 'PREMIUM' | 'INACTIVE_7D'>('ALL');
  const [type, setType] = useState('INFO');
  const [actionUrl, setActionUrl] = useState('');

  // System Notifications Feed state
  const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [feedTotal, setFeedTotal] = useState(0);

  const fetchAnnouncements = async () => {
    setLoadingAnnouncements(true);
    try {
      const res = await api.get('/notifications/announcements');
      const data = res.data?.data || res.data || [];
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const fetchSystemFeed = async () => {
    setLoadingFeed(true);
    try {
      const res = await api.get('/notifications/admin/all', { params: { limit: 50 } });
      const payload = res.data?.data || res.data || {};
      const items = payload.items || (Array.isArray(payload) ? payload : []);
      setSystemNotifications(items);
      setFeedTotal(payload.total || items.length);
    } catch (err) {
      console.error('Failed to load system notifications feed:', err);
    } finally {
      setLoadingFeed(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchSystemFeed();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSending(true);
    setSuccessMsg('');

    try {
      const res = await api.post('/notifications/broadcast', {
        title,
        message: content,
        type,
        targetAudience,
        data: actionUrl ? { link: actionUrl, route: actionUrl } : undefined,
      });

      setSuccessMsg(t('adminSettings.savedSuccess', 'Phát thanh thông báo thành công tới các học viên mục tiêu!'));
      setTitle('');
      setContent('');
      setActionUrl('');
      fetchAnnouncements();
      fetchSystemFeed();
    } catch (err) {
      console.error('Failed to send broadcast:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-indigo-500" />
            {t('adminNotifications.title', 'Trung Tâm Phát Thanh & Nhật Ký Thông Báo')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('adminNotifications.subtitle', 'Quản lý thông báo đẩy toàn hệ thống, tin tức khuyến mãi và nhật ký thông báo học viên.')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs font-bold">
            <button
              onClick={() => setActiveTab('broadcast')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'broadcast'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('adminNotifications.tabBroadcast', 'Phát Thông Báo & Lịch Sử')}
            </button>
            <button
              onClick={() => {
                setActiveTab('feed');
                fetchSystemFeed();
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'feed'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('adminNotifications.tabFeed', 'Nhật Ký Toàn Hệ Thống')} ({feedTotal})
            </button>
          </div>

          <button 
            onClick={() => {
              fetchAnnouncements();
              fetchSystemFeed();
            }} 
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition border border-slate-200 dark:border-slate-700"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loadingAnnouncements || loadingFeed ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center justify-between text-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="font-bold underline text-xs">Đóng</button>
        </div>
      )}

      {/* TAB 1: BROADCAST & HISTORY */}
      {activeTab === 'broadcast' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Compose Card */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-500" />
                {t('adminNotifications.formTitle', 'Soạn thông báo mới')}
              </h2>

              <form onSubmit={handleBroadcast} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t('adminNotifications.inputAudience', 'Đối tượng nhận tin')}
                    </label>
                    <select
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="ALL">Toàn bộ học viên (ALL Learners)</option>
                      <option value="FREE">Học viên gói Free (Cần khuyến mãi)</option>
                      <option value="PREMIUM">Học viên VIP Pro (Đặc quyền VIP)</option>
                      <option value="INACTIVE_7D">Học viên chưa học &gt; 7 ngày (Re-engagement)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t('adminNotifications.inputType', 'Loại thông báo')}
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="INFO">Thông tin & Cập nhật (INFO)</option>
                      <option value="PROMOTION">Khuyến mãi & Nâng cấp (PROMOTION)</option>
                      <option value="SYSTEM">Cảnh báo hệ thống (SYSTEM)</option>
                      <option value="FEATURE">Tính năng học tập mới (FEATURE)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('adminNotifications.inputTitle', 'Tiêu đề thông báo')}
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Cập nhật thuật toán FSRS 4.5 & Thử thách 7 ngày..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('adminNotifications.inputContent', 'Nội dung chi tiết')}
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Nhập nội dung ngắn gọn, thu hút hiển thị trên chuông thông báo..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('adminNotifications.actionUrl', 'Đường dẫn điều hướng (Tùy chọn)')}
                  </label>
                  <input
                    type="text"
                    value={actionUrl}
                    onChange={(e) => setActionUrl(e.target.value)}
                    placeholder="VD: /review hoặc /upgrade hoặc /support"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={sending || !title.trim() || !content.trim()}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md transition"
                  >
                    <Send className={`w-3.5 h-3.5 ${sending ? 'animate-spin' : ''}`} />
                    <span>{sending ? t('adminNotifications.sending', 'Đang phát thanh...') : t('adminNotifications.btnSend', 'Phát thanh ngay')}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Live Preview Card */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                {t('adminNotifications.previewTitle', 'Xem trước trên thiết bị học viên')}
              </h3>

              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-md space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    {type === 'PROMOTION' ? <Gift className="w-4 h-4" /> : 
                     type === 'SYSTEM' ? <ShieldAlert className="w-4 h-4" /> : 
                     <Info className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                        {type} • Vừa xong
                      </span>
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                      {title || 'Tiêu đề thông báo mẫu'}
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {content || 'Nội dung thông báo của bạn sẽ hiển thị chuẩn xác tại đây trên thanh thông báo của học viên.'}
                    </p>
                    {actionUrl && (
                      <span className="inline-block mt-2 text-[11px] font-semibold text-indigo-500 underline">
                        Xem chi tiết →
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/50 text-xs text-slate-500 space-y-1.5">
                <p className="font-semibold text-slate-700 dark:text-slate-300">Cơ chế phát thanh:</p>
                <p>Kênh phát: <span className="font-mono text-indigo-600 dark:text-indigo-400">{targetAudience}</span></p>
                <p>Giao thức: Socket.io Realtime + Lưu trữ Database Persistent</p>
              </div>
            </div>
          </div>

          {/* Past Announcements History */}
          <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              {t('adminNotifications.historyTitle', 'Lịch sử phát thanh thông báo')}
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loadingAnnouncements ? (
                <div className="py-8 text-center text-slate-400 text-xs">Đang tải lịch sử phát thanh...</div>
              ) : announcements.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">{t('adminNotifications.noHistory', 'Chưa có thông báo nào được phát.')}</div>
              ) : (
                announcements.map((a) => (
                  <div key={a.id} className="py-3.5 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{a.title}</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                          {a.audience || 'ALL'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {a.targetCount || 0} người nhận
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{a.content}</p>
                    </div>
                    <div className="text-right text-[11px] text-slate-400 shrink-0">
                      {a.sentAt ? new Date(a.sentAt).toLocaleString('vi-VN') : new Date(a.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SYSTEM-WIDE NOTIFICATIONS FEED */}
      {activeTab === 'feed' && (
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ListFilter className="w-4 h-4 text-indigo-500" />
                {t('adminNotifications.feedTitle', 'Nhật ký thông báo gửi tới học viên')}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Theo dõi thời gian thực các thông báo nhắc nhở, xác nhận đơn hàng, và hỗ trợ CSKH</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
              Tổng cộng: {feedTotal} bản ghi
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">{t('adminNotifications.recipient', 'Người nhận')}</th>
                  <th className="py-2.5 px-3 font-semibold">{t('adminNotifications.inputType', 'Loại')}</th>
                  <th className="py-2.5 px-3 font-semibold">{t('adminNotifications.inputTitle', 'Tiêu đề & Nội dung')}</th>
                  <th className="py-2.5 px-3 font-semibold">{t('adminNotifications.status', 'Trạng thái')}</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loadingFeed ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">Đang tải nhật ký thông báo...</td>
                  </tr>
                ) : systemNotifications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">Không có dữ liệu thông báo nào trong hệ thống.</td>
                  </tr>
                ) : (
                  systemNotifications.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px]">
                            {item.user?.displayName?.[0] || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{item.user?.displayName || 'Learner'}</div>
                            <div className="text-[10px] text-slate-400">{item.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          item.type === 'SUPPORT_REPLY' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                          item.type === 'ANNOUNCEMENT' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                          item.type === 'SYSTEM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-slate-500/10 text-slate-400'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-sm">
                        <div className="font-bold text-slate-900 dark:text-white truncate">{item.title}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{item.body}</div>
                      </td>
                      <td className="py-3 px-3">
                        {item.readAt ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                            <CheckCheck className="w-3 h-3" />
                            <span>{t('adminNotifications.read', 'Đã đọc')}</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                            <Eye className="w-3 h-3" />
                            <span>{t('adminNotifications.unread', 'Chưa đọc')}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400 text-[11px]">
                        {new Date(item.createdAt).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationsPage;
