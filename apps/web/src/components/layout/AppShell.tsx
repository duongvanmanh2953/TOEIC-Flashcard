import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../i18n';
import { LiquidBackground } from '../common/LiquidBackground';
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  BrainCircuit,
  Award,
  Settings,
  LogOut,
  Moon,
  Sun,
  Flame,
  Menu,
  X,
  Compass,
  Bookmark,
  Share2,
  HelpCircle,
  Crown,
  ShieldCheck,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

export const AppShell: React.FC = () => {
  const { user, logout, theme, toggleTheme } = useAuth();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const navItems = [
    { to: '/dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { to: '/review', label: t('nav.review', 'Smart Review'), icon: Sparkles, badge: 'SRS' },
    { to: '/vocabulary', label: t('nav.vocabulary', 'Vocab Explorer'), icon: BookOpen },
    { to: '/word-bank', label: t('nav.wordBank', 'My Word Bank'), icon: Bookmark },
    { to: '/community', label: t('nav.community', 'Community Decks'), icon: Share2 },
    { to: '/custom-quiz', label: t('nav.customQuiz', 'Dynamic Quiz'), icon: HelpCircle },
    { to: '/ai-tutor', label: t('nav.aiTutor', 'AI Tutor'), icon: BrainCircuit },
    { to: '/placement-test', label: t('nav.placementTest', 'Placement Test'), icon: Compass },
    { to: '/progress', label: t('nav.progress', 'Progress & Stats'), icon: Award },
    { to: '/upgrade', label: t('nav.upgrade', 'Premium Tiers'), icon: Crown, highlight: true },
    ...(isAdmin ? [{ to: '/admin', label: t('nav.admin', 'Admin Center'), icon: ShieldCheck, admin: true }] : []),
    { to: '/settings', label: t('nav.settings', 'Settings'), icon: Settings },
  ];

  const mobileBottomItems = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/review', label: 'Review', icon: Sparkles },
    { to: '/vocabulary', label: 'Vocab', icon: BookOpen },
    { to: '/ai-tutor', label: 'AI', icon: BrainCircuit },
    { to: '/word-bank', label: 'Saved', icon: Bookmark },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50/30 dark:bg-[#070b14]/50 text-slate-900 dark:text-slate-100 font-sans antialiased relative selection:bg-indigo-500 selection:text-white">
      {/* Ambient Blurred Colored Blobs / Orbs */}
      <LiquidBackground />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 max-w-[16rem] border-r border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl px-3.5 pt-5 pb-4 shrink-0 h-screen sticky top-0 overflow-hidden box-border z-20">
        {/* Scrollable Upper Navigation Area */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-0.5 pb-2">
          {/* Brand Header with VocabFlow Logo Asset */}
          <div className="flex items-center justify-between mb-5 px-1 w-full min-w-0">
            <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
              <img
                src="/vocabflow-logo-256.png"
                alt="VocabFlow Logo"
                className="w-9 h-9 rounded-xl object-contain shadow-xs shrink-0"
              />
              <div className="min-w-0 flex-1 truncate">
                <h1 className="font-extrabold text-base leading-tight tracking-tight text-slate-900 dark:text-white truncate">
                  VocabFlow
                </h1>
                <p className="text-[11px] text-slate-400 font-medium truncate">Smart Adaptive English</p>
              </div>
            </div>
          </div>

          {/* User Streak Pill */}
          <div className="mb-4 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs min-w-0 truncate">
              <Flame className="w-4 h-4 fill-amber-500 shrink-0" />
              <span className="truncate">{user?.streak?.currentStreak || 0} Day Streak</span>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-extrabold shrink-0 ml-1">
              Lvl {user?.xp?.currentLevel || 1}
            </span>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1 w-full min-w-0 overflow-hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 min-w-0 overflow-hidden ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm'
                      : item.admin
                      ? 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30'
                      : item.highlight
                      ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  }`
                }
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 truncate mr-1.5">
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="shrink-0 text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 bg-indigo-600 text-white rounded-md shadow-xs ml-1">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Pinned User Footer: strictly fixed at bottom */}
        <div className="shrink-0 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 w-full min-w-0 space-y-2 bg-transparent">
          {/* Account Tier Pill — positioned right above avatar & email */}
          <div
            onClick={() => navigate('/upgrade')}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-amber-500/10 border border-indigo-500/20 hover:border-indigo-500/40 flex items-center justify-between cursor-pointer transition group"
            title="Xem chi tiết gói tài khoản hoặc nâng cấp"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">
                  Gói tài khoản
                </p>
                <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 truncate leading-tight mt-0.5">
                  {user?.subscription?.tier || 'Free Tier'}
                </p>
              </div>
            </div>
            <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md bg-indigo-600 text-white group-hover:bg-indigo-500 transition shrink-0">
              {user?.subscription?.tier === 'PRO' ? 'PRO' : 'Nâng cấp'}
            </span>
          </div>

          {/* User Profile Info Row with > Icon (Clickable to open profile details & guide) */}
          <div
            onClick={() => setProfileModalOpen(true)}
            className="flex items-center justify-between gap-2 p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition group min-w-0 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60"
            title="Bấm để xem hồ sơ cá nhân & Hướng dẫn sử dụng"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
                {user?.displayName?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="truncate flex-1 min-w-0">
                <p className="text-xs font-bold truncate text-slate-900 dark:text-white leading-tight">
                  {user?.displayName}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition shrink-0" />
          </div>

          {/* Theme & Logout Controls */}
          <div className="flex items-center gap-1.5 px-0.5">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{theme === 'dark' ? t('nav.lightMode', 'Light') : t('nav.darkMode', 'Dark')}</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              title={t('nav.logout', 'Logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0 overflow-x-hidden relative z-10">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <img
              src="/vocabflow-logo-256.png"
              alt="VocabFlow"
              className="w-8 h-8 rounded-xl object-contain shrink-0"
            />
            <span className="font-extrabold text-base text-slate-900 dark:text-white">
              VocabFlow
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 bg-indigo-600 text-white rounded-md">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('nav.logout', 'Logout')}</span>
            </button>
          </div>
        )}

        {/* Routed Pages Container — Expanded & Unconstrained */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-none">
          <Outlet />
        </main>

        {/* Mobile Thumb-Reach Bottom Navigation Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-around py-2 px-1 shadow-lg">
          {mobileBottomItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* User Profile & Guidance Modal — Perfectly centered, no margin-top */}
      {profileModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          onClick={() => setProfileModalOpen(false)}
        >
          <div
            className="m-auto relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-black text-base flex items-center justify-center shadow-xs">
                  {user?.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {user?.displayName}
                  </h3>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="py-4 space-y-4 text-xs sm:text-sm">
              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Cấp độ học</span>
                  <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                    Lvl {user?.xp?.currentLevel || 1}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Chuỗi ngày (Streak)</span>
                  <p className="text-lg font-black text-amber-500 mt-0.5">
                    {user?.streak?.currentStreak || 0} ngày
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Điểm XP tích lũy</span>
                  <p className="text-lg font-black text-emerald-500 mt-0.5">
                    {user?.xp?.totalXP || 0} XP
                  </p>
                </div>
              </div>

              {/* Active Package Details */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-amber-500/10 border border-indigo-500/20 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Gói dịch vụ: {user?.subscription?.tier || 'Free Tier'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Trạng thái: Hoạt động • Không giới hạn lượt ôn tập SRS & AI
                  </p>
                </div>
                <button
                  onClick={() => {
                    setProfileModalOpen(false);
                    navigate('/upgrade');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition"
                >
                  Nâng cấp gói
                </button>
              </div>

              {/* Guidance & Effective Learning Tips Section */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-indigo-500" />
                    <span>Hướng Dẫn Sử Dụng & Mẹo Học Hiệu Quả</span>
                  </h4>
                </div>

                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 inline-flex items-center justify-center font-black text-[10px]">1</span>
                      <span>Lộ trình ôn tập ngắt quãng (SRS):</span>
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 pl-6 leading-relaxed">
                      Mỗi ngày hệ thống tự động tính toán từ vựng sắp rơi vào "vùng quên" để đưa vào phiên ôn tập. Bạn chỉ cần vào mục "Smart Review" để ôn đúng thời điểm vàng.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 inline-flex items-center justify-center font-black text-[10px]">2</span>
                      <span>Nhập từ vựng nhanh từ file Excel:</span>
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 pl-6 leading-relaxed">
                      Tại trang "My Word Bank", bấm nút "Nhập Excel / CSV", tải file mẫu chuẩn về máy, điền danh sách từ của bạn rồi kéo thả file lên để nạp hàng loạt từ vựng.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 inline-flex items-center justify-center font-black text-[10px]">3</span>
                      <span>Tương tác cùng Gia Sư AI:</span>
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 pl-6 leading-relaxed">
                      Dùng AI Tutor để hỏi chuyên sâu về sự khác biệt giữa các từ đồng nghĩa, cấu trúc câu công sở hoặc yêu cầu đố trắc nghiệm phản xạ.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setProfileModalOpen(false);
                  navigate('/settings');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Đi đến Cài đặt
              </button>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-sm"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
