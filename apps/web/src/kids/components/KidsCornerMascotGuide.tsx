import React, { useState, useEffect } from 'react';
import { Volume2, X, Languages, Sparkles, Lightbulb } from 'lucide-react';
import { soundManager } from '../services/sound/KidsSoundManager';
import { voiceService } from '../services/voice/voiceService';

interface KidsCornerMascotGuideProps {
  instructionVi?: string;
  instructionEn?: string;
  targetWord?: string;
  onReplayAudio?: () => void;
  position?: 'bottom-left' | 'bottom-right';
  className?: string;
}

export const KidsCornerMascotGuide: React.FC<KidsCornerMascotGuideProps> = ({
  instructionVi,
  instructionEn,
  targetWord,
  onReplayAudio,
  position = 'bottom-left',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Auto-read instruction when Bobby guide appears on screen
  useEffect(() => {
    if (soundManager.getSoundMode() === 'muted') return;

    const timer = setTimeout(() => {
      handleSpeakAll();
    }, 750);

    return () => {
      clearTimeout(timer);
    };
  }, [instructionVi, targetWord]);

  // If no instructions are provided for this screen, do not render
  if (!instructionVi && !instructionEn && !targetWord) {
    return null;
  }

  const handleSpeakAll = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundManager.playPop();

    if (onReplayAudio) {
      onReplayAudio();
      return;
    }

    setIsSpeaking(true);
    if (instructionVi) {
      voiceService.speakVietnameseNorthern(instructionVi, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => {
          if (targetWord || instructionEn) {
            setTimeout(() => {
              voiceService.speakEnglish(targetWord || instructionEn || '', {
                onEnd: () => setIsSpeaking(false),
                onError: () => setIsSpeaking(false),
              });
            }, 250);
          } else {
            setIsSpeaking(false);
          }
        },
        onError: () => {
          setIsSpeaking(false);
        },
      });
    } else if (targetWord || instructionEn) {
      voiceService.speakEnglish(targetWord || instructionEn || '', {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  const handleSpeakViOnly = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!instructionVi) return;
    soundManager.playPop();
    setIsSpeaking(true);
    voiceService.speakVietnameseNorthern(instructionVi, {
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const handleSpeakEnOnly = (e: React.MouseEvent) => {
    e.stopPropagation();
    const enText = targetWord || instructionEn;
    if (!enText) return;
    soundManager.playPop();
    setIsSpeaking(true);
    voiceService.speakEnglish(enText, {
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const toggleOpen = () => {
    soundManager.playPop();
    if (!isOpen) {
      setIsOpen(true);
      handleSpeakAll();
    } else {
      setIsOpen(false);
      voiceService.stop();
      setIsSpeaking(false);
    }
  };

  const posClasses =
    position === 'bottom-left'
      ? 'bottom-3 left-3 sm:bottom-4 sm:left-4 items-start'
      : 'bottom-3 right-3 sm:bottom-4 sm:right-4 items-end';

  return (
    <div
      className={`fixed ${posClasses} z-40 flex flex-col pointer-events-auto select-none max-w-[calc(100vw-24px)] ${className}`}
    >
      {/* 1. Expandable Instruction Speech Bubble */}
      {isOpen && (
        <div className="mb-2 w-72 sm:w-80 p-3 sm:p-3.5 rounded-3xl bg-white/95 backdrop-blur-md border-2 border-amber-300 shadow-xl text-slate-900 animate-scaleUp relative">
          {/* Header row */}
          <div className="flex items-center justify-between pb-1.5 border-b border-amber-100">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-950">
              <Lightbulb className="w-4 h-4 text-amber-500 animate-bounce" />
              <span>Gấu Bobby Hướng Dẫn</span>
            </div>
            <button
              onClick={() => {
                soundManager.playPop();
                setIsOpen(false);
                voiceService.stop();
              }}
              className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
              title="Thu nhỏ để không vướng màn hình"
              aria-label="Thu nhỏ"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Content Instruction text */}
          <div className="py-2 space-y-1">
            {instructionVi && (
              <p className="text-xs sm:text-sm font-black text-slate-950 leading-snug">
                {instructionVi}
              </p>
            )}
            {instructionEn && (
              <p className="text-[11px] sm:text-xs font-bold text-sky-700 leading-snug">
                👉 "{instructionEn}"
              </p>
            )}
          </div>

          {/* Action buttons bar */}
          <div className="pt-1.5 border-t border-amber-100 flex items-center gap-1.5 justify-between">
            <button
              onClick={handleSpeakAll}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs active:scale-95 ${
                isSpeaking
                  ? 'bg-amber-400 text-amber-950 border border-amber-500 animate-pulse'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
              }`}
              title="Đọc lại toàn bộ hướng dẫn"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-800" />
              <span>Đọc lại</span>
            </button>

            {instructionVi && (
              <button
                onClick={handleSpeakViOnly}
                className="py-1.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-[11px] font-black cursor-pointer active:scale-95"
                title="Phát tiếng Việt"
              >
                <Languages className="w-3 h-3 text-emerald-600 inline mr-1" />
                <span>Tiếng Việt</span>
              </button>
            )}

            {(targetWord || instructionEn) && (
              <button
                onClick={handleSpeakEnOnly}
                className="py-1.5 px-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 text-[11px] font-black cursor-pointer active:scale-95"
                title="Nghe phát âm chuẩn tiếng Anh"
              >
                <span>English</span>
              </button>
            )}
          </div>

          {/* Bubble pointer tail */}
          <div
            className={`absolute -bottom-2 ${
              position === 'bottom-left' ? 'left-6' : 'right-6'
            } w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-amber-300`}
          />
        </div>
      )}

      {/* 2. Docked Bobby Mascot Avatar in Corner */}
      <div
        onClick={toggleOpen}
        className="group relative cursor-pointer active:scale-95 transition-transform"
        title={isOpen ? 'Bấm vào Bobby để thu gọn cho đỡ vướng' : 'Bấm vào Bobby để nghe lại hướng dẫn & phát âm'}
      >
        <div
          className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-orange-400 p-1 border-2 border-white shadow-lg flex items-center justify-center transition-all ${
            isSpeaking ? 'ring-4 ring-amber-400/60 scale-105' : 'hover:scale-105'
          }`}
        >
          <div className="w-full h-full rounded-xl bg-white/95 flex items-center justify-center text-2xl sm:text-3xl select-none shadow-inner">
            🐻
          </div>
        </div>

        {/* Small corner status badge */}
        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-500 border-2 border-white text-white flex items-center justify-center text-[10px] font-black shadow-xs">
          {isOpen ? (
            <Volume2 className="w-3 h-3 animate-pulse" />
          ) : (
            <Lightbulb className="w-3 h-3 text-white" />
          )}
        </div>
      </div>
    </div>
  );
};

export default KidsCornerMascotGuide;
