// ============================================================================
// GAME 05: LISTEN & CATCH (ĐÓN BẮT TRÁI CÂY TRƯỢT)
// Listening Speed + Vocabulary • Moving Carousel Rails • Basket Catching
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, Sparkles, ShoppingBag } from 'lucide-react';
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
  { id: 'carrot', nameEn: 'Carrot', nameVi: 'Củ cà rốt', icon: '🥕' },
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
      soundManager.play('pop');

      const earned = 2;
      setStarsEarned((prev) => prev + earned);
      if (onStarsAwarded) onStarsAwarded(earned);

      const praise = `Tuyệt vời! Bé đón đúng quả ${item.nameVi} rồi!`;
      setPraiseVi(praise);

      voiceService.speakWord(item.nameEn, {
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
      // WRONG ITEM
      soundManager.play('wrong');
      voiceService.speakVietnamese('Chưa đúng rồi, bé bắt lại nhé!');
    }
  };

  return (
    <KidsGameWrapper
      game={gameDef}
      currentRound={currentRound}
      totalRounds={TOTAL_ROUNDS}
      starsEarned={starsEarned}
      instructionEn={`Catch the ${targetFruit.nameEn}!`}
      instructionVi={`Bé hãy đón bắt: ${targetFruit.nameVi}`}
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
      <div className="relative w-full aspect-[800/480] max-h-[60vh] mx-auto rounded-3xl overflow-hidden bg-gradient-to-b from-amber-50 via-lime-50 to-emerald-100 select-none flex flex-col justify-between p-6">
        {/* Top Target Announcement Banner */}
        <div className="text-center z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/95 border-2 border-emerald-400 shadow-md">
            <span className="text-2xl animate-bounce">🧺</span>
            <span className="text-base sm:text-lg font-black text-slate-900">
              ĐÓN BẮT: <span className="text-emerald-700 underline">{targetFruit.nameEn.toUpperCase()}</span> ({targetFruit.nameVi})
            </span>
          </div>
        </div>

        {/* Horizontal Conveyor Rail with Moving Fruit Targets */}
        <div className="relative my-auto flex items-center justify-around gap-3 z-10">
          {conveyorItems.map((item) => {
            const isTarget = item.id === targetFruit.id;
            const isCaught = caughtItem?.id === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleCatch(item)}
                className={`p-4 sm:p-5 rounded-3xl bg-white/95 border-3 flex flex-col items-center justify-center gap-2 shadow-lg cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 ${
                  isCaught
                    ? 'border-emerald-500 scale-125 bg-emerald-100 animate-bounce'
                    : 'border-amber-300 hover:border-emerald-400'
                }`}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                  <KidsIllustration name={item.id} className="w-full h-full object-contain filter drop-shadow-md" alt={item.nameEn} />
                </div>
                <span className="text-xs sm:text-sm font-black text-slate-900">
                  {item.nameEn}
                </span>
                <span className="text-[10px] font-semibold text-slate-500">
                  ({item.nameVi})
                </span>
              </button>
            );
          })}
        </div>

        {/* Catch Basket Bottom Area */}
        <div className="flex justify-center z-10">
          <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl bg-amber-500 text-white border-2 border-amber-600 shadow-xl transition-transform ${caughtItem ? 'scale-110 animate-bounce' : ''}`}>
            <span className="text-3xl">🧺</span>
            <div className="text-left">
              <span className="text-xs font-black block uppercase tracking-wider">
                {caughtItem ? `ĐÃ BẮT TRÚNG ${caughtItem.nameEn.toUpperCase()}!` : 'CHẠM VÀO QUẢ ĐỂ BỎ VÀO GIỎ'}
              </span>
              <span className="text-[10px] opacity-90 block">
                Fruit Collection Basket
              </span>
            </div>
          </div>
        </div>
      </div>
    </KidsGameWrapper>
  );
};
