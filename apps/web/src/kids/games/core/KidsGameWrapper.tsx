// ============================================================================
// KIDS GAME WRAPPER — FULL-BLEED GAME SHELL & FLOATING LIQUID GLASS HUD
// Controlled liquid glass HUD • 3-Layer Audio • Non-Auto-Advancing States
// ============================================================================

import React, { useState } from 'react';
import {
  ArrowLeft,
  Volume2,
  RotateCcw,
  Sparkles,
  Trophy,
  Award,
  ChevronRight,
  Maximize2,
  Minimize2,
  Heart,
  Flame,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { RewardCount } from '../../components/RewardCount';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';
import { GameDefinition, KIDS_GAME_WORLDS } from '../../data/games/gamesRegistry';
import { KidsCornerMascotGuide } from '../../components/KidsCornerMascotGuide';

interface KidsGameWrapperProps {
  game: GameDefinition;
  currentRound: number;
  totalRounds?: number;
  starsEarned: number;
  lives?: number;
  streak?: number;
  instructionEn?: string;
  instructionVi?: string;
  worldTheme?: 'jungle' | 'space' | 'kitchen' | 'sky' | 'castle' | 'stage' | 'starter' | 'station';
  isReadyToContinue?: boolean;
  onContinueRound?: () => void;
  praiseVi?: string;
  onExit: () => void;
  onReplayRound?: () => void;
  onNextGame?: () => void;
  onPlayAgain?: () => void;
  isGameComplete?: boolean;
  onReplayAudio?: () => void;
  children: React.ReactNode;
}

export const KidsGameWrapper: React.FC<KidsGameWrapperProps> = ({
  game,
  currentRound,
  totalRounds = 5,
  starsEarned,
  lives,
  streak = 0,
  instructionEn,
  instructionVi,
  worldTheme,
  isReadyToContinue = false,
  onContinueRound,
  praiseVi,
  onExit,
  onReplayRound,
  onNextGame,
  onPlayAgain,
  isGameComplete = false,
  onReplayAudio,
  children,
}) => {
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Stop all voices on unmount
  React.useEffect(() => {
    return () => {
      voiceService.stop();
    };
  }, []);

  const handleExit = () => {
    voiceService.stop();
    onExit();
  };

  // Match world definition
  const currentWorld = KIDS_GAME_WORLDS.find((w) => w.id === game.worldId) || KIDS_GAME_WORLDS[0];

  const handleSoundReplay = () => {
    soundManager.play('pop');
    if (onReplayAudio) {
      onReplayAudio();
    } else if (instructionEn) {
      voiceService.speakEnglish(instructionEn);
    } else {
      voiceService.speakEnglish(game.titleEn);
    }
  };

  return (
    <div
      className={`w-full mx-auto select-none transition-all duration-300 flex flex-col ${
        isFocusMode
          ? 'fixed inset-0 z-50 p-2 sm:p-4 bg-slate-950/90 overflow-y-auto'
          : 'max-w-5xl space-y-2 sm:space-y-3'
      }`}
    >
      {/* 1. ULTRA-SLEEK FLOATING LIQUID GLASS HUD */}
      <header className="relative z-30 w-full px-2 sm:px-4 py-1 sm:py-2">
        <div className="flex items-center justify-between gap-2 px-3 sm:px-5 py-2 rounded-full bg-white/90 backdrop-blur-xl border border-white/80 shadow-md">
          {/* Left: Exit button & Compact Game info */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={handleExit}
              className="p-2 rounded-full bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 active:scale-95 cursor-pointer transition-all border border-slate-200 shadow-xs min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Quay lại Bản đồ Thám hiểm"
              aria-label="Quay lại"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl drop-shadow-xs">{game.icon}</span>
              <div>
                <div className="flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-[10px]">
                    #{String(game.gameNumber).padStart(2, '0')}
                  </span>
                  <span className="hidden md:inline text-[11px] font-bold text-slate-700">
                    {game.titleVi}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Minimal 5-Round Progress Pill */}
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200/80 shrink-0">
            <span className="text-[11px] font-black text-slate-700 hidden sm:inline mr-1">Vòng:</span>
            {Array.from({ length: totalRounds }).map((_, idx) => (
              <div
                key={idx}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  idx + 1 < currentRound
                    ? 'bg-emerald-500 w-4 sm:w-5'
                    : idx + 1 === currentRound
                    ? 'bg-amber-500 w-6 sm:w-7 animate-pulse'
                    : 'bg-slate-300 w-2.5'
                }`}
              />
            ))}
            <span className="text-[11px] font-black text-amber-900 ml-1">
              {currentRound}/{totalRounds}
            </span>
          </div>

          {/* Right: Audio replay, Lives, Streak, Stars, Focus Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Audio Replay speaker */}
            <button
              onClick={handleSoundReplay}
              className="p-2 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 active:scale-95 cursor-pointer transition-all shadow-xs min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Nghe lại phát âm tiếng Anh"
              aria-label="Nghe lại"
            >
              <Volume2 className="w-4 h-4 text-amber-700 animate-pulse" />
            </button>

            {/* Lives if available */}
            {typeof lives === 'number' && (
              <div className="hidden sm:flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < lives ? 'fill-rose-500 text-rose-500' : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Streak */}
            {streak > 1 && (
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-black animate-bounce border border-rose-200">
                <Flame className="w-3.5 h-3.5 fill-rose-500" />
                <span>{streak}</span>
              </div>
            )}

            {/* Stars counter */}
            <RewardCount stars={starsEarned} size="sm" showStarLabel={false} />

            {/* Focus toggle */}
            <button
              onClick={() => setIsFocusMode(!isFocusMode)}
              className="hidden md:inline-flex p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 active:scale-95 cursor-pointer transition-all min-h-[44px] min-w-[44px] items-center justify-center"
              title={isFocusMode ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Floating Instruction Banner (Compact Pill) */}
        {(instructionEn || instructionVi) && (
          <div className="mt-1.5 mx-auto max-w-xl flex items-center justify-between gap-2 px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-amber-300 shadow-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-base animate-bounce shrink-0">💡</span>
              <div className="truncate">
                {instructionEn && (
                  <span className="text-xs font-black text-amber-950 mr-2">
                    {instructionEn}
                  </span>
                )}
                {instructionVi && (
                  <span className="text-[11px] font-bold text-amber-800 hidden sm:inline">
                    ({instructionVi})
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleSoundReplay}
              className="px-2.5 py-1 rounded-full bg-amber-200 hover:bg-amber-300 text-amber-950 text-[10px] font-black cursor-pointer shrink-0 active:scale-95 transition-all"
            >
              Phát Lại 🔊
            </button>
          </div>
        )}
      </header>

      {/* 2. FULL BLEED IMMERSIVE GAME WORLD CANVAS */}
      <main className="relative z-10 w-full flex-1 rounded-3xl overflow-hidden shadow-lg border-2 sm:border-4 border-white/90 bg-white min-h-[460px] sm:min-h-[520px] flex flex-col justify-center">
        {children}

        {/* 3. EXPLICIT NON-AUTO ADVANCING CONTINUE BAR (SECTION 8) */}
        {isReadyToContinue && !isGameComplete && onContinueRound && (
          <div className="absolute bottom-4 inset-x-0 z-40 flex flex-col items-center justify-center p-3 animate-scaleUp pointer-events-auto">
            <div className="p-3 sm:p-4 rounded-3xl bg-white/95 backdrop-blur-md border-3 border-emerald-400 shadow-2xl flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl animate-bounce">🎉</span>
                <span className="text-sm sm:text-base font-black text-emerald-950">
                  {praiseVi || 'Xuất sắc! Bé trả lời đúng rồi!'}
                </span>
              </div>

              <button
                onClick={onContinueRound}
                className="px-6 py-2.5 sm:px-8 sm:py-3 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs sm:text-sm border-b-4 border-emerald-800 shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer animate-bounce min-h-[48px]"
              >
                <span>⭐ BẤM ĐỂ TIẾP TỤC VÒNG {currentRound < totalRounds ? currentRound + 1 : 'KẾT THÚC'} ⭐</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 4. CHAPTER / GAME COMPLETE VICTORY MODAL (NO DEAD ENDS) */}
      {isGameComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white border-4 border-amber-400 shadow-2xl text-center space-y-5 animate-scaleUp overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-amber-300/40 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-rose-300/30 rounded-full blur-2xl pointer-events-none" />

            {/* Crown & Stars celebration */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 border-4 border-white shadow-lg flex items-center justify-center text-4xl animate-bounce">
                🏆
              </div>
              <div className="flex items-center gap-1.5 mt-2.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span
                    key={i}
                    className="text-2xl animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  >
                    ⭐
                  </span>
                ))}
              </div>
            </div>

            {/* Praise message */}
            <div className="space-y-1 relative z-10">
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
                {game.titleVi} Hoàn Thành!
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                Bé Giỏi Quá! Xuất Sắc Lắm!
              </h3>
              <p className="text-xs sm:text-sm font-bold text-slate-600">
                Bé đã kiên trì vượt qua trọn vẹn cả {totalRounds} vòng thử thách!
              </p>
            </div>

            {/* Reward Summary */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-around relative z-10">
              <div className="text-center">
                <span className="text-[11px] font-bold text-slate-500">Sao Thưởng</span>
                <p className="text-xl font-black text-amber-600 flex items-center justify-center gap-1">
                  <span>+{game.starsAwarded}</span>
                  <span className="text-base">⭐</span>
                </p>
              </div>
              <div className="w-px h-8 bg-amber-200" />
              <div className="text-center">
                <span className="text-[11px] font-bold text-slate-500">Kinh Nghiệm</span>
                <p className="text-xl font-black text-indigo-600">+{game.xpAwarded} XP</p>
              </div>
            </div>

            {/* 3 NO DEAD ENDS ACTION BUTTONS */}
            <div className="space-y-2 relative z-10 pt-1">
              {onNextGame && (
                <button
                  onClick={onNextGame}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm border-b-4 border-emerald-700 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer shadow-md min-h-[48px]"
                >
                  <span>TRÒ CHƠI TIẾP THEO</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onPlayAgain}
                  className="py-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-xs border border-amber-300 active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Chơi Lại Vòng</span>
                </button>

                <button
                  onClick={onExit}
                  className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs border border-slate-300 active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Bản Đồ Game</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. DOCKED CORNER BOBBY COMPANION: Collapsible instruction & voice replay without blocking game */}
      {!isGameComplete && (instructionVi || instructionEn) && (
        <KidsCornerMascotGuide
          instructionVi={instructionVi}
          instructionEn={instructionEn}
          targetWord={instructionEn || game.titleEn}
          onReplayAudio={onReplayAudio}
          position="bottom-left"
        />
      )}
    </div>
  );
};
