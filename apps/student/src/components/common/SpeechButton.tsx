import React from 'react';
import { Volume2, Clock } from 'lucide-react';
import { useAudioPronunciation } from '../../hooks/useAudioPronunciation';
import { getSpeechLocale } from '../../config/languages';

interface SpeechButtonProps {
  text: string;
  audioUrl?: string;
  lang?: string; // BCP-47 locale (e.g. 'en-US', 'de-DE', 'ja-JP') or language ID ('de', 'es', 'ja')
  className?: string;
  showSlowOption?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

interface SizeConfig {
  heightClass: string;
  iconSize: string;
  clockIconSize: string;
  primaryPadding: string;
  slowPadding: string;
  slowFontSize: string;
  rounded: string;
}

const SIZE_CONFIGS: Record<'sm' | 'md' | 'lg', SizeConfig> = {
  sm: {
    heightClass: 'h-8 min-h-[32px]',
    iconSize: 'w-3.5 h-3.5',
    clockIconSize: 'w-3 h-3',
    primaryPadding: 'px-2 min-w-[32px]',
    slowPadding: 'px-2 min-w-[44px]',
    slowFontSize: 'text-[10px]',
    rounded: 'rounded-lg',
  },
  md: {
    heightClass: 'h-9 min-h-[36px]',
    iconSize: 'w-4 h-4',
    clockIconSize: 'w-3.5 h-3.5',
    primaryPadding: 'px-2.5 min-w-[36px]',
    slowPadding: 'px-2.5 min-w-[50px]',
    slowFontSize: 'text-[11px]',
    rounded: 'rounded-xl',
  },
  lg: {
    heightClass: 'h-10 min-h-[40px]',
    iconSize: 'w-4.5 h-4.5',
    clockIconSize: 'w-4 h-4',
    primaryPadding: 'px-3 min-w-[40px]',
    slowPadding: 'px-3 min-w-[56px]',
    slowFontSize: 'text-xs',
    rounded: 'rounded-xl',
  },
};

export const SpeechButton: React.FC<SpeechButtonProps> = React.memo(({
  text,
  audioUrl,
  lang = 'en-US',
  className = '',
  showSlowOption = true,
  size = 'md',
}) => {
  const { speak, stop, isPlaying, currentText } = useAudioPronunciation();
  const isThisPlaying = isPlaying && currentText === text;
  const resolvedLocale = getSpeechLocale(lang);
  const cfg = SIZE_CONFIGS[size] || SIZE_CONFIGS.md;

  const handleSpeak = (rate: number = 1.0, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (isThisPlaying && rate === 1.0) {
      stop();
    } else {
      speak(text, rate, resolvedLocale, audioUrl);
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5 select-none shrink-0" onClick={(e) => e.stopPropagation()}>
      {/* 1. Primary Native Speech Button */}
      <button
        type="button"
        onClick={(e) => handleSpeak(1.0, e)}
        className={`${cfg.heightClass} ${cfg.primaryPadding} ${cfg.rounded} bg-slate-100/90 dark:bg-slate-800/90 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/70 dark:border-slate-700/70 transition-all active:scale-95 inline-flex items-center justify-center cursor-pointer whitespace-nowrap shrink-0 ${
          isThisPlaying
            ? 'ring-2 ring-indigo-500 scale-105 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/40 shadow-xs'
            : ''
        } ${className}`}
        title={isThisPlaying ? 'Bấm để dừng' : `Phát âm chuẩn (${resolvedLocale})`}
        aria-label={`Phát âm từ ${text}`}
      >
        <Volume2 className={`${cfg.iconSize} shrink-0 ${isThisPlaying ? 'animate-pulse text-indigo-500' : ''}`} />
      </button>

      {/* 2. Slow 0.75x Button (Balanced Height & Radius) */}
      {showSlowOption && (
        <button
          type="button"
          onClick={(e) => handleSpeak(0.75, e)}
          className={`${cfg.heightClass} ${cfg.slowPadding} ${cfg.rounded} ${cfg.slowFontSize} bg-slate-100/70 dark:bg-slate-800/70 hover:bg-amber-500/10 text-slate-600 dark:text-slate-300 hover:text-amber-600 transition-all border border-slate-200/50 dark:border-slate-700/60 active:scale-95 inline-flex items-center justify-center gap-1 font-bold cursor-pointer whitespace-nowrap shrink-0`}
          title="Đọc chậm 0.75x"
          aria-label={`Đọc chậm từ ${text}`}
        >
          <Clock className={`${cfg.clockIconSize} text-amber-500 shrink-0`} />
          <span className="whitespace-nowrap">0.75x</span>
        </button>
      )}
    </div>
  );
});

SpeechButton.displayName = 'SpeechButton';

export default SpeechButton;
