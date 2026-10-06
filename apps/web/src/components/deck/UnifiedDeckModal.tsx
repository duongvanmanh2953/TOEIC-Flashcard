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
  mapToCefrEquivalent,
  getCategoriesForLanguage,
} from '../../config/languageStandards';
import {
  downloadVocabularyTemplate,
  parseVocabularyFile,
  ParsedWordItem,
} from '../../utils/excelTemplate';
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
  BookOpen,
  Check,
  Trash2,
  Plus,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Layers,
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

  // Word Source Tabs: 'personal_deck' | 'manual' | 'file'
  const hasPersonalDecksOption = Boolean(personalDecks && personalDecks.length > 0);
  const [wordSourceTab, setWordSourceTab] = useState<'personal_deck' | 'manual' | 'file'>(
    hasPersonalDecksOption ? 'personal_deck' : 'manual'
  );
  const [selectedPersonalDeckId, setSelectedPersonalDeckId] = useState('');

  // Manual Words (Text input)
  const [manualWordsText, setManualWordsText] = useState('');

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedWords, setParsedWords] = useState<ParsedWordItem[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [editingParsedIdx, setEditingParsedIdx] = useState<number | null>(null);
  const [editingParsedItem, setEditingParsedItem] = useState<ParsedWordItem | null>(null);

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

      setEnablePassword(Boolean(initialData?.hasPassword || (initialData?.password && initialData.password.trim().length > 0)));
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
      setEditingParsedIdx(null);
      setEditingParsedItem(null);

      if (hasPersonalDecksOption && personalDecks && personalDecks.length > 0) {
        setWordSourceTab('personal_deck');
        setSelectedPersonalDeckId(initialData?.selectedPersonalDeckId || personalDecks[0].id);
      } else {
        setWordSourceTab('manual');
      }
    }
  }, [isOpen, initialData, hasPersonalDecksOption]);

  const langDef = useMemo(() => getLanguage(languageId), [languageId]);

  // Handle Personal Deck Selection
  const handleSelectPersonalDeck = (deckId: string) => {
    setSelectedPersonalDeckId(deckId);
    const d = personalDecks?.find((item) => item.id === deckId);
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
    if (Array.isArray(d.words) && d.words.length > 0) {
      setParsedWords(
        d.words.map((w: any) => ({
          word: w.word,
          phonetic: w.phonetic,
          partOfSpeech: w.partOfSpeech || 'noun',
          meaning: w.meaning || w.definition,
          example: w.example,
          exampleTranslation: w.exampleTranslation,
          cefrLevel: w.cefrLevel || d.cefrLevel || 'B1',
          topic: w.topic || d.category || 'General',
        }))
      );
    }
  };

  // Handle File Upload
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
      setParsingError(err?.message || 'Không thể giải mã file Excel/CSV này. Vui lòng kiểm tra lại định dạng cột.');
      setParsedWords([]);
    } finally {
      setIsParsing(false);
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

  // Staging Row editing
  const handleStartEditParsed = (idx: number) => {
    setEditingParsedIdx(idx);
    setEditingParsedItem({ ...parsedWords[idx] });
  };

  const handleSaveEditParsed = (idx: number) => {
    if (!editingParsedItem) return;
    const updated = [...parsedWords];
    updated[idx] = editingParsedItem;
    setParsedWords(updated);
    setEditingParsedIdx(null);
    setEditingParsedItem(null);
  };

  const handleDeleteParsedRow = (idx: number) => {
    setParsedWords((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tên kho từ vựng.');
      return;
    }

    // Determine final words
    let finalWords: ParsedWordItem[] = [];
    if (wordSourceTab === 'file') {
      finalWords = parsedWords;
    } else if (wordSourceTab === 'manual') {
      const manualList = parseManualLines();
      finalWords = [...parsedWords, ...manualList];
    } else if (wordSourceTab === 'personal_deck') {
      finalWords = parsedWords;
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
      words: finalWords,
      selectedPersonalDeckId: wordSourceTab === 'personal_deck' ? selectedPersonalDeckId : undefined,
    };

    await onSubmit(payload);
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <form
        onSubmit={handleSubmit}
        className="m-auto max-w-4xl w-full max-h-[92vh] flex flex-col rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800/90 p-5 sm:p-7 shadow-2xl animate-fade-in text-left overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/20 dark:from-indigo-950/80 dark:to-purple-950/80 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
              {mode === 'create' ? <FolderPlus className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {titleText || (mode === 'create' ? 'Tạo & Đăng Tải Kho Từ Vựng' : 'Chỉnh Sửa Thông Tin Kho Từ Vựng')}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <CountryFlag languageId={languageId} size="xs" />
                  <span>{langDef.name}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitleText || 'Cấu hình chuẩn ngôn ngữ, nhập từ vựng và thiết lập bảo mật chia sẻ đồng bộ'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-glass-secondary btn-glass-icon text-slate-400 hover:text-slate-700 dark:hover:text-white"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="space-y-4 text-xs sm:text-sm flex-1 min-h-0 overflow-y-auto py-3.5 pr-1 chat-scrollbar">
          {/* Deck Title */}
          <div>
            <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5 text-xs sm:text-sm">
              Tên kho từ vựng <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Goethe B1 Từ Vựng Trọng Tâm, 600 Essential TOEIC Words, JLPT N3 Kaiwa..."
              className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-semibold text-xs sm:text-sm text-slate-900 dark:text-white transition placeholder:text-slate-400"
            />
          </div>

          {/* Standard Language Fields (Ngôn ngữ, Chứng chỉ, Trình độ, Chủ đề) */}
          <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-500" />
                <span>Không gian ngôn ngữ & Chuẩn trình độ</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Tự động lưu và đồng bộ đúng ngôn ngữ lên Kho chung
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
              gridCols={3}
            />
          </div>

          {/* Description & Learning Goals */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                <span>Lý do tạo kho & Mục tiêu học tập</span>
                <span className="text-[11px] font-normal text-slate-400">
                  (Mô tả lộ trình, nhóm đối tượng hoặc nguồn tài liệu tham khảo)
                </span>
              </label>
              <span className="text-[11px] text-slate-400">{description.length} ký tự</span>
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={"Ví dụ:\n• Lý do: Chuẩn bị thi chứng chỉ mục tiêu vào cuối năm.\n• Mục tiêu: Nắm vững 30 từ vựng chuyên ngành mỗi tuần.\n• Nguồn tài liệu: Trích xuất từ đề thi chính thức và thực tế..."}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-normal text-xs sm:text-sm leading-relaxed text-slate-900 dark:text-white transition resize-y min-h-[85px] placeholder:text-slate-400"
            />
          </div>

          {/* Security & Public Sharing Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Password Protection */}
            <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Mật khẩu bảo vệ kho
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Yêu cầu mã PIN khi sao chép
                    </span>
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
                    placeholder="Nhập mã PIN hoặc mật khẩu..."
                    className="w-full text-xs h-9 px-3 pr-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            {/* Share to Community / Cloud */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/50 border border-indigo-200/60 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0">
                    <Share2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Đăng tải lên Kho chung (Cộng đồng)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Lưu trữ đám mây & gửi duyệt cộng đồng
                    </span>
                  </div>
                </div>
                <ToggleSwitch
                  checked={isPublic}
                  onChange={(checked) => setIsPublic(checked)}
                  size="sm"
                />
              </div>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 leading-relaxed">
                {isPublic
                  ? `⭐ Kho sẽ được xuất bản vào Kho chung với mã ngôn ngữ [${languageId.toUpperCase()}].`
                  : 'Kho được lưu ở chế độ riêng tư trên thiết bị của bạn.'}
              </p>
            </div>
          </div>

          {/* Word Source Tabs (Nhập từ vựng & File Import) */}
          <div className="space-y-3 pt-2 border-t border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>Nạp & Đóng góp từ vựng</span>
                {parsedWords.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white">
                    {parsedWords.length} từ
                  </span>
                )}
              </span>

              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-700">
                {hasPersonalDecksOption && (
                  <button
                    type="button"
                    onClick={() => setWordSourceTab('personal_deck')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      wordSourceTab === 'personal_deck'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    Chọn kho cá nhân
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setWordSourceTab('manual')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    wordSourceTab === 'manual'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  Nhập thủ công
                </button>
                <button
                  type="button"
                  onClick={() => setWordSourceTab('file')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                    wordSourceTab === 'file'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-500" />
                  <span>Excel / CSV</span>
                </button>
              </div>
            </div>

            {/* TAB 1: Select from Personal Decks */}
            {wordSourceTab === 'personal_deck' && hasPersonalDecksOption && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 animate-fade-in">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Chọn kho từ cá nhân của bạn:
                </label>
                {loadingPersonalDecks ? (
                  <div className="p-3 text-center text-xs text-slate-400 animate-pulse">
                    Đang tải danh sách kho cá nhân...
                  </div>
                ) : (
                  <CustomDropdown
                    value={selectedPersonalDeckId}
                    onChange={(val) => handleSelectPersonalDeck(val)}
                    options={(personalDecks || []).map((d) => ({
                      value: d.id,
                      label: `${d.title} (${d.wordCount || d.words?.length || 0} từ) • [${(d.languageId || 'en').toUpperCase()}]`,
                      badge: d.category || 'General',
                    }))}
                    searchable={true}
                    placeholder="-- Chọn kho từ cá nhân --"
                    size="md"
                    className="w-full"
                  />
                )}
              </div>
            )}

            {/* TAB 2: Manual Text Input */}
            {wordSourceTab === 'manual' && (
              <div className="space-y-2 animate-fade-in">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Cú pháp: <code>Từ vựng | Phiên âm | Loại từ | Nghĩa | Ví dụ | Dịch</code></span>
                  <span>Mỗi từ 1 dòng</span>
                </div>
                <textarea
                  rows={4}
                  value={manualWordsText}
                  onChange={(e) => setManualWordsText(e.target.value)}
                  placeholder={"compromise | /ˈkɒmprəmaɪz/ | noun | sự thỏa hiệp | Both parties reached a compromise | Cả hai bên đã thỏa hiệp\nresilient | /rɪˈzɪliənt/ | adjective | kiên cường | The economy is resilient | Nền kinh tế kiên cường"}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 font-mono text-xs leading-relaxed text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
            )}

            {/* TAB 3: Excel / CSV File Upload */}
            {wordSourceTab === 'file' && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tải mẫu file chuẩn để điền hàng loạt từ vựng:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => downloadVocabularyTemplate('xlsx')}
                      className="btn-glass-secondary btn-glass-sm !py-1 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Mẫu .xlsx</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadVocabularyTemplate('csv')}
                      className="btn-glass-secondary btn-glass-sm !py-1 text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Mẫu .csv</span>
                    </button>
                  </div>
                </div>

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
                  <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {selectedFile ? selectedFile.name : 'Chọn file Excel (.xlsx) hoặc CSV từ máy tính'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Nhận diện tự động 7 cột: Word, Phonetic, PartOfSpeech, Meaning, Example, CEFR, Topic
                  </p>
                </div>

                {isParsing && (
                  <div className="py-2 text-center text-xs text-indigo-600 font-bold flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang giải mã và đọc file dữ liệu...</span>
                  </div>
                )}

                {parsingError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 text-rose-700 dark:text-rose-300 text-xs font-medium">
                    {parsingError}
                  </div>
                )}
              </div>
            )}

            {/* Parsed Staging Preview Table */}
            {parsedWords.length > 0 && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Danh sách từ chuẩn bị nạp ({parsedWords.length} từ)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setParsedWords([]);
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                  >
                    Xóa danh sách từ
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-[11px] border border-slate-200/80 dark:border-slate-700/80 rounded-xl bg-white dark:bg-slate-900/80">
                  {parsedWords.map((row, idx) => (
                    <div key={idx} className="p-2 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-[10px] text-slate-400 font-mono w-5 shrink-0">{idx + 1}</span>
                        <span className="font-bold text-slate-900 dark:text-white truncate">{row.word}</span>
                        {row.phonetic && <span className="text-[10px] text-indigo-500 font-mono truncate">{row.phonetic}</span>}
                        <span className="text-slate-500 dark:text-slate-400 truncate">({row.meaning})</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-500">
                          {row.cefrLevel || cefrLevel}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteParsedRow(idx)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition"
                          title="Xóa từ này"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn-glass-secondary btn-glass-sm !px-5"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-glass-primary btn-glass-sm !px-6 flex items-center gap-1.5"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>
              {submitButtonText || (mode === 'create' ? 'Tạo Kho & Đăng Tải' : 'Lưu Thay Đổi')}
            </span>
          </button>
        </div>
      </form>
    </ModalPortal>
  );
};

export default UnifiedDeckModal;
