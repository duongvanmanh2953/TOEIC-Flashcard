import React, { useState, useEffect } from 'react';
import { useLearningContext } from '../../contexts/LearningContext';
import { SUPPORTED_LANGUAGES, LanguageDefinition, getLanguage } from '../../config/languages';
import {
  X,
  Sparkles,
  ArrowRight,
  Check,
  Compass,
  Clock,
  Target,
  Plane,
  Briefcase,
  GraduationCap,
  Clapperboard,
  Heart,
  Trophy,
  MessageCircle,
  CheckCircle2,
  Sprout,
  BookOpen,
  TrendingUp,
} from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';
import { CountryFlag } from './CountryFlag';

interface AddLanguageModalProps {
  isOpen?: boolean;
  onClose: () => void;
  preselectedLanguageId?: string;
}

export const AddLanguageModal: React.FC<AddLanguageModalProps> = ({
  isOpen = true,
  onClose,
  preselectedLanguageId,
}) => {
  const { userLanguages, addLanguage } = useLearningContext();

  // 5 Steps: 1: Language -> 2: Level -> 3: Goal -> 4: Time -> 5: Complete
  const [step, setStep] = useState<number>(1);

  // Form State
  const [selectedLangId, setSelectedLangId] = useState<string>(
    preselectedLanguageId || (userLanguages.includes('de') ? 'es' : 'de')
  );
  const [selectedLevel, setSelectedLevel] = useState<string>('A1');
  const [selectedGoal, setSelectedGoal] = useState<string>('Conversation');
  const [dailyMinutes, setDailyMinutes] = useState<number>(15);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (preselectedLanguageId) {
      setSelectedLangId(preselectedLanguageId);
      const lang = getLanguage(preselectedLanguageId);
      setSelectedLevel(lang.defaultLevel);
    }
  }, [preselectedLanguageId]);

  const targetLang = getLanguage(selectedLangId);

  // Goal options with icons
  const GOAL_OPTIONS = [
    { id: 'Conversation', title: 'Giao tiếp hàng ngày', desc: 'Tự tin trò chuyện và kết bạn', icon: MessageCircle },
    { id: 'Travel', title: 'Du lịch & Khám phá', desc: 'Hỏi đường, gọi món, đi lại thuận tiện', icon: Plane },
    { id: 'Work', title: 'Công việc & Sự nghiệp', desc: 'Email, phỏng vấn, đàm phán quốc tế', icon: Briefcase },
    { id: 'Study', title: 'Du học & Học thuật', desc: 'Ôn thi chứng chỉ (Goethe, HSK, JLPT...)', icon: GraduationCap },
    { id: 'Media', title: 'Phim ảnh & Văn hóa', desc: 'Xem phim, nghe nhạc không cần phụ đề', icon: Clapperboard },
    { id: 'Interest', title: 'Sở thích cá nhân', desc: 'Thử thách bản thân và rèn luyện trí não', icon: Heart },
    { id: 'Fluency', title: 'Thành thạo toàn diện', desc: 'Phản xạ như người bản xứ', icon: Trophy },
  ];

  // Daily commitment options
  const TIME_OPTIONS = [
    { minutes: 5, label: '5 phút / ngày', sub: 'Nhẹ nhàng, duy trì thói quen' },
    { minutes: 10, label: '10 phút / ngày', sub: 'Tiêu chuẩn, tiến bộ ổn định' },
    { minutes: 15, label: '15 phút / ngày (Khuyên dùng)', sub: 'Tối ưu cho trí nhớ dài hạn' },
    { minutes: 30, label: '30 phút / ngày', sub: 'Tăng tốc nhanh chóng' },
    { minutes: 60, label: '60+ phút / ngày', sub: 'Chinh phục cấp tốc' },
  ];

  // Level options based on selected language
  const LEVEL_OPTIONS = targetLang.supportedLevels.map((lvl) => {
    let desc = 'Căn bản & Nhận biết';
    let Icon = BookOpen;
    if (lvl.includes('A1') || lvl.includes('Beginner') || lvl.includes('1')) {
      desc = 'Người mới bắt đầu hoàn toàn';
      Icon = Sprout;
    } else if (lvl.includes('A2') || lvl.includes('Elementary') || lvl.includes('2')) {
      desc = 'Sơ cấp & Giao tiếp cơ bản';
      Icon = BookOpen;
    } else if (lvl.includes('B1') || lvl.includes('Intermediate') || lvl.includes('3')) {
      desc = 'Trung cấp & Diễn đạt tự nhiên';
      Icon = TrendingUp;
    } else if (lvl.includes('B2') || lvl.includes('Upper') || lvl.includes('4')) {
      desc = 'Trung cao cấp & Phản xạ nhanh';
      Icon = Target;
    } else {
      desc = 'Cao cấp & Thành thạo chuyên sâu';
      Icon = Trophy;
    }

    return { id: lvl, desc, icon: Icon };
  });

  const handleFinish = async () => {
    setIsCreating(true);
    try {
      await addLanguage({
        languageId: selectedLangId,
        level: selectedLevel,
        goalCategory: selectedGoal,
        dailyGoal: dailyMinutes,
      });
      onClose();
    } catch (err) {
      console.error('Failed to create language profile', err);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-extrabold text-xs">
              {step}/5
            </span>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {step === 1 && 'Bạn muốn học ngôn ngữ nào?'}
                {step === 2 && `Trình độ ${targetLang.name} hiện tại của bạn?`}
                {step === 3 && 'Mục tiêu chính khi học của bạn?'}
                {step === 4 && 'Bạn có thể dành bao nhiêu thời gian mỗi ngày?'}
                {step === 5 && 'Không gian học tập đã sẵn sàng! 🎉'}
              </h2>
              <p className="text-xs text-slate-400">
                {step < 5 ? 'Thiết lập không gian học cá nhân hóa' : 'Hệ thống đã chuẩn bị bộ từ vựng khởi động'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1">
          <div
            className="bg-gradient-to-r from-indigo-500 to-brand-500 h-1 transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* STEP 1: Select Language */}
          {step === 1 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SUPPORTED_LANGUAGES.filter((l) => l.enabled).map((lang) => {
                const isSelected = lang.id === selectedLangId;
                const isAlreadyAdded = userLanguages.includes(lang.id);

                return (
                  <div
                    key={lang.id}
                    onClick={() => {
                      setSelectedLangId(lang.id);
                      setSelectedLevel(lang.defaultLevel);
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 shadow-md ring-2 ring-indigo-500/30'
                        : 'border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <CountryFlag languageId={lang.id} countryCode={lang.countryCode} size="lg" />
                      {isAlreadyAdded && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          Đã thêm
                        </span>
                      )}
                    </div>
                    <div className="mt-3">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {lang.name}
                      </h3>
                      <p className="text-xs text-slate-400 truncate">{lang.nativeName}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 2: Select Level */}
          {step === 2 && (
            <div className="space-y-2.5">
              {LEVEL_OPTIONS.map((lvl) => {
                const isSelected = selectedLevel === lvl.id;
                return (
                  <div
                    key={lvl.id}
                    onClick={() => setSelectedLevel(lvl.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 shadow-sm ring-1 ring-indigo-500/30'
                        : 'border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <lvl.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                          {lvl.id}
                        </p>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {lvl.desc}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 3: Select Goal */}
          {step === 3 && (
            <div className="space-y-2">
              {GOAL_OPTIONS.map((goal) => {
                const isSelected = selectedGoal === goal.id;
                const Icon = goal.icon;
                return (
                  <div
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 shadow-sm ring-1 ring-indigo-500/30'
                        : 'border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {goal.title}
                        </p>
                        <p className="text-[11px] text-slate-400">{goal.desc}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 4: Daily Commitment */}
          {step === 4 && (
            <div className="space-y-2.5">
              {TIME_OPTIONS.map((opt) => {
                const isSelected = dailyMinutes === opt.minutes;
                return (
                  <div
                    key={opt.minutes}
                    onClick={() => setDailyMinutes(opt.minutes)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 shadow-sm ring-1 ring-indigo-500/30'
                        : 'border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {opt.label}
                        </p>
                        <p className="text-[11px] text-slate-400">{opt.sub}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 5: Space Ready Celebration */}
          {step === 5 && (
            <div className="text-center py-4 space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 to-brand-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30">
                <CountryFlag languageId={targetLang.id} countryCode={targetLang.countryCode} size="xl" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Your {targetLang.name} learning space is ready! 🎉
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Không gian học tiếng {targetLang.nativeName} được thiết kế chuyên biệt và độc lập hoàn toàn.
                </p>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-left max-w-sm mx-auto space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Ngôn ngữ:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CountryFlag languageId={targetLang.id} countryCode={targetLang.countryCode} size="xs" />
                    <span>{targetLang.name} ({targetLang.nativeName})</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Trình độ khởi đầu:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedLevel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Mục tiêu:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedGoal}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Thời gian mỗi ngày:</span>
                  <span className="font-bold text-amber-500">{dailyMinutes} phút/ngày</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          {step > 1 && step < 5 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              Quay lại
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="btn-glass-primary text-xs !py-2 !px-5 gap-1.5 shadow-md shadow-indigo-500/20"
            >
              <span>Tiếp tục</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isCreating}
              onClick={handleFinish}
              className="btn-glass-primary text-xs !py-2.5 !px-6 gap-2 shadow-lg shadow-indigo-500/30 font-extrabold w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              <span>{isCreating ? 'Đang khởi tạo...' : 'Bắt đầu học ngay'}</span>
            </button>
          )}
        </div>
      </div>
    </ModalPortal>
  );
};
