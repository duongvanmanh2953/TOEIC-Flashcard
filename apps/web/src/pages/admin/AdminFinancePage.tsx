import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  Download,
  RefreshCw,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  FileText,
  User,
  Search,
  ChevronDown,
} from 'lucide-react';
import api from '../../lib/api';
import { FilterSelect } from '../../components/ui/FilterSelect';

interface FinancialReportData {
  hasData: boolean;
  timeframe: string;
  metrics: {
    grossRevenue: number;
    netRevenue: number;
    mrr: number;
    arr: number;
    arpu: number;
    paidUsersCount: number;
    totalOrdersCount: number;
    paidOrdersCount: number;
    failedOrdersCount: number;
    pendingOrdersCount: number;
    paymentSuccessRate: number;
  };
  revenueTrend: Array<{
    date: string;
    gross: number;
    net: number;
    transactions: number;
  }>;
  planBreakdown: Array<{
    plan: string;
    revenue: number;
    count: number;
  }>;
  recentTransactions: Array<{
    id: string;
    orderCode: number;
    userId: string;
    userEmail: string;
    userName: string;
    planName: string;
    tier: string;
    amount: number;
    currency: string;
    status: string;
    paymentMethod: string;
    transactionCode: string | null;
    paidAt: string | null;
    createdAt: string;
  }>;
  failedPayments: Array<{
    id: string;
    orderCode: number;
    userEmail: string;
    amount: number;
    status: string;
    reason: string;
    createdAt: string;
  }>;
}

export const AdminFinancePage: React.FC = () => {
  const [data, setData] = useState<FinancialReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchFinance = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/finance/overview', {
        params: { range: timeframe },
      });
      setData(res.data?.data || res.data || null);
    } catch (err) {
      console.error('Failed to load financial overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinance();
  }, [timeframe]);

  // Export CSV functionality formatted for accounting
  const handleExportCSV = () => {
    if (!data || !data.recentTransactions || data.recentTransactions.length === 0) {
      alert('Không có dữ liệu giao dịch để xuất báo cáo.');
      return;
    }

    const headers = [
      'TransactionDate',
      'OrderCode',
      'UserID',
      'UserEmail',
      'PlanTier',
      'Amount',
      'Currency',
      'PaymentMethod',
      'Status',
      'TransactionCode',
      'PaidAt',
    ];

    const rows = data.recentTransactions.map((tx) => [
      tx.createdAt,
      tx.orderCode,
      tx.userId,
      `"${tx.userEmail}"`,
      `"${tx.planName}"`,
      tx.amount,
      tx.currency,
      tx.paymentMethod,
      tx.status,
      `"${tx.transactionCode || ''}"`,
      tx.paidAt || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LexiMind_Finance_Ledger_${timeframe}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTransactions = (data?.recentTransactions || []).filter((tx) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      tx.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(tx.orderCode).includes(searchQuery) ||
      (tx.transactionCode && tx.transactionCode.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>Báo Cáo Tài Chính & Doanh Thu (Financial Intelligence)</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase border border-emerald-500/30">
              Live Ledger
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Dữ liệu kế toán thực tế từ cổng thanh toán PayOS / VietQR và đăng ký gói học viên
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Timeframe Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            {[
              { id: 'Today', label: 'Hôm nay' },
              { id: '7d', label: '7 ngày' },
              { id: '30d', label: '30 ngày' },
              { id: 'quarter', label: 'Quý' },
              { id: 'year', label: 'Năm' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeframe(t.id)}
                className={`px-2.5 py-1 rounded-lg transition ${
                  timeframe === t.id
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchFinance}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Tải lại số liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            title="Xuất bảng đối soát giao dịch định dạng CSV kế toán"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV Kế Toán</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {/* Gross Revenue */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 block">Tổng Doanh Thu</span>
          <p className="text-lg sm:text-xl font-black text-white mt-1">
            {(data?.metrics.grossRevenue || 0).toLocaleString()} ₫
          </p>
          <span className="text-[10px] text-emerald-400 font-bold mt-1 block">
            Thực nhận từ cổng
          </span>
        </div>

        {/* Net Revenue */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 block">Doanh Thu Thuần</span>
          <p className="text-lg sm:text-xl font-black text-emerald-400 mt-1">
            {(data?.metrics.netRevenue || 0).toLocaleString()} ₫
          </p>
          <span className="text-[10px] text-slate-500 font-medium mt-1 block">
            Trừ 1.5% phí trung gian
          </span>
        </div>

        {/* MRR */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 block">MRR Định Kỳ</span>
          <p className="text-lg sm:text-xl font-black text-indigo-400 mt-1">
            {(data?.metrics.mrr || 0).toLocaleString()} ₫
          </p>
          <span className="text-[10px] text-slate-500 font-medium mt-1 block">
            Gói PRO/PLUS active
          </span>
        </div>

        {/* ARR */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 block">ARR Ước Tính</span>
          <p className="text-lg sm:text-xl font-black text-cyan-400 mt-1">
            {(data?.metrics.arr || 0).toLocaleString()} ₫
          </p>
          <span className="text-[10px] text-slate-500 font-medium mt-1 block">
            MRR × 12 tháng
          </span>
        </div>

        {/* ARPU */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 block">ARPU / Trả Phí</span>
          <p className="text-lg sm:text-xl font-black text-amber-400 mt-1">
            {(data?.metrics.arpu || 0).toLocaleString()} ₫
          </p>
          <span className="text-[10px] text-slate-500 font-medium mt-1 block">
            {data?.metrics.paidUsersCount || 0} học viên trả phí
          </span>
        </div>

        {/* Success Rate */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 block">Tỷ Lệ Thành Công</span>
          <p className="text-lg sm:text-xl font-black text-white mt-1">
            {data?.metrics.paymentSuccessRate || 100}%
          </p>
          <span className="text-[10px] text-slate-500 font-medium mt-1 block">
            {data?.metrics.paidOrdersCount || 0}/{data?.metrics.totalOrdersCount || 0} đơn
          </span>
        </div>
      </div>

      {/* Main Content Layout */}
      {!data?.hasData ? (
        /* Zero Fake Data Transparent Empty State */
        <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <CreditCard className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-200">
            Chưa có giao dịch tài chính trong cơ sở dữ liệu
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Hệ thống tuân thủ chính sách kiểm toán thực tế (Zero Fake Data). Khi học viên tạo giao dịch
            hoặc nâng cấp qua VietQR / PayOS, toàn bộ số liệu MRR, ARR, dòng tiền và biểu đồ doanh thu sẽ tự động kích hoạt.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Revenue Breakdown by Plan & Trend Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Plan Revenue Donut Summary */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cơ Cấu Doanh Thu Theo Gói</span>
              </h3>
              <div className="space-y-2">
                {data.planBreakdown.map((p) => (
                  <div key={p.plan} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white">{p.plan}</span>
                      <span className="text-[10px] text-slate-400 block">{p.count} đơn hoàn tất</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {p.revenue.toLocaleString()} ₫
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Failed Payments & Reconciliations Table */}
            <div className="lg:col-span-2 p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cảnh Báo Đơn Thanh Toán Thất Bại / Hết Hạn</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-semibold">
                  {data.failedPayments.length} đơn cần chú ý
                </span>
              </div>

              {data.failedPayments.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Không có đơn thanh toán nào thất bại. Cổng thanh toán hoạt động ổn định 100%.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] text-slate-400 font-bold uppercase">
                        <th className="pb-2">Mã Đơn</th>
                        <th className="pb-2">Email</th>
                        <th className="pb-2">Số Tiền</th>
                        <th className="pb-2">Lý Do</th>
                        <th className="pb-2 text-right">Thời Gian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {data.failedPayments.slice(0, 5).map((f) => (
                        <tr key={f.id} className="hover:bg-slate-800/40">
                          <td className="py-2 font-mono font-bold text-amber-400">#{f.orderCode}</td>
                          <td className="py-2 truncate max-w-[140px]">{f.userEmail}</td>
                          <td className="py-2 font-mono">{f.amount.toLocaleString()} ₫</td>
                          <td className="py-2 text-[11px] text-rose-400">{f.reason}</td>
                          <td className="py-2 text-right text-[10px] text-slate-500">
                            {new Date(f.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Transaction Ledger Table */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Sổ Cái Giao Dịch Tài Chính (Accounting Ledger)</span>
                </h3>
                <span className="text-[10px] text-slate-400">
                  {filteredTransactions.length} giao dịch được ghi nhận
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm mã đơn, email..."
                    className="pl-7 pr-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <FilterSelect
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val)}
                  options={[
                    { value: 'ALL', label: 'Tất cả trạng thái' },
                    { value: 'PAID', label: 'Đã thanh toán (PAID)' },
                    { value: 'PENDING', label: 'Đang chờ (PENDING)' },
                    { value: 'FAILED', label: 'Thất bại (FAILED)' },
                    { value: 'EXPIRED', label: 'Hết hạn (EXPIRED)' },
                  ]}
                  size="sm"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-400 font-bold uppercase bg-slate-950/40">
                    <th className="py-2.5 px-3">Thời Gian</th>
                    <th className="py-2.5 px-3">Mã Đơn</th>
                    <th className="py-2.5 px-3">Khách Hàng</th>
                    <th className="py-2.5 px-3">Gói Đăng Ký</th>
                    <th className="py-2.5 px-3">Số Tiền</th>
                    <th className="py-2.5 px-3">Kênh</th>
                    <th className="py-2.5 px-3 text-right">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-500">
                        Không có giao dịch nào khớp với bộ lọc tìm kiếm.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3 text-[11px] text-slate-400">
                          {new Date(tx.createdAt).toLocaleString([], {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-400">
                          #{tx.orderCode}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-white block">{tx.userName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{tx.userEmail}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                            {tx.planName}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-white">
                          {tx.amount.toLocaleString()} ₫
                        </td>
                        <td className="py-2.5 px-3 text-[10px] uppercase font-bold text-slate-400">
                          {tx.paymentMethod}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              tx.status === 'PAID'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : tx.status === 'PENDING'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFinancePage;
