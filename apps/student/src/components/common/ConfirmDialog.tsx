import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Info,
  Trash2,
  X,
} from 'lucide-react';
import { ModalPortal } from './ModalPortal';

export type DialogType = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmOptions {
  title?: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: DialogType;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface AlertOptions {
  title?: string;
  message: string | React.ReactNode;
  confirmText?: string;
  type?: DialogType;
  icon?: React.ComponentType<{ className?: string }>;
}

interface DialogState extends ConfirmOptions {
  isOpen: boolean;
  isAlertOnly?: boolean;
  resolve: (value: boolean) => void;
}

// Global Event Name
const CONFIRM_EVENT = 'VOCABFLOW_CONFIRM_DIALOG_REQUEST';

/**
 * Global standalone promise-based confirm dialog helper.
 * Can be called anywhere (inside or outside React components).
 *
 * Example:
 * const ok = await confirmModal('Bạn có chắc muốn xóa bộ đề này?');
 * const ok = await confirmModal({
 *   title: 'Xóa vĩnh viễn',
 *   message: 'Hành động này không thể hoàn tác.',
 *   type: 'danger',
 *   confirmText: 'Xóa ngay',
 * });
 */
export function confirmModal(optionsOrMessage: string | ConfirmOptions): Promise<boolean> {
  const options: ConfirmOptions =
    typeof optionsOrMessage === 'string'
      ? {
          message: optionsOrMessage,
          type:
            /xóa|delete|hủy|remove|thu hồi/i.test(optionsOrMessage)
              ? 'danger'
              : 'warning',
        }
      : optionsOrMessage;

  return new Promise<boolean>((resolve) => {
    window.dispatchEvent(
      new CustomEvent(CONFIRM_EVENT, {
        detail: {
          ...options,
          isAlertOnly: false,
          resolve,
        },
      }),
    );
  });
}

/**
 * Global standalone promise-based alert dialog helper.
 * Replaces ugly native window.alert with a premium glass modal.
 *
 * Example:
 * await alertModal('Đã sao chép liên kết thành công!');
 * await alertModal({
 *   title: 'Thành công',
 *   message: 'Dữ liệu đã được cập nhật.',
 *   type: 'success',
 * });
 */
export function alertModal(optionsOrMessage: string | AlertOptions): Promise<void> {
  const options: AlertOptions =
    typeof optionsOrMessage === 'string'
      ? {
          message: optionsOrMessage,
          type:
            /thành công|hoàn thành|chính xác|success/i.test(optionsOrMessage)
              ? 'success'
              : /lỗi|thất bại|không thể|error|fail/i.test(optionsOrMessage)
              ? 'danger'
              : 'info',
        }
      : optionsOrMessage;

  return new Promise<void>((resolve) => {
    window.dispatchEvent(
      new CustomEvent(CONFIRM_EVENT, {
        detail: {
          ...options,
          isAlertOnly: true,
          resolve: () => resolve(),
        },
      }),
    );
  });
}

// Global safety polyfill: Any direct call to window.alert will automatically use alertModal
if (typeof window !== 'undefined') {
  window.alert = (message?: any) => {
    alertModal(String(message ?? ''));
  };
}

/**
 * Global Mount Container for Confirm/Alert Dialog
 * Render this once in AppShell or App.tsx root.
 */
export const GlobalConfirmDialog: React.FC = () => {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleRequest = (e: any) => {
      const detail = e.detail;
      setDialog({
        isOpen: true,
        title: detail.title,
        message: detail.message,
        confirmText: detail.confirmText,
        cancelText: detail.cancelText,
        type: detail.type || 'warning',
        icon: detail.icon,
        isAlertOnly: Boolean(detail.isAlertOnly),
        resolve: detail.resolve,
      });
    };

    window.addEventListener(CONFIRM_EVENT, handleRequest);
    return () => window.removeEventListener(CONFIRM_EVENT, handleRequest);
  }, []);

  useEffect(() => {
    if (dialog?.isOpen) {
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 50);
    }
  }, [dialog?.isOpen]);

  if (!dialog || !dialog.isOpen) return null;

  const handleConfirm = () => {
    const res = dialog.resolve;
    setDialog(null);
    res(true);
  };

  const handleCancel = () => {
    const res = dialog.resolve;
    setDialog(null);
    res(false);
  };

  const type = dialog.type || 'warning';

  // Aesthetic theme tokens per type
  const theme = {
    danger: {
      bgGlow: 'bg-rose-500/10 border-rose-500/25 text-rose-500 shadow-rose-500/10',
      badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      btnConfirm: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 shadow-lg',
      defaultTitle: 'Xác nhận xóa dữ liệu',
      defaultConfirm: 'Xác nhận xóa',
      DefaultIcon: Trash2,
    },
    warning: {
      bgGlow: 'bg-amber-500/10 border-amber-500/25 text-amber-500 shadow-amber-500/10',
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      btnConfirm: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30 shadow-lg',
      defaultTitle: 'Cảnh báo',
      defaultConfirm: 'Tiếp tục',
      DefaultIcon: AlertTriangle,
    },
    info: {
      bgGlow: 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400 shadow-indigo-500/10',
      badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      btnConfirm: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 shadow-lg',
      defaultTitle: 'Thông báo',
      defaultConfirm: 'Đồng ý',
      DefaultIcon: Info,
    },
    success: {
      bgGlow: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 shadow-emerald-500/10',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      btnConfirm: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 shadow-lg',
      defaultTitle: 'Thành công',
      defaultConfirm: 'Tuyệt vời',
      DefaultIcon: CheckCircle2,
    },
  }[type];

  const IconComponent = dialog.icon || theme.DefaultIcon;
  const title = dialog.title || theme.defaultTitle;
  const confirmText = dialog.confirmText || (dialog.isAlertOnly ? 'Đã hiểu' : theme.defaultConfirm);
  const cancelText = dialog.cancelText || 'Hủy bỏ';

  return (
    <ModalPortal isOpen={dialog.isOpen} onClose={handleCancel}>
      <div
        className="w-full max-w-md rounded-3xl bg-slate-900/95 dark:bg-slate-900/98 backdrop-blur-2xl border border-slate-700/80 shadow-2xl p-6 sm:p-7 space-y-6 text-white animate-scale-up select-none overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        {/* Subtle decorative glow in top-right */}
        <div
          className={`absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-20 ${
            type === 'danger'
              ? 'bg-rose-500'
              : type === 'warning'
              ? 'bg-amber-500'
              : type === 'success'
              ? 'bg-emerald-500'
              : 'bg-indigo-500'
          }`}
        />

        {/* Top Header: Icon badge & Close button */}
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${theme.bgGlow}`}
            >
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                {title}
              </h3>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                VocabFlow System
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message content */}
        <div className="relative z-10 text-xs sm:text-sm text-slate-300 leading-relaxed font-normal whitespace-pre-line max-h-[60vh] overflow-y-auto pr-1">
          {dialog.message}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800/80 relative z-10">
          {!dialog.isAlertOnly && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition border border-slate-700/60 cursor-pointer"
            >
              {cancelText}
            </button>
          )}

          <button
            ref={confirmButtonRef}
            type="button"
            onClick={handleConfirm}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${theme.btnConfirm}`}
          >
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </ModalPortal>
  );
};
