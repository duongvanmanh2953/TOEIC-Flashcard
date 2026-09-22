// ============================================================================
// KIDS VOCABULARY CATEGORIES DATA
// Structured categories for kids vocabulary exploration, island zones & games
// ============================================================================

export interface KidsCategory {
  id: string;
  nameVi: string;
  nameEn: string;
  icon: string;
  color?: string;
  bgColor?: string;
}

export const KIDS_CATEGORIES: KidsCategory[] = [
  {
    id: 'animals',
    nameVi: 'Động Vật',
    nameEn: 'Animals',
    icon: '🐶',
    color: '#d97706',
    bgColor: 'bg-amber-100',
  },
  {
    id: 'fruits',
    nameVi: 'Trái Cây & Ẩm Thực',
    nameEn: 'Fruits & Food',
    icon: '🍎',
    color: '#e11d48',
    bgColor: 'bg-rose-100',
  },
  {
    id: 'family',
    nameVi: 'Gia Đình & Bạn Bè',
    nameEn: 'Family & Home',
    icon: '👨‍👩‍👧',
    color: '#059669',
    bgColor: 'bg-emerald-100',
  },
  {
    id: 'school',
    nameVi: 'Trường Học & Dụng Cụ',
    nameEn: 'School & Stationery',
    icon: '🎒',
    color: '#2563eb',
    bgColor: 'bg-blue-100',
  },
  {
    id: 'transport',
    nameVi: 'Phương Tiện Giao Thông',
    nameEn: 'Vehicles & Transport',
    icon: '🚗',
    color: '#7c3aed',
    bgColor: 'bg-purple-100',
  },
  {
    id: 'nature',
    nameVi: 'Thiên Nhiên & Thời Tiết',
    nameEn: 'Nature & Weather',
    icon: '☀️',
    color: '#0891b2',
    bgColor: 'bg-cyan-100',
  },
  {
    id: 'colors',
    nameVi: 'Màu Sắc & Hình Khối',
    nameEn: 'Colors & Shapes',
    icon: '🎨',
    color: '#db2777',
    bgColor: 'bg-pink-100',
  },
  {
    id: 'body',
    nameVi: 'Cơ Thể & Trang Phục',
    nameEn: 'Body & Clothes',
    icon: '👕',
    color: '#ea580c',
    bgColor: 'bg-orange-100',
  },
];
