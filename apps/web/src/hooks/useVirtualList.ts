import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';

export interface UseVirtualListOptions<T> {
  items: T[];
  itemHeight: number; // Height in px of a single row/item
  columns?: number | ((width: number) => number); // Support fixed columns or responsive function
  overscan?: number; // Number of buffer rows above and below viewport
}

export interface VirtualListResult<T> {
  virtualItems: {
    item: T;
    index: number;
    columnIndex: number;
    rowIndex: number;
  }[];
  startIndex: number;
  endIndex: number;
  totalCount: number;
  topSpacerHeight: number;
  bottomSpacerHeight: number;
  containerRef: React.RefObject<HTMLDivElement>;
  columns: number;
}

export function useVirtualList<T>({
  items,
  itemHeight,
  columns: columnsConfig = 1,
  overscan = 3,
}: UseVirtualListOptions<T>): VirtualListResult<T> {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [viewportHeight, setViewportHeight] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerHeight : 800
  );
  const [containerTop, setContainerTop] = useState<number>(0);
  const [currentCols, setCurrentCols] = useState<number>(1);

  // Compute number of columns responsively
  const updateColumns = useCallback(() => {
    if (typeof columnsConfig === 'number') {
      setCurrentCols(Math.max(1, columnsConfig));
    } else if (typeof columnsConfig === 'function') {
      const width = containerRef.current ? containerRef.current.clientWidth : window.innerWidth;
      setCurrentCols(Math.max(1, columnsConfig(width)));
    }
  }, [columnsConfig]);

  // Track window scroll and viewport height
  useEffect(() => {
    const handleScroll = () => {
      setScrollTop(window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0);
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const currentTop = rect.top + (window.scrollY || window.pageYOffset || 0);
        setContainerTop(currentTop);
      }
    };

    const handleResize = () => {
      setViewportHeight(window.innerHeight);
      updateColumns();
      handleScroll();
    };

    updateColumns();
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // Measure after fonts/layout settle
    const timer = setTimeout(handleScroll, 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [updateColumns, items.length]);

  // Keep containerTop updated if DOM changes above container
  useLayoutEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerTop(rect.top + (window.scrollY || window.pageYOffset || 0));
    }
  }, [items.length]);

  const totalCount = items.length;
  const cols = Math.max(1, currentCols);
  const totalRows = Math.ceil(totalCount / cols);

  // Calculate relative scroll position inside the virtual container
  const relativeScrollY = Math.max(0, scrollTop - containerTop);

  // Calculate visible row bounds with overscan buffer
  const startRow = Math.max(0, Math.floor(relativeScrollY / itemHeight) - overscan);
  const endRow = Math.min(
    totalRows,
    Math.ceil((relativeScrollY + viewportHeight) / itemHeight) + overscan
  );

  const startIndex = Math.min(totalCount, startRow * cols);
  const endIndex = Math.min(totalCount, endRow * cols);

  const topSpacerHeight = startRow * itemHeight;
  const bottomSpacerHeight = Math.max(0, (totalRows - endRow) * itemHeight);

  // Map only the active window slice into the virtual elements
  const virtualItems = items.slice(startIndex, endIndex).map((item, sliceIdx) => {
    const originalIndex = startIndex + sliceIdx;
    return {
      item,
      index: originalIndex,
      columnIndex: originalIndex % cols,
      rowIndex: Math.floor(originalIndex / cols),
    };
  });

  return {
    virtualItems,
    startIndex,
    endIndex,
    totalCount,
    topSpacerHeight,
    bottomSpacerHeight,
    containerRef,
    columns: cols,
  };
}
