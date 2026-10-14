import React from 'react';

/**
 * SUNNY MEADOW V4.0 - MASTER CENTRALIZED SVG SPRITE VAULT
 * Strictly adheres to AGENTS.md (V4.0 Spec):
 * Contains #svg-sunny-fox, #svg-star-gold, #svg-star-empty, #svg-card-back,
 * and the 10 mandatory vocabulary illustrations:
 * #svg-apple, #svg-banana, #svg-strawberry, #svg-orange, #svg-cat,
 * #svg-dog, #svg-rabbit, #svg-frog, #svg-sun, #svg-tree.
 */
export const SunnyMeadowSvgVault: React.FC = () => {
  return (
    <svg
      id="sunny-meadow-svg-vault"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'none' }}
      aria-hidden="true"
    >
      <defs>
        {/* 1. MASCOT GỐC DUY NHẤT: CÁO SUNNY (#svg-sunny-fox) */}
        <symbol id="svg-sunny-fox" viewBox="0 0 120 120">
          {/* Đuôi bông xù */}
          <path
            d="M85 82 C112 78, 118 48, 95 44 C82 42, 78 62, 74 75 Z"
            fill="#FF7F3F"
            stroke="#3D2622"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M97 44 C112 47, 112 64, 98 67 C92 58, 92 50, 97 44 Z"
            fill="#FFF3E0"
            stroke="#3D2622"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Thân cáo */}
          <ellipse cx="60" cy="88" rx="26" ry="22" fill="#FF7F3F" stroke="#3D2622" strokeWidth="4" />
          <ellipse cx="60" cy="90" rx="16" ry="15" fill="#FFF3E0" />
          {/* Hai tai nhọn */}
          <polygon
            points="22,48 14,12 46,30"
            fill="#FF7F3F"
            stroke="#3D2622"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <polygon points="24,42 19,19 40,32" fill="#FFADAD" />
          <polygon
            points="98,48 106,12 74,30"
            fill="#FF7F3F"
            stroke="#3D2622"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <polygon points="96,42 101,19 80,32" fill="#FFADAD" />
          {/* Đầu cáo */}
          <ellipse cx="60" cy="54" rx="38" ry="30" fill="#FF7F3F" stroke="#3D2622" strokeWidth="4" />
          {/* Mảng lông trắng hai bên má */}
          <path
            d="M22 54 C22 74, 45 84, 60 84 C75 84, 98 74, 98 54 C86 62, 72 60, 60 66 C48 60, 34 62, 22 54 Z"
            fill="#FFF3E0"
            stroke="#3D2622"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Mắt to long lanh */}
          <circle cx="43" cy="50" r="6.5" fill="#3D2622" />
          <circle cx="41" cy="47.5" r="2.3" fill="#FFFFFF" />
          <circle cx="77" cy="50" r="6.5" fill="#3D2622" />
          <circle cx="75" cy="47.5" r="2.3" fill="#FFFFFF" />
          {/* Má hồng */}
          <ellipse cx="32" cy="61" rx="6.5" ry="4" fill="#FF85A1" opacity="0.75" />
          <ellipse cx="88" cy="61" rx="6.5" ry="4" fill="#FF85A1" opacity="0.75" />
          {/* Mũi & Miệng cười */}
          <ellipse cx="60" cy="60" rx="5.5" ry="4" fill="#3D2622" />
          <path
            className="fox-mouth"
            d="M52 67 Q60 75 68 67"
            fill="none"
            stroke="#3D2622"
            strokeWidth="3.8"
            strokeLinecap="round"
          />
          {/* Chiếc lá nhỏ trên đầu */}
          <path
            d="M60 24 C60 12, 76 10, 74 22 C72 28, 62 26, 60 24 Z"
            fill="#4ADE80"
            stroke="#3D2622"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </symbol>

        {/* 2. ÔNG SAO VÀNG CHIẾN THẮNG CÓ MẶT CƯỜI (#svg-star-gold) */}
        <symbol id="svg-star-gold" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="starGoldGradV4" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="45%" stopColor="#FACC15" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
          </defs>
          {/* Tia sáng lấp lánh quanh sao */}
          <circle cx="20" cy="24" r="3.5" fill="#FEF08A" />
          <circle cx="102" cy="28" r="4" fill="#FEF08A" />
          <circle cx="96" cy="98" r="3" fill="#FDE047" />
          {/* Thân ngôi sao 5 cánh bầu bĩnh */}
          <path
            d="M60 10 L74 39 L106 43 L82 65 L88 97 L60 81 L32 97 L38 65 L14 43 L46 39 Z"
            fill="url(#starGoldGradV4)"
            stroke="#9A3412"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          {/* Highlight bóng kính */}
          <path
            d="M58 18 L48 39 L24 42"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.7"
          />
          {/* Khuôn mặt Ông Sao đáng yêu */}
          <circle cx="49" cy="55" r="4.2" fill="#431407" />
          <circle cx="47.5" cy="53.5" r="1.5" fill="#FFFFFF" />
          <circle cx="71" cy="55" r="4.2" fill="#431407" />
          <circle cx="69.5" cy="53.5" r="1.5" fill="#FFFFFF" />
          <ellipse cx="42" cy="61" rx="4.5" ry="2.5" fill="#FB7185" opacity="0.65" />
          <ellipse cx="78" cy="61" rx="4.5" ry="2.5" fill="#FB7185" opacity="0.65" />
          <path
            d="M54 63 Q60 69 66 63"
            fill="none"
            stroke="#431407"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </symbol>

        {/* 3. ÔNG SAO RỖNG CHƯA ĐẠT (#svg-star-empty) */}
        <symbol id="svg-star-empty" viewBox="0 0 120 120">
          <path
            d="M60 10 L74 39 L106 43 L82 65 L88 97 L60 81 L32 97 L38 65 L14 43 L46 39 Z"
            fill="#E2E8F0"
            stroke="#94A3B8"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <circle cx="49" cy="55" r="3.5" fill="#94A3B8" />
          <circle cx="71" cy="55" r="3.5" fill="#94A3B8" />
          <path
            d="M55 65 Q60 63 65 65"
            fill="none"
            stroke="#94A3B8"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </symbol>

        {/* 4. MẶT LƯNG THẺ BÀI RỪNG XANH (#svg-card-back & #svg-card-back-leaf alias) */}
        <symbol id="svg-card-back" viewBox="0 0 140 176">
          <rect x="6" y="6" width="128" height="164" rx="20" fill="#10B981" stroke="#047857" strokeWidth="4" />
          <rect
            x="16"
            y="16"
            width="108"
            height="144"
            rx="14"
            fill="none"
            stroke="#A7F3D0"
            strokeWidth="3"
            strokeDasharray="6 6"
          />
          <circle cx="70" cy="88" r="32" fill="#ECFDF5" stroke="#047857" strokeWidth="3.5" />
          <path
            d="M70 64 C86 64, 90 88, 70 108 C50 88, 54 64, 70 64 Z"
            fill="#34D399"
            stroke="#065F46"
            strokeWidth="3"
          />
          <path d="M70 68 L70 104" stroke="#065F46" strokeWidth="3" strokeLinecap="round" />
        </symbol>
        <symbol id="svg-card-back-leaf" viewBox="0 0 140 176">
          <use href="#svg-card-back" />
        </symbol>

        {/* 5. KHO HÌNH ẢNH TỪ VỰNG BẮT BUỘC ĐI KÈM CHỮ (V4.0 SPEC) */}
        {/* Quả Táo Đỏ (#svg-apple & #svg-item-apple) */}
        <symbol id="svg-apple" viewBox="0 0 100 100">
          <path d="M50 26 C46 14, 52 10, 56 10" fill="none" stroke="#78350F" strokeWidth="5" strokeLinecap="round" />
          <path
            d="M52 20 C62 10, 78 14, 72 26 C66 32, 56 26, 52 20 Z"
            fill="#22C55E"
            stroke="#14532D"
            strokeWidth="3.5"
          />
          <path
            d="M50 30 C30 24, 14 40, 18 64 C22 84, 38 92, 50 86 C62 92, 78 84, 82 64 C86 40, 70 24, 50 30 Z"
            fill="#EF4444"
            stroke="#7F1D1D"
            strokeWidth="4"
          />
          <ellipse cx="33" cy="48" rx="5" ry="10" transform="rotate(-20 33 48)" fill="#FCA5A5" opacity="0.7" />
        </symbol>
        <symbol id="svg-item-apple" viewBox="0 0 100 100">
          <use href="#svg-apple" />
        </symbol>

        {/* Quả Chuối Vàng (#svg-banana & #svg-item-banana) */}
        <symbol id="svg-banana" viewBox="0 0 100 100">
          <path
            d="M24 72 C46 88, 84 68, 82 24 C81 18, 74 16, 72 22 C66 54, 42 66, 22 60 C16 59, 18 68, 24 72 Z"
            fill="#FACC15"
            stroke="#854D0E"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="M76 20 L82 14" stroke="#713F12" strokeWidth="5" strokeLinecap="round" />
        </symbol>
        <symbol id="svg-item-banana" viewBox="0 0 100 100">
          <use href="#svg-banana" />
        </symbol>

        {/* Quả Dâu Tây (#svg-strawberry & #svg-item-strawberry) */}
        <symbol id="svg-strawberry" viewBox="0 0 100 100">
          <path
            d="M50 88 C28 88, 18 54, 26 36 C32 24, 68 24, 74 36 C82 54, 72 88, 50 88 Z"
            fill="#F43F5E"
            stroke="#881337"
            strokeWidth="4"
          />
          <path
            d="M32 30 L50 38 L68 30 L58 22 L50 14 L42 22 Z"
            fill="#22C55E"
            stroke="#14532D"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <circle cx="40" cy="48" r="2.2" fill="#FEF08A" />
          <circle cx="60" cy="48" r="2.2" fill="#FEF08A" />
          <circle cx="50" cy="60" r="2.2" fill="#FEF08A" />
          <circle cx="38" cy="68" r="2.2" fill="#FEF08A" />
          <circle cx="62" cy="68" r="2.2" fill="#FEF08A" />
          <circle cx="50" cy="76" r="2.2" fill="#FEF08A" />
        </symbol>
        <symbol id="svg-item-strawberry" viewBox="0 0 100 100">
          <use href="#svg-strawberry" />
        </symbol>

        {/* Quả Cam (#svg-orange & #svg-item-orange) */}
        <symbol id="svg-orange" viewBox="0 0 100 100">
          <circle cx="50" cy="56" r="32" fill="#FB923C" stroke="#9A3412" strokeWidth="4" />
          <path
            d="M50 24 C56 12, 72 14, 66 24 C60 28, 52 26, 50 24 Z"
            fill="#22C55E"
            stroke="#14532D"
            strokeWidth="3.5"
          />
          <circle cx="36" cy="44" r="4" fill="#FFEDD5" opacity="0.65" />
        </symbol>
        <symbol id="svg-item-orange" viewBox="0 0 100 100">
          <use href="#svg-orange" />
        </symbol>

        {/* Cà Rốt (#svg-item-carrot) */}
        <symbol id="svg-item-carrot" viewBox="0 0 100 100">
          <path d="M50 26 C38 8, 28 16, 44 28" fill="#57CC99" stroke="#2D8A61" strokeWidth="2.5" />
          <path d="M50 26 C50 6, 62 6, 54 26" fill="#80ED99" stroke="#2D8A61" strokeWidth="2.5" />
          <path d="M50 26 C66 10, 74 20, 56 28" fill="#57CC99" stroke="#2D8A61" strokeWidth="2.5" />
          <path d="M34 30 Q50 24 66 30 L54 86 C52 92, 48 92, 46 86 Z" fill="#FF9F1C" stroke="#D97706" strokeWidth="2.5" />
        </symbol>

        {/* Con Mèo Cam (#svg-cat) */}
        <symbol id="svg-cat" viewBox="0 0 100 100">
          <polygon points="22,46 18,16 44,30" fill="#FDBA74" stroke="#7C2D12" strokeWidth="4" strokeLinejoin="round" />
          <polygon points="78,46 82,16 56,30" fill="#FDBA74" stroke="#7C2D12" strokeWidth="4" strokeLinejoin="round" />
          <ellipse cx="50" cy="56" rx="32" ry="26" fill="#FDBA74" stroke="#7C2D12" strokeWidth="4" />
          <circle cx="37" cy="52" r="5" fill="#431407" />
          <circle cx="63" cy="52" r="5" fill="#431407" />
          <polygon points="46,60 54,60 50,65" fill="#FB7185" />
          <path d="M43 68 Q50 73 57 68" fill="none" stroke="#431407" strokeWidth="3" strokeLinecap="round" />
          <line x1="12" y1="56" x2="26" y2="58" stroke="#7C2D12" strokeWidth="3" strokeLinecap="round" />
          <line x1="12" y1="64" x2="26" y2="63" stroke="#7C2D12" strokeWidth="3" strokeLinecap="round" />
          <line x1="88" y1="56" x2="74" y2="58" stroke="#7C2D12" strokeWidth="3" strokeLinecap="round" />
          <line x1="88" y1="64" x2="74" y2="63" stroke="#7C2D12" strokeWidth="3" strokeLinecap="round" />
        </symbol>

        {/* Con Chó Cún (#svg-dog) */}
        <symbol id="svg-dog" viewBox="0 0 100 100">
          <ellipse cx="20" cy="52" rx="10" ry="20" transform="rotate(15 20 52)" fill="#92400E" stroke="#451A03" strokeWidth="4" />
          <ellipse cx="80" cy="52" rx="10" ry="20" transform="rotate(-15 80 52)" fill="#92400E" stroke="#451A03" strokeWidth="4" />
          <ellipse cx="50" cy="54" rx="30" ry="26" fill="#FDE68A" stroke="#451A03" strokeWidth="4" />
          <circle cx="38" cy="48" r="5" fill="#451A03" />
          <circle cx="62" cy="48" r="5" fill="#451A03" />
          <ellipse cx="50" cy="58" rx="6" ry="4.5" fill="#451A03" />
          <path d="M42 66 Q50 72 58 66" fill="none" stroke="#451A03" strokeWidth="3.2" strokeLinecap="round" />
        </symbol>

        {/* Con Thỏ Trắng (#svg-rabbit) */}
        <symbol id="svg-rabbit" viewBox="0 0 100 100">
          <ellipse cx="38" cy="28" rx="8" ry="22" fill="#FFFFFF" stroke="#334155" strokeWidth="4" />
          <ellipse cx="38" cy="28" rx="4" ry="15" fill="#FDA4AF" />
          <ellipse cx="62" cy="28" rx="8" ry="22" fill="#FFFFFF" stroke="#334155" strokeWidth="4" />
          <ellipse cx="62" cy="28" rx="4" ry="15" fill="#FDA4AF" />
          <ellipse cx="50" cy="62" rx="28" ry="24" fill="#FFFFFF" stroke="#334155" strokeWidth="4" />
          <circle cx="39" cy="58" r="4.5" fill="#E11D48" />
          <circle cx="61" cy="58" r="4.5" fill="#E11D48" />
          <ellipse cx="50" cy="65" rx="4" ry="3" fill="#FB7185" />
          <path d="M44 71 Q50 76 56 71" fill="none" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
        </symbol>

        {/* Con Ếch Cốm (#svg-frog & #svg-color-frog) */}
        <symbol id="svg-frog" viewBox="0 0 100 100">
          <circle cx="33" cy="34" r="12" fill="#4ADE80" stroke="#14532D" strokeWidth="4" />
          <circle cx="67" cy="34" r="12" fill="#4ADE80" stroke="#14532D" strokeWidth="4" />
          <circle cx="33" cy="34" r="5.5" fill="#14532D" />
          <circle cx="67" cy="34" r="5.5" fill="#14532D" />
          <ellipse cx="50" cy="60" rx="34" ry="24" fill="#4ADE80" stroke="#14532D" strokeWidth="4" />
          <ellipse cx="50" cy="67" rx="22" ry="13" fill="#DCFCE7" />
          <path d="M36 56 Q50 66 64 56" fill="none" stroke="#14532D" strokeWidth="3.5" strokeLinecap="round" />
        </symbol>
        <symbol id="svg-color-frog" viewBox="0 0 100 100">
          <use href="#svg-frog" />
        </symbol>

        {/* Ông Mặt Trời (#svg-sun) */}
        <symbol id="svg-sun" viewBox="0 0 100 100">
          <g stroke="#EA580C" strokeWidth="5" strokeLinecap="round">
            <line x1="50" y1="8" x2="50" y2="18" />
            <line x1="50" y1="82" x2="50" y2="92" />
            <line x1="8" y1="50" x2="18" y2="50" />
            <line x1="82" y1="50" x2="92" y2="50" />
            <line x1="20" y1="20" x2="28" y2="28" />
            <line x1="72" y1="72" x2="80" y2="80" />
            <line x1="80" y1="20" x2="72" y2="28" />
            <line x1="28" y1="72" x2="20" y2="80" />
          </g>
          <circle cx="50" cy="50" r="24" fill="#FACC15" stroke="#EA580C" strokeWidth="4" />
          <circle cx="42" cy="46" r="3.5" fill="#7C2D12" />
          <circle cx="58" cy="46" r="3.5" fill="#7C2D12" />
          <path d="M43 56 Q50 62 57 56" fill="none" stroke="#7C2D12" strokeWidth="3" strokeLinecap="round" />
        </symbol>

        {/* Cây Cổ Thụ Xanh (#svg-tree) */}
        <symbol id="svg-tree" viewBox="0 0 100 100">
          <rect x="42" y="56" width="16" height="32" rx="4" fill="#92400E" stroke="#451A03" strokeWidth="4" />
          <circle cx="50" cy="36" r="22" fill="#22C55E" stroke="#14532D" strokeWidth="4" />
          <circle cx="34" cy="48" r="16" fill="#4ADE80" stroke="#14532D" strokeWidth="4" />
          <circle cx="66" cy="48" r="16" fill="#16A34A" stroke="#14532D" strokeWidth="4" />
        </symbol>

        {/* Giỏ Mây Picnic (#svg-picnic-basket) */}
        <symbol id="svg-picnic-basket" viewBox="0 0 140 120">
          <path d="M50 40 Q70 10 90 40" fill="none" stroke="#92400E" strokeWidth="5" strokeLinecap="round" />
          <path d="M25 44 L115 44 L105 106 L35 106 Z" fill="#D97706" stroke="#92400E" strokeWidth="4" strokeLinejoin="round" />
          <line x1="30" y1="44" x2="110" y2="44" stroke="#FBBF24" strokeWidth="6" strokeLinecap="round" />
          <path d="M45 44 L55 106 M70 44 L70 106 M95 44 L85 106" stroke="#B45309" strokeWidth="3" />
        </symbol>

        {/* Pháo Hoa (#svg-firework) */}
        <symbol id="svg-firework" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="8" fill="#FFD166" />
          <line x1="60" y1="60" x2="60" y2="10" stroke="#FF5A5F" strokeWidth="4" strokeLinecap="round" />
          <line x1="60" y1="60" x2="60" y2="110" stroke="#FF5A5F" strokeWidth="4" strokeLinecap="round" />
          <line x1="60" y1="60" x2="10" y2="60" stroke="#4CC9F0" strokeWidth="4" strokeLinecap="round" />
          <line x1="60" y1="60" x2="110" y2="60" stroke="#4CC9F0" strokeWidth="4" strokeLinecap="round" />
          <circle cx="60" cy="10" r="4" fill="#FFD166" />
          <circle cx="60" cy="110" r="4" fill="#FFD166" />
          <circle cx="10" cy="60" r="4" fill="#FFD166" />
          <circle cx="110" cy="60" r="4" fill="#FFD166" />
        </symbol>
      </defs>
    </svg>
  );
};

export default SunnyMeadowSvgVault;
