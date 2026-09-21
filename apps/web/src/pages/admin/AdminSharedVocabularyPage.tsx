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
} from 'lucide-react';
import api, { extractApiList } from '../../lib/api';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { useI18n } from '../../i18n';

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
  const [selectedDeck, setSelectedDeck] = useState<SharedDeck | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [targetDeckForAction, setTargetDeckForAction] = useState<SharedDeck | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveConfirmModal, setShowApproveConfirmModal] = useState(false);
  const [showUnapproveConfirmModal, setShowUnapproveConfirmModal] = useState(false);
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
          search: search.trim() || undefined,
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
  }, [statusFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDecks();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchDecks]);

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

  const handlePublishToMaster = async () => {
    if (!selectedDeck) return;
    setActionLoading(true);
    try {
      const res: any = await api.post(`/admin/shared-vocabulary/${selectedDeck.id}/publish-master`);
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
    { value: 'PENDING', label: '⏳ Chờ duyệt (Pending)' },
    { value: 'APPROVED', label: '✅ Đã duyệt (Approved)' },
    { value: 'REJECTED', label: '❌ Bị từ chối (Rejected)' },
  ];

  const deckList = Array.isArray(decks) ? decks : [];
  const pendingCount = deckList.filter((d) => d.status === 'PENDING').length;
  const approvedCount = deckList.filter((d) => d.status === 'APPROVED').length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {messageToast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl backdrop-blur-xl border shadow-xl flex items-center gap-3 transition-all ${
            messageToast.type === 'success'
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
                Kho Từ Vựng Học Viên (Learner Shared Vault)
              </h2>
              <p className="text-xs text-slate-400">
                Kiểm duyệt nội dung cộng đồng đóng góp, đánh giá AI Quality Score và xuất bản vào từ điển chính thống.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300">{pendingCount} Chờ Phê Duyệt</span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-300">{approvedCount} Đã Xuất Bản</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 glass-card p-4 bg-slate-900/40 border border-slate-800/60 rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tiêu đề bộ từ, người đóng góp, hoặc email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-3">
          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            className="w-56"
          />

          <button
            onClick={fetchDecks}
            title="Làm mới danh sách"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
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
            <table className="w-full min-w-[680px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/40 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Bộ Từ Vựng & Đóng Góp</th>
                  <th className="py-3.5 px-4">Người Đóng Góp</th>
                  <th className="py-3.5 px-4">Số Từ / CEFR</th>
                  <th className="py-3.5 px-4">AI Quality Score</th>
                  <th className="py-3.5 px-4">Trạng Thái</th>
                  <th className="py-3.5 px-4">Ngày Gửi</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
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
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white group-hover:text-indigo-400 transition flex items-center gap-2 flex-wrap">
                          <span>{deck.title}</span>
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
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 max-w-xs">
                            {deck.description}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-indigo-300">
                            {deck.author?.displayName?.[0] || deck.author?.email?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-200">
                              {deck.author?.displayName || 'Học viên ẩn danh'}
                            </p>
                            <p className="text-[10px] text-slate-500">{deck.author?.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200">{wordsCount} từ</span>
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                            {deck.cefrLevel}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                score >= 80
                                  ? 'bg-emerald-500'
                                  : score >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span
                            className={`font-black text-[11px] ${
                              score >= 80
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

                      <td className="py-3.5 px-4">
                        {deck.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3 h-3" />
                            Chờ duyệt
                          </span>
                        )}
                        {deck.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Đã phê duyệt
                          </span>
                        )}
                        {deck.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <XCircle className="w-3 h-3" />
                            Từ chối
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {new Date(deck.createdAt).toLocaleDateString('vi-VN')}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {deck.status === 'PENDING' && (
                            <>
                              <button
                                type="button"
                                title="Phê duyệt nhanh"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTargetDeckForAction(deck);
                                  setShowApproveConfirmModal(true);
                                }}
                                disabled={actionLoading}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Duyệt</span>
                              </button>
                              <button
                                type="button"
                                title="Từ chối"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTargetDeckForAction(deck);
                                  setShowRejectModal(true);
                                }}
                                disabled={actionLoading}
                                className="px-2.5 py-1 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Từ chối</span>
                              </button>
                            </>
                          )}
                          {deck.status === 'APPROVED' && (
                            <button
                              type="button"
                              title="Hủy phê duyệt"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTargetDeckForAction(deck);
                                setShowUnapproveConfirmModal(true);
                              }}
                              disabled={actionLoading}
                              className="px-2.5 py-1 rounded-lg bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Hủy duyệt</span>
                            </button>
                          )}
                          {deck.status === 'REJECTED' && (
                            <button
                              type="button"
                              title="Phê duyệt lại"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTargetDeckForAction(deck);
                                setShowApproveConfirmModal(true);
                              }}
                              disabled={actionLoading}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Duyệt lại</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDeck(deck);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] transition inline-flex items-center gap-1 border border-slate-700/60 cursor-pointer"
                          >
                            <span>Chi tiết</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
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
                        className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-medium"
                      >
                        ⚠️ {f.replace(/_/g, ' ')}
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
              <button
                type="button"
                onClick={handlePublishToMaster}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 font-semibold text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Xuất Bản Vào Từ Điển Hệ Thống (Master)</span>
              </button>

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
                      className="px-4 py-2 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
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
                      className="px-4 py-2 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
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
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/25 transition disabled:opacity-50 cursor-pointer"
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
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleModerate('REJECT')}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition shadow-lg shadow-rose-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {actionLoading && <span className="animate-spin">⏳</span>}
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
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleModerate('APPROVE')}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/25 transition disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? <span className="animate-spin">⏳</span> : <Check className="w-4 h-4" />}
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
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleModerate('PENDING')}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-600/25 transition disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? <span className="animate-spin">⏳</span> : <RotateCcw className="w-4 h-4" />}
                <span>Xác Nhận Thu Hồi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSharedVocabularyPage;
