// ============================================================================
// GAME 02: MEMORY FLIP (LẬT THẺ TRÍ NHỚ 3D SIÊU TỐI ƯU)
// FLIP -> REMEMBER -> MATCH • 0ms Click Latency • Preloaded Audio • Fluid 60fps
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { KidsGameWrapper } from '../core/KidsGameWrapper';
import { KIDS_GAMES_REGISTRY } from '../../data/games/gamesRegistry';
import { COMPREHENSIVE_VOCABULARY, VocabularyItem } from '../../data/vocabulary/vocabularyData';
import { KidsIllustration } from '../../assets/illustrations/KidsIllustration';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';
import { Sparkles, Star } from 'lucide-react';

interface MemoryCard {
  uniqueId: string;
  item: VocabularyItem;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryFlipGameProps {
  onExit: () => void;
  onStarsAwarded?: (stars: number) => void;
  onNextGame?: () => void;
}

export const MemoryFlipGame: React.FC<MemoryFlipGameProps> = ({
  onExit,
  onStarsAwarded,
  onNextGame,
}) => {
  const gameDef = KIDS_GAMES_REGISTRY.find((g) => g.id === 'memory_flip') || KIDS_GAMES_REGISTRY[1];

  const TOTAL_ROUNDS = 3;
  const [currentRound, setCurrentRound] = useState(1);
  const [starsEarned, setStarsEarned] = useState(0);
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isReadyToContinue, setIsReadyToContinue] = useState(false);
  const [praiseVi, setPraiseVi] = useState('');

  // Ref to pending mismatch timer for ZERO-DROPPED-CLICKS
  const mismatchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize board for round with PRELOADED VOICES
  const initRound = useCallback((roundNum: number) => {
    if (mismatchTimeoutRef.current) {
      clearTimeout(mismatchTimeoutRef.current);
      mismatchTimeoutRef.current = null;
    }
    setFlippedIds([]);
    setIsReadyToContinue(false);

    const numPairs = roundNum === 1 ? 2 : roundNum === 2 ? 3 : 4;
    const shuffledVocab = [...COMPREHENSIVE_VOCABULARY].sort(() => Math.random() - 0.5).slice(0, numPairs);

    // PRELOAD VOICES IMMEDIATELY (0ms click delay)
    voiceService.preloadWords(shuffledVocab.map((v) => v.word));

    const deck: MemoryCard[] = [];
    shuffledVocab.forEach((item, idx) => {
      deck.push({
        uniqueId: `${item.id}_a_${idx}`,
        item,
        isFlipped: false,
        isMatched: false,
      });
      deck.push({
        uniqueId: `${item.id}_b_${idx}`,
        item,
        isFlipped: false,
        isMatched: false,
      });
    });

    setCards(deck.sort(() => Math.random() - 0.5));
  }, []);

  useEffect(() => {
    initRound(1);
    return () => {
      if (mismatchTimeoutRef.current) {
        clearTimeout(mismatchTimeoutRef.current);
      }
    };
  }, [initRound]);

  const handleCardClick = (clickedCard: MemoryCard) => {
    if (clickedCard.isFlipped || clickedCard.isMatched || isReadyToContinue) return;

    // Fluid Handling: If user clicks while 2 mismatched cards are showing,
    // immediately clear them and flip the new card without dropping the tap!
    let activeCards = cards;
    let currentFlipped = flippedIds;

    if (mismatchTimeoutRef.current && currentFlipped.length === 2) {
      clearTimeout(mismatchTimeoutRef.current);
      mismatchTimeoutRef.current = null;
      activeCards = cards.map((c) =>
        currentFlipped.includes(c.uniqueId) ? { ...c, isFlipped: false } : c
      );
      currentFlipped = [];
    }

    // Play instant flip audio & brisk voice
    soundManager.play('pop');
    voiceService.speakWord(clickedCard.item.word);

    // Flip card immediately
    const updatedCards = activeCards.map((c) =>
      c.uniqueId === clickedCard.uniqueId ? { ...c, isFlipped: true } : c
    );
    setCards(updatedCards);

    const newFlipped = [...currentFlipped, clickedCard.uniqueId];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      const [firstId, secondId] = newFlipped;
      const firstCard = updatedCards.find((c) => c.uniqueId === firstId)!;
      const secondCard = clickedCard;

      if (firstCard.item.id === secondCard.item.id) {
        // MATCH! Instant feedback
        setTimeout(() => {
          soundManager.play('correct');
          soundManager.play('star_burst');

          const matchedCards = updatedCards.map((c) =>
            c.uniqueId === firstId || c.uniqueId === secondId ? { ...c, isMatched: true } : c
          );
          setCards(matchedCards);
          setFlippedIds([]);

          // Check if board completed
          if (matchedCards.every((c) => c.isMatched)) {
            const stars = 3;
            setStarsEarned((prev) => prev + stars);
            if (onStarsAwarded) onStarsAwarded(stars);

            const praise = 'Bé nhớ siêu đỉnh! Tìm thấy hết các cặp rồi!';
            setPraiseVi(praise);
            voiceService.speakVietnamese(praise);

            // Responsive continue: enable within 600ms so child never waits!
            setTimeout(() => {
              setIsReadyToContinue(true);
            }, 600);
          }
        }, 220);
      } else {
        // MISMATCH! Short auto-unflip timer (480ms)
        mismatchTimeoutRef.current = setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.uniqueId === firstId || c.uniqueId === secondId ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIds([]);
          mismatchTimeoutRef.current = null;
        }, 480);
      }
    }
  };

  const handleAdvanceRound = () => {
    setIsReadyToContinue(false);
    if (currentRound < TOTAL_ROUNDS) {
      const next = currentRound + 1;
      setCurrentRound(next);
      initRound(next);
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
      worldTheme="starter"
      instructionEn="Find matching pairs!"
      instructionVi="Bé hãy lật thẻ tìm cặp hình giống nhau nhé!"
      isReadyToContinue={isReadyToContinue}
      onContinueRound={handleAdvanceRound}
      praiseVi={praiseVi}
      onReplayAudio={() => voiceService.speakEnglish('Find matching pairs')}
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
      {/* 3D WOODEN CARD TABLE SCENE */}
      <div className="relative w-full h-full p-4 sm:p-8 flex flex-col justify-between items-center overflow-hidden bg-gradient-to-br from-amber-800 via-amber-900 to-yellow-950 select-none">
        {/* Subtle warm table backdrop texture */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* Top Hint */}
        <div className="relative z-10 px-5 py-2 rounded-full bg-black/40 backdrop-blur-md border border-amber-400/40 text-amber-200 text-xs font-bold text-center flex items-center gap-2 shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Chạm vào thẻ bài để lật tìm cặp từ vựng giống nhau!</span>
        </div>

        {/* 3D Depth Card Grid Table */}
        <div className="relative z-10 w-full max-w-2xl my-auto grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 items-center justify-items-center [perspective:1000px]">
          {cards.map((card) => (
            <div
              key={card.uniqueId}
              onClick={() => handleCardClick(card)}
              className="w-28 sm:w-36 h-36 sm:h-44 cursor-pointer relative group [perspective:1000px]"
            >
              <div
                className={`w-full h-full rounded-2xl sm:rounded-3xl transition-transform duration-250 ease-out [transform-style:preserve-3d] [will-change:transform] ${
                  card.isFlipped || card.isMatched ? '[transform:rotateY(180deg)]' : ''
                } ${
                  card.isMatched
                    ? 'ring-4 ring-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.7)] scale-95'
                    : 'hover:scale-105 active:scale-95 shadow-[0_10px_20px_rgba(0,0,0,0.4)]'
                }`}
              >
                {/* Card Back Face (Hidden when flipped) */}
                <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 border-2 border-amber-200 flex flex-col items-center justify-center p-3 [backface-visibility:hidden] shadow-inner">
                  {/* Clean SVG Vector Emblem */}
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-xs group-hover:scale-110 transition-transform">
                    <Sparkles className="w-7 h-7 text-white filter drop-shadow-xs" />
                  </div>
                  <div className="flex items-center gap-1 mt-2.5 text-amber-200 text-xs font-black">
                    <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-200" />
                    <span>VOCALFLOW</span>
                  </div>
                </div>

                {/* Card Front Face (Revealed on flip: 180 deg) */}
                <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-white border-2 border-emerald-400 [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col items-center justify-center p-2 text-center shadow-lg">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center filter drop-shadow-xs">
                    <KidsIllustration
                      name={card.item.word.toLowerCase()}
                      className="w-full h-full object-contain"
                      alt={card.item.word}
                    />
                  </div>

                  <span className="text-sm sm:text-base font-black text-slate-900 capitalize mt-1 leading-tight">
                    {card.item.word}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700">
                    {card.item.viMeaning}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10 text-[11px] font-bold text-amber-200/80 text-center pb-1">
          Vòng {currentRound}/{TOTAL_ROUNDS}: Ghép đủ các cặp thẻ bài để qua màn!
        </div>
      </div>
    </KidsGameWrapper>
  );
};

export default MemoryFlipGame;
