// ============================================================================
// GAME 13: WORD BUILDER (XƯỞNG GHÉP CHỮ ĐÁNH VẦN)
// Spelling + Phonics • Letter Tiles Snap • Dynamic Word Animation
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Sparkles, Check } from 'lucide-react';
import { KidsGameWrapper } from '../core/KidsGameWrapper';
import { KIDS_GAMES_REGISTRY } from '../../data/games/gamesRegistry';
import { KidsIllustration } from '../../assets/illustrations/KidsIllustration';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';

interface SpellingWord {
  id: string;
  word: string;
  letters: string[];
  distractors: string[];
  viMeaning: string;
}

const SPELLING_WORDS: SpellingWord[] = [
  { id: 'cat', word: 'CAT', letters: ['C', 'A', 'T'], distractors: ['M', 'P'], viMeaning: 'Con mèo' },
  { id: 'dog', word: 'DOG', letters: ['D', 'O', 'G'], distractors: ['B', 'T'], viMeaning: 'Con chó' },
  { id: 'sun', word: 'SUN', letters: ['S', 'U', 'N'], distractors: ['R', 'M'], viMeaning: 'Mặt trời' },
  { id: 'hat', word: 'HAT', letters: ['H', 'A', 'T'], distractors: ['K', 'S'], viMeaning: 'Cái mũ' },
  { id: 'pen', word: 'PEN', letters: ['P', 'E', 'N'], distractors: ['T', 'O'], viMeaning: 'Cây bút' },
];

interface WordBuilderGameProps {
  onExit: () => void;
  onStarsAwarded?: (stars: number) => void;
  onNextGame?: () => void;
}

export const WordBuilderGame: React.FC<WordBuilderGameProps> = ({
  onExit,
  onStarsAwarded,
  onNextGame,
}) => {
  const gameDef = KIDS_GAMES_REGISTRY.find((g) => g.id === 'word_builder') || KIDS_GAMES_REGISTRY[16];

  const TOTAL_ROUNDS = 5;
  const [currentRound, setCurrentRound] = useState(1);
  const [starsEarned, setStarsEarned] = useState(0);

  const [currentWord, setCurrentWord] = useState<SpellingWord>(SPELLING_WORDS[0]);
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [placedLetters, setPlacedLetters] = useState<string[]>([]);
  const [isWordCorrect, setIsWordCorrect] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isReadyToContinue, setIsReadyToContinue] = useState(false);
  const [praiseVi, setPraiseVi] = useState('Bé ghép chữ rất giỏi!');

  // Initialize round
  const initRound = useCallback((roundNum: number) => {
    setIsWordCorrect(false);
    setIsReadyToContinue(false);
    setPlacedLetters([]);

    const target = SPELLING_WORDS[(roundNum - 1) % SPELLING_WORDS.length];
    setCurrentWord(target);

    // Combine letters and distractors, shuffle
    const pool = [...target.letters, ...target.distractors].sort(() => Math.random() - 0.5);
    setAvailableLetters(pool);
  }, []);

  useEffect(() => {
    initRound(1);
  }, [initRound]);

  const handleContinueRound = () => {
    soundManager.play('pop');
    if (currentRound < TOTAL_ROUNDS) {
      const nextR = currentRound + 1;
      setCurrentRound(nextR);
      initRound(nextR);
    } else {
      setIsGameComplete(true);
      soundManager.play('celebration');
    }
  };

  // Click letter to place
  const handlePlaceLetter = (letter: string, index: number) => {
    if (isWordCorrect || isReadyToContinue) return;

    soundManager.play('pop');
    const nextPlaced = [...placedLetters, letter];
    setPlacedLetters(nextPlaced);

    const nextAvailable = availableLetters.filter((_, idx) => idx !== index);
    setAvailableLetters(nextAvailable);

    // Check if filled all slots
    if (nextPlaced.length === currentWord.letters.length) {
      if (nextPlaced.join('') === currentWord.word) {
        // CORRECT!
        setIsWordCorrect(true);
        soundManager.play('star_burst');
        soundManager.play('correct');

        const earned = 2;
        setStarsEarned((prev) => prev + earned);
        if (onStarsAwarded) onStarsAwarded(earned);

        const praise = `Giỏi quá! Bé ghép đúng từ ${currentWord.word} rồi!`;
        setPraiseVi(praise);

        voiceService.speakWord(currentWord.word, {
          onEnd: () => {
            voiceService.speakVietnamese(praise, {
              onEnd: () => {
                if (currentRound < TOTAL_ROUNDS) {
                  setIsReadyToContinue(true);
                } else {
                  setIsGameComplete(true);
                  soundManager.play('celebration');
                }
              },
            });
          },
        });
      } else {
        // WRONG SPELLING
        soundManager.play('wrong');
        voiceService.speakVietnamese('Chưa đúng rồi, bé thử xếp lại nhé!');
        setTimeout(() => {
          const pool = [...currentWord.letters, ...currentWord.distractors].sort(() => Math.random() - 0.5);
          setAvailableLetters(pool);
          setPlacedLetters([]);
        }, 800);
      }
    }
  };

  // Click placed letter to return
  const handleReturnLetter = (letter: string, index: number) => {
    if (isWordCorrect || isReadyToContinue) return;

    soundManager.play('whoosh');
    setAvailableLetters([...availableLetters, letter]);
    setPlacedLetters(placedLetters.filter((_, idx) => idx !== index));
  };

  return (
    <KidsGameWrapper
      game={gameDef}
      currentRound={currentRound}
      totalRounds={TOTAL_ROUNDS}
      starsEarned={starsEarned}
      instructionEn={`Spell: ${currentWord.word}`}
      instructionVi={`Đánh vần từ: ${currentWord.viMeaning}`}
      onExit={onExit}
      onNextGame={onNextGame}
      onPlayAgain={() => {
        setCurrentRound(1);
        setStarsEarned(0);
        setIsGameComplete(false);
        setIsReadyToContinue(false);
        initRound(1);
      }}
      isGameComplete={isGameComplete}
      isReadyToContinue={isReadyToContinue}
      onContinueRound={handleContinueRound}
      praiseVi={praiseVi}
      onReplayAudio={() => voiceService.speakWord(currentWord.word)}
    >
      <div className="p-4 sm:p-8 flex flex-col items-center justify-between min-h-[440px] bg-gradient-to-b from-indigo-50 via-purple-50 to-white select-none space-y-6">
        {/* Central Word Illustration */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-white border-3 border-indigo-200 shadow-md p-3 flex items-center justify-center">
            <KidsIllustration
              name={currentWord.id}
              className="w-full h-full object-contain"
              alt={currentWord.word}
            />
          </div>
          <span className="text-sm font-black text-slate-700">
            {currentWord.viMeaning}
          </span>
        </div>

        {/* Spelling Slots Line */}
        <div className="flex items-center gap-3">
          {currentWord.letters.map((_, idx) => {
            const placed = placedLetters[idx];

            return (
              <button
                key={idx}
                onClick={() => placed && handleReturnLetter(placed, idx)}
                disabled={isWordCorrect}
                className={`w-14 h-16 sm:w-18 sm:h-20 rounded-2xl border-3 flex items-center justify-center text-2xl sm:text-3xl font-black transition-all shadow-md ${
                  placed
                    ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 border-amber-500 text-amber-950 scale-105'
                    : 'bg-white/80 border-dashed border-slate-300 text-slate-300'
                }`}
              >
                {placed || '_'}
              </button>
            );
          })}
        </div>

        {/* Letter Tiles Tray */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md">
          {availableLetters.map((char, idx) => (
            <button
              key={`${char}_${idx}`}
              onClick={() => handlePlaceLetter(char, idx)}
              className="w-12 h-14 sm:w-16 sm:h-18 rounded-2xl bg-white hover:bg-indigo-100 border-2 border-indigo-300 hover:border-indigo-400 text-indigo-950 font-black text-xl sm:text-2xl shadow-md cursor-pointer active:scale-95 transition-all hover:scale-105"
            >
              {char}
            </button>
          ))}
        </div>
      </div>
    </KidsGameWrapper>
  );
};
