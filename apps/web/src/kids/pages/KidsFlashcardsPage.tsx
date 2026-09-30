// ============================================================================
// VOCALFLOW KIDS — INTERACTIVE 3D FLASHCARD STACK
// Full 100dvh Viewport • Swiper/Tinder Swipe Gesture • Physical 3-Card Stack
// Zero Gray/White Borders • Organic Table Mat • Pure Lucide SVG Icons
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { KidsIllustration } from '../assets/illustrations/KidsIllustration';
import { voiceService } from '../services/voice/voiceService';
import { soundManager } from '../services/sound/KidsSoundManager';
import {
  Volume2,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Heart,
  VolumeX,
  Shuffle,
  Languages,
} from 'lucide-react';

interface FlashcardItem {
  id: string;
  category: 'animals' | 'food' | 'transport' | 'objects';
  categoryVi: string;
  word: string;
  viMeaning: string;
  phonetic: string;
  illustration: string;
  accentColor: string;
  ringColor: string;
  badgeBg: string;
  phraseEn: string;
  phraseVi: string;
}

const FLASHCARD_DECK: FlashcardItem[] = [
  // Animals
  {
    id: 'f-dog',
    category: 'animals',
    categoryVi: 'Động vật',
    word: 'Dog',
    viMeaning: 'Con chó',
    phonetic: '/dɒɡ/',
    illustration: 'dog',
    accentColor: 'text-amber-800',
    ringColor: 'ring-amber-400/40',
    badgeBg: 'bg-amber-100/90 text-amber-900',
    phraseEn: 'A friendly playful dog',
    phraseVi: 'Một chú chó thân thiện và tinh nghịch',
  },
  {
    id: 'f-cat',
    category: 'animals',
    categoryVi: 'Động vật',
    word: 'Cat',
    viMeaning: 'Con mèo',
    phonetic: '/kæt/',
    illustration: 'cat',
    accentColor: 'text-orange-800',
    ringColor: 'ring-orange-400/40',
    badgeBg: 'bg-orange-100/90 text-orange-900',
    phraseEn: 'The cute little cat',
    phraseVi: 'Chú mèo nhỏ xinh xắn',
  },
  {
    id: 'f-rabbit',
    category: 'animals',
    categoryVi: 'Động vật',
    word: 'Rabbit',
    viMeaning: 'Con thỏ',
    phonetic: '/ˈræb.ɪt/',
    illustration: 'rabbit',
    accentColor: 'text-rose-800',
    ringColor: 'ring-rose-400/40',
    badgeBg: 'bg-rose-100/90 text-rose-900',
    phraseEn: 'The white fluffy rabbit',
    phraseVi: 'Chú thỏ trắng lông xù',
  },
  {
    id: 'f-lion',
    category: 'animals',
    categoryVi: 'Động vật',
    word: 'Lion',
    viMeaning: 'Sư tử',
    phonetic: '/ˈlaɪ.ən/',
    illustration: 'lion',
    accentColor: 'text-amber-900',
    ringColor: 'ring-amber-500/40',
    badgeBg: 'bg-amber-100/90 text-amber-900',
    phraseEn: 'Brave golden lion',
    phraseVi: 'Chú sư tử vàng dũng cảm',
  },
  {
    id: 'f-elephant',
    category: 'animals',
    categoryVi: 'Động vật',
    word: 'Elephant',
    viMeaning: 'Con voi',
    phonetic: '/ˈel.ɪ.fənt/',
    illustration: 'elephant',
    accentColor: 'text-blue-900',
    ringColor: 'ring-blue-400/40',
    badgeBg: 'bg-blue-100/90 text-blue-900',
    phraseEn: 'A big gentle elephant',
    phraseVi: 'Chú voi to lớn và hiền lành',
  },
  // Food
  {
    id: 'f-apple',
    category: 'food',
    categoryVi: 'Đồ ăn & Trái cây',
    word: 'Apple',
    viMeaning: 'Quả táo',
    phonetic: '/ˈæp.əl/',
    illustration: 'apple',
    accentColor: 'text-rose-800',
    ringColor: 'ring-rose-400/40',
    badgeBg: 'bg-rose-100/90 text-rose-900',
    phraseEn: 'A sweet red apple',
    phraseVi: 'Một quả táo đỏ ngọt lịm',
  },
  {
    id: 'f-banana',
    category: 'food',
    categoryVi: 'Đồ ăn & Trái cây',
    word: 'Banana',
    viMeaning: 'Quả chuối',
    phonetic: '/bəˈnɑː.nə/',
    illustration: 'banana',
    accentColor: 'text-amber-900',
    ringColor: 'ring-yellow-400/40',
    badgeBg: 'bg-yellow-100/90 text-yellow-900',
    phraseEn: 'A ripe yellow banana',
    phraseVi: 'Quả chuối vàng chín mọng',
  },
  {
    id: 'f-pizza',
    category: 'food',
    categoryVi: 'Đồ ăn & Trái cây',
    word: 'Pizza',
    viMeaning: 'Bánh Pizza',
    phonetic: '/ˈpiːt.sə/',
    illustration: 'pizza',
    accentColor: 'text-amber-900',
    ringColor: 'ring-amber-500/40',
    badgeBg: 'bg-amber-100/90 text-amber-900',
    phraseEn: 'Delicious cheesy pizza',
    phraseVi: 'Bánh pizza phô mai thơm ngon',
  },
  {
    id: 'f-burger',
    category: 'food',
    categoryVi: 'Đồ ăn & Trái cây',
    word: 'Burger',
    viMeaning: 'Bánh mì kẹp',
    phonetic: '/ˈbɜː.ɡər/',
    illustration: 'burger',
    accentColor: 'text-orange-900',
    ringColor: 'ring-orange-400/40',
    badgeBg: 'bg-orange-100/90 text-orange-900',
    phraseEn: 'Juicy tasty hamburger',
    phraseVi: 'Bánh hamburger đậm đà',
  },
  {
    id: 'f-milk',
    category: 'food',
    categoryVi: 'Đồ ăn & Trái cây',
    word: 'Milk',
    viMeaning: 'Sữa tươi',
    phonetic: '/mɪlk/',
    illustration: 'milk',
    accentColor: 'text-sky-900',
    ringColor: 'ring-sky-400/40',
    badgeBg: 'bg-sky-100/90 text-sky-900',
    phraseEn: 'A cup of fresh milk',
    phraseVi: 'Một ly sữa tươi bổ dưỡng',
  },
  // Transport
  {
    id: 'f-car',
    category: 'transport',
    categoryVi: 'Phương tiện',
    word: 'Car',
    viMeaning: 'Xe ô tô',
    phonetic: '/kɑːr/',
    illustration: 'car',
    accentColor: 'text-red-900',
    ringColor: 'ring-red-400/40',
    badgeBg: 'bg-red-100/90 text-red-900',
    phraseEn: 'A red speedy car',
    phraseVi: 'Chiếc ô tô đỏ chạy nhanh',
  },
  {
    id: 'f-bus',
    category: 'transport',
    categoryVi: 'Phương tiện',
    word: 'Bus',
    viMeaning: 'Xe buýt',
    phonetic: '/bʌs/',
    illustration: 'bus',
    accentColor: 'text-amber-900',
    ringColor: 'ring-amber-400/40',
    badgeBg: 'bg-amber-100/90 text-amber-900',
    phraseEn: 'The yellow school bus',
    phraseVi: 'Chiếc xe buýt trường học màu vàng',
  },
  {
    id: 'f-train',
    category: 'transport',
    categoryVi: 'Phương tiện',
    word: 'Train',
    viMeaning: 'Tàu hỏa',
    phonetic: '/treɪn/',
    illustration: 'train',
    accentColor: 'text-purple-900',
    ringColor: 'ring-purple-400/40',
    badgeBg: 'bg-purple-100/90 text-purple-900',
    phraseEn: 'The magic steam train',
    phraseVi: 'Đoàn tàu hỏa kỳ diệu',
  },
  {
    id: 'f-rocket',
    category: 'transport',
    categoryVi: 'Phương tiện',
    word: 'Rocket',
    viMeaning: 'Tên lửa',
    phonetic: '/ˈrɒk.ɪt/',
    illustration: 'rocket',
    accentColor: 'text-cyan-900',
    ringColor: 'ring-cyan-400/40',
    badgeBg: 'bg-cyan-100/90 text-cyan-900',
    phraseEn: 'Blast off to space rocket',
    phraseVi: 'Tên lửa phóng lên vũ trụ',
  },
  {
    id: 'f-airplane',
    category: 'transport',
    categoryVi: 'Phương tiện',
    word: 'Airplane',
    viMeaning: 'Máy bay',
    phonetic: '/ˈeə.pleɪn/',
    illustration: 'airplane',
    accentColor: 'text-blue-900',
    ringColor: 'ring-blue-400/40',
    badgeBg: 'bg-blue-100/90 text-blue-900',
    phraseEn: 'Fly high in the sky',
    phraseVi: 'Bay lượn trên bầu trời xanh',
  },
  // Objects
  {
    id: 'f-book',
    category: 'objects',
    categoryVi: 'Đồ dùng học tập',
    word: 'Book',
    viMeaning: 'Quyển sách',
    phonetic: '/bʊk/',
    illustration: 'book',
    accentColor: 'text-indigo-900',
    ringColor: 'ring-indigo-400/40',
    badgeBg: 'bg-indigo-100/90 text-indigo-900',
    phraseEn: 'A magical storybook',
    phraseVi: 'Quyển truyện tranh kỳ diệu',
  },
  {
    id: 'f-pencil',
    category: 'objects',
    categoryVi: 'Đồ dùng học tập',
    word: 'Pencil',
    viMeaning: 'Bút chì',
    phonetic: '/ˈpen.səl/',
    illustration: 'pencil',
    accentColor: 'text-emerald-900',
    ringColor: 'ring-emerald-400/40',
    badgeBg: 'bg-emerald-100/90 text-emerald-900',
    phraseEn: 'Draw a sunny picture',
    phraseVi: 'Vẽ một bức tranh thật đẹp',
  },
];

export const KidsFlashcardsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deck, setDeck] = useState<FlashcardItem[]>(FLASHCARD_DECK);
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

  const filteredDeck = deck.filter(
    (item) => selectedCategory === 'all' || item.category === selectedCategory
  );

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
  // SWIPE DRAG GESTURE HANDLERS (POINTER EVENTS: TOUCH + MOUSE COMPATIBLE)
  // =========================================================================
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isTransitioningRef.current) return;
    // Don't drag if interactive button inside card was clicked
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
    const deltaY = (e.clientY - dragStartRef.current.y) * 0.25; // dampening Y movement
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || isTransitioningRef.current) return;
    setIsDragging(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored if capture was lost
    }

    const deltaX = dragOffset.x;
    const duration = Date.now() - dragStartRef.current.time;

    // TAP / CLICK DETECTION: minimal movement and short duration -> Flip card!
    if (Math.abs(deltaX) < 10 && duration < 320) {
      handleFlip();
      setDragOffset({ x: 0, y: 0 });
      return;
    }

    // SWIPE THRESHOLD: 80px or fast swipe
    const isQuickSwipe = Math.abs(deltaX) > 45 && duration < 250;
    if (deltaX < -80 || (isQuickSwipe && deltaX < 0)) {
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
  const dragRatio = Math.min(Math.abs(dragOffset.x) / 120, 1);

  // Active card transform
  let activeTransform = `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${dragOffset.x * 0.06}deg)`;
  let activeTransition = isDragging ? 'none' : 'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 240ms ease-out';
  let activeOpacity = 1;

  if (flyOutDirection === 'left') {
    activeTransform = 'translate3d(-120vw, 0, 0) rotate(-16deg)';
    activeTransition = 'transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 220ms ease-out';
    activeOpacity = 0;
  } else if (flyOutDirection === 'right') {
    activeTransform = 'translate3d(120vw, 0, 0) rotate(16deg)';
    activeTransition = 'transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 220ms ease-out';
    activeOpacity = 0;
  }

  return (
    <div className="w-screen h-[100dvh] max-h-[100dvh] max-w-full overflow-hidden flex flex-col justify-between bg-[#0A0D18] text-slate-100 select-none">
      {/* ========================================================================= */}
      {/* 1. HEADER (FLEX-SHRINK: 0, TONAL BORDER, PURE SVG ICONS)                  */}
      {/* ========================================================================= */}
      <header className="flex-shrink-0 w-full max-w-5xl mx-auto px-3 sm:px-4 pt-2.5 sm:pt-3 pb-1 flex items-center justify-between gap-3">
        {/* Left: Back button & Title */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              soundManager.playPop();
              navigate('/kids');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161F36] hover:bg-[#1E2B4B] text-slate-200 text-xs font-bold transition-colors cursor-pointer ring-1 ring-indigo-500/20 active:scale-95 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-slate-300" />
            <span>Thoát</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center ring-1 ring-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm lg:text-base font-black text-white tracking-tight">
                Thẻ Ghi Nhớ
              </h1>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 ring-1 ring-indigo-500/30 text-[10px] font-black">
                {totalCards} Từ Vựng
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right: Category Filter Bar */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scrollCategory('left')}
            className="w-7 h-7 rounded-lg bg-[#161F36] hover:bg-[#1E2B4B] text-slate-300 flex items-center justify-center ring-1 ring-indigo-500/20 cursor-pointer active:scale-95 transition-all"
            title="Danh mục trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={categoryScrollRef}
            className="flex items-center gap-1.5 overflow-x-auto max-w-[200px] sm:max-w-[340px] md:max-w-md py-0.5 scrollbar-none scroll-smooth"
          >
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'animals', label: 'Động vật' },
              { id: 'food', label: 'Đồ ăn' },
              { id: 'transport', label: 'Xe cộ' },
              { id: 'objects', label: 'Đồ dùng' },
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
                  className={`px-3 py-1 rounded-xl font-black text-[11px] sm:text-xs transition-all whitespace-nowrap cursor-pointer ring-1 ${
                    isSelected
                      ? 'bg-indigo-600 text-white ring-indigo-400 shadow-sm'
                      : 'bg-[#161F36] text-slate-300 ring-indigo-500/20 hover:bg-[#1E2B4B]'
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
            className="w-7 h-7 rounded-lg bg-[#161F36] hover:bg-[#1E2B4B] text-slate-300 flex items-center justify-center ring-1 ring-indigo-500/20 cursor-pointer active:scale-95 transition-all"
            title="Danh mục sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. CARD STAGE / ORGANIC TABLE MAT WITH 3-CARD STACK                       */}
      {/* ========================================================================= */}
      <div className="flex-1 min-h-0 w-full px-2 sm:px-4 py-1 flex items-center justify-center overflow-hidden">
        <div className="w-full max-w-[720px] h-full max-h-[calc(100dvh-130px)] rounded-[32px] sm:rounded-[44px] bg-[#12182B] shadow-[0_24px_60px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(129,140,248,0.18)] flex flex-col items-center justify-center p-3 sm:p-5 relative overflow-hidden ring-1 ring-indigo-500/25">
          {/* Ambient Table Spotlight */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1C2748_0%,_#0E1424_100%)] pointer-events-none" />

          {/* Inner Organic Felt Edge */}
          <div className="absolute inset-2.5 sm:inset-3.5 rounded-[26px] sm:rounded-[38px] border border-indigo-400/10 pointer-events-none" />

          {/* INNER SAFE CONTAINER FOR STACK */}
          <div className="relative z-10 w-full max-w-[340px] sm:max-w-[400px] h-[370px] sm:h-[450px] max-h-[64vh] flex items-center justify-center">
            {/* ================= STACK LAYER 3 (DEEPEST CARD) ================= */}
            {thirdCard && (
              <div
                className="absolute inset-0 rounded-[28px] sm:rounded-[34px] bg-[#1A223B] ring-1 ring-indigo-500/20 shadow-md pointer-events-none transition-all duration-300"
                style={{
                  transform: `translate3d(0, ${22 - dragRatio * 10}px, 0) scale(${0.88 + dragRatio * 0.06})`,
                  opacity: 0.45 + dragRatio * 0.35,
                  zIndex: 10,
                }}
              />
            )}

            {/* ================= STACK LAYER 2 (MIDDLE CARD) ================= */}
            {nextCard && (
              <div
                className="absolute inset-0 rounded-[28px] sm:rounded-[34px] bg-[#1E2847] ring-1 ring-indigo-400/25 shadow-lg pointer-events-none transition-all duration-300"
                style={{
                  transform: `translate3d(0, ${11 - dragRatio * 11}px, 0) scale(${0.94 + dragRatio * 0.06})`,
                  opacity: 0.85 + dragRatio * 0.15,
                  zIndex: 20,
                }}
              >
                {/* Visual Preview on Next Card */}
                <div className="w-full h-full p-5 sm:p-7 flex flex-col items-center justify-between opacity-30">
                  <div className="w-full flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-400">
                      {nextCard.categoryVi}
                    </span>
                  </div>
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-indigo-900/40 p-2 flex items-center justify-center">
                    <KidsIllustration name={nextCard.illustration} className="w-full h-full object-contain" />
                  </div>
                  <div className="h-6" />
                </div>
              </div>
            )}

            {/* ================= ACTIVE TOP FLASHCARD (DRAGGABLE & FLIPPABLE) ================= */}
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
                <div className="kids-flip-card w-full h-full">
                  <div className={`kids-flip-inner ${isFlipped ? 'is-flipped' : ''}`}>
                    {/* ================= FRONT SIDE ================= */}
                    <div
                      className={`kids-flip-front rounded-[28px] sm:rounded-[34px] bg-gradient-to-b from-[#F8FAFC] via-white to-[#EEF2FF] p-5 sm:p-7 flex flex-col items-center justify-between text-center overflow-hidden ring-1 ${currentCard.ringColor} shadow-[0_20px_50px_rgba(0,0,0,0.55)]`}
                    >
                      {/* Top Bar: Category Pill & Favorite */}
                      <div className="w-full flex items-center justify-between">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black tracking-wide ${currentCard.badgeBg}`}
                        >
                          {currentCard.categoryVi}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(currentCard.id, e)}
                          className="p-1.5 rounded-full text-rose-500 hover:bg-rose-50 active:scale-90 transition-transform cursor-pointer"
                          title="Yêu thích thẻ này"
                        >
                          <Heart
                            className={`w-4 h-4 sm:w-5 sm:h-5 ${
                              favorites.includes(currentCard.id)
                                ? 'fill-rose-500 text-rose-500'
                                : 'text-slate-400'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Center Illustration with subtle breathe motion */}
                      <div className="relative shrink-0 w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-indigo-50/70 p-4 sm:p-5 flex items-center justify-center shadow-inner">
                        <KidsIllustration
                          name={currentCard.illustration}
                          className="w-full h-full object-contain filter drop-shadow-md animate-animal-breathe"
                          alt={currentCard.word}
                        />
                      </div>

                      {/* Word & Phonetic */}
                      <div className="space-y-1">
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-wider">
                          {currentCard.word}
                        </h2>
                        <p className="text-xs sm:text-sm font-bold text-slate-500">
                          {currentCard.phonetic}
                        </p>
                      </div>

                      {/* English Pronunciation Trigger */}
                      <div className="w-full flex items-center justify-center">
                        <button
                          type="button"
                          onClick={handleSpeakEnglish}
                          className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer"
                        >
                          <Volume2 className="w-4 h-4 text-white" />
                          <span>Nghe phát âm</span>
                        </button>
                      </div>
                    </div>

                    {/* ================= BACK SIDE ================= */}
                    <div
                      className={`kids-flip-back rounded-[28px] sm:rounded-[34px] bg-gradient-to-b from-[#F8FAFC] via-white to-[#EFF6FF] p-5 sm:p-7 flex flex-col items-center justify-between text-center overflow-hidden ring-2 ring-emerald-400/50 shadow-[0_20px_50px_rgba(0,0,0,0.55)]`}
                    >
                      {/* Top Bar: Meaning Pill & Flip Icon */}
                      <div className="w-full flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-900 text-xs font-black">
                          Ý nghĩa & Ví dụ
                        </span>

                        <button
                          type="button"
                          onClick={handleFlip}
                          className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 active:scale-90 transition-transform cursor-pointer"
                          title="Lật lại mặt trước"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Small Illustration Preview */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-50/70 p-2 flex items-center justify-center shadow-inner">
                        <KidsIllustration
                          name={currentCard.illustration}
                          className="w-full h-full object-contain"
                          alt={currentCard.word}
                        />
                      </div>

                      {/* English + Vietnamese Typography */}
                      <div className="space-y-1">
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 uppercase">
                          {currentCard.word}
                        </h3>
                        <p className="text-xl sm:text-2xl font-black text-emerald-700">
                          {currentCard.viMeaning}
                        </p>
                        <p className="text-xs font-bold text-slate-500">{currentCard.phonetic}</p>
                      </div>

                      {/* Example Phrase Box */}
                      <div className="w-full p-3 sm:p-3.5 rounded-2xl bg-indigo-50/80 ring-1 ring-indigo-200/50 text-left space-y-1">
                        <p className="text-xs sm:text-sm font-black text-slate-900">
                          "{currentCard.phraseEn}"
                        </p>
                        <p className="text-[11px] sm:text-xs font-bold text-indigo-700">
                          {currentCard.phraseVi}
                        </p>
                      </div>

                      {/* Two Audio Buttons */}
                      <div className="w-full grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={handleSpeakEnglish}
                          className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-white" />
                          <span>Tiếng Anh</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSpeakVietnamese}
                          className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
                        >
                          <Languages className="w-3.5 h-3.5 text-white" />
                          <span>Tiếng Việt</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BOTTOM CONTROLS (FLEX-SHRINK: 0, MINIMAL, NO EMOJI)                    */}
      {/* ========================================================================= */}
      <footer className="flex-shrink-0 w-full max-w-xl mx-auto px-4 pb-2.5 sm:pb-3 pt-1 flex items-center justify-between gap-3">
        {/* Previous Card Button */}
        <button
          type="button"
          onClick={triggerPrev}
          className="flex-1 py-2.5 sm:py-3 px-3 rounded-xl bg-[#161F36] hover:bg-[#1E2B4B] text-slate-200 font-bold text-xs sm:text-sm ring-1 ring-indigo-500/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-slate-300" />
          <span>Trước</span>
        </button>

        {/* Flip Action Button */}
        <button
          type="button"
          onClick={handleFlip}
          className="py-2.5 sm:py-3 px-4 sm:px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm ring-1 ring-indigo-400 flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/25 transition-all cursor-pointer active:scale-95"
        >
          <RotateCw className="w-4 h-4 text-white" />
          <span>Lật thẻ</span>
        </button>

        {/* Next Card Button */}
        <button
          type="button"
          onClick={triggerNext}
          className="flex-1 py-2.5 sm:py-3 px-3 rounded-xl bg-[#161F36] hover:bg-[#1E2B4B] text-slate-200 font-bold text-xs sm:text-sm ring-1 ring-indigo-500/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95 shadow-sm"
        >
          <span>Tiếp</span>
          <ArrowRight className="w-4 h-4 text-slate-300" />
        </button>

        {/* Secondary controls: Shuffle & Mute */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleShuffle}
            className="p-2 sm:p-2.5 rounded-xl bg-[#161F36] hover:bg-[#1E2B4B] text-slate-300 ring-1 ring-indigo-500/20 transition-colors cursor-pointer active:scale-95"
            title="Xáo trộn danh sách thẻ"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 sm:p-2.5 rounded-xl bg-[#161F36] hover:bg-[#1E2B4B] text-slate-300 ring-1 ring-indigo-500/20 transition-colors cursor-pointer active:scale-95"
            title={isMuted ? 'Bật giọng đọc' : 'Tắt giọng đọc'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-indigo-400" />
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default KidsFlashcardsPage;
