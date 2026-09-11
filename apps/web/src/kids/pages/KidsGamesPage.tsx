import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { soundManager, kidsSound } from '../services/sound/KidsSoundManager';
import { kidsAudioManager } from '../services/audio/KidsAudioManager';
import { voiceService } from '../services/voice/voiceService';
import { celebrationManager } from '../services/celebration/CelebrationManager';
import { getKidsProgress, updateKidsProgress } from '../curriculum/curriculumProgress';
import { KIDS_GAMES_REGISTRY, GameId, GameDefinition } from '../data/games/gamesRegistry';
import { GAME_THEMES } from '../data/games/gameThemes';
import { GameCard } from '../components/GameCard';
import { KidsIllustration } from '../assets/illustrations/KidsIllustration';
import { COMPREHENSIVE_VOCABULARY, VocabularyItem } from '../data/vocabulary/vocabularyData';
import {
  Play,
  RotateCcw,
  Volume2,
  Lock,
  Unlock,
  Star,
  Sparkles,
  Heart,
  Award,
  ArrowRight,
  Flame,
  ArrowLeft,
  Grid,
} from 'lucide-react';

export const KidsGamesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialGameParam = searchParams.get('game') as GameId | null;

  // Active Game State
  const [activeGameId, setActiveGameId] = useState<GameId | null>(initialGameParam || null);
  const [gameStarted, setGameStarted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // HUD & Multi-Round Progression (5 rounds per game session)
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

  // Victory Dialog (Strict Section 28 Standard: MISSION COMPLETE, ⭐⭐⭐, +50 XP, Great job!)
  const [showGameWinModal, setShowGameWinModal] = useState(false);
  const [winMessage, setWinMessage] = useState({ en: 'Great job!', vi: 'Giỏi lắm!' });

  const activeGameDef = KIDS_GAMES_REGISTRY.find((g) => g.id === activeGameId) || KIDS_GAMES_REGISTRY[0];
  const activeTheme = activeGameId ? GAME_THEMES[activeGameId] : GAME_THEMES.balloon_pop;

  // Handle URL param changes
  useEffect(() => {
    if (initialGameParam && KIDS_GAMES_REGISTRY.some((g) => g.id === initialGameParam)) {
      setActiveGameId(initialGameParam);
    }
  }, [initialGameParam]);

  const handleSelectGame = (gameId: GameId) => {
    soundManager.playPop();
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveGameId(gameId);
      setSearchParams({ game: gameId });
      setShowGameWinModal(false);
      setRoundCompleted(false);
      setRoundPraise(null);
      setCurrentRound(1);
      setRoundScore(0);
      setLives(3);
      setStreak(0);
      setSelectedAnswerId(null);
      setAnswerResult(null);
      setGameStarted(false);
      setIsTransitioning(false);
    }, 200);
  };

  const handleBackToCatalog = () => {
    soundManager.playWhoosh();
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveGameId(null);
      setGameStarted(false);
      setShowGameWinModal(false);
      setSearchParams({});
      kidsAudioManager.playGameAmbience('world');
      setIsTransitioning(false);
    }, 200);
  };

  const handleStartGame = () => {
    if (!activeGameId) return;
    soundManager.playDing();
    setIsTransitioning(true);

    // Map games to authentic soundscapes
    if (activeGameId === 'animal_rescue') kidsAudioManager.playGameAmbience('forest');
    else if (activeGameId === 'treasure_island') kidsAudioManager.playGameAmbience('island');
    else if (activeGameId === 'feed_animal') kidsAudioManager.playGameAmbience('kitchen');
    else kidsAudioManager.playGameAmbience('world');

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
        triggerVictory('Mission Complete!', 'Xuất sắc! Bé đã hoàn thành trọn vẹn 5 vòng thử thách!');
      }, 1300);
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
    if (activeGameId) {
      initRoundForGame(activeGameId, nextR);
    }
  };

  // ================================================================
  // 1. BALLOON POP (TIMING & REFLEX PHYSICS)
  // ================================================================
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
      kidsSound.play('pop');
      setBalloons((prev) => prev.map((item) => (item.id === b.id ? { ...item, popped: true } : item)));
      voiceService.speakWord(b.word);
      triggerCorrectAnswer({ en: `Pop! That's ${b.word}!`, vi: `BÙM! Bé bắn nổ bóng ${b.word} cực chuẩn!` }, b.id);
    } else {
      triggerWrongAnswer('Chưa đúng rồi bé ơi! Chọn bóng khác nhé!', b.id);
    }
  };

  // ================================================================
  // 2. TRAIN SENTENCE BUILDER (CONSTRUCTION: 1 LOCOMOTIVE + N CARRIAGES)
  // Strict Sections 18-22: Dynamic carriages = sentenceSegments.length!
  // ================================================================
  interface TrainSentenceChallenge {
    id: string;
    contextEn: string;
    contextVi: string;
    destinationIcon: string;
    destinationName: string;
    words: string[];
    fullSentenceEn: string;
    fullSentenceVi: string;
  }

  const TRAIN_CHALLENGES: TrainSentenceChallenge[] = [
    {
      id: 't-1',
      contextEn: "Let's go to school!",
      contextVi: 'Chúng mình cùng đi học nào!',
      destinationIcon: '🏫',
      destinationName: 'School (Trường Học)',
      words: ['I', 'go', 'to', 'school'],
      fullSentenceEn: 'I go to school.',
      fullSentenceVi: 'Bé đi đến trường học.',
    },
    {
      id: 't-2',
      contextEn: 'Visiting the fruit garden!',
      contextVi: 'Ghé thăm vườn cây ăn quả nhé!',
      destinationIcon: '🍎',
      destinationName: 'Fruit Garden (Vườn Táo)',
      words: ['I', 'like', 'sweet', 'apples'],
      fullSentenceEn: 'I like sweet apples.',
      fullSentenceVi: 'Bé thích những quả táo ngọt.',
    },
    {
      id: 't-3',
      contextEn: 'Visiting our playful kitten!',
      contextVi: 'Thăm bạn mèo con tinh nghịch!',
      destinationIcon: '🐱',
      destinationName: 'Pet House (Nhà Thú Cưng)',
      words: ['The', 'cat', 'is', 'cute'],
      fullSentenceEn: 'The cat is cute.',
      fullSentenceVi: 'Chú mèo con thật dễ thương.',
    },
    {
      id: 't-4',
      contextEn: 'A bright sunny morning!',
      contextVi: 'Một buổi sáng chan hòa ánh nắng!',
      destinationIcon: '☀️',
      destinationName: 'Sunny Park (Công Viên)',
      words: ['The', 'sun', 'is', 'bright'],
      fullSentenceEn: 'The sun is bright.',
      fullSentenceVi: 'Mặt trời tỏa nắng rực rỡ.',
    },
    {
      id: 't-5',
      contextEn: 'Happy playground adventure!',
      contextVi: 'Cùng nhau vui chơi thỏa thích!',
      destinationIcon: '🎈',
      destinationName: 'Playground (Khu Vui Chơi)',
      words: ['We', 'play', 'together', 'happily'],
      fullSentenceEn: 'We play together happily.',
      fullSentenceVi: 'Chúng mình cùng vui chơi hòa thuận.',
    },
  ];

  const [trainChallenge, setTrainChallenge] = useState<TrainSentenceChallenge>(TRAIN_CHALLENGES[0]);
  const [trainPlacedWords, setTrainPlacedWords] = useState<string[]>([]);
  const [trainTrayWords, setTrainTrayWords] = useState<string[]>([]);
  const [trainDeparting, setTrainDeparting] = useState(false);
  const [trainWobble, setTrainWobble] = useState(false);

  const initTrainRound = (roundNum: number) => {
    setTrainDeparting(false);
    setTrainWobble(false);
    const challengeIndex = (roundNum - 1) % TRAIN_CHALLENGES.length;
    const challenge = TRAIN_CHALLENGES[challengeIndex];
    setTrainChallenge(challenge);
    setTrainPlacedWords([]);
    // Scramble words for the tray
    setTrainTrayWords([...challenge.words].sort(() => 0.5 - Math.random()));

    setTimeout(() => {
      voiceService.speakVietnamese(
        `Đoàn tàu sắp đi đến ${challenge.destinationName}. Bé hãy gắn các toa từ để ghép câu: "${challenge.fullSentenceVi}" nhé!`
      );
    }, 250);
  };

  const handleAttachWordToTrain = (word: string, trayIndex: number) => {
    if (trainDeparting || roundCompleted) return;
    soundManager.playPop();

    // Add to next carriage slot
    const newPlaced = [...trainPlacedWords, word];
    setTrainPlacedWords(newPlaced);

    // Remove from tray
    const newTray = [...trainTrayWords];
    newTray.splice(trayIndex, 1);
    setTrainTrayWords(newTray);

    // Speak the placed word
    voiceService.speakWord(word);

    // Check when all dynamic carriages are filled
    if (newPlaced.length === trainChallenge.words.length) {
      if (newPlaced.join(' ') === trainChallenge.words.join(' ')) {
        // Correct Sentence Order!
        setTrainDeparting(true);
        soundManager.playTrainWhistle();
        voiceService.speakBilingual(trainChallenge.fullSentenceEn, trainChallenge.fullSentenceVi);
        triggerCorrectAnswer({
          en: `Train Complete! ${trainChallenge.fullSentenceEn}`,
          vi: `Tu tu xình xịch! Đoàn tàu đã khởi hành đến ${trainChallenge.destinationName}!`,
        });
      } else {
        // Wrong Order: Shake carriages gently, gentle buzz, no crash (Section 21)
        setTrainWobble(true);
        soundManager.playIncorrect();
        voiceService.speakVietnamese('Toa tàu chưa đúng thứ tự rồi! Bé xếp lại nhé!');
        setTimeout(() => {
          setTrainWobble(false);
          setTrainPlacedWords([]);
          setTrainTrayWords([...trainChallenge.words].sort(() => 0.5 - Math.random()));
        }, 1100);
      }
    }
  };

  const handleRemoveWordFromCarriage = (index: number) => {
    if (trainDeparting || roundCompleted) return;
    soundManager.playWhoosh();
    const removedWord = trainPlacedWords[index];
    const newPlaced = [...trainPlacedWords];
    newPlaced.splice(index, 1);
    setTrainPlacedWords(newPlaced);
    setTrainTrayWords((prev) => [...prev, removedWord]);
  };

  // ================================================================
  // 3. FEED THE ANIMAL (SIMULATION & NUTRITION)
  // ================================================================
  interface FeedState {
    animal: string;
    animalVi: string;
    food: string;
    foodVi: string;
    wrongFoods: { name: string; nameVi: string }[];
  }
  const [feedState, setFeedState] = useState<FeedState>({
    animal: 'Cat',
    animalVi: 'Chú Mèo',
    food: 'Fish',
    foodVi: 'Cá biển',
    wrongFoods: [
      { name: 'Banana', nameVi: 'Quả chuối' },
      { name: 'Carrot', nameVi: 'Củ cà rốt' },
    ],
  });
  const [animalFed, setAnimalFed] = useState(false);

  const initFeedRound = () => {
    setAnimalFed(false);
    const feedScenarios: FeedState[] = [
      {
        animal: 'Cat',
        animalVi: 'Mèo con',
        food: 'Fish',
        foodVi: 'Cá tươi',
        wrongFoods: [
          { name: 'Banana', nameVi: 'Quả chuối' },
          { name: 'Carrot', nameVi: 'Củ cà rốt' },
        ],
      },
      {
        animal: 'Rabbit',
        animalVi: 'Thỏ trắng',
        food: 'Carrot',
        foodVi: 'Củ cà rốt',
        wrongFoods: [
          { name: 'Fish', nameVi: 'Con cá' },
          { name: 'Bone', nameVi: 'Khúc xương' },
        ],
      },
      {
        animal: 'Monkey',
        animalVi: 'Khỉ nâu',
        food: 'Banana',
        foodVi: 'Quả chuối',
        wrongFoods: [
          { name: 'Fish', nameVi: 'Con cá' },
          { name: 'Cheese', nameVi: 'Phô mai' },
        ],
      },
      {
        animal: 'Dog',
        animalVi: 'Cún cưng',
        food: 'Bone',
        foodVi: 'Khúc xương',
        wrongFoods: [
          { name: 'Apple', nameVi: 'Quả táo' },
          { name: 'Milk', nameVi: 'Sữa tươi' },
        ],
      },
    ];
    const picked = feedScenarios[Math.floor(Math.random() * feedScenarios.length)];
    setFeedState(picked);

    setTimeout(() => {
      voiceService.speakVietnamese(
        `Bạn ${picked.animalVi} đang đói bụng! Bé đút món ${picked.foodVi} cho bạn ấy nhé!`
      );
    }, 200);
  };

  const handleFeedFood = (foodName: string) => {
    if (animalFed || roundCompleted) return;
    if (foodName === feedState.food) {
      setAnimalFed(true);
      soundManager.playDing();
      voiceService.speakBilingual(
        `${feedState.animal} loves ${feedState.food}!`,
        `${feedState.animalVi} no nê rồi! Món ${feedState.foodVi} ngon tuyệt!`
      );
      triggerCorrectAnswer({
        en: `Yummy! ${feedState.animal} ate ${feedState.food}!`,
        vi: `Bé chăm sóc giỏi quá! ${feedState.animalVi} đã ăn no rồi!`,
      });
    } else {
      triggerWrongAnswer(`Bạn ${feedState.animalVi} không ăn món này đâu, bé chọn món khác nhé!`);
    }
  };

  // ================================================================
  // 4. MATCH CARDS (3D MEMORY CARD PAIR MATCHING)
  // ================================================================
  interface MemoryCard {
    cardId: number;
    text: string;
    textVi: string;
    matchKey: string;
    isFlipped: boolean;
    isMatched: boolean;
  }
  const [memoryDeck, setMemoryDeck] = useState<MemoryCard[]>([]);
  const [flippedCardIndices, setFlippedCardIndices] = useState<number[]>([]);

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
    setMemoryDeck(deck.sort(() => 0.5 - Math.random()));
    setFlippedCardIndices([]);

    setTimeout(() => {
      voiceService.speakVietnamese('Lật mở các thẻ bài và tìm các cặp từ vựng trùng khớp nhé!');
    }, 200);
  };

  const handleFlipMemoryCard = (index: number) => {
    if (
      flippedCardIndices.length === 2 ||
      memoryDeck[index].isFlipped ||
      memoryDeck[index].isMatched ||
      roundCompleted
    )
      return;

    soundManager.playWhoosh();
    voiceService.speakEnglish(memoryDeck[index].text);

    const updated = [...memoryDeck];
    updated[index].isFlipped = true;
    setMemoryDeck(updated);

    const newFlipped = [...flippedCardIndices, index];
    setFlippedCardIndices(newFlipped);

    if (newFlipped.length === 2) {
      const [i1, i2] = newFlipped;
      if (updated[i1].matchKey === updated[i2].matchKey) {
        soundManager.playDing();
        updated[i1].isMatched = true;
        updated[i2].isMatched = true;
        setMemoryDeck([...updated]);
        setFlippedCardIndices([]);
        if (updated.every((c) => c.isMatched)) {
          triggerCorrectAnswer({ en: 'Matched All Pairs!', vi: 'Xuất sắc! Bé đã ghép đúng toàn bộ thẻ!' });
        }
      } else {
        setTimeout(() => {
          updated[i1].isFlipped = false;
          updated[i2].isFlipped = false;
          setMemoryDeck([...updated]);
          setFlippedCardIndices([]);
        }, 900);
      }
    }
  };

  // ================================================================
  // 5. ANIMAL RESCUE (EXPLORATION & PATH FINDING ADVENTURE)
  // ================================================================
  type RescuePhase = 'lost' | 'footprint' | 'path' | 'gate' | 'home';
  const [rescuePhase, setRescuePhase] = useState<RescuePhase>('lost');
  const [rescueClue, setRescueClue] = useState({
    en: 'A little puppy is lost. Help the puppy get home!',
    vi: 'Chú chó nhỏ bị lạc trong rừng. Bé hãy giúp bạn ấy về nhà nhé!',
  });

  const initRescueRound = () => {
    setRescuePhase('lost');
    setRescueClue({
      en: 'A little puppy is lost. Help the puppy get home!',
      vi: 'Chú chó nhỏ bị lạc trong rừng. Bé hãy giúp bạn ấy về nhà nhé!',
    });
    kidsAudioManager.playGameAmbience('forest');

    setTimeout(() => {
      voiceService.speakBilingual(
        'A little puppy is lost. Help the puppy get home.',
        'Một chú chó nhỏ bị lạc. Hãy giúp chú chó về nhà nhé!'
      );
    }, 250);
  };

  const handleRescueAction = (action: string) => {
    if (roundCompleted) return;

    if (rescuePhase === 'lost') {
      soundManager.playDing();
      setRescuePhase('footprint');
      setRescueClue({
        en: 'Look! Footprints on the meadow! Tap the footprints.',
        vi: 'Nhìn kìa! Có dấu chân trên bãi cỏ! Hãy chạm vào dấu chân để dò đường.',
      });
    } else if (rescuePhase === 'footprint') {
      soundManager.playDing();
      setRescuePhase('path');
      setRescueClue({
        en: 'Three roads ahead! Take the Meadow Road.',
        vi: 'Có 3 ngã rẽ! Bé hãy chọn con đường thảo nguyên xanh "Green Meadow" nhé!',
      });
    } else if (rescuePhase === 'path') {
      if (action === 'meadow') {
        soundManager.playDing();
        setRescuePhase('gate');
        setRescueClue({
          en: 'A wooden gate blocks the path! Find the golden Key.',
          vi: 'Một cánh cổng gỗ đang khóa lối! Hãy chọn chìa khóa "Key" để mở nhé!',
        });
      } else {
        triggerWrongAnswer('Con đường này dẫn vào rừng rậm rồi! Chọn đường thảo nguyên xanh nhé!');
      }
    } else if (rescuePhase === 'gate') {
      if (action === 'key') {
        soundManager.playFanfare();
        setRescuePhase('home');
        triggerCorrectAnswer({
          en: 'Puppy is Home! Safe & Sound!',
          vi: 'Hoan hô! Bé đã dẫn chú chó về tới ngôi nhà ấm áp an toàn!',
        });
      } else {
        triggerWrongAnswer('Đồ vật này không mở được cổng! Bé hãy chọn chìa khóa vàng Key nhé!');
      }
    }
  };

  // ================================================================
  // 6. TREASURE ISLAND (EXPEDITION & COLLECTION)
  // ================================================================
  type IslandStage = 'map' | 'bridge' | 'cave' | 'chest';
  const [islandStep, setIslandStep] = useState<IslandStage>('map');

  const initIslandRound = () => {
    setIslandStep('map');
    kidsAudioManager.playGameAmbience('island');
    setTimeout(() => {
      voiceService.speakVietnamese('Bé hãy mở bản đồ hải tặc và bắt đầu hành trình tìm kho báu nhé!');
    }, 200);
  };

  const handleIslandAction = (step: IslandStage) => {
    if (roundCompleted) return;
    soundManager.playDing();

    if (step === 'map') {
      setIslandStep('bridge');
      voiceService.speakBilingual('Cross the river bridge!', 'Cùng bước qua cây cầu gỗ bắc qua sông nào!');
    } else if (step === 'bridge') {
      setIslandStep('cave');
      voiceService.speakBilingual('Enter the mystic cave and find the key!', 'Tiến vào hang đá bí mật và nhặt chìa khóa vàng!');
    } else if (step === 'cave') {
      setIslandStep('chest');
      voiceService.speakBilingual('Unlock the grand treasure chest!', 'Mở khóa hòm kho báu chứa đầy ngọc quý!');
    } else if (step === 'chest') {
      soundManager.playFanfare();
      triggerCorrectAnswer({
        en: 'Treasure Chest Unlocked! Gold & Diamonds!',
        vi: 'Tuyệt vời! Bé đã mở thành công hòm báu vật trên Đảo Kỳ Bí!',
      });
    }
  };

  // Master Initializer per round
  const initRoundForGame = (gameId: GameId, roundNum: number) => {
    if (gameId === 'balloon_pop') initBalloonRound();
    else if (gameId === 'train_builder') initTrainRound(roundNum);
    else if (gameId === 'feed_animal') initFeedRound();
    else if (gameId === 'match_cards') initMatchCardsRound();
    else if (gameId === 'animal_rescue') initRescueRound();
    else if (gameId === 'treasure_island') initIslandRound();
  };

  return (
    <div className="space-y-6 pb-16 animate-fadeIn select-none">
      {/* ================================================================ */}
      {/* 1. TOP HEADER & HUD BAR                                          */}
      {/* ================================================================ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white border-2 border-amber-300 shadow-sm">
        <div className="flex items-center gap-3">
          {activeGameId ? (
            <button
              onClick={handleBackToCatalog}
              className="h-11 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-950 font-black text-xs sm:text-sm border-2 border-amber-300 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Tất Cả Trò Chơi</span>
            </button>
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-950 shrink-0">
              <Sparkles className="w-6 h-6 text-amber-600" />
            </div>
          )}

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              {activeGameId ? activeGameDef.titleVi : '6 Trò Chơi Trí Tuệ Cho Bé'}
            </h1>
            <p className="text-xs sm:text-sm font-bold text-slate-600">
              {activeGameId
                ? activeGameDef.titleEn
                : 'Trải nghiệm đa dạng: Giải cứu động vật, Đoàn tàu ghép câu, Nuôi thú, Lật thẻ 3D'}
            </p>
          </div>
        </div>

        {/* HUD Live Stats (When actively playing inside a game) */}
        {activeGameId && gameStarted && (
          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            {/* Hearts / Lives */}
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
        )}
      </div>

      {/* ================================================================ */}
      {/* 2. CATALOG VIEW: UNIFIED GAMECARD GRID SYSTEM                    */}
      {/* Strict Section 5-12: Every game uses the standardized GameCard  */}
      {/* ================================================================ */}
      {!activeGameId && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">
              Danh sách trò chơi đã được kiểm duyệt:
            </span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              6 Gameplay Riêng Biệt • Không Trùng Lặp
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {KIDS_GAMES_REGISTRY.map((game) => {
              const theme = GAME_THEMES[game.id];
              return (
                <GameCard
                  key={game.id}
                  game={game}
                  theme={theme}
                  onSelect={handleSelectGame}
                  isSelected={false}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 3. GAME DETAIL / ARENA VIEW                                      */}
      {/* ================================================================ */}
      {activeGameId && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* A. GAME INTRO SCREEN (Section 13: Character, Scene, Bilingual Instructions, [Start]) */}
          {!gameStarted ? (
            <div
              className={`bg-white rounded-3xl p-8 sm:p-12 border-4 ${activeTheme.borderColor} shadow-lg flex flex-col items-center justify-center text-center space-y-6 min-h-[500px] animate-scale-up`}
            >
              {/* Large Character Illustration with playful glow */}
              <div
                className={`w-32 h-32 sm:w-36 sm:h-36 rounded-3xl ${activeTheme.bgLight} border-3 ${activeTheme.borderColor} flex items-center justify-center p-4 shadow-md animate-gentle-float`}
              >
                <KidsIllustration name={activeTheme.illustration} className="w-full h-full object-contain" />
              </div>

              {/* Scenario & Bilingual Goal */}
              <div className="max-w-lg space-y-3">
                <span className={`px-4 py-1.5 rounded-full text-xs font-black border ${activeTheme.badgeStyle}`}>
                  {activeGameDef.category.toUpperCase()} • ĐỘ KHÓ: {activeGameDef.difficultyVi.toUpperCase()}
                </span>

                <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
                  {activeGameDef.titleVi}
                </h2>
                <p className="text-base sm:text-lg font-bold text-amber-700">
                  {activeGameDef.titleEn}
                </p>

                <p className="text-sm sm:text-base font-semibold text-slate-600 leading-relaxed pt-2">
                  {activeGameDef.descriptionVi}
                </p>
              </div>

              {/* Reward Highlights */}
              <div className="flex items-center gap-8 p-4 px-8 rounded-2xl bg-amber-50/80 border-2 border-amber-200">
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-500">Phần Thưởng</p>
                  <p className="text-base font-black text-amber-700">+{activeGameDef.starsAwarded} Sao Vàng</p>
                </div>
                <div className="w-px h-8 bg-amber-200" />
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-500">Kinh Nghiệm</p>
                  <p className="text-base font-black text-emerald-700">+{activeGameDef.xpAwarded} XP</p>
                </div>
              </div>

              {/* Start Game Action */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <button
                  onClick={handleBackToCatalog}
                  className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm border-2 border-slate-300 active:scale-95 cursor-pointer"
                >
                  ← Đổi Trò Chơi Khác
                </button>

                <button
                  onClick={handleStartGame}
                  className={`px-10 py-4 rounded-2xl bg-gradient-to-r ${activeTheme.accentGradient} text-white font-black text-lg sm:text-xl border-b-4 border-black/20 active:scale-95 transition cursor-pointer flex items-center gap-3 shadow-lg hover:shadow-xl animate-bounce min-h-[56px]`}
                >
                  <Play className="w-6 h-6 fill-current" />
                  <span>BẮT ĐẦU CHƠI</span>
                </button>
              </div>
            </div>
          ) : (
            /* B. LIVE GAME ARENA (Dedicated interactive gameplay per mechanic) */
            <div
              className={`bg-white rounded-3xl p-6 sm:p-8 border-4 ${activeTheme.borderColor} shadow-lg space-y-6 animate-fadeIn`}
            >
              {/* ========================================================= */}
              {/* GAME 1: BALLOON POP (Timing & Reflex)                      */}
              {/* ========================================================= */}
              {activeGameId === 'balloon_pop' && (
                <div className="space-y-6">
                  <div className="text-center space-y-1">
                    <span className="px-3.5 py-1 rounded-full bg-rose-100 border border-rose-300 text-xs font-black text-rose-950">
                      Rèn Luyện Phản Xạ Nhanh
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-950 mt-1">
                      Bắn nổ bóng mang chữ:{' '}
                      <span className="text-rose-600 underline">{balloonTarget.word}</span> (
                      {balloonTarget.viMeaning})
                    </h3>
                  </div>

                  <div className="bg-gradient-to-b from-sky-100 via-rose-50 to-amber-50 p-6 sm:p-8 rounded-3xl border-2 border-rose-200 flex items-center justify-center min-h-[300px]">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 w-full max-w-2xl">
                      {balloons.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => handlePopBalloon(b)}
                          disabled={b.popped || roundCompleted}
                          className={`p-4 rounded-3xl flex flex-col items-center justify-center transition-all cursor-pointer select-none relative min-h-[160px] border-3 ${b.borderClass} ${
                            b.popped
                              ? 'animate-balloon-shatter pointer-events-none'
                              : `${b.colorClass} hover:scale-105 active:scale-95 shadow-md animate-balloon-float`
                          }`}
                        >
                          {b.popped && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                              <span className="absolute -top-4 -left-3 text-2xl animate-pop-sparkle">✨</span>
                              <span className="absolute -top-4 -right-3 text-2xl animate-pop-sparkle" style={{ animationDelay: '0.1s' }}>💥</span>
                              <span className="absolute -bottom-3 -left-3 text-2xl animate-pop-sparkle" style={{ animationDelay: '0.15s' }}>⭐</span>
                              <span className="absolute -bottom-3 -right-3 text-2xl animate-pop-sparkle" style={{ animationDelay: '0.2s' }}>🎉</span>
                            </div>
                          )}

                          <div className="w-14 h-14 rounded-full bg-white/30 backdrop-blur-xs flex items-center justify-center p-2 mb-2 shadow-inner">
                            <KidsIllustration name={b.word} className="w-full h-full object-contain" />
                          </div>
                          <span className="text-xl sm:text-2xl font-black text-white drop-shadow">
                            {b.word}
                          </span>
                          <span className="text-xs font-bold text-white/90">({b.viMeaning})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 2: TRAIN SENTENCE BUILDER                            */}
              {/* Strict Sections 18-22: Locomotive + Dynamic Carriages      */}
              {/* ========================================================= */}
              {activeGameId === 'train_builder' && (
                <div className="space-y-6">
                  {/* Target Goal Banner */}
                  <div className="text-center space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-orange-100 border border-orange-300 text-xs font-black text-orange-950">
                      <span>Điểm đến: {trainChallenge.destinationIcon} {trainChallenge.destinationName}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-950">
                      Gắn toa tàu để ghép câu: "{trainChallenge.fullSentenceVi}"
                    </h3>
                  </div>

                  {/* Train Railway Scene */}
                  <div className="relative bg-gradient-to-b from-sky-100 via-amber-50 to-emerald-50 rounded-3xl p-6 sm:p-8 border-2 border-orange-200 overflow-hidden min-h-[280px]">
                    {/* Destination Station Flag */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-2xl border border-orange-300 shadow-xs">
                      <span className="text-xl">{trainChallenge.destinationIcon}</span>
                      <span className="text-xs font-black text-slate-800">{trainChallenge.destinationName}</span>
                    </div>

                    {/* TRAIN ASSEMBLY LINE */}
                    <div
                      className={`flex items-end gap-2 overflow-x-auto pb-6 pt-12 transition-transform duration-1000 ${
                        trainDeparting ? 'animate-train-depart' : trainWobble ? 'animate-carriage-wobble' : ''
                      }`}
                    >
                      {/* LOCOMOTIVE ENGINE (Section 18-20) */}
                      <div className="shrink-0 flex flex-col items-center">
                        {/* Smoke Puffs when running */}
                        <div className="h-8 flex items-center justify-center">
                          {trainDeparting && (
                            <div className="flex gap-1 animate-smoke-puff">
                              <span className="text-lg">💨</span>
                              <span className="text-xl">💨</span>
                            </div>
                          )}
                        </div>

                        {/* Engine Cabin SVG */}
                        <div className="w-28 sm:w-32 h-24 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 border-3 border-amber-400 p-2 shadow-md relative flex flex-col justify-between text-white">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-black">🚂</span>
                            <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded">
                              ENGINE
                            </span>
                          </div>
                          <div className="text-center font-black text-xs">ĐẦU MÁY</div>
                          {/* Wheels */}
                          <div className="flex justify-around -mb-4">
                            <div
                              className={`w-6 h-6 rounded-full bg-slate-900 border-2 border-amber-300 ${
                                trainDeparting ? 'animate-wheel-spin' : ''
                              }`}
                            />
                            <div
                              className={`w-6 h-6 rounded-full bg-slate-900 border-2 border-amber-300 ${
                                trainDeparting ? 'animate-wheel-spin' : ''
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* DYNAMIC WORD CARRIAGES (Section 20: sentenceSegments.length === trainCars.length) */}
                      {trainChallenge.words.map((_, index) => {
                        const wordPlaced = trainPlacedWords[index];
                        return (
                          <div key={index} className="shrink-0 flex items-end">
                            {/* Coupler link */}
                            <div className="w-4 h-1.5 bg-amber-700 rounded-full mx-0.5 mb-8" />

                            {/* Carriage cart */}
                            <div className="flex flex-col items-center">
                              <div className="h-8" />
                              <div
                                onClick={() => wordPlaced && handleRemoveWordFromCarriage(index)}
                                className={`w-24 sm:w-28 h-24 rounded-2xl border-3 transition-all flex flex-col items-center justify-center p-2 relative shadow-md select-none ${
                                  wordPlaced
                                    ? 'bg-amber-400 border-amber-500 text-slate-950 scale-100 cursor-pointer hover:bg-amber-300'
                                    : 'bg-white/80 border-dashed border-orange-300 text-slate-400'
                                }`}
                              >
                                {wordPlaced ? (
                                  <>
                                    <span className="text-lg sm:text-xl font-black">{wordPlaced}</span>
                                    <span className="text-[10px] font-bold text-amber-900">Toa {index + 1} (Chạm gỡ)</span>
                                  </>
                                ) : (
                                  <span className="text-xs font-bold text-orange-400">Toa {index + 1} (Chờ từ)</span>
                                )}

                                {/* Wheels */}
                                <div className="flex justify-around w-full -mb-4 absolute -bottom-3">
                                  <div
                                    className={`w-5 h-5 rounded-full bg-slate-800 border-2 border-amber-300 ${
                                      trainDeparting ? 'animate-wheel-spin' : ''
                                    }`}
                                  />
                                  <div
                                    className={`w-5 h-5 rounded-full bg-slate-800 border-2 border-amber-300 ${
                                      trainDeparting ? 'animate-wheel-spin' : ''
                                    }`}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Railway Tracks */}
                    <div className="w-full h-3 bg-amber-900/60 rounded-full mt-2 relative">
                      <div className="absolute inset-0 flex justify-between px-2">
                        {Array.from({ length: 24 }).map((_, i) => (
                          <div key={i} className="w-1.5 h-full bg-amber-950/40" />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* WORD BLOCKS TRAY (Tap to place into carriages) */}
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase text-slate-500 text-center">
                      Chạm vào khối từ để gắn lên toa tàu:
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {trainTrayWords.map((word, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAttachWordToTrain(word, idx)}
                          disabled={trainDeparting || roundCompleted}
                          className="px-6 py-3.5 rounded-2xl bg-white hover:bg-orange-100 text-slate-950 font-black text-lg border-2 border-orange-300 hover:border-orange-500 shadow-sm active:scale-95 cursor-pointer transition-all min-h-[50px]"
                        >
                          {word}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 3: FEED THE ANIMAL (Simulation & Nutrition)          */}
              {/* ========================================================= */}
              {activeGameId === 'feed_animal' && (
                <div className="space-y-6">
                  <div className="text-center space-y-1">
                    <span className="px-3.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-xs font-black text-amber-950">
                      Chăm Sóc & Nuôi Thú Cưng
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-950 mt-1">
                      {feedState.animalVi} ({feedState.animal}) thích ăn món gì?
                    </h3>
                  </div>

                  <div className="bg-amber-50 rounded-3xl p-8 flex flex-col items-center justify-center border-2 border-amber-200">
                    <div className="w-36 h-36 rounded-3xl bg-amber-100/90 border-3 border-amber-300 flex items-center justify-center p-4 shadow-md">
                      <KidsIllustration
                        name={feedState.animal.toLowerCase()}
                        className={`w-full h-full object-contain ${
                          animalFed ? 'animate-animal-eat' : 'animate-animal-breathe'
                        }`}
                      />
                    </div>
                    <p className="font-black text-lg text-slate-900 mt-3">
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
                          className="p-5 rounded-2xl bg-white hover:bg-emerald-50 text-slate-950 font-black text-base border-2 border-amber-300 hover:border-emerald-500 active:scale-95 transition cursor-pointer min-h-[100px] flex flex-col items-center justify-center gap-1 shadow-sm group"
                        >
                          <div className="w-14 h-14 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center p-1.5 group-hover:scale-110 transition-transform">
                            <KidsIllustration name={f.name.toLowerCase()} className="w-full h-full object-contain" />
                          </div>
                          <span className="font-black text-lg text-slate-950">{f.name}</span>
                          <span className="text-xs font-bold text-slate-600">({f.nameVi})</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 4: MATCH CARDS (3D Memory Pair Matching)            */}
              {/* ========================================================= */}
              {activeGameId === 'match_cards' && (
                <div className="space-y-6">
                  <div className="text-center space-y-1">
                    <span className="px-3.5 py-1 rounded-full bg-purple-100 border border-purple-300 text-xs font-black text-purple-950">
                      Rèn Luyện Trí Nhớ 3D
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-950 mt-1">
                      Lật các tấm thẻ để tìm cặp từ trùng khớp!
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-xl mx-auto">
                    {memoryDeck.map((card, idx) => (
                      <div
                        key={card.cardId}
                        onClick={() => handleFlipMemoryCard(idx)}
                        className={`kids-flip-card h-36 rounded-2xl cursor-pointer select-none ${
                          card.isMatched ? 'opacity-90 ring-4 ring-emerald-400' : ''
                        }`}
                      >
                        <div className={`kids-flip-inner ${card.isFlipped || card.isMatched ? 'is-flipped' : ''}`}>
                          {/* Front (Hidden Face) */}
                          <div className="kids-flip-front bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl border-3 border-purple-300 flex items-center justify-center text-white text-3xl font-black shadow-md">
                            <span>✨</span>
                          </div>

                          {/* Back (Revealed Content) */}
                          <div className="kids-flip-back bg-white rounded-2xl border-3 border-purple-400 flex flex-col items-center justify-center p-3 text-center shadow-md">
                            <span className="text-xl font-black text-slate-950">{card.text}</span>
                            <span className="text-xs font-bold text-purple-700 mt-1">({card.textVi})</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 5: ANIMAL RESCUE (Exploration & Path Finding)        */}
              {/* ========================================================= */}
              {activeGameId === 'animal_rescue' && (
                <div className="space-y-6">
                  <div className="text-center space-y-1">
                    <span className="px-3.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-xs font-black text-emerald-950">
                      Hành Trình Khám Phá Thung Lũng
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-950 mt-1">
                      {rescueClue.vi}
                    </h3>
                  </div>

                  <div className="relative bg-emerald-50 rounded-3xl p-8 border-2 border-emerald-200 flex flex-col items-center justify-center text-center space-y-5 min-h-[280px]">
                    <div className="w-32 h-32 rounded-3xl bg-white border-2 border-emerald-300 flex items-center justify-center p-4 shadow-sm">
                      <KidsIllustration
                        name={rescuePhase === 'home' ? 'dog' : 'dog'}
                        className={`w-full h-full object-contain ${
                          rescuePhase === 'home' ? 'animate-bounce' : 'animate-animal-breathe'
                        }`}
                      />
                    </div>

                    {/* Stage 1: Lost Puppy */}
                    {rescuePhase === 'lost' && (
                      <button
                        onClick={() => handleRescueAction('find')}
                        className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-base border-b-4 border-emerald-700 shadow-md active:scale-95 cursor-pointer animate-bounce"
                      >
                        🐾 Đi tìm dấu chân chú chó!
                      </button>
                    )}

                    {/* Stage 2: Footprints */}
                    {rescuePhase === 'footprint' && (
                      <button
                        onClick={() => handleRescueAction('footprints')}
                        className="px-8 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-base border-b-4 border-amber-600 shadow-md active:scale-95 cursor-pointer animate-bounce"
                      >
                        🐾 Chạm vào dấu chân để đi tiếp!
                      </button>
                    )}

                    {/* Stage 3: Three Paths */}
                    {rescuePhase === 'path' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
                        <button
                          onClick={() => handleRescueAction('forest')}
                          className="p-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-black text-sm border-2 border-slate-300 active:scale-95 cursor-pointer"
                        >
                          🌲 Rừng Tối (Dark Forest)
                        </button>
                        <button
                          onClick={() => handleRescueAction('meadow')}
                          className="p-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm border-b-4 border-emerald-700 shadow-md active:scale-95 cursor-pointer ring-2 ring-emerald-300"
                        >
                          🌿 Thảo Nguyên (Green Meadow)
                        </button>
                        <button
                          onClick={() => handleRescueAction('swamp')}
                          className="p-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-black text-sm border-2 border-slate-300 active:scale-95 cursor-pointer"
                        >
                          🌊 Đầm Lầy (Muddy Swamp)
                        </button>
                      </div>
                    )}

                    {/* Stage 4: Wooden Gate & Key */}
                    {rescuePhase === 'gate' && (
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleRescueAction('stick')}
                          className="px-6 py-3 rounded-2xl bg-white border-2 border-slate-300 text-slate-700 font-black text-sm active:scale-95 cursor-pointer"
                        >
                          Cành cây (Stick)
                        </button>
                        <button
                          onClick={() => handleRescueAction('key')}
                          className="px-8 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-base border-b-4 border-amber-600 shadow-md active:scale-95 cursor-pointer flex items-center gap-2 animate-bounce"
                        >
                          <Unlock className="w-5 h-5" />
                          <span>Chìa Khóa Vàng (Key)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 6: TREASURE ISLAND (Expedition & Collection)         */}
              {/* ========================================================= */}
              {activeGameId === 'treasure_island' && (
                <div className="space-y-6">
                  <div className="text-center space-y-1">
                    <span className="px-3.5 py-1 rounded-full bg-yellow-100 border border-yellow-300 text-xs font-black text-yellow-950">
                      Hành Trình Vượt 4 Trạm Thử Thách
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-950 mt-1">
                      Khám phá bí mật Đảo Hải Tặc!
                    </h3>
                  </div>

                  <div className="relative bg-gradient-to-b from-sky-50 via-amber-50 to-yellow-50 rounded-3xl p-8 border-2 border-yellow-300 flex flex-col items-center justify-center text-center space-y-6 min-h-[300px]">
                    <div className="w-32 h-32 rounded-3xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center p-3 shadow-md">
                      <KidsIllustration name="treasure-chest" className="w-full h-full object-contain animate-gentle-float" />
                    </div>

                    <div className="flex items-center gap-3">
                      {islandStep === 'map' && (
                        <button
                          onClick={() => handleIslandAction('map')}
                          className="px-8 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-base border-b-4 border-amber-600 shadow-md active:scale-95 animate-bounce cursor-pointer"
                        >
                          🗺️ Đọc bản đồ và xuất phát!
                        </button>
                      )}

                      {islandStep === 'bridge' && (
                        <button
                          onClick={() => handleIslandAction('bridge')}
                          className="px-8 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black text-base border-b-4 border-sky-700 shadow-md active:scale-95 animate-bounce cursor-pointer"
                        >
                          🌉 Bước qua cây cầu gỗ bắc qua sông!
                        </button>
                      )}

                      {islandStep === 'cave' && (
                        <button
                          onClick={() => handleIslandAction('cave')}
                          className="px-8 py-3.5 rounded-2xl bg-purple-500 hover:bg-purple-600 text-white font-black text-base border-b-4 border-purple-700 shadow-md active:scale-95 animate-bounce cursor-pointer"
                        >
                          🔑 Nhặt chiếc chìa khóa vàng trong hang đá!
                        </button>
                      )}

                      {islandStep === 'chest' && (
                        <button
                          onClick={() => handleIslandAction('chest')}
                          className="px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black text-lg border-b-4 border-amber-600 shadow-lg active:scale-95 animate-bounce cursor-pointer flex items-center gap-2"
                        >
                          <Sparkles className="w-6 h-6 text-amber-900" />
                          <span>Mở Khóa Hòm Vàng Châu Báu!</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* CELEBRATION NEXT ROUND BUTTON WITH WOW EFFECT */}
              {roundCompleted && !showGameWinModal && (
                <div className="p-5 rounded-3xl bg-emerald-50 border-2 border-emerald-400 text-center space-y-3 animate-fadeIn my-4 shadow-sm">
                  <p className="text-emerald-950 font-black text-lg sm:text-xl flex items-center justify-center gap-2">
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
      )}

      {/* ================================================================ */}
      {/* 4. VICTORY MODAL (Strict Section 28 Standard)                    */}
      {/* MISSION COMPLETE • ⭐ ⭐ ⭐ • +50 XP • Great job! / Giỏi lắm!    */}
      {/* ================================================================ */}
      {showGameWinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full p-8 rounded-3xl bg-white border-4 border-amber-400 text-center space-y-5 animate-scale-up shadow-2xl">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-400 flex items-center justify-center border-2 border-amber-500 text-amber-950 shadow-md">
              <Award className="w-12 h-12" />
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                MISSION COMPLETE
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 mt-2 flex items-center justify-center gap-2">
                <span>Great job!</span>
                <Sparkles className="w-6 h-6 text-amber-500" />
              </h2>
              <p className="text-base font-extrabold text-amber-800 mt-1">Giỏi lắm!</p>
              <p className="text-xs font-bold text-slate-500 mt-1">{winMessage.vi}</p>
            </div>

            {/* 3 Golden Stars */}
            <div className="flex items-center justify-center gap-3 py-1">
              <Star className="w-10 h-10 fill-amber-400 text-amber-500 animate-bounce" />
              <Star className="w-12 h-12 fill-amber-400 text-amber-500 animate-bounce" style={{ animationDelay: '0.1s' }} />
              <Star className="w-10 h-10 fill-amber-400 text-amber-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>

            {/* XP & Rewards */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-center gap-2 text-amber-950 font-black text-sm">
              <span>+{activeGameDef.starsAwarded} Sao Vàng & +{activeGameDef.xpAwarded} XP!</span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleStartGame}
                className="flex-1 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-sm border-b-2 border-amber-600 active:scale-95 cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Chơi Lại</span>
              </button>
              <button
                onClick={handleBackToCatalog}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm border-b-2 border-emerald-700 active:scale-95 cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Grid className="w-4 h-4" />
                <span>Chọn Trò Khác</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KidsGamesPage;
