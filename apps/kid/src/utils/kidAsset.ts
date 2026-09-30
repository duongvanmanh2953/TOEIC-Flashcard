/**
 * Helper to resolve kid asset paths with automatic cache-busting & assets server support
 */
export const kidAsset = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const separator = cleanPath.includes('?') ? '&' : '?';
  const assetsBase = (import.meta.env.VITE_ASSETS_BASE_URL || '').replace(/\/+$/, '');
  const url = assetsBase ? `${assetsBase}${cleanPath}` : cleanPath;
  return `${url}${separator}v=20260929v2`;
};
