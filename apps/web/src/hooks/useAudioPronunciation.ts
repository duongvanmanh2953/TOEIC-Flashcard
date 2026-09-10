import { useState, useCallback, useRef, useEffect } from 'react';

// Global set to retain SpeechSynthesisUtterance references preventing Chrome GC bug
const activeUtterances = new Set<SpeechSynthesisUtterance>();

export const useAudioPronunciation = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Pre-load voices on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }, []);

  const speakWithAudioFallback = (text: string, rate: number = 1.0) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Reliable Google Dictionary TTS Audio Stream fallback
      const encoded = encodeURIComponent(text.trim());
      const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encoded}`;

      const audio = new Audio(fallbackUrl);
      audio.playbackRate = rate;
      audioRef.current = audio;

      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        console.warn('Audio stream fallback failed for:', text);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio play autoplay policy blocked:', err);
          setIsPlaying(false);
        });
      }
    } catch (e) {
      console.warn('Fallback audio failed:', e);
      setIsPlaying(false);
    }
  };

  const speak = useCallback((text: string, rate: number = 1.0, lang: string = 'en-US') => {
    if (!text || typeof window === 'undefined') return;

    // Check Web Speech API support
    const hasSpeechSynthesis = 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

    if (!hasSpeechSynthesis) {
      speakWithAudioFallback(text, rate);
      return;
    }

    try {
      // Resume if audio context was suspended by mobile browser
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;

      // Select best natural English voice
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const preferredVoice = voices.find(
          (v) =>
            (v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel'))) ||
            v.lang === lang
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      // Fix Chrome Garbage Collection bug by retaining utterance in memory
      activeUtterances.add(utterance);

      utterance.onstart = () => {
        setIsPlaying(true);
      };

      utterance.onend = () => {
        activeUtterances.delete(utterance);
        setIsPlaying(false);
      };

      utterance.onerror = (e) => {
        activeUtterances.delete(utterance);
        console.warn('SpeechSynthesis error, switching to Audio fallback:', e);
        speakWithAudioFallback(text, rate);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Web Speech API execution failed, using Audio fallback:', err);
      speakWithAudioFallback(text, rate);
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

  return { speak, stop, isPlaying };
};

export default useAudioPronunciation;
