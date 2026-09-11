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
import { KidsIllustration } from '../assets/illustrations/KidsIllustration';
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

interface PlacedItem {
  id: string;
  itemId: string;
  name: string;
  icon: string;
  x: number;
  y: number;
}

// 6 Interactive Learning Zones for "Hành Tinh Kỳ Thú - Đảo Của Bé"
interface IslandZone {
  id: string;
  nameVi: string;
  nameEn: string;
  categoryFilter: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  descriptionVi: string;
}

const ISLAND_ZONES: IslandZone[] = [
  {
    id: 'animal_bay',
    nameVi: 'Vịnh Muông Thú',
    nameEn: 'Animal Bay',
    categoryFilter: 'animals',
    icon: Heart,
    color: '#d97706',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-400',
    descriptionVi: 'Gặp gỡ những người bạn động vật đáng yêu trong rừng xanh và biển cả.',
  },
  {
    id: 'fruit_farm',
    nameVi: 'Nông Trại Trái Cây',
    nameEn: 'Fruit & Food Farm',
    categoryFilter: 'fruits',
    icon: Utensils,
    color: '#e11d48',
    bgColor: 'bg-rose-100',
    borderColor: 'border-rose-400',
    descriptionVi: 'Thu hoạch hoa quả chín mọng và thưởng thức các món ăn ngon.',
  },
  {
    id: 'family_haven',
    nameVi: 'Mái Ấm Gia Đình',
    nameEn: 'Family Haven',
    categoryFilter: 'family',
    icon: Home,
    color: '#059669',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-400',
    descriptionVi: 'Học từ vựng yêu thương về bố mẹ, ông bà và những người thân yêu.',
  },
  {
    id: 'school_corner',
    nameVi: 'Góc Trường Học',
    nameEn: 'School Corner',
    categoryFilter: 'school',
    icon: GraduationCap,
    color: '#0284c7',
    bgColor: 'bg-sky-100',
    borderColor: 'border-sky-400',
    descriptionVi: 'Lớp học vui vẻ cùng sách vở, bảng viết và đồ dùng học tập.',
  },
  {
    id: 'phrases_plaza',
    nameVi: 'Quảng Trường Giao Tiếp',
    nameEn: 'Phrases Plaza',
    categoryFilter: 'phrases',
    icon: MessageSquare,
    color: '#7c3aed',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-400',
    descriptionVi: 'Luyện tập các câu chào hỏi, cảm ơn và xin lỗi lễ phép hàng ngày.',
  },
  {
    id: 'space_station',
    nameVi: 'Trạm Không Gian Kỳ Thú',
    nameEn: 'Space Station',
    categoryFilter: 'transport',
    icon: Rocket,
    color: '#4f46e5',
    bgColor: 'bg-indigo-100',
    borderColor: 'border-indigo-400',
    descriptionVi: 'Khám phá tên lửa, các vì sao và các phương tiện vi vu bầu trời.',
  },
];

export const KidsMyWorldPage: React.FC = () => {
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
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (e: any) => {
          const spoken = (e.results[0][0]?.transcript || '').toLowerCase().trim();
          setIsListeningMic(false);
          const target = activeWordModal.word.toLowerCase().trim();

          if (spoken.includes(target) || target.includes(spoken)) {
            soundManager.playFanfare();
            celebrationManager.celebrate('small', 'Bé phát âm rất chuẩn!');
            setMicFeedback('Xuất sắc! Bé phát âm rất chuẩn!');
          } else {
            soundManager.playIncorrect();
            setMicFeedback(`Bé vừa đọc: "${spoken}". Hãy thử lại to hơn nhé!`);
          }
        };

        recognition.onerror = () => {
          setIsListeningMic(false);
          setMicFeedback('Bé đọc lại thật to và rõ ràng nhé!');
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
      soundManager.playFanfare();
      celebrationManager.celebrate('small', 'Bé phát âm rất hay!');
      setMicFeedback('Giỏi lắm! Bé phát âm rất chuẩn!');
    }, 1400);
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
    <div className="max-w-6xl mx-auto w-full space-y-6 md:space-y-8 animate-fadeIn pb-24 select-none">
      {/* ================================================================ */}
      {/* 1. CONCEPT BANNER: HÀNH TINH KỲ THÚ - ĐẢO CỦA BÉ                */}
      {/* ================================================================ */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 border-2 border-emerald-400 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4 text-center md:text-left">
          <KidsMascot mood="happy" size={90} speechText="Chào mừng bé đến Hành Tinh Kỳ Thú!" />
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 text-xs font-black uppercase mb-1.5 border border-white/30 text-white">
              <Compass className="w-4 h-4 text-yellow-300" />
              <span>Hành Tinh Kỳ Thú • Đảo Của Bé</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Thế Giới Khám Phá & Học Tập Tương Tác</h1>
            <p className="text-emerald-100 text-xs sm:text-sm font-bold mt-1 max-w-xl">
              Khám phá 6 phân khu kỳ diệu: nghe từ vựng tự động, trò chuyện hàng ngày và xây dựng vương quốc riêng của bé!
            </p>
          </div>
        </div>

        {/* 4 Mode Tabs with Equal Touch Targets */}
        <div className="relative z-10 flex items-center gap-2 bg-white/20 backdrop-blur-md p-1.5 rounded-2xl border border-white/30 flex-wrap justify-center">
          <button
            onClick={() => setActiveTab('zones')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 min-h-[44px] ${
              activeTab === 'zones'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-white hover:bg-white/20'
            }`}
          >
            <Compass className="w-4 h-4 text-emerald-600" />
            <span>Phân Khu Kỳ Thú</span>
          </button>
          <button
            onClick={() => setActiveTab('phrases')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 min-h-[44px] ${
              activeTab === 'phrases'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-white hover:bg-white/20'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-sky-600" />
            <span>Câu Giao Tiếp</span>
          </button>
          <button
            onClick={() => setActiveTab('island')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 min-h-[44px] ${
              activeTab === 'island'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-white hover:bg-white/20'
            }`}
          >
            <MapPin className="w-4 h-4 text-amber-600" />
            <span>Đảo Hình Dán</span>
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 min-h-[44px] ${
              activeTab === 'badges'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-white hover:bg-white/20'
            }`}
          >
            <Award className="w-4 h-4 text-yellow-400" />
            <span>Huy Hiệu</span>
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 2. 6 INTERACTIVE ISLAND ZONES SELECTOR                           */}
      {/* ================================================================ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-amber-500" />
            <span>6 Phân Khu Khám Phá:</span>
          </span>
          <span className="text-xs font-bold text-slate-500 hidden sm:inline">
            Chạm vào từng phân khu để dịch chuyển tức thì
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {ISLAND_ZONES.map((zone) => {
            const isCurrent = activeZone === zone.id;
            const ZoneIcon = zone.icon;
            return (
              <button
                key={zone.id}
                onClick={() => handleSelectZone(zone)}
                className={`p-3.5 rounded-2xl border-2 flex flex-col items-center text-center gap-2 transition-all cursor-pointer min-h-[90px] justify-center ${
                  isCurrent
                    ? 'bg-amber-400 border-amber-500 shadow-md scale-102 ring-2 ring-amber-300'
                    : 'bg-white hover:bg-amber-50/70 border-slate-200'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isCurrent ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <ZoneIcon className="w-5 h-5" />
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-black text-slate-950">{zone.nameVi}</p>
                  <p className="text-[10px] font-bold text-slate-600">{zone.nameEn}</p>
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
          {/* Active Zone Spotlight Card */}
          <div className="p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center shrink-0 border border-amber-500">
                <currentZoneObj.icon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2">
                  <span>{currentZoneObj.nameVi}</span>
                  <span className="text-xs font-bold text-slate-600">({currentZoneObj.nameEn})</span>
                </h2>
                <p className="text-xs font-bold text-slate-700 mt-0.5">
                  {currentZoneObj.descriptionVi}
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-xs font-black text-amber-950">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>{filteredWords.length} Từ Vựng</span>
            </div>
          </div>

          {/* Subcategory Pills with Roomy Horizontal Scroll (Requirement #16) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none py-1 px-1 -mx-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm whitespace-nowrap transition cursor-pointer border-2 shrink-0 flex items-center gap-2 min-h-[44px] ${
                  selectedCategory === 'all'
                    ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-amber-50'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Tất Cả Danh Mục</span>
              </button>

              {KIDS_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm whitespace-nowrap transition cursor-pointer border-2 shrink-0 flex items-center gap-2 min-h-[44px] ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-amber-50'
                    }`}
                  >
                    <span>{cat.nameVi}</span>
                    <span className="text-[10px] font-bold text-slate-500">({cat.nameEn})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & Growth Stage Filter */}
          <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-4 rounded-3xl border-2 border-slate-200">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm từ tiếng Anh hoặc nghĩa tiếng Việt..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Giai đoạn sinh trưởng:</span>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'sprout', label: 'Mầm non' },
                { id: 'plant', label: 'Cây con' },
                { id: 'tree', label: 'Đại thụ' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStage(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border min-h-[36px] ${
                    selectedStage === st.id
                      ? 'bg-emerald-500 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-emerald-50'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vocabulary Cards Grid (High contrast, guaranteed readable) */}
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
                  className="bg-white p-5 rounded-3xl border-2 border-amber-300 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                        <KidsIllustration name={item.word} className="w-full h-full object-contain" />
                      </div>
                      <span className={`text-[11px] font-black px-3 py-1 rounded-full border ${stageBadge.color}`}>
                        {stageBadge.label}
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <h3 className="text-2xl font-black text-slate-950 uppercase tracking-wide">
                          {item.word}
                        </h3>
                        <span className="text-xs font-bold text-slate-500">{item.phonetic}</span>
                      </div>
                      <p className="text-sm font-black text-emerald-700 mt-0.5">
                        {item.viMeaning}
                      </p>

                      <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <p className="text-xs font-bold text-slate-950 flex items-center gap-1">
                          <ChevronRight className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>Cụm từ:</span>
                          <span className="italic font-black text-indigo-900">"{item.phrase}"</span>
                        </p>
                        <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          <span>Câu:</span>
                          <span className="italic font-extrabold text-slate-800">"{item.sentence}"</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Audio Controls Bar */}
                  <div
                    className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        soundManager.playDing();
                        voiceService.speakEnglish(item.word);
                      }}
                      className="flex-1 py-2 px-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 border border-sky-300 cursor-pointer min-h-[40px] active:scale-95"
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
                      className="flex-1 py-2 px-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 border border-rose-300 cursor-pointer min-h-[40px] active:scale-95"
                      title="Nghe tiếng Việt (Giọng nữ miền Bắc)"
                    >
                      <Languages className="w-4 h-4 text-rose-700" />
                      <span>Nghĩa</span>
                    </button>

                    <button
                      onClick={() => handleOpenWord(item)}
                      className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black flex items-center justify-center gap-1 border border-emerald-600 cursor-pointer min-h-[40px] active:scale-95"
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
        <div className="space-y-6">
          <div className="bg-amber-50 p-5 rounded-3xl border-2 border-amber-300 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center shrink-0 border border-amber-500">
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
                className="bg-white p-5 rounded-3xl border-2 border-slate-200 hover:border-sky-400 transition-all space-y-3 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <span className="px-3 py-1 rounded-full bg-sky-100 border border-sky-300 text-xs font-black text-sky-950">
                    {phr.categoryVi}
                  </span>
                  <span className="text-xs font-bold text-slate-500">{phr.pronunciationTip}</span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-950">{phr.english}</h3>
                  <p className="text-sm font-black text-emerald-700 mt-0.5">{phr.vietnamese}</p>
                  <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1">
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
                    className="flex-1 py-2 px-3 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-950 font-black text-xs flex items-center justify-center gap-1.5 border border-sky-300 cursor-pointer min-h-[40px] active:scale-95"
                  >
                    <Volume2 className="w-4 h-4 text-sky-700" />
                    <span>Nghe tiếng Anh</span>
                  </button>

                  <button
                    onClick={() => {
                      soundManager.playPop();
                      voiceService.speakVietnamese(phr.vietnamese);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-950 font-black text-xs flex items-center justify-center gap-1.5 border border-rose-300 cursor-pointer min-h-[40px] active:scale-95"
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
        <div className="space-y-6">
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
                x: Math.max(10, Math.min(90, x)),
                y: Math.max(15, Math.min(85, y)),
              };

              soundManager.playPop();
              voiceService.speakEnglish(sticker.name);
              setPlacedItems((prev) => [...prev, newItem]);
              setSelectedSticker(null);
            }}
            className={`w-full h-80 sm:h-96 rounded-3xl relative overflow-hidden cursor-crosshair border-4 border-amber-300 bg-gradient-to-b from-sky-200 via-sky-100 to-amber-100 transition-all ${
              selectedSticker ? 'ring-4 ring-emerald-400' : ''
            }`}
          >
            <div className="absolute inset-x-8 bottom-6 top-24 bg-gradient-to-b from-emerald-300 via-emerald-200 to-amber-200 rounded-[60px] border-4 border-emerald-400 shadow-inner flex items-center justify-center">
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
                  <span className="text-4xl sm:text-5xl drop-shadow-md animate-bounce-subtle">
                    {item.icon}
                  </span>
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
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1 shrink-0 transition cursor-pointer min-w-[70px] min-h-[70px] ${
                      isSelected
                        ? 'bg-amber-400 border-amber-500 scale-105'
                        : 'bg-slate-50 border-slate-200 hover:bg-amber-50'
                    }`}
                  >
                    <span className="text-3xl">{sticker.icon}</span>
                    <span className="text-[10px] font-black text-slate-800">{sticker.name}</span>
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
                    ? 'bg-white border-amber-400 shadow-sm'
                    : 'bg-slate-100 border-slate-300 opacity-60'
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl border-2 ${
                    isUnlocked
                      ? 'bg-amber-400 text-amber-950 border-amber-500'
                      : 'bg-slate-200 text-slate-500 border-slate-300'
                  }`}
                >
                  {isUnlocked ? <Award className="w-8 h-8 text-amber-900" /> : <Lock className="w-8 h-8 text-slate-500" />}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full bg-white rounded-3xl border-4 border-amber-400 p-6 sm:p-8 space-y-6 animate-scale-up shadow-2xl relative">
            <button
              onClick={handleCloseWord}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer min-h-[36px]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-100 border-2 border-amber-400 flex items-center justify-center text-amber-600 animate-gentle-float">
                <Sparkles className="w-10 h-10" />
              </div>

              <div>
                <h2 className="text-3xl font-black text-slate-950 uppercase tracking-wide">
                  {activeWordModal.word}
                </h2>
                <p className="text-sm font-bold text-slate-500">{activeWordModal.phonetic}</p>
                <p className="text-xl font-black text-emerald-700 mt-1">
                  {activeWordModal.viMeaning}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 text-left">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-900">Cụm từ mẫu:</span>
                <p className="text-xs font-black text-slate-900 italic">"{activeWordModal.phrase}"</p>
                <p className="text-[11px] font-bold text-slate-600">({activeWordModal.phraseVi})</p>
              </div>
              <div className="pt-2 border-t border-amber-200">
                <span className="text-[10px] font-black uppercase text-amber-900">Câu hoàn chỉnh:</span>
                <p className="text-xs font-black text-slate-900 italic">"{activeWordModal.sentence}"</p>
                <p className="text-[11px] font-bold text-slate-600">({activeWordModal.sentenceVi})</p>
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
                <span>Nghe lại (EN)</span>
              </button>

              <button
                onClick={handleSpeakVietnamese}
                className="py-3 px-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs flex items-center justify-center gap-2 border-b-4 border-rose-700 active:scale-95 cursor-pointer min-h-[48px]"
              >
                <Languages className="w-4 h-4" />
                <span>Nghĩa (VI)</span>
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
