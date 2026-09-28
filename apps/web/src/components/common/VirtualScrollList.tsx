import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export interface VirtualScrollListProps<T> {
  items: T[];
  itemKey: (item: T, index: number) => string | number;
  estimatedItemHeight?: number;
  bufferSize?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  isLoadingInitial?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onLoadMore?: () => void;
  onRetry?: () => void;
  emptyState?: React.ReactNode;
  initialSkeleton?: React.ReactNode;
  containerClassName?: string;
  contentClassName?: string;
}

export function VirtualScrollList<T>({
  items,
  itemKey,
  estimatedItemHeight = 160,
  bufferSize = 6,
  renderItem,
  hasMore = false,
  isLoadingMore = false,
  isLoadingInitial = false,
  isError = false,
  errorMessage = 'Đã xảy ra lỗi khi tải dữ liệu.',
  onLoadMore,
  onRetry,
  emptyState,
  initialSkeleton,
  containerClassName = '',
  contentClassName = '',
}: VirtualScrollListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  // Dynamic height measurements map
  const itemHeights = useRef<Map<string | number, number>>(new Map());
  const itemPositions = useRef<{ top: number; height: number }[]>([]);

  // Update container height on resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.height > 0) {
          setContainerHeight(entry.contentRect.height);
        }
      }
    });

    ro.observe(el);
    setContainerHeight(el.clientHeight || 600);

    return () => ro.disconnect();
  }, []);

  // Recalculate item positions based on recorded or estimated heights
  const totalContentHeight = useMemo(() => {
    let currentTop = 0;
    const positions: { top: number; height: number }[] = [];

    for (let i = 0; i < items.length; i++) {
      const key = itemKey(items[i], i);
      const measuredHeight = itemHeights.current.get(key) || estimatedItemHeight;
      positions.push({ top: currentTop, height: measuredHeight });
      currentTop += measuredHeight;
    }

    itemPositions.current = positions;
    return currentTop;
  }, [items, itemKey, estimatedItemHeight]);

  // Compute visible range using binary search / index lookup
  const { startIndex, endIndex } = useMemo(() => {
    const count = items.length;
    if (count === 0) return { startIndex: 0, endIndex: 0 };

    const viewportTop = scrollTop;
    const viewportBottom = scrollTop + containerHeight;

    // Find start index
    let start = 0;
    let low = 0;
    let high = count - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const pos = itemPositions.current[mid];
      if (pos && pos.top + pos.height >= viewportTop) {
        start = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    // Find end index
    let end = start;
    for (let i = start; i < count; i++) {
      const pos = itemPositions.current[i];
      if (!pos || pos.top > viewportBottom) {
        end = i;
        break;
      }
      end = i;
    }

    const boundedStart = Math.max(0, start - bufferSize);
    const boundedEnd = Math.min(count - 1, end + bufferSize);

    return { startIndex: boundedStart, endIndex: boundedEnd };
  }, [scrollTop, containerHeight, items.length, bufferSize]);

  // Scroll handler with throttle and load more trigger
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    setScrollTop(el.scrollTop);

    // Infinite scroll check: within 350px of bottom
    const distanceToBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
    if (distanceToBottom < 350 && hasMore && !isLoadingMore && !isLoadingInitial && !isError) {
      onLoadMore?.();
    }
  }, [hasMore, isLoadingMore, isLoadingInitial, isError, onLoadMore]);

  // Measure dynamic element height when rendered
  const measureElement = useCallback(
    (key: string | number, node: HTMLDivElement | null) => {
      if (!node) return;
      const height = node.getBoundingClientRect().height;
      if (height > 0 && itemHeights.current.get(key) !== height) {
        itemHeights.current.set(key, height);
      }
    },
    [],
  );

  // Render initial loading skeleton
  if (isLoadingInitial && items.length === 0) {
    return (
      <div className={`w-full overflow-y-auto ${containerClassName}`}>
        {initialSkeleton || (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className="animate-pulse rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 h-36 border border-slate-200 dark:border-slate-800/80 p-5 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-300 dark:bg-slate-700" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 bg-slate-300 dark:bg-slate-700 rounded w-1/3" />
                    <div className="h-2.5 bg-slate-300 dark:bg-slate-700 rounded w-1/5" />
                  </div>
                </div>
                <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-4/5" />
                <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-full" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render empty state
  if (!isLoadingInitial && items.length === 0 && !isError) {
    return (
      <div className={`w-full flex items-center justify-center p-8 ${containerClassName}`}>
        {emptyState || (
          <div className="text-center py-12 space-y-2">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Không tìm thấy nội dung nào.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Hãy thử tìm kiếm từ khóa khác hoặc tạo mục mới.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Render initial error state
  if (isError && items.length === 0) {
    return (
      <div className={`w-full flex flex-col items-center justify-center p-8 text-center space-y-3 ${containerClassName}`}>
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{errorMessage}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Không thể tải dữ liệu từ máy chủ. Vui lòng thử lại.
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        )}
      </div>
    );
  }

  const visibleSlice = items.slice(startIndex, endIndex + 1);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`relative overflow-y-auto overscroll-contain will-change-scroll ${containerClassName}`}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Phantom Scroll Track to simulate full virtual height */}
      <div
        className="w-full relative pointer-events-none"
        style={{ height: `${totalContentHeight}px` }}
      >
        {/* Render ONLY items within visible range positioned absolutely */}
        {visibleSlice.map((item, sliceIdx) => {
          const actualIndex = startIndex + sliceIdx;
          const key = itemKey(item, actualIndex);
          const pos = itemPositions.current[actualIndex];
          const top = pos?.top ?? actualIndex * estimatedItemHeight;

          return (
            <div
              key={key}
              ref={(node) => measureElement(key, node)}
              className={`absolute left-0 right-0 w-full pointer-events-auto ${contentClassName}`}
              style={{
                top: `${top}px`,
                transform: 'translateZ(0)', // GPU layer promotion for silky 60fps scrolling
              }}
            >
              {renderItem(item, actualIndex)}
            </div>
          );
        })}
      </div>

      {/* Loading More Indicator */}
      {isLoadingMore && (
        <div className="py-4 flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Đang tải thêm...</span>
        </div>
      )}

      {/* End of Feed Indicator */}
      {!hasMore && items.length > 0 && !isLoadingInitial && (
        <div className="py-6 text-center text-xs font-medium text-slate-400 dark:text-slate-500 border-t border-slate-200/50 dark:border-slate-800/50 mt-4">
          Bạn đã xem hết tất cả nội dung.
        </div>
      )}
    </div>
  );
}
