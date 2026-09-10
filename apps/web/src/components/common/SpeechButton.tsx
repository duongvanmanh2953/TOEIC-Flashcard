import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useAudioPronunciation } from '../../hooks/useAudioPronunciation';

interface SpeechButtonProps {
  text: string;
  lang?: 'en-US' | 'en-GB';
  className?: string;
  showSlowOption?: boolean;
}

export const SpeechButton: React.FC<SpeechButtonProps> = ({
  text,
  lang = 'en-US',
  className = '',
  showSlowOption = true,
}) => {
  const { speak, isPlaying } = useAudioPronunciation();

  const handleSpeak = (rate: number = 1.0, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    speak(text, rate, lang);
  };

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={(e) => handleSpeak(1.0, e)}
        className={`p-2 rounded-xl bg-transparent hover:bg-brand-500/10 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 border border-slate-200/50 dark:border-slate-800 transition ${
          isPlaying ? 'ring-2 ring-brand-500 scale-105 bg-brand-500/20 text-brand-600 dark:text-brand-400' : ''
        } ${className}`}
        title={`Phát âm ${lang} (Dual Engine Chrome/Mobile)`}
      >
        <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
      </button>
      {showSlowOption && (
        <button
          type="button"
          onClick={(e) => handleSpeak(0.7, e)}
          className="p-1.5 rounded-xl bg-transparent hover:bg-amber-500/10 text-slate-500 hover:text-amber-600 text-xs transition border border-slate-200/40 dark:border-slate-800"
          title="Đọc chậm (0.7x)"
        >
          🐢
        </button>
      )}
    </div>
  );
};
