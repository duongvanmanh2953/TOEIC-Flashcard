import React from 'react';

export interface CountryFlagProps {
  countryCode?: string; // e.g. 'GB', 'DE', 'ES', 'FR', 'VN', 'US', 'JP', 'CN', 'KR'
  languageId?: string; // e.g. 'en', 'de', 'es', 'vi', 'ja', 'zh', 'ko'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
}

const LANGUAGE_TO_COUNTRY: Record<string, string> = {
  en: 'gb',
  de: 'de',
  es: 'es',
  fr: 'fr',
  zh: 'cn',
  ja: 'jp',
  ko: 'kr',
  th: 'th',
  vi: 'vn',
  pt: 'pt',
  it: 'it',
  ru: 'ru',
  ar: 'sa',
  us: 'us',
};

// 100% Pure Vector SVG flags: Renders authentic national flags immediately with 0ms network latency
// Never falls back to text like "GB" or "JP", eliminating regional indicator letter issues
const SVG_FLAGS: Record<string, React.ReactNode> = {
  // 1. Vương Quốc Anh (UK / English)
  gb: (
    <svg viewBox="0 0 60 36" className="w-full h-full block" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="std-gb-clip">
          <rect width="60" height="36" />
        </clipPath>
      </defs>
      <g clipPath="url(#std-gb-clip)">
        <rect width="60" height="36" fill="#012169" />
        <path d="M0,0 L60,36 M60,0 L0,36" stroke="#ffffff" strokeWidth="7" />
        <path d="M0,0 L30,18 M60,0 L30,18 M0,36 L30,18 M60,36 L30,18" stroke="#C8102E" strokeWidth="4.2" />
        <path d="M30,0 V36 M0,18 H60" stroke="#ffffff" strokeWidth="11" />
        <path d="M30,0 V36 M0,18 H60" stroke="#C8102E" strokeWidth="6.5" />
      </g>
    </svg>
  ),

  // 2. Hoa Kỳ (US / American English / SAT)
  us: (
    <svg viewBox="0 0 60 36" className="w-full h-full block" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="36" fill="#b22234" />
      <rect y="2.77" width="60" height="2.77" fill="#ffffff" />
      <rect y="8.31" width="60" height="2.77" fill="#ffffff" />
      <rect y="13.85" width="60" height="2.77" fill="#ffffff" />
      <rect y="19.38" width="60" height="2.77" fill="#ffffff" />
      <rect y="24.92" width="60" height="2.77" fill="#ffffff" />
      <rect y="30.46" width="60" height="2.77" fill="#ffffff" />
      <rect width="25" height="19.38" fill="#3c3b6e" />
      <circle cx="5" cy="4" r="1.1" fill="#fff" />
      <circle cx="12.5" cy="4" r="1.1" fill="#fff" />
      <circle cx="20" cy="4" r="1.1" fill="#fff" />
      <circle cx="8.7" cy="7.5" r="1.1" fill="#fff" />
      <circle cx="16.2" cy="7.5" r="1.1" fill="#fff" />
      <circle cx="5" cy="11" r="1.1" fill="#fff" />
      <circle cx="12.5" cy="11" r="1.1" fill="#fff" />
      <circle cx="20" cy="11" r="1.1" fill="#fff" />
      <circle cx="8.7" cy="14.5" r="1.1" fill="#fff" />
      <circle cx="16.2" cy="14.5" r="1.1" fill="#fff" />
    </svg>
  ),

  // 3. Nhật Bản (Japan)
  jp: (
    <svg viewBox="0 0 60 36" className="w-full h-full block" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="36" fill="#ffffff" />
      <circle cx="30" cy="18" r="10.8" fill="#bc002d" />
    </svg>
  ),

  // 4. Trung Quốc (China)
  cn: (
    <svg viewBox="0 0 60 36" className="w-full h-full block" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="36" fill="#de2910" />
      <polygon points="10,3.5 12,8.5 17.5,8.5 13,12 15,17 10,13.5 5,17 7,12 2.5,8.5 8,8.5" fill="#ffde00" />
      <polygon points="19,3.5 19.8,5.5 22,5.5 20.2,6.8 20.9,8.8 19,7.5 17.1,8.8 17.8,6.8 16,5.5 18.2,5.5" fill="#ffde00" />
      <polygon points="23,6.5 23.8,8.5 26,8.5 24.2,9.8 24.9,11.8 23,10.5 21.1,11.8 21.8,9.8 20,8.5 22.2,8.5" fill="#ffde00" />
      <polygon points="23,13 23.8,15 26,15 24.2,16.3 24.9,18.3 23,17 21.1,18.3 21.8,16.3 20,15 22.2,15" fill="#ffde00" />
      <polygon points="19,16 19.8,18 22,18 20.2,19.3 20.9,21.3 19,20 17.1,21.3 17.8,19.3 16,18 18.2,18" fill="#ffde00" />
    </svg>
  ),

  // 5. Hàn Quốc (South Korea)
  kr: (
    <svg viewBox="0 0 60 36" className="w-full h-full block" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="36" fill="#ffffff" />
      <g transform="translate(30, 18) rotate(-33.69)">
        <path d="M-8.5,0 A8.5,8.5 0 0,1 8.5,0 A4.25,4.25 0 0,1 0,0 A4.25,4.25 0 0,0 -8.5,0" fill="#cd2e3a" />
        <path d="M8.5,0 A8.5,8.5 0 0,1 -8.5,0 A4.25,4.25 0 0,1 0,0 A4.25,4.25 0 0,0 8.5,0" fill="#0047a0" />
      </g>
      <g fill="#000000" transform="translate(12, 8) rotate(33.69)">
        <rect x="-4.5" y="-3.2" width="9" height="1.1" />
        <rect x="-4.5" y="-1.1" width="9" height="1.1" />
        <rect x="-4.5" y="1.0" width="9" height="1.1" />
      </g>
      <g fill="#000000" transform="translate(48, 28) rotate(33.69)">
        <rect x="-4.5" y="-3.2" width="4" height="1.1" /><rect x="0.5" y="-3.2" width="4" height="1.1" />
        <rect x="-4.5" y="-1.1" width="4" height="1.1" /><rect x="0.5" y="-1.1" width="4" height="1.1" />
        <rect x="-4.5" y="1.0" width="4" height="1.1" /><rect x="0.5" y="1.0" width="4" height="1.1" />
      </g>
      <g fill="#000000" transform="translate(48, 8) rotate(-33.69)">
        <rect x="-4.5" y="-3.2" width="4" height="1.1" /><rect x="0.5" y="-3.2" width="4" height="1.1" />
        <rect x="-4.5" y="-1.1" width="9" height="1.1" />
        <rect x="-4.5" y="1.0" width="4" height="1.1" /><rect x="0.5" y="1.0" width="4" height="1.1" />
      </g>
      <g fill="#000000" transform="translate(12, 28) rotate(-33.69)">
        <rect x="-4.5" y="-3.2" width="9" height="1.1" />
        <rect x="-4.5" y="-1.1" width="4" height="1.1" /><rect x="0.5" y="-1.1" width="4" height="1.1" />
        <rect x="-4.5" y="1.0" width="9" height="1.1" />
      </g>
    </svg>
  ),

  // 6. Đức (Germany)
  de: (
    <svg viewBox="0 0 60 36" className="w-full h-full block" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="12" y="0" fill="#000000" />
      <rect width="60" height="12" y="12" fill="#dd0000" />
      <rect width="60" height="12" y="24" fill="#ffce00" />
    </svg>
  ),

  // 7. Pháp (France)
  fr: (
    <svg viewBox="0 0 60 36" className="w-full h-full block" xmlns="http://www.w3.org/2000/svg">
      <rect width="20" height="36" x="0" fill="#002395" />
      <rect width="20" height="36" x="20" fill="#ffffff" />
      <rect width="20" height="36" x="40" fill="#ed2939" />
    </svg>
  ),

  // 8. Tây Ban Nha (Spain)
  es: (
    <svg viewBox="0 0 60 36" className="w-full h-full block" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="9" y="0" fill="#aa151b" />
      <rect width="60" height="18" y="9" fill="#f1bf00" />
      <rect width="60" height="9" y="27" fill="#aa151b" />
      <g transform="translate(16, 18)">
        <rect x="-4" y="-5" width="8" height="10" rx="2" fill="#aa151b" />
        <rect x="-3" y="-4" width="6" height="8" rx="1.5" fill="#f1bf00" />
        <circle cx="0" cy="-2" r="1.5" fill="#002395" />
        <path d="M-2,2 H2" stroke="#aa151b" strokeWidth="1" />
      </g>
    </svg>
  ),

  // 9. Việt Nam (Vietnam)
  vn: (
    <svg viewBox="0 0 60 36" className="w-full h-full block" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="36" fill="#da251d" />
      <polygon points="30,8 33.2,16.5 42,16.5 35,21.5 37.8,30 30,24.5 22.2,30 25,21.5 18,16.5 26.8,16.5" fill="#ffde00" />
    </svg>
  ),

  // 10. Ý (Italy)
  it: (
    <svg viewBox="0 0 60 36" className="w-full h-full block" xmlns="http://www.w3.org/2000/svg">
      <rect width="20" height="36" x="0" fill="#009246" />
      <rect width="20" height="36" x="20" fill="#ffffff" />
      <rect width="20" height="36" x="40" fill="#ce2b37" />
    </svg>
  ),

  // 11. Nga (Russia)
  ru: (
    <svg viewBox="0 0 60 36" className="w-full h-full block" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="12" y="0" fill="#ffffff" />
      <rect width="60" height="12" y="12" fill="#0039a6" />
      <rect width="60" height="12" y="24" fill="#d52b1e" />
    </svg>
  ),

  // 12. Thái Lan (Thailand)
  th: (
    <svg viewBox="0 0 60 36" className="w-full h-full block" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="6" y="0" fill="#a51931" />
      <rect width="60" height="6" y="6" fill="#f4f5f8" />
      <rect width="60" height="12" y="12" fill="#2d2a4a" />
      <rect width="60" height="6" y="24" fill="#f4f5f8" />
      <rect width="60" height="6" y="30" fill="#a51931" />
    </svg>
  ),

  // 13. Bồ Đào Nha (Portugal)
  pt: (
    <svg viewBox="0 0 60 36" className="w-full h-full block" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="36" x="0" fill="#006600" />
      <rect width="36" height="36" x="24" fill="#ff0000" />
      <circle cx="24" cy="18" r="6" fill="#ffff00" stroke="#000000" strokeWidth="0.5" />
      <rect x="22" y="15" width="4" height="6" fill="#ffffff" stroke="#0000ff" strokeWidth="0.5" />
    </svg>
  ),

  // 14. Ả Rập Xê Út (Saudi Arabia)
  sa: (
    <svg viewBox="0 0 60 36" className="w-full h-full block" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="36" fill="#006C35" />
      <path d="M15,24 H45 M17,23 L21,26 M43,23 L39,26" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      <text x="30" y="17" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">لَا إِلٰهَ</text>
    </svg>
  ),
};

export const CountryFlag: React.FC<CountryFlagProps> = ({
  countryCode,
  languageId,
  size = 'sm',
  className = '',
  alt,
}) => {
  let code = (countryCode || '').toLowerCase().trim();
  if (!code && languageId) {
    const cleanLang = languageId.toLowerCase().trim();
    code = LANGUAGE_TO_COUNTRY[cleanLang] || cleanLang;
  }
  if (!code) {
    code = 'gb';
  }

  // Standardize aliases
  if (code === 'en' || code === 'en-gb') code = 'gb';
  if (code === 'en-us') code = 'us';
  if (code === 'ja') code = 'jp';
  if (code === 'zh') code = 'cn';
  if (code === 'ko') code = 'kr';
  if (code === 'vi') code = 'vn';

  const sizeStyles: Record<string, string> = {
    xs: 'w-4 h-2.5 rounded-[2px]',
    sm: 'w-5.5 h-3.5 rounded-[3px]',
    md: 'w-7 h-4.5 rounded-[4px]',
    lg: 'w-9 h-5.5 rounded-[5px]',
    xl: 'w-12 h-7.5 rounded-[6px]',
  };

  const selectedSize = sizeStyles[size] || sizeStyles.sm;
  const flagSvg = SVG_FLAGS[code] || SVG_FLAGS.gb;

  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden border border-black/10 dark:border-white/20 shrink-0 select-none aspect-[5/3] ${selectedSize} ${className}`}
      title={alt || `Cờ quốc gia: ${code.toUpperCase()}`}
      role="img"
      aria-label={alt || `Cờ quốc gia ${code.toUpperCase()}`}
    >
      {flagSvg}
    </span>
  );
};

export default CountryFlag;
