import React, { useState, useEffect } from 'react';
import { SunnyAudioEngine } from '../services/audio/SunnyAudioEngine';

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
  const [activeLang, setActiveLang] = useState<'vi' | 'en' | null>(null);

  useEffect(() => {
    const unsub = SunnyAudioEngine.onSpeakingChange((speaking, lang) => {
      setIsTalking(speaking);
      setActiveLang(lang);
    });

    if (autoSpeakOnMount) {
      const timer = setTimeout(() => {
        SunnyAudioEngine.speakBilingual(viPrompt, enPrompt);
      }, 500);
      return () => {
        clearTimeout(timer);
        unsub();
      };
    }

    return () => unsub();
  }, [viPrompt, enPrompt, autoSpeakOnMount]);

  const handleReplayBilingual = () => {
    SunnyAudioEngine.playClick();
    SunnyAudioEngine.speakBilingual(viPrompt, enPrompt);
  };

  const handleSpeakVietnameseOnly = () => {
    SunnyAudioEngine.playClick();
    SunnyAudioEngine.speakVietnamese(viPrompt);
  };

  const handleSpeakEnglishOnly = () => {
    SunnyAudioEngine.playClick();
    SunnyAudioEngine.speakEnglish(enPrompt);
  };

  return (
    <div className="mascot-guide-banner mb-6 transition-all relative">
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4 w-full">
        {/* Left: Mascot Cáo Sunny + Speech Bubble */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Cáo Sunny Mascot Avatar */}
          <div
            onClick={handleReplayBilingual}
            className={`mascot-avatar-wrap relative ${
              isTalking ? 'animate-talk ring-4 ring-amber-400' : ''
            }`}
            title="Chạm vào Cáo Sunny để nghe hướng dẫn"
          >
            <svg className="w-16 h-16 drop-shadow-xs">
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
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-3 py-0.5 rounded-full font-display border border-amber-300">
                {badgeTitle}
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
            <p className="text-xs sm:text-sm font-bold text-[#EA580C] font-display mt-0.5">
              🇬🇧 "{enPrompt}"
            </p>
          </div>
        </div>

        {/* Right: Audio Action Buttons & Optional Extra Slot */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          {extraRightSlot}

          {/* Speak Vietnamese button */}
          <button
            type="button"
            onClick={handleSpeakVietnameseOnly}
            title="Nghe Cáo Sunny nói Tiếng Việt"
            className="toy-btn bg-amber-50 hover:bg-amber-100 text-amber-950 border-2 border-amber-300 px-3 py-1.5 rounded-xl font-display font-extrabold text-xs flex items-center gap-1 shadow-2xs active:scale-95"
          >
            <span>🇻🇳 Nghe</span>
          </button>

          {/* Speak English button */}
          <button
            type="button"
            onClick={handleSpeakEnglishOnly}
            title="Nghe mẫu Tiếng Anh chuẩn"
            className="toy-btn bg-sky-50 hover:bg-sky-100 text-sky-950 border-2 border-sky-300 px-3 py-1.5 rounded-xl font-display font-extrabold text-xs flex items-center gap-1 shadow-2xs active:scale-95"
          >
            <span>🇬🇧 Tiếng Anh</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SunnyBilingualGuide;
