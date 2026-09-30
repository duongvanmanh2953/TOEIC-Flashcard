// ============================================================================
// GAME STAGE — FULLSCREEN RESPONSIVE GAME ARENA
// Pure viewport containment • Zero window scroll • GPU-accelerated children
// ============================================================================

import React, { memo } from 'react';

interface GameStageProps {
  children: React.ReactNode;
  className?: string;
  backgroundTheme?: 'bright' | 'nature' | 'space' | 'magic' | 'kitchen';
}

export const GameStage: React.FC<GameStageProps> = memo(({
  children,
  className = '',
  backgroundTheme = 'bright',
}) => {
  const themeStyles = {
    bright: 'bg-gradient-to-b from-[#FFFDF7] via-[#FAF6EE] to-[#F3EDE2]',
    nature: 'bg-gradient-to-b from-[#E8F5E9] via-[#C8E6C9] to-[#A5D6A7]',
    space: 'bg-gradient-to-b from-[#0F172A] via-[#1E1B4B] to-[#311042] text-white',
    magic: 'bg-gradient-to-b from-[#F3E8FF] via-[#E9D5FF] to-[#D8B4FE]',
    kitchen: 'bg-gradient-to-b from-[#FFF7ED] via-[#FFEDD5] to-[#FED7AA]',
  }[backgroundTheme];

  return (
    <main
      className={`relative w-full flex-1 flex flex-col items-center justify-between overflow-hidden select-none p-3 sm:p-5 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] ${themeStyles} ${className}`}
      style={{
        height: 'calc(100dvh - var(--game-header-height, 60px))',
        maxHeight: 'calc(100dvh - var(--game-header-height, 60px))',
      }}
    >
      {/* Ambient background decoration shapes */}
      <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/40 dark:bg-white/5 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-white/40 dark:bg-white/5 blur-3xl" />
      </div>

      {/* Main interactive game content wrapper */}
      <div className="relative z-10 w-full max-w-5xl flex-1 flex flex-col items-center justify-center min-h-0">
        {children}
      </div>
    </main>
  );
});
