/**
 * SUNNY MEADOW V4.0 - INTERACTIVE MINI-GAMES REGISTRY
 * Strictly adheres to AGENTS.md V4.0 Spec (Section 6)
 */

export interface SunnyGameItem {
  id:
    | 'sunny_memory_flip'
    | 'picture_word_match'
    | 'hungry_fox_picnic'
    | 'woodland_spelling';
  titleEn: string;
  titleVi: string;
  categoryVi: string;
  descriptionVi: string;
  svgIcon: string;
  badge: string;
  starsAwarded: number;
}

export const SUNNY_MEADOW_GAMES: SunnyGameItem[] = [
  {
    id: 'sunny_memory_flip',
    titleEn: "Sunny's Memory Flip",
    titleVi: 'Lật Thẻ Trí Nhớ Rừng Xanh',
    categoryVi: 'Trí nhớ thị giác & Từ vựng',
    descriptionVi:
      'Lưới thẻ bài 3D căn giữa tuyệt đối, mặt trước gồm cả Hình SVG + Chữ viết, lật mở êm ái cùng Cáo Sunny!',
    svgIcon: '#svg-card-back',
    badge: '🎴 Game 1 • Lật Thẻ',
    starsAwarded: 15,
  },
  {
    id: 'picture_word_match',
    titleEn: "Sunny's Picture Word Match",
    titleVi: 'Ghép Cặp Hình & Từ Vựng',
    categoryVi: 'Nhận diện hình ảnh & Từ ngữ',
    descriptionVi:
      'Quan sát khung hình lớn và chọn đúng thẻ bài có hình ảnh minh họa cùng từ tiếng Anh tương ứng!',
    svgIcon: '#svg-cat',
    badge: '🎯 Game 2 • Ghép Cặp',
    starsAwarded: 15,
  },
  {
    id: 'hungry_fox_picnic',
    titleEn: 'Hungry Fox Picnic',
    titleVi: 'Đút Trái Cây Cho Cáo Sunny',
    categoryVi: 'Nghe hiểu & Số đếm trái cây',
    descriptionVi:
      'Lắng nghe Cáo Sunny dặn dò và đút đúng số lượng quả táo, chuối, dâu tây, cam cho Cáo Sunny măm măm!',
    svgIcon: '#svg-apple',
    badge: '🧺 Game 3 • Đút Quả',
    starsAwarded: 15,
  },
  {
    id: 'woodland_spelling',
    titleEn: 'Woodland Spelling Blocks',
    titleVi: 'Đánh Vần Khối Gỗ Minh Họa',
    categoryVi: 'Đánh vần khối chữ & Phonics',
    descriptionVi:
      'Nhìn tranh minh họa lớn của Mặt trời, Chú cún, Con mèo và ghép các khối gỗ chữ cái chuẩn xác!',
    svgIcon: '#svg-sun',
    badge: '🪵 Game 4 • Đánh Vần',
    starsAwarded: 15,
  },
];
