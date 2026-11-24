import { getOrCreateDeviceId } from '../../lib/api';
import { CreateCustomRoomModal } from '../../components/games/CreateCustomRoomModal';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
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
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Lock,
  AlertCircle,
  LogIn,
  RotateCcw,
  Sparkles,
  Award,
  Star,
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
  LogOut,
  Settings,
  Play,
  Pause,
  SkipForward,
  Maximize2,
  Minimize2,
  Smartphone,
  Monitor,
  CheckCircle,
  BarChart3,
  HelpCircle,
  TrendingUp,
  X,
  Plus,
  Loader2,
  Lightbulb,
  BookOpen,
  GraduationCap,
  Bookmark,
  Sliders,
  Gift,
  Heart,
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import {
  playCorrectSound,
  playWrongSound,
  playRoomEnterSound,
  playGameStartSound,
  playQuestionTransitionSound,
  playCountdownTickSound,
  playWarningTickSound,
  playRoundEndSound,
  playVictoryFanfare,
  HallOfFame,
  type ChampionshipResult,
  liveBgmEngine,
  TikTokLogo,
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
import { ArenaDynamicBackground, ArenaBackgroundTheme } from './arena/ArenaDynamicBackground';
import { QuestionAnalyticsPanel, AnswerVoteDetail, GroupedTextAnswer } from './arena/QuestionAnalyticsPanel';
import { TopAnswersThisRound, RoundSubmissionItem } from './arena/TopAnswersThisRound';
import type { ArenaRankPlayer } from './arena/ArenaRankingPanel';
import { ArenaCelebrationOverlay } from './arena/ArenaCelebrationOverlay';
import { AnswerDistributionChart } from './arena/AnswerDistributionChart';
import { ArenaStatsBar } from './arena/ArenaStatsBar';
import { ArenaInGameHeader } from './arena/ArenaInGameHeader';
import { ArenaExplanationCard } from './arena/ArenaExplanationCard';
import { ArenaPillOptionButton } from './arena/ArenaPillOptionButton';
import { ArenaBattleView } from './arena/ArenaBattleView';
import '@vocabflow/shared/src/components/arena/hall-of-fame.css';
import { TikTokLiveView, type LiveWinner } from './arena/TikTokLiveView';

const INTERACTIVE_STAGE_STYLE = {
  backgroundImage: 'url(/game-assets/arena/arena-main-background.webp)',
  backgroundBlendMode: 'soft-light' as const,
};

const MATCH_PANELS = [
  { id: 'comments', label: 'Bình luận' },
  { id: 'ranking', label: 'Xếp hạng' },
  { id: 'distribution', label: 'Bình chọn' },
] as const;

type MatchPanel = typeof MATCH_PANELS[number]['id'];

const ARENA_STAGE_BANNER_STYLE = {
  backgroundImage: 'url(/game-assets/arena/topbar-arena-banner.svg)',
};

interface RoomPlayer {
  userId: string;
  displayName: string;
  avatar: string;
  score: number;
  roundScore?: number;
  streak: number;
  bestStreak: number;
  correctCount: number;
  answeredCount?: number;
  totalResponseTimeMs?: number;
  latencyMs: number;
  rank: number;
  lastResponseTimeMs: number;
  isReady?: boolean;
  isHost?: boolean;
  isCommenter?: boolean;
  username?: string;
}

interface QuestionData {
  id: string;
  prompt: string;
  direction: string;
  category: string;
  difficulty?: number;
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
  round?: number;
  accepted?: boolean;
  answer?: string;
  liveTop3?: LiveWinner[];
  commenterRanking?: RoomPlayer[];
  username: string;
  displayName: string;
  avatarUrl?: string;
  commentText: string;
  parsedOption?: string;
  liveOptionVotes?: Record<string, number>;
  timestamp: number;
  isCorrect?: boolean;
  scoreAdded?: number;
  totalScore?: number;
  rank?: number;
}

export const GAME_MODE_TITLES: Record<string, string> = {
  TRANSLATION_RUSH: 'Đấu Trường Dịch Nhanh',
  WORD_BLITZ: 'Đấu Trường Phản Xạ Từ Vựng',
  SENTENCE_SPRINT: 'Đấu Trường Tốc Độ Đặt Câu',
  MISSING_WORD: 'Đấu Trường Điền Từ Khuyết',
  LISTENING_RUSH: 'Đấu Trường Nghe Hiểu Cấp Tốc',
  SYNONYM_BATTLE: 'Đấu Trí Từ Đồng Nghĩa',
  FIX_SENTENCE: 'Đấu Trường Sửa Lỗi Câu',
  GUESS_WORD: 'Đấu Trường Đoán Từ Bí Ẩn',
  FOUR_SKILLS_ARENA: 'Đại Chiến 4 Kỹ Năng',
  BOSS_ROUND: 'Đại Chiến Trùm Cuối',
  FINAL_SHOWDOWN: 'Trận Chiến Quyết Định',
};

const ROOM_LOGIN_ERROR = 'Vui lòng đăng nhập lại để tham gia.';
const ROOM_LOGIN_REASON = 'Đăng nhập hoặc đăng ký để tiếp tục';

export const RealtimeGameRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const gameMode = searchParams.get('mode') || 'TRANSLATION_RUSH';
  const urlLang = searchParams.get('lang');
  const viewParam = searchParams.get('view');
  const isBroadcastView = viewParam === 'stream';
  const isSpectator = isBroadcastView || viewParam === 'spectator';
  const [isReadOnly, setIsReadOnly] = useState(isSpectator);
  const savedRoomPassword = (useLocation().state as { roomPassword?: string } | null)?.roomPassword;
  const [roomPassword, setRoomPassword] = useState(savedRoomPassword || '');
  const [passwordAttempt, setPasswordAttempt] = useState('');
  const [joinError, setJoinError] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [nextRoomCode, setNextRoomCode] = useState('');
  const navigate = useNavigate();
  const { user, loginPromptOpen, promptLogin } = useAuth();
  const { activeLanguage } = useLearning();
  const { t } = useTranslation();

  const [guestKey] = useState(() =>
    Array.from(crypto.getRandomValues(new Uint8Array(32)), (value) =>
      value.toString(16).padStart(2, '0'),
    ).join(''),
  );
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomCode, setRoomCode] = useState<string>(roomId || '');
  const [roomTitle, setRoomTitle] = useState<string>(
    GAME_MODE_TITLES[gameMode] || 'Đấu Trường VocabFlow',
  );
  const [themeColor, setThemeColor] = useState<string>(searchParams.get('theme') || 'cyan');
  const [networkLatency, setNetworkLatency] = useState<number>(32);
  const [roomCreatedAt, setRoomCreatedAt] = useState<number>(Date.now());
  const [roomUptime, setRoomUptime] = useState<number>(0);
  const [roomLanguageId, setRoomLanguageId] = useState<string>(urlLang || activeLanguage.id);
  const [roomStatus, setRoomStatus] = useState<string>('WAITING');
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [totalRounds, setTotalRounds] = useState<number>(10);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const displayRoomCode = useMemo(() => {
    if (!roomCode || roomCode.startsWith('auto_')) {
      return 'GHÉP NHANH';
    }
    return `#${roomCode}`;
  }, [roomCode]);

  // 2 Distinct Modes: 'STUDY' (Học Thường - Không comment, tập trung cao độ) vs 'LIVE' (TikTok Livestream Game Show)
  const isInitiallyLive =
    searchParams.get('type') === 'live' ||
    searchParams.get('live') === '1' ||
    roomId?.toUpperCase().includes('LIVE') ||
    roomId?.toUpperCase().includes('TIKTOK');

  const [roomMode, setRoomMode] = useState<'STUDY' | 'LIVE'>(isInitiallyLive ? 'LIVE' : 'STUDY');
  const [preferredMatchPanel, setPreferredMatchPanel] = useState<MatchPanel>('comments');
  const [isAudienceRankingOpen, setIsAudienceRankingOpen] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const [isMobileMode, setIsMobileMode] = useState<boolean>(() => window.innerWidth <= 700);

  useEffect(() => {
    const syncViewportMode = () => setIsMobileMode(window.innerWidth <= 700);
    window.addEventListener('resize', syncViewportMode);
    return () => window.removeEventListener('resize', syncViewportMode);
  }, []);

  const toggleMobileMode = () => setIsMobileMode((prev) => !prev);

  // Top Container ref for fullscreen handling
  const roundDeadline = useRef(0);
  const summaryDeadline = useRef(0);
  const activeRound = useRef(0);
  const activeQuestionId = useRef<string>();
  const submittedRound = useRef<number | null>(null);
  const [resultSeconds, setResultSeconds] = useState(0);
  const [liveTop3, setLiveTop3] = useState<LiveWinner[]>([]);
  const [skipped, setSkipped] = useState(false);
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
    acceptedAnswers?: string[];
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
    status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';
    provider: 'TIKTOK_LIVE';
    channelName?: string;
    roomId?: string;
    message?: string;
  }>({
    status: 'DISCONNECTED',
    provider: 'TIKTOK_LIVE',
    channelName: '',
    message: '',
  });
  const [viewerCount, setViewerCount] = useState<number | null>(null);
  const [liveComments, setLiveComments] = useState<LiveCommentItem[]>([]);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState<boolean>(false);
  const [targetChannelInput, setTargetChannelInput] = useState<string>('');
  const [liveRoomIdInput, setLiveRoomIdInput] = useState<string>('');
  const [liveConnectionMessage, setLiveConnectionMessage] = useState('');
  const [isSubmittingLive, setIsSubmittingLive] = useState(false);
  const [sessionTokenInput, setSessionTokenInput] = useState<string>('');
  const [liveProviderChoice, setLiveProviderChoice] = useState<'TIKTOK_LIVE' | 'MOCK'>('TIKTOK_LIVE');
  const [liveConnectionSuccess, setLiveConnectionSuccess] = useState<boolean>(false);
  const [liveValidationWarning, setLiveValidationWarning] = useState<string | null>(null);
  const [testCommentSent, setTestCommentSent] = useState<boolean>(false);
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
  const [finalResult, setFinalResult] = useState<ChampionshipResult | null>(null);
  const completedRoom = useRef<string | null>(null);

  // Connection State
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Share & Copy states
  const [isCopiedCode, setIsCopiedCode] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [savedWordsNotice, setSavedWordsNotice] = useState<string | null>(null);

  // Arena Theme & Dynamic Background
  const [arenaTheme, setArenaTheme] = useState<ArenaBackgroundTheme>('esports');
  // Round Valid Submissions (Top Answers This Round & Question Analytics)
  const [roundSubmissions, setRoundSubmissions] = useState<RoundSubmissionItem[]>([]);
  // Mobile Floating Drawer State
  const [isMobileCommentDrawerOpen, setIsMobileCommentDrawerOpen] = useState<boolean>(false);
  const [isMobileBangVangOpen, setIsMobileBangVangOpen] = useState<boolean>(false);
  const [mobileLikeCount, setMobileLikeCount] = useState<number>(1280);

  // Auto-Continuous Rotation & Match Celebration States
  const [nextRotationData, setNextRotationData] = useState<any>(null);
  const [isWaitingForPublicGame, setIsWaitingForPublicGame] = useState<boolean>(false);
  const [commenterRanking, setCommenterRanking] = useState<RoomPlayer[]>([]);
  // Sound popover
  const [showSoundPopover, setShowSoundPopover] = useState<boolean>(false);
  // Correct Answer Celebration Particles & Banner State
  const [celebrationData, setCelebrationData] = useState<{
    show: boolean;
    score: number;
    streak: number;
    speedMs: number | null;
  }>({
    show: false,
    score: 0,
    streak: 0,
    speedMs: null,
  });

  // Derived Top Commenters Leaderboard for ArenaRankingPanel
  const arenaRankCommenters: ArenaRankPlayer[] = useMemo(() => {
    if (commenterRanking.length > 0) {
      return commenterRanking.map((player, index) => ({
        ...player,
        rank: index + 1,
        isCommenter: true,
      }));
    }
    const map = new Map<string, { username: string; displayName: string; avatar: string; score: number; correctCount: number }>();
    liveComments.forEach((c) => {
      const key = c.username || c.displayName;
      const existing = map.get(key) || {
        username: key,
        displayName: c.displayName || c.username,
        avatar: (c.avatarUrl && !c.avatarUrl.includes('bottts')) ? c.avatarUrl : '',
        score: 0,
        correctCount: 0,
      };
      existing.score = Math.max(existing.score, c.totalScore ?? 0);
      if (c.isCorrect) existing.correctCount += 1;
      map.set(key, existing);
    });
    return Array.from(map.values())
      .sort((a, b) => b.score - a.score || b.correctCount - a.correctCount)
      .map((c, idx) => ({
        userId: `commenter-${c.username}`,
        displayName: c.displayName,
        avatar: c.avatar,
        score: c.score,
        streak: 0,
        bestStreak: 0,
        correctCount: c.correctCount,
        rank: idx + 1,
        isCommenter: true,
      }));
  }, [commenterRanking, liveComments]);

  const getOptionPercentage = useCallback((letter: string): number => {
    const total = Object.values(optionVotes).reduce((sum, count) => sum + count, 0);
    return total > 0 ? ((optionVotes[letter] ?? 0) / total) * 100 : 0;
  }, [optionVotes]);

  // Auto-theme mapping when question category changes
  useEffect(() => {
    if (question?.category) {
      const cat = question.category.toLowerCase();
      if (cat.includes('business') || cat.includes('toeic') || cat.includes('work') || cat.includes('finance')) {
        setArenaTheme('business');
      } else if (cat.includes('science') || cat.includes('tech') || cat.includes('academic') || cat.includes('stem')) {
        setArenaTheme('science');
      } else if (cat.includes('travel') || cat.includes('culture') || cat.includes('world') || cat.includes('country')) {
        setArenaTheme('travel');
      } else if (cat.includes('nature') || cat.includes('animal') || cat.includes('environment') || cat.includes('life')) {
        setArenaTheme('nature');
      } else {
        setArenaTheme('esports');
      }
    }
  }, [question?.category]);

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

  // Question Analytics: Option Breakdown
  const optionsAnalytics: AnswerVoteDetail[] = useMemo(() => {
    if (!question?.options || question.options.length < 2) return [];
    const totalVotes = roundSubmissions.length;

    return ['A', 'B', 'C', 'D'].slice(0, question.options.length).map((letter, idx) => {
      const respondents = roundSubmissions.filter(
        (s) => s.answer.toUpperCase() === letter,
      );
      const count = respondents.length;
      const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
      const isCorrect = typeof question.correctOptionIndex === 'number'
        ? question.correctOptionIndex === idx
        : roundSummary?.correctOptionIndex === idx;

      return {
        optionLetter: letter,
        text: question.options?.[idx] ? question.options[idx].replace(/^[ABCD][\.\:]\s*/i, '') : '',
        count,
        percentage,
        isCorrect,
        respondents: respondents.map((r) => ({
          userId: r.userId,
          displayName: r.displayName,
          avatarUrl: r.avatarUrl,
          isCorrect: r.isCorrect,
          speedMs: r.responseTimeMs,
        })),
      };
    });
  }, [question, roundSubmissions, roundSummary]);

  // Question Analytics: Text Grouped Breakdown (Fill in blank)
  const textAnalytics: GroupedTextAnswer[] = useMemo(() => {
    if (!isFillBlankGame) return [];
    const groups = new Map<string, RoundSubmissionItem[]>();

    roundSubmissions.forEach((sub) => {
      const normalized = sub.answer.trim().toLowerCase().replace(/[.,!?;:]/g, '');
      if (!groups.has(normalized)) {
        groups.set(normalized, []);
      }
      groups.get(normalized)!.push(sub);
    });

    const total = roundSubmissions.length;
    const target = (question?.targetWord || '').toLowerCase().trim();

    return Array.from(groups.entries()).map(([word, items]) => ({
      normalizedWord: word,
      count: items.length,
      percentage: total > 0 ? (items.length / total) * 100 : 0,
      isCorrect: target ? word === target : items.some((i) => i.isCorrect),
      respondents: items.map((r) => ({
        userId: r.userId,
        displayName: r.displayName,
        avatarUrl: r.avatarUrl,
        speedMs: r.responseTimeMs,
      })),
    }));
  }, [isFillBlankGame, roundSubmissions, question]);

  // Round KPIs
  const roundCorrectCount = useMemo(
    () => roundSubmissions.filter((s) => s.isCorrect === true).length,
    [roundSubmissions],
  );
  const roundIncorrectCount = useMemo(
    () => roundSubmissions.filter((s) => s.isCorrect === false).length,
    [roundSubmissions],
  );
  const roundAccuracy = useMemo(() => {
    const evaluated = roundCorrectCount + roundIncorrectCount;
    return evaluated > 0 ? (roundCorrectCount / evaluated) * 100 : 0;
  }, [roundCorrectCount, roundIncorrectCount]);

  // Match Leaderboard mapping - ALWAYS sorted by score descending
  const arenaRankPlayers: ArenaRankPlayer[] = useMemo(() => {
    const sorted = players.filter((player) => !player.isCommenter).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    return sorted.map((p, idx) => ({
      userId: p.userId,
      displayName: p.displayName,
      avatar: p.avatar,
      score: p.score,
      streak: p.streak,
      bestStreak: p.bestStreak || p.streak,
      correctCount: p.correctCount,
      totalAnswered: (p.correctCount || 0) + (p.roundScore === 0 ? 1 : 0),
      rank: idx + 1,
      rankChange: 0,
      level: Math.floor(p.score / 1000) + 1,
    }));
  }, [players]);

  // Tra cứu điểm trong phiên của từng commenter
  const commenterScoreMap = useMemo(() => {
    const map = new Map<string, number>();
    arenaRankCommenters.forEach((p) => {
      map.set(p.displayName, p.score);
    });
    return map;
  }, [arenaRankCommenters]);

  // Tên người dùng hiện tại
  const myDisplayName = useMemo(() => {
    return (user as any)?.name || user?.displayName || myPlayer?.displayName || '';
  }, [user, myPlayer?.displayName]);

  // Thứ hạng của bạn trong chế độ đấu thường
  const myPlayerRank = useMemo(() => {
    const myId = user?.id || myPlayer?.userId;
    if (!myId) return 1;
    const idx = arenaRankPlayers.findIndex((p) => p.userId === myId);
    return idx >= 0 ? idx + 1 : 1;
  }, [arenaRankPlayers, user?.id, myPlayer?.userId]);

  // Điểm của user trong phiên live (lấy điểm player hoặc điểm cmt)
  const myLiveScore = useMemo(() => {
    const cScore = myDisplayName ? (commenterScoreMap.get(myDisplayName) || 0) : 0;
    return Math.max(myPlayer?.score ?? 0, cScore);
  }, [myPlayer?.score, commenterScoreMap, myDisplayName]);

  // Thứ hạng của user trong danh sách commenter
  const myCommenterRank = useMemo(() => {
    if (!myDisplayName) return 0;
    const idx = arenaRankCommenters.findIndex((c) => c.displayName === myDisplayName);
    return idx >= 0 ? idx + 1 : 0;
  }, [arenaRankCommenters, myDisplayName]);

  // Top 1 phiên Live
  const top1LiveScore = useMemo(() => {
    return arenaRankCommenters[0]?.score ?? arenaRankPlayers[0]?.score ?? 0;
  }, [arenaRankCommenters, arenaRankPlayers]);

  const top1LiveName = useMemo(() => {
    return arenaRankCommenters[0]?.displayName || arenaRankPlayers[0]?.displayName || 'Top 1';
  }, [arenaRankCommenters, arenaRankPlayers]);

  const top1LiveAvatar = useMemo(() => {
    return arenaRankCommenters[0]?.avatar || arenaRankPlayers[0]?.avatar;
  }, [arenaRankCommenters, arenaRankPlayers]);

  const sortedBattlePlayers = useMemo(() => {
    return players
      .filter((p) => !p.isCommenter)
      .map((p, idx) => ({
        userId: p.userId,
        displayName: p.displayName,
        avatar: p.avatar,
        score: p.score || 0,
        rank: p.rank || idx + 1,
        streak: p.streak || 0,
        correctCount: p.correctCount,
        answeredCount: p.answeredCount,
        totalResponseTimeMs: p.totalResponseTimeMs,
        isCurrentUser: p.userId === (myPlayer?.userId ?? user?.id),
      }))
      .sort((a, b) => b.score - a.score || a.rank - b.rank)
      .map((player, index) => ({ ...player, rank: index + 1 }));
  }, [players, user?.id, myPlayer?.userId]);

  const myBattlePlayer = useMemo(() => {
    if (!myPlayer) return null;
    return {
      userId: myPlayer.userId,
      displayName: myPlayer.displayName,
      avatar: myPlayer.avatar,
      score: myPlayer.score || 0,
      rank: sortedBattlePlayers.find((player) => player.userId === myPlayer.userId)?.rank ?? myPlayer.rank,
      streak: myPlayer.streak || 0,
      correctCount: myPlayer.correctCount,
      answeredCount: myPlayer.answeredCount,
      totalResponseTimeMs: myPlayer.totalResponseTimeMs,
      isCurrentUser: true,
    };
  }, [myPlayer, sortedBattlePlayers]);

  useEffect(() => {
    if (roomStatus !== 'ROUND_END') return;
    const timer = setInterval(() => {
      setResultSeconds(Math.max(0, Math.ceil((summaryDeadline.current - Date.now()) / 1000)));
    }, 125);
    return () => clearInterval(timer);
  }, [roomStatus]);

  // Synchronized room uptime ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setRoomUptime(Math.max(0, Math.floor((Date.now() - roomCreatedAt) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [roomCreatedAt]);

  // Periodic round-trip network latency ping
  useEffect(() => {
    if (!socket || !isConnected) return;
    const ping = () => {
      const clientTime = Date.now();
      socket.emit('ping_latency', { clientTime, roomCode, userId: user?.id }, (res?: any) => {
        const rtt = res?.latencyMs ?? (Date.now() - clientTime);
        if (typeof rtt === 'number' && !isNaN(rtt) && rtt >= 0) {
          setNetworkLatency(Math.max(5, rtt));
        }
      });
    };
    ping();
    const interval = setInterval(ping, 5000);
    return () => clearInterval(interval);
  }, [socket, isConnected, roomCode, user?.id]);

  // Language definition
  const currentLangDef = useMemo(() => {
    return getLanguage(question?.languageCode || roomLanguageId) || activeLanguage;
  }, [question?.languageCode, roomLanguageId, activeLanguage]);

  // Auto-unlock audio engine on user interaction
  useEffect(() => {
    const unlock = () => {
      audioEngine.unlock();
    };
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
    audioEngine.unlock();
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  const copyRoomCode = () => {
    if (!roomCode || roomCode.startsWith('auto_')) return;
    navigator.clipboard.writeText(roomCode);
    setIsCopiedCode(true);
    setTimeout(() => setIsCopiedCode(false), 2000);
  };

  useEffect(() => {
    completedRoom.current = null;
    setFinalResult(null);
    setNextRotationData(null);
    setRoomStatus('WAITING');
    setLiveComments([]);
    setCommenterRanking([]);
  }, [roomId]);

  // Setup Socket.IO connection
  useEffect(() => {
    const socketUrl =
      import.meta.env.VITE_WS_URL ||
      import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '')?.replace('/api', '') ||
      'http://localhost:4000';

    const s = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      auth: (cb) => cb({ token: localStorage.getItem('vocabflow_access_token'), deviceId: getOrCreateDeviceId() }),
    });

    const handleJoin = (result: { status?: string; message?: string } | undefined) => {
      if (result?.status !== 'error') return;
      if (result.message === ROOM_LOGIN_ERROR && isInitiallyLive) {
        setJoinError('Chưa thể vào phòng Live với tư cách khách. Vui lòng thử lại sau.');
        promptLogin(ROOM_LOGIN_REASON);
        return;
      }
      setJoinError(result.message || 'Không thể vào phòng.');
      if (result.message === ROOM_LOGIN_ERROR) promptLogin(ROOM_LOGIN_REASON);
    };
    s.on('connect_error', () => setJoinError('Mất kết nối với máy chủ. Đang thử kết nối lại.'));
    s.on('connect', () => {
      setJoinError('');
      setIsConnected(true);
      const isCustomRoom = roomId && !roomId.startsWith('auto_');
      const targetLang = urlLang || activeLanguage.id;

      const cleanAvatar = user?.avatar && !user.avatar.includes('bottts') ? user.avatar : '';

      if (isCustomRoom) {
        s.emit('room:join_custom', {
          roomCode: roomId,
          guestKey,
          displayName: user?.displayName || 'Learner',
          avatar: cleanAvatar,
          languageId: targetLang,
          spectator: isSpectator,
          password: roomPassword || undefined,
        }, handleJoin);
      } else {
        s.emit('join_game', {
          gameMode,
          userId: user?.id || `anon_${Math.random().toString(36).slice(2, 7)}`,
          displayName: user?.displayName || 'Learner',
          avatar: cleanAvatar,
          languageId: targetLang,
        }, handleJoin);
      }
    });

    s.on('disconnect', () => {
      setIsConnected(false);
      setViewerCount(null);
    });

    // Custom Room Joined
    s.on('room:joined_success', (data: any) => {
      if (completedRoom.current === data.roomCode) return;
      setJoinError('');
      setRoomCode(data.roomCode);
      const cleanTitle =
        data.title?.startsWith('auto_') ||
        data.title === 'FIX_SENTENCE' ||
        data.title === 'FIX SENTENCE'
          ? GAME_MODE_TITLES[gameMode] || data.title.replace(/_/g, ' ')
          : data.title || GAME_MODE_TITLES[gameMode] || 'Đấu Trường VocabFlow';
      setRoomTitle(cleanTitle);
      setRoomStatus(data.status);
      setTotalRounds(data.totalRounds);
      setMyPlayer(data.player);
      if (data.languageId) setRoomLanguageId(data.languageId);
      setRoomMode(data.isLiveMode ? 'LIVE' : 'STUDY');
      setIsReadOnly(Boolean(data.isSpectator));
      if (data.liveStatus) setLiveStatus(data.liveStatus);
      if (data.players) setPlayers(data.players);
      setCommenterRanking(data.commenterRanking ?? []);
      setIsHost(Boolean(data.player?.isHost));
      if (data.roundAnswerCount) setRoundAnswerCount(data.roundAnswerCount);
      setOptionVotes(data.liveOptionVotes ?? {});
    });

    s.on('room:viewer_count', ({ count }: { count: number }) => setViewerCount(count));

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
      if (completedRoom.current) return;
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
      if (completedRoom.current === data.roomCode) return;
      setRoomCode(data.roomCode);
      const cleanTitle =
        data.title?.startsWith('auto_') ||
        data.title === 'FIX_SENTENCE' ||
        data.title === 'FIX SENTENCE'
          ? GAME_MODE_TITLES[gameMode] || data.title.replace(/_/g, ' ')
          : data.title || GAME_MODE_TITLES[gameMode] || 'Đấu Trường VocabFlow';
      setRoomTitle(cleanTitle);
      setRoomStatus(data.status);
      setTotalRounds(data.totalRounds);
      if (data.languageId) setRoomLanguageId(data.languageId);
      if (data.createdAt) setRoomCreatedAt(data.createdAt);
      if (data.themeColor) setThemeColor(data.themeColor);
      setMyPlayer(data.player);
      setPlayers(data.ranking || []);
    });

    s.on('player_joined', (data: any) => {
      setPlayers(data.ranking || []);
    });

    s.on('game_starting_countdown', (data: { secondsRemaining: number }) => {
      if (completedRoom.current) return;
      setRoomStatus('STARTING');
      setCountdown(data.secondsRemaining);
    });

    // Round Started
    s.on('round_started', (data: any) => {
      if (completedRoom.current) return;
      activeRound.current = data.round;
      activeQuestionId.current = data.question?.id;
      submittedRound.current = data.alreadyAnswered ? data.round : null;
      setSkipped(false);
      setLiveComments([]);
      setLiveTop3(data.liveTop3 ?? []);
      if (typeof data.isLiveMode === 'boolean') setRoomMode(data.isLiveMode ? 'LIVE' : 'STUDY');
      setRoomStatus('IN_ROUND');
      setCountdown(null);
      playQuestionTransitionSound();
      setCurrentRound(data.round);
      setTotalRounds(data.totalRounds);
      setQuestion(data.question);
      if (data.question?.languageCode) setRoomLanguageId(data.question.languageCode);
      const duration = data.durationSec ?? 15;
      setRoundDuration(duration);
      roundDeadline.current = Date.now() + (
        typeof data.deadlineAt === 'number' && typeof data.serverTime === 'number'
          ? Math.max(0, data.deadlineAt - data.serverTime)
          : (data.remainingSec ?? duration) * 1000
      );
      setTimerRemaining(Math.max(0, Math.ceil((roundDeadline.current - Date.now()) / 1000)));
      setAnswerInput('');
      setSelectedOptionIndex(null);
      setHasSubmitted(Boolean(data.alreadyAnswered));
      setEvaluation(null);
      setRoundSummary(null);
      setRoundAnswerCount(0);
      setRoundSubmissions([]);
      setOptionVotes(data.liveOptionVotes ?? {});
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
      const lang = data.question?.languageCode || roomLanguageId || activeLanguage.id;
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

    // Only round-scoped, server-validated responses feed the live panels.
    s.on('live_comment_received', (comment: LiveCommentItem) => {
      if (completedRoom.current || comment.round !== activeRound.current) return;
      setLiveComments((prev) => prev.some((entry) => entry.eventId === comment.eventId ||
        (entry.accepted === false && comment.accepted === false && entry.username === comment.username))
        ? prev : [comment, ...prev.slice(0, 49)]);
      if (comment.liveOptionVotes) setOptionVotes(comment.liveOptionVotes);
      if (comment.liveTop3) setLiveTop3(comment.liveTop3);
      if (comment.commenterRanking) setCommenterRanking(comment.commenterRanking);
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
    s.on('answer_result', (data: { round: number; skipped?: boolean; evaluation: AnswerEvaluation; currentScore: number; currentStreak: number; rank: number }) => {
      if (data.round !== activeRound.current) return;
      setHasSubmitted(true);
      setIsCheckingAnswer(false);
      setEvaluation(data.evaluation);
      setSkipped(Boolean(data.skipped));
      if (data.evaluation.isCorrect) playCorrectSound(data.currentStreak);
      else if (!data.skipped) playWrongSound();
      const questionId = activeQuestionId.current;
      setMatchVocabs((prev) => prev.map((item) => item.id === questionId
        ? { ...item, isCorrect: data.evaluation.isCorrect } : item));
      setMyPlayer((prev) => prev && ({
        ...prev,
        score: data.currentScore,
        roundScore: data.evaluation.score,
        streak: data.currentStreak,
        rank: data.rank,
      }));
    });

    // Round Ended Summary
    s.on('room:game_paused', ({ remainingSec }: { remainingSec: number }) => {
      if (completedRoom.current) return;
      setTimerRemaining(remainingSec);
      setRoomStatus('PAUSED');
    });
    s.on('room:game_resumed', ({ remainingSec }: { remainingSec: number }) => {
      if (completedRoom.current) return;
      roundDeadline.current = Date.now() + remainingSec * 1000;
      setTimerRemaining(remainingSec);
      setRoomStatus('IN_ROUND');
    });
    s.on('room:time_extended', ({ newRemainingSec: remainingSec }: { newRemainingSec: number }) => {
      if (completedRoom.current) return;
      roundDeadline.current = Date.now() + remainingSec * 1000;
      setTimerRemaining(remainingSec);
    });

    s.on('round_ended', (data: any) => {
      if (completedRoom.current) return;
      if (data.round !== activeRound.current) return;
      const remaining = typeof data.summaryEndsAt === 'number' && typeof data.serverTime === 'number'
        ? Math.max(0, data.summaryEndsAt - data.serverTime) : 5000;
      summaryDeadline.current = Date.now() + remaining;
      setResultSeconds(Math.ceil(remaining / 1000));
      setTimerRemaining(0);
      if (data.liveOptionVotes) setOptionVotes(data.liveOptionVotes);
      if (data.liveTop3) setLiveTop3(data.liveTop3);
      setRoomStatus('ROUND_END');
      setRoundSummary(data);
      const arena = data.inAppRanking ?? data.ranking;
      if (arena) setPlayers(arena);
      if (data.commenterRanking) setCommenterRanking(data.commenterRanking);
      playRoundEndSound();
    });

    // Ranking Update
    s.on('live_ranking_update', (data: any) => {
      if (completedRoom.current) return;
      const arena = data.inAppRanking ?? data.ranking;
      if (arena) setPlayers(arena);
      if (data.commenterRanking) setCommenterRanking(data.commenterRanking);
      if (data.roundAnswerCount !== undefined) setRoundAnswerCount(data.roundAnswerCount);
      if (data.lastAnsweredBy && data.lastAnsweredBy.displayName) {
        const pName = data.lastAnsweredBy.displayName;
        const myName = (user as any)?.name || user?.displayName || myPlayer?.displayName || 'Bạn';
        if (pName !== myName) {
          setRoundSubmissions((prev) => {
            if (prev.some((s) => s.displayName === pName)) return prev;
            return [
              ...prev,
              {
                userId: `p-${Date.now()}-${Math.random()}`,
                displayName: pName,
                avatarUrl: undefined,
                answer: data.lastAnsweredBy.isCorrect ? 'A' : 'B',
                isCorrect: data.lastAnsweredBy.isCorrect,
                scoreEarned: data.lastAnsweredBy.scoreAdded || 0,
                responseTimeMs: Math.floor(Math.random() * 2000 + 800),
                streak: data.lastAnsweredBy.streak || 0,
                rank: prev.length + 1,
                timestamp: Date.now(),
              },
            ];
          });
        }
      }
    });

    // Game Finished & Match Celebration
    s.on('game_finished', (data: ChampionshipResult) => {
      if (completedRoom.current === data.roomCode) return;
      completedRoom.current = data.roomCode;
      setJoinError('');
      setFinalResult(data);
      setRoomStatus('FINISHED');
      liveBgmEngine.stop();
      setIsBgmActive(false);
      playVictoryFanfare();
    });

    // Auto-Continuous Rotation from server
    let rotationTimer: ReturnType<typeof setTimeout> | undefined;
    s.on('match_rotation_started', (data: any) => {
      setNextRotationData(data);
      if (data?.nextRoomCode) {
        clearTimeout(rotationTimer);
        rotationTimer = setTimeout(() => {
          navigate(`/games/room/${data.nextRoomCode}?mode=${gameMode}&lang=${roomLanguageId}`);
        }, (data.countdownSec || 3) * 1000);
      }
    });

    s.on('match_waiting_for_public_game', (data: any) => {
      setIsWaitingForPublicGame(true);
    });

    setSocket(s);

    return () => {
      clearTimeout(rotationTimer);
      s.disconnect();
      try {
        liveBgmEngine.stop();
      } catch (_) {}
    };
  }, [roomId, gameMode, urlLang, activeLanguage?.id, user?.id, isSpectator, roomPassword, promptLogin, guestKey, isInitiallyLive]);

  // Round Timer countdown with dynamic urgent BGM pacing
  useEffect(() => {
    if (roomStatus !== 'IN_ROUND') {
      liveBgmEngine.setUrgent(false);
      return;
    }
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((roundDeadline.current - Date.now()) / 1000));
      setTimerRemaining((previous) => {
        if (previous === remaining) return previous;
        liveBgmEngine.setUrgent(remaining > 0 && remaining <= 5);
        if (remaining > 0 && remaining <= 3) playWarningTickSound(remaining);
        else if (remaining > 0 && remaining <= 5) playCountdownTickSound();
        return remaining;
      });
    }, 250);

    return () => {
      clearInterval(timer);
      liveBgmEngine.setUrgent(false);
    };
  }, [roomStatus]);

  // Audio Playback & Pronunciation
  const playQuestionAudio = (forceTarget?: string) => {
    const promptTarget = question?.targetWord || (question?.prompt?.match(/「([^」]+)」/)?.[1]);
    const text = forceTarget || promptTarget || (question?.prompt && question.prompt.length < 35 ? question.prompt : '');
    const audioUrl = question?.audioUrl;
    if (!text && !audioUrl) return;

    setIsPlayingAudio(true);
    const lang = question?.languageCode || roomLanguageId || activeLanguage.id;
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

  const submitBattleAnswer = (answer: string, index: number | null = null, skip = false) => {
    if (isReadOnly || !isConnected || Date.now() >= roundDeadline.current ||
        submittedRound.current === currentRound || !socket || roomStatus !== 'IN_ROUND' || roomMode !== 'STUDY') return;
    const round = currentRound;
    submittedRound.current = round;
    setSelectedOptionIndex(index);
    setHasSubmitted(true);
    setSkipped(skip);
    socket.emit('submit_answer', { roomCode, answer, round, skip }, (response: { status: string }) => {
      if (response?.status === 'submitted' || activeRound.current !== round) return;
      submittedRound.current = null;
      setSelectedOptionIndex(null);
      setHasSubmitted(false);
      setSkipped(false);
    });
  };

  // Host Controls
  const handleHostStartGame = () => {
    if (!socket || !isHost) return;
    if (roomMode === 'LIVE' && liveStatus.status !== 'CONNECTED') {
      setIsLiveModalOpen(true);
      return;
    }
    playGameStartSound();
    if (!isBgmActive) {
      liveBgmEngine.setVolume(bgmVolume);
      liveBgmEngine.start();
      setIsBgmActive(true);
    }
    socket.emit('room:host_start_game', { roomCode }, (result: { status?: string; message?: string }) => {
      if (result?.status === 'error') {
        setJoinError(result.message || 'Không thể bắt đầu trận.');
        liveBgmEngine.stop();
        setIsBgmActive(false);
      }
    });
  };

  const handleHostPauseGame = () => {
    if (!socket || !isHost) return;
    if (roomStatus === 'IN_ROUND') {
      socket.emit('room:host_pause_game', { roomCode });
    } else if (roomStatus === 'PAUSED') {
      socket.emit('room:host_resume_game', { roomCode });
    }
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
    setLiveValidationWarning(null);
    setLiveConnectionMessage('');

    let channelName = targetChannelInput.trim();
    const liveRoomId = liveRoomIdInput.trim();

    if (liveProviderChoice === 'MOCK') {
      const mockChannel = channelName || 'demo_stream';
      setIsSubmittingLive(true);
      socket?.timeout(10000).emit('room:connect_live', {
        roomCode,
        provider: 'MOCK',
        channelName: mockChannel,
      }, (error: Error | null, result?: any) => {
        setIsSubmittingLive(false);
        const isOk = !error && (result?.success || result?.status === 'MOCK_ACTIVE' || result?.status === 'CONNECTED');
        if (isOk) {
          setLiveConnectionSuccess(true);
          setTimeout(() => {
            setIsLiveModalOpen(false);
            setLiveConnectionSuccess(false);
          }, 900);
          return;
        }
        setLiveConnectionMessage(error ? 'Máy chủ đấu trường chưa phản hồi sau 10s.' : result?.message || 'Không thể kích hoạt chế độ Giả Lập.');
      });
      return;
    }

    // Normal TIKTOK_LIVE flow
    // 1. URL extraction: if user entered a full tiktok URL
    if (channelName.includes('tiktok.com/')) {
      const match = channelName.match(/@([a-zA-Z0-9_\.]+)/);
      if (match && match[1]) {
        channelName = `@${match[1]}`;
        setTargetChannelInput(channelName);
      }
    }

    // 2. Validate empty
    if (!channelName && !liveRoomId) {
      setLiveValidationWarning('Vui lòng nhập TikTok username (@ten_kenh), Room ID hoặc đường link livestream.');
      return;
    }

    // 3. Validate TikTok username format
    const rawUsername = channelName.replace(/^@/, '').trim();
    if (rawUsername) {
      if (rawUsername.length < 2) {
        setLiveValidationWarning('Tên tài khoản TikTok quá ngắn (tối thiểu 2 ký tự).');
        return;
      }
      if (rawUsername.length > 32) {
        setLiveValidationWarning('Tên tài khoản TikTok quá dài (tối đa 32 ký tự).');
        return;
      }
      if (!/^[a-zA-Z0-9_\.]+$/.test(rawUsername)) {
        setLiveValidationWarning('Tên kênh TikTok chỉ được chứa chữ cái, chữ số, dấu gạch dưới (_) hoặc dấu chấm (.).');
        return;
      }
    }

    if (!socket?.connected) {
      setLiveConnectionMessage('Chưa kết nối với máy chủ đấu trường. Vui lòng kiểm tra lại mạng.');
      return;
    }

    setIsSubmittingLive(true);
    socket.timeout(10000).emit('room:connect_live', {
      roomCode,
      provider: 'TIKTOK_LIVE',
      channelName: rawUsername ? `@${rawUsername}` : channelName,
      roomId: liveRoomId || undefined,
      sessionToken: sessionTokenInput.trim() || undefined,
    }, (error: Error | null, result?: { success?: boolean; status?: string; message?: string }) => {
      setIsSubmittingLive(false);
      const isSuccess = !error && (result?.success || result?.status === 'CONNECTED' || result?.status === 'CONNECTING');
      if (isSuccess) {
        setLiveConnectionSuccess(true);
        setTimeout(() => {
          setIsLiveModalOpen(false);
          setLiveConnectionSuccess(false);
        }, 1000);
        return;
      }
      setLiveConnectionMessage(error
        ? 'Máy chủ đấu trường chưa phản hồi sau 10s. Vui lòng thử lại.'
        : result?.message || 'Không thể kết nối phiên Live. Vui lòng kiểm tra lại TikTok Username.');
    });
  };

  const handleSendTestComment = () => {
    if (!socket || !isHost) return;
    const testOptions = ['A', 'B', 'C', 'D'];
    const randomOption = testOptions[Math.floor(Math.random() * testOptions.length)];
    socket.emit('room:send_mock_comment', {
      roomCode,
      commentText: `Đáp án ${randomOption} nhé host ơi! 🔥`,
    });
    setTestCommentSent(true);
    setTimeout(() => setTestCommentSent(false), 2000);
  };

  const handleDisconnectLive = () => {
    if (!socket) return;
    socket.emit('room:disconnect_live', { roomCode });
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

  // Top 3 Podium (Always use arenaRankPlayers sorted order)
  const top1 = arenaRankPlayers[0] || null;
  const top2 = arenaRankPlayers[1] || null;
  const top3 = arenaRankPlayers[2] || null;

  const hasVoteChoices = Boolean(question?.options?.length);
  const matchPanel = preferredMatchPanel === 'distribution' && !hasVoteChoices ? 'comments' : preferredMatchPanel;

  const activeMatch = !joinError && Boolean(question) && ['IN_ROUND', 'PAUSED', 'ROUND_END'].includes(roomStatus);
  const usesArenaShell = activeMatch || roomStatus === 'FINISHED';
  const leaveArena = () => navigate('/games');
  const playCurrentQuestionAudio = () => playQuestionAudio();

  return (
    <div
      ref={roomPageRef}
      className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] overflow-x-hidden overflow-y-auto pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-slate-100 flex flex-col transition-colors selection:bg-rose-500/30 selection:text-white bg-[#110f25]"
    >
      {/* ======================================================== */}
      {/* DYNAMIC PROCEDURAL ARENA BACKGROUND                      */}
      {/* ======================================================== */}
      {isBroadcastView && !usesArenaShell && (
        <ArenaDynamicBackground
          theme={arenaTheme}
          category={question?.category}
          languageId={roomLanguageId}
          gameState={roomStatus}
        />
      )}

      {/* Correct Answer Celebration Confetti & Hero Banner */}
      <ArenaCelebrationOverlay
        show={!usesArenaShell && celebrationData.show}
        score={celebrationData.score}
        streak={celebrationData.streak}
        speedMs={celebrationData.speedMs}
        onComplete={() => setCelebrationData((prev) => ({ ...prev, show: false }))}
      />

      {/* Floating Saved Word Toast */}
      {savedWordsNotice && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <Bookmark className="w-4 h-4 fill-white" />
          <span>{savedWordsNotice}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. BROADCAST STUDIO HEADER & MODE SELECTOR (Desktop Studio Only) */}
      {/* ======================================================== */}
      {!isBroadcastView && !usesArenaShell && (
        <header className="relative z-20 shrink-0 border-b border-indigo-400/25 bg-indigo-950 px-3 py-1.5 lg:hidden">
          <div className="flex items-center justify-between gap-2">
            <Link to="/games" className="flex min-h-9 shrink-0 items-center px-1 text-xs font-semibold text-slate-300 hover:text-white">← Sảnh</Link>
            <h1 className="min-w-0 flex-1 truncate text-sm font-bold text-white text-center">{roomTitle}</h1>
            {!roomCode.startsWith('auto_') && roomCode && (
              <button type="button" onClick={copyRoomCode} aria-label="Sao chép mã phòng"
                className="min-h-9 rounded-lg px-2 text-xs font-mono font-bold bg-amber-500/15 border border-amber-400/40 text-amber-300 shrink-0">
                {isCopiedCode ? 'Đã chép' : `PIN: ${displayRoomCode}`}
              </button>
            )}
          </div>
          <div className="flex items-center justify-between gap-x-2 pt-1 text-[11px] text-slate-400 border-t border-indigo-900/50 mt-1">
            <span className="inline-flex items-center gap-1">
              <CountryFlag languageId={currentLangDef.id} size="xs" />
              <span>{currentLangDef.name}</span>
            </span>
            <span>{players.length} người chơi</span>
            {roomMode === 'LIVE' ? (
              <span className="inline-flex items-center gap-1 text-rose-300 font-semibold">
                <Eye className="h-3.5 w-3.5" aria-hidden="true" /> {viewerCount ?? '0'} xem
              </span>
            ) : <span>Phòng luyện tập</span>}
          </div>
        </header>
      )}
      {!usesArenaShell && <header className="hidden lg:block relative z-20 shrink-0 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl px-3 py-2 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Branding & Room Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 p-0.5 shadow-lg shadow-indigo-500/25 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-indigo-400" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-black text-sm sm:text-base text-white truncate max-w-[140px] sm:max-w-xs md:max-w-md">
                  {roomTitle}
                </h1>

                {/* Prominent Legible Room PIN Badge with 1-click copy - only shown once roomCode is loaded */}
                {roomCode && !roomCode.startsWith('auto_') ? (
                  <button
                    type="button"
                    onClick={copyRoomCode}
                    className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border-2 border-amber-400/60 text-amber-300 font-mono font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                    title="Nhấn để sao chép mã PIN hoặc link phòng đấu"
                  >
                    <span className="text-[10px] uppercase text-amber-400 font-sans font-black">
                      PIN:
                    </span>
                    <span className="text-white font-bold">{displayRoomCode}</span>
                    {isCopiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-300" />}
                  </button>
                ) : (
                  <div className="px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 font-bold text-xs flex items-center gap-1.5 shadow-sm">
                    <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                    <span className="hidden sm:inline">Đang tạo mã phòng...</span>
                  </div>
                )}

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
                  <strong className="text-white">{arenaRankPlayers.length}</strong> người chơi
                </span>
                {roomMode === 'LIVE' && (
                  <span className="flex items-center gap-1 text-rose-200">
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" /> {viewerCount ?? '—'} đang xem trên VocabFlow
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Studio Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Live Config Modal Button (In Live Mode) */}
            {isHost && roomMode === 'LIVE' && (
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

            {/* BGM Toggle & Volume Control */}
            <div className="relative flex items-center">
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
              <button
                type="button"
                onClick={() => setShowSoundPopover((prev) => !prev)}
                className="p-1.5 text-slate-400 hover:text-white transition cursor-pointer"
                title="Cài đặt âm lượng"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
              {showSoundPopover && (
                <div className="absolute right-0 top-full mt-2 w-48 p-3 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl z-50 space-y-2 backdrop-blur-xl">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                    <span>Âm lượng BGM</span>
                    <span className="font-mono text-emerald-400">{Math.round(bgmVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={bgmVolume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setBgmVolume(v);
                      liveBgmEngine.setVolume(v);
                      if (v > 0 && !isBgmActive) {
                        liveBgmEngine.start();
                        setIsBgmActive(true);
                      } else if (v === 0 && isBgmActive) {
                        liveBgmEngine.stop();
                        setIsBgmActive(false);
                      }
                    }}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              )}
            </div>

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
      </header>}

      {/* ======================================================== */}
      {/* 2. HOST QUICK TOOLBAR (ONLY FOR HOST USERS)              */}
      {/* ======================================================== */}
      {isHost && !usesArenaShell && (
        <div className="relative z-10 bg-indigo-950/40 border-b border-indigo-500/20 px-4 py-2 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 fill-amber-400" />
                <span>Host:</span>
              </span>

              {roomStatus === 'WAITING' && (
                <button
                  onClick={() => handleHostStartGame()}
                  className="min-h-11 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black transition flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>Bắt Đầu Game</span>
                </button>
              )}

              {!isBroadcastView && roomMode === 'LIVE' && (
                <button type="button" onClick={() => setIsLiveModalOpen(true)}
                  className="min-h-11 rounded-lg bg-slate-800 px-3 font-semibold text-slate-200 hover:bg-slate-700 lg:hidden">
                  Kết nối TikTok
                </button>
              )}


            </div>


          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MAIN ARENA LAYOUT (STUDY VS LIVE BROADCAST)           */}
      {/* ======================================================== */}
      <div className={`relative z-10 flex-1 w-full flex flex-col ${usesArenaShell ? "min-h-0" : "min-h-min p-3 sm:p-5"} ${isMobileMode && activeMatch ? "arena-mobile-wrapper" : ""}`}>
        {joinError === ROOM_LOGIN_ERROR && !loginPromptOpen && (
          <div className="mx-auto my-auto w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-indigo-500/30 text-center shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-xl animate-fade-in">
            {/* Ambient glow */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Badge Icon */}
            <div className="relative mx-auto w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-8 h-8 text-indigo-400" />
            </div>

            <div className="space-y-2 relative z-10">
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 inline-block">
                Xác thực đấu sĩ
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Đăng Nhập Để Vào Đấu Trường
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
                Tham gia thi đấu đối kháng, tích lũy điểm xếp hạng Elo, ghi danh Bảng Vàng và bảo vệ tiến độ học tập.
              </p>
            </div>

            {/* Perks grid */}
            <div className="grid grid-cols-3 gap-2 py-1 text-left relative z-10">
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1">
                <Zap className="w-4 h-4 text-amber-400" />
                <div className="text-[11px] font-bold text-white">Điểm Elo</div>
                <div className="text-[10px] text-slate-400">Xếp hạng realtime</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1">
                <Trophy className="w-4 h-4 text-indigo-400" />
                <div className="text-[11px] font-bold text-white">Bảng Vàng</div>
                <div className="text-[10px] text-slate-400">Vinh danh cao thủ</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1">
                <Flame className="w-4 h-4 text-rose-400" />
                <div className="text-[11px] font-bold text-white">Chuỗi Thắng</div>
                <div className="text-[10px] text-slate-400">Huy hiệu độc quyền</div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2.5 pt-1 relative z-10">
              <button
                type="button"
                onClick={() => promptLogin(ROOM_LOGIN_REASON)}
                className="btn-glass-primary w-full !py-3 !px-5 !rounded-2xl text-sm !font-black transition flex items-center justify-center gap-2 group cursor-pointer"
              >
                <LogIn className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                <span>Đăng Nhập / Đăng Ký Ngay</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/games')}
                className="w-full py-2.5 px-4 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-semibold hover:bg-slate-800/60 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay về Sảnh Đấu Trường</span>
              </button>
            </div>
          </div>
        )}
        {roomStatus !== 'FINISHED' && joinError && joinError !== ROOM_LOGIN_ERROR && (
          <div className="mx-auto my-auto w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-700/80 text-center shadow-2xl space-y-5 relative overflow-hidden backdrop-blur-xl animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-md">
              {joinError === 'Cần mật khẩu phòng.' ? (
                <Lock className="w-7 h-7 text-amber-400" />
              ) : (
                <AlertCircle className="w-7 h-7 text-rose-400" />
              )}
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-white">
                {joinError === 'Cần mật khẩu phòng.'
                  ? 'Phòng Đấu Yêu Cầu Mật Khẩu'
                  : joinError.startsWith('Trận đã bắt đầu')
                  ? 'Trận Đấu Đang Diễn Ra'
                  : 'Không Thể Tham Gia Phòng'}
              </h3>
              <p role="alert" className="text-xs text-slate-300 leading-relaxed">
                {joinError}
              </p>
            </div>

            {joinError === 'Cần mật khẩu phòng.' && (
              <form
                className="space-y-3 pt-1"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (passwordAttempt && passwordAttempt === roomPassword) socket?.disconnect().connect();
                  else setRoomPassword(passwordAttempt);
                }}
              >
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    aria-label="Mật khẩu phòng"
                    placeholder="Nhập mật khẩu phòng đấu..."
                    value={passwordAttempt}
                    onChange={(event) => setPasswordAttempt(event.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Xác Nhận & Vào Phòng
                </button>
              </form>
            )}

            <div className="flex flex-col gap-2 pt-2">
              {!isSpectator && joinError.startsWith('Trận đã bắt đầu') && (
                <button
                  type="button"
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  onClick={() => navigate(`/games/room/${roomId}?view=spectator`, { state: { roomPassword } })}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Vào Xem Trực Tiếp (Khán Giả)</span>
                </button>
              )}
              <button
                type="button"
                className="w-full py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold hover:bg-slate-800/50 transition flex items-center justify-center gap-1.5 cursor-pointer"
                onClick={() => navigate('/games')}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Về Sảnh Đấu Trường</span>
              </button>
            </div>
          </div>
        )}
        {/* VIEW A: WAITING / STARTING COUNTDOWN */}
        {!joinError && (roomStatus === 'WAITING' || roomStatus === 'STARTING') && (
          <div className={`my-auto mx-auto w-full shrink-0 p-4 sm:p-6 rounded-2xl border border-indigo-400/30 bg-indigo-950 bg-cover bg-center text-center space-y-5 relative overflow-hidden ${isMobileMode ? "max-w-[420px]" : "max-w-3xl"}`} style={INTERACTIVE_STAGE_STYLE}>

            {countdown !== null && countdown > 0 ? (
              <div className="space-y-4 py-8 animate-fade-in relative z-10">
                <span className="text-xs font-black tracking-widest text-indigo-400 uppercase">
                  TRẬN ĐẤU CHUẨN BỊ BẮT ĐẦU
                </span>
                <div className="text-8xl sm:text-9xl font-mono font-black tabular-nums text-indigo-400 animate-pulse">
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
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-950 text-indigo-300">
                  <Gamepad2 className="h-6 w-6" />
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-semibold text-cyan-200">
                    {roomMode === 'LIVE' ? 'Sảnh chờ TikTok Live' : 'Sảnh chờ'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">{roomTitle}</h2>

                  {/* Room code is shown once it is loaded and ready. */}
                  {roomCode && !roomCode.startsWith('auto_') ? (
                    <div className="mx-auto flex w-fit max-w-full items-center gap-2 rounded-xl border border-amber-400/50 bg-amber-500/10 py-1 pl-3 pr-1">
                      <div className="min-w-0 text-left">
                        <span className="block text-xs font-semibold text-amber-300">
                          Mã PIN vào phòng
                        </span>
                        <span className="break-all text-base font-bold tracking-wide text-white tabular-nums">{displayRoomCode}</span>
                      </div>
                      <button
                        onClick={copyRoomCode}
                        className="flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-amber-500 px-2.5 text-xs font-bold text-slate-950 transition hover:bg-amber-400 focus-visible:ring-2 focus-visible:ring-white"
                        title="Sao chép mã PIN vào phòng"
                      >
                        {isCopiedCode ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
                        <span>{isCopiedCode ? 'Đã Chép!' : 'Sao Chép'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="mx-auto flex min-h-11 w-fit max-w-full items-center justify-center gap-2 rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-3 py-1">
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                      <span className="text-xs font-bold text-indigo-200">Đang kết nối & nạp mã phòng đấu...</span>
                    </div>
                  )}

                  <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
                    <CountryFlag languageId={currentLangDef.id} countryCode={currentLangDef.countryCode} size="xs" />
                    <strong className="ml-2 text-white">{currentLangDef.name}</strong> ·{' '}
                    <strong className="text-white">{totalRounds} câu</strong>
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
                        <PlayerAvatar size="xs" avatarUrl={p.avatar} displayName={p.displayName} />
                        <span className="truncate max-w-[100px]">{p.displayName}</span>
                        {p.isHost && <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* TikTok Live Status / Scanner in Waiting Room */}
                {roomMode === 'LIVE' && (
                  <div className="max-w-md mx-auto p-3.5 rounded-2xl bg-slate-900/90 border border-rose-500/30 flex items-center justify-between gap-3 shadow-lg my-2">
                    <div className="flex items-center gap-2.5 min-w-0 text-left">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                        <TikTokLogo className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          TikTok Live Scanner
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              liveStatus.status === 'CONNECTED'
                                ? 'bg-emerald-400 animate-pulse'
                                : liveStatus.status === 'CONNECTING'
                                ? 'bg-amber-400 animate-ping'
                                : 'bg-rose-500'
                            }`}
                          />
                          <span className="text-xs font-bold text-white truncate">
                            {liveStatus.status === 'CONNECTED'
                              ? `Đã quét luồng: ${liveStatus.channelName || (liveStatus as any).targetChannel || '@tiktok'}`
                              : liveStatus.status === 'CONNECTING'
                              ? 'Đang chờ nguồn bình luận TikTok'
                              : 'Chưa quét kết nối luồng Live'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isHost && <button
                      type="button"
                      onClick={() => setIsLiveModalOpen(true)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                        liveStatus.status === 'CONNECTED'
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10'
                          : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30'
                      }`}
                    >
                      {liveStatus.status === 'CONNECTED' ? 'Cấu Hình Lại' : 'Quét Luồng Ngay'}
                    </button>}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {isHost ? (
                    <div className="flex flex-wrap items-center justify-center gap-2.5">
                      <button
                        onClick={handleHostStartGame}
                        className="btn-glass-primary flex min-h-11 items-center gap-2"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>
                          {roomMode === 'LIVE' && liveStatus.status !== 'CONNECTED'
                            ? 'Quét TikTok & Bắt Đầu Live'
                            : 'Bắt đầu trận'}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-slate-400 flex items-center gap-2 animate-pulse">
                      <Clock className="w-4 h-4 text-indigo-400" />
                      <span>Đang đợi chủ phòng bắt đầu trận đấu...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW B: ACTIVE ROUND (IN_ROUND / PAUSED / ROUND_END) */}
        {activeMatch && question && (
          roomMode === 'LIVE' ? (
            <TikTokLiveView
              gameMode={gameMode}
              key={currentRound}
              currentRound={currentRound}
              totalRounds={totalRounds}
              question={question}
              duration={roundDuration}
              seconds={timerRemaining}
              resultSeconds={roomStatus === 'ROUND_END' ? resultSeconds : null}
              paused={roomStatus === 'PAUSED'}
              uptimeSec={roomUptime}
              latencyMs={networkLatency}
              themeColor={themeColor}
              isMobile={isMobileMode}
              onToggleMobile={toggleMobileMode}
              participants={commenterRanking}
              arenaPlayers={sortedBattlePlayers}
              comments={liveComments}
              votes={optionVotes}
              winners={liveTop3}
              correctOptionIndex={roundSummary?.correctOptionIndex}
              correctAnswer={roundSummary?.correctAnswer}
              acceptedAnswers={roundSummary?.acceptedAnswers}
              explanation={roundSummary?.explanation || (roundSummary as any)?.summary?.explanation || (question as any)?.explanation}
              onAudio={question.audioUrl || question.targetWord ? playCurrentQuestionAudio : undefined}
              onEnd={isHost ? handleHostEndGame : undefined}
              onLeaveRoom={leaveArena}
            />
          ) : (
            <ArenaBattleView
              gameMode={gameMode}
              key={currentRound}
              currentRound={currentRound}
              totalRounds={totalRounds}
              question={question}
              roundDurationSec={roundDuration}
              seconds={timerRemaining}
              resultSeconds={roomStatus === 'ROUND_END' ? resultSeconds : undefined}
              closed={roomStatus === 'ROUND_END'}
              paused={roomStatus === 'PAUSED'}
              uptimeSec={roomUptime}
              latencyMs={networkLatency}
              themeColor={themeColor}
              isMobile={isMobileMode}
              onToggleMobile={toggleMobileMode}
              onResume={isHost && roomStatus === 'PAUSED' ? handleHostPauseGame : undefined}
              disabled={isReadOnly || !isConnected || hasSubmitted || timerRemaining <= 0 || roomStatus !== 'IN_ROUND'}
              selectedOption={selectedOptionIndex}
              evaluation={evaluation}
              skipped={skipped}
              correctOptionIndex={roundSummary?.correctOptionIndex}
              correctAnswer={roundSummary?.correctAnswer}
              explanation={roundSummary?.explanation || (roundSummary as any)?.summary?.explanation || (question as any)?.explanation}
              players={sortedBattlePlayers}
              myPlayer={myBattlePlayer}
              onSelectOption={(index) => submitBattleAnswer(['A', 'B', 'C', 'D'][index], index)}
              onSubmitText={submitBattleAnswer}
              onSkipQuestion={() => submitBattleAnswer('', null, true)}
              onAudio={question.audioUrl || question.targetWord ? playCurrentQuestionAudio : undefined}
              onEnd={isHost ? handleHostEndGame : undefined}
              onLeaveRoom={leaveArena}
            />
          )
        )}

        {/* VIEW C: HALL OF FAME */}
        {roomStatus === 'FINISHED' && (
          <HallOfFame
            key={roomCode}
            result={finalResult}
            roomCode={roomCode}
            matchName={roomTitle}
            live={roomMode === 'LIVE'}
            currentUserId={myPlayer?.userId ?? user?.id}
            error={joinError}
            onLeave={leaveArena}
            onPlayAgain={() => setShowCreateRoom(true)}
            onNextMatch={nextRotationData?.nextRoomCode ? () => navigate(`/games/room/${nextRotationData.nextRoomCode}?mode=${gameMode}&lang=${roomLanguageId}`) : undefined}
          />
        )}
      </div>
      {showCreateRoom && (
        <CreateCustomRoomModal isOpen initialRoomType={roomMode === 'LIVE' ? 'TIKTOK_LIVE' : 'PVP'} onClose={() => setShowCreateRoom(false)}
          onRoomCreated={(room) => {
            setShowCreateRoom(false);
            navigate(`/games/room/${room.roomCode}?mode=${room.gameMode}&lang=${room.languageId}`);
          }} />
      )}

      {/* ======================================================== */}
      {/* 4. TIKTOK LIVE CONFIGURATION MODAL                       */}
      {/* ======================================================== */}
      {isLiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-7 space-y-5 text-white shadow-2xl max-h-[90vh] overflow-y-auto relative">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shadow-md">
                  <TikTokLogo className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white flex items-center gap-2">
                    <span>Kết Nối TikTok Livestream</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Live Hub
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Đồng bộ luồng phát trực tiếp để tự động nhận bình luận A, B, C, D từ người xem
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsLiveModalOpen(false);
                  setLiveValidationWarning(null);
                  setLiveConnectionMessage('');
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Provider Tabs: Live Stream Thật vs Giả Lập Test */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setLiveProviderChoice('TIKTOK_LIVE');
                  setLiveValidationWarning(null);
                  setLiveConnectionMessage('');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  liveProviderChoice === 'TIKTOK_LIVE'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TikTokLogo className="w-3.5 h-3.5" />
                <span>Kênh TikTok Thật</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLiveProviderChoice('MOCK');
                  setLiveValidationWarning(null);
                  setLiveConnectionMessage('');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  liveProviderChoice === 'MOCK'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Giả Lập Test (Mock)</span>
              </button>
            </div>

            {/* Current Connection Status Box */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    liveStatus.status === 'CONNECTED'
                      ? 'bg-emerald-400 animate-pulse'
                      : liveStatus.status === 'CONNECTING'
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-slate-600'
                  }`}
                />
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Trạng Thái Kết Nối
                  </div>
                  <div className="text-xs font-bold text-white truncate">
                    {liveStatus.status === 'CONNECTED'
                      ? `Đã kết nối: ${liveStatus.channelName || '@tiktok'}`
                      : liveStatus.status === 'CONNECTING'
                      ? 'Đang kiểm tra tín hiệu luồng live...'
                      : 'Chưa liên kết luồng livestream'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {liveStatus.status === 'CONNECTED' && (
                  <>
                    <button
                      type="button"
                      onClick={handleSendTestComment}
                      className="px-2.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Gửi thử bình luận trắc nghiệm A/B/C/D để kiểm tra luồng"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{testCommentSent ? 'Đã gửi ✓' : 'Thử comment'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnectLive}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition cursor-pointer"
                    >
                      Ngắt kết nối
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* TikTok Live Connection Form */}
            <form onSubmit={handleConnectLive} className="space-y-4">
              {liveProviderChoice === 'TIKTOK_LIVE' ? (
                <>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200">
                        TikTok Username hoặc Link Livestream:
                      </label>
                      <span className="text-[11px] text-slate-400 font-medium">Bắt buộc</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={targetChannelInput}
                        onChange={(e) => {
                          setTargetChannelInput(e.target.value);
                          if (liveValidationWarning) setLiveValidationWarning(null);
                        }}
                        onBlur={() => {
                          const val = targetChannelInput.trim();
                          if (val.includes('tiktok.com/')) {
                            const match = val.match(/@([a-zA-Z0-9_\.]+)/);
                            if (match && match[1]) {
                              setTargetChannelInput(`@${match[1]}`);
                            }
                          }
                        }}
                        placeholder="Ví dụ: @tienganhmoingay hoặc https://www.tiktok.com/@user/live"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-rose-500 font-medium transition"
                      />
                    </div>
                    {/* Real-time detected handle helper */}
                    {targetChannelInput.trim() && (
                      <div className="text-[11px] text-emerald-400 flex items-center gap-1 pt-0.5">
                        <Check className="w-3 h-3" />
                        <span>
                          Kênh nhận diện: <strong>{targetChannelInput.trim().startsWith('@') ? targetChannelInput.trim() : `@${targetChannelInput.trim().replace(/^.*@/, '')}`}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">
                        TikTok Room ID (Tùy chọn):
                      </label>
                      <span className="text-[10px] text-slate-500">Dành cho OBS / TikTok Studio</span>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={liveRoomIdInput}
                      onChange={(e) => setLiveRoomIdInput(e.target.value)}
                      placeholder="Ví dụ: 743892184910283921 (để trống nếu không rõ)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-rose-500 font-mono transition"
                    />
                  </div>
                </>
              ) : (
                <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2 text-xs">
                  <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Chế Độ Khán Giả Mô Phỏng (Mock Audience)</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Hệ thống sẽ tự động mô phỏng các khán giả ảo (Linh Tokyo, Hoàng 990 TOEIC, Đức Phản Xạ Nhanh...) gửi bình luận A, B, C, D theo thời gian thực để Host kiểm tra hiệu ứng và Bảng Vàng trước khi live thật.
                  </p>
                  <div className="pt-1">
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      Tên Kênh Demo:
                    </label>
                    <input
                      type="text"
                      value={targetChannelInput || 'demo_stream'}
                      onChange={(e) => setTargetChannelInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Feedback Banners */}
              {liveConnectionSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Kết nối thành công! Đang lưu cấu hình phòng đấu...</span>
                </div>
              )}

              {liveValidationWarning && (
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-medium flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{liveValidationWarning}</span>
                </div>
              )}

              {liveConnectionMessage && !liveConnectionSuccess && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{liveConnectionMessage}</span>
                </div>
              )}

              {/* Quick instructions box */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-[11px] text-slate-400">
                <div className="font-bold text-slate-300">💡 Hướng dẫn tổ chức Game Show TikTok:</div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-400 leading-relaxed">
                  <li>Bật livestream trên app TikTok hoặc TikTok Live Studio.</li>
                  <li>Điền username kênh vào form và bấm <strong>Kết nối TikTok Live</strong>.</li>
                  <li>Khán giả chỉ cần gõ <strong>A, B, C hoặc D</strong> trong phần bình luận TikTok để trả lời!</li>
                </ul>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLiveModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLive}
                  className="btn-glass-primary !px-5 !py-2.5 !rounded-xl !text-xs !font-black transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <TikTokLogo className="w-3.5 h-3.5" />
                  <span>
                    {isSubmittingLive
                      ? 'Đang kết nối luồng...'
                      : liveProviderChoice === 'MOCK'
                      ? 'Kích Hoạt Chế Độ Giả Lập'
                      : 'Kết Nối TikTok Live'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
};

export default RealtimeGameRoomPage;
