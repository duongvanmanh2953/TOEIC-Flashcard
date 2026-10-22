import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, Check, X, HelpCircle, BookOpen, Plus, Search, CheckSquare } from 'lucide-react';

export interface TourStep {
  targetId?: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  position?: 'top' | 'bottom' | 'center';
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Chào mừng bạn đến với Kho Từ Vựng!',
    description:
      'Đây là không gian học tập cá nhân nơi bạn lưu trữ, quản lý và rèn luyện các từ vựng theo tốc độ của riêng mình.',
    icon: BookOpen,
    position: 'center',
  },
  {
    targetId: 'tour-header-actions',
    title: 'Thêm & Nhập từ vựng siêu tốc',
    description:
      'Thêm từng từ mới thủ công hoặc nạp hàng trăm từ cùng lúc từ file Excel (.xlsx) / CSV với tính năng kiểm tra tự động.',
    icon: Plus,
    position: 'bottom',
  },
  {
    targetId: 'tour-learning-summary',
    title: 'Theo dõi tiến độ & Ôn tập Spaced Repetition',
    description:
      'Xem nhanh số từ đang học, đã thuộc và bấm "Ôn tập ngay" để ghi nhớ sâu bằng thuật toán lặp lại ngắt quãng (SRS).',
    icon: Sparkles,
    position: 'bottom',
  },
  {
    targetId: 'tour-smart-toolbar',
    title: 'Tìm kiếm thông minh & Bộ lọc linh hoạt',
    description:
      'Tra cứu tức thì bằng cả tiếng Anh hoặc nghĩa tiếng Việt, phân loại theo chủ đề, cấp độ CEFR và trạng thái thuộc bài.',
    icon: Search,
    position: 'bottom',
  },
  {
    targetId: 'tour-contextual-bar',
    title: 'Thao tác nhiều từ thông minh (Contextual)',
    description:
      'Khi tick chọn một hoặc nhiều từ, thanh thao tác thông minh sẽ tự động xuất hiện giúp bạn ôn tập, đổi chủ đề hoặc xóa hàng loạt.',
    icon: CheckSquare,
    position: 'top',
  },
];

interface WordBankTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WordBankTour: React.FC<WordBankTourProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('letstun_seen_wordbank_tour', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-left">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Hướng dẫn sử dụng • Bước {currentStep + 1} / {TOUR_STEPS.length}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {step.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleComplete}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
            title="Bỏ qua hướng dẫn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Dots */}
        <div className="flex items-center gap-1.5 w-full">
          {TOUR_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? 'flex-1 bg-indigo-600 dark:bg-indigo-400'
                  : idx < currentStep
                  ? 'w-6 bg-indigo-200 dark:bg-indigo-900'
                  : 'w-3 bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {step.description}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handleComplete}
            className="text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            Bỏ qua
          </button>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={handlePrev}
                className="btn-glass-secondary btn-glass-sm !px-3"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Trước</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="btn-glass-primary btn-glass-sm !px-4 font-bold inline-flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            >
              <span>{isLast ? 'Đã hiểu & Bắt đầu' : 'Tiếp theo'}</span>
              {isLast ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
