import React, { useState, useEffect } from 'react';
import { VocabFlowLogo } from './VocabFlowLogo';

export interface AppSplashScreenProps {
  title?: string;
  tagline?: string;
  durationMs?: number; // 1000ms default
  theme?: 'dark' | 'kid' | 'light';
  logoSrc?: string;
  onFinish?: () => void;
  className?: string;
}

export const AppSplashScreen: React.FC<AppSplashScreenProps> = ({
  title = 'VocabFlow AI',
  tagline = 'Học từ vựng thông minh cùng Spaced Repetition',
  durationMs = 1000,
  theme = 'dark',
  logoSrc,
  onFinish,
  className = '',
}) => {
  const [isFading, setIsFading] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const progressTimer = setTimeout(() => {
      setProgress(100);
    }, durationMs * 0.6);

    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, durationMs);

    const unmountTimer = setTimeout(() => {
      setIsMounted(false);
      if (onFinish) onFinish();
    }, durationMs + 320);

    return () => {
      clearTimeout(progressTimer);
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, [durationMs, onFinish]);

  if (!isMounted) return null;

  const isKidTheme = theme === 'kid';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Đang khởi động ứng dụng VocabFlow"
      className={`fixed inset-0 z-[9999999] flex flex-col items-center justify-center p-6 select-none transition-opacity duration-300 ${
        isKidTheme
          ? 'bg-gradient-to-b from-[#FFFDF7] via-[#FFF9EB] to-[#FFF3D6] text-slate-800'
          : 'bg-slate-950 text-slate-100'
      } ${isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'} ${className}`}
    >
      {/* Ambient background glow */}
      <div
        className={`absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl pointer-events-none animate-pulse ${
          isKidTheme
            ? 'bg-gradient-to-tr from-amber-400/25 via-sky-300/20 to-emerald-400/20'
            : 'bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-sky-500/20'
        }`}
      />

      <div className="relative z-10 flex flex-col items-center text-center space-y-5 max-w-xs animate-scale-in">
        {/* Logo Container */}
        <div className="relative flex items-center justify-center">
          <div
            className={`absolute inset-0 rounded-3xl blur-xl animate-pulse ${
              isKidTheme ? 'bg-amber-400/30' : 'bg-indigo-500/20'
            }`}
          />
          <div
            className={`relative p-3.5 rounded-3xl shadow-2xl backdrop-blur-xl ${
              isKidTheme
                ? 'bg-white/90 border border-amber-200/90 shadow-amber-900/10'
                : 'bg-slate-900/80 border border-slate-800/80 shadow-slate-950/50'
            }`}
          >
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={title}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-md"
              />
            ) : (
              <VocabFlowLogo
                size="lg"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-md"
              />
            )}
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-1.5">
          <h1
            className={`text-2xl sm:text-3xl font-black tracking-tight ${
              isKidTheme
                ? 'text-[#17345B]'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200'
            }`}
          >
            {title}
          </h1>
          <p
            className={`text-xs sm:text-sm font-semibold leading-snug ${
              isKidTheme ? 'text-[#64748B]' : 'text-slate-400'
            }`}
          >
            {tagline}
          </p>
        </div>

        {/* Smooth Loading Bar */}
        <div
          className={`w-44 sm:w-52 h-1.5 rounded-full overflow-hidden p-0 ${
            isKidTheme ? 'bg-amber-200/60' : 'bg-slate-800/80'
          }`}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isKidTheme
                ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-sky-400'
                : 'bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

