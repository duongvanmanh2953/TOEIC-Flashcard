import languageStandardsJson from './languageStandards.json';

export interface CertificateLevel {
  id: string;
  name: string;
  badge: string;
  cefrEquivalent?: string;
  description?: string;
}

export interface CertificateInfo {
  id: string;
  name: string;
  fullName: string;
  description: string;
  levels: CertificateLevel[];
}

export interface LanguageCategory {
  id: string;
  name: string;
  description?: string;
}

export interface LanguageStandardConfig {
  languageId: string;
  name: string;
  nativeName: string;
  flag: string;
  defaultCertificateId: string;
  defaultLevelId: string;
  defaultCategoryId: string;
  certificates: CertificateInfo[];
  categories: LanguageCategory[];
}

const rawData: Record<string, LanguageStandardConfig> = (languageStandardsJson as any).languages || {};

// Universal fallback for languages without a custom entry (e.g. Italian, Portuguese, Russian)
export const DEFAULT_FALLBACK_STANDARD: LanguageStandardConfig = {
  languageId: 'general',
  name: 'Standard',
  nativeName: 'Standard',
  flag: '🌐',
  defaultCertificateId: 'cefr',
  defaultLevelId: 'B1',
  defaultCategoryId: 'daily-comm',
  certificates: [
    {
      id: 'cefr',
      name: 'Khung Châu Âu CEFR',
      fullName: 'Common European Framework of Reference',
      description: 'Tiêu chuẩn quốc tế tham chiếu năng lực ngôn ngữ Châu Âu',
      levels: [
        { id: 'A1', name: 'A1 — Beginner (Mới bắt đầu)', badge: 'A1', cefrEquivalent: 'A1', description: 'Căn bản' },
        { id: 'A2', name: 'A2 — Elementary (Sơ cấp)', badge: 'A2', cefrEquivalent: 'A2', description: 'Giao tiếp hàng ngày' },
        { id: 'B1', name: 'B1 — Intermediate (Trung cấp)', badge: 'B1', cefrEquivalent: 'B1', description: 'Độc lập diễn đạt' },
        { id: 'B2', name: 'B2 — Upper-Intermediate (Trung cao)', badge: 'B2', cefrEquivalent: 'B2', description: 'Làm việc chuyên môn' },
        { id: 'C1', name: 'C1 — Advanced (Cao cấp)', badge: 'C1', cefrEquivalent: 'C1', description: 'Thành thạo tự nhiên' },
        { id: 'C2', name: 'C2 — Mastery (Bậc thầy)', badge: 'C2', cefrEquivalent: 'C2', description: 'Bản ngữ đỉnh cao' },
      ],
    },
    {
      id: 'general',
      name: 'Tự do / Tất cả trình độ',
      fullName: 'Chế độ Tự do & Đời sống (Không áp chứng chỉ)',
      description: 'Kho từ vựng tự do cho sở thích hoặc giao tiếp',
      levels: [
        { id: 'ALL', name: 'ALL — Tất cả trình độ (Tự do)', badge: 'ALL', cefrEquivalent: 'ALL', description: 'Không giới hạn' },
        { id: 'Beginner', name: 'Căn bản — Beginner', badge: 'BEG', cefrEquivalent: 'A1', description: 'Mới bắt đầu' },
        { id: 'Intermediate', name: 'Trung cấp — Intermediate', badge: 'INT', cefrEquivalent: 'B1', description: 'Giao tiếp khá' },
        { id: 'Advanced', name: 'Nâng cao — Advanced', badge: 'ADV', cefrEquivalent: 'C1', description: 'Chuyên sâu' },
      ],
    },
  ],
  categories: [
    { id: 'daily-comm', name: 'Giao Tiếp Hàng Ngày', description: 'Hội thoại đời sống thường nhật' },
    { id: 'business', name: 'Kinh Doanh & Công Sở', description: 'Giao tiếp văn phòng và công việc' },
    { id: 'travel', name: 'Du Lịch & Văn Hóa', description: 'Giao tiếp du lịch, ẩm thực và đời sống' },
    { id: 'grammar-vocab', name: 'Ngữ Pháp & Từ Vựng Nền Tảng', description: 'Nền tảng câu và từ loại cơ bản' },
    { id: 'general', name: 'Tổng Hợp & Tự Do', description: 'Kho từ vựng tổng hợp tự do' },
  ],
};

/**
 * Get language standard config by language ID (e.g. 'en', 'ko', 'ja', 'zh', etc.)
 */
export function getLanguageStandard(languageId?: string): LanguageStandardConfig {
  if (!languageId) return rawData['en'] || DEFAULT_FALLBACK_STANDARD;
  const clean = languageId.toLowerCase().trim().split(/[-_]/)[0];
  return rawData[clean] || DEFAULT_FALLBACK_STANDARD;
}

/**
 * Get available certificates for a given language
 */
export function getCertificatesForLanguage(languageId?: string): CertificateInfo[] {
  const std = getLanguageStandard(languageId);
  return std.certificates && std.certificates.length > 0 ? std.certificates : DEFAULT_FALLBACK_STANDARD.certificates;
}

/**
 * Get available categories for a given language
 */
export function getCategoriesForLanguage(languageId?: string): LanguageCategory[] {
  const std = getLanguageStandard(languageId);
  return std.categories && std.categories.length > 0 ? std.categories : DEFAULT_FALLBACK_STANDARD.categories;
}

/**
 * Get default category name for a language (e.g. for Korean -> 'Ôn Thi TOPIK I & II (토픽 시험 대비)')
 */
export function getDefaultCategoryForLanguage(languageId?: string): string {
  const std = getLanguageStandard(languageId);
  const def = std.categories.find((c) => c.id === std.defaultCategoryId);
  return def ? def.name : std.categories[0]?.name || 'Tổng Hợp & Tự Do';
}

/**
 * Get default certificate for a language (e.g. for Korean -> TOPIK, for English -> TOEIC)
 */
export function getDefaultCertificateForLanguage(languageId?: string): CertificateInfo {
  const std = getLanguageStandard(languageId);
  const def = std.certificates.find((c) => c.id === std.defaultCertificateId);
  return def || std.certificates[0] || DEFAULT_FALLBACK_STANDARD.certificates[0];
}

/**
 * Get default level string for a language (e.g. for Korean -> 'topik-1' / 'TOPIK I - Cấp 1')
 */
export function getDefaultLevelForLanguage(languageId?: string): { id: string; name: string; badge: string; cefrEquivalent: string } {
  const cert = getDefaultCertificateForLanguage(languageId);
  const lvl = cert.levels[0] || { id: 'ALL', name: 'ALL — Tất cả', badge: 'ALL', cefrEquivalent: 'ALL' };
  return {
    id: lvl.id,
    name: lvl.name,
    badge: lvl.badge,
    cefrEquivalent: lvl.cefrEquivalent || 'B1',
  };
}

/**
 * Maps any arbitrary level id or display name (e.g. 'topik-3', 'JLPT N2', 'HSK 4', '500+')
 * to a standard CEFR enum value ('A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'ALL')
 * to ensure 100% compatibility with backend database enums.
 */
export function mapToCefrEquivalent(levelValue?: string): string {
  if (!levelValue) return 'B1';
  const clean = levelValue.trim().toUpperCase();
  if (['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'ALL'].includes(clean)) {
    return clean;
  }

  if (clean.includes('TẤT CẢ') || clean.includes('ALL') || clean.includes('TỰ DO') || clean.includes('FREE')) {
    return 'ALL';
  }

  // Scan all language standards to find matching level
  for (const langKey of Object.keys(rawData)) {
    const std = rawData[langKey];
    for (const cert of std.certificates) {
      for (const lvl of cert.levels) {
        if (
          lvl.id.toUpperCase() === clean ||
          lvl.name.toUpperCase() === clean ||
          lvl.badge.toUpperCase() === clean ||
          clean.includes(lvl.id.toUpperCase()) ||
          clean.includes(lvl.badge.toUpperCase())
        ) {
          if (lvl.cefrEquivalent) return lvl.cefrEquivalent;
        }
      }
    }
  }

  // Common heuristic mappings for Korean, Japanese, Chinese, TOEIC, IELTS
  if (clean.includes('TOPIK 1') || clean.includes('1급') || clean.includes('SƠ CẤP 1') || clean.includes('N5') || clean.includes('HSK 1') || clean.includes('350')) return 'A1';
  if (clean.includes('TOPIK 2') || clean.includes('2급') || clean.includes('SƠ CẤP 2') || clean.includes('SƠ CẤP') || clean.includes('N4') || clean.includes('HSK 2') || clean.includes('450')) return 'A2';
  if (clean.includes('TOPIK 3') || clean.includes('3급') || clean.includes('TRUNG CẤP 1') || clean.includes('N3') || clean.includes('HSK 3') || clean.includes('500') || clean.includes('600')) return 'B1';
  if (clean.includes('TOPIK 4') || clean.includes('4급') || clean.includes('TRUNG CẤP 2') || clean.includes('TRUNG CẤP') || clean.includes('N2') || clean.includes('HSK 4') || clean.includes('650') || clean.includes('750')) return 'B2';
  if (clean.includes('TOPIK 5') || clean.includes('5급') || clean.includes('CAO CẤP 1') || clean.includes('N1') || clean.includes('HSK 5') || clean.includes('800') || clean.includes('850')) return 'C1';
  if (clean.includes('TOPIK 6') || clean.includes('6급') || clean.includes('CAO CẤP 2') || clean.includes('CAO CẤP') || clean.includes('HSK 6') || clean.includes('900') || clean.includes('950')) return 'C2';

  if (clean.includes('4.5') || clean.includes('5.0')) return 'B1';
  if (clean.includes('5.5') || clean.includes('6.0') || clean.includes('6.5')) return 'B2';
  if (clean.includes('7.0') || clean.includes('7.5') || clean.includes('8.0')) return 'C1';
  if (clean.includes('8.5') || clean.includes('9.0')) return 'C2';

  return 'B1';
}

/**
 * Find certificate and level detail by level ID or level name
 */
export function findCertificateAndLevel(languageId: string, levelValue: string): { cert?: CertificateInfo; level?: CertificateLevel } {
  const std = getLanguageStandard(languageId);
  const clean = (levelValue || '').trim().toLowerCase();
  for (const cert of std.certificates) {
    for (const lvl of cert.levels) {
      if (
        lvl.id.toLowerCase() === clean ||
        lvl.name.toLowerCase() === clean ||
        lvl.badge.toLowerCase() === clean
      ) {
        return { cert, level: lvl };
      }
    }
  }
  return {};
}
