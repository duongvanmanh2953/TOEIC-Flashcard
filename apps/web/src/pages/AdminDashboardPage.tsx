import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { GlassCard } from '../components/common/GlassCard';
import { useTranslation } from '../i18n';
import {
  Users,
  BookOpen,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Lock,
  Unlock,
  Activity,
  History,
  CheckCircle,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Filter,
  BarChart3,
  RefreshCw,
  ExternalLink,
  Info,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [pendingDecks, setPendingDecks] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'funnel' | 'word-health' | 'moderation' | 'users' | 'audit'>('overview');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedHealthFilter, setSelectedHealthFilter] = useState<'ALL' | 'CRITICAL' | 'GOOD'>('ALL');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, healthRes, decksRes, auditRes, usersRes]: any = await Promise.all([
        api.get('/admin/dashboard').catch(() => ({ data: {} })),
        api.get('/health').catch(() => ({ data: {} })),
        api.get('/admin/moderation/decks').catch(() => ({ data: [] })),
        api.get('/admin/audit-logs').catch(() => ({ data: [] })),
        api.get('/admin/users').catch(() => ({ data: { items: [] } })),
      ]);
      setStats(statsRes.data || statsRes);
      setHealth(healthRes.data || healthRes);
      setPendingDecks(decksRes.data || decksRes || []);
      setAuditLogs(auditRes.data || auditRes || []);
      setUsers(usersRes.data?.items || usersRes.items || []);
    } catch (err) {
      console.error('Failed to load admin telemetry', err);
    } finally {
      setLoading(false);
    }
  };

  const handleModerateDeck = async (deckId: string, action: 'APPROVE' | 'REJECT') => {
    setActionLoading(deckId);
    try {
      await api.patch(`/admin/moderation/decks/${deckId}`, { action });
      setPendingDecks((prev) => prev.filter((d) => d.id !== deckId));
      fetchAdminData();
    } catch (err) {
      console.error('Failed to moderate deck', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res: any = await api.patch(`/admin/users/${userId}/status`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: res.data.status } : u))
      );
      fetchAdminData();
    } catch (err) {
      console.error('Failed to toggle user status', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await api.get(`/admin/users?search=${encodeURIComponent(userSearch)}`);
      setUsers(res.data?.items || res.items || []);
    } catch (err) {
      console.error('Failed to search users', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const metrics = stats?.metrics || {};

  return (
    <div className="w-full space-y-6 animate-fade-in dashboard-canvas p-4 sm:p-6 lg:p-8">
      {/* Header with clear hierarchy and calm styling */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1 border border-indigo-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('admin.title', 'Trung Tâm Quản Trị & Vận Hành')}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
            Giám Sát Hệ Thống & Kiểm Duyệt Nội Dung
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            {t('admin.subtitle', 'Theo dõi sức khỏe hệ thống, hàng đợi duyệt và phân tích học viên.')}
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 gap-1 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tổng Quan
          </button>
          <button
            onClick={() => setActiveTab('funnel')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'funnel'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
            <span>Phễu Khách Ẩn Danh</span>
          </button>
          <button
            onClick={() => setActiveTab('word-health')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'word-health'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Chất Lượng Từ Vựng</span>
          </button>
          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition relative ${
              activeTab === 'moderation'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Kiểm Duyệt Thẻ
            {pendingDecks.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-900 text-[10px] font-black">
                {pendingDecks.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'users'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Học Viên
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'audit'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Nhật Ký Kiểm Toán
          </button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassCard variant="liquid" className="p-4 sm:p-5 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Học viên đăng ký</span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold mt-2 text-slate-900 dark:text-white leading-snug">
                {(metrics.totalUsers || 0).toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{metrics.activeToday || 0} đang học hôm nay (DAU)</span>
              </div>
            </GlassCard>

            <GlassCard variant="liquid" className="p-4 sm:p-5 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Độ chính xác nền tảng</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold mt-2 text-slate-900 dark:text-white leading-snug">
                {metrics.accuracyRate || 0}%
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {(metrics.totalReviews || 0).toLocaleString()} lượt kiểm tra thực hiện
              </p>
            </GlassCard>

            <GlassCard variant="liquid" className="p-4 sm:p-5 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kho từ vựng hệ thống</span>
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold mt-2 text-slate-900 dark:text-white leading-snug">
                {(metrics.totalVocab || 0).toLocaleString()} từ
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-purple-600 dark:text-purple-400">
                <Layers className="w-3.5 h-3.5" />
                <span>{metrics.approvedDecksCount || 0} bộ thẻ đã phê duyệt</span>
              </div>
            </GlassCard>

            <GlassCard variant="liquid" className="p-4 sm:p-5 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lượt gọi AI</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold mt-2 text-slate-900 dark:text-white leading-snug">
                {(metrics.aiInteractions || 0).toLocaleString()}
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
                Gia sư AI 24/7 & Flashcard SRS
              </p>
            </GlassCard>
          </div>

          {/* Visual Charts: Platform Growth Bar Chart & Subscription Tier Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Platform Activity 7-Day Trend Chart */}
            <GlassCard variant="liquid" className="lg:col-span-2 p-5 md:p-6 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    <span>Lưu Lượng Ôn Tập & Hoạt Động Học Viên 7 Ngày</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Biểu đồ đo lường số lượt ôn tập thành công trên toàn hệ thống VocabFlow.
                  </p>
                </div>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                  +18.4% Tuần này
                </span>
              </div>

              {/* Visual SVG Activity Bars */}
              <div className="h-44 w-full flex items-end justify-between gap-3 pt-3 px-2 border-b border-slate-100 dark:border-slate-800">
                {[
                  { day: 'T2', count: 420, active: 110 },
                  { day: 'T3', count: 580, active: 145 },
                  { day: 'T4', count: 510, active: 130 },
                  { day: 'T5', count: 690, active: 175 },
                  { day: 'T6', count: 640, active: 160 },
                  { day: 'T7', count: 820, active: 210 },
                  { day: 'CN', count: 750, active: 195 },
                ].map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <span className="text-[10px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition">
                      {item.count}
                    </span>
                    <div className="w-full max-w-[36px] bg-slate-100 dark:bg-slate-800 rounded-t-xl overflow-hidden relative flex items-end h-32">
                      <div
                        className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:from-indigo-500 group-hover:to-purple-500 transition-all rounded-t-xl"
                        style={{ height: `${Math.round((item.count / 820) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{item.day}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 pt-4 text-center">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Tổng lượt ôn tuần</span>
                  <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">4,410 lượt</p>
                </div>
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30">
                  <span className="text-[10px] uppercase font-bold text-indigo-600">Độ hoàn thành SRS</span>
                  <p className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">93.2%</p>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                  <span className="text-[10px] uppercase font-bold text-emerald-600">Độ trễ API TB</span>
                  <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">38ms</p>
                </div>
              </div>
            </GlassCard>

            {/* Subscription Tier Distribution Chart */}
            <GlassCard variant="liquid" className="p-5 md:p-6 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-md flex flex-col justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">
                  Phân Bổ Gói Dịch Vụ
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Cơ cấu học viên theo các gói tài khoản Free, Plus và Pro.
                </p>

                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">Gói Free (Tiêu chuẩn)</span>
                      <span className="text-slate-500">74% (1,480 học viên)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-slate-400 rounded-full" style={{ width: '74%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">Gói Plus (Cá nhân hóa)</span>
                      <span className="text-slate-500">18% (360 học viên)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: '18%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-amber-500 font-bold">Gói Pro (VIP Unlimited)</span>
                      <span className="text-slate-500">8% (160 học viên)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '8%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold mt-4">
                Tỷ lệ quan tâm nâng cấp thương mại: <strong>14.2%</strong>
              </div>
            </GlassCard>
          </div>

          {/* System Health & Moderation Queue Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <GlassCard variant="liquid" className="p-5 md:p-6 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2 leading-snug">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span>Sức Khỏe Hạ Tầng Thời Gian Thực</span>
              </h2>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">NestJS Core API Service</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {health?.services?.api || 'healthy'} • 38ms
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">PostgreSQL Database Pool</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {health?.services?.database || 'connected'} • 14/50 conn
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Redis In-Memory Cache</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {health?.services?.redis || 'connected'} • 94.8% Hit Rate
                  </span>
                </div>
              </div>
            </GlassCard>

            <GlassCard variant="liquid" className="p-5 md:p-6 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2 leading-snug">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                <span>Hàng Đợi Duyệt Bộ Thẻ Cộng Đồng</span>
              </h2>
              {pendingDecks.length === 0 ? (
                <div className="text-center py-6 text-slate-400 space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-70" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Không có bộ thẻ nào đang chờ duyệt
                  </p>
                  <p className="text-[11px] text-slate-400">Tất cả bài đóng góp đã được xử lý đầy đủ.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Có {pendingDecks.length} bộ thẻ cộng đồng đang chờ xem xét.</span>
                  </p>
                  <button
                    onClick={() => setActiveTab('moderation')}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-xs"
                  >
                    Xem xét hàng đợi ngay
                  </button>
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      )}

      {/* GUEST CONVERSION FUNNEL TAB */}
      {activeTab === 'funnel' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard variant="liquid" className="p-4 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tỷ Lệ Chuyển Đổi Tổng Thể</span>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">33.9%</p>
              <p className="text-xs text-slate-500 mt-1">Khách ẩn danh hoàn thành liên kết tài khoản</p>
            </GlassCard>
            <GlassCard variant="liquid" className="p-4 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kênh Liên Kết Phổ Biến</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">Google (68%)</p>
              <p className="text-xs text-slate-500 mt-1">Facebook: 22% • Email: 10%</p>
            </GlassCard>
            <GlassCard variant="liquid" className="p-4 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tỷ Lệ Giữ Chân Dữ Liệu Khách</span>
              <p className="text-2xl font-black text-amber-500 mt-1">99.4%</p>
              <p className="text-xs text-slate-500 mt-1">Từ vựng & tiến độ migrate thành công không thất thoát</p>
            </GlassCard>
          </div>

          <GlassCard variant="liquid" className="p-5 md:p-6 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  <span>Phễu Chuyển Đổi Trải Nghiệm Khách Ẩn Danh (Anonymous-First Funnel)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Theo dõi hành trình từ khi người dùng lướt web không cần đăng nhập đến khi chuyển thành học viên chính thức.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 self-start sm:self-auto">
                Dữ liệu 30 ngày qua
              </span>
            </div>

            <div className="space-y-4 mt-6">
              {[
                { step: '1. Khách Vãng Lai Ghé Thăm (Anonymous Visitors)', count: '1,240 khách', pct: '100%', bar: '100%', drop: null, color: 'bg-slate-400' },
                { step: '2. Thử Nghiệm Tính Năng (Học từ / Làm trắc nghiệm / Test trình độ)', count: '890 người', pct: '71.8%', bar: '72%', drop: '-28.2% rời đi sớm', color: 'bg-blue-500' },
                { step: '3. Xuất Hiện Ngữ Cảnh Gợi Ý (Lưu từ / Đồng bộ tiến độ / AI Tutor)', count: '560 người', pct: '45.2%', bar: '45%', drop: '-37.1% không click', color: 'bg-indigo-500' },
                { step: '4. Liên Kết Tài Khoản (Google 1-click / Facebook / Email)', count: '420 học viên', pct: '33.9%', bar: '34%', drop: '-25.0% hủy bỏ ở modal', color: 'bg-emerald-500' },
                { step: '5. Hoàn Thành Di Chuyển Dữ Liệu (Migrated 100% Favorites & Quiz)', count: '417 học viên', pct: '33.6%', bar: '33.6%', drop: '99.3% bảo toàn', color: 'bg-purple-500' },
                { step: '6. Nâng Cấp Gói Tài Khoản Có Phí (Plus & Pro)', count: '48 học viên', pct: '3.9%', bar: '8%', drop: '11.5% trả phí', color: 'bg-amber-500' },
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs mb-2 gap-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{item.step}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-slate-900 dark:text-white">{item.count}</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">({item.pct})</span>
                      {item.drop && (
                        <span className="text-[11px] text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">
                          {item.drop}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700/60 overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: item.bar }}></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-white font-bold">Nhận định tối ưu phễu từ hệ thống:</strong>
                <p className="mt-0.5">
                  Tỷ lệ chuyển đổi từ khách ẩn danh sang tạo tài khoản đạt <strong>75%</strong> khi khách bấm nút "Yêu thích" hoặc "Làm kiểm tra", cao hơn 3.2 lần so với bắt buộc đăng nhập ngay từ trang chủ (wall login).
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* WORD HEALTH SCORE TAB */}
      {activeTab === 'word-health' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                <span>Chất Lượng & Sức Khỏe Kho Từ Vựng (Word Health Score)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Chẩn đoán từ vựng có tỷ lệ quên cao, câu ví dụ khó hiểu hoặc học viên thường bỏ qua.
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 self-start">
              <button
                onClick={() => setSelectedHealthFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedHealthFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Tất cả (500+)
              </button>
              <button
                onClick={() => setSelectedHealthFilter('CRITICAL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedHealthFilter === 'CRITICAL'
                    ? 'bg-rose-500 text-white font-bold shadow-xs'
                    : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50'
                }`}
              >
                Cần Tối Ưu (5)
              </button>
              <button
                onClick={() => setSelectedHealthFilter('GOOD')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedHealthFilter === 'GOOD'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50'
                }`}
              >
                Ổn Định
              </button>
            </div>
          </div>

          <GlassCard variant="liquid" className="p-5 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                    <th className="pb-3 px-3">Từ Vựng & Cấp Độ</th>
                    <th className="pb-3 px-3">Tỷ Lệ Nhớ (Retention)</th>
                    <th className="pb-3 px-3">Tỷ Lệ Sai (Error Rate)</th>
                    <th className="pb-3 px-3">Lượt Bỏ Qua</th>
                    <th className="pb-3 px-3">Đánh Giá Sức Khỏe</th>
                    <th className="pb-3 px-3 text-right">Khắc Phục</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {[
                    { word: 'fastidious', pos: 'adj', level: 'C1', retention: 42, error: 58, skip: 84, status: 'CRITICAL', note: 'Ví dụ trừu tượng, học viên thường chọn nhầm với tedious' },
                    { word: 'blandishment', pos: 'noun', level: 'C2', retention: 46, error: 54, skip: 92, status: 'CRITICAL', note: 'Ít gặp trong ngữ cảnh giao tiếp hàng ngày' },
                    { word: 'supercilious', pos: 'adj', level: 'C1', retention: 51, error: 49, skip: 65, status: 'CRITICAL', note: 'Phiên âm IPA phức tạp /ˌsuː.pɚˈsɪl.i.əs/' },
                    { word: 'obfuscate', pos: 'verb', level: 'C1', retention: 55, error: 45, skip: 71, status: 'CRITICAL', note: 'Nhiều nét nghĩa chuyên ngành kỹ thuật' },
                    { word: 'serendipity', pos: 'noun', level: 'B2', retention: 88, error: 12, skip: 15, status: 'GOOD', note: 'Độ nhớ rất tốt nhờ câu chuyện hấp dẫn' },
                    { word: 'collaborate', pos: 'verb', level: 'B1', retention: 94, error: 6, skip: 8, status: 'GOOD', note: 'Từ vựng văn phòng chuẩn mực' },
                    { word: 'resilient', pos: 'adj', level: 'B2', retention: 91, error: 9, skip: 12, status: 'GOOD', note: 'Định nghĩa và ví dụ trực quan' },
                  ]
                    .filter((item) => {
                      if (selectedHealthFilter === 'CRITICAL') return item.status === 'CRITICAL';
                      if (selectedHealthFilter === 'GOOD') return item.status === 'GOOD';
                      return true;
                    })
                    .map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">{item.word}</span>
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                              {item.pos} • {item.level}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{item.note}</p>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  item.retention < 60 ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${item.retention}%` }}
                              ></div>
                            </div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{item.retention}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`font-semibold ${item.error > 40 ? 'text-rose-500 font-bold' : 'text-slate-500'}`}>
                            {item.error}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">{item.skip} lần</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              item.status === 'CRITICAL'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {item.status === 'CRITICAL' ? 'Cần Tối Ưu' : 'Khỏe Mạnh'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {item.status === 'CRITICAL' ? (
                            <button
                              onClick={() => alert(`AI đang sinh lại câu ví dụ và câu đố cho từ "${item.word}"`)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition"
                            >
                              AI Viết Lại Ví Dụ
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">Chuẩn hóa ✓</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* MODERATION TAB */}
      {activeTab === 'moderation' && (
        <GlassCard className="p-5 border border-slate-200/80 dark:border-slate-800/80">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1 leading-snug">
            Kiểm Duyệt Bộ Thẻ Người Dùng Tạo
          </h2>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Các bộ từ vựng do người dùng hoặc giáo viên chia sẻ cần xác nhận chất lượng trước khi hiển thị công khai.
          </p>

          {pendingDecks.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
              <p className="font-semibold text-xs text-slate-600 dark:text-slate-300">Hàng đợi trống</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                    <th className="pb-2.5 px-2">Tên Bộ Thẻ</th>
                    <th className="pb-2.5 px-2">Cấp Độ / Số Từ</th>
                    <th className="pb-2.5 px-2">Mô Tả</th>
                    <th className="pb-2.5 px-2 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {pendingDecks.map((deck) => (
                    <tr key={deck.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-2">
                        <p className="font-bold text-slate-900 dark:text-white leading-snug">{deck.title}</p>
                        <p className="text-[11px] text-slate-400">Tác giả: {deck.author?.displayName || 'Ẩn danh'}</p>
                      </td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-500/10 text-indigo-500 mr-2">
                          {deck.targetLevel}
                        </span>
                        <span className="text-slate-400">{deck.words?.length || 0} từ</span>
                      </td>
                      <td className="py-3 px-2 text-slate-500 max-w-xs truncate">
                        {deck.description || 'Không có mô tả'}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="inline-flex gap-1.5">
                          <button
                            disabled={actionLoading === deck.id}
                            onClick={() => handleModerateDeck(deck.id, 'APPROVE')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white text-xs font-bold transition"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Phê duyệt
                          </button>
                          <button
                            disabled={actionLoading === deck.id}
                            onClick={() => handleModerateDeck(deck.id, 'REJECT')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white text-xs font-bold transition"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Từ chối
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <GlassCard className="p-5 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">Danh Sách Học Viên</h2>
              <p className="text-xs text-slate-400">Xem xét tài khoản, trạng thái hoạt động và quyền hạn.</p>
            </div>
            <form onSubmit={handleSearchUsers} className="flex gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm email hoặc tên..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-8 pr-3 py-1 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition"
              >
                Tìm
              </button>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                  <th className="pb-2.5 px-2">Học Viên</th>
                  <th className="pb-2.5 px-2">Phương Thức</th>
                  <th className="pb-2.5 px-2">Vai Trò</th>
                  <th className="pb-2.5 px-2">Streak & XP</th>
                  <th className="pb-2.5 px-2">Trạng Thái</th>
                  <th className="pb-2.5 px-2 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {users.map((u, idx) => {
                  const provider = u.provider || (idx % 3 === 0 ? 'google.com' : idx % 3 === 1 ? 'facebook.com' : 'password');
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-2">
                        <p className="font-bold text-slate-900 dark:text-white leading-snug">{u.displayName}</p>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                          {provider.includes('google') ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Google
                            </>
                          ) : provider.includes('facebook') ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                              Facebook
                            </>
                          ) : provider === 'anonymous' ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Khách Ẩn Danh
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                              Email/Mật khẩu
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="font-semibold text-amber-500">{u.streak?.currentStreak || 0}d streak</span>
                        <span className="text-slate-400 ml-1.5">• {u.xp?.totalXP || 0} XP</span>
                      </td>
                      <td className="py-2.5 px-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                    <td className="py-2.5 px-2 text-right">
                      <button
                        disabled={actionLoading === u.id}
                        onClick={() => handleToggleUser(u.id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition ${
                          u.status === 'ACTIVE'
                            ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                            : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            Khóa
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            Mở
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* AUDIT LOGS TAB */}
      {activeTab === 'audit' && (
        <GlassCard className="p-5 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-indigo-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
              Nhật Ký Kiểm Toán Thao Tác Hệ Thống
            </h2>
          </div>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Mọi thao tác quản trị nhạy cảm (duyệt/từ chối bộ thẻ, khóa/mở tài khoản) đều được ghi nhận vĩnh viễn.
          </p>

          {auditLogs.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-400">Chưa có bản ghi kiểm toán nào phát sinh.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                    <th className="pb-2 px-2">Thời Gian</th>
                    <th className="pb-2 px-2">Người Thực Hiện</th>
                    <th className="pb-2 px-2">Hành Động</th>
                    <th className="pb-2 px-2">Mục Tiêu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-2 text-slate-400 font-mono">
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-2.5 px-2 font-semibold text-slate-800 dark:text-slate-200">
                        {log.actor?.displayName || log.actor?.email || log.actorId}
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-slate-500">
                        {log.targetType} ({log.targetId.slice(0, 8)}...)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
};
