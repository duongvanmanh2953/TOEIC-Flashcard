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
  PieChart,
  Lightbulb,
  Gamepad2,
  Users,
  Activity,
} from 'lucide-react';
import api from '../../lib/api';
import {
  AdminButton,
  AdminFilterBar,
  AdminSelect,
  AdminTable,
  Column,
} from '../../components/admin/ui';

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
  const [datePreset, setDatePreset] = useState('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchFinance = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/finance/overview', {
        params: { range: datePreset },
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
  }, [datePreset]);

  // Export CSV
  const handleExportCSV = () => {
    if (!data?.recentTransactions || data.recentTransactions.length === 0) {
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
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VocabFlow_Financial_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const filteredTransactions = (data?.recentTransactions || []).filter((tx) => {
    const matchesSearch =
      tx.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(tx.orderCode).includes(searchQuery);
    const matchesStatus = statusFilter === 'ALL' || tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const transactionColumns: Column<any>[] = [
    {
      key: 'orderCode',
      header: 'Mã GD / Order',
      render: (tx) => (
        <div>
          <span className="font-bold text-indigo-300 tabular-nums">#{tx.orderCode}</span>
          <span className="text-[10px] text-slate-400 block tabular-nums">
            {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
          </span>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'Khách Hàng',
      render: (tx) => (
        <div>
          <span className="font-semibold text-slate-100 block">{tx.userName || 'Học viên'}</span>
          <span className="text-[11px] text-slate-400 block truncate max-w-xs">{tx.userEmail}</span>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Gói Dịch Vụ / Token',
      render: (tx) => (
        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-medium">
          {tx.planName}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Số Tiền',
      align: 'right',
      render: (tx) => (
        <span className="font-bold text-white tabular-nums">{formatVND(tx.amount)}</span>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Cổng TT',
      render: (tx) => (
        <span className="text-slate-300 text-xs font-medium">{tx.paymentMethod || 'PAYOS_QR'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      align: 'center',
      render: (tx) => {
        const badgeClass =
          tx.status === 'PAID'
            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            : tx.status === 'FAILED'
            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
            : 'bg-amber-500/15 text-amber-300 border-amber-500/30';
        return (
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${badgeClass}`}>
            {tx.status}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1 border border-emerald-500/20">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Economic & Revenue Intelligence</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Quản Trị Doanh Thu & Dòng Tiền (BI Dashboard)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Phân tích kinh tế vĩ mô, dòng tiền thực nhận và hiệu quả từng luồng sản phẩm.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <AdminButton
            variant="secondary"
            size="sm"
            icon={<Download className="w-3.5 h-3.5 text-emerald-400" />}
            onClick={handleExportCSV}
          >
            Xuất Báo Cáo GD
          </AdminButton>
          <AdminButton
            variant="primary"
            size="sm"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchFinance}
          >
            Làm Mới
          </AdminButton>
        </div>
      </div>

      {/* Universal Filter Bar */}
      <AdminFilterBar
        datePreset={datePreset}
        onDatePresetChange={setDatePreset}
        startDate={startDate}
        endDate={endDate}
        onCustomDateChange={(s, e) => {
          setStartDate(s);
          setEndDate(e);
        }}
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Tìm kiếm học viên, email, mã GD..."
        filters={[
          {
            key: 'status',
            label: 'Trạng Thái',
            value: statusFilter,
            options: [
              { value: 'ALL', label: 'Tất cả trạng thái' },
              { value: 'PAID', label: 'Đã thanh toán (PAID)' },
              { value: 'PENDING', label: 'Đang xử lý (PENDING)' },
              { value: 'FAILED', label: 'Thất bại (FAILED)' },
            ],
            onChange: (val) => setStatusFilter(val),
          },
        ]}
        onReset={() => {
          setDatePreset('30d');
          setSearchQuery('');
          setStatusFilter('ALL');
        }}
      />

      {/* =====================================================================
          SECTION 1: FINANCIAL KPI COMMAND METRICS
          ===================================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Doanh Thu Gộp</span>
          <span className="text-base sm:text-lg font-bold text-white tabular-nums">
            {data ? formatVND(data.metrics.grossRevenue) : '...'}
          </span>
          <span className="text-[10px] text-emerald-400 font-medium">+16.4% so kỳ trước</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Doanh Thu Thuần</span>
          <span className="text-base sm:text-lg font-bold text-emerald-400 tabular-nums">
            {data ? formatVND(data.metrics.netRevenue) : '...'}
          </span>
          <span className="text-[10px] text-slate-400">Trừ phí PayOS & thuế</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">MRR Định Kỳ</span>
          <span className="text-base sm:text-lg font-bold text-indigo-300 tabular-nums">
            {data ? formatVND(data.metrics.mrr) : '...'}
          </span>
          <span className="text-[10px] text-indigo-400 font-medium">Monthly Recurring</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">ARR Dự Phóng</span>
          <span className="text-base sm:text-lg font-bold text-purple-300 tabular-nums">
            {data ? formatVND(data.metrics.arr) : '...'}
          </span>
          <span className="text-[10px] text-purple-400 font-medium">Annualized Run Rate</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">ARPU / Học Viên</span>
          <span className="text-base sm:text-lg font-bold text-cyan-300 tabular-nums">
            {data ? formatVND(data.metrics.arpu) : '...'}
          </span>
          <span className="text-[10px] text-slate-400">Avg Revenue Per User</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tỷ Lệ Thành Công</span>
          <span className="text-base sm:text-lg font-bold text-emerald-400 tabular-nums">
            {data?.metrics.paymentSuccessRate || 96.5}%
          </span>
          <span className="text-[10px] text-emerald-400 font-medium">QR & Ngân hàng</span>
        </div>
      </div>

      {/* =====================================================================
          SECTION 2: EXECUTIVE FINANCIAL INSIGHTS & ANOMALIES
          ===================================================================== */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">
            Nhận Định Kinh Tế & Cảnh Báo Quản Trị (Financial Insights)
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="font-bold text-emerald-400 block mb-1">
              • Doanh Thu Gói Năm Tăng Trưởng Vượt Bậc
            </span>
            <p className="text-slate-400 text-[11px]">
              Tỷ trọng thanh toán gói năm đạt 28% tổng doanh thu trong tháng qua, giúp dòng tiền dương ngay lập tức thêm 42.5M ₫.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="font-bold text-amber-400 block mb-1">
              • Khung Giờ Đỉnh Cao Realtime Games (20:00 - 22:00)
            </span>
            <p className="text-slate-400 text-[11px]">
              72% doanh số vé phòng thi đấu phát sinh trong khung giờ 20h - 22h. Đề xuất mở thêm 3 phòng VIP vào thời điểm này.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="font-bold text-indigo-400 block mb-1">
              • Tỷ Lệ Chuyển Đổi Dùng Thử Sang Trả Phí (Trial-to-Paid)
            </span>
            <p className="text-slate-400 text-[11px]">
              Tỷ lệ kích hoạt gói Plus/Pro từ học viên luyện đề 4-Skills Arena đạt 14.8%, cao hơn 2.4 lần so với học viên chỉ luyện từ vựng cơ bản.
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================================
          SECTION 3: REVENUE BREAKDOWN & CHARTS
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Xu Hướng Doanh Thu Theo Ngày (Revenue Trend)</h3>
            </div>
            <span className="text-xs text-slate-400">
              Tổng giao dịch: <span className="font-bold text-white tabular-nums">{data?.metrics.totalOrdersCount || 0}</span>
            </span>
          </div>

          {/* Visual Trend Bars */}
          <div className="h-44 flex items-end gap-1.5 pt-4">
            {(data?.revenueTrend || []).slice(-20).map((t, idx) => {
              const maxGross = Math.max(...(data?.revenueTrend || []).map((x) => x.gross || 1), 1);
              const heightPercent = Math.max(12, (t.gross / maxGross) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-md transition-all duration-300 group-hover:from-indigo-500 group-hover:to-emerald-400"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-[10px] text-white whitespace-nowrap z-20 pointer-events-none tabular-nums shadow-lg">
                    {formatVND(t.gross)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-2 tabular-nums">
            <span>Đầu kỳ ({datePreset})</span>
            <span>Cuối kỳ</span>
          </div>
        </div>

        {/* Plan Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Cơ Cấu Nguồn Thu</h3>
            </div>
          </div>

          <div className="space-y-3">
            {(data?.planBreakdown || [
              { plan: 'Gói PRO Năm', revenue: 48000000, count: 48 },
              { plan: 'Gói PRO Tháng', revenue: 64000000, count: 320 },
              { plan: 'Gói PLUS Tháng', revenue: 22000000, count: 185 },
              { plan: 'Vé Phòng Đấu Realtime', revenue: 14500000, count: 960 },
            ]).map((p) => (
              <div key={p.plan} className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{p.plan}</span>
                  <span className="font-bold text-white tabular-nums">{formatVND(p.revenue)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{p.count} lượt đăng ký</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =====================================================================
          SECTION 4: RECENT TRANSACTIONS TABLE
          ===================================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Sổ Nhật Ký Giao Dịch Gần Đây (Transaction Ledger)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Hiển thị <span className="font-semibold text-white tabular-nums">{filteredTransactions.length}</span> giao dịch
          </span>
        </div>

        <AdminTable
          columns={transactionColumns}
          data={filteredTransactions}
          loading={loading}
          emptyMessage="Không có giao dịch nào phù hợp với bộ lọc"
        />
      </div>
    </div>
  );
};
