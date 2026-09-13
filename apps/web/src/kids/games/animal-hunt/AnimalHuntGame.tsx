// ============================================================================
// GAME 03: ANIMAL HUNT (TÌM THÚ RỪNG NHIỆT ĐỚI)
// Exploration + Listening + Vocabulary • Living Jungle Map • Animal Emergence
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Sparkles, Check, Search } from 'lucide-react';
import { KidsGameWrapper } from '../core/KidsGameWrapper';
import { KIDS_GAMES_REGISTRY } from '../../data/games/gamesRegistry';
import { KidsIllustration } from '../../assets/illustrations/KidsIllustration';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';

interface HiddenSpot {
  id: string;
  animalWord: string;
  animalVi: string;
  soundCue: string;
  xPercent: number;
  yPercent: number;
  coverIcon: string;
  coverName: string;
}

const JUNGLE_SPOTS: HiddenSpot[] = [
  { id: 'spot_lion', animalWord: 'lion', animalVi: 'Sư tử', soundCue: '🦁 Roar!', xPercent: 25, yPercent: 45, coverIcon: '🌿', coverName: 'Bụi cỏ cao' },
  { id: 'spot_elephant', animalWord: 'elephant', animalVi: 'Con voi', soundCue: '🐘 Pawoo!', xPercent: 68, yPercent: 55, coverIcon: '🌳', coverName: 'Cây cổ thụ' },
  { id: 'spot_monkey', animalWord: 'monkey', animalVi: 'Chú khỉ', soundCue: '🐒 Ooh ooh!', xPercent: 48, yPercent: 26, coverIcon: '🌴', coverName: 'Cành cọ' },
  { id: 'spot_rabbit', animalWord: 'rabbit', animalVi: 'Thỏ trắng', soundCue: '🐰 Squeak!', xPercent: 32, yPercent: 72, coverIcon: '🪨', coverName: 'Tảng đá' },
  { id: 'spot_bear', animalWord: 'bear', animalVi: 'Gấu nâu', soundCue: '🐻 Grrr!', xPercent: 82, yPercent: 35, coverIcon: '🕳️', coverName: 'Hang đá' },
];

interface AnimalHuntGameProps {
  onExit: () => void;
  onStarsAwarded?: (stars: number) => void;
  onNextGame?: () => void;
}

export const AnimalHuntGame: React.FC<AnimalHuntGameProps> = ({
  onExit,
  onStarsAwarded,
  onNextGame,
}) => {
  const gameDef = KIDS_GAMES_REGISTRY.find((g) => g.id === 'animal_hunt') || KIDS_GAMES_REGISTRY[4];

  const TOTAL_ROUNDS = 5;
  const [currentRound, setCurrentRound] = useState(1);
  const [starsEarned, setStarsEarned] = useState(0);
  const [currentTarget, setCurrentTarget] = useState<HiddenSpot>(JUNGLE_SPOTS[0]);
  const [revealedSpots, setRevealedSpots] = useState<string[]>([]);
  const [discoveredSpot, setDiscoveredSpot] = useState<HiddenSpot | null>(null);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isReadyToContinue, setIsReadyToContinue] = useState(false);
  const [praiseVi, setPraiseVi] = useState('Bé tìm giỏi quá!');

  // Initialize round
  const initRound = useCallback((roundNum: number) => {
    setDiscoveredSpot(null);
    setIsReadyToContinue(false);
    const target = JUNGLE_SPOTS[(roundNum - 1) % JUNGLE_SPOTS.length];
    setCurrentTarget(target);
  }, []);

  useEffect(() => {
    initRound(1);
  }, [initRound]);

  const handleContinueRound = () => {
    soundManager.play('pop');
    if (currentRound < TOTAL_ROUNDS) {
      const nextR = currentRound + 1;
      setCurrentRound(nextR);
      initRound(nextR);
    } else {
      setIsGameComplete(true);
      soundManager.play('celebration');
    }
  };

  const handleSpotClick = (spot: HiddenSpot) => {
    if (discoveredSpot || isReadyToContinue) return;

    if (spot.animalWord === currentTarget.animalWord) {
      // FOUND TARGET ANIMAL!
      setDiscoveredSpot(spot);
      setRevealedSpots((prev) => [...prev, spot.id]);
      soundManager.play('star_burst');
      soundManager.play('correct');

      const earned = 2;
      setStarsEarned((prev) => prev + earned);
      if (onStarsAwarded) onStarsAwarded(earned);

      const praise = `Giỏi quá! Bé đã tìm thấy bạn ${spot.animalVi}!`;
      setPraiseVi(praise);

      voiceService.speakWord(spot.animalWord, {
        onEnd: () => {
          voiceService.speakVietnamese(praise, {
            onEnd: () => {
              if (currentRound < TOTAL_ROUNDS) {
                setIsReadyToContinue(true);
              } else {
                setIsGameComplete(true);
                soundManager.play('celebration');
              }
            },
          });
        },
      });
    } else {
      // WRONG SPOT
      soundManager.play('pop');
      voiceService.speakVietnamese(`Ôi, ở đây không có ${currentTarget.animalVi}. Bé tìm chỗ khác nhé!`);
    }
  };

  return (
    <KidsGameWrapper
      game={gameDef}
      currentRound={currentRound}
      totalRounds={TOTAL_ROUNDS}
      starsEarned={starsEarned}
      instructionEn={`Find the ${currentTarget.animalWord}!`}
      instructionVi={`Bé hãy tìm bạn: ${currentTarget.animalVi}`}
      onExit={onExit}
      onNextGame={onNextGame}
      onPlayAgain={() => {
        setCurrentRound(1);
        setStarsEarned(0);
        setRevealedSpots([]);
        setIsGameComplete(false);
        setIsReadyToContinue(false);
        initRound(1);
      }}
      isGameComplete={isGameComplete}
      isReadyToContinue={isReadyToContinue}
      onContinueRound={handleContinueRound}
      praiseVi={praiseVi}
    >
      <div className="relative w-full aspect-[800/500] max-h-[65vh] mx-auto rounded-3xl overflow-hidden border-2 border-emerald-300 shadow-inner bg-gradient-to-b from-sky-200 via-emerald-100 to-emerald-200 select-none">
        {/* Living Jungle Backdrop Decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 left-6 text-4xl opacity-40 animate-pulse">🌴</div>
          <div className="absolute top-4 right-10 text-4xl opacity-40 animate-pulse">🌳</div>
          <div className="absolute bottom-6 left-16 text-3xl opacity-50">🌿</div>
          <div className="absolute bottom-10 right-24 text-3xl opacity-50">🌺</div>
          <div className="absolute top-12 left-1/3 text-2xl opacity-40">🦜</div>
        </div>

        {/* Hidden Interactive Spots on Map */}
        {JUNGLE_SPOTS.map((spot) => {
          const isTarget = spot.animalWord === currentTarget.animalWord;
          const isRevealed = discoveredSpot?.id === spot.id;

          return (
            <div
              key={spot.id}
              style={{ left: `${spot.xPercent}%`, top: `${spot.yPercent}%` }}
              onClick={() => handleSpotClick(spot)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            >
              {isRevealed ? (
                // Animal Emerge Animation!
                <div className="flex flex-col items-center animate-bounce z-20">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/95 border-3 border-emerald-400 p-2 shadow-2xl flex items-center justify-center">
                    <KidsIllustration
                      name={spot.animalWord}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="mt-1 px-3 py-1 rounded-full bg-emerald-600 text-white font-black text-xs shadow-md">
                    {spot.animalWord.toUpperCase()}!
                  </span>
                </div>
              ) : (
                // Hidden Cover (Bush, Rock, Palm Tree)
                <div className="flex flex-col items-center group-hover:scale-110 transition-transform">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/70 backdrop-blur-xs border-2 border-emerald-300 flex items-center justify-center text-4xl sm:text-5xl shadow-md group-hover:bg-amber-100/90 transition-colors">
                    {spot.coverIcon}
                  </div>
                  <span className="text-[10px] font-black text-emerald-950 bg-white/80 px-2 py-0.5 rounded-full mt-1 border border-emerald-200">
                    {spot.coverName}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Search Prompt Floating Beacon */}
        <div className="absolute top-3 inset-x-0 flex justify-center pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-emerald-300 shadow-md text-xs font-black text-slate-800">
            <Search className="w-4 h-4 text-emerald-600 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Chạm vào các bụi cây và tảng đá để tìm bạn {currentTarget.animalVi}!</span>
          </div>
        </div>
      </div>
    </KidsGameWrapper>
  );
};
