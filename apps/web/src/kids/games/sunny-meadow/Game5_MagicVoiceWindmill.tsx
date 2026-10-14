import React, { useState, useEffect } from 'react';
import { SunnySoundFX } from '../../services/audio/SunnySoundFX';
import { BilingualVoiceEngine } from '../../services/audio/BilingualVoiceEngine';
import SunnyBilingualGuide from '../../components/SunnyBilingualGuide';
import VictoryCelebrationModal from '../../components/VictoryCelebrationModal';
import { meadowStore } from '../../core/meadowStateStore';

interface Game5Props {
  onExit: () => void;
  onComplete?: () => void;
}

interface VoiceWord {
  word: string;
  phonetic: string;
  meaningVi: string;
  emoji: string;
}

const LEVEL_WORDS: Record<number, VoiceWord[]> = {
  1: [
    {
      word: 'SUNSHINE',
      phonetic: '/ˈsʌn.ʃaɪn/',
      meaningVi: 'Ánh Nắng Ban Mai',
      emoji: '☀️',
    },
    {
      word: 'RAINBOW',
      phonetic: '/ˈreɪn.bəʊ/',
      meaningVi: 'Cầu Vồng Bảy Sắc',
      emoji: '🌈',
    },
    {
      word: 'WIND',
      phonetic: '/wɪnd/',
      meaningVi: 'Cơn Gió Mát',
      emoji: '💨',
    },
  ],
  2: [
    {
      word: 'BUTTERFLY',
      phonetic: '/ˈbʌt.ə.flaɪ/',
      meaningVi: 'Chú Bướm Xinh',
      emoji: '🦋',
    },
    {
      word: 'MEADOW',
      phonetic: '/ˈmed.əʊ/',
      meaningVi: 'Đồng Cỏ Xanh',
      emoji: '🌿',
    },
    {
      word: 'STAR',
      phonetic: '/stɑːr/',
      meaningVi: 'Ngôi Sao Sáng',
      emoji: '⭐',
    },
  ],
};

export const Game5_MagicVoiceWindmill: React.FC<Game5Props> = ({ onExit, onComplete }) => {
  const [level, setLevel] = useState<number>(1);
  const totalLevels = 2;

  const [wordIdx, setWordIdx] = useState<number>(0);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [windPower, setWindPower] = useState<number>(0); // 0 to 100
  const [rotationDegrees, setRotationDegrees] = useState<number>(0);
  const [errorsCount, setErrorsCount] = useState<number>(0);
  const [showVictory, setShowVictory] = useState<boolean>(false);

  const currentWords = LEVEL_WORDS[level] || LEVEL_WORDS[1];
  const wordData = currentWords[wordIdx] || currentWords[0];

  useEffect(() => {
    setWordIdx(0);
    setWindPower(0);
    setErrorsCount(0);
    setShowVictory(false);
  }, [level]);

  useEffect(() => {
    setWindPower(0);
    setIsListening(false);
  }, [wordIdx]);

  const handleTriggerWind = () => {
    if (isListening || showVictory) return;

    SunnySoundFX.playButtonClick();
    setIsListening(true);
    SunnySoundFX.playCardSelect();

    // Check if Web Speech API SpeechRecognition is available
    const SpeechRec =
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition ||
      (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;

    let recognized = false;

    if (SpeechRec) {
      try {
        const recognition = new (SpeechRec as any)();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onresult = () => {
          recognized = true;
          spinWindmillSuccess();
        };

        recognition.onerror = () => {
          // Graceful fallback: spin after 1.2s
          setTimeout(() => {
            if (!recognized) spinWindmillSuccess();
          }, 1200);
        };

        recognition.onend = () => {
          if (!recognized) {
            spinWindmillSuccess();
          }
        };

        recognition.start();
        return;
      } catch {
        // Fallback immediately
      }
    }

    // Direct fallback if no microphone / SpeechRec
    setTimeout(() => {
      spinWindmillSuccess();
    }, 1000);
  };

  const spinWindmillSuccess = () => {
    SunnySoundFX.playCorrect();
    setWindPower(100);
    setRotationDegrees((prev) => prev + 720); // 2 full 360 spins

    BilingualVoiceEngine.speakBilingual(
      `Gió thổi vù vù! Bé phát âm từ ${wordData.word} (${wordData.meaningVi}) rất to và rõ!`,
      `Whoosh! Wonderful pronunciation of ${wordData.word}!`
    );

    setTimeout(() => {
      setIsListening(false);
      meadowStore.addStars(5);

      if (wordIdx < currentWords.length - 1) {
        setTimeout(() => {
          setWordIdx((prev) => prev + 1);
        }, 1000);
      } else {
        setShowVictory(true);
        if (onComplete) onComplete();
      }
    }, 1800);
  };

  const handleReplay = () => {
    setLevel(1);
    setWordIdx(0);
    setWindPower(0);
    setErrorsCount(0);
    setShowVictory(false);
  };

  const handleNextLevel = () => {
    if (level < totalLevels) {
      setLevel((prev) => prev + 1);
    }
  };

  const viPrompt = `Bé hãy đọc thật to từ tiếng Anh "${wordData.word}" (${wordData.meaningVi}) để tạo sức gió làm quay cối xay nhé!`;
  const enPrompt = `Say ${wordData.word} loudly to blow the magic wind!`;

  return (
    <div className="w-full max-w-5xl mx-auto select-none pb-16 px-3 sm:px-4 animate-fadeIn">
      {/* 1. Header with Back button and progress */}
      <header className="flex items-center justify-between gap-4 pt-2 pb-4 border-b border-[#BAE6FD]">
        <button
          type="button"
          onClick={() => {
            SunnySoundFX.playButtonClick();
            onExit();
          }}
          className="toy-btn bg-white hover:bg-slate-50 text-[#0F172A] border-2 border-[#CBD5E1] px-4 py-2 text-sm font-bold flex items-center gap-2"
        >
          <span>← Thoát Game</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold font-display border border-emerald-300">
            Cấp Độ {level} / {totalLevels}
          </span>
          <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-900 text-xs font-extrabold font-display border border-sky-300">
            Từ {wordIdx + 1} / {currentWords.length}
          </span>
          <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-extrabold font-display border border-rose-300">
            Lỗi: {errorsCount}
          </span>
        </div>
      </header>

      {/* 2. Bilingual Guide Bar with Sunny the Fox */}
      <div className="mt-4">
        <SunnyBilingualGuide
          viPrompt={viPrompt}
          enPrompt={enPrompt}
          badgeTitle="Cáo Sunny Luyện Nói"
          extraRightSlot={
            <div className="flex items-center gap-2 bg-sky-50 px-3.5 py-1.5 rounded-2xl border-2 border-sky-200">
              <span className="text-xs font-extrabold text-sky-900">Sức gió:</span>
              <span className="text-sm font-extrabold text-sky-950 font-display">
                {windPower}%
              </span>
            </div>
          }
        />
      </div>

      {/* 3. Anti-Cramped Game Stage Wrapper */}
      <div className="game-stage-wrapper">
        <div className="game-canvas-card flex flex-col items-center">
          {/* Windmill & Meadow Hill Stage */}
          <div className="w-full max-w-2xl bg-gradient-to-b from-[#BAE6FD] via-[#E0F2FE] to-[#D1FAE5] rounded-3xl p-6 sm:p-10 border-4 border-[#BAE6FD] flex flex-col items-center justify-center relative shadow-inner overflow-hidden min-h-[300px]">
            {/* Flying Wind Particles */}
            {isListening && (
              <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-10 left-0 w-24 h-1 bg-white/70 rounded-full animate-ping"></div>
                <div className="absolute top-24 left-10 w-36 h-1.5 bg-white/80 rounded-full animate-pulse"></div>
                <div className="absolute top-36 left-4 w-28 h-1 bg-sky-200/90 rounded-full animate-ping"></div>
              </div>
            )}

            {/* Target Pronunciation Card */}
            <div className="mb-6 bg-white/95 px-6 py-3 rounded-2xl border-3 border-sky-300 shadow-md flex items-center gap-4 z-10">
              <span className="text-3xl">{wordData.emoji}</span>
              <div>
                <span className="block text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-display tracking-wide">
                  {wordData.word}
                </span>
                <span className="block text-xs font-bold text-slate-500 font-mono">
                  {wordData.phonetic} • {wordData.meaningVi}
                </span>
              </div>
            </div>

            {/* The 360-Degree Spinning Windmill */}
            <div className="relative w-44 h-52 sm:w-52 sm:h-60 z-10">
              {/* Windmill Base */}
              <div className="w-full h-full">
                <svg className="w-full h-full drop-shadow-lg">
                  <polygon points="62,90 118,90 132,185 48,185" fill="#FFFDF5" stroke="#CBD5E1" strokeWidth="4" strokeLinejoin="round" />
                  <path d="M54 88 Q90 56 126 88 Z" fill="#FF758F" stroke="#C9184A" strokeWidth="3" />
                  <path d="M76 185 L76 152 A14 14 0 0 1 104 152 L104 185 Z" fill="#B45309" />
                </svg>
              </div>

              {/* Windmill Blades (Rotates 360 degrees on wind) */}
              <div
                className="absolute top-[38px] left-[52px] sm:top-[44px] sm:left-[60px] w-20 h-20 transition-transform duration-1000 ease-out"
                style={{ transform: `rotate(${rotationDegrees}deg)` }}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Top Blade */}
                  <div className="absolute top-[-30px] w-4 h-12 bg-amber-300 border-2 border-amber-500 rounded-lg"></div>
                  {/* Bottom Blade */}
                  <div className="absolute bottom-[-30px] w-4 h-12 bg-amber-300 border-2 border-amber-500 rounded-lg"></div>
                  {/* Left Blade */}
                  <div className="absolute left-[-30px] w-12 h-4 bg-sky-300 border-2 border-sky-500 rounded-lg"></div>
                  {/* Right Blade */}
                  <div className="absolute right-[-30px] w-12 h-4 bg-sky-300 border-2 border-sky-500 rounded-lg"></div>
                  {/* Center Hub */}
                  <div className="w-6 h-6 rounded-full bg-rose-400 border-2 border-white shadow-xs z-10"></div>
                </div>
              </div>
            </div>

            {/* Listening Indicator */}
            {isListening && (
              <div className="mt-4 bg-sky-500 text-white font-extrabold text-xs sm:text-sm px-4 py-1.5 rounded-full shadow-md animate-pulse z-10 flex items-center gap-2">
                <span>🎙️ Đang lắng nghe giọng bé... Bé hãy đọc to "{wordData.word}" nhé!</span>
              </div>
            )}
          </div>

          {/* Speech Trigger Action Area */}
          <div className="w-full mt-8 flex flex-col items-center">
            <button
              type="button"
              onClick={handleTriggerWind}
              disabled={isListening}
              className={`toy-btn bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 text-white px-8 sm:px-12 py-4 rounded-3xl text-lg sm:text-xl font-extrabold font-display shadow-lg border-b-6 border-blue-700 flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 ${
                isListening ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <span className="text-2xl">🌬️</span>
              <span>{isListening ? 'Đang Thổi Gió...' : 'Bấm Nói / Thổi Gió Phép Thuật →'}</span>
            </button>
            <p className="text-xs font-bold text-slate-500 mt-3 text-center">
              💡 Bé có thể đọc to vào Micro hoặc bấm nút để tạo sức gió quay cối xay 360 độ!
            </p>
          </div>
        </div>
      </div>

      {/* Victory Celebration Modal */}
      <VictoryCelebrationModal
        isOpen={showVictory}
        errorsCount={errorsCount}
        gameTitle="Cối Xay Gió Giọng Nói"
        currentLevel={level}
        totalLevels={totalLevels}
        onReplay={handleReplay}
        onNextLevel={handleNextLevel}
        onExit={onExit}
      />
    </div>
  );
};

export default Game5_MagicVoiceWindmill;
