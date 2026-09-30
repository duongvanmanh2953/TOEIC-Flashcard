/**
 * Security & Content Sanitization Utilities
 * Prevents XSS, script injection, and dangerous tags while preserving safe rich text/markdown.
 */

export class ContentSanitizer {
  private static readonly DANGEROUS_TAGS_REGEX =
    /<(script|iframe|object|embed|applet|form|button|input|textarea|style|link|meta|base|svg)[\s\S]*?<\/\1>|<(script|iframe|object|embed|applet|form|button|input|textarea|style|link|meta|base|svg)[^>]*?>/gi;

  private static readonly DANGEROUS_ATTRIBUTES_REGEX =
    /\s*(on\w+|javascript:|data-bind|action|formaction)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;

  private static readonly JAVASCRIPT_PROTOCOL_REGEX =
    /(href|src|xlink:href)\s*=\s*['"]\s*javascript:[^'"]*['"]/gi;

  /**
   * Sanitizes rich text / markdown strings to eliminate dangerous XSS payloads.
   */
  static sanitizeHtml(input: string): string {
    if (!input || typeof input !== 'string') return '';

    let clean = input
      // Remove dangerous tag pairs and self-closing dangerous tags
      .replace(this.DANGEROUS_TAGS_REGEX, '')
      // Remove inline event handlers (onload, onerror, onclick, etc.)
      .replace(this.DANGEROUS_ATTRIBUTES_REGEX, '')
      // Remove javascript: pseudo-protocol in links/src
      .replace(this.JAVASCRIPT_PROTOCOL_REGEX, '$1="#"');

    return clean.trim();
  }

  /**
   * Strips all markup and returns a concise, clean plain-text preview.
   * Useful for fast feed rendering, search snippets, and AI dataset summaries.
   */
  static createPlainTextPreview(input: string, maxLength: number = 240): string {
    if (!input || typeof input !== 'string') return '';

    let text = input
      // Remove tags
      .replace(/<[^>]+>/g, ' ')
      // Remove markdown headings, blockquotes, bullets, links, images
      .replace(/#{1,6}\s+/g, '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/`{1,3}(.*?)(`{1,3}|$)/gs, '$1')
      .replace(/>\s+/g, '')
      // Collapse whitespace
      .replace(/\s+/g, ' ')
      .trim();

    if (text.length <= maxLength) {
      return text;
    }

    return text.substring(0, maxLength).trim() + '...';
  }

  /**
   * Normalizes an array of tags (lowercased, trimmed, alphanum + hyphens).
   */
  static normalizeTags(tags?: string[]): string[] {
    if (!tags || !Array.isArray(tags)) return [];
    const set = new Set<string>();

    for (const raw of tags) {
      if (typeof raw !== 'string') continue;
      const clean = raw
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\-_]/g, '')
        .slice(0, 30);
      if (clean.length >= 2) {
        set.add(clean);
      }
    }

    return Array.from(set).slice(0, 10);
  }
}
