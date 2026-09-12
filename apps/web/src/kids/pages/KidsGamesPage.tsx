import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { soundManager, kidsSound } from '../services/sound/KidsSoundManager';
import { kidsAudioManager } from '../services/audio/KidsAudioManager';
import { voiceService } from '../services/voice/voiceService';
import { celebrationManager } from '../services/celebration/CelebrationManager';
import { getKidsProgress, updateKidsProgress } from '../curriculum/curriculumProgress';
import { KIDS_GAMES_REGISTRY, GameId, GameDefinition } from '../data/games/gamesRegistry';
import { GAME_THEMES } from '../data/games/gameThemes';
import { GameCard } from '../components/GameCard';
import { GameGuide } from '../components/GameGuide';
import { KidsIllustration } from '../assets/illustrations/KidsIllustration';
import { KidsExplosionFX, ExplosionType } from '../components/KidsExplosionFX';
import { KidsRobot3DViewer } from '../components/KidsRobot3DViewer';
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
  Key,
  Compass,
  Check,
  HelpCircle,
  Cloud,
  Flower2,
  Rocket,
  Sun,
  Cookie,
  Bot,
  BookOpen,
  Scissors,
  Droplets,
  Search,
  Sparkle,
  DoorOpen,
  Hammer,
} from 'lucide-react';
import {
  HeroRobotChest,
  HeroRobotHead,
  HeroRobotArm,
  HeroRobotLeg,
  HeroElephant,
  HeroApple,
  HeroTreasureChest,
} from '../assets/illustrations/KidsHeroAssets';
import { TreasureMapGame } from '../games/treasure-map';
import { AnimalRescueGame } from '../games/animal-rescue';



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

  // Active Multi-Piece Particle Explosion State
  const [activeExplosion, setActiveExplosion] = useState<{
    show: boolean;
    type: ExplosionType;
    fruitName?: string;
  } | null>(null);

  // Victory Dialog
  const [showGameWinModal, setShowGameWinModal] = useState(false);
  const [winMessage, setWinMessage] = useState({ en: 'Great job!', vi: 'Giỏi lắm!' });

  const activeGameDef = KIDS_GAMES_REGISTRY.find((g) => g.id === activeGameId) || KIDS_GAMES_REGISTRY[0];
  const activeTheme = activeGameId ? GAME_THEMES[activeGameId] : GAME_THEMES.balloon_pop;

  // Unified Target Word State
  const [gameTargetWord, setGameTargetWord] = useState<VocabularyItem>(COMPREHENSIVE_VOCABULARY[0]);

  // Game Category Filter State
  const [gameCategoryFilter, setGameCategoryFilter] = useState<'all' | 'vocab' | 'spelling' | 'memory' | 'adventure'>('all');

  const filteredGames = KIDS_GAMES_REGISTRY.filter((game) => {
    if (gameCategoryFilter === 'all') return true;
    if (gameCategoryFilter === 'vocab') {
      return (
        game.id === 'balloon_pop' ||
        game.id === 'feed_animal' ||
        game.id === 'sky_words' ||
        game.id === 'monster_snack_shop'
      );
    }
    if (gameCategoryFilter === 'spelling') {
      return game.id === 'train_builder' || game.id === 'build_my_robot';
    }
    if (gameCategoryFilter === 'memory') {
      return (
        game.id === 'match_cards' ||
        game.id === 'magic_garden' ||
        game.id === 'magic_storybook'
      );
    }
    if (gameCategoryFilter === 'adventure') {
      return (
        game.id === 'animal_rescue' ||
        game.id === 'treasure_island' ||
        game.id === 'space_rescue' ||
        game.id === 'animal_train' ||
        game.id === 'weather_adventure' ||
        game.id === 'dinosaur_dig' ||
        game.id === 'magic_door'
      );
    }

    return true;
  });

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
      setActiveExplosion(null);
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

    if (activeGameId === 'animal_rescue') kidsAudioManager.playGameAmbience('forest');
    else if (activeGameId === 'treasure_island') kidsAudioManager.playGameAmbience('island');
    else if (activeGameId === 'feed_animal' || activeGameId === 'monster_snack_shop') kidsAudioManager.playGameAmbience('kitchen');
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
      setActiveExplosion(null);
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
      }, 1400);
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
    setActiveExplosion(null);
    const nextR = currentRound + 1;
    setCurrentRound(nextR);
    if (activeGameId) {
      initRoundForGame(activeGameId, nextR);
    }
  };

  // ================================================================
  // 1. BALLOON POP (MULTI-PIECE RUBBER SHATTER EXPLOSION)
  // ================================================================
  interface BalloonItem {
    id: string;
    word: string;
    viMeaning: string;
    gradientClass: string;
    knotClass: string;
    borderClass: string;
    colorClass: string;
    popped: boolean;
  }
  const [balloons, setBalloons] = useState<BalloonItem[]>([]);
  const [poppedBalloonId, setPoppedBalloonId] = useState<string | null>(null);

  const initBalloonRound = () => {
    setPoppedBalloonId(null);
    const target = COMPREHENSIVE_VOCABULARY[Math.floor(Math.random() * COMPREHENSIVE_VOCABULARY.length)];
    const others = COMPREHENSIVE_VOCABULARY.filter((v) => v.id !== target.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    const palette = [
      { gradient: 'bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600', knot: 'bg-rose-700', border: 'border-rose-400', bg: 'bg-rose-500' },
      { gradient: 'bg-gradient-to-br from-sky-400 via-sky-500 to-sky-600', knot: 'bg-sky-700', border: 'border-sky-400', bg: 'bg-sky-500' },
      { gradient: 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600', knot: 'bg-amber-700', border: 'border-amber-400', bg: 'bg-amber-500' },
      { gradient: 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600', knot: 'bg-emerald-700', border: 'border-emerald-400', bg: 'bg-emerald-500' },
    ];
    const list: BalloonItem[] = [target, ...others]
      .sort(() => 0.5 - Math.random())
      .map((item, idx) => {
        const p = palette[idx % palette.length];
        return {
          id: item.id,
          word: item.word,
          viMeaning: item.viMeaning,
          gradientClass: p.gradient,
          knotClass: p.knot,
          borderClass: p.border,
          colorClass: p.bg,
          popped: false,
        };
      });
    setGameTargetWord(target);
    setBalloons(list);

    setTimeout(() => {
      voiceService.speakVietnamese(`Bé hãy chạm nổ bóng: ${target.viMeaning}!`, {
        onEnd: () => setTimeout(() => voiceService.speakWord(target.word), 250),
      });
    }, 200);
  };

  const handlePopBalloon = (b: BalloonItem) => {
    if (b.popped || roundCompleted) return;
    if (b.id === gameTargetWord.id) {
      soundManager.play('pop');
      setPoppedBalloonId(b.id);
      setBalloons((prev) => prev.map((item) => (item.id === b.id ? { ...item, popped: true } : item)));
      voiceService.speakWord(b.word);
      triggerCorrectAnswer({ en: `Pop! That's ${b.word}!`, vi: `BÙM! Bóng ${b.word} vỡ tan mảnh!` }, b.id);
    } else {
      soundManager.play('wrong');
      triggerWrongAnswer(`Chưa đúng rồi bé ơi! Chọn bóng mang chữ ${gameTargetWord.viMeaning} nhé!`, b.id);
    }
  };

  // ================================================================
  // 2. TRAIN BUILDER (CONSTRUCTION ON TRACKS WITH MAGNETIC SNAP)
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
      id: 'train_1',
      contextEn: 'Visiting Granny in the countryside',
      contextVi: 'Về quê thăm bà',
      destinationIcon: '🏡',
      destinationName: 'Nhà Bà Ngoại',
      words: ['I', 'love', 'my', 'cat'],
      fullSentenceEn: 'I love my cat',
      fullSentenceVi: 'Bé yêu chú mèo của mình',
    },
    {
      id: 'train_2',
      contextEn: 'Heading to the sunny beach',
      contextVi: 'Đi biển tắm nắng',
      destinationIcon: '🏖️',
      destinationName: 'Bãi Biển Xanh',
      words: ['The', 'sun', 'is', 'yellow'],
      fullSentenceEn: 'The sun is yellow',
      fullSentenceVi: 'Mặt trời màu vàng ấm áp',
    },
    {
      id: 'train_3',
      contextEn: 'Expedition into the safari zoo',
      contextVi: 'Khám phá vườn bách thú',
      destinationIcon: '🦁',
      destinationName: 'Sở Thú Safari',
      words: ['This', 'is', 'a', 'big', 'elephant'],
      fullSentenceEn: 'This is a big elephant',
      fullSentenceVi: 'Đây là một chú voi khổng lồ',
    },
    {
      id: 'train_4',
      contextEn: 'Journey to the fruit orchard',
      contextVi: 'Đi hái quả ngọt',
      destinationIcon: '🍎',
      destinationName: 'Nông Trại Trái Cây',
      words: ['I', 'eat', 'a', 'red', 'apple'],
      fullSentenceEn: 'I eat a red apple',
      fullSentenceVi: 'Bé ăn một quả táo đỏ ngon lành',
    },
  ];

  const [trainChallenge, setTrainChallenge] = useState<TrainSentenceChallenge>(TRAIN_CHALLENGES[0]);
  const [trainPlacedWords, setTrainPlacedWords] = useState<string[]>([]);
  const [trainTrayWords, setTrainTrayWords] = useState<string[]>([]);
  const [trainDeparting, setTrainDeparting] = useState(false);

  const initTrainRound = (roundNum: number) => {
    const ch = TRAIN_CHALLENGES[(roundNum - 1) % TRAIN_CHALLENGES.length];
    setTrainChallenge(ch);
    setTrainPlacedWords([]);
    setTrainTrayWords([...ch.words].sort(() => 0.5 - Math.random()));
    setTrainDeparting(false);
    setGameTargetWord({
      id: ch.id,
      word: ch.fullSentenceEn,
      viMeaning: ch.fullSentenceVi,
    });

    setTimeout(() => {
      voiceService.speakVietnamese(`Lắp toa tàu để ghép câu: "${ch.fullSentenceVi}"!`);
    }, 200);
  };

  const handleAttachWordToTrain = (word: string, trayIdx: number) => {
    if (trainDeparting || roundCompleted) return;
    const nextSlotIdx = trainPlacedWords.length;
    const expectedWord = trainChallenge.words[nextSlotIdx];

    if (word === expectedWord) {
      soundManager.play('robot_snap');
      const newPlaced = [...trainPlacedWords, word];
      setTrainPlacedWords(newPlaced);
      setTrainTrayWords((prev) => prev.filter((_, i) => i !== trayIdx));
      voiceService.speakWord(word);

      if (newPlaced.length === trainChallenge.words.length) {
        soundManager.playTrainWhistle();
        setTrainDeparting(true);
        setActiveExplosion({ show: true, type: 'star' });
        triggerCorrectAnswer({
          en: `All aboard! "${trainChallenge.fullSentenceEn}"!`,
          vi: `Tu tu xình xịch! Đoàn tàu đã ghép hoàn chỉnh câu: "${trainChallenge.fullSentenceVi}"!`,
        });
      }
    } else {
      triggerWrongAnswer(`Chưa đúng thứ tự! Toa tiếp theo cần từ "${expectedWord}" nhé!`);
    }
  };

  // ================================================================
  // 3. FRUIT ORCHARD & GATHERING (IN-WORLD WORD OBJECT & BASKET BOUNCE)
  // ================================================================
  interface OrchardFruit {
    id: string;
    word: string;
    viMeaning: string;
    icon: string;
    top: string;
    left: string;
  }
  const [orchardFruits, setOrchardFruits] = useState<OrchardFruit[]>([]);
  const [basketFruits, setBasketFruits] = useState<string[]>([]);
  const [basketBouncing, setBasketBouncing] = useState(false);

  const initFeedRound = () => {
    const fruitsPool = [
      { id: 'apple', word: 'Apple', viMeaning: 'Quả táo', icon: '🍎' },
      { id: 'banana', word: 'Banana', viMeaning: 'Quả chuối', icon: '🍌' },
      { id: 'orange', word: 'Orange', viMeaning: 'Quả cam', icon: '🍊' },
      { id: 'grape', word: 'Grapes', viMeaning: 'Chùm nho', icon: '🍇' },
    ];
    const target = fruitsPool[Math.floor(Math.random() * fruitsPool.length)];
    const positions = [
      { top: '22%', left: '26%' },
      { top: '18%', left: '62%' },
      { top: '42%', left: '38%' },
      { top: '40%', left: '72%' },
    ];
    const shuffled = [...fruitsPool].sort(() => 0.5 - Math.random()).map((f, idx) => ({
      ...f,
      top: positions[idx].top,
      left: positions[idx].left,
    }));

    setOrchardFruits(shuffled);
    setBasketFruits([]);
    setBasketBouncing(false);
    setGameTargetWord(target);

    setTimeout(() => {
      voiceService.speakVietnamese(`Bé hãy hái quả ${target.viMeaning} ("${target.word}") trên cây bỏ vào giỏ nhé!`, {
        onEnd: () => setTimeout(() => voiceService.speakWord(target.word), 250),
      });
    }, 200);
  };

  const handlePickFruitToBasket = (fruit: OrchardFruit) => {
    if (roundCompleted) return;

    if (fruit.id === gameTargetWord.id) {
      soundManager.play('fruit_pop');
      soundManager.play('spring_bounce');
      setBasketBouncing(true);
      setActiveExplosion({ show: true, type: 'fruit', fruitName: fruit.id });
      setBasketFruits((prev) => [...prev, fruit.icon]);
      setOrchardFruits((prev) => prev.filter((f) => f.id !== fruit.id));
      voiceService.speakWord(fruit.word);

      triggerCorrectAnswer({
        en: `Delicious! Picked the ${fruit.word}!`,
        vi: `Tuyệt vời! Bé đã hái quả ${fruit.viMeaning} ngon ngọt bỏ vào giỏ!`,
      });
    } else {
      triggerWrongAnswer(`Đây là ${fruit.viMeaning} rồi! Bé hãy tìm quả ${gameTargetWord.viMeaning} ("${gameTargetWord.word}") nhé!`, fruit.id);
    }
  };

  // ================================================================
  // 4. PET HOUSE CONTEXTUAL MEMORY (3D SWINGING DOORS & ANIMAL CALLS)
  // ================================================================
  interface PetHouse {
    houseId: string;
    animalId: string;
    nameEn: string;
    nameVi: string;
    icon: string;
    roofColor: string;
    isOpen: boolean;
    isMatched: boolean;
  }
  const [petHouses, setPetHouses] = useState<PetHouse[]>([]);
  const [openHouseIndices, setOpenHouseIndices] = useState<number[]>([]);

  const initMatchCardsRound = () => {
    const animalPairs = [
      { animalId: 'cat', nameEn: 'Cat', nameVi: 'Mèo con', icon: '🐱', roof: 'bg-rose-500' },
      { animalId: 'dog', nameEn: 'Dog', nameVi: 'Cún con', icon: '🐶', roof: 'bg-amber-500' },
      { animalId: 'rabbit', nameEn: 'Rabbit', nameVi: 'Thỏ trắng', icon: '🐰', roof: 'bg-sky-500' },
    ];
    const houses: PetHouse[] = [];
    animalPairs.forEach((a, i) => {
      houses.push({
        houseId: `${a.animalId}_1`,
        animalId: a.animalId,
        nameEn: a.nameEn,
        nameVi: a.nameVi,
        icon: a.icon,
        roofColor: a.roof,
        isOpen: false,
        isMatched: false,
      });
      houses.push({
        houseId: `${a.animalId}_2`,
        animalId: a.animalId,
        nameEn: a.nameEn,
        nameVi: a.nameVi,
        icon: a.icon,
        roofColor: a.roof,
        isOpen: false,
        isMatched: false,
      });
    });
    setPetHouses(houses.sort(() => 0.5 - Math.random()));
    setOpenHouseIndices([]);
    setGameTargetWord({
      id: 'pet_house',
      word: 'Pet House',
      viMeaning: 'Ngôi nhà thú cưng',
    });

    setTimeout(() => {
      voiceService.speakVietnamese('Mỗi ngôi nhà có một bạn thú cưng. Bé hãy gõ cửa để tìm cặp bạn giống nhau nhé!');
    }, 200);
  };

  const handleOpenPetHouse = (idx: number) => {
    if (openHouseIndices.length >= 2 || petHouses[idx].isOpen || petHouses[idx].isMatched) return;
    soundManager.play('click');

    const updated = [...petHouses];
    updated[idx].isOpen = true;
    setPetHouses(updated);

    const newOpen = [...openHouseIndices, idx];
    setOpenHouseIndices(newOpen);

    if (newOpen.length === 2) {
      const first = updated[newOpen[0]];
      const second = updated[newOpen[1]];
      if (first.animalId === second.animalId) {
        soundManager.play('star_burst');
        voiceService.speakWord(first.nameEn);
        updated[newOpen[0]].isMatched = true;
        updated[newOpen[1]].isMatched = true;
        setPetHouses([...updated]);
        setOpenHouseIndices([]);

        if (updated.every((h) => h.isMatched)) {
          triggerCorrectAnswer({
            en: 'Hooray! All pet friends are together!',
            vi: 'Hoan hô! Tất cả các bạn thú cưng đã tìm thấy ngôi nhà của nhau!',
          });
        }
      } else {
        setTimeout(() => {
          soundManager.play('wrong');
          updated[newOpen[0]].isOpen = false;
          updated[newOpen[1]].isOpen = false;
          setPetHouses([...updated]);
          setOpenHouseIndices([]);
        }, 900);
      }
    }
  };

  // ================================================================
  // 5. ANIMAL RESCUE (SAFARI VINES CUTTING & SEVERING PHYSICS)
  // ================================================================
  interface RescueAnimalScenario {
    animalName: string;
    animalVi: string;
    soundName: string;
  }
  const RESCUE_SCENARIOS: RescueAnimalScenario[] = [
    { animalName: 'elephant', animalVi: 'Chú Voi Rừng', soundName: 'Voi con' },
    { animalName: 'lion', animalVi: 'Chú Sư Tử Con', soundName: 'Sư tử' },
    { animalName: 'monkey', animalVi: 'Chú Khỉ Tinh Nghịch', soundName: 'Khỉ con' },
  ];

  const [currentRescue, setCurrentRescue] = useState<RescueAnimalScenario>(RESCUE_SCENARIOS[0]);
  const [severedVines, setSeveredVines] = useState<boolean[]>([false, false, false]);
  const [animalFreed, setAnimalFreed] = useState(false);

  const initRescueRound = () => {
    const sc = RESCUE_SCENARIOS[Math.floor(Math.random() * RESCUE_SCENARIOS.length)];
    setCurrentRescue(sc);
    setSeveredVines([false, false, false]);
    setAnimalFreed(false);
    setGameTargetWord({
      id: sc.animalName,
      word: sc.animalName,
      viMeaning: sc.animalVi,
    });

    setTimeout(() => {
      voiceService.speakVietnamese(
        `Bạn ${sc.animalVi} đang bị dây leo quấn chặt trong rừng! Bé hãy cầm kéo thần kỳ cắt đứt 3 sợi dây leo để giải cứu nhé!`
      );
    }, 200);
  };

  const handleCutVine = (vineIdx: number) => {
    if (severedVines[vineIdx] || animalFreed || roundCompleted) return;

    soundManager.play('cut_vine');
    const newVines = [...severedVines];
    newVines[vineIdx] = true;
    setSeveredVines(newVines);

    if (newVines.every((v) => v === true)) {
      setAnimalFreed(true);
      soundManager.play('star_burst');
      setActiveExplosion({ show: true, type: 'lock_break' });
      voiceService.speakWord(currentRescue.animalName);
      triggerCorrectAnswer({
        en: `Rescued! The ${currentRescue.animalName} is free!`,
        vi: `Hoan hô! Bé đã cắt đứt toàn bộ dây leo! Bạn ${currentRescue.animalVi} vẫy chào cảm ơn bé!`,
      });
    }
  };

  // ================================================================
  // 6. TREASURE ISLAND (2D MAP NAVIGATION, KEY ROTATION & COIN BURST)
  // ================================================================
  const [keyInserted, setKeyInserted] = useState(false);
  const [chestPopped, setChestPopped] = useState(false);

  const initIslandRound = () => {
    setKeyInserted(false);
    setChestPopped(false);
    setGameTargetWord({
      id: 'treasure_key',
      word: 'Golden Key',
      viMeaning: 'Chìa khóa vàng',
    });

    setTimeout(() => {
      voiceService.speakVietnamese('Bé hãy kéo chiếc Chìa khóa vàng "Key" tra vào ổ khóa để mở hòm kho báu nhé!');
    }, 200);
  };

  const handleInsertKeyToChest = () => {
    if (chestPopped || roundCompleted) return;
    setKeyInserted(true);
    soundManager.play('robot_snap');

    setTimeout(() => {
      setChestPopped(true);
      soundManager.play('chest_open');
      soundManager.play('coin_clink');
      setActiveExplosion({ show: true, type: 'chest_burst' });
      voiceService.speakWord('Treasure Chest');
      triggerCorrectAnswer({
        en: 'Treasure Unlocked! Gold coins and stars burst!',
        vi: 'Khóa đã mở tung! Rương vàng ngọc châu báu phun trào rực rỡ!',
      });
    }, 500);
  };

  // ================================================================
  // 7. SKY WORDS (CATCHING FLOATING WORDS WITH NET)
  // ================================================================
  interface SkyWordBubble {
    id: string;
    word: string;
    viMeaning: string;
    icon: string;
    color: string;
  }
  const [skyBubbles, setSkyBubbles] = useState<SkyWordBubble[]>([]);

  const initSkyWordsRound = () => {
    const target = COMPREHENSIVE_VOCABULARY[Math.floor(Math.random() * COMPREHENSIVE_VOCABULARY.length)];
    const others = COMPREHENSIVE_VOCABULARY.filter((v) => v.id !== target.id).slice(0, 3);
    const colors = ['bg-sky-400', 'bg-rose-400', 'bg-amber-400', 'bg-emerald-400'];
    const list = [target, ...others]
      .sort(() => 0.5 - Math.random())
      .map((item, idx) => ({
        id: item.id,
        word: item.word,
        viMeaning: item.viMeaning,
        icon: ['🎈', '☁️', '⭐', '🕊️'][idx % 4],
        color: colors[idx % colors.length],
      }));

    setGameTargetWord(target);
    setSkyBubbles(list);

    setTimeout(() => {
      voiceService.speakVietnamese(`Bé hãy đón bắt chữ "${target.viMeaning}" trên bầu trời nhé!`, {
        onEnd: () => setTimeout(() => voiceService.speakWord(target.word), 250),
      });
    }, 200);
  };

  const handleCatchSkyBubble = (b: SkyWordBubble) => {
    if (roundCompleted) return;
    if (b.id === gameTargetWord.id) {
      soundManager.play('bubble_burst');
      setActiveExplosion({ show: true, type: 'bubble' });
      voiceService.speakWord(b.word);
      triggerCorrectAnswer({
        en: `Caught! That is ${b.word}!`,
        vi: `Giỏi quá! Bé đã bắt trọn chữ ${b.word}!`,
      });
    } else {
      triggerWrongAnswer(`Chưa đúng rồi! Bé hãy bắt chữ ${gameTargetWord.viMeaning} ("${gameTargetWord.word}") nhé!`, b.id);
    }
  };

  // ================================================================
  // 8. MAGIC GARDEN (SOIL MOUNDS, WATERING CAN & BLOOM SEQUENCE)
  // ================================================================
  type GardenProgress = 'empty' | 'seeded' | 'watered' | 'bloomed';
  interface SeedPouch {
    id: string;
    nameEn: string;
    nameVi: string;
    flowerIcon: string;
    colorClass: string;
  }
  const SEED_POUCHES: SeedPouch[] = [
    { id: 'sunflower', nameEn: 'Sunflower', nameVi: 'Hoa hướng dương', flowerIcon: '🌻', colorClass: 'bg-amber-400' },
    { id: 'rose', nameEn: 'Red Rose', nameVi: 'Hoa hồng đỏ', flowerIcon: '🌹', colorClass: 'bg-rose-500' },
    { id: 'tulip', nameEn: 'Tulip', nameVi: 'Hoa uất kim hương', flowerIcon: '🌷', colorClass: 'bg-pink-400' },
  ];
  const [targetSeed, setTargetSeed] = useState<SeedPouch>(SEED_POUCHES[0]);
  const [gardenStatus, setGardenStatus] = useState<GardenProgress>('empty');

  const initMagicGardenRound = () => {
    setGardenStatus('empty');
    const s = SEED_POUCHES[Math.floor(Math.random() * SEED_POUCHES.length)];
    setTargetSeed(s);
    setGameTargetWord({
      id: s.id,
      word: s.nameEn,
      viMeaning: s.nameVi,
    });

    setTimeout(() => {
      voiceService.speakVietnamese(`Bé hãy gieo hạt giống ${s.nameVi} ("${s.nameEn}") vào luống đất và tưới nước nhé!`);
    }, 200);
  };

  const handlePlantSeed = (seed: SeedPouch) => {
    if (gardenStatus !== 'empty' || roundCompleted) return;
    if (seed.id === targetSeed.id) {
      soundManager.play('click');
      setGardenStatus('seeded');
      voiceService.speakVietnamese(`Đã gieo hạt! Bây giờ bé hãy chạm vào bình nước để tưới cho cây nhé!`);
    } else {
      triggerWrongAnswer(`Bé hãy chọn đúng gói hạt giống ${targetSeed.nameVi} ("${targetSeed.nameEn}") nhé!`, seed.id);
    }
  };

  const handleWaterGarden = () => {
    if (gardenStatus !== 'seeded' || roundCompleted) return;
    soundManager.play('water_splash');
    setGardenStatus('watered');

    setTimeout(() => {
      setGardenStatus('bloomed');
      soundManager.play('star_burst');
      setActiveExplosion({ show: true, type: 'star' });
      voiceService.speakWord(targetSeed.nameEn);
      triggerCorrectAnswer({
        en: `Blossomed! Beautiful ${targetSeed.nameEn}!`,
        vi: `Kì diệu quá! Hạt mầm đã vươn lên nở thành bông ${targetSeed.nameVi} rực rỡ!`,
      });
    }, 800);
  };

  // ================================================================
  // 9. SPACE LAUNCH (SPACESHIP ASSEMBLY & SMOKE BLASTOFF)
  // ================================================================
  interface RocketComponent {
    slotId: 'cone' | 'cabin' | 'fuel' | 'thruster';
    nameEn: string;
    nameVi: string;
    icon: string;
  }
  const ROCKET_COMPONENTS: RocketComponent[] = [
    { slotId: 'cone', nameEn: 'Rocket Nose', nameVi: 'Mũi phi thuyền', icon: '🔺' },
    { slotId: 'cabin', nameEn: 'Space Cabin', nameVi: 'Khoang lái vũ trụ', icon: '🪐' },
    { slotId: 'fuel', nameEn: 'Fuel Tank', nameVi: 'Bình nhiên liệu', icon: '⛽' },
    { slotId: 'thruster', nameEn: 'Plasma Engine', nameVi: 'Động cơ phản lực', icon: '🔥' },
  ];

  const [rocketSlotsFilled, setRocketSlotsFilled] = useState<Record<string, boolean>>({
    cone: false,
    cabin: false,
    fuel: false,
    thruster: false,
  });
  const [rocketBlasting, setRocketBlasting] = useState(false);

  const initSpaceRescueRound = () => {
    setRocketSlotsFilled({ cone: false, cabin: false, fuel: false, thruster: false });
    setRocketBlasting(false);
    setGameTargetWord({
      id: 'space_launch',
      word: 'Space Rocket',
      viMeaning: 'Tên lửa không gian',
    });

    setTimeout(() => {
      voiceService.speakVietnamese('Bé hãy lắp đủ 4 bộ phận vào khung tên lửa trên bệ phóng để sẵn sàng xuất phát nhé!');
    }, 200);
  };

  const handleSnapRocketPart = (comp: RocketComponent) => {
    if (rocketSlotsFilled[comp.slotId] || rocketBlasting || roundCompleted) return;
    soundManager.play('robot_snap');

    const updated = { ...rocketSlotsFilled, [comp.slotId]: true };
    setRocketSlotsFilled(updated);
    voiceService.speakWord(comp.nameEn);

    if (Object.values(updated).every((v) => v === true)) {
      setRocketBlasting(true);
      soundManager.play('rocket_blast');
      setActiveExplosion({ show: true, type: 'star' });
      triggerCorrectAnswer({
        en: 'Blast Off! Rocket launched into space!',
        vi: '3... 2... 1... PHÓNG! Tên lửa đã gầm vang lao vút vào vũ trụ bao la!',
      });
    }
  };

  // ================================================================
  // 10. ANIMAL TRAIN (PLATFORM BOARDING)
  // ================================================================
  interface TrainPassenger {
    id: string;
    nameEn: string;
    nameVi: string;
    icon: string;
  }
  const TRAIN_PASSENGERS: TrainPassenger[] = [
    { id: 'lion', nameEn: 'Lion', nameVi: 'Sư tử', icon: '🦁' },
    { id: 'elephant', nameEn: 'Elephant', nameVi: 'Chú voi', icon: '🐘' },
    { id: 'monkey', nameEn: 'Monkey', nameVi: 'Chú khỉ', icon: '🐵' },
    { id: 'panda', nameEn: 'Panda', nameVi: 'Gấu trúc', icon: '🐼' },
  ];
  const [targetPassenger, setTargetPassenger] = useState<TrainPassenger>(TRAIN_PASSENGERS[0]);
  const [boardedPassenger, setBoardedPassenger] = useState<TrainPassenger | null>(null);

  const initAnimalTrainRound = () => {
    setBoardedPassenger(null);
    const p = TRAIN_PASSENGERS[Math.floor(Math.random() * TRAIN_PASSENGERS.length)];
    setTargetPassenger(p);
    setGameTargetWord({
      id: p.id,
      word: p.nameEn,
      viMeaning: p.nameVi,
    });

    setTimeout(() => {
      voiceService.speakVietnamese(`Bé hãy đón bạn ${p.nameVi} ("${p.nameEn}") lên ghế toa tàu nhé!`);
    }, 200);
  };

  const handleBoardPassenger = (passenger: TrainPassenger) => {
    if (boardedPassenger || roundCompleted) return;
    if (passenger.id === targetPassenger.id) {
      setBoardedPassenger(passenger);
      soundManager.playTrainWhistle();
      voiceService.speakWord(passenger.nameEn);
      triggerCorrectAnswer({
        en: `${passenger.nameEn} is seated! Train departure!`,
        vi: `Tu tu xình xịch! Bạn ${passenger.nameVi} đã ngồi ngay ngắn trên tàu!`,
      });
    } else {
      triggerWrongAnswer(`Đây là bạn ${passenger.nameVi}! Hãy đón bạn ${targetPassenger.nameVi} ("${targetPassenger.nameEn}") nhé!`, passenger.id);
    }
  };

  // ================================================================
  // 11. WEATHER MACHINE (DRAGGING ORB TO SKY -> WORLD CHANGES)
  // ================================================================
  interface WeatherOrb {
    id: string;
    nameEn: string;
    nameVi: string;
    icon: string;
    skyClass: string;
    rainDrops: boolean;
  }
  const WEATHER_CHOICES: WeatherOrb[] = [
    { id: 'rainy', nameEn: 'Rainy', nameVi: 'Mưa rào', icon: '🌧️', skyClass: 'from-slate-700 via-sky-800 to-blue-900 text-white', rainDrops: true },
    { id: 'sunny', nameEn: 'Sunny', nameVi: 'Nắng ấm', icon: '☀️', skyClass: 'from-amber-200 via-yellow-300 to-sky-200 text-amber-950', rainDrops: false },
    { id: 'snowy', nameEn: 'Snowy', nameVi: 'Tuyết trắng', icon: '❄️', skyClass: 'from-cyan-100 via-blue-200 to-slate-200 text-slate-800', rainDrops: false },
  ];
  const [targetWeatherChoice, setTargetWeatherChoice] = useState<WeatherOrb>(WEATHER_CHOICES[0]);
  const [currentSkyWeather, setCurrentSkyWeather] = useState<WeatherOrb>(WEATHER_CHOICES[1]);

  const initWeatherRound = () => {
    const w = WEATHER_CHOICES[Math.floor(Math.random() * WEATHER_CHOICES.length)];
    setTargetWeatherChoice(w);
    setCurrentSkyWeather(WEATHER_CHOICES[1]);
    setGameTargetWord({
      id: w.id,
      word: w.nameEn,
      viMeaning: w.nameVi,
    });

    setTimeout(() => {
      voiceService.speakVietnamese(`Bé hãy kéo quả cầu ${w.nameVi} ("${w.nameEn}") lên bầu trời để điều khiển thời tiết nhé!`);
    }, 200);
  };

  const handleCastWeatherOrb = (orb: WeatherOrb) => {
    if (roundCompleted) return;
    if (orb.id === targetWeatherChoice.id) {
      setCurrentSkyWeather(orb);
      soundManager.play('water_splash');
      voiceService.speakWord(orb.nameEn);
      triggerCorrectAnswer({
        en: `The weather changed to ${orb.nameEn}!`,
        vi: `Bầu trời đã chuyển thành ngày ${orb.nameVi}! Bé thấy thời tiết đổi thay thật kì diệu chưa!`,
      });
    } else {
      triggerWrongAnswer(`Bé hãy chọn quả cầu ${targetWeatherChoice.nameVi} ("${targetWeatherChoice.nameEn}") nhé!`, orb.id);
    }
  };

  // ================================================================
  // 12. MONSTER SNACK SHOP (DRAG SNACK INTO MOUTH)
  // ================================================================
  interface MonsterSnack {
    id: string;
    nameEn: string;
    nameVi: string;
    icon: string;
  }
  const MONSTER_SNACKS: MonsterSnack[] = [
    { id: 'cookie', nameEn: 'Cookie', nameVi: 'Bánh quy', icon: '🍪' },
    { id: 'donut', nameEn: 'Donut', nameVi: 'Bánh vòng', icon: '🍩' },
    { id: 'apple', nameEn: 'Apple', nameVi: 'Quả táo', icon: '🍎' },
    { id: 'candy', nameEn: 'Candy', nameVi: 'Viên kẹo', icon: '🍬' },
  ];
  const [targetSnack, setTargetSnack] = useState<MonsterSnack>(MONSTER_SNACKS[0]);
  const [monsterEating, setMonsterEating] = useState(false);

  const initMonsterSnackRound = () => {
    setMonsterEating(false);
    const s = MONSTER_SNACKS[Math.floor(Math.random() * MONSTER_SNACKS.length)];
    setTargetSnack(s);
    setGameTargetWord({
      id: s.id,
      word: s.nameEn,
      viMeaning: s.nameVi,
    });

    setTimeout(() => {
      voiceService.speakVietnamese(`Quái vật Pip đang đói! Bé hãy đút cho bạn ấy món ${s.nameVi} ("${s.nameEn}") nhé!`);
    }, 200);
  };

  const handleFeedMonster = (snack: MonsterSnack) => {
    if (monsterEating || roundCompleted) return;
    if (snack.id === targetSnack.id) {
      setMonsterEating(true);
      soundManager.play('fruit_pop');
      setActiveExplosion({ show: true, type: 'fruit', fruitName: 'apple' });
      voiceService.speakWord(snack.nameEn);
      triggerCorrectAnswer({
        en: `Yummy! Pip loves the ${snack.nameEn}!`,
        vi: `Măm măm ngon quá! Quái vật Pip đã ăn no nê món ${snack.nameVi}!`,
      });
    } else {
      triggerWrongAnswer(`Pip không thích món này! Hãy đút ${targetSnack.nameVi} ("${targetSnack.nameEn}") cho Pip nhé!`, snack.id);
    }
  };

  // ================================================================
  // 13. BUILD MY ROBOT (ROBOT WORKSHOP — COMPLETE SILHOUETTE CHASSIS)
  // [ HEAD SLOT ] -> [ LEFT ARM ] [ BODY ] [ RIGHT ARM ] -> [ LEFT LEG ] [ RIGHT LEG ]
  // ================================================================
  interface RobotChassisSlot {
    slotKey: 'head' | 'left_arm' | 'body' | 'right_arm' | 'left_leg' | 'right_leg';
    nameEn: string;
    nameVi: string;
    icon: string;
  }
  const ROBOT_CHASSIS_PARTS: RobotChassisSlot[] = [
    { slotKey: 'head', nameEn: 'Robot Head', nameVi: 'Đầu Robot', icon: '🧠' },
    { slotKey: 'left_arm', nameEn: 'Left Arm', nameVi: 'Tay Trái', icon: '🦾' },
    { slotKey: 'body', nameEn: 'Body Engine', nameVi: 'Thân Robot', icon: '🎛️' },
    { slotKey: 'right_arm', nameEn: 'Right Arm', nameVi: 'Tay Phải', icon: '🦾' },
    { slotKey: 'left_leg', nameEn: 'Left Leg', nameVi: 'Chân Trái', icon: '🦿' },
    { slotKey: 'right_leg', nameEn: 'Right Leg', nameVi: 'Chân Phải', icon: '🦿' },
  ];

  const [robotAssembledSlots, setRobotAssembledSlots] = useState<{
    head: boolean;
    left_arm: boolean;
    body: boolean;
    right_arm: boolean;
    left_leg: boolean;
    right_leg: boolean;
  }>({
    head: false,
    left_arm: false,
    body: false,
    right_arm: false,
    left_leg: false,
    right_leg: false,
  });
  const [robotActiveTargetKey, setRobotActiveTargetKey] = useState<string>('head');
  const [robotAlive, setRobotAlive] = useState(false);
  const [robotViewMode, setRobotViewMode] = useState<'chassis' | '3d'>('chassis');
  const [draggingRobotKey, setDraggingRobotKey] = useState<string | null>(null);
  const [hoveredRobotSlotKey, setHoveredRobotSlotKey] = useState<string | null>(null);

  const initRobotRound = () => {
    // Start with empty chassis
    const initialSlots = {
      head: false,
      left_arm: false,
      body: false,
      right_arm: false,
      left_leg: false,
      right_leg: false,
    };
    setRobotAssembledSlots(initialSlots);
    setRobotAlive(false);
    setRobotViewMode('chassis');
    setDraggingRobotKey(null);
    setHoveredRobotSlotKey(null);
    setRobotActiveTargetKey('head');
    setGameTargetWord({
      id: 'robot_chassis',
      word: 'Robot Workshop',
      viMeaning: 'Xưởng chế tạo Robot',
    });

    setTimeout(() => {
      voiceService.speakVietnamese('Chào mừng đến Xưởng Robot! Bé hãy kéo các bộ phận vào đúng khung sườn để khởi động robot nhé!');
    }, 200);
  };

  const handleSnapRobotChassisPart = (part: RobotChassisSlot) => {
    if (robotAssembledSlots[part.slotKey] || robotAlive || roundCompleted) return;

    soundManager.playMagneticSnap();
    soundManager.playServoSound();
    const updated = { ...robotAssembledSlots, [part.slotKey]: true };
    setRobotAssembledSlots(updated);
    voiceService.speakWord(part.nameEn);

    // Check next target part needed
    const remaining = ROBOT_CHASSIS_PARTS.find((p) => !updated[p.slotKey]);
    if (remaining) {
      setRobotActiveTargetKey(remaining.slotKey);
    } else {
      // Complete assembly! Robot dramatic boot sequence
      setRobotAlive(true);
      setRobotViewMode('3d');
      soundManager.playBootHum();
      setTimeout(() => soundManager.playServoSound(), 400);
      setTimeout(() => {
        voiceService.speakRobotVoice('SYSTEM ONLINE. MISSION COMPLETE. READY FOR THE NEXT MISSION.', {
          onEnd: () => {
            soundManager.playHeroicSting();
          },
        });
      }, 700);

      setActiveExplosion({ show: true, type: 'star' });
      triggerCorrectAnswer({
        en: 'SYSTEM ONLINE: Hero Robot Activated!',
        vi: 'Người máy dũng mãnh đã bước ra chào mừng bé!',
      });
    }
  };


  // ================================================================
  // 14. MAGIC STORYBOOK (MAGNIFYING GLASS DISCOVERY)
  // ================================================================
  interface StorybookScene {
    titleVi: string;
    targetEn: string;
    targetVi: string;
    icon: string;
  }
  const STORY_SCENES: StorybookScene[] = [
    { titleVi: 'Lâu Đài Phép Thuật', targetEn: 'Golden Crown', targetVi: 'Vương miện vàng', icon: '👑' },
    { titleVi: 'Khu Rừng Cổ Tích', targetEn: 'Magic Rabbit', targetVi: 'Chú thỏ ngọc', icon: '🐰' },
    { titleVi: 'Bờ Biển Hoàng Gia', targetEn: 'Crystal Shell', targetVi: 'Vỏ ốc pha lê', icon: '🐚' },
  ];
  const [currentStoryIdx, setCurrentStoryIdx] = useState(0);
  const [storyFound, setStoryFound] = useState(false);

  const initStorybookRound = () => {
    setStoryFound(false);
    const scene = STORY_SCENES[currentRound % STORY_SCENES.length];
    setCurrentStoryIdx(currentRound % STORY_SCENES.length);
    setGameTargetWord({
      id: scene.targetEn.toLowerCase(),
      word: scene.targetEn,
      viMeaning: scene.targetVi,
    });

    setTimeout(() => {
      voiceService.speakVietnamese(`Trong trang truyện cổ tích, bé hãy tìm: ${scene.targetVi} ("${scene.targetEn}") nhé!`);
    }, 200);
  };

  const handleDiscoverStoryItem = () => {
    if (storyFound || roundCompleted) return;
    setStoryFound(true);
    soundManager.play('star_burst');
    setActiveExplosion({ show: true, type: 'star' });
    voiceService.speakWord(STORY_SCENES[currentStoryIdx].targetEn);
    triggerCorrectAnswer({
      en: `Discovered the ${STORY_SCENES[currentStoryIdx].targetEn}!`,
      vi: `Bé đã tìm ra ${STORY_SCENES[currentStoryIdx].targetVi} sáng lấp lánh trong trang truyện!`,
    });
  };

  // ================================================================
  // 15. DINOSAUR DIG (EXCAVATION WITH MULTI-LAYER ROCK FRACTURE)
  // ================================================================
  interface DinoFossilPart {
    slotKey: 'skull' | 'spine' | 'ribs' | 'tail';
    nameEn: string;
    nameVi: string;
    icon: string;
    descriptionVi: string;
  }

  const DINO_PARTS_CONFIG: DinoFossilPart[] = [
    { slotKey: 'skull', nameEn: 'T-Rex Skull', nameVi: 'Hộp Sọ T-Rex', icon: '💀', descriptionVi: 'Hộp sọ sắc nhọn của chúa tể' },
    { slotKey: 'spine', nameEn: 'Spine Bone', nameVi: 'Cột Sống Khủng Long', icon: '🦴', descriptionVi: 'Đốt sống lưng vững chãi' },
    { slotKey: 'ribs', nameEn: 'Rib Cage', nameVi: 'Lồng Ngực Hóa Thạch', icon: '🩻', descriptionVi: 'Bộ khung sườn cổ đại' },
    { slotKey: 'tail', nameEn: 'Tail Bone', nameVi: 'Đốt Xương Đuôi', icon: '🦕', descriptionVi: 'Đuôi dài cân bằng bước chạy' },
  ];

  const [dinoFossilSlots, setDinoFossilSlots] = useState<Record<string, number>>({
    skull: 0,
    spine: 0,
    ribs: 0,
    tail: 0,
  });
  const [dinoAlive, setDinoAlive] = useState(false);

  const initDinoDigRound = () => {
    setDinoFossilSlots({ skull: 0, spine: 0, ribs: 0, tail: 0 });
    setDinoAlive(false);
    setGameTargetWord({
      id: 'dino_fossil',
      word: 'Dinosaur Fossil',
      viMeaning: 'Hóa Thạch Khủng Long',
    });

    setTimeout(() => {
      voiceService.speakVietnamese('Nhà khảo cổ nhí hãy dùng búa đập vỡ từng lớp đá để khai quật đủ 4 mảnh xương khủng long T-Rex nhé!');
    }, 200);
  };

  const handleExcavateRock = (slotKey: 'skull' | 'spine' | 'ribs' | 'tail') => {
    if (dinoAlive || roundCompleted) return;
    const currentHits = dinoFossilSlots[slotKey] || 0;
    if (currentHits >= 2) return;

    const nextHits = currentHits + 1;
    soundManager.play('rock_crack');
    const updated = { ...dinoFossilSlots, [slotKey]: nextHits };
    setDinoFossilSlots(updated);

    const partInfo = DINO_PARTS_CONFIG.find((p) => p.slotKey === slotKey);
    if (nextHits === 1) {
      voiceService.speakVietnamese('Đá nứt rồi! Đập thêm một nhát nữa nào!');
    } else if (nextHits === 2 && partInfo) {
      soundManager.play('star_burst');
      voiceService.speakWord(partInfo.nameEn);

      const allUnearthed = Object.values(updated).every((h) => h >= 2);
      if (allUnearthed) {
        setTimeout(() => {
          setDinoAlive(true);
          soundManager.play('dino_roar');
          setActiveExplosion({ show: true, type: 'star' });
          triggerCorrectAnswer({
            en: 'ROAAR! The T-Rex Fossil is fully revived!',
            vi: 'GẦM VANG! Bộ xương T-Rex đã hồi sinh dũng mãnh giữa kỷ Jura!',
          });
        }, 500);
      }
    }
  };

  // ================================================================
  // 16. MAGIC DOOR (RUNE KEY SOCKET & 3D REVOLVING PORTAL)
  // ================================================================
  interface MagicRuneKey {
    id: string;
    wordEn: string;
    wordVi: string;
    symbol: string;
    bgGradient: string;
    borderColor: string;
  }

  const MAGIC_RUNE_KEYS: MagicRuneKey[] = [
    { id: 'star_key', wordEn: 'Star Key', wordVi: 'Chìa khóa Sao', symbol: '⭐', bgGradient: 'from-amber-400 to-yellow-500', borderColor: 'border-amber-300' },
    { id: 'moon_key', wordEn: 'Moon Key', wordVi: 'Chìa khóa Trăng', symbol: '🌙', bgGradient: 'from-sky-400 to-blue-500', borderColor: 'border-sky-300' },
    { id: 'sun_key', wordEn: 'Sun Key', wordVi: 'Chìa khóa Mặt Trời', symbol: '☀️', bgGradient: 'from-orange-400 to-amber-500', borderColor: 'border-orange-300' },
    { id: 'heart_key', wordEn: 'Heart Key', wordVi: 'Chìa khóa Trái Tim', symbol: '💖', bgGradient: 'from-rose-400 to-pink-500', borderColor: 'border-rose-300' },
  ];

  const [targetRuneKey, setTargetRuneKey] = useState<MagicRuneKey>(MAGIC_RUNE_KEYS[0]);
  const [doorKeyInserted, setDoorKeyInserted] = useState(false);
  const [doorUnlocked, setDoorUnlocked] = useState(false);
  const [keyRotating, setKeyRotating] = useState(false);

  const initMagicDoorRound = () => {
    setDoorKeyInserted(false);
    setDoorUnlocked(false);
    setKeyRotating(false);
    const chosen = MAGIC_RUNE_KEYS[Math.floor(Math.random() * MAGIC_RUNE_KEYS.length)];
    setTargetRuneKey(chosen);
    setGameTargetWord({
      id: chosen.id,
      word: chosen.wordEn,
      viMeaning: chosen.wordVi,
    });

    setTimeout(() => {
      voiceService.speakVietnamese(`Bé hãy tìm và tra ${chosen.wordVi} ("${chosen.wordEn}") vào ổ khóa cổng thần kỳ nhé!`);
    }, 200);
  };

  const handleUnlockMagicDoor = (key: MagicRuneKey) => {
    if (doorKeyInserted || doorUnlocked || roundCompleted) return;
    if (key.id === targetRuneKey.id) {
      setDoorKeyInserted(true);
      setKeyRotating(true);
      soundManager.play('robot_snap');
      voiceService.speakWord(key.wordEn);

      setTimeout(() => {
        setKeyRotating(false);
        setDoorUnlocked(true);
        soundManager.play('magic_portal');
        setActiveExplosion({ show: true, type: 'star' });
        triggerCorrectAnswer({
          en: `Magic Door is Unlocked with ${key.wordEn}!`,
          vi: `Cánh Cửa Không Gian đã mở toang! Ánh sáng diệu kỳ đưa bé đến thế giới mới!`,
        });
      }, 700);
    } else {
      soundManager.play('wrong');
      triggerWrongAnswer(`Ổ khóa không khớp! Bé hãy dùng ${targetRuneKey.wordVi} ("${targetRuneKey.wordEn}") nhé!`, key.id);
    }
  };

  // Master Initializer per round across all 16 games
  const initRoundForGame = (gameId: GameId, roundNum: number) => {
    if (gameId === 'balloon_pop') initBalloonRound();
    else if (gameId === 'train_builder') initTrainRound(roundNum);
    else if (gameId === 'feed_animal') initFeedRound();
    else if (gameId === 'match_cards') initMatchCardsRound();
    else if (gameId === 'animal_rescue') initRescueRound();
    else if (gameId === 'treasure_island') initIslandRound();
    else if (gameId === 'sky_words') initSkyWordsRound();
    else if (gameId === 'magic_garden') initMagicGardenRound();
    else if (gameId === 'space_rescue') initSpaceRescueRound();
    else if (gameId === 'animal_train') initAnimalTrainRound();
    else if (gameId === 'weather_adventure') initWeatherRound();
    else if (gameId === 'monster_snack_shop') initMonsterSnackRound();
    else if (gameId === 'build_my_robot') initRobotRound();
    else if (gameId === 'magic_storybook') initStorybookRound();
    else if (gameId === 'dinosaur_dig') initDinoDigRound();
    else if (gameId === 'magic_door') initMagicDoorRound();
  };

  // Dedicated Immersive Module for Animal Rescue Expedition (🦁 Thả Xích Cứu Thú)
  if (activeGameId === 'animal_rescue') {
    return (
      <div className="w-full max-w-5xl mx-auto py-2 sm:py-4 px-2 sm:px-4 animate-fadeIn">
        <AnimalRescueGame
          onExit={handleBackToCatalog}
          onStarsAwarded={(earnedStars) => {
            const current = getKidsProgress();
            updateKidsProgress({
              totalStars: current.totalStars + earnedStars,
              xp: current.xp + earnedStars * 10,
            });
          }}
        />
      </div>
    );
  }

  // Dedicated Immersive Module for Treasure Map Adventure (🗺️ Bản Đồ Kho Báu)
  if (activeGameId === 'treasure_island') {
    return (
      <div className="w-full max-w-5xl mx-auto py-2 sm:py-4 px-2 sm:px-4 animate-fadeIn">
        <TreasureMapGame
          onExit={handleBackToCatalog}
          onStarsAwarded={(earnedStars) => {
            const current = getKidsProgress();
            updateKidsProgress({
              totalStars: current.totalStars + earnedStars,
              xp: current.xp + earnedStars * 10,
            });
          }}
        />
      </div>
    );
  }

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
              {activeGameId ? activeGameDef.titleVi : 'Thế Giới Trò Chơi Tiếng Anh Tương Tác Vật Lý'}
            </h1>
            <p className="text-xs sm:text-sm font-bold text-slate-600">
              {activeGameId
                ? activeGameDef.titleEn
                : 'Thao tác trực tiếp với thế giới: Xưởng Robot 3D, Cắt dây cứu voi, Mở rương báu, Khai quật T-Rex, Cổng thần kỳ'}
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

            {/* Streak */}
            <div className="h-11 px-3 py-1.5 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-900 flex items-center gap-1 font-black text-xs sm:text-sm">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>{streak}</span>
            </div>

            {/* Current Round Indicator */}
            <div className="h-11 px-3.5 py-1.5 rounded-2xl bg-slate-100 border-2 border-slate-200 font-black text-xs sm:text-sm text-slate-800 flex items-center gap-1">
              <span>Vòng {currentRound}/{TOTAL_ROUNDS}</span>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* 2. GAME CATALOG VIEW (When no active game is selected)           */}
      {/* ================================================================ */}
      {!activeGameId && (
        <div className="space-y-8">
          {/* TIER 1: CONTINUE SPOTLIGHT (1 Game) */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-600 to-blue-600 p-6 sm:p-8 text-white border-2 border-cyan-400 shadow-md">
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/40 flex items-center justify-center text-4xl shrink-0">
                  🤖
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/25 text-[10px] font-black uppercase tracking-wider">
                    Tiếp tục chơi
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                    Xưởng Robot (Robot Lab)
                  </h2>
                  <p className="text-xs sm:text-sm font-bold text-cyan-100 max-w-md">
                    Lắp ráp hoàn thiện người máy hiện đại trên bàn cơ khí và ngắm nhìn tư thế anh hùng!
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleSelectGame('build_my_robot')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-cyan-50 text-slate-950 font-black text-base border-b-4 border-slate-300 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer shadow-md min-h-[50px]"
              >
                <span>CHƠI TIẾP NGAY</span>
                <Play className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>

          {/* TIER 2: FEATURED ADVENTURES (2 Large Cards) */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-950">
                Trò Chơi Tiêu Điểm Trong Tuần
              </h3>
              <p className="text-xs font-bold text-slate-500">
                Thao tác trực tiếp với vật thể lớn, trải nghiệm học tiếng Anh chuẩn quốc tế
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* FEATURED CARD 1 */}
              <div
                onClick={() => handleSelectGame('animal_rescue')}
                className="p-6 rounded-3xl bg-white hover:bg-emerald-50/40 border-2 border-slate-200 hover:border-emerald-400 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between select-none group"
              >
                <div className="flex items-center justify-center py-4 group-hover:scale-105 transition-transform duration-300">
                  <HeroElephant size={130} />
                </div>
                <div className="space-y-1 mt-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase">
                    Thám hiểm & Cứu hộ
                  </span>
                  <h4 className="text-lg font-black text-slate-950 group-hover:text-emerald-700">
                    Giải Cứu Động Vật Rừng Xanh
                  </h4>
                  <p className="text-xs font-bold text-slate-600 line-clamp-2">
                    Cầm kéo thần kỳ cắt đứt từng sợi dây leo trói để bạn Voi dũng mãnh thoát nạn!
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                    <span>Giải cứu ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs font-bold text-slate-400">4-9 tuổi</span>
                </div>
              </div>

              {/* FEATURED CARD 2 */}
              <div
                onClick={() => handleSelectGame('dinosaur_dig')}
                className="p-6 rounded-3xl bg-white hover:bg-amber-50/40 border-2 border-slate-200 hover:border-amber-400 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between select-none group"
              >
                <div className="flex items-center justify-center py-4 group-hover:scale-105 transition-transform duration-300 text-6xl">
                  🦖
                </div>
                <div className="space-y-1 mt-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-black uppercase">
                    Khảo cổ kỷ Jura
                  </span>
                  <h4 className="text-lg font-black text-slate-950 group-hover:text-amber-800">
                    Khai Quật Hóa Thạch Khủng Long
                  </h4>
                  <p className="text-xs font-bold text-slate-600 line-clamp-2">
                    Cầm búa đập vỡ từng lớp đá trầm tích khai quật xương T-Rex sống lại gầm vang!
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-black text-amber-700 flex items-center gap-1">
                    <span>Khai quật ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs font-bold text-slate-400">5-10 tuổi</span>
                </div>
              </div>
            </div>
          </div>

          {/* TIER 3: EXPLORE REALMS (Shelf of all games with Category Filter) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-950">
                  Khám Phá Các Thế Giới Khác
                </h3>
                <p className="text-xs font-bold text-slate-500">
                  Chọn thể loại trò chơi bé yêu thích
                </p>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {[
                { id: 'all', label: 'Tất Cả (16)', icon: '🌟' },
                { id: 'vocab', label: 'Từ Vựng & Hái Táo', icon: '🍎' },
                { id: 'spelling', label: 'Cơ Khí & Tên Lửa', icon: '🤖' },
                { id: 'memory', label: 'Nhà Thú Cưng & Vườn Hoa', icon: '🏠' },
                { id: 'adventure', label: 'Thám Hiểm & Khảo Cổ', icon: '🦖' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setGameCategoryFilter(tab.id as any)}
                  className={`h-11 px-4 rounded-2xl font-black text-xs sm:text-sm shrink-0 flex items-center gap-2 border-2 cursor-pointer transition-all ${
                    gameCategoryFilter === tab.id
                      ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-sm scale-105'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Grid of Games */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  theme={GAME_THEMES[game.id] || GAME_THEMES.balloon_pop}
                  onSelect={() => handleSelectGame(game.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}


      {/* ================================================================ */}
      {/* 3. ACTIVE GAME PLAYING SCREEN                                    */}
      {/* ================================================================ */}
      {activeGameId && (
        <div className="space-y-6">
          {/* A. GAME GUIDE INTRO (Before starting round) */}
          {!gameStarted ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleBackToCatalog}
                  className="px-4 py-2 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-black text-xs border-2 border-slate-200 active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Chọn game khác</span>
                </button>
              </div>
              <GameGuide
                gameId={activeGameId}
                gameTitle={activeGameDef.titleVi}
                gameSubtitle={activeGameDef.titleEn}
                instructionVi={activeGameDef.descriptionVi}
                targetWord={gameTargetWord?.word}
                targetWordVi={gameTargetWord?.viMeaning}
                onStart={handleStartGame}
              />
            </div>
          ) : (
            /* B. LIVE GAME ARENA — OBJECT-FIRST PHYSICAL INTERACTION */
            <div className={`bg-white rounded-3xl p-6 sm:p-8 border-4 ${activeTheme.borderColor} shadow-lg space-y-6 animate-fadeIn relative overflow-hidden`}>
              
              {/* Active Particle Explosion Anchor */}
              {activeExplosion?.show && (
                <KidsExplosionFX
                  type={activeExplosion.type}
                  fruitName={activeExplosion.fruitName}
                  onDone={() => setActiveExplosion(null)}
                />
              )}

              {/* ========================================================= */}
              {/* GAME 1: BALLOON POP (MULTI-PIECE SHATTER EXPLOSION)       */}
              {/* ========================================================= */}
              {activeGameId === 'balloon_pop' && (
                <div className="space-y-6">
                  <div className="text-center space-y-1">
                    <span className="px-3.5 py-1 rounded-full bg-rose-100 border border-rose-300 text-xs font-black text-rose-950">
                      Rèn Luyện Phản Xạ Nhanh
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                      Bắn nổ bóng mang chữ:{' '}
                      <span className="text-rose-600 underline">{gameTargetWord.word}</span> ({gameTargetWord.viMeaning})
                    </h3>
                  </div>

                  <div className="relative overflow-hidden bg-gradient-to-b from-sky-200 via-sky-100 to-amber-50/80 p-4 sm:p-8 rounded-3xl border-2 border-sky-300 flex items-center justify-center min-h-[340px]">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 w-full max-w-3xl items-end justify-items-center">
                      {balloons.map((b, idx) => (
                        <div key={b.id} className="relative flex flex-col items-center justify-center min-h-[200px] min-w-[130px]">
                          {/* In-Place Balloon Shatter Explosion */}
                          {poppedBalloonId === b.id && (
                            <KidsExplosionFX
                              type="balloon"
                              className="!absolute inset-0 z-50 pointer-events-none"
                              onDone={() => setPoppedBalloonId(null)}
                            />
                          )}

                          {!b.popped && (
                            <div
                              onClick={() => handlePopBalloon(b)}
                              className="flex flex-col items-center select-none cursor-pointer group transition-transform animate-balloon-float"
                              style={{ animationDelay: `${idx * 0.3}s` }}
                            >
                              <div className={`w-28 sm:w-32 aspect-[4/5] rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] relative flex flex-col items-center justify-center p-2.5 text-center transition-all duration-200 group-hover:scale-105 active:scale-95 border-2 border-white/40 cursor-pointer overflow-hidden ${b.gradientClass} shadow-md`}>
                                <div className="absolute top-3 left-3 w-3 h-8 bg-white/40 rounded-full -rotate-[28deg] pointer-events-none" />
                                <span className="relative z-10 text-base sm:text-lg font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                                  {b.word}
                                </span>
                                <span className="relative z-10 text-[11px] font-bold text-white/95">
                                  ({b.viMeaning})
                                </span>
                              </div>
                              <div className={`w-3 h-2 ${b.knotClass} -mt-0.5`} style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)' }} />
                              <div className="w-0.5 h-10 bg-slate-300/80 animate-string-wave" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 2: TRAIN BUILDER (CONSTRUCTION WITH MAGNETIC SNAP)   */}
              {/* ========================================================= */}
              {activeGameId === 'train_builder' && (
                <div className="space-y-6">
                  <div className="text-center space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-orange-100 border border-orange-300 text-xs font-black text-orange-950">
                      <span>Điểm đến: {trainChallenge.destinationIcon} {trainChallenge.destinationName}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-950">
                      Gắn toa tàu để ghép câu: "{trainChallenge.fullSentenceVi}"
                    </h3>
                  </div>

                  <div className="relative bg-gradient-to-b from-sky-100 via-amber-50 to-emerald-50 rounded-3xl p-6 sm:p-8 border-2 border-orange-200 overflow-hidden min-h-[260px]">
                    <div className={`flex items-end gap-2 overflow-x-auto pb-6 pt-8 transition-transform duration-1000 ${trainDeparting ? 'animate-train-depart' : ''}`}>
                      <div className="shrink-0 flex flex-col items-center">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-orange-500 text-white flex flex-col items-center justify-center border-3 border-orange-600 shadow-md">
                          <span className="text-3xl">🚂</span>
                          <span className="text-xs font-black uppercase mt-1">ĐẦU TÀU</span>
                        </div>
                      </div>

                      {trainChallenge.words.map((_, index) => {
                        const wordPlaced = trainPlacedWords[index];
                        return (
                          <div key={index} className="shrink-0 flex items-center">
                            <div className="w-4 h-2 bg-slate-700" />
                            <div
                              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-2 text-center transition-all ${
                                wordPlaced ? 'bg-amber-300 border-amber-500 text-slate-950 font-black shadow-xs' : 'bg-white/70 border-amber-300 text-slate-400'
                              }`}
                            >
                              {wordPlaced ? (
                                <>
                                  <span className="text-base sm:text-lg font-black">{wordPlaced}</span>
                                  <span className="text-[10px] text-amber-900 font-bold">Toa {index + 1}</span>
                                </>
                              ) : (
                                <span className="text-xs font-bold text-amber-600">Toa {index + 1}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {trainTrayWords.map((word, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAttachWordToTrain(word, idx)}
                        disabled={trainDeparting || roundCompleted}
                        className="px-6 py-3 rounded-2xl bg-white hover:bg-orange-100 text-slate-950 font-black text-lg border-2 border-orange-300 shadow-sm active:scale-95 cursor-pointer transition-all"
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 3: FRUIT ORCHARD & GATHERING (OBJECT-FIRST DESIGN)   */}
              {/* Tree with hanging fruit -> Drag/Drop to basket -> Bounce  */}
              {/* ========================================================= */}
              {activeGameId === 'feed_animal' && (
                <div className="space-y-6">
                  <div className="text-center space-y-1">
                    <span className="px-3.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-xs font-black text-emerald-950">
                      Thu Hoạch Trái Cây
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                      Hái quả <span className="text-rose-600 underline">{gameTargetWord.word}</span> ({gameTargetWord.viMeaning}) bỏ vào giỏ!
                    </h3>
                  </div>

                  {/* Orchard Scene Canvas */}
                  <div className="relative rounded-3xl bg-gradient-to-b from-sky-200 via-emerald-100 to-emerald-200 p-6 sm:p-8 border-2 border-emerald-300 min-h-[360px] flex flex-col justify-between overflow-hidden shadow-inner">
                    {/* Big Apple Tree Silhouette & Branches */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-80 sm:w-96 h-56 bg-emerald-500/85 rounded-[50%_50%_40%_40%] shadow-lg border-4 border-emerald-600 pointer-events-none flex items-center justify-center">
                      <div className="w-64 h-44 bg-emerald-400/90 rounded-[50%_50%_40%_40%]" />
                    </div>
                    {/* Trunk */}
                    <div className="absolute top-52 left-1/2 -translate-x-1/2 w-16 h-28 bg-amber-800 rounded-b-xl pointer-events-none" />

                    {/* Hanging Fruits on Branches */}
                    <div className="relative z-10 w-full h-48">
                      {orchardFruits.map((fruit) => (
                        <div
                          key={fruit.id}
                          onClick={() => handlePickFruitToBasket(fruit)}
                          style={{ top: fruit.top, left: fruit.left }}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group animate-gentle-float active:scale-95 transition-all"
                        >
                          <div className="p-3 bg-white/95 rounded-2xl border-2 border-emerald-300 shadow-md flex flex-col items-center group-hover:scale-110">
                            <span className="text-4xl select-none">{fruit.icon}</span>
                            <span className="text-xs font-black text-slate-900 mt-1">{fruit.word}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Ground & Picnic Basket Target Area */}
                    <div className="relative z-10 flex items-center justify-between px-6 pt-4">
                      {/* Friendly Mascot waiting */}
                      <div className="flex items-center gap-2">
                        <span className="text-5xl animate-bounce">🐻</span>
                        <div className="bg-white px-3 py-1.5 rounded-2xl border border-amber-300 text-xs font-black text-amber-950 shadow-xs">
                          Gấu đói bụng! Hái quả cho tớ nhé!
                        </div>
                      </div>

                      {/* Picnic Basket with Visible Slot Outline */}
                      <div className={`relative flex flex-col items-center transition-all ${basketBouncing ? 'animate-squash-bounce' : ''}`}>
                        <div className="w-36 h-24 rounded-2xl bg-amber-700 border-4 border-amber-800 shadow-lg flex flex-col items-center justify-center relative overflow-hidden">
                          {/* Basket weave pattern */}
                          <div className="absolute inset-0 bg-amber-600/30 grid grid-cols-4 grid-rows-2 gap-1 p-1 pointer-events-none" />
                          <span className="text-3xl relative z-10">🧺</span>
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-100 relative z-10">
                            GIỎ TRÁI CÂY
                          </span>
                        </div>
                        {/* Basket Fruit Count */}
                        {basketFruits.length > 0 && (
                          <div className="absolute -top-3 right-0 bg-emerald-500 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-sm">
                            +{basketFruits.length}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 4: PET HOUSE CONTEXTUAL MEMORY (SWINGING DOORS)      */}
              {/* ========================================================= */}
              {activeGameId === 'match_cards' && (
                <div className="space-y-6">
                  <div className="text-center space-y-1">
                    <span className="px-3.5 py-1 rounded-full bg-purple-100 border border-purple-300 text-xs font-black text-purple-950">
                      Ngôi Nhà Thú Cưng
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                      Mở cửa các ngôi nhà để tìm cặp đôi thú cưng!
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-xl mx-auto">
                    {petHouses.map((house, idx) => (
                      <div
                        key={house.houseId}
                        onClick={() => handleOpenPetHouse(idx)}
                        className={`relative rounded-3xl p-3 border-3 cursor-pointer transition-all ${
                          house.isMatched ? 'bg-emerald-100 border-emerald-400 shadow-md' : 'bg-amber-50 border-amber-300 hover:scale-105'
                        }`}
                      >
                        {/* House Roof */}
                        <div className={`h-8 rounded-t-2xl ${house.roofColor} text-white text-xs font-black flex items-center justify-center shadow-xs`}>
                          <span>🏠 Nhà Thú Cưng</span>
                        </div>

                        {/* Doorway / Inside Animal */}
                        <div className="h-28 rounded-b-2xl bg-white border-2 border-slate-200 flex items-center justify-center relative overflow-hidden">
                          {house.isOpen || house.isMatched ? (
                            <div className="flex flex-col items-center justify-center animate-bounce">
                              <span className="text-4xl">{house.icon}</span>
                              <span className="text-xs font-black text-slate-900 mt-1">{house.nameEn}</span>
                            </div>
                          ) : (
                            /* Closed Wooden Door */
                            <div className="absolute inset-0 bg-amber-700 border-2 border-amber-800 flex flex-col items-center justify-center text-white shadow-inner">
                              <span className="text-2xl">🚪</span>
                              <span className="text-[10px] font-black mt-0.5">GÕ CỬA</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 5: ANIMAL RESCUE (SAFARI VINE CUTTING SCENE)         */}
              {/* ========================================================= */}
              {activeGameId === 'animal_rescue' && (
                <div className="space-y-6">
                  <div className="text-center space-y-1">
                    <span className="px-3.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-xs font-black text-emerald-950">
                      Cứu Hộ Rừng Xanh
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                      Cắt đứt dây leo để giải cứu: <span className="text-emerald-700 underline">{currentRescue.animalVi}</span> ({currentRescue.animalName})!
                    </h3>
                  </div>

                  {/* Safari Scene with Trapped Animal & Crossing Vines */}
                  <div className="relative rounded-3xl bg-gradient-to-b from-sky-200 via-emerald-100 to-emerald-200 p-6 sm:p-8 border-2 border-emerald-300 min-h-[360px] flex flex-col items-center justify-center overflow-hidden shadow-inner">
                    <div className="absolute top-3 left-4 text-3xl opacity-50 pointer-events-none">🌴</div>
                    <div className="absolute top-3 right-6 text-3xl opacity-50 pointer-events-none">🌳</div>

                    {/* Central Trapped Animal Stage */}
                    <div className="relative w-52 h-52 bg-white/90 rounded-3xl border-4 border-emerald-400 flex items-center justify-center p-4 shadow-xl">
                      <KidsIllustration
                        name={currentRescue.animalName}
                        className={`w-full h-full object-contain ${animalFreed ? 'animate-bounce' : 'opacity-80'}`}
                      />

                      {/* Vine 1: Diagonal Top-Left to Bottom-Right */}
                      {!severedVines[0] && (
                        <div
                          onClick={() => handleCutVine(0)}
                          className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                        >
                          <div className="w-full h-6 bg-emerald-800 border-2 border-emerald-950 rounded-full rotate-45 shadow-md flex items-center justify-center group-hover:bg-rose-600 transition-colors">
                            <span className="text-xs text-white font-black">✂️ CẮT DÂY 1</span>
                          </div>
                        </div>
                      )}

                      {/* Vine 2: Diagonal Top-Right to Bottom-Left */}
                      {!severedVines[1] && (
                        <div
                          onClick={() => handleCutVine(1)}
                          className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                        >
                          <div className="w-full h-6 bg-emerald-800 border-2 border-emerald-950 rounded-full -rotate-45 shadow-md flex items-center justify-center group-hover:bg-rose-600 transition-colors">
                            <span className="text-xs text-white font-black">✂️ CẮT DÂY 2</span>
                          </div>
                        </div>
                      )}

                      {/* Vine 3: Horizontal Middle */}
                      {!severedVines[2] && (
                        <div
                          onClick={() => handleCutVine(2)}
                          className="absolute inset-x-0 h-6 bg-emerald-800 border-2 border-emerald-950 rounded-full shadow-md flex items-center justify-center cursor-pointer group group-hover:bg-rose-600 transition-colors"
                        >
                          <span className="text-xs text-white font-black">✂️ CẮT DÂY 3</span>
                        </div>
                      )}
                    </div>

                    <p className="mt-4 font-black text-sm text-slate-800">
                      {animalFreed
                        ? `🎉 ${currentRescue.animalVi} đã tự do vẫy chào bé!`
                        : `Chạm vào dây leo để dùng kéo thần kỳ cắt đứt! (${severedVines.filter(Boolean).length}/3 đã cắt)`}
                    </p>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 7: SKY WORDS                                         */}
              {/* ========================================================= */}
              {activeGameId === 'sky_words' && (
                <div className="space-y-6">
                  <div className="text-center space-y-1">
                    <span className="px-3.5 py-1 rounded-full bg-cyan-100 border border-cyan-300 text-xs font-black text-cyan-950">
                      Bầu Trời Ngữ Nghĩa
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                      Đón bắt chữ:{' '}
                      <span className="text-cyan-700 underline">{gameTargetWord.word}</span> ({gameTargetWord.viMeaning})
                    </h3>
                  </div>

                  <div className="relative rounded-3xl bg-gradient-to-b from-sky-300 via-sky-100 to-white p-6 sm:p-8 border-2 border-sky-300 min-h-[320px] flex items-center justify-center overflow-hidden">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-3xl">
                      {skyBubbles.map((item, idx) => (
                        <button
                          key={item.id}
                          onClick={() => handleCatchSkyBubble(item)}
                          disabled={roundCompleted}
                          className={`p-4 rounded-3xl text-white font-black flex flex-col items-center justify-center gap-2 transition-all cursor-pointer select-none active:scale-95 hover:scale-105 shadow-md border-2 border-white/60 animate-balloon-float ${item.color}`}
                          style={{ animationDelay: `${idx * 0.4}s` }}
                        >
                          <span className="text-4xl">{item.icon}</span>
                          <span className="text-lg font-black">{item.word}</span>
                          <span className="text-xs opacity-90">({item.viMeaning})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 8: MAGIC GARDEN (SOIL MOUNDS, WATERING & BLOOM)      */}
              {/* ========================================================= */}
              {activeGameId === 'magic_garden' && (
                <div className="space-y-6">
                  <div className="text-center space-y-1">
                    <span className="px-3.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-xs font-black text-emerald-950">
                      Khu Vườn Phép Thuật
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                      Gieo hạt và tưới hoa: <span className="text-emerald-700 underline">{targetSeed.nameVi}</span> ({targetSeed.nameEn})
                    </h3>
                  </div>

                  <div className="rounded-3xl bg-gradient-to-b from-emerald-50 via-amber-50 to-amber-100 p-8 border-2 border-emerald-200 flex flex-col items-center justify-center min-h-[320px] text-center space-y-4">
                    {/* Plant Stage Visualization */}
                    <div className="w-36 h-36 rounded-full bg-white/95 border-4 border-emerald-400 flex items-center justify-center shadow-lg relative">
                      <span className="text-6xl animate-bounce">
                        {gardenStatus === 'empty' ? '🕳️' : gardenStatus === 'seeded' ? '🌱' : gardenStatus === 'watered' ? '🌿' : targetSeed.flowerIcon}
                      </span>
                    </div>

                    <p className="font-black text-base text-slate-800">
                      {gardenStatus === 'empty'
                        ? 'Hố đất đang chờ gieo hạt giống...'
                        : gardenStatus === 'seeded'
                        ? 'Hạt giống đã nằm trong đất! Hãy dùng bình tưới nước!'
                        : gardenStatus === 'watered'
                        ? 'Mầm cây đang vươn lên xanh mát...'
                        : `🎉 Bông ${targetSeed.nameVi} đã nở bừng rực rỡ!`}
                    </p>

                    {/* Action Trays: Seed Pouches or Watering Can */}
                    {gardenStatus === 'empty' ? (
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        {SEED_POUCHES.map((pouch) => (
                          <button
                            key={pouch.id}
                            onClick={() => handlePlantSeed(pouch)}
                            className="px-5 py-3 rounded-2xl bg-white hover:bg-emerald-50 text-slate-950 font-black text-sm border-2 border-emerald-300 shadow-sm active:scale-95 cursor-pointer flex items-center gap-2"
                          >
                            <span className="text-2xl">{pouch.flowerIcon}</span>
                            <span>{pouch.nameEn}</span>
                          </button>
                        ))}
                      </div>
                    ) : gardenStatus === 'seeded' ? (
                      <button
                        onClick={handleWaterGarden}
                        className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 text-white font-black text-base border-2 border-blue-600 shadow-md active:scale-95 cursor-pointer flex items-center gap-2 animate-bounce"
                      >
                        <Droplets className="w-5 h-5" />
                        <span>TƯỚI NƯỚC BẰNG BÌNH NƯỚC (WATER)</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 9: SPACE LAUNCH (SPACESHIP ASSEMBLY & BLASTOFF)      */}
              {/* ========================================================= */}
              {activeGameId === 'space_rescue' && (
                <div className="space-y-6">
                  <div className="text-center space-y-1">
                    <span className="px-3.5 py-1 rounded-full bg-indigo-100 border border-indigo-300 text-xs font-black text-indigo-950">
                      Bệ Phóng Tên Lửa
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                      Lắp ráp 4 bộ phận vào bệ phóng để cất cánh!
                    </h3>
                  </div>

                  <div className="rounded-3xl bg-slate-950 p-6 sm:p-8 border-2 border-indigo-400 flex flex-col items-center justify-center min-h-[340px] text-white relative overflow-hidden">
                    <div className="absolute top-2 left-6 text-xl opacity-30">✨</div>
                    <div className="absolute bottom-4 right-10 text-xl opacity-30">⭐</div>

                    {/* Rocket Blueprint Frame on Launchpad */}
                    <div className={`flex flex-col items-center gap-1.5 p-4 bg-slate-900/90 rounded-3xl border-2 border-indigo-500/50 shadow-inner ${rocketBlasting ? 'animate-rocket-blastoff' : ''}`}>
                      {ROCKET_COMPONENTS.map((comp) => {
                        const isInstalled = rocketSlotsFilled[comp.slotId];
                        return (
                          <div
                            key={comp.slotId}
                            className={`w-36 h-12 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all ${
                              isInstalled
                                ? 'bg-indigo-600 border-indigo-300 text-white font-black shadow-md'
                                : 'bg-slate-800/80 border-indigo-400/40 text-slate-400'
                            }`}
                          >
                            <span className="text-xl">{comp.icon}</span>
                            <span className="text-xs font-black">{isInstalled ? comp.nameEn : `[ Khung ${comp.nameVi} ]`}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Parts Selection Tray */}
                    {!rocketBlasting && (
                      <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                        {ROCKET_COMPONENTS.map((comp) => (
                          <button
                            key={comp.slotId}
                            onClick={() => handleSnapRocketPart(comp)}
                            disabled={rocketSlotsFilled[comp.slotId] || roundCompleted}
                            className={`px-4 py-2.5 rounded-2xl font-black text-xs border-2 active:scale-95 cursor-pointer flex items-center gap-1.5 transition-all ${
                              rocketSlotsFilled[comp.slotId]
                                ? 'bg-slate-800 text-slate-500 border-slate-700 opacity-40'
                                : 'bg-slate-900 hover:bg-indigo-900 text-white border-indigo-400 shadow-sm'
                            }`}
                          >
                            <span className="text-lg">{comp.icon}</span>
                            <span>{comp.nameVi}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 10: ANIMAL TRAIN                                     */}
              {/* ========================================================= */}
              {activeGameId === 'animal_train' && (
                <div className="space-y-6">
                  <div className="text-center space-y-1">
                    <span className="px-3.5 py-1 rounded-full bg-orange-100 border border-orange-300 text-xs font-black text-orange-950">
                      Chuyến Tàu Động Vật
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                      Mời bạn: <span className="text-orange-600 underline">{targetPassenger.nameVi}</span> ({targetPassenger.nameEn}) lên tàu!
                    </h3>
                  </div>

                  <div className="rounded-3xl bg-amber-50 p-6 sm:p-8 border-2 border-orange-200 flex flex-col items-center justify-center min-h-[300px]">
                    <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border-2 border-orange-300 shadow-sm mb-6">
                      <span className="text-4xl">🚂</span>
                      <div className="w-20 h-20 rounded-xl bg-orange-100 border-2 border-dashed border-orange-400 flex items-center justify-center text-3xl">
                        {boardedPassenger ? boardedPassenger.icon : '❓'}
                      </div>
                      <span className="text-xs font-black text-slate-700">Toa số 1</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg">
                      {TRAIN_PASSENGERS.map((animal) => (
                        <button
                          key={animal.id}
                          onClick={() => handleBoardPassenger(animal)}
                          disabled={boardedPassenger !== null || roundCompleted}
                          className="p-3 rounded-2xl bg-white hover:bg-orange-100 border-2 border-orange-300 active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-1 shadow-sm"
                        >
                          <span className="text-3xl">{animal.icon}</span>
                          <span className="text-xs font-black text-slate-900">{animal.nameEn}</span>
                          <span className="text-[10px] text-slate-500">({animal.nameVi})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 11: WEATHER MACHINE (SKY TRANSFORMATION)             */}
              {/* ========================================================= */}
              {activeGameId === 'weather_adventure' && (
                <div className="space-y-6">
                  <div className="text-center space-y-1">
                    <span className="px-3.5 py-1 rounded-full bg-yellow-100 border border-yellow-300 text-xs font-black text-yellow-950">
                      Cỗ Máy Thời Tiết
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                      Kéo quả cầu để biến bầu trời thành: <span className="text-amber-600 underline">{targetWeatherChoice.nameVi}</span> ({targetWeatherChoice.nameEn})!
                    </h3>
                  </div>

                  <div className={`rounded-3xl p-8 border-2 border-amber-300 min-h-[300px] flex flex-col items-center justify-center transition-all bg-gradient-to-b ${currentSkyWeather.skyClass}`}>
                    <div className="text-7xl mb-4 animate-bounce">
                      {currentSkyWeather.icon}
                    </div>
                    <p className="font-black text-lg mb-6">
                      Bầu trời hiện tại: {currentSkyWeather.nameVi} ({currentSkyWeather.nameEn})
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {WEATHER_CHOICES.map((w) => (
                        <button
                          key={w.id}
                          onClick={() => handleCastWeatherOrb(w)}
                          disabled={roundCompleted}
                          className="p-3.5 rounded-2xl bg-white text-slate-900 hover:bg-amber-100 border-2 border-amber-300 active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-1 shadow-sm"
                        >
                          <span className="text-3xl">{w.icon}</span>
                          <span className="text-xs font-black">{w.nameEn}</span>
                          <span className="text-[10px] text-slate-500">({w.nameVi})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 12: MONSTER SNACK SHOP (FEED MONSTER IN-WORLD)       */}
              {/* ========================================================= */}
              {activeGameId === 'monster_snack_shop' && (
                <div className="space-y-6">
                  <div className="text-center space-y-1">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                      Đút cho quái vật món: <span className="text-pink-600 underline">{targetSnack.nameVi}</span> ({targetSnack.nameEn})!
                    </h3>
                  </div>

                  <div className="rounded-3xl bg-pink-50 p-6 sm:p-8 border-2 border-pink-200 flex flex-col items-center justify-center min-h-[300px]">
                    <div className="w-32 h-32 rounded-3xl bg-white border-3 border-pink-300 flex items-center justify-center shadow-md mb-4">
                      <span className={`text-6xl ${monsterEating ? 'animate-animal-eat' : 'animate-bounce'}`}>
                        {monsterEating ? '😋' : '👾'}
                      </span>
                    </div>
                    <p className="font-black text-base text-slate-800 mb-6">
                      {monsterEating ? 'Măm măm ngon quá! Cảm ơn bé nhé!' : 'Quái vật Pip đang đói bụng chờ ăn...'}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg">
                      {MONSTER_SNACKS.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => handleFeedMonster(s)}
                          disabled={monsterEating || roundCompleted}
                          className="p-3.5 rounded-2xl bg-white text-slate-900 hover:bg-pink-100 border-2 border-pink-300 active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-1 shadow-sm"
                        >
                          <span className="text-3xl">{s.icon}</span>
                          <span className="text-xs font-black">{s.nameEn}</span>
                          <span className="text-[10px] text-slate-500">({s.nameVi})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 13: BUILD MY ROBOT (ROBOT LAB STUDIO)                */}
              {/* ========================================================= */}
              {(activeGameId === 'build_my_robot' || (activeGameId as string) === 'robot_builder') && (
                <div className="space-y-6">
                  {/* Top Mission Header */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border-2 border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-900 font-black shrink-0">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-cyan-500 text-white text-[10px] font-black uppercase tracking-wider">
                            Robot Lab Studio
                          </span>
                          <span className="text-xs font-black text-slate-700">
                            Khung Sườn Cơ Khí
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                          {robotAlive ? (
                            <span className="text-cyan-600 animate-pulse">⚡ SYSTEM ONLINE — MISSION COMPLETE! ⚡</span>
                          ) : (
                            <span>Lắp ráp các bộ phận vào đúng khớp cơ khí</span>
                          )}
                        </h3>
                      </div>
                    </div>

                    {/* Assembly Progress Counter Pill */}
                    <div className="flex items-center gap-2">
                      <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 shadow-xs flex items-center gap-2">
                        <span className="text-xs font-black text-slate-600">Tiến độ:</span>
                        <span className="text-xs font-black text-cyan-600">
                          {Object.values(robotAssembledSlots).filter(Boolean).length} / 6 Linh Kiện
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Main Studio Arena: White / Very Light Gray Background */}
                  <div className="rounded-3xl bg-[#f8fafc] p-6 sm:p-8 border-2 border-slate-200 text-slate-900 flex flex-col items-center justify-center min-h-[440px] relative shadow-sm">
                    {/* View Mode Toggle Switch */}
                    <div className="flex items-center justify-center gap-2 mb-5 z-20">
                      <button
                        type="button"
                        onClick={() => setRobotViewMode('chassis')}
                        className={`px-4 py-2 rounded-2xl font-black text-xs border-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                          robotViewMode === 'chassis'
                            ? 'bg-cyan-500 text-white border-cyan-600 shadow-sm scale-105'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-cyan-300'
                        }`}
                      >
                        <Hammer className="w-3.5 h-3.5" />
                        <span>Khung Lắp Ráp (Kéo Thả)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRobotViewMode('3d')}
                        className={`px-4 py-2 rounded-2xl font-black text-xs border-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                          robotViewMode === '3d'
                            ? 'bg-slate-900 text-white border-slate-950 shadow-sm scale-105'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-cyan-300'
                        }`}
                      >
                        <Bot className="w-3.5 h-3.5" />
                        <span>Phòng Lab 3D Studio (Xoay 360°)</span>
                      </button>
                    </div>

                    {/* MODE 1: 3D ROBOT VIEWER (Sketchfab style with 360 interactive orbit) */}
                    {robotViewMode === '3d' ? (
                      <div className="w-full max-w-lg flex flex-col items-center space-y-2">
                        <KidsRobot3DViewer
                          assembledSlots={robotAssembledSlots}
                          isAlive={robotAlive}
                          className="border-2 border-slate-200 bg-white shadow-md"
                        />
                        <p className="text-xs text-slate-500 font-bold text-center">
                          💡 Dùng ngón tay hoặc chuột kéo để xoay Robot 360 độ ngắm nhìn lớp giáp kim loại!
                        </p>
                      </div>
                    ) : (
                      /* MODE 2: CHASSIS BLUEPRINT WITH ACTIVE DRAG & DROP */
                      <div className={`flex flex-col items-center gap-4 p-6 sm:p-8 bg-white rounded-3xl border-2 border-slate-200 shadow-sm max-w-lg w-full transition-all ${
                        robotAlive ? 'ring-4 ring-cyan-400 bg-cyan-50/40' : ''
                      }`}>
                        {/* 1. HEAD SLOT */}
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setHoveredRobotSlotKey('head');
                          }}
                          onDragLeave={() => setHoveredRobotSlotKey(null)}
                          onDrop={(e) => {
                            e.preventDefault();
                            const key = e.dataTransfer.getData('text/plain') || draggingRobotKey;
                            setHoveredRobotSlotKey(null);
                            setDraggingRobotKey(null);
                            const p = ROBOT_CHASSIS_PARTS.find((x) => x.slotKey === key);
                            if (key === 'head' && p) {
                              handleSnapRobotChassisPart(p);
                            } else {
                              triggerWrongAnswer('Vị trí này chỉ lắp được Đầu Robot!');
                            }
                          }}
                          onClick={() => handleSnapRobotChassisPart(ROBOT_CHASSIS_PARTS[0])}
                          className={`w-32 h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                            robotAssembledSlots.head
                              ? 'bg-slate-900 border-cyan-400 text-white font-black shadow-md'
                              : hoveredRobotSlotKey === 'head' || robotActiveTargetKey === 'head'
                              ? 'border-cyan-400 bg-cyan-50 text-cyan-700 ring-4 ring-cyan-300 animate-pulse'
                              : 'border-slate-300 bg-slate-50 text-slate-400 hover:border-cyan-300'
                          }`}
                        >
                          {robotAssembledSlots.head ? (
                            <HeroRobotHead size={70} />
                          ) : (
                            <div className="text-center">
                              <span className="text-2xl">⚡</span>
                              <span className="text-[10px] font-black uppercase tracking-wider block mt-0.5 text-slate-500">
                                [ KHỚP ĐẦU ]
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 2. MIDDLE ROW: [ LEFT ARM ] [ BODY ENGINE ] [ RIGHT ARM ] */}
                        <div className="flex items-center justify-center gap-4 w-full">
                          {/* Left Arm Slot */}
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              setHoveredRobotSlotKey('left_arm');
                            }}
                            onDragLeave={() => setHoveredRobotSlotKey(null)}
                            onDrop={(e) => {
                              e.preventDefault();
                              const key = e.dataTransfer.getData('text/plain') || draggingRobotKey;
                              setHoveredRobotSlotKey(null);
                              setDraggingRobotKey(null);
                              const p = ROBOT_CHASSIS_PARTS.find((x) => x.slotKey === key);
                              if (key === 'left_arm' && p) {
                                handleSnapRobotChassisPart(p);
                              } else {
                                triggerWrongAnswer('Vị trí này chỉ lắp được Tay Trái!');
                              }
                            }}
                            onClick={() => handleSnapRobotChassisPart(ROBOT_CHASSIS_PARTS[1])}
                            className={`w-24 h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                              robotAssembledSlots.left_arm
                                ? 'bg-slate-900 border-cyan-400 text-white font-black shadow-md'
                                : hoveredRobotSlotKey === 'left_arm'
                                ? 'border-cyan-400 bg-cyan-50 text-cyan-700 ring-4 ring-cyan-300 animate-pulse'
                                : 'border-slate-300 bg-slate-50 text-slate-400 hover:border-cyan-300'
                            }`}
                          >
                            {robotAssembledSlots.left_arm ? (
                              <HeroRobotArm size={65} isLeft={true} />
                            ) : (
                              <div className="text-center">
                                <span className="text-xl">⟨</span>
                                <span className="text-[9px] font-bold text-slate-500 block mt-0.5">
                                  [ TAY TRÁI ]
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Body Torso / Core Engine Slot */}
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              setHoveredRobotSlotKey('body');
                            }}
                            onDragLeave={() => setHoveredRobotSlotKey(null)}
                            onDrop={(e) => {
                              e.preventDefault();
                              const key = e.dataTransfer.getData('text/plain') || draggingRobotKey;
                              setHoveredRobotSlotKey(null);
                              setDraggingRobotKey(null);
                              const p = ROBOT_CHASSIS_PARTS.find((x) => x.slotKey === key);
                              if (key === 'body' && p) {
                                handleSnapRobotChassisPart(p);
                              } else {
                                triggerWrongAnswer('Vị trí này chỉ lắp được Thân Robot!');
                              }
                            }}
                            onClick={() => handleSnapRobotChassisPart(ROBOT_CHASSIS_PARTS[2])}
                            className={`w-32 h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                              robotAssembledSlots.body
                                ? 'bg-slate-900 border-cyan-400 text-white font-black shadow-md'
                                : hoveredRobotSlotKey === 'body'
                                ? 'border-cyan-400 bg-cyan-50 text-cyan-700 ring-4 ring-cyan-300 animate-pulse'
                                : 'border-slate-300 bg-slate-50 text-slate-400 hover:border-cyan-300'
                            }`}
                          >
                            {robotAssembledSlots.body ? (
                              <HeroRobotChest size={85} />
                            ) : (
                              <div className="text-center">
                                <span className="text-2xl">⚙️</span>
                                <span className="text-[10px] font-black uppercase text-slate-500 block mt-0.5">
                                  [ LÒNG NGỰC ]
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Right Arm Slot */}
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              setHoveredRobotSlotKey('right_arm');
                            }}
                            onDragLeave={() => setHoveredRobotSlotKey(null)}
                            onDrop={(e) => {
                              e.preventDefault();
                              const key = e.dataTransfer.getData('text/plain') || draggingRobotKey;
                              setHoveredRobotSlotKey(null);
                              setDraggingRobotKey(null);
                              const p = ROBOT_CHASSIS_PARTS.find((x) => x.slotKey === key);
                              if (key === 'right_arm' && p) {
                                handleSnapRobotChassisPart(p);
                              } else {
                                triggerWrongAnswer('Vị trí này chỉ lắp được Tay Phải!');
                              }
                            }}
                            onClick={() => handleSnapRobotChassisPart(ROBOT_CHASSIS_PARTS[3])}
                            className={`w-24 h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                              robotAssembledSlots.right_arm
                                ? 'bg-slate-900 border-cyan-400 text-white font-black shadow-md'
                                : hoveredRobotSlotKey === 'right_arm'
                                ? 'border-cyan-400 bg-cyan-50 text-cyan-700 ring-4 ring-cyan-300 animate-pulse'
                                : 'border-slate-300 bg-slate-50 text-slate-400 hover:border-cyan-300'
                            }`}
                          >
                            {robotAssembledSlots.right_arm ? (
                              <HeroRobotArm size={65} isLeft={false} />
                            ) : (
                              <div className="text-center">
                                <span className="text-xl">⟩</span>
                                <span className="text-[9px] font-bold text-slate-500 block mt-0.5">
                                  [ TAY PHẢI ]
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 3. BOTTOM ROW: [ LEFT LEG ] [ RIGHT LEG ] */}
                        <div className="flex items-center justify-center gap-8">
                          {/* Left Leg Slot */}
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              setHoveredRobotSlotKey('left_leg');
                            }}
                            onDragLeave={() => setHoveredRobotSlotKey(null)}
                            onDrop={(e) => {
                              e.preventDefault();
                              const key = e.dataTransfer.getData('text/plain') || draggingRobotKey;
                              setHoveredRobotSlotKey(null);
                              setDraggingRobotKey(null);
                              const p = ROBOT_CHASSIS_PARTS.find((x) => x.slotKey === key);
                              if (key === 'left_leg' && p) {
                                handleSnapRobotChassisPart(p);
                              } else {
                                triggerWrongAnswer('Vị trí này chỉ lắp được Chân Trái!');
                              }
                            }}
                            onClick={() => handleSnapRobotChassisPart(ROBOT_CHASSIS_PARTS[4])}
                            className={`w-24 h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                              robotAssembledSlots.left_leg
                                ? 'bg-slate-900 border-cyan-400 text-white font-black shadow-md'
                                : hoveredRobotSlotKey === 'left_leg'
                                ? 'border-cyan-400 bg-cyan-50 text-cyan-700 ring-4 ring-cyan-300 animate-pulse'
                                : 'border-slate-300 bg-slate-50 text-slate-400 hover:border-cyan-300'
                            }`}
                          >
                            {robotAssembledSlots.left_leg ? (
                              <HeroRobotLeg size={75} />
                            ) : (
                              <div className="text-center">
                                <span className="text-xl">||</span>
                                <span className="text-[9px] font-bold text-slate-500 block mt-0.5">
                                  [ CHÂN TRÁI ]
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Right Leg Slot */}
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              setHoveredRobotSlotKey('right_leg');
                            }}
                            onDragLeave={() => setHoveredRobotSlotKey(null)}
                            onDrop={(e) => {
                              e.preventDefault();
                              const key = e.dataTransfer.getData('text/plain') || draggingRobotKey;
                              setHoveredRobotSlotKey(null);
                              setDraggingRobotKey(null);
                              const p = ROBOT_CHASSIS_PARTS.find((x) => x.slotKey === key);
                              if (key === 'right_leg' && p) {
                                handleSnapRobotChassisPart(p);
                              } else {
                                triggerWrongAnswer('Vị trí này chỉ lắp được Chân Phải!');
                              }
                            }}
                            onClick={() => handleSnapRobotChassisPart(ROBOT_CHASSIS_PARTS[5])}
                            className={`w-24 h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                              robotAssembledSlots.right_leg
                                ? 'bg-slate-900 border-cyan-400 text-white font-black shadow-md'
                                : hoveredRobotSlotKey === 'right_leg'
                                ? 'border-cyan-400 bg-cyan-50 text-cyan-700 ring-4 ring-cyan-300 animate-pulse'
                                : 'border-slate-300 bg-slate-50 text-slate-400 hover:border-cyan-300'
                            }`}
                          >
                            {robotAssembledSlots.right_leg ? (
                              <HeroRobotLeg size={75} />
                            ) : (
                              <div className="text-center">
                                <span className="text-xl">||</span>
                                <span className="text-[9px] font-bold text-slate-500 block mt-0.5">
                                  [ CHÂN PHẢI ]
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PARTS TRAY BELOW CHASSIS (DRAGGABLE PIECES) */}
                    {!robotAlive && (
                      <div className="mt-6 space-y-2 w-full max-w-xl text-center">
                        <p className="text-xs font-black uppercase text-slate-500 tracking-wider">
                          Kéo linh kiện thả vào đúng khớp cơ khí:
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                          {ROBOT_CHASSIS_PARTS.map((part) => {
                            const isInstalled = robotAssembledSlots[part.slotKey];
                            return (
                              <button
                                key={part.slotKey}
                                draggable={!isInstalled && !roundCompleted}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', part.slotKey);
                                  setDraggingRobotKey(part.slotKey);
                                }}
                                onDragEnd={() => {
                                  setDraggingRobotKey(null);
                                  setHoveredRobotSlotKey(null);
                                }}
                                onClick={() => handleSnapRobotChassisPart(part)}
                                disabled={isInstalled || roundCompleted}
                                className={`p-3 rounded-2xl font-black text-xs border-2 active:scale-95 cursor-grab active:cursor-grabbing flex flex-col items-center justify-center gap-1.5 transition-all ${
                                  isInstalled
                                    ? 'bg-slate-100 text-slate-400 border-slate-200 opacity-40 cursor-not-allowed'
                                    : 'bg-white hover:bg-cyan-50 text-slate-800 border-slate-300 hover:border-cyan-400 shadow-sm hover:scale-105'
                                }`}
                              >
                                {part.slotKey === 'head' && <HeroRobotHead size={40} />}
                                {part.slotKey === 'left_arm' && <HeroRobotArm size={38} isLeft={true} />}
                                {part.slotKey === 'body' && <HeroRobotChest size={40} />}
                                {part.slotKey === 'right_arm' && <HeroRobotArm size={38} isLeft={false} />}
                                {(part.slotKey === 'left_leg' || part.slotKey === 'right_leg') && <HeroRobotLeg size={40} />}
                                <span className="text-[10px] font-extrabold truncate w-full text-center">
                                  {part.nameVi}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}


              {/* ========================================================= */}
              {/* GAME 14: MAGIC STORYBOOK (MAGNIFYING GLASS DISCOVERY)     */}
              {/* ========================================================= */}
              {activeGameId === 'magic_storybook' && (
                <div className="space-y-6">
                  <div className="text-center space-y-1">
                    <span className="px-3.5 py-1 rounded-full bg-purple-100 border border-purple-300 text-xs font-black text-purple-950">
                      Sách Truyện Phép Thuật
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                      {STORY_SCENES[currentStoryIdx].titleVi}
                    </h3>
                  </div>

                  <div className="rounded-3xl bg-amber-50 p-6 sm:p-8 border-4 border-amber-300 flex flex-col items-center justify-center min-h-[320px] text-center">
                    <div className="w-40 h-32 rounded-2xl bg-white border-2 border-amber-300 flex items-center justify-center shadow-md mb-4 text-5xl">
                      📖
                    </div>
                    <p className="font-black text-base text-purple-950 mb-6">
                      Dùng kính lúp tìm: <span className="text-purple-600 underline">{STORY_SCENES[currentStoryIdx].targetVi}</span> ({STORY_SCENES[currentStoryIdx].targetEn})!
                    </p>

                    <button
                      onClick={handleDiscoverStoryItem}
                      disabled={storyFound || roundCompleted}
                      className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-black text-base border-2 border-purple-400 shadow-md active:scale-95 cursor-pointer flex items-center gap-2 animate-bounce"
                    >
                      <Search className="w-5 h-5" />
                      <span>{storyFound ? 'ĐÃ TÌM THẤY! ✨' : `SOI KÍNH LÚP TÌM ${STORY_SCENES[currentStoryIdx].targetVi.toUpperCase()}`}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 15: DINOSAUR DIG (EXCAVATION WITH ROCK FRACTURES)   */}
              {/* ========================================================= */}
              {activeGameId === 'dinosaur_dig' && (
                <div className="space-y-6">
                  <div className="text-center space-y-1">
                    <span className="px-3.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-xs font-black text-amber-950">
                      ⛏️ Khai Quật Hóa Thạch Khủng Long
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                      {dinoAlive ? '🦖 KHỦNG LONG T-REX HỒI SINH!' : 'Chạm Búa ⛏️ Đập Vỡ Đá Trầm Tích'}
                    </h3>
                    <p className="text-xs font-bold text-slate-600">
                      {dinoAlive
                        ? 'Tuyệt đỉnh! Toàn bộ khung xương hóa thạch đã thức tỉnh sống động!'
                        : 'Mỗi tảng đá cần 2 nhát búa: Nhát 1 làm nứt đá, nhát 2 phát lộ xương cổ đại!'}
                    </p>
                  </div>

                  {/* Prehistoric Excavation Trench */}
                  <div className="rounded-3xl bg-gradient-to-b from-amber-950 via-stone-900 to-stone-950 p-6 sm:p-8 border-4 border-amber-600 shadow-2xl relative overflow-hidden flex flex-col items-center">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-200 via-stone-500 to-transparent pointer-events-none" />

                    {/* REVIVED T-REX SHOWCASE */}
                    {dinoAlive ? (
                      <div className="py-6 flex flex-col items-center justify-center text-center space-y-4 animate-bounce">
                        <div className="relative">
                          <div className="w-36 h-36 rounded-full bg-amber-500/20 border-4 border-amber-400 flex items-center justify-center text-7xl shadow-[0_0_50px_rgba(245,158,11,0.5)] animate-pulse">
                            🦖
                          </div>
                          <span className="absolute -top-2 -right-2 px-3 py-1 rounded-full bg-amber-400 text-amber-950 font-black text-xs shadow-md">
                            ROAAR!
                          </span>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-2xl sm:text-3xl font-black text-amber-300 tracking-wide">
                            TYRANNOSAURUS REX
                          </h4>
                          <p className="text-xs sm:text-sm font-bold text-amber-100 max-w-sm">
                            Bé đã ghép hoàn thiện Hộp sọ, Cột sống, Lồng ngực và Đốt đuôi của chúa tể săn mồi!
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* EXCAVATION GRID (4 ROCK TRENCHES) */
                      <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-md relative z-10">
                        {DINO_PARTS_CONFIG.map((part) => {
                          const hits = dinoFossilSlots[part.slotKey] || 0;
                          const isCracked = hits === 1;
                          const isUnearthed = hits >= 2;

                          return (
                            <div
                              key={part.slotKey}
                              onClick={() => handleExcavateRock(part.slotKey)}
                              className={`relative rounded-2xl p-4 flex flex-col items-center justify-center min-h-[140px] cursor-pointer transition-all duration-300 select-none border-3 ${
                                isUnearthed
                                  ? 'bg-amber-900/60 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-102'
                                  : isCracked
                                  ? 'bg-stone-800 border-amber-500/80 ring-2 ring-amber-400 animate-pulse active:scale-95'
                                  : 'bg-stone-800/90 hover:bg-stone-700 border-stone-600 hover:border-amber-400 active:scale-95 shadow-md'
                              }`}
                            >
                              {/* Unearthed Fossil Bone */}
                              {isUnearthed ? (
                                <div className="flex flex-col items-center justify-center text-center space-y-1 animate-scaleIn">
                                  <span className="text-4xl filter drop-shadow-md">{part.icon}</span>
                                  <span className="text-xs font-black text-amber-300 mt-1">{part.nameEn}</span>
                                  <span className="text-[10px] font-bold text-amber-200/80">{part.nameVi}</span>
                                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-400/30 text-amber-300 font-bold mt-1">
                                    ĐÃ KHAI QUẬT ✨
                                  </span>
                                </div>
                              ) : isCracked ? (
                                /* Cracked Rock Layer with Deep Fissures */
                                <div className="flex flex-col items-center justify-center text-center space-y-2">
                                  <div className="relative text-4xl">
                                    <span className="filter grayscale contrast-150">🪨</span>
                                    <span className="absolute inset-0 flex items-center justify-center text-amber-400 font-black text-2xl">
                                      ⚡
                                    </span>
                                  </div>
                                  <span className="text-[11px] font-black text-amber-400">ĐÁ ĐANG NỨT!</span>
                                  <span className="text-[9px] font-bold text-slate-400">Chạm thêm để đập vỡ ⛏️</span>
                                </div>
                              ) : (
                                /* Solid Untouched Limestone Rock */
                                <div className="flex flex-col items-center justify-center text-center space-y-2">
                                  <span className="text-4xl opacity-80">🪨</span>
                                  <span className="text-xs font-black text-slate-300">{part.nameVi}</span>
                                  <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-700/60">
                                    <Hammer className="w-3 h-3 text-amber-400" />
                                    <span>Đập đá</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Progress Bar of Unearthed Fossils */}
                    <div className="mt-6 w-full max-w-md bg-stone-800/80 rounded-full p-1.5 border border-amber-600/50 flex items-center gap-2">
                      <span className="text-[10px] font-black text-amber-400 pl-2">HÓA THẠCH:</span>
                      <div className="flex-1 bg-stone-900 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-500 rounded-full"
                          style={{
                            width: `${(Object.values(dinoFossilSlots).filter((h) => h >= 2).length / 4) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-black text-amber-300 pr-2">
                        {Object.values(dinoFossilSlots).filter((h) => h >= 2).length}/4
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* GAME 16: MAGIC DOOR (RUNIC PORTAL & 3D REVOLVING DOOR)     */}
              {/* ========================================================= */}
              {activeGameId === 'magic_door' && (
                <div className="space-y-6">
                  <div className="text-center space-y-1">
                    <span className="px-3.5 py-1 rounded-full bg-violet-100 border border-violet-300 text-xs font-black text-violet-950">
                      🚪 Cánh Cửa Phép Thuật Không Gian
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                      {doorUnlocked ? 'CÁNH CỬA ĐÃ MỞ TOANG! ✨' : `Tra ${targetRuneKey.wordVi} Vào Ổ Khóa Cổ Đại`}
                    </h3>
                    <p className="text-xs font-bold text-slate-600">
                      {doorUnlocked
                        ? `Chào mừng bé bước sang thế giới tri thức tiếp theo!`
                        : `Lắng nghe Bobby và chọn đúng chìa: "${targetRuneKey.wordEn}"!`}
                    </p>
                  </div>

                  {/* Mystical Portal Chamber */}
                  <div className="rounded-3xl bg-gradient-to-b from-indigo-950 via-slate-900 to-purple-950 p-6 sm:p-8 border-4 border-violet-500 shadow-2xl relative overflow-hidden flex flex-col items-center">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-400 via-indigo-600 to-transparent pointer-events-none" />

                    {/* THE ANCIENT RUNIC DOOR ARCHWAY */}
                    <div className="relative w-64 sm:w-72 h-80 rounded-t-full bg-indigo-900/50 border-4 border-violet-400 shadow-[0_0_40px_rgba(139,92,246,0.4)] flex flex-col items-center justify-center overflow-hidden">
                      {/* Swirling celestial portal inside door when unlocked */}
                      {doorUnlocked ? (
                        <div className="absolute inset-0 bg-gradient-to-b from-violet-600 via-fuchsia-500 to-amber-300 flex flex-col items-center justify-center text-center p-4 animate-fadeIn">
                          <div className="w-24 h-24 rounded-full bg-white/30 border-4 border-white flex items-center justify-center text-5xl shadow-[0_0_40px_white] animate-spin">
                            🌌
                          </div>
                          <span className="text-white font-black text-base mt-4 drop-shadow-md">
                            NEXT REALM UNLOCKED!
                          </span>
                          <span className="text-white/90 text-xs font-bold">Thế giới diệu kỳ đón chào bé</span>
                        </div>
                      ) : (
                        /* Closed Heavy Mystical Door with Glowing Lock Socket */
                        <div
                          className={`w-full h-full flex flex-col items-center justify-center p-4 transition-transform duration-700 ${
                            doorUnlocked ? 'scale-0 opacity-0' : ''
                          }`}
                        >
                          {/* Mystical Carvings & Rune Symbols */}
                          <div className="flex items-center justify-between w-full px-6 opacity-60 text-lg">
                            <span>ᛟ</span>
                            <span>✦</span>
                            <span>ᚱ</span>
                          </div>

                          {/* Giant Mystical Keyhole Socket */}
                          <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const keyId = e.dataTransfer.getData('text/plain');
                              const k = MAGIC_RUNE_KEYS.find((x) => x.id === keyId);
                              if (k) handleUnlockMagicDoor(k);
                            }}
                            className={`w-28 h-28 rounded-full border-4 border-dashed flex flex-col items-center justify-center my-4 transition-all ${
                              doorKeyInserted
                                ? 'bg-violet-600 border-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.6)]'
                                : 'border-violet-300/80 bg-violet-950/80 ring-2 ring-violet-400 animate-pulse'
                            }`}
                          >
                            {doorKeyInserted ? (
                              <span className={`text-4xl ${keyRotating ? 'animate-spin' : ''}`}>
                                {targetRuneKey.symbol}
                              </span>
                            ) : (
                              <>
                                <Key className="w-8 h-8 text-violet-300 animate-bounce" />
                                <span className="text-[9px] font-black text-violet-200 mt-1 uppercase">Ổ KHÓA</span>
                              </>
                            )}
                          </div>

                          <div className="flex items-center justify-between w-full px-6 opacity-60 text-lg">
                            <span>ᚦ</span>
                            <span>✦</span>
                            <span>ᛝ</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* RUNE KEYS TRAY (DRAGGABLE / CLICKABLE KEYS) */}
                    {!doorUnlocked && (
                      <div className="mt-6 space-y-2 w-full max-w-md text-center relative z-10">
                        <p className="text-xs font-black uppercase text-violet-300 tracking-wider">
                          Kéo chìa khóa tra vào ổ hoặc chạm trực tiếp:
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          {MAGIC_RUNE_KEYS.map((key) => {
                            return (
                              <button
                                key={key.id}
                                draggable={!roundCompleted && !doorUnlocked}
                                onDragStart={(e) => e.dataTransfer.setData('text/plain', key.id)}
                                onClick={() => handleUnlockMagicDoor(key)}
                                disabled={roundCompleted || doorUnlocked}
                                className={`px-4 py-2.5 rounded-2xl font-black text-xs border-2 active:scale-95 cursor-grab active:cursor-grabbing flex items-center gap-2 transition-all bg-gradient-to-r ${key.bgGradient} ${key.borderColor} text-white shadow-lg hover:scale-105`}
                              >
                                <span className="text-xl">{key.symbol}</span>
                                <span>{key.wordEn}</span>
                                <span className="text-[10px] opacity-90">({key.wordVi})</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
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
    </div>
  );
};

export default KidsGamesPage;
