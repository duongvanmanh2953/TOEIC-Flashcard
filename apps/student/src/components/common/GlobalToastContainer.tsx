import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertOctagon, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

const TOAST_EVENT = 'LETSTUN_TOAST';

/**
 * Global function to show a toast anywhere in the application.
 */
export function showToast(options: {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, {
      detail: {
        id: 'toast_' + Math.random().toString(36).substring(2, 9),
        type: options.type || 'info',
        title: options.title,
        message: options.message,
        duration: options.duration || 4500,
      },
    }),
  );
}

export function showSuccessToast(message: string, title: string = 'Thao tác thành công') {
  showToast({ type: 'success', title, message });
}

export function showErrorToast(message: string, title: string = 'Có lỗi xảy ra') {
  showToast({ type: 'error', title, message });
}

export const GlobalToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleToast = (e: any) => {
      const detail: ToastItem = e.detail;
      if (!detail || !detail.message) return;

      const toastId = detail.id || 'toast_' + Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = {
        ...detail,
        id: toastId,
        duration: detail.duration || 4500,
      };

      setToasts((prev) => [...prev.slice(-4), newToast]); // Keep at most 5 toasts visible

      // Auto dismiss
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, newToast.duration);
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, []);

  const handleDismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[999999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto rounded-2xl p-4 shadow-2xl backdrop-blur-xl border transition-all duration-300 animate-scale-in flex items-start gap-3 text-slate-100 ${
              isSuccess
                ? 'bg-slate-900/95 border-emerald-500/40 shadow-emerald-950/40'
                : isError
                ? 'bg-slate-900/95 border-rose-500/40 shadow-rose-950/40'
                : isWarning
                ? 'bg-slate-900/95 border-amber-500/40 shadow-amber-950/40'
                : 'bg-slate-900/95 border-indigo-500/40 shadow-indigo-950/40'
            }`}
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {isSuccess && (
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
              {isError && (
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <AlertOctagon className="w-4 h-4" />
                </div>
              )}
              {isWarning && (
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              )}
              {!isSuccess && !isError && !isWarning && (
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Info className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-1">
              {toast.title && (
                <h5
                  className={`text-xs font-bold leading-snug ${
                    isSuccess
                      ? 'text-emerald-300'
                      : isError
                      ? 'text-rose-300'
                      : isWarning
                      ? 'text-amber-300'
                      : 'text-indigo-300'
                  }`}
                >
                  {toast.title}
                </h5>
              )}
              <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5 whitespace-pre-line font-medium break-words">
                {toast.message}
              </p>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={() => handleDismiss(toast.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition shrink-0"
              aria-label="Đóng thông báo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
