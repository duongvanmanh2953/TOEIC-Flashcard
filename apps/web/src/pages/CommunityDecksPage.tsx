import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { GlassCard } from '../components/common/GlassCard';
import { SpeechButton } from '../components/common/SpeechButton';
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
} from 'lucide-react';

export const CommunityDecksPage: React.FC = () => {
  const [decks, setDecks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDeck, setSelectedDeck] = useState<any | null>(null);
  const [cloneSuccess, setCloneSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New deck form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Business English');
  const [cefrLevel, setCefrLevel] = useState('B2');
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
      const res: any = await api.get('/community/decks', { params: { search } });
      if (res?.success) setDecks(res.data);
    } catch (err) {
      console.error('Failed to load community decks', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyWords = async () => {
    setLoadingMyWords(true);
    try {
      const res: any = await api.get('/community/my-words?filter=ALL');
      const data = res?.data || res || [];
      setMyWords(data);
      // Auto select first 10 words by default if available
      if (data.length > 0 && selectedMyWordIds.length === 0) {
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
  }, [search]);

  const handleOpenCreateModal = () => {
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

  const handleClone = async (deckId: string, deckTitle: string) => {
    try {
      const res: any = await api.post(`/community/decks/${deckId}/clone`);
      if (res?.success) {
        setCloneSuccess(`Đã clone thành công bộ từ "${deckTitle}" về kho học!`);
        fetchDecks();
        setTimeout(() => setCloneSuccess(null), 3500);
      }
    } catch (err: any) {
      alert(err?.message || 'Không thể clone bộ từ.');
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
      const res: any = await api.post('/community/decks', {
        title,
        description,
        category,
        cefrLevel,
        isPublic: true,
        words: finalWords,
      });

      if (res?.success) {
        setShowCreateModal(false);
        setTitle('');
        setDescription('');
        setSelectedMyWordIds([]);
        setWordsText('');
        fetchDecks();
        alert(`Bộ từ vựng "${title}" gồm ${finalWords.length} từ đã được tạo thành công và gửi duyệt cộng đồng!`);
      }
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi tạo bộ từ.');
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

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Header with CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Kho Tri Thức Mở Cộng Đồng</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
            Khám Phá & Đóng Góp Bộ Từ Vựng Cộng Đồng
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            Duyệt các bộ từ vựng thực chiến được đóng góp bởi học viên, 1-click clone về kho học của bạn hoặc chia sẻ từ kho cá nhân.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="btn-glass-primary self-start md:self-auto text-xs !py-2.5 gap-2 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo & Đóng góp bộ từ</span>
        </button>
      </div>

      {cloneSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{cloneSuccess}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm bộ từ theo chủ đề, CEFR, kỹ năng..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
        />
      </div>

      {/* Deck Grid */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {decks.map((deck) => (
            <GlassCard
              key={deck.id}
              variant="liquid"
              className="p-5 md:p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                    CEFR {deck.cefrLevel}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{deck.category}</span>
                </div>

                <h3 className="text-lg font-bold leading-snug text-slate-900 dark:text-white">{deck.title}</h3>
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
                    onClick={() => setSelectedDeck(deck)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                  >
                    Xem trước
                  </button>
                  <button
                    onClick={() => handleClone(deck.id, deck.title)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Clone về máy</span>
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Preview Deck Modal — Spacious & Perfectly Centered */}
      {selectedDeck && (
        <div
          className="fixed inset-0 !m-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          onClick={() => setSelectedDeck(null)}
        >
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
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {selectedDeck.words?.map((w: any) => (
                  <div
                    key={w.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{w.word}</span>
                        {w.phonetic && <span className="font-mono text-slate-400">{w.phonetic}</span>}
                      </div>
                      <p className="font-semibold text-indigo-700 dark:text-indigo-300 mt-0.5">{w.meaning}</p>
                      {w.example && <p className="text-slate-500 italic mt-0.5">"{w.example}"</p>}
                    </div>
                    <SpeechButton text={w.word} />
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                handleClone(selectedDeck.id, selectedDeck.title);
                setSelectedDeck(null);
              }}
              className="btn-glass-primary w-full !py-3 text-xs sm:text-sm gap-2"
            >
              <Copy className="w-4 h-4" />
              <span>Clone toàn bộ từ về kho ôn tập của tôi</span>
            </button>
          </div>
        </div>
      )}

      {/* Create & Share Deck Modal — Support sharing from My Personal Word Bank */}
      {showCreateModal && (
        <div
          className="fixed inset-0 !m-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="m-auto relative max-w-3xl w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-5 shadow-2xl max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                  Tạo & Đóng Góp Bộ Từ Vựng Cộng Đồng
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chia sẻ các từ vựng từ kho cá nhân của bạn hoặc nhập thêm từ mới để chia sẻ cùng cộng đồng.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDeck} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Tên bộ từ *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Collocations Dành Cho Viết Email Công Sở"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Chủ đề
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white"
                  >
                    <option value="Business English">Business English (Kinh doanh & Công sở)</option>
                    <option value="Technology">Technology & AI (Công nghệ)</option>
                    <option value="IELTS Prep">IELTS Academic (Luyện thi)</option>
                    <option value="Daily Life">Daily Conversation (Giao tiếp đời sống)</option>
                    <option value="Travel & Hospitality">Travel & Hospitality (Du lịch)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Khung CEFR
                  </label>
                  <select
                    value={cefrLevel}
                    onChange={(e) => setCefrLevel(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white"
                  >
                    <option value="A2">A2 — Pre-intermediate</option>
                    <option value="B1">B1 — Intermediate</option>
                    <option value="B2">B2 — Upper Intermediate</option>
                    <option value="C1">C1 — Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Mô tả ngắn
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả mục tiêu và đối tượng của bộ từ vựng..."
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
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
                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                        {filteredMyWords.map((item) => {
                          const isChecked = selectedMyWordIds.includes(item.id);
                          const v = item.vocabulary;
                          return (
                            <div
                              key={item.id}
                              onClick={() => handleToggleWord(item.id)}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition text-xs ${
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
                                  <span className="font-mono text-[11px] text-slate-400">{v.phonetic}</span>
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
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white"
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
        </div>
      )}
    </div>
  );
};
