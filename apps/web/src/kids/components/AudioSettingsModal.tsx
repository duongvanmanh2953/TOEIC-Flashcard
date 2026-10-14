import React, { useState, useEffect } from 'react';
import { SunnyAudioEngine } from '../services/audio/SunnyAudioEngine';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({ isOpen, onClose }) => {
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(() => SunnyAudioEngine.isBGMEnabled());
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(() => SunnyAudioEngine.isSFXEnabled());
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => SunnyAudioEngine.isVoiceEnabled());
  const [bgmVol, setBgmVol] = useState<number>(() => Math.round(SunnyAudioEngine.getBGMVolume() * 100));
  const [sfxVol, setSfxVol] = useState<number>(() => Math.round(SunnyAudioEngine.getSFXVolume() * 100));

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      setBgmEnabled(SunnyAudioEngine.isBGMEnabled());
      setSfxEnabled(SunnyAudioEngine.isSFXEnabled());
      setVoiceEnabled(SunnyAudioEngine.isVoiceEnabled());
      setBgmVol(Math.round(SunnyAudioEngine.getBGMVolume() * 100));
      setSfxVol(Math.round(SunnyAudioEngine.getSFXVolume() * 100));
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleBgm = (checked: boolean) => {
    setBgmEnabled(checked);
    SunnyAudioEngine.setBGMEnabled(checked);
    SunnyAudioEngine.playClick();
  };

  const handleBgmVolume = (val: number) => {
    setBgmVol(val);
    SunnyAudioEngine.setBGMVolume(val / 100);
  };

  const handleToggleSfx = (checked: boolean) => {
    setSfxEnabled(checked);
    SunnyAudioEngine.setSFXEnabled(checked);
    if (checked) {
      SunnyAudioEngine.playClick();
    }
  };

  const handleSfxVolume = (val: number) => {
    setSfxVol(val);
    SunnyAudioEngine.setSFXVolume(val / 100);
    SunnyAudioEngine.playClick();
  };

  const handleToggleVoice = (checked: boolean) => {
    setVoiceEnabled(checked);
    SunnyAudioEngine.setVoiceEnabled(checked);
    SunnyAudioEngine.playClick();
  };

  const handleTestSound = () => {
    SunnyAudioEngine.testSoundAndVoice();
  };

  const handleClose = () => {
    SunnyAudioEngine.playClick();
    onClose();
  };

  return (
    <div
      id="settings-modal"
      className="fullscreen-modal-overlay active"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="w-full max-w-[480px] bg-white border-[5px] border-[#7DD3FC] rounded-[36px] p-7 shadow-2xl animate-scaleUp relative select-none"
        style={{ borderBottom: '10px solid #0284C7' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-[52px] h-[52px] shrink-0">
              <svg className="w-full h-full drop-shadow-xs">
                <use href="#svg-sunny-fox"></use>
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] font-display">
              ⚙️ Cài Đặt Âm Thanh
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-11 h-11 rounded-full border-3 border-rose-300 bg-rose-100 text-rose-700 text-lg font-black flex items-center justify-center cursor-pointer hover:bg-rose-200 transition-colors"
            aria-label="Đóng cài đặt"
          >
            ✕
          </button>
        </div>

        {/* 1. Nhạc nền Rừng Xanh (BGM) */}
        <div className="bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-[20px] p-3.5 sm:p-4 mb-3.5">
          <div className="flex justify-between items-center mb-2">
            <span className="font-extrabold text-[#0F172A] text-sm sm:text-base font-display">
              🎵 Nhạc nền Rừng Xanh (BGM)
            </span>
            <input
              type="checkbox"
              id="toggle-bgm"
              checked={bgmEnabled}
              onChange={(e) => handleToggleBgm(e.target.checked)}
              className="w-6 h-6 accent-emerald-500 cursor-pointer"
            />
          </div>
          <input
            type="range"
            id="slider-bgm"
            min="0"
            max="100"
            value={bgmVol}
            disabled={!bgmEnabled}
            onChange={(e) => handleBgmVolume(Number(e.target.value))}
            className="w-full accent-sky-500 cursor-pointer disabled:opacity-40"
          />
        </div>

        {/* 2. Hiệu ứng Âm thanh (SFX) */}
        <div className="bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-[20px] p-3.5 sm:p-4 mb-3.5">
          <div className="flex justify-between items-center mb-2">
            <span className="font-extrabold text-[#0F172A] text-sm sm:text-base font-display">
              🔔 Âm thanh Hiệu ứng (SFX)
            </span>
            <input
              type="checkbox"
              id="toggle-sfx"
              checked={sfxEnabled}
              onChange={(e) => handleToggleSfx(e.target.checked)}
              className="w-6 h-6 accent-emerald-500 cursor-pointer"
            />
          </div>
          <input
            type="range"
            id="slider-sfx"
            min="0"
            max="100"
            value={sfxVol}
            disabled={!sfxEnabled}
            onChange={(e) => handleSfxVolume(Number(e.target.value))}
            className="w-full accent-sky-500 cursor-pointer disabled:opacity-40"
          />
        </div>

        {/* 3. Giọng đọc Cáo Sunny (Tiếng Việt + Tiếng Anh) */}
        <div className="bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-[20px] p-3.5 sm:p-4 mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="font-extrabold text-[#0F172A] text-sm sm:text-base font-display">
              🗣️ Giọng Cáo Sunny (VI + EN)
            </span>
            <input
              type="checkbox"
              id="toggle-voice"
              checked={voiceEnabled}
              onChange={(e) => handleToggleVoice(e.target.checked)}
              className="w-6 h-6 accent-emerald-500 cursor-pointer"
            />
          </div>
          <div className="mt-2">
            <button
              type="button"
              onClick={handleTestSound}
              className="w-full py-2.5 px-3 rounded-xl border-2 border-sky-300 bg-sky-100 text-sky-800 font-extrabold text-xs sm:text-sm hover:bg-sky-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🔊 Nghe thử giọng Cáo Sunny & Nhạc</span>
            </button>
          </div>
        </div>

        {/* Save & Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="w-full py-3.5 rounded-2xl border-3 border-emerald-300 bg-[#22C55E] hover:bg-emerald-600 text-white font-black text-lg shadow-md cursor-pointer transition-transform active:scale-98 font-display"
          style={{ borderBottom: '6px solid #15803D' }}
        >
          ✅ Lưu & Đóng
        </button>
      </div>
    </div>
  );
};

export default AudioSettingsModal;
