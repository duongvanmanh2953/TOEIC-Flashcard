import { useState, useEffect, useCallback, useRef } from 'react';

export interface SelectionSourceMeta {
  sourceType: string; // 'test' | 'community_post' | 'vocabulary' | 'lesson' | 'general'
  sourceId: string;
  sourceTitle?: string;
  sourceUrl?: string;
  questionId?: string;
  context?: string;
}

export interface SelectionState {
  selectedText: string;
  position: { top: number; left: number; placement: 'top' | 'bottom' } | null;
  sourceMeta: SelectionSourceMeta | null;
}

export function useTextSelection(containerRef?: React.RefObject<HTMLElement>) {
  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedText: '',
    position: null,
    sourceMeta: null,
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearSelection = useCallback(() => {
    if (window.getSelection) {
      const sel = window.getSelection();
      if (sel) sel.removeAllRanges();
    }
    setSelectionState({
      selectedText: '',
      position: null,
      sourceMeta: null,
    });
  }, []);

  const handleSelection = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setSelectionState((prev) => (prev.selectedText ? { selectedText: '', position: null, sourceMeta: null } : prev));
        return;
      }

      const text = selection.toString().trim();
      // Only trigger if at least 2 characters selected
      if (!text || text.length < 2) {
        setSelectionState((prev) => (prev.selectedText ? { selectedText: '', position: null, sourceMeta: null } : prev));
        return;
      }

      const range = selection.getRangeAt(0);
      const commonAncestor = range.commonAncestorContainer;
      const elementNode =
        commonAncestor.nodeType === Node.ELEMENT_NODE
          ? (commonAncestor as HTMLElement)
          : commonAncestor.parentElement;

      if (!elementNode) {
        setSelectionState({ selectedText: '', position: null, sourceMeta: null });
        return;
      }

      // 1. Exclude input, textarea, button, navigation, or explicitly ignored elements
      if (elementNode.closest('input, textarea, button, [contenteditable="true"], nav, [data-no-select="true"]')) {
        setSelectionState({ selectedText: '', position: null, sourceMeta: null });
        return;
      }

      // 2. Check if selected element is inside a note-selectable zone
      const selectableZone = elementNode.closest('[data-note-selectable="true"], .note-selectable') as HTMLElement | null;

      // If containerRef provided, also ensure it's inside that container
      if (containerRef?.current && !containerRef.current.contains(elementNode)) {
        setSelectionState({ selectedText: '', position: null, sourceMeta: null });
        return;
      }

      // If not marked selectable and not inside containerRef, ignore to avoid accidental toolbars
      if (!selectableZone && !containerRef?.current) {
        setSelectionState({ selectedText: '', position: null, sourceMeta: null });
        return;
      }

      // 3. Extract source metadata from data attributes
      const sourceType = selectableZone?.getAttribute('data-source-type') || 'general';
      const sourceId = selectableZone?.getAttribute('data-source-id') || window.location.pathname;
      const sourceTitle = selectableZone?.getAttribute('data-source-title') || document.title;
      const sourceUrl = selectableZone?.getAttribute('data-source-url') || window.location.href;
      const questionId = selectableZone?.getAttribute('data-question-id') || undefined;

      // Extract surrounding context (sentence or small paragraph up to 250 chars)
      let context = '';
      try {
        const parentParagraph = elementNode.closest('p, div, blockquote, li');
        if (parentParagraph) {
          const fullText = parentParagraph.textContent || '';
          context = fullText.length > 280 ? `${fullText.slice(0, 277)}...` : fullText;
        }
      } catch {
        // Fallback
      }

      // 4. Calculate floating position
      const rect = range.getBoundingClientRect();
      const toolbarHeight = 44;
      const toolbarWidth = 170;
      const margin = 8;

      let top = rect.top - toolbarHeight - margin;
      let placement: 'top' | 'bottom' = 'top';

      // Flip below if too close to viewport top
      if (top < 60) {
        top = rect.bottom + margin;
        placement = 'bottom';
      }

      // Center horizontally over the selection rect, clamped to screen margins
      let left = rect.left + rect.width / 2 - toolbarWidth / 2;
      const minLeft = 12;
      const maxLeft = window.innerWidth - toolbarWidth - 12;
      left = Math.max(minLeft, Math.min(maxLeft, left));

      setSelectionState({
        selectedText: text,
        position: {
          top: Math.round(top + window.scrollY),
          left: Math.round(left + window.scrollX),
          placement,
        },
        sourceMeta: {
          sourceType,
          sourceId,
          sourceTitle,
          sourceUrl,
          questionId,
          context,
        },
      });
    }, 90);
  }, [containerRef]);

  useEffect(() => {
    const handleMouseUp = () => handleSelection();
    const handleKeyUp = (e: KeyboardEvent) => {
      // Allow keyboard shift+arrow selection
      if (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End') {
        handleSelection();
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleSelection]);

  return {
    selectedText: selectionState.selectedText,
    position: selectionState.position,
    sourceMeta: selectionState.sourceMeta,
    clearSelection,
  };
}
