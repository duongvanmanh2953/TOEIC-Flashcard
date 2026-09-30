// ============================================================================
// TREASURE MAP GAME — FULL MODULAR ADVENTURE APPLICATION
// Top HUD, Guide Mascot, Responsive Scene, Inventory Tray, and Celebration Modal
// ============================================================================

import React from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Compass,
  Key,
  Flame,
  Flag,
  Award,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { RewardCount } from '../../components/RewardCount';
import { useTreasureMapController } from './TreasureMapController';
import { TreasureMapGuide } from './TreasureMapGuide';
import { TreasureMapScene } from './TreasureMapScene';
import { HeroTreasureChest } from '../../assets/illustrations/KidsHeroAssets';

interface TreasureMapGameProps {
  onExit: () => void;
  onStarsAwarded?: (stars: number) => void;
}

export const TreasureMapGame: React.FC<TreasureMapGameProps> = ({
  onExit,
  onStarsAwarded,
}) => {
  const {
    savedState,
    gameState,
    characterPos,
    characterAction,
    facing,
    activeQuest,
    particles,
    showWinModal,
    setShowWinModal,
    replayAudio,
    proceedFromTeaching,
    handleInteractTarget,
    handleWaypointClick,
    resetGame,
  } = useTreasureMapController(onStarsAwarded);

  // 1. FAULT-TOLERANT LOADING SCREEN (Eliminates any blank screen!)
  if (gameState === 'loading') {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 bg-amber-50 rounded-3xl border-3 border-amber-200">
        <div className="w-20 h-20 rounded-2xl bg-amber-100 border-2 border-amber-400 flex items-center justify-center shadow-md animate-bounce">
          <Compass className="w-10 h-10 text-amber-700 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <h3 className="text-xl font-black text-slate-900 mt-4">
          Đang Mở Bản Đồ Kho Báu...
        </h3>
        <p className="text-sm font-semibold text-slate-600 mt-1">
          Preparing your treasure map adventure...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 select-none">
      {/* 2. TOP HUD: BACK, TITLE, STARS & RESTART */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-xs">
        {/* Back Button & Title */}
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
              <span className="text-lg sm:text-xl">🗺️</span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-none">
                Bản Đồ Kho Báu
              </h2>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Treasure Map Adventure • Đảo Ngọc Huyền Bí
            </p>
          </div>
        </div>

        {/* HUD Right: Stars Count, Progress & Reset */}
        <div className="flex items-center gap-2 sm:gap-4">
          <RewardCount
            stars={savedState.totalStarsEarned}
            size="md"
            showStarLabel={true}
          />

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-black">
            <span>Tiến độ:</span>
            <span className="text-amber-700">{savedState.currentQuestIndex + 1}/6</span>
          </div>

          <button
            onClick={resetGame}
            className="p-2 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 border border-slate-200 active:scale-95 cursor-pointer transition-colors"
            title="Chơi lại từ đầu"
            aria-label="Chơi lại từ đầu"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. GUIDE SYSTEM (Pedagogical voice & English instructions) */}
      <TreasureMapGuide
        quest={activeQuest}
        gameState={gameState}
        onReplayAudio={replayAudio}
        onProceedFromTeaching={proceedFromTeaching}
      />

      {/* 4. MAIN INTERACTIVE WORLD SCENE */}
      <TreasureMapScene
        savedState={savedState}
        activeQuest={activeQuest}
        characterPos={characterPos}
        characterAction={characterAction}
        facing={facing}
        particles={particles}
        onInteractTarget={handleInteractTarget}
        onWaypointClick={handleWaypointClick}
      />

      {/* 5. INVENTORY TRAY (Pure SVG items collected) */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-900">
            <Trophy className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm font-black text-slate-800">
            Túi Đồ Thám Hiểm ({savedState.inventory.length})
          </span>
        </div>

        {/* Inventory Item Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {savedState.inventory.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 shadow-xs"
            >
              {item.iconType === 'compass' && <Compass className="w-4 h-4 text-cyan-600" />}
              {item.iconType === 'key' && <Key className="w-4 h-4 text-amber-500" />}
              {item.iconType === 'torch' && <Flame className="w-4 h-4 text-orange-500" />}
              {item.iconType === 'flag' && <Flag className="w-4 h-4 text-blue-500" />}
              <span className="text-xs font-bold text-slate-700">{item.nameVi}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. VICTORY CELEBRATION MODAL */}
      {showWinModal && (
        <div className="fixed inset-0 z-[200] w-screen h-screen min-h-[100dvh] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-300 select-none">
          <div className="relative w-full max-w-md my-auto rounded-3xl bg-white border-4 border-amber-400 p-6 text-center shadow-2xl space-y-4">
            {/* Golden Ribbon Badge */}
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-950 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Kho Báu Đã Khám Phá!</span>
            </div>

            {/* Giant Hero Treasure Chest Artwork */}
            <div className="flex justify-center py-2">
              <HeroTreasureChest isOpen={true} size={110} />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-slate-950">
                You Found The Treasure!
              </h3>
              <p className="text-sm font-semibold text-slate-600">
                Chúc mừng bé đã chinh phục toàn bộ hòn đảo và tìm thấy rương vàng hoàng kim!
              </p>
            </div>

            {/* Reward Badges */}
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-around">
              <div className="flex flex-col items-center">
                <RewardCount stars={savedState.totalStarsEarned} size="lg" />
                <span className="text-[11px] font-bold text-amber-900 mt-1">Sao Vàng Thu Thập</span>
              </div>
              <div className="w-px h-10 bg-amber-200" />
              <div className="flex flex-col items-center">
                <Award className="w-7 h-7 text-amber-600" />
                <span className="text-[11px] font-bold text-amber-900 mt-1">Huy Hiệu Nhà Thám Hiểm</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={resetGame}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs sm:text-sm active:scale-95 cursor-pointer transition-colors"
              >
                Chơi Lại Hành Trình
              </button>
              <button
                onClick={onExit}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs sm:text-sm border-b-2 border-amber-700 shadow-md active:scale-95 cursor-pointer transition-all"
              >
                Về Danh Sách Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
