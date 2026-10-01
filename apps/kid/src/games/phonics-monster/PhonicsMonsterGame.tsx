// ============================================================================
// GAME 06: PHONICS MONSTER (CHO QUÁI VẬT ĂN ÂM VỊ)
// HEAR PHONEME -> CHOOSE WORD -> FEED MONSTER • Monster Den • CHOMP Physics
// Custom Vector Illustrated Monster & 3D Snack Plates (No raw text emojis!)
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Sparkles, Smile, ArrowRight } from 'lucide-react';
import { KidsGameWrapper } from '../core/KidsGameWrapper';
import { KIDS_GAMES_REGISTRY } from '../../data/games/gamesRegistry';
import { KidsIllustration } from '../../assets/illustrations/KidsIllustration';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';

interface PhonicsItem {
  id: string;
  nameEn: string;
  nameVi: string;
}

interface PhonicsRound {
  targetLetter: string;
  questionEn: string;
  questionVi: string;
  correctItem: PhonicsItem;
  distractors: PhonicsItem[];
}

const PHONICS_ROUNDS: PhonicsRound[] = [
  {
    targetLetter: 'B',
    questionEn: 'Which word starts with B?',
    questionVi: 'Từ nào bắt đầu bằng chữ B?',
    correctItem: { id: 'bear', nameEn: 'Bear', nameVi: 'Gấu nâu' },
    distractors: [
      { id: 'apple', nameEn: 'Apple', nameVi: 'Quả táo' },
      { id: 'cat', nameEn: 'Cat', nameVi: 'Con mèo' },
    ],
  },
  {
    targetLetter: 'C',
    questionEn: 'Which word starts with C?',
    questionVi: 'Từ nào bắt đầu bằng chữ C?',
    correctItem: { id: 'car', nameEn: 'Car', nameVi: 'Xe ô tô' },
    distractors: [
      { id: 'dog', nameEn: 'Dog', nameVi: 'Con chó' },
      { id: 'banana', nameEn: 'Banana', nameVi: 'Quả chuối' },
    ],
  },
  {
    targetLetter: 'D',
    questionEn: 'Which word starts with D?',
    questionVi: 'Từ nào bắt đầu bằng chữ D?',
    correctItem: { id: 'dog', nameEn: 'Dog', nameVi: 'Con chó' },
    distractors: [
      { id: 'rabbit', nameEn: 'Rabbit', nameVi: 'Con thỏ' },
      { id: 'orange', nameEn: 'Orange', nameVi: 'Quả cam' },
    ],
  },
  {
    targetLetter: 'M',
    questionEn: 'Which word starts with M?',
    questionVi: 'Từ nào bắt đầu bằng chữ M?',
    correctItem: { id: 'monkey', nameEn: 'Monkey', nameVi: 'Chú khỉ' },
    distractors: [
      { id: 'lion', nameEn: 'Lion', nameVi: 'Sư tử' },
      { id: 'elephant', nameEn: 'Elephant', nameVi: 'Con voi' },
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
  const [options, setOptions] = useState<PhonicsItem[]>([]);
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

    voiceService.preloadWords(allOptions.map((o) => o.nameEn));
    voiceService.speakEnglish(`Find the word that starts with letter ${target.targetLetter}`);
  }, []);

  useEffect(() => {
    initRound(1);
  }, [initRound]);

  const handleFeedMonster = (chosen: PhonicsItem) => {
    if (isChomping || isReadyToContinue) return;

    if (chosen.id === roundData.correctItem.id) {
      // CORRECT! MONSTER CHOMPS!
      setIsChomping(true);
      soundManager.play('chew');
      soundManager.play('pop');

      const earned = 2;
      setStarsEarned((prev) => prev + earned);
      if (onStarsAwarded) onStarsAwarded(earned);

      const praise = `Yummy! Quái vật Pip rất thích món ${chosen.nameVi}! Giỏi quá!`;
      setPraiseVi(praise);

      voiceService.speakWord(chosen.nameEn);
      setTimeout(() => {
        voiceService.speakVietnamese(praise);
      }, 450);

      setTimeout(() => {
        if (currentRound < TOTAL_ROUNDS) {
          setIsReadyToContinue(true);
        } else {
          setIsGameComplete(true);
          soundManager.play('celebration');
        }
      }, 500);
    } else {
      // WRONG ITEM
      soundManager.play('wrong');
      voiceService.speakVietnamese(`Quái vật Pip lắc đầu rồi! ${chosen.nameVi} không bắt đầu bằng chữ ${roundData.targetLetter} đâu nè.`);
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
      {/* ================================================================ */}
      {/* MONSTER CAVE SANCTUARY (CUSTOM ILLUSTRATED ENVIRONMENT)          */}
      {/* ================================================================ */}
      <div className="relative w-full h-full p-4 sm:p-6 lg:p-8 flex flex-col justify-between items-center overflow-hidden bg-gradient-to-b from-[#F3E8FF] via-[#E9D5FF] to-[#D8B4FE] select-none">
        
        {/* Cave Jungle Atmosphere Vector Graphics */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Top Hanging Stalactites & Foliage */}
          <div className="absolute top-0 left-6 w-16 h-12 bg-purple-900/15 rounded-b-2xl" />
          <div className="absolute top-0 right-10 w-20 h-16 bg-purple-900/15 rounded-b-3xl" />
          <div className="absolute bottom-2 left-8 text-2xl opacity-60">🌿</div>
          <div className="absolute bottom-4 right-10 text-2xl opacity-60">🍄</div>
        </div>

        {/* QUESTION & LETTER PROMPT BANNER */}
        <div className="relative z-20 flex flex-col items-center text-center space-y-1.5 max-w-xl mx-auto">
          <button
            onClick={() => voiceService.speakEnglish(`Starts with letter ${roundData.targetLetter}`)}
            type="button"
            className="group px-6 py-2 sm:px-7 sm:py-2.5 rounded-full bg-white/95 text-purple-950 font-black text-sm sm:text-base border-3 border-purple-400 shadow-lg flex items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs group-hover:rotate-12 transition-transform">
              <Volume2 className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-2">
              <span>TÌM TỪ BẮT ĐẦU BẰNG ÂM:</span>
              <span className="text-xl sm:text-2xl font-black text-purple-700 bg-purple-100 px-3 py-0.5 rounded-xl border border-purple-300">
                "{roundData.targetLetter}"
              </span>
            </div>
          </button>

          <span className="text-xs font-bold text-purple-900 bg-white/75 backdrop-blur-xs px-3.5 py-0.5 rounded-full border border-purple-300">
            👾 Chọn món ăn đúng đưa vào miệng Quái vật Pip nhé!
          </span>
        </div>

        {/* CENTER: FRIENDLY PURPLE MONSTER PIP WITH EXPRESSIVE CHOMP JAW */}
        <div className="relative z-10 w-full max-w-md my-auto flex flex-col items-center justify-center">
          <div
            className={`w-44 h-44 sm:w-54 sm:h-54 rounded-full bg-gradient-to-tr from-[#9333EA] via-[#A855F7] to-[#C084FC] border-4 border-white shadow-2xl flex flex-col items-center justify-center relative transition-all duration-300 ${
              isChomping ? 'animate-monster-chomp scale-110 shadow-purple-500/50' : 'hover:scale-105'
            }`}
          >
            {/* Monster Cute Antenna / Horns */}
            <div className="absolute -top-4 flex justify-between w-24 px-2">
              <div className="w-4 h-6 bg-purple-600 rounded-t-full rotate-[-15deg] shadow-xs" />
              <div className="w-4 h-6 bg-purple-600 rounded-t-full rotate-[15deg] shadow-xs" />
            </div>

            {/* Monster Big Expressive Eyes */}
            <div className="flex gap-4 sm:gap-6 -mt-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border-2 border-purple-950 flex items-center justify-center shadow-xs">
                <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-purple-950 transition-transform ${isChomping ? 'scale-120' : ''}`} />
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border-2 border-purple-950 flex items-center justify-center shadow-xs">
                <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-purple-950 transition-transform ${isChomping ? 'scale-120' : ''}`} />
              </div>
            </div>

            {/* Giant Animated Mouth with Cute Teeth */}
            <div
              className={`w-28 sm:w-36 rounded-full bg-purple-950 border-3 border-amber-300 flex items-center justify-center transition-all duration-300 overflow-hidden my-2 shadow-inner ${
                isChomping ? 'h-20 sm:h-24 shadow-[0_0_24px_rgba(255,255,255,0.8)] bg-rose-900' : 'h-11 sm:h-13'
              }`}
            >
              {isChomping ? (
                <span className="text-xl sm:text-2xl font-black text-amber-300 animate-pulse">
                  CHOMP! 😋
                </span>
              ) : (
                <div className="flex gap-2">
                  <span className="w-3.5 h-3 bg-white rounded-b-md shadow-xs" />
                  <span className="w-3.5 h-3 bg-white rounded-b-md shadow-xs" />
                </div>
              )}
            </div>

            {/* Cute Cheeks */}
            <div className="absolute inset-x-4 top-1/2 flex justify-between px-3 pointer-events-none">
              <div className="w-4 h-3 rounded-full bg-pink-400/80 blur-[0.5px]" />
              <div className="w-4 h-3 rounded-full bg-pink-400/80 blur-[0.5px]" />
            </div>
          </div>

          <span className="mt-2 text-xs font-bold text-purple-950 bg-white/85 backdrop-blur-xs px-3.5 py-0.5 rounded-full shadow-2xs border border-purple-200">
            {isChomping ? 'Pip đang nhai ngon lành! Yummy yummy!' : 'Pip đang đói bụng, bé cho Pip ăn nhé!'}
          </span>
        </div>

        {/* BOTTOM FOOD TRAY (3D TACTILE SNACK PLATES WITH HIGH-RES ILLUSTRATIONS) */}
        <div className="relative z-10 w-full max-w-lg grid grid-cols-3 gap-3.5 pb-1">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleFeedMonster(opt)}
              disabled={isChomping || isReadyToContinue}
              className="p-3 sm:p-4 rounded-[24px] bg-white hover:bg-amber-50 border-3 border-purple-200 hover:border-purple-500 shadow-md flex flex-col items-center justify-center gap-1 active:scale-95 transition-all hover:scale-105 cursor-pointer min-h-[64px]"
              style={{ borderBottomWidth: '5px' }}
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center pointer-events-none">
                <KidsIllustration
                  name={opt.id}
                  className="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform"
                  alt={opt.nameEn}
                />
              </div>

              <span className="text-xs sm:text-sm font-black text-slate-900 capitalize block leading-tight mt-0.5">
                {opt.nameEn}
              </span>
              <span className="text-[10px] font-bold text-slate-500 block leading-tight">
                ({opt.nameVi})
              </span>
            </button>
          ))}
        </div>
      </div>
    </KidsGameWrapper>
  );
};
