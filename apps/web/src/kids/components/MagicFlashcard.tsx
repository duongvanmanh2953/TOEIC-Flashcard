// ============================================================================
// VOCALFLOW KIDS — MAGIC FLASHCARD COMPONENT
// Pixel-perfect match with the "Magic Animal Learning Cards" reference image:
// - Top-Left: Large bold glowing Letter with sparkles (E ✨, F ✨, L ✨, O ✨...)
// - Vivid Candy Gradient Background (Coral, Cyan, Lavender, Azure, Emerald, Mint...)
// - Center: Cute Animal with Soft Glowing Circular Halo & Magical Sparkles
// - Bottom: "is for" (small clean) on top of "Elephant" (large bold title)
// - Flip to Back: Full Vietnamese Meaning, Phonetic IPA, Bilingual Audio, Example Sentence
// ============================================================================

import React, { memo } from 'react';
import { MagicCardItem } from '../data/cards/magicDeckData';
import { KidsIllustration } from '../assets/illustrations/KidsIllustration';
import { Volume2, Sparkles, RotateCw, Languages } from 'lucide-react';

interface MagicFlashcardProps {
  card: MagicCardItem;
  isFlipped: boolean;
  onFlip?: () => void;
  onSpeakEnglish?: (e: React.MouseEvent) => void;
  onSpeakVietnamese?: (e: React.MouseEvent) => void;
  className?: string;
}

export const MagicFlashcard: React.FC<MagicFlashcardProps> = memo(({
  card,
  isFlipped,
  onFlip,
  onSpeakEnglish,
  onSpeakVietnamese,
  className = '',
}) => {
  const { theme } = card;

  return (
    <div
      className={`kids-flip-card w-full h-full relative select-none cursor-pointer ${className}`}
      onClick={onFlip}
    >
      <div className={`kids-flip-inner w-full h-full ${isFlipped ? 'is-flipped' : ''}`}>
        {/* =============================================================== */}
        {/* FRONT: ULTRA-CLEAN "MAGIC ANIMAL LEARNING CARDS" VISUAL          */}
        {/* =============================================================== */}
        <div
          className={`kids-flip-front w-full h-full rounded-[20px] bg-gradient-to-b ${theme.bgGradient} p-5 sm:p-6 flex flex-col justify-between items-center text-center text-white overflow-hidden shadow-[0_16px_36px_-6px_rgba(20,40,70,0.22),0_4px_12px_rgba(0,0,0,0.08)] border-2 border-white/35`}
        >
          {/* Ambient Botanical & Sparkle Background Accents */}
          <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden">
            <div className="absolute -top-12 -left-12 w-40 h-40 bg-white/20 rounded-full blur-xl" />
            <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-white/20 rounded-full blur-xl" />
            <Sparkles className="absolute top-4 right-12 w-4 h-4 text-white/60 animate-pulse" />
            <Sparkles className="absolute bottom-16 left-6 w-3 h-3 text-white/50" />
            <Sparkles className="absolute top-1/2 right-4 w-3.5 h-3.5 text-white/50" />
          </div>

          {/* TOP BAR: BIG BOLD GLOWING LETTER (TOP-LEFT) & SOUND SPEAKER (TOP-RIGHT) */}
          <div className="relative z-10 w-full flex items-center justify-between">
            {/* Top-Left Letter with Little Sparkle */}
            <div className="flex items-center gap-1">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black font-serif text-white tracking-tight filter drop-shadow-sm leading-none">
                {card.letter}
              </span>
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/90 animate-pulse" />
            </div>

            {/* Top-Right Speaker Button */}
            <button
              type="button"
              onClick={onSpeakEnglish}
              className="p-2 sm:p-2.5 rounded-full bg-white/25 hover:bg-white/40 text-white backdrop-blur-xs transition-all active:scale-90 cursor-pointer border border-white/40 shadow-xs"
              title="Phát âm tiếng Anh"
            >
              <Volume2 className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* CENTER: 3D ANIMAL CHARACTER WITH GLOWING HALO RING */}
          <div className="relative z-10 my-auto flex items-center justify-center">
            {/* Ambient Halo Glow Ring */}
            <div
              className="absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-white/25 blur-md pointer-events-none"
            />

            {/* Animal Graphic / 3D Character Illustration */}
            <div className="relative z-10 w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.25)]">
              {['cat', 'dog', 'rabbit', 'lion', 'elephant', 'bear', 'monkey', 'frog', 'bird', 'duck', 'fish', 'turtle', 'butterfly', 'bee', 'panda', 'tiger', 'penguin', 'giraffe', 'zebra', 'dolphin', 'whale', 'fox', 'owl'].includes(card.illustration) ? (
                <KidsIllustration
                  name={card.illustration}
                  className="w-full h-full object-contain filter drop-shadow-md select-none transform hover:scale-105 transition-transform"
                  alt={card.word}
                />
              ) : (
                <span className="text-7xl sm:text-8xl select-none filter drop-shadow-md transform hover:scale-105 transition-transform">
                  {card.emoji}
                </span>
              )}
            </div>
          </div>

          {/* BOTTOM: "is for" + LARGE BOLD TITLE (EXACT MATCH TO REFERENCE PHOTO!) */}
          <div className="relative z-10 w-full flex flex-col items-center justify-center space-y-0.5 pb-1">
            <span className="text-xs sm:text-sm font-bold text-white/90 tracking-wide font-sans lowercase">
              {card.phraseEn}
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight capitalize filter drop-shadow-xs">
              {card.word}
            </h2>
          </div>
        </div>

        {/* =============================================================== */}
        {/* BACK: MEANING, FULL PHRASE & BILINGUAL SPEECH                   */}
        {/* =============================================================== */}
        <div
          className="kids-flip-back w-full h-full rounded-[20px] bg-white p-5 sm:p-6 flex flex-col justify-between items-center text-center text-slate-800 overflow-hidden shadow-[0_16px_36px_-6px_rgba(20,40,70,0.18)] border-2 border-slate-200"
        >
          {/* Top Bar: Meaning Pill & Flip Back CTA */}
          <div className="w-full flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black">
              {card.categoryVi}
            </span>

            <button
              type="button"
              onClick={onFlip}
              className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 active:scale-90 transition-transform cursor-pointer"
              title="Lật lại mặt trước"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Center Mascot & Word Details */}
          <div className="my-auto space-y-2.5 w-full">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-2xl bg-amber-50/80 border border-amber-200 p-2 flex items-center justify-center shadow-xs">
              {['cat', 'dog', 'rabbit', 'lion', 'elephant', 'bear', 'monkey', 'frog', 'bird', 'duck', 'fish', 'turtle', 'butterfly', 'bee', 'panda', 'tiger', 'penguin', 'giraffe', 'zebra', 'dolphin', 'whale', 'fox', 'owl'].includes(card.illustration) ? (
                <KidsIllustration name={card.illustration} className="w-full h-full object-contain" alt={card.word} />
              ) : (
                <span className="text-4xl sm:text-5xl">{card.emoji}</span>
              )}
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight capitalize">
                {card.word}
              </h3>
              <p className="text-lg sm:text-xl font-black text-emerald-600">
                {card.viMeaning}
              </p>
              <p className="text-xs font-bold text-slate-400 font-mono mt-0.5">
                {card.phonetic}
              </p>
            </div>

            {/* Example Sentence Box */}
            <div className="w-full max-w-xs mx-auto p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-left space-y-1">
              <p className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                "{card.sentenceEn}"
              </p>
              <p className="text-[11px] sm:text-xs font-bold text-indigo-600 leading-snug">
                {card.sentenceVi}
              </p>
            </div>
          </div>

          {/* Bottom Dual Speech Buttons */}
          <div className="w-full grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={onSpeakEnglish}
              className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-white" />
              <span>Tiếng Anh</span>
            </button>

            <button
              type="button"
              onClick={onSpeakVietnamese}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5 text-white" />
              <span>Tiếng Việt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default MagicFlashcard;
