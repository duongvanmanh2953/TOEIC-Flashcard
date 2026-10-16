export interface LangSample {
  id: 'en' | 'ja' | 'zh' | 'ko' | 'de' | 'fr' | 'es';
  countryCode: string;
  langName: string;
  badge: string;
  word: string;
  pronunciation: string;
  pos: string;
  meaning: string;
  example: string;
  highlight: string;
  speechCode: string;
  statsLabel: string;
}

export const MULTI_LANG_SAMPLES: Record<string, LangSample> = {
  en: {
    id: 'en',
    countryCode: 'gb',
    langName: 'Tiếng Anh',
    badge: 'TOEIC ETS & IELTS 8.0',
    word: 'accommodate',
    pronunciation: '/əˈkɑːmədeɪt/',
    pos: 'verb',
    meaning: 'Cung cấp nơi ở; đáp ứng hoặc giải quyết (nhu cầu, mong muốn)',
    example: '"The new convention center is spacious enough to accommodate up to 2,500 participants."',
    highlight: 'accommodate',
    speechCode: 'en-US',
    statsLabel: 'Xuất hiện trong 42% đề đọc TOEIC Part 5 & 7',
  },
  ja: {
    id: 'ja',
    countryCode: 'jp',
    langName: 'Tiếng Nhật',
    badge: 'JLPT N2 - N1 Business',
    word: '改善 (Kaizen)',
    pronunciation: '/kaizen/',
    pos: 'noun / suru-verb',
    meaning: 'Cải tiến liên tục, nâng cao chất lượng và tối ưu hóa quy trình',
    example: '"継続的な改善プロセスにより、業務効率が劇的に向上した。"',
    highlight: '改善',
    speechCode: 'ja-JP',
    statsLabel: 'Trụ cột văn hóa doanh nghiệp Nhật & bài thi JLPT',
  },
  zh: {
    id: 'zh',
    countryCode: 'cn',
    langName: 'Tiếng Trung',
    badge: 'HSK 5 & Thương Mại',
    word: '合作 (Hézuò)',
    pronunciation: 'hé zuò',
    pos: 'verb / noun',
    meaning: 'Hợp tác, cộng tác cùng phát triển trong kinh doanh',
    example: '"我们期待与贵公司建立长期互利的合作关系。"',
    highlight: '合作',
    speechCode: 'zh-CN',
    statsLabel: 'Tần suất xuất hiện hàng đầu trong giao thương & HSK',
  },
  ko: {
    id: 'ko',
    countryCode: 'kr',
    langName: 'Tiếng Hàn',
    badge: 'TOPIK II Cấp 4-6',
    word: '도전 (Dojeon)',
    pronunciation: 'do-jeon',
    pos: 'noun',
    meaning: 'Sự thử thách, dám đương đầu với mục tiêu mới',
    example: '"새로운 기술을 배우는 것은 언제나 가치 있는 도전이다."',
    highlight: '도전',
    speechCode: 'ko-KR',
    statsLabel: 'Chủ đề bài luận văn phổ biến nhất trong đề thi TOPIK',
  },
  de: {
    id: 'de',
    countryCode: 'de',
    langName: 'Tiếng Đức',
    badge: 'Goethe-Zertifikat B2',
    word: 'die Zuverlässigkeit',
    pronunciation: '/ˈtsuːfɛɐ̯ˌlɛsɪçkaɪt/',
    pos: 'noun (Femininum)',
    meaning: 'Sự đáng tin cậy, độ tin cậy và chuẩn mực kỹ thuật',
    example: '"Deutsche Ingenieurkunst steht weltweit für Zuverlässigkeit và Präzision."',
    highlight: 'Zuverlässigkeit',
    speechCode: 'de-DE',
    statsLabel: 'Từ khóa văn hóa công nghiệp Đức hàng đầu',
  },
  fr: {
    id: 'fr',
    countryCode: 'fr',
    langName: 'Tiếng Pháp',
    badge: 'DELF / DALF B2-C1',
    word: 'la bienveillance',
    pronunciation: '/bjɛ̃.vɛ.jɑ̃s/',
    pos: 'noun (Féminin)',
    meaning: 'Lòng nhân ái, sự thấu hiểu và thiện chí trong giao tiếp',
    example: '"Elle écoute ses étudiants avec une immense bienveillance."',
    highlight: 'bienveillance',
    speechCode: 'fr-FR',
    statsLabel: 'Từ vựng cốt lõi biểu cảm cao trong văn học Pháp',
  },
  es: {
    id: 'es',
    countryCode: 'es',
    langName: 'Tiếng Tây Ban Nha',
    badge: 'DELE B2 Internacional',
    word: 'el compromiso',
    pronunciation: '/kom.pɾoˈmi.so/',
    pos: 'noun (Masculino)',
    meaning: 'Sự cam kết, trách nhiệm và quyết tâm thực hiện lời hứa',
    example: '"Nuestro compromiso con la excelencia educativa es inquebrantable."',
    highlight: 'compromiso',
    speechCode: 'es-ES',
    statsLabel: 'Chứng chỉ DELE & giao thương Mỹ Latinh',
  },
};
