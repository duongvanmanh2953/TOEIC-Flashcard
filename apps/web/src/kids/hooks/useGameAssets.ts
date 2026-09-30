// ============================================================================
// USE GAME ASSETS HOOK — REACT CONNECTOR FOR GAME ASSET SERVICE
// Stale-While-Revalidate • Automatic unmount request abort • Zero duplicate fetches
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { gameAssetService, GameAssetItem } from '../services/assets/gameAssetService';

interface UseGameAssetsOptions {
  category?: string;
  autoPreloadFirst?: number;
}

export function useGameAssets(options: UseGameAssetsOptions = {}) {
  const { category, autoPreloadFirst = 4 } = options;
  const [items, setItems] = useState<GameAssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const prevIndexRef = useRef(0);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    gameAssetService
      .getManifest(category)
      .then((data) => {
        if (!isMounted) return;
        setItems(data);
        setLoading(false);

        // Preload first few items immediately
        if (autoPreloadFirst > 0 && data.length > 0) {
          data.slice(0, autoPreloadFirst).forEach((item) => {
            gameAssetService.preloadImage(item.thumbnail);
          });
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err);
        setLoading(false);
      });

    return () => {
      isMounted = false;
      // Abort background requests when leaving game
      gameAssetService.abortPendingRequests();
    };
  }, [category, autoPreloadFirst]);

  const getAsset = useCallback((id: string) => {
    return gameAssetService.getAsset(id);
  }, []);

  const preloadDirectional = useCallback(
    (currentIndex: number, count = 3) => {
      const direction = currentIndex >= prevIndexRef.current ? 'forward' : 'backward';
      prevIndexRef.current = currentIndex;
      gameAssetService.prefetchDirectional(items, currentIndex, direction, count);
    },
    [items]
  );

  return {
    items,
    loading,
    error,
    getAsset,
    preloadDirectional,
    preloadImage: gameAssetService.preloadImage.bind(gameAssetService),
  };
}
