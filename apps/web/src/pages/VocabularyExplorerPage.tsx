import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Award,
  BookOpen,
  PenTool,
  ArrowRight,
  Compass,
  GraduationCap,
  ChevronRight,
  BarChart2,
  Volume2,
  X,
} from 'lucide-react';
import { SpeechButton } from '../components/common/SpeechButton';
import { ModalPortal } from '../components/common/ModalPortal';
import { CustomDropdown } from '../components/common/CustomDropdown';
import { idbSetCache, idbGetCache, idbSaveWords, idbGetWords } from '../lib/idb';
import { audioEngine } from '../lib/audioEngine';
import { useScrollLoad } from '../hooks/useScrollLoad';
import { CountryFlag } from '../components/language/CountryFlag';
import { useLearningContext } from '../contexts/LearningContext';
import {
  getLanguageStandard,
  getCertificatesForLanguage,
  getDefaultCertificateForLanguage,
  mapToCefrEquivalent,
  getCategoriesForLanguage,
} from '../config/languageStandards';
import { getSeedDecksForLanguage } from '../data/seedDecks';
import { isHandwritingSupportedForLanguage } from '../config/languages';

export const VocabularyExplorerPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isGuest } = useAuth();
  const { activeLanguage, switchLanguage, availableLanguages } = useLearningContext();

  // Language Standards & Certificates
  const languageStandard = useMemo(() => getLanguageStandard(activeLanguage.id), [activeLanguage.id]);
  const certificates = useMemo(() => getCertificatesForLanguage(activeLanguage.id), [activeLanguage.id]);
  const defaultCert = useMemo(() => getDefaultCertificateForLanguage(activeLanguage.id), [activeLanguage.id]);

  const [selectedCertificateId, setSelectedCertificateId] = useState<string>(
    searchParams.get('cert') || defaultCert.id
  );
  const [selectedLevelId, setSelectedLevelId] = useState<string>(
    searchParams.get('level') || ''
  );
  const [selectedTopic, setSelectedTopic] = useState<string>(
    searchParams.get('topic') || ''
  );
  const [search, setSearch] = useState<string>('');

  const [words, setWords] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [scrollMode, setScrollMode] = useState<'infinite' | 'paged'>('infinite');
  const [selectedWord, setSelectedWord] = useState<any | null>(null);

  // Sync certificate when language switches
  useEffect(() => {
    const def = getDefaultCertificateForLanguage(activeLanguage.id);
    setSelectedCertificateId(def.id);
    setSelectedLevelId('');
    setSelectedTopic('');
    setPage(1);
  }, [activeLanguage.id]);

  // Active certificate and levels
  const activeCertificate = useMemo(() => {
    return certificates.find((c) => c.id === selectedCertificateId) || certificates[0] || defaultCert;
  }, [certificates, selectedCertificateId, defaultCert]);

  const activeLevels = useMemo(() => {
    return activeCertificate.levels || [];
  }, [activeCertificate]);

  const activeLevelObj = useMemo(() => {
    if (!selectedLevelId || selectedLevelId === 'ALL') return null;
    return activeLevels.find((lvl) => lvl.id === selectedLevelId || lvl.badge === selectedLevelId);
  }, [activeLevels, selectedLevelId]);

  const handwritingAvailable = useMemo(() => {
    return isHandwritingSupportedForLanguage(activeLanguage.id);
  }, [activeLanguage.id]);

  // Virtual batching on current words list
  const { visibleItems, sentinelRef, displayCount } = useScrollLoad({
    items: words,
    initialBatch: 24,
    batchSize: 18,
    resetDependencies: [search, selectedLevelId, selectedCertificateId, selectedTopic, scrollMode, activeLanguage.id],
  });

  // Load Topics from API with language isolation & native standards fallback
  useEffect(() => {
    const nativeCategories = getCategoriesForLanguage(activeLanguage.id).map((c) => ({
      id: c.id,
      slug: c.id,
      name: c.name,
      _count: { items: 0 },
    }));

    idbGetCache(`vocab_topics_${activeLanguage.id}`).then((cachedTopics) => {
      if (cachedTopics && Array.isArray(cachedTopics) && cachedTopics.length > 0) {
        setTopics(cachedTopics);
      } else {
        setTopics(nativeCategories);
      }
    });

    api
      .get('/vocabulary/topics', { params: { languageId: activeLanguage.id } })
      .then((res: any) => {
        const serverTopics = res?.success && Array.isArray(res.data) ? res.data : [];
        const validTopics = serverTopics.filter((t: any) => !t._count || t._count.items > 0);
        const finalTopics = validTopics.length > 0 ? validTopics : nativeCategories;
        setTopics(finalTopics);
        idbSetCache(`vocab_topics_${activeLanguage.id}`, finalTopics, 24 * 3600 * 1000);
      })
      .catch(() => {
        setTopics(nativeCategories);
      });
  }, [activeLanguage.id]);

  // Fetch Vocabulary Page with standard level mapping
  const fetchVocabPage = useCallback(
    async (targetPage: number, append: boolean = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setLoadError(null);

      const mappedCefr = activeLevelObj?.cefrEquivalent || mapToCefrEquivalent(selectedLevelId);
      const cacheKey = `vocab_${activeLanguage.id}_cert_${selectedCertificateId}_lvl_${selectedLevelId || 'ALL'}_p${targetPage}_${search}_${selectedTopic}`;

      // Check cache for initial page 1
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
        if (mappedCefr && mappedCefr !== 'ALL' && ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(mappedCefr)) {
          params.cefrLevel = mappedCefr;
        }
        if (selectedTopic) params.topic = selectedTopic;

        const res: any = await api.get('/vocabulary', { params });
        if (res?.success) {
          const guestFavs: string[] = JSON.parse(
            localStorage.getItem('vocabflow_guest_favorites') || '[]'
          );
          const rawItems = res.data?.items || res.data || [];
          let mappedItems = rawItems.map((w: any) => ({
            ...w,
            userProgress: {
              ...w.userProgress,
              isFavorite: w.userProgress?.isFavorite || guestFavs.includes(w.id),
            },
          }));

          // Multi-language resilient fallback: If server has 0 database words for this language, load curated starter seed words
          if (mappedItems.length === 0 && !append) {
            const seedPacks = getSeedDecksForLanguage(activeLanguage.id);
            const seedWords = seedPacks.flatMap((p) =>
              p.words.map((w, idx) => ({
                id: `seed_${activeLanguage.id}_${p.id}_${idx}`,
                word: w.word,
                languageId: activeLanguage.id,
                definition: w.definition || w.meaning,
                shortDefinition: w.meaning,
                meaningVi: w.meaning,
                pronunciation: w.pronunciation || w.phonetic,
                phonetic: w.phonetic,
                partOfSpeech: w.partOfSpeech || 'noun',
                cefrLevel: w.cefrLevel || activeLevelObj?.badge || 'HSK 1',
                topic: w.topic || p.title,
                example: w.example,
                exampleTranslation: w.exampleTranslation,
                pinyin: w.pinyin,
                romaji: w.romaji,
                transliteration: w.transliteration,
                meanings: [{ meaning: w.meaning }],
                examples: w.example ? [{ sentence: w.example, translation: w.exampleTranslation }] : [],
                userProgress: { isFavorite: guestFavs.includes(`seed_${activeLanguage.id}_${p.id}_${idx}`) },
              }))
            );

            let filtered = seedWords;
            if (search.trim()) {
              const q = search.trim().toLowerCase();
              filtered = filtered.filter(
                (w) =>
                  w.word.toLowerCase().includes(q) ||
                  w.meaningVi.toLowerCase().includes(q) ||
                  (w.pinyin && w.pinyin.toLowerCase().includes(q)) ||
                  (w.romaji && w.romaji.toLowerCase().includes(q))
              );
            }

            if (selectedLevelId && selectedLevelId !== 'ALL') {
              const badge = (activeLevelObj?.badge || selectedLevelId).toLowerCase();
              const id = (activeLevelObj?.id || selectedLevelId).toLowerCase();
              const cefr = (activeLevelObj?.cefrEquivalent || mappedCefr || '').toLowerCase();
              filtered = filtered.filter((w) => {
                const wLvl = (w.cefrLevel || '').toLowerCase();
                return (
                  wLvl === badge ||
                  wLvl === id ||
                  wLvl === cefr ||
                  (badge && wLvl.includes(badge)) ||
                  (cefr && wLvl.includes(cefr))
                );
              });
            }

            if (selectedTopic) {
              const tq = selectedTopic.toLowerCase();
              filtered = filtered.filter((w) => w.topic.toLowerCase().includes(tq));
            }

            if (filtered.length > 0) {
              mappedItems = filtered;
            }
          }

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
        console.warn('Failed to load vocabulary (offline check):', err);
        try {
          const localWords = await idbGetWords(user?.id, activeLanguage.id);
          if (localWords && localWords.length > 0) {
            setWords(localWords);
            setTotalPages(1);
            setTotalCount(localWords.length);
            setLoadError(null);
          } else {
            setLoadError('Đang ở chế độ ngoại tuyến. Hãy kết nối Internet để tải thêm từ vựng mới.');
          }
        } catch {
          setLoadError('Đang ở chế độ ngoại tuyến.');
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [search, selectedLevelId, selectedCertificateId, activeLevelObj, selectedTopic, activeLanguage.id]
  );

  // Trigger initial fetch when filter parameters change
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

  // Infinite scroll trigger
  useEffect(() => {
    if (scrollMode === 'infinite' && displayCount >= words.length && page < totalPages && !loadingMore && !loading) {
      handleLoadNextPage();
    }
  }, [displayCount, words.length, page, totalPages, loadingMore, loading, scrollMode, handleLoadNextPage]);

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
    const cacheKey = `vocab_${activeLanguage.id}_cert_${selectedCertificateId}_lvl_${selectedLevelId || 'ALL'}_p1_${search}_${selectedTopic}`;
    await idbSetCache(cacheKey, null, 0).catch(() => {});
    fetchVocabPage(1, false);
  };

  // Start Review Session for Selected Level / Standard
  const handleStartLevelReview = (mode?: 'handwriting') => {
    const targetLevel = activeLevelObj?.badge || selectedLevelId || activeCertificate.name;
    const params = new URLSearchParams();
    if (targetLevel) params.set('level', targetLevel);
    if (activeLanguage?.id) params.set('languageId', activeLanguage.id);
    if (selectedTopic) params.set('topic', selectedTopic);
    if (mode) params.set('mode', mode);

    navigate(`/review?${params.toString()}`);
  };

  const itemsToRender = scrollMode === 'infinite' ? visibleItems : words;

  // Active level title for display
  const currentLevelLabel = activeLevelObj
    ? activeLevelObj.name
    : selectedLevelId && selectedLevelId !== 'ALL'
      ? `Cấp độ ${selectedLevelId}`
      : `Tất cả cấp độ ${activeCertificate.name}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-snug">
              Kho Từ Vựng {activeLanguage?.name ? `(${activeLanguage.name})` : ''}
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
            Kho dữ liệu chuẩn hóa theo chứng chỉ <strong>{activeCertificate.name}</strong>, đồng bộ thuật toán Spaced Repetition FSRS thời gian thực.
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

          {/* Quick Review Button in Header */}
          <button
            onClick={() => handleStartLevelReview()}
            className="btn-glass-primary !shadow-none px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4 fill-white" />
            <span>Ôn {activeLevelObj?.badge ? `cấp độ ${activeLevelObj.badge}` : 'kho từ'}</span>
          </button>
        </div>
      </div>

      {/* Certificate Selector (When Language has multiple certificates like HSK/TOCFL or TOEIC/IELTS) */}
      {certificates.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Chứng chỉ:</span>
          </span>
          {certificates.map((cert) => (
            <button
              key={cert.id}
              onClick={() => {
                setSelectedCertificateId(cert.id);
                setSelectedLevelId('');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                selectedCertificateId === cert.id
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-brand-500/50'
              }`}
            >
              <span>{cert.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Level Classification Tabs / Pills Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-brand-500" />
            <span>Phân loại theo cấp độ ({activeCertificate.name}):</span>
          </div>
          {selectedLevelId && (
            <button
              onClick={() => {
                setSelectedLevelId('');
                setPage(1);
              }}
              className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
            >
              Xem tất cả cấp độ
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">
          {/* All Levels Option */}
          <button
            onClick={() => {
              setSelectedLevelId('');
              setPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 shrink-0 ${
              !selectedLevelId || selectedLevelId === 'ALL'
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-brand-400/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tất cả ({activeCertificate.name})</span>
          </button>

          {/* Level Pills */}
          {activeLevels.map((lvl) => {
            const isSelected = selectedLevelId === lvl.id || selectedLevelId === lvl.badge;
            return (
              <button
                key={lvl.id}
                onClick={() => {
                  setSelectedLevelId(lvl.id);
                  setPage(1);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20 ring-2 ring-brand-500/30'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-brand-500/40 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                  }`}
                >
                  {lvl.badge}
                </span>
                <span>{lvl.name.split('(')[0].trim()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Elevated Active Level Banner / Quick Review Action Card */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 border border-brand-500/25 bg-gradient-to-br from-brand-500/[0.08] via-indigo-500/[0.04] to-slate-50 dark:from-brand-950/40 dark:via-slate-900/60 dark:to-slate-900/80 shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-brand-500 text-white shadow-xs">
                {activeLevelObj?.badge || activeCertificate.name}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {activeCertificate.fullName}
              </span>
              {activeLevelObj?.cefrEquivalent && (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                  Tương đương CEFR {activeLevelObj.cefrEquivalent}
                </span>
              )}
            </div>

            <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {currentLevelLabel}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {activeLevelObj?.description ||
                activeCertificate.description ||
                'Học và củng cố toàn diện kho từ vựng chuẩn hóa, cải thiện phản xạ ngữ cảnh và ghi nhớ dài hạn.'}
            </p>

            <div className="flex items-center gap-4 pt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <div className="flex items-center gap-1.5 font-medium">
                <BookOpen className="w-3.5 h-3.5 text-brand-500" />
                <span>
                  <strong>{totalCount.toLocaleString('vi-VN')}</strong> từ vựng khả dụng
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Thuật toán ngắt quãng FSRS</span>
              </div>
              {handwritingAvailable && (
                <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Hỗ trợ nhận dạng nét viết tay</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Review Navigation Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 self-start lg:self-center w-full sm:w-auto">
            <button
              onClick={() => handleStartLevelReview()}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 hover:from-brand-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              <span>Ôn tập cấp độ {activeLevelObj?.badge || activeCertificate.name}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {handwritingAvailable && (
              <button
                onClick={() => handleStartLevelReview('handwriting')}
                className="px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 font-bold text-xs shadow-xs hover:border-brand-500/40 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <PenTool className="w-3.5 h-3.5 text-emerald-500" />
                <span>Luyện viết {activeLanguage.id === 'zh' ? 'Hán tự' : activeLanguage.id === 'ja' ? 'Kanji' : 'chữ viết'} cấp độ này</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
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
            placeholder={`Tìm kiếm từ vựng ${activeLanguage.name}, nghĩa tiếng Việt hoặc phiên âm...`}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          />
        </div>

        {/* Level Dropdown (Quick select) */}
        <CustomDropdown
          value={selectedLevelId}
          onChange={(val) => {
            setSelectedLevelId(val);
            setPage(1);
          }}
          options={[
            { value: '', label: `Tất cả cấp độ (${activeCertificate.name})` },
            ...activeLevels.map((lvl) => ({
              value: lvl.id,
              label: lvl.name,
              badge: lvl.badge,
            })),
          ]}
          className="w-full sm:w-56 shrink-0"
        />

        {/* Topic Custom Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
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
            className="px-3 py-1 rounded-lg bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Vocabulary Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          <p className="text-xs text-slate-400">Đang tải danh sách từ vựng cấp độ...</p>
        </div>
      ) : words.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 max-w-lg mx-auto shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Chưa tìm thấy từ vựng phù hợp
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Không có từ vựng nào cho bộ lọc cấp độ <strong>{currentLevelLabel}</strong> trong không gian{' '}
              <strong>{activeLanguage.name}</strong>.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={() => {
                setSelectedLevelId('');
                setSelectedTopic('');
                setSearch('');
              }}
              className="px-3.5 py-2 rounded-xl bg-brand-500 text-white text-xs font-bold hover:bg-brand-600 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xem tất cả cấp độ</span>
            </button>
            <button
              onClick={handleRefresh}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Làm mới bộ nhớ</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {itemsToRender.map((item) => {
            const isFav = item.userProgress?.isFavorite;
            const primaryMeaning =
              item.meanings?.[0]?.meaning || item.shortDefinition || item.definition || 'Nghĩa từ vựng';
            const displayRomanization = item.pinyin || item.romaji || item.transliteration || item.pronunciation;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedWord(item)}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:shadow-md transition cursor-pointer flex flex-col justify-between group cv-auto-card"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-brand-500/[0.1] dark:bg-brand-500/[0.18] text-brand-600 dark:text-brand-300 border border-brand-400/30">
                        {item.cefrLevel || activeLevelObj?.badge || 'A1'}
                      </span>
                      {item.partOfSpeech && (
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          {item.partOfSpeech}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleToggleFavorite(item.id, e)}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        isFav
                          ? 'text-rose-500 fill-rose-500'
                          : 'text-slate-300 dark:text-slate-600 hover:text-rose-400'
                      }`}
                      title={isFav ? 'Bỏ yêu thích' : 'Lưu vào từ yêu thích'}
                    >
                      <Bookmark className={`w-4 h-4 ${isFav ? 'fill-rose-500' : ''}`} />
                    </button>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition tracking-tight">
                    {item.word}
                  </h3>

                  {displayRomanization && (
                    <p className="text-xs font-medium text-brand-600/80 dark:text-brand-400/80 mt-0.5">
                      {displayRomanization}
                    </p>
                  )}

                  <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200 line-clamp-2 leading-snug">
                    {primaryMeaning}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="truncate max-w-[150px]">
                    {item.topicItems?.[0]?.topic?.name || item.topic || activeCertificate.name}
                  </span>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {handwritingAvailable && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const targetLevel = item.cefrLevel || activeLevelObj?.badge || 'HSK 1';
                          navigate(`/review?level=${encodeURIComponent(targetLevel)}&languageId=${activeLanguage.id}&mode=handwriting`);
                        }}
                        title="Luyện viết chữ này"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition cursor-pointer"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <SpeechButton
                      text={item.word}
                      audioUrl={item.audioUrl}
                      lang={activeLanguage?.speechLocale || activeLanguage?.id}
                      showSlowOption={false}
                    />
                  </div>
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
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-600"></div>
              <span>Đang tải thêm từ vựng...</span>
            </div>
          ) : page < totalPages ? (
            <button
              onClick={handleLoadNextPage}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition cursor-pointer"
            >
              Tải thêm từ vựng (Trang {page + 1}/{totalPages})
            </button>
          ) : (
            <p className="text-slate-400 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Đã hiển thị toàn bộ {totalCount.toLocaleString('vi-VN')} từ vựng thuộc {currentLevelLabel}.</span>
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
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 text-xs font-bold cursor-pointer"
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
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 text-xs font-bold cursor-pointer"
          >
            Trang sau
          </button>
        </div>
      )}

      {/* Word Detail Modal */}
      <ModalPortal isOpen={Boolean(selectedWord)} onClose={() => setSelectedWord(null)}>
        {selectedWord && (
          <div
            className="m-auto relative max-w-2xl w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6 shadow-2xl max-h-[calc(100dvh-3rem)] sm:max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-brand-500/[0.08] dark:bg-brand-500/[0.14] text-brand-600 dark:text-brand-300 border border-brand-400/30">
                  {selectedWord.cefrLevel || activeLevelObj?.badge || 'A1'}
                </span>
                <span className="text-xs font-medium text-slate-400">{selectedWord.partOfSpeech || 'n.'}</span>
              </div>
              <button
                onClick={() => setSelectedWord(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex items-baseline justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{selectedWord.word}</h2>
                {(selectedWord.pinyin || selectedWord.romaji || selectedWord.pronunciation) && (
                  <p className="text-sm font-medium text-brand-600 dark:text-brand-400 mt-0.5">
                    {selectedWord.pinyin || selectedWord.romaji || selectedWord.pronunciation}
                  </p>
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
                      <CountryFlag countryCode="VN" className="w-3.5 h-2.5 rounded-xs" />
                      <span>"{selectedWord.examples?.[0]?.translation || selectedWord.exampleTranslation}"</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={() => {
                  setSelectedWord(null);
                  const targetLevel = selectedWord.cefrLevel || activeLevelObj?.badge || 'HSK 1';
                  navigate(`/review?level=${encodeURIComponent(targetLevel)}&languageId=${activeLanguage.id}`);
                }}
                className="btn-glass-primary flex-1 !py-3 text-xs gap-2"
              >
                <Sparkles className="w-4 h-4 fill-white" />
                <span>Ôn tập cấp độ {selectedWord.cefrLevel || activeLevelObj?.badge || ''}</span>
              </button>

              {handwritingAvailable && (
                <button
                  onClick={() => {
                    setSelectedWord(null);
                    const targetLevel = selectedWord.cefrLevel || activeLevelObj?.badge || 'HSK 1';
                    navigate(`/review?level=${encodeURIComponent(targetLevel)}&languageId=${activeLanguage.id}&mode=handwriting`);
                  }}
                  className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <PenTool className="w-4 h-4 text-emerald-500" />
                  <span>Luyện viết từ này</span>
                </button>
              )}
            </div>

            <button
              onClick={() => {
                setSelectedWord(null);
                window.location.href = `/ai-tutor?word=${encodeURIComponent(selectedWord.word)}`;
              }}
              className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Hỏi Gia Sư AI phân tích chuyên sâu từ này</span>
            </button>
          </div>
        )}
      </ModalPortal>
    </div>
  );
};
