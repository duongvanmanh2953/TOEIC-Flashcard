/**
 * Handwriting Engine Type Definitions
 * Strictly vector-based representation of strokes, reference geometries,
 * evaluations and morphing state.
 */

export interface HandwritingPoint {
  x: number;
  y: number;
  time?: number;
  pressure?: number;
}

export type HandwritingStroke = HandwritingPoint[];

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

export interface CharacterEvaluationResult {
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
  suggestions: string[];
  canSnapToReference: boolean;
  preMorphMasteryScore: number;
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
