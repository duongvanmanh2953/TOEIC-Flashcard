import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  KidsGameIcon,
  KidsStarIcon,
  KidsListenIcon,
  KidsSpeakIcon,
  KidsTrophyIcon,
  KidsSparkleIcon,
  KidsPlayIcon,
  KidsCheckIcon,
} from '../assets/icons/KidsIcons';
import { KidsMascot } from '../components/KidsMascot';
import { soundManager } from '../services/sound/KidsSoundManager';
import { kidsSpeech } from '../services/speech/KidsSpeechManager';
import { celebrationManager } from '../services/celebration/CelebrationManager';
import { getKidsProgress, updateKidsProgress } from '../curriculum/curriculumProgress';
import {
  VectorLion,
  VectorElephant,
  VectorApple,
  VectorBanana,
  VectorRocket,
  VectorCat,
  VectorTrophy,
} from '../assets/illustrations/KidsVectors';

export type GameType =
  | 'find_it'
  | 'flip_learn'
  | 'memory'
  | 'catch'
  | 'bubble'
  | 'rocket'
  | 'sentence'
  | 'speak_unlock';

export type GameDifficulty = 'easy' | 'normal' | 'challenge';

interface VocabItem {
  id: string;
  word: string;
  viMeaning: string;
  emoji: string;
  category: 'animals' | 'food' | 'nature' | 'things';
  renderVector?: (size?: number) => React.ReactNode;
}

const VOCAB_DATA: VocabItem[] = [
  {
    id: 'elephant',
    word: 'Elephant',
    viMeaning: 'Con voi',
    emoji: '🐘',
    category: 'animals',
    renderVector: (s = 56) => <VectorElephant size={s} />,
  },
  {
    id: 'lion',
    word: 'Lion',
    viMeaning: 'Con sư tử',
    emoji: '🦁',
    category: 'animals',
    renderVector: (s = 56) => <VectorLion size={s} />,
  },
  {
    id: 'cat',
    word: 'Cat',
    viMeaning: 'Con mèo',
    emoji: '🐱',
    category: 'animals',
    renderVector: (s = 56) => <VectorCat size={s} />,
  },
  {
    id: 'apple',
    word: 'Apple',
    viMeaning: 'Quả táo',
    emoji: '🍎',
    category: 'food',
    renderVector: (s = 56) => <VectorApple size={s} />,
  },
  {
    id: 'banana',
    word: 'Banana',
    viMeaning: 'Quả chuối',
    emoji: '🍌',
    category: 'food',
    renderVector: (s = 56) => <VectorBanana size={s} />,
  },
  {
    id: 'rocket',
    word: 'Rocket',
    viMeaning: 'Tên lửa',
    emoji: '🚀',
    category: 'things',
    renderVector: (s = 56) => <VectorRocket size={s} />,
  },
  {
    id: 'dog',
    word: 'Dog',
    viMeaning: 'Con chó',
    emoji: '🐶',
    category: 'animals',
  },
  {
    id: 'rabbit',
    word: 'Rabbit',
    viMeaning: 'Con thỏ',
    emoji: '🐰',
    category: 'animals',
  },
  {
    id: 'orange',
    word: 'Orange',
    viMeaning: 'Quả cam',
    emoji: '🍊',
    category: 'food',
  },
  {
    id: 'sun',
    word: 'Sun',
    viMeaning: 'Mặt trời',
    emoji: '☀️',
    category: 'nature',
  },
  {
    id: 'star',
    word: 'Star',
    viMeaning: 'Ngôi sao',
    emoji: '⭐',
    category: 'nature',
  },
];

const SENTENCE_DATA = [
  { words: ['I', 'like', 'apples'], full: 'I like apples.', vi: 'Mình thích những quả táo.' },
  { words: ['The', 'cat', 'is', 'cute'], full: 'The cat is cute.', vi: 'Chú mèo thật dễ thương.' },
  { words: ['I', 'see', 'a', 'lion'], full: 'I see a lion.', vi: 'Mình nhìn thấy một con sư tử.' },
  { words: ['The', 'sun', 'is', 'bright'], full: 'The sun is bright.', vi: 'Mặt trời tỏa nắng rực rỡ.' },
];

export const KidsGamesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialGame = (searchParams.get('game') as GameType) || 'find_it';
  const [activeGame, setActiveGame] = useState<GameType>(initialGame);
  const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');
  const [gameStarted, setGameStarted] = useState(false);

  // Multi-Round Progress (Round 1 of 5 -> Victory)
  const TOTAL_ROUNDS = 5;
  const [currentRound, setCurrentRound] = useState(1);
  const [roundScore, setRoundScore] = useState(0);

  // Victory Dialog
  const [showGameWinModal, setShowGameWinModal] = useState(false);
  const [winMessage, setWinMessage] = useState('Bé giỏi quá!');

  const handleSelectGame = (game: GameType) => {
    soundManager.playPop();
    setActiveGame(game);
    setShowGameWinModal(false);
    setCurrentRound(1);
    setRoundScore(0);
    setSearchParams({ game });
    setGameStarted(false);
  };

  const triggerVictory = (msg: string = 'Bé giỏi quá!') => {
    soundManager.playFanfare();
    celebrationManager.celebrate('gameWin', msg);
    setWinMessage(msg);
    const p = getKidsProgress();
    p.totalStars = (p.totalStars || 0) + 5;
    updateKidsProgress(p);
    setShowGameWinModal(true);
  };

  // Advance to next round or trigger victory
  const advanceToNextRound = (customPraise: string) => {
    soundManager.playDing();
    celebrationManager.celebrate('small', customPraise);

    if (currentRound >= TOTAL_ROUNDS) {
      setTimeout(() => {
        triggerVictory('Xuất sắc! Bé đã hoàn thành trọn vẹn 5 thử thách!');
      }, 1200);
    } else {
      setTimeout(() => {
        setCurrentRound((r) => r + 1);
        if (activeGame === 'find_it') initFindRound();
        else if (activeGame === 'catch') initCatchRound();
        else if (activeGame === 'bubble') initBubbleRound();
        else if (activeGame === 'rocket') initRocketRound();
        else if (activeGame === 'sentence') initSentenceRound();
      }, 1400);
    }
  };

  // ================================================================
  // 1. FIND IT (Audio-First Learning Loop)
  // ================================================================
  const [findTarget, setFindTarget] = useState<VocabItem>(VOCAB_DATA[0]);
  const [findOptions, setFindOptions] = useState<VocabItem[]>([]);
  const [findAnswerState, setFindAnswerState] = useState<'idle' | 'correct' | 'wrong'>('idle');

  const initFindRound = () => {
    const target = VOCAB_DATA[Math.floor(Math.random() * VOCAB_DATA.length)];
    const others = VOCAB_DATA.filter((v) => v.id !== target.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    const opts = [target, ...others].sort(() => 0.5 - Math.random());
    setFindTarget(target);
    setFindOptions(opts);
    setFindAnswerState('idle');

    setTimeout(() => {
      kidsSpeech.speakVi(`Bé hãy tìm ${target.viMeaning} nhé!`, {
        onEnd: () => {
          setTimeout(() => kidsSpeech.speak(target.word), 250);
        },
      });
    }, 200);
  };

  const handleChooseFindOption = (opt: VocabItem) => {
    if (findAnswerState === 'correct') return;

    if (opt.id === findTarget.id) {
      setFindAnswerState('correct');
      kidsSpeech.speak(opt.word);
      setRoundScore((s) => s + 1);
      advanceToNextRound(`Đúng rồi! Đó là ${opt.word}!`);
    } else {
      setFindAnswerState('wrong');
      soundManager.playIncorrect();
      kidsSpeech.speakVi('Chưa đúng rồi bé ơi! Bé thử lại nhé!');
      setTimeout(() => setFindAnswerState('idle'), 1000);
    }
  };

  // ================================================================
  // 2. FLIP & LEARN (3D Flip Card with Pre-Flip Audio Prompt)
  // ================================================================
  const [flipIndex, setFlipIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const currentFlipItem = VOCAB_DATA[flipIndex % VOCAB_DATA.length];

  const handleFlipToggle = () => {
    soundManager.playWhoosh();
    const nextFlipped = !isCardFlipped;
    setIsCardFlipped(nextFlipped);
    if (nextFlipped) {
      setTimeout(() => {
        kidsSpeech.speak(currentFlipItem.word);
      }, 250);
    }
  };

  const handleNextFlipCard = () => {
    soundManager.playDing();
    setIsCardFlipped(false);
    setFlipIndex((i) => i + 1);
    const nextItem = VOCAB_DATA[(flipIndex + 1) % VOCAB_DATA.length];
    setTimeout(() => {
      kidsSpeech.speakVi(`Đố bé biết đây là gì nào?`, {
        onEnd: () => {
          setTimeout(() => kidsSpeech.speak('What is this?'), 200);
        },
      });
    }, 300);
  };

  // ================================================================
  // 3. MEMORY MATCH (Pairs)
  // ================================================================
  interface MemoryCard {
    id: number;
    word: string;
    viMeaning: string;
    emoji: string;
    isFlipped: boolean;
    isMatched: boolean;
  }
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [memoryMatches, setMemoryMatches] = useState(0);

  const initMemoryGame = () => {
    const picked = VOCAB_DATA.slice(0, 4);
    const deck: MemoryCard[] = [];
    picked.forEach((item, idx) => {
      deck.push({ id: idx * 2, word: item.word, viMeaning: item.viMeaning, emoji: item.emoji, isFlipped: false, isMatched: false });
      deck.push({ id: idx * 2 + 1, word: item.word, viMeaning: item.viMeaning, emoji: item.emoji, isFlipped: false, isMatched: false });
    });
    setMemoryCards(deck.sort(() => 0.5 - Math.random()));
    setSelectedIndices([]);
    setMemoryMatches(0);
  };

  const handleFlipMemoryCard = (index: number) => {
    if (selectedIndices.length === 2 || memoryCards[index].isFlipped || memoryCards[index].isMatched) return;
    soundManager.playWhoosh();
    kidsSpeech.speak(memoryCards[index].word);

    const updated = [...memoryCards];
    updated[index].isFlipped = true;
    setMemoryCards(updated);

    const newSelected = [...selectedIndices, index];
    setSelectedIndices(newSelected);

    if (newSelected.length === 2) {
      const [first, second] = newSelected;
      if (updated[first].word === updated[second].word) {
        soundManager.playDing();
        celebrationManager.celebrate('small', 'Đúng một cặp rồi!');
        updated[first].isMatched = true;
        updated[second].isMatched = true;
        setMemoryCards(updated);
        setSelectedIndices([]);
        const nextMatches = memoryMatches + 1;
        setMemoryMatches(nextMatches);
        if (nextMatches >= 4) {
          setTimeout(() => triggerVictory('Trí nhớ siêu đẳng! Bé đã mở hết các cặp thẻ!'), 800);
        }
      } else {
        setTimeout(() => {
          updated[first].isFlipped = false;
          updated[second].isFlipped = false;
          setMemoryCards([...updated]);
          setSelectedIndices([]);
        }, 900);
      }
    }
  };

  // ================================================================
  // 4. LISTEN & CATCH
  // ================================================================
  const [catchTarget, setCatchTarget] = useState<VocabItem>(VOCAB_DATA[3]);
  const [catchItems, setCatchItems] = useState<VocabItem[]>([]);

  const initCatchRound = () => {
    const target = VOCAB_DATA[Math.floor(Math.random() * VOCAB_DATA.length)];
    const pool = VOCAB_DATA.filter((v) => v.id !== target.id).sort(() => 0.5 - Math.random()).slice(0, 3);
    const mixed = [target, ...pool].sort(() => 0.5 - Math.random());
    setCatchTarget(target);
    setCatchItems(mixed);

    setTimeout(() => {
      kidsSpeech.speakVi(`Bé hãy bắt lấy ${target.viMeaning} nhé!`, {
        onEnd: () => {
          setTimeout(() => kidsSpeech.speak(`Catch the ${target.word}!`), 200);
        },
      });
    }, 250);
  };

  const handleCatchItem = (item: VocabItem) => {
    if (item.id === catchTarget.id) {
      kidsSpeech.speak(item.word);
      advanceToNextRound(`Bắt trúng ${item.word} rồi!`);
    } else {
      soundManager.playIncorrect();
      kidsSpeech.speakVi('Chưa đúng rồi bé ơi! Bé thử lại nhé!');
    }
  };

  // ================================================================
  // 5. WORD POP (Bubble Pop with Real Burst Juice)
  // ================================================================
  const [bubbleTarget, setBubbleTarget] = useState<VocabItem>(VOCAB_DATA[2]);
  const [bubbles, setBubbles] = useState<{ id: string; word: string; emoji: string; popped: boolean }[]>([]);

  const initBubbleRound = () => {
    const target = VOCAB_DATA[Math.floor(Math.random() * VOCAB_DATA.length)];
    const others = VOCAB_DATA.filter((v) => v.id !== target.id).slice(0, 3);
    const list = [target, ...others].sort(() => 0.5 - Math.random()).map((v) => ({
      id: v.id,
      word: v.word,
      emoji: v.emoji,
      popped: false,
    }));
    setBubbleTarget(target);
    setBubbles(list);

    setTimeout(() => {
      kidsSpeech.speakVi(`Bé hãy làm nổ bong bóng ${target.viMeaning} nhé!`, {
        onEnd: () => {
          setTimeout(() => kidsSpeech.speak(`Pop ${target.word}!`), 200);
        },
      });
    }, 250);
  };

  const handlePopBubble = (b: { id: string; word: string; emoji: string; popped: boolean }) => {
    if (b.popped) return;
    soundManager.playBubbleBurst();

    if (b.id === bubbleTarget.id) {
      setBubbles((prev) => prev.map((item) => (item.id === b.id ? { ...item, popped: true } : item)));
      kidsSpeech.speak(b.word);
      advanceToNextRound(`Bùm! Bé đập đúng ${b.word} rồi!`);
    } else {
      soundManager.playIncorrect();
      kidsSpeech.speakVi('Bong bóng khác cơ!');
    }
  };

  // ================================================================
  // 6. WORD ROCKET
  // ================================================================
  const [rocketTarget, setRocketTarget] = useState<VocabItem>(VOCAB_DATA[5]);
  const [rocketLaunched, setRocketLaunched] = useState<string | null>(null);

  const initRocketRound = () => {
    const target = VOCAB_DATA[Math.floor(Math.random() * VOCAB_DATA.length)];
    setRocketTarget(target);
    setRocketLaunched(null);

    setTimeout(() => {
      kidsSpeech.speakVi(`Phóng tên lửa mang chữ ${target.viMeaning} nhé!`, {
        onEnd: () => {
          setTimeout(() => kidsSpeech.speak(`Rocket ${target.word}!`), 200);
        },
      });
    }, 250);
  };

  const handleLaunchRocket = (item: VocabItem) => {
    if (item.id === rocketTarget.id) {
      soundManager.playDing();
      setRocketLaunched(item.id);
      kidsSpeech.speak(`${item.word}! Blast off!`);
      advanceToNextRound(`Tên lửa ${item.word} bay vào không gian!`);
    } else {
      soundManager.playIncorrect();
      kidsSpeech.speakVi('Chọn tên lửa khác nhé!');
    }
  };

  // ================================================================
  // 7. BUILD THE SENTENCE
  // ================================================================
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const currentSentence = SENTENCE_DATA[sentenceIndex % SENTENCE_DATA.length];
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);

  const initSentenceRound = () => {
    const s = SENTENCE_DATA[sentenceIndex % SENTENCE_DATA.length];
    setAvailableWords([...s.words].sort(() => 0.5 - Math.random()));
    setSelectedWords([]);

    setTimeout(() => {
      kidsSpeech.speakVi(`Bé hãy ghép câu: "${s.vi}" nhé!`, {
        onEnd: () => {
          setTimeout(() => kidsSpeech.speak(s.full), 300);
        },
      });
    }, 250);
  };

  const handleTapWord = (word: string, fromAvailable: boolean) => {
    soundManager.playPop();
    kidsSpeech.speak(word);

    if (fromAvailable) {
      const newSelected = [...selectedWords, word];
      const newAvailable = [...availableWords];
      newAvailable.splice(newAvailable.indexOf(word), 1);
      setSelectedWords(newSelected);
      setAvailableWords(newAvailable);

      if (newSelected.length === currentSentence.words.length) {
        if (newSelected.join(' ') === currentSentence.words.join(' ')) {
          soundManager.playDing();
          kidsSpeech.speak(currentSentence.full);
          setSentenceIndex((idx) => idx + 1);
          advanceToNextRound(`Ghép câu xuất sắc!`);
        } else {
          soundManager.playIncorrect();
          kidsSpeech.speakVi('Thứ tự từ chưa đúng rồi, bé xếp lại nhé!');
          setTimeout(() => {
            initSentenceRound();
          }, 1200);
        }
      }
    } else {
      const newAvailable = [...availableWords, word];
      const newSelected = [...selectedWords];
      newSelected.splice(newSelected.indexOf(word), 1);
      setSelectedWords(newSelected);
      setAvailableWords(newAvailable);
    }
  };

  // ================================================================
  // 8. SPEAK TO UNLOCK
  // ================================================================
  const [doorTarget, setDoorTarget] = useState<VocabItem>(VOCAB_DATA[0]);
  const [doorUnlocked, setDoorUnlocked] = useState(false);
  const [speakFeedback, setSpeakFeedback] = useState<string | null>(null);
  const [childTranscript, setChildTranscript] = useState<string | null>(null);

  const initSpeakUnlock = () => {
    const target = VOCAB_DATA[Math.floor(Math.random() * VOCAB_DATA.length)];
    setDoorTarget(target);
    setDoorUnlocked(false);
    setSpeakFeedback(null);
    setChildTranscript(null);

    setTimeout(() => {
      kidsSpeech.speakVi(`Hãy đọc to thần chú "${target.viMeaning}" để mở cánh cửa thần kỳ nhé!`, {
        onEnd: () => {
          setTimeout(() => kidsSpeech.speak(target.word), 250);
        },
      });
    }, 250);
  };

  const handleStartSpeakSpell = () => {
    soundManager.playPop();
    setSpeakFeedback('Gấu Bobby đang lắng nghe thần chú...');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (e: any) => {
          const spoken = (e.results[0][0]?.transcript || '').toLowerCase().trim();
          setChildTranscript(spoken);
          const target = doorTarget.word.toLowerCase().trim();

          if (spoken.includes(target) || target.includes(spoken)) {
            setDoorUnlocked(true);
            soundManager.playFanfare();
            setSpeakFeedback(`Thần chú chính xác! Cửa đã mở! 🎉`);
            celebrationManager.celebrate('big');
            kidsSpeech.speak(`Open Sesame! ${doorTarget.word}!`);
          } else {
            soundManager.playIncorrect();
            setSpeakFeedback(`Gần đúng rồi! Bé đọc lại thật to: "${doorTarget.word}" nhé!`);
          }
        };

        recognition.start();
      } catch (_) {
        fallbackUnlock();
      }
    } else {
      fallbackUnlock();
    }
  };

  const fallbackUnlock = () => {
    setTimeout(() => {
      setDoorUnlocked(true);
      soundManager.playFanfare();
      setSpeakFeedback(`Thần chú chính xác! Cửa đã mở! 🎉`);
      celebrationManager.celebrate('big');
    }, 1000);
  };

  const handleStartGame = () => {
    soundManager.playDing();
    setGameStarted(true);

    if (activeGame === 'find_it') initFindRound();
    else if (activeGame === 'memory') initMemoryGame();
    else if (activeGame === 'catch') initCatchRound();
    else if (activeGame === 'bubble') initBubbleRound();
    else if (activeGame === 'rocket') initRocketRound();
    else if (activeGame === 'sentence') initSentenceRound();
    else if (activeGame === 'speak_unlock') initSpeakUnlock();
  };

  const gameTabs: { id: GameType; title: string; emoji: string; desc: string }[] = [
    { id: 'find_it', title: 'Tìm Hình', emoji: '🦁', desc: 'Nghe và chọn hình đúng' },
    { id: 'flip_learn', title: 'Lật Thẻ 3D', emoji: '🎴', desc: 'Khám phá từ vựng bí ẩn' },
    { id: 'bubble', title: 'Bắn Bong Bóng', emoji: '🎈', desc: 'Đập bóng nổ hạt sinh động' },
    { id: 'memory', title: 'Trí Nhớ', emoji: '🧠', desc: 'Tìm các cặp thẻ giống nhau' },
    { id: 'catch', title: 'Bắt Đồ Vật', emoji: '🎯', desc: 'Bắt vật thể theo yêu cầu' },
    { id: 'rocket', title: 'Tên Lửa', emoji: '🚀', desc: 'Phóng phi thuyền không gian' },
    { id: 'sentence', title: 'Ghép Câu', emoji: '🧩', desc: 'Sắp xếp các từ thành câu' },
    { id: 'speak_unlock', title: 'Thần Chú (Nói)', emoji: '🎤', desc: 'Phát âm mở cửa kho báu' },
  ];

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 animate-fadeIn pb-24 select-none">
      {/* ================================================================ */}
      {/* 1. TOP HEADER (NON-OVERLAPPING STATS & GAME INFO)                */}
      {/* ================================================================ */}
      <div className="kids-liquid-card p-4 sm:p-5 rounded-3xl border-3 border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center text-2xl border-2 border-amber-500">
            <KidsGameIcon size={28} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950">
              Vùng Đất Trò Chơi Tiếng Anh 🎮
            </h1>
            <p className="text-xs font-bold text-slate-600">
              Học mà chơi, chơi mà học với 8 trò chơi luyện tập tương tác!
            </p>
          </div>
        </div>

        {/* Live Score Counter Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-100 border-2 border-amber-400 text-amber-950 font-black text-xs sm:text-sm">
            <span>Câu {currentRound} / {TOTAL_ROUNDS}</span>
            <span>•</span>
            <span className="text-amber-700">⭐ {roundScore} Điểm</span>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 2. MAIN 2-COLUMN LAYOUT (SIDEBAR GAMES + STAGE ARENA)            */}
      {/* ================================================================ */}
      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* LEFT COLUMN: GAME SELECTION LIST */}
        <div className="w-full md:w-72 shrink-0 space-y-2.5">
          <div className="px-3 py-1 font-black text-xs uppercase tracking-wider text-slate-500">
            Chọn trò chơi bé thích:
          </div>

          <div className="grid grid-cols-2 md:grid-cols-1 gap-2.5">
            {gameTabs.map((tab) => {
              const isActive = activeGame === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectGame(tab.id)}
                  className={`w-full p-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-3 transition-all cursor-pointer border-2 text-left ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 border-amber-500 scale-102 ring-2 ring-amber-300'
                      : 'kids-liquid-card text-slate-800 hover:bg-amber-50 border-amber-200'
                  }`}
                >
                  <span className="text-2xl shrink-0">{tab.emoji}</span>
                  <div className="overflow-hidden">
                    <p className="truncate text-slate-950 font-black">{tab.title}</p>
                    <p className="text-[10px] text-slate-600 font-bold truncate hidden sm:block">
                      {tab.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: STAGE ARENA (SPACIOUS & BEAUTIFUL) */}
        <div className="flex-1 w-full min-w-0">
          {!gameStarted ? (
            <div className="kids-liquid-card rounded-3xl p-8 sm:p-12 border-3 border-amber-300 flex flex-col items-center justify-center text-center space-y-6">
              <KidsMascot mood="excited" size={120} speechText="Bé hãy bấm nút để bắt đầu chơi nào!" />

              <div className="max-w-md">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
                  {gameTabs.find((t) => t.id === activeGame)?.title}
                </h2>
                <p className="text-sm font-bold text-slate-600 mt-1">
                  {gameTabs.find((t) => t.id === activeGame)?.desc}
                </p>
              </div>

              <button
                onClick={handleStartGame}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-lg border-b-4 border-emerald-700 active:scale-95 transition cursor-pointer flex items-center gap-3 animate-bounce"
              >
                <KidsPlayIcon size={26} />
                <span>BẮT ĐẦU CHƠI NGAY ▶</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* GAME 1: FIND IT */}
              {activeGame === 'find_it' && (
                <div className="kids-liquid-card rounded-3xl p-6 border-3 border-amber-300 space-y-6">
                  <div className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl p-5 text-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-amber-500">
                    <div className="flex items-center gap-3 text-center sm:text-left">
                      <KidsMascot mood="speaking" size={60} />
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full bg-white/90 text-[11px] font-black uppercase">
                          Câu hỏi {currentRound} / {TOTAL_ROUNDS}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black mt-0.5">
                          Bé hãy tìm: <span className="underline">{findTarget.viMeaning}</span>!
                        </h2>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        kidsSpeech.speakVi(`Bé hãy tìm ${findTarget.viMeaning}!`, {
                          onEnd: () => setTimeout(() => kidsSpeech.speak(findTarget.word), 250),
                        });
                      }}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-amber-50 text-slate-950 font-black text-xs border border-slate-300 flex items-center gap-2 cursor-pointer shrink-0"
                    >
                      <KidsListenIcon size={18} />
                      <span>Nghe Lại 🔊</span>
                    </button>
                  </div>

                  {/* 4 Spacious Option Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {findOptions.map((opt) => {
                      const isTarget = opt.id === findTarget.id;
                      const isSelectedCorrect = findAnswerState === 'correct' && isTarget;

                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleChooseFindOption(opt)}
                          className={`h-40 sm:h-48 rounded-3xl flex flex-col items-center justify-between p-4 transition-all cursor-pointer border-3 ${
                            isSelectedCorrect
                              ? 'kids-liquid-emerald border-emerald-500 scale-105 animate-bounce'
                              : 'kids-liquid-card hover:bg-amber-50 border-amber-300 hover:border-amber-400 active:scale-95'
                          }`}
                        >
                          <div className="my-auto text-6xl">
                            {opt.renderVector ? opt.renderVector(64) : opt.emoji}
                          </div>
                          <span className="font-black text-sm text-slate-950">
                            {opt.word}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* GAME 2: FLIP & LEARN */}
              {activeGame === 'flip_learn' && (
                <div className="kids-liquid-card rounded-3xl p-6 border-3 border-amber-300 flex flex-col items-center space-y-6">
                  <div
                    onClick={handleFlipToggle}
                    className="w-72 h-80 sm:w-80 sm:h-96 cursor-pointer select-none [perspective:1000px]"
                  >
                    <div
                      className={`relative w-full h-full rounded-3xl transition-transform duration-500 [transform-style:preserve-3d] ${
                        isCardFlipped ? '[transform:rotateY(180deg)]' : ''
                      }`}
                    >
                      {/* Front */}
                      <div className="absolute inset-0 w-full h-full rounded-3xl kids-liquid-amber border-3 border-amber-400 p-6 flex flex-col items-center justify-between text-center [backface-visibility:hidden]">
                        <span className="px-3 py-1 rounded-full bg-white text-xs font-black">
                          Chạm để lật thẻ 🔄
                        </span>
                        <div className="text-8xl my-auto">{currentFlipItem.emoji}</div>
                        <p className="font-black text-sm text-amber-950">
                          {currentFlipItem.viMeaning}
                        </p>
                      </div>

                      {/* Back */}
                      <div className="absolute inset-0 w-full h-full rounded-3xl kids-liquid-emerald border-3 border-emerald-400 p-6 flex flex-col items-center justify-between text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
                        <span className="px-3 py-1 rounded-full bg-white text-xs font-black text-emerald-950">
                          Tiếng Anh Chuẩn ✨
                        </span>
                        <div className="my-auto">
                          <h3 className="text-4xl font-black text-slate-950 uppercase">
                            {currentFlipItem.word}
                          </h3>
                          <p className="text-lg font-black text-emerald-900 mt-1">
                            ({currentFlipItem.viMeaning})
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            kidsSpeech.speak(currentFlipItem.word);
                          }}
                          className="px-4 py-2 rounded-xl bg-white text-slate-900 font-black text-xs border border-emerald-300 flex items-center gap-1.5"
                        >
                          <KidsListenIcon size={16} />
                          <span>Nghe phát âm</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleNextFlipCard}
                    className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm border-b-4 border-emerald-700 active:scale-95 transition cursor-pointer"
                  >
                    THẺ TIẾP THEO ▶
                  </button>
                </div>
              )}

              {/* GAME 3: BUBBLE POP WITH BURST JUICE */}
              {activeGame === 'bubble' && (
                <div className="kids-liquid-card rounded-3xl p-6 border-3 border-amber-300 space-y-6">
                  <div className="bg-sky-100 border-2 border-sky-300 rounded-2xl p-4 text-center">
                    <p className="text-xs font-black text-sky-900 uppercase">Nhiệm vụ đập bóng:</p>
                    <h3 className="text-2xl font-black text-slate-950 mt-1">
                      Làm nổ bong bóng mang từ: <span className="text-rose-600 underline">{bubbleTarget.word}</span> ({bubbleTarget.viMeaning})!
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-4">
                    {bubbles.map((b) => (
                      <div key={b.id} className="relative flex justify-center">
                        <button
                          onClick={() => handlePopBubble(b)}
                          disabled={b.popped}
                          className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full flex flex-col items-center justify-center border-4 transition-all duration-300 cursor-pointer ${
                            b.popped
                              ? 'opacity-0 scale-150 pointer-events-none'
                              : 'bg-gradient-to-tr from-sky-200 via-rose-100 to-amber-200 border-white hover:scale-110 active:scale-95'
                          }`}
                        >
                          <span className="text-4xl sm:text-5xl">{b.emoji}</span>
                          <span className="font-black text-xs text-slate-900 mt-1">
                            {b.word}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* GAME 4: MEMORY MATCH */}
              {activeGame === 'memory' && (
                <div className="kids-liquid-card rounded-3xl p-6 border-3 border-amber-300 space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-slate-900">
                      Lật mở 2 thẻ giống nhau để ghép cặp!
                    </span>
                    <span className="px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-xs font-black text-amber-950">
                      Đã ghép: {memoryMatches} / 4 cặp
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-3 sm:gap-4">
                    {memoryCards.map((card, idx) => (
                      <button
                        key={card.id}
                        onClick={() => handleFlipMemoryCard(idx)}
                        className={`h-24 sm:h-32 rounded-2xl flex flex-col items-center justify-center border-3 transition-all cursor-pointer ${
                          card.isFlipped || card.isMatched
                            ? 'kids-liquid-emerald border-emerald-400'
                            : 'kids-liquid-amber border-amber-300 hover:scale-102'
                        }`}
                      >
                        {card.isFlipped || card.isMatched ? (
                          <>
                            <span className="text-3xl sm:text-4xl">{card.emoji}</span>
                            <span className="text-[11px] font-black text-slate-950 mt-1">
                              {card.word}
                            </span>
                          </>
                        ) : (
                          <span className="text-2xl font-black text-amber-600">❓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* GAME 5: LISTEN & CATCH */}
              {activeGame === 'catch' && (
                <div className="kids-liquid-card rounded-3xl p-6 border-3 border-amber-300 space-y-6 text-center">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-950">
                    Bé hãy bắt lấy: <span className="underline text-indigo-700">{catchTarget.word}</span> ({catchTarget.viMeaning})!
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
                    {catchItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleCatchItem(item)}
                        className="p-6 rounded-3xl kids-liquid-card border-3 border-amber-300 hover:border-amber-500 hover:scale-105 active:scale-95 transition cursor-pointer flex flex-col items-center gap-2"
                      >
                        <span className="text-5xl">{item.emoji}</span>
                        <span className="font-black text-sm text-slate-950">{item.word}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* GAME 6: WORD ROCKET */}
              {activeGame === 'rocket' && (
                <div className="kids-liquid-card rounded-3xl p-6 border-3 border-amber-300 space-y-6 text-center">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-950">
                    Phóng tên lửa mang chữ: <span className="underline text-rose-600">{rocketTarget.word}</span>!
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
                    {VOCAB_DATA.slice(0, 3).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleLaunchRocket(item)}
                        className={`p-6 rounded-3xl border-3 flex flex-col items-center gap-3 transition cursor-pointer ${
                          rocketLaunched === item.id
                            ? 'kids-liquid-emerald border-emerald-500 -translate-y-6 transition-transform duration-500'
                            : 'kids-liquid-card border-amber-300 hover:scale-105 active:scale-95'
                        }`}
                      >
                        <span className="text-5xl">🚀</span>
                        <span className="font-black text-base text-slate-950">{item.word}</span>
                        <span className="text-xs text-slate-600 font-bold">({item.viMeaning})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* GAME 7: BUILD THE SENTENCE */}
              {activeGame === 'sentence' && (
                <div className="kids-liquid-card rounded-3xl p-6 border-3 border-amber-300 space-y-6 text-center">
                  <div>
                    <span className="px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-xs font-black text-amber-950">
                      Nghĩa tiếng Việt: {currentSentence.vi}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-2">
                      Ghép các từ thành câu hoàn chỉnh:
                    </h3>
                  </div>

                  {/* Selected Words Tray */}
                  <div className="min-h-16 p-3 rounded-2xl bg-white border-2 border-slate-300 flex items-center justify-center gap-2 flex-wrap">
                    {selectedWords.length === 0 && (
                      <span className="text-xs font-bold text-slate-400">
                        Chạm vào các từ bên dưới để xếp vào đây
                      </span>
                    )}
                    {selectedWords.map((w, idx) => (
                      <button
                        key={`${w}-${idx}`}
                        onClick={() => handleTapWord(w, false)}
                        className="px-4 py-2 rounded-xl bg-amber-400 text-amber-950 font-black text-sm border border-amber-500 active:scale-95 cursor-pointer"
                      >
                        {w} ✕
                      </button>
                    ))}
                  </div>

                  {/* Available Words */}
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    {availableWords.map((w, idx) => (
                      <button
                        key={`${w}-${idx}`}
                        onClick={() => handleTapWord(w, true)}
                        className="px-5 py-2.5 rounded-2xl bg-sky-100 hover:bg-sky-200 text-sky-950 font-black text-sm border-2 border-sky-300 active:scale-95 cursor-pointer"
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* GAME 8: SPEAK TO UNLOCK */}
              {activeGame === 'speak_unlock' && (
                <div className="kids-liquid-card rounded-3xl p-6 border-3 border-amber-300 space-y-6 text-center flex flex-col items-center">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-950">
                    Đọc to thần chú: <span className="text-rose-600 underline">"{doorTarget.word}"</span> để mở kho báu!
                  </h3>

                  <div className="text-8xl my-2 animate-bounce">
                    {doorUnlocked ? '🔓' : '🔒'}
                  </div>

                  {speakFeedback && (
                    <p className="text-sm font-black text-slate-800">{speakFeedback}</p>
                  )}

                  {!doorUnlocked ? (
                    <button
                      onClick={handleStartSpeakSpell}
                      className="px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-base border-b-4 border-rose-700 active:scale-95 transition cursor-pointer flex items-center gap-2"
                    >
                      <KidsSpeakIcon size={24} />
                      <span>ĐỌC THẦN CHÚ NGAY 🎙️</span>
                    </button>
                  ) : (
                    <button
                      onClick={initSpeakUnlock}
                      className="px-6 py-3 rounded-2xl bg-emerald-500 text-white font-black text-sm border-b-4 border-emerald-700 active:scale-95 cursor-pointer"
                    >
                      MỞ KHÓA CỬA TIẾP THEO ▶
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* VICTORY MODAL */}
      {showGameWinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full p-8 rounded-3xl bg-white border-4 border-amber-400 text-center space-y-5 animate-scale-up">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-400 flex items-center justify-center border-2 border-amber-500">
              <KidsTrophyIcon size={52} />
            </div>
            <h2 className="text-2xl font-black text-slate-950">Chiến Thắng Xuất Sắc! 🎉</h2>
            <p className="text-sm font-bold text-slate-700">{winMessage}</p>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-center gap-2 text-amber-950 font-black">
              <span>Bé nhận được: +5 Ngôi Sao Vàng! ⭐⭐⭐⭐⭐</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowGameWinModal(false);
                  setCurrentRound(1);
                  setRoundScore(0);
                  handleStartGame();
                }}
                className="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-sm border-b-2 border-amber-600 active:scale-95 cursor-pointer"
              >
                Chơi Lại 🔁
              </button>
              <button
                onClick={() => navigate('/kids/journey')}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm border-b-2 border-emerald-700 active:scale-95 cursor-pointer"
              >
                Về Bản Đồ 🗺️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KidsGamesPage;
