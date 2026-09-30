// ============================================================================
// VIRTUAL GAME WINDOW & PRELOADER
// Renders active window [current - 5, current + 5] (≈ 11 DOM nodes)
// Smart prefetch of nearby assets • AbortController cleanup on unmount
// ============================================================================

import { useState, useEffect, useRef, useMemo } from 'react';

export interface VirtualWindowOptions {
  windowSize?: number; // Default: 5 (renders current ± 5)
  preloadAhead?: number; // Default: 5 (preloads next 5 items)
}

export function useVirtualWindow<T extends { imageUrl?: string; image?: string; thumbnail?: string }>(
  items: T[],
  currentIndex: number,
  options: VirtualWindowOptions = {}
) {
  const { windowSize = 5, preloadAhead = 5 } = options;
  const lastIndexRef = useRef(currentIndex);

  const { startIndex, endIndex, visibleItems } = useMemo(() => {
    if (!items || items.length === 0) {
      return { startIndex: 0, endIndex: 0, visibleItems: [] };
    }
    const start = Math.max(0, currentIndex - windowSize);
    const end = Math.min(items.length - 1, currentIndex + windowSize);
    return {
      startIndex: start,
      endIndex: end,
      visibleItems: items.slice(start, end + 1).map((item, relIdx) => ({
        ...item,
        absoluteIndex: start + relIdx,
      })),
    };
  }, [items, currentIndex, windowSize]);

  // Smart Preloader: Prefetches next assets in user navigation direction
  useEffect(() => {
    if (!items || items.length === 0) return;

    const movingForward = currentIndex >= lastIndexRef.current;
    lastIndexRef.current = currentIndex;

    const prefetchUrls: string[] = [];
    if (movingForward) {
      const prefetchStart = endIndex + 1;
      const prefetchEnd = Math.min(items.length - 1, endIndex + preloadAhead);
      for (let i = prefetchStart; i <= prefetchEnd; i++) {
        const item = items[i];
        const url = item?.imageUrl || item?.image || item?.thumbnail;
        if (url) prefetchUrls.push(url);
      }
    } else {
      const prefetchStart = Math.max(0, startIndex - preloadAhead);
      const prefetchEnd = startIndex - 1;
      for (let i = prefetchStart; i <= prefetchEnd; i++) {
        const item = items[i];
        const url = item?.imageUrl || item?.image || item?.thumbnail;
        if (url) prefetchUrls.push(url);
      }
    }

    // Prefetch image blobs with Image()
    const imgElements: HTMLImageElement[] = [];
    prefetchUrls.forEach((url) => {
      const img = new Image();
      img.src = url;
      imgElements.push(img);
    });

    return () => {
      // Cancel/detach prefetch references on unmount
      imgElements.forEach((img) => {
        img.src = '';
      });
    };
  }, [items, currentIndex, startIndex, endIndex, preloadAhead]);

  return {
    visibleItems,
    startIndex,
    endIndex,
    totalItems: items.length,
    activeWindowCount: visibleItems.length,
  };
}
