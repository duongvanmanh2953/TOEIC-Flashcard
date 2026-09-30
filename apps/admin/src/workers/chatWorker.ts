// Web Worker for off-thread chat processing, deduplication, grouping, date formatting, and virtual offsets

export interface RawChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: string; // 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  senderName: string;
  content: string;
  isInternalNote?: boolean;
  readAt?: string | null;
  createdAt: string;
  isOptimistic?: boolean;
  isFailed?: boolean;
}

export interface ProcessedChatMessage extends RawChatMessage {
  type: 'message' | 'date_separator';
  dateLabel?: string;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  formattedTime: string;
  isRead: boolean;
  estimatedHeight: number;
}

export interface WorkerInputPayload {
  action: 'PROCESS_MESSAGES' | 'APPEND_MESSAGE' | 'MARK_READ' | 'LOAD_OLDER';
  messages?: RawChatMessage[];
  message?: RawChatMessage;
  conversationId?: string;
  readRole?: string; // 'USER' | 'ADMIN'
  pageSize?: number;
  currentCount?: number;
}

export interface WorkerOutputPayload {
  action: string;
  conversationId?: string;
  totalMessages: number;
  visibleMessages: ProcessedChatMessage[];
  unreadCount: number;
  hasOlder: boolean;
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) return 'Hôm nay';
  if (isYesterday) return 'Hôm qua';

  return date.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatMessageTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function processList(rawList: RawChatMessage[]): ProcessedChatMessage[] {
  // 1. Deduplicate by ID
  const map = new Map<string, RawChatMessage>();
  for (const m of rawList) {
    if (m && m.id) {
      map.set(m.id, m);
    }
  }

  // 2. Sort chronologically
  const sorted = Array.from(map.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const processed: ProcessedChatMessage[] = [];
  let lastDateString = '';

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const prev = sorted[i - 1];
    const next = sorted[i + 1];

    const currentDateStr = new Date(current.createdAt).toDateString();

    // Insert date divider if day changed
    if (currentDateStr !== lastDateString) {
      lastDateString = currentDateStr;
      processed.push({
        id: `separator-${currentDateStr}-${i}`,
        type: 'date_separator',
        conversationId: current.conversationId,
        senderId: '',
        senderRole: 'SYSTEM',
        senderName: '',
        content: '',
        dateLabel: formatDateSeparator(current.createdAt),
        isFirstInGroup: true,
        isLastInGroup: true,
        formattedTime: '',
        isRead: true,
        estimatedHeight: 36,
        createdAt: current.createdAt,
      });
    }

    // Grouping calculations: consecutive messages from same sender within 3 minutes
    const isSameSenderAsPrev =
      prev &&
      prev.senderId === current.senderId &&
      prev.senderRole === current.senderRole &&
      !prev.isInternalNote &&
      !current.isInternalNote &&
      Math.abs(new Date(current.createdAt).getTime() - new Date(prev.createdAt).getTime()) < 3 * 60 * 1000;

    const isSameSenderAsNext =
      next &&
      next.senderId === current.senderId &&
      next.senderRole === current.senderRole &&
      !next.isInternalNote &&
      !current.isInternalNote &&
      Math.abs(new Date(next.createdAt).getTime() - new Date(current.createdAt).getTime()) < 3 * 60 * 1000;

    const isFirstInGroup = !isSameSenderAsPrev;
    const isLastInGroup = !isSameSenderAsNext;

    // Estimate height based on character length
    const lines = Math.ceil((current.content || '').length / 45) || 1;
    const estimatedHeight = Math.max(54, 38 + lines * 18 + (isFirstInGroup ? 16 : 4));

    processed.push({
      ...current,
      type: 'message',
      isFirstInGroup,
      isLastInGroup,
      formattedTime: formatMessageTime(current.createdAt),
      isRead: Boolean(current.readAt),
      estimatedHeight,
    });
  }

  return processed;
}

// In-worker cache per conversation
const conversationCache = new Map<string, RawChatMessage[]>();

self.onmessage = (event: MessageEvent<WorkerInputPayload>) => {
  const { action, messages, message, conversationId = 'default', pageSize = 25, currentCount = 25 } = event.data;

  if (action === 'PROCESS_MESSAGES' && messages) {
    conversationCache.set(conversationId, messages);
    const allProcessed = processList(messages);

    // Apply scroll loading window: take latest `currentCount` messages
    const startIdx = Math.max(0, allProcessed.length - currentCount);
    const visibleMessages = allProcessed.slice(startIdx);
    const hasOlder = startIdx > 0;

    const unreadCount = messages.filter(
      (m) => !m.readAt && (m.senderRole === 'USER' || m.senderRole === 'ADMIN')
    ).length;

    const response: WorkerOutputPayload = {
      action: 'MESSAGES_PROCESSED',
      conversationId,
      totalMessages: allProcessed.length,
      visibleMessages,
      unreadCount,
      hasOlder,
    };
    self.postMessage(response);
    return;
  }

  if (action === 'APPEND_MESSAGE' && message) {
    const existing = conversationCache.get(conversationId) || [];
    // Deduplicate & append
    const updated = existing.filter((m) => !(m.id === message.id || (m.isOptimistic && m.content === message.content)));
    updated.push(message);
    conversationCache.set(conversationId, updated);

    const allProcessed = processList(updated);
    const startIdx = Math.max(0, allProcessed.length - (currentCount + 1));
    const visibleMessages = allProcessed.slice(startIdx);

    const response: WorkerOutputPayload = {
      action: 'MESSAGE_APPENDED',
      conversationId,
      totalMessages: allProcessed.length,
      visibleMessages,
      unreadCount: 0,
      hasOlder: startIdx > 0,
    };
    self.postMessage(response);
    return;
  }

  if (action === 'LOAD_OLDER') {
    const existing = conversationCache.get(conversationId) || [];
    const allProcessed = processList(existing);

    const newCount = currentCount + pageSize;
    const startIdx = Math.max(0, allProcessed.length - newCount);
    const visibleMessages = allProcessed.slice(startIdx);
    const hasOlder = startIdx > 0;

    const response: WorkerOutputPayload = {
      action: 'OLDER_LOADED',
      conversationId,
      totalMessages: allProcessed.length,
      visibleMessages,
      unreadCount: 0,
      hasOlder,
    };
    self.postMessage(response);
    return;
  }

  if (action === 'MARK_READ') {
    const existing = conversationCache.get(conversationId) || [];
    const updated = existing.map((m) => ({ ...m, readAt: m.readAt || new Date().toISOString() }));
    conversationCache.set(conversationId, updated);
    const allProcessed = processList(updated);

    const startIdx = Math.max(0, allProcessed.length - currentCount);
    const visibleMessages = allProcessed.slice(startIdx);

    const response: WorkerOutputPayload = {
      action: 'MESSAGES_READ_UPDATED',
      conversationId,
      totalMessages: allProcessed.length,
      visibleMessages,
      unreadCount: 0,
      hasOlder: startIdx > 0,
    };
    self.postMessage(response);
  }
};
