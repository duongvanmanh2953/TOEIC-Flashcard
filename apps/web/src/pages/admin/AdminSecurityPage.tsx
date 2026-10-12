import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, Key, AlertTriangle, UserCheck, 
  FileText, ShieldAlert, CheckCircle2, RefreshCw, Smartphone,
  Monitor, Ban, Check, Eye, X, Filter, Search, Loader2,
  AlertOctagon, KeyRound, Radio, Terminal, Copy
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface RiskEventItem {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: string;
    riskStatus: string;
  };
  deviceId: string;
  device?: {
    deviceName: string;
    deviceType: string;
    browser?: string;
    os?: string;
    status: string;
  };
  eventType: string;
  status: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  riskScore: number;
  metadata?: any;
  createdAt: string;
}

export const AdminSecurityPage: React.FC = () => {
  const { user } = useAuth();

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'risk' | 'admin_device' | 'credentials' | 'rbac' | 'audit'>('risk');

  // Risky Accounts State
  const [riskEvents, setRiskEvents] = useState<RiskEventItem[]>([]);
  const [loadingRisks, setLoadingRisks] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<RiskEventItem | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Terminal CLI Copy State
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Admin Password Change State
  const [adminCurrentPass, setAdminCurrentPass] = useState('');
  const [adminNewPass, setAdminNewPass] = useState('');
  const [adminConfirmPass, setAdminConfirmPass] = useState('');
  const [adminPassLoading, setAdminPassLoading] = useState(false);
  const [adminPassError, setAdminPassError] = useState<string | null>(null);
  const [adminPassSuccess, setAdminPassSuccess] = useState<string | null>(null);

  // Admin Keypass State
  const [currentKeypass, setCurrentKeypass] = useState('');
  const [newKeypass, setNewKeypass] = useState('');
  const [confirmKeypass, setConfirmKeypass] = useState('');
  const [updatingKeypass, setUpdatingKeypass] = useState(false);
  const [keypassFormError, setKeypassFormError] = useState<string | null>(null);
  const [keypassFormSuccess, setKeypassFormSuccess] = useState<string | null>(null);

  const handleUpdateAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPassError(null);
    setAdminPassSuccess(null);

    if (!adminCurrentPass) {
      setAdminPassError('Vui lòng nhập mật khẩu Quản trị viên hiện tại.');
      return;
    }
    if (adminNewPass.length < 8) {
      setAdminPassError('Mật khẩu mới phải có tối thiểu 8 ký tự.');
      return;
    }
    if (adminNewPass !== adminConfirmPass) {
      setAdminPassError('Xác nhận mật khẩu mới không trùng khớp.');
      return;
    }

    setAdminPassLoading(true);
    try {
      await api.post('/admin/security/change-password', {
        currentPassword: adminCurrentPass,
        newPassword: adminNewPass,
      });

      // 1. Immediately wipe all local tokens & sessions
      localStorage.removeItem('vocabflow_access_token');
      localStorage.removeItem('vocabflow_refresh_token');
      sessionStorage.clear();

      setAdminPassSuccess(
        'Đổi mật khẩu Quản trị viên thành công! Toàn bộ phiên làm việc trên các thiết bị đã bị thu hồi. Đang đăng xuất...',
      );

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('VOCABFLOW_TOAST', {
            detail: {
              type: 'success',
              title: 'Đổi mật khẩu Quản trị viên thành công',
              message:
                'Mật khẩu Admin đã được cập nhật. Vì lý do an ninh, hệ thống tiến hành đăng xuất toàn bộ thiết bị ngay lập tức.',
            },
          }),
        );
      }

      setTimeout(() => {
        window.location.href = '/login';
      }, 900);
    } catch (err: any) {
      setAdminPassError(
        err?.response?.data?.message || err?.message || 'Không thể đổi mật khẩu Quản trị viên. Vui lòng kiểm tra lại.',
      );
    } finally {
      setAdminPassLoading(false);
    }
  };

  // Fetch risky events
  const fetchRiskEvents = async () => {
    setLoadingRisks(true);
    setActionErrorMsg(null);
    try {
      const res: any = await api.get('/admin/security/risky-accounts', {
        params: {
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          search: searchQuery.trim() || undefined,
        },
      });
      const data = res?.data || res;
      setRiskEvents(data?.items || (Array.isArray(data) ? data : []));
    } catch (err: any) {
      console.warn('Failed to fetch risky accounts:', err);
      setActionErrorMsg(err?.response?.data?.message || 'Không thể tải danh sách tài khoản rủi ro.');
    } finally {
      setLoadingRisks(false);
    }
  };

  useEffect(() => {
    fetchRiskEvents();
  }, [statusFilter]);

  const handleApproveEvent = async (eventId: string) => {
    setActionLoading(eventId);
    setActionErrorMsg(null);
    try {
      await api.post(`/admin/security/risky-accounts/${eventId}/approve`, {
        note: 'Approved by admin from security console',
      });
      setActionSuccessMsg('Đã phê duyệt và kích hoạt thiết bị thành công.');
      setTimeout(() => setActionSuccessMsg(null), 3500);
      setRiskEvents((prev) => prev.map((ev) => (ev.id === eventId ? { ...ev, status: 'RESOLVED' } : ev)));
      if (selectedEvent?.id === eventId) setSelectedEvent(null);
    } catch (err: any) {
      setActionErrorMsg(err?.response?.data?.message || 'Thao tác phê duyệt thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlockDevice = async (eventId: string) => {
    setActionLoading(eventId);
    setActionErrorMsg(null);
    try {
      await api.post(`/admin/security/risky-accounts/${eventId}/block`, {
        note: 'Blocked by admin due to security policy violation',
      });
      setActionSuccessMsg('Đã chặn thiết bị và hủy các phiên liên quan.');
      setTimeout(() => setActionSuccessMsg(null), 3500);
      setRiskEvents((prev) => prev.map((ev) => (ev.id === eventId ? { ...ev, status: 'BLOCKED' } : ev)));
      if (selectedEvent?.id === eventId) setSelectedEvent(null);
    } catch (err: any) {
      setActionErrorMsg(err?.response?.data?.message || 'Thao tác chặn thiết bị thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExemptEvent = async (eventId: string) => {
    setActionLoading(eventId);
    setActionErrorMsg(null);
    try {
      await api.post(`/admin/security/risky-accounts/${eventId}/exempt`, {
        note: 'Marked as exempted by admin',
      });
      setActionSuccessMsg('Đã bỏ qua sự kiện rủi ro.');
      setTimeout(() => setActionSuccessMsg(null), 3500);
      setRiskEvents((prev) => prev.map((ev) => (ev.id === eventId ? { ...ev, status: 'EXEMPTED' } : ev)));
      if (selectedEvent?.id === eventId) setSelectedEvent(null);
    } catch (err: any) {
      setActionErrorMsg(err?.response?.data?.message || 'Thao tác thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlockAccount = async (userId: string, eventId: string) => {
    if (!window.confirm('CẢNH BÁO: Thao tác này sẽ khóa toàn bộ tài khoản người dùng và thu hồi 100% phiên đăng nhập. Bạn có chắc chắn không?')) {
      return;
    }
    setActionLoading(eventId);
    setActionErrorMsg(null);
    try {
      await api.post(`/admin/security/risky-accounts/${userId}/block-account`, {
        reason: 'Account frozen due to suspicious multiple device activity',
      });
      setActionSuccessMsg('Đã khóa tài khoản người dùng và thu hồi tất cả phiên làm việc.');
      setTimeout(() => setActionSuccessMsg(null), 3500);
      setRiskEvents((prev) => prev.map((ev) => (ev.id === eventId ? { ...ev, status: 'BLOCKED' } : ev)));
      if (selectedEvent?.id === eventId) setSelectedEvent(null);
    } catch (err: any) {
      setActionErrorMsg(err?.response?.data?.message || 'Không thể khóa tài khoản.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyTerminalCmd = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2500);
  };

  // Handle Admin Keypass Update
  const handleUpdateKeypass = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeypassFormError(null);
    setKeypassFormSuccess(null);

    if (newKeypass !== confirmKeypass) {
      setKeypassFormError('Mã Keypass mới xác nhận không khớp.');
      return;
    }
    if (newKeypass.length < 8) {
      setKeypassFormError('Keypass bảo mật hệ thống yêu cầu độ dài tối thiểu 8 ký tự.');
      return;
    }
    setUpdatingKeypass(true);
    try {
      await api.post('/admin/security/keypass', {
        currentKeypass: currentKeypass || undefined,
        newKeypass,
      });
      const msg = 'Cập nhật mã bảo mật tối cao (Admin Security Keypass) thành công! Keypass này được lưu băm bcrypt độc lập và KHÔNG bị thay đổi khi đổi mật khẩu.';
      setKeypassFormSuccess(msg);
      setActionSuccessMsg(msg);
      setCurrentKeypass('');
      setNewKeypass('');
      setConfirmKeypass('');
      setTimeout(() => {
        setKeypassFormSuccess(null);
        setActionSuccessMsg(null);
      }, 5000);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Cập nhật Keypass thất bại. Vui lòng kiểm tra lại Keypass hiện tại.';
      setKeypassFormError(errMsg);
      setActionErrorMsg(errMsg);
    } finally {
      setUpdatingKeypass(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-indigo-500" />
            Bảo Mật Hệ Thống & Quản Lý Rủi Ro Thiết Bị
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Chính sách giới hạn thiết bị (Learner: 3, Admin: 1), phát hiện thiết bị bất thường và Keypass tối cao.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('risk')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'risk'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Tài khoản rủi ro ({riskEvents.filter(e => e.status === 'PENDING').length})</span>
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'credentials'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Mật khẩu & Keypass</span>
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'rbac'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Ma trận RBAC</span>
          </button>
        </div>
      </div>

      {/* Global Toast Messages */}
      {actionSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}
      {actionErrorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{actionErrorMsg}</span>
        </div>
      )}

      {/* TAB 1: RISKY ACCOUNTS & DEVICE DETECTIONS */}
      {activeTab === 'risk' && (
        <div className="space-y-4">
          {/* Policy Banner */}
          <div className="p-4 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-white text-sm">Chính sách giới hạn thiết bị kích hoạt</h4>
                  <span className="px-2 py-0.2 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400">
                    Bật tự động
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  • <strong>Học viên (STUDENT/PRO):</strong> Tối đa 3 thiết bị active. Thiết bị thứ 4 bị chặn đăng nhập tự động, đưa vào hàng đợi chờ duyệt (PENDING_REVIEW) và gửi email cảnh báo người dùng.<br />
                  • <strong>Quản trị viên (ADMIN):</strong> Nghiêm ngặt chỉ 1 thiết bị active. Mọi lần đăng nhập mới từ máy khác sẽ bị giữ lại xác minh.
                </p>
              </div>
            </div>
            <button
              onClick={fetchRiskEvents}
              disabled={loadingRisks}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 self-start md:self-center"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingRisks ? 'animate-spin' : ''}`} />
              <span>Làm mới ({riskEvents.length})</span>
            </button>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
              {(['ALL', 'PENDING', 'APPROVED', 'BLOCKED', 'EXEMPTED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {st === 'ALL' && 'Tất cả'}
                  {st === 'PENDING' && 'Chờ duyệt'}
                  {st === 'APPROVED' && 'Đã duyệt'}
                  {st === 'BLOCKED' && 'Bị khóa'}
                  {st === 'EXEMPTED' && 'Miễn trừ'}
                </button>
              ))}
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchRiskEvents()}
                placeholder="Tìm email, thiết bị, IP..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Risk Events Table */}
          <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Tài khoản học viên</th>
                    <th className="py-3 px-4">Thông tin thiết bị & IP</th>
                    <th className="py-3 px-4">Loại cảnh báo</th>
                    <th className="py-3 px-4 text-center">Mức rủi ro</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Hành động quản trị</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {loadingRisks ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                        Đang truy vấn nhật ký rủi ro thiết bị...
                      </td>
                    </tr>
                  ) : riskEvents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
                        Hệ thống an toàn. Không phát hiện sự kiện thiết bị rủi ro nào.
                      </td>
                    </tr>
                  ) : (
                    riskEvents.map((evt) => (
                      <tr key={evt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {evt.user?.displayName || 'Người dùng'}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {evt.user?.email}
                          </div>
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {evt.user?.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Monitor className="w-3.5 h-3.5 text-slate-400" />
                            <span>{evt.device?.deviceName || 'Thiết bị mới'}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            IP: {evt.ipAddress || '127.0.0.1'} • {evt.device?.browser || 'Browser'} ({evt.device?.os || 'OS'})
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(evt.createdAt).toLocaleString('vi-VN')}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            evt.eventType === 'DEVICE_LIMIT_EXCEEDED'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          }`}>
                            {evt.eventType === 'DEVICE_LIMIT_EXCEEDED' ? 'Vượt quá số thiết bị' : evt.eventType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-mono font-bold text-xs ${
                            evt.riskScore >= 80 ? 'text-rose-500' : evt.riskScore >= 50 ? 'text-amber-500' : 'text-slate-400'
                          }`}>
                            {evt.riskScore}/100
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            evt.status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse'
                              : evt.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : evt.status === 'BLOCKED'
                              ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}>
                            {evt.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedEvent(evt)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                              title="Chi tiết kỹ thuật"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {evt.status === 'PENDING' && (
                              <>
                                <button
                                  disabled={actionLoading === evt.id}
                                  onClick={() => handleApproveEvent(evt.id)}
                                  className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition flex items-center gap-1 shadow-xs"
                                  title="Cấp quyền đăng nhập cho thiết bị này"
                                >
                                  {actionLoading === evt.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Check className="w-2.5 h-2.5" />}
                                  <span>Duyệt</span>
                                </button>
                                <button
                                  disabled={actionLoading === evt.id}
                                  onClick={() => handleBlockDevice(evt.id)}
                                  className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] transition flex items-center gap-1 shadow-xs"
                                  title="Chặn thiết bị này vĩnh viễn"
                                >
                                  <Ban className="w-2.5 h-2.5" />
                                  <span>Chặn máy</span>
                                </button>
                              </>
                            )}

                            <button
                              disabled={actionLoading === evt.id}
                              onClick={() => handleBlockAccount(evt.userId, evt.id)}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-700 text-rose-300 font-bold text-[10px] transition border border-rose-500/20"
                              title="Khóa toàn bộ tài khoản học viên"
                            >
                              Khóa TK
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CREDENTIALS & KEYPASS MANAGEMENT */}
      {activeTab === 'credentials' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Password Management */}
          <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Cập Nhật Mật Khẩu Quản Trị Viên (Admin)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Đổi mật khẩu sẽ ngay lập tức hủy mọi token và đăng xuất tất cả thiết bị
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed space-y-2">
              <div className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-300">
                <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-500" />
                <span>Chính Sách Bảo Mật Cấp Cao (Zero-Trust Session Invalidation)</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Khi mật khẩu Admin được đổi mới, hệ thống tự động thu hồi toàn bộ token đăng nhập trên tất cả các trình duyệt và thiết bị. Bạn sẽ được chuyển hướng về trang Đăng nhập ngay lập tức.
              </p>
            </div>

            {adminPassError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{adminPassError}</span>
              </div>
            )}
            {adminPassSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{adminPassSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdateAdminPassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mật khẩu Admin hiện tại
                </label>
                <input
                  type="password"
                  disabled={adminPassLoading}
                  value={adminCurrentPass}
                  onChange={(e) => {
                    setAdminCurrentPass(e.target.value);
                    if (adminPassError) setAdminPassError(null);
                  }}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 font-mono disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mật khẩu Admin mới (tối thiểu 8 ký tự)
                </label>
                <input
                  type="password"
                  disabled={adminPassLoading}
                  value={adminNewPass}
                  onChange={(e) => {
                    setAdminNewPass(e.target.value);
                    if (adminPassError) setAdminPassError(null);
                  }}
                  placeholder="••••••••••••"
                  required
                  minLength={8}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 font-mono disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  disabled={adminPassLoading}
                  value={adminConfirmPass}
                  onChange={(e) => {
                    setAdminConfirmPass(e.target.value);
                    if (adminPassError) setAdminPassError(null);
                  }}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 font-mono disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={adminPassLoading || !adminCurrentPass || !adminNewPass || !adminConfirmPass}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-900/30"
              >
                {adminPassLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang cập nhật & thu hồi phiên...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Cập Nhật Mật Khẩu & Đăng Xuất Toàn Bộ</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Hoặc đổi qua Terminal CLI máy chủ:
              </label>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 flex items-center justify-between gap-3">
                <span className="truncate">npm run update-admin-pass</span>
                <button
                  type="button"
                  onClick={() => handleCopyTerminalCmd('npm run update-admin-pass')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 shrink-0 text-[11px] font-sans font-semibold cursor-pointer"
                >
                  {copiedCmd ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Đã sao chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Chạy script <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-900 font-mono text-indigo-500">npx ts-node updateAdminPass.ts</code> từ thư mục root của dự án.
              </p>
            </div>
          </div>

          {/* Admin Security Keypass Management */}
          <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Mã Keypass Bảo Mật Tối Cao (System Keypass)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Lưu trữ băm bcrypt trong bảng AdminSecurity, ủy quyền xóa dữ liệu toàn sàn.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-700 dark:text-rose-400 leading-relaxed space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Quyền hạn tối thượng:</span>
              </div>
              <p>Keypass là lớp bảo vệ thứ 2 bắt buộc để kích hoạt chức năng <strong>Reset All Data</strong> (Xóa sạch toàn bộ data học viên, tiến độ và giữ Admin/Kho từ vựng). Không thể thực hiện nếu thiếu Keypass này.</p>
              <div className="flex items-center gap-1.5 text-[10px] text-rose-300 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                <span>Nhập mã Keypass hiện tại đã được cấu hình cho tài khoản Quản trị viên để tiến hành cập nhật mã mới.</span>
              </div>
            </div>

            {keypassFormError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{keypassFormError}</span>
              </div>
            )}
            {keypassFormSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{keypassFormSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdateKeypass} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Keypass hiện tại
                </label>
                <input
                  type="password"
                  disabled={updatingKeypass}
                  value={currentKeypass}
                  onChange={(e) => {
                    setCurrentKeypass(e.target.value);
                    if (keypassFormError) setKeypassFormError(null);
                  }}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-rose-500 font-mono disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Keypass mới (tối thiểu 8 ký tự an toàn)
                </label>
                <input
                  type="password"
                  disabled={updatingKeypass}
                  value={newKeypass}
                  onChange={(e) => {
                    setNewKeypass(e.target.value);
                    if (keypassFormError) setKeypassFormError(null);
                  }}
                  placeholder="••••••••••••"
                  required
                  minLength={8}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-rose-500 font-mono disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Xác nhận Keypass mới
                </label>
                <input
                  type="password"
                  disabled={updatingKeypass}
                  value={confirmKeypass}
                  onChange={(e) => {
                    setConfirmKeypass(e.target.value);
                    if (keypassFormError) setKeypassFormError(null);
                  }}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-rose-500 font-mono disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={updatingKeypass || !newKeypass || !confirmKeypass}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm shadow-rose-900/30"
              >
                {updatingKeypass ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang cập nhật Keypass...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Lưu mã Keypass bảo mật độc lập</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: RBAC MATRIX */}
      {activeTab === 'rbac' && (
        <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-500" />
              Phân Quyền Vai Trò & Giới Hạn Thiết Bị (RBAC Matrix)
            </h3>
            <span className="text-xs text-slate-400">Strict server-side JWT & Device Policy</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-slate-500">
                  <th className="py-3 px-4">Quy tắc & Quyền hạn</th>
                  <th className="py-3 px-4 text-center">STUDENT (FREE)</th>
                  <th className="py-3 px-4 text-center">PRO SUBSCRIBER</th>
                  <th className="py-3 px-4 text-center">ADMIN</th>
                  <th className="py-3 px-4 text-center">SUPER_ADMIN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {[
                  { name: 'Giới hạn thiết bị tối đa', free: '3 máy', pro: '3 máy', admin: '1 máy duy nhất', super: '1 máy duy nhất' },
                  { name: 'Logout thiết bị khác yêu cầu OTP Email', free: true, pro: true, admin: true, super: true },
                  { name: 'Đổi mật khẩu logout toàn bộ thiết bị', free: true, pro: true, admin: true, super: true },
                  { name: 'Truy cập Admin Command Center (/admin)', free: false, pro: false, admin: true, super: true },
                  { name: 'Phê duyệt / Chặn thiết bị rủi ro', free: false, pro: false, admin: true, super: true },
                  { name: 'Cập nhật Keypass bảo mật tối cao', free: false, pro: false, admin: true, super: true },
                  { name: 'Quyền Reset All Data (Cần Keypass + Password + RESET)', free: false, pro: false, admin: true, super: true },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {row.name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.free === 'boolean' ? (
                        row.free ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <span className="text-slate-400">—</span>
                      ) : (
                        <span className="font-bold text-slate-700 dark:text-slate-300">{row.free}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.pro === 'boolean' ? (
                        row.pro ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <span className="text-slate-400">—</span>
                      ) : (
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{row.pro}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.admin === 'boolean' ? (
                        row.admin ? <CheckCircle2 className="w-4 h-4 text-indigo-500 mx-auto" /> : <span className="text-slate-400">—</span>
                      ) : (
                        <span className="font-bold text-amber-600 dark:text-amber-400">{row.admin}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.super === 'boolean' ? (
                        row.super ? <CheckCircle2 className="w-4 h-4 text-purple-600 mx-auto" /> : <span className="text-slate-400">—</span>
                      ) : (
                        <span className="font-bold text-purple-600 dark:text-purple-400">{row.super}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EVENT DETAILS MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-scale-in text-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-400" />
                <h4 className="font-bold text-white text-sm">Chi tiết cảnh báo thiết bị rủi ro</h4>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px]">
              <div><strong>Event ID:</strong> {selectedEvent.id}</div>
              <div><strong>Học viên:</strong> {selectedEvent.user?.displayName} ({selectedEvent.user?.email})</div>
              <div><strong>Loại sự kiện:</strong> {selectedEvent.eventType}</div>
              <div><strong>Điểm rủi ro:</strong> {selectedEvent.riskScore}/100</div>
              <div><strong>Địa chỉ IP:</strong> {selectedEvent.ipAddress || '127.0.0.1'}</div>
              <div><strong>Thiết bị:</strong> {selectedEvent.device?.deviceName || 'N/A'} ({selectedEvent.device?.deviceType})</div>
              <div><strong>User Agent:</strong> {selectedEvent.userAgent || 'Unknown'}</div>
              <div><strong>Thời điểm:</strong> {new Date(selectedEvent.createdAt).toISOString()}</div>
              {selectedEvent.metadata && (
                <div>
                  <strong>Metadata:</strong>
                  <pre className="mt-1 p-2 bg-slate-900 rounded overflow-x-auto text-[10px] text-indigo-300">
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
              >
                Đóng
              </button>
              {selectedEvent.status === 'PENDING' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleBlockDevice(selectedEvent.id)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                  >
                    Chặn thiết bị
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveEvent(selectedEvent.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    Phê duyệt thiết bị
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSecurityPage;
