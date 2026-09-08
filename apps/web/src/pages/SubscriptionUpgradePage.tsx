import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { GlassCard } from '../components/common/GlassCard';
import { PaymentCheckoutModal } from '../components/payment/PaymentCheckoutModal';
import { useTranslation } from '../i18n';
import { useAuth, isProUser } from '../contexts/AuthContext';
import {
  Check,
  Zap,
  Sparkles,
  Crown,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  ArrowRight,
  Flame,
  LockOpen,
  Calendar,
  Percent,
} from 'lucide-react';

interface Entitlements {
  tier: 'FREE' | 'PLUS' | 'PRO';
  dailyAiQuota: number;
  dailyAiUsed: number;
  dailyAiRemaining: number;
  features: {
    canCreateCustomDecks: boolean;
    hasAdvancedAnalytics: boolean;
    unlimitedAiTutor: boolean;
  };
  currentPlan?: {
    tier: string;
    name: string;
    currentPeriodEnd?: string | null;
  };
}

export const SubscriptionUpgradePage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [loading, setLoading] = useState(true);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [checkoutTier, setCheckoutTier] = useState<'PLUS' | 'PRO' | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  useEffect(() => {
    fetchEntitlements();
  }, []);

  const fetchEntitlements = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/subscriptions/my-status');
      setEntitlements(res.data);
    } catch (err) {
      console.error('Failed to fetch entitlements', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  const isPro = isProUser(user) || entitlements?.tier === 'PRO' || (entitlements as any)?.currentPlan?.isPro;
  const currentTier = isPro ? 'PRO' : (entitlements?.tier || 'FREE');
  const periodEnd = entitlements?.currentPlan?.currentPeriodEnd;

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-in pb-12">
      {/* Header with compact badge & title */}
      <div className="text-center space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-500/[0.08] dark:bg-brand-500/[0.15] text-brand-600 dark:text-brand-300 text-xs font-black uppercase tracking-wider border border-brand-400/40 backdrop-blur-xl">
          <QrCode className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
          <span>Thanh toán VietQR & Cổng Webhook Tự Động Kích Hoạt 24/7</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
          {t('subscriptions.title', 'Nâng Cấp Trải Nghiệm Học Cùng VocabFlow')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Tăng tốc phản xạ và điểm số TOEIC với AI Tutor chuyên sâu, hạn mức theo ngày tối ưu và gói thuê bao linh hoạt.
        </p>
      </div>

      {/* Current Quota Status */}
      <GlassCard variant="brand" className="p-5 md:p-6 shadow-md border border-brand-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/25">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t('subscriptions.currentPlan', 'Gói hiện tại')}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-brand-600 text-white text-[11px] font-black uppercase shadow-xs">
                  {currentTier}
                </span>
                {periodEnd && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Hạn dùng: {new Date(periodEnd).toLocaleDateString('vi-VN')}</span>
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-1 leading-snug">
                {t('subscriptions.aiQuota', 'Lượt gọi AI hôm nay')}: {entitlements?.dailyAiUsed || 0} / {entitlements?.dailyAiQuota || (isPro ? 200 : 10)} lượt (Reset 00:00)
              </p>
            </div>
          </div>

          <div className="sm:w-56">
            <div className="flex justify-between text-xs font-bold mb-1 text-slate-500 dark:text-slate-400">
              <span>Hạn mức sử dụng ngày</span>
              <span className="text-brand-600 dark:text-brand-400 font-extrabold">
                {entitlements?.dailyAiRemaining ?? (isPro ? 200 : 10)} lượt còn lại
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-200/70 dark:bg-slate-800 overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-brand-600 to-indigo-500 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    ((entitlements?.dailyAiUsed || 0) / (entitlements?.dailyAiQuota || 1)) * 100,
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {infoMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{infoMsg}</span>
          </div>
        )}
      </GlassCard>

      {/* Pro Active Notice */}
      {isPro && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-emerald-500/15 border border-purple-500/30 flex items-center gap-4 shadow-md">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/25">
            <Crown className="w-5 h-5 text-amber-200 fill-amber-200" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Tài Khoản VocabFlow Pro Đang Kích Hoạt</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-black uppercase">
                Đang Sử Dụng
              </span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              Bạn đang sở hữu đặc quyền Pro cao cấp với 200 lượt AI mỗi ngày, trích xuất Text-to-Vocab, phân tích chuẩn đoán CEFR và thuật toán SRS độc quyền. Gói tự động bảo lưu chuỗi học.
            </p>
          </div>
        </div>
      )}

      {/* Interactive Billing Cycle Toggle: Monthly vs Yearly */}
      <div className="flex flex-col items-center justify-center gap-2 pt-2">
        <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 inline-flex items-center shadow-xs">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Hàng Tháng
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 ${
              billingCycle === 'yearly'
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Theo Năm</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-xs">
              <Percent className="w-2.5 h-2.5" />
              <span>Tiết kiệm 35%</span>
            </span>
          </button>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {billingCycle === 'yearly'
            ? '🔥 Gói theo năm tiết kiệm lên đến 840.000 đ so với thanh toán từng tháng'
            : 'Linh hoạt gia hạn từng tháng, có thể hủy bất kỳ lúc nào'}
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* FREE */}
        <GlassCard variant="subtle" className="p-6 flex flex-col justify-between border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-400 dark:hover:border-slate-600 transition">
          <div>
            <div className="mb-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cơ bản</span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1 leading-snug">
                {t('subscriptions.freeTitle', 'Learner Free')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Nền tảng học từ vựng vững chắc miễn phí
              </p>
            </div>
            <div className="flex items-baseline gap-1 my-4">
              <span className="text-3xl font-black text-slate-900 dark:text-white">0 đ</span>
              <span className="text-xs text-slate-400">/ miễn phí cơ bản</span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-normal">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>600+ Từ Vựng TOEIC Tiêu Chuẩn</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Thuật toán lặp lại Spaced Repetition (SRS)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Phát âm giọng đọc chuẩn bản xứ US/UK</span>
              </li>
              <li className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>10 Lượt Tham Vấn AI Tutor / Ngày (Reset 00:00)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>3 Lượt Trích Xuất Text-to-Vocab / Ngày</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Duyệt bộ thẻ học cộng đồng công khai</span>
              </li>
            </ul>
          </div>

          <button
            disabled
            className="w-full mt-6 py-3 rounded-xl text-xs font-bold bg-transparent border border-slate-300/50 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-default"
          >
            {currentTier === 'FREE' ? 'Đang kích hoạt' : 'Gói mặc định'}
          </button>
        </GlassCard>

        {/* PLUS (Card Brand Effect Highlight) */}
        <GlassCard
          variant="brandGlow"
          className="p-6 flex flex-col justify-between relative shadow-2xl group border-2 border-brand-500/40"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                <Flame className="w-3 h-3 fill-white" />
                <span>Phổ biến nhất</span>
              </span>
              {billingCycle === 'yearly' && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">
                  Tiết kiệm 30%
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-1.5 leading-snug">
                {t('subscriptions.plusTitle', 'VocabFlow Plus')}
                <Sparkles className="w-4 h-4 text-brand-500 shrink-0" />
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Tăng tốc tiếp thu với bộ đề kiểm tra linh hoạt & AI Tutor mỗi ngày
              </p>
            </div>

            {/* Dynamic Price Display */}
            <div className="my-4">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-brand-600 dark:text-brand-400">
                  {billingCycle === 'yearly' ? '69.000 đ' : '99.000 đ'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">/ tháng</span>
              </div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                {billingCycle === 'yearly'
                  ? 'Thanh toán 828.000 đ/năm (Tiết kiệm 360.000 đ so với theo tháng)'
                  : 'Gia hạn từng tháng (99.000 đ/tháng, hủy bất cứ lúc nào)'}
              </p>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-normal">
              <li className="flex items-center gap-2 font-semibold">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Tất cả tính năng trong gói Free</span>
              </li>
              <li className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                <span>50 Lượt Tham Vấn AI Tutor / Ngày (Reset 00:00)</span>
              </li>
              <li className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                <span>15 Lượt Trích Xuất Văn Bản (Text-to-Vocab) / Ngày</span>
              </li>
              <li className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                <span>5 Lượt Dệt Câu Chuyện (AI Story) / Ngày</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>🚑 Memory Rescue cảnh báo từ vựng sắp quên</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Bảo lưu chuỗi Streak 3 ngày/tháng</span>
              </li>
              <li className="flex items-center gap-2 text-slate-500">
                <Check className="w-4 h-4 text-brand-500 shrink-0" />
                <span>Gia hạn theo chu kỳ ({billingCycle === 'yearly' ? 'Hàng năm' : 'Hàng tháng'})</span>
              </li>
            </ul>
          </div>

          {isPro ? (
            <button
              disabled
              className="w-full mt-6 py-3.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 cursor-default flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
            >
              <Check className="w-4 h-4" />
              <span>Bạn đang có gói Pro cao cấp hơn</span>
            </button>
          ) : currentTier === 'PLUS' ? (
            <button
              disabled
              className="w-full mt-6 py-3.5 rounded-xl text-xs font-black bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/40 cursor-default flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Gói Bạn Đang Sử Dụng</span>
            </button>
          ) : (
            <button
              onClick={() => setCheckoutTier('PLUS')}
              className="w-full mt-6 py-3.5 rounded-xl text-xs font-black bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-500 hover:from-brand-700 hover:to-indigo-700 text-white transition flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 active:scale-[0.98]"
            >
              <LockOpen className="w-4 h-4" />
              <span>
                {billingCycle === 'yearly'
                  ? 'Mở Khóa Gói Plus (828.000 đ/năm)'
                  : 'Mở Khóa Gói Plus (99.000 đ/tháng)'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </GlassCard>

        {/* PRO (Premium Card) */}
        <GlassCard
          variant="premium"
          className="p-6 flex flex-col justify-between relative shadow-2xl group border-2 border-purple-500/50"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-200 fill-amber-200" />
                <span>VIP Chuyên Nghiệp</span>
              </span>
              {billingCycle === 'yearly' && (
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 text-[10px] font-black uppercase">
                  Tiết kiệm 35%
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-1.5 leading-snug">
                {t('subscriptions.proTitle', 'VocabFlow Pro')}
                <Crown className="w-4 h-4 text-amber-500 shrink-0" />
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Tối đa tiềm năng với AI Tutor phân tích chuyên sâu & hạn mức cao nhất
              </p>
            </div>

            {/* Dynamic Price Display */}
            <div className="my-4">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-purple-600 dark:text-purple-400">
                  {billingCycle === 'yearly' ? '129.000 đ' : '199.000 đ'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">/ tháng</span>
              </div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                {billingCycle === 'yearly'
                  ? 'Thanh toán 1.548.000 đ/năm (Tiết kiệm 840.000 đ so với theo tháng)'
                  : 'Gia hạn từng tháng (199.000 đ/tháng, hủy bất cứ lúc nào)'}
              </p>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-normal">
              <li className="flex items-center gap-2 font-semibold">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Tất cả tính năng trong gói Plus</span>
              </li>
              <li className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
                <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>200 Lượt Tham Vấn AI Tutor / Ngày (Reset 00:00)</span>
              </li>
              <li className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
                <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>50 Lượt Trích Xuất Text-to-Vocab / Ngày</span>
              </li>
              <li className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
                <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>20 Lượt Dệt Câu Chuyện AI Story / Ngày</span>
              </li>
              <li className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>🚑 Memory Rescue toàn diện chuyên sâu</span>
              </li>
              <li className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>Phân tích chuẩn đoán CEFR & Đường cong quên lãng</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Ưu tiên băng thông máy chủ mô hình AI tốc độ cao</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Không giới hạn phục hồi chuỗi Streak</span>
              </li>
              <li className="flex items-center gap-2 text-slate-500">
                <Check className="w-4 h-4 text-purple-500 shrink-0" />
                <span>Gia hạn theo chu kỳ ({billingCycle === 'yearly' ? 'Hàng năm' : 'Hàng tháng'})</span>
              </li>
            </ul>
          </div>

          {isPro ? (
            <button
              disabled
              className="w-full mt-6 py-3.5 rounded-xl text-xs font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 cursor-default flex items-center justify-center gap-2 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Gói Bạn Đang Sở Hữu (Pro Active)</span>
            </button>
          ) : (
            <button
              onClick={() => setCheckoutTier('PRO')}
              className="w-full mt-6 py-3.5 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 active:scale-[0.98]"
            >
              <LockOpen className="w-4 h-4 text-amber-300" />
              <span>
                {billingCycle === 'yearly'
                  ? 'Mở Khóa Gói Pro (1.548.000 đ/năm)'
                  : 'Mở Khóa Gói Pro (199.000 đ/tháng)'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </GlassCard>
      </div>

      {/* Entitlement Capability Matrix Table */}
      <GlassCard variant="liquid" className="p-6 border border-slate-200/90 dark:border-slate-800/90 shadow-md">
        <h2 className="text-base font-black text-slate-900 dark:text-white mb-1">
          Bảng So Sánh Quyền Hạn Chi Tiết (Entitlement Matrix)
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Minh bạch mọi đặc quyền, hạn mức hàng ngày và chu kỳ thuê bao giữa các gói tài khoản.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                <th className="pb-3 px-3">Khả Năng / Quyền Lợi</th>
                <th className="pb-3 px-3 text-center">Gói Free (Miễn phí)</th>
                <th className="pb-3 px-3 text-center text-brand-600 dark:text-brand-400 font-black">
                  Gói Plus ({billingCycle === 'yearly' ? '69k/tháng' : '99k/tháng'})
                </th>
                <th className="pb-3 px-3 text-center text-purple-600 dark:text-purple-400 font-black">
                  Gói Pro ({billingCycle === 'yearly' ? '129k/tháng' : '199k/tháng'})
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {[
                {
                  feature: 'Học từ vựng Flashcard & Thuật toán SRS',
                  free: 'Toàn diện ✓',
                  plus: 'Toàn diện ✓',
                  pro: 'Toàn diện ✓',
                },
                {
                  feature: 'Hạn mức tham vấn Gia sư AI (Reset 00:00 hàng ngày)',
                  free: '10 lượt/ngày',
                  plus: '50 lượt/ngày',
                  pro: '200 lượt/ngày ✓',
                },
                {
                  feature: 'Trích xuất từ vựng từ văn bản (Text-to-Vocab)',
                  free: '3 lượt/ngày',
                  plus: '15 lượt/ngày ✓',
                  pro: '50 lượt/ngày ✓',
                },
                {
                  feature: 'Dệt câu chuyện ngữ cảnh (AI Story Generator)',
                  free: '1 lượt/ngày',
                  plus: '5 lượt/ngày ✓',
                  pro: '20 lượt/ngày ✓',
                },
                {
                  feature: 'Tự tạo bộ câu hỏi kiểm tra ngẫu nhiên (Custom Quiz)',
                  free: 'Bộ tiêu chuẩn',
                  plus: 'Tùy biến cấp độ & số câu ✓',
                  pro: 'Tùy biến cấp độ & số câu ✓',
                },
                {
                  feature: 'Phân tích sức khỏe ghi nhớ (Word Health & Retention)',
                  free: 'Cơ bản',
                  plus: 'Nâng cao ✓',
                  pro: 'Chẩn đoán AI chuyên sâu ✓',
                },
                {
                  feature: 'Bảo lưu Streak linh hoạt khi bận (Streak Saver)',
                  free: '1 ngày/tháng',
                  plus: '3 ngày/tháng ✓',
                  pro: 'Không giới hạn phục hồi ✓',
                },
                {
                  feature: 'Hình thức gia hạn & cam kết chu kỳ',
                  free: 'Miễn phí vĩnh viễn',
                  plus: 'Thuê bao Tháng / Năm (Hủy tùy ý)',
                  pro: 'Thuê bao Tháng / Năm (Hủy tùy ý)',
                },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    {row.feature}
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-500">{row.free}</td>
                  <td className="py-3.5 px-3 text-center font-bold text-brand-600 dark:text-brand-400">
                    {row.plus}
                  </td>
                  <td className="py-3.5 px-3 text-center font-black text-purple-600 dark:text-purple-400">
                    {row.pro}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Honest Billing Commitment Banner */}
      <div className="p-5 rounded-2xl card-brand-effect bg-brand-500/[0.04] dark:bg-brand-500/[0.08] border border-brand-400/35 dark:border-brand-500/30 backdrop-blur-xl flex items-start sm:items-center gap-3.5">
        <ShieldCheck className="w-6 h-6 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5 sm:mt-0" />
        <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          <strong className="text-slate-900 dark:text-white font-bold block mb-0.5">
            Cam Kết Minh Bạch & Bảo Mật Thanh Toán VietQR 24/7:
          </strong>
          Gói cước có chu kỳ rõ ràng theo tháng hoặc năm, <strong>không cam kết vĩnh viễn phi thực tế</strong>. Hệ thống sử dụng cổng xác nhận chuyển khoản tức thì chuẩn NAPAS 24/7. Bạn chỉ cần quét mã QR trên bất kỳ App Ngân Hàng nào, hệ thống tự động ghi nhận và cấp quyền tài khoản ngay khi giao dịch thành công.
        </div>
      </div>

      {/* Checkout Modal */}
      {checkoutTier && (
        <PaymentCheckoutModal
          isOpen={Boolean(checkoutTier)}
          tier={checkoutTier}
          billingCycle={billingCycle}
          onClose={() => setCheckoutTier(null)}
          onSuccess={() => {
            fetchEntitlements();
            setInfoMsg('Giao dịch thành công! Tài khoản của bạn đã được nâng cấp quyền hạn.');
          }}
        />
      )}
    </div>
  );
};
