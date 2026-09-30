// ============================================================================
// GAME 11: BUILD THE SENTENCE (ĐOÀN TÀU GHÉP CÂU)
// READ/HEAR -> ORDER -> CONSTRUCT SENTENCE • Railroad Track • Train Carriages
// Non-Auto-Advancing: User taps Continue button after sentence & praise finish
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Sparkles, Check, ArrowRight } from 'lucide-react';
import { KidsGameWrapper } from '../core/KidsGameWrapper';
import { KIDS_GAMES_REGISTRY } from '../../data/games/gamesRegistry';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';

interface SentenceChallenge {
  id: string;
  words: string[];
  fullSentence: string;
  sentenceVi: string;
  icon: string;
}

const SENTENCE_CHALLENGES: SentenceChallenge[] = [
  { id: 's1', words: ['I', 'like', 'apples'], fullSentence: 'I like apples', sentenceVi: 'Tôi thích những quả táo', icon: '🍎' },
  { id: 's2', words: ['The', 'dog', 'runs'], fullSentence: 'The dog runs', sentenceVi: 'Chú chó đang chạy', icon: '🐶' },
  { id: 's3', words: ['I', 'see', 'a', 'cat'], fullSentence: 'I see a cat', sentenceVi: 'Tôi nhìn thấy một chú mèo', icon: '🐱' },
  { id: 's4', words: ['The', 'sun', 'is', 'hot'], fullSentence: 'The sun is hot', sentenceVi: 'Mặt trời rất nóng', icon: '☀️' },
  { id: 's5', words: ['We', 'love', 'music'], fullSentence: 'We love music', sentenceVi: 'Chúng tôi yêu âm nhạc', icon: '🎵' },
];

interface BuildSentenceGameProps {
  onExit: () => void;
  onStarsAwarded?: (stars: number) => void;
  onNextGame?: () => void;
}

export const BuildSentenceGame: React.FC<BuildSentenceGameProps> = ({
  onExit,
  onStarsAwarded,
  onNextGame,
}) => {
  const gameDef = KIDS_GAMES_REGISTRY.find((g) => g.id === 'build_sentence') || KIDS_GAMES_REGISTRY[10];

  const TOTAL_ROUNDS = 5;
  const [currentRound, setCurrentRound] = useState(1);
  const [starsEarned, setStarsEarned] = useState(0);
  const [challenge, setChallenge] = useState<SentenceChallenge>(SENTENCE_CHALLENGES[0]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [placedWords, setPlacedWords] = useState<string[]>([]);
  const [isTrainDeparting, setIsTrainDeparting] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isReadyToContinue, setIsReadyToContinue] = useState(false);
  const [praiseVi, setPraiseVi] = useState('');

  // Initialize round
  const initRound = useCallback((roundNum: number) => {
    setIsTrainDeparting(false);
    setPlacedWords([]);
    setIsReadyToContinue(false);

    const target = SENTENCE_CHALLENGES[(roundNum - 1) % SENTENCE_CHALLENGES.length];
    setChallenge(target);

    // Shuffle word tiles
    const shuffled = [...target.words].sort(() => Math.random() - 0.5);
    setAvailableWords(shuffled);
  }, []);

  useEffect(() => {
    initRound(1);
  }, [initRound]);

  // Click available word to place into train carriage
  const handlePlaceWord = (word: string, index: number) => {
    if (isTrainDeparting || isReadyToContinue) return;

    soundManager.play('pop');
    const newPlaced = [...placedWords, word];
    setPlacedWords(newPlaced);

    const newAvailable = availableWords.filter((_, idx) => idx !== index);
    setAvailableWords(newAvailable);

    // Check if sentence complete
    if (newPlaced.length === challenge.words.length) {
      if (newPlaced.join(' ') === challenge.words.join(' ')) {
        // CORRECT! TRAIN DEPARTS!
        setIsTrainDeparting(true);
        soundManager.play('star_burst');
        soundManager.play('correct');

        const earned = 2;
        setStarsEarned((prev) => prev + earned);
        if (onStarsAwarded) onStarsAwarded(earned);

        // Sequence: read full sentence -> read praise -> enable Continue button
        voiceService.speakSentence(challenge.fullSentence, {
          onEnd: () => {
            const praise = 'Đoàn tàu ghép câu chạy xuất sắc!';
            setPraiseVi(praise);
            voiceService.speakVietnamese(praise, {
              onEnd: () => {
                setIsReadyToContinue(true);
              },
            });
          },
        });
      } else {
        // WRONG ORDER
        soundManager.play('wrong');
        voiceService.speakVietnamese('Thứ tự câu chưa đúng, bé thử lại nhé!');
        setTimeout(() => {
          setAvailableWords(challenge.words.sort(() => Math.random() - 0.5));
          setPlacedWords([]);
        }, 1000);
      }
    }
  };

  const handleReturnWord = (word: string, index: number) => {
    if (isTrainDeparting || isReadyToContinue) return;
    soundManager.play('whoosh');
    setPlacedWords(placedWords.filter((_, idx) => idx !== index));
    setAvailableWords([...availableWords, word]);
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
      worldTheme="station"
      instructionEn={`Build: "${challenge.fullSentence}"`}
      instructionVi={`Ghép câu: "${challenge.sentenceVi}"`}
      isReadyToContinue={isReadyToContinue}
      onContinueRound={handleAdvanceRound}
      praiseVi={praiseVi}
      onExit={onExit}
      onReplayAudio={() => voiceService.speakSentence(challenge.fullSentence)}
      onNextGame={onNextGame}
      onPlayAgain={() => {
        setCurrentRound(1);
        setStarsEarned(0);
        setIsGameComplete(false);
        initRound(1);
      }}
      isGameComplete={isGameComplete}
    >
      {/* FULL-BLEED STEAM TRAIN RAILROAD SCENE */}
      <div className="relative w-full h-full p-4 sm:p-8 flex flex-col justify-between items-center overflow-hidden bg-gradient-to-b from-sky-200 via-amber-50 to-emerald-100 select-none">
        {/* Scenic Mountain & Cloud Background */}
        <div className="absolute top-4 left-8 text-3xl opacity-70 animate-bounce pointer-events-none select-none">
          ☁️
        </div>
        <div className="absolute top-6 right-10 text-3xl opacity-80 pointer-events-none select-none">
          🏔️
        </div>

        {/* Target Sentence Meaning Banner */}
        <div className="relative z-20 flex flex-col items-center text-center space-y-1">
          <div className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-white/95 text-indigo-950 font-black text-xs sm:text-sm border-2 border-indigo-400 shadow-md flex items-center gap-2">
            <span className="text-xl animate-pulse">{challenge.icon}</span>
            <span>CÂU MỤC TIÊU: "{challenge.sentenceVi.toUpperCase()}"</span>
          </div>
          <span className="text-xs font-bold text-slate-700">
            Gắn các toa từ vào đầu tàu theo đúng thứ tự để tàu hỏa hú còi lăn bánh!
          </span>
        </div>

        {/* THE RAILROAD TRACK & STEAM TRAIN */}
        <div className="relative z-10 w-full max-w-4xl my-auto py-4 sm:py-6">
          {/* Steel Railroad Rails */}
          <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 h-3.5 bg-slate-700 rounded-full border-t-2 border-slate-500 shadow-sm" />
          {/* Wooden Sleepers / Ties */}
          <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 h-7 flex justify-between px-2 pointer-events-none opacity-40">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="w-1.5 h-full bg-amber-900 rounded-sm" />
            ))}
          </div>

          {/* Train Unit (Locomotive + Connected Carriages) */}
          <div
            className={`relative z-10 flex items-center gap-1.5 overflow-x-auto pb-4 pt-2 transition-transform duration-1000 ${
              isTrainDeparting ? 'translate-x-full opacity-90' : ''
            }`}
          >
            {/* Locomotive Head */}
            <div className="shrink-0 flex flex-col items-center">
              {isTrainDeparting && (
                <span className="text-2xl -mb-2 animate-bounce">💨</span>
              )}
              <div className="w-20 sm:w-26 h-18 sm:h-22 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 border-3 sm:border-4 border-amber-700 shadow-xl flex flex-col items-center justify-center text-white relative">
                <span className="text-2xl sm:text-3xl">🚂</span>
                <span className="text-[9px] font-black uppercase mt-0.5">ĐẦU TÀU</span>
                {/* Wheels */}
                <div className="absolute -bottom-2.5 inset-x-2 flex justify-between">
                  <div className="w-5 h-5 rounded-full bg-slate-900 border-2 border-amber-400" />
                  <div className="w-5 h-5 rounded-full bg-slate-900 border-2 border-amber-400" />
                </div>
              </div>
            </div>

            {/* Word Carriage Slots */}
            {challenge.words.map((_, slotIdx) => {
              const placedWord = placedWords[slotIdx];

              return (
                <div key={slotIdx} className="shrink-0 flex items-center">
                  {/* Metal Coupler */}
                  <div className="w-2.5 sm:w-3.5 h-1.5 bg-slate-800" />

                  {/* Carriage Box */}
                  <div
                    onClick={() => placedWord && handleReturnWord(placedWord, slotIdx)}
                    className={`w-22 sm:w-28 h-18 sm:h-22 rounded-2xl border-2 sm:border-3 transition-all flex flex-col items-center justify-center p-2 text-center cursor-pointer relative ${
                      placedWord
                        ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 border-amber-300 text-white shadow-lg animate-scaleUp'
                        : 'bg-white/90 border-dashed border-indigo-300 text-slate-400 shadow-inner'
                    }`}
                  >
                    {placedWord ? (
                      <>
                        <span className="text-sm sm:text-lg font-black capitalize drop-shadow-sm">
                          {placedWord}
                        </span>
                        <span className="text-[8px] font-bold text-amber-200 mt-0.5 uppercase">
                          TOA #{slotIdx + 1}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">
                        Toa {slotIdx + 1}
                      </span>
                    )}

                    {/* Carriage Wheels */}
                    <div className="absolute -bottom-2.5 inset-x-2 flex justify-between">
                      <div className="w-4 h-4 rounded-full bg-slate-900 border-2 border-slate-600" />
                      <div className="w-4 h-4 rounded-full bg-slate-900 border-2 border-slate-600" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Available Word Bricks Tray */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-2.5 w-full max-w-xl pb-1">
          {availableWords.map((word, idx) => (
            <button
              key={`${word}_${idx}`}
              onClick={() => handlePlaceWord(word, idx)}
              className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl bg-white hover:bg-amber-100 border-2 border-amber-300 hover:border-amber-400 text-slate-900 font-black text-sm sm:text-base shadow-md cursor-pointer active:scale-95 transition-all hover:scale-105 min-h-[44px]"
            >
              {word}
            </button>
          ))}
        </div>
      </div>
    </KidsGameWrapper>
  );
};
