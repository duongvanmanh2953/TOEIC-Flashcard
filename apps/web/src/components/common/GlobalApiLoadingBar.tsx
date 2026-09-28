import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingEventDetail {
  isLoading: boolean;
  activeRequests: number;
  url?: string;
  method?: string;
}

export const GlobalApiLoadingBar: React.FC = () => {
  const [activeRequests, setActiveRequests] = useState(0);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const progressTimerRef = useRef<any>(null);
  const hideTimerRef = useRef<any>(null);

  useEffect(() => {
    const handleLoading = (e: any) => {
      const detail: LoadingEventDetail = e.detail || {};
      const count = Math.max(0, detail.activeRequests ?? 0);
      setActiveRequests(count);

      if (count > 0) {
        // Clear any pending hide timer
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }

        setVisible(true);

        // Animate progress up towards 85%
        if (!progressTimerRef.current) {
          setProgress((prev) => (prev === 0 ? 25 : prev));
          progressTimerRef.current = setInterval(() => {
            setProgress((prev) => {
              if (prev < 60) return prev + 15;
              if (prev < 80) return prev + 5;
              if (prev < 92) return prev + 2;
              return prev;
            });
          }, 200);
        }
      } else {
        // Complete progress to 100% and fade out
        if (progressTimerRef.current) {
          clearInterval(progressTimerRef.current);
          progressTimerRef.current = null;
        }

        setProgress(100);

        hideTimerRef.current = setTimeout(() => {
          setVisible(false);
          setProgress(0);
          hideTimerRef.current = null;
        }, 350);
      }
    };

    window.addEventListener('VOCABFLOW_API_LOADING', handleLoading);
    return () => {
      window.removeEventListener('VOCABFLOW_API_LOADING', handleLoading);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (!visible && activeRequests === 0 && progress === 0) return null;

  return (
    <>
      {/* Top Gradient Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <div
          className="h-1 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-200 ease-out shadow-[0_0_12px_rgba(99,102,241,0.8)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Floating Pill Status Badge (Top-Right under Navbar) */}
      {visible && activeRequests > 0 && (
        <div className="fixed top-3 right-4 z-[99999] pointer-events-none select-none animate-fade-in">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 dark:bg-slate-900/95 text-white border border-indigo-500/30 shadow-2xl backdrop-blur-md text-[11px] font-bold">
            <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
            <span className="tracking-wide">
              Đang tải dữ liệu {activeRequests > 1 ? `(${activeRequests})` : ''}...
            </span>
          </div>
        </div>
      )}
    </>
  );
};
