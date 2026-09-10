import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  KidsHomeIcon,
  KidsMapIcon,
  KidsGameIcon,
  KidsIslandIcon,
  KidsStarIcon,
  KidsSoundOnIcon,
  KidsSoundOffIcon,
  KidsParentIcon,
} from '../assets/icons/KidsIcons';
import { curriculumProgress, KidProgressState } from '../curriculum/curriculumProgress';
import { kidsSound } from '../services/sound/KidsSoundManager';
import { KidsParentPinModal } from './KidsParentPinModal';

export const KidsLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = useState<KidProgressState>(() =>
    curriculumProgress.getState()
  );
  const [soundOn, setSoundOn] = useState(() => kidsSound.isEnabled());
  const [parentModalOpen, setParentModalOpen] = useState(false);
  const [pendingParentRoute, setPendingParentRoute] = useState<string>('/kids/parent');

  // Sync progress state
  useEffect(() => {
    if (curriculumProgress && typeof curriculumProgress.subscribe === 'function') {
      return curriculumProgress.subscribe((s) => setProgress(s));
    }
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleToggleSound = () => {
    const next = kidsSound.toggleSound();
    setSoundOn(next);
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
    { to: '/kids', label: 'Trang Chủ', icon: KidsHomeIcon, exact: true },
    { to: '/kids/journey', label: 'Vượt Núi', icon: KidsMapIcon },
    { to: '/kids/games', label: 'Trò Chơi', icon: KidsGameIcon },
    { to: '/kids/world', label: 'Đảo Của Bé', icon: KidsIslandIcon },
  ];

  const isLessonMode = location.pathname.startsWith('/kids/lesson');

  return (
    <div className={`min-h-screen bg-[#FFFDF7] text-slate-800 font-sans select-none flex flex-col relative overflow-x-hidden ${isLessonMode ? 'pb-4' : 'pb-24 md:pb-8'}`}>
      {/* Subtle Background Layering & Playful Shapes */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Soft pastel sky blob */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-sky-200/35 blur-3xl" />
        {/* Gentle sunny blob */}
        <div className="absolute top-1/4 -right-24 w-80 h-80 rounded-full bg-amber-200/30 blur-3xl" />
        {/* Gentle mint meadow blob */}
        <div className="absolute bottom-10 -left-20 w-88 h-88 rounded-full bg-emerald-200/30 blur-3xl" />
        {/* Distant soft mountains silhouette */}
        <div className="absolute bottom-0 left-0 right-0 h-32 opacity-15 flex items-end justify-around pointer-events-none select-none text-7xl sm:text-8xl">
          <span>⛰️</span>
          <span>🏔️</span>
          <span>⛰️</span>
          <span>🏔️</span>
        </div>
        {/* Decorative soft clouds */}
        <div className="absolute top-20 right-12 text-slate-300/40 text-4xl select-none animate-gentle-float">☁️</div>
        <div className="absolute top-96 left-8 text-slate-300/30 text-3xl select-none animate-gentle-float" style={{ animationDelay: '1.5s' }}>☁️</div>
        <div className="absolute bottom-40 right-20 text-slate-300/35 text-5xl select-none animate-gentle-float" style={{ animationDelay: '2.5s' }}>☁️</div>
      </div>

      {/* Top Header - Hidden in Focus Mode so lesson has full distraction-free screen */}
      {!isLessonMode && (
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b-2 border-amber-200/80 px-4 sm:px-6 lg:px-8 py-2.5 shadow-sm">
          <div className="w-full max-w-[1440px] mx-auto flex items-center justify-between gap-3 sm:gap-6">
            {/* Logo & Brand */}
            <div
              onClick={() => navigate('/kids')}
              className="flex items-center gap-2.5 cursor-pointer hover:scale-105 transition-transform shrink-0"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-md border-2 border-white">
                🐻
              </div>
              <div>
                <h1 className="font-black text-base sm:text-lg leading-none tracking-tight text-amber-950">
                  Bé Học Tiếng Anh
                </h1>
                <p className="text-[11px] font-extrabold text-emerald-600 mt-0.5">
                  Cùng Gấu Bobby 🌟
                </p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5 lg:gap-2 xl:gap-3">
              {navItems.map((item) => {
                const isActive =
                  item.exact
                    ? location.pathname === item.to
                    : location.pathname.startsWith(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-2 rounded-2xl font-black text-xs lg:text-sm transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-amber-400 text-amber-950 shadow-md shadow-amber-400/30 scale-105 border-2 border-amber-500/40'
                        : 'text-slate-700 hover:bg-amber-100/70 border-2 border-transparent'
                    }`}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Gamification Stats: Stars & Sound & Parent Lock */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Stars Pill */}
              <div
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-amber-100 border-2 border-amber-400 text-amber-900 font-black text-xs sm:text-sm shadow-xs"
                title="Tổng số sao đạt được"
              >
                <KidsStarIcon size={18} filled className="text-amber-500 fill-amber-500" />
                <span>{progress.totalStars}</span>
              </div>

              {/* Streak Pill */}
              <div
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-rose-100 border-2 border-rose-300 text-rose-800 font-black text-xs"
                title="Số ngày học liên tiếp"
              >
                <span>🔥 {progress.streakDays} ngày</span>
              </div>

              {/* Sound Toggle */}
              <button
                onClick={handleToggleSound}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 flex items-center justify-center text-slate-800 transition cursor-pointer"
                title={soundOn ? 'Âm thanh: Đang bật' : 'Âm thanh: Đã tắt'}
              >
                {soundOn ? <KidsSoundOnIcon size={20} /> : <KidsSoundOffIcon size={20} />}
              </button>

              {/* Parent Area (Protected by Math Gate) */}
              <button
                onClick={() => handleOpenParentGate('/kids/parent')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-purple-100 hover:bg-purple-200 border-2 border-purple-300 text-purple-900 font-black text-xs transition cursor-pointer"
                title="Khu vực dành cho Phụ huynh"
              >
                <KidsParentIcon size={16} />
                <span className="hidden sm:inline text-xs">Bố Mẹ</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative z-10">
        <Outlet />
      </main>

      {/* Mobile / Tablet Friendly Bottom Bar Navigation - Hidden in Focus Mode */}
      {!isLessonMode && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t-2 border-amber-200 px-3 py-2 flex items-center justify-around shadow-xl">
          {navItems.map((item) => {
            const isActive =
              item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-amber-400 text-amber-950 font-black scale-105 shadow-sm border border-amber-500/30'
                    : 'text-slate-600 font-bold hover:text-slate-900'
                }`}
              >
                <item.icon size={22} />
                <span className="text-[11px] mt-0.5">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      )}

      {/* Parent Gate Verification Modal */}
      <KidsParentPinModal
        isOpen={parentModalOpen}
        onClose={() => setParentModalOpen(false)}
        onVerified={handleParentVerified}
      />
    </div>
  );
};

export default KidsLayout;
