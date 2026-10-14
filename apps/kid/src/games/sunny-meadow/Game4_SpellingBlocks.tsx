import React, { useState, useEffect } from 'react';
import { SunnyAudioEngine } from '../../services/audio/SunnyAudioEngine';
import SunnyBilingualGuide from '../../components/SunnyBilingualGuide';
import VictoryCelebrationModal from '../../components/VictoryCelebrationModal';
import { meadowStore } from '../../core/meadowStateStore';

interface Game4Props {
  onExit: () => void;
  onComplete?: () => void;
}

interface SpellingWord {
  word: string;
  meaningVi: string;
  symbol: string;
  letterPool: string[];
}

const LEVEL_WORDS: Record<number, SpellingWord[]> = {
  1: [
    {
      word: 'SUN',
      meaningVi: 'Mặt Trời',
      symbol: '#svg-sun',
      letterPool: ['S', 'U', 'N', 'B', 'T'],
    },
    {
      word: 'CAT',
      meaningVi: 'Con Mèo',
      symbol: '#svg-cat',
      letterPool: ['C', 'A', 'T', 'H', 'D'],
    },
    {
      word: 'DOG',
      meaningVi: 'Con Chó',
      symbol: '#svg-dog',
      letterPool: ['D', 'O', 'G', 'P', 'R'],
    },
  ],
  2: [
    {
      word: 'FROG',
      meaningVi: 'Con Ếch',
      symbol: '#svg-frog',
      letterPool: ['F', 'R', 'O', 'G', 'L', 'S'],
    },
    {
      word: 'TREE',
      meaningVi: 'Cây Xanh',
      symbol: '#svg-tree',
      letterPool: ['T', 'R', 'E', 'E', 'B', 'M'],
    },
    {
      word: 'APPLE',
      meaningVi: 'Quả Táo',
      symbol: '#svg-apple',
      letterPool: ['A', 'P', 'P', 'L', 'E', 'O'],
    },
  ],
};

export const Game4_SpellingBlocks: React.FC<Game4Props> = ({ onExit, onComplete }) => {
  const [level, setLevel] = useState<number>(1);
  const totalLevels = 2;

  const [wordIdx, setWordIdx] = useState<number>(0);
  const [placedLetters, setPlacedLetters] = useState<string[]>([]);
  const [errorsCount, setErrorsCount] = useState<number>(0);
  const [showVictory, setShowVictory] = useState<boolean>(false);

  const currentWords = LEVEL_WORDS[level] || LEVEL_WORDS[1];
  const target = currentWords[wordIdx] || currentWords[0];
  const targetLetters = target.word.split('');

  useEffect(() => {
    setWordIdx(0);
    setPlacedLetters([]);
    setErrorsCount(0);
    setShowVictory(false);
  }, [level]);

  useEffect(() => {
    setPlacedLetters([]);
  }, [wordIdx]);

  const handleSelectLetter = (letter: string) => {
    if (showVictory) return;

    const nextIdxNeeded = placedLetters.length;
    const expectedLetter = targetLetters[nextIdxNeeded];

    if (letter === expectedLetter) {
      // Correct letter
      SunnyAudioEngine.playCorrect();
      SunnyAudioEngine.speakEnglish(letter);

      const nextPlaced = [...placedLetters, letter];
      setPlacedLetters(nextPlaced);

      if (nextPlaced.length === targetLetters.length) {
        // Complete word!
        meadowStore.addStars(5);

        setTimeout(() => {
          SunnyAudioEngine.speakBilingual(
            `Tuyệt vời! ${target.word} là ${target.meaningVi}!`,
            `Excellent! ${target.word}! Great spelling!`
          );

          setTimeout(() => {
            if (wordIdx < currentWords.length - 1) {
              setWordIdx((prev) => prev + 1);
            } else {
              setShowVictory(true);
              if (onComplete) onComplete();
            }
          }, 1200);
        }, 500);
      }
    } else {
      // Wrong letter
      setErrorsCount((prev) => prev + 1);
      SunnyAudioEngine.playWrong();
      SunnyAudioEngine.speakBilingual(
        `Đó là chữ ${letter}. Bé hãy tìm chữ ${expectedLetter} nhé!`,
        `That is letter ${letter}. Let's find ${expectedLetter}!`
      );
    }
  };

  const handleReplay = () => {
    setLevel(1);
    setWordIdx(0);
    setPlacedLetters([]);
    setErrorsCount(0);
    setShowVictory(false);
  };

  const handleNextLevel = () => {
    if (level < totalLevels) {
      setLevel((prev) => prev + 1);
    }
  };

  const viPrompt = `Bé hãy nhìn hình và chạm vào các khối gỗ chữ cái để đánh vần từ ${target.word} (${target.meaningVi}) nhé!`;
  const enPrompt = `Tap the wooden letter blocks to spell ${target.word}!`;

  return (
    <div className="game-viewport select-none animate-fadeIn">
      {/* 1. Header Navigation Bar */}
      <div className="w-full max-w-[920px] flex items-center justify-between pb-2 border-b border-[#BAE6FD]">
        <button
          type="button"
          onClick={() => {
            SunnyAudioEngine.playClick();
            onExit();
          }}
          className="toy-btn bg-white hover:bg-slate-50 text-[#0F172A] border-2 border-[#CBD5E1] px-4 py-2 text-sm font-bold flex items-center gap-2 shadow-xs"
        >
          <span>← Thoát Game</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black font-display border border-emerald-300">
            Cấp Độ {level} / {totalLevels}
          </span>
          <span className="px-3.5 py-1 rounded-full bg-indigo-100 text-indigo-900 text-xs font-black font-display border border-indigo-300">
            Từ {wordIdx + 1} / {currentWords.length}
          </span>
          <span className="px-3.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black font-display border border-rose-300">
            Lỗi: {errorsCount}
          </span>
        </div>
      </div>

      {/* 2. Bilingual Guide Bar with Sunny Fox */}
      <SunnyBilingualGuide
        viPrompt={viPrompt}
        enPrompt={enPrompt}
        badgeTitle="Đánh Vần Khối Gỗ"
      />

      {/* 3. Central Stage Card (Fix Bug #5) */}
      <div className="game-board-stage">
        {/* Large SVG Illustration Banner above spelling slots (MANDATORY in V4.0) */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-[#FFFDF5] border-4 border-[#7DD3FC] p-3.5 flex items-center justify-center shadow-sm relative group">
            <svg className="w-full h-full drop-shadow-md group-hover:scale-105 transition-transform">
              <use href={target.symbol}></use>
            </svg>

            {/* Pronounce target word speaker */}
            <button
              type="button"
              onClick={() => {
                SunnyAudioEngine.playClick();
                SunnyAudioEngine.speakEnglish(target.word);
              }}
              title="Nghe phát âm từ này"
              className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-amber-400 border-2 border-amber-600 text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 cursor-pointer text-base"
            >
              🔊
            </button>
          </div>
          <span className="mt-2 text-sm sm:text-base font-extrabold text-[#0F172A] font-display">
            {target.meaningVi} ({target.word})
          </span>
        </div>

        {/* Word Spelling Slots */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 mb-8">
          {targetLetters.map((char, idx) => {
            const isFilled = idx < placedLetters.length;
            return (
              <div
                key={idx}
                className={`w-14 h-16 sm:w-16 sm:h-20 rounded-2xl border-3 flex items-center justify-center transition-all duration-200 ${
                  isFilled
                    ? 'bg-amber-100 border-amber-400 text-amber-950 scale-105 shadow-sm'
                    : 'bg-slate-50 border-dashed border-slate-300 text-slate-300'
                }`}
              >
                <span className="text-2xl sm:text-3xl font-black font-display">
                  {isFilled ? char : '_'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Letter Blocks (56px x 56px, perfectly centered, font contained) */}
        <div className="w-full">
          <p className="text-xs sm:text-sm font-extrabold text-slate-500 font-display mb-3 text-center">
            Chọn chữ cái tiếp theo: <strong className="text-indigo-600">{targetLetters[placedLetters.length] || 'Đã xong'}</strong>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-lg mx-auto">
            {target.letterPool.map((letter, idx) => (
              <button
                key={`${letter}_${idx}`}
                type="button"
                onClick={() => handleSelectLetter(letter)}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#FFFDF5] hover:bg-amber-50 border-3 border-amber-400 hover:border-amber-500 text-[#0F172A] font-black text-2xl sm:text-3xl font-display shadow-md flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                style={{ borderBottom: '6px solid #D97706' }}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Victory Celebration Modal */}
      <VictoryCelebrationModal
        isOpen={showVictory}
        errorsCount={errorsCount}
        gameTitle="Đánh Vần Khối Gỗ"
        currentLevel={level}
        totalLevels={totalLevels}
        onReplay={handleReplay}
        onNextLevel={handleNextLevel}
        onExit={onExit}
      />
    </div>
  );
};

export default Game4_SpellingBlocks;
