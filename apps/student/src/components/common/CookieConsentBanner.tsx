import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ShieldCheck, Check, X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'vocabflow_cookie_consent';

export interface CookieConsentState {
  essential: boolean;
  analytics: boolean;
  agreedAt: string;
  version: string;
}

export const CookieConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!stored) {
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  const handleAcceptAll = () => {
    const consent: CookieConsentState = {
      essential: true,
      analytics: true,
      agreedAt: new Date().toISOString(),
      version: '2026.11',
    };
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    } catch {}
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    const consent: CookieConsentState = {
      essential: true,
      analytics: false,
      agreedAt: new Date().toISOString(),
      version: '2026.11',
    };
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    } catch {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Thông báo đồng ý sử dụng Cookie và bảo vệ dữ liệu"
      className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-lg z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="p-4 sm:p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl shadow-slate-900/15 text-slate-800 dark:text-slate-100 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
              <span>Bảo vệ quyền riêng tư & Cookie</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              VocabFlow sử dụng cookie và bộ nhớ trình duyệt nhằm duy trì phiên đăng nhập và đồng bộ tiến độ học ngắt quãng (SRS). Chúng tôi cam kết bảo vệ dữ liệu cá nhân theo Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 và Nghị định 356/2025/NĐ-CP.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAcceptEssential}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
          <Link
            to="/privacy-policy"
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
          >
            Xem Chính sách bảo mật
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAcceptEssential}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-semibold transition text-xs"
            >
              Chỉ thiết yếu
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition text-xs shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Đồng ý tất cả</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
