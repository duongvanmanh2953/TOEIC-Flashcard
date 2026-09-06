import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { GlassCard } from '../components/common/GlassCard';
import { SpeechButton } from '../components/common/SpeechButton';
import { ModalPortal } from '../components/common/ModalPortal';
import { CustomDropdown } from '../components/common/CustomDropdown';
import * as XLSX from 'xlsx';
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
  Download,
  HardDrive,
  Database,
  FileSpreadsheet,
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

  const [cloneActionDeck, setCloneActionDeck] = useState<any | null>(null);
  const [cloningOnline, setCloningOnline] = useState(false);

  const handleCloneToWordBank = async (deck: any) => {
    setCloningOnline(true);
    try {
      const res: any = await api.post(`/community/decks/${deck.id}/clone`);
      if (res?.success) {
        setCloneSuccess(`Đã lưu thành công bộ từ "${deck.title}" vào Kho từ vựng cá nhân!`);
        fetchDecks();
        setCloneActionDeck(null);
        setTimeout(() => setCloneSuccess(null), 4000);
      }
    } catch (err: any) {
      alert(err?.message || 'Không thể clone bộ từ vào kho cá nhân.');
    } finally {
      setCloningOnline(false);
    }
  };

  const handleExportDeckToFile = (deck: any, format: 'xlsx' | 'csv' | 'json') => {
    try {
      const words = deck.words || [];
      const sanitizedTitle = (deck.title || 'bo-tu-vung')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_');

      if (format === 'json') {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(deck, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `${sanitizedTitle}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        setCloneSuccess(`Đã tải file JSON của bộ từ "${deck.title}" về máy thành công!`);
        setCloneActionDeck(null);
        setTimeout(() => setCloneSuccess(null), 4000);
        return;
      }

      // Format tabular data for Excel & CSV
      const rows = words.map((w: any, idx: number) => ({
        STT: idx + 1,
        'Từ vựng (Word)': w.word,
        'Phiên âm (Phonetic)': w.phonetic || '',
        'Ý nghĩa (Meaning)': w.meaning || '',
        'Ví dụ (Example)': w.example || '',
        'Chủ đề (Topic)': deck.category || '',
        'Cấp độ (CEFR)': deck.cefrLevel || '',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [
        { wch: 6 },
        { wch: 20 },
        { wch: 18 },
        { wch: 35 },
        { wch: 45 },
        { wch: 20 },
        { wch: 12 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Vocabulary_Deck');

      if (format === 'csv') {
        XLSX.writeFile(wb, `${sanitizedTitle}.csv`, { bookType: 'csv' });
      } else {
        XLSX.writeFile(wb, `${sanitizedTitle}.xlsx`, { bookType: 'xlsx' });
      }

      setCloneSuccess(`Đã tải file ${format.toUpperCase()} của bộ từ "${deck.title}" về máy tính thành công!`);
      setCloneActionDeck(null);
      setTimeout(() => setCloneSuccess(null), 4000);
    } catch (err: any) {
      alert('Không thể xuất file: ' + (err?.message || 'Đã có lỗi xảy ra.'));
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
                    onClick={() => setCloneActionDeck(deck)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Lưu / Tải về</span>
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Preview Deck Modal — ModalPortal to document.body */}
      <ModalPortal isOpen={Boolean(selectedDeck)} onClose={() => setSelectedDeck(null)}>
        {selectedDeck && (
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

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => {
                  const deck = selectedDeck;
                  setSelectedDeck(null);
                  setCloneActionDeck(deck);
                }}
                className="btn-glass-primary w-full !py-3 text-xs sm:text-sm gap-2"
              >
                <Copy className="w-4 h-4" />
                <span>Tùy chọn Lưu về Kho hoặc Tải file về máy</span>
              </button>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* DUAL CLONE ACTION MODAL: Lưu vào Kho từ vựng vs Tải file về máy tính */}
      <ModalPortal isOpen={Boolean(cloneActionDeck)} onClose={() => setCloneActionDeck(null)}>
        {cloneActionDeck && (
          <div
            className="m-auto relative max-w-lg w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold border border-indigo-200 dark:border-indigo-900 mb-2">
                  <Copy className="w-3 h-3" />
                  <span>Sao chép bộ từ vựng</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                  {cloneActionDeck.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Bộ từ gồm <strong className="text-indigo-600 dark:text-indigo-400">{cloneActionDeck.words?.length || 0} từ</strong> ({cloneActionDeck.category} • CEFR {cloneActionDeck.cefrLevel}). Bạn muốn lưu vào đâu?
                </p>
              </div>
              <button
                onClick={() => setCloneActionDeck(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition shrink-0"
              >
                ✕
              </button>
            </div>

            {/* TWO MAIN OPTIONS */}
            <div className="space-y-3.5">
              {/* Option 1: Save into personal online word bank */}
              <div
                onClick={() => handleCloneToWordBank(cloneActionDeck)}
                className="group p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/70 to-blue-50/50 dark:from-indigo-950/30 dark:to-blue-950/20 hover:border-indigo-400 dark:hover:border-indigo-700 cursor-pointer transition shadow-xs flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition">
                  <Database className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      Lưu vào Kho từ vựng của tôi (Online)
                    </h4>
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 shrink-0">
                      Khuyên dùng
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Tự động đồng bộ toàn bộ từ vào Kho từ vựng của bạn để kích hoạt thuật toán ôn tập thông minh (SRS) & Gia sư AI.
                  </p>
                  <div className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1">
                    <span>{cloningOnline ? 'Đang đồng bộ...' : 'Đồng bộ ngay vào tài khoản'}</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              </div>

              {/* Option 2: Export directly to computer as file */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Tải về máy tính (Offline File)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Xuất toàn bộ từ vựng, phiên âm, định nghĩa và ví dụ thành file lưu trữ trực tiếp trên thiết bị của bạn.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => handleExportDeckToFile(cloneActionDeck, 'xlsx')}
                    className="py-2 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>File Excel (.xlsx)</span>
                  </button>

                  <button
                    onClick={() => handleExportDeckToFile(cloneActionDeck, 'csv')}
                    className="py-2 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>File CSV</span>
                  </button>

                  <button
                    onClick={() => handleExportDeckToFile(cloneActionDeck, 'json')}
                    className="py-2 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-500" />
                    <span>File JSON</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* Create & Share Deck Modal — ModalPortal to document.body */}
      <ModalPortal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
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
                  <CustomDropdown
                    value={category}
                    onChange={(val) => setCategory(val)}
                    options={[
                      { value: 'Business English', label: 'Business English (Kinh doanh)' },
                      { value: 'Technology', label: 'Technology & AI (Công nghệ)' },
                      { value: 'IELTS Prep', label: 'IELTS Academic (Luyện thi)' },
                      { value: 'Daily Life', label: 'Daily Conversation (Đời sống)' },
                      { value: 'Travel & Hospitality', label: 'Travel & Hospitality (Du lịch)' },
                    ]}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
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
      </ModalPortal>
    </div>
  );
};
