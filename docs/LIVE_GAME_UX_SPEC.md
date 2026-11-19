# VocabFlow AI — Live Game Arena UX & Technical Specification

> **Tài liệu đặc tả kỹ thuật và thiết kế trải nghiệm người dùng phòng Live Game/Arena (PC & Mobile)**  
> **Phiên bản:** 2.0.0 — Kỹ thuật: Esports Premium & TikTok Live Stream Ready  
> **Áp dụng cho:** `apps/web`, `apps/student`, `packages/shared`, `apps/api`

---

## 1. Tổng quan & Triết lý Thiết kế (Executive Summary)

VocabFlow AI Live Game Arena được thiết kế theo phong cách **Esports Stage Studio cao cấp**:
- **Tập trung phản xạ và nhận diện nội dung**: Chữ to, tương phản cao trên nền dark slate sâu (`#0B0F19` / `#12182B`), không gây chói mắt.
- **Rõ ràng trạng thái thi đấu**: Phân định dứt khoát trạng thái đang nhận đáp án, đã khóa chọn, đếm ngược khẩn cấp và công bố đáp án (REVEAL).
- **Hỗ trợ đa nền tảng tuyệt đối**: Đồng bộ mượt mà trên Desktop PC (màn hình ngang 16:9 / 21:9) và Mobile/Tablet (dọc 9:16 hoặc 19.5:9).
- **Bảo toàn nguồn dữ liệu Authoritative**: Server là nguồn dữ liệu duy nhất quyết định thời gian, điểm số và thứ hạng. Không tin tưởng client timing.

---

## 2. Bố cục Giao diện Đa Màn hình (Responsive Blueprints)

### 2.1. Desktop Arena (Màn hình ngang 16:9 / 21:9)
- **Container Invariant**: Sử dụng `min-h-screen h-fit max-h-none overflow-visible overflow-x-hidden`. Không dùng `h-screen max-h-screen overflow-hidden` làm cắt cụt nội dung khi màn hình thấp hoặc zoom.
- **Hệ thống Grid 12 cột**:
  - **Cột Trái (Col 1-8 — Game Stage)**:
    - `ArenaStatsBar`: 4 thẻ chỉ số nhanh (Người tham gia, Đã trả lời vòng này, Khán giả comment đúng, Top 1 dẫn đầu).
    - `QuestionCard` / Studio Screen: Từ khóa trung tâm, phiên âm IPA, câu hỏi định hướng, đồng hồ đếm ngược `CountdownRing`, nút phát âm và lưu Sổ Từ.
    - Grid đáp án (`sm:grid-cols-2`): Thẻ `AnswerCard` với hệ màu nhận diện riêng.
    - `AnswerDistributionChart`: Biểu đồ cột tỷ lệ bình chọn theo thời gian thực (tự động reset theo từng câu).
    - `RoundResultModal` & Banner Giải thích: Hiển thị chi tiết khi có dữ liệu giải thích.
    - `QuestionAnalyticsPanel`: Thống kê độ chính xác và phân bố đáp án.
  - **Cột Phải (Col 9-12 — Sidebar Đa năng)**:
    - Tab Switcher: Chuyển đổi giữa **🏆 Xếp Hạng** và **💬 Bình Luận**.
    - Tab Xếp Hạng: `TopAnswersThisRound` (người trả lời nhanh nhất câu này) và `ArenaRankingPanel` (Bảng xếp hạng tổng trận đấu với nút "YOUR RANK" để cuộn nhanh đến vị trí của bạn).
    - Tab Bình Luận: `ArenaCommentPanel` với luồng bình luận trực tiếp, bộ lọc câu trả lời đúng và hộp nhập bình luận/bình chọn nhanh.

### 2.2. Mobile & TikTok Live (Màn hình dọc 9:16 / 19.5:9)
- **Chế độ màn hình thường**:
  - Tab Switcher cố định trên đỉnh: `[CÂU HỎI]`, `[TỶ LỆ %]`, `[TOP CÂU]`, `[BXH TRẬN]`, `[BÌNH LUẬN]`.
  - Floating Action Button: Nút tròn nổi ở góc dưới bên phải cho phép bật nhanh Bottom Sheet Drawer của `ArenaCommentPanel` mà không cần rời khỏi màn hình câu hỏi.
- **Chế độ TikTok Live Broadcast (9:16)**:
  - Khung chuẩn dọc 9:16 (tối đa 420px), hỗ trợ livestream trên TikTok/Facebook Live với badge LIVE nhấp nháy, mã PIN phòng nổi bật, feed bình luận thời gian thực và biểu đồ tỷ lệ compact.

---

## 3. Cỗ máy Trạng thái & Ma trận Màu Đáp án (State Machine)

Hệ màu được chuẩn hóa độc lập với CSS rời rạc, tuân theo bảng ánh xạ trạng thái nghiêm ngặt:

| Thứ tự | Ký tự | Màu mặc định (Open) | Trạng thái ĐÃ CHỌN | Trạng thái REVEAL: ĐÚNG | Trạng thái REVEAL: SAI |
| :---: | :---: | :---: | :---: | :---: | :---: |
| Option 1 | **A** | **Rose / Coral** (`#F43F5E`) | Radiant Gold (`#F59E0B`) | Emerald Green (`#10B981`) | Crimson Red (`#EF4444`) |
| Option 2 | **B** | **Esports Blue** (`#3B82F6`) | Radiant Gold (`#F59E0B`) | Emerald Green (`#10B981`) | Crimson Red (`#EF4444`) |
| Option 3 | **C** | **Warm Amber** (`#F59E0B`) | Radiant Gold (`#F59E0B`) | Emerald Green (`#10B981`) | Crimson Red (`#EF4444`) |
| Option 4 | **D** | **Deep Violet** (`#8B5CF6`) | Radiant Gold (`#F59E0B`) | Emerald Green (`#10B981`) | Crimson Red (`#EF4444`) |
| Option 5+ | **E/F** | **Teal / Cyan** | Radiant Gold (`#F59E0B`) | Emerald Green (`#10B981`) | Crimson Red (`#EF4444`) |

### Quy tắc Chuyển đổi Trạng thái:
1. **Giai đoạn Đang Mở (Open/Countdown)**:
   - Các thẻ hiển thị màu nhận diện riêng biệt.
   - Khi người chơi click chọn: Thẻ đó ngay lập tức chuyển sang màu **Vàng Hoàng Kim (Radiant Gold / Amber)** kèm nhãn badge `★ ĐÃ CHỌN`.
   - Các lựa chọn còn lại mờ đi (`opacity-65` trên dark mode) để làm nổi bật quyết định của người chơi.
   - Khi đã nộp, khóa tương tác gửi lại để đảm bảo tính công bằng (One-attempt Rule).
2. **Giai đoạn Công Bố (4-Second Reveal Window)**:
   - Nếu người chơi chọn **ĐÚNG**: Thẻ chuyển sang màu **Xanh Ngọc Lục Bảo (Emerald Green)**, hiển thị nhãn `✓ ĐÚNG`, phát âm thanh chiến thắng `playCorrectSound(streak)`.
   - Nếu người chơi chọn **SAI**: Thẻ người chơi chọn chuyển sang màu **Đỏ (Crimson Red)** kèm nhãn `✗ BẠN ĐÃ CHỌN`. Đồng thời, đáp án chính xác của hệ thống luôn sáng rực màu **Xanh Ngọc Lục Bảo (Emerald Green)** với nhãn `✓ ĐÁP ÁN ĐÚNG`.
   - Các đáp án sai khác không được chọn sẽ bị làm mờ sâu (`opacity-35`).

---

## 4. Cửa sổ Công bố 4 Giây & Quy tắc Hiển thị Giải thích (Reveal Window)

- **Đồng bộ thời gian thực**: Server gửi event `round_ended` kèm đáp án chính xác, lời giải thích và thống kê lượt chọn.
- **Countdown 4s**: Khung hiển thị công bố đếm ngược 4 giây trước khi tự động chuyển câu hỏi kế tiếp.
- **Bất biến Giải thích (Explanation Invariant)**:
  - Lời giải thích (`explanation`) chỉ được hiển thị khi có nội dung thực tế (chuỗi khác rỗng sau khi `trim()`).
  - **TUYỆT ĐỐI KHÔNG** hiển thị placeholder trống, thẻ rỗng, khoảng hở padding hoặc chữ "Chưa có giải thích" gây lãng phí diện tích hiển thị.

---

## 5. Kiến trúc Chống Spam & Chấm điểm Khán giả Bình luận (Anti-Spam & Scoring)

Áp dụng tại Backend `apps/api/src/modules/games/game-room.manager.ts`:

1. **Phân loại Bình luận**:
   - Khán giả bình luận thông thường (ví dụ: "chào mn", "cố lên", "hello") **KHÔNG** bị khóa cơ hội trả lời câu hỏi của vòng đó.
   - Chỉ khi bình luận chứa cú pháp dự đoán hợp lệ (ký tự `A, B, C, D`, số `1, 2, 3, 4` hoặc từ vựng trùng khớp đáp án) thì hệ thống mới coi là lượt nộp bài.
2. **Nguyên tắc Idempotency (Chấm điểm duy nhất 1 lần/câu)**:
   - Mỗi khán giả/người chơi chỉ được cộng điểm **tối đa 1 lần** cho mỗi câu hỏi thông qua `player.scoredRounds.has(currentRound)`.
   - Các bình luận lặp lại đáp án đúng sau đó bị bỏ qua, không nhân đôi điểm hoặc làm sai lệch BXH.
3. **Thống kê Bình chọn**:
   - Tự động bóc tách lựa chọn `parsedOption` và cộng vào mẫu số của vòng hiện tại.

---

## 6. Biểu đồ Phân bố Đáp án Trực tiếp (AnswerDistributionChart)

- **Cấu trúc Biểu đồ Cột Đứng (Vertical Bar Chart)**:
  - Cột ứng với mỗi lựa chọn (A, B, C, D) có chiều cao tỷ lệ % trực quan.
  - Mẫu số (`denominator`): Tổng số lượt nộp bài hợp lệ của vòng hiện tại. Nếu chưa có bình chọn nào, biểu đồ hiển thị 0% ở trạng thái cân bằng.
  - Tự động làm sáng cột đáp án đúng khi bước vào trạng thái Reveal.
- **Bất biến Reset câu hỏi**:
  - Khi event `round_started` phát ra, toàn bộ dữ liệu votes và phần trăm của câu trước lập tức được reset về 0, không bị lưu cặn sang câu mới.

---

## 7. Khung Bình luận & Cơ chế Cuộn Thông minh (ArenaCommentPanel)

- **Smart Auto-scroll**:
  - Chỉ tự động cuộn xuống đáy khi người dùng đang ở gần đáy (`distanceToBottom < 60px`).
  - Nếu người dùng đang cuộn lên để đọc lại tin nhắn cũ, hệ thống giữ nguyên vị trí cuộn và không giật màn hình.
  - Khi có bình luận mới, hiển thị badge nhắc nhở có thể nhấn để nhảy xuống đáy.
- **Nổi bật câu trả lời đúng**:
  - Bình luận trả lời đúng có viền emerald và badge `+XP`.
  - Bộ lọc `✓ ĐÚNG` / `TẤT CẢ` cho phép lọc nhanh khán giả trả lời chính xác.

---

## 8. Hệ thống Âm thanh Phản xạ (Web Audio Engine)

Tích hợp tại `packages/shared/src/utils/feedbackSound.ts`:
- **Không phụ thuộc file ngoài**: 100% tổng hợp bằng Web Audio API với zero latency và kích thước tải 0 byte.
- **Mở khóa Audio Mobile**: Tự động resume AudioContext ngay lần chạm (`click`, `touchstart`, `keydown`) đầu tiên trên iOS Safari & Android Chrome.
- **Hiệu ứng phong phú (8 Sound Events)**:
  1. `playGameStartSound()`: Khởi đầu trận đấu.
  2. `playQuestionTransitionSound()`: Bắt đầu câu hỏi mới (cyber whoosh sweep).
  3. `playCountdownTickSound()`: Nhịp đếm giây khi đồng hồ còn dưới 6 giây.
  4. `playWarningTickSound(secondsRemaining)`: Cảnh báo khẩn cấp những giây cuối (3-2-1) với cao độ tăng dần.
  5. `playRoundEndSound()`: Khóa đáp án và chốt vòng thi đấu.
  6. `playCorrectSound(streak)`: Hợp âm ngũ cung thăng hoa theo chuỗi combo streak & cộng điểm.
  7. `playWrongSound()`: Âm trầm phản hồi sai nhẹ nhàng, không gây ức chế.
  8. `playVictoryFanfare()`: Đoạn kèn khải hoàn tôn vinh Top 3 và Quán Quân kết thúc trận đấu.
- **Điều khiển tiện lợi**: Nút tắt/bật BGM và thanh trượt âm lượng (Volume Slider 0% - 100%) ngay trên thanh điều hướng phòng.

---

## 9. Màn hình Kết thúc Trận & Lễ Vinh Quang (WinnerCelebration & Podium)

- **Trophy Artwork Nguyên Bản**: Vector SVG cúp vàng 3D với hào quang phát sáng và vòng nguyệt quế, không dùng ảnh stock hay watermark.
- **Bục vinh quang Olympic 2-1-3**:
  - Hạng 1 (Gold) ở giữa cao nhất kèm vương miện hoàng gia.
  - Hạng 2 (Silver) bên trái, Hạng 3 (Bronze) bên phải.
  - Tự động co giãn theo số lượng người chơi (hỗ trợ trận đấu chỉ có 1 hoặc 2 người mà không vỡ layout).
- **Bảng xếp hạng Toàn diện (#1 đến #N)**:
  - Bảng tổng sắp toàn bộ đấu thủ và khán giả tham gia, hiển thị thứ hạng, avatar, điểm XP, chuỗi streak kỷ lục và tỷ lệ trả lời đúng.
  - Thống kê cá nhân của người chơi và danh sách từ vựng trong trận để lưu vào Sổ Từ học lại.

---

## 10. Chuẩn hóa Mã Quốc gia & Cờ Ngôn ngữ (Country Flag Rule)

- Bất biến quy định trong `AGENTS.md`: **Cấm hiển thị mã quốc gia dạng chữ thô (như `(US)`, `(UK)`, `(AU)`) trên giao diện người dùng**.
- Mọi ngôn ngữ và giọng đọc phải được hiển thị bằng tên chuẩn kèm biểu tượng cờ quốc gia `CountryFlag` hoặc emoji cờ tương ứng.
