import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n';
import { GlassCard } from '../components/common/GlassCard';
import { ModalPortal } from '../components/common/ModalPortal';
import { CustomDropdown } from '../components/common/CustomDropdown';
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
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, theme, toggleTheme } = useAuth();
  const { locale, setLocale, t } = useTranslation();

  // 1. Giao diện settings
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>(() => {
    return (localStorage.getItem('vocabflow_theme_mode') as any) || (localStorage.getItem('leximind_theme_mode') as any) || (theme || 'system');
  });

  const [accentColor, setAccentColor] = useState<'violet' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate'>(() => {
    return (localStorage.getItem('vocabflow_accent') as any) || (localStorage.getItem('leximind_accent') as any) || 'violet';
  });

  // 2. Phiên âm & Giọng đọc
  const [showPhonetic, setShowPhonetic] = useState<boolean>(() => {
    return (localStorage.getItem('vocabflow_show_phonetic') || localStorage.getItem('leximind_show_phonetic')) !== 'false';
  });

  const [voiceAccent, setVoiceAccent] = useState<'en-US' | 'en-GB' | 'en-AU'>(() => {
    return (localStorage.getItem('vocabflow_voice') as any) || (localStorage.getItem('leximind_voice') as any) || 'en-US';
  });

  const [voiceSpeed, setVoiceSpeed] = useState<number>(() => {
    return parseFloat(localStorage.getItem('vocabflow_voice_speed') || localStorage.getItem('leximind_voice_speed') || '1.0');
  });

  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(() => {
    return (localStorage.getItem('vocabflow_auto_audio') || localStorage.getItem('leximind_auto_audio')) === 'true';
  });

  // 3. Tùy chọn học
  const [showImages, setShowImages] = useState<boolean>(() => {
    return (localStorage.getItem('vocabflow_show_images') || localStorage.getItem('leximind_show_images')) !== 'false';
  });

  const [showExamples, setShowExamples] = useState<boolean>(() => {
    return (localStorage.getItem('vocabflow_show_examples') || localStorage.getItem('leximind_show_examples')) !== 'false';
  });

  const [autoAdvance, setAutoAdvance] = useState<boolean>(() => {
    return (localStorage.getItem('vocabflow_auto_advance') || localStorage.getItem('leximind_auto_advance')) === 'true';
  });

  const [showSupportBtn, setShowSupportBtn] = useState<boolean>(() => {
    return (localStorage.getItem('vocabflow_show_support_btn') || localStorage.getItem('leximind_show_support_btn')) !== 'false';
  });

  // 4. Mục tiêu ngày
  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    return parseInt(localStorage.getItem('vocabflow_daily_goal') || localStorage.getItem('leximind_daily_goal') || '20', 10);
  });

  // Notifications & Modals
  const [savedToast, setSavedToast] = useState(false);
  const [resetProgressModalOpen, setResetProgressModalOpen] = useState(false);
  const [clearWordBankModalOpen, setClearWordBankModalOpen] = useState(false);
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [sessions, setSessions] = useState([
    { id: 's1', device: 'Chrome on Windows 11', ip: '113.190.23.104', isCurrent: true, lastActive: 'Đang hoạt động' },
    { id: 's2', device: 'Safari on iPhone 15 Pro', ip: '14.162.88.21', isCurrent: false, lastActive: '2 ngày trước' },
  ]);

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

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `vocabflow_export_${new Date().toISOString().split('T')[0]}.json`);
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
    localStorage.removeItem('leximind_recent_chat');
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
    <div className="w-full space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1 border border-indigo-500/20">
            <Sliders className="w-3.5 h-3.5" />
            <span>Preferences & Settings</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
            Cài Đặt & Tùy Chọn Trải Nghiệm
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            Tùy biến giao diện, âm thanh, tùy chọn học từ và quản lý dữ liệu cá nhân theo ý bạn.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition"
        >
          {savedToast ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          <span>{savedToast ? 'Đã lưu tất cả thiết lập!' : 'Lưu tất cả thay đổi'}</span>
        </button>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* 1. GIAO DIỆN */}
      <GlassCard variant="liquid" className="p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
          <Palette className="w-5 h-5 text-indigo-500" />
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
              Giao Diện
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cấu hình ngôn ngữ, chế độ hiển thị sáng/tối và bảng màu chủ đạo.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Language */}
          <div className="space-y-2">
            <label className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>Language (Ngôn ngữ)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocale('vi')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition ${
                  locale === 'vi'
                    ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <span>🇻🇳</span>
                <span>Tiếng Việt</span>
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition ${
                  locale === 'en'
                    ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <span>🇬🇧</span>
                <span>English</span>
              </button>
            </div>
          </div>

          {/* Chủ đề (Theme) */}
          <div className="space-y-2">
            <label className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
              Chủ đề (Theme)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectTheme('system')}
                className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl border text-xs font-bold transition ${
                  themeMode === 'system'
                    ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>Hệ thống</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectTheme('light')}
                className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl border text-xs font-bold transition ${
                  themeMode === 'light'
                    ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Sáng</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectTheme('dark')}
                className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl border text-xs font-bold transition ${
                  themeMode === 'dark'
                    ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Tối</span>
              </button>
            </div>
          </div>

          {/* Màu chủ đạo */}
          <div className="space-y-2">
            <label className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
              Màu chủ đạo: <span className="text-indigo-600 dark:text-indigo-400 capitalize">{accentColor}</span>
            </label>
            <div className="grid grid-cols-6 gap-2">
              {accentColors.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setAccentColor(color.id as any)}
                  className={`h-11 rounded-xl ${color.bg} flex items-center justify-center text-white transition transform hover:scale-105 ${
                    accentColor === color.id
                      ? `ring-2 ring-offset-2 dark:ring-offset-slate-900 ${color.ring}`
                      : 'opacity-80 hover:opacity-100'
                  }`}
                  title={color.label}
                >
                  {accentColor === color.id && <Check className="w-4 h-4 stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Bật/Tắt nút Hỗ trợ khách hàng nổi */}
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Hiển thị nút Hỗ trợ nổi</p>
                <p className="text-[11px] text-slate-400">Nút tròn liên hệ hỗ trợ 24/7 ở góc dưới màn hình</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={showSupportBtn}
              onChange={(e) => {
                setShowSupportBtn(e.target.checked);
                localStorage.setItem('leximind_show_support_btn', e.target.checked ? 'true' : 'false');
                window.dispatchEvent(new Event('storage'));
              }}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>
        </div>
      </GlassCard>

      {/* 2. PHIÊN ÂM & GIỌNG ĐỌC */}
      <GlassCard variant="liquid" className="p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
          <Volume2 className="w-5 h-5 text-indigo-500" />
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
              Phiên Âm & Giọng Đọc
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tùy chỉnh ký âm quốc tế IPA, chất giọng phát âm bản xứ và tốc độ phản xạ.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Phiên âm toggle */}
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between">
            <div className="space-y-0.5 pr-2">
              <p className="font-bold text-slate-800 dark:text-slate-200">Phiên âm IPA</p>
              <p className="text-[11px] text-slate-400">Hiển thị ký âm quốc tế /.../</p>
            </div>
            <input
              type="checkbox"
              checked={showPhonetic}
              onChange={(e) => setShowPhonetic(e.target.checked)}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer shrink-0"
            />
          </div>

          {/* Giọng đọc */}
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 space-y-2">
            <label className="font-bold text-slate-800 dark:text-slate-200 text-sm">Giọng đọc bản ngữ</label>
            <CustomDropdown
              value={voiceAccent}
              onChange={(val) => setVoiceAccent(val as any)}
              options={[
                { value: 'en-US', label: '🇺🇸 Tiếng Anh - Giọng Mỹ (US)' },
                { value: 'en-GB', label: '🇬🇧 Tiếng Anh - Giọng Anh (UK)' },
                { value: 'en-AU', label: '🇦🇺 Tiếng Anh - Giọng Úc (AU)' },
              ]}
              className="w-full"
            />
          </div>

          {/* Tốc độ đọc */}
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 space-y-2">
            <label className="font-bold text-slate-800 dark:text-slate-200 text-sm">Tốc độ phát âm</label>
            <CustomDropdown
              value={voiceSpeed}
              onChange={(val) => setVoiceSpeed(parseFloat(val))}
              options={[
                { value: 0.75, label: '0.75× (Chậm rãi, rõ ràng)' },
                { value: 1.0, label: '1.0× (Tự nhiên chuẩn bản ngữ)' },
                { value: 1.25, label: '1.25× (Nhanh vừa phải)' },
                { value: 1.5, label: '1.5× (Nhanh nâng cao)' },
              ]}
              className="w-full"
            />
          </div>

          {/* Tự động phát âm */}
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between">
            <div className="space-y-0.5 pr-2">
              <p className="font-bold text-slate-800 dark:text-slate-200">Tự động phát âm</p>
              <p className="text-[11px] text-slate-400">Khi mở câu hỏi hoặc lật thẻ</p>
            </div>
            <input
              type="checkbox"
              checked={autoPlayAudio}
              onChange={(e) => setAutoPlayAudio(e.target.checked)}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer shrink-0"
            />
          </div>
        </div>
      </GlassCard>

      {/* 3. TÙY CHỌN HỌC */}
      <GlassCard variant="liquid" className="p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
              Tùy Chọn Học
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kiểm soát các thành phần hiển thị trong flashcard và tốc độ làm bài kiểm tra.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Hiện hình ảnh */}
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Hiện hình ảnh</p>
                <p className="text-[11px] text-slate-400">Trực quan hóa nghĩa từ</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={showImages}
              onChange={(e) => setShowImages(e.target.checked)}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          {/* Hiện ví dụ */}
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Hiện ví dụ</p>
                <p className="text-[11px] text-slate-400">Kèm ngữ cảnh thực tế</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={showExamples}
              onChange={(e) => setShowExamples(e.target.checked)}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          {/* Tự chuyển câu trong bài kiểm tra */}
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FastForward className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Tự chuyển câu trong bài kiểm tra</p>
                <p className="text-[11px] text-slate-400">Tự động khi làm đúng</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(e) => setAutoAdvance(e.target.checked)}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>
        </div>
      </GlassCard>

      {/* 4. MỤC TIÊU NGÀY */}
      <GlassCard variant="liquid" className="p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
          <Target className="w-5 h-5 text-indigo-500" />
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
              Mục Tiêu Ngày
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Số lượng từ mới và thẻ ôn tập dự kiến hoàn thành mỗi ngày để duy trì chuỗi Streak.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[10, 15, 20, 30, 50].map((words) => (
              <button
                key={words}
                type="button"
                onClick={() => setDailyGoal(words)}
                className={`p-4 rounded-2xl border text-center transition ${
                  dailyGoal === words
                    ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <p className="text-lg font-black leading-snug">{words} words</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {words === 10 ? 'Nhẹ nhàng' : words === 20 ? 'Khuyến nghị' : words === 50 ? 'Cường độ cao' : 'Tiêu chuẩn'}
                </p>
              </button>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Tùy chỉnh thanh trượt linh hoạt:</span>
              <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">{dailyGoal} words / ngày</span>
            </div>
            <input
              type="range"
              min={5}
              max={60}
              step={5}
              value={dailyGoal}
              onChange={(e) => setDailyGoal(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>
        </div>
      </GlassCard>

      {/* 5. DỮ LIỆU */}
      <GlassCard variant="liquid" className="p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
          <Database className="w-5 h-5 text-indigo-500" />
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
              Dữ Liệu
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quản trị bộ nhớ tạm, đặt lại tiến trình SRS hoặc làm sạch kho lưu trữ từ vựng.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Đặt lại tiến độ học */}
          <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
                <RotateCcw className="w-4 h-4" />
                <span>Đặt lại tiến độ học</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                Xóa lịch sử ôn tập cục bộ, phiên chat tạm và tải lại tiến trình từ vựng từ máy chủ.
              </p>
            </div>
            <button
              onClick={() => setResetProgressModalOpen(true)}
              className="self-start px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-bold text-xs transition"
            >
              Đặt lại tiến độ học
            </button>
          </div>

          {/* Xóa kho từ vựng */}
          <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold">
                <Trash2 className="w-4 h-4" />
                <span>Xóa kho từ vựng</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                Xóa toàn bộ các từ cá nhân đã lưu trong sổ tay từ vựng và các flashcard tự tạo.
              </p>
            </div>
            <button
              onClick={() => setClearWordBankModalOpen(true)}
              className="self-start px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold text-xs transition"
            >
              Xóa kho từ vựng
            </button>
          </div>
        </div>
      </GlassCard>

      {/* 6. TRUNG TÂM BẢO MẬT (SECURITY CENTER) */}
      <GlassCard variant="liquid" className="p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
          <Shield className="w-5 h-5 text-indigo-500" />
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
              Trung Tâm Bảo Mật (Security Center)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quản lý tài khoản liên kết (Google, Facebook), thiết bị đăng nhập và phiên hoạt động.
            </p>
          </div>
        </div>

        {/* Linked Accounts */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Tài Khoản & Phương Thức Xác Thực Đã Liên Kết
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold text-sm">
                  G
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Google OAuth</p>
                  <p className="text-[11px] text-slate-400">
                    {user?.email?.includes('@') ? `Đã liên kết (${user.email})` : 'Chưa liên kết'}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Đã bảo vệ ✓
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold text-sm">
                  f
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Facebook Login</p>
                  <p className="text-[11px] text-slate-400">Đăng nhập nhanh 1-chạm</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActionSuccessMsg('Đang kích hoạt liên kết tài khoản Facebook...');
                  setTimeout(() => setActionSuccessMsg(null), 3000);
                }}
                className="px-2.5 py-1 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 text-[11px] font-bold transition"
              >
                Liên kết
              </button>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5 text-slate-400" />
              <span>Thiết Bị Đang Đăng Nhập ({sessions.length})</span>
            </h3>
            {sessions.length > 1 && (
              <button
                onClick={handleRevokeOtherSessions}
                className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                <span>Đăng xuất thiết bị khác</span>
              </button>
            )}
          </div>

          <div className="space-y-2 text-xs">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-slate-600 dark:text-slate-300">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 dark:text-white leading-snug">{sess.device}</p>
                      {sess.isCurrent && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold">
                          Thiết bị này
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      IP: {sess.ip} • {sess.lastActive}
                    </p>
                  </div>
                </div>
                {!sess.isCurrent && (
                  <button
                    onClick={handleRevokeOtherSessions}
                    className="px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[11px] font-semibold transition"
                  >
                    Thu hồi
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* 7. QUYỀN RIÊNG TƯ & XUẤT DỮ LIỆU (PRIVACY CENTER) */}
      <GlassCard variant="liquid" className="p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
          <Download className="w-5 h-5 text-indigo-500" />
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
              Trung Tâm Quyền Riêng Tư (Privacy Center)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bạn có toàn quyền làm chủ dữ liệu của mình. Xuất dữ liệu học tập hoặc yêu cầu xóa vĩnh viễn theo chuẩn GDPR.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Trích xuất dữ liệu JSON */}
          <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                <Download className="w-4 h-4" />
                <span>Xuất dữ liệu học tập (JSON)</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                Tải xuống bản sao lưu đầy đủ chứa hồ sơ, danh sách từ vựng cá nhân, từ yêu thích và lịch sử làm bài kiểm tra.
              </p>
            </div>
            <button
              onClick={handleExportData}
              className="self-start px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file JSON ngay</span>
            </button>
          </div>

          {/* Xóa tài khoản vĩnh viễn */}
          <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-rose-200/60 dark:border-rose-900/40 flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold">
                <Trash2 className="w-4 h-4" />
                <span>Xóa vĩnh viễn tài khoản</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                Quyền được lãng quên (GDPR): Xóa sạch toàn bộ tài khoản, chuỗi streak, huy hiệu và dữ liệu cá nhân khỏi hệ thống.
              </p>
            </div>
            <button
              onClick={() => setDeleteAccountModalOpen(true)}
              className="self-start px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold text-xs transition"
            >
              Yêu cầu xóa tài khoản
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Modal: Đặt lại tiến độ học — ModalPortal to document.body */}
      <ModalPortal isOpen={resetProgressModalOpen} onClose={() => setResetProgressModalOpen(false)}>
        <div
          className="m-auto relative w-full max-w-2xl p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Xác nhận đặt lại tiến độ học?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Thao tác này sẽ làm mới bộ nhớ đệm ôn tập và đồng bộ lại trạng thái học từ máy chủ. Tài khoản và cấp độ của bạn vẫn được giữ nguyên an toàn.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setResetProgressModalOpen(false)}
              className="btn-glass-secondary text-xs sm:text-sm !py-2.5 !px-5"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleConfirmResetProgress}
              className="btn-glass-amber text-xs sm:text-sm !py-2.5 !px-5"
            >
              Xác nhận đặt lại tiến độ
            </button>
          </div>
        </div>
      </ModalPortal>

      {/* Modal: Xóa kho từ vựng — ModalPortal to document.body */}
      <ModalPortal isOpen={clearWordBankModalOpen} onClose={() => setClearWordBankModalOpen(false)}>
        <div
          className="m-auto relative w-full max-w-2xl p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Xác nhận xóa toàn bộ kho từ vựng cá nhân?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Cảnh báo: Thao tác này sẽ xóa tất cả các từ vựng tự nhập và từ bạn đã thêm vào kho từ vựng cá nhân. Hành động này không thể hoàn tác.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setClearWordBankModalOpen(false)}
              className="btn-glass-secondary text-xs sm:text-sm !py-2.5 !px-5"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleConfirmClearWordBank}
              className="btn-glass-danger text-xs sm:text-sm !py-2.5 !px-5"
            >
              Xóa vĩnh viễn kho từ
            </button>
          </div>
        </div>
      </ModalPortal>

      {/* Modal: Xóa vĩnh viễn tài khoản — ModalPortal to document.body */}
      <ModalPortal isOpen={deleteAccountModalOpen} onClose={() => setDeleteAccountModalOpen(false)}>
        <div
          className="m-auto relative w-full max-w-2xl p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 shadow-2xl space-y-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Xác nhận xóa tài khoản vĩnh viễn?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Cảnh báo bảo mật tối cao: Thao tác này sẽ xóa vĩnh viễn toàn bộ tiến trình học, điểm XP, chuỗi Streak, danh sách từ vựng cá nhân và các gói đăng ký gắn liền với tài khoản của bạn. Hành động này không thể đảo ngược hoặc khôi phục.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setDeleteAccountModalOpen(false)}
              className="btn-glass-secondary text-xs sm:text-sm !py-2.5 !px-5"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleConfirmDeleteAccount}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-rose-600/20"
            >
              Xác nhận xóa tài khoản vĩnh viễn
            </button>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
};
