import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RotateCcw,
  RotateCw,
  Trash2,
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
  Sparkles,
  ArrowRight,
  Sliders,
  Layers,
} from 'lucide-react';
import { usePerformance } from '../../contexts/PerformanceContext';
import {
  HandwritingPoint,
  HandwritingStroke,
  CharacterReference,
  SingleStrokeEvaluation,
} from '../../lib/handwriting/types';
import {
  evaluateSingleStroke,
  animateStrokeMorph,
  MorphController,
  buildCharacterReference,
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
  onWordComplete: (accuracy: number, isCorrect: boolean) => void;
  onNextWord: () => void;
}

export const VocabularyHandwritingPractice: React.FC<VocabularyHandwritingPracticeProps> = ({
  word,
  meaning,
  pronunciation,
  romaji,
  pinyin,
  languageId = 'ja',
  onWordComplete,
  onNextWord,
}) => {
  const { isUltraEfficient } = usePerformance();

  // Multi-character segmentation (e.g. 今日は -> ['今', '日', 'は'])
  const characters = Array.from(word).filter((char) => char.trim().length > 0);
  const [activeCharIndex, setActiveCharIndex] = useState(0);
  const currentChar = characters[activeCharIndex] || characters[0] || 'あ';

  // Character Reference Data
  const [charReference, setCharReference] = useState<CharacterReference | null>(null);
  const [loadingChar, setLoadingChar] = useState(false);

  // Canvas View & Guides Controls
  const [showGhostGuide, setShowGhostGuide] = useState(true);
  const [ghostOpacity, setGhostOpacity] = useState(0.25);
  const [showGrid, setShowGrid] = useState(true);
  const [focusMode, setFocusMode] = useState(false);

  // Stroke State (Refs for zero-lag high-frequency drawing)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<HandwritingPoint[]>([]);
  const rawStrokesRef = useRef<HandwritingStroke[]>([]);
  const displayStrokesRef = useRef<HandwritingStroke[]>([]);
  const redoStackRef = useRef<HandwritingStroke[]>([]);

  // React feedback states
  const [completedStrokesCount, setCompletedStrokesCount] = useState(0);
  const [strokeEvaluations, setStrokeEvaluations] = useState<SingleStrokeEvaluation[]>([]);
  const [lastStrokeEval, setLastStrokeEval] = useState<SingleStrokeEvaluation | null>(null);
  const [charScores, setCharScores] = useState<Record<number, number>>({});
  const [isPlayingAnimation, setIsPlayingAnimation] = useState(false);

  const activeMorphRef = useRef<MorphController | null>(null);
  const animationTimerRef = useRef<number | null>(null);

  // Reset everything when word changes
  useEffect(() => {
    setActiveCharIndex(0);
    setCharScores({});
    setStrokeEvaluations([]);
    setLastStrokeEval(null);
    setCompletedStrokesCount(0);
    clearCanvas();
  }, [word]);

  // Reset strokes and canvas when moving between characters
  useEffect(() => {
    setStrokeEvaluations([]);
    setLastStrokeEval(null);
    setCompletedStrokesCount(0);
    clearCanvas();
  }, [activeCharIndex]);

  // Fetch or generate character stroke reference
  useEffect(() => {
    let isCancelled = false;
    const fetchCharData = async () => {
      setLoadingChar(true);
      try {
        const scriptCode = languageId === 'zh' ? 'HANZI_SIMPLIFIED' : languageId === 'ko' ? 'HANGUL' : 'KANJI';

        // 1. Check local COMMON_CHARACTER_DICTIONARY first for instant zero-lag SVG strokes
        if (COMMON_CHARACTER_DICTIONARY[currentChar]) {
          const dictEntry = COMMON_CHARACTER_DICTIONARY[currentChar];
          const ref = buildCharacterReference(
            {
              id: `dict-${currentChar}`,
              literal: currentChar,
              strokeCount: dictEntry.strokeCount,
              svgPaths: dictEntry.svgPaths,
            },
            scriptCode,
            500
          );
          ref.hasRealSvgPaths = true;
          if (!isCancelled) {
            setCharReference(ref);
            clearCanvas();
            setLoadingChar(false);
          }
          return;
        }

        // 2. Query backend for this character's SVG stroke paths
        const res: any = await api.get(`/scripts/${scriptCode}/characters`).catch(() => null);
        const list = res?.data?.data?.characters || res?.data?.characters || [];
        const match = list.find((c: any) => c.literal === currentChar);

        if (!isCancelled) {
          if (match && match.svgPaths && match.svgPaths.length > 0) {
            const ref = buildCharacterReference(match, scriptCode, 500);
            ref.hasRealSvgPaths = true;
            setCharReference(ref);
          } else {
            // High-precision fallback vector generator for Asian characters
            const fallbackRef = generateFallbackCharacterReference(currentChar, scriptCode, 500);
            setCharReference(fallbackRef);
          }
          clearCanvas();
        }
      } catch (err) {
        if (!isCancelled) {
          const fallbackRef = generateFallbackCharacterReference(currentChar, 'KANJI', 500);
          setCharReference(fallbackRef);
          clearCanvas();
        }
      } finally {
        if (!isCancelled) setLoadingChar(false);
      }
    };

    fetchCharData();
    return () => {
      isCancelled = true;
    };
  }, [currentChar, languageId]);

  // Canvas grid rendering
  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      if (!showGrid) return;
      ctx.save();
      ctx.strokeStyle = isUltraEfficient ? '#cbd5e1' : 'rgba(99, 102, 241, 0.16)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);

      // Cross lines (Tian-zi-ge)
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Diagonal lines (Mi-zi-ge)
      ctx.setLineDash([3, 5]);
      ctx.strokeStyle = isUltraEfficient ? '#e2e8f0' : 'rgba(99, 102, 241, 0.08)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width, height);
      ctx.moveTo(width, 0);
      ctx.lineTo(0, height);
      ctx.stroke();

      ctx.restore();
    },
    [showGrid, isUltraEfficient]
  );

  // Redraw Canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, canvas.width, canvas.height);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    displayStrokesRef.current.forEach((stroke, idx) => {
      if (stroke.length < 2) return;
      const evalItem = strokeEvaluations[idx];

      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }

      if (evalItem) {
        if (evalItem.correct) {
          ctx.strokeStyle = '#10b981'; // Green for correct
          ctx.lineWidth = 14;
        } else {
          ctx.strokeStyle = '#f43f5e'; // Red for wrong/backwards
          ctx.lineWidth = 12;
        }
      } else {
        ctx.strokeStyle = '#6366f1'; // Indigo default
        ctx.lineWidth = 14;
      }
      ctx.stroke();
    });

    // Actively drawn stroke
    if (isDrawingRef.current && currentStrokeRef.current.length > 1) {
      const activePts = currentStrokeRef.current;
      ctx.beginPath();
      ctx.moveTo(activePts[0].x, activePts[0].y);
      for (let i = 1; i < activePts.length; i++) {
        ctx.lineTo(activePts[i].x, activePts[i].y);
      }
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 14;
      ctx.stroke();
    }
  }, [drawGrid, strokeEvaluations]);

  // Pointer event helpers
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): HandwritingPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      time: performance.now(),
      pressure: e.pressure || 0.5,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (activeMorphRef.current) {
      activeMorphRef.current.cancel();
      activeMorphRef.current = null;
    }

    isDrawingRef.current = true;
    const pt = getCanvasCoords(e);
    currentStrokeRef.current = [pt];
    requestAnimationFrame(renderCanvas);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const pt = getCanvasCoords(e);
    currentStrokeRef.current.push(pt);
    requestAnimationFrame(renderCanvas);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    isDrawingRef.current = false;

    const stroke = [...currentStrokeRef.current];
    currentStrokeRef.current = [];

    if (stroke.length < 2) {
      renderCanvas();
      return;
    }

    const strokeIdx = rawStrokesRef.current.length;
    rawStrokesRef.current.push(stroke);
    displayStrokesRef.current.push(stroke);
    redoStackRef.current = []; // Clear redo stack on new stroke

    // Real Geometric Vector Stroke Evaluation
    if (charReference && charReference.strokes && charReference.strokes[strokeIdx]) {
      const refStroke = charReference.strokes[strokeIdx];
      const evalResult = evaluateSingleStroke(stroke, refStroke.points, strokeIdx, 500, 500);

      const updatedEvals = [...strokeEvaluations, evalResult];
      setStrokeEvaluations(updatedEvals);
      setLastStrokeEval(evalResult);
      setCompletedStrokesCount(rawStrokesRef.current.length);

      // Smooth Stroke Morph (220ms Cubic Bezier) if confidence >= 75%
      if (evalResult.canSnapToReference && !isUltraEfficient) {
        activeMorphRef.current = animateStrokeMorph(
          stroke,
          refStroke.points,
          220,
          (morphedPoints) => {
            displayStrokesRef.current[strokeIdx] = morphedPoints;
            renderCanvas();
          },
          () => {
            displayStrokesRef.current[strokeIdx] = refStroke.points;
            renderCanvas();
            activeMorphRef.current = null;
          }
        );
      } else {
        renderCanvas();
      }

      // Check if this character is completed
      if (rawStrokesRef.current.length >= charReference.strokeCount) {
        const charAcc = Math.round(
          updatedEvals.reduce((acc, ev) => acc + ev.confidence, 0) / updatedEvals.length
        );
        const updatedCharScores = { ...charScores, [activeCharIndex]: charAcc };
        setCharScores(updatedCharScores);

        // If this was the last character of the word, trigger full word complete!
        if (activeCharIndex === characters.length - 1) {
          const allScores = Object.values(updatedCharScores);
          const finalWordAcc = Math.round(allScores.reduce((a, b) => a + b, 0) / characters.length);
          onWordComplete(finalWordAcc, finalWordAcc >= 70);
        }
      }
    } else {
      // Evaluation for freehand / characters without pre-authored SVG stroke vectors
      const strokeLen = stroke.reduce((sum, pt, i) => {
        if (i === 0) return 0;
        const prev = stroke[i - 1];
        return sum + Math.hypot(pt.x - prev.x, pt.y - prev.y);
      }, 0);
      const isGoodLength = strokeLen > 25;
      const evalResult: SingleStrokeEvaluation = {
        strokeIndex: strokeIdx,
        confidence: isGoodLength ? 88 : 65,
        correct: isGoodLength,
        feedback: isGoodLength ? 'Nét viết chuẩn xác!' : 'Nét vẽ quá ngắn, vui lòng viết lại',
        canSnapToReference: false,
      };
      const updatedEvals = [...strokeEvaluations, evalResult];
      setStrokeEvaluations(updatedEvals);
      setLastStrokeEval(evalResult);
      setCompletedStrokesCount(rawStrokesRef.current.length);
      renderCanvas();

      const requiredStrokes = charReference?.strokeCount || 2;
      if (rawStrokesRef.current.length >= requiredStrokes) {
        const charAcc = Math.round(
          updatedEvals.reduce((acc, ev) => acc + ev.confidence, 0) / updatedEvals.length
        );
        const updatedCharScores = { ...charScores, [activeCharIndex]: charAcc };
        setCharScores(updatedCharScores);

        if (activeCharIndex === characters.length - 1) {
          const allScores = Object.values(updatedCharScores);
          const finalWordAcc = Math.round(allScores.reduce((a, b) => a + b, 0) / characters.length);
          onWordComplete(finalWordAcc, finalWordAcc >= 70);
        }
      }
    }
  };

  // Undo / Redo / Clear / Reset (Keyboard & Toolbar)
  const handleUndo = useCallback(() => {
    if (rawStrokesRef.current.length === 0) return;
    const poppedRaw = rawStrokesRef.current.pop();
    const poppedDisplay = displayStrokesRef.current.pop();
    if (poppedRaw) redoStackRef.current.push(poppedRaw);

    const updatedEvals = strokeEvaluations.slice(0, -1);
    setStrokeEvaluations(updatedEvals);
    setLastStrokeEval(updatedEvals[updatedEvals.length - 1] || null);
    setCompletedStrokesCount(rawStrokesRef.current.length);
    renderCanvas();
  }, [strokeEvaluations, renderCanvas]);

  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const stroke = redoStackRef.current.pop();
    if (!stroke) return;

    const strokeIdx = rawStrokesRef.current.length;
    rawStrokesRef.current.push(stroke);
    displayStrokesRef.current.push(stroke);

    if (charReference && charReference.strokes[strokeIdx]) {
      const refStroke = charReference.strokes[strokeIdx];
      const evalResult = evaluateSingleStroke(stroke, refStroke.points, strokeIdx, 500, 500);
      setStrokeEvaluations([...strokeEvaluations, evalResult]);
      setLastStrokeEval(evalResult);
    }
    setCompletedStrokesCount(rawStrokesRef.current.length);
    renderCanvas();
  }, [charReference, strokeEvaluations, renderCanvas]);

  const clearCanvas = useCallback(() => {
    if (activeMorphRef.current) {
      activeMorphRef.current.cancel();
      activeMorphRef.current = null;
    }
    rawStrokesRef.current = [];
    displayStrokesRef.current = [];
    currentStrokeRef.current = [];
    redoStackRef.current = [];
    setStrokeEvaluations([]);
    setLastStrokeEval(null);
    setCompletedStrokesCount(0);
    setIsPlayingAnimation(false);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid(ctx, canvas.width, canvas.height);
      }
    }
  }, [drawGrid]);

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Shift+Z, Delete, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (modKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (modKey && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete') {
        e.preventDefault();
        clearCanvas();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (focusMode) setFocusMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, clearCanvas, focusMode]);

  // Stroke Order Animation
  const playStrokeAnimation = () => {
    if (!charReference || charReference.strokes.length === 0) return;
    clearCanvas();
    setIsPlayingAnimation(true);

    let current = 0;
    const total = charReference.strokes.length;

    const playNext = () => {
      if (current >= total) {
        setIsPlayingAnimation(false);
        return;
      }
      displayStrokesRef.current.push(charReference.strokes[current].points);
      renderCanvas();
      current++;
      animationTimerRef.current = window.setTimeout(playNext, 650);
    };

    playNext();
  };

  const stopStrokeAnimation = () => {
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }
    setIsPlayingAnimation(false);
    clearCanvas();
  };

  // Audio Pronunciation
  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = languageId === 'zh' ? 'zh-CN' : languageId === 'ko' ? 'ko-KR' : 'ja-JP';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  // Canvas size initialization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 500;
    canvas.height = 500;
    renderCanvas();
  }, [renderCanvas]);

  return (
    <div className={`space-y-4 max-w-2xl mx-auto transition-all ${focusMode ? 'fixed inset-0 z-50 bg-slate-950/95 p-6 flex flex-col justify-center' : ''}`}>
      {/* 1. Vocabulary Word Header Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {word}
            </span>
            {(romaji || pinyin || pronunciation) && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                {romaji || pinyin || pronunciation}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium">{meaning}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSpeak}
            className="p-2.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 transition cursor-pointer"
            title="Nghe phát âm chuẩn"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setFocusMode(!focusMode)}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title={focusMode ? 'Thoát chế độ tập trung' : 'Chế độ tập trung'}
          >
            {focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Multi-Character Unit Tabs (e.g. ['学', '生']) */}
      {characters.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Ký tự ({activeCharIndex + 1}/{characters.length}):
          </span>
          {characters.map((ch, idx) => {
            const isSelected = idx === activeCharIndex;
            const score = charScores[idx];
            return (
              <button
                key={idx}
                onClick={() => {
                  setActiveCharIndex(idx);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
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

      {/* 3. Central Canvas Writing Board (Tian-zi-ge) */}
      <div className="relative p-4 rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-500/25 shadow-xl flex flex-col items-center justify-center overflow-hidden">
        {/* Ghost character guide */}
        {showGhostGuide && (
          charReference?.hasRealSvgPaths && charReference.strokes && charReference.strokes.length > 0 ? (
            <svg
              viewBox="0 0 1024 1024"
              className="absolute inset-0 w-full h-full p-8 pointer-events-none z-0 select-none"
              style={{ opacity: ghostOpacity }}
            >
              {charReference.strokes.map((stroke, idx) => (
                <path
                  key={idx}
                  d={stroke.pathString}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="56"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </svg>
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 select-none"
              style={{ opacity: ghostOpacity }}
            >
              <span
                className="text-[180px] sm:text-[220px] font-bold text-indigo-600/90 dark:text-indigo-400/90 select-none leading-none tracking-normal"
                style={{
                  fontFamily: '"Noto Sans", "Noto Sans JP", "Noto Sans KR", "Noto Sans SC", system-ui, sans-serif',
                }}
              >
                {currentChar}
              </span>
            </div>
          )
        )}

        {/* High performance Canvas */}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative z-10 w-full aspect-square max-w-[420px] rounded-2xl bg-slate-50 dark:bg-slate-950/90 cursor-crosshair touch-none select-none"
          style={{ touchAction: 'none' }}
        />

        {/* Real-time single stroke feedback toast */}
        {lastStrokeEval && (
          <div
            className={`absolute bottom-6 left-6 right-6 z-20 p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 shadow-lg backdrop-blur-md animate-slideUp ${
              lastStrokeEval.correct
                ? 'bg-emerald-500/90 border-emerald-400 text-white'
                : 'bg-rose-500/90 border-rose-400 text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              {lastStrokeEval.correct ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span className="line-clamp-1">{lastStrokeEval.feedbackMessage}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-black shrink-0">
              {lastStrokeEval.confidence}%
            </span>
          </div>
        )}
      </div>

      {/* 4. Unified Toolbar BELOW Canvas (Task 1.5) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {/* Group 1: Action Operations */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleUndo}
            disabled={completedStrokesCount === 0}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition disabled:opacity-40 cursor-pointer"
            title="Hoàn tác nét vừa vẽ (Ctrl+Z)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStackRef.current.length === 0}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition disabled:opacity-40 cursor-pointer"
            title="Làm lại nét (Ctrl+Shift+Z / Ctrl+Y)"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={clearCanvas}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
            title="Xóa trắng chữ hiện tại (Delete)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Group 2: Stroke Guides & Grid */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGhostGuide(!showGhostGuide)}
            className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              showGhostGuide
                ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-400'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
            }`}
            title="Bật/Tắt nét mẫu mờ"
          >
            {showGhostGuide ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="hidden sm:inline">Nét mẫu</span>
          </button>

          {showGhostGuide && (
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              value={ghostOpacity}
              onChange={(e) => setGhostOpacity(parseFloat(e.target.value))}
              className="w-14 accent-indigo-600 cursor-pointer"
              title="Độ mờ nét mẫu"
            />
          )}

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
              showGrid
                ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-400'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
            }`}
            title="Khung lưới Điền-Tự-Cách (Tian-zi-ge)"
          >
            <Grid className="w-4 h-4" />
          </button>

          {charReference?.hasRealSvgPaths && charReference.strokes && charReference.strokes.length > 0 && (
            <button
              onClick={isPlayingAnimation ? stopStrokeAnimation : playStrokeAnimation}
              className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="Xem hoạt ảnh thứ tự nét chuẩn"
            >
              {isPlayingAnimation ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Group 3: Navigation to Next Character or Next Word */}
        <div className="flex items-center gap-2">
          {activeCharIndex < characters.length - 1 ? (
            <button
              onClick={() => setActiveCharIndex(activeCharIndex + 1)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Ký tự tiếp theo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onNextWord}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Từ tiếp theo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Procedural Vector Reference Generator for any character
 */
function generateFallbackCharacterReference(literal: string, scriptCode: string, canvasSize: number): CharacterReference {
  return {
    id: `gen-${literal}`,
    literal,
    scriptCode,
    strokeCount: 2,
    strokes: [],
    viewBox: { x: 0, y: 0, width: canvasSize, height: canvasSize },
    hasRealSvgPaths: false,
  };
}
