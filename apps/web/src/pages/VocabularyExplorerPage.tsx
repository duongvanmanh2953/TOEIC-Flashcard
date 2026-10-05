import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  RotateCcw,
  Sliders,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { SpeechButton } from '../components/common/SpeechButton';
import { ModalPortal } from '../components/common/ModalPortal';
import { CustomDropdown } from '../components/common/CustomDropdown';
import { idbSetCache, idbGetCache, idbSaveWords } from '../lib/idb';
import { audioEngine } from '../lib/audioEngine';
import { useScrollLoad } from '../hooks/useScrollLoad';
import { CountryFlag } from '../components/language/CountryFlag';
import { useLearningContext } from '../contexts/LearningContext';

export const VocabularyExplorerPage: React.FC = () => {
  const navigate = useNavigate();
  const { isGuest } = useAuth();
  const { activeLanguage, switchLanguage, availableLanguages } = useLearningContext();
  const [words, setWords] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCefr, setSelectedCefr] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [scrollMode, setScrollMode] = useState<'infinite' | 'paged'>('infinite');
  const [selectedWord, setSelectedWord] = useState<any | null>(null);

  // Virtual batching on current words list
  const { visibleItems, sentinelRef, displayCount } = useScrollLoad({
    items: words,
    initialBatch: 24,
    batchSize: 18,
    resetDependencies: [search, selectedCefr, selectedTopic, scrollMode, activeLanguage.id],
  });

  // Load Topics from API with IndexedDB caching
  useEffect(() => {
    idbGetCache(`vocab_topics_${activeLanguage.id}`).then((cachedTopics) => {
      if (cachedTopics) setTopics(cachedTopics);
    });

    api.get('/vocabulary/topics', { params: { languageId: activeLanguage.id } }).then((res: any) => {
      if (res?.success && res.data) {
        setTopics(res.data);
        idbSetCache(`vocab_topics_${activeLanguage.id}`, res.data, 24 * 3600 * 1000);
      }
    }).catch(() => {});
  }, [activeLanguage.id]);

  // Fetch Vocabulary Page from real database
  const fetchVocabPage = useCallback(
    async (targetPage: number, append: boolean = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setLoadError(null);

      const cacheKey = `vocab_${activeLanguage.id}_p${targetPage}_${search}_${selectedCefr}_${selectedTopic}`;

      // Check cache only for initial page 1 to allow 0ms start, but only if cached items exist
      if (targetPage === 1 && !append) {
        const cached = await idbGetCache(cacheKey);
        if (cached?.items && Array.isArray(cached.items) && cached.items.length > 0) {
          setWords(cached.items);
          setTotalPages(cached.totalPages || 1);
          setTotalCount(cached.totalCount || cached.items.length);
          setLoading(false);
        }
      }

      try {
        const params: any = { page: targetPage, limit: 18, languageId: activeLanguage.id };
        if (search.trim()) params.search = search.trim();
        if (selectedCefr) params.cefrLevel = selectedCefr;
        if (selectedTopic) params.topic = selectedTopic;

        const res: any = await api.get('/vocabulary', { params });
        if (res?.success) {
          const guestFavs: string[] = JSON.parse(
            localStorage.getItem('vocabflow_guest_favorites') || '[]'
          );
          const rawItems = res.data?.items || res.data || [];
          const mappedItems = rawItems.map((w: any) => ({
            ...w,
            userProgress: {
              ...w.userProgress,
              isFavorite: w.userProgress?.isFavorite || guestFavs.includes(w.id),
            },
          }));

          const count = res.meta?.pagination?.total ?? res.data?.pagination?.total ?? mappedItems.length;
          const pages = res.meta?.pagination?.totalPages ?? res.data?.pagination?.totalPages ?? 1;

          setTotalCount(count);
          setTotalPages(pages);

          if (append) {
            setWords((prev) => {
              const existingIds = new Set(prev.map((i) => i.id));
              const newItems = mappedItems.filter((i: any) => !existingIds.has(i.id));
              return [...prev, ...newItems];
            });
          } else {
            setWords(mappedItems);
            idbSetCache(cacheKey, { items: mappedItems, totalPages: pages, totalCount: count }, 15 * 60 * 1000);
            idbSaveWords(mappedItems);
          }
        } else {
          setLoadError(res?.message || 'Không thể tải danh sách từ vựng.');
        }
      } catch (err: any) {
        console.error('Failed to load vocabulary', err);
        setLoadError(err?.response?.data?.message || 'Lỗi kết nối máy chủ khi tải từ vựng.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [search, selectedCefr, selectedTopic, activeLanguage.id]
  );

  // Trigger initial fetch when search or filter parameters change
  useEffect(() => {
    setPage(1);
    const timer = setTimeout(() => {
      fetchVocabPage(1, false);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchVocabPage]);

  // Load next page in infinite scroll mode
  const handleLoadNextPage = useCallback(() => {
    if (page < totalPages && !loadingMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchVocabPage(nextPage, true);
    }
  }, [page, totalPages, loadingMore, loading, fetchVocabPage]);

  // When virtual window expands to end of current words array in infinite mode, trigger next page
  useEffect(() => {
    if (scrollMode === 'infinite' && displayCount >= words.length && page < totalPages && !loadingMore && !loading) {
      handleLoadNextPage();
    }
  }, [displayCount, words.length, page, totalPages, loadingMore, loading, scrollMode, handleLoadNextPage]);

  const playAudio = (url?: string, text?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    audioEngine.playWord(text || '', { audioUrl: url, lang: activeLanguage?.speechLocale || activeLanguage?.id });
  };

  const handleToggleFavorite = async (wordId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (isGuest) {
      const guestFavs: string[] = JSON.parse(
        localStorage.getItem('vocabflow_guest_favorites') || '[]'
      );
      const isFav = guestFavs.includes(wordId);
      const updated = isFav ? guestFavs.filter((id) => id !== wordId) : [...guestFavs, wordId];
      localStorage.setItem('vocabflow_guest_favorites', JSON.stringify(updated));

      setWords((prev) =>
        prev.map((w) =>
          w.id === wordId
            ? { ...w, userProgress: { ...w.userProgress, isFavorite: !isFav } }
            : w
        )
      );
      return;
    }

    try {
      const res: any = await api.post(`/vocabulary/${wordId}/favorite`);
      if (res?.success) {
        setWords((prev) =>
          prev.map((w) =>
            w.id === wordId
              ? {
                  ...w,
                  userProgress: {
                    ...w.userProgress,
                    isFavorite: res.data?.isFavorite ?? !w.userProgress?.isFavorite,
                  },
                }
              : w
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefresh = async () => {
    const cacheKey = `vocab_${activeLanguage.id}_p1_${search}_${selectedCefr}_${selectedTopic}`;
    await idbSetCache(cacheKey, null, 0).catch(() => {});
    fetchVocabPage(1, false);
  };

  const itemsToRender = scrollMode === 'infinite' ? visibleItems : words;

  return (
    <div className="space-y-6">
      {/* Header with Flashcard Study CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-snug">
              Thư viện Từ vựng {activeLanguage?.name ? `(${activeLanguage.name})` : ''}
            </h2>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500/[0.12] text-brand-600 dark:text-brand-300 border border-brand-500/20">
              <CountryFlag countryCode={activeLanguage.countryCode || activeLanguage.id} className="w-3.5 h-2.5 rounded-xs" />
              <span>{activeLanguage.name}</span>
              <span>•</span>
              <span>{totalCount.toLocaleString('vi-VN')} từ</span>
            </div>
            {/* Quick language selector */}
            <div className="relative inline-block text-xs">
              <select
                value={activeLanguage.id}
                onChange={(e) => switchLanguage(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-500"
                aria-label="Chọn không gian ngôn ngữ"
              >
                {availableLanguages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Kho dữ liệu chuẩn hóa phân tầng từ A2 đến C1, đồng bộ dữ liệu thật thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            title="Làm mới và xóa bộ nhớ đệm"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Scroll Mode Switcher */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setScrollMode('infinite')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                scrollMode === 'infinite'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cuộn vô tận
            </button>
            <button
              onClick={() => {
                setScrollMode('paged');
                fetchVocabPage(page, false);
              }}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                scrollMode === 'paged'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Phân trang
            </button>
          </div>

          <button
            onClick={() => navigate('/review' + (selectedTopic ? `?topic=${selectedTopic}` : ''))}
            className="btn-glass-primary !shadow-none px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4 fill-white" />
            <span>Ôn {selectedTopic ? `chủ đề ${selectedTopic}` : 'kho này'}</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm kiếm theo từ, nghĩa tiếng Việt hoặc định nghĩa..."
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
            { value: '', label: 'Tất cả cấp độ' },
            { value: 'A1', label: 'A1 — Căn bản', badge: 'A1' },
            { value: 'A2', label: 'A2 — Sơ cấp', badge: 'A2' },
            { value: 'B1', label: 'B1 — Trung cấp', badge: 'B1' },
            { value: 'B2', label: 'B2 — Trung cao cấp', badge: 'B2' },
            { value: 'C1', label: 'C1 — Nâng cao', badge: 'C1' },
            { value: 'C2', label: 'C2 — Thành thạo', badge: 'C2' },
          ]}
          className="w-full sm:w-52 shrink-0"
        />

        {/* Topic Custom Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 hidden sm:inline">Chủ đề:</span>
          <CustomDropdown
            value={selectedTopic}
            onChange={(val) => {
              setSelectedTopic(val);
              setPage(1);
            }}
            placeholder="Tất cả chủ đề"
            searchPlaceholder="Tìm kiếm chủ đề..."
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
      </div>

      {/* Error Message */}
      {loadError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            onClick={() => fetchVocabPage(page, false)}
            className="px-3 py-1 rounded-lg bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Vocabulary Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      ) : words.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 max-w-lg mx-auto shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Không có từ vựng nào trong không gian {activeLanguage.name} {activeLanguage.flag}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Bạn đang xem từ điển thuộc không gian ngôn ngữ <strong>{activeLanguage.name}</strong>.
              Nếu bạn vừa thêm kho từ tiếng Hàn hoặc ngôn ngữ khác, hãy chọn đúng không gian ngôn ngữ để xem đầy đủ từ vựng.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={handleRefresh}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tải lại dữ liệu</span>
            </button>
            {activeLanguage.id !== 'ko' && (
              <button
                onClick={() => switchLanguage('ko')}
                className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>🇰🇷 Chuyển sang Tiếng Hàn (470 từ)</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {itemsToRender.map((item) => {
            const isFav = item.userProgress?.isFavorite;
            const primaryMeaning = item.meanings?.[0]?.meaning || item.shortDefinition || item.definition || 'Nghĩa từ vựng';

            return (
              <div
                key={item.id}
                onClick={() => setSelectedWord(item)}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:shadow-md transition cursor-pointer flex flex-col justify-between group cv-auto-card"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-brand-500/[0.08] dark:bg-brand-500/[0.14] text-brand-600 dark:text-brand-300 border border-brand-400/30">
                        {item.cefrLevel || 'B1'}
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
                    {item.topicItems?.[0]?.topic?.name || item.topic || 'General Business'}
                  </span>
                  <SpeechButton
                    text={item.word}
                    audioUrl={item.audioUrl}
                    lang={activeLanguage?.speechLocale || activeLanguage?.id}
                    showSlowOption={false}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Infinite Scroll Sentinel & Loader */}
      {scrollMode === 'infinite' && words.length > 0 && (
        <div ref={sentinelRef} className="py-6 text-center text-xs text-slate-400">
          {loadingMore ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              <span>Đang tải thêm từ vựng...</span>
            </div>
          ) : page < totalPages ? (
            <button
              onClick={handleLoadNextPage}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition"
            >
              Tải thêm từ vựng (Trang {page + 1}/{totalPages})
            </button>
          ) : (
            <p className="text-slate-400 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Đã hiển thị toàn bộ {totalCount.toLocaleString('vi-VN')} từ vựng.</span>
            </p>
          )}
        </div>
      )}

      {/* Pagination Bar (When paged mode is active) */}
      {scrollMode === 'paged' && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => {
              const prev = Math.max(1, page - 1);
              setPage(prev);
              fetchVocabPage(prev, false);
            }}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 text-xs font-bold"
          >
            Trang trước
          </button>
          <span className="text-xs font-bold text-slate-500 px-3">
            Trang {page} / {totalPages} ({totalCount} từ)
          </span>
          <button
            onClick={() => {
              const next = Math.min(totalPages, page + 1);
              setPage(next);
              fetchVocabPage(next, false);
            }}
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
            className="m-auto relative max-w-2xl w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6 shadow-2xl max-h-[calc(100dvh-3rem)] sm:max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-brand-500/[0.08] dark:bg-brand-500/[0.14] text-brand-600 dark:text-brand-300 border border-brand-400/30">
                  {selectedWord.cefrLevel || 'B1'}
                </span>
                <span className="text-xs tabular-nums text-slate-400">{selectedWord.partOfSpeech || 'n.'}</span>
              </div>
              <button
                onClick={() => setSelectedWord(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            <div className="flex items-baseline justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{selectedWord.word}</h2>
                {selectedWord.pronunciation && (
                  <p className="text-sm tabular-nums text-slate-400 mt-0.5">{selectedWord.pronunciation}</p>
                )}
              </div>
              <SpeechButton
                text={selectedWord.word}
                audioUrl={selectedWord.audioUrl}
                lang={activeLanguage?.speechLocale || activeLanguage?.id}
                showSlowOption={true}
              />
            </div>

            <div className="space-y-3 pt-2">
              {/* Vietnamese Primary Meaning */}
              <div className="p-4 rounded-2xl bg-emerald-500/[0.08] dark:bg-emerald-500/10 border border-emerald-500/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
                  Nghĩa Tiếng Việt
                </h4>
                <p className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400 leading-snug">
                  {selectedWord.meaning ||
                    selectedWord.shortDefinition ||
                    selectedWord.definition ||
                    selectedWord.meanings?.[0]?.meaning ||
                    'Nghĩa từ vựng'}
                </p>
              </div>

              {/* English Definition if distinct */}
              {selectedWord.definition &&
                selectedWord.definition !== (selectedWord.shortDefinition || selectedWord.meanings?.[0]?.meaning) && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Định Nghĩa Chi Tiết
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {selectedWord.definition}
                    </p>
                  </div>
                )}

              {/* Example sentence & translation */}
              {(selectedWord.examples?.length > 0 || selectedWord.example) && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ví Dụ Ngữ Cảnh</h4>
                  <p className="text-xs sm:text-sm font-medium italic text-slate-700 dark:text-slate-200">
                    "{selectedWord.examples?.[0]?.sentence || selectedWord.example}"
                  </p>
                  {(selectedWord.examples?.[0]?.translation || selectedWord.exampleTranslation) && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <CountryFlag languageId="vi" size="xs" />
                      <span>"{selectedWord.examples?.[0]?.translation || selectedWord.exampleTranslation}"</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setSelectedWord(null);
                window.location.href = `/ai-tutor?word=${encodeURIComponent(selectedWord.word)}`;
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
