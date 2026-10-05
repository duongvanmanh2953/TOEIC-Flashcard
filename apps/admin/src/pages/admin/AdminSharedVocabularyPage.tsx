import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  UploadCloud,
  AlertTriangle,
  RotateCcw,
  User,
  Tag,
  Check,
  X,
  FileText,
  Lock,
  Loader2,
  Trash2,
  Globe,
} from 'lucide-react';
import api, { extractApiList } from '../../lib/api';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { MoreActionsDropdown } from '../../components/common/MoreActionsDropdown';
import { confirmModal } from '../../components/common/ConfirmDialog';
import { useI18n } from '../../i18n';
import { SUPPORTED_LANGUAGES } from '../../config/languages';
import { CountryFlag } from '../../components/language/CountryFlag';
import { SearchableSelect, DropdownOption } from '../../components/common/SearchableSelect';

interface CommunityWord {
  id: string;
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  meaning: string;
  definition?: string;
  example?: string;
  exampleTranslation?: string;
}

interface SharedDeck {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  cefrLevel: string;
  languageId?: string;
  isOfficial?: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isProtected?: boolean;
  hasPassword?: boolean;
  cloneCount: number;
  createdAt: string;
  updatedAt: string;
  qualityScore: number;
  flags: string[];
  author: {
    id: string;
    displayName?: string;
    email: string;
  };
  words: CommunityWord[];
  _count?: {
    words: number;
    clones: number;
  };
}

export const AdminSharedVocabularyPage: React.FC = () => {
  const { t } = useI18n();
  const [decks, setDecks] = useState<SharedDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [spaceFilter, setSpaceFilter] = useState('ALL');
  const [officialFilter, setOfficialFilter] = useState<'ALL' | 'OFFICIAL' | 'COMMUNITY'>('ALL');
  const [selectedDeck, setSelectedDeck] = useState<SharedDeck | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [targetDeckForAction, setTargetDeckForAction] = useState<SharedDeck | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveConfirmModal, setShowApproveConfirmModal] = useState(false);
  const [showUnapproveConfirmModal, setShowUnapproveConfirmModal] = useState(false);
  const [showChangeLangModal, setShowChangeLangModal] = useState(false);
  const [deckToChangeLang, setDeckToChangeLang] = useState<SharedDeck | null>(null);
  const [selectedNewLang, setSelectedNewLang] = useState<string>('en');
  const [messageToast, setMessageToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setMessageToast({ type, text });
    setTimeout(() => setMessageToast(null), 4000);
  };

  const fetchDecks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/shared-vocabulary', {
        params: {
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          languageId: spaceFilter !== 'ALL' ? spaceFilter : undefined,
          isOfficial: officialFilter === 'OFFICIAL' ? 'true' : officialFilter === 'COMMUNITY' ? 'false' : undefined,
          search: search.trim() || undefined,
          limit: 100,
        },
      });
      const list = extractApiList<SharedDeck>(res);
      setDecks(Array.isArray(list?.items) ? list.items : Array.isArray(list) ? (list as any) : []);
    } catch (err) {
      console.error('Failed to load shared vocabulary decks:', err);
      showToast('error', 'Không thể tải danh sách bộ từ vựng đóng góp.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, spaceFilter, officialFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDecks();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchDecks]);

  const handleToggleOfficial = async (deck: SharedDeck) => {
    setActionLoading(true);
    try {
      const nextOfficial = !deck.isOfficial;
      await api.post(`/admin/shared-vocabulary/${deck.id}/toggle-official`, {
        isOfficial: nextOfficial,
      });
      showToast(
        'success',
        nextOfficial
          ? `⭐ Đã thiết lập "${deck.title}" làm KHO CHÍNH của app!`
          : `Đã hủy thiết lập kho chính cho "${deck.title}".`,
      );
      if (selectedDeck && selectedDeck.id === deck.id) {
        setSelectedDeck((prev) => (prev ? { ...prev, isOfficial: nextOfficial } : null));
      }
      fetchDecks();
    } catch (err: any) {
      console.error('Toggle official error:', err);
      showToast('error', err?.response?.data?.message || 'Không thể cập nhật trạng thái kho chính.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateLanguage = async (deckId: string, newLangId: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/admin/shared-vocabulary/${deckId}/language`, {
        languageId: newLangId,
      });
      const langObj = SUPPORTED_LANGUAGES.find((l) => l.id === newLangId);
      showToast('success', `Đã chuyển bộ từ sang không gian ngôn ngữ: ${langObj?.name || newLangId}`);
      setShowChangeLangModal(false);
      setDeckToChangeLang(null);
      if (selectedDeck && selectedDeck.id === deckId) {
        setSelectedDeck((prev) => (prev ? { ...prev, languageId: newLangId } : null));
      }
      fetchDecks();
    } catch (err: any) {
      console.error('Update deck language error:', err);
      showToast('error', err?.response?.data?.message || 'Không thể chuyển đổi không gian ngôn ngữ.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleModerate = async (
    action: 'APPROVE' | 'REJECT' | 'PENDING',
    overrideDeck?: SharedDeck,
  ) => {
    const deck = overrideDeck || targetDeckForAction || selectedDeck;
    if (!deck) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/shared-vocabulary/${deck.id}/moderate`, {
        action,
        reason: action === 'REJECT' ? rejectReason.trim() : undefined,
      });

      showToast(
        'success',
        action === 'APPROVE'
          ? `Đã duyệt và công khai bộ từ "${deck.title}"!`
          : action === 'REJECT'
            ? `Đã từ chối bộ từ "${deck.title}". Thông báo đã gửi đến học viên.`
            : `Đã hoàn tác duyệt bộ từ "${deck.title}" về chờ duyệt.`,
      );

      setShowRejectModal(false);
      setShowApproveConfirmModal(false);
      setShowUnapproveConfirmModal(false);
      setTargetDeckForAction(null);
      setRejectReason('');

      // If drawer is open on this deck, update its status
      if (selectedDeck && selectedDeck.id === deck.id) {
        setSelectedDeck((prev) =>
          prev
            ? {
              ...prev,
              status:
                action === 'APPROVE'
                  ? 'APPROVED'
                  : action === 'REJECT'
                    ? 'REJECTED'
                    : 'PENDING',
            }
            : null,
        );
      }
      fetchDecks();
    } catch (err: any) {
      console.error('Moderation error:', err);
      showToast('error', err?.response?.data?.message || err?.message || 'Có lỗi khi xử lý kiểm duyệt.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublishToMaster = async (targetDeck?: SharedDeck) => {
    const deckToPublish = targetDeck || selectedDeck;
    if (!deckToPublish) return;
    setActionLoading(true);
    try {
      const res: any = await api.post(`/admin/shared-vocabulary/${deckToPublish.id}/publish-master`);
      showToast(
        'success',
        res?.data?.message || `Đã xuất bản ${res?.data?.publishedCount || 0} từ vào từ điển hệ thống!`,
      );
      fetchDecks();
    } catch (err: any) {
      console.error('Publish to master error:', err);
      showToast('error', err?.response?.data?.message || 'Không thể xuất bản vào từ điển chính.');
    } finally {
      setActionLoading(false);
    }
  };

  const statusOptions = [
    { value: 'ALL', label: 'Tất cả trạng thái' },
    { value: 'PENDING', label: 'Chờ duyệt (Pending)' },
    { value: 'APPROVED', label: 'Đã duyệt (Approved)' },
    { value: 'REJECTED', label: 'Bị từ chối (Rejected)' },
  ];

  const officialOptions = [
    { value: 'ALL', label: 'Tất cả loại kho' },
    { value: 'OFFICIAL', label: '⭐ Kho chính của App' },
    { value: 'COMMUNITY', label: '👥 Kho cộng đồng' },
  ];

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const baseDecks = Array.isArray(decks) ? decks : [];
  const deckList = baseDecks.filter((d: any) => {
    if (spaceFilter !== 'ALL' && d.languageId !== spaceFilter && d.languageSpaceId !== spaceFilter) {
      return false;
    }
    if (officialFilter === 'OFFICIAL' && !d.isOfficial) return false;
    if (officialFilter === 'COMMUNITY' && d.isOfficial) return false;
    return true;
  });

  const languageCounts = React.useMemo(() => {
    const map: Record<string, number> = {};
    baseDecks.forEach((d: any) => {
      const lang = d.languageId || 'en';
      map[lang] = (map[lang] || 0) + 1;
    });
    return map;
  }, [baseDecks]);

  const languageSpaceOptions: DropdownOption[] = React.useMemo(() => [
    {
      value: 'ALL',
      label: `🌐 Tất cả không gian ngôn ngữ (${baseDecks.length})`,
      badge: baseDecks.length,
      icon: '🌐',
      description: `Hiển thị toàn bộ ${baseDecks.length} kho từ vựng của mọi ngôn ngữ`,
    },
    ...SUPPORTED_LANGUAGES.map((lang) => {
      const count = languageCounts[lang.id] || 0;
      return {
        value: lang.id,
        label: `${lang.name} (${lang.nativeName})`,
        badge: count,
        icon: <CountryFlag languageId={lang.id} size="xs" />,
        description: `Ngôn ngữ: ${lang.name} • ${count} kho từ`,
      };
    }),
  ], [baseDecks.length, languageCounts]);

  const pendingCount = deckList.filter((d) => d.status === 'PENDING').length;
  const approvedCount = deckList.filter((d) => d.status === 'APPROVED').length;
  const rejectedCount = deckList.filter((d) => d.status === 'REJECTED').length;
  const officialCount = deckList.filter((d) => d.isOfficial).length;

  const handleDeleteDeck = async (deck?: SharedDeck) => {
    const target = deck || selectedDeck;
    if (!target) return;
    const ok = await confirmModal({
      title: 'Xóa vĩnh viễn kho từ vựng',
      message: `Bạn có chắc chắn muốn XÓA VĨNH VIỄN kho từ "${target.title}"? Toàn bộ danh sách từ vựng, câu ví dụ và liên kết học viên sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu mà không cần thông qua chủ kho!`,
      type: 'danger',
      confirmText: 'Xóa vĩnh viễn',
      cancelText: 'Giữ lại',
    });
    if (!ok) return;

    setActionLoading(true);
    try {
      await api.delete(`/admin/shared-vocabulary/${target.id}`).catch(() => {
        return api.delete(`/community/decks/${target.id}`);
      });
      showToast('success', `Đã xóa vĩnh viễn kho từ "${target.title}" thành công.`);
      if (selectedDeck && selectedDeck.id === target.id) {
        setSelectedDeck(null);
      }
      setSelectedIds((prev) => prev.filter((id) => id !== target.id));
      fetchDecks();
    } catch (err: any) {
      console.error('Delete deck error:', err);
      showToast('error', err?.response?.data?.message || 'Không thể xóa kho từ vựng.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const ok = await confirmModal({
      title: 'Xóa hàng loạt kho từ vựng',
      message: `Bạn có chắc chắn muốn XÓA VĨNH VIỄN ${selectedIds.length} kho từ vựng đã chọn khỏi hệ thống? Thao tác này xóa trực tiếp trên database mà không cần thông qua chủ kho!`,
      type: 'danger',
      confirmText: `Xóa ${selectedIds.length} kho từ`,
      cancelText: 'Hủy bỏ',
    });
    if (!ok) return;

    setActionLoading(true);
    try {
      await api.post('/admin/shared-vocabulary/bulk-delete', { ids: selectedIds }).catch(() => {
        return api.post('/community/decks/bulk-delete', { ids: selectedIds });
      });
      showToast('success', `Đã xóa vĩnh viễn ${selectedIds.length} kho từ vựng.`);
      setSelectedIds([]);
      fetchDecks();
    } catch (err: any) {
      console.error('Bulk delete error:', err);
      showToast('error', err?.response?.data?.message || 'Không thể xóa hàng loạt kho từ.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(deckList.map((d) => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {messageToast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl backdrop-blur-xl border shadow-xl flex items-center gap-3 transition-all ${messageToast.type === 'success'
            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
            : 'bg-rose-950/90 text-rose-300 border-rose-500/40'
            }`}
        >
          {messageToast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{messageToast.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 bg-slate-900/60 border border-slate-800/80 rounded-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Quản Lý Kho Từ Vựng & Bộ Thẻ (Vocabulary Decks Vault)
              </h2>
              <p className="text-xs text-slate-400">
                Hiển thị toàn bộ kho từ theo ngôn ngữ. Quản trị viên có toàn quyền kiểm duyệt, gắn nhãn Kho Chính App và xóa vĩnh viễn kho từ mà không cần chờ chủ kho.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-2xl border flex items-center gap-2 transition cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-800 border-indigo-500 text-white font-bold'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span className="text-xs">Tất cả ({deckList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setOfficialFilter(officialFilter === 'OFFICIAL' ? 'ALL' : 'OFFICIAL')}
            className={`px-3 py-1.5 rounded-2xl border flex items-center gap-2 transition cursor-pointer ${
              officialFilter === 'OFFICIAL'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/15'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold">{officialCount} Kho Chính App</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
            className={`px-3 py-1.5 rounded-2xl border flex items-center gap-2 transition cursor-pointer ${
              statusFilter === 'PENDING'
                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-bold'
                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/15'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-bold">{pendingCount} Chờ Duyệt</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'APPROVED' ? 'ALL' : 'APPROVED')}
            className={`px-3 py-1.5 rounded-2xl border flex items-center gap-2 transition cursor-pointer ${
              statusFilter === 'APPROVED'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-bold">{approvedCount} Đã Duyệt</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'REJECTED' ? 'ALL' : 'REJECTED')}
            className={`px-3 py-1.5 rounded-2xl border flex items-center gap-2 transition cursor-pointer ${
              statusFilter === 'REJECTED'
                ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/15'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-xs font-bold">{rejectedCount} Bị Từ Chối</span>
          </button>
        </div>
      </div>

      {/* Prominent Language Bar - Searchable Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Phân Loại Kho Từ Theo Ngôn Ngữ Học (Language Spaces)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Chọn hoặc tìm kiếm không gian ngôn ngữ để lọc và quản lý danh sách bộ từ
            </p>
          </div>
        </div>

        <div className="w-full sm:w-80">
          <SearchableSelect
            value={spaceFilter}
            onChange={(val) => setSpaceFilter(String(val))}
            options={languageSpaceOptions}
            placeholder="Chọn không gian ngôn ngữ..."
            searchPlaceholder="Tìm kiếm ngôn ngữ (Anh, Hàn, Nhật, Trung...)..."
            size="sm"
            className="w-full"
          />
        </div>
      </div>

      {/* Sticky Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-indigo-950/90 border border-indigo-500/40 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shadow-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center">
              {selectedIds.length}
            </span>
            <span className="text-xs font-semibold text-indigo-200">kho từ vựng đã chọn</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={actionLoading}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa Vĩnh Viễn ({selectedIds.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="glass-card p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-2 lg:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tiêu đề bộ từ, người đóng góp, hoặc email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition min-h-[38px]"
            />
          </div>

          <div className="lg:col-span-3">
            <FilterSelect
              value={spaceFilter}
              onChange={(val) => setSpaceFilter(String(val))}
              options={[
                { value: 'ALL', label: 'Tất cả không gian học' },
                ...SUPPORTED_LANGUAGES.map((lang) => ({
                  value: lang.id,
                  label: `${lang.nativeName} (${lang.name})`,
                  icon: <CountryFlag languageId={lang.id} size="xs" />,
                })),
              ]}
              size="sm"
              className="w-full"
            />
          </div>

          <div className="lg:col-span-2">
            <FilterSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(String(val))}
              options={statusOptions}
              size="sm"
              className="w-full"
            />
          </div>

          <div className="lg:col-span-2">
            <FilterSelect
              value={officialFilter}
              onChange={(val) => setOfficialFilter(val as any)}
              options={officialOptions}
              size="sm"
              className="w-full"
            />
          </div>

          <div className="lg:col-span-1 flex items-center">
            <button
              onClick={fetchDecks}
              title="Làm mới danh sách"
              className="w-full h-[38px] flex items-center justify-center rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition cursor-pointer"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Decks Table / List */}
      <div className="glass-card bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Đang tải kho từ vựng đóng góp...</p>
          </div>
        ) : deckList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-500">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-300">Không tìm thấy bộ từ vựng nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Chưa có bộ từ vựng nào phù hợp với bộ lọc hiện tại. Khi học viên đóng góp bộ từ, dữ liệu sẽ xuất hiện ở đây.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full min-w-[1100px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/50 text-slate-400 font-bold uppercase tracking-wider text-[10px] whitespace-nowrap select-none">
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      aria-label="Chọn tất cả kho từ"
                      checked={deckList.length > 0 && selectedIds.length === deckList.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4 min-w-[280px]">Bộ Từ Vựng & Đóng Góp</th>
                  <th className="py-3 px-3.5 min-w-[130px]">Không Gian Ngôn Ngữ</th>
                  <th className="py-3 px-3.5 min-w-[170px]">Người Đóng Góp</th>
                  <th className="py-3 px-3.5 min-w-[110px]">Số Từ / CEFR</th>
                  <th className="py-3 px-3.5 min-w-[140px]">AI Quality Score</th>
                  <th className="py-3 px-3.5 min-w-[110px]">Trạng Thái</th>
                  <th className="py-3 px-3.5 min-w-[100px]">Ngày Gửi</th>
                  <th className="py-3 px-4 min-w-[80px] text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {deckList.map((deck) => {
                  const wordsCount = deck.words?.length || deck._count?.words || 0;
                  const score = deck.qualityScore || 0;

                  return (
                    <tr
                      key={deck.id}
                      onClick={() => setSelectedDeck(deck)}
                      className="hover:bg-slate-800/40 transition cursor-pointer group"
                    >
                      <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`Chọn kho ${deck.title}`}
                          checked={selectedIds.includes(deck.id)}
                          onChange={() => handleSelectOne(deck.id)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4 min-w-[280px]">
                        <div className="font-bold text-white group-hover:text-indigo-400 transition flex items-center gap-2 flex-wrap">
                          <span>{deck.title}</span>
                          {deck.isOfficial ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs">
                              <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
                              <span>Kho chính App</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/50">
                              Cộng đồng
                            </span>
                          )}
                          {deck.category && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/50">
                              {deck.category}
                            </span>
                          )}
                          {(deck.isProtected || deck.hasPassword) && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              <Lock className="w-3 h-3" />
                              <span>Đã mã hóa bảo vệ</span>
                            </span>
                          )}
                        </div>
                        {deck.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 max-w-sm">
                            {deck.description}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-3.5 min-w-[130px]">
                        <div className="flex items-center gap-1.5">
                          <CountryFlag languageId={deck.languageId || 'en'} size="xs" />
                          <span className="font-semibold text-slate-200">
                            {SUPPORTED_LANGUAGES.find((l) => l.id === (deck.languageId || 'en'))?.name || deck.languageId || 'Tiếng Anh'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3.5 min-w-[170px]">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-indigo-300 shrink-0">
                            {deck.author?.displayName?.[0] || deck.author?.email?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-200 truncate">
                              {deck.author?.displayName || 'Học viên ẩn danh'}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">{deck.author?.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3.5 min-w-[110px]">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200">{wordsCount} từ</span>
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                            {deck.cefrLevel}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3.5 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${score >= 80
                                ? 'bg-emerald-500'
                                : score >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                                }`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span
                            className={`font-black text-[11px] ${score >= 80
                              ? 'text-emerald-400'
                              : score >= 50
                                ? 'text-amber-400'
                                : 'text-rose-400'
                              }`}
                          >
                            {score}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 min-w-[110px]">
                        {deck.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3 h-3" />
                            Chờ duyệt
                          </span>
                        )}
                        {deck.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Đã duyệt
                          </span>
                        )}
                        {deck.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <XCircle className="w-3 h-3" />
                            Từ chối
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3.5 min-w-[100px] text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(deck.createdAt).toLocaleDateString('vi-VN')}
                      </td>

                      <td className="py-3.5 px-4 min-w-[80px] text-right">
                        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                          <MoreActionsDropdown
                            align="right"
                            size="sm"
                            tooltip="Thao tác bộ từ"
                            items={[
                              {
                                id: 'view-deck',
                                label: 'Xem chi tiết bộ từ',
                                icon: <FileText className="w-3.5 h-3.5" />,
                                onClick: () => setSelectedDeck(deck),
                              },
                              {
                                id: 'toggle-official',
                                label: deck.isOfficial ? 'Hủy quyền Kho chính của App' : '⭐ Đặt làm Kho chính của App',
                                icon: <Sparkles className={`w-3.5 h-3.5 ${deck.isOfficial ? 'text-amber-400' : 'text-amber-400'}`} />,
                                onClick: () => handleToggleOfficial(deck),
                              },
                              {
                                id: 'change-lang',
                                label: 'Đổi không gian ngôn ngữ',
                                icon: <Tag className="w-3.5 h-3.5 text-indigo-400" />,
                                onClick: () => {
                                  setDeckToChangeLang(deck);
                                  setSelectedNewLang(deck.languageId || 'en');
                                  setShowChangeLangModal(true);
                                },
                              },
                              ...(deck.status === 'PENDING'
                                ? [
                                  {
                                    id: 'approve',
                                    label: 'Phê duyệt bộ từ',
                                    variant: 'success' as const,
                                    icon: <Check className="w-3.5 h-3.5" />,
                                    disabled: actionLoading,
                                    onClick: () => {
                                      setTargetDeckForAction(deck);
                                      setShowApproveConfirmModal(true);
                                    },
                                  },
                                  {
                                    id: 'reject',
                                    label: 'Từ chối duyệt',
                                    variant: 'danger' as const,
                                    icon: <X className="w-3.5 h-3.5" />,
                                    disabled: actionLoading,
                                    onClick: () => {
                                      setTargetDeckForAction(deck);
                                      setShowRejectModal(true);
                                    },
                                  },
                                ]
                                : []),
                              ...(deck.status === 'APPROVED'
                                ? [
                                  {
                                    id: 'publish-master',
                                    label: 'Xuất bản vào Master',
                                    variant: 'primary' as const,
                                    icon: <UploadCloud className="w-3.5 h-3.5" />,
                                    disabled: actionLoading,
                                    onClick: () => {
                                      handlePublishToMaster(deck);
                                    },
                                  },
                                  {
                                    id: 'unapprove',
                                    label: 'Hủy duyệt (Thu hồi)',
                                    variant: 'danger' as const,
                                    icon: <RotateCcw className="w-3.5 h-3.5" />,
                                    divider: true,
                                    disabled: actionLoading,
                                    onClick: () => {
                                      setTargetDeckForAction(deck);
                                      setShowUnapproveConfirmModal(true);
                                    },
                                  },
                                ]
                                : []),
                              ...(deck.status === 'REJECTED'
                                ? [
                                  {
                                    id: 're-approve',
                                    label: 'Phê duyệt lại',
                                    variant: 'success' as const,
                                    icon: <Check className="w-3.5 h-3.5" />,
                                    disabled: actionLoading,
                                    onClick: () => {
                                      setTargetDeckForAction(deck);
                                      setShowApproveConfirmModal(true);
                                    },
                                  },
                                ]
                                : []),
                                {
                                  id: 'delete-deck',
                                  label: 'Xóa vĩnh viễn kho từ',
                                  variant: 'danger' as const,
                                  icon: <Trash2 className="w-3.5 h-3.5 text-rose-400" />,
                                  divider: true,
                                  disabled: actionLoading,
                                  onClick: () => handleDeleteDeck(deck),
                                },
                                {
                                  id: 'copy-id',
                                  label: 'Sao chép ID bộ từ',
                                  divider: true,
                                  icon: <Sparkles className="w-3.5 h-3.5 text-slate-400" />,
                                  onClick: () => {
                                    navigator.clipboard.writeText(deck.id);
                                    showToast('success', 'Đã sao chép ID bộ từ');
                                  },
                                },
                              ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deck Inspection Drawer Modal */}
      {selectedDeck && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {selectedDeck.title}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {selectedDeck.cefrLevel}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Đóng góp bởi <span className="text-slate-200 font-semibold">{selectedDeck.author?.displayName || selectedDeck.author?.email}</span> • {selectedDeck.words?.length || 0} từ vựng
                </p>
              </div>

              <button
                onClick={() => setSelectedDeck(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* Official Status Configuration Card */}
              <div
                className={`p-4 rounded-2xl flex items-center justify-between gap-3 border ${
                  selectedDeck.isOfficial
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-slate-950/50 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      selectedDeck.isOfficial ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold flex items-center gap-1.5">
                      {selectedDeck.isOfficial ? '⭐ KHO CHÍNH CỦA APP (Official Vault)' : 'Kho Đóng Góp Cộng Đồng'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {selectedDeck.isOfficial
                        ? 'Bộ từ này được duyệt làm kho chính thức và sẽ hiển thị ưu tiên tại Kho Từ Vựng trên app.'
                        : 'Đang ở chế độ cộng đồng. Đặt làm kho chính để hiển thị nổi bật trên ứng dụng học viên.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleOfficial(selectedDeck)}
                  disabled={actionLoading}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    selectedDeck.isOfficial
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{selectedDeck.isOfficial ? 'Hủy Kho chính' : 'Đặt làm Kho chính'}</span>
                </button>
              </div>

              {/* Language Workspace Card */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CountryFlag languageId={selectedDeck.languageId || 'en'} size="sm" />
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Không gian ngôn ngữ học</span>
                    <span className="font-bold text-slate-200 text-xs">
                      {SUPPORTED_LANGUAGES.find((l) => l.id === (selectedDeck.languageId || 'en'))?.name || selectedDeck.languageId || 'Tiếng Anh'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDeckToChangeLang(selectedDeck);
                    setSelectedNewLang(selectedDeck.languageId || 'en');
                    setShowChangeLangModal(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-semibold border border-indigo-500/20 transition cursor-pointer"
                >
                  Đổi ngôn ngữ
                </button>
              </div>

              {(selectedDeck.isProtected || selectedDeck.hasPassword) && (
                <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-purple-900/50 text-purple-300 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-purple-200">
                      Kho từ có mã bảo vệ (Đã mã hóa bcrypt một chiều)
                    </p>
                    <p className="text-[11px] text-purple-300/80 leading-relaxed">
                      Quản trị viên có toàn quyền kiểm duyệt nội dung các thẻ từ, phiên âm và ví dụ câu bên dưới để thẩm định chất lượng. Mật khẩu cá nhân do tác giả thiết lập đã được mã hóa an toàn và hoàn toàn không thể xem được.
                    </p>
                  </div>
                </div>
              )}

              {/* AI Quality Evaluation Card */}
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Đánh giá chất lượng tự động (AI Quality Analysis)
                  </span>
                  <span className="font-black text-sm text-indigo-400">
                    {selectedDeck.qualityScore}% Điểm chất lượng
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400"
                    style={{ width: `${selectedDeck.qualityScore}%` }}
                  />
                </div>

                {selectedDeck.flags && selectedDeck.flags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedDeck.flags.map((f) => (
                      <span
                        key={f}
                        className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-medium flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{f.replace(/_/g, ' ')}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Word List Preview */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Danh Sách Từ Vựng Đóng Góp ({selectedDeck.words?.length || 0})</span>
                </h4>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {selectedDeck.words && selectedDeck.words.length > 0 ? (
                    selectedDeck.words.map((w, idx) => (
                      <div
                        key={w.id || idx}
                        className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">{w.word}</span>
                          <span className="text-[10px] text-slate-500 tabular-nums">
                            {w.phonetic || '/.../'} • {w.partOfSpeech || 'n.'}
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs">
                          {w.definition || w.meaning}
                        </p>
                        {w.example && (
                          <p className="text-indigo-300/80 text-[11px] italic bg-indigo-950/20 p-2 rounded-lg border border-indigo-900/30">
                            "{w.example}"
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 py-4 text-center">Bộ thẻ này không có từ vựng nào.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-6 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePublishToMaster()}
                  disabled={actionLoading}
                  className="btn-glass-primary btn-glass-sm font-semibold"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Xuất Bản Vào Từ Điển Master</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteDeck(selectedDeck)}
                  disabled={actionLoading}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 hover:border-rose-500 text-rose-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400 group-hover:text-white" />
                  <span>Xóa Vĩnh Viễn</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedDeck.status === 'APPROVED' ? (
                  <>
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      Đã Phê Duyệt
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetDeckForAction(selectedDeck);
                        setShowUnapproveConfirmModal(true);
                      }}
                      disabled={actionLoading}
                      className="btn-glass-amber btn-glass-sm font-bold"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Hủy Duyệt (Thu Hồi)</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetDeckForAction(selectedDeck);
                        setShowRejectModal(true);
                      }}
                      disabled={actionLoading}
                      className="btn-glass-danger btn-glass-sm font-bold"
                    >
                      <X className="w-4 h-4" />
                      <span>Từ Chối</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTargetDeckForAction(selectedDeck);
                        setShowApproveConfirmModal(true);
                      }}
                      disabled={actionLoading}
                      className="btn-glass-emerald btn-glass-sm font-bold"
                    >
                      <Check className="w-4 h-4" />
                      <span>{selectedDeck.status === 'REJECTED' ? 'Phê Duyệt Lại' : 'Phê Duyệt Bộ Từ'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Confirmation Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative z-[110] animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Từ Chối Bộ Từ Vựng</h3>
                <p className="text-xs text-slate-400 truncate max-w-[280px]">
                  {targetDeckForAction?.title || selectedDeck?.title}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Nhập lý do hoặc hướng dẫn cụ thể để học viên nhận được thông báo giải thích và cải thiện nội dung:
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ví dụ: Thiếu ví dụ câu ngữ cảnh thực tế hoặc định nghĩa chưa sát nghĩa..."
              rows={3}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-rose-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setTargetDeckForAction(null);
                }}
                disabled={actionLoading}
                className="btn-glass-secondary btn-glass-sm font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleModerate('REJECT')}
                disabled={actionLoading}
                className="btn-glass-danger btn-glass-sm font-bold"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Xác Nhận Từ Chối</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {showApproveConfirmModal && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative z-[110] animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Xác Nhận Phê Duyệt Bộ Từ</h3>
                <p className="text-xs text-slate-400 truncate max-w-[280px]">
                  {targetDeckForAction?.title || selectedDeck?.title}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn phê duyệt bộ từ vựng này? Sau khi phê duyệt, bộ từ sẽ được công khai ngay lập tức lên kho từ vựng cộng đồng cho tất cả học viên có thể học và sao chép.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowApproveConfirmModal(false);
                  setTargetDeckForAction(null);
                }}
                disabled={actionLoading}
                className="btn-glass-secondary btn-glass-sm font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleModerate('APPROVE')}
                disabled={actionLoading}
                className="btn-glass-emerald btn-glass-sm font-bold"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Xác Nhận Duyệt Ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unapprove / Revoke Confirmation Modal */}
      {showUnapproveConfirmModal && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative z-[110] animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Xác Nhận Hủy Phê Duyệt</h3>
                <p className="text-xs text-slate-400 truncate max-w-[280px]">
                  {targetDeckForAction?.title || selectedDeck?.title}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn hủy phê duyệt (thu hồi) bộ từ này? Bộ từ sẽ được chuyển về trạng thái Chờ Duyệt (PENDING) và ẩn khỏi danh sách bộ từ công khai trên cộng đồng.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowUnapproveConfirmModal(false);
                  setTargetDeckForAction(null);
                }}
                disabled={actionLoading}
                className="btn-glass-secondary btn-glass-sm font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleModerate('PENDING')}
                disabled={actionLoading}
                className="btn-glass-amber btn-glass-sm font-bold"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                <span>Xác Nhận Thu Hồi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Language Workspace Modal */}
      {showChangeLangModal && deckToChangeLang && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative z-[110] animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Chuyển Không Gian Ngôn Ngữ</h3>
                <p className="text-xs text-slate-400 truncate max-w-[280px]">
                  {deckToChangeLang.title}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Chọn không gian ngôn ngữ phù hợp cho bộ từ này. Sau khi chuyển đổi, bộ từ sẽ chỉ xuất hiện ở không gian học tương ứng trên app học viên.
            </p>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400">Chọn Ngôn Ngữ Đích:</label>
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => setSelectedNewLang(lang.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                      selectedNewLang === lang.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <CountryFlag languageId={lang.id} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs truncate">{lang.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{lang.nativeName}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowChangeLangModal(false);
                  setDeckToChangeLang(null);
                }}
                disabled={actionLoading}
                className="btn-glass-secondary btn-glass-sm font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleUpdateLanguage(deckToChangeLang.id, selectedNewLang)}
                disabled={actionLoading}
                className="btn-glass-primary btn-glass-sm font-bold"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Lưu Thay Đổi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSharedVocabularyPage;
