/**
 * Multi-Engine Handwriting Provider Registry
 * 
 * Automatically resolves the optimal handwriting engine for each Language Space:
 * 1. Chinese (zh) -> HanziWriterAdapter (Stroke Evaluation)
 * 2. Japanese (ja) -> KakitoriAdapter (Stroke Evaluation)
 * 3. Korean (ko) -> SelvasAdapter (Hangul Structural Evaluation)
 * 4. Thai (th) -> MyScriptAdapter (Recognition Only)
 * 5. Arabic (ar) -> MyScriptAdapter (Recognition Only, RTL)
 * 
 * Ensures strict capability reporting without misleading claims.
 */

import {
  HandwritingProvider,
  HandwritingCapability,
} from './types';
import { HanziWriterAdapter } from '../adapters/hanziWriterAdapter';
import { KakitoriAdapter } from '../adapters/kakitoriAdapter';
import { SelvasAdapter } from '../adapters/selvasAdapter';
import { MyScriptAdapter } from '../adapters/myscriptAdapter';

export class HandwritingProviderRegistry {
  private static instance: HandwritingProviderRegistry;
  private providers: Map<string, HandwritingProvider> = new Map();

  private constructor() {
    this.registerDefaultProviders();
  }

  static getInstance(): HandwritingProviderRegistry {
    if (!HandwritingProviderRegistry.instance) {
      HandwritingProviderRegistry.instance = new HandwritingProviderRegistry();
    }
    return HandwritingProviderRegistry.instance;
  }

  private registerDefaultProviders(): void {
    this.registerProvider(new HanziWriterAdapter());
    this.registerProvider(new KakitoriAdapter());
    this.registerProvider(new SelvasAdapter());
    this.registerProvider(new MyScriptAdapter());
  }

  registerProvider(provider: HandwritingProvider): void {
    this.providers.set(provider.metadata.id, provider);
  }

  getProvider(providerId: string): HandwritingProvider | null {
    return this.providers.get(providerId) || null;
  }

  getAllProviders(): HandwritingProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Resolve primary provider for a given language code and optional script code
   */
  getProviderForLanguage(languageCode?: string, _scriptCode?: string): HandwritingProvider | null {
    if (!languageCode) return null;
    const lang = languageCode.toLowerCase().split(/[-_]/)[0];

    // 1. Chinese -> Hanzi Writer
    if (lang === 'zh') {
      return this.providers.get('hanzi-writer') || null;
    }

    // 2. Japanese -> Kakitori
    if (lang === 'ja') {
      return this.providers.get('kakitori') || null;
    }

    // 3. Korean -> SELVAS Pen
    if (lang === 'ko') {
      return this.providers.get('selvas-pen') || null;
    }

    // 4. Thai & Arabic -> MyScript
    if (lang === 'th' || lang === 'ar') {
      return this.providers.get('myscript') || null;
    }

    return null;
  }

  /**
   * Query if true stroke-by-stroke evaluation is available for language
   */
  isStrokeEvaluationSupported(languageCode?: string): boolean {
    const provider = this.getProviderForLanguage(languageCode);
    if (!provider || !provider.isAvailable()) return false;
    return provider.metadata.capabilities.includes('stroke_order');
  }

  /**
   * Query if whole-text recognition is available for language
   */
  isRecognitionSupported(languageCode?: string): boolean {
    const provider = this.getProviderForLanguage(languageCode);
    if (!provider || !provider.isAvailable()) return false;
    return provider.metadata.capabilities.includes('whole_text_recognition');
  }

  /**
   * Get supported capabilities list for language
   */
  getCapabilitiesForLanguage(languageCode?: string): HandwritingCapability[] {
    const provider = this.getProviderForLanguage(languageCode);
    if (!provider) return ['ink_capture'];
    return provider.metadata.capabilities;
  }

  /**
   * Diagnostic summary for developer tools, settings & debug modals
   */
  getDiagnostics(): Array<{
    id: string;
    name: string;
    supportedLanguages: string[];
    capabilities: HandwritingCapability[];
    available: boolean;
    unavailableReason: string | null;
    license: string;
  }> {
    return this.getAllProviders().map((p) => ({
      id: p.metadata.id,
      name: p.metadata.name,
      supportedLanguages: p.metadata.supportedLanguages,
      capabilities: p.metadata.capabilities,
      available: p.isAvailable(),
      unavailableReason: p.getUnavailableReason(),
      license: p.metadata.licenseName,
    }));
  }
}

export const handwritingRegistry = HandwritingProviderRegistry.getInstance();

