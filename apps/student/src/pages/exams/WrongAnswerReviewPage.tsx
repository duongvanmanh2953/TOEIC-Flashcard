import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Plus,
  Check,
  Sparkles,
} from 'lucide-react';
import api from '../../lib/api';
import { GlassCard } from '../../components/common/GlassCard';

export const WrongAnswerReviewPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const grammarFilter = searchParams.get('grammar');

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [addedVocabs, setAddedVocabs] = useState<Set<string>>(new Set());

  useEffect(() => {
    api
      .get('/exams/wrong-answers', { params: { grammarType: grammarFilter || undefined } })
      .then((res: any) => {
        const data = res?.data?.data || res?.data || res;
        setQuestions(data?.wrongAnswers || []);
      })
      .catch((err) => {
        console.error('Failed to load wrong answers:', err);
      })
      .finally(() => setLoading(false));
  }, [grammarFilter]);

  const currentQ = questions[currentIndex];

  const handleSelect = (key: string) => {
    if (showAnswer) return;
    setSelectedOption(key);
    setShowAnswer(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShowAnswer(false);
    } else {
      alert('Bạn đã hoàn thành lượt ôn tập tất cả các câu sai!');
      navigate('/exams');
    }
  };

  const handleAddWordToBank = async (word: string) => {
    try {
      await api.post('/community/words/quick-add', { word, meaning: 'Từ vựng trong đề thi' });
      setAddedVocabs((prev) => new Set(prev).add(word));
    } catch {
      setAddedVocabs((prev) => new Set(prev).add(word));
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4 px-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Không có câu sai nào trong danh mục này!
        </h2>
        <p className="text-xs text-slate-500">
          Bạn đã nắm vững phần kiến thức này hoặc chưa từng làm sai câu nào liên quan.
        </p>
        <button onClick={() => navigate('/exams')} className="btn-glass-primary text-xs !py-2 !px-4">
          Quay lại Ngân hàng đề
        </button>
      </div>
    );
  }

  const isCurrentCorrect = selectedOption?.toUpperCase() === String(currentQ.correctAnswer).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/exams')}
            className="p-2 rounded-xl border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-500" />
              <span>Ôn tập câu đã làm sai</span>
            </h1>
            <p className="text-xs text-slate-500">
              {grammarFilter ? `Chủ điểm: ${grammarFilter}` : 'Toàn bộ các câu sai'} • Câu {currentIndex + 1} / {questions.length}
            </p>
          </div>
        </div>
      </div>

      {/* Main Review Card */}
      <GlassCard className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between gap-2">
          <span className="px-3 py-1 rounded-xl text-xs font-black bg-indigo-600 text-white">
            Câu {currentIndex + 1}
          </span>
          {currentQ.grammarType && (
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-50 dark:bg-purple-950 text-purple-600">
              {currentQ.grammarType}
            </span>
          )}
        </div>

        <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
          {currentQ.questionText}
        </div>

        {/* Options */}
        <div className="space-y-3">
          {(currentQ.options || []).map((opt: any) => {
            const isSelected = selectedOption === opt.key;
            const isKeyCorrect = opt.key.toUpperCase() === String(currentQ.correctAnswer).toUpperCase();

            let optStyle = 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40';
            if (showAnswer) {
              if (isKeyCorrect) {
                optStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 font-bold';
              } else if (isSelected) {
                optStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-950 dark:text-rose-200 font-bold';
              }
            }

            return (
              <button
                key={opt.key}
                type="button"
                disabled={showAnswer}
                onClick={() => handleSelect(opt.key)}
                className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3 transition ${optStyle}`}
              >
                <span className="font-extrabold text-xs w-5">{opt.key}.</span>
                <span className="text-xs sm:text-sm flex-1">{opt.text}</span>
              </button>
            );
          })}
        </div>

        {/* Answer Reveal Box */}
        {showAnswer && (
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
            <div className="flex items-center gap-2">
              {isCurrentCorrect ? (
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Chính xác! Lần này bạn đã chọn đúng.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                  <XCircle className="w-5 h-5" />
                  <span>Vẫn chưa đúng. Đáp án chính xác là: {currentQ.correctAnswer}</span>
                </div>
              )}
            </div>

            {currentQ.explanation && (
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Giải thích chi tiết:</span>
                </div>
                <p className="leading-relaxed">{currentQ.explanation}</p>
              </div>
            )}

            {/* Word connection */}
            {currentQ.vocabularyIds && currentQ.vocabularyIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-[11px] font-bold text-slate-400">Từ vựng liên quan:</span>
                {currentQ.vocabularyIds.map((v: string) => {
                  const isAdded = addedVocabs.has(v);
                  return (
                    <button
                      key={v}
                      type="button"
                      disabled={isAdded}
                      onClick={() => handleAddWordToBank(v)}
                      className="px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center gap-1"
                    >
                      {isAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      <span>{isAdded ? `Đã lưu "${v}"` : `Lưu từ "${v}"`}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-end pt-3">
              <button
                type="button"
                onClick={handleNext}
                className="btn-glass-primary text-xs !py-2.5 !px-5 flex items-center gap-1.5 font-bold"
              >
                <span>{currentIndex < questions.length - 1 ? 'Câu tiếp theo' : 'Hoàn thành ôn tập'}</span>
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
