import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseScrollLoadOptions<T> {
  items: T[];
  initialBatch?: number;
  batchSize?: number;
  rootMargin?: string;
  resetDependencies?: any[];
}

export function useScrollLoad<T>({
  items,
  initialBatch = 24,
  batchSize = 24,
  rootMargin = '400px',
  resetDependencies = [],
}: UseScrollLoadOptions<T>) {
  const [displayCount, setDisplayCount] = useState<number>(initialBatch);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset display count whenever items count or filter dependencies change
  useEffect(() => {
    setDisplayCount(initialBatch);
  }, [items.length, ...resetDependencies]);

  const loadMore = useCallback(() => {
    if (displayCount < items.length) {
      setIsLoadingMore(true);
      requestAnimationFrame(() => {
        setDisplayCount((prev) => Math.min(prev + batchSize, items.length));
        setIsLoadingMore(false);
      });
    }
  }, [displayCount, items.length, batchSize]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || displayCount >= items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin, threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [displayCount, items.length, loadMore, rootMargin]);

  const visibleItems = items.slice(0, displayCount);
  const hasMore = displayCount < items.length;

  return {
    visibleItems,
    displayCount,
    totalCount: items.length,
    hasMore,
    isLoadingMore,
    sentinelRef,
    loadMore,
  };
}
