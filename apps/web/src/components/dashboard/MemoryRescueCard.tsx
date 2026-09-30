import React from 'react';
import { Brain, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PremiumBadge } from '../common/PremiumBadge';

interface SlippingWord {
  id: string;
  word: string;
  meaning?: string;
  partOfSpeech?: string;
  cefrLevel?: string;
  slipRisk?: number;
}

interface MemoryRescueCardProps {
  slippingWords?: SlippingWord[];
  slippingCount?: number;
  rescueCount?: number;
  averageMastery?: number;
  onStartRescue?: () => void;
  isPremium?: boolean;
  className?: string;
}

export const MemoryRescueCard: React.FC<MemoryRescueCardProps> = ({
  slippingWords = [],
  slippingCount = 0,
  rescueCount,
  averageMastery,
  onStartRescue,
  isPremium = false,
  className = '',
}) => {
  const navigate = useNavigate();

  const count = rescueCount !== undefined ? rescueCount : (slippingCount || slippingWords.length);

  if (count === 0 && slippingWords.length === 0) {
    return null;
  }

  const handleAction = () => {
    if (onStartRescue) {
      onStartRescue();
    } else if (isPremium) {
      navigate('/review?type=MEMORY_RESCUE');
    } else {
      navigate('/upgrade?feature=MEMORY_RESCUE');
    }
  };

  return (
    <div className={`p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-brand-500/10 border-2 border-rose-500/30 backdrop-blur-xl shadow-xl card-brand-effect overflow-hidden relative ${className}`}>
      {/* Background Decorative Blur */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/15 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black shadow-xs">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Memory Rescue</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider">
                Khẩn cấp
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Thuật toán AI phát hiện từ vựng sắp trôi khỏi trí nhớ
            </p>
          </div>
        </div>
        <PremiumBadge variant="pro" size="sm" />
      </div>

      {/* Message */}
      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
        Có <strong>{count} từ vựng</strong> đang có nguy cơ quên cao do quá hạn ôn tập hoặc điểm phản xạ giảm sút. Hãy giải cứu ngay hôm nay để củng cố trí nhớ dài hạn.
      </p>

      {/* Word Preview Chips */}
      {slippingWords.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {slippingWords.slice(0, 5).map((w, idx) => (
            <div
              key={idx}
              className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shadow-xs"
            >
              <span>{w.word}</span>
              {w.meaning && (
                <span className="text-slate-400 font-normal">({w.meaning})</span>
              )}
            </div>
          ))}
          {slippingWords.length > 5 && (
            <div className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-black">
              +{slippingWords.length - 5} từ khác
            </div>
          )}
        </div>
      )}

      {/* CTA Button */}
      <div className="flex items-center justify-between pt-2 border-t border-rose-500/20">
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          {isPremium ? 'Đã kích hoạt quyền lợi gói Premium' : 'Xem trước tính năng cứu nguy trí nhớ độc quyền'}
        </span>
        <button
          type="button"
          onClick={handleAction}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-rose-500/20 transition hover:scale-105 active:scale-95 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isPremium ? 'Giải Cứu Ngay' : 'Mở Khóa Memory Rescue'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
