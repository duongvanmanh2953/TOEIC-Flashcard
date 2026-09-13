import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KidsIllustration } from '../assets/illustrations/KidsIllustration';
import { voiceService } from '../services/voice/voiceService';
import { soundManager } from '../services/sound/KidsSoundManager';
import {
  Volume2,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Heart,
  BookOpen,
  VolumeX,
  Shuffle,
  Smile,
  Mic,
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
  borderColor: string;
  bgColor: string;
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
    accentColor: 'text-amber-700',
    borderColor: 'border-amber-300',
    bgColor: 'bg-amber-50',
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
    accentColor: 'text-orange-700',
    borderColor: 'border-orange-300',
    bgColor: 'bg-orange-50',
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
    accentColor: 'text-pink-700',
    borderColor: 'border-pink-300',
    bgColor: 'bg-pink-50',
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
    accentColor: 'text-amber-800',
    borderColor: 'border-amber-400',
    bgColor: 'bg-amber-50',
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
    accentColor: 'text-blue-700',
    borderColor: 'border-blue-300',
    bgColor: 'bg-blue-50',
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
    accentColor: 'text-rose-700',
    borderColor: 'border-rose-300',
    bgColor: 'bg-rose-50',
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
    accentColor: 'text-yellow-800',
    borderColor: 'border-yellow-300',
    bgColor: 'bg-yellow-50',
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
    accentColor: 'text-amber-800',
    borderColor: 'border-amber-400',
    bgColor: 'bg-amber-50',
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
    accentColor: 'text-orange-800',
    borderColor: 'border-orange-300',
    bgColor: 'bg-orange-50',
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
    accentColor: 'text-sky-700',
    borderColor: 'border-sky-300',
    bgColor: 'bg-sky-50',
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
    accentColor: 'text-red-700',
    borderColor: 'border-red-300',
    bgColor: 'bg-red-50',
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
    accentColor: 'text-amber-800',
    borderColor: 'border-amber-300',
    bgColor: 'bg-amber-50',
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
    accentColor: 'text-purple-700',
    borderColor: 'border-purple-300',
    bgColor: 'bg-purple-50',
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
    accentColor: 'text-cyan-800',
    borderColor: 'border-cyan-300',
    bgColor: 'bg-cyan-50',
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
    accentColor: 'text-blue-700',
    borderColor: 'border-blue-300',
    bgColor: 'bg-blue-50',
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
    accentColor: 'text-indigo-700',
    borderColor: 'border-indigo-300',
    bgColor: 'bg-indigo-50',
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
    accentColor: 'text-emerald-700',
    borderColor: 'border-emerald-300',
    bgColor: 'bg-emerald-50',
    phraseEn: 'Draw a sunny picture',
    phraseVi: 'Vẽ một bức tranh thật đẹp',
  },
];

export const KidsFlashcardsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');

  const filteredDeck = FLASHCARD_DECK.filter(
    (item) => selectedCategory === 'all' || item.category === selectedCategory
  );

  const currentCard = filteredDeck[currentIndex] || filteredDeck[0];

  const handleFlip = () => {
    soundManager.playClick();
    setIsFlipped((prev) => !prev);
  };

  const handleNext = () => {
    soundManager.playPop();
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % filteredDeck.length);
  };

  const handlePrev = () => {
    soundManager.playPop();
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + filteredDeck.length) % filteredDeck.length);
  };

  const handleSpeakEnglish = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    voiceService.speakEnglish(currentCard.word);
  };

  const handleSpeakVietnamese = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    voiceService.speakVietnameseNorthern(currentCard.viMeaning);
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playStar();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Keyboard navigation & interaction (Section 17: Support click, tap, keyboard: flip, next, prev, audio)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
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
  }, [filteredDeck.length, currentCard]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header Banner (Roomy on tablet and mobile, lg:flex-row on desktop) */}
      <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 rounded-3xl p-4 sm:p-6 lg:p-7 text-slate-950 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-2 border-amber-300 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 text-left min-w-0 flex-1">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/90 backdrop-blur-md flex items-center justify-center shadow-xs border-2 border-amber-200 shrink-0">
            <KidsIllustration name="book" className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/90 text-[11px] sm:text-xs font-black text-amber-950 border border-amber-300 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Học Từ Vựng 3D Tương Tác</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
              Thẻ Ghi Nhớ Flashcard Cho Bé
            </h1>
            <p className="text-xs sm:text-sm font-extrabold text-amber-950/80 mt-0.5 leading-snug">
              Chạm vào thẻ để lật xem nghĩa và nghe phát âm tiếng Việt
            </p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2 bg-white/90 p-1.5 rounded-2xl border-2 border-amber-300 shrink-0 self-stretch sm:self-auto justify-center">
          <button
            onClick={() => setViewMode('carousel')}
            className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all ${
              viewMode === 'carousel'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-700 hover:bg-amber-100'
            }`}
          >
            Thẻ Lật Đơn
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all ${
              viewMode === 'grid'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-700 hover:bg-amber-100'
            }`}
          >
            Lưới Toàn Bộ
          </button>
        </div>
      </div>

      {/* Category Pills Bar (Horizontal scrollable with roomy padding) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'all', label: 'Tất Cả Thẻ', illustration: 'sun' },
          { id: 'animals', label: 'Động Vật', illustration: 'dog' },
          { id: 'food', label: 'Đồ Ăn', illustration: 'apple' },
          { id: 'transport', label: 'Phương Tiện', illustration: 'car' },
          { id: 'objects', label: 'Đồ Dùng', illustration: 'pencil' },
        ].map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                soundManager.playClick();
                setSelectedCategory(cat.id);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all whitespace-nowrap border-2 cursor-pointer ${
                isSelected
                  ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm scale-105'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300 hover:bg-amber-50'
              }`}
            >
              <KidsIllustration name={cat.illustration} className="w-5 h-5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* CAROUSEL FOCUS VIEW */}
      {viewMode === 'carousel' && currentCard && (
        <div className="max-w-md mx-auto space-y-6">
          {/* Card Counter & Favorite Indicator */}
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Thẻ {currentIndex + 1} / {filteredDeck.length}
            </span>

            <button
              onClick={(e) => toggleFavorite(currentCard.id, e)}
              className="flex items-center gap-1 text-xs font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 cursor-pointer active:scale-95"
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  favorites.includes(currentCard.id)
                    ? 'text-rose-500 fill-rose-500'
                    : 'text-rose-400'
                }`}
              />
              <span>{favorites.includes(currentCard.id) ? 'Đã yêu thích' : 'Yêu thích'}</span>
            </button>
          </div>

          {/* 3D FLIP CONTAINER */}
          <div
            onClick={handleFlip}
            className="kids-flip-card w-full h-[380px] sm:h-[420px] cursor-pointer group select-none"
          >
            <div className={`kids-flip-inner ${isFlipped ? 'is-flipped' : ''}`}>
              {/* ================= FRONT SIDE ================= */}
              <div
                className={`kids-flip-front ${currentCard.bgColor} border-2 ${currentCard.borderColor} rounded-3xl p-5 sm:p-7 flex flex-col items-center justify-between text-center`}
              >
                {/* Badge Category */}
                <div className="w-full flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-white/90 border border-slate-200 text-xs font-black text-slate-800">
                    {currentCard.categoryVi}
                  </span>
                  <span className="text-xs font-bold text-slate-600">Chạm để lật ⟳</span>
                </div>

                {/* Big Visual Illustration */}
                <div
                  className="relative z-10 shrink-0 w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-white/90 border-2 border-slate-200/80 flex items-center justify-center p-4 group-hover:scale-105 transition-transform duration-300"
                >
                  <KidsIllustration
                    name={currentCard.illustration}
                    className="w-full h-full object-contain animate-animal-breathe"
                  />
                </div>

                {/* Word & Hint */}
                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-950 uppercase tracking-wider">
                    {currentCard.word}
                  </h2>
                  <p className="text-xs font-bold text-slate-600">{currentCard.phonetic}</p>
                </div>

                {/* Quick Audio Hint */}
                <div className="w-full pt-2 flex items-center justify-center">
                  <button
                    onClick={handleSpeakEnglish}
                    className="px-4 py-2 rounded-2xl bg-white hover:bg-amber-100 border border-amber-300 text-amber-950 text-xs font-black flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Volume2 className="w-4 h-4 text-amber-600" />
                    <span>Nghe từ tiếng Anh</span>
                  </button>
                </div>
              </div>

              {/* ================= BACK SIDE ================= */}
              <div
                className={`kids-flip-back bg-white border-2 ${currentCard.borderColor} rounded-3xl p-5 sm:p-7 flex flex-col items-center justify-between text-center`}
              >
                {/* Header of back */}
                <div className="w-full flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-xs font-black text-emerald-950">
                    Nghĩa & Câu Ví Dụ
                  </span>
                  <RotateCw className="w-4 h-4 text-slate-400 group-hover:rotate-180 transition-transform duration-500" />
                </div>

                {/* Illustration Medium */}
                <div
                  className="relative z-10 shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center p-2"
                >
                  <KidsIllustration name={currentCard.illustration} className="w-full h-full object-contain" />
                </div>

                {/* English + Vietnamese Meanings with high contrast */}
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-950 uppercase">
                    {currentCard.word}
                  </h3>
                  <p className="text-lg sm:text-xl font-black text-emerald-700">
                    {currentCard.viMeaning}
                  </p>
                  <p className="text-xs font-bold text-slate-600">{currentCard.phonetic}</p>
                </div>

                {/* Example phrase box */}
                <div className="w-full p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-left space-y-1">
                  <p className="text-xs font-black text-amber-950">"{currentCard.phraseEn}"</p>
                  <p className="text-[11px] font-bold text-amber-800">👉 {currentCard.phraseVi}</p>
                </div>

                {/* Audio Action Buttons */}
                <div className="w-full grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleSpeakEnglish}
                    className="py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-white" />
                    <span>Phát tiếng Anh</span>
                  </button>

                  <button
                    onClick={handleSpeakVietnamese}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
                  >
                    <Languages className="w-3.5 h-3.5 text-white" />
                    <span>Phát tiếng Việt</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Controls Bar */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={handlePrev}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-black text-sm border-2 border-slate-200 flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Thẻ trước</span>
            </button>

            <button
              onClick={handleFlip}
              className="py-3.5 px-5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-sm border-2 border-amber-300 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            >
              <RotateCw className="w-4 h-4" />
              <span>Lật thẻ</span>
            </button>

            <button
              onClick={handleNext}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-sm border-2 border-amber-500 flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
            >
              <span>Thẻ tiếp</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* GRID VIEW (ALL CARDS AT ONCE) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
          {filteredDeck.map((card) => (
            <div
              key={card.id}
              onClick={() => {
                voiceService.speakEnglish(card.word);
              }}
              className={`p-4 rounded-3xl ${card.bgColor} border-2 ${card.borderColor} hover:scale-105 hover:shadow-md transition-all flex flex-col items-center text-center justify-between gap-3 cursor-pointer group`}
            >
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white/90 border border-slate-200 flex items-center justify-center p-2 shadow-xs">
                <KidsIllustration name={card.illustration} className="w-full h-full" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-950 uppercase">{card.word}</h3>
                <p className="text-xs font-black text-emerald-700 mt-0.5">{card.viMeaning}</p>
                <p className="text-[11px] font-bold text-slate-500">{card.phonetic}</p>
              </div>

              <div className="w-full pt-2 border-t border-slate-200/80 flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-slate-500 truncate">{card.categoryVi}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      voiceService.speakEnglish(card.word);
                    }}
                    title="Nghe tiếng Anh"
                    className="p-1.5 rounded-full bg-white text-sky-600 hover:bg-sky-100 hover:scale-110 transition-all border border-slate-200 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      voiceService.speakVietnameseNorthern(card.viMeaning);
                    }}
                    title="Phát tiếng Việt"
                    className="p-1.5 rounded-full bg-white text-emerald-600 hover:bg-emerald-100 hover:scale-110 transition-all border border-slate-200 cursor-pointer"
                  >
                    <Languages className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KidsFlashcardsPage;
