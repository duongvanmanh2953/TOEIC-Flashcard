// ============================================================================
// GAME ROTATE SCREEN (MOBILE LANDSCAPE DETECTION)
// Zero emoji • Custom SVG rotating device animation • Non-blocking on desktop
// ============================================================================

import React, { memo } from 'react';
import { RotateCw, Smartphone } from 'lucide-react';

interface GameRotateScreenProps {
  onDismiss?: () => void;
  message?: string;
}

export const GameRotateScreen: React.FC<GameRotateScreenProps> = memo(({
  onDismiss,
  message = 'Vui lòng xoay ngang điện thoại để có góc nhìn chơi game tuyệt nhất nhé bé!',
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-slate-900/95 backdrop-blur-md text-white select-none">
      <div className="relative w-36 h-36 mb-6 flex items-center justify-center">
        {/* Glowing halo */}
        <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl animate-pulse" />

        {/* Custom Animated Rotating Phone SVG */}
        <div className="relative z-10 w-24 h-24 animate-[spin_4s_ease-in-out_infinite]">
          <svg viewBox="0 0 100 100" className="w-full h-full text-amber-300 drop-shadow-[0_4px_12px_rgba(251,191,36,0.5)]" fill="none">
            {/* Phone Body */}
            <rect x="25" y="15" width="50" height="70" rx="8" stroke="currentColor" strokeWidth="4" fill="#1E293B" />
            {/* Notch / Speaker */}
            <rect x="42" y="20" width="16" height="3" rx="1.5" fill="currentColor" opacity="0.6" />
            {/* Home indicator */}
            <rect x="44" y="78" width="12" height="3" rx="1.5" fill="currentColor" opacity="0.6" />
            {/* Play triangle inside */}
            <polygon points="46,45 46,55 56,50" fill="currentColor" />
          </svg>
        </div>

        {/* Circular Arrows */}
        <RotateCw className="absolute -top-1 -right-1 w-8 h-8 text-amber-300/80 animate-spin [animation-duration:6s]" />
      </div>

      <h2 className="text-2xl font-black text-amber-300 mb-2 tracking-tight text-center">
        Xoay Ngang Điện Thoại
      </h2>
      <p className="text-sm font-medium text-slate-300 max-w-xs text-center leading-relaxed mb-6">
        {message}
      </p>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs font-bold text-slate-300 border border-white/20"
        >
          Tiếp tục chơi dọc
        </button>
      )}
    </div>
  );
});
