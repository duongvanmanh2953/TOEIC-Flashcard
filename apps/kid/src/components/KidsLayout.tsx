import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { curriculumProgress, KidProgressState } from '../curriculum/curriculumProgress';
import { kidsSound } from '../services/sound/KidsSoundManager';
import { kidsAudioManager } from '../services/audio/KidsAudioManager';
import { voiceService } from '../services/voice/voiceService';
import { KidsSoundToggle } from './KidsSoundToggle';
import { useLearningContext } from '../contexts/LearningContext';
import { isKidSupportedLanguage } from '../config/languages';
import { CountryFlag } from './language/CountryFlag';
import { kidAsset } from '../utils/kidAsset';

// Sunny Meadow V2.0 Core Architecture (KidRequired.md Spec)
import SunnyMeadowSvgVault from '../assets/illustrations/SunnyMeadowSvgVault';
import SleepyFoxCurtain from './SleepyFoxCurtain';
import eyeCareGuard from '../core/eyeCareGuard';
import ParentalMathGateModal from './ParentalMathGateModal';
import StickerBookModal from './StickerBookModal';
import meadowStore, { MeadowState } from '../core/meadowStateStore';
import MeadowAudioEngine from '../services/audio/MeadowAudioEngine';
import { SunnySoundFX } from '../services/audio/SunnySoundFX';
import { BilingualVoiceEngine } from '../services/audio/BilingualVoiceEngine';

import {
  Flame,
  Star,
  ShieldCheck,
  BookOpen,
  Menu,
  X,
  ChevronRight,
  Smile,
  Globe,
  Home,
  Headphones,
  ClipboardList,
  Layers,
  Users,
  Settings,
  GraduationCap,
  LogOut,
  Sun,
  Eye,
} from 'lucide-react';

export const KidsLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeLanguage, switchLanguage } = useLearningContext();
  const isSupported = isKidSupportedLanguage(activeLanguage);

  const [progress, setProgress] = useState<KidProgressState>(() =>
    curriculumProgress.getState()
  );
  const [meadowState, setMeadowState] = useState<MeadowState>(() =>
    meadowStore.getState()
  );
  const [soundOn, setSoundOn] = useState(() => kidsSound.isEnabled() || kidsAudioManager.isMusicEnabled());
  const [parentModalOpen, setParentModalOpen] = useState(false);
  const [pendingParentRoute, setPendingParentRoute] = useState<string>('/kids/parent');
  const [parentModalTitle, setParentModalTitle] = useState<string>('Khu Vực Phụ Huynh');
  const [parentModalDesc, setParentModalDesc] = useState<string>('Vui lòng giải phép tính nhanh bên dưới để xác thực người lớn:');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sleepyCurtainOpen, setSleepyCurtainOpen] = useState(false);
  const [stickerModalOpen, setStickerModalOpen] = useState(false);
  const [bgmActive, setBgmActive] = useState(false);

  const handleToggleBgm = () => {
    const active = SunnySoundFX.toggleAmbientBGM();
    setBgmActive(active);
  };

  // Immediately cancel any previous page voice narration whenever route changes
  useEffect(() => {
    voiceService.stop();
    MeadowAudioEngine.cancelSpeech();
  }, [location.pathname]);

  // Sync curriculum progress & meadow store
  useEffect(() => {
    if (curriculumProgress && typeof curriculumProgress.subscribe === 'function') {
      const unsub = curriculumProgress.subscribe((newState) => {
        setProgress(newState);
      });
      return () => unsub();
    }
  }, []);

  useEffect(() => {
    const unsub = meadowStore.subscribe((s) => setMeadowState(s));
    return () => unsub();
  }, []);

  // Hook 20-20-20 Sleepy Fox Curtain
  useEffect(() => {
    const unsub = eyeCareGuard.onRestRequired(() => {
      setSleepyCurtainOpen(true);
    });
    return () => unsub();
  }, []);

  // Scroll to top and close mobile menu on route change
  useEffect(() => {
    window.scrollTo(0, 0);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleOpenParentGate = (targetRoute: string, customTitle?: string, customDesc?: string) => {
    MeadowAudioEngine.playWoodTap('D4');
    setPendingParentRoute(targetRoute);
    setParentModalTitle(customTitle || (targetRoute.includes('dashboard') ? 'Trở Về Màn Học Viên' : 'Khu Vực Phụ Huynh'));
    setParentModalDesc(customDesc || 'Vui lòng giải phép tính nhanh bên dưới để xác thực người lớn:');
    setParentModalOpen(true);
  };

  const handleParentVerified = () => {
    MeadowAudioEngine.playMagicalSuccess();
    setParentModalOpen(false);
    if (pendingParentRoute.startsWith('http://') || pendingParentRoute.startsWith('https://')) {
      window.location.href = pendingParentRoute;
    } else {
      navigate(pendingParentRoute);
    }
  };

  const navItems = [
    {
      to: '/',
      label: 'Đồng cỏ xanh',
      icon: Home,
      exact: true,
    },
    {
      to: '/games',
      label: '5 Trò chơi sinh thái',
      icon: ClipboardList,
    },
    {
      to: '/flashcards',
      label: 'Học từ vựng',
      icon: BookOpen,
    },
    {
      to: '/world',
      label: 'Luyện nghe nói',
      icon: Headphones,
    },
    {
      to: '/journey',
      label: 'Thư viện bài học',
      icon: Layers,
    },
    {
      to: '/parent',
      label: 'Khu vực phụ huynh',
      icon: Users,
    },
  ];

  const isLessonMode = location.pathname.includes('/lesson');
  const isGamePlayingMode = location.pathname.includes('/games') && new URLSearchParams(location.search).has('game');
  const isFlashcardsMode =
    location.pathname.includes('/flashcards') ||
    location.pathname.includes('/vocabulary');
  const isFocusMode = isLessonMode || isGamePlayingMode || isFlashcardsMode;

  const renderSidebarContent = (isDrawer: boolean) => (
    <div className="h-full flex flex-col justify-between overflow-hidden bg-[#FFFDF5]">
      {/* 1. Header: Brand Logo & Title */}
      <div className="p-4 sm:p-5 border-b border-amber-200/60 flex items-center justify-between bg-white shrink-0">
        <div
          onClick={() => {
            MeadowAudioEngine.playWoodTap('G5');
            navigate('/');
            if (isDrawer) setMobileMenuOpen(false);
          }}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 p-1 border-2 border-amber-300 shadow-2xs shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
            <svg className="w-full h-full drop-shadow-xs">
              <use href="#svg-sunny-fox"></use>
            </svg>
          </div>
          <div>
            <h2 className="font-extrabold text-xl leading-tight text-[#1E293B] font-display tracking-tight">
              Sunny Meadow
            </h2>
            <p className="text-[11px] font-bold text-emerald-700 font-body">
              Khu rừng tiếng Anh V2.0
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
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-1.5 scrollbar-none">
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
                MeadowAudioEngine.playWoodTap('C5');
                if (isDrawer) setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-display font-extrabold text-sm transition-all duration-300 cursor-pointer select-none min-h-[48px] ${
                isActive
                  ? 'bg-amber-100/90 text-amber-950 shadow-xs border-2 border-amber-300 transform translate-x-1'
                  : 'bg-transparent text-slate-700 hover:bg-amber-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  isActive ? 'bg-amber-400 text-amber-950 shadow-2xs' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              >
                <ItemIcon className="w-4 h-4" />
              </div>
              <span className="truncate">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </NavLink>
          );
        })}
      </div>

      {/* 3. Bottom Companion Mascot: Sunny Fox with Sticker Book shortcut */}
      <div className="p-4 border-t border-amber-200/60 bg-[#FFFDF5] flex flex-col items-center justify-center space-y-2.5 shrink-0 select-none">
        {/* Sticker Book Button */}
        <button
          type="button"
          onClick={() => {
            if (isDrawer) setMobileMenuOpen(false);
            MeadowAudioEngine.playWoodTap('C5');
            setStickerModalOpen(true);
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-extrabold text-xs transition cursor-pointer shadow-2xs active:scale-98 font-display"
        >
          <span>📖 Sổ Nhãn Dán ({meadowState.stickers.length}/12)</span>
        </button>

        {/* Parental Area */}
        <button
          type="button"
          onClick={() => {
            if (isDrawer) setMobileMenuOpen(false);
            handleOpenParentGate('/parent');
          }}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer shadow-2xs active:scale-98 font-body"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
          <span>Khu vực phụ huynh</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (isDrawer) setMobileMenuOpen(false);
            handleOpenParentGate(
              'https://app.vocalflow.site/dashboard',
              'Trở Về Màn Học Viên',
              'Vui lòng giải phép tính nhanh bên dưới để xác thực và trở về giao diện người lớn.'
            );
          }}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 font-bold text-xs transition cursor-pointer shadow-2xs active:scale-98 font-body"
          title="Thoát chế độ bé & trở về màn học viên"
        >
          <GraduationCap className="w-3.5 h-3.5 text-rose-600" />
          <span>Về màn học viên</span>
        </button>
      </div>
    </div>
  );

  return (
    <div
      className={`kids-layout ${
        isFocusMode
          ? 'h-screen h-[100dvh] max-h-[100dvh] w-screen max-w-full overflow-hidden p-0 m-0'
          : 'min-h-screen min-h-[100dvh] pb-24 lg:pb-6 overflow-x-hidden'
      } bg-[#FFFDF5] text-[#1E293B] font-body select-none flex flex-col relative`}
    >
      {/* 0. Centralized Single SVG Sprite Vault (Directive 5) */}
      <SunnyMeadowSvgVault />

      {/* Global Background (Soft Meadow Pastel Gradient) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-[#D8F3FF] via-[#FFFDF5] to-[#80ED99]/30" />

      {/* 1. Desktop Permanent Sidebar */}
      {!isFocusMode && (
        <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 xl:w-72 z-40 bg-[#FFFDF5] border-r border-amber-200/70 shadow-xs">
          {renderSidebarContent(false)}
        </aside>
      )}

      {/* 2. Mobile Drawer */}
      {!isFocusMode && (
        <>
          {mobileMenuOpen && (
            <div
              className="lg:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          <aside
            className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 sm:w-80 max-w-[85vw] bg-[#FFFDF5] border-r border-amber-200/70 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-out ${
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {renderSidebarContent(true)}
          </aside>
        </>
      )}

      {/* Focus Mode floating controls */}
      {isFocusMode && (
        <div className="fixed top-3.5 right-3.5 z-50 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              MeadowAudioEngine.playWoodTap('C5');
              meadowStore.toggleEyeCare();
            }}
            title="Bảo vệ thị giác (Bộ lọc ấm dịu mắt)"
            className={`p-2 rounded-2xl border-2 transition-all cursor-pointer shadow-sm ${
              meadowState.eyeCareActive
                ? 'bg-amber-400 text-amber-950 border-amber-500'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <Eye className="w-5 h-5" />
          </button>
          <KidsSoundToggle variant="compact" />
        </div>
      )}

      {/* 3. Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${!isFocusMode ? 'lg:pl-64 xl:pl-72' : 'h-screen h-[100dvh] max-h-[100dvh] overflow-hidden'}`}>
        {/* Top Header HUD */}
        {!isFocusMode && (
          <header className="sticky top-0 z-30 bg-[#FFFDF5]/90 backdrop-blur-xl border-b border-amber-200/70 px-4 sm:px-6 lg:px-8 py-3 shadow-2xs">
            <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-3">
              {/* Left: Greeting */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden h-10 w-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 cursor-pointer shadow-xs active:scale-95"
                  aria-label="Mở Menu"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <div
                  onClick={() => {
                    MeadowAudioEngine.playWoodTap('G5');
                    MeadowAudioEngine.speak('Hello! Sunny the Fox is happy to see you!');
                  }}
                  className="w-11 h-11 rounded-2xl bg-amber-100 border-2 border-amber-300 p-0.5 shadow-2xs shrink-0 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                >
                  <svg className="w-full h-full drop-shadow-xs">
                    <use href="#svg-sunny-fox"></use>
                  </svg>
                </div>

                <div>
                  <h1 className="text-base sm:text-lg font-extrabold text-[#1E293B] font-display tracking-tight leading-tight">
                    Xin chào, Nhà Thám Hiểm Nhí!
                  </h1>
                  <p className="text-xs font-semibold text-[#475569] flex items-center gap-1 font-body">
                    <span>Hôm nay chúng mình cùng khám phá đồng cỏ nhé!</span>
                    <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-400 inline shrink-0" />
                  </p>
                </div>
              </div>

              {/* Right: Controls & Badges */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Eye-Care Warm Amber Filter Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    MeadowAudioEngine.playWoodTap('C5');
                    meadowStore.toggleEyeCare();
                  }}
                  title={meadowState.eyeCareActive ? 'Tắt bộ lọc dịu mắt' : 'Bật bộ lọc dịu mắt (Bảo vệ thị giác)'}
                  className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full border-2 text-xs font-extrabold font-display transition-all cursor-pointer active:scale-95 ${
                    meadowState.eyeCareActive
                      ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-xs'
                      : 'bg-white hover:bg-amber-50 text-slate-700 border-amber-200 shadow-2xs'
                  }`}
                >
                  <Eye className="w-4 h-4 text-amber-800" />
                  <span className="hidden sm:inline">Dịu mắt</span>
                </button>

                {/* Kalimba Ambient BGM Toggle */}
                <button
                  type="button"
                  onClick={handleToggleBgm}
                  title={bgmActive ? 'Tắt nhạc nền Kalimba' : 'Bật nhạc nền Kalimba thiên nhiên êm dịu'}
                  className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full border-2 text-xs font-extrabold font-display transition-all cursor-pointer active:scale-95 ${
                    bgmActive
                      ? 'bg-emerald-400 text-emerald-950 border-emerald-500 shadow-xs'
                      : 'bg-white hover:bg-emerald-50 text-slate-700 border-emerald-200 shadow-2xs'
                  }`}
                >
                  <span className="text-sm">🎵</span>
                  <span className="hidden sm:inline">{bgmActive ? 'Kalimba: Bật' : 'Nhạc nền'}</span>
                </button>

                {/* Stars HUD */}
                <div
                  onClick={() => {
                    SunnySoundFX.playButtonClick();
                    setStickerModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white border-2 border-amber-300 text-xs font-extrabold text-amber-950 font-display shadow-2xs cursor-pointer hover:bg-amber-50 active:scale-95"
                >
                  <svg className="w-4 h-4"><use href="#svg-star-gold"></use></svg>
                  <span>{meadowState.totalStars} Sao</span>
                </div>

                {/* Streak HUD */}
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-full bg-white border-2 border-rose-200 text-xs font-extrabold text-rose-900 font-display shadow-2xs">
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
                  <span>{progress.streakDays || 3} ngày</span>
                </div>

                {/* Return to Learner */}
                <button
                  type="button"
                  onClick={() =>
                    handleOpenParentGate(
                      'https://app.vocalflow.site/dashboard',
                      'Trở Về Màn Học Viên',
                      'Vui lòng giải phép tính nhanh bên dưới để xác thực và trở về giao diện người lớn.'
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-white hover:bg-rose-50 border border-slate-200 text-xs font-extrabold text-slate-700 hover:text-rose-600 shadow-2xs cursor-pointer transition-all active:scale-95 font-body"
                  title="Thoát chế độ bé & trở về màn học viên"
                >
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline">Về màn học viên</span>
                  <LogOut className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          </header>
        )}

        {/* Main Content Body */}
        <main
          className={`flex-1 w-full flex flex-col relative z-10 ${
            isFocusMode
              ? 'h-full max-h-[100dvh] overflow-hidden p-0 m-0'
              : 'h-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 lg:pb-8'
          }`}
        >
          <Outlet />
        </main>
      </div>

      {/* Tablet & Mobile Bottom Navigation */}
      {!isFocusMode && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFDF5]/95 backdrop-blur-xl border-t border-amber-200 px-2 py-1.5 shadow-lg">
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
                  className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all duration-300 min-h-[48px] min-w-[56px] font-display ${
                    isActive
                      ? 'bg-amber-200 text-amber-950 font-extrabold shadow-xs border-2 border-amber-300 -translate-y-0.5'
                      : 'bg-transparent text-slate-600 font-bold hover:text-slate-900 border-transparent'
                  }`}
                >
                  <item.icon size={20} className={isActive ? 'text-amber-800' : 'text-slate-500'} />
                  <span className="text-[10px] mt-0.5 leading-tight">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      )}

      {/* Parental Math Gate (Directive 7 & Child Guardrails) */}
      <ParentalMathGateModal
        isOpen={parentModalOpen}
        onClose={() => setParentModalOpen(false)}
        onSuccess={handleParentVerified}
        title={parentModalTitle}
        description={parentModalDesc}
      />

      {/* 20-20-20 Sleepy Fox Curtain (Directive 2.4) */}
      <SleepyFoxCurtain
        isOpen={sleepyCurtainOpen}
        onDismiss={() => setSleepyCurtainOpen(false)}
      />

      {/* Sticker Album Modal */}
      <StickerBookModal
        isOpen={stickerModalOpen}
        onClose={() => setStickerModalOpen(false)}
      />

      {/* Unsupported Language Switch Prompt Overlay */}
      {!isSupported && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="meadow-clay-card bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border-4 border-amber-400 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-2xl font-black shadow-inner">
              👶 🌟
            </div>
            <h3 className="text-xl font-extrabold text-[#1E293B] font-display">
              Chương trình Sunny Meadow hiện tối ưu cho Tiếng Anh
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed font-body">
              Vui lòng chuyển sang <strong>Tiếng Anh</strong> để cùng Cáo Sunny bước vào 5 trò chơi sinh thái tương tác!
            </p>
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => switchLanguage('en')}
                className="toy-btn toy-btn-green w-full !min-h-[50px] text-sm"
              >
                <Globe className="w-4 h-4" />
                <span>Chuyển sang Tiếng Anh & Bắt đầu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KidsLayout;
