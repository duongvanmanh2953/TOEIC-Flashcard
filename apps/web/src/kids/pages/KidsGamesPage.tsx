import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { KidsIcon } from '../assets/icons/KidsIcons';
import { KidsMascot } from '../components/KidsMascot';
import { soundManager } from '../services/sound/KidsSoundManager';
import { kidsSpeech } from '../services/speech/KidsSpeechManager';
import { celebrationManager } from '../services/celebration/CelebrationManager';
import { getKidsProgress, updateKidsProgress } from '../curriculum/curriculumProgress';

type GameType =
  | 'find_it'
  | 'bubble'
  | 'memory'
  | 'rocket'
  | 'train'
  | 'sentence'
  | 'hunt'
  | 'speak_unlock';

type GameDifficulty = 'easy' | 'normal' | 'challenge';

interface VocabItem {
  word: string;
  viMeaning: string;
  emoji: string;
  letters: string[];
}

const VOCAB_DATA: VocabItem[] = [
  { word: 'Lion', viMeaning: 'Con sư tử', emoji: '🦁', letters: ['L', 'I', 'O', 'N'] },
  { word: 'Elephant', viMeaning: 'Con voi', emoji: '🐘', letters: ['E', 'L', 'E', 'P', 'H', 'A', 'N', 'T'] },
  { word: 'Monkey', viMeaning: 'Con khỉ', emoji: '🐒', letters: ['M', 'O', 'N', 'K', 'E', 'Y'] },
  { word: 'Apple', viMeaning: 'Quả táo', emoji: '🍎', letters: ['A', 'P', 'P', 'L', 'E'] },
  { word: 'Banana', viMeaning: 'Quả chuối', emoji: '🍌', letters: ['B', 'A', 'N', 'A', 'N', 'A'] },
  { word: 'Orange', viMeaning: 'Quả cam', emoji: '🍊', letters: ['O', 'R', 'A', 'N', 'G', 'E'] },
  { word: 'Cat', viMeaning: 'Con mèo', emoji: '🐱', letters: ['C', 'A', 'T'] },
  { word: 'Dog', viMeaning: 'Con chó', emoji: '🐶', letters: ['D', 'O', 'G'] },
  { word: 'Fish', viMeaning: 'Con cá', emoji: '🐟', letters: ['F', 'I', 'S', 'H'] },
  { word: 'Bird', viMeaning: 'Con chim', emoji: '🐦', letters: ['B', 'I', 'R', 'D'] },
  { word: 'Rabbit', viMeaning: 'Con thỏ', emoji: '🐰', letters: ['R', 'A', 'B', 'B', 'I', 'T'] },
  { word: 'Star', viMeaning: 'Ngôi sao', emoji: '⭐', letters: ['S', 'T', 'A', 'R'] },
  { word: 'Sun', viMeaning: 'Mặt trời', emoji: '☀️', letters: ['S', 'U', 'N'] },
  { word: 'Car', viMeaning: 'Xe ô tô', emoji: '🚗', letters: ['C', 'A', 'R'] },
];

const SENTENCE_DATA = [
  {
    words: ['I', 'like', 'apples'],
    full: 'I like apples.',
    vi: 'Mình thích những quả táo.',
    emoji: '🍎',
  },
  {
    words: ['The', 'cat', 'is', 'cute'],
    full: 'The cat is cute.',
    vi: 'Chú mèo thật dễ thương.',
    emoji: '🐱',
  },
  {
    words: ['I', 'see', 'a', 'lion'],
    full: 'I see a lion.',
    vi: 'Mình nhìn thấy một con sư tử.',
    emoji: '🦁',
  },
  {
    words: ['The', 'sun', 'is', 'bright'],
    full: 'The sun is bright.',
    vi: 'Mặt trời tỏa nắng rực rỡ.',
    emoji: '☀️',
  },
];

export const KidsGamesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialGame = (searchParams.get('game') as GameType) || 'find_it';
  const [activeGame, setActiveGame] = useState<GameType>(initialGame);
  const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');

  // Sync route query
  const handleSelectGame = (game: GameType) => {
    soundManager.playPop();
    setActiveGame(game);
    setSearchParams({ game });
  };

  // ================================================================
  // GAME 1: FIND IT (AUDIO-FIRST RECOGNITION)
  // ================================================================
  const [findTarget, setFindTarget] = useState<VocabItem>(VOCAB_DATA[0]);
  const [findOptions, setFindOptions] = useState<VocabItem[]>([]);
  const [findScore, setFindScore] = useState(0);
  const [findFeedback, setFindFeedback] = useState<string | null>(null);

  const initFindRound = () => {
    const target = VOCAB_DATA[Math.floor(Math.random() * VOCAB_DATA.length)];
    const others = VOCAB_DATA.filter((v) => v.word !== target.word)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    const opts = [target, ...others].sort(() => 0.5 - Math.random());

    setFindTarget(target);
    setFindOptions(opts);
    setFindFeedback(null);

    // Audio prompt: "Find the elephant"
    setTimeout(() => {
      celebrationManager.promptFindItem(target.word, target.viMeaning);
    }, 350);
  };

  const handlePickFindOption = (item: VocabItem) => {
    if (item.word === findTarget.word) {
      soundManager.playCorrect();
      const praise = celebrationManager.getRandomPraise(false);
      setFindFeedback(praise);
      setFindScore((s) => s + 1);

      kidsSpeech.speakBilingual(item.word, item.viMeaning);
      const p = getKidsProgress();
      p.totalStars += 1;
      updateKidsProgress(p);

      setTimeout(() => {
        initFindRound();
      }, 1400);
    } else {
      soundManager.playIncorrect();
      setFindFeedback('Bé thử lại nhé!');
      celebrationManager.promptFindItem(findTarget.word, findTarget.viMeaning);
    }
  };

  // ================================================================
  // GAME 2: BUBBLE POP (POPPING BURST EFFECT)
  // ================================================================
  const [bubbleTarget, setBubbleTarget] = useState<VocabItem>(VOCAB_DATA[0]);
  const [bubbleOptions, setBubbleOptions] = useState<VocabItem[]>([]);
  const [bubbleScore, setBubbleScore] = useState(0);
  const [bubbleFeedback, setBubbleFeedback] = useState<string | null>(null);
  const [poppingWord, setPoppingWord] = useState<string | null>(null);

  const initBubbleRound = () => {
    const target = VOCAB_DATA[Math.floor(Math.random() * VOCAB_DATA.length)];
    const others = VOCAB_DATA.filter((v) => v.word !== target.word)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    const opts = [target, ...others].sort(() => 0.5 - Math.random());

    setBubbleTarget(target);
    setBubbleOptions(opts);
    setBubbleFeedback(null);
    setPoppingWord(null);

    setTimeout(() => {
      celebrationManager.promptFindItem(target.word, target.viMeaning);
    }, 350);
  };

  const handlePopBubble = (item: VocabItem) => {
    if (item.word === bubbleTarget.word) {
      setPoppingWord(item.word);
      soundManager.playPop();
      soundManager.playCorrect();
      setBubbleScore((s) => s + 1);
      setBubbleFeedback('Yeahhh! Nổ tung bóng rồi! 🎉');

      kidsSpeech.speakBilingual(item.word, item.viMeaning);
      const p = getKidsProgress();
      p.totalStars += 1;
      updateKidsProgress(p);

      setTimeout(() => {
        initBubbleRound();
      }, 1200);
    } else {
      soundManager.playIncorrect();
      setBubbleFeedback('Chưa đúng bóng rồi bé ơi!');
      celebrationManager.promptFindItem(bubbleTarget.word, bubbleTarget.viMeaning);
    }
  };

  // ================================================================
  // GAME 3: MEMORY MATCH (PAIR FLIP WITH AUDIO)
  // ================================================================
  interface CardItem {
    id: number;
    word: string;
    emoji: string;
    isFlipped: boolean;
    isMatched: boolean;
  }
  const [cards, setCards] = useState<CardItem[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [matchesCount, setMatchesCount] = useState(0);
  const [isMemoryWon, setIsMemoryWon] = useState(false);
  const [moves, setMoves] = useState(0);

  const initMemoryGame = (pairCount = 6) => {
    soundManager.playPop();
    const selectedVocab = [...VOCAB_DATA].sort(() => 0.5 - Math.random()).slice(0, pairCount);
    const deck: CardItem[] = [];
    let idCounter = 1;
    selectedVocab.forEach((item) => {
      deck.push({ id: idCounter++, word: item.word, emoji: item.emoji, isFlipped: false, isMatched: false });
      deck.push({ id: idCounter++, word: item.word, emoji: item.emoji, isFlipped: false, isMatched: false });
    });
    setCards(deck.sort(() => 0.5 - Math.random()));
    setSelectedCards([]);
    setMatchesCount(0);
    setMoves(0);
    setIsMemoryWon(false);

    setTimeout(() => {
      celebrationManager.speakPraise('Lật tìm các cặp hình giống nhau nhé!');
    }, 400);
  };

  const handleCardClick = (index: number) => {
    if (cards[index].isFlipped || cards[index].isMatched || selectedCards.length >= 2) return;

    soundManager.playPop();
    kidsSpeech.speak(cards[index].word);

    const updated = [...cards];
    updated[index].isFlipped = true;
    setCards(updated);

    const newSelected = [...selectedCards, index];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setMoves((prev) => prev + 1);
      const first = newSelected[0];
      const second = newSelected[1];

      if (cards[first].word === cards[second].word) {
        setTimeout(() => {
          soundManager.playCorrect();
          kidsSpeech.speakBilingual(cards[first].word);
          const matched = [...cards];
          matched[first].isMatched = true;
          matched[second].isMatched = true;
          setCards(matched);
          setSelectedCards([]);
          const newM = matchesCount + 1;
          setMatchesCount(newM);

          if (newM === 6) {
            setIsMemoryWon(true);
            celebrationManager.celebrate('gameWin');
            const p = getKidsProgress();
            p.totalStars += 5;
            updateKidsProgress(p);
          }
        }, 400);
      } else {
        setTimeout(() => {
          soundManager.playIncorrect();
          const reset = [...cards];
          reset[first].isFlipped = false;
          reset[second].isFlipped = false;
          setCards(reset);
          setSelectedCards([]);
        }, 900);
      }
    }
  };

  // ================================================================
  // GAME 4: WORD ROCKET (SPACE LAUNCH BLAST-OFF)
  // ================================================================
  const [rocketTarget, setRocketTarget] = useState<VocabItem>(VOCAB_DATA[11]);
  const [rocketOptions, setRocketOptions] = useState<VocabItem[]>([]);
  const [rocketLaunched, setRocketLaunched] = useState<string | null>(null);
  const [rocketScore, setRocketScore] = useState(0);

  const initRocketRound = () => {
    const target = VOCAB_DATA[Math.floor(Math.random() * VOCAB_DATA.length)];
    const others = VOCAB_DATA.filter((v) => v.word !== target.word)
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);
    const opts = [target, ...others].sort(() => 0.5 - Math.random());

    setRocketTarget(target);
    setRocketOptions(opts);
    setRocketLaunched(null);

    setTimeout(() => {
      celebrationManager.promptFindItem(target.word, target.viMeaning);
    }, 400);
  };

  const handleLaunchRocket = (item: VocabItem) => {
    if (item.word === rocketTarget.word) {
      setRocketLaunched(item.word);
      soundManager.playFanfare();
      soundManager.playCorrect();
      setRocketScore((s) => s + 1);

      kidsSpeech.speak(item.word);
      const p = getKidsProgress();
      p.totalStars += 2;
      updateKidsProgress(p);

      setTimeout(() => {
        initRocketRound();
      }, 1500);
    } else {
      soundManager.playIncorrect();
      celebrationManager.speakPraise('Chưa đúng tên lửa rồi, bé chọn lại nhé!');
    }
  };

  // ================================================================
  // GAME 5: SPELLING TRAIN (LETTERS WAGONS)
  // ================================================================
  const [trainWord, setTrainWord] = useState<VocabItem>(VOCAB_DATA[0]);
  const [missingIndex, setMissingIndex] = useState(1);
  const [letterOptions, setLetterOptions] = useState<string[]>([]);
  const [isTrainSolved, setIsTrainSolved] = useState(false);
  const [trainScore, setTrainScore] = useState(0);

  const initTrainRound = () => {
    const candidateWords = VOCAB_DATA.filter((v) => v.letters.length >= 3 && v.letters.length <= 5);
    const item = candidateWords[Math.floor(Math.random() * candidateWords.length)];
    const missIdx = Math.floor(Math.random() * item.letters.length);
    const correctLetter = item.letters[missIdx];

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const otherLetters: string[] = [];
    while (otherLetters.length < 3) {
      const randLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
      if (randLetter !== correctLetter && !otherLetters.includes(randLetter)) {
        otherLetters.push(randLetter);
      }
    }

    setTrainWord(item);
    setMissingIndex(missIdx);
    setLetterOptions([correctLetter, ...otherLetters].sort(() => 0.5 - Math.random()));
    setIsTrainSolved(false);

    setTimeout(() => {
      kidsSpeech.speak(item.word);
    }, 400);
  };

  const handlePickLetter = (letter: string) => {
    if (isTrainSolved) return;
    if (letter === trainWord.letters[missingIndex]) {
      setIsTrainSolved(true);
      soundManager.playDing();
      celebrationManager.celebrate('good');
      kidsSpeech.speak(trainWord.word);
      setTrainScore((s) => s + 1);

      const p = getKidsProgress();
      p.totalStars += 2;
      updateKidsProgress(p);

      setTimeout(() => {
        initTrainRound();
      }, 1600);
    } else {
      soundManager.playIncorrect();
      celebrationManager.speakPraise('Gần đúng rồi, bé chọn chữ khác thử xem!');
    }
  };

  // ================================================================
  // GAME 6: SENTENCE BUILDER (DRAG/TAP SENTENCE TRAIN)
  // ================================================================
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const currentSentence = SENTENCE_DATA[sentenceIndex % SENTENCE_DATA.length];
  const [placedWords, setPlacedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [isSentenceSolved, setIsSentenceSolved] = useState(false);

  const initSentenceRound = () => {
    setPlacedWords([]);
    setAvailableWords([...currentSentence.words].sort(() => 0.5 - Math.random()));
    setIsSentenceSolved(false);

    setTimeout(() => {
      kidsSpeech.speak(currentSentence.full);
    }, 400);
  };

  const handleAddWordToSentence = (word: string) => {
    soundManager.playPop();
    kidsSpeech.speak(word);

    const nextPlaced = [...placedWords, word];
    setPlacedWords(nextPlaced);
    setAvailableWords((prev) => {
      const idx = prev.indexOf(word);
      return prev.filter((_, i) => i !== idx);
    });

    if (nextPlaced.length === currentSentence.words.length) {
      if (nextPlaced.join(' ') === currentSentence.words.join(' ')) {
        setIsSentenceSolved(true);
        soundManager.playCorrect();
        celebrationManager.celebrate('good');

        setTimeout(() => {
          kidsSpeech.speak(currentSentence.full);
        }, 300);

        const p = getKidsProgress();
        p.totalStars += 3;
        updateKidsProgress(p);

        setTimeout(() => {
          setSentenceIndex((prev) => prev + 1);
        }, 2200);
      } else {
        soundManager.playIncorrect();
        celebrationManager.speakPraise('Bé ghép lại nhé!');
        setTimeout(() => {
          initSentenceRound();
        }, 1200);
      }
    }
  };

  // ================================================================
  // GAME 7: ANIMAL HUNT (SAFARI PANORAMA DISCOVERY)
  // ================================================================
  const [huntTarget, setHuntTarget] = useState<VocabItem>(VOCAB_DATA[0]);
  const [huntScore, setHuntScore] = useState(0);
  const [huntFeedback, setHuntFeedback] = useState<string | null>(null);

  const initHuntRound = () => {
    const target = VOCAB_DATA[Math.floor(Math.random() * VOCAB_DATA.length)];
    setHuntTarget(target);
    setHuntFeedback(null);

    setTimeout(() => {
      celebrationManager.promptFindItem(target.word, target.viMeaning);
    }, 400);
  };

  const handleTapHuntedItem = (item: VocabItem) => {
    if (item.word === huntTarget.word) {
      soundManager.playCorrect();
      setHuntScore((s) => s + 1);
      setHuntFeedback('Bé đã tìm thấy rồi! 🌟');
      kidsSpeech.speakBilingual(item.word, item.viMeaning);

      const p = getKidsProgress();
      p.totalStars += 1;
      updateKidsProgress(p);

      setTimeout(() => {
        initHuntRound();
      }, 1500);
    } else {
      soundManager.playIncorrect();
      celebrationManager.promptFindItem(huntTarget.word, huntTarget.viMeaning);
    }
  };

  // ================================================================
  // GAME 8: SPEAK TO UNLOCK (TREASURE CHEST OPENS WITH VOICE)
  // ================================================================
  const [chestUnlocked, setChestUnlocked] = useState(false);
  const [speakScore, setSpeakScore] = useState(0);

  const handleSpeakToUnlock = () => {
    kidsSpeech.speakVi('Bé nói: Open!', {
      onEnd: () => {
        soundManager.playDing();
        setTimeout(() => {
          setChestUnlocked(true);
          soundManager.playFanfare();
          celebrationManager.celebrate('good');
          setSpeakScore((s) => s + 1);

          const p = getKidsProgress();
          p.totalStars += 3;
          updateKidsProgress(p);

          setTimeout(() => {
            setChestUnlocked(false);
          }, 2500);
        }, 700);
      },
    });
  };

  // Initialize selected game
  useEffect(() => {
    if (activeGame === 'find_it') initFindRound();
    else if (activeGame === 'bubble') initBubbleRound();
    else if (activeGame === 'memory') initMemoryGame(6);
    else if (activeGame === 'rocket') initRocketRound();
    else if (activeGame === 'train') initTrainRound();
    else if (activeGame === 'sentence') initSentenceRound();
    else if (activeGame === 'hunt') initHuntRound();
  }, [activeGame, sentenceIndex]);

  // Tab definitions
  const gameTabs: { id: GameType; title: string; emoji: string }[] = [
    { id: 'find_it', title: 'Tìm Hình', emoji: '🦁' },
    { id: 'bubble', title: 'Bắt Bóng', emoji: '🎈' },
    { id: 'memory', title: 'Lật Thẻ', emoji: '🎴' },
    { id: 'rocket', title: 'Tên Lửa', emoji: '🚀' },
    { id: 'train', title: 'Tàu Chữ', emoji: '🚂' },
    { id: 'sentence', title: 'Ghép Câu', emoji: '🧩' },
    { id: 'hunt', title: 'Thám Hiểm', emoji: '🐾' },
    { id: 'speak_unlock', title: 'Thần Chú', emoji: '🎤' },
  ];

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6 md:space-y-8 animate-fadeIn pb-24">
      {/* ================================================================ */}
      {/* 1. GAME SELECTOR TABS & DIFFICULTY CONTROL                       */}
      {/* ================================================================ */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 kids-liquid-card p-3 rounded-3xl border-3 border-amber-300">
        {/* Game Horizontal Scroller */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {gameTabs.map((tab) => {
            const isActive = activeGame === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectGame(tab.id)}
                className={`px-3.5 py-2 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 shadow-sm border-2 border-amber-500 scale-102'
                    : 'bg-white/80 text-slate-800 hover:bg-amber-100 border border-slate-200'
                }`}
              >
                <span className="text-base">{tab.emoji}</span>
                <span>{tab.title}</span>
              </button>
            );
          })}
        </div>

        {/* Difficulty Pill */}
        <div className="flex items-center gap-1 bg-white/90 p-1 rounded-2xl border-2 border-slate-200 shrink-0">
          {(['easy', 'normal', 'challenge'] as GameDifficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => {
                soundManager.playPop();
                setDifficulty(d);
              }}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-black uppercase transition cursor-pointer ${
                difficulty === d
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {d === 'easy' ? 'Dễ 🎧' : d === 'normal' ? 'Vừa ⭐' : 'Khó 🏆'}
            </button>
          ))}
        </div>
      </div>

      {/* ================================================================ */}
      {/* 2. ACTIVE GAME ARENA                                             */}
      {/* ================================================================ */}

      {/* GAME 1: FIND IT */}
      {activeGame === 'find_it' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 rounded-3xl p-6 md:p-8 text-slate-950 flex flex-col md:flex-row items-center justify-between gap-4 border-3 border-amber-400 shadow-md">
            <div className="flex items-center gap-4 text-center md:text-left">
              <KidsMascot
                mood="excited"
                size={85}
                speechText={`Tìm hình: ${findTarget.word}!`}
              />
              <div>
                <span className="px-3 py-1 rounded-full bg-white/80 text-xs font-black uppercase">
                  Trò chơi 1 • Tìm Hình Theo Tiếng
                </span>
                <h1 className="text-2xl md:text-3xl font-black text-slate-950 mt-1">
                  Nghe & Chạm Đúng Hình
                </h1>
                <p className="text-slate-800 font-bold text-xs sm:text-sm">
                  Lắng nghe Gấu Bobby đọc và chọn hình tương ứng nhé!
                </p>
              </div>
            </div>

            <div className="kids-liquid-card px-5 py-2.5 rounded-2xl text-center border-2 border-amber-400">
              <p className="text-[10px] font-black uppercase text-amber-900">Điểm Số</p>
              <p className="text-2xl font-black text-slate-950">⭐ {findScore}</p>
            </div>
          </div>

          {/* Prompt Speaker Station */}
          <div className="kids-liquid-amber p-5 rounded-3xl border-3 border-amber-400 text-center flex flex-col items-center gap-2">
            <button
              onClick={() => celebrationManager.promptFindItem(findTarget.word, findTarget.viMeaning)}
              className="px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-sm flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 transition"
            >
              <span>🔊 Nghe lại yêu cầu</span>
            </button>
            {findFeedback && (
              <p className="text-base font-black text-emerald-700 animate-bounce">{findFeedback}</p>
            )}
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {findOptions.map((item) => (
              <button
                key={item.word}
                onClick={() => handlePickFindOption(item)}
                className="h-36 sm:h-44 rounded-3xl kids-liquid-card hover:kids-liquid-emerald border-3 border-amber-300 hover:border-emerald-500 flex flex-col items-center justify-center gap-2 hover:scale-105 active:scale-95 transition cursor-pointer shadow-xs"
              >
                <span className="text-6xl filter drop-shadow-xs">{item.emoji}</span>
                <span className="text-sm font-black text-slate-950 uppercase">{item.word}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* GAME 2: BUBBLE POP */}
      {activeGame === 'bubble' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-sky-400 via-teal-400 to-indigo-500 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-4 border-3 border-sky-400 shadow-md">
            <div className="flex items-center gap-4 text-center md:text-left">
              <KidsMascot
                mood="excited"
                size={85}
                speechText={`Đập bóng: ${bubbleTarget.word}!`}
              />
              <div>
                <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-black uppercase">
                  Trò chơi 2 • Bắt Bong Bóng
                </span>
                <h1 className="text-2xl md:text-3xl font-black text-white mt-1">
                  Bong Bóng Nổ Tung
                </h1>
                <p className="text-sky-100 font-bold text-xs sm:text-sm">
                  Chạm vào quả bóng chính xác để bóng nổ tung tóe!
                </p>
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-2xl text-center border border-white/30">
              <p className="text-[10px] font-black uppercase text-sky-100">Điểm Số</p>
              <p className="text-2xl font-black text-white">⭐ {bubbleScore}</p>
            </div>
          </div>

          <div className="kids-liquid-sky p-5 rounded-3xl border-3 border-sky-400 text-center flex flex-col items-center gap-2">
            <button
              onClick={() => kidsSpeech.speak(bubbleTarget.word)}
              className="px-5 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black text-sm flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 transition"
            >
              <span>🔊 Nghe từ: {bubbleTarget.word}</span>
            </button>
            {bubbleFeedback && (
              <p className="text-base font-black text-emerald-700 animate-bounce">{bubbleFeedback}</p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {bubbleOptions.map((item) => {
              const isPopping = poppingWord === item.word;
              return (
                <button
                  key={item.word}
                  onClick={() => handlePopBubble(item)}
                  className={`h-36 sm:h-44 rounded-full bg-gradient-to-tr from-sky-100 via-white to-pink-100 border-4 border-sky-300 hover:border-pink-400 shadow-md flex flex-col items-center justify-center p-3 transition-all hover:scale-105 active:scale-90 cursor-pointer ${
                    isPopping ? 'animate-pop-burst pointer-events-none' : 'animate-pulse'
                  }`}
                >
                  <span className="text-5xl sm:text-6xl filter drop-shadow-xs">{item.emoji}</span>
                  <span className="text-xs sm:text-sm font-black text-slate-950 uppercase mt-2">
                    {item.word}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* GAME 3: MEMORY MATCH */}
      {activeGame === 'memory' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 rounded-3xl p-6 md:p-8 text-slate-950 flex flex-col md:flex-row items-center justify-between gap-4 border-3 border-purple-400 shadow-md">
            <div className="flex items-center gap-4 text-center md:text-left">
              <KidsMascot
                mood={isMemoryWon ? 'celebrate' : 'excited'}
                size={85}
                speechText={isMemoryWon ? 'Bé giỏi quá!' : 'Tìm cặp giống nhau nào!'}
              />
              <div>
                <span className="px-3 py-1 rounded-full bg-white/80 text-xs font-black uppercase">
                  Trò chơi 3 • Lật Thẻ Trí Nhớ
                </span>
                <h1 className="text-2xl md:text-3xl font-black text-slate-950 mt-1">
                  Cặp Thẻ Trí Nhớ
                </h1>
                <p className="text-slate-800 font-bold text-xs sm:text-sm">
                  Lật mở các cặp thẻ từ vựng để rèn luyện trí nhớ và phát âm!
                </p>
              </div>
            </div>

            <div className="kids-liquid-card px-5 py-2.5 rounded-2xl text-center border-2 border-purple-400">
              <p className="text-[10px] font-black uppercase text-purple-900">Đã Tìm Thấy</p>
              <p className="text-2xl font-black text-slate-950">{matchesCount}/6</p>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto">
            {cards.map((card, idx) => {
              const showFace = card.isFlipped || card.isMatched;
              return (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(idx)}
                  className="h-28 sm:h-36 rounded-3xl cursor-pointer select-none [perspective:600px]"
                >
                  <div
                    className={`relative w-full h-full rounded-3xl transition-transform duration-500 [transform-style:preserve-3d] ${
                      showFace ? '[transform:rotateY(180deg)]' : ''
                    }`}
                  >
                    <div className="absolute inset-0 w-full h-full rounded-3xl kids-liquid-amber border-3 border-amber-400 flex flex-col items-center justify-center text-slate-900 [backface-visibility:hidden]">
                      <span className="text-3xl sm:text-4xl">🌟</span>
                      <span className="text-[10px] font-black mt-1 uppercase tracking-wider text-amber-950">
                        Lật Thẻ
                      </span>
                    </div>

                    <div className="absolute inset-0 w-full h-full rounded-3xl kids-liquid-emerald border-3 border-emerald-500 flex flex-col items-center justify-center p-2 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                      <span className="text-4xl sm:text-5xl">{card.emoji}</span>
                      <span className="text-xs sm:text-sm font-black text-slate-950 mt-1 uppercase">
                        {card.word}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {isMemoryWon && (
            <div className="kids-liquid-emerald rounded-3xl p-6 border-3 border-emerald-500 text-center space-y-3 animate-bounce shadow-lg">
              <h2 className="text-2xl sm:text-3xl font-black text-emerald-950">
                🎉 Yeahhh! Bé đã tìm đúng tất cả các cặp thẻ!
              </h2>
              <button
                onClick={() => initMemoryGame(6)}
                className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-base shadow-md cursor-pointer border-b-4 border-emerald-700"
              >
                Chơi Ván Mới 🔄
              </button>
            </div>
          )}
        </div>
      )}

      {/* GAME 4: WORD ROCKET */}
      {activeGame === 'rocket' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-600 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-4 border-3 border-rose-400 shadow-md">
            <div className="flex items-center gap-4 text-center md:text-left">
              <KidsMascot
                mood="excited"
                size={85}
                speechText={`Phóng tên lửa: ${rocketTarget.word}!`}
              />
              <div>
                <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-black uppercase">
                  Trò chơi 4 • Tên Lửa Không Gian
                </span>
                <h1 className="text-2xl md:text-3xl font-black text-white mt-1">
                  Phóng Tên Lửa Từ Vựng
                </h1>
                <p className="text-rose-100 font-bold text-xs sm:text-sm">
                  Chọn đúng tên lửa để phóng vút lên dải ngân hà! 🚀
                </p>
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-2xl text-center border border-white/30">
              <p className="text-[10px] font-black uppercase text-rose-100">Điểm Số</p>
              <p className="text-2xl font-black text-white">🚀 {rocketScore}</p>
            </div>
          </div>

          <div className="kids-liquid-rose p-5 rounded-3xl border-3 border-rose-400 text-center flex flex-col items-center gap-2">
            <button
              onClick={() => kidsSpeech.speak(rocketTarget.word)}
              className="px-5 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-sm flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 transition"
            >
              <span>🔊 Nghe từ cần phóng: {rocketTarget.word}</span>
            </button>
          </div>

          {/* Rocket Launch Pads */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto pt-6">
            {rocketOptions.map((item) => {
              const isLaunching = rocketLaunched === item.word;
              return (
                <div key={item.word} className="flex flex-col items-center">
                  <button
                    onClick={() => handleLaunchRocket(item)}
                    className={`w-32 h-44 rounded-3xl kids-liquid-card border-4 border-rose-400 flex flex-col items-center justify-between p-4 cursor-pointer hover:scale-105 active:scale-95 transition shadow-md ${
                      isLaunching ? 'animate-rocket-launch pointer-events-none' : ''
                    }`}
                  >
                    <span className="text-6xl">🚀</span>
                    <span className="text-3xl">{item.emoji}</span>
                    <span className="text-sm font-black text-slate-950 uppercase">{item.word}</span>
                  </button>
                  <div className="w-24 h-3 bg-slate-300 rounded-full mt-2" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* GAME 5: SPELLING TRAIN */}
      {activeGame === 'train' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-4 border-3 border-emerald-300 shadow-md">
            <div className="flex items-center gap-4 text-center md:text-left">
              <KidsMascot
                mood={isTrainSolved ? 'celebrate' : 'happy'}
                size={85}
                speechText={isTrainSolved ? 'Đúng rồi! Bé giỏi quá!' : 'Ghép chữ vào đoàn tàu!'}
              />
              <div>
                <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-black uppercase">
                  Trò chơi 5 • Tàu Ghép Chữ
                </span>
                <h1 className="text-2xl md:text-3xl font-black text-white mt-1">
                  Đoàn Tàu Chữ Cái
                </h1>
                <p className="text-emerald-100 font-bold text-xs sm:text-sm">
                  Chọn chữ cái còn thiếu để đoàn tàu khởi hành về ga!
                </p>
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-2xl text-center border border-white/30">
              <p className="text-[10px] font-black uppercase text-emerald-100">Số Từ Đúng</p>
              <p className="text-2xl font-black text-white">🚂 {trainScore}</p>
            </div>
          </div>

          <div className="kids-liquid-emerald rounded-3xl p-6 border-3 border-emerald-400 text-center flex flex-col items-center gap-3">
            <span className="text-7xl filter drop-shadow-sm">{trainWord.emoji}</span>
            <button
              onClick={() => kidsSpeech.speak(trainWord.word)}
              className="px-5 py-2.5 rounded-2xl bg-white hover:bg-emerald-50 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 border-2 border-emerald-400 transition cursor-pointer shadow-xs"
            >
              <span>🔊 Nghe phát âm từ này</span>
            </button>
          </div>

          <div className="bg-amber-100/80 rounded-3xl p-6 border-3 border-amber-400 flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto shadow-inner">
            <span className="text-4xl sm:text-5xl">🚂</span>
            {trainWord.letters.map((letter, idx) => {
              const isMissing = idx === missingIndex;
              return (
                <div
                  key={idx}
                  className={`w-14 h-16 sm:w-16 sm:h-20 rounded-2xl flex items-center justify-center font-black text-2xl sm:text-3xl shadow-sm border-3 transition-all ${
                    isMissing
                      ? isTrainSolved
                        ? 'bg-emerald-500 text-white border-emerald-700 scale-110 animate-bounce'
                        : 'bg-white text-amber-800 border-dashed border-amber-600 animate-pulse'
                      : 'bg-white text-slate-950 border-amber-300'
                  }`}
                >
                  {isMissing ? (isTrainSolved ? letter : '?') : letter}
                </div>
              );
            })}
          </div>

          <div className="text-center space-y-3">
            <p className="text-xs font-black uppercase tracking-wider text-slate-800">
              Bé hãy chọn chữ cái còn thiếu:
            </p>
            <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
              {letterOptions.map((letter) => (
                <button
                  key={letter}
                  onClick={() => handlePickLetter(letter)}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl kids-liquid-card border-4 border-emerald-400 hover:border-emerald-600 text-slate-950 font-black text-2xl sm:text-3xl shadow-md hover:scale-110 active:scale-90 transition-all cursor-pointer flex items-center justify-center"
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GAME 6: SENTENCE BUILDER */}
      {activeGame === 'sentence' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-400 via-teal-400 to-indigo-500 rounded-3xl p-6 md:p-8 text-slate-950 flex flex-col md:flex-row items-center justify-between gap-4 border-3 border-amber-400 shadow-md">
            <div className="flex items-center gap-4 text-center md:text-left">
              <KidsMascot
                mood={isSentenceSolved ? 'celebrate' : 'happy'}
                size={85}
                speechText={isSentenceSolved ? 'Bé ghép câu xuất sắc!' : 'Ghép các từ thành câu nhé!'}
              />
              <div>
                <span className="px-3 py-1 rounded-full bg-white/80 text-xs font-black uppercase">
                  Trò chơi 6 • Ghép Câu Hoàn Chỉnh
                </span>
                <h1 className="text-2xl md:text-3xl font-black text-slate-950 mt-1">
                  Đoàn Tàu Ghép Câu
                </h1>
                <p className="text-slate-800 font-bold text-xs sm:text-sm">
                  Chạm vào từng từ theo đúng thứ tự để tạo thành câu hoàn chỉnh!
                </p>
              </div>
            </div>

            <div className="text-6xl filter drop-shadow-sm">{currentSentence.emoji}</div>
          </div>

          {/* Placed Words Slot Container */}
          <div className="kids-liquid-card p-6 rounded-3xl border-3 border-indigo-300 min-h-[100px] flex items-center justify-center gap-3 flex-wrap">
            {placedWords.length === 0 ? (
              <p className="text-slate-400 font-black text-sm">
                (Chạm vào các từ bên dưới để ghép câu)
              </p>
            ) : (
              placedWords.map((w, i) => (
                <span
                  key={i}
                  className="px-5 py-3 rounded-2xl bg-indigo-500 text-white font-black text-lg sm:text-xl shadow-md animate-scale-up"
                >
                  {w}
                </span>
              ))
            )}
          </div>

          {/* Available Word Options */}
          <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
            {availableWords.map((word, i) => (
              <button
                key={i}
                onClick={() => handleAddWordToSentence(word)}
                className="px-6 py-3.5 rounded-2xl kids-liquid-amber border-3 border-amber-400 text-slate-950 font-black text-lg hover:scale-110 active:scale-95 transition cursor-pointer shadow-xs"
              >
                {word}
              </button>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={initSentenceRound}
              className="text-xs font-black text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              🔄 Ghép lại câu này
            </button>
          </div>
        </div>
      )}

      {/* GAME 7: ANIMAL HUNT */}
      {activeGame === 'hunt' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-4 border-3 border-emerald-400 shadow-md">
            <div className="flex items-center gap-4 text-center md:text-left">
              <KidsMascot
                mood="excited"
                size={85}
                speechText={`Tìm con vật: ${huntTarget.word}!`}
              />
              <div>
                <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-black uppercase">
                  Trò chơi 7 • Thám Hiểm Rừng Xanh
                </span>
                <h1 className="text-2xl md:text-3xl font-black text-white mt-1">
                  Tìm Động Vật Ẩn Nấp
                </h1>
                <p className="text-emerald-100 font-bold text-xs sm:text-sm">
                  Quan sát khu rừng safari và chạm vào bạn động vật đang trốn!
                </p>
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-2xl text-center border border-white/30">
              <p className="text-[10px] font-black uppercase text-emerald-100">Đã Tìm Thấy</p>
              <p className="text-2xl font-black text-white">🐾 {huntScore}</p>
            </div>
          </div>

          {/* Safari Jungle Scene */}
          <div className="relative rounded-3xl bg-gradient-to-b from-sky-200 via-emerald-100 to-emerald-300 p-8 min-h-[340px] border-3 border-emerald-400 overflow-hidden shadow-inner flex items-center justify-around flex-wrap gap-6">
            <div className="absolute top-4 left-6 text-4xl opacity-50">🌴</div>
            <div className="absolute bottom-4 right-8 text-5xl opacity-50">🌿</div>
            <div className="absolute top-8 right-16 text-4xl opacity-50">🌲</div>

            {VOCAB_DATA.slice(0, 6).map((item) => (
              <button
                key={item.word}
                onClick={() => handleTapHuntedItem(item)}
                className="group p-4 rounded-3xl kids-liquid-card hover:bg-emerald-100 border-3 border-emerald-400 flex flex-col items-center hover:scale-125 active:scale-95 transition cursor-pointer shadow-md z-10"
              >
                <span className="text-6xl group-hover:scale-110 transition-transform">
                  {item.emoji}
                </span>
                <span className="text-xs font-black text-slate-950 uppercase mt-1">
                  {item.word}
                </span>
              </button>
            ))}
          </div>

          {huntFeedback && (
            <p className="text-center font-black text-emerald-700 text-lg animate-bounce">
              {huntFeedback}
            </p>
          )}
        </div>
      )}

      {/* GAME 8: SPEAK TO UNLOCK */}
      {activeGame === 'speak_unlock' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-purple-500 rounded-3xl p-6 md:p-8 text-slate-950 flex flex-col md:flex-row items-center justify-between gap-4 border-3 border-amber-400 shadow-md">
            <div className="flex items-center gap-4 text-center md:text-left">
              <KidsMascot
                mood="excited"
                size={85}
                speechText="Đọc thần chú mở rương báu!"
              />
              <div>
                <span className="px-3 py-1 rounded-full bg-white/80 text-xs font-black uppercase">
                  Trò chơi 8 • Thần Chú Mở Cửa
                </span>
                <h1 className="text-2xl md:text-3xl font-black text-slate-950 mt-1">
                  Luyện Nói Tiếng Anh
                </h1>
                <p className="text-slate-800 font-bold text-xs sm:text-sm">
                  Nói thần chú "Open" vào micro để mở rương báu nhận sao thưởng!
                </p>
              </div>
            </div>

            <div className="kids-liquid-card px-5 py-2.5 rounded-2xl text-center border-2 border-amber-400">
              <p className="text-[10px] font-black uppercase text-amber-900">Mở Khóa</p>
              <p className="text-2xl font-black text-slate-950">🎁 {speakScore}</p>
            </div>
          </div>

          {/* Treasure Chest Interactive Stage */}
          <div className="kids-liquid-amber p-10 rounded-3xl border-3 border-amber-400 text-center flex flex-col items-center gap-6">
            <div className="text-8xl sm:text-9xl filter drop-shadow-md">
              {chestUnlocked ? '✨🎁✨' : '🔒📦'}
            </div>

            <p className="text-base sm:text-lg font-black text-slate-950 max-w-sm">
              {chestUnlocked
                ? '🎉 Rương báu đã mở! Thưởng cho bé +3 Sao Vàng!'
                : 'Thần chú: Nói "Open" để mở rương báu!'}
            </p>

            <button
              onClick={handleSpeakToUnlock}
              disabled={chestUnlocked}
              className={`px-8 py-4 rounded-2xl font-black text-base flex items-center gap-3 transition cursor-pointer shadow-lg active:scale-95 ${
                chestUnlocked
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white animate-mic-pulse'
              }`}
            >
              <span className="text-2xl">🎙️</span>
              <span>{chestUnlocked ? 'ĐÃ MỞ KHÓA!' : 'CHẠM ĐỂ NÓI THẦN CHÚ'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KidsGamesPage;
