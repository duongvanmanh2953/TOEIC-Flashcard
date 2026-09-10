import React, { useEffect } from 'react';
import { ModalPortal } from '../../components/common/ModalPortal';
import { KidsStarIcon, KidsSparklesIcon } from '../assets/icons/KidsIcons';
import { KidsMascot } from './KidsMascot';
import { kidsSound } from '../services/sound/KidsSoundManager';

interface KidsRewardModalProps {
  isOpen: boolean;
  starsEarned: number;
  xpEarned: number;
  scorePercent: number;
  unlockedNextLessonTitle?: string;
  unlockedItemName?: string;
  unlockedItemEmoji?: string;
  onContinue: () => void;
  onGoHome: () => void;
}

export const KidsRewardModal: React.FC<KidsRewardModalProps> = ({
  isOpen,
  starsEarned,
  xpEarned,
  scorePercent,
  unlockedNextLessonTitle,
  unlockedItemName,
  unlockedItemEmoji = '🎁',
  onContinue,
  onGoHome,
}) => {
  useEffect(() => {
    if (isOpen) {
      kidsSound.play('celebration');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen} onClose={() => {}}>
      <div
        className="m-auto relative w-full max-w-md rounded-3xl bg-gradient-to-b from-amber-100 via-white to-amber-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 border-4 border-amber-400 p-6 sm:p-8 shadow-2xl space-y-4 animate-scale-up text-center select-none overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti / Sparkles Header */}
        <div className="flex items-center justify-center gap-2 text-amber-500 font-black text-sm uppercase tracking-wider animate-pulse">
          <KidsSparklesIcon size={20} />
          <span>Lesson Complete!</span>
          <KidsSparklesIcon size={20} />
        </div>

        {/* Mascot Celebrate */}
        <div className="py-1">
          <KidsMascot
            mood="celebrate"
            size="md"
            speechText="Yay! You did an amazing job today!"
          />
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-amber-900 dark:text-amber-100 tracking-tight">
          🎉 SUPER STAR!
        </h2>

        {/* Stars Display (1 to 3 animated stars) */}
        <div className="flex items-center justify-center gap-3 py-2">
          {[1, 2, 3].map((starIndex) => {
            const hasStar = starIndex <= starsEarned;
            return (
              <div
                key={starIndex}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${
                  hasStar
                    ? 'bg-amber-400 border-amber-500 text-white shadow-lg shadow-amber-400/40 scale-110 animate-bounce'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600'
                }`}
                style={{ animationDelay: `${starIndex * 150}ms` }}
              >
                <KidsStarIcon size={32} filled={hasStar} />
              </div>
            );
          })}
        </div>

        {/* XP & Score Card */}
        <div className="grid grid-cols-2 gap-3 py-2 px-4 rounded-2xl bg-amber-500/10 border-2 border-amber-400/30">
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Score</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{scorePercent}%</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Adventure XP</p>
            <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">+{xpEarned} XP</p>
          </div>
        </div>

        {/* Unlocked Reward Item / Next Lesson Callout */}
        {unlockedItemName ? (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-500/15 to-pink-500/15 border-2 border-purple-400/40 flex items-center gap-3 text-left">
            <div className="w-12 h-12 rounded-xl bg-purple-500 text-white text-2xl flex items-center justify-center shadow-md shrink-0">
              {unlockedItemEmoji}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">
                New Item Unlocked!
              </p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {unlockedItemName} is ready in My World!
              </p>
            </div>
          </div>
        ) : unlockedNextLessonTitle ? (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border-2 border-emerald-400/40 text-xs font-bold text-emerald-800 dark:text-emerald-200">
            🔓 Next Lesson Unlocked: <span className="font-black">{unlockedNextLessonTitle}</span>
          </div>
        ) : null}

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              kidsSound.play('click');
              onContinue();
            }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-500/30 hover:scale-102 active:scale-98 transition flex items-center justify-center gap-2"
          >
            <span>TIẾP TỤC HỌC TIẾP ▶</span>
          </button>

          <button
            onClick={() => {
              kidsSound.play('pop');
              onGoHome();
            }}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
          >
            Quay lại Bản đồ phiêu lưu
          </button>
        </div>
      </div>
    </ModalPortal>
  );
};

export default KidsRewardModal;
