import React from 'react';
import { Sparkles, AlertTriangle, CheckCircle2, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n';

interface QuotaMeterProps {
  label?: string;
  feature?: string;
  used: number;
  limit: number; // -1 for unlimited, 0 for pro-only
  remaining?: number;
  tier?: string;
  className?: string;
  onUpgrade?: () => void;
  onUpgradeClick?: () => void;
}

const FEATURE_NAMES: Record<string, { vi: string; en: string }> = {
  AI_TUTOR: { vi: 'Trợ lý AI Gia sư', en: 'AI Tutor Assistant' },
  TEXT_TO_VOCAB: { vi: 'Trích từ vựng AI', en: 'Text to Vocab (AI)' },
  STORY_GEN: { vi: 'Tạo truyện từ vựng AI', en: 'AI Story Generator' },
  AI_STORY: { vi: 'Tạo truyện từ vựng AI', en: 'AI Story Generator' },
  SMART_REVIEW: { vi: 'Ôn tập thông minh', en: 'Smart Review' },
  CUSTOM_QUIZ: { vi: 'Đề thi trắc nghiệm AI', en: 'Dynamic Quiz' },
  NOTES: { vi: 'Ghi chú cá nhân', en: 'Personal Notes' },
  PRONUNCIATION: { vi: 'Luyện phát âm AI', en: 'AI Pronunciation' },
  MESSAGES: { vi: 'Tin nhắn hội thoại AI', en: 'AI Chat Messages' },
  ACCESS_KEYS: { vi: 'Mã chia sẻ kho từ', en: 'Access Keys' },
  DEEP_ANALYTICS: { vi: 'Phân tích chuyên sâu', en: 'Deep Analytics' },
  MEMORY_RESCUE: { vi: 'Giải cứu trí nhớ', en: 'Memory Rescue' },
};

export const QuotaMeter: React.FC<QuotaMeterProps> = ({
  label,
  feature,
  used,
  limit,
  remaining,
  tier,
  className = '',
  onUpgrade,
  onUpgradeClick,
}) => {
  const navigate = useNavigate();
  const { t, locale } = useTranslation();

  const isUnlimited = limit === -1 || limit >= 9999;
  const isProOnly = !isUnlimited && limit <= 0;
  const actualRemaining = remaining !== undefined ? remaining : Math.max(0, limit - used);
  const percentage = isUnlimited ? 100 : limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 100;

  // Warning levels
  const isDepleted = !isUnlimited && !isProOnly && actualRemaining <= 0;
  const isCritical = !isUnlimited && !isProOnly && (percentage >= 90 || actualRemaining === 1);
  const isApproaching = !isUnlimited && !isProOnly && percentage >= 70 && !isCritical;

  const handleUpgrade = () => {
    if (onUpgradeClick) onUpgradeClick();
    else if (onUpgrade) onUpgrade();
    else navigate('/upgrade');
  };

  const featureFallback = feature && FEATURE_NAMES[feature]
    ? (locale === 'en' ? FEATURE_NAMES[feature].en : FEATURE_NAMES[feature].vi)
    : feature;
  const displayLabel = label || featureFallback || t('quota.usageLimit', 'Hạn mức sử dụng');

  return (
    <div className={`p-4 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 backdrop-blur-md space-y-2.5 shadow-xs ${className}`}>
      {/* Header Info */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
          <span>{displayLabel}</span>
          {isUnlimited && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1 border border-emerald-500/20">
              <CheckCircle2 className="w-2.5 h-2.5" /> {t('quota.unlimited', 'Không giới hạn')}
            </span>
          )}
        </div>

        <div className="tabular-nums text-xs font-black">
          {isUnlimited ? (
            <span className="text-emerald-600 dark:text-emerald-400">
              {t('quota.usedCount', 'Đã dùng')} {used}
            </span>
          ) : isProOnly ? (
            <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 font-black text-[10px] uppercase tracking-wide border border-amber-500/30 flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-500 fill-amber-400" />
              <span>{t('quota.proBadge', 'Gói Pro')}</span>
            </span>
          ) : (
            <span className={isDepleted ? 'text-rose-600 dark:text-rose-400' : isCritical ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'}>
              {used} / {limit} {t('quota.turnsCount', 'lượt')}
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {!isUnlimited && (
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700/80 overflow-hidden relative">
          {isProOnly ? (
            <div className="h-full w-full bg-gradient-to-r from-amber-400/20 via-indigo-500/20 to-amber-400/20 rounded-full" />
          ) : (
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
          )}
        </div>
      )}

      {/* Warning & CTA Footer */}
      {!isUnlimited && (
        <div className="flex items-center justify-between pt-0.5 text-[11px]">
          {isProOnly ? (
            <>
              <span className="text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>{t('quota.proOnly', 'Chỉ dành cho gói Pro')}</span>
              </span>
              <button
                type="button"
                onClick={handleUpgrade}
                className="btn-gold-glowing !px-2.5 !py-0.5 text-[10px] font-extrabold shadow-sm transition flex items-center gap-1"
              >
                <Crown className="w-2.5 h-2.5 fill-white" />
                <span>{t('quota.upgradeNow', 'Nâng cấp ngay')}</span>
              </button>
            </>
          ) : isDepleted ? (
            <>
              <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {t('quota.dailyLimitReached', 'Đã đạt giới hạn hôm nay')}
              </span>
              <button
                type="button"
                onClick={handleUpgrade}
                className="text-brand-600 dark:text-brand-400 hover:text-brand-700 font-extrabold flex items-center gap-1 transition hover:underline"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>{t('quota.upgradeCTA', 'Mở rộng AI')}</span>
              </button>
            </>
          ) : isCritical ? (
            <>
              <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {t('quota.oneTurnLeft', 'Còn 1 lượt sử dụng hôm nay')}
              </span>
              <button
                type="button"
                onClick={handleUpgrade}
                className="text-brand-600 dark:text-brand-400 hover:text-brand-700 font-extrabold flex items-center gap-1 transition hover:underline"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>{t('quota.upgradeCTA', 'Nâng cấp')}</span>
              </button>
            </>
          ) : isApproaching ? (
            <>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                {t('quota.approachingLimit', 'Sắp chạm giới hạn AI hôm nay')}
              </span>
              <button
                type="button"
                onClick={handleUpgrade}
                className="text-brand-600 dark:text-brand-400 hover:text-brand-700 font-extrabold flex items-center gap-1 transition hover:underline"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>{t('quota.upgradeCTA', 'Nâng cấp')}</span>
              </button>
            </>
          ) : (
            <span className="text-slate-400 font-medium">
              Còn {actualRemaining} {t('quota.turnsLeft', 'lượt hôm nay')}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
