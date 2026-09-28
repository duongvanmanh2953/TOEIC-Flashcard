import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n';
import { useLearningContext } from '../contexts/LearningContext';
import { getLanguage } from '../config/languages';
import { AddLanguageModal } from '../components/language/AddLanguageModal';
import { ResetLanguageModal } from '../components/language/ResetLanguageModal';
import { GlassCard } from '../components/common/GlassCard';
import { CountryFlag } from '../components/language/CountryFlag';
import { ModalPortal } from '../components/common/ModalPortal';
import { CustomDropdown } from '../components/common/CustomDropdown';
import { ToggleSwitch } from '../components/common/ToggleSwitch';
import {
  Globe,
  Sun,
  Moon,
  Laptop,
  Palette,
  Volume2,
  Sliders,
  Target,
  Database,
  Check,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Sparkles,
  CheckCircle2,
  Eye,
  ImageIcon,
  FastForward,
  BookOpen,
  Shield,
  Download,
  Smartphone,
  Key,
  LogOut,
  ExternalLink,
  MessageCircle,
  Layers,
  LayoutGrid,
  Flame,
  Plus,
  Lock,
  RefreshCw,
  X,
  Mail,
  ShieldAlert,
  Monitor,
  Loader2,
} from 'lucide-react';
import api from '../lib/api';

export const SettingsPage: React.FC = () => {
  const { user, theme, toggleTheme } = useAuth();
  const { locale, setLocale, t } = useTranslation();
  const {
    activeLanguage,
    activeProfile,
    userLanguages,
    learningProfiles,
    switchLanguage,
  } = useLearningContext();

  // Navigation Sub-tabs for space optimization & scientific categorization
  const [activeTab, setActiveTab] = useState<'all' | 'languages' | 'appearance' | 'audio_study' | 'security' | 'data'>('all');
  const [showAddLanguageModal, setShowAddLanguageModal] = useState(false);
  const [showResetLanguageModal, setShowResetLanguageModal] = useState(false);

  // Multi-Language Pronunciation & Script preferences
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>(() => {
    return (localStorage.getItem('vocabflow_voice_gender') as 'female' | 'male') || 'female';
  });
  const [showScriptAids, setShowScriptAids] = useState<boolean>(() => {
    return localStorage.getItem('vocabflow_show_script_aids') !== 'false';
  });

  // 1. Giao diện settings
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>(() => {
    return (
      (localStorage.getItem('vocabflow_theme_mode') as any) ||
      (localStorage.getItem('vocabflow_theme_mode') as any) ||
      theme ||
      'system'
    );
  });

  const [accentColor, setAccentColor] = useState<'violet' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate'>(() => {
    return (
      (localStorage.getItem('vocabflow_accent') as any) ||
      (localStorage.getItem('vocabflow_accent') as any) ||
      'violet'
    );
  });

  // 2. Phiên âm & Giọng đọc
  const [showPhonetic, setShowPhonetic] = useState<boolean>(() => {
    return (
      (localStorage.getItem('vocabflow_show_phonetic') || localStorage.getItem('vocabflow_show_phonetic')) !== 'false'
    );
  });

  const [voiceAccent, setVoiceAccent] = useState<'en-US' | 'en-GB' | 'en-AU'>(() => {
    return (
      (localStorage.getItem('vocabflow_voice') as any) ||
      (localStorage.getItem('vocabflow_voice') as any) ||
      'en-US'
    );
  });

  const [voiceSpeed, setVoiceSpeed] = useState<number>(() => {
    return parseFloat(
      localStorage.getItem('vocabflow_voice_speed') || localStorage.getItem('vocabflow_voice_speed') || '1.0'
    );
  });

  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(() => {
    return (
      (localStorage.getItem('vocabflow_auto_audio') || localStorage.getItem('vocabflow_auto_audio')) === 'true'
    );
  });

  // 3. Tùy chọn học
  const [showImages, setShowImages] = useState<boolean>(() => {
    return (
      (localStorage.getItem('vocabflow_show_images') || localStorage.getItem('vocabflow_show_images')) !== 'false'
    );
  });

  const [showExamples, setShowExamples] = useState<boolean>(() => {
    return (
      (localStorage.getItem('vocabflow_show_examples') || localStorage.getItem('vocabflow_show_examples')) !== 'false'
    );
  });

  const [autoAdvance, setAutoAdvance] = useState<boolean>(() => {
    return (
      (localStorage.getItem('vocabflow_auto_advance') || localStorage.getItem('vocabflow_auto_advance')) === 'true'
    );
  });

  const [showSupportBtn, setShowSupportBtn] = useState<boolean>(() => {
    return (
      (localStorage.getItem('vocabflow_show_support_btn') || localStorage.getItem('vocabflow_show_support_btn')) !==
      'false'
    );
  });

  // 4. Mục tiêu ngày
  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    return parseInt(
      localStorage.getItem('vocabflow_daily_goal') || localStorage.getItem('vocabflow_daily_goal') || '20',
      10
    );
  });

  // Notifications & Modals
  const [savedToast, setSavedToast] = useState(false);
  const [resetProgressModalOpen, setResetProgressModalOpen] = useState(false);
  const [clearWordBankModalOpen, setClearWordBankModalOpen] = useState(false);
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Live Device & Security state
  const [devices, setDevices] = useState<any[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [deviceMaxAllowed, setDeviceMaxAllowed] = useState(3);
  const [deviceCurrentCount, setDeviceCurrentCount] = useState(1);
  const [currentDeviceId, setCurrentDeviceId] = useState('');

  // OTP Device Logout Modal
  const [targetDeviceToLogout, setTargetDeviceToLogout] = useState<any | null>(null);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpStep, setOtpStep] = useState<'REQUEST' | 'VERIFY'>('REQUEST');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [otpTimer, setOtpTimer] = useState(600); // 10 minutes
  const [resendCooldown, setResendCooldown] = useState(0);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const fetchDevices = async () => {
    if (!user) return;
    setLoadingDevices(true);
    try {
      const res: any = await api.get('/security/devices');
      const data = res?.data || res;
      if (data?.devices) {
        setDevices(data.devices);
        setDeviceMaxAllowed(data.maxAllowed || 3);
        setDeviceCurrentCount(data.currentCount || data.devices.length);
        setCurrentDeviceId(data.currentDeviceId || '');
      }
    } catch (err) {
      console.warn('Failed to load user devices:', err);
    } finally {
      setLoadingDevices(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [user]);

  // Timer countdown for OTP
  useEffect(() => {
    let timer: any;
    if (otpModalOpen && otpStep === 'VERIFY' && otpTimer > 0) {
      timer = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpModalOpen, otpStep, otpTimer]);

  // Resend cooldown timer
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleOpenLogoutModal = (device: any) => {
    setTargetDeviceToLogout(device);
    setOtpStep('REQUEST');
    setOtpCode('');
    setOtpError(null);
    setOtpSuccess(null);
    setOtpModalOpen(true);
  };

  const handleSendLogoutOtp = async () => {
    if (!targetDeviceToLogout) return;
    setOtpLoading(true);
    setOtpError(null);
    setOtpSuccess(null);
    try {
      await api.post('/security/device-logout/request-otp', {
        targetDeviceId: targetDeviceToLogout.id,
      });
      setOtpStep('VERIFY');
      setOtpTimer(600);
      setResendCooldown(60);
    } catch (err: any) {
      setOtpError(err?.response?.data?.message || 'Không thể gửi mã xác nhận OTP. Vui lòng thử lại.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyLogoutOtp = async () => {
    if (!targetDeviceToLogout) return;
    if (otpCode.trim().length !== 6) {
      setOtpError('Vui lòng nhập đầy đủ 6 chữ số mã xác nhận OTP.');
      return;
    }
    setOtpLoading(true);
    setOtpError(null);
    setOtpSuccess(null);
    try {
      const res: any = await api.post('/security/device-logout/verify-otp', {
        targetDeviceId: targetDeviceToLogout.id,
        otp: otpCode.trim(),
      });
      const data = res?.data?.data || res?.data || res;
      const successMsg = data?.message || `Đã thu hồi phiên và đăng xuất thiết bị "${targetDeviceToLogout.deviceName}" thành công mà không làm gián đoạn phiên hiện tại.`;
      setOtpSuccess(successMsg);
      setActionSuccessMsg(successMsg);
      await fetchDevices();
    } catch (err: any) {
      setOtpError(err?.response?.data?.message || 'Mã xác nhận OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      // 1. Immediately wipe all tokens from localStorage & sessionStorage
      localStorage.removeItem('vocabflow_access_token');
      localStorage.removeItem('vocabflow_refresh_token');
      sessionStorage.clear();

      // 2. Clear IndexedDB offline cache
      await idbClearAllUserData().catch(() => {});

      // 3. Clear auth context state
      setUser(null);

      // 4. Notify user via global toast & local message
      setPasswordMsg('Đổi mật khẩu thành công! Toàn bộ token và phiên đăng nhập đã được xóa sạch. Đang chuyển hướng về trang đăng nhập...');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('VOCABFLOW_TOAST', {
            detail: {
              type: 'success',
              title: 'Đổi mật khẩu thành công',
              message: 'Mật khẩu đã được cập nhật và toàn bộ phiên làm việc cũ đã bị thu hồi. Vui lòng đăng nhập lại.',
            },
          }),
        );
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // 5. Immediate redirect
      setTimeout(() => {
        window.location.href = '/login';
      }, 800);
    } catch (err: any) {
      setPasswordError(err?.response?.data?.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleExportData = () => {
    try {
      const guestFavorites = JSON.parse(localStorage.getItem('vocabflow_guest_favorites') || '[]');
      const guestWords = JSON.parse(localStorage.getItem('vocabflow_guest_words') || '[]');
      const guestReviews = JSON.parse(localStorage.getItem('vocabflow_guest_reviews') || '[]');

      const exportPayload = {
        app: 'VocabFlow AI',
        version: '4.0.0',
        exportedAt: new Date().toISOString(),
        user: {
          id: user?.id || 'guest',
          email: user?.email || 'guest@vocabflow.local',
          displayName: user?.displayName || 'Học viên',
          tier: user?.tier || 'FREE',
        },
        settings: {
          themeMode,
          accentColor,
          voiceAccent,
          voiceSpeed,
          dailyGoal,
        },
        data: {
          favoriteWords: guestFavorites,
          customWordBank: guestWords,
          studyHistory: guestReviews,
        },
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `vocabflow_export_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setActionSuccessMsg('Đã trích xuất và tải xuống toàn bộ dữ liệu học tập (JSON) thành công!');
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (e) {
      console.error('Export error', e);
    }
  };

  const handleRevokeOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    setActionSuccessMsg('Đã đăng xuất khỏi tất cả các thiết bị khác thành công!');
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  const handleConfirmDeleteAccount = () => {
    setDeleteAccountModalOpen(false);
    localStorage.clear();
    setActionSuccessMsg('Yêu cầu xóa tài khoản đã được ghi nhận. Toàn bộ dữ liệu của bạn đã được xóa sạch.');
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
  };

  const handleSelectTheme = (mode: 'system' | 'light' | 'dark') => {
    setThemeMode(mode);
    localStorage.setItem('vocabflow_theme_mode', mode);
    if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if ((prefersDark && theme !== 'dark') || (!prefersDark && theme === 'dark')) {
        toggleTheme();
      }
    } else if (mode === 'light' && theme === 'dark') {
      toggleTheme();
    } else if (mode === 'dark' && theme === 'light') {
      toggleTheme();
    }
  };

  const handleSaveAll = () => {
    localStorage.setItem('vocabflow_accent', accentColor);
    localStorage.setItem('vocabflow_show_phonetic', showPhonetic ? 'true' : 'false');
    localStorage.setItem('vocabflow_voice', voiceAccent);
    localStorage.setItem('vocabflow_voice_speed', voiceSpeed.toString());
    localStorage.setItem('vocabflow_auto_audio', autoPlayAudio ? 'true' : 'false');
    localStorage.setItem('vocabflow_show_images', showImages ? 'true' : 'false');
    localStorage.setItem('vocabflow_show_examples', showExamples ? 'true' : 'false');
    localStorage.setItem('vocabflow_auto_advance', autoAdvance ? 'true' : 'false');
    localStorage.setItem('vocabflow_daily_goal', dailyGoal.toString());
    localStorage.setItem('vocabflow_show_support_btn', showSupportBtn ? 'true' : 'false');
    window.dispatchEvent(new Event('storage'));

    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleConfirmResetProgress = () => {
    localStorage.removeItem('vocabflow_recent_chat');
    setResetProgressModalOpen(false);
    setActionSuccessMsg('Đã đặt lại tiến độ học thành công!');
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  const handleConfirmClearWordBank = () => {
    setClearWordBankModalOpen(false);
    setActionSuccessMsg('Đã làm sạch kho từ vựng cá nhân thành công!');
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  const accentColors = [
    { id: 'violet', label: 'Violet (Tím)', bg: 'bg-violet-600', ring: 'ring-violet-500' },
    { id: 'indigo', label: 'Indigo (Chàm)', bg: 'bg-indigo-600', ring: 'ring-indigo-500' },
    { id: 'emerald', label: 'Emerald (Xanh lục)', bg: 'bg-emerald-600', ring: 'ring-emerald-500' },
    { id: 'amber', label: 'Amber (Hổ phách)', bg: 'bg-amber-600', ring: 'ring-amber-500' },
    { id: 'rose', label: 'Rose (Hồng đỏ)', bg: 'bg-rose-600', ring: 'ring-rose-500' },
    { id: 'slate', label: 'Slate (Trung tính)', bg: 'bg-slate-600', ring: 'ring-slate-500' },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1 border border-indigo-500/20">
            <Sliders className="w-3.5 h-3.5" />
            <span>Preferences & Settings</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
            Cài Đặt & Tùy Chọn Trải Nghiệm
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            Tùy biến giao diện, âm thanh, tùy chọn học từ và bảo mật tài khoản cá nhân.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-glass-primary !shadow-none font-bold text-xs transition"
        >
          {savedToast ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          <span>{savedToast ? 'Đã lưu thiết lập!' : 'Lưu tất cả thay đổi'}</span>
        </button>
      </div>

      {/* Action Success Toast Banner */}
      {actionSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Quick Category Navigation Pills (Tối ưu trải nghiệm & diện tích) */}
      <div className="tab-pill-container self-start overflow-x-auto pb-1 scrollbar-none flex-nowrap max-w-full">
        {[
          { id: 'all', label: 'Tất cả mục', icon: LayoutGrid },
          { id: 'languages', label: 'Ngôn ngữ học tập', icon: Globe },
          { id: 'appearance', label: 'Giao diện & Hiển thị', icon: Palette },
          { id: 'audio_study', label: 'Âm thanh & Học tập', icon: Volume2 },
          { id: 'security', label: 'Bảo mật & Phiên', icon: Shield },
          { id: 'data', label: 'Dữ liệu & Quyền riêng tư', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`tab-pill shrink-0 ${isActive ? 'tab-pill-active' : ''}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Responsive 2-Column Grid (Tối ưu diện tích màn hình) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ========================================================================= */}
        {/* SECTION 0: KHÔNG GIAN NGÔN NGỮ HỌC TẬP (MULTI-LANGUAGE SPACES)           */}
        {/* ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'languages') && (
          <GlassCard variant="liquid" className="p-6 space-y-5 lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center overflow-hidden">
                  <CountryFlag languageId={activeLanguage.id} countryCode={activeLanguage.countryCode} size="md" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug flex items-center gap-2">
                    <span>Không Gian Ngôn Ngữ Học Tập</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-extrabold border border-indigo-200 dark:border-indigo-800">
                      Đang học: {activeLanguage.nativeName}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Một tài khoản, nhiều ngôn ngữ. Mỗi ngôn ngữ có kho từ vựng, chuỗi streak và tiến trình FSRS hoàn toàn độc lập.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => setShowAddLanguageModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm ngôn ngữ</span>
                </button>
              </div>
            </div>

            {/* List of User's Enrolled Learning Spaces */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                Các ngôn ngữ trong tài khoản của bạn ({userLanguages.length})
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {userLanguages.map((langId) => {
                  const lang = getLanguage(langId);
                  const profile = learningProfiles[langId] || activeProfile;
                  const isActive = langId === activeLanguage.id;
                  return (
                    <div
                      key={langId}
                      className={`p-3.5 rounded-2xl border transition relative flex flex-col justify-between space-y-3 ${
                        isActive
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CountryFlag languageId={lang.id} countryCode={lang.countryCode} size="md" />
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">
                              {lang.nativeName}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{lang.name}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {profile.level}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                          <Flame className="w-3 h-3 fill-amber-500" />
                          <span>{profile.currentStreak || 0} ngày</span>
                        </div>
                        <span className="text-slate-400 font-medium">
                          {profile.wordsLearned || 0} từ vựng
                        </span>
                      </div>

                      {isActive ? (
                        <div className="w-full text-center py-1 rounded-xl bg-indigo-600 text-white font-bold text-[11px]">
                          ✓ Không gian đang mở
                        </div>
                      ) : (
                        <button
                          onClick={() => switchLanguage(langId)}
                          className="w-full text-center py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/80 hover:text-indigo-600 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition"
                        >
                          Chuyển sang học
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pronunciation & Script Preferences for Active Language */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-indigo-500" />
                  <span>Cấu hình phát âm bản ngữ:</span>
                  <CountryFlag languageId={activeLanguage.id} countryCode={activeLanguage.countryCode} size="xs" />
                  <span>{activeLanguage.name} ({activeLanguage.speechLocale})</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Native TTS Engine</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Voice Gender */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-600 dark:text-slate-400 text-[11px]">Giọng phát âm</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setVoiceGender('female');
                        localStorage.setItem('vocabflow_voice_gender', 'female');
                      }}
                      className={`p-2 rounded-xl border text-xs font-bold transition ${
                        voiceGender === 'female'
                          ? 'border-indigo-500 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      Nữ (Female)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVoiceGender('male');
                        localStorage.setItem('vocabflow_voice_gender', 'male');
                      }}
                      className={`p-2 rounded-xl border text-xs font-bold transition ${
                        voiceGender === 'male'
                          ? 'border-indigo-500 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      Nam (Male)
                    </button>
                  </div>
                </div>

                {/* Speed */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-600 dark:text-slate-400 text-[11px]">Tốc độ phát âm</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[0.75, 1.0, 1.25].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => setVoiceSpeed(spd)}
                        className={`p-2 rounded-xl border text-xs font-bold transition ${
                          voiceSpeed === spd
                            ? 'border-indigo-500 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Script & Tone Aids */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-600 dark:text-slate-400 text-[11px]">Hỗ trợ phiên âm / Romaji</label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !showScriptAids;
                      setShowScriptAids(next);
                      localStorage.setItem('vocabflow_show_script_aids', String(next));
                    }}
                    className={`w-full p-2 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                      showScriptAids
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    <span>{showScriptAids ? '✓ Hiển thị Pinyin / Romaji' : '✕ Chỉ xem ký tự gốc'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Isolated Language Reset Danger Card */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <p className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Đặt lại tiến trình tiếng {activeLanguage.nativeName} ({activeLanguage.name})
                </p>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                  Chỉ đặt lại từ vựng, thống kê và streak của tiếng {activeLanguage.name}. Các ngôn ngữ khác và tài khoản không bị ảnh hưởng.
                </p>
              </div>
              <button
                onClick={() => setShowResetLanguageModal(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0 transition"
              >
                Đặt lại {activeLanguage.name}
              </button>
            </div>
          </GlassCard>
        )}
        {/* ========================================================================= */}
        {/* SECTION 1: GIAO DIỆN & HIỂN THỊ                                           */}
        {/* ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'appearance') && (
          <GlassCard variant="liquid" className="p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  Giao Diện & Hiển Thị
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Ngôn ngữ, chế độ hiển thị sáng/tối và tùy chọn trực quan.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Row: Language & Theme */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Language */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-slate-400" />
                    <span>Ngôn ngữ hệ thống</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLocale('vi')}
                      className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition ${
                        locale === 'vi'
                          ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <CountryFlag languageId="vi" size="xs" />
                      <span>Tiếng Việt</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocale('en')}
                      className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition ${
                        locale === 'en'
                          ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <CountryFlag languageId="en" size="xs" />
                      <span>English</span>
                    </button>
                  </div>
                </div>

                {/* Theme Mode */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    Chế độ nền (Theme)
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSelectTheme('system')}
                      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border text-[11px] font-bold transition ${
                        themeMode === 'system'
                          ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <Laptop className="w-3.5 h-3.5" />
                      <span>Hệ thống</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectTheme('light')}
                      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border text-[11px] font-bold transition ${
                        themeMode === 'light'
                          ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>Sáng</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectTheme('dark')}
                      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border text-[11px] font-bold transition ${
                        themeMode === 'dark'
                          ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>Tối</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Accent Color Palette */}
              <div className="space-y-1.5 pt-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Màu chủ đạo: <span className="text-indigo-600 dark:text-indigo-400 capitalize">{accentColor}</span>
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {accentColors.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setAccentColor(color.id as any)}
                      className={`h-9 rounded-xl ${color.bg} flex items-center justify-center text-white transition transform hover:scale-105 ${
                        accentColor === color.id
                          ? `ring-2 ring-offset-2 dark:ring-offset-slate-900 ${color.ring}`
                          : 'opacity-80 hover:opacity-100'
                      }`}
                      title={color.label}
                    >
                      {accentColor === color.id && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Options with ToggleSwitches */}
              <div className="pt-2 space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] block">
                  Tùy chọn hiển thị chi tiết
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Phiên âm IPA Toggle */}
                  <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70">
                    <ToggleSwitch
                      checked={showPhonetic}
                      onChange={setShowPhonetic}
                      label="Phiên âm IPA"
                      description="Ký âm quốc tế /.../ dưới từ"
                      size="sm"
                    />
                  </div>

                  {/* Hiện hình ảnh Toggle */}
                  <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70">
                    <ToggleSwitch
                      checked={showImages}
                      onChange={setShowImages}
                      label="Hình ảnh minh họa"
                      description="Trực quan hóa nghĩa từ"
                      size="sm"
                    />
                  </div>

                  {/* Hiện ví dụ Toggle */}
                  <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70">
                    <ToggleSwitch
                      checked={showExamples}
                      onChange={setShowExamples}
                      label="Ví dụ ngữ cảnh"
                      description="Câu mẫu và bản dịch"
                      size="sm"
                    />
                  </div>

                  {/* Nút hỗ trợ nổi Toggle */}
                  <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70">
                    <ToggleSwitch
                      checked={showSupportBtn}
                      onChange={(val) => {
                        setShowSupportBtn(val);
                        localStorage.setItem('vocabflow_show_support_btn', val ? 'true' : 'false');
                        window.dispatchEvent(new Event('storage'));
                      }}
                      label="Nút Hỗ trợ nổi"
                      description="Biểu tượng chat 24/7 góc dưới"
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* ========================================================================= */}
        {/* SECTION 2: ÂM THANH & TÙY CHỌN HỌC                                        */}
        {/* ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'audio_study') && (
          <GlassCard variant="liquid" className="p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  Âm Thanh & Tùy Chọn Học
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Cấu hình giọng đọc bản ngữ, tốc độ phát âm và mục tiêu ngày.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Row: Accent & Speed */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    Giọng đọc bản ngữ
                  </label>
                  <CustomDropdown
                    value={voiceAccent}
                    onChange={(val) => setVoiceAccent(val as any)}
                    options={[
                      { value: 'en-US', label: 'Tiếng Anh - Giọng Mỹ (US)' },
                      { value: 'en-GB', label: 'Tiếng Anh - Giọng Anh (UK)' },
                      { value: 'en-AU', label: 'Tiếng Anh - Giọng Úc (AU)' },
                    ]}
                    size="sm"
                    className="w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    Tốc độ phát âm
                  </label>
                  <CustomDropdown
                    value={voiceSpeed}
                    onChange={(val) => setVoiceSpeed(parseFloat(val))}
                    options={[
                      { value: 0.75, label: '0.75× (Chậm rãi, rõ từng âm)' },
                      { value: 1.0, label: '1.0× (Tự nhiên chuẩn bản ngữ)' },
                      { value: 1.25, label: '1.25× (Nhanh vừa phải)' },
                      { value: 1.5, label: '1.5× (Nhanh nâng cao)' },
                    ]}
                    size="sm"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Audio & Quiz Behavior Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70">
                  <ToggleSwitch
                    checked={autoPlayAudio}
                    onChange={setAutoPlayAudio}
                    label="Tự động phát âm"
                    description="Khi mở câu hỏi hoặc lật thẻ"
                    size="sm"
                  />
                </div>

                <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70">
                  <ToggleSwitch
                    checked={autoAdvance}
                    onChange={setAutoAdvance}
                    label="Tự chuyển câu trắc nghiệm"
                    description="Tự động khi trả lời đúng"
                    size="sm"
                  />
                </div>
              </div>

              {/* Daily Goal Target */}
              <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Mục tiêu học mỗi ngày</span>
                  </div>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                    {dailyGoal} từ / ngày
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {[10, 15, 20, 30, 50].map((words) => (
                    <button
                      key={words}
                      type="button"
                      onClick={() => setDailyGoal(words)}
                      className={`py-1.5 rounded-xl border text-center font-bold text-xs transition ${
                        dailyGoal === words
                          ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {words}
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                />
              </div>
            </div>
          </GlassCard>
        )}

        {/* ========================================================================= */}
        {/* SECTION 3: TRUNG TÂM BẢO MẬT & QUẢN LÝ THIẾT BỊ                            */}
        {/* ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'security') && (
          <GlassCard variant="liquid" className="p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    Bảo Mật & Quản Lý Thiết Bị
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Giới hạn thiết bị đăng nhập, bảo vệ qua mã OTP Email và đổi mật khẩu an toàn.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={fetchDevices}
                disabled={loadingDevices}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                title="Làm mới danh sách thiết bị"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingDevices ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-6 text-xs">
              {/* Device Quota Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-bold text-slate-900 dark:text-white">
                      Giới hạn thiết bị đang dùng
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    deviceCurrentCount >= deviceMaxAllowed
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      : 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                  }`}>
                    {deviceCurrentCount} / {deviceMaxAllowed} thiết bị
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700/60 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      deviceCurrentCount >= deviceMaxAllowed ? 'bg-amber-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min(100, (deviceCurrentCount / (deviceMaxAllowed || 1)) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
                  {user?.role === 'ADMIN'
                    ? 'Tài khoản Quản trị viên chỉ cho phép tối đa 1 thiết bị hoạt động đồng thời.'
                    : 'Học viên được liên kết tối đa 3 thiết bị đồng thời. Đăng nhập thiết bị thứ 4 sẽ tạm giữ xem xét rủi ro.'}
                </p>
              </div>

              {/* Live Device List */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] flex items-center justify-between">
                  <span>Danh sách thiết bị đã cấp quyền ({devices.length})</span>
                  {loadingDevices && (
                    <span className="flex items-center gap-1 text-[10px] text-indigo-500 font-normal">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Đang đồng bộ...
                    </span>
                  )}
                </label>

                <div className="space-y-2">
                  {devices.length === 0 && !loadingDevices && (
                    <div className="p-4 rounded-xl text-center bg-slate-50 dark:bg-slate-800/40 text-slate-400 text-xs">
                      Chưa ghi nhận thiết bị nào trong phiên hiện tại.
                    </div>
                  )}

                  {devices.map((dev) => {
                    const isCurrent = dev.isCurrent || dev.deviceId === currentDeviceId;
                    const isMobile = (dev.deviceType || '').toUpperCase() === 'MOBILE';
                    return (
                      <div
                        key={dev.id}
                        className={`p-3.5 rounded-xl border transition flex items-center justify-between ${
                          isCurrent
                            ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-500/40'
                            : 'bg-white/70 dark:bg-slate-800/50 border-slate-200/70 dark:border-slate-700/70'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isCurrent
                              ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}>
                            {isMobile ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 dark:text-white leading-tight">
                                {dev.deviceName || (isMobile ? 'Thiết bị di động' : 'Máy tính để bàn')}
                              </p>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider">
                                  Thiết bị hiện tại
                                </span>
                              )}
                              {dev.status === 'PENDING_REVIEW' && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] font-bold">
                                  Chờ duyệt
                                </span>
                              )}
                              {dev.status === 'BLOCKED' && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[9px] font-bold">
                                  Bị khóa
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {dev.browser || 'Browser'} • {dev.os || 'OS'} • IP: {dev.ipAddress || '127.0.0.1'} • {new Date(dev.lastActiveAt).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        </div>

                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleOpenLogoutModal(dev)}
                            className="px-2.5 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-bold transition flex items-center gap-1 border border-rose-200 dark:border-rose-900/40"
                          >
                            <LogOut className="w-3 h-3" />
                            <span>Đăng xuất</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Password Change Section */}
              <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800/70 space-y-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Key className="w-3 h-3 text-indigo-500" />
                    <span>Đổi mật khẩu tài khoản</span>
                  </label>
                  <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>Để đảm bảo tính toàn vẹn bảo mật, đổi mật khẩu sẽ đăng xuất toàn bộ thiết bị khác trên mọi nền tảng.</span>
                  </p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-2.5 max-w-md">
                  {passwordError && (
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px]">
                      {passwordError}
                    </div>
                  )}
                  {passwordMsg && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>{passwordMsg}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-3 py-1.5 rounded-lg bg-white/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Mật khẩu mới
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-3 py-1.5 rounded-lg bg-white/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Nhập lại mật khẩu
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-3 py-1.5 rounded-lg bg-white/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
                  >
                    {changingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>Xác nhận đổi mật khẩu</span>
                  </button>
                </form>
              </div>
            </div>
          </GlassCard>
        )}

        {/* OTP MODAL FOR LOGGING OUT ANOTHER DEVICE */}
        {otpModalOpen && targetDeviceToLogout && (
          <ModalPortal isOpen={otpModalOpen} onClose={() => setOtpModalOpen(false)}>
            <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-scale-in text-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Xác thực đăng xuất thiết bị</h4>
                      <p className="text-[10px] text-slate-400">Bảo mật hai lớp qua mã OTP Email</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-1">
                  <div className="text-slate-300 font-bold">Thiết bị cần thu hồi:</div>
                  <div className="text-slate-200 font-semibold">{targetDeviceToLogout.deviceName}</div>
                  <div className="text-[10px] text-slate-400">
                    IP: {targetDeviceToLogout.ipAddress || '127.0.0.1'} • {targetDeviceToLogout.os || 'OS'}
                  </div>
                </div>

                {otpError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-start gap-2 animate-shake">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-rose-200">Xác thực không thành công:</p>
                      <p className="text-[11px] text-rose-300/90 mt-0.5">{otpError}</p>
                    </div>
                  </div>
                )}

                {otpSuccess ? (
                  <div className="py-5 px-3 flex flex-col items-center justify-center text-center space-y-3.5 animate-scale-in">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border-2 border-emerald-500/40 shadow-lg shadow-emerald-950/40">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">Đăng xuất thiết bị thành công!</h4>
                      <p className="text-xs text-emerald-300/90 leading-relaxed max-w-sm">
                        {otpSuccess}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpModalOpen(false);
                        setOtpSuccess(null);
                        setOtpError(null);
                        setOtpCode('');
                      }}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md shadow-emerald-900/30 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đã hiểu & Đóng</span>
                    </button>
                  </div>
                ) : otpStep === 'REQUEST' ? (
                  <div className="space-y-4 pt-1">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Để bảo vệ tài khoản khỏi việc chiếm quyền điều khiển trái phép, một mã xác minh OTP gồm 6 chữ số sẽ được gửi tới hòm thư cá nhân của bạn: <strong className="text-white">{user?.email}</strong>.
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        disabled={otpLoading}
                        onClick={() => setOtpModalOpen(false)}
                        className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-xl bg-slate-800 transition disabled:opacity-50"
                      >
                        Hủy bỏ
                      </button>
                      <button
                        type="button"
                        disabled={otpLoading}
                        onClick={handleSendLogoutOtp}
                        className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-indigo-900/30 disabled:opacity-50"
                      >
                        {otpLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang gửi mã...</span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-3.5 h-3.5" />
                            <span>Gửi mã OTP về Email</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pt-1">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Mã xác minh 6 số đã được gửi tới <strong className="text-white">{user?.email}</strong>. Mã có hiệu lực trong vòng 10 phút.
                    </p>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Nhập mã xác thực OTP
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        disabled={otpLoading}
                        value={otpCode}
                        onChange={(e) => {
                          setOtpCode(e.target.value.replace(/\D/g, ''));
                          if (otpError) setOtpError(null);
                        }}
                        placeholder="••••••"
                        autoFocus
                        className="w-full text-center tracking-[0.5em] text-lg font-mono py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-indigo-500 disabled:opacity-50"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        Hết hạn trong: <strong className="text-amber-400 font-mono">{Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}</strong>
                      </span>
                      {resendCooldown > 0 ? (
                        <span className="text-slate-500">Gửi lại sau {resendCooldown}s</span>
                      ) : (
                        <button
                          type="button"
                          disabled={otpLoading}
                          onClick={handleSendLogoutOtp}
                          className="text-indigo-400 hover:underline font-bold disabled:opacity-50"
                        >
                          Gửi lại mã
                        </button>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        disabled={otpLoading}
                        onClick={() => setOtpModalOpen(false)}
                        className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-xl bg-slate-800 transition disabled:opacity-50"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        disabled={otpLoading || otpCode.length !== 6}
                        onClick={handleVerifyLogoutOtp}
                        className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-rose-900/30"
                      >
                        {otpLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang xác thực...</span>
                          </>
                        ) : (
                          <>
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Xác nhận đăng xuất</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ModalPortal>
        )}

        {/* ========================================================================= */}
        {/* SECTION 4: DỮ LIỆU & QUYỀN RIÊNG TƯ                                      */}
        {/* ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'data') && (
          <GlassCard variant="liquid" className="p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  Dữ Liệu & Quyền Riêng Tư
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Sao lưu dữ liệu học tập JSON, đặt lại tiến trình SRS hoặc xóa tài khoản (GDPR).
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {/* Row: JSON Export & Reset progress */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Trích xuất dữ liệu JSON */}
                <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
                      <Download className="w-3.5 h-3.5" />
                      <span>Sao lưu học tập (JSON)</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                      Tải bản sao lưu từ vựng, từ yêu thích và lịch sử ôn tập.
                    </p>
                  </div>
                  <button
                    onClick={handleExportData}
                    className="self-start px-3 py-1.5 rounded-lg btn-glass-primary !shadow-none font-bold text-xs transition flex items-center gap-1.5"
                  >
                    <Download className="w-3 h-3" />
                    <span>Tải file JSON</span>
                  </button>
                </div>

                {/* Đặt lại tiến độ học */}
                <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Đặt lại bộ nhớ đệm</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                      Làm mới cache ôn tập cục bộ và đồng bộ lại từ máy chủ.
                    </p>
                  </div>
                  <button
                    onClick={() => setResetProgressModalOpen(true)}
                    className="self-start px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-bold text-xs transition"
                  >
                    Đặt lại tiến độ
                  </button>
                </div>
              </div>

              {/* Danger Zone: Clear Word Bank & Delete Account */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2">
                <label className="font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Vùng nguy hiểm (Danger Zone)</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-rose-500/[0.04] dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between">
                    <div className="pr-2">
                      <p className="font-bold text-slate-800 dark:text-slate-200">Xóa kho từ cá nhân</p>
                      <p className="text-[10px] text-slate-400">Xóa tất cả từ vựng tự nhập</p>
                    </div>
                    <button
                      onClick={() => setClearWordBankModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[11px] shrink-0 transition"
                    >
                      Xóa kho
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-rose-500/[0.04] dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between">
                    <div className="pr-2">
                      <p className="font-bold text-slate-800 dark:text-slate-200">Xóa vĩnh viễn tài khoản</p>
                      <p className="text-[10px] text-slate-400">Quyền được lãng quên (GDPR)</p>
                    </div>
                    <button
                      onClick={() => setDeleteAccountModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px] shrink-0 hover:bg-rose-500 transition shadow-xs"
                    >
                      Xóa tài khoản
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}

      {/* Modal: Đặt lại tiến độ học */}
      <ModalPortal isOpen={resetProgressModalOpen} onClose={() => setResetProgressModalOpen(false)}>
        <div
          className="m-auto relative w-full max-w-lg p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Xác nhận đặt lại tiến độ học?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Thao tác này sẽ làm mới bộ nhớ đệm ôn tập và đồng bộ lại trạng thái học từ máy chủ. Tài khoản và cấp độ
                của bạn vẫn được giữ nguyên an toàn.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setResetProgressModalOpen(false)}
              className="btn-glass-secondary text-xs !py-2 !px-4"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleConfirmResetProgress}
              className="btn-glass-amber text-xs !py-2 !px-4"
            >
              Xác nhận đặt lại
            </button>
          </div>
        </div>
      </ModalPortal>

      {/* Modal: Xóa kho từ vựng */}
      <ModalPortal isOpen={clearWordBankModalOpen} onClose={() => setClearWordBankModalOpen(false)}>
        <div
          className="m-auto relative w-full max-w-lg p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Xóa toàn bộ kho từ vựng cá nhân?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Cảnh báo: Thao tác này sẽ xóa tất cả các từ vựng tự nhập và từ bạn đã thêm vào kho cá nhân. Hành động
                này không thể hoàn tác.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setClearWordBankModalOpen(false)}
              className="btn-glass-secondary text-xs !py-2 !px-4"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleConfirmClearWordBank}
              className="btn-glass-danger text-xs !py-2 !px-4"
            >
              Xóa vĩnh viễn kho từ
            </button>
          </div>
        </div>
      </ModalPortal>

      {/* Modal: Xóa vĩnh viễn tài khoản */}
      <ModalPortal isOpen={deleteAccountModalOpen} onClose={() => setDeleteAccountModalOpen(false)}>
        <div
          className="m-auto relative w-full max-w-lg p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 shadow-2xl space-y-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Xác nhận xóa tài khoản vĩnh viễn?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Cảnh báo bảo mật tối cao: Thao tác này sẽ xóa vĩnh viễn toàn bộ tiến trình học, điểm XP, chuỗi Streak,
                danh sách từ vựng và các gói đăng ký. Hành động này không thể đảo ngược hoặc khôi phục.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setDeleteAccountModalOpen(false)}
              className="btn-glass-secondary text-xs !py-2 !px-4"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleConfirmDeleteAccount}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-lg shadow-rose-600/20"
            >
              Xác nhận xóa tài khoản
            </button>
          </div>
        </div>
      </ModalPortal>

      {/* Multi-Language Modals */}
      <AddLanguageModal
        isOpen={showAddLanguageModal}
        onClose={() => setShowAddLanguageModal(false)}
      />

      <ResetLanguageModal
        language={activeLanguage}
        isOpen={showResetLanguageModal}
        onClose={() => setShowResetLanguageModal(false)}
      />
    </div>
  );
};
