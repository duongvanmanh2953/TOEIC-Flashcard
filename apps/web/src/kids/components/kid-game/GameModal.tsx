// ============================================================================
// GAME MODAL — COMPACT GAME DIALOG
// Confirmation on exit • Pause state • Responsive touch overlay
// ============================================================================

import React, { memo } from 'react';
import { GameButton } from './GameButton';
import { X, AlertCircle } from 'lucide-react';

interface GameModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  mascotImage?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const GameModal: React.FC<GameModalProps> = memo(({
  isOpen,
  title,
  description,
  mascotImage = '/kid/mascot/vivi-wave.png',
  confirmLabel = 'Đồng ý',
  cancelLabel = 'Chơi tiếp',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] w-screen h-screen min-h-[100dvh] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-sm my-auto rounded-[28px] bg-white p-6 text-center shadow-2xl border-4 border-amber-200 animate-scaleUp">
        {/* Close Button */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Mascot Avatar */}
        <div className="w-24 h-24 mx-auto mb-3 filter drop-shadow-md">
          <img
            src={mascotImage}
            alt="Vivi mascot"
            className="w-full h-full object-contain pointer-events-none"
            onError={(e) => { (e.target as HTMLImageElement).src = '/assets/kid/mascot/vivi-wave.png'; }}
          />
        </div>

        {/* Title & Description */}
        <h3 className="text-xl font-black text-slate-900 mb-1 tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="text-sm font-bold text-slate-500 mb-6">
            {description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <GameButton variant="ghost" size="md" onClick={onCancel}>
            {cancelLabel}
          </GameButton>
          <GameButton variant="amber" size="md" onClick={onConfirm}>
            {confirmLabel}
          </GameButton>
        </div>
      </div>
    </div>
  );
});
