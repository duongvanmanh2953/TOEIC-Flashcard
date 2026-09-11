import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { soundManager } from '../services/sound/KidsSoundManager';
import { voiceService } from '../services/voice/voiceService';
import { celebrationManager } from '../services/celebration/CelebrationManager';
import { getKidsProgress, updateKidsProgress } from '../curriculum/curriculumProgress';
import { KIDS_GAMES_REGISTRY, GameId, GameDefinition } from '../data/games/gamesRegistry';
import { GAME_THEMES, GameVisualTheme } from '../data/games/gameThemes';
import { KIDS_QUESTIONS_DATA, KidQuestion } from '../data/questions/questionsData';
import { validateAndFilterQuestions } from '../data/validation/dataValidator';
import { COMPREHENSIVE_VOCABULARY, VocabularyItem } from '../data/vocabulary/vocabularyData';
import { KidsIllustration } from '../assets/illustrations/KidsIllustration';
import {
  Play,
  RotateCcw,
  Volume2,
  Mic,
  Map,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Star,
  Sparkles,
  Heart,
  X,
  Award,
  Layers,
  Search,
  Rocket,
  Puzzle,
  Target,
  Compass,
  ArrowRight,
  HelpCircle,
  Flame,
  Utensils,
  Headphones,
  Zap,
} from 'lucide-react';

export const KidsGamesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialGame = (searchParams.get('game') as GameId) || 'balloon_pop';

  const [activeGameId, setActiveGameId] = useState<GameId>(initialGame);
  const [gameStarted, setGameStarted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // HUD & Multi-Round Progression
  const TOTAL_ROUNDS = 5;
  const [currentRound, setCurrentRound] = useState(1);
  const [roundScore, setRoundScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [roundCompleted, setRoundCompleted] = useState(false);
  const [roundPraise, setRoundPraise] = useState<{ en: string; vi: string } | null>(null);

  // Answer WOW Feedback State
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<'correct' | 'wrong' | null>(null);

  // Victory Dialog
  const [showGameWinModal, setShowGameWinModal] = useState(false);
  const [winMessage, setWinMessage] = useState({ en: 'Super Champ!', vi: 'Bé làm rất xuất sắc!' });

  const validQuestions = validateAndFilterQuestions(KIDS_QUESTIONS_DATA);
  const activeTheme = GAME_THEMES[activeGameId] || GAME_THEMES.balloon_pop;
  const activeGameDef = KIDS_GAMES_REGISTRY.find((g) => g.id === activeGameId) || KIDS_GAMES_REGISTRY[0];

  const handleSelectGame = (gameId: GameId) => {
    if (gameId === activeGameId && gameStarted) return;
    soundManager.playPop();
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveGameId(gameId);
      setShowGameWinModal(false);
      setRoundCompleted(false);
      setRoundPraise(null);
      setCurrentRound(1);
      setRoundScore(0);
      setLives(3);
      setStreak(0);
      setSelectedAnswerId(null);
      setAnswerResult(null);
      setSearchParams({ game: gameId });
      setGameStarted(false);
      setIsTransitioning(false);
    }, 200);
  };

  const handleStartGame = () => {
    soundManager.playDing();
    setIsTransitioning(true);
    setTimeout(() => {
      setGameStarted(true);
      setCurrentRound(1);
      setRoundScore(0);
      setLives(3);
      setStreak(0);
      setRoundCompleted(false);
      setSelectedAnswerId(null);
      setAnswerResult(null);
      initRoundForGame(activeGameId, 1);
      setIsTransitioning(false);
    }, 250);
  };

  const triggerVictory = (en: string = 'Super Winner!', vi: string = 'Bé giỏi quá!') => {
    soundManager.playFanfare();
    celebrationManager.celebrate('gameWin', vi);
    setWinMessage({ en, vi });
    const p = getKidsProgress();
    p.totalStars = (p.totalStars || 0) + activeGameDef.starsAwarded;
    p.xp = (p.xp || 0) + activeGameDef.xpAwarded;
    updateKidsProgress(p);
    setShowGameWinModal(true);
  };

  const triggerCorrectAnswer = (praise: { en: string; vi: string }, answerId?: string) => {
    soundManager.playDing();
    if (answerId) setSelectedAnswerId(answerId);
    setAnswerResult('correct');
    celebrationManager.celebrate('small', praise.vi);
    setRoundPraise(praise);
    setRoundCompleted(true);
    setRoundScore((s) => s + 20);
    setStreak((st) => st + 1);

    if (currentRound >= TOTAL_ROUNDS) {
      setTimeout(() => {
        triggerVictory('Challenge Conquered!', 'Xuất sắc! Bé đã hoàn thành trọn vẹn 5 vòng thử thách!');
      }, 1200);
    }
  };

  const triggerWrongAnswer = (hintVi: string, answerId?: string) => {
    soundManager.playIncorrect();
    if (answerId) setSelectedAnswerId(answerId);
    setAnswerResult('wrong');
    setLives((l) => Math.max(0, l - 1));
    setStreak(0);
    voiceService.speakVietnamese(hintVi);

    setTimeout(() => {
      setSelectedAnswerId(null);
      setAnswerResult(null);
    }, 1000);
  };

  const goToNextRound = () => {
    setRoundCompleted(false);
    setRoundPraise(null);
    setSelectedAnswerId(null);
    setAnswerResult(null);
    const nextR = currentRound + 1;
    setCurrentRound(nextR);
    initRoundForGame(activeGameId, nextR);
  };

  // ================================================================
  // 12 DISTINCT GAMEPLAY MECHANICS IMPLEMENTATIONS
  // ================================================================

  // 1. BALLOON POP (Click & Timing physics)
  interface BalloonItem {
    id: string;
    word: string;
    viMeaning: string;
    colorClass: string;
    borderClass: string;
    popped: boolean;
  }
  const [balloonTarget, setBalloonTarget] = useState<VocabularyItem>(COMPREHENSIVE_VOCABULARY[0]);
  const [balloons, setBalloons] = useState<BalloonItem[]>([]);

  const initBalloonRound = () => {
    const target = COMPREHENSIVE_VOCABULARY[Math.floor(Math.random() * COMPREHENSIVE_VOCABULARY.length)];
    const others = COMPREHENSIVE_VOCABULARY.filter((v) => v.id !== target.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    const palette = [
      { bg: 'bg-rose-500', border: 'border-rose-600' },
      { bg: 'bg-sky-500', border: 'border-sky-600' },
      { bg: 'bg-amber-500', border: 'border-amber-600' },
      { bg: 'bg-emerald-500', border: 'border-emerald-600' },
    ];
    const list: BalloonItem[] = [target, ...others]
      .sort(() => 0.5 - Math.random())
      .map((item, idx) => ({
        id: item.id,
        word: item.word,
        viMeaning: item.viMeaning,
        colorClass: palette[idx % palette.length].bg,
        borderClass: palette[idx % palette.length].border,
        popped: false,
      }));
    setBalloonTarget(target);
    setBalloons(list);

    setTimeout(() => {
      voiceService.speakVietnamese(`Bé hãy bắn nổ bóng ${target.viMeaning} nhé!`, {
        onEnd: () => setTimeout(() => voiceService.speakWord(target.word), 250),
      });
    }, 200);
  };

  const handlePopBalloon = (b: BalloonItem) => {
    if (b.popped || roundCompleted) return;
    if (b.id === balloonTarget.id) {
      soundManager.playPop();
      setBalloons((prev) => prev.map((item) => (item.id === b.id ? { ...item, popped: true } : item)));
      voiceService.speakWord(b.word);
      triggerCorrectAnswer({ en: `Pop! That's ${b.word}!`, vi: `Bùm! Bé bắn đúng ${b.word} rồi!` }, b.id);
    } else {
      triggerWrongAnswer('Chưa đúng rồi bé ơi! Chọn bóng khác nhé!', b.id);
    }
  };

  // 2. ROCKET LAUNCH (Sequential fuel countdown)
  const [rocketTarget, setRocketTarget] = useState<VocabularyItem>(COMPREHENSIVE_VOCABULARY[1]);
  const [rocketChoices, setRocketChoices] = useState<VocabularyItem[]>([]);
  const [rocketLaunching, setRocketLaunching] = useState(false);

  const initRocketRound = () => {
    setRocketLaunching(false);
    const target = COMPREHENSIVE_VOCABULARY[Math.floor(Math.random() * COMPREHENSIVE_VOCABULARY.length)];
    const others = COMPREHENSIVE_VOCABULARY.filter((v) => v.id !== target.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);
    setRocketTarget(target);
    setRocketChoices([target, ...others].sort(() => 0.5 - Math.random()));

    setTimeout(() => {
      voiceService.speakVietnamese(`Nạp nhiên liệu bằng từ ${target.viMeaning} nhé!`, {
        onEnd: () => setTimeout(() => voiceService.speakWord(target.word), 250),
      });
    }, 200);
  };

  const handleLaunchRocketChoice = (choice: VocabularyItem) => {
    if (rocketLaunching || roundCompleted) return;
    if (choice.id === rocketTarget.id) {
      soundManager.playWhoosh();
      setRocketLaunching(true);
      voiceService.speakEnglish(`Blast off! ${choice.word}!`);
      setTimeout(() => {
        triggerCorrectAnswer({ en: 'Rocket Launched!', vi: 'Tên lửa đã phóng thành công!' }, choice.id);
      }, 1000);
    } else {
      triggerWrongAnswer('Nhiên liệu chưa đúng! Bé chọn lại nhé!', choice.id);
    }
  };

  // 3. FEED THE ANIMAL (Interactive Feeding Mechanism)
  interface FeedScenario {
    animal: string;
    animalVi: string;
    food: string;
    foodVi: string;
    wrongFoods: { name: string; nameVi: string }[];
  }
  const [feedState, setFeedState] = useState<FeedScenario>({
    animal: 'Cat',
    animalVi: 'Mèo con',
    food: 'Fish',
    foodVi: 'Cá tươi',
    wrongFoods: [
      { name: 'Grass', nameVi: 'Cỏ' },
      { name: 'Carrot', nameVi: 'Cà rốt' },
    ],
  });
  const [animalFed, setAnimalFed] = useState(false);

  const initFeedRound = () => {
    setAnimalFed(false);
    const scenarios: FeedScenario[] = [
      {
        animal: 'Cat',
        animalVi: 'Mèo con',
        food: 'Fish',
        foodVi: 'Cá tươi',
        wrongFoods: [
          { name: 'Grass', nameVi: 'Cỏ' },
          { name: 'Banana', nameVi: 'Chuối' },
        ],
      },
      {
        animal: 'Monkey',
        animalVi: 'Chú khỉ',
        food: 'Banana',
        foodVi: 'Quả chuối',
        wrongFoods: [
          { name: 'Fish', nameVi: 'Cá' },
          { name: 'Milk', nameVi: 'Sữa' },
        ],
      },
      {
        animal: 'Rabbit',
        animalVi: 'Thỏ trắng',
        food: 'Carrot',
        foodVi: 'Củ cà rốt',
        wrongFoods: [
          { name: 'Meat', nameVi: 'Thịt' },
          { name: 'Fish', nameVi: 'Cá' },
        ],
      },
      {
        animal: 'Dog',
        animalVi: 'Cún con',
        food: 'Bone',
        foodVi: 'Khúc xương',
        wrongFoods: [
          { name: 'Grass', nameVi: 'Cỏ' },
          { name: 'Banana', nameVi: 'Chuối' },
        ],
      },
    ];
    const picked = scenarios[Math.floor(Math.random() * scenarios.length)];
    setFeedState(picked);

    setTimeout(() => {
      voiceService.speakVietnamese(`Bé hãy cho ${picked.animalVi} ăn món gì nào?`);
    }, 200);
  };

  const handleFeedFood = (foodName: string) => {
    if (animalFed || roundCompleted) return;
    if (foodName === feedState.food) {
      soundManager.playDing();
      setAnimalFed(true);
      voiceService.speakEnglish(`Yummy! The ${feedState.animal} loves ${feedState.food}!`);
      triggerCorrectAnswer({
        en: `Delicious! ${feedState.animal} says Thank you!`,
        vi: `${feedState.animalVi} ăn rất ngon miệng!`,
      });
    } else {
      triggerWrongAnswer(`Bạn ấy không thích ăn món này đâu, bé chọn món khác nhé!`);
    }
  };

  // 4. FIND THE WORD (Discovery grid)
  const [findTarget, setFindTarget] = useState<VocabularyItem>(COMPREHENSIVE_VOCABULARY[0]);
  const [findChoices, setFindChoices] = useState<VocabularyItem[]>([]);

  const initFindRound = () => {
    const target = COMPREHENSIVE_VOCABULARY[Math.floor(Math.random() * COMPREHENSIVE_VOCABULARY.length)];
    const others = COMPREHENSIVE_VOCABULARY.filter((v) => v.id !== target.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    setFindTarget(target);
    setFindChoices([target, ...others].sort(() => 0.5 - Math.random()));

    setTimeout(() => {
      voiceService.speakVietnamese(`Bé hãy tìm: ${target.viMeaning} nhé!`, {
        onEnd: () => setTimeout(() => voiceService.speakWord(target.word), 250),
      });
    }, 200);
  };

  const handleChooseFind = (item: VocabularyItem) => {
    if (roundCompleted) return;
    if (item.id === findTarget.id) {
      voiceService.speakWord(item.word);
      triggerCorrectAnswer({ en: `Found ${item.word}!`, vi: `Chính xác! Bé tìm đúng rồi!` }, item.id);
    } else {
      triggerWrongAnswer('Chưa đúng hình này rồi! Bé nhìn kỹ lại nhé!', item.id);
    }
  };

  // 5. MATCH CARDS (3D Memory card flip)
  interface MemoryCard {
    cardId: number;
    text: string;
    textVi: string;
    matchKey: string;
    isFlipped: boolean;
    isMatched: boolean;
  }
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);

  const initMatchCardsRound = () => {
    const picked = COMPREHENSIVE_VOCABULARY.slice(0, 3);
    const deck: MemoryCard[] = [];
    picked.forEach((item, idx) => {
      deck.push({
        cardId: idx * 2,
        text: item.word,
        textVi: item.viMeaning,
        matchKey: item.id,
        isFlipped: false,
        isMatched: false,
      });
      deck.push({
        cardId: idx * 2 + 1,
        text: item.viMeaning,
        textVi: item.word,
        matchKey: item.id,
        isFlipped: false,
        isMatched: false,
      });
    });
    setCards(deck.sort(() => 0.5 - Math.random()));
    setFlippedIndices([]);
  };

  const handleFlipCard = (index: number) => {
    if (flippedIndices.length === 2 || cards[index].isFlipped || cards[index].isMatched) return;
    soundManager.playWhoosh();
    voiceService.speakEnglish(cards[index].text);

    const updated = [...cards];
    updated[index].isFlipped = true;
    setCards(updated);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      const [i1, i2] = newFlipped;
      if (updated[i1].matchKey === updated[i2].matchKey) {
        soundManager.playDing();
        updated[i1].isMatched = true;
        updated[i2].isMatched = true;
        setCards([...updated]);
        setFlippedIndices([]);
        if (updated.every((c) => c.isMatched)) {
          triggerCorrectAnswer({ en: 'Matched All Pairs!', vi: 'Bé đã ghép đúng toàn bộ thẻ!' });
        }
      } else {
        setTimeout(() => {
          updated[i1].isFlipped = false;
          updated[i2].isFlipped = false;
          setCards([...updated]);
          setFlippedIndices([]);
        }, 900);
      }
    }
  };

  // 6. MAGIC TRAIN (Missing carriage assembly)
  const [trainTarget, setTrainTarget] = useState({ word: 'CAT', missing: 'A', vi: 'Con mèo', options: ['A', 'E', 'O'] });
  const [trainCompleted, setTrainCompleted] = useState(false);

  const initTrainRound = () => {
    setTrainCompleted(false);
    const words = [
      { word: 'CAT', missing: 'A', vi: 'Con mèo', options: ['A', 'E', 'U'] },
      { word: 'DOG', missing: 'O', vi: 'Con chó', options: ['O', 'I', 'A'] },
      { word: 'SUN', missing: 'U', vi: 'Mặt trời', options: ['U', 'O', 'E'] },
      { word: 'RED', missing: 'E', vi: 'Màu đỏ', options: ['E', 'A', 'I'] },
    ];
    const picked = words[Math.floor(Math.random() * words.length)];
    setTrainTarget(picked);

    setTimeout(() => {
      voiceService.speakVietnamese(`Chọn toa chữ cái còn thiếu cho đoàn tàu "${picked.vi}" nhé!`);
    }, 200);
  };

  const handleChooseCarriageLetter = (letter: string) => {
    if (trainCompleted || roundCompleted) return;
    if (letter === trainTarget.missing) {
      setTrainCompleted(true);
      voiceService.speakWord(trainTarget.word);
      triggerCorrectAnswer({ en: `Train Complete! ${trainTarget.word}!`, vi: 'Đoàn tàu đã lăn bánh!' }, letter);
    } else {
      triggerWrongAnswer('Toa tàu chưa khớp! Bé chọn chữ cái khác nhé!', letter);
    }
  };

  // 7. CATCH THE WORD (Falling words reflex)
  const [catchTarget, setCatchTarget] = useState<VocabularyItem>(COMPREHENSIVE_VOCABULARY[2]);
  const [catchOptions, setCatchOptions] = useState<VocabularyItem[]>([]);

  const initCatchRound = () => {
    const target = COMPREHENSIVE_VOCABULARY[Math.floor(Math.random() * COMPREHENSIVE_VOCABULARY.length)];
    const others = COMPREHENSIVE_VOCABULARY.filter((v) => v.id !== target.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    setCatchTarget(target);
    setCatchOptions([target, ...others].sort(() => 0.5 - Math.random()));

    setTimeout(() => {
      voiceService.speakVietnamese(`Bé hãy đón bắt chữ: ${target.viMeaning} nhé!`, {
        onEnd: () => setTimeout(() => voiceService.speakWord(target.word), 250),
      });
    }, 200);
  };

  const handleCatchWord = (item: VocabularyItem) => {
    if (roundCompleted) return;
    if (item.id === catchTarget.id) {
      voiceService.speakWord(item.word);
      triggerCorrectAnswer({ en: `Caught ${item.word}!`, vi: `Bắt trúng ${item.word} rồi!` }, item.id);
    } else {
      triggerWrongAnswer('Bắt nhầm từ rồi! Thử lại nhé!', item.id);
    }
  };

  // 8. BUILD THE SENTENCE (Grammar assembly tray)
  interface SentenceChallenge {
    words: string[];
    fullEn: string;
    fullVi: string;
  }
  const [sentenceChallenge, setSentenceChallenge] = useState<SentenceChallenge>({
    words: ['I', 'like', 'apples'],
    fullEn: 'I like apples.',
    fullVi: 'Bé thích những quả táo.',
  });
  const [assembledWords, setAssembledWords] = useState<string[]>([]);
  const [scrambledWords, setScrambledWords] = useState<string[]>([]);

  const initSentenceRound = () => {
    const sentences: SentenceChallenge[] = [
      { words: ['I', 'like', 'apples'], fullEn: 'I like apples.', fullVi: 'Bé thích những quả táo.' },
      { words: ['The', 'cat', 'is', 'cute'], fullEn: 'The cat is cute.', fullVi: 'Chú mèo thật dễ thương.' },
      { words: ['This', 'is', 'my', 'mom'], fullEn: 'This is my mom.', fullVi: 'Đây là mẹ của tôi.' },
      { words: ['The', 'sun', 'is', 'bright'], fullEn: 'The sun is bright.', fullVi: 'Mặt trời tỏa nắng rực rỡ.' },
    ];
    const picked = sentences[Math.floor(Math.random() * sentences.length)];
    setSentenceChallenge(picked);
    setAssembledWords([]);
    setScrambledWords([...picked.words].sort(() => 0.5 - Math.random()));

    setTimeout(() => {
      voiceService.speakVietnamese(`Ghép thành câu: "${picked.fullVi}" nhé!`);
    }, 200);
  };

  const handleTapAssembleWord = (word: string, fromScrambled: boolean) => {
    if (roundCompleted) return;
    soundManager.playPop();
    if (fromScrambled) {
      const newAssembled = [...assembledWords, word];
      setAssembledWords(newAssembled);
      const idx = scrambledWords.indexOf(word);
      const newScrambled = [...scrambledWords];
      newScrambled.splice(idx, 1);
      setScrambledWords(newScrambled);

      if (newAssembled.length === sentenceChallenge.words.length) {
        if (newAssembled.join(' ') === sentenceChallenge.words.join(' ')) {
          voiceService.speakBilingual(sentenceChallenge.fullEn, sentenceChallenge.fullVi);
          triggerCorrectAnswer({ en: 'Sentence Built!', vi: 'Ghép câu hoàn toàn chính xác!' });
        } else {
          triggerWrongAnswer('Thứ tự từ chưa đúng rồi! Bé xếp lại nhé!');
          setTimeout(() => {
            setAssembledWords([]);
            setScrambledWords([...sentenceChallenge.words].sort(() => 0.5 - Math.random()));
          }, 800);
        }
      }
    }
  };

  // 9. ANIMAL RESCUE (Key unlatching puzzle)
  const [rescueQuestion, setRescueQuestion] = useState<KidQuestion>(validQuestions[0]);
  const [cageUnlocked, setCageUnlocked] = useState(false);

  const initRescueRound = () => {
    setCageUnlocked(false);
    const q = validQuestions[Math.floor(Math.random() * validQuestions.length)];
    setRescueQuestion(q);

    setTimeout(() => {
      voiceService.speakVietnamese(`Trả lời đúng để mở chìa khóa giải cứu bạn thú nhé!`);
    }, 200);
  };

  const handleRescueAnswer = (answerId: string) => {
    if (cageUnlocked || roundCompleted) return;
    if (answerId === rescueQuestion.correctAnswerId) {
      setCageUnlocked(true);
      voiceService.speakEnglish('Hooray! The animal is free! Thank you!');
      triggerCorrectAnswer({ en: 'Animal Rescued!', vi: 'Bé đã mở khóa và giải cứu bạn thú!' }, answerId);
    } else {
      triggerWrongAnswer('Chìa khóa chưa đúng! Bé chọn lại nhé!', answerId);
    }
  };

  // 10. TREASURE ISLAND (5-Checkpoint Path)
  const [islandCheckpoint, setIslandCheckpoint] = useState(1);
  const [islandQuestion, setIslandQuestion] = useState<KidQuestion>(validQuestions[1]);

  const initTreasureRound = () => {
    setIslandCheckpoint(currentRound);
    const q = validQuestions[(currentRound - 1) % validQuestions.length];
    setIslandQuestion(q);

    setTimeout(() => {
      voiceService.speakVietnamese(`Trạm ${currentRound}: Vượt qua thử thách để tiến về kho báu!`);
    }, 200);
  };

  const handleTreasureAnswer = (answerId: string) => {
    if (roundCompleted) return;
    if (answerId === islandQuestion.correctAnswerId) {
      voiceService.speakEnglish('Great step forward!');
      triggerCorrectAnswer({ en: `Station ${currentRound} Cleared!`, vi: `Bé đã vượt qua trạm ${currentRound}!` }, answerId);
    } else {
      triggerWrongAnswer('Đường đi chưa đúng, bé suy nghĩ lại nhé!', answerId);
    }
  };

  // 11. SOUND DETECTIVE (Audio-only mystery)
  const [detectiveTarget, setDetectiveTarget] = useState<VocabularyItem>(COMPREHENSIVE_VOCABULARY[0]);
  const [detectiveChoices, setDetectiveChoices] = useState<VocabularyItem[]>([]);

  const initDetectiveRound = () => {
    const target = COMPREHENSIVE_VOCABULARY[Math.floor(Math.random() * COMPREHENSIVE_VOCABULARY.length)];
    const others = COMPREHENSIVE_VOCABULARY.filter((v) => v.id !== target.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    setDetectiveTarget(target);
    setDetectiveChoices([target, ...others].sort(() => 0.5 - Math.random()));

    setTimeout(() => {
      soundManager.playDing();
      voiceService.speakWord(target.word);
    }, 300);
  };

  const handleDetectiveChoice = (item: VocabularyItem) => {
    if (roundCompleted) return;
    if (item.id === detectiveTarget.id) {
      voiceService.speakBilingual(item.word, item.viMeaning);
      triggerCorrectAnswer({ en: `Case Solved! ${item.word}!`, vi: `Thám tử tìm đúng ${item.word} rồi!` }, item.id);
    } else {
      triggerWrongAnswer('Chưa khớp với âm thanh! Bé bấm nút nghe lại nhé!', item.id);
    }
  };

  // 12. SPEAK & REPEAT (Speech repetition with instant meter)
  const [speakTarget, setSpeakTarget] = useState<VocabularyItem>(COMPREHENSIVE_VOCABULARY[0]);
  const [speakState, setSpeakState] = useState<'idle' | 'listening' | 'success' | 'retry'>('idle');
  const [speakFeedbackText, setSpeakFeedbackText] = useState<string>('');

  const initSpeakRound = () => {
    setSpeakState('idle');
    setSpeakFeedbackText('');
    const target = COMPREHENSIVE_VOCABULARY[Math.floor(Math.random() * COMPREHENSIVE_VOCABULARY.length)];
    setSpeakTarget(target);

    setTimeout(() => {
      voiceService.speakWord(target.word);
    }, 300);
  };

  const handleStartVoiceRepeat = () => {
    soundManager.playPop();
    setSpeakState('listening');
    setSpeakFeedbackText('Bé hãy đọc to: "' + speakTarget.word + '" nhé...');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (e: any) => {
          const spoken = (e.results[0][0]?.transcript || '').toLowerCase().trim();
          const target = speakTarget.word.toLowerCase().trim();

          if (spoken.includes(target) || target.includes(spoken)) {
            setSpeakState('success');
            setSpeakFeedbackText('Excellent! Xuất sắc! Bé phát âm rất chuẩn!');
            triggerCorrectAnswer({ en: 'Excellent Pronunciation!', vi: 'Bé phát âm rất chuẩn xác!' });
          } else {
            setSpeakState('retry');
            setSpeakFeedbackText(`Gần đúng rồi! Bé đọc lại thật to: "${speakTarget.word}" nhé!`);
            triggerWrongAnswer('Bé thử lại to và rõ hơn nhé!');
          }
        };

        recognition.onerror = () => {
          fallbackSpeechSuccess();
        };

        recognition.start();
      } catch {
        fallbackSpeechSuccess();
      }
    } else {
      fallbackSpeechSuccess();
    }
  };

  const fallbackSpeechSuccess = () => {
    setTimeout(() => {
      setSpeakState('success');
      setSpeakFeedbackText('Good Job! Giỏi lắm! Bé phát âm rất hay!');
      triggerCorrectAnswer({ en: 'Good Job!', vi: 'Bé nói rất tốt!' });
    }, 1400);
  };

  // Master Round Initializer
  const initRoundForGame = (gameId: GameId, round: number) => {
    if (gameId === 'balloon_pop') initBalloonRound();
    else if (gameId === 'rocket_launch') initRocketRound();
    else if (gameId === 'feed_animal') initFeedRound();
    else if (gameId === 'find_word') initFindRound();
    else if (gameId === 'match_cards') initMatchCardsRound();
    else if (gameId === 'magic_train') initTrainRound();
    else if (gameId === 'catch_word') initCatchRound();
    else if (gameId === 'build_sentence') initSentenceRound();
    else if (gameId === 'animal_rescue') initRescueRound();
    else if (gameId === 'treasure_island') initTreasureRound();
    else if (gameId === 'sound_detective') initDetectiveRound();
    else if (gameId === 'speak_repeat') initSpeakRound();
  };

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 animate-fadeIn pb-24 select-none">
      {/* ================================================================ */}
      {/* 1. TOP HEADER & HUD STATS (High Contrast, Standardized Height)   */}
      {/* ================================================================ */}
      <div className="bg-white p-5 rounded-3xl border-2 border-amber-300 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-13 h-13 rounded-2xl flex items-center justify-center border-2 shadow-inner ${activeTheme.bgLight} ${activeTheme.borderColor}`}
          >
            <KidsIllustration name={activeTheme.illustration} className="w-9 h-9" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2">
              <span>{activeTheme.titleVi}</span>
              <span className="text-xs font-bold text-slate-500 hidden md:inline">
                ({activeTheme.titleEn})
              </span>
            </h1>
            <p className="text-xs font-bold text-slate-600 mt-0.5">
              {activeGameDef.descriptionVi}
            </p>
          </div>
        </div>

        {/* HUD Live Stats with Standardized Equal Height */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Hearts */}
          <div className="h-11 px-3 py-1.5 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-600 flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-4 h-4 ${i < lives ? 'fill-rose-500 text-rose-500' : 'text-slate-300'}`}
              />
            ))}
          </div>

          {/* Round & XP */}
          <div className="h-11 px-3.5 py-1.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 font-black text-xs sm:text-sm flex items-center gap-2">
            <span>Vòng {currentRound}/{TOTAL_ROUNDS}</span>
            <span>•</span>
            <span className="text-amber-800 flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>{roundScore} XP</span>
            </span>
          </div>

          {/* Streak Flame */}
          {streak > 1 && (
            <div className="h-11 px-3 py-1.5 rounded-2xl bg-orange-50 border-2 border-orange-300 text-orange-800 font-black text-xs flex items-center gap-1 animate-pulse">
              <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
              <span>x{streak}</span>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* 2. MAIN LAYOUT: 12 DISTINCT GAME CARDS + STAGE ARENA             */}
      {/* ================================================================ */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* LEFT COLUMN: 12 GAME CARDS WITH INDIVIDUAL VISUAL THEMES */}
        <div className="w-full lg:w-80 shrink-0 space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600">
              12 Trò chơi rèn luyện:
            </span>
            <span className="text-[11px] font-bold text-slate-500">Gameplay riêng biệt</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 max-h-[660px] overflow-y-auto pr-1">
            {KIDS_GAMES_REGISTRY.map((game) => {
              const theme = GAME_THEMES[game.id] || GAME_THEMES.balloon_pop;
              const isActive = activeGameId === game.id;
              const GameIcon = theme.icon;

              return (
                <button
                  key={game.id}
                  onClick={() => handleSelectGame(game.id)}
                  className={`w-full p-3.5 rounded-2xl font-black text-left transition-all cursor-pointer border-2 flex items-center justify-between gap-3 min-h-[68px] ${
                    isActive
                      ? `bg-amber-400 border-amber-500 shadow-md ring-2 ring-amber-300 scale-[1.02]`
                      : `${theme.bgLight} ${theme.borderColor} hover:border-amber-400 hover:-translate-y-0.5 hover:shadow-sm`
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border-2 p-1 ${
                        isActive
                          ? 'bg-amber-500 border-amber-600 text-slate-950'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <KidsIllustration name={theme.illustration} className="w-full h-full object-contain" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-black text-sm text-slate-950 truncate">{theme.titleVi}</p>
                      <p className="text-[11px] font-bold text-slate-600 truncate">{theme.titleEn}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-full border shrink-0 ${theme.badgeStyle}`}
                  >
                    {game.difficultyVi}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: DEDICATED ARENA (Visual Transition & Clean Isolation) */}
        <div className="flex-1 w-full min-w-0">
          {!gameStarted ? (
            <div
              className={`bg-white rounded-3xl p-8 sm:p-12 border-4 ${activeTheme.borderColor} shadow-sm flex flex-col items-center justify-center text-center space-y-6 min-h-[480px] transition-all`}
            >
              <div
                className={`w-28 h-28 rounded-3xl ${activeTheme.bgLight} border-2 ${activeTheme.borderColor} flex items-center justify-center p-3 animate-gentle-float shadow-sm`}
              >
                <KidsIllustration name={activeTheme.illustration} className="w-full h-full object-contain" />
              </div>

              <div className="max-w-md space-y-2">
                <span className={`px-3.5 py-1 rounded-full text-xs font-black border ${activeTheme.badgeStyle}`}>
                  {activeGameDef.category.toUpperCase()} • {activeGameDef.difficultyVi}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
                  {activeTheme.titleVi}
                </h2>
                <p className="text-sm font-bold text-slate-600">{activeGameDef.descriptionVi}</p>
              </div>

              <div className="flex items-center gap-6 p-4 rounded-2xl bg-slate-50 border-2 border-slate-200">
                <div className="text-center">
                  <p className="text-[11px] font-bold text-slate-500">Phần thưởng</p>
                  <p className="text-sm font-black text-amber-700">+{activeGameDef.starsAwarded} Sao Vàng</p>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="text-center">
                  <p className="text-[11px] font-bold text-slate-500">Kinh nghiệm</p>
                  <p className="text-sm font-black text-emerald-700">+{activeGameDef.xpAwarded} XP</p>
                </div>
              </div>

              <button
                onClick={handleStartGame}
                className={`px-10 py-4 rounded-2xl bg-gradient-to-r ${activeTheme.accentGradient} text-white font-black text-lg border-b-4 border-black/20 active:scale-95 transition cursor-pointer flex items-center gap-3 shadow-md animate-bounce min-h-[52px]`}
              >
                <Play className="w-6 h-6 fill-current" />
                <span>BẮT ĐẦU CHƠI NGAY</span>
              </button>
            </div>
          ) : (
            <div
              className={`bg-white rounded-3xl p-6 sm:p-8 border-4 ${activeTheme.borderColor} shadow-sm space-y-6 transition-all`}
            >
              {/* ========================================================= */}
              {/* GAME 1: BALLOON POP (Click & Timing)                      */}
              {/* ========================================================= */}
              {activeGameId === 'balloon_pop' && (
                <div className="space-y-6">
                  <div className="kids-game-text-area text-center space-y-1">
                    <span className="px-3 py-1 rounded-full bg-rose-100 border border-rose-300 text-xs font-black text-rose-950">
                      Mục tiêu: Bắn nổ quả bóng đúng
                    </span>
                    <h3 className="text-2xl font-black text-slate-950 mt-1">
                      Bé hãy tìm bóng mang chữ:{' '}
                      <span className="text-rose-600 underline">{balloonTarget.word}</span> (
                      {balloonTarget.viMeaning})
                    </h3>
                  </div>

                  <div className="kids-game-canvas-area bg-gradient-to-b from-sky-100 to-rose-50 p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-xl">
                      {balloons.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => handlePopBalloon(b)}
                          disabled={b.popped || roundCompleted}
                          className={`p-4 rounded-3xl flex flex-col items-center justify-center transition-all cursor-pointer select-none relative min-h-[145px] border-2 ${b.borderClass} ${
                            b.popped
                              ? 'opacity-20 scale-75 pointer-events-none'
                              : `${b.colorClass} hover:scale-105 active:scale-95 shadow-md animate-balloon-float`
                          }`}
                        >
                          <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-xs flex items-center justify-center p-1.5 mb-1 shadow-inner">
                            <KidsIllustration name={b.word} className="w-full h-full object-contain" />
                          </div>
                          <span className="text-xl font-black text-white drop-shadow">
                            {b.word}
                          </span>
                          <span className="text-[11px] font-bold text-white/90">({b.viMeaning})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 2: ROCKET LAUNCH (Sequential Launch)                 */}
              {/* ========================================================= */}
              {activeGameId === 'rocket_launch' && (
                <div className="space-y-6">
                  <div className="kids-game-text-area text-center space-y-1">
                    <span className="px-3 py-1 rounded-full bg-sky-100 border border-sky-300 text-xs font-black text-sky-950">
                      Nạp nhiên liệu phóng tên lửa
                    </span>
                    <h3 className="text-2xl font-black text-slate-950 mt-1">
                      Chọn đúng từ:{' '}
                      <span className="text-sky-600 underline">{rocketTarget.word}</span> (
                      {rocketTarget.viMeaning})
                    </h3>
                  </div>

                  <div className="kids-game-canvas-area bg-slate-900 rounded-3xl p-6 relative overflow-hidden">
                    <div
                      className={`flex flex-col items-center transition-transform duration-700 ${
                        rocketLaunching ? 'animate-rocket-blastoff' : 'animate-rocket-rumble'
                      }`}
                    >
                      <KidsIllustration name="rocket" className="w-28 h-28 drop-shadow-xl" />
                      {rocketLaunching && (
                        <div className="w-8 h-12 bg-amber-400 rounded-full blur-xs animate-pulse -mt-2" />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {rocketChoices.map((choice) => {
                      const isCorrect = choice.id === rocketTarget.id && answerResult === 'correct';
                      const isWrong = choice.id === selectedAnswerId && answerResult === 'wrong';

                      return (
                        <button
                          key={choice.id}
                          onClick={() => handleLaunchRocketChoice(choice)}
                          className={`p-4 rounded-2xl font-black text-base border-2 transition cursor-pointer min-h-[64px] flex items-center gap-3 ${
                            isCorrect
                              ? 'bg-emerald-100 border-emerald-500 text-emerald-950 scale-105 shadow-md ring-2 ring-emerald-300'
                              : isWrong
                              ? 'bg-rose-100 border-rose-500 text-rose-950 animate-shake'
                              : 'bg-white hover:bg-sky-50 text-slate-950 border-slate-200 hover:border-sky-300 active:scale-95 shadow-xs'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center p-1.5 shrink-0">
                            <KidsIllustration name={choice.word} className="w-full h-full object-contain" />
                          </div>
                          <div className="text-left">
                            <p className="font-black text-base text-slate-950">{choice.word}</p>
                            <p className="text-xs font-bold text-slate-600">({choice.viMeaning})</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 3: FEED THE ANIMAL (Interactive Bowl)                */}
              {/* ========================================================= */}
              {activeGameId === 'feed_animal' && (
                <div className="space-y-6">
                  <div className="kids-game-text-area text-center space-y-1">
                    <span className="px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-xs font-black text-amber-950">
                      Chăm sóc thú cưng
                    </span>
                    <h3 className="text-2xl font-black text-slate-950 mt-1">
                      {feedState.animalVi} ({feedState.animal}) thích ăn món gì?
                    </h3>
                  </div>

                  <div className="kids-game-canvas-area bg-amber-50 p-6 flex flex-col items-center justify-center">
                    <div className="w-32 h-32 rounded-3xl bg-amber-100/80 border-2 border-amber-300 flex items-center justify-center p-3 shadow-sm">
                      <KidsIllustration
                        name={feedState.animal.toLowerCase()}
                        className={`w-full h-full object-contain ${
                          animalFed ? 'animate-animal-eat' : 'animate-animal-breathe'
                        }`}
                      />
                    </div>
                    <p className="font-black text-lg text-slate-900 mt-2">
                      {animalFed ? `No nê rồi! ${feedState.animalVi} cảm ơn bé!` : `${feedState.animalVi} đang đói bụng...`}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { name: feedState.food, nameVi: feedState.foodVi },
                      ...feedState.wrongFoods,
                    ]
                      .sort(() => 0.5 - Math.random())
                      .map((f, i) => (
                        <button
                          key={i}
                          onClick={() => handleFeedFood(f.name)}
                          disabled={animalFed || roundCompleted}
                          className="p-4 rounded-2xl bg-white hover:bg-emerald-50 text-slate-950 font-black text-base border-2 border-amber-300 hover:border-emerald-500 active:scale-95 transition cursor-pointer min-h-[90px] flex flex-col items-center justify-center gap-1 shadow-xs group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-center p-1 group-hover:scale-110 transition-transform">
                            <KidsIllustration name={f.name.toLowerCase()} className="w-full h-full object-contain" />
                          </div>
                          <span className="font-black text-base text-slate-950">{f.name}</span>
                          <span className="text-xs font-bold text-slate-600">({f.nameVi})</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 4: FIND THE WORD                                     */}
              {/* ========================================================= */}
              {activeGameId === 'find_word' && (
                <div className="space-y-6">
                  <div className="kids-game-text-area text-center space-y-1">
                    <span className="px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-xs font-black text-emerald-950">
                      Lắng nghe và tìm kiếm
                    </span>
                    <h3 className="text-2xl font-black text-slate-950 mt-1">
                      Bé hãy tìm: <span className="underline text-emerald-700">{findTarget.viMeaning}</span>!
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {findChoices.map((c) => {
                      const isCorrect = c.id === findTarget.id && answerResult === 'correct';
                      const isWrong = c.id === selectedAnswerId && answerResult === 'wrong';

                      return (
                        <button
                          key={c.id}
                          onClick={() => handleChooseFind(c)}
                          className={`p-5 rounded-3xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition min-h-[140px] group ${
                            isCorrect
                              ? 'bg-emerald-100 border-emerald-500 scale-105 shadow-md ring-2 ring-emerald-300'
                              : isWrong
                              ? 'bg-rose-100 border-rose-500 animate-shake'
                              : 'bg-white hover:bg-emerald-50 border-slate-200 hover:border-emerald-300 active:scale-95 shadow-xs'
                          }`}
                        >
                          <div className="w-16 h-16 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                            <KidsIllustration name={c.word} className="w-full h-full object-contain" />
                          </div>
                          <span className="text-xl font-black text-slate-950">{c.word}</span>
                          <span className="text-xs font-bold text-slate-600">({c.viMeaning})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 5: MATCH CARDS                                       */}
              {/* ========================================================= */}
              {activeGameId === 'match_cards' && (
                <div className="space-y-6">
                  <div className="kids-game-text-area text-center space-y-1">
                    <span className="px-3 py-1 rounded-full bg-purple-100 border border-purple-300 text-xs font-black text-purple-950">
                      Thử tài trí nhớ 3D
                    </span>
                    <h3 className="text-2xl font-black text-slate-950 mt-1">
                      Lật mở các cặp thẻ trùng khớp:
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {cards.map((c, idx) => (
                      <button
                        key={c.cardId}
                        onClick={() => handleFlipCard(idx)}
                        disabled={c.isMatched}
                        className={`p-5 rounded-3xl border-2 flex flex-col items-center justify-center min-h-[130px] cursor-pointer transition-all ${
                          c.isMatched
                            ? 'bg-emerald-100 border-emerald-400 opacity-85'
                            : c.isFlipped
                            ? 'bg-purple-100 border-purple-500 scale-102 shadow-sm'
                            : 'bg-white border-slate-300 hover:border-purple-400 hover:bg-purple-50 shadow-xs'
                        }`}
                      >
                        {c.isFlipped || c.isMatched ? (
                          <div className="flex flex-col items-center justify-center animate-fadeIn">
                            <div className="w-14 h-14 rounded-2xl bg-white/90 border border-purple-300 flex items-center justify-center p-1.5 mb-1 shadow-xs">
                              <KidsIllustration name={c.text} className="w-full h-full object-contain" />
                            </div>
                            <span className="text-base font-black text-slate-950">{c.text}</span>
                            <span className="text-xs font-bold text-purple-900">({c.textVi})</span>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-300 flex items-center justify-center">
                            <Layers className="w-6 h-6 text-purple-600" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 6: MAGIC TRAIN                                       */}
              {/* ========================================================= */}
              {activeGameId === 'magic_train' && (
                <div className="space-y-6">
                  <div className="kids-game-text-area text-center space-y-1">
                    <span className="px-3 py-1 rounded-full bg-orange-100 border border-orange-300 text-xs font-black text-orange-950">
                      Lắp ráp toa tàu
                    </span>
                    <h3 className="text-2xl font-black text-slate-950 mt-1">
                      Hoàn thành từ: <span className="underline text-orange-600">{trainTarget.vi}</span>
                    </h3>
                  </div>

                  <div className="kids-game-canvas-area bg-orange-50 p-6 flex items-center justify-center gap-3 overflow-x-auto">
                    <KidsIllustration name="train" className="w-18 h-18 shrink-0 mr-2 animate-gentle-float" />
                    {trainTarget.word.split('').map((char, i) => {
                      const isMissingChar = char === trainTarget.missing;
                      return (
                        <div
                          key={i}
                          className={`w-16 h-20 rounded-2xl border-2 flex items-center justify-center text-2xl font-black shadow-xs ${
                            isMissingChar
                              ? trainCompleted
                                ? 'bg-emerald-300 border-emerald-500 text-emerald-950'
                                : 'bg-white border-dashed border-orange-500 text-orange-600'
                              : 'bg-orange-500 border-orange-700 text-white shadow-sm'
                          }`}
                        >
                          {isMissingChar ? (trainCompleted ? char : '?') : char}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    {trainTarget.options.map((letter, i) => (
                      <button
                        key={i}
                        onClick={() => handleChooseCarriageLetter(letter)}
                        className="w-16 h-16 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-2xl border-b-4 border-amber-600 active:scale-95 transition cursor-pointer min-h-[48px]"
                      >
                        {letter}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 7: CATCH THE CORRECT WORD                            */}
              {/* ========================================================= */}
              {activeGameId === 'catch_word' && (
                <div className="space-y-6">
                  <div className="kids-game-text-area text-center space-y-1">
                    <span className="px-3 py-1 rounded-full bg-pink-100 border border-pink-300 text-xs font-black text-pink-950">
                      Bắt từ vựng
                    </span>
                    <h3 className="text-2xl font-black text-slate-950 mt-1">
                      Đón lấy từ:{' '}
                      <span className="text-pink-600 underline">{catchTarget.word}</span> (
                      {catchTarget.viMeaning})!
                    </h3>
                  </div>

                  <div className="kids-game-canvas-area bg-gradient-to-b from-sky-100 to-pink-50 p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                      {catchOptions.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => handleCatchWord(opt)}
                          className="p-4 rounded-3xl bg-white hover:bg-pink-50 border-2 border-pink-300 hover:border-pink-500 flex flex-col items-center justify-center gap-1 active:scale-95 transition cursor-pointer min-h-[120px] shadow-sm animate-gentle-float group"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-center p-1 group-hover:scale-110 transition-transform">
                            <KidsIllustration name={opt.word} className="w-full h-full object-contain" />
                          </div>
                          <span className="font-black text-base text-slate-950">{opt.word}</span>
                          <span className="text-[11px] font-bold text-slate-600">({opt.viMeaning})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 8: BUILD THE SENTENCE                                */}
              {/* ========================================================= */}
              {activeGameId === 'build_sentence' && (
                <div className="space-y-6">
                  <div className="kids-game-text-area text-center space-y-1">
                    <span className="px-3 py-1 rounded-full bg-teal-100 border border-teal-300 text-xs font-black text-teal-950">
                      Nghĩa: {sentenceChallenge.fullVi}
                    </span>
                    <h3 className="text-2xl font-black text-slate-950 mt-1">
                      Ghép các từ theo thứ tự chính xác:
                    </h3>
                  </div>

                  <div className="min-h-[70px] p-4 rounded-3xl bg-slate-50 border-2 border-slate-300 flex items-center justify-center gap-3 flex-wrap">
                    {assembledWords.length === 0 ? (
                      <span className="text-xs font-bold text-slate-400">
                        Chạm vào các từ bên dưới để xếp vào đây
                      </span>
                    ) : (
                      assembledWords.map((w, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 rounded-xl bg-teal-400 text-slate-950 font-black text-sm border border-teal-500"
                        >
                          {w}
                        </span>
                      ))
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    {scrambledWords.map((w, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleTapAssembleWord(w, true)}
                        className="px-5 py-3 rounded-2xl bg-sky-100 hover:bg-sky-200 text-slate-950 font-black text-sm border-2 border-sky-300 active:scale-95 cursor-pointer min-h-[48px]"
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 9: ANIMAL RESCUE                                     */}
              {/* ========================================================= */}
              {activeGameId === 'animal_rescue' && (
                <div className="space-y-6">
                  <div className="kids-game-text-area text-center space-y-1">
                    <span className="px-3 py-1 rounded-full bg-green-100 border border-green-300 text-xs font-black text-green-950">
                      Câu đố mở khóa lồng
                    </span>
                    <h3 className="text-2xl font-black text-slate-950 mt-1">
                      {rescueQuestion.questionVi}
                    </h3>
                    <p className="text-xs font-bold text-slate-500">{rescueQuestion.question}</p>
                  </div>

                  <div className="kids-game-canvas-area bg-emerald-50/80 p-6 flex flex-col items-center justify-center">
                    <div className="w-28 h-28 rounded-3xl bg-white border-2 border-emerald-300 flex items-center justify-center p-2 shadow-sm relative">
                      <KidsIllustration
                        name="dog"
                        className={`w-full h-full object-contain ${
                          cageUnlocked ? 'animate-bounce' : 'animate-animal-breathe'
                        }`}
                      />
                      <span className="absolute -top-2 -right-2 p-1.5 rounded-full bg-white border border-slate-200 shadow-xs">
                        {cageUnlocked ? <Unlock className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-slate-500" />}
                      </span>
                    </div>
                    <p className="font-black text-base text-slate-900 mt-2">
                      {cageUnlocked ? 'Tuyệt vời! Chú cún đã được giải cứu an toàn!' : 'Bạn cún đang bị nhốt, bé hãy giải cứu nhé!'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {rescueQuestion.answers.map((ans) => {
                      const isCorrect = ans.id === rescueQuestion.correctAnswerId && answerResult === 'correct';
                      const isWrong = ans.id === selectedAnswerId && answerResult === 'wrong';

                      return (
                        <button
                          key={ans.id}
                          onClick={() => handleRescueAnswer(ans.id)}
                          className={`p-3.5 rounded-2xl font-black text-sm flex items-center justify-between cursor-pointer transition min-h-[58px] border-2 group ${
                            isCorrect
                              ? 'bg-emerald-100 border-emerald-500 text-emerald-950 scale-102 shadow-md ring-2 ring-emerald-300'
                              : isWrong
                              ? 'bg-rose-100 border-rose-500 text-rose-950 animate-shake'
                              : 'bg-white hover:bg-green-50 border-slate-200 hover:border-green-300 text-slate-950 active:scale-95 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center p-1 group-hover:scale-110 transition-transform shrink-0">
                              <KidsIllustration name={ans.text} className="w-full h-full object-contain" />
                            </div>
                            <div className="text-left">
                              <p className="font-black text-sm text-slate-950">{ans.textVi}</p>
                              <p className="text-xs font-bold text-slate-600">({ans.text})</p>
                            </div>
                          </div>
                          {isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 10: TREASURE ISLAND                                  */}
              {/* ========================================================= */}
              {activeGameId === 'treasure_island' && (
                <div className="space-y-6">
                  <div className="kids-game-text-area text-center space-y-1">
                    <span className="px-3 py-1 rounded-full bg-yellow-100 border border-yellow-300 text-xs font-black text-yellow-950">
                      Trạm kiểm soát {islandCheckpoint}/5
                    </span>
                    <h3 className="text-2xl font-black text-slate-950 mt-1">
                      {islandQuestion.questionVi}
                    </h3>
                  </div>

                  <div className="kids-game-canvas-area bg-amber-50 p-6 flex items-center justify-center gap-4">
                    <KidsIllustration name="treasure-chest" className="w-16 h-16 shrink-0 mr-2 animate-gentle-float" />
                    {[1, 2, 3, 4, 5].map((cp) => (
                      <div
                        key={cp}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border-2 ${
                          cp < islandCheckpoint
                            ? 'bg-emerald-400 text-emerald-950 border-emerald-600'
                            : cp === islandCheckpoint
                            ? 'bg-amber-400 text-amber-950 border-amber-600 scale-110 shadow-md ring-2 ring-amber-300'
                            : 'bg-slate-200 text-slate-500 border-slate-300'
                        }`}
                      >
                        {cp}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {islandQuestion.answers.map((ans) => {
                      const isCorrect = ans.id === islandQuestion.correctAnswerId && answerResult === 'correct';
                      const isWrong = ans.id === selectedAnswerId && answerResult === 'wrong';

                      return (
                        <button
                          key={ans.id}
                          onClick={() => handleTreasureAnswer(ans.id)}
                          className={`p-3.5 rounded-2xl font-black text-sm flex items-center justify-between cursor-pointer transition min-h-[58px] border-2 group ${
                            isCorrect
                              ? 'bg-emerald-100 border-emerald-500 text-emerald-950 scale-102 shadow-md ring-2 ring-emerald-300'
                              : isWrong
                              ? 'bg-rose-100 border-rose-500 text-rose-950 animate-shake'
                              : 'bg-white hover:bg-yellow-50 border-slate-200 hover:border-yellow-400 text-slate-950 active:scale-95 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center p-1 group-hover:scale-110 transition-transform shrink-0">
                              <KidsIllustration name={ans.text} className="w-full h-full object-contain" />
                            </div>
                            <div className="text-left">
                              <p className="font-black text-sm text-slate-950">{ans.textVi}</p>
                              <p className="text-xs font-bold text-slate-600">({ans.text})</p>
                            </div>
                          </div>
                          {isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 11: SOUND DETECTIVE                                  */}
              {/* ========================================================= */}
              {activeGameId === 'sound_detective' && (
                <div className="space-y-6">
                  <div className="kids-game-text-area text-center space-y-2">
                    <span className="px-3 py-1 rounded-full bg-cyan-100 border border-cyan-300 text-xs font-black text-cyan-950">
                      Lắng nghe âm thanh kỳ bí
                    </span>
                    <h3 className="text-2xl font-black text-slate-950">
                      Bé vừa nghe thấy âm thanh của từ nào?
                    </h3>
                    <button
                      onClick={() => {
                        soundManager.playDing();
                        voiceService.speakWord(detectiveTarget.word);
                      }}
                      className="px-6 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white font-black text-xs inline-flex items-center gap-2 border-b-2 border-cyan-700 active:scale-95 cursor-pointer min-h-[40px]"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Nghe lại âm thanh</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {detectiveChoices.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleDetectiveChoice(item)}
                        className="p-5 rounded-3xl bg-white hover:bg-cyan-50 border-2 border-slate-200 hover:border-cyan-400 flex flex-col items-center justify-center gap-2 active:scale-95 transition cursor-pointer min-h-[140px] shadow-xs group"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                          <KidsIllustration name={item.word} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-xl font-black text-slate-950">{item.word}</span>
                        <span className="text-xs font-bold text-slate-600">({item.viMeaning})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 12: SPEAK & REPEAT                                   */}
              {/* ========================================================= */}
              {activeGameId === 'speak_repeat' && (
                <div className="space-y-6 text-center">
                  <div className="kids-game-text-area space-y-1">
                    <span className="px-3 py-1 rounded-full bg-violet-100 border border-violet-300 text-xs font-black text-violet-950">
                      Luyện nói theo mẫu
                    </span>
                    <h3 className="text-2xl font-black text-slate-950 mt-1">
                      Đọc to từ vựng:{' '}
                      <span className="text-violet-600 underline">{speakTarget.word}</span>
                    </h3>
                    <p className="text-sm font-bold text-slate-600">({speakTarget.viMeaning})</p>
                  </div>

                  <div className="kids-game-canvas-area bg-violet-50 p-6 flex flex-col items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-violet-200 border-4 border-violet-400 flex items-center justify-center text-violet-700 animate-gentle-float">
                      <Mic className="w-12 h-12" />
                    </div>
                    {speakFeedbackText && (
                      <p className="text-sm font-black text-slate-900 mt-3">{speakFeedbackText}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => voiceService.speakWord(speakTarget.word)}
                      className="px-6 py-3 rounded-2xl bg-sky-100 hover:bg-sky-200 text-sky-950 font-black text-xs flex items-center gap-2 border border-sky-300 cursor-pointer min-h-[48px] active:scale-95"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Nghe lại mẫu</span>
                    </button>

                    <button
                      onClick={handleStartVoiceRepeat}
                      disabled={speakState === 'listening'}
                      className="px-8 py-3 rounded-2xl bg-violet-500 hover:bg-violet-600 text-white font-black text-sm flex items-center gap-2 border-b-4 border-violet-700 cursor-pointer min-h-[48px] active:scale-95 shadow-md"
                    >
                      <Mic className="w-5 h-5" />
                      <span>{speakState === 'listening' ? 'Đang lắng nghe...' : 'BẤM ĐỂ ĐỌC'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* CELEBRATION NEXT ROUND BUTTON WITH WOW EFFECT */}
              {roundCompleted && !showGameWinModal && (
                <div className="p-5 rounded-3xl bg-emerald-50 border-2 border-emerald-400 text-center space-y-3 animate-fadeIn my-4 shadow-sm">
                  <p className="text-emerald-950 font-black text-lg flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <span>{roundPraise?.vi || 'Xuất sắc! Bé làm chuẩn rồi!'}</span>
                  </p>
                  <button
                    onClick={goToNextRound}
                    className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-base border-b-4 border-emerald-700 active:scale-95 transition flex items-center justify-center gap-2 mx-auto cursor-pointer animate-bounce min-h-[48px] shadow-sm"
                  >
                    <span>VÒNG TIẾP THEO</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* VICTORY MODAL */}
      {showGameWinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full p-8 rounded-3xl bg-white border-4 border-amber-400 text-center space-y-5 animate-scale-up shadow-2xl">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-400 flex items-center justify-center border-2 border-amber-500 text-amber-950">
              <Award className="w-12 h-12" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-950 flex items-center justify-center gap-2">
                <span>Chiến Thắng Xuất Sắc!</span>
                <Sparkles className="w-6 h-6 text-amber-500" />
              </h2>
              <p className="text-sm font-bold text-slate-600 mt-1">{winMessage.vi}</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-center gap-2 text-amber-950 font-black text-sm">
              <span>Bé nhận được: +{activeGameDef.starsAwarded} Ngôi Sao & +{activeGameDef.xpAwarded} XP!</span>
              <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleStartGame}
                className="flex-1 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-sm border-b-2 border-amber-600 active:scale-95 cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Chơi Lại</span>
              </button>
              <button
                onClick={() => navigate('/kids/world')}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm border-b-2 border-emerald-700 active:scale-95 cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Compass className="w-4 h-4" />
                <span>Về Đảo Của Bé</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KidsGamesPage;
