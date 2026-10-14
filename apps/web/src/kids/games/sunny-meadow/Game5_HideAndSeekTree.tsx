import React, { useState, useEffect } from 'react';
import { MeadowAudioEngine } from '../../services/audio/MeadowAudioEngine';
import { meadowStore } from '../../core/meadowStateStore';

interface Game5Props {
  onExit: () => void;
  onComplete?: () => void;
}

type HideLocation = 'on_tree' | 'in_hollow' | 'under_mushroom' | 'behind_bush';

interface HideSeekRound {
  targetLocation: HideLocation;
  preposition: string;
  locationNameEn: string;
  speechText: string;
  subTitleVi: string;
}

const ROUNDS: HideSeekRound[] = [
  {
    targetLocation: 'under_mushroom',
    preposition: 'UNDER',
    locationNameEn: 'the red mushroom',
    speechText: 'Where is the bunny? Find the bunny UNDER the red mushroom!',
    subTitleVi: 'Bé hãy tìm bạn Thỏ đang trốn Ở DƯỚI (Under) cây nấm đỏ nhé!',
  },
  {
    targetLocation: 'in_hollow',
    preposition: 'IN',
    locationNameEn: 'the tree hollow',
    speechText: 'Peek-a-boo! Find the bunny IN the tree hollow!',
    subTitleVi: 'Bé hãy tìm bạn Thỏ đang trốn Ở TRONG (In) hốc cây nhé!',
  },
  {
    targetLocation: 'on_tree',
    preposition: 'ON',
    locationNameEn: 'the tree branch',
    speechText: 'Look up high! Find the bunny ON the tree branch!',
    subTitleVi: 'Bé hãy tìm bạn Thỏ đang trốn Ở TRÊN (On) cành cây nhé!',
  },
  {
    targetLocation: 'behind_bush',
    preposition: 'BEHIND',
    locationNameEn: 'the flower bush',
    speechText: 'Where is the bunny? Find the bunny BEHIND the flower bush!',
    subTitleVi: 'Bé hãy tìm bạn Thỏ đang trốn Ở ĐẰNG SAU (Behind) bụi hoa nhé!',
  },
];

export const Game5_HideAndSeekTree: React.FC<Game5Props> = ({ onExit, onComplete }) => {
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [revealedSpot, setRevealedSpot] = useState<HideLocation | null>(null);
  const [isSuccessPeekaboo, setIsSuccessPeekaboo] = useState(false);
  const [showVictory, setShowVictory] = useState(false);

  const round = ROUNDS[currentRoundIdx];

  useEffect(() => {
    setRevealedSpot(null);
    setIsSuccessPeekaboo(false);

    const timer = setTimeout(() => {
      MeadowAudioEngine.speak(round.speechText);
    }, 450);
    return () => clearTimeout(timer);
  }, [currentRoundIdx]);

  const handleTapLocation = (loc: HideLocation) => {
    if (isSuccessPeekaboo || showVictory) return;

    if (loc === round.targetLocation) {
      // Found the bunny!
      setRevealedSpot(loc);
      setIsSuccessPeekaboo(true);
      MeadowAudioEngine.playWoodTap('G5');

      setTimeout(() => {
        MeadowAudioEngine.playMagicalSuccess();
        MeadowAudioEngine.speak(`Peek-a-boo! I am ${round.preposition} ${round.locationNameEn}!`);
        meadowStore.addStars(10);
        meadowStore.unlockSticker('red-mushroom');

        setTimeout(() => {
          if (currentRoundIdx < ROUNDS.length - 1) {
            setCurrentRoundIdx((prev) => prev + 1);
          } else {
            setShowVictory(true);
            meadowStore.recordGameRound('hideAndSeek', 30);
            if (onComplete) onComplete();
          }
        }, 2400);
      }, 300);
    } else {
      // Gentle hint (Zero-punishment)
      setRevealedSpot(loc);
      MeadowAudioEngine.playSoftBounce();
      MeadowAudioEngine.speak(
        `Nobody here! Let us look ${round.preposition} ${round.locationNameEn}!`,
        { rate: 0.85 }
      );
      setTimeout(() => {
        setRevealedSpot(null);
      }, 1200);
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
          className="toy-btn toy-btn-green !min-h-[50px] !py-2 !px-4 text-base"
        >
          ← Trở Về Khu Rừng
        </button>

        <div className="px-4 py-2 rounded-2xl bg-emerald-100 border-2 border-emerald-300 font-display font-extrabold text-emerald-900 text-sm flex items-center gap-1.5 shadow-sm">
          <svg className="w-5 h-5"><use href="#svg-star-badge"></use></svg>
          <span>Vòng {currentRoundIdx + 1} / {ROUNDS.length}</span>
        </div>
      </div>

      {/* 2. Main Stage Card */}
      <div className="meadow-clay-card w-full p-6 sm:p-8 bg-gradient-to-b from-[#D8F3FF] via-[#FFFDF5] to-[#80ED99]/40 relative overflow-hidden">
        {/* Audio Prompt Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white/95 p-4 rounded-3xl border-2 border-white shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => MeadowAudioEngine.speak(round.speechText)}
              className="toy-btn toy-btn-green w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              aria-label="Nghe câu hỏi trốn tìm"
              title="Nghe lại câu hỏi"
            >
              🌳
            </button>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full font-display">
                🐰 Trò Chơi 5 • Trốn Tìm Quanh Cây Cổ Thụ
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-800 mt-1 font-display leading-tight">
                "Find the bunny <span className="text-emerald-700 underline">{round.preposition}</span> {round.locationNameEn}!"
              </h2>
              <p className="text-xs sm:text-sm font-bold text-slate-500 font-body">
                ({round.subTitleVi})
              </p>
            </div>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-emerald-50 border-2 border-emerald-300 font-display font-extrabold text-emerald-800 text-lg">
            Giới từ: <span className="text-rose-600 font-extrabold text-2xl">{round.preposition}</span>
          </div>
        </div>

        {/* 3. Multi-layer Woodland Diorama Stage */}
        <div className="relative min-h-[380px] sm:min-h-[420px] rounded-3xl bg-gradient-to-b from-sky-200 via-emerald-50 to-emerald-200/90 border-2 border-emerald-300 p-6 overflow-hidden flex items-end justify-between">
          {/* A. LOCATION 1: ON the tree branch (Top Left) */}
          <div
            onClick={() => handleTapLocation('on_tree')}
            className="absolute top-6 left-12 cursor-pointer transition-transform hover:scale-105 active:scale-95 group z-10"
            title="ON the tree branch"
          >
            <div className="relative flex flex-col items-center">
              {/* Twitching bunny ears cue if hidden here */}
              {round.targetLocation === 'on_tree' && !revealedSpot && (
                <div className="text-2xl animate-bounce">🐰</div>
              )}
              {revealedSpot === 'on_tree' && isSuccessPeekaboo && (
                <div className="w-20 h-20 animate-bounce">
                  <svg className="w-full h-full drop-shadow-md">
                    <use href="#svg-chubby-bunny"></use>
                  </svg>
                </div>
              )}
              <span className="px-3 py-1 rounded-full bg-white/90 text-emerald-900 border border-emerald-300 font-display font-extrabold text-xs shadow-xs mt-1">
                ON the tree
              </span>
            </div>
          </div>

          {/* B. CENTER: Great Ancient Oak Tree & IN the hollow */}
          <div className="relative w-64 h-80 sm:w-80 sm:h-96 mx-auto flex items-end justify-center">
            <svg className="w-full h-full drop-shadow-md">
              <use href="#svg-oak-tree"></use>
            </svg>

            {/* LOCATION 2: IN the tree hollow (Trunk Center) */}
            <div
              onClick={() => handleTapLocation('in_hollow')}
              className="absolute bottom-16 w-20 h-24 cursor-pointer flex flex-col items-center justify-center transition-transform hover:scale-110 active:scale-95 z-20"
              title="IN the tree hollow"
            >
              {round.targetLocation === 'in_hollow' && !revealedSpot && (
                <div className="text-xl animate-pulse">👀</div>
              )}
              {revealedSpot === 'in_hollow' && isSuccessPeekaboo && (
                <div className="w-16 h-16 animate-bounce">
                  <svg className="w-full h-full drop-shadow-md">
                    <use href="#svg-chubby-bunny"></use>
                  </svg>
                </div>
              )}
              <span className="px-2 py-0.5 rounded-full bg-white/90 text-amber-950 font-display font-extrabold text-[10px] shadow-xs mt-1">
                IN hollow
              </span>
            </div>
          </div>

          {/* C. LOCATION 3: UNDER the red mushroom (Bottom Left) */}
          <div
            onClick={() => handleTapLocation('under_mushroom')}
            className="absolute bottom-4 left-6 sm:left-10 cursor-pointer flex flex-col items-center transition-transform hover:scale-105 active:scale-95 z-30"
            title="UNDER the red mushroom"
          >
            {round.targetLocation === 'under_mushroom' && !revealedSpot && (
              <div className="text-xl animate-bounce -mb-2">🐾</div>
            )}
            {revealedSpot === 'under_mushroom' && isSuccessPeekaboo && (
              <div className="w-20 h-20 animate-bounce -mb-4">
                <svg className="w-full h-full drop-shadow-md">
                  <use href="#svg-chubby-bunny"></use>
                </svg>
              </div>
            )}
            <div className="w-28 h-28 sm:w-32 sm:h-32">
              <svg className="w-full h-full drop-shadow-md">
                <use href="#svg-red-mushroom"></use>
              </svg>
            </div>
            <span className="px-3 py-1 rounded-full bg-white/90 text-rose-900 border border-rose-300 font-display font-extrabold text-xs shadow-xs -mt-1">
              UNDER mushroom
            </span>
          </div>

          {/* D. LOCATION 4: BEHIND the peony bush (Bottom Right) */}
          <div
            onClick={() => handleTapLocation('behind_bush')}
            className="absolute bottom-4 right-6 sm:right-10 cursor-pointer flex flex-col items-center transition-transform hover:scale-105 active:scale-95 z-30"
            title="BEHIND the bush"
          >
            {round.targetLocation === 'behind_bush' && !revealedSpot && (
              <div className="text-xl animate-bounce -mb-2">🌿</div>
            )}
            {revealedSpot === 'behind_bush' && isSuccessPeekaboo && (
              <div className="w-20 h-20 animate-bounce -mb-4">
                <svg className="w-full h-full drop-shadow-md">
                  <use href="#svg-chubby-bunny"></use>
                </svg>
              </div>
            )}
            <div className="w-28 h-24 sm:w-36 sm:h-28">
              <svg className="w-full h-full drop-shadow-md">
                <use href="#svg-peony-bush"></use>
              </svg>
            </div>
            <span className="px-3 py-1 rounded-full bg-white/90 text-emerald-900 border border-emerald-300 font-display font-extrabold text-xs shadow-xs -mt-1">
              BEHIND bush
            </span>
          </div>
        </div>

        {/* 4. Touch Instruction Hint */}
        <div className="text-center text-xs sm:text-sm font-extrabold uppercase tracking-wider text-emerald-900 font-display pt-2">
          👇 Hãy quan sát và chạm vào vị trí bạn Thỏ đang ẩn nấp nhé!
        </div>
      </div>

      {/* 5. Victory Modal */}
      {showVictory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="meadow-clay-card max-w-md w-full p-8 text-center bg-[#FFFDF5] border-4 border-emerald-400 shadow-2xl relative">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-4xl mb-4 shadow-inner">
              🐰 🌳
            </div>
            <h3 className="text-3xl font-extrabold text-[#1E293B] font-display mb-2">
              Bậc Thầy Trốn Tìm Rừng Xanh!
            </h3>
            <p className="text-sm font-semibold text-[#475569] font-body mb-6">
              Bé đã tinh mắt tìm thấy bạn Thỏ ở mọi vị trí IN, ON, UNDER, BEHIND và nhận được <strong className="text-amber-600 font-extrabold">+30 Sao Vàng</strong>!
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
                🔁 Chơi Lại Trốn Tìm
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

export default Game5_HideAndSeekTree;
