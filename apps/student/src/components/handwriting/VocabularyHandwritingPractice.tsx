import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RotateCcw,
  Eye,
  EyeOff,
  Play,
  Pause,
  Grid,
  CheckCircle2,
  AlertCircle,
  Volume2,
  ChevronRight,
  Maximize2,
  Minimize2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import HanziWriter from 'hanzi-writer';
import * as kakitori from '@k1low/kakitori';
import { usePerformance } from '../../contexts/PerformanceContext';
import {
  HandwritingPoint,
  HandwritingStroke,
  CharacterStrokeModel,
  CharacterReference,
  CharacterCompletionState,
  SingleStrokeEvaluation,
  CharacterEvaluationResult,
} from '../../lib/handwriting/types';
import {
  evaluateSingleStroke,
  evaluateFullCharacter,
  buildCharacterReference,
} from '../../lib/handwriting';
import {
  segmentIntoWritingUnits,
  segmentGraphemes,
  WritingUnit,
  handwritingRegistry,
  HandwritingResult,
} from '../../lib/handwriting';
import { COMMON_CHARACTER_DICTIONARY } from '../../lib/handwriting/characterDictionary';
import api from '../../lib/api';

export interface VocabularyHandwritingPracticeProps {
  word: string;
  meaning: string;
  pronunciation?: string;
  romaji?: string;
  pinyin?: string;
  languageId?: string;
  showGuide?: boolean;
  onWordComplete: (accuracy: number, isCorrect: boolean) => void;
  onNextWord: () => void;
}

const LOGICAL_CANVAS_SIZE = 500;

// Global in-memory cache for character stroke datasets to prevent redundant network fetches
const charDataCache = new Map<string, any>();

function isKanaChar(code: number): boolean {
  return (code >= 0x3040 && code <= 0x309f) || (code >= 0x30a0 && code <= 0x30ff);
}

/**
 * Universal grapheme segmentation helper (backward compatibility)
 */
export function segmentIntoGraphemes(text: string): string[] {
  return segmentGraphemes(text);
}

/**
 * Check if a character is a CJK ideograph or kana supported by HanziWriter/Kakitori
 */
function isCJKCharacter(char: string): boolean {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return (
    (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified Ideographs
    (code >= 0x3400 && code <= 0x4dbf) || // CJK Extension A
    (code >= 0x3040 && code <= 0x309f) || // Hiragana
    (code >= 0x30a0 && code <= 0x30ff)    // Katakana
  );
}

export const VocabularyHandwritingPractice: React.FC<VocabularyHandwritingPracticeProps> = ({
  word,
  meaning,
  pronunciation,
  romaji,
  pinyin,
  languageId = 'ja',
  showGuide = true,
  onWordComplete,
  onNextWord,
}) => {
  const { isUltraEfficient } = usePerformance();

  // Multi-character segmentation using grapheme clusters & script-aware units
  const writingUnits = segmentIntoWritingUnits(word, languageId);
  const characters = writingUnits.length > 0 ? writingUnits.map((u) => u.unit) : [word];
  const [activeCharIndex, setActiveCharIndex] = useState(0);
  const activeCharIndexRef = useRef(activeCharIndex);
  activeCharIndexRef.current = activeCharIndex;

  const currentUnit: WritingUnit | undefined = writingUnits[activeCharIndex] || writingUnits[0];
  const currentChar = currentUnit?.unit || characters[activeCharIndex] || characters[0] || 'あ';
  const isRTL = Boolean(currentUnit?.isRTL);

  const provider = handwritingRegistry.getProviderForLanguage(languageId);
  const isRecognitionOnly = Boolean(
    provider &&
    provider.metadata.capabilities.includes('whole_text_recognition') &&
    !provider.metadata.capabilities.includes('stroke_order')
  );
  const isCJK = isCJKCharacter(currentChar);

  // Character Reference Data
  const [charReference, setCharReference] = useState<CharacterReference | null>(null);

  // State Machine
  const [charState, setCharState] = useState<CharacterCompletionState>('READY');
  const [charEvaluation, setCharEvaluation] = useState<CharacterEvaluationResult | null>(null);
  const [charScores, setCharScores] = useState<Record<number, number>>({});

  // View & Guide Controls - GRID IS OFF BY DEFAULT per user request ("bỏ cái ô lưới đi")
  const [showGhostGuide, setShowGhostGuide] = useState(showGuide);
  const [showGrid, setShowGrid] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [isPlayingAnimation, setIsPlayingAnimation] = useState(false);

  // HanziWriter Interactive Quiz Refs
  const hwContainerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<any>(null);
  const autoAdvanceTimerRef = useRef<any>(null);
  const [isHanziActive, setIsHanziActive] = useState(false);
  const [hanziStrokeCount, setHanziStrokeCount] = useState(0);
  const [hanziTotalStrokes, setHanziTotalStrokes] = useState(0);

  // Fallback Canvas Refs (for non-CJK, e.g. Korean, Thai, Arabic)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const isDrawingRef = useRef(false);
  const currentStrokePointsRef = useRef<HandwritingPoint[]>([]);
  const drawnStrokesRef = useRef<CharacterStrokeModel[]>([]);
  const displayStrokesRef = useRef<HandwritingStroke[]>([]);
  const redoStackRef = useRef<CharacterStrokeModel[]>([]);

  // Feedback states
  const [strokeCountDisplay, setStrokeCountDisplay] = useState(0);
  const [lastStrokeEval, setLastStrokeEval] = useState<SingleStrokeEvaluation | null>(null);

  // Cleanup auto advance timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, []);

  // Robust, script-aware HanziWriter character data loader with cache and verified stroke medians
  const loadCharacterDataForWriter = useCallback(
    async (char: string, onComplete: (data: any) => void, onError: () => void) => {
      if (charDataCache.has(char)) {
        onComplete(charDataCache.get(char));
        return;
      }

      const code = char.charCodeAt(0);
      const isKana = isKanaChar(code);

      // Prioritize URLs based on script and active language
      const candidateUrls: string[] = [];
      if (isKana || languageId === 'ja') {
        candidateUrls.push(`https://unpkg.com/@k1low/hanzi-writer-data-jp@latest/${encodeURIComponent(char)}.json`);
        candidateUrls.push(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(char)}.json`);
      } else {
        candidateUrls.push(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(char)}.json`);
        candidateUrls.push(`https://unpkg.com/@k1low/hanzi-writer-data-jp@latest/${encodeURIComponent(char)}.json`);
      }

      for (const url of candidateUrls) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            // Critical check: Strokes and medians MUST be valid non-empty arrays
            if (
              Array.isArray(data?.strokes) &&
              data.strokes.length > 0 &&
              Array.isArray(data?.medians) &&
              data.medians.length > 0
            ) {
              charDataCache.set(char, data);
              onComplete(data);
              return;
            }
          }
        } catch {
          // Fall through to next candidate url
        }
      }

      // If no valid stroke + median data found, trigger onError to fallback cleanly to standard canvas
      onError();
    },
    [languageId]
  );

  // Reusable Quiz Starter with Auto-Advance on Character Complete
  const startQuiz = useCallback(
    (writer: any) => {
      if (!writer) return;
      writer.quiz({
        acceptBackwardsStrokes: false,
        markStrokeCorrectAfterMisses: false,
        leniency: 1.15,
        showOutline: showGhostGuide,
        onCorrectStroke: (data: any) => {
          setHanziStrokeCount(data.strokeNum + 1);
          setLastStrokeEval({
            strokeIndex: data.strokeNum,
            correct: true,
            confidence: 96,
            feedbackMessage: `Nét ${data.strokeNum + 1} chuẩn xác!`,
            canSnapToReference: true,
            shapeSimilarity: 95,
            positionEvaluation: { status: 'ALIGNED', centerOffsetPx: 0 } as any,
            directionCosine: 1,
            directionCorrect: true,
          } as any);
          setCharState('AWAITING_MORE_STROKES');
        },
        onMistake: (data: any) => {
          setLastStrokeEval({
            strokeIndex: data.strokeNum,
            correct: false,
            confidence: 25,
            feedbackMessage: 'Nét chưa chuẩn hoặc sai hướng! Quan sát nét mẫu và vẽ lại.',
            canSnapToReference: false,
            shapeSimilarity: 25,
            positionEvaluation: { status: 'MISALIGNED', centerOffsetPx: 50 } as any,
            directionCosine: -1,
            directionCorrect: false,
          } as any);
          setCharState('INCORRECT');
        },
        onComplete: (summary: any) => {
          const mistakes = summary?.totalMistakes || 0;
          const score = Math.max(70, Math.round(100 - mistakes * 8));
          const currentIndex = activeCharIndexRef.current;

          setCharScores((prev) => ({ ...prev, [currentIndex]: score }));
          setCharState('CORRECT');

          const isLastChar = currentIndex >= characters.length - 1;
          if (!isLastChar) {
            setLastStrokeEval({
              strokeIndex: 0,
              correct: true,
              confidence: score,
              feedbackMessage: `✓ Ký tự hoàn thành (${score}%)! Tự động chuyển chữ tiếp...`,
              canSnapToReference: true,
            } as any);

            // Auto-advance to next character after 600ms
            if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
            autoAdvanceTimerRef.current = setTimeout(() => {
              setActiveCharIndex((prev) => prev + 1);
            }, 600);
          } else {
            // Whole word completed!
            setCharScores((prev) => {
              const all = { ...prev, [currentIndex]: score };
              const values = Object.values(all);
              const avg = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : score;

              setLastStrokeEval({
                strokeIndex: 0,
                correct: true,
                confidence: avg,
                feedbackMessage: `Xuất sắc! Toàn bộ từ "${word}" đã hoàn thành chuẩn nét (${avg}%).`,
                canSnapToReference: true,
              } as any);

              onWordComplete(avg, true);
              return all;
            });
          }
        },
      });
    },
    [showGhostGuide, characters.length, word, onWordComplete]
  );

  // Setup HanziWriter Interactive Quiz when CJK character is active
  useEffect(() => {
    const container = hwContainerRef.current;
    if (!container || !isCJK) {
      setIsHanziActive(false);
      return;
    }

    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }

    if (writerRef.current) {
      try {
        writerRef.current.cancelQuiz();
      } catch {}
      writerRef.current = null;
    }

    container.innerHTML = '';
    setIsHanziActive(true);
    setIsPlayingAnimation(false);
    setHanziStrokeCount(0);
    setLastStrokeEval(null);
    setCharState('READY');

    let activeWriter: any = null;
    let isCancelled = false;

    try {
      activeWriter = HanziWriter.create(container, currentChar, {
        width: 320,
        height: 320,
        padding: 20,
        showOutline: showGhostGuide,
        strokeAnimationSpeed: 1.25,
        delayBetweenStrokes: 220,
        strokeColor: '#1e1b4b',
        outlineColor: '#cbd5e1',
        highlightColor: '#059669',
        drawingColor: '#2563eb',
        drawingWidth: 7,
        showCharacter: false,
        charDataLoader: (char: string, onComplete: any, onError: any) => {
          loadCharacterDataForWriter(
            char,
            (data: any) => {
              if (!isCancelled) {
                setHanziTotalStrokes(data?.strokes?.length || 0);
                onComplete(data);
              }
            },
            () => {
              if (!isCancelled) {
                setIsHanziActive(false);
                onError();
              }
            }
          );
        },
      });

      writerRef.current = activeWriter;
      startQuiz(activeWriter);
    } catch {
      setIsHanziActive(false);
    }

    return () => {
      isCancelled = true;
      if (activeWriter) {
        try {
          activeWriter.cancelQuiz();
        } catch {}
      }
    };
  }, [currentChar, activeCharIndex, languageId, isCJK, loadCharacterDataForWriter, startQuiz]);

  // "Vẽ mẫu" Animation Player
  const playStrokeAnimation = () => {
    if (isHanziActive && writerRef.current) {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
      setIsPlayingAnimation(true);
      setLastStrokeEval(null);

      try {
        writerRef.current.cancelQuiz();
      } catch {}

      writerRef.current.animateCharacter({
        strokeAnimationSpeed: 1.2,
        delayBetweenStrokes: 220,
        onComplete: () => {
          setIsPlayingAnimation(false);
          // Restart quiz immediately after animation finishes
          if (writerRef.current) {
            startQuiz(writerRef.current);
          }
        },
      });
    }
  };

  // Toggle Ghost Guide (Mặt hiển thị nét mẫu)
  const toggleGhostGuide = () => {
    const next = !showGhostGuide;
    setShowGhostGuide(next);
    if (isHanziActive && writerRef.current) {
      if (next) writerRef.current.showOutline();
      else writerRef.current.hideOutline();
    }
  };

  // Reset / Viết lại
  const handleReset = () => {
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    setLastStrokeEval(null);
    setCharState('READY');
    setHanziStrokeCount(0);
    if (isHanziActive && writerRef.current) {
      try {
        writerRef.current.cancelQuiz();
      } catch {}
      startQuiz(writerRef.current);
    } else {
      clearCanvas();
    }
  };

  // Draw Tian-zi-ge grid (only if showGrid is explicitly enabled)
  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      if (!showGrid) return;
      ctx.save();
      ctx.lineWidth = 1;
      ctx.strokeStyle = isUltraEfficient ? '#e2e8f0' : 'rgba(99, 102, 241, 0.15)';
      ctx.setLineDash([5, 5]);

      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      ctx.restore();
    },
    [showGrid, isUltraEfficient]
  );

  // Clear Canvas for fallback mode
  const clearCanvas = useCallback(() => {
    drawnStrokesRef.current = [];
    displayStrokesRef.current = [];
    currentStrokePointsRef.current = [];
    redoStackRef.current = [];
    setStrokeCountDisplay(0);
    setLastStrokeEval(null);
    setCharEvaluation(null);
    setCharState('READY');
    setIsPlayingAnimation(false);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid(ctx, LOGICAL_CANVAS_SIZE, LOGICAL_CANVAS_SIZE);
      }
    }
  }, [drawGrid]);

  // Audio Pronunciation
  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = languageId === 'zh' ? 'zh-CN' : languageId === 'ko' ? 'ko-KR' : languageId === 'th' ? 'th-TH' : languageId === 'ar' ? 'ar-SA' : 'ja-JP';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  // Coordinates helper for canvas fallback
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): HandwritingPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = LOGICAL_CANVAS_SIZE / rect.width;
    const scaleY = LOGICAL_CANVAS_SIZE / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      time: performance.now(),
      pressure: e.pressure || 0.5,
    };
  };

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const scale = (rect.width * dpr) / LOGICAL_CANVAS_SIZE;

    ctx.save();
    ctx.scale(scale, scale);
    ctx.clearRect(0, 0, LOGICAL_CANVAS_SIZE, LOGICAL_CANVAS_SIZE);
    drawGrid(ctx, LOGICAL_CANVAS_SIZE, LOGICAL_CANVAS_SIZE);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    displayStrokesRef.current.forEach((stroke, idx) => {
      if (stroke.length < 2) return;
      const model = drawnStrokesRef.current[idx];
      const isValid = model?.isValidated;

      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.strokeStyle = isValid ? '#10b981' : '#4f46e5';
      ctx.lineWidth = 14;
      ctx.stroke();
    });

    if (isDrawingRef.current && currentStrokePointsRef.current.length > 1) {
      const activePts = currentStrokePointsRef.current;
      ctx.beginPath();
      ctx.moveTo(activePts[0].x, activePts[0].y);
      for (let i = 1; i < activePts.length; i++) {
        ctx.lineTo(activePts[i].x, activePts[i].y);
      }
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 14;
      ctx.stroke();
    }

    ctx.restore();
  }, [drawGrid]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    activePointerIdRef.current = e.pointerId;
    isDrawingRef.current = true;
    const pt = getCanvasCoords(e);
    currentStrokePointsRef.current = [pt];
    setCharState('DRAWING');
    requestAnimationFrame(renderCanvas);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || e.pointerId !== activePointerIdRef.current) return;
    e.preventDefault();
    const pt = getCanvasCoords(e);
    currentStrokePointsRef.current.push(pt);
    requestAnimationFrame(renderCanvas);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || e.pointerId !== activePointerIdRef.current) return;
    e.preventDefault();
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    isDrawingRef.current = false;
    activePointerIdRef.current = null;

    const strokePoints = [...currentStrokePointsRef.current];
    currentStrokePointsRef.current = [];

    if (strokePoints.length < 2) {
      renderCanvas();
      return;
    }

    const strokeIdx = drawnStrokesRef.current.length;
    const newStrokeModel: CharacterStrokeModel = {
      strokeId: `stk_${Date.now()}_${strokeIdx}`,
      characterId: currentChar,
      strokeIndex: strokeIdx,
      pointerId: e.pointerId,
      pointerType: 'pen',
      points: strokePoints,
      startPoint: { x: strokePoints[0].x, y: strokePoints[0].y },
      endPoint: { x: strokePoints[strokePoints.length - 1].x, y: strokePoints[strokePoints.length - 1].y },
      durationMs: 150,
      isValidated: true,
    };

    drawnStrokesRef.current.push(newStrokeModel);
    displayStrokesRef.current.push(strokePoints);
    setStrokeCountDisplay(drawnStrokesRef.current.length);
    renderCanvas();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space' && (charState === 'CORRECT' || charState === 'PARTIALLY_CORRECT')) {
        e.preventDefault();
        if (activeCharIndex < characters.length - 1) {
          setActiveCharIndex((prev) => prev + 1);
        } else {
          onNextWord();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [charState, activeCharIndex, characters.length, onNextWord]);

  return (
    <div
      className={`space-y-4 max-w-2xl mx-auto transition-all ${
        focusMode ? 'fixed inset-0 z-50 bg-slate-950/95 p-4 flex flex-col justify-center items-center overflow-y-auto' : ''
      }`}
    >
      {/* 1. Header Card: Word & Metadata */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {word}
            </h2>
            {(romaji || pinyin || pronunciation) && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                {romaji || pinyin || pronunciation}
              </span>
            )}
            <button
              onClick={handleSpeak}
              className="p-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 transition cursor-pointer"
              title="Nghe phát âm chuẩn"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Multi-Engine Capability Pill */}
            <span
              className={`text-[11px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1.5 ${
                isHanziActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40'
                  : isRecognitionOnly
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40'
              }`}
            >
              <span>{isHanziActive ? '✍️' : isRecognitionOnly ? '🔍' : '🖌️'}</span>
              <span>
                {isHanziActive
                  ? `Chấm nét (${provider?.metadata?.name?.split(' ')[0] || 'Chuẩn'})`
                  : isRecognitionOnly
                  ? 'Nhận dạng số'
                  : 'Luyện viết tự do'}
              </span>
            </span>

            {/* Hangul Jamo breakdown pill */}
            {currentUnit?.metadata?.hangulComponents?.isHangul && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hidden sm:inline">
                {currentUnit.metadata.hangulComponents.chosung} + {currentUnit.metadata.hangulComponents.jungsung}
                {currentUnit.metadata.hangulComponents.jongsung ? ` + ${currentUnit.metadata.hangulComponents.jongsung}` : ''}
              </span>
            )}

            {isHanziActive && hanziTotalStrokes > 0 && (
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
                Nét {Math.min(hanziStrokeCount + 1, hanziTotalStrokes)}/{hanziTotalStrokes}
              </span>
            )}

            <button
              onClick={() => setFocusMode(!focusMode)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title={focusMode ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
            >
              {focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Translation & Multi-Character Graphemes */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-xs">
            {meaning}
          </p>

          {characters.length > 1 && (
            <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
                Ký tự:
              </span>
              {characters.map((ch, idx) => {
                const isSelected = idx === activeCharIndex;
                const score = charScores[idx];
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveCharIndex(idx)}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                    }`}
                  >
                    <span>{ch}</span>
                    {typeof score === 'number' && (
                      <span className={`text-[10px] ${score >= 70 ? 'text-emerald-300' : 'text-amber-300'}`}>
                        {score}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. THE HERO WRITING CANVAS (Clean Zen Surface, No Grid Lines) */}
      <div
        className={`relative p-3 rounded-3xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center overflow-hidden min-h-[350px] ${
          isRTL ? 'direction-rtl' : ''
        }`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Interactive HanziWriter SVG Quiz Container for CJK */}
        {isCJK ? (
          <div
            ref={hwContainerRef}
            className={`w-[320px] h-[320px] flex items-center justify-center select-none cursor-crosshair touch-none ${
              isPlayingAnimation ? 'pointer-events-none opacity-90' : ''
            }`}
            style={{ touchAction: 'none' }}
          />
        ) : (
          /* Fallback Canvas for Non-CJK (Korean, Thai, Arabic) */
          <>
            {showGhostGuide && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 select-none opacity-40">
                <span
                  className="text-[160px] sm:text-[190px] font-bold text-indigo-400 select-none leading-none tracking-normal"
                  style={{
                    fontFamily: '"Noto Sans", "Noto Sans JP", "Noto Sans KR", "Noto Sans SC", system-ui, sans-serif',
                  }}
                >
                  {currentChar}
                </span>
              </div>
            )}
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="relative z-10 w-full aspect-square max-w-[340px] sm:max-w-[370px] rounded-2xl bg-white dark:bg-slate-950 cursor-crosshair touch-none select-none"
              style={{ touchAction: 'none' }}
            />
          </>
        )}

        {/* Real-time single stroke feedback toast */}
        {lastStrokeEval && (
          <div
            className={`absolute bottom-3 left-4 right-4 z-20 p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 shadow-lg backdrop-blur-md animate-slideUp ${
              lastStrokeEval.correct
                ? 'bg-emerald-600/90 border-emerald-400 text-white'
                : 'bg-rose-600/95 border-rose-400 text-white ring-2 ring-rose-400/50'
            }`}
          >
            <div className="flex items-center gap-2">
              {lastStrokeEval.correct ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-200 animate-bounce" />
              )}
              <span className="line-clamp-1">{lastStrokeEval.feedbackMessage}</span>
            </div>
            {typeof lastStrokeEval.confidence === 'number' && (
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-black shrink-0">
                {lastStrokeEval.confidence}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* 3. SLEEK TOOLBAR (Vẽ mẫu, Mẫu nét, Viết lại, Tiếp tục) */}
      <div className="w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Group A: Actions (Vẽ mẫu & Mẫu nét) */}
          <div className="flex items-center gap-2">
            {/* Nút Vẽ mẫu (Animate character strokes) */}
            {isCJK && (
              <button
                onClick={playStrokeAnimation}
                disabled={isPlayingAnimation}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                title="Xem mẫu viết từng nét"
              >
                {isPlayingAnimation ? (
                  <Pause className="w-3.5 h-3.5 animate-pulse text-indigo-500" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-indigo-500" />
                )}
                <span>{isPlayingAnimation ? 'Đang vẽ mẫu...' : 'Vẽ mẫu'}</span>
              </button>
            )}

            {/* Nút Mẫu nét (Hiện / Ẩn nét mờ) */}
            <button
              onClick={toggleGhostGuide}
              className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 border ${
                showGhostGuide
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                  : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
              }`}
              title={showGhostGuide ? 'Ẩn nét mẫu mờ' : 'Hiện nét mẫu mờ'}
            >
              {showGhostGuide ? (
                <Eye className="w-3.5 h-3.5 text-indigo-500" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" />
              )}
              <span>{showGhostGuide ? 'Hiện nét' : 'Ẩn nét'}</span>
            </button>

            {/* Nút Viết lại */}
            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Viết lại chữ này"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Viết lại</span>
            </button>
          </div>

          {/* Group B: Primary Forward Action (Chữ tiếp / Từ tiếp theo) */}
          <div>
            {charState === 'CORRECT' || charState === 'PARTIALLY_CORRECT' ? (
              activeCharIndex < characters.length - 1 ? (
                <button
                  onClick={() => setActiveCharIndex(activeCharIndex + 1)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>Chữ tiếp [Space]</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onNextWord}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>Từ tiếp theo [Space]</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
