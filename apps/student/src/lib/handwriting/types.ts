/**
 * Handwriting Engine Type Definitions
 * Strictly vector-based representation of strokes, reference geometries,
 * evaluations, state machine and morphing.
 */

export interface HandwritingPoint {
  x: number;
  y: number;
  time?: number;
  pressure?: number;
}

export type HandwritingStroke = HandwritingPoint[];

/**
 * Normalized Stroke Data Model (Section A3)
 */
export interface CharacterStrokeModel {
  strokeId: string;
  characterId: string;
  strokeIndex: number;
  pointerId: number;
  pointerType: 'mouse' | 'touch' | 'pen';
  points: HandwritingPoint[];
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  durationMs: number;
  isValidated?: boolean;
}

export interface ReferenceStroke {
  index: number;
  pathString: string;
  points: HandwritingPoint[];
  length: number;
}

export interface CharacterReference {
  id: string;
  literal: string;
  scriptCode: string;
  strokeCount: number;
  strokes: ReferenceStroke[];
  meanings?: string[];
  readings?: Record<string, any>;
  radicals?: string;
  level?: string;
  viewBox: { width: number; height: number };
  hasRealSvgPaths?: boolean;
}

/**
 * Character Completion State Machine (Section A4)
 */
export type CharacterCompletionState =
  | 'READY'
  | 'DRAWING'
  | 'STROKE_COMMITTED'
  | 'AWAITING_MORE_STROKES'
  | 'READY_TO_CHECK'
  | 'EVALUATING'
  | 'CORRECT'
  | 'PARTIALLY_CORRECT'
  | 'INCORRECT'
  | 'COMPLETED';

export interface SingleStrokeEvaluation {
  strokeIndex: number;
  confidence: number; // 0 to 100%
  correct: boolean;
  directionCorrect: boolean;
  directionCosine: number;
  startPointDistance: number;
  endPointDistance: number;
  shapeSimilarity: number; // 0 to 100%
  feedbackMessage: string;
  canSnapToReference: boolean;
}

/**
 * Recognition & Evaluation Result (Section B3)
 */
export interface CharacterEvaluationResult {
  recognizedCharacter: string;
  expectedCharacter: string;
  recognitionConfidence: number; // 0 to 100%
  expectedStrokeCount: number;
  actualStrokeCount: number;
  validStrokeCount: number;
  incorrectStrokeIndices: number[];
  missingStrokes: number;
  extraStrokes: number;
  wrongDirectionIndices: number[];
  wrongOrderIndices: number[];
  shapeEvaluation: {
    similarity: number;
    status: 'GOOD' | 'FAIR' | 'POOR';
  };
  positionEvaluation: {
    offset: number;
    status: 'ALIGNED' | 'MISALIGNED';
  };
  finalCorrectness: 'CORRECT' | 'NEARLY_CORRECT' | 'INCORRECT' | 'UNRECOGNIZED';
  evaluationProvider: string;
  evaluationCapability: string[];
  suggestions: string[];
  canSnapToReference: boolean;
  preMorphMasteryScore: number;

  // Backward compatibility aliases
  recognized: boolean;
  confidence: number;
  strokeCount: {
    expected: number;
    actual: number;
    correct: boolean;
  };
  strokeOrder: {
    correct: boolean;
    mistakes: number[];
  };
  strokeEvaluations: SingleStrokeEvaluation[];
}

export type HandwritingPracticeMode = 'LEARN' | 'TRACE' | 'GUIDED' | 'FREE' | 'CHALLENGE';

export interface HandwritingStudioState {
  mode: HandwritingPracticeMode;
  ghostOpacity: number;
  strokeColor: string;
  strokeWidth: number;
  soundEnabled: boolean;
  ultraEfficientMode: boolean;
}
