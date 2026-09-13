// ============================================================================
// GAME 10: DRESS THE CHARACTER (THỜI TRANG BÉ CƯNG)
// Clothes + Colors + Listening • Interactive Mascot Dressing • Spin & Pose
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Sparkles, Check, Smile } from 'lucide-react';
import { KidsGameWrapper } from '../core/KidsGameWrapper';
import { KIDS_GAMES_REGISTRY } from '../../data/games/gamesRegistry';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';

interface DressItem {
  id: string;
  type: 'hat' | 'shirt' | 'shoes';
  colorNameEn: string;
  colorNameVi: string;
  labelEn: string;
  labelVi: string;
  icon: string;
}

const DRESS_OPTIONS: DressItem[] = [
  { id: 'blue_hat', type: 'hat', colorNameEn: 'blue', colorNameVi: 'xanh dương', labelEn: 'Blue Hat', labelVi: 'Mũ xanh dương', icon: '🧢' },
  { id: 'red_shirt', type: 'shirt', colorNameEn: 'red', colorNameVi: 'đỏ', labelEn: 'Red Shirt', labelVi: 'Áo đỏ', icon: '👕' },
  { id: 'yellow_hat', type: 'hat', colorNameEn: 'yellow', colorNameVi: 'vàng', labelEn: 'Yellow Hat', labelVi: 'Mũ vàng', icon: '👒' },
  { id: 'green_shirt', type: 'shirt', colorNameEn: 'green', colorNameVi: 'xanh lá', labelEn: 'Green Shirt', labelVi: 'Áo xanh lá', icon: '🦺' },
  { id: 'red_shoes', type: 'shoes', colorNameEn: 'red', colorNameVi: 'đỏ', labelEn: 'Red Shoes', labelVi: 'Giày đỏ', icon: '👟' },
  { id: 'blue_shoes', type: 'shoes', colorNameEn: 'blue', colorNameVi: 'xanh dương', labelEn: 'Blue Shoes', labelVi: 'Giày xanh', icon: '🥿' },
];

interface DressCharacterGameProps {
  onExit: () => void;
  onStarsAwarded?: (stars: number) => void;
  onNextGame?: () => void;
}

export const DressCharacterGame: React.FC<DressCharacterGameProps> = ({
  onExit,
  onStarsAwarded,
  onNextGame,
}) => {
  const gameDef = KIDS_GAMES_REGISTRY.find((g) => g.id === 'dress_character') || KIDS_GAMES_REGISTRY[14];

  const TOTAL_ROUNDS = 4;
  const [currentRound, setCurrentRound] = useState(1);
  const [starsEarned, setStarsEarned] = useState(0);

  const [currentTarget, setCurrentTarget] = useState<DressItem>(DRESS_OPTIONS[0]);
  const [wornItems, setWornItems] = useState<{ hat?: DressItem; shirt?: DressItem; shoes?: DressItem }>({});
  const [isPosing, setIsPosing] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isReadyToContinue, setIsReadyToContinue] = useState(false);
  const [praiseVi, setPraiseVi] = useState('Bé chọn đồ khéo quá!');

  // Initialize round
  const initRound = useCallback((roundNum: number) => {
    setIsPosing(false);
    setIsReadyToContinue(false);
    const target = DRESS_OPTIONS[(roundNum - 1) % DRESS_OPTIONS.length];
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

  const handleSelectItem = (item: DressItem) => {
    if (isPosing || isReadyToContinue) return;

    if (item.id === currentTarget.id) {
      // CORRECT ITEM!
      setIsPosing(true);
      soundManager.play('star_burst');
      soundManager.play('pop');

      setWornItems((prev) => ({
        ...prev,
        [item.type]: item,
      }));

      const earned = 2;
      setStarsEarned((prev) => prev + earned);
      if (onStarsAwarded) onStarsAwarded(earned);

      const praise = `Tuyệt vời! Bạn Gấu mặc ${item.labelVi} trông rất đáng yêu!`;
      setPraiseVi(praise);

      voiceService.speakWord(item.labelEn, {
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
      voiceService.speakVietnamese(`Món đồ này chưa đúng, bé tìm ${currentTarget.labelVi} nhé!`);
    }
  };

  return (
    <KidsGameWrapper
      game={gameDef}
      currentRound={currentRound}
      totalRounds={TOTAL_ROUNDS}
      starsEarned={starsEarned}
      instructionEn={`Put on the ${currentTarget.labelEn}!`}
      instructionVi={`Bé hãy chọn: ${currentTarget.labelVi}`}
      onExit={onExit}
      onNextGame={onNextGame}
      onPlayAgain={() => {
        setCurrentRound(1);
        setStarsEarned(0);
        setWornItems({});
        setIsGameComplete(false);
        setIsReadyToContinue(false);
        initRound(1);
      }}
      isGameComplete={isGameComplete}
      isReadyToContinue={isReadyToContinue}
      onContinueRound={handleContinueRound}
      praiseVi={praiseVi}
      onReplayAudio={() => voiceService.speakWord(currentTarget.labelEn)}
    >
      <div className="p-4 sm:p-8 flex flex-col items-center justify-between min-h-[440px] bg-gradient-to-b from-rose-50 via-purple-50 to-white select-none space-y-6">
        {/* Dressing Instruction Banner */}
        <div className="text-center z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/95 border-2 border-rose-300 shadow-md">
            <span className="text-2xl animate-bounce">👗</span>
            <span className="text-sm sm:text-base font-black text-slate-900">
              MẶC ĐỒ: <span className="text-rose-600 underline">{currentTarget.labelEn.toUpperCase()}</span> ({currentTarget.labelVi})
            </span>
          </div>
        </div>

        {/* Mascot Center Stage (Teddy Bobby with Worn Clothes) */}
        <div className="relative flex flex-col items-center justify-center my-auto">
          <div
            className={`w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-amber-100 border-4 border-amber-300 flex flex-col items-center justify-center relative shadow-xl transition-transform duration-500 ${
              isPosing ? 'rotate-360 scale-110' : ''
            }`}
          >
            {/* Worn Hat if any */}
            <div className="text-4xl absolute -top-5 z-20 animate-bounce">
              {wornItems.hat ? wornItems.hat.icon : '🎩'}
            </div>

            {/* Bear Face */}
            <div className="text-6xl sm:text-7xl">🐻</div>

            {/* Worn Shirt if any */}
            <div className="text-3xl absolute bottom-6 z-20">
              {wornItems.shirt ? wornItems.shirt.icon : '👕'}
            </div>

            {/* Worn Shoes if any */}
            <div className="text-2xl absolute -bottom-3 z-20 flex gap-2">
              <span>{wornItems.shoes ? wornItems.shoes.icon : '👟'}</span>
            </div>
          </div>

          <span className="text-xs font-black text-amber-950 bg-white/90 px-3 py-1 rounded-full mt-3 border border-amber-300 shadow-xs">
            {isPosing ? '✨ Wow, đẹp trai quá! ✨' : 'Bạn Gấu Bobby'}
          </span>
        </div>

        {/* Clothing Items Wardrobe Tray */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3 w-full max-w-2xl">
          {DRESS_OPTIONS.map((item) => {
            return (
              <button
                key={item.id}
                onClick={() => handleSelectItem(item)}
                className="p-3 rounded-2xl bg-white hover:bg-rose-50 border-2 border-slate-200 hover:border-rose-300 shadow-md flex flex-col items-center justify-center gap-1 cursor-pointer transition-all hover:scale-110 active:scale-95"
              >
                <span className="text-3xl sm:text-4xl">{item.icon}</span>
                <span className="text-[11px] font-black text-slate-800 leading-tight">
                  {item.labelEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </KidsGameWrapper>
  );
};
