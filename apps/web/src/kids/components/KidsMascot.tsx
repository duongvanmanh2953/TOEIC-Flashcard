import React from 'react';
import { kidsSpeech } from '../services/speech/KidsSpeechManager';
import { kidsSound } from '../services/sound/KidsSoundManager';
import { kidAsset } from '../utils/kidAsset';

export type MascotMood =
  | 'idle'
  | 'happy'
  | 'excited'
  | 'thinking'
  | 'celebrate'
  | 'encourage'
  | 'listening'
  | 'speaking'
  | 'surprise'
  | 'confused'
  | 'sleep'
  | 'pointing'
  | 'running'
  | 'trophy'
  | 'study';

interface KidsMascotProps {
  mood?: MascotMood;
  speechText?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  interactive?: boolean;
  className?: string;
  onMascotClick?: () => void;
  onClick?: () => void;
}

const moodToImageMap: Record<MascotMood, string> = {
  idle: '/kid/mascot/vivi-wave.png',
  happy: '/kid/mascot/vivi-celebrate.png',
  excited: '/kid/mascot/vivi-celebrate.png',
  thinking: '/kid/mascot/vivi-thinking.png',
  celebrate: '/kid/mascot/vivi-trophy.png',
  encourage: '/kid/mascot/vivi-encourage.png',
  listening: '/kid/mascot/vivi-listening.png',
  speaking: '/kid/mascot/vivi-speaking.png',
  surprise: '/kid/mascot/vivi-confused.png',
  confused: '/kid/mascot/vivi-confused.png',
  sleep: '/kid/mascot/vivi-sleep.png',
  pointing: '/kid/mascot/vivi-pointing.png',
  running: '/kid/mascot/vivi-running.png',
  trophy: '/kid/mascot/vivi-trophy.png',
  study: '/kid/mascot/vivi-study.png',
};

export const KidsMascot: React.FC<KidsMascotProps> = ({
  mood = 'idle',
  speechText,
  size = 'md',
  interactive = true,
  className = '',
  onMascotClick,
  onClick,
}) => {
  const sizeMap: Record<string, string> = {
    xs: 'w-12 h-12',
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-44 h-44',
    xl: 'w-56 h-56',
  };

  const imageSrc = kidAsset(moodToImageMap[mood] || moodToImageMap.idle);

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

  const dimensionStyle =
    typeof size === 'number'
      ? { width: size, height: size }
      : undefined;

  const sizeClass =
    typeof size === 'string' && sizeMap[size] ? sizeMap[size] : sizeMap.md;

  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      {/* Speech Bubble if speechText provided */}
      {speechText && (
        <div
          onClick={handleMascotTap}
          className="mb-2.5 max-w-xs px-4 py-2 rounded-2xl bg-white border-2 border-amber-300 text-slate-800 font-black text-xs sm:text-sm text-center relative cursor-pointer hover:scale-102 transition-transform shadow-md animate-fadeIn"
        >
          <span>{speechText}</span>
          <span className="text-xs ml-1.5 opacity-70">🔊</span>
          {/* Bubble Tail */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-amber-300" />
        </div>
      )}

      {/* 3D Vivi Mascot Image */}
      <div
        onClick={interactive ? handleMascotTap : undefined}
        style={dimensionStyle}
        className={`${typeof size === 'number' ? '' : sizeClass} flex items-center justify-center ${
          interactive ? 'cursor-pointer' : ''
        } ${getAnimationClass()}`}
        title="Vivi the Fox — Bạn đồng hành cùng bé!"
      >
        <img
          src={imageSrc}
          alt={`Vivi the Fox (${mood})`}
          className="w-full h-full object-contain drop-shadow-md select-none pointer-events-none"
          loading="eager"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/kid/mascot/vivi-celebrate.png';
          }}
        />
      </div>
    </div>
  );
};

export default KidsMascot;
