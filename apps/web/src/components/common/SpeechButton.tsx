import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';

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
  const [speaking, setSpeaking] = useState(false);

  const speak = (rate: number = 1.0, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;

    // Try to select an English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find((v) => v.lang.startsWith(lang.slice(0, 2)) && v.name.includes('Google') || v.lang === lang);
    if (englishVoice) utterance.voice = englishVoice;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="inline-flex items-center gap-1">
      <button
        onClick={(e) => speak(1.0, e)}
        className={`p-2 rounded-xl bg-transparent hover:bg-brand-500/10 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 border border-slate-200/50 dark:border-slate-800 transition ${
          speaking ? 'ring-2 ring-brand-500 scale-105 bg-brand-500/10' : ''
        } ${className}`}
        title={`Phát âm ${lang} (Bản xứ)`}
      >
        <Volume2 className="w-4 h-4" />
      </button>
      {showSlowOption && (
        <button
          onClick={(e) => speak(0.7, e)}
          className="p-1.5 rounded-xl bg-transparent hover:bg-amber-500/10 text-slate-500 hover:text-amber-600 text-xs transition border border-slate-200/40 dark:border-slate-800"
          title="Đọc chậm (0.7x)"
        >
          🐢
        </button>
      )}
    </div>
  );
};
