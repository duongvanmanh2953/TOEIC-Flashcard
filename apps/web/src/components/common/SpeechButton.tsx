import React from 'react';
import { Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { useAudioPronunciation } from '../../hooks/useAudioPronunciation';

interface SpeechButtonProps {
  text: string;
  lang?: 'en-US' | 'en-GB';
  className?: string;
  showSlowOption?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const SpeechButton: React.FC<SpeechButtonProps> = ({
  text,
  lang = 'en-US',
  className = '',
  showSlowOption = true,
  size = 'md',
}) => {
  const { speak, stop, isPlaying, currentText } = useAudioPronunciation();
  const isThisPlaying = isPlaying && currentText === text;

  const handleSpeak = (rate: number = 1.0, e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (isThisPlaying && rate === 1.0) {
      stop();
    } else {
      speak(text, rate, lang);
    }
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const padSizes = {
    sm: 'p-1.5 rounded-lg',
    md: 'p-2 rounded-xl',
    lg: 'p-2.5 rounded-2xl',
  };

  return (
    <div className="inline-flex items-center gap-1 select-none" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={(e) => handleSpeak(1.0, e)}
        onTouchEnd={(e) => handleSpeak(1.0, e)}
        className={`${padSizes[size]} bg-slate-100/80 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-700/60 transition active:scale-95 flex items-center justify-center ${
          isThisPlaying
            ? 'ring-2 ring-indigo-500 scale-105 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/40 shadow-xs'
            : ''
        } ${className}`}
        title={isThisPlaying ? 'Bấm để dừng' : `Phát âm chuẩn (${lang})`}
        aria-label={`Phát âm từ ${text}`}
      >
        <Volume2 className={`${iconSizes[size]} ${isThisPlaying ? 'animate-pulse text-indigo-500' : ''}`} />
      </button>

      {showSlowOption && (
        <button
          type="button"
          onClick={(e) => handleSpeak(0.75, e)}
          onTouchEnd={(e) => handleSpeak(0.75, e)}
          className="p-1.5 rounded-xl bg-slate-100/60 dark:bg-slate-800/60 hover:bg-amber-500/10 text-slate-500 hover:text-amber-600 text-xs transition border border-slate-200/40 dark:border-slate-800 active:scale-95"
          title="Đọc chậm 0.75x"
          aria-label={`Đọc chậm từ ${text}`}
        >
          🐢
        </button>
      )}
    </div>
  );
};

export default SpeechButton;
