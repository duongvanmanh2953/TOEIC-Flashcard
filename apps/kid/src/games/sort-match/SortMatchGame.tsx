import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, Sparkles, Check, Move, ArrowRight, Heart } from 'lucide-react';
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
      soundManager.play('correct');
      soundManager.play('pop');

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

      // Voice praise
      voiceService.speakWord(item.nameEn);

      if (remaining.length === 0) {
        // ALL ITEMS SORTED!
        soundManager.play('star_burst');
        const earned = 3;
        setStarsEarned((prev) => prev + earned);
        if (onStarsAwarded) onStarsAwarded(earned);

        const praise = 'Tuyệt vời! Bé đã phân loại chính xác tất cả!';
        setPraiseVi(praise);
        setTimeout(() => {
          voiceService.speakVietnamese(praise);
          setIsReadyToContinue(true);
        }, 500);
      }
    } else {
      // WRONG ZONE!
      soundManager.play('wrong');
      voiceService.speakVietnamese(
        item.category === 'fruit'
          ? `${item.nameVi} là trái cây, hãy bỏ vào giỏ nhé!`
          : `${item.nameVi} là bạn động vật, hãy đưa vào chuồng nhé!`
      );
      setDragOverZone(null);
    }
  };

  const handleClickZone = (zoneCategory: 'fruit' | 'animal') => {
    if (selectedItem) {
      handleExecuteDrop(selectedItem, zoneCategory);
    }
  };

  const handleTouchMove = (e: React.TouchEvent, item: SortableItem) => {
    const touch = e.touches[0];
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
      instructionEn="Drag or tap items into the correct home!"
      instructionVi="Bé hãy kéo thả hoặc chạm hình vào Giỏ Trái Cây hoặc Nông Trại Động Vật nhé!"
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
      <div className="relative w-full h-full p-4 sm:p-6 flex flex-col items-center justify-between min-h-[440px] bg-gradient-to-b from-[#FEF9E7] via-[#F0FDF4] to-[#DCFCE7] select-none space-y-4 overflow-hidden">
        
        {/* Soft Sunny Decor */}
        <div className="absolute top-2 left-6 text-2xl opacity-60 pointer-events-none">🌻</div>
        <div className="absolute top-4 right-10 text-2xl opacity-60 pointer-events-none">🌾</div>

        {/* Available Items Tray (3D Toy Tiles) */}
        <div className="w-full max-w-xl z-10">
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-amber-500" />
              <span>Chạm hoặc kéo vật thể vào đúng nơi:</span>
            </span>
            <span className="text-xs font-black text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-0.5 rounded-full">
              Còn {currentItems.length} hình
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 p-3 rounded-[24px] bg-white/95 border-3 border-emerald-200 shadow-md w-full min-h-[96px]">
            {currentItems.length === 0 ? (
              <div className="flex items-center gap-2 text-emerald-600 font-black text-sm animate-bounce">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Đã xếp xong tất cả! Giỏi quá!</span>
              </div>
            ) : (
              currentItems.map((item) => {
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
                    className={`p-2 sm:p-2.5 rounded-2xl border-3 flex flex-col items-center justify-center shadow-md cursor-grab active:cursor-grabbing transition-all select-none ${
                      isDragging
                        ? 'opacity-40 scale-95 border-dashed border-amber-400'
                        : isSelected
                        ? 'border-amber-500 bg-amber-100 scale-110 shadow-lg ring-4 ring-amber-300/40 -translate-y-1'
                        : 'border-slate-200 bg-white hover:bg-amber-50 hover:scale-105 hover:-translate-y-0.5'
                    }`}
                    style={{ borderBottomWidth: '5px' }}
                  >
                    <div className="w-13 h-13 sm:w-16 sm:h-16 flex items-center justify-center pointer-events-none">
                      <KidsIllustration
                        name={item.id}
                        className="w-full h-full object-contain filter drop-shadow-xs"
                        alt={item.nameEn}
                      />
                    </div>
                    <span className="text-xs sm:text-sm font-black text-slate-900 mt-0.5 pointer-events-none">
                      {item.nameEn}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold pointer-events-none">
                      {item.nameVi}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 2 Custom Illustrated Drop Targets: Wicker Fruit Basket & Farm Animal Barn */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-2xl z-10">
          
          {/* Target 1: Woven Fruit Basket (Illustrated) */}
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
            className={`relative p-4 sm:p-5 rounded-[28px] shadow-lg flex flex-col items-center justify-between min-h-[190px] cursor-pointer transition-all duration-200 select-none overflow-hidden border-4 ${
              dragOverZone === 'fruit'
                ? 'bg-rose-100 border-rose-500 scale-105 ring-6 ring-rose-300/50 shadow-xl'
                : 'bg-gradient-to-b from-[#FFF5F5] to-[#FFEBEB] border-rose-300/90 hover:border-rose-400 hover:scale-102'
            }`}
          >
            {/* Basket Handle Arch */}
            <div className="w-20 h-4 border-t-4 border-amber-800/40 rounded-t-full -mt-2 mb-1" />

            {/* Title Badge */}
            <div className="px-3.5 py-1 rounded-full bg-rose-500 text-white font-black text-xs sm:text-sm shadow-sm flex items-center gap-1.5 border border-rose-600">
              <span>🍎 Giỏ Trái Cây</span>
            </div>

            {/* Placed Fruit Icons */}
            <div className="flex flex-wrap gap-2 justify-center my-2 min-h-[50px] items-center">
              {fruitBasket.length === 0 ? (
                <div className="flex flex-col items-center opacity-60">
                  <span className="text-3xl">🧺</span>
                  <span className="text-[11px] text-rose-500 font-bold mt-0.5">
                    Đang trống
                  </span>
                </div>
              ) : (
                fruitBasket.map((f) => (
                  <div
                    key={f.id}
                    className="w-10 h-10 sm:w-12 sm:h-12 p-1 rounded-2xl bg-white/95 border-2 border-rose-200 shadow-xs flex items-center justify-center animate-bounce"
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

            {/* Bottom Status Callout */}
            <span className={`text-[10px] sm:text-[11px] font-black px-3 py-1 rounded-full transition-all text-center ${
              dragOverZone === 'fruit'
                ? 'bg-rose-600 text-white animate-pulse'
                : 'text-rose-900 bg-rose-200/80 border border-rose-300'
            }`}>
              {dragOverZone === 'fruit' ? 'Thả vào giỏ ngay! ✨' : 'Thả trái cây vào đây'}
            </span>
          </div>

          {/* Target 2: Farm Animal Barn (Illustrated) */}
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
            className={`relative p-4 sm:p-5 rounded-[28px] shadow-lg flex flex-col items-center justify-between min-h-[190px] cursor-pointer transition-all duration-200 select-none overflow-hidden border-4 ${
              dragOverZone === 'animal'
                ? 'bg-emerald-100 border-emerald-500 scale-105 ring-6 ring-emerald-300/50 shadow-xl'
                : 'bg-gradient-to-b from-[#F0FDF4] to-[#DCFCE7] border-emerald-300/90 hover:border-emerald-400 hover:scale-102'
            }`}
          >
            {/* Barn Roof Gable */}
            <div className="w-20 h-4 border-t-4 border-emerald-800/40 rounded-t-full -mt-2 mb-1" />

            {/* Title Badge */}
            <div className="px-3.5 py-1 rounded-full bg-emerald-600 text-white font-black text-xs sm:text-sm shadow-sm flex items-center gap-1.5 border border-emerald-700">
              <span>🐾 Nông Trại Thú</span>
            </div>

            {/* Placed Animal Icons */}
            <div className="flex flex-wrap gap-2 justify-center my-2 min-h-[50px] items-center">
              {animalBarn.length === 0 ? (
                <div className="flex flex-col items-center opacity-60">
                  <span className="text-3xl">🏡</span>
                  <span className="text-[11px] text-emerald-600 font-bold mt-0.5">
                    Đang trống
                  </span>
                </div>
              ) : (
                animalBarn.map((a) => (
                  <div
                    key={a.id}
                    className="w-10 h-10 sm:w-12 sm:h-12 p-1 rounded-2xl bg-white/95 border-2 border-emerald-200 shadow-xs flex items-center justify-center animate-bounce"
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

            {/* Bottom Status Callout */}
            <span className={`text-[10px] sm:text-[11px] font-black px-3 py-1 rounded-full transition-all text-center ${
              dragOverZone === 'animal'
                ? 'bg-emerald-600 text-white animate-pulse'
                : 'text-emerald-900 bg-emerald-200/80 border border-emerald-300'
            }`}>
              {dragOverZone === 'animal' ? 'Đưa vào nông trại ngay! ✨' : 'Thả động vật vào đây'}
            </span>
          </div>
        </div>

        {/* Footer Guidance */}
        <div className="text-[11px] font-bold text-emerald-900 bg-white/80 px-4 py-1 rounded-full border border-emerald-300 shadow-2xs">
          🧺 Phân loại đúng giúp bé rèn luyện tư duy logic và nhớ từ vựng lâu hơn!
        </div>
      </div>
    </KidsGameWrapper>
  );
};
