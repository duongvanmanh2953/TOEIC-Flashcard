// ============================================================================
// GAME 05: LISTEN & CATCH (ĐÓN BẮT TRÁI CÂY TRƯỢT)
// Listening Speed + Fruit Recognition • Orchard Tree Slide • Wicker Catch Basket
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, Sparkles, Check, ArrowRight } from 'lucide-react';
import { KidsGameWrapper } from '../core/KidsGameWrapper';
import { KIDS_GAMES_REGISTRY } from '../../data/games/gamesRegistry';
import { KidsIllustration } from '../../assets/illustrations/KidsIllustration';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';

interface CatchableFruit {
  id: string;
  nameEn: string;
  nameVi: string;
  icon: string;
}

const FRUITS_COLLECTION: CatchableFruit[] = [
  { id: 'banana', nameEn: 'Banana', nameVi: 'Quả chuối', icon: '🍌' },
  { id: 'apple', nameEn: 'Apple', nameVi: 'Quả táo', icon: '🍎' },
  { id: 'orange', nameEn: 'Orange', nameVi: 'Quả cam', icon: '🍊' },
  { id: 'strawberry', nameEn: 'Strawberry', nameVi: 'Dâu tây', icon: '🍓' },
  { id: 'watermelon', nameEn: 'Watermelon', nameVi: 'Dưa hấu', icon: '🍉' },
  { id: 'grapes', nameEn: 'Grapes', nameVi: 'Chùm nho', icon: '🍇' },
];

interface ListenCatchGameProps {
  onExit: () => void;
  onStarsAwarded?: (stars: number) => void;
  onNextGame?: () => void;
}

export const ListenCatchGame: React.FC<ListenCatchGameProps> = ({
  onExit,
  onStarsAwarded,
  onNextGame,
}) => {
  const gameDef = KIDS_GAMES_REGISTRY.find((g) => g.id === 'listen_catch') || KIDS_GAMES_REGISTRY[5];

  const TOTAL_ROUNDS = 5;
  const [currentRound, setCurrentRound] = useState(1);
  const [starsEarned, setStarsEarned] = useState(0);
  const [targetFruit, setTargetFruit] = useState<CatchableFruit>(FRUITS_COLLECTION[0]);
  const [conveyorItems, setConveyorItems] = useState<CatchableFruit[]>([]);
  const [caughtItem, setCaughtItem] = useState<CatchableFruit | null>(null);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isReadyToContinue, setIsReadyToContinue] = useState(false);
  const [praiseVi, setPraiseVi] = useState('Bé đón bắt rất cừ!');

  // Initialize round
  const initRound = useCallback((roundNum: number) => {
    setCaughtItem(null);
    setIsReadyToContinue(false);
    const shuffled = [...FRUITS_COLLECTION].sort(() => Math.random() - 0.5);
    const target = shuffled[0];
    const track = shuffled.slice(0, 4);

    setTargetFruit(target);
    setConveyorItems(track);

    voiceService.preloadWords(track.map((f) => f.nameEn));
    voiceService.speakWord(target.nameEn);
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

  const handleCatch = (item: CatchableFruit) => {
    if (caughtItem || isReadyToContinue) return;

    if (item.id === targetFruit.id) {
      // CAUGHT CORRECT!
      setCaughtItem(item);
      soundManager.play('star_burst');
      soundManager.play('correct');

      const earned = 2;
      setStarsEarned((prev) => prev + earned);
      if (onStarsAwarded) onStarsAwarded(earned);

      const praise = `Tuyệt vời! Bé đón đúng quả ${item.nameVi} rồi!`;
      setPraiseVi(praise);

      voiceService.speakWord(item.nameEn, {
        onEnd: () => {
          voiceService.speakVietnamese(praise, {
            onEnd: () => {
              setTimeout(() => {
                if (currentRound < TOTAL_ROUNDS) {
                  setIsReadyToContinue(true);
                } else {
                  setIsGameComplete(true);
                  soundManager.play('celebration');
                }
              }, 400);
            },
          });
        },
      });
    } else {
      // MISSED / WRONG FRUIT
      soundManager.play('wrong');
      voiceService.speakVietnamese(`Đây là ${item.nameVi}, chưa đúng rồi! Bé thử tìm ${targetFruit.nameVi} nhé!`);
    }
  };

  return (
    <KidsGameWrapper
      game={gameDef}
      currentRound={currentRound}
      totalRounds={TOTAL_ROUNDS}
      starsEarned={starsEarned}
      instructionEn={`Catch the ${targetFruit.nameEn}!`}
      instructionVi={`Bé hãy đón bắt quả: ${targetFruit.nameVi}`}
      onExit={onExit}
      onNextGame={onNextGame}
      onPlayAgain={() => {
        setCurrentRound(1);
        setStarsEarned(0);
        setIsGameComplete(false);
        setIsReadyToContinue(false);
        initRound(1);
      }}
      isGameComplete={isGameComplete}
      isReadyToContinue={isReadyToContinue}
      onContinueRound={handleContinueRound}
      praiseVi={praiseVi}
      onReplayAudio={() => voiceService.speakWord(targetFruit.nameEn)}
    >
      {/* ================================================================ */}
      {/* ORCHARD TREE & SLIDE CHUTE ENVIRONMENT                           */}
      {/* ================================================================ */}
      <div className="relative w-full aspect-[800/500] max-h-[68vh] mx-auto rounded-[32px] overflow-hidden bg-gradient-to-b from-[#A5D6A7] via-[#C8E6C9] to-[#E8F5E9] border-4 border-emerald-400 shadow-2xl select-none flex flex-col justify-between p-4 sm:p-6">
        
        {/* Orchard Sky & Canopy Background Decor */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full bg-[#388E3C]/30 blur-xl" />
          <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-[#388E3C]/30 blur-xl" />
          <div className="absolute bottom-2 left-6 text-2xl opacity-60">🌿</div>
          <div className="absolute bottom-4 right-8 text-2xl opacity-60">🌱</div>
        </div>

        {/* TOP TARGET ANNOUNCEMENT STATION */}
        <div className="relative z-20 flex justify-center">
          <button
            onClick={() => voiceService.speakWord(targetFruit.nameEn)}
            type="button"
            className="group flex items-center gap-2.5 px-6 py-2 sm:px-7 sm:py-2.5 rounded-full bg-white/95 backdrop-blur-md border-3 border-emerald-400 shadow-lg text-emerald-950 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs group-hover:rotate-12 transition-transform">
              <Volume2 className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-sm font-black">
              <span>ĐÓN BẮT QUẢ:</span>
              <span className="text-emerald-700 underline uppercase tracking-wide text-sm sm:text-base">
                "{targetFruit.nameEn.toUpperCase()}"
              </span>
              <span className="text-slate-600 font-bold hidden sm:inline">
                ({targetFruit.nameVi})
              </span>
            </div>

            <span className="ml-1 text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              🔊 Nghe
            </span>
          </button>
        </div>

        {/* ILLUSTRATED WOODEN CONVEYOR RAMP WITH ROLLING FRUITS */}
        <div className="relative my-auto flex flex-col items-center justify-center z-10 w-full max-w-3xl mx-auto py-2">
          {/* Fruit Option Tokens */}
          <div className="flex items-center justify-around gap-3 sm:gap-6 w-full">
            {conveyorItems.map((item, idx) => {
              const isTarget = item.id === targetFruit.id;
              const isCaught = caughtItem?.id === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => handleCatch(item)}
                  className={`relative flex flex-col items-center cursor-pointer select-none group transition-all duration-300 ${
                    isCaught
                      ? 'scale-125 -translate-y-4 z-30 drop-shadow-2xl'
                      : 'hover:scale-110 hover:-translate-y-2 active:scale-95'
                  }`}
                  style={{
                    animation: isCaught ? undefined : `gentleFloat 3s ease-in-out infinite ${idx * 0.3}s`,
                  }}
                >
                  {/* 3D Round Toy Fruit Plate */}
                  <div
                    className={`w-24 h-24 sm:w-28 sm:h-28 rounded-[24px] bg-white border-3 p-2.5 flex flex-col items-center justify-between shadow-lg transition-all ${
                      isCaught
                        ? 'border-emerald-500 bg-emerald-50 ring-4 ring-emerald-300'
                        : 'border-amber-300/90 hover:border-emerald-400 group-hover:shadow-xl'
                    }`}
                    style={{ borderBottomWidth: '5px' }}
                  >
                    <div className="w-13 h-13 sm:w-16 sm:h-16 flex items-center justify-center pointer-events-none">
                      <KidsIllustration
                        name={item.id}
                        className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform"
                        alt={item.nameEn}
                      />
                    </div>

                    {isCaught ? (
                      <span className="text-[11px] font-black text-emerald-700 uppercase bg-emerald-100 px-2 py-0.5 rounded-full">
                        {item.nameEn}!
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        Chạm đón 👆
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Wooden Slide Rail Graphics */}
          <div className="w-full h-4 bg-gradient-to-r from-[#8D6E63] via-[#A1887F] to-[#8D6E63] rounded-full border-2 border-[#5D4037] shadow-inner -mt-3 -z-10" />
        </div>

        {/* WICKER CATCH BASKET AT THE BOTTOM */}
        <div className="flex justify-center z-10">
          <div
            className={`flex items-center gap-3 px-6 py-2.5 sm:px-8 sm:py-3 rounded-[24px] bg-gradient-to-r from-amber-500 to-orange-500 text-white border-3 border-amber-600 shadow-xl transition-all duration-300 ${
              caughtItem ? 'scale-110 ring-6 ring-amber-300 animate-bounce' : 'hover:scale-102'
            }`}
          >
            <span className="text-3xl sm:text-4xl">🧺</span>
            <div className="text-left">
              <span className="text-xs sm:text-sm font-black block uppercase tracking-wider">
                {caughtItem ? `ĐÃ ĐÓN TRÚNG ${caughtItem.nameEn.toUpperCase()}!` : 'CHẠM VÀO QUẢ ĐỂ BỎ VÀO GIỎ'}
              </span>
              <span className="text-[10px] opacity-90 block">
                {caughtItem ? `Bé nhận được +2 Sao vàng ⭐` : 'Giỏ thu hoạch vườn trái cây'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </KidsGameWrapper>
  );
};
