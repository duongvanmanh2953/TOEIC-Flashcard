import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ModalPortal } from '../common/ModalPortal';
import { DeckStandardFields } from './DeckStandardFields';
import { ToggleSwitch } from '../common/ToggleSwitch';
import { CustomDropdown } from '../common/CustomDropdown';
import { CountryFlag } from '../language/CountryFlag';
import { getLanguage } from '../../config/languages';
import {
  getDefaultCertificateForLanguage,
  getDefaultCategoryForLanguage,
  getDefaultLevelForLanguage,
} from '../../config/languageStandards';
import {
  downloadVocabularyTemplate,
  parseVocabularyFile,
  ParsedWordItem,
} from '../../utils/excelTemplate';
import { EditableVocabularyStagingTable } from './EditableVocabularyStagingTable';
import api from '../../lib/api';
import { idbGetWords, idbGetDecks } from '../../lib/idb';
import {
  FolderPlus,
  Edit3,
  X,
  Upload,
  FileSpreadsheet,
  Download,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Share2,
  Check,
  Plus,
  RefreshCw,
  Layers,
  Maximize2,
  Minimize2,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export interface UnifiedDeckFormData {
  id?: string;
  title: string;
  description: string;
  languageId: string;
  certificateId?: string;
  cefrLevel: string;
  category: string;
  hasPassword?: boolean;
  password?: string;
  isPublic?: boolean;
  words?: ParsedWordItem[];
  selectedPersonalDeckId?: string;
}

export interface UnifiedDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialData?: Partial<UnifiedDeckFormData>;
  personalDecks?: any[];
  loadingPersonalDecks?: boolean;
  onSubmit: (data: UnifiedDeckFormData) => Promise<void> | void;
  loading?: boolean;
  titleText?: string;
  subtitleText?: string;
  submitButtonText?: string;
  customCategories?: string[];
  onAddCustomCategory?: (category: string) => void;
}

export const UnifiedDeckModal: React.FC<UnifiedDeckModalProps> = ({
  isOpen,
  onClose,
  mode,
  initialData,
  personalDecks,
  loadingPersonalDecks = false,
  onSubmit,
  loading = false,
  titleText,
  subtitleText,
  submitButtonText,
  customCategories = [],
  onAddCustomCategory,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Layout expansion state: allow expanding table to full width
  const [isMaximized, setIsMaximized] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [languageId, setLanguageId] = useState('en');
  const [certificateId, setCertificateId] = useState('');
  const [cefrLevel, setCefrLevel] = useState('B1');
  const [category, setCategory] = useState('General');
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  // Personal Decks (Prop or Fallback to IDB)
  const [internalPersonalDecks, setInternalPersonalDecks] = useState<any[]>(personalDecks || []);
  const [fetchingDecks, setFetchingDecks] = useState(false);

  useEffect(() => {
    if (personalDecks && personalDecks.length > 0) {
      setInternalPersonalDecks(personalDecks);
    } else if (isOpen) {
      let isMounted = true;
      setFetchingDecks(true);
      (async () => {
        try {
          const [idbDecks, idbWords] = await Promise.all([
            idbGetDecks().catch(() => []),
            idbGetWords().catch(() => []),
          ]);
          if (isMounted && Array.isArray(idbDecks) && idbDecks.length > 0) {
            const enriched = idbDecks.map((d: any) => {
              const matchedWords = (idbWords || []).filter(
                (w: any) =>
                  w.deckId === d.id ||
                  (w.deckName && w.deckName.trim().toLowerCase() === d.title?.trim().toLowerCase())
              );
              return {
                ...d,
                assignedWords: matchedWords,
                wordCount: matchedWords.length || d.wordCount || d.words?.length || 0,
              };
            });
            setInternalPersonalDecks(enriched);
          }
        } catch (e) {
          console.warn('Failed to load internal decks:', e);
        } finally {
          if (isMounted) setFetchingDecks(false);
        }
      })();
      return () => {
        isMounted = false;
      };
    }
  }, [personalDecks, isOpen]);

  const availablePersonalDecks = (personalDecks && personalDecks.length > 0) ? personalDecks : internalPersonalDecks;
  const hasPersonalDecksOption = Boolean(availablePersonalDecks && availablePersonalDecks.length > 0);
  const [wordSourceTab, setWordSourceTab] = useState<'file' | 'manual' | 'personal_deck'>('file');
  const [selectedPersonalDeckId, setSelectedPersonalDeckId] = useState('');

  // Manual Words (Text input)
  const [manualWordsText, setManualWordsText] = useState('');

  // File Upload State & Progress
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedWords, setParsedWords] = useState<ParsedWordItem[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parsingProgress, setParsingProgress] = useState<{
    stepText: string;
    percent: number;
    fileName?: string;
    fileSize?: string;
  }>({ stepText: '', percent: 0 });
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [parsingSuccessMsg, setParsingSuccessMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Sync state on open / initialData change
  useEffect(() => {
    if (isOpen) {
      const initLang = initialData?.languageId || 'en';
      setLanguageId(initLang);
      setTitle(initialData?.title || '');
      setDescription(initialData?.description || '');

      const defCert = getDefaultCertificateForLanguage(initLang);
      setCertificateId(initialData?.certificateId || defCert.id);
      setCefrLevel(initialData?.cefrLevel || getDefaultLevelForLanguage(initLang).name);
      setCategory(initialData?.category || getDefaultCategoryForLanguage(initLang));

      setEnablePassword(
        Boolean(
          initialData?.hasPassword ||
            (initialData?.password && initialData.password.trim().length > 0)
        )
      );
      setPassword(initialData?.password || '');
      setShowPassword(false);
      setIsPublic(initialData?.isPublic !== undefined ? initialData.isPublic : true);

      // Pre-fill parsed words if editing with existing words
      if (initialData?.words && Array.isArray(initialData.words)) {
        setParsedWords(initialData.words);
      } else {
        setParsedWords([]);
      }

      setManualWordsText('');
      setSelectedFile(null);
      setParsingError(null);
      setParsingSuccessMsg(null);
      setIsParsing(false);
      setIsMaximized(false);

      if (availablePersonalDecks.length > 0) {
        setSelectedPersonalDeckId(initialData?.selectedPersonalDeckId || availablePersonalDecks[0].id);
      }
    }
  }, [isOpen, initialData, availablePersonalDecks.length]);

  const langDef = useMemo(() => getLanguage(languageId), [languageId]);

  // Helper to normalize any word object from local IDB, assignedWords, or server API
  const normalizeDeckWord = (
    w: any,
    fallbackCefr = 'B1',
    fallbackTopic = 'General'
  ): ParsedWordItem => {
    if (!w) return { word: '', meaning: '' };
    if (typeof w === 'string') return { word: w.trim(), meaning: w.trim() };

    const word = String(
      w.word ||
      w.term ||
      w.vocab ||
      w.headword ||
      w.entry ||
      w.title ||
      w.vocabulary?.word ||
      w.vocabulary?.term ||
      w.vocabulary?.headword ||
      ''
    ).trim();

    const phonetic = String(
      w.phonetic ||
      w.pronunciation ||
      w.pinyin ||
      w.ipa ||
      w.furigana ||
      w.romaji ||
      w.vocabulary?.phonetic ||
      w.vocabulary?.pronunciation ||
      w.vocabulary?.pinyin ||
      ''
    ).trim();

    const rawPos = String(
      w.partOfSpeech ||
      w.pos ||
      w.type ||
      w.vocabulary?.partOfSpeech ||
      w.vocabulary?.pos ||
      'noun'
    ).toLowerCase().trim();

    let partOfSpeech = 'noun';
    if (rawPos.includes('động') || rawPos === 'verb' || rawPos === 'v') partOfSpeech = 'verb';
    else if (rawPos.includes('tính') || rawPos === 'adjective' || rawPos === 'adj') partOfSpeech = 'adjective';
    else if (rawPos.includes('trạng') || rawPos === 'adverb' || rawPos === 'adv') partOfSpeech = 'adverb';
    else if (rawPos.includes('cụm') || rawPos === 'phrase') partOfSpeech = 'phrase';
    else if (rawPos.includes('thành ngữ') || rawPos === 'idiom') partOfSpeech = 'idiom';
    else if (rawPos.includes('giới') || rawPos === 'preposition' || rawPos === 'prep') partOfSpeech = 'preposition';
    else if (rawPos.includes('liên') || rawPos === 'conjunction' || rawPos === 'conj') partOfSpeech = 'conjunction';
    else if (rawPos.includes('đại') || rawPos === 'pronoun' || rawPos === 'pron') partOfSpeech = 'pronoun';
    else if (rawPos.includes('thán') || rawPos === 'interjection' || rawPos === 'interj') partOfSpeech = 'interjection';
    else if (rawPos.includes('khác') || rawPos === 'other') partOfSpeech = 'other';
    else partOfSpeech = 'noun';

    let meaning = '';
    if (typeof w.meaning === 'string' && w.meaning.trim() && w.meaning !== '[object Object]') {
      meaning = w.meaning.trim();
    } else if (typeof w.definition === 'string' && w.definition.trim()) {
      meaning = w.definition.trim();
    } else if (typeof w.shortDefinition === 'string' && w.shortDefinition.trim()) {
      meaning = w.shortDefinition.trim();
    } else if (typeof w.translation === 'string' && w.translation.trim()) {
      meaning = w.translation.trim();
    } else if (typeof w.vietnamese === 'string' && w.vietnamese.trim()) {
      meaning = w.vietnamese.trim();
    } else if (typeof w.explanation === 'string' && w.explanation.trim()) {
      meaning = w.explanation.trim();
    } else if (typeof w.def === 'string' && w.def.trim()) {
      meaning = w.def.trim();
    } else if (typeof w.vocabulary?.shortDefinition === 'string' && w.vocabulary.shortDefinition.trim()) {
      meaning = w.vocabulary.shortDefinition.trim();
    } else if (typeof w.vocabulary?.definition === 'string' && w.vocabulary.definition.trim()) {
      meaning = w.vocabulary.definition.trim();
    } else if (typeof w.vocabulary?.meaning === 'string' && w.vocabulary.meaning.trim() && w.vocabulary.meaning !== '[object Object]') {
      meaning = w.vocabulary.meaning.trim();
    } else if (typeof w.vocabulary?.translation === 'string' && w.vocabulary.translation.trim()) {
      meaning = w.vocabulary.translation.trim();
    } else if (typeof w.vocabulary?.vietnamese === 'string' && w.vocabulary.vietnamese.trim()) {
      meaning = w.vocabulary.vietnamese.trim();
    } else if (Array.isArray(w.meanings) && w.meanings.length > 0) {
      const m0 = w.meanings[0];
      meaning = typeof m0 === 'string' ? m0 : (m0?.meaning || m0?.definition || m0?.vietnamese || m0?.translation || '');
    } else if (Array.isArray(w.vocabulary?.meanings) && w.vocabulary.meanings.length > 0) {
      const m0 = w.vocabulary.meanings[0];
      meaning = typeof m0 === 'string' ? m0 : (m0?.meaning || m0?.definition || m0?.vietnamese || m0?.translation || '');
    } else if (typeof w.meaning === 'object' && w.meaning !== null) {
      meaning = w.meaning.meaning || w.meaning.definition || w.meaning.vi || w.meaning.text || '';
    }

    if (!meaning && word) {
      meaning = word;
    }

    let example = '';
    if (typeof w.example === 'string' && w.example.trim()) {
      example = w.example.trim();
    } else if (typeof w.sentence === 'string' && w.sentence.trim()) {
      example = w.sentence.trim();
    } else if (typeof w.vocabulary?.example === 'string' && w.vocabulary.example.trim()) {
      example = w.vocabulary.example.trim();
    } else if (typeof w.vocabulary?.sentence === 'string' && w.vocabulary.sentence.trim()) {
      example = w.vocabulary.sentence.trim();
    } else if (Array.isArray(w.examples) && w.examples.length > 0) {
      const ex0 = w.examples[0];
      example = typeof ex0 === 'string' ? ex0 : (ex0?.sentence || ex0?.example || '');
    } else if (Array.isArray(w.vocabulary?.examples) && w.vocabulary.examples.length > 0) {
      const ex0 = w.vocabulary.examples[0];
      example = typeof ex0 === 'string' ? ex0 : (ex0?.sentence || ex0?.example || '');
    }

    let exampleTranslation = '';
    if (typeof w.exampleTranslation === 'string' && w.exampleTranslation.trim()) {
      exampleTranslation = w.exampleTranslation.trim();
    } else if (typeof w.sentenceTranslation === 'string' && w.sentenceTranslation.trim()) {
      exampleTranslation = w.sentenceTranslation.trim();
    } else if (typeof w.vocabulary?.exampleTranslation === 'string' && w.vocabulary.exampleTranslation.trim()) {
      exampleTranslation = w.vocabulary.exampleTranslation.trim();
    } else if (typeof w.vocabulary?.sentenceTranslation === 'string' && w.vocabulary.sentenceTranslation.trim()) {
      exampleTranslation = w.vocabulary.sentenceTranslation.trim();
    } else if (Array.isArray(w.examples) && w.examples.length > 0) {
      const ex0 = w.examples[0];
      exampleTranslation = typeof ex0 === 'object' ? (ex0?.translation || ex0?.meaning || '') : '';
    } else if (Array.isArray(w.vocabulary?.examples) && w.vocabulary.examples.length > 0) {
      const ex0 = w.vocabulary.examples[0];
      exampleTranslation = typeof ex0 === 'object' ? (ex0?.translation || ex0?.meaning || '') : '';
    }

    const cefrLevel = String(
      w.cefrLevel ||
      w.level ||
      w.vocabulary?.cefrLevel ||
      w.vocabulary?.level ||
      fallbackCefr ||
      'B1'
    ).trim();

    const topic = String(
      w.topic ||
      w.category ||
      w.vocabulary?.topic ||
      w.vocabulary?.category ||
      fallbackTopic ||
      'General'
    ).trim();

    return {
      word,
      phonetic: phonetic || undefined,
      partOfSpeech,
      meaning,
      example: example || undefined,
      exampleTranslation: exampleTranslation || undefined,
      cefrLevel: cefrLevel || 'B1',
      topic: topic || 'General',
    };
  };

  // Handle Personal Deck Selection with complete async data fetching
  const handleSelectPersonalDeck = async (deckId: string) => {
    setSelectedPersonalDeckId(deckId);
    if (!deckId) return;

    const d = availablePersonalDecks.find((item) => item.id === deckId);
    if (!d) return;

    if (!title || title === initialData?.title) {
      setTitle(d.title || '');
    }
    if (!description) {
      setDescription(d.description || '');
    }
    if (d.languageId) {
      setLanguageId(d.languageId);
      const defCert = getDefaultCertificateForLanguage(d.languageId);
      setCertificateId(defCert.id);
      setCefrLevel(d.cefrLevel || getDefaultLevelForLanguage(d.languageId).name);
    }
    if (d.category) {
      setCategory(d.category);
    }
    if (d.hasPassword || d.isProtected) {
      setEnablePassword(true);
      if (d.password) setPassword(d.password);
    }

    setIsParsing(true);
    setParsingProgress({
      stepText: `Đang nạp từ vựng từ kho "${d.title}"...`,
      percent: 30,
    });
    setParsingError(null);
    setParsingSuccessMsg(null);

    try {
      let rawWords: any[] = [];

      // 1. Check d.assignedWords (from MyWordBankPage computed list)
      if (Array.isArray(d.assignedWords) && d.assignedWords.length > 0) {
        rawWords = [...d.assignedWords];
      }
      // 2. Check d.words (embedded deck words array)
      else if (Array.isArray(d.words) && d.words.length > 0 && typeof d.words[0] === 'object') {
        rawWords = [...d.words];
      }

      const expectedCount = d.computedWordCount || d.wordCount || (Array.isArray(d.words) ? d.words.length : 0);

      // 3. Search IndexedDB (STORE_VOCAB) to guarantee ALL words are found
      if (rawWords.length === 0 || (expectedCount > 0 && rawWords.length < expectedCount)) {
        setParsingProgress({
          stepText: 'Đang tìm kiếm từ vựng trong bộ nhớ...',
          percent: 60,
        });
        try {
          const idbWords = await idbGetWords();
          if (Array.isArray(idbWords) && idbWords.length > 0) {
            const cleanServerId = d.id?.startsWith('cloned_') ? d.id.replace('cloned_', '') : d.id;
            const targetDeckTitle = (d.title || '').trim().toLowerCase();

            const matchedFromIdb = idbWords.filter((w: any) => {
              if (!w) return false;
              if (w.deckId && String(w.deckId) === String(d.id)) return true;
              if (cleanServerId && w.deckId && String(w.deckId) === String(cleanServerId)) return true;
              if (d.originDeckId && w.deckId && String(w.deckId) === String(d.originDeckId)) return true;
              if (targetDeckTitle && w.deckName && w.deckName.trim().toLowerCase() === targetDeckTitle) return true;
              if (Array.isArray(d.words) && d.words.includes(w.id)) return true;
              return false;
            });

            // Combine without duplicate words
            const wordMap = new Map<string, any>();
            rawWords.forEach((item) => {
              const key = item.id || (item.word || item.vocabulary?.word || '').trim().toLowerCase();
              if (key) wordMap.set(key, item);
            });
            matchedFromIdb.forEach((item) => {
              const key = item.id || (item.word || item.vocabulary?.word || '').trim().toLowerCase();
              if (key && !wordMap.has(key)) wordMap.set(key, item);
            });
            rawWords = Array.from(wordMap.values());
          }
        } catch (idbErr) {
          console.warn('IDB word query error:', idbErr);
        }
      }

      // 4. If still empty or fewer than expected and deck has a server ID, fetch from cloud API
      if ((rawWords.length === 0 || (expectedCount > 0 && rawWords.length < expectedCount)) && d.id && !d.id.startsWith('local_')) {
        setParsingProgress({
          stepText: 'Đang tải dữ liệu từ máy chủ...',
          percent: 85,
        });
        try {
          const cleanServerId = d.id.startsWith('cloned_') ? d.id.replace('cloned_', '') : d.id;
          const res: any = await api.get(`/community/decks/${cleanServerId}`);
          const fetchedWords =
            res?.data?.words ||
            res?.words ||
            res?.data?.data?.words ||
            res?.data?.assignedWords ||
            res?.assignedWords ||
            [];
          if (Array.isArray(fetchedWords) && fetchedWords.length > 0) {
            const wordMap = new Map<string, any>();
            rawWords.forEach((item) => {
              const key = item.id || (item.word || item.vocabulary?.word || '').trim().toLowerCase();
              if (key) wordMap.set(key, item);
            });
            fetchedWords.forEach((item: any) => {
              const key = item.id || (item.word || item.vocabulary?.word || '').trim().toLowerCase();
              if (key && !wordMap.has(key)) wordMap.set(key, item);
            });
            rawWords = Array.from(wordMap.values());
          }
        } catch (apiErr) {
          console.warn('API deck fetch error:', apiErr);
        }
      }

      // Map and normalize all words cleanly
      const mapped = rawWords
        .map((w: any) => normalizeDeckWord(w, d.cefrLevel || 'B1', d.category || 'General'))
        .filter((w: ParsedWordItem) => Boolean(w.word && w.word.trim()));

      if (mapped.length > 0) {
        setParsedWords(mapped);
        setParsingSuccessMsg(`Đã nạp đầy đủ ${mapped.length} từ vựng từ kho "${d.title}"!`);
        setTimeout(() => setParsingSuccessMsg(null), 5000);
      } else {
        setParsingError(`Kho "${d.title}" hiện chưa có dữ liệu từ vựng nào.`);
      }
    } catch (err: any) {
      console.error('Lỗi khi nạp từ vựng từ kho:', err);
      setParsingError(err?.message || 'Không thể tải từ vựng từ kho đã chọn.');
    } finally {
      setIsParsing(false);
    }
  };

  // Process File with Stepped Loading Feedback
  const processFile = async (file: File) => {
    if (!file) return;

    const validExts = ['.xlsx', '.xls', '.csv'];
    const lowerName = file.name.toLowerCase();
    const isSupported = validExts.some((ext) => lowerName.endsWith(ext));

    if (!isSupported) {
      setParsingError(
        'Định dạng tệp không hợp lệ. Vui lòng chọn file Excel (.xlsx, .xls) hoặc CSV (.csv).'
      );
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);
    setParsingError(null);
    setParsingSuccessMsg(null);

    const sizeKb = Math.round(file.size / 1024);
    const sizeText = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

    try {
      // Step 1: Reading file
      setParsingProgress({
        stepText: 'Đang mở và đọc cấu trúc tệp dữ liệu...',
        percent: 25,
        fileName: file.name,
        fileSize: sizeText,
      });
      await new Promise((r) => setTimeout(r, 220));

      // Step 2: Parsing & mapping columns
      setParsingProgress((p) => ({
        ...p,
        stepText: 'Đang giải mã bảng tính & nhận diện cấu trúc cột theo chuẩn...',
        percent: 60,
      }));
      await new Promise((r) => setTimeout(r, 260));

      const items = await parseVocabularyFile(file);

      // Step 3: Validating items
      setParsingProgress((p) => ({
        ...p,
        stepText: 'Đang kiểm tra và chuẩn hóa các trường thông tin từ vựng...',
        percent: 90,
      }));
      await new Promise((r) => setTimeout(r, 200));

      setParsedWords(items);
      setParsingProgress((p) => ({
        ...p,
        stepText: 'Hoàn tất trích xuất dữ liệu thành công!',
        percent: 100,
      }));

      setParsingSuccessMsg(
        `Đã đọc thành công ${items.length} từ vựng từ "${file.name}". Bạn có thể chỉnh sửa trực tiếp trên bảng hoặc xóa các từ không chuẩn.`
      );
      setTimeout(() => setParsingSuccessMsg(null), 5000);
    } catch (err: any) {
      setParsingError(
        err?.message ||
          'Không thể giải mã file Excel/CSV này. Vui lòng kiểm tra lại định dạng tệp hoặc tải file mẫu để đối chiếu.'
      );
      setParsedWords([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Manual Parsing text into structured words
  const parseManualLines = (): ParsedWordItem[] => {
    if (!manualWordsText.trim()) return [];
    return manualWordsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const parts = line.split('|').map((p) => p.trim());
        return {
          word: parts[0] || '',
          phonetic: parts[1] || '',
          partOfSpeech: parts[2] || 'noun',
          meaning: parts[3] || parts[0] || '',
          example: parts[4] || '',
          exampleTranslation: parts[5] || '',
          cefrLevel: cefrLevel,
          topic: category,
        };
      })
      .filter((w) => Boolean(w.word));
  };

  const handleConvertManualTextToTable = () => {
    const list = parseManualLines();
    if (list.length === 0) {
      alert('Vui lòng nhập ít nhất 1 dòng từ vựng hợp lệ theo cú pháp.');
      return;
    }
    setParsedWords((prev) => [...list, ...prev]);
    setManualWordsText('');
    setParsingSuccessMsg(`Đã thêm ${list.length} từ vựng vào bảng chỉnh sửa.`);
    setTimeout(() => setParsingSuccessMsg(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tên kho từ vựng.');
      return;
    }

    // Determine final words
    let finalWords: ParsedWordItem[] = [...parsedWords];
    if (wordSourceTab === 'manual' && manualWordsText.trim()) {
      const manualList = parseManualLines();
      finalWords = [...finalWords, ...manualList];
    }

    const payload: UnifiedDeckFormData = {
      id: initialData?.id,
      title: title.trim(),
      description: description.trim(),
      languageId,
      certificateId,
      cefrLevel,
      category,
      hasPassword: enablePassword && password.trim().length > 0,
      password: enablePassword && password.trim().length > 0 ? password.trim() : undefined,
      isPublic,
      words: finalWords.map((w) => ({
        ...w,
        meaning: (w.meaning && w.meaning.trim()) || w.word.trim(),
      })),
      selectedPersonalDeckId: wordSourceTab === 'personal_deck' ? selectedPersonalDeckId : undefined,
    };

    await onSubmit(payload);
  };

  const validWordsCount = useMemo(
    () => parsedWords.filter((w) => w.word?.trim()).length,
    [parsedWords]
  );

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <form
        onSubmit={handleSubmit}
        className="m-auto w-[96vw] max-w-7xl 2xl:max-w-[1550px] max-h-[95vh] h-[92vh] flex flex-col rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800/90 p-4 sm:p-6 shadow-2xl animate-fade-in text-left overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/20 dark:from-indigo-950/80 dark:to-purple-950/80 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
              {mode === 'create' ? <FolderPlus className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {titleText ||
                    (mode === 'create'
                      ? 'Tạo kho từ vựng'
                      : 'Chỉnh sửa kho từ vựng')}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <CountryFlag languageId={languageId} size="xs" />
                  <span>{langDef.name}</span>
                </span>
                {parsedWords.length > 0 && (
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    {parsedWords.length} từ ({validWordsCount} hợp lệ)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitleText ||
                  'Cấu hình kho từ, nạp danh sách và chỉnh sửa trực tiếp trên bảng dữ liệu'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Toggle Full-width / Split View */}
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="btn-glass-secondary btn-glass-sm !py-1.5 text-xs text-slate-600 dark:text-slate-300 hidden md:flex items-center gap-1.5"
              title={
                isMaximized
                  ? 'Thu gọn về chế độ 2 cột tiêu chuẩn'
                  : 'Mở rộng toàn màn hình bảng từ vựng'
              }
            >
              {isMaximized ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>2 cột</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Mở rộng</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn-glass-secondary btn-glass-icon text-slate-400 hover:text-slate-700 dark:hover:text-white"
              aria-label="Đóng cửa sổ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Compact Strip when Maximized */}
        {isMaximized && (
          <div className="py-2 px-3 my-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">Kho từ:</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                {title || '(Chưa đặt tên kho)'}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">{langDef.name}</span>
              <span className="text-slate-400">•</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-semibold text-[10px]">
                {cefrLevel}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-semibold text-[10px]">
                {category}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsMaximized(false)}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
            >
              Chỉnh sửa thông tin kho từ ⚙️
            </button>
          </div>
        )}

        {/* Main Content Area: Split 2 Columns on Desktop */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 sm:gap-5 overflow-hidden py-2.5">
          {/* LEFT COLUMN: Deck Metadata & Configuration */}
          <div
            className={`${
              isMaximized ? 'hidden' : 'w-full lg:w-[380px] xl:w-[420px] shrink-0'
            } flex flex-col gap-3.5 overflow-y-auto pr-1 chat-scrollbar text-xs`}
          >
            {/* 1. Deck Title */}
            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1 text-xs">
                Tên kho từ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tên kho từ..."
                className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-semibold text-xs text-slate-900 dark:text-white transition placeholder:text-slate-400"
              />
            </div>

            {/* 2. Standard Language Fields */}
            <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Ngôn ngữ & Trình độ</span>
                </span>
              </div>

              <DeckStandardFields
                languageId={languageId}
                allowLanguageChange={true}
                onLanguageChange={(newLang) => {
                  setLanguageId(newLang);
                  const defCert = getDefaultCertificateForLanguage(newLang);
                  setCertificateId(defCert.id);
                  setCategory(getDefaultCategoryForLanguage(newLang));
                  setCefrLevel(getDefaultLevelForLanguage(newLang).name);
                }}
                certificateId={certificateId}
                onCertificateChange={setCertificateId}
                level={cefrLevel}
                onLevelChange={setCefrLevel}
                category={category}
                onCategoryChange={setCategory}
                customCategories={customCategories}
                onAddCustomCategory={onAddCustomCategory}
                gridCols={2}
              />
            </div>

            {/* 3. Description & Goals */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  Mô tả kho từ
                </label>
                <span className="text-[10px] text-slate-400">{description.length} ký tự</span>
              </div>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả ngắn gọn về kho từ..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-normal text-xs leading-relaxed text-slate-900 dark:text-white transition resize-none placeholder:text-slate-400"
              />
            </div>

            {/* 4. Password Protection */}
            <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Mật khẩu bảo vệ
                    </span>
                    <span className="text-[10px] text-slate-400">Yêu cầu mật khẩu khi truy cập</span>
                  </div>
                </div>
                <ToggleSwitch
                  checked={enablePassword}
                  onChange={(checked) => setEnablePassword(checked)}
                  size="sm"
                />
              </div>

              {enablePassword && (
                <div className="relative pt-1 animate-fade-in">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full text-xs h-8 px-3 pr-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            {/* 5. Cloud & Community Sharing */}
            <div className="p-3 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0">
                    <Share2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Chia sẻ cộng đồng
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Công khai để mọi người có thể học tập
                    </span>
                  </div>
                </div>
                <ToggleSwitch
                  checked={isPublic}
                  onChange={(checked) => setIsPublic(checked)}
                  size="sm"
                />
              </div>
            </div>

            {/* 6. Quick Word Count Summary Card */}
            <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs mt-auto">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                  Từ vựng nạp vào:
                </span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {parsedWords.length} <span className="text-xs font-normal text-slate-400">từ</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block">
                  ✓ {validWordsCount} hợp lệ
                </span>
                {parsedWords.length - validWordsCount > 0 && (
                  <span className="text-[10px] text-rose-500 font-semibold block">
                    ⚠ {parsedWords.length - validWordsCount} cần hoàn thiện
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Word Sources & The Full Editable Staging Table */}
          <div className="flex-1 min-w-0 flex flex-col gap-3 h-full overflow-hidden bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl p-3 sm:p-4 border border-slate-200/70 dark:border-slate-800/70">
            {/* Top Source Switcher Tabs & Download Templates */}
            <div className="flex flex-wrap items-center justify-between gap-2 shrink-0 border-b border-slate-200/70 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-xl border border-slate-300/60 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setWordSourceTab('file')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    wordSourceTab === 'file'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Tệp Excel / CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWordSourceTab('manual')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    wordSourceTab === 'manual'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Nhập thủ công</span>
                </button>

                {hasPersonalDecksOption && (
                  <button
                    type="button"
                    onClick={() => setWordSourceTab('personal_deck')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      wordSourceTab === 'personal_deck'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Từ kho cá nhân</span>
                  </button>
                )}
              </div>

              {/* Sample Templates Download Buttons */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 hidden sm:inline">Mẫu dữ liệu:</span>
                <button
                  type="button"
                  onClick={() => downloadVocabularyTemplate('xlsx')}
                  className="btn-glass-secondary btn-glass-sm !py-1 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1 shadow-xs"
                  title="Tải mẫu file Excel chuẩn .xlsx"
                >
                  <Download className="w-3 h-3 text-emerald-500" />
                  <span>Mẫu .xlsx</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadVocabularyTemplate('csv')}
                  className="btn-glass-secondary btn-glass-sm !py-1 text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1 shadow-xs"
                  title="Tải mẫu file CSV chuẩn .csv"
                >
                  <Download className="w-3 h-3 text-indigo-500" />
                  <span>Mẫu .csv</span>
                </button>
              </div>
            </div>

            {/* TAB 1: FILE IMPORT ZONE & LOADING ANIMATION */}
            {wordSourceTab === 'file' && (
              <div className="shrink-0 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  className="hidden"
                  onChange={handleFileInputChange}
                />

                {/* 1. LOADING CARD WHEN READING / PARSING FILE */}
                {isParsing && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 border-2 border-indigo-400/50 dark:border-indigo-600/50 flex flex-col items-center justify-center text-center space-y-3 shadow-md animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md animate-bounce">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                          <span>Đang đọc và phân tích dữ liệu file...</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {parsingProgress.fileName} ({parsingProgress.fileSize})
                        </p>
                      </div>
                    </div>

                    {/* Animated Progress Bar */}
                    <div className="w-full max-w-md bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${parsingProgress.percent}%` }}
                      />
                    </div>

                    <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                      {parsingProgress.stepText}
                    </p>
                  </div>
                )}

                {/* 2. FILE UPLOAD DROPZONE (When not parsing) */}
                {!isParsing && parsedWords.length === 0 && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                      isDragging
                        ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-inner'
                        : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-white/70 dark:bg-slate-800/40 hover:bg-emerald-50/20'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {selectedFile
                          ? `Đã chọn: ${selectedFile.name}`
                          : 'Kéo thả hoặc bấm để chọn tệp Excel (.xlsx) / CSV'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Tự động đọc: Từ vựng, Phiên âm, Loại từ, Nghĩa, Ví dụ, Dịch ví dụ, Trình độ, Chủ đề
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. COMPACT FILE SUMMARY BAR (When file already loaded with words) */}
                {!isParsing && parsedWords.length > 0 && selectedFile && (
                  <div className="py-2 px-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {selectedFile.name}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        ({Math.round(selectedFile.size / 1024)} KB)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] hover:bg-slate-50 transition flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3 text-indigo-500" />
                        <span>Đổi file khác</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Success Notification */}
                {parsingSuccessMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{parsingSuccessMsg}</span>
                  </div>
                )}

                {/* Error Notification */}
                {parsingError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2 animate-fade-in">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold">Lỗi khi nạp file:</p>
                      <p className="text-[11px] mt-0.5">{parsingError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setParsingError(null)}
                      className="text-rose-400 hover:text-rose-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MANUAL TEXT INPUT */}
            {wordSourceTab === 'manual' && (
              <div className="shrink-0 space-y-2 p-3 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>
                    Cú pháp mỗi dòng: <code>Từ vựng | Phiên âm | Loại từ | Nghĩa | Ví dụ | Dịch ví dụ</code>
                  </span>
                  <span>Mỗi từ 1 dòng</span>
                </div>
                <textarea
                  rows={3}
                  value={manualWordsText}
                  onChange={(e) => setManualWordsText(e.target.value)}
                  placeholder={
                    'compromise | /ˈkɒmprəmaɪz/ | noun | sự thỏa hiệp | Both parties reached a compromise | Cả hai bên đã thỏa hiệp\nresilient | /rɪˈzɪliənt/ | adjective | kiên cường | The economy is resilient | Nền kinh tế kiên cường'
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs leading-relaxed text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleConvertManualTextToTable}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nạp vào bảng từ</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: SELECT FROM PERSONAL DECK */}
            {wordSourceTab === 'personal_deck' && hasPersonalDecksOption && (
              <div className="shrink-0 p-3 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Chọn kho từ cá nhân:
                </label>
                {loadingPersonalDecks || fetchingDecks ? (
                  <div className="p-3 text-center text-xs text-slate-400 animate-pulse">
                    Đang tải danh sách kho từ...
                  </div>
                ) : (
                  <CustomDropdown
                    value={selectedPersonalDeckId}
                    onChange={(val) => handleSelectPersonalDeck(val)}
                    options={(availablePersonalDecks || []).map((d) => ({
                      value: d.id,
                      label: `${d.title} (${d.computedWordCount || d.wordCount || d.words?.length || d.assignedWords?.length || 0} từ)`,
                      badge: d.category || 'General',
                    }))}
                    searchable={true}
                    placeholder="-- Chọn kho từ --"
                    size="md"
                    className="w-full"
                  />
                )}
              </div>
            )}

            {/* THE EDITABLE VOCABULARY STAGING TABLE COMPONENT */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <EditableVocabularyStagingTable
                words={parsedWords}
                onChangeWords={setParsedWords}
                defaultCefrLevel={cefrLevel}
                defaultTopic={category}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {parsedWords.length > 0 ? (
              <span>
                Sẵn sàng lưu <strong className="text-emerald-600 font-bold">{validWordsCount}</strong> từ
                vựng vào kho.
              </span>
            ) : (
              <span>Kho từ chưa có từ vựng (Có thể bổ sung từ sau khi tạo kho).</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-glass-secondary btn-glass-sm !px-4"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-glass-primary btn-glass-sm !px-6 flex items-center gap-1.5 shadow-md font-bold"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>
                {submitButtonText ||
                  (mode === 'create' ? 'Tạo kho từ' : 'Lưu thay đổi')}
              </span>
            </button>
          </div>
        </div>
      </form>
    </ModalPortal>
  );
};

export default UnifiedDeckModal;
