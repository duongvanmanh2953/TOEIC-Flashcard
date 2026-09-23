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
import { voiceService } from '../services/voice/voiceService';
import { KidsParentPinModal } from './KidsParentPinModal';
import { KidsHeaderStatCard } from './KidsHeaderStatCard';
import { KidsSoundToggle } from './KidsSoundToggle';
import { useLearningContext } from '../../contexts/LearningContext';
import { isKidSupportedLanguage } from '../../config/languages';
import { CountryFlag } from '../../components/language/CountryFlag';
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
  Baby,
  Globe,
} from 'lucide-react';

export const KidsLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeLanguage, switchLanguage } = useLearningContext();
  const isSupported = isKidSupportedLanguage(activeLanguage);

  const [progress, setProgress] = useState<KidProgressState>(() =>
    curriculumProgress.getState()
  );
  const [soundOn, setSoundOn] = useState(() => kidsSound.isEnabled() || kidsAudioManager.isMusicEnabled());
  const [parentModalOpen, setParentModalOpen] = useState(false);
  const [pendingParentRoute, setPendingParentRoute] = useState<string>('/kids/parent');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Immediately cancel any previous page voice narration whenever route changes
  useEffect(() => {
    voiceService.stop();
  }, [location.pathname]);

  // Sync progress state
  useEffect(() => {
    if (curriculumProgress && typeof curriculumProgress.subscribe === 'function') {
      const unsub = curriculumProgress.subscribe((newState) => {
        setProgress(newState);
      });
      return () => unsub();
    }
  }, []);

  // Ensure global world ambient music starts softly on interaction if enabled
  useEffect(() => {
    kidsAudioManager.startWorldMusic('world');
    return () => {
      kidsAudioManager.stopAll();
      voiceService.stop();
    };
  }, []);

  // Update sound state from storage or listener
  useEffect(() => {
    const handleSoundToggle = () => {
      setSoundOn(kidsSound.isEnabled() || kidsAudioManager.isMusicEnabled());
    };
    window.addEventListener('storage', handleSoundToggle);
    return () => window.removeEventListener('storage', handleSoundToggle);
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
    kidsSound.play('pop');
    setPendingParentRoute(targetRoute);
    setParentModalOpen(true);
  };

  const handleParentVerified = () => {
    kidsSound.play('fanfare');
    setParentModalOpen(false);
    navigate(pendingParentRoute);
  };

  const navItems = [
    {
      to: '/kids',
      label: 'Trang Chủ',
      desc: 'Trung tâm phiêu lưu',
      icon: KidsHomeIcon,
      exact: true,
      activeGradient: 'bg-gradient-to-r from-amber-400 to-orange-400',
      activeBorder: 'border-b-4 border-amber-600',
      activeText: 'text-white',
      badge: 'Phiêu lưu',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      hoverClass: 'hover:bg-amber-50 hover:text-amber-950',
    },
    {
      to: '/kids/journey',
      label: 'Vượt Núi',
      desc: 'Bản đồ leo núi 6 trạm',
      icon: Compass,
      activeGradient: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      activeBorder: 'border-b-4 border-emerald-700',
      activeText: 'text-white',
      badge: 'Bản đồ',
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      hoverClass: 'hover:bg-emerald-50 hover:text-emerald-950',
    },
    {
      to: '/kids/games',
      label: 'Phòng Trò Chơi',
      desc: '17 Mini-game kỳ thú',
      icon: KidsGameIcon,
      activeGradient: 'bg-gradient-to-r from-indigo-500 to-purple-600',
      activeBorder: 'border-b-4 border-indigo-700',
      activeText: 'text-white',
      badge: '17 Games',
      badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
      hoverClass: 'hover:bg-indigo-50 hover:text-indigo-950',
    },
    {
      to: '/kids/world',
      label: 'Đảo Của Bé',
      desc: 'Vườn từ & Trưng bày',
      icon: KidsIslandIcon,
      activeGradient: 'bg-gradient-to-r from-rose-500 to-pink-500',
      activeBorder: 'border-b-4 border-rose-700',
      activeText: 'text-white',
      badge: 'Sưu tầm',
      badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
      hoverClass: 'hover:bg-rose-50 hover:text-rose-950',
    },
    {
      to: '/kids/flashcards',
      label: 'Kho Từ Vựng',
      desc: 'Lật thẻ 3D & Từ vựng',
      icon: BookOpen,
      activeGradient: 'bg-gradient-to-r from-sky-500 to-blue-600',
      activeBorder: 'border-b-4 border-sky-700',
      activeText: 'text-white',
      badge: '3D Flip',
      badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
      hoverClass: 'hover:bg-sky-50 hover:text-sky-950',
    },
  ];

  const isLessonMode = location.pathname.startsWith('/kids/lesson');
  const isGamePlayingMode = location.pathname === '/kids/games' && new URLSearchParams(location.search).has('game');
  const isFocusMode = isLessonMode || isGamePlayingMode;

  const renderSidebarContent = (isDrawer: boolean) => (
    <div className="h-full flex flex-col justify-between overflow-hidden">
      {/* 1. Header: Brand Logo & Title */}
      <div className="p-4 sm:p-5 border-b-2 border-amber-100/90 flex items-center justify-between bg-gradient-to-r from-amber-50/60 to-orange-50/60 shrink-0">
        <div
          onClick={() => {
            kidsSound.play('pop');
            navigate('/kids');
            if (isDrawer) setMobileMenuOpen(false);
          }}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 p-1.5 border-2 border-amber-300 shadow-xs shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
            <img
              src="/vocabflow-logo-256.png"
              alt="VocabFlow Kids"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-black text-base leading-tight text-slate-950 tracking-tight">
                VocabFlow
              </h2>
              <span className="px-1.5 py-0.5 rounded-lg bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs animate-pulse">
                KIDS
              </span>
            </div>
            <p className="text-[11px] font-bold text-amber-900/80">
              Vũ trụ học tiếng Anh
            </p>
          </div>
        </div>

        {isDrawer && (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition-colors shadow-xs"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. Middle Scrollable: Companion Card + Navigation + Daily Mission */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 scrollbar-none">
        {/* Companion Card (Bạn Gấu Bobby) */}
        <div className="p-3.5 rounded-3xl bg-gradient-to-br from-amber-100/70 via-amber-50 to-orange-50 border-2 border-amber-300/80 shadow-xs space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white border-2 border-amber-300 shadow-xs flex items-center justify-center text-2xl shrink-0 animate-wiggle">
              🐻
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-slate-900 truncate">Bạn Gấu Bobby</p>
                <span className="text-[10px] font-black text-amber-900 bg-amber-200/90 px-2 py-0.5 rounded-full">
                  Cấp 1
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-600 truncate mt-0.5">
                Cùng bé thám hiểm mỗi ngày!
              </p>
            </div>
          </div>

          {/* Quick Badges in Card */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <div className="flex items-center justify-center gap-1 py-1 px-2 rounded-xl bg-white/90 border border-amber-200 shadow-2xs">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span className="text-xs font-black text-slate-900">{progress.totalStars || 0}</span>
              <span className="text-[10px] font-bold text-slate-700">Sao</span>
            </div>
            <div className="flex items-center justify-center gap-1 py-1 px-2 rounded-xl bg-white/90 border border-rose-200 shadow-2xs">
              <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span className="text-xs font-black text-slate-900">{progress.streakDays || 1}</span>
              <span className="text-[10px] font-bold text-slate-700">Ngày</span>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 px-2 block mb-1">
            Khu vực khám phá
          </span>

          {navItems.map((item) => {
            const isActive =
              item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);

            const ItemIcon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  kidsSound.play('pop');
                  if (isDrawer) setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-black transition-all cursor-pointer select-none min-h-[50px] ${isActive
                  ? `${item.activeGradient} ${item.activeText} ${item.activeBorder} shadow-md scale-102`
                  : `text-slate-700 ${item.hoverClass} border border-transparent`
                  }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform ${isActive
                    ? 'bg-white/20 text-white backdrop-blur-xs'
                    : 'bg-slate-100 text-slate-600'
                    }`}
                >
                  <ItemIcon size={19} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs sm:text-sm font-black truncate leading-tight">
                      {item.label}
                    </p>
                    {item.badge && !isActive && (
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${item.badgeClass} shrink-0`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[10px] font-bold truncate mt-0.5 ${isActive ? 'text-white' : 'text-slate-600'
                      }`}
                  >
                    {item.desc}
                  </p>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-white shrink-0" />}
              </NavLink>
            );
          })}
        </div>

        {/* Daily Quest Mini-Card */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-pink-50/60 border-2 border-indigo-200/80 text-left space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-indigo-950 flex items-center gap-1.5">
              <span>🎯 Nhiệm vụ hôm nay</span>
            </span>
            <span className="text-[10px] font-extrabold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
              +50 XP
            </span>
          </div>
          <p className="text-[11px] font-bold text-slate-600 leading-snug">
            Khám phá 5 từ mới trong Flashcard hoặc Game
          </p>
          <div className="w-full bg-indigo-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full rounded-full transition-all duration-500"
              style={{ width: '60%' }}
            />
          </div>
        </div>
      </div>

      {/* 3. Bottom Actions: Parent Gate & Exit to Main App */}
      <div className="p-3.5 sm:p-4 border-t-2 border-amber-100 bg-slate-50/90 space-y-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            if (isDrawer) setMobileMenuOpen(false);
            handleOpenParentGate('/kids/parent');
          }}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-950 font-black text-xs transition cursor-pointer min-h-[44px] shadow-xs active:scale-98"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-purple-200/80 flex items-center justify-center text-purple-900 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="truncate">Khu Vực Phụ Huynh</span>
          </div>
          <ChevronRight className="w-4 h-4 text-purple-600 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => {
            if (isDrawer) setMobileMenuOpen(false);
            kidsAudioManager.stopAll();
            voiceService.stop();
            navigate('/dashboard');
          }}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-slate-500 hover:text-slate-800 text-[11px] font-bold transition cursor-pointer"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Trở về ứng dụng TOEIC</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen min-h-[100dvh] bg-[#FFFDF7] text-slate-800 font-sans select-none flex flex-col relative overflow-x-hidden ${isFocusMode ? 'pb-4' : 'pb-24 lg:pb-6'}`}>
      {/* Subtle Background Layering & Playful Shapes */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute top-1/4 -right-24 w-80 h-80 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute bottom-10 -left-20 w-88 h-88 rounded-full bg-emerald-200/30 blur-3xl" />
      </div>

      {/* ========================================================================= */}
      {/* 1. DESKTOP PERMANENT SIDEBAR (Pinned on lg screens, 1024px+)              */}
      {/* ========================================================================= */}
      {!isFocusMode && (
        <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 xl:w-72 z-40 bg-white/95 backdrop-blur-xl border-r-2 border-amber-200/80 shadow-xs">
          {renderSidebarContent(false)}
        </aside>
      )}

      {/* ========================================================================= */}
      {/* 2. MOBILE / TABLET SLIDE-IN DRAWER (<lg screens)                          */}
      {/* ========================================================================= */}
      {!isFocusMode && (
        <>
          {/* Overlay Backdrop */}
          {mobileMenuOpen && (
            <div
              className="lg:hidden fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Drawer Panel */}
          <aside
            className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 sm:w-80 max-w-[85vw] bg-white border-r-2 border-amber-200/80 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
          >
            {renderSidebarContent(true)}
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
      {/* 3. MAIN CONTENT AREA (Offset by sidebar width on desktop)                 */}
      {/* ========================================================================= */}
      <div className={`flex-1 flex flex-col min-w-0 ${!isFocusMode ? 'lg:pl-64 xl:pl-72' : ''}`}>
        {/* Top Header */}
        {!isFocusMode && (
          <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b-2 border-slate-200 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
            <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
              {/* Left: Mobile Drawer Trigger + Brand */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden h-10 sm:h-11 px-3 sm:px-3.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs sm:text-sm border-2 border-amber-500 flex items-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 shadow-xs transition-transform"
                  aria-label="Mở Menu Khám Phá"
                >
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Khám Phá</span>
                </button>

                <div
                  onClick={() => navigate('/kids')}
                  className="lg:hidden flex items-center gap-2 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-100 p-1 border border-amber-300 flex items-center justify-center shrink-0">
                    <img
                      src="/vocabflow-logo-256.png"
                      alt="VocabFlow Kids"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="font-black text-sm text-slate-900 tracking-tight">
                    VocabFlow <span className="text-rose-600 text-xs">KIDS</span>
                  </span>
                </div>

                <div className="hidden xl:flex items-center gap-2">
                  <span className="text-xs font-black text-amber-900/80 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 shadow-2xs">
                    🌟 Khám phá tiếng Anh kỳ thú cùng Bobby
                  </span>
                </div>
              </div>

              {/* Right Stats Quick View & Sound Controller */}
              <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 shrink-0">
                <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 font-black text-xs sm:text-sm shadow-xs">
                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-500" />
                  <span>{progress.totalStars || 0}</span>
                  <span className="text-[10px] text-amber-800 hidden xl:inline">Sao</span>
                </div>

                <div className="hidden sm:flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 font-black text-xs sm:text-sm">
                  <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-rose-500 text-rose-500" />
                  <span>{progress.streakDays || 1}</span>
                  <span className="text-[10px] text-rose-700 hidden xl:inline">ngày</span>
                </div>

                {/* Unified Sound Controller */}
                <KidsSoundToggle variant="pill" className="shrink-0" />

                <button
                  type="button"
                  onClick={() => handleOpenParentGate('/kids/parent')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-900 font-black text-xs cursor-pointer active:scale-95 shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  <span>Bố Mẹ</span>
                </button>
              </div>
            </div>
          </header>
        )}

        {/* Main Content Body */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 lg:pb-8 relative z-10">
          <Outlet />
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. TABLET & MOBILE BOTTOM NAVIGATION (Quick shortcuts)                    */}
      {/* ========================================================================= */}
      {!isFocusMode && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t-2 border-slate-200 px-2 py-1.5 shadow-lg">
          <div className="w-full max-w-md sm:max-w-xl mx-auto flex items-center justify-around">
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
          </div>
        </nav>
      )}

      {/* Parent Pin Verification Gate */}
      <KidsParentPinModal
        isOpen={parentModalOpen}
        onClose={() => setParentModalOpen(false)}
        onSuccess={handleParentVerified}
      />

      {/* Unsupported Language Switch Prompt Overlay */}
      {!isSupported && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border-2 border-amber-400 shadow-2xl text-center space-y-4 animate-scale-up">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto text-2xl font-black shadow-inner">
              👶 🌟
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Chương trình Kid Mode hiện tối ưu cho Tiếng Anh
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex items-center justify-center flex-wrap gap-1">
              <span>Bạn đang chọn không gian ngôn ngữ</span>
              <strong className="flex items-center gap-1">
                {activeLanguage.name} <CountryFlag languageId={activeLanguage.id} countryCode={activeLanguage.countryCode} size="xs" />
              </strong>.
              <span>Vui lòng chuyển sang</span>
              <strong className="flex items-center gap-1">
                Tiếng Anh <CountryFlag languageId="en" countryCode="GB" size="xs" />
              </strong>
              <span>để đồng hành cùng bé trong thế giới trò chơi tương tác!</span>
            </p>
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => switchLanguage('en')}
                className="w-full py-3 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs sm:text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Globe className="w-4 h-4" />
                <span>Chuyển sang Tiếng Anh & Bắt đầu</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Quay lại Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KidsLayout;
