export type LiveProviderType = 'MOCK' | 'TIKTOK_LIVE';

export type LiveConnectionStatus =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'MOCK_ACTIVE'
  | 'ERROR';

export interface LiveCommentEvent {
  eventId: string;
  roomCode: string;
  username: string; // e.g. @linh_tokyo, @hoang_toeic
  displayName: string;
  avatarUrl?: string;
  commentText: string;
  timestamp: number;
  provider: LiveProviderType;
  verifiedTikTok?: boolean;
  parsedOption?: string; // 'A' | 'B' | 'C' | 'D' if detected
}

export interface LiveConnectionResult {
  success: boolean;
  status: LiveConnectionStatus;
  message: string;
  provider: LiveProviderType;
  channelOrUsername?: string;
}

export interface ILiveIntegrationAdapter {
  readonly providerType: LiveProviderType;

  /**
   * Connect to the live stream comments source
   */
  connect(roomCode: string, targetChannel: string): Promise<LiveConnectionResult>;

  /**
   * Disconnect from the stream
   */
  disconnect(roomCode: string): Promise<void>;

  /**
   * Get current connection status for room
   */
  getStatus(roomCode: string): LiveConnectionStatus;

  /**
   * Subscribe to incoming parsed comment events
   */
  onComment(callback: (event: LiveCommentEvent) => void): void;

  /**
   * Simulate a single comment (for testing / development)
   */
  sendMockComment?(roomCode: string, comment: Partial<LiveCommentEvent>): LiveCommentEvent;

  /**
   * Simulate a burst of audience comments
   */
  simulateAudienceBatch?(roomCode: string, count?: number): LiveCommentEvent[];
}
