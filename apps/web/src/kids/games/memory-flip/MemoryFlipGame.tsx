// ============================================================================
// VOCALFLOW KIDS — REAL CARD STACK & SWIPE DECK GAME (MEMORY MATCH)
// Physical Card Deck • Swiper EffectCards + Tactile Drag-Down • Bright Playful Room
// Page: #FFFDF7 • Game Table: #F7F3EA • Magic Animal Learning Cards Aesthetic
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCards } from 'swiper/modules';
import type { Swiper as SwiperInstance } from 'swiper';

import 'swiper/css';
import 'swiper/css/effect-cards';

import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Shuffle,
  Flame,
  Sparkles,
  RotateCw,
  Trophy,
  ChevronRight,
} from 'lucide-react';
import { MAGIC_CARDS_DATASET, MagicCardItem } from '../../data/cards/magicDeckData';
import { MagicFlashcard } from '../../components/MagicFlashcard';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';

interface MemoryFlipGameProps {
  onExit: () => void;
  onStarsAwarded?: (stars: number) => void;
  onNextGame?: () => void;
}

const DECK_SIZE = 20;

export const MemoryFlipGame: React.FC<MemoryFlipGameProps> = ({
  onExit,
  onStarsAwarded,
  onNextGame,
}) => {
  // 1. Deck initialization (20 curated vocabulary items from 75+ animal & magic cards)
  const [deck, setDeck] = useState<MagicCardItem[]>(() => {
    return [...MAGIC_CARDS_DATASET]
      .sort(() => Math.random() - 0.5)
      .slice(0, DECK_SIZE);
  });

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [streak, setStreak] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isGameCompleted, setIsGameCompleted] = useState<boolean>(false);

  // Swiper instance ref
  const swiperRef = useRef<SwiperInstance | null>(null);

  // Drag-down tactile physics state
  const [isDraggingDown, setIsDraggingDown] = useState<boolean>(false);
  const [dragY, setDragY] = useState<number>(0);
  const dragStartYRef = useRef<number>(0);
  const dragStartTimeRef = useRef<number>(0);
  const isAnimatingRef = useRef<boolean>(false);

  const currentCard = deck[activeIndex] || deck[0];
  const nextCard = deck[(activeIndex + 1) % deck.length];
  const thirdCard = deck[(activeIndex + 2) % deck.length];

  // Preload audio words for instant latency-free pronunciation
  useEffect(() => {
    if (deck.length > 0) {
      voiceService.preloadWords(deck.map((d) => d.word));
    }
  }, [deck]);

  // Pronounce word when active card changes (if not muted)
  useEffect(() => {
    if (currentCard && !isMuted && !isGameCompleted) {
      voiceService.speakEnglish(currentCard.word);
    }
    setIsFlipped(false);
    setDragY(0);
  }, [activeIndex, currentCard, isMuted, isGameCompleted]);

  // Stop voice on unmount
  useEffect(() => {
    return () => {
      voiceService.stop();
    };
  }, []);

  // Handle slide change from Swiper
  const handleSlideChange = (swiper: SwiperInstance) => {
    const newIdx = swiper.realIndex;
    setActiveIndex(newIdx);
    setStreak((prev) => prev + 1);
    soundManager.playPop();

    // Check if finished full round
    if (newIdx === deck.length - 1) {
      if (onStarsAwarded) onStarsAwarded(3);
    }
  };

  // Flip active card (tap interaction)
  const handleCardTap = useCallback(() => {
    soundManager.playClick();
    setIsFlipped((prev) => !prev);
  }, []);

  // Manual voice replay
  const handleSpeak = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentCard) {
      soundManager.playPop();
      voiceService.speakEnglish(currentCard.word);
    }
  };

  const handleSpeakVietnamese = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentCard) {
      voiceService.speakVietnameseNorthern(currentCard.viMeaning);
    }
  };

  // Shuffle deck
  const handleShuffle = () => {
    soundManager.playSparkle();
    const shuffled = [...MAGIC_CARDS_DATASET]
      .sort(() => Math.random() - 0.5)
      .slice(0, DECK_SIZE);
    setDeck(shuffled);
    setActiveIndex(0);
    setStreak(0);
    setIsFlipped(false);
    setDragY(0);
    if (swiperRef.current) {
      swiperRef.current.slideTo(0);
    }
  };

  // Advance to next card via button or gesture
  const advanceToNext = useCallback(() => {
    if (isAnimatingRef.current) return;
    if (swiperRef.current) {
      if (activeIndex < deck.length - 1) {
        swiperRef.current.slideNext();
      } else {
        // Complete or loop
        setIsGameCompleted(true);
        soundManager.play('celebration');
        if (onStarsAwarded) onStarsAwarded(3);
      }
    }
  }, [activeIndex, deck.length, onStarsAwarded]);

  // =========================================================================
  // TACTILE DRAG-DOWN GESTURE (PHYSICAL RESISTANCE & SPRING BACK)
  // =========================================================================
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isAnimatingRef.current || isGameCompleted) return;
    if ((e.target as HTMLElement).closest('button')) return;

    dragStartYRef.current = e.clientY;
    dragStartTimeRef.current = Date.now();
    setIsDraggingDown(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingDown || isAnimatingRef.current) return;
    const rawDeltaY = e.clientY - dragStartYRef.current;
    if (rawDeltaY > 0) {
      const dampedY = Math.pow(rawDeltaY, 0.9);
      setDragY(dampedY);
    } else {
      setDragY(rawDeltaY * 0.2);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingDown) return;
    setIsDraggingDown(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    const duration = Date.now() - dragStartTimeRef.current;
    const distance = dragY;

    // TAP DETECTION: Minimal movement + fast duration -> Flip card!
    if (Math.abs(distance) < 8 && duration < 300) {
      handleCardTap();
      setDragY(0);
      return;
    }

    // SWIPE THRESHOLD: Dragged down more than 85px or quick downward flick
    const isQuickDownwardFlick = distance > 40 && duration < 240;
    if (distance > 85 || isQuickDownwardFlick) {
      isAnimatingRef.current = true;
      soundManager.playWhoosh();
      setDragY(380);

      setTimeout(() => {
        advanceToNext();
        setDragY(0);
        isAnimatingRef.current = false;
      }, 200);
    } else {
      setDragY(0);
    }
  };

  const handlePointerCancel = () => {
    setIsDraggingDown(false);
    setDragY(0);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        advanceToNext();
      } else if (e.key === 'ArrowLeft' && swiperRef.current && activeIndex > 0) {
        e.preventDefault();
        swiperRef.current.slidePrev();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleCardTap();
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (currentCard) voiceService.speakEnglish(currentCard.word);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [advanceToNext, handleCardTap, currentCard, activeIndex]);

  // Dynamic rotation & scale during drag down
  const dragRotation = Math.max(Math.min((dragY / 100) * -2.5, 0), -4);
  const dragScale = Math.max(1 - (dragY / 800), 0.96);
  const nextCardUnderneathScale = Math.min(0.96 + (dragY / 200) * 0.04, 1);
  const nextCardUnderneathY = Math.max(10 - (dragY / 100) * 10, 0);

  return (
    <div className="w-screen h-[100dvh] max-h-[100dvh] max-w-full overflow-hidden flex flex-col justify-between kids-bright-page-bg text-slate-800 select-none">
      {/* ========================================================================= */}
      {/* 1. TOP HUD (MINIMAL, ELEGANT, PURE SVG ICONS)                             */}
      {/* ========================================================================= */}
      <header className="flex-shrink-0 w-full max-w-4xl mx-auto px-4 pt-3 pb-1 flex items-center justify-between gap-3">
        {/* Left: Back Button & Game Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-200/80 shadow-xs hover:shadow-sm active:scale-95"
            title="Quay lại thư viện trò chơi"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>Thoát</span>
          </button>

          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              Memory Match
            </h1>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60 text-[10px] font-black">
              Bộ Bài Động Vật
            </span>
          </div>
        </div>

        {/* Center: Minimal Progress (07 / 20) */}
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-black text-slate-700 tracking-tight font-mono">
            {String(activeIndex + 1).padStart(2, '0')} / {String(deck.length).padStart(2, '0')}
          </span>
          <div className="w-16 sm:w-24 h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-300"
              style={{ width: `${((activeIndex + 1) / deck.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Right: Streak & Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-black shadow-2xs">
            <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-600" />
            <span>{streak} chuỗi</span>
          </div>

          <button
            type="button"
            onClick={() => setIsMuted((prev) => !prev)}
            className="p-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-600 cursor-pointer transition-colors shadow-2xs"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-slate-700" />}
          </button>

          <button
            type="button"
            onClick={handleShuffle}
            className="p-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-600 cursor-pointer transition-colors shadow-2xs"
            title="Trộn bộ bài"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. BRIGHT GAME TABLE (WARM CREAM #F7F3EA WITH PHYSICAL CARD DECK STACK)  */}
      {/* ========================================================================= */}
      <main className="flex-1 min-h-0 w-full px-3 sm:px-6 py-2 flex items-center justify-center overflow-hidden">
        <div className="w-full max-w-[820px] h-full max-h-[calc(100dvh-120px)] rounded-[28px] sm:rounded-[36px] kids-bright-game-table flex flex-col items-center justify-center relative overflow-hidden p-3 sm:p-6">
          {/* Subtle Ambient Decorative Sparkles */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <div className="absolute top-8 left-12 w-2 h-2 rounded-full bg-amber-400 blur-2xs" />
            <div className="absolute top-16 right-16 w-3 h-3 rounded-full bg-sky-300 blur-2xs" />
            <div className="absolute bottom-12 left-16 w-2.5 h-2.5 rounded-full bg-emerald-400 blur-2xs" />
            <div className="absolute bottom-16 right-20 w-2 h-2 rounded-full bg-rose-300 blur-2xs" />
            <Sparkles className="absolute top-10 right-28 w-4 h-4 text-amber-400/30" />
            <Sparkles className="absolute bottom-14 left-24 w-4 h-4 text-indigo-400/30" />
          </div>

          {/* Prompt Hint Text */}
          <div className="relative z-10 text-center mb-1 sm:mb-2 pointer-events-none">
            <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">
              Kéo bài xuống để rút thẻ tiếp theo • Chạm để xem chi tiết
            </p>
          </div>

          {/* ===================================================================== */}
          {/* PHYSICAL CARD DECK CONTAINER WITH LAYERED STACK EDGES                 */}
          {/* ===================================================================== */}
          <div className="relative flex items-center justify-center w-full max-w-[340px] sm:max-w-[380px] lg:max-w-[400px]">
            {/* LAYER 3: Deepest Deck Card Edge */}
            {thirdCard && (
              <div
                className={`kids-deck-base-layer w-full h-[420px] sm:h-[460px] bg-gradient-to-b ${thirdCard.theme.bgGradient} border border-white/40`}
                style={{
                  transform: 'translate3d(12px, 12px, -30px) rotate(2deg)',
                  opacity: 0.6,
                  boxShadow: '0 8px 20px rgba(160, 140, 110, 0.12)',
                }}
              />
            )}

            {/* LAYER 2: Middle Deck Card Edge */}
            {nextCard && (
              <div
                className={`kids-deck-base-layer w-full h-[420px] sm:h-[460px] bg-gradient-to-b ${nextCard.theme.bgGradient} border border-white/50`}
                style={{
                  transform: 'translate3d(6px, 6px, -15px) rotate(1deg)',
                  opacity: 0.85,
                  boxShadow: '0 10px 24px rgba(160, 140, 110, 0.14)',
                }}
              />
            )}

            {/* LAYER 1: Next Card Underneath reacts dynamically to drag down */}
            {nextCard && (
              <div
                className={`kids-deck-base-layer w-full h-[420px] sm:h-[460px] bg-gradient-to-b ${nextCard.theme.bgGradient} border border-white/60`}
                style={{
                  transform: `translate3d(0, ${nextCardUnderneathY}px, -5px) scale(${nextCardUnderneathScale})`,
                  opacity: 0.95,
                  boxShadow: '0 12px 28px rgba(160, 140, 110, 0.16)',
                }}
              />
            )}

            {/* ================================================================= */}
            {/* SWIPER COMPONENT WITH EFFECT="CARDS" ENGINE                       */}
            {/* ================================================================= */}
            <Swiper
              effect="cards"
              grabCursor={true}
              modules={[EffectCards]}
              cardsEffect={{
                slideShadows: false,
                perSlideOffset: 7,
                perSlideRotate: 1.8,
              }}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
              onSlideChange={handleSlideChange}
              className="kids-card-swiper"
            >
              {deck.map((item, idx) => {
                const isActive = idx === activeIndex;

                return (
                  <SwiperSlide key={item.id}>
                    <div
                      onPointerDown={isActive ? handlePointerDown : undefined}
                      onPointerMove={isActive ? handlePointerMove : undefined}
                      onPointerUp={isActive ? handlePointerUp : undefined}
                      onPointerCancel={isActive ? handlePointerCancel : undefined}
                      style={
                        isActive
                          ? {
                              transform: `translate3d(0, ${dragY}px, 0) rotate(${dragRotation}deg) scale(${dragScale})`,
                              transition: isDraggingDown
                                ? 'none'
                                : 'transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                              touchAction: 'none',
                            }
                          : undefined
                      }
                      className="w-full h-full relative cursor-grab active:cursor-grabbing select-none"
                    >
                      <MagicFlashcard
                        card={item}
                        isFlipped={isActive && isFlipped}
                        onFlip={handleCardTap}
                        onSpeakEnglish={handleSpeak}
                        onSpeakVietnamese={handleSpeakVietnamese}
                      />
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>

          {/* ===================================================================== */}
          {/* BOTTOM CONTROLS & NAVIGATION                                          */}
          {/* ===================================================================== */}
          <div className="relative z-10 mt-2 sm:mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleCardTap}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-black text-xs border border-slate-200/80 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{isFlipped ? 'Mặt trước' : 'Xem câu ví dụ'}</span>
            </button>

            <button
              type="button"
              onClick={advanceToNext}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs shadow-sm hover:shadow-md cursor-pointer active:scale-95 transition-all"
            >
              <span>Thẻ kế tiếp</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 3. GAME COMPLETED MODAL DIALOG                                            */}
      {/* ========================================================================= */}
      {isGameCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-[24px] bg-white border border-slate-200/80 p-6 text-center space-y-4 shadow-2xl animate-scaleUp">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-amber-500 shadow-inner">
              <Trophy className="w-8 h-8 text-amber-500" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">
                Xuất Sắc Lắm Bé Ơi!
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                Bé đã hoàn thành bộ bài {deck.length} từ vựng với chuỗi {streak} thẻ!
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 py-2">
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-black">
                ⭐ +3 Sao Vàng
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black">
                🎉 +30 XP
              </span>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleShuffle}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer active:scale-95 transition-all"
              >
                Chơi lại
              </button>

              <button
                type="button"
                onClick={onNextGame || onExit}
                className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs cursor-pointer active:scale-95 transition-all shadow-sm"
              >
                Tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryFlipGame;
