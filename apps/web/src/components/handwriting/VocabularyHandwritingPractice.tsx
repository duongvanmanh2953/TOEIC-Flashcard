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
  AlertTriangle,
  Volume2,
  ChevronRight,
  Maximize2,
  Minimize2,
  Sparkles,
  ArrowRight,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
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
  animateStrokeMorph,
  MorphController,
  buildCharacterReference,
  sampleSvgPath,
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

/**
 * Robust script-aware grapheme segmenter (Section D5)
 */
export function segmentIntoGraphemes(text: string): string[] {
  if (!text) return [];
  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    const segmenter = new (Intl as any).Segmenter(undefined, { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text), (s: any) => s.segment).filter(
      (s: string) => s.trim().length > 0
    );
  }
  return Array.from(text).filter((char) => char.trim().length > 0);
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

  // Multi-character segmentation using grapheme clusters (Section D5)
  const characters = segmentIntoGraphemes(word);
  const [activeCharIndex, setActiveCharIndex] = useState(0);
  const currentChar = characters[activeCharIndex] || characters[0] || 'あ';

  // Character Reference Data
  const [charReference, setCharReference] = useState<CharacterReference | null>(null);
  const [loadingChar, setLoadingChar] = useState(false);

  // Character Completion State Machine (Section A4)
  const [charState, setCharState] = useState<CharacterCompletionState>('READY');
  const [charEvaluation, setCharEvaluation] = useState<CharacterEvaluationResult | null>(null);
  const [charScores, setCharScores] = useState<Record<number, number>>({});

  // Canvas View & Guides Controls
  const [showGhostGuide, setShowGhostGuide] = useState(showGuide);

  useEffect(() => {
    if (showGuide !== undefined) setShowGhostGuide(showGuide);
  }, [showGuide]);
  const [ghostOpacity, setGhostOpacity] = useState(0.55);
  const [showGrid, setShowGrid] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [isPlayingAnimation, setIsPlayingAnimation] = useState(false);

  // Stroke State Refs for zero-lag 60fps drawing (Section A1, A2, G)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const isDrawingRef = useRef(false);
  const currentStrokePointsRef = useRef<HandwritingPoint[]>([]);
  const drawnStrokesRef = useRef<CharacterStrokeModel[]>([]);
  const displayStrokesRef = useRef<HandwritingStroke[]>([]);
  const redoStackRef = useRef<CharacterStrokeModel[]>([]);
  const wrongStrokeRef = useRef<HandwritingStroke | null>(null);
  const wrongClearTimerRef = useRef<number | null>(null);

  // React feedback states
  const [strokeCountDisplay, setStrokeCountDisplay] = useState(0);
  const [lastStrokeEval, setLastStrokeEval] = useState<SingleStrokeEvaluation | null>(null);

  const activeMorphRef = useRef<MorphController | null>(null);
  const animationTimerRef = useRef<number | null>(null);

  // Reset when word changes
  useEffect(() => {
    if (activeMorphRef.current) {
      activeMorphRef.current.cancel();
      activeMorphRef.current = null;
    }
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }
    if (wrongClearTimerRef.current) {
      clearTimeout(wrongClearTimerRef.current);
      wrongClearTimerRef.current = null;
    }
    setActiveCharIndex(0);
    setCharScores({});
    setCharEvaluation(null);
    setLastStrokeEval(null);
    setCharState('READY');
    setIsPlayingAnimation(false);
    clearCanvas();
  }, [word, clearCanvas]);

  // Reset when changing character in word
  useEffect(() => {
    setCharEvaluation(null);
    setLastStrokeEval(null);
    setCharState('READY');
    clearCanvas();
  }, [activeCharIndex]);

  // Fetch or generate character stroke reference
  useEffect(() => {
    let isCancelled = false;
    const fetchCharData = async () => {
      setLoadingChar(true);
      try {
        const scriptCode =
          languageId === 'zh'
            ? 'HANZI_SIMPLIFIED'
            : languageId === 'ko'
              ? 'HANGUL'
              : 'KANJI';

        // 1. Check local COMMON_CHARACTER_DICTIONARY for instant SVG vectors
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
            LOGICAL_CANVAS_SIZE
          );
          ref.hasRealSvgPaths = true;
          if (!isCancelled) {
            setCharReference(ref);
            clearCanvas();
            setLoadingChar(false);
          }
          return;
        }

        // 2. Query backend for SVG stroke paths
        const res: any = await api.get(`/scripts/${scriptCode}/characters`).catch(() => null);
        const list = res?.data?.data?.characters || res?.data?.characters || [];
        const match = list.find((c: any) => c.literal === currentChar);

        if (!isCancelled) {
          if (match && match.svgPaths && match.svgPaths.length > 0) {
            const ref = buildCharacterReference(match, scriptCode, LOGICAL_CANVAS_SIZE);
            ref.hasRealSvgPaths = true;
            setCharReference(ref);
          } else {
            const fallbackRef = generateFallbackCharacterReference(currentChar, scriptCode, LOGICAL_CANVAS_SIZE);
            setCharReference(fallbackRef);
          }
          clearCanvas();
        }
      } catch {
        if (!isCancelled) {
          const fallbackRef = generateFallbackCharacterReference(currentChar, 'KANJI', LOGICAL_CANVAS_SIZE);
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

  // Draw Tian-zi-ge grid
  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      if (!showGrid) return;
      ctx.save();
      ctx.lineWidth = 1;
      ctx.strokeStyle = isUltraEfficient ? '#e2e8f0' : 'rgba(99, 102, 241, 0.15)';
      ctx.setLineDash([5, 5]);

      // Cross lines (Tian-zi-ge)
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

  // Redraw Canvas with High-DPI scaling (Section E3, G)
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

    // 1. Draw accepted / completed strokes
    displayStrokesRef.current.forEach((stroke, idx) => {
      if (stroke.length < 2) return;
      const model = drawnStrokesRef.current[idx];
      const isValid = model?.isValidated;

      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }

      ctx.strokeStyle = isValid ? '#10b981' : '#6366f1';
      ctx.lineWidth = 14;
      ctx.stroke();
    });

    // 2. Draw wrong stroke in warning red
    if (wrongStrokeRef.current && wrongStrokeRef.current.length > 1) {
      const wrongPts = wrongStrokeRef.current;
      ctx.beginPath();
      ctx.moveTo(wrongPts[0].x, wrongPts[0].y);
      for (let i = 1; i < wrongPts.length; i++) {
        ctx.lineTo(wrongPts[i].x, wrongPts[i].y);
      }
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 14;
      ctx.stroke();
    }

    // 3. Actively drawn stroke in real-time
    if (isDrawingRef.current && currentStrokePointsRef.current.length > 1) {
      const activePts = currentStrokePointsRef.current;
      ctx.beginPath();
      ctx.moveTo(activePts[0].x, activePts[0].y);
      for (let i = 1; i < activePts.length; i++) {
        ctx.lineTo(activePts[i].x, activePts[i].y);
      }
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 14;
      ctx.stroke();
    }

    ctx.restore();
  }, [drawGrid]);

  // Responsive DPI initialization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    renderCanvas();
  }, [renderCanvas]);

  // Pointer event coordinate transformation
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

  // Pointerdown (Section A2)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Isolate by pointerId: ignore secondary touch/pen
    if (activePointerIdRef.current !== null && activePointerIdRef.current !== e.pointerId) {
      return;
    }

    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    activePointerIdRef.current = e.pointerId;

    if (activeMorphRef.current) {
      activeMorphRef.current.cancel();
      activeMorphRef.current = null;
    }

    // Clear previous wrong stroke on next touch
    if (wrongClearTimerRef.current) {
      clearTimeout(wrongClearTimerRef.current);
      wrongClearTimerRef.current = null;
    }
    wrongStrokeRef.current = null;

    isDrawingRef.current = true;
    const pt = getCanvasCoords(e);
    currentStrokePointsRef.current = [pt];
    setCharState('DRAWING');
    requestAnimationFrame(renderCanvas);
  };

  // Pointermove: zero setState for maximum 60fps performance (Section G)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || e.pointerId !== activePointerIdRef.current) return;
    e.preventDefault();
    const pt = getCanvasCoords(e);
    currentStrokePointsRef.current.push(pt);
    requestAnimationFrame(renderCanvas);
  };

  // Cancel handler for touchcancel / lost pointer (Section A2)
  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerId !== activePointerIdRef.current) return;
    isDrawingRef.current = false;
    activePointerIdRef.current = null;
    currentStrokePointsRef.current = [];
    requestAnimationFrame(renderCanvas);
  };

  // Run full evaluation on character strokes (Section B1 - B4, C1)
  const runCharacterEvaluation = useCallback(
    (strokes: CharacterStrokeModel[]) => {
      if (!charReference) return;
      const normalizedStrokes = strokes.map((s, idx) => {
        const refStk = charReference.strokes?.[idx];
        if ((s.isValidated || (s as any).canSnapToReference) && refStk) {
          return refStk.points;
        }
        return s.points;
      });
      const evalResult = evaluateFullCharacter(normalizedStrokes, charReference, LOGICAL_CANVAS_SIZE);
      setCharEvaluation(evalResult);

      if (evalResult.finalCorrectness === 'CORRECT') {
        setCharState('CORRECT');
        setCharScores((prev) => ({ ...prev, [activeCharIndex]: evalResult.confidence }));

        // Mark all strokes validated
        strokes.forEach((s) => {
          s.isValidated = true;
        });

        // Trigger word completion if this was the last character
        if (activeCharIndex === characters.length - 1) {
          const allScores = Object.values({ ...charScores, [activeCharIndex]: evalResult.confidence });
          const finalWordAcc = Math.round(allScores.reduce((a, b) => a + b, 0) / characters.length);
          onWordComplete(finalWordAcc, true);
        }
      } else if (evalResult.finalCorrectness === 'NEARLY_CORRECT') {
        setCharState('PARTIALLY_CORRECT');
        setCharScores((prev) => ({ ...prev, [activeCharIndex]: evalResult.confidence }));
        strokes.forEach((s) => {
          s.isValidated = true;
        });

        if (activeCharIndex === characters.length - 1) {
          const allScores = Object.values({ ...charScores, [activeCharIndex]: evalResult.confidence });
          const finalWordAcc = Math.round(allScores.reduce((a, b) => a + b, 0) / characters.length);
          onWordComplete(finalWordAcc, true);
        }
      } else {
        setCharState('INCORRECT');
      }
      renderCanvas();
    },
    [charReference, activeCharIndex, characters.length, charScores, onWordComplete, renderCanvas]
  );

  // Auto-fill/help next stroke if learner needs assistance
  const handleAutoFillNextStroke = () => {
    if (!charReference || !charReference.strokes) return;
    const strokeIdx = drawnStrokesRef.current.length;
    if (strokeIdx >= charReference.strokes.length) return;
    const refStroke = charReference.strokes[strokeIdx];
    const newStrokeModel: CharacterStrokeModel = {
      strokeId: `stk_${Date.now()}_${strokeIdx}`,
      characterId: currentChar,
      strokeIndex: strokeIdx,
      pointerId: 0,
      pointerType: 'pen',
      points: refStroke.points,
      startPoint: { x: refStroke.points[0].x, y: refStroke.points[0].y },
      endPoint: { x: refStroke.points[refStroke.points.length - 1].x, y: refStroke.points[refStroke.points.length - 1].y },
      durationMs: 150,
      isValidated: true,
    };
    drawnStrokesRef.current.push(newStrokeModel);
    displayStrokesRef.current.push(refStroke.points);
    wrongStrokeRef.current = null;
    redoStackRef.current = [];
    setStrokeCountDisplay(drawnStrokesRef.current.length);
    renderCanvas();
    if (drawnStrokesRef.current.length < charReference.strokeCount) {
      setCharState('AWAITING_MORE_STROKES');
    } else {
      setCharState('READY_TO_CHECK');
      runCharacterEvaluation(drawnStrokesRef.current);
    }
  };

  // Pointerup: commits exactly ONE stroke (Section A2)
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || e.pointerId !== activePointerIdRef.current) return;
    e.preventDefault();
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
    isDrawingRef.current = false;
    activePointerIdRef.current = null;

    const strokePoints = [...currentStrokePointsRef.current];
    currentStrokePointsRef.current = [];

    if (strokePoints.length < 2) {
      renderCanvas();
      return;
    }

    const strokeIdx = drawnStrokesRef.current.length;
    const startTime = strokePoints[0]?.time || performance.now();
    const endTime = strokePoints[strokePoints.length - 1]?.time || performance.now();

    // Standardized Stroke Data Model (Section A3)
    const newStrokeModel: CharacterStrokeModel = {
      strokeId: `stk_${Date.now()}_${strokeIdx}`,
      characterId: currentChar,
      strokeIndex: strokeIdx,
      pointerId: e.pointerId,
      pointerType: (e.pointerType as any) || 'pen',
      points: strokePoints,
      startPoint: { x: strokePoints[0].x, y: strokePoints[0].y },
      endPoint: { x: strokePoints[strokePoints.length - 1].x, y: strokePoints[strokePoints.length - 1].y },
      durationMs: Math.max(10, Math.round(endTime - startTime)),
      isValidated: false,
    };

    // Sequential Vector Reference Evaluation (Section B2)
    if (charReference && charReference.strokes && charReference.strokes[strokeIdx]) {
      const refStroke = charReference.strokes[strokeIdx];
      const evalResult = evaluateSingleStroke(strokePoints, refStroke.points, strokeIdx, LOGICAL_CANVAS_SIZE, LOGICAL_CANVAS_SIZE);

      // Measure drawn stroke length for dot/tick tolerance
      let drawnLength = 0;
      for (let i = 1; i < strokePoints.length; i++) {
        drawnLength += Math.hypot(strokePoints[i].x - strokePoints[i - 1].x, strokePoints[i].y - strokePoints[i - 1].y);
      }
      const isShortStroke = drawnLength < 55;
      const isBackwards = !isShortStroke && evalResult.directionCosine < -0.30;
      const isAccepted = (evalResult.confidence >= 40 || evalResult.canSnapToReference || evalResult.correct || isShortStroke) && !isBackwards;

      if (isAccepted) {
        // MATCH: Commit stroke, auto-fill points to canonical reference vector so evaluation is 100% correct
        newStrokeModel.points = refStroke.points;
        newStrokeModel.isValidated = true;
        drawnStrokesRef.current.push(newStrokeModel);
        displayStrokesRef.current.push(refStroke.points);
        redoStackRef.current = [];
        wrongStrokeRef.current = null;

        const successEval: SingleStrokeEvaluation = {
          ...evalResult,
          correct: true,
          confidence: Math.max(88, evalResult.confidence),
          feedbackMessage: 'Nét chuẩn xác! Đã khớp vào nét mẫu.',
          canSnapToReference: true,
        };
        setLastStrokeEval(successEval);
        setStrokeCountDisplay(drawnStrokesRef.current.length);

        // Controlled morph animation (Section C3)
        if (!isUltraEfficient) {
          activeMorphRef.current = animateStrokeMorph(
            strokePoints,
            refStroke.points,
            200,
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

        // State Machine transition (Section A4)
        if (drawnStrokesRef.current.length < charReference.strokeCount) {
          setCharState('AWAITING_MORE_STROKES');
        } else {
          setCharState('READY_TO_CHECK');
          runCharacterEvaluation(drawnStrokesRef.current);
        }
      } else {
        // INCORRECT: show stroke in red, do NOT advance strokeIndex!
        wrongStrokeRef.current = strokePoints;
        const failMessage = isBackwards
          ? 'Nét bị ngược hướng! Chú ý điểm bắt đầu và chiều kéo nét theo mũi tên mẫu.'
          : 'Nét chưa đúng! Hãy nhìn kỹ nét mẫu mờ và viết lại cho chuẩn.';

        const failEval: SingleStrokeEvaluation = {
          ...evalResult,
          correct: false,
          confidence: Math.min(45, evalResult.confidence),
          feedbackMessage: failMessage,
        };
        setLastStrokeEval(failEval);
        setCharState('INCORRECT');
        renderCanvas();

        if (wrongClearTimerRef.current) clearTimeout(wrongClearTimerRef.current);
        wrongClearTimerRef.current = window.setTimeout(() => {
          wrongStrokeRef.current = null;
          renderCanvas();
        }, 1200);
      }
    } else {
      // Fallback evaluation for general characters without pre-computed SVG vectors
      drawnStrokesRef.current.push(newStrokeModel);
      displayStrokesRef.current.push(strokePoints);
      redoStackRef.current = [];
      setStrokeCountDisplay(drawnStrokesRef.current.length);
      renderCanvas();

      const expected = charReference?.strokeCount || 2;
      if (drawnStrokesRef.current.length < expected) {
        setCharState('AWAITING_MORE_STROKES');
      } else {
        setCharState('READY_TO_CHECK');
        runCharacterEvaluation(drawnStrokesRef.current);
      }
    }
  };

  // Undo (Ctrl+Z): removes last stroke, updates state machine (Section E1)
  const handleUndo = useCallback(() => {
    wrongStrokeRef.current = null;
    if (drawnStrokesRef.current.length === 0) return;

    const popped = drawnStrokesRef.current.pop();
    displayStrokesRef.current.pop();
    if (popped) redoStackRef.current.push(popped);

    setStrokeCountDisplay(drawnStrokesRef.current.length);
    setLastStrokeEval(null);
    setCharEvaluation(null);

    const expected = charReference?.strokeCount || 1;
    if (drawnStrokesRef.current.length === 0) {
      setCharState('READY');
    } else if (drawnStrokesRef.current.length < expected) {
      setCharState('AWAITING_MORE_STROKES');
    } else {
      setCharState('READY_TO_CHECK');
    }
    renderCanvas();
  }, [charReference, renderCanvas]);

  // Redo (Ctrl+Y / Ctrl+Shift+Z)
  const handleRedo = useCallback(() => {
    wrongStrokeRef.current = null;
    if (redoStackRef.current.length === 0) return;

    const restored = redoStackRef.current.pop();
    if (!restored) return;

    drawnStrokesRef.current.push(restored);
    displayStrokesRef.current.push(restored.points);
    setStrokeCountDisplay(drawnStrokesRef.current.length);

    const expected = charReference?.strokeCount || 1;
    if (drawnStrokesRef.current.length < expected) {
      setCharState('AWAITING_MORE_STROKES');
    } else {
      setCharState('READY_TO_CHECK');
      runCharacterEvaluation(drawnStrokesRef.current);
    }
    renderCanvas();
  }, [charReference, runCharacterEvaluation, renderCanvas]);

  // Clear Canvas (Delete)
  const clearCanvas = useCallback(() => {
    if (activeMorphRef.current) {
      activeMorphRef.current.cancel();
      activeMorphRef.current = null;
    }
    if (wrongClearTimerRef.current) {
      clearTimeout(wrongClearTimerRef.current);
      wrongClearTimerRef.current = null;
    }
    wrongStrokeRef.current = null;
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

  // Keyboard Shortcuts (Section E1)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
      if (e.code === 'Space' && (charState === 'CORRECT' || charState === 'PARTIALLY_CORRECT')) {
        e.preventDefault();
        if (activeCharIndex < characters.length - 1) {
          setActiveCharIndex((prev) => prev + 1);
        } else {
          onNextWord();
        }
        return;
      }
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

  // Stroke Order Animation Playback (Section D3)
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

  const expectedStrokeCount = charReference?.strokeCount || 1;
  const activeStrokeIndex = drawnStrokesRef.current.length;

  return (
    <div
      className={`space-y-4 max-w-3xl mx-auto transition-all ${focusMode
        ? 'fixed inset-0 z-50 bg-slate-950/95 p-4 flex flex-col justify-center items-center overflow-y-auto'
        : ''
        }`}
    >
      {/* ========================================================================= */}
      {/* 1. VOCABULARY FOCUS CARD & GRAPHEME SELECTOR (SECTION D1)                 */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        {/* Vocabulary Word & Readings */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {word}
            </h2>
            {(romaji || pinyin || pronunciation) && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
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
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              Nét {Math.min(strokeCountDisplay + 1, expectedStrokeCount)}/{expectedStrokeCount}
            </span>
            <button
              onClick={() => setFocusMode(!focusMode)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title={focusMode ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
            >
              {focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Translation & Character Units */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-xs">
            {meaning}
          </p>

          {/* Multi-Character Writing Units (Section D5) */}
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
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition flex items-center gap-1 cursor-pointer ${isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
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

      {/* ========================================================================= */}
      {/* 2. THE HERO CANVAS (SECTION D2)                                           */}
      {/* ========================================================================= */}
      <div className="relative p-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500/25 shadow-lg flex flex-col items-center justify-center overflow-hidden">
        {/* Ghost character guide with high contrast & active stroke glow (Section D2) */}
        {showGhostGuide && (
          charReference?.hasRealSvgPaths && charReference.strokes && charReference.strokes.length > 0 ? (
            <svg
              viewBox="0 0 1024 1024"
              className="absolute inset-0 w-full h-full p-4 pointer-events-none z-0 select-none"
              style={{ opacity: ghostOpacity }}
            >
              {charReference.strokes.map((stroke, idx) => {
                const isCompleted = idx < strokeCountDisplay;
                const isCurrent = idx === strokeCountDisplay;
                return (
                  <g key={idx}>
                    <path
                      d={stroke.pathString}
                      fill="none"
                      stroke={isCurrent ? '#818cf8' : isCompleted ? '#10b981' : 'rgba(148, 163, 184, 0.45)'}
                      strokeWidth={isCurrent ? '64' : '46'}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={isCurrent ? 'none' : '6 10'}
                      className={isCurrent ? 'filter drop-shadow-[0_0_10px_rgba(129,140,248,0.7)]' : ''}
                    />
                    {/* Active stroke starting point cyan pulse dot */}
                    {isCurrent && stroke.points && stroke.points[0] && (
                      <circle
                        cx={stroke.points[0].x * (1024 / LOGICAL_CANVAS_SIZE)}
                        cy={stroke.points[0].y * (1024 / LOGICAL_CANVAS_SIZE)}
                        r="22"
                        fill="#38bdf8"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 select-none"
              style={{ opacity: ghostOpacity }}
            >
              <span
                className="text-[170px] sm:text-[200px] font-bold text-indigo-400 select-none leading-none tracking-normal"
                style={{
                  fontFamily: '"Noto Sans", "Noto Sans JP", "Noto Sans KR", "Noto Sans SC", system-ui, sans-serif',
                }}
              >
                {currentChar}
              </span>
            </div>
          )
        )}

        {/* High performance Canvas with touch-action isolation (Section E2, E3) */}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onLostPointerCapture={handlePointerCancel}
          className="relative z-10 w-full aspect-square max-w-[340px] sm:max-w-[370px] rounded-xl bg-slate-50/50 dark:bg-slate-950/90 cursor-crosshair touch-none select-none"
          style={{ touchAction: 'none' }}
        />

        {/* Real-time single stroke feedback toast */}
        {lastStrokeEval && (
          <div
            className={`absolute bottom-4 left-4 right-4 z-20 p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 shadow-lg backdrop-blur-md animate-slideUp ${lastStrokeEval.correct
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
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-black shrink-0">
              {lastStrokeEval.confidence}%
            </span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 3. REDESIGNED HANDWRITING TOOLBAR (TASK 6)                                */}
      {/* ========================================================================= */}
      <div className="w-full max-w-[420px] rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800/80 shadow-md p-2.5 space-y-2">
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          {/* Group 1: History Operations (Undo / Redo) */}
          <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={handleUndo}
              disabled={strokeCountDisplay === 0}
              className="p-2 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-xs"
              title="Hoàn tác nét (Ctrl+Z / Cmd+Z)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStackRef.current.length === 0}
              className="p-2 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-xs"
              title="Làm lại nét (Ctrl+Y / Cmd+Shift+Z)"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Group 2: Canvas & Grid */}
          <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={clearCanvas}
              className="p-2 rounded-lg bg-white dark:bg-slate-700 hover:bg-rose-500/10 hover:text-rose-600 text-slate-700 dark:text-slate-200 transition cursor-pointer shadow-xs"
              title="Xóa trắng chữ hiện tại (Delete)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-lg transition cursor-pointer shadow-xs ${
                showGrid
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Bật/Tắt Lưới Điền-Tự-Cách"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          {/* Group 3: Ghost Guide & Animation */}
          <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => {
                if (!showGhostGuide) {
                  setShowGhostGuide(true);
                  setGhostOpacity(0.55);
                } else if (ghostOpacity > 0.4) {
                  setGhostOpacity(0.25);
                } else {
                  setShowGhostGuide(false);
                }
              }}
              className={`p-2 rounded-lg transition cursor-pointer shadow-xs flex items-center gap-1 text-xs font-bold ${
                showGhostGuide
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Nét mẫu mờ: Bấm để đổi mức (Rõ -> Vừa -> Ẩn)"
            >
              {showGhostGuide ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="text-[10px]">
                {!showGhostGuide ? 'Ẩn' : ghostOpacity > 0.4 ? 'Rõ' : 'Vừa'}
              </span>
            </button>

            <button
                onClick={handleAutoFillNextStroke}
                disabled={!charReference?.strokes || strokeCountDisplay >= (charReference?.strokeCount || 1)}
                className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 transition cursor-pointer shadow-xs text-xs font-bold disabled:opacity-30 disabled:pointer-events-none"
                title="Gợi ý điền nét kế tiếp"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            {charReference?.hasRealSvgPaths && charReference.strokes && charReference.strokes.length > 0 && (
              <button
                onClick={isPlayingAnimation ? stopStrokeAnimation : playStrokeAnimation}
                className={`p-2 rounded-lg transition cursor-pointer shadow-xs text-xs font-bold ${
                  isPlayingAnimation
                    ? 'bg-amber-500 text-white animate-pulse'
                    : 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-slate-100'
                }`}
                title="Xem thứ tự nét chuẩn (Animation)"
              >
                {isPlayingAnimation ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Group 4: Next / Check Primary Action */}
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
            ) : (
              <button
                onClick={() => runCharacterEvaluation(drawnStrokesRef.current)}
                disabled={drawnStrokesRef.current.length === 0}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-black shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Kiểm tra</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. DEDICATED FEEDBACK AREA (SECTION D4)                                   */}
      {/* ========================================================================= */}
      {charEvaluation && (
        <div
          className={`p-3.5 rounded-2xl border text-xs shadow-sm transition space-y-2 ${charEvaluation.finalCorrectness === 'CORRECT'
            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
            : charEvaluation.finalCorrectness === 'NEARLY_CORRECT'
              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200'
              : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
        >
          <div className="flex items-center justify-between font-bold">
            <div className="flex items-center gap-2">
              {charEvaluation.finalCorrectness === 'CORRECT' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : charEvaluation.finalCorrectness === 'NEARLY_CORRECT' ? (
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span className="text-sm font-black">
                {charEvaluation.finalCorrectness === 'CORRECT'
                  ? 'Ký tự hoàn thành chuẩn xác!'
                  : charEvaluation.finalCorrectness === 'NEARLY_CORRECT'
                    ? 'Ký tự gần đúng (Đạt yêu cầu)'
                    : 'Cần sửa lại nét viết'}
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/70 dark:bg-slate-900/70 border border-current text-xs font-black">
              {charEvaluation.recognitionConfidence}% độ chuẩn
            </span>
          </div>

          {/* Actionable suggestions list */}
          <div className="space-y-1 pl-6">
            {charEvaluation.suggestions.map((msg, i) => (
              <p key={i} className="leading-relaxed">
                • {msg}
              </p>
            ))}
          </div>

          {/* Retry Prompt if incorrect */}
          {charEvaluation.finalCorrectness === 'INCORRECT' && (
            <div className="pt-2 flex items-center justify-end">
              <button
                onClick={clearCanvas}
                className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-rose-500 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Viết lại chữ này</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Procedural Vector Reference Generator for uncataloged characters
 */
function generateFallbackCharacterReference(
  literal: string,
  scriptCode: string,
  canvasSize: number
): CharacterReference {
  const scale = canvasSize / 1024;
  const syntheticPaths = [
    'M 200 450 L 824 450',
    'M 512 180 L 512 840',
  ];

  const strokes = syntheticPaths.map((pathStr, index) => {
    const pts = sampleSvgPath(pathStr, 32, scale);
    return {
      index,
      pathString: pathStr,
      points: pts,
      length: pts.length,
    };
  });

  return {
    id: `gen-${literal}`,
    literal,
    scriptCode,
    strokeCount: syntheticPaths.length,
    strokes,
    viewBox: { width: canvasSize, height: canvasSize },
    hasRealSvgPaths: false,
  };
}
