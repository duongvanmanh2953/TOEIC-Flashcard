/**
 * Helper to resolve kid asset paths with automatic cache-busting
 * Ensures browsers immediately load the newly calibrated pixel-perfect crops
 */
export const kidAsset = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const separator = cleanPath.includes('?') ? '&' : '?';
  return `${cleanPath}${separator}v=20260929v2`;
};
