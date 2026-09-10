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
    return curriculumProgress.subscribe((s) => setProgress(s));
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
    { to: '/kids', label: 'Home', labelVi: 'Trang Chủ', icon: KidsHomeIcon, exact: true },
    { to: '/kids/journey', label: 'Journey', labelVi: 'Bản Đồ', icon: KidsMapIcon },
    { to: '/kids/games', label: 'Games', labelVi: 'Trò Chơi', icon: KidsGameIcon },
    { to: '/kids/my-world', label: 'My World', labelVi: 'Thế Giới Của Bé', icon: KidsIslandIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-amber-50/40 to-emerald-50/60 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 text-slate-800 dark:text-slate-100 font-sans select-none flex flex-col pb-20 md:pb-6">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-b-2 border-amber-200/80 dark:border-slate-800 px-4 sm:px-6 py-2.5 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <div
            onClick={() => navigate('/kids')}
            className="flex items-center gap-2.5 cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-xl shadow-md border-2 border-white dark:border-slate-800">
              🐻
            </div>
            <div>
              <h1 className="font-black text-base sm:text-lg leading-none tracking-tight text-amber-900 dark:text-amber-100">
                VocabFlow Kids
              </h1>
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                Adventure English
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const isActive =
                item.exact
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-xs transition-all ${
                    isActive
                      ? 'bg-amber-400 text-amber-950 shadow-md shadow-amber-400/30 scale-105'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-amber-100/60 dark:hover:bg-slate-800'
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Gamification Stats: Stars & Sound & Parent Lock */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Stars Pill */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-400/20 border-2 border-amber-400/50 text-amber-700 dark:text-amber-300 font-black text-xs shadow-xs"
              title="Tổng số sao đạt được"
            >
              <KidsStarIcon size={16} filled className="text-amber-500 fill-amber-500 animate-pulse" />
              <span>{progress.totalStars}</span>
            </div>

            {/* Level Pill */}
            <div
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-indigo-500/15 border-2 border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs"
              title="Cấp độ phiêu lưu"
            >
              <span>Lv.{progress.level}</span>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={handleToggleSound}
              className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition"
              title={soundOn ? 'Âm thanh: Đang bật' : 'Âm thanh: Đã tắt'}
            >
              {soundOn ? <KidsSoundOnIcon size={18} /> : <KidsSoundOffIcon size={18} />}
            </button>

            {/* Parent Area (Protected by Math Gate) */}
            <button
              onClick={() => handleOpenParentGate('/kids/parent')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs transition"
              title="Khu vực dành cho Phụ huynh"
            >
              <KidsParentIcon size={16} />
              <span className="hidden sm:inline text-[11px]">Bố Mẹ</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <Outlet />
      </main>

      {/* Mobile / Tablet Friendly Bottom Bar Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t-2 border-amber-200 dark:border-slate-800 px-3 py-2 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const isActive =
            item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
                isActive
                  ? 'bg-amber-400/30 text-amber-700 dark:text-amber-300 font-black scale-105'
                  : 'text-slate-400 dark:text-slate-500 font-semibold hover:text-slate-700'
              }`}
            >
              <item.icon size={22} />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

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
