import React, { useState, useEffect } from 'react';
import { SunnySoundFX } from '../../services/audio/SunnySoundFX';
import { BilingualVoiceEngine } from '../../services/audio/BilingualVoiceEngine';
import SunnyBilingualGuide from '../../components/SunnyBilingualGuide';
import VictoryCelebrationModal from '../../components/VictoryCelebrationModal';
import { meadowStore } from '../../core/meadowStateStore';

interface Game1Props {
  onExit: () => void;
  onComplete?: () => void;
}

interface MemoryCard {
  uniqueId: string;
  pairKey: string;
  type: 'image' | 'word';
  wordEn: string;
  wordVi: string;
  svgSymbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const ALL_PAIRS = [
  { key: 'apple', wordEn: 'Apple', wordVi: 'Quả táo đỏ', symbol: '#svg-item-apple' },
  { key: 'strawberry', wordEn: 'Strawberry', wordVi: 'Dâu tây ngọt', symbol: '#svg-item-strawberry' },
  { key: 'carrot', wordEn: 'Carrot', wordVi: 'Củ cà rốt', symbol: '#svg-item-carrot' },
  { key: 'banana', wordEn: 'Banana', wordVi: 'Quả chuối vàng', symbol: '#svg-item-banana' },
  { key: 'mushroom', wordEn: 'Mushroom', wordVi: 'Cây nấm đỏ', symbol: '#svg-red-mushroom' },
  { key: 'grape', wordEn: 'Grape', wordVi: 'Chùm nho tím', symbol: '#svg-item-grape' },
];

export const Game1_SunnyMemoryFlip: React.FC<Game1Props> = ({ onExit, onComplete }) => {
  const [level, setLevel] = useState<number>(1); // Level 1 (4 pairs = 8 cards), Level 2 (6 pairs = 12 cards)
  const totalLevels = 2;

  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<MemoryCard[]>([]);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [errorsCount, setErrorsCount] = useState<number>(0);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [showVictory, setShowVictory] = useState<boolean>(false);

  const currentPairCount = level === 1 ? 4 : 6;

  // Initialize Cards for current level
  useEffect(() => {
    initLevel(level);
  }, [level]);

  const initLevel = (lvl: number) => {
    const pairCount = lvl === 1 ? 4 : 6;
    const selectedPairs = ALL_PAIRS.slice(0, pairCount);
    const deck: MemoryCard[] = [];

    selectedPairs.forEach((item, idx) => {
      // 1 Card for Image
      deck.push({
        uniqueId: `${item.key}_img_${idx}`,
        pairKey: item.key,
        type: 'image',
        wordEn: item.wordEn,
        wordVi: item.wordVi,
        svgSymbol: item.symbol,
        isFlipped: false,
        isMatched: false,
      });

      // 1 Card for Word
      deck.push({
        uniqueId: `${item.key}_txt_${idx}`,
        pairKey: item.key,
        type: 'word',
        wordEn: item.wordEn,
        wordVi: item.wordVi,
        svgSymbol: item.symbol,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle deck
    const shuffled = deck.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setSelectedCards([]);
    setIsEvaluating(false);
    setErrorsCount(0);
    setMatchedPairs(0);
    setShowVictory(false);
  };

  const handleCardClick = (card: MemoryCard) => {
    if (isEvaluating || card.isFlipped || card.isMatched || selectedCards.length >= 2) return;

    // Flip audio & speak word
    SunnySoundFX.playCardFlip();
    BilingualVoiceEngine.speakEnglish(card.wordEn);

    const updatedCards = cards.map((c) =>
      c.uniqueId === card.uniqueId ? { ...c, isFlipped: true } : c
    );
    setCards(updatedCards);

    const newSelected = [...selectedCards, card];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setIsEvaluating(true);
      const [first, second] = newSelected;

      if (first.pairKey === second.pairKey && first.uniqueId !== second.uniqueId) {
        // MATCH!
        setTimeout(() => {
          SunnySoundFX.playCorrect();
          BilingualVoiceEngine.speakVietnamese(`Đúng rồi bé ơi! ${first.wordEn}!`);

          const matchedCards = updatedCards.map((c) =>
            c.pairKey === first.pairKey ? { ...c, isMatched: true, isFlipped: true } : c
          );
          setCards(matchedCards);
          setSelectedCards([]);
          setIsEvaluating(false);

          const nextMatched = matchedPairs + 1;
          setMatchedPairs(nextMatched);

          if (nextMatched >= currentPairCount) {
            // Level cleared!
            setTimeout(() => {
              setShowVictory(true);
              meadowStore.recordGameRound('hungryPicnic', 20); // Sync stars
              if (onComplete && level >= totalLevels) onComplete();
            }, 600);
          }
        }, 500);
      } else {
        // WRONG! (Zero punishment: soft bounce, wobble, and flip back)
        setTimeout(() => {
          SunnySoundFX.playWrong();
          setErrorsCount((prev) => prev + 1);

          setTimeout(() => {
            const resetCards = updatedCards.map((c) =>
              c.uniqueId === first.uniqueId || c.uniqueId === second.uniqueId
                ? { ...c, isFlipped: false }
                : c
            );
            setCards(resetCards);
            setSelectedCards([]);
            setIsEvaluating(false);
          }, 600);
        }, 600);
      }
    }
  };

  const viPrompt =
    level === 1
      ? 'Bé ơi, hãy lật tìm 4 cặp thẻ bài hình ảnh và từ vựng giống nhau nhé!'
      : 'Thử thách nâng cao: Bé hãy lật tìm 6 cặp thẻ bài trong khu rừng nhé!';
  const enPrompt = 'Find and match all the pairs!';

  return (
    <div className="game-stage-wrapper select-none animate-fadeIn pb-12">
      {/* 1. Header Navigation */}
      <div className="w-full flex items-center justify-between mb-4 px-2">
        <button
          type="button"
          onClick={() => {
            SunnySoundFX.playButtonClick();
            onExit();
          }}
          className="toy-btn toy-btn-amber !min-h-[48px] !py-2 !px-4 text-sm"
        >
          ← Trở Về Khu Rừng
        </button>

        <div className="flex items-center gap-3">
          <div className="px-4 py-1.5 rounded-2xl bg-amber-100 border-2 border-amber-300 font-display font-extrabold text-amber-900 text-sm flex items-center gap-2 shadow-2xs">
            <svg className="w-5 h-5"><use href="#svg-star-gold"></use></svg>
            <span>Màn {level} / {totalLevels}</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-2xl bg-rose-50 border-2 border-rose-200 font-display font-extrabold text-rose-800 text-xs shadow-2xs">
            Số lỗi: {errorsCount}
          </div>
        </div>
      </div>

      {/* 2. Anti-Cramped Game Canvas Card */}
      <div className="game-canvas-card">
        {/* Mascot Bilingual Guide Bar */}
        <SunnyBilingualGuide
          viPrompt={viPrompt}
          enPrompt={enPrompt}
          badgeTitle="Game 1 • Lật Thẻ Trí Nhớ Rừng Xanh"
          extraRightSlot={
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 font-display font-extrabold text-emerald-800 text-xs">
              <span>Cặp ghép:</span>
              <span className="text-base text-emerald-600">{matchedPairs} / {currentPairCount}</span>
            </div>
          }
        />

        {/* 3. 3D Memory Card Grid */}
        <div
          className={`grid gap-3 sm:gap-4 md:gap-5 mx-auto max-w-3xl ${
            level === 1
              ? 'grid-cols-2 sm:grid-cols-4'
              : 'grid-cols-3 sm:grid-cols-4'
          }`}
        >
          {cards.map((card) => {
            return (
              <div
                key={card.uniqueId}
                onClick={() => handleCardClick(card)}
                className={`card-perspective h-36 sm:h-44 md:h-48 cursor-pointer active:scale-95 transition-transform ${
                  card.isMatched ? 'pointer-events-none' : ''
                }`}
              >
                <div
                  className={`card-flip-inner w-full h-full ${
                    card.isFlipped ? 'is-flipped' : ''
                  }`}
                >
                  {/* Card Back (Vân lá thiên nhiên #svg-card-back-leaf) */}
                  <div className="card-face card-face-back meadow-clay-card flex items-center justify-center bg-[#FFFBEB] border-4 border-amber-300 shadow-sm hover:border-amber-400">
                    <svg className="w-full h-full p-2">
                      <use href="#svg-card-back-leaf"></use>
                    </svg>
                  </div>

                  {/* Card Front (Face Revealed) */}
                  <div
                    className={`card-face card-face-front meadow-clay-card flex flex-col items-center justify-center p-3 sm:p-4 text-center border-4 shadow-md ${
                      card.isMatched
                        ? 'border-[#16A34A] bg-[#DCFCE7] ring-4 ring-emerald-300/80 animate-pulse'
                        : 'border-[#BAE6FD] bg-[#FFFFFF]'
                    }`}
                  >
                    {card.type === 'image' ? (
                      <div className="flex flex-col items-center justify-center w-full h-full">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                          <svg className="w-full h-full drop-shadow-sm">
                            <use href={card.svgSymbol}></use>
                          </svg>
                        </div>
                        <span className="mt-1 text-xs font-extrabold text-slate-400 font-display">
                          {card.wordVi}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-full space-y-1">
                        <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-display uppercase tracking-wider">
                          {card.wordEn}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-emerald-700 font-display">
                          {card.wordVi}
                        </span>
                        <span className="text-xl">🔊</span>
                      </div>
                    )}
                  </div>
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
        gameTitle="Lật Thẻ Trí Nhớ Rừng Xanh"
        currentLevel={level}
        totalLevels={totalLevels}
        onReplay={() => initLevel(level)}
        onNextLevel={level < totalLevels ? () => setLevel(level + 1) : undefined}
        onExit={onExit}
      />
    </div>
  );
};

export default Game1_SunnyMemoryFlip;
