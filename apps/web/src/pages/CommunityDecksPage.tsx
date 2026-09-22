import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useLearningContext } from '../contexts/LearningContext';
import { SUPPORTED_LANGUAGES } from '../config/languages';
import { GlassCard } from '../components/common/GlassCard';
import { SpeechButton } from '../components/common/SpeechButton';
import { ModalPortal } from '../components/common/ModalPortal';
import { CustomDropdown } from '../components/common/CustomDropdown';
import { idbSaveLocalDeck, idbGetLocalDecks, idbSaveWords } from '../lib/idb';
import { useScrollLoad } from '../hooks/useScrollLoad';
import * as XLSX from 'xlsx';
import {
  Users,
  Copy,
  Plus,
  Search,
  BookOpen,
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
} from 'lucide-react';

export const CommunityDecksPage: React.FC = () => {
  const { user, isGuest, promptLogin } = useAuth();
  const { activeLanguage } = useLearningContext();
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState<string>(activeLanguage.id);
  const [mainTab, setMainTab] = useState<'community' | 'my-decks'>('community');
  const [decks, setDecks] = useState<any[]>([]);
  const [myDecks, setMyDecks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMyDecks, setLoadingMyDecks] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<any | null>(null);
  const [cloneSuccess, setCloneSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Sync selected language filter with activeLearningLanguage when changed from header
  useEffect(() => {
    setSelectedLanguageFilter(activeLanguage.id);
  }, [activeLanguage.id]);

  // Password Protection & Unlock State
  const [enablePassword, setEnablePassword] = useState(false);
  const [deckPassword, setDeckPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [unlockedDeckIds, setUnlockedDeckIds] = useState<Record<string, boolean>>({});
  const [unlockedPasswords, setUnlockedPasswords] = useState<Record<string, string>>({});
  const [unlockModalDeck, setUnlockModalDeck] = useState<any | null>(null);
  const [unlockInputPassword, setUnlockInputPassword] = useState('');
  const [showUnlockPassword, setShowUnlockPassword] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'view' | 'clone' | null>(null);

  // VIP Cloud Sync State
  const [showVipModal, setShowVipModal] = useState(false);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  // New deck form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Business English');
  const [cefrLevel, setCefrLevel] = useState('ALL');
  const [createDeckTab, setCreateDeckTab] = useState<'my-words' | 'manual'>('my-words');

  // Words from personal bank
  const [myWords, setMyWords] = useState<any[]>([]);
  const [loadingMyWords, setLoadingMyWords] = useState(false);
  const [selectedMyWordIds, setSelectedMyWordIds] = useState<string[]>([]);
  const [myWordsSearch, setMyWordsSearch] = useState('');

  // Manual words text
  const [wordsText, setWordsText] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchDecks = async () => {
    setLoading(true);
    try {
      const langParam = selectedLanguageFilter === 'ALL' ? undefined : selectedLanguageFilter;
      const res: any = await api.get('/community/decks', {
        params: {
          search,
          languageId: langParam,
        },
      });
      if (res?.success) setDecks(res.data);
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
      const langParam = selectedLanguageFilter === 'ALL' ? undefined : selectedLanguageFilter;
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
      const filteredLocal = (localDecks || []).filter((ld: any) => !remoteIds.has(ld.id));
      setMyDecks([...remoteList, ...filteredLocal]);
    } catch (err) {
      console.error('Failed to load my decks', err);
    } finally {
      setLoadingMyDecks(false);
    }
  };

  const fetchMyWords = async () => {
    setLoadingMyWords(true);
    try {
      const langParam = selectedLanguageFilter === 'ALL' ? undefined : selectedLanguageFilter;
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

  useEffect(() => {
    fetchDecks();
  }, [search, selectedLanguageFilter]);

  useEffect(() => {
    if (user) {
      fetchMyDecks();
    }
  }, [user, mainTab, selectedLanguageFilter]);

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

  const handleActionOnDeck = (deck: any, action: 'view' | 'clone') => {
    const isOwner = user && deck.userId === user.id;
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    const isProtected = deck.isProtected || deck.hasPassword;

    if (isProtected && !isOwner && !isAdmin && !unlockedDeckIds[deck.id]) {
      setUnlockModalDeck(deck);
      setPendingAction(action);
      setUnlockInputPassword('');
      setUnlockError(null);
      return;
    }

    if (action === 'view') {
      setSelectedDeck(deck);
    } else {
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
        setUnlockedDeckIds((prev) => ({ ...prev, [unlockModalDeck.id]: true }));
        setUnlockedPasswords((prev) => ({ ...prev, [unlockModalDeck.id]: unlockInputPassword.trim() }));
        const action = pendingAction;
        setUnlockModalDeck(null);
        setPendingAction(null);
        if (action === 'view') {
          setSelectedDeck(unlockedDeck);
        } else if (action === 'clone') {
          setCloneActionDeck(unlockedDeck);
        }
      }
    } catch (err: any) {
      setUnlockError(err?.response?.data?.message || err?.message || 'Mật khẩu kho từ không chính xác!');
    } finally {
      setUnlocking(false);
    }
  };

  const handleOpenCreateModal = () => {
    if (isGuest || !user) {
      promptLogin('Đăng nhập để tạo và chia sẻ bộ từ vựng cộng đồng');
      return;
    }
    setShowCreateModal(true);
    fetchMyWords();
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
    setCloningOnline(true);
    try {
      const password = unlockedPasswords[deck.id];
      const res: any = await api.post(`/community/decks/${deck.id}/clone`, { password });
      if (res?.success) {
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
    setCreating(true);

    // 1. Gather words selected from personal word bank
    const selectedBankWords = myWords
      .filter((item) => selectedMyWordIds.includes(item.id))
      .map((item) => {
        const v = item.vocabulary;
        return {
          word: v?.word || 'word',
          phonetic: v?.phonetic || '',
          meaning: v?.shortDefinition || v?.definition || v?.word,
          example: v?.examples?.[0]?.sentence || '',
        };
      });

    // 2. Gather words typed manually
    const manualLines = wordsText.split('\n').filter((l) => l.trim().length > 0);
    const manualWords = manualLines
      .map((line) => {
        const parts = line.split('|').map((p) => p.trim());
        return {
          word: parts[0] || '',
          phonetic: parts[1] || '',
          meaning: parts[2] || parts[0],
          example: parts[3] || '',
        };
      })
      .filter((w) => w.word.length > 0);

    // Combine both sources
    const finalWords = [...selectedBankWords, ...manualWords];

    if (finalWords.length === 0) {
      alert('Vui lòng chọn ít nhất 1 từ từ kho cá nhân hoặc nhập thủ công để chia sẻ.');
      setCreating(false);
      return;
    }

    try {
      const targetLangId = selectedLanguageFilter === 'ALL' ? activeLanguage.id : selectedLanguageFilter;
      const res: any = await api.post('/community/decks', {
        title,
        description,
        category,
        cefrLevel,
        languageId: targetLangId,
        isPublic: true,
        password: enablePassword && deckPassword.trim() ? deckPassword.trim() : undefined,
        words: finalWords,
      });

      if (res?.success || res?.id) {
        // Save copy to local IndexedDB
        await idbSaveLocalDeck({
          id: res?.data?.id || res?.id || `local_${Date.now()}`,
          userId: user?.id,
          languageId: targetLangId,
          title,
          description,
          category,
          cefrLevel,
          words: finalWords,
          hasPassword: enablePassword,
          isProtected: enablePassword,
          status: user?.role === 'ADMIN' ? 'APPROVED' : 'PENDING',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isSyncedToCloud: false,
        }, user?.id);

        setShowCreateModal(false);
        setTitle('');
        setDescription('');
        setSelectedMyWordIds([]);
        setWordsText('');
        setDeckPassword('');
        setEnablePassword(false);
        fetchDecks();
        fetchMyDecks();
        setMainTab('my-decks');
        setCloneSuccess(
          `Kho từ "${title}" (${finalWords.length} từ) đã được tạo thành công và đang chờ Admin duyệt!`
        );
        setTimeout(() => setCloneSuccess(null), 6000);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Lỗi khi tạo bộ từ.');
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
  const {
    visibleItems: visibleDecks,
    hasMore: hasMoreDecks,
    isLoadingMore: isLoadingMoreDecks,
    sentinelRef: decksSentinelRef,
  } = useScrollLoad({
    items: decks,
    initialBatch: 12,
    batchSize: 12,
    resetDependencies: [search, category, cefrLevel],
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

  // Infinite Scroll & Lazy Loading for Words in Detail Modal
  const {
    visibleItems: visibleSelectedDeckWords,
    hasMore: hasMoreSelectedDeckWords,
    isLoadingMore: isLoadingMoreSelectedDeckWords,
    sentinelRef: selectedDeckWordsSentinelRef,
  } = useScrollLoad({
    items: selectedDeck?.words || [],
    initialBatch: 20,
    batchSize: 20,
    resetDependencies: [selectedDeck?.id],
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
    <div className="w-full space-y-6 animate-fade-in">
      {/* Header with CTA & Sync */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Kho Tri Thức Mở Cộng Đồng</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
            Quản Lý & Đóng Góp Bộ Từ Vựng
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            Khám phá kho từ cộng đồng, quản lý kho từ cá nhân IndexedDB và đồng bộ Đám mây bảo mật.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* VIP Cloud Sync Button */}
          <button
            onClick={handleSyncCloud}
            disabled={syncingCloud}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-bold text-xs shadow-md hover:opacity-95 transition"
          >
            {syncingCloud ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : isVip ? (
              <CloudUpload className="w-3.5 h-3.5" />
            ) : (
              <Crown className="w-3.5 h-3.5 text-amber-200" />
            )}
            <span>{syncingCloud ? 'Đang đồng bộ...' : isVip ? 'Đồng bộ Cloud' : 'Đồng bộ Cloud (VIP)'}</span>
          </button>

          {/* Create Deck Button */}
          <button
            onClick={handleOpenCreateModal}
            className="btn-glass-primary text-xs !py-2.5 gap-2 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo & Đóng góp bộ từ</span>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Main Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 self-start">
          <button
            onClick={() => setMainTab('community')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              mainTab === 'community'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Khám phá cộng đồng</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
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
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              mainTab === 'my-decks'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Kho từ của tôi</span>
            {myDecks.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold">
                {myDecks.length}
              </span>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm bộ từ theo chủ đề, CEFR..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Multi-Language Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-[11px] font-bold text-slate-400 shrink-0 uppercase tracking-wider flex items-center gap-1">
          <Globe className="w-3.5 h-3.5 text-indigo-500" />
          Ngôn ngữ:
        </span>
        <button
          onClick={() => setSelectedLanguageFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 border ${
            selectedLanguageFilter === 'ALL'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <span>🌐</span>
          <span>Tất cả ngôn ngữ</span>
        </button>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <button
            key={lang.id}
            onClick={() => setSelectedLanguageFilter(lang.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 border ${
              selectedLanguageFilter === lang.id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>{lang.flag}</span>
            <span>{lang.nativeName}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: COMMUNITY DECKS */}
      {mainTab === 'community' && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : decks.length === 0 ? (
            <div className="text-center py-20 text-slate-400 space-y-3 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 p-8">
              <Layers className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-medium">Chưa tìm thấy bộ từ vựng cộng đồng nào phù hợp.</p>
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Hãy là người đầu tiên đóng góp bộ từ</span>
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleDecks.map((deck) => {
                const isProtected = deck.hasPassword || deck.isProtected;
                const isUnlocked = unlockedDeckIds[deck.id] || (user && deck.userId === user.id);
                return (
                  <div
                    key={deck.id}
                    className="p-5 md:p-6 flex flex-col justify-between relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition duration-150 cv-auto-card"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                          {deck.cefrLevel === 'ALL' ? 'Tất cả trình độ' : `CEFR ${deck.cefrLevel}`}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isProtected && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900">
                              {isUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                              <span>{isUnlocked ? 'Đã mở khóa' : 'Có mật khẩu'}</span>
                            </span>
                          )}
                          <span className="text-xs text-slate-400 font-medium">{deck.category}</span>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold leading-snug text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{deck.title}</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {deck.description || 'Bộ từ vựng tiếng Anh chuyên sâu.'}
                      </p>

                      {/* Words Preview Chips */}
                      <div className="mt-3.5 flex flex-wrap gap-1.5">
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

                    <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Copy className="w-3.5 h-3.5" />
                        <span>{deck.cloneCount || 0} lượt clone</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleActionOnDeck(deck, 'view')}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1"
                        >
                          {isProtected && !isUnlocked && <Lock className="w-3 h-3 text-amber-500" />}
                          <span>Xem trước</span>
                        </button>
                        <button
                          onClick={() => handleActionOnDeck(deck, 'clone')}
                          className="btn-glass-primary !shadow-none px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Lưu / Tải về</span>
                        </button>
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
                            <span>✅ Đã công khai (Approved)</span>
                          </span>
                        )}
                        {status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                            <Clock className="w-3.5 h-3.5 animate-spin" />
                            <span>⏳ Đang chờ Admin duyệt (Pending)</span>
                          </span>
                        )}
                        {status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>❌ Bị từ chối (Rejected)</span>
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

                      <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Lưu máy (IndexedDB)</span>
                        </span>
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

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedDeck(deck)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                        >
                          Xem từ
                        </button>
                        <button
                          onClick={() => setCloneActionDeck(deck)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Xuất file</span>
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

      {/* Preview Deck Modal — ModalPortal to document.body */}
      <ModalPortal isOpen={Boolean(selectedDeck)} onClose={() => setSelectedDeck(null)}>
        {selectedDeck && (
          <div
            className="m-auto relative max-w-3xl w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6 shadow-2xl max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {selectedDeck.category} • CEFR {selectedDeck.cefrLevel}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold mt-1 text-slate-900 dark:text-white">{selectedDeck.title}</h3>
              </div>
              <button
                onClick={() => setSelectedDeck(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">{selectedDeck.description}</p>

            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Danh sách từ vựng ({selectedDeck.words?.length || 0} từ)
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {visibleSelectedDeckWords.map((w: any) => (
                  <div
                    key={w.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 text-xs cv-auto-row"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{w.word}</span>
                        {w.phonetic && <span className="tabular-nums text-slate-400">{w.phonetic}</span>}
                      </div>
                      <p className="font-semibold text-indigo-700 dark:text-indigo-300 mt-0.5">{w.meaning}</p>
                      {w.example && <p className="text-slate-500 italic mt-0.5">"{w.example}"</p>}
                    </div>
                    <SpeechButton text={w.word} />
                  </div>
                ))}

                {/* Infinite Scroll Sentinel for Words in Preview */}
                <div ref={selectedDeckWordsSentinelRef} className="py-2 text-center">
                  {isLoadingMoreSelectedDeckWords ? (
                    <span className="text-[11px] text-indigo-500 animate-pulse font-medium">Đang tải thêm từ vựng...</span>
                  ) : hasMoreSelectedDeckWords ? (
                    <span className="text-[11px] text-slate-400">Cuộn để xem thêm từ...</span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => {
                  const deck = selectedDeck;
                  setSelectedDeck(null);
                  setCloneActionDeck(deck);
                }}
                className="btn-glass-primary w-full !py-3 text-xs sm:text-sm gap-2"
              >
                <Copy className="w-4 h-4" />
                <span>Tùy chọn Lưu về Kho hoặc Tải file về máy</span>
              </button>
            </div>
          </div>
        )}
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

      {/* Create & Share Deck Modal — ModalPortal to document.body */}
      <ModalPortal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <div
          className="m-auto relative max-w-4xl w-full rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800/90 p-8 sm:p-10 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Tạo & Đóng Góp Bộ Từ Vựng Cộng Đồng
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Chia sẻ các từ vựng từ kho cá nhân của bạn hoặc nhập thêm từ mới để chia sẻ cùng cộng đồng học viên TOEIC.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-glass-secondary btn-glass-icon text-slate-400 hover:text-slate-700 dark:hover:text-white"
                aria-label="Đóng cửa sổ"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDeck} className="space-y-5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5">
                  Tên bộ từ *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Collocations Dành Cho Viết Email Công Sở"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-sm sm:text-base focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5">
                    Chủ đề
                  </label>
                  <CustomDropdown
                    value={category}
                    onChange={(val) => setCategory(val)}
                    options={[
                      { value: 'Business English', label: 'Business English (Kinh doanh)' },
                      { value: 'Technology', label: 'Technology & AI (Công nghệ)' },
                      { value: 'IELTS Prep', label: 'IELTS Academic (Luyện thi)' },
                      { value: 'Daily Life', label: 'Daily Conversation (Đời sống)' },
                      { value: 'Travel & Hospitality', label: 'Travel & Hospitality (Du lịch)' },
                    ]}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5">
                    Khung CEFR
                  </label>
                  <CustomDropdown
                    value={cefrLevel}
                    onChange={(val) => setCefrLevel(val)}
                    options={[
                      { value: 'ALL', label: 'ALL — Tất cả trình độ', badge: 'ALL' },
                      { value: 'A1', label: 'A1 — Beginner', badge: 'A1' },
                      { value: 'A2', label: 'A2 — Pre-intermediate', badge: 'A2' },
                      { value: 'B1', label: 'B1 — Intermediate', badge: 'B1' },
                      { value: 'B2', label: 'B2 — Upper Intermediate', badge: 'B2' },
                      { value: 'C1', label: 'C1 — Advanced', badge: 'C1' },
                      { value: 'C2', label: 'C2 — Mastery', badge: 'C2' },
                    ]}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                    Lý do đóng góp & Mô tả mục tiêu bộ từ vựng
                  </label>
                  <span className="text-[11px] text-slate-400">
                    (Ít nhất 4-5 dòng để mô tả lộ trình)
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={"Nhập lý do tạo kho và mục tiêu học tập (ví dụ:\n• Lý do đóng góp: Bộ từ thực chiến chắt lọc sau khi thi đạt 850 TOEIC.\n• Đối tượng phù hợp: Học viên đang ở band 500-650 muốn bứt phá từ vựng Part 5, 6, 7.\n• Lộ trình khuyến nghị: Học 15 từ mỗi ngày kết hợp làm mini test...)"}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 text-xs sm:text-sm leading-relaxed resize-y min-h-[130px] placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>

              {/* Password Protection Option */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/50 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enablePassword}
                    onChange={(e) => setEnablePassword(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    Đặt mật khẩu bảo vệ kho từ (Tùy chọn)
                  </span>
                </label>

                {enablePassword && (
                  <div className="space-y-1.5 pl-6 pt-1 animate-fade-in">
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={deckPassword}
                        onChange={(e) => setDeckPassword(e.target.value)}
                        placeholder="Nhập mã bảo vệ (ví dụ: 123456 hoặc SecretPass)..."
                        className="w-full text-xs px-3.5 py-2 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5 leading-relaxed">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>
                        Mật khẩu được mã hóa an toàn (bcrypt). Admin duyệt chất lượng từ vựng nhưng không xem được mật khẩu của bạn.
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* VOCABULARY SELECTION METHOD TABS */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                    Nguồn từ vựng đưa vào bộ đề:
                  </span>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setCreateDeckTab('my-words')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        createDeckTab === 'my-words'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Chọn từ kho cá nhân ({selectedMyWordIds.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateDeckTab('manual')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        createDeckTab === 'manual'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Nhập thêm thủ công</span>
                    </button>
                  </div>
                </div>

                {/* TAB 1: SELECT FROM MY PERSONAL WORDS */}
                {createDeckTab === 'my-words' && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={myWordsSearch}
                          onChange={(e) => setMyWordsSearch(e.target.value)}
                          placeholder="Lọc từ trong kho cá nhân của bạn..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSelectAllMyWords}
                        className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-xs font-semibold text-slate-700 dark:text-slate-300 transition shrink-0"
                      >
                        {selectedMyWordIds.length === filteredMyWords.length
                          ? 'Bỏ chọn tất cả'
                          : `Chọn tất cả (${filteredMyWords.length})`}
                      </button>
                    </div>

                    {loadingMyWords ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        Đang tải kho từ vựng cá nhân...
                      </div>
                    ) : filteredMyWords.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        Chưa có từ vựng nào trong kho cá nhân. Bạn có thể chuyển sang tab "Nhập thêm thủ công" bên cạnh.
                      </div>
                    ) : (
                      <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                        {visibleFilteredMyWords.map((item) => {
                          const isChecked = selectedMyWordIds.includes(item.id);
                          const v = item.vocabulary;
                          return (
                            <div
                              key={item.id}
                              onClick={() => handleToggleWord(item.id)}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition text-xs cv-auto-row ${
                                isChecked
                                  ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500/40 text-indigo-900 dark:text-indigo-200'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/60 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                                )}
                                <span className="font-bold">{v?.word}</span>
                                {v?.phonetic && (
                                  <span className="tabular-nums text-[11px] text-slate-400">{v.phonetic}</span>
                                )}
                                <span className="text-slate-500 dark:text-slate-400 truncate">
                                  {v?.shortDefinition || v?.definition}
                                </span>
                              </div>
                              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                                {v?.cefrLevel || 'B1'}
                              </span>
                            </div>
                          );
                        })}

                        {/* Infinite Scroll Sentinel for My Words selection */}
                        <div ref={filteredMyWordsSentinelRef} className="py-2 text-center">
                          {isLoadingMoreFilteredMyWords ? (
                            <span className="text-[11px] text-indigo-500 animate-pulse font-medium">Đang tải thêm từ...</span>
                          ) : hasMoreFilteredMyWords ? (
                            <span className="text-[11px] text-slate-400">Cuộn để xem tiếp...</span>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: MANUAL TEXT INPUT */}
                {createDeckTab === 'manual' && (
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      Nhập danh sách từ bổ sung (Mỗi dòng 1 từ: Từ | Phiên âm | Nghĩa | Ví dụ)
                    </label>
                    <textarea
                      rows={4}
                      value={wordsText}
                      onChange={(e) => setWordsText(e.target.value)}
                      placeholder="synergy | /ˈsɪnədʒi/ | sự cộng hưởng, hiệp đồng | The team synergy was great."
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 tabular-nums text-xs text-slate-900 dark:text-white"
                    ></textarea>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">
                  Tổng từ sẽ chia sẻ:{' '}
                  <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                    {selectedMyWordIds.length +
                      wordsText.split('\n').filter((l) => l.trim().length > 0).length}{' '}
                    từ
                  </strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-glass-secondary text-xs !py-2 !px-4"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="btn-glass-primary text-xs !py-2.5 !px-5 disabled:opacity-50"
                  >
                    {creating ? 'Đang xuất bản...' : 'Lưu & Đăng Lên Cộng Đồng'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </ModalPortal>

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
              Kho từ này đã được tác giả đặt mật khẩu bảo vệ. Vui lòng nhập đúng mật khẩu để xem chi tiết hoặc sao chép vào kho ôn tập cá nhân.
            </p>

            <form onSubmit={handleUnlockSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  Mật khẩu kho từ
                </label>
                <div className="relative">
                  <input
                    type={showUnlockPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={unlockInputPassword}
                    onChange={(e) => setUnlockInputPassword(e.target.value)}
                    placeholder="Nhập mật khẩu do tác giả chia sẻ..."
                    className="w-full text-xs px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
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
    </div>
  );
};
