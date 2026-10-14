import React, { useState, useEffect } from 'react';
import { BilingualVoiceEngine, SpeakingLang } from '../services/audio/BilingualVoiceEngine';
import { SunnySoundFX } from '../services/audio/SunnySoundFX';

interface SunnyBilingualGuideProps {
  viPrompt: string;
  enPrompt: string;
  badgeTitle?: string;
  autoSpeakOnMount?: boolean;
  extraRightSlot?: React.ReactNode;
}

export const SunnyBilingualGuide: React.FC<SunnyBilingualGuideProps> = ({
  viPrompt,
  enPrompt,
  badgeTitle = 'Cáo Sunny Hướng Dẫn',
  autoSpeakOnMount = true,
  extraRightSlot,
}) => {
  const [isTalking, setIsTalking] = useState<boolean>(false);
  const [activeLang, setActiveLang] = useState<SpeakingLang>(null);

  useEffect(() => {
    const unsub = BilingualVoiceEngine.onSpeakingChange((speaking, lang) => {
      setIsTalking(speaking);
      setActiveLang(lang);
    });

    if (autoSpeakOnMount) {
      const timer = setTimeout(() => {
        BilingualVoiceEngine.speakBilingual(viPrompt, enPrompt);
      }, 500);
      return () => {
        clearTimeout(timer);
        unsub();
      };
    }

    return () => unsub();
  }, [viPrompt, enPrompt]);

  const handleReplayBilingual = () => {
    SunnySoundFX.playButtonClick();
    BilingualVoiceEngine.speakBilingual(viPrompt, enPrompt);
  };

  const handleSpeakVietnameseOnly = () => {
    SunnySoundFX.playButtonClick();
    BilingualVoiceEngine.speakVietnamese(viPrompt);
  };

  const handleSpeakEnglishOnly = () => {
    SunnySoundFX.playButtonClick();
    BilingualVoiceEngine.speakEnglish(enPrompt);
  };

  return (
    <div className="w-full bg-[#FFFFFF] border-4 border-[#BAE6FD] rounded-[32px] p-4 sm:p-5 shadow-[0_8px_24px_-4px_rgba(186,230,253,0.4)] mb-6 transition-all relative">
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
        {/* Left: Mascot Cáo Sunny + Speech Bubble */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Cáo Sunny Mascot Avatar (Interactive with speaking bob effect) */}
          <div
            onClick={handleReplayBilingual}
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#FEF3C7] border-4 border-[#F59E0B] p-1 flex items-center justify-center shrink-0 cursor-pointer shadow-sm transition-transform hover:scale-105 active:scale-95 relative ${
              isTalking ? 'animate-talk ring-4 ring-amber-300' : ''
            }`}
            title="Chạm vào Cáo Sunny để nghe hướng dẫn"
          >
            <svg className="w-full h-full drop-shadow-xs">
              <use href="#svg-sunny-fox"></use>
            </svg>

            {/* Speaking sound waves indicator */}
            {isTalking && (
              <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-1 text-xs animate-ping">
                🔊
              </div>
            )}
          </div>

          {/* Speech Subtitles & Information */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-amber-900 bg-amber-100 px-3 py-0.5 rounded-full font-display border border-amber-300">
                🦊 {badgeTitle}
              </span>
              {isTalking && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full font-display animate-pulse">
                  {activeLang === 'vi' ? 'Đang nói Tiếng Việt 🇻🇳' : 'Speaking English 🇬🇧'}
                </span>
              )}
            </div>

            {/* Vietnamese Subtitle */}
            <p className="text-sm sm:text-base font-extrabold text-[#0F172A] font-display leading-snug">
              🇻🇳 {viPrompt}
            </p>

            {/* English Target Subtitle */}
            <p className="text-xs sm:text-sm font-bold text-emerald-700 font-display mt-0.5 leading-snug">
              🇬🇧 "{enPrompt}"
            </p>
          </div>
        </div>

        {/* Right: Audio Action Buttons & Optional Extra Slot (e.g. error / progress count) */}
        <div className="flex items-center gap-2 self-stretch md:self-center justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          {/* Vietnamese Audio button */}
          <button
            type="button"
            onClick={handleSpeakVietnameseOnly}
            className="toy-btn toy-btn-green !min-h-[46px] !py-2 !px-3.5 text-xs sm:text-sm flex items-center gap-1.5"
            title="Nghe hướng dẫn Tiếng Việt"
          >
            <span>🇻🇳 Nghe hướng dẫn</span>
          </button>

          {/* English Audio button */}
          <button
            type="button"
            onClick={handleSpeakEnglishOnly}
            className="toy-btn toy-btn-sky !min-h-[46px] !py-2 !px-3 text-xs sm:text-sm flex items-center gap-1.5"
            title="Nghe từ tiếng Anh"
          >
            <span>🇬🇧 Nghe mẫu</span>
          </button>

          {extraRightSlot}
        </div>
      </div>
    </div>
  );
};

export default SunnyBilingualGuide;
