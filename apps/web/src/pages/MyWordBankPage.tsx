import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { GlassCard } from '../components/common/GlassCard';
import { SpeechButton } from '../components/common/SpeechButton';
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
  FileText,
  X,
  ArrowRight,
  Heart,
  Tag,
} from 'lucide-react';
import {
  downloadVocabularyTemplate,
  parseVocabularyFile,
  ParsedWordItem,
} from '../utils/excelTemplate';

export const MyWordBankPage: React.FC = () => {
  const navigate = useNavigate();
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'LEARNING' | 'MASTERED' | 'FAVORITES'>('ALL');
  const [topicFilter, setTopicFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Favorites state
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('vocabflow_favorites') || '[]');
    } catch {
      return [];
    }
  });

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'manual' | 'excel'>('manual');

  // Manual Form States
  const [word, setWord] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('noun');
  const [meaning, setMeaning] = useState('');
  const [example, setExample] = useState('');
  const [cefrLevel, setCefrLevel] = useState('B1');
  const [topic, setTopic] = useState('Business English');
  const [customTopic, setCustomTopic] = useState('');
  const [adding, setAdding] = useState(false);

  // Excel / CSV File Import States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedWords, setParsedWords] = useState<ParsedWordItem[]>([]);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMyWords = async () => {
    setLoading(true);
    try {
      const res: any = await api.get(`/community/my-words?filter=${filter}`);
      setWords(res?.data || res || []);
    } catch (err) {
      console.error('Failed to fetch personal word bank', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyWords();
  }, [filter]);

  const handleToggleFavorite = (wordId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteIds((prev) => {
      const next = prev.includes(wordId) ? prev.filter((id) => id !== wordId) : [...prev, wordId];
      try {
        localStorage.setItem('vocabflow_favorites', JSON.stringify(next));
      } catch { }
      return next;
    });
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word || !meaning) return;

    setAdding(true);
    const finalTopic = topic === 'Other' ? customTopic || 'General' : topic;

    try {
      await api.post('/community/words/quick-add', {
        word,
        phonetic,
        partOfSpeech,
        meaning,
        example,
        cefrLevel,
        topic: finalTopic,
      });

      setShowAddModal(false);
      setWord('');
      setPhonetic('');
      setMeaning('');
      setExample('');
      setCustomTopic('');
      fetchMyWords();
    } catch (err) {
      console.error('Failed to add custom word', err);
    } finally {
      setAdding(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setParsingError(null);
    setIsParsing(true);

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
    if (parsedWords.length === 0 || isImporting) return;

    setIsImporting(true);
    try {
      const res: any = await api.post('/community/words/batch-add', {
        words: parsedWords,
      });

      setImportSuccessMsg(res?.message || `Đã nhập thành công ${parsedWords.length} từ vựng vào kho cá nhân!`);
      fetchMyWords();

      setTimeout(() => {
        setImportSuccessMsg(null);
        setShowAddModal(false);
        setSelectedFile(null);
        setParsedWords([]);
      }, 2000);
    } catch (err: any) {
      setParsingError(err.response?.data?.message || err.message || 'Lỗi khi nhập dữ liệu.');
    } finally {
      setIsImporting(false);
    }
  };

  // Unique topics from words
  const availableTopics = Array.from(
    new Set(
      words
        .map((item) => item.vocabulary?.topic || item.topic)
        .filter(Boolean)
    )
  );

  const filteredWords = words.filter((item) => {
    const w = item.vocabulary?.word?.toLowerCase() || '';
    const m = (item.vocabulary?.shortDefinition || item.vocabulary?.definition || '').toLowerCase();
    const itemTopic = item.vocabulary?.topic || item.topic || 'General';
    const q = search.toLowerCase().trim();

    const matchesSearch = !q || w.includes(q) || m.includes(q);
    const matchesTopic = topicFilter === 'ALL' || itemTopic === topicFilter;
    const isFav = favoriteIds.includes(item.id) || item.isFavorite;
    const matchesFav = filter !== 'FAVORITES' || isFav;

    return matchesSearch && matchesTopic && matchesFav;
  });

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1 border border-indigo-500/20">
            <Bookmark className="w-3.5 h-3.5" />
            <span>Personal Word Bank</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
            Kho Từ Vựng Cá Nhân & Sổ Tay Từ
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            Nơi lưu trữ toàn bộ từ bạn đã học, đánh dấu yêu thích hoặc tự nhập thêm từ tài liệu cá nhân / Excel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/review')}
            className="btn-glass-primary text-xs !py-2.5 gap-2 shadow-md"
          >
            <Sparkles className="w-4 h-4 fill-white" />
            <span>Ôn tập kho từ này</span>
          </button>

          <button
            onClick={() => {
              setActiveModalTab('excel');
              setShowAddModal(true);
            }}
            className="btn-glass-emerald text-xs !py-2.5 gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            <span>Nhập Excel / CSV</span>
          </button>

          <button
            onClick={() => {
              setActiveModalTab('manual');
              setShowAddModal(true);
            }}
            className="btn-glass-secondary text-xs !py-2.5 gap-1.5"
          >
            <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Thêm từ mới</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Tabs & Topic Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            {[
              { key: 'ALL', label: 'Tất cả từ' },
              { key: 'LEARNING', label: 'Đang học' },
              { key: 'MASTERED', label: 'Đã thuộc' },
              { key: 'FAVORITES', label: 'Yêu thích' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key as any)}
                className={`px-3 py-1 rounded-xl transition ${filter === t.key
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Topic Dropdown Filter */}
          <CustomDropdown
            value={topicFilter}
            onChange={(val) => setTopicFilter(val)}
            options={[
              { value: 'ALL', label: 'Tất cả chủ đề' },
              ...availableTopics.map((t) => ({ value: t, label: t })),
            ]}
            size="sm"
            className="w-40 sm:w-48"
          />
        </div>

        {/* Search box */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm từ hoặc nghĩa..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Word Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredWords.length === 0 ? (
        <div className="text-center py-20 text-slate-400 space-y-3 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 p-8">
          <Layers className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
          <p className="text-sm font-medium">Chưa có từ vựng nào phù hợp bộ lọc.</p>
          <button
            onClick={() => {
              setActiveModalTab('excel');
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Tải lên file từ vựng Excel / CSV</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredWords.map((item) => {
            const v = item.vocabulary || {};
            const meaningText = v?.meanings?.[0]?.meaning || v?.shortDefinition || v?.definition || item.meaning;
            const wordText = v?.word || item.word;
            const wordTopic = v?.topic || item.topic || 'General';
            const isFav = favoriteIds.includes(item.id) || item.isFavorite;

            return (
              <GlassCard key={item.id} variant="liquid" className="p-4 sm:p-5 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${item.status === 'MASTERED'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
                            : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                          }`}
                      >
                        {item.status || 'LEARNING'}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {wordTopic}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleToggleFavorite(item.id, e)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title={isFav ? 'Bỏ yêu thích' : 'Lưu vào danh sách yêu thích'}
                      >
                        <Heart
                          className={`w-4 h-4 transition-all ${isFav ? 'fill-rose-500 text-rose-500 scale-110' : 'text-slate-300 hover:text-rose-400'
                            }`}
                        />
                      </button>
                      <SpeechButton text={wordText} />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">{wordText}</h3>
                  {v.phonetic && <p className="text-xs tabular-nums text-slate-400">{v.phonetic}</p>}
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                    {meaningText}
                  </p>
                </div>

                {v.examples?.[0] && (
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 italic line-clamp-2">
                    "{v.examples[0].sentence}"
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Add / Import Modal — ModalPortal to document.body */}
      <ModalPortal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
        <div
          className="m-auto relative w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                Thêm Từ Vựng Vào Kho Cá Nhân
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Nhập từng từ thủ công hoặc tải lên hàng loạt từ file Excel/CSV mẫu.
              </p>
            </div>

            {/* Tab Selector */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveModalTab('manual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeModalTab === 'manual'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
              >
                Nhập thủ công
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('excel')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${activeModalTab === 'excel'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Nhập từ Excel / CSV</span>
              </button>
            </div>
          </div>

          {/* TAB 1: MANUAL ENTRY */}
          {activeModalTab === 'manual' && (
            <form onSubmit={handleAddWord} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Từ tiếng Anh *
                  </label>
                  <input
                    type="text"
                    required
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    placeholder="Ví dụ: compromise, resilient..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phiên âm IPA
                  </label>
                  <input
                    type="text"
                    value={phonetic}
                    onChange={(e) => setPhonetic(e.target.value)}
                    placeholder="Ví dụ: /ˈkɒmprəmaɪz/"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 tabular-nums text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nghĩa tiếng Việt *
                  </label>
                  <input
                    type="text"
                    required
                    value={meaning}
                    onChange={(e) => setMeaning(e.target.value)}
                    placeholder="Ví dụ: sự thỏa hiệp, nhượng bộ"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs sm:text-sm">
                    Khung CEFR
                  </label>
                  <CustomDropdown
                    value={cefrLevel}
                    onChange={(val) => setCefrLevel(val)}
                    options={[
                      { value: 'A2', label: 'A2 — Pre-intermediate', badge: 'A2' },
                      { value: 'B1', label: 'B1 — Intermediate', badge: 'B1' },
                      { value: 'B2', label: 'B2 — Upper Intermediate', badge: 'B2' },
                      { value: 'C1', label: 'C1 — Advanced', badge: 'C1' },
                    ]}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs sm:text-sm">
                    Loại từ
                  </label>
                  <CustomDropdown
                    value={partOfSpeech}
                    onChange={(val) => setPartOfSpeech(val)}
                    options={[
                      { value: 'noun', label: 'Danh từ (noun)' },
                      { value: 'verb', label: 'Động từ (verb)' },
                      { value: 'adjective', label: 'Tính từ (adjective)' },
                      { value: 'adverb', label: 'Trạng từ (adverb)' },
                      { value: 'phrase', label: 'Cụm từ (phrase)' },
                    ]}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs sm:text-sm">
                    Chủ đề (Topic) *
                  </label>
                  <CustomDropdown
                    value={topic}
                    onChange={(val) => setTopic(val)}
                    options={[
                      { value: 'Business English', label: 'Business & Office' },
                      { value: 'Finance & Banking', label: 'Finance & Banking' },
                      { value: 'Travel & Hospitality', label: 'Travel & Hospitality' },
                      { value: 'Technology & IT', label: 'Technology & IT' },
                      { value: 'Daily Communication', label: 'Daily Communication' },
                      { value: 'Academic & IELTS', label: 'Academic English' },
                      { value: 'Other', label: 'Khác (Nhập tùy chỉnh)' },
                    ]}
                    className="w-full"
                  />
                </div>
              </div>

              {topic === 'Other' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tên chủ đề tùy chỉnh
                  </label>
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Ví dụ: Logistics & Supply Chain..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Câu ví dụ thực tế trong ngữ cảnh
                </label>
                <textarea
                  rows={3}
                  value={example}
                  onChange={(e) => setExample(e.target.value)}
                  placeholder="Ví dụ: Both parties reached a compromise to avoid prolonged disputes."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-glass-secondary text-xs !py-2.5 !px-5"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="btn-glass-primary text-xs !py-2.5 !px-6 disabled:opacity-50"
                >
                  {adding ? 'Đang lưu vào kho...' : 'Lưu Vào Kho Từ Của Tôi'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: EXCEL / CSV IMPORT */}
          {activeModalTab === 'excel' && (
            <div className="space-y-5 text-xs sm:text-sm">
              {/* Download Template Bar */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white leading-snug">
                      Tải file mẫu Excel / CSV chuẩn
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      File mẫu gồm các cột: Word, Phonetic, PartOfSpeech, Meaning, Example, CEFR.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadVocabularyTemplate('xlsx')}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải .xlsx (Excel)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadVocabularyTemplate('csv')}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải .csv</span>
                  </button>
                </div>
              </div>

              {/* Upload Drag & Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 sm:p-8 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedFile ? selectedFile.name : 'Bấm để chọn hoặc kéo thả file Excel / CSV vào đây'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hỗ trợ định dạng .xlsx, .xls, hoặc .csv (UTF-8)
                  </p>
                </div>
              </div>

              {isParsing && (
                <div className="p-3 text-center text-xs text-slate-500 font-semibold flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
                  <span>Đang đọc và phân tích dữ liệu từ vựng...</span>
                </div>
              )}

              {parsingError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parsingError}</span>
                </div>
              )}

              {importSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{importSuccessMsg}</span>
                </div>
              )}

              {/* Parsed Words Preview */}
              {parsedWords.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Đã nhận diện {parsedWords.length} từ vựng hợp lệ:</span>
                    </span>
                    <span className="text-slate-400">Xem trước 4 từ đầu</span>
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {parsedWords.slice(0, 4).map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 dark:text-white mr-2">{item.word}</span>
                          {item.phonetic && (
                            <span className="tabular-nums text-[11px] text-slate-400 mr-2">{item.phonetic}</span>
                          )}
                          <span className="text-slate-600 dark:text-slate-300">{item.meaning}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                          {item.cefrLevel || 'B1'}
                        </span>
                      </div>
                    ))}
                    {parsedWords.length > 4 && (
                      <p className="text-[11px] text-slate-400 text-center pt-1 italic">
                        ... và {parsedWords.length - 4} từ vựng khác sẽ được thêm tự động.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setParsedWords([]);
                      }}
                      className="btn-glass-secondary text-xs !py-2 !px-4"
                    >
                      Chọn file khác
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmBatchImport}
                      disabled={isImporting}
                      className="btn-glass-emerald text-xs !py-2.5 !px-5 gap-2 disabled:opacity-50"
                    >
                      {isImporting ? (
                        <span>Đang nạp dữ liệu...</span>
                      ) : (
                        <>
                          <span>Xác nhận nhập {parsedWords.length} từ vào kho</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ModalPortal>
    </div>
  );
};
