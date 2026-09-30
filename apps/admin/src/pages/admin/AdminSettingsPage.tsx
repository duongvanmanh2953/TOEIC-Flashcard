import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  Database,
  Trash2,
  Cpu,
  CreditCard,
  Headphones,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Globe,
  Lock,
  Palette,
  BookOpen,
  Bell,
  MessageSquare,
  Users,
  Flag,
  Server,
  Search,
  AlertTriangle,
  Save,
  UserX,
  AlertOctagon,
  ExternalLink,
  Zap,
  Loader2,
} from 'lucide-react';
import api from '../../lib/api';
import { useTranslation } from '../../i18n';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { AdminToggle } from '../../components/admin/ui/AdminToggle';
import { CountryFlag } from '../../components/language/CountryFlag';

type SettingSectionKey =
  | 'general'
  | 'branding'
  | 'localization'
  | 'learning'
  | 'ai'
  | 'notifications'
  | 'support'
  | 'feedback'
  | 'billing'
  | 'security'
  | 'users_roles'
  | 'feature_flags'
  | 'system';

interface SectionConfig {
  id: SettingSectionKey;
  labelEn: string;
  labelVi: string;
  descEn: string;
  descVi: string;
  icon: React.ElementType;
}

const SECTIONS: SectionConfig[] = [
  {
    id: 'general',
    labelEn: 'General Platform',
    labelVi: 'Cấu hình Chung',
    descEn: 'Platform identity, maintenance state, and membership registrations.',
    descVi: 'Tên nền tảng, trạng thái bảo trì và chính sách tiếp nhận học viên.',
    icon: Sliders,
  },
  {
    id: 'branding',
    labelEn: 'Brand & Visual Theme',
    labelVi: 'Thương hiệu & Giao diện',
    descEn: 'Logo, primary accent color palette, and default theme modes.',
    descVi: 'Logo nhận diện, bảng màu chủ đạo và chế độ hiển thị mặc định.',
    icon: Palette,
  },
  {
    id: 'localization',
    labelEn: 'Localization & Regional',
    labelVi: 'Ngôn ngữ & Vùng miền',
    descEn: 'Default language, platform timezone, and date format standards.',
    descVi: 'Ngôn ngữ mặc định, múi giờ vận hành và định dạng ngày tháng.',
    icon: Globe,
  },
  {
    id: 'learning',
    labelEn: 'Learning Engine & SRS',
    labelVi: 'Thuật toán SRS & Học tập',
    descEn: 'Spaced repetition algorithms, daily study goals, and audio playback.',
    descVi: 'Thuật toán lặp lại ngắt quãng, mục tiêu từ vựng hàng ngày và phát âm.',
    icon: BookOpen,
  },
  {
    id: 'ai',
    labelEn: 'AI Tutor & Intelligence',
    labelVi: 'Mô hình AI & Trí tuệ nhân tạo',
    descEn: 'Default LLM provider, prompt temperature, free quotas, and token safety.',
    descVi: 'Nhà cung cấp LLM, độ sáng tạo temperature và hạn mức câu hỏi miễn phí.',
    icon: Cpu,
  },
  {
    id: 'notifications',
    labelEn: 'Notifications & Alerts',
    labelVi: 'Thông báo & Cảnh báo',
    descEn: 'In-app chimes, sound alerts, email digests, and quiet hours.',
    descVi: 'Âm thanh thông báo, chuông cảnh báo, email tổng hợp và giờ yên tĩnh.',
    icon: Bell,
  },
  {
    id: 'support',
    labelEn: 'Customer Support & SLA',
    labelVi: 'Hỗ trợ Học viên & SLA',
    descEn: 'Live chat gateway, automatic assignment, SLA targets, and auto-replies.',
    descVi: 'Kênh chat hỗ trợ trực tiếp, phân bổ tự động, mục tiêu SLA và tin nhắn chờ.',
    icon: Headphones,
  },
  {
    id: 'feedback',
    labelEn: 'Feedback & Bug Tracker',
    labelVi: 'Góp ý & Báo lỗi',
    descEn: 'Public community roadmap, upvoting, bug submissions, and moderation.',
    descVi: 'Lộ trình phát triển công khai, bình chọn tính năng và tiếp nhận báo lỗi.',
    icon: MessageSquare,
  },
  {
    id: 'billing',
    labelEn: 'Billing & Pricing',
    labelVi: 'Thanh toán & Gói cước',
    descEn: 'Currencies, VAT tax rates, trial periods, and grace intervals.',
    descVi: 'Đơn vị tiền tệ, thuế GTGT, số ngày dùng thử và gia hạn ân hạn.',
    icon: CreditCard,
  },
  {
    id: 'security',
    labelEn: 'Security & Access Control',
    labelVi: 'Bảo mật & Kiểm soát Truy cập',
    descEn: 'Session lifetime, brute-force rate limits, and 2FA enforcement.',
    descVi: 'Thời hạn phiên đăng nhập, giới hạn tốc độ và bắt buộc xác thực 2 lớp.',
    icon: ShieldCheck,
  },
  {
    id: 'users_roles',
    labelEn: 'User Roles & Permissions',
    labelVi: 'Vai trò & Phân quyền',
    descEn: 'Default registration roles, moderation permissions, and deck publishing.',
    descVi: 'Phân quyền mặc định, quyền kiểm duyệt và chia sẻ bộ từ cộng đồng.',
    icon: Users,
  },
  {
    id: 'feature_flags',
    labelEn: 'Feature Flags & Toggles',
    labelVi: 'Công tắc Tính năng (Flags)',
    descEn: 'Toggle live feature availability without deploying code.',
    descVi: 'Bật/tắt các tính năng hệ thống tức thời không cần khởi động lại server.',
    icon: Flag,
  },
  {
    id: 'system',
    labelEn: 'System, DB & Maintenance',
    labelVi: 'Hệ thống, DB & Bảo trì',
    descEn: 'Cache TTL, chat history retention, and database maintenance purges.',
    descVi: 'Bộ nhớ đệm TTL, thời gian lưu tin nhắn và công cụ dọn dẹp dữ liệu.',
    icon: Server,
  },
];

export const AdminSettingsPage: React.FC = () => {
  const { t, locale, setLocale } = useTranslation();
  const [activeSection, setActiveSection] = useState<SettingSectionKey>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Maintenance & Purge Modals
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [purgingMessages, setPurgingMessages] = useState(false);
  const [purgeMessagesError, setPurgeMessagesError] = useState<string | null>(null);
  const [purgeMessagesSuccess, setPurgeMessagesSuccess] = useState<string | null>(null);

  const [purgeMockModalOpen, setPurgeMockModalOpen] = useState(false);
  const [purgingMock, setPurgingMock] = useState(false);
  const [purgeMockError, setPurgeMockError] = useState<string | null>(null);
  const [purgeMockSuccess, setPurgeMockSuccess] = useState<string | null>(null);
  const [wipeUsersOptionInModal, setWipeUsersOptionInModal] = useState(false);

  const [wipeUserModalOpen, setWipeUserModalOpen] = useState(false);
  const [wipingUsers, setWipingUsers] = useState(false);
  const [wipeConfirmInput, setWipeConfirmInput] = useState('');
  const [wipeAdminPassword, setWipeAdminPassword] = useState('');
  const [wipeAdminKeypass, setWipeAdminKeypass] = useState('');
  const [wipeModalError, setWipeModalError] = useState<string | null>(null);
  const [wipeModalSuccess, setWipeModalSuccess] = useState<string | null>(null);
  const [wipeOptions, setWipeOptions] = useState({
    wipeUsers: true,
    wipeRevenue: true,
    wipeVocabulary: true,
    wipeGames: true,
    preserveKidsGames: true,
    wipeExams: true,
    wipeSupport: true,
    wipeDevices: true,
  });

  // AI Connection Test State
  const [testingAi, setTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    provider?: string;
  } | null>(null);

  const handleTestAiConnection = async () => {
    setTestingAi(true);
    setAiTestResult(null);
    try {
      const selectedModel = settings.ai?.model || 'gpt-4o';
      let targetProvider = 'auto';
      if (selectedModel.includes('gemini')) targetProvider = 'gemini';
      else if (selectedModel.includes('gpt')) targetProvider = 'openai';

      const res: any = await api.post('/admin/ai/test-connection', {
        provider: targetProvider,
        model: selectedModel,
      });
      const data = res?.data || res;
      setAiTestResult(data);
    } catch (err: any) {
      setAiTestResult({
        success: false,
        message: err?.response?.data?.message || err?.message || 'Không thể kết nối đến máy chủ AI Gateway.',
      });
    } finally {
      setTestingAi(false);
    }
  };

  // Settings State State Record
  const [settings, setSettings] = useState<Record<string, any>>({
    general: {
      siteName: 'VocabFlow AI - Multi-Language Platform',
      tagline: 'Làm chủ từ vựng TOEIC với Spaced Repetition & AI Tutor',
      supportEmail: 'support@vocabflow.edu.vn',
      maintenanceMode: false,
      allowRegistration: true,
    },
    branding: {
      logoUrl: '/favicon.ico',
      accentColor: 'indigo',
      defaultDarkMode: true,
    },
    localization: {
      defaultLanguage: locale || 'vi',
      timezone: 'Asia/Ho_Chi_Minh',
      dateFormat: 'DD/MM/YYYY',
    },
    learning: {
      dailyGoalWords: 15,
      algorithm: 'FSRS_4_5',
      maxDailyReviews: 100,
      autoPronounce: true,
    },
    ai: {
      model: 'gpt-4o',
      temperature: 0.7,
      freeDailyQuota: 5,
      maxTokenCeiling: 2048,
    },
    notifications: {
      soundAlerts: true,
      enableEmail: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
    },
    support: {
      supportEnabled: true,
      autoAssignEnabled: true,
      slaMinutes: 30,
      offlineAutoReply: 'Cảm ơn bạn đã liên hệ. Đội ngũ CSKH sẽ phản hồi sớm nhất!',
    },
    feedback: {
      allowFeatureRequests: true,
      allowBugReports: true,
      requireLogin: true,
      publicRoadmapEnabled: true,
    },
    billing: {
      currency: 'VND',
      taxPercent: 0,
      trialDays: 7,
      gracePeriodDays: 3,
    },
    security: {
      sessionLifetimeHours: 72,
      loginRateLimit: 5,
      require2FAForAdmin: true,
    },
    users_roles: {
      defaultRole: 'USER',
      moderatorCanManageDecks: true,
    },
    feature_flags: {
      aiTutor: true,
      placementTest: true,
      communityDecks: true,
      voiceSpeech: true,
    },
    system: {
      maintenanceMode: false,
      cacheTtlSeconds: 3600,
      retentionDaysMessages: 3,
    },
  });

  // Fetch unified settings from backend
  useEffect(() => {
    let mounted = true;
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/settings');
        const data = res.data?.data || res.data;
        if (mounted && data && typeof data === 'object') {
          setSettings((prev) => ({
            ...prev,
            ...data,
          }));
        }
      } catch (err) {
        console.warn('Could not load remote admin settings, using local configuration defaults', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchSettings();
    return () => {
      mounted = false;
    };
  }, []);

  const handleUpdateField = (section: SettingSectionKey, field: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [field]: value,
      },
    }));
  };

  const handleSaveSection = async (section: SettingSectionKey) => {
    setSavingSection(section);
    setStatusMessage(null);
    try {
      const payload = settings[section];
      await api.post(`/admin/settings/${section}`, payload);
      setStatusMessage({
        text: locale === 'vi' ? `Đã lưu thành công nhóm cấu hình ${section.toUpperCase()}!` : `Successfully saved ${section.toUpperCase()} settings!`,
        type: 'success',
      });
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: any) {
      console.error(`Failed to save settings for ${section}:`, err);
      setStatusMessage({
        text: locale === 'vi' ? 'Không thể lưu cài đặt lúc này. Vui lòng thử lại.' : 'Failed to save settings. Please try again.',
        type: 'error',
      });
    } finally {
      setSavingSection(null);
    }
  };

  const handlePurgeMessages = async () => {
    setPurgingMessages(true);
    setPurgeMessagesError(null);
    setPurgeMessagesSuccess(null);
    try {
      const res: any = await api.post('/support/admin/cleanup-old-messages', {
        days: settings.system?.retentionDaysMessages || 3,
      });
      const msg = res?.data?.data?.message || res?.data?.message || (locale === 'vi' ? 'Đã dọn dẹp sạch tin nhắn cũ hơn 3 ngày thành công!' : 'Cleaned messages older than 3 days successfully!');
      setPurgeMessagesSuccess(msg);
      setStatusMessage({ text: msg, type: 'success' });
    } catch (err: any) {
      console.error('Purge error:', err);
      const errMsg = err?.response?.data?.message || err?.message || (locale === 'vi' ? 'Không thể dọn dẹp tin nhắn lúc này.' : 'Purge action failed.');
      setPurgeMessagesError(errMsg);
      setStatusMessage({ text: errMsg, type: 'error' });
    } finally {
      setPurgingMessages(false);
    }
  };

  const handlePurgeMockData = async (wipeUsers: boolean = false) => {
    setPurgingMock(true);
    setPurgeMockError(null);
    setPurgeMockSuccess(null);
    try {
      const res: any = await api.post('/admin/purge-mock-data', { wipeUsers });
      const info = res?.data?.data || res?.data || res;
      const msg =
        info?.message ||
        (wipeUsers
          ? (locale === 'vi'
            ? 'Đã xóa sạch toàn bộ data user thành công. Chỉ bảo lưu tài khoản Admin và các hằng số hệ thống.'
            : 'Wiped all user data successfully. Admin accounts & constants preserved.')
          : (locale === 'vi'
            ? 'Đã dọn sạch toàn bộ dữ liệu mẫu thành công. Chỉ giữ lại tài khoản người dùng và kho từ vựng.'
            : 'Cleaned all mock data successfully.'));
      setPurgeMockSuccess(msg);
      setStatusMessage({ text: msg, type: 'success' });
    } catch (err: any) {
      console.error('Purge mock data error:', err);
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        (locale === 'vi' ? 'Không thể xóa dữ liệu lúc này.' : 'Failed to purge data.');
      setPurgeMockError(errMsg);
      setStatusMessage({ text: errMsg, type: 'error' });
    } finally {
      setPurgingMock(false);
      setWipingUsers(false);
    }
  };

  const handleWipeUserData = async () => {
    setWipeModalError(null);
    setWipeModalSuccess(null);

    // 1. Validate confirmation keyword
    if (wipeConfirmInput.trim().toUpperCase() !== 'RESET') {
      const err = locale === 'vi' ? 'Vui lòng gõ chính xác chữ "RESET" để xác nhận thao tác tối cao.' : 'Please type exactly "RESET" to confirm.';
      setWipeModalError(err);
      return;
    }
    // 2. Validate admin password
    if (!wipeAdminPassword.trim()) {
      const err = locale === 'vi' ? 'Vui lòng nhập mật khẩu tài khoản Quản trị viên (Admin).' : 'Please enter your Admin password.';
      setWipeModalError(err);
      return;
    }
    // 3. Validate admin keypass
    if (!wipeAdminKeypass.trim()) {
      const err = locale === 'vi' ? 'Vui lòng nhập mã Keypass bảo mật tối cao (Admin Security Keypass).' : 'Please enter the Admin Security Keypass.';
      setWipeModalError(err);
      return;
    }

    setWipingUsers(true);
    try {
      const res: any = await api.post('/admin/system/reset-all-data', {
        confirmText: 'RESET',
        adminPassword: wipeAdminPassword.trim(),
        adminKeypass: wipeAdminKeypass.trim(),
        options: wipeOptions,
      });
      const data = res?.data?.data || res?.data || res;
      const successText = data?.message || (locale === 'vi'
        ? 'ĐÃ RESET DỮ LIỆU ĐƯỢC CHỌN THÀNH CÔNG! Tài khoản Admin và mã Keypass được bảo lưu an toàn.'
        : 'Selected system reset executed successfully! Admin accounts and keypass preserved.');
      
      setWipeModalSuccess(successText);
      setStatusMessage({ text: successText, type: 'success' });
    } catch (err: any) {
      console.error('System reset error:', err);
      const errMsg = err?.response?.data?.message || err?.message || (locale === 'vi' ? 'Reset All Data thất bại. Kiểm tra lại mật khẩu hoặc Keypass.' : 'System reset failed.');
      setWipeModalError(errMsg);
      setStatusMessage({ text: errMsg, type: 'error' });
    } finally {
      setWipingUsers(false);
    }
  };

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return SECTIONS;
    const q = searchQuery.toLowerCase();
    return SECTIONS.filter(
      (s) =>
        s.labelEn.toLowerCase().includes(q) ||
        s.labelVi.toLowerCase().includes(q) ||
        s.descEn.toLowerCase().includes(q) ||
        s.descVi.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const activeSectionConfig = SECTIONS.find((s) => s.id === activeSection) || SECTIONS[0];
  const ActiveIcon = activeSectionConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-indigo-500" />
            {t('adminSettings.title', 'Cài Đặt Hệ Thống & Cấu Hình Quản Trị')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t(
              'adminSettings.subtitle',
              'Trung tâm điều hành 13 phân hệ cấu hình: Nhận diện, AI Tutor, Học tập SRS, CSKH, Thanh toán và Bảo mật.'
            )}
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={locale === 'vi' ? 'Tìm cài đặt, tham số...' : 'Search configuration...'}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs"
          />
        </div>
      </div>

      {/* Global Status Banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold animate-in fade-in ${statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="underline ml-4 text-[11px]">
            {locale === 'vi' ? 'Đóng' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* Main Grid: Left Navigation / Right Form Plane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-1 bg-white dark:bg-slate-800/90 p-2 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
          <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {locale === 'vi' ? '13 Phân Hệ Quản Trị' : '13 Setting Domains'}
          </div>

          <div className="space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {filteredSections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-medium transition ${isActive
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <div className="truncate">
                    <div className="truncate">{locale === 'vi' ? sec.labelVi : sec.labelEn}</div>
                    <div className={`text-[10px] truncate ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {sec.id}
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredSections.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400">
                {locale === 'vi' ? 'Không tìm thấy phân hệ phù hợp.' : 'No settings sections found.'}
              </div>
            )}
          </div>
        </div>

        {/* Configuration Plane */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs p-6">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-700/60 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <ActiveIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {locale === 'vi' ? activeSectionConfig.labelVi : activeSectionConfig.labelEn}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {locale === 'vi' ? activeSectionConfig.descVi : activeSectionConfig.descEn}
                  </p>
                </div>
              </div>

              {/* Per-section Save Button */}
              <button
                type="button"
                onClick={() => handleSaveSection(activeSection)}
                disabled={savingSection === activeSection}
                className="btn-glass-primary !shadow-none px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 self-start sm:self-auto disabled:opacity-50"
              >
                {savingSection === activeSection ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>
                  {locale === 'vi' ? 'Lưu thay đổi phân hệ' : 'Save Section'}
                </span>
              </button>
            </div>

            {/* Form Fields by Section */}
            <div className="pt-6 space-y-5">
              {/* 1. GENERAL */}
              {activeSection === 'general' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-900 dark:text-white mb-1">
                      {locale === 'vi' ? 'Tên Ứng Dụng (Brand Site Name)' : 'Application Site Name'}
                    </label>
                    <input
                      type="text"
                      value={settings.general?.siteName || ''}
                      onChange={(e) => handleUpdateField('general', 'siteName', e.target.value)}
                      className="w-full sm:w-96 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 dark:text-white mb-1">
                      {locale === 'vi' ? 'Khẩu Hiệu / Tagline' : 'Platform Tagline'}
                    </label>
                    <input
                      type="text"
                      value={settings.general?.tagline || ''}
                      onChange={(e) => handleUpdateField('general', 'tagline', e.target.value)}
                      className="w-full sm:w-96 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 dark:text-white mb-1">
                      {locale === 'vi' ? 'Email Hỗ Trợ Chính Thức' : 'Official Support Email'}
                    </label>
                    <input
                      type="email"
                      value={settings.general?.supportEmail || ''}
                      onChange={(e) => handleUpdateField('general', 'supportEmail', e.target.value)}
                      className="w-full sm:w-96 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-t border-slate-100 dark:border-slate-700/50">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        {locale === 'vi' ? 'Chế độ bảo trì hệ thống' : 'Maintenance Mode'}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {locale === 'vi'
                          ? 'Khi kích hoạt, chỉ quản trị viên có quyền truy cập giao diện học tập.'
                          : 'When enabled, only administrative users can access the platform.'}
                      </p>
                    </div>
                    <AdminToggle
                      checked={!!settings.general?.maintenanceMode}
                      onChange={(checked) => handleUpdateField('general', 'maintenanceMode', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-t border-slate-100 dark:border-slate-700/50">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        {locale === 'vi' ? 'Cho phép học viên tự do đăng ký' : 'Allow Public User Registration'}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {locale === 'vi'
                          ? 'Mở cổng tiếp nhận học viên đăng ký tài khoản mới tự do.'
                          : 'Allow new students to register accounts publicly.'}
                      </p>
                    </div>
                    <AdminToggle
                      checked={!!settings.general?.allowRegistration}
                      onChange={(checked) => handleUpdateField('general', 'allowRegistration', checked)}
                    />
                  </div>
                </div>
              )}

              {/* 2. BRANDING */}
              {activeSection === 'branding' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-900 dark:text-white mb-1">
                      {locale === 'vi' ? 'Đường dẫn Logo URL' : 'Brand Logo URL'}
                    </label>
                    <input
                      type="text"
                      value={settings.branding?.logoUrl || ''}
                      onChange={(e) => handleUpdateField('branding', 'logoUrl', e.target.value)}
                      className="w-full sm:w-96 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 dark:text-white mb-1">
                      {locale === 'vi' ? 'Màu Sắc Chủ Đạo (Accent Theme)' : 'Primary Accent Palette'}
                    </label>
                    <div className="w-full sm:w-80">
                      <CustomSelect
                        value={settings.branding?.accentColor || 'indigo'}
                        onChange={(val) => handleUpdateField('branding', 'accentColor', val)}
                        options={[
                          { value: 'indigo', label: 'Indigo Royal (VocabFlow Standard)' },
                          { value: 'violet', label: 'Violet Electric (Modern AI)' },
                          { value: 'emerald', label: 'Emerald Mint (Academic High-Pass)' },
                          { value: 'amber', label: 'Amber Warmth (Dynamic)' },
                        ]}
                        size="sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-t border-slate-100 dark:border-slate-700/50">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        {locale === 'vi' ? 'Chế độ Tối (Dark Theme) mặc định' : 'Default to Dark Theme'}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {locale === 'vi'
                          ? 'Tự động kích hoạt Dark Mode cho người dùng chưa đăng nhập.'
                          : 'Automatically serve dark palette to unauthenticated visitors.'}
                      </p>
                    </div>
                    <AdminToggle
                      checked={!!settings.branding?.defaultDarkMode}
                      onChange={(checked) => handleUpdateField('branding', 'defaultDarkMode', checked)}
                    />
                  </div>
                </div>
              )}

              {/* 3. LOCALIZATION */}
              {activeSection === 'localization' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-900 dark:text-white mb-1">
                      {locale === 'vi' ? 'Ngôn Ngữ Hệ Thống Mặc Định' : 'Default Platform Language'}
                    </label>
                    <div className="w-full sm:w-80">
                      <CustomSelect
                        value={locale}
                        onChange={(val) => {
                          setLocale(val as any);
                          handleUpdateField('localization', 'defaultLanguage', val);
                        }}
                        options={[
                          { value: 'vi', label: 'Tiếng Việt - Ngôn ngữ chính', icon: <CountryFlag languageId="vi" size="xs" /> },
                          { value: 'en', label: 'English - Tiêu chuẩn quốc tế', icon: <CountryFlag languageId="en" size="xs" /> },
                        ]}
                        size="sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 dark:text-white mb-1">
                      {locale === 'vi' ? 'Múi Giờ Vận Hành' : 'Platform Timezone'}
                    </label>
                    <div className="w-full sm:w-80">
                      <CustomSelect
                        value={settings.localization?.timezone || 'Asia/Ho_Chi_Minh'}
                        onChange={(val) => handleUpdateField('localization', 'timezone', val)}
                        options={[
                          { value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho_Chi_Minh (UTC+07:00)' },
                          { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
                          { value: 'America/New_York', label: 'America/New_York (EST)' },
                        ]}
                        size="sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 dark:text-white mb-1">
                      {locale === 'vi' ? 'Định Dạng Ngày Tháng' : 'Date Format Standard'}
                    </label>
                    <div className="w-full sm:w-80">
                      <CustomSelect
                        value={settings.localization?.dateFormat || 'DD/MM/YYYY'}
                        onChange={(val) => handleUpdateField('localization', 'dateFormat', val)}
                        options={[
                          { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (Chuẩn Việt Nam)' },
                          { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (Chuẩn ISO 8601)' },
                          { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (Chuẩn US)' },
                        ]}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 4. LEARNING & SRS */}
              {activeSection === 'learning' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-900 dark:text-white mb-1">
                      {locale === 'vi' ? 'Thuật Toán Lặp Lại Ngắt Quãng (SRS)' : 'Spaced Repetition Algorithm'}
                    </label>
                    <div className="w-full sm:w-96">
                      <CustomSelect
                        value={settings.learning?.algorithm || 'FSRS_4_5'}
                        onChange={(val) => handleUpdateField('learning', 'algorithm', val)}
                        options={[
                          { value: 'FSRS_4_5', label: 'Free Spaced Repetition Scheduler (FSRS v4.5) - Tối ưu 2026' },
                          { value: 'SM_2', label: 'SuperMemo 2 (SM-2 Anki Standard)' },
                          { value: 'LEITNER', label: 'Hệ thống Hộp Leitner Cổ điển' },
                        ]}
                        size="sm"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {locale === 'vi'
                        ? 'FSRS v4.5 giúp giảm 30% số lần ôn tập không cần thiết so với SM-2 cũ.'
                        : 'FSRS v4.5 yields 30% fewer reviews with equivalent memory retention.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-900 dark:text-white mb-1">
                        {locale === 'vi' ? 'Mục tiêu từ mới mỗi ngày mặc định' : 'Default Daily New Words'}
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="50"
                        value={settings.learning?.dailyGoalWords || 15}
                        onChange={(e) => handleUpdateField('learning', 'dailyGoalWords', parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-900 dark:text-white mb-1">
                        {locale === 'vi' ? 'Giới hạn số thẻ ôn tập tối đa / ngày' : 'Max Daily Review Cards'}
                      </label>
                      <input
                        type="number"
                        min="20"
                        max="500"
                        value={settings.learning?.maxDailyReviews || 100}
                        onChange={(e) => handleUpdateField('learning', 'maxDailyReviews', parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-t border-slate-100 dark:border-slate-700/50">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        {locale === 'vi' ? 'Tự động phát âm từ vựng khi lật thẻ' : 'Auto Pronounce Card Words'}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {locale === 'vi'
                          ? 'Tự động đọc Audio giọng bản xứ Anh-Mỹ khi học viên lật mặt flashcard.'
                          : 'Play native US pronunciation audio when flipping flashcards.'}
                      </p>
                    </div>
                    <AdminToggle
                      checked={!!settings.learning?.autoPronounce}
                      onChange={(checked) => handleUpdateField('learning', 'autoPronounce', checked)}
                    />
                  </div>
                </div>
              )}

              {/* 5. AI TUTOR */}
              {activeSection === 'ai' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-900 dark:text-white mb-1">
                      {locale === 'vi' ? 'Mô hình AI Tutor Mặc Định' : 'Default AI Tutor LLM'}
                    </label>
                    <div className="w-full sm:w-96">
                      <CustomSelect
                        value={settings.ai?.model || 'gpt-4o'}
                        onChange={(val) => handleUpdateField('ai', 'model', val)}
                        options={[
                          { value: 'gpt-4o', label: 'OpenAI GPT-4o (Độ sắc bén & tốc độ cao)' },
                          { value: 'claude-3-5-sonnet', label: 'Anthropic Claude 3.5 Sonnet (Văn phong mượt mà)' },
                          { value: 'deepseek-v3', label: 'DeepSeek-V3 TOEIC Specialist (Chi phí tối ưu)' },
                          { value: 'gemini-1.5-pro', label: 'Google Gemini 1.5 Pro (Context cửa sổ lớn)' },
                        ]}
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* AI Connection Testing Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          <span>Kiểm Tra Kết Nối Mô Hình AI</span>
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Gửi gói tin ping thực tế tới API nhà cung cấp ({settings.ai?.model || 'gpt-4o'}) để đo độ trễ và kiểm tra hạn ngạch.
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={testingAi}
                        onClick={handleTestAiConnection}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0"
                      >
                        {testingAi ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang kiểm tra...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 text-amber-300" />
                            <span>Kiểm Tra Ping AI Ngay</span>
                          </>
                        )}
                      </button>
                    </div>

                    {aiTestResult && (
                      <div
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between font-bold animate-in fade-in ${
                          aiTestResult.success
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {aiTestResult.success ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                          )}
                          <span>{aiTestResult.message}</span>
                        </div>
                        {aiTestResult.latencyMs !== undefined && (
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded-lg bg-black/10 dark:bg-white/10 shrink-0">
                            {aiTestResult.latencyMs}ms
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-900 dark:text-white">
                        {locale === 'vi' ? 'Nhiệt độ sáng tạo (Temperature)' : 'Temperature'}: {settings.ai?.temperature ?? 0.7}
                      </label>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="1.0"
                      step="0.05"
                      value={settings.ai?.temperature ?? 0.7}
                      onChange={(e) => handleUpdateField('ai', 'temperature', parseFloat(e.target.value))}
                      className="w-full sm:w-80 accent-indigo-600"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      {locale === 'vi'
                        ? '0.7 là mức khuyến nghị cho giải thích từ vựng học thuật TOEIC chính xác.'
                        : '0.7 is recommended for calibrated academic accuracy without hallucination.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-900 dark:text-white mb-1">
                        {locale === 'vi' ? 'Hạn mức câu hỏi AI miễn phí / ngày' : 'Free AI Queries / Day'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={settings.ai?.freeDailyQuota ?? 5}
                        onChange={(e) => handleUpdateField('ai', 'freeDailyQuota', parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-900 dark:text-white mb-1">
                        {locale === 'vi' ? 'Trần Token Tối Đa Mỗi Yêu Cầu' : 'Max Token Safety Ceiling'}
                      </label>
                      <input
                        type="number"
                        min="512"
                        max="4096"
                        step="256"
                        value={settings.ai?.maxTokenCeiling ?? 2048}
                        onChange={(e) => handleUpdateField('ai', 'maxTokenCeiling', parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 6. NOTIFICATIONS */}
              {activeSection === 'notifications' && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        {locale === 'vi' ? 'Âm thanh thông báo (In-App Sound Chimes)' : 'In-App Sound Chimes'}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {locale === 'vi'
                          ? 'Phát chuông thông báo nhẹ nhàng khi có tin nhắn CSKH hoặc thông báo mới.'
                          : 'Play audio chimes when receiving live support messages or notifications.'}
                      </p>
                    </div>
                    <AdminToggle
                      checked={!!settings.notifications?.soundAlerts}
                      onChange={(checked) => handleUpdateField('notifications', 'soundAlerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        {locale === 'vi' ? 'Email tổng hợp tiến độ học tập tuần' : 'Weekly Email Digest'}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {locale === 'vi'
                          ? 'Gửi báo cáo tổng kết chuỗi học và số từ ghi nhớ vào sáng thứ Hai.'
                          : 'Send weekly mastery summaries to active students on Monday mornings.'}
                      </p>
                    </div>
                    <AdminToggle
                      checked={!!settings.notifications?.enableEmail}
                      onChange={(checked) => handleUpdateField('notifications', 'enableEmail', checked)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block font-bold text-slate-900 dark:text-white mb-1">
                        {locale === 'vi' ? 'Giờ yên tĩnh: Bắt đầu' : 'Quiet Hours: Start'}
                      </label>
                      <input
                        type="time"
                        value={settings.notifications?.quietHoursStart || '22:00'}
                        onChange={(e) => handleUpdateField('notifications', 'quietHoursStart', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-900 dark:text-white mb-1">
                        {locale === 'vi' ? 'Giờ yên tĩnh: Kết thúc' : 'Quiet Hours: End'}
                      </label>
                      <input
                        type="time"
                        value={settings.notifications?.quietHoursEnd || '07:00'}
                        onChange={(e) => handleUpdateField('notifications', 'quietHoursEnd', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 7. SUPPORT */}
              {activeSection === 'support' && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        {locale === 'vi' ? 'Bật Kênh CSKH Trực Tiếp' : 'Enable Customer Support Gateway'}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {locale === 'vi'
                          ? 'Hiển thị nút chat hỗ trợ trực tuyến trên toàn bộ giao diện học viên.'
                          : 'Render live support chat widget across the student web application.'}
                      </p>
                    </div>
                    <AdminToggle
                      checked={!!settings.support?.supportEnabled}
                      onChange={(checked) => handleUpdateField('support', 'supportEnabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        {locale === 'vi' ? 'Tự động phân bổ hội thoại cho CSKH online' : 'Auto Assign Incoming Chats'}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {locale === 'vi'
                          ? 'Tự động gán ticket mới cho nhân viên Admin/Support đang trực tuyến.'
                          : 'Assign incoming tickets round-robin to currently active administrators.'}
                      </p>
                    </div>
                    <AdminToggle
                      checked={!!settings.support?.autoAssignEnabled}
                      onChange={(checked) => handleUpdateField('support', 'autoAssignEnabled', checked)}
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 dark:text-white mb-1">
                      {locale === 'vi' ? 'Mục tiêu thời gian phản hồi SLA (Phút)' : 'SLA Target Response Time (Minutes)'}
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="1440"
                      value={settings.support?.slaMinutes || 30}
                      onChange={(e) => handleUpdateField('support', 'slaMinutes', parseInt(e.target.value, 10))}
                      className="w-40 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 dark:text-white mb-1">
                      {locale === 'vi' ? 'Tin nhắn trả lời tự động ngoài giờ làm việc' : 'Offline Auto-Reply Message'}
                    </label>
                    <textarea
                      rows={3}
                      value={settings.support?.offlineAutoReply || ''}
                      onChange={(e) => handleUpdateField('support', 'offlineAutoReply', e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                </div>
              )}

              {/* 8. FEEDBACK */}
              {activeSection === 'feedback' && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        {locale === 'vi' ? 'Tiếp nhận Yêu cầu Tính năng (Feature Requests)' : 'Allow Feature Requests'}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {locale === 'vi'
                          ? 'Cho phép học viên gửi đề xuất tính năng mới trực tiếp từ thanh công cụ.'
                          : 'Permit users to submit product feature requests.'}
                      </p>
                    </div>
                    <AdminToggle
                      checked={!!settings.feedback?.allowFeatureRequests}
                      onChange={(checked) => handleUpdateField('feedback', 'allowFeatureRequests', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        {locale === 'vi' ? 'Tiếp nhận Báo lỗi Hệ thống (Bug Reports)' : 'Allow Bug Reports'}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {locale === 'vi'
                          ? 'Học viên có thể báo cáo lỗi sai nghĩa từ vựng hoặc trục trặc giao diện.'
                          : 'Permit users to file technical bug reports.'}
                      </p>
                    </div>
                    <AdminToggle
                      checked={!!settings.feedback?.allowBugReports}
                      onChange={(checked) => handleUpdateField('feedback', 'allowBugReports', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        {locale === 'vi' ? 'Bật Bảng Lộ Trình Công Khai (Public Roadmap)' : 'Public Community Roadmap'}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {locale === 'vi'
                          ? 'Cho phép cộng đồng xem các tính năng đang phát triển và bình chọn (upvote).'
                          : 'Show upcoming roadmap items and permit community voting.'}
                      </p>
                    </div>
                    <AdminToggle
                      checked={!!settings.feedback?.publicRoadmapEnabled}
                      onChange={(checked) => handleUpdateField('feedback', 'publicRoadmapEnabled', checked)}
                    />
                  </div>
                </div>
              )}

              {/* 9. BILLING */}
              {activeSection === 'billing' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-900 dark:text-white mb-1">
                      {locale === 'vi' ? 'Tiền Tệ Thanh Toán Chính' : 'Primary Billing Currency'}
                    </label>
                    <div className="w-full sm:w-80">
                      <CustomSelect
                        value={settings.billing?.currency || 'VND'}
                        onChange={(val) => handleUpdateField('billing', 'currency', val)}
                        options={[
                          { value: 'VND', label: 'Việt Nam Đồng (VND / ₫) - VietQR' },
                          { value: 'USD', label: 'US Dollar (USD / $) - Stripe' },
                        ]}
                        size="sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-slate-900 dark:text-white mb-1">
                        {locale === 'vi' ? 'Thuế GTGT VAT (%)' : 'VAT Tax Rate (%)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="25"
                        value={settings.billing?.taxPercent ?? 0}
                        onChange={(e) => handleUpdateField('billing', 'taxPercent', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-900 dark:text-white mb-1">
                        {locale === 'vi' ? 'Số ngày dùng thử Free Trial' : 'Trial Days'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={settings.billing?.trialDays ?? 7}
                        onChange={(e) => handleUpdateField('billing', 'trialDays', parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-900 dark:text-white mb-1">
                        {locale === 'vi' ? 'Thời gian ân hạn Grace (Ngày)' : 'Grace Period (Days)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="14"
                        value={settings.billing?.gracePeriodDays ?? 3}
                        onChange={(e) => handleUpdateField('billing', 'gracePeriodDays', parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 10. SECURITY */}
              {activeSection === 'security' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-900 dark:text-white mb-1">
                        {locale === 'vi' ? 'Thời hạn phiên đăng nhập (Giờ)' : 'Session Lifetime (Hours)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="720"
                        value={settings.security?.sessionLifetimeHours ?? 72}
                        onChange={(e) => handleUpdateField('security', 'sessionLifetimeHours', parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-900 dark:text-white mb-1">
                        {locale === 'vi' ? 'Giới hạn lần thử đăng nhập sai' : 'Login Rate Limit Threshold'}
                      </label>
                      <input
                        type="number"
                        min="3"
                        max="20"
                        value={settings.security?.loginRateLimit ?? 5}
                        onChange={(e) => handleUpdateField('security', 'loginRateLimit', parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-t border-slate-100 dark:border-slate-700/50">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        {locale === 'vi' ? 'Bắt buộc xác thực 2 bước (2FA) cho Admin' : 'Require 2FA for Administrators'}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {locale === 'vi'
                          ? 'Bắt buộc các tài khoản ADMIN và SUPER_ADMIN phải cài đặt OTP Authenticator.'
                          : 'Enforce two-factor authenticator setup for administrative roles.'}
                      </p>
                    </div>
                    <AdminToggle
                      checked={!!settings.security?.require2FAForAdmin}
                      onChange={(checked) => handleUpdateField('security', 'require2FAForAdmin', checked)}
                    />
                  </div>
                </div>
              )}

              {/* 11. USERS & ROLES */}
              {activeSection === 'users_roles' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-900 dark:text-white mb-1">
                      {locale === 'vi' ? 'Vai Trò Mặc Định Khi Tạo Mới' : 'Default Registered Role'}
                    </label>
                    <div className="w-full sm:w-80">
                      <CustomSelect
                        value={settings.users_roles?.defaultRole || 'USER'}
                        onChange={(val) => handleUpdateField('users_roles', 'defaultRole', val)}
                        options={[
                          { value: 'USER', label: 'USER (Học viên tiêu chuẩn)' },
                          { value: 'PREMIUM_USER', label: 'PREMIUM_USER (Học viên trả phí mặc định)' },
                        ]}
                        size="sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-t border-slate-100 dark:border-slate-700/50">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        {locale === 'vi' ? 'Moderator có quyền duyệt bộ từ cộng đồng' : 'Moderator Can Moderate Decks'}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {locale === 'vi'
                          ? 'Cho phép cấp quyền cho kiểm duyệt viên phê duyệt các bộ thẻ đóng góp.'
                          : 'Allow moderators to approve or reject submitted community flashcard decks.'}
                      </p>
                    </div>
                    <AdminToggle
                      checked={!!settings.users_roles?.moderatorCanManageDecks}
                      onChange={(checked) => handleUpdateField('users_roles', 'moderatorCanManageDecks', checked)}
                    />
                  </div>
                </div>
              )}

              {/* 12. FEATURE FLAGS */}
              {activeSection === 'feature_flags' && (
                <div className="space-y-3 text-xs">
                  {[
                    { key: 'aiTutor', labelVi: 'Trợ lý AI Tutor tương tác trực tiếp', labelEn: 'AI Tutor Interactive Chat' },
                    { key: 'placementTest', labelVi: 'Bài thi kiểm tra đầu vào TOEIC Placement Test', labelEn: 'Placement Diagnostic Test' },
                    { key: 'communityDecks', labelVi: 'Bộ thẻ đóng góp cộng đồng (Community Decks)', labelEn: 'Community Flashcard Decks' },
                    { key: 'voiceSpeech', labelVi: 'Nhận diện giọng nói & Chấm điểm phát âm', labelEn: 'Voice Speech Recognition & Scoring' },
                  ].map((flag) => (
                    <div
                      key={flag.key}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
                    >
                      <span className="font-bold text-slate-900 dark:text-white">
                        {locale === 'vi' ? flag.labelVi : flag.labelEn}
                      </span>
                      <AdminToggle
                        checked={!!settings.feature_flags?.[flag.key]}
                        onChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            feature_flags: {
                              ...(prev.feature_flags || {}),
                              [flag.key]: checked,
                            },
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* 13. SYSTEM & MAINTENANCE */}
              {activeSection === 'system' && (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-900 dark:text-white mb-1">
                        {locale === 'vi' ? 'Bộ nhớ đệm Redis Cache TTL (Giây)' : 'Cache TTL (Seconds)'}
                      </label>
                      <input
                        type="number"
                        min="60"
                        max="86400"
                        value={settings.system?.cacheTtlSeconds ?? 3600}
                        onChange={(e) => handleUpdateField('system', 'cacheTtlSeconds', parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-900 dark:text-white mb-1">
                        {locale === 'vi' ? 'Thời hạn lưu tin nhắn CSKH (Ngày)' : 'Support Message Retention (Days)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={settings.system?.retentionDaysMessages ?? 3}
                        onChange={(e) => handleUpdateField('system', 'retentionDaysMessages', parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 space-y-4">
                    {/* Purge Messages */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Trash2 className="w-4 h-4 text-rose-500" />
                          {locale === 'vi' ? 'Dọn dẹp nội dung tin nhắn CSKH cũ' : 'Purge Old Support Messages'}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-lg">
                          {locale === 'vi'
                            ? 'Xóa toàn bộ nội dung tin nhắn cũ hơn thời hạn quy định nhằm giải phóng Database. Bảo lưu 100% hồ sơ ticket của học viên.'
                            : 'Purges chat content older than the retention threshold while preserving all tickets.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPurgeModalOpen(true)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 shadow-xs transition shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{locale === 'vi' ? 'Dọn dẹp tin nhắn > 3 ngày' : 'Purge Messages'}</span>
                      </button>
                    </div>

                    {/* Purge Mock Operational Data */}
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-amber-400" />
                          {locale === 'vi' ? 'Dọn Sạch Dữ Liệu Vận Hành Mẫu' : 'Operational Mock Data Purge'}
                        </h4>
                        <p className="text-[11px] text-amber-200/80 mt-1 max-w-lg">
                          {locale === 'vi'
                            ? 'Xóa toàn bộ tin nhắn mẫu, ticket hỗ trợ mẫu, feedback mẫu và giao dịch giả lập. Bảo lưu an toàn toàn bộ tài khoản người dùng và kho từ vựng.'
                            : 'Permanently deletes mock operational tickets, feedbacks, and simulated payments. User accounts and vocabulary are safely kept intact.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setWipeUsersOptionInModal(false);
                          setPurgeMockModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 shadow-xs transition shrink-0"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{locale === 'vi' ? 'Xóa data mẫu vận hành' : 'Purge Mock Data'}</span>
                      </button>
                    </div>

                    {/* DANGER ZONE: Wipe All User Data (Keep Admin Only) */}
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            {locale === 'vi' ? 'VÙNG NGUY HIỂM' : 'DANGER ZONE'}
                          </span>
                          <h4 className="font-bold text-rose-300 flex items-center gap-1.5">
                            <UserX className="w-4 h-4 text-rose-400" />
                            {locale === 'vi' ? 'Xóa Toàn Bộ Data User (Chỉ Giữ Lại Tài Khoản & Quyền Admin)' : 'Wipe All User Data (Keep Admin Accounts Only)'}
                          </h4>
                        </div>
                        <p className="text-[11px] text-rose-200/80 mt-1.5 max-w-xl leading-relaxed">
                          {locale === 'vi'
                            ? 'Xóa sạch 100% tài khoản học viên, tiến độ học, từ vựng cá nhân, bộ thẻ cộng đồng, bài thi, đơn hàng... HỆ THỐNG CHỈ GIỮ LẠI TÀI KHOẢN VÀ QUYỀN ADMIN (Admin/Super Admin) cùng các hằng số không thể xóa (Kho từ điển chuẩn, Gói cước, Cấu hình).'
                            : 'Permanently deletes all non-admin learner accounts, study progress, decks, and orders. ONLY Administrator accounts and system constants are preserved.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setWipeConfirmInput('');
                          setWipeUserModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 shadow-xs transition shrink-0"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>{locale === 'vi' ? 'Xóa toàn bộ data User (Chỉ giữ Admin)' : 'Wipe User Data (Keep Admin)'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Purge Messages Modal */}
      {/* 1. Purge Messages Modal */}
      {purgeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {locale === 'vi' ? 'Xác nhận dọn dẹp tin nhắn CSKH' : 'Confirm Support Messages Purge'}
                </h3>
                <p className="text-xs text-slate-400">
                  {locale === 'vi' ? 'Quyền thực thi dành cho Quản trị viên' : 'Administrator Authorization Required'}
                </p>
              </div>
            </div>

            {/* In-Modal Feedback */}
            {purgeMessagesError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-semibold flex items-start gap-2.5 animate-shake">
                <AlertOctagon className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-rose-200">{locale === 'vi' ? 'Lỗi thao tác:' : 'Operation Error:'}</p>
                  <p className="text-[11px] text-rose-300/90 mt-0.5">{purgeMessagesError}</p>
                </div>
              </div>
            )}

            {purgeMessagesSuccess ? (
              <div className="py-4 px-2 flex flex-col items-center justify-center text-center space-y-3 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">
                    {locale === 'vi' ? 'Dọn dẹp thành công!' : 'Cleaned Successfully!'}
                  </h4>
                  <p className="text-xs text-emerald-300/90 leading-relaxed max-w-sm">
                    {purgeMessagesSuccess}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPurgeModalOpen(false);
                    setPurgeMessagesError(null);
                    setPurgeMessagesSuccess(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                >
                  {locale === 'vi' ? 'Đóng thông báo' : 'Close'}
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {locale === 'vi'
                    ? `Thao tác này sẽ xóa vĩnh viễn nội dung tin nhắn được gửi cũ hơn ${settings.system?.retentionDaysMessages || 3} ngày. Danh sách hồ sơ ticket vẫn được bảo lưu an toàn.`
                    : `This action will permanently delete message contents older than ${settings.system?.retentionDaysMessages || 3} days. Tickets and audit records remain intact.`}
                </p>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={purgingMessages}
                    onClick={() => {
                      setPurgeModalOpen(false);
                      setPurgeMessagesError(null);
                      setPurgeMessagesSuccess(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl bg-slate-800 transition disabled:opacity-50"
                  >
                    {locale === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    disabled={purgingMessages}
                    onClick={handlePurgeMessages}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-xl transition flex items-center gap-1.5"
                  >
                    {purgingMessages && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{purgingMessages ? (locale === 'vi' ? 'Đang dọn dẹp...' : 'Purging...') : (locale === 'vi' ? 'Xác nhận dọn dẹp' : 'Confirm Purge')}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 2. Purge Mock Data Modal */}
      {purgeMockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${wipeUsersOptionInModal ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {wipeUsersOptionInModal ? <UserX className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {wipeUsersOptionInModal
                    ? (locale === 'vi' ? 'Xác nhận xóa sạch data user (Chỉ giữ Admin)' : 'Purge All User Data (Keep Admin Only)')
                    : (locale === 'vi' ? 'Xác nhận xóa dữ liệu vận hành mẫu' : 'Purge Operational Mock Data')}
                </h3>
                <p className="text-xs text-slate-400">
                  {locale === 'vi' ? 'Quyền thực thi dành cho Quản trị viên' : 'Administrator Authorization Required'}
                </p>
              </div>
            </div>

            {/* In-Modal Feedback Alerts */}
            {purgeMockError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-semibold flex items-start gap-2.5 animate-shake">
                <AlertOctagon className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-rose-200">{locale === 'vi' ? 'Lỗi thao tác:' : 'Operation Error:'}</p>
                  <p className="text-[11px] text-rose-300/90 mt-0.5">{purgeMockError}</p>
                </div>
              </div>
            )}

            {purgeMockSuccess ? (
              <div className="py-4 px-2 flex flex-col items-center justify-center text-center space-y-3 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">
                    {locale === 'vi' ? 'Dọn dẹp thành công!' : 'Operation Completed Successfully!'}
                  </h4>
                  <p className="text-xs text-emerald-300/90 leading-relaxed max-w-sm">
                    {purgeMockSuccess}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPurgeMockModalOpen(false);
                    setPurgeMockError(null);
                    setPurgeMockSuccess(null);
                    setWipeUsersOptionInModal(false);
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                >
                  {locale === 'vi' ? 'Đóng thông báo' : 'Close'}
                </button>
              </div>
            ) : (
              <>
                {/* Wipe User Data Option Selector / Toggle */}
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={purgingMock}
                      checked={wipeUsersOptionInModal}
                      onChange={(e) => setWipeUsersOptionInModal(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer disabled:opacity-50"
                    />
                    <div>
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        {locale === 'vi' ? 'XÓA LUÔN TOÀN BỘ DATA USER (Chỉ giữ lại tài khoản & quyền Admin)' : 'Wipe all user data as well (Preserve Admin only)'}
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          {locale === 'vi' ? 'Cực mạnh' : 'Nuclear'}
                        </span>
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        {locale === 'vi'
                          ? 'Tích chọn mục này sẽ xóa sạch 100% tài khoản học viên và tiến độ học trong DB. Chỉ bảo lưu an toàn tài khoản Quản trị viên và kho từ vựng.'
                          : 'Checking this will wipe all non-admin user accounts and progress from DB. Only Admin accounts and Vocabulary remain.'}
                      </p>
                    </div>
                  </label>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed space-y-2">
                  <p>
                    {locale === 'vi'
                      ? 'Thao tác này sẽ xóa vĩnh viễn dữ liệu theo danh mục sau:'
                      : 'Permanently deletes following data categories:'}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1 text-[11px]">
                    <li>{locale === 'vi' ? 'Xóa toàn bộ tin nhắn & tickets hỗ trợ mẫu' : 'Delete all mock support tickets & messages'}</li>
                    <li>{locale === 'vi' ? 'Xóa toàn bộ ý kiến đóng góp & báo lỗi mẫu' : 'Delete all mock feedback items'}</li>
                    <li>{locale === 'vi' ? 'Xóa toàn bộ đơn hàng giao dịch giả lập' : 'Delete mock payment orders'}</li>
                    <li>{locale === 'vi' ? 'Xóa toàn bộ thông báo hệ thống mẫu & phiên học thử' : 'Delete mock notifications & test sessions'}</li>
                    {wipeUsersOptionInModal && (
                      <li className="text-rose-400 font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{locale === 'vi' ? 'XÓA TOÀN BỘ tài khoản học viên (Users), tiến độ từ vựng, deck cá nhân, bài thi' : 'DELETE ALL learner accounts, vocab progress, decks, exam attempts'}</span>
                      </li>
                    )}
                  </ul>

                  {wipeUsersOptionInModal ? (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-semibold text-[11px] leading-relaxed flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{locale === 'vi'
                        ? 'BẢO LƯU AN TOÀN: 100% Tài khoản & quyền Admin (Super Admin/Admin) và toàn bộ hằng số hệ thống (Kho từ vựng chuẩn, Gói cước, Cấu hình).'
                        : 'SAFE: 100% Admin accounts & roles, and system constants (Vocabulary, Plans, Configs) are preserved.'}</span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-[11px] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{locale === 'vi' ? 'BẢO LƯU AN TOÀN: 100% Người dùng (Users) và Kho từ vựng (Vocabulary).' : 'SAFE: All Users and Vocabulary records are untouched.'}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={purgingMock}
                    onClick={() => {
                      setPurgeMockModalOpen(false);
                      setPurgeMockError(null);
                      setPurgeMockSuccess(null);
                      setWipeUsersOptionInModal(false);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl bg-slate-800 transition disabled:opacity-50"
                  >
                    {locale === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    disabled={purgingMock}
                    onClick={() => handlePurgeMockData(wipeUsersOptionInModal)}
                    className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 ${wipeUsersOptionInModal ? 'bg-rose-600 hover:bg-rose-500' : 'bg-amber-600 hover:bg-amber-500'
                      }`}
                  >
                    {purgingMock && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>
                      {purgingMock
                        ? (locale === 'vi' ? 'Đang thực thi dọn dẹp...' : 'Purging...')
                        : wipeUsersOptionInModal
                          ? (locale === 'vi' ? 'Xác nhận xóa data user (Giữ Admin)' : 'Confirm Wipe Users (Keep Admin)')
                          : (locale === 'vi' ? 'Xác nhận xóa sạch data mẫu' : 'Confirm Mock Purge')}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 3. DEDICATED WIPE ALL USER DATA MODAL */}
      {wipeUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{locale === 'vi' ? 'Xóa Toàn Bộ Data User Trong Database' : 'Wipe All User Data in Database'}</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-rose-500 text-white">
                    {locale === 'vi' ? 'Nguy hiểm' : 'Danger'}
                  </span>
                </h3>
                <p className="text-xs text-rose-300/80">
                  {locale === 'vi' ? 'Chỉ bảo lưu tài khoản Quản trị viên (Admin) và hằng số hệ thống' : 'Preserves only Admin accounts and system constants'}
                </p>
              </div>
            </div>

            {/* In-Modal Feedback Alerts */}
            {wipeModalError && (
              <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-semibold flex items-start gap-2.5 animate-shake">
                <AlertOctagon className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-rose-200">{locale === 'vi' ? 'Không thể thực thi lệnh xóa:' : 'Execution Failed:'}</p>
                  <p className="text-[11px] text-rose-300/90 mt-0.5">{wipeModalError}</p>
                </div>
              </div>
            )}

            {/* In-Modal Dedicated Success Screen */}
            {wipeModalSuccess ? (
              <div className="py-6 px-4 flex flex-col items-center justify-center text-center space-y-4 animate-scale-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border-2 border-emerald-500/40 shadow-lg shadow-emerald-950/40">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-base font-bold text-white">
                    {locale === 'vi' ? 'Thao Tác Thực Thi Thành Công!' : 'Action Executed Successfully!'}
                  </h4>
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-medium leading-relaxed max-w-md mx-auto">
                    {wipeModalSuccess}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setWipeUserModalOpen(false);
                    setWipeConfirmInput('');
                    setWipeAdminPassword('');
                    setWipeAdminKeypass('');
                    setWipeModalError(null);
                    setWipeModalSuccess(null);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md shadow-emerald-900/30 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{locale === 'vi' ? 'Đã hiểu & Đóng bảng điều khiển' : 'Acknowledge & Close'}</span>
                </button>
              </div>
            ) : (
              <>
                {/* Granular Selection Checkboxes */}
                <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-200">
                      {locale === 'vi' ? 'Chọn các danh mục dữ liệu cần xóa sạch:' : 'Select data domains to wipe:'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setWipeOptions({
                          wipeUsers: true,
                          wipeRevenue: true,
                          wipeVocabulary: true,
                          wipeGames: true,
                          preserveKidsGames: true,
                          wipeExams: true,
                          wipeSupport: true,
                          wipeDevices: true,
                        })
                      }
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      {locale === 'vi' ? 'Chọn tất cả' : 'Select all'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-900 transition">
                      <input
                        type="checkbox"
                        checked={wipeOptions.wipeUsers}
                        onChange={(e) => setWipeOptions({ ...wipeOptions, wipeUsers: e.target.checked })}
                        className="rounded border-slate-700 text-rose-500 focus:ring-rose-500"
                      />
                      <span className="text-slate-300 font-medium">Học viên & Tiến độ học tập</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-900 transition">
                      <input
                        type="checkbox"
                        checked={wipeOptions.wipeRevenue}
                        onChange={(e) => setWipeOptions({ ...wipeOptions, wipeRevenue: e.target.checked })}
                        className="rounded border-slate-700 text-rose-500 focus:ring-rose-500"
                      />
                      <span className="text-slate-300 font-medium">Doanh thu & Đơn hàng (về 0 ₫)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-900 transition">
                      <input
                        type="checkbox"
                        checked={wipeOptions.wipeVocabulary}
                        onChange={(e) => setWipeOptions({ ...wipeOptions, wipeVocabulary: e.target.checked })}
                        className="rounded border-slate-700 text-rose-500 focus:ring-rose-500"
                      />
                      <span className="text-slate-300 font-medium">Kho từ vựng & Bài tập</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-900 transition">
                      <input
                        type="checkbox"
                        checked={wipeOptions.wipeExams}
                        onChange={(e) => setWipeOptions({ ...wipeOptions, wipeExams: e.target.checked })}
                        className="rounded border-slate-700 text-rose-500 focus:ring-rose-500"
                      />
                      <span className="text-slate-300 font-medium">Đề thi & Quizzes</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-900 transition">
                      <input
                        type="checkbox"
                        checked={wipeOptions.wipeGames}
                        onChange={(e) => setWipeOptions({ ...wipeOptions, wipeGames: e.target.checked })}
                        className="rounded border-slate-700 text-rose-500 focus:ring-rose-500"
                      />
                      <span className="text-slate-300 font-medium">Phòng game & Lịch sử đấu</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-900 transition">
                      <input
                        type="checkbox"
                        checked={wipeOptions.wipeSupport}
                        onChange={(e) => setWipeOptions({ ...wipeOptions, wipeSupport: e.target.checked })}
                        className="rounded border-slate-700 text-rose-500 focus:ring-rose-500"
                      />
                      <span className="text-slate-300 font-medium">Tin nhắn & Phản hồi CSKH</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-900 transition">
                      <input
                        type="checkbox"
                        checked={wipeOptions.wipeDevices}
                        onChange={(e) => setWipeOptions({ ...wipeOptions, wipeDevices: e.target.checked })}
                        className="rounded border-slate-700 text-rose-500 focus:ring-rose-500"
                      />
                      <span className="text-slate-300 font-medium">Phiên & Thiết bị đăng nhập</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 transition">
                      <input
                        type="checkbox"
                        checked={wipeOptions.preserveKidsGames}
                        onChange={(e) => setWipeOptions({ ...wipeOptions, preserveKidsGames: e.target.checked })}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-emerald-300 font-semibold text-[11px]">GIỮ LẠI Game/Học liệu Trẻ Em</span>
                    </label>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-semibold space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>{locale === 'vi' ? 'DỮ LIỆU ĐƯỢC BẢO LƯU TUYỆT ĐỐI THEO CHÍNH SÁCH:' : 'ABSOLUTELY SAFE & PRESERVED DATA:'}</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-emerald-200/90 pl-1 font-normal">
                    <li>{locale === 'vi' ? 'Tài khoản Quản trị viên (Admin & Super Admin) kèm mật khẩu đăng nhập' : 'Administrator accounts (Admin & Super Admin) with credentials & permissions'}</li>
                    <li>{locale === 'vi' ? 'Mã khóa bảo mật hệ thống độc lập (Admin Security Keypass)' : 'Independent Admin Security Keypass'}</li>
                    {wipeOptions.preserveKidsGames && <li>{locale === 'vi' ? 'Nội dung Game Trẻ Em & Học liệu Kids' : 'Kids Game content & learning resources'}</li>}
                  </ul>
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                      1. {locale === 'vi'
                        ? 'Để xác nhận, vui lòng nhập chính xác chữ "RESET":'
                        : 'To confirm, please type exactly "RESET" below:'}
                    </label>
                    <input
                      type="text"
                      disabled={wipingUsers}
                      value={wipeConfirmInput}
                      onChange={(e) => {
                        setWipeConfirmInput(e.target.value);
                        if (wipeModalError) setWipeModalError(null);
                      }}
                      placeholder="RESET"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-hidden focus:border-rose-500 font-mono tracking-wider disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                      2. {locale === 'vi' ? 'Nhập mật khẩu Admin của bạn:' : 'Admin Password:'}
                    </label>
                    <input
                      type="password"
                      disabled={wipingUsers}
                      value={wipeAdminPassword}
                      onChange={(e) => {
                        setWipeAdminPassword(e.target.value);
                        if (wipeModalError) setWipeModalError(null);
                      }}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-hidden focus:border-rose-500 font-mono disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 font-semibold block mb-1 flex items-center justify-between">
                      <span>3. {locale === 'vi' ? 'Nhập mã Keypass bảo mật tối cao (Admin Security Keypass):' : 'Admin Security Keypass:'}</span>
                    </label>
                    <input
                      type="password"
                      disabled={wipingUsers}
                      value={wipeAdminKeypass}
                      onChange={(e) => {
                        setWipeAdminKeypass(e.target.value);
                        if (wipeModalError) setWipeModalError(null);
                      }}
                      placeholder="••••••••••••"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-hidden focus:border-rose-500 font-mono disabled:opacity-50"
                    />
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 mt-2 space-y-1 leading-relaxed">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{locale === 'vi' ? 'Mã khóa ủy quyền bảo vệ cấp độ máy chủ' : 'Server-level administrative authorization'}</span>
                        </span>
                        <a
                          href="/admin/security?tab=credentials"
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center gap-1 hover:underline text-[10px]"
                        >
                          <span>{locale === 'vi' ? 'Đổi hoặc đặt lại Keypass' : 'Manage Keypass'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {locale === 'vi'
                          ? 'Keypass được thiết lập độc lập tại menu Bảo Mật & Keypass (Rủi Ro). Đây là chốt chặn bảo vệ cuối cùng trước các hành động xóa dữ liệu toàn sàn.'
                          : 'Keypass is configured independently at Security & Keypass console. Acts as final safeguard for destructive commands.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={wipingUsers}
                    onClick={() => {
                      setWipeUserModalOpen(false);
                      setWipeConfirmInput('');
                      setWipeAdminPassword('');
                      setWipeAdminKeypass('');
                      setWipeModalError(null);
                      setWipeModalSuccess(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl bg-slate-800 transition disabled:opacity-50"
                  >
                    {locale === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    disabled={
                      wipingUsers ||
                      wipeConfirmInput.trim().toUpperCase() !== 'RESET' ||
                      !wipeAdminPassword.trim() ||
                      !wipeAdminKeypass.trim()
                    }
                    onClick={handleWipeUserData}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition flex items-center gap-1.5 shadow-md shadow-rose-900/30"
                  >
                    {wipingUsers ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>{locale === 'vi' ? 'Đang kiểm tra & thực thi xóa sạch...' : 'Verifying & Executing...'}</span>
                      </>
                    ) : (
                      <span>{locale === 'vi' ? 'Xác nhận xóa sạch data toàn sàn' : 'Execute Nuclear Reset All Data'}</span>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsPage;
