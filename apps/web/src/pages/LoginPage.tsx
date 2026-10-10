import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, AlertCircle, ShieldCheck, Sparkles, Lightbulb } from 'lucide-react';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal';
import { VocabFlowLogo } from '@vocabflow/shared';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [deviceLimitError, setDeviceLimitError] = useState<{
    code: string;
    message: string;
    limit?: number;
    activeCount?: number;
  } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const { login, loginWithGoogle, loginWithFacebook } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('expired') === '1') {
      setError('Phiên làm việc của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục học tập.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDeviceLimitError(null);
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      if (
        err?.code === 'DEVICE_LIMIT_EXCEEDED' ||
        err?.message?.includes('giới hạn') ||
        err?.message?.includes('thiết bị')
      ) {
        setDeviceLimitError({
          code: err?.code || 'DEVICE_LIMIT_EXCEEDED',
          message: err?.message || 'Tài khoản đã đạt giới hạn thiết bị đăng nhập.',
          limit: err?.limit || 3,
          activeCount: err?.activeCount || 3,
        });
      } else {
        setError(err?.message || 'Email hoặc mật khẩu không chính xác.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-950 py-12">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="text-center mb-8">
          <VocabFlowLogo size="xl" className="w-14 h-14 mx-auto mb-3 shadow-lg shadow-indigo-500/20" />
          <h2 className="text-2xl font-bold tracking-tight">Chào mừng trở lại</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Đăng nhập vào <span className="font-semibold text-indigo-600 dark:text-indigo-400">VocabFlow AI</span> để tiếp tục phiên học
          </p>
        </div>

        {deviceLimitError && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Đã Đạt Giới Hạn Thiết Bị Đăng Nhập</span>
            </div>
            <p className="leading-relaxed">
              Tài khoản này hiện đã hoạt động trên{' '}
              <strong>{deviceLimitError.activeCount || 3} / {deviceLimitError.limit || 3}</strong> thiết bị cho phép.
              Thiết bị mới của bạn đã được ghi nhận và đưa vào hàng chờ xác minh bảo mật.
            </p>
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-[11px] leading-relaxed flex items-start gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>Cách xử lý:</strong> Hãy đăng nhập từ một trong các thiết bị đã dùng trước đó, sau đó vào mục{' '}
                <span className="font-semibold underline">Hồ sơ → Bảo mật → Quản lý thiết bị</span> để đăng xuất các thiết bị không còn sử dụng.
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              placeholder="tenban@email.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Mật khẩu
              </label>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              placeholder="••••••••"
            />
          </div>



          <button
            type="submit"
            disabled={loading}
            className="btn-glass-primary w-full mt-2 !py-3 !rounded-xl disabled:opacity-50 text-white font-extrabold text-sm shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              <span>Đang xác thực...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập</span>
              </>
            )}
          </button>
        </form>

        {/* OR Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-semibold tracking-wider">
              Hoặc tiếp tục với
            </span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={async () => {
              setError('');
              setSocialLoading('google');
              try {
                await loginWithGoogle();
                navigate('/dashboard');
              } catch (err: any) {
                setError(err?.message || 'Không thể đăng nhập bằng Google.');
              } finally {
                setSocialLoading(null);
              }
            }}
            disabled={socialLoading !== null || loading}
            className="w-full py-2.5 px-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
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
            <span>{socialLoading === 'google' ? 'Đang vào...' : 'Google'}</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              setError('');
              setSocialLoading('facebook');
              try {
                await loginWithFacebook();
                navigate('/dashboard');
              } catch (err: any) {
                setError(err?.message || 'Không thể đăng nhập bằng Facebook.');
              } finally {
                setSocialLoading(null);
              }
            }}
            disabled={socialLoading !== null || loading}
            className="w-full py-2.5 px-3 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <img src="/facebook-logo.png" alt="Facebook" className="w-4 h-4 rounded-full object-contain shrink-0" />
            <span>{socialLoading === 'facebook' ? 'Đang vào...' : 'Facebook'}</span>
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-bold text-brand-600 dark:text-brand-400 hover:underline">
            Đăng ký ngay
          </Link>
        </div>


      </div>

      <ForgotPasswordModal
        isOpen={showForgot}
        onClose={() => setShowForgot(false)}
      />
    </div>
  );
};
