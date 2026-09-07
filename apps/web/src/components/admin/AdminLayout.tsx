import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CommandPaletteModal } from './CommandPaletteModal';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  Headphones,
  MessageSquarePlus,
  Bell,
  Cpu,
  CreditCard,
  Activity,
  ShieldCheck,
  Settings,
  Search,
  ExternalLink,
  Moon,
  Sun,
  Menu,
  X,
  ChevronDown,
  RefreshCw,
  Radio,
  Clock,
  Sparkles,
  Command,
  TrendingUp,
  DollarSign,
  Layers,
} from 'lucide-react';
import api from '../../lib/api';
import { getSocket } from '../../lib/socket';

export const AdminLayout: React.FC = () => {
  const { user, theme, toggleTheme, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [dateRange, setDateRange] = useState('30d');
  const [badgeCounts, setBadgeCounts] = useState({
    conversations: 0,
    feedback: 0,
    bugReports: 0,
    payments: 0,
    notifications: 0,
  });
  const [liveToast, setLiveToast] = useState<{
    id: string;
    title: string;
    message: string;
    priority: string;
    targetType?: string;
    targetId?: string;
  } | null>(null);

  const fetchBadgeCounts = async () => {
    try {
      const res: any = await api.get('/admin/badge-counts');
      const data = res.data?.data || res.data || res;
      if (data) {
        setBadgeCounts(data);
      }
    } catch {
      // silent
    }
  };

  // Real-time admin operations sync
  useEffect(() => {
    fetchBadgeCounts();

    const socket = getSocket();
    socket.emit('join_admin_support');

    const onBadgeUpdate = () => {
      fetchBadgeCounts();
    };

    const onAdminEvent = (event: any) => {
      fetchBadgeCounts();
      const toastId = String(Date.now());
      setLiveToast({
        id: toastId,
        title: event.title || 'Thông báo quản trị mới',
        message: event.message || '',
        priority: event.priority || 'INFO',
        targetType: event.targetType,
        targetId: event.targetId,
      });

      if (event.priority !== 'CRITICAL' && event.priority !== 'HIGH') {
        setTimeout(() => {
          setLiveToast((prev) => (prev?.id === toastId ? null : prev));
        }, 7000);
      }
    };

    socket.on('admin_badge_update', onBadgeUpdate);
    socket.on('admin_event:new', onAdminEvent);

    return () => {
      socket.off('admin_badge_update', onBadgeUpdate);
      socket.off('admin_event:new', onAdminEvent);
    };
  }, []);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, badge: 'Live' },
      ],
    },
    {
      title: 'ANALYTICS',
      items: [
        { to: '/admin/users', label: 'Users', icon: Users },
        { to: '/admin/learning', label: 'Learning', icon: GraduationCap },
        { to: '/admin/ai', label: 'AI Analytics', icon: Cpu },
      ],
    },
    {
      title: 'CONTENT',
      items: [
        { to: '/admin/vocabulary', label: 'Vocabulary', icon: BookOpen },
        { to: '/admin/shared-vocabulary', label: 'Shared Vault', icon: Layers },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        {
          to: '/admin/conversations',
          aliasTo: '/admin/support',
          label: 'Conversations',
          icon: Headphones,
          count: badgeCounts.conversations,
          badgeColor: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
        },
        {
          to: '/admin/feedback',
          label: 'Feedback',
          icon: MessageSquarePlus,
          count: badgeCounts.feedback,
          badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
        },
        {
          to: '/admin/notifications',
          label: 'Notifications',
          icon: Bell,
          count: badgeCounts.notifications,
          badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
        },
      ],
    },
    {
      title: 'BUSINESS',
      items: [
        {
          to: '/admin/finance',
          label: 'Finance & Revenue',
          icon: TrendingUp,
          count: badgeCounts.payments > 0 ? badgeCounts.payments : undefined,
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        },
        { to: '/admin/billing', label: 'Billing & Orders', icon: CreditCard },
        { to: '/admin/pricing', label: 'Smart Pricing', icon: DollarSign },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { to: '/admin/system', label: 'System Health', icon: Activity },
        { to: '/admin/security', label: 'Security & Roles', icon: ShieldCheck },
        { to: '/admin/settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const isLockedHeightRoute =
    location.pathname.startsWith('/admin/support') ||
    location.pathname.startsWith('/admin/conversations');

  return (
    <div
      className={`min-h-screen flex bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white ${
        isLockedHeightRoute ? 'h-screen max-h-screen overflow-hidden' : ''
      }`}
    >
      <CommandPaletteModal isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* =======================================================================
          1. DEDICATED ADMIN SIDEBAR
          ======================================================================= */}
      <aside
        className={`fixed lg:sticky top-0 h-screen z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand & Command Center Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md">
              VF
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white">VocabFlow</span>
                <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase border border-indigo-500/30">
                  ADMIN
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Command Center v7.0</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Action Shortcut Banner */}
        <div className="p-3 mx-3 my-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Command className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] font-bold text-indigo-300">Command Palette</span>
          </div>
          <kbd
            onClick={() => setPaletteOpen(true)}
            className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700 cursor-pointer hover:bg-slate-700"
          >
            Ctrl+K
          </kbd>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto no-scrollbar text-xs font-semibold">
          {navSections.map((sec) => (
            <div key={sec.title} className="space-y-1">
              <div className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                {sec.title}
              </div>
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.to ||
                  ((item as any).aliasTo && location.pathname === (item as any).aliasTo) ||
                  (item.to === '/admin' && (location.pathname === '/admin' || location.pathname === '/admin/dashboard'));

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl transition ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.count !== undefined && item.count > 0 ? (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase shrink-0 ${
                          item.badgeColor || 'bg-indigo-500 text-white'
                        }`}
                      >
                        {item.count}
                      </span>
                    ) : item.badge ? (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Actions: User App Switch & Admin Info */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-between shadow-xs border border-slate-700/60"
            title="Quay lại giao diện học tập của học viên"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sang Học Viên (User App)</span>
            </div>
            <span className="text-[10px] text-slate-400">&rarr;</span>
          </button>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {user?.displayName?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {user?.displayName || 'Admin'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{user?.role || 'ADMIN'}</p>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Đổi giao diện"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </aside>

      {/* =======================================================================
          2. MAIN CONTENT AREA & DEDICATED ADMIN TOPBAR
          ======================================================================= */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${
          isLockedHeightRoute
            ? 'h-screen max-h-screen overflow-hidden'
            : 'overflow-x-hidden'
        }`}
      >
        {/* Real-time Operational Toast Banner */}
        {liveToast && (
          <div className="fixed top-14 right-4 z-50 max-w-sm w-full animate-in slide-in-from-top-3 duration-200">
            <div
              className={`p-3 rounded-2xl border backdrop-blur-2xl shadow-2xl flex items-start gap-3 ${
                liveToast.priority === 'CRITICAL'
                  ? 'bg-rose-950/90 border-rose-500/80 text-white'
                  : liveToast.priority === 'HIGH'
                  ? 'bg-amber-950/90 border-amber-500/80 text-white'
                  : 'bg-slate-900/95 border-slate-700/80 text-white'
              }`}
            >
              <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-emerald-400 animate-ping" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-xs font-bold truncate">{liveToast.title}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                      liveToast.priority === 'CRITICAL'
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {liveToast.priority}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                  {liveToast.message}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => {
                      if (liveToast.targetType === 'FEEDBACK') navigate('/admin/feedback');
                      else if (liveToast.targetType === 'CONVERSATION') navigate('/admin/conversations');
                      else if (liveToast.targetType === 'PAYMENT') navigate('/admin/finance');
                      else navigate('/admin/notifications');
                      setLiveToast(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition shadow-xs"
                  >
                    Xem ngay
                  </button>
                  <button
                    onClick={() => setLiveToast(null)}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dedicated Admin Topbar */}
        <header className="sticky top-0 z-30 h-12 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Quick Search Shortcut */}
            <div
              onClick={() => setPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-slate-200 text-[11px] cursor-pointer transition w-56 shadow-xs"
            >
              <Search className="w-3 h-3" />
              <span className="flex-1">Tìm kiếm nhanh...</span>
              <kbd className="px-1.5 py-0.2 rounded bg-slate-900 text-[9px] font-mono border border-slate-700">
                Ctrl+K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Live Status Indicator (click opens /admin/system) */}
            <div
              onClick={() => navigate('/admin/system')}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold cursor-pointer transition shadow-xs"
              title="Xem Báo cáo sức khỏe hệ thống (System Health)"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All systems operational</span>
            </div>

            {/* Support Shortcut with unread badge */}
            <button
              onClick={() => navigate('/admin/conversations')}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 relative transition"
              title="Hội thoại CSKH"
            >
              <Headphones className="w-4 h-4" />
              {badgeCounts.conversations > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-slate-900" />
              )}
            </button>

            {/* Notification Bell with live count */}
            <button
              onClick={() => navigate('/admin/notifications')}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 relative transition"
              title="Thông báo quản trị"
            >
              <Bell className="w-4 h-4" />
              {badgeCounts.notifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900" />
              )}
            </button>
          </div>
        </header>

        {/* Outlet for Sub-Pages */}
        <main
          className={`flex-1 min-w-0 ${
            isLockedHeightRoute
              ? 'p-1 sm:p-1.5 overflow-hidden flex flex-col h-[calc(100vh-48px)] max-h-[calc(100vh-48px)] min-h-0'
              : 'p-3 sm:p-4 lg:p-5 space-y-4'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};
