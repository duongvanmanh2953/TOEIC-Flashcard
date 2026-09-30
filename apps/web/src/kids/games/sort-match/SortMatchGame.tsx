// ============================================================================
// GAME 09: SORT & MATCH (PHÂN LOẠI THẦN KỲ)
// Vocabulary Categorization • 2 Large Zones • Magnetic Snap Feedback
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Sparkles, Check } from 'lucide-react';
import { KidsGameWrapper } from '../core/KidsGameWrapper';
import { KIDS_GAMES_REGISTRY } from '../../data/games/gamesRegistry';
import { KidsIllustration } from '../../assets/illustrations/KidsIllustration';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';

interface SortableItem {
  id: string;
  nameEn: string;
  nameVi: string;
  category: 'fruit' | 'animal';
}

const ALL_SORTABLE_ITEMS: SortableItem[] = [
  { id: 'apple', nameEn: 'Apple', nameVi: 'Quả táo', category: 'fruit' },
  { id: 'dog', nameEn: 'Dog', nameVi: 'Con chó', category: 'animal' },
  { id: 'banana', nameEn: 'Banana', nameVi: 'Quả chuối', category: 'fruit' },
  { id: 'cat', nameEn: 'Cat', nameVi: 'Con mèo', category: 'animal' },
  { id: 'strawberry', nameEn: 'Strawberry', nameVi: 'Dâu tây', category: 'fruit' },
  { id: 'rabbit', nameEn: 'Rabbit', nameVi: 'Con thỏ', category: 'animal' },
];

interface SortMatchGameProps {
  onExit: () => void;
  onStarsAwarded?: (stars: number) => void;
  onNextGame?: () => void;
}

export const SortMatchGame: React.FC<SortMatchGameProps> = ({
  onExit,
  onStarsAwarded,
  onNextGame,
}) => {
  const gameDef = KIDS_GAMES_REGISTRY.find((g) => g.id === 'sort_match') || KIDS_GAMES_REGISTRY[3];

  const TOTAL_ROUNDS = 4;
  const [currentRound, setCurrentRound] = useState(1);
  const [starsEarned, setStarsEarned] = useState(0);

  const [currentItems, setCurrentItems] = useState<SortableItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SortableItem | null>(null);
  const [fruitBasket, setFruitBasket] = useState<SortableItem[]>([]);
  const [animalBarn, setAnimalBarn] = useState<SortableItem[]>([]);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isReadyToContinue, setIsReadyToContinue] = useState(false);
  const [praiseVi, setPraiseVi] = useState('Bé làm rất tốt!');

  // Initialize round
  const initRound = useCallback((roundNum: number) => {
    setFruitBasket([]);
    setAnimalBarn([]);
    setSelectedItem(null);
    setIsReadyToContinue(false);

    const shuffled = [...ALL_SORTABLE_ITEMS].sort(() => Math.random() - 0.5).slice(0, 4);
    setCurrentItems(shuffled);

    // Preload speech for all items in this round
    voiceService.preloadWords(shuffled.map((s) => s.nameEn));
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

  // Drop into target zone
  const handleDropToZone = (zoneCategory: 'fruit' | 'animal') => {
    if (!selectedItem || isReadyToContinue) return;

    if (selectedItem.category === zoneCategory) {
      // CORRECT ZONE!
      soundManager.play('star_burst');
      soundManager.play('pop');
      voiceService.speakWord(selectedItem.nameEn);

      if (zoneCategory === 'fruit') {
        setFruitBasket((prev) => [...prev, selectedItem]);
      } else {
        setAnimalBarn((prev) => [...prev, selectedItem]);
      }

      const remaining = currentItems.filter((i) => i.id !== selectedItem.id);
      setCurrentItems(remaining);
      setSelectedItem(null);

      // Check if all items in current round are sorted
      if (remaining.length === 0) {
        const earned = 2;
        setStarsEarned((prev) => prev + earned);
        if (onStarsAwarded) onStarsAwarded(earned);

        const praiseOptions = [
          'Giỏi quá! Bé đã phân loại chính xác!',
          'Tuyệt vời! Tất cả đã về đúng chỗ!',
          'Bé thông minh quá!',
        ];
        const randomPraise = praiseOptions[Math.floor(Math.random() * praiseOptions.length)];
        setPraiseVi(randomPraise);

        soundManager.play('correct');
        setTimeout(() => {
          voiceService.speakVietnamese(randomPraise);
        }, 300);

        // Fast continue unlock: 500ms
        setTimeout(() => {
          if (currentRound < TOTAL_ROUNDS) {
            setIsReadyToContinue(true);
          } else {
            setIsGameComplete(true);
            soundManager.play('celebration');
          }
        }, 500);
      }
    } else {
      // WRONG ZONE
      soundManager.play('wrong');
      voiceService.speakVietnamese(`Bạn ${selectedItem.nameVi} không thuộc nhóm này rồi!`);
    }
  };

  return (
    <KidsGameWrapper
      game={gameDef}
      currentRound={currentRound}
      totalRounds={TOTAL_ROUNDS}
      starsEarned={starsEarned}
      instructionEn="Sort fruits and animals!"
      instructionVi="Bé hãy chọn hình rồi bấm vào Giỏ Trái Cây hoặc Chuồng Thú nhé!"
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
    >
      <div className="p-4 sm:p-8 flex flex-col items-center justify-between min-h-[420px] bg-gradient-to-b from-amber-50 via-emerald-50 to-white select-none space-y-6">
        {/* Available Items Tray */}
        <div className="flex flex-wrap items-center justify-center gap-3 p-3 rounded-3xl bg-white/90 border-2 border-slate-200 shadow-sm w-full max-w-xl">
          {currentItems.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  soundManager.play('pop');
                  setSelectedItem(item);
                  voiceService.speakWord(item.nameEn);
                }}
                className={`p-2.5 sm:p-3.5 rounded-2xl border-3 flex flex-col items-center justify-center shadow-md cursor-pointer transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-100 scale-110 animate-bounce'
                    : 'border-slate-200 bg-white hover:bg-amber-50 hover:scale-105'
                }`}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
                  <KidsIllustration
                    name={item.id}
                    className="w-full h-full object-contain filter drop-shadow-xs"
                    alt={item.nameEn}
                  />
                </div>
                <span className="text-xs sm:text-sm font-black text-slate-800 mt-1">
                  {item.nameEn}
                </span>
              </button>
            );
          })}
        </div>

        {/* 2 Large Distinct Drop Zones */}
        <div className="grid grid-cols-2 gap-4 sm:gap-8 w-full max-w-2xl">
          {/* Zone 1: Fruit Basket */}
          <div
            onClick={() => handleDropToZone('fruit')}
            className="p-5 sm:p-6 rounded-3xl bg-rose-50/90 border-3 border-rose-300 hover:border-rose-500 shadow-lg flex flex-col items-center justify-between min-h-[180px] cursor-pointer transition-all hover:scale-105"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black text-rose-950">
                Giỏ Trái Cây (Fruits)
              </span>
            </div>

            {/* Placed Fruit Icons */}
            <div className="flex flex-wrap gap-2 justify-center my-auto">
              {fruitBasket.map((f) => (
                <div key={f.id} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center animate-bounce">
                  <KidsIllustration
                    name={f.id}
                    className="w-full h-full object-contain filter drop-shadow-xs"
                    alt={f.nameEn}
                  />
                </div>
              ))}
            </div>

            <span className="text-[11px] font-bold text-rose-700 bg-rose-200/60 px-3 py-1 rounded-full">
              Chạm để thả vào Giỏ
            </span>
          </div>

          {/* Zone 2: Animal Barn */}
          <div
            onClick={() => handleDropToZone('animal')}
            className="p-5 sm:p-6 rounded-3xl bg-emerald-50/90 border-3 border-emerald-300 hover:border-emerald-500 shadow-lg flex flex-col items-center justify-between min-h-[180px] cursor-pointer transition-all hover:scale-105"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black text-emerald-950">
                Chuồng Thú (Animals)
              </span>
            </div>

            {/* Placed Animal Icons */}
            <div className="flex flex-wrap gap-2 justify-center my-auto">
              {animalBarn.map((a) => (
                <div key={a.id} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center animate-bounce">
                  <KidsIllustration
                    name={a.id}
                    className="w-full h-full object-contain filter drop-shadow-xs"
                    alt={a.nameEn}
                  />
                </div>
              ))}
            </div>

            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-200/60 px-3 py-1 rounded-full">
              Chạm để thả vào Chuồng
            </span>
          </div>
        </div>
      </div>
    </KidsGameWrapper>
  );
};
