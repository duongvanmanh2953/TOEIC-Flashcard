// ============================================================================
// KIDS GAME WRAPPER — FULL-BLEED GAME SHELL INTEGRATION
// 100vw x 100dvh • Unified HUD • Mobile Landscape Sensor • 60fps GPU Stage
// ============================================================================

import React, { memo } from 'react';
import { GameShell } from '../../components/kid-game/GameShell';
import { GameButton } from '../../components/kid-game/GameButton';
import { GameDefinition, KIDS_GAME_WORLDS } from '../../data/games/gamesRegistry';
import { voiceService } from '../../services/voice/voiceService';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { Volume2, Sparkles, ArrowRight, Lightbulb } from 'lucide-react';

interface KidsGameWrapperProps {
  game: GameDefinition;
  currentRound: number;
  totalRounds?: number;
  starsEarned: number;
  lives?: number;
  maxLives?: number;
  streak?: number;
  instructionEn?: string;
  instructionVi?: string;
  worldTheme?: 'jungle' | 'space' | 'kitchen' | 'sky' | 'castle' | 'stage' | 'starter' | 'station';
  isReadyToContinue?: boolean;
  onContinueRound?: () => void;
  praiseVi?: string;
  onExit: () => void;
  onReplayRound?: () => void;
  onNextGame?: () => void;
  onPlayAgain?: () => void;
  isGameComplete?: boolean;
  onReplayAudio?: () => void;
  children: React.ReactNode;
}

export const KidsGameWrapper: React.FC<KidsGameWrapperProps> = memo(({
  game,
  currentRound,
  totalRounds = 5,
  starsEarned,
  lives,
  maxLives = 3,
  streak = 0,
  instructionEn,
  instructionVi,
  isReadyToContinue = false,
  onContinueRound,
  praiseVi,
  onExit,
  onNextGame,
  onPlayAgain,
  isGameComplete = false,
  onReplayAudio,
  children,
}) => {
  // Map worldId to GameStage background theme
  const getStageTheme = (): 'bright' | 'nature' | 'space' | 'magic' | 'kitchen' => {
    switch (game.worldId) {
      case 'space':
        return 'space';
      case 'jungle':
        return 'nature';
      case 'magic':
      case 'castle':
        return 'magic';
      case 'kitchen':
        return 'kitchen';
      default:
        return 'bright';
    }
  };

  const handleAudioPrompt = () => {
    soundManager.playPop();
    if (onReplayAudio) {
      onReplayAudio();
    } else if (instructionEn) {
      voiceService.speakEnglish(instructionEn);
    } else {
      voiceService.speakEnglish(game.titleEn);
    }
  };

  return (
    <GameShell
      title={game.titleVi || game.titleEn}
      icon={<span className="text-xl">{game.icon}</span>}
      backgroundTheme={getStageTheme()}
      requiresLandscape={game.skillType === 'memory' || game.category === 'memory'}
      currentRound={currentRound}
      totalRounds={totalRounds}
      score={starsEarned}
      lives={lives}
      maxLives={maxLives}
      streak={streak}
      isGameComplete={isGameComplete}
      starsEarned={Math.min(3, Math.max(1, Math.round(starsEarned / 2)))}
      onExit={onExit}
      onPlayAgain={onPlayAgain}
      onNextGame={onNextGame}
    >
      {/* Optional Top Instructional Prompt Banner */}
      {(instructionEn || instructionVi) && (
        <div className="w-full max-w-xl mx-auto mb-2 shrink-0 flex items-center justify-between gap-2 px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-amber-300 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2 overflow-hidden">
            <Lightbulb className="w-4 h-4 text-amber-500 animate-bounce shrink-0" />
            <div className="truncate text-xs sm:text-sm font-black text-slate-800">
              {instructionEn && <span>{instructionEn} </span>}
              {instructionVi && (
                <span className="text-slate-600 font-bold hidden sm:inline">
                  ({instructionVi})
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAudioPrompt}
            className="p-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 active:scale-95 transition-all cursor-pointer shrink-0"
            title="Phát lại giọng đọc"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main interactive game canvas - fills available space without window scroll */}
      <div className="relative w-full flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden">
        {children}

        {/* Non-Auto-Advancing Continue Prompt */}
        {isReadyToContinue && !isGameComplete && onContinueRound && (
          <div className="absolute bottom-2 inset-x-0 z-40 flex flex-col items-center justify-center p-2 animate-scaleUp pointer-events-auto">
            <div className="p-3 sm:p-4 rounded-3xl bg-white/95 backdrop-blur-md border-3 border-emerald-400 shadow-2xl flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl animate-bounce">🎉</span>
                <span className="text-sm sm:text-base font-black text-emerald-950">
                  {praiseVi || 'Xuất sắc! Bé trả lời đúng rồi!'}
                </span>
              </div>

              <GameButton
                variant="primary"
                size="md"
                onClick={onContinueRound}
                icon={<ArrowRight className="w-4 h-4" />}
                className="animate-bounce"
              >
                Tiếp Tục Vòng {currentRound < totalRounds ? currentRound + 1 : 'Kết Thúc'}
              </GameButton>
            </div>
          </div>
        )}
      </div>
    </GameShell>
  );
});
