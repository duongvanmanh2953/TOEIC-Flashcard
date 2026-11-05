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
  ThumbsUp,
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
  exampleSentence?: string;
  onComplete?: () => void;
  phonetic?: string;
}

export const PronunciationPracticeCard: React.FC<PronunciationPracticeCardProps> = ({
  word,
  ipa,
  phonetic,
  meaning,
  className = '',
  lang,
  languageName,
  languageFlag,
  onScored,
  exampleSentence,
  onComplete,
}) => {
  const displayIpa = ipa || phonetic;
  let learningContext: any = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    learningContext = useLearningContext();
  } catch (_) {}

  const activeLang = learningContext?.activeLanguage;
  const effectiveLocale = getSpeechLocale(lang || activeLang?.speechLocale || 'en-US');
  const effectiveName = languageName || activeLang?.name || 'English';

  const { speak, stop: stopNative, isPlaying: isPlayingNative } = useAudioPronunciation(effectiveLocale);
  const {
    isRecording,
    recordedUrl,
    isPlayingRecording,
    recordingSeconds,
    errorMessage: recorderError,
    startRecording,
    stopRecording,
    replayRecording,
    stopReplay,
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
    const duration = res?.durationSec || 0;

    // Small pause to allow speechRecognition onresult to flush
    setTimeout(() => {
      const spoken = speechTranscriptRef.current;
      if (duration < 0.25 && !spoken) {
        // Handled as insufficient audio, no penalty
        const notEnoughResult: PronunciationEvaluationResult = {
          target: word,
          spoken: '',
          score: 0,
          isPassing: false,
          tier: 'not_enough_audio',
          threshold: 55,
          mode: 'adult',
          status: 'empty',
          feedback: 'Âm thanh thu được quá ngắn hoặc chưa rõ. Vui lòng bấm mic và nói to hơn gần micro (không bị trừ điểm).',
          detailedDifferences: {
            suggestion: 'Hãy giữ nút mic hoặc đợi nhịp thu âm bắt đầu trước khi phát âm.',
          },
        };
        setEvaluation(notEnoughResult);
        return;
      }

      const evalResult = evaluatePronunciation(word, spoken, 'adult');
      setEvaluation(evalResult);

      if (evalResult.tier !== 'not_enough_audio') {
        onScored?.(evalResult.score);
        if (evalResult.isPassing) {
          onComplete?.();
        }
      }
    }, 150);
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
            {displayIpa && (
              <span className="text-sm font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg">
                {displayIpa}
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
          {exampleSentence && (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-0.5">"{exampleSentence}"</p>
          )}
        </div>

        {evaluation && (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-bold text-xs self-start sm:self-auto ${
              evaluation.tier === 'excellent'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : evaluation.tier === 'good'
                ? 'bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300'
                : evaluation.tier === 'understandable'
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300'
                : evaluation.tier === 'not_enough_audio'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
            }`}
          >
            {evaluation.tier === 'excellent' ? (
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-500" />
            ) : evaluation.tier === 'good' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-500" />
            ) : evaluation.tier === 'understandable' ? (
              <ThumbsUp className="w-4 h-4 shrink-0 text-indigo-500" />
            ) : evaluation.tier === 'not_enough_audio' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0 text-rose-500" />
            )}
            <div>
              {evaluation.tier === 'not_enough_audio' ? (
                <span className="font-extrabold">Chưa nhận diện âm</span>
              ) : (
                <>
                  <span className="font-extrabold">{evaluation.score}%</span>
                  <span className="ml-1 text-[11px] opacity-90">
                    {evaluation.tier === 'excellent'
                      ? '(Xuất sắc)'
                      : evaluation.tier === 'good'
                      ? '(Đạt chuẩn)'
                      : evaluation.tier === 'understandable'
                      ? '(Dễ hiểu)'
                      : '(Cần cải thiện)'}
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Evaluation Feedback Detail */}
      {evaluation && (
        <div
          className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
            evaluation.tier === 'excellent'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
              : evaluation.tier === 'good'
              ? 'bg-teal-50/70 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800/40 text-teal-900 dark:text-teal-200'
              : evaluation.tier === 'understandable'
              ? 'bg-indigo-50/70 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/40 text-indigo-900 dark:text-indigo-200'
              : evaluation.tier === 'not_enough_audio'
              ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200'
              : 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div>
            <p className="font-bold leading-relaxed">{evaluation.feedback}</p>
            {evaluation.spoken && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Hệ thống nhận diện giọng đọc: <strong className="font-mono text-indigo-600 dark:text-indigo-400">"{evaluation.spoken}"</strong>
              </p>
            )}
          </div>

          {/* Granular Sound Feedback Tags */}
          {evaluation.detailedDifferences?.soundFeedback && evaluation.detailedDifferences.soundFeedback.length > 0 && (
            <div className="pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50 flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Chi tiết âm vị:</span>
              {evaluation.detailedDifferences.soundFeedback.map((sf, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 ${
                    sf.type === 'good'
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                      : sf.type === 'missing'
                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                      : 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300'
                  }`}
                  title={sf.tip}
                >
                  {sf.type === 'good' ? '✓ ' : '• '}
                  {sf.sound}
                </span>
              ))}
            </div>
          )}
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
              className={`flex-1 py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs active:scale-95 cursor-pointer ${
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
              className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-700 hover:bg-amber-500/10 text-slate-600 dark:text-slate-200 hover:text-amber-600 text-xs font-bold border border-slate-200 dark:border-slate-600 transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
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
                  className="w-full py-2.5 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition active:scale-95 animate-pulse cursor-pointer"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Dừng thu âm ({effectiveName})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartRecord}
                  className="w-full py-2.5 px-3.5 rounded-xl btn-glass-primary text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition active:scale-95 cursor-pointer"
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
                className={`flex-1 py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs active:scale-95 cursor-pointer ${
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
                className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-600 transition active:scale-95 cursor-pointer"
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
