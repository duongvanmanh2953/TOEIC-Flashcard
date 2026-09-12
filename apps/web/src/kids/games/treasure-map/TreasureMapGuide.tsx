// ============================================================================
// TREASURE MAP GUIDE — INTERACTIVE MASCOT DIALOG & INSTRUCTION SYSTEM
// Speaks English clearly, provides Vietnamese support, and never blocks gameplay
// ============================================================================

import React, { useState } from 'react';
import { Volume2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { TreasureQuest, GameMachineState } from './TreasureMapData';

interface TreasureMapGuideProps {
  quest: TreasureQuest;
  gameState: GameMachineState;
  onReplayAudio: () => void;
  onProceedFromTeaching?: () => void;
}

export const TreasureMapGuide: React.FC<TreasureMapGuideProps> = ({
  quest,
  gameState,
  onReplayAudio,
  onProceedFromTeaching,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isTeaching = gameState === 'teaching';

  return (
    <div className="w-full max-w-2xl mx-auto transition-all duration-300 z-20">
      {/* Main Guide Card */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border-2 border-amber-300 shadow-md p-3 sm:p-4 flex flex-col gap-2">
        {/* Header Row: Mascot, Area Title, Collapse Toggle */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {/* Mascot Avatar Circle */}
            <div className="w-10 h-10 rounded-xl bg-amber-100 border-2 border-amber-400 flex items-center justify-center shrink-0 shadow-xs">
              <span className="text-xl">🧭</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                  {quest.areaNameVi}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Nhiệm vụ {quest.stepIndex + 1}/6
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                {isTeaching ? `Từ vựng: ${quest.targetWord}` : quest.titleVi}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Replay Audio Button */}
            <button
              onClick={onReplayAudio}
              className="p-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 active:scale-95 cursor-pointer transition-colors shadow-xs"
              title="Nghe lại phát âm tiếng Anh"
              aria-label="Nghe lại phát âm tiếng Anh"
            >
              <Volume2 className="w-4 h-4 text-amber-800" />
            </button>

            {/* Collapse Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 cursor-pointer transition-colors"
              title={isCollapsed ? 'Mở rộng hướng dẫn' : 'Thu gọn'}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expandable Content Body */}
        {!isCollapsed && (
          <div className="pt-2 border-t border-amber-100/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* English Instruction + Vietnamese Subtitle */}
            <div className="space-y-0.5 flex-1">
              <p className="text-sm sm:text-base font-black text-blue-900 flex items-center gap-1.5">
                <span>{isTeaching ? quest.teachingEn : quest.instructionEn}</span>
              </p>
              <p className="text-xs font-medium text-slate-600">
                {isTeaching ? quest.teachingVi : quest.instructionVi}
              </p>
            </div>

            {/* Teaching Stage Confirm Action Button */}
            {isTeaching && onProceedFromTeaching && (
              <button
                onClick={onProceedFromTeaching}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs sm:text-sm border-b-2 border-amber-700 shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>Bắt Đầu Tìm Kiếm!</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
