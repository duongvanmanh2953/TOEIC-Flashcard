import React, { useState, useEffect } from 'react';
import { Wifi, RefreshCw, X, CheckCircle2 } from 'lucide-react';
import { useNetworkStatus } from '../../lib/offlineSyncService';

export const OfflineStatusBanner: React.FC = () => {
  const { isOnline, isSyncing, pendingCount, syncNow } = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowReconnected(false);
      setJustSynced(false);
    } else if (wasOffline) {
      // Transition from offline to online: only prompt if there's pending work to sync
      if (pendingCount > 0) {
        setShowReconnected(true);
        const timer = setTimeout(() => {
          setShowReconnected(false);
          setWasOffline(false);
        }, 10000);
        return () => clearTimeout(timer);
      } else {
        setWasOffline(false);
      }
    }
  }, [isOnline, wasOffline, pendingCount]);

  // When offline, the header WiFi icon serves as the persistent status indicator.
  // We do NOT show a floating top banner that blocks the camera hole or screen content.
  if (!showReconnected || !isOnline) {
    return null;
  }

  const handleSync = async () => {
    try {
      await syncNow();
      setJustSynced(true);
      setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
        setJustSynced(false);
      }, 2500);
    } catch {
      setShowReconnected(false);
    }
  };

  return (
    <aside
      aria-label="Thông báo đồng bộ dữ liệu ngoại tuyến"
      className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+4.75rem)] sm:bottom-6 sm:right-6 left-3 right-3 sm:left-auto sm:max-w-md z-[99999] pointer-events-none select-none animate-fadeIn"
    >
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto mx-auto w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 dark:bg-slate-950/95 text-slate-100 border border-emerald-500/50 shadow-2xl backdrop-blur-xl transition-all duration-300"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          {justSynced ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <div className="text-[11px] sm:text-xs font-medium text-emerald-200 truncate">
            {justSynced ? (
              <span className="font-bold text-emerald-300">Đã đồng bộ xong dữ liệu học tập!</span>
            ) : (
              <>
                <span className="font-bold text-emerald-300">Đã có mạng trở lại:</span>{' '}
                <span className="text-slate-200">
                  {pendingCount > 0 ? `${pendingCount} mục chờ đồng bộ` : 'Sẵn sàng học tập'}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!justSynced && pendingCount > 0 && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold shadow-xs cursor-pointer active:scale-95 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Đang đồng bộ' : 'Đồng bộ ngay'}</span>
            </button>
          )}
          <button
            onClick={() => {
              setShowReconnected(false);
              setWasOffline(false);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Đóng thông báo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
