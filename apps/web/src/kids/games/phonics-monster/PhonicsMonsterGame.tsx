// ============================================================================
// GAME 06: PHONICS MONSTER (CHO QUÁI VẬT ĂN ÂM VỊ)
// HEAR PHONEME -> CHOOSE WORD -> FEED MONSTER • Monster Den • CHOMP Physics
// Non-Auto-Advancing: User taps Continue button after praise audio finishes
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Sparkles, Smile } from 'lucide-react';
import { KidsGameWrapper } from '../core/KidsGameWrapper';
import { KIDS_GAMES_REGISTRY } from '../../data/games/gamesRegistry';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';

interface PhonicsRound {
  targetLetter: string;
  questionEn: string;
  questionVi: string;
  correctItem: { nameEn: string; nameVi: string; icon: string };
  distractors: { nameEn: string; nameVi: string; icon: string }[];
}

const PHONICS_ROUNDS: PhonicsRound[] = [
  {
    targetLetter: 'B',
    questionEn: 'Which word starts with B?',
    questionVi: 'Từ nào bắt đầu bằng chữ B?',
    correctItem: { nameEn: 'Bear', nameVi: 'Gấu nâu', icon: '🐻' },
    distractors: [
      { nameEn: 'Apple', nameVi: 'Quả táo', icon: '🍎' },
      { nameEn: 'Cat', nameVi: 'Con mèo', icon: '🐱' },
    ],
  },
  {
    targetLetter: 'C',
    questionEn: 'Which word starts with C?',
    questionVi: 'Từ nào bắt đầu bằng chữ C?',
    correctItem: { nameEn: 'Car', nameVi: 'Xe ô tô', icon: '🚗' },
    distractors: [
      { nameEn: 'Dog', nameVi: 'Con chó', icon: '🐶' },
      { nameEn: 'Banana', nameVi: 'Quả chuối', icon: '🍌' },
    ],
  },
  {
    targetLetter: 'D',
    questionEn: 'Which word starts with D?',
    questionVi: 'Từ nào bắt đầu bằng chữ D?',
    correctItem: { nameEn: 'Dog', nameVi: 'Con chó', icon: '🐶' },
    distractors: [
      { nameEn: 'Rabbit', nameVi: 'Con thỏ', icon: '🐰' },
      { nameEn: 'Orange', nameVi: 'Quả cam', icon: '🍊' },
    ],
  },
  {
    targetLetter: 'M',
    questionEn: 'Which word starts with M?',
    questionVi: 'Từ nào bắt đầu bằng chữ M?',
    correctItem: { nameEn: 'Monkey', nameVi: 'Chú khỉ', icon: '🐒' },
    distractors: [
      { nameEn: 'Lion', nameVi: 'Sư tử', icon: '🦁' },
      { nameEn: 'Egg', nameVi: 'Quả trứng', icon: '🥚' },
    ],
  },
];

interface PhonicsMonsterGameProps {
  onExit: () => void;
  onStarsAwarded?: (stars: number) => void;
  onNextGame?: () => void;
}

export const PhonicsMonsterGame: React.FC<PhonicsMonsterGameProps> = ({
  onExit,
  onStarsAwarded,
  onNextGame,
}) => {
  const gameDef = KIDS_GAMES_REGISTRY.find((g) => g.id === 'phonics_monster') || KIDS_GAMES_REGISTRY[5];

  const TOTAL_ROUNDS = 4;
  const [currentRound, setCurrentRound] = useState(1);
  const [starsEarned, setStarsEarned] = useState(0);

  const [roundData, setRoundData] = useState<PhonicsRound>(PHONICS_ROUNDS[0]);
  const [options, setOptions] = useState<{ nameEn: string; nameVi: string; icon: string }[]>([]);
  const [isChomping, setIsChomping] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isReadyToContinue, setIsReadyToContinue] = useState(false);
  const [praiseVi, setPraiseVi] = useState('');

  // Initialize round
  const initRound = useCallback((roundNum: number) => {
    setIsChomping(false);
    setIsReadyToContinue(false);
    const target = PHONICS_ROUNDS[(roundNum - 1) % PHONICS_ROUNDS.length];
    setRoundData(target);

    const allOptions = [target.correctItem, ...target.distractors].sort(() => Math.random() - 0.5);
    setOptions(allOptions);
  }, []);

  useEffect(() => {
    initRound(1);
  }, [initRound]);

  const handleFeedMonster = (opt: { nameEn: string; nameVi: string; icon: string }) => {
    if (isChomping || isReadyToContinue) return;

    if (opt.nameEn === roundData.correctItem.nameEn) {
      // CORRECT! CHOMP!
      setIsChomping(true);
      soundManager.play('pop');
      soundManager.play('star_burst');

      const earned = 2;
      setStarsEarned((prev) => prev + earned);
      if (onStarsAwarded) onStarsAwarded(earned);

      voiceService.speakEnglish(`${opt.nameEn}! Starts with ${roundData.targetLetter}!`, {
        onEnd: () => {
          const praise = 'Quái vật Pip nhai CHOMP ngon lành!';
          setPraiseVi(praise);
          voiceService.speakVietnamese(praise, {
            onEnd: () => {
              setIsReadyToContinue(true);
            },
          });
        },
      });
    } else {
      // WRONG
      soundManager.play('wrong');
      voiceService.speakVietnamese(`Từ ${opt.nameEn} không bắt đầu bằng chữ ${roundData.targetLetter} đâu bé ơi!`);
    }
  };

  const handleAdvanceRound = () => {
    setIsReadyToContinue(false);
    if (currentRound < TOTAL_ROUNDS) {
      setCurrentRound((prev) => prev + 1);
      initRound(currentRound + 1);
    } else {
      setIsGameComplete(true);
      soundManager.play('celebration');
    }
  };

  return (
    <KidsGameWrapper
      game={gameDef}
      currentRound={currentRound}
      totalRounds={TOTAL_ROUNDS}
      starsEarned={starsEarned}
      worldTheme="jungle"
      instructionEn={roundData.questionEn}
      instructionVi={roundData.questionVi}
      isReadyToContinue={isReadyToContinue}
      onContinueRound={handleAdvanceRound}
      praiseVi={praiseVi}
      onReplayAudio={() => voiceService.speakEnglish(`Starts with letter ${roundData.targetLetter}`)}
      onExit={onExit}
      onNextGame={onNextGame}
      onPlayAgain={() => {
        setCurrentRound(1);
        setStarsEarned(0);
        setIsGameComplete(false);
        initRound(1);
      }}
      isGameComplete={isGameComplete}
    >
      {/* FULL-BLEED MONSTER DEN SCENE */}
      <div className="relative w-full h-full p-4 sm:p-8 flex flex-col justify-between items-center overflow-hidden bg-gradient-to-b from-purple-100 via-pink-50 to-emerald-100 select-none">
        {/* Cave Jungle Atmosphere */}
        <div className="absolute top-4 left-8 text-4xl opacity-70 pointer-events-none select-none">
          🌿
        </div>
        <div className="absolute top-6 right-10 text-4xl opacity-70 pointer-events-none select-none">
          🍄
        </div>

        {/* Question Header */}
        <div className="relative z-20 flex flex-col items-center text-center space-y-1">
          <div className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-white/95 text-purple-950 font-black text-xs sm:text-sm border-2 border-purple-300 shadow-md flex items-center gap-2">
            <span className="text-xl">👾</span>
            <span>TÌM TỪ BẮT ĐẦU BẰNG ÂM: "{roundData.targetLetter}"</span>
          </div>
          <span className="text-xs font-bold text-purple-800">
            {roundData.questionVi}
          </span>
        </div>

        {/* CENTER: FRIENDLY PURPLE MONSTER PIP WITH EXPRESSIVE MOUTH */}
        <div className="relative z-10 w-full max-w-md my-auto flex flex-col items-center justify-center">
          <div
            className={`w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-indigo-500 border-4 border-white shadow-2xl flex flex-col items-center justify-center relative transition-all duration-300 ${
              isChomping ? 'animate-monster-chomp scale-110 shadow-purple-500/50' : 'hover:scale-105'
            }`}
          >
            {/* Monster Eyes */}
            <div className="flex gap-4 sm:gap-6 -mt-4">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white border-2 border-purple-950 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-purple-950" />
              </div>
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white border-2 border-purple-950 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-purple-950" />
              </div>
            </div>

            {/* Giant Mouth with Cute Teeth */}
            <div
              className={`w-28 sm:w-36 rounded-full bg-purple-950 border-3 border-amber-300 flex items-center justify-center transition-all duration-300 overflow-hidden my-2 ${
                isChomping ? 'h-20 sm:h-24 shadow-[0_0_20px_white]' : 'h-12 sm:h-14'
              }`}
            >
              {isChomping ? (
                <span className="text-xl sm:text-2xl font-black text-amber-300 animate-pulse">
                  CHOMP! 😋
                </span>
              ) : (
                <div className="flex gap-2">
                  <span className="w-3 h-3 bg-white rounded-b-md" />
                  <span className="w-3 h-3 bg-white rounded-b-md" />
                  <span className="w-3 h-3 bg-white rounded-b-md" />
                </div>
              )}
            </div>

            {/* Cute Cheeks */}
            <div className="absolute inset-x-4 top-1/2 flex justify-between px-2 pointer-events-none">
              <div className="w-4 h-2.5 rounded-full bg-pink-300/80" />
              <div className="w-4 h-2.5 rounded-full bg-pink-300/80" />
            </div>
          </div>

          <span className="mt-2 text-xs font-bold text-purple-900 bg-white/80 px-3 py-0.5 rounded-full shadow-xs">
            {isChomping ? 'Pip đang nhai ngon lành! Yummy!' : 'Bé chọn món ăn đưa vào miệng Pip nhé!'}
          </span>
        </div>

        {/* BOTTOM FOOD TRAY (TOUCH TARGETS >= 48px) */}
        <div className="relative z-10 w-full max-w-lg grid grid-cols-3 gap-3 pb-1">
          {options.map((opt) => (
            <button
              key={opt.nameEn}
              onClick={() => handleFeedMonster(opt)}
              disabled={isChomping || isReadyToContinue}
              className="p-3 sm:p-4 rounded-2xl bg-white hover:bg-amber-100 border-2 border-purple-300 hover:border-purple-500 shadow-md flex flex-col items-center justify-center gap-1 active:scale-95 transition-all hover:scale-105 cursor-pointer min-h-[50px]"
            >
              <span className="text-3xl sm:text-4xl select-none">{opt.icon}</span>
              <span className="text-xs sm:text-sm font-black text-slate-900 capitalize">
                {opt.nameEn}
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                ({opt.nameVi})
              </span>
            </button>
          ))}
        </div>
      </div>
    </KidsGameWrapper>
  );
};
