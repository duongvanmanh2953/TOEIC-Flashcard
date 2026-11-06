import React, { useEffect, useState } from 'react';
import { VocabFlowLogo } from '@vocabflow/shared';

interface LandingLoadingScreenProps {
  /**
   * Minimum duration in ms to display splash screen
   */
  minDuration?: number;
}

export const LandingLoadingScreen: React.FC<LandingLoadingScreenProps> = ({ minDuration = 800 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      const removeTimer = setTimeout(() => {
        setIsVisible(false);
      }, 500); // 500ms fade transition
      return () => clearTimeout(removeTimer);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#060813] transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="Đang tải VocabFlow..."
    >
      {/* Background Ambient Glow */}
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-indigo-600/20 via-cyan-500/15 to-emerald-500/15 blur-3xl pointer-events-none animate-pulse" />

      {/* Main Center Stage */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 space-y-5">
        {/* Glowing Logo Container */}
        <div className="relative">
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 opacity-30 blur-lg animate-pulse" />
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-900/90 border border-white/20 shadow-2xl flex items-center justify-center p-3 backdrop-blur-xl">
            <VocabFlowLogo size="lg" showContainer={false} className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent tracking-tight">
            VocabFlow
          </h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Smart Learning Platform
          </p>
        </div>

        {/* Loading Progress Bar & Pulsing Dots */}
        <div className="w-44 sm:w-52 h-1.5 bg-white/10 rounded-full overflow-hidden relative shadow-inner">
          <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-400 rounded-full animate-progress" />
        </div>

        {/* Status text */}
        <span className="text-[11px] font-medium text-slate-400/90 tracking-wide animate-pulse">
          Đang khởi tạo hệ thống học thông minh...
        </span>
      </div>
    </div>
  );
};
