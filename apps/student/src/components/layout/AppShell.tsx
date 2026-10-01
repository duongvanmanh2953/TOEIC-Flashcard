import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, isProUser } from '../../contexts/AuthContext';
import { useTranslation } from '../../i18n';
import { LiquidBackground } from '../common/LiquidBackground';
import { ModalPortal } from '../common/ModalPortal';
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  BrainCircuit,
  Award,
  Settings,
  LogOut,
  Moon,
  Sun,
  Flame,
  AlertCircle,
  Menu,
  X,
  Compass,
  Bookmark,
  Share2,
  HelpCircle,
  Crown,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  UserCheck,
  Lock,
  LockOpen,
  MessageCircle,
  Headphones,
  RotateCcw,
  Send,
  Bot,
  CheckCheck,
  Bell,
  MessageSquare,
  Trophy,
  Mic,
  Gamepad2,
  LogIn,
  Baby,
  Globe,
  GraduationCap,
  Zap,
  StickyNote,
} from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';
import { LanguageSwitcher } from '../language/LanguageSwitcher';
import { CountryFlag } from '../language/CountryFlag';
import { useLearningContext } from '../../contexts/LearningContext';
import { isKidSupportedLanguage, getLanguage } from '../../config/languages';
import api from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { VirtualChatPane } from '../chat/VirtualChatPane';
import { ChatDrawer, ChatContextPayload } from '../chat/ChatDrawer';
import { confirmModal } from '../common/ConfirmDialog';
import { QuickNoteModal } from '../notes/QuickNoteModal';

export const AppShell: React.FC = () => {
  const { activeLanguage, activeProfile, switchLanguage } = useLearningContext();
  const { user, logout, theme, toggleTheme, promptLogin } = useAuth();
  const { t } = useTranslation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const location = useLocation();
  const isFullHeightPage =
    location.pathname.startsWith('/coach') ||
    location.pathname.startsWith('/ai-tutor') ||
    location.pathname.startsWith('/notes') ||
    location.pathname.startsWith('/community') ||
    location.pathname.startsWith('/admin/community');
  const isFullHeightChat = isFullHeightPage;

  // Global Quick Note Modal State
  const [quickNoteOpen, setQuickNoteOpen] = useState(false);

  useEffect(() => {
    const handleOpenQuickNote = () => setQuickNoteOpen(true);
    window.addEventListener('open_quick_note', handleOpenQuickNote);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setQuickNoteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('open_quick_note', handleOpenQuickNote);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Community E2EE Chat Drawer State
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [chatTargetUser, setChatTargetUser] = useState<any | null>(null);
  const [chatContext, setChatContext] = useState<ChatContextPayload | null>(null);
  const [userNotesCount, setUserNotesCount] = useState<number>(0);

  useEffect(() => {
    if (user && !user.isAnonymous) {
      api.get('/notes/count')
        .then((res: any) => {
          const count = res?.data?.data?.activeNotes || res?.data?.activeNotes || res?.activeNotes;
          if (typeof count === 'number') {
            setUserNotesCount(count);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  // Cross-Language Space Navigation Warning State
  const [crossSpaceWarning, setCrossSpaceWarning] = useState<{
    targetLanguageId: string;
    bankType: 'VOCABULARY' | 'EXAM';
    bankId: string;
  } | null>(null);

  const handleViewBankFromChat = (
    bankType: 'VOCABULARY' | 'EXAM',
    bankId: string,
    languageSpaceId?: string,
  ) => {
    if (languageSpaceId && languageSpaceId !== activeLanguage.id) {
      setCrossSpaceWarning({
        targetLanguageId: languageSpaceId,
        bankType,
        bankId,
      });
      return;
    }
    setChatDrawerOpen(false);
    if (bankType === 'VOCABULARY') {
      navigate(`/word-bank?deckId=${bankId}`);
    } else {
      navigate(`/exams`);
    }
  };

  const handleConfirmCrossSpaceSwitch = async () => {
    if (!crossSpaceWarning) return;
    const { targetLanguageId, bankType, bankId } = crossSpaceWarning;
    setCrossSpaceWarning(null);
    setChatDrawerOpen(false);
    await switchLanguage(targetLanguageId);
    if (bankType === 'VOCABULARY') {
      navigate(`/word-bank?deckId=${bankId}`);
    } else {
      navigate(`/exams`);
    }
  };

  useEffect(() => {
    const handleOpenChat = (e: any) => {
      if (e.detail?.targetUser) {
        setChatTargetUser(e.detail.targetUser);
      }
      if (e.detail?.context) {
        setChatContext(e.detail.context);
      }
      setChatDrawerOpen(true);
    };

    window.addEventListener('open_vocabflow_chat', handleOpenChat);
    return () => window.removeEventListener('open_vocabflow_chat', handleOpenChat);
  }, []);

  // Auto-close mobile drawer whenever route changes (Requirement 3)
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent background content from scrolling when mobile menu drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const [showSupportBtn, setShowSupportBtn] = useState(() => {
    return (
      localStorage.getItem('vocabflow_show_support_btn') !== 'false' &&
      localStorage.getItem('vocabflow_show_support_btn') !== 'false'
    );
  });
  const navigate = useNavigate();

  useEffect(() => {
    const handleStorage = () => {
      setShowSupportBtn(
        localStorage.getItem('vocabflow_show_support_btn') !== 'false' &&
        localStorage.getItem('vocabflow_show_support_btn') !== 'false'
      );
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const [supportTab, setSupportTab] = useState<'quick' | 'chat'>('chat');

  // Vertical-only Draggable CSKH Support Button State (Docked to right margin)
  const [btnPosY, setBtnPosY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startY: number; initY: number; moved: boolean } | null>(null);

  const handleDragStart = (clientY: number) => {
    const defaultY = Math.round(window.innerHeight * 0.7);
    const currentY = btnPosY ?? defaultY;
    dragStartRef.current = {
      startY: clientY,
      initY: currentY,
      moved: false,
    };
  };

  const handleDragMove = (clientY: number) => {
    if (!dragStartRef.current) return;
    const dy = clientY - dragStartRef.current.startY;
    if (Math.abs(dy) > 4) {
      dragStartRef.current.moved = true;
      setIsDragging(true);
      const newY = Math.max(60, Math.min(window.innerHeight - 80, dragStartRef.current.initY + dy));
      setBtnPosY(newY);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setTimeout(() => {
      dragStartRef.current = null;
    }, 50);
  };

  const handleSupportBtnClick = () => {
    if (dragStartRef.current?.moved) return;
    setSupportModalOpen((prev) => {
      const next = !prev;
      if (next && user) {
        fetchUserChat();
      }
      return next;
    });
  };

  // Realtime Sync CSKH Support State (Backbone synced with AdminSupportPage)
  const [activeConv, setActiveConv] = useState<any>(null);
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);
  const modalMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-fetch latest user ticket and messages
  const fetchUserChat = async () => {
    if (!user) return;
    setLoadingChat(true);
    try {
      const res: any = await api.get('/support/conversations');
      const payload = res?.data?.data || res?.data || res || [];
      const items = payload.items || (Array.isArray(payload) ? payload : []);
      if (items.length > 0) {
        const latest = items[0];
        setActiveConv(latest);
        const detailRes: any = await api.get(`/support/conversations/${latest.id}`);
        const conv = detailRes?.data?.data || detailRes?.data || detailRes || {};
        setSupportMessages(conv.messages || []);
      }
    } catch (err) {
      console.error('Failed to load user CSKH conversation:', err);
    } finally {
      setLoadingChat(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserChat();
    }
  }, [user]);

  // Socket.io Realtime Listener for active conversation & personal user room
  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket();

    const joinRooms = () => {
      socket.emit('join_user', { userId: user.id });
      if (activeConv?.id) {
        socket.emit('join_conversation', { conversationId: activeConv.id, userId: user.id });
      }
    };

    joinRooms();
    socket.on('connect', joinRooms);

    const onNewMessage = (msg: any) => {
      if (!msg) return;
      if (activeConv?.id && msg.conversationId === activeConv.id) {
        setSupportMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      } else if (!activeConv?.id) {
        fetchUserChat();
      }
      if (!supportModalOpen && (msg.senderRole === 'ADMIN' || msg.senderRole === 'SUPER_ADMIN')) {
        setUnreadSupportCount((prev) => prev + 1);
      }
    };

    socket.on('new_message', onNewMessage);

    const onMessagesRead = (data: any) => {
      if (data?.conversationId === activeConv?.id) {
        setSupportMessages((prev) =>
          prev.map((m) =>
            m.senderRole === 'USER' ? { ...m, readAt: m.readAt || data.readAt } : m
          )
        );
      }
    };
    socket.on('messages_read', onMessagesRead);

    return () => {
      socket.off('connect', joinRooms);
      socket.off('new_message', onNewMessage);
      socket.off('messages_read', onMessagesRead);
    };
  }, [user?.id, activeConv?.id, supportModalOpen]);

  const handleMarkUserRead = async () => {
    if (!activeConv?.id) return;
    try {
      await api.post(`/support/conversations/${activeConv.id}/read`);
      const socket = getSocket();
      socket.emit('mark_read', { conversationId: activeConv.id, role: 'USER' });
    } catch {
      // silent
    }
  };

  useEffect(() => {
    if (supportModalOpen && activeConv?.id) {
      handleMarkUserRead();
      setUnreadSupportCount(0);
    }
  }, [supportModalOpen, activeConv?.id]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || sendingMsg) return;
    if (!user || user.isAnonymous) {
      promptLogin('Đăng nhập để gửi tin nhắn hỗ trợ CSKH và nhận phản hồi trực tiếp');
      return;
    }

    const content = chatInput.trim();
    setChatInput('');
    setSendingMsg(true);

    try {
      if (activeConv?.id) {
        const res: any = await api.post(`/support/conversations/${activeConv.id}/messages`, {
          content,
        });
        const savedMsg = res?.data?.data || res?.data || res;
        setSupportMessages((prev) => (prev.some((m) => m.id === savedMsg.id) ? prev : [...prev, savedMsg]));
      } else {
        const res: any = await api.post('/support/conversations', {
          subject: 'Hỗ trợ trực tuyến VocabFlow CSKH',
          message: content,
          tags: ['LIVE_CHAT'],
        });
        const created = res?.data?.data || res?.data || res;
        setActiveConv(created);
        setSupportMessages(created.messages || []);
      }
    } catch (err) {
      console.error('Failed to send support message:', err);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isPro = isProUser(user);

  const isKidSupported = isKidSupportedLanguage(activeLanguage);

  const navSections = [
    {
      title: 'HỌC TẬP & LUYỆN TẬP',
      items: [
        { to: '/dashboard', label: t('nav.dashboard', 'Bảng điều khiển'), icon: LayoutDashboard },
        { to: '/languages', label: 'My Languages', icon: Globe },
        { to: '/review', label: t('nav.review', 'Ôn tập thông minh'), icon: Sparkles },
        { to: '/games', label: 'Đấu trường phản xạ', icon: Gamepad2 },
      ],
    },
    ...(isKidSupported
      ? [
          {
            title: 'TIẾNG ANH CHO BÉ',
            items: [
              {
                to: 'https://kid.vocalflow.site',
                label: 'Học cùng bé',
                icon: Baby,
                badge: 'NEW',
                external: true,
              },
            ],
          },
        ]
      : []),
    {
      title: 'KHO TỪ VỰNG & BỘ ĐỀ',
      items: [
        { to: '/vocabulary', label: t('nav.vocabulary', 'Thư viện từ vựng'), icon: BookOpen },
        { to: '/word-bank', label: t('nav.wordBank', 'Kho từ của tôi'), icon: Bookmark },
        {
          to: '/notes',
          label: 'Ghi chép cá nhân',
          icon: StickyNote,
          badge: userNotesCount > 0 ? `${userNotesCount}` : undefined,
        },
        {
          to: '/community-knowledge',
          label: 'Tri thức cộng đồng',
          icon: Sparkles,
          badge: 'HOT',
        },
        { to: '/community', label: t('nav.community', 'Cộng đồng kho từ'), icon: Share2 },
        { to: '/exams', label: 'Ngân hàng bộ đề', icon: GraduationCap, badge: 'HOT' },
        { to: '/custom-quiz', label: t('nav.customQuiz', 'Trắc nghiệm tùy chọn'), icon: HelpCircle },
      ],
    },
    {
      title: 'TRỢ LÝ HỌC TẬP AI',
      items: [
        { to: '/coach', label: 'AI Personal Coach', icon: Mic },
        { to: '/ai-tutor', label: t('nav.aiTutor', 'Gia Sư AI Studio'), icon: BrainCircuit },
      ],
    },
    {
      title: 'TIẾN TRÌNH & NĂNG LỰC',
      items: [
        { to: '/leaderboard', label: 'Bảng xếp hạng', icon: Trophy },
        { to: '/progress', label: t('nav.progress', 'Tiến trình học tập'), icon: Award },
        { to: '/placement-test', label: t('nav.placementTest', 'Kiểm tra năng lực'), icon: Compass },
      ],
    },
    {
      title: 'TÀI KHOẢN & HỆ THỐNG',
      items: [
        {
          to: '/upgrade',
          label: isPro ? 'VocabFlow VIP Pro' : t('nav.upgrade', 'Mở Khóa Premium'),
          icon: Crown,
          highlight: true,
          badge: isPro ? 'PRO' : 'MỞ KHÓA',
          isUnlock: !isPro,
        },
        { to: '/notifications', label: 'Thông báo', icon: Bell },
        { to: '/feedback', label: 'Góp ý & Roadmap', icon: MessageSquare },
        { to: '/settings', label: t('nav.settings', 'Cài đặt'), icon: Settings },
        ...(isAdmin ? [{ to: 'https://admin.vocalflow.site', label: t('nav.admin', 'Admin Center'), icon: ShieldCheck, admin: true, external: true }] : []),
      ],
    },
  ];

  const mobileBottomItems = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/games', label: 'Games', icon: Gamepad2 },
    { to: '/coach', label: 'Coach', icon: Mic },
    { to: '/leaderboard', label: 'BXH', icon: Trophy },
    { to: '/review', label: 'Review', icon: Sparkles },
    { to: '/word-bank', label: 'Saved', icon: Bookmark },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50/20 dark:bg-transparent text-slate-900 dark:text-slate-100 font-sans antialiased relative selection:bg-indigo-500 selection:text-white">
      {/* Ambient Blurred Colored Blobs / Orbs */}
      <LiquidBackground />

      {/* Desktop Sidebar — Fixed Header (Logo & Streak), Scrollable Menu, Luxurious Liquid Glass Gold Unlock & Dynamic Auth Controls */}
      <aside className="hidden lg:flex flex-col border-r border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl pt-3.5 pb-3 shrink-0 h-screen sticky top-0 overflow-hidden box-border z-20 w-64 max-w-[16rem] px-3.5">
        {/* 1. FIXED TOP: Brand Logo & User Streak (NEVER scrolls, always stays pinned) */}
        <div className="shrink-0 pb-3 border-b border-slate-200/60 dark:border-slate-800/60 space-y-2.5">
          {/* Brand Header with Logo */}
          <div className="flex items-center justify-between px-1">
            <div
              className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden cursor-pointer group"
              onClick={() => navigate('/dashboard')}
              title="VocabFlow Smart Adaptive English"
            >
              <img
                src="/vocabflow-logo-256.png"
                alt="VocabFlow Logo"
                className="w-8 h-8 rounded-xl object-contain shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-xs"
              />
              <div className="min-w-0 flex-1 truncate">
                <h2 className="font-extrabold text-base leading-tight tracking-tight text-slate-900 dark:text-white truncate">
                  VocabFlow
                </h2>
                <p className="text-[11px] text-slate-400 font-medium truncate flex items-center gap-1">
                  <span>Multi-Language Learning</span>
                </p>
              </div>
            </div>
          </div>

          {/* User Streak Pill — Pinned Directly Under Logo */}
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between min-w-0 shadow-xs">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs min-w-0 truncate">
              <CountryFlag languageId={activeLanguage.id} countryCode={activeLanguage.countryCode} size="xs" />
              <span className="truncate">{activeProfile.currentStreak || 0} Day Streak</span>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-extrabold shrink-0 ml-1 border border-amber-500/30">
              {activeProfile.level}
            </span>
          </div>
        </div>

        {/* 2. SCROLLABLE MIDDLE: ONLY navigation links scroll */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-3 pr-1 space-y-3.5">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-2.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isExt = (item as any).external;
                  const itemContent = (
                    <>
                      <div className="flex items-center gap-2.5 flex-1 truncate mr-1.5 min-w-0">
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        (item as any).isUnlock ? (
                          /* Liquid Glass Gold Badge */
                          <span className="relative overflow-hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-400/20 dark:bg-amber-400/15 backdrop-blur-md border border-amber-400/60 dark:border-amber-400/40 text-amber-900 dark:text-amber-200 text-[9px] font-black uppercase tracking-wider group-hover:border-amber-300 transition-all shrink-0">
                            <Crown className="w-2.5 h-2.5 text-amber-500 dark:text-amber-300 fill-amber-400" />
                            <span>MỞ KHÓA</span>
                          </span>
                        ) : (
                          <span className="shrink-0 text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 bg-indigo-600 text-white rounded-md">
                            {item.badge}
                          </span>
                        )
                      )}
                    </>
                  );

                  if (isExt) {
                    return (
                      <a
                        key={item.to}
                        href={item.to}
                        className="flex items-center justify-between rounded-xl text-xs font-semibold transition-all duration-150 min-w-0 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                      >
                        {itemContent}
                      </a>
                    );
                  }

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-xl text-xs font-semibold transition-all duration-150 min-w-0 px-3 py-2 ${isActive
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm'
                          : (item as any).admin
                            ? 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30'
                            : item.highlight
                              ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                        }`
                      }
                    >
                      {itemContent}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 3. FIXED FOOTER: Account Tier / Unlock Card, Profile, Theme & Auth Controls */}
        <div className="shrink-0 pt-2.5 border-t border-slate-200/80 dark:border-slate-800/80 w-full min-w-0 space-y-2 bg-transparent">
          {user?.isAnonymous || !user ? (
            <div className="p-2.5 rounded-2xl bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/25 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Khách Khám Phá
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                Tiến độ đang lưu cục bộ. Đăng nhập để bảo lưu vĩnh viễn.
              </p>
              <button
                onClick={() => promptLogin('Lưu trữ vĩnh viễn tiến độ học và mở khóa đầy đủ tính năng')}
                className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập 1-chạm</span>
              </button>
            </div>
          ) : (
            <>
              {/* Account Tier Card — Redesigned with Liquid Glass Gold */}
              <div
                onClick={() => navigate('/upgrade')}
                className="relative p-2.5 rounded-2xl bg-amber-400/10 dark:bg-amber-400/[0.08] backdrop-blur-xl border border-amber-400/40 dark:border-amber-400/30 hover:border-amber-400/80 cursor-pointer transition-all duration-300 group overflow-hidden"
                title="Xem chi tiết gói tài khoản hoặc nâng cấp"
              >
                {/* Specular Liquid Sheen Reflection */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

                <div className="flex items-center justify-between min-w-0 relative z-10">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                      <Crown className="w-4 h-4 text-amber-500 dark:text-amber-300 fill-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-wider leading-none">
                        Gói tài khoản
                      </p>
                      <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100 truncate leading-tight mt-0.5">
                        {isPro ? 'VocabFlow Pro VIP' : (user?.subscription?.tier || 'Gói Miễn Phí')}
                      </p>
                    </div>
                  </div>

                  {/* Liquid Glass Gold Action Pill */}
                  <span className="relative px-2 py-1 rounded-xl bg-gradient-to-b from-amber-300/30 via-yellow-400/20 to-amber-500/30 hover:from-amber-300/45 hover:to-amber-500/45 border border-amber-400/60 dark:border-amber-400/50 text-amber-900 dark:text-amber-100 text-[10px] font-black uppercase tracking-wide flex items-center gap-1 shrink-0 group-hover:scale-105 transition-transform duration-200">
                    {isPro ? (
                      <>
                        <Crown className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                        <span>PRO</span>
                      </>
                    ) : (
                      <>
                        <LockOpen className="w-2.5 h-2.5 text-amber-600 dark:text-amber-300" />
                        <span>Mở khóa</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* User Profile Info Row */}
              <div
                onClick={() => setProfileModalOpen(true)}
                className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition group min-w-0 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60"
                title="Bấm để xem hồ sơ cá nhân & Hướng dẫn sử dụng"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0 truncate">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user?.displayName || user?.email?.split('@')[0] || 'Learner'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {user?.email || 'Học viên'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition shrink-0" />
              </div>
            </>
          )}


        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 relative z-20 ${isFullHeightPage ? 'h-screen max-h-screen overflow-hidden' : 'pb-20 lg:pb-0'}`}>
        {/* Mobile Header — Sticky fixed at top */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-40 transition-colors shrink-0 shadow-xs">
          <div className="flex items-center gap-2">
            <img
              src="/vocabflow-logo-256.png"
              alt="VocabFlow"
              className="w-7 h-7 rounded-xl object-contain shrink-0 cursor-pointer"
              onClick={() => navigate('/dashboard')}
            />
            <LanguageSwitcher variant="compact" />
          </div>
          <div className="flex items-center gap-2">
            {!isPro && (
              <button
                onClick={() => navigate('/upgrade')}
                className="relative overflow-hidden px-2.5 py-1 rounded-xl bg-amber-400/20 dark:bg-amber-400/15 backdrop-blur-md border border-amber-400/60 dark:border-amber-400/40 text-amber-900 dark:text-amber-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 hover:border-amber-300 transition-all group"
              >
                <Crown className="w-3 h-3 text-amber-500 dark:text-amber-300 fill-amber-400" />
                <span>Mở khóa</span>
              </button>
            )}
            <NotificationBell />
            <button
              onClick={() => {
                if (!user || user.isAnonymous) {
                  promptLogin('Đăng nhập để sử dụng ghi chép nhanh');
                  return;
                }
                setQuickNoteOpen(true);
              }}
              title="Ghi chép nhanh (Alt+N)"
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (!user || user.isAnonymous) {
                  promptLogin('Đăng nhập để sử dụng tính năng nhắn tin');
                  return;
                }
                setChatDrawerOpen(true);
              }}
              title="Tin nhắn học tập E2EE"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <MessageSquare className="w-4 h-4 text-indigo-500" />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Menu Overlay Drawer — FIXED OVERLAY, NEVER SCROLLS WITH PAGE */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-x-0 top-[57px] bottom-0 z-40 flex flex-col">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            {/* Drawer Menu Content */}
            <div
              className="relative z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3.5 space-y-3 max-h-[80vh] overflow-y-auto shadow-2xl animate-in slide-in-from-top duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {navSections.map((section) => (
                <div key={section.title} className="space-y-1">
                  <p className="px-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {section.title}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${isActive
                            ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`
                        }
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <item.icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          (item as any).isUnlock ? (
                            <span className="relative overflow-hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-400/20 dark:bg-amber-400/15 backdrop-blur-md border border-amber-400/60 text-amber-900 dark:text-amber-200 text-[9px] font-black uppercase tracking-wider">
                              <Crown className="w-2.5 h-2.5 text-amber-500 dark:text-amber-300 fill-amber-400" />
                              <span>MỞ KHÓA</span>
                            </span>
                          ) : (
                            <span className="text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 bg-indigo-600 text-white rounded-md">
                              {item.badge}
                            </span>
                          )
                        )}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}

              {/* ONLY Show Logout If Authenticated; Show Login If Guest */}
              {user?.isAnonymous || !user ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    promptLogin('Đăng nhập để lưu tiến độ và sử dụng đầy đủ tính năng');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition shadow-xs"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng nhập tài khoản</span>
                </button>
              ) : (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('nav.logout', 'Logout')}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Desktop Top Header Bar — Sticky fixed at top, balanced & polished */}
        <header className="hidden lg:flex items-center justify-between px-4 lg:px-6 xl:px-8 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-40 transition-colors shrink-0 shadow-xs">
          <div className="flex items-center gap-3 shrink-0">
            {/* Multi-Language Switcher */}
            <LanguageSwitcher variant="header" />
            <span className="hidden xl:inline text-xs font-semibold text-slate-400 dark:text-slate-500">
              •
            </span>
            <span className="hidden xl:inline text-xs text-slate-500 dark:text-slate-400 font-medium">
              Không gian học <strong className="text-slate-900 dark:text-white font-extrabold">{activeLanguage.name}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 xl:gap-2.5 shrink-0">
            <NavLink
              to="/coach"
              title="Voice Coach"
              className="h-8 px-2.5 xl:px-3 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 flex items-center gap-1.5 transition shadow-xs"
            >
              <Mic className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Voice Coach</span>
            </NavLink>

            <NavLink
              to="/leaderboard"
              title="Bảng Xếp Hạng"
              className="h-8 px-2.5 xl:px-3 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 flex items-center gap-1.5 transition shadow-xs"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Bảng Xếp Hạng</span>
            </NavLink>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 xl:mx-1" />

            <NavLink
              to="/feedback"
              title="Góp ý phản hồi"
              className="h-8 px-2.5 xl:px-3 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Góp ý</span>
            </NavLink>

            {isAdmin && (
              <a
                href="https://admin.vocalflow.site"
                title="Admin Center"
                className="h-8 px-2.5 xl:px-3 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/40 flex items-center gap-1.5 transition shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden xl:inline">🛠 Admin Center</span>
              </a>
            )}

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 xl:mx-1" />

            {/* Quick Note Button - Translucent Book Icon */}
            <button
              onClick={() => {
                if (!user || user.isAnonymous) {
                  promptLogin('Đăng nhập để sử dụng ghi chép nhanh');
                  return;
                }
                setQuickNoteOpen(true);
              }}
              title="Ghi chép nhanh (Alt+N)"
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/90 dark:hover:bg-slate-800/90 hover:border-indigo-300 dark:hover:border-indigo-500/50 shadow-xs transition-all cursor-pointer group"
            >
              <BookOpen className="w-4 h-4 group-hover:scale-105 transition-transform" />
            </button>

            {/* Notification Bell with Badge & Dropdown */}
            <NotificationBell />

            {/* Student-to-Student E2EE Chat Button */}
            <button
              onClick={() => {
                if (!user || user.isAnonymous) {
                  promptLogin('Đăng nhập để sử dụng tính năng nhắn tin');
                  return;
                }
                setChatDrawerOpen(true);
              }}
              title="Tin nhắn học tập E2EE"
              className="h-8 px-2.5 xl:px-3 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Tin nhắn</span>
            </button>
          </div>
        </header>

        {/* Routed Pages Container — Space-Optimized: full height for rich interactive workspaces */}
        <main
          data-scroll-container="true"
          className={`flex-1 w-full min-h-0 ${
            isFullHeightPage
              ? 'flex flex-col overflow-hidden p-0 max-w-none h-full'
              : 'max-w-[1680px] mx-auto p-3 sm:p-5 lg:p-6'
          }`}
        >
          <Outlet />
        </main>

        {/* Mobile Thumb-Reach Bottom Navigation Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-around py-2 px-1 shadow-lg">
          {mobileBottomItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* User Profile & Guidance Modal — ModalPortal to document.body */}
      <ModalPortal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)}>
        <div
          className="m-auto relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-base flex items-center justify-center shadow-xs">
                {user?.displayName?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {user?.displayName}
                </h3>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => setProfileModalOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition"
            >
              ✕
            </button>
          </div>

          {/* Content Body */}
          <div className="py-4 space-y-4 text-xs sm:text-sm">
            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Cấp độ học</span>
                <p className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  Lvl {user?.xp?.currentLevel || 1}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Chuỗi ngày (Streak)</span>
                <p className="text-lg font-extrabold text-amber-500 mt-0.5">
                  {user?.streak?.currentStreak || 0} ngày
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Điểm XP tích lũy</span>
                <p className="text-lg font-extrabold text-emerald-500 mt-0.5">
                  {user?.xp?.totalXP || 0} XP
                </p>
              </div>
            </div>

            {/* Active Package Details */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-amber-500/10 border border-indigo-500/20 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Gói dịch vụ: {isPro ? 'VocabFlow Pro (VIP Trọn Đời)' : (user?.subscription?.tier || 'Free Tier')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isPro ? 'Trạng thái: Hoạt động vĩnh viễn • Không giới hạn lượt ôn tập SRS & AI' : 'Trạng thái: Hoạt động • Nâng cấp để mở khóa AI không giới hạn'}
                </p>
              </div>
              {isPro ? (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-500 text-xs font-black border border-emerald-500/30">
                  VIP Pro
                </span>
              ) : (
                <button
                  onClick={() => {
                    setProfileModalOpen(false);
                    navigate('/upgrade');
                  }}
                  className="btn-glass-primary text-xs !py-1.5 !px-3.5 shadow-sm"
                >
                  Nâng cấp gói
                </button>
              )}
            </div>

            {/* Guidance & Effective Learning Tips Section */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-indigo-500" />
                  <span>Hướng Dẫn Sử Dụng & Mẹo Học Hiệu Quả</span>
                </h4>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                  <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 inline-flex items-center justify-center font-bold text-[10px]">1</span>
                    <span>Lộ trình ôn tập ngắt quãng (SRS):</span>
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 pl-6 leading-relaxed">
                    Mỗi ngày hệ thống tự động tính toán từ vựng sắp rơi vào "vùng quên" để đưa vào phiên ôn tập. Bạn chỉ cần vào mục "Smart Review" để ôn đúng thời điểm vàng.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                  <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 inline-flex items-center justify-center font-bold text-[10px]">2</span>
                    <span>Nhập từ vựng nhanh từ file Excel:</span>
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 pl-6 leading-relaxed">
                    Tại trang "My Word Bank", bấm nút "Nhập Excel / CSV", tải file mẫu chuẩn về máy, điền danh sách từ của bạn rồi kéo thả file lên để nạp hàng loạt từ vựng.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                  <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 inline-flex items-center justify-center font-bold text-[10px]">3</span>
                    <span>Tương tác cùng Gia Sư AI:</span>
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 pl-6 leading-relaxed">
                    Dùng AI Tutor để hỏi chuyên sâu về sự khác biệt giữa các từ đồng nghĩa, cấu trúc câu công sở hoặc yêu cầu đố trắc nghiệm phản xạ.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                setProfileModalOpen(false);
                window.location.href = 'https://admin.vocalflow.site';
              }}
              className="w-full mb-3 py-2 px-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-amber-500/25 transition shadow-xs"
            >
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>Mở 🛠 Admin Center (Quản Trị Hệ Thống)</span>
            </button>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
            <button
              onClick={async () => {
                const confirmed = await confirmModal({
                  title: 'Đăng xuất tài khoản',
                  message: 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?',
                  confirmText: 'Đăng xuất',
                  cancelText: 'Ở lại',
                  type: 'warning',
                });
                if (confirmed) {
                  setProfileModalOpen(false);
                  await logout();
                  navigate('/login');
                }
              }}
              className="btn-glass-danger text-xs !py-2 !px-4 flex items-center gap-1.5 shrink-0"
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setProfileModalOpen(false);
                  navigate('/settings');
                }}
                className="btn-glass-secondary text-xs !py-2 !px-4"
              >
                Đi đến Cài đặt
              </button>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="btn-glass-primary text-xs !py-2 !px-5"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* Right-Docked Vertical-Drag CSKH Support Button (Hidden for Admin) */}
      {showSupportBtn && !isAdmin && (
        <div
          style={{
            top: btnPosY ? `${btnPosY}px` : '70vh',
          }}
          className={`fixed right-0 z-40 touch-none select-none transition-shadow ${isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab'
            }`}
          onMouseDown={(e) => {
            handleDragStart(e.clientY);
            const onMouseMove = (moveEvent: MouseEvent) => {
              handleDragMove(moveEvent.clientY);
            };
            const onMouseUp = () => {
              handleDragEnd();
              window.removeEventListener('mousemove', onMouseMove);
              window.removeEventListener('mouseup', onMouseUp);
            };
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
          }}
          onTouchStart={(e) => {
            handleDragStart(e.touches[0].clientY);
          }}
          onTouchMove={(e) => {
            handleDragMove(e.touches[0].clientY);
          }}
          onTouchEnd={handleDragEnd}
        >
          <button
            onClick={handleSupportBtnClick}
            className="group relative h-10 rounded-l-2xl rounded-r-none bg-slate-900/95 hover:bg-slate-900 backdrop-blur-2xl border-y border-l border-r-0 border-cyan-500/40 hover:border-cyan-400/80 flex items-center justify-end p-1 transition-all duration-300 active:scale-95 text-white max-w-[42px] hover:max-w-[220px] overflow-hidden"
            aria-label="Trung tâm Chăm sóc khách hàng CSKH"
            title="Kéo trượt dọc mép phải màn hình • Rê chuột để xem chi tiết & mở Chat"
          >
            {/* Expanding Label & Status (Hidden by default, slides out smoothly on hover to the left) */}
            <div className="flex flex-col text-left leading-none opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[160px] overflow-hidden whitespace-nowrap transition-all duration-300 px-0 group-hover:px-2.5 shrink-0 pointer-events-none group-hover:pointer-events-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-extrabold text-white tracking-wide group-hover:text-cyan-200 transition-colors whitespace-nowrap">
                  Hỗ trợ CSKH
                </span>
                {unreadSupportCount > 0 && (
                  <span className="text-[9px] font-bold text-white bg-rose-500 px-1.5 py-0.2 rounded-full animate-pulse">
                    {unreadSupportCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1 text-[9px] text-cyan-300/90 font-medium whitespace-nowrap">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                </span>
                <span>24/7 Trực tuyến</span>
              </div>
            </div>

            {/* Glowing Headphone Icon (Docked snuggly against right edge) */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500/30 to-indigo-500/40 border border-cyan-400/60 flex items-center justify-center text-cyan-300 group-hover:text-cyan-100 transition-colors relative shrink-0">
              <Headphones className="w-4 h-4 text-cyan-300 group-hover:scale-110 transition-transform" />
              {unreadSupportCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900" />
              )}
            </div>
          </button>
        </div>
      )}

      {/* Customer Support Floating Chat Widget (Hidden for Admin) */}
      {supportModalOpen && !isAdmin && (
        <>
          {/* Backdrop to dismiss when clicking outside */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 animate-fade-in"
            onClick={() => setSupportModalOpen(false)}
            aria-hidden="true"
          />

          <div
            style={
              typeof window !== 'undefined' && window.innerWidth >= 640
                ? {
                  top: btnPosY ? `${Math.min(window.innerHeight - 500, Math.max(20, btnPosY - 220))}px` : undefined,
                  bottom: btnPosY ? undefined : '80px',
                  right: '16px',
                }
                : undefined
            }
            className="fixed inset-x-2 bottom-2 sm:bottom-auto sm:inset-x-auto sm:right-4 z-50 animate-scale-up"
          >
            <div
              className="w-full sm:w-[350px] rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 p-3.5 space-y-2.5 flex flex-col h-[75vh] max-h-[540px] sm:h-auto sm:max-h-[480px] overflow-hidden text-slate-100 shadow-2xl"
            >
              {/* Header with Title & Online status */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold border border-indigo-500/30">
                    <Headphones className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white leading-snug">
                      VocabFlow CSKH 24/7
                    </h4>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>Đang trực tuyến</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSupportModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    aria-label="Đóng"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Support Navigation Tabs */}
              <div className="grid grid-cols-2 p-0.5 rounded-xl bg-slate-800/90 text-[11px] font-bold border border-slate-700/70 shrink-0">
                <button
                  type="button"
                  onClick={() => setSupportTab('chat')}
                  className={`py-1 rounded-lg transition flex items-center justify-center gap-1.5 ${supportTab === 'chat'
                    ? 'bg-slate-700 text-cyan-300 shadow-xs border border-cyan-400/30'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Chat trực tiếp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSupportTab('quick')}
                  className={`py-1 rounded-lg transition flex items-center justify-center gap-1.5 ${supportTab === 'quick'
                    ? 'bg-slate-700 text-cyan-300 shadow-xs border border-cyan-400/30'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Kênh liên hệ</span>
                </button>
              </div>

              {/* Tab 1: Realtime Support Chat */}
              {supportTab === 'chat' ? (
                <div className="flex-1 flex flex-col min-h-0 space-y-2">
                  {/* Virtualized Messages Scroll Area with Dynamic Height */}
                  <div className="flex-1 min-h-[160px] sm:h-56 bg-slate-950/50 rounded-xl overflow-hidden text-xs relative border border-slate-800/80">
                    <VirtualChatPane
                      conversationId={activeConv?.id || 'new_chat'}
                      rawMessages={supportMessages}
                      currentUserId={user?.id}
                      currentUserRole="USER"
                      isLoading={loadingChat}
                      emptyPlaceholder="Chào mừng bạn đến với CSKH 24/7! Hãy gửi tin nhắn bên dưới để nhận hỗ trợ."
                      onMarkRead={handleMarkUserRead}
                      isCompact={true}
                    />
                  </div>

                  {/* Guest Warning Banner */}
                  {(!user || user.isAnonymous) && (
                    <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-between gap-2 text-[11px] shrink-0">
                      <span className="text-indigo-200 truncate">Đăng nhập để gửi tin nhắn và nhận phản hồi từ CSKH</span>
                      <button
                        type="button"
                        onClick={() => promptLogin('Đăng nhập để kết nối tư vấn viên CSKH')}
                        className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] shrink-0"
                      >
                        Đăng nhập
                      </button>
                    </div>
                  )}

                  {/* Chat Composer Input */}
                  <div className="pt-1.5 border-t border-slate-800 flex items-center gap-1.5 shrink-0">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendMessage();
                      }}
                      disabled={sendingMsg}
                      placeholder={user && !user.isAnonymous ? "Nhập tin nhắn..." : "Vui lòng đăng nhập để gửi tin..."}
                      className="flex-1 px-3 py-2 sm:py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm sm:text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={!chatInput.trim() || sendingMsg}
                      className="p-2 sm:p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shrink-0 transition"
                      aria-label="Gửi tin nhắn"
                    >
                      <Send className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${sendingMsg ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
              ) : (
                /* Tab 2: Quick Links / Facebook / FAQ */
                <div className="space-y-3 pt-1">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Bạn có thể liên hệ trực tiếp tới fanpage Facebook chính thức của VocabFlow hoặc tra cứu các thắc mắc thông dụng.
                  </p>

                  <div className="space-y-2">
                    <a
                      href="https://facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3.5 rounded-2xl bg-[#1877F2]/15 hover:bg-[#1877F2]/25 border border-[#1877F2]/30 text-[#3891ff] font-bold text-xs flex items-center justify-between transition group"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src="/facebook-logo.png"
                          alt="Facebook Logo"
                          className="w-5 h-5 object-contain rounded-full"
                        />
                        <span>Contact us on Facebook</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => {
                        setSupportModalOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full py-2.5 px-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-between border border-slate-700/80 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <span>📚</span>
                        <span>Câu hỏi thường gặp (FAQ)</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2 text-center text-[11px] text-slate-400 border-t border-slate-800 flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Kết nối bảo mật • Không bao giờ yêu cầu mật khẩu hay mã OTP</span>
              </div>
            </div>
          </div>
        </>
      )}
      {/* Community E2EE Chat Drawer */}
      {user && !user.isAnonymous && (
        <ChatDrawer
          isOpen={chatDrawerOpen}
          onClose={() => setChatDrawerOpen(false)}
          currentUser={{
            id: user.id,
            displayName: user.displayName || 'Học viên',
            avatar: user.avatar,
          }}
          initialTargetUser={chatTargetUser}
          initialContext={chatContext}
          onViewBank={handleViewBankFromChat}
        />
      )}

      {/* Cross Language Space Navigation Warning Modal */}
      <ModalPortal isOpen={Boolean(crossSpaceWarning)} onClose={() => setCrossSpaceWarning(null)}>
        {crossSpaceWarning && (() => {
          const targetLang = getLanguage(crossSpaceWarning.targetLanguageId) || {
            id: crossSpaceWarning.targetLanguageId,
            name: crossSpaceWarning.targetLanguageId,
            nativeName: crossSpaceWarning.targetLanguageId,
            flag: '🌐',
          };
          return (
            <div className="m-auto max-w-md w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl animate-fade-in text-left">
              <div className="flex items-center gap-3.5 text-amber-500">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                    Kho này thuộc không gian học khác
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Yêu cầu chuyển đổi không gian học tập để truy cập
                  </p>
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Không gian hiện tại:</span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CountryFlag languageId={activeLanguage.id} size="xs" />
                    <span>{activeLanguage.nativeName} ({activeLanguage.name})</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Kho thuộc không gian:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <CountryFlag languageId={targetLang.id} size="xs" />
                    <span>{targetLang.nativeName} ({targetLang.name})</span>
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Bạn có muốn chuyển sang không gian <strong>{targetLang.name}</strong> để xem nội dung kho này không?
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCrossSpaceWarning(null)}
                  className="btn-glass-secondary btn-glass-sm !px-4"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCrossSpaceSwitch}
                  className="btn-glass-primary btn-glass-sm !px-5 font-bold"
                >
                  Chuyển không gian & xem kho
                </button>
              </div>
            </div>
          );
        })()}
      </ModalPortal>

      {/* Global Floating Quick Note FAB Button (Visible on every page) */}
      <button
        onClick={() => {
          if (!user || user.isAnonymous) {
            promptLogin('Đăng nhập để sử dụng ghi chép nhanh');
            return;
          }
          setQuickNoteOpen(true);
        }}
        aria-label="Ghi chép nhanh"
        title="Ghi chép nhanh (Alt+N)"
        className="fixed bottom-20 lg:bottom-6 right-5 z-40 w-11 h-11 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-lg shadow-slate-900/10 dark:shadow-black/30 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/90 dark:hover:bg-slate-800/90 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center group cursor-pointer"
      >
        <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
      </button>

      {/* Global Quick Note Modal */}
      <QuickNoteModal
        isOpen={quickNoteOpen}
        onClose={() => setQuickNoteOpen(false)}
      />
    </div>
  );
};
