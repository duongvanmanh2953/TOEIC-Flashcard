import React from 'react';

/**
 * SUNNY MEADOW V2.0 / V3.0 - MASTER CENTRALIZED SVG SPRITE VAULT
 * Strictly satisfies Requirement 6:
 * Single centralized <svg id="sunny-meadow-svg-vault"> containing all symbols
 * for Sunny the Fox Mascot, 3D Memory Card Back with Leaf texture, Stars, Fireworks,
 * fruits, ecological scenes and rewards.
 */
export const SunnyMeadowSvgVault: React.FC = () => {
  return (
    <svg
      id="sunny-meadow-svg-vault"
      style={{ display: 'none' }}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* 1. MASCOT CHÍNH DUY NHẤT: CÁO SUNNY (SUNNY THE FOX) */}
        <symbol id="svg-sunny-fox" viewBox="0 0 180 180">
          {/* Đuôi bông xù 2 màu cam & kem */}
          <path d="M122 118 C162 104, 174 140, 144 156 C124 166, 108 148, 114 132 Z" fill="#FF7E67" />
          <path d="M146 125 C164 130, 162 148, 144 156 C136 148, 138 132, 146 125 Z" fill="#FFFDF5" />
          {/* Thân & Bụng kem mềm */}
          <ellipse cx="90" cy="132" rx="36" ry="32" fill="#FF7E67" />
          <ellipse cx="90" cy="136" rx="23" ry="22" fill="#FFFDF5" />
          {/* Khăn quàng lá non xanh tươi */}
          <path d="M60 108 Q90 122 120 108 L114 122 Q90 132 66 122 Z" fill="#57CC99" />
          <path d="M100 116 L110 140 L122 135 L112 114 Z" fill="#2D8A61" />
          {/* Đôi tai to biểu cảm */}
          <path d="M38 64 L26 18 L72 44 Z" fill="#FF7E67" stroke="#E0533C" strokeWidth="3" strokeLinejoin="round" />
          <path d="M40 56 L33 28 L62 44 Z" fill="#FFD166" />
          <path d="M142 64 L154 18 L108 44 Z" fill="#FF7E67" stroke="#E0533C" strokeWidth="3" strokeLinejoin="round" />
          <path d="M140 56 L147 28 L118 44 Z" fill="#FFD166" />
          {/* Khuôn mặt bầu bĩnh đáng yêu */}
          <ellipse cx="90" cy="76" rx="54" ry="42" fill="#FF7E67" />
          <path d="M36 76 C36 106, 70 118, 90 118 C110 118, 144 106, 144 76 C128 76, 108 88, 90 102 C72 88, 52 76, 36 76 Z" fill="#FFFDF5" />
          {/* Mắt to long lanh */}
          <circle cx="65" cy="72" r="8.5" fill="#1E293B" />
          <circle cx="62" cy="69" r="3.2" fill="#FFFFFF" />
          <circle cx="68" cy="75" r="1.5" fill="#FFFFFF" />
          <circle cx="115" cy="72" r="8.5" fill="#1E293B" />
          <circle cx="112" cy="69" r="3.2" fill="#FFFFFF" />
          <circle cx="118" cy="75" r="1.5" fill="#FFFFFF" />
          {/* Má hồng phấn */}
          <ellipse cx="50" cy="85" rx="8" ry="4.5" fill="#FF758F" opacity="0.8" />
          <ellipse cx="130" cy="85" rx="8" ry="4.5" fill="#FF758F" opacity="0.8" />
          {/* Mũi đen nhỏ */}
          <ellipse cx="90" cy="88" rx="7" ry="5" fill="#1E293B" />
          {/* Miệng cười tươi */}
          <path d="M80 96 Q90 106 100 96" fill="none" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
          {/* Mầm cây nhỏ trên đầu */}
          <path d="M90 34 L90 22" stroke="#2D8A61" strokeWidth="4" strokeLinecap="round" />
          <path d="M90 24 C90 12, 108 10, 110 20 C110 28, 96 30, 90 24 Z" fill="#80ED99" />
        </symbol>

        {/* 2. MẶT LƯNG THẺ BÀI TRÍ NHỚ VÂN LÁ RỪNG (MEMORY CARD BACK LEAF - GAME 1) */}
        <symbol id="svg-card-back-leaf" viewBox="0 0 140 180">
          {/* Nền thẻ kem vàng tươi */}
          <rect x="4" y="4" width="132" height="172" rx="24" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="4" />
          {/* Khung viền hoa văn đồng cỏ bên trong */}
          <rect x="12" y="12" width="116" height="156" rx="18" fill="#FFFBEB" stroke="#FCD34D" strokeWidth="2.5" strokeDasharray="6 4" />
          {/* Họa tiết chiếc lá sồi trung tâm */}
          <circle cx="70" cy="90" r="38" fill="#ECFDF5" stroke="#10B981" strokeWidth="2.5" />
          <path d="M70 60 C52 72, 54 98, 70 120 C86 98, 88 72, 70 60 Z" fill="#34D399" stroke="#059669" strokeWidth="2.5" />
          <line x1="70" y1="62" x2="70" y2="120" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="70" y1="80" x2="60" y2="72" stroke="#047857" strokeWidth="2" strokeLinecap="round" />
          <line x1="70" y1="92" x2="80" y2="84" stroke="#047857" strokeWidth="2" strokeLinecap="round" />
          <line x1="70" y1="104" x2="60" y2="96" stroke="#047857" strokeWidth="2" strokeLinecap="round" />
          {/* 4 góc ngôi sao nhỏ xinh */}
          <polygon points="26,20 28,26 34,26 29,30 31,36 26,32 21,36 23,30 18,26 24,26" fill="#F59E0B" />
          <polygon points="114,20 116,26 122,26 117,30 119,36 114,32 109,36 111,30 106,26 112,26" fill="#F59E0B" />
          <polygon points="26,144 28,150 34,150 29,154 31,160 26,156 21,160 23,154 18,150 24,150" fill="#F59E0B" />
          <polygon points="114,144 116,150 122,150 117,154 119,160 114,156 109,160 111,154 106,150 112,150" fill="#F59E0B" />
        </symbol>

        {/* 3. NGÔI SAO VÀNG RỰC RỠ (GOLD STAR REWARD) */}
        <symbol id="svg-star-gold" viewBox="0 0 100 100">
          <polygon points="50,6 63,33 94,37 72,59 77,90 50,75 23,90 28,59 6,37 37,33" fill="#FFD166" stroke="#D97706" strokeWidth="3.5" strokeLinejoin="round" />
          <polygon points="50,16 60,36 83,39 66,56 70,80 50,68 30,80 34,56 17,39 40,36" fill="#FFF3B0" />
          {/* Mắt & Miệng cười đáng yêu */}
          <circle cx="43" cy="46" r="3.5" fill="#78350F" />
          <circle cx="57" cy="46" r="3.5" fill="#78350F" />
          <path d="M45 54 Q50 59 55 54" fill="none" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
        </symbol>

        {/* 4. NGÔI SAO RỖNG (EMPTY STAR) */}
        <symbol id="svg-star-empty" viewBox="0 0 100 100">
          <polygon points="50,6 63,33 94,37 72,59 77,90 50,75 23,90 28,59 6,37 37,33" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="3" strokeLinejoin="round" />
          <polygon points="50,16 60,36 83,39 66,56 70,80 50,68 30,80 34,56 17,39 40,36" fill="#F8FAFC" />
        </symbol>

        {/* 5. PHÁO HOA NỔ BUNG (FIREWORK BURST) */}
        <symbol id="svg-firework" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="8" fill="#FFD166" />
          <line x1="60" y1="60" x2="60" y2="10" stroke="#FF5A5F" strokeWidth="4" strokeLinecap="round" />
          <line x1="60" y1="60" x2="60" y2="110" stroke="#FF5A5F" strokeWidth="4" strokeLinecap="round" />
          <line x1="60" y1="60" x2="10" y2="60" stroke="#4CC9F0" strokeWidth="4" strokeLinecap="round" />
          <line x1="60" y1="60" x2="110" y2="60" stroke="#4CC9F0" strokeWidth="4" strokeLinecap="round" />
          <line x1="60" y1="60" x2="25" y2="25" stroke="#57CC99" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="60" y1="60" x2="95" y2="95" stroke="#57CC99" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="60" y1="60" x2="95" y2="25" stroke="#C77DFF" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="60" y1="60" x2="25" y2="95" stroke="#C77DFF" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="60" cy="10" r="4" fill="#FFD166" />
          <circle cx="60" cy="110" r="4" fill="#FFD166" />
          <circle cx="10" cy="60" r="4" fill="#FFD166" />
          <circle cx="110" cy="60" r="4" fill="#FFD166" />
          <circle cx="25" cy="25" r="3.5" fill="#FF758F" />
          <circle cx="95" cy="95" r="3.5" fill="#FF758F" />
          <circle cx="95" cy="25" r="3.5" fill="#4CC9F0" />
          <circle cx="25" cy="95" r="3.5" fill="#4CC9F0" />
        </symbol>

        {/* 6. VẬT PHẨM TRÁI CÂY & NÔNG TRẠI (FRUITS & HARVEST) */}
        {/* Dâu tây */}
        <symbol id="svg-item-strawberry" viewBox="0 0 100 100">
          <path d="M50 24 C26 24, 18 52, 34 78 C42 90, 58 90, 66 78 C82 52, 74 24, 50 24 Z" fill="#FF4D6D" stroke="#C9184A" strokeWidth="2.5" />
          <path d="M32 26 Q50 36 68 26 Q58 16 50 22 Q42 16 32 26 Z" fill="#57CC99" stroke="#2D8A61" strokeWidth="2" />
          <circle cx="40" cy="46" r="2.2" fill="#FFD166" />
          <circle cx="60" cy="46" r="2.2" fill="#FFD166" />
          <circle cx="50" cy="58" r="2.2" fill="#FFD166" />
          <circle cx="38" cy="66" r="2.2" fill="#FFD166" />
          <circle cx="62" cy="66" r="2.2" fill="#FFD166" />
          <circle cx="50" cy="76" r="2.2" fill="#FFD166" />
        </symbol>

        {/* Cà rốt */}
        <symbol id="svg-item-carrot" viewBox="0 0 100 100">
          <path d="M50 26 C38 8, 28 16, 44 28" fill="#57CC99" stroke="#2D8A61" strokeWidth="2.5" />
          <path d="M50 26 C50 6, 62 6, 54 26" fill="#80ED99" stroke="#2D8A61" strokeWidth="2.5" />
          <path d="M50 26 C66 10, 74 20, 56 28" fill="#57CC99" stroke="#2D8A61" strokeWidth="2.5" />
          <path d="M34 30 Q50 24 66 30 L54 86 C52 92, 48 92, 46 86 Z" fill="#FF9F1C" stroke="#D97706" strokeWidth="2.5" />
          <path d="M40 44 L52 44 M46 58 L58 58 M44 72 L52 72" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
        </symbol>

        {/* Táo đỏ */}
        <symbol id="svg-item-apple" viewBox="0 0 100 100">
          <path d="M50 30 C30 22, 16 40, 20 64 C24 84, 40 90, 50 84 C60 90, 76 84, 80 64 C84 40, 70 22, 50 30 Z" fill="#FF5A5F" stroke="#C9184A" strokeWidth="2.5" />
          <path d="M50 30 L52 14" stroke="#78350F" strokeWidth="5" strokeLinecap="round" />
          <path d="M52 18 C64 12, 76 16, 68 25 C62 30, 54 24, 52 18 Z" fill="#80ED99" stroke="#2D8A61" strokeWidth="2" />
          <ellipse cx="34" cy="48" rx="5" ry="11" transform="rotate(-18 34 48)" fill="#FFFFFF" opacity="0.45" />
        </symbol>

        {/* Chuối vàng */}
        <symbol id="svg-item-banana" viewBox="0 0 100 100">
          <path d="M24 68 C42 86, 78 72, 82 30 C83 22, 76 18, 72 24 C64 54, 42 66, 26 58 C20 56, 18 62, 24 68 Z" fill="#FFD166" stroke="#D99B00" strokeWidth="2.5" />
          <path d="M74 22 L78 15" stroke="#78350F" strokeWidth="5" strokeLinecap="round" />
        </symbol>

        {/* Quả lê ngọt ngào */}
        <symbol id="svg-item-pear" viewBox="0 0 100 100">
          <path d="M50 20 C42 20, 38 34, 38 46 C38 56, 26 66, 26 78 C26 92, 36 96, 50 96 C64 96, 74 92, 74 78 C74 66, 62 56, 62 46 C62 34, 58 20, 50 20 Z" fill="#A7F3D0" stroke="#059669" strokeWidth="2.5" />
          <path d="M50 20 L50 8" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
          <path d="M50 12 Q60 6 62 14 Z" fill="#34D399" />
          <ellipse cx="42" cy="74" rx="4" ry="10" transform="rotate(-20 42 74)" fill="#FFFFFF" opacity="0.4" />
        </symbol>

        {/* Chùm nho tím */}
        <symbol id="svg-item-grape" viewBox="0 0 100 100">
          <path d="M50 16 L50 6" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
          <path d="M50 14 C40 6 36 12 44 18 Z" fill="#57CC99" />
          {/* Nho */}
          <circle cx="42" cy="30" r="10" fill="#A855F7" stroke="#6B21A8" strokeWidth="1.5" />
          <circle cx="58" cy="30" r="10" fill="#A855F7" stroke="#6B21A8" strokeWidth="1.5" />
          <circle cx="34" cy="46" r="10" fill="#9333EA" stroke="#6B21A8" strokeWidth="1.5" />
          <circle cx="50" cy="46" r="10" fill="#A855F7" stroke="#6B21A8" strokeWidth="1.5" />
          <circle cx="66" cy="46" r="10" fill="#9333EA" stroke="#6B21A8" strokeWidth="1.5" />
          <circle cx="42" cy="62" r="10" fill="#7E22CE" stroke="#581C87" strokeWidth="1.5" />
          <circle cx="58" cy="62" r="10" fill="#9333EA" stroke="#6B21A8" strokeWidth="1.5" />
          <circle cx="50" cy="76" r="10" fill="#7E22CE" stroke="#581C87" strokeWidth="1.5" />
        </symbol>

        {/* 7. GIỌT SƯƠNG MÀU SẮC (COLOR DROPLET) */}
        <symbol id="svg-color-droplet" viewBox="0 0 100 100">
          <path d="M50 12 C50 12, 18 52, 18 70 C18 87, 32 94, 50 94 C68 94, 82 87, 82 70 C82 52, 50 12, 50 12 Z" fill="currentColor" stroke="#FFFFFF" strokeWidth="4" />
          <ellipse cx="38" cy="64" rx="6" ry="12" transform="rotate(-15 38 64)" fill="#FFFFFF" opacity="0.5" />
          <circle cx="42" cy="80" r="3" fill="#FFFFFF" opacity="0.5" />
        </symbol>

        {/* 8. ẾCH CỐM ĐỔI MÀU (COLOR FROG) */}
        <symbol id="svg-color-frog" viewBox="0 0 160 160">
          <ellipse cx="80" cy="136" rx="64" ry="18" fill="#57CC99" stroke="#2D8A61" strokeWidth="3" />
          <ellipse cx="80" cy="102" rx="44" ry="34" fill="currentColor" stroke="#1E293B" strokeWidth="3.5" />
          <ellipse cx="80" cy="110" rx="28" ry="20" fill="#FFFDF5" opacity="0.85" />
          <circle cx="56" cy="66" r="18" fill="currentColor" stroke="#1E293B" strokeWidth="3.5" />
          <circle cx="104" cy="66" r="18" fill="currentColor" stroke="#1E293B" strokeWidth="3.5" />
          <circle cx="56" cy="66" r="11" fill="#FFFFFF" />
          <circle cx="104" cy="66" r="11" fill="#FFFFFF" />
          <circle cx="56" cy="66" r="6" fill="#1E293B" />
          <circle cx="104" cy="66" r="6" fill="#1E293B" />
          <path d="M58 92 Q80 108 102 92" fill="none" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="48" cy="88" rx="6" ry="3.5" fill="#FF758F" opacity="0.75" />
          <ellipse cx="112" cy="88" rx="6" ry="3.5" fill="#FF758F" opacity="0.75" />
        </symbol>

        {/* 9. ĐOM ĐÓM PHÁT SÁNG (GLOWING FIREFLY) */}
        <symbol id="svg-glow-firefly" viewBox="0 0 140 140">
          <circle cx="70" cy="92" r="34" fill="#FFD166" opacity="0.35" />
          <circle cx="70" cy="92" r="22" fill="#FFE066" opacity="0.7" />
          <ellipse cx="46" cy="64" rx="24" ry="14" transform="rotate(-25 46 64)" fill="#D8F3FF" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.9" />
          <ellipse cx="94" cy="64" rx="24" ry="14" transform="rotate(25 94 64)" fill="#D8F3FF" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.9" />
          <ellipse cx="70" cy="88" rx="20" ry="24" fill="#FFD166" stroke="#F59E0B" strokeWidth="2.5" />
          <circle cx="70" cy="54" r="18" fill="#475569" />
          <circle cx="63" cy="52" r="4" fill="#FFFFFF" />
          <circle cx="77" cy="52" r="4" fill="#FFFFFF" />
          <path d="M65 60 Q70 64 75 60" fill="none" stroke="#FFD166" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M62 38 Q52 24 44 28" fill="none" stroke="#FFD166" strokeWidth="3" strokeLinecap="round" />
          <circle cx="44" cy="28" r="4.5" fill="#FFD166" />
          <path d="M78 38 Q88 24 96 28" fill="none" stroke="#FFD166" strokeWidth="3" strokeLinecap="round" />
          <circle cx="96" cy="28" r="4.5" fill="#FFD166" />
        </symbol>

        {/* 10. LỒNG ĐÈN HOA SEN (MAGIC LANTERN) */}
        <symbol id="svg-magic-lantern" viewBox="0 0 120 150">
          <path d="M45 24 Q60 4 75 24" fill="none" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
          <path d="M30 34 Q60 18 90 34 Z" fill="#D97706" />
          <rect x="32" y="34" width="56" height="76" rx="22" fill="currentColor" stroke="#F59E0B" strokeWidth="4" />
          <path d="M26 110 Q60 124 94 110 L84 124 L36 124 Z" fill="#D97706" />
        </symbol>

        {/* 11. CỐI XAY GIÓ (WINDMILL) */}
        <symbol id="svg-windmill" viewBox="0 0 180 200">
          <polygon points="62,90 118,90 132,185 48,185" fill="#FFFDF5" stroke="#CBD5E1" strokeWidth="4" strokeLinejoin="round" />
          <path d="M54 88 Q90 56 126 88 Z" fill="#FF758F" stroke="#C9184A" strokeWidth="3" />
          <path d="M76 185 L76 152 A14 14 0 0 1 104 152 L104 185 Z" fill="#B45309" />
          <g transform="translate(90, 88)">
            <rect x="-8" y="-68" width="16" height="58" rx="6" fill="#FFD166" stroke="#D99B00" strokeWidth="2.5" />
            <rect x="-8" y="10" width="16" height="58" rx="6" fill="#FFD166" stroke="#D99B00" strokeWidth="2.5" />
            <rect x="-68" y="-8" width="58" height="16" rx="6" fill="#4CC9F0" stroke="#0077B6" strokeWidth="2.5" />
            <rect x="10" y="-8" width="58" height="16" rx="6" fill="#4CC9F0" stroke="#0077B6" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="12" fill="#FF758F" stroke="#FFFFFF" strokeWidth="3" />
          </g>
        </symbol>

        {/* 12. NẤM ĐỎ CHẤM TRẮNG (RED MUSHROOM) */}
        <symbol id="svg-red-mushroom" viewBox="0 0 160 160">
          <path d="M58 84 L50 142 C50 150, 110 150, 110 142 L102 84 Z" fill="#FFFDF5" stroke="#E2E8F0" strokeWidth="3" />
          <path d="M18 88 C18 32, 142 32, 142 88 C142 98, 18 98, 18 88 Z" fill="#FF5A5F" stroke="#C9184A" strokeWidth="3" />
          <circle cx="52" cy="62" r="11" fill="#FFFDF5" />
          <circle cx="96" cy="54" r="14" fill="#FFFDF5" />
          <circle cx="118" cy="76" r="8" fill="#FFFDF5" />
          <circle cx="74" cy="78" r="7" fill="#FFFDF5" />
          <circle cx="70" cy="112" r="4" fill="#1E293B" />
          <circle cx="90" cy="112" r="4" fill="#1E293B" />
          <path d="M75 120 Q80 125 85 120" fill="none" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
        </symbol>

        {/* 13. GIỎ MÂY PICNIC (PICNIC BASKET) */}
        <symbol id="svg-picnic-basket" viewBox="0 0 140 120">
          <path d="M50 40 Q70 10 90 40" fill="none" stroke="#92400E" strokeWidth="5" strokeLinecap="round" />
          <rect x="25" y="40" width="90" height="20" rx="6" fill="#F59E0B" stroke="#92400E" strokeWidth="3" />
          <path d="M30 60 L40 105 Q70 115 100 105 L110 60 Z" fill="#D97706" stroke="#92400E" strokeWidth="3" />
          <line x1="45" y1="60" x2="52" y2="105" stroke="#92400E" strokeWidth="2" />
          <line x1="70" y1="60" x2="70" y2="110" stroke="#92400E" strokeWidth="2" />
          <line x1="95" y1="60" x2="88" y2="105" stroke="#92400E" strokeWidth="2" />
          <polygon points="35,42 60,42 55,64 30,58" fill="#FF758F" />
        </symbol>

        {/* 14. KHINH KHÍ CẦU (HOT AIR BALLOON) */}
        <symbol id="svg-hot-air-balloon" viewBox="0 0 140 180">
          <path d="M70 15 C30 15, 10 50, 25 90 C35 115, 55 130, 60 140 L80 140 C85 130, 105 115, 115 90 C130 50, 110 15, 70 15 Z" fill="#FF758F" stroke="#C9184A" strokeWidth="3" />
          <path d="M70 15 C52 15, 38 50, 48 90 C54 115, 65 130, 68 140 L72 140 C75 130, 86 115, 92 90 C102 50, 88 15, 70 15 Z" fill="#FFD166" stroke="#D99B00" strokeWidth="2.5" />
          <ellipse cx="70" cy="78" rx="10" ry="60" fill="#4CC9F0" stroke="#0077B6" strokeWidth="2" />
          <line x1="58" y1="140" x2="55" y2="155" stroke="#78350F" strokeWidth="2" />
          <line x1="82" y1="140" x2="85" y2="155" stroke="#78350F" strokeWidth="2" />
          <rect x="52" y="155" width="36" height="20" rx="4" fill="#D97706" stroke="#78350F" strokeWidth="2.5" />
        </symbol>

        {/* 15. HOA BỒ CÔNG ANH (DANDELION) */}
        <symbol id="svg-dandelion" viewBox="0 0 120 160">
          <line x1="60" y1="80" x2="60" y2="155" stroke="#2D8A61" strokeWidth="4" strokeLinecap="round" />
          <circle cx="60" cy="70" r="14" fill="#FFD166" stroke="#D99B00" strokeWidth="2" />
          <circle cx="60" cy="70" r="42" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeDasharray="4 6" />
          <circle cx="30" cy="55" r="4" fill="#FFFFFF" />
          <circle cx="90" cy="55" r="4" fill="#FFFFFF" />
          <circle cx="60" cy="28" r="4" fill="#FFFFFF" />
          <circle cx="40" cy="85" r="4" fill="#FFFFFF" />
          <circle cx="80" cy="85" r="4" fill="#FFFFFF" />
        </symbol>

        {/* 16. CÂY CỔ THỤ (OAK TREE) */}
        <symbol id="svg-oak-tree" viewBox="0 0 200 240">
          <path d="M75 140 C75 180, 50 220, 30 235 L170 235 C150 220, 125 180, 125 140 Z" fill="#8B5A2B" stroke="#5C3A1E" strokeWidth="3.5" />
          <ellipse cx="100" cy="180" rx="18" ry="24" fill="#3E2723" stroke="#5C3A1E" strokeWidth="3" />
          <circle cx="100" cy="172" r="14" fill="#2E1C14" />
          <circle cx="60" cy="100" r="42" fill="#57CC99" stroke="#2D8A61" strokeWidth="3" />
          <circle cx="140" cy="100" r="42" fill="#57CC99" stroke="#2D8A61" strokeWidth="3" />
          <circle cx="100" cy="70" r="50" fill="#80ED99" stroke="#2D8A61" strokeWidth="3" />
        </symbol>

        {/* 17. BỤI MẪU ĐƠN (PEONY BUSH) */}
        <symbol id="svg-peony-bush" viewBox="0 0 160 120">
          <ellipse cx="80" cy="75" rx="65" ry="38" fill="#57CC99" stroke="#2D8A61" strokeWidth="3" />
          <ellipse cx="50" cy="65" rx="36" ry="28" fill="#80ED99" stroke="#2D8A61" strokeWidth="2.5" />
          <ellipse cx="110" cy="65" rx="36" ry="28" fill="#80ED99" stroke="#2D8A61" strokeWidth="2.5" />
          <circle cx="55" cy="55" r="10" fill="#FF758F" stroke="#C9184A" strokeWidth="2" />
          <circle cx="105" cy="50" r="12" fill="#FF758F" stroke="#C9184A" strokeWidth="2" />
        </symbol>
      </defs>
    </svg>
  );
};

export default SunnyMeadowSvgVault;
