import React, { useState, useEffect } from 'react';
import { MeadowAudioEngine } from '../../services/audio/MeadowAudioEngine';
import { meadowStore } from '../../core/meadowStateStore';

interface Game2Props {
  onExit: () => void;
  onComplete?: () => void;
}

interface PondRound {
  creatureName: 'frog' | 'lotus' | 'fish';
  targetColorName: string;
  targetHex: string;
  isMixMode: boolean;
  mixIngredients?: [string, string];
  speechText: string;
  subTitleVi: string;
}

const ROUNDS: PondRound[] = [
  {
    creatureName: 'frog',
    targetColorName: 'green',
    targetHex: '#57CC99',
    isMixMode: false,
    speechText: 'Paint the little frog GREEN!',
    subTitleVi: 'Bé hãy chạm vào giọt sương màu XANH LÁ (Green) để tô màu cho chú Ếch nhé!',
  },
  {
    creatureName: 'frog',
    targetColorName: 'yellow',
    targetHex: '#FFD166',
    isMixMode: false,
    speechText: 'Paint the happy frog YELLOW!',
    subTitleVi: 'Bé hãy chạm vào giọt sương VÀNG TƯƠI (Yellow) nhé!',
  },
  {
    creatureName: 'frog',
    targetColorName: 'orange',
    targetHex: '#FF9F1C',
    isMixMode: true,
    mixIngredients: ['red', 'yellow'],
    speechText: 'Magic mix! Mix RED and YELLOW to make an ORANGE frog!',
    subTitleVi: 'Pha màu phép thuật: Chạm ĐỎ và VÀNG để tạo màu CAM nhé!',
  },
  {
    creatureName: 'frog',
    targetColorName: 'purple',
    targetHex: '#C77DFF',
    isMixMode: true,
    mixIngredients: ['red', 'blue'],
    speechText: 'Magic mix! Mix RED and BLUE to make a PURPLE frog!',
    subTitleVi: 'Pha màu phép thuật: Chạm ĐỎ và XANH DƯƠNG để tạo màu TÍM nhé!',
  },
];

const DROPLETS = [
  { id: 'red', nameEn: 'Red', hex: '#FF5A5F' },
  { id: 'yellow', nameEn: 'Yellow', hex: '#FFD166' },
  { id: 'blue', nameEn: 'Blue', hex: '#4CC9F0' },
  { id: 'green', nameEn: 'Green', hex: '#57CC99' },
  { id: 'orange', nameEn: 'Orange', hex: '#FF9F1C' },
  { id: 'purple', nameEn: 'Purple', hex: '#C77DFF' },
];

export const Game2_ColorSplashPond: React.FC<Game2Props> = ({ onExit, onComplete }) => {
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [coloredState, setColoredState] = useState<string | null>(null);
  const [selectedMixColors, setSelectedMixColors] = useState<string[]>([]);
  const [isSplashing, setIsSplashing] = useState(false);
  const [frogJumping, setFrogJumping] = useState(false);
  const [frogWobble, setFrogWobble] = useState(false);
  const [showVictory, setShowVictory] = useState(false);

  const round = ROUNDS[currentRoundIdx];

  useEffect(() => {
    setColoredState(null);
    setSelectedMixColors([]);
    const timer = setTimeout(() => {
      MeadowAudioEngine.speak(round.speechText);
    }, 400);
    return () => clearTimeout(timer);
  }, [currentRoundIdx]);

  const handleSelectDroplet = (dropletId: string, hex: string) => {
    if (isSplashing || frogJumping || showVictory) return;

    MeadowAudioEngine.playSplash();

    if (!round.isMixMode) {
      if (dropletId === round.targetColorName) {
        // Correct direct color
        triggerCelebration(hex);
      } else {
        // Wrong color chosen (Zero-punishment feedback)
        setFrogWobble(true);
        MeadowAudioEngine.playSoftBounce();
        const dropName = DROPLETS.find((d) => d.id === dropletId)?.nameEn || 'color';
        MeadowAudioEngine.speak(`Ooh, that is ${dropName}! Let's find ${round.targetColorName}!`);
        setTimeout(() => setFrogWobble(false), 500);
      }
    } else {
      // Color mixing mode
      const needed = round.mixIngredients || [];
      if (needed.includes(dropletId) && !selectedMixColors.includes(dropletId)) {
        const nextMix = [...selectedMixColors, dropletId];
        setSelectedMixColors(nextMix);
        MeadowAudioEngine.playWoodTap('G5');

        if (nextMix.length === 2) {
          // Completed mix!
          triggerCelebration(round.targetHex);
        } else {
          MeadowAudioEngine.speak(`Good! Now add ${needed.find((c) => c !== dropletId)}!`);
        }
      } else if (!needed.includes(dropletId)) {
        setFrogWobble(true);
        MeadowAudioEngine.playSoftBounce();
        MeadowAudioEngine.speak(`Try mixing ${needed[0]} and ${needed[1]}!`);
        setTimeout(() => setFrogWobble(false), 500);
      }
    }
  };

  const triggerCelebration = (appliedHex: string) => {
    setIsSplashing(true);
    setColoredState(appliedHex);

    setTimeout(() => {
      setIsSplashing(false);
      setFrogJumping(true);
      MeadowAudioEngine.playMagicalSuccess();
      MeadowAudioEngine.speak(`Ribbit! I am a ${round.targetColorName} frog! Thank you!`);
      meadowStore.addStars(10);
      meadowStore.unlockSticker('color-frog');

      setTimeout(() => {
        setFrogJumping(false);
        if (currentRoundIdx < ROUNDS.length - 1) {
          setCurrentRoundIdx((prev) => prev + 1);
        } else {
          setShowVictory(true);
          meadowStore.recordGameRound('colorPond', 30);
          if (onComplete) onComplete();
        }
      }, 2200);
    }, 600);
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
          className="toy-btn toy-btn-sky !min-h-[50px] !py-2 !px-4 text-base"
        >
          ← Trở Về Khu Rừng
        </button>

        <div className="px-4 py-2 rounded-2xl bg-sky-100 border-2 border-sky-300 font-display font-extrabold text-sky-900 text-sm flex items-center gap-1.5 shadow-sm">
          <svg className="w-5 h-5"><use href="#svg-star-badge"></use></svg>
          <span>Chặng {currentRoundIdx + 1} / {ROUNDS.length}</span>
        </div>
      </div>

      {/* 2. Main Stage Card */}
      <div className="meadow-clay-card w-full p-6 sm:p-8 bg-gradient-to-b from-[#A0E7FF]/40 via-[#FFFDF5] to-[#80ED99]/40 relative overflow-hidden">
        {/* Audio Prompt Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white/95 p-4 rounded-3xl border-2 border-white shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => MeadowAudioEngine.speak(round.speechText)}
              className="toy-btn toy-btn-sky w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              aria-label="Nghe hướng dẫn"
              title="Nghe hướng dẫn"
            >
              🔊
            </button>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-sky-800 bg-sky-100 px-3 py-1 rounded-full font-display">
                🎨 Trò Chơi 2 • Hồ Sen Pha Màu Phép Thuật
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-800 mt-1 font-display leading-tight">
                "{round.speechText}"
              </h2>
              <p className="text-xs sm:text-sm font-bold text-slate-500 font-body">
                ({round.subTitleVi})
              </p>
            </div>
          </div>

          {/* Color target swatch */}
          <div className="flex items-center gap-2 bg-white border-2 border-slate-200 px-4 py-2 rounded-2xl shrink-0">
            <div
              className="w-7 h-7 rounded-full shadow-inner border-2 border-white"
              style={{ backgroundColor: round.targetHex }}
            />
            <span className="text-xl font-extrabold text-slate-800 font-display uppercase">
              {round.targetColorName}
            </span>
          </div>
        </div>

        {/* 3. Lily Pond Stage with Frog */}
        <div className="relative min-h-[260px] sm:min-h-[290px] flex flex-col items-center justify-center my-4 overflow-hidden rounded-3xl bg-gradient-to-b from-sky-100/60 to-emerald-100/80 p-6 border-2 border-sky-200/60">
          {/* Water Ripple Backdrop */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
            <div className="w-80 h-44 rounded-full border-4 border-sky-400 animate-ping" />
          </div>

          {/* Splash Burst Effect */}
          {isSplashing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="w-48 h-48 rounded-full bg-white/70 animate-ping" />
              <div className="text-5xl animate-bounce">💦</div>
            </div>
          )}

          {/* Colorable Frog */}
          <div
            onClick={() => MeadowAudioEngine.speak(coloredState ? `Ribbit! I am ${round.targetColorName}!` : 'Ribbit! Please give me color!')}
            style={{ color: coloredState || '#CBD5E1' }}
            className={`w-44 h-44 sm:w-52 sm:h-52 cursor-pointer transition-all duration-500 ${
              !coloredState ? 'filter grayscale brightness-110 opacity-70' : 'drop-shadow-lg scale-105'
            } ${frogJumping ? 'animate-bounce' : 'hover:scale-102'} ${
              frogWobble ? 'wobble-hint' : ''
            }`}
            title="Chú Ếch Hồ Sen"
          >
            <svg className="w-full h-full">
              <use href="#svg-color-frog"></use>
            </svg>
          </div>

          {/* Mixing progress tag */}
          {round.isMixMode && (
            <div className="mt-3 px-4 py-1.5 rounded-full bg-white/90 border border-purple-200 font-display font-extrabold text-xs text-purple-900 shadow-sm flex items-center gap-2">
              <span>Đã chọn:</span>
              {selectedMixColors.length === 0 ? (
                <span className="text-slate-400">Chưa chọn giọt nào</span>
              ) : (
                selectedMixColors.map((c) => (
                  <span key={c} className="px-2 py-0.5 rounded-full bg-slate-100 uppercase text-[10px]">
                    {c}
                  </span>
                ))
              )}
            </div>
          )}
        </div>

        {/* 4. Giant Color Droplets Palette Tray */}
        <div className="bg-emerald-50/90 border-4 border-emerald-200 rounded-3xl p-5">
          <p className="text-center text-xs sm:text-sm font-extrabold uppercase tracking-wider text-emerald-900 mb-4 font-display">
            💧 Chạm vào giọt sương màu sắc để nhuộm màu cho hồ sen:
          </p>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
            {DROPLETS.map((drop) => {
              const isSelected = selectedMixColors.includes(drop.id);
              return (
                <button
                  key={drop.id}
                  type="button"
                  onClick={() => handleSelectDroplet(drop.id, drop.hex)}
                  style={{ color: drop.hex }}
                  className={`meadow-clay-card p-3 flex flex-col items-center justify-center gap-2 hover:scale-105 active:scale-95 cursor-pointer min-h-[110px] bg-white transition-all ${
                    isSelected ? 'ring-4 ring-emerald-400 scale-105' : ''
                  }`}
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
                    <svg className="w-full h-full drop-shadow-sm">
                      <use href="#svg-color-droplet"></use>
                    </svg>
                  </div>
                  <span className="font-display font-extrabold text-slate-800 text-sm sm:text-base">
                    {drop.nameEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Victory Modal */}
      {showVictory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="meadow-clay-card max-w-md w-full p-8 text-center bg-[#FFFDF5] border-4 border-sky-400 shadow-2xl relative">
            <div className="w-20 h-20 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto text-4xl mb-4 shadow-inner">
              🎨 🐸
            </div>
            <h3 className="text-3xl font-extrabold text-[#1E293B] font-display mb-2">
              Hồ Sen Bừng Sáng Lung Linh!
            </h3>
            <p className="text-sm font-semibold text-[#475569] font-body mb-6">
              Bé đã xuất sắc hoàn thành thử thách pha màu và nhận được <strong className="text-amber-600 font-extrabold">+30 Sao Vàng</strong>!
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  MeadowAudioEngine.playWoodTap('C6');
                  setCurrentRoundIdx(0);
                  setShowVictory(false);
                }}
                className="toy-btn toy-btn-green w-full"
              >
                🔁 Chơi Lại Hồ Sen
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

export default Game2_ColorSplashPond;
