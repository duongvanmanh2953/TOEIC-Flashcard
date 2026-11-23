import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useLearningContext } from '../contexts/LearningContext';
import { useFocus } from '../contexts/FocusContext';
import { CountryFlag } from '../components/language/CountryFlag';
import { playCorrectSound } from '@vocabflow/shared';
import {
  Headphones,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  FastForward,
  Rewind,
  Sparkles,
  Award,
  CheckCircle2,
  Clock,
  Radio,
  Sliders,
  Eye,
  EyeOff,
  Flame,
  Moon,
  Compass,
  PenTool,
  Check,
  X,
  Plus,
  BookOpen,
  ArrowRight,
  Shield,
  Coffee,
  CloudRain,
  Library,
  Maximize2,
  Minimize2,
  Globe,
  ExternalLink,
  Search,
  Filter,
  Layers,
  Languages,
} from 'lucide-react';

export const ListeningLabPage: React.FC = () => {
  const { user } = useAuth();
  const { activeLanguage } = useLearningContext();
  const navigate = useNavigate();

  // Focus Context synchronization
  const {
    isRunning: focusRunning,
    isPaused: focusPaused,
    secondsRemaining: focusSecondsRemaining,
    targetMinutes: focusTargetMinutes,
    todayFocusMinutes,
    todayCompletedSessions,
    startSession: startFocusSession,
    pauseSession: pauseFocusSession,
    resumeSession: resumeFocusSession,
    stopSession: stopFocusSession,
    openFullscreen: openFocusFullscreen,
  } = useFocus();

  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'PASSIVE' | 'FOCUS'>('ACTIVE');
  const [tracks, setTracks] = useState<any[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<any | null>(null);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Online Sample Library Modal / Drawer State
  const [showOnlineLibrary, setShowOnlineLibrary] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState<string>('ALL');
  const [customAudioUrl, setCustomAudioUrl] = useState<string>('');
  const [customAudioTitle, setCustomAudioTitle] = useState<string>('');

  // Audio Playback State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(100);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [abRepeatActive, setAbRepeatActive] = useState<boolean>(false);
  const [repeatSentenceIdx, setRepeatSentenceIdx] = useState<number | null>(null);
  const [isSpeakingTts, setIsSpeakingTts] = useState<boolean>(false);

  // Active Listening Specifics
  const [hideTranscript, setHideTranscript] = useState<boolean>(true);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(0);
  const [segmentViewFilter, setSegmentViewFilter] = useState<'ALL' | 'ACTIVE' | 'REPEAT'>('ALL');
  const [showSegmentTranslations, setShowSegmentTranslations] = useState<boolean>(true);
  const segmentRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [dictationInput, setDictationInput] = useState<string>('');
  const [dictationChecked, setDictationChecked] = useState<boolean>(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [capturedWords, setCapturedWords] = useState<string[]>([]);

  // Focus specific local state
  const [focusSelectedTarget, setFocusSelectedTarget] = useState<number>(25);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  const fetchLabData = async () => {
    setLoading(true);
    try {
      const [tracksRes, statsRes]: any = await Promise.all([
        api.get('/listening-lab/tracks', { params: { languageId: activeLanguage.id } }),
        api.get('/listening-lab/stats', { params: { languageId: activeLanguage.id } }),
      ]);
      const trks = tracksRes.data || tracksRes || [];
      setTracks(trks);
      setStats(statsRes.data || statsRes || null);
      if (trks.length > 0 && !selectedTrack) {
        setSelectedTrack(trks[0]);
      }
    } catch (err) {
      console.error('Failed to load listening data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabData();
  }, [activeLanguage.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);

      if (abRepeatActive && selectedTrack?.segments && repeatSentenceIdx !== null) {
        const seg = selectedTrack.segments[repeatSentenceIdx];
        if (seg && audio.currentTime >= seg.endTime) {
          audio.currentTime = seg.startTime;
          audio.play().catch(() => {});
        }
      }

      if (selectedTrack?.segments) {
        const idx = selectedTrack.segments.findIndex(
          (s: any) => audio.currentTime >= s.startTime && audio.currentTime <= s.endTime
        );
        if (idx !== -1 && idx !== activeSegmentIndex) {
          setActiveSegmentIndex(idx);
        }
      }
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration || selectedTrack?.durationSeconds || 100);
    };

    const onEnded = () => {
      setIsPlaying(false);
      if (activeTab === 'PASSIVE' && selectedTrack) {
        api.post('/listening-lab/passive/track', {
          audioId: selectedTrack.id,
          languageId: activeLanguage.id,
          durationSeconds: Math.round(audio.duration || 100),
          playedSeconds: Math.round(audio.currentTime || 100),
          isCompleted: true,
        }).catch(() => {});
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    if ('mediaSession' in navigator && selectedTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: selectedTrack.title,
        artist: selectedTrack.speaker || 'VocabFlow Audio',
        album: `VocabFlow ${activeLanguage.name} Listening Lab`,
        artwork: [
          { src: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=512', sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        audio.play().catch(() => {});
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        audio.pause();
        setIsPlaying(false);
      });
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        audio.currentTime = Math.max(0, audio.currentTime - 15);
      });
      navigator.mediaSession.setActionHandler('seekforward', () => {
        audio.currentTime = Math.min(audio.duration, audio.currentTime + 15);
      });
    }

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [selectedTrack, abRepeatActive, repeatSentenceIdx, activeTab, activeSegmentIndex]);

  // Smooth scroll active sentence into view (only when on active listening transcript view)
  useEffect(() => {
    if (activeTab === 'ACTIVE' && segmentRefs.current[activeSegmentIndex]) {
      segmentRefs.current[activeSegmentIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activeSegmentIndex, activeTab]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleJumpToSegment = (segIdx: number) => {
    if (!audioRef.current || !selectedTrack?.segments) return;
    const seg = selectedTrack.segments[segIdx];
    if (seg) {
      audioRef.current.currentTime = seg.startTime;
      setActiveSegmentIndex(segIdx);
      if (!isPlaying) {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const handleToggleAbRepeat = (segIdx: number) => {
    if (abRepeatActive && repeatSentenceIdx === segIdx) {
      setAbRepeatActive(false);
      setRepeatSentenceIdx(null);
    } else {
      setAbRepeatActive(true);
      setRepeatSentenceIdx(segIdx);
      handleJumpToSegment(segIdx);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleSpeakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = playbackSpeed;
    if (activeLanguage.id === 'zh') {
      utterance.lang = 'zh-CN';
    } else if (activeLanguage.id === 'ja') {
      utterance.lang = 'ja-JP';
    } else if (activeLanguage.id === 'ko') {
      utterance.lang = 'ko-KR';
    } else if (activeLanguage.id === 'fr') {
      utterance.lang = 'fr-FR';
    } else if (activeLanguage.id === 'de') {
      utterance.lang = 'de-DE';
    } else {
      utterance.lang = 'en-US';
    }

    utterance.onstart = () => setIsSpeakingTts(true);
    utterance.onend = () => setIsSpeakingTts(false);
    utterance.onerror = () => setIsSpeakingTts(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleCaptureWord = (word: string) => {
    if (!capturedWords.includes(word)) {
      setCapturedWords([...capturedWords, word]);
      playCorrectSound();
    }
  };

  const handleSubmitActiveQuiz = async () => {
    if (!selectedTrack) return;
    setQuizSubmitted(true);
    let correctCount = 0;
    (selectedTrack.quizzes || []).forEach((q: any, idx: number) => {
      if (quizAnswers[idx] === q.answer) correctCount++;
    });

    const score = Math.round((correctCount / Math.max(1, selectedTrack.quizzes.length)) * 100);
    playCorrectSound();

    try {
      await api.post('/listening-lab/active/submit', {
        audioId: selectedTrack.id,
        languageId: activeLanguage.id,
        durationSeconds: Math.round(duration),
        playedSeconds: Math.round(currentTime),
        comprehensionScore: score,
        capturedWords,
        transcriptRevealed: !hideTranscript,
      });
      const statsRes: any = await api.get('/listening-lab/stats', { params: { languageId: activeLanguage.id } });
      setStats(statsRes.data || statsRes);
    } catch (err) {
      console.error('Error submitting active listening', err);
    }
  };

  const handleLoadCustomAudio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAudioUrl.trim()) return;

    const newTrack = {
      id: `custom-${Date.now()}`,
      languageId: activeLanguage.id,
      title: customAudioTitle.trim() || 'Bài Nghe Trực Tuyến Tự Nạp',
      category: 'IMMERSION',
      level: 'Tùy chỉnh',
      durationSeconds: 180,
      audioUrl: customAudioUrl.trim(),
      speaker: 'Tài nguyên từ Internet',
      accent: 'Tự chọn',
      overview: 'Bài nghe được nạp trực tiếp từ liên kết âm thanh bên ngoài.',
      segments: [],
      quizzes: [],
      dictationSentence: '',
      sourceName: 'Internet Audio Stream',
      sourceUrl: customAudioUrl.trim(),
    };

    setTracks([newTrack, ...tracks]);
    setSelectedTrack(newTrack);
    setCustomAudioUrl('');
    setCustomAudioTitle('');
    setShowOnlineLibrary(false);
    playCorrectSound();
  };

  const filteredOnlineTracks = tracks.filter((t) => {
    if (libraryFilter === 'ALL') return true;
    if (libraryFilter === 'BUSINESS') return t.category === 'CONVERSATION';
    if (libraryFilter === 'TRAVEL') return t.category === 'TRAVEL';
    if (libraryFilter === 'STORY') return t.category === 'MINI_STORY' || t.category === 'PODCAST';
    if (libraryFilter === 'SLEEP') return t.category === 'SLEEP';
    return true;
  });

  return (
    <div className="w-full space-y-6 animate-fade-in pb-16">
      <audio
        ref={audioRef}
        src={selectedTrack?.audioUrl || 'https://ia803102.us.archive.org/7/items/englishaudio/03_Work_Tasks_and_Responsibilities_-_Zapp_English_Vocabulary_for_Work_2.3.mp3'}
        preload="metadata"
      />

      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-black uppercase tracking-wider border border-blue-400/30">
              <CountryFlag languageId={activeLanguage.id} size="xs" />
              <span>Phòng Luyện Nghe & Tập Trung • LISTENING LAB</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Luyện Nghe Chủ Động & Thẩm Thấu Đa Tầng
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium leading-relaxed">
              Tích hợp bài nghe thực tế từ Internet (VOA Special English, Zapp Work Audio, LibriVox Stories),
              phương pháp Blind Listening, A-B Repeat phân đoạn và đồng hồ tập trung Fullscreen toàn cục.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowOnlineLibrary(true)}
              className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-black text-white flex items-center gap-2 transition shadow-md backdrop-blur-md"
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Thư Viện Bài Mẫu Trực Tuyến</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Nghe chủ động</span>
                <p className="text-base font-black text-blue-300 mt-0.5">
                  {stats?.activeListeningMinutes || 18} <span className="text-[11px] font-semibold">phút</span>
                </p>
              </div>
              <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Thẩm thấu thụ động</span>
                <p className="text-base font-black text-emerald-300 mt-0.5">
                  {stats?.passiveExposureMinutes || 42} <span className="text-[11px] font-semibold">phút</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Core Mode Tabs */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-2.5">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 border ${
              activeTab === 'ACTIVE'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/40 border-blue-400/60 ring-2 ring-white/20'
                : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white border-white/10'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Active Listening (Nghe Chủ Động)</span>
          </button>

          <button
            onClick={() => setActiveTab('PASSIVE')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 border ${
              activeTab === 'PASSIVE'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/40 border-blue-400/60 ring-2 ring-white/20'
                : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white border-white/10'
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>Passive Immersion (Nghe Thụ Động & Nền)</span>
          </button>

          <button
            onClick={() => setActiveTab('FOCUS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 border ${
              activeTab === 'FOCUS'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/40 border-blue-400/60 ring-2 ring-white/20'
                : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white border-white/10'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>Deep Focus Mode (Tập Trung Toàn Màn Hình)</span>
          </button>
        </div>
      </div>

      {activeTab === 'ACTIVE' && selectedTrack && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                      {selectedTrack.category} • LEVEL {selectedTrack.level}
                    </span>
                    {selectedTrack.sourceName && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Globe className="w-3 h-3 text-emerald-500" />
                        <span>{selectedTrack.sourceName}</span>
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    {selectedTrack.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Giọng đọc: {selectedTrack.speaker} ({selectedTrack.accent})
                  </p>
                </div>

                <button
                  onClick={() => setHideTranscript(!hideTranscript)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                    hideTranscript
                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {hideTranscript ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{hideTranscript ? 'Lần 1: Đang ẩn phụ đề (Blind)' : 'Đã hiện phụ đề'}</span>
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
                  <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
                </div>

                <div
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ratio = (e.clientX - rect.left) / rect.width;
                    if (audioRef.current) {
                      audioRef.current.currentTime = ratio * duration;
                    }
                  }}
                  className="relative w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden cursor-pointer"
                >
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-100"
                    style={{ width: `${(currentTime / Math.max(1, duration)) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 15);
                    }}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
                    title="Lùi lại 15 giây"
                  >
                    <Rewind className="w-4 h-4" />
                  </button>

                  <button
                    onClick={togglePlayPause}
                    className="w-12 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transition transform hover:scale-105"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                  </button>

                  <button
                    onClick={() => {
                      if (audioRef.current) audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 15);
                    }}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
                    title="Tiến 15 giây"
                  >
                    <FastForward className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  {[0.75, 1.0, 1.25, 1.5].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => handleSpeedChange(spd)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black transition ${
                        playbackSpeed === spd
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Sentence Segmentation (Sentence Segmentation & A-B Repeat) */}
              <div className="space-y-4 pt-5 border-t border-slate-200 dark:border-slate-800">
                {/* Header & Sub-Navigation Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                          Phân Đoạn Từng Câu & A-B Repeat
                        </h3>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80">
                          {selectedTrack.segments?.length || 0} câu
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        Luyện nghe từng câu, lặp đoạn âm vị chuẩn và rút trích từ vựng vào Sổ tay.
                      </p>
                    </div>
                  </div>

                  {/* Toggle bilingual translation */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => setShowSegmentTranslations(!showSegmentTranslations)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-2xs ${
                        showSegmentTranslations
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                      title="Bật hoặc ẩn bản dịch song ngữ tiếng Việt"
                    >
                      <Languages className="w-3.5 h-3.5 text-blue-500" />
                      <span>{showSegmentTranslations ? 'Bản dịch: Đang hiện' : 'Bản dịch: Đang ẩn'}</span>
                    </button>
                  </div>
                </div>

                {/* Filter Tabs Bar for Segmentation */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-slate-100/90 dark:bg-slate-800/90 rounded-2xl border border-slate-200/90 dark:border-slate-700/80">
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    <button
                      onClick={() => setSegmentViewFilter('ALL')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                        segmentViewFilter === 'ALL'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-500'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700/70'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Tất cả ({selectedTrack.segments?.length || 0})</span>
                    </button>

                    <button
                      onClick={() => setSegmentViewFilter('ACTIVE')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                        segmentViewFilter === 'ACTIVE'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-500'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700/70'
                      }`}
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>Đang phát (Câu {activeSegmentIndex + 1})</span>
                    </button>

                    <button
                      onClick={() => setSegmentViewFilter('REPEAT')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                        segmentViewFilter === 'REPEAT'
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 ring-1 ring-amber-500'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700/70'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>
                        {abRepeatActive && repeatSentenceIdx !== null
                          ? `Đang lặp câu ${repeatSentenceIdx + 1}`
                          : 'Lặp A-B'}
                      </span>
                    </button>
                  </div>

                  {abRepeatActive && repeatSentenceIdx !== null && (
                    <button
                      onClick={() => {
                        setAbRepeatActive(false);
                        setRepeatSentenceIdx(null);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-[11px] font-bold border border-rose-300 dark:border-rose-800 transition flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      <span>Hủy lặp A-B</span>
                    </button>
                  )}
                </div>

                {/* Segments List */}
                <div className="space-y-3">
                  {(selectedTrack.segments || [])
                    .filter((_: any, idx: number) => {
                      if (segmentViewFilter === 'ACTIVE') return idx === activeSegmentIndex;
                      if (segmentViewFilter === 'REPEAT') {
                        if (repeatSentenceIdx !== null) return idx === repeatSentenceIdx;
                        return true;
                      }
                      return true;
                    })
                    .map((seg: any) => {
                      const realIdx = (selectedTrack.segments || []).findIndex((s: any) => s.id === seg.id);
                      const idx = realIdx !== -1 ? realIdx : 0;
                      const isCurrent = activeSegmentIndex === idx;
                      const isLooping = abRepeatActive && repeatSentenceIdx === idx;

                      return (
                        <div
                          key={seg.id}
                          ref={(el) => {
                            segmentRefs.current[idx] = el;
                          }}
                          className={`group p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden ${
                            isCurrent
                              ? isLooping
                                ? 'border-amber-500 bg-gradient-to-r from-amber-100/90 via-orange-50/70 to-amber-50/80 dark:from-amber-950/70 dark:via-orange-950/40 dark:to-slate-900 shadow-lg shadow-amber-500/15 ring-2 ring-amber-400/40'
                                : 'border-blue-500 bg-gradient-to-r from-blue-100/85 via-indigo-50/75 to-blue-50/90 dark:from-blue-950/80 dark:via-indigo-950/50 dark:to-slate-900 shadow-lg shadow-blue-500/15 ring-2 ring-blue-500/25'
                              : 'border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/70 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition'
                          }`}
                        >
                          {/* Left Accent Bar for Active Sentence */}
                          {isCurrent && (
                            <div
                              className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                                isLooping
                                  ? 'bg-gradient-to-b from-amber-500 via-orange-500 to-amber-600'
                                  : 'bg-gradient-to-b from-blue-600 via-indigo-600 to-blue-700'
                              }`}
                            />
                          )}

                          <div className="space-y-3 pl-1">
                            {/* Segment Top Bar: Metadata & Status */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-lg border ${
                                    isCurrent
                                      ? isLooping
                                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                        : 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  Câu {idx + 1}
                                </span>

                                <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700/80">
                                  {seg.startTime}s - {seg.endTime}s
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {isLooping ? (
                                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs animate-pulse ring-2 ring-amber-300 dark:ring-amber-500">
                                    <RotateCcw className="w-3 h-3 animate-spin" />
                                    <span>Đang lặp A-B liên tục</span>
                                  </div>
                                ) : isCurrent ? (
                                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                                    <span className="flex items-end gap-0.5 h-2.5">
                                      <span className="w-0.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                      <span className="w-0.5 h-2.5 bg-white rounded-full animate-bounce"></span>
                                      <span className="w-0.5 h-2 bg-white rounded-full animate-pulse"></span>
                                    </span>
                                    <span>Đang phát câu này</span>
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            {/* Sentence English Text */}
                            <p
                              className={`text-sm sm:text-base font-extrabold leading-relaxed transition ${
                                isCurrent
                                  ? 'text-slate-950 dark:text-white'
                                  : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {hideTranscript ? '••••••••••••••••••••••••••••••••••••••••••••••••••••••' : seg.text}
                            </p>

                            {/* Vietnamese Translation */}
                            {!hideTranscript && showSegmentTranslations && (
                              <div
                                className={`text-xs font-semibold leading-relaxed p-2.5 rounded-xl border ${
                                  isCurrent
                                    ? 'bg-white/80 dark:bg-slate-900/90 text-blue-950 dark:text-blue-100 border-blue-200/90 dark:border-blue-900/80 shadow-2xs'
                                    : 'bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200/70 dark:border-slate-700/70'
                                }`}
                              >
                                <div className="flex items-start gap-1.5">
                                  <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                                    Dịch:
                                  </span>
                                  <span>{seg.translation}</span>
                                </div>
                              </div>
                            )}

                            {/* Extracted Words to Notebook */}
                            {!hideTranscript && seg.words && seg.words.length > 0 && (
                              <div className="pt-1 space-y-1.5">
                                <div className="flex items-center gap-1 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                  <Sparkles className="w-3 h-3 text-amber-500" />
                                  <span>Từ vựng trọng tâm trong câu:</span>
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                  {seg.words.map((w: any, wIdx: number) => {
                                    const isCaptured = capturedWords.includes(w.word);
                                    return (
                                      <button
                                        key={wIdx}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCaptureWord(w.word);
                                        }}
                                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs border ${
                                          isCaptured
                                            ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                                            : isCurrent
                                            ? 'bg-white dark:bg-slate-800 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white hover:border-blue-600'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600'
                                        }`}
                                        title={
                                          isCaptured
                                            ? 'Đã lưu từ này vào Sổ tay'
                                            : `Lưu từ "${w.word}" vào Sổ tay từ vựng (${w.meaning})`
                                        }
                                      >
                                        {isCaptured ? (
                                          <Check className="w-3 h-3 text-emerald-600" />
                                        ) : (
                                          <Plus className="w-3 h-3" />
                                        )}
                                        <span className="font-extrabold">{w.word}</span>
                                        <span className="text-[10px] opacity-75 font-normal">{w.ipa}</span>
                                        <span className="text-[10px] text-slate-400 group-hover:text-white font-medium">
                                          • {w.meaning}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Action Buttons for this Segment */}
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                              <button
                                onClick={() => handleJumpToSegment(idx)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-xs ${
                                  isCurrent && isPlaying
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                                    : 'bg-white dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                }`}
                                title="Nghe câu này từ audio gốc"
                              >
                                {isCurrent && isPlaying ? (
                                  <Pause className="w-3.5 h-3.5" />
                                ) : (
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                )}
                                <span>{isCurrent && isPlaying ? 'Đang phát' : 'Phát câu này'}</span>
                              </button>

                              <button
                                onClick={() => handleSpeakText(seg.text)}
                                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-bold transition flex items-center gap-1.5"
                                title="Nghe phát âm chuẩn giọng bản xứ (TTS AI)"
                              >
                                <Volume2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                <span>Phát âm mẫu</span>
                              </button>

                              <button
                                onClick={() => handleToggleAbRepeat(idx)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                                  isLooping
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30 ring-2 ring-amber-400 border border-amber-600'
                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-amber-600 hover:border-amber-400 dark:hover:border-amber-600'
                                }`}
                                title={
                                  isLooping
                                    ? 'Dừng lặp A-B cho câu này'
                                    : 'Bật lặp lại vô hạn câu này (A-B Repeat)'
                                }
                              >
                                <RotateCcw className={`w-3.5 h-3.5 ${isLooping ? 'animate-spin' : ''}`} />
                                <span>{isLooping ? 'Đang lặp A-B' : 'Lặp A-B'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {selectedTrack.dictationSentence && (
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-blue-600" />
                    <span>Chế Độ Chép Chính Tả (Dictation Mode)</span>
                  </h3>
                  <span className="text-xs font-bold text-blue-600">Phản xạ âm thanh & ký tự</span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Nghe kỹ audio hoặc bấm loa phát âm để gõ lại nguyên văn câu văn dưới đây.
                </p>

                <textarea
                  value={dictationInput}
                  onChange={(e) => setDictationInput(e.target.value)}
                  placeholder="Gõ lại câu bạn nghe được tại đây..."
                  rows={2}
                  className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.currentTime = 0;
                          audioRef.current.play().catch(() => {});
                          setIsPlaying(true);
                        }
                      }}
                      className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Nghe lại audio</span>
                    </button>

                    <button
                      onClick={() => handleSpeakText(selectedTrack.dictationSentence)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 ml-2"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Đọc chậm câu này</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setDictationChecked(true)}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 transition"
                  >
                    Kiểm tra độ chính xác
                  </button>
                </div>

                {dictationChecked && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                    <span className="font-bold text-slate-400 uppercase text-[10px]">Đáp án chuẩn:</span>
                    <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                      {selectedTrack.dictationSentence}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6">
            {selectedTrack.quizzes && selectedTrack.quizzes.length > 0 && (
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Bài Kiểm Tra Nghe Hiểu</span>
                  </h3>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                    Sát hạch
                  </span>
                </div>

                <div className="space-y-4">
                  {selectedTrack.quizzes.map((quiz: any, qIdx: number) => (
                    <div key={qIdx} className="space-y-2.5">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {qIdx + 1}. {quiz.question}
                      </p>

                      <div className="space-y-1.5">
                        {quiz.options.map((opt: string, optIdx: number) => {
                          const isSelected = quizAnswers[qIdx] === opt;
                          const isCorrect = opt === quiz.answer;
                          return (
                            <button
                              key={optIdx}
                              onClick={() => setQuizAnswers({ ...quizAnswers, [qIdx]: opt })}
                              className={`w-full p-3 rounded-xl border text-xs font-semibold text-left transition ${
                                isSelected
                                  ? quizSubmitted
                                    ? isCorrect
                                      ? 'bg-emerald-500 text-white border-emerald-600'
                                      : 'bg-rose-500 text-white border-rose-600'
                                    : 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-300'
                                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <p className="text-[11px] text-slate-500 leading-relaxed italic">
                          Giải thích: {quiz.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSubmitActiveQuiz}
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-500/25 transition"
                >
                  {quizSubmitted ? 'Đã nộp bài đánh giá' : 'Nộp bài & Cập nhật Mastery'}
                </button>
              </div>
            )}

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Bài nghe mẫu {activeLanguage.name}
                </span>
                <button
                  onClick={() => setShowOnlineLibrary(true)}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>Thêm bài mẫu</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {tracks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTrack(t);
                      setQuizSubmitted(false);
                      setDictationChecked(false);
                      setDictationInput('');
                    }}
                    className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                      selectedTrack?.id === t.id
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-extrabold'
                        : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <p className="text-xs truncate font-bold">{t.title}</p>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">{t.category} • {t.level}</span>
                    </div>
                    <Play className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'PASSIVE' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Easy Daily Conversations (Cà Phê & Đời Sống)',
                desc: 'Hội thoại tự nhiên từ các quán cà phê, văn phòng và phố xá từ kho tài nguyên mở.',
                icon: <Coffee className="w-5 h-5 text-amber-500" />,
                bg: 'bg-amber-500/10 border-amber-500/20',
                onClick: () => {
                  const t = tracks.find((x) => x.id === 'trk-passive-1');
                  if (t) setSelectedTrack(t);
                },
              },
              {
                title: 'Sleep Listening (Âm Thanh Dịu & Thẩm Thấu Vô Thức)',
                desc: 'Thẩm thấu vô thức trước giờ ngủ cùng giọng đọc chậm rãi và âm thanh thiên nhiên.',
                icon: <Moon className="w-5 h-5 text-indigo-500" />,
                bg: 'bg-indigo-500/10 border-indigo-500/20',
                onClick: () => {
                  const t = tracks.find((x) => x.id === 'trk-passive-2');
                  if (t) setSelectedTrack(t);
                },
              },
              {
                title: 'VOA American Stories (Văn Học & Nghệ Thuật Kể Chuyện)',
                desc: 'Truyện ngắn kinh điển của Ambrose Bierce và O. Henry đọc bằng tiếng Anh chuẩn mực.',
                icon: <BookOpen className="w-5 h-5 text-emerald-500" />,
                bg: 'bg-emerald-500/10 border-emerald-500/20',
                onClick: () => {
                  const t = tracks.find((x) => x.id === 'trk-passive-3');
                  if (t) setSelectedTrack(t);
                },
              },
            ].map((cat, idx) => (
              <div
                key={idx}
                onClick={cat.onClick}
                className={`p-5 rounded-3xl border ${cat.bg} space-y-2 cursor-pointer hover:scale-[1.02] transition`}
              >
                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-xs">
                  {cat.icon}
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {cat.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {cat.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Background Audio & Lock-Screen Ready
              </span>
              <h3 className="text-xl font-black">
                {selectedTrack?.title || 'Daily Immersion Playlist'}
              </h3>
              <p className="text-xs text-slate-400 font-medium max-w-md">
                Phát nền khi chuyển sang ứng dụng khác. Hệ thống tự động ghi nhận thời gian thẩm thấu exposure thực tế.
              </p>
              {selectedTrack?.sourceName && (
                <p className="text-[11px] text-slate-500">
                  Nguồn: {selectedTrack.sourceName}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={togglePlayPause}
                className="w-16 h-16 rounded-3xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xl shadow-blue-500/40 transition transform hover:scale-105"
              >
                {isPlaying ? <Pause className="w-7 h-7 fill-white" /> : <Play className="w-7 h-7 fill-white ml-1" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'FOCUS' && (
        <div className="max-w-2xl mx-auto p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-8 animate-fade-in">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs uppercase tracking-wider mb-2">
              <Coffee className="w-3.5 h-3.5" />
              <span>Pomodoro Deep Focus</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Không Gian Tập Trung Cao Độ (Focus Engine)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Đồng hồ đếm giây hoạt động đồng bộ trên toàn hệ thống (Global Layout Header), cho phép bạn vừa học vừa di chuyển giữa các trang mà không bị ngắt quãng.
            </p>
          </div>

          {!focusRunning && (
            <div className="flex items-center justify-center gap-3">
              {[15, 25, 45, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setFocusSelectedTarget(mins)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black transition border ${
                    focusSelectedTarget === mins
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {mins} phút
                </button>
              ))}
            </div>
          )}

          <div className="w-56 h-56 rounded-full border-4 border-indigo-500/30 flex flex-col items-center justify-center mx-auto relative shadow-inner">
            <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
              {Math.floor(focusSecondsRemaining / 60).toString().padStart(2, '0')}:
              {(focusSecondsRemaining % 60).toString().padStart(2, '0')}
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
              {focusRunning ? (focusPaused ? 'Đang tạm dừng' : 'Đang đếm giây (Global Layout)') : 'Sẵn sàng bắt đầu'}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {!focusRunning ? (
              <button
                onClick={() => startFocusSession(focusSelectedTarget)}
                className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-xl shadow-blue-500/30 transition transform hover:scale-105 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Bắt Đầu Tập Trung Ngay</span>
              </button>
            ) : (
              <>
                <button
                  onClick={focusPaused ? resumeFocusSession : pauseFocusSession}
                  className={`px-6 py-3.5 rounded-2xl text-white font-black text-sm shadow-xl transition flex items-center gap-2 ${
                    focusPaused ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {focusPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4 fill-white" />}
                  <span>{focusPaused ? 'Tiếp tục' : 'Tạm dừng'}</span>
                </button>

                <button
                  onClick={() => setShowExitConfirm(true)}
                  className="px-4 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-rose-600 font-bold text-xs transition"
                >
                  Kết thúc sớm
                </button>
              </>
            )}

            <button
              onClick={openFocusFullscreen}
              className="px-5 py-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs transition flex items-center gap-2"
              title="Mở toàn màn hình không phân tâm"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Bật Toàn Màn Hình (Fullscreen)</span>
            </button>
          </div>

          {showExitConfirm && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs space-y-2">
              <p className="font-bold">Bạn có chắc muốn dừng phiên tập trung?</p>
              <p className="text-[11px]">Hệ thống vẫn bảo toàn số phút bạn đã học mà không trừ điểm nào.</p>
              <div className="flex justify-center gap-3 pt-1">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-bold"
                >
                  Tiếp tục
                </button>
                <button
                  onClick={() => {
                    stopFocusSession(false);
                    setShowExitConfirm(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold"
                >
                  Xác nhận dừng
                </button>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around text-xs text-slate-500">
            <div>
              <span className="font-bold text-slate-400 uppercase text-[10px]">Thời gian hôm nay</span>
              <p className="text-base font-black text-slate-900 dark:text-white">{todayFocusMinutes} phút</p>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
            <div>
              <span className="font-bold text-slate-400 uppercase text-[10px]">Phiên hoàn thành</span>
              <p className="text-base font-black text-slate-900 dark:text-white">{todayCompletedSessions} phiên</p>
            </div>
          </div>
        </div>
      )}

      {showOnlineLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Thư Viện Bài Nghe Mẫu Trực Tuyến
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Nguồn tài liệu mở từ VOA Special English, Zapp English và LibriVox Audiobooks.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowOnlineLibrary(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
              {[
                { id: 'ALL', label: 'Tất cả bài mẫu' },
                { id: 'BUSINESS', label: 'Công sở (Business)' },
                { id: 'TRAVEL', label: 'Du lịch & Sân bay' },
                { id: 'STORY', label: 'Truyện VOA & Văn học' },
                { id: 'SLEEP', label: 'Nghe khi ngủ' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setLibraryFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl shrink-0 transition ${
                    libraryFilter === f.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-3">
              {filteredOnlineTracks.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/60 transition bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                        {t.category} • {t.level}
                      </span>
                      {t.sourceName && (
                        <span className="text-[10px] text-slate-400 font-medium truncate max-w-xs">
                          {t.sourceName}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {t.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {t.overview}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedTrack(t);
                      setShowOnlineLibrary(false);
                      setQuizSubmitted(false);
                      setDictationChecked(false);
                      setDictationInput('');
                      playCorrectSound();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 transition"
                  >
                    Chọn bài này
                  </button>
                </div>
              ))}

              <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20 space-y-3 mt-4">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                  <span>Nạp bài nghe từ liên kết Internet (Custom MP3 URL)</span>
                </span>

                <form onSubmit={handleLoadCustomAudio} className="space-y-2">
                  <input
                    type="text"
                    value={customAudioTitle}
                    onChange={(e) => setCustomAudioTitle(e.target.value)}
                    placeholder="Tiêu đề bài nghe (Ví dụ: BBC 6 Minute English...)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                  />
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={customAudioUrl}
                      onChange={(e) => setCustomAudioUrl(e.target.value)}
                      placeholder="Dán link audio công khai (.mp3 hoặc .ogg)..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shrink-0"
                    >
                      Nạp bài
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
