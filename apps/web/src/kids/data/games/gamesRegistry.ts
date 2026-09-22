// ============================================================================
// KIDS GAMES SUITE — GAMES REGISTRY & WORLDS ARCHITECTURE
// Comprehensive registry of all 20 kids mini-games across 6 learning worlds
// ============================================================================

export type GameId =
  | 'listen_find'
  | 'memory_flip'
  | 'word_pop'
  | 'sort_match'
  | 'animal_hunt'
  | 'phonics_monster'
  | 'listen_catch'
  | 'rocket_words'
  | 'mountain_climb'
  | 'speak_unlock'
  | 'simon_says'
  | 'build_sentence'
  | 'cooking_time'
  | 'story_quest'
  | 'dress_character'
  | 'treasure_hunt'
  | 'word_builder'
  | 'word_catcher'
  | 'magic_castle'
  | 'boss_challenge'
  | 'animal_rescue'
  // Aliases supported in router
  | 'match_cards'
  | 'balloon_pop'
  | 'monster_snack_shop'
  | 'treasure_island'
  | 'sky_words'
  | 'space_rescue'
  | 'magic_door'
  | 'train_builder'
  | 'animal_train'
  | 'magic_storybook'
  | 'weather_adventure'
  | 'build_my_robot'
  | 'feed_animal'
  | 'dinosaur_dig';

export type GameWorldId =
  | 'starter'
  | 'nature'
  | 'adventure'
  | 'magic'
  | 'creativity'
  | 'mastery'
  | 'jungle'
  | 'space'
  | 'kitchen'
  | 'sky'
  | 'castle'
  | 'stage'
  | 'station';

export type GameSkillType =
  | 'listening'
  | 'speaking'
  | 'reading'
  | 'writing'
  | 'vocabulary'
  | 'grammar'
  | 'phonics'
  | 'reflex'
  | 'memory';

export interface GameDefinition {
  id: GameId;
  gameNumber: number;
  worldId: GameWorldId;
  category: string;
  titleVi: string;
  titleEn: string;
  descriptionVi: string;
  descriptionEn?: string;
  coreMechanicVi: string;
  difficultyVi: string;
  fantasyVi: string;
  icon: string;
  starsAwarded: number;
  xpAwarded: number;
  skillType?: GameSkillType;
  estimatedMinutes?: number;
}

export interface GameWorld {
  id: GameWorldId;
  nameVi: string;
  nameEn: string;
  icon: string;
  gradient: string;
  badgeVi: string;
  descriptionVi: string;
  gameIds: GameId[];
}

export const KIDS_GAME_WORLDS: GameWorld[] = [
  {
    id: 'starter',
    nameVi: 'Thung Lũng Khởi Đầu',
    nameEn: 'Starter Valley',
    icon: '🌱',
    gradient: 'from-emerald-400 to-teal-500',
    badgeVi: 'Cấp Độ 1 • Nhập Môn',
    descriptionVi: 'Làm quen với âm thanh, hình ảnh và phản xạ từ vựng tiếng Anh cơ bản.',
    gameIds: ['listen_find', 'memory_flip', 'word_pop', 'sort_match'],
  },
  {
    id: 'nature',
    nameVi: 'Rừng Xanh Kỳ Thú',
    nameEn: 'Jungle & Nature',
    icon: '🦁',
    gradient: 'from-amber-400 to-orange-500',
    badgeVi: 'Cấp Độ 2 • Thiên Nhiên',
    descriptionVi: 'Khám phá thế giới muông thú, phát âm chuẩn ngữ âm và giải cứu bạn bè.',
    gameIds: ['animal_hunt', 'phonics_monster', 'listen_catch', 'animal_rescue'],
  },
  {
    id: 'adventure',
    nameVi: 'Đảo Kho Báu & Chinh Phục',
    nameEn: 'Treasure Adventure',
    icon: '🗺️',
    gradient: 'from-yellow-400 to-amber-600',
    badgeVi: 'Cấp Độ 3 • Khám Phá',
    descriptionVi: 'Thám hiểm bản đồ đảo thần bí, tìm chìa khóa mở rương và phóng tên lửa.',
    gameIds: ['treasure_hunt', 'mountain_climb', 'rocket_words'],
  },
  {
    id: 'magic',
    nameVi: 'Lâu Đài Phép Thuật',
    nameEn: 'Magic Kingdom',
    icon: '🏰',
    gradient: 'from-purple-500 to-indigo-600',
    badgeVi: 'Cấp Độ 4 • Giao Tiếp',
    descriptionVi: 'Nói to vào micro mở cửa thần kỳ và phản xạ với các câu mệnh lệnh tiếng Anh.',
    gameIds: ['speak_unlock', 'simon_says', 'magic_castle'],
  },
  {
    id: 'creativity',
    nameVi: 'Xưởng Sáng Tạo Đời Sống',
    nameEn: 'Creativity Studio',
    icon: '🎨',
    gradient: 'from-rose-400 to-pink-500',
    badgeVi: 'Cấp Độ 5 • Sáng Tạo',
    descriptionVi: 'Ghép câu hoàn chỉnh, vào bếp trổ tài và bước vào thế giới cổ tích nhiệm màu.',
    gameIds: ['build_sentence', 'story_quest', 'dress_character', 'cooking_time'],
  },
  {
    id: 'mastery',
    nameVi: 'Đấu Trường Tri Thức',
    nameEn: 'Mastery Arena',
    icon: '👑',
    gradient: 'from-red-500 to-purple-700',
    badgeVi: 'Cấp Độ 6 • Thử Thách Cực Hạn',
    descriptionVi: 'Xây dựng từ, bắt từ rơi và chinh phục Thử Thách Trùm Khủng Long Tri Thức.',
    gameIds: ['word_builder', 'word_catcher', 'boss_challenge'],
  },
];

export const KIDS_GAMES_REGISTRY: GameDefinition[] = [
  // 0. Listen & Find
  {
    id: 'listen_find',
    gameNumber: 1,
    worldId: 'starter',
    category: 'listening',
    titleVi: 'Nghe & Chọn Đúng Tranh',
    titleEn: 'Listen & Find',
    descriptionVi: 'Lắng nghe phát âm chuẩn bản xứ và chạm nhanh vào hình ảnh đồ vật tương ứng.',
    coreMechanicVi: 'Nghe âm thanh và chọn 1 trong 4 bức tranh đúng',
    difficultyVi: 'Dễ',
    fantasyVi: 'Khu Vườn Hoa Âm Thanh',
    icon: '🎧',
    starsAwarded: 3,
    xpAwarded: 30,
    skillType: 'listening',
  },
  // 1. Memory Flip
  {
    id: 'memory_flip',
    gameNumber: 2,
    worldId: 'starter',
    category: 'memory',
    titleVi: 'Lật Thẻ Trí Nhớ',
    titleEn: 'Memory Card Flip',
    descriptionVi: 'Lật tìm các cặp thẻ tương đồng giữa từ tiếng Anh và hình ảnh minh họa.',
    coreMechanicVi: 'Ghi nhớ vị trí thẻ và ghép đôi chính xác',
    difficultyVi: 'Dễ',
    fantasyVi: 'Khu Rừng Đom Đóm',
    icon: '🃏',
    starsAwarded: 3,
    xpAwarded: 30,
    skillType: 'memory',
  },
  // 2. Word Pop
  {
    id: 'word_pop',
    gameNumber: 3,
    worldId: 'starter',
    category: 'reflex',
    titleVi: 'Bắn Bong Bóng Từ',
    titleEn: 'Word Balloon Pop',
    descriptionVi: 'Nhanh tay bắn vỡ các quả bóng bay mang từ vựng mục tiêu trước khi bay mất.',
    coreMechanicVi: 'Phản xạ nhanh nhạy chạm bóng bay chính xác',
    difficultyVi: 'Trung Bình',
    fantasyVi: 'Lễ Hội Bong Bóng Bảy Sắc',
    icon: '🎈',
    starsAwarded: 4,
    xpAwarded: 40,
    skillType: 'reflex',
  },
  // 3. Sort Match
  {
    id: 'sort_match',
    gameNumber: 4,
    worldId: 'starter',
    category: 'sorting',
    titleVi: 'Phân Loại Chủ Đề',
    titleEn: 'Sort & Match',
    descriptionVi: 'Kéo thả các món đồ vào đúng chiếc giỏ chủ đề tương ứng (Động vật, Trái cây, Xe cộ).',
    coreMechanicVi: 'Phân nhóm từ vựng theo trường nghĩa logic',
    difficultyVi: 'Dễ',
    fantasyVi: 'Nông Trại Thu Hoạch',
    icon: '🧺',
    starsAwarded: 3,
    xpAwarded: 35,
    skillType: 'vocabulary',
  },
  // 4. Animal Hunt
  {
    id: 'animal_hunt',
    gameNumber: 5,
    worldId: 'nature',
    category: 'exploration',
    titleVi: 'Truy Tìm Động Vật',
    titleEn: 'Animal Safari Hunt',
    descriptionVi: 'Soi kính lúp tìm các bạn thú tinh nghịch đang ẩn nấp trong bụi rậm.',
    coreMechanicVi: 'Quan sát và nhận diện sinh vật hoang dã',
    difficultyVi: 'Trung Bình',
    fantasyVi: 'Khu Bảo Tồn Thảo Nguyên',
    icon: '🦁',
    starsAwarded: 4,
    xpAwarded: 40,
    skillType: 'vocabulary',
  },
  // 5. Phonics Monster
  {
    id: 'phonics_monster',
    gameNumber: 6,
    worldId: 'nature',
    category: 'phonics',
    titleVi: 'Quái Vật Phát Âm',
    titleEn: 'Phonics Snack Monster',
    descriptionVi: 'Cho bé quái vật đáng yêu ăn các chữ cái và âm thanh phát âm chính xác.',
    coreMechanicVi: 'Ghép âm ngữ âm (Phonics) và vần chữ cái',
    difficultyVi: 'Trung Bình',
    fantasyVi: 'Hang Động Kẹo Ngọt',
    icon: '👾',
    starsAwarded: 4,
    xpAwarded: 45,
    skillType: 'phonics',
  },
  // 6. Listen & Catch
  {
    id: 'listen_catch',
    gameNumber: 7,
    worldId: 'nature',
    category: 'reflex',
    titleVi: 'Hứng Từ Rơi',
    titleEn: 'Listen & Catch',
    descriptionVi: 'Điều khiển giỏ hứng các chữ cái và từ rơi từ trên cây cao xuống.',
    coreMechanicVi: 'Nghe hiệu lệnh và di chuyển bắt từ chính xác',
    difficultyVi: 'Trung Bình',
    fantasyVi: 'Cây Cổ Thụ Kỳ Diệu',
    icon: '🧺',
    starsAwarded: 4,
    xpAwarded: 40,
    skillType: 'listening',
  },
  // 7. Rocket Words
  {
    id: 'rocket_words',
    gameNumber: 8,
    worldId: 'adventure',
    category: 'space',
    titleVi: 'Phóng Tên Lửa Vũ Trụ',
    titleEn: 'Rocket Space Words',
    descriptionVi: 'Nạp nhiên liệu từ vựng để phóng phi thuyền khám phá dải ngân hà xa xôi.',
    coreMechanicVi: 'Thu thập từ khóa để kích hoạt động cơ phản lực',
    difficultyVi: 'Khó',
    fantasyVi: 'Trạm Không Gian Ngân Hà',
    icon: '🚀',
    starsAwarded: 5,
    xpAwarded: 50,
    skillType: 'vocabulary',
  },
  // 8. Mountain Climb
  {
    id: 'mountain_climb',
    gameNumber: 9,
    worldId: 'adventure',
    category: 'challenge',
    titleVi: 'Leo Núi Tri Thức',
    titleEn: 'Mountain Climber',
    descriptionVi: 'Mỗi câu trả lời đúng giúp nhà leo núi tiến thêm một bước lên đỉnh vinh quang.',
    coreMechanicVi: 'Vượt qua các chướng ngại vật dốc đứng',
    difficultyVi: 'Khó',
    fantasyVi: 'Đỉnh Everest Tuyết Trắng',
    icon: '🧗',
    starsAwarded: 5,
    xpAwarded: 50,
    skillType: 'grammar',
  },
  // 9. Speak & Unlock
  {
    id: 'speak_unlock',
    gameNumber: 10,
    worldId: 'magic',
    category: 'speaking',
    titleVi: 'Nói To Mở Khóa Cửa',
    titleEn: 'Speak & Unlock Door',
    descriptionVi: 'Nói to rõ ràng từng từ tiếng Anh vào micro để cánh cửa thần kỳ mở ra.',
    coreMechanicVi: 'Nhận diện giọng nói và chấm điểm phát âm AI',
    difficultyVi: 'Trung Bình',
    fantasyVi: 'Cánh Cổng Bí Mật Phù Thủy',
    icon: '🎙️',
    starsAwarded: 5,
    xpAwarded: 50,
    skillType: 'speaking',
  },
  // 10. Build Sentence
  {
    id: 'build_sentence',
    gameNumber: 11,
    worldId: 'creativity',
    category: 'grammar',
    titleVi: 'Ghép Toa Tàu Câu',
    titleEn: 'Sentence Train Builder',
    descriptionVi: 'Sắp xếp các toa tàu chứa từ vựng thành một câu giao tiếp hoàn chỉnh và đúng ngữ pháp.',
    coreMechanicVi: 'Kéo thả thứ tự từ Chủ ngữ - Động từ - Tân ngữ',
    difficultyVi: 'Trung Bình',
    fantasyVi: 'Ga Tàu Hỏa Mặt Trời',
    icon: '🚂',
    starsAwarded: 4,
    xpAwarded: 45,
    skillType: 'grammar',
  },
  // 11. Simon Says
  {
    id: 'simon_says',
    gameNumber: 12,
    worldId: 'magic',
    category: 'listening',
    titleVi: 'Simon Bảo Hành Động',
    titleEn: 'Simon Says Action',
    descriptionVi: 'Làm theo hướng dẫn vui nhộn khi nghe cụm từ "Simon Says" quen thuộc.',
    coreMechanicVi: 'Lắng nghe phản xạ hành động cơ thể',
    difficultyVi: 'Trung Bình',
    fantasyVi: 'Sân Khấu Kịch Hài Hước',
    icon: '🎭',
    starsAwarded: 4,
    xpAwarded: 40,
    skillType: 'listening',
  },
  // 12. Story Quest
  {
    id: 'story_quest',
    gameNumber: 13,
    worldId: 'creativity',
    category: 'reading',
    titleVi: 'Phiêu Lưu Trang Sách Cổ Tích',
    titleEn: 'Magic Storybook Quest',
    descriptionVi: 'Đọc truyện tranh tương tác và đưa ra các lựa chọn quyết định diễn biến câu chuyện.',
    coreMechanicVi: 'Đọc hiểu ngữ cảnh và giải quyết vấn đề',
    difficultyVi: 'Trung Bình',
    fantasyVi: 'Thư Viện Thần Thoại',
    icon: '📖',
    starsAwarded: 5,
    xpAwarded: 50,
    skillType: 'reading',
  },
  // 13. Cooking Time
  {
    id: 'cooking_time',
    gameNumber: 14,
    worldId: 'creativity',
    category: 'lifestyle',
    titleVi: 'Đầu Bếp Nhí Nấu Ăn',
    titleEn: 'Little Chef Cooking',
    descriptionVi: 'Chọn đúng các nguyên liệu theo công thức tiếng Anh để hoàn thành món ngon.',
    coreMechanicVi: 'Nghe gọi tên món và chọn nguyên liệu',
    difficultyVi: 'Dễ',
    fantasyVi: 'Bếp Bánh Ngọt Ngào',
    icon: '🍳',
    starsAwarded: 3,
    xpAwarded: 35,
    skillType: 'vocabulary',
  },
  // 14. Dress Character
  {
    id: 'dress_character',
    gameNumber: 15,
    worldId: 'creativity',
    category: 'lifestyle',
    titleVi: 'Thay Đồ Cho Bạn Nhỏ',
    titleEn: 'Dress My Character',
    descriptionVi: 'Mặc trang phục, giày dép và phụ kiện thời trang theo yêu cầu thời tiết.',
    coreMechanicVi: 'Học từ vựng trang phục, màu sắc và thời tiết',
    difficultyVi: 'Dễ',
    fantasyVi: 'Phòng Thời Trang Rực Rỡ',
    icon: '👗',
    starsAwarded: 3,
    xpAwarded: 35,
    skillType: 'vocabulary',
  },
  // 15. Treasure Map
  {
    id: 'treasure_hunt',
    gameNumber: 16,
    worldId: 'adventure',
    category: 'adventure',
    titleVi: 'Thám Hiểm Đảo Kho Báu',
    titleEn: 'Treasure Island Map',
    descriptionVi: 'Khám phá hòn đảo nhiệt đới 2D, giải đố tìm chìa khóa hoàng kim mở rương báu.',
    coreMechanicVi: 'Bản đồ phiêu lưu RPG thế giới mở 2D',
    difficultyVi: 'Khó',
    fantasyVi: 'Đảo Cướp Biển Thân Thiện',
    icon: '🏝️',
    starsAwarded: 5,
    xpAwarded: 60,
    skillType: 'vocabulary',
  },
  // 16. Word Builder
  {
    id: 'word_builder',
    gameNumber: 17,
    worldId: 'mastery',
    category: 'spelling',
    titleVi: 'Xây Dựng Từ Ngữ',
    titleEn: 'Letter Word Builder',
    descriptionVi: 'Ghép từng khối chữ cái theo đúng thứ tự đánh vần để tạo nên từ vựng hoàn chỉnh.',
    coreMechanicVi: 'Đánh vần (Spelling) và kiến tạo khối từ',
    difficultyVi: 'Khó',
    fantasyVi: 'Công Trường Khối Vuông',
    icon: '🧱',
    starsAwarded: 5,
    xpAwarded: 55,
    skillType: 'writing',
  },
  // 17. Word Catcher
  {
    id: 'word_catcher',
    gameNumber: 18,
    worldId: 'mastery',
    category: 'reflex',
    titleVi: 'Vợt Bắt Ngôi Sao Từ',
    titleEn: 'Word Star Catcher',
    descriptionVi: 'Dùng vợt ma thuật hứng trọn các ngôi sao mang từ vựng mục tiêu rơi từ vũ trụ.',
    coreMechanicVi: 'Điều khiển phản xạ hứng vật thể chính xác',
    difficultyVi: 'Trung Bình',
    fantasyVi: 'Bầu Trời Đêm Lấp Lánh',
    icon: '⭐',
    starsAwarded: 4,
    xpAwarded: 45,
    skillType: 'reflex',
  },
  // 18. Magic Castle
  {
    id: 'magic_castle',
    gameNumber: 19,
    worldId: 'magic',
    category: 'adventure',
    titleVi: 'Lâu Đài Phép Thuật',
    titleEn: 'Magic Wizard Castle',
    descriptionVi: 'Giải các câu đố cổ xưa để phục hồi ánh sáng cho lâu đài phép thuật huyền bí.',
    coreMechanicVi: 'Tương tác vật phẩm và thần chú tiếng Anh',
    difficultyVi: 'Khó',
    fantasyVi: 'Tòa Tháp Pha Lê',
    icon: '🏰',
    starsAwarded: 5,
    xpAwarded: 55,
    skillType: 'vocabulary',
  },
  // 19. Boss Challenge
  {
    id: 'boss_challenge',
    gameNumber: 20,
    worldId: 'mastery',
    category: 'boss',
    titleVi: 'Đấu Trùm Tri Thức Khủng Long',
    titleEn: 'Boss Challenge Dinosaur',
    descriptionVi: 'Vượt qua 5 chặng thử thách tổng hợp để thuần phục bạn Khủng Long Tri Thức vĩ đại.',
    coreMechanicVi: 'Trận chiến boss 5 hiệp kết hợp toàn diện 4 kỹ năng',
    difficultyVi: 'Cực Khó',
    fantasyVi: 'Đấu Trường Dung Nham Cổ Đại',
    icon: '🦖',
    starsAwarded: 6,
    xpAwarded: 100,
    skillType: 'vocabulary',
  },
  // 20. Animal Rescue
  {
    id: 'animal_rescue',
    gameNumber: 21,
    worldId: 'nature',
    category: 'adventure',
    titleVi: 'Giải Cứu Động Vật',
    titleEn: 'Animal Rescue Mission',
    descriptionVi: 'Trả lời đúng các câu hỏi tiếng Anh để gỡ lồng giải thoát cho muông thú đáng yêu.',
    coreMechanicVi: 'Giải cứu cứu trợ thông qua câu hỏi từ vựng',
    difficultyVi: 'Trung Bình',
    fantasyVi: 'Trạm Y Tế Hoang Dã',
    icon: '🏥',
    starsAwarded: 4,
    xpAwarded: 40,
    skillType: 'vocabulary',
  },
];
