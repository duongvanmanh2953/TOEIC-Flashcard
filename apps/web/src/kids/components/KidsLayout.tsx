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
      iconBg: 'bg-sky-100 text-sky-600',
      badge: 'Phiêu lưu',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      to: '/kids/journey',
      label: 'Vượt Núi',
      desc: 'Bản đồ leo núi 6 trạm',
      icon: Compass,
      iconBg: 'bg-emerald-100 text-emerald-600',
      badge: 'Bản đồ',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      to: '/kids/games',
      label: 'Phòng Trò Chơi',
      desc: '17 Mini-game kỳ thú',
      icon: KidsGameIcon,
      iconBg: 'bg-violet-100 text-violet-600',
      badge: '17 Games',
      badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
    },
    {
      to: '/kids/world',
      label: 'Đảo Của Bé',
      desc: 'Vườn từ & Trưng bày',
      icon: KidsIslandIcon,
      iconBg: 'bg-rose-100 text-rose-600',
      badge: 'Sưu tầm',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      to: '/kids/flashcards',
      label: 'Kho Từ Vựng',
      desc: 'Lật thẻ 3D & Từ vựng',
      icon: BookOpen,
      iconBg: 'bg-amber-100 text-amber-700',
      badge: '3D Flip',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    },
  ];

  const isLessonMode = location.pathname.startsWith('/kids/lesson');
  const isGamePlayingMode = location.pathname === '/kids/games' && new URLSearchParams(location.search).has('game');
  const isFocusMode = isLessonMode || isGamePlayingMode;

  const renderSidebarContent = (isDrawer: boolean) => (
    <div className="h-full flex flex-col justify-between overflow-hidden bg-white">
      {/* 1. Header: Brand Logo & Title */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
        <div
          onClick={() => {
            kidsSound.play('pop');
            navigate('/kids');
            if (isDrawer) setMobileMenuOpen(false);
          }}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 p-1.5 border border-sky-300 shadow-xs shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
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
              <span className="px-1.5 py-0.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                KIDS
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-500">
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
        <div className="p-3.5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 shadow-2xs flex items-center justify-center text-2xl shrink-0 animate-wiggle">
              🐻
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-slate-900 truncate">Bạn Gấu Bobby</p>
                <span className="text-[10px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200/70">
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
            <div className="flex items-center justify-center gap-1 py-1 px-2 rounded-xl bg-amber-50/80 border border-amber-200/70 shadow-2xs">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span className="text-xs font-black text-slate-900">{progress.totalStars || 0}</span>
              <span className="text-[10px] font-bold text-slate-600">Sao</span>
            </div>
            <div className="flex items-center justify-center gap-1 py-1 px-2 rounded-xl bg-rose-50/80 border border-rose-200/70 shadow-2xs">
              <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span className="text-xs font-black text-slate-900">{progress.streakDays || 1}</span>
              <span className="text-[10px] font-bold text-slate-600">Ngày</span>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-2 block mb-1">
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
                  ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-sm scale-101'
                  : 'text-slate-700 hover:bg-sky-50/70 hover:text-sky-900 border border-transparent'
                  }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform ${isActive
                    ? 'bg-white/25 text-white backdrop-blur-xs'
                    : item.iconBg
                    }`}
                >
                  <ItemIcon size={19} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-xs sm:text-sm font-black truncate leading-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>
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
                    className={`text-[10px] font-bold truncate mt-0.5 ${isActive ? 'text-white/90' : 'text-slate-500'}`}
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
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-sky-50/50 border border-indigo-150/80 text-left space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-indigo-950 flex items-center gap-1.5">
              <span>🎯 Nhiệm vụ hôm nay</span>
            </span>
            <span className="text-[10px] font-black text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200/80 shadow-2xs">
              +50 XP
            </span>
          </div>
          <p className="text-[11px] font-bold text-slate-700 leading-snug">
            Khám phá 5 từ mới trong Flashcard hoặc Game
          </p>
          <div className="w-full bg-indigo-100/80 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-sky-400 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: '60%' }}
            />
          </div>
        </div>
      </div>

      {/* 3. Bottom Actions: Parent Gate & Exit to Main App */}
      <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/70 space-y-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            if (isDrawer) setMobileMenuOpen(false);
            handleOpenParentGate('/kids/parent');
          }}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-black text-xs transition cursor-pointer min-h-[44px] shadow-xs active:scale-98"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="truncate">Khu Vực Phụ Huynh</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
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
    <div className={`kids-layout min-h-screen min-h-[100dvh] bg-[#F8FAFC] text-slate-800 font-sans select-none flex flex-col relative overflow-x-hidden ${isFocusMode ? 'pb-4' : 'pb-24 lg:pb-6'}`}>
      {/* Subtle Background Layering & Playful Shapes */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-sky-100/35 blur-3xl" />
        <div className="absolute top-1/4 -right-24 w-80 h-80 rounded-full bg-indigo-100/25 blur-3xl" />
        <div className="absolute bottom-10 -left-20 w-88 h-88 rounded-full bg-emerald-100/25 blur-3xl" />
      </div>

      {/* ========================================================================= */}
      {/* 1. DESKTOP PERMANENT SIDEBAR (Pinned on lg screens, 1024px+)              */}
      {/* ========================================================================= */}
      {!isFocusMode && (
        <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 xl:w-72 z-40 bg-white/95 backdrop-blur-xl border-r border-slate-200/80 shadow-xs">
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
              className="lg:hidden fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Drawer Panel */}
          <aside
            className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 sm:w-80 max-w-[85vw] bg-white border-r border-slate-200 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
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
          <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/70 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 shadow-xs">
            <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
              {/* Left: Mobile Drawer Trigger + Brand */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden h-10 sm:h-11 px-3 sm:px-3.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 shadow-xs transition-transform"
                  aria-label="Mở Menu Khám Phá"
                >
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Khám Phá</span>
                </button>

                <div
                  onClick={() => navigate('/kids')}
                  className="lg:hidden flex items-center gap-2 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-sky-100 p-1 border border-sky-200 flex items-center justify-center shrink-0">
                    <img
                      src="/vocabflow-logo-256.png"
                      alt="VocabFlow Kids"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="font-black text-sm text-slate-900 tracking-tight">
                    VocabFlow <span className="text-sky-600 text-xs font-black">KIDS</span>
                  </span>
                </div>

                <div className="hidden xl:flex items-center gap-2">
                  <span className="text-xs font-black text-sky-800 bg-sky-50 px-3 py-1 rounded-full border border-sky-150 shadow-2xs">
                    🌟 Khám phá tiếng Anh kỳ thú cùng Bobby
                  </span>
                </div>
              </div>

              {/* Right Stats Quick View & Sound Controller */}
              <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 shrink-0">
                <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 font-black text-xs sm:text-sm shadow-2xs">
                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-500" />
                  <span>{progress.totalStars || 0}</span>
                  <span className="text-[10px] text-amber-700 hidden xl:inline">Sao</span>
                </div>

                <div className="hidden sm:flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-900 font-black text-xs sm:text-sm shadow-2xs">
                  <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-rose-500 text-rose-500" />
                  <span>{progress.streakDays || 1}</span>
                  <span className="text-[10px] text-rose-700 hidden xl:inline">ngày</span>
                </div>

                {/* Unified Sound Controller */}
                <KidsSoundToggle variant="pill" className="shrink-0" />

                <button
                  type="button"
                  onClick={() => handleOpenParentGate('/kids/parent')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-black text-xs cursor-pointer active:scale-95 shadow-2xs"
                >
                  <ShieldCheck className="w-4 h-4 text-violet-600" />
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
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 px-2 py-1.5 shadow-lg">
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
                    ? 'bg-sky-500 text-white font-black scale-105 shadow-xs'
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
          <div className="kids-modal bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border-2 border-amber-400 shadow-2xl text-center space-y-4 animate-scale-up">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-2xl font-black shadow-inner">
              👶 🌟
            </div>
            <h3 className="text-xl font-black text-slate-950">
              Chương trình Kid Mode hiện tối ưu cho Tiếng Anh
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed flex items-center justify-center flex-wrap gap-1">
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
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
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
