import React, { useState, useEffect } from 'react';
import { SunnySoundFX } from '../../services/audio/SunnySoundFX';
import { BilingualVoiceEngine } from '../../services/audio/BilingualVoiceEngine';
import SunnyBilingualGuide from '../../components/SunnyBilingualGuide';
import VictoryCelebrationModal from '../../components/VictoryCelebrationModal';
import { meadowStore } from '../../core/meadowStateStore';

interface Game3Props {
  onExit: () => void;
  onComplete?: () => void;
}

interface PondRound {
  targetColorName: string;
  targetHex: string;
  nameVi: string;
  isMixMode: boolean;
  mixIngredients?: [string, string];
  viPrompt: string;
  enPrompt: string;
}

const LEVEL_ROUNDS: Record<number, PondRound[]> = {
  1: [
    {
      targetColorName: 'green',
      targetHex: '#57CC99',
      nameVi: 'Xanh Lá',
      isMixMode: false,
      viPrompt: 'Bé hãy chạm vào giọt sương màu Xanh Lá (Green) để tô màu cho chú Ếch Cốm nhé!',
      enPrompt: 'Paint the happy frog GREEN!',
    },
    {
      targetColorName: 'yellow',
      targetHex: '#FFD166',
      nameVi: 'Vàng Tươi',
      isMixMode: false,
      viPrompt: 'Cáo Sunny thích màu Vàng Nắng! Bé hãy chạm vào giọt sương Vàng (Yellow) nào!',
      enPrompt: 'Splash the frog with YELLOW sunshine!',
    },
    {
      targetColorName: 'blue',
      targetHex: '#4CC9F0',
      nameVi: 'Xanh Dương',
      isMixMode: false,
      viPrompt: 'Hồ sen mát lành! Bé hãy chạm vào giọt sương Xanh Dương (Blue) nhé!',
      enPrompt: 'Make the frog BLUE like the pond!',
    },
  ],
  2: [
    {
      targetColorName: 'orange',
      targetHex: '#FF9F1C',
      nameVi: 'Màu Cam',
      isMixMode: true,
      mixIngredients: ['red', 'yellow'],
      viPrompt: 'Pha màu phép thuật! Hãy chạm ĐỎ (Red) và VÀNG (Yellow) để tạo chú ếch màu CAM nhé!',
      enPrompt: 'Magic mix! Mix RED and YELLOW to make an ORANGE frog!',
    },
    {
      targetColorName: 'purple',
      targetHex: '#C77DFF',
      nameVi: 'Màu Tím',
      isMixMode: true,
      mixIngredients: ['red', 'blue'],
      viPrompt: 'Pha màu phép thuật! Chạm ĐỎ (Red) và XANH DƯƠNG (Blue) để tạo chú ếch màu TÍM mộng mơ!',
      enPrompt: 'Mix RED and BLUE to make a magical PURPLE frog!',
    },
    {
      targetColorName: 'pink',
      targetHex: '#FF758F',
      nameVi: 'Màu Hồng',
      isMixMode: true,
      mixIngredients: ['red', 'white'],
      viPrompt: 'Pha màu phép thuật! Chạm ĐỎ (Red) và TRẮNG (White) để tạo chú ếch màu HỒNG xinh xắn!',
      enPrompt: 'Mix RED and WHITE to make a sweet PINK frog!',
    },
  ],
};

const COLOR_DROPLETS = [
  { id: 'red', nameEn: 'Red', nameVi: 'Đỏ', hex: '#FF5A5F' },
  { id: 'yellow', nameEn: 'Yellow', nameVi: 'Vàng', hex: '#FFD166' },
  { id: 'blue', nameEn: 'Blue', nameVi: 'Xanh Dương', hex: '#4CC9F0' },
  { id: 'green', nameEn: 'Green', nameVi: 'Xanh Lá', hex: '#57CC99' },
  { id: 'white', nameEn: 'White', nameVi: 'Trắng', hex: '#F8FAFC' },
  { id: 'orange', nameEn: 'Orange', nameVi: 'Cam', hex: '#FF9F1C' },
  { id: 'purple', nameEn: 'Purple', nameVi: 'Tím', hex: '#C77DFF' },
  { id: 'pink', nameEn: 'Pink', nameVi: 'Hồng', hex: '#FF758F' },
];

export const Game3_ColorSplashPond: React.FC<Game3Props> = ({ onExit, onComplete }) => {
  const [level, setLevel] = useState<number>(1);
  const totalLevels = 2;

  const [roundIdx, setRoundIdx] = useState<number>(0);
  const [frogColor, setFrogColor] = useState<string>('#57CC99');
  const [selectedMix, setSelectedMix] = useState<string[]>([]);
  const [errorsCount, setErrorsCount] = useState<number>(0);
  const [frogJumping, setFrogJumping] = useState<boolean>(false);
  const [showVictory, setShowVictory] = useState<boolean>(false);

  const currentRounds = LEVEL_ROUNDS[level] || LEVEL_ROUNDS[1];
  const round = currentRounds[roundIdx] || currentRounds[0];

  useEffect(() => {
    setRoundIdx(0);
    setErrorsCount(0);
    setSelectedMix([]);
    setShowVictory(false);
  }, [level]);

  useEffect(() => {
    setSelectedMix([]);
  }, [roundIdx]);

  const handleSelectDroplet = (droplet: typeof COLOR_DROPLETS[number]) => {
    if (frogJumping || showVictory) return;

    SunnySoundFX.playCardSelect();

    if (!round.isMixMode) {
      if (droplet.id === round.targetColorName) {
        // Success direct match!
        handleRoundSuccess(droplet.hex, droplet.nameEn);
      } else {
        // Wrong color
        setErrorsCount((prev) => prev + 1);
        SunnySoundFX.playWrong();
        BilingualVoiceEngine.speakBilingual(
          `Đó là màu ${droplet.nameVi}! Hãy tìm giọt sương ${round.nameVi} nhé!`,
          `That is ${droplet.nameEn}! Look for ${round.targetColorName}!`
        );
      }
    } else {
      // Mix Mode
      const needed = round.mixIngredients || [];
      if (!needed.includes(droplet.id)) {
        // Wrong ingredient
        setErrorsCount((prev) => prev + 1);
        SunnySoundFX.playWrong();
        BilingualVoiceEngine.speakBilingual(
          `Giọt sương ${droplet.nameVi} không dùng cho công thức này. Bé hãy nhìn gợi ý của Cáo Sunny nhé!`,
          `${droplet.nameEn} is not part of this mix. Follow Sunny's recipe!`
        );
        return;
      }

      if (selectedMix.includes(droplet.id)) {
        // Already picked this one
        return;
      }

      const nextMix = [...selectedMix, droplet.id];
      setSelectedMix(nextMix);
      BilingualVoiceEngine.speakEnglish(droplet.nameEn);

      if (nextMix.length === 2) {
        // Both ingredients collected!
        handleRoundSuccess(round.targetHex, round.targetColorName);
      }
    }
  };

  const handleRoundSuccess = (colorHex: string, colorName: string) => {
    SunnySoundFX.playCorrect();
    setFrogColor(colorHex);
    setFrogJumping(true);

    BilingualVoiceEngine.speakBilingual(
      `Oa! Tuyệt vời quá! Chú ếch đã biến thành màu ${round.nameVi}!`,
      `Ribbit! Wow! The frog is ${colorName}! So magical!`
    );

    setTimeout(() => {
      setFrogJumping(false);
      meadowStore.addStars(5);

      if (roundIdx < currentRounds.length - 1) {
        setTimeout(() => {
          setRoundIdx((prev) => prev + 1);
        }, 800);
      } else {
        setShowVictory(true);
        if (onComplete) onComplete();
      }
    }, 1200);
  };

  const handleReplay = () => {
    setLevel(1);
    setRoundIdx(0);
    setErrorsCount(0);
    setSelectedMix([]);
    setFrogColor('#57CC99');
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
          <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-900 text-xs font-extrabold font-display border border-teal-300">
            Vòng {roundIdx + 1} / {currentRounds.length}
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
          badgeTitle="Cáo Sunny Pha Màu"
          extraRightSlot={
            round.isMixMode && round.mixIngredients ? (
              <div className="flex items-center gap-2 bg-purple-50 px-3.5 py-1.5 rounded-2xl border-2 border-purple-200">
                <span className="text-xs font-extrabold text-purple-900">Công thức:</span>
                <span className="text-xs font-bold text-slate-700">
                  {round.mixIngredients.join(' + ').toUpperCase()}
                </span>
              </div>
            ) : undefined
          }
        />
      </div>

      {/* 3. Anti-Cramped Game Stage Wrapper */}
      <div className="game-stage-wrapper">
        <div className="game-canvas-card flex flex-col items-center">
          {/* Lily Pond Center: Magic Frog on Lily Pad */}
          <div className="w-full max-w-2xl bg-gradient-to-b from-[#E0F2FE] via-[#CCFBF1] to-[#BAE6FD] rounded-3xl p-6 sm:p-10 border-4 border-[#BAE6FD] flex flex-col items-center justify-center relative shadow-inner overflow-hidden min-h-[260px]">
            {/* Water Ripple Decor */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
              <div className="w-72 h-72 rounded-full border-4 border-sky-300 animate-ping"></div>
            </div>

            {/* Target Color Name Banner */}
            <div className="mb-4 bg-white/95 px-4 py-1.5 rounded-full border-2 border-teal-300 shadow-xs flex items-center gap-2 z-10">
              <span className="text-xs sm:text-sm font-extrabold text-[#0F172A] font-display">
                Màu mục tiêu: {round.nameVi} ({round.targetColorName.toUpperCase()})
              </span>
              <span
                className="w-4 h-4 rounded-full border border-slate-300 inline-block"
                style={{ backgroundColor: round.targetHex }}
              ></span>
            </div>

            {/* The Magic Frog Changing Color */}
            <div
              className={`w-36 h-36 sm:w-44 sm:h-44 transition-all duration-500 z-10 ${
                frogJumping ? 'animate-bounce scale-110' : 'hover:scale-105'
              }`}
              style={{ color: frogColor }}
            >
              <svg className="w-full h-full drop-shadow-lg">
                <use href="#svg-color-frog"></use>
              </svg>
            </div>

            {/* Mix Mode Slots if active */}
            {round.isMixMode && (
              <div className="mt-4 flex items-center gap-2 z-10 bg-white/90 px-4 py-2 rounded-2xl border-2 border-purple-200">
                <span className="text-xs font-bold text-slate-700 font-display">Đã chọn:</span>
                {round.mixIngredients?.map((ing, idx) => {
                  const isFilled = selectedMix.includes(ing);
                  const ingObj = COLOR_DROPLETS.find((c) => c.id === ing);
                  return (
                    <div
                      key={idx}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                        isFilled
                          ? 'border-purple-600 shadow-xs'
                          : 'border-dashed border-slate-300 bg-slate-50'
                      }`}
                      style={{ backgroundColor: isFilled ? ingObj?.hex : 'transparent' }}
                    >
                      {isFilled ? '✓' : '?'}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Color Droplets Palette */}
          <div className="w-full mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-extrabold text-[#0F172A] font-display">
                💧 Chạm Vào Giọt Sương Màu Sắc:
              </h3>
              <span className="text-xs font-bold text-slate-500 font-body">
                {round.isMixMode ? 'Chạm 2 giọt màu để pha trộn' : 'Chạm 1 giọt màu đúng'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
              {COLOR_DROPLETS.map((droplet) => {
                const isSelected = selectedMix.includes(droplet.id);
                return (
                  <button
                    key={droplet.id}
                    type="button"
                    onClick={() => handleSelectDroplet(droplet)}
                    disabled={frogJumping}
                    className={`toy-btn bg-white hover:bg-[#F0F9FF] border-3 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 group transition-all duration-200 ${
                      isSelected
                        ? 'border-purple-500 ring-2 ring-purple-300 scale-95 shadow-inner'
                        : 'border-[#BAE6FD] hover:border-sky-400'
                    }`}
                  >
                    <div
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white shadow-xs group-hover:scale-110 transition-transform flex items-center justify-center"
                      style={{ backgroundColor: droplet.hex }}
                    >
                      <svg className="w-6 h-6 text-white/90">
                        <use href="#svg-color-droplet"></use>
                      </svg>
                    </div>
                    <div className="text-center">
                      <span className="block text-xs sm:text-sm font-extrabold text-[#0F172A] font-display">
                        {droplet.nameEn}
                      </span>
                      <span className="block text-[10px] font-semibold text-slate-500">
                        {droplet.nameVi}
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
        gameTitle="Đầm Sen Pha Màu Phép Thuật"
        currentLevel={level}
        totalLevels={totalLevels}
        onReplay={handleReplay}
        onNextLevel={handleNextLevel}
        onExit={onExit}
      />
    </div>
  );
};

export default Game3_ColorSplashPond;
