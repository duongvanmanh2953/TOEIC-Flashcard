// ============================================================================
// GAME 10: SIMON SAYS (GẤU BOBBY BẢO BÉ LÀM GÌ?)
// Action Verbs + Listening Comprehension • Mascot Stage • TPR Method
// Non-Auto-Advancing: User taps Continue button after praise audio finishes
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Sparkles, Smile } from 'lucide-react';
import { KidsGameWrapper } from '../core/KidsGameWrapper';
import { KIDS_GAMES_REGISTRY } from '../../data/games/gamesRegistry';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';

interface SimonAction {
  id: string;
  commandEn: string;
  commandVi: string;
  actionWordEn: string;
  actionWordVi: string;
  icon: string;
  mascotPoseEmoji: string;
}

const SIMON_ACTIONS: SimonAction[] = [
  { id: 'touch_nose', commandEn: 'Touch your nose!', commandVi: 'Chạm vào mũi của bạn!', actionWordEn: 'Touch Nose', actionWordVi: 'Chạm Mũi', icon: '👃', mascotPoseEmoji: '🐻👉👃' },
  { id: 'clap_hands', commandEn: 'Clap your hands!', commandVi: 'Vỗ tay thật to!', actionWordEn: 'Clap', actionWordVi: 'Vỗ Tay', icon: '👏', mascotPoseEmoji: '🐻👏' },
  { id: 'jump_high', commandEn: 'Jump up high!', commandVi: 'Nhảy thật cao nào!', actionWordEn: 'Jump', actionWordVi: 'Nhảy Lên', icon: '🦘', mascotPoseEmoji: '🐻💨' },
  { id: 'touch_head', commandEn: 'Touch your head!', commandVi: 'Chạm vào đầu của bạn!', actionWordEn: 'Touch Head', actionWordVi: 'Chạm Đầu', icon: '🙆', mascotPoseEmoji: '🐻🙆' },
];

interface SimonSaysGameProps {
  onExit: () => void;
  onStarsAwarded?: (stars: number) => void;
  onNextGame?: () => void;
}

export const SimonSaysGame: React.FC<SimonSaysGameProps> = ({
  onExit,
  onStarsAwarded,
  onNextGame,
}) => {
  const gameDef = KIDS_GAMES_REGISTRY.find((g) => g.id === 'simon_says') || KIDS_GAMES_REGISTRY[9];

  const TOTAL_ROUNDS = 4;
  const [currentRound, setCurrentRound] = useState(1);
  const [starsEarned, setStarsEarned] = useState(0);

  const [currentAction, setCurrentAction] = useState<SimonAction>(SIMON_ACTIONS[0]);
  const [isMascotActing, setIsMascotActing] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isReadyToContinue, setIsReadyToContinue] = useState(false);
  const [praiseVi, setPraiseVi] = useState('');

  // Initialize round
  const initRound = useCallback((roundNum: number) => {
    setIsMascotActing(false);
    setIsReadyToContinue(false);
    const target = SIMON_ACTIONS[(roundNum - 1) % SIMON_ACTIONS.length];
    setCurrentAction(target);
  }, []);

  useEffect(() => {
    initRound(1);
  }, [initRound]);

  const handleChooseAction = (action: SimonAction) => {
    if (isMascotActing || isReadyToContinue) return;

    if (action.id === currentAction.id) {
      // CORRECT ACTION!
      setIsMascotActing(true);
      soundManager.play('spring_bounce');
      soundManager.play('star_burst');

      const earned = 2;
      setStarsEarned((prev) => prev + earned);
      if (onStarsAwarded) onStarsAwarded(earned);

      voiceService.speakEnglish(`Great job! ${action.commandEn}`, {
        onEnd: () => {
          const praise = 'Bé làm theo gấu Bobby chuẩn xác lắm!';
          setPraiseVi(praise);
          voiceService.speakVietnamese(praise, {
            onEnd: () => {
              setIsReadyToContinue(true);
            },
          });
        },
      });
    } else {
      // WRONG
      soundManager.play('wrong');
      voiceService.speakVietnamese(`Chưa đúng hành động rồi! Gấu Bobby bảo: ${currentAction.commandVi}`);
    }
  };

  const handleAdvanceRound = () => {
    setIsReadyToContinue(false);
    if (currentRound < TOTAL_ROUNDS) {
      setCurrentRound((prev) => prev + 1);
      initRound(currentRound + 1);
    } else {
      setIsGameComplete(true);
      soundManager.play('celebration');
    }
  };

  return (
    <KidsGameWrapper
      game={gameDef}
      currentRound={currentRound}
      totalRounds={TOTAL_ROUNDS}
      starsEarned={starsEarned}
      worldTheme="stage"
      instructionEn={`Simon says: ${currentAction.commandEn}`}
      instructionVi={`Gấu Bobby bảo: ${currentAction.commandVi}`}
      isReadyToContinue={isReadyToContinue}
      onContinueRound={handleAdvanceRound}
      praiseVi={praiseVi}
      onExit={onExit}
      onNextGame={onNextGame}
      onPlayAgain={() => {
        setCurrentRound(1);
        setStarsEarned(0);
        setIsGameComplete(false);
        initRound(1);
      }}
      isGameComplete={isGameComplete}
    >
      {/* FULL-BLEED LIVELY CONCERT STAGE */}
      <div className="relative w-full h-full p-4 sm:p-8 flex flex-col justify-between items-center overflow-hidden bg-gradient-to-b from-purple-900 via-pink-900 to-indigo-950 select-none">
        {/* Stage Spotlights */}
        <div className="absolute top-0 left-1/4 w-32 h-64 bg-yellow-300/15 -rotate-12 blur-xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-32 h-64 bg-cyan-300/15 rotate-12 blur-xl pointer-events-none" />

        {/* Command Callout Header */}
        <div className="relative z-20 flex flex-col items-center text-center space-y-1">
          <div className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-white/95 text-purple-950 font-black text-xs sm:text-sm border-2 border-purple-300 shadow-md flex items-center gap-2">
            <span className="text-xl animate-bounce">📢</span>
            <span>SIMON SAYS: "{currentAction.commandEn.toUpperCase()}"</span>
          </div>
          <span className="text-xs font-bold text-pink-200">
            {currentAction.commandVi}
          </span>
        </div>

        {/* CENTER STAGE: FULL-SCREEN ANIMATED MASCOT BOBBY */}
        <div className="relative z-10 w-full max-w-md my-auto flex flex-col items-center justify-center">
          <div
            className={`w-40 h-40 sm:w-52 sm:h-52 rounded-full bg-gradient-to-tr from-amber-400 via-orange-400 to-amber-300 border-4 border-white shadow-2xl flex flex-col items-center justify-center text-6xl sm:text-7xl transition-all duration-300 ${
              isMascotActing ? 'animate-bounce scale-110 shadow-amber-400/60' : 'hover:scale-105'
            }`}
          >
            {isMascotActing ? currentAction.mascotPoseEmoji : '🐻'}
          </div>

          <div className="mt-2.5 px-4 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-xs font-black">
            {isMascotActing ? `Gấu làm: ${currentAction.actionWordVi}! 👏` : 'Gấu Bobby đang chờ bé làm theo...'}
          </div>
        </div>

        {/* BOTTOM RHYTHM ACTION PADS (TOUCH TARGETS >= 48px) */}
        <div className="relative z-10 w-full max-w-xl grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pb-1">
          {SIMON_ACTIONS.map((action) => {
            const isTarget = action.id === currentAction.id;

            return (
              <button
                key={action.id}
                onClick={() => handleChooseAction(action)}
                disabled={isMascotActing || isReadyToContinue}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shadow-md min-h-[50px] ${
                  isTarget && isMascotActing
                    ? 'bg-emerald-500 border-white text-white scale-105 shadow-emerald-500/50'
                    : 'bg-white/95 hover:bg-amber-100 border-purple-300 text-purple-950 hover:scale-105'
                }`}
              >
                <span className="text-2xl sm:text-3xl select-none">{action.icon}</span>
                <span className="text-xs sm:text-sm font-black capitalize">{action.actionWordEn}</span>
                <span className="text-[10px] font-bold text-slate-500">({action.actionWordVi})</span>
              </button>
            );
          })}
        </div>
      </div>
    </KidsGameWrapper>
  );
};
