/**
 * Multi-Engine Handwriting System Core Contracts & Capability Types
 * 
 * Defines granular capabilities distinguishing:
 * - Stroke Evaluation: stroke count, order, direction, shape, position, ending.
 * - Handwriting Recognition: character/word recognition from digital ink.
 */

export type EvaluationStatus =
  | 'correct'
  | 'incorrect'
  | 'inconclusive'
  | 'unsupported'
  | 'recognition_only';

export type HandwritingCapability =
  | 'ink_capture'
  | 'whole_text_recognition'
  | 'stroke_order'
  | 'stroke_direction'
  | 'stroke_shape'
  | 'stroke_position'
  | 'stroke_ending'
  | 'stroke_animation';

export interface InkPoint {
  x: number;
  y: number;
  t: number;
  pressure?: number;
}

export interface InkStroke {
  id: string;
  index: number;
  points: InkPoint[];
}

export interface HandwritingRequest {
  languageCode: string;
  scriptCode: string;
  targetText: string;
  strokes: InkStroke[];
  mode: 'guided' | 'freehand';
  canvasWidth?: number;
  canvasHeight?: number;
}

export interface StrokeAssessment {
  strokeIndex: number;
  status: EvaluationStatus;
  confidence?: number;
  issues?: string[];
  feedback?: string;
}

export interface HandwritingResult {
  providerId: string;
  status: EvaluationStatus;
  capabilitiesUsed: HandwritingCapability[];
  recognizedText?: string;
  recognitionCandidates?: Array<{
    text: string;
    confidence?: number;
  }>;
  strokes?: StrokeAssessment[];
  overallConfidence?: number;
  feedback?: string;
  errorCode?: string;
  rawDetails?: any;
}

export interface HandwritingProviderMetadata {
  id: string;
  name: string;
  supportedLanguages: string[];
  supportedScripts: string[];
  capabilities: HandwritingCapability[];
  requiresLicenseKey: boolean;
  requiresCloudApi: boolean;
  supportsOffline: boolean;
  licenseName: string;
  datasetSource?: string;
}

export interface HandwritingProvider {
  readonly metadata: HandwritingProviderMetadata;
  isAvailable(): boolean;
  getUnavailableReason(): string | null;
  hasCharacterData?(character: string, scriptCode?: string): Promise<boolean> | boolean;
  evaluateStrokes?(request: HandwritingRequest): Promise<HandwritingResult>;
  recognizeText?(request: HandwritingRequest): Promise<HandwritingResult>;
}

