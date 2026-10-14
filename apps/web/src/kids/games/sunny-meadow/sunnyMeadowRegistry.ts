/**
 * SUNNY MEADOW V2.0 - 5 NEXT-GEN ECOLOGICAL GAMES REGISTRY
 * Replaces old static/quiz games with the 5 interactive physical games from KidRequired.md
 */

export interface SunnyGameItem {
  id: 'hungry_picnic' | 'color_pond' | 'firefly_phonics' | 'voice_windmill' | 'hide_seek';
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
    id: 'hungry_picnic',
    titleEn: 'Hungry Woodland Picnic',
    titleVi: 'Tiệc Picnic Đút Quả Cho Thú Rừng',
    categoryVi: 'Nghe hiểu & Số đếm',
    descriptionVi: 'Nghe hiệu lệnh đút đúng số lượng dâu tây, cà rốt, táo giòn cho bạn Thỏ và Cáo no nê!',
    svgIcon: '#svg-picnic-basket',
    badge: '🧺 Game 1 • Thức Ăn',
    colorGrad: 'from-amber-200 via-orange-100 to-rose-200',
    starsAwarded: 10,
  },
  {
    id: 'color_pond',
    titleEn: 'Color Splash Lily Pond',
    titleVi: 'Giọt Sương Pha Màu Tô Điểm Hồ Sen',
    categoryVi: 'Màu sắc & Pha màu',
    descriptionVi: 'Chạm giọt sương màu sắc và hòa trộn sắc màu phép thuật để chú ếch cốm bừng sáng!',
    svgIcon: '#svg-color-frog',
    badge: '🎨 Game 2 • Pha Màu',
    colorGrad: 'from-sky-200 via-teal-100 to-emerald-200',
    starsAwarded: 10,
  },
  {
    id: 'firefly_phonics',
    titleEn: 'Firefly Phonics Lanterns',
    titleVi: 'Đom Đóm Thắp Sáng Đêm Rừng',
    categoryVi: 'Ngữ âm Phonics & CVC',
    descriptionVi: 'Lắng nghe Cú Ollie đọc âm vị và bắt các chú đom đóm mang chữ cái thắp sáng lồng đèn hoa sen!',
    svgIcon: '#svg-glow-firefly',
    badge: '✨ Game 3 • Phonics',
    colorGrad: 'from-indigo-300 via-purple-200 to-amber-200',
    starsAwarded: 10,
  },
  {
    id: 'voice_windmill',
    titleEn: 'Magic Voice Windmill & Dandelion',
    titleVi: 'Cối Xay Gió & Khinh Khí Cầu Giọng Nói',
    categoryVi: 'Luyện nói & Phản xạ',
    descriptionVi: 'Đọc to từ vựng tiếng Anh vào micro để tạo sức gió quay cối xay và nâng khinh khí cầu bay cao!',
    svgIcon: '#svg-windmill',
    badge: '🌬️ Game 4 • Luyện Nói',
    colorGrad: 'from-rose-200 via-pink-100 to-amber-200',
    starsAwarded: 10,
  },
  {
    id: 'hide_seek',
    titleEn: 'Woodland Hide & Seek',
    titleVi: 'Trốn Tìm Quanh Cây Cổ Thụ',
    categoryVi: 'Giới từ In / On / Under / Behind',
    descriptionVi: 'Truy tìm bạn Thỏ tinh nghịch đang ú òa trốn dưới cây nấm đỏ, trên cành cây hay trong hốc cổ thụ!',
    svgIcon: '#svg-red-mushroom',
    badge: '🌳 Game 5 • Trốn Tìm',
    colorGrad: 'from-emerald-200 via-lime-100 to-teal-200',
    starsAwarded: 10,
  },
];
