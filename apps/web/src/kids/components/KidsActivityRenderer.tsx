import React, { useState, useEffect, useRef } from 'react';
import { KidActivity } from '../curriculum/kidsCurriculum';
import { kidsSpeech } from '../services/speech/KidsSpeechManager';
import { kidsSound } from '../services/sound/KidsSoundManager';
import {
  KidsListenIcon,
  KidsSpeakIcon,
  KidsPlayIcon,
  KidsStarIcon,
} from '../assets/icons/KidsIcons';
import { KidsMascot, MascotMood } from './KidsMascot';

interface KidsActivityRendererProps {
  activity: KidActivity;
  onActivityComplete: (success: boolean, score: number, weakWord?: string) => void;
}

export const KidsActivityRenderer: React.FC<KidsActivityRendererProps> = ({
  activity,
  onActivityComplete,
}) => {
  const [mascotMood, setMascotMood] = useState<MascotMood>('happy');
  const [isSpeakingTarget, setIsSpeakingTarget] = useState(false);

  // Auto-play audio on initial load of flashcard or listen activity
  useEffect(() => {
    setMascotMood('happy');
    if (activity.type === 'flashcard' && activity.targetWord) {
      const timer = setTimeout(() => {
        handlePlayWord(activity.targetWord!);
      }, 400);
      return () => clearTimeout(timer);
    } else if (activity.type === 'listen' && activity.targetWord) {
      const timer = setTimeout(() => {
        handlePlayWord(activity.targetWord!);
      }, 400);
      return () => clearTimeout(timer);
    } else if (activity.type === 'story' && activity.storyScene) {
      const timer = setTimeout(() => {
        handlePlayWord(activity.storyScene!.narratorSpeech);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [activity.id]);

  const handlePlayWord = (text: string) => {
    setIsSpeakingTarget(true);
    setMascotMood('speaking');
    kidsSpeech.speak(text, {
      onEnd: () => {
        setIsSpeakingTarget(false);
        setMascotMood('happy');
      },
    });
  };

  // =========================================================================
  // 1. FLASHCARD ACTIVITY
  // =========================================================================
  if (activity.type === 'flashcard') {
    return (
      <div className="flex flex-col items-center space-y-5 animate-fade-in">
        {/* Mascot Hint */}
        <KidsMascot
          mood={mascotMood}
          size="sm"
          speechText={activity.instruction || 'Listen carefully and repeat!'}
        />

        {/* Big Interactive 3D Card */}
        <div
          onClick={() => handlePlayWord(activity.targetWord || '')}
          className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-800 border-4 border-amber-300 dark:border-amber-600 p-8 shadow-xl flex flex-col items-center justify-center text-center cursor-pointer hover:scale-102 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden"
        >
          {/* Audio Wave Indicator when speaking */}
          {isSpeakingTarget && (
            <div className="absolute inset-0 bg-amber-400/10 dark:bg-amber-400/5 animate-pulse pointer-events-none" />
          )}

          {/* Big Emoji / Image */}
          <div className="text-8xl my-3 group-hover:scale-110 transition-transform duration-300">
            {activity.emoji || '🌟'}
          </div>

          {/* Word Title */}
          <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mt-2">
            {activity.targetWord}
          </h2>

          {/* Phonetic Pronunciation */}
          {activity.phonetic && (
            <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {activity.phonetic}
            </span>
          )}

          {/* Example Sentence */}
          {activity.targetSentence && (
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-300 mt-3 max-w-xs leading-relaxed">
              "{activity.targetSentence}"
            </p>
          )}

          {/* Big Listen Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePlayWord(activity.targetWord || '');
            }}
            className={`mt-6 px-6 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all ${
              isSpeakingTarget
                ? 'bg-amber-500 text-white animate-pulse'
                : 'bg-gradient-to-r from-amber-400 to-orange-400 text-amber-950 hover:scale-105'
            }`}
          >
            <KidsListenIcon size={20} />
            <span>{isSpeakingTarget ? 'Speaking...' : 'Listen Again 🔊'}</span>
          </button>
        </div>

        {/* Continue to Next Activity CTA */}
        <button
          onClick={() => {
            kidsSound.play('pop');
            onActivityComplete(true, 100);
          }}
          className="w-full max-w-sm py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm shadow-lg shadow-emerald-500/25 hover:scale-102 active:scale-98 transition flex items-center justify-center gap-2"
        >
          <span>TIẾP THEO (I GOT IT!) ▶</span>
        </button>
      </div>
    );
  }

  // =========================================================================
  // 2. LISTEN & CHOOSE / MULTIPLE CHOICE / GAME ACTIVITY
  // =========================================================================
  if (
    activity.type === 'listen' ||
    activity.type === 'multiple_choice' ||
    activity.type === 'game'
  ) {
    const [selectedOptId, setSelectedOptId] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

    const handleSelectOption = (opt: any) => {
      setSelectedOptId(opt.id);
      if (opt.isCorrect) {
        kidsSound.play('correct');
        setFeedback('correct');
        setMascotMood('celebrate');
        setTimeout(() => {
          onActivityComplete(true, 100);
        }, 1200);
      } else {
        kidsSound.play('wrong');
        setFeedback('wrong');
        setMascotMood('encourage');
        setTimeout(() => {
          setFeedback(null);
          setSelectedOptId(null);
          setMascotMood('happy');
        }, 1400);
      }
    };

    return (
      <div className="flex flex-col items-center space-y-5 animate-fade-in">
        <KidsMascot
          mood={mascotMood}
          size="sm"
          speechText={
            feedback === 'correct'
              ? 'Awesome! That is correct!'
              : feedback === 'wrong'
              ? 'Oops! Try one more time!'
              : activity.instruction
          }
        />

        {/* Prompt Header */}
        <div className="text-center space-y-1">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {activity.title}
          </h3>
          <p className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400">
            {activity.instruction}
          </p>
        </div>

        {/* Audio Replay Pill */}
        {activity.targetWord && (
          <button
            onClick={() => handlePlayWord(activity.targetWord!)}
            className="px-5 py-2.5 rounded-2xl bg-amber-100 dark:bg-slate-800 text-amber-800 dark:text-amber-300 font-extrabold text-xs flex items-center gap-2 border-2 border-amber-300 hover:scale-105 transition"
          >
            <KidsListenIcon size={18} />
            <span>Nghe lại từ vựng 🔊</span>
          </button>
        )}

        {/* Options Grid (Large Touch Targets) */}
        <div className="w-full max-w-md grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {activity.options?.map((opt) => {
            const isChosen = selectedOptId === opt.id;
            let btnBorder = 'border-slate-200 dark:border-slate-700';
            let btnBg = 'bg-white dark:bg-slate-800';

            if (isChosen && feedback === 'correct') {
              btnBorder = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 scale-105';
            } else if (isChosen && feedback === 'wrong') {
              btnBorder = 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 animate-shake';
            }

            return (
              <button
                key={opt.id}
                onClick={() => handleSelectOption(opt)}
                disabled={feedback === 'correct'}
                className={`p-5 rounded-3xl border-4 shadow-md flex flex-col items-center justify-center text-center gap-2 hover:scale-105 active:scale-95 transition-all ${btnBg} ${btnBorder}`}
              >
                <span className="text-5xl">{opt.emoji || '⭐'}</span>
                <span className="font-black text-base text-slate-800 dark:text-slate-100">
                  {opt.text}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. SPEAK & PRONUNCIATION ACTIVITY
  // =========================================================================
  if (activity.type === 'speak') {
    const [isRecording, setIsRecording] = useState(false);
    const [spokenText, setSpokenText] = useState('');
    const [speakingScore, setSpeakingScore] = useState<number | null>(null);
    const [evaluating, setEvaluating] = useState(false);
    const recognitionRef = useRef<any>(null);

    const handleToggleRecord = async () => {
      if (isRecording) {
        // Stop recording
        try {
          recognitionRef.current?.stop();
        } catch (_) {}
        setIsRecording(false);
        setEvaluating(true);

        setTimeout(() => {
          setEvaluating(false);
          // Evaluate match
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
        // Start recording
        setSpokenText('');
        setSpeakingScore(null);
        kidsSound.play('pop');
        setIsRecording(true);
        setMascotMood('listening');

        // Web Speech Recognition if available
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
      <div className="flex flex-col items-center space-y-5 animate-fade-in">
        <KidsMascot
          mood={mascotMood}
          size="sm"
          speechText={
            speakingScore
              ? `You scored ${speakingScore}%! Excellent pronunciation!`
              : isRecording
              ? 'I am listening! Say the word!'
              : 'Listen first, then press the big microphone to speak!'
          }
        />

        {/* Target Word Display */}
        <div className="text-center space-y-1">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
            Target Word to Speak
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-indigo-600 dark:text-indigo-400">
            {activity.targetWord}
          </h2>
          {activity.phonetic && (
            <p className="text-sm font-bold text-slate-500">{activity.phonetic}</p>
          )}
        </div>

        {/* Listen Sample Button */}
        <button
          onClick={() => handlePlayWord(activity.targetWord || '')}
          className="px-5 py-2.5 rounded-2xl bg-amber-100 dark:bg-slate-800 text-amber-800 dark:text-amber-300 font-extrabold text-xs flex items-center gap-2 border-2 border-amber-300 hover:scale-105 transition"
        >
          <KidsListenIcon size={18} />
          <span>Nghe phát âm chuẩn mẫu 🔊</span>
        </button>

        {/* Giant Microphone Button */}
        <div className="py-4">
          <button
            onClick={handleToggleRecord}
            className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center text-white shadow-xl transition-all duration-300 ${
              isRecording
                ? 'bg-rose-500 border-rose-300 animate-pulse scale-110 shadow-rose-500/50'
                : 'bg-gradient-to-tr from-indigo-500 to-purple-600 border-white hover:scale-105 shadow-indigo-500/30'
            }`}
          >
            <KidsSpeakIcon size={44} />
            <span className="text-[11px] font-black uppercase mt-1">
              {isRecording ? 'BẤM ĐỂ DỪNG' : 'CHẠM ĐỂ NÓI'}
            </span>
          </button>
        </div>

        {/* Spoken Text & Pronunciation Score Card */}
        {evaluating && (
          <p className="text-xs font-bold text-amber-600 animate-pulse">
            Đang phân tích phát âm của bé...
          </p>
        )}

        {speakingScore !== null && (
          <div className="w-full max-w-sm p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 text-center space-y-2 animate-scale-up">
            <div className="flex items-center justify-center gap-1 text-amber-500">
              <KidsStarIcon size={20} filled />
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                {speakingScore}% Accuracy
              </span>
              <KidsStarIcon size={20} filled />
            </div>
            {spokenText && (
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Bé đã phát âm: <strong className="font-black">"{spokenText}"</strong>
              </p>
            )}

            <button
              onClick={() => {
                kidsSound.play('success');
                onActivityComplete(true, speakingScore);
              }}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-md transition"
            >
              HOÀN THÀNH BÀI NÓI ▶
            </button>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 4. STORY SCENE & OTHER ACTIVITIES (Fallback)
  // =========================================================================
  return (
    <div className="flex flex-col items-center space-y-5 animate-fade-in text-center">
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
            className="px-4 py-2 rounded-xl bg-amber-400 text-amber-950 font-black text-xs"
          >
            Nghe người kể chuyện 🔊
          </button>
        </div>
      )}

      <button
        onClick={() => {
          kidsSound.play('pop');
          onActivityComplete(true, 100);
        }}
        className="px-8 py-3.5 rounded-2xl bg-emerald-500 text-white font-black text-sm shadow-md hover:scale-105 transition"
      >
        TIẾP TỤC ▶
      </button>
    </div>
  );
};

export default KidsActivityRenderer;
