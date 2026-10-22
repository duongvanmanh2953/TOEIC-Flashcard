import React, { useState, useEffect, useMemo } from 'react';
import {
  Gamepad2,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Shield,
  Zap,
  BookOpen,
  Volume2,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Users,
  Layers,
  Settings,
  MoreHorizontal,
  ExternalLink,
  Sparkles,
  Tag,
  DollarSign,
  AlertTriangle,
  FileText,
  Globe,
} from 'lucide-react';
import api, { extractApiList } from '../../lib/api';
import { useTranslation } from '../../i18n';
import { confirmModal } from '../../components/common/ConfirmDialog';
import { SUPPORTED_LANGUAGES } from '../../config/languages';
import { CountryFlag } from '../../components/language/CountryFlag';
import { SearchableSelect, DropdownOption } from '../../components/common/SearchableSelect';
import {
  AdminButton,
  AdminFilterBar,
  AdminSelect,
  AdminInput,
  AdminToggle,
  AdminTable,
  AdminDrawer,
  Column,
  SelectOption,
} from '../../components/admin/ui';

export interface AdminExamItem {
  id: string;
  title: string;
  description?: string;
  examType: string;
  section?: string;
  level?: string;
  languageId?: string;
  durationMinutes: number;
  totalQuestions: number;
  status: string;
  createdAt: string;
  author?: {
    id: string;
    displayName?: string;
    email?: string;
  };
  _count?: {
    questions?: number;
    attempts?: number;
  };
}

export interface GameItem {
  id: string;
  gameMode: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  category: string;
  provider: string;
  tags: string[];
  difficulty: string;
  entryPrice: number;
  scoreMultiplier: number;
  questionCount: number;
  durationMinutes: number;
  isActive: boolean;
  rankedMode?: boolean;
  testMode?: boolean;
  allowQuickJoin?: boolean;
  metadata?: {
    version?: string;
    targetSkills?: string[];
  };
}

export interface RoomItem {
  id: string;
  roomCode: string;
  gameId: string;
  gameTitle: string;
  title: string;
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED' | 'MAINTENANCE';
  currentPlayers: number;
  maxPlayers: number;
  entryPrice: number;
  isPrivate: boolean;
  scheduledAt: string;
  hostName: string;
  isActive: boolean;
}

export interface QuestionItem {
  id: string;
  gameMode: string;
  prompt: string;
  direction: string;
  correctAnswer: string;
  acceptedAnswers: string[];
  explanation?: string;
  difficulty: number;
  cefrLevel: string;
  category: string;
  status: string;
}

export const AdminGamesPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'games' | 'rooms' | 'questions' | 'exams'>('games');

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Exams State
  const [exams, setExams] = useState<AdminExamItem[]>([]);
  const [examLoading, setExamLoading] = useState(false);
  const [examLanguageFilter, setExamLanguageFilter] = useState('ALL');
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);

  // Test mode flag
  const [testMode, setTestMode] = useState<boolean>(true);

  // Games State
  const [games, setGames] = useState<GameItem[]>([
    {
      id: 'g-1',
      gameMode: 'FOUR_SKILLS_ARENA',
      title: 'Đại Chiến 4 Kỹ Năng (All-Round Arena)',
      description: 'Đấu trường phản xạ toàn diện trải qua 4 vòng thi đấu: Nghe, Nói (AI Voice), Đọc, Viết.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80',
      category: 'ARENA',
      provider: 'LetStuN Studio',
      tags: ['TOEIC 4 Skills', 'Esports', 'Multiplayer'],
      difficulty: 'B2',
      entryPrice: 15000,
      scoreMultiplier: 2.0,
      questionCount: 16,
      durationMinutes: 15,
      isActive: true,
      metadata: { version: '2.4.0', targetSkills: ['Listening', 'Speaking', 'Reading', 'Writing'] },
    },
    {
      id: 'g-2',
      gameMode: 'TRANSLATION_RUSH',
      title: 'Translation Rush (Tốc Độ Dịch)',
      description: 'Dịch nhanh cụm từ và thành ngữ công sở TOEIC trong vòng 10 giây mỗi câu.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?w=600&auto=format&fit=crop&q=80',
      category: 'VOCAB',
      provider: 'LetStuN Studio',
      tags: ['Flashcard', 'Reflex'],
      difficulty: 'B1',
      entryPrice: 0,
      scoreMultiplier: 1.0,
      questionCount: 15,
      durationMinutes: 10,
      isActive: true,
    },
    {
      id: 'g-3',
      gameMode: 'LISTENING_DUEL',
      title: 'Listening Reflex Blitz',
      description: 'Nghe giọng đọc bản xứ và điền từ khóa âm học trước đối thủ.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&auto=format&fit=crop&q=80',
      category: 'LISTENING',
      provider: 'LetStuN Studio',
      tags: ['Audio', 'Realtime Duel'],
      difficulty: 'B2',
      entryPrice: 5000,
      scoreMultiplier: 1.5,
      questionCount: 12,
      durationMinutes: 8,
      isActive: true,
    },
  ]);

  // Rooms State
  const [rooms, setRooms] = useState<RoomItem[]>([]);

  // Questions State
  const [questions, setQuestions] = useState<QuestionItem[]>([]);

  // Drawer Edit/Create State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<'game' | 'room' | 'question'>('game');
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form states for Game
  const [gameForm, setGameForm] = useState<Partial<GameItem>>({
    gameMode: 'TRANSLATION_RUSH',
    title: '',
    description: '',
    thumbnailUrl: '',
    category: 'VOCAB',
    provider: 'LetStuN Studio',
    tags: [],
    difficulty: 'B1',
    entryPrice: 0,
    scoreMultiplier: 1.0,
    questionCount: 15,
    durationMinutes: 10,
    isActive: true,
    rankedMode: true,
    testMode: false,
    allowQuickJoin: true,
  });

  // Form states for Room
  const [roomForm, setRoomForm] = useState<Partial<RoomItem>>({
    roomCode: '',
    gameId: '',
    title: '',
    status: 'WAITING',
    maxPlayers: 8,
    entryPrice: 0,
    isPrivate: false,
    isActive: true,
  });

  // Fetch initial data
  useEffect(() => {
    fetchConfigsAndRooms();
    fetchQuestions();
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setExamLoading(true);
    try {
      const res: any = await api.get('/admin/exams', { params: { limit: 100 } }).catch(() => {
        return api.get('/exams', { params: { limit: 100 } });
      });
      const list = extractApiList(res) || res?.data || res?.items || (Array.isArray(res) ? res : []);
      if (Array.isArray(list)) {
        setExams(list);
      }
    } catch (err) {
      console.error('Fetch exams error:', err);
    } finally {
      setExamLoading(false);
    }
  };

  const handleDeleteExam = async (exam: AdminExamItem) => {
    const ok = await confirmModal({
      title: 'Xóa vĩnh viễn bộ đề thi',
      message: `Bạn có chắc chắn muốn XÓA VĨNH VIỄN bộ đề thi "${exam.title}"? Toàn bộ câu hỏi, phần thi và kết quả làm bài của học viên sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu mà không cần thông qua chủ đề thi!`,
      type: 'danger',
      confirmText: 'Xóa vĩnh viễn',
      cancelText: 'Hủy bỏ',
    });
    if (!ok) return;

    try {
      await api.delete(`/admin/exams/${exam.id}`).catch(() => {
        return api.delete(`/exams/${exam.id}`);
      });
      setExams((prev) => prev.filter((e) => e.id !== exam.id));
      setSelectedExamIds((prev) => prev.filter((id) => id !== exam.id));
    } catch (err: any) {
      console.error('Delete exam error:', err);
      alert(err?.response?.data?.message || 'Không thể xóa bộ đề thi.');
    }
  };

  const handleBulkDeleteExams = async () => {
    if (selectedExamIds.length === 0) return;
    const ok = await confirmModal({
      title: 'Xóa hàng loạt bộ đề thi',
      message: `Bạn có chắc chắn muốn XÓA VĨNH VIỄN ${selectedExamIds.length} bộ đề thi đã chọn? Thao tác này xóa trực tiếp trên database mà không cần thông qua chủ đề thi!`,
      type: 'danger',
      confirmText: `Xóa ${selectedExamIds.length} đề thi`,
      cancelText: 'Hủy bỏ',
    });
    if (!ok) return;

    try {
      await Promise.all(
        selectedExamIds.map((id) =>
          api.delete(`/admin/exams/${id}`).catch(() => api.delete(`/exams/${id}`)),
        ),
      );
      setExams((prev) => prev.filter((e) => !selectedExamIds.includes(e.id)));
      setSelectedExamIds([]);
    } catch (err: any) {
      console.error('Bulk delete exams error:', err);
      alert(err?.response?.data?.message || 'Không thể xóa hàng loạt bộ đề thi.');
    }
  };

  const fetchConfigsAndRooms = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/games/admin/configs');
      const cfg = res?.data || res || [];
      if (Array.isArray(cfg) && cfg.length > 0) {
        // Map backend configs to game items
        const mapped: GameItem[] = cfg.map((c: any) => ({
          id: c.id,
          gameMode: c.gameMode,
          title: c.title || c.gameMode,
          description: c.description || 'Chế độ luyện thi thời gian thực',
          thumbnailUrl: c.thumbnailUrl || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80',
          category: c.gameMode === 'FOUR_SKILLS_ARENA' ? 'ARENA' : 'VOCAB',
          provider: 'LetStuN Studio',
          tags: [c.difficulty, 'Realtime'],
          difficulty: c.difficulty || 'B1',
          entryPrice: 0,
          scoreMultiplier: c.scoreMultiplier || 1.0,
          questionCount: c.questionCount || 10,
          durationMinutes: c.durationMinutes || 10,
          isActive: c.isActive !== false,
        }));
        setGames(mapped);
      }
    } catch {
      // Keep defaults
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const res: any = await api.get('/games/admin/questions');
      const data = res?.data || res || [];
      if (Array.isArray(data)) {
        setQuestions(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Game Active
  const handleToggleGame = async (gameId: string, current: boolean) => {
    try {
      setGames((prev) =>
        prev.map((g) => (g.id === gameId ? { ...g, isActive: !current } : g))
      );
      await api.put(`/games/admin/configs/${gameId}`, { isActive: !current });
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Room Active
  const handleToggleRoom = (roomId: string, current: boolean) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, isActive: !current } : r))
    );
  };

  // Duplicate Game
  const handleDuplicateGame = (game: GameItem) => {
    const newId = `g-${Date.now()}`;
    const duplicated: GameItem = {
      ...game,
      id: newId,
      title: `${game.title} (Bản sao)`,
      isActive: false,
    };
    setGames((prev) => [duplicated, ...prev]);
  };

  // Duplicate Room
  const handleDuplicateRoom = (room: RoomItem) => {
    const newId = `r-${Date.now()}`;
    const duplicated: RoomItem = {
      ...room,
      id: newId,
      roomCode: `COPY-${Math.floor(100 + Math.random() * 900)}`,
      title: `${room.title} (Bản sao)`,
      currentPlayers: 0,
      status: 'WAITING',
    };
    setRooms((prev) => [duplicated, ...prev]);
  };

  // Delete Game
  const handleDeleteGame = async (gameId: string) => {
    const ok = await confirmModal({
      title: 'Xóa tựa game',
      message: 'Bạn có chắc chắn muốn xóa tựa game này khỏi danh sách trò chơi?',
      type: 'danger',
      confirmText: 'Xóa game',
      cancelText: 'Hủy',
    });
    if (!ok) return;
    setGames((prev) => prev.filter((g) => g.id !== gameId));
  };

  // Delete Room
  const handleDeleteRoom = async (roomId: string) => {
    const ok = await confirmModal({
      title: 'Hủy phòng chơi',
      message: 'Bạn có chắc chắn muốn hủy phòng chơi này?',
      type: 'danger',
      confirmText: 'Hủy phòng',
      cancelText: 'Đóng',
    });
    if (!ok) return;
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
  };

  // Open Drawer for Create/Edit Game
  const handleOpenGameDrawer = (game?: GameItem) => {
    setDrawerType('game');
    if (game) {
      setEditingItem(game);
      setGameForm({
        ...game,
        rankedMode: game.rankedMode ?? true,
        testMode: game.testMode ?? false,
        allowQuickJoin: game.allowQuickJoin ?? true,
      });
    } else {
      setEditingItem(null);
      setGameForm({
        gameMode: 'TRANSLATION_RUSH',
        title: '',
        description: '',
        thumbnailUrl: '',
        category: 'VOCAB',
        provider: 'LetStuN Studio',
        tags: [],
        difficulty: 'B1',
        entryPrice: 0,
        scoreMultiplier: 1.0,
        questionCount: 15,
        durationMinutes: 10,
        isActive: true,
        rankedMode: true,
        testMode: false,
        allowQuickJoin: true,
      });
    }
    setDrawerOpen(true);
  };

  // Open Drawer for Create/Edit Room
  const handleOpenRoomDrawer = (room?: RoomItem) => {
    setDrawerType('room');
    if (room) {
      setEditingItem(room);
      setRoomForm(room);
    } else {
      setEditingItem(null);
      setRoomForm({
        roomCode: `ROOM-${Math.floor(100 + Math.random() * 900)}`,
        gameId: games[0]?.id || '',
        title: '',
        status: 'WAITING',
        maxPlayers: 8,
        entryPrice: 0,
        isPrivate: false,
        isActive: true,
      });
    }
    setDrawerOpen(true);
  };

  // Save Game Drawer
  const handleSaveGame = () => {
    if (editingItem) {
      setGames((prev) =>
        prev.map((g) => (g.id === editingItem.id ? ({ ...g, ...gameForm } as GameItem) : g))
      );
    } else {
      const newGame: GameItem = {
        ...gameForm,
        id: `g-${Date.now()}`,
      } as GameItem;
      setGames((prev) => [newGame, ...prev]);
    }
    setDrawerOpen(false);
  };

  // Save Room Drawer
  const handleSaveRoom = () => {
    if (editingItem) {
      setRooms((prev) =>
        prev.map((r) => (r.id === editingItem.id ? ({ ...r, ...roomForm } as RoomItem) : r))
      );
    } else {
      const selectedGame = games.find((g) => g.id === roomForm.gameId);
      const newRoom: RoomItem = {
        ...roomForm,
        id: `r-${Date.now()}`,
        gameTitle: selectedGame?.title || 'Game Room',
        currentPlayers: 0,
        scheduledAt: 'Bắt đầu ngay',
        hostName: 'Admin',
      } as RoomItem;
      setRooms((prev) => [newRoom, ...prev]);
    }
    setDrawerOpen(false);
  };

  // Filtered Games
  const filteredGames = games.filter((g) => {
    const matchSearch = g.title.toLowerCase().includes(search.toLowerCase()) || g.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'ALL' || g.category === categoryFilter;
    const matchStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? g.isActive : !g.isActive);
    return matchSearch && matchCat && matchStatus;
  });

  // Filtered Rooms
  const filteredRooms = rooms.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.roomCode.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Table Columns for Games
  const gameColumns: Column<GameItem>[] = [
    {
      key: 'title',
      header: 'Tựa Game & Thông Tin',
      render: (item) => (
        <div className="flex items-center gap-3">
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="w-10 h-10 rounded-xl object-cover border border-slate-800 shrink-0"
          />
          <div className="min-w-0">
            <span className="font-bold text-slate-100 block truncate">{item.title}</span>
            <span className="text-[11px] text-slate-400 truncate block max-w-sm">
              {item.description}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Phân Loại & CEFR',
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-medium">
            {item.category}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
            {item.difficulty}
          </span>
        </div>
      ),
    },
    {
      key: 'entryPrice',
      header: 'Giá Vé / Token',
      render: (item) => (
        <span className="font-semibold text-slate-200 tabular-nums">
          {item.entryPrice > 0 ? `${item.entryPrice.toLocaleString('vi-VN')} ₫` : 'Miễn phí'}
        </span>
      ),
    },
    {
      key: 'durationMinutes',
      header: 'Thời Lượng / Số Câu',
      render: (item) => (
        <div className="text-slate-300 tabular-nums">
          <span>{item.durationMinutes} phút</span>
          <span className="text-slate-500 text-[11px] block">{item.questionCount} câu hỏi</span>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Trạng Thái (ON/OFF)',
      align: 'center',
      render: (item) => (
        <AdminToggle
          checked={item.isActive}
          onChange={() => handleToggleGame(item.id, item.isActive)}
          size="sm"
        />
      ),
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <AdminButton
            variant="ghost"
            size="sm"
            icon={<Edit2 className="w-3.5 h-3.5" />}
            onClick={() => handleOpenGameDrawer(item)}
            title="Chỉnh sửa game"
          />
          <AdminButton
            variant="ghost"
            size="sm"
            icon={<Copy className="w-3.5 h-3.5" />}
            onClick={() => handleDuplicateGame(item)}
            title="Nhân bản game"
          />
          <AdminButton
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
            onClick={() => handleDeleteGame(item.id)}
            title="Xóa game"
          />
        </div>
      ),
    },
  ];

  // Table Columns for Rooms
  const roomColumns: Column<RoomItem>[] = [
    {
      key: 'roomCode',
      header: 'Mã Phòng & Tên Phòng',
      render: (item) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-indigo-300 tabular-nums">{item.roomCode}</span>
            <span className="text-slate-200 font-semibold truncate">{item.title}</span>
          </div>
          <span className="text-[11px] text-slate-400">Game: {item.gameTitle}</span>
        </div>
      ),
    },
    {
      key: 'currentPlayers',
      header: 'Số Người / Giới Hạn',
      render: (item) => (
        <div className="flex items-center gap-1.5 tabular-nums">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-white">{item.currentPlayers}</span>
          <span className="text-slate-500">/ {item.maxPlayers} người</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng Thái Phòng',
      render: (item) => {
        const badgeMap = {
          WAITING: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          IN_PROGRESS: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 animate-pulse',
          FINISHED: 'bg-slate-800 text-slate-400 border-slate-700',
          MAINTENANCE: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        };
        const labelMap = {
          WAITING: 'Đang Chờ',
          IN_PROGRESS: 'Đang Thi Đấu',
          FINISHED: 'Đã Kết Thúc',
          MAINTENANCE: 'Bảo Trì',
        };
        return (
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${badgeMap[item.status]}`}>
            {labelMap[item.status]}
          </span>
        );
      },
    },
    {
      key: 'entryPrice',
      header: 'Giá Phòng',
      render: (item) => (
        <span className="font-semibold text-slate-200 tabular-nums">
          {item.entryPrice > 0 ? `${item.entryPrice.toLocaleString('vi-VN')} ₫` : 'Free'}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Kích Hoạt',
      align: 'center',
      render: (item) => (
        <AdminToggle
          checked={item.isActive}
          onChange={() => handleToggleRoom(item.id, item.isActive)}
          size="sm"
        />
      ),
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <AdminButton
            variant="ghost"
            size="sm"
            icon={<Edit2 className="w-3.5 h-3.5" />}
            onClick={() => handleOpenRoomDrawer(item)}
            title="Sửa phòng"
          />
          <AdminButton
            variant="ghost"
            size="sm"
            icon={<Copy className="w-3.5 h-3.5" />}
            onClick={() => handleDuplicateRoom(item)}
            title="Nhân bản phòng"
          />
          <AdminButton
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
            onClick={() => handleDeleteRoom(item.id)}
            title="Xóa phòng"
          />
        </div>
      ),
    },
  ];

  // Filtered Exams
  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      const matchSearch =
        !search ||
        e.title?.toLowerCase().includes(search.toLowerCase()) ||
        e.description?.toLowerCase().includes(search.toLowerCase()) ||
        e.examType?.toLowerCase().includes(search.toLowerCase());
      const matchLang =
        examLanguageFilter === 'ALL' || (e.languageId || 'en') === examLanguageFilter;
      const matchStatus =
        statusFilter === 'ALL' || e.status === statusFilter;
      return matchSearch && matchLang && matchStatus;
    });
  }, [exams, search, examLanguageFilter, statusFilter]);

  const examLanguageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    SUPPORTED_LANGUAGES.forEach((l) => {
      counts[l.id] = 0;
    });
    exams.forEach((e) => {
      const lid = e.languageId || 'en';
      counts[lid] = (counts[lid] || 0) + 1;
    });
    return counts;
  }, [exams]);

  const examLanguageOptions: DropdownOption[] = useMemo(() => {
    return [
      {
        value: 'ALL',
        label: 'Tất cả ngôn ngữ',
        badge: exams.length,
        icon: <Globe className="w-4 h-4 text-indigo-400" />,
      },
      ...SUPPORTED_LANGUAGES.map((lang) => ({
        value: lang.id,
        label: lang.name,
        badge: examLanguageCounts[lang.id] || 0,
        icon: <CountryFlag languageId={lang.id} size="xs" />,
      })),
    ];
  }, [exams.length, examLanguageCounts]);

  // Table Columns for Exams
  const examColumns: Column<AdminExamItem>[] = [
    {
      key: 'title',
      header: 'Bộ Đề Thi & Loại Đề',
      render: (item) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white hover:text-indigo-400 transition">
              {item.title}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {item.examType || 'TOEIC'}
            </span>
            {item.level && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700/50">
                {item.level}
              </span>
            )}
          </div>
          {item.description && (
            <p className="text-[11px] text-slate-400 line-clamp-1 max-w-sm">
              {item.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'language',
      header: 'Ngôn Ngữ',
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <CountryFlag languageId={item.languageId || 'en'} size="xs" />
          <span className="text-xs font-semibold text-slate-200">
            {SUPPORTED_LANGUAGES.find((l) => l.id === (item.languageId || 'en'))?.name || item.languageId || 'Tiếng Anh'}
          </span>
        </div>
      ),
    },
    {
      key: 'author',
      header: 'Tác Giả / Người Tạo',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-indigo-300 shrink-0">
            {item.author?.displayName?.[0] || item.author?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">
              {item.author?.displayName || 'Ẩn danh'}
            </p>
            <p className="text-[10px] text-slate-500 truncate">{item.author?.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'stats',
      header: 'Câu Hỏi / Thời Lượng',
      render: (item) => (
        <div className="space-y-0.5 text-xs text-slate-300">
          <div className="font-semibold text-white">
            {item.totalQuestions || item._count?.questions || 0} câu
          </div>
          <div className="text-[10px] text-slate-400">
            {item.durationMinutes} phút
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      render: (item) => (
        <div>
          {item.status === 'PUBLISHED' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CheckCircle className="w-3 h-3" />
              Công Khai
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Clock className="w-3 h-3" />
              {item.status || 'Bản Nháp'}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Ngày Tạo',
      render: (item) => (
        <span className="text-[11px] text-slate-400 whitespace-nowrap">
          {new Date(item.createdAt).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => handleDeleteExam(item)}
            className="px-2.5 py-1.5 rounded-xl bg-rose-600/10 hover:bg-rose-600 border border-rose-500/30 hover:border-rose-500 text-rose-400 hover:text-white text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
            title="Xóa vĩnh viễn đề thi mà không cần thông qua tác giả"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa Vĩnh Viễn</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1 border border-indigo-500/20">
            <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Games & Realtime Arena Operations</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Quản Trị Games & Phòng Thi Đấu (Game Hub)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Quản lý danh mục tựa game, điều phối phòng thi đấu thời gian thực và ngân hàng câu hỏi.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeTab === 'games' && (
            <AdminButton
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => handleOpenGameDrawer()}
            >
              Tạo Game Mới
            </AdminButton>
          )}

          {activeTab === 'rooms' && (
            <AdminButton
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => handleOpenRoomDrawer()}
            >
              Tạo Phòng Mới
            </AdminButton>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
        <button
          onClick={() => setActiveTab('games')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
            activeTab === 'games'
              ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span>Danh Mục Game ({games.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
            activeTab === 'rooms'
              ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Phòng Thi Đấu ({rooms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
            activeTab === 'questions'
              ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Ngân Hàng Câu Hỏi ({questions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('exams')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'exams'
              ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Quản Trị Bộ Đề Thi ({exams.length})</span>
        </button>
      </div>

      {/* Universal Filter Bar */}
      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={
          activeTab === 'games'
            ? 'Tìm tựa game, mô tả...'
            : activeTab === 'rooms'
            ? 'Tìm mã phòng, tên phòng...'
            : activeTab === 'exams'
            ? 'Tìm bộ đề thi, loại đề (TOEIC, IELTS...)...'
            : 'Tìm câu hỏi...'
        }
        filters={[
          ...(activeTab === 'games'
            ? [
                {
                  key: 'category',
                  label: 'Thể Loại',
                  value: categoryFilter,
                  options: [
                    { value: 'ALL', label: 'Tất cả thể loại' },
                    { value: 'ARENA', label: 'Đấu Trường 4 Kỹ Năng' },
                    { value: 'VOCAB', label: 'Từ Vựng (Vocab)' },
                    { value: 'LISTENING', label: 'Nghe Phản Xạ' },
                  ],
                  onChange: (val: any) => setCategoryFilter(val),
                },
              ]
            : []),
          {
            key: 'status',
            label: 'Trạng Thái',
            value: statusFilter,
            options:
              activeTab === 'exams'
                ? [
                    { value: 'ALL', label: 'Tất cả trạng thái' },
                    { value: 'PUBLISHED', label: 'Công Khai' },
                    { value: 'DRAFT', label: 'Bản Nháp' },
                  ]
                : [
                    { value: 'ALL', label: 'Tất cả trạng thái' },
                    { value: 'ACTIVE', label: 'Đang Hoạt Động' },
                    { value: 'INACTIVE', label: 'Đã Vô Hiệu Hóa' },
                  ],
            onChange: (val: any) => setStatusFilter(val),
          },
        ]}
        onReset={() => {
          setSearch('');
          setCategoryFilter('ALL');
          setStatusFilter('ALL');
          setExamLanguageFilter('ALL');
        }}
      />

      {/* Tab Content: Games Table */}
      {activeTab === 'games' && (
        <AdminTable
          columns={gameColumns}
          data={filteredGames}
          loading={loading}
          emptyMessage="Không tìm thấy tựa game nào phù hợp"
          selectedIds={selectedIds}
          onSelectAll={(checked) => setSelectedIds(checked ? filteredGames.map((g) => g.id) : [])}
          onSelectRow={(id, checked) =>
            setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((i) => i !== id)))
          }
          getId={(item) => item.id}
        />
      )}

      {/* Tab Content: Rooms Table */}
      {activeTab === 'rooms' && (
        <AdminTable
          columns={roomColumns}
          data={filteredRooms}
          loading={loading}
          emptyMessage="Không tìm thấy phòng chơi nào"
          selectedIds={selectedIds}
          onSelectAll={(checked) => setSelectedIds(checked ? filteredRooms.map((r) => r.id) : [])}
          onSelectRow={(id, checked) =>
            setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((i) => i !== id)))
          }
          getId={(item) => item.id}
        />
      )}

      {/* Tab Content: Question Bank */}
      {activeTab === 'questions' && (
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Tổng số câu hỏi trong kho: {questions.length} câu
            </span>
          </div>
          <div className="divide-y divide-slate-800/60">
            {questions.slice(0, 10).map((q, idx) => (
              <div key={q.id || idx} className="py-3 flex items-start justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30">
                      {q.cefrLevel || 'B1'}
                    </span>
                    <span className="font-semibold text-white">{q.prompt}</span>
                  </div>
                  <div className="text-emerald-400">
                    Đáp án: <span className="font-semibold">{q.correctAnswer}</span>
                  </div>
                </div>
                <div className="shrink-0 text-slate-400 text-[11px]">{q.gameMode}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Exam Bank Management */}
      {activeTab === 'exams' && (
        <div className="space-y-4">
          {/* Prominent Language Bar for Exams */}
          <div className="glass-card p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-200">Phân Loại Bộ Đề Thi Theo Ngôn Ngữ</span>
                <p className="text-[11px] text-slate-400">
                  Quản trị viên có toàn quyền xóa vĩnh viễn đề thi mà không cần thông qua chủ đề thi
                </p>
              </div>
            </div>

            <div className="w-full sm:w-80 shrink-0">
              <SearchableSelect
                value={examLanguageFilter}
                onChange={(val) => setExamLanguageFilter(val)}
                options={examLanguageOptions}
                placeholder="Chọn ngôn ngữ đề thi..."
                searchPlaceholder="Tìm kiếm ngôn ngữ..."
                size="md"
              />
            </div>
          </div>

          {/* Sticky Bulk Action Bar for Exams */}
          {selectedExamIds.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-indigo-950/90 border border-indigo-500/40 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center">
                  {selectedExamIds.length}
                </span>
                <span className="text-xs font-semibold text-indigo-200">
                  bộ đề thi đã chọn
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBulkDeleteExams}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa Vĩnh Viễn ({selectedExamIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedExamIds([])}
                  className="px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>
          )}

          {/* Exams Table */}
          <AdminTable
            columns={examColumns}
            data={filteredExams}
            loading={examLoading}
            emptyMessage="Không tìm thấy bộ đề thi nào phù hợp với bộ lọc"
            selectedIds={selectedExamIds}
            onSelectAll={(checked) =>
              setSelectedExamIds(checked ? filteredExams.map((e) => e.id) : [])
            }
            onSelectRow={(id, checked) =>
              setSelectedExamIds((prev) =>
                checked ? [...prev, id] : prev.filter((i) => i !== id),
              )
            }
            getId={(item) => item.id}
          />
        </div>
      )}

      {/* =====================================================================
          DRAWER: CREATE / EDIT GAME
          ===================================================================== */}
      {drawerType === 'game' && (
        <AdminDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title={editingItem ? 'Chỉnh Sửa Tựa Game' : 'Tạo Tựa Game Mới'}
          subtitle="Cấu hình thông số thi đấu, giới hạn thời gian và quy tắc tính điểm"
          width="lg"
          footer={
            <>
              <AdminButton variant="ghost" onClick={() => setDrawerOpen(false)}>
                Hủy Bỏ
              </AdminButton>
              <AdminButton variant="primary" onClick={handleSaveGame}>
                Lưu Thông Tin Game
              </AdminButton>
            </>
          }
        >
          <div className="space-y-4">
            <AdminInput
              label="Tên Tựa Game"
              value={gameForm.title || ''}
              onChange={(e) => setGameForm({ ...gameForm, title: e.target.value })}
              placeholder="VD: Đại Chiến 4 Kỹ Năng"
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mô Tả Chi Tiết</label>
              <textarea
                value={gameForm.description || ''}
                onChange={(e) => setGameForm({ ...gameForm, description: e.target.value })}
                rows={3}
                placeholder="Mô tả thể lệ chơi, kỹ năng rèn luyện..."
                className="w-full bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500 transition shadow-xs"
              />
            </div>

            <AdminInput
              label="Đường Dẫn Thumbnail (URL ảnh bìa)"
              value={gameForm.thumbnailUrl || ''}
              onChange={(e) => setGameForm({ ...gameForm, thumbnailUrl: e.target.value })}
              placeholder="https://images.unsplash.com/..."
            />

            <div className="grid grid-cols-2 gap-3">
              <AdminSelect
                label="Thể Loại (Category)"
                value={gameForm.category || 'VOCAB'}
                onChange={(val) => setGameForm({ ...gameForm, category: val })}
                options={[
                  { value: 'ARENA', label: 'Đấu Trường Toàn Diện' },
                  { value: 'VOCAB', label: 'Từ Vựng (Vocab Rush)' },
                  { value: 'LISTENING', label: 'Nghe Phản Xạ' },
                  { value: 'GRAMMAR', label: 'Ngữ Pháp Nhanh' },
                ]}
              />

              <AdminSelect
                label="Độ Khó CEFR"
                value={gameForm.difficulty || 'B1'}
                onChange={(val) => setGameForm({ ...gameForm, difficulty: val })}
                options={[
                  { value: 'A1', label: 'A1 - Sơ Cấp' },
                  { value: 'A2', label: 'A2 - Cơ Bản' },
                  { value: 'B1', label: 'B1 - Trung Cấp' },
                  { value: 'B2', label: 'B2 - Khá' },
                  { value: 'C1', label: 'C1 - Cao Cấp' },
                ]}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <AdminInput
                label="Giá Vé (VND)"
                type="number"
                suffixUnit="₫"
                value={gameForm.entryPrice ?? 0}
                onChange={(e) => setGameForm({ ...gameForm, entryPrice: Number(e.target.value) })}
              />

              <AdminInput
                label="Số Câu Hỏi"
                type="number"
                value={gameForm.questionCount ?? 15}
                onChange={(e) => setGameForm({ ...gameForm, questionCount: Number(e.target.value) })}
              />

              <AdminInput
                label="Thời Lượng (Phút)"
                type="number"
                value={gameForm.durationMinutes ?? 10}
                onChange={(e) => setGameForm({ ...gameForm, durationMinutes: Number(e.target.value) })}
              />
            </div>

            {/* Comprehensive Operational Toggles Panel */}
            <div className="pt-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Cấu Hình Vận Hành & Tính Năng Trực Tuyến
              </div>
              <div className="space-y-3">
                <AdminToggle
                  label="Kích Hoạt Tựa Game (Active Status)"
                  description="Cho phép học viên nhìn thấy và tham gia thi đấu sảnh game này"
                  checked={gameForm.isActive ?? true}
                  onChange={(checked) => setGameForm({ ...gameForm, isActive: checked })}
                />
                <AdminToggle
                  label="Chế Độ Đấu Hạng (Ranked ELO Match)"
                  description="Tính điểm xếp hạng ELO, cập nhật bậc rank và bảng vàng sau mỗi trận"
                  checked={gameForm.rankedMode ?? true}
                  onChange={(checked) => setGameForm({ ...gameForm, rankedMode: checked })}
                />
                <AdminToggle
                  label="Chế Độ Luyện Tập / Test Mode"
                  description="Cho phép trải nghiệm luyện tập thử nghiệm không trừ vé thi đấu"
                  checked={gameForm.testMode ?? false}
                  onChange={(checked) => setGameForm({ ...gameForm, testMode: checked })}
                />
                <AdminToggle
                  label="Ghép Trận Nhanh Tự Động (Auto Matchmaking)"
                  description="Tự động xếp đối thủ ngang trình độ CEFR khi vào phòng chờ"
                  checked={gameForm.allowQuickJoin ?? true}
                  onChange={(checked) => setGameForm({ ...gameForm, allowQuickJoin: checked })}
                />
              </div>
            </div>
          </div>
        </AdminDrawer>
      )}

      {/* =====================================================================
          DRAWER: CREATE / EDIT ROOM
          ===================================================================== */}
      {drawerType === 'room' && (
        <AdminDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title={editingItem ? 'Chỉnh Sửa Phòng Chơi' : 'Tạo Phòng Thi Đấu Mới'}
          subtitle="Cấu hình mã phòng, tựa game liên kết và số lượng người chơi tối đa"
          width="md"
          footer={
            <>
              <AdminButton variant="ghost" onClick={() => setDrawerOpen(false)}>
                Hủy Bỏ
              </AdminButton>
              <AdminButton variant="primary" onClick={handleSaveRoom}>
                Lưu Cấu Hình Phòng
              </AdminButton>
            </>
          }
        >
          <div className="space-y-4">
            <AdminInput
              label="Mã Phòng (Room Code)"
              value={roomForm.roomCode || ''}
              onChange={(e) => setRoomForm({ ...roomForm, roomCode: e.target.value })}
              placeholder="VD: ARENA-889"
            />

            <AdminInput
              label="Tên Phòng"
              value={roomForm.title || ''}
              onChange={(e) => setRoomForm({ ...roomForm, title: e.target.value })}
              placeholder="VD: Phòng Đấu Bảng A"
            />

            <AdminSelect
              label="Tựa Game Liên Kết"
              value={roomForm.gameId || ''}
              onChange={(val) => setRoomForm({ ...roomForm, gameId: val })}
              options={games.map((g) => ({
                value: g.id,
                label: g.title,
                badge: g.difficulty,
              }))}
            />

            <div className="grid grid-cols-2 gap-3">
              <AdminInput
                label="Giới Hạn Người Chơi"
                type="number"
                suffixUnit="người"
                value={roomForm.maxPlayers ?? 8}
                onChange={(e) => setRoomForm({ ...roomForm, maxPlayers: Number(e.target.value) })}
              />

              <AdminInput
                label="Giá Vé Phòng (VND)"
                type="number"
                suffixUnit="₫"
                value={roomForm.entryPrice ?? 0}
                onChange={(e) => setRoomForm({ ...roomForm, entryPrice: Number(e.target.value) })}
              />
            </div>

            <AdminSelect
              label="Trạng Thái Phòng"
              value={roomForm.status || 'WAITING'}
              onChange={(val) => setRoomForm({ ...roomForm, status: val })}
              options={[
                { value: 'WAITING', label: 'Đang Chờ (Waiting)' },
                { value: 'IN_PROGRESS', label: 'Đang Thi Đấu (In Progress)' },
                { value: 'FINISHED', label: 'Đã Kết Thúc (Finished)' },
                { value: 'MAINTENANCE', label: 'Bảo Trì (Maintenance)' },
              ]}
            />

            <div className="pt-2 space-y-2">
              <AdminToggle
                label="Phòng Riêng Tư (Chỉ vào bằng mã mời)"
                checked={roomForm.isPrivate ?? false}
                onChange={(checked) => setRoomForm({ ...roomForm, isPrivate: checked })}
              />
              <AdminToggle
                label="Kích Hoạt Phòng (Cho phép hiển thị sảnh)"
                checked={roomForm.isActive ?? true}
                onChange={(checked) => setRoomForm({ ...roomForm, isActive: checked })}
              />
            </div>
          </div>
        </AdminDrawer>
      )}
    </div>
  );
};
