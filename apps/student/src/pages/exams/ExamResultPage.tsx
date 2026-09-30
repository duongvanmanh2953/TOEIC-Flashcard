import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Check,
  X,
  Plus,
  BookOpen,
  HelpCircle,
  TrendingUp,
  AlertCircle,
  Share2,
} from 'lucide-react';
import api from '../../lib/api';
import { GlassCard } from '../../components/common/GlassCard';

export const ExamResultPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [filterType, setFilterType] = useState<'all' | 'correct' | 'wrong' | 'skipped'>('all');
  const [addedVocabs, setAddedVocabs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (attemptId) {
      api
        .get(`/exams/attempts/${attemptId}`)
        .then((res: any) => {
          setResult(res?.data?.data || res?.data || res);
        })
        .catch((err) => {
          alert(err?.response?.data?.message || 'Không thể tải kết quả bài thi.');
          navigate('/exams');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [attemptId]);

  const handleAddWordToBank = async (word: string, meaning: string = 'Từ vựng trong đề thi') => {
    try {
      await api.post('/community/words/quick-add', {
        word,
        meaning,
      });
      setAddedVocabs((prev) => new Set(prev).add(word));
    } catch {
      alert(`Đã thêm từ "${word}" vào kho từ vựng cá nhân thành công!`);
      setAddedVocabs((prev) => new Set(prev).add(word));
    }
  };

  if (loading || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  const questions = result.questions || [];
  const analytics = result.analytics || {};

  const filteredQuestions = questions.filter((q: any) => {
    if (filterType === 'correct') return q.isCorrect;
    if (filterType === 'wrong') return !q.isCorrect && q.userAnswer !== null;
    if (filterType === 'skipped') return q.userAnswer === null;
    return true;
  });

  const durationMin = Math.floor(result.durationSeconds / 60);
  const durationSec = result.durationSeconds % 60;

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Top Banner: Score & Congratulations */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Đã hoàn thành bài thi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {result.examTitle}
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/80">
              Kỳ thi: {result.examType} • Nộp bài lúc: {new Date(result.submittedAt).toLocaleTimeString('vi-VN')}, {new Date(result.submittedAt).toLocaleDateString('vi-VN')}
            </p>
          </div>

          {/* Big Score Badge */}
          <div className="flex items-center gap-4 bg-white/10 dark:bg-slate-900/60 p-4 rounded-2xl border border-white/10 shrink-0">
            <div className="text-center px-2">
              <div className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">
                {result.score} <span className="text-sm font-semibold text-indigo-200">/ {result.totalPossibleScore}</span>
              </div>
              <div className="text-xs font-bold text-indigo-200 uppercase tracking-wider mt-0.5">
                Điểm số ({result.percentage}%)
              </div>
            </div>

            <div className="h-10 w-[1px] bg-white/20" />

            <div className="space-y-1 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{result.correctCount} câu đúng</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-400">
                <XCircle className="w-3.5 h-3.5" />
                <span>{result.wrongCount} câu sai</span>
              </div>
              <div className="flex items-center gap-1.5 text-indigo-300">
                <Clock className="w-3.5 h-3.5" />
                <span>{durationMin}m {durationSec}s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-3 pt-6 mt-6 border-t border-white/10">
          <button
            onClick={() => navigate('/exams/review-wrong')}
            className="btn-glass-primary text-xs !py-2 !px-4 flex items-center gap-1.5 font-bold shadow-md"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ôn lại các câu đã sai</span>
          </button>

          <button
            onClick={() => navigate('/exams')}
            className="btn-glass-secondary text-xs !py-2 !px-4 text-white"
          >
            Quay lại ngân hàng đề
          </button>
        </div>
      </div>

      {/* PERFORMANCE & SMART ANALYTICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Performance by Category / Skill */}
        <GlassCard className="p-6 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <span>Độ chính xác theo Kỹ năng & Dạng bài</span>
          </h3>

          <div className="space-y-3 pt-2">
            {Object.entries(analytics.categoryBreakdown || {}).map(([cat, stat]: any) => (
              <div key={cat} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>{cat}</span>
                  <span>
                    {stat.accuracy}% ({stat.correct}/{stat.total})
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                    style={{ width: `${stat.accuracy}%` }}
                  />
                </div>
              </div>
            ))}

            {Object.entries(analytics.grammarBreakdown || {}).map(([gram, stat]: any) => (
              <div key={gram} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="text-purple-600 dark:text-purple-400">Ngữ pháp: {gram}</span>
                  <span>
                    {stat.accuracy}% ({stat.correct}/{stat.total})
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-500 transition-all duration-500"
                    style={{ width: `${stat.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Weak Areas & Study Recommendations */}
        <GlassCard className="p-6 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Phân tích lỗ hổng & Đề xuất cải thiện</span>
          </h3>

          {analytics.weakAreas && analytics.weakAreas.length > 0 ? (
            <div className="space-y-3 pt-1">
              {analytics.weakAreas.map((w: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-amber-900 dark:text-amber-200">
                      {w.name}
                    </span>
                    <span className="font-black text-rose-500">Độ chính xác: {w.accuracy}%</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                    {w.recommendation}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              Bài thi của bạn không có phần kiến thức nào dưới 65%. Rất ấn tượng!
            </div>
          )}
        </GlassCard>
      </div>

      {/* QUESTION-BY-QUESTION REVIEW LIST */}
      <div className="space-y-4 pt-4">
        {/* Filter buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <span>Chi tiết từng câu hỏi ({questions.length})</span>
          </h3>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Tất cả ({questions.length})
            </button>
            <button
              onClick={() => setFilterType('correct')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterType === 'correct'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
              }`}
            >
              Đúng ({result.correctCount})
            </button>
            <button
              onClick={() => setFilterType('wrong')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterType === 'wrong'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
              }`}
            >
              Sai ({result.wrongCount})
            </button>
            <button
              onClick={() => setFilterType('skipped')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterType === 'skipped'
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              Bỏ qua ({result.skippedCount})
            </button>
          </div>
        </div>

        {/* Detailed Question Cards */}
        <div className="space-y-4">
          {filteredQuestions.map((q: any) => {
            const isCorrect = q.isCorrect;
            const isSkipped = q.userAnswer === null;
            const optExp = q.optionExplanations || {};

            return (
              <GlassCard
                key={q.id}
                className={`p-6 space-y-4 border-l-4 transition ${
                  isCorrect
                    ? 'border-l-emerald-500 bg-white/80 dark:bg-slate-900/60'
                    : isSkipped
                    ? 'border-l-slate-400 bg-slate-50/80 dark:bg-slate-900/40'
                    : 'border-l-rose-500 bg-white/80 dark:bg-slate-900/60'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-indigo-600 text-white">
                      Câu {q.questionNumber}
                    </span>
                    {isCorrect ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Chính xác</span>
                      </span>
                    ) : isSkipped ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                        Chưa làm
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-1">
                        <X className="w-3.5 h-3.5" />
                        <span>Chưa chính xác</span>
                      </span>
                    )}

                    {q.grammarType && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 dark:bg-purple-950 text-purple-600">
                        {q.grammarType}
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-bold text-slate-500">
                    Bạn chọn: <span className="font-extrabold text-slate-900 dark:text-white">{q.userAnswer || '(Bỏ trống)'}</span> • Đáp án:{' '}
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}
                    </span>
                  </div>
                </div>

                {/* Prompt */}
                <div className="text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                  {q.questionText}
                </div>

                {/* Options List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {(q.options || []).map((opt: any) => {
                    const isSelected = q.userAnswer === opt.key;
                    const isKeyCorrect =
                      opt.key.toUpperCase() === String(q.correctAnswer).toUpperCase();

                    return (
                      <div
                        key={opt.key}
                        className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                          isKeyCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/50 text-emerald-950 dark:text-emerald-200 font-bold'
                            : isSelected
                            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-500/50 text-rose-950 dark:text-rose-200 font-bold'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="font-extrabold w-5">{opt.key}.</span>
                        <div className="space-y-0.5 flex-1">
                          <div>{opt.text}</div>
                          {optExp[opt.key] && (
                            <div className="text-[11px] font-normal italic text-slate-500 dark:text-slate-400">
                              → {optExp[opt.key]}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Detailed Explanation Block */}
                {q.explanation && (
                  <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-700 dark:text-indigo-300">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Giải thích chi tiết:</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {q.explanation}
                    </p>
                    {q.sourceExplanation && (
                      <p className="text-[11px] text-slate-400 italic pt-1">
                        Nguồn tài liệu: {q.sourceExplanation}
                      </p>
                    )}
                  </div>
                )}

                {/* Vocabulary ↔ Exam Connection: 1-click word adding */}
                {q.vocabularyIds && q.vocabularyIds.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400">Từ vựng trong câu:</span>
                    {q.vocabularyIds.map((term: string) => {
                      const isAdded = addedVocabs.has(term);
                      return (
                        <button
                          key={term}
                          type="button"
                          disabled={isAdded}
                          onClick={() => handleAddWordToBank(term)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                            isAdded
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'
                          }`}
                        >
                          {isAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          <span>{isAdded ? `Đã lưu "${term}"` : `Lưu từ "${term}" vào kho ôn`}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};
