/**
 * SUNNY MEADOW V3.0 - 5 NEXT-GEN INTERACTIVE MINI-GAMES
 * Meets all 6 mandatory requirements from KidRequired.md & AGENTS.md
 */

export interface SunnyGameItem {
  id:
    | 'sunny_memory_flip'
    | 'hungry_fox_picnic'
    | 'color_splash_pond'
    | 'firefly_phonics'
    | 'magic_voice_windmill';
  titleEn: string;
  titleVi: string;
  categoryVi: string;
  descriptionVi: string;
  svgIcon: string;
  badge: string;
  colorGrad: string;
  starsAwarded: number;
}

export const SUNNY_MEADOW_GAMES: SunnyGameItem[] = [
  {
    id: 'sunny_memory_flip',
    titleEn: "Sunny's Memory Flip Cards",
    titleVi: 'Lật Thẻ Trí Nhớ Rừng Xanh',
    categoryVi: 'Trí nhớ thị giác & Từ vựng',
    descriptionVi:
      'Lưới thẻ bài 3D lật mở mượt mà, ghép cặp Hình ảnh SVG và Từ vựng Tiếng Anh cùng hiệu ứng phát sáng!',
    svgIcon: '#svg-card-back-leaf',
    badge: '🎴 Game 1 • Lật Thẻ',
    colorGrad: 'from-amber-200 via-yellow-100 to-orange-200',
    starsAwarded: 15,
  },
  {
    id: 'hungry_fox_picnic',
    titleEn: 'Hungry Fox Picnic',
    titleVi: 'Bữa Tiệc Dã Ngoại Của Cáo Sunny',
    categoryVi: 'Nghe hiểu & Số đếm trái cây',
    descriptionVi:
      'Lắng nghe Cáo Sunny hướng dẫn song ngữ và đút đúng số lượng dâu tây, cà rốt, táo giòn cho Cáo măm măm!',
    svgIcon: '#svg-picnic-basket',
    badge: '🧺 Game 2 • Đút Quả',
    colorGrad: 'from-orange-200 via-rose-100 to-amber-200',
    starsAwarded: 15,
  },
  {
    id: 'color_splash_pond',
    titleEn: 'Color Splash Lily Pond',
    titleVi: 'Đầm Sen Pha Màu Phép Thuật',
    categoryVi: 'Màu sắc & Pha trộn phép thuật',
    descriptionVi:
      'Chạm giọt sương và pha trộn màu sắc diệu kỳ để giúp chú ếch cốm đổi màu bừng sáng hồ sen!',
    svgIcon: '#svg-color-frog',
    badge: '🎨 Game 3 • Pha Màu',
    colorGrad: 'from-sky-200 via-teal-100 to-emerald-200',
    starsAwarded: 15,
  },
  {
    id: 'firefly_phonics',
    titleEn: 'Firefly Phonics Lanterns',
    titleVi: 'Đom Đóm Thắp Đèn Đánh Vần',
    categoryVi: 'Ngữ âm Phonics & CVC',
    descriptionVi:
      'Bắt các chú đom đóm phát sáng bay lượn trong rừng đêm để thắp sáng từng chữ cái lồng đèn hoa sen!',
    svgIcon: '#svg-glow-firefly',
    badge: '✨ Game 4 • Đánh Vần',
    colorGrad: 'from-indigo-300 via-purple-200 to-amber-200',
    starsAwarded: 15,
  },
  {
    id: 'magic_voice_windmill',
    titleEn: 'Magic Voice Windmill',
    titleVi: 'Cối Xay Gió Giọng Nói',
    categoryVi: 'Luyện nói & Phản xạ tiếng Anh',
    descriptionVi:
      'Bé đọc thật to từ tiếng Anh vào micro hoặc bấm thổi gió để làm quay cối xay gió 360 độ và nâng khinh khí cầu!',
    svgIcon: '#svg-windmill',
    badge: '🌬️ Game 5 • Luyện Nói',
    colorGrad: 'from-sky-300 via-blue-100 to-cyan-200',
    starsAwarded: 15,
  },
];
