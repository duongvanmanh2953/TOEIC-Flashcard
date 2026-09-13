// ============================================================================
// GAME 20: BOSS CHALLENGE (THỬ THÁCH BOSS TRI THỨC)
// Comprehensive 5-Phase Review • Friendly Dino / Dragon • Non-Violent Friendship Transformation
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Sparkles, Heart, Trophy, Check, Flame } from 'lucide-react';
import { KidsGameWrapper } from '../core/KidsGameWrapper';
import { KIDS_GAMES_REGISTRY } from '../../data/games/gamesRegistry';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';

interface BossPhase {
  phaseNumber: number;
  skillName: string;
  questionEn: string;
  questionVi: string;
  options: { label: string; icon: string; isCorrect: boolean }[];
}

const BOSS_PHASES: BossPhase[] = [
  {
    phaseNumber: 1,
    skillName: 'Phần 1: Luyện Nghe',
    questionEn: 'Find the elephant',
    questionVi: 'Bé hãy tìm chú voi khổng lồ',
    options: [
      { label: 'Lion', icon: '🦁', isCorrect: false },
      { label: 'Elephant', icon: '🐘', isCorrect: true },
      { label: 'Cat', icon: '🐱', isCorrect: false },
    ],
  },
  {
    phaseNumber: 2,
    skillName: 'Phần 2: Từ Vựng',
    questionEn: 'Which one is Apple?',
    questionVi: 'Đâu là quả táo ngọt thơm?',
    options: [
      { label: 'Apple', icon: '🍎', isCorrect: true },
      { label: 'Banana', icon: '🍌', isCorrect: false },
      { label: 'Orange', icon: '🍊', isCorrect: false },
    ],
  },
  {
    phaseNumber: 3,
    skillName: 'Phần 3: Ghép Câu',
    questionEn: 'Choose: "I like animals"',
    questionVi: 'Chọn câu: Tôi yêu muông thú',
    options: [
      { label: 'I like animals', icon: '🐾', isCorrect: true },
      { label: 'I sleep', icon: '💤', isCorrect: false },
      { label: 'See moon', icon: '🌙', isCorrect: false },
    ],
  },
  {
    phaseNumber: 4,
    skillName: 'Phần 4: Chúc Mừng',
    questionEn: 'Choose: "Champion!"',
    questionVi: 'Chọn biểu tượng Nhà Vô Địch!',
    options: [
      { label: 'Champion', icon: '🏆', isCorrect: true },
      { label: 'Door', icon: '🚪', isCorrect: false },
      { label: 'Rock', icon: '🪨', isCorrect: false },
    ],
  },
  {
    phaseNumber: 5,
    skillName: 'Phần 5: Trí Nhớ & Trái Tim',
    questionEn: 'Choose the golden heart of friendship!',
    questionVi: 'Chọn trái tim tình bạn kết nối cùng Boss!',
    options: [
      { label: 'Heart', icon: '❤️', isCorrect: true },
      { label: 'Cloud', icon: '☁️', isCorrect: false },
      { label: 'Shoe', icon: '👟', isCorrect: false },
    ],
  },
];

interface BossChallengeGameProps {
  onExit: () => void;
  onStarsAwarded?: (stars: number) => void;
  onNextGame?: () => void;
}

export const BossChallengeGame: React.FC<BossChallengeGameProps> = ({
  onExit,
  onStarsAwarded,
  onNextGame,
}) => {
  const gameDef = KIDS_GAMES_REGISTRY.find((g) => g.id === 'boss_challenge') || KIDS_GAMES_REGISTRY[19];

  const TOTAL_PHASES = 5;
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [starsEarned, setStarsEarned] = useState(0);
  const currentPhase = BOSS_PHASES[currentPhaseIndex];

  const [isBossFriendly, setIsBossFriendly] = useState(false);
  const [isPhaseCompleted, setIsPhaseCompleted] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isReadyToContinue, setIsReadyToContinue] = useState(false);
  const [praiseVi, setPraiseVi] = useState('Bé vượt qua thử thách rất xuất sắc!');

  // Initialize phase
  const initPhase = useCallback((phaseIdx: number) => {
    setIsPhaseCompleted(false);
    setIsReadyToContinue(false);
  }, []);

  useEffect(() => {
    initPhase(0);
  }, [initPhase]);

  const handleContinueRound = () => {
    soundManager.play('pop');
    if (currentPhaseIndex < TOTAL_PHASES - 1) {
      const nextIdx = currentPhaseIndex + 1;
      setCurrentPhaseIndex(nextIdx);
      initPhase(nextIdx);
    } else {
      setIsBossFriendly(true);
      setIsGameComplete(true);
      soundManager.play('celebration');
    }
  };

  const handleChooseOption = (opt: { label: string; icon: string; isCorrect: boolean }) => {
    if (isPhaseCompleted || isReadyToContinue) return;

    if (opt.isCorrect) {
      // PHASE PASSED!
      setIsPhaseCompleted(true);
      soundManager.play('star_burst');
      soundManager.play('correct');

      const earned = 4;
      setStarsEarned((prev) => prev + earned);
      if (onStarsAwarded) onStarsAwarded(earned);

      const praise = `Giỏi quá! Bé đã vượt qua ${currentPhase.skillName}!`;
      setPraiseVi(praise);

      voiceService.speakWord(opt.label, {
        onEnd: () => {
          voiceService.speakVietnamese(praise, {
            onEnd: () => {
              if (currentPhaseIndex < TOTAL_PHASES - 1) {
                setIsReadyToContinue(true);
              } else {
                // BOSS DEFEATED -> BECOMES BEST FRIEND!
                setIsBossFriendly(true);
                setIsGameComplete(true);
                soundManager.play('celebration');
                voiceService.speakVietnamese('Tuyệt vời! Boss Khủng Long đã trở thành bạn thân của bé!');
              }
            },
          });
        },
      });
    } else {
      // WRONG
      soundManager.play('wrong');
      voiceService.speakVietnamese('Chưa chính xác, bé hãy cố lên nhé!');
    }
  };

  return (
    <KidsGameWrapper
      game={gameDef}
      currentRound={currentPhaseIndex + 1}
      totalRounds={TOTAL_PHASES}
      starsEarned={starsEarned}
      instructionEn={currentPhase.questionEn}
      instructionVi={currentPhase.questionVi}
      onExit={onExit}
      onNextGame={onNextGame}
      onPlayAgain={() => {
        setCurrentPhaseIndex(0);
        setIsBossFriendly(false);
        setStarsEarned(0);
        setIsGameComplete(false);
        setIsReadyToContinue(false);
        initPhase(0);
      }}
      isGameComplete={isGameComplete}
      isReadyToContinue={isReadyToContinue}
      onContinueRound={handleContinueRound}
      praiseVi={praiseVi}
      onReplayAudio={() => voiceService.speakEnglish(currentPhase.questionEn)}
    >
      <div className="relative w-full aspect-[800/520] max-h-[65vh] mx-auto rounded-3xl overflow-hidden bg-gradient-to-b from-amber-200 via-rose-100 to-indigo-100 select-none flex flex-col justify-between p-6">
        {/* Phase Progress Top Banner */}
        <div className="text-center z-10">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/95 border-2 border-amber-400 shadow-md">
            <span className="text-2xl animate-bounce">
              {isBossFriendly ? '❤️' : '🐲'}
            </span>
            <span className="text-sm sm:text-base font-black text-slate-900">
              CHẶNG {currentPhaseIndex + 1}/5: <span className="text-amber-700 underline">{currentPhase.skillName}</span>
            </span>
          </div>
        </div>

        {/* Big Boss Dino / Dragon Stage */}
        <div className="relative flex flex-col items-center justify-center my-auto z-10">
          <div
            className={`w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-tr from-amber-400 via-orange-400 to-rose-400 border-4 border-white shadow-2xl flex flex-col items-center justify-center relative transition-all duration-700 ${
              isBossFriendly ? 'scale-125 animate-bounce' : 'animate-pulse'
            }`}
          >
            {/* Boss Character Graphic */}
            <span className="text-7xl sm:text-8xl">
              {isBossFriendly ? '🦖' : '🐲'}
            </span>

            {/* Boss Heart when Friendly */}
            {isBossFriendly && (
              <div className="absolute -top-3 -right-3 text-4xl animate-ping">
                ❤️
              </div>
            )}
          </div>

          <span className="text-xs font-black text-amber-950 bg-white/95 px-4 py-1 rounded-full mt-3 border border-amber-300 shadow-md">
            {isBossFriendly ? '❤️ Bạn Khủng Long Tri Thức ❤️' : 'Boss Tri Thức Đang Thử Thách Bé!'}
          </span>
        </div>

        {/* 3 Challenge Answers at Bottom */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full max-w-xl mx-auto z-10">
          {currentPhase.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleChooseOption(opt)}
              disabled={isPhaseCompleted}
              className="p-3 sm:p-4 rounded-3xl bg-white hover:bg-amber-100 border-2 border-amber-300 hover:border-amber-500 shadow-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <span className="text-4xl sm:text-5xl">{opt.icon}</span>
              <span className="text-xs sm:text-sm font-black text-slate-800 mt-1">
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </KidsGameWrapper>
  );
};
