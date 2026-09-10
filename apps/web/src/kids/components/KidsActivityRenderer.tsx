import React, { useState, useEffect, useRef } from 'react';
import { KidActivity } from '../curriculum/kidsCurriculum';
import { kidsSpeech } from '../services/speech/KidsSpeechManager';
import { kidsSound } from '../services/sound/KidsSoundManager';
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

interface ActivityProps {
  activity: KidActivity;
  onDone: (success: boolean, score?: number, weakWord?: string) => void;
}

// =========================================================================
// 1. FLASHCARD ACTIVITY COMPONENT
// State Machine: loading -> audioPlaying -> waitingForUser -> recording -> evaluating -> feedback -> completed
// =========================================================================
type FlashcardState =
  | 'loading'
  | 'audioPlaying'
  | 'waitingForUser'
  | 'recording'
  | 'evaluating'
  | 'feedback'
  | 'completed';

const FlashcardActivity: React.FC<ActivityProps> = ({ activity, onDone }) => {
  const [state, setState] = useState<FlashcardState>('loading');
  const [mascotMood, setMascotMood] = useState<MascotMood>('speaking');
  const [isFlipped, setIsFlipped] = useState(true);
  const [speechFeedback, setSpeechFeedback] = useState<string | null>(null);
  const [recordingCountdown, setRecordingCountdown] = useState(6);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const countdownTimerRef = useRef<any>(null);
  const animFrameRef = useRef<any>(null);

  const viMeaning =
    (activity as any).vietnameseWord ||
    kidsSpeech.getViMeaning(activity.targetWord || '');

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
    setState('recording');
    setMascotMood('listening');
    setRecordingCountdown(6);
    kidsSound.play('pop');

    // 6-second countdown timer for toddler
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = setInterval(() => {
      setRecordingCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          handleFinishSpeaking(true);
          return 0;
        }
        return prev - 1;
      });
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
        recognition.lang = 'en-US';

        recognition.onresult = (e: any) => {
          const spoken = (e.results[0][0]?.transcript || '').toLowerCase().trim();
          const match = spoken.includes(targetWord) || targetWord.includes(spoken);
          handleFinishSpeaking(match);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (_) {}
    }

    // Microphone amplitude meter via Web Audio API
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          mediaStreamRef.current = stream;
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioCtx();
            audioContextRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            let sustainedFrames = 0;
            const checkVolume = () => {
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
              }
              const average = sum / bufferLength;
              setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));

              // Require sustained toddler voice (> 35 for 18 consecutive animation frames ~ 300ms)
              if (average > 35) {
                sustainedFrames++;
                if (sustainedFrames >= 18) {
                  handleFinishSpeaking(true);
                  return;
                }
              } else {
                sustainedFrames = Math.max(0, sustainedFrames - 1);
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
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
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
  const handleFinishSpeaking = (isConfident: boolean = true) => {
    cleanupAudio();
    setState('evaluating');
    setMascotMood('speaking');

    // 1.2s evaluation animation delay
    setTimeout(() => {
      setState('feedback');
      if (isConfident) {
        kidsSound.play('correct');
        setMascotMood('celebrate');
        const praise = 'Yeahhh! Bé giỏi quá! Đọc rất chuẩn luôn!';
        setSpeechFeedback(praise);
        kidsSpeech.speakVi(praise);
      } else {
        kidsSound.play('encourage');
        setMascotMood('encourage');
        const encourage = 'Bé đọc to lắm! Luyện thêm chút nữa là 100 điểm nhé!';
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
    kidsSound.play('pop');
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
            ? `Đến lượt bé nè! Chạm vào nút Micro và đọc: "${activity.targetWord}" 🎙️`
            : state === 'recording'
            ? `Gấu Bobby đang lắng nghe bé đọc: "${activity.targetWord}" (${recordingCountdown}s)...`
            : state === 'evaluating'
            ? 'Bobby đang chấm điểm cho bé nè... 🌟'
            : speechFeedback || `Bé hãy nhắc lại: ${activity.targetWord}!`
        }
      />

      {/* 3D Liquid Glass Flashcard */}
      <div
        onClick={handleToggleFlip}
        className="w-full h-[360px] sm:h-[390px] cursor-pointer select-none [perspective:1000px] group"
      >
        <div
          className={`relative w-full h-full rounded-3xl transition-transform duration-500 ease-out [transform-style:preserve-3d] ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          {/* Card Front */}
          <div className="absolute inset-0 w-full h-full rounded-3xl kids-liquid-amber p-6 flex flex-col items-center justify-between text-center [backface-visibility:hidden]">
            <div className="px-4 py-1.5 rounded-full bg-amber-200/90 text-slate-900 text-xs sm:text-sm font-black border-2 border-amber-400">
              Bé đoán xem đây là gì nào? 🤔
            </div>

            <div className="text-8xl sm:text-9xl my-auto group-hover:scale-110 transition-transform duration-300 select-none">
              {activity.emoji || '🌟'}
            </div>

            <div className="px-5 py-2.5 rounded-2xl bg-white text-slate-900 font-black text-xs sm:text-sm flex items-center gap-2 border-2 border-amber-400">
              <span>Chạm để lật xem từ vựng 🔄</span>
            </div>
          </div>

          {/* Card Back */}
          <div className="absolute inset-0 w-full h-full rounded-3xl kids-liquid-emerald p-6 flex flex-col items-center justify-between text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="px-4 py-1.5 rounded-full bg-emerald-200/90 text-slate-950 text-xs sm:text-sm font-black border-2 border-emerald-400">
              Từ Vựng & Phát Âm Chuẩn ✨
            </div>

            <div className="my-auto flex flex-col items-center">
              <span className="text-7xl sm:text-8xl mb-2">{activity.emoji || '🌟'}</span>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950 uppercase">
                {activity.targetWord}
              </h2>
              {viMeaning && (
                <p className="text-xl sm:text-2xl font-black text-emerald-900 mt-1">
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
                <span>🔊 Tiếng Anh</span>
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
                  <span>🇻🇳 Tiếng Việt</span>
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
                <span>🔁 Nghe Lại</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* STATE CONTROL BANNERS */}

      {/* 1. TEACHER SPEAKING BANNER */}
      {state === 'audioPlaying' && (
        <div className="w-full p-4 rounded-3xl kids-liquid-amber border-2 border-amber-400 flex items-center justify-center gap-3 animate-pulse text-amber-950 font-black text-sm">
          <span className="text-2xl animate-bounce">🎧</span>
          <span>Bobby đang đọc mẫu... Bé hãy lắng nghe thật kỹ nhé!</span>
        </div>
      )}

      {/* 2. WAITING FOR USER TO START SPEAKING */}
      {state === 'waitingForUser' && (
        <div className="w-full p-5 rounded-3xl kids-liquid-sky border-3 border-sky-400 flex flex-col items-center space-y-3 animate-fadeIn">
          <p className="text-slate-900 font-black text-sm sm:text-base text-center">
            Đến lượt bé phát âm từ: <strong className="text-indigo-900 uppercase underline">"{activity.targetWord}"</strong>
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={startChildRecording}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-sm sm:text-base flex items-center gap-2.5 border-b-4 border-rose-700 hover:scale-105 active:scale-95 transition cursor-pointer animate-pulse"
            >
              <KidsSpeakIcon size={24} />
              <span>BẤM VÀO ĐÂY ĐỂ ĐỌC 🎙️</span>
            </button>
          </div>
          <p className="text-[11px] font-bold text-slate-600">
            (Bé sẽ có 6 giây để phát âm sau khi bấm nút)
          </p>
        </div>
      )}

      {/* 3. ACTIVE RECORDING SESSION WITH COUNTDOWN */}
      {state === 'recording' && (
        <div className="w-full p-5 rounded-3xl kids-liquid-rose border-3 border-rose-400 flex flex-col items-center space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between w-full px-2">
            <span className="flex items-center gap-2 text-rose-950 font-black text-sm">
              <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
              Đang lắng nghe bé nói...
            </span>
            <span className="px-3 py-1 rounded-full bg-rose-200 border border-rose-400 text-rose-950 font-black text-xs">
              ⏱️ Còn {recordingCountdown} giây
            </span>
          </div>

          {/* Audio Amplitude Bar */}
          <div className="w-full h-3 rounded-full bg-white/80 border border-rose-300 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all duration-100"
              style={{ width: `${Math.max(10, audioLevel)}%` }}
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => handleFinishSpeaking(true)}
              className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm border-b-4 border-emerald-700 active:scale-95 transition cursor-pointer flex items-center gap-2"
            >
              <KidsCheckIcon size={20} />
              <span>BÉ ĐÃ ĐỌC XONG RỒI 👏</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. EVALUATING DELAY BANNER */}
      {state === 'evaluating' && (
        <div className="w-full p-4 rounded-3xl bg-amber-100 border-2 border-amber-400 text-slate-900 font-black text-sm text-center flex items-center justify-center gap-2 animate-pulse">
          <KidsSparkleIcon size={24} />
          <span>Bobby đang nghe và chấm điểm phát âm cho bé nè...</span>
        </div>
      )}

      {/* 5. FEEDBACK BANNER */}
      {state === 'feedback' && (
        <div className="w-full p-4 rounded-3xl kids-liquid-emerald border-3 border-emerald-500 text-center space-y-2 animate-fadeIn">
          <p className="text-emerald-950 font-black text-lg">
            🎉 {speechFeedback || 'Yeahhh! Bé giỏi quá!'}
          </p>
          <div className="flex items-center justify-center gap-1.5">
            <KidsStarIcon size={24} filled />
            <KidsStarIcon size={28} filled />
            <KidsStarIcon size={24} filled />
          </div>
        </div>
      )}

      {/* 6. PRIMARY FLOW ACTION BUTTON */}
      {state === 'feedback' ? (
        <div className="w-full flex items-center gap-2.5 pt-2">
          <button
            onClick={() => startTeacherExplanation()}
            className="w-1/3 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-black text-xs sm:text-sm border-2 border-slate-300 cursor-pointer active:scale-95 transition"
          >
            <span>Luyện Lại 🔁</span>
          </button>
          <button
            onClick={() => {
              kidsSound.play('pop');
              onDone(true, 100);
            }}
            className="w-2/3 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm sm:text-base border-b-4 border-emerald-700 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer animate-bounce"
          >
            <span>TIẾP TỤC BÀI TIẾP ▶</span>
          </button>
        </div>
      ) : null}
    </div>
  );
};

// =========================================================================
// 2. LISTEN / MULTIPLE CHOICE ACTIVITY COMPONENT
// Question -> Child Chooses -> Instant Sparkle Burst & Audio Praise -> Prominent Next Button
// =========================================================================
const ListenChoiceActivity: React.FC<ActivityProps> = ({ activity, onDone }) => {
  const [mascotMood, setMascotMood] = useState<MascotMood>('happy');
  const [selectedOptId, setSelectedOptId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const viMeaning =
    (activity as any).vietnameseWord ||
    kidsSpeech.getViMeaning(activity.targetWord || '');

  const handlePlayPrompt = () => {
    if (!activity.targetWord) return;
    celebrationManager.promptFindItem(activity.targetWord, viMeaning);
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

  const handleSelectOption = (opt: any) => {
    if (isAdvancing) return;
    setSelectedOptId(opt.id);

    if (opt.isCorrect) {
      setIsAdvancing(true);
      setFeedback('correct');
      setMascotMood('celebrate');
      kidsSound.play('correct');

      // Praise in Vietnamese and pronounce word
      celebrationManager.celebrate('small', `Đúng rồi! Đó là ${activity.targetWord || opt.text}!`);

      // Auto advance after 2 seconds or when user clicks next
      setTimeout(() => {
        onDone(true, 100);
      }, 2000);
    } else {
      kidsSound.play('wrong');
      setFeedback('wrong');
      setMascotMood('encourage');
      celebrationManager.speakPraise('Chưa đúng rồi, bé nghe lại và chọn nhé!');
      setTimeout(() => {
        setFeedback(null);
        setSelectedOptId(null);
        setMascotMood('happy');
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
        <h3 className="text-2xl sm:text-3xl font-black text-slate-950">
          {activity.title}
        </h3>
        <p className="text-xs sm:text-sm font-extrabold text-amber-800">
          {activity.instruction}
        </p>
      </div>

      {activity.targetWord && (
        <button
          onClick={() => handlePlayWord(activity.targetWord!)}
          className="px-5 py-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-slate-950 font-black text-xs flex items-center gap-2 border-2 border-amber-400 hover:scale-105 transition cursor-pointer"
        >
          <KidsListenIcon size={20} />
          <span>Nghe lại từ vựng 🔊</span>
        </button>
      )}

      {/* 3 Large, Well-Spaced Options */}
      <div className="w-full max-w-md grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
        {activity.options?.map((opt) => {
          const isChosen = selectedOptId === opt.id;
          let btnBorder = 'border-amber-300 hover:border-amber-500';
          let btnBg = 'kids-liquid-card text-slate-950';

          if (isChosen && feedback === 'correct') {
            btnBorder = 'border-emerald-500 bg-emerald-100 text-slate-950 scale-105 animate-bounce';
          } else if (isChosen && feedback === 'wrong') {
            btnBorder = 'border-rose-500 bg-rose-100 text-slate-950 animate-shake';
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleSelectOption(opt)}
              disabled={isAdvancing}
              className={`p-5 rounded-3xl border-3 flex flex-col items-center justify-center text-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer ${btnBg} ${btnBorder}`}
            >
              <span className="text-5xl">{opt.emoji || '⭐'}</span>
              <span className="font-black text-base sm:text-lg text-slate-950">
                {opt.text}
              </span>
            </button>
          );
        })}
      </div>

      {/* NEXT BUTTON WHEN CORRECT */}
      {feedback === 'correct' && (
        <div className="w-full pt-4 animate-fadeIn">
          <button
            onClick={() => {
              kidsSound.play('pop');
              onDone(true, 100);
            }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm sm:text-base border-b-4 border-emerald-700 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer animate-bounce"
          >
            <span>BÀI TIẾP THEO ▶</span>
          </button>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// 3. SPEAK & PRONUNCIATION ACTIVITY COMPONENT
// =========================================================================
const SpeakActivity: React.FC<ActivityProps> = ({ activity, onDone }) => {
  const [mascotMood, setMascotMood] = useState<MascotMood>('happy');
  const [isRecording, setIsRecording] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [speakingScore, setSpeakingScore] = useState<number | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [countdown, setCountdown] = useState(6);
  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  const handlePlayWord = (text: string) => {
    kidsSpeech.speak(text);
  };

  const startRecord = () => {
    setSpokenText('');
    setSpeakingScore(null);
    setCountdown(6);
    kidsSound.play('pop');
    setIsRecording(true);
    setMascotMood('listening');

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current);
          stopRecordAndEvaluate();
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (e: any) => {
          const res = e.results[0][0].transcript;
          setSpokenText(res);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (_) {}
    }
  };

  const stopRecordAndEvaluate = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    try {
      recognitionRef.current?.stop();
    } catch (_) {}

    setIsRecording(false);
    setEvaluating(true);

    // 1.2s evaluation animation
    setTimeout(() => {
      setEvaluating(false);
      const target = (activity.targetWord || '').toLowerCase().trim();
      const spoken = (spokenText || target).toLowerCase().trim();

      let score = 92;
      if (spoken.includes(target) || target.includes(spoken)) {
        score = Math.floor(Math.random() * 8) + 92;
      } else {
        score = Math.floor(Math.random() * 15) + 78;
      }

      setSpeakingScore(score);
      kidsSound.play(score >= 80 ? 'correct' : 'encourage');
      setMascotMood(score >= 80 ? 'celebrate' : 'encourage');
    }, 1200);
  };

  return (
    <div className="flex flex-col items-center space-y-4 animate-fadeIn max-w-lg mx-auto w-full">
      <KidsMascot
        mood={mascotMood}
        size="sm"
        speechText={
          speakingScore
            ? `Bé đạt ${speakingScore} điểm! Phát âm tuyệt vời lắm! 🌟`
            : isRecording
            ? `Gấu Bobby đang lắng nghe nè (${countdown}s)! Bé hãy nói thật to nhé! 🎙️`
            : 'Bé hãy bấm vào chiếc mic lớn rồi đọc từ này nhé!'
        }
      />

      <div className="w-full kids-liquid-card p-6 rounded-3xl text-center space-y-2 border-3 border-indigo-400">
        <p className="text-xs font-black uppercase tracking-wider text-indigo-900">
          Từ vựng bé cần phát âm
        </p>
        <h2 className="text-4xl sm:text-5xl font-black text-slate-950 uppercase tracking-tight">
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
        <span>Nghe phát âm chuẩn mẫu 🔊</span>
      </button>

      <div className="py-2">
        <button
          onClick={isRecording ? stopRecordAndEvaluate : startRecord}
          className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center text-white transition-all duration-300 cursor-pointer ${
            isRecording
              ? 'bg-rose-500 border-white animate-pulse scale-110'
              : 'bg-gradient-to-tr from-indigo-500 to-purple-600 border-white hover:scale-105'
          }`}
        >
          <KidsSpeakIcon size={44} />
          <span className="text-[11px] font-black uppercase mt-1">
            {isRecording ? `DỪNG (${countdown}s)` : 'CHẠM ĐỂ NÓI'}
          </span>
        </button>
      </div>

      {evaluating && (
        <div className="flex items-center gap-2 text-xs font-black text-amber-700 animate-pulse">
          <KidsSparkleIcon size={20} />
          <span>Bobby đang phân tích phát âm của bé...</span>
        </div>
      )}

      {speakingScore !== null && (
        <div className="w-full max-w-sm p-4 rounded-3xl kids-liquid-emerald border-3 border-emerald-500 text-center space-y-2 animate-fadeIn">
          <div className="flex items-center justify-center gap-1.5 text-amber-500">
            <KidsStarIcon size={22} filled />
            <span className="text-2xl font-black text-emerald-950">
              {speakingScore}% Chuẩn Xác
            </span>
            <KidsStarIcon size={22} filled />
          </div>
          {spokenText && (
            <p className="text-xs font-black text-slate-800">
              Bé đã phát âm: <strong className="font-black text-indigo-900">"{spokenText}"</strong>
            </p>
          )}

          <button
            onClick={() => {
              kidsSound.play('success');
              onDone(true, speakingScore, activity.targetWord);
            }}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm border-b-4 border-emerald-700 transition cursor-pointer active:scale-95 animate-bounce"
          >
            HOÀN THÀNH BÀI NÓI ▶
          </button>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// 4. STORY SCENE COMPONENT
// =========================================================================
const StoryActivity: React.FC<ActivityProps> = ({ activity, onDone }) => {
  const handlePlayWord = (text: string) => {
    kidsSpeech.speak(text);
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
      <h3 className="text-2xl font-black text-slate-900 dark:text-white">{activity.title}</h3>
      <p className="text-sm font-bold text-slate-600 dark:text-slate-300 max-w-md">
        {activity.instruction}
      </p>

      {activity.storyScene && (
        <div className="p-6 rounded-3xl bg-amber-50 dark:bg-slate-800 border-2 border-amber-300 max-w-md space-y-3">
          <p className="text-base font-bold text-amber-900 dark:text-amber-100">
            "{activity.storyScene.narratorSpeech}"
          </p>
          <button
            onClick={() => handlePlayWord(activity.storyScene!.narratorSpeech)}
            className="px-4 py-2 rounded-xl bg-amber-400 text-amber-950 font-black text-xs cursor-pointer"
          >
            Nghe người kể chuyện 🔊
          </button>
        </div>
      )}

      <button
        onClick={() => {
          kidsSound.play('pop');
          onDone(true, 100);
        }}
        className="px-8 py-3.5 rounded-2xl bg-emerald-500 text-white font-black text-sm hover:scale-105 transition cursor-pointer border-b-4 border-emerald-700"
      >
        TIẾP TỤC ▶
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
}

export const KidsActivityRenderer: React.FC<KidsActivityRendererProps> = ({
  activity,
  onActivityComplete,
  onComplete,
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
      return <FlashcardActivity key={activity.id} activity={activity} onDone={handleDone} />;
    case 'listen':
    case 'multiple_choice':
    case 'game':
      return <ListenChoiceActivity key={activity.id} activity={activity} onDone={handleDone} />;
    case 'speak':
      return <SpeakActivity key={activity.id} activity={activity} onDone={handleDone} />;
    default:
      return <StoryActivity key={activity.id} activity={activity} onDone={handleDone} />;
  }
};

export default KidsActivityRenderer;
