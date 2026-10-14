import React, { useState, useEffect } from 'react';
import { SunnySoundFX } from '../../services/audio/SunnySoundFX';
import { BilingualVoiceEngine } from '../../services/audio/BilingualVoiceEngine';
import SunnyBilingualGuide from '../../components/SunnyBilingualGuide';
import VictoryCelebrationModal from '../../components/VictoryCelebrationModal';
import { meadowStore } from '../../core/meadowStateStore';

interface Game4Props {
  onExit: () => void;
  onComplete?: () => void;
}

interface PhonicsWord {
  word: string;
  phonemes: string[];
  meaningVi: string;
  options: string[];
}

const LEVEL_WORDS: Record<number, PhonicsWord[]> = {
  1: [
    {
      word: 'FOX',
      phonemes: ['F', 'O', 'X'],
      meaningVi: 'Bạn Cáo',
      options: ['F', 'O', 'X', 'B', 'M'],
    },
    {
      word: 'SUN',
      phonemes: ['S', 'U', 'N'],
      meaningVi: 'Mặt Trời',
      options: ['S', 'U', 'N', 'T', 'P'],
    },
    {
      word: 'CAT',
      phonemes: ['C', 'A', 'T'],
      meaningVi: 'Mèo Con',
      options: ['C', 'A', 'T', 'H', 'D'],
    },
  ],
  2: [
    {
      word: 'FROG',
      phonemes: ['F', 'R', 'O', 'G'],
      meaningVi: 'Chú Ếch',
      options: ['F', 'R', 'O', 'G', 'L', 'K'],
    },
    {
      word: 'BIRD',
      phonemes: ['B', 'I', 'R', 'D'],
      meaningVi: 'Chú Chim Non',
      options: ['B', 'I', 'R', 'D', 'W', 'S'],
    },
    {
      word: 'TREE',
      phonemes: ['T', 'R', 'E', 'E'],
      meaningVi: 'Cây Cổ Thụ',
      options: ['T', 'R', 'E', 'P', 'M'],
    },
  ],
};

export const Game4_FireflyPhonics: React.FC<Game4Props> = ({ onExit, onComplete }) => {
  const [level, setLevel] = useState<number>(1);
  const totalLevels = 2;

  const [wordIdx, setWordIdx] = useState<number>(0);
  const [litLetters, setLitLetters] = useState<string[]>([]);
  const [errorsCount, setErrorsCount] = useState<number>(0);
  const [showVictory, setShowVictory] = useState<boolean>(false);

  const currentWords = LEVEL_WORDS[level] || LEVEL_WORDS[1];
  const wordData = currentWords[wordIdx] || currentWords[0];
  const targetLetters = wordData.word.split('');

  useEffect(() => {
    setWordIdx(0);
    setLitLetters([]);
    setErrorsCount(0);
    setShowVictory(false);
  }, [level]);

  useEffect(() => {
    setLitLetters([]);
  }, [wordIdx]);

  const handleCatchFirefly = (letter: string) => {
    if (showVictory) return;

    const nextIdxNeeded = litLetters.length;
    const expectedLetter = targetLetters[nextIdxNeeded];

    if (letter === expectedLetter) {
      // Correct firefly!
      SunnySoundFX.playCorrect();
      BilingualVoiceEngine.speakEnglish(letter);

      const nextLit = [...litLetters, letter];
      setLitLetters(nextLit);

      if (nextLit.length === targetLetters.length) {
        // Complete word finished!
        meadowStore.addStars(5);

        setTimeout(() => {
          BilingualVoiceEngine.speakBilingual(
            `Bé giỏi quá! Từ ${wordData.word} có nghĩa là ${wordData.meaningVi}!`,
            `Excellent! ${wordData.word}! Good job!`
          );

          setTimeout(() => {
            if (wordIdx < currentWords.length - 1) {
              setWordIdx((prev) => prev + 1);
            } else {
              setShowVictory(true);
              if (onComplete) onComplete();
            }
          }, 1400);
        }, 500);
      }
    } else {
      // Wrong firefly letter
      setErrorsCount((prev) => prev + 1);
      SunnySoundFX.playWrong();
      BilingualVoiceEngine.speakBilingual(
        `Đó là chữ ${letter}. Bé hãy tìm chữ ${expectedLetter} nhé!`,
        `That is letter ${letter}. Let's find ${expectedLetter}!`
      );
    }
  };

  const handleReplay = () => {
    setLevel(1);
    setWordIdx(0);
    setLitLetters([]);
    setErrorsCount(0);
    setShowVictory(false);
  };

  const handleNextLevel = () => {
    if (level < totalLevels) {
      setLevel((prev) => prev + 1);
    }
  };

  const viPrompt = `Bé hãy bắt các chú đom đóm mang chữ cái để ghép thành từ ${wordData.word} (${wordData.meaningVi}) nhé!`;
  const enPrompt = `Catch the glowing fireflies to spell ${wordData.word}!`;

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
          <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 text-xs font-extrabold font-display border border-indigo-300">
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
          badgeTitle="Cáo Sunny Đánh Vần"
          extraRightSlot={
            <div className="flex items-center gap-2 bg-indigo-50 px-3.5 py-1.5 rounded-2xl border-2 border-indigo-200">
              <span className="text-xs font-extrabold text-indigo-900">Từ mục tiêu:</span>
              <span className="text-sm font-extrabold text-indigo-950 font-display tracking-widest">
                {wordData.word}
              </span>
            </div>
          }
        />
      </div>

      {/* 3. Anti-Cramped Game Stage Wrapper */}
      <div className="game-stage-wrapper">
        <div className="game-canvas-card flex flex-col items-center">
          {/* Night Meadow Lantern Stage */}
          <div className="w-full max-w-2xl bg-gradient-to-b from-[#1E1B4B] via-[#0F172A] to-[#1E293B] rounded-3xl p-6 sm:p-10 border-4 border-[#6366F1] flex flex-col items-center justify-center relative shadow-2xl overflow-hidden min-h-[260px]">
            {/* Twinkling Firefly Forest Stars */}
            <div className="absolute inset-0 pointer-events-none opacity-60">
              <div className="absolute top-4 left-10 w-2 h-2 rounded-full bg-amber-300 animate-ping"></div>
              <div className="absolute top-12 right-16 w-3 h-3 rounded-full bg-teal-300 animate-pulse"></div>
              <div className="absolute bottom-8 left-20 w-2.5 h-2.5 rounded-full bg-indigo-300 animate-ping"></div>
            </div>

            {/* Target Meaning Header */}
            <div className="mb-6 bg-white/10 backdrop-blur-md px-5 py-2 rounded-full border border-indigo-300/40 text-center z-10">
              <span className="text-xs sm:text-sm font-bold text-indigo-200 font-display">
                Nghĩa của từ: <strong className="text-amber-300 text-base">{wordData.meaningVi}</strong>
              </span>
            </div>

            {/* Lantern Word Slots */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 z-10">
              {targetLetters.map((char, idx) => {
                const isLit = idx < litLetters.length;
                return (
                  <div
                    key={idx}
                    className={`w-16 h-24 sm:w-20 sm:h-28 rounded-2xl border-3 flex flex-col items-center justify-center transition-all duration-300 ${
                      isLit
                        ? 'bg-amber-400/90 border-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.8)] scale-105'
                        : 'bg-slate-800/80 border-dashed border-indigo-400/50'
                    }`}
                  >
                    <svg className="w-8 h-8 opacity-60 mb-1 text-amber-200">
                      <use href="#svg-magic-lantern"></use>
                    </svg>
                    <span
                      className={`text-2xl sm:text-3xl font-extrabold font-display ${
                        isLit ? 'text-amber-950' : 'text-slate-500'
                      }`}
                    >
                      {isLit ? char : '?'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Glowing Fireflies Selection Area */}
          <div className="w-full mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-extrabold text-[#0F172A] font-display">
                ✨ Chạm Đom Đóm Phát Sáng Mang Chữ Cái Cần Ghép:
              </h3>
              <span className="text-xs font-bold text-slate-500 font-body">
                Cần chữ: <strong className="text-indigo-600 font-display">{targetLetters[litLetters.length] || 'Hoàn thành'}</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
              {wordData.options.map((optionLetter, idx) => (
                <button
                  key={`${optionLetter}_${idx}`}
                  type="button"
                  onClick={() => handleCatchFirefly(optionLetter)}
                  className="toy-btn bg-[#FFFDF5] hover:bg-amber-50 border-3 border-amber-400 hover:border-amber-500 rounded-3xl p-4 sm:p-5 flex flex-col items-center justify-center gap-2 group transition-transform hover:scale-110 active:scale-95 shadow-md ring-2 ring-amber-200 min-w-[90px] sm:min-w-[110px]"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 group-hover:animate-bounce-subtle">
                    <svg className="w-full h-full drop-shadow-md">
                      <use href="#svg-glow-firefly"></use>
                    </svg>
                  </div>
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-display">
                    {optionLetter}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Victory Celebration Modal */}
      <VictoryCelebrationModal
        isOpen={showVictory}
        errorsCount={errorsCount}
        gameTitle="Đom Đóm Thắp Đèn Đánh Vần"
        currentLevel={level}
        totalLevels={totalLevels}
        onReplay={handleReplay}
        onNextLevel={handleNextLevel}
        onExit={onExit}
      />
    </div>
  );
};

export default Game4_FireflyPhonics;
