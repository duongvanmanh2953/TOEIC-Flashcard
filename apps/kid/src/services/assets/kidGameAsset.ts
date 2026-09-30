// ============================================================================
// KID GAME ASSET SYSTEM & INTELLIGENT PRELOADER
// High-resolution WebP/PNG assets • Structured categories • Controlled prefetch
// ============================================================================

export type KidAssetCategory =
  | 'animals'
  | 'food'
  | 'objects'
  | 'transport'
  | 'nature'
  | 'mascot'
  | 'rewards'
  | 'backgrounds';

/**
 * Returns the optimized URL for a given asset category and filename.
 */
export function kidGameAsset(category: KidAssetCategory, name: string): string {
  const cleanName = (name || '').toLowerCase().trim().replace(/\s+/g, '-');
  const assetsBase = (import.meta.env.VITE_ASSETS_BASE_URL || '').replace(/\/+$/, '');
  const base = assetsBase ? `${assetsBase}/assets/kid/${category}/${cleanName}` : `/assets/kid/${category}/${cleanName}`;
  return cleanName.endsWith('.png') || cleanName.endsWith('.webp') || cleanName.endsWith('.jpg')
    ? base
    : `${base}.png`;
}

// In-memory cache of already preloaded image URLs to prevent duplicate network requests
const preloadedImageCache = new Set<string>();

/**
 * Preload a set of critical image URLs into the browser memory.
 * Uses Image().decode() for GPU decoding ahead of time, ensuring 60fps rendering without jank.
 */
export async function preloadGameImages(urls: (string | undefined | null)[]): Promise<void> {
  const validUrls = urls.filter((u): u is string => Boolean(u && !preloadedImageCache.has(u)));
  if (validUrls.length === 0) return;

  const promises = validUrls.map((url) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.src = url;
      preloadedImageCache.add(url);
      if (img.decode) {
        img
          .decode()
          .then(() => resolve())
          .catch(() => resolve());
      } else {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      }
    });
  });

  await Promise.all(promises);
}

/**
 * Preload upcoming question assets quietly during idle time (next 2-3 questions only).
 */
export function preloadUpcomingImages(urls: (string | undefined | null)[]): void {
  const runner = () => {
    preloadGameImages(urls);
  };

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(runner, { timeout: 1000 });
  } else {
    setTimeout(runner, 150);
  }
}
