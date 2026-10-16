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

const ICON_SIZES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-4 h-4',
  md: 'w-4.5 h-4.5',
  lg: 'w-5 h-5',
};

// Chuẩn hóa Touch Targets theo Apple HIG / Android Material (tối thiểu 44px cho cỡ md/lg và 36px cho sm)
const PAD_SIZES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'p-2 rounded-lg min-h-[36px] min-w-[36px]',
  md: 'p-2.5 rounded-xl min-h-[44px] min-w-[44px]',
  lg: 'p-3 rounded-2xl min-h-[48px] min-w-[48px]',
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
    <div className="inline-flex items-center gap-1.5 select-none" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={(e) => handleSpeak(1.0, e)}
        className={`${PAD_SIZES[size]} bg-slate-100/80 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-700/60 transition active:scale-95 flex items-center justify-center cursor-pointer ${
          isThisPlaying
            ? 'ring-2 ring-indigo-500 scale-105 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/40 shadow-xs'
            : ''
        } ${className}`}
        title={isThisPlaying ? 'Bấm để dừng' : `Phát âm chuẩn (${resolvedLocale})`}
        aria-label={`Phát âm từ ${text}`}
      >
        <Volume2 className={`${ICON_SIZES[size]} ${isThisPlaying ? 'animate-pulse text-indigo-500' : ''}`} />
      </button>

      {showSlowOption && (
        <button
          type="button"
          onClick={(e) => handleSpeak(0.75, e)}
          className="px-2.5 py-1.5 min-h-[36px] rounded-xl bg-slate-100/60 dark:bg-slate-800/60 hover:bg-amber-500/10 text-slate-600 dark:text-slate-300 hover:text-amber-600 text-xs transition border border-slate-200/40 dark:border-slate-800 active:scale-95 flex items-center gap-1 font-bold text-[11px] cursor-pointer"
          title="Đọc chậm 0.75x"
          aria-label={`Đọc chậm từ ${text}`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>0.75x</span>
        </button>
      )}
    </div>
  );
});

SpeechButton.displayName = 'SpeechButton';

export default SpeechButton;
