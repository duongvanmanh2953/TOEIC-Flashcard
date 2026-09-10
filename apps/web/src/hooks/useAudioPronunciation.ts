import { useState, useCallback } from 'react';
import { audioEngine } from '../lib/audioEngine';

export const useAudioPronunciation = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState('');

  const speak = useCallback((text: string, rate: number = 1.0, lang: string = 'en-US') => {
    if (!text) return;
    setCurrentText(text);

    audioEngine.playWord(text, {
      rate,
      lang,
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
      onError: (err) => {
        console.warn('Audio pronunciation notice:', err);
        setIsPlaying(false);
      },
    });
  }, []);

  const stop = useCallback(() => {
    audioEngine.stop();
    setIsPlaying(false);
  }, []);

  return { speak, stop, isPlaying, currentText };
};

export default useAudioPronunciation;
