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
  TrendingDown,
  Activity,
  Cpu,
  Users,
  Lightbulb,
  Building,
  HelpCircle,
} from 'lucide-react';
import api from '../../lib/api';
import {
  AdminButton,
  AdminInput,
  AdminSelect,
  AdminToggle,
} from '../../components/admin/ui';

export interface SmartPricingModel {
  // 1. Chi phí cố định (Fixed costs / month)
  fixedPersonnelCost: number;       // Nhân sự vận hành (VND)
  fixedHostingCost: number;         // Thuê máy chủ & hạ tầng cố định (VND)
  fixedDepreciationCost: number;    // Khấu hao tài sản/bản quyền (VND)
  fixedMaintenanceCost: number;     // Bảo trì & sửa chữa (VND)
  fixedOfficeUtilities: number;     // Văn phòng, điện, nước (VND)

  // 2. Chi phí biến đổi (Variable costs per user/session)
  variableAiPerUser: number;        // AI Inference cost per user/month (VND)
  variableBandwidthPerUser: number; // Cloud bandwidth/DB storage (VND)
  variableMarketingCAC: number;     // Chi phí marketing chiêu mộ user (CAC)
  paymentFeePercent: number;        // Phí cổng thanh toán (%)
  paymentFixedFee: number;          // Phí cố định mỗi giao dịch (VND)
  commissionPercent: number;        // Hoa hồng đối tác / đại lý (%)

  // 3. Hệ số môi trường & kinh doanh
  taxPercent: number;               // Thuế VAT / CIT (%)
  desiredMarginPercent: number;     // Tỷ suất lợi nhuận mong muốn (%)
  expectedActiveUsers: number;      // Lượng người dùng / học viên dự kiến
  occupancyRatePercent: number;     // Tỷ lệ lấp đầy phòng / công suất (%)
  peakHourMultiplier: number;       // Hệ số giờ cao điểm (x1.0 - x2.0)
  weekendMultiplier: number;        // Hệ số cuối tuần
  seasonalFactor: number;           // Hệ số mùa vụ (0.8 - 1.5)
}

export const AdminPricingPage: React.FC = () => {
  const [model, setModel] = useState<SmartPricingModel>({
    fixedPersonnelCost: 35000000,
    fixedHostingCost: 15000000,
    fixedDepreciationCost: 5000000,
    fixedMaintenanceCost: 4000000,
    fixedOfficeUtilities: 6000000,

    variableAiPerUser: 25000,
    variableBandwidthPerUser: 8000,
    variableMarketingCAC: 20000,
    paymentFeePercent: 3.5,
    paymentFixedFee: 2000,
    commissionPercent: 5.0,

    taxPercent: 10,
    desiredMarginPercent: 45,
    expectedActiveUsers: 1500,
    occupancyRatePercent: 70,
    peakHourMultiplier: 1.25,
    weekendMultiplier: 1.15,
    seasonalFactor: 1.0,
  });

  // Slider price simulation state (Simulated Selling Price in VND)
  const [simulatedPrice, setSimulatedPrice] = useState<number>(149000);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/admin/pricing');
      const data = res?.data?.data || res?.data || res;
      if (data?.model) {
        setModel((prev) => ({ ...prev, ...data.model }));
      }
    } catch {
      // Keep defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/admin/pricing', { model });
      showToast('success', 'Đã lưu cấu hình Smart Pricing Engine thành công!');
    } catch {
      showToast('error', 'Không thể lưu cấu hình định giá.');
    } finally {
      setSaving(false);
    }
  };

  // =========================================================================
  // SMART PRICING ALGORITHMS
  // =========================================================================
  const N = Math.max(1, model.expectedActiveUsers);
  const totalFixedCost =
    model.fixedPersonnelCost +
    model.fixedHostingCost +
    model.fixedDepreciationCost +
    model.fixedMaintenanceCost +
    model.fixedOfficeUtilities;

  const fixedCostPerUser = totalFixedCost / N;
  const directVariablePerUser =
    model.variableAiPerUser +
    model.variableBandwidthPerUser +
    model.variableMarketingCAC;

  const totalBaseCostPerUser = fixedCostPerUser + directVariablePerUser;

  // Fee & Tax rates
  const transactionFeeRate = (model.paymentFeePercent + model.commissionPercent) / 100;
  const taxRate = model.taxPercent / 100;
  const marginRate = model.desiredMarginPercent / 100;

  // Break-even price per user: (Base Cost + Fixed Fee) / (1 - Transaction Fee Rate - Tax Rate)
  const breakEvenDenominator = Math.max(0.1, 1 - transactionFeeRate - taxRate);
  const breakEvenPrice = Math.round((totalBaseCostPerUser + model.paymentFixedFee) / breakEvenDenominator);

  // Optimal Recommended Price: incorporates target margin
  const optimalDenominator = Math.max(0.1, 1 - transactionFeeRate - taxRate - marginRate);
  const recommendedPrice = Math.round((totalBaseCostPerUser + model.paymentFixedFee) / optimalDenominator);

  // Minimum profitable price (marginal 15% margin)
  const minProfitableDenominator = Math.max(0.1, 1 - transactionFeeRate - taxRate - 0.15);
  const minProfitablePrice = Math.round((totalBaseCostPerUser + model.paymentFixedFee) / minProfitableDenominator);

  // Maximum competitive price (premium scenario 65% margin)
  const maxCompetitiveDenominator = Math.max(0.1, 1 - transactionFeeRate - taxRate - 0.65);
  const maxCompetitivePrice = Math.round((totalBaseCostPerUser + model.paymentFixedFee) / maxCompetitiveDenominator);

  // Sync initial simulated price if first load
  useEffect(() => {
    if (recommendedPrice > 0 && simulatedPrice === 149000) {
      setSimulatedPrice(recommendedPrice);
    }
  }, [recommendedPrice]);

  // =========================================================================
  // REAL-TIME SIMULATION ENGINE: Price -> Demand -> Revenue -> Profit
  // =========================================================================
  // Price Elasticity model: demand decreases as price increases relative to recommended
  const priceRatio = simulatedPrice / (recommendedPrice || 1);
  const elasticityFactor = 1.35; // standard edtech elasticity
  // Simulated demand multiplier
  const demandMultiplier = Math.max(0.2, Math.min(2.5, Math.pow(1 / priceRatio, elasticityFactor)));
  const simulatedActiveUsers = Math.round(N * demandMultiplier * (model.occupancyRatePercent / 100));

  const simulatedGrossRevenue = simulatedActiveUsers * simulatedPrice;
  const simulatedPaymentFees =
    simulatedGrossRevenue * transactionFeeRate + simulatedActiveUsers * model.paymentFixedFee;
  const simulatedTaxes = simulatedGrossRevenue * taxRate;
  const simulatedVariableCosts = simulatedActiveUsers * directVariablePerUser;
  const simulatedTotalCosts = totalFixedCost + simulatedVariableCosts + simulatedPaymentFees + simulatedTaxes;
  const simulatedNetProfit = simulatedGrossRevenue - simulatedTotalCosts;
  const simulatedNetMargin = simulatedGrossRevenue > 0 ? (simulatedNetProfit / simulatedGrossRevenue) * 100 : 0;
  const simulatedROI = simulatedTotalCosts > 0 ? (simulatedNetProfit / simulatedTotalCosts) * 100 : 0;

  // Cost Breakdown Percentages
  const costDrivers = [
    { name: 'Nhân Sự Vận Hành', cost: model.fixedPersonnelCost, type: 'fixed' },
    { name: 'AI LLM Inference', cost: model.variableAiPerUser * N, type: 'variable' },
    { name: 'Hạ Tầng Cloud & DB', cost: model.fixedHostingCost + model.variableBandwidthPerUser * N, type: 'fixed' },
    { name: 'Marketing & CAC', cost: model.variableMarketingCAC * N, type: 'variable' },
    { name: 'Mặt Bằng, Điện Nước', cost: model.fixedOfficeUtilities, type: 'fixed' },
    { name: 'Khấu Hao & Bản Quyền', cost: model.fixedDepreciationCost, type: 'fixed' },
    { name: 'Bảo Trì & Sửa Chữa', cost: model.fixedMaintenanceCost, type: 'fixed' },
  ];
  const grandTotalCost = costDrivers.reduce((acc, c) => acc + c.cost, 0);
  const costBreakdown = costDrivers.map((c) => ({
    ...c,
    percent: ((c.cost / (grandTotalCost || 1)) * 100).toFixed(1),
  })).sort((a, b) => b.cost - a.cost);

  const formatVND = (v: number) => {
    return Math.round(v).toLocaleString('vi-VN') + ' ₫';
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1 border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Smart Pricing Engine & Decision Support</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Định Giá Thông Minh & Tối Ưu Lợi Nhuận
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Mô hình hóa chi phí đa biến, giả lập độ co giãn nhu cầu và gợi ý mức giá tối ưu doanh thu.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <AdminButton
            variant="secondary"
            size="sm"
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={fetchPricing}
          >
            Khôi Phục
          </AdminButton>
          <AdminButton
            variant="primary"
            size="sm"
            loading={saving}
            icon={<Save className="w-3.5 h-3.5" />}
            onClick={handleSave}
          >
            Lưu Cấu Hình Giá
          </AdminButton>
        </div>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* =====================================================================
          SECTION 1: SMART PRICING SCENARIOS CARDS
          ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Break-even Price */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
              <span>Giá Hòa Vốn (Break-Even)</span>
              <ShieldCheck className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-200 tabular-nums">
              {formatVND(breakEvenPrice)}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Mức giá tối thiểu bù đắp chi phí cố định + biến đổi + thuế + cổng thanh toán.
          </p>
        </div>

        {/* Conservative Scenario */}
        <div
          onClick={() => setSimulatedPrice(minProfitablePrice)}
          className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs ${
            simulatedPrice === minProfitablePrice
              ? 'bg-cyan-500/10 border-cyan-500/50'
              : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-cyan-600 dark:text-cyan-400 font-semibold mb-1">
            <span>Kịch Bản Thận Trọng</span>
            <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-[10px] font-bold">15% Margin</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-cyan-600 dark:text-cyan-300 tabular-nums">
            {formatVND(minProfitablePrice)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Ưu tiên tối đa lượng học viên, hạ giá để chiếm thị phần cao nhất.
          </p>
        </div>

        {/* Balanced Scenario (Recommended) */}
        <div
          onClick={() => setSimulatedPrice(recommendedPrice)}
          className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden shadow-xs ${
            simulatedPrice === recommendedPrice
              ? 'bg-indigo-500/15 border-indigo-500/60 ring-1 ring-indigo-500/30'
              : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-indigo-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Khuyến Nghị Cân Bằng</span>
            </span>
            <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold">
              {model.desiredMarginPercent}% Margin
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-200 tabular-nums">
            {formatVND(recommendedPrice)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Điểm tối ưu hóa doanh thu và lợi nhuận dài hạn (Sweet Spot).
          </p>
        </div>

        {/* Aggressive Scenario */}
        <div
          onClick={() => setSimulatedPrice(maxCompetitivePrice)}
          className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs ${
            simulatedPrice === maxCompetitivePrice
              ? 'bg-purple-500/10 border-purple-500/50'
              : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-purple-600 dark:text-purple-400 font-semibold mb-1">
            <span>Kịch Bản Cao Cấp</span>
            <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-[10px] font-bold">65% Margin</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-300 tabular-nums">
            {formatVND(maxCompetitivePrice)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Định vị sản phẩm cao cấp, biên lợi nhuận dày, tập trung học viên Pro.
          </p>
        </div>
      </div>

      {/* =====================================================================
          SECTION 2: REAL-TIME INTERACTIVE SIMULATION SLIDER
          ===================================================================== */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4 backdrop-blur-md shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
              Bộ Giả Lập Tương Tác Thời Gian Thực (Price Elasticity Simulator)
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Kéo thanh trượt để quan sát biến thiên Doanh Thu & Lợi Nhuận
          </span>
        </div>

        {/* Slider Controls */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Mức Giá Bán Giả Định (Simulated Price):
            </span>
            <span className="text-lg font-bold text-indigo-300 tabular-nums">
              {formatVND(simulatedPrice)} / tháng
            </span>
          </div>
          <input
            type="range"
            min={Math.round(breakEvenPrice * 0.7)}
            max={Math.round(maxCompetitivePrice * 1.3)}
            step={5000}
            value={simulatedPrice}
            onChange={(e) => setSimulatedPrice(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex items-center justify-between text-[10px] text-slate-500 tabular-nums">
            <span>Sàn: {formatVND(breakEvenPrice * 0.7)}</span>
            <span>Hòa vốn: {formatVND(breakEvenPrice)}</span>
            <span>Khuyến nghị: {formatVND(recommendedPrice)}</span>
            <span>Trần: {formatVND(maxCompetitivePrice * 1.3)}</span>
          </div>
        </div>

        {/* Simulated Impact Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between sm:flex-col sm:items-start gap-2 shadow-xs">
            <div className="min-w-0">
              <span className="text-xs sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate block">Học Viên Mô Phỏng</span>
              <span className={`text-[11px] font-medium truncate block mt-0.5 ${demandMultiplier >= 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                Nhu cầu: {(demandMultiplier * 100).toFixed(0)}%
              </span>
            </div>
            <span className="text-base font-bold text-white tabular-nums shrink-0">
              {simulatedActiveUsers.toLocaleString()} users
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between sm:flex-col sm:items-start gap-2 shadow-xs">
            <div className="min-w-0">
              <span className="text-xs sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate block">Doanh Thu Dự Phóng</span>
              <span className="text-[11px] text-slate-400 truncate block mt-0.5">Tổng thu tháng</span>
            </div>
            <span className="text-base font-bold text-emerald-400 tabular-nums shrink-0">
              {(simulatedGrossRevenue / 1000000).toFixed(1)}M ₫
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between sm:flex-col sm:items-start gap-2 shadow-xs">
            <div className="min-w-0">
              <span className="text-xs sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate block">Tổng Chi Phí</span>
              <span className="text-[11px] text-slate-400 truncate block mt-0.5">Bao gồm thuế + phí</span>
            </div>
            <span className="text-base font-bold text-rose-300 tabular-nums shrink-0">
              {(simulatedTotalCosts / 1000000).toFixed(1)}M ₫
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between sm:flex-col sm:items-start gap-2 shadow-xs">
            <div className="min-w-0">
              <span className="text-xs sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate block">Lợi Nhuận Ròng</span>
              <span className="text-[11px] text-slate-400 truncate block mt-0.5">Sau tất cả chi phí</span>
            </div>
            <span
              className={`text-base font-bold tabular-nums shrink-0 ${
                simulatedNetProfit >= 0 ? 'text-indigo-300' : 'text-rose-400'
              }`}
            >
              {(simulatedNetProfit / 1000000).toFixed(1)}M ₫
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between sm:flex-col sm:items-start gap-2 shadow-xs">
            <div className="min-w-0">
              <span className="text-xs sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate block">Biên Lợi Nhuận</span>
              <span className="text-[11px] text-slate-400 truncate block mt-0.5">Net Profit Margin</span>
            </div>
            <span
              className={`text-base font-bold tabular-nums shrink-0 ${
                simulatedNetMargin >= 30
                  ? 'text-emerald-400'
                  : simulatedNetMargin >= 0
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {simulatedNetMargin.toFixed(1)}%
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between sm:flex-col sm:items-start gap-2 shadow-xs">
            <div className="min-w-0">
              <span className="text-xs sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate block">Hiệu Suất Vốn</span>
              <span className="text-[11px] text-slate-400 truncate block mt-0.5">Return on Investment</span>
            </div>
            <span
              className={`text-base font-bold tabular-nums shrink-0 ${
                simulatedROI >= 50 ? 'text-emerald-400' : 'text-slate-200'
              }`}
            >
              {simulatedROI.toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">Return on Operating Cost</span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          SECTION 3: COST OPTIMIZER & DECISION SUPPORT
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cost Drivers Breakdown (Left 2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                Bộ Phân Tích Cơ Cấu Chi Phí (Cost Optimizer Engine)
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Tổng chi phí cơ sở: <span className="font-semibold text-white tabular-nums">{(grandTotalCost / 1000000).toFixed(1)}M ₫/tháng</span>
            </span>
          </div>

          {/* Breakdown bars */}
          <div className="space-y-3">
            {costBreakdown.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-200">{item.name}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${item.type === 'fixed' ? 'bg-slate-800 text-slate-400' : 'bg-indigo-500/20 text-indigo-300'}`}>
                      {item.type === 'fixed' ? 'Cố định' : 'Biến đổi'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 tabular-nums">
                    <span className="text-slate-400">{formatVND(item.cost)}</span>
                    <span className="font-bold text-white w-12 text-right">{item.percent}%</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Strategic Decision Support Recommendations (Right col) */}
        <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-indigo-200">Đề Xuất Ra Quyết Định Chiến Lược</h3>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="font-bold text-amber-400 block mb-1">
                1. Tối ưu Chi phí Nhân sự ({costBreakdown[0]?.percent}% tổng CP)
              </span>
              <p className="text-slate-400 text-[11px]">
                Áp dụng quy trình tự động hóa CSKH bằng AI Tutor có thể giảm 15% tải nhân sự, tiết kiệm khoảng {(model.fixedPersonnelCost * 0.15 / 1000000).toFixed(1)}M ₫/tháng.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="font-bold text-emerald-400 block mb-1">
                2. Tối ưu Token Cache cho AI ({costBreakdown.find(c => c.name.includes('AI'))?.percent}% tổng CP)
              </span>
              <p className="text-slate-400 text-[11px]">
                Kích hoạt Semantic Caching cho các câu hỏi thường gặp sẽ giảm 20% chi phí OpenAI/Claude API, tăng biên lợi nhuận thêm 3.2%.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="font-bold text-cyan-400 block mb-1">
                3. Điều chỉnh Giá Giờ Cao Điểm (Dynamic Pricing)
              </span>
              <p className="text-slate-400 text-[11px]">
                Tăng hệ số khung 20:00 - 22:00 lên x{model.peakHourMultiplier} và giảm khung 08:00 - 16:00 xuống x0.85 giúp cân bằng tải server và tăng 11% doanh thu phòng đấu.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          SECTION 4: FULL COST MODEL INPUTS CONFIGURATION
          ===================================================================== */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Calculator className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">
            Tham Số Đầu Vào Mô Hình Chi Phí (Cost Model Parameters)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Group 1: Chi phí cố định */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
              1. Chi Phí Cố Định (Hàng Tháng)
            </span>

            <AdminInput
              label="Chi Phí Nhân Sự & Hỗ Trợ"
              type="number"
              suffixUnit="₫"
              value={model.fixedPersonnelCost}
              onChange={(e) => setModel({ ...model, fixedPersonnelCost: Number(e.target.value) })}
              size="sm"
            />

            <AdminInput
              label="Thuê Server & Hạ Tầng Cố Định"
              type="number"
              suffixUnit="₫"
              value={model.fixedHostingCost}
              onChange={(e) => setModel({ ...model, fixedHostingCost: Number(e.target.value) })}
              size="sm"
            />

            <AdminInput
              label="Văn Phòng, Điện & Nước"
              type="number"
              suffixUnit="₫"
              value={model.fixedOfficeUtilities}
              onChange={(e) => setModel({ ...model, fixedOfficeUtilities: Number(e.target.value) })}
              size="sm"
            />

            <AdminInput
              label="Khấu Hao Tài Sản & Bản Quyền"
              type="number"
              suffixUnit="₫"
              value={model.fixedDepreciationCost}
              onChange={(e) => setModel({ ...model, fixedDepreciationCost: Number(e.target.value) })}
              size="sm"
            />

            <AdminInput
              label="Bảo Trì & Sửa Chữa"
              type="number"
              suffixUnit="₫"
              value={model.fixedMaintenanceCost}
              onChange={(e) => setModel({ ...model, fixedMaintenanceCost: Number(e.target.value) })}
              size="sm"
            />
          </div>

          {/* Group 2: Chi phí biến đổi */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
              2. Chi Phí Biến Đổi & Giao Dịch
            </span>

            <AdminInput
              label="Chi Phí AI Token / User"
              type="number"
              suffixUnit="₫"
              value={model.variableAiPerUser}
              onChange={(e) => setModel({ ...model, variableAiPerUser: Number(e.target.value) })}
              size="sm"
            />

            <AdminInput
              label="Băng Thông & Database / User"
              type="number"
              suffixUnit="₫"
              value={model.variableBandwidthPerUser}
              onChange={(e) => setModel({ ...model, variableBandwidthPerUser: Number(e.target.value) })}
              size="sm"
            />

            <AdminInput
              label="Chi Phí Marketing / CAC mỗi User"
              type="number"
              suffixUnit="₫"
              value={model.variableMarketingCAC}
              onChange={(e) => setModel({ ...model, variableMarketingCAC: Number(e.target.value) })}
              size="sm"
            />

            <AdminInput
              label="Phí Cổng Thanh Toán (%)"
              type="number"
              suffixUnit="%"
              value={model.paymentFeePercent}
              onChange={(e) => setModel({ ...model, paymentFeePercent: Number(e.target.value) })}
              size="sm"
            />

            <AdminInput
              label="Phí Cố Định Mỗi Giao Dịch"
              type="number"
              suffixUnit="₫"
              value={model.paymentFixedFee}
              onChange={(e) => setModel({ ...model, paymentFixedFee: Number(e.target.value) })}
              size="sm"
            />
          </div>

          {/* Group 3: Hệ số kinh doanh & Môi trường */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
              3. Hệ Số Kinh Doanh & Vận Hành
            </span>

            <AdminInput
              label="Biên Lợi Nhuận Mong Muốn (%)"
              type="number"
              suffixUnit="%"
              value={model.desiredMarginPercent}
              onChange={(e) => setModel({ ...model, desiredMarginPercent: Number(e.target.value) })}
              size="sm"
            />

            <AdminInput
              label="Số Lượng Học Viên Dự Kiến"
              type="number"
              suffixUnit="users"
              value={model.expectedActiveUsers}
              onChange={(e) => setModel({ ...model, expectedActiveUsers: Number(e.target.value) })}
              size="sm"
            />

            <AdminInput
              label="Tỷ Lệ Lấp Đầy / Công Suất (%)"
              type="number"
              suffixUnit="%"
              value={model.occupancyRatePercent}
              onChange={(e) => setModel({ ...model, occupancyRatePercent: Number(e.target.value) })}
              size="sm"
            />

            <AdminInput
              label="Thuế Suất VAT / Doanh Nghiệp (%)"
              type="number"
              suffixUnit="%"
              value={model.taxPercent}
              onChange={(e) => setModel({ ...model, taxPercent: Number(e.target.value) })}
              size="sm"
            />

            <AdminInput
              label="Hệ Số Giờ Cao Điểm (Peak)"
              type="number"
              step="0.05"
              suffixUnit="x"
              value={model.peakHourMultiplier}
              onChange={(e) => setModel({ ...model, peakHourMultiplier: Number(e.target.value) })}
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
