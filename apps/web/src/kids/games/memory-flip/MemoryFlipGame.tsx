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
    // Look up freshest state to prevent stale closure or rapid tap double-triggers
    const targetCard = cards.find((c) => c.uniqueId === clickedCard.uniqueId);
    if (
      !targetCard ||
      targetCard.isFlipped ||
      targetCard.isMatched ||
      isReadyToContinue ||
      flippedIds.includes(targetCard.uniqueId)
    ) {
      return;
    }

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
    voiceService.speakWord(targetCard.item.word);

    // Flip card immediately
    const updatedCards = activeCards.map((c) =>
      c.uniqueId === targetCard.uniqueId ? { ...c, isFlipped: true } : c
    );
    setCards(updatedCards);

    const newFlipped = [...currentFlipped, targetCard.uniqueId];
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
      {/* MAGICAL CELESTIAL AURORA CARD ARENA (SUPER-SPACIOUS & ULTRA-PREMIUM) */}
      <div className="relative w-full h-full p-4 sm:p-8 lg:p-10 flex flex-col justify-between items-center overflow-hidden bg-gradient-to-b from-[#0B0F2A] via-[#151B42] to-[#0A122E] select-none min-h-[540px] sm:min-h-[600px]">
        {/* Luminous Nebula Glows & Stardust Background */}
        <div className="absolute -top-24 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#a5b4fc_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        {/* Top Hint Banner with Frosted Glass */}
        <div className="relative z-10 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-sky-200 text-xs sm:text-sm font-bold text-center flex items-center gap-2 shadow-lg">
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
          <span>Chạm vào thẻ bài để lật tìm cặp từ vựng giống nhau!</span>
        </div>

        {/* SPACIOUS 3D CARD GRID (Generous spacing, relaxed breathing room) */}
        <div className="relative z-10 w-full max-w-4xl my-auto py-6 sm:py-8 grid grid-cols-2 sm:grid-cols-4 gap-5 sm:gap-7 lg:gap-8 items-center justify-items-center [perspective:1200px]">
          {cards.map((card) => {
            const isCardActive = card.isFlipped || card.isMatched;

            return (
              <div
                key={card.uniqueId}
                onClick={() => handleCardClick(card)}
                className="w-32 sm:w-40 lg:w-44 h-44 sm:h-52 lg:h-56 cursor-pointer relative group [perspective:1200px] select-none touch-manipulation"
              >
                <div
                  className={`w-full h-full rounded-[26px] sm:rounded-[32px] transition-transform duration-160 ease-[cubic-bezier(0.2,0.9,0.3,1.2)] [transform-style:preserve-3d] [will-change:transform] ${
                    isCardActive ? '[transform:rotateY(180deg)]' : ''
                  } ${
                    card.isMatched
                      ? 'ring-4 ring-emerald-400 ring-offset-2 ring-offset-[#0B0F2A] shadow-[0_0_35px_rgba(52,211,153,0.85)] scale-102'
                      : 'hover:scale-105 active:scale-95 shadow-[0_16px_32px_rgba(0,0,0,0.5)]'
                  }`}
                >
                  {/* ========================================================= */}
                  {/* CARD BACK FACE: Ultra-Luxury Royal Celestial Emblem       */}
                  {/* ========================================================= */}
                  <div className="absolute inset-0 rounded-[26px] sm:rounded-[32px] bg-gradient-to-br from-indigo-600 via-purple-700 to-indigo-900 border-3 border-amber-300/90 shadow-[inset_0_0_18px_rgba(251,191,36,0.35),0_12px_28px_rgba(0,0,0,0.5)] flex flex-col items-center justify-between p-4 [backface-visibility:hidden] overflow-hidden">
                    {/* Golden Holographic Inner Border */}
                    <div className="absolute inset-1.5 rounded-[20px] sm:rounded-[26px] border border-amber-300/40 pointer-events-none" />

                    {/* Specular Diagonal Light Sheen */}
                    <div className="absolute -top-12 -left-12 w-32 h-32 bg-white/15 rounded-full blur-xl pointer-events-none group-hover:translate-x-20 group-hover:translate-y-20 transition-transform duration-700" />

                    {/* Top Star Accent */}
                    <div className="flex items-center gap-1.5 text-amber-300/80 text-[10px] font-black uppercase tracking-widest">
                      <Star className="w-3 h-3 fill-amber-300" />
                      <span>VOCALFLOW</span>
                      <Star className="w-3 h-3 fill-amber-300" />
                    </div>

                    {/* Center Celestial Star Compass Emblem */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 p-0.5 shadow-[0_8px_20px_rgba(245,158,11,0.4)] flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <div className="w-full h-full rounded-[14px] bg-indigo-950 flex items-center justify-center relative overflow-hidden">
                        {/* Radial Ray Accents */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-400/30 via-transparent to-transparent" />
                        <Sparkles className="w-9 h-9 sm:w-11 sm:h-11 text-amber-300 filter drop-shadow-[0_2px_8px_rgba(251,191,36,0.8)] animate-pulse" />
                      </div>
                    </div>

                    {/* Bottom Tactile Label */}
                    <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-200 text-[11px] font-black tracking-wide shadow-xs">
                      <span>CHẠM ĐỂ LẬT</span>
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* CARD FRONT FACE: Radiant Pearl Porcelain Surface          */}
                  {/* ========================================================= */}
                  <div className="absolute inset-0 rounded-[26px] sm:rounded-[32px] bg-gradient-to-b from-white via-slate-50 to-indigo-50/50 border-3 border-indigo-200/90 [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col items-center justify-between p-3.5 sm:p-4 text-center shadow-[0_16px_36px_rgba(0,0,0,0.35)] overflow-hidden">
                    {/* Subtle Top Indicator Tag */}
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      Từ vựng
                    </span>

                    {/* Elevated Soft Illustration Pedestal */}
                    <div className="w-20 h-20 sm:w-26 sm:h-26 rounded-2xl bg-indigo-50/60 border border-indigo-100/60 p-2 flex items-center justify-center shadow-inner filter drop-shadow-xs">
                      <KidsIllustration
                        name={card.item.word.toLowerCase()}
                        className="w-full h-full object-contain filter drop-shadow-sm"
                        alt={card.item.word}
                      />
                    </div>

                    {/* Bilingual Typography */}
                    <div className="space-y-0.5 w-full">
                      <h4 className="text-base sm:text-lg font-black text-indigo-950 capitalize leading-tight tracking-tight">
                        {card.item.word}
                      </h4>
                      <span className="inline-block text-xs font-black text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200/70 truncate max-w-[90%]">
                        {card.item.viMeaning}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Level Info */}
        <div className="relative z-10 px-5 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-xs font-bold text-sky-200 text-center shadow-sm">
          Vòng {currentRound}/{TOTAL_ROUNDS} • Ghép đủ các cặp thẻ bài để qua màn!
        </div>
      </div>
    </KidsGameWrapper>
  );
};

export default MemoryFlipGame;
