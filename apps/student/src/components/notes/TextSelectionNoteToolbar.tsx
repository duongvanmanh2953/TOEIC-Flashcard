import React, { useState } from 'react';
import { StickyNote, Plus, Sparkles, Check, ExternalLink } from 'lucide-react';
import { useTextSelection, SelectionSourceMeta } from '../../hooks/useTextSelection';
import { QuickNoteModal } from './QuickNoteModal';

interface TextSelectionNoteToolbarProps {
  containerRef?: React.RefObject<HTMLElement>;
}

export const TextSelectionNoteToolbar: React.FC<TextSelectionNoteToolbarProps> = ({ containerRef }) => {
  const { selectedText, position, sourceMeta, clearSelection } = useTextSelection(containerRef);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeDraft, setActiveDraft] = useState<{
    title: string;
    content: string;
    selectedText: string;
    sourceType?: string;
    sourceId?: string;
    sourceTitle?: string;
    sourceUrl?: string;
    questionId?: string;
    context?: string;
  } | null>(null);

  if (!selectedText || !position) return null;

  const handleOpenNoteModal = () => {
    // Generate clean pre-filled title
    const cleanSnippet = selectedText.replace(/[\n\r]+/g, ' ').trim();
    const title = cleanSnippet.length > 40 ? `${cleanSnippet.slice(0, 38)}...` : cleanSnippet;

    setActiveDraft({
      title,
      content: selectedText,
      selectedText,
      sourceType: sourceMeta?.sourceType,
      sourceId: sourceMeta?.sourceId,
      sourceTitle: sourceMeta?.sourceTitle,
      sourceUrl: sourceMeta?.sourceUrl,
      questionId: sourceMeta?.questionId,
      context: sourceMeta?.context,
    });

    setModalOpen(true);
    clearSelection();
  };

  return (
    <>
      {/* Floating Action Button near text selection */}
      <div
        className="fixed z-50 pointer-events-auto transform -translate-x-1/2 transition-opacity duration-150 animate-fade-in"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <button
          onClick={handleOpenNoteModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/95 dark:bg-slate-800/95 text-white text-xs font-bold rounded-xl shadow-lg border border-indigo-500/40 hover:bg-indigo-600 hover:border-indigo-400 hover:scale-105 active:scale-95 transition-all duration-150 backdrop-blur-md cursor-pointer select-none"
          title="Thêm đoạn trích này vào ghi chú cá nhân"
          aria-label="Thêm vào ghi chú"
        >
          <StickyNote className="w-3.5 h-3.5 text-cyan-400" />
          <span>Thêm vào ghi chú</span>
        </button>
      </div>

      {/* Mini Note Composer Modal with Pre-filled Draft */}
      {modalOpen && activeDraft && (
        <QuickNoteModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setActiveDraft(null);
          }}
          initialDraft={activeDraft}
        />
      )}
    </>
  );
};

export interface NoteSelectableContentProps extends React.HTMLAttributes<HTMLDivElement> {
  sourceType: 'test' | 'community_post' | 'vocabulary' | 'lesson' | 'general';
  sourceId: string;
  sourceTitle?: string;
  sourceUrl?: string;
  questionId?: string;
  children: React.ReactNode;
}

export const NoteSelectableContent: React.FC<NoteSelectableContentProps> = ({
  sourceType,
  sourceId,
  sourceTitle,
  sourceUrl,
  questionId,
  children,
  className = '',
  ...rest
}) => {
  return (
    <div
      data-note-selectable="true"
      data-source-type={sourceType}
      data-source-id={sourceId}
      data-source-title={sourceTitle}
      data-source-url={sourceUrl}
      data-question-id={questionId}
      className={`note-selectable select-text ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};
