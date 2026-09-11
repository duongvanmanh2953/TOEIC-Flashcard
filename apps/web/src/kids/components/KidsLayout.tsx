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
import { KidsHeaderStatCard } from './KidsHeaderStatCard';
import { Flame, Sparkles, Star, Volume2, VolumeX, ShieldCheck, BookOpen } from 'lucide-react';

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
    { to: '/kids/world', label: 'Hành Tinh', icon: KidsIslandIcon },
    { to: '/kids/flashcards', label: 'Thẻ Từ', icon: BookOpen },
  ];

  const isLessonMode = location.pathname.startsWith('/kids/lesson');

  return (
    <div className={`min-h-screen bg-[#FFFDF7] text-slate-800 font-sans select-none flex flex-col relative overflow-x-hidden ${isLessonMode ? 'pb-4' : 'pb-24 md:pb-8'}`}>
      {/* Subtle Background Layering & Playful Shapes */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute top-1/4 -right-24 w-80 h-80 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute bottom-10 -left-20 w-88 h-88 rounded-full bg-emerald-200/30 blur-3xl" />
      </div>

      {/* Top Header */}
      {!isLessonMode && (
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b-2 border-amber-200/80 px-4 sm:px-6 lg:px-8 py-2.5 shadow-xs">
          <div className="w-full max-w-[1440px] mx-auto flex items-center justify-between gap-3 sm:gap-6">
            {/* Logo & Brand */}
            <div
              onClick={() => navigate('/kids')}
              className="flex items-center gap-2.5 cursor-pointer hover:scale-105 transition-transform shrink-0"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-amber-950 border-2 border-white shadow-xs">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-black text-base sm:text-lg leading-none tracking-tight text-amber-950">
                  Bé Học Tiếng Anh
                </h1>
                <p className="text-[11px] font-extrabold text-emerald-600 mt-0.5">
                  Không gian học vui nhộn
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
                    className={`flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-2 rounded-2xl font-black text-xs lg:text-sm transition-all whitespace-nowrap min-h-[44px] ${
                      isActive
                        ? 'bg-amber-400 text-amber-950 scale-105 border-2 border-amber-500/40 shadow-xs'
                        : 'text-slate-700 hover:bg-amber-100/70 border-2 border-transparent'
                    }`}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Gamification Stats: All standardized with equal height and structure */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <KidsHeaderStatCard
                icon={Star}
                iconColor="text-amber-500 fill-amber-400"
                bgColor="bg-amber-50"
                borderColor="border-amber-300"
                value={progress.totalStars}
                label="Sao"
                title="Tổng số sao đạt được"
              />

              <div className="hidden sm:block">
                <KidsHeaderStatCard
                  icon={Flame}
                  iconColor="text-rose-600 fill-rose-500"
                  bgColor="bg-rose-50"
                  borderColor="border-rose-300"
                  value={progress.streakDays}
                  label="Ngày"
                  title="Chuỗi ngày học liên tiếp"
                />
              </div>

              <KidsHeaderStatCard
                icon={soundOn ? Volume2 : VolumeX}
                iconColor={soundOn ? 'text-sky-600' : 'text-slate-400'}
                bgColor="bg-slate-50 hover:bg-slate-100"
                borderColor="border-slate-300"
                label={soundOn ? 'Âm thanh' : 'Đã tắt'}
                onClick={handleToggleSound}
                title={soundOn ? 'Âm thanh: Đang bật' : 'Âm thanh: Đã tắt'}
              />

              <KidsHeaderStatCard
                icon={ShieldCheck}
                iconColor="text-purple-600"
                bgColor="bg-purple-50 hover:bg-purple-100"
                borderColor="border-purple-300"
                label="Bố Mẹ"
                onClick={() => handleOpenParentGate('/kids/parent')}
                title="Khu vực dành cho Phụ huynh"
              />
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative z-10">
        <Outlet />
      </main>

      {/* Mobile / Tablet Friendly Bottom Bar Navigation */}
      {!isLessonMode && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t-2 border-amber-200 px-3 py-2 flex items-center justify-around shadow-lg">
          {navItems.map((item) => {
            const isActive =
              item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all min-h-[48px] min-w-[48px] ${
                  isActive
                    ? 'bg-amber-400 text-amber-950 font-black scale-105 border border-amber-500/30'
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
