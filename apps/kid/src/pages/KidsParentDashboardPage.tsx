import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { getKidsProgress, resetKidsProgress } from '../curriculum/curriculumProgress';
import { WORLDS_DATA } from '../curriculum/kidsCurriculum';
import { speechManager } from '../services/speech/KidsSpeechManager';
import { soundManager } from '../services/sound/KidsSoundManager';
import {
  Star,
  Flame,
  Target,
  Volume2,
  Clock,
  Sparkles,
  ShieldCheck,
  Eye,
  Sliders,
  CheckCircle,
  VolumeX,
  Languages,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { CustomSelect } from '../components/common/CustomSelect';

interface KidUserSettings {
  sessionLimitMinutes: number;
  eyeCareWarmMode: boolean;
  soundEffectsVolume: number;
  speechRate: number;
  englishImmersionOnly: boolean;
  parentPinRequired: boolean;
  selectedAgeGroup: '3-4' | '5-6' | '7-8';
}

const DEFAULT_SETTINGS: KidUserSettings = {
  sessionLimitMinutes: 20,
  eyeCareWarmMode: false,
  soundEffectsVolume: 80,
  speechRate: 0.85,
  englishImmersionOnly: true,
  parentPinRequired: true,
  selectedAgeGroup: '5-6',
};

export const KidsParentDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(getKidsProgress());
  const [confirmReset, setConfirmReset] = useState(false);
  const [activeTab, setActiveTab] = useState<'report' | 'settings'>('settings');

  // Interactive settings state stored in localStorage
  const [settings, setSettings] = useState<KidUserSettings>(() => {
    try {
      const saved = localStorage.getItem('kids_user_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Apply eye-care class to body
  useEffect(() => {
    if (settings.eyeCareWarmMode) {
      document.body.classList.add('eye-care-active');
    } else {
      document.body.classList.remove('eye-care-active');
    }
  }, [settings.eyeCareWarmMode]);

  const updateSetting = <K extends keyof KidUserSettings>(key: K, value: KidUserSettings[K]) => {
    soundManager.playPop();
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem('kids_user_settings', JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });

    setToastMessage('Đã lưu cài đặt!');
    setTimeout(() => setToastMessage(null), 1800);
  };

  useEffect(() => {
    setProgress(getKidsProgress());
  }, []);

  // Compute metrics
  let totalCurriculumLessons = 0;
  WORLDS_DATA.forEach((w) => {
    w.chapters.forEach((c) => {
      totalCurriculumLessons += c.lessons.length;
    });
  });

  const completedLessonsCount = Object.keys(progress.lessonScores || {}).length;
  const progressPercent = Math.round((completedLessonsCount / totalCurriculumLessons) * 100);

  const scoresArray = Object.values(progress.lessonScores || {});
  const averageAccuracy =
    scoresArray.length > 0
      ? Math.round(scoresArray.reduce((acc, curr) => acc + curr.accuracy, 0) / scoresArray.length)
      : 100;

  const handleReset = () => {
    resetKidsProgress();
    setProgress(getKidsProgress());
    setConfirmReset(false);
    soundManager.playPop();
  };

  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex-1 bg-white rounded-2xl border-2 border-slate-900 shadow-[4px_6px_0px_#0f172a] p-4 sm:p-7 space-y-5 animate-fadeIn select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-lg border-2 border-slate-900 animate-fadeIn flex items-center gap-2">
          <CheckCircle className="w-4 h-4 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 border-2 border-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[2px_3px_0px_#0f172a]">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-purple-100 border-2 border-slate-900 text-purple-950 flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-purple-700" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-black text-purple-900 uppercase tracking-wider mb-0.5">
              <span>Trung Tâm Phụ Huynh & Cài Đặt</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 leading-tight">
              Góc Quản Lý Của Bố Mẹ
            </h1>
            <p className="text-xs sm:text-sm text-slate-700 font-bold mt-0.5">
              Tùy chỉnh thời gian màn hình, bảo vệ mắt và theo dõi tiến độ bé học tiếng Anh.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => navigate('/kids')}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 border-2 border-slate-900 font-black text-xs transition-all active:scale-95 cursor-pointer text-center shadow-[2px_2px_0px_#0f172a]"
          >
            ← Về Góc Bé Học
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-900 text-slate-950 font-black text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#0f172a]"
          >
            <span>🎓 Học Viên</span>
          </button>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl border-2 border-slate-900 max-w-md shadow-2xs">
        <button
          onClick={() => {
            soundManager.playPop();
            setActiveTab('settings');
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'settings'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-950'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Cài Đặt Học Tập</span>
        </button>
        <button
          onClick={() => {
            soundManager.playPop();
            setActiveTab('report');
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'report'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-950'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Báo Cáo Học Tập</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: ACTIVE SETTINGS CONTROLS (HIGH VALUE)                         */}
      {/* ==================================================================== */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          {/* Group 1: Child Health & Protection */}
          <div className="bg-white rounded-2xl p-5 sm:p-7 border-2 border-slate-900 shadow-[3px_4px_0px_#0f172a] space-y-4">
            <div className="flex items-center gap-2 text-slate-950">
              <Eye className="w-5 h-5 text-purple-600" />
              <h2 className="text-base sm:text-lg font-black text-slate-950">
                Bảo Vệ Mắt & Sức Khỏe Cho Bé
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Eye Care Filter Toggle */}
              <div className="p-4 rounded-xl border-2 border-slate-900 bg-white shadow-2xs flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-slate-950 flex items-center gap-1.5">
                    <span>Chế độ dịu mắt (Warm Amber)</span>
                    <span className="text-[10px] bg-amber-200 text-amber-950 border border-slate-900 font-black px-2 py-0.5 rounded-md shadow-2xs">
                      Khuyên dùng
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-bold mt-0.5">
                    Lọc ánh sáng xanh, giảm mỏi mắt khi học vào buổi tối.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-3">
                  <input
                    type="checkbox"
                    checked={settings.eyeCareWarmMode}
                    onChange={(e) => updateSetting('eyeCareWarmMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 border border-slate-900"></div>
                </label>
              </div>

              {/* Session Limit Selector using CustomSelect */}
              <div className="p-4 rounded-xl border-2 border-slate-900 bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-black text-slate-950">
                    Giới hạn thời gian học (Mỗi phiên)
                  </div>
                  <p className="text-xs text-slate-600 font-bold mt-0.5">
                    Hệ thống sẽ nhắc bé nghỉ ngơi sau khi hết giờ.
                  </p>
                </div>
                <CustomSelect
                  value={String(settings.sessionLimitMinutes)}
                  onChange={(val) => updateSetting('sessionLimitMinutes', Number(val))}
                  options={[
                    { value: '15', label: '15 phút' },
                    { value: '20', label: '20 phút (Khuyên dùng)' },
                    { value: '30', label: '30 phút' },
                    { value: '45', label: '45 phút' },
                    { value: '0', label: 'Không giới hạn' },
                  ]}
                  size="sm"
                  className="w-full sm:w-48"
                />
              </div>
            </div>
          </div>

          {/* Group 2: Audio & Pronunciation Speed */}
          <div className="bg-white rounded-2xl p-5 sm:p-7 border-2 border-slate-900 shadow-[3px_4px_0px_#0f172a] space-y-4">
            <div className="flex items-center gap-2 text-slate-950">
              <Volume2 className="w-5 h-5 text-sky-600" />
              <h2 className="text-base sm:text-lg font-black text-slate-950">
                Giọng Đọc & Tốc Độ Phát Âm
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Speech Speed */}
              <div className="p-4 rounded-xl border-2 border-slate-900 bg-white shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-950">Tốc độ phát âm tiếng Anh</span>
                  <span className="text-xs font-black text-slate-950 bg-amber-100 border border-slate-900 px-2.5 py-0.5 rounded-lg shadow-2xs">
                    {settings.speechRate === 0.75
                      ? 'Rất chậm (0.75x)'
                      : settings.speechRate === 0.85
                      ? 'Chuẩn cho bé (0.85x)'
                      : 'Bình thường (1.0x)'}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  {[0.75, 0.85, 1.0].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => {
                        updateSetting('speechRate', rate);
                        speechManager.speak('Hello, how are you?');
                      }}
                      className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border-2 border-slate-900 ${
                        settings.speechRate === rate
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-900 hover:bg-slate-100 shadow-2xs'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Immersion Mode */}
              <div className="p-4 rounded-xl border-2 border-slate-900 bg-white shadow-2xs flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-slate-950 flex items-center gap-1.5">
                    <Languages className="w-4 h-4 text-indigo-600" />
                    <span>Chế độ 100% Anh ngữ tự nhiên</span>
                  </div>
                  <p className="text-xs text-slate-600 font-bold mt-0.5">
                    Tập trung hình ảnh & giọng đọc, hạn chế chữ dịch phụ thuộc.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-3">
                  <input
                    type="checkbox"
                    checked={settings.englishImmersionOnly}
                    onChange={(e) => updateSetting('englishImmersionOnly', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 border border-slate-900"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Group 3: Child Age Group Filter (Custom Select, No Sprawling) */}
          <div className="bg-white rounded-2xl p-5 sm:p-7 border-2 border-slate-900 shadow-[3px_4px_0px_#0f172a] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  <span>Độ Tuổi Của Bé</span>
                </h2>
                <p className="text-xs text-slate-600 font-bold mt-0.5">
                  Tối ưu độ khó câu hỏi và cách phát âm theo từng lứa tuổi.
                </p>
              </div>

              <CustomSelect
                value={settings.selectedAgeGroup}
                onChange={(val) => updateSetting('selectedAgeGroup', val as any)}
                options={[
                  { value: '3-4', label: '3 – 4 tuổi (Mầm non)', description: 'Nhận diện âm thanh & ảnh' },
                  { value: '5-6', label: '5 – 6 tuổi (Tiền tiểu học)', description: 'Phản xạ từ vựng' },
                  { value: '7-8', label: '7 – 8 tuổi (Tiểu học)', description: 'Luyện đọc & câu hoàn chỉnh' },
                ]}
                className="w-full sm:w-72"
              />
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: PROGRESS REPORT & STATS                                       */}
      {/* ==================================================================== */}
      {activeTab === 'report' && (
        <div className="space-y-4">
          {/* KPI Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-amber-200/80 shadow-xs">
              <div className="text-xs font-black text-slate-600 uppercase mb-1">Số Sao Tích Lũy</div>
              <div className="text-2xl sm:text-3xl font-black text-amber-500 flex items-center gap-1.5">
                <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
                <span>{progress.totalStars}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-bold mt-1">Từ bài học & mini-game</div>
            </div>

            <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-emerald-200/80 shadow-xs">
              <div className="text-xs font-black text-slate-600 uppercase mb-1">Bài Đã Hoàn Thành</div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600">
                {completedLessonsCount}{' '}
                <span className="text-sm font-bold text-slate-500">/ {totalCurriculumLessons}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-bold mt-1">{progressPercent}% toàn bộ lộ trình</div>
            </div>

            <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-sky-200/80 shadow-xs">
              <div className="text-xs font-black text-slate-600 uppercase mb-1">Độ Chuẩn Phát Âm</div>
              <div className="text-2xl sm:text-3xl font-black text-sky-600">{averageAccuracy}%</div>
              <div className="text-[11px] text-slate-500 font-bold mt-1">Độ chuẩn luyện nói & nghe</div>
            </div>

            <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-rose-200/80 shadow-xs">
              <div className="text-xs font-black text-slate-600 uppercase mb-1">Thói Quen Mỗi Ngày</div>
              <div className="text-2xl sm:text-3xl font-black text-rose-500 flex items-center gap-1.5">
                <Flame className="w-6 h-6 text-rose-500" />
                <span>{progress.streakDays}</span>
                <span className="text-sm font-bold text-slate-600">ngày</span>
              </div>
              <div className="text-[11px] text-slate-500 font-bold mt-1">Chuỗi ngày học liên tục</div>
            </div>
          </div>

          {/* Weak Words & Vocabulary Needs Practice */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-amber-200/80 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-600" />
                  <span>Từ Vựng Cần Bố Mẹ Ôn Cùng Bé</span>
                </h2>
                <p className="text-xs text-slate-500 font-bold mt-0.5">
                  Các từ bé cần nghe lại và luyện phát âm thêm.
                </p>
              </div>
              <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                {(progress.weakWords || []).length} từ vựng
              </span>
            </div>

            {!progress.weakWords || progress.weakWords.length === 0 ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 text-center text-sm font-black flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Tuyệt vời! Bé đã nắm vững tất cả các từ vựng đã học với độ chính xác cao!</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {(progress.weakWords || []).map((word, idx) => (
                  <button
                    key={idx}
                    onClick={() => speechManager.speak(word)}
                    className="px-4 py-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold flex items-center gap-2 hover:bg-orange-100 transition-all cursor-pointer"
                    title="Chạm để nghe phát âm"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-orange-700" />
                    <span>{word}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Danger Zone: Reset Progress */}
      <div className="bg-rose-50/60 rounded-3xl p-5 sm:p-6 border-2 border-rose-100 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        <div>
          <h3 className="font-extrabold text-rose-800 text-sm sm:text-base">
            Đặt Lại Dữ Liệu Học Của Bé
          </h3>
          <p className="text-xs text-rose-600 font-medium mt-0.5">
            Xóa các sao, huy hiệu và bài học nếu bạn muốn bé bắt đầu lại từ bài 1.
          </p>
        </div>

        {confirmReset ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer shadow-xs active:scale-95"
            >
              Xác Nhận Xóa Hết
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="px-3 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer active:scale-95"
            >
              Hủy
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="px-4 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-100 font-bold text-xs cursor-pointer shadow-2xs active:scale-95"
          >
            Đặt Lại Dữ Liệu
          </button>
        )}
      </div>
    </div>
  );
};
