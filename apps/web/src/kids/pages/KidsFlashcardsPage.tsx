// ============================================================================
// VOCALFLOW KIDS — MAGIC FLASHCARD STACK DECK
// Full 100dvh Viewport • Physical 3-Card Stack • 75 Animals + Multi-Themes
// Replicating the "Magic Animal Learning Cards" Aesthetic • 0ms Speech Latency
// ============================================================================

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MAGIC_CARDS_DATASET, MagicCardItem, CardCategory } from '../data/cards/magicDeckData';
import { MagicFlashcard } from '../components/MagicFlashcard';
import { voiceService } from '../services/voice/voiceService';
import { soundManager } from '../services/sound/KidsSoundManager';
import {
  Volume2,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  VolumeX,
  Shuffle,
  Sparkles,
} from 'lucide-react';

export const KidsFlashcardsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('animals'); // Default to Animals as requested!
  const [deck, setDeck] = useState<MagicCardItem[]>(MAGIC_CARDS_DATASET);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Swipe & Drag Gesture State
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [flyOutDirection, setFlyOutDirection] = useState<'left' | 'right' | null>(null);

  const dragStartRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const isTransitioningRef = useRef(false);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const filteredDeck = useMemo(() => {
    if (selectedCategory === 'favorites') {
      return deck.filter((item) => favorites.includes(item.id));
    }
    if (selectedCategory === 'all') return deck;
    return deck.filter((item) => item.category === selectedCategory);
  }, [deck, selectedCategory, favorites]);

  const totalCards = filteredDeck.length;
  const currentCard = filteredDeck[currentIndex] || filteredDeck[0];
  const nextCard = totalCards > 1 ? filteredDeck[(currentIndex + 1) % totalCards] : null;
  const thirdCard = totalCards > 2 ? filteredDeck[(currentIndex + 2) % totalCards] : null;

  // Speak word when card appears if not muted
  useEffect(() => {
    if (currentCard && !isMuted) {
      voiceService.speakEnglish(currentCard.word);
    }
  }, [currentIndex, currentCard?.id, isMuted]);

  // Clean voice on unmount
  useEffect(() => {
    return () => {
      voiceService.stop();
    };
  }, []);

  // Category navigation scroll
  const scrollCategory = (direction: 'left' | 'right') => {
    soundManager.playPop();
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -180 : 180,
        behavior: 'smooth',
      });
    }
  };

  const handleFlip = useCallback(() => {
    soundManager.playClick();
    setIsFlipped((prev) => !prev);
  }, []);

  const triggerNext = useCallback(() => {
    if (isTransitioningRef.current || totalCards <= 1) return;
    isTransitioningRef.current = true;
    soundManager.playPop();
    setFlyOutDirection('left');

    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % totalCards);
      setIsFlipped(false);
      setFlyOutDirection(null);
      setDragOffset({ x: 0, y: 0 });
      isTransitioningRef.current = false;
    }, 240);
  }, [totalCards]);

  const triggerPrev = useCallback(() => {
    if (isTransitioningRef.current || totalCards <= 1) return;
    isTransitioningRef.current = true;
    soundManager.playPop();
    setFlyOutDirection('right');

    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + totalCards) % totalCards);
      setIsFlipped(false);
      setFlyOutDirection(null);
      setDragOffset({ x: 0, y: 0 });
      isTransitioningRef.current = false;
    }, 240);
  }, [totalCards]);

  const handleShuffle = () => {
    soundManager.playSparkle();
    setDeck((prev) => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleSpeakEnglish = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentCard) voiceService.speakEnglish(currentCard.word);
  };

  const handleSpeakVietnamese = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentCard) voiceService.speakVietnameseNorthern(currentCard.viMeaning);
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playStar();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // =========================================================================
  // SWIPE DRAG GESTURE HANDLERS
  // =========================================================================
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isTransitioningRef.current) return;
    if ((e.target as HTMLElement).closest('button')) return;

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || isTransitioningRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = (e.clientY - dragStartRef.current.y) * 0.35;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || isTransitioningRef.current) return;
    setIsDragging(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }

    const deltaX = dragOffset.x;
    const deltaY = dragOffset.y;
    const duration = Date.now() - dragStartRef.current.time;

    // TAP / CLICK DETECTION: minimal movement -> Flip card!
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && duration < 320) {
      handleFlip();
      setDragOffset({ x: 0, y: 0 });
      return;
    }

    // SWIPE THRESHOLD: Horizontal drag OR Downward drag
    const isQuickSwipe = Math.abs(deltaX) > 45 && duration < 250;
    const isQuickDownward = deltaY > 60;

    if (deltaX < -80 || (isQuickSwipe && deltaX < 0) || isQuickDownward) {
      triggerNext();
    } else if (deltaX > 80 || (isQuickSwipe && deltaX > 0)) {
      triggerPrev();
    } else {
      // Spring back to center
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const handlePointerCancel = () => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        triggerNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        triggerPrev();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleSpeakEnglish();
      } else if (e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handleSpeakVietnamese();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerNext, triggerPrev, handleFlip, currentCard]);

  // Stack interpolation progress based on live drag
  const dragRatio = Math.min((Math.abs(dragOffset.x) + Math.abs(dragOffset.y)) / 140, 1);

  // Active card transform
  let activeTransform = `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${dragOffset.x * 0.05}deg)`;
  let activeTransition = isDragging ? 'none' : 'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 240ms ease-out';
  let activeOpacity = 1;

  if (flyOutDirection === 'left') {
    activeTransform = 'translate3d(-120vw, 30px, 0) rotate(-14deg)';
    activeTransition = 'transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 220ms ease-out';
    activeOpacity = 0;
  } else if (flyOutDirection === 'right') {
    activeTransform = 'translate3d(120vw, 30px, 0) rotate(14deg)';
    activeTransition = 'transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 220ms ease-out';
    activeOpacity = 0;
  }

  // Count animals for badge
  const animalCount = deck.filter((i) => i.category === 'animals').length;

  return (
    <div className="w-screen h-[100dvh] max-h-[100dvh] max-w-full overflow-hidden flex flex-col justify-between kids-bright-page-bg text-slate-800 select-none">
      {/* ========================================================================= */}
      {/* 1. HEADER (CLEAN, BRIGHT, PURE SVG ICONS)                                 */}
      {/* ========================================================================= */}
      <header className="flex-shrink-0 w-full max-w-5xl mx-auto px-4 pt-3 pb-1 flex items-center justify-between gap-3">
        {/* Left: Back button & Title */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              soundManager.playPop();
              navigate('/kids');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-200/80 shadow-2xs active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>Thoát</span>
          </button>

          <div className="flex items-center gap-2">
            <h1 className="text-xs sm:text-sm lg:text-base font-black text-slate-900 tracking-tight">
              Thẻ Ghi Nhớ Ma Thuật
            </h1>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 text-[10px] font-black">
              {totalCards} Thẻ
            </span>
          </div>
        </div>

        {/* Center/Right: Category Filter Bar */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scrollCategory('left')}
            className="w-7 h-7 rounded-lg bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-200/80 cursor-pointer active:scale-95 transition-all shadow-2xs"
            title="Danh mục trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={categoryScrollRef}
            className="flex items-center gap-1.5 overflow-x-auto max-w-[200px] sm:max-w-[360px] md:max-w-lg py-0.5 scrollbar-none scroll-smooth"
          >
            {[
              { id: 'animals', label: `🦁 Động vật (${animalCount})` },
              { id: 'all', label: `✨ Tất cả (${deck.length})` },
              { id: 'fruits', label: '🍎 Đồ ăn' },
              { id: 'transport', label: '🚀 Xe cộ' },
              { id: 'nature', label: '🌈 Thiên nhiên' },
              { id: 'objects', label: '📚 Đồ vật' },
              { id: 'favorites', label: `❤️ Yêu thích (${favorites.length})` },
            ].map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setSelectedCategory(cat.id);
                    setCurrentIndex(0);
                    setIsFlipped(false);
                    setDragOffset({ x: 0, y: 0 });
                  }}
                  className={`px-3 py-1 rounded-xl font-black text-[11px] sm:text-xs transition-all whitespace-nowrap cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50 shadow-2xs'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => scrollCategory('right')}
            className="w-7 h-7 rounded-lg bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-200/80 cursor-pointer active:scale-95 transition-all shadow-2xs"
            title="Danh mục sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. CARD STAGE / BRIGHT GAME TABLE WITH 3-CARD STACK                       */}
      {/* ========================================================================= */}
      <div className="flex-1 min-h-0 w-full px-2 sm:px-4 py-1 flex items-center justify-center overflow-hidden">
        <div className="w-full max-w-[760px] h-full max-h-[calc(100dvh-130px)] rounded-[28px] sm:rounded-[36px] kids-bright-game-table flex flex-col items-center justify-center p-3 sm:p-5 relative overflow-hidden">
          {/* Subtle Ambient Decorative Sparkles */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute top-10 left-12 w-2 h-2 rounded-full bg-amber-400 blur-2xs" />
            <div className="absolute top-14 right-14 w-2.5 h-2.5 rounded-full bg-sky-300 blur-2xs" />
            <div className="absolute bottom-10 left-14 w-2 h-2 rounded-full bg-emerald-400 blur-2xs" />
            <div className="absolute bottom-12 right-16 w-2 h-2 rounded-full bg-rose-300 blur-2xs" />
            <Sparkles className="absolute top-12 right-24 w-4 h-4 text-amber-500/40" />
            <Sparkles className="absolute bottom-14 left-20 w-4 h-4 text-indigo-500/40" />
          </div>

          {/* INNER SAFE CONTAINER FOR STACK */}
          <div className="relative z-10 w-full max-w-[340px] sm:max-w-[380px] lg:max-w-[400px] h-[400px] sm:h-[460px] lg:h-[480px] max-h-[66vh] flex items-center justify-center">
            {/* ================= STACK LAYER 3 (DEEPEST CARD) ================= */}
            {thirdCard && (
              <div
                className={`absolute inset-0 rounded-[20px] bg-gradient-to-b ${thirdCard.theme.bgGradient} border border-white/40 shadow-xs pointer-events-none transition-all duration-300`}
                style={{
                  transform: `translate3d(12px, ${16 - dragRatio * 8}px, -20px) rotate(2deg) scale(${0.91 + dragRatio * 0.04})`,
                  opacity: 0.55 + dragRatio * 0.25,
                  zIndex: 10,
                }}
              />
            )}

            {/* ================= STACK LAYER 2 (MIDDLE CARD PREVIEW) ================= */}
            {nextCard && (
              <div
                className={`absolute inset-0 rounded-[20px] bg-gradient-to-b ${nextCard.theme.bgGradient} border border-white/50 shadow-md pointer-events-none transition-all duration-300`}
                style={{
                  transform: `translate3d(6px, ${8 - dragRatio * 8}px, -10px) rotate(1deg) scale(${0.95 + dragRatio * 0.05})`,
                  opacity: 0.85 + dragRatio * 0.15,
                  zIndex: 20,
                }}
              >
                {/* Visual Preview on Next Card */}
                <div className="w-full h-full p-4 sm:p-5 flex flex-col justify-between opacity-30 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black font-serif">{nextCard.letter}</span>
                    <span className="text-[10px] font-black">{nextCard.categoryVi}</span>
                  </div>
                  <div className="text-center text-4xl">{nextCard.emoji}</div>
                  <div className="text-center font-black text-sm">{nextCard.word}</div>
                </div>
              </div>
            )}

            {/* ================= ACTIVE TOP MAGIC FLASHCARD (DRAGGABLE & FLIPPABLE) ================= */}
            {currentCard && (
              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none select-none"
                style={{
                  transform: activeTransform,
                  transition: activeTransition,
                  opacity: activeOpacity,
                  zIndex: 30,
                  willChange: 'transform',
                }}
              >
                {/* Favorite Bookmark Button Floating on Top Card */}
                <button
                  type="button"
                  onClick={(e) => toggleFavorite(currentCard.id, e)}
                  className="absolute top-4 right-16 z-30 p-1.5 rounded-full bg-white/25 hover:bg-white/40 text-white backdrop-blur-xs transition-transform active:scale-90 cursor-pointer border border-white/30"
                  title="Yêu thích thẻ này"
                >
                  <Heart
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                      favorites.includes(currentCard.id)
                        ? 'fill-rose-400 text-rose-400'
                        : 'text-white/80'
                    }`}
                  />
                </button>

                <MagicFlashcard
                  card={currentCard}
                  isFlipped={isFlipped}
                  onFlip={handleFlip}
                  onSpeakEnglish={handleSpeakEnglish}
                  onSpeakVietnamese={handleSpeakVietnamese}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BOTTOM CONTROLS & COUNTER                                              */}
      {/* ========================================================================= */}
      <footer className="flex-shrink-0 w-full max-w-xl mx-auto px-4 pb-2.5 sm:pb-3 pt-1 flex items-center justify-between gap-3">
        {/* Previous Card Button */}
        <button
          type="button"
          onClick={triggerPrev}
          className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200/80 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Trước</span>
        </button>

        {/* Flip Action Button */}
        <button
          type="button"
          onClick={handleFlip}
          className="py-2 sm:py-2.5 px-4 sm:px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
        >
          <RotateCw className="w-4 h-4" />
          <span>{isFlipped ? 'Mặt trước' : 'Lật xem câu'}</span>
        </button>

        {/* Next Card Button */}
        <button
          type="button"
          onClick={triggerNext}
          className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200/80 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
        >
          <span>Tiếp ({currentIndex + 1}/{totalCards})</span>
          <ArrowRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* Secondary controls: Shuffle & Mute */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleShuffle}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80 transition-colors cursor-pointer active:scale-95 shadow-2xs"
            title="Xáo trộn danh sách thẻ"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80 transition-colors cursor-pointer active:scale-95 shadow-2xs"
            title={isMuted ? 'Bật giọng đọc' : 'Tắt giọng đọc'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default KidsFlashcardsPage;
