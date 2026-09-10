import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import { KidsIcon } from '../assets/icons/KidsIcons';
import { KidsMascot } from '../components/KidsMascot';
import { soundManager } from '../services/sound/KidsSoundManager';
import { speechManager } from '../services/speech/KidsSpeechManager';
import { getKidsProgress, updateKidsProgress } from '../curriculum/curriculumProgress';
import { STICKERS_DATA, BADGES_DATA } from '../data/rewardsData';

interface PlacedItem {
  id: string;
  itemId: string;
  name: string;
  icon: string;
  x: number; // percentage 10-90
  y: number; // percentage 15-85
}

export const KidsMyWorldPage: React.FC = () => {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(getKidsProgress());
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>(() => {
    try {
      const saved = localStorage.getItem('kids_placed_items');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Default starting island items
    return [
      { id: '1', itemId: 'palm-tree', name: 'Palm Tree', icon: '🌴', x: 25, y: 35 },
      { id: '2', itemId: 'lion-cub', name: 'Lion Cub', icon: '🦁', x: 60, y: 55 },
      { id: '3', itemId: 'sun', name: 'Bright Sun', icon: '☀️', x: 80, y: 15 },
    ];
  });

  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('kids_placed_items', JSON.stringify(placedItems));
  }, [placedItems]);

  const handlePlaceItemOnIsland = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedSticker) return;

    const sticker = STICKERS_DATA.find(s => s.id === selectedSticker);
    if (!sticker) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const newItem: PlacedItem = {
      id: Date.now().toString(),
      itemId: sticker.id,
      name: sticker.name,
      icon: sticker.icon,
      x: Math.max(10, Math.min(90, x)),
      y: Math.max(15, Math.min(85, y)),
    };

    soundManager.playPop();
    speechManager.speak(sticker.name);
    setPlacedItems(prev => [...prev, newItem]);
    setSelectedSticker(null);
  };

  const handleTapPlacedItem = (item: PlacedItem, e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playDing();
    speechManager.speak(item.name);
  };

  const handleRemovePlacedItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playPop();
    setPlacedItems(prev => prev.filter(i => i.id !== id));
  };

  const handleResetIsland = () => {
    soundManager.playPop();
    setPlacedItems([]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-fadeIn pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4 text-center md:text-left">
          <KidsMascot mood="happy" size={90} speechText="Build your island!" />
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-black uppercase mb-1">
              <span>🏝️ Sandbox Island</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black">My Wonder Island</h1>
            <p className="text-white/90 text-xs md:text-sm font-medium">Place your unlocked stickers and build a magical world!</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetIsland}
            className="px-4 py-2 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-black text-xs transition-all cursor-pointer backdrop-blur-md"
          >
            Clear Island
          </button>
        </div>
      </div>

      {/* Interactive Island Canvas */}
      <div className="relative">
        {selectedSticker && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-orange-500 text-white font-black text-xs shadow-lg animate-bounce pointer-events-none">
            Tap anywhere on the island to place your sticker!
          </div>
        )}

        <div
          onClick={handlePlaceItemOnIsland}
          className={`relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-3xl overflow-hidden border-4 border-emerald-300 shadow-xl cursor-crosshair select-none bg-gradient-to-b from-sky-200 via-emerald-100 to-emerald-200`}
        >
          {/* Island Landmass Shapes */}
          <div className="absolute inset-x-8 bottom-4 top-16 bg-gradient-to-b from-emerald-300 to-emerald-400 rounded-[60px] shadow-inner opacity-90 border-4 border-emerald-400/50" />
          <div className="absolute inset-x-16 bottom-10 top-28 bg-emerald-200/60 rounded-[45px]" />
          {/* Decorative Pond */}
          <div className="absolute right-20 bottom-16 w-32 h-20 bg-sky-300 rounded-full border-2 border-sky-400/50 shadow-inner flex items-center justify-center text-xl">
            🦆
          </div>

          {/* Placed Stickers on the Island */}
          {placedItems.map(item => (
            <div
              key={item.id}
              onClick={(e) => handleTapPlacedItem(item, e)}
              style={{ left: `${item.x}%`, top: `${item.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer hover:scale-125 transition-transform duration-200"
            >
              <div className="text-4xl md:text-5xl filter drop-shadow-md animate-wiggle">
                {item.icon}
              </div>
              {/* Tooltip & remove badge on hover */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1 bg-slate-900/80 text-white text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap z-20">
                <span>{item.name}</span>
                <button
                  onClick={(e) => handleRemovePlacedItem(item.id, e)}
                  className="hover:text-red-400 ml-1 font-bold"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stickers Toolbox Drawer */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border-2 border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎒</span>
            <h2 className="font-extrabold text-slate-800 text-base md:text-lg">Your Sticker Backpack</h2>
          </div>
          <span className="text-xs font-bold text-slate-600">Select a sticker to place</span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {STICKERS_DATA.map(sticker => {
            const isSelected = selectedSticker === sticker.id;
            return (
              <button
                key={sticker.id}
                onClick={() => {
                  soundManager.playPop();
                  setSelectedSticker(isSelected ? null : sticker.id);
                  speechManager.speak(sticker.name);
                }}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-100 border-amber-400 scale-108 shadow-md ring-2 ring-amber-300'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <span className="text-3xl">{sticker.icon}</span>
                <span className="text-[11px] font-bold text-slate-700 truncate w-full text-center">
                  {sticker.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Badges Showcase */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border-2 border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <h2 className="font-extrabold text-slate-800 text-base md:text-lg">Trophy Hall</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {BADGES_DATA.map(badge => {
            const isUnlocked = progress.badges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center text-center transition-all ${
                  isUnlocked
                    ? 'bg-amber-50/60 border-amber-200 shadow-sm'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-2 ${
                  isUnlocked ? 'bg-amber-100' : 'bg-slate-200 grayscale'
                }`}>
                  {badge.icon}
                </div>
                <h3 className="font-extrabold text-slate-800 text-xs md:text-sm">{badge.title}</h3>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">{badge.description}</p>
                <span className="mt-2 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                  {isUnlocked ? 'Unlocked ✨' : 'Locked 🔒'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
