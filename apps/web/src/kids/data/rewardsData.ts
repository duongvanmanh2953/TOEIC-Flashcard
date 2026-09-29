// ============================================================================
// KIDS REWARDS & INCENTIVES DATA
// Stickers for island canvas & achievement badges for gamification
// ============================================================================

export interface KidSticker {
  id: string;
  name: string;
  icon: string;
  image?: string;
  category?: string;
  unlocked?: boolean;
}

export interface KidBadge {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  image?: string;
  icon?: string;
}

export const STICKERS_DATA: KidSticker[] = [
  // Vivi sticker pack
  { id: 'sticker_great_job', name: 'Great Job!', icon: '🌟', image: '/kid/stickers/sticker-great-job.png', category: 'vivi', unlocked: true },
  { id: 'sticker_awesome', name: 'Awesome!', icon: '✨', image: '/kid/stickers/sticker-awesome.png', category: 'vivi', unlocked: true },
  { id: 'sticker_keep_going', name: 'Keep Going!', icon: '🚀', image: '/kid/stickers/sticker-keep-going.png', category: 'vivi', unlocked: true },
  { id: 'sticker_super', name: 'Super!', icon: '🔥', image: '/kid/stickers/sticker-super.png', category: 'vivi', unlocked: true },
  { id: 'sticker_wow', name: 'Wow!', icon: '🎉', image: '/kid/stickers/sticker-wow.png', category: 'vivi', unlocked: true },
  { id: 'sticker_new_word', name: 'New Word!', icon: '📖', image: '/kid/stickers/sticker-new-word.png', category: 'vivi', unlocked: true },
  { id: 'sticker_listening', name: 'Listening', icon: '🎧', image: '/kid/stickers/sticker-listening.png', category: 'vivi', unlocked: true },
  { id: 'sticker_speaking', name: 'Speaking', icon: '🎤', image: '/kid/stickers/sticker-speaking.png', category: 'vivi', unlocked: true },
  { id: 'sticker_thinking', name: 'Thinking', icon: '💡', image: '/kid/stickers/sticker-thinking.png', category: 'vivi', unlocked: true },
  // Animals stickers
  { id: 'sticker_cat', name: 'Cat', icon: '🐱', image: '/kid/animals/cat.png', category: 'animals', unlocked: true },
  { id: 'sticker_dog', name: 'Dog', icon: '🐶', image: '/kid/animals/dog.png', category: 'animals', unlocked: true },
  { id: 'sticker_lion', name: 'Lion', icon: '🦁', image: '/kid/animals/lion.png', category: 'animals', unlocked: true },
  { id: 'sticker_rabbit', name: 'Rabbit', icon: '🐰', image: '/kid/animals/rabbit.png', category: 'animals', unlocked: true },
  { id: 'sticker_elephant', name: 'Elephant', icon: '🐘', image: '/kid/animals/elephant.png', category: 'animals', unlocked: true },
  { id: 'sticker_bear', name: 'Bear', icon: '🐻', image: '/kid/animals/bear.png', category: 'animals', unlocked: true },
  { id: 'sticker_monkey', name: 'Monkey', icon: '🐵', image: '/kid/animals/monkey.png', category: 'animals', unlocked: true },
  { id: 'sticker_panda', name: 'Panda', icon: '🐼', image: '/kid/animals/panda.png', category: 'animals', unlocked: true },
];

export const BADGES_DATA: KidBadge[] = [
  {
    id: 'badge_first_step',
    title: 'Bước Chân Đầu Tiên',
    description: 'Hoàn thành bài học từ vựng tiếng Anh đầu tiên trên đảo.',
    unlocked: true,
    image: '/kid/rewards/badge-first-word.png',
  },
  {
    id: 'badge_word_explorer',
    title: 'Nhà Thám Hiểm Từ Vựng',
    description: 'Khám phá và lắng nghe trên 20 từ vựng tiếng Anh chuẩn bản xứ.',
    unlocked: true,
    image: '/kid/rewards/badge-word-master.png',
  },
  {
    id: 'badge_listening_champ',
    title: 'Bậc Thầy Luyện Nghe',
    description: 'Luyện nghe phản xạ với Vivi vượt qua 10 lượt nghe chuẩn xác.',
    unlocked: true,
    image: '/kid/rewards/badge-listening.png',
  },
  {
    id: 'badge_pronunciation_star',
    title: 'Ngôi Sao Phát Âm',
    description: 'Luyện nói micro đạt trên 85 điểm phát âm chuẩn xác.',
    unlocked: true,
    image: '/kid/rewards/badge-speaking.png',
  },
  {
    id: 'badge_super_streak',
    title: 'Chuỗi Học Chăm Chỉ',
    description: 'Học liên tục 3 ngày liên tiếp không bỏ lỡ ngày nào.',
    unlocked: true,
    image: '/kid/rewards/badge-streak.png',
  },
  {
    id: 'badge_game_champion',
    title: 'Quán Quân Thử Thách',
    description: 'Vượt qua 10 thử thách đấu trường với thành tích xuất sắc.',
    unlocked: false,
    image: '/kid/rewards/badge-challenge.png',
  },
];
