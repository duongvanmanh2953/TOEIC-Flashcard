import React from 'react';
import { ARENA_THEME } from '../../arena/arenaTheme';

export interface CountdownRingProps {
  remainingSec: number;
  totalSec: number;
  size?: number;
  strokeWidth?: number;
  showMilliseconds?: boolean;
  className?: string;
}

export const CountdownRing: React.FC<CountdownRingProps> = ({
  remainingSec,
  totalSec,
  size = 72,
  strokeWidth = 6,
  showMilliseconds = false,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.max(0, Math.min(1, totalSec > 0 ? remainingSec / totalSec : 0));
  const strokeDashoffset = circumference * (1 - progressRatio);

  const isUrgent = remainingSec <= 3;
  const isWarning = remainingSec <= 5 && !isUrgent;

  const strokeColor = isUrgent
    ? ARENA_THEME.colors.error
    : isWarning
    ? ARENA_THEME.colors.gold
    : ARENA_THEME.colors.primaryHighlight;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ARENA_THEME.colors.surfaceBorder}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          style={{
            transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease',
          }}
        />
      </svg>

      {/* Center Number */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span
          className={`font-black tracking-tight tabular-nums ${
            isUrgent ? 'animate-pulse text-rose-400' : isWarning ? 'text-amber-400' : 'text-white'
          }`}
          style={{
            fontSize: size >= 80 ? '28px' : size >= 60 ? '20px' : '14px',
            lineHeight: 1,
            color: strokeColor,
          }}
        >
          {Math.ceil(remainingSec)}s
        </span>
      </div>
    </div>
  );
};
