import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, Sparkles, RotateCcw, Check, Trophy } from 'lucide-react';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';
import { kidAsset } from '../../utils/kidAsset';

interface AnimalSpellingLevel {
  id: string;
  name: string;
  viName: string;
  word: string;
  image: string;
  letters: string[];
  distractors: string[];
}

const ANIMAL_LEVELS: AnimalSpellingLevel[] = [
  {
    id: 'fox',
    name: 'Fox',
    viName: 'Con cáo',
    word: 'FOX',
    image: '/kid/animals/fox.png',
    letters: ['F', 'O', 'X'],
    distractors: ['S', 'N', 'A', 'Z'],
  },
  {
    id: 'cat',
    name: 'Cat',
    viName: 'Con mèo',
    word: 'CAT',
    image: '/kid/animals/cat.png',
    letters: ['C', 'A', 'T'],
    distractors: ['B', 'P', 'O', 'M'],
  },
  {
    id: 'dog',
    name: 'Dog',
    viName: 'Con chó',
    word: 'DOG',
    image: '/kid/animals/dog.png',
    letters: ['D', 'O', 'G'],
    distractors: ['T', 'B', 'A', 'N'],
  },
  {
    id: 'lion',
    name: 'Lion',
    viName: 'Sư tử',
    word: 'LION',
    image: '/kid/animals/lion.png',
    letters: ['L', 'I', 'O', 'N'],
    distractors: ['E', 'A', 'S'],
  },
  {
    id: 'rabbit',
    name: 'Rabbit',
    viName: 'Con thỏ',
    word: 'RABBIT',
    image: '/kid/animals/rabbit.png',
    letters: ['R', 'A', 'B', 'B', 'I', 'T'],
    distractors: ['C', 'D'],
  },
  {
    id: 'panda',
    name: 'Panda',
    viName: 'Gấu trúc',
    word: 'PANDA',
    image: '/kid/animals/panda.png',
    letters: ['P', 'A', 'N', 'D', 'A'],
    distractors: ['O', 'T'],
  },
  {
    id: 'bear',
    name: 'Bear',
    viName: 'Con gấu',
    word: 'BEAR',
    image: '/kid/animals/bear.png',
    letters: ['B', 'E', 'A', 'R'],
    distractors: ['D', 'O', 'S'],
  },
  {
    id: 'tiger',
    name: 'Tiger',
    viName: 'Con hổ',
    word: 'TIGER',
    image: '/kid/animals/tiger.png',
    letters: ['T', 'I', 'G', 'E', 'R'],
    distractors: ['B', 'O'],
  },
];

interface BrightFoxSpellingGameProps {
  onExit?: () => void;
  onStarsAwarded?: (stars: number) => void;
  onNextGame?: () => void;
}

export const BrightFoxSpellingGame: React.FC<BrightFoxSpellingGameProps> = ({
  onExit,
  onStarsAwarded,
  onNextGame,
}) => {
  const navigate = useNavigate();
  const [levelIndex, setLevelIndex] = useState(0);
  const current = ANIMAL_LEVELS[levelIndex % ANIMAL_LEVELS.length];

  const [placedLetters, setPlacedLetters] = useState<string[]>([]);
  const [keyboardKeys, setKeyboardKeys] = useState<{ id: string; char: string; state: 'normal' | 'correct' | 'wrong' }[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [totalStars, setTotalStars] = useState(0);

  // Initialize Level
  const initLevel = useCallback((lvl: AnimalSpellingLevel) => {
    setIsSuccess(false);
    setPlacedLetters([]);

    // Merge and shuffle letters
    const all = [...lvl.letters, ...lvl.distractors];
    // Fisher-Yates shuffle
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }

    setKeyboardKeys(
      all.map((c, idx) => ({
        id: `${c}_${idx}`,
        char: c,
        state: 'normal',
      }))
    );
  }, []);

  useEffect(() => {
    initLevel(current);
  }, [current, initLevel]);

  // Handle letter click
  const handleKeyClick = (keyId: string, char: string) => {
    if (isSuccess) return;

    const nextIndex = placedLetters.length;
    const targetChar = current.letters[nextIndex];

    if (char === targetChar) {
      // CORRECT LETTER!
      soundManager.play('pop');
      const nextPlaced = [...placedLetters, char];
      setPlacedLetters(nextPlaced);

      setKeyboardKeys((prev) =>
        prev.map((k) => (k.id === keyId ? { ...k, state: 'correct' } : k))
      );

      // Check if complete word
      if (nextPlaced.length === current.letters.length) {
        setIsSuccess(true);
        soundManager.play('star_burst');
        soundManager.play('correct');
        const earned = 3;
        setTotalStars((s) => s + earned);
        if (onStarsAwarded) onStarsAwarded(earned);

        // Speak the animal name
        voiceService.speakWord(current.word, {
          onEnd: () => {
            voiceService.speakVietnamese(`Bé thật tuyệt vời! Đây chính là ${current.viName}!`);
          },
        });
      }
    } else {
      // WRONG LETTER!
      soundManager.play('wrong');
      setKeyboardKeys((prev) =>
        prev.map((k) => (k.id === keyId ? { ...k, state: 'wrong' } : k))
      );

      // Reset wrong state back to normal after 500ms
      setTimeout(() => {
        setKeyboardKeys((prev) =>
          prev.map((k) => (k.id === keyId ? { ...k, state: 'normal' } : k))
        );
      }, 500);
    }
  };

  // Tap placed letter to remove/undo
  const handleRemovePlaced = (index: number) => {
    if (isSuccess) return;
    soundManager.play('whoosh');
    const removedChar = placedLetters[index];
    const newPlaced = placedLetters.filter((_, i) => i !== index);
    setPlacedLetters(newPlaced);

    // Restore the first matched key in correct state back to normal
    setKeyboardKeys((prev) => {
      let restored = false;
      return prev.map((k) => {
        if (!restored && k.char === removedChar && k.state === 'correct') {
          restored = true;
          return { ...k, state: 'normal' };
        }
        return k;
      });
    });
  };

  const handleNextLevel = () => {
    soundManager.play('pop');
    if (levelIndex < ANIMAL_LEVELS.length - 1) {
      setLevelIndex((prev) => prev + 1);
    } else {
      setLevelIndex(0);
    }
  };

  const handleHearPrompt = () => {
    soundManager.play('pop');
    voiceService.speakWord(current.word, {
      onEnd: () => {
        voiceService.speakVietnamese(`What do we call this Animal? Con vật này tên là gì nhỉ?`);
      },
    });
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-[640px] bg-gradient-to-b from-sky-300 via-sky-100 to-white rounded-[36px] shadow-2xl border-4 border-white/80 p-5 sm:p-6 flex flex-col justify-between select-none relative overflow-hidden">
      {/* Background clouds decoration */}
      <div className="absolute top-6 -left-8 w-28 h-12 bg-white/70 rounded-full blur-[1px] pointer-events-none" />
      <div className="absolute top-16 -right-6 w-32 h-14 bg-white/70 rounded-full blur-[1px] pointer-events-none" />

      {/* TOP HEADER BAR */}
      <div className="relative z-10 flex items-center justify-between">
        <button
          onClick={onExit || (() => navigate('/kids/games'))}
          className="w-11 h-11 rounded-2xl bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center shadow-md active:scale-90 transition-all border border-slate-100 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="px-5 py-1.5 rounded-full bg-white/95 border-2 border-amber-300 text-amber-900 font-black text-sm sm:text-base shadow-sm flex items-center gap-1.5">
          <span>Level {levelIndex + 1}</span>
          <span className="text-amber-500">⭐ {totalStars}</span>
        </div>

        <button
          onClick={handleHearPrompt}
          className="w-11 h-11 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center shadow-md active:scale-90 transition-all border border-sky-300 cursor-pointer"
        >
          <Volume2 className="w-5 h-5" />
        </button>
      </div>

      {/* MASCOT AVATAR & SPEECH BUBBLE */}
      <div className="relative z-10 flex flex-col items-center mt-2">
        <div
          onClick={handleHearPrompt}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 border-4 border-white shadow-lg flex items-center justify-center p-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
        >
          <img
            src={kidAsset('/kid/mascot/vivi-study.png')}
            alt="Vivi Fox"
            className="w-full h-full object-contain"
            onError={(e) => { (e.target as HTMLImageElement).src = '/kid/mascot/vivi-wave.png'; }}
          />
        </div>

        {/* CUTE SPEECH BUBBLE */}
        <div
          onClick={handleHearPrompt}
          className="mt-3 px-5 py-2.5 rounded-2xl bg-[#FFF0F5] border-3 border-[#FFB6C1] shadow-md relative cursor-pointer hover:scale-102 transition-transform"
        >
          <p className="text-xs sm:text-sm font-black text-[#5C2434] tracking-wide text-center">
            What do we call this Animal?
          </p>
          <p className="text-[11px] font-bold text-slate-500 text-center">
            (Bé hãy ghép tên con vật này nhé!)
          </p>
          {/* Bubble tail */}
          <div className="w-3 h-3 bg-[#FFF0F5] border-t-3 border-l-3 border-[#FFB6C1] absolute -top-2 left-1/2 -translate-x-1/2 rotate-45" />
        </div>
      </div>

      {/* ANIMAL CARD DISPLAY */}
      <div className="relative z-10 flex flex-col items-center my-3">
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white/95 border-4 border-sky-200 shadow-md p-2 flex items-center justify-center relative hover:scale-105 transition-transform">
          <img
            src={kidAsset(current.image)}
            alt={current.name}
            className="w-full h-full object-contain drop-shadow-sm select-none pointer-events-none"
            onError={(e) => { (e.target as HTMLImageElement).src = '/kid/animals/fox.png'; }}
          />
        </div>
        <span className="text-xs font-bold text-slate-600 mt-1">
          {current.viName}
        </span>
      </div>

      {/* TARGET WORD SLOTS */}
      <div className="relative z-10 flex items-center justify-center gap-4 py-2">
        {current.letters.map((char, idx) => {
          const placed = placedLetters[idx];
          return (
            <div
              key={idx}
              onClick={() => placed && handleRemovePlaced(idx)}
              className="flex flex-col items-center cursor-pointer"
            >
              <div
                className={`w-12 h-14 sm:w-14 sm:h-16 rounded-2xl border-3 flex items-center justify-center text-2xl sm:text-3xl font-black transition-all shadow-md ${
                  placed
                    ? 'bg-emerald-500 text-white border-emerald-600 scale-105 animate-bounce-subtle'
                    : 'bg-white/80 border-dashed border-sky-300 text-transparent'
                }`}
              >
                {placed || '_'}
              </div>
              <div
                className={`w-8 h-1.5 rounded-full mt-1.5 transition-colors ${
                  placed ? 'bg-emerald-500' : 'bg-emerald-400'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* 3D SQUIRCLE LETTER KEYBOARD */}
      <div className="relative z-10 grid grid-cols-4 gap-2.5 sm:gap-3 py-3 max-w-xs mx-auto w-full">
        {keyboardKeys.map((key) => {
          const isCorrect = key.state === 'correct';
          const isWrong = key.state === 'wrong';

          return (
            <button
              key={key.id}
              disabled={isCorrect || isSuccess}
              onClick={() => handleKeyClick(key.id, key.char)}
              className={`h-14 sm:h-16 rounded-2xl font-black text-xl sm:text-2xl transition-all cursor-pointer flex items-center justify-center select-none active:scale-95 ${
                isCorrect
                  ? 'bg-[#22C55E] text-white border-b-4 border-emerald-700 opacity-60 shadow-inner'
                  : isWrong
                  ? 'bg-[#EF4444] text-white border-b-4 border-rose-700 animate-wiggle shadow-md'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 border-b-4 border-b-slate-300 shadow-md hover:border-sky-300'
              }`}
            >
              {key.char}
            </button>
          );
        })}
      </div>

      {/* CELEBRATION MODAL ON WORD COMPLETION */}
      {isSuccess && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center z-50 p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border-4 border-amber-300 flex flex-col items-center text-center max-w-xs w-full animate-bounce-subtle">
            <div className="w-36 h-20 relative flex items-center justify-center">
              <img
                src={kidAsset('/kid/stickers/sticker-great-job.png')}
                alt="Great Job Sticker"
                className="w-full h-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).src = '/kid/mascot/vivi-celebrate.png'; }}
              />
            </div>

            <h3 className="text-xl font-black text-emerald-600 mt-2">
              Chính xác! {current.word}!
            </h3>
            <p className="text-xs font-bold text-slate-500 mt-0.5">
              Bé đã giải cứu được {current.viName}!
            </p>

            <div className="flex items-center gap-1.5 my-3 text-amber-400 text-lg">
              <span>⭐</span>
              <span>⭐</span>
              <span>⭐</span>
              <span className="text-xs font-black text-amber-600 ml-1">+3 Sao</span>
            </div>

            <button
              onClick={handleNextLevel}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-105 active:scale-95 text-white font-black text-base shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <span>Vòng tiếp theo!</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
