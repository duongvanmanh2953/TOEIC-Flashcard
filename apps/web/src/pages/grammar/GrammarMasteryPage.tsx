import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  RotateCw,
  Lightbulb,
  AlertTriangle,
  Award,
  ChevronRight,
  Clock,
  HelpCircle,
  Compass,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface GrammarRule {
  id: string;
  title: string;
  explanationMd: string;
  structuresJson: string[];
  commonMistakes?: string[];
  examples: Array<{
    id: string;
    sentence: string;
    translation: string;
    breakdownMd?: string;
  }>;
}

interface GrammarExercise {
  id: string;
  questionText: string;
  questionType: string;
  options?: string[];
  difficulty: number;
}

interface GrammarTopic {
  id: string;
  title: string;
  titleVi: string;
  summary: string;
  cefrLevel: string;
  orderIndex: number;
  ruleCount: number;
  exerciseCount: number;
  masteryScore: number;
  attemptCount: number;
  lastStudiedAt: string | null;
  nextReviewAt: string | null;
}

interface GrammarCategory {
  id: string;
  code: string;
  title: string;
  titleVi: string;
  description: string;
  topics: GrammarTopic[];
}

import { useLearningContext } from '../../contexts/LearningContext';

export const GrammarMasteryPage: React.FC = () => {
  const { user, isGuest, promptLogin } = useAuth();
  const { activeLanguage, switchLanguage } = useLearningContext();

  const [categories, setCategories] = useState<GrammarCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<GrammarCategory | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [topicDetail, setTopicDetail] = useState<{
    id: string;
    title: string;
    titleVi: string;
    summary: string;
    cefrLevel: string;
    category: any;
    rules: GrammarRule[];
    exercises: GrammarExercise[];
    userProgress: any;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Exercise interactive state
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submittedResults, setSubmittedResults] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [activeLanguage?.id]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/grammar/categories', {
        params: { languageId: activeLanguage?.id || 'en' },
      });
      const data = res?.data?.data || res?.data || res;
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data);
        setSelectedCategory(data[0]);
        if (data[0].topics && data[0].topics.length > 0) {
          fetchTopicDetail(data[0].topics[0].id);
        }
      } else {
        setCategories([]);
        setSelectedCategory(null);
        setTopicDetail(null);
      }
    } catch (err) {
      console.error('Failed to load grammar categories:', err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };


  const fetchTopicDetail = async (topicId: string) => {
    try {
      setLoadingDetail(true);
      setSelectedTopicId(topicId);
      setUserAnswers({});
      setSubmittedResults(null);
      const res: any = await api.get(`/grammar/topics/${topicId}`);
      const data = res?.data?.data || res?.data || res;
      setTopicDetail(data);
    } catch (err) {
      console.error('Failed to load topic detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSelectOption = (exerciseId: string, option: string) => {
    if (submittedResults) return;
    setUserAnswers((prev) => ({ ...prev, [exerciseId]: option }));
  };

  const handleFillBlankChange = (exerciseId: string, value: string) => {
    if (submittedResults) return;
    setUserAnswers((prev) => ({ ...prev, [exerciseId]: value }));
  };

  const handleSubmitExercises = async () => {
    if (!topicDetail || topicDetail.exercises.length === 0) return;
    if (isGuest || !user) {
      promptLogin('Đăng nhập để lưu tiến trình và lịch ôn tập ngữ pháp FSRS');
      return;
    }

    const submissions = topicDetail.exercises.map((ex) => ({
      exerciseId: ex.id,
      userAnswer: userAnswers[ex.id] || '',
    }));

    try {
      setSubmitting(true);
      const res: any = await api.post(`/grammar/topics/${topicDetail.id}/submit-exercise`, {
        submissions,
      });
      const data = res?.data?.data || res?.data || res;
      setSubmittedResults(data);
    } catch (err: any) {
      console.error('Failed to submit exercise:', err);
      alert(err?.response?.data?.message || 'Không thể nộp bài tập. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 animate-fade-in">
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/30 text-white shadow-xl relative overflow-hidden backdrop-blur-xl">
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Chuyên Đề Ngữ Pháp Chuyên Sâu • FSRS Memory Engine</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Kho Ngữ Pháp Tiếng Anh Học Thuật & TOEIC
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 font-semibold leading-relaxed">
            Học ngữ pháp bằng cấu trúc câu trực quan, phân tích ngữ cảnh thực tế và rèn luyện trắc nghiệm có giải thích chi tiết từng bẫy đề thi.
          </p>
        </div>
      </div>

      {/* 2. Empty State if this Language Space doesn't have a grammar curriculum yet */}
      {!loading && categories.length === 0 && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Compass className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Chưa Có Giáo Trình Ngữ Pháp Cho Không Gian {activeLanguage?.name}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Theo tiêu chuẩn <strong>Language Space Centric</strong>, VocabFlow không tự ý sao chép ngữ pháp tiếng Anh sang các ngôn ngữ khác.
              Hệ thống hiện tại cung cấp bộ giáo trình chuẩn A1 - C2 cho <strong>Không Gian Tiếng Anh</strong>.
            </p>
          </div>
          <button
            onClick={() => switchLanguage('en')}
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/30 transition flex items-center gap-2 mx-auto cursor-pointer"
          >
            <span>Chuyển sang Tiếng Anh để học Ngữ pháp A1-C2</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Category Tabs (Only if categories exist) */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory?.id === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat);
                  if (cat.topics && cat.topics.length > 0) {
                    fetchTopicDetail(cat.topics[0].id);
                  }
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{cat.titleVi}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Main Workspace: Topics Sidebar + Topic Detail View */}
      {categories.length > 0 && (

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Topics List (4 columns) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {selectedCategory?.titleVi || 'Danh Sách Chủ Đề'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {selectedCategory?.description}
            </p>
          </div>

          <div className="space-y-2">
            {selectedCategory?.topics.map((topic) => {
              const isSelected = selectedTopicId === topic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => fetchTopicDetail(topic.id)}
                  className={`w-full p-4 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500 text-slate-900 dark:text-white shadow-md'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/40'
                  }`}
                >
                  <div className="space-y-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        {topic.cefrLevel}
                      </span>
                      <h4 className="text-xs font-black truncate">{topic.titleVi}</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{topic.title}</p>

                    {/* Mastery bar */}
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${topic.masteryScore || 0}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {Math.round(topic.masteryScore || 0)}%
                      </span>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition ${
                      isSelected ? 'text-emerald-500 translate-x-1' : 'text-slate-400'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Detail Workspace (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          {loadingDetail || !topicDetail ? (
            <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <RotateCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-400">Đang tải nội dung chuyên đề...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Topic Overview Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        Cấp Độ {topicDetail.cefrLevel}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        {topicDetail.rules.length} Quy tắc • {topicDetail.exercises.length} Bài tập
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                      {topicDetail.titleVi} ({topicDetail.title})
                    </h2>
                  </div>

                  {topicDetail.userProgress && (
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                      <Award className="w-5 h-5 text-emerald-500" />
                      <div>
                        <div className="text-[11px] text-slate-400 font-bold">Độ Thông Thạo</div>
                        <div className="text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {Math.round(topicDetail.userProgress.masteryScore)}%
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {topicDetail.summary}
                </p>
              </div>

              {/* Rules & Formulas Section */}
              <div className="space-y-4">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>Quy Tắc & Công Thức Chuẩn</span>
                </h3>

                {topicDetail.rules.map((rule, idx) => (
                  <div
                    key={rule.id || idx}
                    className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
                  >
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {idx + 1}. {rule.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {rule.explanationMd}
                      </p>
                    </div>

                    {/* Formula Syntax Chips */}
                    {rule.structuresJson && rule.structuresJson.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Cấu trúc câu:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {rule.structuresJson.map((st, sIdx) => (
                            <div
                              key={sIdx}
                              className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-950 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold shadow-inner"
                            >
                              {st}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sentence Examples with breakdown */}
                    {rule.examples && rule.examples.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Ví dụ minh họa:
                        </span>
                        <div className="space-y-2">
                          {rule.examples.map((ex) => (
                            <div
                              key={ex.id}
                              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1"
                            >
                              <div className="text-xs font-bold text-slate-900 dark:text-white">
                                "{ex.sentence}"
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                &rarr; {ex.translation}
                              </div>
                              {ex.breakdownMd && (
                                <div className="text-[11px] font-mono text-indigo-500 dark:text-indigo-400 pt-1">
                                  {ex.breakdownMd}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Common Mistakes Trap */}
                    {rule.commonMistakes && rule.commonMistakes.length > 0 && (
                      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-black text-amber-500">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Bẫy Thường Gặp & Điểm Cần Chú Ý:</span>
                        </div>
                        <ul className="list-disc list-inside text-xs text-amber-700 dark:text-amber-200/90 font-medium space-y-1 pl-1">
                          {rule.commonMistakes.map((mis, mIdx) => (
                            <li key={mIdx}>{mis}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Interactive Exercises Section */}
              {topicDetail.exercises && topicDetail.exercises.length > 0 && (
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-indigo-500" />
                      <span>Bài Tập Củng Cố Phản Xạ ({topicDetail.exercises.length} câu)</span>
                    </h3>

                    {submittedResults && (
                      <div className="flex items-center gap-2 text-xs font-black px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Đúng {submittedResults.summary.correctCount}/{submittedResults.summary.total} ({submittedResults.summary.accuracy}%)</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    {topicDetail.exercises.map((ex, exIdx) => {
                      const res = submittedResults?.results?.find((r: any) => r.exerciseId === ex.id);
                      return (
                        <div
                          key={ex.id}
                          className={`p-4 rounded-2xl border space-y-3 transition ${
                            res
                              ? res.isCorrect
                                ? 'bg-emerald-500/5 border-emerald-500/40'
                                : 'bg-rose-500/5 border-rose-500/40'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              Câu {exIdx + 1}: {ex.questionText}
                            </span>
                            {res && (
                              <span>
                                {res.isCorrect ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                )}
                              </span>
                            )}
                          </div>

                          {/* Multiple Choice Options */}
                          {ex.options && ex.options.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {ex.options.map((opt) => {
                                const isSelected = userAnswers[ex.id] === opt;
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => handleSelectOption(ex.id, opt)}
                                    className={`p-2.5 rounded-xl text-left border text-xs font-bold transition cursor-pointer ${
                                      isSelected
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            /* Fill in blank input */
                            <div>
                              <input
                                type="text"
                                value={userAnswers[ex.id] || ''}
                                onChange={(e) => handleFillBlankChange(ex.id, e.target.value)}
                                placeholder="Gõ câu trả lời chính xác..."
                                disabled={!!submittedResults}
                                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          )}

                          {/* Explanation feedback */}
                          {res && (
                            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 space-y-1">
                              <div>
                                <strong>Đáp án chuẩn:</strong>{' '}
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {res.correctAnswer}
                                </span>
                              </div>
                              {res.explanation && <div>{res.explanation}</div>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    {submittedResults ? (
                      <button
                        onClick={() => {
                          setSubmittedResults(null);
                          setUserAnswers({});
                        }}
                        className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Làm Lại Bài Tập</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmitExercises}
                        disabled={submitting}
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {submitting ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Đang chấm điểm...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Nộp Bài & Lưu Điểm FSRS</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default GrammarMasteryPage;

