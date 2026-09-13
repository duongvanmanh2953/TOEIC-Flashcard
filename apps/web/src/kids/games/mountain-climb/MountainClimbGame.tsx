// ============================================================================
// GAME 18: MOUNTAIN CLIMB (CHINH PHỤC ĐỈNH NÚI CAO)
// Mixed Review Showcase • Giant Mountain 5 Checkpoints • Climb Animation & Flag
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Sparkles, Flag, Trophy, ArrowUp } from 'lucide-react';
import { KidsGameWrapper } from '../core/KidsGameWrapper';
import { KIDS_GAMES_REGISTRY } from '../../data/games/gamesRegistry';
import { COMPREHENSIVE_VOCABULARY, VocabularyItem } from '../../data/vocabulary/vocabularyData';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';

interface MountainCheckpoint {
  step: number;
  nameVi: string;
  nameEn: string;
  icon: string;
  targetWord: VocabularyItem;
  options: VocabularyItem[];
}

interface MountainClimbGameProps {
  onExit: () => void;
  onStarsAwarded?: (stars: number) => void;
  onNextGame?: () => void;
}

export const MountainClimbGame: React.FC<MountainClimbGameProps> = ({
  onExit,
  onStarsAwarded,
  onNextGame,
}) => {
  const gameDef = KIDS_GAMES_REGISTRY.find((g) => g.id === 'mountain_climb') || KIDS_GAMES_REGISTRY[8];

  const TOTAL_STEPS = 5;
  const [currentStep, setCurrentStep] = useState(1);
  const [starsEarned, setStarsEarned] = useState(0);

  const [currentTarget, setCurrentTarget] = useState<VocabularyItem>(COMPREHENSIVE_VOCABULARY[0]);
  const [options, setOptions] = useState<VocabularyItem[]>([]);
  const [isClimbing, setIsClimbing] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isReadyToContinue, setIsReadyToContinue] = useState(false);
  const [praiseVi, setPraiseVi] = useState('Bé leo núi rất cừ khôi!');

  // Initialize checkpoint
  const initCheckpoint = useCallback((stepNum: number) => {
    setIsClimbing(false);
    setIsReadyToContinue(false);
    const shuffled = [...COMPREHENSIVE_VOCABULARY].sort(() => Math.random() - 0.5);
    const target = shuffled[0];
    const choices = shuffled.slice(0, 3).sort(() => Math.random() - 0.5);

    setCurrentTarget(target);
    setOptions(choices);
  }, []);

  useEffect(() => {
    initCheckpoint(1);
  }, [initCheckpoint]);

  const handleContinueRound = () => {
    soundManager.play('pop');
    if (currentStep < TOTAL_STEPS) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      initCheckpoint(nextStep);
    } else {
      setIsGameComplete(true);
      soundManager.play('celebration');
    }
  };

  const handleChooseOption = (opt: VocabularyItem) => {
    if (isClimbing || isReadyToContinue) return;

    if (opt.id === currentTarget.id) {
      // CORRECT! CLIMB UPWARD!
      setIsClimbing(true);
      soundManager.play('spring_bounce');
      soundManager.play('star_burst');

      const earned = 3;
      setStarsEarned((prev) => prev + earned);
      if (onStarsAwarded) onStarsAwarded(earned);

      const praise = `Tuyệt vời! Bé đã chinh phục trạm ${CHECKPOINT_NAMES[currentStep - 1]}!`;
      setPraiseVi(praise);

      voiceService.speakWord(opt.word, {
        onEnd: () => {
          voiceService.speakVietnamese(praise, {
            onEnd: () => {
              if (currentStep < TOTAL_STEPS) {
                setIsReadyToContinue(true);
              } else {
                setIsGameComplete(true);
                soundManager.play('celebration');
              }
            },
          });
        },
      });
    } else {
      // WRONG
      soundManager.play('wrong');
      voiceService.speakVietnamese('Chưa đúng rồi bé ơi, cùng thử lại để leo núi nhé!');
    }
  };

  const CHECKPOINT_NAMES = ['Chân Núi', 'Rừng Cây', 'Vách Đá', 'Băng Tuyết', 'Đỉnh Núi'];

  return (
    <KidsGameWrapper
      game={gameDef}
      currentRound={currentStep}
      totalRounds={TOTAL_STEPS}
      starsEarned={starsEarned}
      instructionEn={`Climb to: ${currentTarget.word.toUpperCase()}!`}
      instructionVi={`Vượt trạm để leo lên: ${currentTarget.viMeaning}`}
      onExit={onExit}
      onNextGame={onNextGame}
      onPlayAgain={() => {
        setCurrentStep(1);
        setStarsEarned(0);
        setIsGameComplete(false);
        setIsReadyToContinue(false);
        initCheckpoint(1);
      }}
      isGameComplete={isGameComplete}
      isReadyToContinue={isReadyToContinue}
      onContinueRound={handleContinueRound}
      praiseVi={praiseVi}
      onReplayAudio={() => voiceService.speakWord(currentTarget.word)}
    >
      <div className="relative w-full aspect-[800/520] max-h-[65vh] mx-auto rounded-3xl overflow-hidden bg-gradient-to-b from-sky-300 via-indigo-100 to-emerald-100 select-none flex flex-col justify-between p-6">
        {/* Mountain Silhouette in Background */}
        <div className="absolute inset-0 pointer-events-none opacity-25">
          <polygon points="400,60 120,520 680,520" fill="#475569" />
          <polygon points="400,60 320,160 480,160" fill="#ffffff" opacity="0.8" />
        </div>

        {/* Header Checkpoint Altitude Indicator */}
        <div className="text-center z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/90 border-2 border-indigo-300 shadow-md">
            <span className="text-2xl animate-bounce">🏔️</span>
            <span className="text-sm sm:text-base font-black text-slate-900">
              TRẠM {currentStep}/5: <span className="text-indigo-700 underline">{CHECKPOINT_NAMES[currentStep - 1]}</span> ({currentTarget.word})
            </span>
          </div>
        </div>

        {/* Interactive Mountain Trail Vertical Staircase */}
        <div className="relative my-auto flex flex-col items-center justify-center gap-2 z-10">
          <div className="flex items-center gap-2 sm:gap-4">
            {[1, 2, 3, 4, 5].map((stepNum) => {
              const isCurrent = stepNum === currentStep;
              const isPassed = stepNum < currentStep;

              return (
                <div key={stepNum} className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl border-3 flex items-center justify-center font-black text-sm sm:text-lg shadow-lg transition-all ${
                      isCurrent
                        ? 'bg-amber-400 border-amber-600 text-amber-950 scale-110 animate-bounce'
                        : isPassed
                        ? 'bg-emerald-500 border-emerald-700 text-white'
                        : 'bg-white/80 border-slate-300 text-slate-400'
                    }`}
                  >
                    {isCurrent ? '🐻' : isPassed ? '✓' : `Trạm ${stepNum}`}
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 mt-1">
                    {CHECKPOINT_NAMES[stepNum - 1]}
                  </span>
                </div>
              );
            })}
          </div>

          {currentStep === 5 && isGameComplete && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-300 text-yellow-950 font-black text-xs shadow-lg mt-2 animate-bounce">
              <Flag className="w-4 h-4 text-red-600" />
              <span>ĐÃ CẮM CỜ ĐỈNH NÚI QUANG VINH! 🏆</span>
            </div>
          )}
        </div>

        {/* 3 Choice Option Cards at Bottom */}
        <div className="grid grid-cols-3 gap-3 sm:gap-5 w-full max-w-xl mx-auto z-10">
          {options.map((opt) => {
            const isTarget = opt.id === currentTarget.id;

            return (
              <button
                key={opt.id}
                onClick={() => handleChooseOption(opt)}
                disabled={isClimbing}
                className="p-3 sm:p-4 rounded-2xl bg-white hover:bg-amber-50 border-2 border-indigo-200 hover:border-indigo-400 shadow-md flex flex-col items-center justify-center gap-1 cursor-pointer transition-all hover:scale-105 active:scale-95"
              >
                <span className="text-3xl sm:text-4xl">
                  {opt.word === 'apple' ? '🍎' : opt.word === 'dog' ? '🐶' : opt.word === 'cat' ? '🐱' : opt.word === 'lion' ? '🦁' : '⭐'}
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-900">
                  {opt.word}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">
                  ({opt.viMeaning})
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </KidsGameWrapper>
  );
};
