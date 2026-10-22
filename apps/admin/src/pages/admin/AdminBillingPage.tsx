import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Users,
  Search,
  Filter,
  RefreshCw,
  Download,
  RotateCcw,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Send,
  HelpCircle,
  ArrowUpRight,
  Sparkles,
  QrCode,
  FileSpreadsheet,
  Building2,
  Power,
  ShieldOff,
  Edit3,
  Lock,
  X,
} from 'lucide-react';
import api, { extractApiData } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { ChatDrawer } from '../../components/chat/ChatDrawer';
import { RollbackModal, RollbackOrderData } from '../../components/admin/billing/RollbackModal';
import { TransactionDetailsModal } from '../../components/admin/billing/TransactionDetailsModal';

export const AdminBillingPage: React.FC = () => {
  const { user } = useAuth();

  // Data & Telemetry
  const [transactions, setTransactions] = useState<RollbackOrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalGrossRevenue: 0,
    paidCount: 0,
    pendingCount: 0,
    failedCount: 0,
    refundedCount: 0,
    refundedAmount: 0,
    disputedCount: 0,
  });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<string>('30d');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals & ChatDrawer state
  const [detailsOrder, setDetailsOrder] = useState<RollbackOrderData | null>(null);
  const [rollbackOrder, setRollbackOrder] = useState<RollbackOrderData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Chat integration
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatTargetUser, setChatTargetUser] = useState<{
    id: string;
    displayName: string;
    avatar?: string;
    email?: string;
  } | null>(null);
  const [chatContext, setChatContext] = useState<any>(null);

  // Payment Gateway Kill Switch state (MOIT / Bộ Công Thương compliance)
  const [gatewayStatus, setGatewayStatus] = useState<{
    enabled: boolean;
    reason: string;
    updatedAt?: string;
  }>({
    enabled: true,
    reason:
      'Hệ thống đang tạm ngừng tính năng nạp tiền để hoàn tất thủ tục đăng ký / thông báo với Bộ Công Thương theo Nghị định 52/2013/NĐ-CP. Quý học viên vẫn có thể học miễn phí bình thường!',
  });
  const [gatewayModalOpen, setGatewayModalOpen] = useState(false);
  const [gatewayReasonInput, setGatewayReasonInput] = useState('');
  const [togglingGateway, setTogglingGateway] = useState(false);

  const fetchGatewayStatus = useCallback(async () => {
    try {
      const res: any = await api.get('/admin/payment-gateway/status');
      const data = extractApiData<any>(res, {});
      if (data) {
        setGatewayStatus({
          enabled: data.enabled !== false,
          reason:
            data.reason ||
            'Hệ thống đang tạm ngừng tính năng nạp tiền để hoàn tất thủ tục đăng ký / thông báo với Bộ Công Thương theo Nghị định 52/2013/NĐ-CP. Quý học viên vẫn có thể học miễn phí bình thường!',
          updatedAt: data.updatedAt,
        });
        setGatewayReasonInput(
          data.reason ||
            'Hệ thống đang tạm ngừng tính năng nạp tiền để hoàn tất thủ tục đăng ký / thông báo với Bộ Công Thương theo Nghị định 52/2013/NĐ-CP. Quý học viên vẫn có thể học miễn phí bình thường!',
        );
      }
    } catch (err) {
      console.error('Failed to fetch gateway status:', err);
    }
  }, []);

  const handleToggleGateway = async (targetEnabled: boolean) => {
    setTogglingGateway(true);
    try {
      const res: any = await api.post('/admin/payment-gateway/toggle', {
        enabled: targetEnabled,
        reason: gatewayReasonInput.trim(),
      });
      if (res?.data?.success || res?.success) {
        setGatewayStatus((prev) => ({
          ...prev,
          enabled: targetEnabled,
          reason: gatewayReasonInput.trim() || prev.reason,
        }));
        setGatewayModalOpen(false);
        setToastMessage(
          targetEnabled
            ? 'Đã BẬT lại cổng giao dịch nạp tiền thành công!'
            : 'Đã TẮT cổng giao dịch nạp tiền! Học viên sẽ thấy thông báo tạm dừng theo quy định Bộ Công Thương.',
        );
        setTimeout(() => setToastMessage(null), 5000);
      }
    } catch (err: any) {
      console.error('Failed to toggle gateway:', err);
      alert(err?.response?.data?.message || 'Có lỗi khi thay đổi trạng thái cổng thanh toán.');
    } finally {
      setTogglingGateway(false);
    }
  };

  // Fetch transactions from API
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/admin/transactions', {
        params: {
          search: searchQuery.trim() || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          range: dateRange,
          page,
          limit,
        },
      });

      const data = extractApiData<any>(res, {});
      if (data?.items) {
        setTransactions(data.items);
        setTotalCount(data.pagination?.total || data.items.length);
        setTotalPages(data.pagination?.totalPages || 1);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (err: any) {
      console.error('Failed to load transaction history:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, dateRange, page, limit]);

  useEffect(() => {
    fetchTransactions();
    fetchGatewayStatus();
  }, [fetchTransactions, fetchGatewayStatus]);

  // Format currency helper
  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  // Open Chat directly with user
  const handleOpenChat = (order: RollbackOrderData) => {
    if (!order.user?.id) return;
    setChatTargetUser({
      id: order.user.id,
      displayName: order.user.displayName || order.user.email,
      avatar: order.user.avatar,
      email: order.user.email,
    });
    setChatContext({
      bankTitle: `Giao dịch #${order.orderCode} - Gói ${order.planName}`,
    });
    setIsChatOpen(true);
  };

  // Handle successful rollback
  const handleRollbackSuccess = (updatedOrder: any, message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 5000);
    fetchTransactions();
  };

  // Export CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert('Không có dữ liệu giao dịch để xuất CSV.');
      return;
    }

    const headers = [
      'Mã Đơn',
      'Thời Gian',
      'Tên Khách Hàng',
      'Email',
      'Gói Cước',
      'Số Tiền (VND)',
      'Cổng TT',
      'Mã GD Ngân Hàng',
      'Trạng Thái',
      'Đã Hoàn Tiền',
      'Mã GD Hoàn Tiền',
      'Lý Do Khiếu Nại/Hoàn Tiền',
    ];

    const rows = transactions.map((tx) => [
      tx.orderCode,
      `"${new Date(tx.createdAt).toLocaleString('vi-VN')}"`,
      `"${tx.user?.displayName || ''}"`,
      `"${tx.user?.email || ''}"`,
      `"${tx.planName}"`,
      tx.amount,
      tx.paymentMethod,
      `"${tx.transactionCode || ''}"`,
      tx.displayStatus || tx.status,
      tx.rollback?.isRefunded ? 'CÓ' : 'KHÔNG',
      `"${tx.rollback?.refundTxCode || ''}"`,
      `"${tx.rollback?.reason || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LetStuN_Transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status badge styling helper
  const renderStatusBadge = (tx: RollbackOrderData) => {
    const isRefunded = tx.rollback?.isRefunded || tx.displayStatus === 'REFUNDED';
    const isDisputed = tx.rollback?.isDisputed || tx.displayStatus === 'DISPUTED';

    if (isRefunded) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
          <RotateCcw className="w-3 h-3 text-rose-400" />
          <span>Đã Hoàn Tiền</span>
        </span>
      );
    }

    if (isDisputed) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <HelpCircle className="w-3 h-3 text-amber-400" />
          <span>Đang Khiếu Nại</span>
        </span>
      );
    }

    if (tx.status === 'PAID') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Thành Công</span>
        </span>
      );
    }

    if (tx.status === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>Chờ Chuyển Khoản</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">
        <XCircle className="w-3 h-3 text-slate-400" />
        <span>{tx.status}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 text-slate-100 animate-fade-in pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs shadow-2xl backdrop-blur-md animate-bounce-short">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1.5 border border-emerald-500/20">
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
            <span>Customer Billing & Financial Reconciliation</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Lịch Sử Giao Dịch & Đối Soát Hoàn Tiền
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tra cứu toàn bộ lịch sử thanh toán của khách hàng, giải quyết khiếu nại, chat trực tiếp và xác thực Rollback bằng khóa bảo mật Super Admin.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Xuất CSV</span>
          </button>

          <button
            onClick={fetchTransactions}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/30 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {/* Bộ Công Thương Compliance & Payment Gateway Kill Switch Panel */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition shadow-lg ${
          !gatewayStatus.enabled
            ? 'bg-gradient-to-r from-rose-950/40 via-amber-950/30 to-slate-900 border-rose-500/40 shadow-rose-950/20'
            : 'bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border-emerald-500/30 shadow-emerald-950/20'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-3 rounded-2xl border shrink-0 ${
                !gatewayStatus.enabled
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-400 animate-pulse'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              }`}
            >
              {!gatewayStatus.enabled ? (
                <ShieldOff className="w-6 h-6" />
              ) : (
                <Building2 className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                    !gatewayStatus.enabled
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {!gatewayStatus.enabled
                    ? '⛔ CỔNG GIAO DỊCH ĐANG TẮT (TẠM DỪNG NẠP TIỀN)'
                    : '✅ CỔNG GIAO DỊCH ĐANG BẬT (HOẠT ĐỘNG BÌNH THƯỜNG)'}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Tuân thủ Nghị định 52/2013/NĐ-CP (Bộ Công Thương)
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {!gatewayStatus.enabled
                  ? 'Đã ngắt toàn bộ tính năng thanh toán & nạp tiền trên Web / App học viên'
                  : 'Cổng thanh toán VietQR & PayOS đang mở, học viên có thể nâng cấp Pro/Plus'}
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-3xl">
                {!gatewayStatus.enabled ? (
                  <span className="italic text-rose-200">
                    &ldquo;{gatewayStatus.reason}&rdquo;
                  </span>
                ) : (
                  'Nếu bạn chưa hoàn tất thủ tục đăng ký / thông báo website thương mại điện tử với Bộ Công Thương, bạn có thể bấm nút Tắt Giao Dịch bên cạnh để tạm khóa tính năng nạp tiền tránh rủi ro pháp lý.'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
            {!gatewayStatus.enabled ? (
              <>
                <button
                  type="button"
                  onClick={() => setGatewayModalOpen(true)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Sửa Thông Báo</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleGateway(true)}
                  disabled={togglingGateway}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-lg shadow-emerald-950 transition flex items-center gap-1.5"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>Mở Lại Thanh Toán</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setGatewayModalOpen(true)}
                disabled={togglingGateway}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-lg shadow-rose-950 transition flex items-center gap-1.5"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Tắt Giao Dịch Nạp Tiền</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Gross Revenue */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Doanh Thu Thực Nhận
          </span>
          <div className="text-2xl font-black text-white mt-1 tabular-nums">
            {formatVND(summary.totalGrossRevenue)}
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
            <CheckCircle2 className="w-3 h-3" /> {summary.paidCount} đơn thành công
          </span>
        </div>

        {/* Refunded / Rollback */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-rose-500/20 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition" />
          <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
            Đã Rollback / Hoàn Trả
          </span>
          <div className="text-2xl font-black text-rose-300 mt-1 tabular-nums">
            {formatVND(summary.refundedAmount)}
          </div>
          <span className="text-[10px] text-rose-400 flex items-center gap-1 mt-1 font-medium">
            <RotateCcw className="w-3 h-3" /> {summary.refundedCount} giao dịch đã trả lại tiền
          </span>
        </div>

        {/* Disputed */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-amber-500/20 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition" />
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
            Khiếu Nại & Đối Soát
          </span>
          <div className="text-2xl font-black text-amber-300 mt-1 tabular-nums">
            {summary.disputedCount}
          </div>
          <span className="text-[10px] text-amber-400 flex items-center gap-1 mt-1 font-medium">
            <AlertTriangle className="w-3 h-3" /> Cần kiểm tra chuyển khoản
          </span>
        </div>

        {/* Pending Orders */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Đang Chờ Quét VietQR
          </span>
          <div className="text-2xl font-black text-indigo-300 mt-1 tabular-nums">
            {summary.pendingCount}
          </div>
          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3" /> Phiên QR 15 phút
          </span>
        </div>

        {/* Success Rate */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Tỷ Lệ Hoàn Tất
          </span>
          <div className="text-2xl font-black text-blue-300 mt-1 tabular-nums">
            {summary.totalOrders > 0
              ? ((summary.paidCount / summary.totalOrders) * 100).toFixed(1)
              : '100'}
            %
          </div>
          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
            Tổng {summary.totalOrders} đơn trong kỳ
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo mã đơn #, email, tên khách, mã GD ngân hàng..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'PAID', label: 'Thành công' },
            { id: 'REFUNDED', label: 'Đã Hoàn Tiền' },
            { id: 'DISPUTED', label: 'Khiếu Nại' },
            { id: 'PENDING', label: 'Chờ Quét QR' },
            { id: 'FAILED', label: 'Thất bại' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'today', label: 'Hôm nay' },
            { id: '7d', label: '7 ngày' },
            { id: '30d', label: '30 ngày' },
            { id: 'all', label: 'Tất cả' },
          ].map((range) => (
            <button
              key={range.id}
              onClick={() => {
                setDateRange(range.id);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                dateRange === range.id
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Transactions Table */}
      <div className="overflow-hidden rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md shadow-xl">
        <div className="overflow-x-auto custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full min-w-[880px] text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Mã GD / Ngày</th>
                <th className="py-3.5 px-4">Khách Hàng (Học Viên)</th>
                <th className="py-3.5 px-4">Gói Dịch Vụ</th>
                <th className="py-3.5 px-4 text-right">Số Tiền</th>
                <th className="py-3.5 px-4">Cổng TT / Mã Bank</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-800 rounded w-20 mb-1" />
                      <div className="h-3 bg-slate-800/60 rounded w-24" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-800 rounded w-32 mb-1" />
                      <div className="h-3 bg-slate-800/60 rounded w-40" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-5 bg-slate-800 rounded w-24" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="h-4 bg-slate-800 rounded w-24 ml-auto" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-800 rounded w-20" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-5 bg-slate-800 rounded w-20 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="h-7 bg-slate-800 rounded w-32 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <CreditCard className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-400">Không có giao dịch nào phù hợp</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Thử điều chỉnh lại từ khóa tìm kiếm hoặc bộ lọc trạng thái.
                    </p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isRefunded = tx.rollback?.isRefunded || tx.displayStatus === 'REFUNDED';
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-800/30 transition group"
                    >
                      {/* Order Code & Date */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => setDetailsOrder(tx)}
                          className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline tabular-nums flex items-center gap-1"
                        >
                          #{tx.orderCode}
                          <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                        </button>
                        <span className="text-[10px] text-slate-400 block tabular-nums">
                          {new Date(tx.createdAt).toLocaleDateString('vi-VN')} {new Date(tx.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-300 shrink-0 overflow-hidden">
                            {tx.user?.avatar ? (
                              <img src={tx.user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              (tx.user?.displayName || tx.user?.email || 'U')[0].toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-white block truncate max-w-[180px]">
                              {tx.user?.displayName || 'Học viên'}
                            </span>
                            <span className="text-[11px] text-slate-400 block truncate max-w-[200px]">
                              {tx.user?.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Plan / Tier */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-[11px]">
                          {tx.planName}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-white tabular-nums text-sm">
                          {formatVND(tx.amount)}
                        </span>
                        {isRefunded && (
                          <span className="block text-[10px] text-rose-400 font-semibold">
                            (Đã hoàn {formatVND(tx.rollback?.refundAmount || tx.amount)})
                          </span>
                        )}
                      </td>

                      {/* Gateway & Bank Code */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-300 font-medium block">
                          {tx.paymentMethod || 'VIETQR'}
                        </span>
                        {tx.transactionCode ? (
                          <code className="text-[10px] text-slate-400 font-mono bg-slate-950 px-1 py-0.5 rounded">
                            {tx.transactionCode}
                          </code>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Chưa đối soát</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {renderStatusBadge(tx)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* NÚT IB RIÊNG CHO KHÁCH (CHAT DIRECTLY) */}
                          <button
                            type="button"
                            onClick={() => handleOpenChat(tx)}
                            className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition shadow-sm"
                            title={`Nhắn tin riêng với ${tx.user?.displayName || 'khách hàng'}`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* NÚT ROLLBACK / HOÀN TIỀN (VỚI KEY BẢO MẬT) */}
                          <button
                            type="button"
                            onClick={() => setRollbackOrder(tx)}
                            className={`p-1.5 rounded-lg transition shadow-sm ${
                              isRefunded
                                ? 'bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white'
                                : 'bg-slate-800 hover:bg-rose-600/30 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40'
                            }`}
                            title={
                              isRefunded
                                ? 'Xem / Chỉnh sửa trạng thái đối soát hoàn tiền'
                                : 'Ủy quyền Rollback & Hoàn tiền (Yêu cầu Master Key)'
                            }
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          {/* NÚT XEM CHI TIẾT */}
                          <button
                            type="button"
                            onClick={() => setDetailsOrder(tx)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                            title="Xem hóa đơn chi tiết"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-4 py-3 border-t border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Hiển thị <span className="font-bold text-white">{transactions.length}</span> /{' '}
            <span className="font-bold text-white">{totalCount}</span> giao dịch
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition"
              title="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-semibold text-white px-2">
              Trang {page} / {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition"
              title="Trang kế tiếp"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Rollback Authorization Modal (Master Security Key Required) */}
      <RollbackModal
        isOpen={!!rollbackOrder}
        onClose={() => setRollbackOrder(null)}
        order={rollbackOrder}
        onSuccess={handleRollbackSuccess}
      />

      {/* Transaction Detailed Invoice Modal */}
      <TransactionDetailsModal
        isOpen={!!detailsOrder}
        onClose={() => setDetailsOrder(null)}
        order={detailsOrder}
        onOpenChat={(ord) => {
          setDetailsOrder(null);
          handleOpenChat(ord);
        }}
        onOpenRollback={(ord) => {
          setDetailsOrder(null);
          setRollbackOrder(ord);
        }}
      />

      {/* Modal Cấu Hình & Xác Nhận Bật/Tắt Cổng Thanh Toán */}
      {gatewayModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
            onClick={() => !togglingGateway && setGatewayModalOpen(false)}
          />
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-950/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Cấu Hình Tạm Dừng Giao Dịch (Bộ Công Thương)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Nghị định 52/2013/NĐ-CP về Thương mại điện tử
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGatewayModalOpen(false)}
                  disabled={togglingGateway}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs text-slate-300">
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-300">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Lý do pháp lý</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Theo quy định, website có chức năng thanh toán trực tuyến cần hoàn tất thủ tục đăng ký/thông báo với Bộ Công Thương. Khi tắt cổng giao dịch, hệ thống sẽ ẩn/chặn các nút nạp tiền và hiển thị thông báo tuân thủ quy định cho học viên.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Nội dung thông báo hiển thị cho học viên trên Web & App:
                  </label>
                  <textarea
                    rows={4}
                    value={gatewayReasonInput}
                    onChange={(e) => setGatewayReasonInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="Nhập thông báo tạm dừng..."
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Thông báo này sẽ xuất hiện ở trang Nâng cấp gói / Nạp tiền trên toàn bộ giao diện học viên.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-950/50">
                <button
                  type="button"
                  onClick={() => setGatewayModalOpen(false)}
                  disabled={togglingGateway}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Đóng
                </button>

                <div className="flex items-center gap-2">
                  {!gatewayStatus.enabled ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleToggleGateway(false)}
                        disabled={togglingGateway}
                        className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition"
                      >
                        Lưu Thông Báo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleGateway(true)}
                        disabled={togglingGateway}
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5"
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>Mở Lại Thanh Toán</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleGateway(false)}
                      disabled={togglingGateway}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition flex items-center gap-1.5"
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>Xác Nhận Tắt Nạp Tiền</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-in E2EE Realtime Chat Drawer to directly message the customer */}
      {user && (
        <ChatDrawer
          isOpen={isChatOpen}
          onClose={() => {
            setIsChatOpen(false);
            setChatTargetUser(null);
          }}
          currentUser={{
            id: user.id,
            displayName: user.displayName || 'Admin Support',
            avatar: user.avatar,
          }}
          initialTargetUser={chatTargetUser}
          initialContext={chatContext}
        />
      )}
    </div>
  );
};

export default AdminBillingPage;
