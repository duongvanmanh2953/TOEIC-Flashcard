// ============================================================================
// GAME 16: WORD CATCHER (HỨNG TỪ RƠI NHANH)
// Vocabulary + Reflex • Falling Items • Interactive Basket Catching
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';
import { KidsGameWrapper } from '../core/KidsGameWrapper';
import { KIDS_GAMES_REGISTRY } from '../../data/games/gamesRegistry';
import { COMPREHENSIVE_VOCABULARY, VocabularyItem } from '../../data/vocabulary/vocabularyData';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';

interface FallingItem {
  id: string;
  word: string;
  viMeaning: string;
  icon: string;
  lane: 0 | 1 | 2; // Left, Center, Right
}

interface WordCatcherGameProps {
  onExit: () => void;
  onStarsAwarded?: (stars: number) => void;
  onNextGame?: () => void;
}

export const WordCatcherGame: React.FC<WordCatcherGameProps> = ({
  onExit,
  onStarsAwarded,
  onNextGame,
}) => {
  const gameDef = KIDS_GAMES_REGISTRY.find((g) => g.id === 'word_catcher') || KIDS_GAMES_REGISTRY[17];

  const TOTAL_ROUNDS = 5;
  const [currentRound, setCurrentRound] = useState(1);
  const [starsEarned, setStarsEarned] = useState(0);

  const [targetItem, setTargetItem] = useState<VocabularyItem>(COMPREHENSIVE_VOCABULARY[0]);
  const [fallingItems, setFallingItems] = useState<FallingItem[]>([]);
  const [basketLane, setBasketLane] = useState<0 | 1 | 2>(1); // 0=left, 1=center, 2=right
  const [isCaught, setIsCaught] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isReadyToContinue, setIsReadyToContinue] = useState(false);
  const [praiseVi, setPraiseVi] = useState('Bé hứng từ rất nhanh!');

  // Initialize round
  const initRound = useCallback((roundNum: number) => {
    setIsCaught(false);
    setIsReadyToContinue(false);
    const shuffled = [...COMPREHENSIVE_VOCABULARY].sort(() => Math.random() - 0.5);
    const target = shuffled[0];
    const choices = shuffled.slice(0, 3);

    setTargetItem(target);

    // 3 falling items across 3 lanes
    const items: FallingItem[] = choices.map((item, idx) => ({
      id: `${item.id}_${idx}`,
      word: item.word,
      viMeaning: item.viMeaning,
      icon: item.word === 'cat' ? '🐱' : item.word === 'dog' ? '🐶' : item.word === 'apple' ? '🍎' : item.word === 'lion' ? '🦁' : '⭐',
      lane: idx as 0 | 1 | 2,
    }));

    setFallingItems(items);
  }, []);

  useEffect(() => {
    initRound(1);
  }, [initRound]);

  const handleContinueRound = () => {
    soundManager.play('pop');
    if (currentRound < TOTAL_ROUNDS) {
      const nextR = currentRound + 1;
      setCurrentRound(nextR);
      initRound(nextR);
    } else {
      setIsGameComplete(true);
      soundManager.play('celebration');
    }
  };

  // Catch action on item
  const handleCatchItem = (item: FallingItem) => {
    if (isCaught || isReadyToContinue) return;

    setBasketLane(item.lane);

    if (item.word.toLowerCase() === targetItem.word.toLowerCase()) {
      // CAUGHT CORRECT!
      setIsCaught(true);
      soundManager.play('star_burst');
      soundManager.play('pop');

      const earned = 2;
      setStarsEarned((prev) => prev + earned);
      if (onStarsAwarded) onStarsAwarded(earned);

      const praise = `Bé phản xạ rất nhanh! Hứng đúng ${item.viMeaning} rồi!`;
      setPraiseVi(praise);

      voiceService.speakWord(item.word, {
        onEnd: () => {
          voiceService.speakVietnamese(praise, {
            onEnd: () => {
              if (currentRound < TOTAL_ROUNDS) {
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
      voiceService.speakVietnamese('Chưa đúng từ rồi bé ơi!');
    }
  };

  return (
    <KidsGameWrapper
      game={gameDef}
      currentRound={currentRound}
      totalRounds={TOTAL_ROUNDS}
      starsEarned={starsEarned}
      instructionEn={`Catch: ${targetItem.word.toUpperCase()}!`}
      instructionVi={`Di chuyển giỏ hứng: ${targetItem.viMeaning}`}
      onExit={onExit}
      onNextGame={onNextGame}
      onPlayAgain={() => {
        setCurrentRound(1);
        setStarsEarned(0);
        setIsGameComplete(false);
        setIsReadyToContinue(false);
        initRound(1);
      }}
      isGameComplete={isGameComplete}
      isReadyToContinue={isReadyToContinue}
      onContinueRound={handleContinueRound}
      praiseVi={praiseVi}
      onReplayAudio={() => voiceService.speakWord(targetItem.word)}
    >
      <div className="relative w-full aspect-[800/500] max-h-[65vh] mx-auto rounded-3xl overflow-hidden bg-gradient-to-b from-sky-400 via-sky-200 to-emerald-100 select-none flex flex-col justify-between p-6">
        {/* Sky Clouds Background */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-4 left-10 text-5xl">☁️</div>
          <div className="absolute top-8 right-12 text-6xl">☁️</div>
        </div>

        {/* Target Header */}
        <div className="text-center z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/95 border-2 border-sky-400 shadow-md">
            <span className="text-2xl animate-bounce">🧺</span>
            <span className="text-sm sm:text-base font-black text-slate-900">
              HỨNG TỪ: <span className="text-sky-700 underline">{targetItem.word.toUpperCase()}</span> ({targetItem.viMeaning})
            </span>
          </div>
        </div>

        {/* 3 Falling Lanes Area */}
        <div className="relative flex-1 w-full grid grid-cols-3 gap-4 items-center z-10 my-4">
          {fallingItems.map((item) => {
            const isTarget = item.word.toLowerCase() === targetItem.word.toLowerCase();
            const isTargetCaught = isCaught && isTarget;

            return (
              <div key={item.id} className="flex flex-col items-center justify-center">
                <button
                  onClick={() => handleCatchItem(item)}
                  className={`p-4 rounded-3xl bg-white/95 border-3 shadow-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 animate-balloon-float ${
                    isTargetCaught
                      ? 'border-emerald-500 bg-emerald-100 scale-125 animate-bounce'
                      : 'border-sky-300'
                  }`}
                >
                  <span className="text-5xl sm:text-6xl">{item.icon}</span>
                  <span className="text-sm sm:text-base font-black text-slate-800">
                    {item.word}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    ({item.viMeaning})
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Movable Catching Basket at Bottom */}
        <div className="grid grid-cols-3 gap-4 z-10">
          {[0, 1, 2].map((laneIdx) => {
            const hasBasket = basketLane === laneIdx;

            return (
              <div
                key={laneIdx}
                onClick={() => setBasketLane(laneIdx as 0 | 1 | 2)}
                className="flex items-center justify-center cursor-pointer p-2"
              >
                {hasBasket ? (
                  <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 text-white font-black text-sm shadow-xl animate-bounce">
                    <span className="text-2xl">🧺</span>
                    <span>GIỎ HỨNG</span>
                  </div>
                ) : (
                  <div className="w-16 h-3 rounded-full bg-slate-300/60 hover:bg-amber-300 transition-colors" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </KidsGameWrapper>
  );
};
