import React, { useState, useEffect } from 'react';
import { SunnyAudioEngine } from '../../services/audio/SunnyAudioEngine';
import SunnyBilingualGuide from '../../components/SunnyBilingualGuide';
import VictoryCelebrationModal from '../../components/VictoryCelebrationModal';
import { meadowStore } from '../../core/meadowStateStore';

interface Game2Props {
  onExit: () => void;
  onComplete?: () => void;
}

interface MatchQuestion {
  targetKey: string;
  wordEn: string;
  wordVi: string;
  symbol: string;
  options: {
    key: string;
    wordEn: string;
    wordVi: string;
    symbol: string;
  }[];
}

const LEVEL_QUESTIONS: Record<number, MatchQuestion[]> = {
  1: [
    {
      targetKey: 'cat',
      wordEn: 'Cat',
      wordVi: 'Con Mèo',
      symbol: '#svg-cat',
      options: [
        { key: 'cat', wordEn: 'Cat', wordVi: 'Con mèo', symbol: '#svg-cat' },
        { key: 'dog', wordEn: 'Dog', wordVi: 'Con chó', symbol: '#svg-dog' },
        { key: 'rabbit', wordEn: 'Rabbit', wordVi: 'Con thỏ', symbol: '#svg-rabbit' },
      ],
    },
    {
      targetKey: 'apple',
      wordEn: 'Apple',
      wordVi: 'Quả Táo Đỏ',
      symbol: '#svg-apple',
      options: [
        { key: 'banana', wordEn: 'Banana', wordVi: 'Quả chuối', symbol: '#svg-banana' },
        { key: 'apple', wordEn: 'Apple', wordVi: 'Quả táo', symbol: '#svg-apple' },
        { key: 'orange', wordEn: 'Orange', wordVi: 'Quả cam', symbol: '#svg-orange' },
      ],
    },
    {
      targetKey: 'dog',
      wordEn: 'Dog',
      wordVi: 'Con Chó Cún',
      symbol: '#svg-dog',
      options: [
        { key: 'dog', wordEn: 'Dog', wordVi: 'Con chó', symbol: '#svg-dog' },
        { key: 'cat', wordEn: 'Cat', wordVi: 'Con mèo', symbol: '#svg-cat' },
        { key: 'frog', wordEn: 'Frog', wordVi: 'Con ếch', symbol: '#svg-frog' },
      ],
    },
  ],
  2: [
    {
      targetKey: 'strawberry',
      wordEn: 'Strawberry',
      wordVi: 'Quả Dâu Tây',
      symbol: '#svg-strawberry',
      options: [
        { key: 'orange', wordEn: 'Orange', wordVi: 'Quả cam', symbol: '#svg-orange' },
        { key: 'apple', wordEn: 'Apple', wordVi: 'Quả táo', symbol: '#svg-apple' },
        { key: 'strawberry', wordEn: 'Strawberry', wordVi: 'Quả dâu tây', symbol: '#svg-strawberry' },
      ],
    },
    {
      targetKey: 'rabbit',
      wordEn: 'Rabbit',
      wordVi: 'Con Thỏ Trắng',
      symbol: '#svg-rabbit',
      options: [
        { key: 'frog', wordEn: 'Frog', wordVi: 'Con ếch', symbol: '#svg-frog' },
        { key: 'rabbit', wordEn: 'Rabbit', wordVi: 'Con thỏ', symbol: '#svg-rabbit' },
        { key: 'cat', wordEn: 'Cat', wordVi: 'Con mèo', symbol: '#svg-cat' },
      ],
    },
    {
      targetKey: 'sun',
      wordEn: 'Sun',
      wordVi: 'Ông Mặt Trời',
      symbol: '#svg-sun',
      options: [
        { key: 'sun', wordEn: 'Sun', wordVi: 'Mặt trời', symbol: '#svg-sun' },
        { key: 'tree', wordEn: 'Tree', wordVi: 'Cây xanh', symbol: '#svg-tree' },
        { key: 'apple', wordEn: 'Apple', wordVi: 'Quả táo', symbol: '#svg-apple' },
      ],
    },
  ],
};

export const Game2_PictureWordMatch: React.FC<Game2Props> = ({ onExit, onComplete }) => {
  const [level, setLevel] = useState<number>(1);
  const totalLevels = 2;

  const [questionIdx, setQuestionIdx] = useState<number>(0);
  const [errorsCount, setErrorsCount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [showVictory, setShowVictory] = useState<boolean>(false);

  const currentQuestions = LEVEL_QUESTIONS[level] || LEVEL_QUESTIONS[1];
  const q = currentQuestions[questionIdx] || currentQuestions[0];

  useEffect(() => {
    setQuestionIdx(0);
    setErrorsCount(0);
    setSelectedKey(null);
    setIsProcessing(false);
    setShowVictory(false);
  }, [level]);

  useEffect(() => {
    setSelectedKey(null);
    setIsProcessing(false);
  }, [questionIdx]);

  const handleSelectOption = (key: string, wordEn: string) => {
    if (isProcessing || showVictory) return;

    setSelectedKey(key);
    SunnyAudioEngine.playClick();
    SunnyAudioEngine.speakEnglish(wordEn);

    if (key === q.targetKey) {
      // CORRECT!
      setIsProcessing(true);
      SunnyAudioEngine.playCorrect();

      setTimeout(() => {
        meadowStore.addStars(5);

        if (questionIdx < currentQuestions.length - 1) {
          setTimeout(() => {
            setQuestionIdx((prev) => prev + 1);
          }, 800);
        } else {
          setShowVictory(true);
          if (onComplete) onComplete();
        }
      }, 700);
    } else {
      // WRONG
      setErrorsCount((prev) => prev + 1);
      SunnyAudioEngine.playWrong();
      setTimeout(() => {
        setSelectedKey(null);
      }, 600);
    }
  };

  const handleReplay = () => {
    setLevel(1);
    setQuestionIdx(0);
    setErrorsCount(0);
    setSelectedKey(null);
    setShowVictory(false);
  };

  const handleNextLevel = () => {
    if (level < totalLevels) {
      setLevel((prev) => prev + 1);
    }
  };

  const viPrompt = `Bé hãy quan sát hình và chọn thẻ từ vựng đúng với ${q.wordVi} nhé!`;
  const enPrompt = `Which card matches the ${q.wordEn}?`;

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
          <span className="px-3.5 py-1 rounded-full bg-sky-100 text-sky-900 text-xs font-black font-display border border-sky-300">
            Câu {questionIdx + 1} / {currentQuestions.length}
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
        badgeTitle="Ghép Cặp Hình & Từ Vựng"
      />

      {/* 3. Central Stage Card (Fix Bug #5) */}
      <div className="game-board-stage">
        {/* Large Target Image Display (130px x 130px) */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-gradient-to-b from-[#FFFDF5] to-[#E0F2FE] border-4 border-[#7DD3FC] p-4 flex items-center justify-center shadow-md relative group">
            <svg className="w-full h-full drop-shadow-md group-hover:scale-105 transition-transform">
              <use href={q.symbol}></use>
            </svg>

            {/* Tap-to-hear speaker badge */}
            <button
              type="button"
              onClick={() => {
                SunnyAudioEngine.playClick();
                SunnyAudioEngine.speakEnglish(q.wordEn);
              }}
              title="Nghe phát âm từ này"
              className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-amber-400 border-2 border-amber-600 text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 cursor-pointer text-base"
            >
              🔊
            </button>
          </div>

          <p className="mt-3 text-sm sm:text-base font-extrabold text-[#0F172A] font-display">
            Bé hãy tìm từ tiếng Anh cho: <span className="text-[#EA580C] underline">{q.wordVi}</span>
          </p>
        </div>

        {/* 3 Word Option Cards (Strictly [SVG + English + Vietnamese], Fix Bug #1) */}
        <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-7 w-full">
          {q.options.map((opt) => {
            const isSelected = selectedKey === opt.key;
            const isCorrect = isSelected && opt.key === q.targetKey;
            const isWrong = isSelected && opt.key !== q.targetKey;

            return (
              <div
                key={opt.key}
                onClick={() => handleSelectOption(opt.key, opt.wordEn)}
                className={`word-card-item cursor-pointer transition-all duration-200 ${
                  isCorrect
                    ? 'border-[#22C55E] ring-4 ring-emerald-300 bg-[#F0FDF4] scale-105'
                    : isWrong
                    ? 'border-rose-400 ring-4 ring-rose-200 bg-rose-50 animate-shake'
                    : 'border-[#BAE6FD] hover:border-[#38BDF8]'
                }`}
              >
                {/* SVG Illustration */}
                <div className="card-illust-svg flex items-center justify-center mt-1">
                  <svg className="w-full h-full drop-shadow-xs">
                    <use href={opt.symbol}></use>
                  </svg>
                </div>

                {/* English Word Label (Containment & clamp font) */}
                <div className="card-word-en">
                  {opt.wordEn}
                </div>

                {/* Vietnamese Subtitle */}
                <div className="card-word-vi pb-1">
                  {opt.wordVi}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Victory Celebration Modal */}
      <VictoryCelebrationModal
        isOpen={showVictory}
        errorsCount={errorsCount}
        gameTitle="Ghép Cặp Hình & Từ Vựng"
        currentLevel={level}
        totalLevels={totalLevels}
        onReplay={handleReplay}
        onNextLevel={handleNextLevel}
        onExit={onExit}
      />
    </div>
  );
};

export default Game2_PictureWordMatch;
