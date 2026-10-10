import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CommandPaletteModal } from './CommandPaletteModal';
import { VocabFlowLogo } from '@vocabflow/shared';
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
  Flame,
  Settings,
  Search,
  ExternalLink,
  Moon,
  Sun,
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Radio,
  Clock,
  Sparkles,
  Command,
  TrendingUp,
  DollarSign,
  Layers,
  FileText,
  Package,
  Gamepad2,
  BarChart3,
  Globe,
  Library,
  Database,
} from 'lucide-react';
import api from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { navigateToApp } from '../../lib/sso';

export const AdminLayout: React.FC = () => {
  const { user, theme, toggleTheme, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('vocabflow_admin_sidebar_collapsed') === 'true';
  });

  // Auto-close mobile sidebar whenever route changes (Requirement 3)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Prevent background content from scrolling when mobile sidebar drawer is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);


  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('vocabflow_admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [dateRange, setDateRange] = useState('30d');
  const [badgeCounts, setBadgeCounts] = useState({
    conversations: 0,
    feedback: 0,
    bugReports: 0,
    payments: 0,
    notifications: 0,
    pendingPosts: 0,
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
      const [res, pendingRes]: any = await Promise.allSettled([
        api.get('/admin/badge-counts'),
        api.get('/community/admin/pending-count'),
      ]);
      const data = res.status === 'fulfilled' ? (res.value.data?.data || res.value.data || res.value) : {};
      const pendingData = pendingRes.status === 'fulfilled' ? (pendingRes.value.data?.data || pendingRes.value.data || pendingRes.value) : {};

      setBadgeCounts((prev) => ({
        ...prev,
        ...data,
        pendingPosts: pendingData.pendingCount || 0,
      }));
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
      title: 'TỔNG QUAN & PHÂN TÍCH',
      items: [
        { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, badge: 'Live' },
        { to: '/admin/users', label: 'Học Viên (Users)', icon: Users },
        { to: '/admin/learning', label: 'Tiến Trình Học', icon: GraduationCap },
        { to: '/admin/ai', label: 'Phân Tích AI', icon: Cpu },
      ],
    },
    {
      title: 'KHO NỘI DUNG',
      items: [
        { to: '/admin/languages', label: 'Quản Lý Ngôn Ngữ', icon: Globe },
        { to: '/admin/games', label: 'Quản Trị Games & Đề', icon: Gamepad2 },
        { to: '/admin/shared-vocabulary', label: 'Kho Từ Vựng (Decks)', icon: Library },
        { to: '/admin/vocabulary', label: 'Từ Vựng Master (Words)', icon: Database },
        {
          to: '/admin/community-moderation',
          label: 'Duyệt Bài Cộng Đồng & AI',
          icon: Sparkles,
          count: badgeCounts.pendingPosts > 0 ? badgeCounts.pendingPosts : undefined,
          badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
        },
        { to: '/admin/resources', label: 'Tài Nguyên Học Liệu', icon: FileText },
      ],
    },
    {
      title: 'KINH DOANH & GÓI CƯỚC',
      items: [
        { to: '/admin/plans', label: 'Quản Lý Gói Pro', icon: Package },
        { to: '/admin/pricing', label: 'Định Giá Thông Minh', icon: DollarSign },
        {
          to: '/admin/finance',
          label: 'Doanh Thu & Dòng Tiền',
          icon: TrendingUp,
          count: badgeCounts.payments > 0 ? badgeCounts.payments : undefined,
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        },
        { to: '/admin/reports', label: 'Báo Cáo Tài Chính', icon: BarChart3 },
        { to: '/admin/billing', label: 'Đơn Hàng & Giao Dịch', icon: CreditCard },
      ],
    },
    {
      title: 'VẬN HÀNH & CHĂM SÓC',
      items: [
        {
          to: '/admin/conversations',
          aliasTo: '/admin/support',
          label: 'Hỗ Trợ CSKH',
          icon: Headphones,
          count: badgeCounts.conversations,
          badgeColor: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
        },
        {
          to: '/admin/feedback',
          label: 'Đóng Góp Ý Kiến',
          icon: MessageSquarePlus,
          count: badgeCounts.feedback,
          badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
        },
        {
          to: '/admin/notifications',
          label: 'Thông Báo Hệ Thống',
          icon: Bell,
          count: badgeCounts.notifications,
          badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
        },
      ],
    },
    {
      title: 'HỆ THỐNG & BẢO MẬT',
      items: [
        { to: '/admin/system', label: 'Sức Khỏe Hệ Thống', icon: Activity },
        { to: '/admin/security', label: 'Bảo Mật & Keypass (Rủi Ro)', icon: ShieldCheck },
        { to: '/admin/firebase', label: 'Cấu hình Firebase', icon: Flame },
        { to: '/admin/settings', label: 'Cài Đặt Chung', icon: Settings },
      ],
    },
  ];

  const isLockedHeightRoute =
    location.pathname.startsWith('/admin/support') ||
    location.pathname.startsWith('/admin/conversations');

  return (
    <div
      className={`min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white ${isLockedHeightRoute ? 'h-dvh max-h-dvh overflow-hidden overscroll-none' : ''
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
        className={`fixed lg:sticky top-0 h-dvh z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-[68px] px-1.5' : 'w-64 px-3'
          } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand & Command Center Header */}
        <div className={`py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center ${sidebarCollapsed ? 'flex-col gap-2 justify-center' : 'justify-between px-1'}`}>
          <div
            className={`flex items-center gap-2.5 min-w-0 cursor-pointer group ${sidebarCollapsed ? 'justify-center' : 'flex-1 overflow-hidden'}`}
            onClick={() => navigate('/admin')}
            title="VocabFlow Admin"
          >
            <VocabFlowLogo
              size="sm"
              showContainer={false}
              className="group-hover:scale-105 transition-transform duration-200"
            />
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1 truncate">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-extrabold text-base leading-tight tracking-tight text-slate-900 dark:text-white truncate">
                    VocabFlow
                  </h2>
                  <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase border border-indigo-500/30 shrink-0">
                    ADMIN
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium truncate">
                  Quản Trị Hệ Thống
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleSidebarCollapse}
              className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={sidebarCollapsed ? 'Mở rộng thanh quản trị' : 'Thu gọn thanh quản trị (Chỉ hiện icon)'}
            >
              {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Action Shortcut Banner */}
        {sidebarCollapsed ? (
          <div
            onClick={() => setPaletteOpen(true)}
            className="my-2 mx-auto w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center cursor-pointer hover:bg-indigo-500/20 transition text-indigo-400"
            title="Command Palette (Ctrl+K)"
          >
            <Command className="w-4 h-4" />
          </div>
        ) : (
          <div className="p-2.5 my-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Command className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px] font-bold text-indigo-300">Command Palette</span>
            </div>
            <kbd
              onClick={() => setPaletteOpen(true)}
              className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] tabular-nums text-slate-300 border border-slate-700 cursor-pointer hover:bg-slate-700"
            >
              Ctrl+K
            </kbd>
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="flex-1 py-2 space-y-3 overflow-y-auto no-scrollbar text-xs font-semibold">
          {navSections.map((sec) => (
            <div key={sec.title} className="space-y-1">
              {!sidebarCollapsed ? (
                <div className="px-2 pt-1 pb-0.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
                  {sec.title}
                </div>
              ) : (
                <div className="w-6 mx-auto border-t border-slate-800 my-1.5" />
              )}
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
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`flex items-center rounded-xl transition relative border-none ${sidebarCollapsed
                      ? 'justify-center mx-auto w-9 h-9 p-0'
                      : 'justify-between px-2.5 py-2'
                      } ${isActive
                        ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
                      }`}
                  >
                    <div className={`flex items-center min-w-0 ${sidebarCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {item.count !== undefined && item.count > 0 ? (
                      sidebarCollapsed ? (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
                      ) : (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase shrink-0 ${item.badgeColor || 'bg-indigo-600 text-white'
                            }`}
                        >
                          {item.count}
                        </span>
                      )
                    ) : item.badge ? (
                      sidebarCollapsed ? (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-900" />
                      ) : (
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase shrink-0 ${isActive
                            ? 'bg-indigo-100 dark:bg-white/20 text-indigo-700 dark:text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                            }`}
                        >
                          {item.badge}
                        </span>
                      )
                    ) : null}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Actions: User App Switch & Admin Info */}
        <div className="py-2.5 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
          <button
            onClick={() => {
              setSidebarOpen(false);
              navigateToApp('student', '/dashboard');
            }}
            className={`rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center border border-slate-200 dark:border-slate-700/60 ${sidebarCollapsed ? 'w-9 h-9 mx-auto justify-center p-0' : 'w-full py-2 px-3 justify-between'
              }`}
            title="Quay lại giao diện học tập của học viên"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              {!sidebarCollapsed && <span>Sang Học Viên</span>}
            </div>
            {!sidebarCollapsed && <span className="text-[10px] text-slate-400">&rarr;</span>}
          </button>

          <div className={`flex items-center rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 ${sidebarCollapsed ? 'flex-col gap-1.5 p-1 w-9 mx-auto' : 'justify-between p-2'
            }`}>
            <div className={`flex items-center gap-2 min-w-0 ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {user?.displayName?.charAt(0).toUpperCase() || 'A'}
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                    {user?.displayName || 'Admin'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.role || 'ADMIN'}</p>
                </div>
              )}
            </div>

            <button
              onClick={toggleTheme}
              className={`rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition flex items-center justify-center ${sidebarCollapsed ? 'w-7 h-7 p-0' : 'p-1.5'
                }`}
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
        className={`flex-1 flex flex-col min-w-0 ${isLockedHeightRoute
          ? 'h-dvh max-h-dvh overflow-hidden overscroll-none'
          : 'overflow-x-clip'
          }`}
      >
        {/* Real-time Operational Toast Banner */}
        {liveToast && (
          <div className="fixed top-14 right-4 z-50 max-w-sm w-full animate-in slide-in-from-top-3 duration-200">
            <div
              className={`p-3 rounded-2xl border backdrop-blur-2xl shadow-2xl flex items-start gap-3 ${liveToast.priority === 'CRITICAL'
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
                    className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${liveToast.priority === 'CRITICAL'
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

        {/* Dedicated Admin Topbar — Balanced, Spacious & Symmetric */}
        <header className="sticky top-0 z-30 h-14 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Brand Logo */}
            <div
              onClick={() => navigate('/admin')}
              className="lg:hidden cursor-pointer flex items-center gap-2 group shrink-0"
              title="VocabFlow Admin"
            >
              <VocabFlowLogo size="xs" showContainer={false} className="group-hover:scale-105 transition-transform" />
              <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">VocabFlow</span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase border border-indigo-500/30">
                ADMIN
              </span>
            </div>

            {/* Quick Search Shortcut */}
            <div
              onClick={() => setPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs cursor-pointer transition w-60 shadow-xs"
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="flex-1">Tìm kiếm nhanh...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-[10px] tabular-nums border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                Ctrl+K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Live Status Indicator (click opens /admin/system) */}
            <div
              onClick={() => navigate('/admin/system')}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-bold cursor-pointer transition shadow-xs"
              title="Xem Báo cáo sức khỏe hệ thống (System Health)"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span>Hệ thống hoạt động tốt</span>
            </div>

            {/* Support Shortcut with unread badge */}
            <button
              onClick={() => navigate('/admin/conversations')}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 relative transition"
              title="Hội thoại CSKH"
            >
              <Headphones className="w-4 h-4" />
              {badgeCounts.conversations > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {/* Notification Bell with live count */}
            <button
              onClick={() => navigate('/admin/notifications')}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 relative transition"
              title="Thông báo quản trị"
            >
              <Bell className="w-4 h-4" />
              {badgeCounts.notifications > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>
          </div>
        </header>

        {/* Outlet for Sub-Pages */}
        <main
          className={`flex-1 min-w-0 ${isLockedHeightRoute
            ? 'p-1 sm:p-1.5 overflow-hidden flex flex-col h-[calc(100dvh-56px)] max-h-[calc(100dvh-56px)] min-h-0'
            : 'p-4 sm:p-5 lg:p-6 space-y-6'
            }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};
