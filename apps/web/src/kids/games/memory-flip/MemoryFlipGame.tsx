// ============================================================================
// GAME 02: MEMORY MATCH / FLIP CARD (LẬT THẺ TRÍ NHỚ ĐÍCH THỰC)
// Dedicated Game Table • Exact Matching Logic • 0ms Instant Flip • Pure SVG Icons
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
  Star,
  Play,
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
 * Prevents re-rendering untouched cards when one card is clicked.
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
      className={`kids-flip-card w-32 sm:w-36 lg:w-40 h-44 sm:h-50 lg:h-54 relative select-none cursor-pointer transition-all duration-200 ${
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
        {/* CARD BACK: Dedicated Premium Graphic Asset               */}
        {/* ========================================================= */}
        <div
          className="kids-flip-front rounded-[24px] sm:rounded-[28px] overflow-hidden border-2 border-amber-400/80 shadow-[0_12px_24px_rgba(0,0,0,0.5)] flex flex-col items-center justify-between p-3.5"
          style={{
            backgroundImage: `url(${CARD_BACK_IMAGE})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Inner Golden Rim Accent */}
          <div className="absolute inset-1.5 rounded-[18px] sm:rounded-[22px] border border-amber-300/40 pointer-events-none" />

          {/* Top Logo Monogram */}
          <div className="relative z-10 px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-xs text-[9px] font-black uppercase tracking-wider text-amber-300 border border-amber-300/30">
            VOCALFLOW
          </div>

          {/* Center Golden Motif */}
          <div className="relative z-10 w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-amber-400/20 backdrop-blur-xs border border-amber-300/50 flex items-center justify-center shadow-xs">
            <Sparkles className="w-6 h-6 text-amber-300 filter drop-shadow-xs" />
          </div>

          {/* Bottom Flip Cue */}
          <div className="relative z-10 px-3 py-1 rounded-full bg-amber-400 text-amber-950 font-black text-[10px] tracking-wide shadow-xs flex items-center gap-1">
            <RotateCw className="w-3 h-3" />
            <span>LẬT THẺ</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CARD FRONT: Pearl Porcelain Surface with Vector Art       */}
        {/* ========================================================= */}
        <div
          className={`kids-flip-back rounded-[24px] sm:rounded-[28px] bg-gradient-to-b from-slate-50 via-white to-blue-50/70 p-3 sm:p-4 flex flex-col items-center justify-between text-center overflow-hidden border-2 shadow-[0_16px_32px_rgba(0,0,0,0.4)] ${
            card.isMatched
              ? 'border-emerald-400 ring-4 ring-emerald-400/50'
              : 'border-slate-200'
          }`}
        >
          {/* Top Row: Speaker Icon */}
          <div className="w-full flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              Từ vựng
            </span>

            {!isMuted && (
              <button
                type="button"
                onClick={(e) => onVoiceClick(card.item.word, e)}
                className="p-1 rounded-full text-indigo-600 hover:bg-indigo-50 active:scale-90 transition-transform cursor-pointer"
                title="Phát lại âm thanh"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Center Illustration */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-indigo-50/60 border border-indigo-100/70 p-2 flex items-center justify-center shadow-inner filter drop-shadow-xs">
            <KidsIllustration
              name={card.item.word.toLowerCase()}
              className="w-full h-full object-contain filter drop-shadow-xs"
              alt={card.item.word}
            />
          </div>

          {/* Typography */}
          <div className="space-y-0.5 w-full">
            <h3 className="text-sm sm:text-base font-black text-slate-900 capitalize tracking-tight truncate">
              {card.item.word}
            </h3>
            <span className="inline-block text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80 truncate max-w-full">
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

  // Mismatch timer ref for fluid, zero-blocked gameplay
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

    // Round 1: 4 pairs (8 cards), Round 2: 6 pairs (12 cards), Round 3: 6 pairs (12 cards)
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
      // Find card
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

      // If user clicks while 2 mismatched cards are waiting to flip back:
      // immediately flip them back and proceed with this click without dropping it!
      let currentCards = cards;
      let currentFlipped = flippedCardIds;

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

          // Mark both cards matched
          const matchedCards = nextCards.map((c) =>
            c.uniqueId === id1 || c.uniqueId === id2 ? { ...c, isMatched: true } : c
          );
          setCards(matchedCards);
          setFlippedCardIds([]);

          // After 300ms, fade and remove matched cards smoothly
          setTimeout(() => {
            setCards((prev) => {
              const updated = prev.map((c) =>
                c.uniqueId === id1 || c.uniqueId === id2 ? { ...c, isRemoved: true } : c
              );

              // Check if all cards in the round are matched
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

          // Trigger subtle shake feedback
          setCards((prev) =>
            prev.map((c) =>
              c.uniqueId === id1 || c.uniqueId === id2 ? { ...c, isShaking: true } : c
            )
          );

          // Keep visible for 700ms, then flip both back
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
          }, 700);
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
      // Completed all 3 rounds!
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
    <div className="w-full min-h-screen bg-[#0D121F] text-slate-100 flex flex-col justify-between py-3 sm:py-6 px-3 sm:px-6 select-none animate-fadeIn">
      {/* ========================================================================= */}
      {/* ZONE B — GAME HEADER (TÁCH BIỆT, NỀN RIÊNG, KHÔNG DÙNG EMOJI)            */}
      {/* ========================================================================= */}
      <header className="w-full max-w-5xl mx-auto rounded-2xl bg-[#161F36] border border-[#243152] shadow-md p-3 sm:p-4 flex items-center justify-between gap-3">
        {/* Left: Exit button & Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#202B48] hover:bg-[#2A395E] text-slate-200 text-xs font-bold transition-colors cursor-pointer border border-[#2B3B63] active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-slate-300" />
            <span>Thoát</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight">
                Lật Thẻ Trí Nhớ
              </h1>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 text-[11px] font-black">
                Vòng {round} / {MAX_ROUNDS}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Metrics (Moves, Score, Streak) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Moves */}
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#1D2845] border border-[#2C3B61] text-xs font-bold text-slate-300">
            <Layers className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>{moves} Lượt</span>
          </div>

          {/* Score */}
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#1D2845] border border-[#2C3B61] text-xs font-bold text-amber-300">
            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{score} Điểm</span>
          </div>

          {/* Streak */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1D2845] border border-[#2C3B61] text-xs font-bold text-rose-300">
            <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>{streak} Chuỗi</span>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* ZONE C — THE GAME TABLE (VÙNG BÀN CHƠI TỐI MÀU, CÓ ĐỘ SÂU & RỘNG RÃI)    */}
      {/* ========================================================================= */}
      <main className="w-full max-w-5xl mx-auto my-3 sm:my-5 flex-1 rounded-[32px] sm:rounded-[40px] bg-[#141C31] border-2 border-[#243354] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.6),inset_0_1px_4px_rgba(255,255,255,0.06)] p-5 sm:p-8 lg:p-10 flex flex-col justify-center items-center relative overflow-hidden min-h-[520px] sm:min-h-[580px]">
        {/* Felt Ambient Table Center Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1D2A4B_0%,_#111728_100%)] pointer-events-none" />

        {/* Subtle Decorative Inner Ring */}
        <div className="absolute inset-3 sm:inset-4 rounded-[26px] sm:rounded-[34px] border border-white/5 pointer-events-none" />

        {/* TABLE HEADER HINT */}
        <div className="relative z-10 mb-4 px-4 py-1.5 rounded-full bg-[#18233C]/80 backdrop-blur-md border border-[#2D3E66] text-xs font-semibold text-slate-300 flex items-center gap-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Lật tìm 2 thẻ có từ vựng và hình ảnh tương đồng để hoàn thành cặp!</span>
        </div>

        {/* 3D CARDS GRID (Spacious, tactile, no clutter) */}
        <div
          className={`relative z-10 my-auto py-2 sm:py-4 [perspective:1200px] ${
            round === 1
              ? 'grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 lg:gap-7'
              : 'grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5'
          } items-center justify-items-center`}
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

        {/* VICTORY OVERLAY WHEN ROUND IS COMPLETE */}
        {isRoundComplete && (
          <div className="absolute inset-0 z-30 bg-[#0B0F1CD9] backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#162038] border-2 border-[#2F426F] shadow-2xl max-w-md w-full flex flex-col items-center space-y-4 animate-scaleUp">
              <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-400/50 text-amber-300 flex items-center justify-center shadow-lg">
                <Trophy className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Hoàn Thành Vòng {round}!
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-slate-300">
                  Bé đã tìm đúng tất cả {totalPairsCount} cặp thẻ chỉ với {moves} lượt lật!
                </p>
              </div>

              {/* Stats Summary */}
              <div className="w-full grid grid-cols-2 gap-3 py-1">
                <div className="p-3 rounded-2xl bg-[#1C2847] border border-[#2B3B63] text-center">
                  <span className="text-[11px] font-bold text-slate-400 block">Điểm số</span>
                  <span className="text-lg font-black text-amber-300">+{score}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#1C2847] border border-[#2B3B63] text-center">
                  <span className="text-[11px] font-bold text-slate-400 block">Số lượt</span>
                  <span className="text-lg font-black text-sky-300">{moves} lượt</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleAdvanceRound}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <span>{round < MAX_ROUNDS ? 'Sang Vòng Tiếp Theo' : 'Hoàn Thành & Sang Trò Chơi Mới'}</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* ZONE D — BOTTOM CONTROLS & PROGRESS BAR (ĐỒNG NHẤT, GỌN GÀNG)             */}
      {/* ========================================================================= */}
      <footer className="w-full max-w-5xl mx-auto rounded-2xl bg-[#161F36] border border-[#243152] p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        {/* Progress Tracker */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-300 whitespace-nowrap">
            Đã ghép: {matchedPairsCount} / {totalPairsCount} cặp
          </span>

          <div className="flex-1 sm:w-56 h-2 rounded-full bg-slate-800 border border-slate-700/60 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Secondary Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Mute/Unmute */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-xl bg-[#202B48] hover:bg-[#2A395E] text-slate-300 border border-[#2B3B63] transition-colors cursor-pointer active:scale-95"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Restart Round */}
          <button
            type="button"
            onClick={() => setupRound(round)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#202B48] hover:bg-[#2A395E] text-slate-300 border border-[#2B3B63] text-xs font-bold transition-colors cursor-pointer active:scale-95"
            title="Chơi lại vòng này"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
            <span>Chơi lại</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default MemoryFlipGame;
