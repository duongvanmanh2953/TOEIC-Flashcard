import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLearningContext } from '../contexts/LearningContext';
import { getLanguage, SUPPORTED_LANGUAGES } from '../config/languages';
import { GlassCard } from '../components/common/GlassCard';
import { ModalPortal } from '../components/common/ModalPortal';
import { AddLanguageModal } from '../components/language/AddLanguageModal';
import { ResetLanguageModal } from '../components/language/ResetLanguageModal';
import { CountryFlag } from '../components/language/CountryFlag';
import { audioEngine } from '../lib/audioEngine';
import {
  Globe,
  Plus,
  Flame,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  BookOpen,
  Volume2,
  Award,
  TrendingUp,
  RotateCcw,
  Layers,
  ChevronRight,
} from 'lucide-react';

export const MyLanguagesPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeLanguage,
    userLanguages,
    learningProfiles,
    switchLanguage,
    getLanguageStats,
  } = useLearningContext();

  const [showAddModal, setShowAddModal] = useState(false);
  const [resetTargetLang, setResetTargetLang] = useState<any | null>(null);
  const [playingWordKey, setPlayingWordKey] = useState<string | null>(null);

  const stats = getLanguageStats();

  // Cross-Language comparison data for core phrases
  const COMPARISON_ITEMS = [
    {
      meaning: 'Xin chào',
      translations: [
        { langId: 'en', word: 'Hello', phonetic: '/həˈloʊ/' },
        { langId: 'de', word: 'Guten Tag', phonetic: '/ˈɡuːtn̩ ˈtaːk/' },
        { langId: 'es', word: 'Hola', phonetic: '/ˈo.la/' },
        { langId: 'zh', word: '你好 (nǐ hǎo)', phonetic: 'nǐ hǎo' },
        { langId: 'th', word: 'สวัสดี (sawasdee)', phonetic: 'sa-wat-dee' },
      ],
    },
    {
      meaning: 'Cảm ơn',
      translations: [
        { langId: 'en', word: 'Thank you', phonetic: '/ˈθæŋk juː/' },
        { langId: 'de', word: 'Danke', phonetic: '/ˈdaŋkə/' },
        { langId: 'es', word: 'Gracias', phonetic: '/ˈɡɾa.sjas/' },
        { langId: 'zh', word: '谢谢 (xièxie)', phonetic: 'xiè xie' },
        { langId: 'th', word: 'ขอบคุณ (khop khun)', phonetic: 'khop-khun' },
      ],
    },
    {
      meaning: 'Nước uống',
      translations: [
        { langId: 'en', word: 'Water', phonetic: '/ˈwɔː.tər/' },
        { langId: 'de', word: 'das Wasser', phonetic: '/ˈvasɐ/' },
        { langId: 'es', word: 'el agua', phonetic: '/ˈa.ɣwa/' },
        { langId: 'zh', word: '水 (shuǐ)', phonetic: 'shuǐ' },
        { langId: 'th', word: 'น้ำ (nam)', phonetic: 'nam' },
      ],
    },
  ];

  const handlePlayComparisonAudio = (langId: string, word: string) => {
    const key = `${langId}_${word}`;
    if (playingWordKey === key) return;

    setPlayingWordKey(key);
    const langDef = getLanguage(langId);
    audioEngine.playWord(word.replace(/\(.*?\)/g, '').trim(), {
      lang: langDef.speechLocale,
      rate: 1.0,
      onStart: () => setPlayingWordKey(key),
      onEnd: () => setPlayingWordKey(null),
      onError: () => setPlayingWordKey(null),
    });
  };

  return (
    <div className="w-full space-y-6 animate-fade-in pb-12">
      {/* 1. Header & Polyglot Overview */}
      <GlassCard variant="liquid" className="p-5 sm:p-7 relative overflow-hidden bg-white/95 dark:bg-slate-900/95 border border-indigo-500/25 rounded-3xl shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider border border-indigo-500/20">
              <Globe className="w-4 h-4" />
              <span>Polyglot Journey • Hành Trình Đa Ngôn Ngữ</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Không Gian Đa Ngôn Ngữ Của Bạn
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Một tài khoản duy nhất — chinh phục nhiều ngôn ngữ. Mỗi ngôn ngữ sở hữu không gian học tập, tiến trình và chuỗi ngày học độc lập.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn-glass-primary text-xs sm:text-sm !py-3 !px-5 gap-2 shadow-lg shadow-indigo-500/30 shrink-0 self-start md:self-center font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm ngôn ngữ học mới</span>
          </button>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-200/60 dark:border-slate-800/60 relative z-10">
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Đang học</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.totalLanguages} <span className="text-xs font-semibold text-slate-400">ngôn ngữ</span>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tổng từ vựng</p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {stats.totalWordsAcrossLanguages} <span className="text-xs font-semibold text-slate-400">từ</span>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tổng điểm XP</p>
            <p className="text-2xl font-black text-amber-500 mt-1">
              {stats.totalXPAcrossLanguages.toLocaleString()} <span className="text-xs font-semibold text-slate-400">XP</span>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Không gian kích hoạt</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
              <CountryFlag languageId={activeLanguage.id} countryCode={activeLanguage.countryCode} size="sm" />
              <span className="text-base truncate">{activeLanguage.name}</span>
            </p>
          </div>
        </div>
      </GlassCard>

      {/* 2. Active Learning Spaces Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Các không gian ngôn ngữ đã kích hoạt</span>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {userLanguages.length}
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userLanguages.map((langId) => {
            const lang = getLanguage(langId);
            const profile = learningProfiles[langId] || {
              languageId: langId,
              level: lang.defaultLevel,
              dailyGoal: 15,
              dailyWordGoal: 20,
              goalCategory: 'Conversation',
              currentStreak: 0,
              longestStreak: 0,
              wordsLearned: 0,
              masteryPercent: 0,
              xp: 0,
              createdAt: Date.now(),
              lastActiveAt: Date.now(),
            };
            const isActive = langId === activeLanguage.id;

            return (
              <GlassCard
                key={langId}
                variant="liquid"
                className={`p-5 rounded-3xl relative overflow-hidden transition-all duration-300 ${
                  isActive
                    ? 'border-2 border-indigo-500 shadow-xl bg-white dark:bg-slate-900 ring-4 ring-indigo-500/10'
                    : 'border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 hover:border-indigo-400/60'
                }`}
              >
                {/* Header: Flag, Name, Active Badge */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <CountryFlag languageId={lang.id} countryCode={lang.countryCode} size="lg" />
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{lang.nativeName}</span>
                        <span className="text-xs font-normal text-slate-400">({lang.name})</span>
                      </h3>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                        Trình độ: {profile.level}
                      </p>
                    </div>
                  </div>

                  {isActive ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Đang học</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => switchLanguage(langId)}
                      className="px-3 py-1 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition border border-indigo-500/20"
                    >
                      Kích hoạt
                    </button>
                  )}
                </div>

                {/* Metrics */}
                <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40">
                    <p className="text-[10px] text-slate-400 font-bold">Chuỗi ngày</p>
                    <p className="text-sm font-black text-amber-500 mt-0.5 flex items-center justify-center gap-0.5">
                      <Flame className="w-3.5 h-3.5 fill-amber-500" />
                      <span>{profile.currentStreak || 0}d</span>
                    </p>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40">
                    <p className="text-[10px] text-slate-400 font-bold">Từ vựng</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                      {profile.wordsLearned || 0}
                    </p>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40">
                    <p className="text-[10px] text-slate-400 font-bold">Điểm XP</p>
                    <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {profile.xp || 0}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!isActive) await switchLanguage(langId);
                      navigate('/review');
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
                  >
                    <span>Ôn tập ngay</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setResetTargetLang(lang)}
                    className="p-2 rounded-xl text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title={`Đặt lại tiến trình ${lang.name}`}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* 3. Cross-Language Expression Comparison Table */}
      <GlassCard variant="liquid" className="p-5 sm:p-7 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800/80 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Khám Phá & So Sánh Đa Ngôn Ngữ (Cross-Language Explorer)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cùng một ý niệm, lắng nghe cách phát âm đặc sắc qua các nền ngôn ngữ khác nhau
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {COMPARISON_ITEMS.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Ý niệm: <span className="text-slate-900 dark:text-white font-extrabold text-sm">{item.meaning}</span>
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {item.translations.map((t) => {
                  const key = `${t.langId}_${t.word}`;
                  const isPlaying = playingWordKey === key;

                  return (
                    <div
                      key={t.langId}
                      onClick={() => handlePlayComparisonAudio(t.langId, t.word)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between group ${
                        isPlaying
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-400'
                      }`}
                      title="Bấm để nghe phát âm chuẩn"
                    >
                      <div className="min-w-0 pr-1 truncate">
                        <div className="flex items-center gap-1.5">
                          <CountryFlag languageId={t.langId} size="xs" />
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {t.word}
                          </p>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                          {t.phonetic}
                        </p>
                      </div>

                      <Volume2
                        className={`w-3.5 h-3.5 shrink-0 transition ${
                          isPlaying
                            ? 'text-indigo-600 dark:text-indigo-400 animate-pulse'
                            : 'text-slate-400 group-hover:text-indigo-500'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Modals */}
      <AddLanguageModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      {resetTargetLang && (
        <ResetLanguageModal
          isOpen={Boolean(resetTargetLang)}
          language={resetTargetLang}
          onClose={() => setResetTargetLang(null)}
        />
      )}
    </div>
  );
};
