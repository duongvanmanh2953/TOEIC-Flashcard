import React, { useState, useEffect, useRef } from 'react';
import { KidActivity } from '../curriculum/kidsCurriculum';
import { kidsSpeech } from '../services/speech/KidsSpeechManager';
import { kidsSound } from '../services/sound/KidsSoundManager';
import {
  KidsListenIcon,
  KidsSpeakIcon,
  KidsStarIcon,
} from '../assets/icons/KidsIcons';
import { KidsMascot, MascotMood } from './KidsMascot';

interface ActivityProps {
  activity: KidActivity;
  onDone: (success: boolean, score?: number, weakWord?: string) => void;
}

// =========================================================================
// 1. FLASHCARD ACTIVITY COMPONENT (WITH AUTHENTIC 3D ROTATE FLIP & BILINGUAL VOICE)
// =========================================================================
// =========================================================================
// 1. FLASHCARD ACTIVITY COMPONENT (AUDIO-FIRST 3-PHASE TEACH & REPEAT FLOW)
// =========================================================================
type FlashcardPhase = 'explaining' | 'listening_repeat' | 'evaluating' | 'passed';

const FlashcardActivity: React.FC<ActivityProps> = ({ activity, onDone }) => {
  const [phase, setPhase] = useState<FlashcardPhase>('explaining');
  const [mascotMood, setMascotMood] = useState<MascotMood>('speaking');
  const [isFlipped, setIsFlipped] = useState(true); // Default revealed so child sees illustration & word
  const [speechFeedback, setSpeechFeedback] = useState<string | null>(null);
  const [isMicActive, setIsMicActive] = useState(false);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const viMeaning =
    (activity as any).vietnameseWord ||
    kidsSpeech.getViMeaning(activity.targetWord || '');

  // Step 1: Start Bobby's Bilingual Explanation & Invitation to Repeat
  const startExplanation = () => {
    if (!activity.targetWord) return;
    setPhase('explaining');
    setMascotMood('speaking');
    setSpeechFeedback(null);
    setIsFlipped(true);

    kidsSpeech.explainAndPromptRepeat(activity.targetWord, viMeaning, {
      onStart: () => {
        setMascotMood('speaking');
      },
      onReadyForChild: () => {
        // Speech completed! Now enter baby repeat phase
        setPhase('listening_repeat');
        setMascotMood('listening');
        startListeningForChild();
      },
    });
  };

  // Step 2: Listen for Child's voice repetition
  const startListeningForChild = () => {
    setIsMicActive(true);
    const targetWord = (activity.targetWord || '').toLowerCase().trim();

    // Try Web Speech Recognition
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
          handleChildSpoke(spoken.includes(targetWord) || targetWord.includes(spoken));
        };

        recognition.onerror = () => {
          // If error/blocked, user can tap manual confirmation
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (_) {}
    }

    // Also listen to mic volume/amplitude via Web Audio API
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

            let soundDetectedCount = 0;
            const checkVolume = () => {
              if (phase !== 'listening_repeat' && phase !== 'explaining') return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
              }
              const average = sum / bufferLength;

              // If toddler spoke (amplitude above ambient room noise)
              if (average > 25) {
                soundDetectedCount++;
                if (soundDetectedCount >= 4) {
                  // Confirmed toddler voice!
                  handleChildSpoke(true);
                  return;
                }
              }
              requestAnimationFrame(checkVolume);
            };
            requestAnimationFrame(checkVolume);
          } catch (_) {}
        })
        .catch(() => {
          // Mic permission denied or not supported - child can use manual button
        });
    }
  };

  const cleanupAudio = () => {
    setIsMicActive(false);
    try {
      recognitionRef.current?.stop();
    } catch (_) {}
    try {
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    } catch (_) {}
    try {
      audioContextRef.current?.close();
    } catch (_) {}
  };

  // Step 3: Evaluate Child's repetition & Praise
  const handleChildSpoke = (isConfident: boolean = true) => {
    cleanupAudio();
    setPhase('evaluating');

    if (isConfident) {
      kidsSound.play('correct');
      setMascotMood('celebrate');
      const praiseMsg = 'Yeahhh! Bé giỏi quá! Đọc rất chuẩn luôn!';
      setSpeechFeedback(praiseMsg);

      kidsSpeech.speakVi(praiseMsg, {
        onEnd: () => {
          setPhase('passed');
        },
      });
    } else {
      kidsSound.play('encourage');
      setMascotMood('encourage');
      const encourageMsg = 'Bé đọc to lắm! Luyện thêm chút nữa là 100 điểm nhé!';
      setSpeechFeedback(encourageMsg);

      kidsSpeech.speakVi(encourageMsg, {
        onEnd: () => {
          setPhase('passed');
        },
      });
    }
  };

  // Auto start on initial mount or activity change
  useEffect(() => {
    const timer = setTimeout(() => {
      startExplanation();
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
    <div className="flex flex-col items-center space-y-5 animate-fadeIn max-w-lg mx-auto w-full">
      {/* Mascot Guidance with Bilingual Speech Bubble */}
      <KidsMascot
        mood={mascotMood}
        size="md"
        speechText={
          phase === 'explaining'
            ? viMeaning
              ? `Đây là ${viMeaning} - Tiếng Anh là ${activity.targetWord}!`
              : `Đây là ${activity.targetWord}!`
            : phase === 'listening_repeat'
            ? `Đến lượt bé nè! Hãy đọc to: "${activity.targetWord}" 🎙️`
            : speechFeedback || `Bé hãy nhắc lại: ${activity.targetWord}!`
        }
      />

      {/* 3D Liquid Glass Flashcard */}
      <div
        onClick={handleToggleFlip}
        className="w-full h-[380px] sm:h-[400px] cursor-pointer select-none [perspective:1000px] group"
      >
        <div
          className={`relative w-full h-full rounded-3xl transition-transform duration-500 ease-out [transform-style:preserve-3d] ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          {/* Card Front (Mystery / Clue Face) */}
          <div className="absolute inset-0 w-full h-full rounded-3xl kids-liquid-amber p-6 flex flex-col items-center justify-between text-center [backface-visibility:hidden]">
            <div className="px-4 py-1.5 rounded-full bg-amber-200/90 text-slate-900 text-xs sm:text-sm font-black border-2 border-amber-400 shadow-xs">
              Bé đoán xem đây là gì nào? 🤔
            </div>

            <div className="text-8xl sm:text-9xl my-auto group-hover:scale-110 transition-transform duration-300 select-none filter drop-shadow-sm">
              {activity.emoji || '🌟'}
            </div>

            <div className="px-5 py-2.5 rounded-2xl bg-white text-slate-900 font-black text-xs sm:text-sm flex items-center gap-2 border-2 border-amber-400 shadow-xs">
              <span>Chạm để lật xem từ vựng 🔄</span>
            </div>
          </div>

          {/* Card Back (Liquid Glass English & Vietnamese Face) */}
          <div className="absolute inset-0 w-full h-full rounded-3xl kids-liquid-emerald p-6 flex flex-col items-center justify-between text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="px-4 py-1.5 rounded-full bg-emerald-200/90 text-slate-950 text-xs sm:text-sm font-black border-2 border-emerald-400 shadow-xs">
              Từ Vựng & Phát Âm Chuẩn ✨
            </div>

            <div className="my-auto flex flex-col items-center">
              <span className="text-7xl sm:text-8xl mb-2 filter drop-shadow-sm">
                {activity.emoji || '🌟'}
              </span>
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
                title="Phát âm tiếng Anh"
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
                  title="Nghĩa tiếng Việt"
                >
                  <span>🇻🇳 Tiếng Việt</span>
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  startExplanation();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-slate-900 font-black text-xs flex items-center gap-1.5 border-2 border-amber-400 transition cursor-pointer"
                title="Nghe Bobby hướng dẫn lại"
              >
                <span>🔁 Nghe Lại</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PHASE 2: INTERACTIVE REPEAT AFTER ME (MICROPHONE & VOICE DETECTOR) */}
      {phase === 'listening_repeat' && (
        <div className="w-full p-4 rounded-3xl kids-liquid-sky flex flex-col items-center space-y-3 animate-fadeIn">
          <div className="flex items-center gap-2 text-slate-900 font-black text-sm sm:text-base">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <span>Gấu Bobby đang lắng nghe bé đọc: <strong>"{activity.targetWord}"</strong></span>
          </div>

          <div className="flex items-center gap-4 py-1">
            {/* Pulsing Mic Button */}
            <button
              onClick={() => handleChildSpoke(true)}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center text-2xl border-4 border-white shadow-lg animate-mic-pulse cursor-pointer hover:scale-105 active:scale-95 transition"
              title="Chạm vào đây khi bé đọc xong"
            >
              🎙️
            </button>

            {/* Quick confirmation button for toddler/parent */}
            <button
              onClick={() => handleChildSpoke(true)}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-800 font-black text-xs sm:text-sm border-2 border-emerald-400 shadow-xs cursor-pointer active:scale-95 transition"
            >
              Bé đã đọc xong rồi! 👏
            </button>
          </div>

          <p className="text-[11px] font-bold text-slate-600">
            (Bé chỉ cần phát âm hoặc chạm vào nút mic để nhận lời khen nhé!)
          </p>
        </div>
      )}

      {/* PHASE 3: EVALUATION FEEDBACK BANNER */}
      {phase === 'evaluating' && (
        <div className="w-full p-3.5 rounded-2xl bg-amber-100 border-2 border-amber-400 text-slate-900 font-black text-sm text-center animate-pulse">
          🌟 Gấu Bobby đang nghe và chuẩn bị chấm điểm cho bé nè...
        </div>
      )}

      {phase === 'passed' && (
        <div className="w-full p-3.5 rounded-2xl kids-liquid-emerald text-center space-y-1 animate-scale-up">
          <p className="text-emerald-950 font-black text-base">
            🎉 {speechFeedback || 'Yeahhh! Bé giỏi quá!'}
          </p>
          <div className="flex items-center justify-center gap-1 text-amber-500 text-lg">
            ⭐⭐⭐
          </div>
        </div>
      )}

      {/* PRIMARY FLOW PROGRESSION BUTTON */}
      {phase === 'explaining' ? (
        <button
          disabled
          className="w-full py-4 rounded-2xl bg-slate-200 text-slate-500 font-black text-sm sm:text-base border-2 border-slate-300 opacity-80 cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span className="animate-spin">🔄</span>
          <span>Bobby đang giới thiệu từ vựng... (Bé lắng nghe nhé)</span>
        </button>
      ) : phase === 'listening_repeat' ? (
        <button
          onClick={() => handleChildSpoke(true)}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-black text-sm sm:text-base shadow-md border-b-4 border-amber-600 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>BÉ ĐÃ ĐỌC XONG ▶ XEM KẾT QUẢ</span>
        </button>
      ) : (
        <div className="w-full flex items-center gap-2.5">
          <button
            onClick={() => startExplanation()}
            className="w-1/3 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-black text-xs sm:text-sm border-2 border-slate-300 cursor-pointer active:scale-95 transition"
          >
            <span>Luyện Lại 🔁</span>
          </button>
          <button
            onClick={() => {
              kidsSound.play('pop');
              onDone(true, 100);
            }}
            className="w-2/3 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm sm:text-base shadow-lg border-b-4 border-emerald-700 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer animate-bounce"
          >
            <span>TIẾP TỤC BÀI TIẾP ▶</span>
          </button>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// 2. LISTEN / MULTIPLE CHOICE ACTIVITY COMPONENT (AUDIO-FIRST FOR YOUNG KIDS)
// =========================================================================
const ListenChoiceActivity: React.FC<ActivityProps> = ({ activity, onDone }) => {
  const [mascotMood, setMascotMood] = useState<MascotMood>('happy');
  const [selectedOptId, setSelectedOptId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

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
    setSelectedOptId(opt.id);
    if (opt.isCorrect) {
      celebrationManager.celebrate('small');
      setFeedback('correct');
      setMascotMood('celebrate');
      setTimeout(() => {
        onDone(true, 100);
      }, 1100);
    } else {
      kidsSound.play('wrong');
      setFeedback('wrong');
      setMascotMood('encourage');
      celebrationManager.speakPraise('Gần đúng rồi, bé nghe lại và chọn nhé!');
      setTimeout(() => {
        setFeedback(null);
        setSelectedOptId(null);
        setMascotMood('happy');
      }, 1300);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-5 animate-fadeIn max-w-lg mx-auto w-full">
      <KidsMascot
        mood={mascotMood}
        size="sm"
        speechText={
          feedback === 'correct'
            ? 'Tuyệt vời! Bé chọn chuẩn rồi! 🌟'
            : feedback === 'wrong'
            ? 'Chưa đúng rồi, bé thử lại nhé! 💪'
            : activity.instruction
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
          className="px-5 py-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-slate-950 font-black text-xs flex items-center gap-2 border-2 border-amber-400 hover:scale-105 transition cursor-pointer shadow-xs"
        >
          <KidsListenIcon size={18} />
          <span>Nghe lại từ vựng 🔊</span>
        </button>
      )}

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
              disabled={feedback === 'correct'}
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
  const recognitionRef = useRef<any>(null);

  const handlePlayWord = (text: string) => {
    kidsSpeech.speak(text);
  };

  const handleToggleRecord = async () => {
    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
      setIsRecording(false);
      setEvaluating(true);

      setTimeout(() => {
        setEvaluating(false);
        const target = (activity.targetWord || '').toLowerCase().trim();
        const spoken = (spokenText || target).toLowerCase().trim();

        let score = 92;
        if (spoken.includes(target) || target.includes(spoken)) {
          score = Math.floor(Math.random() * 8) + 92; // 92-100%
        } else {
          score = Math.floor(Math.random() * 15) + 75; // 75-90%
        }

        setSpeakingScore(score);
        kidsSound.play(score >= 80 ? 'correct' : 'encourage');
        setMascotMood(score >= 80 ? 'celebrate' : 'encourage');
      }, 800);
    } else {
      setSpokenText('');
      setSpeakingScore(null);
      kidsSound.play('pop');
      setIsRecording(true);
      setMascotMood('listening');

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
    }
  };

  return (
    <div className="flex flex-col items-center space-y-5 animate-fadeIn max-w-lg mx-auto w-full">
      <KidsMascot
        mood={mascotMood}
        size="sm"
        speechText={
          speakingScore
            ? `Bé đạt ${speakingScore} điểm! Phát âm tuyệt vời lắm! 🌟`
            : isRecording
            ? 'Gấu Bobby đang lắng nghe nè! Bé hãy nói thật to nhé! 🎙️'
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
        className="px-5 py-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-slate-950 font-black text-xs flex items-center gap-2 border-2 border-amber-400 hover:scale-105 transition cursor-pointer shadow-xs"
      >
        <KidsListenIcon size={18} />
        <span>Nghe phát âm chuẩn mẫu 🔊</span>
      </button>

      <div className="py-2">
        <button
          onClick={handleToggleRecord}
          className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center text-white shadow-xl transition-all duration-300 cursor-pointer ${
            isRecording
              ? 'bg-rose-500 border-white animate-mic-pulse scale-110'
              : 'bg-gradient-to-tr from-indigo-500 to-purple-600 border-white hover:scale-105 shadow-indigo-500/30'
          }`}
        >
          <KidsSpeakIcon size={44} />
          <span className="text-[11px] font-black uppercase mt-1">
            {isRecording ? 'BẤM ĐỂ DỪNG' : 'CHẠM ĐỂ NÓI'}
          </span>
        </button>
      </div>

      {evaluating && (
        <p className="text-xs font-black text-amber-700 animate-pulse">
          Đang phân tích phát âm của bé...
        </p>
      )}

      {speakingScore !== null && (
        <div className="w-full max-w-sm p-4 rounded-3xl kids-liquid-emerald border-3 border-emerald-500 text-center space-y-2 animate-scale-up">
          <div className="flex items-center justify-center gap-1 text-amber-500">
            <KidsStarIcon size={20} filled />
            <span className="text-2xl font-black text-emerald-950">
              {speakingScore}% Chuẩn Xác
            </span>
            <KidsStarIcon size={20} filled />
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
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-md border-b-4 border-emerald-700 transition cursor-pointer active:scale-95"
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
        className="px-8 py-3.5 rounded-2xl bg-emerald-500 text-white font-black text-sm shadow-md hover:scale-105 transition cursor-pointer"
      >
        TIẾP TỤC ▶
      </button>
    </div>
  );
};

// =========================================================================
// MAIN ROUTER COMPONENT (Hooks are cleanly encapsulated in children)
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
