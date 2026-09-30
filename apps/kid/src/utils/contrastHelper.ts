/**
 * contrastHelper.ts
 * Theme-safe contrast utilities and styling tokens
 * Prevents UX bugs where white text appears on light surfaces.
 */

export const CONTRAST_TOKENS = {
  // Guaranteed readable dark text for light surfaces (cards, buttons, inputs)
  textOnLight: 'text-slate-950',
  textMutedOnLight: 'text-slate-700',
  textSubtleOnLight: 'text-slate-600',

  // Guaranteed readable light text strictly for dark backgrounds (solid dark badges, overlays)
  textOnDark: 'text-white',
  textMutedOnDark: 'text-slate-200',

  // High contrast borders
  borderOnLight: 'border-slate-300',
  borderProminent: 'border-amber-400',
  borderSuccess: 'border-emerald-500',
  borderError: 'border-rose-500',
};

/**
 * Returns safe text class based on whether surface is light or dark
 */
export function getSafeTextColor(surface: 'light' | 'dark' = 'light', isMuted: boolean = false): string {
  if (surface === 'dark') {
    return isMuted ? CONTRAST_TOKENS.textMutedOnDark : CONTRAST_TOKENS.textOnDark;
  }
  return isMuted ? CONTRAST_TOKENS.textMutedOnLight : CONTRAST_TOKENS.textOnLight;
}
