import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WifiOff, RefreshCw, BookOpen, Sparkles, ArrowRight } from 'lucide-react';
import { useNetworkStatus } from '../../lib/offlineSyncService';

interface OnlineOnlyFeatureGateProps {
  children: React.ReactNode;
  featureName?: string;
  description?: string;
}

export const OnlineOnlyFeatureGate: React.FC<OnlineOnlyFeatureGateProps> = ({
  children,
  featureName = 'Tính năng này',
  description,
}) => {
  const { isOnline } = useNetworkStatus();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);

  const handleRetry = () => {
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
    }, 800);
  };

  if (isOnline) {
    return <>{children}</>;
  }

  return (
    <div className="w-full min-h-[60vh] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="w-full max-w-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl text-center space-y-5">
        {/* Soft Glowing Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shadow-inner relative">
          <WifiOff className="w-8 h-8 sm:w-10 sm:h-10" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
          </span>
        </div>

        {/* Text Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-500/20">
            <span>☁️ Yêu cầu Internet</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {featureName} cần kết nối mạng
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
            {description ||
              'Tính năng này cần kết nối máy chủ để tương tác trực tuyến và đồng bộ dữ liệu. Bạn vẫn có thể tiếp tục học các bộ thẻ Flashcard và Ôn tập từ vựng ngoại tuyến.'}
          </p>
        </div>

        {/* Offline Capabilities Callout */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-left text-xs space-y-2">
          <p className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Bạn vẫn có thể học ngoại tuyến ngay bây giờ:</span>
          </p>
          <ul className="space-y-1 text-slate-500 dark:text-slate-400 pl-5 list-disc">
            <li>Ôn tập từ vựng theo thuật toán Spaced Repetition (FSRS)</li>
            <li>Lật thẻ Flashcard ghi nhớ từ & luyện viết tay</li>
            <li>Tiến trình học sẽ tự động lưu và gửi lên máy chủ khi có mạng lại</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleRetry}
            disabled={isChecking}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-slate-200/90 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Đang kiểm tra kết nối...' : 'Thử kết nối lại'}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/review')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <BookOpen className="w-4 h-4" />
            <span>Vào Ôn tập từ vựng (Offline)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

