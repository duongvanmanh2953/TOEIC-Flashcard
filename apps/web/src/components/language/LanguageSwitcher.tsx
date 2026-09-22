import React, { useState, useRef, useEffect } from 'react';
import { useLearningContext } from '../../contexts/LearningContext';
import { getLanguage, LanguageDefinition, SUPPORTED_LANGUAGES } from '../../config/languages';
import {
  ChevronDown,
  Flame,
  Plus,
  Search,
  Check,
  Globe,
  Sparkles,
  Award,
  Layers,
  X,
} from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';
import { AddLanguageModal } from './AddLanguageModal';

interface LanguageSwitcherProps {
  variant?: 'header' | 'mobile' | 'compact';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'header',
  className = '',
}) => {
  const {
    activeLanguage,
    activeProfile,
    userLanguages,
    learningProfiles,
    switchLanguage,
    availableLanguages,
  } = useLearningContext();

  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const panelRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filtered available languages for search
  const filteredLanguages = availableLanguages.filter((lang) => {
    const matchesSearch =
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = selectedRegion === 'All' || lang.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  const handleSelectLanguage = async (langId: string) => {
    // If user is already learning this language, switch to it
    if (userLanguages.includes(langId)) {
      await switchLanguage(langId);
      setIsOpen(false);
    } else {
      // If not added yet, open the Add Language wizard pre-selected
      setIsOpen(false);
      setShowAddModal(true);
    }
  };

  return (
    <div className={`relative ${className}`} ref={panelRef}>
      {/* Trigger Button: Header Pill */}
      {variant === 'compact' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold flex items-center gap-1.5 transition border border-slate-200/60 dark:border-slate-700/60"
          title="Chuyển đổi không gian học"
        >
          <span className="text-base leading-none">{activeLanguage.flag}</span>
          <span className="truncate">{activeLanguage.nativeName}</span>
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 px-2.5 sm:px-3 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-900 dark:text-white text-xs font-bold flex items-center gap-2 transition border border-slate-200/80 dark:border-slate-700/80 shadow-xs group"
          title="Chọn ngôn ngữ đang học"
        >
          <span className="text-base leading-none group-hover:scale-110 transition-transform">
            {activeLanguage.flag}
          </span>
          <span className="truncate font-extrabold">{activeLanguage.nativeName}</span>

          {activeProfile.currentStreak > 0 && (
            <span className="hidden sm:flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-extrabold bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20">
              <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span>{activeProfile.currentStreak}d</span>
            </span>
          )}

          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
            }`}
          />
        </button>
      )}

      {/* Dropdown Panel — Desktop & Tablet */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Không gian học tập
                </p>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Your Learning Languages
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Active / Subscribed Languages List */}
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
              {userLanguages.map((langId) => {
                const lang = getLanguage(langId);
                const profile = learningProfiles[langId] || activeProfile;
                const isActive = langId === activeLanguage.id;

                return (
                  <div
                    key={langId}
                    onClick={() => handleSelectLanguage(langId)}
                    className={`p-2.5 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                      isActive
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-500/40 shadow-xs'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl leading-none shrink-0">{lang.flag}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {lang.nativeName}
                          </p>
                          <span className="text-[10px] text-slate-400 truncate">
                            ({lang.name})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            {profile.level}
                          </span>
                          <span>•</span>
                          <span>{profile.wordsLearned || 0} từ</span>
                          {profile.currentStreak > 0 && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                                <Flame className="w-2.5 h-2.5 fill-amber-500" />
                                {profile.currentStreak}d
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {isActive && (
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action: + Add Language */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowAddModal(true);
              }}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-indigo-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm ngôn ngữ học mới</span>
            </button>
          </div>

          {/* Search & Discover Other World Languages */}
          <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm ngôn ngữ khác..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Region Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] scrollbar-none">
              {['All', 'Europe', 'Asia', 'Americas'].map((region) => (
                <button
                  key={region}
                  type="button"
                  onClick={() => setSelectedRegion(region)}
                  className={`px-2 py-0.5 rounded-lg font-bold shrink-0 transition ${
                    selectedRegion === region
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>

            {/* Filtered Languages Grid */}
            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-0.5">
              {filteredLanguages.map((lang) => {
                const isAlreadyLearning = userLanguages.includes(lang.id);

                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => handleSelectLanguage(lang.id)}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-left transition group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{lang.flag}</span>
                      <div className="min-w-0 truncate">
                        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                          {lang.name}
                        </p>
                        <p className="text-[9px] text-slate-400 truncate">
                          {lang.nativeName}
                        </p>
                      </div>
                    </div>

                    {isAlreadyLearning ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Đang học" />
                    ) : (
                      <Plus className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add Language 5-Step Modal */}
      {showAddModal && (
        <ModalPortal>
          <AddLanguageModal onClose={() => setShowAddModal(false)} />
        </ModalPortal>
      )}
    </div>
  );
};
