# 🦊 AGENTS.md — Master Architecture, Child-Visual Spec, Next-Gen Game Design & Complete SVG UI Vault
**Project Name:** Sunny Meadow English V2.0 (Khu Rừng Học Tiếng Anh Trong Trẻo Cho Bé)  
**Target Environment:** Google Antigravity IDE / Autonomous AI Coding Agents  
**Target Users:** Trẻ em từ 3–9 tuổi (Pre-K đến Lớp 3) & Phụ huynh Việt Nam  
**Design Paradigm:** *"Pure Nature Tactile Claymorphism"* (Thiên nhiên trong trẻo + Đất sét nổi 3D mềm mại + Âm thanh phản hồi tức thì)

---

## 1. CHỈ THỊ CỐT LÕI DÀNH CHO AI AGENT (CORE DIRECTIVES)

Khi AI Agent đọc file `AGENTS.md` này để khởi tạo, mở rộng hoặc chỉnh sửa mã nguồn dự án, Agent **BẮT BUỘC** phải tuân thủ 7 nguyên tắc bất khả xâm phạm sau:

1. **Xóa bỏ các game trắc nghiệm/ghép chữ khô khan cũ:** Tuyệt đối KHÔNG làm các game dạng bài kiểm tra (quiz 4 đáp án A-B-C-D), điền vào chỗ trống dạng văn bản đơn điệu, hay ghép câu ngữ pháp học thuật. Chỉ triển khai **5 Game Tương Tác Nhập Vai Sinh Thái (Next-Gen Ecological Mini-Games)** được đặc tả tại Mục 5.
2. **Audio-First & Zero-Literacy Navigation:** Trẻ 3–5 tuổi chưa biết đọc tiếng Việt lẫn tiếng Anh. Mọi thành phần UI (nút bấm, vật phẩm, nhân vật, hướng dẫn) đều phải có biểu tượng hình ảnh trực quan và phát âm ngay lập tức khi chạm (`Tap-to-Speak`).
3. **Zero-Punishment Psychology (Tâm lý học Không Trừng Phạt):**
   - **CẤM:** Màn hình báo đỏ (`#FF0000`), dấu gạch chéo ❌, tiếng còi báo sai chói tai (buzzer), trừ điểm sao, hoặc màn hình "Game Over / Thua cuộc".
   - **BẮT BUỘC:** Khi bé thao tác chưa đúng, vật thể chỉ nhún nhẹ đàn hồi (elastic wobble), phát âm thanh gỗ trầm ấm và giọng Cáo Sunny khích lệ: *"Ooh, that's a yummy pear! Let's look for the red apple!"*.
4. **Child Ergonomics & Fine Motor Guardrails (Chuẩn Vận Động Tinh Nhi Khoa):**
   - Kích thước vùng chạm tối thiểu (`min-width` / `min-height`): **`68px × 68px`** cho nút chức năng và **`96px × 96px`** cho vật phẩm tương tác trong game.
   - Khoảng cách an toàn giữa 2 vùng chạm (`gap`): Tối thiểu **`20px`** để chống chạm nhầm khi trẻ dùng ngón tay cái hoặc cả bàn tay.
   - Hỗ trợ **Tap-to-Move thay thế cho Drag-and-Drop:** Trẻ nhỏ thường làm rơi vật thể khi kéo-thả trên màn hình cảm ứng. Mọi tương tác kéo-thả bắt buộc phải hỗ trợ song song cơ chế: *Chạm lần 1 để chọn vật phẩm (vật phẩm bay lơ lửng sáng lên) -> Chạm lần 2 vào đích để đặt*.
5. **Single Centralized SVG Sprite Vault:** Cấm rải rác các thẻ `<svg>` thô trong từng component. Toàn bộ vector nhân vật, bối cảnh, vật phẩm game và huy hiệu phải nằm trong một khối `<svg id="sunny-meadow-svg-vault">` duy nhất (mã nguồn đầy đủ nằm tại Mục 6 của tài liệu này) và gọi qua `<svg><use href="#id"></use></svg>`.
6. **Zero External Broken Dependencies:** Không dùng link ảnh `.png/.jpg` bên ngoài hoặc file âm thanh `.mp3` rời dễ gây lỗi `404`. Toàn bộ hình ảnh dùng SVG nội bộ và toàn bộ âm thanh dùng `Web Audio API` (`Tone.js` synth) kết hợp `Web Speech API` (`window.speechSynthesis`).
7. **Không dùng hộp thoại hệ thống:** Cấm dùng `alert()`, `confirm()`, `prompt()`. Mọi thông báo phải hiển thị qua **Bubble Toast của Linh Vật** hoặc **Modal Đất Sét 3D**.

---

## 2. ĐẶC TẢ THỊ GIÁC NHI KHOA & HỆ THỐNG UI (CHILD VISUAL & OPTOMETRY SYSTEM)

Thị giác của trẻ từ 3–9 tuổi rất nhạy cảm với độ chói (glare) và màu neon bão hòa cao. Giao diện phải mang lại cảm giác trong veo, dịu mắt như nhìn ra đồng cỏ buổi sớm.

### 2.1. Bảng Màu Tự Nhiên Chuẩn Hóa (Nature & Pastel Color Tokens)
Không bao giờ sử dụng màu trắng tinh (`#FFFFFF`) cho toàn bộ nền màn hình hoặc màu đen tuyền (`#000000`) cho chữ.

| Nhóm Màu | Tên Token | Mã Hex | Mục Đích Sử Dụng Cụ Thể |
| :--- | :--- | :--- | :--- |
| **Bầu Trời & Nước** | `--sky-morning` | `#D8F3FF` | Nền bầu trời phía trên (Top Sky Gradient) |
| | `--sky-stream` | `#4CC9F0` | Mặt suối phát sáng, nút hành động nghe lại |
| | `--sky-deep` | `#0077B6` | Viền nổi 3D (Bottom Lip) cho nút màu xanh dương |
| **Đồng Cỏ & Lá** | `--meadow-fresh` | `#80ED99` | Màu cỏ non tươi sáng, thẻ trạng thái hoàn thành |
| | `--meadow-main` | `#57CC99` | Nút bấm chính (Primary CTA Button) |
| | `--meadow-shadow` | `#22577A` | Viền nổi 3D & chữ tiêu đề xanh rừng thẫm |
| **Nắng Ấm & Sao** | `--sun-butter` | `#FFFDF5` | Màu nền chính của thẻ Card (thay cho trắng tinh `#FFF`) |
| | `--sun-gold` | `#FFD166` | Ngôi sao thưởng, đom đóm phát sáng, nút gợi ý |
| | `--sun-amber` | `#D99B00` | Viền nổi 3D cho nút vàng |
| **Quả Ngọt & Hoa** | `--berry-coral` | `#FF758F` | Nút thu âm giọng nói, má hồng linh vật, quả dâu/táo |
| | `--berry-shadow` | `#C9184A` | Viền nổi 3D cho nút hồng/cam san hô |
| | `--lavender-magic`| `#C77DFF` | Khu vực đom đóm ban đêm, hiệu ứng phép thuật |
| **Văn Bản Dịu Mắt**| `--ink-charcoal` | `#1E293B` | Chữ chính (Độ tương phản AAA trên nền kem `#FFFDF5`) |
| | `--ink-soft` | `#475569` | Phụ đề tiếng Việt dành cho phụ huynh đọc cùng bé |

### 2.2. Typography (Hệ Thống Phông Chữ Trẻ Em)
Sử dụng cặp font Google Fonts hỗ trợ đầy đủ tiếng Việt và có nét chữ tròn trịa thân thiện với trẻ đang tập nhận diện mặt chữ:
- **Font Tiêu Đề & Từ Vựng Tiếng Anh (`--font-display`):** `'Baloo 2'`, cursive, weight `700` / `800`. Đặc trưng: Các đầu chữ cái tròn bầu, chữ `a` và `g` viết dạng đơn giản giống sách giáo khoa lớp 1.
- **Font Phụ Đề & Giao Diện (`--font-body`):** `'Quicksand'`, sans-serif, weight `600` / `700`.
- **Quy chuẩn kích thước chữ:**
  - Chữ cái / Từ vựng đang học trên sân khấu game: `clamp(2.25rem, 5vw, 3.75rem)` (`36px` – `60px`), `letter-spacing: 0.04em`.
  - Tiêu đề khu vực: `1.5rem` – `2.25rem` (`24px` – `36px`).
  - Nút bấm: Tối thiểu `1.25rem` (`20px`), `font-weight: 800`.

### 2.3. Chuẩn Thiết Kế "Tactile 3D Claymorphism" (CSS UI Specs)
Mọi thẻ bài và nút bấm phải tạo cảm giác như đồ chơi gỗ hoặc đất sét mềm có độ dày vật lý để bé thích chạm vào:

```css
/* Chuẩn Thẻ Nổi Đất Sét Mềm (Clay Card) */
.meadow-clay-card {
    background: #FFFDF5;
    border: 4px solid #FFFFFF;
    border-radius: 36px;
    box-shadow: 
        0 16px 32px -8px rgba(34, 87, 122, 0.14),
        0 8px 0 #CBD5E1,
        inset 0 3px 6px rgba(255, 255, 255, 0.9);
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
}

/* Chuẩn Nút Bấm Đồ Chơi 3D Đàn Hồi (Toy Push Button) */
.toy-btn {
    position: relative;
    min-height: 68px;
    padding: 14px 28px;
    border-radius: 26px;
    font-family: 'Baloo 2', cursive;
    font-weight: 800;
    font-size: 1.25rem;
    border: 3px solid rgba(255, 255, 255, 0.75);
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s ease;
}

.toy-btn-green {
    background: linear-gradient(180deg, #80ED99 0%, #57CC99 100%);
    color: #0F3D3E;
    box-shadow: 0 7px 0 #2D8A61, 0 12px 20px rgba(87, 204, 153, 0.35), inset 0 3px 4px rgba(255, 255, 255, 0.7);
}

.toy-btn-green:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 10px 0 #2D8A61, 0 16px 24px rgba(87, 204, 153, 0.45), inset 0 3px 4px rgba(255, 255, 255, 0.8);
}

.toy-btn-green:active {
    transform: translateY(5px) scale(0.98);
    box-shadow: 0 2px 0 #2D8A61, 0 4px 8px rgba(87, 204, 153, 0.25);
}

/* Hiệu ứng Lắc Nhẹ Khích Lệ Khi Bé Chọn Nhầm (Gentle Elastic Wobble - Không Báo Đỏ) */
@keyframes gentleWobble {
    0%, 100% { transform: translateX(0) rotate(0deg); }
    25% { transform: translateX(-8px) rotate(-4deg); }
    50% { transform: translateX(8px) rotate(4deg); }
    75% { transform: translateX(-4px) rotate(-2deg); }
}
.wobble-hint {
    animation: gentleWobble 0.45s ease-in-out;
}
```

### 2.4. Chế Độ Bảo Vệ Thị Giác Kép (Dual Eye-Care Protection)
1. **Warm Amber Filter (`body.eye-care-active`):** Áp dụng bộ lọc `filter: sepia(16%) saturate(92%) brightness(97%)` để triệt tiêu ánh sáng xanh khi bé học vào buổi tối.
2. **20-20-20 Sleepy Fox Curtain (Màn Chắn Nghỉ Mắt Tự Động):** Sau đúng 20 phút tương tác, một màn sương rừng xanh dịu nhẹ phủ lên màn hình, Cáo Sunny ngáp ngủ đáng yêu và hướng dẫn bé nhìn ra xa 20 giây + uống một ngụm nước trước khi chơi tiếp.

---

## 3. CẤU TRÚC KIẾN TRÚC DỰ ÁN (SYSTEM ARCHITECTURE)

AI Agent có thể triển khai dự án dưới dạng **Single-File HTML (`index.html`)** để chạy thử nghiệm tức thì, hoặc tách thành **Modular Project** trong Antigravity IDE theo cấu trúc chuẩn sau:

```text
sunny-meadow-v2/
├── AGENTS.md                          # File đặc tả gốc này (Single Source of Truth cho AI)
├── index.html                         # Bản tích hợp đầy đủ chạy độc lập (Single-File Runtime)
├── src/
│   ├── assets/
│   │   └── svg-vault.html             # Chứa toàn bộ <svg id="sunny-meadow-svg-vault"> (20+ symbols)
│   ├── core/
│   │   ├── audioEngine.js             # Bộ tổng hợp nhạc cụ Tone.js (Marimba, Kalimba, Harp) + TTS
│   │   ├── stateStore.js              # Quản lý Star Drops, Stickers, Tiến độ 5 Game (localStorage)
│   │   └── eyeCareGuard.js            # Bộ đếm 20 phút & điều khiển Warm Filter
│   ├── data/
│   │   └── meadowCurriculum.js        # Kho dữ liệu từ vựng, màu sắc, câu thần chú phân theo chủ đề
│   ├── games/                         # 5 GAME THẾ HỆ MỚI (Đã xóa bỏ các game cũ đơn điệu)
│   │   ├── Game1_HungryPicnic.js      # Tiệc Picnic Đút Quả Cho Thú Rừng (Nghe hiểu đa tầng)
│   │   ├── Game2_ColorSplashPond.js   # Pha Màu Tô Điểm Hồ Sen (Màu sắc, Số đếm & Tính từ)
│   │   ├── Game3_FireflyLanterns.js   # Đom Đóm Thắp Sáng Đêm Rừng (Phonics & Ghép Âm Đánh Vần)
│   │   ├── Game4_MagicVoiceWindmill.js# Cối Xay Gió Giọng Nói Phép Thuật (Luyện nói tương tác vật lý)
│   │   └── Game5_HideAndSeekTree.js   # Trốn Tìm Quanh Cây Cổ Thụ (Giới từ In/On/Under & Phản xạ)
│   └── ui/
│       ├── WorldMapDiorama.js         # Bản đồ đồng cỏ tương tác ngày/đêm
│       ├── StickerBookModal.js        # Cuốn Sổ Dán Nhãn (Thưởng vật phẩm sưu tầm cho bé)
│       └── ParentalMathGate.js        # Cổng xác thực toán học & Dashboard cho ba mẹ
```

---

## 4. HỆ THỐNG ÂM THANH TỰ NHIÊN & GIỌNG NÓI (AUDIO & SPEECH ENGINE)

Không dùng tiếng "bíp" điện tử. Mọi âm thanh trong Sunny Meadow V2.0 được tổng hợp mô phỏng nhạc cụ gỗ tự nhiên (**Marimba, Kalimba, Đàn Hạc Nước**):

```javascript
/**
 * Bộ Tổng Hợp Âm Thanh Thiên Nhiên (Tone.js) & Giọng Đọc Trẻ Em (Web Speech API)
 */
const MeadowAudioEngine = {
    // 1. Âm thanh Kalimba/Marimba khi bé chạm vào vật phẩm
    async playWoodTap(note = "C5") {
        await Tone.start();
        const synth = new Tone.Synth({
            oscillator: { type: "sine" },
            envelope: { attack: 0.005, decay: 0.18, sustain: 0, release: 0.15 }
        }).toDestination();
        synth.triggerAttackRelease(note, "16n");
    },

    // 2. Âm thanh Đàn Hạc Nước (Water Harp Glissando) khi bé hoàn thành nhiệm vụ
    async playMagicalSuccess() {
        await Tone.start();
        const poly = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: { attack: 0.02, decay: 0.25, sustain: 0.1, release: 0.7 }
        }).toDestination();
        const now = Tone.now();
        ["C5", "E5", "G5", "B5", "C6"].forEach((note, idx) => {
            poly.triggerAttackRelease(note, "8n", now + idx * 0.08);
        });
    },

    // 3. Âm thanh Nhún Nhẹ khi bé chọn chưa đúng (Không gây giật mình)
    async playSoftBounce() {
        await Tone.start();
        const synth = new Tone.Synth({
            oscillator: { type: "triangle" },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 }
        }).toDestination();
        const now = Tone.now();
        synth.triggerAttackRelease("F4", "16n", now);
        synth.triggerAttackRelease("D4", "16n", now + 0.1);
    },

    // 4. Giọng đọc tiếng Anh chuẩn Sư phạm Nhi khoa (Chậm rãi, Tươi vui)
    speak(text, { rate = 0.85, pitch = 1.18, onEnd = null } = {}) {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'en-US';
        utter.rate = rate;
        utter.pitch = pitch;
        if (onEnd) utter.onend = onEnd;
        window.speechSynthesis.speak(utter);
    }
};
```

---

## 5. ĐẶC TẢ CHI TIẾT 5 GAME THẾ HỆ MỚI (NEXT-GEN PLAYABLE MINI-GAMES)

> **Lưu ý cho AI Agent:** Các game cũ (chọn trắc nghiệm đơn thuần, xếp đá chữ cái tĩnh, ghép mây ngữ pháp) đã bị **loại bỏ hoàn toàn**. Thay vào đó là 5 trò chơi mang tính **tương tác vật lý - nhân quả (Cause & Effect Gameplay)** dưới đây:

---

### 🧺 GAME 1: Hungry Woodland Picnic (Tiệc Picnic Đút Quả Cho Thú Rừng)
- **Mục tiêu sư phạm:** Nghe hiểu câu giao tiếp tự nhiên kết hợp Số đếm + Màu sắc + Danh từ (Ví dụ: *"Feed the bunny two crunchy carrots!"* hoặc *"Give the fox one sweet strawberry!"*).
- **Tại sao trẻ mê thích:** Trẻ em cực kỳ thích cảm giác "chăm sóc và đút đồ ăn" cho thú cưng, nghe tiếng nhai *"Nom nom nom! Yummy!"* và thấy bụng con vật tròn lên.
- **Thiết kế Sân khấu UI:**
  - Phía trên là thảm cỏ picnic kẻ caro đỏ-trắng trải dưới gốc cây sồi.
  - Giữa sân khấu là nhân vật thú rừng đang vẫy tay (Cáo Sunny `#svg-sunny-fox` hoặc Thỏ Mũm Mĩm `#svg-chubby-bunny`) với bong bóng suy nghĩ hiển thị số lượng đồ ăn đang thèm.
  - Phía dưới là chiếc giỏ mây đan chứa các loại quả SVG tươi mọng: Táo Đỏ (`#svg-item-apple`), Dâu Tây (`#svg-item-strawberry`), Cà Rốt (`#svg-item-carrot`), Chuối Vàng (`#svg-item-banana`).
- **Luồng Tương tác (State Machine):**
  1. `STATE_ORDER`: Thú rừng nói câu yêu cầu qua TTS (VD: *"I am hungry! Please give me TWO red strawberries!"*).
  2. `STATE_FEEDING`: Bé chạm vào từng quả trong giỏ. Quả bay theo đường cong Parabol vào miệng thú rừng.
  3. **Phản hồi Đúng:** Tiếng nhai *"Crunch! Yummy! One... Two!"*, má thú rừng ửng hồng và nhảy tưng bừng, thưởng +10 Sao & mở khóa Sticker.
  4. **Phản hồi Nhầm:** Nếu bé đưa nhầm quả chuối khi thú đang xin dâu tây, thú rừng lắc đầu đáng yêu: *"Ooh, a yellow banana! Save that for later, I want a red strawberry!"* (Quả chuối nhẹ nhàng bay về giỏ).

---

### 🎨 GAME 2: Color Splash Lily Pond (Giọt Sương Pha Màu Tô Điểm Hồ Sen)
- **Mục tiêu sư phạm:** Học từ vựng Màu sắc (Red, Yellow, Blue, Green, Orange, Purple, Pink) + Động vật dưới nước (Frog, Duck, Fish) + Tư duy pha màu khoa học cơ bản (Ví dụ: `Yellow + Blue = Green`).
- **Tại sao trẻ mê thích:** Ban đầu các chú Ếch Cốm, Vịt Nhỏ hoặc Bông Hoa Súng trên hồ bị mất màu (chỉ có nét vẽ trắng kem như tranh tô màu). Chính tay bé chạm vào các giọt sương màu sắc để "nhuộm màu phép thuật" cho cả mặt hồ bừng sáng!
- **Thiết kế Sân khấu UI:**
  - Mặt hồ nước xanh ngọc lấp lánh với 3 chiếc lá sen lớn.
  - Trên lá sen là một sinh vật đang ở trạng thái **Uncolored Sketch** (sử dụng CSS `filter: grayscale(100%) brightness(1.3)` hoặc dùng biến màu `currentColor`).
  - Khay bảng màu bằng lá khoai nước ở dưới gồm các giọt sương màu (`#svg-color-droplet`) căng mọng.
- **Luồng Tương tác (State Machine):**
  1. `STATE_PROMPT`: Hệ thống đọc nhiệm vụ: *"Paint the little frog GREEN!"* (Ở cấp độ nâng cao: *"Mix YELLOW and BLUE to make a GREEN frog!"*).
  2. `STATE_SPLASH`: Bé chạm vào giọt nước màu tương ứng. Giọt nước bắn tung tóe (SVG Ripple & Splash Animation) phủ màu rực rỡ lên chú ếch.
  3. `STATE_CELEBRATE`: Chú ếch sau khi có màu xanh lá sẽ nhảy *"Ribbit! I am a green frog!"* và nhảy xuống hồ tạo sóng nước.

---

### ✨ GAME 3: Firefly Phonics Lanterns (Đom Đóm Thắp Sáng Đêm Rừng)
- **Mục tiêu sư phạm:** Nhận diện Âm đầu (Initial Phonemes `/s/`, `/b/`, `/k/`, `/f/`) và Ghép vần CVC ngắn (`S-U-N`, `F-O-X`, `B-E-E`, `C-A-T`).
- **Tại sao trẻ mê thích:** Thay vì xếp chữ trên bảng trắng nhàm chán, sân khấu chuyển sang **Bầu Trời Đêm Tím Huyền Diệu**. Các chú đom đóm bụng phát sáng vàng ấm áp mang theo chữ cái đang bay lượn. Khi bé chạm đúng chú đom đóm, nó bay vào chiếc lồng đèn thủy tinh làm cả khu rừng sáng bừng lên!
- **Thiết kế Sân khấu UI:**
  - Nền trời chuyển sang gradient tím-xanh đêm dịu (`#1E1B4B` -> `#312E81`).
  - Giữa màn hình là 3 chiếc Lồng Đèn Hoa Sen (`#svg-magic-lantern`) đang tắt sáng, bên trên có hình bóng mờ của từ vựng (VD: Hình Mặt Trời cho từ `S - U - N`).
  - Xung quanh là 4–5 chú Đom Đóm (`#svg-glow-firefly`) bay lượn theo quỹ đạo hình sin, mỗi chú ôm một chữ cái phát sáng.
- **Luồng Tương tác (State Machine):**
  1. `STATE_LISTEN`: Cú Thông Thái Ollie đọc âm vị từng chữ: *"/s/ ... /ʌ/ ... /n/ — SUN!"*.
  2. `STATE_CATCH`: Bé chạm vào chú đom đóm mang chữ `S`, sau đó là `U`, rồi `N`.
  3. Mỗi chú đom đóm bay vào lồng đèn sẽ phát âm rõ âm vị của chữ đó và thắp sáng 1/3 khu rừng. Khi đủ 3 lồng đèn, cả khu rừng bừng sáng rực rỡ và mở khóa hình ảnh hoàn chỉnh!

---

### 🌬️ GAME 4: Magic Voice Windmill & Dandelion (Cối Xay Gió & Hoa Bồ Công Anh Giọng Nói)
- **Mục tiêu sư phạm:** Luyện phát âm to, rõ ràng, tự tin bật âm tiếng Anh (Speaking & Breath Control).
- **Tại sao trẻ mê thích:** Trẻ nhỏ rất ngại nếu chỉ thấy thanh sóng âm khô khan. Ở game này, **giọng nói của bé tạo ra sức gió phép thuật!** Khi bé đọc to từ tiếng Anh vào Micro, cánh Cối Xay Gió Gỗ quay tít, những cánh hoa Bồ Công Anh bay vút lên trời và đẩy khinh khí cầu của Cáo Sunny bay qua đỉnh đồi!
- **Thiết kế Sân khấu UI:**
  - Đồi cỏ xanh với Cối Xay Gió (`#svg-windmill`), bông Hoa Bồ Công Anh trắng muốt (`#svg-dandelion`) và Khinh Khí Cầu (`#svg-hot-air-balloon`).
  - Nút Micro khổng lồ màu hồng san hô có vòng hào quang co giãn.
- **Luồng Tương tác (State Machine):**
  1. `STATE_MODEL`: Vẹt Echo đọc mẫu từ khóa (VD: *"RAINBOW!"* hoặc *"BUTTERFLY!"*).
  2. `STATE_VOICE_WIND`: Bé bấm nút Micro và đọc to. Hệ thống dùng `Web Audio AnalyserNode` (hoặc `webkitSpeechRecognition` + bộ mô phỏng thông minh) đo cường độ âm thanh để tăng tốc độ xoay CSS `animation-duration` của cánh quạt cối xay gió.
  3. `STATE_FLY`: Khi bé nói xong, cánh hoa bồ công anh tung bay khắp màn hình, khinh khí cầu bay lên đỉnh đồi mở rương kho báu 3 Ngôi Sao Vàng!

---

### 🌳 GAME 5: Woodland Hide & Seek (Trốn Tìm Quanh Cây Cổ Thụ)
- **Mục tiêu sư phạm:** Học Giới từ chỉ vị trí (**IN**, **ON**, **UNDER**, **BEHIND**) kết hợp danh từ tự nhiên (Tree, Bush, Mushroom, Log, Basket).
- **Tại sao trẻ mê thích:** Trò "Ú òa / Trốn tìm" (Peek-a-boo) là trò chơi bản năng cuốn hút mọi trẻ em từ 3–9 tuổi. Các bạn thú nhỏ giấu mình sau bụi hoa, dưới cây nấm đỏ hay trên ngọn cây khiến cái tai hoặc cái đuôi lộ ra ngoài, chờ bé chạm vào để nhảy ra *"Peek-a-boo!"*.
- **Thiết kế Sân khấu UI:**
  - Một khung cảnh khu rừng đa lớp (Multi-layer SVG Scene) gồm: Tán cây cao (`ON the tree`), Hốc cây giữa thân (`IN the tree hollow`), Cây nấm đỏ khổng lồ (`UNDER the mushroom`), và Bụi hoa mẫu đơn (`BEHIND the bush`).
- **Luồng Tương tác (State Machine):**
  1. `STATE_HIDE`: Các nhân vật trốn vào 4 vị trí (có đôi tai thỏ hoặc đuôi cáo cử động nhẹ ở từng vị trí để gợi ý thị giác).
  2. `STATE_SEEK_PROMPT`: Giọng đọc vang lên: *"Where is the bunny? Find the bunny UNDER the red mushroom!"*.
  3. `STATE_PEEKABOO`: Bé chạm vào vị trí dưới cây nấm đỏ -> Cây nấm nhấc lên, chú thỏ nhảy vọt ra cười khúc khích *"Peek-a-boo! I am UNDER the mushroom!"*.

---

## 6. KHO TÀI NGUYÊN SVG VAULT & MÃ NGUỒN UI ĐẦY ĐỦ (COMPLETE EMBEDDED SVG & UI CODE)

Dưới đây là toàn bộ khối `<svg id="sunny-meadow-svg-vault">` và bộ khung giao diện chuẩn đã được thiết kế chi tiết từng đường nét vector (`<symbol>`). **AI Agent có thể copy nguyên khối này đưa thẳng vào `index.html` hoặc tách ra `svg-vault.html` mà không cần vẽ lại:**

```html
<!-- ============================================================================
     SUNNY MEADOW V2.0 - MASTER CENTRALIZED SVG SPRITE VAULT (16 HIGH-DETAIL ASSETS)
     Bao gồm: Linh vật, Thức ăn Picnic, Giọt màu, Đom đóm, Lồng đèn, Cối xay gió,
     Khinh khí cầu, Nấm đỏ, Cây cổ thụ, Giỏ mây và Huy hiệu.
============================================================================= -->
<svg id="sunny-meadow-svg-vault" style="display: none;" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <!-- 1. LINH VẬT CHÍNH: CÁO NHỎ SUNNY (SUNNY THE FOX) -->
        <symbol id="svg-sunny-fox" viewBox="0 0 180 180">
            <!-- Đuôi bông xù 2 màu -->
            <path d="M122 118 C162 104, 174 140, 144 156 C124 166, 108 148, 114 132 Z" fill="#FF7E67"/>
            <path d="M146 125 C164 130, 162 148, 144 156 C136 148, 138 132, 146 125 Z" fill="#FFFDF5"/>
            <!-- Thân & Bụng kem -->
            <ellipse cx="90" cy="132" rx="36" ry="32" fill="#FF7E67"/>
            <ellipse cx="90" cy="136" rx="23" ry="22" fill="#FFFDF5"/>
            <!-- Khăn quàng lá non -->
            <path d="M60 108 Q90 122 120 108 L114 122 Q90 132 66 122 Z" fill="#57CC99"/>
            <path d="M100 116 L110 140 L122 135 L112 114 Z" fill="#2D8A61"/>
            <!-- Đôi tai lớn -->
            <path d="M38 64 L26 18 L72 44 Z" fill="#FF7E67" stroke="#E0533C" stroke-width="3" stroke-linejoin="round"/>
            <path d="M40 56 L33 28 L62 44 Z" fill="#FFD166"/>
            <path d="M142 64 L154 18 L108 44 Z" fill="#FF7E67" stroke="#E0533C" stroke-width="3" stroke-linejoin="round"/>
            <path d="M140 56 L147 28 L118 44 Z" fill="#FFD166"/>
            <!-- Khuôn mặt bầu bĩnh -->
            <ellipse cx="90" cy="76" rx="54" ry="42" fill="#FF7E67"/>
            <path d="M36 76 C36 106, 70 118, 90 118 C110 118, 144 106, 144 76 C128 76, 108 88, 90 102 C72 88, 52 76, 36 76 Z" fill="#FFFDF5"/>
            <!-- Mắt to long lanh -->
            <circle cx="65" cy="72" r="8.5" fill="#1E293B"/>
            <circle cx="62" cy="69" r="3.2" fill="#FFFFFF"/>
            <circle cx="68" cy="75" r="1.5" fill="#FFFFFF"/>
            <circle cx="115" cy="72" r="8.5" fill="#1E293B"/>
            <circle cx="112" cy="69" r="3.2" fill="#FFFFFF"/>
            <circle cx="118" cy="75" r="1.5" fill="#FFFFFF"/>
            <!-- Má hồng phấn -->
            <ellipse cx="50" cy="85" rx="8" ry="4.5" fill="#FF758F" opacity="0.75"/>
            <ellipse cx="130" cy="85" rx="8" ry="4.5" fill="#FF758F" opacity="0.75"/>
            <!-- Mũi & Miệng cười tươi -->
            <ellipse cx="90" cy="88" rx="7" ry="5" fill="#1E293B"/>
            <path d="M80 96 Q90 106 100 96" fill="none" stroke="#1E293B" stroke-width="3.5" stroke-linecap="round"/>
            <!-- Mầm cây nhỏ trên đỉnh đầu -->
            <path d="M90 34 L90 22" stroke="#2D8A61" stroke-width="4" stroke-linecap="round"/>
            <path d="M90 24 C90 12, 108 10, 110 20 C110 28, 96 30, 90 24 Z" fill="#80ED99"/>
        </symbol>

        <!-- 2. BẠN ĐỒNG HÀNH: THỎ TRẮNG MŨM MĨM (CHUBBY BUNNY - GAME 1 & 5) -->
        <symbol id="svg-chubby-bunny" viewBox="0 0 180 180">
            <!-- Tai thỏ dài -->
            <ellipse cx="66" cy="44" rx="14" ry="34" transform="rotate(-10 66 44)" fill="#FFFDF5" stroke="#E2E8F0" stroke-width="3"/>
            <ellipse cx="66" cy="46" rx="7" ry="24" transform="rotate(-10 66 46)" fill="#FFB3C6"/>
            <ellipse cx="114" cy="44" rx="14" ry="34" transform="rotate(10 114 44)" fill="#FFFDF5" stroke="#E2E8F0" stroke-width="3"/>
            <ellipse cx="114" cy="46" rx="7" ry="24" transform="rotate(10 114 46)" fill="#FFB3C6"/>
            <!-- Thân tròn mũm mĩm -->
            <ellipse cx="90" cy="134" rx="40" ry="32" fill="#FFFDF5" stroke="#E2E8F0" stroke-width="3"/>
            <ellipse cx="90" cy="138" rx="24" ry="20" fill="#FFE5EC"/>
            <!-- Đầu thỏ -->
            <ellipse cx="90" cy="90" rx="46" ry="38" fill="#FFFDF5" stroke="#E2E8F0" stroke-width="3"/>
            <!-- Mắt & Má hồng -->
            <circle cx="68" cy="86" r="7.5" fill="#1E293B"/>
            <circle cx="65.5" cy="83.5" r="2.8" fill="#FFFFFF"/>
            <circle cx="112" cy="86" r="7.5" fill="#1E293B"/>
            <circle cx="109.5" cy="83.5" r="2.8" fill="#FFFFFF"/>
            <ellipse cx="54" cy="96" rx="7" ry="4" fill="#FF758F" opacity="0.65"/>
            <ellipse cx="126" cy="96" rx="7" ry="4" fill="#FF758F" opacity="0.65"/>
            <!-- Mũi hồng & Răng thỏ đáng yêu -->
            <polygon points="85,93 95,93 90,100" fill="#FF758F"/>
            <rect x="86" y="102" width="8" height="7" rx="2" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
            <path d="M80 101 Q90 107 100 101" fill="none" stroke="#1E293B" stroke-width="3" stroke-linecap="round"/>
        </symbol>

        <!-- 3. ẾCH CỐM BIẾN HÌNH (COLORABLE LILY FROG - GAME 2) -->
        <!-- Sử dụng currentColor để tự động đổi màu mượt mà khi bé pha màu! -->
        <symbol id="svg-color-frog" viewBox="0 0 160 160">
            <!-- Lá sen làm đế -->
            <ellipse cx="80" cy="136" rx="64" ry="18" fill="#57CC99" stroke="#2D8A61" stroke-width="3"/>
            <path d="M80 136 L140 132" stroke="#2D8A61" stroke-width="3"/>
            <!-- Thân ếch ăn theo màu động (currentColor) -->
            <ellipse cx="80" cy="102" rx="44" ry="34" fill="currentColor" stroke="#1E293B" stroke-width="3.5"/>
            <ellipse cx="80" cy="110" rx="28" ry="20" fill="#FFFDF5" opacity="0.85"/>
            <!-- Hai mắt lồi đáng yêu trên đỉnh đầu -->
            <circle cx="56" cy="66" r="18" fill="currentColor" stroke="#1E293B" stroke-width="3.5"/>
            <circle cx="104" cy="66" r="18" fill="currentColor" stroke="#1E293B" stroke-width="3.5"/>
            <circle cx="56" cy="66" r="11" fill="#FFFFFF"/>
            <circle cx="104" cy="66" r="11" fill="#FFFFFF"/>
            <circle cx="56" cy="66" r="6" fill="#1E293B"/>
            <circle cx="104" cy="66" r="6" fill="#1E293B"/>
            <circle cx="54" cy="63" r="2.2" fill="#FFFFFF"/>
            <circle cx="102" cy="63" r="2.2" fill="#FFFFFF"/>
            <!-- Nụ cười rộng -->
            <path d="M58 92 Q80 108 102 92" fill="none" stroke="#1E293B" stroke-width="4" stroke-linecap="round"/>
            <ellipse cx="48" cy="88" rx="6" ry="3.5" fill="#FF758F" opacity="0.75"/>
            <ellipse cx="112" cy="88" rx="6" ry="3.5" fill="#FF758F" opacity="0.75"/>
        </symbol>

        <!-- 4. ĐOM ĐÓM PHÁT SÁNG (GLOWING FIREFLY - GAME 3) -->
        <symbol id="svg-glow-firefly" viewBox="0 0 140 140">
            <!-- Quầng sáng phát quang ở bụng -->
            <circle cx="70" cy="92" r="34" fill="#FFD166" opacity="0.35"/>
            <circle cx="70" cy="92" r="22" fill="#FFE066" opacity="0.7"/>
            <!-- Đôi cánh tiên trong suốt -->
            <ellipse cx="46" cy="64" rx="24" ry="14" transform="rotate(-25 46 64)" fill="#D8F3FF" stroke="#FFFFFF" stroke-width="2.5" opacity="0.9"/>
            <ellipse cx="94" cy="64" rx="24" ry="14" transform="rotate(25 94 64)" fill="#D8F3FF" stroke="#FFFFFF" stroke-width="2.5" opacity="0.9"/>
            <!-- Bụng đom đóm phát sáng -->
            <ellipse cx="70" cy="88" rx="20" ry="24" fill="#FFD166" stroke="#F59E0B" stroke-width="2.5"/>
            <!-- Đầu đom đóm -->
            <circle cx="70" cy="54" r="18" fill="#475569"/>
            <circle cx="63" cy="52" r="4" fill="#FFFFFF"/>
            <circle cx="77" cy="52" r="4" fill="#FFFFFF"/>
            <path d="M65 60 Q70 64 75 60" fill="none" stroke="#FFD166" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Râu phát sáng -->
            <path d="M62 38 Q52 24 44 28" fill="none" stroke="#FFD166" stroke-width="3" stroke-linecap="round"/>
            <circle cx="44" cy="28" r="4.5" fill="#FFD166"/>
            <path d="M78 38 Q88 24 96 28" fill="none" stroke="#FFD166" stroke-width="3" stroke-linecap="round"/>
            <circle cx="96" cy="28" r="4.5" fill="#FFD166"/>
        </symbol>

        <!-- 5. LỒNG ĐÈN HOA SEN PHÉP THUẬT (MAGIC LANTERN - GAME 3) -->
        <symbol id="svg-magic-lantern" viewBox="0 0 120 150">
            <!-- Quai treo -->
            <path d="M45 24 Q60 4 75 24" fill="none" stroke="#F59E0B" stroke-width="4" stroke-linecap="round"/>
            <!-- Nắp lồng đèn -->
            <path d="M30 34 Q60 18 90 34 Z" fill="#D97706"/>
            <!-- Thân lồng đèn thủy tinh (nhận màu từ currentColor) -->
            <rect x="32" y="34" width="56" height="76" rx="22" fill="currentColor" stroke="#F59E0B" stroke-width="4"/>
            <!-- Đế hoa sen -->
            <path d="M26 110 Q60 124 94 110 L84 124 L36 124 Z" fill="#D97706"/>
        </symbol>

        <!-- 6. CỐI XAY GIÓ PHÉP THUẬT (MAGIC WINDMILL - GAME 4) -->
        <symbol id="svg-windmill" viewBox="0 0 180 200">
            <!-- Thân tháp gỗ & Đá -->
            <polygon points="62,90 118,90 132,185 48,185" fill="#FFFDF5" stroke="#CBD5E1" stroke-width="4" stroke-linejoin="round"/>
            <path d="M54 88 Q90 56 126 88 Z" fill="#FF758F" stroke="#C9184A" stroke-width="3"/>
            <!-- Cửa vòm gỗ -->
            <path d="M76 185 L76 152 A14 14 0 0 1 104 152 L104 185 Z" fill="#B45309"/>
            <!-- Cánh quạt (Có thể tách riêng để xoay bằng CSS) -->
            <g transform="translate(90, 88)">
                <rect x="-8" y="-68" width="16" height="58" rx="6" fill="#FFD166" stroke="#D99B00" stroke-width="2.5"/>
                <rect x="-8" y="10" width="16" height="58" rx="6" fill="#FFD166" stroke="#D99B00" stroke-width="2.5"/>
                <rect x="-68" y="-8" width="58" height="16" rx="6" fill="#4CC9F0" stroke="#0077B6" stroke-width="2.5"/>
                <rect x="10" y="-8" width="58" height="16" rx="6" fill="#4CC9F0" stroke="#0077B6" stroke-width="2.5"/>
                <circle cx="0" cy="0" r="12" fill="#FF758F" stroke="#FFFFFF" stroke-width="3"/>
            </g>
        </symbol>

        <!-- 7. CÂY NẤM ĐỎ CHẤM TRẮNG (RED TOADSTOOL MUSHROOM - GAME 5) -->
        <symbol id="svg-red-mushroom" viewBox="0 0 160 160">
            <!-- Thân nấm kem mềm -->
            <path d="M58 84 L50 142 C50 150, 110 150, 110 142 L102 84 Z" fill="#FFFDF5" stroke="#E2E8F0" stroke-width="3"/>
            <!-- Mũ nấm đỏ tươi -->
            <path d="M18 88 C18 32, 142 32, 142 88 C142 98, 18 98, 18 88 Z" fill="#FF5A5F" stroke="#C9184A" stroke-width="3"/>
            <!-- Chấm tròn trắng trên mũ nấm -->
            <circle cx="52" cy="62" r="11" fill="#FFFDF5"/>
            <circle cx="96" cy="54" r="14" fill="#FFFDF5"/>
            <circle cx="118" cy="76" r="8" fill="#FFFDF5"/>
            <circle cx="74" cy="78" r="7" fill="#FFFDF5"/>
            <!-- Khuôn mặt nấm thân thiện -->
            <circle cx="70" cy="112" r="4" fill="#1E293B"/>
            <circle cx="90" cy="112" r="4" fill="#1E293B"/>
            <path d="M75 120 Q80 125 85 120" fill="none" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round"/>
        </symbol>

        <!-- 8. VẬT PHẨM PICNIC: QUẢ DÂU TÂY MỌNG NƯỚC (SWEET STRAWBERRY) -->
        <symbol id="svg-item-strawberry" viewBox="0 0 100 100">
            <path d="M50 24 C26 24, 18 52, 34 78 C42 90, 58 90, 66 78 C82 52, 74 24, 50 24 Z" fill="#FF4D6D" stroke="#C9184A" stroke-width="2.5"/>
            <!-- Đài lá xanh -->
            <path d="M32 26 Q50 36 68 26 Q58 16 50 22 Q42 16 32 26 Z" fill="#57CC99" stroke="#2D8A61" stroke-width="2"/>
            <!-- Hạt dâu vàng -->
            <circle cx="40" cy="46" r="2.2" fill="#FFD166"/>
            <circle cx="60" cy="46" r="2.2" fill="#FFD166"/>
            <circle cx="50" cy="58" r="2.2" fill="#FFD166"/>
            <circle cx="38" cy="66" r="2.2" fill="#FFD166"/>
            <circle cx="62" cy="66" r="2.2" fill="#FFD166"/>
            <circle cx="50" cy="76" r="2.2" fill="#FFD166"/>
        </symbol>

        <!-- 9. VẬT PHẨM PICNIC: CỦ CÀ RỐT GIÒN TAN (CRUNCHY CARROT) -->
        <symbol id="svg-item-carrot" viewBox="0 0 100 100">
            <!-- Lá cà rốt xanh -->
            <path d="M50 26 C38 8, 28 16, 44 28" fill="#57CC99" stroke="#2D8A61" stroke-width="2.5"/>
            <path d="M50 26 C50 6, 62 6, 54 26" fill="#80ED99" stroke="#2D8A61" stroke-width="2.5"/>
            <path d="M50 26 C66 10, 74 20, 56 28" fill="#57CC99" stroke="#2D8A61" stroke-width="2.5"/>
            <!-- Thân củ cà rốt cam -->
            <path d="M34 30 Q50 24 66 30 L54 86 C52 92, 48 92, 46 86 Z" fill="#FF9F1C" stroke="#D97706" stroke-width="2.5"/>
            <path d="M40 44 L52 44 M46 58 L58 58 M44 72 L52 72" stroke="#D97706" stroke-width="3" stroke-linecap="round"/>
        </symbol>

        <!-- 10. VẬT PHẨM PICNIC: QUẢ TÁO ĐỎ (RED APPLE) -->
        <symbol id="svg-item-apple" viewBox="0 0 100 100">
            <path d="M50 30 C30 22, 16 40, 20 64 C24 84, 40 90, 50 84 C60 90, 76 84, 80 64 C84 40, 70 22, 50 30 Z" fill="#FF5A5F" stroke="#C9184A" stroke-width="2.5"/>
            <path d="M50 30 L52 14" stroke="#78350F" stroke-width="5" stroke-linecap="round"/>
            <path d="M52 18 C64 12, 76 16, 68 25 C62 30, 54 24, 52 18 Z" fill="#80ED99" stroke="#2D8A61" stroke-width="2"/>
            <ellipse cx="34" cy="48" rx="5" ry="11" transform="rotate(-18 34 48)" fill="#FFFFFF" opacity="0.45"/>
        </symbol>

        <!-- 11. VẬT PHẨM PICNIC: QUẢ CHUỐI VÀNG (YELLOW BANANA) -->
        <symbol id="svg-item-banana" viewBox="0 0 100 100">
            <path d="M24 68 C42 86, 78 72, 82 30 C83 22, 76 18, 72 24 C64 54, 42 66, 26 58 C20 56, 18 62, 24 68 Z" fill="#FFD166" stroke="#D99B00" stroke-width="2.5"/>
            <path d="M74 22 L78 15" stroke="#78350F" stroke-width="5" stroke-linecap="round"/>
        </symbol>

        <!-- 12. GIỌT SƯƠNG MÀU SẮC (COLOR DROPLET - GAME 2) -->
        <symbol id="svg-color-droplet" viewBox="0 0 100 100">
            <path d="M50 12 C50 12, 18 52, 18 70 C18 87, 32 94, 50 94 C68 94, 82 87, 82 70 C82 52, 50 12, 50 12 Z" fill="currentColor" stroke="#FFFFFF" stroke-width="4"/>
            <ellipse cx="38" cy="64" rx="6" ry="12" transform="rotate(-15 38 64)" fill="#FFFFFF" opacity="0.5"/>
            <circle cx="42" cy="80" r="3" fill="#FFFFFF" opacity="0.5"/>
        </symbol>

        <!-- 13. HUY HIỆU NGÔI SAO CƯỜI (SMILING STAR REWARD) -->
        <symbol id="svg-star-badge" viewBox="0 0 120 120">
            <polygon points="60,8 76,40 112,45 86,70 92,106 60,89 28,106 34,70 8,45 44,40" fill="#FFD166" stroke="#D99B00" stroke-width="4" stroke-linejoin="round"/>
            <polygon points="60,20 72,44 98,48 79,66 83,92 60,80 37,92 41,66 22,48 48,44" fill="#FFF3B0"/>
            <circle cx="51" cy="56" r="4" fill="#1E293B"/>
            <circle cx="69" cy="56" r="4" fill="#1E293B"/>
            <path d="M53 66 Q60 72 67 66" fill="none" stroke="#1E293B" stroke-width="3" stroke-linecap="round"/>
        </symbol>
    </defs>
</svg>
```

---

## 7. MẪU COMPONENT SÂN KHẤU GAME CHUẨN (REFERENCE UI IMPLEMENTATION)

Khi AI Agent dựng bất kỳ màn hình game nào trong 5 game trên, hãy tuân thủ cấu trúc HTML/Tailwind mẫu dưới đây để đảm bảo tỷ lệ vàng cho trẻ em (Header gọn gàng + Sân khấu trung tâm chiếm 75% diện tích + Khay vật phẩm lớn ở đáy):

```html
<!-- MẪU SÂN KHẤU GAME 1: HUNGRY WOODLAND PICNIC -->
<div class="meadow-clay-card p-6 md:p-8 bg-gradient-to-b from-[#D8F3FF] via-[#FFFDF5] to-[#D9F99D]/60 relative overflow-hidden">
    
    <!-- 1. Thanh Hướng Dẫn Bằng Giọng Nói (Audio Prompt Bar) -->
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white/90 p-4 rounded-3xl border-2 border-white shadow-sm">
        <div class="flex items-center gap-4">
            <button onclick="MeadowAudioEngine.speak('I am hungry! Please give me two red strawberries!')"
                class="toy-btn toy-btn-green w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                aria-label="Nghe hướng dẫn">
                🔊
            </button>
            <div>
                <span class="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                    🧺 Game 1 • Tiệc Picnic Rừng Xanh
                </span>
                <h2 class="text-2xl md:text-3xl font-extrabold text-slate-800 mt-1 font-display">
                    "Give the bunny <span class="text-rose-600 underline">TWO red strawberries</span>!"
                </h2>
                <p class="text-xs md:text-sm font-bold text-slate-500">
                    (Bé hãy chạm vào 2 quả dâu tây đỏ để đút cho bạn Thỏ nhé!)
                </p>
            </div>
        </div>

        <!-- Bộ đếm tiến độ trực quan bằng hình ảnh -->
        <div class="flex items-center gap-2 bg-rose-50 border-2 border-rose-200 px-4 py-2 rounded-2xl">
            <svg class="w-8 h-8"><use href="#svg-item-strawberry"></use></svg>
            <span class="text-2xl font-extrabold text-rose-600 font-display">1 / 2</span>
        </div>
    </div>

    <!-- 2. Sân Khấu Nhân Vật Trung Tâm (Interactive Character Stage) -->
    <div class="relative min-h-[240px] flex flex-col items-center justify-center my-4">
        <!-- Bong bóng suy nghĩ của Thỏ -->
        <div class="bg-white border-4 border-rose-200 rounded-3xl px-5 py-2.5 shadow-md mb-2 flex items-center gap-2 animate-bounce">
            <span class="font-display font-extrabold text-slate-700 text-lg">Yummy!</span>
            <svg class="w-7 h-7"><use href="#svg-item-strawberry"></use></svg>
            <svg class="w-7 h-7"><use href="#svg-item-strawberry"></use></svg>
        </div>

        <!-- Nhân vật Thỏ Mũm Mĩm -->
        <div class="w-40 h-40 cursor-pointer transition transform hover:scale-105"
             onclick="MeadowAudioEngine.speak('Yummy strawberries please!')">
            <svg class="w-full h-full"><use href="#svg-chubby-bunny"></use></svg>
        </div>
    </div>

    <!-- 3. Khay Vật Phẩm Chạm Khổng Lồ (96x96px+ Touch Targets) -->
    <div class="bg-amber-50/90 border-4 border-amber-200 rounded-3xl p-5">
        <p class="text-center text-xs font-extrabold uppercase tracking-wider text-amber-800 mb-4">
            👇 Chạm vào quả trong giỏ mây để đút cho bạn Thỏ:
        </p>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-5">
            <button class="meadow-clay-card p-4 flex flex-col items-center justify-center gap-2 hover:scale-105 active:scale-95 cursor-pointer min-h-[120px]">
                <svg class="w-16 h-16"><use href="#svg-item-strawberry"></use></svg>
                <span class="font-display font-extrabold text-slate-800 text-lg">Strawberry</span>
            </button>
            <button class="meadow-clay-card p-4 flex flex-col items-center justify-center gap-2 hover:scale-105 active:scale-95 cursor-pointer min-h-[120px]">
                <svg class="w-16 h-16"><use href="#svg-item-carrot"></use></svg>
                <span class="font-display font-extrabold text-slate-800 text-lg">Carrot</span>
            </button>
            <button class="meadow-clay-card p-4 flex flex-col items-center justify-center gap-2 hover:scale-105 active:scale-95 cursor-pointer min-h-[120px]">
                <svg class="w-16 h-16"><use href="#svg-item-apple"></use></svg>
                <span class="font-display font-extrabold text-slate-800 text-lg">Apple</span>
            </button>
            <button class="meadow-clay-card p-4 flex flex-col items-center justify-center gap-2 hover:scale-105 active:scale-95 cursor-pointer min-h-[120px]">
                <svg class="w-16 h-16"><use href="#svg-item-banana"></use></svg>
                <span class="font-display font-extrabold text-slate-800 text-lg">Banana</span>
            </button>
        </div>
    </div>
</div>
```

---

## 8. QUY TRÌNH KIỂM ĐỊNH CHẤT LƯỢNG CHO AI AGENT (PRE-FLIGHT QA CHECKLIST)

Trước khi hoàn tất bất kỳ bản cập nhật nào cho dự án **Sunny Meadow English**, AI Agent phải tự kiểm tra và đánh dấu hoàn thành 8 tiêu chí sau:

- [ ] **1. Kiểm tra danh sách Game:** Đã loại bỏ các game ghép chữ/trắc nghiệm cũ và thay bằng **5 Game Thế Hệ Mới** (Hungry Picnic, Color Splash Pond, Firefly Lanterns, Magic Voice Windmill, Woodland Hide & Seek) chưa?
- [ ] **2. Kiểm tra Kho SVG Tập trung:** Mọi hình ảnh đã được lấy từ `<svg id="sunny-meadow-svg-vault">` qua `<use href="#...">` chưa? Có link ảnh ngoài nào bị gãy không?
- [ ] **3. Kiểm tra Kích thước vùng chạm:** Tất cả nút bấm và vật phẩm cho bé chạm đã đạt tối thiểu `68px × 68px` (hoặc `96px × 96px` cho vật phẩm game) chưa?
- [ ] **4. Kiểm tra Tâm lý Không Trừng Phạt:** Đã loại bỏ mọi màu đỏ báo lỗi và âm thanh chói tai khi bé chọn nhầm chưa?
- [ ] **5. Kiểm tra Âm thanh & Giọng đọc:** Mọi từ vựng và nhân vật đã gắn hàm `MeadowAudioEngine.speak()` với tốc độ chậm `0.85` chưa?
- [ ] **6. Kiểm tra Bảo vệ thị giác:** Chế độ **Warm Eye-Care Filter** và **Đồng hồ 20 phút nghỉ mắt** còn hoạt động mượt mà không?
- [ ] **7. Kiểm tra Cổng Phụ Huynh:** Phần cài đặt và thống kê đã được khóa sau bài toán cộng/nhân (`ParentalMathGate`) chưa?
- [ ] **8. Kiểm tra Độ tương phản & Màu nền:** Nền chính có đang dùng màu kem ấm (`#FFFDF5`) và xanh trời dịu (`#D8F3FF`) thay cho màu trắng chói mắt không?