// ============================================================================
// KIDS VOCABULARY CATEGORIES DATA
// Structured categories for kids vocabulary exploration, island zones & games
// Replaced system emojis with high quality vector illustrations & icons
// ============================================================================

export interface KidsCategory {
  id: string;
  nameVi: string;
  nameEn: string;
  illustration: string;
  icon?: string;
  color?: string;
  bgColor?: string;
  accentGradient?: string;
}

export const KIDS_CATEGORIES: KidsCategory[] = [
  {
    id: 'animals',
    nameVi: 'Động Vật',
    nameEn: 'Animals',
    illustration: 'lion',
    color: '#d97706',
    bgColor: 'bg-amber-50',
    accentGradient: 'from-amber-400 to-orange-500',
  },
  {
    id: 'fruits',
    nameVi: 'Trái Cây & Ẩm Thực',
    nameEn: 'Fruits & Food',
    illustration: 'apple',
    color: '#e11d48',
    bgColor: 'bg-rose-50',
    accentGradient: 'from-rose-400 to-pink-500',
  },
  {
    id: 'family',
    nameVi: 'Gia Đình & Bạn Bè',
    nameEn: 'Family & Home',
    illustration: 'cat',
    color: '#059669',
    bgColor: 'bg-emerald-50',
    accentGradient: 'from-emerald-400 to-teal-500',
  },
  {
    id: 'school',
    nameVi: 'Trường Học & Dụng Cụ',
    nameEn: 'School & Stationery',
    illustration: 'book',
    color: '#2563eb',
    bgColor: 'bg-blue-50',
    accentGradient: 'from-blue-400 to-indigo-500',
  },
  {
    id: 'transport',
    nameVi: 'Phương Tiện Giao Thông',
    nameEn: 'Vehicles & Transport',
    illustration: 'rocket',
    color: '#7c3aed',
    bgColor: 'bg-purple-50',
    accentGradient: 'from-purple-400 to-indigo-600',
  },
  {
    id: 'nature',
    nameVi: 'Thiên Nhiên & Thời Tiết',
    nameEn: 'Nature & Weather',
    illustration: 'sun',
    color: '#0891b2',
    bgColor: 'bg-cyan-50',
    accentGradient: 'from-cyan-400 to-sky-500',
  },
  {
    id: 'colors',
    nameVi: 'Màu Sắc & Hình Khối',
    nameEn: 'Colors & Shapes',
    illustration: 'balloons',
    color: '#db2777',
    bgColor: 'bg-pink-50',
    accentGradient: 'from-pink-400 to-rose-500',
  },
  {
    id: 'body',
    nameVi: 'Cơ Thể & Trang Phục',
    nameEn: 'Body & Clothes',
    illustration: 'rabbit',
    color: '#ea580c',
    bgColor: 'bg-orange-50',
    accentGradient: 'from-orange-400 to-amber-500',
  },
];
