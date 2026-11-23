import { Injectable, Logger } from '@nestjs/common';
import {
  ILiveIntegrationAdapter,
  LiveCommentEvent,
  LiveConnectionResult,
  LiveConnectionStatus,
  LiveProviderType,
} from './live-adapter.interface';

@Injectable()
export class TikTokLiveAdapter implements ILiveIntegrationAdapter {
  readonly providerType: LiveProviderType = 'TIKTOK_LIVE';
  private readonly logger = new Logger(TikTokLiveAdapter.name);
  private roomStatuses = new Map<string, LiveConnectionStatus>();
  private listeners: ((event: LiveCommentEvent) => void)[] = [];

  async connect(roomCode: string, targetChannel: string, config?: { roomId?: string; sessionToken?: string }): Promise<LiveConnectionResult> {
    const code = roomCode.toUpperCase();
    let cleanUsername = (targetChannel || '').trim();

    // Support full TikTok Live URLs e.g. https://www.tiktok.com/@channel_name/live
    if (cleanUsername.includes('tiktok.com/')) {
      const match = cleanUsername.match(/@([a-zA-Z0-9_\.]+)/);
      if (match && match[1]) {
        cleanUsername = match[1];
      }
    }
    cleanUsername = cleanUsername.replace(/^@/, '').trim();

    if (!cleanUsername && !config?.roomId) {
      return {
        success: false,
        status: 'ERROR',
        message: 'Vui lòng cung cấp TikTok username (@ten_kenh), Room ID hoặc URL livestream hợp lệ.',
        provider: 'TIKTOK_LIVE',
      };
    }

    try {
      this.roomStatuses.set(code, 'CONNECTING');
      this.logger.log(`Connecting to TikTok Live channel @${cleanUsername || config?.roomId} for Room #${code}...`);

      return {
        success: true,
        status: 'CONNECTING',
        message: 'Đang chờ nguồn bình luận TikTok gửi dữ liệu.',
        provider: 'TIKTOK_LIVE',
        channelOrUsername: cleanUsername || config?.roomId,
      };
    } catch (err: any) {
      this.logger.error(`Failed to connect TikTok Live for Room #${code}: ${err?.message}`);
      this.roomStatuses.set(code, 'ERROR');
      return {
        success: false,
        status: 'ERROR',
        message: `Lỗi kết nối TikTok Live: ${err?.message}`,
        provider: 'TIKTOK_LIVE',
        channelOrUsername: cleanUsername,
      };
    }
  }

  async disconnect(roomCode: string): Promise<void> {
    const code = roomCode.toUpperCase();
    this.roomStatuses.delete(code);
    this.logger.log(`TikTok Live disconnected for Room #${code}`);
  }

  getStatus(roomCode: string): LiveConnectionStatus {
    return this.roomStatuses.get(roomCode.toUpperCase()) || 'DISCONNECTED';
  }

  onComment(callback: (event: LiveCommentEvent) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Safe comment ingestion: collects only public username, display name, text, and avatar.
   * Strips out any private personal identifiable information (PII).
   */
  ingestExternalComment(
    roomCode: string,
    rawPayload: {
      uniqueId: string;
      eventId?: string;
      timestamp?: number;
      nickname: string;
      comment: string;
      profilePictureUrl?: string;
    },
  ): void {
    const code = roomCode.toUpperCase();
    if (!this.roomStatuses.has(code)) return;
    const cleanUsername = (rawPayload.uniqueId || '').replace(/[^a-zA-Z0-9_.]/g, '');
    if (!cleanUsername) return;
    this.roomStatuses.set(code, 'CONNECTED');
    const cleanDisplayName = (rawPayload.nickname || cleanUsername).slice(0, 32);
    const cleanComment = (rawPayload.comment || '').slice(0, 100).trim();

    const timestamp = Number.isFinite(rawPayload.timestamp) ? rawPayload.timestamp! : Date.now();
    const event: LiveCommentEvent = {
      eventId: `tt_${code}_${rawPayload.eventId || `${timestamp}_${cleanUsername}`}`,
      roomCode: code,
      username: cleanUsername,
      displayName: cleanDisplayName,
      avatarUrl: rawPayload.profilePictureUrl,
      commentText: cleanComment,
      timestamp,
      provider: 'TIKTOK_LIVE',
    };

    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err: any) {
        this.logger.error(`Error delivering TikTok comment event: ${err?.message}`);
      }
    }
  }
}
