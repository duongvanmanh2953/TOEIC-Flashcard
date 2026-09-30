import React, { useState } from 'react';
import {
  Volume2,
  Mic,
  Square,
  RotateCcw,
  Play,
  Pause,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Headphones,
  Clock,
  XCircle,
  Lightbulb,
} from 'lucide-react';
import { useAudioPronunciation } from '../../hooks/useAudioPronunciation';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { useLearningContext } from '../../contexts/LearningContext';
import { getSpeechLocale } from '../../config/languages';
import {
  evaluatePronunciation,
  listenSpeech,
  PronunciationEvaluationResult,
} from '../../lib/pronunciationEvaluator';
import { CountryFlag } from '../language/CountryFlag';

interface PronunciationPracticeCardProps {
  word: string;
  ipa?: string;
  meaning?: string;
  className?: string;
  lang?: string; // BCP-47 locale (e.g. 'de-DE', 'ja-JP') or language ID ('de', 'ja')
  languageName?: string;
  languageFlag?: string;
  onScored?: (score: number) => void;
}

export const PronunciationPracticeCard: React.FC<PronunciationPracticeCardProps> = ({
  word,
  ipa,
  meaning,
  className = '',
  lang,
  languageName,
  languageFlag,
  onScored,
}) => {
  let learningContext: any = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    learningContext = useLearningContext();
  } catch (_) {}

  const activeLang = learningContext?.activeLanguage;
  const effectiveLocale = getSpeechLocale(lang || activeLang?.speechLocale || 'en-US');
  const effectiveName = languageName || activeLang?.name || 'English';
  const effectiveFlag = languageFlag || activeLang?.flag || '🌐';

  const { speak, stop: stopNative, isPlaying: isPlayingNative } = useAudioPronunciation(effectiveLocale);
  const {
    status: recordStatus,
    isRecording,
    recordedUrl,
    isPlayingRecording,
    recordingSeconds,
    errorMessage: recorderError,
    startRecording,
    stopRecording,
    replayRecording,
    stopReplay,
    resetRecording,
  } = useVoiceRecorder();

  const [evaluation, setEvaluation] = useState<PronunciationEvaluationResult | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionControllerRef = React.useRef<{ stop: () => void } | null>(null);
  const speechTranscriptRef = React.useRef<string>('');

  const handlePlayNative = (rate: number = 1.0) => {
    stopReplay();
    speak(word, rate, effectiveLocale);
  };

  const handleStartRecord = async () => {
    stopNative();
    setEvaluation(null);
    setSpeechError(null);
    speechTranscriptRef.current = '';

    // Start audio recorder for playback
    await startRecording();

    // Start real speech recognition matching selected language locale
    try {
      const controller = listenSpeech({
        lang: effectiveLocale,
        maxDurationMs: 10000,
        onResult: (transcript) => {
          speechTranscriptRef.current = transcript;
        },
        onError: (err) => {
          if (err?.message === 'SPEECH_RECOGNITION_NOT_SUPPORTED') {
            setSpeechError('Trình duyệt chưa hỗ trợ Web Speech API. Vui lòng dùng Google Chrome / MS Edge.');
          }
        },
      });
      recognitionControllerRef.current = controller;
    } catch (e) {
      console.warn('Speech recognition init error:', e);
    }
  };

  const handleStopRecord = async () => {
    // Stop speech recognition controller
    if (recognitionControllerRef.current) {
      recognitionControllerRef.current.stop();
      recognitionControllerRef.current = null;
    }

    const res = await stopRecording();
    if (res && res.durationSec > 0.2) {
      // Small pause to allow speechRecognition onresult to flush
      setTimeout(() => {
        const spoken = speechTranscriptRef.current;
        const evalResult = evaluatePronunciation(word, spoken, 'adult');
        setEvaluation(evalResult);
        onScored?.(evalResult.score);
      }, 150);
    }
  };

  const handleToggleReplayRecording = () => {
    stopNative();
    if (isPlayingRecording) {
      stopReplay();
    } else {
      replayRecording();
    }
  };

  return (
    <div
      className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 ${className}`}
    >
      {/* Header: Word + IPA + Meaning */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{word}</h3>
            {ipa && (
              <span className="text-sm font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg">
                {ipa}
              </span>
            )}
            <span
              className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg inline-flex items-center gap-1.5 border border-slate-200/50 dark:border-slate-700/50"
              title={`Ngôn ngữ kiểm tra phát âm: ${effectiveName} (${effectiveLocale})`}
            >
              <CountryFlag languageId={activeLang?.id || lang} size="xs" />
              <span>{effectiveName}</span>
              <span className="text-[10px] font-mono text-slate-400">({effectiveLocale})</span>
            </span>
          </div>
          {meaning && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{meaning}</p>}
        </div>

        {evaluation && (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-bold text-xs self-start sm:self-auto ${
              evaluation.isPassing
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
            }`}
          >
            {evaluation.isPassing ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0 text-rose-500" />
            )}
            <div>
              <span className="font-extrabold">{evaluation.score}%</span>
              <span className="ml-1 text-[11px] opacity-90">
                {evaluation.isPassing ? '(Đạt chuẩn >90%)' : '(Chưa đạt, cần >90%)'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Evaluation Feedback Detail if available */}
      {evaluation && (
        <div
          className={`p-3 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
            evaluation.isPassing
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300'
              : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300'
          }`}
        >
          <div>
            <p className="font-semibold">{evaluation.feedback}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Hệ thống nhận diện giọng đọc: <strong className="font-mono text-indigo-600 dark:text-indigo-400">"{evaluation.spoken || '(Không nghe thấy âm thanh)'}"</strong>
            </p>
          </div>
        </div>
      )}

      {/* Error Message if Mic permission denied */}
      {(recorderError || speechError) && (
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{recorderError || speechError}</span>
        </div>
      )}

      {/* Interactive Controls Flow */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Step 1 & 2: Listen & Replay Native Pronunciation */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold uppercase text-slate-400 tracking-wider text-[10px]">
              1. Giọng Bản Xứ (Reference)
            </span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">{effectiveName} ({effectiveLocale})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePlayNative(1.0)}
              className={`flex-1 py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs active:scale-95 ${
                isPlayingNative
                  ? 'bg-indigo-600 text-white shadow-indigo-500/25 ring-2 ring-indigo-400'
                  : 'bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600'
              }`}
            >
              <Volume2 className={`w-4 h-4 ${isPlayingNative ? 'animate-pulse' : 'text-indigo-500'}`} />
              <span>{isPlayingNative ? 'Đang phát âm...' : 'Nghe phát âm'}</span>
            </button>

            <button
              type="button"
              onClick={() => handlePlayNative(0.75)}
              className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-700 hover:bg-amber-500/10 text-slate-600 dark:text-slate-200 hover:text-amber-600 text-xs font-bold border border-slate-200 dark:border-slate-600 transition active:scale-95 flex items-center gap-1.5"
              title="Nghe lại ở tốc độ chậm 0.75x"
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Chậm 0.75x</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 leading-tight flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Bấm lại bất cứ lúc nào để <strong>Nghe lại (Replay)</strong> chuẩn âm vị trước khi thu âm.</span>
          </p>
        </div>

        {/* Step 3, 4 & 5: Record -> Stop -> Replay Recording */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold uppercase text-slate-400 tracking-wider text-[10px]">
              2. Ghi Âm & Nghe Lại Giọng Bạn
            </span>
            {isRecording && (
              <span className="flex items-center gap-1.5 text-rose-500 font-mono font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}s
              </span>
            )}
          </div>

          {/* Record / Stop Action Button */}
          {!recordedUrl ? (
            <div>
              {isRecording ? (
                <button
                  type="button"
                  onClick={handleStopRecord}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition active:scale-95 animate-pulse"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Dừng thu âm ({effectiveName} - {effectiveLocale})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartRecord}
                  className="w-full py-2.5 px-3.5 rounded-xl btn-glass-primary text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition active:scale-95"
                >
                  <Mic className="w-4 h-4" />
                  <span>Thu âm giọng bạn ({effectiveName})</span>
                </button>
              )}
            </div>
          ) : (
            /* Recorded Playback & Re-record Controls */
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleReplayRecording}
                className={`flex-1 py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs active:scale-95 ${
                  isPlayingRecording
                    ? 'bg-emerald-600 text-white shadow-emerald-500/25 ring-2 ring-emerald-400'
                    : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {isPlayingRecording ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isPlayingRecording ? 'Đang nghe giọng bạn...' : 'Nghe lại bản thu âm của bạn'}</span>
              </button>

              <button
                type="button"
                onClick={handleStartRecord}
                className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-600 transition active:scale-95"
                title="Thu âm lại"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}

          <p className="text-[11px] text-slate-400 leading-tight">
            {isRecording
              ? 'Hãy phát âm từ to rõ vào Micro điện thoại...'
              : recordedUrl
              ? 'Bấm nút trên để nghe lại và tự so sánh ngữ điệu với bản xứ.'
              : 'Bấm thu âm & đọc từ để hệ thống phân tích đối sánh.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PronunciationPracticeCard;
