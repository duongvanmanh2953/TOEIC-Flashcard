import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useLearningContext } from '../contexts/LearningContext';
import { getLanguage } from '../config/languages';
import { GlassCard } from '../components/common/GlassCard';
import { SpeechButton } from '../components/common/SpeechButton';
import { ModalPortal } from '../components/common/ModalPortal';
import { CustomDropdown } from '../components/common/CustomDropdown';
import { ToggleSwitch } from '../components/common/ToggleSwitch';
import { LanguageBadge } from '../components/language/LanguageBadge';
import { CountryFlag } from '../components/language/CountryFlag';
import { DeckStandardFields } from '../components/deck/DeckStandardFields';
import { UnifiedDeckModal, UnifiedDeckFormData } from '../components/deck/UnifiedDeckModal';
import {
  getLanguageStandard,
  getCertificatesForLanguage,
  getCategoriesForLanguage,
  getDefaultCategoryForLanguage,
  getDefaultLevelForLanguage,
  getDefaultCertificateForLanguage,
  mapToCefrEquivalent,
} from '../config/languageStandards';
import {
  idbSaveLocalDeck,
  idbGetLocalDecks,
  idbDeleteLocalDeck,
  idbDeleteLocalDecks,
  idbGetWords,
  idbSaveWords,
  getSessionUnlockedDecks,
  saveSessionUnlockedDeck,
} from '../lib/idb';
import * as XLSX from 'xlsx';
import { useScrollLoad } from '../hooks/useScrollLoad';
import { CommunityCommentSection } from '../components/community/CommunityCommentSection';
import { AccessKeyManagementModal } from '../components/community/AccessKeyManagementModal';
import { VerifyAccessKeyModal } from '../components/community/VerifyAccessKeyModal';
import { confirmModal } from '../components/common/ConfirmDialog';
import {
  Users,
  Copy,
  Plus,
  Trash2,
  Search,
  BookOpen,
  Key,
  CheckCircle,
  Share2,
  Sparkles,
  Layers,
  Check,
  Bookmark,
  FileText,
  CheckSquare,
  Square,
  ArrowRight,
  Download,
  HardDrive,
  Database,
  FileSpreadsheet,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ShieldCheck,
  Cloud,
  CloudUpload,
  Clock,
  XCircle,
  Crown,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Globe,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  X,
  MoreVertical,
} from 'lucide-react';

export const CommunityDecksPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isGuest, promptLogin } = useAuth();
  const { activeLanguage } = useLearningContext();
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('ALL');
  const [mainTab, setMainTab] = useState<'community' | 'my-decks'>('community');
  const [decks, setDecks] = useState<any[]>([]);
  const [myDecks, setMyDecks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMyDecks, setLoadingMyDecks] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<any | null>(null);
  const [cloneSuccess, setCloneSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Sync selected level filter when active learning space changes
  useEffect(() => {
    setSelectedLevelFilter('ALL');
  }, [activeLanguage.id]);

  // Password Protection & Unlock State
  const [enablePassword, setEnablePassword] = useState(false);
  const [deckPassword, setDeckPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [unlockedDeckIds, setUnlockedDeckIds] = useState<Record<string, boolean>>(() => getSessionUnlockedDecks());
  const [unlockedPasswords, setUnlockedPasswords] = useState<Record<string, string>>({});
  const [unlockModalDeck, setUnlockModalDeck] = useState<any | null>(null);
  const [unlockInputPassword, setUnlockInputPassword] = useState('');
  const [showUnlockPassword, setShowUnlockPassword] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'clone' | 'open-bank' | 'like' | 'dislike' | 'export' | null>(null);

  const isAdmin = Boolean(user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'));

  const handleDeleteDeckAdmin = async (deck: any) => {
    if (!deck) return;
    const isMyDeck = Boolean(user && (deck.userId === user.id || deck.author?.id === user.id));
    const ok = await confirmModal({
      title: 'Xóa vĩnh viễn kho từ vựng',
      message: `Bạn có chắc chắn muốn XÓA VĨNH VIỄN kho từ "${deck.title}"? Toàn bộ từ vựng và câu ví dụ sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu${isAdmin && !isMyDeck ? ' mà không cần thông qua chủ kho' : ''}!`,
      type: 'danger',
      confirmText: 'Xóa vĩnh viễn',
      cancelText: 'Hủy bỏ',
    });
    if (!ok) return;

    try {
      await api.delete(`/community/decks/${deck.id}`);
      if (selectedDeck && selectedDeck.id === deck.id) {
        setSelectedDeck(null);
      }
      const idsToDelete = [
        deck.id,
        deck.originDeckId,
        deck.id?.startsWith('cloned_') ? deck.id.replace('cloned_', '') : `cloned_${deck.id}`,
      ].filter(Boolean);
      await idbDeleteLocalDecks(idsToDelete).catch(() => {});

      setDecks((prev) => prev.filter((d) => d.id !== deck.id));
      setMyDecks((prev) => prev.filter((d) => d.id !== deck.id && d.originDeckId !== deck.id));
      alert('Đã xóa vĩnh viễn kho từ vựng thành công.');
    } catch (err: any) {
      console.error('Delete deck error:', err);
      alert(err?.response?.data?.message || 'Không thể xóa kho từ vựng.');
    }
  };

  const isDeckLocked = (d: any) => {
    if (!d) return false;
    const isOwner = Boolean(user && (d.userId === user.id || d.author?.id === user.id));
    const isKeyUnlocked = sessionStorage.getItem(`vf_unlocked_VOCABULARY_${d.id}`) === 'true';
    const isProtected = Boolean(d.isProtected || d.hasPassword);
    return Boolean(isProtected && !isOwner && !isAdmin && !unlockedDeckIds[d.id] && !isKeyUnlocked);
  };

  // Community Access Key Management & Verification State
  const [accessKeyManageDeck, setAccessKeyManageDeck] = useState<any | null>(null);
  const [verifyAccessKeyDeck, setVerifyAccessKeyDeck] = useState<any | null>(null);

  const handleContactDeckOwner = (deck: any) => {
    if (isGuest || !user) {
      promptLogin('Đăng nhập để liên hệ với chủ kho');
      return;
    }
    const targetUserId = deck.userId || deck.author?.id;
    if (targetUserId === user.id) {
      alert('Bạn là chủ sở hữu kho từ này, không thể tự nhắn tin cho chính mình!');
      return;
    }
    window.dispatchEvent(
      new CustomEvent('open_vocabflow_chat', {
        detail: {
          targetUser: {
            id: targetUserId,
            displayName: deck.author?.displayName || 'Chủ kho',
            avatar: deck.author?.avatar,
          },
          context: {
            bankType: 'VOCABULARY',
            bankId: deck.id,
            bankTitle: deck.title,
            bankOwnerId: targetUserId,
            languageSpaceId: deck.languageId || activeLanguage.id,
          },
        },
      }),
    );
  };

  // VIP Cloud Sync State
  const [showVipModal, setShowVipModal] = useState(false);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  // New deck form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(() => getDefaultCategoryForLanguage(activeLanguage.id));
  const [certId, setCertId] = useState<string>(() => getDefaultCertificateForLanguage(activeLanguage.id).id);
  const [cefrLevel, setCefrLevel] = useState<string>('ALL');
  const [createDeckLang, setCreateDeckLang] = useState<string>(activeLanguage.id);
  const [createDeckTab, setCreateDeckTab] = useState<'my-words' | 'manual'>('my-words');

  // Auto-sync form defaults when active learning space changes
  useEffect(() => {
    setCreateDeckLang(activeLanguage.id);
    setCategory(getDefaultCategoryForLanguage(activeLanguage.id));
    setCertId(getDefaultCertificateForLanguage(activeLanguage.id).id);
    setCefrLevel('ALL');
  }, [activeLanguage.id]);

  // Words from personal bank
  const [myWords, setMyWords] = useState<any[]>([]);
  const [loadingMyWords, setLoadingMyWords] = useState(false);
  const [selectedMyWordIds, setSelectedMyWordIds] = useState<string[]>([]);
  const [myWordsSearch, setMyWordsSearch] = useState('');

  // Personal decks available for sharing/contributing
  const [personalDecks, setPersonalDecks] = useState<any[]>([]);
  const [selectedDeckToShareId, setSelectedDeckToShareId] = useState<string>('');
  const [deckWordsToShare, setDeckWordsToShare] = useState<any[]>([]);
  const [loadingPersonalDecks, setLoadingPersonalDecks] = useState(false);

  // Manual words text
  const [wordsText, setWordsText] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchDecks = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/community/decks', {
        params: {
          search,
          languageId: activeLanguage.id,
          cefrLevel: selectedLevelFilter === 'ALL' ? undefined : selectedLevelFilter,
        },
      });
      let data = res?.success ? (res.data || []) : (Array.isArray(res) ? res : []);
      if (selectedLevelFilter !== 'ALL') {
        data = data.filter((d: any) => !d.cefrLevel || d.cefrLevel === selectedLevelFilter || d.cefrLevel === 'ALL');
      }
      setDecks(data);
    } catch (err) {
      console.error('Failed to load community decks', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyDecks = async () => {
    if (!user) return;
    setLoadingMyDecks(true);
    try {
      const langParam = activeLanguage.id;
      const [remoteRes, localDecks]: any = await Promise.all([
        api.get('/community/my-decks', { params: { languageId: langParam } }).catch(() => ({ data: [] })),
        idbGetLocalDecks(user.id, langParam).catch(() => []),
      ]);
      const remoteList = Array.isArray(remoteRes?.data)
        ? remoteRes.data
        : Array.isArray(remoteRes)
        ? remoteRes
        : [];
      const remoteIds = new Set(remoteList.map((d: any) => d.id));

      // Authoritative DB reconciliation:
      // Kiểm tra kho local: nếu từng là cloud deck hoặc có server ID nhưng DB hiện không còn
      // -> XÓA SẠCH VĨNH VIỄN KHỎI INDEXEDDB
      const staleDeckIdsToDelete: string[] = [];
      const validLocalDecks: any[] = [];

      for (const ld of (localDecks || [])) {
        if (!ld || !ld.id) continue;
        const isServerDeck = Boolean(
          ld.isSyncedToCloud ||
          ld.originDeckId ||
          ld.status === 'PENDING' ||
          ld.status === 'APPROVED' ||
          ld.status === 'REJECTED' ||
          (!ld.id.startsWith('local_') && !ld.id.startsWith('deck_'))
        );

        if (isServerDeck) {
          const cleanServerId = ld.id?.startsWith('cloned_') ? ld.id.replace('cloned_', '') : ld.id;
          const originId = ld.originDeckId;
          const stillExistsOnDb = remoteIds.has(ld.id) || (cleanServerId && remoteIds.has(cleanServerId)) || (originId && remoteIds.has(originId));
          if (!stillExistsOnDb) {
            staleDeckIdsToDelete.push(ld.id);
            if (originId) staleDeckIdsToDelete.push(originId);
            if (cleanServerId) staleDeckIdsToDelete.push(cleanServerId);
            continue;
          }
        }

        if (!remoteIds.has(ld.id)) {
          validLocalDecks.push({
            ...ld,
            isSyncedToCloud: false,
          });
        }
      }

      if (staleDeckIdsToDelete.length > 0) {
        await idbDeleteLocalDecks(staleDeckIdsToDelete).catch(() => {});
      }

      const onlineRemoteDecks = remoteList.map((d: any) => ({
        ...d,
        isSyncedToCloud: true,
      }));

      // Strict canonical deduplication
      const seenCanonical = new Set<string>();
      const deduplicated: any[] = [];
      for (const d of [...onlineRemoteDecks, ...validLocalDecks]) {
        const canonicalKey = d.originDeckId || (d.id?.startsWith('cloned_') ? d.id.replace('cloned_', '') : d.id);
        if (!seenCanonical.has(canonicalKey)) {
          seenCanonical.add(canonicalKey);
          deduplicated.push(d);
        }
      }
      setMyDecks(deduplicated);
    } catch (err) {
      console.error('Failed to load my decks', err);
    } finally {
      setLoadingMyDecks(false);
    }
  };

  const fetchMyWords = async () => {
    setLoadingMyWords(true);
    try {
      const langParam = activeLanguage.id;
      const res: any = await api.get('/words/my-bank', { params: { limit: 100, languageId: langParam } });
      const data = res?.data?.items || res?.data || [];
      setMyWords(data);
      if (selectedMyWordIds.length === 0 && data.length > 0) {
        setSelectedMyWordIds(data.slice(0, 10).map((item: any) => item.id));
      }
    } catch (err) {
      console.error('Failed to load personal words', err);
    } finally {
      setLoadingMyWords(false);
    }
  };

  const [commentModalDeck, setCommentModalDeck] = useState<any | null>(null);

  const executeDeckLike = async (deck: any) => {
    try {
      const res: any = await api.post(`/community/decks/${deck.id}/like`);
      const data = res?.data?.data || res?.data || res;
      if (data) {
        const updateFn = (d: any) =>
          d.id === deck.id
            ? {
                ...d,
                likeCount: data.likeCount ?? d.likeCount,
                dislikeCount: data.dislikeCount ?? d.dislikeCount,
                userLiked: Boolean(data.liked),
                userDisliked: Boolean(data.disliked),
              }
            : d;
        setDecks((prev) => prev.map(updateFn));
        setSelectedDeck((prev: any) => (prev?.id === deck.id ? updateFn(prev) : prev));
      }
    } catch (err: any) {
      console.error('Like deck error', err);
    }
  };

  const handleToggleDeckLike = async (deck: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isGuest || !user) {
      promptLogin('Đăng nhập để thích bộ từ vựng cộng đồng');
      return;
    }
    if (isDeckLocked(deck)) {
      setUnlockModalDeck(deck);
      setPendingAction('like');
      setUnlockInputPassword('');
      setUnlockError(null);
      return;
    }
    await executeDeckLike(deck);
  };

  const executeDeckDislike = async (deck: any) => {
    try {
      const res: any = await api.post(`/community/decks/${deck.id}/dislike`);
      const data = res?.data?.data || res?.data || res;
      if (data) {
        const updateFn = (d: any) =>
          d.id === deck.id
            ? {
                ...d,
                likeCount: data.likeCount ?? d.likeCount,
                dislikeCount: data.dislikeCount ?? d.dislikeCount,
                userLiked: Boolean(data.liked),
                userDisliked: Boolean(data.disliked),
              }
            : d;
        setDecks((prev) => prev.map(updateFn));
        setSelectedDeck((prev: any) => (prev?.id === deck.id ? updateFn(prev) : prev));
      }
    } catch (err: any) {
      console.error('Dislike deck error', err);
    }
  };

  const handleToggleDeckDislike = async (deck: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isGuest || !user) {
      promptLogin('Đăng nhập để đánh giá bộ từ vựng cộng đồng');
      return;
    }
    if (isDeckLocked(deck)) {
      setUnlockModalDeck(deck);
      setPendingAction('dislike');
      setUnlockInputPassword('');
      setUnlockError(null);
      return;
    }
    await executeDeckDislike(deck);
  };

  useEffect(() => {
    fetchDecks();
  }, [search, selectedLevelFilter, activeLanguage.id]);

  useEffect(() => {
    if (user) {
      fetchMyDecks();
    }
  }, [user, mainTab, activeLanguage.id]);

  const isVip = Boolean(
    user &&
      (user.role === 'ADMIN' ||
        user.role === 'SUPER_ADMIN' ||
        user.role === 'PREMIUM_USER' ||
        user.tier === 'PLUS' ||
        user.tier === 'PRO' ||
        user.subscription?.tier === 'PLUS' ||
        user.subscription?.tier === 'PRO')
  );

  const handleSyncCloud = async () => {
    if (isGuest || !user) {
      promptLogin('Đăng nhập để sử dụng tính năng Lưu trữ & Đồng bộ Đám mây');
      return;
    }
    if (!isVip) {
      setShowVipModal(true);
      return;
    }
    setSyncingCloud(true);
    try {
      const localDecks = await idbGetLocalDecks().catch(() => []);
      const res: any = await api.post('/community/sync-cloud', { decks: localDecks });
      setSyncSuccess(res?.message || 'Đồng bộ Đám mây thành công!');
      fetchMyDecks();
      setTimeout(() => setSyncSuccess(null), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Lỗi khi đồng bộ đám mây.');
    } finally {
      setSyncingCloud(false);
    }
  };

  const handleActionOnDeck = async (deck: any, action: 'view' | 'clone' | 'open-bank' | 'export') => {
    if (action === 'view') {
      setSelectedDeck(deck);
      try {
        const res: any = await api.get(`/community/decks/${deck.id}`);
        const fullDeck = res?.data || res?.deck || res;
        if (fullDeck && fullDeck.id === deck.id) {
          setSelectedDeck((prev: any) => (prev?.id === deck.id ? { ...prev, ...fullDeck } : prev));
        }
      } catch (err) {
        console.warn('Could not load complete deck details', err);
      }
      return;
    }

    if (isDeckLocked(deck)) {
      setUnlockModalDeck(deck);
      setPendingAction(action);
      setUnlockInputPassword('');
      setUnlockError(null);
      return;
    }

    if (action === 'open-bank') {
      const myDeckId = myDecks.find((md) => md.originDeckId === deck.id || md.id === deck.id || md.id === `cloned_${deck.id}`)?.id || deck.id;
      if (selectedDeck) setSelectedDeck(null);
      navigate(`/word-bank/${myDeckId}`);
      return;
    }

    if (action === 'clone' || action === 'export') {
      setCloneActionDeck(deck);
    }
  };

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockModalDeck || !unlockInputPassword.trim()) return;
    setUnlocking(true);
    setUnlockError(null);
    try {
      const res: any = await api.post(`/community/decks/${unlockModalDeck.id}/unlock`, {
        password: unlockInputPassword.trim(),
      });
      if (res?.success) {
        const unlockedDeck = res.deck || unlockModalDeck;
        const deckId = unlockModalDeck.id;
        saveSessionUnlockedDeck(deckId);
        if (unlockModalDeck.originDeckId) saveSessionUnlockedDeck(unlockModalDeck.originDeckId);
        saveSessionUnlockedDeck(String(deckId).replace(/^cloned_/, ''));

        setUnlockedDeckIds((prev) => ({
          ...prev,
          [deckId]: true,
          ...(unlockModalDeck.originDeckId ? { [unlockModalDeck.originDeckId]: true } : {}),
          [String(deckId).replace(/^cloned_/, '')]: true,
        }));
        setUnlockedPasswords((prev) => ({ ...prev, [unlockModalDeck.id]: unlockInputPassword.trim() }));
        const action = pendingAction;
        const currentUnlockDeck = unlockModalDeck;
        setUnlockModalDeck(null);
        setPendingAction(null);

        if (selectedDeck?.id === deckId) {
          setSelectedDeck((prev: any) => ({ ...prev, ...unlockedDeck }));
        }

        if (action === 'open-bank') {
          const myDeckId = myDecks.find((md) => md.originDeckId === unlockedDeck.id || md.id === unlockedDeck.id || md.id === `cloned_${unlockedDeck.id}`)?.id || unlockedDeck.id;
          if (selectedDeck) setSelectedDeck(null);
          navigate(`/word-bank/${myDeckId}`);
        } else if (action === 'clone' || action === 'export') {
          setCloneActionDeck(unlockedDeck);
        } else if (action === 'like') {
          executeDeckLike(currentUnlockDeck);
        } else if (action === 'dislike') {
          executeDeckDislike(currentUnlockDeck);
        }
      }
    } catch (err: any) {
      setUnlockError(err?.response?.data?.message || err?.message || 'Mật khẩu kho từ không chính xác!');
    } finally {
      setUnlocking(false);
    }
  };

  const selectPersonalDeck = async (deckId: string, decksList = personalDecks) => {
    setSelectedDeckToShareId(deckId);
    const deck = decksList.find((d) => d.id === deckId);
    if (!deck) return;

    setTitle(deck.title || '');
    setDescription(deck.description || '');
    setCategory(deck.category || 'Business English');
    setCefrLevel(deck.cefrLevel || 'B1');
    setCreateDeckLang(deck.languageId || activeLanguage.id);
    setEnablePassword(Boolean(deck.isProtected || deck.hasPassword));
    setDeckPassword(deck.password || '');

    // Gather words for this deck
    let foundWords: any[] = [];
    if (Array.isArray(deck.words) && deck.words.length > 0) {
      foundWords = deck.words;
    } else {
      try {
        const idbWords = await idbGetWords(user?.id);
        foundWords = idbWords.filter(
          (w: any) => w.deckId === deck.id || w.deckName === deck.title
        );
      } catch (err) {
        console.warn('IDB words query error', err);
      }
    }

    if (foundWords.length === 0 && deck.id && !deck.id.startsWith('local_')) {
      try {
        const res: any = await api.get(`/community/decks/${deck.id}`);
        if (Array.isArray(res?.data?.words || res?.words)) {
          foundWords = res?.data?.words || res?.words;
        }
      } catch {}
    }

    setDeckWordsToShare(foundWords);
  };

  const handleOpenCreateModal = async () => {
    if (isGuest || !user) {
      promptLogin('Đăng nhập để tạo và chia sẻ bộ từ vựng cộng đồng');
      return;
    }
    setShowCreateModal(true);
    setLoadingPersonalDecks(true);
    try {
      const [remoteRes, localDecks]: any = await Promise.all([
        api.get('/community/my-decks').catch(() => ({ data: [] })),
        idbGetLocalDecks(user.id).catch(() => []),
      ]);
      const remoteList = Array.isArray(remoteRes?.data)
        ? remoteRes.data
        : Array.isArray(remoteRes)
        ? remoteRes
        : [];
      const map = new Map<string, any>();
      [...localDecks, ...remoteList].forEach((d: any) => {
        if (d && d.id && !map.has(d.id)) {
          map.set(d.id, d);
        }
      });
      const allDecks = Array.from(map.values());
      setPersonalDecks(allDecks);

      if (allDecks.length > 0) {
        await selectPersonalDeck(allDecks[0].id, allDecks);
      }
    } catch (err) {
      console.error('Failed to load personal decks for modal', err);
    } finally {
      setLoadingPersonalDecks(false);
    }
  };

  const handleToggleWord = (wordId: string) => {
    setSelectedMyWordIds((prev) =>
      prev.includes(wordId) ? prev.filter((id) => id !== wordId) : [...prev, wordId]
    );
  };

  const handleSelectAllMyWords = () => {
    if (selectedMyWordIds.length === filteredMyWords.length) {
      setSelectedMyWordIds([]);
    } else {
      setSelectedMyWordIds(filteredMyWords.map((item) => item.id));
    }
  };

  const [cloneActionDeck, setCloneActionDeck] = useState<any | null>(null);
  const [cloningOnline, setCloningOnline] = useState(false);

  const handleCloneToWordBank = async (deck: any) => {
    if (isGuest || !user) {
      promptLogin('Đăng nhập để sao chép bộ từ vựng vào kho cá nhân');
      return;
    }

    // Rule 1: Owner cannot clone their own deck
    if (deck.userId === user.id || deck.author?.id === user.id) {
      alert('Bạn là tác giả của kho từ này, không cần sao chép lại!');
      return;
    }

    // Rule 2: Already cloned check
    const isAlreadyCloned = myDecks.some(
      (md) => md.originDeckId === deck.id || md.id === deck.id || md.id === `cloned_${deck.id}`
    );
    if (isAlreadyCloned) {
      alert('Kho từ này đã có trong kho từ vựng cá nhân của bạn!');
      return;
    }

    setCloningOnline(true);
    try {
      const password = unlockedPasswords[deck.id];
      const res: any = await api.post(`/community/decks/${deck.id}/clone`, { password });
      if (res?.success) {
        if (res.alreadyCloned) {
          setCloneSuccess(res.message || 'Kho từ này đã có trong kho từ vựng của bạn.');
          fetchDecks();
          fetchMyDecks();
          setCloneActionDeck(null);
          setTimeout(() => setCloneSuccess(null), 4000);
          return;
        }
        // Save copy to IndexedDB so it appears directly in "Kho từ vựng của tôi" with full attribution
        const targetLangId = deck.languageId || activeLanguage.id;
        const localDeckCopy: any = {
          id: `cloned_${deck.id}`,
          userId: user.id,
          languageId: targetLangId,
          title: deck.title,
          description: deck.description || '',
          category: deck.category || 'General',
          cefrLevel: deck.cefrLevel || 'B1',
          words: (deck.words || []).map((w: any) => ({
            id: `cloned_w_${w.id || Math.random().toString(36).substring(2, 9)}`,
            userId: user.id,
            languageId: targetLangId,
            word: w.word,
            phonetic: w.phonetic,
            meaning: w.meaning || w.definition,
            example: w.example,
            partOfSpeech: w.partOfSpeech || 'n.',
            deckId: `cloned_${deck.id}`,
            deckName: deck.title,
            source: 'COMMUNITY',
            author: deck.author?.displayName || 'Cộng đồng',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })),
          source: 'COMMUNITY',
          sourceName: 'Cộng đồng chia sẻ',
          authorName: deck.author?.displayName || 'Cộng đồng',
          authorEmail: deck.author?.email,
          originDeckId: deck.id,
          isImported: true,
          isReadOnly: true,
          isProtected: Boolean(deck.isProtected || deck.hasPassword),
          hasPassword: Boolean(deck.isProtected || deck.hasPassword),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isSyncedToCloud: true,
        };
        await idbSaveLocalDeck(localDeckCopy, user.id);
        if (localDeckCopy.words.length > 0) {
          await idbSaveWords(localDeckCopy.words, user.id);
        }

        setCloneSuccess(`Đã lưu thành công bộ từ "${deck.title}" vào Kho từ vựng cá nhân!`);
        fetchDecks();
        fetchMyDecks();
        setCloneActionDeck(null);
        setTimeout(() => setCloneSuccess(null), 4000);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Không thể clone bộ từ vào kho cá nhân.');
    } finally {
      setCloningOnline(false);
    }
  };

  const handleExportDeckToFile = (deck: any, format: 'xlsx' | 'csv' | 'json') => {
    try {
      const words = deck.words || [];
      const sanitizedTitle = (deck.title || 'bo-tu-vung')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_');

      if (format === 'json') {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(deck, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `${sanitizedTitle}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        setCloneSuccess(`Đã tải file JSON của bộ từ "${deck.title}" về máy thành công!`);
        setCloneActionDeck(null);
        setTimeout(() => setCloneSuccess(null), 4000);
        return;
      }

      // Format tabular data for Excel & CSV
      const rows = words.map((w: any, idx: number) => ({
        STT: idx + 1,
        'Từ vựng (Word)': w.word,
        'Phiên âm (Phonetic)': w.phonetic || '',
        'Ý nghĩa (Meaning)': w.meaning || '',
        'Ví dụ (Example)': w.example || '',
        'Chủ đề (Topic)': deck.category || '',
        'Cấp độ (CEFR)': deck.cefrLevel || '',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [
        { wch: 6 },
        { wch: 20 },
        { wch: 18 },
        { wch: 35 },
        { wch: 45 },
        { wch: 20 },
        { wch: 12 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Vocabulary_Deck');

      if (format === 'csv') {
        XLSX.writeFile(wb, `${sanitizedTitle}.csv`, { bookType: 'csv' });
      } else {
        XLSX.writeFile(wb, `${sanitizedTitle}.xlsx`, { bookType: 'xlsx' });
      }

      setCloneSuccess(`Đã tải file ${format.toUpperCase()} của bộ từ "${deck.title}" về máy tính thành công!`);
      setCloneActionDeck(null);
      setTimeout(() => setCloneSuccess(null), 4000);
    } catch (err: any) {
      alert('Không thể xuất file: ' + (err?.message || 'Đã có lỗi xảy ra.'));
    }
  };

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tên bộ từ.');
      return;
    }

    setCreating(true);

    // 1. Gather words from selected personal deck
    let finalWords = deckWordsToShare
      .map((w: any) => {
        const v = w.vocabulary || w;
        return {
          word: v.word || w.word,
          phonetic: v.phonetic || w.phonetic || '',
          meaning: v.shortDefinition || v.definition || v.meaning || w.meaning || '',
          example: v.examples?.[0]?.sentence || v.example || w.example || '',
          exampleTranslation: v.examples?.[0]?.translation || v.exampleTranslation || w.exampleTranslation || '',
        };
      })
      .filter((w) => Boolean(w.word));

    // 2. Fallback to manually typed words
    if (finalWords.length === 0 && wordsText.trim()) {
      const manualLines = wordsText.split('\n').filter((l) => l.trim().length > 0);
      finalWords = manualLines
        .map((line) => {
          const parts = line.split('|').map((p) => p.trim());
          return {
            word: parts[0] || '',
            phonetic: parts[1] || '',
            meaning: parts[2] || parts[0],
            example: parts[3] || '',
            exampleTranslation: parts[4] || '',
          };
        })
        .filter((w) => w.word.length > 0);
    }

    if (finalWords.length === 0) {
      alert('Kho từ này chưa có từ vựng nào để đóng góp. Vui lòng thêm từ vào kho trước hoặc nhập thủ công.');
      setCreating(false);
      return;
    }

    try {
      const targetLangId = createDeckLang || activeLanguage.id;
      const res: any = await api.post('/community/decks', {
        title: title.trim(),
        description: description.trim(),
        category,
        cefrLevel: mapToCefrEquivalent(cefrLevel) as any,
        languageId: targetLangId,
        isPublic: true,
        password: enablePassword && deckPassword.trim() ? deckPassword.trim() : undefined,
        words: finalWords,
      });

      if (res?.success || res?.id) {
        setShowCreateModal(false);
        setCloneSuccess(`Đã gửi đóng góp bộ từ "${title}" lên cộng đồng thành công!`);
        fetchDecks();
        fetchMyDecks();
        setTimeout(() => setCloneSuccess(null), 4000);
      }
    } catch (err: any) {
      alert('Không thể đóng góp bộ từ: ' + (err?.response?.data?.message || err?.message || 'Đã có lỗi xảy ra.'));
    } finally {
      setCreating(false);
    }
  };


  const filteredMyWords = myWords.filter((item) => {
    const w = (item.vocabulary?.word || '').toLowerCase();
    const m = (item.vocabulary?.shortDefinition || item.vocabulary?.definition || '').toLowerCase();
    const q = myWordsSearch.toLowerCase().trim();
    return !q || w.includes(q) || m.includes(q);
  });

  // Infinite Scroll & Lazy Loading for Public Decks
  const [vaultCategory, setVaultCategory] = useState<'ALL' | 'OFFICIAL' | 'COMMUNITY'>('ALL');

  const filteredCommunityDecks = useMemo(() => {
    return decks.filter((d: any) => {
      if (vaultCategory === 'OFFICIAL' && !d.isOfficial) return false;
      if (vaultCategory === 'COMMUNITY' && d.isOfficial) return false;
      return true;
    });
  }, [decks, vaultCategory]);

  const {
    visibleItems: visibleDecks,
    hasMore: hasMoreDecks,
    isLoadingMore: isLoadingMoreDecks,
    sentinelRef: decksSentinelRef,
  } = useScrollLoad({
    items: filteredCommunityDecks,
    initialBatch: 12,
    batchSize: 12,
    resetDependencies: [search, category, cefrLevel, vaultCategory],
  });

  // Infinite Scroll & Lazy Loading for My Decks
  const {
    visibleItems: visibleMyDecks,
    hasMore: hasMoreMyDecks,
    isLoadingMore: isLoadingMoreMyDecks,
    sentinelRef: myDecksSentinelRef,
  } = useScrollLoad({
    items: myDecks,
    initialBatch: 12,
    batchSize: 12,
  });



  // Infinite Scroll & Lazy Loading for My Words in Creation Modal
  const {
    visibleItems: visibleFilteredMyWords,
    hasMore: hasMoreFilteredMyWords,
    isLoadingMore: isLoadingMoreFilteredMyWords,
    sentinelRef: filteredMyWordsSentinelRef,
  } = useScrollLoad({
    items: filteredMyWords,
    initialBatch: 25,
    batchSize: 25,
    resetDependencies: [myWordsSearch],
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Header with CTA & Sync */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 text-[11px] sm:text-xs font-bold mb-1.5 whitespace-nowrap">
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Kho Tri Thức Mở Cộng Đồng</span>
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-snug">
            Quản Lý & Đóng Góp Bộ Từ Vựng
          </h1>
          <p className="text-[11.5px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-2xl">
            Khám phá kho từ cộng đồng, quản lý kho từ cá nhân IndexedDB và đồng bộ Đám mây bảo mật.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Create Deck Button */}
          <button
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto h-10 px-4 rounded-xl btn-glass-primary text-xs font-bold gap-2 shadow-md cursor-pointer inline-flex items-center justify-center whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Tạo & Đóng góp bộ từ</span>
          </button>
        </div>
      </div>

      {/* Toast notifications */}
      {cloneSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{cloneSuccess}</span>
        </div>
      )}

      {syncSuccess && (
        <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-2 animate-in fade-in">
          <Cloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>{syncSuccess}</span>
        </div>
      )}

      {/* Tabs & Search Navigation Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
        {/* Main Tab Switcher */}
        <div className="tab-pill-container self-start overflow-x-auto max-w-full no-scrollbar shrink-0">
          <button
            onClick={() => setMainTab('community')}
            className={`tab-pill whitespace-nowrap shrink-0 ${mainTab === 'community' ? 'tab-pill-active' : ''}`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Khám phá cộng đồng</span>
            <span className="tab-pill-badge shrink-0">
              {decks.length}
            </span>
          </button>

          <button
            onClick={() => {
              if (isGuest || !user) {
                promptLogin('Đăng nhập để xem danh sách kho từ của bạn');
                return;
              }
              setMainTab('my-decks');
              fetchMyDecks();
            }}
            className={`tab-pill whitespace-nowrap shrink-0 ${mainTab === 'my-decks' ? 'tab-pill-active' : ''}`}
          >
            <Bookmark className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Kho từ của tôi</span>
            {myDecks.length > 0 && (
              <span className="tab-pill-badge shrink-0">
                {myDecks.length}
              </span>
            )}
          </button>
        </div>

        {/* Filter controls: Dynamic Level Select & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
          <div className="w-full sm:w-48 shrink-0">
            <CustomDropdown
              value={selectedLevelFilter}
              onChange={(val) => setSelectedLevelFilter(val)}
              options={[
                { value: 'ALL', label: 'Tất cả trình độ', badge: 'ALL' },
                ...getCertificatesForLanguage(activeLanguage.id).flatMap((cert) =>
                  cert.levels.map((lvl) => ({
                    value: lvl.name,
                    label: `${lvl.name} (${cert.name})`,
                    badge: lvl.badge,
                  }))
                ),
              ]}
              size="sm"
              className="w-full"
            />
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm bộ từ theo chủ đề, tiêu đề..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* TAB 1: COMMUNITY DECKS */}
      {mainTab === 'community' && (
        <>
          {/* Sub-filter Category Switcher */}
          {/* Sub-filter Category Switcher — Horizontal scrollable on mobile, never wrapping buttons */}
          <div className="inline-flex p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex-nowrap overflow-x-auto max-w-full no-scrollbar gap-1">
            <button
              type="button"
              onClick={() => setVaultCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                vaultCategory === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-slate-700/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/40'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
              <span className="whitespace-nowrap">Tất cả kho từ</span>
              <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold transition-colors shrink-0 ${
                vaultCategory === 'ALL'
                  ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                  : 'bg-slate-200/60 text-slate-600 dark:bg-slate-700/60 dark:text-slate-400'
              }`}>
                {decks.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setVaultCategory('OFFICIAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                vaultCategory === 'OFFICIAL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-slate-700/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/40'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="whitespace-nowrap">Kho chính thức</span>
              <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold transition-colors shrink-0 ${
                vaultCategory === 'OFFICIAL'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-slate-200/60 text-slate-600 dark:bg-slate-700/60 dark:text-slate-400'
              }`}>
                {decks.filter((d) => d.isOfficial).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setVaultCategory('COMMUNITY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                vaultCategory === 'COMMUNITY'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-slate-700/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/40'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="whitespace-nowrap">Đóng góp cộng đồng</span>
              <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold transition-colors shrink-0 ${
                vaultCategory === 'COMMUNITY'
                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                  : 'bg-slate-200/60 text-slate-600 dark:bg-slate-700/60 dark:text-slate-400'
              }`}>
                {decks.filter((d) => !d.isOfficial).length}
              </span>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredCommunityDecks.length === 0 ? (
            <div className="text-center py-20 text-slate-400 space-y-3 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 p-8">
              <Layers className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-medium">Chưa tìm thấy bộ từ vựng cộng đồng nào phù hợp.</p>
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">Hãy là người đầu tiên đóng góp bộ từ</span>
                <span className="sm:hidden whitespace-nowrap">Đóng góp bộ từ ngay</span>
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleDecks.map((deck) => {
                const isProtected = deck.hasPassword || deck.isProtected;
                const isUnlocked = unlockedDeckIds[deck.id] || (user && deck.userId === user.id);
                const isMyDeck = Boolean(user && (deck.userId === user.id || deck.author?.id === user.id));
                const isAlreadyCloned = myDecks.some(
                  (md) => md.originDeckId === deck.id || md.id === deck.id || md.id === `cloned_${deck.id}`
                );
                const targetLang = deck.languageId || activeLanguage.id;

                return (
                  <div
                    key={deck.id}
                    onClick={() => handleActionOnDeck(deck, 'view')}
                    className={`p-5 flex flex-col justify-between relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border shadow-xs hover:shadow-md transition duration-150 cv-auto-card cursor-pointer group ${
                      deck.isOfficial
                        ? 'border-amber-400/60 dark:border-amber-500/50 bg-gradient-to-b from-amber-500/[0.05] via-transparent to-transparent hover:border-amber-500 dark:hover:border-amber-400'
                        : 'border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-400 dark:hover:border-indigo-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                          {deck.isOfficial && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-xs shrink-0">
                              <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                              <span>KHO CHÍNH</span>
                            </span>
                          )}
                          <LanguageBadge languageIdOrCode={targetLang} size="xs" />
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 shrink-0">
                            {deck.cefrLevel === 'ALL' ? 'Tất cả' : `CEFR ${deck.cefrLevel}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isMyDeck ? (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                              Của tôi
                            </span>
                          ) : isAlreadyCloned ? (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                              Đã lưu
                            </span>
                          ) : null}
                          {isProtected && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900">
                              {isUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="text-sm sm:text-base font-extrabold leading-snug text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition" title={deck.title}>
                        {deck.title}
                      </h3>

                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1 mb-2">
                        <span className="truncate">Bởi <strong className="font-bold text-slate-700 dark:text-slate-300">{deck.author?.displayName || (isMyDeck ? 'Bạn' : 'Cộng đồng')}</strong></span>
                        <span className="shrink-0 text-[11px] font-semibold">{deck.words?.length || deck._count?.words || 0} từ</span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {deck.description || 'Bộ từ vựng tiếng Anh chuyên sâu.'}
                      </p>

                      {/* Words Preview Chips */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {deck.words?.slice(0, 4).map((w: any) => (
                          <span
                            key={w.id}
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300"
                          >
                            {w.word}
                          </span>
                        ))}
                        {deck._count?.words > 4 && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                            +{deck._count.words - 4} từ nữa
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Community Engagement Stats: Like, Dislike, Comment, Clone */}
                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleToggleDeckLike(deck, e)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                            deck.userLiked
                              ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800'
                              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title="Thích bộ từ này"
                        >
                          <ThumbsUp className="w-3.5 h-3.5 shrink-0" />
                          <span className="whitespace-nowrap">{deck.likeCount || 0}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleToggleDeckDislike(deck, e)}
                          className={`inline-flex items-center gap-1 h-7.5 px-2.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                            deck.userDisliked
                              ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-800'
                              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title="Không thích bộ từ này"
                        >
                          <ThumbsDown className="w-3.5 h-3.5 shrink-0" />
                          <span className="whitespace-nowrap">{deck.dislikeCount || 0}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActionOnDeck(deck, 'view');
                          }}
                          className="inline-flex items-center gap-1 h-7.5 px-2.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer whitespace-nowrap shrink-0"
                          title="Bình luận & Nhận xét"
                        >
                          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                          <span className="whitespace-nowrap">{deck.commentCount || 0}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                        <Copy className="w-3 h-3 shrink-0" />
                        <span className="whitespace-nowrap">{deck.cloneCount || 0}</span>
                      </div>
                    </div>

                    {/* Action buttons row: Strictly h-9, no wrapping clutter */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActionOnDeck(deck, 'open-bank');
                        }}
                        className="h-9 px-3.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 text-xs font-extrabold transition flex-1 min-w-0 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                        title="Vào học bộ từ này"
                      >
                        <BookOpen className="w-3.5 h-3.5 shrink-0" />
                        <span className="whitespace-nowrap">Vào học</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActionOnDeck(deck, 'view');
                        }}
                        className="h-9 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
                        title="Xem bản demo giới thiệu kho từ"
                      >
                        {isProtected && !isUnlocked ? <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" /> : <Eye className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                        <span className="whitespace-nowrap">Chi tiết</span>
                      </button>

                      {/* Secondary Actions Dropdown */}
                      <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                        <CustomDropdown
                          trigger={
                            <button
                              type="button"
                              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer shrink-0"
                              title="Thao tác khác"
                            >
                              <MoreVertical className="w-4 h-4 shrink-0" />
                            </button>
                          }
                          options={[
                            ...(!isMyDeck && !isAlreadyCloned
                              ? [{ value: 'clone', label: 'Lưu về kho của tôi', icon: Copy }]
                              : []),
                            ...(!isMyDeck
                              ? [{ value: 'contact_owner', label: 'Liên hệ chủ kho', icon: MessageSquare }]
                              : []),
                            ...(isProtected && !isUnlocked
                              ? [{ value: 'verify_key', label: 'Mở khóa bằng Access Key', icon: Key }]
                              : []),
                            { value: 'export', label: 'Xuất file (Excel / CSV)', icon: Download },
                            ...(isAdmin || isMyDeck
                              ? [{ value: 'delete_admin', label: isMyDeck ? 'Xóa kho từ' : 'Xóa vĩnh viễn (Admin)', icon: Trash2 }]
                              : []),
                          ]}
                          onSelect={(val) => {
                            if (val === 'clone') handleActionOnDeck(deck, 'clone');
                            else if (val === 'contact_owner') handleContactDeckOwner(deck);
                            else if (val === 'verify_key') setVerifyAccessKeyDeck(deck);
                            else if (val === 'export') handleActionOnDeck(deck, 'export');
                            else if (val === 'delete_admin') handleDeleteDeckAdmin(deck);
                          }}
                          align="right"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Infinite Scroll Sentinel for Public Decks */}
            <div ref={decksSentinelRef} className="w-full py-4 flex flex-col items-center justify-center gap-1">
              {isLoadingMoreDecks ? (
                <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang cuộn tải thêm bộ từ cộng đồng...</span>
                </div>
              ) : hasMoreDecks ? (
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  Đã hiển thị {visibleDecks.length} / {decks.length} bộ từ • Cuộn xuống để xem tiếp
                </span>
              ) : decks.length > 12 ? (
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  ✓ Đã hiển thị toàn bộ {decks.length} bộ từ vựng
                </span>
              ) : null}
            </div>
          </>
        )}
        </>
      )}

      {/* TAB 2: MY DECKS (WITH REAL-TIME STATUS BADGES) */}
      {mainTab === 'my-decks' && (
        <>
          {loadingMyDecks ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : myDecks.length === 0 ? (
            <div className="text-center py-20 text-slate-400 space-y-3 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 p-8">
              <Layers className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                Bạn chưa có kho từ cá nhân nào
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tạo kho từ vựng cá nhân để học offline tức thì trên IndexedDB, hoặc chia sẻ lên cộng đồng để nhận góp ý và kiểm duyệt từ Admin.
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo kho từ ngay</span>
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleMyDecks.map((deck) => {
                const status = deck.status || 'PENDING';
                return (
                  <div
                    key={deck.id}
                    className="p-5 md:p-6 flex flex-col justify-between relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition duration-150 cv-auto-card"
                  >
                    <div>
                      {/* Status Badges Header */}
                      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                        {status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Đã công khai (Approved)</span>
                          </span>
                        )}
                        {status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Đang chờ Admin duyệt (Pending)</span>
                          </span>
                        )}
                        {status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Bị từ chối (Rejected)</span>
                          </span>
                        )}

                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {deck.cefrLevel === 'ALL' ? 'Tất cả' : deck.cefrLevel}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold leading-snug text-slate-900 dark:text-white">
                        {deck.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {deck.description || 'Bộ từ vựng do chính bạn tạo.'}
                      </p>

                      <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px] text-slate-500 dark:text-slate-400">
                        {deck.isSyncedToCloud ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-2xs" title="Kho từ Online (Đã lưu trên Database)">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <Cloud className="w-3.5 h-3.5" />
                            <span>Online (Database)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 shadow-2xs" title="Kho từ Offline (Lưu máy, chưa có trên DB)">
                            <HardDrive className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Offline (Lưu máy)</span>
                          </span>
                        )}
                        {(deck.hasPassword || deck.isProtected) && (
                          <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Có mã bảo vệ</span>
                          </span>
                        )}
                      </div>

                      {/* Words Preview Chips */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {deck.words?.slice(0, 4).map((w: any, idx: number) => (
                          <span
                            key={w.id || idx}
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300"
                          >
                            {w.word}
                          </span>
                        ))}
                        {(deck.words?.length || 0) > 4 && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                            +{deck.words.length - 4} từ nữa
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{deck.words?.length || deck._count?.words || 0} từ</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActionOnDeck(deck, 'open-bank');
                          }}
                          className="h-9 px-3 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <BookOpen className="w-3.5 h-3.5 shrink-0" />
                          <span className="whitespace-nowrap">Vào học</span>
                        </button>
                        <button
                          onClick={() => handleActionOnDeck(deck, 'view')}
                          className="h-9 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition inline-flex items-center justify-center cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <span className="whitespace-nowrap">Chi tiết</span>
                        </button>
                        <button
                          onClick={() => setCloneActionDeck(deck)}
                          className="h-9 px-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                          title="Xuất file"
                        >
                          <Download className="w-3.5 h-3.5 shrink-0" />
                          <span className="hidden sm:inline whitespace-nowrap">Xuất file</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDeckAdmin(deck);
                          }}
                          className="h-9 w-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition inline-flex items-center justify-center cursor-pointer shrink-0"
                          title="Xóa kho từ này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Infinite Scroll Sentinel for My Decks */}
            <div ref={myDecksSentinelRef} className="w-full py-4 flex flex-col items-center justify-center gap-1">
              {isLoadingMoreMyDecks ? (
                <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang cuộn tải thêm bộ từ của bạn...</span>
                </div>
              ) : hasMoreMyDecks ? (
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  Đã hiển thị {visibleMyDecks.length} / {myDecks.length} bộ từ • Cuộn xuống để xem tiếp
                </span>
              ) : myDecks.length > 12 ? (
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  ✓ Đã hiển thị toàn bộ {myDecks.length} bộ từ vựng
                </span>
              ) : null}
            </div>
          </>
        )}
        </>
      )}

      {/* BLOG / POST DETAIL MODAL CHO KHO TỪ VỰNG & BỘ THẺ CỘNG ĐỒNG - COMPACT & STREAMLINED */}
      <ModalPortal isOpen={Boolean(selectedDeck)} onClose={() => setSelectedDeck(null)}>
        {(() => {
          if (!selectedDeck) return null;
          const isMyDeck = Boolean(user && (selectedDeck.userId === user.id || selectedDeck.author?.id === user.id));
          const isAlreadyCloned = myDecks.some(
            (md) => md.originDeckId === selectedDeck.id || md.id === selectedDeck.id || md.id === `cloned_${selectedDeck.id}`
          );
          const authorName = selectedDeck.author?.displayName || (isMyDeck ? 'Bạn (Tác giả)' : 'Cộng đồng chia sẻ');
          const authorAvatar = selectedDeck.author?.avatar;
          const targetLang = selectedDeck.languageId || activeLanguage.id;
          const wordCount = selectedDeck.words?.length || selectedDeck._count?.words || 0;
          const sampleWords = selectedDeck.words || [];

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
              <div
                className="relative max-w-2xl w-full rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[85vh] flex flex-col text-left"
                onClick={(e) => e.stopPropagation()}
              >
                {/* MODAL HERO HEADER: Compact Cover & Metadata */}
                <div className="relative p-4 sm:p-5 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white shrink-0">
                  <button
                    onClick={() => setSelectedDeck(null)}
                    className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition backdrop-blur-sm z-10 text-sm cursor-pointer"
                    aria-label="Đóng modal"
                  >
                    ✕
                  </button>

                  <div className="space-y-2 max-w-xl pr-8">
                    {/* Badges / Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <LanguageBadge languageIdOrCode={targetLang} size="sm" />
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 text-[10px] font-extrabold uppercase">
                        {selectedDeck.category || 'General'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/40 text-[10px] font-extrabold uppercase">
                        CEFR {selectedDeck.cefrLevel || 'ALL'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-[10px] font-extrabold uppercase flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5" />
                        <span>Công khai</span>
                      </span>
                      {isMyDeck ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold uppercase">
                          Kho của tôi
                        </span>
                      ) : isAlreadyCloned ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-extrabold uppercase">
                          Đã lưu kho cá nhân
                        </span>
                      ) : null}
                    </div>

                    {/* Deck Title */}
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug line-clamp-2">
                      {selectedDeck.title}
                    </h2>

                    {/* Author & Publication Timestamp */}
                    <div className="flex items-center gap-2.5 text-xs text-indigo-200/90 pt-0.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-extrabold shrink-0 border border-white/20 overflow-hidden text-xs">
                        {authorAvatar ? (
                          <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
                        ) : (
                          <span>{authorName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex items-center gap-2 text-xs flex-wrap">
                        <span className="font-bold text-white truncate max-w-[140px] sm:max-w-[200px]">{authorName}</span>
                        {isMyDeck && <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/40 text-indigo-200 font-semibold">(Tác giả)</span>}
                        <span className="text-indigo-300/60">•</span>
                        <span className="text-[11px] text-indigo-300/80">
                          {selectedDeck.createdAt ? new Date(selectedDeck.createdAt).toLocaleDateString('vi-VN') : 'Gần đây'}
                        </span>
                        <span className="text-indigo-300/60">•</span>
                        <span className="text-[11px] text-indigo-200 font-bold">{wordCount} từ vựng</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SLIM 4-COLUMN METRICS STRIP */}
                <div className="grid grid-cols-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 px-3 py-2 text-center text-xs shrink-0 divide-x divide-slate-200/60 dark:divide-slate-800/60">
                  <div className="flex flex-col items-center justify-center py-0.5">
                    <span className="text-slate-400 text-[10px] font-semibold flex items-center gap-1">
                      <Eye className="w-3 h-3 text-indigo-500" />
                      <span>Lượt xem</span>
                    </span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 text-xs mt-0.5">
                      {selectedDeck.viewCount || selectedDeck.views || 0}
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center py-0.5">
                    <span className="text-slate-400 text-[10px] font-semibold flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3 text-emerald-500" />
                      <span>Hài lòng</span>
                    </span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">
                      {selectedDeck.likeCount || 0}
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center py-0.5">
                    <span className="text-slate-400 text-[10px] font-semibold flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-blue-500" />
                      <span>Thảo luận</span>
                    </span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 text-xs mt-0.5">
                      {selectedDeck.commentCount || 0}
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center py-0.5">
                    <span className="text-slate-400 text-[10px] font-semibold flex items-center gap-1">
                      <Bookmark className="w-3 h-3 text-amber-500" />
                      <span>Lưu trữ</span>
                    </span>
                    <span className="font-extrabold text-amber-600 dark:text-amber-400 text-xs mt-0.5">
                      {selectedDeck.cloneCount || 0}
                    </span>
                  </div>
                </div>

                {/* SCROLLABLE MAIN CONTENT BODY */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                  {/* Deck Description */}
                  {selectedDeck.description && (
                    <div className="space-y-1">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-indigo-500" />
                        <span>Giới thiệu</span>
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        {selectedDeck.description}
                      </p>
                    </div>
                  )}

                  {/* Sample Words / Cards Preview (Rút gọn tối đa 6 từ để tiết kiệm diện tích) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-indigo-500" />
                        <span>Xem trước từ vựng ({!isDeckLocked(selectedDeck) && sampleWords.length > 0 ? `Hiển thị ${Math.min(6, sampleWords.length)} / ${wordCount} từ` : `${wordCount} từ`})</span>
                      </h4>
                      {!isDeckLocked(selectedDeck) && <span className="text-[10px] text-slate-400">Bấm loa để nghe phát âm</span>}
                    </div>

                    {isDeckLocked(selectedDeck) ? (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-center space-y-2.5">
                        <div className="w-10 h-10 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Kho từ vựng có mật khẩu bảo vệ</h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                            Danh sách từ vựng chi tiết được tác giả bảo vệ. Bạn có thể mở khóa bằng mật khẩu hoặc Access Key.
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                          <button
                            type="button"
                            onClick={() => handleActionOnDeck(selectedDeck, 'open-bank')}
                            className="h-9 px-4 rounded-xl btn-glass-primary text-xs inline-flex items-center gap-1.5 font-bold cursor-pointer"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Nhập mật khẩu</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setVerifyAccessKeyDeck(selectedDeck)}
                            className="h-9 px-4 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-amber-500/25 transition cursor-pointer"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>Dùng Access Key</span>
                          </button>
                        </div>
                      </div>
                    ) : sampleWords.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {sampleWords.slice(0, 6).map((w: any, idx: number) => (
                          <div
                            key={w.id || idx}
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-start justify-between gap-2 text-xs shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800 transition"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-xs text-slate-900 dark:text-white">{w.word}</span>
                                {w.partOfSpeech && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                                    {w.partOfSpeech}
                                  </span>
                                )}
                                {w.phonetic && (
                                  <span className="text-slate-400 font-mono text-[10px]">{w.phonetic}</span>
                                )}
                              </div>
                              <p className="font-semibold text-indigo-600 dark:text-indigo-400 text-[11px] mt-0.5 truncate">
                                {w.meaning}
                              </p>
                              {w.example && (
                                <p className="text-slate-500 dark:text-slate-400 italic text-[10px] mt-0.5 line-clamp-1">
                                  "{w.example}"
                                </p>
                              )}
                            </div>
                            <SpeechButton text={w.word} size="sm" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                        Kho từ đã sẵn sàng. Bấm &quot;Xem kho từ&quot; để vào trang quản lý và xem toàn bộ từ vựng.
                      </div>
                    )}

                    {!isDeckLocked(selectedDeck) && wordCount > 6 && (
                      <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60 flex items-center justify-between gap-2 text-xs">
                        <span className="text-indigo-900 dark:text-indigo-200 text-[11px] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Còn <strong>{wordCount - 6} từ vựng</strong> khác trong kho.</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleActionOnDeck(selectedDeck, 'open-bank')}
                          className="h-8 px-3 rounded-lg btn-glass-primary font-bold whitespace-nowrap inline-flex items-center gap-1 shrink-0 text-xs"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Vào kho từ</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* PRIMARY & SECONDARY ACTION BUTTONS - CLEAN HIERARCHY */}
                  <div className="pt-2 space-y-2">
                    {/* Row 1: Primary Actions */}
                    <div className="flex items-center gap-2">
                      {isDeckLocked(selectedDeck) ? (
                        <button
                          type="button"
                          onClick={() => handleActionOnDeck(selectedDeck, 'open-bank')}
                          className="h-10 px-5 rounded-xl btn-solid-primary text-xs font-bold flex-1 inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <Unlock className="w-4 h-4 shrink-0" />
                          <span className="whitespace-nowrap">MỞ KHÓA & VÀO KHO TỪ</span>
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              const deck = selectedDeck;
                              setSelectedDeck(null);
                              navigate(`/review?deckId=${deck.id}`);
                            }}
                            className="h-10 px-4 rounded-xl btn-solid-primary text-xs font-black flex-1 inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0 shadow-md shadow-indigo-500/20"
                          >
                            <Sparkles className="w-4 h-4 fill-current text-amber-300 shrink-0" />
                            <span className="whitespace-nowrap font-black">Học ngay (SRS)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleActionOnDeck(selectedDeck, 'open-bank')}
                            className="h-10 px-4 rounded-xl btn-glass-secondary text-xs font-bold inline-flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 cursor-pointer whitespace-nowrap shrink-0"
                            title="Vào trang quản lý kho từ này (hỗ trợ nhập mật khẩu nếu có)"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="whitespace-nowrap">Xem kho từ</span>
                          </button>
                        </>
                      )}
                    </div>

                    {/* Row 2: Secondary Utility Actions */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {!isMyDeck && (
                        <button
                          type="button"
                          onClick={() => handleContactDeckOwner(selectedDeck)}
                          className="h-9 px-3 rounded-xl btn-glass-secondary text-xs font-semibold inline-flex items-center justify-center gap-1.5 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-800 cursor-pointer whitespace-nowrap shrink-0"
                          title="Nhắn tin với chủ kho về bộ từ này"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="whitespace-nowrap">Liên hệ chủ kho</span>
                        </button>
                      )}

                      {!isMyDeck && !isAlreadyCloned && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isDeckLocked(selectedDeck)) {
                              setUnlockModalDeck(selectedDeck);
                              setPendingAction('clone');
                              setUnlockInputPassword('');
                              setUnlockError(null);
                              return;
                            }
                            const deck = selectedDeck;
                            setSelectedDeck(null);
                            setCloneActionDeck(deck);
                          }}
                          className="h-9 px-3 rounded-xl btn-glass-secondary text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <Copy className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="whitespace-nowrap">Lưu về kho</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (isDeckLocked(selectedDeck)) {
                            setUnlockModalDeck(selectedDeck);
                            setPendingAction('export');
                            setUnlockInputPassword('');
                            setUnlockError(null);
                            return;
                          }
                          const deck = selectedDeck;
                          setSelectedDeck(null);
                          setCloneActionDeck(deck);
                        }}
                        className="h-9 px-3 rounded-xl btn-glass-secondary text-xs font-semibold inline-flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                        title="Tải file Excel / CSV / JSON"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="whitespace-nowrap">Xuất file</span>
                      </button>

                      {(isAdmin || isMyDeck) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteDeckAdmin(selectedDeck)}
                          className="h-9 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                          title={isAdmin && !isMyDeck ? "Xóa vĩnh viễn kho từ mà không cần thông qua chủ kho" : "Xóa kho từ của bạn"}
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="whitespace-nowrap">{isAdmin && !isMyDeck ? "Xóa vĩnh viễn (Admin)" : "Xóa kho"}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* SOCIAL REACTIONS BAR: 👍 Like | 👎 Dislike | 💬 Comment | ↗ Share - UNIFORM h-8 */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-b border-slate-100 dark:border-slate-800/80 py-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleToggleDeckLike(selectedDeck, e)}
                        className={`h-8 px-2.5 rounded-lg inline-flex items-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                          selectedDeck.userLiked
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{selectedDeck.likeCount || 0}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleToggleDeckDislike(selectedDeck, e)}
                        className={`h-8 px-2.5 rounded-lg inline-flex items-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                          selectedDeck.userDisliked
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>{selectedDeck.dislikeCount || 0}</span>
                      </button>

                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 px-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{selectedDeck.commentCount || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.origin + '/community/decks?deck=' + selectedDeck.id);
                          alert('Đã sao chép liên kết bộ từ vựng vào bộ nhớ tạm!');
                        }}
                        className="h-8 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                        title="Chia sẻ liên kết bộ từ"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Chia sẻ</span>
                      </button>
                    </div>
                  </div>

                  {/* EMBEDDED COMMUNITY COMMENTS DISCUSSION */}
                  <div className="pt-1">
                    <CommunityCommentSection
                      targetType="deck"
                      targetId={selectedDeck.id}
                      isLocked={isDeckLocked(selectedDeck)}
                      onRequireUnlock={() => {
                        setUnlockModalDeck(selectedDeck);
                        setPendingAction(null);
                        setUnlockInputPassword('');
                        setUnlockError(null);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </ModalPortal>

      {/* DUAL CLONE ACTION MODAL: Lưu vào Kho từ vựng vs Tải file về máy tính */}
      <ModalPortal isOpen={Boolean(cloneActionDeck)} onClose={() => setCloneActionDeck(null)}>
        {cloneActionDeck && (
          <div
            className="m-auto relative max-w-lg w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold border border-indigo-200 dark:border-indigo-900 mb-2">
                  <Copy className="w-3 h-3" />
                  <span>Sao chép bộ từ vựng</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                  {cloneActionDeck.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Bộ từ gồm <strong className="text-indigo-600 dark:text-indigo-400">{cloneActionDeck.words?.length || 0} từ</strong> ({cloneActionDeck.category} • CEFR {cloneActionDeck.cefrLevel}). Bạn muốn lưu vào đâu?
                </p>
              </div>
              <button
                onClick={() => setCloneActionDeck(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition shrink-0"
              >
                ✕
              </button>
            </div>

            {/* TWO MAIN OPTIONS */}
            <div className="space-y-3.5">
              {/* Option 1: Save into personal online word bank */}
              <div
                onClick={() => handleCloneToWordBank(cloneActionDeck)}
                className="group p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/70 to-blue-50/50 dark:from-indigo-950/30 dark:to-blue-950/20 hover:border-indigo-400 dark:hover:border-indigo-700 cursor-pointer transition shadow-xs flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition">
                  <Database className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      Lưu vào Kho từ vựng của tôi (Online)
                    </h4>
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 shrink-0">
                      Khuyên dùng
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Tự động đồng bộ toàn bộ từ vào Kho từ vựng của bạn để kích hoạt thuật toán ôn tập thông minh (SRS) & Gia sư AI.
                  </p>
                  <div className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1">
                    <span>{cloningOnline ? 'Đang đồng bộ...' : 'Đồng bộ ngay vào tài khoản'}</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              </div>

              {/* Option 2: Export directly to computer as file */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Tải về máy tính (Offline File)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Xuất toàn bộ từ vựng, phiên âm, định nghĩa và ví dụ thành file lưu trữ trực tiếp trên thiết bị của bạn.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => handleExportDeckToFile(cloneActionDeck, 'xlsx')}
                    className="py-2 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>File Excel (.xlsx)</span>
                  </button>

                  <button
                    onClick={() => handleExportDeckToFile(cloneActionDeck, 'csv')}
                    className="py-2 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>File CSV</span>
                  </button>

                  <button
                    onClick={() => handleExportDeckToFile(cloneActionDeck, 'json')}
                    className="py-2 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-500" />
                    <span>File JSON</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* Create & Share Deck Modal — UnifiedDeckModal with Full Capabilities */}
      <UnifiedDeckModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        mode="create"
        titleText="Đóng Góp Bộ Từ Vựng Lên Cộng Đồng"
        subtitleText="Chọn kho từ vựng cá nhân, tải file Excel/CSV hoặc nhập thủ công để chia sẻ lên kho chung"
        submitButtonText="Đóng Góp Bộ Từ Lên Cộng Đồng"
        personalDecks={personalDecks}
        loadingPersonalDecks={loadingPersonalDecks}
        initialData={{
          languageId: activeLanguage.id,
          category: category || undefined,
          isPublic: true,
        }}
        onSubmit={async (formData) => {
          if (!formData.words || formData.words.length === 0) {
            alert('Kho từ này chưa có từ vựng nào để đóng góp. Vui lòng chọn kho có từ, tải file Excel/CSV hoặc nhập thủ công.');
            return;
          }
          setCreating(true);
          try {
            const targetLangId = formData.languageId || activeLanguage.id;
            const res: any = await api.post('/community/decks', {
              title: formData.title.trim(),
              description: formData.description.trim(),
              category: formData.category,
              cefrLevel: mapToCefrEquivalent(formData.cefrLevel),
              languageId: targetLangId,
              isPublic: true,
              password: formData.hasPassword && formData.password?.trim() ? formData.password.trim() : undefined,
              words: formData.words.map((w) => ({
                word: w.word.trim(),
                phonetic: w.phonetic || '',
                partOfSpeech: w.partOfSpeech || 'noun',
                meaning: w.meaning || '',
                definition: w.meaning || '',
                example: w.example || '',
                exampleTranslation: w.exampleTranslation || '',
                topic: w.topic || formData.category || 'General',
                cefrLevel: mapToCefrEquivalent(w.cefrLevel || formData.cefrLevel),
              })),
            });

            if (res?.success || res?.id) {
              setShowCreateModal(false);
              setCloneSuccess(`Đã gửi đóng góp bộ từ "${formData.title}" lên cộng đồng thành công!`);
              fetchDecks();
              fetchMyDecks();
              setTimeout(() => setCloneSuccess(null), 4000);
            }
          } catch (err) {
            alert('Không thể đóng góp bộ từ: ' + (err?.response?.data?.message || err?.message || 'Đã có lỗi xảy ra.'));
          } finally {
            setCreating(false);
          }
        }}
        loading={creating}
      />

      {/* UNLOCK PROTECTED DECK MODAL */}
      <ModalPortal isOpen={Boolean(unlockModalDeck)} onClose={() => setUnlockModalDeck(null)}>
        {unlockModalDeck && (
          <div
            className="m-auto relative max-w-md w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-5 shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    Mở Khóa Kho Từ
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{unlockModalDeck.title}</p>
                </div>
              </div>
              <button
                onClick={() => setUnlockModalDeck(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Kho từ này được tác giả bảo vệ. Bạn cần nhập mã Access Key riêng được cấp bởi chủ kho để mở khóa.
            </p>

            <form onSubmit={handleUnlockSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  Mã Access Key riêng của bạn
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoFocus
                    value={unlockInputPassword}
                    onChange={(e) => setUnlockInputPassword(e.target.value)}
                    placeholder="VD: VF-VCB-XXXX-XXXXXXXXXXXXXXXX"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showUnlockPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {unlockError && (
                  <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{unlockError}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setUnlockModalDeck(null)}
                  className="btn-glass-secondary text-xs !py-2 !px-4"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={unlocking || !unlockInputPassword.trim()}
                  className="btn-glass-primary text-xs !py-2.5 !px-5 gap-1.5 disabled:opacity-50"
                >
                  {unlocking ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5" />
                  )}
                  <span>{unlocking ? 'Đang mở khóa...' : 'Mở khóa ngay'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </ModalPortal>

      {/* VIP CLOUD UPGRADE MODAL */}
      <ModalPortal isOpen={showVipModal} onClose={() => setShowVipModal(false)}>
        <div
          className="m-auto relative max-w-lg w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6 shadow-2xl animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <button
              onClick={() => setShowVipModal(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
              Lưu Trữ & Đồng Bộ Đám Mây Không Giới Hạn
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Tính năng Lưu trữ & Đồng bộ Đám mây Không giới hạn dành riêng cho gói Trả phí (Plus/Pro). Dữ liệu hiện tại của bạn vẫn được lưu an toàn trên máy (IndexedDB).
            </p>
          </div>

          <div className="space-y-3 p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Đặc quyền gói Plus / Pro:
            </h4>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Đồng bộ tức thì mọi bộ từ vựng giữa PC, Laptop và Điện thoại.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Sao lưu dữ liệu vĩnh viễn, không sợ mất từ khi dọn dẹp trình duyệt.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Tạo và quản lý không giới hạn số lượng bộ từ vựng cá nhân.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>AI Tutor phản xạ chuyên sâu và phát âm Microsoft Neural chân thực.</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={() => {
                setShowVipModal(false);
                window.location.href = '/subscription';
              }}
              className="w-full btn-glass-primary !py-3 text-xs sm:text-sm font-bold gap-2 shadow-lg"
            >
              <Crown className="w-4 h-4 text-amber-300" />
              <span>Nâng Cấp Gói VIP Ngay</span>
            </button>
            <button
              onClick={() => setShowVipModal(false)}
              className="w-full sm:w-auto px-4 py-3 rounded-2xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </ModalPortal>

      {/* VOCABULARY DECK COMMENT MODAL */}
      <ModalPortal isOpen={Boolean(commentModalDeck)} onClose={() => setCommentModalDeck(null)}>
        {commentModalDeck && (
          <div
            className="m-auto relative max-w-2xl w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-5 shadow-2xl animate-fade-in max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                    Bình luận & Đánh giá: {commentModalDeck.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Bởi {commentModalDeck.author?.displayName || 'Cộng đồng'} • {commentModalDeck.words?.length || 0} từ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCommentModalDeck(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-1">
              <CommunityCommentSection
                targetType="deck"
                targetId={commentModalDeck.id}
                initialCount={commentModalDeck.commentCount || 0}
              />
            </div>
          </div>
        )}
      </ModalPortal>

      {/* Community Bank Access Key Management Modal (Owner View) */}
      {accessKeyManageDeck && (
        <AccessKeyManagementModal
          isOpen={Boolean(accessKeyManageDeck)}
          onClose={() => setAccessKeyManageDeck(null)}
          bankType="VOCABULARY"
          bankId={accessKeyManageDeck.id}
          bankTitle={accessKeyManageDeck.title}
          isProtected={Boolean(accessKeyManageDeck.isProtected || accessKeyManageDeck.hasPassword)}
          onOpenChatWithUser={(targetUserId, targetUserName) => {
            window.dispatchEvent(
              new CustomEvent('open_vocabflow_chat', {
                detail: {
                  targetUser: { id: targetUserId, displayName: targetUserName },
                  context: {
                    bankType: 'VOCABULARY',
                    bankId: accessKeyManageDeck.id,
                    bankTitle: accessKeyManageDeck.title,
                    bankOwnerId: accessKeyManageDeck.userId,
                    languageSpaceId: accessKeyManageDeck.languageId || activeLanguage.id,
                  },
                },
              }),
            );
          }}
        />
      )}

      {/* Student Input Access Key Modal (Guest / Student Unlock) */}
      {verifyAccessKeyDeck && (
        <VerifyAccessKeyModal
          isOpen={Boolean(verifyAccessKeyDeck)}
          onClose={() => setVerifyAccessKeyDeck(null)}
          bankType="VOCABULARY"
          bankId={verifyAccessKeyDeck.id}
          bankTitle={verifyAccessKeyDeck.title}
          bankOwnerName={verifyAccessKeyDeck.author?.displayName}
          onSuccess={() => {
            setUnlockedDeckIds((prev) => ({ ...prev, [verifyAccessKeyDeck.id]: true }));
            saveSessionUnlockedDeck(verifyAccessKeyDeck.id);
            alert(`Đã mở khóa thành công kho từ "${verifyAccessKeyDeck.title}"!`);
            if (pendingAction === 'clone' || pendingAction === 'export') {
              setCloneActionDeck(verifyAccessKeyDeck);
            } else {
              handleActionOnDeck(verifyAccessKeyDeck, 'open-bank');
            }
            setPendingAction(null);
          }}
          onContactOwner={() => handleContactDeckOwner(verifyAccessKeyDeck)}
        />
      )}
    </div>
  );
};
