// ============================================================================
// GAME RESULT — UNIFIED CELEBRATION MODAL
// Standardized across all games • Animated stars • Clear CTAs • 60fps
// ============================================================================

import React, { useEffect, memo } from 'react';
import { Star, RotateCcw, ArrowRight, Home, Sparkles, Trophy } from 'lucide-react';
import { GameButton } from './GameButton';
import { soundManager } from '../../services/sound/KidsSoundManager';

interface GameResultProps {
  isOpen: boolean;
  score: number;
  total: number;
  starsEarned?: number;
  streak?: number;
  title?: string;
  subtitle?: string;
  onPlayAgain: () => void;
  onNextGame?: () => void;
  onExit: () => void;
}

export const GameResult: React.FC<GameResultProps> = memo(({
  isOpen,
  score,
  total,
  starsEarned = 3,
  streak = 0,
  title = 'Bé Thật Tuyệt Vời!',
  subtitle = 'Bé đã hoàn thành xuất sắc trò chơi này!',
  onPlayAgain,
  onNextGame,
  onExit,
}) => {
  useEffect(() => {
    if (isOpen) {
      soundManager.play('level_up');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const starCount = Math.min(3, Math.max(1, starsEarned));

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-md rounded-[32px] bg-gradient-to-b from-white via-[#FFFDF7] to-[#F7F3EA] p-6 sm:p-8 text-center shadow-2xl border-4 border-amber-300 animate-scaleUp">
        {/* Top Floating Trophy / Mascot */}
        <div className="relative w-28 h-28 mx-auto -mt-16 sm:-mt-20 mb-3 flex items-center justify-center filter drop-shadow-[0_12px_24px_rgba(245,158,11,0.4)]">
          <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl animate-pulse" />
          <img
            src="/assets/kid/mascot/vivi-celebrate.png"
            alt="Vivi celebrating"
            className="w-full h-full object-contain pointer-events-none animate-bounce"
          />
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-1 flex items-center justify-center gap-1.5">
          <span>{title}</span>
          <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
        </h2>
        <p className="text-sm font-bold text-slate-500 mb-5">{subtitle}</p>

        {/* 3 Animated Glowing Stars */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 my-4">
          {[1, 2, 3].map((starIndex) => {
            const isFilled = starIndex <= starCount;
            return (
              <div
                key={starIndex}
                className={`transform transition-all duration-300 ${
                  starIndex === 2 ? '-translate-y-2.5 scale-110' : ''
                }`}
              >
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center ${
                    isFilled
                      ? 'bg-gradient-to-b from-amber-300 to-amber-500 text-white shadow-[0_8px_20px_rgba(245,158,11,0.5)] border-2 border-white'
                      : 'bg-slate-200 text-slate-400 border-2 border-slate-300'
                  }`}
                >
                  <Star className={`w-8 h-8 ${isFilled ? 'fill-white stroke-white' : ''}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Score & Accuracy Card */}
        <div className="grid grid-cols-2 gap-3 my-5 p-3 rounded-2xl bg-amber-50/80 border border-amber-200">
          <div>
            <span className="text-xs font-bold text-amber-800">Điểm số</span>
            <p className="text-2xl font-black text-amber-950">{score}/{total}</p>
          </div>
          <div>
            <span className="text-xs font-bold text-amber-800">Chuỗi đúng</span>
            <p className="text-2xl font-black text-emerald-600">{streak} 🔥</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {onNextGame && (
            <GameButton
              variant="primary"
              size="lg"
              className="w-full"
              icon={<ArrowRight className="w-5 h-5" />}
              onClick={onNextGame}
            >
              Chơi Game Tiếp Theo
            </GameButton>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <GameButton
              variant="amber"
              size="md"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={onPlayAgain}
            >
              Chơi lại
            </GameButton>

            <GameButton
              variant="ghost"
              size="md"
              icon={<Home className="w-4 h-4" />}
              onClick={onExit}
            >
              Danh mục
            </GameButton>
          </div>
        </div>
      </div>
    </div>
  );
});
