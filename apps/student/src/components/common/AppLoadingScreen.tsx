import React from 'react';
import { VocabFlowLogo } from '@vocabflow/shared';

interface AppLoadingScreenProps {
  message?: string;
  className?: string;
}

export const AppLoadingScreen: React.FC<AppLoadingScreenProps> = ({
  message = 'Đang tải VocabFlow...',
  className = '',
}) => {
  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-4 transition-colors select-none ${className}`}
      aria-label={message}
    >
      {/* Background Ambient Glow */}
      <div className="absolute w-72 h-72 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none animate-pulse" />

      {/* Center Branded Container */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-4">
        {/* Logo Card with Glow */}
        <div className="relative">
          <div className="absolute -inset-2 rounded-3xl bg-indigo-500/25 blur-md animate-pulse" />
          <div className="relative w-20 h-20 rounded-2xl bg-slate-900/90 border border-white/15 shadow-2xl flex items-center justify-center p-3 backdrop-blur-xl">
            <VocabFlowLogo size="lg" showContainer={false} className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Brand Name */}
        <div className="space-y-0.5">
          <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent tracking-tight">
            VocabFlow
          </h2>
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-slate-400">
            Spaced Repetition &amp; AI
          </p>
        </div>

        {/* Modern Animated Loading Bar */}
        <div className="w-40 sm:w-48 h-1 bg-white/10 rounded-full overflow-hidden relative mt-2">
          <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-400 rounded-full animate-progress" />
        </div>

        {/* Status text */}
        <span className="text-[11px] font-medium text-slate-400 tracking-wide animate-pulse">
          {message}
        </span>
      </div>
    </div>
  );
};
