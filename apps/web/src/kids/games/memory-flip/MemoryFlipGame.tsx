// ============================================================================
// GAME 02: MEMORY FLIP (LẬT THẺ TRÍ NHỚ 3D)
// FLIP -> REMEMBER -> MATCH • 3D Depth Card Table • Non-Auto-Advancing States
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { KidsGameWrapper } from '../core/KidsGameWrapper';
import { KIDS_GAMES_REGISTRY } from '../../data/games/gamesRegistry';
import { COMPREHENSIVE_VOCABULARY, VocabularyItem } from '../../data/vocabulary/vocabularyData';
import { KidsIllustration } from '../../assets/illustrations/KidsIllustration';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';

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

  const TOTAL_ROUNDS = 3; // 3 progressive difficulty levels: 4 cards (2 pairs), 6 cards (3 pairs), 8 cards (4 pairs)
  const [currentRound, setCurrentRound] = useState(1);
  const [starsEarned, setStarsEarned] = useState(0);
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isReadyToContinue, setIsReadyToContinue] = useState(false);
  const [praiseVi, setPraiseVi] = useState('');

  // Initialize board for round
  const initRound = useCallback((roundNum: number) => {
    setFlippedIds([]);
    setIsLocked(false);
    setIsReadyToContinue(false);

    const numPairs = roundNum === 1 ? 2 : roundNum === 2 ? 3 : 4;
    const shuffledVocab = [...COMPREHENSIVE_VOCABULARY].sort(() => Math.random() - 0.5).slice(0, numPairs);

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
  }, [initRound]);

  const handleCardClick = (clickedCard: MemoryCard) => {
    if (isLocked || clickedCard.isFlipped || clickedCard.isMatched || isReadyToContinue) return;

    soundManager.play('whoosh');
    voiceService.speakWord(clickedCard.item.word);

    // Flip card
    const updatedCards = cards.map((c) =>
      c.uniqueId === clickedCard.uniqueId ? { ...c, isFlipped: true } : c
    );
    setCards(updatedCards);

    const newFlipped = [...flippedIds, clickedCard.uniqueId];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setIsLocked(true);
      const [firstId, secondId] = newFlipped;
      const firstCard = cards.find((c) => c.uniqueId === firstId)!;
      const secondCard = clickedCard;

      if (firstCard.item.id === secondCard.item.id) {
        // MATCH!
        setTimeout(() => {
          soundManager.play('star_burst');
          soundManager.play('correct');
          voiceService.speakWord(firstCard.item.word);

          const matchedCards = updatedCards.map((c) =>
            c.uniqueId === firstId || c.uniqueId === secondId ? { ...c, isMatched: true } : c
          );
          setCards(matchedCards);
          setFlippedIds([]);
          setIsLocked(false);

          // Check if board completed
          if (matchedCards.every((c) => c.isMatched)) {
            const stars = 3;
            setStarsEarned((prev) => prev + stars);
            if (onStarsAwarded) onStarsAwarded(stars);

            const praise = 'Bé nhớ siêu đỉnh! Tìm thấy hết các cặp rồi!';
            setPraiseVi(praise);

            voiceService.speakVietnamese(praise, {
              onEnd: () => {
                setIsReadyToContinue(true);
              },
            });
          }
        }, 500);
      } else {
        // MISMATCH!
        setTimeout(() => {
          soundManager.play('pop');
          const resetCards = updatedCards.map((c) =>
            c.uniqueId === firstId || c.uniqueId === secondId ? { ...c, isFlipped: false } : c
          );
          setCards(resetCards);
          setFlippedIds([]);
          setIsLocked(false);
        }, 850);
      }
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
      {/* FULL-BLEED 3D WOODEN CARD TABLE SCENE */}
      <div className="relative w-full h-full p-4 sm:p-8 flex flex-col justify-between items-center overflow-hidden bg-gradient-to-br from-amber-800 via-amber-900 to-yellow-950 select-none">
        {/* Wood Texture Accent Lines */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* Top Hint */}
        <div className="relative z-10 px-5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-amber-400/40 text-amber-200 text-xs font-bold text-center">
          🎴 Chạm để lật 2 thẻ bài có hình ảnh và từ vựng giống hệt nhau!
        </div>

        {/* 3D Depth Card Grid Table */}
        <div className="relative z-10 w-full max-w-2xl my-auto grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 items-center justify-items-center perspective-1000">
          {cards.map((card) => (
            <div
              key={card.uniqueId}
              onClick={() => handleCardClick(card)}
              className="w-28 sm:w-36 h-36 sm:h-44 cursor-pointer relative group perspective-1000"
            >
              <div
                className={`w-full h-full rounded-2xl sm:rounded-3xl transition-transform duration-500 transform-style-3d ${
                  card.isFlipped || card.isMatched ? '[transform:rotateY(180deg)]' : ''
                } ${
                  card.isMatched
                    ? 'ring-4 ring-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.7)] scale-95'
                    : 'hover:scale-105 active:scale-95 shadow-[0_10px_20px_rgba(0,0,0,0.4)]'
                }`}
              >
                {/* Card Back Face (Hidden when flipped) */}
                <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 border-3 border-amber-200 flex flex-col items-center justify-center p-3 backface-hidden shadow-inner">
                  <span className="text-4xl sm:text-5xl select-none group-hover:scale-110 transition-transform">
                    🐾
                  </span>
                  <div className="flex gap-1 mt-2 text-amber-200 text-sm">
                    <span>⭐</span>
                    <span>⭐</span>
                  </div>
                </div>

                {/* Card Front Face (Revealed on flip: 180 deg) */}
                <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-white border-3 border-emerald-400 [transform:rotateY(180deg)] backface-hidden flex flex-col items-center justify-center p-2 text-center shadow-lg">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                    <KidsIllustration
                      name={card.item.word.toLowerCase()}
                      className="w-full h-full object-contain"
                      alt={card.item.word}
                    />
                  </div>

                  <span className="text-sm sm:text-base font-black text-slate-900 capitalize mt-1">
                    {card.item.word}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    {card.item.viMeaning}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10 text-[11px] font-bold text-amber-200/80 text-center pb-1">
          ✨ Vòng {currentRound}/{TOTAL_ROUNDS}: Ghép đủ các cặp thẻ bài để qua màn!
        </div>
      </div>
    </KidsGameWrapper>
  );
};
