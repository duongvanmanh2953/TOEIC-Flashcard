import React from 'react';
import { ARENA_THEME } from '../../arena/arenaTheme';
import {
  ArenaIconVolume2,
  ArenaIconVolumeX,
  ArenaIconMaximize,
  ArenaIconMinimize,
  ArenaIconX,
} from './ArenaIcons';

export interface ArenaHeaderProps {
  roomCode: string;
  gameModeTitle: string;
  languageName?: string;
  countryCode?: string;
  isBgmPlaying?: boolean;
  isFullscreen?: boolean;
  onToggleBgm?: () => void;
  onToggleFullscreen?: () => void;
  onLeaveRoom?: () => void;
  className?: string;
}

export const ArenaHeader: React.FC<ArenaHeaderProps> = ({
  roomCode,
  gameModeTitle,
  languageName,
  countryCode,
  isBgmPlaying = false,
  isFullscreen = false,
  onToggleBgm,
  onToggleFullscreen,
  onLeaveRoom,
  className = '',
}) => {
  return (
    <header
      className={`w-full px-4 py-3 sm:px-6 rounded-2xl bg-[#12182B]/90 border border-[#232D4E] backdrop-blur-xl flex items-center justify-between gap-3 shadow-lg select-none ${className}`}
    >
      {/* Left: Room & Mode Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs sm:text-sm font-black px-2.5 py-1 rounded-xl bg-[#19213A] text-[#8B75FF] border border-[#232D4E]">
            #{roomCode}
          </span>
          {languageName && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#2041F6]/20 text-[#8B75FF] border border-[#2041F6]/30 text-xs font-black">
              <span>{languageName}</span>
            </span>
          )}
        </div>

        <div className="hidden md:block h-4 w-px bg-[#232D4E]" />

        <h1 className="text-xs sm:text-sm font-black text-[#F4F6FF] truncate max-w-[180px] sm:max-w-xs">
          {gameModeTitle}
        </h1>
      </div>

      {/* Right: Controls & Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {onToggleBgm && (
          <button
            type="button"
            onClick={onToggleBgm}
            className={`p-2 rounded-xl border text-xs transition cursor-pointer flex items-center gap-1.5 ${
              isBgmPlaying
                ? 'bg-[#2041F6]/30 border-[#8B75FF] text-indigo-300'
                : 'bg-[#19213A] border-[#232D4E] text-slate-400 hover:text-white'
            }`}
            title={isBgmPlaying ? 'Tắt BGM' : 'Bật BGM Nhạc Nền Game'}
          >
            {isBgmPlaying ? (
              <ArenaIconVolume2 className="w-4 h-4 text-indigo-400 animate-pulse" />
            ) : (
              <ArenaIconVolumeX className="w-4 h-4" />
            )}
            <span className="hidden sm:inline font-bold text-[11px]">BGM</span>
          </button>
        )}

        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-2 rounded-xl bg-[#19213A] hover:bg-[#2041F6]/40 border border-[#232D4E] text-slate-300 hover:text-white transition cursor-pointer"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình (Fullscreen)'}
          >
            {isFullscreen ? (
              <ArenaIconMinimize className="w-4 h-4" />
            ) : (
              <ArenaIconMaximize className="w-4 h-4" />
            )}
          </button>
        )}

        {onLeaveRoom && (
          <button
            type="button"
            onClick={onLeaveRoom}
            className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 transition cursor-pointer"
            title="Rời phòng đấu"
          >
            <ArenaIconX className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
