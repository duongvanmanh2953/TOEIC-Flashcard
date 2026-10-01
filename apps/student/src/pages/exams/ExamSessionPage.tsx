import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  Flag,
  ArrowLeft,
  ArrowRight,
  Send,
  AlertTriangle,
  HelpCircle,
  List,
  Check,
} from 'lucide-react';
import api from '../../lib/api';
import { ModalPortal } from '../../components/common/ModalPortal';
import { confirmModal } from '../../components/common/ConfirmDialog';
import {
  NoteSelectableContent,
  TextSelectionNoteToolbar,
} from '../../components/notes/TextSelectionNoteToolbar';

export const ExamSessionPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState<any>(location.state?.examData || null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // User answers map: questionId -> selectedAnswer
  const [answers, setAnswers] = useState<Record<string, any>>({});
  // Question time tracking: questionId -> seconds
  const [timeSpent, setTimeSpent] = useState<Record<string, number>>({});
  // Flagged questions for review
  const [flagged, setFlagged] = useState<Set<string>>(new Set());

  // Timer state (seconds remaining)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3600);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Time tracker for currently active question
  const currentStartTimeRef = useRef<number>(Date.now());

  // Load exam if not provided in state
  useEffect(() => {
    if (!examData && attemptId) {
      // If refreshed during exam
      api
        .get(`/exams/attempts/${attemptId}`)
        .then((res: any) => {
          const data = res?.data?.data || res?.data || res;
          if (data?.submittedAt) {
            navigate(`/exams/result/${attemptId}`, { replace: true });
          }
        })
        .catch(() => {
          navigate('/exams');
        });
    } else if (examData) {
      const totalSec = (examData.durationMinutes || 60) * 60;
      setSecondsRemaining(totalSec);
      setLoading(false);
    }
  }, [attemptId, examData]);

  // Main countdown timer
  useEffect(() => {
    if (loading || !examData) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, examData]);

  // Track time spent per question on question change
  useEffect(() => {
    currentStartTimeRef.current = Date.now();
    return () => {
      const now = Date.now();
      const elapsed = Math.round((now - currentStartTimeRef.current) / 1000);
      const currentQ = examData?.questions?.[currentIndex];
      if (currentQ) {
        setTimeSpent((prev) => ({
          ...prev,
          [currentQ.id]: (prev[currentQ.id] || 0) + elapsed,
        }));
      }
    };
  }, [currentIndex, examData]);

  const questions = examData?.questions || [];
  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (key: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: key,
    }));
  };

  const toggleFlagCurrent = () => {
    if (!currentQuestion) return;
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) next.delete(currentQuestion.id);
      else next.add(currentQuestion.id);
      return next;
    });
  };

  const handleFinalSubmit = async () => {
    if (submitting || !attemptId) return;

    try {
      setSubmitting(true);
      const formattedAnswers = questions.map((q: any) => ({
        questionId: q.id,
        selectedAnswer: answers[q.id] ?? null,
        timeSpentSeconds: timeSpent[q.id] || 0,
      }));

      await api.post(`/exams/attempts/${attemptId}/submit`, {
        answers: formattedAnswers,
      });

      setShowConfirmModal(false);
      navigate(`/exams/result/${attemptId}`, { replace: true });
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể nộp bài thi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    alert('Thời gian làm bài đã kết thúc! Hệ thống đang tự động nộp bài của bạn.');
    handleFinalSubmit();
  };

  const answeredCount = Object.keys(answers).filter((k) => answers[k] != null).length;
  const unansweredCount = questions.length - answeredCount;

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 flex flex-col">
      {/* Top Fixed Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={async () => {
              const ok = await confirmModal({
                title: 'Rời phòng thi',
                message: 'Bạn có chắc chắn muốn rời phòng thi? Bài thi chưa nộp sẽ không được tính điểm.',
                type: 'danger',
                confirmText: 'Rời phòng thi',
                cancelText: 'Tiếp tục làm bài',
              });
              if (ok) {
                navigate('/exams');
              }
            }}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="truncate">
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
              {examData.title}
            </h2>
            <p className="text-[11px] text-slate-400">
              Câu {currentIndex + 1} / {questions.length} • {answeredCount} đã làm
            </p>
          </div>
        </div>

        {/* Countdown Timer Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`px-3.5 py-1.5 rounded-2xl flex items-center gap-2 font-mono font-black text-sm tracking-wider shadow-xs ${
              secondsRemaining < 300
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTimer(secondsRemaining)}</span>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            className="btn-glass-primary text-xs !py-2 !px-4 flex items-center gap-1.5 font-bold shadow-md shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Nộp bài</span>
          </button>
        </div>
      </header>

      {/* Main Body Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left / Center Area: Question Canvas */}
        <div className="lg:col-span-3 flex flex-col justify-between space-y-6">
          <NoteSelectableContent
            sourceType="test"
            sourceId={examData?.id || attemptId || 'exam'}
            sourceTitle={examData?.title || 'Bài thi'}
            questionId={currentQuestion?.id}
            className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6"
          >
            {/* Question Header & Flags */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-xl text-xs font-black bg-indigo-600 text-white">
                  Câu {currentIndex + 1}
                </span>
                {currentQuestion.category && (
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {currentQuestion.category}
                  </span>
                )}
                {currentQuestion.grammarType && (
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/50">
                    {currentQuestion.grammarType}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={toggleFlagCurrent}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  flagged.has(currentQuestion.id)
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-amber-500'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{flagged.has(currentQuestion.id) ? 'Đã gắn cờ' : 'Xem lại sau'}</span>
              </button>
            </div>

            {/* Question Prompt */}
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
              {currentQuestion.questionText}
            </div>

            {/* Media if present */}
            {currentQuestion.imageUrl && (
              <div className="rounded-2xl overflow-hidden max-h-72 border">
                <img src={currentQuestion.imageUrl} alt="Question Media" className="w-full h-full object-contain" />
              </div>
            )}

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {(currentQuestion.options || []).map((opt: any) => {
                const isSelected = answers[currentQuestion.id] === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleSelectOption(opt.key)}
                    className={`w-full p-4 rounded-2xl border text-left transition flex items-center gap-3.5 group ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-white font-bold ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/60 font-medium'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 border text-slate-600 dark:text-slate-400 group-hover:border-indigo-400'
                      }`}
                    >
                      {opt.key}
                    </div>
                    <span className="text-sm leading-normal flex-1">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </NoteSelectableContent>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => prev - 1)}
              className="btn-glass-secondary text-xs !py-2.5 !px-4 flex items-center gap-1.5 disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Câu trước</span>
            </button>

            <button
              type="button"
              disabled={currentIndex === questions.length - 1}
              onClick={() => setCurrentIndex((prev) => prev + 1)}
              className="btn-glass-primary text-xs !py-2.5 !px-5 flex items-center gap-1.5 font-bold shadow-md disabled:opacity-40"
            >
              <span>Câu tiếp theo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Sidebar: Question Palette Grid */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Danh sách câu hỏi
              </h3>
              <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                {answeredCount}/{questions.length}
              </span>
            </div>

            {/* Question status key */}
            <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-md bg-indigo-600 inline-block" />
                <span>Đã làm</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-md bg-slate-100 dark:bg-slate-800 border inline-block" />
                <span>Chưa làm</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-md bg-amber-500 inline-block" />
                <span>Cần xem lại</span>
              </div>
            </div>

            {/* Question Badges Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-[360px] overflow-y-auto pr-1">
              {questions.map((q: any, idx: number) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = answers[q.id] != null;
                const isFlagged = flagged.has(q.id);

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl font-black text-xs transition flex items-center justify-center relative ${
                      isCurrent
                        ? 'ring-2 ring-offset-2 ring-indigo-500 font-extrabold'
                        : ''
                    } ${
                      isFlagged
                        ? 'bg-amber-500 text-white shadow-xs'
                        : isAnswered
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-300" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRMATION SUBMIT MODAL */}
      {showConfirmModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-5">
              <div className="text-center space-y-2">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                    unansweredCount > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                  }`}
                >
                  {unansweredCount > 0 ? <AlertTriangle className="w-6 h-6" /> : <Check className="w-6 h-6" />}
                </div>

                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Xác nhận nộp bài thi
                </h3>

                {unansweredCount > 0 ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold leading-relaxed">
                    Bạn vẫn còn <span className="font-extrabold">{unansweredCount}</span> câu chưa trả lời. Bạn có chắc chắn muốn nộp bài ngay bây giờ?
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Bạn đã hoàn thành tất cả các câu hỏi ({answeredCount}/{questions.length}). Bấm xác nhận để hệ thống chấm điểm và phân tích kết quả.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="btn-glass-secondary text-xs !py-2.5 !px-4"
                >
                  Quay lại làm tiếp
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleFinalSubmit}
                  className="btn-glass-primary text-xs !py-2.5 !px-5 font-bold shadow-lg"
                >
                  {submitting ? 'Đang chấm điểm...' : 'Xác nhận nộp bài'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Floating Note Selection Action Toolbar */}
      <TextSelectionNoteToolbar />
    </div>
  );
};
