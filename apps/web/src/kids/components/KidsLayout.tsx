import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  KidsHomeIcon,
  KidsMapIcon,
  KidsGameIcon,
  KidsIslandIcon,
  KidsStarIcon,
} from '../assets/icons/KidsIcons';
import { curriculumProgress, KidProgressState } from '../curriculum/curriculumProgress';
import { kidsSound } from '../services/sound/KidsSoundManager';
import { kidsAudioManager } from '../services/audio/KidsAudioManager';
import { KidsParentPinModal } from './KidsParentPinModal';
import { KidsHeaderStatCard } from './KidsHeaderStatCard';
import { KidsSoundToggle } from './KidsSoundToggle';
import {
  Flame,
  Sparkles,
  Star,
  Volume2,
  VolumeX,
  ShieldCheck,
  BookOpen,
  Menu,
  X,
  ChevronRight,
  Compass,
  Smile,
  Trophy,
} from 'lucide-react';

export const KidsLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = useState<KidProgressState>(() =>
    curriculumProgress.getState()
  );
  const [soundOn, setSoundOn] = useState(() => kidsSound.isEnabled() || kidsAudioManager.isMusicEnabled());
  const [parentModalOpen, setParentModalOpen] = useState(false);
  const [pendingParentRoute, setPendingParentRoute] = useState<string>('/kids/parent');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync progress state
  useEffect(() => {
    if (curriculumProgress && typeof curriculumProgress.subscribe === 'function') {
      return curriculumProgress.subscribe((s) => setProgress(s));
    }
  }, []);

  // Ensure global world ambient music starts softly on interaction if enabled
  useEffect(() => {
    kidsAudioManager.startWorldMusic('world');
  }, []);

  // Scroll to top and close mobile menu on route change
  useEffect(() => {
    window.scrollTo(0, 0);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleToggleSound = () => {
    const nextSound = kidsSound.toggleSound();
    const nextMusic = kidsAudioManager.toggleMusic();
    setSoundOn(nextSound || nextMusic);
  };

  const handleOpenParentGate = (targetRoute: string) => {
    kidsSound.play('click');
    setPendingParentRoute(targetRoute);
    setParentModalOpen(true);
  };

  const handleParentVerified = () => {
    navigate(pendingParentRoute);
  };

  const navItems = [
    { to: '/kids', label: 'Trang Chủ', desc: 'Hành trình phiêu lưu', icon: KidsHomeIcon, exact: true },
    { to: '/kids/journey', label: 'Vượt Núi', desc: 'Bản đồ leo đèo', icon: KidsMapIcon },
    { to: '/kids/games', label: 'Trò Chơi', desc: '6 Gameplay kỳ thú', icon: KidsGameIcon },
    { to: '/kids/world', label: 'Đảo Của Bé', desc: 'Vườn từ & Giao tiếp', icon: KidsIslandIcon },
    { to: '/kids/flashcards', label: 'Thẻ Từ', desc: 'Luyện nhớ thông minh', icon: BookOpen },
  ];

  const isLessonMode = location.pathname.startsWith('/kids/lesson');
  const isGamePlayingMode = location.pathname === '/kids/games' && new URLSearchParams(location.search).has('game');
  const isFocusMode = isLessonMode || isGamePlayingMode;

  return (
    <div className={`min-h-screen bg-[#FFFDF7] text-slate-800 font-sans select-none flex flex-col relative overflow-x-hidden ${isFocusMode ? 'pb-4' : 'pb-24 md:pb-6'}`}>
      {/* Subtle Background Layering & Playful Shapes */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute top-1/4 -right-24 w-80 h-80 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute bottom-10 -left-20 w-88 h-88 rounded-full bg-emerald-200/30 blur-3xl" />
      </div>

      {/* ========================================================================= */}
      {/* 1. ANIMATED KIDS DRAWER (Clean slide-in with overlay for Desktop & Mobile) */}
      {/* ========================================================================= */}
      {!isFocusMode && (
        <>
          {/* Overlay Backdrop */}
          {mobileMenuOpen && (
            <div
              className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Kids Drawer Panel: Slides in from left */}
          <aside
            className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-white border-r-2 border-slate-200 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
          >
            {/* Top Brand Section: VocabFlow Kids Logo + Close Button */}
            <div className="p-5 border-b-2 border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div
                onClick={() => {
                  kidsSound.play('pop');
                  navigate('/kids');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 cursor-pointer hover:scale-102 transition-transform"
              >
                <div className="w-11 h-11 rounded-2xl bg-amber-100 p-1.5 border-2 border-amber-300 shadow-xs shrink-0 flex items-center justify-center">
                  <img
                    src="/vocabflow-logo-256.png"
                    alt="VocabFlow Kids"
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-black text-base leading-tight text-slate-900 tracking-tight">
                      VocabFlow
                    </h2>
                    <span className="px-1.5 py-0.5 rounded-lg bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                      KIDS
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-500">
                    English Edutainment
                  </p>
                </div>
              </div>

              {/* Close button with clean SVG */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Đóng menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mascot Companion Profile Card */}
            <div className="px-5 py-3.5 bg-amber-50/70 border-b border-amber-100 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white border-2 border-amber-300 shadow-xs flex items-center justify-center text-2xl shrink-0">
                🐻
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-amber-950 truncate">Bạn Gấu Bobby</p>
                <p className="text-[11px] font-bold text-amber-800/80 truncate">
                  {progress.totalStars || 0} Sao Vàng • {progress.streakDays || 1} Ngày liên tục
                </p>
              </div>
            </div>

            {/* Middle Nav Items (Pure SVG Icons, High Contrast, Left Indicator) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-none">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 block mb-1">
                Khu vực khám phá
              </span>

              {[
                { to: '/kids', label: 'Trang Chủ', desc: 'Trung tâm phiêu lưu', icon: KidsHomeIcon, exact: true },
                { to: '/kids/journey', label: 'Hành Trình Leo Núi', desc: 'Bản đồ chặng đèo kỳ thú', icon: Compass },
                { to: '/kids/games', label: 'Phòng Trò Chơi', desc: 'Thế giới game tương tác vật lý', icon: KidsGameIcon },
                { to: '/kids/world', label: 'Đảo Của Bé', desc: 'Vườn từ & Phòng triển lãm', icon: KidsIslandIcon },
                { to: '/kids/flashcards', label: 'Kho Từ Vựng', desc: 'Thẻ bài học từ đa giác quan', icon: BookOpen },
              ].map((item) => {
                const isActive =
                  item.exact
                    ? location.pathname === item.to
                    : location.pathname.startsWith(item.to);

                const ItemIcon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl font-black transition-all min-h-[52px] ${isActive
                        ? 'bg-amber-100/80 text-slate-950 border-l-4 border-amber-500 shadow-xs'
                        : 'text-slate-700 hover:bg-slate-50 border-l-4 border-transparent'
                      }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-amber-400 text-amber-950 shadow-xs' : 'bg-slate-100 text-slate-600'
                      }`}>
                      <ItemIcon size={20} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-black truncate leading-tight text-slate-900">{item.label}</p>
                      <p className="text-[11px] font-bold text-slate-500 truncate mt-0.5">{item.desc}</p>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-amber-900 shrink-0" />}
                  </NavLink>
                );
              })}
            </div>

            {/* Bottom Actions: Parent Gate & Exit to Main TOEIC App */}
            <div className="p-4 border-t-2 border-slate-100 bg-slate-50 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleOpenParentGate('/kids/parent');
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 font-black text-xs transition cursor-pointer min-h-[46px]"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  <span>Khu Vực Phụ Huynh</span>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-600" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/dashboard');
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-slate-500 hover:text-slate-800 text-xs font-bold transition cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Trở về ứng dụng TOEIC chính</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Floating Sound Toggle in Focus Mode */}
      {isFocusMode && (
        <div className="fixed top-3.5 right-3.5 z-50">
          <KidsSoundToggle variant="compact" />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT AREA (Full width on Desktop without pinned sidebar)       */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        {!isFocusMode && (
          <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b-2 border-slate-200 px-4 sm:px-6 lg:px-8 py-3">
            <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-3">
              {/* Left: Drawer Trigger Button + Brand */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="h-11 px-3.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs sm:text-sm border-2 border-amber-500 flex items-center gap-2 cursor-pointer active:scale-95 shadow-xs transition-transform"
                  aria-label="Mở Kids Drawer"
                >
                  <Menu className="w-5 h-5" />
                  <span>Khám Phá</span>
                </button>

                <div
                  onClick={() => navigate('/kids')}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-100 p-1 border border-amber-300 flex items-center justify-center shrink-0">
                    <img
                      src="/vocabflow-logo-256.png"
                      alt="VocabFlow Kids"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="font-black text-base text-slate-900 tracking-tight hidden sm:inline">
                    VocabFlow <span className="text-rose-600 text-xs">KIDS</span>
                  </span>
                </div>
              </div>

              {/* Right Stats Quick View & Sound Controller */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 font-black text-xs sm:text-sm shadow-xs">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span>{progress.totalStars || 0}</span>
                  <span className="text-[10px] text-amber-800 hidden sm:inline">Sao</span>
                </div>

                <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 font-black text-xs sm:text-sm">
                  <Flame className="w-4 h-4 fill-rose-500 text-rose-500" />
                  <span>{progress.streakDays || 1}</span>
                  <span className="text-[10px] text-rose-700">ngày</span>
                </div>

                {/* Unified Sound Controller */}
                <KidsSoundToggle variant="pill" className="shrink-0" />

                <button
                  type="button"
                  onClick={() => handleOpenParentGate('/kids/parent')}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-900 font-black text-xs cursor-pointer active:scale-95 shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  <span>Bố Mẹ</span>
                </button>
              </div>
            </div>
          </header>
        )}

        {/* Main Content Body */}
        <main className="flex-1 w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative z-10">
          <Outlet />
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. TABLET & MOBILE BOTTOM NAVIGATION (Quick shortcuts)                    */}
      {/* ========================================================================= */}
      {!isFocusMode && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t-2 border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
          {navItems.map((item) => {
            const isActive =
              item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all min-h-[48px] min-w-[56px] ${isActive
                  ? 'bg-amber-400 text-amber-950 font-black scale-105 border border-amber-500/30'
                  : 'text-slate-600 font-bold hover:text-slate-900'
                  }`}
              >
                <item.icon size={20} />
                <span className="text-[10px] mt-0.5 leading-tight">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      )}

      {/* Parent Pin Verification Gate */}
      <KidsParentPinModal
        isOpen={parentModalOpen}
        onClose={() => setParentModalOpen(false)}
        onSuccess={handleParentVerified}
      />
    </div>
  );
};

export default KidsLayout;
