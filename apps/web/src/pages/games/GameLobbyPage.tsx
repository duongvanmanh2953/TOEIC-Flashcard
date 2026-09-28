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
  CheckCircle,
  X,
  Heart,
  Award,
  History,
  Lightbulb,
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
  const { user, isGuest, promptLogin } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [lobbyData, setLobbyData] = useState<LobbyData | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [latency, setLatency] = useState<number>(38);
  const [selectedGameMode, setSelectedGameMode] = useState<string>('TRANSLATION_RUSH');
  const [joining, setJoining] = useState(false);
  const [showHeroBanner, setShowHeroBanner] = useState(() => {
    return localStorage.getItem('vocabflow_hide_games_hero') !== 'true';
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('vocabflow_fav_games') || '["FOUR_SKILLS_ARENA"]');
    } catch {
      return ['FOUR_SKILLS_ARENA'];
    }
  });

  const toggleFavorite = (mode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode];
      localStorage.setItem('vocabflow_fav_games', JSON.stringify(next));
      return next;
    });
  };

  const dismissHeroBanner = () => {
    setShowHeroBanner(false);
    localStorage.setItem('vocabflow_hide_games_hero', 'true');
  };

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
    if (isGuest || !user) {
      promptLogin('Đăng nhập để tham gia đấu trường đối kháng và ghi danh trên Bảng Xếp Hạng Fair-Play');
      return;
    }
    setJoining(true);
    const targetRoom = roomCode || `auto_${gameMode}`;
    navigate(`/games/room/${targetRoom}?mode=${gameMode}`);
  };

  const isOpen = lobbyData?.hoursStatus?.isOpen;

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* 1. Hero Title Banner with Competitive Spirit & Dismiss X */}
      {showHeroBanner ? (
        <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900/90 via-slate-900/95 to-purple-950/90 border border-indigo-500/30 text-white overflow-hidden animate-fade-in pr-12">
          <button
            onClick={dismissHeroBanner}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-indigo-300 hover:text-white hover:bg-white/10 transition z-20"
            title="Ẩn banner giới thiệu"
          >
            <X className="w-4 h-4" />
          </button>
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
      ) : (
        <div className="flex justify-end">
          <button
            onClick={() => {
              setShowHeroBanner(true);
              localStorage.removeItem('vocabflow_hide_games_hero');
            }}
            className="text-[11px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 font-medium transition py-0.5 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Hiện lại banner giới thiệu"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Hiện giới thiệu Đấu Trường</span>
          </button>
        </div>
      )}

      {/* 2. Daily Operating Window & Countdown Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
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
            <span className="tabular-nums font-bold text-indigo-600 dark:text-indigo-400">
              {lobbyData?.hoursStatus?.serverTime || '--:--:--'}
            </span>
          </p>
        </div>

        {/* Big Countdown Timer */}
        <div className="text-center p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 min-w-[220px]">
          <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
            {isOpen ? 'Thời gian còn lại của hôm nay' : 'Trận đấu mở tiếp theo sau'}
          </span>
          <span className="text-3xl sm:text-4xl font-black tabular-nums tracking-wider text-indigo-600 dark:text-indigo-400">
            {formatCountdown(countdown)}
          </span>
        </div>
      </div>

      {/* USER PERSONAL GAMING DASHBOARD & RECOMMENDATION */}
      {user && !isGuest && (
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Award className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Thành Tích & Đấu Trường Của Bạn</h3>
                <span className="text-[11px] text-slate-400">Học viên: {user.displayName || user.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
                Cấp Độ: Đại Kiện Tướng B2
              </span>
              <button
                onClick={() => handleJoinGame(favorites[0] || 'FOUR_SKILLS_ARENA')}
                className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/25 transition flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Chơi Lại Nhanh (Re-play)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Số trận đã đấu</span>
              <span className="text-lg font-bold text-white tabular-nums">28 trận</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Tỷ lệ thắng (Win Rate)</span>
              <span className="text-lg font-bold text-emerald-400 tabular-nums">71.4%</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Điểm Xếp Hạng ELO</span>
              <span className="text-lg font-bold text-indigo-300 tabular-nums">1,485 ELO</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Chuỗi thắng liên tiếp</span>
              <span className="text-lg font-bold text-amber-400 tabular-nums">🔥 4 Trận</span>
            </div>
          </div>

          {/* Smart recommendation */}
          <div className="p-3 rounded-xl bg-indigo-950/25 border border-indigo-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-slate-300">
                <strong className="text-indigo-300">Gợi ý thông minh:</strong> Đấu trường{' '}
                <span className="font-semibold text-white">Đại Chiến 4 Kỹ Năng</span> đang mở và có các đối thủ cùng tầm điểm ELO với bạn.
              </span>
            </div>
            <button
              onClick={() => handleJoinGame('FOUR_SKILLS_ARENA')}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-200 underline shrink-0 ml-2"
            >
              Vào ngay &rarr;
            </button>
          </div>
        </div>
      )}

      {/* 2.5. 24/7 MINI GAMES & SOLO PRACTICE SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-purple-500" />
              <span>MINI GAMES LUYỆN PHẢN XẠ 24/7 (CHƠI NGAY)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Rèn luyện phản xạ từ vựng TOEIC cấp tốc bất cứ lúc nào không cần chờ phiên đấu
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            🟢 MỞ CỬA 24/7
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Word Match Challenge */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-purple-950/70 border border-indigo-500/30 hover:border-indigo-400 transition-all duration-300 space-y-4 shadow-lg group">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 group-hover:scale-110 transition">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Lật Thẻ Trí Nhớ
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-white group-hover:text-indigo-300 transition">
                Word Match Challenge
              </h3>
              <p className="text-xs text-slate-300 line-clamp-2">
                Lật thẻ tìm đúng cặp từ vựng tiếng Anh và nghĩa tiếng Việt tương ứng. Tính điểm combo thần tốc và phát âm bản ngữ.
              </p>
            </div>

            <button
              onClick={() => navigate('/games/word-match')}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-600/30 transition flex items-center justify-center gap-2"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Chơi Ngay (Solo / Practice)</span>
            </button>
          </div>

          {/* Card 2: Word Scramble Rush */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-950/80 via-slate-900 to-emerald-950/70 border border-emerald-500/30 hover:border-emerald-400 transition-all duration-300 space-y-4 shadow-lg group">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 group-hover:scale-110 transition">
                <Zap className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Sắp Xếp Ký Tự
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-white group-hover:text-emerald-300 transition">
                Word Scramble Rush
              </h3>
              <p className="text-xs text-slate-300 line-clamp-2">
                Giải mã các từ vựng TOEIC bị đảo lộn ký tự trong 25 giây. Rèn luyện chính tả, phiên âm và phản xạ nhớ từ sâu.
              </p>
            </div>

            <button
              onClick={() => navigate('/games/scramble')}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-2"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Chơi Ngay (Speed Run)</span>
            </button>
          </div>
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
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 transition space-y-4 flex flex-col justify-between relative"
            >
              {/* Favorite Heart Button */}
              <button
                onClick={(e) => toggleFavorite(item.gameMode, e)}
                className={`absolute top-4 right-4 p-1.5 rounded-lg border transition ${
                  favorites.includes(item.gameMode)
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-white'
                }`}
                title={favorites.includes(item.gameMode) ? 'Bỏ yêu thích' : 'Lưu vào game yêu thích'}
              >
                <Heart className={`w-3.5 h-3.5 ${favorites.includes(item.gameMode) ? 'fill-current' : ''}`} />
              </button>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs tabular-nums font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
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
                    ? 'btn-glass-primary'
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
                    <span className="tabular-nums font-black text-sm text-indigo-600 dark:text-indigo-400">
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
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
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
