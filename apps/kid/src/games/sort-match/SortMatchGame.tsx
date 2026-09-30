import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, Sparkles, Check, Move } from 'lucide-react';
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
  { id: 'orange', nameEn: 'Orange', nameVi: 'Quả cam', category: 'fruit' },
  { id: 'rabbit', nameEn: 'Rabbit', nameVi: 'Con thỏ', category: 'animal' },
  { id: 'strawberry', nameEn: 'Strawberry', nameVi: 'Dâu tây', category: 'fruit' },
  { id: 'lion', nameEn: 'Lion', nameVi: 'Sư tử', category: 'animal' },
  { id: 'monkey', nameEn: 'Monkey', nameVi: 'Con khỉ', category: 'animal' },
  { id: 'elephant', nameEn: 'Elephant', nameVi: 'Con voi', category: 'animal' },
  { id: 'tiger', nameEn: 'Tiger', nameVi: 'Con hổ', category: 'animal' },
  { id: 'bear', nameEn: 'Bear', nameVi: 'Con gấu', category: 'animal' },
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
  const [draggedItem, setDraggedItem] = useState<SortableItem | null>(null);
  const [dragOverZone, setDragOverZone] = useState<'fruit' | 'animal' | null>(null);

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
    setDraggedItem(null);
    setDragOverZone(null);
    setIsReadyToContinue(false);

    // Pick 2 fruits and 2 animals for each round
    const fruits = ALL_SORTABLE_ITEMS.filter((i) => i.category === 'fruit').sort(() => Math.random() - 0.5);
    const animals = ALL_SORTABLE_ITEMS.filter((i) => i.category === 'animal').sort(() => Math.random() - 0.5);
    const roundSelection = [...fruits.slice(0, 2), ...animals.slice(0, 2)].sort(() => Math.random() - 0.5);

    setCurrentItems(roundSelection);

    // Preload speech for all items in this round
    voiceService.preloadWords(roundSelection.map((s) => s.nameEn));
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

  // Execute drop logic
  const handleExecuteDrop = (item: SortableItem, zoneCategory: 'fruit' | 'animal') => {
    if (isReadyToContinue) return;

    if (item.category === zoneCategory) {
      // CORRECT ZONE!
      soundManager.play('star_burst');
      soundManager.play('pop');
      voiceService.speakWord(item.nameEn);

      if (zoneCategory === 'fruit') {
        setFruitBasket((prev) => [...prev, item]);
      } else {
        setAnimalBarn((prev) => [...prev, item]);
      }

      const remaining = currentItems.filter((i) => i.id !== item.id);
      setCurrentItems(remaining);
      setSelectedItem(null);
      setDraggedItem(null);
      setDragOverZone(null);

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
      voiceService.speakVietnamese(`Bạn ${item.nameVi} không thuộc nhóm này rồi! Bé thử lại xem!`);
      setSelectedItem(null);
      setDraggedItem(null);
      setDragOverZone(null);
    }
  };

  // Click on drop zone
  const handleClickZone = (zoneCategory: 'fruit' | 'animal') => {
    if (!selectedItem) {
      voiceService.speakVietnamese('Bé hãy chạm vào một hình rồi kéo hoặc chạm vào đây nhé!');
      return;
    }
    handleExecuteDrop(selectedItem, zoneCategory);
  };

  // Touch drag tracking for mobile
  const handleTouchMove = (e: React.TouchEvent, item: SortableItem) => {
    const touch = e.touches[0];
    if (!touch) return;
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const zoneElement = target?.closest('[data-zone]');
    if (zoneElement) {
      const zoneType = zoneElement.getAttribute('data-zone') as 'fruit' | 'animal';
      setDragOverZone(zoneType);
    } else {
      setDragOverZone(null);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, item: SortableItem) => {
    const touch = e.changedTouches[0];
    if (touch) {
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const zoneElement = target?.closest('[data-zone]');
      if (zoneElement) {
        const zoneType = zoneElement.getAttribute('data-zone') as 'fruit' | 'animal';
        handleExecuteDrop(item, zoneType);
      }
    }
    setDraggedItem(null);
    setDragOverZone(null);
  };

  return (
    <KidsGameWrapper
      game={gameDef}
      currentRound={currentRound}
      totalRounds={TOTAL_ROUNDS}
      starsEarned={starsEarned}
      instructionEn="Drag and drop or tap to sort!"
      instructionVi="Bé hãy kéo thả hoặc chạm hình vào Giỏ Trái Cây hoặc Chuồng Thú nhé!"
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
      <div className="p-4 sm:p-8 flex flex-col items-center justify-between min-h-[440px] bg-gradient-to-b from-amber-50 via-emerald-50 to-white select-none space-y-6">
        {/* Available Items Tray */}
        <div className="w-full max-w-xl">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-amber-500" />
              <span>Kéo thả hình hoặc chạm để chọn:</span>
            </span>
            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
              Còn {currentItems.length} hình
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 p-3.5 rounded-3xl bg-white/95 border-2 border-slate-200/90 shadow-sm w-full">
            {currentItems.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              const isDragging = draggedItem?.id === item.id;

              return (
                <div
                  key={item.id}
                  draggable={!isReadyToContinue}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', item.id);
                    setDraggedItem(item);
                    setSelectedItem(item);
                    soundManager.play('pop');
                  }}
                  onDragEnd={() => {
                    setDraggedItem(null);
                    setDragOverZone(null);
                  }}
                  onTouchStart={() => {
                    setDraggedItem(item);
                    setSelectedItem(item);
                    soundManager.play('pop');
                  }}
                  onTouchMove={(e) => handleTouchMove(e, item)}
                  onTouchEnd={(e) => handleTouchEnd(e, item)}
                  onClick={() => {
                    soundManager.play('pop');
                    setSelectedItem(item);
                    voiceService.speakWord(item.nameEn);
                  }}
                  className={`p-2.5 sm:p-3.5 rounded-2xl border-3 flex flex-col items-center justify-center shadow-md cursor-grab active:cursor-grabbing transition-all select-none ${
                    isDragging
                      ? 'opacity-40 scale-95 border-dashed border-amber-400'
                      : isSelected
                      ? 'border-amber-500 bg-amber-100 scale-110 shadow-lg ring-4 ring-amber-300/40'
                      : 'border-slate-200 bg-white hover:bg-amber-50 hover:scale-105'
                  }`}
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center pointer-events-none">
                    <KidsIllustration
                      name={item.id}
                      className="w-full h-full object-contain filter drop-shadow-xs"
                      alt={item.nameEn}
                    />
                  </div>
                  <span className="text-xs sm:text-sm font-black text-slate-800 mt-1 pointer-events-none">
                    {item.nameEn}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold pointer-events-none">
                    {item.nameVi}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2 Large Distinct Drop Zones (Interactive Drag & Drop Targets) */}
        <div className="grid grid-cols-2 gap-4 sm:gap-8 w-full max-w-2xl">
          {/* Zone 1: Fruit Basket */}
          <div
            data-zone="fruit"
            onClick={() => handleClickZone('fruit')}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (dragOverZone !== 'fruit') setDragOverZone('fruit');
            }}
            onDragLeave={(e) => {
              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
              setDragOverZone(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverZone(null);
              const itemId = e.dataTransfer.getData('text/plain');
              const item = currentItems.find((i) => i.id === itemId) || draggedItem || selectedItem;
              if (item) handleExecuteDrop(item, 'fruit');
            }}
            className={`p-5 sm:p-6 rounded-3xl shadow-lg flex flex-col items-center justify-between min-h-[200px] cursor-pointer transition-all duration-200 select-none ${
              dragOverZone === 'fruit'
                ? 'bg-rose-100 border-4 border-rose-500 scale-105 ring-8 ring-rose-300/40 shadow-xl'
                : 'bg-rose-50/95 border-3 border-rose-300 hover:border-rose-400 hover:scale-102'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍎</span>
              <span className="text-sm sm:text-base font-black text-rose-950">
                Giỏ Trái Cây (Fruits)
              </span>
            </div>

            {/* Placed Fruit Icons */}
            <div className="flex flex-wrap gap-2.5 justify-center my-3 min-h-[50px] items-center">
              {fruitBasket.length === 0 ? (
                <span className="text-xs text-rose-400 font-semibold italic">
                  Chưa có trái cây
                </span>
              ) : (
                fruitBasket.map((f) => (
                  <div
                    key={f.id}
                    className="w-11 h-11 sm:w-13 sm:h-13 p-1 rounded-xl bg-white/80 border border-rose-200 shadow-xs flex items-center justify-center animate-bounce"
                    title={f.nameEn}
                  >
                    <KidsIllustration
                      name={f.id}
                      className="w-full h-full object-contain filter drop-shadow-xs"
                      alt={f.nameEn}
                    />
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] font-black px-3.5 py-1 rounded-full transition-all ${
                dragOverZone === 'fruit'
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'text-rose-800 bg-rose-200/80'
              }`}>
                {dragOverZone === 'fruit' ? 'Thả vào đây ngay! ✨' : 'Kéo thả hoặc chạm vào đây'}
              </span>
            </div>
          </div>

          {/* Zone 2: Animal Barn */}
          <div
            data-zone="animal"
            onClick={() => handleClickZone('animal')}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (dragOverZone !== 'animal') setDragOverZone('animal');
            }}
            onDragLeave={(e) => {
              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
              setDragOverZone(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverZone(null);
              const itemId = e.dataTransfer.getData('text/plain');
              const item = currentItems.find((i) => i.id === itemId) || draggedItem || selectedItem;
              if (item) handleExecuteDrop(item, 'animal');
            }}
            className={`p-5 sm:p-6 rounded-3xl shadow-lg flex flex-col items-center justify-between min-h-[200px] cursor-pointer transition-all duration-200 select-none ${
              dragOverZone === 'animal'
                ? 'bg-emerald-100 border-4 border-emerald-500 scale-105 ring-8 ring-emerald-300/40 shadow-xl'
                : 'bg-emerald-50/95 border-3 border-emerald-300 hover:border-emerald-400 hover:scale-102'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐶</span>
              <span className="text-sm sm:text-base font-black text-emerald-950">
                Chuồng Thú (Animals)
              </span>
            </div>

            {/* Placed Animal Icons */}
            <div className="flex flex-wrap gap-2.5 justify-center my-3 min-h-[50px] items-center">
              {animalBarn.length === 0 ? (
                <span className="text-xs text-emerald-400 font-semibold italic">
                  Chưa có động vật
                </span>
              ) : (
                animalBarn.map((a) => (
                  <div
                    key={a.id}
                    className="w-11 h-11 sm:w-13 sm:h-13 p-1 rounded-xl bg-white/80 border border-emerald-200 shadow-xs flex items-center justify-center animate-bounce"
                    title={a.nameEn}
                  >
                    <KidsIllustration
                      name={a.id}
                      className="w-full h-full object-contain filter drop-shadow-xs"
                      alt={a.nameEn}
                    />
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] font-black px-3.5 py-1 rounded-full transition-all ${
                dragOverZone === 'animal'
                  ? 'bg-emerald-600 text-white animate-pulse'
                  : 'text-emerald-800 bg-emerald-200/80'
              }`}>
                {dragOverZone === 'animal' ? 'Thả vào đây ngay! ✨' : 'Kéo thả hoặc chạm vào đây'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </KidsGameWrapper>
  );
};

