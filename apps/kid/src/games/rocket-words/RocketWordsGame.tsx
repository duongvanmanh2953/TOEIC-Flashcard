// ============================================================================
// GAME 08: ROCKET WORDS (PHÓNG TÊN LỬA VŨ TRỤ)
// HEAR -> SELECT -> LAUNCH • Launchpad • Ignition • Smoke • Blastoff Spectacle
// Non-Auto-Advancing: User taps Continue button after praise audio finishes
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Rocket, Sparkles, Flame, Volume2 } from 'lucide-react';
import { KidsGameWrapper } from '../core/KidsGameWrapper';
import { KIDS_GAMES_REGISTRY } from '../../data/games/gamesRegistry';
import { COMPREHENSIVE_VOCABULARY, VocabularyItem } from '../../data/vocabulary/vocabularyData';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';

interface RocketOption {
  id: string;
  item: VocabularyItem;
  colorName: string;
  colorClass: string;
  flameColor: string;
}

const ROCKET_VARIANTS = [
  { colorName: 'Đỏ', colorClass: 'from-rose-500 to-red-600 border-rose-300', flameColor: 'from-amber-300 via-orange-500 to-rose-600' },
  { colorName: 'Xanh dương', colorClass: 'from-sky-500 to-blue-600 border-sky-300', flameColor: 'from-cyan-300 via-sky-500 to-blue-600' },
  { colorName: 'Vàng Cam', colorClass: 'from-amber-400 to-orange-500 border-amber-300', flameColor: 'from-yellow-200 via-amber-400 to-orange-600' },
];

interface RocketWordsGameProps {
  onExit: () => void;
  onStarsAwarded?: (stars: number) => void;
  onNextGame?: () => void;
}

export const RocketWordsGame: React.FC<RocketWordsGameProps> = ({
  onExit,
  onStarsAwarded,
  onNextGame,
}) => {
  const gameDef = KIDS_GAMES_REGISTRY.find((g) => g.id === 'rocket_words') || KIDS_GAMES_REGISTRY[7];

  const TOTAL_ROUNDS = 5;
  const [currentRound, setCurrentRound] = useState(1);
  const [starsEarned, setStarsEarned] = useState(0);
  const [targetWord, setTargetWord] = useState<VocabularyItem>(COMPREHENSIVE_VOCABULARY[0]);
  const [rockets, setRockets] = useState<RocketOption[]>([]);
  const [launchedRocketId, setLaunchedRocketId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCameraShaking, setIsCameraShaking] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isReadyToContinue, setIsReadyToContinue] = useState(false);
  const [praiseVi, setPraiseVi] = useState('');

  // Initialize round
  const initRound = useCallback((roundNum: number) => {
    setLaunchedRocketId(null);
    setCountdown(null);
    setIsCameraShaking(false);
    setIsReadyToContinue(false);

    const shuffled = [...COMPREHENSIVE_VOCABULARY].sort(() => Math.random() - 0.5);
    const target = shuffled[0];
    const choices = shuffled.slice(0, 3);

    setTargetWord(target);

    const generatedRockets: RocketOption[] = choices.map((item, idx) => ({
      id: `${item.id}_${idx}`,
      item,
      colorName: ROCKET_VARIANTS[idx % ROCKET_VARIANTS.length].colorName,
      colorClass: ROCKET_VARIANTS[idx % ROCKET_VARIANTS.length].colorClass,
      flameColor: ROCKET_VARIANTS[idx % ROCKET_VARIANTS.length].flameColor,
    }));

    setRockets(generatedRockets);
  }, []);

  useEffect(() => {
    initRound(1);
  }, [initRound]);

  const handleChooseRocket = (rocket: RocketOption) => {
    if (launchedRocketId || isReadyToContinue) return;

    if (rocket.item.id === targetWord.id) {
      // CORRECT: IGNITION SEQUENCE
      setLaunchedRocketId(rocket.id);
      setIsCameraShaking(true);
      soundManager.play('rocket_blast');

      // Countdown effect
      setCountdown(3);
      setTimeout(() => setCountdown(2), 250);
      setTimeout(() => setCountdown(1), 500);
      setTimeout(() => setCountdown(0), 750);

      const earned = 2;
      setStarsEarned((prev) => prev + earned);
      if (onStarsAwarded) onStarsAwarded(earned);

      const praise = 'Tên lửa phóng lên đỉnh cao rồi!';
      setPraiseVi(praise);

      voiceService.speakWord(rocket.item.word, {
        onEnd: () => {
          voiceService.speakVietnamese(praise, {
            onEnd: () => {
              setIsCameraShaking(false);
              setIsReadyToContinue(true);
            },
          });
        },
      });
    } else {
      // WRONG
      soundManager.play('wrong');
      voiceService.speakVietnamese('Tên lửa này chưa đúng, bé chọn lại nhé!');
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
      worldTheme="space"
      instructionEn={`Choose ${targetWord.word}`}
      instructionVi={`Bé hãy chọn tên lửa: ${targetWord.viMeaning}`}
      isReadyToContinue={isReadyToContinue}
      onContinueRound={handleAdvanceRound}
      praiseVi={praiseVi}
      onExit={onExit}
      onReplayAudio={() => voiceService.speakEnglish(`Choose ${targetWord.word}`)}
      onNextGame={onNextGame}
      onPlayAgain={() => {
        setCurrentRound(1);
        setStarsEarned(0);
        setIsGameComplete(false);
        initRound(1);
      }}
      isGameComplete={isGameComplete}
    >
      {/* FULL-BLEED COSMIC LAUNCHPAD SCENE */}
      <div
        className={`relative w-full h-full p-4 sm:p-8 flex flex-col justify-between items-center overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 transition-all ${
          isCameraShaking ? 'animate-rocket-shake' : ''
        }`}
      >
        {/* Starfield & Nebula Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/40 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-4 left-8 text-2xl opacity-80 animate-pulse pointer-events-none select-none">
          ✨
        </div>
        <div className="absolute top-10 right-14 text-3xl opacity-80 animate-pulse pointer-events-none select-none">
          🪐
        </div>

        {/* Floating Launch Command Banner */}
        <div className="relative z-20 flex flex-col items-center text-center space-y-1">
          <div className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-slate-900/90 backdrop-blur-md text-amber-300 border-2 border-amber-400 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg">
            <Rocket className="w-4 h-4 text-amber-400" />
            <span>PHÓNG TÀU: "{targetWord.word.toUpperCase()}" ({targetWord.viMeaning})</span>
          </div>
          <span className="text-xs font-bold text-slate-300">
            Chạm vào tên lửa mang đúng từ để điểm hỏa phụt khói phóng lên các vì sao!
          </span>
        </div>

        {/* Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
            <span className="text-6xl sm:text-8xl font-black text-amber-400 drop-shadow-[0_0_50px_rgba(251,191,36,0.8)] animate-scaleUp">
              {countdown === 0 ? 'BLASTOFF! 🚀' : countdown}
            </span>
          </div>
        )}

        {/* 3 Rockets at Launchpads */}
        <div className="relative z-10 w-full max-w-3xl grid grid-cols-3 gap-3 sm:gap-6 my-auto items-end justify-items-center">
          {rockets.map((rocket) => {
            const isLaunched = launchedRocketId === rocket.id;

            return (
              <div
                key={rocket.id}
                onClick={() => handleChooseRocket(rocket)}
                className={`relative flex flex-col items-center cursor-pointer group select-none transition-all duration-300 ${
                  isLaunched ? 'animate-rocket-blastoff z-30' : 'hover:-translate-y-2 active:scale-95'
                }`}
              >
                {/* Rocket Nose Cone & Body */}
                <div
                  className={`w-24 sm:w-28 h-40 sm:h-48 rounded-t-full bg-gradient-to-b ${rocket.colorClass} border-3 shadow-xl flex flex-col items-center justify-between p-2.5 relative overflow-hidden`}
                >
                  {/* Rocket Porthole Window */}
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-cyan-200 border-2 border-white shadow-inner flex items-center justify-center text-lg mt-1">
                    👨‍🚀
                  </div>

                  {/* Word Banner on Rocket Fuselage */}
                  <div className="w-full bg-black/50 backdrop-blur-xs py-1 px-1 rounded-xl text-center border border-white/30">
                    <span className="text-sm sm:text-base font-black text-white block capitalize drop-shadow-md">
                      {rocket.item.word}
                    </span>
                    <span className="text-[10px] font-bold text-amber-300 block">
                      {rocket.item.viMeaning}
                    </span>
                  </div>

                  {/* Fins */}
                  <div className="w-full flex justify-between px-1">
                    <div className="w-2.5 h-5 bg-slate-800 rounded-bl-xl -ml-2" />
                    <div className="w-2.5 h-5 bg-slate-800 rounded-br-xl -mr-2" />
                  </div>
                </div>

                {/* Booster Flame & Smoke Plume */}
                {isLaunched ? (
                  <div className="flex flex-col items-center -mt-2">
                    <div className={`w-10 h-16 bg-gradient-to-b ${rocket.flameColor} rounded-b-full animate-bounce blur-xs shadow-[0_0_30px_orange]`} />
                    <span className="text-3xl animate-pulse -mt-3">💨</span>
                  </div>
                ) : (
                  /* Idle Pad Smoke */
                  <div className="w-16 sm:w-20 h-3.5 bg-slate-800/90 rounded-full border-t border-slate-600 mt-1 shadow-inner flex items-center justify-center">
                    <span className="text-[8px] font-black text-slate-300">PAD #{rocket.colorName}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Launchpad Ground Base */}
        <div className="relative z-10 w-full h-7 bg-slate-900 border-t-2 border-slate-700 flex items-center justify-center">
          <span className="text-[11px] font-bold text-slate-400">🌌 Trạm Phóng Vũ Trụ Liên Hành Tinh</span>
        </div>
      </div>
    </KidsGameWrapper>
  );
};
