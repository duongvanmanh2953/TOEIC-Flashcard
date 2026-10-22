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
  Cloud,
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
  MoreVertical,
  Tag,
} from 'lucide-react';
import {
  downloadVocabularyTemplate,
  parseVocabularyFile,
  exportWordsToExcelOrCsv,
  ParsedWordItem,
} from '../utils/excelTemplate';
import { WordBankTour } from '../components/common/WordBankTour';
import { DeckStandardFields } from '../components/deck/DeckStandardFields';
import { UnifiedDeckModal, UnifiedDeckFormData } from '../components/deck/UnifiedDeckModal';
import { EditableVocabularyStagingTable } from '../components/deck/EditableVocabularyStagingTable';
import { DeckCardItem } from '../components/deck/DeckCardItem';
import { DeckTableRowItem } from '../components/deck/DeckTableRowItem';
import { WordTableRowItem } from '../components/deck/WordTableRowItem';
import { WordCardItem } from '../components/deck/WordCardItem';
import { WordFormModal } from '../components/deck/WordFormModal';
import { WordImportModal } from '../components/deck/WordImportModal';
import { WordBankConfirmModals } from '../components/deck/WordBankConfirmModals';
import {
  getLanguageStandard,
  getCertificatesForLanguage,
  getCategoriesForLanguage,
  getDefaultCategoryForLanguage,
  getDefaultLevelForLanguage,
  getDefaultCertificateForLanguage,
  mapToCefrEquivalent,
} from '../config/languageStandards';

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

  // Decks Selection & Search state
  const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>([]);
  const [deckSearch, setDeckSearch] = useState('');
  const [deckCategoryFilter, setDeckCategoryFilter] = useState('ALL');
  const [deckSyncFilter, setDeckSyncFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE'>('ALL');

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

  // View Modes: 'grid' (dưới ô) vs 'list' (danh sách)
  const [deckViewMode, setDeckViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('letstun_deck_view_mode') as 'grid' | 'list') || 'grid';
  });
  const [wordViewMode, setWordViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('letstun_word_view_mode') as 'grid' | 'list') || 'grid';
  });

  const toggleDeckViewMode = (mode: 'grid' | 'list') => {
    setDeckViewMode(mode);
    try {
      localStorage.setItem('letstun_deck_view_mode', mode);
    } catch {}
  };

  const toggleWordViewMode = (mode: 'grid' | 'list') => {
    setWordViewMode(mode);
    try {
      localStorage.setItem('letstun_word_view_mode', mode);
    } catch {}
  };

  // Favorites state
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('letstun_favorites') || '[]');
    } catch {
      return [];
    }
  });

  // Notification banners
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Unified Deck Modal State (Create / Edit / Share)
  const [unifiedDeckModalOpen, setUnifiedDeckModalOpen] = useState(false);
  const [unifiedDeckModalMode, setUnifiedDeckModalMode] = useState<'create' | 'edit'>('create');
  const [unifiedDeckInitialData, setUnifiedDeckInitialData] = useState<Partial<UnifiedDeckFormData> | undefined>(undefined);
  const [unifiedDeckLoading, setUnifiedDeckLoading] = useState(false);

  // Deck Modals State
  const [showCreateDeckModal, setShowCreateDeckModal] = useState(false);
  const [showEditDeckModal, setShowEditDeckModal] = useState(false);
  const [deckToEdit, setDeckToEdit] = useState<LocalDeck | null>(null);
  const [deckTitleInput, setDeckTitleInput] = useState('');
  const [deckDescInput, setDeckDescInput] = useState('');
  const [deckLangInput, setDeckLangInput] = useState<string>(activeLanguage.id);
  const [deckCertInput, setDeckCertInput] = useState<string>(() => getDefaultCertificateForLanguage(activeLanguage.id).id);
  const [deckCatInput, setDeckCatInput] = useState<string>(() => getDefaultCategoryForLanguage(activeLanguage.id));
  const [deckCefrInput, setDeckCefrInput] = useState<string>(() => getDefaultLevelForLanguage(activeLanguage.id).name);
  const [deckPasswordInput, setDeckPasswordInput] = useState('');
  const [deckStatusInput, setDeckStatusInput] = useState<'PENDING' | 'PRIVATE' | 'APPROVED'>('PRIVATE');
  const [creatingDeck, setCreatingDeck] = useState(false);
  const [createDeckMode, setCreateDeckMode] = useState<'manual' | 'file'>('manual');

  // Auto-sync deck modal defaults when active language changes
  useEffect(() => {
    setDeckLangInput(activeLanguage.id);
    const defCert = getDefaultCertificateForLanguage(activeLanguage.id);
    setDeckCertInput(defCert.id);
    setDeckCatInput(getDefaultCategoryForLanguage(activeLanguage.id));
    setDeckCefrInput(getDefaultLevelForLanguage(activeLanguage.id).name);
  }, [activeLanguage.id]);

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
      const saved = localStorage.getItem('letstun_custom_deck_categories');
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
      localStorage.setItem('letstun_custom_deck_categories', JSON.stringify(updated));
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
  const [addWordMode, setAddWordMode] = useState<'manual' | 'file'>('manual');
  const [showEditWordModal, setShowEditWordModal] = useState(false);
  const [wordToEdit, setWordToEdit] = useState<any | null>(null);
  const [wordFormWord, setWordFormWord] = useState('');
  const [wordFormPhonetic, setWordFormPhonetic] = useState('');
  const [wordFormPos, setWordFormPos] = useState('noun');
  const [wordFormMeaning, setWordFormMeaning] = useState('');
  const [wordFormExample, setWordFormExample] = useState('');
  const [wordFormExampleTrans, setWordFormExampleTrans] = useState('');
  const [wordFormTopic, setWordFormTopic] = useState('General');
  const [wordFormCert, setWordFormCert] = useState('cefr');
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
  const [importNewDeckLang, setImportNewDeckLang] = useState<string>(activeLanguage.id);
  const [importNewDeckCert, setImportNewDeckCert] = useState<string>(() => getDefaultCertificateForLanguage(activeLanguage.id).id);
  const [importNewDeckCategory, setImportNewDeckCategory] = useState<string>(() => getDefaultCategoryForLanguage(activeLanguage.id));
  const [importNewDeckLevel, setImportNewDeckLevel] = useState<string>(() => getDefaultLevelForLanguage(activeLanguage.id).name);
  const [idbSyncMsg, setIdbSyncMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-sync import modal defaults when active language changes
  useEffect(() => {
    setImportNewDeckLang(activeLanguage.id);
    const defCert = getDefaultCertificateForLanguage(activeLanguage.id);
    setImportNewDeckCert(defCert.id);
    setImportNewDeckCategory(getDefaultCategoryForLanguage(activeLanguage.id));
    setImportNewDeckLevel(getDefaultLevelForLanguage(activeLanguage.id).name);
  }, [activeLanguage.id]);

  // Share Deck Modal
  const [shareModalDeck, setShareModalDeck] = useState<LocalDeck | null>(null);
  const [shareTitle, setShareTitle] = useState('');
  const [shareDescription, setShareDescription] = useState('');
  const [shareCategory, setShareCategory] = useState<string>(() => getDefaultCategoryForLanguage(activeLanguage.id));
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
      setIdbSyncMsg('Đang kiểm tra Database và đồng bộ kho từ vựng...');
    } else {
      setLoading(true);
    }

    const currentUserId = user?.id || (isGuest ? 'guest' : 'unknown');
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    // 1. Instant Cache-First Load from IndexedDB scoped strictly to current user and active language
    let cachedDecks: LocalDeck[] = [];
    let cachedWords: any[] = [];
    try {
      const [idbDecks, idbWords] = await Promise.all([
        idbGetLocalDecks(currentUserId, activeLanguage.id),
        idbGetWords(currentUserId, activeLanguage.id),
      ]);

      cachedDecks = idbDecks || [];
      cachedWords = idbWords || [];

      // If offline or guest session, immediately show local cached decks (Offline Mode)
      if (!isOnline || isGuest || !user) {
        setDecks(cachedDecks);
        setWords(cachedWords);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('IDB read warning:', err);
    }

    // 2. Authoritative Revalidation & Database Check from Cloud API
    if (user && !isGuest && isOnline) {
      try {
        const [cloudDecksRes, cloudWordsRes] = await Promise.allSettled([
          api.get('/community/my-decks', { params: { languageId: activeLanguage.id } }),
          api.get('/community/my-words', { params: { languageId: activeLanguage.id } }),
        ]);

        if (cloudDecksRes.status === 'fulfilled' && Array.isArray(cloudDecksRes.value)) {
          // Decks returned by DB are definitely ON DATABASE -> Mark ONLINE (isSyncedToCloud: true)
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
            isSyncedToCloud: true, // CÒN TRÊN DATABASE -> HIỂN THỊ ONLINE
            isCloned: Boolean(d.isCloned),
            isReadOnly: Boolean(d.isReadOnly),
            author: d.author,
          }));

          const apiIds = new Set(apiDecks.map((cd) => cd.id));

          // Reconcile cached decks from IndexedDB against authoritative DB state:
          // - If a deck was previously on DB but is NO LONGER on DB: It was DELETED on DB -> PURGE IT!
          // - If a deck is purely local/offline (created offline, never on DB): Keep it as OFFLINE!
          const decksToDeleteFromIdb: string[] = [];
          const localOnlyOfflineDecks: LocalDeck[] = [];

          for (const ld of cachedDecks) {
            if (!ld || !ld.id) continue;
            if (ld.userId !== currentUserId) continue;

            const isPresentInApi =
              apiIds.has(ld.id) ||
              Boolean(ld.originDeckId && apiIds.has(ld.originDeckId)) ||
              (ld.id.startsWith('cloned_') && apiIds.has(ld.id.replace('cloned_', '')));

            if (isPresentInApi) {
              // Present in DB -> handled by apiDecks (Online)
              continue;
            }

            // Not present in DB:
            // Check if it was previously a DB deck (was synced, cloned, UUID ID, or moderated status)
            const wasCloudDeck =
              ld.isSyncedToCloud === true ||
              ld.isCloned === true ||
              Boolean(ld.originDeckId) ||
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ld.id) ||
              /^[0-9a-f]{24}$/i.test(ld.id) ||
              ['APPROVED', 'PENDING', 'REJECTED'].includes(ld.status as string);

            if (wasCloudDeck) {
              // ĐÃ BỊ XÓA TRÊN DB -> XÓA TRIỆT ĐỂ KHỎI INDEXEDDB ĐỂ KHÔNG BAO GIỜ HỒI SINH!
              decksToDeleteFromIdb.push(ld.id);
              if (ld.originDeckId) decksToDeleteFromIdb.push(ld.originDeckId);
            } else {
              // Kho Offline thuần túy (tạo cục bộ trên máy này, chưa từng đẩy lên DB):
              // Giữ lại và hiển thị trạng thái OFFLINE (isSyncedToCloud: false)
              localOnlyOfflineDecks.push({
                ...ld,
                isSyncedToCloud: false, // HIỂN THỊ OFFLINE
              });
            }
          }

          // Purge deleted decks from IndexedDB and cleanup orphaned words
          if (decksToDeleteFromIdb.length > 0) {
            await idbDeleteLocalDecks(decksToDeleteFromIdb);
            const orphanedWordIds = cachedWords
              .filter((w) => decksToDeleteFromIdb.includes(w.deckId))
              .map((w) => w.id);
            if (orphanedWordIds.length > 0) {
              await idbDeleteWords(orphanedWordIds);
            }
          }

          // Strict canonical deduplication
          const seenCanonical = new Set<string>();
          const updatedDecks: LocalDeck[] = [];
          for (const d of [...apiDecks, ...localOnlyOfflineDecks]) {
            const canonicalKey = d.originDeckId || (d.id?.startsWith('cloned_') ? d.id.replace('cloned_', '') : d.id);
            if (!seenCanonical.has(canonicalKey)) {
              seenCanonical.add(canonicalKey);
              updatedDecks.push(d);
            }
          }

          setDecks(updatedDecks);

          // Save reconciled decks to IndexedDB for offline resilience
          for (const d of updatedDecks) {
            await idbSaveLocalDeck(d, currentUserId);
          }
        } else {
          // Cloud call was rejected or returned non-array -> fallback to local cache
          setDecks(cachedDecks);
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
        } else if (cachedWords.length > 0) {
          setWords(cachedWords);
        }
      } catch (cloudErr) {
        console.warn('Background cloud revalidation notice (offline-safe):', cloudErr);
        setDecks(cachedDecks);
        setWords(cachedWords);
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
    localStorage.setItem('letstun_favorites', JSON.stringify(favoriteIds));
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

  // Filtered decks for Deck Management Tab
  const filteredDecks = useMemo(() => {
    return deckListWithStats.filter((deck) => {
      const q = deckSearch.toLowerCase().trim();
      const matchesSearch = !q || deck.title.toLowerCase().includes(q) || (deck.description || '').toLowerCase().includes(q);
      const matchesCat = deckCategoryFilter === 'ALL' || deck.category === deckCategoryFilter;
      const matchesSync =
        deckSyncFilter === 'ALL' ||
        (deckSyncFilter === 'ONLINE' && Boolean(deck.isSyncedToCloud)) ||
        (deckSyncFilter === 'OFFLINE' && !deck.isSyncedToCloud);
      return matchesSearch && matchesCat && matchesSync;
    });
  }, [deckListWithStats, deckSearch, deckCategoryFilter, deckSyncFilter]);

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
    // Unified Deck Open Handlers
  const handleOpenCreateDeck = () => {
    setUnifiedDeckModalMode('create');
    setUnifiedDeckInitialData({
      languageId: activeLanguage.id,
      category: getDefaultCategoryForLanguage(activeLanguage.id),
      cefrLevel: getDefaultLevelForLanguage(activeLanguage.id).name,
      isPublic: true,
    });
    setUnifiedDeckModalOpen(true);
  };

  const handleUnifiedDeckSubmit = async (formData: UnifiedDeckFormData) => {
    setUnifiedDeckLoading(true);
    try {
      const currentUserId = user?.id || (isGuest ? 'guest' : 'unknown');
      const targetLangId = formData.languageId || activeLanguage.id;

      if (unifiedDeckModalMode === 'create') {
        const newDeckId = `deck_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const hasWords = formData.words && formData.words.length > 0;
        const validWords = hasWords
          ? formData.words!.filter((w) => w.word && w.word.trim())
          : [];

        const newDeck: LocalDeck = {
          id: newDeckId,
          userId: currentUserId,
          languageId: targetLangId,
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          category: formData.category,
          certificateId: formData.certificateId,
          cefrLevel: formData.cefrLevel,
          wordCount: validWords.length,
          words: [],
          isProtected: Boolean(formData.hasPassword),
          hasPassword: Boolean(formData.hasPassword),
          password: formData.hasPassword ? formData.password : undefined,
          status: 'APPROVED',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isSyncedToCloud: false,
        };

        await idbSaveLocalDeck(newDeck, currentUserId);

        if (validWords.length > 0) {
          const itemsToSave = validWords.map((item, idx) => {
            const cleanW = item.word.trim().toLowerCase();
            const cleanM = (item.meaning && item.meaning.trim()) || item.word.trim();
            const realTopic = item.topic?.trim() || formData.category || 'General';
            const id = `word_${cleanW.replace(/[^a-z0-9]/g, '_')}_${Date.now()}_${idx}`;

            return {
              id,
              userId: currentUserId,
              languageId: targetLangId,
              word: cleanW,
              phonetic: item.phonetic || '',
              partOfSpeech: item.partOfSpeech || 'noun',
              meaning: cleanM,
              example: item.example || '',
              exampleTranslation: item.exampleTranslation || '',
              topic: realTopic,
              cefrLevel: item.cefrLevel || formData.cefrLevel || 'B1',
              deckId: newDeckId,
              deckName: newDeck.title,
              status: 'NEW' as const,
              isFavorite: false,
              vocabulary: {
                id,
                languageId: targetLangId,
                word: cleanW,
                phonetic: item.phonetic || '',
                partOfSpeech: item.partOfSpeech || 'noun',
                shortDefinition: cleanM,
                definition: cleanM,
                topic: realTopic,
                cefrLevel: item.cefrLevel || formData.cefrLevel || 'B1',
                meanings: [{ meaning: cleanM }],
                examples: item.example ? [{ sentence: item.example, translation: item.exampleTranslation }] : [],
              },
            };
          });

          await idbSaveWords(itemsToSave, currentUserId);
          newDeck.words = itemsToSave;
          newDeck.wordCount = itemsToSave.length;
          await idbSaveLocalDeck(newDeck, currentUserId);
          setWords((prev) => [...itemsToSave, ...prev]);
        }

        setDecks((prev) => [newDeck, ...prev]);
        setSelectedDeck(newDeck);

        if (user && !isGuest && formData.isPublic) {
          try {
            const res: any = await api.post('/community/decks', {
              title: newDeck.title,
              description: newDeck.description,
              category: newDeck.category,
              cefrLevel: mapToCefrEquivalent(newDeck.cefrLevel),
              languageId: targetLangId,
              isPublic: true,
              password: newDeck.password,
              words: validWords.map((w) => ({
                word: w.word.trim().toLowerCase(),
                phonetic: w.phonetic,
                partOfSpeech: w.partOfSpeech,
                meaning: w.meaning.trim(),
                definition: w.meaning.trim(),
                example: w.example,
                exampleTranslation: w.exampleTranslation,
                topic: w.topic || newDeck.category || 'General',
                cefrLevel: mapToCefrEquivalent(w.cefrLevel || newDeck.cefrLevel),
              })),
            });
            if (res?.id) {
              newDeck.id = res.id;
              newDeck.isSyncedToCloud = true;
              await idbSaveLocalDeck(newDeck, currentUserId);
              setDecks((prev) => prev.map((d) => (d.id === newDeckId ? newDeck : d)));
            }
          } catch (err) {
            console.warn('Cloud sync error during deck creation:', err);
          }
        }

        setUnifiedDeckModalOpen(false);
        const msg = validWords.length > 0
          ? `Đã tạo kho "${newDeck.title}" và nạp ${validWords.length} từ vựng thành công!`
          : `Đã tạo thành công kho từ vựng "${newDeck.title}"!`;
        setActionSuccessMsg(msg);
        setTimeout(() => setActionSuccessMsg(null), 3500);

      } else {
        // Edit Mode
        const deckId = formData.id || deckToEdit?.id;
        if (!deckId) return;

        const oldTitle = deckToEdit?.title;
        const newTitle = formData.title.trim();
        const updates: Partial<LocalDeck> = {
          title: newTitle,
          description: formData.description.trim() || undefined,
          languageId: targetLangId,
          certificateId: formData.certificateId,
          category: formData.category,
          cefrLevel: formData.cefrLevel,
          isProtected: Boolean(formData.hasPassword),
          hasPassword: Boolean(formData.hasPassword),
          password: formData.hasPassword ? formData.password : undefined,
          updatedAt: Date.now(),
        };

        if (formData.words !== undefined) {
          const validWords = formData.words.filter((w) => w.word && w.word.trim());
          const oldDeckWords = words.filter((w) => w.deckId === deckId || w.deckName === oldTitle);
          if (oldDeckWords.length > 0) {
            await idbDeleteWords(oldDeckWords.map((w) => w.id));
          }

          const itemsToSave = validWords.map((item, idx) => {
            const cleanW = item.word.trim().toLowerCase();
            const cleanM = (item.meaning && item.meaning.trim()) || item.word.trim();
            const realTopic = item.topic?.trim() || formData.category || 'General';
            const id = (item as any).id || `word_${cleanW.replace(/[^a-z0-9]/g, '_')}_${Date.now()}_${idx}`;

            return {
              id,
              userId: currentUserId,
              languageId: targetLangId,
              word: cleanW,
              phonetic: item.phonetic || '',
              partOfSpeech: item.partOfSpeech || 'noun',
              meaning: cleanM,
              example: item.example || '',
              exampleTranslation: item.exampleTranslation || '',
              topic: realTopic,
              cefrLevel: item.cefrLevel || formData.cefrLevel || 'B1',
              deckId: deckId,
              deckName: newTitle,
              status: 'NEW' as const,
              isFavorite: false,
              vocabulary: {
                id,
                languageId: targetLangId,
                word: cleanW,
                phonetic: item.phonetic || '',
                partOfSpeech: item.partOfSpeech || 'noun',
                shortDefinition: cleanM,
                definition: cleanM,
                topic: realTopic,
                cefrLevel: item.cefrLevel || formData.cefrLevel || 'B1',
                meanings: [{ meaning: cleanM }],
                examples: item.example ? [{ sentence: item.example, translation: item.exampleTranslation }] : [],
              },
            };
          });

          if (itemsToSave.length > 0) {
            await idbSaveWords(itemsToSave, currentUserId);
          }
          setWords((prev) => [
            ...prev.filter((w) => w.deckId !== deckId && w.deckName !== oldTitle),
            ...itemsToSave,
          ]);
          updates.wordCount = itemsToSave.length;
        }

        await idbUpdateLocalDeck(deckId, updates);
        setDecks((prev) => prev.map((d) => (d.id === deckId ? { ...d, ...updates } : d)));

        if (oldTitle && oldTitle !== newTitle) {
          setWords((prev) =>
            prev.map((w) =>
              w.deckId === deckId || w.deckName === oldTitle ? { ...w, deckName: newTitle } : w
            )
          );
        }

        if (selectedDeck?.id === deckId) {
          setSelectedDeck((prev) => (prev ? { ...prev, ...updates } : null));
        }

        if (user && !isGuest && (deckToEdit?.isSyncedToCloud || formData.isPublic)) {
          try {
            if (deckToEdit?.isSyncedToCloud) {
              await api.patch(`/community/decks/${deckId}`, {
                title: updates.title,
                description: updates.description,
                category: updates.category,
                cefrLevel: updates.cefrLevel ? mapToCefrEquivalent(updates.cefrLevel) : undefined,
                languageId: targetLangId,
                password: updates.password,
                isPublic: formData.isPublic,
              });
            } else if (formData.isPublic) {
              const allDeckWords = words.filter(
                (w) => w.deckId === deckId || (w.deckName && w.deckName === oldTitle)
              );
              const res: any = await api.post('/community/decks', {
                title: newTitle,
                description: updates.description,
                category: updates.category,
                cefrLevel: mapToCefrEquivalent(updates.cefrLevel || 'B1'),
                languageId: targetLangId,
                isPublic: true,
                password: updates.password,
                words: allDeckWords.map((w) => ({
                  word: w.word,
                  phonetic: w.phonetic,
                  partOfSpeech: w.partOfSpeech,
                  meaning: w.meaning,
                  example: w.example,
                  exampleTranslation: w.exampleTranslation,
                  topic: w.topic || 'General',
                  cefrLevel: mapToCefrEquivalent(w.cefrLevel || 'B1'),
                })),
              });
              if (res?.id) {
                await idbUpdateLocalDeck(deckId, { isSyncedToCloud: true });
                setDecks((prev) => prev.map((d) => (d.id === deckId ? { ...d, isSyncedToCloud: true } : d)));
                if (selectedDeck?.id === deckId) {
                  setSelectedDeck((prev) => (prev ? { ...prev, isSyncedToCloud: true } : null));
                }
              }
            }
          } catch (err) {
            console.warn('Cloud sync error during deck update:', err);
          }
        }

        setUnifiedDeckModalOpen(false);
        setDeckToEdit(null);
        setActionSuccessMsg(`Đã cập nhật kho từ vựng "${newTitle}" thành công!`);
        setTimeout(() => setActionSuccessMsg(null), 3500);
      }
    } catch (err: any) {
      alert('Lỗi khi lưu kho từ vựng: ' + (err?.response?.data?.message || err?.message || 'Đã có lỗi xảy ra'));
    } finally {
      setUnifiedDeckLoading(false);
    }
  };

  const handleConfirmCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckTitleInput.trim() || creatingDeck) return;

    const validWords =
      createDeckMode === 'file'
        ? parsedWords.filter((w) => w.word && w.word.trim() && w.meaning && w.meaning.trim())
        : [];

    if (createDeckMode === 'file' && selectedFile && validWords.length === 0) {
      alert('File đã chọn không có từ vựng hợp lệ. Vui lòng kiểm tra lại cấu trúc file.');
      return;
    }

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
        wordCount: validWords.length,
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

      // 2. If file import mode with words, save words into IndexedDB
      if (validWords.length > 0) {
        const itemsToSave = validWords.map((item, idx) => {
          const cleanW = item.word.trim().toLowerCase();
          const cleanM = item.meaning.trim();
          const realTopic = item.topic?.trim() || deckCatInput || 'General';
          const id = `word_${cleanW.replace(/[^a-z0-9]/g, '_')}_${Date.now()}_${idx}`;

          return {
            id,
            userId: currentUserId,
            languageId: targetLangId,
            word: cleanW,
            phonetic: item.phonetic || '',
            partOfSpeech: item.partOfSpeech || 'noun',
            meaning: cleanM,
            example: item.example || '',
            exampleTranslation: item.exampleTranslation || '',
            topic: realTopic,
            cefrLevel: item.cefrLevel || deckCefrInput || 'B1',
            deckId: newDeckId,
            deckName: newDeck.title,
            status: 'NEW',
            isFavorite: false,
            vocabulary: {
              id,
              languageId: targetLangId,
              word: cleanW,
              phonetic: item.phonetic || '',
              partOfSpeech: item.partOfSpeech || 'noun',
              shortDefinition: cleanM,
              definition: cleanM,
              topic: realTopic,
              cefrLevel: item.cefrLevel || deckCefrInput || 'B1',
              meanings: [{ meaning: cleanM }],
              examples: item.example ? [{ sentence: item.example, translation: item.exampleTranslation }] : [],
            },
          };
        });

        await idbSaveWords(itemsToSave, currentUserId);
        newDeck.words = itemsToSave;
        newDeck.wordCount = itemsToSave.length;
        await idbSaveLocalDeck(newDeck, currentUserId);
      }

      setDecks((prev) => [newDeck, ...prev]);
      setSelectedDeck(newDeck);

      // 3. Sync to Cloud API if authenticated
      if (user && !isGuest) {
        try {
          const res: any = await api.post('/community/decks', {
            title: newDeck.title,
            description: newDeck.description,
            category: newDeck.category,
            cefrLevel: mapToCefrEquivalent(newDeck.cefrLevel),
            languageId: targetLangId,
            isPublic: true,
            password: newDeck.password,
            words: validWords.map((w) => ({
              word: w.word.trim().toLowerCase(),
              phonetic: w.phonetic,
              partOfSpeech: w.partOfSpeech,
              meaning: w.meaning.trim(),
              definition: w.meaning.trim(),
              example: w.example,
              exampleTranslation: w.exampleTranslation,
              topic: w.topic || newDeck.category || 'General',
              cefrLevel: mapToCefrEquivalent(w.cefrLevel || newDeck.cefrLevel),
            })),
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
      setSelectedFile(null);
      setParsedWords([]);
      setCreateDeckMode('manual');
      if (fileInputRef.current) fileInputRef.current.value = '';

      const successToast =
        validWords.length > 0
          ? `Đã tạo kho "${newDeck.title}" và nạp thành công ${validWords.length} từ vựng!`
          : `Đã tạo thành công kho từ vựng "${newDeck.title}"!`;
      setActionSuccessMsg(successToast);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } finally {
      setCreatingDeck(false);
    }
  };

  // Edit Deck
  const handleOpenEditDeck = (deck: LocalDeck, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const dLang = deck.languageId || activeLanguage.id;
    setDeckToEdit(deck);
    setDeckTitleInput(deck.title);
    setDeckDescInput(deck.description || '');
    setDeckLangInput(dLang);
    const defCert = getDefaultCertificateForLanguage(dLang);
    setDeckCertInput(defCert.id);
    setDeckCatInput(deck.category || getDefaultCategoryForLanguage(dLang));
    setDeckCefrInput(deck.cefrLevel || getDefaultLevelForLanguage(dLang).name);
    setDeckPasswordInput(deck.password || '');
    setDeckStatusInput(deck.status === 'APPROVED' ? 'APPROVED' : (deck.status === 'PENDING' ? 'PENDING' : 'PRIVATE'));

    // Collect existing words in this deck to allow preview, edit, delete in the unified modal
    const deckWords = words.filter((w) => w.deckId === deck.id || w.deckName === deck.title);
    const mappedWords: ParsedWordItem[] = deckWords.map((w) => ({
      word: w.word,
      phonetic: w.phonetic || '',
      partOfSpeech: w.partOfSpeech || 'noun',
      meaning: w.meaning || (w as any).definition || '',
      example: w.example || '',
      exampleTranslation: (w as any).exampleTranslation || '',
      cefrLevel: w.cefrLevel || deck.cefrLevel || 'B1',
      topic: w.topic || deck.category || 'General',
    }));

    setUnifiedDeckModalMode('edit');
    setUnifiedDeckInitialData({
      id: deck.id,
      title: deck.title,
      description: deck.description || '',
      languageId: dLang,
      certificateId: deck.certificateId,
      category: deck.category || getDefaultCategoryForLanguage(dLang),
      cefrLevel: deck.cefrLevel || getDefaultLevelForLanguage(dLang).name,
      isPublic: (deck as any).isPublic !== undefined ? (deck as any).isPublic : true,
      hasPassword: Boolean(deck.isProtected || deck.hasPassword),
      password: deck.password || '',
      words: mappedWords,
    });
    setUnifiedDeckModalOpen(true);
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
          cefrLevel: updates.cefrLevel ? mapToCefrEquivalent(updates.cefrLevel) : undefined,
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
      const cleanServerId = targetId.startsWith('cloned_') ? targetId.replace('cloned_', '') : targetId;
      const originId = deckToDelete.originDeckId;

      // 1. Delete deck from IndexedDB (targetId, cleanServerId and originId)
      await idbDeleteLocalDeck(targetId);
      if (cleanServerId !== targetId) await idbDeleteLocalDeck(cleanServerId);
      if (originId) await idbDeleteLocalDeck(originId);

      setDecks((prev) => prev.filter((d) => d.id !== targetId && d.id !== cleanServerId && d.id !== originId));

      // 2. Delete words belonging to this deck from local storage & state
      const wordsToDelete = words.filter(
        (w) =>
          w.deckId === targetId ||
          w.deckId === cleanServerId ||
          (originId && w.deckId === originId) ||
          (w.deckName && w.deckName === targetTitle)
      );
      if (wordsToDelete.length > 0) {
        await idbDeleteWords(wordsToDelete.map((w) => w.id));
        setWords((prev) =>
          prev.filter((w) => !wordsToDelete.some((wt) => wt.id === w.id))
        );
      }

      // 3. Always attempt to delete from Cloud API if user is authenticated
      if (user && !isGuest) {
        try {
          await api.delete(`/community/decks/${cleanServerId}`).catch(async (err) => {
            if (originId && originId !== cleanServerId) {
              return api.delete(`/community/decks/${originId}`).catch(() => {});
            }
            if (err?.response?.status !== 404) {
              console.warn('Cloud deck deletion note:', err);
            }
          });
        } catch (err: any) {
          if (err?.response?.status !== 404) {
            console.warn('Cloud deck deletion note:', err);
          }
        }
      }

      if (selectedDeck?.id === targetId || selectedDeck?.id === cleanServerId || selectedDeck?.id === originId) {
        setSelectedDeck(null);
      }

      setDeckToDelete(null);
      setActionSuccessMsg(`Đã xóa vĩnh viễn kho từ vựng "${targetTitle}" thành công!`);
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
      const idsToDelete = [...selectedDeckIds];
      const allCleanIds: string[] = [];

      for (const id of idsToDelete) {
        allCleanIds.push(id);
        if (id.startsWith('cloned_')) allCleanIds.push(id.replace('cloned_', ''));
      }
      const matchingDecks = decks.filter((d) => idsToDelete.includes(d.id));
      for (const d of matchingDecks) {
        if (d.originDeckId) allCleanIds.push(d.originDeckId);
      }
      const uniqueCleanIds = Array.from(new Set(allCleanIds));

      // 1. Delete from IndexedDB
      await idbDeleteLocalDecks(uniqueCleanIds);
      setDecks((prev) => prev.filter((d) => !idsToDelete.includes(d.id) && !uniqueCleanIds.includes(d.id)));

      // 2. Delete corresponding words
      const deletedDeckTitles = matchingDecks.map((d) => d.title);
      const wordsToDelete = words.filter(
        (w) => uniqueCleanIds.includes(w.deckId) || (w.deckName && deletedDeckTitles.includes(w.deckName))
      );
      if (wordsToDelete.length > 0) {
        await idbDeleteWords(wordsToDelete.map((w) => w.id));
        setWords((prev) =>
          prev.filter((w) => !wordsToDelete.some((wt) => wt.id === w.id))
        );
      }

      // 3. Sync to Cloud API
      if (user && !isGuest) {
        try {
          await api.post('/community/decks/bulk-delete', { ids: uniqueCleanIds });
        } catch (err) {
          console.warn('Cloud bulk deck delete notice:', err);
        }
      }

      if (selectedDeck && (idsToDelete.includes(selectedDeck.id) || uniqueCleanIds.includes(selectedDeck.id))) {
        setSelectedDeck(null);
      }

      setSelectedDeckIds([]);
      setShowBulkDeleteDecksModal(false);
      setActionSuccessMsg(`Đã xóa vĩnh viễn ${idsToDelete.length} kho từ vựng đã chọn!`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err: any) {
      alert('Lỗi khi xóa hàng loạt kho: ' + (err.message || err));
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
        cefrLevel: mapToCefrEquivalent(w.cefrLevel || deck.cefrLevel),
      }));

      let cloudId = deck.id;
      if (deck.isSyncedToCloud) {
        // Deck already in cloud -> update metadata & add any new words
        await api.patch(`/community/decks/${deck.id}`, {
          title: deck.title,
          description: deck.description,
          category: deck.category,
          cefrLevel: mapToCefrEquivalent(deck.cefrLevel),
          languageId: deck.languageId || activeLanguage?.id || 'en',
          password: deck.password,
        });
      } else {
        // Create new cloud deck
        const res: any = await api.post('/community/decks', {
          title: deck.title,
          description: deck.description,
          category: deck.category,
          cefrLevel: mapToCefrEquivalent(deck.cefrLevel),
          languageId: deck.languageId || activeLanguage?.id || 'en',
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

      const res: any = await api.post('/community/decks', {
        title: shareTitle.trim(),
        description: shareDescription.trim(),
        category: shareCategory,
        cefrLevel: mapToCefrEquivalent(shareModalDeck.cefrLevel),
        languageId: shareModalDeck.languageId || activeLanguage?.id || 'en',
        isPublic: true,
        password: shareEnablePassword ? sharePassword.trim() : undefined,
        words: deckWords.map((w) => ({
          word: w.word,
          phonetic: w.phonetic,
          partOfSpeech: w.partOfSpeech,
          meaning: w.meaning,
          example: w.example,
          topic: w.topic || 'General',
          cefrLevel: mapToCefrEquivalent(w.cefrLevel || shareModalDeck.cefrLevel),
        })),
      });

      const serverDeckId = res?.data?.id || res?.id || shareModalDeck.id;
      const oldId = shareModalDeck.id;
      const updatedDeck: LocalDeck = {
        ...shareModalDeck,
        id: serverDeckId,
        title: shareTitle.trim(),
        description: shareDescription.trim(),
        category: shareCategory,
        isSyncedToCloud: true,
        updatedAt: Date.now(),
      };

      if (serverDeckId !== oldId) {
        await idbDeleteLocalDeck(oldId);
        const wordsToUpdate = words.filter((w) => w.deckId === oldId);
        if (wordsToUpdate.length > 0) {
          const updatedWords = wordsToUpdate.map((w) => ({ ...w, deckId: serverDeckId }));
          await idbSaveWords(updatedWords);
          setWords((prev) => prev.map((w) => (w.deckId === oldId ? { ...w, deckId: serverDeckId } : w)));
        }
      }

      await idbSaveLocalDeck(updatedDeck);
      setDecks((prev) => prev.map((d) => (d.id === oldId ? updatedDeck : d)));
      if (selectedDeck?.id === oldId) {
        setSelectedDeck(updatedDeck);
      }

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

  // Helper for Deck More Actions (Used in both Grid Card & List Row)
  const getDeckMoreOptions = (deck: LocalDeck) => [
    ...(!deck.isReadOnly
      ? [
          {
            value: 'edit',
            label: 'Sửa thông tin kho',
            icon: <Edit3 className="w-4 h-4 text-indigo-500" />,
          },
        ]
      : []),
    ...(!deck.isReadOnly
      ? deck.isSyncedToCloud
        ? [
            {
              value: 'cloud_sync',
              label:
                syncingDeckId === deck.id
                  ? 'Đang cập nhật...'
                  : 'Cập nhật lại lên Cộng đồng',
              icon:
                syncingDeckId === deck.id ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-indigo-500" />
                ),
            },
            {
              value: 'unlink_cloud',
              label: 'Gỡ khỏi kho cộng đồng (Lưu về máy)',
              icon: <CloudUpload className="w-4 h-4 rotate-180 text-amber-500" />,
            },
          ]
        : [
            {
              value: 'share',
              label: 'Chia sẻ lên cộng đồng (Lưu lên Cloud)',
              icon: <Share2 className="w-4 h-4 text-purple-600" />,
            },
          ]
      : []),
    {
      value: 'export_xlsx',
      label: 'Tải file Excel (.xlsx)',
      icon: <FileSpreadsheet className="w-4 h-4 text-emerald-600" />,
    },
    {
      value: 'export_csv',
      label: 'Tải file CSV (.csv)',
      icon: <Download className="w-4 h-4 text-blue-600" />,
    },
    ...(!deck.isReadOnly
      ? [
          {
            value: 'delete',
            label: 'Xóa kho từ vựng này',
            icon: <Trash2 className="w-4 h-4 text-rose-500" />,
          },
        ]
      : []),
  ];

  const handleDeckMoreAction = (action: string, deck: LocalDeck, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (action === 'edit') {
      handleOpenEditDeck(deck, e);
    } else if (action === 'cloud_sync') {
      handleUploadDeckToCloud(deck, e);
    } else if (action === 'unlink_cloud') {
      handleUnlinkFromCloud(deck, e);
    } else if (action === 'export_xlsx') {
      const deckWords = words.filter((w) => w.deckId === deck.id || w.deckName === deck.title);
      exportWordsToExcelOrCsv(deckWords, `kho_${deck.title}`, 'xlsx');
    } else if (action === 'export_csv') {
      const deckWords = words.filter((w) => w.deckId === deck.id || w.deckName === deck.title);
      exportWordsToExcelOrCsv(deckWords, `kho_${deck.title}`, 'csv');
    } else if (action === 'share') {
      handleOpenShareDeck(deck, e);
    } else if (action === 'delete') {
      setDeckToDelete(deck);
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
      const matchesSearch =
        !q ||
        (item.word || '').toLowerCase().includes(q) ||
        (item.meaning || '').toLowerCase().includes(q) ||
        (item.phonetic || '').toLowerCase().includes(q) ||
        itemTopic.toLowerCase().includes(q);

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
    setAddWordMode('manual');
    setParsedWords([]);
    setSelectedFile(null);
    setWordFormWord('');
    setWordFormPhonetic('');
    setWordFormPos('noun');
    setWordFormMeaning('');
    setWordFormExample('');
    setWordFormExampleTrans('');
    setWordFormTopic(subTopicsInSelectedDeck[0] || 'General');
    setWordFormCefr('B1');
    const targetDeck = selectedDeck?.title || decks[0]?.title || 'General';
    setWordFormTargetDeck(targetDeck);
    setImportTargetDeckName(targetDeck);
    setImportDeckMode('existing');
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
        ? importTargetDeckName.trim() || 'Custom Word Deck'
        : selectedDeck?.title || importTargetDeckName || decks[0]?.title || 'General';

    const currentUserId = user?.id || (isGuest ? 'guest' : 'unknown');
    const targetLangId = importDeckMode === 'new' ? importNewDeckLang : (selectedDeck?.languageId || activeLanguage.id);
    const targetCat = importDeckMode === 'new' ? importNewDeckCategory : (selectedDeck?.category || getDefaultCategoryForLanguage(targetLangId));
    const targetLevel = importDeckMode === 'new' ? importNewDeckLevel : (selectedDeck?.cefrLevel || getDefaultLevelForLanguage(targetLangId).name);

    // Check or create deck for imported words
    let deckObj = decks.find((d) => d.title === targetDeckTitle);
    if (!deckObj) {
      const newDeckId = `deck_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      deckObj = {
        id: newDeckId,
        userId: currentUserId,
        languageId: targetLangId,
        title: targetDeckTitle,
        category: targetCat,
        cefrLevel: targetLevel,
        wordCount: validWords.length,
        status: 'APPROVED',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isSyncedToCloud: false,
      };
      await idbSaveLocalDeck(deckObj, currentUserId);
      setDecks((prev) => [deckObj!, ...prev]);
    }

    try {
      const itemsToSave = validWords.map((item, idx) => {
        const cleanW = item.word.trim().toLowerCase();
        const cleanM = item.meaning.trim();
        // CRITICAL FIX: Real topic from CSV is preserved! NEVER OVERWRITE WITH DECK NAME!
        const realTopic = item.topic?.trim() || targetCat || 'General';
        const id = `word_${cleanW.replace(/[^a-z0-9]/g, '_')}_${Date.now()}_${idx}`;

        return {
          id,
          userId: currentUserId,
          languageId: targetLangId,
          word: cleanW,
          phonetic: item.phonetic || '',
          partOfSpeech: item.partOfSpeech || 'noun',
          meaning: cleanM,
          example: item.example || '',
          exampleTranslation: item.exampleTranslation || '',
          topic: realTopic, // REAL TOPIC FROM CSV
          cefrLevel: item.cefrLevel || targetLevel,
          deckId: deckObj?.id,
          deckName: targetDeckTitle,
          status: 'NEW',
          isFavorite: false,
          vocabulary: {
            id,
            languageId: targetLangId,
            word: cleanW,
            phonetic: item.phonetic || '',
            partOfSpeech: item.partOfSpeech || 'noun',
            shortDefinition: cleanM,
            definition: cleanM,
            topic: realTopic,
            cefrLevel: item.cefrLevel || targetLevel,
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
      setShowAddWordModal(false);
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

  // =============================================================================
  // RENDER
  // =============================================================================

  // Dynamic Language & Standard computation for Add/Edit Word Modal
  const activeDeckForWord = useMemo(() => {
    return decks.find((d) => d.title === wordFormTargetDeck || d.id === wordFormTargetDeck) || selectedDeck;
  }, [decks, wordFormTargetDeck, selectedDeck]);

  const wordModalLangId = activeDeckForWord?.languageId || activeLanguage.id;
  const wordModalLang = useMemo(() => getLanguage(wordModalLangId), [wordModalLangId]);
  const wordModalCerts = useMemo(() => getCertificatesForLanguage(wordModalLangId), [wordModalLangId]);
  const selectedWordCert = useMemo(() => {
    return wordModalCerts.find((c) => c.id === wordFormCert) || wordModalCerts[0];
  }, [wordModalCerts, wordFormCert]);
  const selectedWordLevels = useMemo(() => {
    return selectedWordCert?.levels || [];
  }, [selectedWordCert]);

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

        {/* Consolidated Action Area (Inside opened deck) */}
        {selectedDeck && (
          <div className="flex flex-wrap items-center gap-2">
            {isSelectedDeckLocked ? (
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
                  ...(!selectedDeck.isReadOnly
                    ? selectedDeck.isSyncedToCloud
                      ? [
                          {
                            value: 'sync_cloud',
                            label:
                              syncingDeckId === selectedDeck.id
                                ? 'Đang cập nhật...'
                                : 'Cập nhật lại lên Cộng đồng',
                            icon: (
                              <RefreshCw
                                className={`w-4 h-4 text-indigo-500 ${
                                  syncingDeckId === selectedDeck.id ? 'animate-spin' : ''
                                }`}
                              />
                            ),
                          },
                          {
                            value: 'unlink_cloud',
                            label: 'Gỡ khỏi kho cộng đồng (Lưu về máy)',
                            icon: <CloudUpload className="w-4 h-4 rotate-180 text-amber-500" />,
                          },
                        ]
                      : [
                          {
                            value: 'share_deck',
                            label: 'Chia sẻ lên cộng đồng (Lưu lên Cloud)',
                            icon: <Share2 className="w-4 h-4 text-indigo-500" />,
                          },
                        ]
                    : []),
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
                  } else if (action === 'unlink_cloud') {
                    handleUnlinkFromCloud(selectedDeck);
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
          )}
        </div>
      )}
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

            {/* Main Mode Navigation Bar: "Kho của tôi" vs "Tất cả từ" + Contextual Actions */}
      {!selectedDeck && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="tab-pill-container self-start">
            <button
              type="button"
              onClick={() => setActiveTab('decks')}
              className={`tab-pill ${activeTab === 'decks' ? 'tab-pill-active' : ''}`}
            >
              <FolderKanban className="w-4 h-4" />
              <span>Kho Của Tôi</span>
              <span className="tab-pill-badge">{decks.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('all_words')}
              className={`tab-pill ${activeTab === 'all_words' ? 'tab-pill-active' : ''}`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Tất Cả Từ</span>
              <span className="tab-pill-badge">{words.length}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'decks' ? (
            /* TRANG QUẢN LÝ TẤT CẢ KHO */
            <>
              <button
                type="button"
                onClick={() => {
                  setDeckTitleInput('');
                  setDeckDescInput('');
                  setDeckPasswordInput('');
                  handleOpenCreateDeck();
                }}
                className="btn-glass-primary btn-glass-sm inline-flex items-center gap-1.5 font-bold shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm kho từ</span>
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
      )}

{/* =============================================================================
          TAB 1: KHO CỦA TÔI (MY DECKS VIEW) - DEDICATED DECK MANAGEMENT
          ============================================================================= */}
      {!selectedDeck && activeTab === 'decks' && (
        <div className="space-y-4">
          {/* Deck Search, View Switcher & Bulk Action Bar */}
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
            </div>

            <div className="flex items-center gap-2">
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

              {/* Online / Offline Filter Dropdown */}
              <div className="w-36 h-9 shrink-0">
                <CustomDropdown
                  value={deckSyncFilter}
                  onChange={(val) => setDeckSyncFilter(val as any)}
                  options={[
                    { value: 'ALL', label: 'Tất cả trạng thái' },
                    { value: 'ONLINE', label: '🌐 Online (Trên DB)' },
                    { value: 'OFFLINE', label: '💾 Offline (Lưu máy)' },
                  ]}
                  size="sm"
                  className="w-full h-9"
                />
              </div>

              {/* Deck Search Box */}
              <div className="relative w-full sm:w-60 h-9">
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
                  handleOpenCreateDeck();
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
                          className="p-2.5 -m-2 rounded-lg text-slate-400 hover:text-indigo-600 transition inline-flex items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation"
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
                      <th className="py-3 px-4 min-w-[130px]">Tiến độ</th>
                      <th className="py-3 px-3 text-center">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody ref={virtualDecksTable.containerRef as any} className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                    {virtualDecksTable.topSpacerHeight > 0 && (
                      <tr>
                        <td colSpan={7} style={{ height: `${virtualDecksTable.topSpacerHeight}px` }} />
                      </tr>
                    )}
                    {virtualDecksTable.virtualItems.map(({ item: deck }) => (
                      <DeckTableRowItem
                        key={deck.id}
                        deck={deck as any}
                        isSelected={selectedDeckIds.includes(deck.id)}
                        onToggleSelect={(deckId) =>
                          setSelectedDeckIds((prev) =>
                            prev.includes(deckId) ? prev.filter((id) => id !== deckId) : [...prev, deckId]
                          )
                        }
                        onOpenDeck={handleOpenDeckOrAction}
                        onReviewDeck={(d) =>
                          handleOpenDeckOrAction(d, () =>
                            navigate(`/review?deckId=${encodeURIComponent(d.id)}&topic=${encodeURIComponent(d.title)}`)
                          )
                        }
                        moreOptions={getDeckMoreOptions(deck)}
                        onMoreAction={handleDeckMoreAction}
                      />
                    ))}
                  {virtualDecksTable.bottomSpacerHeight > 0 && (
                    <tr>
                      <td colSpan={7} style={{ height: `${virtualDecksTable.bottomSpacerHeight}px` }} />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* =================================================================
             GRID VIEW FOR DECKS (DƯỚI Ô)
             ================================================================= */
          <div ref={virtualDecksGrid.containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {virtualDecksGrid.topSpacerHeight > 0 && (
              <div style={{ height: `${virtualDecksGrid.topSpacerHeight}px` }} className="col-span-full" />
            )}
            {virtualDecksGrid.virtualItems.map(({ item: deck }) => (
              <DeckCardItem
                key={deck.id}
                deck={deck as any}
                isSelected={selectedDeckIds.includes(deck.id)}
                onToggleSelect={(deckId) =>
                  setSelectedDeckIds((prev) =>
                    prev.includes(deckId) ? prev.filter((id) => id !== deckId) : [...prev, deckId]
                  )
                }
                onOpenDeck={handleOpenDeckOrAction}
                onReviewDeck={(d) =>
                  handleOpenDeckOrAction(d, () =>
                    navigate(`/review?deckId=${encodeURIComponent(d.id)}&topic=${encodeURIComponent(d.title)}`)
                  )
                }
                moreOptions={getDeckMoreOptions(deck)}
                onMoreAction={handleDeckMoreAction}
              />
            ))}
            {virtualDecksGrid.bottomSpacerHeight > 0 && (
              <div style={{ height: `${virtualDecksGrid.bottomSpacerHeight}px` }} className="col-span-full" />
            )}
          </div>
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
                        className="w-40 sm:w-48 h-9"
                      />
                    </div>
                  )}

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
                      className="w-32 sm:w-36 h-9"
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
                  
                </div>
              )}
            </div>
          ) : wordViewMode === 'list' ? (
            /* =================================================================
               LIST VIEW FOR WORDS INSIDE DECK (DANH SÁCH TỪ VỰNG)
               ================================================================= */
            <div className="overflow-hidden rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-xs backdrop-blur-xl" data-tour="wordbank-word-list">
              <div ref={virtualDeckWordsTable.containerRef} className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/75 dark:bg-slate-800/50 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                      <th className="py-3 px-4 w-10">
                        {!selectedDeck.isReadOnly && (
                          <button
                            onClick={() => {
                              if (selectedWordIds.length === filteredWordsInDeck.length) {
                                setSelectedWordIds([]);
                              } else {
                                setSelectedWordIds(filteredWordsInDeck.map((w) => w.id));
                              }
                            }}
                            className="p-2.5 -m-2 rounded-lg text-slate-400 hover:text-indigo-600 transition inline-flex items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation"
                          >
                            {selectedWordIds.length > 0 && selectedWordIds.length === filteredWordsInDeck.length ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </th>
                      <th className="py-3 px-2 w-10 text-center">Nghe</th>
                      <th className="py-3 px-4">Từ vựng & Phiên âm</th>
                      <th className="py-3 px-4">Nghĩa tiếng Việt</th>
                      <th className="py-3 px-3">Chủ đề</th>
                      <th className="py-3 px-3 text-center">Cấp độ</th>
                      <th className="py-3 px-3 text-center">Trạng thái</th>
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
                    {virtualDeckWordsTable.virtualItems.map(({ item }) => (
                      <WordTableRowItem
                        key={item.id}
                        item={item as any}
                        isSelected={selectedWordIds.includes(item.id)}
                        isFavorite={favoriteIds.includes(item.id) || !!item.isFavorite}
                        isReadOnly={selectedDeck.isReadOnly}
                        onToggleSelect={(wordId) =>
                          setSelectedWordIds((prev) =>
                            prev.includes(wordId) ? prev.filter((id) => id !== wordId) : [...prev, wordId]
                          )
                        }
                        onPlayAudio={handlePlayAudio}
                        onToggleFavorite={handleToggleFavorite}
                        onEditWord={handleOpenEditWord}
                        onDeleteWord={(w) => setWordToDelete(w as any)}
                      />
                    ))}
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
              {virtualDeckWordsGrid.virtualItems.map(({ item }) => (
                <WordCardItem
                  key={item.id}
                  item={item as any}
                  isSelected={selectedWordIds.includes(item.id)}
                  isFavorite={favoriteIds.includes(item.id) || !!item.isFavorite}
                  isReadOnly={selectedDeck.isReadOnly}
                  onToggleSelect={(wordId) =>
                    setSelectedWordIds((prev) =>
                      prev.includes(wordId) ? prev.filter((id) => id !== wordId) : [...prev, wordId]
                    )
                  }
                  onPlayAudio={handlePlayAudio}
                  onToggleFavorite={handleToggleFavorite}
                  onEditWord={handleOpenEditWord}
                  onDeleteWord={(w) => setWordToDelete(w as any)}
                />
              ))}
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

                {/* Reset Filters Button */}
                {(allWordStatusFilter !== 'ALL' || allWordTopicFilter !== 'ALL' || allWordCefrFilter !== 'ALL' || allWordSearch) && (
                  <button
                    onClick={() => {
                      setAllWordStatusFilter('ALL');
                      setAllWordTopicFilter('ALL');
                      setAllWordCefrFilter('ALL');
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
                      <th className="py-3 px-4">Từ vựng & Phiên âm</th>
                      <th className="py-3 px-4">Nghĩa tiếng Việt</th>
                      <th className="py-3 px-3">Kho chứa</th>
                      <th className="py-3 px-3">Chủ đề</th>
                      <th className="py-3 px-3 text-center">Cấp độ</th>
                      <th className="py-3 px-3 text-center">Trạng thái</th>
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
                            <div className="flex items-baseline gap-2">
                              <span className="font-black text-slate-900 dark:text-white text-sm">
                                {item.word}
                              </span>
                              {item.partOfSpeech && (
                                <span className="text-[10px] text-slate-400 italic">
                                  ({item.partOfSpeech})
                                </span>
                              )}
                            </div>
                            {item.phonetic && (
                              <span className="text-[11px] text-sky-500 dark:text-sky-300 font-mono">
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
                            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60">
                              {realTopic}
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

      {/* 1 & 2. UNIFIED DECK MODAL (Create / Edit / Share / File Import) */}
      <UnifiedDeckModal
        isOpen={unifiedDeckModalOpen}
        onClose={() => setUnifiedDeckModalOpen(false)}
        mode={unifiedDeckModalMode}
        initialData={unifiedDeckInitialData}
        onSubmit={handleUnifiedDeckSubmit}
        loading={unifiedDeckLoading}
        customCategories={customCategories}
        onAddCustomCategory={handleCreateCategory}
        personalDecks={deckListWithStats}
      />

      {/* Deck Confirmation Modals (Unlock, Delete, Bulk Delete) are delegated to WordBankConfirmModals below */}

      {/* 5. ADD / EDIT WORD MODAL */}
      <WordFormModal
        isOpen={showAddWordModal || showEditWordModal}
        onClose={() => {
          setShowAddWordModal(false);
          setShowEditWordModal(false);
        }}
        showEditWordModal={showEditWordModal}
        addWordMode={addWordMode}
        setAddWordMode={setAddWordMode}
        onSubmit={
          showEditWordModal
            ? handleConfirmEditWord
            : addWordMode === 'file'
            ? (e) => {
                e.preventDefault();
                handleConfirmBatchImport();
              }
            : handleConfirmAddWord
        }
        selectedDeck={selectedDeck}
        wordFormTargetDeck={wordFormTargetDeck}
        setWordFormTargetDeck={setWordFormTargetDeck}
        decks={decks}
        handleOpenCreateDeck={handleOpenCreateDeck}
        wordModalLang={wordModalLang}
        wordFormWord={wordFormWord}
        setWordFormWord={setWordFormWord}
        wordFormPhonetic={wordFormPhonetic}
        setWordFormPhonetic={setWordFormPhonetic}
        wordFormMeaning={wordFormMeaning}
        setWordFormMeaning={setWordFormMeaning}
        wordFormPos={wordFormPos}
        setWordFormPos={setWordFormPos}
        wordFormTopic={wordFormTopic}
        setWordFormTopic={setWordFormTopic}
        wordFormCefr={wordFormCefr}
        setWordFormCefr={setWordFormCefr}
        activeLanguage={activeLanguage}
        wordFormExample={wordFormExample}
        setWordFormExample={setWordFormExample}
        wordFormExampleTrans={wordFormExampleTrans}
        setWordFormExampleTrans={setWordFormExampleTrans}
        downloadVocabularyTemplate={downloadVocabularyTemplate}
        fileInputRef={fileInputRef}
        handleFileUpload={handleFileUpload}
        selectedFile={selectedFile}
        handleAddManualPreviewWord={handleAddManualPreviewWord}
        isParsing={isParsing}
        parsingError={parsingError}
        parsedWords={parsedWords}
        setParsedWords={setParsedWords}
        handleConfirmBatchImport={handleConfirmBatchImport}
        isImporting={isImporting}
      />

      {/* 8. EXCEL / CSV IMPORT MODAL */}
      <WordImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        decks={decks}
        importDeckMode={importDeckMode}
        setImportDeckMode={setImportDeckMode}
        importTargetDeckName={importTargetDeckName}
        setImportTargetDeckName={setImportTargetDeckName}
        importNewDeckLang={importNewDeckLang}
        setImportNewDeckLang={setImportNewDeckLang}
        importNewDeckCert={importNewDeckCert}
        setImportNewDeckCert={setImportNewDeckCert}
        importNewDeckLevel={importNewDeckLevel}
        setImportNewDeckLevel={setImportNewDeckLevel}
        importNewDeckCategory={importNewDeckCategory}
        setImportNewDeckCategory={setImportNewDeckCategory}
        customCategories={customCategories}
        onAddCustomCategory={handleCreateCategory}
        selectedFile={selectedFile}
        fileInputRef={fileInputRef}
        handleFileUpload={handleFileUpload}
        isParsing={isParsing}
        parsingError={parsingError}
        parsedWords={parsedWords}
        setParsedWords={setParsedWords}
        handleAddManualPreviewWord={handleAddManualPreviewWord}
        handleClearAllParsed={handleClearAllParsed}
        editingParsedIdx={editingParsedIdx}
        setEditingParsedIdx={setEditingParsedIdx}
        editingParsedItem={editingParsedItem}
        setEditingParsedItem={setEditingParsedItem}
        handleSaveParsedEdit={handleSaveParsedEdit}
        handleDeleteParsedWord={handleDeleteParsedWord}
        importProgressMsg={importProgressMsg}
        isImporting={isImporting}
        handleConfirmBatchImport={handleConfirmBatchImport}
        downloadVocabularyTemplate={downloadVocabularyTemplate}
      />

      {/* 9. CONFIRMATION, DELETION & VIP UPGRADE MODALS */}
      <WordBankConfirmModals
        deckToUnlock={deckToUnlock}
        onCloseUnlock={() => setDeckToUnlock(null)}
        deckUnlockInput={deckUnlockInput}
        setDeckUnlockInput={setDeckUnlockInput}
        deckUnlockError={deckUnlockError}
        onUnlockSubmit={handleUnlockPersonalDeckSubmit}
        deckUnlocking={deckUnlocking}
        deckToDelete={deckToDelete}
        onCloseDeleteDeck={() => setDeckToDelete(null)}
        onConfirmDeleteDeck={handleConfirmDeleteDeck}
        deletingDecks={deletingDecks}
        showBulkDeleteDecksModal={showBulkDeleteDecksModal}
        onCloseBulkDeleteDecks={() => setShowBulkDeleteDecksModal(false)}
        onConfirmBulkDeleteDecks={handleConfirmBulkDeleteDecks}
        selectedDeckCount={selectedDeckIds.length}
        wordToDelete={wordToDelete as any}
        onCloseDeleteWord={() => setWordToDelete(null)}
        onConfirmDeleteWord={handleConfirmDeleteWord}
        deletingWords={deletingWords}
        showBulkDeleteWordsModal={showBulkDeleteWordsModal}
        onCloseBulkDeleteWords={() => setShowBulkDeleteWordsModal(false)}
        onConfirmBulkDeleteWords={handleConfirmBulkDeleteWords}
        selectedWordCount={selectedWordIds.length}
        showVipModal={showVipModal}
        onCloseVipModal={() => setShowVipModal(false)}
      />

      {/* Guided Interactive Intro Tour for New Users */}
      <WordBankTour isOpen={showTour} onClose={() => setShowTour(false)} />
    </div>
  );
};
