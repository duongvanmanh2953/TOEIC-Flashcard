// ============================================================================
// GAME SHELL — UNIVERSAL FULLSCREEN GAME CONTAINER
// 100vw x 100dvh • Zero scroll • Mobile landscape detector • Unified HUD & modals
// ============================================================================

import React, { useState, useEffect, memo } from 'react';
import { GameHeader } from './GameHeader';
import { GameStage } from './GameStage';
import { GameModal } from './GameModal';
import { GameResult } from './GameResult';
import { GameRotateScreen } from './GameRotateScreen';
import { GameLoading } from './GameLoading';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';

export interface GameShellProps {
  // Game metadata
  title: string;
  icon?: React.ReactNode;
  backgroundTheme?: 'bright' | 'nature' | 'space' | 'magic' | 'kitchen';
  requiresLandscape?: boolean;

  // Round & Stats
  currentRound?: number;
  totalRounds?: number;
  score?: number;
  lives?: number;
  maxLives?: number;
  streak?: number;

  // State
  isLoading?: boolean;
  isGameComplete?: boolean;
  starsEarned?: number;

  // Event handlers
  onExit: () => void;
  onPlayAgain?: () => void;
  onNextGame?: () => void;

  // Main game contents
  children: React.ReactNode;
}

export const GameShell: React.FC<GameShellProps> = memo(({
  title,
  icon,
  backgroundTheme = 'bright',
  requiresLandscape = false,
  currentRound = 1,
  totalRounds = 5,
  score = 0,
  lives,
  maxLives = 3,
  streak = 0,
  isLoading = false,
  isGameComplete = false,
  starsEarned = 3,
  onExit,
  onPlayAgain,
  onNextGame,
  children,
}) => {
  const [showExitModal, setShowExitModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isRotateDismissed, setIsRotateDismissed] = useState(false);

  // Stop active speech on unmount
  useEffect(() => {
    return () => {
      voiceService.stop();
    };
  }, []);

  // Detect orientation changes on mobile/tablet devices
  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window === 'undefined') return;
      const isMobile = window.innerWidth <= 768;
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(isMobile && portrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const handleToggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      soundManager.setMuted(next);
      return next;
    });
  };

  const handleConfirmExit = () => {
    voiceService.stop();
    setShowExitModal(false);
    onExit();
  };

  return (
    <div
      className="fixed inset-0 z-50 w-screen h-screen min-h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col select-none touch-manipulation bg-[#FAF8F5]"
      style={
        {
          '--game-header-height': '60px',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        } as React.CSSProperties
      }
    >
      {/* 1. Mobile Landscape Alert Overlay */}
      {requiresLandscape && isPortrait && !isRotateDismissed && (
        <GameRotateScreen onDismiss={() => setIsRotateDismissed(true)} />
      )}

      {/* 2. Loading State Overlay */}
      {isLoading && <GameLoading gameTitle={title} />}

      {/* 3. Universal Game Header */}
      <GameHeader
        title={title}
        icon={icon}
        currentRound={currentRound}
        totalRounds={totalRounds}
        score={score}
        lives={lives}
        maxLives={maxLives}
        streak={streak}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onExitClick={() => setShowExitModal(true)}
        onPauseClick={() => setShowPauseModal(true)}
      />

      {/* 4. Fullscreen Interactive Game Stage */}
      <GameStage backgroundTheme={backgroundTheme}>
        {children}
      </GameStage>

      {/* 5. Exit Confirmation Modal */}
      <GameModal
        isOpen={showExitModal}
        title="Dừng chơi game này nhé?"
        description="Bé có chắc muốn quay về danh mục trò chơi không nào?"
        confirmLabel="Thoát game"
        cancelLabel="Chơi tiếp"
        onConfirm={handleConfirmExit}
        onCancel={() => setShowExitModal(false)}
      />

      {/* 6. Pause Modal */}
      <GameModal
        isOpen={showPauseModal}
        title="Trò Chơi Tạm Dừng"
        description="Bé nghỉ ngơi một chút rồi quay lại chơi tiếp nhé!"
        confirmLabel="Tiếp tục chơi"
        cancelLabel="Về danh mục"
        onConfirm={() => setShowPauseModal(false)}
        onCancel={handleConfirmExit}
      />

      {/* 7. Game Complete Result Celebration */}
      <GameResult
        isOpen={isGameComplete}
        score={score}
        total={totalRounds}
        starsEarned={starsEarned}
        streak={streak}
        onPlayAgain={() => {
          if (onPlayAgain) onPlayAgain();
        }}
        onNextGame={onNextGame}
        onExit={onExit}
      />
    </div>
  );
});
