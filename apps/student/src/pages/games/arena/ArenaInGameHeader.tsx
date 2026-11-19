import React from 'react';
import { Eye, Users, Trophy, Settings, Radio } from 'lucide-react';

export interface ArenaInGameHeaderProps {
  isLive?: boolean;
  viewerCount?: number | string;
  remainingSeconds: number;
  totalDuration?: number;
  score?: number;
  playerCount?: number | string;
  onOpenSettings?: () => void;
  className?: string;
}

export const ArenaInGameHeader: React.FC<ArenaInGameHeaderProps> = ({
  isLive = true,
  viewerCount = '1.2K',
  remainingSeconds,
  totalDuration = 15,
  score = 12850,
  playerCount = '1.2K',
  onOpenSettings,
  className = '',
}) => {
  // SVG circular progress calculation
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalDuration > 0 ? Math.max(0, Math.min(1, remainingSeconds / totalDuration)) : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const isLowTime = remainingSeconds <= 3 && remainingSeconds > 0;

  return (
    <header
      className={`relative z-20 flex items-center justify-between gap-3 px-3 sm:px-6 py-2.5 max-w-6xl mx-auto w-full ${className}`}
    >
      {/* 1. LEFT PILLS: 🔴 LIVE + 👁️ VIEWER COUNT */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {isLive && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-[0_0_15px_rgba(239,68,68,0.6)]">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>LIVE</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/15 text-slate-200 text-xs sm:text-sm font-bold shadow-lg backdrop-blur-md">
          <Eye className="w-4 h-4 text-slate-400" />
          <span>{viewerCount}</span>
        </div>
      </div>

      {/* 2. CENTER: GIANT NEON CIRCULAR COUNTDOWN TIMER */}
      <div className="relative flex items-center justify-center shrink-0">
        <div className="relative w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center">
          {/* Pulsing Backglow */}
          <div
            className={`absolute inset-0 rounded-full blur-md transition-colors ${
              isLowTime
                ? 'bg-rose-500/40 animate-ping'
                : 'bg-cyan-400/30'
            }`}
          />

          {/* SVG Countdown Ring */}
          <svg className="w-16 h-16 sm:w-18 sm:h-18 -rotate-90" viewBox="0 0 60 60">
            {/* Background track */}
            <circle
              cx="30"
              cy="30"
              r={radius}
              fill="rgba(10, 15, 30, 0.9)"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="4"
            />
            {/* Active progress stroke */}
            <circle
              cx="30"
              cy="30"
              r={radius}
              fill="transparent"
              stroke={isLowTime ? '#F43F5E' : '#00F5FF'}
              strokeWidth="4.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-[stroke-dashoffset] duration-1000 ease-linear"
              style={{
                filter: isLowTime
                  ? 'drop-shadow(0 0 8px rgba(244, 63, 94, 0.9))'
                  : 'drop-shadow(0 0 8px rgba(0, 245, 255, 0.9))',
              }}
            />
          </svg>

          {/* Large Countdown Digits inside ring */}
          <span
            className={`absolute font-black font-mono text-xl sm:text-2xl text-white tracking-tighter ${
              isLowTime ? 'text-rose-400 animate-pulse' : 'text-white drop-shadow-[0_0_10px_rgba(0,245,255,0.8)]'
            }`}
          >
            {remainingSeconds}
          </span>
        </div>
      </div>

      {/* 3. RIGHT PILLS: 🏆 SCORE + 👥 PLAYERS + ⚙️ SETTINGS */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-amber-500/30 text-amber-300 font-mono font-black text-xs sm:text-sm shadow-lg backdrop-blur-md">
          <Trophy className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>{score.toLocaleString()}</span>
        </div>

        <div className="hidden xs:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/15 text-slate-200 text-xs sm:text-sm font-bold shadow-lg backdrop-blur-md">
          <Users className="w-4 h-4 text-indigo-400" />
          <span>{playerCount}</span>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/15 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer shadow-lg backdrop-blur-md"
          title="Cài đặt phòng thi đấu"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
