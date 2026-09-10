import React, { useState, useEffect } from 'react';
import { ModalPortal } from '../common/ModalPortal';
import {
  X,
  Mail,
  KeyRound,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import api from '../../lib/api';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PasswordRuleCheck {
  id: string;
  label: string;
  passed: boolean;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Steps:
  // 1: Enter email to request OTP key via Resend
  // 2: Enter & verify OTP key from email (Must verify valid before progressing)
  // 3: Set new password with strict standards
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Timer countdown for resending OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Password rules checklist
  const passwordRules: PasswordRuleCheck[] = [
    {
      id: 'length',
      label: 'Tối thiểu 8 ký tự (8 - 64)',
      passed: newPassword.length >= 8 && newPassword.length <= 64,
    },
    {
      id: 'uppercase',
      label: 'Có ít nhất 1 chữ in hoa (A-Z)',
      passed: /[A-Z]/.test(newPassword),
    },
    {
      id: 'lowercase',
      label: 'Có ít nhất 1 chữ in thường (a-z)',
      passed: /[a-z]/.test(newPassword),
    },
    {
      id: 'number',
      label: 'Có ít nhất 1 chữ số (0-9)',
      passed: /[0-9]/.test(newPassword),
    },
    {
      id: 'special',
      label: 'Có ít nhất 1 ký tự đặc biệt (!@#$%^&*...)',
      passed: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword),
    },
    {
      id: 'no-space',
      label: 'Không chứa khoảng trắng',
      passed: newPassword.length > 0 && !/\s/.test(newPassword),
    },
  ];

  const allRulesPassed = passwordRules.every((r) => r.passed);
  const isConfirmMatch = Boolean(confirmPassword && newPassword === confirmPassword);

  // Password strength calculation
  const getStrength = () => {
    const passed = passwordRules.filter((r) => r.passed).length;
    if (passed <= 2) return { score: 1, label: 'Yếu', color: 'bg-rose-500', text: 'text-rose-500' };
    if (passed <= 4) return { score: 2, label: 'Trung bình', color: 'bg-amber-500', text: 'text-amber-500' };
    if (passed === 5) return { score: 3, label: 'Khá tốt', color: 'bg-blue-500', text: 'text-blue-500' };
    return { score: 4, label: 'Rất mạnh & Chuẩn bảo mật', color: 'bg-emerald-500', text: 'text-emerald-500' };
  };

  const strength = getStrength();

  // STEP 1: Request OTP to Email
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: trimmedEmail });
      setSuccessMsg(res.data?.message || 'Mã xác thực OTP đã được gửi về email của bạn.');
      setResendCooldown(60);
      setStep(2);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Không thể gửi mã xác thực. Vui lòng kiểm tra lại email hoặc liên hệ quản trị viên.',
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP Key from Email
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setError('Mã xác thực OTP phải gồm đúng 6 chữ số được gửi tới email.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/verify-reset-otp', {
        email: email.trim().toLowerCase(),
        otp: cleanOtp,
      });

      setSuccessMsg(res.data?.message || 'Mã xác thực chính xác! Hãy tạo mật khẩu mới.');
      // After OTP is verified OK, move to Step 3 to set password
      setTimeout(() => {
        setStep(3);
        setError('');
      }, 400);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Mã xác thực OTP không chính xác hoặc đã hết hạn. Vui lòng kiểm tra lại hòm thư.',
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Reset Password with Strict Standards
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!allRulesPassed) {
      setError('Mật khẩu mới chưa đáp ứng đầy đủ các quy chuẩn bảo mật bắt buộc.');
      return;
    }

    if (!isConfirmMatch) {
      setError('Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
      });

      setSuccessMsg('Đổi mật khẩu thành công! Chào mừng bạn quay lại VocabFlow AI.');

      // Auto login with new JWT session
      if (res.data?.accessToken) {
        localStorage.setItem('vocabflow_access_token', res.data.accessToken);
        localStorage.setItem('leximind_access_token', res.data.accessToken);
        if (res.data.refreshToken) {
          localStorage.setItem('vocabflow_refresh_token', res.data.refreshToken);
          localStorage.setItem('leximind_refresh_token', res.data.refreshToken);
        }
      }

      setTimeout(() => {
        handleResetModal();
        if (onSuccess) onSuccess();
        window.location.href = '/dashboard';
      }, 1200);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Không thể đặt lại mật khẩu. Vui lòng kiểm tra lại thông tin.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetModal = () => {
    setStep(1);
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMsg('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={handleResetModal}>
      <div
        className="m-auto relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl space-y-5 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleResetModal}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step Indicator Pills */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step === 1 ? 'w-8 bg-indigo-600' : 'w-4 bg-slate-200 dark:bg-slate-700'
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step === 2 ? 'w-8 bg-indigo-600' : 'w-4 bg-slate-200 dark:bg-slate-700'
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step === 3 ? 'w-8 bg-indigo-600' : 'w-4 bg-slate-200 dark:bg-slate-700'
            }`}
          />
        </div>

        {/* Header Title & Subtitle */}
        <div className="text-center space-y-2">
          <div className="w-13 h-13 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center border border-indigo-500/20 shadow-inner">
            {step === 1 && <Mail className="w-6 h-6" />}
            {step === 2 && <KeyRound className="w-6 h-6 text-amber-500" />}
            {step === 3 && <ShieldCheck className="w-6 h-6 text-emerald-500" />}
          </div>

          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {step === 1 && 'Khôi Phục Mật Khẩu'}
            {step === 2 && 'Xác Thực Mã Khóa OTP'}
            {step === 3 && 'Thiết Lập Mật Khẩu Mới'}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            {step === 1 && 'Nhập địa chỉ email tài khoản của bạn để nhận mã xác thực OTP 6 số qua email.'}
            {step === 2 && (
              <span>
                Mã xác thực đã được gửi về email <strong className="text-slate-800 dark:text-slate-200">{email}</strong>. Vui lòng kiểm tra hộp thư đến (hoặc thư rác) để lấy mã.
              </span>
            )}
            {step === 3 && 'Mã xác thực đã được chứng thực hợp lệ. Hãy tạo mật khẩu mới đáp ứng chuẩn bảo mật bên dưới.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && !error && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{successMsg}</span>
          </div>
        )}

        {/* ================================================================== */}
        {/* STEP 1: Enter Email                                               */}
        {/* ================================================================== */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                Email Tài Khoản VocabFlow
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vidu@vocabflow.ai"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-indigo-500" />
              <span>Hệ thống sẽ gửi mã bảo mật 6 số an toàn qua cổng Resend SMTP.</span>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="btn-glass-primary w-full !py-3.5 !rounded-xl text-xs font-black shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang gửi mã tới email...
                </span>
              ) : (
                <>
                  <span>Gửi Mã Xác Thực OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ================================================================== */}
        {/* STEP 2: Input & Verify OTP Key from Email                          */}
        {/* ================================================================== */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 pt-1">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Nhập Mã Xác Thực OTP (6 số)
                </label>
                <span className="text-[11px] font-medium text-slate-400">Hiệu lực 15 phút</span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="------"
                  className="w-full text-center tracking-[10px] font-mono text-2xl font-black px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-300"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 text-center">
                Mở hòm thư email của bạn, sao chép mã 6 chữ số và dán vào đây.
              </p>
            </div>

            {/* Resend OTP button with cooldown */}
            <div className="flex items-center justify-between px-1 text-xs">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold transition flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                Đổi email
              </button>

              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={() => handleRequestOtp()}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold disabled:opacity-50 disabled:no-underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                {resendCooldown > 0 ? `Gửi lại mã sau (${resendCooldown}s)` : 'Gửi lại mã OTP'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || otp.trim().length !== 6}
              className="btn-glass-primary w-full !py-3.5 !rounded-xl text-xs font-black shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang xác thực mã...
                </span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Xác Nhận Mã OTP</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ================================================================== */}
        {/* STEP 3: Set New Password with Strict Standards                     */}
        {/* ================================================================== */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4 pt-1">
            {/* New Password Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Mật Khẩu Mới
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Strength Meter */}
            {newPassword && (
              <div className="space-y-1.5 animate-fade-in">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Độ mạnh mật khẩu:</span>
                  <span className={`font-black ${strength.text}`}>{strength.label}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        level <= strength.score ? strength.color : 'opacity-20 bg-slate-300 dark:bg-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Password Security Rules Live Checklist */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                Quy chuẩn bảo mật mật khẩu:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {passwordRules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`text-xs flex items-center gap-1.5 transition-colors duration-200 ${
                      rule.passed
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        rule.passed ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                    <span className="text-[11px]">{rule.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Xác Nhận Lại Mật Khẩu Mới
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại chính xác mật khẩu..."
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                    confirmPassword
                      ? isConfirmMatch
                        ? 'border-emerald-500 focus:ring-emerald-500'
                        : 'border-rose-400 focus:ring-rose-400'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && (
                <div className="mt-1 text-[11px]">
                  {isConfirmMatch ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Mật khẩu xác nhận trùng khớp
                    </span>
                  ) : (
                    <span className="text-rose-500 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Mật khẩu xác nhận chưa khớp
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-3.5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Nhập lại OTP</span>
              </button>

              <button
                type="submit"
                disabled={loading || !allRulesPassed || !isConfirmMatch}
                className="btn-glass-primary flex-1 !py-3.5 !rounded-xl text-xs font-black shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Đang lưu mật khẩu...
                  </span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Lưu Mật Khẩu & Đăng Nhập</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </ModalPortal>
  );
};
