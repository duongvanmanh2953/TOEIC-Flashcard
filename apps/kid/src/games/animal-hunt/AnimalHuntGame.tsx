// ============================================================================
// GAME 04: ANIMAL SAFARI HUNT (TRUY TÌM BẠN THÚ HOANG DÃ)
// Custom Illustrated Jungle Stage • Vector Foliage Hiding Spots • Discovery Physics
// No raw emojis in divs — Authentic drawn game aesthetics!
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Sparkles, Check, Search, RotateCcw } from 'lucide-react';
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
  coverType: 'bush' | 'tree' | 'palm' | 'rock' | 'cave';
  coverName: string;
}

const JUNGLE_SPOTS: HiddenSpot[] = [
  { id: 'spot_lion', animalWord: 'lion', animalVi: 'Sư tử', soundCue: 'Roar!', xPercent: 24, yPercent: 44, coverType: 'bush', coverName: 'Bụi cây rậm' },
  { id: 'spot_elephant', animalWord: 'elephant', animalVi: 'Con voi', soundCue: 'Pawoo!', xPercent: 72, yPercent: 52, coverType: 'tree', coverName: 'Cây đại thụ' },
  { id: 'spot_monkey', animalWord: 'monkey', animalVi: 'Chú khỉ', soundCue: 'Ooh ooh aah aah!', xPercent: 48, yPercent: 24, coverType: 'palm', coverName: 'Tán lá cọ' },
  { id: 'spot_rabbit', animalWord: 'rabbit', animalVi: 'Thỏ trắng', soundCue: 'Squeak!', xPercent: 30, yPercent: 74, coverType: 'rock', coverName: 'Tảng đá rêu' },
  { id: 'spot_bear', animalWord: 'bear', animalVi: 'Gấu nâu', soundCue: 'Grrr!', xPercent: 82, yPercent: 32, coverType: 'cave', coverName: 'Hang đá nhỏ' },
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

    voiceService.preloadWords(JUNGLE_SPOTS.map((s) => s.animalWord));
    voiceService.speakWord(target.animalWord);
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

      voiceService.speakWord(spot.animalWord);
      setTimeout(() => {
        voiceService.speakVietnamese(praise);
      }, 450);

      setTimeout(() => {
        if (currentRound < TOTAL_ROUNDS) {
          setIsReadyToContinue(true);
        } else {
          setIsGameComplete(true);
          soundManager.play('celebration');
        }
      }, 500);
    } else {
      // WRONG SPOT
      soundManager.play('pop');
      voiceService.speakVietnamese(`Ở đây là ${spot.coverName}, chưa có ${currentTarget.animalVi}. Bé tìm chỗ khác nhé!`);
    }
  };

  // Render Custom Illustrated Hiding Spot Artwork
  const renderCoverArtwork = (coverType: HiddenSpot['coverType']) => {
    switch (coverType) {
      case 'bush':
        return (
          <svg viewBox="0 0 100 80" className="w-20 h-16 sm:w-24 sm:h-20 drop-shadow-md">
            <path d="M 20 60 C 5 45, 10 20, 35 25 C 45 5, 65 5, 75 22 C 95 18, 100 45, 85 65 C 75 75, 25 75, 20 60 Z" fill="#2E7D32" />
            <path d="M 25 55 C 15 42, 22 25, 40 30 C 50 15, 65 15, 72 28 C 88 25, 90 48, 80 60 Z" fill="#4CAF50" />
            <circle cx="35" cy="40" r="3" fill="#FFE082" />
            <circle cx="65" cy="35" r="3" fill="#FFD54F" />
          </svg>
        );
      case 'tree':
        return (
          <svg viewBox="0 0 100 100" className="w-22 h-22 sm:w-26 sm:h-26 drop-shadow-md">
            <rect x="42" y="55" width="16" height="35" rx="4" fill="#6D4C41" />
            <circle cx="50" cy="35" r="32" fill="#1B5E20" />
            <circle cx="36" cy="30" r="22" fill="#2E7D32" />
            <circle cx="62" cy="28" r="24" fill="#388E3C" />
            <circle cx="50" cy="36" r="18" fill="#4CAF50" />
          </svg>
        );
      case 'palm':
        return (
          <svg viewBox="0 0 100 90" className="w-20 h-18 sm:w-24 sm:h-22 drop-shadow-md">
            <path d="M 46 90 Q 50 50 52 35" stroke="#795548" strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d="M 50 35 Q 20 20 5 40 Q 25 15 50 35" fill="#388E3C" />
            <path d="M 50 35 Q 75 18 95 38 Q 75 10 50 35" fill="#2E7D32" />
            <path d="M 50 35 Q 50 5 52 0 Q 55 10 50 35" fill="#4CAF50" />
          </svg>
        );
      case 'rock':
        return (
          <svg viewBox="0 0 100 70" className="w-20 h-14 sm:w-24 sm:h-18 drop-shadow-md">
            <path d="M 15 55 C 10 35, 30 15, 55 18 C 75 20, 95 35, 90 58 C 85 68, 20 68, 15 55 Z" fill="#78909C" />
            <path d="M 22 50 C 20 38, 35 22, 52 24 C 68 26, 82 38, 78 52 Z" fill="#90A4AE" />
            <path d="M 40 45 Q 45 35 55 42" stroke="#4CAF50" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
        );
      case 'cave':
        return (
          <svg viewBox="0 0 100 80" className="w-20 h-16 sm:w-24 sm:h-20 drop-shadow-md">
            <path d="M 10 65 C 15 25, 35 15, 55 15 C 80 15, 95 30, 95 65 Z" fill="#546E7A" />
            <ellipse cx="52" cy="55" rx="24" ry="18" fill="#263238" />
            <circle cx="45" cy="50" r="2" fill="#FFE082" className="animate-pulse" />
            <circle cx="58" cy="52" r="2" fill="#FFE082" className="animate-pulse" />
          </svg>
        );
    }
  };

  return (
    <KidsGameWrapper
      game={gameDef}
      currentRound={currentRound}
      totalRounds={TOTAL_ROUNDS}
      starsEarned={starsEarned}
      worldTheme="jungle"
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
      onReplayAudio={() => voiceService.speakWord(currentTarget.animalWord)}
    >
      {/* ================================================================ */}
      {/* ILLUSTRATED SAFARI JUNGLE LANDSCAPE                               */}
      {/* ================================================================ */}
      <div className="relative w-full aspect-[800/500] max-h-[68vh] mx-auto rounded-[32px] overflow-hidden border-4 border-emerald-400 shadow-2xl bg-gradient-to-b from-[#80D0C7] via-[#A8E6CF] to-[#43A047] select-none">
        
        {/* Layered Tropical Foliage & Canopy */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Top Hanging Vines & Monstera Leaves */}
          <div className="absolute top-0 inset-x-0 h-16 bg-[radial-gradient(ellipse_at_top,_rgba(27,94,32,0.6)_0%,_transparent_70%)]" />
          <div className="absolute -top-3 left-4 w-32 h-14 bg-[#1B5E20]/40 rounded-b-full blur-xs" />
          <div className="absolute -top-3 right-6 w-36 h-14 bg-[#1B5E20]/40 rounded-b-full blur-xs" />

          {/* Tropical Flora Sprinkles */}
          <div className="absolute bottom-3 left-10 text-xl opacity-75">🌿</div>
          <div className="absolute bottom-8 left-1/3 text-lg opacity-70">🌺</div>
          <div className="absolute bottom-5 right-12 text-xl opacity-75">🌿</div>
          <div className="absolute bottom-10 right-1/4 text-lg opacity-70">🌸</div>
        </div>

        {/* TOP SEARCH TARGET BANNER */}
        <div className="absolute top-3 inset-x-0 z-20 flex justify-center px-3">
          <button
            onClick={() => voiceService.speakWord(currentTarget.animalWord)}
            type="button"
            className="group flex items-center gap-2.5 px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-white/95 backdrop-blur-md border-3 border-emerald-400 shadow-lg text-emerald-950 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs group-hover:rotate-12 transition-transform">
              <Search className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black">
              <span>Đang tìm bạn:</span>
              <span className="text-emerald-700 uppercase underline text-sm sm:text-base">
                "{currentTarget.animalWord}"
              </span>
              <span className="text-slate-600 font-bold hidden sm:inline">
                ({currentTarget.animalVi})
              </span>
            </div>

            <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse ml-1" />
          </button>
        </div>

        {/* INTERACTIVE ILLUSTRATED HIDING SPOTS ACROSS SAFARI MAP */}
        {JUNGLE_SPOTS.map((spot) => {
          const isTarget = spot.animalWord === currentTarget.animalWord;
          const isRevealed = discoveredSpot?.id === spot.id;

          return (
            <div
              key={spot.id}
              style={{ left: `${spot.xPercent}%`, top: `${spot.yPercent}%` }}
              onClick={() => handleSpotClick(spot)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
            >
              {isRevealed ? (
                // Animal Emerges with 3D Celebration Bounce!
                <div className="flex flex-col items-center animate-bounce z-30 drop-shadow-2xl">
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[28px] bg-gradient-to-b from-white to-emerald-50 border-4 border-emerald-500 p-2 shadow-2xl flex items-center justify-center ring-4 ring-emerald-300">
                    {/* Glowing Aura */}
                    <div className="absolute inset-0 rounded-[24px] bg-emerald-400/30 blur-md pointer-events-none" />

                    <KidsIllustration
                      name={spot.animalWord}
                      className="w-full h-full object-contain filter drop-shadow-md z-10"
                      alt={spot.animalWord}
                    />
                  </div>

                  {/* Ribbon Label */}
                  <div className="mt-1 px-4 py-1 rounded-full bg-emerald-600 text-white font-black text-xs sm:text-sm shadow-md border-2 border-emerald-400">
                    <span className="uppercase">{spot.animalWord}</span> ({spot.animalVi})!
                  </div>
                </div>
              ) : (
                // Custom Illustrated Vector Hiding Cover (Bush, Rock, Palm Tree)
                <div className="flex flex-col items-center group-hover:scale-110 group-active:scale-95 transition-transform duration-200">
                  <div className="p-1 rounded-3xl bg-white/20 backdrop-blur-2xs border border-white/40 flex items-center justify-center shadow-md group-hover:bg-amber-100/40 transition-colors">
                    {renderCoverArtwork(spot.coverType)}
                  </div>
                  <span className="text-[10px] font-black text-emerald-950 bg-white/90 px-2.5 py-0.5 rounded-full mt-1 border border-emerald-300 shadow-2xs">
                    {spot.coverName}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* BOTTOM HELPFUL INSTRUCTION TAG */}
        <div className="absolute bottom-2.5 inset-x-0 flex justify-center pointer-events-none z-20 px-3">
          <div className="flex items-center gap-1.5 px-4 py-1 rounded-full bg-white/80 backdrop-blur-xs border border-emerald-300 text-[11px] font-bold text-emerald-950 shadow-2xs">
            <span>🦁 Hãy chạm vào các bụi rậm và tảng đá để nghe tiếng kêu và tìm ra bạn thú mục tiêu nhé!</span>
          </div>
        </div>
      </div>
    </KidsGameWrapper>
  );
};
