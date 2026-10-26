import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '../i18n';

export const ROUTE_TITLE_MAP: Record<string, { vi: string; en: string }> = {
  '/': { vi: 'Học Từ Vựng & Flashcard Thông Minh', en: 'Smart Vocabulary & Flashcards' },
  '/dashboard': { vi: 'Bảng Điều Khiển Học Tập', en: 'Learning Dashboard' },
  '/languages': { vi: 'Không Gian Ngôn Ngữ', en: 'My Languages' },
  '/review': { vi: 'Phiên Ôn Tập FSRS', en: 'SRS Review Session' },
  '/vocabulary': { vi: 'Khám Phá Từ Vựng TOEIC', en: 'Vocabulary Explorer' },
  '/word-bank': { vi: 'Sổ Từ Vựng Cá Nhân', en: 'My Word Bank' },
  '/community': { vi: 'Bộ Thẻ Cộng Đồng', en: 'Community Decks' },
  '/community-knowledge': { vi: 'Kho Tri Thức Học Thuật', en: 'Community Knowledge' },
  '/notes': { vi: 'Sổ Tay Ghi Chú Thông Minh', en: 'Smart Study Notes' },
  '/ai-tutor': { vi: 'Gia Sư VocabFlow AI 24/7', en: 'AI Tutor 24/7' },
  '/ai-coach': { vi: 'AI Coach Studio', en: 'AI Coach Studio' },
  '/subscription': { vi: 'Nâng Cấp Gói VIP Pro', en: 'Upgrade Pro VIP' },
  '/pricing': { vi: 'Bảng Giá & Gói Hội Viên', en: 'Pricing & Plans' },
  '/leaderboard': { vi: 'Bảng Xếp Hạng Đua Top', en: 'Leaderboard' },
  '/games': { vi: 'Đấu Trường Game Từ Vựng', en: 'Word Arena Games' },
  '/exams': { vi: 'Khảo Thí & Luyện Đề TOEIC', en: 'TOEIC Exam Bank' },
  '/progress': { vi: 'Phân Tích Tiến Độ Học Tập', en: 'Progress Analytics' },
  '/settings': { vi: 'Cài Đặt Hệ Thống', en: 'Account Settings' },
  '/notifications': { vi: 'Trung Tâm Thông Báo', en: 'Notification Center' },
  '/support': { vi: 'Hỗ Trợ Học Viên Trực Tuyến', en: 'Customer Support' },
  '/feedback': { vi: 'Hộp Thư Góp Ý', en: 'Feedback Portal' },
  '/login': { vi: 'Đăng Nhập Tài Khoản', en: 'Sign In' },
  '/register': { vi: 'Đăng Ký Tài Khoản', en: 'Create Account' },
  '/forgot-password': { vi: 'Khôi Phục Mật Khẩu', en: 'Reset Password' },
  '/terms-of-service': { vi: 'Điều Khoản Dịch Vụ', en: 'Terms of Service' },
  '/privacy-policy': { vi: 'Chính Sách Bảo Mật', en: 'Privacy Policy' },
  '/payment-policy': { vi: 'Chính Sách Thanh Toán', en: 'Payment Policy' },
  '/delivery-refund-policy': { vi: 'Chính Sách Giao Nhận & Hoàn Tiền', en: 'Refund Policy' },
  '/complaint-resolution': { vi: 'Giải Quyết Khiếu Nại', en: 'Complaint Resolution' },
};

function resolvePageTitle(pathname: string, lang: 'vi' | 'en'): string {
  // 1. Direct exact match
  if (ROUTE_TITLE_MAP[pathname]) {
    return ROUTE_TITLE_MAP[pathname][lang];
  }

  // 2. Prefix matching for dynamic sub-routes
  for (const [route, titleObj] of Object.entries(ROUTE_TITLE_MAP)) {
    if (route !== '/' && pathname.startsWith(route)) {
      return titleObj[lang];
    }
  }

  return lang === 'vi' ? 'Nền Tảng Học Từ Vựng Thông Minh' : 'Smart Learning Platform';
}

export function useDynamicDocumentTitle(customTitle?: string) {
  const location = useLocation();
  const { locale } = useTranslation();
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const handleNotifs = (e: any) => {
      const count = typeof e.detail === 'number' ? e.detail : 0;
      setUnreadNotifs(Math.max(0, count));
    };

    const handleMessages = (e: any) => {
      const count = typeof e.detail === 'number' ? e.detail : 0;
      setUnreadMessages(Math.max(0, count));
    };

    window.addEventListener('vocabflow:unread-notifs', handleNotifs);
    window.addEventListener('vocabflow:unread-messages', handleMessages);

    return () => {
      window.removeEventListener('vocabflow:unread-notifs', handleNotifs);
      window.removeEventListener('vocabflow:unread-messages', handleMessages);
    };
  }, []);

  useEffect(() => {
    const lang = (locale === 'en' ? 'en' : 'vi') as 'vi' | 'en';
    const baseTitle = customTitle || resolvePageTitle(location.pathname, lang);
    const totalUnread = unreadNotifs + unreadMessages;

    if (totalUnread > 0) {
      document.title = `(${totalUnread}) ${baseTitle} — VocabFlow AI`;
    } else {
      document.title = `${baseTitle} — VocabFlow AI`;
    }

    // Keep HTML lang synchronized
    document.documentElement.lang = lang;

    // Coordinate robots meta tag for public vs private/authenticated routes
    const isPrivateRoute =
      location.pathname.startsWith('/dashboard') ||
      location.pathname.startsWith('/admin') ||
      location.pathname.startsWith('/review') ||
      location.pathname.startsWith('/word-bank') ||
      location.pathname.startsWith('/settings') ||
      location.pathname.startsWith('/notifications') ||
      location.pathname.startsWith('/feedback') ||
      location.pathname.startsWith('/custom-quiz') ||
      location.pathname.startsWith('/placement-test') ||
      location.pathname.startsWith('/coach') ||
      location.pathname.startsWith('/ai-tutor') ||
      location.pathname.startsWith('/notes');

    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', isPrivateRoute ? 'noindex, nofollow' : 'index, follow');
  }, [location.pathname, locale, customTitle, unreadNotifs, unreadMessages]);
}

