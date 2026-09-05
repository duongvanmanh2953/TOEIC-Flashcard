import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { GlassCard } from '../components/common/GlassCard';
import { useTranslation } from '../i18n';
import {
  Check,
  Zap,
  Sparkles,
  Crown,
  ShieldCheck,
  CheckCircle2,
  BellRing,
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
}

export const SubscriptionUpgradePage: React.FC = () => {
  const { t } = useTranslation();
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [loading, setLoading] = useState(true);
  const [registeredTier, setRegisteredTier] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

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

  const handleRegisterInterest = async (tier: 'PLUS' | 'PRO') => {
    setRegisteredTier(tier);
    try {
      const res: any = await api.post('/subscriptions/upgrade', { tier });
      setInfoMsg(res.data?.message || 'Bạn đã được thêm vào danh sách học viên ưu tiên!');
    } catch {
      setInfoMsg('Đã ghi nhận sự quan tâm của bạn cho gói này.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const currentTier = entitlements?.tier || 'FREE';

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header with relaxed line-height */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider border border-indigo-500/20">
          <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>{t('subscriptions.comingSoonBadge', 'Sắp ra mắt cổng thanh toán chính thức')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-snug">
          {t('subscriptions.title', 'Các Gói Trải Nghiệm VocabFlow')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          {t('subscriptions.subtitle', 'Mở khóa tính năng mở rộng, phân tích chuyên sâu và không giới hạn AI Tutor.')}
        </p>
      </div>

      {/* Current Quota Status */}
      <GlassCard className="p-5 md:p-6 border border-slate-200/90 dark:border-slate-800/90 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t('subscriptions.currentPlan', 'Gói hiện tại')}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[11px] font-bold">
                  {currentTier}
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5 leading-snug">
                {t('subscriptions.aiQuota', 'Lượt gọi AI hôm nay')}: {entitlements?.dailyAiUsed || 0} / {entitlements?.dailyAiQuota === 9999 ? 'Không giới hạn' : entitlements?.dailyAiQuota} lượt
              </p>
            </div>
          </div>

          <div className="sm:w-48">
            <div className="flex justify-between text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
              <span>Hạn mức ngày</span>
              <span>{entitlements?.dailyAiRemaining} lượt còn lại</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    ((entitlements?.dailyAiUsed || 0) / (entitlements?.dailyAiQuota || 1)) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {infoMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{infoMsg}</span>
          </div>
        )}
      </GlassCard>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* FREE */}
        <GlassCard className="p-6 flex flex-col justify-between border-slate-200/90 dark:border-slate-800/90">
          <div>
            <div className="mb-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cơ bản</span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-snug">
                {t('subscriptions.freeTitle', 'Learner Free')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Nền tảng học từ vựng vững chắc trọn đời
              </p>
            </div>
            <div className="flex items-baseline gap-1 my-4">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">$0</span>
              <span className="text-xs text-slate-400">/ miễn phí</span>
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
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>10 Lượt Tham Vấn AI Tutor / Ngày</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Duyệt bộ thẻ học cộng đồng công khai</span>
              </li>
            </ul>
          </div>

          <button
            disabled
            className="w-full mt-6 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-default"
          >
            Đang kích hoạt
          </button>
        </GlassCard>

        {/* PLUS */}
        <GlassCard className="p-6 flex flex-col justify-between border-2 border-indigo-500/40 relative shadow-md">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Phổ biến nhất
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold uppercase">
                Sắp ra mắt
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5 leading-snug">
                {t('subscriptions.plusTitle', 'VocabFlow Plus')}
                <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Tăng tốc tiếp thu với bộ đề kiểm tra linh hoạt & AI thông minh
              </p>
            </div>
            <div className="flex items-baseline gap-1 my-4">
              <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">$4.99</span>
              <span className="text-xs text-slate-400">/ tháng</span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-normal">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Tất cả tính năng trong gói Free</span>
              </li>
              <li className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>50 Lượt Tham Vấn AI Tutor / Ngày</span>
              </li>
              <li className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Học từ văn bản bất kỳ (Learn from Anything)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Kho từ cá nhân & Fork bộ thẻ cộng đồng</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Tạo và chia sẻ bộ thẻ học cho cộng đồng</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleRegisterInterest('PLUS')}
            className="w-full mt-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>{registeredTier === 'PLUS' ? 'Đã ghi nhận quan tâm' : 'Nhận tin khi mở bán ($4.99)'}</span>
          </button>
        </GlassCard>

        {/* PRO */}
        <GlassCard className="p-6 flex flex-col justify-between border border-purple-500/30 relative">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                Chuyên nghiệp
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-600/10 text-purple-600 dark:text-purple-400 text-[10px] font-extrabold uppercase">
                Sắp ra mắt
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5 leading-snug">
                {t('subscriptions.proTitle', 'VocabFlow Pro')}
                <Crown className="w-4 h-4 text-amber-500 shrink-0" />
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Tối đa tiềm năng với AI Tutor phân tích chuyên sâu & không giới hạn
              </p>
            </div>
            <div className="flex items-baseline gap-1 my-4">
              <span className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">$9.99</span>
              <span className="text-xs text-slate-400">/ tháng</span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-normal">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Tất cả tính năng trong gói Plus</span>
              </li>
              <li className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Không giới hạn tham vấn AI chuyên sâu</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Phân tích chuẩn đoán CEFR cá nhân hóa</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Ưu tiên băng thông máy chủ mô hình AI</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Hỗ trợ ưu tiên chuyên gia ngôn ngữ 24/7</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleRegisterInterest('PRO')}
            className="w-full mt-6 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>{registeredTier === 'PRO' ? 'Đã ghi nhận quan tâm' : 'Nhận tin khi mở bán ($9.99)'}</span>
          </button>
        </GlassCard>
      </div>

      {/* Entitlement Capability Matrix Table */}
      <GlassCard variant="liquid" className="p-6 border border-slate-200/90 dark:border-slate-800/90">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          Bảng So Sánh Quyền Hạn Chi Tiết (Entitlement Matrix)
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Minh bạch mọi đặc quyền và khả năng truy cập giữa các gói tài khoản.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                <th className="pb-3 px-3">Khả Năng / Tính Năng</th>
                <th className="pb-3 px-3 text-center">Gói Free (Miễn phí)</th>
                <th className="pb-3 px-3 text-center text-indigo-600 dark:text-indigo-400 font-bold">Gói Plus ($4.99)</th>
                <th className="pb-3 px-3 text-center text-purple-600 dark:text-purple-400 font-bold">Gói Pro ($9.99)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {[
                { feature: 'Học từ vựng 3D Flashcard & Thuật toán SRS', free: 'Toàn diện ✓', plus: 'Toàn diện ✓', pro: 'Toàn diện ✓' },
                { feature: 'Lượt tương tác cùng Gia sư AI 24/7', free: '10 lượt/ngày', plus: '50 lượt/ngày', pro: 'Không giới hạn ✓' },
                { feature: 'Học từ bất kỳ đoạn văn bản (Learn From Anything)', free: 'Thử nghiệm (3 lần/ngày)', plus: 'Không giới hạn ✓', pro: 'Không giới hạn ✓' },
                { feature: 'Tự tạo bộ câu hỏi kiểm tra ngẫu nhiên (Custom Quiz)', free: 'Bộ tiêu chuẩn', plus: 'Tùy biến cấp độ & số câu ✓', pro: 'Tùy biến cấp độ & số câu ✓' },
                { feature: 'Phân tích sức khỏe ghi nhớ (Word Health & Retention)', free: 'Cơ bản', plus: 'Nâng cao ✓', pro: 'Chẩn đoán AI chuyên sâu ✓' },
                { feature: 'Sao lưu & Đồng bộ đám mây đa thiết bị', free: 'Có ✓', plus: 'Có ✓', pro: 'Ưu tiên đồng bộ tức thời ✓' },
                { feature: 'Bảo lưu Streak linh hoạt khi bận (Streak Saver)', free: '1 ngày/tháng', plus: '3 ngày/tháng ✓', pro: 'Không giới hạn phục hồi ✓' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">{row.feature}</td>
                  <td className="py-3 px-3 text-center text-slate-500">{row.free}</td>
                  <td className="py-3 px-3 text-center font-bold text-indigo-600 dark:text-indigo-400">{row.plus}</td>
                  <td className="py-3 px-3 text-center font-extrabold text-purple-600 dark:text-purple-400">{row.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Honest Beta Billing Commitment Banner */}
      <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900/40 flex items-start sm:items-center gap-3.5">
        <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5 sm:mt-0" />
        <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          <strong className="text-slate-900 dark:text-white font-bold block mb-0.5">Cam Kết Minh Bạch & Bảo Mật Thanh Toán:</strong>
          VocabFlow hiện đang trong giai đoạn Beta mở rộng. Các gói dịch vụ trả phí đang mở danh sách đăng ký ưu tiên với mức giá giảm 50% khi chính thức ra mắt. Hệ thống cam kết <strong>tuyệt đối KHÔNG tự động trừ tiền</strong> và <strong>KHÔNG yêu cầu nhập thẻ tín dụng</strong> khi chưa có sự cho phép minh bạch của bạn.
        </div>
      </div>
    </div>
  );
};
