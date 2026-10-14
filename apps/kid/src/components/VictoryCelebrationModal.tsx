import React, { useState, useEffect } from 'react';
import { SunnySoundFX } from '../services/audio/SunnySoundFX';
import { BilingualVoiceEngine } from '../services/audio/BilingualVoiceEngine';
import { meadowStore } from '../core/meadowStateStore';

interface VictoryCelebrationModalProps {
  isOpen: boolean;
  errorsCount: number;
  gameTitle: string;
  currentLevel: number;
  totalLevels: number;
  onReplay: () => void;
  onNextLevel?: () => void;
  onExit: () => void;
}

export const VictoryCelebrationModal: React.FC<VictoryCelebrationModalProps> = ({
  isOpen,
  errorsCount,
  gameTitle,
  currentLevel,
  totalLevels,
  onReplay,
  onNextLevel,
  onExit,
}) => {
  const [revealedStars, setRevealedStars] = useState<number>(0);
  const [fireworksActive, setFireworksActive] = useState<boolean>(false);

  // Calculate Stars:
  // 0-1 mistakes => 3 stars
  // 2-3 mistakes => 2 stars
  // >=4 mistakes => 1 star
  const earnedStars = errorsCount <= 1 ? 3 : errorsCount <= 3 ? 2 : 1;

  const victoryText =
    earnedStars === 3
      ? { vi: 'Xuất sắc quá bé ơi! Cáo Sunny khen bé!', en: 'Amazing! Three golden stars!' }
      : earnedStars === 2
      ? { vi: 'Bé làm tốt lắm! Cố gắng chút nữa nhé!', en: 'Great job! Two stars for you!' }
      : { vi: 'Bé rất kiên trì, hãy cố gắng lên nhé!', en: 'Good try! Keep it up!' };

  useEffect(() => {
    if (!isOpen) {
      setRevealedStars(0);
      setFireworksActive(false);
      return;
    }

    setFireworksActive(true);
    SunnySoundFX.playVictoryFanfare();
    SunnySoundFX.playFireworkBurst();

    // Reward stars in meadowStore
    meadowStore.addStars(earnedStars * 5);

    // Staggered star pops every 350ms
    const timer1 = setTimeout(() => {
      setRevealedStars(1);
      SunnySoundFX.playStarAward(1);
    }, 350);

    let timer2: number | undefined;
    if (earnedStars >= 2) {
      timer2 = window.setTimeout(() => {
        setRevealedStars(2);
        SunnySoundFX.playStarAward(2);
      }, 700);
    }

    let timer3: number | undefined;
    if (earnedStars >= 3) {
      timer3 = window.setTimeout(() => {
        setRevealedStars(3);
        SunnySoundFX.playStarAward(3);
      }, 1050);
    }

    // Voice announcement
    const timerVoice = setTimeout(() => {
      BilingualVoiceEngine.speakBilingual(victoryText.vi, victoryText.en);
    }, 1200);

    return () => {
      clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);
      if (timer3) clearTimeout(timer3);
      clearTimeout(timerVoice);
    };
  }, [isOpen, errorsCount]);

  if (!isOpen) return null;

  const hasNextLevel = currentLevel < totalLevels && Boolean(onNextLevel);

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-md animate-fadeIn select-none">
      {/* Background Animated Fireworks Sparks */}
      {fireworksActive && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-12 left-1/4 w-32 h-32 animate-bounce-subtle text-amber-300 opacity-90">
            <svg className="w-full h-full"><use href="#svg-firework"></use></svg>
          </div>
          <div className="absolute top-20 right-1/4 w-36 h-36 animate-pulse text-rose-400 opacity-90">
            <svg className="w-full h-full"><use href="#svg-firework"></use></svg>
          </div>
          <div className="absolute bottom-20 left-16 w-28 h-28 animate-spin-slow text-emerald-400 opacity-80">
            <svg className="w-full h-full"><use href="#svg-firework"></use></svg>
          </div>
          <div className="absolute bottom-24 right-20 w-32 h-32 animate-bounce text-sky-400 opacity-80">
            <svg className="w-full h-full"><use href="#svg-firework"></use></svg>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="meadow-clay-card max-w-lg w-full p-6 sm:p-8 text-center bg-[#FFFFFF] border-4 border-[#BAE6FD] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] relative z-10 overflow-hidden">
        {/* Sunny the Fox Celebration Avatar */}
        <div className="w-32 h-32 mx-auto mb-2 relative flex items-center justify-center">
          <div className="absolute inset-0 bg-amber-200/50 rounded-full blur-xl animate-pulse" />
          <svg className="w-full h-full relative z-10 animate-bounce">
            <use href="#svg-sunny-fox"></use>
          </svg>
        </div>

        {/* Level & Game Title Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-50 border border-emerald-300 font-display font-extrabold text-emerald-800 text-xs mb-2 shadow-2xs">
          <span>🎉 {gameTitle}</span>
          <span>•</span>
          <span>Màn {currentLevel} / {totalLevels}</span>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-display mb-1">
          {earnedStars === 3 ? 'Xuất Sắc Quá Bé Ơi! 🌟' : earnedStars === 2 ? 'Làm Tốt Lắm Bé Ơi! 👏' : 'Bé Đã Hoàn Thành Màn Chơi! 💪'}
        </h2>

        {/* Bilingual Subtitle */}
        <p className="text-sm font-bold text-[#0F172A] font-display">
          {victoryText.vi}
        </p>
        <p className="text-xs font-semibold text-slate-500 font-body mb-5">
          "{victoryText.en}" (Số lỗi: {errorsCount})
        </p>

        {/* 3 Stars Display (Staggered Animation) */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 my-4 py-2 bg-[#F0F9FF] rounded-3xl border-2 border-[#BAE6FD]">
          {[1, 2, 3].map((starIndex) => {
            const isEarned = starIndex <= earnedStars;
            const isShown = starIndex <= revealedStars;
            return (
              <div
                key={starIndex}
                className={`w-16 h-16 sm:w-20 sm:h-20 transition-all duration-300 transform ${
                  isShown ? 'scale-110 animate-pop-sparkle' : 'scale-90 opacity-40'
                }`}
              >
                <svg className="w-full h-full drop-shadow-md">
                  <use href={isShown && isEarned ? '#svg-star-gold' : '#svg-star-empty'}></use>
                </svg>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
          {hasNextLevel ? (
            <button
              type="button"
              onClick={() => {
                SunnySoundFX.playButtonClick();
                if (onNextLevel) onNextLevel();
              }}
              className="toy-btn toy-btn-green w-full !min-h-[56px] text-lg font-display order-1 sm:order-2"
            >
              <span>⏭️ Màn Tiếp Theo</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                SunnySoundFX.playButtonClick();
                onExit();
              }}
              className="toy-btn toy-btn-green w-full !min-h-[56px] text-lg font-display order-1 sm:order-2"
            >
              <span>🏆 Hoàn Thành Tất Cả</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              SunnySoundFX.playButtonClick();
              onReplay();
            }}
            className="toy-btn toy-btn-amber w-full !min-h-[56px] text-base font-display order-2 sm:order-1"
          >
            <span>🔄 Chơi Lại</span>
          </button>
        </div>

        {/* Return Button */}
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => {
              SunnySoundFX.playButtonClick();
              onExit();
            }}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 font-body underline cursor-pointer"
          >
            ← Về danh sách trò chơi
          </button>
        </div>
      </div>
    </div>
  );
};

export default VictoryCelebrationModal;
