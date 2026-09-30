// ============================================================================
// GAME 03: WORD POP (BẮN NỔ BONG BÓNG TỪ)
// HEAR -> TRACK -> POP • 2D Floating Bubbles • Squash & Pop Physics
// Non-Auto-Advancing: User taps Continue button after praise audio finishes
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Sparkles, Target } from 'lucide-react';
import { KidsGameWrapper } from '../core/KidsGameWrapper';
import { KIDS_GAMES_REGISTRY } from '../../data/games/gamesRegistry';
import { COMPREHENSIVE_VOCABULARY, VocabularyItem } from '../../data/vocabulary/vocabularyData';
import { KidsIllustration } from '../../assets/illustrations/KidsIllustration';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';

interface BubbleItem {
  id: string;
  word: string;
  viMeaning: string;
  colorClass: string;
  leftPercent: number;
  isPopped: boolean;
}

const BUBBLE_THEMES = [
  { colorClass: 'from-rose-400 to-red-500 border-rose-300 text-white' },
  { colorClass: 'from-sky-400 to-blue-500 border-sky-300 text-white' },
  { colorClass: 'from-emerald-400 to-teal-500 border-emerald-300 text-white' },
  { colorClass: 'from-amber-400 to-orange-500 border-amber-300 text-white' },
  { colorClass: 'from-purple-400 to-indigo-500 border-purple-300 text-white' },
];

interface WordPopGameProps {
  onExit: () => void;
  onStarsAwarded?: (stars: number) => void;
  onNextGame?: () => void;
}

export const WordPopGame: React.FC<WordPopGameProps> = ({
  onExit,
  onStarsAwarded,
  onNextGame,
}) => {
  const gameDef = KIDS_GAMES_REGISTRY.find((g) => g.id === 'word_pop') || KIDS_GAMES_REGISTRY[2];

  const TOTAL_ROUNDS = 5;
  const [currentRound, setCurrentRound] = useState(1);
  const [starsEarned, setStarsEarned] = useState(0);
  const [targetWord, setTargetWord] = useState<VocabularyItem>(COMPREHENSIVE_VOCABULARY[0]);
  const [bubbles, setBubbles] = useState<BubbleItem[]>([]);
  const [poppedId, setPoppedId] = useState<string | null>(null);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isReadyToContinue, setIsReadyToContinue] = useState(false);
  const [praiseVi, setPraiseVi] = useState('');

  // Initialize round
  const initRound = useCallback((roundNum: number) => {
    setPoppedId(null);
    setIsReadyToContinue(false);

    const shuffled = [...COMPREHENSIVE_VOCABULARY].sort(() => Math.random() - 0.5);
    const target = shuffled[0];
    const choices = shuffled.slice(0, 4);

    setTargetWord(target);

    // Preload audio words
    voiceService.preloadWords(choices.map((c) => c.word));

    const newBubbles: BubbleItem[] = choices.map((item, idx) => ({
      id: `${item.id}_${idx}_${Date.now()}`,
      word: item.word,
      viMeaning: item.viMeaning,
      colorClass: BUBBLE_THEMES[idx % BUBBLE_THEMES.length].colorClass,
      leftPercent: 10 + idx * 22,
      isPopped: false,
    }));

    setBubbles(newBubbles);

    // Speak prompt promptly
    const promptTimer = setTimeout(() => {
      voiceService.speakWord(target.word);
    }, 80);

    return () => clearTimeout(promptTimer);
  }, []);

  useEffect(() => {
    initRound(1);
  }, [initRound]);

  const handlePopBubble = (bubble: BubbleItem) => {
    if (poppedId || bubble.isPopped || isReadyToContinue) return;

    if (bubble.word.toLowerCase() === targetWord.word.toLowerCase()) {
      // CORRECT! SQUASH AND POP!
      setPoppedId(bubble.id);
      soundManager.play('bubble_burst');
      soundManager.play('pop');

      const updated = bubbles.map((b) =>
        b.id === bubble.id ? { ...b, isPopped: true } : b
      );
      setBubbles(updated);

      const earned = 2;
      setStarsEarned((prev) => prev + earned);
      if (onStarsAwarded) onStarsAwarded(earned);

      const praise = 'Bé ngắm bắn bóng chuẩn lắm!';
      setPraiseVi(praise);

      // Super-fast responsive audio
      voiceService.speakWord(bubble.word);
      setTimeout(() => {
        voiceService.speakVietnamese(praise);
      }, 450);

      // Fast continue unlock: 500ms
      setTimeout(() => {
        setIsReadyToContinue(true);
      }, 500);
    } else {
      // WRONG BUBBLE
      soundManager.play('wrong');
      voiceService.speakVietnamese('Thử lại nhé bé ơi!');
    }
  };

  const handleAdvanceRound = () => {
    setIsReadyToContinue(false);
    if (currentRound < TOTAL_ROUNDS) {
      setCurrentRound((prev) => prev + 1);
      initRound(currentRound + 1);
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
      instructionEn={`Pop ${targetWord.word.toUpperCase()}!`}
      instructionVi={`Làm nổ quả bóng: ${targetWord.viMeaning}`}
      isReadyToContinue={isReadyToContinue}
      onContinueRound={handleAdvanceRound}
      praiseVi={praiseVi}
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
      {/* FULL-BLEED SKY ARCADE BUBBLE FIELD */}
      <div className="relative w-full h-full p-4 sm:p-8 flex flex-col justify-between items-center overflow-hidden bg-gradient-to-b from-sky-400 via-sky-200 to-indigo-100 select-none">
        {/* Arcade Background Floating Orbs */}
        <div className="absolute top-6 left-10 w-12 h-12 text-white/30 pointer-events-none select-none animate-pulse">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
          </svg>
        </div>
        <div className="absolute top-10 right-14 w-12 h-12 text-white/30 pointer-events-none select-none animate-pulse">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
          </svg>
        </div>

        {/* Target Callout Banner */}
        <div className="relative z-20 flex flex-col items-center text-center space-y-1">
          <div className="px-6 py-2.5 rounded-full bg-white/95 text-slate-950 font-black text-sm sm:text-base shadow-lg border-2 border-sky-400 flex items-center gap-2">
            <Target className="w-5 h-5 text-sky-600 animate-spin-slow" />
            <span>BẮN NỔ BÓNG: "{targetWord.word.toUpperCase()}" ({targetWord.viMeaning})</span>
          </div>
          <span className="text-xs font-bold text-slate-700">
            Chạm vào bong bóng xà phòng mang đúng từ nhé!
          </span>
        </div>

        {/* Floating Soap Bubbles Field (Wider & Spaced for Comfort) */}
        <div className="relative z-10 w-full max-w-4xl my-auto py-8 sm:py-12 flex items-center justify-around gap-4 sm:gap-8">
          {bubbles.map((bubble, idx) => {
            const isTarget = bubble.word.toLowerCase() === targetWord.word.toLowerCase();
            const isPopping = poppedId === bubble.id;

            if (bubble.isPopped && !isPopping) return null;

            return (
              <div
                key={bubble.id}
                onClick={() => handlePopBubble(bubble)}
                className={`relative flex flex-col items-center cursor-pointer select-none group transition-transform ${
                  isPopping ? 'animate-bubble-squash-pop pointer-events-none' : 'hover:scale-110 active:scale-95'
                }`}
                style={{
                  animation: isPopping
                    ? undefined
                    : `gentleFloat 3.5s ease-in-out infinite ${idx * 0.5}s`,
                }}
              >
                {/* Bubble Sphere with Glass Sheen */}
                <div
                  className={`w-28 sm:w-36 h-28 sm:h-36 rounded-full bg-gradient-to-tr ${bubble.colorClass} border-4 shadow-xl flex flex-col items-center justify-center p-3 relative overflow-hidden backdrop-blur-xs`}
                >
                  {/* Glossy Reflection Highlight */}
                  <div className="absolute top-2 left-3 w-6 sm:w-8 h-3 sm:h-4 bg-white/60 rounded-full -rotate-45 pointer-events-none" />

                  <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
                    <KidsIllustration
                      name={bubble.word.toLowerCase()}
                      className="w-full h-full object-contain filter drop-shadow-md"
                      alt={bubble.word}
                    />
                  </div>
                  <span className="text-sm sm:text-base font-black capitalize mt-0.5 drop-shadow-md">
                    {bubble.word}
                  </span>
                  <span className="text-[10px] font-bold opacity-90">
                    {bubble.viMeaning}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative z-10 text-[11px] font-bold text-slate-700 pb-1">
          Arcade Mini-Game — Bong bóng chuyển động mượt mà theo vật lý đàn hồi
        </div>
      </div>
    </KidsGameWrapper>
  );
};
