// ============================================================================
// ANIMAL RESCUE GAME — THẢ XÍCH CHO THÚ (HIGH FIDELITY EXPEDITION)
// Interactive 3D Metallic Chains, Golden Padlocks, Authentic Audio, and Rewards
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  Sparkles,
  Trophy,
  CheckCircle2,
  Lock,
  Unlock,
  ChevronRight,
} from 'lucide-react';
import { RewardCount } from '../../components/RewardCount';
import { KidsIllustration } from '../../assets/illustrations/KidsIllustration';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';
import {
  SanctuaryBackdrop,
  SanctuaryEnclosure,
  RescueChainsOverlay,
} from './AnimalRescueAssets';

export interface AnimalScenario {
  id: string;
  animalName: string;
  animalVi: string;
  phonetic: string;
  emoji: string;
  rescuePraiseVi: string;
  rescuePraiseEn: string;
}

export const RESCUE_ANIMALS: AnimalScenario[] = [
  {
    id: 'lion',
    animalName: 'Lion',
    animalVi: 'Chú Sư Tử Rừng Xanh',
    phonetic: '/ˈlaɪ.ən/',
    emoji: '🦁',
    rescuePraiseVi: 'Bé đã tháo xích thành công! Chú Sư Tử vẫy đuôi cảm ơn bé!',
    rescuePraiseEn: 'The brave Lion is free! Roar of victory!',
  },
  {
    id: 'elephant',
    animalName: 'Elephant',
    animalVi: 'Chú Voi Khổng Lồ',
    phonetic: '/ˈel.ɪ.fənt/',
    emoji: '🐘',
    rescuePraiseVi: 'Bạn Voi đã thoát khỏi xích sắt! Bạn Voi giơ vòi chào bé!',
    rescuePraiseEn: 'The friendly Elephant is safe and sound!',
  },
  {
    id: 'monkey',
    animalName: 'Monkey',
    animalVi: 'Chú Khỉ Tinh Nghịch',
    phonetic: '/ˈmʌŋ.ki/',
    emoji: '🐒',
    rescuePraiseVi: 'Hoan hô! Bạn Khỉ đã được thả xích và nhảy múa hò reo!',
    rescuePraiseEn: 'The playful Monkey swings into freedom!',
  },
  {
    id: 'rabbit',
    animalName: 'Rabbit',
    animalVi: 'Chú Thỏ Trắng Dễ Thương',
    phonetic: '/ˈræb.ɪt/',
    emoji: '🐰',
    rescuePraiseVi: 'Bạn Thỏ Trắng đã tự do nhảy nhót tung tăng trên bãi cỏ!',
    rescuePraiseEn: 'The cute little Rabbit hops happily away!',
  },
  {
    id: 'bear',
    animalName: 'Bear',
    animalVi: 'Chú Gấu Nâu Hiền Lành',
    phonetic: '/beər/',
    emoji: '🐻',
    rescuePraiseVi: 'Bạn Gấu Nâu đã được cứu! Cảm ơn hiệp sĩ nhí dũng cảm!',
    rescuePraiseEn: 'The gentle Bear gives you a big warm hug!',
  },
];

interface AnimalRescueGameProps {
  onExit: () => void;
  onStarsAwarded?: (stars: number) => void;
}

export const AnimalRescueGame: React.FC<AnimalRescueGameProps> = ({
  onExit,
  onStarsAwarded,
}) => {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const currentAnimal = RESCUE_ANIMALS[scenarioIndex];

  // 3 Chains status: false = locked with chain, true = severed/unlocked
  const [severedChains, setSeveredChains] = useState<boolean[]>([false, false, false]);
  const [isFreed, setIsFreed] = useState(false);
  const [starsEarned, setStarsEarned] = useState(0);
  const [activeUnlockIndex, setActiveUnlockIndex] = useState<number | null>(null);

  // Initial greeting audio
  useEffect(() => {
    setSeveredChains([false, false, false]);
    setIsFreed(false);

    const timer = setTimeout(() => {
      voiceService.speakWord(currentAnimal.animalName);
      setTimeout(() => {
        voiceService.speakVietnamese(
          `Bạn ${currentAnimal.animalVi} đang bị 3 dải xích sắt khóa chặt! Bé hãy chạm vào từng ổ khóa để thả xích giải cứu nhé!`
        );
      }, 900);
    }, 400);

    return () => clearTimeout(timer);
  }, [scenarioIndex]);

  // Pronounce target animal
  const speakAnimal = useCallback(() => {
    soundManager.play('pop');
    voiceService.speakWord(currentAnimal.animalName);
  }, [currentAnimal]);

  // Handle unlocking each chain
  const handleUnlockChain = (chainIndex: number) => {
    if (severedChains[chainIndex] || isFreed) return;

    setActiveUnlockIndex(chainIndex);
    soundManager.play('cut_vine');
    setTimeout(() => soundManager.play('unlock'), 150);

    const next = [...severedChains];
    next[chainIndex] = true;
    setSeveredChains(next);

    const remainingCount = next.filter((v) => !v).length;

    if (remainingCount > 0) {
      voiceService.speakVietnamese(`Đã mở xích ${chainIndex + 1}! Còn ${remainingCount} xích nữa bé ơi!`);
    } else {
      // ALL 3 CHAINS RELEASED! ANIMAL FREED!
      setIsFreed(true);
      const starsToAdd = 3;
      setStarsEarned((prev) => prev + starsToAdd);
      if (onStarsAwarded) onStarsAwarded(starsToAdd);

      setTimeout(() => {
        soundManager.play('star_burst');
        soundManager.play('celebration');
        voiceService.speakWord(currentAnimal.animalName);
        setTimeout(() => {
          voiceService.speakVietnamese(currentAnimal.rescuePraiseVi);
        }, 1100);
      }, 300);
    }
  };

  // Next Animal Round
  const handleNextAnimal = () => {
    soundManager.play('whoosh');
    setScenarioIndex((prev) => (prev + 1) % RESCUE_ANIMALS.length);
  };

  // Reset Current Round
  const handleResetRound = () => {
    soundManager.play('pop');
    setSeveredChains([false, false, false]);
    setIsFreed(false);
  };

  const remainingChains = severedChains.filter((c) => !c).length;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 select-none">
      {/* 1. TOP HUD BAR: BACK, TITLE, TARGET VOCAB, REWARD */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-xs">
        {/* Back button & Game Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 cursor-pointer transition-colors shadow-xs"
            title="Quay lại danh sách trò chơi"
            aria-label="Quay lại"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🦁</span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-none">
                Thả Xích Cứu Thú
              </h2>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Animal Rescue Expedition • Cứu Hộ Rừng Xanh
            </p>
          </div>
        </div>

        {/* Current Animal Pronunciation Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={speakAnimal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 active:scale-95 cursor-pointer transition-colors shadow-xs"
            title="Nghe phát âm tiếng Anh"
          >
            <span className="text-lg">{currentAnimal.emoji}</span>
            <div className="text-left">
              <div className="text-sm font-black flex items-center gap-1">
                <span>{currentAnimal.animalName}</span>
                <Volume2 className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold leading-none">
                {currentAnimal.phonetic}
              </div>
            </div>
          </button>

          <RewardCount stars={starsEarned} size="md" showStarLabel={true} />

          <button
            onClick={handleResetRound}
            className="p-2 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 border border-slate-200 active:scale-95 cursor-pointer transition-colors"
            title="Chơi lại con vật này"
            aria-label="Chơi lại"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. THREE-CHAIN PROGRESS STATUS CARDS */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[0, 1, 2].map((idx) => {
          const isDone = severedChains[idx];
          return (
            <button
              key={idx}
              onClick={() => handleUnlockChain(idx)}
              disabled={isDone || isFreed}
              className={`p-2.5 sm:p-3 rounded-2xl border-2 flex items-center justify-between gap-2 transition-all text-left shadow-xs ${
                isDone
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-950 opacity-90'
                  : 'bg-white hover:bg-amber-50 border-amber-300 hover:border-amber-400 text-slate-900 cursor-pointer active:scale-95'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl">⛓️</span>
                <div>
                  <div className="text-xs sm:text-sm font-black flex items-center gap-1">
                    <span>Xích Số {idx + 1}</span>
                    {isDone ? (
                      <Unlock className="w-3.5 h-3.5 text-emerald-600 inline" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-amber-600 inline animate-bounce" />
                    )}
                  </div>
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-500">
                    {idx === 0 ? 'Xích chéo trái' : idx === 1 ? 'Xích chéo phải' : 'Khóa xích ngang'}
                  </p>
                </div>
              </div>
              <div className="hidden sm:block">
                {isDone ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-black">
                    ĐÃ MỞ
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 text-[10px] font-black">
                    CHẠM MỞ
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. MAIN INTERACTIVE RESCUE STAGE */}
      <div className="relative w-full aspect-[800/600] max-h-[65vh] mx-auto rounded-3xl overflow-hidden border-4 border-emerald-400 shadow-2xl bg-emerald-100 select-none">
        <svg
          viewBox="0 0 800 600"
          className="w-full h-full object-contain"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Layer 1: Storybook Jungle Sanctuary Environment */}
          <SanctuaryBackdrop />

          {/* Layer 2: Sanctuary Wooden Cage Enclosure with Animal Inside */}
          <SanctuaryEnclosure isOpen={isFreed}>
            <g
              transform="translate(320, 185)"
              className={`transition-transform duration-700 ${
                isFreed ? 'animate-bounce scale-110' : 'opacity-90'
              }`}
            >
              <KidsIllustration
                name={currentAnimal.animalName.toLowerCase()}
                className="w-40 h-40 object-contain"
                alt={currentAnimal.animalName}
              />
            </g>
          </SanctuaryEnclosure>

          {/* Layer 3: 3D Metallic Chains and Golden Padlocks Overlay */}
          <RescueChainsOverlay
            severed={severedChains}
            onUnlockChain={handleUnlockChain}
          />
        </svg>

        {/* Floating Instruction Banner Bottom */}
        <div className="absolute bottom-3 inset-x-4 flex items-center justify-between p-3 rounded-2xl bg-white/95 backdrop-blur-xs border-2 border-emerald-300 shadow-lg">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-2xl animate-pulse">
              {isFreed ? '🎉' : '✂️'}
            </span>
            <div>
              <p className="text-xs sm:text-sm font-black text-slate-900">
                {isFreed
                  ? `Bé giỏi quá! Bạn ${currentAnimal.animalVi} (${currentAnimal.animalName}) đã được tự do!`
                  : `Chạm vào 3 ổ khóa vàng để tháo xích cứu bạn ${currentAnimal.animalVi}! (Còn ${remainingChains}/3 dải xích)`}
              </p>
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500">
                {isFreed
                  ? currentAnimal.rescuePraiseEn
                  : 'Tap the glowing golden padlocks to snap the iron chains!'}
              </p>
            </div>
          </div>

          {isFreed && (
            <button
              onClick={handleNextAnimal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black text-xs sm:text-sm shadow-md flex items-center gap-1 cursor-pointer active:scale-95 transition-all animate-pulse"
            >
              <span>Cứu Bạn Tiếp Theo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
