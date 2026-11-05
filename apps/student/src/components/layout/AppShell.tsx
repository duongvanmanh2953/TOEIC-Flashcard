import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, isProUser } from '../../contexts/AuthContext';
import { useTranslation } from '../../i18n';
import { useDynamicDocumentTitle } from '../../hooks/useDynamicDocumentTitle';
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
  User,
  PenTool,
  BookCheck,
  Briefcase,
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
import { VocabFlowLogo } from '@vocabflow/shared';
import { navigateToApp, buildSsoUrl } from '../../lib/sso';
import { RichAIMessageRenderer } from '../ai/RichAIMessageRenderer';
import { usePersistentScroll } from '../../hooks/usePersistentScroll';

import { usePerformance } from '../../contexts/PerformanceContext';

export const AppShell: React.FC = () => {
  useDynamicDocumentTitle();
  const { activeLanguage, activeProfile, switchLanguage } = useLearningContext();
  const { user, logout, theme, toggleTheme, promptLogin } = useAuth();
  const { isUltraEfficient, togglePerformanceMode } = usePerformance();
  const { t } = useTranslation();


  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const location = useLocation();
  const isFullHeightPage =
    location.pathname.startsWith('/coach') ||
    location.pathname.startsWith('/ai-tutor') ||
    location.pathname.startsWith('/interview') ||
    location.pathname.startsWith('/notes');
  const isFullHeightChat = isFullHeightPage;

  // Real-time animated Streak & XP stats in Topbar
  const [headerStreak, setHeaderStreak] = useState<number>(() => {
    return user?.streak?.currentStreak || activeProfile?.currentStreak || 1;
  });
  const [headerXP, setHeaderXP] = useState<number>(() => {
    return user?.xp?.totalXP || activeProfile?.xp || 0;
  });
  const [xpBonusGlow, setXpBonusGlow] = useState(false);

  useEffect(() => {
    setHeaderStreak(user?.streak?.currentStreak || activeProfile?.currentStreak || 1);
    setHeaderXP(user?.xp?.totalXP || activeProfile?.xp || 0);
  }, [user?.streak?.currentStreak, user?.xp?.totalXP, activeProfile?.currentStreak, activeProfile?.xp]);

  useEffect(() => {
    const handleSessionCompleted = (e: any) => {
      const data = e.detail;
      if (data) {
        if (typeof data.currentStreak === 'number') {
          setHeaderStreak(data.currentStreak);
        }
        if (typeof data.totalXP === 'number') {
          setHeaderXP(data.totalXP);
        } else if (typeof data.xpAwarded === 'number') {
          setHeaderXP((prev) => prev + data.xpAwarded);
        }
        setXpBonusGlow(true);
        setTimeout(() => setXpBonusGlow(false), 2400);
      }
    };

    window.addEventListener('VOCABFLOW_SESSION_COMPLETED', handleSessionCompleted);
    return () => window.removeEventListener('VOCABFLOW_SESSION_COMPLETED', handleSessionCompleted);
  }, []);

  const renderStreakXpBadge = (isCompact = false) => (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-xs font-extrabold shadow-xs transition-all ${
        xpBonusGlow ? 'ring-2 ring-indigo-500 scale-105 bg-indigo-50 dark:bg-indigo-950/50' : ''
      }`}
      title="Tiến trình học tập: Chuỗi ngày Streak và Điểm kinh nghiệm XP"
    >
      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
        <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
        <span>{headerStreak} {isCompact ? 'd' : 'ngày'}</span>
      </div>
      <div className="h-3 w-px bg-slate-300 dark:bg-slate-700" />
      <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span>{headerXP} XP</span>
      </div>
    </div>
  );

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

  // Persistent Sidebar Scroll Management (VOCALFLOW_SPECIFICATION Section 4 via usePersistentScroll hook)
  const { scrollRef: sidebarNavScrollRef, handleScroll: handleSidebarScroll } =
    usePersistentScroll<HTMLDivElement>('vocabflow_sidebar_scroll', 100);

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

  const [supportTab, setSupportTab] = useState<'tutor' | 'chat' | 'quick'>('tutor');

  // Mini AI Tutor in Floating Widget State
  const [tutorInput, setTutorInput] = useState('');
  const [tutorMessages, setTutorMessages] = useState<
    Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      citations?: any[];
      isCached?: boolean;
      provider?: string;
    }>
  >([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Xin chào! Tôi là Gia sư VocabFlow AI của bạn. Bạn muốn tra cứu sắc thái từ, giải thích ngữ pháp hay luyện phản xạ gì hôm nay?',
    },
  ]);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorQuota, setTutorQuota] = useState<{ remaining: number; limit: number } | null>(null);
  const tutorMessagesEndRef = useRef<HTMLDivElement>(null);

  interface ChatSuggestion {
    id: string;
    title: string;
    category: string;
    hasCache: boolean;
    tokensCost?: number;
    estimatedTokens?: number;
    tokenBadge?: string;
  }
  const [tutorSuggestions, setTutorSuggestions] = useState<ChatSuggestion[]>([]);
  const [showTutorSuggestions, setShowTutorSuggestions] = useState(false);
  const [searchingSuggestions, setSearchingSuggestions] = useState(false);

  // Debounced search for similar DB questions & vocabulary suggestions as user types
  useEffect(() => {
    const trimmed = tutorInput.trim();
    if (!trimmed) {
      setTutorSuggestions([]);
      setShowTutorSuggestions(false);
      return;
    }

    let isCancelled = false;
    setSearchingSuggestions(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/ai/suggestions?q=${encodeURIComponent(trimmed)}`);
        const list = res.data?.data || res.data || [];
        if (!isCancelled && Array.isArray(list)) {
          setTutorSuggestions(list);
          setShowTutorSuggestions(list.length > 0);
        }
      } catch (_) {
        if (!isCancelled) setTutorSuggestions([]);
      } finally {
        if (!isCancelled) setSearchingSuggestions(false);
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [tutorInput]);

  const fetchTutorQuota = async () => {
    try {
      const endpoint = !user || user.isAnonymous ? '/subscriptions/guest-quotas' : '/subscriptions/my-quotas';
      const res: any = await api.get(endpoint);
      const data = res.data || res;
      if (data?.aiTutor) {
        setTutorQuota({
          remaining: data.aiTutor.remaining,
          limit: data.aiTutor.limit,
        });
      }
    } catch (_) {}
  };

  useEffect(() => {
    if (supportModalOpen && supportTab === 'tutor') {
      fetchTutorQuota();
    }
  }, [supportModalOpen, supportTab]);

  useEffect(() => {
    if (supportTab === 'tutor') {
      tutorMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [tutorMessages, tutorLoading, supportTab]);

  const handleSendTutorMessage = async (promptText?: string) => {
    const text = promptText || tutorInput;
    if (!text.trim() || tutorLoading) return;

    setShowTutorSuggestions(false);
    const userMsg = { id: Date.now().toString(), role: 'user' as const, content: text };
    setTutorMessages((prev) => [...prev, userMsg]);
    setTutorInput('');
    setTutorLoading(true);

    try {
      const res: any = await api.post('/ai/tutor', {
        message: text,
        language: activeLanguage?.id || 'en',
      });
      const data = res.data || res;
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: data?.reply || 'Tôi đã tiếp nhận câu hỏi của bạn.',
        citations: data?.citations || [],
        isCached: data?.isCached || false,
        provider: data?.provider,
      };
      setTutorMessages((prev) => [...prev, aiMsg]);
      // Only deduct quota if not served from zero-token knowledge cache
      if (!data?.isCached) {
        setTutorQuota((prev) => (prev ? { ...prev, remaining: Math.max(0, prev.remaining - 1) } : null));
      }
    } catch (err: any) {
      setTutorMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: 'Không thể kết nối với Gia sư AI lúc này. Vui lòng thử lại sau giây lát!',
        },
      ]);
    } finally {
      setTutorLoading(false);
    }
  };

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

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('vocabflow:unread-messages', { detail: unreadSupportCount }));
  }, [unreadSupportCount]);
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
  // CSKH conversation is fetched lazily on-demand when support modal is opened (in handleSupportBtnClick)

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
  const isPlus = !isPro && (user?.tier === 'PLUS' || user?.subscription?.tier === 'PLUS');
  const isGuest = !user || user?.isAnonymous;

  const isKidSupported = isKidSupportedLanguage(activeLanguage);

  const navSections = [
    {
      title: 'TỔNG QUAN',
      items: [
        { to: '/dashboard', label: t('nav.dashboard', 'Bảng điều khiển'), icon: LayoutDashboard },
        { to: '/progress', label: 'Chỉ số UMS & Trí nhớ', icon: Award, badge: 'UMS' },
        { to: '/placement-test', label: t('nav.placementTest', 'Kiểm tra năng lực CEFR'), icon: Compass },
      ],
    },
    {
      title: 'TỪ VỰNG & NGỮ PHÁP',
      items: [
        { to: '/vocabulary', label: t('nav.vocabulary', 'Thư viện từ vựng'), icon: BookOpen },
        { to: '/word-bank', label: t('nav.wordBank', 'Kho từ của tôi'), icon: Bookmark },
        { to: '/review', label: t('nav.review', 'Ôn tập ngắt quãng SRS'), icon: Sparkles },
        { to: '/grammar', label: 'Ngữ pháp chuyên sâu', icon: BookCheck, badge: 'MỚI' },
        ...(isKidSupported
          ? [
              {
                to: '/kids',
                label: 'Tiếng Anh cho bé',
                icon: Baby,
                badge: 'KIDS',
              },
            ]
          : []),
      ],
    },
    {
      title: 'PHÒNG LUYỆN AI (PRO)',
      highlight: true,
      items: [
        {
          to: '/interview',
          label: 'AI Interview Studio (Phỏng vấn)',
          icon: Briefcase,
          badge: 'PRO',
          isUnlock: !isPro,
        },
        {
          to: '/coach',
          label: 'Gia sư AI Personal Coach',
          icon: Mic,
          badge: 'PRO',
          isUnlock: !isPro,
        },
        {
          to: '/ai-tutor',
          label: t('nav.aiTutor', 'Gia sư AI Studio (Hỏi đáp)'),
          icon: BrainCircuit,
          badge: 'AI',
        },
      ],
    },
    {
      title: 'LUYỆN THI & BỘ ĐỀ',
      items: [
        { to: '/exams', label: 'Ngân hàng bộ đề', icon: GraduationCap },
        { to: '/custom-quiz', label: t('nav.customQuiz', 'Trắc nghiệm tùy chọn'), icon: HelpCircle },
        {
          to: '/notes',
          label: 'Sổ ghi chép cá nhân',
          icon: StickyNote,
          badge: userNotesCount > 0 ? `${userNotesCount}` : undefined,
        },
      ],
    },
    {
      title: 'CỘNG ĐỒNG & THỬ THÁCH',
      items: [
        { to: '/community-knowledge', label: 'Bảng tin cộng đồng', icon: Sparkles, badge: 'HOT' },
        { to: '/games', label: 'Đấu trường phản xạ 24/7', icon: Gamepad2, badge: 'LIVE' },
        { to: '/leaderboard', label: 'Bảng xếp hạng Fair-Play', icon: Trophy },
        { to: '/community', label: t('nav.community', 'Cộng đồng chia sẻ kho từ'), icon: Share2 },
        { to: '/languages', label: 'Không gian đa ngữ', icon: Globe },
      ],
    },
    {
      title: 'HỆ THỐNG & TÀI KHOẢN',
      items: [
        {
          to: '/upgrade',
          label: isPro ? 'VocabFlow VIP' : 'Nâng Cấp Pro/VIP',
          icon: Crown,
          highlight: true,
          badge: isPro ? 'VIP' : 'PRO',
          isUnlock: !isPro,
        },
        { to: '/notifications', label: 'Trung tâm thông báo', icon: Bell },
        { to: '/feedback', label: 'Góp ý & Roadmap', icon: MessageSquare },
        { to: '/settings', label: t('nav.settings', 'Cài đặt hệ thống'), icon: Settings },
        ...(isAdmin ? [{ to: '/admin', label: t('nav.admin', 'Admin Center'), icon: ShieldCheck, admin: true }] : []),
      ],
    },
  ];

  const mobileBottomItems = [
    { to: '/dashboard', label: 'Trang chủ', icon: LayoutDashboard },
    { to: '/word-bank', label: 'Kho từ', icon: BookOpen },
    { to: '/review', label: 'Ôn tập', icon: Sparkles },
    { to: '/games', label: 'Trò chơi', icon: Gamepad2 },
    { to: '/coach', label: 'Gia sư AI', icon: Mic },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50/20 dark:bg-transparent text-slate-900 dark:text-slate-100 font-sans antialiased relative selection:bg-indigo-500 selection:text-white">
      {/* Ambient Blurred Colored Blobs / Orbs */}
      <LiquidBackground />

      {/* Desktop Sidebar — Fixed Header (Logo & Streak), Scrollable Menu, Luxurious Liquid Glass Tier Card & Dynamic Auth Controls */}
      <aside className={`hidden lg:flex flex-col border-r bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl pt-3.5 pb-3 shrink-0 h-screen sticky top-0 overflow-hidden box-border z-20 w-64 max-w-[16rem] px-3.5 transition-colors duration-300 ${
        isPro
          ? 'border-amber-400/35 dark:border-amber-500/25 shadow-[1px_0_20px_rgba(245,158,11,0.06)]'
          : isPlus
            ? 'border-cyan-400/35 dark:border-cyan-500/25 shadow-[1px_0_20px_rgba(6,182,212,0.06)]'
            : isGuest
              ? 'border-indigo-200/50 dark:border-indigo-900/40'
              : 'border-slate-200/60 dark:border-slate-800/60'
      }`}>
        {/* 1. FIXED TOP: Brand Logo & User Streak (NEVER scrolls, always stays pinned) */}
        <div className="shrink-0 pb-3 border-b border-slate-200/60 dark:border-slate-800/60 space-y-2.5">
          {/* Brand Header with Logo */}
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden cursor-pointer group"
              onClick={() => navigate('/dashboard')}
              title="VocabFlow Smart Adaptive English"
            >
              <VocabFlowLogo size="sm" showContainer={false} className="group-hover:scale-110 transition-transform duration-200" />
              <div className="min-w-0 flex-1 truncate">
                <span className="block font-extrabold text-base leading-tight tracking-tight text-slate-900 dark:text-white truncate">
                  VocabFlow
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate flex items-center gap-1">
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
        <div
          ref={sidebarNavScrollRef}
          data-sidebar-scroll="true"
          data-scroll-container="sidebar"
          onScroll={handleSidebarScroll}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-3 pr-1 space-y-3.5"
        >
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="flex items-center justify-between px-2.5 py-0.5">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {section.title}
                </span>
                {(section as any).highlight && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                    PREMIUM
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => (
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
                    <div className="flex items-center gap-2.5 flex-1 truncate mr-1.5 min-w-0">
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="truncate whitespace-nowrap">{item.label}</span>
                    </div>
                    {item.badge && (
                      (item as any).isUnlock ? (
                        <span className="relative overflow-hidden inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-amber-400/20 dark:bg-amber-400/15 backdrop-blur-md border border-amber-400/60 dark:border-amber-400/40 text-amber-900 dark:text-amber-200 text-[9px] font-black uppercase tracking-wider group-hover:border-amber-300 transition-all shrink-0 whitespace-nowrap">
                          <Crown className="w-2.5 h-2.5 text-amber-600 dark:text-amber-300 fill-amber-500 shrink-0" />
                          <span className="whitespace-nowrap">PRO</span>
                        </span>
                      ) : item.badge === 'PRO' || item.badge === 'VIP' ? (
                        <span className="shrink-0 text-[9px] uppercase font-black tracking-wider px-2 py-0.5 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 rounded-md border border-amber-300 shadow-sm flex items-center gap-1 whitespace-nowrap">
                          <Crown className="w-2.5 h-2.5 fill-slate-950 text-slate-950 shrink-0" />
                          <span className="whitespace-nowrap">{item.badge === 'VIP' ? 'VIP' : 'PRO'}</span>
                        </span>
                      ) : (
                        <span className="shrink-0 text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 bg-indigo-600 text-white rounded-md whitespace-nowrap">
                          {item.badge}
                        </span>
                      )
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 3. FIXED FOOTER: Dynamic Tier-Adaptive Footer, Account Tier Card, Profile & Auth Controls */}
        <div className={`shrink-0 pt-2.5 border-t w-full min-w-0 space-y-2 transition-all duration-300 rounded-b-2xl ${
          isPro
            ? 'border-amber-400/40 dark:border-amber-500/35 bg-gradient-to-t from-amber-500/[0.06] via-amber-500/[0.02] to-transparent'
            : isPlus
              ? 'border-cyan-400/35 dark:border-cyan-500/30 bg-gradient-to-t from-cyan-500/[0.06] via-cyan-500/[0.02] to-transparent'
              : isGuest
                ? 'border-indigo-200/70 dark:border-indigo-900/50 bg-gradient-to-t from-indigo-500/[0.04] to-transparent'
                : 'border-slate-200/80 dark:border-slate-800/80 bg-slate-500/[0.02]'
        }`}>
          {/* Account Tier Card — ALWAYS displayed (for Guests and Logged-in users) */}
          <div
            onClick={() => navigate('/upgrade')}
            className={`relative p-2.5 rounded-2xl cursor-pointer transition-all duration-300 group overflow-hidden ${
              isPro
                ? 'bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-400/60 shadow-md shadow-amber-500/10'
                : isPlus
                  ? 'bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-400/60 shadow-md shadow-cyan-500/10'
                  : isGuest
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/35 backdrop-blur-xl border border-indigo-200/80 dark:border-indigo-800/60 hover:border-indigo-400/80 shadow-xs'
                    : 'bg-amber-400/10 dark:bg-amber-400/[0.08] backdrop-blur-xl border border-amber-400/40 dark:border-amber-400/30 hover:border-amber-400/80 shadow-xs'
            }`}
            title="Xem chi tiết gói tài khoản hoặc nâng cấp"
          >
            {/* Specular Liquid Sheen Reflection */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

            <div className="flex items-center justify-between gap-2 min-w-0 relative z-10">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  isPro
                    ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-sm'
                    : isPlus
                      ? 'bg-gradient-to-tr from-cyan-500 to-teal-400 text-slate-950 shadow-sm'
                      : isGuest
                        ? 'bg-indigo-500/20 border border-indigo-400/40 text-indigo-600 dark:text-indigo-400'
                        : 'bg-amber-500/20 border border-amber-400/40 text-amber-500'
                }`}>
                  {isPro ? (
                    <Crown className="w-4 h-4 shrink-0 text-slate-950 fill-slate-950" />
                  ) : isPlus ? (
                    <Zap className="w-4 h-4 shrink-0 text-slate-950 fill-slate-950" />
                  ) : isGuest ? (
                    <Sparkles className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <Crown className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-300 fill-amber-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[10px] font-black uppercase tracking-wider whitespace-nowrap leading-tight truncate ${
                    isPro
                      ? 'text-amber-400'
                      : isPlus
                        ? 'text-cyan-400'
                        : isGuest
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {isPro
                      ? 'Đặc quyền Pro'
                      : isPlus
                        ? 'Gói Nâng Cao'
                        : isGuest
                          ? 'Gói Trải Nghiệm'
                          : 'Gói tài khoản'}
                  </p>
                  <p className={`text-xs font-black truncate leading-tight mt-0.5 whitespace-nowrap ${
                    isPro
                      ? 'text-amber-100'
                      : isPlus
                        ? 'text-cyan-100'
                        : isGuest
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-slate-800 dark:text-slate-100'
                  }`}>
                    {isPro
                      ? 'VocabFlow VIP'
                      : isPlus
                        ? 'VocabFlow Plus'
                        : isGuest
                          ? 'Khách Khám Phá'
                          : (user?.subscription?.tier === 'FREE' ? 'Tài khoản Free' : user?.subscription?.tier || 'Tài khoản Free')}
                  </p>
                </div>
              </div>

              {/* Action Pill - NEVER WRAPS */}
              <span className={`relative px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide flex items-center gap-1 shrink-0 whitespace-nowrap group-hover:scale-105 transition-transform duration-200 ${
                isPro
                  ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 shadow-sm'
                  : isPlus
                    ? 'bg-gradient-to-r from-cyan-400 via-cyan-300 to-teal-300 text-slate-950 shadow-sm'
                    : isGuest
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                      : 'bg-amber-400/25 border border-amber-400/60 text-amber-900 dark:text-amber-200'
              }`}>
                {isPro ? (
                  <>
                    <Crown className="w-2.5 h-2.5 fill-slate-950 text-slate-950 shrink-0" />
                    <span className="whitespace-nowrap">VIP</span>
                  </>
                ) : isPlus ? (
                  <>
                    <Zap className="w-2.5 h-2.5 fill-slate-950 text-slate-950 shrink-0" />
                    <span className="whitespace-nowrap">LÊN VIP</span>
                  </>
                ) : isGuest ? (
                  <>
                    <Crown className="w-2.5 h-2.5 text-amber-300 shrink-0" />
                    <span className="whitespace-nowrap">LÊN PRO</span>
                  </>
                ) : (
                  <>
                    <LockOpen className="w-2.5 h-2.5 text-amber-700 dark:text-amber-300 shrink-0" />
                    <span className="whitespace-nowrap">LÊN PRO</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* BELOW TIER CARD: Guest 1-Tap Login OR User Profile Row */}
          {isGuest ? (
            <div className="p-2 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/70 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap">
                  Đồng bộ & Lưu trữ
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight">
                Tiến độ đang lưu cục bộ. Đăng nhập để bảo lưu vĩnh viễn.
              </p>
              <button
                onClick={() => promptLogin('Lưu trữ vĩnh viễn tiến độ học và mở khóa đầy đủ tính năng')}
                className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap shadow-xs cursor-pointer active:scale-98"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">Đăng nhập 1-chạm</span>
              </button>
            </div>
          ) : (
            <div
              onClick={() => setProfileModalOpen(true)}
              className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition group min-w-0 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60"
              title="Bấm để xem hồ sơ cá nhân & Hướng dẫn sử dụng"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                  isPro
                    ? 'bg-gradient-to-tr from-amber-500 to-yellow-500 text-slate-950 font-black'
                    : isPlus
                      ? 'bg-gradient-to-tr from-cyan-500 to-blue-600'
                      : 'bg-gradient-to-tr from-brand-600 to-indigo-600'
                }`}>
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
          )}


        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 relative z-20 ${isFullHeightPage ? 'h-screen max-h-screen overflow-hidden' : 'pb-20 lg:pb-0'}`}>
        {/* Mobile Header — Clean, compact, never overflows or stretches */}
        <header className="lg:hidden flex items-center justify-between px-3.5 py-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-40 transition-colors shrink-0 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div
              onClick={() => navigate('/dashboard')}
              className="cursor-pointer flex items-center gap-2 group shrink-0"
              title="VocabFlow"
            >
              <VocabFlowLogo size="xs" showContainer={false} className="group-hover:scale-105 transition-transform" />
              <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">VocabFlow</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {renderStreakXpBadge(true)}
            <button
              onClick={togglePerformanceMode}
              title={isUltraEfficient ? 'Bật Giao diện Đầy đủ' : 'Bật Tiết kiệm GPU/RAM'}
              className={`p-2 rounded-xl transition ${
                isUltraEfficient
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Zap className={`w-4 h-4 ${isUltraEfficient ? 'fill-amber-500 text-amber-500' : ''}`} />
            </button>
            <NotificationBell />

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Menu điều hướng"
              title="Menu điều hướng & Công cụ"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Menu Overlay Drawer — FIXED OVERLAY, NEVER SCROLLS WITH PAGE */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-x-0 top-[53px] bottom-0 z-40 flex flex-col">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            {/* Drawer Menu Content */}
            <div
              className="relative z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3.5 space-y-3.5 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-top duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 1. Mobile Sidebar Top: User Profile & Streak */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                <div
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setProfileModalOpen(true);
                  }}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
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
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>

                {/* User Streak Pill */}
                <div className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between min-w-0">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs min-w-0 truncate">
                    <CountryFlag languageId={activeLanguage.id} countryCode={activeLanguage.countryCode} size="xs" />
                    <span className="truncate">{activeProfile.currentStreak || 0} Day Streak</span>
                  </div>
                  <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-extrabold shrink-0 border border-amber-500/30">
                    {activeProfile.level}
                  </span>
                </div>
              </div>

              {/* Language Space Selector */}
              <div className="flex justify-center bg-slate-50 dark:bg-slate-800/60 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <LanguageSwitcher variant="header" />
              </div>

              {/* 2. Upgrade / Account Status Banner (Moved from header) */}
              <div
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/upgrade');
                }}
                className="relative p-2.5 rounded-2xl bg-amber-400/10 dark:bg-amber-400/[0.08] backdrop-blur-xl border border-amber-400/40 hover:border-amber-400/80 cursor-pointer transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                    <Crown className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-wider leading-none whitespace-nowrap truncate">
                      {isPro ? 'VocabFlow Pro VIP' : 'Nâng cấp tài khoản'}
                    </p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate whitespace-nowrap">
                      {isPro ? 'Đã kích hoạt toàn bộ đặc quyền' : 'Mở khóa kho từ & AI không giới hạn'}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-wide shrink-0 whitespace-nowrap">
                  {isPro ? 'VIP PRO' : 'Mở khóa'}
                </span>
              </div>

              {/* 3. Mobile Header Actions Bar (Now nicely tucked in sidebar) */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (!user || user.isAnonymous) {
                      promptLogin('Đăng nhập để sử dụng ghi chép nhanh');
                      return;
                    }
                    setQuickNoteOpen(true);
                  }}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:bg-indigo-50 dark:hover:bg-slate-800 transition text-center"
                >
                  <BookOpen className="w-4 h-4 text-indigo-500 mb-1" />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Ghi chép</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (!user || user.isAnonymous) {
                      promptLogin('Đăng nhập để sử dụng tính năng nhắn tin');
                      return;
                    }
                    setChatDrawerOpen(true);
                  }}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:bg-indigo-50 dark:hover:bg-slate-800 transition text-center"
                >
                  <MessageSquare className="w-4 h-4 text-indigo-500 mb-1" />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Tin nhắn</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setSupportModalOpen(true);
                  }}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:bg-indigo-50 dark:hover:bg-slate-800 transition text-center"
                >
                  <Headphones className="w-4 h-4 text-indigo-500 mb-1" />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">CSKH</span>
                </button>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-center"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-400 mb-1" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-500 mb-1" />
                  )}
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    {theme === 'dark' ? 'Sáng' : 'Tối'}
                  </span>
                </button>
              </div>

              {/* 4. Navigation Menu Sections */}
              {navSections.map((section) => (
                <div key={section.title} className="space-y-1">
                  <div className="flex items-center justify-between px-2 py-0.5">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {section.title}
                    </span>
                    {(section as any).highlight && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                        PREMIUM
                      </span>
                    )}
                  </div>
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
                          <span className="truncate whitespace-nowrap">{item.label}</span>
                        </div>
                        {item.badge && (
                          (item as any).isUnlock ? (
                            <span className="relative overflow-hidden inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-amber-400/20 dark:bg-amber-400/15 backdrop-blur-md border border-amber-400/60 text-amber-900 dark:text-amber-200 text-[9px] font-black uppercase tracking-wider whitespace-nowrap shrink-0">
                              <Crown className="w-2.5 h-2.5 text-amber-500 dark:text-amber-300 fill-amber-400 shrink-0" />
                              <span className="whitespace-nowrap">PRO</span>
                            </span>
                          ) : item.badge === 'PRO' || item.badge === 'VIP' ? (
                            <span className="shrink-0 text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 rounded-md border border-amber-300 shadow-sm flex items-center gap-1 whitespace-nowrap">
                              <Crown className="w-2.5 h-2.5 fill-slate-950 text-slate-950 shrink-0" />
                              <span className="whitespace-nowrap">{item.badge}</span>
                            </span>
                          ) : (
                            <span className="shrink-0 text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 bg-indigo-600 text-white rounded-md whitespace-nowrap">
                              {item.badge}
                            </span>
                          )
                        )}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}

              {/* 5. ONLY Show Logout If Authenticated; Show Login If Guest */}
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
            {renderStreakXpBadge(false)}
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
                href={buildSsoUrl('admin')}
                onClick={(e) => {
                  e.preventDefault();
                  navigateToApp('admin');
                }}
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

            {/* Global Performance Mode Controller (Default vs Ultra Efficient) */}
            <button
              onClick={togglePerformanceMode}
              title={
                isUltraEfficient
                  ? 'Chế độ: Siêu tiết kiệm GPU/RAM (Bấm để bật Giao diện Đầy đủ)'
                  : 'Chế độ: Giao diện Đầy đủ (Bấm để bật Siêu tiết kiệm GPU/RAM)'
              }
              className={`h-8 px-2.5 xl:px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer ${
                isUltraEfficient
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${isUltraEfficient ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
              <span className="hidden xl:inline">{isUltraEfficient ? 'Tiết kiệm GPU' : 'Hiệu năng'}</span>
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
              <MessageSquare className="w-4 h-4" />
              <span className="hidden xl:inline">Tin nhắn</span>
            </button>
          </div>
        </header>

        {/* Routed Pages Container — Space-Optimized: full height for rich interactive workspaces */}
        <main
          data-scroll-container="true"
          className={`flex-1 w-full min-h-0 ${
            isFullHeightPage
              ? 'flex flex-col overflow-hidden p-0 max-w-none h-full pb-20 lg:pb-0'
              : 'max-w-[1680px] mx-auto p-4 sm:p-6 lg:p-8 pb-28 lg:pb-8'
          }`}
        >
          <Outlet />
        </main>

        {/* Mobile Thumb-Reach Bottom Navigation Bar */}
        <nav
          aria-label="Điều hướng di động"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)] flex items-center justify-around"
        >
          {mobileBottomItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-h-[48px] min-w-[56px] py-1 px-2 rounded-2xl transition-all duration-200 touch-manipulation active:scale-95 ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/80 dark:bg-indigo-950/50 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="text-[10.5px] leading-tight font-medium tracking-tight mt-0.5">{item.label}</span>
            </NavLink>
          ))}
        </nav>
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
                  className="btn-gold-glowing text-xs !py-1.5 !px-3.5 shadow-sm"
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
                navigateToApp('admin');
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

      {/* Right-Docked Vertical-Drag CSKH Support Button (Hidden for Admin & hidden on mobile so it never covers cards/content) */}
      {showSupportBtn && !isAdmin && (
        <div
          style={{
            top: btnPosY ? `${btnPosY}px` : '70vh',
          }}
          className={`hidden sm:block fixed right-0 z-40 touch-none select-none transition-shadow ${isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab'
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
            className="group relative h-10 rounded-l-2xl rounded-r-none bg-slate-900/95 hover:bg-slate-900 backdrop-blur-2xl border-y border-l border-r-0 border-indigo-500/50 hover:border-indigo-400/80 flex items-center justify-end p-1 transition-all duration-300 active:scale-95 text-white max-w-[42px] hover:max-w-[240px] overflow-hidden shadow-xl"
            aria-label="Gia sư AI & Chăm sóc khách hàng"
            title="Kéo trượt dọc mép phải màn hình • Rê chuột để mở Gia sư AI & CSKH"
          >
            {/* Expanding Label & Status (Hidden by default, slides out smoothly on hover to the left) */}
            <div className="flex flex-col text-left leading-none opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[180px] overflow-hidden whitespace-nowrap transition-all duration-300 px-0 group-hover:px-2.5 shrink-0 pointer-events-none group-hover:pointer-events-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-extrabold text-white tracking-wide group-hover:text-indigo-200 transition-colors whitespace-nowrap">
                  Gia sư AI & CSKH
                </span>
                {unreadSupportCount > 0 && (
                  <span className="text-[9px] font-bold text-white bg-rose-500 px-1.5 py-0.2 rounded-full animate-pulse">
                    {unreadSupportCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1 text-[9px] text-indigo-300/90 font-medium whitespace-nowrap">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                </span>
                <span>24/7 Sẵn sàng hỗ trợ</span>
              </div>
            </div>

            {/* CSKH Support Headphones Icon */}
            <div className="relative shrink-0 flex items-center justify-center w-7 h-7">
              <Headphones className="w-5 h-5 text-indigo-300 group-hover:text-white group-hover:scale-110 transition-all" />
              {unreadSupportCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-pulse" />
              )}
            </div>
          </button>
        </div>
      )}

      {/* Customer Support & Mini AI Tutor Floating Widget (Hidden for Admin) */}
      {supportModalOpen && !isAdmin && (
        <>
          {/* Backdrop to dismiss when clicking outside */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 animate-fade-in"
            onClick={() => setSupportModalOpen(false)}
            aria-hidden="true"
          />

          <div
            className="fixed inset-x-2 bottom-2 sm:inset-x-auto sm:right-6 sm:bottom-6 z-50 animate-scale-up"
          >
            <div
              className="w-full sm:w-[520px] md:w-[560px] rounded-3xl bg-slate-900/98 backdrop-blur-2xl border border-slate-700/80 p-3.5 sm:p-4 space-y-2.5 flex flex-col h-[88vh] max-h-[850px] min-h-[520px] overflow-hidden text-slate-100 shadow-2xl"
            >
              {/* Header with Title & Status calibrated to current tab */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2.5">
                  <VocabFlowLogo size="md" showContainer={false} className="w-8 h-8 object-contain shrink-0" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-black text-white leading-snug tracking-tight">
                        {supportTab === 'tutor' ? 'Gia Sư VocabFlow AI' : 'VocabFlow CSKH 24/7'}
                      </h4>
                      {supportTab === 'tutor' && (
                        <span className="px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-black uppercase tracking-wider">
                          1-on-1
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>{supportTab === 'tutor' ? 'Hỗ trợ giải đáp ngữ cảnh & Dẫn chứng cộng đồng' : 'Trực tuyến 24/7'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSupportModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    aria-label="Đóng"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Support & AI Navigation Tabs (3 Tabs) */}
              <div className="grid grid-cols-3 p-1 rounded-2xl bg-slate-800/90 text-xs font-bold border border-slate-700/70 shrink-0">
                <button
                  type="button"
                  onClick={() => setSupportTab('tutor')}
                  className={`py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                    supportTab === 'tutor'
                      ? 'bg-indigo-600 text-white shadow-xs border border-indigo-400/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <VocabFlowLogo size="xs" showContainer={false} className="w-3.5 h-3.5 object-contain" />
                  <span>Gia sư AI</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSupportTab('chat')}
                  className={`py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                    supportTab === 'chat'
                      ? 'bg-slate-700 text-cyan-300 shadow-xs border border-cyan-400/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Headphones className="w-3.5 h-3.5 text-indigo-500" />
                  <span>CSKH</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSupportTab('quick')}
                  className={`py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                    supportTab === 'quick'
                      ? 'bg-slate-700 text-cyan-300 shadow-xs border border-cyan-400/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Liên hệ</span>
                </button>
              </div>

              {/* Tab 0: Mini AI Tutor Chat Pane */}
              {supportTab === 'tutor' && (
                <div className="flex-1 flex flex-col min-h-0 space-y-2">
                  {/* Quota and Fullscreen shortcut */}
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-[11px] shrink-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-semibold text-slate-200 truncate">
                        {isPro ? 'Gói Pro: Không giới hạn' : `Còn: ${tutorQuota?.remaining ?? 10} lượt (~${((tutorQuota?.remaining ?? 10) * 1500).toLocaleString()} tok)`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSupportModalOpen(false);
                        navigate('/ai-tutor');
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 text-[11px] hover:underline shrink-0"
                    >
                      <span>Mở giao diện lớn</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Messages Area (Spacious & with Citations) */}
                  <div className="flex-1 min-h-0 bg-slate-950/60 rounded-2xl p-3 sm:p-3.5 overflow-y-auto space-y-3.5 text-xs border border-slate-800/80">
                    {tutorMessages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end items-end' : 'justify-start items-start'}`}
                      >
                        {m.role === 'assistant' && (
                          <div className="shrink-0 mt-1">
                            <VocabFlowLogo size="xs" showContainer={false} className="w-6 h-6 object-contain select-none" />
                          </div>
                        )}
                        
                        <div
                          className={`max-w-[86%] p-3 sm:p-3.5 rounded-2xl text-xs leading-relaxed space-y-1.5 shadow-md ${
                            m.role === 'user'
                              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-xs shadow-indigo-950/40 border border-indigo-500/30'
                              : 'bg-slate-900/95 text-slate-100 rounded-tl-xs border border-slate-800'
                          }`}
                        >
                          {m.role === 'user' ? (
                            <div>
                              <div className="flex items-center justify-between gap-3 text-[10px] text-indigo-200/80 pb-1 mb-1 border-b border-indigo-500/30 font-medium">
                                <span className="font-bold flex items-center gap-1">
                                  <User className="w-3 h-3 text-indigo-300" />
                                  <span>{user?.displayName || 'Bạn'}</span>
                                </span>
                                <span className="text-[9px] opacity-75">
                                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                            </div>
                          ) : (
                            <RichAIMessageRenderer
                              content={m.content}
                              provider={(m as any).provider}
                              isCompact={true}
                              isCached={m.isCached}
                              citations={m.citations}
                              onSelectQuizOption={(opt) => handleSendTutorMessage(opt)}
                            />
                          )}
                        </div>
                        {m.role === 'user' && (
                          <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center shrink-0 text-xs font-bold shadow-xs mt-0.5">
                            {user?.displayName ? user.displayName.slice(0, 1).toUpperCase() : <User className="w-3.5 h-3.5 text-slate-400" />}
                          </div>
                        )}
                      </div>
                    ))}
                    {tutorLoading && (
                      <div className="flex items-center gap-2 text-indigo-400 text-xs py-1">
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        <span>Gia sư AI đang trích xuất kho tri thức...</span>
                      </div>
                    )}
                    <div ref={tutorMessagesEndRef} />
                  </div>

                  {/* Real-time DB Question & Vocabulary Suggestions Popup (Only shown when user types) */}
                  {tutorInput.trim() && showTutorSuggestions && tutorSuggestions.length > 0 && (
                    <div className="p-2 rounded-xl bg-slate-900/95 border border-indigo-500/40 shadow-2xl space-y-1 shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <div className="flex items-center justify-between px-1.5 py-0.5 text-[10px] font-bold border-b border-slate-800 text-indigo-300">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span>Gợi ý câu hỏi tương tự từ thư viện DB:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowTutorSuggestions(false)}
                          className="p-0.5 text-slate-400 hover:text-white cursor-pointer"
                          title="Đóng gợi ý"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-slate-800/80 pr-0.5">
                        {tutorSuggestions.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setShowTutorSuggestions(false);
                              handleSendTutorMessage(item.title);
                            }}
                            className="w-full text-left p-1.5 rounded-lg hover:bg-slate-800/90 flex items-center justify-between gap-2 transition group cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              {item.hasCache ? (
                                <Zap className="w-3 h-3 text-amber-400 shrink-0 fill-amber-400" />
                              ) : (
                                <BookOpen className="w-3 h-3 text-indigo-400 shrink-0" />
                              )}
                              <span className="text-[11px] font-medium text-slate-200 group-hover:text-white truncate">
                                {item.title}
                              </span>
                            </div>
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 flex items-center gap-0.5 ${
                                item.hasCache
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              }`}
                            >
                              {item.tokenBadge || (item.hasCache ? '⚡ 0 tok (Kho tri thức)' : '~1.2k tok')}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Real-time Token Cost Estimate beneath typing */}
                  {tutorInput.trim() && (
                    <div className="px-2.5 py-1 rounded-xl bg-indigo-950/50 border border-indigo-800/50 text-[10px] text-indigo-300 flex items-center justify-between shrink-0">
                      <span>Ước tính: ~{Math.min(1500, Math.ceil(tutorInput.length / 3) + 780)} tokens</span>
                      <span>1 lượt hỏi</span>
                    </div>
                  )}

                  {/* Tutor Input Box */}
                  <div className="pt-1 border-t border-slate-800 flex items-center gap-1.5 shrink-0">
                    <input
                      type="text"
                      value={tutorInput}
                      onChange={(e) => setTutorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setShowTutorSuggestions(false);
                          handleSendTutorMessage();
                        }
                      }}
                      disabled={tutorLoading}
                      placeholder="Nhập câu hỏi để tìm trong thư viện hoặc hỏi Gia sư AI..."
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowTutorSuggestions(false);
                        handleSendTutorMessage();
                      }}
                      disabled={!tutorInput.trim() || tutorLoading}
                      className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shrink-0 transition"
                      aria-label="Gửi câu hỏi cho Gia sư AI"
                    >
                      <Send className={`w-3.5 h-3.5 ${tutorLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 1: Realtime Support Chat */}
              {supportTab === 'chat' && (
                <div className="flex-1 flex flex-col min-h-0 space-y-2">
                  {/* Virtualized Messages Scroll Area with Dynamic Height */}
                  <div className="flex-1 min-h-0 bg-slate-950/50 rounded-xl overflow-hidden text-xs relative border border-slate-800/80">
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
              )}

              {/* Tab 2: Quick Links / Facebook / FAQ */}
              {supportTab === 'quick' && (
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
                          className="w-5 h-5 object-contain"
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
        className="hidden lg:flex fixed bottom-6 right-5 z-40 w-11 h-11 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-lg shadow-slate-900/10 dark:shadow-black/30 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/90 dark:hover:bg-slate-800/90 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center group cursor-pointer"
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
