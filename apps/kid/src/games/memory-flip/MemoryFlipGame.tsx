// ============================================================================
// GAME 02: MEMORY MATCH / FLIP CARD (LẬT THẺ TRÍ NHỚ ĐÍCH THỰC)
// Full 100dvh Viewport • Organic Curved Game Table • Safe Area Grid • Pure SVG Icons
// ============================================================================

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  RotateCcw,
  Trophy,
  Flame,
  Layers,
  Sparkles,
  Check,
  RotateCw,
} from 'lucide-react';
import { COMPREHENSIVE_VOCABULARY, VocabularyItem } from '../../data/vocabulary/vocabularyData';
import { KidsIllustration } from '../../assets/illustrations/KidsIllustration';
import { LetStuNLogo, VictoryStarModal } from '@letstun/shared';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';
import { kidAsset } from '../../utils/kidAsset';
import { GameShell } from '../../components/kid-game/GameShell';

interface MemoryFlipGameProps {
  onExit: () => void;
  onStarsAwarded?: (stars: number) => void;
  onNextGame?: () => void;
}

interface MatchingCard {
  uniqueId: string;
  pairId: string;
  item: VocabularyItem;
  isFlipped: boolean;
  isMatched: boolean;
  isShaking: boolean;
  isRemoved: boolean;
}

const CARD_BACK_IMAGE = kidAsset('/kid/games/flip-card/card-back.webp');
const MAX_ROUNDS = 3;

/**
 * Individual Memoized Card Component for 60fps GPU Performance
 * Tonal styling, zero white/gray borders, responsive viewport constraints.
 */
interface GameCardItemProps {
  card: MatchingCard;
  onCardClick: (uniqueId: string) => void;
  onVoiceClick: (word: string, e: React.MouseEvent) => void;
  isMuted: boolean;
}

const GameCardItem = memo<GameCardItemProps>(({ card, onCardClick, onVoiceClick, isMuted }) => {
  const isFlippedOrMatched = card.isFlipped || card.isMatched;

  return (
    <div
      onClick={() => onCardClick(card.uniqueId)}
      role="button"
      tabIndex={card.isRemoved ? -1 : 0}
      aria-label={card.isFlipped ? card.item.word : 'Lá bài úp'}
      className={`kids-flip-card w-24 sm:w-32 md:w-36 lg:w-40 h-32 sm:h-44 md:h-50 lg:h-56 max-h-[26vh] aspect-[3/4] relative select-none cursor-pointer transition-all duration-200 ${
        card.isRemoved
          ? 'opacity-0 scale-95 pointer-events-none'
          : card.isMatched
          ? 'scale-104 shadow-[0_0_24px_rgba(52,211,153,0.65)]'
          : 'hover:-translate-y-1 active:scale-[0.97]'
      }`}
    >
      <div
        className={`kids-flip-inner ${isFlippedOrMatched ? 'is-flipped' : ''} ${
          card.isShaking ? 'animate-subtle-shake' : ''
        }`}
      >
        {/* ========================================================= */}
        {/* CARD BACK: Pure Ornate Magic Card Face - Clean Edge-to-Edge */}
        {/* ========================================================= */}
        <div
          className="kids-flip-front w-full h-full rounded-[18px] sm:rounded-[26px] overflow-hidden ring-1 ring-amber-400/40 shadow-[0_12px_24px_rgba(0,0,0,0.55)] bg-slate-900"
          style={{
            backgroundImage: `url(${CARD_BACK_IMAGE})`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* ========================================================= */}
        {/* CARD FRONT: Pearl Porcelain Surface with Tonal Rim       */}
        {/* ========================================================= */}
        <div
          className={`kids-flip-back rounded-[18px] sm:rounded-[26px] bg-gradient-to-b from-[#F8FAFC] via-white to-[#EFF6FF] p-2.5 sm:p-3.5 flex flex-col items-center justify-between text-center overflow-hidden ring-1 shadow-[0_16px_32px_rgba(0,0,0,0.4)] ${
            card.isMatched
              ? 'ring-2 ring-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.5)]'
              : 'ring-indigo-300/30'
          }`}
        >
          {/* Top Row: Speaker Icon */}
          <div className="w-full flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100/90 px-2 py-0.5 rounded-full">
              Từ vựng
            </span>

            {!isMuted && (
              <button
                type="button"
                onClick={(e) => onVoiceClick(card.item.word, e)}
                className="p-1 rounded-full text-indigo-600 hover:bg-indigo-50 active:scale-90 transition-transform cursor-pointer"
                title="Phát lại âm thanh"
              >
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>

          {/* Center Illustration */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl bg-indigo-50/70 p-1.5 sm:p-2 flex items-center justify-center shadow-inner filter drop-shadow-xs">
            <KidsIllustration
              name={card.item.word.toLowerCase()}
              className="w-full h-full object-contain filter drop-shadow-xs"
              alt={card.item.word}
            />
          </div>

          {/* Typography */}
          <div className="space-y-0.5 w-full">
            <h3 className="text-xs sm:text-sm lg:text-base font-black text-slate-900 capitalize tracking-tight truncate">
              {card.item.word}
            </h3>
            <span className="inline-block text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full truncate max-w-full">
              {card.item.viMeaning}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

GameCardItem.displayName = 'GameCardItem';

export const MemoryFlipGame: React.FC<MemoryFlipGameProps> = ({
  onExit,
  onStarsAwarded,
  onNextGame,
}) => {
  // Game states
  const [round, setRound] = useState(1);
  const [cards, setCards] = useState<MatchingCard[]>([]);
  const [flippedCardIds, setFlippedCardIds] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isRoundComplete, setIsRoundComplete] = useState(false);

  // Mismatch timer ref for fluid gameplay
  const mismatchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      voiceService.stop();
      if (mismatchTimerRef.current) {
        clearTimeout(mismatchTimerRef.current);
      }
    };
  }, []);

  // Preload asset image immediately
  useEffect(() => {
    const img = new Image();
    img.src = CARD_BACK_IMAGE;
  }, []);

  // Setup round board
  const setupRound = useCallback((roundNum: number) => {
    if (mismatchTimerRef.current) {
      clearTimeout(mismatchTimerRef.current);
      mismatchTimerRef.current = null;
    }

    setFlippedCardIds([]);
    setIsRoundComplete(false);

    // Round 1: 4 pairs (8 cards), Round 2 & 3: 6 pairs (12 cards)
    const pairsCount = roundNum === 1 ? 4 : 6;
    const selectedVocab = [...COMPREHENSIVE_VOCABULARY]
      .sort(() => Math.random() - 0.5)
      .slice(0, pairsCount);

    // Preload audio words for round
    voiceService.preloadWords(selectedVocab.map((v) => v.word));

    // Create 2 matching cards for each vocabulary item
    const deck: MatchingCard[] = [];
    selectedVocab.forEach((item, idx) => {
      deck.push({
        uniqueId: `${item.id}_cardA_${idx}`,
        pairId: item.id,
        item,
        isFlipped: false,
        isMatched: false,
        isShaking: false,
        isRemoved: false,
      });
      deck.push({
        uniqueId: `${item.id}_cardB_${idx}`,
        pairId: item.id,
        item,
        isFlipped: false,
        isMatched: false,
        isShaking: false,
        isRemoved: false,
      });
    });

    // Shuffle deck
    setCards(deck.sort(() => Math.random() - 0.5));
  }, []);

  useEffect(() => {
    setupRound(1);
  }, [setupRound]);

  // Handle card click with 0ms latency
  const handleCardClick = useCallback(
    (clickedId: string) => {
      const targetCard = cards.find((c) => c.uniqueId === clickedId);
      if (
        !targetCard ||
        targetCard.isFlipped ||
        targetCard.isMatched ||
        targetCard.isRemoved ||
        isRoundComplete
      ) {
        return;
      }

      let currentCards = cards;
      let currentFlipped = flippedCardIds;

      // Fluid handling: if player clicks while 2 mismatched cards are waiting to flip back
      if (mismatchTimerRef.current && currentFlipped.length === 2) {
        clearTimeout(mismatchTimerRef.current);
        mismatchTimerRef.current = null;
        currentCards = currentCards.map((c) =>
          currentFlipped.includes(c.uniqueId)
            ? { ...c, isFlipped: false, isShaking: false }
            : c
        );
        currentFlipped = [];
      }

      // 1. Flip card immediately (0ms click latency)
      soundManager.play('pop');

      // 2. Pronounce word synchronously without awaiting
      if (!isMuted) {
        voiceService.speakWord(targetCard.item.word);
      }

      // 3. Update flipped state
      const nextCards = currentCards.map((c) =>
        c.uniqueId === clickedId ? { ...c, isFlipped: true } : c
      );
      setCards(nextCards);

      const nextFlipped = [...currentFlipped, clickedId];
      setFlippedCardIds(nextFlipped);

      // Check pair match if 2 cards are now open
      if (nextFlipped.length === 2) {
        setMoves((prev) => prev + 1);

        const [id1, id2] = nextFlipped;
        const card1 = nextCards.find((c) => c.uniqueId === id1)!;
        const card2 = nextCards.find((c) => c.uniqueId === id2)!;

        if (card1.pairId === card2.pairId) {
          // ================= MATCH! =================
          soundManager.play('correct');
          const points = 100 + streak * 20;
          setScore((prev) => prev + points);
          setStreak((prev) => prev + 1);

          const matchedCards = nextCards.map((c) =>
            c.uniqueId === id1 || c.uniqueId === id2 ? { ...c, isMatched: true } : c
          );
          setCards(matchedCards);
          setFlippedCardIds([]);

          // Smoothly remove matched cards after 300ms
          setTimeout(() => {
            setCards((prev) => {
              const updated = prev.map((c) =>
                c.uniqueId === id1 || c.uniqueId === id2 ? { ...c, isRemoved: true } : c
              );

              if (updated.every((c) => c.isMatched)) {
                soundManager.play('celebration');
                setIsRoundComplete(true);
                if (onStarsAwarded) onStarsAwarded(1);
              }

              return updated;
            });
          }, 320);
        } else {
          // ================= MISMATCH! =================
          setStreak(0);

          setCards((prev) =>
            prev.map((c) =>
              c.uniqueId === id1 || c.uniqueId === id2 ? { ...c, isShaking: true } : c
            )
          );

          mismatchTimerRef.current = setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.uniqueId === id1 || c.uniqueId === id2
                  ? { ...c, isFlipped: false, isShaking: false }
                  : c
              )
            );
            setFlippedCardIds([]);
            mismatchTimerRef.current = null;
          }, 680);
        }
      }
    },
    [cards, flippedCardIds, isMuted, isRoundComplete, onStarsAwarded, streak]
  );

  // Manual voice replay
  const handleVoiceReplay = useCallback(
    (word: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isMuted) {
        soundManager.play('pop');
        voiceService.speakWord(word);
      }
    },
    [isMuted]
  );

  // Advance round or play again
  const handleAdvanceRound = () => {
    if (round < MAX_ROUNDS) {
      const next = round + 1;
      setRound(next);
      setupRound(next);
    } else {
      if (onNextGame) {
        onNextGame();
      } else {
        setRound(1);
        setScore(0);
        setMoves(0);
        setStreak(0);
        setupRound(1);
      }
    }
  };

  const matchedPairsCount = cards.filter((c) => c.isMatched).length / 2;
  const totalPairsCount = cards.length / 2;

  const [isGameComplete, setIsGameComplete] = useState(false);

  const handleNextOrFinish = () => {
    if (round < MAX_ROUNDS) {
      const next = round + 1;
      setRound(next);
      setupRound(next);
    } else {
      setIsGameComplete(true);
    }
  };

  return (
    <GameShell
      title="Lật Thẻ Trí Nhớ"
      icon={<Trophy className="w-5 h-5 text-amber-500" />}
      backgroundTheme="bright"
      requiresLandscape={true}
      currentRound={round}
      totalRounds={MAX_ROUNDS}
      score={score}
      streak={streak}
      isGameComplete={isGameComplete}
      starsEarned={Math.min(3, Math.max(1, Math.round(score / 50)))}
      onExit={onExit}
      onPlayAgain={() => {
        setRound(1);
        setScore(0);
        setMoves(0);
        setStreak(0);
        setIsGameComplete(false);
        setupRound(1);
      }}
      onNextGame={onNextGame}
    >
      {/* THE GAME TABLE CONTAINER */}
      <div className="w-full h-full flex flex-col items-center justify-between p-2 sm:p-4">
        {/* Sub-bar: Matched pairs info & quick restart */}
        <div className="w-full max-w-4xl flex items-center justify-between px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 mb-2 shrink-0 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-800">
              Đã ghép: {matchedPairsCount} / {totalPairsCount} cặp
            </span>
            <span className="text-xs font-bold text-slate-500">
              ({moves} lượt lật)
            </span>
          </div>

          <button
            type="button"
            onClick={() => setupRound(round)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold active:scale-95 transition-all cursor-pointer"
            title="Xáo bài lại"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Xáo lại</span>
          </button>
        </div>

        {/* Board Arena (Centered responsive grid, zero scroll) */}
        <div className="flex-1 w-full max-w-4xl flex items-center justify-center min-h-0 relative">
          <div
            className={`grid ${
              round === 1
                ? 'grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5'
                : 'grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3 lg:gap-4'
            } items-center justify-items-center w-full max-h-full`}
          >
            {cards.map((card) => (
              <GameCardItem
                key={card.uniqueId}
                card={card}
                onCardClick={handleCardClick}
                onVoiceClick={handleVoiceReplay}
                isMuted={isMuted}
              />
            ))}
          </div>

          {/* 1-2-3 Stars Celebratory Victory Modal for Kids */}
          <VictoryStarModal
            isOpen={isRoundComplete}
            variant="kid"
            title={`HOÀN THÀNH VÒNG ${round}!`}
            subtitle={`Bé đã tìm đúng tất cả ${totalPairsCount} cặp thẻ thông minh!`}
            stars={moves <= totalPairsCount * 2 ? 3 : moves <= totalPairsCount * 3 ? 2 : 1}
            xpEarned={score}
            stats={[
              { label: 'Điểm Số', value: `+${score}` },
              { label: 'Số Lượt Lật', value: `${moves} lượt` },
              { label: 'Cặp Thẻ', value: `${totalPairsCount} cặp` },
            ]}
            onContinue={handleNextOrFinish}
            continueText={round < MAX_ROUNDS ? 'Sang Vòng Tiếp Theo 🚀' : 'Nhận Thưởng Hoàn Thành 🏆'}
          />
        </div>
      </div>
    </GameShell>
  );
};

export default MemoryFlipGame;
