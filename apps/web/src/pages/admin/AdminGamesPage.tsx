import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Shield,
  Zap,
  BookOpen,
  Volume2,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
} from 'lucide-react';
import api from '../../lib/api';
import { useTranslation } from '../../i18n';

interface QuestionItem {
  id: string;
  gameMode: string;
  prompt: string;
  direction: string;
  correctAnswer: string;
  acceptedAnswers: string[];
  explanation?: string;
  difficulty: number;
  cefrLevel: string;
  category: string;
  status: string;
}

interface GameConfigItem {
  id: string;
  gameMode: string;
  title: string;
  description: string;
  scheduleTime: string;
  durationMinutes: number;
  questionCount: number;
  difficulty: string;
  scoreMultiplier: number;
  isActive: boolean;
}

export const AdminGamesPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'schedule' | 'questions'>('schedule');

  // Configs state
  const [configs, setConfigs] = useState<GameConfigItem[]>([]);
  const [testMode, setTestMode] = useState<boolean>(true);

  // Questions state
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [selectedMode, setSelectedMode] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Modal create/edit question
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    gameMode: 'TRANSLATION_RUSH',
    prompt: '',
    direction: 'EN_VI',
    correctAnswer: '',
    acceptedAnswers: '',
    explanation: '',
    cefrLevel: 'B1',
    category: 'Business',
  });

  useEffect(() => {
    fetchConfigs();
    fetchQuestions();
  }, [selectedMode]);

  const fetchConfigs = async () => {
    try {
      const res: any = await api.get('/games/admin/configs');
      setConfigs(res?.data || res || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      let url = '/games/admin/questions';
      const params = new URLSearchParams();
      if (selectedMode !== 'ALL') params.set('gameMode', selectedMode);
      if (search) params.set('search', search);

      const res: any = await api.get(`${url}?${params.toString()}`);
      setQuestions(res?.data || res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTestMode = async () => {
    try {
      const next = !testMode;
      await api.post('/games/admin/toggle-test-mode', { enabled: next });
      setTestMode(next);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleConfigActive = async (cfg: GameConfigItem) => {
    try {
      await api.put(`/games/admin/configs/${cfg.id}`, { isActive: !cfg.isActive });
      fetchConfigs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        acceptedAnswers: formData.acceptedAnswers
          ? formData.acceptedAnswers.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      if (editingId) {
        await api.put(`/games/admin/questions/${editingId}`, payload);
      } else {
        await api.post('/games/admin/questions', payload);
      }

      setModalOpen(false);
      setEditingId(null);
      setFormData({
        gameMode: 'TRANSLATION_RUSH',
        prompt: '',
        direction: 'EN_VI',
        correctAnswer: '',
        acceptedAnswers: '',
        explanation: '',
        cefrLevel: 'B1',
        category: 'Business',
      });
      fetchQuestions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng đề thi?')) return;
    try {
      await api.delete(`/games/admin/questions/${id}`);
      fetchQuestions();
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (q: QuestionItem) => {
    setEditingId(q.id);
    setFormData({
      gameMode: q.gameMode,
      prompt: q.prompt,
      direction: q.direction,
      correctAnswer: q.correctAnswer,
      acceptedAnswers: (q.acceptedAnswers || []).join(', '),
      explanation: q.explanation || '',
      cefrLevel: q.cefrLevel,
      category: q.category,
    });
    setModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Gamepad2 className="w-7 h-7 text-indigo-500" />
            <span>Quản Trị Đấu Trường Games & Ngân Hàng Câu Hỏi</span>
          </h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
            Cấu hình khung giờ thi đấu 20:00 - 22:00, hệ số điểm và quản lý ngân hàng câu hỏi song ngữ.
          </p>
        </div>

        {/* Test Mode Switch */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Test Mode (Chơi 24/7)
            </span>
            <span className="text-[11px] text-slate-400">
              {testMode ? 'Bỏ qua giới hạn 20:00-22:00' : 'Chỉ mở 20:00-22:00'}
            </span>
          </div>
          <button
            onClick={handleToggleTestMode}
            className={`p-1 rounded-xl transition ${testMode ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            {testMode ? (
              <ToggleRight className="w-8 h-8 fill-indigo-600/20" />
            ) : (
              <ToggleLeft className="w-8 h-8" />
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'schedule'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Lịch Thi Đấu & Cấu Hình Games
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'questions'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Ngân Hàng Câu Hỏi ({questions.length})
        </button>
      </div>

      {/* TAB 1: SCHEDULE & CONFIGS */}
      {activeTab === 'schedule' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {configs.map((cfg) => (
            <div
              key={cfg.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    {cfg.scheduleTime}
                  </span>
                  <h3 className="font-black text-base text-slate-900 dark:text-white mt-1">
                    {cfg.title}
                  </h3>
                </div>

                <button
                  onClick={() => handleToggleConfigActive(cfg)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                    cfg.isActive
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                  }`}
                >
                  {cfg.isActive ? 'KÍCH HOẠT' : 'TẠM TẮT'}
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {cfg.description}
              </p>

              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs font-bold">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">Thời Lượng</span>
                  <span>{cfg.durationMinutes} phút</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">Số Câu</span>
                  <span>{cfg.questionCount} câu</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">Hệ Số Điểm</span>
                  <span className="text-amber-500">{cfg.scoreMultiplier}x</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: QUESTION BANK CRUD */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="text-xs font-bold px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">Tất cả chế độ game</option>
                <option value="TRANSLATION_RUSH">Translation Rush</option>
                <option value="WORD_BLITZ">Word Blitz</option>
                <option value="SENTENCE_SPRINT">Sentence Sprint</option>
                <option value="MISSING_WORD">Missing Word</option>
                <option value="LISTENING_RUSH">Listening Rush</option>
                <option value="SYNONYM_BATTLE">Synonym Battle</option>
                <option value="FIX_SENTENCE">Fix The Sentence</option>
              </select>

              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchQuestions()}
                  placeholder="Tìm từ khóa..."
                  className="w-full text-xs font-medium pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  gameMode: selectedMode !== 'ALL' ? selectedMode : 'TRANSLATION_RUSH',
                  prompt: '',
                  direction: 'EN_VI',
                  correctAnswer: '',
                  acceptedAnswers: '',
                  explanation: '',
                  cefrLevel: 'B1',
                  category: 'Business',
                });
                setModalOpen(true);
              }}
              className="btn-glass-primary px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Câu Hỏi Mới</span>
            </button>
          </div>

          {/* Question List Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {q.gameMode}
                      </span>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                        {q.direction}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        CEFR {q.cefrLevel} • {q.category}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      "{q.prompt}"
                    </h4>

                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        Đáp án: {q.correctAnswer}
                      </span>
                      {q.acceptedAnswers && q.acceptedAnswers.length > 0 && (
                        <span className="text-slate-400 ml-2">
                          (Biến thể: {q.acceptedAnswers.join(', ')})
                        </span>
                      )}
                    </div>

                    {q.explanation && (
                      <p className="text-[11px] text-slate-400 italic">{q.explanation}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => openEditModal(q)}
                      className="p-2 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-2 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl space-y-4 my-8">
            <h3 className="font-black text-lg text-slate-900 dark:text-white">
              {editingId ? 'Chỉnh Sửa Câu Hỏi' : 'Tạo Câu Hỏi Mới'}
            </h3>

            <form onSubmit={handleSubmitQuestion} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Chế độ Game
                </label>
                <select
                  value={formData.gameMode}
                  onChange={(e) => setFormData({ ...formData, gameMode: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="TRANSLATION_RUSH">Translation Rush</option>
                  <option value="WORD_BLITZ">Word Blitz</option>
                  <option value="SENTENCE_SPRINT">Sentence Sprint</option>
                  <option value="MISSING_WORD">Missing Word</option>
                  <option value="LISTENING_RUSH">Listening Rush</option>
                  <option value="SYNONYM_BATTLE">Synonym Battle</option>
                  <option value="FIX_SENTENCE">Fix The Sentence</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Từ khóa / Đề bài câu hỏi
                </label>
                <input
                  type="text"
                  required
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  placeholder="Ví dụ: meet the deadline"
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Hướng dịch / Dạng câu
                  </label>
                  <select
                    value={formData.direction}
                    onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="EN_VI">English → Vietnamese</option>
                    <option value="VI_EN">Tiếng Việt → English</option>
                    <option value="SENTENCE">Sentence Translation</option>
                    <option value="FILL_BLANK">Fill in Blank (Cloze)</option>
                    <option value="SYNONYM">Synonym</option>
                    <option value="FIX">Fix Grammar</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Cấp độ CEFR
                  </label>
                  <select
                    value={formData.cefrLevel}
                    onChange={(e) => setFormData({ ...formData, cefrLevel: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                    <option value="C2">C2</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Đáp án chuẩn chính xác
                </label>
                <input
                  type="text"
                  required
                  value={formData.correctAnswer}
                  onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                  placeholder="Ví dụ: hoàn thành đúng hạn"
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Các biến thể đáp án được chấp nhận (cách nhau bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={formData.acceptedAnswers}
                  onChange={(e) => setFormData({ ...formData, acceptedAnswers: e.target.value })}
                  placeholder="Ví dụ: kịp hạn, đúng hạn, đúng thời hạn"
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Giải thích ngắn gọn (Hiển thị sau vòng)
                </label>
                <textarea
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-glass-primary px-5 py-2 rounded-xl font-bold text-white shadow-md"
                >
                  Lưu Câu Hỏi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGamesPage;
