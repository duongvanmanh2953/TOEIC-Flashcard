import React, { useState, useEffect } from 'react';
import { KidsMascot } from '../components/KidsMascot';
import { soundManager } from '../services/sound/KidsSoundManager';
import { voiceService } from '../services/voice/voiceService';
import { celebrationManager } from '../services/celebration/CelebrationManager';
import { getKidsProgress } from '../curriculum/curriculumProgress';
import { STICKERS_DATA, BADGES_DATA } from '../data/rewardsData';
import { KIDS_CATEGORIES } from '../data/categories/categoriesData';
import { COMPREHENSIVE_VOCABULARY, VocabularyItem } from '../data/vocabulary/vocabularyData';
import { DAILY_PHRASES, KidPhrase } from '../data/phrases/phrasesData';
import { evaluatePronunciation } from '../lib/pronunciationEvaluator';
import { useLearningContext } from '../contexts/LearningContext';
import { KidsIllustration } from '../assets/illustrations/KidsIllustration';
import { CountryFlag } from '../components/language/CountryFlag';
import {
  Volume2,
  RotateCcw,
  MessageSquare,
  Mic,
  Trash2,
  X,
  Lock,
  CheckCircle2,
  Sparkles,
  BookOpen,
  MapPin,
  Award,
  Languages,
  Play,
  Heart,
  HelpCircle,
  Clock,
  Compass,
  Smile,
  Sun,
  Palette,
  Hash,
  Search,
  Rocket,
  Utensils,
  GraduationCap,
  Users,
  Home,
  CloudSun,
  Car,
  ChevronRight,
  Sparkle,
  Lightbulb,
} from 'lucide-react';
import { kidAsset } from '../utils/kidAsset';

interface PlacedItem {
  id: string;
  itemId: string;
  name: string;
  icon: string;
  image?: string;
  x: number;
  y: number;
}

// 6 Interactive Learning Zones for "Hành Tinh Kỳ Thú - Đảo Của Bé"
interface IslandZone {
  id: string;
  nameVi: string;
  nameEn: string;
  categoryFilter: string;
  illustration: string;
  icon: any;
  color: string;
  tintBg: string;
  activeRing: string;
  descriptionVi: string;
}

const ISLAND_ZONES: IslandZone[] = [
  {
    id: 'animal_bay',
    nameVi: 'Vịnh Muông Thú',
    nameEn: 'Animal Bay',
    categoryFilter: 'animals',
    illustration: 'lion',
    icon: Heart,
    color: '#d97706',
    tintBg: 'bg-amber-100/70',
    activeRing: 'ring-amber-300',
    descriptionVi: 'Gặp gỡ những người bạn động vật đáng yêu trong rừng xanh và biển cả.',
  },
  {
    id: 'fruit_farm',
    nameVi: 'Nông Trại Trái Cây',
    nameEn: 'Fruit & Food Farm',
    categoryFilter: 'fruits',
    illustration: 'apple',
    icon: Utensils,
    color: '#e11d48',
    tintBg: 'bg-rose-100/70',
    activeRing: 'ring-rose-300',
    descriptionVi: 'Thu hoạch hoa quả chín mọng và thưởng thức các món ăn ngon.',
  },
  {
    id: 'family_haven',
    nameVi: 'Mái Ấm Gia Đình',
    nameEn: 'Family Haven',
    categoryFilter: 'family',
    illustration: 'cat',
    icon: Home,
    color: '#059669',
    tintBg: 'bg-emerald-100/70',
    activeRing: 'ring-emerald-300',
    descriptionVi: 'Học từ vựng yêu thương về bố mẹ, ông bà và những người thân yêu.',
  },
  {
    id: 'school_corner',
    nameVi: 'Góc Trường Học',
    nameEn: 'School Corner',
    categoryFilter: 'school',
    illustration: 'book',
    icon: GraduationCap,
    color: '#0284c7',
    tintBg: 'bg-sky-100/70',
    activeRing: 'ring-sky-300',
    descriptionVi: 'Lớp học vui vẻ cùng sách vở, bảng viết và đồ dùng học tập.',
  },
  {
    id: 'phrases_plaza',
    nameVi: 'Quảng Trường Giao Tiếp',
    nameEn: 'Phrases Plaza',
    categoryFilter: 'phrases',
    illustration: 'balloons',
    icon: MessageSquare,
    color: '#7c3aed',
    tintBg: 'bg-purple-100/70',
    activeRing: 'ring-purple-300',
    descriptionVi: 'Luyện tập các câu chào hỏi, cảm ơn và xin lỗi lễ phép hàng ngày.',
  },
  {
    id: 'space_station',
    nameVi: 'Trạm Không Gian Kỳ Thú',
    nameEn: 'Space Station',
    categoryFilter: 'transport',
    illustration: 'rocket',
    icon: Rocket,
    color: '#4f46e5',
    tintBg: 'bg-indigo-100/70',
    activeRing: 'ring-indigo-300',
    descriptionVi: 'Khám phá tên lửa, các vì sao và các phương tiện vi vu bầu trời.',
  },
];

export const KidsMyWorldPage: React.FC = () => {
  const { activeLanguage } = useLearningContext();
  const [progress] = useState(getKidsProgress());
  const [activeZone, setActiveZone] = useState<string>('animal_bay');
  const [selectedCategory, setSelectedCategory] = useState<string>('animals');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'zones' | 'island' | 'phrases' | 'badges'>('zones');

  // Word Detail Modal state
  const [activeWordModal, setActiveWordModal] = useState<VocabularyItem | null>(null);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [micFeedback, setMicFeedback] = useState<string | null>(null);

  // Interactive Island Stickers
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>(() => {
    try {
      const saved = localStorage.getItem('kids_placed_items');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: '1', itemId: 'palm-tree', name: 'Palm Tree', icon: '🌴', x: 25, y: 35 },
      { id: '2', itemId: 'lion-cub', name: 'Lion Cub', icon: '🦁', x: 60, y: 55 },
      { id: '3', itemId: 'sun', name: 'Bright Sun', icon: '☀️', x: 80, y: 15 },
    ];
  });

  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('kids_placed_items', JSON.stringify(placedItems));
  }, [placedItems]);

  // AUTOMATIC WORD PRONUNCIATION on opening a word (Requirement #4)
  useEffect(() => {
    if (activeWordModal) {
      soundManager.playDing();
      setMicFeedback(null);
      setIsListeningMic(false);

      const timer = setTimeout(() => {
        voiceService.speakEnglish(activeWordModal.word, {
          rate: 0.78,
        });
      }, 200);

      return () => {
        clearTimeout(timer);
        voiceService.stop();
      };
    }
  }, [activeWordModal]);

  const handleSelectZone = (zone: IslandZone) => {
    soundManager.playPop();
    setActiveZone(zone.id);
    if (zone.categoryFilter === 'phrases') {
      setActiveTab('phrases');
    } else {
      setActiveTab('zones');
      setSelectedCategory(zone.categoryFilter);
    }
  };

  const handleOpenWord = (item: VocabularyItem) => {
    setActiveWordModal(item);
  };

  const handleCloseWord = () => {
    voiceService.stop();
    setActiveWordModal(null);
  };

  // 4 Distinct Action Buttons (Requirement #4)
  const handleReplayEnglish = () => {
    if (!activeWordModal) return;
    soundManager.playDing();
    voiceService.speakEnglish(activeWordModal.word, { rate: 0.78 });
  };

  const handleSpeakVietnamese = () => {
    if (!activeWordModal) return;
    soundManager.playPop();
    voiceService.speakVietnamese(activeWordModal.viMeaning);
  };

  const handleSpeakSentence = () => {
    if (!activeWordModal) return;
    soundManager.playPop();
    voiceService.speakSentence(activeWordModal.sentence);
  };

  const handlePracticeMic = () => {
    if (!activeWordModal) return;
    soundManager.playPop();
    setIsListeningMic(true);
    setMicFeedback('Đang lắng nghe bé đọc to...');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = activeLanguage?.speechLocale || 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (e: any) => {
          const spoken = (e.results?.[0]?.[0]?.transcript || '').trim();
          setIsListeningMic(false);
          const target = activeWordModal.word.trim();

          const evalResult = evaluatePronunciation(target, spoken, 'kid');
          if (evalResult.isPassing) {
            soundManager.playFanfare();
            celebrationManager.celebrate('small', evalResult.feedback);
            setMicFeedback(evalResult.feedback);
          } else {
            soundManager.playIncorrect();
            setMicFeedback(evalResult.feedback);
          }
        };

        recognition.onerror = () => {
          setIsListeningMic(false);
          setMicFeedback('Chưa nghe rõ giọng đọc. Bé đọc lại thật to và rõ ràng nhé!');
        };

        recognition.start();
      } catch {
        fallbackPractice();
      }
    } else {
      fallbackPractice();
    }
  };

  const fallbackPractice = () => {
    setTimeout(() => {
      setIsListeningMic(false);
      setMicFeedback('Trình duyệt chưa hỗ trợ ghi âm. Bé hãy mở trên Chrome để luyện phát âm nhé!');
    }, 1000);
  };

  // Filtered words based on category and search
  const filteredWords = COMPREHENSIVE_VOCABULARY.filter((item) => {
    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchStage = selectedStage === 'all' || item.stage === selectedStage;
    const matchSearch =
      !searchQuery.trim() ||
      item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.viMeaning.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchStage && matchSearch;
  });

  const currentZoneObj = ISLAND_ZONES.find((z) => z.id === activeZone) || ISLAND_ZONES[0];

  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex-1 bg-white/75 backdrop-blur-2xl rounded-2xl sm:rounded-[36px] border border-white/90 shadow-[0_12px_40px_rgba(0,0,0,0.06)] p-3 sm:p-6 lg:p-7 flex flex-col space-y-3.5 sm:space-y-5 animate-fadeIn select-none">
      {/* ================================================================ */}
      {/* 1. CONCEPT BANNER: HÀNH TINH KỲ THÚ - ĐẢO CỦA BÉ                */}
      {/* ================================================================ */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 rounded-2xl sm:rounded-3xl p-4 sm:p-8 text-white flex flex-col items-stretch gap-4 sm:gap-6 border-2 border-emerald-400 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
          <KidsMascot mood="happy" size={72} speechText="Chào mừng bé đến Hành Tinh Kỳ Thú!" />
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-[11px] font-black uppercase mb-1 border border-white/30 text-white">
              <Compass className="w-3.5 h-3.5 text-yellow-300" />
              <span>Hành Tinh Kỳ Thú • Đảo Của Bé</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-white leading-tight">Thế Giới Khám Phá & Học Tập Tương Tác</h1>
            <p className="text-emerald-100 text-xs sm:text-sm font-bold mt-1 max-w-xl">
              Khám phá 6 phân khu kỳ diệu: nghe từ vựng tự động, trò chuyện hàng ngày và xây dựng vương quốc riêng của bé!
            </p>
          </div>
        </div>

        {/* 4 Mode Tabs with Equal Touch Targets */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 items-center gap-2 sm:gap-3 bg-white/20 backdrop-blur-lg p-1.5 sm:p-2.5 rounded-2xl sm:rounded-3xl border border-white/40 w-full shadow-inner">
          <button
            onClick={() => setActiveTab('zones')}
            className={`px-2.5 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] sm:min-h-[48px] ${
              activeTab === 'zones'
                ? 'bg-white/70 backdrop-blur-xl border border-white text-slate-900 shadow-[0_8px_16px_rgba(0,0,0,0.1)] scale-[1.02]'
                : 'text-white hover:bg-white/20 border border-transparent'
            }`}
          >
            <Compass className={`w-4 h-4 shrink-0 ${activeTab === 'zones' ? 'text-emerald-600' : 'text-emerald-200'}`} />
            <span className="truncate">Phân Khu</span>
          </button>
          <button
            onClick={() => setActiveTab('phrases')}
            className={`px-2.5 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] sm:min-h-[48px] ${
              activeTab === 'phrases'
                ? 'bg-white/70 backdrop-blur-xl border border-white text-slate-900 shadow-[0_8px_16px_rgba(0,0,0,0.1)] scale-[1.02]'
                : 'text-white hover:bg-white/20 border border-transparent'
            }`}
          >
            <MessageSquare className={`w-4 h-4 shrink-0 ${activeTab === 'phrases' ? 'text-sky-600' : 'text-sky-200'}`} />
            <span className="truncate">Giao Tiếp</span>
          </button>
          <button
            onClick={() => setActiveTab('island')}
            className={`px-2.5 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] sm:min-h-[48px] ${
              activeTab === 'island'
                ? 'bg-white/70 backdrop-blur-xl border border-white text-slate-900 shadow-[0_8px_16px_rgba(0,0,0,0.1)] scale-[1.02]'
                : 'text-white hover:bg-white/20 border border-transparent'
            }`}
          >
            <MapPin className={`w-4 h-4 shrink-0 ${activeTab === 'island' ? 'text-amber-600' : 'text-amber-200'}`} />
            <span className="truncate">Đảo Dán</span>
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`px-2.5 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] sm:min-h-[48px] ${
              activeTab === 'badges'
                ? 'bg-white/70 backdrop-blur-xl border border-white text-slate-900 shadow-[0_8px_16px_rgba(0,0,0,0.1)] scale-[1.02]'
                : 'text-white hover:bg-white/20 border border-transparent'
            }`}
          >
            <Award className={`w-4 h-4 shrink-0 ${activeTab === 'badges' ? 'text-rose-600' : 'text-rose-200'}`} />
            <span className="truncate">Huy Hiệu</span>
          </button>
        </div>
      </div>

      {/* 6 Interactive Learning Zones as WORLD / HUB Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <Compass className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                6 Phân Khu Học Tập Theo Chủ Đề
              </h2>
              <p className="text-xs font-bold text-slate-400">
                Chạm vào từng phân khu để dịch chuyển tức thì
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
          {ISLAND_ZONES.map((zone) => {
            const isCurrent = activeZone === zone.id;
            const zoneWordsCount = COMPREHENSIVE_VOCABULARY.filter(
              (w) => zone.categoryFilter === 'all' || w.category === zone.categoryFilter
            ).length;

            return (
              <button
                key={zone.id}
                onClick={() => handleSelectZone(zone)}
                className={`relative p-3 sm:p-5 rounded-2xl sm:rounded-[28px] flex flex-col items-center text-center gap-2 sm:gap-2.5 transition-all duration-300 cursor-pointer select-none overflow-hidden ${
                  isCurrent
                    ? `bg-white shadow-[0_16px_32px_-6px_rgba(20,40,70,0.18)] scale-[1.03] -translate-y-1 ring-3 sm:ring-4 ${zone.activeRing}`
                    : 'bg-white hover:bg-slate-50/80 shadow-[0_6px_20px_-4px_rgba(20,40,70,0.06)] hover:shadow-md hover:-translate-y-0.5 border border-slate-100'
                }`}
              >
                {/* Soft background aura tint */}
                <div
                  className={`w-12 h-12 sm:w-18 sm:h-18 rounded-xl sm:rounded-2xl ${zone.tintBg} flex items-center justify-center p-2 sm:p-2.5 transform transition-transform duration-300 ${
                    isCurrent ? 'scale-105 filter drop-shadow-md' : 'hover:scale-105'
                  }`}
                >
                  <KidsIllustration
                    name={zone.illustration}
                    className="w-full h-full object-contain filter drop-shadow-xs"
                  />
                </div>

                <div className="w-full">
                  <p
                    className={`text-xs sm:text-sm font-black leading-tight ${
                      isCurrent ? 'text-slate-900' : 'text-slate-700'
                    }`}
                  >
                    {zone.nameVi}
                  </p>
                  <span className="text-[10px] font-bold text-slate-400 block mt-0.5 truncate">
                    {zone.nameEn}
                  </span>
                </div>

                {/* Word count pill */}
                <div className="mt-auto">
                  <span
                    className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full ${
                      isCurrent ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {zoneWordsCount > 0 ? `${zoneWordsCount} từ` : 'Khám phá'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================================================================ */}
      {/* TAB 1: ZONES & VOCABULARY EXPLORATION                            */}
      {/* ================================================================ */}
      {activeTab === 'zones' && (
        <div className="space-y-6">
          {/* Active Zone Spotlight Hero Header */}
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 p-6 sm:p-7 text-white shadow-[0_12px_32px_-6px_rgba(37,99,235,0.25)] flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center p-2.5 shadow-inner shrink-0">
                <KidsIllustration
                  name={currentZoneObj.illustration}
                  className="w-full h-full object-contain filter drop-shadow-md animate-gentle-float"
                />
              </div>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] sm:text-xs font-black uppercase tracking-wider text-sky-100">
                  <span>Phân Khu Hiện Tại</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
                  {currentZoneObj.nameVi} —{' '}
                  <span className="text-sky-200 text-base sm:text-lg font-bold">
                    {currentZoneObj.nameEn}
                  </span>
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-sky-100 mt-0.5 max-w-xl">
                  {currentZoneObj.descriptionVi}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-xs font-black shrink-0">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{filteredWords.length} Từ Vựng Đang Xem</span>
            </div>
          </div>

          {/* Visual Category Selection Grid (NO EMOJIS, vector illustrations, word counts) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>Danh Mục Từ Vựng</span>
              </span>
              <span className="text-xs font-bold text-slate-500">
                {filteredWords.length} từ khả dụng
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-2.5">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`p-3 rounded-2xl font-black transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 min-h-[96px] ${
                  selectedCategory === 'all'
                    ? 'bg-indigo-600 text-white shadow-[0_8px_20px_rgba(99,102,241,0.35)] scale-[1.03] -translate-y-0.5'
                    : 'bg-white text-slate-700 shadow-xs hover:shadow-md hover:-translate-y-0.5 border border-slate-100'
                }`}
              >
                <Sparkles
                  className={`w-6 h-6 ${
                    selectedCategory === 'all' ? 'text-amber-300' : 'text-indigo-500'
                  }`}
                />
                <span className="leading-tight text-xs mt-1">Tất Cả</span>
                <span
                  className={`text-[10px] font-bold ${
                    selectedCategory === 'all' ? 'text-indigo-200' : 'text-slate-400'
                  }`}
                >
                  {COMPREHENSIVE_VOCABULARY.length} từ
                </span>
              </button>

              {KIDS_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const catCount = COMPREHENSIVE_VOCABULARY.filter(
                  (w) => w.category === cat.id
                ).length;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-3 rounded-2xl font-black transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 min-h-[96px] overflow-hidden ${
                      isSelected
                        ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-[0_8px_20px_rgba(99,102,241,0.35)] scale-[1.03] -translate-y-0.5'
                        : 'bg-white text-slate-700 shadow-xs hover:shadow-md hover:-translate-y-0.5 border border-slate-100'
                    }`}
                  >
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                      <KidsIllustration
                        name={cat.illustration}
                        className="w-full h-full object-contain filter drop-shadow-2xs"
                      />
                    </div>
                    <p className="line-clamp-1 text-xs font-black leading-tight w-full mt-1">
                      {cat.nameVi}
                    </p>
                    <span
                      className={`text-[10px] font-bold ${
                        isSelected ? 'text-indigo-200' : 'text-slate-400'
                      }`}
                    >
                      {catCount > 0 ? `${catCount} từ` : 'Đang mở'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & Growth Stage Filter: Clean without heavy borders */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-3xl shadow-xs border border-slate-100">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm từ tiếng Anh hoặc nghĩa tiếng Việt..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 min-h-[42px]"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <span className="text-xs font-bold text-slate-500 hidden md:inline">
                Giai đoạn:
              </span>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'sprout', label: 'Mầm non' },
                { id: 'plant', label: 'Cây con' },
                { id: 'tree', label: 'Đại thụ' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStage(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border min-h-[38px] ${
                    selectedStage === st.id
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vocabulary Cards Grid (Floating illustration hero, zero box borders) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredWords.map((item) => {
              const stageBadge =
                item.stage === 'tree'
                  ? { label: 'Đại thụ', color: 'bg-emerald-100 text-emerald-950 border-emerald-300' }
                  : item.stage === 'plant'
                  ? { label: 'Cây con', color: 'bg-teal-100 text-teal-950 border-teal-300' }
                  : { label: 'Mầm non', color: 'bg-amber-100 text-amber-950 border-amber-300' };

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenWord(item)}
                  className="bg-white p-5 rounded-[28px] shadow-[0_8px_24px_-6px_rgba(20,40,70,0.06)] hover:shadow-[0_16px_32px_-6px_rgba(20,40,70,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4 cursor-pointer group border border-slate-100"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      {/* Free-floating illustration with gentle background tint */}
                      <div
                        className="relative z-10 shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-b from-sky-50 to-indigo-50/50 flex items-center justify-center p-2 group-hover:scale-105 group-hover:-translate-y-0.5 transition-transform filter drop-shadow-xs"
                        style={{ WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }}
                      >
                        <KidsIllustration
                          name={item.word}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span
                        className={`text-[11px] font-black px-3 py-1 rounded-full border ${stageBadge.color}`}
                      >
                        {stageBadge.label}
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <h3 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-wide break-words group-hover:text-indigo-600 transition-colors">
                          {item.word}
                        </h3>
                        <span className="text-xs font-bold text-slate-500">{item.phonetic}</span>
                      </div>
                      <p className="text-xs sm:text-sm font-black text-emerald-700 mt-0.5">
                        {item.viMeaning}
                      </p>

                      <div className="mt-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                        <p className="text-xs font-bold text-slate-950 flex items-center gap-1">
                          <ChevronRight className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>Cụm từ:</span>
                          <span className="italic font-black text-indigo-900">
                            "{item.phrase}"
                          </span>
                        </p>
                        <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>Câu:</span>
                          <span className="italic font-extrabold text-slate-800">
                            "{item.sentence}"
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Audio Controls Bar */}
                  <div
                    className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        soundManager.playDing();
                        voiceService.speakEnglish(item.word);
                      }}
                      className="flex-1 py-2 px-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-950 text-xs font-black flex items-center justify-center gap-1.5 border border-sky-200 cursor-pointer min-h-[40px] active:scale-95 transition-all shadow-2xs"
                      title="Nghe tiếng Anh"
                    >
                      <Volume2 className="w-4 h-4 text-sky-700" />
                      <span>Nghe từ</span>
                    </button>

                    <button
                      onClick={() => {
                        soundManager.playPop();
                        voiceService.speakVietnamese(item.viMeaning);
                      }}
                      className="flex-1 py-2 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-950 text-xs font-black flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer min-h-[40px] active:scale-95 transition-all shadow-2xs"
                      title="Nghe tiếng Việt"
                    >
                      <Languages className="w-4 h-4 text-rose-700" />
                      <span>Nghĩa</span>
                    </button>

                    <button
                      onClick={() => handleOpenWord(item)}
                      className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black flex items-center justify-center gap-1 shadow-xs cursor-pointer min-h-[40px] active:scale-95 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Chi tiết</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 2: DAILY COMMON COMMUNICATION PHRASES                        */}
      {/* ================================================================ */}
      {activeTab === 'phrases' && (
        <div className="space-y-6 bg-white/95 backdrop-blur-sm p-5 sm:p-7 rounded-[32px] shadow-sm border border-white/80">
          <div className="bg-sky-50/70 p-5 rounded-3xl border border-sky-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-950">
                Câu Giao Tiếp Hàng Ngày Cho Bé
              </h2>
              <p className="text-xs sm:text-sm font-bold text-slate-700">
                Luyện nói các mẫu câu chào hỏi, thể hiện tình cảm gia đình và lễ phép hàng ngày.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DAILY_PHRASES.map((phr) => (
              <div
                key={phr.id}
                className="bg-white p-5 sm:p-6 rounded-[28px] shadow-[0_8px_24px_-6px_rgba(20,40,70,0.06)] hover:shadow-[0_16px_32px_-6px_rgba(20,40,70,0.12)] hover:-translate-y-1 transition-all duration-300 space-y-3 border border-slate-100"
              >
                <div className="flex items-start justify-between">
                  <span className="px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs font-black text-sky-800">
                    {phr.categoryVi}
                  </span>
                  <span className="text-xs font-bold text-slate-500">{phr.pronunciationTip}</span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900">{phr.english}</h3>
                  <p className="text-sm font-black text-emerald-700 mt-0.5">{phr.vietnamese}</p>
                  <p className="text-xs font-bold text-slate-600 mt-1 flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{phr.contextVi}</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => {
                      soundManager.playDing();
                      voiceService.speakEnglish(phr.english);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-950 font-black text-xs flex items-center justify-center gap-1.5 border border-sky-200 cursor-pointer min-h-[40px] active:scale-95 transition-all shadow-2xs"
                  >
                    <Volume2 className="w-4 h-4 text-sky-700" />
                    <span>Nghe tiếng Anh</span>
                  </button>

                  <button
                    onClick={() => {
                      soundManager.playPop();
                      voiceService.speakVietnamese(phr.vietnamese);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-950 font-black text-xs flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer min-h-[40px] active:scale-95 transition-all shadow-2xs"
                  >
                    <Languages className="w-4 h-4 text-rose-700" />
                    <span>Tiếng Việt</span>
                  </button>

                  <button
                    onClick={() => {
                      soundManager.playDing();
                      voiceService.speakBilingual(phr.english, phr.vietnamese);
                    }}
                    className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-1.5 border border-emerald-600 cursor-pointer min-h-[40px] active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Đọc cả hai</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 3: MY ISLAND (INTERACTIVE STICKER MAP)                       */}
      {/* ================================================================ */}
      {activeTab === 'island' && (
        <div className="space-y-6 bg-white/95 backdrop-blur-sm p-5 sm:p-7 rounded-[32px] shadow-sm border border-white/80">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-950">Vương Quốc Đảo Của Bé</h2>
            <button
              onClick={() => setPlacedItems([])}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 min-h-[36px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Dọn sạch đảo</span>
            </button>
          </div>

          {/* Island Canvas */}
          <div
            onClick={(e) => {
              if (!selectedSticker) return;
              const sticker = STICKERS_DATA.find((s) => s.id === selectedSticker);
              if (!sticker) return;

              const rect = e.currentTarget.getBoundingClientRect();
              const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
              const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

              const newItem: PlacedItem = {
                id: Date.now().toString(),
                itemId: sticker.id,
                name: sticker.name,
                icon: sticker.icon,
                image: sticker.image,
                x: Math.max(10, Math.min(90, x)),
                y: Math.max(15, Math.min(85, y)),
              };

              soundManager.playPop();
              voiceService.speakEnglish(sticker.name);
              setPlacedItems((prev) => [...prev, newItem]);
              setSelectedSticker(null);
            }}
            className={`w-full h-80 sm:h-96 rounded-3xl relative overflow-hidden cursor-crosshair border-4 border-sky-300/80 bg-gradient-to-b from-sky-100 via-sky-50 to-emerald-50 transition-all ${
              selectedSticker ? 'ring-4 ring-emerald-400' : ''
            }`}
          >
            <div className="absolute inset-x-8 bottom-6 top-24 bg-gradient-to-b from-emerald-200/90 via-emerald-100 to-teal-50 rounded-[60px] border-4 border-emerald-300 shadow-inner flex items-center justify-center">
              <span className="text-xs font-black text-emerald-800/40 uppercase tracking-widest pointer-events-none">
                Đảo Nhiệt Đới Của Bé
              </span>
            </div>

            {placedItems.map((item) => (
              <div
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  soundManager.playDing();
                  voiceService.speakEnglish(item.name);
                }}
                style={{ left: `${item.x}%`, top: `${item.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group select-none hover:scale-125 transition-transform"
              >
                <div className="relative">
                  {item.image ? (
                    <img
                      src={kidAsset(item.image)}
                      alt={item.name}
                      className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-md animate-bounce-subtle pointer-events-none"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/kid/mascot/vivi-celebrate.png'; }}
                    />
                  ) : (
                    <span className="text-4xl sm:text-5xl drop-shadow-md animate-bounce-subtle">
                      {item.icon}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      soundManager.playPop();
                      setPlacedItems((prev) => prev.filter((i) => i.id !== item.id));
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}

            {selectedSticker && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-emerald-500 text-white font-black text-xs shadow-lg animate-bounce flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Chạm vào đảo để dán hình!</span>
              </div>
            )}
          </div>

          {/* Sticker Inventory */}
          <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
              Kho hình dán đã mở khóa:
            </h3>
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {STICKERS_DATA.map((sticker) => {
                const isSelected = selectedSticker === sticker.id;
                return (
                  <button
                    key={sticker.id}
                    onClick={() => {
                      soundManager.playPop();
                      setSelectedSticker(isSelected ? null : sticker.id);
                    }}
                    className={`p-2.5 rounded-2xl border-2 flex flex-col items-center gap-1.5 shrink-0 transition cursor-pointer min-w-[76px] min-h-[76px] ${
                      isSelected
                        ? 'bg-sky-500 border-sky-600 text-white scale-105 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:bg-sky-50/60'
                    }`}
                  >
                    {sticker.image ? (
                      <img
                        src={kidAsset(sticker.image)}
                        alt={sticker.name}
                        className="w-10 h-10 object-contain drop-shadow-2xs pointer-events-none"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/kid/mascot/vivi-study.png'; }}
                      />
                    ) : (
                      <span className="text-3xl">{sticker.icon}</span>
                    )}
                    <span className={`text-[10px] font-black truncate max-w-[70px] ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                      {sticker.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 4: BADGES & TROPHIES                                         */}
      {/* ================================================================ */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {BADGES_DATA.map((badge) => {
            const isUnlocked = badge.unlocked;
            return (
              <div
                key={badge.id}
                className={`p-6 rounded-3xl border-2 flex flex-col items-center text-center space-y-3 transition-all ${
                  isUnlocked
                    ? 'bg-white border-amber-300 shadow-sm'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div
                  className={`w-20 h-20 rounded-3xl flex items-center justify-center p-2 border-2 ${
                    isUnlocked
                      ? 'bg-amber-50 text-amber-950 border-amber-200'
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}
                >
                  {badge.image ? (
                    <img
                      src={kidAsset(badge.image)}
                      alt={badge.title}
                      className={`w-full h-full object-contain ${
                        isUnlocked ? 'drop-shadow-sm' : 'grayscale opacity-40'
                      }`}
                      onError={(e) => { (e.target as HTMLImageElement).src = '/kid/rewards/badge-first-word.png'; }}
                    />
                  ) : isUnlocked ? (
                    <Award className="w-8 h-8 text-amber-900" />
                  ) : (
                    <Lock className="w-8 h-8 text-slate-500" />
                  )}
                </div>

                <div>
                  <h3 className="font-black text-base text-slate-950">{badge.title}</h3>
                  <p className="text-xs font-bold text-slate-600 mt-1">{badge.description}</p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                    isUnlocked
                      ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                      : 'bg-slate-200 text-slate-600 border-slate-300'
                  }`}
                >
                  {isUnlocked ? 'Đã đạt được' : 'Chưa mở khóa'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ================================================================ */}
      {/* WORD DETAIL MODAL WITH AUTOMATIC PRONUNCIATION (Requirement #4)  */}
      {/* ================================================================ */}
      {activeWordModal && (
        <div className="fixed inset-0 z-[200] w-screen h-screen min-h-[100dvh] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn select-none">
          <div className="max-w-md w-full my-auto bg-white rounded-3xl border-2 border-sky-300 p-6 sm:p-8 space-y-6 animate-scale-up shadow-2xl relative">
            <button
              onClick={handleCloseWord}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer min-h-[36px]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-24 h-24 mx-auto rounded-3xl bg-sky-50 border border-sky-200 flex items-center justify-center p-2.5 animate-gentle-float shadow-inner">
                <KidsIllustration
                  name={activeWordModal.word.toLowerCase()}
                  className="w-full h-full object-contain filter drop-shadow-sm"
                  alt={activeWordModal.word}
                />
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-wide">
                  {activeWordModal.word}
                </h2>
                <p className="text-sm font-bold text-slate-700">{activeWordModal.phonetic}</p>
                <p className="text-xl font-black text-emerald-700 mt-1">
                  {activeWordModal.viMeaning}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 space-y-2 text-left">
              <div>
                <span className="text-[10px] font-black uppercase text-sky-900">Cụm từ mẫu:</span>
                <p className="text-xs font-black text-slate-900 italic">"{activeWordModal.phrase}"</p>
              </div>
              <div className="pt-2 border-t border-sky-200/70">
                <span className="text-[10px] font-black uppercase text-sky-900">Câu hoàn chỉnh:</span>
                <p className="text-xs font-black text-slate-900 italic">"{activeWordModal.sentence}"</p>
              </div>
            </div>

            {micFeedback && (
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-300 text-center text-xs font-black text-sky-950">
                {micFeedback}
              </div>
            )}

            {/* 4 DISTINCT ACTION BUTTONS (Requirement #4) */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleReplayEnglish}
                className="py-3 px-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs flex items-center justify-center gap-2 border-b-4 border-sky-700 active:scale-95 cursor-pointer min-h-[48px]"
              >
                <Volume2 className="w-4 h-4" />
                <span className="flex items-center gap-1.5">
                  Nghe lại <CountryFlag languageId="en" size="xs" />
                </span>
              </button>

              <button
                onClick={handleSpeakVietnamese}
                className="py-3 px-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs flex items-center justify-center gap-2 border-b-4 border-rose-700 active:scale-95 cursor-pointer min-h-[48px]"
              >
                <Languages className="w-4 h-4" />
                <span className="flex items-center gap-1.5">
                  Nghĩa <CountryFlag languageId="vi" size="xs" />
                </span>
              </button>

              <button
                onClick={handlePracticeMic}
                disabled={isListeningMic}
                className={`py-3 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border-b-4 active:scale-95 cursor-pointer min-h-[48px] ${
                  isListeningMic
                    ? 'bg-amber-400 text-slate-950 border-amber-600 animate-pulse'
                    : 'bg-amber-500 hover:bg-amber-600 text-white border-amber-700'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>{isListeningMic ? 'Đang nghe...' : 'Luyện nói'}</span>
              </button>

              <button
                onClick={handleSpeakSentence}
                className="py-3 px-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-2 border-b-4 border-emerald-700 active:scale-95 cursor-pointer min-h-[48px]"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Nghe cả câu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KidsMyWorldPage;
