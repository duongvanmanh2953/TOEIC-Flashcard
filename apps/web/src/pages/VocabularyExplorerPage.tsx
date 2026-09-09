import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Search,
  Bookmark,
  Sparkles,
  ExternalLink,
  Filter,
  Layers,
  Heart,
} from 'lucide-react';
import { SpeechButton } from '../components/common/SpeechButton';
import { ModalPortal } from '../components/common/ModalPortal';
import { CustomDropdown } from '../components/common/CustomDropdown';
import { idbSetCache, idbGetCache, idbSaveWords, idbGetWords } from '../lib/idb';

export const VocabularyExplorerPage: React.FC = () => {
  const navigate = useNavigate();
  const { isGuest, promptLogin } = useAuth();
  const [words, setWords] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCefr, setSelectedCefr] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState<any | null>(null);

  // Load Topics with IndexedDB caching
  useEffect(() => {
    idbGetCache('vocab_topics').then((cachedTopics) => {
      if (cachedTopics) setTopics(cachedTopics);
    });

    api.get('/vocabulary/topics').then((res: any) => {
      if (res?.success) {
        setTopics(res.data);
        idbSetCache('vocab_topics', res.data, 24 * 3600 * 1000);
      }
    });
  }, []);

  // Fetch Vocabulary with search & filters (IndexedDB cache-first + live sync)
  useEffect(() => {
    const fetchVocab = async () => {
      setLoading(true);
      const cacheKey = `vocab_p${page}_${search}_${selectedCefr}_${selectedTopic}`;

      // 1. Check IndexedDB cache first for instant 0ms render
      const cached = await idbGetCache(cacheKey);
      if (cached) {
        setWords(cached.items);
        setTotalPages(cached.totalPages);
        setLoading(false);
      }

      try {
        const params: any = { page, limit: 18 };
        if (search) params.search = search;
        if (selectedCefr) params.cefrLevel = selectedCefr;
        if (selectedTopic) params.topic = selectedTopic;

        const res: any = await api.get('/vocabulary', { params });
        if (res?.success) {
          // Restore any guest favorites from localStorage
          const guestFavs: string[] = JSON.parse(
            localStorage.getItem('vocabflow_guest_favorites') || '[]'
          );
          const mappedItems = (res.data?.items || res.data || []).map((w: any) => ({
            ...w,
            userProgress: {
              ...w.userProgress,
              isFavorite: w.userProgress?.isFavorite || guestFavs.includes(w.id),
            },
          }));
          setWords(mappedItems);
          const pages = res.meta?.pagination?.totalPages || 1;
          setTotalPages(pages);

          // Save to IndexedDB asynchronously
          idbSetCache(cacheKey, { items: mappedItems, totalPages: pages }, 30 * 60 * 1000);
          idbSaveWords(mappedItems);
        }
      } catch (err) {
        console.error('Failed to load vocabulary', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchVocab, 200);
    return () => clearTimeout(timer);
  }, [search, selectedCefr, selectedTopic, page]);

  const playAudio = (url?: string, text?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (url) {
      new Audio(url).play().catch(() => {});
    } else if (text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleToggleFavorite = async (wordId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (isGuest) {
      const guestFavs: string[] = JSON.parse(
        localStorage.getItem('vocabflow_guest_favorites') || '[]'
      );
      const targetWord = words.find((w) => w.id === wordId);
      const isAlready = guestFavs.includes(wordId);
      const updated = isAlready ? guestFavs.filter((id) => id !== wordId) : [...guestFavs, wordId];
      localStorage.setItem('vocabflow_guest_favorites', JSON.stringify(updated));

      setWords((prev) =>
        prev.map((w) =>
          w.id === wordId
            ? {
                ...w,
                userProgress: {
                  ...w.userProgress,
                  isFavorite: !isAlready,
                },
              }
            : w,
        ),
      );

      promptLogin(`Lưu từ vựng "${targetWord?.word || ''}" vào mục Yêu thích ❤️`);
      return;
    }

    try {
      await api.post(`/vocabulary/${wordId}/favorite`);
      setWords((prev) =>
        prev.map((w) =>
          w.id === wordId
            ? {
                ...w,
                userProgress: {
                  ...w.userProgress,
                  isFavorite: !w.userProgress?.isFavorite,
                },
              }
            : w,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Flashcard Study CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-snug">
            Thư viện Từ vựng TOEIC & CEFR
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Khám phá 600+ từ vựng chuẩn hóa theo chủ đề thực chiến, phân tầng từ A2 đến C1
          </p>
        </div>

        <button
          onClick={() => navigate('/review' + (selectedTopic ? `?topic=${selectedTopic}` : ''))}
          className="btn-glass-primary !shadow-none px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition self-start md:self-auto"
        >
          <Sparkles className="w-4 h-4 fill-white" />
          <span>Học Flashcard {selectedTopic ? `Chủ đề ${selectedTopic}` : 'bộ từ này'}</span>
        </button>
      </div>

      {/* Quick Topic Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => {
            setSelectedTopic('');
            setPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
            selectedTopic === ''
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          Tất cả chủ đề
        </button>
        {['Business', 'Finance', 'Travel', 'Technology', 'Daily'].map((slug) => (
          <button
            key={slug}
            onClick={() => {
              setSelectedTopic(slug);
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              selectedTopic === slug
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            {slug}
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm kiếm theo từ tiếng Anh, nghĩa tiếng Việt hoặc định nghĩa..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          />
        </div>

        {/* CEFR Level Custom Dropdown */}
        <CustomDropdown
          value={selectedCefr}
          onChange={(val) => {
            setSelectedCefr(val);
            setPage(1);
          }}
          options={[
            { value: '', label: 'Tất cả cấp độ CEFR' },
            { value: 'A2', label: 'A2 — Sơ cấp', badge: 'A2' },
            { value: 'B1', label: 'B1 — Trung cấp', badge: 'B1' },
            { value: 'B2', label: 'B2 — Trung cao cấp', badge: 'B2' },
            { value: 'C1', label: 'C1 — Nâng cao', badge: 'C1' },
          ]}
          className="w-full sm:w-56 shrink-0"
        />

        {/* Topic Custom Dropdown */}
        <CustomDropdown
          value={selectedTopic}
          onChange={(val) => {
            setSelectedTopic(val);
            setPage(1);
          }}
          options={[
            { value: '', label: 'Tất cả chủ đề' },
            ...topics.map((t) => ({
              value: t.slug,
              label: t.name,
              badge: t._count?.items || 0,
            })),
          ]}
          className="w-full sm:w-60 shrink-0"
        />
      </div>

      {/* Vocabulary Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      ) : words.length === 0 ? (
        <div className="text-center py-20 text-slate-400 space-y-2">
          <Layers className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
          <p className="text-base font-medium">Không tìm thấy từ vựng nào khớp với bộ lọc.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {words.map((item) => {
            const isFav = item.userProgress?.isFavorite;
            const primaryMeaning = item.meanings[0]?.meaning || item.shortDefinition || item.definition;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedWord(item)}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-brand-500/[0.08] dark:bg-brand-500/[0.14] text-brand-600 dark:text-brand-300 border border-brand-400/30">
                        {item.cefrLevel}
                      </span>
                      {item.partOfSpeech && (
                        <span className="text-xs tabular-nums text-slate-400">{item.partOfSpeech}</span>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleToggleFavorite(item.id, e)}
                      className={`p-1.5 rounded-lg transition ${
                        isFav
                          ? 'text-rose-500 fill-rose-500'
                          : 'text-slate-300 dark:text-slate-600 hover:text-rose-400'
                      }`}
                      title={isFav ? 'Bỏ yêu thích' : 'Lưu vào từ yêu thích'}
                    >
                      <Bookmark className={`w-4 h-4 ${isFav ? 'fill-rose-500' : ''}`} />
                    </button>
                  </div>

                  <h3 className="text-xl font-bold group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">
                    {item.word}
                  </h3>
                  {item.pronunciation && (
                    <p className="text-xs tabular-nums text-slate-400 mt-0.5">{item.pronunciation}</p>
                  )}

                  <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200 line-clamp-2">
                    {primaryMeaning}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="truncate max-w-[160px]">
                    {item.topicItems[0]?.topic?.name || 'General Business'}
                  </span>
                  <SpeechButton text={item.word} showSlowOption={false} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 text-xs font-bold"
          >
            Trang trước
          </button>
          <span className="text-xs font-bold text-slate-500 px-3">
            Trang {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 text-xs font-bold"
          >
            Trang sau
          </button>
        </div>
      )}

      {/* Word Detail Modal — ModalPortal to document.body */}
      <ModalPortal isOpen={Boolean(selectedWord)} onClose={() => setSelectedWord(null)}>
        {selectedWord && (
          <div
            className="m-auto relative max-w-2xl w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-brand-500/[0.08] dark:bg-brand-500/[0.14] text-brand-600 dark:text-brand-300 border border-brand-400/30">
                  {selectedWord.cefrLevel}
                </span>
                <span className="text-xs tabular-nums text-slate-400">{selectedWord.partOfSpeech}</span>
              </div>
              <button
                onClick={() => setSelectedWord(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">{selectedWord.word}</h2>
                <p className="text-sm tabular-nums text-slate-400">{selectedWord.pronunciation}</p>
              </div>
              <SpeechButton text={selectedWord.word} showSlowOption={true} />
            </div>

            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Nghĩa Tiếng Việt
                </h4>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedWord.meaningVi}
                </p>
              </div>

              {selectedWord.examples && selectedWord.examples.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ví Dụ Ngữ Cảnh</h4>
                  <p className="text-xs sm:text-sm font-medium italic text-slate-700 dark:text-slate-300">
                    "{selectedWord.examples[0].sentence}"
                  </p>
                  {selectedWord.examples[0].translation && (
                    <p className="text-xs text-slate-500">
                      🇻🇳 "{selectedWord.examples[0].translation}"
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setSelectedWord(null);
                window.location.href = `/ai-tutor?word=${selectedWord.word}`;
              }}
              className="btn-glass-primary w-full !py-3 text-xs gap-2"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              <span>Hỏi Gia Sư AI giải thích sâu từ này</span>
            </button>
          </div>
        )}
      </ModalPortal>
    </div>
  );
};
