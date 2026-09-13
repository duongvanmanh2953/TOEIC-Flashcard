// ============================================================================
// GAME 01: LISTEN & FIND (NGHE & CHỌN ĐÚNG TRANH)
// HEAR -> SCAN -> TAP • Interactive Scene with Floating Meadow Pedestals
// Non-Auto-Advancing: User taps Continue button after praise audio finishes
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Sparkles, Check } from 'lucide-react';
import { KidsGameWrapper } from '../core/KidsGameWrapper';
import { KIDS_GAMES_REGISTRY } from '../../data/games/gamesRegistry';
import { COMPREHENSIVE_VOCABULARY, VocabularyItem } from '../../data/vocabulary/vocabularyData';
import { KidsIllustration } from '../../assets/illustrations/KidsIllustration';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';
import { celebrationManager } from '../../services/celebration/CelebrationManager';

interface ListenFindGameProps {
  onExit: () => void;
  onStarsAwarded?: (stars: number) => void;
  onNextGame?: () => void;
}

export const ListenFindGame: React.FC<ListenFindGameProps> = ({
  onExit,
  onStarsAwarded,
  onNextGame,
}) => {
  const gameDef = KIDS_GAMES_REGISTRY.find((g) => g.id === 'listen_find') || KIDS_GAMES_REGISTRY[0];

  const TOTAL_ROUNDS = 5;
  const [currentRound, setCurrentRound] = useState(1);
  const [starsEarned, setStarsEarned] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isReadyToContinue, setIsReadyToContinue] = useState(false);
  const [praiseVi, setPraiseVi] = useState('');

  const [targetItem, setTargetItem] = useState<VocabularyItem>(COMPREHENSIVE_VOCABULARY[0]);
  const [options, setOptions] = useState<VocabularyItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resultState, setResultState] = useState<'correct' | 'wrong' | null>(null);

  // Initialize round
  const initRound = useCallback((roundNum: number) => {
    setSelectedId(null);
    setResultState(null);
    setIsReadyToContinue(false);

    const shuffled = [...COMPREHENSIVE_VOCABULARY].sort(() => Math.random() - 0.5);
    const target = shuffled[0];
    const choices = shuffled.slice(0, 4).sort(() => Math.random() - 0.5);

    setTargetItem(target);
    setOptions(choices);

    // Audio-first: Pronounce target word clearly
    setTimeout(() => {
      voiceService.speakWord(target.word);
    }, 300);
  }, []);

  useEffect(() => {
    initRound(1);
  }, [initRound]);

  const handleReplayAudio = () => {
    soundManager.play('pop');
    voiceService.speakWord(targetItem.word);
  };

  const handleSelectOption = (item: VocabularyItem) => {
    if (resultState === 'correct' || isReadyToContinue) return;

    setSelectedId(item.id);

    if (item.id === targetItem.id) {
      setResultState('correct');
      soundManager.play('star_burst');
      soundManager.play('correct');
      setStreak((prev) => prev + 1);
      const earned = 2;
      setStarsEarned((prev) => prev + earned);
      if (onStarsAwarded) onStarsAwarded(earned);

      const praise = celebrationManager.getRandomPraise(false);
      setPraiseVi(praise);

      // Guaranteed sequence: Speak word -> Speak praise -> Enable Continue button
      voiceService.speakWord(item.word, {
        onEnd: () => {
          voiceService.speakVietnamese(praise, {
            onEnd: () => {
              setIsReadyToContinue(true);
            },
          });
        },
      });
    } else {
      setResultState('wrong');
      soundManager.play('wrong');
      setStreak(0);
      voiceService.speakVietnamese('Bé thử lại nhé!');
      setTimeout(() => {
        setSelectedId(null);
        setResultState(null);
      }, 800);
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
      streak={streak}
      worldTheme="starter"
      instructionEn={`Find the ${targetItem.word}`}
      instructionVi={`Bé hãy tìm: ${targetItem.viMeaning}`}
      isReadyToContinue={isReadyToContinue}
      onContinueRound={handleAdvanceRound}
      praiseVi={praiseVi}
      onExit={onExit}
      onReplayAudio={handleReplayAudio}
      onNextGame={onNextGame}
      onPlayAgain={() => {
        setCurrentRound(1);
        setStarsEarned(0);
        setIsGameComplete(false);
        initRound(1);
      }}
      isGameComplete={isGameComplete}
    >
      {/* FULL-BLEED SUNNY MEADOW SCENE */}
      <div className="relative w-full h-full p-4 sm:p-8 flex flex-col justify-between items-center overflow-hidden bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-100">
        {/* Living Meadow Background Decor */}
        <div className="absolute top-4 left-8 text-4xl opacity-70 animate-bounce pointer-events-none select-none">
          ☁️
        </div>
        <div className="absolute top-6 right-12 text-4xl opacity-80 animate-pulse pointer-events-none select-none">
          ☀️
        </div>
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-emerald-400 to-transparent pointer-events-none rounded-t-[50%]" />

        {/* Floating Voice Banner */}
        <div className="relative z-20 flex flex-col items-center text-center space-y-1">
          <button
            onClick={handleReplayAudio}
            className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-white/95 text-emerald-950 font-black text-xs sm:text-sm shadow-md border-2 border-emerald-400 flex items-center gap-2 hover:scale-105 active:scale-95 cursor-pointer transition-all animate-bounce min-h-[44px]"
          >
            <Volume2 className="w-4 h-4 text-emerald-600" />
            <span>"FIND THE {targetItem.word.toUpperCase()}"</span>
          </button>
          <span className="text-xs font-bold text-slate-700">
            Bé chạm vào vật thể trên đồi cỏ nhé!
          </span>
        </div>

        {/* 4 Interactive Standing Objects on Grassy Pedestals */}
        <div className="relative z-10 w-full max-w-3xl grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 my-auto items-end justify-items-center">
          {options.map((opt, idx) => {
            const isSelected = selectedId === opt.id;
            const isTarget = opt.id === targetItem.id;
            const isSuccess = isSelected && isTarget && resultState === 'correct';
            const isError = isSelected && !isTarget && resultState === 'wrong';

            return (
              <div
                key={opt.id}
                onClick={() => handleSelectOption(opt)}
                className="relative flex flex-col items-center cursor-pointer group select-none"
              >
                {/* Object with Subtle Idle Float & Bounce on Correct */}
                <div
                  className={`relative p-2.5 rounded-3xl transition-all duration-300 flex flex-col items-center justify-center ${
                    isSuccess
                      ? '-translate-y-6 scale-120 drop-shadow-[0_12px_24px_rgba(16,185,129,0.5)] z-30'
                      : isError
                      ? 'animate-shake'
                      : 'hover:-translate-y-2 active:scale-95 group-hover:scale-105'
                  }`}
                  style={{
                    animation: isSuccess ? undefined : `gentleFloat 3s ease-in-out infinite ${idx * 0.4}s`,
                  }}
                >
                  {/* Glow Ring */}
                  {isSuccess && (
                    <div className="absolute inset-0 rounded-full bg-emerald-400/30 blur-lg animate-pulse pointer-events-none" />
                  )}

                  <div className="w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
                    <KidsIllustration
                      name={opt.word.toLowerCase()}
                      className="w-full h-full object-contain filter drop-shadow-md"
                      alt={opt.word}
                    />
                  </div>

                  {/* Word Name (revealed or emphasized) */}
                  <div
                    className={`mt-1.5 px-3 py-0.5 rounded-full text-center transition-all ${
                      isSuccess
                        ? 'bg-emerald-600 text-white font-black shadow-md scale-105'
                        : 'bg-white/95 text-slate-900 font-bold text-xs shadow-xs border border-white'
                    }`}
                  >
                    <span className="text-sm font-black capitalize block text-slate-900">
                      {opt.word}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-600 block">
                      {opt.viMeaning}
                    </span>
                  </div>
                </div>

                {/* Grassy Meadow Pedestal */}
                <div className="w-24 sm:w-32 h-6 bg-emerald-500/80 rounded-[50%] border-t-2 border-emerald-300 shadow-inner flex items-center justify-center -mt-1.5">
                  <span className="text-[10px] opacity-70">🌸</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative z-10 text-[11px] font-bold text-emerald-900/80 pb-1">
          🌱 Vườn hoa tri thức — Chạm đúng để bạn vật thể nhảy lên ăn mừng!
        </div>
      </div>
    </KidsGameWrapper>
  );
};
