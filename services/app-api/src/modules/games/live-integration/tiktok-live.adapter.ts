import { Injectable, Logger } from '@nestjs/common';
import {
  ILiveIntegrationAdapter,
  LiveCommentEvent,
  LiveConnectionResult,
  LiveConnectionStatus,
  LiveProviderType,
} from './live-adapter.interface';

interface TikTokCommentPayload {
  uniqueId: string;
  eventId?: string;
  timestamp?: number;
  nickname: string;
  comment: string;
  profilePictureUrl?: string;
}

@Injectable()
export class TikTokLiveAdapter implements ILiveIntegrationAdapter {
  readonly providerType: LiveProviderType = 'TIKTOK_LIVE';
  private readonly logger = new Logger(TikTokLiveAdapter.name);
  private roomStatuses = new Map<string, LiveConnectionStatus>();
  private listeners: ((event: LiveCommentEvent) => void)[] = [];
  private activeConnections = new Map<string, any>();

  async connect(
    roomCode: string,
    targetChannel: string,
    config?: { roomId?: string; sessionToken?: string },
  ): Promise<LiveConnectionResult> {
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

    const channelDisplay = cleanUsername ? `@${cleanUsername}` : config?.roomId ? `ID:${config.roomId}` : 'TikTok Live';

    // Disconnect previous connection if any
    await this.disconnect(code);

    try {
      this.roomStatuses.set(code, 'CONNECTING');
      this.logger.log(`Connecting to TikTok Live ${channelDisplay} for Room #${code}...`);

      const { TikTokLiveConnection } = await import('tiktok-live-connector');
      const conn: any = new TikTokLiveConnection(cleanUsername || config?.roomId || '', {
        processInitialData: false,
        enableExtendedGiftInfo: false,
        sessionId: config?.sessionToken || undefined,
      } as any);

      conn.on('chat', (data: any) => {
        try {
          this.logger.debug(`[TikTokLive] Chat from @${data.uniqueId}: ${data.comment}`);
          this.emitComment(code, {
            uniqueId: data.uniqueId || '',
            nickname: data.nickname || data.uniqueId || 'Khán giả',
            comment: data.comment || '',
            profilePictureUrl: data.profilePictureUrl || data.userDetails?.profilePictureUrls?.[0],
            timestamp: data.createTime ? Number(data.createTime) : Date.now(),
            eventId: data.msgId ? String(data.msgId) : undefined,
          }, true);
        } catch (e: any) {
          this.logger.error(`Error processing TikTok chat event: ${e?.message}`);
        }
      });

      conn.on('disconnected', () => {
        this.logger.warn(`TikTok Live disconnected for Room #${code} (${channelDisplay})`);
        this.roomStatuses.set(code, 'DISCONNECTED');
        this.activeConnections.delete(code);
      });

      conn.on('error', (err: any) => {
        this.logger.error(`TikTok Live error for Room #${code}: ${err?.message}`);
      });

      this.activeConnections.set(code, conn);

      // Attempt live connection
      try {
        const state = await conn.connect();
        this.roomStatuses.set(code, 'CONNECTED');
        this.logger.log(`TikTok Live connected successfully for Room #${code} (${channelDisplay}), room_id: ${state?.roomId || 'ok'}`);

        return {
          success: true,
          status: 'CONNECTED',
          message: `Đã kết nối trực tiếp với luồng livestream ${channelDisplay}! Hệ thống đang tự động cào bình luận thời gian thực.`,
          provider: 'TIKTOK_LIVE',
          channelOrUsername: channelDisplay,
        };
      } catch (connErr: any) {
        this.logger.warn(`TikTok Live connection failed for #${code}: ${connErr?.message || 'unknown error'}`);
        this.roomStatuses.set(code, 'ERROR');
        this.activeConnections.delete(code);
        return {
          success: false,
          status: 'ERROR',
          message: `Không thể kết nối TikTok Live ${channelDisplay}: ${connErr?.message || 'hãy kiểm tra username và trạng thái livestream.'}`,
          provider: 'TIKTOK_LIVE',
          channelOrUsername: channelDisplay,
        };
      }
    } catch (err: any) {
      this.logger.error(`Failed to initialize TikTok Live for Room #${code}: ${err?.message}`);
      this.roomStatuses.set(code, 'ERROR');
      this.activeConnections.delete(code);
      return {
        success: false,
        status: 'ERROR',
        message: `Không khởi tạo được kết nối TikTok Live ${channelDisplay}. Kiểm tra kết nối máy chủ và thử lại.`,
        provider: 'TIKTOK_LIVE',
        channelOrUsername: cleanUsername,
      };
    }
  }

  async disconnect(roomCode: string): Promise<void> {
    const code = roomCode.toUpperCase();
    const conn = this.activeConnections.get(code);
    if (conn) {
      try {
        conn.disconnect();
      } catch (_) {}
      this.activeConnections.delete(code);
    }
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
  ingestExternalComment(roomCode: string, payload: TikTokCommentPayload): void {
    this.emitComment(roomCode, payload, false);
  }

  private emitComment(roomCode: string, rawPayload: TikTokCommentPayload, verifiedTikTok: boolean): void {
    const code = roomCode.toUpperCase();
    if (!this.roomStatuses.has(code)) {
      this.roomStatuses.set(code, 'CONNECTED');
    }
    const cleanUsername = (rawPayload.uniqueId || '').replace(/[^a-zA-Z0-9_.]/g, '');
    if (!cleanUsername) return;
    const cleanDisplayName = (rawPayload.nickname || cleanUsername).slice(0, 32);
    const cleanComment = (rawPayload.comment || '').slice(0, 100).trim();

    // Timestamp normalization (handle seconds vs milliseconds)
    let timestamp = Number.isFinite(rawPayload.timestamp) ? rawPayload.timestamp! : Date.now();
    if (timestamp < 10000000000) {
      // Unix timestamp in seconds -> convert to ms
      timestamp = timestamp * 1000;
    }

    const event: LiveCommentEvent = {
      eventId: `tt_${verifiedTikTok ? 'native' : 'external'}_${code}_${rawPayload.eventId || `${Date.now()}_${cleanUsername}`}`,
      roomCode: code,
      username: cleanUsername,
      displayName: cleanDisplayName,
      avatarUrl: rawPayload.profilePictureUrl,
      commentText: cleanComment,
      timestamp,
      provider: 'TIKTOK_LIVE',
      verifiedTikTok,
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
