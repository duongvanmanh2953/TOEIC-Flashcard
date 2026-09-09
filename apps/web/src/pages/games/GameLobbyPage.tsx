import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import {
  Gamepad2,
  Clock,
  Zap,
  Users,
  Trophy,
  Flame,
  ArrowRight,
  Shield,
  Activity,
  Sparkles,
  Play,
  Calendar,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useTranslation } from '../../i18n';

interface ScheduleItem {
  gameMode: string;
  title: string;
  scheduleTime: string;
  durationMinutes: number;
  questionCount: number;
  difficulty: string;
  scoreMultiplier: number;
  status: 'OPEN' | 'UPCOMING' | 'CLOSED';
}

interface LobbyData {
  hoursStatus: {
    isOpen: boolean;
    serverTime: string;
    nextGameTime: string;
    countdownSeconds: number;
    testMode: boolean;
    timezone: string;
  };
  schedule: ScheduleItem[];
  activeRooms: Array<{
    roomCode: string;
    gameMode: string;
    title: string;
    status: string;
    playerCount: number;
    currentRound: number;
    totalRounds: number;
  }>;
}

export const GameLobbyPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [lobbyData, setLobbyData] = useState<LobbyData | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [latency, setLatency] = useState<number>(38);
  const [selectedGameMode, setSelectedGameMode] = useState<string>('TRANSLATION_RUSH');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchLobby();
    const interval = setInterval(fetchLobby, 10000); // 10s sync
    return () => clearInterval(interval);
  }, []);

  // Countdown timer tick
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const fetchLobby = async () => {
    const t0 = Date.now();
    try {
      const res: any = await api.get('/games/lobby');
      const measuredLatency = Date.now() - t0;
      setLatency(measuredLatency);

      const data = res?.data || res;
      setLobbyData(data);
      if (data?.hoursStatus?.countdownSeconds) {
        setCountdown(data.hoursStatus.countdownSeconds);
      }
    } catch (err) {
      console.error('Failed to fetch game lobby:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCountdown = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getLatencyBadge = (ms: number) => {
    if (ms < 80) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {t('games.latencyExcellent', 'Cực tốt')} ({ms}ms)
        </span>
      );
    }
    if (ms <= 150) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          {t('games.latencyGood', 'Tốt')} ({ms}ms)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        {t('games.latencyFair', 'Bình thường')} ({ms}ms)
      </span>
    );
  };

  const handleJoinGame = (gameMode: string, roomCode?: string) => {
    setJoining(true);
    const targetRoom = roomCode || `auto_${gameMode}`;
    navigate(`/games/room/${targetRoom}?mode=${gameMode}`);
  };

  const isOpen = lobbyData?.hoursStatus?.isOpen;

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* 1. Hero Title Banner with Competitive Spirit */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900/90 via-slate-900/95 to-purple-950/90 border border-indigo-500/30 text-white shadow-xl overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black uppercase tracking-wider border border-indigo-400/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Đấu Trường Tiếng Anh Trực Tiếp • 20:00 – 22:00 Mỗi Ngày</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            {t('games.heroTitle', 'Đấu Trường Tiếng Anh Trực Tiếp')}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
            {t(
              'games.heroSubtitle',
              'Trực tiếp so tài phản xạ từ vựng, dịch thuật và ngữ pháp thời gian thực với hàng ngàn học viên.',
            )}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* Live latency indicator */}
            {getLatencyBadge(latency)}

            {/* Test mode badge */}
            {lobbyData?.hoursStatus?.testMode && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                ⚡ TEST MODE ACTIVE (24/7 ACCESS)
              </span>
            )}
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none" />
      </div>

      {/* 2. Daily Operating Window & Countdown Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                isOpen ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
              }`}
            />
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Trạng thái đấu trường
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {isOpen ? 'ĐẤU TRƯỜNG ĐANG MỞ CỬA!' : 'ĐẤU TRƯỜNG ĐANG TẠM ĐÓNG'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Giờ thi đấu chuẩn: 20:00 — 22:00 (GMT+7) • Giờ máy chủ:{' '}
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {lobbyData?.hoursStatus?.serverTime || '--:--:--'}
            </span>
          </p>
        </div>

        {/* Big Countdown Timer */}
        <div className="text-center p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 min-w-[220px]">
          <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
            {isOpen ? 'Thời gian còn lại của hôm nay' : 'Trận đấu mở tiếp theo sau'}
          </span>
          <span className="text-3xl sm:text-4xl font-black font-mono tracking-wider text-indigo-600 dark:text-indigo-400">
            {formatCountdown(countdown)}
          </span>
        </div>
      </div>

      {/* 3. Tonights Games Schedule Matrix */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            <span>{t('games.tonightsGames', "TONIGHT'S GAMES")}</span>
          </h2>
          <span className="text-xs font-bold text-slate-500">Khung giờ luân phiên</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lobbyData?.schedule?.map((item) => (
            <div
              key={item.gameMode}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {item.scheduleTime} ({item.durationMinutes}m)
                  </span>
                  <span className="text-xs font-black text-amber-500 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    {item.scoreMultiplier}x Multiplier
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-2">
                  {item.gameMode === 'TRANSLATION_RUSH'
                    ? t('games.translationRush.desc', 'Dịch nhanh song ngữ Anh - Việt với AI.')
                    : item.gameMode === 'WORD_BLITZ'
                    ? t('games.wordBlitz.desc', 'Phản xạ tìm từ đồng nghĩa, trái nghĩa cấp tốc.')
                    : item.gameMode === 'SENTENCE_SPRINT'
                    ? t('games.sentenceSprint.desc', 'Sáng tạo câu hoàn chỉnh chuẩn ngữ cảnh.')
                    : item.gameMode === 'MISSING_WORD'
                    ? t('games.missingWord.desc', 'Điền từ khuyết chính xác vào câu.')
                    : item.gameMode === 'LISTENING_RUSH'
                    ? t('games.listeningRush.desc', 'Nghe audio chuẩn và gõ lại câu chính xác.')
                    : t('games.synonymBattle.desc', 'Đấu trí tìm từ đồng nghĩa.')}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium pt-1">
                  <span>{item.questionCount} câu hỏi/trận</span>
                  <span>•</span>
                  <span className="uppercase font-bold">{item.difficulty}</span>
                </div>
              </div>

              <button
                onClick={() => handleJoinGame(item.gameMode)}
                disabled={!isOpen && !lobbyData?.hoursStatus?.testMode}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                  isOpen || lobbyData?.hoursStatus?.testMode
                    ? 'btn-glass-primary shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>
                  {isOpen || lobbyData?.hoursStatus?.testMode
                    ? t('games.joinGame', 'VÀO PHÒNG THI ĐẤU')
                    : 'Chưa Tới Giờ Đấu'}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Active Live Rooms Browser */}
      {lobbyData?.activeRooms && lobbyData.activeRooms.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            <span>Phòng Thi Đấu Đang Mở ({lobbyData.activeRooms.length})</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {lobbyData.activeRooms.map((room) => (
              <div
                key={room.roomCode}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-indigo-600 dark:text-indigo-400">
                      #{room.roomCode}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {room.status}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                    {room.title}
                  </p>
                  <span className="text-[11px] text-slate-400">
                    {room.playerCount} người chơi • Vòng {room.currentRound}/{room.totalRounds}
                  </span>
                </div>

                <button
                  onClick={() => handleJoinGame(room.gameMode, room.roomCode)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow"
                >
                  Tham Gia
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameLobbyPage;
