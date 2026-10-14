/**
 * SUNNY MEADOW V2.0 - REACTIVE STATE STORE
 * Manages Star Drops, Stickers collection, 5 Ecological Games progress & Eye-Care settings
 */

export interface GameProgressRecord {
  completedRounds: number;
  highScore: number;
  lastPlayed: number;
}

export interface StickerItem {
  id: string;
  nameEn: string;
  nameVi: string;
  svgSymbol: string;
  unlocked: boolean;
  category: 'animals' | 'fruits' | 'nature' | 'magic';
}

export interface MeadowState {
  totalStars: number;
  streakDays: number;
  eyeCareActive: boolean;
  stickers: string[]; // Unlocked sticker IDs
  games: {
    hungryPicnic: GameProgressRecord;
    colorPond: GameProgressRecord;
    fireflyLanterns: GameProgressRecord;
    voiceWindmill: GameProgressRecord;
    hideAndSeek: GameProgressRecord;
  };
}

const STORAGE_KEY = 'sunny_meadow_v2_state';

export const INITIAL_STICKERS: StickerItem[] = [
  { id: 'sunny-fox', nameEn: 'Sunny Fox', nameVi: 'Cáo Sunny Tinh Nghịch', svgSymbol: '#svg-sunny-fox', unlocked: true, category: 'animals' },
  { id: 'chubby-bunny', nameEn: 'Chubby Bunny', nameVi: 'Thỏ Mũm Mĩm', svgSymbol: '#svg-chubby-bunny', unlocked: true, category: 'animals' },
  { id: 'color-frog', nameEn: 'Lily Frog', nameVi: 'Ếch Cốm Hồ Sen', svgSymbol: '#svg-color-frog', unlocked: false, category: 'nature' },
  { id: 'glow-firefly', nameEn: 'Glow Firefly', nameVi: 'Đom Đóm Phát Sáng', svgSymbol: '#svg-glow-firefly', unlocked: false, category: 'magic' },
  { id: 'magic-lantern', nameEn: 'Magic Lantern', nameVi: 'Lồng Đèn Hoa Sen', svgSymbol: '#svg-magic-lantern', unlocked: false, category: 'magic' },
  { id: 'windmill', nameEn: 'Magic Windmill', nameVi: 'Cối Xay Gió Gỗ', svgSymbol: '#svg-windmill', unlocked: false, category: 'nature' },
  { id: 'red-mushroom', nameEn: 'Red Mushroom', nameVi: 'Nấm Đỏ Thần Tiên', svgSymbol: '#svg-red-mushroom', unlocked: false, category: 'nature' },
  { id: 'strawberry', nameEn: 'Sweet Strawberry', nameVi: 'Dâu Tây Mọng Nước', svgSymbol: '#svg-item-strawberry', unlocked: true, category: 'fruits' },
  { id: 'carrot', nameEn: 'Crunchy Carrot', nameVi: 'Cà Rốt Giòn Tan', svgSymbol: '#svg-item-carrot', unlocked: false, category: 'fruits' },
  { id: 'apple', nameEn: 'Red Apple', nameVi: 'Táo Đỏ Ngọt Lành', svgSymbol: '#svg-item-apple', unlocked: false, category: 'fruits' },
  { id: 'banana', nameEn: 'Yellow Banana', nameVi: 'Chuối Vàng Thơm Ngon', svgSymbol: '#svg-item-banana', unlocked: false, category: 'fruits' },
  { id: 'star-badge', nameEn: 'Smiling Star', nameVi: 'Ngôi Sao Nụ Cười', svgSymbol: '#svg-star-badge', unlocked: false, category: 'magic' },
];

class MeadowStateStore {
  private state: MeadowState;
  private listeners: Set<(state: MeadowState) => void> = new Set();

  constructor() {
    this.state = this.loadState();
    // Sync initial eye care class to body
    if (typeof document !== 'undefined' && this.state.eyeCareActive) {
      document.body.classList.add('eye-care-active');
    }
  }

  private loadState(): MeadowState {
    if (typeof window === 'undefined') {
      return this.getDefaultState();
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...this.getDefaultState(),
          ...parsed,
          games: {
            ...this.getDefaultState().games,
            ...(parsed.games || {})
          }
        };
      }
    } catch {
      // ignore
    }
    return this.getDefaultState();
  }

  private getDefaultState(): MeadowState {
    return {
      totalStars: 45,
      streakDays: 3,
      eyeCareActive: false,
      stickers: ['sunny-fox', 'chubby-bunny', 'strawberry'],
      games: {
        hungryPicnic: { completedRounds: 2, highScore: 20, lastPlayed: Date.now() },
        colorPond: { completedRounds: 1, highScore: 15, lastPlayed: Date.now() },
        fireflyLanterns: { completedRounds: 1, highScore: 15, lastPlayed: Date.now() },
        voiceWindmill: { completedRounds: 1, highScore: 20, lastPlayed: Date.now() },
        hideAndSeek: { completedRounds: 1, highScore: 15, lastPlayed: Date.now() },
      },
    };
  }

  private save(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // ignore
    }
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn(this.state));
  }

  public getState(): MeadowState {
    return this.state;
  }

  public subscribe(fn: (state: MeadowState) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public addStars(count: number): void {
    this.state.totalStars += count;
    this.save();
  }

  public unlockSticker(stickerId: string): boolean {
    if (!this.state.stickers.includes(stickerId)) {
      this.state.stickers.push(stickerId);
      this.state.totalStars += 5; // bonus star for new sticker!
      this.save();
      return true;
    }
    return false;
  }

  public recordGameRound(
    gameKey: keyof MeadowState['games'],
    earnedStars: number
  ): void {
    const cur = this.state.games[gameKey] || { completedRounds: 0, highScore: 0, lastPlayed: 0 };
    cur.completedRounds += 1;
    cur.highScore = Math.max(cur.highScore, earnedStars);
    cur.lastPlayed = Date.now();
    this.state.games[gameKey] = cur;
    this.state.totalStars += earnedStars;
    this.save();
  }

  public toggleEyeCare(): boolean {
    this.state.eyeCareActive = !this.state.eyeCareActive;
    if (typeof document !== 'undefined') {
      if (this.state.eyeCareActive) {
        document.body.classList.add('eye-care-active');
      } else {
        document.body.classList.remove('eye-care-active');
      }
    }
    this.save();
    return this.state.eyeCareActive;
  }
}

export const meadowStore = new MeadowStateStore();
export default meadowStore;
