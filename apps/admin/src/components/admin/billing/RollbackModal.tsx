import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  RotateCcw,
  AlertTriangle,
  X,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  DollarSign,
  HelpCircle,
  FileText,
} from 'lucide-react';
import api from '../../../lib/api';

export interface RollbackOrderData {
  id: string;
  orderCode: number;
  amount: number;
  planName: string;
  tier: string;
  status: string;
  displayStatus?: string;
  paymentMethod: string;
  transactionCode?: string | null;
  paidAt?: string | null;
  createdAt: string;
  user: {
    id: string;
    displayName: string;
    email: string;
    avatar?: string;
    role: string;
  };
  rollback?: {
    isRefunded?: boolean;
    isDisputed?: boolean;
    refundedAt?: string;
    refundAmount?: number;
    refundTxCode?: string;
    reason?: string;
    refundedBy?: {
      email?: string;
      displayName?: string;
    };
  } | null;
}

interface RollbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: RollbackOrderData | null;
  onSuccess: (updatedOrder: any, message: string) => void;
}

export const RollbackModal: React.FC<RollbackModalProps> = ({
  isOpen,
  onClose,
  order,
  onSuccess,
}) => {
  if (!isOpen || !order) return null;

  const isAlreadyRefunded = order.rollback?.isRefunded || order.displayStatus === 'REFUNDED';

  const [action, setAction] = useState<'MARK_REFUNDED' | 'DISPUTED' | 'UNMARK_REFUNDED'>(
    isAlreadyRefunded ? 'UNMARK_REFUNDED' : 'MARK_REFUNDED',
  );
  const [securityKey, setSecurityKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [reason, setReason] = useState('');
  const [refundTxCode, setRefundTxCode] = useState('');
  const [refundAmount, setRefundAmount] = useState(order.amount);
  const [revertSubscription, setRevertSubscription] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!securityKey.trim()) {
      setErrorMessage('Vui lòng nhập Khóa Bảo Mật Rollback Tối Cao để xác thực ủy quyền!');
      return;
    }

    if (action === 'MARK_REFUNDED' && !reason.trim()) {
      setErrorMessage('Vui lòng nhập lý do hoàn tiền / nội dung khiếu nại của khách hàng.');
      return;
    }

    setLoading(true);
    try {
      const res: any = await api.post(`/admin/transactions/${order.id}/rollback`, {
        securityKey: securityKey.trim(),
        reason: reason.trim(),
        refundTxCode: refundTxCode.trim(),
        refundAmount: Number(refundAmount) || order.amount,
        revertSubscription,
        action,
      });

      if (res?.data?.success) {
        onSuccess(res.data.order, res.data.message || 'Thao tác hoàn tiền thành công!');
        onClose();
      } else {
        setErrorMessage(res?.data?.message || 'Có lỗi xảy ra khi xử lý rollback.');
      }
    } catch (err: any) {
      console.error('Rollback error:', err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể thực hiện rollback. Vui lòng kiểm tra lại Khóa Bảo Mật!';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={() => !loading && onClose()}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-xl">
          {/* Header banner */}
          <div className="bg-gradient-to-r from-rose-950/40 via-purple-950/40 to-slate-900 border-b border-rose-500/20 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] font-bold uppercase tracking-wider mb-0.5">
                    <KeyRound className="w-3 h-3" />
                    <span>Security-Restricted Operation</span>
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {action === 'MARK_REFUNDED'
                      ? 'Ủy Quyền Hoàn Tiền (Rollback Transaction)'
                      : action === 'DISPUTED'
                      ? 'Đánh Dấu Khiếu Nại & Đối Soát'
                      : 'Hủy Hoàn Tiền & Khôi Phục Đơn Hàng'}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Order snapshot banner */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-indigo-500 dark:text-indigo-400 text-sm">
                    #{order.orderCode}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                    {order.planName}
                  </span>
                </div>
                <span className="font-bold text-base text-slate-900 dark:text-white tabular-nums">
                  {formatVND(order.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700/50">
                <span className="truncate max-w-[240px]">
                  {order.user?.displayName} ({order.user?.email})
                </span>
                <span>Cổng: {order.paymentMethod || 'VIETQR'}</span>
              </div>
              {order.transactionCode && (
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span>Mã GD ngân hàng:</span>
                  <code className="text-slate-300 font-mono bg-slate-800 px-1 rounded">
                    {order.transactionCode}
                  </code>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 flex items-start gap-2.5 text-rose-300 text-xs animate-shake">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            {/* Action selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Chọn Thao Tác Đối Soát
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAction('MARK_REFUNDED')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition ${
                    action === 'MARK_REFUNDED'
                      ? 'border-rose-500 bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/50'
                      : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 font-bold">
                    <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                    <span>Đã Hoàn Tiền</span>
                  </div>
                  <span className="text-[11px] font-normal text-slate-400 block">
                    Xác nhận đã chuyển khoản trả lại tiền cho khách
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAction('DISPUTED')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition ${
                    action === 'DISPUTED'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/50'
                      : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 font-bold">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Khiếu Nại</span>
                  </div>
                  <span className="text-[11px] font-normal text-slate-400 block">
                    Đang đối soát & chưa chuyển khoản trả lại
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAction('UNMARK_REFUNDED')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition ${
                    action === 'UNMARK_REFUNDED'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/50'
                      : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Khôi Phục</span>
                  </div>
                  <span className="text-[11px] font-normal text-slate-400 block">
                    Khôi phục lại trạng thái PAID ban đầu
                  </span>
                </button>
              </div>
            </div>

            {action === 'MARK_REFUNDED' && (
              <>
                {/* Refund fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Số tiền đã chuyển hoàn trả (₫)
                    </label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                      placeholder="Nhập số tiền hoàn lại"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Mã GD chuyển tiền trả lại (App Bank)
                    </label>
                    <input
                      type="text"
                      value={refundTxCode}
                      onChange={(e) => setRefundTxCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 font-mono"
                      placeholder="VD: FT240918482 hoặc VCB-9948"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lý do hoàn tiền / Nội dung khiếu nại của khách <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    placeholder="VD: Học viên chuyển khoản nhầm 2 lần, hoặc khiếu nại không kích hoạt đúng hạn..."
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="revertSub"
                    checked={revertSubscription}
                    onChange={(e) => setRevertSubscription(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-rose-500 focus:ring-rose-500/40 w-4 h-4"
                  />
                  <label htmlFor="revertSub" className="text-xs text-slate-300 cursor-pointer">
                    Thu hồi quyền lợi gói PRO/PLUS và giáng cấp học viên về hạng Miễn Phí (Free)
                  </label>
                </div>
              </>
            )}

            {action === 'DISPUTED' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nội dung khiếu nại của khách hàng
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  placeholder="Ghi chú chi tiết khiếu nại để đối soát với cổng thanh toán..."
                />
              </div>
            )}

            {/* SUPER SECURE KEY INPUT */}
            <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Khóa Bảo Mật Rollback Tối Cao (Master Security Key) *</span>
                </label>
                <span className="text-[10px] text-slate-400">Yêu cầu quyền Super Admin</span>
              </div>

              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={securityKey}
                  onChange={(e) => setSecurityKey(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 text-xs font-mono rounded-xl bg-slate-900 border border-rose-500/40 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder:text-slate-600"
                  placeholder="••••••••••••••••••••"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                  title={showKey ? 'Ẩn khóa' : 'Hiện khóa'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Thao tác này sẽ cập nhật sổ cái tài chính và ghi log an ninh vĩnh viễn. Khóa bảo mật được đối soát trực tiếp trên server qua biến môi trường <code className="text-rose-300">ADMIN_ROLLBACK_SECRET_KEY</code>.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-lg shadow-rose-900/40 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang Xác Thực...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Xác Thực & Thực Hiện</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
