import React, { useState, useEffect } from 'react';
import { KidsIcon } from '../assets/icons/KidsIcons';
import { KidsMascot } from '../components/KidsMascot';
import { soundManager } from '../services/sound/KidsSoundManager';
import { kidsSpeech } from '../services/speech/KidsSpeechManager';
import { celebrationManager } from '../services/celebration/CelebrationManager';
import { getKidsProgress } from '../curriculum/curriculumProgress';
import { STICKERS_DATA, BADGES_DATA } from '../data/rewardsData';

interface WordEntry {
  word: string;
  vi: string;
  emoji: string;
  category: string;
  phrase: string;
  sentence: string;
  stage: 'sprout' | 'plant' | 'tree';
}

const EXTENDED_VOCAB: WordEntry[] = [
  {
    word: 'Lion',
    vi: 'Con sư tử',
    emoji: '🦁',
    category: 'animals',
    phrase: 'golden lion',
    sentence: 'The golden lion can roar!',
    stage: 'tree',
  },
  {
    word: 'Elephant',
    vi: 'Con voi',
    emoji: '🐘',
    category: 'animals',
    phrase: 'big elephant',
    sentence: 'The elephant has a long trunk.',
    stage: 'tree',
  },
  {
    word: 'Monkey',
    vi: 'Con khỉ',
    emoji: '🐒',
    category: 'animals',
    phrase: 'playful monkey',
    sentence: 'The monkey loves eating bananas.',
    stage: 'plant',
  },
  {
    word: 'Cat',
    vi: 'Con mèo',
    emoji: '🐱',
    category: 'animals',
    phrase: 'cute cat',
    sentence: 'The little cat says meow.',
    stage: 'tree',
  },
  {
    word: 'Dog',
    vi: 'Con chó',
    emoji: '🐶',
    category: 'animals',
    phrase: 'friendly dog',
    sentence: 'The dog wags its tail.',
    stage: 'tree',
  },
  {
    word: 'Apple',
    vi: 'Quả táo',
    emoji: '🍎',
    category: 'food',
    phrase: 'sweet red apple',
    sentence: 'I like to eat sweet apples.',
    stage: 'tree',
  },
  {
    word: 'Banana',
    vi: 'Quả chuối',
    emoji: '🍌',
    category: 'food',
    phrase: 'yellow banana',
    sentence: 'The yellow banana is delicious.',
    stage: 'plant',
  },
  {
    word: 'Orange',
    vi: 'Quả cam',
    emoji: '🍊',
    category: 'food',
    phrase: 'juicy orange',
    sentence: 'Oranges have lots of vitamin C.',
    stage: 'sprout',
  },
  {
    word: 'Red',
    vi: 'Màu đỏ',
    emoji: '🔴',
    category: 'colors',
    phrase: 'bright red ball',
    sentence: 'The shiny balloon is red.',
    stage: 'tree',
  },
  {
    word: 'Blue',
    vi: 'Màu xanh dương',
    emoji: '🔵',
    category: 'colors',
    phrase: 'clear blue sky',
    sentence: 'The ocean is deep blue.',
    stage: 'plant',
  },
  {
    word: 'One',
    vi: 'Số một',
    emoji: '1️⃣',
    category: 'numbers',
    phrase: 'one happy puppy',
    sentence: 'I see one big sunny face.',
    stage: 'tree',
  },
  {
    word: 'Two',
    vi: 'Số hai',
    emoji: '2️⃣',
    category: 'numbers',
    phrase: 'two little eyes',
    sentence: 'Two eyes can see bright colors.',
    stage: 'plant',
  },
  {
    word: 'Car',
    vi: 'Xe ô tô',
    emoji: '🚗',
    category: 'vehicles',
    phrase: 'speedy car',
    sentence: 'The red car goes vroom!',
    stage: 'sprout',
  },
  {
    word: 'Train',
    vi: 'Đoàn tàu',
    emoji: '🚂',
    category: 'vehicles',
    phrase: 'chugging train',
    sentence: 'The train rolls on the tracks.',
    stage: 'plant',
  },
  {
    word: 'Star',
    vi: 'Ngôi sao',
    emoji: '⭐',
    category: 'nature',
    phrase: 'twinkling star',
    sentence: 'Look at the twinkling star tonight.',
    stage: 'tree',
  },
  {
    word: 'Sun',
    vi: 'Mặt trời',
    emoji: '☀️',
    category: 'nature',
    phrase: 'warm yellow sun',
    sentence: 'The sun rises in the morning.',
    stage: 'tree',
  },
  {
    word: 'Dolphin',
    vi: 'Cá heo',
    emoji: '🐬',
    category: 'ocean',
    phrase: 'playful blue dolphin',
    sentence: 'The dolphin leaps high above the waves.',
    stage: 'plant',
  },
  {
    word: 'Whale',
    vi: 'Cá voi',
    emoji: '🐋',
    category: 'ocean',
    phrase: 'giant gentle whale',
    sentence: 'The blue whale swims in the ocean.',
    stage: 'tree',
  },
  {
    word: 'Rocket',
    vi: 'Tên lửa',
    emoji: '🚀',
    category: 'space',
    phrase: 'shiny space rocket',
    sentence: 'The rocket flies fast into outer space.',
    stage: 'sprout',
  },
  {
    word: 'Moon',
    vi: 'Mặt trăng',
    emoji: '🌙',
    category: 'space',
    phrase: 'bright silver moon',
    sentence: 'The moon glows beautifully in the night sky.',
    stage: 'tree',
  },
  {
    word: 'Dinosaur',
    vi: 'Khủng long',
    emoji: '🦖',
    category: 'dinosaurs',
    phrase: 'friendly green dinosaur',
    sentence: 'The dinosaur loves to stomp and roar.',
    stage: 'plant',
  },
  {
    word: 'Baby',
    vi: 'Em bé',
    emoji: '👶',
    category: 'family',
    phrase: 'cute happy baby',
    sentence: 'The little baby smiles at mommy.',
    stage: 'tree',
  },
];

interface PlacedItem {
  id: string;
  itemId: string;
  name: string;
  icon: string;
  x: number;
  y: number;
}

export const KidsMyWorldPage: React.FC = () => {
  const [progress] = useState(getKidsProgress());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'garden' | 'island' | 'badges'>('garden');

  const [placedItems, setPlacedItems] = useState<PlacedItem[]>(() => {
    try {
      const saved = localStorage.getItem('kids_placed_items');
      if (saved) return JSON.parse(saved);
    } catch {}
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
    const sticker = STICKERS_DATA.find((s) => s.id === selectedSticker);
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
    kidsSpeech.speak(sticker.name);
    setPlacedItems((prev) => [...prev, newItem]);
    setSelectedSticker(null);
  };

  const handleTapPlacedItem = (item: PlacedItem, e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playDing();
    kidsSpeech.speak(item.name);
  };

  const handleRemovePlacedItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playPop();
    setPlacedItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Filtered vocabulary
  const filteredWords = EXTENDED_VOCAB.filter((item) => {
    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchStage = selectedStage === 'all' || item.stage === selectedStage;
    return matchCat && matchStage;
  });

  const categoryPills = [
    { id: 'all', label: 'Tất cả', icon: '🌟' },
    { id: 'animals', label: 'Động vật', icon: '🦁' },
    { id: 'food', label: 'Đồ ăn', icon: '🍎' },
    { id: 'colors', label: 'Màu sắc', icon: '🎨' },
    { id: 'numbers', label: 'Số đếm', icon: '🔢' },
    { id: 'ocean', label: 'Đại dương', icon: '🌊' },
    { id: 'space', label: 'Vũ trụ', icon: '🚀' },
    { id: 'dinosaurs', label: 'Khủng long', icon: '🦖' },
    { id: 'family', label: 'Gia đình', icon: '👶' },
    { id: 'vehicles', label: 'Phương tiện', icon: '🚗' },
    { id: 'nature', label: 'Thiên nhiên', icon: '☀️' },
  ];

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6 md:space-y-8 animate-fadeIn pb-24">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 border-3 border-emerald-400">
        <div className="flex items-center gap-4 text-center md:text-left">
          <KidsMascot mood="happy" size={90} speechText="Khám phá từ vựng cùng mình!" />
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-black uppercase mb-1 border border-white/30">
              <span>🏝️ Thế Giới Của Bé</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Thế Giới Từ Vựng & Đảo Diệu Kỳ</h1>
            <p className="text-emerald-100 text-xs sm:text-sm font-bold mt-0.5">
              Tra cứu từ, nghe cụm từ, luyện câu hoàn chỉnh và chăm sóc vườn cây từ vựng!
            </p>
          </div>
        </div>

        {/* 3 Main Mode Switcher */}
        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md p-1.5 rounded-2xl border border-white/30">
          <button
            onClick={() => setActiveTab('garden')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
              activeTab === 'garden'
                ? 'bg-white text-slate-950'
                : 'text-white hover:bg-white/20'
            }`}
          >
            🌱 Vườn Từ Vựng
          </button>
          <button
            onClick={() => setActiveTab('island')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
              activeTab === 'island'
                ? 'bg-white text-slate-950'
                : 'text-white hover:bg-white/20'
            }`}
          >
            🏝️ Hòn Đảo Của Bé
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
              activeTab === 'badges'
                ? 'bg-white text-slate-950'
                : 'text-white hover:bg-white/20'
            }`}
          >
            🏆 Huy Hiệu
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* TAB 1: WORD WORLD & WORD GARDEN                                  */}
      {/* ================================================================ */}
      {activeTab === 'garden' && (
        <div className="space-y-6">
          {/* Category Scroller */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categoryPills.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-2xl font-black text-xs flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer border-2 ${
                  selectedCategory === cat.id
                    ? 'bg-amber-400 text-slate-950 border-amber-500 scale-102'
                    : 'kids-liquid-card text-slate-800 border-slate-200 hover:bg-amber-50'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Growth Stage Filter */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs font-black uppercase tracking-wider text-slate-700">
              Giai đoạn sinh trưởng ({filteredWords.length} từ vựng):
            </p>
            <div className="flex items-center gap-1.5">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'sprout', label: '🌱 Mầm non' },
                { id: 'plant', label: '🌿 Cây con' },
                { id: 'tree', label: '🌳 Đại thụ' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStage(st.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer border ${
                    selectedStage === st.id
                      ? 'bg-emerald-500 text-white border-emerald-600'
                      : 'kids-liquid-card text-slate-700 border-slate-300 hover:bg-emerald-50'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Expanded Vocabulary Cards (Word -> Phrase -> Sentence -> Voice Replay) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWords.map((item) => {
              const stageBadge =
                item.stage === 'tree'
                  ? { label: '🌳 Đại thụ', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' }
                  : item.stage === 'plant'
                  ? { label: '🌿 Cây con', color: 'bg-teal-100 text-teal-900 border-teal-300' }
                  : { label: '🌱 Mầm non', color: 'bg-amber-100 text-amber-900 border-amber-300' };

              return (
                <div
                  key={item.word}
                  className="kids-liquid-card p-5 rounded-3xl border-3 border-amber-300 hover:border-emerald-400 flex flex-col justify-between space-y-3 transition-all group"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="text-5xl group-hover:scale-110 transition-transform">
                        {item.emoji}
                      </span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${stageBadge.color}`}>
                        {stageBadge.label}
                      </span>
                    </div>

                    <div className="mt-2">
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-black text-slate-950 uppercase">{item.word}</h3>
                        <span className="text-xs font-bold text-emerald-800">({item.vi})</span>
                      </div>
                      <p className="text-xs font-bold text-indigo-700 mt-1">
                        👉 Cụm từ: <span className="font-black italic">"{item.phrase}"</span>
                      </p>
                      <p className="text-xs font-bold text-slate-700 mt-0.5">
                        💬 Câu: <span className="font-extrabold italic">"{item.sentence}"</span>
                      </p>
                    </div>
                  </div>

                  {/* Audio Controls Bar (Listen, Speak, Sentence, Replay Slow) */}
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-1">
                    <button
                      onClick={() => {
                        soundManager.playDing();
                        kidsSpeech.speakBilingual(item.word, item.vi);
                      }}
                      className="flex-1 py-1.5 px-1.5 rounded-xl bg-sky-100 hover:bg-sky-200 text-slate-950 text-xs font-black flex items-center justify-center gap-0.5 border border-sky-300 cursor-pointer"
                      title="Nghe phát âm từ vựng"
                    >
                      <span>🔊 Từ</span>
                    </button>

                    <button
                      onClick={() => {
                        soundManager.playPop();
                        kidsSpeech.speak(item.word, { rate: 0.65 });
                      }}
                      className="flex-1 py-1.5 px-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-slate-950 text-xs font-black flex items-center justify-center gap-0.5 border border-purple-300 cursor-pointer"
                      title="Nghe phát âm chậm rãi"
                    >
                      <span>🔁 Chậm</span>
                    </button>

                    <button
                      onClick={() => {
                        soundManager.playPop();
                        kidsSpeech.speak(item.sentence);
                      }}
                      className="flex-1 py-1.5 px-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-slate-950 text-xs font-black flex items-center justify-center gap-0.5 border border-emerald-300 cursor-pointer"
                      title="Nghe toàn bộ câu"
                    >
                      <span>💬 Câu</span>
                    </button>

                    <button
                      onClick={() => {
                        celebrationManager.speakPraise('Bé hãy đọc theo mẫu nhé!');
                        kidsSpeech.speak(item.word);
                      }}
                      className="flex-1 py-1.5 px-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-slate-950 text-xs font-black flex items-center justify-center gap-0.5 border border-amber-300 cursor-pointer"
                      title="Luyện đọc lại"
                    >
                      <span>🎙️ Luyện</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 2: MY ISLAND (INTERACTIVE STICKER MAP)                       */}
      {/* ================================================================ */}
      {activeTab === 'island' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-950">Vương Quốc Thu Nhỏ Của Bé</h2>
            <button
              onClick={() => setPlacedItems([])}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
            >
              🧹 Dọn dẹp đảo
            </button>
          </div>

          {/* Island Canvas */}
          <div
            onClick={handlePlaceItemOnIsland}
            className={`relative w-full h-[380px] sm:h-[460px] rounded-3xl bg-gradient-to-b from-sky-200 via-teal-100 to-emerald-200 border-4 border-teal-400 overflow-hidden cursor-crosshair select-none ${
              selectedSticker ? 'ring-4 ring-amber-400 animate-pulse' : ''
            }`}
          >
            {/* Soft Ocean waves */}
            <div className="absolute inset-0 pointer-events-none opacity-25">
              <div className="absolute top-10 left-10 text-3xl">🌊</div>
              <div className="absolute bottom-10 right-10 text-3xl">🌊</div>
              <div className="absolute top-1/2 right-20 text-3xl">🐬</div>
            </div>

            {/* Central Sandy Island Ground */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-3/5 rounded-[60px] bg-gradient-to-tr from-amber-100 via-amber-50 to-emerald-50 border-4 border-amber-300/80" />

            {/* Placed Items */}
            {placedItems.map((item) => (
              <div
                key={item.id}
                onClick={(e) => handleTapPlacedItem(item, e)}
                style={{ left: `${item.x}%`, top: `${item.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer hover:scale-125 active:scale-95 transition-all z-10"
              >
                <span className="text-5xl sm:text-6xl animate-bounce" style={{ animationDuration: '2.5s' }}>
                  {item.icon}
                </span>
                <span className="text-[10px] font-black bg-white/90 text-slate-950 px-2 py-0.5 rounded-full border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.name}
                </span>
                <button
                  onClick={(e) => handleRemovePlacedItem(item.id, e)}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Sticker Tray */}
          <div className="kids-liquid-card p-4 rounded-3xl border-3 border-amber-300 space-y-2">
            <p className="text-xs font-black uppercase text-slate-700">
              Chọn hình dán rồi chạm lên đảo để trang trí:
            </p>
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {STICKERS_DATA.map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    soundManager.playPop();
                    setSelectedSticker(st.id);
                  }}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center min-w-[75px] transition cursor-pointer ${
                    selectedSticker === st.id
                      ? 'bg-amber-200 border-amber-500 scale-105'
                      : 'bg-white border-slate-200 hover:border-amber-300'
                  }`}
                >
                  <span className="text-4xl">{st.icon}</span>
                  <span className="text-[10px] font-bold text-slate-800 mt-1 truncate max-w-[65px]">
                    {st.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 3: BADGES SHOWCASE                                           */}
      {/* ================================================================ */}
      {activeTab === 'badges' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <h2 className="font-black text-slate-950 text-lg">Phòng Trưng Bày Huy Hiệu Vinh Quang</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {BADGES_DATA.map((badge) => {
              const isUnlocked = (progress.badges || []).includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-3xl border-3 flex flex-col items-center text-center transition-all ${
                    isUnlocked
                      ? 'kids-liquid-amber border-amber-400'
                      : 'bg-slate-100/80 border-slate-300 opacity-60'
                  }`}
                >
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mb-2 bg-white/90 border border-slate-200">
                    {badge.icon}
                  </div>
                  <h3 className="font-black text-slate-950 text-sm">{badge.title}</h3>
                  <p className="text-[11px] text-slate-600 font-bold mt-1">{badge.description}</p>
                  <span className="mt-3 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-800">
                    {isUnlocked ? 'Đã Đạt ✨' : 'Chưa Mở 🔒'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default KidsMyWorldPage;
