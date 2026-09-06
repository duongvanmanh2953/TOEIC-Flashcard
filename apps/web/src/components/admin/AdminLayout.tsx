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
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, theme, toggleTheme, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [dateRange, setDateRange] = useState('30d');
  const [liveMode, setLiveMode] = useState(true);

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

  const navItems = [
    { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard, badge: 'Live' },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/vocabulary', label: 'Vocabulary Health', icon: BookOpen },
    { to: '/admin/learning', label: 'Learning & Cohorts', icon: GraduationCap },
    { to: '/admin/support', label: 'Support Inbox', icon: Headphones, badge: 'CSKH' },
    { to: '/admin/feedback', label: 'Feedback & Ideas', icon: MessageSquarePlus },
    { to: '/admin/notifications', label: 'Broadcast & Alerts', icon: Bell },
    { to: '/admin/ai', label: 'AI Monitoring', icon: Cpu },
    { to: '/admin/billing', label: 'Billing & MRR', icon: CreditCard },
    { to: '/admin/system', label: 'System Health', icon: Activity },
    { to: '/admin/security', label: 'Security & Roles', icon: ShieldCheck },
    { to: '/admin/settings', label: 'Cài Đặt / Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
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

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto no-scrollbar text-xs font-semibold">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.to ||
              (item.to === '/admin/dashboard' && location.pathname === '/admin');

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
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
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Dedicated Admin Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick Search Shortcut */}
            <div
              onClick={() => setPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-slate-200 text-xs cursor-pointer transition w-64 shadow-xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="flex-1">Tìm kiếm nhanh...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 text-[10px] font-mono border border-slate-700">
                Ctrl+K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Indicator Toggle */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE</span>
            </div>

            {/* Date Range Selector */}
            <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700/80 text-[11px] font-bold">
              {['Today', '7d', '30d', '90d'].map((r) => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    dateRange === r
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => navigate('/admin/notifications')}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 relative transition"
              title="Thông báo quản trị"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500" />
            </button>
          </div>
        </header>

        {/* Outlet for Sub-Pages */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
