import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { Check, CheckCheck, ChevronDown, Lock, RotateCw, Sparkles } from 'lucide-react';
import type { RawChatMessage, ProcessedChatMessage, WorkerOutputPayload } from '../../workers/chatWorker';

interface VirtualChatPaneProps {
  conversationId: string;
  rawMessages: RawChatMessage[];
  currentUserId?: string;
  currentUserRole?: string; // 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  isLoading?: boolean;
  emptyPlaceholder?: string;
  onMarkRead?: () => void;
  className?: string;
  isCompact?: boolean; // Compact mode for CSKH user popup
}

export const VirtualChatPane: React.FC<VirtualChatPaneProps> = ({
  conversationId,
  rawMessages,
  currentUserId,
  currentUserRole = 'USER',
  isLoading = false,
  emptyPlaceholder = 'Chưa có tin nhắn trong hội thoại.',
  onMarkRead,
  className = '',
  isCompact = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);

  const [processedMessages, setProcessedMessages] = useState<ProcessedChatMessage[]>([]);
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [currentDisplayCount, setCurrentDisplayCount] = useState(30);

  // New message detection & floating banner
  const [hasNewMessagesBelow, setHasNewMessagesBelow] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const isNearBottomRef = useRef(true);
  const prevMsgCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);

  // Scroll anchoring ref for reverse infinite loading
  const scrollSnapshotRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);

  // Initialize Web Worker once
  useEffect(() => {
    try {
      const worker = new Worker(new URL('../../workers/chatWorker.ts', import.meta.url), {
        type: 'module',
      });
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent<WorkerOutputPayload>) => {
        const { action, visibleMessages, hasOlder: workerHasOlder } = e.data;
        if (action === 'MESSAGES_PROCESSED' || action === 'OLDER_LOADED' || action === 'MESSAGES_READ_UPDATED') {
          setProcessedMessages(visibleMessages);
          setHasOlder(workerHasOlder);
          setLoadingOlder(false);

          // Restore scroll position after loading older messages
          if (action === 'OLDER_LOADED' && scrollSnapshotRef.current && containerRef.current) {
            const { scrollHeight: prevHeight, scrollTop: prevTop } = scrollSnapshotRef.current;
            const newHeight = containerRef.current.scrollHeight;
            containerRef.current.scrollTop = newHeight - prevHeight + prevTop;
            scrollSnapshotRef.current = null;
          }
        }
      };

      return () => {
        worker.terminate();
        workerRef.current = null;
      };
    } catch (err) {
      console.error('Failed to initialize chat Web Worker:', err);
    }
  }, []);

  // Send raw messages to worker whenever they change
  useEffect(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        action: 'PROCESS_MESSAGES',
        messages: rawMessages,
        conversationId,
        currentCount: currentDisplayCount,
      });
    }
  }, [rawMessages, conversationId, currentDisplayCount]);

  // Handle scroll position, near-bottom detection & scroll loading trigger
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isAtBottom = distanceFromBottom <= 70;
    isNearBottomRef.current = isAtBottom;

    if (isAtBottom) {
      setHasNewMessagesBelow(false);
      setNewMessagesCount(0);
      if (onMarkRead) onMarkRead();
    }

    // Reverse infinite scroll: load older messages when user scrolls near top
    if (el.scrollTop < 40 && hasOlder && !loadingOlder) {
      setLoadingOlder(true);
      scrollSnapshotRef.current = {
        scrollHeight: el.scrollHeight,
        scrollTop: el.scrollTop,
      };
      setCurrentDisplayCount((prev) => prev + 25);
      if (workerRef.current) {
        workerRef.current.postMessage({
          action: 'LOAD_OLDER',
          conversationId,
          currentCount: currentDisplayCount,
          pageSize: 25,
        });
      }
    }
  }, [hasOlder, loadingOlder, currentDisplayCount, conversationId, onMarkRead]);

  // Handle new message arrival: auto-scroll or show floating pill
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || processedMessages.length === 0) return;

    // First load of this conversation: instant scroll to bottom
    if (isInitialLoadRef.current) {
      el.scrollTop = el.scrollHeight;
      isInitialLoadRef.current = false;
      prevMsgCountRef.current = processedMessages.length;
      return;
    }

    // New messages arrived
    if (processedMessages.length > prevMsgCountRef.current) {
      const added = processedMessages.length - prevMsgCountRef.current;
      prevMsgCountRef.current = processedMessages.length;

      if (isNearBottomRef.current) {
        // User is at bottom -> auto scroll to show latest message
        requestAnimationFrame(() => {
          el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        });
        setHasNewMessagesBelow(false);
        setNewMessagesCount(0);
        if (onMarkRead) onMarkRead();
      } else {
        // User is scrolled up -> show notification pill
        setHasNewMessagesBelow(true);
        setNewMessagesCount((prev) => prev + added);
      }
    }
  }, [processedMessages, onMarkRead]);

  // Reset initial load flag when switching conversations
  useEffect(() => {
    isInitialLoadRef.current = true;
    prevMsgCountRef.current = 0;
    setHasNewMessagesBelow(false);
    setNewMessagesCount(0);
    setCurrentDisplayCount(30);
  }, [conversationId]);

  // Smooth scroll to bottom on demand
  const scrollToBottom = () => {
    const el = containerRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      setHasNewMessagesBelow(false);
      setNewMessagesCount(0);
      if (onMarkRead) onMarkRead();
    }
  };

  // Virtual Windowing slice calculation
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(400);

  const onContainerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
    handleScroll();
  };

  useEffect(() => {
    if (containerRef.current) {
      setViewportHeight(containerRef.current.clientHeight || 400);
    }
  }, []);

  // Compute virtual window with upper & lower spacers
  const itemHeight = isCompact ? 56 : 64;
  const totalItems = processedMessages.length;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 6);
  const visibleCount = Math.ceil(viewportHeight / itemHeight) + 12;
  const endIndex = Math.min(totalItems, startIndex + visibleCount);

  const topSpacerHeight = startIndex * itemHeight;
  const bottomSpacerHeight = Math.max(0, (totalItems - endIndex) * itemHeight);
  const renderedItems = processedMessages.slice(startIndex, endIndex);

  return (
    <div className={`relative flex flex-col h-full w-full min-h-0 overflow-hidden ${className}`}>
      {/* Scrollable Container with overflow-y: auto */}
      <div
        ref={containerRef}
        onScroll={onContainerScroll}
        className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden p-2.5 sm:p-3 space-y-1.5 select-text relative chat-scrollbar"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Scroll Loading Indicator for Older Messages */}
        {loadingOlder && (
          <div className="py-2 flex items-center justify-center gap-2 text-[11px] text-indigo-400 font-semibold animate-pulse">
            <RotateCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>Đang tải tin nhắn cũ...</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && processedMessages.length === 0 && (
          <div className="py-12 px-4 text-center my-auto space-y-2">
            <p className="text-xs text-slate-400">{emptyPlaceholder}</p>
          </div>
        )}

        {/* Top Virtual Spacer */}
        {topSpacerHeight > 0 && <div style={{ height: `${topSpacerHeight}px` }} aria-hidden="true" />}

        {/* Rendered Virtual Items */}
        {renderedItems.map((item) => {
          if (item.type === 'date_separator') {
            return (
              <div key={item.id} className="flex items-center justify-center my-2 select-none">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-400 text-[10px] font-bold border border-slate-700/60 shadow-xs">
                  {item.dateLabel}
                </span>
              </div>
            );
          }

          const isInternal = item.isInternalNote;
          const isSenderSelf =
            item.senderId === currentUserId ||
            (currentUserRole === 'USER' && item.senderRole === 'USER') ||
            ((currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN') &&
              (item.senderRole === 'ADMIN' || item.senderRole === 'SUPER_ADMIN'));

          if (isInternal) {
            return (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs my-1 shadow-xs"
              >
                <div className="flex items-center gap-1.5 font-black uppercase text-[9px] text-amber-400 mb-0.5">
                  <Lock className="w-3 h-3 shrink-0" />
                  <span>Ghi chú nội bộ • {item.senderName}</span>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap">{item.content}</p>
              </div>
            );
          }

          return (
            <div
              key={item.id}
              className={`flex flex-col ${isSenderSelf ? 'items-end' : 'items-start'} transition-opacity duration-150`}
            >
              {/* Sender Name header only on first item of consecutive group */}
              {item.isFirstInGroup && !isSenderSelf && (
                <span className="text-[10px] font-bold text-slate-400 mb-0.5 px-1">
                  {item.senderName}
                </span>
              )}

              {/* Message Bubble */}
              <div
                className={`p-2 sm:p-2.5 rounded-2xl leading-relaxed max-w-[85%] sm:max-w-[75%] break-words whitespace-pre-wrap shadow-xs text-xs ${
                  isSenderSelf
                    ? 'bg-indigo-600 text-white rounded-tr-xs'
                    : 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-tl-xs'
                }`}
              >
                {item.content}
              </div>

              {/* Read Receipt & Timestamp row */}
              <div
                className={`flex items-center gap-1 mt-0.5 px-1 text-[9px] text-slate-400 ${
                  isSenderSelf ? 'justify-end' : 'justify-start'
                }`}
              >
                <span>{item.formattedTime}</span>

                {/* Sender self read status receipts */}
                {isSenderSelf && (
                  <span className="flex items-center gap-0.5 ml-0.5" title={item.isRead ? 'Đã xem' : 'Đã gửi'}>
                    {item.isOptimistic ? (
                      <span className="text-indigo-400 animate-pulse font-semibold">• Đang gửi...</span>
                    ) : item.isFailed ? (
                      <span className="text-rose-400 font-semibold">• Thất bại</span>
                    ) : item.isRead ? (
                      <span className="flex items-center text-cyan-400 font-bold" title="Đã xem">
                        <CheckCheck className="w-3 h-3 text-cyan-400 inline" />
                        <span className="hidden sm:inline ml-0.5 text-[8.5px]">Đã xem</span>
                      </span>
                    ) : (
                      <span className="flex items-center text-slate-400" title="Đã gửi">
                        <Check className="w-3 h-3 text-slate-400 inline" />
                        <span className="hidden sm:inline ml-0.5 text-[8.5px]">Đã gửi</span>
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Bottom Virtual Spacer */}
        {bottomSpacerHeight > 0 && <div style={{ height: `${bottomSpacerHeight}px` }} aria-hidden="true" />}
      </div>

      {/* Floating "Có tin nhắn mới bên dưới" Pill */}
      {hasNewMessagesBelow && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none z-30 animate-bounce">
          <button
            type="button"
            onClick={scrollToBottom}
            className="pointer-events-auto px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-xl text-xs font-bold flex items-center gap-2 border border-indigo-400/40 transition active:scale-95 cursor-pointer"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span>Có tin nhắn mới bên dưới</span>
            {newMessagesCount > 1 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-900 text-white text-[9px] font-black">
                {newMessagesCount}
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
};
