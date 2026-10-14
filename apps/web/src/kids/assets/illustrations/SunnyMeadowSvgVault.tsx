import React from 'react';

/**
 * SUNNY MEADOW V2.0 - MASTER CENTRALIZED SVG SPRITE VAULT
 * Strictly satisfies Directive 5 of KidRequired.md:
 * Single centralized <svg id="sunny-meadow-svg-vault"> containing all symbols
 * for characters, ecological scenes, food items, and rewards.
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
        {/* 1. LINH VẬT CHÍNH: CÁO NHỎ SUNNY (SUNNY THE FOX) */}
        <symbol id="svg-sunny-fox" viewBox="0 0 180 180">
          {/* Đuôi bông xù 2 màu */}
          <path d="M122 118 C162 104, 174 140, 144 156 C124 166, 108 148, 114 132 Z" fill="#FF7E67"/>
          <path d="M146 125 C164 130, 162 148, 144 156 C136 148, 138 132, 146 125 Z" fill="#FFFDF5"/>
          {/* Thân & Bụng kem */}
          <ellipse cx="90" cy="132" rx="36" ry="32" fill="#FF7E67"/>
          <ellipse cx="90" cy="136" rx="23" ry="22" fill="#FFFDF5"/>
          {/* Khăn quàng lá non */}
          <path d="M60 108 Q90 122 120 108 L114 122 Q90 132 66 122 Z" fill="#57CC99"/>
          <path d="M100 116 L110 140 L122 135 L112 114 Z" fill="#2D8A61"/>
          {/* Đôi tai lớn */}
          <path d="M38 64 L26 18 L72 44 Z" fill="#FF7E67" stroke="#E0533C" strokeWidth="3" strokeLinejoin="round"/>
          <path d="M40 56 L33 28 L62 44 Z" fill="#FFD166"/>
          <path d="M142 64 L154 18 L108 44 Z" fill="#FF7E67" stroke="#E0533C" strokeWidth="3" strokeLinejoin="round"/>
          <path d="M140 56 L147 28 L118 44 Z" fill="#FFD166"/>
          {/* Khuôn mặt bầu bĩnh */}
          <ellipse cx="90" cy="76" rx="54" ry="42" fill="#FF7E67"/>
          <path d="M36 76 C36 106, 70 118, 90 118 C110 118, 144 106, 144 76 C128 76, 108 88, 90 102 C72 88, 52 76, 36 76 Z" fill="#FFFDF5"/>
          {/* Mắt to long lanh */}
          <circle cx="65" cy="72" r="8.5" fill="#1E293B"/>
          <circle cx="62" cy="69" r="3.2" fill="#FFFFFF"/>
          <circle cx="68" cy="75" r="1.5" fill="#FFFFFF"/>
          <circle cx="115" cy="72" r="8.5" fill="#1E293B"/>
          <circle cx="112" cy="69" r="3.2" fill="#FFFFFF"/>
          <circle cx="118" cy="75" r="1.5" fill="#FFFFFF"/>
          {/* Má hồng phấn */}
          <ellipse cx="50" cy="85" rx="8" ry="4.5" fill="#FF758F" opacity="0.75"/>
          <ellipse cx="130" cy="85" rx="8" ry="4.5" fill="#FF758F" opacity="0.75"/>
          {/* Mũi & Miệng cười tươi */}
          <ellipse cx="90" cy="88" rx="7" ry="5" fill="#1E293B"/>
          <path d="M80 96 Q90 106 100 96" fill="none" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round"/>
          {/* Mầm cây nhỏ trên đỉnh đầu */}
          <path d="M90 34 L90 22" stroke="#2D8A61" strokeWidth="4" strokeLinecap="round"/>
          <path d="M90 24 C90 12, 108 10, 110 20 C110 28, 96 30, 90 24 Z" fill="#80ED99"/>
        </symbol>

        {/* 2. BẠN ĐỒNG HÀNH: THỎ TRẮNG MŨM MĨM (CHUBBY BUNNY) */}
        <symbol id="svg-chubby-bunny" viewBox="0 0 180 180">
          {/* Tai thỏ dài */}
          <ellipse cx="66" cy="44" rx="14" ry="34" transform="rotate(-10 66 44)" fill="#FFFDF5" stroke="#E2E8F0" strokeWidth="3"/>
          <ellipse cx="66" cy="46" rx="7" ry="24" transform="rotate(-10 66 46)" fill="#FFB3C6"/>
          <ellipse cx="114" cy="44" rx="14" ry="34" transform="rotate(10 114 44)" fill="#FFFDF5" stroke="#E2E8F0" strokeWidth="3"/>
          <ellipse cx="114" cy="46" rx="7" ry="24" transform="rotate(10 114 46)" fill="#FFB3C6"/>
          {/* Thân tròn mũm mĩm */}
          <ellipse cx="90" cy="134" rx="40" ry="32" fill="#FFFDF5" stroke="#E2E8F0" strokeWidth="3"/>
          <ellipse cx="90" cy="138" rx="24" ry="20" fill="#FFE5EC"/>
          {/* Đầu thỏ */}
          <ellipse cx="90" cy="90" rx="46" ry="38" fill="#FFFDF5" stroke="#E2E8F0" strokeWidth="3"/>
          {/* Mắt & Má hồng */}
          <circle cx="68" cy="86" r="7.5" fill="#1E293B"/>
          <circle cx="65.5" cy="83.5" r="2.8" fill="#FFFFFF"/>
          <circle cx="112" cy="86" r="7.5" fill="#1E293B"/>
          <circle cx="109.5" cy="83.5" r="2.8" fill="#FFFFFF"/>
          <ellipse cx="54" cy="96" rx="7" ry="4" fill="#FF758F" opacity="0.65"/>
          <ellipse cx="126" cy="96" rx="7" ry="4" fill="#FF758F" opacity="0.65"/>
          {/* Mũi hồng & Răng thỏ */}
          <polygon points="85,93 95,93 90,100" fill="#FF758F"/>
          <rect x="86" y="102" width="8" height="7" rx="2" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5"/>
          <path d="M80 101 Q90 107 100 101" fill="none" stroke="#1E293B" strokeWidth="3" strokeLinecap="round"/>
        </symbol>

        {/* 3. ẾCH CỐM BIẾN HÌNH (COLORABLE LILY FROG - GAME 2) */}
        <symbol id="svg-color-frog" viewBox="0 0 160 160">
          {/* Lá sen làm đế */}
          <ellipse cx="80" cy="136" rx="64" ry="18" fill="#57CC99" stroke="#2D8A61" strokeWidth="3"/>
          <path d="M80 136 L140 132" stroke="#2D8A61" strokeWidth="3"/>
          {/* Thân ếch dùng currentColor */}
          <ellipse cx="80" cy="102" rx="44" ry="34" fill="currentColor" stroke="#1E293B" strokeWidth="3.5"/>
          <ellipse cx="80" cy="110" rx="28" ry="20" fill="#FFFDF5" opacity="0.85"/>
          {/* Hai mắt lồi */}
          <circle cx="56" cy="66" r="18" fill="currentColor" stroke="#1E293B" strokeWidth="3.5"/>
          <circle cx="104" cy="66" r="18" fill="currentColor" stroke="#1E293B" strokeWidth="3.5"/>
          <circle cx="56" cy="66" r="11" fill="#FFFFFF"/>
          <circle cx="104" cy="66" r="11" fill="#FFFFFF"/>
          <circle cx="56" cy="66" r="6" fill="#1E293B"/>
          <circle cx="104" cy="66" r="6" fill="#1E293B"/>
          <circle cx="54" cy="63" r="2.2" fill="#FFFFFF"/>
          <circle cx="102" cy="63" r="2.2" fill="#FFFFFF"/>
          {/* Nụ cười */}
          <path d="M58 92 Q80 108 102 92" fill="none" stroke="#1E293B" strokeWidth="4" strokeLinecap="round"/>
          <ellipse cx="48" cy="88" rx="6" ry="3.5" fill="#FF758F" opacity="0.75"/>
          <ellipse cx="112" cy="88" rx="6" ry="3.5" fill="#FF758F" opacity="0.75"/>
        </symbol>

        {/* 4. ĐOM ĐÓM PHÁT SÁNG (GLOWING FIREFLY - GAME 3) */}
        <symbol id="svg-glow-firefly" viewBox="0 0 140 140">
          <circle cx="70" cy="92" r="34" fill="#FFD166" opacity="0.35"/>
          <circle cx="70" cy="92" r="22" fill="#FFE066" opacity="0.7"/>
          <ellipse cx="46" cy="64" rx="24" ry="14" transform="rotate(-25 46 64)" fill="#D8F3FF" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.9"/>
          <ellipse cx="94" cy="64" rx="24" ry="14" transform="rotate(25 94 64)" fill="#D8F3FF" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.9"/>
          <ellipse cx="70" cy="88" rx="20" ry="24" fill="#FFD166" stroke="#F59E0B" strokeWidth="2.5"/>
          <circle cx="70" cy="54" r="18" fill="#475569"/>
          <circle cx="63" cy="52" r="4" fill="#FFFFFF"/>
          <circle cx="77" cy="52" r="4" fill="#FFFFFF"/>
          <path d="M65 60 Q70 64 75 60" fill="none" stroke="#FFD166" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M62 38 Q52 24 44 28" fill="none" stroke="#FFD166" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="44" cy="28" r="4.5" fill="#FFD166"/>
          <path d="M78 38 Q88 24 96 28" fill="none" stroke="#FFD166" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="96" cy="28" r="4.5" fill="#FFD166"/>
        </symbol>

        {/* 5. LỒNG ĐÈN HOA SEN PHÉP THUẬT (MAGIC LANTERN - GAME 3) */}
        <symbol id="svg-magic-lantern" viewBox="0 0 120 150">
          <path d="M45 24 Q60 4 75 24" fill="none" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round"/>
          <path d="M30 34 Q60 18 90 34 Z" fill="#D97706"/>
          <rect x="32" y="34" width="56" height="76" rx="22" fill="currentColor" stroke="#F59E0B" strokeWidth="4"/>
          <path d="M26 110 Q60 124 94 110 L84 124 L36 124 Z" fill="#D97706"/>
        </symbol>

        {/* 6. CỐI XAY GIÓ PHÉP THUẬT (MAGIC WINDMILL - GAME 4) */}
        <symbol id="svg-windmill" viewBox="0 0 180 200">
          <polygon points="62,90 118,90 132,185 48,185" fill="#FFFDF5" stroke="#CBD5E1" strokeWidth="4" strokeLinejoin="round"/>
          <path d="M54 88 Q90 56 126 88 Z" fill="#FF758F" stroke="#C9184A" strokeWidth="3"/>
          <path d="M76 185 L76 152 A14 14 0 0 1 104 152 L104 185 Z" fill="#B45309"/>
          <g transform="translate(90, 88)">
            <rect x="-8" y="-68" width="16" height="58" rx="6" fill="#FFD166" stroke="#D99B00" strokeWidth="2.5"/>
            <rect x="-8" y="10" width="16" height="58" rx="6" fill="#FFD166" stroke="#D99B00" strokeWidth="2.5"/>
            <rect x="-68" y="-8" width="58" height="16" rx="6" fill="#4CC9F0" stroke="#0077B6" strokeWidth="2.5"/>
            <rect x="10" y="-8" width="58" height="16" rx="6" fill="#4CC9F0" stroke="#0077B6" strokeWidth="2.5"/>
            <circle cx="0" cy="0" r="12" fill="#FF758F" stroke="#FFFFFF" strokeWidth="3"/>
          </g>
        </symbol>

        {/* 7. CÂY NẤM ĐỎ CHẤM TRẮNG (RED TOADSTOOL MUSHROOM - GAME 5) */}
        <symbol id="svg-red-mushroom" viewBox="0 0 160 160">
          <path d="M58 84 L50 142 C50 150, 110 150, 110 142 L102 84 Z" fill="#FFFDF5" stroke="#E2E8F0" strokeWidth="3"/>
          <path d="M18 88 C18 32, 142 32, 142 88 C142 98, 18 98, 18 88 Z" fill="#FF5A5F" stroke="#C9184A" strokeWidth="3"/>
          <circle cx="52" cy="62" r="11" fill="#FFFDF5"/>
          <circle cx="96" cy="54" r="14" fill="#FFFDF5"/>
          <circle cx="118" cy="76" r="8" fill="#FFFDF5"/>
          <circle cx="74" cy="78" r="7" fill="#FFFDF5"/>
          <circle cx="70" cy="112" r="4" fill="#1E293B"/>
          <circle cx="90" cy="112" r="4" fill="#1E293B"/>
          <path d="M75 120 Q80 125 85 120" fill="none" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round"/>
        </symbol>

        {/* 8. VẬT PHẨM PICNIC: DÂU TÂY MỌNG NƯỚC (SWEET STRAWBERRY) */}
        <symbol id="svg-item-strawberry" viewBox="0 0 100 100">
          <path d="M50 24 C26 24, 18 52, 34 78 C42 90, 58 90, 66 78 C82 52, 74 24, 50 24 Z" fill="#FF4D6D" stroke="#C9184A" strokeWidth="2.5"/>
          <path d="M32 26 Q50 36 68 26 Q58 16 50 22 Q42 16 32 26 Z" fill="#57CC99" stroke="#2D8A61" strokeWidth="2"/>
          <circle cx="40" cy="46" r="2.2" fill="#FFD166"/>
          <circle cx="60" cy="46" r="2.2" fill="#FFD166"/>
          <circle cx="50" cy="58" r="2.2" fill="#FFD166"/>
          <circle cx="38" cy="66" r="2.2" fill="#FFD166"/>
          <circle cx="62" cy="66" r="2.2" fill="#FFD166"/>
          <circle cx="50" cy="76" r="2.2" fill="#FFD166"/>
        </symbol>

        {/* 9. VẬT PHẨM PICNIC: CỦ CÀ RỐT GIÒN TAN (CRUNCHY CARROT) */}
        <symbol id="svg-item-carrot" viewBox="0 0 100 100">
          <path d="M50 26 C38 8, 28 16, 44 28" fill="#57CC99" stroke="#2D8A61" strokeWidth="2.5"/>
          <path d="M50 26 C50 6, 62 6, 54 26" fill="#80ED99" stroke="#2D8A61" strokeWidth="2.5"/>
          <path d="M50 26 C66 10, 74 20, 56 28" fill="#57CC99" stroke="#2D8A61" strokeWidth="2.5"/>
          <path d="M34 30 Q50 24 66 30 L54 86 C52 92, 48 92, 46 86 Z" fill="#FF9F1C" stroke="#D97706" strokeWidth="2.5"/>
          <path d="M40 44 L52 44 M46 58 L58 58 M44 72 L52 72" stroke="#D97706" strokeWidth="3" strokeLinecap="round"/>
        </symbol>

        {/* 10. VẬT PHẨM PICNIC: QUẢ TÁO ĐỎ (RED APPLE) */}
        <symbol id="svg-item-apple" viewBox="0 0 100 100">
          <path d="M50 30 C30 22, 16 40, 20 64 C24 84, 40 90, 50 84 C60 90, 76 84, 80 64 C84 40, 70 22, 50 30 Z" fill="#FF5A5F" stroke="#C9184A" strokeWidth="2.5"/>
          <path d="M50 30 L52 14" stroke="#78350F" strokeWidth="5" strokeLinecap="round"/>
          <path d="M52 18 C64 12, 76 16, 68 25 C62 30, 54 24, 52 18 Z" fill="#80ED99" stroke="#2D8A61" strokeWidth="2"/>
          <ellipse cx="34" cy="48" rx="5" ry="11" transform="rotate(-18 34 48)" fill="#FFFFFF" opacity="0.45"/>
        </symbol>

        {/* 11. VẬT PHẨM PICNIC: QUẢ CHUỐI VÀNG (YELLOW BANANA) */}
        <symbol id="svg-item-banana" viewBox="0 0 100 100">
          <path d="M24 68 C42 86, 78 72, 82 30 C83 22, 76 18, 72 24 C64 54, 42 66, 26 58 C20 56, 18 62, 24 68 Z" fill="#FFD166" stroke="#D99B00" strokeWidth="2.5"/>
          <path d="M74 22 L78 15" stroke="#78350F" strokeWidth="5" strokeLinecap="round"/>
        </symbol>

        {/* 12. GIỌT SƯƠNG MÀU SẮC (COLOR DROPLET - GAME 2) */}
        <symbol id="svg-color-droplet" viewBox="0 0 100 100">
          <path d="M50 12 C50 12, 18 52, 18 70 C18 87, 32 94, 50 94 C68 94, 82 87, 82 70 C82 52, 50 12, 50 12 Z" fill="currentColor" stroke="#FFFFFF" strokeWidth="4"/>
          <ellipse cx="38" cy="64" rx="6" ry="12" transform="rotate(-15 38 64)" fill="#FFFFFF" opacity="0.5"/>
          <circle cx="42" cy="80" r="3" fill="#FFFFFF" opacity="0.5"/>
        </symbol>

        {/* 13. HUY HIỆU NGÔI SAO CƯỜI (SMILING STAR REWARD) */}
        <symbol id="svg-star-badge" viewBox="0 0 120 120">
          <polygon points="60,8 76,40 112,45 86,70 92,106 60,89 28,106 34,70 8,45 44,40" fill="#FFD166" stroke="#D99B00" strokeWidth="4" strokeLinejoin="round"/>
          <polygon points="60,20 72,44 98,48 79,66 83,92 60,80 37,92 41,66 22,48 48,44" fill="#FFF3B0"/>
          <circle cx="51" cy="56" r="4" fill="#1E293B"/>
          <circle cx="69" cy="56" r="4" fill="#1E293B"/>
          <path d="M53 66 Q60 72 67 66" fill="none" stroke="#1E293B" strokeWidth="3" strokeLinecap="round"/>
        </symbol>

        {/* 14. CÂY CỔ THỤ RỪNG XANH (GREAT OAK TREE - GAME 5) */}
        <symbol id="svg-oak-tree" viewBox="0 0 200 240">
          {/* Thân cây nâu to khỏe */}
          <path d="M75 140 C75 180, 50 220, 30 235 L170 235 C150 220, 125 180, 125 140 Z" fill="#8B5A2B" stroke="#5C3A1E" strokeWidth="3.5"/>
          {/* Hốc cây */}
          <ellipse cx="100" cy="180" rx="18" ry="24" fill="#3E2723" stroke="#5C3A1E" strokeWidth="3"/>
          <circle cx="100" cy="172" r="14" fill="#2E1C14"/>
          {/* Tán lá đa tầng xanh mát */}
          <circle cx="60" cy="100" r="42" fill="#57CC99" stroke="#2D8A61" strokeWidth="3"/>
          <circle cx="140" cy="100" r="42" fill="#57CC99" stroke="#2D8A61" strokeWidth="3"/>
          <circle cx="100" cy="70" r="50" fill="#80ED99" stroke="#2D8A61" strokeWidth="3"/>
          <circle cx="100" cy="95" r="38" fill="#57CC99" opacity="0.6"/>
          {/* Hoa / quả nhỏ trên cây */}
          <circle cx="70" cy="65" r="5" fill="#FF758F"/>
          <circle cx="130" cy="75" r="5" fill="#FFD166"/>
          <circle cx="105" cy="45" r="5" fill="#FF758F"/>
        </symbol>

        {/* 15. BỤI HOA MẪU ĐƠN (PEONY BUSH - GAME 5) */}
        <symbol id="svg-peony-bush" viewBox="0 0 160 120">
          <ellipse cx="80" cy="75" rx="65" ry="38" fill="#57CC99" stroke="#2D8A61" strokeWidth="3"/>
          <ellipse cx="50" cy="65" rx="36" ry="28" fill="#80ED99" stroke="#2D8A61" strokeWidth="2.5"/>
          <ellipse cx="110" cy="65" rx="36" ry="28" fill="#80ED99" stroke="#2D8A61" strokeWidth="2.5"/>
          <circle cx="80" cy="50" r="32" fill="#57CC99" stroke="#2D8A61" strokeWidth="2.5"/>
          {/* Hoa mẫu đơn nở */}
          <circle cx="55" cy="55" r="10" fill="#FF758F" stroke="#C9184A" strokeWidth="2"/>
          <circle cx="105" cy="50" r="12" fill="#FF758F" stroke="#C9184A" strokeWidth="2"/>
          <circle cx="80" cy="70" r="8" fill="#FFD166" stroke="#D99B00" strokeWidth="1.5"/>
        </symbol>

        {/* 16. KHINH KHÍ CẦU VUI VẺ (HOT AIR BALLOON - GAME 4) */}
        <symbol id="svg-hot-air-balloon" viewBox="0 0 140 180">
          {/* Khối cầu sọc rực rỡ */}
          <path d="M70 15 C30 15, 10 50, 25 90 C35 115, 55 130, 60 140 L80 140 C85 130, 105 115, 115 90 C130 50, 110 15, 70 15 Z" fill="#FF758F" stroke="#C9184A" strokeWidth="3"/>
          <path d="M70 15 C52 15, 38 50, 48 90 C54 115, 65 130, 68 140 L72 140 C75 130, 86 115, 92 90 C102 50, 88 15, 70 15 Z" fill="#FFD166" stroke="#D99B00" strokeWidth="2.5"/>
          <ellipse cx="70" cy="78" rx="10" ry="60" fill="#4CC9F0" stroke="#0077B6" strokeWidth="2"/>
          {/* Dây thừng */}
          <line x1="58" y1="140" x2="55" y2="155" stroke="#78350F" strokeWidth="2"/>
          <line x1="82" y1="140" x2="85" y2="155" stroke="#78350F" strokeWidth="2"/>
          {/* Giỏ mây */}
          <rect x="52" y="155" width="36" height="20" rx="4" fill="#D97706" stroke="#78350F" strokeWidth="2.5"/>
        </symbol>

        {/* 17. HOA BỒ CÔNG ANH (DANDELION FLOWER - GAME 4) */}
        <symbol id="svg-dandelion" viewBox="0 0 120 160">
          <line x1="60" y1="80" x2="60" y2="155" stroke="#2D8A61" strokeWidth="4" strokeLinecap="round"/>
          <circle cx="60" cy="70" r="14" fill="#FFD166" stroke="#D99B00" strokeWidth="2"/>
          {/* Tán hạt bông xòe tròn */}
          <circle cx="60" cy="70" r="42" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeDasharray="4 6"/>
          <circle cx="60" cy="70" r="32" fill="none" stroke="#D8F3FF" strokeWidth="2" strokeDasharray="3 5"/>
          <circle cx="30" cy="55" r="4" fill="#FFFFFF"/>
          <circle cx="90" cy="55" r="4" fill="#FFFFFF"/>
          <circle cx="60" cy="28" r="4" fill="#FFFFFF"/>
          <circle cx="40" cy="85" r="4" fill="#FFFFFF"/>
          <circle cx="80" cy="85" r="4" fill="#FFFFFF"/>
        </symbol>

        {/* 18. GIỎ MÂY PICNIC (PICNIC BASKET - GAME 1) */}
        <symbol id="svg-picnic-basket" viewBox="0 0 140 120">
          <path d="M50 40 Q70 10 90 40" fill="none" stroke="#92400E" strokeWidth="5" strokeLinecap="round"/>
          <rect x="25" y="40" width="90" height="20" rx="6" fill="#F59E0B" stroke="#92400E" strokeWidth="3"/>
          <path d="M30 60 L40 105 Q70 115 100 105 L110 60 Z" fill="#D97706" stroke="#92400E" strokeWidth="3"/>
          <line x1="45" y1="60" x2="52" y2="105" stroke="#92400E" strokeWidth="2"/>
          <line x1="70" y1="60" x2="70" y2="110" stroke="#92400E" strokeWidth="2"/>
          <line x1="95" y1="60" x2="88" y2="105" stroke="#92400E" strokeWidth="2"/>
          {/* Khăn caro đỏ ló ra khỏi giỏ */}
          <polygon points="35,42 60,42 55,64 30,58" fill="#FF758F"/>
        </symbol>

        {/* 19. CÚ THÔNG THÁI OLLIE (WISE OWL OLLIE - GAME 3) */}
        <symbol id="svg-owl-ollie" viewBox="0 0 160 160">
          {/* Thân cú bầu bĩnh */}
          <ellipse cx="80" cy="95" rx="46" ry="48" fill="#78350F" stroke="#451A03" strokeWidth="3.5"/>
          <ellipse cx="80" cy="105" rx="30" ry="32" fill="#FEF3C7"/>
          {/* Đôi mắt to tròn thông thái */}
          <circle cx="60" cy="70" r="20" fill="#FFFFFF" stroke="#451A03" strokeWidth="3"/>
          <circle cx="100" cy="70" r="20" fill="#FFFFFF" stroke="#451A03" strokeWidth="3"/>
          <circle cx="60" cy="70" r="10" fill="#1E293B"/>
          <circle cx="100" cy="70" r="10" fill="#1E293B"/>
          <circle cx="57" cy="67" r="3.5" fill="#FFFFFF"/>
          <circle cx="97" cy="67" r="3.5" fill="#FFFFFF"/>
          {/* Mỏ cam nhọn */}
          <polygon points="74,80 86,80 80,92" fill="#F59E0B" stroke="#B45309" strokeWidth="2"/>
          {/* Chân bám */}
          <circle cx="65" cy="142" r="5" fill="#F59E0B"/>
          <circle cx="75" cy="142" r="5" fill="#F59E0B"/>
          <circle cx="85" cy="142" r="5" fill="#F59E0B"/>
          <circle cx="95" cy="142" r="5" fill="#F59E0B"/>
        </symbol>
      </defs>
    </svg>
  );
};

export default SunnyMeadowSvgVault;
