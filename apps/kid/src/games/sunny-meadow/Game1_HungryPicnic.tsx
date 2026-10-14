import React, { useState, useEffect } from 'react';
import { MeadowAudioEngine } from '../../services/audio/MeadowAudioEngine';
import { meadowStore } from '../../core/meadowStateStore';

interface Game1Props {
  onExit: () => void;
  onComplete?: () => void;
}

interface PicnicRound {
  animal: 'bunny' | 'fox';
  targetItem: 'strawberry' | 'carrot' | 'apple' | 'banana';
  requiredCount: number;
  speechText: string;
  subTitleVi: string;
}

const ROUNDS: PicnicRound[] = [
  {
    animal: 'bunny',
    targetItem: 'strawberry',
    requiredCount: 2,
    speechText: 'I am hungry! Please feed the bunny TWO sweet red strawberries!',
    subTitleVi: 'Bé hãy chạm vào 2 quả dâu tây đỏ để đút cho bạn Thỏ nhé!',
  },
  {
    animal: 'fox',
    targetItem: 'carrot',
    requiredCount: 2,
    speechText: 'Crunchy carrots please! Give the fox TWO crunchy carrots!',
    subTitleVi: 'Bé hãy chạm vào 2 củ cà rốt giòn để đút cho bạn Cáo nhé!',
  },
  {
    animal: 'bunny',
    targetItem: 'apple',
    requiredCount: 3,
    speechText: 'Yummy apples! Give the bunny THREE red apples!',
    subTitleVi: 'Bé hãy chạm vào 3 quả táo đỏ để đút cho bạn Thỏ nhé!',
  },
  {
    animal: 'fox',
    targetItem: 'banana',
    requiredCount: 2,
    speechText: 'Sweet yellow bananas! Give the fox TWO sweet bananas!',
    subTitleVi: 'Bé hãy chạm vào 2 quả chuối vàng cho bạn Cáo nhé!',
  },
];

const ITEMS = [
  { id: 'strawberry', nameEn: 'Strawberry', symbol: '#svg-item-strawberry' },
  { id: 'carrot', nameEn: 'Carrot', symbol: '#svg-item-carrot' },
  { id: 'apple', nameEn: 'Apple', symbol: '#svg-item-apple' },
  { id: 'banana', nameEn: 'Banana', symbol: '#svg-item-banana' },
] as const;

export const Game1_HungryPicnic: React.FC<Game1Props> = ({ onExit, onComplete }) => {
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [fedCount, setFedCount] = useState(0);
  const [isChewing, setIsChewing] = useState(false);
  const [animalWobble, setAnimalWobble] = useState(false);
  const [flyingItem, setFlyingItem] = useState<{ id: string; symbol: string } | null>(null);
  const [speechBubbleText, setSpeechBubbleText] = useState('Nom nom!');
  const [showVictory, setShowVictory] = useState(false);

  const round = ROUNDS[currentRoundIdx];

  useEffect(() => {
    // Speak initial round directive
    const timer = setTimeout(() => {
      MeadowAudioEngine.speak(round.speechText);
    }, 400);
    return () => clearTimeout(timer);
  }, [currentRoundIdx]);

  const handleFeedItem = (itemId: typeof ITEMS[number]['id'], symbol: string) => {
    if (isChewing || flyingItem || showVictory) return;

    if (itemId === round.targetItem) {
      // Correct pick!
      const nextFed = fedCount + 1;
      setFlyingItem({ id: itemId, symbol });
      MeadowAudioEngine.playWoodTap('C5');

      setTimeout(() => {
        setFlyingItem(null);
        setIsChewing(true);
        MeadowAudioEngine.playCrunch();
        setSpeechBubbleText(nextFed === 1 ? 'Crunch! One!' : nextFed === 2 ? 'Yummy! Two!' : 'Delicious! Three!');

        setTimeout(() => {
          setIsChewing(false);
          setFedCount(nextFed);

          if (nextFed >= round.requiredCount) {
            // Round victory!
            MeadowAudioEngine.playMagicalSuccess();
            meadowStore.addStars(10);
            meadowStore.unlockSticker(round.targetItem);

            if (currentRoundIdx < ROUNDS.length - 1) {
              setTimeout(() => {
                setFedCount(0);
                setCurrentRoundIdx((prev) => prev + 1);
              }, 1800);
            } else {
              // Full game won
              setShowVictory(true);
              meadowStore.recordGameRound('hungryPicnic', 30);
              if (onComplete) onComplete();
            }
          }
        }, 600);
      }, 500);
    } else {
      // Gentle feedback (Zero punishment)
      setAnimalWobble(true);
      MeadowAudioEngine.playSoftBounce();
      const friendlyName = ITEMS.find((i) => i.id === itemId)?.nameEn || 'fruit';
      MeadowAudioEngine.speak(
        `Ooh, that is a yummy ${friendlyName}! Let us look for the ${round.targetItem}!`,
        { rate: 0.85 }
      );
      setSpeechBubbleText(`Not now! I want ${round.targetItem}!`);
      setTimeout(() => setAnimalWobble(false), 600);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center select-none animate-fadeIn pb-8">
      {/* 1. Header Navigation Bar */}
      <div className="w-full flex items-center justify-between mb-4 px-2">
        <button
          onClick={() => {
            MeadowAudioEngine.playWoodTap('D4');
            onExit();
          }}
          className="toy-btn toy-btn-amber !min-h-[50px] !py-2 !px-4 text-base"
        >
          ← Trở Về Khu Rừng
        </button>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-amber-100 border-2 border-amber-300 font-display font-extrabold text-amber-900 text-sm flex items-center gap-1.5 shadow-sm">
            <svg className="w-5 h-5"><use href="#svg-star-badge"></use></svg>
            <span>Chặng {currentRoundIdx + 1} / {ROUNDS.length}</span>
          </div>
        </div>
      </div>

      {/* 2. Main Stage Card */}
      <div className="meadow-clay-card w-full p-6 sm:p-8 bg-gradient-to-b from-[#D8F3FF] via-[#FFFDF5] to-[#D9F99D]/60 relative overflow-hidden">
        {/* Audio Prompt Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white/95 p-4 rounded-3xl border-2 border-white shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => MeadowAudioEngine.speak(round.speechText)}
              className="toy-btn toy-btn-green w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              aria-label="Nghe lại hiệu lệnh"
              title="Nghe lại câu tiếng Anh"
            >
              🔊
            </button>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full font-display">
                🧺 Trò Chơi 1 • Tiệc Picnic Rừng Xanh
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-800 mt-1 font-display leading-tight">
                "Feed the {round.animal} <span className="text-rose-600 underline">{round.requiredCount} {round.targetItem}s</span>!"
              </h2>
              <p className="text-xs sm:text-sm font-bold text-slate-500 font-body">
                ({round.subTitleVi})
              </p>
            </div>
          </div>

          {/* Visual Progress Count */}
          <div className="flex items-center gap-2 bg-rose-50 border-2 border-rose-200 px-4 py-2 rounded-2xl shrink-0">
            <svg className="w-8 h-8"><use href={`#svg-item-${round.targetItem}`}></use></svg>
            <span className="text-2xl font-extrabold text-rose-600 font-display">
              {fedCount} / {round.requiredCount}
            </span>
          </div>
        </div>

        {/* 3. Central Interactive Animal Stage */}
        <div className="relative min-h-[260px] sm:min-h-[290px] flex flex-col items-center justify-center my-4">
          {/* Animated Thought Bubble */}
          <div
            className={`bg-white border-4 border-amber-300 rounded-3xl px-5 py-2.5 shadow-md mb-2 flex items-center gap-2.5 ${
              isChewing ? 'scale-110 bg-amber-50' : 'animate-bounce'
            } transition-transform`}
          >
            <span className="font-display font-extrabold text-slate-800 text-lg">
              {speechBubbleText}
            </span>
            <div className="flex items-center gap-1">
              {Array.from({ length: round.requiredCount }).map((_, i) => (
                <svg
                  key={i}
                  className={`w-7 h-7 transition-opacity ${
                    i < fedCount ? 'opacity-30 line-through' : 'opacity-100'
                  }`}
                >
                  <use href={`#svg-item-${round.targetItem}`}></use>
                </svg>
              ))}
            </div>
          </div>

          {/* Mascot (Chubby Bunny or Sunny Fox) */}
          <div
            onClick={() => MeadowAudioEngine.speak(`I am hungry! I love ${round.targetItem}s!`)}
            className={`w-44 h-44 sm:w-48 sm:h-48 cursor-pointer transition-transform ${
              animalWobble ? 'wobble-hint' : 'hover:scale-105'
            } ${isChewing ? 'animate-pulse scale-105' : ''}`}
            title="Chạm vào bạn thú"
          >
            <svg className="w-full h-full drop-shadow-md">
              <use href={round.animal === 'bunny' ? '#svg-chubby-bunny' : '#svg-sunny-fox'}></use>
            </svg>
          </div>

          {/* Parabolic Flying Item Animation */}
          {flyingItem && (
            <div className="absolute w-16 h-16 pointer-events-none animate-bounce" style={{ top: '35%' }}>
              <svg className="w-full h-full drop-shadow-lg">
                <use href={flyingItem.symbol}></use>
              </svg>
            </div>
          )}
        </div>

        {/* 4. Giant Touch Basket Tray (Ergonomic 96x96px+ touch targets) */}
        <div className="bg-amber-100/70 border-4 border-amber-300/80 rounded-3xl p-5 relative">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-amber-900 font-display flex items-center gap-2">
              <svg className="w-6 h-6"><use href="#svg-picnic-basket"></use></svg>
              <span>Chạm vào quả trong giỏ mây để đút cho bạn {round.animal === 'bunny' ? 'Thỏ' : 'Cáo'}:</span>
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleFeedItem(item.id, item.symbol)}
                className="meadow-clay-card p-4 flex flex-col items-center justify-center gap-2 hover:scale-105 active:scale-95 cursor-pointer min-h-[120px] bg-white group border-2 border-white hover:border-amber-300"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center transition-transform group-hover:scale-110">
                  <svg className="w-full h-full drop-shadow-sm">
                    <use href={item.symbol}></use>
                  </svg>
                </div>
                <span className="font-display font-extrabold text-slate-800 text-lg sm:text-xl">
                  {item.nameEn}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Round Completion / Victory Modal */}
      {showVictory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="meadow-clay-card max-w-md w-full p-8 text-center bg-[#FFFDF5] border-4 border-emerald-400 shadow-2xl relative">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-4xl mb-4 shadow-inner">
              🧺 ⭐
            </div>
            <h3 className="text-3xl font-extrabold text-[#1E293B] font-display mb-2">
              Bữa Tiệc Rừng Xanh Tuyệt Vời!
            </h3>
            <p className="text-sm font-semibold text-[#475569] font-body mb-6">
              Các bạn thú đã no nê và gửi tặng bé <strong className="text-amber-600 font-extrabold">+30 Sao Vàng</strong> cùng một nhãn dán mới toanh!
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  MeadowAudioEngine.playWoodTap('C6');
                  setCurrentRoundIdx(0);
                  setFedCount(0);
                  setShowVictory(false);
                }}
                className="toy-btn toy-btn-green w-full"
              >
                🔁 Chơi Lại Bữa Tiệc Picnic
              </button>
              <button
                onClick={() => {
                  MeadowAudioEngine.playWoodTap('D4');
                  onExit();
                }}
                className="toy-btn toy-btn-amber w-full"
              >
                🏡 Về Bản Đồ Đồng Cỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game1_HungryPicnic;
