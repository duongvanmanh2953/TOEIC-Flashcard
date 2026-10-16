import React, { useEffect } from 'react';
import { Award, RotateCcw, ArrowRight, Zap, Trophy, Crown, CheckCircle2 } from 'lucide-react';
import { VocabFlowLogo } from './VocabFlowLogo';

export interface VictoryStatItem {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export interface VictoryStarModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  stars?: 1 | 2 | 3;
  stats?: VictoryStatItem[];
  xpEarned?: number;
  variant?: 'student' | 'kid';
  onPlayAgain?: () => void;
  onContinue?: () => void;
  playAgainText?: string;
  continueText?: string;
}

export const VictoryStarModal: React.FC<VictoryStarModalProps> = ({
  isOpen,
  title = 'XUẤT SẮC! CHIẾN THẮNG THỬ THÁCH',
  subtitle,
  stars = 3,
  stats = [],
  xpEarned = 50,
  variant = 'student',
  onPlayAgain,
  onContinue,
  playAgainText = 'Chơi Ván Mới',
  continueText = 'Về Sảnh Đấu',
}) => {
  if (!isOpen) return null;

  const starRatingFeedback = {
    3: {
      badge: 'Hoàn Hảo 3 Sao',
      tagline: '🌟 ĐẲNG CẤP BẬC THẦY! Trí nhớ & phản xạ đỉnh cao!',
      color: 'from-amber-400 to-yellow-500',
    },
    2: {
      badge: 'Rất Tuyệt Vời 2 Sao',
      tagline: '⚡ PHẢN XẠ THẦN TỐC! Bạn đã làm rất tốt!',
      color: 'from-amber-300 to-amber-500',
    },
    1: {
      badge: 'Hoàn Thành 1 Sao',
      tagline: '👍 KHỞI ĐẦU TỐT! Tiếp tục phát huy để đạt 3 sao nhé!',
      color: 'from-slate-300 to-amber-400',
    },
  }[stars];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none"
      role="dialog"
      aria-modal="true"
    >
      {/* Radiant celebratory backdrop glow */}
      <div className="absolute w-96 h-96 bg-gradient-to-tr from-amber-500/20 via-indigo-500/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <div
        className={`relative w-full max-w-md mx-auto p-6 sm:p-8 rounded-3xl text-center space-y-5 shadow-2xl overflow-hidden border ${
          variant === 'kid'
            ? 'bg-gradient-to-b from-indigo-950 via-slate-900 to-purple-950 border-amber-400/50 text-white'
            : 'bg-slate-900/95 border-indigo-500/40 text-slate-100 backdrop-blur-2xl'
        }`}
      >
        {/* Specular glass reflection bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />

        {/* Brand Crest */}
        <div className="flex items-center justify-center gap-1.5 opacity-80">
          <VocabFlowLogo size="xs" showContainer={false} className="w-4 h-4 object-contain" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            VocabFlow AI Victory
          </span>
        </div>

        {/* 1 - 2 - 3 STARS DISPLAY (Animated Pop-in) */}
        <div className="py-2 flex items-center justify-center gap-3">
          {/* Star 1 */}
          <div
            className={`transition-all duration-500 transform ${
              stars >= 1
                ? 'scale-100 opacity-100 animate-bounce'
                : 'scale-90 opacity-30 grayscale'
            }`}
            style={{ animationDelay: '0.1s' }}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="text-2xl drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">
                ⭐
              </span>
            </div>
          </div>

          {/* Star 2 (Hero Center Star - Bigger with Crown badge) */}
          <div
            className={`transition-all duration-500 transform -translate-y-2 ${
              stars >= 2
                ? 'scale-110 opacity-100 animate-bounce'
                : 'scale-90 opacity-30 grayscale'
            }`}
            style={{ animationDelay: '0.25s' }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/30 via-yellow-400/20 to-amber-500/30 border-2 border-amber-400/60 flex items-center justify-center shadow-xl shadow-amber-500/30 relative">
              <Crown className="w-4 h-4 text-amber-300 absolute -top-2.5 left-1/2 -translate-x-1/2 animate-pulse" />
              <span className="text-3xl drop-shadow-[0_0_12px_rgba(251,191,36,1)]">
                ⭐
              </span>
            </div>
          </div>

          {/* Star 3 */}
          <div
            className={`transition-all duration-500 transform ${
              stars >= 3
                ? 'scale-100 opacity-100 animate-bounce'
                : 'scale-90 opacity-30 grayscale'
            }`}
            style={{ animationDelay: '0.4s' }}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="text-2xl drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">
                ⭐
              </span>
            </div>
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[11px] font-black uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5" />
            <span>{starRatingFeedback.badge}</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">{title}</h2>
          <p className="text-xs font-semibold text-amber-300/90 max-w-sm mx-auto">
            {starRatingFeedback.tagline}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-300/80 max-w-sm mx-auto pt-1">{subtitle}</p>
          )}
        </div>

        {/* XP Reward Badge */}
        {xpEarned > 0 && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-purple-500/20 border border-amber-400/40 text-amber-300 text-xs font-black shadow-md">
            <Zap className="w-4 h-4 fill-amber-300" />
            <span>+{xpEarned} XP Thưởng Kiến Thức</span>
          </div>
        )}

        {/* Detailed Stats Grid */}
        {stats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-left">
            {stats.map((st, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between"
              >
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  {st.label}
                </span>
                <span className="text-base font-black text-white mt-0.5 block truncate">
                  {st.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Interactive Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {onPlayAgain && (
            <button
              onClick={onPlayAgain}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-400/30"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{playAgainText}</span>
            </button>
          )}
          {onContinue && (
            <button
              onClick={onContinue}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs transition border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{continueText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VictoryStarModal;
