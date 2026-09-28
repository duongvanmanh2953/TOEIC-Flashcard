import React from 'react';
import { Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuotaMeterProps {
  label: string;
  used: number;
  limit: number; // -1 for unlimited
  remaining?: number;
  className?: string;
  onUpgradeClick?: () => void;
}

export const QuotaMeter: React.FC<QuotaMeterProps> = ({
  label,
  used,
  limit,
  remaining,
  className = '',
  onUpgradeClick,
}) => {
  const navigate = useNavigate();

  const isUnlimited = limit === -1 || limit >= 9999;
  const actualRemaining = remaining !== undefined ? remaining : Math.max(0, limit - used);
  const percentage = isUnlimited ? 100 : limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 100;

  // Warning levels
  const isDepleted = !isUnlimited && actualRemaining <= 0;
  const isCritical = !isUnlimited && (percentage >= 90 || actualRemaining === 1);
  const isApproaching = !isUnlimited && percentage >= 70 && !isCritical;

  const handleUpgrade = () => {
    if (onUpgradeClick) onUpgradeClick();
    else navigate('/upgrade');
  };

  return (
    <div className={`p-4 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 backdrop-blur-md space-y-2.5 shadow-xs ${className}`}>
      {/* Header Info */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
          <span>{label}</span>
          {isUnlimited && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1 border border-emerald-500/20">
              <CheckCircle2 className="w-2.5 h-2.5" /> Không giới hạn
            </span>
          )}
        </div>

        <div className="tabular-nums text-xs font-black">
          {isUnlimited ? (
            <span className="text-emerald-600 dark:text-emerald-400">Đã dùng {used}</span>
          ) : (
            <span className={isDepleted ? 'text-rose-600 dark:text-rose-400' : isCritical ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'}>
              {used} / {limit} lượt
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {!isUnlimited && (
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700/80 overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isDepleted
                ? 'bg-rose-500'
                : isCritical
                ? 'bg-amber-500'
                : isApproaching
                ? 'bg-amber-400'
                : 'bg-brand-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}

      {/* Warning & CTA Footer */}
      {!isUnlimited && (
        <div className="flex items-center justify-between pt-0.5 text-[11px]">
          {isDepleted ? (
            <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Đã đạt giới hạn hôm nay
            </span>
          ) : isCritical ? (
            <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Còn 1 lượt sử dụng hôm nay
            </span>
          ) : isApproaching ? (
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              Sắp chạm giới hạn AI hôm nay
            </span>
          ) : (
            <span className="text-slate-400 font-medium">Còn {actualRemaining} lượt hôm nay</span>
          )}

          {(isDepleted || isCritical || isApproaching) && (
            <button
              type="button"
              onClick={handleUpgrade}
              className="text-brand-600 dark:text-brand-400 hover:text-brand-700 font-extrabold flex items-center gap-1 transition hover:underline"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{isDepleted ? 'Mở rộng AI' : 'Nâng cấp'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
