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

    window.addEventListener('LETSTUN_API_LOADING', handleLoading);
    return () => {
      window.removeEventListener('LETSTUN_API_LOADING', handleLoading);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  return (
    <>
      {/* Subtle, Clean Page Loading Bar at top of viewport (Unobtrusive) */}
      <div
        className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <div
          className="h-0.5 bg-indigo-400/80 dark:bg-indigo-300/80 transition-all duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </>
  );
};
