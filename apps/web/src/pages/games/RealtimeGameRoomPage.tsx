import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';
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
  Send,
  Copy,
  Check,
  UserMinus,
  MessageSquare,
  Share2,
} from 'lucide-react';
import { useTranslation } from '../../i18n';

interface RoomPlayer {
  userId: string;
  displayName: string;
  avatar: string;
  score: number;
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

export const RealtimeGameRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const gameMode = searchParams.get('mode') || 'TRANSLATION_RUSH';
  const navigate = useNavigate();
  const { user, isGuest, promptLogin } = useAuth();
  const { t } = useTranslation();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomCode, setRoomCode] = useState<string>(roomId || '');
  const [roomTitle, setRoomTitle] = useState<string>('Realtime English Battle');
  const [roomStatus, setRoomStatus] = useState<string>('WAITING');
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [totalRounds, setTotalRounds] = useState<number>(15);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Round State
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [roundDuration, setRoundDuration] = useState<number>(15);
  const [timerRemaining, setTimerRemaining] = useState<number>(15);
  const [answerInput, setAnswerInput] = useState<string>('');
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [roundSummary, setRoundSummary] = useState<{
    correctAnswer?: string;
    explanation?: string;
  } | null>(null);

  // Players & Live Ranking
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [myPlayer, setMyPlayer] = useState<RoomPlayer | null>(null);

  // Final Results
  const [finalResult, setFinalResult] = useState<{
    ranking: RoomPlayer[];
    top3: { first: RoomPlayer | null; second: RoomPlayer | null; third: RoomPlayer | null };
  } | null>(null);

  // Latency & Connection
  const [latency, setLatency] = useState<number>(35);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Waiting Room state
  const [isCopiedCode, setIsCopiedCode] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{
      id: string;
      userId: string;
      displayName: string;
      avatar?: string;
      message: string;
      timestamp: number;
    }>
  >([]);
  const [chatInput, setChatInput] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [isHost, setIsHost] = useState(false);

  // Setup Socket.IO connection
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '')?.replace('/api', '') || 'http://localhost:4000';
    const s = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    s.on('connect', () => {
      setIsConnected(true);
      const isCustomRoom = roomId && !roomId.startsWith('auto_');
      if (isCustomRoom) {
        s.emit('room:join_custom', {
          roomCode: roomId,
          userId: user?.id || `anon_${Math.random().toString(36).slice(2, 7)}`,
          displayName: user?.displayName || 'Learner',
          avatar: user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id || 'guest'}`,
        });
      } else {
        s.emit('join_game', {
          gameMode,
          userId: user?.id || `anon_${Math.random().toString(36).slice(2, 7)}`,
          displayName: user?.displayName || 'Learner',
          avatar: user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id || 'guest'}`,
        });
      }
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('room:joined_success', (data: any) => {
      setRoomCode(data.roomCode);
      setRoomTitle(data.title);
      setRoomStatus(data.status);
      setTotalRounds(data.totalRounds);
      setMyPlayer(data.player);
      if (data.players) setPlayers(data.players);
      if (data.player?.isHost) setIsHost(true);
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

    s.on('room:chat_message', (msg: any) => {
      setChatMessages((prev) => [...prev.slice(-49), msg]);
    });

    s.on('joined_game_room', (data: any) => {
      setRoomCode(data.roomCode);
      setRoomTitle(data.title);
      setRoomStatus(data.status);
      setTotalRounds(data.totalRounds);
      setMyPlayer(data.player);
      setPlayers(data.ranking || []);
    });

    s.on('player_joined', (data: any) => {
      setPlayers(data.ranking || []);
    });

    s.on('game_countdown', (data: { countdown: number }) => {
      setRoomStatus('STARTING');
      setCountdown(data.countdown);
    });

    s.on('round_started', (data: any) => {
      setRoomStatus('IN_ROUND');
      setCountdown(null);
      setCurrentRound(data.round);
      setTotalRounds(data.totalRounds);
      setQuestion(data.question);
      setRoundDuration(data.durationSec);
      setTimerRemaining(data.durationSec);
      setAnswerInput('');
      setHasSubmitted(false);
      setEvaluation(null);
      setRoundSummary(null);

      // Autofocus input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    });

    s.on('answer_result', (data: any) => {
      setEvaluation(data.evaluation);
      setHasSubmitted(true);
      if (myPlayer) {
        setMyPlayer((prev) =>
          prev
            ? {
                ...prev,
                score: data.currentScore,
                streak: data.currentStreak,
                rank: data.rank,
              }
            : null,
        );
      }
    });

    s.on('live_ranking_update', (data: any) => {
      setPlayers(data.ranking || []);
      // Update my player reference
      if (user?.id) {
        const me = (data.ranking as RoomPlayer[]).find((p) => p.userId === user.id);
        if (me) setMyPlayer(me);
      }
    });

    s.on('round_ended', (data: any) => {
      setRoomStatus('ROUND_SUMMARY');
      setRoundSummary({
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
      });
      setPlayers(data.ranking || []);
    });

    s.on('game_finished', (data: any) => {
      setRoomStatus('FINISHED');
      setFinalResult({
        ranking: data.ranking || [],
        top3: data.top3,
      });
    });

    setSocket(s);

    // Latency Ping interval
    const pingInterval = setInterval(() => {
      if (s.connected) {
        const start = Date.now();
        s.emit(
          'ping_latency',
          { clientTime: start, roomCode, userId: user?.id },
          (res: any) => {
            if (res?.latencyMs) setLatency(res.latencyMs);
          },
        );
      }
    }, 5000);

    return () => {
      clearInterval(pingInterval);
      s.disconnect();
    };
  }, [roomId, gameMode, user?.id]);

  // Round timer countdown
  useEffect(() => {
    if (roomStatus !== 'IN_ROUND' || timerRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimerRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [roomStatus, timerRemaining]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!socket || hasSubmitted || !answerInput.trim() || roomStatus !== 'IN_ROUND') return;

    socket.emit('submit_answer', {
      roomCode,
      userId: user?.id || myPlayer?.userId,
      answer: answerInput.trim(),
    });
    setHasSubmitted(true);
  };

  const handleToggleReady = () => {
    if (!socket || !roomCode || !user?.id) return;
    const next = !isReady;
    setIsReady(next);
    socket.emit('room:toggle_ready', {
      roomCode,
      userId: user.id,
      isReady: next,
    });
  };

  const handleHostStartGame = () => {
    if (!socket || !roomCode) return;
    socket.emit('room:host_start_game', { roomCode });
  };

  const handleKickPlayer = (targetUserId: string) => {
    if (!socket || !roomCode) return;
    socket.emit('room:kick_user', { roomCode, targetUserId });
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !chatInput.trim() || !user) return;
    socket.emit('room:send_chat', {
      roomCode,
      userId: user.id,
      displayName: user.displayName || user.email || 'Learner',
      avatar: user.avatar,
      message: chatInput.trim(),
    });
    setChatInput('');
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setIsCopiedCode(true);
    setTimeout(() => setIsCopiedCode(false), 2000);
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopiedLink(true);
    setTimeout(() => setIsCopiedLink(false), 2000);
  };

  const handleStartNow = () => {
    if (socket) {
      if (isHost) {
        socket.emit('room:host_start_game', { roomCode });
      } else {
        socket.emit('start_game_now', { roomCode });
      }
    }
  };

  const myRank = players.findIndex((p) => p.userId === (user?.id || myPlayer?.userId)) + 1;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-fade-in">
      {/* Guest Notice Banner */}
      {isGuest && (
        <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate">Bạn đang thi đấu dưới tư cách Khách Học Thử. Điểm số sẽ không được ghi nhận vào Bảng Xếp Hạng Fair-Play!</span>
          </div>
          <button
            onClick={() => promptLogin('Đăng nhập để ghi nhận điểm thi đấu vào BXH')}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 transition"
          >
            Đăng nhập ngay
          </button>
        </div>
      )}

      {/* 1. Game Header & Latency Telemetry */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900/90 border-2 border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-600/30">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
                {roomTitle}
              </h1>
              <span className="tabular-nums text-xs font-bold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                #{roomCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Vòng {currentRound} / {totalRounds} • {players.length} người chơi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Latency Meter */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs tabular-nums font-bold text-slate-700 dark:text-slate-300 border border-transparent dark:border-slate-700">
            <span
              className={`w-2 h-2 rounded-full ${
                latency < 80
                  ? 'bg-emerald-500'
                  : latency < 150
                  ? 'bg-sky-500'
                  : 'bg-amber-500'
              } ${isConnected ? 'animate-pulse' : 'bg-rose-500'}`}
            />
            <span>{isConnected ? `${latency}ms` : 'Mất kết nối'}</span>
          </div>

          {/* Leave Button */}
          <button
            onClick={() => navigate('/games')}
            className="text-xs font-bold px-3 py-1.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Thoát
          </button>
        </div>
      </div>

      {/* 2. Room State Views */}

      {/* VIEW A: WAITING / COUNTDOWN */}
      {(roomStatus === 'WAITING' || roomStatus === 'STARTING') && (
        <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-6 shadow-sm">
          {countdown !== null && countdown > 0 ? (
            <div className="space-y-4 py-8">
              <span className="text-xs font-black tracking-widest text-indigo-500 uppercase">
                {t('games.statusStarting', 'Chuẩn bị bắt đầu...')}
              </span>
              <div className="text-7xl sm:text-9xl font-black tabular-nums text-indigo-600 dark:text-indigo-400 animate-pulse">
                {countdown}
              </div>
              <p className="text-sm text-slate-500 font-medium">
                Hãy sẵn sàng! Vòng thi đấu đầu tiên chuẩn bị bắt đầu.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Room Code & Invite Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-purple-950/70 border border-indigo-500/30 text-white space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-left space-y-1">
                    <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">
                      MÃ PHÒNG THI ĐẤU
                    </span>
                    <div className="text-3xl sm:text-4xl font-mono font-black text-white tracking-widest flex items-center gap-3">
                      <span>#{roomCode}</span>
                      <button
                        onClick={copyRoomCode}
                        className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition text-xs flex items-center gap-1 cursor-pointer"
                        title="Sao chép mã phòng"
                      >
                        {isCopiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span className="text-[11px] font-sans">{isCopiedCode ? 'Đã chép' : 'Chép mã'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyRoomLink}
                      className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer border border-white/10"
                    >
                      {isCopiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                      <span>{isCopiedLink ? 'Đã chép link' : 'Chia sẻ link phòng'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10 text-xs text-slate-300">
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-[11px]">
                    {roomTitle}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-bold text-[11px]">
                    {totalRounds} câu hỏi
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-bold text-[11px]">
                    {roundDuration}s mỗi vòng
                  </span>
                </div>
              </div>

              {/* Waiting Players Grid */}
              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500" />
                    <span>Người chơi trong phòng ({players.length})</span>
                  </h3>
                  <span className="text-xs text-slate-500">
                    {players.filter((p) => p.isReady || p.isHost).length}/{players.length} đã sẵn sàng
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {players.map((p) => {
                    const isMe = p.userId === (user?.id || myPlayer?.userId);
                    return (
                      <div
                        key={p.userId}
                        className={`p-3 rounded-2xl border transition flex items-center justify-between ${
                          isMe
                            ? 'bg-indigo-500/10 border-indigo-500/40 text-slate-900 dark:text-white'
                            : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative">
                            <img
                              src={p.avatar}
                              alt={p.displayName}
                              className="w-9 h-9 rounded-full object-cover border-2 border-indigo-500/30"
                            />
                            {p.isHost && (
                              <Crown className="w-4 h-4 text-amber-400 absolute -top-1.5 -right-1.5 fill-current filter drop-shadow" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-black truncate flex items-center gap-1">
                              <span>{p.displayName}</span>
                              {isMe && <span className="text-[10px] text-indigo-400 font-bold">(Bạn)</span>}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {p.isHost ? 'Chủ phòng' : p.isReady ? '🟢 Sẵn sàng' : '🟡 Đang đợi...'}
                            </div>
                          </div>
                        </div>

                        {/* Host controls kick */}
                        {isHost && !p.isHost && (
                          <button
                            onClick={() => handleKickPlayer(p.userId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                            title="Mời ra khỏi phòng"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ready / Start Buttons */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500 text-left">
                  {isHost ? (
                    <span className="font-semibold">
                      👑 <strong>Bạn là chủ phòng.</strong> Nhấn bắt đầu khi mọi người đã sẵn sàng!
                    </span>
                  ) : (
                    <span className="font-semibold">
                      Nhấn <strong>Sẵn Sàng</strong> để thông báo cho chủ phòng bắt đầu trận đấu!
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {!isHost && (
                    <button
                      onClick={handleToggleReady}
                      className={`px-6 py-2.5 rounded-2xl font-black text-xs transition flex items-center gap-2 cursor-pointer ${
                        isReady
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500'
                          : 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 hover:bg-amber-400'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>{isReady ? 'ĐÃ SẴN SÀNG (READY)' : 'SẴN SÀNG'}</span>
                    </button>
                  )}

                  {isHost && (
                    <button
                      onClick={handleHostStartGame}
                      className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
                    >
                      <Zap className="w-4 h-4" />
                      <span>BẮT ĐẦU TRẬN ĐẤU (START)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Waiting Room Live Chat Drawer */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/70 p-4 text-left space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Trò Chuyện Phòng Đấu</span>
                  </span>
                  <span className="text-[10px] text-slate-500">{chatMessages.length} tin nhắn</span>
                </div>

                <div className="h-28 overflow-y-auto space-y-1.5 pr-1 text-xs">
                  {chatMessages.length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic text-center py-6">
                      Chưa có tin nhắn nào. Hãy gửi lời chào đến các đối thủ!
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div key={msg.id} className="flex items-baseline gap-2">
                        <span className="font-bold text-indigo-500 shrink-0">{msg.displayName}:</span>
                        <span className="text-slate-700 dark:text-slate-300 break-words">{msg.message}</span>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendChat} className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-700/50">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Gửi tin nhắn trong phòng..."
                    maxLength={100}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-40 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW B: IN_ROUND / QUESTION */}
      {roomStatus === 'IN_ROUND' && question && (
        <div className="space-y-5">
          {/* Question Card */}
          <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-500/30 shadow-lg text-center space-y-6 relative overflow-hidden">
            {/* Top metadata row */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {question.direction === 'EN_VI'
                  ? 'English → Vietnamese'
                  : question.direction === 'VI_EN'
                  ? 'Tiếng Việt → English'
                  : question.direction === 'SENTENCE'
                  ? 'Sentence Translation'
                  : question.direction === 'SYNONYM'
                  ? 'Type a Synonym'
                  : question.direction === 'FIX'
                  ? 'Fix The Sentence'
                  : 'Question'}
              </span>

              {/* Round Timer Ring */}
              <div
                className={`flex items-center gap-1.5 tabular-nums font-black text-sm px-3 py-1 rounded-full ${
                  timerRemaining <= 5
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{timerRemaining}s</span>
              </div>
            </div>

            {/* Giant 32px Question Prompt */}
            <div className="py-4 space-y-2">
              <span className="text-xs uppercase tracking-widest text-slate-500 font-bold block">
                Từ vựng / Câu hỏi
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                "{question.prompt}"
              </h2>
            </div>

            {/* Live Answer Feedback Popup */}
            {evaluation && (
              <div
                className={`p-4 rounded-2xl flex items-center justify-center gap-3 text-sm font-bold animate-bounce ${
                  evaluation.isCorrect
                    ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-400'
                }`}
              >
                {evaluation.isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )}
                <span>{evaluation.feedbackText}</span>
                {evaluation.score > 0 && (
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500 text-white tabular-nums font-black text-xs">
                    +{evaluation.score} XP
                  </span>
                )}
              </div>
            )}

            {/* Responsive Answer Input Bar */}
            <form onSubmit={handleSubmit} className="relative max-w-xl mx-auto pt-2">
              <input
                ref={inputRef}
                type="text"
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                disabled={hasSubmitted}
                placeholder={
                  hasSubmitted
                    ? 'Đã gửi câu trả lời! Đang đợi vòng tiếp theo...'
                    : t('games.answerPlaceholder', 'Nhập câu trả lời của bạn và nhấn Enter...')
                }
                className={`w-full py-4 pl-5 pr-14 rounded-2xl text-base sm:text-lg font-semibold bg-slate-50 dark:bg-slate-800 border-2 transition outline-none ${
                  hasSubmitted
                    ? 'border-slate-300 dark:border-slate-700 opacity-75'
                    : 'border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-slate-900 dark:text-white'
                }`}
              />
              <button
                type="submit"
                disabled={hasSubmitted || !answerInput.trim()}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition ${
                  hasSubmitted || !answerInput.trim()
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW C: ROUND_SUMMARY */}
      {roomStatus === 'ROUND_SUMMARY' && roundSummary && (
        <div className="p-8 rounded-3xl bg-indigo-500/10 border-2 border-indigo-500/30 text-center space-y-4 animate-fade-in">
          <span className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
            Đáp Án Chuẩn Vòng {currentRound}
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {roundSummary.correctAnswer}
          </h3>
          {roundSummary.explanation && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium max-w-lg mx-auto">
              {roundSummary.explanation}
            </p>
          )}
          <span className="text-xs text-slate-500 font-bold block pt-2">
            Vòng tiếp theo sẽ bắt đầu sau 3 giây...
          </span>
        </div>
      )}

      {/* VIEW D: FINISHED / GAME OVER MODAL & PODIUM */}
      {roomStatus === 'FINISHED' && finalResult && (
        <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-8 animate-fade-in">
          <div className="space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto shadow-md">
              <Trophy className="w-9 h-9" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              {t('games.gameOverTitle', 'KẾT THÚC TRẬN ĐẤU')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {t('games.gameOverSubtitle', 'Bạn đã hoàn thành xuất sắc trận đấu hôm nay!')}
            </p>
          </div>

          {/* User Achievement Highlight */}
          {myRank <= 10 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-indigo-500/20 border border-amber-500/40 text-amber-800 dark:text-amber-200 font-black text-sm">
              {t('games.youMadeLeaderboard', '🎉 CHÚC MỪNG! BẠN ĐÃ LỌT BẢNG VÀNG HÔM NAY!')}
            </div>
          )}

          {/* Match Statistics Card */}
          {myPlayer && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto text-center">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 font-bold uppercase block">Hạng Chung Cuộc</span>
                <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
                  #{myPlayer.rank}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 font-bold uppercase block">Điểm XP Nhận</span>
                <span className="text-2xl sm:text-3xl font-black text-amber-500">
                  {myPlayer.score.toLocaleString()}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 font-bold uppercase block">Số Câu Đúng</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-500">
                  {myPlayer.correctCount} / {totalRounds}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 font-bold uppercase block">Chuỗi Dài Nhất</span>
                <span className="text-2xl sm:text-3xl font-black text-rose-500 flex items-center justify-center gap-1">
                  <Flame className="w-5 h-5 fill-rose-500" />
                  {myPlayer.bestStreak}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/games')}
              className="btn-glass-secondary px-6 py-3 rounded-2xl font-bold text-sm shadow-sm"
            >
              {t('games.returnLobby', 'Trở về Sảnh Đấu')}
            </button>
            <Link
              to="/leaderboard"
              className="btn-glass-primary px-6 py-3 rounded-2xl font-bold text-sm shadow-md"
            >
              {t('games.viewLeaderboard', 'Xem Bảng Xếp Hạng Toàn Hệ Thống')}
            </Link>
          </div>
        </div>
      )}

      {/* 3. In-Game Live Leaderboard Sidebar (Always visible) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>{t('games.liveRanking', 'BẢNG XẾP HẠNG TRỰC TIẾP')}</span>
          </h3>
          <span className="text-xs text-slate-400 tabular-nums">Top {players.length} người chơi</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {players.slice(0, 8).map((p) => (
            <div
              key={p.userId}
              className={`p-3 rounded-xl flex items-center justify-between transition ${
                p.userId === (user?.id || myPlayer?.userId)
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-400'
                  : 'bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-6 text-center font-black text-xs ${
                    p.rank === 1
                      ? 'text-amber-500'
                      : p.rank === 2
                      ? 'text-slate-400'
                      : p.rank === 3
                      ? 'text-amber-700'
                      : 'text-slate-500'
                  }`}
                >
                  #{p.rank}
                </span>
                <img src={p.avatar} alt={p.displayName} className="w-7 h-7 rounded-lg object-cover bg-slate-800" />
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate max-w-[110px]">
                  {p.displayName}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {p.streak >= 3 && (
                  <span className="flex items-center text-[11px] font-bold text-rose-500">
                    <Flame className="w-3.5 h-3.5 fill-rose-500" />
                    {p.streak}
                  </span>
                )}
                <span className="tabular-nums font-black text-xs text-slate-900 dark:text-white">
                  {p.score.toLocaleString()} XP
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RealtimeGameRoomPage;
