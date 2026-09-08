import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Calculator,
  TrendingUp,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Sparkles,
  Zap,
  Crown,
  Percent,
  Layers,
  ArrowRight,
} from 'lucide-react';
import api from '../../lib/api';
import { useI18n } from '../../i18n';
import { NumberInput } from '../../components/common/NumberInput';

interface Plan {
  id: string;
  tier: 'FREE' | 'PLUS' | 'PRO';
  name: string;
  priceMonthly: number;
  aiDailyQuota: number;
  maxCustomDecks: number;
  unlimitedReviews: boolean;
  features: string[];
}

interface PricingConfig {
  annualDiscountPercent: number;
  paymentProviderFeePercent: number;
  paymentFixedFee: number;
  aiCostPerUser: number;
  hostingCostPerUser: number;
  databaseCostPerUser: number;
  supportCostPerUser: number;
  targetGrossMarginPercent: number;
  expectedUsers: number;
  quotas: {
    guestAiDailyQuota: number;
    guestQuizDailyQuota: number;
    freeAiDailyQuota: number;
    freeReviewDailyQuota: number;
    freeQuizDailyQuota: number;
    freeFavoritesMax: number;
    plusAiDailyQuota: number;
    proAiDailyQuota: number;
  };
}

export const AdminPricingPage: React.FC = () => {
  const { t } = useI18n();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [config, setConfig] = useState<PricingConfig>({
    annualDiscountPercent: 20,
    paymentProviderFeePercent: 3.65,
    paymentFixedFee: 2000,
    aiCostPerUser: 25000,
    hostingCostPerUser: 10000,
    databaseCostPerUser: 5000,
    supportCostPerUser: 5000,
    targetGrossMarginPercent: 70,
    expectedUsers: 1000,
    quotas: {
      guestAiDailyQuota: 3,
      guestQuizDailyQuota: 3,
      freeAiDailyQuota: 10,
      freeReviewDailyQuota: 20,
      freeQuizDailyQuota: 3,
      freeFavoritesMax: 50,
      plusAiDailyQuota: 50,
      proAiDailyQuota: -1,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [previewCycle, setPreviewCycle] = useState<'monthly' | 'yearly'>('monthly');

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchPricingData = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/admin/pricing');
      const data = res?.data?.data || res?.data || res;
      if (data?.plans) setPlans(data.plans);
      if (data?.config) setConfig(data.config);
    } catch (err) {
      console.error('Failed to load pricing intelligence:', err);
      showToast('error', 'Không thể tải cấu hình giá và mô hình chi phí.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricingData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/admin/pricing', {
        config,
        plans,
      });
      showToast('success', 'Đã lưu cấu hình giá và hạn ngạch thành công!');
    } catch (err: any) {
      console.error('Save pricing error:', err);
      showToast('error', err?.response?.data?.message || 'Có lỗi khi lưu cấu hình.');
    } finally {
      setSaving(false);
    }
  };

  // Cost calculations
  const totalVariableCost =
    (Number(config.aiCostPerUser) || 0) +
    (Number(config.hostingCostPerUser) || 0) +
    (Number(config.databaseCostPerUser) || 0) +
    (Number(config.supportCostPerUser) || 0);

  const feeRate = (Number(config.paymentProviderFeePercent) || 0) / 100;
  const targetMarginRate = (Number(config.targetGrossMarginPercent) || 0) / 100;
  const denominator = Math.max(0.05, 1 - feeRate - targetMarginRate);

  const recommendedMonthly = Math.round(
    (totalVariableCost + (Number(config.paymentFixedFee) || 0)) / denominator,
  );
  const minSustainable = Math.round(
    (totalVariableCost + (Number(config.paymentFixedFee) || 0)) / Math.max(0.05, 1 - feeRate),
  );
  const comfortableMonthly = Math.round(recommendedMonthly * 1.25);

  const discountRate = (Number(config.annualDiscountPercent) || 0) / 100;

  // Format currency
  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl backdrop-blur-xl border shadow-xl flex items-center gap-3 transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
              : 'bg-rose-950/90 text-rose-300 border-rose-500/40'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 bg-slate-900/60 border border-slate-800/80 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Smart Pricing & Cost Model Engine
            </h2>
            <p className="text-xs text-slate-400">
              Công cụ tính toán giá gói dịch vụ, mô phỏng chi phí biến đổi và cấu hình hạn ngạch sử dụng (Quota).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPricingData}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700/60 transition"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Hoàn tác</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-glass-primary !py-2 !px-4 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Left = Cost Model Simulator, Right = Plan Cards & Annual Discount Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Cost Model Calculator (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Variable Costs & Payment Provider Fee Settings */}
          <div className="glass-card p-6 bg-slate-900/60 border border-slate-800/80 rounded-3xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Mô Hình Chi Phí Biến Đổi (Unit Economics)
                </h3>
              </div>
              <span className="text-[11px] font-bold text-indigo-400 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20">
                VND / User / Tháng
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Chi phí AI Tutor / User</label>
                <NumberInput
                  value={config.aiCostPerUser}
                  onChange={(val) => setConfig({ ...config, aiCostPerUser: val })}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 font-mono focus:border-indigo-500 focus:outline-hidden"
                  placeholder="0"
                  suffix="₫"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Hạ tầng máy chủ (Hosting / Infra)</label>
                <NumberInput
                  value={config.hostingCostPerUser}
                  onChange={(val) => setConfig({ ...config, hostingCostPerUser: val })}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 font-mono focus:border-indigo-500 focus:outline-hidden"
                  placeholder="0"
                  suffix="₫"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Database & Storage / User</label>
                <NumberInput
                  value={config.databaseCostPerUser}
                  onChange={(val) => setConfig({ ...config, databaseCostPerUser: val })}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 font-mono focus:border-indigo-500 focus:outline-hidden"
                  placeholder="0"
                  suffix="₫"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Hỗ trợ CSKH & Vận hành / User</label>
                <NumberInput
                  value={config.supportCostPerUser}
                  onChange={(val) => setConfig({ ...config, supportCostPerUser: val })}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 font-mono focus:border-indigo-500 focus:outline-hidden"
                  placeholder="0"
                  suffix="₫"
                />
              </div>
            </div>

            {/* Payment Provider & Target Margin Settings */}
            <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Phí Cổng Thanh Toán (%)</label>
                <NumberInput
                  allowDecimal={true}
                  value={config.paymentProviderFeePercent}
                  onChange={(val) =>
                    setConfig({ ...config, paymentProviderFeePercent: val })
                  }
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 font-mono focus:border-indigo-500 focus:outline-hidden"
                  placeholder="0"
                  suffix="%"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Phí Cố Định Giao Dịch</label>
                <NumberInput
                  value={config.paymentFixedFee}
                  onChange={(val) =>
                    setConfig({ ...config, paymentFixedFee: val })
                  }
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 font-mono focus:border-indigo-500 focus:outline-hidden"
                  placeholder="0"
                  suffix="₫"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Biên Lợi Nhuận Mục Tiêu</label>
                <NumberInput
                  allowDecimal={true}
                  value={config.targetGrossMarginPercent}
                  onChange={(val) =>
                    setConfig({ ...config, targetGrossMarginPercent: val })
                  }
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 font-mono focus:border-indigo-500 focus:outline-hidden"
                  placeholder="0"
                  suffix="%"
                />
              </div>
            </div>
          </div>

          {/* Engine Output & 3 Scenarios */}
          <div className="glass-card p-6 bg-gradient-to-br from-indigo-950/30 via-slate-900/60 to-purple-950/30 border border-indigo-500/20 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Kết Quả Tính Giá Khuyến Nghị (Pricing Engine Output)
                </h3>
              </div>
              <span className="text-[11px] font-bold text-emerald-400">
                Biên mục tiêu: {config.targetGrossMarginPercent}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Giá Hòa Vốn (Min Sustainable)
                </span>
                <p className="text-base font-extrabold text-slate-200">
                  {formatVND(minSustainable)}
                </p>
                <p className="text-[10px] text-slate-500">Margin ~0% (Bảo toàn chi phí)</p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-600/15 border border-indigo-500/40 space-y-1 text-center">
                <span className="text-[10px] uppercase font-black text-indigo-400 flex items-center justify-center gap-1">
                  <Crown className="w-3 h-3" />
                  Khuyến Nghị (Recommended)
                </span>
                <p className="text-lg font-black text-white">
                  {formatVND(recommendedMonthly)}
                </p>
                <p className="text-[10px] text-indigo-300 font-semibold">
                  Đạt chuẩn Margin {(Number(config.targetGrossMarginPercent) || 0).toLocaleString()}%
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Giá Tối Ưu Tăng Trưởng (Comfortable)
                </span>
                <p className="text-base font-extrabold text-purple-300">
                  {formatVND(comfortableMonthly)}
                </p>
                <p className="text-[10px] text-slate-500">Dự phòng buffer 25%</p>
              </div>
            </div>
          </div>

          {/* Quota Management Settings */}
          <div className="glass-card p-6 bg-slate-900/60 border border-slate-800/80 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Hạn Ngạch Sử Dụng Theo Bậc (Usage Quota Matrix)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Guest: AI Tutor / Ngày</label>
                <NumberInput
                  value={config.quotas?.guestAiDailyQuota || 3}
                  onChange={(val) =>
                    setConfig({
                      ...config,
                      quotas: { ...config.quotas, guestAiDailyQuota: val },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 font-mono focus:border-indigo-500 focus:outline-hidden"
                  placeholder="0"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Free Tier: AI Tutor / Ngày</label>
                <NumberInput
                  value={config.quotas?.freeAiDailyQuota || 10}
                  onChange={(val) =>
                    setConfig({
                      ...config,
                      quotas: { ...config.quotas, freeAiDailyQuota: val },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 font-mono focus:border-indigo-500 focus:outline-hidden"
                  placeholder="0"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Free Tier: Lượt Ôn Tập / Ngày</label>
                <NumberInput
                  value={config.quotas?.freeReviewDailyQuota || 20}
                  onChange={(val) =>
                    setConfig({
                      ...config,
                      quotas: { ...config.quotas, freeReviewDailyQuota: val },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 font-mono focus:border-indigo-500 focus:outline-hidden"
                  placeholder="0"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Free Tier: Tối Đa Từ Yêu Thích</label>
                <NumberInput
                  value={config.quotas?.freeFavoritesMax || 50}
                  onChange={(val) =>
                    setConfig({
                      ...config,
                      quotas: { ...config.quotas, freeFavoritesMax: val },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 font-mono focus:border-indigo-500 focus:outline-hidden"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Plan Cards & Annual Discount Configuration (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Annual Discount Config Card */}
          <div className="glass-card p-6 bg-slate-900/60 border border-slate-800/80 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Chiết Khấu Gói Năm (Annual Discount)
                </h3>
              </div>
              <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                Mục tiêu 15% – 25%
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Mức giảm giá gói năm:</span>
                <div className="flex items-center gap-1.5">
                  {[10, 15, 20, 25].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setConfig({ ...config, annualDiscountPercent: rate })}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                        config.annualDiscountPercent === rate
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">Xem trước giao diện:</span>
                <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPreviewCycle('monthly')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      previewCycle === 'monthly'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Theo Tháng
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewCycle('yearly')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      previewCycle === 'yearly'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Theo Năm</span>
                    <span className="text-[9px] px-1 py-0.2 bg-emerald-500 text-slate-950 font-black rounded-md">
                      SAVE {config.annualDiscountPercent}%
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Plan Configuration Cards */}
          <div className="space-y-4">
            {plans.map((p, idx) => {
              const monthly = p.priceMonthly || 0;
              const annualPrice = Math.round(monthly * 12 * (1 - discountRate));
              const annualSavings = monthly * 12 - annualPrice;

              return (
                <div
                  key={p.id || idx}
                  className={`glass-card p-5 rounded-3xl border transition ${
                    p.tier === 'PRO'
                      ? 'bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border-indigo-500/40 shadow-xl'
                      : 'bg-slate-900/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-white text-base">{p.name}</h4>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            p.tier === 'PRO'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : p.tier === 'PLUS'
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {p.tier}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {p.tier === 'FREE'
                          ? 'Dành cho người mới bắt đầu'
                          : p.tier === 'PLUS'
                          ? 'Mở khóa các tính năng học tập nâng cao'
                          : 'VIP không giới hạn toàn bộ hệ sinh thái VocabFlow'}
                      </p>
                    </div>

                    <div className="text-right">
                      {previewCycle === 'monthly' ? (
                        <>
                          <span className="text-lg font-black text-white">
                            {formatVND(monthly)}
                          </span>
                          <span className="text-[10px] text-slate-500 block">/ tháng</span>
                        </>
                      ) : (
                        <>
                          <span className="text-lg font-black text-emerald-400">
                            {formatVND(annualPrice)}
                          </span>
                          <span className="text-[10px] text-slate-500 block">/ năm</span>
                          {annualSavings > 0 && (
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20 block mt-1">
                              Tiết kiệm {formatVND(annualSavings)}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Editable monthly price */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Chỉnh giá tháng:</span>
                    <div className="flex items-center gap-2 w-36">
                      <NumberInput
                        value={p.priceMonthly}
                        onChange={(val) => {
                          setPlans(
                            plans.map((pl) => (pl.id === p.id ? { ...pl, priceMonthly: val } : pl)),
                          );
                        }}
                        className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-right font-mono text-xs focus:border-indigo-500 focus:outline-hidden"
                        placeholder="0"
                        suffix="₫"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPricingPage;
