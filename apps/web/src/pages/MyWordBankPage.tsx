import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n';
import { usePageSEO } from '../hooks/usePageSEO';
import { useLearningContext } from '../contexts/LearningContext';
import { audioEngine } from '../lib/audioEngine';
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
  getSessionUnlockedDecks,
  saveSessionUnlockedDeck,
  LocalDeck,
} from '../lib/idb';
import { GlassCard } from '../components/common/GlassCard';
import { CountryFlag } from '../components/language/CountryFlag';
import { ModalPortal } from '../components/common/ModalPortal';
import { CustomDropdown } from '../components/common/CustomDropdown';
import { confirmModal } from '../components/common/ConfirmDialog';
import { ToggleSwitch } from '../components/common/ToggleSwitch';
import { LanguageBadge } from '../components/language/LanguageBadge';
import { getLanguage } from '../config/languages';
import { useScrollLoad } from '../hooks/useScrollLoad';
import { useVirtualList } from '../hooks/useVirtualList';
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
  Check,
  ChevronDown,
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
  EyeOff,
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
  LayoutGrid,
  List,
  Table,
  HelpCircle,
  MoreHorizontal,
  Tag,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Key,
  FolderPlus,
} from 'lucide-react';
import {
  downloadVocabularyTemplate,
  parseVocabularyFile,
  exportWordsToExcelOrCsv,
  ParsedWordItem,
} from '../utils/excelTemplate';
import { WordBankTour } from '../components/common/WordBankTour';

export const MyWordBankPage: React.FC = () => {
  const navigate = useNavigate();
  const { deckId: routeDeckId } = useParams<{ deckId?: string }>();
  const { user, isGuest, promptLogin } = useAuth();
  const { locale } = useTranslation();
  const { activeLanguage } = useLearningContext();

  // Guided Walkthrough Tour State
  const [showTour, setShowTour] = useState(false);

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

  // Decks Selection, Filter, Sort & Grouping state
  const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>([]);
  const [deckSearch, setDeckSearch] = useState('');
  const [deckCategoryFilter, setDeckCategoryFilter] = useState('ALL');
  const [deckCefrFilter, setDeckCefrFilter] = useState('ALL');
  const [deckGroupByCat, setDeckGroupByCat] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('vocabflow_deck_group_by_cat');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const toggleDeckGroupByCat = () => {
    setDeckGroupByCat((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('vocabflow_deck_group_by_cat', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Inside Deck Words Selection & Filter states
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [deckWordSearch, setDeckWordSearch] = useState('');
  const [deckWordTopicFilter, setDeckWordTopicFilter] = useState('ALL');
  const [deckWordPosFilter, setDeckWordPosFilter] = useState('ALL');
  const [deckWordCefrFilter, setDeckWordCefrFilter] = useState('ALL');
  const [deckWordStatusFilter, setDeckWordStatusFilter] = useState<'ALL' | 'LEARNING' | 'MASTERED' | 'FAVORITES'>('ALL');
  const [deckWordSort, setDeckWordSort] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest');
  const [deckWordSortCol, setDeckWordSortCol] = useState<'word' | 'meaning' | 'topic' | 'cefr' | 'status' | 'date' | null>(null);
  const [deckWordSortDir, setDeckWordSortDir] = useState<'asc' | 'desc'>('asc');

  // "Tất cả từ" Tab Filters
  const [allWordStatusFilter, setAllWordStatusFilter] = useState<'ALL' | 'LEARNING' | 'MASTERED' | 'FAVORITES'>('ALL');
  const [allWordTopicFilter, setAllWordTopicFilter] = useState('ALL');
  const [allWordCefrFilter, setAllWordCefrFilter] = useState('ALL');
  const [allWordPosFilter, setAllWordPosFilter] = useState('ALL');
  const [allWordSearch, setAllWordSearch] = useState('');
  const [allWordSortCol, setAllWordSortCol] = useState<'word' | 'meaning' | 'deck' | 'topic' | 'cefr' | 'status' | 'date' | null>(null);
  const [allWordSortDir, setAllWordSortDir] = useState<'asc' | 'desc'>('asc');

  // Unified Deck Modal State (Manual vs File Import)
  const [deckModalTab, setDeckModalTab] = useState<'manual' | 'file'>('manual');
  const [showDeckPassword, setShowDeckPassword] = useState(false);
  const [importExistingDeckPass, setImportExistingDeckPass] = useState('');
  const [showImportPass, setShowImportPass] = useState(false);

  // View Modes: 'grid' (dưới ô) vs 'list' (danh sách)
  const [deckViewMode, setDeckViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('vocabflow_deck_view_mode') as 'grid' | 'list') || 'grid';
  });
  const [wordViewMode, setWordViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('vocabflow_word_view_mode') as 'grid' | 'list') || 'grid';
  });

  const toggleDeckViewMode = (mode: 'grid' | 'list') => {
    setDeckViewMode(mode);
    try {
      localStorage.setItem('vocabflow_deck_view_mode', mode);
    } catch {}
  };

  const toggleWordViewMode = (mode: 'grid' | 'list') => {
    setWordViewMode(mode);
    try {
      localStorage.setItem('vocabflow_word_view_mode', mode);
    } catch {}
  };

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
  const [deckLangInput, setDeckLangInput] = useState<string>(activeLanguage.id);
  const [deckPasswordInput, setDeckPasswordInput] = useState('');
  const [deckStatusInput, setDeckStatusInput] = useState<'PENDING' | 'PRIVATE' | 'APPROVED'>('PRIVATE');
  const [creatingDeck, setCreatingDeck] = useState(false);

  // User-defined and preset deck categories with persistence
  const DEFAULT_DECK_CATEGORIES = [
    'Business English',
    'TOEIC Test',
    'IELTS Academic',
    'Daily Communication',
    'Technology',
    'Culture & Travel',
  ];

  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vocabflow_custom_deck_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const allDeckCategories = useMemo(() => {
    const list = [...DEFAULT_DECK_CATEGORIES];
    customCategories.forEach((cat) => {
      if (!list.some((c) => c.toLowerCase() === cat.toLowerCase())) {
        list.push(cat);
      }
    });
    decks.forEach((d) => {
      if (d.category && !list.some((c) => c.toLowerCase() === d.category!.toLowerCase())) {
        list.push(d.category);
      }
    });
    return list;
  }, [customCategories, decks]);

  const handleCreateCategory = (newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    const existing = allDeckCategories.find((c) => c.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      setDeckCatInput(existing);
      return;
    }
    const updated = [...customCategories, trimmed];
    setCustomCategories(updated);
    try {
      localStorage.setItem('vocabflow_custom_deck_categories', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist custom categories', e);
    }
    setDeckCatInput(trimmed);
  };

  // Dynamic levels calculation based on selected language definition (CEFR, JLPT, HSK, TOPIK, etc.)
  const selectedDeckLangDef = useMemo(() => {
    return getLanguage(deckLangInput || activeLanguage.id);
  }, [deckLangInput, activeLanguage.id]);

  const dynamicLevelOptions = useMemo(() => {
    const levels = selectedDeckLangDef?.supportedLevels || ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    return levels.map((lvl) => {
      let label = lvl;
      let badge = lvl;
      if (lvl.startsWith('JLPT')) {
        label = `${lvl} — Tiếng Nhật`;
      } else if (lvl.startsWith('HSK')) {
        label = `${lvl} — Tiếng Trung (Hanzi)`;
      } else if (lvl.startsWith('TOPIK')) {
        label = `${lvl} — Tiếng Hàn (Hangul)`;
      } else if (lvl === 'Beginner') {
        label = 'Beginner — Sơ cấp';
        badge = 'BEG';
      } else if (lvl === 'Elementary') {
        label = 'Elementary — Căn bản';
        badge = 'ELE';
      } else if (lvl === 'Intermediate') {
        label = 'Intermediate — Trung cấp';
        badge = 'INT';
      } else if (lvl === 'Advanced') {
        label = 'Advanced — Cao cấp';
        badge = 'ADV';
      } else if (lvl === 'A1') {
        label = 'A1 — Beginner (Căn bản)';
      } else if (lvl === 'A2') {
        label = 'A2 — Elementary (Sơ cấp)';
      } else if (lvl === 'B1') {
        label = 'B1 — Intermediate (Trung cấp)';
      } else if (lvl === 'B2') {
        label = 'B2 — Upper-Inter (Trung cao)';
      } else if (lvl === 'C1') {
        label = 'C1 — Advanced (Cao cấp)';
      } else if (lvl === 'C2') {
        label = 'C2 — Mastery (Thành thạo)';
      }
      return { value: lvl, label, badge };
    });
  }, [selectedDeckLangDef]);

  const handleDeckLanguageChange = (newLangId: string) => {
    setDeckLangInput(newLangId);
    const langDef = getLanguage(newLangId);
    if (langDef && langDef.supportedLevels && langDef.supportedLevels.length > 0) {
      setDeckCefrInput(langDef.defaultLevel || langDef.supportedLevels[0]);
    }
  };

  // Password Protection for opening & studying decks
  const [deckToUnlock, setDeckToUnlock] = useState<LocalDeck | null>(null);
  const [deckUnlockInput, setDeckUnlockInput] = useState('');
  const [deckUnlockError, setDeckUnlockError] = useState<string | null>(null);
  const [deckUnlocking, setDeckUnlocking] = useState(false);
  const [showUnlockPass, setShowUnlockPass] = useState(false);
  const [unlockedPersonalDeckIds, setUnlockedPersonalDeckIds] = useState<Record<string, boolean>>(() => getSessionUnlockedDecks());
  const [pendingDeckAction, setPendingDeckAction] = useState<(() => void) | null>(null);

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
  const [editingParsedIdx, setEditingParsedIdx] = useState<number | null>(null);
  const [editingParsedItem, setEditingParsedItem] = useState<ParsedWordItem | null>(null);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgressMsg, setImportProgressMsg] = useState<string | null>(null);
  const [importDeckMode, setImportDeckMode] = useState<'existing' | 'new'>('existing');
  const [importTargetDeckName, setImportTargetDeckName] = useState('');
  const [idbSyncMsg, setIdbSyncMsg] = useState<string | null>(null);
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

    const currentUserId = user?.id || (isGuest ? 'guest' : 'unknown');

    // 1. Instant Cache-First Load from IndexedDB scoped strictly to current user and active language
    let cachedDecks: LocalDeck[] = [];
    try {
      const [idbDecks, cachedWords] = await Promise.all([
        idbGetLocalDecks(currentUserId, activeLanguage.id),
        idbGetWords(currentUserId, activeLanguage.id),
      ]);

      cachedDecks = idbDecks || [];
      if (cachedDecks.length > 0) {
        setDecks(cachedDecks);
      } else {
        setDecks([]);
      }
      if (cachedWords && cachedWords.length > 0) {
        setWords(cachedWords);
        if (!forceCloudSync) setLoading(false);
      } else {
        setWords([]);
      }
    } catch (err) {
      console.warn('IDB read warning:', err);
    }

    // 2. Background Revalidation from Cloud API scoped to active language
    if (user && !isGuest) {
      try {
        const [cloudDecksRes, cloudWordsRes] = await Promise.allSettled([
          api.get('/community/my-decks', { params: { languageId: activeLanguage.id } }),
          api.get('/community/my-words', { params: { languageId: activeLanguage.id } }),
        ]);

        let updatedDecks: LocalDeck[] = [];
        if (cloudDecksRes.status === 'fulfilled' && Array.isArray(cloudDecksRes.value)) {
          const apiDecks: LocalDeck[] = cloudDecksRes.value.map((d: any) => ({
            id: d.id,
            userId: currentUserId,
            languageId: activeLanguage.id,
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
            isCloned: Boolean(d.isCloned),
            isReadOnly: Boolean(d.isReadOnly),
            author: d.author,
          }));

          // Merge local-only decks strictly belonging to this user and language
          const apiIds = new Set(apiDecks.map((cd) => cd.id));
          const localOnly = cachedDecks.filter((ld) => {
            if (!ld || !ld.id) return false;
            if (ld.userId !== currentUserId) return false;
            if (ld.isSyncedToCloud) return false;
            if (apiIds.has(ld.id)) return false;
            if (ld.originDeckId && apiIds.has(ld.originDeckId)) return false;
            if (ld.id.startsWith('cloned_') && apiIds.has(ld.id.replace('cloned_', ''))) return false;
            return true;
          });

          // Strict canonical deduplication
          const seenCanonical = new Set<string>();
          updatedDecks = [];
          for (const d of [...apiDecks, ...localOnly]) {
            const canonicalKey = d.originDeckId || (d.id?.startsWith('cloned_') ? d.id.replace('cloned_', '') : d.id);
            if (!seenCanonical.has(canonicalKey)) {
              seenCanonical.add(canonicalKey);
              updatedDecks.push(d);
            }
          }
          setDecks(updatedDecks);

          for (const d of updatedDecks) {
            await idbSaveLocalDeck(d, currentUserId);
          }
        }

        if (cloudWordsRes.status === 'fulfilled' && Array.isArray(cloudWordsRes.value)) {
          const cloudWords = cloudWordsRes.value.map((item: any) => {
            const rawTopic = item.topic || item.vocabulary?.topic || 'General';
            return {
              id: item.id,
              userId: currentUserId,
              languageId: activeLanguage.id,
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
              vocabulary: {
                ...item.vocabulary,
                languageId: activeLanguage.id,
              },
              createdAt: new Date(item.createdAt || Date.now()).getTime(),
            };
          });

          if (cloudWords.length > 0) {
            setWords(cloudWords);
            if (forceCloudSync) {
              setIdbSyncMsg(`Đang lưu ${cloudWords.length} từ vào IndexedDB...`);
            }
            await idbSaveWords(cloudWords, currentUserId, (saved, total) => {
              if (forceCloudSync) {
                setIdbSyncMsg(`Đang lưu IndexedDB: ${saved}/${total} từ (${Math.round((saved / total) * 100)}%)...`);
              }
            });
            setIdbSyncMsg(null);
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
    // Zero stale leakage when switching users or learning language
    setDecks([]);
    setWords([]);
    setSelectedDeck(null);
    setSelectedDeckIds([]);
    setUnlockedPersonalDeckIds({});
    loadData();
  }, [user?.id, activeLanguage.id]);

  // Synchronize Favorite IDs with localStorage
  useEffect(() => {
    localStorage.setItem('vocabflow_favorites', JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  // Multi-Language Native Browser Speech
  const handlePlayAudio = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    audioEngine.playWord(text, { lang: activeLanguage.speechLocale });
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

  // Filtered decks for Deck Management Tab with Category, CEFR & Sorting
  const filteredDecks = useMemo(() => {
    let list = deckListWithStats.filter((deck) => {
      const q = deckSearch.toLowerCase().trim();
      const matchesSearch = !q || deck.title.toLowerCase().includes(q) || (deck.description || '').toLowerCase().includes(q);
      const matchesCat = deckCategoryFilter === 'ALL' || (deck.category || 'General').toLowerCase() === deckCategoryFilter.toLowerCase();
      const matchesCefr = deckCefrFilter === 'ALL' || (deck.cefrLevel || 'B1').toUpperCase() === deckCefrFilter.toUpperCase();
      return matchesSearch && matchesCat && matchesCefr;
    });

    list.sort((a, b) => {
      if (deckSort === 'az') return a.title.localeCompare(b.title);
      if (deckSort === 'za') return b.title.localeCompare(a.title);
      if (deckSort === 'words_desc') return (b.computedWordCount || 0) - (a.computedWordCount || 0);
      if (deckSort === 'progress_desc') return (b.percentMastered || 0) - (a.percentMastered || 0);
      if (deckSort === 'oldest') return (a.createdAt || 0) - (b.createdAt || 0);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    return list;
  }, [deckListWithStats, deckSearch, deckCategoryFilter, deckCefrFilter, deckSort]);

  // Grouped decks by category for hierarchical organization
  const decksGroupedByCategory = useMemo(() => {
    const groups: { [cat: string]: typeof filteredDecks } = {};
    filteredDecks.forEach((deck) => {
      const cat = deck.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(deck);
    });
    return groups;
  }, [filteredDecks]);

  // Count of decks per category (across all user's decks)
  const deckCategoryCounts = useMemo(() => {
    const counts: { [cat: string]: number } = {};
    deckListWithStats.forEach((d) => {
      const cat = d.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [deckListWithStats]);

  // Infinite Scroll & Lazy Loading for Decks (Smooth 0ms FPS)
  // Virtual List Windowing for Decks (Table: 56px, Grid: 240px)
  const virtualDecksTable = useVirtualList({
    items: filteredDecks,
    itemHeight: 56,
    columns: 1,
    overscan: 4,
  });

  const virtualDecksGrid = useVirtualList({
    items: filteredDecks,
    itemHeight: 240,
    columns: (w) => (w < 768 ? 1 : w < 1024 ? 2 : 3),
    overscan: 3,
  });

  // Create Deck
  const handleConfirmCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckTitleInput.trim() || creatingDeck) return;
    setCreatingDeck(true);

    try {
      const currentUserId = user?.id || (isGuest ? 'guest' : 'unknown');
      const targetLangId = deckLangInput || activeLanguage.id;
      const newDeckId = `deck_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newDeck: LocalDeck = {
        id: newDeckId,
        userId: currentUserId,
        languageId: targetLangId,
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
      await idbSaveLocalDeck(newDeck, currentUserId);
      setDecks((prev) => [newDeck, ...prev]);

      // 2. Sync to Cloud API if authenticated
      if (user && !isGuest) {
        try {
          const res: any = await api.post('/community/decks', {
            title: newDeck.title,
            description: newDeck.description,
            category: newDeck.category,
            cefrLevel: newDeck.cefrLevel,
            languageId: targetLangId,
            isPublic: true,
            password: newDeck.password,
            words: [],
          });
          if (res?.id) {
            newDeck.id = res.id;
            newDeck.isSyncedToCloud = true;
            await idbSaveLocalDeck(newDeck, currentUserId);
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
    } finally {
      setCreatingDeck(false);
    }
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
    setDeckStatusInput(deck.status === 'APPROVED' ? 'APPROVED' : (deck.status === 'PENDING' ? 'PENDING' : 'PRIVATE'));
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
      status: deckStatusInput,
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
          status: deckStatusInput === 'PENDING' ? 'PENDING' : undefined,
          isPublic: deckStatusInput !== 'PRIVATE',
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

  // Delete Deck (Owner has absolute right to delete even if pending)
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

  // Gỡ kho khỏi Cloud (Chuyển về trạng thái lưu trữ offline trên máy)
  const handleUnlinkFromCloud = async (deck: LocalDeck, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!deck.isSyncedToCloud) return;

    const ok = await confirmModal({
      title: 'Gỡ kho khỏi Cloud',
      message: `Bạn có chắc chắn muốn gỡ kho "${deck.title}" khỏi Cloud?\n\nKho sẽ được giữ lại an toàn ở chế độ Offline trên máy của bạn và gỡ bỏ hoàn toàn khỏi máy chủ/cộng đồng.`,
      type: 'warning',
      confirmText: 'Gỡ khỏi Cloud',
      cancelText: 'Giữ lại',
    });
    if (!ok) return;

    try {
      if (user && !isGuest) {
        await api.delete(`/community/decks/${deck.id}`).catch(() => {});
      }
      const updatedDeck: LocalDeck = {
        ...deck,
        isSyncedToCloud: false,
        status: 'DRAFT',
        updatedAt: Date.now(),
      };
      await idbUpdateLocalDeck(deck.id, { isSyncedToCloud: false, status: 'DRAFT' });
      setDecks((prev) => prev.map((d) => (d.id === deck.id ? updatedDeck : d)));
      if (selectedDeck?.id === deck.id) {
        setSelectedDeck(updatedDeck);
      }
      setActionSuccessMsg(`Đã gỡ kho "${deck.title}" khỏi Cloud thành công! Kho hiện lưu an toàn trên máy.`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err: any) {
      alert('Không thể gỡ kho khỏi Cloud: ' + (err.message || err));
    }
  };

  // Synchronize route deckId with selectedDeck state
  useEffect(() => {
    if (!loading) {
      if (routeDeckId) {
        const targetDeck = decks.find(
          (d) =>
            String(d.id) === String(routeDeckId) ||
            String(d.originDeckId) === String(routeDeckId) ||
            String(d.id).replace(/^cloned_/, '') === String(routeDeckId).replace(/^cloned_/, '')
        );
        if (targetDeck) {
          setSelectedDeck(targetDeck);
          setSelectedWordIds([]);
        } else {
          // If not in local decks, try loading from community/cloud API
          let isSubscribed = true;
          (async () => {
            try {
              const res: any = await api.get(`/community/decks/${routeDeckId}`);
              const fetchedDeck = res?.data || res?.deck || res;
              if (isSubscribed && fetchedDeck && fetchedDeck.id) {
                setSelectedDeck(fetchedDeck);
                setSelectedWordIds([]);
                return;
              }
            } catch (err) {
              console.warn('Could not load deck by routeDeckId:', err);
            }
            if (isSubscribed) {
              navigate('/word-bank', { replace: true });
            }
          })();
          return () => {
            isSubscribed = false;
          };
        }
      } else {
        setSelectedDeck(null);
        setSelectedWordIds([]);
      }
    }
  }, [routeDeckId, decks, loading]);

  // Open deck or run action with password check for protected/cloned decks
  const handleOpenDeckOrAction = (deck: LocalDeck, action?: () => void) => {
    const isProtected = Boolean(deck.isProtected || deck.hasPassword || (deck as any).requiresPassword || (deck as any).isLocked);
    const isAuthor = user && (deck.userId === user.id || (deck as any).author?.id === user.id);
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    const isUnlocked = unlockedPersonalDeckIds[deck.id] || (deck.originDeckId && unlockedPersonalDeckIds[deck.originDeckId]) || unlockedPersonalDeckIds[String(deck.id).replace(/^cloned_/, '')];

    if (action) {
      if (isProtected && !isAuthor && !isAdmin && !isUnlocked) {
        setDeckToUnlock(deck);
        setDeckUnlockInput('');
        setDeckUnlockError(null);
        setPendingDeckAction(() => () => {
          action();
        });
        return;
      }
      action();
      return;
    }

    // Default action: Open deck detail view (If protected and locked, in-place lock screen will render securely)
    setSelectedDeck(deck);
    setSelectedWordIds([]);
    navigate(`/word-bank/${deck.id}`);
  };

  const handleUnlockPersonalDeckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckToUnlock || !deckUnlockInput.trim()) return;
    setDeckUnlocking(true);
    setDeckUnlockError(null);

    try {
      const pass = deckUnlockInput.trim();
      const remoteId = deckToUnlock.originDeckId || deckToUnlock.id;
      let unlockedDeckData: any = null;

      try {
        const res: any = await api.post(`/community/decks/${remoteId}/unlock`, { password: pass });
        if (res?.success) {
          unlockedDeckData = res.deck;
        } else {
          throw new Error(res?.message || 'Mật khẩu kho từ không chính xác!');
        }
      } catch (remoteErr: any) {
        if (deckToUnlock.password && deckToUnlock.password === pass) {
          unlockedDeckData = deckToUnlock;
        } else {
          throw remoteErr;
        }
      }

      const unlockedDeck = unlockedDeckData || deckToUnlock;
      const deckId = deckToUnlock.id;
      saveSessionUnlockedDeck(deckId);
      if (deckToUnlock.originDeckId) saveSessionUnlockedDeck(deckToUnlock.originDeckId);
      saveSessionUnlockedDeck(String(deckId).replace(/^cloned_/, ''));

      setUnlockedPersonalDeckIds((prev) => ({
        ...prev,
        [deckId]: true,
        ...(deckToUnlock.originDeckId ? { [deckToUnlock.originDeckId]: true } : {}),
        [String(deckId).replace(/^cloned_/, '')]: true,
      }));
      const callback = pendingDeckAction;
      setDeckToUnlock(null);
      setPendingDeckAction(null);
      setSelectedDeck(unlockedDeck);
      setSelectedWordIds([]);
      setDeckUnlockInput('');
      setDeckUnlockError(null);
      if (callback) {
        callback();
      } else {
        navigate(`/word-bank/${unlockedDeck.id}`);
      }
    } catch (err: any) {
      setDeckUnlockError(err?.response?.data?.message || err?.message || 'Mật khẩu kho từ không chính xác!');
    } finally {
      setDeckUnlocking(false);
    }
  };

  // Secure In-Place Unlock handler when viewing locked deck page
  const handleUnlockCurrentDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeck || !deckUnlockInput.trim()) return;
    setDeckUnlocking(true);
    setDeckUnlockError(null);

    try {
      const pass = deckUnlockInput.trim();
      const remoteId = selectedDeck.originDeckId || selectedDeck.id;
      let unlockedDeckData: any = null;

      try {
        const res: any = await api.post(`/community/decks/${remoteId}/unlock`, { password: pass });
        if (res?.success) {
          unlockedDeckData = res.deck;
        } else {
          throw new Error(res?.message || 'Mật khẩu kho từ không chính xác!');
        }
      } catch (remoteErr: any) {
        if (selectedDeck.password && selectedDeck.password === pass) {
          unlockedDeckData = selectedDeck;
        } else {
          throw remoteErr;
        }
      }

      const unlockedDeck = unlockedDeckData || selectedDeck;
      const deckId = selectedDeck.id;
      saveSessionUnlockedDeck(deckId);
      if (selectedDeck.originDeckId) saveSessionUnlockedDeck(selectedDeck.originDeckId);
      saveSessionUnlockedDeck(String(deckId).replace(/^cloned_/, ''));

      setUnlockedPersonalDeckIds((prev) => ({
        ...prev,
        [deckId]: true,
        ...(selectedDeck.originDeckId ? { [selectedDeck.originDeckId]: true } : {}),
        [String(deckId).replace(/^cloned_/, '')]: true,
      }));
      setSelectedDeck(unlockedDeck);
      setSelectedWordIds([]);
      setDeckUnlockInput('');
      setDeckUnlockError(null);
      setActionSuccessMsg(`Đã mở khóa thành công kho từ "${unlockedDeck.title}"!`);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err: any) {
      setDeckUnlockError(err?.response?.data?.message || err?.message || 'Mật khẩu kho từ không chính xác!');
    } finally {
      setDeckUnlocking(false);
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

  // Helper to determine if the currently active deck is locked and requires password authentication
  const isSelectedDeckLocked = useMemo(() => {
    if (!selectedDeck) return false;
    const isProtected = Boolean(
      selectedDeck.isProtected ||
      selectedDeck.hasPassword ||
      (selectedDeck as any).requiresPassword ||
      (selectedDeck as any).isLocked
    );
    if (!isProtected) return false;

    // Author or admin can always access
    const isAuthor = user && (selectedDeck.userId === user.id || (selectedDeck as any).author?.id === user.id);
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    if (isAuthor || isAdmin) return false;

    // Check if unlocked in session
    const idKey = selectedDeck.id;
    const originKey = selectedDeck.originDeckId;
    const cleanKey = String(selectedDeck.id).replace(/^cloned_/, '');
    if (
      unlockedPersonalDeckIds[idKey] ||
      (originKey && unlockedPersonalDeckIds[originKey]) ||
      unlockedPersonalDeckIds[cleanKey]
    ) {
      return false;
    }

    return true;
  }, [selectedDeck, unlockedPersonalDeckIds, user]);

  // Words inside currently opened deck (Protected decks strictly return [] if locked)
  const wordsInSelectedDeck = useMemo(() => {
    if (!selectedDeck || isSelectedDeckLocked) return [];
    const directWords = words.filter(
      (w) =>
        w.deckId === selectedDeck.id ||
        (selectedDeck.originDeckId && w.deckId === selectedDeck.originDeckId) ||
        (w.deckName && w.deckName === selectedDeck.title)
    );
    if (directWords.length > 0) return directWords;
    if (Array.isArray(selectedDeck.words) && selectedDeck.words.length > 0) {
      return selectedDeck.words.map((w: any) => ({
        ...w,
        deckId: selectedDeck.id,
        deckName: selectedDeck.title,
      }));
    }
    return [];
  }, [words, selectedDeck, isSelectedDeckLocked]);

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
      const itemTopic = item.topic || item.vocabulary?.topic || 'General';
      const itemPos = (item.partOfSpeech || item.vocabulary?.partOfSpeech || 'noun').toLowerCase();
      const itemCefr = (item.cefrLevel || item.vocabulary?.cefrLevel || 'B1').toUpperCase();

      const matchesSearch =
        !q ||
        (item.word || '').toLowerCase().includes(q) ||
        (item.meaning || '').toLowerCase().includes(q) ||
        (item.phonetic || '').toLowerCase().includes(q) ||
        itemTopic.toLowerCase().includes(q);

      const matchesTopic = deckWordTopicFilter === 'ALL' || itemTopic === deckWordTopicFilter;
      const matchesPos = deckWordPosFilter === 'ALL' || itemPos === deckWordPosFilter.toLowerCase();
      const matchesCefr = deckWordCefrFilter === 'ALL' || itemCefr === deckWordCefrFilter;

      const isFav = favoriteIds.includes(item.id) || item.isFavorite;
      const matchesStatus =
        deckWordStatusFilter === 'ALL' ||
        (deckWordStatusFilter === 'FAVORITES' && isFav) ||
        (deckWordStatusFilter === 'LEARNING' && (item.status === 'LEARNING' || item.status === 'NEW' || !item.status)) ||
        (deckWordStatusFilter === 'MASTERED' && item.status === 'MASTERED');

      return matchesSearch && matchesTopic && matchesPos && matchesCefr && matchesStatus;
    }).sort((a, b) => {
      if (deckWordSortCol) {
        let valA = '';
        let valB = '';
        if (deckWordSortCol === 'word') {
          valA = (a.word || '').toLowerCase();
          valB = (b.word || '').toLowerCase();
        } else if (deckWordSortCol === 'meaning') {
          valA = (a.meaning || '').toLowerCase();
          valB = (b.meaning || '').toLowerCase();
        } else if (deckWordSortCol === 'topic') {
          valA = (a.topic || a.vocabulary?.topic || 'General').toLowerCase();
          valB = (b.topic || b.vocabulary?.topic || 'General').toLowerCase();
        } else if (deckWordSortCol === 'cefr') {
          valA = (a.cefrLevel || a.vocabulary?.cefrLevel || 'B1').toUpperCase();
          valB = (b.cefrLevel || b.vocabulary?.cefrLevel || 'B1').toUpperCase();
        } else if (deckWordSortCol === 'status') {
          valA = a.status || 'NEW';
          valB = b.status || 'NEW';
        }
        const cmp = valA.localeCompare(valB);
        return deckWordSortDir === 'asc' ? cmp : -cmp;
      }
      if (deckWordSort === 'az') return (a.word || '').localeCompare(b.word || '');
      if (deckWordSort === 'za') return (b.word || '').localeCompare(a.word || '');
      if (deckWordSort === 'oldest') return (a.createdAt || 0) - (b.createdAt || 0);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [wordsInSelectedDeck, deckWordSearch, deckWordTopicFilter, deckWordPosFilter, deckWordCefrFilter, deckWordStatusFilter, deckWordSort, deckWordSortCol, deckWordSortDir, favoriteIds]);

  // Learning Progress Stats inside Opened Deck
  const deckLearningStats = useMemo(() => {
    const total = wordsInSelectedDeck.length;
    const mastered = wordsInSelectedDeck.filter((w) => w.status === 'MASTERED').length;
    const learning = wordsInSelectedDeck.filter(
      (w) => w.status === 'LEARNING' || w.status === 'NEW' || !w.status
    ).length;
    const needsReview = wordsInSelectedDeck.filter((w) => w.status !== 'MASTERED').length;
    const percent = total > 0 ? Math.round((mastered / total) * 100) : 0;
    return { total, mastered, learning, needsReview, percent };
  }, [wordsInSelectedDeck]);

  // Virtual List Windowing for Words inside Deck (Table: 52px, Grid: 220px)
  const virtualDeckWordsTable = useVirtualList({
    items: filteredWordsInDeck,
    itemHeight: 52,
    columns: 1,
    overscan: 5,
  });

  const virtualDeckWordsGrid = useVirtualList({
    items: filteredWordsInDeck,
    itemHeight: 220,
    columns: (w) => (w < 640 ? 1 : w < 1024 ? 2 : w < 1280 ? 3 : 4),
    overscan: 3,
  });

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

    const currentUserId = user?.id || (isGuest ? 'guest' : 'unknown');
    const id = `word_${cleanW.replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
    const newWordItem = {
      id,
      userId: currentUserId,
      languageId: activeLanguage.id,
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
        languageId: activeLanguage.id,
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
    await idbSaveWords([newWordItem], currentUserId);
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
          languageId: activeLanguage.id,
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

  // Bulk Mark Mastered for Selected Words
  const handleBulkMarkMastered = async () => {
    if (selectedWordIds.length === 0) return;
    try {
      const updated = words.map((w) =>
        selectedWordIds.includes(w.id) ? { ...w, status: 'MASTERED' as const } : w
      );
      setWords(updated);
      for (const id of selectedWordIds) {
        await idbUpdateWord(id, { status: 'MASTERED' });
      }
      setActionSuccessMsg(`Đã đánh dấu ${selectedWordIds.length} từ vựng là "Đã thuộc"!`);
      setSelectedWordIds([]);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Error marking words mastered:', err);
    }
  };

  // Bulk Assign Topic for Selected Words
  const handleBulkAssignTopic = async (topicName: string) => {
    const trimmed = topicName.trim();
    if (!trimmed || selectedWordIds.length === 0) return;
    try {
      const updated = words.map((w) =>
        selectedWordIds.includes(w.id) ? { ...w, topic: trimmed } : w
      );
      setWords(updated);
      for (const id of selectedWordIds) {
        await idbUpdateWord(id, { topic: trimmed });
      }
      setActionSuccessMsg(`Đã gắn chủ đề "${trimmed}" cho ${selectedWordIds.length} từ vựng!`);
      setSelectedWordIds([]);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Error assigning topic:', err);
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

  const handleAddManualPreviewWord = () => {
    const newItem: ParsedWordItem = {
      word: '',
      phonetic: '',
      partOfSpeech: 'noun',
      meaning: '',
      example: '',
      exampleTranslation: '',
      topic: 'General',
      cefrLevel: 'B1',
    };
    setParsedWords((prev) => [newItem, ...prev]);
    setEditingParsedIdx(0);
    setEditingParsedItem(newItem);
  };

  const handleStartEditParsed = (idx: number) => {
    setEditingParsedIdx(idx);
    setEditingParsedItem({ ...parsedWords[idx] });
  };

  const handleSaveEditParsed = (idx: number) => {
    if (!editingParsedItem) return;
    setParsedWords((prev) => prev.map((item, i) => (i === idx ? editingParsedItem : item)));
    setEditingParsedIdx(null);
    setEditingParsedItem(null);
  };

  const handleCancelEditParsed = () => {
    if (editingParsedIdx !== null) {
      const cur = parsedWords[editingParsedIdx];
      if (cur && !cur.word?.trim() && !cur.meaning?.trim()) {
        setParsedWords((prev) => prev.filter((_, i) => i !== editingParsedIdx));
      }
    }
    setEditingParsedIdx(null);
    setEditingParsedItem(null);
  };

  const handleDeleteParsed = (idx: number) => {
    setParsedWords((prev) => prev.filter((_, i) => i !== idx));
    if (editingParsedIdx === idx) {
      setEditingParsedIdx(null);
      setEditingParsedItem(null);
    } else if (editingParsedIdx !== null && editingParsedIdx > idx) {
      setEditingParsedIdx(editingParsedIdx - 1);
    }
  };

  const handleClearAllParsed = () => {
    setParsedWords([]);
    setSelectedFile(null);
    setEditingParsedIdx(null);
    setEditingParsedItem(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
        ? (deckTitleInput.trim() || importTargetDeckName.trim() || 'Custom Word Deck')
        : selectedDeck?.title || importTargetDeckName || decks[0]?.title || 'General';

    const currentUserId = user?.id || (isGuest ? 'guest' : 'unknown');

    // Check or create deck for imported words with full security & metadata
    let deckObj = decks.find((d) => d.title === targetDeckTitle);
    if (!deckObj || importDeckMode === 'new') {
      const newDeckId = `deck_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const hasPass = Boolean(deckPasswordInput.trim());
      deckObj = {
        id: newDeckId,
        userId: currentUserId,
        languageId: activeLanguage.id,
        title: targetDeckTitle,
        description: deckDescInput.trim() || undefined,
        category: deckCatInput || 'Business English',
        cefrLevel: deckCefrInput || 'B1',
        wordCount: validWords.length,
        isProtected: hasPass,
        hasPassword: hasPass,
        password: hasPass ? deckPasswordInput.trim() : undefined,
        status: 'APPROVED',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isSyncedToCloud: false,
      };
      await idbSaveLocalDeck(deckObj, currentUserId);
      setDecks((prev) => [deckObj!, ...prev]);
    } else {
      // Existing deck: verify password protection if configured
      if (deckObj.hasPassword || deckObj.isProtected) {
        const sessionUnlocked = getSessionUnlockedDecks();
        const isUnlocked = sessionUnlocked.includes(deckObj.id);
        if (!isUnlocked && deckObj.password && deckObj.password !== importExistingDeckPass.trim()) {
          setParsingError('Mật khẩu mở khóa kho từ này không chính xác! Vui lòng nhập đúng mật khẩu để nạp từ.');
          setIsImporting(false);
          return;
        }
      }
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
          userId: currentUserId,
          languageId: activeLanguage.id,
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
            languageId: activeLanguage.id,
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

      // 1. Immediately save to IndexedDB with chunking and progress
      setImportProgressMsg(`Đang lưu vào bộ nhớ máy (IndexedDB): 0/${itemsToSave.length} từ...`);
      await idbSaveWords(itemsToSave, currentUserId, (saved, total) => {
        const pct = Math.round((saved / total) * 100);
        setImportProgressMsg(`Đang lưu vào bộ nhớ máy (IndexedDB): ${saved}/${total} từ (${pct}%)...`);
      });

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
          const currentCount = Math.min(i + CHUNK_SIZE, payload.length);
          const pct = Math.round((currentCount / payload.length) * 100);
          setImportProgressMsg(`Đang đồng bộ Đám mây: ${currentCount}/${payload.length} từ (${pct}%)...`);
          const chunk = payload.slice(i, i + CHUNK_SIZE);
          try {
            await api.post('/community/words/batch-add', { words: chunk });
          } catch (netErr) {
            console.warn('Batch import cloud notice (safely saved in IndexedDB):', netErr);
          }
        }
      }

      setImportProgressMsg(null);
      setShowImportModal(false);
      setShowCreateDeckModal(false);
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

  // Filtered words for "Tất cả từ" Tab with POS and Sorting
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

      const itemPos = (item.partOfSpeech || item.vocabulary?.partOfSpeech || 'noun').toLowerCase();
      const matchesPos = allWordPosFilter === 'ALL' || itemPos === allWordPosFilter.toLowerCase();

      const isFav = favoriteIds.includes(item.id) || item.isFavorite;
      const matchesStatus =
        allWordStatusFilter === 'ALL' ||
        (allWordStatusFilter === 'FAVORITES' && isFav) ||
        (allWordStatusFilter === 'LEARNING' && (item.status === 'LEARNING' || item.status === 'NEW' || !item.status)) ||
        (allWordStatusFilter === 'MASTERED' && item.status === 'MASTERED');

      return matchesSearch && matchesTopic && matchesCefr && matchesPos && matchesStatus;
    }).sort((a, b) => {
      if (allWordSortCol) {
        let valA = '';
        let valB = '';
        if (allWordSortCol === 'word') {
          valA = (a.word || '').toLowerCase();
          valB = (b.word || '').toLowerCase();
        } else if (allWordSortCol === 'meaning') {
          valA = (a.meaning || '').toLowerCase();
          valB = (b.meaning || '').toLowerCase();
        } else if (allWordSortCol === 'deck') {
          valA = (a.deckName || '').toLowerCase();
          valB = (b.deckName || '').toLowerCase();
        } else if (allWordSortCol === 'topic') {
          valA = (a.topic || a.vocabulary?.topic || 'General').toLowerCase();
          valB = (b.topic || b.vocabulary?.topic || 'General').toLowerCase();
        } else if (allWordSortCol === 'cefr') {
          valA = (a.cefrLevel || a.vocabulary?.cefrLevel || 'B1').toUpperCase();
          valB = (b.cefrLevel || b.vocabulary?.cefrLevel || 'B1').toUpperCase();
        } else if (allWordSortCol === 'status') {
          valA = a.status || 'NEW';
          valB = b.status || 'NEW';
        }
        const cmp = valA.localeCompare(valB);
        return allWordSortDir === 'asc' ? cmp : -cmp;
      }
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [words, allWordSearch, allWordTopicFilter, allWordCefrFilter, allWordPosFilter, allWordStatusFilter, allWordSortCol, allWordSortDir, favoriteIds]);

  // Virtual List Windowing for All Words Tab (Table: 52px, Grid: 220px)
  const virtualAllWordsTable = useVirtualList({
    items: allFilteredWords,
    itemHeight: 52,
    columns: 1,
    overscan: 5,
  });

  const virtualAllWordsGrid = useVirtualList({
    items: allFilteredWords,
    itemHeight: 220,
    columns: (w) => (w < 640 ? 1 : w < 1024 ? 2 : w < 1280 ? 3 : 4),
    overscan: 3,
  });

  // Sorting handlers for interactive table headers
  const handleToggleDeckWordSort = (col: 'word' | 'meaning' | 'topic' | 'cefr' | 'status') => {
    if (deckWordSortCol === col) {
      if (deckWordSortDir === 'asc') {
        setDeckWordSortDir('desc');
      } else {
        setDeckWordSortCol(null);
        setDeckWordSortDir('asc');
      }
    } else {
      setDeckWordSortCol(col);
      setDeckWordSortDir('asc');
    }
  };

  const handleToggleAllWordSort = (col: 'word' | 'meaning' | 'deck' | 'topic' | 'cefr' | 'status') => {
    if (allWordSortCol === col) {
      if (allWordSortDir === 'asc') {
        setAllWordSortDir('desc');
      } else {
        setAllWordSortCol(null);
        setAllWordSortDir('asc');
      }
    } else {
      setAllWordSortCol(col);
      setAllWordSortDir('asc');
    }
  };

  // Helper to render neat, color-coded Part of Speech badge
  const renderPosBadge = (pos?: string) => {
    if (!pos) return null;
    const p = pos.toLowerCase().trim();
    if (p.includes('noun') || p === 'n') {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
          n.
        </span>
      );
    }
    if (p.includes('verb') || p === 'v') {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
          v.
        </span>
      );
    }
    if (p.includes('adj') || p === 'a') {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0">
          adj.
        </span>
      );
    }
    if (p.includes('adv')) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
          adv.
        </span>
      );
    }
    if (p.includes('phrase') || p.includes('idiom')) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shrink-0">
          {p.includes('idiom') ? 'idm.' : 'phr.'}
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
        {p}
      </span>
    );
  };

  // Single Deck Table Row Renderer (used by both flat list and grouped by category in List view)
  const renderSingleDeckTableRow = (deck: any) => {
    const isSelected = selectedDeckIds.includes(deck.id);
    return (
      <tr
        key={deck.id}
        className={`hover:bg-indigo-50/30 dark:hover:bg-slate-800/40 transition duration-150 cv-auto-row ${
          isSelected ? 'bg-indigo-50/20 dark:bg-indigo-950/20' : ''
        }`}
      >
        <td className="py-3 px-4">
          <button
            onClick={() =>
              setSelectedDeckIds((prev) =>
                prev.includes(deck.id) ? prev.filter((id) => id !== deck.id) : [...prev, deck.id]
              )
            }
            className="p-0.5 text-slate-400 hover:text-indigo-600 transition"
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-indigo-600" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>
        </td>
        <td className="py-3 px-4">
          <div
            onClick={() => handleOpenDeckOrAction(deck)}
            className="cursor-pointer group flex items-start gap-2.5"
          >
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform shrink-0">
              <Folder className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition truncate max-w-xs sm:max-w-md">
                {deck.title}
              </div>
              {deck.description && (
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{deck.description}</p>
              )}
            </div>
          </div>
        </td>
        <td className="py-3 px-3 whitespace-nowrap">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold border border-slate-200 dark:border-slate-700">
            {deck.category || 'General'}
          </span>
        </td>
        <td className="py-3 px-3 text-center whitespace-nowrap">
          <span className="inline-flex items-center px-2 py-0.5 rounded font-black text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {deck.cefrLevel || 'B1'}
          </span>
        </td>
        <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
          {deck.computedWordCount} từ
        </td>
        <td className="py-3 px-4 min-w-[140px]">
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-500">
              <span>{deck.masteredCount} từ</span>
              <span className="text-indigo-600 dark:text-indigo-400">{deck.percentMastered}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
                style={{ width: `${deck.percentMastered}%` }}
              />
            </div>
          </div>
        </td>
        <td className="py-3 px-3 text-center whitespace-nowrap">
          <div className="inline-flex items-center gap-1">
            {deck.isSyncedToCloud ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 inline-flex items-center gap-1">
                <CloudUpload className="w-2.5 h-2.5" />
                <span>Cloud</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold border border-slate-200 inline-flex items-center gap-1">
                <HardDrive className="w-2.5 h-2.5" />
                <span>Local</span>
              </span>
            )}
            {deck.status === 'PENDING' && (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200">
                Chờ duyệt
              </span>
            )}
            {deck.hasPassword && (
              <span className="p-1 rounded bg-amber-50 dark:bg-amber-950 text-amber-600" title="Có mật khẩu bảo vệ">
                <Lock className="w-2.5 h-2.5" />
              </span>
            )}
          </div>
        </td>
        <td className="py-3 px-4 text-right whitespace-nowrap">
          <div className="inline-flex items-center justify-end gap-1.5">
            <button
              onClick={() => handleOpenDeckOrAction(deck)}
              className="btn-glass-primary btn-glass-sm text-xs font-semibold"
              title="Xem và quản lý từ trong kho"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem từ</span>
            </button>
            <button
              onClick={() => handleOpenDeckOrAction(deck, () => navigate(`/review?deckId=${encodeURIComponent(deck.id)}&topic=${encodeURIComponent(deck.title)}`))}
              className="btn-glass-primary btn-glass-sm text-xs font-semibold"
              title="Ôn tập kho này"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Ôn tập</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const deckWords = words.filter((w) => w.deckId === deck.id || w.deckName === deck.title);
                exportWordsToExcelOrCsv(deckWords, `kho_${deck.title}`, 'xlsx');
              }}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
              title="Tải Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const deckWords = words.filter((w) => w.deckId === deck.id || w.deckName === deck.title);
                exportWordsToExcelOrCsv(deckWords, `kho_${deck.title}`, 'csv');
              }}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
              title="Tải CSV (.csv)"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
            </button>
            {!deck.isReadOnly && (
              <>
                <button
                  onClick={(e) => handleUploadDeckToCloud(deck, e)}
                  disabled={syncingDeckId === deck.id}
                  className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    deck.isSyncedToCloud
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80'
                      : 'bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80'
                  }`}
                  title={
                    deck.isSyncedToCloud
                      ? 'Kho đã đồng bộ lên Cloud (Bấm để đồng bộ lại nếu vừa sửa từ)'
                      : 'Kho chưa đồng bộ - Nhấn để đẩy kho này lên Cloud'
                  }
                >
                  {syncingDeckId === deck.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : deck.isSyncedToCloud ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[10px]">Đã đồng bộ</span>
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-[10px]">Đồng bộ</span>
                    </>
                  )}
                </button>
                <button
                  onClick={(e) => handleOpenEditDeck(deck, e)}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 transition"
                  title="Sửa thông tin kho"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                {deck.isSyncedToCloud && (
                  <button
                    onClick={(e) => handleUnlinkFromCloud(deck, e)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-amber-600 transition"
                    title="Gỡ kho khỏi Cloud (Lưu về máy)"
                  >
                    <CloudUpload className="w-3.5 h-3.5 rotate-180" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShareModalDeck(deck);
                    setSharePassword('');
                  }}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-slate-700 text-purple-600 transition"
                  title="Chia sẻ kho này"
                >
                  <Share2 className="w-3.5 h-3.5 text-purple-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeckToDelete(deck);
                  }}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 text-slate-400 hover:text-rose-600 transition"
                  title="Xóa kho"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // Single Deck Card Renderer (used by both flat grid and grouped by category)
  const renderSingleDeckCard = (deck: any) => {
    const isSelected = selectedDeckIds.includes(deck.id);
    return (
      <div
        key={deck.id}
        onClick={() => handleOpenDeckOrAction(deck)}
        className={`p-5 flex flex-col justify-between space-y-4 rounded-2xl bg-white dark:bg-slate-900 border transition duration-150 shadow-xs hover:shadow-md cursor-pointer ${
          isSelected
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20'
            : 'border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40'
        }`}
      >
        <div>
          {/* Top Bar: Checkbox + Tags */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDeckIds((prev) =>
                    prev.includes(deck.id) ? prev.filter((id) => id !== deck.id) : [...prev, deck.id]
                  );
                }}
                className="p-1 text-slate-400 hover:text-indigo-600 transition"
              >
                {isSelected ? (
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>

              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60">
                {deck.cefrLevel || 'B1'}
              </span>

              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {deck.category || 'General'}
              </span>

              {/* Cloud / Local Sync Badge */}
              {deck.isSyncedToCloud ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-200 dark:border-emerald-800">
                  <CloudUpload className="w-2.5 h-2.5" />
                  <span>Cloud</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-extrabold border border-slate-200 dark:border-slate-700">
                  <HardDrive className="w-2.5 h-2.5" />
                  <span>Local</span>
                </span>
              )}

              {deck.hasPassword && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold border border-amber-200">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Khóa</span>
                </span>
              )}

              {deck.isReadOnly && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-extrabold border border-purple-200 dark:border-purple-800">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Clone (Chỉ đọc)</span>
                </span>
              )}
            </div>

            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 whitespace-nowrap pt-0.5">
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

          {(deck.authorName || deck.sourceName || deck.isReadOnly) && (
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                Nguồn: {deck.sourceName || (deck.isReadOnly ? 'Cộng đồng' : 'Cá nhân')}
              </span>
              {deck.authorName && (
                <span>• Tác giả: <strong className="text-slate-700 dark:text-slate-300">{deck.authorName}</strong></span>
              )}
            </div>
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
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDeckOrAction(deck);
              }}
              className="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors"
              aria-label="Xem và quản lý từ trong kho"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem từ</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDeckOrAction(deck, () => navigate(`/review?deckId=${encodeURIComponent(deck.id)}&topic=${encodeURIComponent(deck.title)}`));
              }}
              className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors"
              title="Ôn tập riêng kho này"
              aria-label="Ôn tập riêng kho này"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ôn tập</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            {/* Download Deck Excel */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const deckWords = words.filter(
                  (w) => w.deckId === deck.id || w.deckName === deck.title
                );
                exportWordsToExcelOrCsv(deckWords, `kho_${deck.title}`, 'xlsx');
              }}
              className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white transition inline-flex items-center justify-center cursor-pointer"
              title="Tải kho này dưới dạng Excel (.xlsx)"
              aria-label="Tải Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            </button>

            {!deck.isReadOnly && (
              <button
                onClick={(e) => handleOpenEditDeck(deck, e)}
                className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 transition inline-flex items-center justify-center cursor-pointer"
                title="Sửa thông tin kho"
                aria-label="Sửa thông tin kho"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            {deck.isSyncedToCloud && !deck.isReadOnly && (
              <button
                onClick={(e) => handleUnlinkFromCloud(deck, e)}
                className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-amber-600 transition inline-flex items-center justify-center cursor-pointer"
                title="Gỡ kho khỏi Cloud (Lưu về máy)"
                aria-label="Gỡ khỏi Cloud"
              >
                <CloudUpload className="w-3.5 h-3.5 rotate-180" />
              </button>
            )}

            <button
              onClick={(e) => handleOpenShareDeck(deck, e)}
              className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-slate-700 text-purple-600 transition inline-flex items-center justify-center cursor-pointer"
              title="Chia sẻ lên cộng đồng"
              aria-label="Chia sẻ lên cộng đồng"
            >
              <Share2 className="w-3.5 h-3.5 text-purple-600" />
            </button>

            <button
              onClick={(e) => handleUploadDeckToCloud(deck, e)}
              disabled={syncingDeckId === deck.id}
              className={`h-8 px-2.5 rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer ${
                deck.isSyncedToCloud
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80'
              }`}
              title={
                deck.isSyncedToCloud
                  ? 'Kho đã đồng bộ lên Cloud (Bấm để đồng bộ lại nếu vừa sửa từ)'
                  : 'Kho chưa đồng bộ - Nhấn để đẩy kho này lên Cloud'
              }
              aria-label={deck.isSyncedToCloud ? 'Đã đồng bộ' : 'Đồng bộ Cloud'}
            >
              {syncingDeckId === deck.id ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : deck.isSyncedToCloud ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <CloudUpload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeckToDelete(deck);
              }}
              className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 text-slate-400 hover:text-rose-600 transition inline-flex items-center justify-center cursor-pointer"
              title="Xóa kho từ vựng này"
              aria-label="Xóa kho từ vựng này"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="w-full space-y-6 animate-fade-in pb-16">
      {/* =============================================================================
          LEVEL 1: HEADER (CONSOLIDATED ACTIONS - NO DUPLICATION)
          ============================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4" data-tour="wordbank-header">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {selectedDeck ? (
              <button
                type="button"
                onClick={() => {
                  navigate('/word-bank');
                  setSelectedDeck(null);
                  setSelectedWordIds([]);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Quay lại danh sách kho</span>
              </button>
            ) : (
              <>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider border border-indigo-500/20">
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Personal Word Bank</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700">
                  <CountryFlag languageId={activeLanguage.id} countryCode={activeLanguage.countryCode} size="xs" />
                  <span>{activeLanguage.name}</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold border border-slate-200 dark:border-slate-700">
                  <HardDrive className="w-3 h-3 text-indigo-500" />
                  <span>Offline Ready</span>
                </div>
              </>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-snug">
            {selectedDeck
              ? selectedDeck.title
              : activeTab === 'decks'
              ? 'Kho Từ Vựng Của Tôi'
              : 'Tất Cả Từ Vựng'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            {selectedDeck
              ? isSelectedDeckLocked
                ? (selectedDeck.wordCount ? `${selectedDeck.wordCount} từ vựng • Kho từ vựng được bảo vệ bằng mật khẩu` : 'Kho từ vựng được bảo vệ bằng mật khẩu')
                : `${wordsInSelectedDeck.length} từ vựng • ${selectedDeck.description || 'Kho từ vựng cá nhân, hỗ trợ ghi nhớ ngắt quãng'}`
              : activeTab === 'decks'
              ? `Quản lý ${decks.length} kho từ vựng cá nhân, đồng bộ đám mây và chia sẻ cộng đồng.`
              : `Hiển thị danh sách đầy đủ ${allFilteredWords.length} từ vựng trên toàn hệ thống.`}
          </p>
        </div>

        {/* Consolidated Action Area */}
        <div className="flex flex-wrap items-center gap-2">
          {/* TRONG KHO ĐANG MỞ */}
          {selectedDeck ? (
            isSelectedDeckLocked ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
                <Lock className="w-3.5 h-3.5" />
                <span>Yêu cầu mật khẩu để mở khóa</span>
              </span>
            ) : (
            <>
              {!selectedDeck.isReadOnly && (
                <button
                  type="button"
                  onClick={handleOpenAddWord}
                  className="btn-glass-primary btn-glass-sm inline-flex items-center gap-1.5 font-bold shadow-sm"
                  aria-label="Thêm từ mới vào kho"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm từ</span>
                </button>
              )}

              {/* Nhập từ dropdown */}
              {!selectedDeck.isReadOnly && (
                <CustomDropdown
                  trigger={
                    <button
                      type="button"
                      className="btn-glass-secondary btn-glass-sm inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
                      title="Nhập từ vựng vào kho này"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Nhập từ</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  }
                  options={[
                    {
                      value: 'import_file',
                      label: 'Nhập file Excel/CSV (.xlsx, .csv)',
                      icon: <FileSpreadsheet className="w-4 h-4 text-emerald-600" />,
                    },
                    {
                      value: 'download_template',
                      label: 'Tải file mẫu Excel chuẩn',
                      icon: <Download className="w-4 h-4 text-indigo-600" />,
                    },
                  ]}
                  value=""
                  onChange={(val) => {
                    if (val === 'download_template') {
                      downloadVocabularyTemplate();
                    } else if (val === 'import_file') {
                      setSelectedFile(null);
                      setParsedWords([]);
                      setParsingError(null);
                      setImportDeckMode('existing');
                      setImportTargetDeckName(selectedDeck.title);
                      setDeckModalTab('file');
                      setShowCreateDeckModal(true);
                    }
                  }}
                  size="sm"
                />
              )}

              {/* Hướng dẫn Tour button */}
              <button
                type="button"
                onClick={() => setShowTour(true)}
                className="btn-glass-secondary btn-glass-sm inline-flex items-center gap-1 text-slate-600 dark:text-slate-300"
                title="Xem hướng dẫn sử dụng Kho từ vựng"
              >
                <HelpCircle className="w-4 h-4 text-indigo-500" />
                <span className="hidden sm:inline">Hướng dẫn</span>
              </button>

              {/* Secondary More Menu */}
              <CustomDropdown
                trigger={
                  <button
                    type="button"
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                    title="Tùy chọn khác"
                    aria-label="Tùy chọn kho"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                }
                options={[
                  {
                    value: 'sync_cloud',
                    label: selectedDeck.isSyncedToCloud ? 'Đã lưu trên Cloud (Bấm để đồng bộ)' : 'Lưu kho lên Cloud',
                    icon: <CloudUpload className="w-4 h-4 text-indigo-500" />,
                  },
                  ...(wordsInSelectedDeck.length > 0
                    ? [
                        {
                          value: 'export_xlsx',
                          label: 'Xuất file Excel (.xlsx)',
                          icon: <FileSpreadsheet className="w-4 h-4 text-emerald-600" />,
                        },
                        {
                          value: 'export_csv',
                          label: 'Xuất file CSV (.csv)',
                          icon: <Download className="w-4 h-4 text-blue-600" />,
                        },
                      ]
                    : []),
                  ...(!selectedDeck.isReadOnly
                    ? [
                        {
                          value: 'edit_deck',
                          label: 'Chỉnh sửa thông tin kho',
                          icon: <Edit3 className="w-4 h-4 text-slate-500" />,
                        },
                        {
                          value: 'share_deck',
                          label: 'Chia sẻ lên cộng đồng',
                          icon: <Share2 className="w-4 h-4 text-indigo-500" />,
                        },
                        {
                          value: 'delete_deck',
                          label: 'Xóa kho này',
                          icon: <Trash2 className="w-4 h-4 text-rose-500" />,
                        },
                      ]
                    : []),
                ]}
                value=""
                onChange={(action) => {
                  if (action === 'sync_cloud') {
                    handleUploadDeckToCloud(selectedDeck);
                  } else if (action === 'export_xlsx') {
                    exportWordsToExcelOrCsv(wordsInSelectedDeck, `kho_${selectedDeck.title}`, 'xlsx');
                  } else if (action === 'export_csv') {
                    exportWordsToExcelOrCsv(wordsInSelectedDeck, `kho_${selectedDeck.title}`, 'csv');
                  } else if (action === 'edit_deck') {
                    handleOpenEditDeck(selectedDeck);
                  } else if (action === 'share_deck') {
                    handleOpenShareDeck(selectedDeck);
                  } else if (action === 'delete_deck') {
                    setDeckToDelete(selectedDeck);
                  }
                }}
                size="sm"
              />
            </>
          )) : activeTab === 'decks' ? (
            /* TRANG QUẢN LÝ TẤT CẢ KHO */
            <>
              <button
                type="button"
                onClick={() => {
                  setDeckTitleInput('');
                  setDeckDescInput('');
                  setDeckPasswordInput('');
                  setDeckModalTab('manual');
                  setShowCreateDeckModal(true);
                }}
                className="btn-glass-primary btn-glass-sm inline-flex items-center gap-1.5 font-bold shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo kho mới</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/community-decks')}
                className="btn-glass-secondary btn-glass-sm inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold border-amber-500/30 hover:bg-amber-500/10"
                title="Khám phá Kho từ vựng chính thức và cộng đồng"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Kho từ của App</span>
              </button>

              {/* Nhập từ dropdown */}
              <CustomDropdown
                trigger={
                  <button
                    type="button"
                    className="btn-glass-secondary btn-glass-sm inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
                    title="Nhập danh sách từ vựng từ Excel/CSV"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Nhập file</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                }
                options={[
                  {
                    value: 'import_file',
                    label: 'Nhập từ file Excel/CSV (.xlsx, .csv)',
                    icon: <FileSpreadsheet className="w-4 h-4 text-emerald-600" />,
                  },
                  {
                    value: 'download_template',
                    label: 'Tải file mẫu Excel chuẩn',
                    icon: <Download className="w-4 h-4 text-indigo-600" />,
                  },
                ]}
                value=""
                onChange={(val) => {
                  if (val === 'download_template') {
                    downloadVocabularyTemplate();
                  } else if (val === 'import_file') {
                    setSelectedFile(null);
                    setParsedWords([]);
                    setParsingError(null);
                    setImportDeckMode('new');
                    setImportTargetDeckName('');
                    setDeckModalTab('file');
                    setShowCreateDeckModal(true);
                  }
                }}
                size="sm"
              />

              {/* Hướng dẫn Tour button */}
              <button
                type="button"
                onClick={() => setShowTour(true)}
                className="btn-glass-secondary btn-glass-sm inline-flex items-center gap-1 text-slate-600 dark:text-slate-300"
                title="Xem hướng dẫn sử dụng Kho từ vựng"
              >
                <HelpCircle className="w-4 h-4 text-indigo-500" />
                <span className="hidden sm:inline">Hướng dẫn</span>
              </button>

              {/* Secondary More Menu */}
              <CustomDropdown
                trigger={
                  <button
                    type="button"
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                    title="Tùy chọn khác"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                }
                options={[
                  {
                    value: 'sync_all_cloud',
                    label: syncingCloud ? 'Đang đồng bộ Cloud...' : 'Đồng bộ 2 chiều với Cloud',
                    icon: <CloudUpload className="w-4 h-4 text-indigo-500" />,
                  },
                  ...(words.length > 0
                    ? [
                        {
                          value: 'export_all_xlsx',
                          label: 'Xuất tất cả ra Excel (.xlsx)',
                          icon: <FileSpreadsheet className="w-4 h-4 text-emerald-600" />,
                        },
                        {
                          value: 'export_all_csv',
                          label: 'Xuất tất cả ra CSV (.csv)',
                          icon: <Download className="w-4 h-4 text-blue-600" />,
                        },
                      ]
                    : []),
                ]}
                value=""
                onChange={(action) => {
                  if (action === 'sync_all_cloud') {
                    if (isGuest || !user) {
                      promptLogin('Đăng nhập để đồng bộ kho từ vựng lên Đám mây');
                      return;
                    }
                    loadData(true);
                  } else if (action === 'export_all_xlsx') {
                    exportWordsToExcelOrCsv(words, 'tat_ca_tu_vung', 'xlsx');
                  } else if (action === 'export_all_csv') {
                    exportWordsToExcelOrCsv(words, 'tat_ca_tu_vung', 'csv');
                  }
                }}
                size="sm"
              />
            </>
          ) : (
            /* TAB TẤT CẢ TỪ */
            <>
              {decks.length > 0 && (
                <button
                  type="button"
                  onClick={handleOpenAddWord}
                  className="btn-glass-primary btn-glass-sm inline-flex items-center gap-1.5 font-bold shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm từ mới</span>
                </button>
              )}

              <CustomDropdown
                trigger={
                  <button
                    type="button"
                    className="btn-glass-secondary btn-glass-sm inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
                    title="Nhập danh sách từ vựng"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Nhập file</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                }
                options={[
                  {
                    value: 'import_file',
                    label: 'Nhập từ file Excel/CSV (.xlsx, .csv)',
                    icon: <FileSpreadsheet className="w-4 h-4 text-emerald-600" />,
                  },
                  {
                    value: 'download_template',
                    label: 'Tải file mẫu Excel chuẩn',
                    icon: <Download className="w-4 h-4 text-indigo-600" />,
                  },
                ]}
                value=""
                onChange={(val) => {
                  if (val === 'download_template') {
                    downloadVocabularyTemplate();
                  } else if (val === 'import_file') {
                    setSelectedFile(null);
                    setParsedWords([]);
                    setParsingError(null);
                    setImportDeckMode('existing');
                    setImportTargetDeckName(decks[0]?.title || 'General');
                    setDeckModalTab('file');
                    setShowCreateDeckModal(true);
                  }
                }}
                size="sm"
              />

              {/* Hướng dẫn Tour button */}
              <button
                type="button"
                onClick={() => setShowTour(true)}
                className="btn-glass-secondary btn-glass-sm inline-flex items-center gap-1 text-slate-600 dark:text-slate-300"
                title="Xem hướng dẫn sử dụng Kho từ vựng"
              >
                <HelpCircle className="w-4 h-4 text-indigo-500" />
                <span className="hidden sm:inline">Hướng dẫn</span>
              </button>

              <CustomDropdown
                trigger={
                  <button
                    type="button"
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                    title="Tùy chọn khác"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                }
                options={[
                  {
                    value: 'sync_all_cloud',
                    label: syncingCloud ? 'Đang đồng bộ Cloud...' : 'Đồng bộ 2 chiều với Cloud',
                    icon: <CloudUpload className="w-4 h-4 text-indigo-500" />,
                  },
                  ...(words.length > 0
                    ? [
                        {
                          value: 'export_all_xlsx',
                          label: 'Xuất tất cả ra Excel (.xlsx)',
                          icon: <FileSpreadsheet className="w-4 h-4 text-emerald-600" />,
                        },
                        {
                          value: 'export_all_csv',
                          label: 'Xuất tất cả ra CSV (.csv)',
                          icon: <Download className="w-4 h-4 text-blue-600" />,
                        },
                      ]
                    : []),
                ]}
                value=""
                onChange={(action) => {
                  if (action === 'sync_all_cloud') {
                    if (isGuest || !user) {
                      promptLogin('Đăng nhập để đồng bộ kho từ vựng lên Đám mây');
                      return;
                    }
                    loadData(true);
                  } else if (action === 'export_all_xlsx') {
                    exportWordsToExcelOrCsv(words, 'tat_ca_tu_vung', 'xlsx');
                  } else if (action === 'export_all_csv') {
                    exportWordsToExcelOrCsv(words, 'tat_ca_tu_vung', 'csv');
                  }
                }}
                size="sm"
              />
            </>
          )}
        </div>
      </div>

      {/* Real-time IndexedDB Activity Progress Notification Banner */}
      {idbSyncMsg && (
        <div className="p-3 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="truncate">{idbSyncMsg}</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 shrink-0">
            IndexedDB Sync
          </span>
        </div>
      )}

      {/* Action Success Toast Banner */}
      {actionSuccessMsg && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Main Mode Navigation Bar: "Kho của tôi" vs "Tất cả từ" */}
      {!selectedDeck && (
        <div className="tab-pill-container self-start">
          <button
            onClick={() => setActiveTab('decks')}
            className={`tab-pill ${activeTab === 'decks' ? 'tab-pill-active' : ''}`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>Kho Của Tôi</span>
            <span className="tab-pill-badge">{decks.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('all_words')}
            className={`tab-pill ${activeTab === 'all_words' ? 'tab-pill-active' : ''}`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Tất Cả Từ</span>
            <span className="tab-pill-badge">{words.length}</span>
          </button>
        </div>
      )}

      {/* =============================================================================
          TAB 1: KHO CỦA TÔI (MY DECKS VIEW) - DEDICATED DECK MANAGEMENT
          ============================================================================= */}
      {!selectedDeck && activeTab === 'decks' && (
        <div className="space-y-4">
          {/* 1. Category Navigation Pills Bar (Phân hệ Kho Từ Vựng) */}
          <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Phân hệ kho từ vựng
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                {filteredDecks.length} / {decks.length} kho từ
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setDeckCategoryFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                  deckCategoryFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/80'
                }`}
              >
                <span>Tất cả</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    deckCategoryFilter === 'ALL'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {decks.length}
                </span>
              </button>

              {allDeckCategories.map((cat) => {
                const count = deckCategoryCounts[cat] || 0;
                const isActive = deckCategoryFilter.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setDeckCategoryFilter(isActive ? 'ALL' : cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/80'
                    }`}
                  >
                    <span>{cat}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Secondary Filter, Sort, Search & View Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white/70 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
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
                className="btn-glass-secondary btn-glass-sm"
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
                  className="btn-glass-danger btn-glass-sm animate-in fade-in"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa {selectedDeckIds.length} kho đã chọn</span>
                </button>
              )}

              {/* Group by Category Toggle */}
              <button
                type="button"
                onClick={toggleDeckGroupByCat}
                className={`btn-glass-sm flex items-center gap-1.5 transition ${
                  deckGroupByCat
                    ? 'btn-glass-purple !bg-purple-600 !text-white'
                    : 'btn-glass-secondary text-slate-600 dark:text-slate-400'
                }`}
                title="Gom nhóm hiển thị theo từng phân hệ danh mục"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Nhóm theo phân hệ</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* CEFR Level Filter Dropdown */}
              <div className="w-28 h-9 shrink-0">
                <CustomDropdown
                  value={deckCefrFilter}
                  onChange={(val) => setDeckCefrFilter(val)}
                  options={[
                    { value: 'ALL', label: 'Cấp độ: Tất cả' },
                    { value: 'A1', label: 'Cấp độ A1' },
                    { value: 'A2', label: 'Cấp độ A2' },
                    { value: 'B1', label: 'Cấp độ B1' },
                    { value: 'B2', label: 'Cấp độ B2' },
                    { value: 'C1', label: 'Cấp độ C1' },
                    { value: 'C2', label: 'Cấp độ C2' },
                  ]}
                  size="sm"
                  className="w-full h-9"
                />
              </div>

              {/* Deck Sorting Dropdown */}
              <div className="w-36 h-9 shrink-0">
                <CustomDropdown
                  value={deckSort}
                  onChange={(val) => setDeckSort(val as any)}
                  options={[
                    { value: 'newest', label: 'Mới nhất' },
                    { value: 'oldest', label: 'Cũ nhất' },
                    { value: 'az', label: 'Tên A → Z' },
                    { value: 'za', label: 'Tên Z → A' },
                    { value: 'words_desc', label: 'Nhiều từ nhất' },
                    { value: 'progress_desc', label: 'Thuộc cao nhất' },
                  ]}
                  size="sm"
                  className="w-full h-9"
                />
              </div>

              {/* View Mode Switcher (Dưới ô vs Danh sách) */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleDeckViewMode('grid')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    deckViewMode === 'grid'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Hiển thị: Dưới ô"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dưới ô</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleDeckViewMode('list')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    deckViewMode === 'list'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Hiển thị: Danh sách"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Danh sách</span>
                </button>
              </div>

              {/* Deck Search Box */}
              <div className="relative w-full sm:w-48 lg:w-56 h-9">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={deckSearch}
                  onChange={(e) => setDeckSearch(e.target.value)}
                  placeholder="Tìm kiếm tên kho từ..."
                  className="w-full h-full pl-8 pr-7 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                />
                {deckSearch && (
                  <button
                    onClick={() => setDeckSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                    title="Xóa tìm kiếm"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Decks Display: Loading, Empty, List, or Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredDecks.length === 0 ? (
            <div className="text-center py-16 px-6 text-slate-400 space-y-4 bg-white/70 dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 max-w-xl mx-auto my-6 shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-inner">
                <FolderKanban className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {deckSearch ? 'Không tìm thấy kho từ vựng nào' : 'Bạn chưa có kho từ vựng cá nhân nào'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                  {deckSearch
                    ? 'Hãy thử tìm kiếm bằng từ khóa khác hoặc xóa ô tìm kiếm.'
                    : 'Hãy tạo kho từ vựng đầu tiên của bạn để bắt đầu thêm từ, nhập file Excel/CSV và quản lý từ vựng!'}
                </p>
              </div>
              <button
                onClick={() => {
                  setDeckTitleInput('');
                  setDeckDescInput('');
                  setDeckPasswordInput('');
                  setDeckModalTab('manual');
                  setShowCreateDeckModal(true);
                }}
                className="btn-glass-purple btn-glass-sm !px-5 !py-2.5 !h-auto text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo kho từ vựng đầu tiên ngay</span>
              </button>
            </div>
          ) : deckViewMode === 'list' ? (
            /* =================================================================
               LIST VIEW FOR DECKS (DANH SÁCH KHO TỪ)
               ================================================================= */
            <div className="overflow-hidden rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-xs backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/75 dark:bg-slate-800/50 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                      <th className="py-3 px-4 w-10">
                        <button
                          onClick={() => {
                            if (selectedDeckIds.length === filteredDecks.length) {
                              setSelectedDeckIds([]);
                            } else {
                              setSelectedDeckIds(filteredDecks.map((d) => d.id));
                            }
                          }}
                          className="p-0.5 text-slate-400 hover:text-indigo-600 transition"
                        >
                          {selectedDeckIds.length > 0 && selectedDeckIds.length === filteredDecks.length ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="py-3 px-4">Kho từ vựng</th>
                      <th className="py-3 px-3">Lĩnh vực</th>
                      <th className="py-3 px-3 text-center">Cấp độ</th>
                      <th className="py-3 px-3 text-center">Số từ</th>
                      <th className="py-3 px-4 min-w-[140px]">Tiến độ</th>
                      <th className="py-3 px-3 text-center">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                    {deckGroupByCat ? (
                      /* Grouped by Category in List/Table View */
                      Object.entries(decksGroupedByCategory).map(([catName, catDecks]) => (
                        <React.Fragment key={catName}>
                          <tr className="bg-slate-100/90 dark:bg-slate-800/80 border-y border-slate-200 dark:border-slate-700/80 font-bold">
                            <td colSpan={8} className="py-2.5 px-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-indigo-500/20" />
                                  <span className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                    Phân hệ: {catName}
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 shadow-2xs">
                                  {catDecks.length} kho từ vựng
                                </span>
                              </div>
                            </td>
                          </tr>
                          {catDecks.map((deck) => renderSingleDeckTableRow(deck))}
                        </React.Fragment>
                      ))
                    ) : (
                      /* Flat Virtualized List/Table View */
                      <>
                        {virtualDecksTable.topSpacerHeight > 0 && (
                          <tr>
                            <td colSpan={8} style={{ height: `${virtualDecksTable.topSpacerHeight}px` }} />
                          </tr>
                        )}
                        {virtualDecksTable.virtualItems.map(({ item: deck }) => renderSingleDeckTableRow(deck))}
                        {virtualDecksTable.bottomSpacerHeight > 0 && (
                          <tr>
                            <td colSpan={8} style={{ height: `${virtualDecksTable.bottomSpacerHeight}px` }} />
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* =================================================================
               GRID VIEW FOR DECKS (DƯỚI Ô)
               ================================================================= */
            deckGroupByCat ? (
              /* GROUPED BY CATEGORY SUBSYSTEMS VIEW */
              <div className="space-y-6 animate-fade-in">
                {Object.entries(decksGroupedByCategory).map(([catName, catDecks]) => (
                  <div key={catName} className="space-y-3 p-4 sm:p-5 rounded-3xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/60 dark:border-slate-800/60">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20" />
                        <h3 className="font-black text-sm text-slate-900 dark:text-white">
                          Phân hệ: {catName}
                        </h3>
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 shadow-2xs">
                        {catDecks.length} kho từ vựng
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {catDecks.map((deck) => renderSingleDeckCard(deck))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* STANDARD FLAT VIRTUAL GRID VIEW */
              <div ref={virtualDecksGrid.containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {virtualDecksGrid.topSpacerHeight > 0 && (
                  <div style={{ height: `${virtualDecksGrid.topSpacerHeight}px` }} className="col-span-full" />
                )}
                {virtualDecksGrid.virtualItems.map(({ item: deck }) => renderSingleDeckCard(deck))}
                {virtualDecksGrid.bottomSpacerHeight > 0 && (
                  <div style={{ height: `${virtualDecksGrid.bottomSpacerHeight}px` }} className="col-span-full" />
                )}
              </div>
            )
          )}

          {/* Virtual Windowing Indicator for Decks */}
          <div className="w-full py-3 flex flex-col items-center justify-center gap-1">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Đang tối ưu hiển thị {filteredDecks.length} kho từ vựng bằng Virtual Windowing (Chống giật lag)
            </span>
          </div>
        </div>
      )}

      {/* =============================================================================
          DECK DETAIL VIEW: "KHO CỦA TÔI -> KHO X -> QUẢN LÝ TỪ" (FULL CRUD WORDS INSIDE DECK)
          ============================================================================= */}
      {selectedDeck && (
        isSelectedDeckLocked ? (
          /* =============================================================================
             SECURE LOCKED DECK AUTHENTICATION SCREEN (IN-PLACE, ZERO WORDS IN DOM)
             Deleting DOM elements in DevTools CANNOT reveal words because words are not in DOM
             and not yet fetched from API!
             ============================================================================= */
          <div className="max-w-md mx-auto my-12 p-7 sm:p-9 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-amber-200/90 dark:border-amber-900/60 shadow-2xl text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/25">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider border border-amber-500/20">
                Kho Từ Vựng Được Bảo Vệ Bằng Mật Khẩu
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {selectedDeck.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Kho từ này được cài đặt mật khẩu bảo vệ. Dữ liệu từ vựng được mã hóa an toàn trên máy chủ, vui lòng nhập mật khẩu để giải mã và mở khóa toàn bộ kho từ.
              </p>
            </div>

            <form
              onSubmit={handleUnlockCurrentDeck}
              className="space-y-4 max-w-sm mx-auto text-left"
            >
              {deckUnlockError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{deckUnlockError}</span>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5 text-xs">
                  Mật khẩu mở khóa kho <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showUnlockPass ? 'text' : 'password'}
                    required
                    autoFocus
                    value={deckUnlockInput}
                    onChange={(e) => setDeckUnlockInput(e.target.value)}
                    placeholder="Nhập mã PIN hoặc mật khẩu..."
                    className="w-full h-11 px-4 pr-11 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-semibold text-sm text-slate-900 dark:text-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUnlockPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    {showUnlockPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/word-bank');
                    setSelectedDeck(null);
                    setDeckUnlockInput('');
                    setDeckUnlockError(null);
                  }}
                  className="btn-glass-secondary btn-glass-sm flex-1 !py-2.5 font-bold"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={deckUnlocking || !deckUnlockInput.trim()}
                  className="btn-glass-primary btn-glass-sm flex-1 !py-2.5 font-bold disabled:opacity-50"
                >
                  {deckUnlocking ? (
                    <span className="inline-flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang giải mã...</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Mở khóa kho từ</span>
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
        <div className="space-y-4">
          {/* Origin & Attribution Banner */}
          {(selectedDeck.authorName || selectedDeck.sourceName) && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-700 dark:text-indigo-300">
                  Nguồn kho: {selectedDeck.sourceName || 'Cộng đồng'}
                </span>
                {selectedDeck.authorName && (
                  <span className="text-slate-600 dark:text-slate-400">
                    • Tác giả: <strong className="text-slate-800 dark:text-white">{selectedDeck.authorName}</strong>
                  </span>
                )}
              </div>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                Kho nhập từ bên ngoài
              </span>
            </div>
          )}

          {/* Read-Only Notice for Cloned Decks */}
          {selectedDeck.isReadOnly && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-medium">
              <Lock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>Kho được sao chép từ cộng đồng:</strong> Bạn có thể học và ôn tập kho từ này như kho cá nhân, nhưng không thể chỉnh sửa hoặc xóa từ vựng trong kho gốc.
              </span>
            </div>
          )}

          {/* LEVEL 2: LEARNING PROGRESS SUMMARY BANNER (NON-DASHBOARD, LEARNER FOCUS) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/60 dark:from-indigo-950/40 dark:via-slate-900/60 dark:to-purple-950/30 border border-indigo-100/80 dark:border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs" data-tour="wordbank-learning-stats">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex flex-col items-center justify-center font-black shadow-sm shadow-indigo-500/25">
                  <span className="text-xs leading-none">{deckLearningStats.percent}%</span>
                  <span className="text-[9px] font-medium opacity-80 mt-0.5">thuộc</span>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tiến độ kho từ</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {deckLearningStats.mastered} / {deckLearningStats.total} từ đã thuộc
                  </div>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

              {/* Progress and status counts */}
              <div className="flex-1 min-w-[200px] max-w-sm">
                <div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  <span>{deckLearningStats.learning} đang học</span>
                  <span>{deckLearningStats.needsReview} cần ôn tập</span>
                </div>
                <div className="h-2 w-full bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${deckLearningStats.percent}%` }}
                    className="bg-emerald-500 transition-all duration-500"
                    title={`${deckLearningStats.percent}% đã thuộc`}
                  />
                  <div
                    style={{ width: `${100 - deckLearningStats.percent}%` }}
                    className="bg-indigo-400/50 dark:bg-indigo-600/40 transition-all duration-500"
                    title="Đang trong tiến trình học"
                  />
                </div>
              </div>
            </div>

            {/* Quick Review Action */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                data-tour="wordbank-quick-review"
                onClick={() => navigate(`/review?deckId=${encodeURIComponent(selectedDeck.id)}&topic=${encodeURIComponent(selectedDeck.title)}`)}
                className="btn-glass-primary btn-glass-sm font-bold shadow-sm inline-flex items-center gap-2"
                aria-label="Ôn tập kho này"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>Ôn tập ngay</span>
              </button>
            </div>
          </div>

          {/* LEVEL 4: SMART TOOLBAR & CONTEXTUAL ACTION BAR */}
          <div data-tour="wordbank-smart-toolbar">
            {selectedWordIds.length > 0 ? (
              /* CONTEXTUAL TOOLBAR WHEN 1+ WORDS ARE SELECTED */
              <div className="bg-indigo-50/95 dark:bg-indigo-950/80 p-3 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-indigo-900 dark:text-indigo-200 px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/60">
                    Đã chọn {selectedWordIds.length} từ
                  </span>
                  <button
                    onClick={() => setSelectedWordIds([])}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline decoration-dotted ml-1"
                  >
                    Bỏ chọn
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => navigate(`/review?wordIds=${encodeURIComponent(selectedWordIds.join(','))}&topic=${encodeURIComponent(selectedDeck.title)}`)}
                    className="btn-glass-primary btn-glass-sm font-bold"
                    title="Ôn tập các từ đã chọn"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Ôn tập ({selectedWordIds.length})</span>
                  </button>

                  {!selectedDeck.isReadOnly && (
                    <>
                      <button
                        onClick={handleBulkMarkMastered}
                        className="btn-glass-secondary btn-glass-sm text-emerald-600 dark:text-emerald-400"
                        title="Đánh dấu các từ đã chọn là Đã thuộc"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Đã thuộc</span>
                      </button>

                      {subTopicsInSelectedDeck.length > 0 && (
                        <CustomDropdown
                          trigger={
                            <button
                              type="button"
                              className="btn-glass-secondary btn-glass-sm inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
                              title="Gắn chủ đề cho các từ đã chọn"
                            >
                              <Tag className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Gắn chủ đề</span>
                              <ChevronDown className="w-3 h-3 text-slate-400" />
                            </button>
                          }
                          options={subTopicsInSelectedDeck.map((t) => ({
                            value: t,
                            label: `Chủ đề: ${t}`,
                          }))}
                          value=""
                          onChange={(topic) => handleBulkAssignTopic(topic)}
                          size="sm"
                        />
                      )}

                      <button
                        onClick={() => setShowBulkDeleteWordsModal(true)}
                        className="btn-glass-danger btn-glass-sm"
                        title="Xóa các từ đã chọn khỏi kho"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa ({selectedWordIds.length})</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* SMART TOOLBAR IN NORMAL STATE */
              <div className="bg-slate-50/90 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
                {/* Search, Filter & View Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  {/* Multi-field Smart Search Input */}
                  <div className="relative flex-1 min-w-[200px] h-9">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={deckWordSearch}
                      onChange={(e) => setDeckWordSearch(e.target.value)}
                      placeholder="Tìm từ tiếng Anh, phiên âm, nghĩa tiếng Việt, chủ đề..."
                      className="w-full h-full pl-8 pr-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                    />
                    {deckWordSearch && (
                      <button
                        onClick={() => setDeckWordSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Xóa tìm kiếm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Select All Checkbox Button */}
                  {!selectedDeck.isReadOnly && filteredWordsInDeck.length > 0 && (
                    <button
                      onClick={() => {
                        if (selectedWordIds.length === filteredWordsInDeck.length) {
                          setSelectedWordIds([]);
                        } else {
                          setSelectedWordIds(filteredWordsInDeck.map((w) => w.id));
                        }
                      }}
                      className="btn-glass-secondary btn-glass-sm shrink-0"
                    >
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                      <span>Chọn tất cả ({filteredWordsInDeck.length})</span>
                    </button>
                  )}

                  {/* Sub-Topic Filter Dropdown (inside this deck) */}
                  {subTopicsInSelectedDeck.length > 0 && (
                    <div className="flex items-center h-9 shrink-0">
                      <CustomDropdown
                        value={deckWordTopicFilter}
                        onChange={(val) => setDeckWordTopicFilter(val)}
                        options={[
                          { value: 'ALL', label: 'Tất cả chủ đề' },
                          ...subTopicsInSelectedDeck.map((t) => ({ value: t, label: `Chủ đề: ${t}` })),
                        ]}
                        size="sm"
                        className="w-36 sm:w-44 h-9"
                      />
                    </div>
                  )}

                    {/* Part of Speech Filter */}
                    <div className="flex items-center h-9 shrink-0">
                      <CustomDropdown
                        value={deckWordPosFilter}
                        onChange={(val) => setDeckWordPosFilter(val)}
                        options={[
                          { value: 'ALL', label: 'Loại từ: Tất cả' },
                          { value: 'noun', label: 'Danh từ (n.)' },
                          { value: 'verb', label: 'Động từ (v.)' },
                          { value: 'adjective', label: 'Tính từ (adj.)' },
                          { value: 'adverb', label: 'Trạng từ (adv.)' },
                          { value: 'phrase', label: 'Cụm từ (phrase)' },
                          { value: 'idiom', label: 'Thành ngữ (idiom)' },
                        ]}
                        size="sm"
                        className="w-32 sm:w-36 h-9"
                      />
                    </div>

                    {/* CEFR Level Filter */}
                    <div className="flex items-center h-9 shrink-0">
                      <CustomDropdown
                        value={deckWordCefrFilter}
                        onChange={(val) => setDeckWordCefrFilter(val)}
                        options={[
                          { value: 'ALL', label: 'Cấp độ: Tất cả' },
                          { value: 'A1', label: 'A1' },
                          { value: 'A2', label: 'A2' },
                          { value: 'B1', label: 'B1' },
                          { value: 'B2', label: 'B2' },
                          { value: 'C1', label: 'C1' },
                          { value: 'C2', label: 'C2' },
                        ]}
                        size="sm"
                        className="w-28 sm:w-32 h-9"
                      />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex items-center h-9 shrink-0">
                      <CustomDropdown
                        value={deckWordSort}
                        onChange={(val) => setDeckWordSort(val as any)}
                        options={[
                          { value: 'newest', label: 'Mới nhất' },
                          { value: 'oldest', label: 'Cũ nhất' },
                          { value: 'az', label: 'A → Z' },
                          { value: 'za', label: 'Z → A' },
                        ]}
                        size="sm"
                        className="w-28 sm:w-32 h-9"
                      />
                    </div>

                  {/* View Mode Switcher (Dưới ô vs Danh sách) */}
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleWordViewMode('grid')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        wordViewMode === 'grid'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="Hiển thị: Dưới ô"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Dưới ô</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleWordViewMode('list')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        wordViewMode === 'list'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="Hiển thị: Danh sách"
                    >
                      <List className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Danh sách</span>
                    </button>
                  </div>
                </div>

                {/* Status Filter Pills */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center gap-1 text-xs font-semibold overflow-x-auto">
                    <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1 shrink-0">
                      <Filter className="w-3 h-3 text-indigo-500" />
                      <span>Trạng thái:</span>
                    </span>
                    {[
                      { key: 'ALL', label: `Tất cả (${wordsInSelectedDeck.length})` },
                      { key: 'LEARNING', label: `Đang học (${deckLearningStats.learning})` },
                      { key: 'MASTERED', label: `Đã thuộc (${deckLearningStats.mastered})` },
                      { key: 'FAVORITES', label: 'Yêu thích' },
                    ].map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setDeckWordStatusFilter(t.key as any)}
                        className={`btn-glass-sm !h-7 !px-2.5 text-xs transition shrink-0 ${
                          deckWordStatusFilter === t.key
                            ? 'btn-glass-primary font-bold'
                            : 'btn-glass-secondary'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <span className="text-xs text-slate-400 font-medium hidden sm:inline-block">
                    Hiển thị <strong className="text-indigo-600 dark:text-indigo-400">{filteredWordsInDeck.length}</strong> từ
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Word Display inside Deck: Empty, List, or Grid */}
          {filteredWordsInDeck.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-4 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 p-8 max-w-xl mx-auto my-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center mx-auto text-indigo-500">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  {deckWordSearch || deckWordTopicFilter !== 'ALL' || deckWordStatusFilter !== 'ALL'
                    ? 'Không tìm thấy từ vựng phù hợp'
                    : 'Kho từ của bạn đang trống'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  {deckWordSearch || deckWordTopicFilter !== 'ALL' || deckWordStatusFilter !== 'ALL'
                    ? 'Thử thay đổi từ khóa tìm kiếm hoặc đặt lại các bộ lọc bên trên.'
                    : 'Bạn có thể thêm từ vựng thủ công hoặc nhập hàng trăm từ cùng lúc từ file Excel/CSV.'}
                </p>
              </div>
              {!selectedDeck.isReadOnly && (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    onClick={handleOpenAddWord}
                    className="btn-glass-primary btn-glass-sm inline-flex items-center gap-1.5 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm từ mới</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setParsedWords([]);
                      setParsingError(null);
                      setImportDeckMode('existing');
                      setImportTargetDeckName(selectedDeck.title);
                      setShowImportModal(true);
                    }}
                    className="btn-glass-secondary btn-glass-sm inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
                  >
                    <FileSpreadsheet className="w                      <th
                        onClick={() => handleToggleDeckWordSort('word')}
                        className="py-3 px-4 cursor-pointer hover:text-indigo-600 transition select-none"
                        title="Bấm để sắp xếp theo từ vựng"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Từ vựng & Phiên âm</span>
                          {deckWordSortCol === 'word' ? (
                            deckWordSortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleToggleDeckWordSort('meaning')}
                        className="py-3 px-4 cursor-pointer hover:text-indigo-600 transition select-none"
                        title="Bấm để sắp xếp theo nghĩa tiếng Việt"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Nghĩa tiếng Việt</span>
                          {deckWordSortCol === 'meaning' ? (
                            deckWordSortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleToggleDeckWordSort('topic')}
                        className="py-3 px-3 cursor-pointer hover:text-indigo-600 transition select-none"
                        title="Bấm để sắp xếp theo phân hệ / chủ đề"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Phân hệ / Chủ đề</span>
                          {deckWordSortCol === 'topic' ? (
                            deckWordSortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleToggleDeckWordSort('cefr')}
                        className="py-3 px-3 text-center cursor-pointer hover:text-indigo-600 transition select-none"
                        title="Bấm để sắp xếp theo cấp độ"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Cấp độ</span>
                          {deckWordSortCol === 'cefr' ? (
                            deckWordSortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleToggleDeckWordSort('status')}
                        className="py-3 px-3 text-center cursor-pointer hover:text-indigo-600 transition select-none"
                        title="Bấm để sắp xếp theo trạng thái"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Trạng thái</span>
                          {deckWordSortCol === 'status' ? (
                            deckWordSortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                          )}
                        </div>
                      </th>
                      <th className="py-3 px-2 w-10 text-center">Thích</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                    {virtualDeckWordsTable.topSpacerHeight > 0 && (
                      <tr>
                        <td colSpan={9} style={{ height: `${virtualDeckWordsTable.topSpacerHeight}px`, padding: 0, border: 'none' }} />
                      </tr>
                    )}
                    {virtualDeckWordsTable.virtualItems.map(({ item }) => {
                      const isSelected = selectedWordIds.includes(item.id);
                      const isFav = favoriteIds.includes(item.id) || item.isFavorite;
                      const realTopic = item.topic || item.vocabulary?.topic || 'General';
                      const cefrLevel = item.cefrLevel || item.vocabulary?.cefrLevel || 'B1';
                      const pos = item.partOfSpeech || item.vocabulary?.partOfSpeech;

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-indigo-50/30 dark:hover:bg-slate-800/40 transition duration-150 cv-auto-row ${
                            isSelected ? 'bg-indigo-50/20 dark:bg-indigo-950/20' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            {!selectedDeck.isReadOnly && (
                              <button
                                onClick={() =>
                                  setSelectedWordIds((prev) =>
                                    prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
                                  )
                                }
                                className="p-0.5 text-slate-400 hover:text-indigo-600 transition"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              onClick={(e) => handlePlayAudio(item.word, e)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600 transition"
                              title="Phát âm chuẩn (Web Speech)"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">
                                {item.word}
                              </span>
                              {renderPosBadge(pos)}
                            </div>
                            {item.phonetic && (
                              <span className="text-xs text-sky-500 dark:text-sky-300 font-mono tracking-tight">
                                {item.phonetic}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 max-w-xs sm:max-w-sm">
                            <p className="text-slate-800 dark:text-slate-200 font-semibold text-sm line-clamp-1">
                              {item.meaning}
                            </p>
                            {item.example && (
                              <p className="text-xs text-slate-400 italic line-clamp-1 mt-0.5">
                                "{item.example}"
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50">
                              <Tag className="w-3 h-3 text-indigo-500" />
                              <span>{realTopic}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50">
                              {cefrLevel}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                item.status === 'MASTERED'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50'
                                  : 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/50'
                              }`}
                            >
                              {item.status === 'MASTERED' ? 'Đã thuộc' : 'Đang học'}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              onClick={(e) => handleToggleFavorite(item.id, e)}
                              className={`p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 transition ${
                                isFav ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
                              }`}
                              title={isFav ? 'Bỏ yêu thích' : 'Yêu thích từ này'}
                            >
                              <Heart
                                className={`w-3.5 h-3.5 ${
                                  isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                                }`}
                              />
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {!selectedDeck.isReadOnly && (
                              <div className="inline-flex items-center justify-end gap-1">
                                <button
                                  onClick={(e) => handleOpenEditWord(item, e)}
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 transition"
                                  title="Sửa từ này"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setWordToDelete(item);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 text-slate-400 hover:text-rose-600 transition"
                                  title="Xóa từ này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {virtualDeckWordsTable.bottomSpacerHeight > 0 && (
                      <tr>
                        <td colSpan={9} style={{ height: `${virtualDeckWordsTable.bottomSpacerHeight}px`, padding: 0, border: 'none' }} />
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* =================================================================
               GRID VIEW FOR WORDS INSIDE DECK (DƯỚI Ô)
               ================================================================= */
            <div ref={virtualDeckWordsGrid.containerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-tour="wordbank-word-list">
              {virtualDeckWordsGrid.topSpacerHeight > 0 && (
                <div style={{ height: `${virtualDeckWordsGrid.topSpacerHeight}px` }} className="col-span-full" />
              )}
              {virtualDeckWordsGrid.virtualItems.map(({ item }) => {
                const isSelected = selectedWordIds.includes(item.id);
                const isFav = favoriteIds.includes(item.id) || item.isFavorite;
                // Topic is NEVER the deck name!
                const realTopic = item.topic || item.vocabulary?.topic || 'General';
                const cefrLevel = item.cefrLevel || item.vocabulary?.cefrLevel || 'B1';

                return (
                  <div
                    key={item.id}
                    className={`p-4 flex flex-col justify-between space-y-3 rounded-2xl bg-white dark:bg-slate-900 border transition duration-150 shadow-xs hover:shadow-md cv-auto-card ${
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
                          {!selectedDeck.isReadOnly && (
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
                          )}

                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/50 truncate max-w-[130px]" title={`Chủ đề: ${realTopic}`}>
                            {realTopic}
                          </span>

                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50 shrink-0">
                            {cefrLevel}
                          </span>
                        </div>

                        {/* Top-Right: Fixed Position Actions (Pronounce & 2-Way Favorite) */}
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          <button
                            onClick={(e) => handlePlayAudio(item.word, e)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600 transition"
                            title="Phát âm chuẩn (Web Speech)"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => handleToggleFavorite(item.id, e)}
                            className={`p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 transition ${
                              isFav ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
                            }`}
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
                          <p className="text-xs text-sky-500 dark:text-sky-300 font-mono tracking-tight mt-0.5 truncate">
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
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                          item.status === 'MASTERED'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50'
                            : 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/50'
                        }`}
                      >
                        {item.status === 'MASTERED' ? 'Đã thuộc' : 'Đang học'}
                      </span>

                      {selectedDeck.isReadOnly ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200/50">
                          <Lock className="w-2.5 h-2.5" />
                          Chỉ đọc
                        </span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleOpenEditWord(item, e)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 transition"
                            title="Sửa từ này"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setWordToDelete(item);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 text-slate-400 hover:text-rose-600 transition"
                            title="Xóa từ này khỏi kho"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {virtualDeckWordsGrid.bottomSpacerHeight > 0 && (
                <div style={{ height: `${virtualDeckWordsGrid.bottomSpacerHeight}px` }} className="col-span-full" />
              )}
            </div>
          )}

          {/* Virtual Windowing Indicator for Words Inside Deck */}
          <div className="w-full py-3 flex flex-col items-center justify-center gap-1">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Đang tối ưu hiển thị {filteredWordsInDeck.length} từ vựng bằng Virtual Windowing (Chống giật lag)
            </span>
          </div>
        </div>
        )
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
                    className={`btn-glass-sm !h-8 !px-3 text-xs transition shrink-0 ${
                      allWordStatusFilter === t.key
                        ? 'btn-glass-primary'
                        : 'btn-glass-secondary'
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
                      { value: 'ALL', label: 'Tất cả trình độ (CEFR)', badge: 'ALL' },
                      { value: 'A1', label: 'A1 — Beginner', badge: 'A1' },
                      { value: 'A2', label: 'A2 — Elementary', badge: 'A2' },
                      { value: 'B1', label: 'B1 — Intermediate', badge: 'B1' },
                      { value: 'B2', label: 'B2 — Upper-Inter', badge: 'B2' },
                      { value: 'C1', label: 'C1 — Advanced', badge: 'C1' },
                      { value: 'C2', label: 'C2 — Mastery', badge: 'C2' },
                    ]}
                    size="sm"
                    className="w-48 h-9"
                  />
                </div>

                {/* Part of Speech Filter */}
                <div className="flex items-center h-9">
                  <CustomDropdown
                    value={allWordPosFilter}
                    onChange={(val) => setAllWordPosFilter(val)}
                    options={[
                      { value: 'ALL', label: 'Tất cả loại từ (POS)' },
                      { value: 'noun', label: 'Danh từ (noun)' },
                      { value: 'verb', label: 'Động từ (verb)' },
                      { value: 'adj', label: 'Tính từ (adj)' },
                      { value: 'adv', label: 'Phó từ (adv)' },
                      { value: 'phr', label: 'Cụm từ (phrase)' },
                    ]}
                    size="sm"
                    className="w-44 h-9"
                  />
                </div>

                {/* Reset Filters Button */}
                {(allWordStatusFilter !== 'ALL' || allWordTopicFilter !== 'ALL' || allWordCefrFilter !== 'ALL' || allWordPosFilter !== 'ALL' || allWordSearch) && (
                  <button
                    onClick={() => {
                      setAllWordStatusFilter('ALL');
                      setAllWordTopicFilter('ALL');
                      setAllWordCefrFilter('ALL');
                      setAllWordPosFilter('ALL');
                      setAllWordSearch('');
                    }}
                    className="btn-glass-secondary btn-glass-sm"
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

          {/* Results Summary Counter & View Switcher */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-semibold">
            <span>
              Hiển thị <strong className="text-indigo-600 dark:text-indigo-400">{allFilteredWords.length}</strong> từ vựng
            </span>

            {/* View Mode Switcher (Dưới ô vs Danh sách) */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => toggleWordViewMode('grid')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  wordViewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Hiển thị: Dưới ô"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dưới ô</span>
              </button>
              <button
                type="button"
                onClick={() => toggleWordViewMode('list')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  wordViewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Hiển thị: Danh sách"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Danh sách</span>
              </button>
            </div>
          </div>

          {/* Words Display for "Tất cả từ": Empty, List, or Grid */}
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
                className="btn-glass-primary btn-glass-sm"
              >
                <span>Xóa bộ lọc</span>
              </button>
            </div>
          ) : wordViewMode === 'list' ? (
            /* =================================================================
               LIST VIEW FOR ALL WORDS (DANH SÁCH TẤT CẢ TỪ)
               ================================================================= */
            <div className="overflow-hidden rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-xs backdrop-blur-xl">
              <div ref={virtualAllWordsTable.containerRef} className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/75 dark:bg-slate-800/50 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                      <th className="py-3 px-3 w-10 text-center">Nghe</th>
                      <th 
                        onClick={() => handleToggleAllWordSort('word')}
                        className="py-3 px-4 cursor-pointer select-none hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Từ vựng & Loại từ</span>
                          {allWordSortCol === 'word' ? (
                            allWordSortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-500" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-500" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleToggleAllWordSort('meaning')}
                        className="py-3 px-4 cursor-pointer select-none hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Nghĩa tiếng Việt</span>
                          {allWordSortCol === 'meaning' ? (
                            allWordSortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-500" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-500" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleToggleAllWordSort('deck')}
                        className="py-3 px-3 cursor-pointer select-none hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Kho chứa</span>
                          {allWordSortCol === 'deck' ? (
                            allWordSortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-500" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-500" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleToggleAllWordSort('topic')}
                        className="py-3 px-3 cursor-pointer select-none hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Chủ đề</span>
                          {allWordSortCol === 'topic' ? (
                            allWordSortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-500" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-500" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleToggleAllWordSort('cefr')}
                        className="py-3 px-3 text-center cursor-pointer select-none hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span>Cấp độ</span>
                          {allWordSortCol === 'cefr' ? (
                            allWordSortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-500" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-500" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleToggleAllWordSort('status')}
                        className="py-3 px-3 text-center cursor-pointer select-none hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span>Trạng thái</span>
                          {allWordSortCol === 'status' ? (
                            allWordSortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-500" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-500" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th className="py-3 px-2 w-10 text-center">Thích</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                    {virtualAllWordsTable.topSpacerHeight > 0 && (
                      <tr>
                        <td colSpan={9} style={{ height: `${virtualAllWordsTable.topSpacerHeight}px`, padding: 0, border: 'none' }} />
                      </tr>
                    )}
                    {virtualAllWordsTable.virtualItems.map(({ item }) => {
                      const isFav = favoriteIds.includes(item.id) || item.isFavorite;
                      const realTopic = item.topic || item.vocabulary?.topic || 'General';
                      const cefrLevel = item.cefrLevel || item.vocabulary?.cefrLevel || 'B1';

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/40 transition duration-150 cv-auto-row"
                        >
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={(e) => handlePlayAudio(item.word, e)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600 transition"
                              title="Phát âm chuẩn (Web Speech)"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-slate-900 dark:text-white text-sm">
                                {item.word}
                              </span>
                              {renderPosBadge(item.partOfSpeech)}
                            </div>
                            {item.phonetic && (
                              <span className="text-[11px] text-sky-500 dark:text-sky-300 font-mono block mt-0.5">
                                {item.phonetic}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 max-w-xs sm:max-w-sm">
                            <p className="text-slate-800 dark:text-slate-200 font-bold line-clamp-1">
                              {item.meaning}
                            </p>
                            {item.example && (
                              <p className="text-[11px] text-slate-400 italic line-clamp-1 mt-0.5">
                                "{item.example}"
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {item.deckName || 'General'}
                            </span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 inline-flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5 opacity-60" />
                              <span>{realTopic}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              {cefrLevel}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                item.status === 'MASTERED'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}
                            >
                              {item.status === 'MASTERED' ? 'Đã thuộc' : 'Đang học'}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              onClick={(e) => handleToggleFavorite(item.id, e)}
                              className={`p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 transition ${
                                isFav ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
                              }`}
                              title={isFav ? 'Bỏ yêu thích' : 'Yêu thích từ này'}
                            >
                              <Heart
                                className={`w-3.5 h-3.5 ${
                                  isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                                }`}
                              />
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1">
                              <button
                                onClick={(e) => handleOpenEditWord(item, e)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 transition"
                                title="Sửa từ này"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setWordToDelete(item);
                                }}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 text-slate-400 hover:text-rose-600 transition"
                                title="Xóa từ này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {virtualAllWordsTable.bottomSpacerHeight > 0 && (
                      <tr>
                        <td colSpan={9} style={{ height: `${virtualAllWordsTable.bottomSpacerHeight}px`, padding: 0, border: 'none' }} />
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* =================================================================
               GRID VIEW FOR ALL WORDS (DƯỚI Ô)
               ================================================================= */
            <div ref={virtualAllWordsGrid.containerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {virtualAllWordsGrid.topSpacerHeight > 0 && (
                <div style={{ height: `${virtualAllWordsGrid.topSpacerHeight}px` }} className="col-span-full" />
              )}
              {virtualAllWordsGrid.virtualItems.map(({ item }) => {
                const isFav = favoriteIds.includes(item.id) || item.isFavorite;
                // Topic is NEVER the deck name!
                const realTopic = item.topic || item.vocabulary?.topic || 'General';
                const cefrLevel = item.cefrLevel || item.vocabulary?.cefrLevel || 'B1';

                return (
                  <div
                    key={item.id}
                    className="p-4 flex flex-col justify-between space-y-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 transition duration-150 shadow-xs hover:shadow-md cv-auto-card"
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
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600 transition"
                            title="Phát âm chuẩn (Web Speech)"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => handleToggleFavorite(item.id, e)}
                            className={`p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 transition ${
                              isFav ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
                            }`}
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
                          <p className="text-xs text-sky-500 dark:text-sky-300 font-mono tracking-tight mt-0.5 truncate">
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
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 transition"
                          title="Sửa từ này"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setWordToDelete(item);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 text-slate-400 hover:text-rose-600 transition"
                          title="Xóa từ này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {virtualAllWordsGrid.bottomSpacerHeight > 0 && (
                <div style={{ height: `${virtualAllWordsGrid.bottomSpacerHeight}px` }} className="col-span-full" />
              )}
            </div>
          )}

          {/* Virtual Windowing Indicator for All Words */}
          <div className="w-full py-3 flex flex-col items-center justify-center gap-1">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Đang tối ưu hiển thị {allFilteredWords.length} từ vựng bằng Virtual Windowing (Chống giật lag)
            </span>
          </div>
        </div>
      )}

      {/* =============================================================================
          MODALS SECTION
          ============================================================================= */}

      {/* 1. UNIFIED CREATE DECK & FILE IMPORT MODAL */}
      <ModalPortal
        isOpen={showCreateDeckModal || showImportModal}
        onClose={() => {
          setShowCreateDeckModal(false);
          setShowImportModal(false);
        }}
      >
        <div
          className={`m-auto w-full max-h-[92vh] flex flex-col rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-700/80 p-5 sm:p-7 shadow-2xl animate-fade-in text-left overflow-hidden ${
            deckModalTab === 'file' ? 'max-w-5xl' : 'max-w-3xl'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/20 dark:from-indigo-950/80 dark:to-purple-950/80 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-sm">
                {deckModalTab === 'file' ? <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <FolderPlus className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {deckModalTab === 'file' ? 'Nạp Kho Từ Bằng File Excel / CSV' : 'Tạo Kho Từ Vựng Mới'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {deckModalTab === 'file'
                    ? 'Nhập hàng loạt từ vựng có cấu hình phân hệ và mật khẩu bảo vệ PIN'
                    : 'Thiết lập thông tin kho từ vựng cá nhân, phân hệ và mật khẩu bảo vệ'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowCreateDeckModal(false);
                setShowImportModal(false);
              }}
              className="btn-glass-secondary btn-glass-icon text-slate-400 hover:text-slate-700 dark:hover:text-white"
              aria-label="Đóng cửa sổ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Top Segmented Tab Switcher */}
          <div className="pt-3 pb-1 shrink-0">
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() => setDeckModalTab('manual')}
                className={`flex-1 py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  deckModalTab === 'manual'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FolderPlus className="w-4 h-4" />
                <span>Tạo kho thủ công</span>
              </button>
              <button
                type="button"
                onClick={() => setDeckModalTab('file')}
                className={`flex-1 py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  deckModalTab === 'file'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Nạp từ file Excel / CSV</span>
              </button>
            </div>
          </div>

          {/* TAB CONTENT */}
          {deckModalTab === 'manual' ? (
            /* =========================================================
               TAB MANUAL CREATION
               ========================================================= */
            <form onSubmit={handleConfirmCreateDeck} className="flex-1 min-h-0 flex flex-col">
              <div className="space-y-4 text-xs sm:text-sm flex-1 min-h-0 overflow-y-auto py-3 pr-1">
                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5 text-xs sm:text-sm">
                    Tên kho từ vựng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={deckTitleInput}
                    onChange={(e) => setDeckTitleInput(e.target.value)}
                    placeholder="Ví dụ: TOEIC 600 Essential Words, IELTS Speaking Part 1, Business Email..."
                    className="w-full h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-semibold text-xs sm:text-sm text-slate-900 dark:text-white transition placeholder:text-slate-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
                  <div>
                    <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5 text-xs sm:text-sm">
                      Không gian học tập (Mặc định)
                    </label>
                    <div className="flex items-center gap-2.5 h-10 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-900 dark:text-white">
                      <CountryFlag languageId={activeLanguage.id} size="sm" />
                      <span>{activeLanguage.nativeName} ({activeLanguage.name})</span>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5 text-xs sm:text-sm">
                      Phân hệ / Lĩnh vực
                    </label>
                    <CustomDropdown
                      value={deckCatInput}
                      onChange={(val) => setDeckCatInput(val)}
                      options={allDeckCategories.map((c) => ({ value: c, label: c }))}
                      searchable={true}
                      searchPlaceholder="Tìm kiếm hoặc tạo danh mục mới..."
                      creatable={true}
                      createPlaceholder='Tạo danh mục mới: "{query}"'
                      onCreateOption={handleCreateCategory}
                      size="md"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5 text-xs sm:text-sm truncate">
                      Cấp độ ({selectedDeckLangDef.nativeName})
                    </label>
                    <CustomDropdown
                      value={deckCefrInput}
                      onChange={(val) => setDeckCefrInput(val)}
                      options={dynamicLevelOptions}
                      size="md"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Lý do & mục tiêu */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm flex items-center gap-1.5">
                      <span>Lý do tạo kho & Mục tiêu học tập</span>
                      <span className="text-[11px] font-normal text-slate-400">
                        (Khuyên dùng để định hình lộ trình)
                      </span>
                    </label>
                    <span className="text-[11px] font-medium text-slate-400">
                      {deckDescInput.length} ký tự
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={deckDescInput}
                    onChange={(e) => setDeckDescInput(e.target.value)}
                    placeholder={"Ví dụ:\n• Lý do: Chuẩn bị thi TOEIC đạt mốc 750+ vào tháng 11 để phục vụ công việc.\n• Mục tiêu: Nắm vững 30 từ vựng hợp đồng kinh tế và báo cáo tài chính mỗi tuần..."}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-normal text-xs sm:text-sm leading-relaxed text-slate-900 dark:text-white transition resize-y min-h-[90px] placeholder:text-slate-400"
                  />
                </div>

                {/* Password Protection */}
                <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-xs sm:text-sm">
                      <Lock className="w-4 h-4 text-amber-500" />
                      <span>Mật khẩu bảo mật kho (PIN) (Tùy chọn)</span>
                    </label>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                      Bảo vệ riêng tư
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showDeckPassword ? 'text' : 'password'}
                      value={deckPasswordInput}
                      onChange={(e) => setDeckPasswordInput(e.target.value)}
                      placeholder="Nhập mã PIN hoặc mật khẩu nếu muốn khóa kho..."
                      className="w-full h-10 px-4 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium text-xs sm:text-sm text-slate-900 dark:text-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeckPassword(!showDeckPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                      title={showDeckPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showDeckPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Nếu đặt mật khẩu, người dùng bắt buộc phải nhập đúng mã PIN để mở khóa và học kho từ này.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateDeckModal(false);
                    setShowImportModal(false);
                  }}
                  disabled={creatingDeck}
                  className="btn-glass-secondary btn-glass-sm !px-5"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingDeck || !deckTitleInput.trim()}
                  className="btn-glass-purple btn-glass-sm !px-6 font-bold flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {creatingDeck ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang tạo kho...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Xác nhận tạo kho</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* =========================================================
               TAB FILE IMPORT (WITH EMBEDDED PASSWORD & METADATA CONFIG)
               ========================================================= */
            <div className="flex-1 min-h-0 flex flex-col space-y-3.5 py-3">
              <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1">
                {/* Configuration: Choose Mode (New Deck vs Existing Deck) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Phương thức nạp:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setImportDeckMode('new')}
                          className={`btn-glass-sm !h-7 text-xs font-bold ${
                            importDeckMode === 'new' ? 'btn-glass-primary' : 'btn-glass-secondary'
                          }`}
                        >
                          Tạo kho mới từ file
                        </button>
                        {decks.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setImportDeckMode('existing');
                              if (!importTargetDeckName && decks.length > 0) {
                                setImportTargetDeckName(decks[0].title);
                              }
                            }}
                            className={`btn-glass-sm !h-7 text-xs font-bold ${
                              importDeckMode === 'existing' ? 'btn-glass-primary' : 'btn-glass-secondary'
                            }`}
                          >
                            Nạp vào kho có sẵn
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Template download buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => downloadVocabularyTemplate('xlsx')}
                        className="btn-glass-secondary btn-glass-sm text-emerald-700 dark:text-emerald-300 !h-7"
                        title="Tải mẫu Excel chuẩn"
                      >
                        <Download className="w-3 h-3" />
                        <span>Mẫu .xlsx</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadVocabularyTemplate('csv')}
                        className="btn-glass-secondary btn-glass-sm text-indigo-600 dark:text-indigo-400 !h-7"
                        title="Tải mẫu CSV chuẩn"
                      >
                        <Download className="w-3 h-3" />
                        <span>Mẫu .csv</span>
                      </button>
                    </div>
                  </div>

                  {/* Fields if Creating New Deck via File */}
                  {importDeckMode === 'new' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div className="sm:col-span-2">
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-[11px]">
                          Tên kho từ vựng mới <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={deckTitleInput}
                          onChange={(e) => setDeckTitleInput(e.target.value)}
                          placeholder="Ví dụ: TOEIC 600 Essential Words..."
                          className="w-full h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-[11px]">
                          Phân hệ / Lĩnh vực
                        </label>
                        <CustomDropdown
                          value={deckCatInput}
                          onChange={(val) => setDeckCatInput(val)}
                          options={allDeckCategories.map((c) => ({ value: c, label: c }))}
                          searchable={true}
                          creatable={true}
                          onCreateOption={handleCreateCategory}
                          size="sm"
                          className="w-full h-9"
                        />
                      </div>

                      {/* Password Protection input for new deck */}
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-[11px] flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Lock className="w-3 h-3 text-amber-500" />
                            <span>Mật khẩu PIN</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">(Tùy chọn)</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showDeckPassword ? 'text' : 'password'}
                            value={deckPasswordInput}
                            onChange={(e) => setDeckPasswordInput(e.target.value)}
                            placeholder="Mã PIN bảo vệ..."
                            className="w-full h-9 px-2.5 pr-8 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/80 font-medium text-xs text-slate-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => setShowDeckPassword(!showDeckPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                          >
                            {showDeckPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Existing Deck Selector + Password Prompt if protected */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-[11px]">
                          Chọn kho từ có sẵn để nạp thêm:
                        </label>
                        <CustomDropdown
                          value={importTargetDeckName}
                          onChange={(val) => setImportTargetDeckName(val)}
                          options={decks.map((d) => ({
                            value: d.title,
                            label: d.title,
                            badge: d.hasPassword ? 'Khóa' : d.cefrLevel,
                          }))}
                          size="md"
                          className="w-full"
                        />
                      </div>

                      {/* Password Prompt if selected deck is locked */}
                      {(() => {
                        const targetDeck = decks.find((d) => d.title === importTargetDeckName);
                        if (targetDeck && (targetDeck.hasPassword || targetDeck.isProtected)) {
                          return (
                            <div>
                              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-[11px] flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                <Lock className="w-3 h-3" />
                                <span>Kho này có mật khẩu — Nhập PIN để xác thực nạp từ:</span>
                              </label>
                              <div className="relative">
                                <input
                                  type={showImportPass ? 'text' : 'password'}
                                  value={importExistingDeckPass}
                                  onChange={(e) => setImportExistingDeckPass(e.target.value)}
                                  placeholder="Nhập mã PIN mở khóa kho..."
                                  className="w-full h-10 px-3 pr-9 rounded-xl bg-white dark:bg-slate-900 border border-amber-400 font-semibold text-xs text-slate-900 dark:text-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowImportPass(!showImportPass)}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                >
                                  {showImportPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>

                {/* Dropzone for Excel / CSV */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/30"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Upload className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {selectedFile ? selectedFile.name : 'Bấm vào đây để chọn file Excel (.xlsx) hoặc CSV từ máy tính'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Hỗ trợ 7 cột chuẩn: Word, Phonetic, PartOfSpeech, Meaning, Example, CEFR, Topic • Tối đa 100MB
                  </p>
                </div>

                {isParsing && (
                  <div className="py-3 text-center text-xs text-indigo-600 font-bold flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang đọc và giải mã file...</span>
                  </div>
                )}

                {parsingError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{parsingError}</span>
                  </div>
                )}

                {/* Staging Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Từ chuẩn bị nạp:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      {parsedWords.length} từ
                    </span>
                    {parsedWords.length > 0 && (
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        (Hợp lệ: <strong className="text-emerald-600 dark:text-emerald-400">{parsedWords.filter((w) => w.word?.trim() && w.meaning?.trim()).length}</strong>)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddManualPreviewWord}
                      className="btn-glass-primary btn-glass-sm inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm từ thủ công</span>
                    </button>
                    {parsedWords.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllParsed}
                        className="btn-glass-danger btn-glass-sm inline-flex items-center gap-1.5"
                        title="Xóa toàn bộ danh sách tạm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa tất cả</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Parsed Interactive Staging Preview Table */}
                {parsedWords.length > 0 ? (
                  <div className="min-h-[160px] max-h-[300px] overflow-y-auto overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl shadow-inner bg-white dark:bg-slate-900/60">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xs sticky top-0 font-bold text-slate-700 dark:text-slate-300 text-[11px] z-10">
                        <tr>
                          <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 w-10 text-center">#</th>
                          <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 min-w-[130px]">Từ vựng (Word) *</th>
                          <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 min-w-[100px]">Phiên âm</th>
                          <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 min-w-[95px]">Loại từ</th>
                          <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 min-w-[170px]">Nghĩa tiếng Việt *</th>
                          <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 min-w-[120px]">Chủ đề (Topic)</th>
                          <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 min-w-[70px]">CEFR</th>
                          <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 min-w-[180px]">Ví dụ / Câu mẫu</th>
                          <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 w-24 text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                        {parsedWords.map((row, idx) => {
                          const isEditing = editingParsedIdx === idx;
                          const isValid = Boolean(row.word?.trim() && row.meaning?.trim());

                          if (isEditing && editingParsedItem) {
                            return (
                              <tr key={idx} className="bg-indigo-50/50 dark:bg-indigo-950/40">
                                <td className="p-2 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={editingParsedItem.word}
                                    onChange={(e) =>
                                      setEditingParsedItem({ ...editingParsedItem, word: e.target.value })
                                    }
                                    placeholder="word *"
                                    className="w-full h-8 px-2 rounded-lg border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-slate-900 text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none"
                                    autoFocus
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={editingParsedItem.phonetic || ''}
                                    onChange={(e) =>
                                      setEditingParsedItem({ ...editingParsedItem, phonetic: e.target.value })
                                    }
                                    placeholder="/.../"
                                    className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none"
                                  />
                                </td>
                                <td className="p-2">
                                  <select
                                    value={editingParsedItem.partOfSpeech || 'noun'}
                                    onChange={(e) =>
                                      setEditingParsedItem({ ...editingParsedItem, partOfSpeech: e.target.value })
                                    }
                                    className="w-full h-8 px-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs italic focus:outline-none"
                                  >
                                    <option value="noun">noun</option>
                                    <option value="verb">verb</option>
                                    <option value="adjective">adjective</option>
                                    <option value="adverb">adverb</option>
                                    <option value="preposition">preposition</option>
                                    <option value="phrase">phrase</option>
                                    <option value="idiom">idiom</option>
                                  </select>
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={editingParsedItem.meaning}
                                    onChange={(e) =>
                                      setEditingParsedItem({ ...editingParsedItem, meaning: e.target.value })
                                    }
                                    placeholder="nghĩa tiếng Việt *"
                                    className="w-full h-8 px-2 rounded-lg border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={editingParsedItem.topic || 'General'}
                                    onChange={(e) =>
                                      setEditingParsedItem({ ...editingParsedItem, topic: e.target.value })
                                    }
                                    placeholder="Chủ đề..."
                                    className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-emerald-600 dark:text-emerald-400 focus:outline-none"
                                  />
                                </td>
                                <td className="p-2">
                                  <select
                                    value={editingParsedItem.cefrLevel || 'B1'}
                                    onChange={(e) =>
                                      setEditingParsedItem({ ...editingParsedItem, cefrLevel: e.target.value })
                                    }
                                    className="w-full h-8 px-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none"
                                  >
                                    {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                                      <option key={lvl} value={lvl}>
                                        {lvl}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={editingParsedItem.example || ''}
                                    onChange={(e) =>
                                      setEditingParsedItem({ ...editingParsedItem, example: e.target.value })
                                    }
                                    placeholder="Câu ví dụ..."
                                    className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none"
                                  />
                                </td>
                                <td className="p-2 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEditParsed(idx)}
                                      className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition cursor-pointer"
                                      title="Lưu dòng này"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCancelEditParsed}
                                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition cursor-pointer"
                                      title="Hủy chỉnh sửa"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr
                              key={idx}
                              className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                                !isValid ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                              }`}
                            >
                              <td className="p-2.5 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                              <td className="p-2.5 font-bold text-indigo-600 dark:text-indigo-400">
                                {row.word || <span className="text-rose-500 italic font-normal">(Chưa có từ)</span>}
                              </td>
                              <td className="p-2.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                {row.phonetic || '-'}
                              </td>
                              <td className="p-2.5 italic text-slate-600 dark:text-slate-400">
                                {row.partOfSpeech || 'noun'}
                              </td>
                              <td className="p-2.5 text-slate-800 dark:text-slate-200">
                                {row.meaning || <span className="text-rose-500 italic font-normal">(Chưa có nghĩa)</span>}
                              </td>
                              <td className="p-2.5 font-semibold text-emerald-600 dark:text-emerald-400">
                                {row.topic || 'General'}
                              </td>
                              <td className="p-2.5">
                                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {row.cefrLevel || 'B1'}
                                </span>
                              </td>
                              <td className="p-2.5 text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={row.example || ''}>
                                {row.example || '-'}
                              </td>
                              <td className="p-2.5 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditParsed(idx)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition cursor-pointer"
                                    title="Sửa từ vựng này"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteParsed(idx)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
                                    title="Xóa khỏi danh sách"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 space-y-1.5">
                    <FileSpreadsheet className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Chưa có dữ liệu từ vựng trong danh sách xem trước
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Hãy chọn file Excel/CSV ở trên hoặc bấm &quot;Thêm từ thủ công&quot; để nhập trực tiếp.
                    </p>
                  </div>
                )}

                {importProgressMsg && (
                  <div className="p-3 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold text-center space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                      <span>{importProgressMsg}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-indigo-200/60 dark:bg-indigo-900/60 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500 rounded-full animate-pulse w-full"></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <span className="text-xs font-bold text-slate-500">
                  Từ hợp lệ: <strong className="text-indigo-600">{parsedWords.filter((w) => w.word?.trim() && w.meaning?.trim()).length}</strong> từ
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateDeckModal(false);
                      setShowImportModal(false);
                    }}
                    className="btn-glass-secondary btn-glass-sm"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmBatchImport}
                    disabled={isImporting || parsedWords.length === 0}
                    className="btn-glass-emerald btn-glass-sm inline-flex items-center gap-1.5 font-bold"
                  >
                    {isImporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    <span>{isImporting ? 'Đang nạp...' : 'Xác nhận nạp vào kho'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </ModalPortal>

      {/* 2. EDIT DECK MODAL */}
      <ModalPortal isOpen={showEditDeckModal} onClose={() => setShowEditDeckModal(false)}>
        <form
          onSubmit={handleConfirmEditDeck}
          className="m-auto max-w-3xl w-full max-h-[92vh] flex flex-col rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-700/80 p-6 sm:p-8 shadow-2xl animate-fade-in text-left overflow-hidden"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/20 dark:from-indigo-950/80 dark:to-purple-950/80 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-sm">
                <Edit3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Sửa Thông Tin Kho Từ Vựng
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Cập nhật tên, lý do, mục tiêu học tập, danh mục hoặc mật khẩu bảo mật của kho từ
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowEditDeckModal(false)}
              className="btn-glass-secondary btn-glass-icon text-slate-400 hover:text-slate-700 dark:hover:text-white"
              aria-label="Đóng cửa sổ sửa kho"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-5 text-xs sm:text-sm flex-1 min-h-0 overflow-y-auto py-4 pr-1">
            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-2 text-xs sm:text-sm">
                Tên kho từ vựng <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={deckTitleInput}
                onChange={(e) => setDeckTitleInput(e.target.value)}
                className="w-full h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-semibold text-xs sm:text-sm text-slate-900 dark:text-white transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-2 text-xs sm:text-sm">
                  Lĩnh vực / Danh mục
                </label>
                <CustomDropdown
                  value={deckCatInput}
                  onChange={(val) => setDeckCatInput(val)}
                  options={allDeckCategories.map((c) => ({ value: c, label: c }))}
                  searchable={true}
                  searchPlaceholder="Tìm kiếm hoặc tạo danh mục mới..."
                  creatable={true}
                  createPlaceholder='Tạo danh mục mới: "{query}"'
                  onCreateOption={handleCreateCategory}
                  size="md"
                  className="w-full"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-2 text-xs sm:text-sm">
                  Cấp độ chuẩn (CEFR)
                </label>
                <CustomDropdown
                  value={deckCefrInput}
                  onChange={(val) => setDeckCefrInput(val)}
                  options={[
                    { value: 'A1', label: 'A1 — Beginner', badge: 'A1' },
                    { value: 'A2', label: 'A2 — Elementary', badge: 'A2' },
                    { value: 'B1', label: 'B1 — Intermediate', badge: 'B1' },
                    { value: 'B2', label: 'B2 — Upper-Inter', badge: 'B2' },
                    { value: 'C1', label: 'C1 — Advanced', badge: 'C1' },
                    { value: 'C2', label: 'C2 — Mastery', badge: 'C2' },
                  ]}
                  size="md"
                  className="w-full"
                />
              </div>
            </div>

            {/* LÝ DO TẠO KHO & MỤC TIÊU HỌC TẬP */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm flex items-center gap-1.5">
                  <span>Lý do tạo kho & Mô tả mục tiêu học tập</span>
                  <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                    (Tối thiểu 4-5 dòng để định hình rõ lộ trình)
                  </span>
                </label>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  {deckDescInput.length} ký tự
                </span>
              </div>
              <textarea
                rows={5}
                value={deckDescInput}
                onChange={(e) => setDeckDescInput(e.target.value)}
                placeholder={"Ví dụ:\n• Lý do: Chuẩn bị thi TOEIC đạt mốc 750+ vào tháng 11 để phục vụ công việc.\n• Mục tiêu: Nắm vững 30 từ vựng hợp đồng kinh tế và báo cáo tài chính mỗi tuần.\n• Nguồn tài liệu: Trích xuất từ đề thi ETS 2024 và tài liệu thực tế tại văn phòng..."}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-normal text-xs sm:text-sm leading-relaxed text-slate-900 dark:text-white transition resize-y min-h-[140px]"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-xs sm:text-sm">
                <Lock className="w-4 h-4 text-amber-500" />
                <span>Mật khẩu bảo mật kho (Tùy chọn)</span>
              </label>
              <input
                type="password"
                value={deckPasswordInput}
                onChange={(e) => setDeckPasswordInput(e.target.value)}
                placeholder="Để trống để giữ nguyên hoặc xóa trắng nếu muốn mở khóa..."
                className="w-full h-10 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium text-xs sm:text-sm text-slate-900 dark:text-white transition"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Để trống nếu muốn giữ nguyên mật khẩu cũ, hoặc xóa trắng để gỡ bỏ bảo vệ PIN.
              </p>
            </div>

            {/* Trạng thái / Chế độ hiển thị */}
            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-2 text-xs sm:text-sm">
                Trạng thái kho từ vựng
              </label>
              <CustomDropdown
                value={deckStatusInput}
                onChange={(val: any) => setDeckStatusInput(val)}
                options={[
                  {
                    value: 'PRIVATE',
                    label: 'Lưu riêng tư (Chỉ mình tôi)',
                    badge: 'Riêng tư',
                  },
                  {
                    value: 'PENDING',
                    label: 'Chia sẻ lên Cộng đồng (Gửi duyệt)',
                    badge: 'Cộng đồng',
                  },
                  ...(deckToEdit?.status === 'APPROVED'
                    ? [{ value: 'APPROVED', label: 'Đã phê duyệt trên Cộng đồng', badge: 'Công khai' }]
                    : []),
                ]}
                size="md"
                className="w-full"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                Bạn có toàn quyền chuyển trạng thái giữa Lưu riêng tư hoặc gửi kiểm duyệt chia sẻ công khai lên Cộng đồng.
              </p>
            </div>

            {/* Gỡ khỏi Cloud Action */}
            {deckToEdit?.isSyncedToCloud && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Kho đang được lưu trữ trên Cloud
                  </h4>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                    Gỡ kho khỏi Cloud sẽ xóa bản chia sẻ/máy chủ và chuyển thành kho offline an toàn trên máy này.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditDeckModal(false);
                    if (deckToEdit) handleUnlinkFromCloud(deckToEdit);
                  }}
                  className="btn-glass-secondary text-xs !py-2 !px-3.5 font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 shrink-0"
                >
                  Gỡ khỏi Cloud
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setShowEditDeckModal(false)}
              className="btn-glass-secondary btn-glass-sm !px-5"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-glass-primary btn-glass-sm !px-6 font-bold"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </form>
      </ModalPortal>

      {/* PASSWORD UNLOCK MODAL FOR PERSONAL / CLONED DECKS */}
      <ModalPortal isOpen={Boolean(deckToUnlock)} onClose={() => setDeckToUnlock(null)}>
        {deckToUnlock && (
          <form
            onSubmit={handleUnlockPersonalDeckSubmit}
            className="m-auto max-w-md w-full rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-700/80 p-7 space-y-6 shadow-2xl animate-fade-in text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-sm">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Kho từ vựng được bảo vệ
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Nhập mật khẩu / PIN để mở khóa kho &quot;{deckToUnlock.title}&quot;
                </p>
              </div>
            </div>

            {deckUnlockError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deckUnlockError}</span>
              </div>
            )}

            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-2 text-xs sm:text-sm">
                Mật khẩu mở khóa <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                autoFocus
                value={deckUnlockInput}
                onChange={(e) => setDeckUnlockInput(e.target.value)}
                placeholder="Nhập mã PIN hoặc mật khẩu..."
                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-semibold text-sm text-slate-900 dark:text-white transition"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeckToUnlock(null)}
                className="btn-glass-secondary btn-glass-sm !px-5"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={deckUnlocking || !deckUnlockInput.trim()}
                className="btn-glass-primary btn-glass-sm !px-6 font-bold disabled:opacity-50"
              >
                {deckUnlocking ? 'Đang kiểm tra...' : 'Mở khóa'}
              </button>
            </div>
          </form>
        )}
      </ModalPortal>

      {/* 3. DELETE SINGLE DECK CONFIRMATION MODAL */}
      <ModalPortal isOpen={Boolean(deckToDelete)} onClose={() => setDeckToDelete(null)}>
        {deckToDelete && (
          <div className="m-auto max-w-lg w-full rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-700/80 p-7 space-y-5 shadow-2xl animate-fade-in text-left">
            <div className="flex items-center gap-3.5 text-rose-600">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Xóa Kho Từ Vựng?</h3>
                <p className="text-xs text-slate-500">Hành động này không thể hoàn tác.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa kho từ <strong className="text-indigo-600 dark:text-indigo-400">{deckToDelete.title}</strong> không? Toàn bộ từ vựng thuộc kho này sẽ bị xóa khỏi bộ nhớ và dữ liệu cá nhân của bạn.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeckToDelete(null)}
                className="btn-glass-secondary btn-glass-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDeck}
                disabled={deletingDecks}
                className="btn-glass-danger btn-glass-sm"
              >
                {deletingDecks ? 'Đang xóa...' : 'Xác nhận xóa kho'}
              </button>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* 4. BULK DELETE DECKS MODAL */}
      <ModalPortal isOpen={showBulkDeleteDecksModal} onClose={() => setShowBulkDeleteDecksModal(false)}>
        <div className="m-auto max-w-lg w-full rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-700/80 p-7 space-y-5 shadow-2xl animate-fade-in text-left">
          <div className="flex items-center gap-3.5 text-rose-600">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center shrink-0">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Xóa Nhiều Kho Từ Vựng?</h3>
              <p className="text-xs text-slate-500">Đã chọn {selectedDeckIds.length} kho từ vựng.</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Bạn có chắc chắn muốn xóa <strong className="text-rose-600 font-bold">{selectedDeckIds.length} kho từ vựng đã chọn</strong>? Toàn bộ từ vựng thuộc các kho này cũng sẽ bị xóa vĩnh viễn.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowBulkDeleteDecksModal(false)}
              className="btn-glass-secondary btn-glass-sm"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmBulkDeleteDecks}
              disabled={deletingDecks}
              className="btn-glass-danger btn-glass-sm"
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
          className="m-auto max-w-3xl w-full max-h-[92vh] flex flex-col rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-700/80 p-6 sm:p-7 shadow-2xl animate-fade-in text-left overflow-hidden"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                {showEditWordModal ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {showEditWordModal ? 'Chỉnh Sửa Từ Vựng' : 'Thêm Từ Vựng Mới'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Nhập thông tin chi tiết của từ vựng, phiên âm, định nghĩa và ví dụ minh họa
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowAddWordModal(false);
                setShowEditWordModal(false);
              }}
              className="btn-glass-secondary btn-glass-icon text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 text-xs flex-1 min-h-0 overflow-y-auto py-3 pr-1">
            {decks.length === 0 ? (
              <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-200 text-center space-y-3 my-2">
                <p className="font-bold text-base">Chưa có kho từ vựng nào!</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Để thêm từ vựng, trước tiên bạn cần tạo ít nhất một kho từ để lưu trữ và quản lý từ vựng của bạn.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddWordModal(false);
                    setShowCreateDeckModal(true);
                  }}
                  className="btn-glass-purple btn-glass-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo kho từ vựng ngay</span>
                </button>
              </div>
            ) : (
              <>
                {/* Row 1: Word & Phonetic */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 text-xs">
                      Từ tiếng Anh <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={wordFormWord}
                      onChange={(e) => setWordFormWord(e.target.value)}
                      placeholder="Ví dụ: agreement"
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-bold text-sm text-slate-900 dark:text-white transition"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 text-xs">
                      Phiên âm IPA
                    </label>
                    <input
                      type="text"
                      value={wordFormPhonetic}
                      onChange={(e) => setWordFormPhonetic(e.target.value)}
                      placeholder="/əˈɡriː.mənt/"
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono text-xs text-indigo-600 dark:text-indigo-400 transition"
                    />
                  </div>
                </div>

                {/* Row 2: Meaning & Part of Speech */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 text-xs">
                      Nghĩa tiếng Việt <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={wordFormMeaning}
                      onChange={(e) => setWordFormMeaning(e.target.value)}
                      placeholder="sự thỏa thuận, hợp đồng..."
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium text-xs text-slate-900 dark:text-white transition"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 text-xs">
                      Loại từ
                    </label>
                    <CustomDropdown
                      value={wordFormPos}
                      onChange={(val) => setWordFormPos(val)}
                      options={[
                        { value: 'noun', label: 'Danh từ (noun)', badge: 'n' },
                        { value: 'verb', label: 'Động từ (verb)', badge: 'v' },
                        { value: 'adjective', label: 'Tính từ (adjective)', badge: 'adj' },
                        { value: 'adverb', label: 'Trạng từ (adverb)', badge: 'adv' },
                        { value: 'preposition', label: 'Giới từ (preposition)', badge: 'prep' },
                      ]}
                      size="md"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Row 3: Real Topic & Target Deck */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 text-xs">
                      Chủ đề thực tế của từ (Topic) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={wordFormTopic}
                      onChange={(e) => setWordFormTopic(e.target.value)}
                      placeholder="Ví dụ: Contracts, Marketing, Travel, Finance..."
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium text-xs text-slate-900 dark:text-white transition"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Lưu ý: Đây là chủ đề thực tế của từ (như Hợp đồng, Du lịch...), không phải tên kho.
                    </p>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 text-xs">
                      Kho từ vựng chứa
                    </label>
                    <CustomDropdown
                      value={wordFormTargetDeck}
                      onChange={(val) => setWordFormTargetDeck(val)}
                      options={decks.map((d) => ({
                        value: d.title,
                        label: `Kho: ${d.title}`,
                        badge: d.cefrLevel,
                      }))}
                      size="md"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Row 4: Level */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 text-xs">
                      Cấp độ ({activeLanguage.nativeName})
                    </label>
                    <CustomDropdown
                      value={wordFormCefr}
                      onChange={(val) => setWordFormCefr(val)}
                      options={(activeLanguage.supportedLevels || ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).map((lvl) => ({
                        value: lvl,
                        label: `${lvl} — Trình độ ${lvl}`,
                        badge: lvl,
                      }))}
                      size="md"
                      className="w-full"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Examples */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 text-xs">
                Câu ví dụ tiếng Anh
              </label>
              <textarea
                rows={2}
                value={wordFormExample}
                onChange={(e) => setWordFormExample(e.target.value)}
                placeholder="They reached an agreement after a lengthy negotiation."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium text-xs text-slate-900 dark:text-white transition"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 text-xs">
                Dịch câu ví dụ
              </label>
              <input
                type="text"
                value={wordFormExampleTrans}
                onChange={(e) => setWordFormExampleTrans(e.target.value)}
                placeholder="Họ đã đạt được thỏa thuận sau một cuộc đàm phán kéo dài."
                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium text-xs text-slate-900 dark:text-white transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowAddWordModal(false);
                setShowEditWordModal(false);
              }}
              className="btn-glass-secondary btn-glass-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-glass-primary btn-glass-sm"
            >
              {showEditWordModal ? 'Lưu thay đổi' : 'Thêm từ vựng'}
            </button>
          </div>
        </form>
      </ModalPortal>

      {/* 6. DELETE SINGLE WORD MODAL */}
      <ModalPortal isOpen={Boolean(wordToDelete)} onClose={() => setWordToDelete(null)}>
        {wordToDelete && (
          <div className="m-auto max-w-lg w-full rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-700/80 p-7 space-y-5 shadow-2xl animate-fade-in text-left">
            <div className="flex items-center gap-3.5 text-rose-600">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Xóa Từ Vựng?</h3>
                <p className="text-xs text-slate-500">Từ vựng: "{wordToDelete.word}"</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa từ vựng <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{wordToDelete.word}</strong> ({wordToDelete.meaning}) không?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setWordToDelete(null)}
                className="btn-glass-secondary btn-glass-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteWord}
                disabled={deletingWords}
                className="btn-glass-danger btn-glass-sm"
              >
                {deletingWords ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* 7. BULK DELETE WORDS MODAL */}
      <ModalPortal isOpen={showBulkDeleteWordsModal} onClose={() => setShowBulkDeleteWordsModal(false)}>
        <div className="m-auto max-w-lg w-full rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-700/80 p-7 space-y-5 shadow-2xl animate-fade-in text-left">
          <div className="flex items-center gap-3.5 text-rose-600">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center shrink-0">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Xóa Nhiều Từ Vựng?</h3>
              <p className="text-xs text-slate-500">Đã chọn {selectedWordIds.length} từ vựng.</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Bạn có chắc chắn muốn xóa <strong className="text-rose-600 font-bold">{selectedWordIds.length} từ vựng đã chọn</strong> khỏi kho từ?
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowBulkDeleteWordsModal(false)}
              className="btn-glass-secondary btn-glass-sm"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmBulkDeleteWords}
              disabled={deletingWords}
              className="btn-glass-danger btn-glass-sm"
            >
              {deletingWords ? 'Đang xóa...' : 'Xác nhận xóa các từ'}
            </button>
          </div>
        </div>
      </ModalPortal>



      {/* 9. SHARE DECK MODAL */}
      <ModalPortal isOpen={Boolean(shareModalDeck)} onClose={() => setShareModalDeck(null)}>
        {shareModalDeck && (
          <form
            onSubmit={handleConfirmShareDeck}
            className="m-auto max-w-xl w-full max-h-[92vh] flex flex-col rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-700/80 p-6 sm:p-7 shadow-2xl animate-fade-in text-left overflow-hidden"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Chia Sẻ Kho Lên Cộng Đồng
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kho từ của bạn sẽ được đăng lên thư viện cộng đồng để mọi người cùng học tập
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShareModalDeck(null)}
                className="btn-glass-secondary btn-glass-icon text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs flex-1 min-h-0 overflow-y-auto py-3 pr-1">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 text-xs">
                  Tiêu đề chia sẻ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={shareTitle}
                  onChange={(e) => setShareTitle(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium text-xs text-slate-900 dark:text-white transition"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 text-xs">
                  Mô tả kho
                </label>
                <textarea
                  rows={3}
                  value={shareDescription}
                  onChange={(e) => setShareDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium text-xs text-slate-900 dark:text-white transition"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 text-xs">
                  Danh mục
                </label>
                <CustomDropdown
                  value={shareCategory}
                  onChange={(val) => setShareCategory(val)}
                  options={[
                    { value: 'Business English', label: 'Business English' },
                    { value: 'TOEIC Test', label: 'TOEIC Test' },
                    { value: 'IELTS Academic', label: 'IELTS Academic' },
                    { value: 'Daily Communication', label: 'Giao tiếp hàng ngày' },
                  ]}
                  size="md"
                  className="w-full"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Đặt mật khẩu bảo vệ kho
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Chỉ ai có mật khẩu mới sao chép được kho từ này
                      </div>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={shareEnablePassword}
                    onChange={(checked) => setShareEnablePassword(checked)}
                    size="sm"
                  />
                </div>
                {shareEnablePassword && (
                  <input
                    type="password"
                    required
                    value={sharePassword}
                    onChange={(e) => setSharePassword(e.target.value)}
                    placeholder="Nhập mật khẩu truy cập kho..."
                    className="w-full h-10 mt-2 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-xs text-slate-900 dark:text-white"
                  />
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setShareModalDeck(null)}
                className="btn-glass-secondary btn-glass-sm"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={sharing}
                className="btn-glass-purple btn-glass-sm"
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

      {/* Guided Interactive Intro Tour for New Users */}
      <WordBankTour isOpen={showTour} onClose={() => setShowTour(false)} />
    </div>
  );
};
