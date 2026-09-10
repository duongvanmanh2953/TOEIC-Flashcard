import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import { KidsIcon } from '../assets/icons/KidsIcons';
import { KidsMascot } from '../components/KidsMascot';
import { soundManager } from '../services/sound/KidsSoundManager';
import { speechManager } from '../services/speech/KidsSpeechManager';
import { getKidsProgress, updateKidsProgress } from '../curriculum/curriculumProgress';

interface CardItem {
  id: number;
  word: string;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const VOCAB_PAIRS = [
  { word: 'Lion', emoji: '🦁' },
  { word: 'Monkey', emoji: '🐒' },
  { word: 'Elephant', emoji: '🐘' },
  { word: 'Apple', emoji: '🍎' },
  { word: 'Banana', emoji: '🍌' },
  { word: 'Orange', emoji: '🍊' },
  { word: 'Cat', emoji: '🐱' },
  { word: 'Dog', emoji: '🐶' },
];

export const KidsGamesPage: React.FC = () => {
  const { t } = useTranslation();
  const [cards, setCards] = useState<CardItem[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [matchesCount, setMatchesCount] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [moves, setMoves] = useState(0);
  const [difficulty, setDifficulty] = useState<4 | 6 | 8>(6);

  // Initialize game deck
  const startNewGame = (pairCount: number = difficulty) => {
    soundManager.playPop();
    const selectedVocab = [...VOCAB_PAIRS].sort(() => 0.5 - Math.random()).slice(0, pairCount);
    
    // Create 2 cards per vocabulary word
    const deck: CardItem[] = [];
    let idCounter = 1;
    selectedVocab.forEach(item => {
      deck.push({ id: idCounter++, word: item.word, emoji: item.emoji, isFlipped: false, isMatched: false });
      deck.push({ id: idCounter++, word: item.word, emoji: item.emoji, isFlipped: false, isMatched: false });
    });

    // Shuffle deck
    const shuffled = deck.sort(() => 0.5 - Math.random());
    setCards(shuffled);
    setSelectedCards([]);
    setMatchesCount(0);
    setMoves(0);
    setIsGameOver(false);

    speechManager.speak("Find the matching pairs!");
  };

  useEffect(() => {
    startNewGame(difficulty);
  }, [difficulty]);

  const handleCardClick = (index: number) => {
    // Prevent clicking already flipped or matched cards or if 2 already opened
    if (cards[index].isFlipped || cards[index].isMatched || selectedCards.length >= 2) {
      return;
    }

    soundManager.playPop();
    const updatedCards = [...cards];
    updatedCards[index].isFlipped = true;
    setCards(updatedCards);

    const newSelected = [...selectedCards, index];
    setSelectedCards(newSelected);

    // If 2 cards flipped, check match
    if (newSelected.length === 2) {
      setMoves(prev => prev + 1);
      const firstIdx = newSelected[0];
      const secondIdx = newSelected[1];

      if (cards[firstIdx].word === cards[secondIdx].word) {
        // Matched!
        setTimeout(() => {
          soundManager.playCorrect();
          speechManager.speak(cards[firstIdx].word);

          const matchedCards = [...cards];
          matchedCards[firstIdx].isMatched = true;
          matchedCards[secondIdx].isMatched = true;
          setCards(matchedCards);
          setSelectedCards([]);
          
          const newMatches = matchesCount + 1;
          setMatchesCount(newMatches);

          // All pairs matched?
          if (newMatches === difficulty) {
            handleGameWin();
          }
        }, 500);
      } else {
        // Not a match, flip back
        setTimeout(() => {
          soundManager.playIncorrect();
          const resetCards = [...cards];
          resetCards[firstIdx].isFlipped = false;
          resetCards[secondIdx].isFlipped = false;
          setCards(resetCards);
          setSelectedCards([]);
        }, 900);
      }
    }
  };

  const handleGameWin = () => {
    setIsGameOver(true);
    soundManager.playFanfare();
    speechManager.speak("Congratulations! You found all matches!");
    // Award 5 bonus stars
    const p = getKidsProgress();
    p.totalStars += 5;
    p.totalXp += 30;
    updateKidsProgress(p);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-fadeIn pb-16">
      {/* Game Header */}
      <div className="bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4 text-center md:text-left">
          <KidsMascot mood={isGameOver ? 'celebrate' : 'excited'} size={90} speechText={isGameOver ? 'You won!' : 'Match them!'} />
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-black uppercase mb-1">
              <span>🎮 Word Match Arcade</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black">Memory Safari</h1>
            <p className="text-white/90 text-xs md:text-sm font-medium">Flip cards to match the English vocabulary!</p>
          </div>
        </div>

        {/* Stats & Difficulty */}
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl text-center">
            <div className="text-xs font-bold uppercase tracking-wider text-white/80">Pairs</div>
            <div className="text-lg md:text-xl font-black">{matchesCount} / {difficulty}</div>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl text-center">
            <div className="text-xs font-bold uppercase tracking-wider text-white/80">Moves</div>
            <div className="text-lg md:text-xl font-black">{moves}</div>
          </div>
        </div>
      </div>

      {/* Difficulty Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-600 uppercase">Cards:</span>
          {([4, 6, 8] as const).map(count => (
            <button
              key={count}
              onClick={() => setDifficulty(count)}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                difficulty === count
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {count * 2} Cards
            </button>
          ))}
        </div>

        <button
          onClick={() => startNewGame(difficulty)}
          className="px-4 py-2 rounded-xl bg-white border-2 border-orange-200 text-orange-600 hover:bg-orange-50 font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <span>🔄</span>
          <span>Restart</span>
        </button>
      </div>

      {/* Cards Grid */}
      <div className={`grid gap-3 md:gap-4 ${
        difficulty === 4
          ? 'grid-cols-2 sm:grid-cols-4'
          : difficulty === 6
          ? 'grid-cols-3 sm:grid-cols-4'
          : 'grid-cols-4 sm:grid-cols-4'
      }`}>
        {cards.map((card, idx) => {
          const isOpen = card.isFlipped || card.isMatched;
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(idx)}
              disabled={isOpen}
              className={`aspect-square rounded-3xl border-4 transition-all duration-300 transform flex flex-col items-center justify-center p-2 cursor-pointer shadow-md ${
                card.isMatched
                  ? 'bg-emerald-50 border-emerald-300 opacity-80 scale-95'
                  : isOpen
                  ? 'bg-white border-orange-400 scale-102 shadow-lg'
                  : 'bg-gradient-to-tr from-amber-300 to-orange-400 border-white hover:scale-105 active:scale-95'
              }`}
            >
              {isOpen ? (
                <div className="flex flex-col items-center animate-scaleIn">
                  <span className="text-4xl md:text-5xl mb-1">{card.emoji}</span>
                  <span className="text-xs md:text-sm font-black text-slate-800 tracking-wide">{card.word}</span>
                </div>
              ) : (
                <span className="text-3xl md:text-4xl font-black text-white/80">❓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Win Banner */}
      {isGameOver && (
        <div className="bg-emerald-500 text-white rounded-3xl p-6 text-center space-y-3 animate-bounce">
          <div className="text-4xl">🎉 🌟 🏆</div>
          <h2 className="text-2xl font-black">Awesome Memory Master!</h2>
          <p className="text-emerald-100 font-bold text-sm">You completed the safari in {moves} moves and earned 5 bonus stars!</p>
          <button
            onClick={() => startNewGame(difficulty)}
            className="px-6 py-3 rounded-2xl bg-white text-emerald-700 font-black text-base shadow-lg hover:bg-emerald-50 cursor-pointer"
          >
            Play Again!
          </button>
        </div>
      )}
    </div>
  );
};
