import React, { useState, useEffect } from 'react';
import { ModalPortal } from '../../components/common/ModalPortal';
import { KidsLockIcon } from '../assets/icons/KidsIcons';
import { kidsSound } from '../services/sound/KidsSoundManager';

interface KidsParentPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export const KidsParentPinModal: React.FC<KidsParentPinModalProps> = ({
  isOpen,
  onClose,
  onVerified,
}) => {
  const [num1, setNum1] = useState(3);
  const [num2, setNum2] = useState(4);
  const [inputVal, setInputVal] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Generate random math challenge every time modal opens
  useEffect(() => {
    if (isOpen) {
      const n1 = Math.floor(Math.random() * 6) + 3; // 3 to 8
      const n2 = Math.floor(Math.random() * 5) + 2; // 2 to 6
      setNum1(n1);
      setNum2(n2);
      setInputVal('');
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = num1 + num2;
    if (parseInt(inputVal.trim(), 10) === expected) {
      kidsSound.play('success');
      onVerified();
      onClose();
    } else {
      kidsSound.play('wrong');
      setErrorMsg('Chưa chính xác, phụ huynh vui lòng thử lại nhé!');
      setInputVal('');
    }
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div
        className="m-auto relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border-4 border-amber-300 dark:border-amber-600 p-6 sm:p-7 shadow-2xl space-y-4 animate-scale-up text-center select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center border-2 border-amber-300 shadow-inner">
          <KidsLockIcon size={28} />
        </div>

        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Khu Vực Dành Cho Phụ Huynh
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Để đảm bảo an toàn cho bé, vui lòng giải phép tính đơn giản bên dưới:
          </p>
        </div>

        <div className="py-3 px-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-dashed border-amber-300 dark:border-amber-700">
          <span className="text-2xl font-black text-amber-800 dark:text-amber-200 tracking-wider">
            {num1} + {num2} = ?
          </span>
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-500 font-bold animate-shake">{errorMsg}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="number"
            autoFocus
            required
            pattern="[0-9]*"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Nhập kết quả..."
            className="w-full text-center text-xl font-bold py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
          />

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs transition"
            >
              Quay lại bé học
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-md transition"
            >
              Mở Khóa
            </button>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
};

export default KidsParentPinModal;
