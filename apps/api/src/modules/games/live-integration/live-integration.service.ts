import { Injectable, Logger } from '@nestjs/common';
import {
  LiveCommentEvent,
  LiveConnectionResult,
  LiveConnectionStatus,
  LiveProviderType,
} from './live-adapter.interface';
import { MockLiveAdapter } from './mock-live.adapter';
import { TikTokLiveAdapter } from './tiktok-live.adapter';

@Injectable()
export class LiveIntegrationService {
  private readonly logger = new Logger(LiveIntegrationService.name);
  private processedEventIds = new Set<string>();
  private userLastCommentTime = new Map<string, number>();
  private activeRoomProviders = new Map<string, LiveProviderType>();
  private listeners: ((event: LiveCommentEvent) => void)[] = [];

  constructor(
    private readonly mockAdapter: MockLiveAdapter,
    private readonly tiktokAdapter: TikTokLiveAdapter,
  ) {
    // Forward comments from both adapters
    this.mockAdapter.onComment((event) => this.handleIncomingComment(event));
    this.tiktokAdapter.onComment((event) => this.handleIncomingComment(event));

    // Clear event deduplication set every 2 minutes
    setInterval(() => {
      if (this.processedEventIds.size > 5000) {
        this.processedEventIds.clear();
      }
    }, 120000);
  }

  /**
   * Connect Live stream comments to a game room
   */
  async connectRoomLive(
    roomCode: string,
    provider: LiveProviderType = 'MOCK',
    channelOrUsername: string = 'demo_host',
    config?: { roomId?: string; sessionToken?: string },
  ): Promise<LiveConnectionResult> {
    const code = roomCode.toUpperCase();
    this.activeRoomProviders.set(code, provider);

    if (provider === 'MOCK') {
      return await this.mockAdapter.connect(code, channelOrUsername);
    } else {
      return await this.tiktokAdapter.connect(code, channelOrUsername, config);
    }
  }

  /**
   * Disconnect Live stream for room
   */
  async disconnectRoomLive(roomCode: string): Promise<void> {
    const code = roomCode.toUpperCase();
    const currentProvider = this.activeRoomProviders.get(code);

    if (currentProvider === 'MOCK') {
      await this.mockAdapter.disconnect(code);
    } else if (currentProvider === 'TIKTOK_LIVE') {
      await this.tiktokAdapter.disconnect(code);
    }

    this.activeRoomProviders.delete(code);
  }

  /**
   * Get current live status
   */
  getLiveStatus(roomCode: string): { status: LiveConnectionStatus; provider: LiveProviderType } {
    const code = roomCode.toUpperCase();
    const provider = this.activeRoomProviders.get(code) || 'MOCK';
    const status =
      provider === 'MOCK'
        ? this.mockAdapter.getStatus(code)
        : this.tiktokAdapter.getStatus(code);

    return { status, provider };
  }

  /**
   * Register global listener for verified live comments
   */
  onLiveComment(callback: (event: LiveCommentEvent) => void): void {
    this.listeners.push(callback);
  }

  ingestExternalComment(roomCode: string, payload: any): void {
    this.tiktokAdapter.ingestExternalComment(roomCode, payload);
  }

  /**
   * Simulate a single mock comment for host testing
   */
  sendMockComment(roomCode: string, partial: Partial<LiveCommentEvent>): LiveCommentEvent {
    return this.mockAdapter.sendMockComment(roomCode, partial);
  }

  /**
   * Simulate a burst of audience comments
   */
  simulateAudienceBatch(roomCode: string, count: number = 8): LiveCommentEvent[] {
    return this.mockAdapter.simulateAudienceBatch(roomCode, count);
  }

  /**
   * Centralized deduplication, rate-limiting & option parsing
   */
  private handleIncomingComment(event: LiveCommentEvent): void {
    // 1. Idempotency check: discard already-processed event
    if (this.processedEventIds.has(event.eventId)) {
      return;
    }
    this.processedEventIds.add(event.eventId);

    // 2. Anti-spam Rate Limiting per user: max 1 comment per 350ms
    const now = Date.now();
    const lastTime = this.userLastCommentTime.get(event.username) || 0;
    if (now - lastTime < 350) {
      this.logger.debug(`[Anti-Spam] Suppressed burst comment from @${event.username}`);
      return;
    }
    this.userLastCommentTime.set(event.username, now);

    // 3. Option detection helper (A, B, C, D)
    const upperText = (event.commentText || '').toUpperCase().trim();
    const optionMatch = upperText.match(/^[ABCD]$/) || upperText.match(/^([ABCD])[\.\:\)\s]/) || upperText.match(/(?:ĐÁP ÁN|CHỌN|CÂU)\s*([ABCD])/);
    if (optionMatch) {
      event.parsedOption = optionMatch[1] || optionMatch[0];
    } else {
      const numMatch = upperText.match(/^[1234]$/);
      if (numMatch) {
        const letters = ['A', 'B', 'C', 'D'];
        event.parsedOption = letters[parseInt(numMatch[0], 10) - 1];
      }
    }

    // 4. Dispatch to verified listeners (Gateway / Room Manager)
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err: any) {
        this.logger.error(`Error in LiveIntegration listener: ${err?.message}`);
      }
    }
  }
}
