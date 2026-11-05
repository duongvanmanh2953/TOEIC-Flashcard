import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ModalPortal } from '../common/ModalPortal';
import { VocabFlowLogo } from '@vocabflow/shared';
import { X, CheckCircle2 } from 'lucide-react';

export const ContextualLoginModal: React.FC = () => {
  const navigate = useNavigate();
  const { loginPromptOpen, loginPromptReason, closeLoginPrompt, loginWithGoogle, loginWithFacebook } =
    useAuth();
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'facebook' | null>(null);

  if (!loginPromptOpen) return null;

  const handleGoogleLogin = async () => {
    setLoadingProvider('google');
    try {
      await loginWithGoogle();
      closeLoginPrompt();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleFacebookLogin = async () => {
    setLoadingProvider('facebook');
    try {
      await loginWithFacebook();
      closeLoginPrompt();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <ModalPortal isOpen={loginPromptOpen} onClose={closeLoginPrompt}>
      <div
        className="m-auto relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeLoginPrompt}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Heading */}
        <div className="text-center space-y-3 pt-2">
          <div className="mx-auto flex items-center justify-center">
            <VocabFlowLogo size="xl" className="w-14 h-14 shadow-lg shadow-indigo-500/20" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {loginPromptReason || 'Lưu Tiến Trình Học Của Bạn'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Tạo tài khoản miễn phí trong 5 giây. Toàn bộ từ vựng bạn vừa trải nghiệm sẽ được tự động đồng bộ và lưu giữ trọn đời.
            </p>
          </div>
        </div>

        {/* Value Highlights */}
        <div className="space-y-2 py-1 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Đồng bộ tiến độ học ngắt quãng (SRS) trên mọi thiết bị</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Lưu kho từ cá nhân và tạo bộ từ vựng riêng</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Kích hoạt gia sư AI phân tích ngữ cảnh học tập</span>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3 pt-2">
          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loadingProvider !== null}
            className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm border border-slate-300 dark:border-slate-700 shadow-xs flex items-center justify-center gap-3 transition disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>
              {loadingProvider === 'google' ? 'Đang kết nối Google...' : 'Tiếp tục với Google'}
            </span>
          </button>

          {/* Facebook Button */}
          <button
            onClick={handleFacebookLogin}
            disabled={loadingProvider !== null}
            className="w-full py-3 px-4 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-3 transition disabled:opacity-50"
          >
            <img src="/facebook-logo.png" alt="Facebook" className="w-4 h-4 object-contain shrink-0" />
            <span>
              {loadingProvider === 'facebook' ? 'Đang kết nối Facebook...' : 'Tiếp tục với Facebook'}
            </span>
          </button>

          {/* Email / Password Options */}
          <div className="pt-2 flex items-center justify-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <button
              onClick={() => {
                closeLoginPrompt();
                navigate('/login');
              }}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition"
            >
              Đăng nhập với Email
            </button>
            <span>•</span>
            <button
              onClick={() => {
                closeLoginPrompt();
                navigate('/register');
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:underline transition font-bold"
            >
              Tạo tài khoản mới
            </button>
          </div>

          {/* Maybe Later Button (Dismiss without friction) */}
          <div className="pt-1 text-center">
            <button
              onClick={closeLoginPrompt}
              className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              Để sau (Tiếp tục học thử)
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
