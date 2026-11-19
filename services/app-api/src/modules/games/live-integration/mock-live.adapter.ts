import { Injectable, Logger } from '@nestjs/common';
import {
  ILiveIntegrationAdapter,
  LiveCommentEvent,
  LiveConnectionResult,
  LiveConnectionStatus,
  LiveProviderType,
} from './live-adapter.interface';

const MOCK_AUDIENCE = [
  { username: 'linh_tokyo', displayName: 'Linh Tokyo 🌸', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=linh' },
  { username: 'hoang_toeic900', displayName: 'Hoàng 990 TOEIC 🎯', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=hoang' },
  { username: 'minh_japanese', displayName: 'Minh N2 San 🗾', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=minh' },
  { username: 'mai_kpop', displayName: 'Mai Mai Kimchi 🇰🇷', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=mai' },
  { username: 'tuan_polyglot', displayName: 'Tuấn Đa Ngôn Ngữ 🌐', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=tuan' },
  { username: 'phuong_hsk5', displayName: 'Phương HSK5 🇨🇳', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=phuong' },
  { username: 'duc_vocab', displayName: 'Đức Phản Xạ Nhanh ⚡', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=duc' },
  { username: 'lan_bangkok', displayName: 'Lan Thái Lan 🇹🇭', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=lan' },
  { username: 'nam_ielts8', displayName: 'Nam IELTS 8.0 🚀', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=nam' },
  { username: 'hang_cute', displayName: 'Hằng Chăm Học 📚', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=hang' },
  { username: 'quang_saigon', displayName: 'Quang Sài Gòn ☕', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=quang' },
  { username: 'thao_japan', displayName: 'Thảo Du Học Nhật ⛩️', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=thao' },
];

@Injectable()
export class MockLiveAdapter implements ILiveIntegrationAdapter {
  readonly providerType: LiveProviderType = 'MOCK';
  private readonly logger = new Logger(MockLiveAdapter.name);
  private roomStatuses = new Map<string, LiveConnectionStatus>();
  private listeners: ((event: LiveCommentEvent) => void)[] = [];
  private autoSimIntervals = new Map<string, NodeJS.Timeout>();

  async connect(roomCode: string, targetChannel: string): Promise<LiveConnectionResult> {
    const code = roomCode.toUpperCase();
    this.roomStatuses.set(code, 'MOCK_ACTIVE');
    this.logger.log(`Mock Live Provider activated for Room #${code} (Channel: ${targetChannel || 'demo_stream'})`);

    return {
      success: true,
      status: 'MOCK_ACTIVE',
      message: `Đã kết nối Mock Live Provider cho kênh @${targetChannel || 'demo_stream'}. Dữ liệu mô phỏng phục vụ kiểm thử hệ thống.`,
      provider: 'MOCK',
      channelOrUsername: targetChannel || 'demo_stream',
    };
  }

  async disconnect(roomCode: string): Promise<void> {
    const code = roomCode.toUpperCase();
    this.roomStatuses.delete(code);
    if (this.autoSimIntervals.has(code)) {
      clearInterval(this.autoSimIntervals.get(code)!);
      this.autoSimIntervals.delete(code);
    }
    this.logger.log(`Mock Live Provider disconnected for Room #${code}`);
  }

  getStatus(roomCode: string): LiveConnectionStatus {
    return this.roomStatuses.get(roomCode.toUpperCase()) || 'DISCONNECTED';
  }

  onComment(callback: (event: LiveCommentEvent) => void): void {
    this.listeners.push(callback);
  }

  private emitComment(event: LiveCommentEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err: any) {
        this.logger.error(`Error in comment listener: ${err?.message}`);
      }
    }
  }

  sendMockComment(roomCode: string, partial: Partial<LiveCommentEvent>): LiveCommentEvent {
    const code = roomCode.toUpperCase();
    const persona = MOCK_AUDIENCE[Math.floor(Math.random() * MOCK_AUDIENCE.length)];
    const options = ['A', 'B', 'C', 'D'];
    const text = partial.commentText || options[Math.floor(Math.random() * options.length)];

    const event: LiveCommentEvent = {
      eventId: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      roomCode: code,
      username: partial.username || persona.username,
      displayName: partial.displayName || persona.displayName,
      avatarUrl: partial.avatarUrl || persona.avatar,
      commentText: text,
      timestamp: Date.now(),
      provider: 'MOCK',
    };

    this.emitComment(event);
    return event;
  }

  simulateAudienceBatch(roomCode: string, count: number = 8): LiveCommentEvent[] {
    const code = roomCode.toUpperCase();
    const shuffledPersonas = [...MOCK_AUDIENCE].sort(() => 0.5 - Math.random());
    const actualCount = Math.min(count, shuffledPersonas.length);
    const options = ['A', 'B', 'C', 'D'];
    const generated: LiveCommentEvent[] = [];

    for (let i = 0; i < actualCount; i++) {
      const persona = shuffledPersonas[i];
      // Weighted towards A, B, C, D with slight bias to A/B
      const chosenOption = options[Math.floor(Math.random() * options.length)];
      // Add small staggered delay to simulate viewers typing at different speeds
      setTimeout(() => {
        const event: LiveCommentEvent = {
          eventId: `mock_batch_${Date.now()}_${persona.username}`,
          roomCode: code,
          username: persona.username,
          displayName: persona.displayName,
          avatarUrl: persona.avatar,
          commentText: chosenOption,
          timestamp: Date.now(),
          provider: 'MOCK',
        };
        this.emitComment(event);
      }, i * 350);
    }

    return generated;
  }
}
