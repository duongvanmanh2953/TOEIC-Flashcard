import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLearning } from '../../contexts/LearningContext';
import api from '../../lib/api';
import {
  Gamepad2,
  Clock,
  Zap,
  Users,
  Trophy,
  ArrowRight,
  Shield,
  Activity,
  Sparkles,
  Play,
  Calendar,
  CheckCircle,
  X,
  Heart,
  History,
  PlusCircle,
  Lock,
  Search,
  Hash,
  KeyRound,
  RotateCw,
  Video,
  LayoutGrid,
  List,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import { VocabFlowLogo, TikTokLogo, TikTokColorLogo } from '@vocabflow/shared';
import { CreateCustomRoomModal } from '../../components/games/CreateCustomRoomModal';
import { EditCustomRoomModal } from '../../components/games/EditCustomRoomModal';
import { EnterRoomPasswordModal } from '../../components/games/EnterRoomPasswordModal';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { CountryFlag } from '../../components/language/CountryFlag';

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
  const { activeLanguage } = useLearning();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [lobbyData, setLobbyData] = useState<LobbyData | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [latency, setLatency] = useState<number>(38);
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

  const [customRooms, setCustomRooms] = useState<any[]>([]);
  const [customRoomsLoading, setCustomRoomsLoading] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createModalInitialType, setCreateModalInitialType] = useState<'PVP' | 'TIKTOK_LIVE'>('PVP');
  const [passwordModalData, setPasswordModalData] = useState<{
    isOpen: boolean;
    roomCode: string;
    roomTitle: string;
    gameMode: string;
  } | null>(null);
  const [quickJoinCode, setQuickJoinCode] = useState<string>('');
  const [customRoomFilter, setCustomRoomFilter] = useState<string>('ALL');
  const [customRoomSearch, setCustomRoomSearch] = useState<string>('');
  const [roomCategoryTab, setRoomCategoryTab] = useState<'ALL' | 'BATTLE' | 'LIVE' | 'MY_ROOMS'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    try {
      return (localStorage.getItem('vocabflow_room_view_mode') as 'grid' | 'list') || 'grid';
    } catch {
      return 'grid';
    }
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;
  const [editingRoom, setEditingRoom] = useState<any | null>(null);
  const [isDeletingRoom, setIsDeletingRoom] = useState<string | null>(null);

  const handleToggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    try {
      localStorage.setItem('vocabflow_room_view_mode', mode);
    } catch (_) {}
  };

  const handleDeleteRoom = async (room: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Bạn có chắc chắn muốn xóa phòng "${room.title}" (#${room.roomCode}) không?`)) {
      return;
    }
    try {
      setIsDeletingRoom(room.roomCode);
      await api.delete(`/games/rooms/${room.roomCode}`);
      await fetchCustomRooms();
    } catch (err: any) {
      console.error('Failed to delete room:', err);
      alert(err?.response?.data?.message || 'Không thể xóa phòng. Vui lòng thử lại.');
    } finally {
      setIsDeletingRoom(null);
    }
  };

  const handleEditRoom = (room: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRoom(room);
  };

  const languageId = activeLanguage.id;
  const roomsRequest = useRef<AbortController | null>(null);
  const fetchCustomRooms = useCallback(async () => {
    roomsRequest.current?.abort();
    const controller = new AbortController();
    roomsRequest.current = controller;

    try {
      setCustomRoomsLoading(true);
      const res: any = await api.get('/games/rooms', {
        params: { languageId },
        signal: controller.signal,
      });
      const list = res?.data?.data || res?.data || res;
      if (!controller.signal.aborted && Array.isArray(list)) setCustomRooms(list);
    } catch (err) {
      if (!controller.signal.aborted) console.error('Failed to fetch custom rooms:', err);
    } finally {
      if (!controller.signal.aborted) setCustomRoomsLoading(false);
    }
  }, [languageId]);

  useEffect(() => {
    setCustomRooms([]);
    fetchCustomRooms();
    const interval = setInterval(fetchCustomRooms, 10000);
    return () => {
      roomsRequest.current?.abort();
      clearInterval(interval);
    };
  }, [fetchCustomRooms]);

  useEffect(() => {
    fetchLobby();
    const interval = setInterval(fetchLobby, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateRoomSuccess = (room: any) => {
    setIsCreateModalOpen(false);
    const liveQuery = room.isLiveMode ? '&type=live' : '';
    navigate(`/games/room/${room.roomCode}?mode=${room.gameMode}&lang=${room.languageId || activeLanguage.id}${liveQuery}`);
  };

  const handleJoinCustomRoom = (room: any) => {
    if (isGuest || !user) {
      promptLogin('Đăng nhập để tham gia thi đấu cùng bạn bè');
      return;
    }
    if (room.hasPassword) {
      setPasswordModalData({
        isOpen: true,
        roomCode: room.roomCode,
        roomTitle: room.title,
        gameMode: room.gameMode,
      });
    } else {
      const liveQuery = room.isLiveMode ? '&type=live' : '';
      navigate(`/games/room/${room.roomCode}?mode=${room.gameMode}&lang=${room.languageId || activeLanguage.id}${liveQuery}`);
    }
  };

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickJoinCode.trim()) return;
    if (isGuest || !user) {
      promptLogin('Đăng nhập để tham gia phòng đấu');
      return;
    }
    const cleanCode = quickJoinCode.replace(/\s/g, '').toUpperCase();
    navigate(`/games/room/${encodeURIComponent(cleanCode)}`);
  };

  // Countdown timer tick
  const isCountingDown = countdown > 0;
  useEffect(() => {
    if (!isCountingDown) return;
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isCountingDown]);

  const fetchLobby = async () => {
    const t0 = Date.now();
    try {
      const res: any = await api.get('/games/lobby');
      const measuredLatency = Date.now() - t0;
      setLatency(measuredLatency);

      const data = res?.data || res;
      setLobbyData(data);
      setCountdown(data?.hoursStatus?.countdownSeconds ?? 0);
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
    const targetRoom = roomCode || `auto_${gameMode}`;
    const langParam = activeLanguage.id;
    navigate(`/games/room/${targetRoom}?mode=${gameMode}&lang=${langParam}`);
  };

  const isOpen = lobbyData?.hoursStatus?.isOpen;

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Arena title, learning space and operating window */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-5 bg-indigo-950 bg-cover bg-center p-5 text-white sm:p-6 md:grid-cols-[1fr_auto] md:items-center"
          style={{ backgroundImage: 'linear-gradient(90deg, #171437 0%, #171437e8 40%, #1714378c 100%), url(/game-assets/arena/arena-game-stage-bg.jpg)' }}>
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-white sm:text-3xl">
              <Gamepad2 aria-hidden="true" className="h-6 w-6 shrink-0 text-indigo-300" />
              Đấu trường AI
            </h1>
            <p className="mt-2 text-sm text-indigo-100">
              Thi phản xạ từ vựng và so tài cùng bạn bè.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-indigo-100">
              <span className="inline-flex items-center gap-2">
                <CountryFlag languageId={activeLanguage.id} countryCode={activeLanguage.countryCode} size="xs" />
                {activeLanguage.name}
              </span>
              {lobbyData && getLatencyBadge(latency)}
              {lobbyData?.hoursStatus?.testMode && <span>Chế độ kiểm thử</span>}
              <Link to="/leaderboard" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 font-semibold text-amber-200 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-amber-300">
                <Trophy className="h-4 w-4" aria-hidden="true" /> Bảng xếp hạng
              </Link>
            </div>
          </div>
          <div className="rounded-xl border border-indigo-400/30 bg-indigo-950 px-4 py-3 text-indigo-100">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Clock aria-hidden="true" className="h-4 w-4" />
              {loading ? 'Đang tải lịch đấu' : !lobbyData ? 'Chưa tải được lịch đấu' : isOpen ? 'Đang mở trận định kỳ' : 'Trận định kỳ mở sau'}
            </p>
            {lobbyData && (
              <p className="mt-1 text-2xl font-bold tabular-nums text-white">{formatCountdown(countdown)}</p>
            )}
            <p className="mt-1 text-xs">19:00–22:00 (GMT+7)</p>
          </div>
        </div>

        {/* Create and join rooms */}
        <div className="flex flex-col gap-3 border-t border-slate-200 p-5 dark:border-slate-800 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">Đấu cùng bạn bè</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Tạo phòng hoặc tham gia bằng mã mời.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={handleQuickJoin} className="flex w-full items-center gap-2 sm:w-auto">
              <div className="relative min-w-0 flex-1 sm:w-44">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={quickJoinCode}
                  onChange={(e) => setQuickJoinCode(e.target.value.replace(/\s/g, '').toUpperCase())}
                  placeholder="Mã phòng..."
                  maxLength={16}
                  autoCapitalize="characters"
                  aria-label="Mã phòng"
                  className="w-full min-h-11 rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm font-semibold uppercase text-slate-900 placeholder:normal-case focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={!quickJoinCode.trim()}
                className="min-h-11 shrink-0 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-900 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
              >
                Tham gia
              </button>
            </form>

            <button
              onClick={() => {
                if (isGuest || !user) {
                  promptLogin('Đăng nhập để tạo phòng đấu riêng');
                  return;
                }
                setCreateModalInitialType('PVP');
                setIsCreateModalOpen(true);
              }}
              className="btn-glass-primary flex min-h-11 w-full items-center justify-center gap-2 sm:w-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tạo phòng</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. Tonights Games Schedule Matrix */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            <span>{t('games.tonightsGames', "TONIGHT'S GAMES")}</span>
          </h2>
          {user && !isGuest && isOpen && (
            <button type="button" onClick={() => handleJoinGame(favorites[0] || 'FOUR_SKILLS_ARENA')}
              className="min-h-11 rounded-lg px-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300 dark:hover:bg-slate-800">
              Chơi lại nhanh
            </button>
          )}
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
                className={`absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-lg border transition focus-visible:ring-2 focus-visible:ring-indigo-500 ${favorites.includes(item.gameMode)
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-white'
                  }`}
                aria-pressed={favorites.includes(item.gameMode)}
                title={favorites.includes(item.gameMode) ? 'Bỏ yêu thích' : 'Lưu vào game yêu thích'}
              >
                <Heart className={`w-3.5 h-3.5 ${favorites.includes(item.gameMode) ? 'fill-current' : ''}`} />
              </button>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 pr-11">
                  <span className="text-xs tabular-nums font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {item.scheduleTime} ({item.durationMinutes}m)
                  </span>
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    {item.scoreMultiplier}x Multiplier
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-2">
                  {item.gameMode === 'TRANSLATION_RUSH'
                    ? t('games.translationRush.multilingualDesc', 'Dịch nhanh từ vựng theo ngôn ngữ đang học.')
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
                className={`w-full min-h-11 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${isOpen || lobbyData?.hoursStatus?.testMode
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

      {/* 4. Custom & Community Battle Rooms Section (PROMPT 1) */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              <span>Phòng đấu cộng đồng</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tự tạo phòng riêng, mời bạn bè cùng thi đấu hoặc tham gia các phòng đấu tự do 24/7
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isGuest || !user) {
                  promptLogin('Đăng nhập để tạo phòng Live');
                  return;
                }
                setCreateModalInitialType('TIKTOK_LIVE');
                setIsCreateModalOpen(true);
              }}
              className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-900 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
            >
              <TikTokColorLogo className="w-4 h-4" />
              <span>Tạo phòng Live</span>
            </button>
            <button
              onClick={fetchCustomRooms}
              className="grid h-11 w-11 place-items-center rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              title="Làm mới danh sách phòng"
            >
              <RotateCw className={`w-4 h-4 ${customRoomsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tabs, Search and Filter Controls */}
        <div className="space-y-3">
          {/* 1. Category Tabs & View Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Category Tabs: Tất cả, Phòng Đấu, Phòng Live, Phòng của tôi */}
            {(() => {
              const allRooms = customRooms;
              const liveCount = allRooms.filter((r) => Boolean(r.isLiveMode)).length;
              const battleCount = allRooms.filter((r) => !r.isLiveMode).length;
              const myCount = user ? allRooms.filter((r) => r.host?.id === user.id || r.hostUserId === user.id).length : 0;

              return (
                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
                  <button
                    type="button"
                    onClick={() => { setRoomCategoryTab('ALL'); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      roomCategoryTab === 'ALL'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>Tất cả</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                      {allRooms.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setRoomCategoryTab('BATTLE'); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      roomCategoryTab === 'BATTLE'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>Phòng Đấu</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                      {battleCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setRoomCategoryTab('LIVE'); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      roomCategoryTab === 'LIVE'
                        ? 'bg-white dark:bg-slate-900 text-rose-500 dark:text-rose-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <TikTokLogo className="w-3 h-3 text-rose-500" />
                    <span>Phòng Live</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/10 text-rose-500 font-semibold">
                      {liveCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!user || isGuest) {
                        promptLogin('Đăng nhập để xem danh sách phòng của bạn');
                        return;
                      }
                      setRoomCategoryTab('MY_ROOMS');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      roomCategoryTab === 'MY_ROOMS'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>Phòng của tôi</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                      {myCount}
                    </span>
                  </button>
                </div>
              );
            })()}

            {/* View Mode Toggle: Grid vs List */}
            <div className="flex items-center gap-1 self-end sm:self-auto p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => handleToggleViewMode('grid')}
                className={`p-2 rounded-lg transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Xem theo ô lưới"
                aria-label="Xem theo ô lưới"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleToggleViewMode('list')}
                className={`p-2 rounded-lg transition cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Xem theo danh sách"
                aria-label="Xem theo danh sách"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search and Mode Filter Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[160px] sm:min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customRoomSearch}
                  onChange={(e) => {
                    setCustomRoomSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Tìm tên hoặc mã phòng..."
                  aria-label="Tìm tên hoặc mã phòng"
                  className="w-full min-h-10 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <FilterSelect
                value={customRoomFilter}
                onChange={(val) => {
                  setCustomRoomFilter(String(val));
                  setCurrentPage(1);
                }}
                size="sm"
                options={[
                  { value: 'ALL', label: 'Tất cả chế độ' },
                  { value: 'CLASSIC_QUIZ', label: 'Đại Chiến Trắc Nghiệm' },
                  { value: 'SURVIVAL', label: 'Sinh Tồn 3 Mạng' },
                  { value: 'DUEL', label: 'Song Đấu 1vs1' },
                  { value: 'TEAM_BATTLE', label: 'Đại Chiến Bang Hội' },
                  { value: 'WORD_RUSH', label: 'Word Rush Giải Mã' },
                  { value: 'BOSS_ROUND', label: 'Vòng Đấu Trùm x2' },
                  { value: 'FINAL_SHOWDOWN', label: 'Chung Kết Quyết Đấu x3' },
                  { value: 'TRANSLATION_RUSH', label: 'Dịch Nhanh Song Ngữ' },
                  { value: 'LISTENING_RUSH', label: 'Luyện Nghe Bắt Âm' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Custom Rooms Content (Grid or List with Pagination) */}
        {(() => {
          const allRooms = customRooms;
          const filtered = allRooms.filter((r) => {
            // Tab filter
            if (roomCategoryTab === 'LIVE' && !r.isLiveMode) return false;
            if (roomCategoryTab === 'BATTLE' && r.isLiveMode) return false;
            if (roomCategoryTab === 'MY_ROOMS') {
              const isMyRoom = user && (r.host?.id === user.id || r.hostUserId === user.id);
              if (!isMyRoom) return false;
            }

            // Mode filter
            const matchesMode = customRoomFilter === 'ALL' || r.gameMode === customRoomFilter;

            // Search query
            const matchesSearch =
              !customRoomSearch ||
              r.title.toLowerCase().includes(customRoomSearch.toLowerCase()) ||
              r.roomCode.toLowerCase().includes(customRoomSearch.toLowerCase());

            return matchesMode && matchesSearch;
          }).sort((a, b) => Number(Boolean(b.isLiveMode)) - Number(Boolean(a.isLiveMode)));

          if (filtered.length === 0) {
            return (
              <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
                <Users className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-black text-white">
                  {roomCategoryTab === 'MY_ROOMS'
                    ? 'Bạn chưa tạo phòng đấu nào'
                    : 'Chưa có phòng đấu mở nào phù hợp'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {roomCategoryTab === 'MY_ROOMS'
                    ? 'Hãy tạo phòng đấu riêng của bạn ngay bây giờ để mời bạn bè vào so tài!'
                    : 'Hãy là người đầu tiên tạo phòng đấu riêng và rủ bạn bè vào so tài phản xạ tiếng Anh!'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (isGuest || !user) {
                      promptLogin('Đăng nhập để tạo phòng');
                      return;
                    }
                    setCreateModalInitialType(roomCategoryTab === 'LIVE' ? 'TIKTOK_LIVE' : 'PVP');
                    setIsCreateModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tạo Phòng Mới Ngay</span>
                </button>
              </div>
            );
          }

          const totalPages = Math.ceil(filtered.length / pageSize) || 1;
          const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
          const startIndex = (validCurrentPage - 1) * pageSize;
          const paginatedRooms = filtered.slice(startIndex, startIndex + pageSize);

          return (
            <div className="space-y-4">
              {/* VIEW 1: GRID VIEW */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {paginatedRooms.map((room) => {
                    const isHost = Boolean(user && (room.host?.id === user.id || room.hostUserId === user.id));

                    return (
                      <div
                        key={room.id || room.roomCode}
                        className={`p-4 rounded-2xl border hover:border-indigo-500/70 transition-colors space-y-3 flex flex-col justify-between ${
                          room.isLiveMode
                            ? 'dark bg-[#151e40] text-white border-indigo-400/40 bg-[url(/game-assets/arena/signal-alloy.webp)] bg-cover bg-blend-soft-light'
                            : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                #{room.roomCode}
                              </span>
                              {room.hasPassword && (
                                <span
                                  className="p-1 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs"
                                  title="Phòng có mật khẩu bảo vệ"
                                >
                                  <Lock className="w-3 h-3" />
                                </span>
                              )}
                              {room.isLiveMode && (
                                <span
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xs font-black"
                                  title="Phòng đấu Live"
                                >
                                  <TikTokLogo className="w-2.5 h-2.5" />
                                  <span>LIVE</span>
                                </span>
                              )}
                              {room.languageId && (
                                <CountryFlag languageId={room.languageId} size="xs" />
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Host actions: Edit & Delete buttons */}
                              {isHost && (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => handleEditRoom(room, e)}
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                                    title="Chỉnh sửa phòng"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteRoom(room, e)}
                                    disabled={isDeletingRoom === room.roomCode}
                                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition cursor-pointer disabled:opacity-50"
                                    title="Xóa phòng"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}

                              <span className="text-[11px] font-bold text-slate-400">
                                {room.playerCount ?? room.participants?.length ?? 0}
                                {!room.isLiveMode && `/${room.maxPlayers || 8}`} người
                              </span>
                            </div>
                          </div>

                          <h3 className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">
                            {room.title}
                          </h3>

                          {room.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                              {room.description}
                            </p>
                          )}

                          {/* Metadata tags */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {room.gameMode === 'CLASSIC_QUIZ'
                                ? 'Trắc Nghiệm'
                                : room.gameMode === 'SURVIVAL'
                                  ? 'Sinh Tồn 3 Mạng'
                                  : room.gameMode === 'DUEL'
                                    ? 'Song Đấu 1vs1'
                                    : room.gameMode === 'TEAM_BATTLE'
                                      ? 'Bang Hội'
                                      : room.gameMode === 'WORD_RUSH'
                                        ? 'Word Rush'
                                        : room.gameMode === 'BOSS_ROUND'
                                          ? 'Đấu Trùm x2'
                                          : room.gameMode === 'FINAL_SHOWDOWN'
                                            ? 'Chung Kết x3'
                                            : room.gameMode === 'TRANSLATION_RUSH'
                                              ? 'Dịch Nhanh'
                                              : room.gameMode === 'LISTENING_RUSH'
                                                ? 'Luyện Nghe'
                                                : 'Đấu Trường'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {room.questionCount || 10} câu
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {room.roundDurationSec || 15}s
                            </span>
                          </div>

                          {/* Host avatar & name */}
                          {room.host && (
                            <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                              <div className="w-5 h-5 rounded-full bg-indigo-500/30 text-indigo-300 flex items-center justify-center text-xs font-bold overflow-hidden">
                                {room.host.avatar ? (
                                  <img src={room.host.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  room.host.displayName?.[0] || 'H'
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 font-semibold truncate">
                                Chủ phòng: {room.host.displayName || 'Learner'} {isHost && '(Bạn)'}
                              </span>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleJoinCustomRoom(room)}
                          className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Tham Gia</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* VIEW 2: LIST VIEW */}
              {viewMode === 'list' && (
                <div className="space-y-2">
                  {paginatedRooms.map((room) => {
                    const isHost = Boolean(user && (room.host?.id === user.id || room.hostUserId === user.id));

                    return (
                      <div
                        key={room.id || room.roomCode}
                        className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          room.isLiveMode
                            ? 'dark bg-[#151e40] text-white border-indigo-400/40'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {/* Left: Code, Info */}
                        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-mono text-xs font-black px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                              #{room.roomCode}
                            </span>
                            {room.languageId && (
                              <CountryFlag languageId={room.languageId} size="xs" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                                {room.title}
                              </h3>
                              {room.hasPassword && (
                                <span className="p-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px]" title="Có mật khẩu">
                                  <Lock className="w-3 h-3" />
                                </span>
                              )}
                              {room.isLiveMode && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-400 text-[10px] font-black">
                                  <TikTokLogo className="w-2.5 h-2.5" />
                                  <span>LIVE</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="font-semibold">
                                {room.gameMode === 'CLASSIC_QUIZ'
                                  ? 'Trắc Nghiệm'
                                  : room.gameMode === 'SURVIVAL'
                                    ? 'Sinh Tồn 3 Mạng'
                                    : room.gameMode === 'DUEL'
                                      ? 'Song Đấu 1vs1'
                                      : room.gameMode === 'TEAM_BATTLE'
                                        ? 'Bang Hội'
                                        : room.gameMode === 'WORD_RUSH'
                                          ? 'Word Rush'
                                          : room.gameMode === 'BOSS_ROUND'
                                            ? 'Đấu Trùm x2'
                                            : room.gameMode === 'FINAL_SHOWDOWN'
                                              ? 'Chung Kết x3'
                                              : room.gameMode === 'TRANSLATION_RUSH'
                                                ? 'Dịch Nhanh'
                                                : 'Đấu Trường'}
                              </span>
                              <span>•</span>
                              <span>{room.questionCount || 10} câu</span>
                              <span>•</span>
                              <span>{room.roundDurationSec || 15}s</span>
                              {room.host && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">Chủ phòng: {room.host.displayName || 'Learner'} {isHost && '(Bạn)'}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Player count & Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            {room.playerCount ?? room.participants?.length ?? 0}
                            {!room.isLiveMode && `/${room.maxPlayers || 8}`} người
                          </span>

                          <div className="flex items-center gap-2">
                            {isHost && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => handleEditRoom(room, e)}
                                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                  title="Chỉnh sửa phòng"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Sửa</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteRoom(room, e)}
                                  disabled={isDeletingRoom === room.roomCode}
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  title="Xóa phòng"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Xóa</span>
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => handleJoinCustomRoom(room)}
                              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>Tham Gia</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Hiển thị {startIndex + 1} - {Math.min(startIndex + pageSize, filtered.length)} trên tổng số {filtered.length} phòng
                  </span>

                  <div className="flex items-center gap-1.5 self-center sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={validCurrentPage <= 1}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 transition cursor-pointer disabled:cursor-not-allowed"
                      aria-label="Trang trước"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-8 h-8 px-2 rounded-lg font-bold text-xs transition cursor-pointer ${
                          page === validCurrentPage
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={validCurrentPage >= totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 transition cursor-pointer disabled:cursor-not-allowed"
                      aria-label="Trang tiếp"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Modals */}
      <CreateCustomRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onRoomCreated={handleCreateRoomSuccess}
        initialRoomType={createModalInitialType}
      />

      <EditCustomRoomModal
        isOpen={Boolean(editingRoom)}
        room={editingRoom}
        onClose={() => setEditingRoom(null)}
        onRoomUpdated={() => {
          setEditingRoom(null);
          fetchCustomRooms();
        }}
      />

      {passwordModalData && (
        <EnterRoomPasswordModal
          isOpen={passwordModalData.isOpen}
          roomCode={passwordModalData.roomCode}
          roomTitle={passwordModalData.roomTitle}
          onClose={() => setPasswordModalData(null)}
          onSuccess={(code, roomPassword) => {
            const mode = passwordModalData.gameMode;
            setPasswordModalData(null);
            navigate(`/games/room/${code}?mode=${mode}`, { state: { roomPassword } });
          }}
        />
      )}
    </div>
  );
};

export default GameLobbyPage;

