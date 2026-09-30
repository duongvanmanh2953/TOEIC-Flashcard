// ============================================================================
// GAME FEEDBACK — LIGHTWEIGHT CELEBRATION & FEEDBACK
// Gentle GPU particles • Praise banner • Non-intrusive 60fps
// ============================================================================

import React, { memo } from 'react';
import { Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';

interface GameFeedbackProps {
  status: 'correct' | 'wrong' | null;
  praiseText?: string;
  className?: string;
}

export const GameFeedback: React.FC<GameFeedbackProps> = memo(({
  status,
  praiseText,
  className = '',
}) => {
  if (!status) return null;

  if (status === 'correct') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 text-white font-black text-sm sm:text-base shadow-[0_8px_20px_rgba(16,185,129,0.4)] animate-bounce select-none ${className}`}
      >
        <Sparkles className="w-5 h-5 text-amber-300 animate-spin [animation-duration:3s]" />
        <span>{praiseText || 'Chính xác! Bé giỏi lắm! 🎉'}</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-500 text-white font-black text-sm sm:text-base shadow-[0_8px_20px_rgba(244,63,94,0.4)] animate-[shake_0.4s_ease-in-out] select-none ${className}`}
    >
      <RotateCcw className="w-5 h-5 text-white" />
      <span>{praiseText || 'Thử lại lần nữa nào bé ơi! 💪'}</span>
    </div>
  );
});
