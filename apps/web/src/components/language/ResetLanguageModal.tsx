import React, { useState } from 'react';
import { LanguageDefinition } from '../../config/languages';
import { useLearningContext } from '../../contexts/LearningContext';
import { AlertTriangle, Check, RotateCcw, X, ShieldCheck } from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';
import { CountryFlag } from './CountryFlag';

interface ResetLanguageModalProps {
  language: LanguageDefinition;
  isOpen?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ResetLanguageModal: React.FC<ResetLanguageModalProps> = ({
  language,
  isOpen = true,
  onClose,
  onSuccess,
}) => {
  const { resetLanguage } = useLearningContext();
  const [resetting, setResetting] = useState(false);

  const handleConfirmReset = async () => {
    setResetting(true);
    try {
      await resetLanguage(language.id);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to reset language data', err);
    } finally {
      setResetting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl p-6 space-y-5 my-auto animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Icon */}
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            <RotateCcw className="w-6 h-6" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Warning */}
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Đặt lại tiến trình {language.name}?</span>
            <CountryFlag languageId={language.id} countryCode={language.countryCode} size="sm" />
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Hành động này sẽ làm mới toàn bộ tiến trình học tập của riêng tiếng {language.nativeName}.
          </p>
        </div>

        {/* Checklist of what gets reset */}
        <div className="p-4 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20 space-y-2 text-xs">
          <p className="font-bold text-amber-700 dark:text-amber-300">Những mục sẽ được đặt lại:</p>
          <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Tiến độ và điểm trí nhớ từ vựng ({language.name})</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Lịch sử phiên ôn tập Spaced Repetition</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Chuỗi ngày học liên tục (Streak) của riêng {language.name}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Lịch sử làm bài trắc nghiệm và kiểm tra trình độ</span>
            </li>
          </ul>
        </div>

        {/* Reassurance Banner */}
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>
            Tài khoản của bạn và các ngôn ngữ khác (English, v.v.) sẽ <strong>hoàn toàn không bị ảnh hưởng</strong>.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={resetting}
            onClick={handleConfirmReset}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition shadow-sm"
          >
            {resetting ? 'Đang đặt lại...' : `Đặt lại tiếng ${language.name}`}
          </button>
        </div>
      </div>
    </ModalPortal>
  );
};
