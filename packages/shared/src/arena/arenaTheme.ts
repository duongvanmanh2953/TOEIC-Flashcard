/**
 * VocabFlow Arena - Visual Design System Theme Tokens
 * Premium Esports + Modern EdTech Styling
 */

export const ARENA_THEME = {
  colors: {
    primary: '#2041F6',
    primaryHighlight: '#8B75FF',
    darkBg: '#090D1B',
    surface: '#12182B',
    elevatedSurface: '#19213A',
    surfaceBorder: '#232D4E',
    gold: '#F6C453',
    silver: '#CBD5E1',
    bronze: '#CD7F32',
    success: '#25C98A',
    error: '#F26B76',
    secondaryText: '#929CB4',
    mainText: '#F4F6FF',
    accentCyan: '#38BDF8',
    teamRed: '#EF4444',
    teamBlue: '#3B82F6',
  },
  glows: {
    primary: '0 0 25px rgba(32, 65, 246, 0.45)',
    primaryHighlight: '0 0 25px rgba(139, 117, 255, 0.45)',
    gold: '0 0 30px rgba(246, 196, 83, 0.5)',
    success: '0 0 20px rgba(37, 201, 138, 0.4)',
    error: '0 0 20px rgba(242, 107, 118, 0.4)',
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    tabularNums: 'tabular-nums',
  },
} as const;

export type ArenaGameMode =
  | 'CLASSIC_QUIZ'
  | 'SURVIVAL'
  | 'DUEL'
  | 'TEAM_BATTLE'
  | 'WORD_RUSH'
  | 'BOSS_ROUND'
  | 'FINAL_SHOWDOWN'
  | 'TRANSLATION_RUSH'
  | 'WORD_BLITZ'
  | 'LISTENING_RUSH';

export interface ArenaModeConfig {
  id: ArenaGameMode;
  title: string;
  tagline: string;
  description: string;
  badge: string;
  defaultRounds: number;
  defaultTimeSec: number;
  multiplier: number;
  hasLives?: boolean;
  isTeam?: boolean;
  isDuel?: boolean;
}

export const ARENA_MODES_CONFIG: Record<ArenaGameMode, ArenaModeConfig> = {
  CLASSIC_QUIZ: {
    id: 'CLASSIC_QUIZ',
    title: 'Đại Chiến Trắc Nghiệm',
    tagline: 'Classic Esports Quiz Battle',
    description: 'Trắc nghiệm phản xạ 4 phương án. Điểm cộng tốc độ, chuỗi đúng và độ chính xác.',
    badge: 'Phổ biến nhất',
    defaultRounds: 10,
    defaultTimeSec: 15,
    multiplier: 1.0,
  },
  SURVIVAL: {
    id: 'SURVIVAL',
    title: 'Đấu Trường Sinh Tồn (3 Mạng)',
    tagline: 'Last Player Standing',
    description: 'Người chơi có 3 tim. Trả lời sai mất 1 tim. Hết tim chuyển sang Chế độ Khán giả (Spectator).',
    badge: 'Sinh tồn gay cấn',
    defaultRounds: 15,
    defaultTimeSec: 12,
    multiplier: 1.25,
    hasLives: true,
  },
  DUEL: {
    id: 'DUEL',
    title: 'Song Đấu 1vs1 Đối Kháng',
    tagline: 'Head-to-Head Showdown',
    description: 'Ghép cặp so tài trực diện. Tính điểm từng câu, xử lý hòa và tìm ra bậc thầy từ vựng.',
    badge: 'Đối kháng 1:1',
    defaultRounds: 8,
    defaultTimeSec: 12,
    multiplier: 1.2,
    isDuel: true,
  },
  TEAM_BATTLE: {
    id: 'TEAM_BATTLE',
    title: 'Đại Chiến Bang Hội (Red vs Blue)',
    tagline: 'Faction War Battle',
    description: 'Chia 2 phe Đỏ / Xanh. Tổng điểm được chuẩn hóa để đảm bảo công bằng cho mọi sĩ số.',
    badge: 'Đồng đội',
    defaultRounds: 12,
    defaultTimeSec: 15,
    multiplier: 1.1,
    isTeam: true,
  },
  WORD_RUSH: {
    id: 'WORD_RUSH',
    title: 'Word Rush — Giải Mã Ký Tự',
    tagline: 'Scramble & Speed Typing',
    description: 'Sắp xếp ký tự xáo trộn, gõ từ vựng và chuẩn hóa Unicode đa ngôn ngữ.',
    badge: 'Thần tốc',
    defaultRounds: 10,
    defaultTimeSec: 20,
    multiplier: 1.3,
  },
  BOSS_ROUND: {
    id: 'BOSS_ROUND',
    title: 'Vòng Đấu Trùm (Boss Round)',
    tagline: 'High Stakes Challenge',
    description: 'Bộ câu hỏi nâng cao với trọng số x2 điểm thưởng. Phân tích ngữ cảnh chuyên sâu.',
    badge: 'x2 Điểm Thưởng',
    defaultRounds: 5,
    defaultTimeSec: 25,
    multiplier: 2.0,
  },
  FINAL_SHOWDOWN: {
    id: 'FINAL_SHOWDOWN',
    title: 'Chung Kết Quyết Đấu (Final Showdown)',
    tagline: 'The Championship Round',
    description: '3 câu hỏi quyết định ngôi vị Quán Quân với hệ số x3 điểm và luật Tie-breaker rõ ràng.',
    badge: 'x3 Điểm Quyết Định',
    defaultRounds: 3,
    defaultTimeSec: 20,
    multiplier: 3.0,
  },
  TRANSLATION_RUSH: {
    id: 'TRANSLATION_RUSH',
    title: 'Dịch Nhanh Song Ngữ',
    tagline: 'Translation Speed Battle',
    description: 'Phản xạ dịch từ vựng song ngữ theo thời gian thực.',
    badge: 'Song ngữ',
    defaultRounds: 10,
    defaultTimeSec: 15,
    multiplier: 1.0,
  },
  WORD_BLITZ: {
    id: 'WORD_BLITZ',
    title: 'Tốc Chiến Từ Vựng',
    tagline: 'Vocabulary Blitz',
    description: 'Đua điểm phản xạ từ vựng cấp tốc.',
    badge: 'Tốc độ',
    defaultRounds: 10,
    defaultTimeSec: 15,
    multiplier: 1.0,
  },
  LISTENING_RUSH: {
    id: 'LISTENING_RUSH',
    title: 'Luyện Nghe Bắt Âm',
    tagline: 'Audio Listening Rush',
    description: 'Phát âm thanh từ vựng, người chơi nghe bắt âm và chọn đáp án chính xác.',
    badge: 'Luyện nghe',
    defaultRounds: 10,
    defaultTimeSec: 18,
    multiplier: 1.2,
  },
};
