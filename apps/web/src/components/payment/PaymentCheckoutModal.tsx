import React, { useState, useEffect, useRef } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { ModalPortal } from '../common/ModalPortal';
import {
  X,
  QrCode,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Building2,
  MessageSquare,
} from 'lucide-react';

interface PaymentOrderData {
  id: string;
  orderCode: number;
  tier: 'PLUS' | 'PRO';
  planName: string;
  amount: number;
  paymentMethod: 'VIETQR' | 'PAYOS';
  description: string;
  transferContent: string;
  bankId: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  qrUrl: string;
  checkoutUrl?: string | null;
  expiresAt: string;
  isPayOSConfigured?: boolean;
}

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: 'PLUS' | 'PRO';
  onSuccess?: () => void;
}

export const PaymentCheckoutModal: React.FC<PaymentCheckoutModalProps> = ({
  isOpen,
  onClose,
  tier,
  onSuccess,
}) => {
  const { refreshProfile } = useAuth();
  const [method, setMethod] = useState<'VIETQR' | 'PAYOS'>('VIETQR');
  const [order, setOrder] = useState<PaymentOrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'PENDING' | 'PAID' | 'EXPIRED'>('PENDING');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60);
  const [simulating, setSimulating] = useState(false);

  const pollTimerRef = useRef<any>(null);
  const countdownTimerRef = useRef<any>(null);

  // Khởi tạo đơn hàng khi mở modal hoặc đổi tier/method
  useEffect(() => {
    if (isOpen) {
      createOrder(method);
    } else {
      cleanup();
    }
    return () => cleanup();
  }, [isOpen, tier, method]);

  const cleanup = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setOrder(null);
    setStatus('PENDING');
    setError(null);
  };

  const createOrder = async (selectedMethod: 'VIETQR' | 'PAYOS') => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.post('/subscriptions/create-payment', {
        tier,
        paymentMethod: selectedMethod,
      });

      // Hỗ trợ cả 2 định dạng response: trực tiếp hoặc bọc qua interceptor data wrapper
      const payload = res?.data || res;
      const orderData: PaymentOrderData = payload?.order || payload;

      if (orderData && (orderData.qrUrl || orderData.orderCode)) {
        setOrder(orderData);
        setStatus('PENDING');

        // Tính toán thời gian đếm ngược
        const expiresAt = orderData.expiresAt ? new Date(orderData.expiresAt).getTime() : Date.now() + 15 * 60 * 1000;
        const diffSecs = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        setTimeLeft(diffSecs > 0 ? diffSecs : 15 * 60);

        startCountdown();
        startPolling(orderData.orderCode);
      } else {
        setError('Không thể tạo mã thanh toán. Vui lòng thử lại.');
      }
    } catch (err: any) {
      console.error('Create payment failed', err);
      setError(err?.message || 'Có lỗi xảy ra khi tạo giao dịch thanh toán.');
    } finally {
      setLoading(false);
    }
  };

  // Đếm ngược thời gian hết hạn đơn
  const startCountdown = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          setStatus('EXPIRED');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Polling kiểm tra trạng thái thanh toán từ backend mỗi 2.5s
  const startPolling = (orderCode: number) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(async () => {
      try {
        const res: any = await api.get(`/subscriptions/payments/${orderCode}/status`);
        const statusData = res?.data || res;
        const currentStatus = statusData?.status;

        if (currentStatus === 'PAID') {
          setStatus('PAID');
          clearInterval(pollTimerRef.current);
          clearInterval(countdownTimerRef.current);
          await refreshProfile();
          if (onSuccess) onSuccess();
        } else if (currentStatus === 'EXPIRED') {
          setStatus('EXPIRED');
          clearInterval(pollTimerRef.current);
          clearInterval(countdownTimerRef.current);
        }
      } catch (err) {
        // Tiếp tục poll trừ khi lỗi nghiêm trọng
      }
    }, 2500);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Nút mô phỏng thanh toán nhanh cho môi trường Test / Sandbox
  const handleSimulatePayment = async () => {
    if (!order) return;
    setSimulating(true);
    try {
      const res: any = await api.post('/subscriptions/simulate-payment', {
        orderCode: order.orderCode,
      });
      const data = res?.data || res;
      if (data?.success || res?.success) {
        setStatus('PAID');
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        await refreshProfile();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      alert(err?.message || 'Lỗi mô phỏng thanh toán');
    } finally {
      setSimulating(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden card-brand-effect my-auto" onClick={(e) => e.stopPropagation()}>
        {/* Top Header Bar (Cố định ở đỉnh, thoáng đãng) */}
        <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/90 bg-slate-50/70 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-600/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center font-black shadow-xs">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
                Nâng Cấp Gói {tier === 'PRO' ? 'VocabFlow Pro' : 'VocabFlow Plus'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Thanh toán an toàn • Quét mã QR tự động kích hoạt tài khoản 24/7
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Cuộn mượt bên trong 90vh, bố cục thoáng đãng không bị dài hẹp) */}
        <div className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-7 space-y-6">
          {/* Trạng thái thành công */}
          {status === 'PAID' ? (
            <div className="py-10 text-center space-y-6 animate-scale-up max-w-lg mx-auto">
              <div className="w-24 h-24 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center ring-8 ring-emerald-500/20">
                <CheckCircle2 className="w-14 h-14" />
              </div>
              <div className="space-y-2">
                <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
                  Giao Dịch Thành Công
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  Tài Khoản Đã Được Kích Hoạt!
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                  Chúc mừng bạn đã sở hữu gói <strong>{order?.planName}</strong> với 30 ngày trải nghiệm toàn diện và đầy đủ quyền hạn AI không giới hạn.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-left text-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Mã đơn hàng:</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">VF{order?.orderCode}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Gói tài khoản:</span>
                  <span className="font-extrabold text-brand-600 dark:text-brand-400">{order?.planName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Thời hạn:</span>
                  <span className="font-semibold text-emerald-600">30 ngày (Gia hạn sau 1 tháng)</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-brand-500/25 transition flex items-center justify-center gap-2.5"
              >
                <Sparkles className="w-5 h-5" />
                <span>Bắt Đầu Trải Nghiệm Ngay</span>
              </button>
            </div>
          ) : (
            <>
              {/* Payment Method Tabs (Rộng rãi, phím bấm rõ ràng) */}
              <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setMethod('VIETQR')}
                  className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-2 ${method === 'VIETQR'
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>VietQR Ngân Hàng 24/7</span>
                  <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-black uppercase tracking-wider">
                    Khuyên dùng
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('PAYOS')}
                  className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-2 ${method === 'PAYOS'
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>Cổng Webhook PayOS</span>
                </button>
              </div>

              {loading ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-12 h-12 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-slate-500 font-semibold">Đang khởi tạo mã QR thanh toán bảo mật...</p>
                </div>
              ) : error ? (
                <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm font-bold text-center space-y-3">
                  <p>{error}</p>
                  <button
                    onClick={() => createOrder(method)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs inline-flex items-center gap-2 transition"
                  >
                    <RefreshCw className="w-4 h-4" /> Thử lại
                  </button>
                </div>
              ) : (
                order && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    {/* Cột QR Code (Trái: lg:col-span-5) */}
                    <div className="lg:col-span-5 flex flex-col items-center justify-between p-6 rounded-3xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 backdrop-blur-md space-y-5">
                      <div className="relative p-3.5 bg-white rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
                        <img
                          src={order.qrUrl}
                          alt="Mã VietQR thanh toán"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.dataset.fallback) {
                              target.dataset.fallback = 'true';
                              target.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                                `https://vietqr.me/${order.bankId}/${order.accountNo}/${order.amount}?memo=${encodeURIComponent(
                                  order.transferContent || `VF ${order.orderCode}`
                                )}`
                              )}`;
                            }
                          }}
                          className="w-52 h-52 sm:w-56 sm:h-56 object-contain rounded-xl"
                        />
                        {/* Live status badge on QR */}
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-lg whitespace-nowrap">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                          <span>Quét trên mọi App Banking</span>
                        </div>
                      </div>

                      {/* Các action và thời gian của QR */}
                      <div className="w-full flex flex-col items-center gap-3 pt-2">
                        {/* Link mở ảnh trực tiếp */}
                        <a
                          href={order.qrUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                        >
                          <span>Mở ảnh QR kích thước lớn</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        {/* Đồng hồ đếm ngược */}
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                          <Clock className="w-4 h-4 text-amber-500" />
                          <span>Hết hạn trong:</span>
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                            {formatTimer(timeLeft)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Cột Chi Tiết Chuyển Khoản (Phải: lg:col-span-7, rộng rãi, các action thưa gọn) */}
                    <div className="lg:col-span-7 flex flex-col justify-between space-y-3.5">
                      {/* Ngân hàng thụ hưởng với nhận diện thương hiệu Vietcombank */}
                      <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-emerald-500/25 dark:border-emerald-500/30 backdrop-blur-md flex items-center justify-between gap-4 shadow-xs">
                        <div className="flex items-center gap-3">
                          {/* Vietcombank Official Logo Asset */}
                          <div className="h-11 px-2.5 py-1 rounded-xl bg-white dark:bg-white border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden relative shadow-xs">
                            {order.bankId === 'VCB' ? (
                              <img
                                src="/vietcombank-logo.png"
                                alt="Vietcombank Logo"
                                className="h-7 w-auto object-contain"
                              />
                            ) : (
                              <Building2 className="w-5 h-5 text-brand-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                                Ngân hàng thụ hưởng
                              </span>
                              {order.bankId === 'VCB' && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                  Chính thức
                                </span>
                              )}
                            </div>
                            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                              {order.bankName}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Số tài khoản */}
                      <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-md flex items-center justify-between gap-4 shadow-xs">
                        <div>
                          <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
                            Số tài khoản
                          </span>
                          <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white tracking-wider">
                            {order.accountNo}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(order.accountNo, 'acc')}
                          className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-brand-600 hover:text-white text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition shadow-xs hover:shadow-md active:scale-95"
                        >
                          {copiedField === 'acc' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          <span>{copiedField === 'acc' ? 'Đã chép' : 'Sao chép'}</span>
                        </button>
                      </div>

                      {/* Chủ tài khoản */}
                      <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-md flex items-center justify-between gap-4 shadow-xs">
                        <div>
                          <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
                            Chủ tài khoản
                          </span>
                          <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wide">
                            {order.accountName}
                          </span>
                        </div>
                      </div>

                      {/* Số tiền thanh toán */}
                      <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-md flex items-center justify-between gap-4 shadow-xs">
                        <div>
                          <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
                            Số tiền thanh toán
                          </span>
                          <span className="text-lg sm:text-xl font-black text-brand-600 dark:text-brand-400">
                            {formatCurrency(order.amount)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(String(order.amount), 'amount')}
                          className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-brand-600 hover:text-white text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition shadow-xs hover:shadow-md active:scale-95"
                        >
                          {copiedField === 'amount' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          <span>{copiedField === 'amount' ? 'Đã chép' : 'Sao chép'}</span>
                        </button>
                      </div>

                      {/* NỘI DUNG CHUYỂN KHOẢN (RẤT QUAN TRỌNG - Nổi bật & thưa thoáng) */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/10 border-2 border-amber-500/50 flex items-center justify-between gap-4 shadow-sm">
                        <div className="space-y-1">
                          <span className="text-xs uppercase font-black text-amber-700 dark:text-amber-400 flex items-center gap-1.5 tracking-wide">
                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                            <span>Nội dung chuyển khoản (Bắt buộc giữ nguyên)</span>
                          </span>
                          <span className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white tracking-widest block">
                            {order.transferContent}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(order.transferContent, 'content')}
                          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 transition shadow-md shrink-0"
                        >
                          {copiedField === 'content' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span>{copiedField === 'content' ? 'Đã chép' : 'Sao chép'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* Ticker trạng thái lắng nghe Webhook & Sandbox */}
              <div className="p-4 sm:p-5 rounded-2xl bg-indigo-500/10 dark:bg-indigo-950/30 border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-2.5 text-indigo-700 dark:text-indigo-300 font-semibold">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                  </span>
                  <span>Hệ thống đang tự động lắng nghe Webhook ngân hàng 24/7...</span>
                </div>

                {/* Sandbox Mock Button */}
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={simulating || !order}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-2 transition shadow-sm hover:scale-105 active:scale-95 shrink-0"
                  title="Bấm để kích hoạt nhanh mà không cần chuyển khoản thực tế (dành cho kiểm thử)"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{simulating ? 'Đang kích hoạt...' : 'Mô phỏng Sandbox'}</span>
                </button>
              </div>

              {/* PayOS link nếu có checkoutUrl */}
              {order?.checkoutUrl && (
                <div className="text-center pt-1">
                  <a
                    href={order.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-extrabold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    <span>Mở trang thanh toán PayOS Checkout trực tiếp</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info (Cố định ở đáy, tích hợp hỗ trợ khách hàng nhanh) */}
        <div className="shrink-0 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Xác thực mã hóa an toàn • Chuẩn NAPAS / VietQR</span>
            </div>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200 hover:text-[#1877F2] dark:hover:text-[#3891ff] font-bold transition"
            >
              <img
                src="/facebook-logo.png"
                alt="Facebook Logo"
                className="w-4 h-4 object-contain rounded-full"
              />
              <span>Cần trợ giúp thanh toán? Chat qua Facebook</span>
            </a>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-extrabold text-slate-500 hover:text-slate-900 dark:hover:text-white transition px-3 py-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </ModalPortal>
  );
};
