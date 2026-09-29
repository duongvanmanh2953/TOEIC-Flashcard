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
  Home,
  Headphones,
  ClipboardList,
  Layers,
  Users,
  Settings,
} from 'lucide-react';
import { ViviReadingCompanion } from '../assets/illustrations/KidsViviUniverse';

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
      label: 'Trang chủ',
      icon: Home,
      exact: true,
    },
    {
      to: '/kids/flashcards',
      label: 'Học từ vựng',
      icon: BookOpen,
    },
    {
      to: '/kids/world',
      label: 'Luyện nghe nói',
      icon: Headphones,
    },
    {
      to: '/kids/games',
      label: 'Luyện đề',
      icon: ClipboardList,
    },
    {
      to: '/kids/journey',
      label: 'Thư viện',
      icon: Layers,
    },
    {
      to: '/kids/parent',
      label: 'Cộng đồng',
      icon: Users,
    },
  ];

  const isLessonMode = location.pathname.startsWith('/kids/lesson');
  const isGamePlayingMode = location.pathname === '/kids/games' && new URLSearchParams(location.search).has('game');
  const isFocusMode = isLessonMode || isGamePlayingMode;

  const renderSidebarContent = (isDrawer: boolean) => (
    <div className="h-full flex flex-col justify-between overflow-hidden bg-white">
      {/* 1. Header: Brand Logo & Title */}
      <div className="p-4 sm:p-5 border-b border-sky-100/70 flex items-center justify-between bg-white shrink-0">
        <div
          onClick={() => {
            kidsSound.play('pop');
            navigate('/kids');
            if (isDrawer) setMobileMenuOpen(false);
          }}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-1 border border-amber-300 shadow-xs shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="text-2xl drop-shadow-xs">🦊</span>
          </div>
          <div>
            <h2 className="font-black text-xl leading-tight text-[#ea580c] tracking-tight">
              VocalFlow
            </h2>
            <p className="text-[11px] font-bold text-slate-500">
              Học tiếng Anh - Nói tự tin
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

      {/* 2. Middle Scrollable: Navigation Rail */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-2 scrollbar-none">
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
              className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl font-black text-sm transition-all cursor-pointer select-none min-h-[48px] ${
                isActive
                  ? 'bg-[#3C9FE8] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <ItemIcon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* 3. Bottom Companion Mascot: Fox with Headphones reading book */}
      <div className="p-4 border-t border-sky-100/70 bg-[#F7FBFF]/60 flex flex-col items-center justify-center space-y-2 shrink-0 select-none">
        <div className="relative flex flex-col items-center">
          {/* Speech Tag */}
          <div className="mb-1.5 px-3 py-1 rounded-2xl bg-white border border-rose-200 shadow-2xs text-[11px] font-black text-slate-800 text-center flex items-center gap-1">
            <span>Cố lên nhé, con làm được!</span>
            <span className="text-rose-500">❤️</span>
          </div>
          {/* Vector Reading Fox */}
          <ViviReadingCompanion className="w-32 h-32" />
        </div>

        <button
          type="button"
          onClick={() => {
            if (isDrawer) setMobileMenuOpen(false);
            handleOpenParentGate('/kids/parent');
          }}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer shadow-2xs active:scale-98"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
          <span>Khu vực phụ huynh</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className={`kids-layout min-h-screen min-h-[100dvh] bg-[#F7FBFF] text-slate-800 font-sans select-none flex flex-col relative overflow-x-hidden ${isFocusMode ? 'pb-4' : 'pb-24 lg:pb-6'}`}>
      {/* Subtle Background Layering & Playful Shapes */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-sky-100/40 blur-3xl" />
        <div className="absolute top-1/4 -right-24 w-80 h-80 rounded-full bg-indigo-50/50 blur-3xl" />
        <div className="absolute bottom-10 -left-20 w-88 h-88 rounded-full bg-emerald-50/50 blur-3xl" />
      </div>

      {/* ========================================================================= */}
      {/* 1. DESKTOP PERMANENT SIDEBAR (Pinned on lg screens, 1024px+)              */}
      {/* ========================================================================= */}
      {!isFocusMode && (
        <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 xl:w-72 z-40 bg-white/95 backdrop-blur-xl border-r border-sky-100 shadow-xs">
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
            className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 sm:w-80 max-w-[85vw] bg-white border-r border-sky-100 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
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
        {/* Top Header HUD (Pixel-perfect matching prototype) */}
        {!isFocusMode && (
          <header className="sticky top-0 z-30 bg-[#F7FBFF]/90 backdrop-blur-xl border-b border-sky-100/70 px-4 sm:px-6 lg:px-8 py-3 shadow-2xs">
            <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-3">
              {/* Left: Child Profile Greeting */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden h-10 w-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center shrink-0 cursor-pointer shadow-xs active:scale-95"
                  aria-label="Mở Menu Khám Phá"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <div className="relative">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 p-0.5 shadow-xs shrink-0 flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-lg sm:text-xl overflow-hidden">
                      👦
                    </div>
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                </div>

                <div>
                  <h1 className="text-base sm:text-lg font-black text-[#17345B] tracking-tight leading-tight">
                    Xin chào, Bé!
                  </h1>
                  <p className="text-xs font-semibold text-[#64748B] flex items-center gap-1">
                    <span>Hôm nay mình học thêm một chút nữa nhé!</span>
                    <span>🌞</span>
                  </p>
                </div>
              </div>

              {/* Right: Streak HUD + Settings Gear + Profile Circle */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Streak Pill */}
                <button
                  onClick={() => {
                    kidsSound.play('ding');
                    handleOpenParentGate('/kids/parent');
                  }}
                  className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white hover:bg-amber-50/70 border border-slate-200/90 text-xs font-black text-slate-800 shadow-2xs cursor-pointer transition-all active:scale-95"
                >
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
                  <span className="hidden sm:inline">Chuỗi học tập</span>
                  <span className="text-orange-600 font-black">{progress.streakDays || 12} ngày</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Settings Gear */}
                <button
                  onClick={() => handleOpenParentGate('/kids/parent')}
                  title="Cài đặt dành cho phụ huynh"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200/90 text-slate-600 flex items-center justify-center cursor-pointer shadow-2xs transition-all active:scale-95"
                >
                  <Settings className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </button>

                {/* Profile Circle Avatar */}
                <div
                  onClick={() => handleOpenParentGate('/kids/parent')}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 p-0.5 shadow-2xs cursor-pointer active:scale-95 flex items-center justify-center"
                >
                  <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center text-sm font-black text-sky-700">
                    Bé
                  </div>
                </div>
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
