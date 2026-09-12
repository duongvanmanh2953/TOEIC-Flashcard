import React, { useEffect } from 'react';
import { ModalPortal } from '../../components/common/ModalPortal';
import { KidsStarIcon, KidsSparklesIcon } from '../assets/icons/KidsIcons';
import { KidsMascot } from './KidsMascot';
import { kidsSound } from '../services/sound/KidsSoundManager';
import { Play, RotateCcw, Unlock, Gift, ArrowLeft, Sparkles } from 'lucide-react';

interface KidsRewardModalProps {
  isOpen: boolean;
  stars?: number;
  starsEarned?: number;
  xpEarned?: number;
  scorePercent?: number;
  nextLessonTitle?: string;
  unlockedNextLessonTitle?: string;
  unlockedItemName?: string;
  unlockedItemEmoji?: string;
  onNext?: () => void;
  onContinue?: () => void;
  onReplay?: () => void;
  onClose?: () => void;
  onGoHome?: () => void;
}

export const KidsRewardModal: React.FC<KidsRewardModalProps> = ({
  isOpen,
  stars,
  starsEarned,
  xpEarned = 50,
  scorePercent = 100,
  nextLessonTitle,
  unlockedNextLessonTitle,
  unlockedItemName,
  unlockedItemEmoji = '🎁',
  onNext,
  onContinue,
  onReplay,
  onClose,
  onGoHome,
}) => {
  const finalStars = stars ?? starsEarned ?? 3;
  const finalNextLessonTitle = nextLessonTitle ?? unlockedNextLessonTitle;

  useEffect(() => {
    if (isOpen) {
      kidsSound.play('celebration');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrimaryAction = () => {
    kidsSound.play('click');
    if (onNext) onNext();
    else if (onContinue) onContinue();
    else if (onClose) onClose();
  };

  const handleSecondaryAction = () => {
    kidsSound.play('pop');
    if (onClose) onClose();
    else if (onGoHome) onGoHome();
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={() => {}}>
      <div
        className="m-auto relative w-full max-w-md rounded-3xl bg-gradient-to-b from-amber-50 via-white to-amber-100 border-4 border-amber-400 p-6 sm:p-8 space-y-4 animate-scale-up text-center select-none overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti / Sparkles Header */}
        <div className="flex items-center justify-center gap-2 text-amber-600 font-black text-sm uppercase tracking-wider animate-pulse">
          <KidsSparklesIcon size={20} />
          <span>Hoàn Thành Bài Học Xuất Sắc!</span>
          <KidsSparklesIcon size={20} />
        </div>

        {/* Mascot Celebrate */}
        <div className="py-1">
          <KidsMascot
            mood="celebrate"
            size="md"
            speechText="Yeahhh! Bé hôm nay làm quá xuất sắc luôn!"
          />
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-black text-amber-950 tracking-tight flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-500" />
          <span>BÉ THẬT XUẤT SẮC!</span>
        </h2>

        {/* Stars Display (1 to 3 animated stars) */}
        <div className="flex items-center justify-center gap-3 py-2">
          {[1, 2, 3].map((starIndex) => {
            const hasStar = starIndex <= finalStars;
            return (
              <div
                key={starIndex}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${
                  hasStar
                    ? 'bg-amber-400 border-amber-500 text-white scale-110 animate-bounce'
                    : 'bg-slate-100 border-slate-300 text-slate-400'
                }`}
              >
                <KidsStarIcon size={32} filled={hasStar} />
              </div>
            );
          })}
        </div>

        {/* XP & Score Summary Pill */}
        <div className="flex items-center justify-center gap-4 py-2 text-xs font-black">
          <span className="px-3 py-1 rounded-full bg-amber-200 text-amber-950 border border-amber-300">
            +{xpEarned} Điểm EXP
          </span>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
            Độ chính xác: {scorePercent}%
          </span>
        </div>

        {/* Unlock Next Lesson / Island Item Alert */}
        {unlockedItemName ? (
          <div className="p-3.5 rounded-2xl bg-purple-50 border-2 border-purple-300 flex items-center gap-3 text-left">
            <div className="text-3xl shrink-0">{unlockedItemEmoji}</div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-purple-700 flex items-center gap-1">
                <Gift className="w-3.5 h-3.5" />
                <span>Mở Khóa Quà Tặng Mới!</span>
              </p>
              <p className="text-xs font-black text-slate-900">
                {unlockedItemName} đã có trên Đảo Của Bé!
              </p>
            </div>
          </div>
        ) : finalNextLessonTitle ? (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-xs font-black text-emerald-900 flex items-center justify-center gap-1.5">
            <Unlock className="w-4 h-4 text-emerald-700" />
            <span>Đã Mở Khóa Trạm Tiếp Theo: <span className="text-amber-700">{finalNextLessonTitle}</span></span>
          </div>
        ) : null}

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handlePrimaryAction}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-base active:scale-95 transition cursor-pointer border-b-4 border-emerald-700 flex items-center justify-center gap-2"
          >
            <span>TIẾP TỤC CHINH PHỤC</span>
            <Play className="w-4 h-4 fill-current" />
          </button>

          {onReplay && (
            <button
              onClick={() => {
                kidsSound.play('pop');
                onReplay();
              }}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Chơi lại bài này</span>
            </button>
          )}

          <button
            onClick={handleSecondaryAction}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại Bản đồ phiêu lưu</span>
          </button>
        </div>
      </div>
    </ModalPortal>
  );
};

export default KidsRewardModal;
