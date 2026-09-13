// ============================================================================
// GAME 14: COOKING TIME (BẾP TRƯỞNG NHÍ TÀI BA)
// Food Vocabulary + Action Verbs • Pastel Kitchen • Mix & Bake Dessert
// Non-Auto-Advancing: User taps Continue button after praise audio finishes
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Sparkles, ChefHat } from 'lucide-react';
import { KidsGameWrapper } from '../core/KidsGameWrapper';
import { KIDS_GAMES_REGISTRY } from '../../data/games/gamesRegistry';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';

interface CookingStep {
  ingredientId: string;
  nameEn: string;
  nameVi: string;
  verbEn: string;
  verbVi: string;
  icon: string;
}

const RECIPE_STEPS: CookingStep[] = [
  { ingredientId: 'apple', nameEn: 'Apple', nameVi: 'Quả táo', verbEn: 'Add the apple', verbVi: 'Thêm táo vào', icon: '🍎' },
  { ingredientId: 'milk', nameEn: 'Milk', nameVi: 'Sữa tươi', verbEn: 'Pour the milk', verbVi: 'Rót sữa tươi', icon: '🥛' },
  { ingredientId: 'egg', nameEn: 'Egg', nameVi: 'Quả trứng', verbEn: 'Crack the egg', verbVi: 'Đập trứng', icon: '🥚' },
  { ingredientId: 'sugar', nameEn: 'Sugar', nameVi: 'Đường ngọt', verbEn: 'Add sugar', verbVi: 'Thêm đường', icon: '🧂' },
];

interface CookingTimeGameProps {
  onExit: () => void;
  onStarsAwarded?: (stars: number) => void;
  onNextGame?: () => void;
}

export const CookingTimeGame: React.FC<CookingTimeGameProps> = ({
  onExit,
  onStarsAwarded,
  onNextGame,
}) => {
  const gameDef = KIDS_GAMES_REGISTRY.find((g) => g.id === 'cooking_time') || KIDS_GAMES_REGISTRY[13];

  const TOTAL_ROUNDS = 4;
  const [currentRound, setCurrentRound] = useState(1);
  const [starsEarned, setStarsEarned] = useState(0);

  const [currentStep, setCurrentStep] = useState<CookingStep>(RECIPE_STEPS[0]);
  const [addedIngredients, setAddedIngredients] = useState<string[]>([]);
  const [isBakingComplete, setIsBakingComplete] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isReadyToContinue, setIsReadyToContinue] = useState(false);
  const [praiseVi, setPraiseVi] = useState('');

  // Initialize round
  const initRound = useCallback((roundNum: number) => {
    setIsBakingComplete(false);
    setAddedIngredients([]);
    setIsReadyToContinue(false);

    const target = RECIPE_STEPS[(roundNum - 1) % RECIPE_STEPS.length];
    setCurrentStep(target);
  }, []);

  useEffect(() => {
    initRound(1);
  }, [initRound]);

  const handleSelectIngredient = (step: CookingStep) => {
    if (isBakingComplete || isReadyToContinue) return;

    if (step.ingredientId === currentStep.ingredientId) {
      // CORRECT INGREDIENT!
      soundManager.play('pop');
      soundManager.play('water_splash');

      const nextAdded = [...addedIngredients, step.icon];
      setAddedIngredients(nextAdded);

      setIsBakingComplete(true);
      soundManager.play('star_burst');

      const earned = 2;
      setStarsEarned((prev) => prev + earned);
      if (onStarsAwarded) onStarsAwarded(earned);

      voiceService.speakEnglish(`${step.verbEn}! Yummy!`, {
        onEnd: () => {
          const praise = 'Đầu bếp nhí nấu món ngon tuyệt!';
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
      voiceService.speakVietnamese(`Chưa cần món này, bé hãy ${currentStep.verbVi} trước nhé!`);
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
      worldTheme="kitchen"
      instructionEn={currentStep.verbEn}
      instructionVi={currentStep.verbVi}
      isReadyToContinue={isReadyToContinue}
      onContinueRound={handleAdvanceRound}
      praiseVi={praiseVi}
      onReplayAudio={() => voiceService.speakEnglish(currentStep.verbEn)}
      onExit={onExit}
      onNextGame={onNextGame}
      onPlayAgain={() => {
        setCurrentRound(1);
        setStarsEarned(0);
        setAddedIngredients([]);
        setIsGameComplete(false);
        initRound(1);
      }}
      isGameComplete={isGameComplete}
    >
      {/* FULL-BLEED PASTEL KITCHEN SCENE */}
      <div className="relative w-full h-full p-4 sm:p-8 flex flex-col justify-between items-center overflow-hidden bg-gradient-to-b from-rose-100 via-amber-50 to-orange-100 select-none">
        {/* Kitchen Utensil Background Decor */}
        <div className="absolute top-4 left-8 text-4xl opacity-70 pointer-events-none select-none">
          🍳
        </div>
        <div className="absolute top-6 right-10 text-4xl opacity-70 pointer-events-none select-none">
          🍰
        </div>

        {/* Recipe Command Header */}
        <div className="relative z-20 flex flex-col items-center text-center space-y-1">
          <div className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-white/95 text-rose-950 font-black text-xs sm:text-sm border-2 border-rose-300 shadow-md flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-rose-500" />
            <span>CÔNG THỨC: "{currentStep.verbEn.toUpperCase()}"</span>
          </div>
          <span className="text-xs font-bold text-rose-800">
            {currentStep.verbVi} vào âu trộn bột nhé!
          </span>
        </div>

        {/* CENTER: PASTEL MIXING BOWL & CAKE CREATION */}
        <div className="relative z-10 w-full max-w-md my-auto flex flex-col items-center justify-center">
          <div
            className={`w-48 sm:w-60 h-36 sm:h-44 rounded-b-[45%] bg-gradient-to-tr from-amber-200 via-orange-100 to-white border-4 border-amber-300 shadow-2xl flex flex-col items-center justify-center relative transition-all duration-300 overflow-hidden ${
              isBakingComplete ? 'animate-culinary-stir shadow-rose-300/60' : 'hover:scale-105'
            }`}
          >
            {/* Bowl Rim */}
            <div className="absolute top-0 inset-x-0 h-4 bg-amber-300/60 border-b-2 border-amber-400" />

            {/* Added Ingredients inside bowl */}
            <div className="flex flex-wrap gap-2 items-center justify-center p-4">
              {addedIngredients.map((icon, idx) => (
                <span key={idx} className="text-3xl sm:text-4xl animate-bounce">
                  {icon}
                </span>
              ))}
              {addedIngredients.length === 0 && (
                <span className="text-xs font-bold text-amber-800/60">
                  Âu trộn bột đang trống...
                </span>
              )}
            </div>

            {isBakingComplete && (
              <span className="text-3xl sm:text-4xl -mt-2 animate-pulse">
                ✨ 🎂 ✨
              </span>
            )}
          </div>

          <span className="mt-2 text-xs font-bold text-rose-900 bg-white/90 px-3 py-0.5 rounded-full shadow-xs">
            {isBakingComplete ? 'Bánh chín thơm lừng! Yummy! 🎂' : 'Chọn đúng nguyên liệu bỏ vào âu nào!'}
          </span>
        </div>

        {/* BOTTOM INGREDIENTS PANTRY (TOUCH TARGETS >= 48px) */}
        <div className="relative z-10 w-full max-w-xl grid grid-cols-4 gap-2.5 pb-1">
          {RECIPE_STEPS.map((step) => {
            const isCurrent = step.ingredientId === currentStep.ingredientId;

            return (
              <button
                key={step.ingredientId}
                onClick={() => handleSelectIngredient(step)}
                disabled={isBakingComplete || isReadyToContinue}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shadow-md min-h-[50px] ${
                  isCurrent && isBakingComplete
                    ? 'bg-emerald-500 border-white text-white scale-105 shadow-emerald-500/50'
                    : 'bg-white/95 hover:bg-amber-100 border-rose-300 text-rose-950 hover:scale-105'
                }`}
              >
                <span className="text-2xl sm:text-3xl select-none">{step.icon}</span>
                <span className="text-xs font-black capitalize">{step.nameEn}</span>
                <span className="text-[9px] font-bold text-slate-500">({step.nameVi})</span>
              </button>
            );
          })}
        </div>
      </div>
    </KidsGameWrapper>
  );
};
