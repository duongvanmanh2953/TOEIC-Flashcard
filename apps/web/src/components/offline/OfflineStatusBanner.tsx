import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, CloudCheck, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from '../../lib/offlineSyncService';

export const OfflineStatusBanner: React.FC = () => {
  const { isOnline, isSyncing, pendingCount, syncNow } = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowReconnected(false);
    } else if (wasOffline) {
      // Transition from offline to online
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // If online and not recently reconnected, don't show anything
  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[99999] px-3 max-w-[94vw] sm:max-w-md w-full pointer-events-none select-none animate-fadeIn">
      {/* Offline State Banner */}
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-auto mx-auto w-full flex items-center justify-between gap-2.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-slate-900/90 dark:bg-slate-950/95 text-slate-100 border border-amber-500/40 shadow-xl backdrop-blur-xl transition-all duration-300"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-[11px] sm:text-xs font-medium text-slate-200 truncate">
              <span className="font-bold text-amber-300">Chế độ ngoại tuyến:</span>{' '}
              <span className="hidden sm:inline">Tiến trình học được lưu trên máy & tự đồng bộ khi có mạng.</span>
              <span className="sm:hidden">Tiến trình tự lưu vào máy.</span>
            </div>
          </div>

          {pendingCount > 0 && (
            <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
              {pendingCount} từ chờ đồng bộ
            </span>
          )}
        </div>
      )}

      {/* Reconnected State Banner */}
      {isOnline && showReconnected && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-auto mx-auto w-full flex items-center justify-between gap-2.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-slate-900/90 dark:bg-slate-950/95 text-slate-100 border border-emerald-500/40 shadow-xl backdrop-blur-xl transition-all duration-300 animate-slideDown"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-[11px] sm:text-xs font-medium text-emerald-200 truncate">
              <span className="font-bold text-emerald-300">Đã kết nối lại Internet:</span>{' '}
              {isSyncing ? 'Đang đồng bộ dữ liệu...' : 'Dữ liệu học tập đã sẵn sàng đồng bộ.'}
            </div>
          </div>

          {pendingCount > 0 && (
            <button
              onClick={() => syncNow()}
              disabled={isSyncing}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold border border-emerald-500/40 cursor-pointer active:scale-95 transition-all"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Đang đồng bộ' : 'Đồng bộ ngay'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

