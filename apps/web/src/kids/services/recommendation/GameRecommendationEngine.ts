// ============================================================================
// GAME RECOMMENDATION ENGINE — PEDAGOGICAL MATCHING FOR KIDS ENGLISH
// Intelligently recommends mini-games based on weak skills, recency, and progression
// ============================================================================

import {
  KIDS_GAMES_REGISTRY,
  GameDefinition,
  GameId,
  GameSkillType,
} from '../../data/games/gamesRegistry';
import { getKidsProgress } from '../../curriculum/curriculumProgress';

export interface GameRecommendation {
  game: GameDefinition;
  reasonVi: string;
  reasonEn: string;
  badgeLabel: string;
  badgeColor: string;
}

export class GameRecommendationEngine {
  /**
   * Evaluates child's progress and recommends top games to practice
   */
  public static getRecommendations(limit = 4): GameRecommendation[] {
    const progress = getKidsProgress();
    const weakWords = progress?.weakWords || [];
    const recommendations: GameRecommendation[] = [];

    // 1. If child has weak vocabulary / words to review
    if (weakWords.length > 0) {
      const listenFind = KIDS_GAMES_REGISTRY.find((g) => g.id === 'listen_find');
      if (listenFind) {
        recommendations.push({
          game: listenFind,
          reasonVi: `Bé đang có ${weakWords.length} từ cần ôn tập lại. Cùng nghe và chọn nhé!`,
          reasonEn: 'Listening practice recommended for vocabulary review.',
          badgeLabel: 'Ôn Tập Nghe',
          badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        });
      }

      const memoryFlip = KIDS_GAMES_REGISTRY.find((g) => g.id === 'memory_flip');
      if (memoryFlip) {
        recommendations.push({
          game: memoryFlip,
          reasonVi: 'Lật thẻ hình ảnh giúp khắc sâu trí nhớ từ vựng hiệu quả.',
          reasonEn: 'Memory cards boost active recall for fresh vocabulary.',
          badgeLabel: 'Luyện Trí Nhớ',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
        });
      }
    }

    // 2. Speaking Recommendation
    const speakGame = KIDS_GAMES_REGISTRY.find((g) => g.id === 'speak_unlock');
    if (speakGame) {
      recommendations.push({
        game: speakGame,
        reasonVi: 'Luyện nói to từng từ vựng tiếng Anh vào micro để mở cửa bí mật!',
        reasonEn: 'Speaking & pronunciation practice with microphone feedback.',
        badgeLabel: 'Tập Nói Tiếng Anh',
        badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      });
    }

    // 3. Reflex & Fun Recommendation
    const wordPop = KIDS_GAMES_REGISTRY.find((g) => g.id === 'word_pop');
    if (wordPop) {
      recommendations.push({
        game: wordPop,
        reasonVi: 'Bắn nổ bong bóng từ vựng rực rỡ sắc màu giúp phản xạ nhanh nhạy.',
        reasonEn: 'High engagement reflex game for swift word recognition.',
        badgeLabel: 'Phản Xạ Vui',
        badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
      });
    }

    // 4. Adventure Showcase Recommendation
    const treasureHunt = KIDS_GAMES_REGISTRY.find((g) => g.id === 'treasure_hunt' || g.id === 'treasure_island');
    if (treasureHunt && recommendations.length < limit) {
      recommendations.push({
        game: treasureHunt,
        reasonVi: 'Cuộc phiêu lưu tìm chìa khóa mở rương kho báu hoàng kim!',
        reasonEn: 'Exciting 2D map exploration adventure.',
        badgeLabel: 'Thám Hiểm Đảo',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      });
    }

    // 5. Challenge Showcase Recommendation
    const bossGame = KIDS_GAMES_REGISTRY.find((g) => g.id === 'boss_challenge');
    if (bossGame && recommendations.length < limit) {
      recommendations.push({
        game: bossGame,
        reasonVi: 'Vượt qua 5 chặng thử thách để thu phục Bạn Khủng Long Tri Thức!',
        reasonEn: 'Comprehensive 5-phase learning boss battle.',
        badgeLabel: 'Trùm Tri Thức',
        badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
      });
    }

    return recommendations.slice(0, limit);
  }
}
