import React, { useState, useEffect, useRef } from 'react';
import { KidActivity } from '../curriculum/kidsCurriculum';
import { kidsSpeech } from '../services/speech/KidsSpeechManager';
import { kidsSound } from '../services/sound/KidsSoundManager';
import { kidsAnimationManager } from '../services/animation/KidsAnimationManager';
import {
  KidsListenIcon,
  KidsSpeakIcon,
  KidsStarIcon,
  KidsSparkleIcon,
  KidsPlayIcon,
  KidsCheckIcon,
} from '../assets/icons/KidsIcons';
import { KidsMascot, MascotMood } from './KidsMascot';
import { celebrationManager } from '../services/celebration/CelebrationManager';
import { Play, RotateCcw, Volume2, Mic, CheckCircle2, Headphones, Sparkles, BookOpen } from 'lucide-react';
import { evaluatePronunciation } from '../../lib/pronunciationEvaluator';
import { useLearningContext } from '../../contexts/LearningContext';
import { KidsIllustration } from '../assets/illustrations/KidsIllustration';

export type ActivityState =
  | 'loading'
  | 'instruction'
  | 'audioPlaying'
  | 'waitingForUser'
  | 'userAnswering'
  | 'processing'
  | 'feedback'
  | 'completed';

interface ActivityProps {
  activity: KidActivity;
  onDone: (success: boolean, score?: number, weakWord?: string) => void;
  onBusyStateChange?: (isBusy: boolean) => void;
}

const renderActivityVisual = (target?: string, emoji?: string, sizeCls = 'w-32 h-32 sm:w-40 sm:h-40') => {
  const candidate = (target || '').toLowerCase().trim();
  const words = candidate.split(/[\s,!-]+/);
  const matched = words.find((w) =>
    [
      'cat', 'dog', 'rabbit', 'lion', 'elephant', 'bear', 'monkey', 'frog', 'bird', 'duck', 'fish', 'fox', 'panda', 'tiger', 'penguin', 'giraffe', 'zebra', 'turtle', 'dolphin', 'whale', 'butterfly', 'bee', 'owl',
      'apple', 'banana', 'pizza', 'burger', 'milk', 'bread', 'carrot', 'strawberry', 'cookie',
      'car', 'bus', 'train', 'rocket', 'airplane', 'boat', 'bicycle',
      'book', 'pencil', 'sun', 'star', 'cloud', 'hello', 'goodbye', 'name', 'friend', 'happy'
    ].includes(w)
  );

  const visualName = matched || words[0] || candidate;
  if (visualName) {
    return (
      <div className={`${sizeCls} flex items-center justify-center`}>
        <KidsIllustration
          name={visualName}
          className="w-full h-full object-contain filter drop-shadow-md select-none transform hover:scale-105 transition-transform"
          alt={target || 'illustration'}
        />
      </div>
    );
  }

  return (
    <span className="text-7xl sm:text-8xl select-none filter drop-shadow-sm">
      {emoji || '🌟'}
    </span>
  );
};

// =========================================================================
// 1. FLASHCARD ACTIVITY COMPONENT
// State Machine: loading -> instruction -> audioPlaying -> waitingForUser -> userAnswering -> processing -> feedback -> completed
// =========================================================================
const FlashcardActivity: React.FC<ActivityProps> = ({ activity, onDone, onBusyStateChange }) => {
  const { activeLanguage } = useLearningContext();
  const effectiveSpeechLocale = activeLanguage?.speechLocale || 'en-US';
  const [state, setState] = useState<ActivityState>('loading');
  const [mascotMood, setMascotMood] = useState<MascotMood>('speaking');
  const [isFlipped, setIsFlipped] = useState(true);
  const [speechFeedback, setSpeechFeedback] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasVoiceInput, setHasVoiceInput] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const animFrameRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);

  const viMeaning =
    (activity as any).vietnameseWord ||
    kidsSpeech.getViMeaning(activity.targetWord || '');

  // Notify parent of busy state (cannot advance if recording or processing)
  useEffect(() => {
    const isBusy = state === 'audioPlaying' || state === 'userAnswering' || state === 'processing';
    onBusyStateChange?.(isBusy);
  }, [state, onBusyStateChange]);

  // Step 1: Teacher Bobby introduces word with bilingual speech
  const startTeacherExplanation = () => {
    if (!activity.targetWord) return;
    cleanupAudio();
    setState('audioPlaying');
    setMascotMood('speaking');
    setSpeechFeedback(null);
    setIsFlipped(true);

    kidsSpeech.explainAndPromptRepeat(activity.targetWord, viMeaning, {
      onStart: () => {
        setMascotMood('speaking');
      },
      onReadyForChild: () => {
        // Teacher speech completed -> prompt child to repeat
        setState('waitingForUser');
        setMascotMood('listening');
      },
    });
  };

  // Step 2: Child starts speaking / recording session
  const startChildRecording = () => {
    setState('userAnswering');
    setMascotMood('listening');
    setRecordingSeconds(0);
    setHasVoiceInput(false);
    kidsSound.play('pop');

    // Timer tracking recording duration
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    const targetWord = (activity.targetWord || '').toLowerCase().trim();

    // Web Speech Recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = effectiveSpeechLocale;

        recognition.onresult = (e: any) => {
          const spoken = (e.results?.[0]?.[0]?.transcript || '').trim();
          const evalRes = evaluatePronunciation(targetWord, spoken, 'kid');
          setHasVoiceInput(true);
          // Wait briefly after word detected so child finishes
          setTimeout(() => {
            handleFinishSpeaking(evalRes.isPassing, evalRes.score, evalRes.feedback);
          }, 600);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (_) {}
    }

    // Microphone amplitude meter via Web Audio API with silence detection
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })
        .then((stream) => {
          mediaStreamRef.current = stream;
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioCtx();
            if (audioCtx.state === 'suspended') {
              audioCtx.resume().catch(() => {});
            }
            audioContextRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            let spokeOnce = false;

            const checkVolume = () => {
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
              }
              const average = sum / bufferLength;
              setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));

              // Child vocalization detected
              if (average > 32) {
                if (!spokeOnce) {
                  spokeOnce = true;
                  setHasVoiceInput(true);
                }
                // Reset silence countdown while child is speaking
                if (silenceTimerRef.current) {
                  clearTimeout(silenceTimerRef.current);
                  silenceTimerRef.current = null;
                }
              } else if (spokeOnce) {
                // If child has spoken and is now silent for 1.8s, wrap up gently
                if (!silenceTimerRef.current) {
                  silenceTimerRef.current = setTimeout(() => {
                    handleFinishSpeaking(true);
                  }, 1800);
                }
              }

              animFrameRef.current = requestAnimationFrame(checkVolume);
            };
            animFrameRef.current = requestAnimationFrame(checkVolume);
          } catch (_) {}
        })
        .catch(() => {});
    }
  };

  const cleanupAudio = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    try {
      recognitionRef.current?.stop();
    } catch (_) {}
    try {
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    } catch (_) {}
    try {
      audioContextRef.current?.close();
    } catch (_) {}
    setAudioLevel(0);
  };

  // Step 3: Evaluating child's speech with genuine delay
  const handleFinishSpeaking = (
    isConfident: boolean = true,
    score: number = 0,
    customFeedback?: string
  ) => {
    cleanupAudio();
    setState('processing');
    setMascotMood('speaking');

    // 1.2s evaluation animation delay
    setTimeout(() => {
      setState('feedback');
      if (isConfident) {
        kidsSound.play('correct');
        setMascotMood('celebrate');
        const praise = customFeedback || 'Yeahhh! Bé giỏi quá! Đọc rất chuẩn luôn!';
        setSpeechFeedback(praise);
        kidsSpeech.speakVi(praise);
        // Trigger star burst celebration on card
        if (cardRef.current) {
          kidsAnimationManager.playStarBurst(cardRef.current, 18);
        }
      } else {
        kidsSound.play('encourage');
        setMascotMood('encourage');
        const encourage =
          customFeedback ||
          (score > 0
            ? `Bé đạt ${score}%. Cần từ 50% để hoàn thành. Bé đọc to và rõ hơn nhé!`
            : 'Chưa nghe rõ giọng đọc. Bé đọc lại to hơn nhé!');
        setSpeechFeedback(encourage);
        kidsSpeech.speakVi(encourage);
      }
    }, 1200);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      startTeacherExplanation();
    }, 450);

    return () => {
      clearTimeout(timer);
      cleanupAudio();
      kidsSpeech.stop();
    };
  }, [activity.id]);

  const handleToggleFlip = () => {
    kidsAnimationManager.playCardFlip(cardRef.current);
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="flex flex-col items-center space-y-4 animate-fadeIn max-w-lg mx-auto w-full">
      {/* Mascot Guidance with Bilingual Speech Bubble */}
      <KidsMascot
        mood={mascotMood}
        size="md"
        speechText={
          state === 'audioPlaying'
            ? viMeaning
              ? `Đây là ${viMeaning} - Tiếng Anh là ${activity.targetWord}!`
              : `Đây là ${activity.targetWord}!`
            : state === 'waitingForUser'
            ? `Đến lượt bé nè! Chạm vào nút Micro và đọc: "${activity.targetWord}"`
            : state === 'userAnswering'
            ? hasVoiceInput
              ? `Bobby đã nghe thấy bé rồi! Bé có muốn nói tiếp không nào?`
              : `Gấu Bobby đang lắng nghe bé đọc: "${activity.targetWord}"...`
            : state === 'processing'
            ? 'Bobby đang chấm điểm cho bé nè...'
            : speechFeedback || `Bé hãy nhắc lại: ${activity.targetWord}!`
        }
      />

      {/* 3D Liquid Glass Flashcard */}
      <div
        ref={cardRef}
        onClick={handleToggleFlip}
        className="kids-flip-card w-full h-[360px] sm:h-[390px] cursor-pointer select-none group"
      >
        <div
          className={`kids-flip-inner ${
            isFlipped ? 'is-flipped' : ''
          }`}
        >
          {/* Card Front */}
          <div className="kids-flip-front bg-gradient-to-b from-amber-50 to-orange-50/80 border-2 border-amber-300 p-6 flex flex-col items-center justify-between text-center">
            <div className="px-4 py-1.5 rounded-full bg-amber-200/90 text-slate-900 text-xs sm:text-sm font-black border-2 border-amber-400">
              Bé đoán xem đây là gì nào?
            </div>

            <div className="my-auto flex items-center justify-center p-2 group-hover:scale-105 transition-transform duration-300">
              {renderActivityVisual(activity.targetWord || activity.imageSvg, activity.emoji, 'w-36 h-36 sm:w-44 sm:h-44')}
            </div>

            <div className="px-5 py-2.5 rounded-2xl bg-white text-slate-900 font-black text-xs sm:text-sm flex items-center gap-2 border-2 border-amber-400">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Chạm để lật xem từ vựng</span>
            </div>
          </div>

          {/* Card Back */}
          <div className="kids-flip-back bg-gradient-to-b from-emerald-50 to-teal-50 border-2 border-emerald-400 p-6 flex flex-col items-center justify-between text-center">
            <div className="px-4 py-1.5 rounded-full bg-emerald-200/90 text-slate-950 text-xs sm:text-sm font-black border-2 border-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Từ Vựng & Phát Âm Chuẩn</span>
            </div>

            <div className="my-auto flex flex-col items-center">
              <div className="mb-2">
                {renderActivityVisual(activity.targetWord || activity.imageSvg, activity.emoji, 'w-24 h-24 sm:w-28 sm:h-28')}
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase">
                {activity.targetWord}
              </h2>
              {viMeaning && (
                <p className="text-base sm:text-lg font-black text-emerald-900 mt-1">
                  ({viMeaning})
                </p>
              )}
              {activity.phonetic && (
                <span className="text-xs sm:text-sm font-black text-amber-800 mt-0.5 px-3 py-0.5 rounded-full bg-amber-100 border border-amber-300">
                  {activity.phonetic}
                </span>
              )}
            </div>

            {/* Bilingual Voice Buttons */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  kidsSpeech.speak(activity.targetWord || '');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-sky-100 hover:bg-sky-200 text-slate-900 font-black text-xs flex items-center gap-1.5 border-2 border-sky-400 transition cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5 text-sky-700" />
                <span>Tiếng Anh</span>
              </button>

              {viMeaning && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    kidsSpeech.speakVi(viMeaning);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-slate-900 font-black text-xs flex items-center gap-1.5 border-2 border-rose-400 transition cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Tiếng Việt</span>
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  startTeacherExplanation();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-slate-900 font-black text-xs flex items-center gap-1.5 border-2 border-amber-400 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                <span>Nghe Lại</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* STATE CONTROL BANNERS */}

      {/* 1. TEACHER SPEAKING BANNER */}
      {state === 'audioPlaying' && (
        <div className="w-full p-4 rounded-3xl kids-liquid-amber border-2 border-amber-400 flex items-center justify-center gap-3 animate-pulse text-amber-950 font-black text-sm">
          <Headphones className="w-6 h-6 animate-bounce text-amber-800" />
          <span>Bobby đang đọc mẫu... Bé hãy lắng nghe thật kỹ nhé!</span>
        </div>
      )}

      {/* 2. WAITING FOR USER TO START SPEAKING */}
      {state === 'waitingForUser' && (
        <div className="w-full p-5 rounded-3xl kids-liquid-sky border-2 border-sky-400 flex flex-col items-center space-y-3 animate-fadeIn">
          <p className="text-slate-900 font-black text-sm sm:text-base text-center">
            Đến lượt bé phát âm từ: <strong className="text-indigo-900 uppercase underline">"{activity.targetWord}"</strong>
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={startChildRecording}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-sm sm:text-base flex items-center gap-2 border-b-4 border-rose-700 hover:scale-105 active:scale-95 transition cursor-pointer animate-pulse"
            >
              <Mic className="w-5 h-5" />
              <span>BẤM VÀO ĐÂY ĐỂ ĐỌC</span>
            </button>
          </div>
          <p className="text-[11px] font-bold text-slate-600">
            (Bé nói xong có thể chạm "Đã đọc xong" hoặc dừng lại 2 giây)
          </p>
        </div>
      )}

      {/* 3. ACTIVE RECORDING SESSION WITH AUDIO METER */}
      {state === 'userAnswering' && (
        <div className="w-full p-5 rounded-3xl kids-liquid-rose border-2 border-rose-400 flex flex-col items-center space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between w-full px-2">
            <span className="flex items-center gap-2 text-rose-950 font-black text-sm">
              <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
              {hasVoiceInput ? 'Đã thu giọng của bé...' : 'Đang lắng nghe bé nói...'}
            </span>
            <span className="px-3 py-1 rounded-full bg-rose-200 border border-rose-400 text-rose-950 font-black text-xs flex items-center gap-1">
              <Mic className="w-3 h-3 text-rose-700" />
              <span>{recordingSeconds}s</span>
            </span>
          </div>

          {/* Audio Amplitude Bar */}
          <div className="w-full h-3.5 rounded-full bg-white/80 border border-rose-300 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all duration-100"
              style={{ width: `${Math.max(12, audioLevel)}%` }}
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => handleFinishSpeaking(true)}
              className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm border-b-4 border-emerald-700 active:scale-95 transition cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>BÉ ĐÃ ĐỌC XONG RỒI</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. EVALUATING DELAY BANNER */}
      {state === 'processing' && (
        <div className="w-full p-4 rounded-3xl bg-amber-100 border-2 border-amber-400 text-slate-900 font-black text-sm text-center flex items-center justify-center gap-2 animate-pulse">
          <Sparkles className="w-5 h-5 text-amber-600" />
          <span>Bobby đang nghe và chấm điểm phát âm cho bé nè...</span>
        </div>
      )}

      {/* 5. FEEDBACK BANNER */}
      {state === 'feedback' && (
        <div className="w-full p-4 rounded-3xl kids-liquid-emerald border-2 border-emerald-500 text-center space-y-2 animate-fadeIn">
          <p className="text-emerald-950 font-black text-lg flex items-center justify-center gap-1.5">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>{speechFeedback || 'Yeahhh! Bé giỏi quá!'}</span>
          </p>
          <div className="flex items-center justify-center gap-1.5">
            <KidsStarIcon size={24} filled />
            <KidsStarIcon size={28} filled />
            <KidsStarIcon size={24} filled />
          </div>
        </div>
      )}

      {/* 6. PRIMARY FLOW ACTION BUTTONS (TRY AGAIN & CONTINUE) */}
      {state === 'feedback' && (
        <div className="w-full flex items-center gap-2.5 pt-2 animate-fadeIn">
          <button
            onClick={() => startTeacherExplanation()}
            className="w-1/3 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-black text-xs sm:text-sm border-2 border-slate-300 cursor-pointer active:scale-95 transition flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4 text-slate-600" />
            <span>Luyện Lại</span>
          </button>
          <button
            onClick={() => {
              kidsSound.play('pop');
              onDone(true, 100);
            }}
            className="w-2/3 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm sm:text-base border-b-4 border-emerald-700 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer animate-bounce"
          >
            <span>TIẾP TỤC BÀI TIẾP</span>
            <Play className="w-4 h-4 fill-current" />
          </button>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// 2. LISTEN / MULTIPLE CHOICE ACTIVITY COMPONENT
// Question -> Child Chooses -> Instant Sparkle Burst & Audio Praise -> Prominent Next Button (NO RUSHED AUTO-SKIP)
// =========================================================================
const ListenChoiceActivity: React.FC<ActivityProps> = ({ activity, onDone, onBusyStateChange }) => {
  const [mascotMood, setMascotMood] = useState<MascotMood>('happy');
  const [selectedOptId, setSelectedOptId] = useState<string | null>(null);
  const [state, setState] = useState<ActivityState>('instruction');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const viMeaning =
    (activity as any).vietnameseWord ||
    kidsSpeech.getViMeaning(activity.targetWord || '');

  useEffect(() => {
    onBusyStateChange?.(state === 'audioPlaying' || state === 'processing');
  }, [state, onBusyStateChange]);

  const handlePlayPrompt = () => {
    if (!activity.targetWord) return;
    setState('audioPlaying');
    celebrationManager.promptFindItem(activity.targetWord, viMeaning, () => {
      setState('waitingForUser');
    });
  };

  const handlePlayWord = (word: string) => {
    kidsSpeech.speakBilingual(word, viMeaning);
  };

  useEffect(() => {
    if (activity.targetWord) {
      const timer = setTimeout(() => {
        handlePlayPrompt();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [activity.id]);

  const handleSelectOption = (opt: any, e: React.MouseEvent<HTMLButtonElement>) => {
    if (state === 'audioPlaying' || state === 'processing' || state === 'feedback') return;
    setSelectedOptId(opt.id);

    const btn = e.currentTarget;

    if (opt.isCorrect) {
      setState('feedback');
      setFeedback('correct');
      setMascotMood('celebrate');
      kidsSound.play('correct');

      // Physical squash & stretch bounce + star burst particles
      kidsAnimationManager.playObjectBounce(btn);
      kidsAnimationManager.playStarBurst(btn, 22);

      // Praise in Vietnamese and pronounce word
      celebrationManager.celebrate('small', `Đúng rồi! Đó là ${activity.targetWord || opt.text}!`);
    } else {
      kidsSound.play('wrong');
      setFeedback('wrong');
      setMascotMood('encourage');
      celebrationManager.speakPraise('Chưa đúng rồi, bé nghe lại và chọn nhé!');
      setTimeout(() => {
        setFeedback(null);
        setSelectedOptId(null);
        setMascotMood('happy');
        setState('waitingForUser');
      }, 1200);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 animate-fadeIn max-w-lg mx-auto w-full">
      <KidsMascot
        mood={mascotMood}
        size="sm"
        speechText={
          feedback === 'correct'
            ? `Tuyệt vời! Bé chọn chuẩn rồi! Đó là ${activity.targetWord || 'từ này'}! 🌟`
            : feedback === 'wrong'
            ? 'Chưa đúng rồi, bé thử lại cùng Bobby nhé! 💪'
            : activity.instruction || `Bé hãy tìm: ${viMeaning || activity.targetWord} nhé!`
        }
      />

      <div className="text-center space-y-1">
        <h3 className="text-xl sm:text-2xl font-black text-slate-950">
          {activity.title}
        </h3>
        <p className="text-xs sm:text-sm font-extrabold text-amber-800">
          {activity.instruction}
        </p>
      </div>

      {/* Audio Status Pill */}
      {state === 'audioPlaying' && (
        <div className="px-4 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-950 text-xs font-black flex items-center gap-2 animate-pulse">
          <Headphones className="w-3.5 h-3.5 text-amber-700 animate-bounce" />
          <span>Bé hãy lắng nghe câu hỏi trước nhé...</span>
        </div>
      )}

      {activity.targetWord && (
        <button
          onClick={() => handlePlayPrompt()}
          disabled={state === 'audioPlaying'}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 border-2 transition cursor-pointer ${
            state === 'audioPlaying'
              ? 'bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed'
              : 'bg-amber-100 hover:bg-amber-200 text-slate-950 border-amber-400 hover:scale-105 active:scale-95'
          }`}
        >
          <KidsListenIcon size={20} />
          <span>Nghe lại câu hỏi</span>
        </button>
      )}

      {/* Options Grid - strictly blocked while audio is playing */}
      <div className="w-full max-w-md grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
        {activity.options?.map((opt) => {
          const isChosen = selectedOptId === opt.id;
          let btnBorder = 'border-amber-300 hover:border-amber-500';
          let btnBg = 'kids-liquid-card text-slate-950';

          if (isChosen && feedback === 'correct') {
            btnBorder = 'border-emerald-500 bg-emerald-100 text-slate-950 scale-105 ring-4 ring-emerald-300';
          } else if (isChosen && feedback === 'wrong') {
            btnBorder = 'border-rose-500 bg-rose-100 text-slate-950 animate-shake';
          }

          const isBlocked = state === 'audioPlaying' || state === 'processing' || state === 'feedback';

          return (
            <button
              key={opt.id}
              onClick={(e) => handleSelectOption(opt, e)}
              disabled={isBlocked}
              className={`p-4 sm:p-5 rounded-3xl border-2 flex flex-col items-center justify-center text-center gap-2 transition-all select-none ${
                isBlocked
                  ? 'opacity-85 cursor-not-allowed'
                  : 'hover:scale-105 active:scale-95 cursor-pointer'
              } ${btnBg} ${btnBorder}`}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                {renderActivityVisual(opt.text || opt.imageSvg || opt.id, opt.emoji, 'w-full h-full')}
              </div>
              <span className="font-black text-base sm:text-lg text-slate-950">
                {opt.text}
              </span>
            </button>
          );
        })}
      </div>

      {/* PROMINENT NEXT BUTTON WHEN CORRECT (CHILD ADVANCES AT THEIR OWN PACE) */}
      {feedback === 'correct' && (
        <div className="w-full pt-4 animate-fadeIn">
          <button
            onClick={() => {
              kidsSound.play('pop');
              onDone(true, 100);
            }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm sm:text-base border-b-4 border-emerald-700 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer animate-bounce"
          >
            <span>BÀI TIẾP THEO</span>
            <Play className="w-4 h-4 fill-current" />
          </button>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// 3. SPEAK & PRONUNCIATION ACTIVITY COMPONENT
// =========================================================================
const SpeakActivity: React.FC<ActivityProps> = ({ activity, onDone, onBusyStateChange }) => {
  const { activeLanguage } = useLearningContext();
  const effectiveSpeechLocale = activeLanguage?.speechLocale || 'en-US';
  const [state, setState] = useState<ActivityState>('waitingForUser');
  const [mascotMood, setMascotMood] = useState<MascotMood>('happy');
  const [spokenText, setSpokenText] = useState('');
  const [speakingScore, setSpeakingScore] = useState<number | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<any>(null);
  const spokenTextRef = useRef<string>('');

  useEffect(() => {
    onBusyStateChange?.(state === 'userAnswering' || state === 'processing');
  }, [state, onBusyStateChange]);

  const handlePlayWord = (text: string) => {
    kidsSpeech.speak(text);
  };

  const startRecord = () => {
    setSpokenText('');
    spokenTextRef.current = '';
    setSpeakingScore(null);
    kidsSound.play('pop');
    setState('userAnswering');
    setMascotMood('listening');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = effectiveSpeechLocale;

        recognition.onresult = (e: any) => {
          const res = (e.results?.[0]?.[0]?.transcript || '').trim();
          spokenTextRef.current = res;
          setSpokenText(res);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (_) {}
    }

    // Microphone amplitude meter
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })
        .then((stream) => {
          mediaStreamRef.current = stream;
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioCtx();
            if (audioCtx.state === 'suspended') {
              audioCtx.resume().catch(() => {});
            }
            audioContextRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const checkVolume = () => {
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
              setAudioLevel(Math.min(100, Math.round((sum / bufferLength / 128) * 100)));
              animFrameRef.current = requestAnimationFrame(checkVolume);
            };
            animFrameRef.current = requestAnimationFrame(checkVolume);
          } catch (_) {}
        })
        .catch(() => {});
    }
  };

  const stopRecordAndEvaluate = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    try {
      recognitionRef.current?.stop();
    } catch (_) {}
    try {
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    } catch (_) {}
    try {
      audioContextRef.current?.close();
    } catch (_) {}

    setState('processing');

    // 1.2s evaluation animation
    setTimeout(() => {
      setState('feedback');
      const target = (activity.targetWord || '').toLowerCase().trim();
      const spoken = (spokenTextRef.current || spokenText || '').toLowerCase().trim();

      const evalResult = evaluatePronunciation(target, spoken, 'kid');
      const score = evalResult.score;
      const isPass = evalResult.isPassing; // score >= 50

      setSpeakingScore(score);
      kidsSound.play(isPass ? 'correct' : 'encourage');
      setMascotMood(isPass ? 'celebrate' : 'encourage');
      kidsSpeech.speakVi(evalResult.feedback);
    }, 1200);
  };

  return (
    <div className="flex flex-col items-center space-y-4 animate-fadeIn max-w-lg mx-auto w-full">
      <KidsMascot
        mood={mascotMood}
        size="sm"
        speechText={
          speakingScore !== null
            ? speakingScore >= 50
              ? `Bé đạt ${speakingScore} điểm! Đạt chuẩn phát âm rồi nè! 🌟`
              : `Bé đạt ${speakingScore} điểm. Cần từ 50 điểm để vượt qua. Bé bấm luyện lại nhé! 💪`
            : state === 'userAnswering'
            ? `Gấu Bobby đang lắng nghe nè! Bé hãy nói thật to nhé! 🎙️`
            : 'Bé hãy bấm vào chiếc mic lớn rồi đọc từ này nhé!'
        }
      />

      <div className="w-full kids-liquid-card p-6 rounded-3xl text-center space-y-2 border-2 border-indigo-400 flex flex-col items-center">
        <p className="text-xs font-black uppercase tracking-wider text-indigo-900">
          Từ vựng bé cần phát âm
        </p>
        <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center my-1">
          {renderActivityVisual(activity.targetWord, activity.emoji, 'w-full h-full')}
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight">
          {activity.targetWord}
        </h2>
        {activity.phonetic && (
          <p className="text-sm font-black text-amber-800">{activity.phonetic}</p>
        )}
      </div>

      <button
        onClick={() => handlePlayWord(activity.targetWord || '')}
        className="px-5 py-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-slate-950 font-black text-xs flex items-center gap-2 border-2 border-amber-400 hover:scale-105 transition cursor-pointer"
      >
        <KidsListenIcon size={20} />
        <span>Nghe phát âm chuẩn mẫu</span>
      </button>

      {/* Dynamic Recording / Mic Button */}
      <div className="py-2">
        <button
          onClick={state === 'userAnswering' ? stopRecordAndEvaluate : startRecord}
          className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center text-white transition-all duration-300 cursor-pointer ${
            state === 'userAnswering'
              ? 'bg-rose-500 border-white ring-4 ring-rose-300 animate-pulse scale-105'
              : 'bg-gradient-to-tr from-indigo-500 to-purple-600 border-white hover:scale-105'
          }`}
        >
          <KidsSpeakIcon size={44} />
          <span className="text-[11px] font-black uppercase mt-1">
            {state === 'userAnswering' ? 'XONG RỒI' : 'CHẠM ĐỂ NÓI'}
          </span>
        </button>
      </div>

      {state === 'processing' && (
        <div className="flex items-center gap-2 text-xs font-black text-amber-700 animate-pulse">
          <KidsSparkleIcon size={20} />
          <span>Bobby đang phân tích phát âm của bé...</span>
        </div>
      )}

      {/* FEEDBACK & RETRY/CONTINUE BUTTONS */}
      {speakingScore !== null && state === 'feedback' && (
        <div
          className={`w-full max-w-sm p-4 rounded-3xl border-2 text-center space-y-3 animate-fadeIn ${
            speakingScore >= 50
              ? 'kids-liquid-emerald border-emerald-500'
              : 'bg-amber-50 border-amber-400'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5 text-amber-500">
            <KidsStarIcon size={22} filled={speakingScore >= 50} />
            <span
              className={`text-2xl font-black ${
                speakingScore >= 50 ? 'text-emerald-950' : 'text-amber-900'
              }`}
            >
              {speakingScore}% {speakingScore >= 50 ? 'Đạt Chuẩn (>=50%)' : 'Chưa Đạt (<50%)'}
            </span>
            <KidsStarIcon size={22} filled={speakingScore >= 80} />
          </div>
          {spokenText && (
            <p className="text-xs font-black text-slate-800">
              Bé đã phát âm: <strong className="font-black text-indigo-900">"{spokenText}"</strong>
            </p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={startRecord}
              className={`${
                speakingScore >= 50 ? 'w-1/3' : 'w-full'
              } py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-black text-xs border-2 border-slate-300 transition cursor-pointer flex items-center justify-center gap-1.5`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span>{speakingScore >= 50 ? 'Nói Lại' : 'Thử Lại Ngay (Cần >=50%)'}</span>
            </button>
            {speakingScore >= 50 && (
              <button
                onClick={() => {
                  kidsSound.play('success');
                  onDone(true, speakingScore, activity.targetWord);
                }}
                className="w-2/3 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm border-b-4 border-emerald-700 transition cursor-pointer active:scale-95 animate-bounce flex items-center justify-center gap-1.5"
              >
                <span>HOÀN THÀNH BÀI NÓI</span>
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// 4. STORY SCENE COMPONENT
// =========================================================================
const StoryActivity: React.FC<ActivityProps> = ({ activity, onDone, onBusyStateChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    onBusyStateChange?.(isPlaying);
  }, [isPlaying, onBusyStateChange]);

  const handlePlayWord = (text: string) => {
    setIsPlaying(true);
    kidsSpeech.speak(text, {
      onEnd: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
  };

  useEffect(() => {
    if (activity.storyScene?.narratorSpeech) {
      const timer = setTimeout(() => {
        handlePlayWord(activity.storyScene!.narratorSpeech);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [activity.id]);

  return (
    <div className="flex flex-col items-center space-y-5 animate-fadeIn text-center">
      <KidsMascot mood="happy" size="md" />
      <h3 className="text-2xl font-black text-slate-950">{activity.title}</h3>
      <p className="text-sm font-bold text-slate-700 max-w-md">
        {activity.instruction}
      </p>

      {activity.storyScene && (
        <div className="p-6 rounded-3xl bg-amber-50 border-2 border-amber-300 max-w-md space-y-3">
          <p className="text-base font-bold text-amber-950">
            "{activity.storyScene.narratorSpeech}"
          </p>
          <button
            onClick={() => handlePlayWord(activity.storyScene!.narratorSpeech)}
            disabled={isPlaying}
            className="px-4 py-2 rounded-xl bg-amber-400 text-amber-950 font-black text-xs cursor-pointer hover:bg-amber-300 flex items-center justify-center gap-1.5 mx-auto"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{isPlaying ? 'Đang đọc truyện...' : 'Nghe người kể chuyện'}</span>
          </button>
        </div>
      )}

      <button
        onClick={() => {
          kidsSound.play('pop');
          onDone(true, 100);
        }}
        disabled={isPlaying}
        className={`px-8 py-3.5 rounded-2xl font-black text-sm transition cursor-pointer border-b-4 flex items-center justify-center gap-2 ${
          isPlaying
            ? 'bg-slate-300 text-slate-500 border-slate-400 cursor-not-allowed'
            : 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-700 hover:scale-105 active:scale-95'
        }`}
      >
        <span>TIẾP TỤC</span>
        <Play className="w-4 h-4 fill-current" />
      </button>
    </div>
  );
};

// =========================================================================
// MAIN ROUTER COMPONENT
// =========================================================================
export interface KidsActivityRendererProps {
  activity: KidActivity;
  onActivityComplete?: (success: boolean, score?: number, weakWord?: string) => void;
  onComplete?: (isCorrect: boolean) => void;
  onBusyStateChange?: (isBusy: boolean) => void;
}

export const KidsActivityRenderer: React.FC<KidsActivityRendererProps> = ({
  activity,
  onActivityComplete,
  onComplete,
  onBusyStateChange,
}) => {
  const handleDone = (success: boolean, score = 100, weakWord?: string) => {
    if (onActivityComplete) {
      onActivityComplete(success, score, weakWord);
    }
    if (onComplete) {
      onComplete(success);
    }
  };

  switch (activity.type) {
    case 'flashcard':
      return (
        <FlashcardActivity
          key={activity.id}
          activity={activity}
          onDone={handleDone}
          onBusyStateChange={onBusyStateChange}
        />
      );
    case 'listen':
    case 'multiple_choice':
    case 'game':
      return (
        <ListenChoiceActivity
          key={activity.id}
          activity={activity}
          onDone={handleDone}
          onBusyStateChange={onBusyStateChange}
        />
      );
    case 'speak':
      return (
        <SpeakActivity
          key={activity.id}
          activity={activity}
          onDone={handleDone}
          onBusyStateChange={onBusyStateChange}
        />
      );
    default:
      return (
        <StoryActivity
          key={activity.id}
          activity={activity}
          onDone={handleDone}
          onBusyStateChange={onBusyStateChange}
        />
      );
  }
};

export default KidsActivityRenderer;
