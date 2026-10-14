import React, { useState, useEffect } from 'react';
import { SunnySoundFX } from '../../services/audio/SunnySoundFX';
import { BilingualVoiceEngine } from '../../services/audio/BilingualVoiceEngine';
import SunnyBilingualGuide from '../../components/SunnyBilingualGuide';
import VictoryCelebrationModal from '../../components/VictoryCelebrationModal';
import { meadowStore } from '../../core/meadowStateStore';

interface Game2Props {
  onExit: () => void;
  onComplete?: () => void;
}

interface PicnicRound {
  targetItem: 'strawberry' | 'carrot' | 'apple' | 'banana' | 'pear' | 'grape';
  targetNameEn: string;
  targetNameVi: string;
  symbol: string;
  requiredCount: number;
  viPrompt: string;
  enPrompt: string;
}

const LEVEL_ROUNDS: Record<number, PicnicRound[]> = {
  1: [
    {
      targetItem: 'strawberry',
      targetNameEn: 'strawberry',
      targetNameVi: 'quả dâu tây',
      symbol: '#svg-item-strawberry',
      requiredCount: 2,
      viPrompt: 'Bé ơi, Cáo Sunny đang đói bụng! Hãy chạm để đút cho Cáo Sunny 2 quả dâu tây đỏ ngọt nhé!',
      enPrompt: 'Please feed Sunny 2 red strawberries! Nom nom!',
    },
    {
      targetItem: 'carrot',
      targetNameEn: 'carrot',
      targetNameVi: 'củ cà rốt',
      symbol: '#svg-item-carrot',
      requiredCount: 2,
      viPrompt: 'Cáo Sunny thèm cà rốt giòn rụm! Bé hãy đút 2 củ cà rốt cho Cáo Sunny nhé!',
      enPrompt: 'Feed Sunny 2 crunchy orange carrots!',
    },
  ],
  2: [
    {
      targetItem: 'apple',
      targetNameEn: 'apple',
      targetNameVi: 'quả táo đỏ',
      symbol: '#svg-item-apple',
      requiredCount: 3,
      viPrompt: 'Táo đỏ giòn ngọt quá! Bé hãy đút cho Cáo Sunny 3 quả táo đỏ nhé!',
      enPrompt: 'Give Sunny 3 juicy red apples, please!',
    },
    {
      targetItem: 'banana',
      targetNameEn: 'banana',
      targetNameVi: 'quả chuối vàng',
      symbol: '#svg-item-banana',
      requiredCount: 2,
      viPrompt: 'Chuối chín vàng thơm lừng! Bé hãy đút cho Cáo Sunny 2 quả chuối vàng nào!',
      enPrompt: 'Feed Sunny 2 sweet yellow bananas!',
    },
    {
      targetItem: 'grape',
      targetNameEn: 'grape',
      targetNameVi: 'chùm nho tím',
      symbol: '#svg-item-grape',
      requiredCount: 2,
      viPrompt: 'Chùm nho mọng nước quá! Bé hãy đút cho Cáo Sunny 2 chùm nho tím nhé!',
      enPrompt: 'Feed Sunny 2 bunches of purple grapes!',
    },
  ],
};

const PICNIC_PANTRY = [
  { id: 'strawberry', nameEn: 'Strawberry', nameVi: 'Dâu Tây', symbol: '#svg-item-strawberry' },
  { id: 'carrot', nameEn: 'Carrot', nameVi: 'Cà Rốt', symbol: '#svg-item-carrot' },
  { id: 'apple', nameEn: 'Apple', nameVi: 'Quả Táo', symbol: '#svg-item-apple' },
  { id: 'banana', nameEn: 'Banana', nameVi: 'Quả Chuối', symbol: '#svg-item-banana' },
  { id: 'pear', nameEn: 'Pear', nameVi: 'Quả Lê', symbol: '#svg-item-pear' },
  { id: 'grape', nameEn: 'Grape', nameVi: 'Chùm Nho', symbol: '#svg-item-grape' },
] as const;

export const Game2_HungryFoxPicnic: React.FC<Game2Props> = ({ onExit, onComplete }) => {
  const [level, setLevel] = useState<number>(1);
  const totalLevels = 2;

  const [roundIdx, setRoundIdx] = useState<number>(0);
  const [fedCount, setFedCount] = useState<number>(0);
  const [errorsCount, setErrorsCount] = useState<number>(0);
  const [isChewing, setIsChewing] = useState<boolean>(false);
  const [flyingItem, setFlyingItem] = useState<{ symbol: string; x: number; y: number } | null>(null);
  const [showVictory, setShowVictory] = useState<boolean>(false);
  const [chewBubble, setChewBubble] = useState<string>('Yummy!');

  const currentRounds = LEVEL_ROUNDS[level] || LEVEL_ROUNDS[1];
  const round = currentRounds[roundIdx] || currentRounds[0];

  useEffect(() => {
    setRoundIdx(0);
    setFedCount(0);
    setErrorsCount(0);
    setShowVictory(false);
  }, [level]);

  const handleFeedFruit = (item: typeof PICNIC_PANTRY[number], e: React.MouseEvent<HTMLButtonElement>) => {
    if (isChewing || flyingItem || showVictory) return;

    if (item.id === round.targetItem) {
      // Correct fruit fed
      SunnySoundFX.playCorrect();
      const rect = e.currentTarget.getBoundingClientRect();
      setFlyingItem({ symbol: item.symbol, x: rect.left, y: rect.top });

      const nextFed = fedCount + 1;

      setTimeout(() => {
        setFlyingItem(null);
        setIsChewing(true);
        SunnySoundFX.playCardSelect();

        const cheerWords = ['Crunch! One!', 'Yummy! Two!', 'Delicious! Three!'];
        setChewBubble(cheerWords[Math.min(nextFed - 1, cheerWords.length - 1)]);
        BilingualVoiceEngine.speakEnglish(`${item.nameEn}! Nom nom!`);

        setTimeout(() => {
          setIsChewing(false);
          setFedCount(nextFed);

          if (nextFed >= round.requiredCount) {
            // Round cleared
            meadowStore.addStars(5);

            if (roundIdx < currentRounds.length - 1) {
              setTimeout(() => {
                setFedCount(0);
                setRoundIdx((prev) => prev + 1);
              }, 1200);
            } else {
              // Level completed!
              setShowVictory(true);
              if (onComplete) onComplete();
            }
          }
        }, 650);
      }, 400);
    } else {
      // Wrong item
      setErrorsCount((prev) => prev + 1);
      SunnySoundFX.playWrong();
      BilingualVoiceEngine.speakBilingual(
        `Đó là ${item.nameVi}! Cáo Sunny đang tìm ${round.targetNameVi} cơ!`,
        `That is a ${item.nameEn}! Look for the ${round.targetNameEn}!`
      );
    }
  };

  const handleReplay = () => {
    setLevel(1);
    setRoundIdx(0);
    setFedCount(0);
    setErrorsCount(0);
    setShowVictory(false);
  };

  const handleNextLevel = () => {
    if (level < totalLevels) {
      setLevel((prev) => prev + 1);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto select-none pb-16 px-3 sm:px-4 animate-fadeIn">
      {/* 1. Header with Back button and progress */}
      <header className="flex items-center justify-between gap-4 pt-2 pb-4 border-b border-[#BAE6FD]">
        <button
          type="button"
          onClick={() => {
            SunnySoundFX.playButtonClick();
            onExit();
          }}
          className="toy-btn bg-white hover:bg-slate-50 text-[#0F172A] border-2 border-[#CBD5E1] px-4 py-2 text-sm font-bold flex items-center gap-2"
        >
          <span>← Thoát Game</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold font-display border border-emerald-300">
            Cấp Độ {level} / {totalLevels}
          </span>
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold font-display border border-amber-300">
            Lượt {roundIdx + 1} / {currentRounds.length}
          </span>
          <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-extrabold font-display border border-rose-300">
            Lỗi: {errorsCount}
          </span>
        </div>
      </header>

      {/* 2. Bilingual Guide Bar with Sunny the Fox */}
      <div className="mt-4">
        <SunnyBilingualGuide
          viPrompt={round.viPrompt}
          enPrompt={round.enPrompt}
          badgeTitle="Cáo Sunny Đói Bụng"
          extraRightSlot={
            <div className="flex items-center gap-2 bg-amber-50 px-3.5 py-1.5 rounded-2xl border-2 border-amber-200">
              <span className="text-xs font-extrabold text-amber-900">Mục tiêu:</span>
              <div className="flex items-center gap-1 font-display font-extrabold text-amber-950 text-sm">
                <span>{fedCount}</span>
                <span>/</span>
                <span>{round.requiredCount}</span>
                <svg className="w-5 h-5 ml-1">
                  <use href={round.symbol}></use>
                </svg>
              </div>
            </div>
          }
        />
      </div>

      {/* 3. Anti-Cramped Game Stage Wrapper */}
      <div className="game-stage-wrapper">
        <div className="game-canvas-card flex flex-col items-center">
          {/* Picnic Stage: Cáo Sunny & Feeding Plate */}
          <div className="w-full max-w-2xl bg-gradient-to-b from-[#FEF3C7]/60 via-[#F0FDF4] to-[#E0F2FE] rounded-3xl p-6 sm:p-8 border-4 border-[#BAE6FD] flex flex-col sm:flex-row items-center justify-around gap-6 relative shadow-inner">
            {/* Picnic Basket */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-20 sm:w-28 sm:h-24 drop-shadow-md">
                <svg className="w-full h-full">
                  <use href="#svg-picnic-basket"></use>
                </svg>
              </div>
              <span className="text-xs font-bold text-amber-900 mt-1 font-display">
                Giỏ Dã Ngoại
              </span>
            </div>

            {/* Sunny the Fox Picnic Hero with Chomping Animation */}
            <div className="relative flex flex-col items-center">
              {/* Chew Speech Bubble */}
              {isChewing && (
                <div className="absolute -top-10 bg-amber-400 text-amber-950 font-extrabold text-xs sm:text-sm px-3 py-1 rounded-full shadow-md animate-bounce border-2 border-amber-600">
                  {chewBubble}
                </div>
              )}

              <div
                className={`w-36 h-36 sm:w-44 sm:h-44 transition-transform duration-300 ${
                  isChewing ? 'scale-110 animate-bounce' : 'hover:scale-105'
                }`}
              >
                <svg className="w-full h-full drop-shadow-lg">
                  <use href="#svg-sunny-fox"></use>
                </svg>
              </div>

              {/* Fox Status Badge */}
              <div className="mt-2 bg-white px-3 py-1 rounded-full border-2 border-amber-300 shadow-xs flex items-center gap-2">
                <span className="text-xs font-extrabold text-[#0F172A] font-display">
                  {isChewing ? '🦊 Đang măm măm...' : '🦊 Cáo Sunny đang đói!'}
                </span>
              </div>
            </div>

            {/* Feeding Plate with Target Counters */}
            <div className="flex flex-col items-center bg-white/90 p-4 rounded-2xl border-2 border-amber-200 shadow-xs">
              <span className="text-xs font-bold text-slate-600 mb-2 font-display">
                Đĩa thức ăn ({fedCount}/{round.requiredCount})
              </span>
              <div className="flex items-center gap-2 min-h-[44px]">
                {Array.from({ length: round.requiredCount }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${
                      idx < fedCount
                        ? 'bg-emerald-100 border-emerald-400 scale-105'
                        : 'bg-slate-50 border-dashed border-slate-300'
                    }`}
                  >
                    {idx < fedCount ? (
                      <svg className="w-7 h-7 drop-shadow-xs">
                        <use href={round.symbol}></use>
                      </svg>
                    ) : (
                      <span className="text-slate-300 font-bold text-xs">{idx + 1}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fruit Selection Pantry */}
          <div className="w-full mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-extrabold text-[#0F172A] font-display">
                🍎 Chạm Vào Trái Cây Để Đút Cho Cáo Sunny:
              </h3>
              <span className="text-xs font-bold text-slate-500 font-body">
                Chọn đúng {round.targetNameVi} ({round.targetNameEn})
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {PICNIC_PANTRY.map((item) => {
                const isTarget = item.id === round.targetItem;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={(e) => handleFeedFruit(item, e)}
                    disabled={isChewing || Boolean(flyingItem)}
                    className={`toy-btn bg-white hover:bg-[#F0F9FF] border-3 rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center gap-2 group transition-all duration-200 ${
                      isTarget
                        ? 'border-amber-400 hover:border-amber-500 shadow-md ring-2 ring-amber-200'
                        : 'border-[#BAE6FD] hover:border-sky-400'
                    }`}
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-full h-full drop-shadow-xs">
                        <use href={item.symbol}></use>
                      </svg>
                    </div>
                    <div className="text-center">
                      <span className="block text-sm sm:text-base font-extrabold text-[#0F172A] font-display">
                        {item.nameEn}
                      </span>
                      <span className="block text-[11px] font-semibold text-slate-500">
                        {item.nameVi}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Victory Celebration Modal */}
      <VictoryCelebrationModal
        isOpen={showVictory}
        errorsCount={errorsCount}
        gameTitle="Bữa Tiệc Dã Ngoại Của Cáo Sunny"
        currentLevel={level}
        totalLevels={totalLevels}
        onReplay={handleReplay}
        onNextLevel={handleNextLevel}
        onExit={onExit}
      />
    </div>
  );
};

export default Game2_HungryFoxPicnic;
