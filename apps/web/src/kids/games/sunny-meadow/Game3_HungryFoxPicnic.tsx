import React, { useState, useEffect } from 'react';
import { SunnyAudioEngine } from '../../services/audio/SunnyAudioEngine';
import SunnyBilingualGuide from '../../components/SunnyBilingualGuide';
import VictoryCelebrationModal from '../../components/VictoryCelebrationModal';
import { meadowStore } from '../../core/meadowStateStore';

interface Game3Props {
  onExit: () => void;
  onComplete?: () => void;
}

interface PicnicRound {
  targetFruit: 'apple' | 'banana' | 'strawberry' | 'orange';
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
      targetFruit: 'apple',
      targetNameEn: 'Apple',
      targetNameVi: 'Quả Táo Đỏ',
      symbol: '#svg-apple',
      requiredCount: 2,
      viPrompt: 'Cáo Sunny thèm ăn 2 quả Táo đỏ! Bé hãy chạm đút cho Cáo Sunny 2 quả Táo nhé!',
      enPrompt: 'Feed Sunny 2 red apples! Nom nom!',
    },
    {
      targetFruit: 'banana',
      targetNameEn: 'Banana',
      targetNameVi: 'Quả Chuối Vàng',
      symbol: '#svg-banana',
      requiredCount: 2,
      viPrompt: 'Chuối vàng ngọt lịm! Bé đút cho Cáo Sunny 2 quả Chuối nhé!',
      enPrompt: 'Feed Sunny 2 sweet yellow bananas!',
    },
  ],
  2: [
    {
      targetFruit: 'strawberry',
      targetNameEn: 'Strawberry',
      targetNameVi: 'Quả Dâu Tây',
      symbol: '#svg-strawberry',
      requiredCount: 3,
      viPrompt: 'Dâu tây thơm ngát! Bé hãy đút 3 quả Dâu tây đỏ mọng cho Cáo Sunny nào!',
      enPrompt: 'Give Sunny 3 juicy red strawberries!',
    },
    {
      targetFruit: 'orange',
      targetNameEn: 'Orange',
      targetNameVi: 'Quả Cam Mọng Nước',
      symbol: '#svg-orange',
      requiredCount: 2,
      viPrompt: 'Cam ngọt mát lành! Bé đút cho Cáo Sunny 2 quả Cam nhé!',
      enPrompt: 'Feed Sunny 2 fresh orange fruits!',
    },
  ],
};

const PICNIC_FRUITS = [
  { id: 'apple', nameEn: 'Apple', nameVi: 'Quả Táo', symbol: '#svg-apple' },
  { id: 'banana', nameEn: 'Banana', nameVi: 'Quả Chuối', symbol: '#svg-banana' },
  { id: 'strawberry', nameEn: 'Strawberry', nameVi: 'Dâu Tây', symbol: '#svg-strawberry' },
  { id: 'orange', nameEn: 'Orange', nameVi: 'Quả Cam', symbol: '#svg-orange' },
] as const;

export const Game3_HungryFoxPicnic: React.FC<Game3Props> = ({ onExit, onComplete }) => {
  const [level, setLevel] = useState<number>(1);
  const totalLevels = 2;

  const [roundIdx, setRoundIdx] = useState<number>(0);
  const [fedCount, setFedCount] = useState<number>(0);
  const [errorsCount, setErrorsCount] = useState<number>(0);
  const [isChewing, setIsChewing] = useState<boolean>(false);
  const [showVictory, setShowVictory] = useState<boolean>(false);

  const currentRounds = LEVEL_ROUNDS[level] || LEVEL_ROUNDS[1];
  const round = currentRounds[roundIdx] || currentRounds[0];

  useEffect(() => {
    setRoundIdx(0);
    setFedCount(0);
    setErrorsCount(0);
    setShowVictory(false);
  }, [level]);

  const handleFeedFruit = (fruit: typeof PICNIC_FRUITS[number]) => {
    if (isChewing || showVictory) return;

    if (fruit.id === round.targetFruit) {
      // Correct fruit fed
      SunnyAudioEngine.playCorrect();
      setIsChewing(true);
      SunnyAudioEngine.speakEnglish(`${fruit.nameEn}! Yummy!`);

      const nextFed = fedCount + 1;

      setTimeout(() => {
        setIsChewing(false);
        setFedCount(nextFed);

        if (nextFed >= round.requiredCount) {
          meadowStore.addStars(5);

          if (roundIdx < currentRounds.length - 1) {
            setTimeout(() => {
              setFedCount(0);
              setRoundIdx((prev) => prev + 1);
            }, 1000);
          } else {
            setShowVictory(true);
            if (onComplete) onComplete();
          }
        }
      }, 700);
    } else {
      // Wrong fruit
      setErrorsCount((prev) => prev + 1);
      SunnyAudioEngine.playWrong();
      SunnyAudioEngine.speakBilingual(
        `Đó là ${fruit.nameVi}! Cáo Sunny đang thèm ${round.targetNameVi} cơ!`,
        `That is an ${fruit.nameEn}! Look for the ${round.targetNameEn}!`
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
    <div className="game-viewport select-none animate-fadeIn">
      {/* 1. Header Navigation Bar */}
      <div className="w-full max-w-[920px] flex items-center justify-between pb-2 border-b border-[#BAE6FD]">
        <button
          type="button"
          onClick={() => {
            SunnyAudioEngine.playClick();
            onExit();
          }}
          className="toy-btn bg-white hover:bg-slate-50 text-[#0F172A] border-2 border-[#CBD5E1] px-4 py-2 text-sm font-bold flex items-center gap-2 shadow-xs"
        >
          <span>← Thoát Game</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black font-display border border-emerald-300">
            Cấp Độ {level} / {totalLevels}
          </span>
          <span className="px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black font-display border border-amber-300">
            Lượt {roundIdx + 1} / {currentRounds.length}
          </span>
          <span className="px-3.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black font-display border border-rose-300">
            Lỗi: {errorsCount}
          </span>
        </div>
      </div>

      {/* 2. Bilingual Guide Bar with Sunny Fox */}
      <SunnyBilingualGuide
        viPrompt={round.viPrompt}
        enPrompt={round.enPrompt}
        badgeTitle="Bữa Tiệc Dã Ngoại Của Cáo Sunny"
        extraRightSlot={
          <div className="flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-xl border border-amber-300">
            <span className="text-xs font-extrabold text-amber-900">Mục tiêu:</span>
            <div className="flex items-center gap-1 font-display font-black text-amber-950 text-sm">
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

      {/* 3. Central Stage Card (Fix Bug #5) */}
      <div className="game-board-stage">
        {/* Center: Sunny the Fox Mascot Há Miệng Chờ Ăn */}
        <div className="flex flex-col sm:flex-row items-center justify-around w-full max-w-xl gap-6 mb-8">
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

          {/* Sunny the Fox Mascot */}
          <div className="relative flex flex-col items-center">
            {isChewing && (
              <div className="absolute -top-9 bg-amber-400 text-amber-950 font-black text-xs sm:text-sm px-3.5 py-1 rounded-full shadow-md animate-bounce border-2 border-amber-600">
                Nom nom! Yummy! 🍎
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

            <div className="mt-2 bg-white px-3 py-1 rounded-full border-2 border-amber-300 shadow-xs">
              <span className="text-xs font-extrabold text-[#0F172A] font-display">
                {isChewing ? '🦊 Cáo Sunny đang măm măm!' : '🦊 Cáo Sunny đang chờ quả!'}
              </span>
            </div>
          </div>

          {/* Feeding Target Plate */}
          <div className="flex flex-col items-center bg-slate-50 p-3.5 rounded-2xl border-2 border-slate-200">
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
                      : 'bg-white border-dashed border-slate-300'
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

        {/* 4 Fruit Baskets around with neat English badge (Fix Bug #1) */}
        <div className="w-full">
          <p className="text-sm font-extrabold text-slate-700 font-display mb-3 text-center">
            🍎 Chạm vào quả đúng để đút cho Cáo Sunny:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {PICNIC_FRUITS.map((fruit) => {
              const isTarget = fruit.id === round.targetFruit;
              return (
                <button
                  key={fruit.id}
                  type="button"
                  onClick={() => handleFeedFruit(fruit)}
                  disabled={isChewing}
                  className={`word-card-item w-full !h-[160px] mx-auto group transition-all duration-200 ${
                    isTarget
                      ? 'border-amber-400 ring-2 ring-amber-200 shadow-md'
                      : 'border-[#BAE6FD]'
                  }`}
                >
                  <div className="card-illust-svg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-full h-full drop-shadow-xs">
                      <use href={fruit.symbol}></use>
                    </svg>
                  </div>
                  <div className="card-word-en">
                    {fruit.nameEn}
                  </div>
                  <div className="card-word-vi">
                    {fruit.nameVi}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Victory Celebration Modal */}
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

export default Game3_HungryFoxPicnic;
