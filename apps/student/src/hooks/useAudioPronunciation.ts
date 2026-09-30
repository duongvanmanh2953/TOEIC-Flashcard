import { useState, useCallback } from 'react';
import { audioEngine } from '../lib/audioEngine';

export const useAudioPronunciation = (defaultLang?: string) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState('');

  const speak = useCallback((text: string, rate: number = 1.0, lang?: string, audioUrl?: string) => {
    if (!text && !audioUrl) return;
    setCurrentText(text || '');

    const effectiveLang = lang || defaultLang || audioEngine.getPreferredTargetLocale() || 'en-US';

    audioEngine.playWord(text, {
      audioUrl,
      rate,
      lang: effectiveLang,
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
      onError: (err) => {
        console.warn('Audio pronunciation notice:', err);
        setIsPlaying(false);
      },
    });
  }, [defaultLang]);

  const stop = useCallback(() => {
    audioEngine.stop();
    setIsPlaying(false);
  }, []);

  return { speak, stop, isPlaying, currentText };
};

export default useAudioPronunciation;
