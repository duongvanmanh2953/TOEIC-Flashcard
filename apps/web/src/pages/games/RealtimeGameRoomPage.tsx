import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useLearning } from '../../contexts/LearningContext';
import { getLanguage } from '../../config/languages';
import {
  Gamepad2,
  Clock,
  Zap,
  Flame,
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Award,
  Crown,
  Volume2,
  VolumeX,
  Headphones,
  Send,
  Copy,
  Check,
  UserMinus,
  MessageSquare,
  Share2,
  Users,
  Video,
  Radio,
  Eye,
  EyeOff,
  Settings,
  Play,
  Pause,
  SkipForward,
  QrCode,
  Maximize2,
  Minimize2,
  CheckCircle,
  BarChart3,
  HelpCircle,
  TrendingUp,
  X,
  Tv,
  Plus,
  Loader2,
  Lightbulb,
  BookOpen,
  GraduationCap,
  Monitor,
  Smartphone,
  Bookmark,
  Sliders,
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import {
  playCorrectSound,
  playWrongSound,
  playRoomEnterSound,
  playGameStartSound,
  playQuestionTransitionSound,
  playCountdownTickSound,
  playVictoryFanfare,
  liveBgmEngine,
  TikTokLogo,
  TikTokColorLogo,
  ArenaHeader,
  QuestionCard,
  AnswerCard,
  AnswerCardState,
  CountdownRing,
  MatchProgress,
  PlayerAvatar,
  RankBadge,
  StreakIndicator,
  MultiplierBadge,
  ArenaPodium,
  ArenaLeaderboard,
  ActivityFeed,
  ActivityEvent,
  RoundResultModal,
  WinnerCelebration,
  ArenaIconHeart,
  ArenaIconSwords,
  ArenaScoringEngine,
  ARENA_THEME,
  ARENA_MODES_CONFIG,
  VocabularyReviewItem,
} from '@vocabflow/shared';
import { CountryFlag } from '../../components/language/CountryFlag';
import { audioEngine } from '../../lib/audioEngine';

interface RoomPlayer {
  userId: string;
  displayName: string;
  avatar: string;
  score: number;
  roundScore?: number;
  streak: number;
  bestStreak: number;
  correctCount: number;
  latencyMs: number;
  rank: number;
  lastResponseTimeMs: number;
  isReady?: boolean;
  isHost?: boolean;
}

interface QuestionData {
  id: string;
  prompt: string;
  direction: string;
  category: string;
  audioUrl?: string;
  options?: string[];
  correctOptionIndex?: number;
  languageCode?: string;
  questionType?: string;
  phonetic?: string;
  targetWord?: string;
  hint?: string;
}

interface AnswerEvaluation {
  isCorrect: boolean;
  accuracy: number;
  score: number;
  speedBonus: number;
  streakBonus: number;
  feedbackText: string;
  matchedAnswer?: string;
}

interface LiveCommentItem {
  eventId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  commentText: string;
  parsedOption?: string;
  timestamp: number;
  isCorrect?: boolean;
  scoreAdded?: number;
  totalScore?: number;
  rank?: number;
}

export const RealtimeGameRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const gameMode = searchParams.get('mode') || 'TRANSLATION_RUSH';
  const urlLang = searchParams.get('lang');
  const viewParam = searchParams.get('view');
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  const { activeLanguage } = useLearning();
  const { t } = useTranslation();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomCode, setRoomCode] = useState<string>(roomId || '');
  const [roomTitle, setRoomTitle] = useState<string>('VocabFlow Arena');
  const [roomLanguageId, setRoomLanguageId] = useState<string>(urlLang || activeLanguage?.id || 'zh');
  const [isLiveRoom, setIsLiveRoom] = useState<boolean>(false);
  const [roomStatus, setRoomStatus] = useState<string>('WAITING');
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [totalRounds, setTotalRounds] = useState<number>(10);
  const [countdown, setCountdown] = useState<number | null>(null);

  // 2 Distinct Modes: 'STUDY' (Học Thường - Không comment, tập trung cao độ) vs 'LIVE' (TikTok Livestream Game Show)
  const isInitiallyLive =
    searchParams.get('type') === 'live' ||
    searchParams.get('live') === '1' ||
    roomId?.toUpperCase().includes('LIVE') ||
    roomId?.toUpperCase().includes('TIKTOK');

  const [roomMode, setRoomMode] = useState<'STUDY' | 'LIVE'>(isInitiallyLive ? 'LIVE' : 'STUDY');

  // Stream Aspect Ratio preview: 9:16 Vertical (Mobile Live TikTok) vs 16:9 Landscape (Desktop Studio)
  const [streamAspectRatio, setStreamAspectRatio] = useState<'16:9' | '9:16'>('9:16');
  const [showLiveChatOverlay, setShowLiveChatOverlay] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Top Container ref for fullscreen handling
  const roomPageRef = useRef<HTMLDivElement>(null);

  // Audio & Word Hints
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [showWordPeek, setShowWordPeek] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isCheckingAnswer, setIsCheckingAnswer] = useState<boolean>(false);
  const [submissionReflexMs, setSubmissionReflexMs] = useState<number | null>(null);

  // Round State
  const inputRef = useRef<HTMLInputElement>(null);
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [roundDuration, setRoundDuration] = useState<number>(15);
  const [timerRemaining, setTimerRemaining] = useState<number>(15);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [answerInput, setAnswerInput] = useState<string>('');
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [roundSummary, setRoundSummary] = useState<{
    correctAnswer?: string;
    correctOptionIndex?: number;
    explanation?: string;
  } | null>(null);

  // Round Stats & Live Audience Voting Distribution (TikTok Live Mode only)
  const [roundAnswerCount, setRoundAnswerCount] = useState<number>(0);
  const [optionVotes, setOptionVotes] = useState<Record<string, number>>({ A: 0, B: 0, C: 0, D: 0 });

  // Players & Live Ranking
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [myPlayer, setMyPlayer] = useState<RoomPlayer | null>(null);

  // TikTok Live Configuration & Adapter State
  const [liveStatus, setLiveStatus] = useState<{
    status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'MOCK_ACTIVE' | 'ERROR';
    provider: 'MOCK' | 'TIKTOK_LIVE';
    channelName?: string;
    roomId?: string;
    message?: string;
  }>({
    status: 'MOCK_ACTIVE',
    provider: 'MOCK',
    channelName: 'vocabflow_live',
    message: 'Chế độ mô phỏng comment khán giả đang hoạt động.',
  });
  const [liveComments, setLiveComments] = useState<LiveCommentItem[]>([]);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState<boolean>(false);
  const [targetChannelInput, setTargetChannelInput] = useState<string>('');
  const [liveRoomIdInput, setLiveRoomIdInput] = useState<string>('');
  const [sessionTokenInput, setSessionTokenInput] = useState<string>('');
  const [selectedLiveProvider, setSelectedLiveProvider] = useState<'MOCK' | 'TIKTOK_LIVE'>('TIKTOK_LIVE');
  const [customCommentText, setCustomCommentText] = useState<string>('');
  const [isBgmActive, setIsBgmActive] = useState<boolean>(false);
  const [bgmVolume, setBgmVolume] = useState<number>(0.15);

  // Arena Competitive Modes & State
  const [lives, setLives] = useState<number>(3);
  const [isEliminated, setIsEliminated] = useState<boolean>(false);
  const [team, setTeam] = useState<'RED' | 'BLUE'>('RED');
  const [teamRedScore, setTeamRedScore] = useState<number>(0);
  const [teamBlueScore, setTeamBlueScore] = useState<number>(0);
  const [matchVocabs, setMatchVocabs] = useState<VocabularyReviewItem[]>([]);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);

  // Final Results
  const [finalResult, setFinalResult] = useState<{
    ranking: RoomPlayer[];
    top3: { first: RoomPlayer | null; second: RoomPlayer | null; third: RoomPlayer | null };
  } | null>(null);

  // Connection State
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Share & Copy states
  const [isCopiedCode, setIsCopiedCode] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isCopiedStreamUrl, setIsCopiedStreamUrl] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [savedWordsNotice, setSavedWordsNotice] = useState<string | null>(null);

  // Dynamic game type detection
  const isListeningGame = useMemo(() => {
    return (
      gameMode === 'LISTENING_RUSH' ||
      question?.questionType === 'LISTENING_CHALLENGE' ||
      Boolean(question?.audioUrl)
    );
  }, [gameMode, question]);

  const isFillBlankGame = useMemo(() => {
    return (
      gameMode === 'MISSING_WORD' ||
      gameMode === 'SENTENCE_SPRINT' ||
      gameMode === 'FIX_SENTENCE' ||
      gameMode === 'GUESS_WORD' ||
      question?.questionType === 'MISSING_WORD' ||
      question?.questionType === 'SPELLING_CHALLENGE' ||
      (!question?.options || question.options.length < 2)
    );
  }, [gameMode, question]);

  // Language definition
  const currentLangDef = useMemo(() => {
    return getLanguage(question?.languageCode || roomLanguageId) || activeLanguage;
  }, [question?.languageCode, roomLanguageId, activeLanguage]);

  // Auto-unlock audio engine on user interaction
  useEffect(() => {
    const unlock = () => {
      audioEngine.unlockAudio();
    };
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
    audioEngine.unlockAudio();
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  const copyRoomCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setIsCopiedCode(true);
    setTimeout(() => setIsCopiedCode(false), 2000);
  };

  // Setup Socket.IO connection
  useEffect(() => {
    const socketUrl =
      import.meta.env.VITE_WS_URL ||
      import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '')?.replace('/api', '') ||
      'http://localhost:4000';

    const s = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    s.on('connect', () => {
      setIsConnected(true);
      const isCustomRoom = roomId && !roomId.startsWith('auto_');
      const targetLang = urlLang || activeLanguage?.id || 'zh';

      if (isCustomRoom) {
        s.emit('room:join_custom', {
          roomCode: roomId,
          userId: user?.id || `anon_${Math.random().toString(36).slice(2, 7)}`,
          displayName: user?.displayName || 'Learner',
          avatar: user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id || 'guest'}`,
          languageId: targetLang,
        });
      } else {
        s.emit('join_game', {
          gameMode,
          userId: user?.id || `anon_${Math.random().toString(36).slice(2, 7)}`,
          displayName: user?.displayName || 'Learner',
          avatar: user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id || 'guest'}`,
          languageId: targetLang,
        });
      }
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    // Custom Room Joined
    s.on('room:joined_success', (data: any) => {
      setRoomCode(data.roomCode);
      setRoomTitle(data.title);
      setRoomStatus(data.status);
      setTotalRounds(data.totalRounds);
      setMyPlayer(data.player);
      if (data.languageId) setRoomLanguageId(data.languageId);
      if (data.isLiveMode) {
        setIsLiveRoom(true);
        setRoomMode('LIVE');
      }
      if (data.liveStatus) setLiveStatus(data.liveStatus);
      if (data.players) setPlayers(data.players);
      if (data.player?.isHost) setIsHost(true);
      if (data.roundAnswerCount) setRoundAnswerCount(data.roundAnswerCount);
    });

    s.on('room:player_joined', (data: any) => {
      if (data.players) setPlayers(data.players);
    });

    s.on('room:player_ready_changed', (data: { userId: string; isReady: boolean }) => {
      setPlayers((prev) =>
        prev.map((p) => (p.userId === data.userId ? { ...p, isReady: data.isReady } : p)),
      );
      if (user?.id === data.userId) {
        setIsReady(data.isReady);
      }
    });

    s.on('room:starting_countdown', (data: { countdownSec: number }) => {
      setRoomStatus('STARTING');
      setCountdown(data.countdownSec);
    });

    s.on('room:player_kicked', (data: { targetUserId: string }) => {
      if (data.targetUserId === user?.id) {
        alert('Bạn đã bị chủ phòng mời ra khỏi phòng thi đấu.');
        navigate('/games');
      } else {
        setPlayers((prev) => prev.filter((p) => p.userId !== data.targetUserId));
      }
    });

    s.on('joined_game_room', (data: any) => {
      setRoomCode(data.roomCode);
      setRoomTitle(data.title);
      setRoomStatus(data.status);
      setTotalRounds(data.totalRounds);
      if (data.languageId) setRoomLanguageId(data.languageId);
      setMyPlayer(data.player);
      setPlayers(data.ranking || []);
    });

    s.on('player_joined', (data: any) => {
      setPlayers(data.ranking || []);
    });

    s.on('game_starting_countdown', (data: { secondsRemaining: number }) => {
      setRoomStatus('STARTING');
      setCountdown(data.secondsRemaining);
    });

    // Round Started
    s.on('round_started', (data: any) => {
      setRoomStatus('IN_ROUND');
      setCountdown(null);
      setCurrentRound(data.round);
      setTotalRounds(data.totalRounds);
      setQuestion(data.question);
      if (data.question?.languageCode) setRoomLanguageId(data.question.languageCode);
      const duration = Math.min(15, data.durationSec || 15);
      setRoundDuration(duration);
      setTimerRemaining(duration);
      setAnswerInput('');
      setSelectedOptionIndex(null);
      setHasSubmitted(false);
      setEvaluation(null);
      setRoundSummary(null);
      setRoundAnswerCount(0);
      setOptionVotes({ A: 0, B: 0, C: 0, D: 0 });
      setShowWordPeek(false);
      setShowHint(false);
      setIsCheckingAnswer(false);
      setSubmissionReflexMs(null);

      // Record vocabulary for post-game review
      if (data.question) {
        setMatchVocabs((prev) => {
          if (!prev.find((v) => v.id === data.question.id)) {
            return [
              ...prev,
              {
                id: data.question.id,
                word: data.question.targetWord || data.question.prompt,
                meaning: data.question.prompt,
                phonetic: data.question.phonetic,
                exampleSentence: data.question.exampleSentence,
                isCorrect: true,
              },
            ];
          }
          return prev;
        });
      }

      // Pronunciation auto-play with language awareness
      const promptTarget = data.question?.targetWord || (data.question?.prompt?.match(/「([^」]+)」/)?.[1]);
      const target = promptTarget || (data.question?.prompt?.length < 35 ? data.question.prompt : '');
      const audioUrl = data.question?.audioUrl;
      const lang = data.question?.languageCode || roomLanguageId || activeLanguage?.id || 'zh';
      if (target || audioUrl) {
        setTimeout(() => {
          setIsPlayingAudio(true);
          audioEngine.playWord(target || '', {
            audioUrl,
            lang,
            onStart: () => setIsPlayingAudio(true),
            onEnd: () => setIsPlayingAudio(false),
            onError: () => {
              setIsPlayingAudio(false);
              if (target) speakWord(target, lang);
            },
          });
        }, 120);
      }

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    });

    // Live Comment Received (TikTok Live Feed - only active in Live Mode)
    s.on('live_comment_received', (comment: LiveCommentItem) => {
      setLiveComments((prev) => [comment, ...prev.slice(0, 49)]);

      setActivityEvents((prev) => [
        {
          id: comment.eventId || `evt-${Date.now()}-${Math.random()}`,
          type: comment.isCorrect ? 'CORRECT_ANSWER' : 'PLAYER_JOINED',
          playerName: comment.displayName || comment.username || 'Khán giả',
          detail: comment.isCorrect
            ? `chọn đúng [${comment.parsedOption}] (+100 XP)`
            : comment.commentText,
          timestamp: Date.now(),
        },
        ...prev.slice(0, 19),
      ]);

      if (comment.parsedOption && ['A', 'B', 'C', 'D'].includes(comment.parsedOption)) {
        setOptionVotes((prev) => ({
          ...prev,
          [comment.parsedOption!]: (prev[comment.parsedOption!] || 0) + 1,
        }));
      }
    });

    // Live Status Changed
    s.on('live_status_changed', (status: any) => {
      setLiveStatus({
        status: status.status,
        provider: status.provider,
        channelName: status.channelOrUsername,
        roomId: status.roomId,
        message: status.message,
      });
    });

    // Answer Result (Local User)
    s.on('answer_result', (data: any) => {
      setTimeout(() => {
        setIsCheckingAnswer(false);
        setEvaluation(data.evaluation);
        if (data.evaluation?.isCorrect) {
          playCorrectSound();
        } else {
          playWrongSound();
          if (question) {
            setMatchVocabs((prev) =>
              prev.map((v) => (v.id === question.id ? { ...v, isCorrect: false } : v)),
            );
          }
          if (gameMode === 'SURVIVAL') {
            setLives((prev) => {
              const next = Math.max(0, prev - 1);
              if (next === 0) setIsEliminated(true);
              return next;
            });
          }
        }
      }, 250);

      if (myPlayer) {
        setMyPlayer((prev) =>
          prev
            ? {
                ...prev,
                score: data.currentScore,
                roundScore: data.scoreEarned,
                streak: data.streak,
                bestStreak: Math.max(prev.bestStreak, data.streak),
                correctCount: prev.correctCount + (data.evaluation?.isCorrect ? 1 : 0),
              }
            : null,
        );
      }
    });

    // Round Ended Summary
    s.on('round_ended', (data: any) => {
      setRoomStatus('ROUND_END');
      setRoundSummary(data.summary);
      if (data.ranking) setPlayers(data.ranking);
    });

    // Ranking Update
    s.on('live_ranking_update', (data: any) => {
      if (data.ranking) setPlayers(data.ranking);
      if (data.roundAnswerCount !== undefined) setRoundAnswerCount(data.roundAnswerCount);
    });

    // Game Finished
    s.on('game_finished', (data: any) => {
      setRoomStatus('FINISHED');
      setFinalResult(data);
      playVictoryFanfare();
      if (isBgmActive) {
        liveBgmEngine.stop();
        setIsBgmActive(false);
      }
    });

    setSocket(s);

    return () => {
      s.disconnect();
      try {
        liveBgmEngine.stop();
      } catch (_) {}
    };
  }, [roomId, gameMode, urlLang, activeLanguage?.id]);

  // Round Timer countdown
  useEffect(() => {
    if (roomStatus !== 'IN_ROUND') return;
    const timer = setInterval(() => {
      setTimerRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        if (prev === 4) {
          playCountdownTickSound();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [roomStatus]);

  // Keyboard Navigation: 1/2/3/4 or A/B/C/D to answer, Space for audio
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        playQuestionAudio();
        return;
      }

      if (roomStatus !== 'IN_ROUND' || hasSubmitted) return;

      const key = e.key.toUpperCase();
      const index = ['A', 'B', 'C', 'D'].indexOf(key);
      if (index >= 0 && question?.options && index < question.options.length) {
        e.preventDefault();
        handleSelectOption(index);
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const numIndex = parseInt(e.key, 10) - 1;
        if (question?.options && numIndex < question.options.length) {
          e.preventDefault();
          handleSelectOption(numIndex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [roomStatus, hasSubmitted, question, isListeningGame]);

  // Audio Playback & Pronunciation
  const playQuestionAudio = (forceTarget?: string) => {
    const promptTarget = question?.targetWord || (question?.prompt?.match(/「([^」]+)」/)?.[1]);
    const text = forceTarget || promptTarget || (question?.prompt && question.prompt.length < 35 ? question.prompt : '');
    const audioUrl = question?.audioUrl;
    if (!text && !audioUrl) return;

    setIsPlayingAudio(true);
    const lang = question?.languageCode || roomLanguageId || activeLanguage?.id || 'zh';
    audioEngine.playWord(text || '', {
      audioUrl,
      lang,
      onStart: () => setIsPlayingAudio(true),
      onEnd: () => setIsPlayingAudio(false),
      onError: () => {
        setIsPlayingAudio(false);
        if (text) {
          speakWord(text, lang);
        }
      },
    });
  };

  // Native Speech Synthesis fallback
  const speakWord = (text: string, langCode: string = 'zh') => {
    if (!('speechSynthesis' in window) || !text) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const def = getLanguage(langCode);
      utterance.lang = def?.speechLocale || (langCode === 'zh' ? 'zh-CN' : langCode === 'ja' ? 'ja-JP' : langCode === 'ko' ? 'ko-KR' : 'en-US');
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS not supported or audio blocked:', e);
    }
  };

  // Submit multiple choice option
  const handleSelectOption = (index: number) => {
    if (hasSubmitted || !socket || roomStatus !== 'IN_ROUND') return;
    const letters = ['A', 'B', 'C', 'D'];
    const chosenLetter = letters[index];
    setSelectedOptionIndex(index);
    setHasSubmitted(true);
    setIsCheckingAnswer(true);

    const elapsedMs = Math.max(250, (roundDuration - timerRemaining) * 1000);
    setSubmissionReflexMs(elapsedMs);

    socket.emit('submit_answer', {
      roomCode,
      userId: user?.id || myPlayer?.userId,
      answer: chosenLetter,
    });
  };

  // Free text submit
  const handleSubmitText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim() || hasSubmitted || !socket || roomStatus !== 'IN_ROUND') return;
    setHasSubmitted(true);
    setIsCheckingAnswer(true);

    const elapsedMs = Math.max(250, (roundDuration - timerRemaining) * 1000);
    setSubmissionReflexMs(elapsedMs);

    socket.emit('submit_answer', {
      roomCode,
      userId: user?.id || myPlayer?.userId,
      answer: answerInput.trim(),
    });
  };

  // Host Controls
  const handleHostStartGame = () => {
    if (!socket || !isHost) return;
    playGameStartSound();
    if (!isBgmActive) {
      liveBgmEngine.setVolume(bgmVolume);
      liveBgmEngine.start();
      setIsBgmActive(true);
    }
    socket.emit('room:host_start_game', { roomCode });
  };

  const handleHostPauseGame = () => {
    if (!socket || !isHost) return;
    if (roomStatus === 'IN_ROUND') {
      socket.emit('room:host_pause_game', { roomCode });
    } else if (roomStatus === 'PAUSED') {
      socket.emit('room:host_resume_game', { roomCode });
    }
  };

  const handleHostNextRound = () => {
    if (!socket || !isHost) return;
    socket.emit('room:host_next_round', { roomCode });
  };

  const handleHostExtendTime = (extraSec: number = 5) => {
    if (!socket || !isHost) return;
    socket.emit('room:host_extend_time', { roomCode, extraSec });
  };

  const handleHostEndGame = () => {
    if (!socket || !isHost) return;
    if (confirm('Bạn có chắc chắn muốn kết thúc trận đấu ngay bây giờ?')) {
      socket.emit('room:host_end_game', { roomCode });
    }
  };

  // Live Integration Actions
  const handleConnectLive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket) return;
    socket.emit('room:connect_live', {
      roomCode,
      provider: selectedLiveProvider,
      channelName: targetChannelInput.trim() || 'demo_stream',
      roomId: liveRoomIdInput.trim() || undefined,
      sessionToken: sessionTokenInput.trim() || undefined,
    });
    setIsLiveModalOpen(false);
  };

  const handleDisconnectLive = () => {
    if (!socket) return;
    socket.emit('room:disconnect_live', { roomCode });
  };

  const handleSimulateAudience = () => {
    if (!socket) return;
    socket.emit('room:simulate_batch_comments', { roomCode, count: 8 });
  };

  const handleSendCustomComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCommentText.trim() || !socket) return;
    socket.emit('room:send_mock_comment', {
      roomCode,
      displayName: 'Khán giả TikTok ⚡',
      commentText: customCommentText.trim(),
    });
    setCustomCommentText('');
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopiedLink(true);
    setTimeout(() => setIsCopiedLink(false), 2000);
  };

  const toggleBgm = () => {
    if (isBgmActive) {
      liveBgmEngine.stop();
      setIsBgmActive(false);
    } else {
      liveBgmEngine.setVolume(bgmVolume);
      liveBgmEngine.start();
      setIsBgmActive(true);
    }
  };

  // Fullscreen Listener & Toggle focusing on entire clean container
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        const target = roomPageRef.current || document.documentElement;
        if (target.requestFullscreen) {
          target.requestFullscreen().catch(() => {
            document.documentElement.requestFullscreen().catch(() => {});
          });
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Fullscreen toggle failed:', e);
    }
  };

  // Save current vocabulary into Notebook
  const handleBookmarkCurrentWord = () => {
    if (!question?.targetWord) return;
    setSavedWordsNotice(`Đã lưu từ「${question.targetWord}」vào Sổ Từ Vựng của bạn!`);
    setTimeout(() => setSavedWordsNotice(null), 3000);
  };

  const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
  const OPTION_THEMES = [
    {
      badge: 'bg-blue-500 text-white shadow-blue-500/40',
      border: 'border-blue-500/30 hover:border-blue-400 hover:bg-blue-500/10',
      activeBorder: 'border-blue-400 bg-blue-500/20 shadow-blue-500/30 ring-2 ring-blue-400',
      glow: 'from-blue-500 to-indigo-600',
    },
    {
      badge: 'bg-emerald-500 text-white shadow-emerald-500/40',
      border: 'border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/10',
      activeBorder: 'border-emerald-400 bg-emerald-500/20 shadow-emerald-500/30 ring-2 ring-emerald-400',
      glow: 'from-emerald-500 to-teal-600',
    },
    {
      badge: 'bg-amber-500 text-slate-950 font-black shadow-amber-500/40',
      border: 'border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10',
      activeBorder: 'border-amber-400 bg-amber-500/20 shadow-amber-500/30 ring-2 ring-amber-400',
      glow: 'from-amber-500 to-orange-600',
    },
    {
      badge: 'bg-rose-500 text-white shadow-rose-500/40',
      border: 'border-rose-500/30 hover:border-rose-400 hover:bg-rose-500/10',
      activeBorder: 'border-rose-400 bg-rose-500/20 shadow-rose-500/30 ring-2 ring-rose-400',
      glow: 'from-rose-500 to-pink-600',
    },
  ];

  // Top 3 Podium
  const top1 = players[0] || null;
  const top2 = players[1] || null;
  const top3 = players[2] || null;

  return (
    <div
      ref={roomPageRef}
      className={`h-screen max-h-screen overflow-hidden text-slate-100 relative flex flex-col transition-colors selection:bg-rose-500/30 selection:text-white ${
        isFullscreen ? 'fixed inset-0 z-50 w-screen h-screen' : ''
      } bg-gradient-to-br from-[#0c1228] via-[#090d1e] to-[#050711]`}
    >
      {/* ======================================================== */}
      {/* LUMINOUS STUDIO ARENA AMBIENT BACKGROUND                 */}
      {/* ======================================================== */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[36rem] h-[36rem] bg-indigo-600/15 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute top-1/4 -right-40 w-[34rem] h-[34rem] bg-rose-600/15 rounded-full blur-[160px] animate-pulse delay-1000" />
        <div className="absolute -bottom-40 left-1/3 w-[32rem] h-[32rem] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse delay-700" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-80" />
      </div>

      {/* Floating Saved Word Toast */}
      {savedWordsNotice && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <Bookmark className="w-4 h-4 fill-white" />
          <span>{savedWordsNotice}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. BROADCAST STUDIO HEADER & MODE SELECTOR               */}
      {/* ======================================================== */}
      <header className="relative z-20 shrink-0 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl px-4 py-2.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Branding & Room Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-rose-500 to-amber-400 p-0.5 shadow-lg shadow-indigo-500/25 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-indigo-400" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-black text-sm sm:text-base text-white truncate max-w-[140px] sm:max-w-xs md:max-w-md">
                  {roomTitle}
                </h1>

                {/* Prominent Legible Room PIN Badge with 1-click copy */}
                <button
                  type="button"
                  onClick={copyRoomCode}
                  className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border-2 border-amber-400/60 text-amber-300 font-mono font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                  title="Nhấn để sao chép mã PIN phòng đấu"
                >
                  <span className="text-[10px] uppercase text-amber-400 font-sans font-black">PIN:</span>
                  <span className="text-white font-bold">#{roomCode}</span>
                  {isCopiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-300" />}
                </button>

                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                  <CountryFlag languageId={currentLangDef?.id || roomLanguageId} size="xs" />
                  <span className="hidden sm:inline">{currentLangDef?.name || 'Từ vựng'}</span>
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold pt-0.5">
                <span>
                  Vòng <strong className="text-white">{currentRound}</strong>/{totalRounds}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <strong className="text-white">{players.length}</strong> {roomMode === 'LIVE' ? 'trên live' : 'người chơi'}
                </span>
              </div>
            </div>
          </div>

          {/* Center: DUAL-MODE TOGGLE & ASPECT RATIO SWITCHER */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center bg-slate-900/90 p-1 rounded-2xl border border-white/15 shadow-inner">
              <button
                onClick={() => {
                  setRoomMode('STUDY');
                  setStreamAspectRatio('16:9');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                  roomMode === 'STUDY'
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Chế độ tập trung học tập: Không comment, giao diện rộng rãi, âm thanh trực quan"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Chế Độ Học Thường</span>
              </button>

              <button
                onClick={() => {
                  setRoomMode('LIVE');
                  setStreamAspectRatio('9:16');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                  roomMode === 'LIVE'
                    ? 'bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 text-white shadow-md shadow-rose-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Chế độ Livestream TikTok: Cào bình luận trực tiếp, thống kê vote A/B/C/D, giao diện màn hình live"
              >
                <TikTokColorLogo className="w-3.5 h-3.5" />
                <span>Chế Độ TikTok Live</span>
              </button>
            </div>

            {/* In Live Mode: 9:16 Mobile vs 16:9 Studio View Switcher */}
            {roomMode === 'LIVE' && (
              <div className="hidden lg:flex items-center bg-slate-900/90 p-1 rounded-2xl border border-rose-500/30">
                <button
                  onClick={() => setStreamAspectRatio('9:16')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    streamAspectRatio === '9:16'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Giao diện điện thoại đứng 9:16 chuyên dụng cho Livestream TikTok"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile 9:16</span>
                </button>
                <button
                  onClick={() => setStreamAspectRatio('16:9')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    streamAspectRatio === '16:9'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Giao diện màn hình ngang Desktop Studio"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Studio 16:9</span>
                </button>
              </div>
            )}
          </div>

          {/* Right: Studio Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Live Config Modal Button (In Live Mode) */}
            {roomMode === 'LIVE' && (
              <button
                onClick={() => setIsLiveModalOpen(true)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                  liveStatus.status === 'CONNECTED'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title="Cấu hình kênh TikTok và luồng cào dữ liệu livestream"
              >
                <TikTokLogo className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">
                  {liveStatus.status === 'CONNECTED' ? `@${liveStatus.channelName || 'TikTok Live'}` : 'Cấu hình TikTok'}
                </span>
              </button>
            )}

            {/* BGM Toggle */}
            <button
              onClick={toggleBgm}
              className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                isBgmActive
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
              }`}
              title={isBgmActive ? 'Tắt nhạc nền BGM' : 'Bật nhạc nền sống động (BGM)'}
            >
              {isBgmActive ? <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
              title={isFullscreen ? 'Thoát toàn màn hình (ESC)' : 'Toàn màn hình chuyên nghiệp'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Exit Room */}
            <button
              onClick={() => navigate('/games')}
              className="text-xs font-bold px-3 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition cursor-pointer"
            >
              Thoát
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. HOST QUICK TOOLBAR (ONLY FOR HOST USERS)              */}
      {/* ======================================================== */}
      {isHost && (
        <div className="relative z-10 bg-indigo-950/40 border-b border-indigo-500/20 px-4 py-2 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 fill-amber-400" />
                <span>Host:</span>
              </span>

              {roomStatus === 'WAITING' && (
                <button
                  onClick={handleHostStartGame}
                  className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black transition flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>Bắt Đầu Game</span>
                </button>
              )}

              {(roomStatus === 'IN_ROUND' || roomStatus === 'PAUSED') && (
                <>
                  <button
                    onClick={handleHostPauseGame}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {roomStatus === 'PAUSED' ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3" />}
                    <span>{roomStatus === 'PAUSED' ? 'Tiếp tục' : 'Tạm dừng'}</span>
                  </button>

                  <button
                    onClick={() => handleHostExtendTime(5)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+5s Suy Nghĩ</span>
                  </button>

                  <button
                    onClick={handleHostNextRound}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <SkipForward className="w-3 h-3" />
                    <span>Chuyển câu</span>
                  </button>
                </>
              )}

              {roomMode === 'LIVE' && (
                <button
                  onClick={handleSimulateAudience}
                  className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Giả lập 8 comment khán giả chọn đáp án"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Giả Lập 8 Khán Giả</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyRoomLink}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition flex items-center gap-1 cursor-pointer"
              >
                {isCopiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{isCopiedLink ? 'Đã chép link' : 'Chép link'}</span>
              </button>

              <button
                onClick={() => setShowQRModal(true)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Mã QR cho người xem"
              >
                <QrCode className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MAIN ARENA LAYOUT (STUDY VS LIVE BROADCAST)           */}
      {/* ======================================================== */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 py-2 sm:py-3 flex flex-col justify-start overflow-hidden">
        {/* VIEW A: WAITING / STARTING COUNTDOWN */}
        {(roomStatus === 'WAITING' || roomStatus === 'STARTING') && (
          <div className="my-auto max-w-3xl mx-auto w-full p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-white/10 text-center space-y-5 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-radial-gradient from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

            {countdown !== null && countdown > 0 ? (
              <div className="space-y-4 py-8 animate-fade-in relative z-10">
                <span className="text-xs font-black tracking-widest text-indigo-400 uppercase">
                  TRẬN ĐẤU CHUẨN BỊ BẮT ĐẦU
                </span>
                <div className="text-8xl sm:text-9xl font-mono font-black tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-rose-400 to-amber-400 animate-pulse">
                  {countdown}
                </div>
                <p className="text-sm text-slate-300 font-medium">
                  {roomMode === 'LIVE'
                    ? 'Khán giả livestream hãy chuẩn bị sẵn đáp án A, B, C, D để cùng đua top!'
                    : 'Hãy tập trung phản xạ! Chuẩn bị tinh thần trả lời thật nhanh để nhận điểm tối đa.'}
                </p>
              </div>
            ) : (
              <div className="space-y-5 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-rose-500 to-amber-400 mx-auto flex items-center justify-center shadow-xl shadow-indigo-500/30">
                  <Gamepad2 className="w-7 h-7 text-white" />
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                    {roomMode === 'LIVE' ? '🔴 SẢNH CHỜ PHÁT SÓNG LIVESTREAM TIKTOK' : '📖 SẢNH CHỜ PHÒNG ĐẤU TẬP TRUNG'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">{roomTitle}</h2>

                  {/* Huge Prominent Room Code Box so anyone can see and join immediately */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-400/50 max-w-sm mx-auto flex items-center justify-between gap-3 shadow-inner my-2">
                    <div className="text-left">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">MÃ PIN VÀO PHÒNG</span>
                      <span className="font-mono text-2xl sm:text-3xl font-black text-white tracking-widest">#{roomCode}</span>
                    </div>
                    <button
                      onClick={copyRoomCode}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md"
                      title="Sao chép mã PIN vào phòng"
                    >
                      {isCopiedCode ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
                      <span>{isCopiedCode ? 'Đã Chép!' : 'Sao Chép'}</span>
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
                    Ngôn ngữ: <strong className="text-white">{currentLangDef?.name}</strong> • Số câu:{' '}
                    <strong className="text-white">{totalRounds} câu (15s/câu)</strong>
                  </p>
                </div>

                {/* Player roster preview */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 max-w-md mx-auto space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-b border-white/10 pb-2">
                    <span>Người chơi đã vào phòng ({players.length})</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Sẵn sàng
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center py-2">
                    {players.map((p) => (
                      <div
                        key={p.userId}
                        className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-white/10 flex items-center gap-2 text-xs font-bold text-white shadow-xs"
                      >
                        <img src={p.avatar} alt={p.displayName} className="w-6 h-6 rounded-lg bg-slate-700" />
                        <span className="truncate max-w-[100px]">{p.displayName}</span>
                        {p.isHost && <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {isHost ? (
                    <button
                      onClick={handleHostStartGame}
                      className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-600/30 transition hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Bắt Đầu Trận Đấu Ngay</span>
                    </button>
                  ) : (
                    <div className="text-xs font-bold text-slate-400 flex items-center gap-2 animate-pulse">
                      <Clock className="w-4 h-4 text-indigo-400" />
                      <span>Đang đợi chủ phòng bắt đầu trận đấu...</span>
                    </div>
                  )}

                  <button
                    onClick={copyRoomLink}
                    className="px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-white/10 transition flex items-center gap-2 cursor-pointer"
                  >
                    {isCopiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{isCopiedLink ? 'Đã Chép Link' : 'Mời Bạn Bè'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW B: ACTIVE ROUND (IN_ROUND / PAUSED / ROUND_END) */}
        {(roomStatus === 'IN_ROUND' || roomStatus === 'PAUSED' || roomStatus === 'ROUND_END') && question && (
          (() => {
            const displayWord = question.targetWord || (question.prompt.match(/「([^」]+)」/)?.[1]) || '';

            if (roomMode === 'LIVE' && streamAspectRatio === '9:16') {
              return (
                /* ======================================================== */
                /* TIKTOK LIVE VERTICAL MOBILE BROADCAST VIEW (9:16)        */
                /* ======================================================== */
                <div className="max-w-[420px] w-full mx-auto h-[calc(100vh-110px)] max-h-[820px] flex flex-col justify-between relative bg-slate-950/95 border-2 border-rose-500/40 rounded-3xl shadow-[0_0_60px_rgba(244,63,94,0.35)] p-3.5 overflow-hidden backdrop-blur-2xl animate-fade-in my-auto">
                  {/* 1. Mobile Live Header Overlay */}
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <img
                          src={myPlayer?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=host'}
                          alt="Host"
                          className="w-8 h-8 rounded-full border-2 border-rose-500 object-cover"
                        />
                        <span className="absolute -bottom-1 -right-1 px-1 rounded bg-[#FE2C55] text-white text-[8px] font-black uppercase tracking-wider animate-pulse">
                          LIVE
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-white truncate block max-w-[100px]">
                          {roomTitle}
                        </span>
                        <span className="text-[10px] text-rose-300 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                          👁️ {players.length * 15 + 180} xem
                        </span>
                      </div>
                    </div>

                    {/* Prominent Legible Room PIN Banner */}
                    <button
                      type="button"
                      onClick={copyRoomCode}
                      className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border-2 border-amber-400/60 text-amber-300 font-mono font-black text-xs flex items-center gap-1 shadow-md transition cursor-pointer"
                      title="Nhấn để sao chép mã PIN vào phòng"
                    >
                      <span className="text-[9px] uppercase text-amber-400 font-sans font-black">PIN:</span>
                      <span className="text-white font-bold">#{roomCode}</span>
                      {isCopiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-300" />}
                    </button>
                  </div>

                  {/* 2. Question Centerpiece & Fast Reflex Timer */}
                  <div className="flex-1 flex flex-col justify-center py-2 space-y-2 overflow-hidden">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-black px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px]">
                        CÂU {currentRound}/{totalRounds}
                      </span>
                      <div className="flex items-center gap-2">
                        <CountdownRing
                          remainingSec={timerRemaining}
                          totalSec={roundDuration}
                          size={36}
                          strokeWidth={3}
                        />
                        <button
                          type="button"
                          onClick={() => playQuestionAudio(displayWord)}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border border-white/10 transition cursor-pointer"
                          title="Phát âm từ vựng"
                        >
                          <Volume2 className={`w-4 h-4 text-indigo-300 ${isPlayingAudio ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Target Word Showcase */}
                    <div className="text-center space-y-1 bg-slate-900/80 p-2.5 rounded-2xl border border-white/10">
                      {displayWord && (
                        <h2 className="font-black text-4xl sm:text-5xl text-white tracking-wide drop-shadow">
                          {displayWord}
                        </h2>
                      )}
                      {question.phonetic && (
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-mono text-[11px] font-bold border border-white/10">
                          <span>/{question.phonetic}/</span>
                        </div>
                      )}
                      <p className="text-xs sm:text-sm font-bold text-slate-200 leading-snug line-clamp-2">
                        {question.prompt}
                      </p>
                    </div>

                    {/* Options 4-Choice Cards */}
                    {question.options && question.options.length >= 2 && (
                      <div className="grid grid-cols-1 gap-1.5 pt-0.5">
                        {question.options.map((optText, idx) => {
                          const letter = OPTION_LETTERS[idx] || 'A';
                          const isSelected = selectedOptionIndex === idx;
                          const cleanText = optText.replace(/^[ABCD][\.\:]\s*/i, '');
                          const votes = optionVotes[letter] || 0;
                          const totalVotes = Object.values(optionVotes).reduce((a, b) => a + b, 0);
                          const percent = totalVotes > 0 ? (votes / totalVotes) * 100 : undefined;

                          let cardState: AnswerCardState = 'idle';
                          if (evaluation) {
                            if (evaluation.isCorrect && isSelected) cardState = 'correct';
                            else if (!evaluation.isCorrect && isSelected) cardState = 'incorrect';
                            else if (roundSummary?.correctOptionIndex === idx) cardState = 'correct';
                            else cardState = 'disabled';
                          } else if (hasSubmitted) {
                            cardState = isSelected ? 'selected' : 'locked';
                          } else if (isSelected) {
                            cardState = 'selected';
                          }

                          return (
                            <AnswerCard
                              key={idx}
                              optionLetter={letter}
                              text={cleanText}
                              state={cardState}
                              percentVote={percent}
                              onClick={() => handleSelectOption(idx)}
                              disabled={hasSubmitted || isEliminated}
                            />
                          );
                        })}
                      </div>
                    )}

                    {/* Evaluation result */}
                    {evaluation && (
                      <div className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-between ${
                        evaluation.isCorrect ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200' : 'bg-rose-950/70 border-rose-500/40 text-rose-200'
                      }`}>
                        <span>{evaluation.feedbackText}</span>
                        <span className="font-mono font-black text-amber-300">+{evaluation.score} XP</span>
                      </div>
                    )}
                  </div>

                  {/* 3. Floating Live Comments Feed (TikTok Style) */}
                  <div className="shrink-0 h-32 overflow-y-auto space-y-1 p-2 rounded-2xl bg-black/60 border border-white/10 text-xs">
                    {liveComments.length === 0 ? (
                      <div className="text-center py-5 text-slate-500 text-[11px] italic">
                        Chưa có bình luận nào. Khán giả gõ A, B, C, D để bình chọn!
                      </div>
                    ) : (
                      liveComments.slice(0, 15).map((c) => (
                        <div key={c.eventId} className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900/70 text-[11px]">
                          <img src={c.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=viewer'} className="w-4 h-4 rounded-full" alt="" />
                          <span className="font-bold text-slate-300 truncate max-w-[80px]">{c.displayName || c.username}:</span>
                          <span className="text-white truncate flex-1">{c.commentText}</span>
                          {c.parsedOption && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-600 text-white font-mono font-bold text-[10px]">
                              [{c.parsedOption}]
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Host Quick Controls */}
                  {isHost && (
                    <div className="flex items-center gap-1.5 pt-2 shrink-0">
                      <button
                        onClick={handleSimulateAudience}
                        className="flex-1 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-[11px] font-bold transition flex items-center justify-center gap-1"
                      >
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>+8 Vote Khán Giả</span>
                      </button>
                      <button
                        onClick={handleHostNextRound}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold transition flex items-center gap-1"
                      >
                        <SkipForward className="w-3 h-3" />
                        <span>Qua câu</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* ---------------------------------------------------- */}
            {/* MAIN GAME STAGE (Center Arena)                       */}
            {/* ---------------------------------------------------- */}
            <div
              className={`${
                roomMode === 'LIVE' ? 'lg:col-span-8' : 'lg:col-span-8 max-w-4xl mx-auto w-full'
              } space-y-4 transition-all`}
            >
              {/* Question Stage Card (Sleek Glassmorphic Studio Screen) */}
              <div className="p-5 sm:p-7 rounded-3xl bg-slate-900/85 border border-white/10 shadow-2xl backdrop-blur-2xl space-y-5 relative overflow-hidden">
                {/* Top Info Bar inside card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      CÂU {currentRound}/{totalRounds}
                    </span>

                    {/* Category pill */}
                    <span className="text-xs font-bold text-slate-400 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-white/10">
                      {question.category || 'Từ Vựng'}
                    </span>

                    {/* Survival Hearts */}
                    {gameMode === 'SURVIVAL' && (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30">
                        {[1, 2, 3].map((heartIdx) => (
                          <ArenaIconHeart
                            key={heartIdx}
                            filled={heartIdx <= lives}
                            className={`w-3.5 h-3.5 ${
                              heartIdx <= lives ? 'text-rose-400 animate-pulse' : 'text-slate-600'
                            }`}
                          />
                        ))}
                        <span className="text-[10px] font-bold text-rose-300 ml-1">
                          {lives > 0 ? `${lives} Mạng` : 'BỊ LOẠI'}
                        </span>
                      </div>
                    )}

                    {/* Multipliers */}
                    {gameMode === 'BOSS_ROUND' && (
                      <MultiplierBadge multiplier={2.0} label="BOSS" />
                    )}
                    {gameMode === 'FINAL_SHOWDOWN' && (
                      <MultiplierBadge multiplier={3.0} label="CHUNG KẾT" />
                    )}
                  </div>

                  {/* Reflex Timer & Countdown Ring */}
                  <div className="flex items-center gap-3">
                    <CountdownRing
                      remainingSec={timerRemaining}
                      totalSec={roundDuration}
                      size={44}
                      strokeWidth={4}
                    />

                    {question.targetWord && (
                      <button
                        type="button"
                        onClick={handleBookmarkCurrentWord}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-white/10 transition cursor-pointer"
                        title="Lưu từ vựng này vào Sổ Từ để ôn tập sau"
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Question Centerpiece */}
                {isListeningGame ? (
                  /* Specialized Listening Mode View */
                  <div className="py-4 space-y-4 text-center bg-indigo-950/40 rounded-2xl p-5 border border-indigo-500/30">
                    <div className="flex items-center justify-center gap-2 text-indigo-300 text-xs font-black uppercase tracking-wider">
                      <Headphones className="w-4 h-4 text-indigo-400" />
                      <span>Thử Thách Phản Xạ Nghe Phát Âm</span>
                    </div>

                    {/* Animated Equalizer Waveform */}
                    <div className="flex items-center justify-center gap-1.5 py-2">
                      {[12, 24, 36, 20, 32, 16, 28].map((h, i) => (
                        <div
                          key={i}
                          className={`w-1.5 rounded-full bg-gradient-to-t from-indigo-500 via-rose-400 to-amber-300 transition-all ${
                            isPlayingAudio ? 'animate-pulse' : 'opacity-40'
                          }`}
                          style={{
                            height: isPlayingAudio ? `${h}px` : '8px',
                            animationDelay: `${i * 100}ms`,
                            animationDuration: '600ms',
                          }}
                        />
                      ))}
                    </div>

                    {/* Audio Playback Controls */}
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => playQuestionAudio()}
                        className={`px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2 cursor-pointer shadow-xl ${
                          isPlayingAudio
                            ? 'bg-rose-600 text-white shadow-rose-600/40 ring-4 ring-rose-500/20 scale-105'
                            : 'bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white shadow-indigo-600/30'
                        }`}
                      >
                        <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-spin' : ''}`} />
                        <span>{isPlayingAudio ? 'Đang phát...' : 'Phát Lại Âm Thanh [Space]'}</span>
                      </button>

                      {question.targetWord && (
                        <button
                          type="button"
                          onClick={() => setShowWordPeek((prev) => !prev)}
                          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-white/10"
                        >
                          {showWordPeek ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-indigo-400" />}
                          <span>{showWordPeek ? 'Ẩn mặt chữ' : 'Xem mặt chữ (Gợi ý)'}</span>
                        </button>
                      )}
                    </div>

                    {showWordPeek && question.targetWord ? (
                      <div className="pt-2 text-center animate-fade-in">
                        <h2 className="text-3xl sm:text-5xl font-black text-white drop-shadow">
                          {question.targetWord}
                        </h2>
                        {question.phonetic && (
                          <span className="text-xs font-mono font-bold text-indigo-300">
                            /{question.phonetic}/
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm font-bold text-indigo-200 italic">
                        "🎧 Lắng nghe kỹ âm thanh phát âm và chọn đáp án chính xác bên dưới!"
                      </p>
                    )}

                    <p className="text-sm sm:text-base font-bold text-white max-w-xl mx-auto">
                      {question.prompt}
                    </p>
                  </div>
                ) : (
                  /* Standard Vocabulary Showcase View */
                  <div className="py-2 sm:py-4 space-y-3 text-center">
                    {displayWord ? (
                      <div className="flex items-center justify-center gap-3">
                        <h2 className="font-black text-4xl sm:text-6xl text-white tracking-tight drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">
                          {displayWord}
                        </h2>
                        <button
                          type="button"
                          onClick={() => playQuestionAudio(displayWord)}
                          className={`p-3 rounded-2xl transition cursor-pointer ${
                            isPlayingAudio
                              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40 ring-4 ring-rose-500/20'
                              : 'bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border border-white/10'
                          }`}
                          title="Phát âm thanh từ vựng [Space]"
                        >
                          <Volume2 className="w-5 h-5 text-indigo-300" />
                        </button>
                      </div>
                    ) : null}

                    {question.phonetic && (
                      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-800/80 text-indigo-300 border border-white/10 font-mono text-xs font-bold">
                        <span>Phát âm:</span>
                        <span className="text-white">/{question.phonetic}/</span>
                      </div>
                    )}

                    <p className="text-base sm:text-xl font-bold text-slate-200 max-w-2xl mx-auto leading-relaxed">
                      {question.prompt}
                    </p>
                  </div>
                )}

                {/* Options Grid / Cloze Input */}
                {isFillBlankGame ? (
                  /* Free-Text / Spelling Challenge */
                  <div className="space-y-3 pt-2 max-w-lg mx-auto">
                    {question.hint && (
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Điền từ hoặc đáp án chính xác:</span>
                        <button
                          type="button"
                          onClick={() => setShowHint((p) => !p)}
                          className="text-amber-400 hover:underline flex items-center gap-1 font-bold"
                        >
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span>{showHint ? 'Ẩn gợi ý' : 'Xem gợi ý'}</span>
                        </button>
                      </div>
                    )}

                    {showHint && question.hint && (
                      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold animate-fade-in">
                        💡 Gợi ý: {question.hint}
                      </div>
                    )}

                    <form onSubmit={handleSubmitText} className="relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={answerInput}
                        onChange={(e) => setAnswerInput(e.target.value)}
                        disabled={hasSubmitted}
                        placeholder={
                          hasSubmitted
                            ? 'Đã gửi đáp án! Đang kiểm tra kết quả...'
                            : 'Gõ từ hoặc đáp án rồi nhấn Enter...'
                        }
                        className="w-full py-4 pl-5 pr-24 rounded-2xl text-base font-bold bg-slate-950/80 border-2 border-indigo-500/50 focus:border-rose-400 focus:ring-4 focus:ring-indigo-500/20 text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                      />
                      <button
                        type="submit"
                        disabled={hasSubmitted || !answerInput.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition disabled:opacity-40 flex items-center gap-1 cursor-pointer shadow-md"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Gửi</span>
                      </button>
                    </form>
                  </div>
                ) : question.options && question.options.length >= 2 ? (
                  /* 4 Multiple Choice Options with Esports AnswerCard */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                    {question.options.map((optText, idx) => {
                      const letter = OPTION_LETTERS[idx] || 'A';
                      const isSelected = selectedOptionIndex === idx;
                      const cleanText = optText.replace(/^[ABCD][\.\:]\s*/i, '');
                      const votes = optionVotes[letter] || 0;
                      const totalVotes = Object.values(optionVotes).reduce((a, b) => a + b, 0);
                      const percent = totalVotes > 0 ? (votes / totalVotes) * 100 : undefined;

                      let cardState: AnswerCardState = 'idle';
                      if (evaluation) {
                        if (evaluation.isCorrect && isSelected) cardState = 'correct';
                        else if (!evaluation.isCorrect && isSelected) cardState = 'incorrect';
                        else if (roundSummary?.correctOptionIndex === idx) cardState = 'correct';
                        else cardState = 'disabled';
                      } else if (hasSubmitted) {
                        cardState = isSelected ? 'selected' : 'locked';
                      } else if (isSelected) {
                        cardState = 'selected';
                      }

                      return (
                        <AnswerCard
                          key={idx}
                          optionLetter={letter}
                          text={cleanText}
                          state={cardState}
                          percentVote={roomMode === 'LIVE' ? percent : undefined}
                          onClick={() => handleSelectOption(idx)}
                          disabled={hasSubmitted || isEliminated}
                        />
                      );
                    })}
                  </div>
                ) : null}

                {/* Checking Spinner */}
                {isCheckingAnswer && (
                  <div className="p-3.5 rounded-2xl bg-indigo-950/80 border border-indigo-400/40 flex items-center justify-center gap-2.5 text-indigo-200 animate-pulse">
                    <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                    <span className="font-black text-xs uppercase tracking-wider">
                      Đang kiểm tra phản xạ & chấm điểm...
                    </span>
                  </div>
                )}

                {/* Evaluated Reflex Performance Card */}
                {evaluation && !isCheckingAnswer && (
                  <div
                    className={`p-4 rounded-2xl border transition-all animate-fade-in space-y-2 shadow-lg ${
                      evaluation.isCorrect
                        ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                        : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2 font-black text-sm sm:text-base text-white">
                        {evaluation.isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-400" />
                        )}
                        <span>{evaluation.feedbackText}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {submissionReflexMs && (
                          <span className="px-2 py-0.5 rounded-lg bg-white/10 text-xs font-mono font-bold text-amber-300">
                            ⚡ {(submissionReflexMs / 1000).toFixed(1)}s
                          </span>
                        )}
                        {evaluation.score > 0 && (
                          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500 text-white font-black text-xs">
                            +{evaluation.score} XP
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                      <div className="p-1.5 rounded-xl bg-black/20">
                        <span className="text-[10px] text-slate-400 block">Độ chính xác</span>
                        <strong className="text-white">{evaluation.accuracy}%</strong>
                      </div>
                      <div className="p-1.5 rounded-xl bg-black/20">
                        <span className="text-[10px] text-slate-400 block">Thưởng tốc độ</span>
                        <strong className="text-amber-400">+{evaluation.speedBonus} XP</strong>
                      </div>
                      <div className="p-1.5 rounded-xl bg-black/20">
                        <span className="text-[10px] text-slate-400 block">Chuỗi Streak</span>
                        <strong className="text-rose-400 flex items-center justify-center gap-1">
                          <Flame className="w-3.5 h-3.5 fill-rose-500" />
                          {myPlayer?.streak || (evaluation.isCorrect ? 1 : 0)}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* TikTok Live Mode: Live Audience Voting Distribution Meter */}
                {roomMode === 'LIVE' && question.options && question.options.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span className="flex items-center gap-1.5 text-rose-400">
                        <TikTokColorLogo className="w-3.5 h-3.5" />
                        <span>TỶ LỆ KHÁN GIẢ LIVESTREAM CHỌN (TIKTOK LIVE)</span>
                      </span>
                      <span className="text-slate-400">
                        {liveComments.filter((c) => c.parsedOption).length} lượt bình luận
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {['A', 'B', 'C', 'D'].map((opt) => {
                        const count = liveComments.filter((c) => c.parsedOption === opt).length;
                        const total = liveComments.filter((c) => c.parsedOption).length || 1;
                        const pct = Math.round((count / total) * 100);
                        const colors: Record<string, string> = {
                          A: 'from-blue-500 to-indigo-600',
                          B: 'from-emerald-500 to-teal-600',
                          C: 'from-amber-500 to-orange-600',
                          D: 'from-rose-500 to-pink-600',
                        };

                        return (
                          <div key={opt} className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span className="text-slate-300 font-mono">[{opt}]</span>
                              <span className="text-white font-mono">{pct}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${colors[opt]} transition-all duration-300`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Round Summary & Context Sentence (Screen D: Round Result) */}
              {roundSummary && (
                <RoundResultModal
                  result={{
                    isCorrect: evaluation?.isCorrect || false,
                    correctAnswerLetter:
                      typeof roundSummary.correctOptionIndex === 'number'
                        ? OPTION_LETTERS[roundSummary.correctOptionIndex] || 'A'
                        : 'A',
                    correctAnswerText: roundSummary.correctAnswer || '',
                    explanation: roundSummary.explanation,
                    phonetic: question.phonetic,
                    exampleSentence: question.hint,
                    earnedPoints: evaluation?.score || 0,
                    basePoints: 700,
                    speedBonus: evaluation?.speedBonus || 0,
                    streakBonus: evaluation?.streakBonus || 0,
                    roundMultiplier:
                      gameMode === 'BOSS_ROUND'
                        ? 2.0
                        : gameMode === 'FINAL_SHOWDOWN'
                        ? 3.0
                        : 1.0,
                    newStreak: myPlayer?.streak || 0,
                    currentRank: myPlayer?.rank,
                    onPlayAudio: () => playQuestionAudio(question.targetWord),
                  }}
                  countdownSec={countdown || undefined}
                />
              )}
            </div>

            {/* ---------------------------------------------------- */}
            {/* SIDEBAR (MODE DEPENDENT: STUDY STATS VS TIKTOK LIVE) */}
            {/* ---------------------------------------------------- */}
            <div className="lg:col-span-4 space-y-4">
              {/* Leaderboard (Present in both modes) */}
              <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-white/10 shadow-xl backdrop-blur-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h3 className="font-black text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>BẢNG XẾP HẠNG TRẬN ĐẤU</span>
                  </h3>
                  <span className="text-xs text-slate-400">{players.length} người</span>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {players.slice(0, 6).map((p, idx) => (
                    <div
                      key={p.userId}
                      className={`p-2 rounded-xl flex items-center justify-between border transition ${
                        idx === 0
                          ? 'bg-amber-500/10 border-amber-500/40 text-white'
                          : idx === 1
                          ? 'bg-slate-800/60 border-slate-400/30 text-white'
                          : idx === 2
                          ? 'bg-amber-950/20 border-amber-700/30 text-white'
                          : 'bg-slate-950/40 border-white/5 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-5 text-center font-black text-xs ${
                            idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <img src={p.avatar} alt={p.displayName} className="w-7 h-7 rounded-lg bg-slate-800" />
                        <div className="min-w-0">
                          <span className="font-bold text-xs truncate max-w-[110px] block">
                            {p.displayName} {p.userId === user?.id && '(Bạn)'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-black text-xs text-amber-400">
                          {p.score.toLocaleString()} XP
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* MODE A: HỌC THƯỜNG — FOCUSED STUDY COMPASS (NO LIVE CHAT!) */}
              {roomMode === 'STUDY' && (
                <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-white/10 shadow-xl backdrop-blur-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-black uppercase text-indigo-400 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4" />
                      <span>GHI CHÚ HỌC TẬP</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">Chế độ Tập Trung</span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Mẹo Phản Xạ Thần Tốc:</span>
                      </div>
                      <p className="text-slate-400 leading-relaxed text-[11px]">
                        Nhấn phím <strong>1, 2, 3, 4</strong> hoặc <strong>A, B, C, D</strong> trên bàn phím để chọn đáp án ngay trong 3 giây đầu tiên nhằm nhận tối đa <strong>+200 XP thưởng tốc độ</strong>!
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Luyện Âm & Bắt Tai:</span>
                      </div>
                      <p className="text-slate-400 leading-relaxed text-[11px]">
                        Nhấn phím <strong>Space (khoảng trắng)</strong> bất cứ lúc nào để nghe lại phát âm bản xứ của từ vựng hiện tại.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleBookmarkCurrentWord}
                    className="w-full py-2.5 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Lưu Từ Này Vào Sổ Từ Vựng</span>
                  </button>
                </div>
              )}

              {/* MODE B: TIKTOK LIVE ACTIVITY STREAM (ONLY IN LIVE MODE) */}
              {roomMode === 'LIVE' && (
                <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-white/10 shadow-xl backdrop-blur-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h3 className="font-black text-xs uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                      <TikTokColorLogo className="w-4 h-4" />
                      <span>BÌNH LUẬN TIKTOK LIVE</span>
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      {liveStatus.status === 'CONNECTED' ? 'Đã kết nối' : 'Mock Dev Mode'}
                    </span>
                  </div>

                  {/* Comments feed container */}
                  <div className="h-64 sm:h-72 overflow-y-auto space-y-2 pr-1 text-xs">
                    {liveComments.length === 0 ? (
                      <div className="text-center py-10 text-slate-500 italic text-xs space-y-2">
                        <p>Chưa có bình luận nào.</p>
                        {isHost && (
                          <p className="text-[11px] text-indigo-400 not-italic">
                            Nhấn nút "Giả Lập 8 Khán Giả" để kiểm tra luồng comment!
                          </p>
                        )}
                      </div>
                    ) : (
                      liveComments.map((c) => (
                        <div
                          key={c.eventId}
                          className="p-2 rounded-xl bg-slate-950/70 border border-white/5 flex items-start gap-2.5 animate-fade-in"
                        >
                          <img
                            src={c.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=viewer'}
                            alt={c.username}
                            className="w-7 h-7 rounded-lg bg-slate-800 shrink-0 mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[11px] text-slate-300 truncate">
                                {c.displayName || `@${c.username}`}
                              </span>
                              {c.parsedOption && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-indigo-600 text-white font-mono">
                                  {c.parsedOption}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-white font-medium break-words mt-0.5">
                              {c.commentText}
                            </p>
                            {c.isCorrect && (
                              <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 pt-0.5">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Đúng! +{c.scoreAdded || 200} XP</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Host Quick Comment Simulator Bar */}
                  {isHost && (
                    <form onSubmit={handleSendCustomComment} className="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        value={customCommentText}
                        onChange={(e) => setCustomCommentText(e.target.value)}
                        placeholder="Test comment: ví dụ A hoặc đáp án..."
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-rose-500"
                      />
                      <button
                        type="submit"
                        disabled={!customCommentText.trim()}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition disabled:opacity-40 cursor-pointer"
                      >
                        Gửi
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
            );
          })()
        )}

        {/* VIEW C: FINISHED / FINAL VICTORY PODIUM */}
        {roomStatus === 'FINISHED' && (
          <WinnerCelebration
            data={{
              roomCode,
              gameModeTitle: roomTitle,
              totalPlayers: players.length || 1,
              totalQuestions: totalRounds,
              topPlayers: (finalResult?.ranking || players).slice(0, 10).map((p, i) => ({
                id: p.userId,
                name: p.displayName,
                avatar: p.avatar,
                score: p.score,
                streak: p.streak,
                rank: p.rank || i + 1,
              })),
              personalStats: myPlayer
                ? {
                    finalRank: myPlayer.rank || 1,
                    totalScore: myPlayer.score,
                    correctCount: myPlayer.correctCount,
                    accuracyPercent:
                      totalRounds > 0 ? (myPlayer.correctCount / totalRounds) * 100 : 100,
                    maxStreak: myPlayer.bestStreak,
                    xpEarned: Math.round(myPlayer.score * 0.5),
                  }
                : undefined,
              reviewVocabs: matchVocabs,
            }}
            onRematch={() => {
              if (socket && isHost) {
                socket.emit('room:host_start_game', { roomCode });
              } else {
                window.location.reload();
              }
            }}
            onReturnToLobby={() => navigate('/games')}
            onSaveToNotebook={async (words) => {
              try {
                await api.post('/vocabulary/notebook/batch', {
                  words: words.map((w) => ({
                    word: w.word,
                    meaning: w.meaning,
                    languageId: roomLanguageId,
                  })),
                });
              } catch (_) {}
            }}
          />
        )}
      </main>

      {/* ======================================================== */}
      {/* 4. TIKTOK LIVE CONFIGURATION MODAL                       */}
      {/* ======================================================== */}
      {isLiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-rose-500/30 rounded-3xl p-6 space-y-5 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-black text-base flex items-center gap-2">
                <TikTokColorLogo className="w-5 h-5" />
                <span>Cấu Hình TikTok Live & Quay Chiếu</span>
              </h3>
              <button
                onClick={() => setIsLiveModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quay chiếu OBS / Stream Cast Link */}
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Tv className="w-4 h-4 text-indigo-400" />
                  <span>Nguồn Trình Duyệt Cho OBS / TikTok LIVE Studio:</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold">
                  1080p Stream
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Sao chép link này dán vào <strong>Nguồn Trình Duyệt (Browser Source)</strong> hoặc mở toàn màn hình rồi chọn <strong>Quay Cửa Sổ (Window Capture)</strong>:
              </p>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/games/room/${roomCode}?type=live&view=stream`}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-[11px] font-mono text-indigo-300 select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/games/room/${roomCode}?type=live&view=stream`,
                    );
                    setIsCopiedStreamUrl(true);
                    setTimeout(() => setIsCopiedStreamUrl(false), 2000);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
                >
                  {isCopiedStreamUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopiedStreamUrl ? 'Đã sao chép' : 'Sao chép Link'}</span>
                </button>
              </div>
            </div>

            {/* TikTok Live Connection Form */}
            <form onSubmit={handleConnectLive} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Phương Thức Cào Dữ Liệu</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedLiveProvider('TIKTOK_LIVE')}
                    className={`p-3 rounded-2xl border text-left text-xs font-bold transition cursor-pointer ${
                      selectedLiveProvider === 'TIKTOK_LIVE'
                        ? 'bg-rose-600/30 border-rose-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="text-rose-400 font-black flex items-center gap-1.5">
                      <TikTokLogo className="w-3.5 h-3.5" />
                      <span>TikTok Live Trực Tiếp</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal">Tự động cào comment từ live stream</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedLiveProvider('MOCK')}
                    className={`p-3 rounded-2xl border text-left text-xs font-bold transition cursor-pointer ${
                      selectedLiveProvider === 'MOCK'
                        ? 'bg-indigo-600/30 border-indigo-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="text-emerald-400 font-black">Mô Phỏng Sandbox</div>
                    <div className="text-[10px] text-slate-400 font-normal">Giả lập comment để test trước giờ live</div>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  TikTok Username hoặc URL Livestream:
                </label>
                <input
                  type="text"
                  value={targetChannelInput}
                  onChange={(e) => setTargetChannelInput(e.target.value)}
                  placeholder="Ví dụ: @tienganhmoingay hoặc https://www.tiktok.com/@user/live"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-rose-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  TikTok Room ID (Tùy chọn - nếu có):
                </label>
                <input
                  type="text"
                  value={liveRoomIdInput}
                  onChange={(e) => setLiveRoomIdInput(e.target.value)}
                  placeholder="Ví dụ: 743892184910283921"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {liveStatus.status !== 'DISCONNECTED' && (
                  <button
                    type="button"
                    onClick={handleDisconnectLive}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    Ngắt kết nối
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-rose-600/30 transition cursor-pointer flex items-center gap-1.5"
                >
                  <TikTokLogo className="w-3.5 h-3.5" />
                  <span>Lưu & Bắt Đầu Nhận Comment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. QR CODE MODAL                                         */}
      {/* ======================================================== */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-6 text-center space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-black text-sm flex items-center gap-2">
                <QrCode className="w-4 h-4 text-indigo-400" />
                <span>QR Quét Tham Gia Phòng Đấu</span>
              </h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl mx-auto inline-block shadow-xl">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  window.location.href,
                )}`}
                alt="QR Code"
                className="w-44 h-44 mx-auto"
              />
            </div>

            <div className="space-y-1">
              <div className="font-mono font-black text-2xl text-amber-400 tracking-widest">
                #{roomCode}
              </div>
              <p className="text-xs text-slate-400">
                Khán giả quét mã QR bằng điện thoại để vào trực tiếp phòng đấu!
              </p>
            </div>

            <button
              onClick={() => setShowQRModal(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealtimeGameRoomPage;
