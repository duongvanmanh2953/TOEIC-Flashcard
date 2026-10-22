import React from 'react';
import {
  X,
  CreditCard,
  User,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  MessageSquare,
  ShieldAlert,
  Copy,
  ExternalLink,
  Printer,
  Sparkles,
} from 'lucide-react';
import { RollbackOrderData } from './RollbackModal';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: RollbackOrderData | null;
  onOpenChat: (order: RollbackOrderData) => void;
  onOpenRollback: (order: RollbackOrderData) => void;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  isOpen,
  onClose,
  order,
  onOpenChat,
  onOpenRollback,
}) => {
  if (!isOpen || !order) return null;

  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`Đã sao chép ${label}: ${text}`);
  };

  const isRefunded = order.rollback?.isRefunded || order.displayStatus === 'REFUNDED';
  const isDisputed = order.rollback?.isDisputed || order.displayStatus === 'DISPUTED';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
          {/* Header */}
          <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Hóa Đơn Giao Dịch #{order.orderCode}
                  </h3>
                  {isRefunded ? (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                      ĐÃ HOÀN TIỀN
                    </span>
                  ) : isDisputed ? (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      ĐANG KHIẾU NẠI
                    </span>
                  ) : order.status === 'PAID' ? (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      HOÀN TẤT (PAID)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-700 text-slate-300">
                      {order.status}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">ID: {order.id}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5 text-xs text-slate-300">
            {/* Customer Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  Thông Tin Học Viên
                </span>
                <button
                  type="button"
                  onClick={() => onOpenChat(order)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Nhắn Tin Riêng (IB Khách)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-400 block text-[11px]">Họ tên học viên</span>
                  <span className="font-semibold text-white text-sm">
                    {order.user?.displayName || 'Học viên LetStuN'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Email đăng ký</span>
                  <span className="font-semibold text-white">{order.user?.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Mã User (UUID)</span>
                  <div className="flex items-center gap-1 font-mono text-[11px] text-slate-300">
                    <span className="truncate">{order.user?.id}</span>
                    <button
                      onClick={() => copyToClipboard(order.user?.id, 'User ID')}
                      className="p-1 hover:text-white"
                      title="Sao chép"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Hạng tài khoản</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {order.user?.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                Chi Tiết Thanh Toán & Cổng PayOS
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-slate-400 block text-[11px]">Gói Dịch Vụ</span>
                  <span className="font-bold text-white text-sm">{order.planName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Số Tiền Thanh Toán</span>
                  <span className="font-bold text-emerald-400 text-base tabular-nums">
                    {formatVND(order.amount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Phương Thức</span>
                  <span className="font-semibold text-slate-200">{order.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Mã GD Ngân Hàng</span>
                  <span className="font-mono text-slate-200">
                    {order.transactionCode || 'N/A (Chờ đối soát)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Thời Gian Tạo</span>
                  <span className="text-slate-300">
                    {new Date(order.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Thời Gian Thanh Toán</span>
                  <span className="text-slate-300">
                    {order.paidAt ? new Date(order.paidAt).toLocaleString('vi-VN') : 'Chưa ghi nhận'}
                  </span>
                </div>
              </div>
            </div>

            {/* Rollback Details Banner (if applicable) */}
            {isRefunded && order.rollback && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2 text-rose-200">
                <div className="flex items-center gap-2 font-bold text-rose-300 text-xs">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Giao Dịch Đã Được Rollback / Hoàn Trả Tiền</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 text-[11px]">Số tiền hoàn trả:</span>{' '}
                    <span className="font-bold text-white">
                      {formatVND(order.rollback.refundAmount || order.amount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Mã GD hoàn tiền ngân hàng:</span>{' '}
                    <code className="text-white font-mono bg-rose-950/60 px-1.5 py-0.5 rounded">
                      {order.rollback.refundTxCode || 'MANUAL'}
                    </code>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Thời gian hoàn tiền:</span>{' '}
                    <span className="text-slate-200">
                      {order.rollback.refundedAt
                        ? new Date(order.rollback.refundedAt).toLocaleString('vi-VN')
                        : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Admin thực hiện:</span>{' '}
                    <span className="text-slate-200">
                      {order.rollback.refundedBy?.email || 'Super Admin'}
                    </span>
                  </div>
                </div>
                {order.rollback.reason && (
                  <div className="pt-1 text-xs border-t border-rose-500/20">
                    <span className="text-slate-400 text-[11px]">Lý do / Khiếu nại:</span>{' '}
                    <span className="italic text-slate-200">{order.rollback.reason}</span>
                  </div>
                )}
              </div>
            )}

            {isDisputed && order.rollback && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-amber-200">
                <div className="flex items-center gap-2 font-bold text-amber-300 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>Giao Dịch Đang Trong Trạng Thái Khiếu Nại</span>
                </div>
                <p className="text-xs text-amber-100 italic">
                  &ldquo;{order.rollback.reason || 'Khách hàng khiếu nại - Đang chờ xử lý đối soát'}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/50">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenChat(order)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Nhắn Tin Riêng Cho Khách</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenRollback(order)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                <span>{isRefunded ? 'Sửa Đối Soát' : 'Ủy Quyền Rollback / Hoàn Tiền'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
