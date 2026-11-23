import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, Cloud, Database, X } from 'lucide-react';
import { useNetworkStatus } from '../../lib/offlineSyncService';
import { ModalPortal } from '../common/ModalPortal';

interface DataSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataSyncModal: React.FC<DataSyncModalProps> = ({ isOpen, onClose }) => {
  const { isOnline, isSyncing, pendingCount, syncNow } = useNetworkStatus();
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    setSyncSuccessMessage(null);
    const result = await syncNow();
    if (result.synced > 0) {
      setSyncSuccessMessage(`Đã đồng bộ thành công ${result.synced} lượt học lên máy chủ.`);
    } else if (result.error) {
      setSyncSuccessMessage(`Đồng bộ thất bại: ${result.error}`);
    } else {
      setSyncSuccessMessage('Toàn bộ dữ liệu của bạn đã được cập nhật mới nhất.');
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-md animate-fade-in">
        <div
          className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center border shadow-xs ${
                  isOnline
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-500/30'
                }`}
              >
                {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  Đồng Bộ Dữ Liệu & Kết Nối
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isOnline ? 'Đang kết nối Internet' : 'Đang ở chế độ ngoại tuyến'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 space-y-4">
            {/* Status Card */}
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                isOnline
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-500/30 text-amber-800 dark:text-amber-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'
                  }`}
                />
                <span className="text-xs font-bold">
                  {isOnline ? 'Trực tuyến (Online)' : 'Ngoại tuyến (Offline)'}
                </span>
              </div>
              <span className="text-[11px] font-semibold opacity-80">
                {isOnline ? 'Đã sẵn sàng đồng bộ' : 'Dữ liệu lưu tạm trên máy'}
              </span>
            </div>

            {/* Pending Items Metric */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <Database className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Dữ liệu chờ gửi</span>
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {pendingCount}
                </div>
                <span className="text-[10px] text-slate-400">lượt ôn tập / thẻ từ</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Bộ nhớ đệm</span>
                </div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  IndexedDB
                </div>
                <span className="text-[10px] text-slate-400">Không lo mất tiến trình</span>
              </div>
            </div>

            {/* Message explanation */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {isOnline ? (
                pendingCount > 0 ? (
                  <p>
                    Bạn có <strong className="text-indigo-600 dark:text-indigo-400">{pendingCount}</strong> dữ liệu học tập đã lưu khi mất mạng. Hãy bấm <strong>Đồng bộ ngay</strong> để cập nhật điểm kinh nghiệm XP và tiến trình lên máy chủ.
                  </p>
                ) : (
                  <p className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Toàn bộ dữ liệu học tập và flashcard của bạn đã được đồng bộ với máy chủ!</span>
                  </p>
                )
              ) : (
                <p>
                  Thiết bị đang không có kết nối mạng. Bạn vẫn có thể tiếp tục học và ôn tập thẻ từ bình thường. Khi có mạng trở lại, hệ thống sẽ nhắc bạn đồng bộ.
                </p>
              )}
            </div>

            {/* Sync Feedback Alert */}
            {syncSuccessMessage && (
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>{syncSuccessMessage}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={!isOnline || isSyncing}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition flex items-center justify-center gap-2 shadow-xs active:scale-95 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
