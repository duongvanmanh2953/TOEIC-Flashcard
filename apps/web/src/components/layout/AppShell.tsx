import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
  Menu,
  X,
  Compass,
  Bookmark,
  Share2,
  HelpCircle,
  Crown,
  ShieldCheck,
  ChevronRight,
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
} from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';
import api from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { VirtualChatPane } from '../chat/VirtualChatPane';

export const AppShell: React.FC = () => {
  const { user, logout, theme, toggleTheme, promptLogin } = useAuth();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [showSupportBtn, setShowSupportBtn] = useState(() => {
    return (
      localStorage.getItem('vocabflow_show_support_btn') !== 'false' &&
      localStorage.getItem('leximind_show_support_btn') !== 'false'
    );
  });
  const navigate = useNavigate();

  useEffect(() => {
    const handleStorage = () => {
      setShowSupportBtn(
        localStorage.getItem('vocabflow_show_support_btn') !== 'false' &&
        localStorage.getItem('leximind_show_support_btn') !== 'false'
      );
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const [supportTab, setSupportTab] = useState<'quick' | 'chat'>('chat');
  
  // Draggable CSKH Support Button State
  const [btnPos, setBtnPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number; moved: boolean } | null>(null);

  const handleDragStart = (clientX: number, clientY: number) => {
    const defaultX = window.innerWidth - 68;
    const defaultY = window.innerHeight - 88;
    const currentX = btnPos ? btnPos.x : defaultX;
    const currentY = btnPos ? btnPos.y : defaultY;
    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initX: currentX,
      initY: currentY,
      moved: false,
    };
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!dragStartRef.current) return;
    const dx = clientX - dragStartRef.current.startX;
    const dy = clientY - dragStartRef.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragStartRef.current.moved = true;
      setIsDragging(true);
      const newX = Math.max(16, Math.min(window.innerWidth - 64, dragStartRef.current.initX + dx));
      const newY = Math.max(16, Math.min(window.innerHeight - 64, dragStartRef.current.initY + dy));
      setBtnPos({ x: newX, y: newY });
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
    // Nếu vị trí đã bị kéo đi nơi khác, click sẽ tự động nhảy về vị trí mặc định ban đầu!
    if (btnPos !== null) {
      setBtnPos(null);
    }
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
    if (!user) {
      promptLogin();
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

  const navItems = [
    { to: '/dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { to: '/review', label: t('nav.review', 'Smart Review'), icon: Sparkles, badge: 'SRS' },
    { to: '/vocabulary', label: t('nav.vocabulary', 'Vocab Explorer'), icon: BookOpen },
    { to: '/word-bank', label: t('nav.wordBank', 'My Word Bank'), icon: Bookmark },
    { to: '/community', label: t('nav.community', 'Community Decks'), icon: Share2 },
    { to: '/custom-quiz', label: t('nav.customQuiz', 'Dynamic Quiz'), icon: HelpCircle },
    { to: '/ai-tutor', label: t('nav.aiTutor', 'AI Tutor'), icon: BrainCircuit },
    { to: '/placement-test', label: t('nav.placementTest', 'Placement Test'), icon: Compass },
    { to: '/progress', label: t('nav.progress', 'Progress & Stats'), icon: Award },
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
    ...(isAdmin ? [{ to: '/admin', label: t('nav.admin', 'Admin Center'), icon: ShieldCheck, admin: true }] : []),
    { to: '/settings', label: t('nav.settings', 'Settings'), icon: Settings },
  ];

  const mobileBottomItems = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/review', label: 'Review', icon: Sparkles },
    { to: '/vocabulary', label: 'Vocab', icon: BookOpen },
    { to: '/ai-tutor', label: 'AI', icon: BrainCircuit },
    { to: '/word-bank', label: 'Saved', icon: Bookmark },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50/20 dark:bg-transparent text-slate-900 dark:text-slate-100 font-sans antialiased relative selection:bg-indigo-500 selection:text-white">
      {/* Ambient Blurred Colored Blobs / Orbs */}
      <LiquidBackground />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 max-w-[16rem] border-r border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl px-3.5 pt-5 pb-4 shrink-0 h-screen sticky top-0 overflow-hidden box-border z-20">
        {/* Scrollable Upper Navigation Area */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-0.5 pb-2">
          {/* Brand Header with VocabFlow Logo Asset */}
          <div className="flex items-center justify-between mb-5 px-1 w-full min-w-0">
            <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
              <img
                src="/vocabflow-logo-256.png"
                alt="VocabFlow Logo"
                className="w-9 h-9 rounded-xl object-contain shadow-xs shrink-0"
              />
              <div className="min-w-0 flex-1 truncate">
                <h2 className="font-extrabold text-base leading-tight tracking-tight text-slate-900 dark:text-white truncate">
                  VocabFlow
                </h2>
                <p className="text-[11px] text-slate-400 font-medium truncate">Smart Adaptive English</p>
              </div>
            </div>
          </div>

          {/* User Streak Pill */}
          <div className="mb-4 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs min-w-0 truncate">
              <Flame className="w-4 h-4 fill-amber-500 shrink-0" />
              <span className="truncate">{user?.streak?.currentStreak || 0} Day Streak</span>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-extrabold shrink-0 ml-1">
              Lvl {user?.xp?.currentLevel || 1}
            </span>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1 w-full min-w-0 overflow-hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 min-w-0 overflow-hidden ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm'
                      : item.admin
                      ? 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30'
                      : item.highlight
                      ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  }`
                }
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 truncate mr-1.5">
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`shrink-0 text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-md shadow-xs ml-1 flex items-center gap-1 ${
                      (item as any).isUnlock
                        ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-amber-500/20'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {(item as any).isUnlock && <LockOpen className="w-2.5 h-2.5 text-amber-200" />}
                    <span>{item.badge}</span>
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {isAdmin && (
            <div className="pt-2 px-1">
              <NavLink
                to="/admin"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 transition group shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>🛠 Admin Center</span>
                </div>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500 text-slate-950">
                  ADM
                </span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Pinned User Footer: strictly fixed at bottom */}
        <div className="shrink-0 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 w-full min-w-0 space-y-2 bg-transparent">
          {user?.isAnonymous ? (
            <div className="p-2.5 rounded-2xl bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/25 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Khách Khám Phá
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                Tiến độ đang lưu cục bộ. Đăng nhập để bảo lưu vĩnh viễn.
              </p>
              <button
                onClick={() => promptLogin('Lưu trữ vĩnh viễn tiến độ học và các từ yêu thích')}
                className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Đăng nhập 1-chạm</span>
              </button>
            </div>
          ) : (
            <>
              {/* Account Tier Pill — positioned right above avatar & email */}
              <div
                onClick={() => navigate('/upgrade')}
                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-amber-500/10 border border-indigo-500/20 hover:border-indigo-500/40 flex items-center justify-between cursor-pointer transition group"
                title="Xem chi tiết gói tài khoản hoặc nâng cấp"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">
                      Gói tài khoản
                    </p>
                    <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 truncate leading-tight mt-0.5">
                      {isPro ? 'VocabFlow Pro (VIP)' : (user?.subscription?.tier || 'Free Tier')}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md bg-indigo-600 text-white group-hover:bg-indigo-500 transition shrink-0 flex items-center gap-1">
                  {isPro ? (
                    <>
                      <Crown className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
                      <span>PRO</span>
                    </>
                  ) : (
                    <>
                      <LockOpen className="w-2.5 h-2.5 text-amber-200" />
                      <span>Mở khóa</span>
                    </>
                  )}
                </span>
              </div>

              {/* User Profile Info Row with > Icon (Clickable to open profile details & guide) */}
              <div
                onClick={() => setProfileModalOpen(true)}
                className="flex items-center justify-between gap-2 p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition group min-w-0 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60"
                title="Bấm để xem hồ sơ cá nhân & Hướng dẫn sử dụng"
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
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition shrink-0" />
              </div>
            </>
          )}

          {/* Theme & Logout Controls */}
          <div className="flex items-center gap-1.5 px-0.5">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{theme === 'dark' ? t('nav.lightMode', 'Light') : t('nav.darkMode', 'Dark')}</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              title={t('nav.logout', 'Logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0 overflow-x-hidden relative z-10">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <img
              src="/vocabflow-logo-256.png"
              alt="VocabFlow"
              className="w-8 h-8 rounded-xl object-contain shrink-0"
            />
            <span className="font-extrabold text-base text-slate-900 dark:text-white">
              VocabFlow
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isPro && (
              <button
                onClick={() => navigate('/upgrade')}
                className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 text-white text-[11px] font-black uppercase flex items-center gap-1 shadow-xs"
              >
                <LockOpen className="w-3.5 h-3.5 text-amber-200" />
                <span>Mở khóa</span>
              </button>
            )}
            <NotificationBell />
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

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 bg-indigo-600 text-white rounded-md">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/25"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>🛠 Admin Center</span>
                </div>
                <span className="text-[9px] uppercase font-black px-1.5 py-0.5 bg-amber-500 text-slate-950 rounded-md">
                  ADMIN
                </span>
              </NavLink>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('nav.logout', 'Logout')}</span>
            </button>
          </div>
        )}

        {/* Desktop Top Header Bar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 tracking-wide">
              VocabFlow AI • Nền tảng học từ vựng thông minh
            </span>
          </div>

          <div className="flex items-center gap-3">
            <NavLink
              to="/feedback"
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Góp ý & Roadmap</span>
            </NavLink>

            {isAdmin && (
              <NavLink
                to="/admin"
                className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/40 flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>🛠 Admin Center</span>
              </NavLink>
            )}

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

            {/* Notification Bell with Badge & Dropdown */}
            <NotificationBell />
          </div>
        </header>

        {/* Routed Pages Container — Responsive & Laptop-Optimized */}
        <main className="flex-1 p-3 sm:p-4 lg:p-5 w-full max-w-none">
          <Outlet />
        </main>

        {/* Mobile Thumb-Reach Bottom Navigation Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-around py-2 px-1 shadow-lg">
          {mobileBottomItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                  isActive
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
                  navigate('/admin');
                }}
                className="w-full mb-3 py-2 px-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-amber-500/25 transition shadow-xs"
              >
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Mở 🛠 Admin Center (Quản Trị Hệ Thống)</span>
              </button>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
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
      </ModalPortal>

      {/* Draggable CSKH Support Button (Hidden for Admin because Admin has Support Inbox) */}
      {showSupportBtn && !isAdmin && (
        <div
          style={
            btnPos
              ? { left: `${btnPos.x}px`, top: `${btnPos.y}px`, right: 'auto', bottom: 'auto' }
              : undefined
          }
          className={`fixed z-40 touch-none select-none transition-shadow ${
            btnPos ? '' : 'bottom-20 lg:bottom-6 right-5'
          } ${isDragging ? 'cursor-grabbing scale-110' : 'cursor-grab'}`}
          onMouseDown={(e) => {
            handleDragStart(e.clientX, e.clientY);
            const onMouseMove = (moveEvent: MouseEvent) => {
              handleDragMove(moveEvent.clientX, moveEvent.clientY);
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
            const touch = e.touches[0];
            handleDragStart(touch.clientX, touch.clientY);
          }}
          onTouchMove={(e) => {
            const touch = e.touches[0];
            handleDragMove(touch.clientX, touch.clientY);
          }}
          onTouchEnd={handleDragEnd}
        >
          <button
            onClick={handleSupportBtnClick}
            className="group relative h-12 pl-2.5 pr-4 rounded-2xl bg-slate-900/90 hover:bg-slate-900 backdrop-blur-2xl border border-cyan-500/40 hover:border-cyan-400/80 shadow-[0_10px_30px_rgba(0,0,0,0.6),0_0_25px_rgba(6,182,212,0.25)] hover:shadow-[0_14px_40px_rgba(0,0,0,0.7),0_0_35px_rgba(6,182,212,0.4)] flex items-center gap-3 transition-all duration-300 active:scale-95 text-white"
            aria-label="Trung tâm Chăm sóc khách hàng CSKH"
            title={btnPos ? 'Bấm để hoàn về vị trí gốc & mở Chat' : 'Kéo thả tới bất kỳ vị trí nào trên màn hình'}
          >
            {/* Glowing Icon Container */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500/25 to-indigo-500/35 border border-cyan-400/50 flex items-center justify-center text-cyan-300 group-hover:text-cyan-100 transition-colors relative overflow-hidden shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <Headphones className="w-4.5 h-4.5 text-cyan-300 group-hover:scale-110 transition-transform" />
            </div>

            {/* Label & Status */}
            <div className="flex flex-col text-left leading-none">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-extrabold text-white tracking-wide group-hover:text-cyan-200 transition-colors">
                  Hỗ trợ CSKH
                </span>
                {unreadSupportCount > 0 ? (
                  <span className="text-[9px] font-bold text-white bg-rose-500 px-1.5 py-0.2 rounded-full animate-pulse">
                    {unreadSupportCount}
                  </span>
                ) : btnPos && (
                  <span className="text-[9px] font-bold text-amber-300 bg-amber-400/15 border border-amber-400/40 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                    <RotateCcw className="w-2.5 h-2.5" /> Hoàn vị trí
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-cyan-300/90 font-medium">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                </span>
                <span>24/7 Trực tuyến</span>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Customer Support Floating Chat Widget (Hidden for Admin) */}
      {supportModalOpen && !isAdmin && (
        <div
          style={
            btnPos
              ? {
                  left: `${Math.min(window.innerWidth - 415, Math.max(12, btnPos.x - 340))}px`,
                  top: `${Math.min(window.innerHeight - 560, Math.max(12, btnPos.y - 480))}px`,
                  right: 'auto',
                  bottom: 'auto',
                }
              : undefined
          }
          className={`fixed z-50 animate-scale-up ${
            btnPos ? '' : 'bottom-24 lg:bottom-20 right-5'
          }`}
        >
          <div
            className="w-[calc(100vw-2rem)] sm:w-[330px] rounded-2xl bg-slate-900 border border-slate-700/80 shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-3.5 space-y-2.5 flex flex-col max-h-[80vh] sm:max-h-[460px] overflow-hidden text-slate-100"
          >
            {/* Header with Title & Online status */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shadow-xs border border-indigo-500/30">
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
          <div className="grid grid-cols-2 p-0.5 rounded-xl bg-slate-800/90 text-[11px] font-bold border border-slate-700/70">
            <button
              type="button"
              onClick={() => setSupportTab('chat')}
              className={`py-1 rounded-lg transition ${
                supportTab === 'chat'
                  ? 'bg-slate-700 text-cyan-300 shadow-xs border border-cyan-400/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              💬 Chat trực tiếp
            </button>
            <button
              type="button"
              onClick={() => setSupportTab('quick')}
              className={`py-1 rounded-lg transition ${
                supportTab === 'quick'
                  ? 'bg-slate-700 text-cyan-300 shadow-xs border border-cyan-400/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Kênh liên hệ
            </button>
          </div>

          {/* Tab 1: Realtime Support Chat */}
          {supportTab === 'chat' ? (
            <div className="flex-1 flex flex-col min-h-0 space-y-2">
              {/* Virtualized Messages Scroll Area with Scroll Loading, Worker Processing & Read Receipts */}
              <div className="h-56 min-h-0 bg-slate-950/50 rounded-xl overflow-hidden text-xs relative border border-slate-800/80">
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

              {/* Chat Composer Input */}
              <div className="pt-1.5 border-t border-slate-800 flex items-center gap-1.5">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  disabled={sendingMsg}
                  placeholder={user ? "Nhập tin nhắn..." : "Đăng nhập để gửi tin nhắn..."}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || sendingMsg}
                  className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shrink-0 transition"
                  aria-label="Gửi tin nhắn"
                >
                  <Send className={`w-3.5 h-3.5 ${sendingMsg ? 'animate-spin' : ''}`} />
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

          <div className="pt-2 text-center text-[11px] text-slate-400 border-t border-slate-800">
            🔒 Kết nối bảo mật • Không bao giờ yêu cầu mật khẩu hay mã OTP
          </div>
        </div>
      </div>
    )}
    </div>
  );
};
