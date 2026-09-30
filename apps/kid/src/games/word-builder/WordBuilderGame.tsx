import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Sparkles, Check, Move } from 'lucide-react';
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
  { id: 'pig', word: 'PIG', letters: ['P', 'I', 'G'], distractors: ['C', 'N'], viMeaning: 'Con heo' },
  { id: 'fox', word: 'FOX', letters: ['F', 'O', 'X'], distractors: ['B', 'D'], viMeaning: 'Con cáo' },
  { id: 'cow', word: 'COW', letters: ['C', 'O', 'W'], distractors: ['R', 'M'], viMeaning: 'Con bò' },
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
  const [draggedLetter, setDraggedLetter] = useState<{ char: string; fromTrayIdx?: number; fromSlotIdx?: number } | null>(null);
  const [hoveredSlotIdx, setHoveredSlotIdx] = useState<number | null>(null);

  const [isWordCorrect, setIsWordCorrect] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isReadyToContinue, setIsReadyToContinue] = useState(false);
  const [praiseVi, setPraiseVi] = useState('Bé ghép chữ rất giỏi!');

  // Initialize round
  const initRound = useCallback((roundNum: number) => {
    setIsWordCorrect(false);
    setIsReadyToContinue(false);
    setPlacedLetters([]);
    setDraggedLetter(null);
    setHoveredSlotIdx(null);

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

  // Check spelling status
  const evaluateSpelling = (letters: string[]) => {
    if (letters.length === currentWord.letters.length) {
      if (letters.join('') === currentWord.word) {
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

  // Place letter to next empty slot or targeted slot
  const handlePlaceLetter = (letter: string, fromIndex: number) => {
    if (isWordCorrect || isReadyToContinue || placedLetters.length >= currentWord.letters.length) return;

    soundManager.play('pop');
    const nextPlaced = [...placedLetters, letter];
    setPlacedLetters(nextPlaced);

    const nextAvailable = availableLetters.filter((_, idx) => idx !== fromIndex);
    setAvailableLetters(nextAvailable);

    evaluateSpelling(nextPlaced);
  };

  // Return placed letter to tray
  const handleReturnLetter = (letter: string, slotIdx: number) => {
    if (isWordCorrect || isReadyToContinue) return;

    soundManager.play('whoosh');
    setAvailableLetters((prev) => [...prev, letter]);
    setPlacedLetters((prev) => prev.filter((_, idx) => idx !== slotIdx));
  };

  // Drop letter into slot area
  const handleDropOnSlot = (targetSlotIdx: number) => {
    if (!draggedLetter || isWordCorrect || isReadyToContinue) return;

    if (draggedLetter.fromTrayIdx !== undefined) {
      handlePlaceLetter(draggedLetter.char, draggedLetter.fromTrayIdx);
    }
    setDraggedLetter(null);
    setHoveredSlotIdx(null);
  };

  // Touch drag helpers
  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const slotEl = target?.closest('[data-slot-idx]');
    if (slotEl) {
      const idx = parseInt(slotEl.getAttribute('data-slot-idx') || '0', 10);
      setHoveredSlotIdx(idx);
    } else {
      setHoveredSlotIdx(null);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    if (touch && draggedLetter) {
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const slotEl = target?.closest('[data-slot-idx]') || target?.closest('[data-word-slots]');
      if (slotEl) {
        if (draggedLetter.fromTrayIdx !== undefined) {
          handlePlaceLetter(draggedLetter.char, draggedLetter.fromTrayIdx);
        }
      }
    }
    setDraggedLetter(null);
    setHoveredSlotIdx(null);
  };

  return (
    <KidsGameWrapper
      game={gameDef}
      currentRound={currentRound}
      totalRounds={TOTAL_ROUNDS}
      starsEarned={starsEarned}
      instructionEn={`Drag or tap letters to spell: ${currentWord.word}`}
      instructionVi={`Kéo thả hoặc chạm các chữ cái để đánh vần: ${currentWord.viMeaning}`}
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
      <div className="p-4 sm:p-8 flex flex-col items-center justify-between min-h-[460px] bg-gradient-to-b from-indigo-50 via-purple-50 to-white select-none space-y-6">
        {/* Central Word Illustration */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-white border-3 border-indigo-200 shadow-md p-3 flex items-center justify-center">
            <KidsIllustration
              name={currentWord.id}
              className="w-full h-full object-contain filter drop-shadow-xs"
              alt={currentWord.word}
            />
          </div>
          <span className="text-sm font-black text-slate-700">
            {currentWord.viMeaning}
          </span>
        </div>

        {/* Spelling Slots Line (Interactive Drop Targets) */}
        <div
          data-word-slots="true"
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedLetter && draggedLetter.fromTrayIdx !== undefined) {
              handlePlaceLetter(draggedLetter.char, draggedLetter.fromTrayIdx);
            }
            setDraggedLetter(null);
            setHoveredSlotIdx(null);
          }}
          className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 border-2 border-dashed border-indigo-200"
        >
          {currentWord.letters.map((_, idx) => {
            const placed = placedLetters[idx];
            const isHovered = hoveredSlotIdx === idx;

            return (
              <button
                key={idx}
                data-slot-idx={idx}
                onClick={() => placed && handleReturnLetter(placed, idx)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setHoveredSlotIdx(idx);
                }}
                onDragLeave={() => setHoveredSlotIdx(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropOnSlot(idx);
                }}
                disabled={isWordCorrect}
                className={`w-14 h-16 sm:w-18 sm:h-20 rounded-2xl border-3 flex flex-col items-center justify-center text-2xl sm:text-3xl font-black transition-all shadow-md select-none cursor-pointer ${
                  placed
                    ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 border-amber-500 text-amber-950 scale-105 active:scale-95'
                    : isHovered
                    ? 'bg-indigo-100 border-indigo-500 scale-110 ring-4 ring-indigo-300/50 text-indigo-700'
                    : 'bg-white/90 border-dashed border-slate-300 text-slate-300 hover:border-indigo-400'
                }`}
                title={placed ? 'Chạm để rút chữ về' : 'Kéo thả chữ vào đây'}
              >
                <span>{placed || '_'}</span>
                {placed && (
                  <span className="text-[9px] font-bold text-amber-800 -mt-1 opacity-70">
                    rút về
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Letter Tiles Tray (Draggable letter blocks) */}
        <div className="w-full max-w-md">
          <div className="text-center mb-2">
            <span className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-indigo-500" />
              <span>Kéo thả chữ lên ô hoặc chạm để chọn:</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 p-3.5 rounded-3xl bg-white/95 border-2 border-indigo-100 shadow-sm">
            {availableLetters.map((char, idx) => {
              const isDragging = draggedLetter?.char === char && draggedLetter?.fromTrayIdx === idx;

              return (
                <div
                  key={`${char}_${idx}`}
                  draggable={!isWordCorrect && !isReadyToContinue}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', char);
                    setDraggedLetter({ char, fromTrayIdx: idx });
                    soundManager.play('pop');
                  }}
                  onDragEnd={() => {
                    setDraggedLetter(null);
                    setHoveredSlotIdx(null);
                  }}
                  onTouchStart={() => {
                    setDraggedLetter({ char, fromTrayIdx: idx });
                    soundManager.play('pop');
                  }}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onClick={() => handlePlaceLetter(char, idx)}
                  className={`w-12 h-14 sm:w-16 sm:h-18 rounded-2xl border-2 font-black text-xl sm:text-2xl shadow-md cursor-grab active:cursor-grabbing flex items-center justify-center transition-all select-none ${
                    isDragging
                      ? 'opacity-40 scale-95 border-dashed border-indigo-400 bg-indigo-50'
                      : 'bg-white hover:bg-indigo-100 border-indigo-300 hover:border-indigo-400 text-indigo-950 hover:scale-105 active:scale-95'
                  }`}
                >
                  {char}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </KidsGameWrapper>
  );
};

