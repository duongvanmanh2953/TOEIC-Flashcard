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
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';
import { kidAsset } from '../../utils/kidAsset';

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
      className={`kids-flip-card w-20 sm:w-28 md:w-32 lg:w-36 h-28 sm:h-38 md:h-44 lg:h-48 max-h-[22vh] aspect-[3/4] relative select-none cursor-pointer transition-all duration-200 ${
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
        {/* CARD BACK: Velvet Indigo with Golden Accent Rim          */}
        {/* ========================================================= */}
        <div
          className="kids-flip-front rounded-[18px] sm:rounded-[26px] overflow-hidden ring-1 ring-amber-400/40 shadow-[0_12px_24px_rgba(0,0,0,0.55)] flex flex-col items-center justify-between p-2.5 sm:p-3.5"
          style={{
            backgroundImage: `url(${CARD_BACK_IMAGE})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Inner Golden Tonal Rim */}
          <div className="absolute inset-1.5 rounded-[14px] sm:rounded-[20px] border border-amber-300/30 pointer-events-none" />

          {/* Top Logo Monogram */}
          <div className="relative z-10 px-2 py-0.5 rounded-full bg-black/45 backdrop-blur-xs text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-amber-300 border border-amber-300/30">
            VOCALFLOW
          </div>

          {/* Center Golden Motif */}
          <div className="relative z-10 w-9 h-9 sm:w-12 sm:h-12 rounded-2xl bg-amber-400/20 backdrop-blur-xs border border-amber-300/40 flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 filter drop-shadow-xs" />
          </div>

          {/* Bottom Flip Indicator */}
          <div className="relative z-10 px-2.5 py-0.5 sm:py-1 rounded-full bg-amber-400 text-amber-950 font-black text-[9px] sm:text-[10px] tracking-wide shadow-xs flex items-center gap-1">
            <RotateCw className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span>LẬT THẺ</span>
          </div>
        </div>

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
  const progressPercent = totalPairsCount > 0 ? Math.round((matchedPairsCount / totalPairsCount) * 100) : 0;

  return (
    <div className="w-full h-full max-h-[100dvh] overflow-hidden flex flex-col justify-between kids-bright-page-bg text-slate-800 select-none">
      {/* ========================================================================= */}
      {/* 1. ZONE B — GAME HEADER (CLEAN, BRIGHT, PURE SVG ICONS)                  */}
      {/* ========================================================================= */}
      <header className="flex-shrink-0 w-full max-w-5xl mx-auto px-4 pt-3 pb-1 flex items-center justify-between gap-3">
        {/* Left: Exit button & Title */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-200/80 shadow-2xs active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>Thoát</span>
          </button>

          <div className="flex items-center gap-2">
            <h1 className="text-xs sm:text-sm lg:text-base font-black text-slate-900 tracking-tight">
              Lật Thẻ Trí Nhớ
            </h1>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 text-[10px] font-black">
              Vòng {round} / {MAX_ROUNDS}
            </span>
          </div>
        </div>

        {/* Right: Metrics (Moves, Score, Streak) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-bold text-slate-700 shadow-2xs">
            <Layers className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span>{moves} Lượt</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white border border-amber-200/80 text-xs font-bold text-amber-800 shadow-2xs">
            <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>{score} Điểm</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-rose-200/80 text-xs font-bold text-rose-700 shadow-2xs">
            <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>{streak} Chuỗi</span>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. ZONE C — THE GAME TABLE (WARM CREAM #F7F3EA)                           */}
      {/* ========================================================================= */}
      <div className="flex-1 min-h-0 w-full px-2 sm:px-4 py-1 flex items-center justify-center overflow-hidden">
        <div className="w-full max-w-[1040px] h-full max-h-[calc(100dvh-130px)] rounded-[28px] sm:rounded-[36px] kids-bright-game-table flex flex-col items-center justify-center p-3 sm:p-5 lg:p-7 relative overflow-hidden">
          {/* Subtle Organic Inner Ring */}
          <div className="absolute inset-2.5 sm:inset-3.5 rounded-[22px] sm:rounded-[30px] border border-amber-400/20 pointer-events-none" />

          {/* INNER BOARD / SAFE AREA (Cards fit perfectly without clipping) */}
          <div className="relative z-10 w-full h-full flex items-center justify-center p-1 sm:p-2 overflow-hidden">
            <div
              className={`grid ${
                round === 1
                  ? 'grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5'
                  : 'grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3.5 lg:gap-4'
              } items-center justify-items-center w-full max-w-4xl`}
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
          </div>

          {/* VICTORY OVERLAY WHEN ROUND IS COMPLETE */}
          {isRoundComplete && (
            <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center animate-fadeIn">
              <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-slate-200/90 shadow-2xl max-w-sm w-full flex flex-col items-center space-y-3.5 animate-scaleUp">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
                  <Trophy className="w-8 h-8 text-amber-500" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl font-black text-slate-900">
                    Hoàn Thành Vòng {round}!
                  </h2>
                  <p className="text-xs font-semibold text-slate-500">
                    Bé đã tìm đúng tất cả {totalPairsCount} cặp thẻ với {moves} lượt lật.
                  </p>
                </div>

                <div className="w-full grid grid-cols-2 gap-2.5 py-1">
                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/60 text-center">
                    <span className="text-[10px] font-bold text-amber-800 block">Điểm số</span>
                    <span className="text-lg font-black text-amber-600">+{score}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-sky-50/80 border border-sky-200/60 text-center">
                    <span className="text-[10px] font-bold text-sky-800 block">Số lượt</span>
                    <span className="text-lg font-black text-sky-600">{moves} lượt</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAdvanceRound}
                  className="w-full py-3 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs sm:text-sm shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <span>{round < MAX_ROUNDS ? 'Sang Vòng Tiếp Theo' : 'Hoàn Thành Trò Chơi'}</span>
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ZONE D — BOTTOM CONTROLS & STATUS BAR                                  */}
      {/* ========================================================================= */}
      <footer className="flex-shrink-0 w-full max-w-5xl mx-auto px-4 pb-3 pt-1 flex items-center justify-between gap-3">
        {/* Progress Tracker */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
            Đã ghép: {matchedPairsCount} / {totalPairsCount} cặp
          </span>

          <div className="w-36 sm:w-52 h-2 rounded-full bg-slate-200/80 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80 transition-colors cursor-pointer active:scale-95 shadow-2xs"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-slate-700" />}
          </button>

          <button
            type="button"
            onClick={() => setupRound(round)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs"
            title="Chơi lại vòng này"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Chơi lại</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default MemoryFlipGame;
