import React from 'react';
import { kidsSpeech } from '../services/speech/KidsSpeechManager';
import { kidsSound } from '../services/sound/KidsSoundManager';

export type MascotMood =
  | 'idle'
  | 'happy'
  | 'excited'
  | 'thinking'
  | 'celebrate'
  | 'encourage'
  | 'listening'
  | 'speaking'
  | 'surprise';

interface KidsMascotProps {
  mood?: MascotMood;
  speechText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  interactive?: boolean;
  className?: string;
  onMascotClick?: () => void;
  onClick?: () => void;
}

export const KidsMascot: React.FC<KidsMascotProps> = ({
  mood = 'idle',
  speechText,
  size = 'md',
  interactive = true,
  className = '',
  onMascotClick,
  onClick,
}) => {
  const sizeMap: Record<string, { w: number; h: number; box: string }> = {
    sm: { w: 90, h: 90, box: 'w-24 h-24' },
    md: { w: 140, h: 140, box: 'w-36 h-36' },
    lg: { w: 190, h: 190, box: 'w-48 h-48' },
    xl: { w: 240, h: 240, box: 'w-60 h-60' },
  };

  const resolvedSize = typeof size === 'number'
    ? { w: size, h: size, box: '' }
    : (typeof size === 'string' && sizeMap[size]) ? sizeMap[size] : sizeMap.md;

  const handleMascotTap = () => {
    kidsSound.play('pop');
    if (speechText) {
      kidsSpeech.speak(speechText);
    }
    if (onMascotClick) {
      onMascotClick();
    }
    if (onClick) {
      onClick();
    }
  };

  // Animation bounce class based on mood
  const getAnimationClass = () => {
    switch (mood) {
      case 'excited':
      case 'celebrate':
        return 'animate-bounce';
      case 'thinking':
        return 'animate-pulse';
      case 'listening':
        return 'animate-pulse scale-105';
      default:
        return 'hover:scale-105 transition-transform duration-300';
    }
  };

  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      {/* Speech Bubble if speechText provided */}
      {speechText && (
        <div
          onClick={handleMascotTap}
          className="mb-2.5 max-w-xs px-4 py-2.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 font-black text-xs sm:text-sm text-center relative cursor-pointer hover:scale-102 transition-transform shadow-xs"
        >
          <span>{speechText}</span>
          <span className="text-xs ml-1.5 opacity-60">🔊</span>
          {/* Bubble Tail */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-amber-300" />
        </div>
      )}

      {/* Bobby the Bear SVG Graphic */}
      <div
        onClick={handleMascotTap}
        style={typeof size === 'number' ? { width: size, height: size } : undefined}
        className={`${resolvedSize.box} flex items-center justify-center cursor-pointer ${getAnimationClass()}`}
        title="Bobby the Bear — Bấm để nghe Bobby nói chuyện!"
      >
        <svg
          viewBox="0 0 160 160"
          width={resolvedSize.w}
          height={resolvedSize.h}
          className=""
        >
          <defs>
            {/* Fur gradient */}
            <linearGradient id="bearFur" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            {/* Ear inner gradient */}
            <linearGradient id="earInner" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="100%" stopColor="#fde68a" />
            </linearGradient>
            {/* Muzzle gradient */}
            <linearGradient id="bearMuzzle" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="100%" stopColor="#fef3c7" />
            </linearGradient>
            {/* Cheek blush */}
            <radialGradient id="cheekBlush" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fb7185" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#fb7185" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Left Ear */}
          <circle cx="42" cy="46" r="22" fill="url(#bearFur)" />
          <circle cx="42" cy="46" r="13" fill="url(#earInner)" />

          {/* Right Ear */}
          <circle cx="118" cy="46" r="22" fill="url(#bearFur)" />
          <circle cx="118" cy="46" r="13" fill="url(#earInner)" />

          {/* Head Body */}
          <ellipse cx="80" cy="90" rx="52" ry="46" fill="url(#bearFur)" />

          {/* Headphones (when mood === 'listening') */}
          {mood === 'listening' && (
            <g>
              <path
                d="M 32 80 A 50 50 0 0 1 128 80"
                fill="none"
                stroke="#6366f1"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <rect x="22" y="70" width="16" height="26" rx="8" fill="#4f46e5" />
              <rect x="122" y="70" width="16" height="26" rx="8" fill="#4f46e5" />
            </g>
          )}

          {/* Celebration Party Hat (when mood === 'celebrate' or 'excited') */}
          {(mood === 'celebrate' || mood === 'excited') && (
            <g>
              <polygon points="80,14 62,56 98,56" fill="#ec4899" />
              <polygon points="80,14 70,56 90,56" fill="#f43f5e" />
              <circle cx="80" cy="14" r="7" fill="#fbbf24" />
              <circle cx="70" cy="42" r="3" fill="#38bdf8" />
              <circle cx="86" cy="36" r="3.5" fill="#a855f7" />
            </g>
          )}

          {/* Muzzle (Nose area) */}
          <ellipse cx="80" cy="100" rx="26" ry="20" fill="url(#bearMuzzle)" />

          {/* Nose */}
          <path
            d="M 72 92 C 72 90, 88 90, 88 92 C 88 98, 80 102, 80 102 C 80 102, 72 98, 72 92 Z"
            fill="#451a03"
          />

          {/* Mouth according to Mood */}
          {mood === 'happy' || mood === 'celebrate' || mood === 'excited' ? (
            /* Open Big Smile */
            <g>
              <path
                d="M 68 102 Q 80 118 92 102"
                fill="#e11d48"
                stroke="#451a03"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Little cute tongue */}
              <path d="M 74 110 Q 80 117 86 110" fill="#fda4af" />
            </g>
          ) : mood === 'thinking' ? (
            /* Curious thinking mouth */
            <circle cx="80" cy="108" r="4" fill="#451a03" />
          ) : mood === 'surprise' ? (
            /* Big O surprise mouth */
            <ellipse cx="80" cy="108" rx="6" ry="8" fill="#451a03" />
          ) : (
            /* Gentle warm smile */
            <path
              d="M 71 103 Q 80 112 89 103"
              fill="none"
              stroke="#451a03"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          )}

          {/* Eyes according to Mood */}
          {mood === 'celebrate' || mood === 'happy' ? (
            /* Joyful arched squint eyes ^_^ */
            <g>
              <path
                d="M 54 78 Q 63 68 72 78"
                fill="none"
                stroke="#451a03"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M 88 78 Q 97 68 106 78"
                fill="none"
                stroke="#451a03"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </g>
          ) : (
            /* Big round sparkling eyes */
            <g>
              {/* Left Eye */}
              <ellipse cx="63" cy="76" rx="8" ry="10" fill="#1e1b4b" />
              <circle cx="60" cy="73" r="3.2" fill="#ffffff" />
              <circle cx="65" cy="80" r="1.5" fill="#ffffff" />

              {/* Right Eye */}
              <ellipse cx="97" cy="76" rx="8" ry="10" fill="#1e1b4b" />
              <circle cx="94" cy="73" r="3.2" fill="#ffffff" />
              <circle cx="99" cy="80" r="1.5" fill="#ffffff" />
            </g>
          )}

          {/* Rosy Cheeks */}
          <ellipse cx="48" cy="94" rx="9" ry="6" fill="url(#cheekBlush)" />
          <ellipse cx="112" cy="94" rx="9" ry="6" fill="url(#cheekBlush)" />

          {/* Sparkles around mascot during celebration */}
          {mood === 'celebrate' && (
            <g>
              <path
                d="M 22 45 L 26 55 L 36 59 L 26 63 L 22 73 L 18 63 L 8 59 L 18 55 Z"
                fill="#fbbf24"
                className="animate-spin"
                style={{ transformOrigin: '22px 59px', animationDuration: '4s' }}
              />
              <path
                d="M 138 35 L 141 42 L 148 45 L 141 48 L 138 55 L 135 48 L 128 45 L 135 42 Z"
                fill="#38bdf8"
                className="animate-spin"
                style={{ transformOrigin: '138px 45px', animationDuration: '3s' }}
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

export default KidsMascot;
