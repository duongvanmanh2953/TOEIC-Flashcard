import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingEventDetail {
  isLoading: boolean;
  activeRequests: number;
  activeMutations?: number;
  isMutationActive?: boolean;
  url?: string;
  method?: string;
}

export const GlobalApiLoadingBar: React.FC = () => {
  const [activeRequests, setActiveRequests] = useState(0);
  const [isMutationActive, setIsMutationActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const progressTimerRef = useRef<any>(null);
  const hideTimerRef = useRef<any>(null);

  useEffect(() => {
    const handleLoading = (e: any) => {
      const detail: LoadingEventDetail = e.detail || {};
      const count = Math.max(0, detail.activeRequests ?? 0);
      setActiveRequests(count);
      setIsMutationActive(Boolean(detail.isMutationActive));

      if (count > 0) {
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }

        setVisible(true);

        if (!progressTimerRef.current) {
          setProgress((prev) => (prev === 0 ? 20 : prev));
          progressTimerRef.current = setInterval(() => {
            setProgress((prev) => {
              if (prev < 60) return prev + 12;
              if (prev < 80) return prev + 4;
              if (prev < 90) return prev + 1;
              return prev;
            });
          }, 200);
        }
      } else {
        if (progressTimerRef.current) {
          clearInterval(progressTimerRef.current);
          progressTimerRef.current = null;
        }

        setProgress(100);

        hideTimerRef.current = setTimeout(() => {
          setVisible(false);
          setProgress(0);
          setIsMutationActive(false);
          hideTimerRef.current = null;
        }, 300);
      }
    };

    window.addEventListener('VOCABFLOW_API_LOADING', handleLoading);
    return () => {
      window.removeEventListener('VOCABFLOW_API_LOADING', handleLoading);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  return (
    <>
      {/* 1. Subtle, Clean Solid Page Loading Bar (No gradient, lighter color as requested) */}
      <div
        className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <div
          className="h-0.5 bg-indigo-400/80 dark:bg-indigo-300/80 transition-all duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 2. Full API Mutation Loading Overlay (Requested by user: "loading api cần 1 overlay có loading") */}
      {isMutationActive && (
        <div className="fixed inset-0 z-[99998] bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-fade-in pointer-events-auto select-none">
          <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-3xl bg-slate-900/95 border border-slate-700/80 shadow-2xl text-white max-w-xs w-full text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            </div>
            <div className="space-y-1">
              <h5 className="text-sm font-bold text-white tracking-wide">
                Đang xử lý dữ liệu...
              </h5>
              <p className="text-[11px] text-slate-400 leading-normal">
                Hệ thống đang thực thi và đồng bộ máy chủ, vui lòng đợi trong giây lát.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
