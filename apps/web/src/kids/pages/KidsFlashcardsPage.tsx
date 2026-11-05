// ============================================================================
// VOCALFLOW KIDS — MAGIC FLASHCARD DECK (SWIPER EFFECT-CARDS)
// Seamless Card Stack • 75 Animals + Multi-Themes • Clean Segmented Tabs
// Zero Glitch / Jump-Back • Exact Match to "Magic Animal Learning Cards" Aesthetic
// ============================================================================

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCards } from 'swiper/modules';
import type { Swiper as SwiperInstance } from 'swiper';

import 'swiper/css';
import 'swiper/css/effect-cards';

import { MAGIC_CARDS_DATASET, MagicCardItem } from '../data/cards/magicDeckData';
import { MagicFlashcard } from '../components/MagicFlashcard';
import { voiceService } from '../services/voice/voiceService';
import { soundManager } from '../services/sound/KidsSoundManager';
import { gameAssetService } from '../services/assets/gameAssetService';
import {
  Volume2,
  VolumeX,
  RotateCw,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Heart,
} from 'lucide-react';

interface CategoryOption {
  id: string;
  label: string;
  icon: string;
}

const CATEGORY_TABS: CategoryOption[] = [
  { id: 'animals', label: 'Động vật (75)', icon: '🦁' },
  { id: 'all', label: 'Tất cả (104)', icon: '✨' },
  { id: 'fruits', label: 'Đồ ăn (14)', icon: '🍎' },
  { id: 'transport', label: 'Xe cộ (7)', icon: '🚀' },
  { id: 'nature', label: 'Thiên nhiên (8)', icon: '🌈' },
  { id: 'favorites', label: 'Yêu thích', icon: '❤️' },
];

export const KidsFlashcardsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('animals');
  const [deck, setDeck] = useState<MagicCardItem[]>(MAGIC_CARDS_DATASET);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const swiperRef = useRef<SwiperInstance | null>(null);
  const prevIndexRef = useRef<number>(0);

  // Filter deck based on selected category
  const filteredDeck = useMemo(() => {
    if (selectedCategory === 'favorites') {
      return deck.filter((item) => favorites.includes(item.id));
    }
    if (selectedCategory === 'all') return deck;
    return deck.filter((item) => item.category === selectedCategory);
  }, [deck, selectedCategory, favorites]);

  const totalCards = filteredDeck.length;
  const currentCard = filteredDeck[currentIndex] || filteredDeck[0];

  // Preload audio words for the active category
  useEffect(() => {
    if (filteredDeck.length > 0) {
      voiceService.preloadWords(filteredDeck.map((d) => d.word));
    }
  }, [filteredDeck]);

  // Pronounce active word whenever currentIndex changes (if not muted)
  useEffect(() => {
    if (currentCard && !isMuted) {
      voiceService.speakEnglish(currentCard.word);
    }
    setIsFlipped(false);
  }, [currentIndex, currentCard, isMuted]);

  // Clean voice and abort pending requests on unmount
  useEffect(() => {
    return () => {
      voiceService.stop();
      gameAssetService.abortPendingRequests();
    };
  }, []);

  // Handle slide change directly from Swiper engine with Directional Prefetch
  const handleSlideChange = (swiper: SwiperInstance) => {
    const newIdx = swiper.realIndex;
    const direction = newIdx >= prevIndexRef.current ? 'forward' : 'backward';
    prevIndexRef.current = newIdx;

    setCurrentIndex(newIdx);
    setIsFlipped(false);
    soundManager.playPop();

    // Directional prefetch: only prefetch 3 cards in user swiping direction
    if (direction === 'forward') {
      const nextItems = filteredDeck.slice(newIdx + 6, newIdx + 9);
      nextItems.forEach((it) => {
        gameAssetService.preloadImage(`/game-assets/animals/${it.illustration}.webp`);
      });
    } else {
      const prevItems = filteredDeck.slice(Math.max(0, newIdx - 8), Math.max(0, newIdx - 5));
      prevItems.forEach((it) => {
        gameAssetService.preloadImage(`/game-assets/animals/${it.illustration}.webp`);
      });
    }
  };

  // Flip active card
  const handleFlip = useCallback(() => {
    soundManager.playClick();
    setIsFlipped((prev) => !prev);
  }, []);

  // Next / Previous slide controls
  const handleNext = useCallback(() => {
    if (swiperRef.current) {
      swiperRef.current.slideNext();
    }
  }, []);

  const handlePrev = useCallback(() => {
    if (swiperRef.current) {
      swiperRef.current.slidePrev();
    }
  }, []);

  // Shuffle deck
  const handleShuffle = () => {
    soundManager.playSparkle();
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    if (swiperRef.current) {
      swiperRef.current.slideTo(0);
    }
  };

  const handleSpeakEnglish = (card: MagicCardItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundManager.playPop();
    voiceService.speakEnglish(card.word);
  };

  const handleSpeakVietnamese = (card: MagicCardItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    voiceService.speakVietnameseNorthern(card.viMeaning);
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playStar();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (e.key.toLowerCase() === 's' && currentCard) {
        e.preventDefault();
        voiceService.speakEnglish(currentCard.word);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, handleFlip, currentCard]);

  return (
    <div className="w-full h-full max-h-[100dvh] flex flex-col justify-between items-center overflow-hidden kids-bright-page-bg text-slate-800 select-none">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER (BALANCED, CLEAN, NO OVERCROWDED TABS)                      */}
      {/* ========================================================================= */}
      <header className="flex-shrink-0 w-full max-w-4xl mx-auto px-3 sm:px-4 pt-2.5 sm:pt-3 pb-1 flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Back Button & Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => {
              soundManager.playPop();
              navigate('/kids');
            }}
            className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-200/80 shadow-2xs active:scale-95 shrink-0"
            title="Quay lại thế giới trẻ thơ"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span className="hidden xs:inline">Thoát</span>
          </button>

          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className="text-xs sm:text-base font-black text-slate-900 tracking-tight truncate">
              Magic Flashcards
            </h1>
            <span className="hidden md:inline-block px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80 text-[10px] font-black">
              Thẻ Thông Minh
            </span>
          </div>
        </div>

        {/* Center: Progress Counter (01 / 75) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className="text-[11px] sm:text-sm font-black text-slate-700 font-mono">
            {String(currentIndex + 1).padStart(2, '0')}/{String(totalCards).padStart(2, '0')}
          </span>
          <div className="w-10 sm:w-20 h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-300"
              style={{ width: `${totalCards > 0 ? ((currentIndex + 1) / totalCards) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Right: Sound & Shuffle Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsMuted((prev) => !prev)}
            className="p-1.5 sm:p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-600 cursor-pointer transition-colors shadow-2xs"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-slate-700" />}
          </button>

          <button
            type="button"
            onClick={handleShuffle}
            className="p-1.5 sm:p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-600 cursor-pointer transition-colors shadow-2xs"
            title="Trộn bộ thẻ"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. DEDICATED CATEGORY BAR (ORGANIZED, CENTERED, CLEAN)                   */}
      {/* ========================================================================= */}
      <div className="flex-shrink-0 w-full max-w-4xl mx-auto px-3 sm:px-4 py-1.5 flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none">
        {CATEGORY_TABS.map((cat) => {
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
                if (swiperRef.current) {
                  swiperRef.current.slideTo(0);
                }
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-black text-xs sm:text-sm whitespace-nowrap cursor-pointer transition-all duration-200 active:scale-95 border shrink-0 ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50 shadow-2xs'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. CARD STAGE (CENTERED, PASTEL TABLE TINT, ZERO SCREEN-SHIFT)            */}
      {/* ========================================================================= */}
      <main className="flex-1 min-h-0 w-full px-3 sm:px-6 py-1 flex items-center justify-center overflow-hidden">
        <div className="w-full max-w-[820px] h-full max-h-[calc(100dvh-150px)] rounded-[28px] sm:rounded-[36px] kids-bright-game-table flex flex-col items-center justify-center p-3 sm:p-5 relative overflow-hidden">
          {/* Subtle Ambient Decorative Sparkles */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute top-8 left-12 w-2 h-2 rounded-full bg-amber-400 blur-2xs" />
            <div className="absolute top-14 right-16 w-3 h-3 rounded-full bg-sky-300 blur-2xs" />
            <div className="absolute bottom-10 left-16 w-2.5 h-2.5 rounded-full bg-emerald-400 blur-2xs" />
            <div className="absolute bottom-12 right-20 w-2 h-2 rounded-full bg-rose-300 blur-2xs" />
          </div>

          {/* SWIPER CONTAINER WITH EFFECT="CARDS" (FLUID 60FPS SWIPING, ZERO JUMP-BACK) */}
          <div className="relative flex items-center justify-center w-full max-w-[320px] sm:max-w-[360px] lg:max-w-[380px]">
            {filteredDeck.length === 0 ? (
              <div className="text-center py-16 space-y-2 text-slate-400">
                <Heart className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-bold">Chưa có thẻ nào trong mục này</p>
              </div>
            ) : (
              <Swiper
                effect="cards"
                grabCursor={true}
                modules={[EffectCards]}
                cardsEffect={{
                  slideShadows: false,
                  perSlideOffset: 8,
                  perSlideRotate: 2.2,
                }}
                onSwiper={(swiper) => {
                  swiperRef.current = swiper;
                }}
                onSlideChange={handleSlideChange}
                className="kids-card-swiper"
              >
                {filteredDeck.map((item, idx) => {
                  const isActive = idx === currentIndex;
                  const isWithinWindow = Math.abs(idx - currentIndex) <= 5;

                  return (
                    <SwiperSlide key={item.id}>
                      {isWithinWindow ? (
                        <div className="w-full h-full relative">
                          {/* Favorite Button on Top-Right */}
                          <button
                            type="button"
                            onClick={(e) => toggleFavorite(item.id, e)}
                            className="absolute top-4 right-16 z-30 p-1.5 sm:p-2 rounded-full bg-white/25 hover:bg-white/40 text-white backdrop-blur-xs transition-transform active:scale-90 cursor-pointer border border-white/30"
                            title="Yêu thích thẻ này"
                          >
                            <Heart
                              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                                favorites.includes(item.id)
                                  ? 'fill-rose-400 text-rose-400'
                                  : 'text-white/80'
                              }`}
                            />
                          </button>

                          <MagicFlashcard
                            card={item}
                            isFlipped={isActive && isFlipped}
                            onFlip={handleFlip}
                            onSpeakEnglish={(e) => handleSpeakEnglish(item, e)}
                            onSpeakVietnamese={(e) => handleSpeakVietnamese(item, e)}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full rounded-[20px] bg-slate-100/30 border border-slate-200/20" />
                      )}
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            )}
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 4. BOTTOM ACTION BAR (CLEAN, SPACED, TOUCH-FRIENDLY)                      */}
      {/* ========================================================================= */}
      <footer className="flex-shrink-0 w-full max-w-xl mx-auto px-3 sm:px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 flex items-center justify-between gap-2 sm:gap-3">
        {/* Previous Button */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex-1 py-2 sm:py-3 px-2 sm:px-3 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold text-xs sm:text-sm border border-slate-200/80 flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs min-h-[44px]"
        >
          <ChevronLeft className="w-4 h-4 text-slate-600" />
          <span>Trước</span>
        </button>

        {/* Flip Action Button */}
        <button
          type="button"
          onClick={handleFlip}
          className="flex-[1.5] py-2 sm:py-3 px-3 sm:px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 min-h-[44px]"
        >
          <RotateCw className="w-4 h-4" />
          <span>{isFlipped ? 'Mặt trước' : 'Lật xem câu'}</span>
        </button>

        {/* Next Button */}
        <button
          type="button"
          onClick={handleNext}
          disabled={currentIndex >= totalCards - 1}
          className="flex-1 py-2 sm:py-3 px-2 sm:px-3 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold text-xs sm:text-sm border border-slate-200/80 flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs min-h-[44px]"
        >
          <span>Tiếp</span>
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </button>
      </footer>
    </div>
  );
};

export default KidsFlashcardsPage;
