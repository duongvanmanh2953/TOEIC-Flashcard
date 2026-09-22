// ============================================================================
// KIDS REWARDS & INCENTIVES DATA
// Stickers for island canvas & achievement badges for gamification
// ============================================================================

export interface KidSticker {
  id: string;
  name: string;
  icon: string;
  category?: string;
  unlocked?: boolean;
}

export interface KidBadge {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  icon?: string;
}

export const STICKERS_DATA: KidSticker[] = [
  { id: 'sticker_cat', name: 'Cat', icon: '🐱', category: 'animals', unlocked: true },
  { id: 'sticker_dog', name: 'Dog', icon: '🐶', category: 'animals', unlocked: true },
  { id: 'sticker_lion', name: 'Lion', icon: '🦁', category: 'animals', unlocked: true },
  { id: 'sticker_rabbit', name: 'Rabbit', icon: '🐰', category: 'animals', unlocked: true },
  { id: 'sticker_elephant', name: 'Elephant', icon: '🐘', category: 'animals', unlocked: true },
  { id: 'sticker_bear', name: 'Bear', icon: '🐻', category: 'animals', unlocked: true },
  { id: 'sticker_monkey', name: 'Monkey', icon: '🐵', category: 'animals', unlocked: true },
  { id: 'sticker_apple', name: 'Apple', icon: '🍎', category: 'fruits', unlocked: true },
  { id: 'sticker_banana', name: 'Banana', icon: '🍌', category: 'fruits', unlocked: true },
  { id: 'sticker_pizza', name: 'Pizza', icon: '🍕', category: 'fruits', unlocked: true },
  { id: 'sticker_car', name: 'Car', icon: '🚗', category: 'transport', unlocked: true },
  { id: 'sticker_rocket', name: 'Rocket', icon: '🚀', category: 'transport', unlocked: true },
  { id: 'sticker_sun', name: 'Sun', icon: '☀️', category: 'nature', unlocked: true },
  { id: 'sticker_star', name: 'Star', icon: '⭐', category: 'nature', unlocked: true },
  { id: 'sticker_rainbow', name: 'Rainbow', icon: '🌈', category: 'nature', unlocked: true },
  { id: 'sticker_palm_tree', name: 'Palm Tree', icon: '🌴', category: 'nature', unlocked: true },
];

export const BADGES_DATA: KidBadge[] = [
  {
    id: 'badge_first_step',
    title: 'Bước Chân Đầu Tiên',
    description: 'Hoàn thành bài học từ vựng tiếng Anh đầu tiên trên đảo.',
    unlocked: true,
  },
  {
    id: 'badge_word_explorer',
    title: 'Nhà Thám Hiểm Từ Vựng',
    description: 'Khám phá và lắng nghe trên 20 từ vựng tiếng Anh chuẩn bản xứ.',
    unlocked: true,
  },
  {
    id: 'badge_pronunciation_star',
    title: 'Ngôi Sao Phát Âm',
    description: 'Luyện nói micro đạt trên 85 điểm phát âm chuẩn xác.',
    unlocked: true,
  },
  {
    id: 'badge_super_streak',
    title: 'Chuỗi Học Chăm Chỉ',
    description: 'Học liên tục 3 ngày liên tiếp không bỏ lỡ ngày nào.',
    unlocked: false,
  },
  {
    id: 'badge_island_decorator',
    title: 'Kiến Trúc Sư Đảo Nhiệt Đới',
    description: 'Dán 5 hình dán sinh động trang trí cho hành tinh của mình.',
    unlocked: true,
  },
  {
    id: 'badge_game_champion',
    title: 'Quán Quân Mini-Game',
    description: 'Vượt qua 10 thử thách mini-game với điểm số 3 sao tối đa.',
    unlocked: false,
  },
];
