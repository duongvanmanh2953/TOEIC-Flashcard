// ============================================================================
// GAME 03: WORD POP (BẮN NỔ BONG BÓNG TỪ VỰNG)
// Sky Carnival Atmosphere • Iridescent Soap Bubbles • Elastic Pop Physics
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Sparkles, Target, RotateCcw, ArrowRight } from 'lucide-react';
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
  hueColor: string;
  borderColor: string;
  textColor: string;
  isPopped: boolean;
}

const BUBBLE_PALETTES = [
  { hueColor: 'from-rose-400/80 via-pink-300/70 to-purple-400/80', borderColor: 'border-rose-300', textColor: 'text-rose-950' },
  { hueColor: 'from-sky-400/80 via-cyan-300/70 to-blue-400/80', borderColor: 'border-sky-300', textColor: 'text-sky-950' },
  { hueColor: 'from-emerald-400/80 via-teal-300/70 to-lime-400/80', borderColor: 'border-emerald-300', textColor: 'text-emerald-950' },
  { hueColor: 'from-amber-400/80 via-yellow-300/70 to-orange-400/80', borderColor: 'border-amber-300', textColor: 'text-amber-950' },
  { hueColor: 'from-purple-400/80 via-indigo-300/70 to-violet-400/80', borderColor: 'border-purple-300', textColor: 'text-purple-950' },
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
    voiceService.preloadWords(choices.map((c) => c.word));

    const newBubbles: BubbleItem[] = choices.map((item, idx) => {
      const palette = BUBBLE_PALETTES[idx % BUBBLE_PALETTES.length];
      return {
        id: `${item.id}_${idx}_${Date.now()}`,
        word: item.word,
        viMeaning: item.viMeaning,
        hueColor: palette.hueColor,
        borderColor: palette.borderColor,
        textColor: palette.textColor,
        isPopped: false,
      };
    });

    setBubbles(newBubbles);

    const promptTimer = setTimeout(() => {
      voiceService.speakWord(target.word);
    }, 100);

    return () => clearTimeout(promptTimer);
  }, []);

  useEffect(() => {
    initRound(1);
  }, [initRound]);

  const handlePopBubble = (bubble: BubbleItem) => {
    if (poppedId || bubble.isPopped || isReadyToContinue) return;

    if (bubble.word.toLowerCase() === targetWord.word.toLowerCase()) {
      // CORRECT! BUBBLE SQUASH & BURST
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

      const praise = 'Bé bắn nổ bóng chuẩn xác lắm! Tuyệt vời!';
      setPraiseVi(praise);

      voiceService.speakWord(bubble.word);
      setTimeout(() => {
        voiceService.speakVietnamese(praise);
      }, 450);

      setTimeout(() => {
        setIsReadyToContinue(true);
      }, 500);
    } else {
      // WRONG BUBBLE
      soundManager.play('wrong');
      voiceService.speakVietnamese('Chưa đúng rồi, bé chọn quả bóng khác nhé!');
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
      instructionEn={`Pop the balloon with "${targetWord.word.toUpperCase()}"!`}
      instructionVi={`Bé hãy làm nổ bong bóng: ${targetWord.viMeaning}`}
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
      {/* ================================================================ */}
      {/* SKY CARNIVAL ATMOSPHERE WITH BUNTING & FLUFFY CLOUDS             */}
      {/* ================================================================ */}
      <div className="relative w-full h-full p-4 sm:p-6 lg:p-8 flex flex-col justify-between items-center overflow-hidden bg-gradient-to-b from-[#60A5FA] via-[#93C5FD] to-[#E0F2FE] select-none">
        
        {/* Sky Background Decor */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Carnival Pennant Bunting Garland */}
          <div className="absolute top-0 inset-x-0 flex justify-around opacity-80">
            <span className="w-6 h-8 bg-rose-400 clip-triangle shadow-xs" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
            <span className="w-6 h-8 bg-amber-400 clip-triangle shadow-xs" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
            <span className="w-6 h-8 bg-emerald-400 clip-triangle shadow-xs" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
            <span className="w-6 h-8 bg-purple-400 clip-triangle shadow-xs" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
            <span className="w-6 h-8 bg-sky-300 clip-triangle shadow-xs" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
            <span className="w-6 h-8 bg-pink-400 clip-triangle shadow-xs" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
            <span className="w-6 h-8 bg-orange-400 clip-triangle shadow-xs" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
          </div>

          {/* Floating Puffy Clouds */}
          <div className="absolute top-8 left-10 w-24 h-10 bg-white/60 rounded-full blur-[1px] animate-pulse" />
          <div className="absolute top-14 right-14 w-28 h-12 bg-white/60 rounded-full blur-[1px] animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-10 left-1/4 w-32 h-12 bg-white/40 rounded-full blur-xs" />
        </div>

        {/* TOP TARGET CALLOUT BANNER WITH REPLAY AUDIO */}
        <div className="relative z-20 flex flex-col items-center text-center space-y-1.5 max-w-xl mx-auto">
          <button
            onClick={() => voiceService.speakWord(targetWord.word)}
            type="button"
            className="group px-6 py-2 sm:px-8 sm:py-2.5 rounded-full bg-white/95 text-sky-950 font-black text-sm sm:text-base shadow-[0_8px_20px_rgba(2,132,199,0.25)] border-3 border-sky-400 flex items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-xs group-hover:rotate-12 transition-transform">
              <Volume2 className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-1.5">
              <span>BẮN NỔ BÓNG:</span>
              <span className="text-sky-700 underline uppercase tracking-wide font-black">
                "{targetWord.word.toUpperCase()}"
              </span>
              <span className="text-slate-600 font-bold hidden sm:inline">
                ({targetWord.viMeaning})
              </span>
            </div>

            <span className="ml-1 text-xs font-black text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
              🔊 Nghe
            </span>
          </button>

          <span className="text-xs font-bold text-sky-950 bg-white/80 backdrop-blur-xs px-3.5 py-0.5 rounded-full border border-sky-200">
            🎈 Chạm vào bong bóng xà phòng mang đúng hình ảnh nhé!
          </span>
        </div>

        {/* FLOATING IRIDESCENT 3D SOAP BUBBLES FIELD */}
        <div className="relative z-10 w-full max-w-4xl my-auto py-6 sm:py-10 flex items-center justify-around gap-4 sm:gap-6 flex-wrap sm:flex-nowrap">
          {bubbles.map((bubble, idx) => {
            const isTarget = bubble.word.toLowerCase() === targetWord.word.toLowerCase();
            const isPopping = poppedId === bubble.id;

            if (bubble.isPopped && !isPopping) return null;

            return (
              <div
                key={bubble.id}
                onClick={() => handlePopBubble(bubble)}
                className={`relative flex flex-col items-center cursor-pointer select-none group transition-all duration-300 ${
                  isPopping
                    ? 'animate-bubble-squash-pop scale-125 z-30 pointer-events-none'
                    : 'hover:scale-110 hover:-translate-y-2 active:scale-95'
                }`}
                style={{
                  animation: isPopping
                    ? undefined
                    : `gentleFloat 3.8s ease-in-out infinite ${idx * 0.45}s`,
                }}
              >
                {/* Iridescent Bubble Sphere with Multilayer Glass Sheen */}
                <div
                  className={`w-32 h-32 sm:w-38 sm:h-38 rounded-full bg-gradient-to-tr ${bubble.hueColor} ${bubble.borderColor} border-4 shadow-[0_12px_28px_rgba(0,0,0,0.18)] flex flex-col items-center justify-center p-3 relative overflow-hidden backdrop-blur-xs transition-shadow group-hover:shadow-[0_16px_36px_rgba(255,255,255,0.4)]`}
                >
                  {/* Top Specular Glint Reflection */}
                  <div className="absolute top-2.5 left-4 w-7 sm:w-9 h-3.5 sm:h-4.5 bg-white/80 rounded-full -rotate-45 pointer-events-none blur-[0.5px]" />
                  
                  {/* Secondary Bottom Rim Reflection */}
                  <div className="absolute bottom-2.5 right-4 w-5 h-2.5 bg-white/40 rounded-full -rotate-45 pointer-events-none" />

                  {/* Centered Illustration */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center pointer-events-none">
                    <KidsIllustration
                      name={bubble.word.toLowerCase()}
                      className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform"
                      alt={bubble.word}
                    />
                  </div>

                  {/* Word Label Pill inside Bubble */}
                  <div className="mt-1 px-2.5 py-0.5 rounded-full bg-white/90 shadow-2xs border border-white/60 text-center pointer-events-none">
                    <span className="text-xs sm:text-sm font-black capitalize text-slate-900 block leading-tight">
                      {bubble.word}
                    </span>
                  </div>
                </div>

                {/* Pop Splash Particles (Visible when popping) */}
                {isPopping && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-ping">
                    <Sparkles className="w-16 h-16 text-amber-300 drop-shadow-lg" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* BOTTOM GAME FOOTER */}
        <div className="relative z-10 text-[11px] font-bold text-sky-950 bg-white/80 backdrop-blur-xs px-4 py-1 rounded-full border border-sky-200 shadow-2xs">
          🎈 Bong bóng nổi bồng bềnh — Chạm thật nhanh và chuẩn xác để ghi điểm combo!
        </div>
      </div>
    </KidsGameWrapper>
  );
};
