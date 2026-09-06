import React from 'react';
import { Lock, LockOpen, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PremiumBadge } from './PremiumBadge';

interface FeatureLockProps {
  featureTitle: string;
  previewDescription: string;
  previewContent?: React.ReactNode;
  variant?: 'pro' | 'plus' | 'premium';
  onUnlockClick?: () => void;
  className?: string;
}

export const FeatureLock: React.FC<FeatureLockProps> = ({
  featureTitle,
  previewDescription,
  previewContent,
  variant = 'pro',
  onUnlockClick,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleUnlock = () => {
    if (onUnlockClick) onUnlockClick();
    else navigate('/upgrade');
  };

  return (
    <div
      className={`relative rounded-3xl p-6 sm:p-7 border border-brand-500/30 bg-gradient-to-br from-white/80 via-white/50 to-brand-500/[0.04] dark:from-slate-900/80 dark:via-slate-900/60 dark:to-brand-500/[0.06] backdrop-blur-xl shadow-xl overflow-hidden card-brand-effect ${className}`}
    >
      {/* Background Decorative Glow */}
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold shadow-xs">
            <Lock className="w-4 h-4" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>{featureTitle}</span>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              <span>Khóa</span>
            </span>
          </h3>
        </div>
        <PremiumBadge variant={variant} size="sm" />
      </div>

      {/* Description */}
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
        {previewDescription}
      </p>

      {/* Optional Preview Content Area */}
      {previewContent && (
        <div className="mb-5 p-4 rounded-2xl bg-white/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 opacity-90">
          {previewContent}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <span className="text-[11px] text-slate-400 font-medium">
          Mở khóa toàn bộ quyền hạn cùng LexiMind {variant.toUpperCase()}
        </span>
        <button
          type="button"
          onClick={handleUnlock}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-brand-600 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/20 transition hover:scale-105 active:scale-95"
        >
          <LockOpen className="w-3.5 h-3.5 text-amber-200" />
          <span>Mở Khóa Ngay</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
