import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n';
import { usePageSEO } from '../hooks/usePageSEO';
import {
  idbSaveWords,
  idbGetWords,
  idbDeleteWord,
  idbDeleteWords,
  idbUpdateWord,
  idbToggleFavorite,
  idbGetLocalDecks,
  idbSaveLocalDeck,
  idbUpdateLocalDeck,
  idbDeleteLocalDeck,
  idbDeleteLocalDecks,
  idbSetCache,
  idbGetCache,
  LocalDeck,
} from '../lib/idb';
import { GlassCard } from '../components/common/GlassCard';
import { ModalPortal } from '../components/common/ModalPortal';
import { CustomDropdown } from '../components/common/CustomDropdown';
import {
  Bookmark,
  Plus,
  Sparkles,
  Layers,
  Search,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Heart,
  CloudUpload,
  Crown,
  HardDrive,
  RefreshCw,
  CheckCircle,
  Trash2,
  Edit3,
  Share2,
  Lock,
  Eye,
  ChevronLeft,
  BookOpen,
  FolderKanban,
  RotateCcw,
  Volume2,
  Filter,
  CheckSquare,
  Square,
  Globe,
  SlidersHorizontal,
  Folder,
} from 'lucide-react';
import {
  downloadVocabularyTemplate,
  parseVocabularyFile,
  exportWordsToExcelOrCsv,
  ParsedWordItem,
} from '../utils/excelTemplate';

export const MyWordBankPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isGuest, promptLogin } = useAuth();
  const { locale } = useTranslation();

  // Navigation tab: 'decks' (Kho của tôi) vs 'all_words' (Tất cả từ)
  const [activeTab, setActiveTab] = useState<'decks' | 'all_words'>('decks');

  // Currently opened deck (null = list of all decks; non-null = managing words inside this deck)
  const [selectedDeck, setSelectedDeck] = useState<LocalDeck | null>(null);

  // Dynamic SEO Page Title
  const dynamicTitle = useMemo(() => {
    if (selectedDeck) {
      return locale === 'vi' ? `Kho: ${selectedDeck.title}` : `Deck: ${selectedDeck.title}`;
    }
    if (activeTab === 'all_words') {
      return locale === 'vi' ? 'Tất cả từ vựng' : 'All Words';
    }
    return locale === 'vi' ? 'Kho từ của tôi' : 'My Word Banks';
  }, [activeTab, selectedDeck, locale]);

  usePageSEO({
    title: dynamicTitle,
    description: 'Quản lý kho từ vựng cá nhân, ôn tập thông minh với Spaced Repetition và đồng bộ đám mây.',
    noindex: true, // Private authenticated user area
  });

  // Data states
  const [decks, setDecks] = useState<LocalDeck[]>([]);
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Decks Selection & Search state
  const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>([]);
  const [deckSearch, setDeckSearch] = useState('');
  const [deckCategoryFilter, setDeckCategoryFilter] = useState('ALL');

  // Inside Deck Words Selection & Filter states
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [deckWordSearch, setDeckWordSearch] = useState('');
  const [deckWordTopicFilter, setDeckWordTopicFilter] = useState('ALL');
  const [deckWordStatusFilter, setDeckWordStatusFilter] = useState<'ALL' | 'LEARNING' | 'MASTERED' | 'FAVORITES'>('ALL');
  const [deckWordSort, setDeckWordSort] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest');

  // "Tất cả từ" Tab Filters (2 distinct rows)
  const [allWordStatusFilter, setAllWordStatusFilter] = useState<'ALL' | 'LEARNING' | 'MASTERED' | 'FAVORITES'>('ALL');
  const [allWordTopicFilter, setAllWordTopicFilter] = useState('ALL');
  const [allWordCefrFilter, setAllWordCefrFilter] = useState('ALL');
  const [allWordSearch, setAllWordSearch] = useState('');

  // Lazy loading count for smooth infinite list rendering
  const [displayCount, setDisplayCount] = useState(24);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Favorites state
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('vocabflow_favorites') || '[]');
    } catch {
      return [];
    }
  });

  // Notification banners
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Deck Modals State
  const [showCreateDeckModal, setShowCreateDeckModal] = useState(false);
  const [showEditDeckModal, setShowEditDeckModal] = useState(false);
  const [deckToEdit, setDeckToEdit] = useState<LocalDeck | null>(null);
  const [deckTitleInput, setDeckTitleInput] = useState('');
  const [deckDescInput, setDeckDescInput] = useState('');
  const [deckCatInput, setDeckCatInput] = useState('Business English');
  const [deckCefrInput, setDeckCefrInput] = useState('B1');
  const [deckPasswordInput, setDeckPasswordInput] = useState('');

  // Delete Deck Modal State
  const [deckToDelete, setDeckToDelete] = useState<LocalDeck | null>(null);
  const [showBulkDeleteDecksModal, setShowBulkDeleteDecksModal] = useState(false);
  const [deletingDecks, setDeletingDecks] = useState(false);

  // Word Modals State
  const [showAddWordModal, setShowAddWordModal] = useState(false);
  const [showEditWordModal, setShowEditWordModal] = useState(false);
  const [wordToEdit, setWordToEdit] = useState<any | null>(null);
  const [wordFormWord, setWordFormWord] = useState('');
  const [wordFormPhonetic, setWordFormPhonetic] = useState('');
  const [wordFormPos, setWordFormPos] = useState('noun');
  const [wordFormMeaning, setWordFormMeaning] = useState('');
  const [wordFormExample, setWordFormExample] = useState('');
  const [wordFormExampleTrans, setWordFormExampleTrans] = useState('');
  const [wordFormTopic, setWordFormTopic] = useState('General');
  const [wordFormCefr, setWordFormCefr] = useState('B1');
  const [wordFormTargetDeck, setWordFormTargetDeck] = useState<string>('');

  // Delete Word Modal State
  const [wordToDelete, setWordToDelete] = useState<any | null>(null);
  const [showBulkDeleteWordsModal, setShowBulkDeleteWordsModal] = useState(false);
  const [deletingWords, setDeletingWords] = useState(false);

  // Excel / CSV File Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedWords, setParsedWords] = useState<ParsedWordItem[]>([]);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgressMsg, setImportProgressMsg] = useState<string | null>(null);
  const [importDeckMode, setImportDeckMode] = useState<'existing' | 'new'>('existing');
  const [importTargetDeckName, setImportTargetDeckName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Share Deck Modal
  const [shareModalDeck, setShareModalDeck] = useState<LocalDeck | null>(null);
  const [shareTitle, setShareTitle] = useState('');
  const [shareDescription, setShareDescription] = useState('');
  const [shareCategory, setShareCategory] = useState('Business English');
  const [shareEnablePassword, setShareEnablePassword] = useState(false);
  const [sharePassword, setSharePassword] = useState('');
  const [sharing, setSharing] = useState(false);

  // VIP & Cloud Sync State
  const [showVipModal, setShowVipModal] = useState(false);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [syncingDeckId, setSyncingDeckId] = useState<string | null>(null);
  const [justSynced, setJustSynced] = useState(false);

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

  // =============================================================================
  // DATA LOADING & CACHING (IndexedDB First + Live Cloud Revalidation)
  // =============================================================================

  const loadData = async (forceCloudSync = false) => {
    if (forceCloudSync) {
      setSyncingCloud(true);
    } else {
      setLoading(true);
    }

    // 1. Instant Cache-First Load from IndexedDB (0ms UI latency)
    try {
      const [cachedDecks, cachedWords] = await Promise.all([
        idbGetLocalDecks(),
        idbGetWords(),
      ]);

      if (cachedDecks && cachedDecks.length > 0) {
        setDecks(cachedDecks);
      }
      if (cachedWords && cachedWords.length > 0) {
        setWords(cachedWords);
        if (!forceCloudSync) setLoading(false);
      }
    } catch (err) {
      console.warn('IDB read warning:', err);
    }

    // 2. Background Revalidation from Cloud API
    if (user && !isGuest) {
      try {
        const [cloudDecksRes, cloudWordsRes] = await Promise.allSettled([
          api.get('/community/my-decks'),
          api.get('/community/my-words'),
        ]);

        let updatedDecks: LocalDeck[] = [];
        if (cloudDecksRes.status === 'fulfilled' && Array.isArray(cloudDecksRes.value)) {
          const apiDecks: LocalDeck[] = cloudDecksRes.value.map((d: any) => ({
            id: d.id,
            title: d.title,
            description: d.description,
            category: d.category,
            cefrLevel: d.cefrLevel,
            wordCount: d._count?.words || d.words?.length || 0,
            words: d.words || [],
            isProtected: d.isProtected,
            hasPassword: d.hasPassword,
            status: d.status,
            createdAt: new Date(d.createdAt).getTime(),
            updatedAt: new Date(d.updatedAt || d.createdAt).getTime(),
            isSyncedToCloud: true,
          }));

          // Merge local-only decks with cloud decks
          const localOnly = decks.filter((ld) => !ld.isSyncedToCloud && !apiDecks.some((cd) => cd.id === ld.id));
          updatedDecks = [...apiDecks, ...localOnly];
          setDecks(updatedDecks);

          for (const d of updatedDecks) {
            await idbSaveLocalDeck(d);
          }
        }

        if (cloudWordsRes.status === 'fulfilled' && Array.isArray(cloudWordsRes.value)) {
          const cloudWords = cloudWordsRes.value.map((item: any) => {
            const rawTopic = item.topic || item.vocabulary?.topic || 'General';
            return {
              id: item.id,
              status: item.status || 'NEW',
              isFavorite: Boolean(item.isFavorite),
              word: item.vocabulary?.word || item.word,
              phonetic: item.vocabulary?.phonetic || item.phonetic,
              partOfSpeech: item.vocabulary?.partOfSpeech || item.partOfSpeech || 'noun',
              meaning: item.vocabulary?.shortDefinition || item.vocabulary?.definition || item.meaning,
              definition: item.vocabulary?.definition || item.definition,
              example: item.vocabulary?.examples?.[0]?.sentence || item.example,
              exampleTranslation: item.vocabulary?.examples?.[0]?.translation || item.exampleTranslation,
              cefrLevel: item.vocabulary?.cefrLevel || item.cefrLevel || 'B1',
              topic: rawTopic, // TRUE TOPIC - NEVER DECK NAME
              deckName: item.deckName || undefined,
              deckId: item.deckId || undefined,
              vocabulary: item.vocabulary,
              createdAt: new Date(item.createdAt || Date.now()).getTime(),
            };
          });

          if (cloudWords.length > 0) {
            setWords(cloudWords);
            await idbSaveWords(cloudWords);
          }
        }
      } catch (cloudErr) {
        console.warn('Background cloud revalidation notice (offline-safe):', cloudErr);
      }
    }
 
    if (forceCloudSync) {
      setSyncingCloud(false);
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 3000);
      setActionSuccessMsg('Đã đồng bộ toàn bộ dữ liệu với Đám mây thành công!');
      setTimeout(() => setActionSuccessMsg(null), 3500);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Synchronize Favorite IDs with localStorage
  useEffect(() => {
    localStorage.setItem('vocabflow_favorites', JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  // Auto Infinite Scroll observer for "All Words" tab
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayCount((prev) => prev + 24);
        }
      },
      { threshold: 0.1, rootMargin: '300px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // Instant Native Browser Speech (0ms latency, zero slow-down)
  const handlePlayAudio = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // 2-Way Favorite Toggle (♡ <-> ♥)
  const handleToggleFavorite = async (wordId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const isFav = favoriteIds.includes(wordId);
    const nextFav = !isFav;

    // 1. Optimistic UI update
    setFavoriteIds((prev) => (nextFav ? [...prev, wordId] : prev.filter((id) => id !== wordId)));
    setWords((prev) =>
      prev.map((w) => (w.id === wordId ? { ...w, isFavorite: nextFav } : w))
    );

    // 2. Persist to IndexedDB
    await idbToggleFavorite(wordId);

    // 3. Sync to Cloud API if authenticated
    if (user && !isGuest) {
      try {
        await api.post(`/community/words/${wordId}/favorite`);
      } catch (err) {
        console.warn('Cloud favorite sync notice:', err);
      }
    }
  };

  // =============================================================================
  // KHO CỦA TÔI (MY DECKS) - FULL CRUD OPERATIONS
  // =============================================================================

  // Compute derived word counts & stats per deck
  const deckListWithStats = useMemo(() => {
    return decks.map((deck) => {
      // Find words assigned to this deck
      const deckWords = words.filter(
        (w) => w.deckId === deck.id || (w.deckName && w.deckName === deck.title)
      );
      const wordCount = deckWords.length > 0 ? deckWords.length : deck.wordCount || deck.words?.length || 0;
      const masteredCount = deckWords.filter((w) => w.status === 'MASTERED').length;

      return {
        ...deck,
        computedWordCount: wordCount,
        masteredCount,
        percentMastered: wordCount > 0 ? Math.round((masteredCount / wordCount) * 100) : 0,
        assignedWords: deckWords,
      };
    });
  }, [decks, words]);

  // Filtered decks for Deck Management Tab
  const filteredDecks = useMemo(() => {
    return deckListWithStats.filter((deck) => {
      const q = deckSearch.toLowerCase().trim();
      const matchesSearch = !q || deck.title.toLowerCase().includes(q) || (deck.description || '').toLowerCase().includes(q);
      const matchesCat = deckCategoryFilter === 'ALL' || deck.category === deckCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [deckListWithStats, deckSearch, deckCategoryFilter]);

  // Create Deck
  const handleConfirmCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckTitleInput.trim()) return;

    const newDeckId = `deck_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newDeck: LocalDeck = {
      id: newDeckId,
      title: deckTitleInput.trim(),
      description: deckDescInput.trim() || undefined,
      category: deckCatInput,
      cefrLevel: deckCefrInput,
      wordCount: 0,
      words: [],
      isProtected: Boolean(deckPasswordInput.trim()),
      hasPassword: Boolean(deckPasswordInput.trim()),
      password: deckPasswordInput.trim() || undefined,
      status: 'APPROVED',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isSyncedToCloud: false,
    };

    // 1. Save locally to IndexedDB
    await idbSaveLocalDeck(newDeck);
    setDecks((prev) => [newDeck, ...prev]);

    // 2. Sync to Cloud API if authenticated
    if (user && !isGuest) {
      try {
        const res: any = await api.post('/community/decks', {
          title: newDeck.title,
          description: newDeck.description,
          category: newDeck.category,
          cefrLevel: newDeck.cefrLevel,
          isPublic: true,
          password: newDeck.password,
          words: [],
        });
        if (res?.id) {
          newDeck.id = res.id;
          newDeck.isSyncedToCloud = true;
          await idbSaveLocalDeck(newDeck);
          setDecks((prev) => prev.map((d) => (d.id === newDeckId ? newDeck : d)));
        }
      } catch (err) {
        console.warn('Cloud deck creation notice (saved locally):', err);
      }
    }

    setShowCreateDeckModal(false);
    setDeckTitleInput('');
    setDeckDescInput('');
    setDeckPasswordInput('');
    setActionSuccessMsg(`Đã tạo thành công kho từ vựng "${newDeck.title}"!`);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  // Edit Deck
  const handleOpenEditDeck = (deck: LocalDeck, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeckToEdit(deck);
    setDeckTitleInput(deck.title);
    setDeckDescInput(deck.description || '');
    setDeckCatInput(deck.category || 'Business English');
    setDeckCefrInput(deck.cefrLevel || 'B1');
    setDeckPasswordInput(deck.password || '');
    setShowEditDeckModal(true);
  };

  const handleConfirmEditDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckToEdit || !deckTitleInput.trim()) return;

    const oldTitle = deckToEdit.title;
    const newTitle = deckTitleInput.trim();
    const updates: Partial<LocalDeck> = {
      title: newTitle,
      description: deckDescInput.trim() || undefined,
      category: deckCatInput,
      cefrLevel: deckCefrInput,
      isProtected: Boolean(deckPasswordInput.trim()),
      hasPassword: Boolean(deckPasswordInput.trim()),
      password: deckPasswordInput.trim() || undefined,
      updatedAt: Date.now(),
    };

    // 1. Update deck locally in IndexedDB
    await idbUpdateLocalDeck(deckToEdit.id, updates);
    setDecks((prev) => prev.map((d) => (d.id === deckToEdit.id ? { ...d, ...updates } : d)));

    // Update words assigned to old title
    if (oldTitle !== newTitle) {
      setWords((prev) =>
        prev.map((w) =>
          w.deckId === deckToEdit.id || w.deckName === oldTitle ? { ...w, deckName: newTitle } : w
        )
      );
    }

    if (selectedDeck?.id === deckToEdit.id) {
      setSelectedDeck((prev) => (prev ? { ...prev, ...updates } : null));
    }

    // 2. Sync update to Cloud API
    if (user && !isGuest && deckToEdit.isSyncedToCloud) {
      try {
        await api.patch(`/community/decks/${deckToEdit.id}`, {
          title: updates.title,
          description: updates.description,
          category: updates.category,
          cefrLevel: updates.cefrLevel,
          password: updates.password,
        });
      } catch (err) {
        console.warn('Cloud deck update notice:', err);
      }
    }

    setShowEditDeckModal(false);
    setDeckToEdit(null);
    setActionSuccessMsg(`Đã cập nhật kho từ vựng "${newTitle}" thành công!`);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  // Delete Deck (with clear warning and confirmation)
  const handleConfirmDeleteDeck = async () => {
    if (!deckToDelete) return;
    setDeletingDecks(true);

    try {
      const targetId = deckToDelete.id;
      const targetTitle = deckToDelete.title;

      // 1. Delete deck from IndexedDB
      await idbDeleteLocalDeck(targetId);
      setDecks((prev) => prev.filter((d) => d.id !== targetId));

      // 2. Delete words belonging to this deck from local storage
      const wordsToDelete = words.filter(
        (w) => w.deckId === targetId || (w.deckName && w.deckName === targetTitle)
      );
      if (wordsToDelete.length > 0) {
        await idbDeleteWords(wordsToDelete.map((w) => w.id));
        setWords((prev) =>
          prev.filter((w) => w.deckId !== targetId && w.deckName !== targetTitle)
        );
      }

      // 3. Sync delete to Cloud API
      if (user && !isGuest && deckToDelete.isSyncedToCloud) {
        try {
          await api.delete(`/community/decks/${targetId}`);
        } catch (err) {
          console.warn('Cloud deck deletion notice:', err);
        }
      }

      if (selectedDeck?.id === targetId) {
        setSelectedDeck(null);
      }

      setDeckToDelete(null);
      setActionSuccessMsg(`Đã xóa kho từ vựng "${targetTitle}" cùng toàn bộ từ vựng bên trong!`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err: any) {
      alert('Lỗi khi xóa kho: ' + (err.message || err));
    } finally {
      setDeletingDecks(false);
    }
  };

  // Bulk Delete Decks
  const handleConfirmBulkDeleteDecks = async () => {
    if (selectedDeckIds.length === 0) return;
    setDeletingDecks(true);

    try {
      const count = selectedDeckIds.length;

      // 1. Delete from IndexedDB
      await idbDeleteLocalDecks(selectedDeckIds);
      setDecks((prev) => prev.filter((d) => !selectedDeckIds.includes(d.id)));

      // 2. Delete corresponding words
      const deletedDeckTitles = decks
        .filter((d) => selectedDeckIds.includes(d.id))
        .map((d) => d.title);

      const wordsToDelete = words.filter(
        (w) => selectedDeckIds.includes(w.deckId) || (w.deckName && deletedDeckTitles.includes(w.deckName))
      );
      if (wordsToDelete.length > 0) {
        await idbDeleteWords(wordsToDelete.map((w) => w.id));
        setWords((prev) =>
          prev.filter(
            (w) => !selectedDeckIds.includes(w.deckId) && (!w.deckName || !deletedDeckTitles.includes(w.deckName))
          )
        );
      }

      // 3. Sync to Cloud API
      if (user && !isGuest) {
        try {
          await api.post('/community/decks/bulk-delete', { ids: selectedDeckIds });
        } catch (err) {
          console.warn('Cloud bulk deck delete notice:', err);
        }
      }

      if (selectedDeck && selectedDeckIds.includes(selectedDeck.id)) {
        setSelectedDeck(null);
      }

      setSelectedDeckIds([]);
      setShowBulkDeleteDecksModal(false);
      setActionSuccessMsg(`Đã xóa thành công ${count} kho từ vựng đã chọn!`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err: any) {
      alert('Lỗi khi xóa nhiều kho: ' + (err.message || err));
    } finally {
      setDeletingDecks(false);
    }
  };

  // Upload / Sync Deck to Cloud
  const handleUploadDeckToCloud = async (deck: LocalDeck, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isGuest || !user) {
      promptLogin('Đăng nhập để lưu trữ & đồng bộ kho từ vựng lên Đám mây');
      return;
    }

    setSyncingDeckId(deck.id);
    try {
      const deckWords = words.filter(
        (w) => w.deckId === deck.id || (w.deckName && w.deckName === deck.title)
      );

      const payloadWords = deckWords.map((w) => ({
        word: w.word,
        phonetic: w.phonetic,
        partOfSpeech: w.partOfSpeech,
        meaning: w.meaning,
        example: w.example,
        exampleTranslation: w.exampleTranslation,
        topic: w.topic || 'General', // TRUE TOPIC
        cefrLevel: w.cefrLevel || 'B1',
      }));

      let cloudId = deck.id;
      if (deck.isSyncedToCloud) {
        // Deck already in cloud -> update metadata & add any new words
        await api.patch(`/community/decks/${deck.id}`, {
          title: deck.title,
          description: deck.description,
          category: deck.category,
          cefrLevel: deck.cefrLevel,
          password: deck.password,
        });
      } else {
        // Create new cloud deck
        const res: any = await api.post('/community/decks', {
          title: deck.title,
          description: deck.description,
          category: deck.category,
          cefrLevel: deck.cefrLevel,
          isPublic: true,
          password: deck.password,
          words: payloadWords,
        });
        cloudId = res?.id || deck.id;
      }

      const updatedDeck = { ...deck, id: cloudId, isSyncedToCloud: true, updatedAt: Date.now() };
      await idbSaveLocalDeck(updatedDeck);
      setDecks((prev) => prev.map((d) => (d.id === deck.id ? updatedDeck : d)));
      if (selectedDeck?.id === deck.id) {
        setSelectedDeck(updatedDeck);
      }

      setActionSuccessMsg(`Đã đồng bộ thành công kho "${deck.title}" lên Đám mây!`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err: any) {
      alert('Lỗi khi đồng bộ đám mây: ' + (err.response?.data?.message || err.message));
    } finally {
      setSyncingDeckId(null);
    }
  };

  // Share Deck to Community
  const handleOpenShareDeck = (deck: LocalDeck, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isGuest || !user) {
      promptLogin('Đăng nhập để chia sẻ kho từ vựng lên Cộng đồng');
      return;
    }
    setShareModalDeck(deck);
    setShareTitle(deck.title);
    setShareDescription(deck.description || `Kho từ vựng ${deck.title} chọn lọc.`);
    setShareCategory(deck.category || 'Business English');
    setShareEnablePassword(deck.hasPassword || false);
    setSharePassword(deck.password || '');
  };

  const handleConfirmShareDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareModalDeck || !shareTitle.trim() || sharing) return;

    setSharing(true);
    try {
      const deckWords = words.filter(
        (w) => w.deckId === shareModalDeck.id || (w.deckName && w.deckName === shareModalDeck.title)
      );

      await api.post('/community/decks', {
        title: shareTitle.trim(),
        description: shareDescription.trim(),
        category: shareCategory,
        isPublic: true,
        password: shareEnablePassword ? sharePassword.trim() : undefined,
        words: deckWords.map((w) => ({
          word: w.word,
          phonetic: w.phonetic,
          partOfSpeech: w.partOfSpeech,
          meaning: w.meaning,
          example: w.example,
          topic: w.topic || 'General',
          cefrLevel: w.cefrLevel || 'B1',
        })),
      });

      setActionSuccessMsg('Đã xuất bản kho từ vựng lên Cộng đồng thành công!');
      setTimeout(() => {
        setActionSuccessMsg(null);
        setShareModalDeck(null);
      }, 2500);
    } catch (err: any) {
      alert('Lỗi chia sẻ: ' + (err.response?.data?.message || err.message));
    } finally {
      setSharing(false);
    }
  };

  // =============================================================================
  // WORDS INSIDE A DECK - FULL CRUD OPERATIONS
  // =============================================================================

  // Words inside currently opened deck
  const wordsInSelectedDeck = useMemo(() => {
    if (!selectedDeck) return [];
    return words.filter(
      (w) => w.deckId === selectedDeck.id || (w.deckName && w.deckName === selectedDeck.title)
    );
  }, [words, selectedDeck]);

  // Unique topics inside opened deck
  const subTopicsInSelectedDeck = useMemo(() => {
    const set = new Set<string>();
    wordsInSelectedDeck.forEach((w) => {
      const t = (w.topic || w.vocabulary?.topic || 'General').trim();
      if (t) set.add(t);
    });
    return Array.from(set);
  }, [wordsInSelectedDeck]);

  // Filtered and Sorted words inside opened deck
  const filteredWordsInDeck = useMemo(() => {
    return wordsInSelectedDeck.filter((item) => {
      const q = deckWordSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.word || '').toLowerCase().includes(q) ||
        (item.meaning || '').toLowerCase().includes(q) ||
        (item.phonetic || '').toLowerCase().includes(q);

      const itemTopic = item.topic || item.vocabulary?.topic || 'General';
      const matchesTopic = deckWordTopicFilter === 'ALL' || itemTopic === deckWordTopicFilter;

      const isFav = favoriteIds.includes(item.id) || item.isFavorite;
      const matchesStatus =
        deckWordStatusFilter === 'ALL' ||
        (deckWordStatusFilter === 'FAVORITES' && isFav) ||
        (deckWordStatusFilter === 'LEARNING' && (item.status === 'LEARNING' || item.status === 'NEW' || !item.status)) ||
        (deckWordStatusFilter === 'MASTERED' && item.status === 'MASTERED');

      return matchesSearch && matchesTopic && matchesStatus;
    }).sort((a, b) => {
      if (deckWordSort === 'az') return (a.word || '').localeCompare(b.word || '');
      if (deckWordSort === 'za') return (b.word || '').localeCompare(a.word || '');
      if (deckWordSort === 'oldest') return (a.createdAt || 0) - (b.createdAt || 0);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [wordsInSelectedDeck, deckWordSearch, deckWordTopicFilter, deckWordStatusFilter, deckWordSort, favoriteIds]);

  // Add Word to Deck
  const handleOpenAddWord = () => {
    setWordFormWord('');
    setWordFormPhonetic('');
    setWordFormPos('noun');
    setWordFormMeaning('');
    setWordFormExample('');
    setWordFormExampleTrans('');
    setWordFormTopic(subTopicsInSelectedDeck[0] || 'General');
    setWordFormCefr('B1');
    setWordFormTargetDeck(selectedDeck?.title || decks[0]?.title || 'General');
    setShowAddWordModal(true);
  };

  const handleConfirmAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordFormWord.trim() || !wordFormMeaning.trim()) return;

    const cleanW = wordFormWord.trim().toLowerCase();
    const cleanM = wordFormMeaning.trim();
    const realTopic = wordFormTopic.trim() || 'General';
    const targetDeckName = wordFormTargetDeck || selectedDeck?.title || 'General';
    const targetDeckObj = decks.find((d) => d.title === targetDeckName) || selectedDeck;

    const id = `word_${cleanW.replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
    const newWordItem = {
      id,
      word: cleanW,
      phonetic: wordFormPhonetic.trim(),
      partOfSpeech: wordFormPos,
      meaning: cleanM,
      example: wordFormExample.trim(),
      exampleTranslation: wordFormExampleTrans.trim(),
      topic: realTopic, // TRUE TOPIC - NEVER DECK NAME
      cefrLevel: wordFormCefr,
      deckId: targetDeckObj?.id || undefined,
      deckName: targetDeckName,
      status: 'NEW',
      isFavorite: false,
      vocabulary: {
        id,
        word: cleanW,
        phonetic: wordFormPhonetic.trim(),
        partOfSpeech: wordFormPos,
        shortDefinition: cleanM,
        definition: cleanM,
        topic: realTopic,
        cefrLevel: wordFormCefr,
        meanings: [{ meaning: cleanM }],
        examples: wordFormExample ? [{ sentence: wordFormExample, translation: wordFormExampleTrans }] : [],
      },
      createdAt: Date.now(),
    };

    // 1. Save locally to IndexedDB
    await idbSaveWords([newWordItem]);
    setWords((prev) => [newWordItem, ...prev]);

    // 2. Sync to Cloud API if authenticated
    if (user && !isGuest) {
      try {
        await api.post('/community/words/quick-add', {
          word: cleanW,
          phonetic: newWordItem.phonetic,
          partOfSpeech: newWordItem.partOfSpeech,
          meaning: cleanM,
          example: newWordItem.example,
          exampleTranslation: newWordItem.exampleTranslation,
          topic: realTopic,
          cefrLevel: wordFormCefr,
        });
      } catch (err) {
        console.warn('Cloud word quick add notice:', err);
      }
    }

    setShowAddWordModal(false);
    setActionSuccessMsg(`Đã thêm từ vựng "${cleanW}" vào kho thành công!`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  // Edit Word
  const handleOpenEditWord = (wordItem: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWordToEdit(wordItem);
    setWordFormWord(wordItem.word || '');
    setWordFormPhonetic(wordItem.phonetic || '');
    setWordFormPos(wordItem.partOfSpeech || 'noun');
    setWordFormMeaning(wordItem.meaning || '');
    setWordFormExample(wordItem.example || '');
    setWordFormExampleTrans(wordItem.exampleTranslation || '');
    setWordFormTopic(wordItem.topic || wordItem.vocabulary?.topic || 'General');
    setWordFormCefr(wordItem.cefrLevel || wordItem.vocabulary?.cefrLevel || 'B1');
    setWordFormTargetDeck(wordItem.deckName || selectedDeck?.title || '');
    setShowEditWordModal(true);
  };

  const handleConfirmEditWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordToEdit || !wordFormWord.trim() || !wordFormMeaning.trim()) return;

    const cleanW = wordFormWord.trim().toLowerCase();
    const cleanM = wordFormMeaning.trim();
    const realTopic = wordFormTopic.trim() || 'General';

    const updates = {
      word: cleanW,
      phonetic: wordFormPhonetic.trim(),
      partOfSpeech: wordFormPos,
      meaning: cleanM,
      example: wordFormExample.trim(),
      exampleTranslation: wordFormExampleTrans.trim(),
      topic: realTopic, // TRUE TOPIC
      cefrLevel: wordFormCefr,
      deckName: wordFormTargetDeck || wordToEdit.deckName,
    };

    // 1. Update in IndexedDB
    await idbUpdateWord(wordToEdit.id, updates);
    setWords((prev) =>
      prev.map((w) => (w.id === wordToEdit.id ? { ...w, ...updates } : w))
    );

    // 2. Sync to Cloud API if authenticated
    if (user && !isGuest && wordToEdit.deckId) {
      try {
        await api.patch(`/community/decks/${wordToEdit.deckId}/words/${wordToEdit.id}`, updates);
      } catch (err) {
        console.warn('Cloud word edit notice:', err);
      }
    }

    setShowEditWordModal(false);
    setWordToEdit(null);
    setActionSuccessMsg(`Đã cập nhật từ vựng "${cleanW}" thành công!`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  // Delete Single Word
  const handleConfirmDeleteWord = async () => {
    if (!wordToDelete) return;
    setDeletingWords(true);

    try {
      const targetId = wordToDelete.id;
      const targetWord = wordToDelete.word;

      // 1. Delete from IndexedDB
      await idbDeleteWord(targetId);
      setWords((prev) => prev.filter((w) => w.id !== targetId));

      // 2. Sync to Cloud API
      if (user && !isGuest) {
        try {
          if (wordToDelete.deckId) {
            await api.delete(`/community/decks/${wordToDelete.deckId}/words/${targetId}`);
          } else {
            await api.delete(`/community/words/${targetId}`);
          }
        } catch (err) {
          console.warn('Cloud word deletion notice:', err);
        }
      }

      setWordToDelete(null);
      setActionSuccessMsg(`Đã xóa từ "${targetWord}" thành công!`);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err: any) {
      alert('Lỗi khi xóa từ: ' + (err.message || err));
    } finally {
      setDeletingWords(false);
    }
  };

  // Bulk Delete Words inside Deck
  const handleConfirmBulkDeleteWords = async () => {
    if (selectedWordIds.length === 0) return;
    setDeletingWords(true);

    try {
      const count = selectedWordIds.length;

      // 1. Delete from IndexedDB
      await idbDeleteWords(selectedWordIds);
      setWords((prev) => prev.filter((w) => !selectedWordIds.includes(w.id)));

      // 2. Sync to Cloud API
      if (user && !isGuest) {
        try {
          if (selectedDeck?.id) {
            await api.post(`/community/decks/${selectedDeck.id}/words/bulk-delete`, {
              ids: selectedWordIds,
            });
          } else {
            await api.post('/community/words/bulk-delete', { ids: selectedWordIds });
          }
        } catch (err) {
          console.warn('Cloud bulk delete words notice:', err);
        }
      }

      setSelectedWordIds([]);
      setShowBulkDeleteWordsModal(false);
      setActionSuccessMsg(`Đã xóa thành công ${count} từ vựng đã chọn!`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err: any) {
      alert('Lỗi khi xóa nhiều từ: ' + (err.message || err));
    } finally {
      setDeletingWords(false);
    }
  };

  // =============================================================================
  // EXCEL / CSV BATCH IMPORT WITH TOPIC PRESERVATION
  // =============================================================================

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsParsing(true);
    setParsingError(null);

    try {
      const items = await parseVocabularyFile(file);
      setParsedWords(items);
    } catch (err: any) {
      setParsingError(err.message || 'Lỗi khi đọc file Excel/CSV. Vui lòng kiểm tra định dạng.');
      setParsedWords([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmBatchImport = async () => {
    const validWords = parsedWords.filter((w) => w.word && w.word.trim() && w.meaning && w.meaning.trim());
    if (validWords.length === 0 || isImporting) {
      setParsingError('Vui lòng điền đủ Từ tiếng Anh và Nghĩa tiếng Việt cho ít nhất 1 dòng từ vựng.');
      return;
    }

    setIsImporting(true);
    setParsingError(null);

    const targetDeckTitle =
      importDeckMode === 'new'
        ? importTargetDeckName.trim() || 'Custom Word Deck'
        : selectedDeck?.title || importTargetDeckName || decks[0]?.title || 'General';

    // Check or create deck for imported words
    let deckObj = decks.find((d) => d.title === targetDeckTitle);
    if (!deckObj) {
      const newDeckId = `deck_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      deckObj = {
        id: newDeckId,
        title: targetDeckTitle,
        category: 'Business English',
        cefrLevel: 'B1',
        wordCount: validWords.length,
        status: 'APPROVED',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isSyncedToCloud: false,
      };
      await idbSaveLocalDeck(deckObj);
      setDecks((prev) => [deckObj!, ...prev]);
    }

    try {
      const itemsToSave = validWords.map((item, idx) => {
        const cleanW = item.word.trim().toLowerCase();
        const cleanM = item.meaning.trim();
        // CRITICAL FIX: Real topic from CSV is preserved! NEVER OVERWRITE WITH DECK NAME!
        const realTopic = item.topic?.trim() || 'General';
        const id = `word_${cleanW.replace(/[^a-z0-9]/g, '_')}_${Date.now()}_${idx}`;

        return {
          id,
          word: cleanW,
          phonetic: item.phonetic || '',
          partOfSpeech: item.partOfSpeech || 'noun',
          meaning: cleanM,
          example: item.example || '',
          exampleTranslation: item.exampleTranslation || '',
          topic: realTopic, // REAL TOPIC FROM CSV
          cefrLevel: item.cefrLevel || 'B1',
          deckId: deckObj?.id,
          deckName: targetDeckTitle,
          status: 'NEW',
          isFavorite: false,
          vocabulary: {
            id,
            word: cleanW,
            phonetic: item.phonetic || '',
            partOfSpeech: item.partOfSpeech || 'noun',
            shortDefinition: cleanM,
            definition: cleanM,
            topic: realTopic,
            cefrLevel: item.cefrLevel || 'B1',
            meanings: [{ meaning: cleanM }],
            examples: item.example ? [{ sentence: item.example, translation: item.exampleTranslation || '' }] : [],
          },
          createdAt: Date.now(),
        };
      });

      // 1. Immediately save to IndexedDB
      await idbSaveWords(itemsToSave);

      // 2. Reflect in state
      setWords((prev) => {
        const existingKeys = new Set(prev.map((w) => (w.word || '').toLowerCase()));
        const unique = itemsToSave.filter((w) => !existingKeys.has(w.word.toLowerCase()));
        return [...unique, ...prev];
      });

      // 3. Background sync to Cloud if user is authenticated
      if (user && !isGuest) {
        const payload = validWords.map((item) => ({
          word: item.word.trim().toLowerCase(),
          phonetic: item.phonetic || '',
          partOfSpeech: item.partOfSpeech || 'noun',
          meaning: item.meaning.trim(),
          example: item.example || '',
          exampleTranslation: item.exampleTranslation || '',
          topic: item.topic?.trim() || 'General', // REAL TOPIC
          cefrLevel: item.cefrLevel || 'B1',
        }));

        const CHUNK_SIZE = 50;
        for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
          const chunk = payload.slice(i, i + CHUNK_SIZE);
          setImportProgressMsg(`Đang nạp lên đám mây (${Math.min(i + CHUNK_SIZE, payload.length)}/${payload.length} từ)...`);
          try {
            await api.post('/community/words/batch-add', { words: chunk });
          } catch (netErr) {
            console.warn('Batch import cloud notice (safely saved in IndexedDB):', netErr);
          }
        }
      }

      setImportProgressMsg(null);
      setShowImportModal(false);
      setSelectedFile(null);
      setParsedWords([]);
      setActionSuccessMsg(`Đã nạp thành công ${validWords.length} từ vựng vào kho "${targetDeckTitle}"!`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err: any) {
      setImportProgressMsg(null);
      setParsingError('Lỗi khi nạp từ vựng: ' + (err.message || err));
    } finally {
      setIsImporting(false);
    }
  };

  // =============================================================================
  // "TẤT CẢ TỪ" (ALL WORDS) - 2-ROW FILTER & REAL TOPIC DATA
  // =============================================================================

  // Unique real topics across all words
  const allAvailableTopics = useMemo(() => {
    const set = new Set<string>();
    words.forEach((w) => {
      const t = (w.topic || w.vocabulary?.topic || '').trim();
      if (t && t !== 'General') set.add(t);
    });
    return ['General', ...Array.from(set).sort()];
  }, [words]);

  // Filtered words for "Tất cả từ" Tab
  const allFilteredWords = useMemo(() => {
    return words.filter((item) => {
      const q = allWordSearch.toLowerCase().trim();
      const w = (item.word || item.vocabulary?.word || '').toLowerCase();
      const m = (item.meaning || item.vocabulary?.shortDefinition || '').toLowerCase();
      const matchesSearch = !q || w.includes(q) || m.includes(q);

      const itemTopic = item.topic || item.vocabulary?.topic || 'General';
      const matchesTopic = allWordTopicFilter === 'ALL' || itemTopic === allWordTopicFilter;

      const itemCefr = (item.cefrLevel || item.vocabulary?.cefrLevel || 'B1').toUpperCase();
      const matchesCefr = allWordCefrFilter === 'ALL' || itemCefr === allWordCefrFilter;

      const isFav = favoriteIds.includes(item.id) || item.isFavorite;
      const matchesStatus =
        allWordStatusFilter === 'ALL' ||
        (allWordStatusFilter === 'FAVORITES' && isFav) ||
        (allWordStatusFilter === 'LEARNING' && (item.status === 'LEARNING' || item.status === 'NEW' || !item.status)) ||
        (allWordStatusFilter === 'MASTERED' && item.status === 'MASTERED');

      return matchesSearch && matchesTopic && matchesCefr && matchesStatus;
    });
  }, [words, allWordSearch, allWordTopicFilter, allWordCefrFilter, allWordStatusFilter, favoriteIds]);

  const visibleAllWords = useMemo(() => {
    return allFilteredWords.slice(0, displayCount);
  }, [allFilteredWords, displayCount]);

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="w-full space-y-6 animate-fade-in pb-16">
      {/* Top Header & Context Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {selectedDeck ? (
              <button
                onClick={() => {
                  setSelectedDeck(null);
                  setSelectedWordIds([]);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 transition border border-indigo-200 dark:border-indigo-800"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>← Quay lại danh sách kho</span>
              </button>
            ) : (
              <>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider border border-indigo-500/20">
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Personal Word Bank</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold border border-slate-200 dark:border-slate-700">
                  <HardDrive className="w-3 h-3 text-indigo-500" />
                  <span>IndexedDB Cache</span>
                </div>
              </>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-snug">
            {selectedDeck
              ? `Kho: ${selectedDeck.title}`
              : activeTab === 'decks'
              ? 'Kho Từ Vựng Của Tôi'
              : 'Tất Cả Từ Vựng'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            {selectedDeck
              ? `Quản lý chi tiết ${wordsInSelectedDeck.length} từ vựng thuộc kho "${selectedDeck.title}".`
              : activeTab === 'decks'
              ? `Quản lý tổng cộng ${decks.length} kho từ vựng cá nhân, đồng bộ đám mây và chia sẻ cộng đồng.`
              : `Hiển thị danh sách đầy đủ ${allFilteredWords.length} từ vựng trên toàn hệ thống.`}
          </p>
        </div>

        {/* Action Buttons Top Toolbar */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Cloud Sync Button - Modern, State-of-the-art Design */}
          <button
            onClick={() => {
              if (isGuest || !user) {
                promptLogin('Đăng nhập để đồng bộ kho từ vựng lên Đám mây');
                return;
              }
              loadData(true);
            }}
            disabled={syncingCloud}
            className={`h-9 px-3.5 rounded-xl font-bold text-xs transition-all duration-200 inline-flex items-center gap-2 shadow-xs active:scale-95 ${
              syncingCloud
                ? 'bg-blue-50 dark:bg-blue-950/70 border border-blue-400 text-blue-600 dark:text-blue-400 cursor-wait'
                : justSynced
                ? 'bg-emerald-600 text-white shadow-emerald-500/25 ring-2 ring-emerald-400/50'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white shadow-indigo-500/20 hover:shadow-md hover:shadow-indigo-500/25 border border-indigo-400/30'
            }`}
            title="Đồng bộ 2 chiều toàn bộ Kho và Từ vựng với Cloud"
            aria-label="Đồng bộ Cloud"
          >
            {syncingCloud ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                <span>Đang đồng bộ...</span>
              </>
            ) : justSynced ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Đã đồng bộ!</span>
              </>
            ) : (
              <>
                <div className="relative flex items-center justify-center">
                  <CloudUpload className="w-4 h-4" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-indigo-600 animate-pulse" />
                </div>
                <span>Đồng bộ Cloud</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/20 text-white font-mono tracking-tight hidden sm:inline-block">
                  Live
                </span>
              </>
            )}
          </button>

          {/* Import Excel / CSV Button */}
          <button
            onClick={() => {
              setSelectedFile(null);
              setParsedWords([]);
              setParsingError(null);
              setImportTargetDeckName(selectedDeck?.title || decks[0]?.title || '');
              setShowImportModal(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-500 transition inline-flex items-center gap-1 shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Nhập Excel / CSV</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={() =>
              exportWordsToExcelOrCsv(
                selectedDeck ? wordsInSelectedDeck : words,
                selectedDeck ? `kho_${selectedDeck.title}` : 'danh_sach_tu_vung',
                'csv'
              )
            }
            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-[11px] hover:bg-slate-50 dark:hover:bg-slate-700 transition inline-flex items-center gap-1"
            title="Xuất file .csv"
          >
            <Download className="w-3.5 h-3.5 text-indigo-500" />
            <span>Xuất CSV</span>
          </button>

          {/* Add Word Button */}
          <button
            onClick={handleOpenAddWord}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold text-[11px] hover:bg-indigo-500 transition inline-flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm từ mới</span>
          </button>

          {/* Create Deck Button (When in Decks tab and no deck opened) */}
          {!selectedDeck && activeTab === 'decks' && (
            <button
              onClick={() => {
                setDeckTitleInput('');
                setDeckDescInput('');
                setDeckPasswordInput('');
                setShowCreateDeckModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-semibold text-[11px] hover:bg-purple-500 transition inline-flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo kho mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Success Toast Banner */}
      {actionSuccessMsg && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Main Mode Navigation Bar: "Kho của tôi" vs "Tất cả từ" */}
      {!selectedDeck && (
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl w-fit border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('decks')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'decks'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FolderKanban className="w-4 h-4 text-indigo-500" />
            <span>Kho Của Tôi ({decks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('all_words')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'all_words'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <span>Tất Cả Từ ({words.length})</span>
          </button>
        </div>
      )}

      {/* =============================================================================
          TAB 1: KHO CỦA TÔI (MY DECKS VIEW) - DEDICATED DECK MANAGEMENT
          ============================================================================= */}
      {!selectedDeck && activeTab === 'decks' && (
        <div className="space-y-4">
          {/* Deck Search & Bulk Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
            <div className="flex flex-wrap items-center gap-2">
              {/* Select All Checkbox */}
              <button
                onClick={() => {
                  if (selectedDeckIds.length === filteredDecks.length) {
                    setSelectedDeckIds([]);
                  } else {
                    setSelectedDeckIds(filteredDecks.map((d) => d.id));
                  }
                }}
                className="h-9 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
              >
                {selectedDeckIds.length > 0 && selectedDeckIds.length === filteredDecks.length ? (
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>Chọn tất cả ({filteredDecks.length})</span>
              </button>

              {/* Bulk Delete Decks Button */}
              {selectedDeckIds.length > 0 && (
                <button
                  onClick={() => setShowBulkDeleteDecksModal(true)}
                  className="h-9 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition inline-flex items-center gap-1.5 shadow-sm animate-in fade-in"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa {selectedDeckIds.length} kho đã chọn</span>
                </button>
              )}
            </div>

            {/* Deck Search Box */}
            <div className="relative w-full sm:w-64 h-9">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={deckSearch}
                onChange={(e) => setDeckSearch(e.target.value)}
                placeholder="Tìm kiếm tên kho từ..."
                className="w-full h-full pl-8 pr-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Decks Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredDecks.length === 0 ? (
            <div className="text-center py-20 text-slate-400 space-y-3 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 p-8">
              <FolderKanban className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-medium">Chưa có kho từ vựng nào.</p>
              <button
                onClick={() => setShowCreateDeckModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo kho từ vựng mới ngay</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDecks.map((deck) => {
                const isSelected = selectedDeckIds.includes(deck.id);

                return (
                  <GlassCard
                    key={deck.id}
                    variant="liquid"
                    className={`p-5 flex flex-col justify-between space-y-4 border transition duration-200 shadow-sm hover:shadow-md ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20'
                        : 'border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/50'
                    }`}
                  >
                    <div>
                      {/* Top Header: Checkbox + Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDeckIds((prev) =>
                                prev.includes(deck.id) ? prev.filter((id) => id !== deck.id) : [...prev, deck.id]
                              );
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 transition"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>

                          {deck.isSyncedToCloud ? (
                            <button
                              type="button"
                              onClick={(e) => handleUploadDeckToCloud(deck, e)}
                              disabled={syncingDeckId === deck.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-300/80 dark:border-emerald-800 transition active:scale-95 shadow-2xs group"
                              title="Kho đã được lưu trên Cloud. Bấm để cập nhật lại"
                              aria-label="Cập nhật kho lên Cloud"
                            >
                              {syncingDeckId === deck.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                              ) : (
                                <div className="relative flex items-center">
                                  <CloudUpload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute -top-0.5 -right-0.5 animate-pulse" />
                                </div>
                              )}
                              <span>{syncingDeckId === deck.id ? 'Đang lưu...' : 'Cloud Synced'}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleUploadDeckToCloud(deck, e)}
                              disabled={syncingDeckId === deck.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-bold shadow-xs hover:shadow-sm transition active:scale-95 group"
                              title="Kho này đang lưu ở máy (Local). Nhấn để lưu lên Cloud an toàn"
                              aria-label="Đẩy kho này lên Cloud"
                            >
                              {syncingDeckId === deck.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                              ) : (
                                <CloudUpload className="w-3.5 h-3.5 text-white group-hover:-translate-y-0.5 transition-transform" />
                              )}
                              <span>{syncingDeckId === deck.id ? 'Đang đẩy...' : 'Lưu lên Cloud'}</span>
                            </button>
                          )}

                          {deck.hasPassword && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold border border-amber-200">
                              <Lock className="w-2.5 h-2.5" />
                              <span>Khóa</span>
                            </span>
                          )}
                        </div>

                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {deck.computedWordCount} từ vựng
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug truncate">
                        {deck.title}
                      </h3>
                      {deck.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {deck.description}
                        </p>
                      )}

                      {/* Progress Bar */}
                      <div className="mt-4 space-y-1.5">
                        <div className="flex justify-between text-[11px] font-bold text-slate-500">
                          <span>Đã thuộc: {deck.masteredCount} từ</span>
                          <span className="text-indigo-600 dark:text-indigo-400">{deck.percentMastered}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${deck.percentMastered}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Updated Date */}
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">
                        Cập nhật: {new Date(deck.updatedAt || deck.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>

                    {/* Action Controls */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedDeck(deck);
                            setSelectedWordIds([]);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition flex items-center gap-1 shadow-xs"
                          aria-label="Xem và quản lý từ trong kho"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem & Quản lý từ</span>
                        </button>

                        <button
                          onClick={() => navigate(`/review?topic=${encodeURIComponent(deck.title)}`)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 font-bold text-xs transition flex items-center gap-1 border border-emerald-200 dark:border-emerald-800"
                          title="Ôn tập riêng kho này"
                          aria-label="Ôn tập riêng kho này"
                        >
                          <Sparkles className="w-3.5 h-3.5 fill-emerald-500" />
                          <span>Ôn tập</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleOpenEditDeck(deck, e)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition"
                          title="Sửa thông tin kho"
                          aria-label="Sửa thông tin kho"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleOpenShareDeck(deck, e)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition"
                          title="Chia sẻ lên cộng đồng"
                          aria-label="Chia sẻ lên cộng đồng"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleUploadDeckToCloud(deck, e)}
                          disabled={syncingDeckId === deck.id}
                          className={`p-1.5 rounded-lg transition border ${
                            deck.isSyncedToCloud
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-blue-200 dark:border-blue-800 hover:bg-blue-100'
                          }`}
                          title={deck.isSyncedToCloud ? 'Đồng bộ cập nhật kho này lên Cloud' : 'Đẩy kho này lên Cloud'}
                          aria-label={deck.isSyncedToCloud ? 'Cập nhật Cloud' : 'Đẩy lên Cloud'}
                        >
                          {syncingDeckId === deck.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CloudUpload className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeckToDelete(deck);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                          title="Xóa kho từ vựng này"
                          aria-label="Xóa kho từ vựng này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =============================================================================
          DECK DETAIL VIEW: "KHO CỦA TÔI -> KHO X -> QUẢN LÝ TỪ" (FULL CRUD WORDS INSIDE DECK)
          ============================================================================= */}
      {selectedDeck && (
        <div className="space-y-4">
          {/* Deck Detail Top Banner & Control Bar */}
          <div className="bg-slate-50/90 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
            {/* Row 1: Actions inside Deck */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                {/* Select All Words Checkbox */}
                <button
                  onClick={() => {
                    if (selectedWordIds.length === filteredWordsInDeck.length) {
                      setSelectedWordIds([]);
                    } else {
                      setSelectedWordIds(filteredWordsInDeck.map((w) => w.id));
                    }
                  }}
                  className="h-9 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-bold text-xs transition inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  {selectedWordIds.length > 0 && selectedWordIds.length === filteredWordsInDeck.length ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>Chọn tất cả ({filteredWordsInDeck.length})</span>
                </button>

                {/* Bulk Delete Words Button */}
                {selectedWordIds.length > 0 && (
                  <button
                    onClick={() => setShowBulkDeleteWordsModal(true)}
                    className="h-9 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition inline-flex items-center gap-1.5 shadow-sm animate-in fade-in"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa {selectedWordIds.length} từ đã chọn</span>
                  </button>
                )}

                {/* Sub-Topic Filter Dropdown (inside this deck) */}
                <div className="flex items-center h-9">
                  <CustomDropdown
                    value={deckWordTopicFilter}
                    onChange={(val) => setDeckWordTopicFilter(val)}
                    options={[
                      { value: 'ALL', label: 'Tất cả chủ đề trong kho' },
                      ...subTopicsInSelectedDeck.map((t) => ({ value: t, label: `Chủ đề: ${t}` })),
                    ]}
                    size="sm"
                    className="w-48 sm:w-56 h-9"
                  />
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center h-9">
                  <CustomDropdown
                    value={deckWordSort}
                    onChange={(val) => setDeckWordSort(val as any)}
                    options={[
                      { value: 'newest', label: 'Sắp xếp: Mới nhất' },
                      { value: 'oldest', label: 'Sắp xếp: Cũ nhất' },
                      { value: 'az', label: 'Sắp xếp: A -> Z' },
                      { value: 'za', label: 'Sắp xếp: Z -> A' },
                    ]}
                    size="sm"
                    className="w-40 sm:w-44 h-9"
                  />
                </div>
              </div>

              {/* Search Inside Deck */}
              <div className="relative w-full sm:w-60 h-9">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={deckWordSearch}
                  onChange={(e) => setDeckWordSearch(e.target.value)}
                  placeholder="Tìm từ, nghĩa trong kho..."
                  className="w-full h-full pl-8 pr-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>
            </div>

            {/* Row 2: Status Pills Filter & Ôn tập button */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center gap-1 text-xs font-semibold">
                <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-indigo-500" />
                  <span>Trạng thái:</span>
                </span>
                {[
                  { key: 'ALL', label: 'Tất cả' },
                  { key: 'LEARNING', label: 'Đang học' },
                  { key: 'MASTERED', label: 'Đã thuộc' },
                  { key: 'FAVORITES', label: 'Yêu thích' },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setDeckWordStatusFilter(t.key as any)}
                    className={`px-3 py-1 rounded-xl transition text-xs font-bold ${
                      deckWordStatusFilter === t.key
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold hidden sm:inline-block">
                  Hiển thị <strong className="text-indigo-600 dark:text-indigo-400">{filteredWordsInDeck.length}</strong> từ
                </span>

                <button
                  type="button"
                  onClick={() => handleUploadDeckToCloud(selectedDeck)}
                  disabled={syncingDeckId === selectedDeck.id || syncingCloud}
                  className={`h-8 px-3 rounded-xl font-bold text-xs transition inline-flex items-center gap-1.5 shadow-xs active:scale-95 ${
                    selectedDeck.isSyncedToCloud
                      ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20'
                  }`}
                  title="Đồng bộ tất cả từ vựng trong kho này lên Cloud"
                  aria-label="Đồng bộ kho này lên Cloud"
                >
                  {syncingDeckId === selectedDeck.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CloudUpload className="w-3.5 h-3.5" />
                  )}
                  <span>{selectedDeck.isSyncedToCloud ? 'Đã lưu Cloud' : 'Lưu kho lên Cloud'}</span>
                </button>

                <button
                  onClick={() => navigate(`/review?topic=${encodeURIComponent(selectedDeck.title)}`)}
                  className="h-8 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-sm transition inline-flex items-center gap-1.5"
                  aria-label="Ôn tập kho này"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  <span>Ôn tập kho này</span>
                </button>
              </div>
            </div>
          </div>

          {/* Word Cards Grid inside Deck */}
          {filteredWordsInDeck.length === 0 ? (
            <div className="text-center py-20 text-slate-400 space-y-3 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 p-8">
              <BookOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-medium">Chưa có từ vựng nào trong kho phù hợp với bộ lọc.</p>
              <button
                onClick={handleOpenAddWord}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm từ mới vào kho này</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredWordsInDeck.map((item) => {
                const isSelected = selectedWordIds.includes(item.id);
                const isFav = favoriteIds.includes(item.id) || item.isFavorite;
                // Topic is NEVER the deck name!
                const realTopic = item.topic || item.vocabulary?.topic || 'General';
                const cefrLevel = item.cefrLevel || item.vocabulary?.cefrLevel || 'B1';

                return (
                  <GlassCard
                    key={item.id}
                    variant="liquid"
                    className={`p-4 flex flex-col justify-between space-y-3 border transition duration-200 shadow-sm hover:shadow-md ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20'
                        : 'border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40'
                    }`}
                  >
                    <div>
                      {/* Top Bar: Checkbox + Tags on Left, Fixed Action Icons (🔊 ♥) on Top-Right */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        {/* Left: Checkbox + Topic Tag + CEFR */}
                        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedWordIds((prev) =>
                                prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
                              );
                            }}
                            className="p-0.5 text-slate-400 hover:text-indigo-600 transition shrink-0"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>

                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 truncate max-w-[130px]" title={`Chủ đề: ${realTopic}`}>
                            {realTopic}
                          </span>

                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                            {cefrLevel}
                          </span>
                        </div>

                        {/* Top-Right: Fixed Position Actions (Pronounce & 2-Way Favorite) */}
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          <button
                            onClick={(e) => handlePlayAudio(item.word, e)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition"
                            title="Phát âm chuẩn (Web Speech)"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => handleToggleFavorite(item.id, e)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 transition text-slate-400 hover:text-rose-500"
                            title={isFav ? 'Bỏ yêu thích' : 'Yêu thích từ này'}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                          </button>
                        </div>
                      </div>

                      {/* Word & Phonetic (Text constrained with truncate, NEVER pushes action icons) */}
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-1.5 min-w-0">
                          <h4 className="text-base font-black text-slate-900 dark:text-white truncate flex-1 leading-tight">
                            {item.word}
                          </h4>
                          {item.partOfSpeech && (
                            <span className="text-[10px] font-semibold text-slate-400 italic shrink-0">
                              ({item.partOfSpeech})
                            </span>
                          )}
                        </div>
                        {item.phonetic && (
                          <p className="text-xs text-indigo-500/90 font-mono tracking-tight mt-0.5 truncate">
                            {item.phonetic}
                          </p>
                        )}
                      </div>

                      {/* Meaning */}
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2 line-clamp-2 leading-snug">
                        {item.meaning}
                      </p>

                      {/* Example Sentence */}
                      {item.example && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 italic line-clamp-2 border-l-2 border-indigo-300 dark:border-indigo-700 pl-2 leading-relaxed">
                          "{item.example}"
                        </p>
                      )}
                    </div>

                    {/* Word Quick Edit / Delete Controls */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {item.status === 'MASTERED' ? 'Đã thuộc' : 'Đang học'}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleOpenEditWord(item, e)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
                          title="Sửa từ này"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setWordToDelete(item);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-500 transition"
                          title="Xóa từ này khỏi kho"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =============================================================================
          TAB 2: TẤT CẢ TỪ (ALL WORDS TAB) - STRUCTURED 2-ROW FILTER & REAL TOPIC DATA
          ============================================================================= */}
      {!selectedDeck && activeTab === 'all_words' && (
        <div className="space-y-4">
          {/* Structured 2-Row Filter Panel */}
          <div className="bg-slate-50/90 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
            {/* ROW 1: Status Pills & Real Topic Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold">
                <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1 shrink-0">
                  <Filter className="w-3 h-3 text-indigo-500" />
                  <span>Trạng thái:</span>
                </span>
                {[
                  { key: 'ALL', label: 'Tất cả từ' },
                  { key: 'LEARNING', label: 'Đang học / Mới' },
                  { key: 'MASTERED', label: 'Đã thuộc' },
                  { key: 'FAVORITES', label: 'Yêu thích' },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setAllWordStatusFilter(t.key as any)}
                    className={`h-9 px-3.5 rounded-xl transition text-xs font-extrabold shrink-0 ${
                      allWordStatusFilter === t.key
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Topic Dropdown (Row 1 Right) */}
              <div className="flex items-center h-9">
                <CustomDropdown
                  value={allWordTopicFilter}
                  onChange={(val) => setAllWordTopicFilter(val)}
                  options={[
                    { value: 'ALL', label: 'Tất cả chủ đề (Topics)' },
                    ...allAvailableTopics.map((t) => ({ value: t, label: `Chủ đề: ${t}` })),
                  ]}
                  size="sm"
                  className="w-full sm:w-56 h-9"
                />
              </div>
            </div>

            {/* ROW 2: Level (CEFR) Dropdown, Search Input Box, Reset Filter Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60">
              <div className="flex flex-wrap items-center gap-2">
                {/* CEFR Level Filter */}
                <div className="flex items-center h-9">
                  <CustomDropdown
                    value={allWordCefrFilter}
                    onChange={(val) => setAllWordCefrFilter(val)}
                    options={[
                      { value: 'ALL', label: 'Mọi trình độ (CEFR)' },
                      { value: 'A1', label: 'A1 - Beginner' },
                      { value: 'A2', label: 'A2 - Elementary' },
                      { value: 'B1', label: 'B1 - Intermediate' },
                      { value: 'B2', label: 'B2 - Upper Inter' },
                      { value: 'C1', label: 'C1 - Advanced' },
                      { value: 'C2', label: 'C2 - Mastery' },
                    ]}
                    size="sm"
                    className="w-44 h-9"
                  />
                </div>

                {/* Reset Filters Button */}
                {(allWordStatusFilter !== 'ALL' || allWordTopicFilter !== 'ALL' || allWordCefrFilter !== 'ALL' || allWordSearch) && (
                  <button
                    onClick={() => {
                      setAllWordStatusFilter('ALL');
                      setAllWordTopicFilter('ALL');
                      setAllWordCefrFilter('ALL');
                      setAllWordSearch('');
                    }}
                    className="h-9 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-bold text-xs transition inline-flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Đặt lại bộ lọc</span>
                  </button>
                )}
              </div>

              {/* Search Box (Row 2 Right) */}
              <div className="relative w-full sm:w-64 h-9">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={allWordSearch}
                  onChange={(e) => setAllWordSearch(e.target.value)}
                  placeholder="Tìm từ tiếng Anh, phiên âm, nghĩa..."
                  className="w-full h-full pl-8 pr-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Results Summary Counter */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-semibold">
            <span>
              Hiển thị <strong className="text-indigo-600 dark:text-indigo-400">{allFilteredWords.length}</strong> từ vựng
            </span>
          </div>

          {/* Words Grid for "Tất cả từ" */}
          {allFilteredWords.length === 0 ? (
            <div className="text-center py-20 text-slate-400 space-y-3 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 p-8">
              <BookOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-medium">Chưa có từ vựng nào phù hợp với bộ lọc.</p>
              <button
                onClick={() => {
                  setAllWordStatusFilter('ALL');
                  setAllWordTopicFilter('ALL');
                  setAllWordCefrFilter('ALL');
                  setAllWordSearch('');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition"
              >
                <span>Xóa bộ lọc</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {visibleAllWords.map((item) => {
                const isFav = favoriteIds.includes(item.id) || item.isFavorite;
                // Topic is NEVER the deck name!
                const realTopic = item.topic || item.vocabulary?.topic || 'General';
                const cefrLevel = item.cefrLevel || item.vocabulary?.cefrLevel || 'B1';

                return (
                  <GlassCard
                    key={item.id}
                    variant="liquid"
                    className="p-4 flex flex-col justify-between space-y-3 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 transition duration-200 shadow-sm hover:shadow-md"
                  >
                    <div>
                      {/* Top Bar: Tags on Left, Fixed Action Icons (🔊 ♥) on Top-Right */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        {/* Left Tags: Real Topic + CEFR Level */}
                        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                          <span
                            className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 truncate max-w-[130px]"
                            title={`Chủ đề: ${realTopic}`}
                          >
                            {realTopic}
                          </span>

                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                            {cefrLevel}
                          </span>
                        </div>

                        {/* Top-Right Fixed Action Icons (Pronounce & 2-Way Favorite) */}
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          <button
                            onClick={(e) => handlePlayAudio(item.word, e)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition"
                            title="Phát âm chuẩn (Web Speech)"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => handleToggleFavorite(item.id, e)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 transition text-slate-400 hover:text-rose-500"
                            title={isFav ? 'Bỏ yêu thích' : 'Yêu thích từ này'}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                          </button>
                        </div>
                      </div>

                      {/* Word Title (Truncated safely, NEVER pushes action icons) */}
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-1.5 min-w-0">
                          <h4 className="text-base font-black text-slate-900 dark:text-white truncate flex-1 leading-tight">
                            {item.word}
                          </h4>
                          {item.partOfSpeech && (
                            <span className="text-[10px] font-semibold text-slate-400 italic shrink-0">
                              ({item.partOfSpeech})
                            </span>
                          )}
                        </div>
                        {item.phonetic && (
                          <p className="text-xs text-indigo-500/90 font-mono tracking-tight mt-0.5 truncate">
                            {item.phonetic}
                          </p>
                        )}
                      </div>

                      {/* Meaning */}
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2 line-clamp-2 leading-snug">
                        {item.meaning}
                      </p>

                      {/* Example Sentence */}
                      {item.example && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 italic line-clamp-2 border-l-2 border-indigo-300 dark:border-indigo-700 pl-2 leading-relaxed">
                          "{item.example}"
                        </p>
                      )}
                    </div>

                    {/* Word Status Badge and Quick Edit */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {item.status === 'MASTERED' ? 'Đã thuộc' : 'Đang học'}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleOpenEditWord(item, e)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
                          title="Sửa từ này"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setWordToDelete(item);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-500 transition"
                          title="Xóa từ này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}

          {/* Auto Infinite Scroll Target Anchor */}
          <div ref={loadMoreRef} className="h-8 flex items-center justify-center">
            {allFilteredWords.length > displayCount && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            )}
          </div>
        </div>
      )}

      {/* =============================================================================
          MODALS SECTION
          ============================================================================= */}

      {/* 1. CREATE DECK MODAL */}
      <ModalPortal isOpen={showCreateDeckModal} onClose={() => setShowCreateDeckModal(false)}>
        <form onSubmit={handleConfirmCreateDeck} className="m-auto max-w-md w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Folder className="w-4 h-4 text-indigo-600" />
              <span>Tạo Kho Từ Vựng Mới</span>
            </h3>
            <button type="button" onClick={() => setShowCreateDeckModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tên kho từ vựng *</label>
              <input
                type="text"
                required
                value={deckTitleInput}
                onChange={(e) => setDeckTitleInput(e.target.value)}
                placeholder="Ví dụ: TOEIC 600 Essential Words"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Mô tả kho</label>
              <textarea
                rows={2}
                value={deckDescInput}
                onChange={(e) => setDeckDescInput(e.target.value)}
                placeholder="Mô tả mục tiêu của kho từ này..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Lĩnh vực</label>
                <select
                  value={deckCatInput}
                  onChange={(e) => setDeckCatInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                >
                  <option value="Business English">Business English</option>
                  <option value="TOEIC Test">TOEIC Test</option>
                  <option value="IELTS Academic">IELTS Academic</option>
                  <option value="Daily Communication">Giao tiếp hàng ngày</option>
                  <option value="Technology">Công nghệ / IT</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Cấp độ (CEFR)</label>
                <select
                  value={deckCefrInput}
                  onChange={(e) => setDeckCefrInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                >
                  <option value="A1">A1 - Beginner</option>
                  <option value="A2">A2 - Elementary</option>
                  <option value="B1">B1 - Intermediate</option>
                  <option value="B2">B2 - Upper-Inter</option>
                  <option value="C1">C1 - Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Mật khẩu bảo mật kho (Tùy chọn)</label>
              <input
                type="password"
                value={deckPasswordInput}
                onChange={(e) => setDeckPasswordInput(e.target.value)}
                placeholder="Để trống nếu không đặt mật khẩu"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateDeckModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition shadow-md"
            >
              Xác nhận tạo kho
            </button>
          </div>
        </form>
      </ModalPortal>

      {/* 2. EDIT DECK MODAL */}
      <ModalPortal isOpen={showEditDeckModal} onClose={() => setShowEditDeckModal(false)}>
        <form onSubmit={handleConfirmEditDeck} className="m-auto max-w-md w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-indigo-600" />
              <span>Sửa Thông Tin Kho Từ Vựng</span>
            </h3>
            <button type="button" onClick={() => setShowEditDeckModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tên kho từ vựng *</label>
              <input
                type="text"
                required
                value={deckTitleInput}
                onChange={(e) => setDeckTitleInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Mô tả kho</label>
              <textarea
                rows={2}
                value={deckDescInput}
                onChange={(e) => setDeckDescInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Lĩnh vực</label>
                <select
                  value={deckCatInput}
                  onChange={(e) => setDeckCatInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                >
                  <option value="Business English">Business English</option>
                  <option value="TOEIC Test">TOEIC Test</option>
                  <option value="IELTS Academic">IELTS Academic</option>
                  <option value="Daily Communication">Giao tiếp hàng ngày</option>
                  <option value="Technology">Công nghệ / IT</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Cấp độ (CEFR)</label>
                <select
                  value={deckCefrInput}
                  onChange={(e) => setDeckCefrInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                >
                  <option value="A1">A1 - Beginner</option>
                  <option value="A2">A2 - Elementary</option>
                  <option value="B1">B1 - Intermediate</option>
                  <option value="B2">B2 - Upper-Inter</option>
                  <option value="C1">C1 - Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Mật khẩu bảo mật kho (Tùy chọn)</label>
              <input
                type="password"
                value={deckPasswordInput}
                onChange={(e) => setDeckPasswordInput(e.target.value)}
                placeholder="Để trống nếu không đổi mật khẩu"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowEditDeckModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition shadow-md"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </ModalPortal>

      {/* 3. DELETE SINGLE DECK CONFIRMATION MODAL */}
      <ModalPortal isOpen={Boolean(deckToDelete)} onClose={() => setDeckToDelete(null)}>
        {deckToDelete && (
          <div className="m-auto max-w-md w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Xóa Kho Từ Vựng?</h3>
                <p className="text-xs text-slate-500">Hành động này không thể hoàn tác.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa kho từ <strong className="text-indigo-600 dark:text-indigo-400">{deckToDelete.title}</strong> không? Toàn bộ từ vựng thuộc kho này sẽ bị xóa khỏi bộ nhớ và dữ liệu cá nhân của bạn.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeckToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDeck}
                disabled={deletingDecks}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 transition disabled:opacity-50 shadow-md"
              >
                {deletingDecks ? 'Đang xóa...' : 'Xác nhận xóa kho'}
              </button>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* 4. BULK DELETE DECKS MODAL */}
      <ModalPortal isOpen={showBulkDeleteDecksModal} onClose={() => setShowBulkDeleteDecksModal(false)}>
        <div className="m-auto max-w-md w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-fade-in">
          <div className="flex items-center gap-3 text-rose-600">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Xóa Nhiều Kho Từ Vựng?</h3>
              <p className="text-xs text-slate-500">Đã chọn {selectedDeckIds.length} kho từ vựng.</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Bạn có chắc chắn muốn xóa <strong className="text-rose-600">{selectedDeckIds.length} kho từ vựng đã chọn</strong>? Toàn bộ từ vựng thuộc các kho này cũng sẽ bị xóa.
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowBulkDeleteDecksModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmBulkDeleteDecks}
              disabled={deletingDecks}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 transition disabled:opacity-50 shadow-md"
            >
              {deletingDecks ? 'Đang xóa...' : 'Xác nhận xóa các kho'}
            </button>
          </div>
        </div>
      </ModalPortal>

      {/* 5. ADD / EDIT WORD MODAL */}
      <ModalPortal
        isOpen={showAddWordModal || showEditWordModal}
        onClose={() => {
          setShowAddWordModal(false);
          setShowEditWordModal(false);
        }}
      >
        <form
          onSubmit={showEditWordModal ? handleConfirmEditWord : handleConfirmAddWord}
          className="m-auto max-w-lg w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {showEditWordModal ? <Edit3 className="w-4 h-4 text-indigo-600" /> : <Plus className="w-4 h-4 text-indigo-600" />}
              <span>{showEditWordModal ? 'Sửa Từ Vựng' : 'Thêm Từ Vựng Mới'}</span>
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowAddWordModal(false);
                setShowEditWordModal(false);
              }}
              className="p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Từ tiếng Anh *</label>
                <input
                  type="text"
                  required
                  value={wordFormWord}
                  onChange={(e) => setWordFormWord(e.target.value)}
                  placeholder="Ví dụ: agreement"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Phiên âm IPA</label>
                <input
                  type="text"
                  value={wordFormPhonetic}
                  onChange={(e) => setWordFormPhonetic(e.target.value)}
                  placeholder="/əˈɡriː.mənt/"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Loại từ</label>
                <select
                  value={wordFormPos}
                  onChange={(e) => setWordFormPos(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                >
                  <option value="noun">Danh từ (noun)</option>
                  <option value="verb">Động từ (verb)</option>
                  <option value="adjective">Tính từ (adjective)</option>
                  <option value="adverb">Trạng từ (adverb)</option>
                  <option value="preposition">Giới từ (preposition)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Cấp độ (CEFR)</label>
                <select
                  value={wordFormCefr}
                  onChange={(e) => setWordFormCefr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                >
                  <option value="A1">A1 - Beginner</option>
                  <option value="A2">A2 - Elementary</option>
                  <option value="B1">B1 - Intermediate</option>
                  <option value="B2">B2 - Upper-Inter</option>
                  <option value="C1">C1 - Advanced</option>
                  <option value="C2">C2 - Mastery</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Nghĩa tiếng Việt *</label>
              <input
                type="text"
                required
                value={wordFormMeaning}
                onChange={(e) => setWordFormMeaning(e.target.value)}
                placeholder="sự thỏa thuận, hợp đồng"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Chủ đề thực tế của từ (Topic) *
              </label>
              <input
                type="text"
                required
                value={wordFormTopic}
                onChange={(e) => setWordFormTopic(e.target.value)}
                placeholder="Ví dụ: Contracts, Marketing, Travel..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Lưu ý: Đây là chủ đề thực tế của từ (như Hợp đồng, Du lịch...), không phải tên kho.
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Kho từ vựng chứa</label>
              <select
                value={wordFormTargetDeck}
                onChange={(e) => setWordFormTargetDeck(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              >
                {decks.map((d) => (
                  <option key={d.id} value={d.title}>
                    Kho: {d.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Câu ví dụ tiếng Anh</label>
              <textarea
                rows={2}
                value={wordFormExample}
                onChange={(e) => setWordFormExample(e.target.value)}
                placeholder="They reached an agreement after a lengthy negotiation."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Dịch câu ví dụ</label>
              <input
                type="text"
                value={wordFormExampleTrans}
                onChange={(e) => setWordFormExampleTrans(e.target.value)}
                placeholder="Họ đã đạt được thỏa thuận sau một cuộc đàm phán kéo dài."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setShowAddWordModal(false);
                setShowEditWordModal(false);
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition shadow-md"
            >
              {showEditWordModal ? 'Lưu thay đổi' : 'Thêm từ vựng'}
            </button>
          </div>
        </form>
      </ModalPortal>

      {/* 6. DELETE SINGLE WORD MODAL */}
      <ModalPortal isOpen={Boolean(wordToDelete)} onClose={() => setWordToDelete(null)}>
        {wordToDelete && (
          <div className="m-auto max-w-md w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Xóa Từ Vựng?</h3>
                <p className="text-xs text-slate-500">Từ vựng: "{wordToDelete.word}"</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa từ vựng <strong className="text-indigo-600 dark:text-indigo-400">{wordToDelete.word}</strong> ({wordToDelete.meaning}) không?
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setWordToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteWord}
                disabled={deletingWords}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 transition disabled:opacity-50 shadow-md"
              >
                {deletingWords ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* 7. BULK DELETE WORDS MODAL */}
      <ModalPortal isOpen={showBulkDeleteWordsModal} onClose={() => setShowBulkDeleteWordsModal(false)}>
        <div className="m-auto max-w-md w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-fade-in">
          <div className="flex items-center gap-3 text-rose-600">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Xóa Nhiều Từ Vựng?</h3>
              <p className="text-xs text-slate-500">Đã chọn {selectedWordIds.length} từ vựng.</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Bạn có chắc chắn muốn xóa <strong className="text-rose-600">{selectedWordIds.length} từ vựng đã chọn</strong> khỏi kho từ?
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowBulkDeleteWordsModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmBulkDeleteWords}
              disabled={deletingWords}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 transition disabled:opacity-50 shadow-md"
            >
              {deletingWords ? 'Đang xóa...' : 'Xác nhận xóa các từ'}
            </button>
          </div>
        </div>
      </ModalPortal>

      {/* 8. EXCEL / CSV IMPORT MODAL */}
      <ModalPortal isOpen={showImportModal} onClose={() => setShowImportModal(false)}>
        <div className="m-auto max-w-4xl w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-fade-in max-h-[88vh] flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>Nhập Dữ Liệu Từ Vựng từ Excel / CSV</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tự động nhận diện 7 cột chuẩn: Word, Phonetic, PartOfSpeech, Meaning, Example, CEFR, Topic.
              </p>
            </div>
            <button type="button" onClick={() => setShowImportModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Options: Target Deck & Template Download */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Nạp vào Kho Từ Vựng nào?</label>
              <div className="flex items-center gap-2">
                <select
                  value={importDeckMode}
                  onChange={(e) => setImportDeckMode(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
                >
                  <option value="existing">Kho có sẵn</option>
                  <option value="new">Tạo kho mới</option>
                </select>

                {importDeckMode === 'existing' ? (
                  <select
                    value={importTargetDeckName}
                    onChange={(e) => setImportTargetDeckName(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
                  >
                    {decks.map((d) => (
                      <option key={d.id} value={d.title}>
                        {d.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={importTargetDeckName}
                    onChange={(e) => setImportTargetDeckName(e.target.value)}
                    placeholder="Nhập tên kho mới..."
                    className="flex-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
                  />
                )}
              </div>
            </div>

            <div className="flex items-end justify-start sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => downloadVocabularyTemplate('xlsx')}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border border-emerald-300 font-bold hover:bg-emerald-50 transition inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải mẫu .xlsx</span>
              </button>
              <button
                type="button"
                onClick={() => downloadVocabularyTemplate('csv')}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-indigo-300 font-bold hover:bg-indigo-50 transition inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải mẫu .csv</span>
              </button>
            </div>
          </div>

          {/* File Upload Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-4 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/30"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {selectedFile ? selectedFile.name : 'Bấm vào đây để chọn file Excel (.xlsx) hoặc CSV từ máy tính'}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Dung lượng tối đa 100MB • Tự động đọc và kiểm tra dữ liệu trước khi nạp</p>
          </div>

          {isParsing && (
            <div className="py-4 text-center text-xs text-indigo-600 font-bold flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Đang đọc và giải mã file...</span>
            </div>
          )}

          {parsingError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {parsingError}
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedWords.length > 0 && (
            <div className="flex-1 min-h-0 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                  <tr>
                    <th className="p-2 border-b">#</th>
                    <th className="p-2 border-b">Word</th>
                    <th className="p-2 border-b">Phonetic</th>
                    <th className="p-2 border-b">Loại từ</th>
                    <th className="p-2 border-b">Nghĩa tiếng Việt</th>
                    <th className="p-2 border-b">Chủ đề (Topic)</th>
                    <th className="p-2 border-b">CEFR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                  {parsedWords.slice(0, 50).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-2 text-slate-400 text-[10px]">{idx + 1}</td>
                      <td className="p-2 font-bold text-indigo-600 dark:text-indigo-400">{row.word}</td>
                      <td className="p-2 font-mono text-[11px]">{row.phonetic || '-'}</td>
                      <td className="p-2 italic">{row.partOfSpeech || 'noun'}</td>
                      <td className="p-2">{row.meaning}</td>
                      <td className="p-2 font-bold text-emerald-600">{row.topic || 'General'}</td>
                      <td className="p-2">{row.cefrLevel || 'B1'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedWords.length > 50 && (
                <p className="p-2 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40">
                  ... và còn {parsedWords.length - 50} từ vựng khác đã sẵn sàng nạp.
                </p>
              )}
            </div>
          )}

          {importProgressMsg && (
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 text-indigo-700 dark:text-indigo-300 text-xs font-bold text-center">
              {importProgressMsg}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500">
              Tổng số từ hợp lệ: <strong className="text-indigo-600">{parsedWords.filter((w) => w.word?.trim() && w.meaning?.trim()).length}</strong> từ
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchImport}
                disabled={isImporting || parsedWords.length === 0}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition disabled:opacity-50 shadow-md inline-flex items-center gap-1.5"
              >
                {isImporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                <span>{isImporting ? 'Đang nạp...' : 'Xác nhận nạp vào kho'}</span>
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* 9. SHARE DECK MODAL */}
      <ModalPortal isOpen={Boolean(shareModalDeck)} onClose={() => setShareModalDeck(null)}>
        {shareModalDeck && (
          <form onSubmit={handleConfirmShareDeck} className="m-auto max-w-md w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-600" />
                <span>Chia Sẻ Kho Lên Cộng Đồng</span>
              </h3>
              <button type="button" onClick={() => setShareModalDeck(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tiêu đề chia sẻ *</label>
                <input
                  type="text"
                  required
                  value={shareTitle}
                  onChange={(e) => setShareTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Mô tả kho</label>
                <textarea
                  rows={2}
                  value={shareDescription}
                  onChange={(e) => setShareDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Danh mục</label>
                <select
                  value={shareCategory}
                  onChange={(e) => setShareCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                >
                  <option value="Business English">Business English</option>
                  <option value="TOEIC Test">TOEIC Test</option>
                  <option value="IELTS Academic">IELTS Academic</option>
                  <option value="Daily Communication">Giao tiếp hàng ngày</option>
                </select>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={shareEnablePassword}
                    onChange={(e) => setShareEnablePassword(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Đặt mật khẩu bảo vệ kho (Chỉ ai có pass mới sao chép được)</span>
                </label>
                {shareEnablePassword && (
                  <input
                    type="password"
                    required
                    value={sharePassword}
                    onChange={(e) => setSharePassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full mt-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShareModalDeck(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={sharing}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition disabled:opacity-50 shadow-md"
              >
                {sharing ? 'Đang chia sẻ...' : 'Xác nhận chia sẻ'}
              </button>
            </div>
          </form>
        )}
      </ModalPortal>

      {/* 10. VIP UPGRADE MODAL */}
      <ModalPortal isOpen={showVipModal} onClose={() => setShowVipModal(false)}>
        <div className="m-auto max-w-lg w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6 shadow-2xl animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                Mở Khóa Lưu Trữ & Đồng Bộ Cloud
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Lưu trữ từ vựng không giới hạn, đồng bộ đa thiết bị tự động.
              </p>
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Đồng bộ tức thì mọi từ vựng giữa PC, Laptop và Điện thoại.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Sao lưu dữ liệu an toàn vĩnh viễn trên máy chủ đám mây.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Không giới hạn số lượng kho từ và từ vựng import.</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={() => {
                setShowVipModal(false);
                window.location.href = '/upgrade';
              }}
              className="w-full px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-lg hover:opacity-95 transition flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4 text-amber-200" />
              <span>Nâng Cấp VIP Ngay</span>
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
