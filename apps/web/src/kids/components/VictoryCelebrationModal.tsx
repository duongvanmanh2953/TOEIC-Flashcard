import React, { useState, useEffect } from 'react';
import { SunnyAudioEngine } from '../services/audio/SunnyAudioEngine';
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
  currentLevel,
  totalLevels,
  onReplay,
  onNextLevel,
  onExit,
}) => {
  const [revealedStars, setRevealedStars] = useState<number>(0);

  // 0-1 mistakes => 3 stars
  // 2-3 mistakes => 2 stars
  // >=4 mistakes => 1 star
  const earnedStars = errorsCount <= 1 ? 3 : errorsCount <= 3 ? 2 : 1;

  const victoryText =
    earnedStars === 3
      ? {
          vi: 'Xuất sắc quá bé ơi! Bé đạt được 3 Ông Sao vàng lấp lánh!',
          en: 'Amazing job! You got three shiny stars!',
        }
      : earnedStars === 2
      ? {
          vi: 'Bé làm tốt lắm! Bé đạt được 2 Ông Sao vàng rực rỡ!',
          en: 'Great job! Two shiny golden stars for you!',
        }
      : {
          vi: 'Bé rất kiên trì, hãy tiếp tục cố gắng cùng Cáo Sunny nhé!',
          en: 'Good try! Keep it up with Sunny the Fox!',
        };

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      setRevealedStars(0);

      SunnyAudioEngine.playCorrect();
      SunnyAudioEngine.playFireworkBurst();
      meadowStore.addStars(earnedStars * 5);

      // Staggered star award sounds & reveal
      const timer1 = window.setTimeout(() => {
        setRevealedStars(1);
        SunnyAudioEngine.playStarAward(1);
      }, 350);

      let timer2: number | undefined;
      if (earnedStars >= 2) {
        timer2 = window.setTimeout(() => {
          setRevealedStars(2);
          SunnyAudioEngine.playStarAward(2);
        }, 700);
      }

      let timer3: number | undefined;
      if (earnedStars >= 3) {
        timer3 = window.setTimeout(() => {
          setRevealedStars(3);
          SunnyAudioEngine.playStarAward(3);
        }, 1050);
      }

      const timerVoice = window.setTimeout(() => {
        SunnyAudioEngine.speakBilingual(victoryText.vi, victoryText.en);
      }, 1200);

      return () => {
        clearTimeout(timer1);
        if (timer2) clearTimeout(timer2);
        if (timer3) clearTimeout(timer3);
        clearTimeout(timerVoice);
        document.body.classList.remove('modal-open');
      };
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [isOpen, errorsCount]);

  if (!isOpen) return null;

  const hasNextLevel = currentLevel < totalLevels && Boolean(onNextLevel);

  return (
    <div
      id="victory-modal"
      className="fullscreen-modal-overlay active"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="victory-modal-card animate-scaleUp relative w-full max-w-[520px] bg-white border-[6px] border-[#FACC15] rounded-[40px] px-7 pt-9 pb-8 text-center shadow-2xl select-none z-10"
        style={{ borderBottom: '12px solid #CA8A04' }}
      >
        {/* Banner Title */}
        <div
          id="victory-banner-title"
          className="inline-block bg-gradient-to-r from-[#F59E0B] to-[#EA580C] text-white font-display text-xl sm:text-2xl font-black py-2 px-7 rounded-full border-4 border-[#FEF08A] -mt-14 mb-4 shadow-md tracking-wide"
        >
          🎉 HOÀN THÀNH MÀN CHƠI!
        </div>

        {/* 3 Stars Arch (Vòng cung 3 Ông Sao) */}
        <div className="victory-stars-row flex items-end justify-center gap-3.5 my-2.5 mb-5 h-[115px]">
          {/* Star 1 */}
          <div
            id="win-star-1"
            className="star-slot transition-all duration-300"
            style={{
              width: '84px',
              height: '84px',
              transform: 'rotate(-12deg)',
            }}
          >
            <svg
              width="84"
              height="84"
              className={`w-full h-full ${
                revealedStars >= 1
                  ? 'animate-scaleUp drop-shadow-[0_6px_12px_rgba(250,204,21,0.65)]'
                  : 'opacity-50'
              }`}
            >
              <use href={revealedStars >= 1 ? '#svg-star-gold' : '#svg-star-empty'}></use>
            </svg>
          </div>

          {/* Star 2 (Center, Higher & Bigger) */}
          <div
            id="win-star-2"
            className="star-slot transition-all duration-300 mb-3.5"
            style={{
              width: '104px',
              height: '104px',
            }}
          >
            <svg
              width="104"
              height="104"
              className={`w-full h-full ${
                revealedStars >= 2
                  ? 'animate-scaleUp drop-shadow-[0_8px_16px_rgba(250,204,21,0.75)]'
                  : 'opacity-50'
              }`}
            >
              <use href={revealedStars >= 2 ? '#svg-star-gold' : '#svg-star-empty'}></use>
            </svg>
          </div>

          {/* Star 3 */}
          <div
            id="win-star-3"
            className="star-slot transition-all duration-300"
            style={{
              width: '84px',
              height: '84px',
              transform: 'rotate(12deg)',
            }}
          >
            <svg
              width="84"
              height="84"
              className={`w-full h-full ${
                revealedStars >= 3
                  ? 'animate-scaleUp drop-shadow-[0_6px_12px_rgba(250,204,21,0.65)]'
                  : 'opacity-50'
              }`}
            >
              <use href={revealedStars >= 3 ? '#svg-star-gold' : '#svg-star-empty'}></use>
            </svg>
          </div>
        </div>

        {/* Mascot Cáo Sunny Gốc + Lời khen song ngữ */}
        <div className="bg-[#FFFBEB] border-3 border-[#FDE68A] rounded-[24px] p-3.5 sm:p-4 flex items-center gap-4 mb-6 text-left shadow-xs">
          <div className="w-[76px] h-[76px] shrink-0">
            <svg className="w-full h-full drop-shadow-sm">
              <use href="#svg-sunny-fox"></use>
            </svg>
          </div>
          <div>
            <div id="victory-msg-vi" className="text-base sm:text-lg font-black text-[#0F172A] leading-snug font-display">
              {victoryText.vi}
            </div>
            <div id="victory-msg-en" className="text-xs sm:text-sm font-bold text-[#EA580C] mt-1 font-body">
              "{victoryText.en}"
            </div>
          </div>
        </div>

        {/* Buttons: Replay & Next Level */}
        <div className="flex gap-3 sm:gap-4 justify-center">
          <button
            type="button"
            onClick={() => {
              SunnyAudioEngine.playClick();
              onReplay();
            }}
            className="flex-1 py-3.5 sm:py-4 px-4 rounded-[22px] border-3 border-[#7DD3FC] bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0369A1] text-base sm:text-lg font-black cursor-pointer transition-transform active:scale-95 font-display"
            style={{ borderBottom: '7px solid #0284C7' }}
          >
            🔄 Chơi lại
          </button>

          {hasNextLevel ? (
            <button
              type="button"
              onClick={() => {
                SunnyAudioEngine.playClick();
                if (onNextLevel) onNextLevel();
              }}
              className="flex-[1.4] py-3.5 sm:py-4 px-5 rounded-[22px] border-3 border-[#86EFAC] bg-[#22C55E] hover:bg-emerald-600 text-white text-base sm:text-lg font-black cursor-pointer transition-transform active:scale-95 font-display shadow-md"
              style={{ borderBottom: '7px solid #15803D' }}
            >
              ⏭️ Màn tiếp theo
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                SunnyAudioEngine.playClick();
                onExit();
              }}
              className="flex-[1.4] py-3.5 sm:py-4 px-5 rounded-[22px] border-3 border-[#86EFAC] bg-[#22C55E] hover:bg-emerald-600 text-white text-base sm:text-lg font-black cursor-pointer transition-transform active:scale-95 font-display shadow-md"
              style={{ borderBottom: '7px solid #15803D' }}
            >
              🌟 Về Danh Sách
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VictoryCelebrationModal;
