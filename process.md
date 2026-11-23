# VOCALFLOW ARENA – AUDIT & IMPLEMENTATION BLUEPRINT (process.md)

**Project**: VocabFlow AI (`vocalflow.site`)  
**Feature**: Đấu trường Phản xạ (VocabFlow Astral Arena) – Complete Visual Overhaul & Premium Esports Game Experience  
**Version**: 2.1.0  
**Audit Date**: 23/11/2026  

---

## 🚀 VOCALFLOW ASTRAL ARENA — COMPLETE VISUAL OVERHAUL (23/11/2026)

Thực hiện cuộc đại tu toàn diện toàn bộ giao diện phần Đấu trường phản xạ (VocalFlow Astral Arena & VocalFlow Live Arena) theo tiêu chuẩn chỉ đạo nghệ thuật **Premium Futuristic Esports + Sci-Fi Knowledge Arena**:

### 1. Hệ thống Màu sắc & Design Tokens chuẩn hóa (`astral-arena.css`)
- **Visual Palette**: `#070B18` (Deepest ground), `#0B1228` (Stage), `#101A35` (Panel), `#172345` (Raised surface), `#2041F6` (Brand primary), `#4778FF` (Electric blue), `#8B68E8` (Violet), `#B69AFF` (Light violet), `#43D9ED` (Cyan active), `#F4C76A` (Champion gold), `#34D399` (Success green), `#FB7185` (Error red), `#F4F6FF` (Main text), `#A5B1CD` (Secondary text).
- **Tabular Numerals**: Áp dụng `font-variant-numeric: tabular-nums` cho toàn bộ đồng hồ đếm ngược, điểm số, thứ hạng và tỷ lệ phần trăm phân bố đáp án để loại bỏ rung lắc layout khi số thay đổi.

### 2. Môi trường Vũ trụ Sân đấu 8 Lớp Chuyên sâu (`ArenaEnvironment`)
- **Layer 1: Base artwork** — Nạp từ asset WebP cục bộ độc quyền (`arena-main-background.webp`, `arena-live-background.webp`, `arena-boss-background.webp`, `arena-champion-background.webp`, `arena-round-transition.webp`), độ phân giải 1600×900 / 788×1400.
- **Layer 2: Deep navy tint** (`#070f2240`) giữ độ tương phản cao cho chữ.
- **Layer 3: Atmospheric gradient overlay** (`astral-haze`) tạo chiều sâu vô tận.
- **Layer 4: Distant light particles** (`astral-particles`) các hạt bụi năng lượng trôi lững lờ.
- **Layer 5: Central arena illumination** (`astral-core-light`) nguồn sáng hội tụ phía sau trung tâm câu hỏi.
- **Layer 6: Peripheral vignette** (`astral-vignette`) góc tối điện ảnh.
- **Layer 7: Foreground energy rail & scene transition**.
- **Layer 8: Gameplay HUD frames**.
- Hiệu ứng parallax con trỏ chuột mượt mà và tự động tắt khi người dùng bật `prefers-reduced-motion`.

### 3. Kiến trúc Khung Game HUD Độc quyền (`AstralFrames.tsx`)
- Thay thế hoàn toàn các khối bo góc dashboard thông thường bằng **vết cắt vát góc hình học sci-fi 45 độ** (`polygon(0 var(--cut), var(--cut) 0, 100% 0, 100% calc(100% - var(--cut)), calc(100% - var(--cut)) 100%, 0 100%)`).
- Hệ khung viền kép: Viền ngoài ánh kim (`--edge`), bề mặt lõm sâu cách âm (`--frame-fill`).
- **DecorativeCorner**: 4 ngàm bracket HUD chuẩn xác tại 4 góc (`.tl`, `.tr`, `.bl`, `.br`) với rãnh notch phát sáng theo tông tín hiệu (`--signal`).
- **EnergyDivider**: Vạch laser ngăn cách mảnh mai với lõi kim cương phát quang trung tâm (`.astral-divider-core`).
- Nhãn chỉ số kỹ thuật: `// VOCALFLOW CORE · STAGE`, `LIVE`, `TỐC ĐỘ`.

### 4. Thẻ Đáp án — Điều khiển Game Chuyên nghiệp (`AnswerFrame`)
- Khung phím lựa chọn góc vát sắc nét với huy hiệu chữ cái (A, B, C, D) đặt trong khối ngũ giác công nghệ.
- Trạng thái Hover: Nâng nhẹ bề mặt (`translateY(-2px)`), viền điện quang bừng sáng, cựa notch mở rộng.
- Trạng thái Selected: Viền xanh electric rực rỡ, bề mặt phủ ánh xanh thẫm.
- Trạng thái Correct: Viền xanh ngọc emerald (`#34D399`), quét sáng toàn dải (`astral-correct-sweep`), biểu tượng Check xác nhận.
- Trạng thái Wrong: Viền đỏ san hô (`#FB7185`), biểu tượng X, giữ phong thái điềm tĩnh, không giật lắc hạ nhục.

### 5. Phân tách Triệt để: Đấu trường Phổ thông (Battle) vs TikTok Live
- **Battle Mode (`ArenaBattleView.tsx`)**:
  - Bố cục 3 cột chuẩn Esports PC: Header 64px, Cột trái (Chỉ số cá nhân / Điểm số / Thứ hạng / Gap Tracker ~220px), Sân khấu trung tâm (Câu hỏi + 2x2 Answer Cards 1fr), Cột phải (Arena Top 5 ~300px), Footer phím tắt 40px.
  - Tuyệt đối không hiển thị luồng bình luận TikTok, top 3 live hay presenter tools trong Battle mode.
  - Hỗ trợ đầy đủ phím tắt: A/B/C/D, 1/2/3/4, Space (bỏ qua), Enter (gửi bài điền từ).
- **TikTok Live Mode (`TikTokLiveView.tsx`)**:
  - Định danh thương hiệu: `VOCALFLOW LIVE ARENA`.
  - Trên PC: Hiển thị đồng thời toàn bộ 5 khu vực (Sân khấu câu hỏi, Luồng bình luận đã xác thực, Biểu đồ phân bố tỷ lệ, Bục Top 3 phản xạ siêu tốc, Bảng xếp hạng Live tổng).
  - Trên Mobile: Tự động chuyển đổi mượt mà theo 4 pha thời gian (0-10s: bình luận; 10-20s: gom bình luận; 20-25s: khóa câu hỏi & biểu đồ tỷ lệ dâng từ 0%; 25-30s: bục vinh danh Top 3 phản xạ).

### 6. Biểu đồ Phân bố Đáp án & Bục Vinh danh Bảng Vàng
- **AnswerDistributionChart**: Thanh năng lượng trực quan chuyển động mượt mà, hiển thị số người hợp lệ duy nhất và tỷ lệ phần trăm chính xác kèm dấu tick xanh cho đáp án đúng.
- **Bục Bảng Vàng (`LiveFinalResults`)**: Thiết kế bục podium 3 bậc trang trọng (Hạng 1 ở giữa cao 180px mạ vàng rực rỡ, Hạng 2 bên trái 140px bạc, Hạng 3 bên phải 110px đồng), dải thông số cá nhân (Đúng X/Y, Chuỗi tốt nhất), nút tạo phòng nổi bật.

### 7. Kiểm chứng Trực quan & Kiểm thử Thực tế
- **Kiểm thử tự động**: 55/55 tests trong bộ `arena*` chạy qua 100% bằng Vitest.
- **Biên dịch Production**: Vite build `@vocabflow/web` hoàn tất thành công trong 15s mà không có lỗi.
- **Visual QA Trình duyệt Thực tế**: Sử dụng Microsoft Edge headless qua giao thức CDP chụp thành công 18 ảnh màn hình kiểm thử tại các độ phân giải:
  - Desktop: 1920×1080, 1440×900, 1366×768, 1280×720
  - Tablet: 1024×768, 768×1024
  - Mobile: 430×932, 390×844, 360×740, 320×640
  - Lưu trữ ảnh tại: `.taste-skill/screenshots/`

---

## VocalFlow Astral Arena

Hướng **Data terminal**, seed `1862731642`, dùng trục điểm căn hàng và dấu chọn nhất quán. Brief Astral quyết định tông cobalt, cyan và vàng cùng khung cắt góc. Mỗi câu hỏi là một nhiệm vụ được chiếu trên lõi tri thức của sân đấu. Các lớp ánh sáng và khung cấu trúc theo brief được giữ trong giới hạn đọc và hiệu năng. [NexusVerse](https://dribbble.com/shots/27699331-NexusVerse-Next-Gen-Gaming-Platform-Esports-Web-UI-UX) · [MiAO World](https://loonatiks.gr/project/miao-world/?number=11) · [M7 Arena](https://dribbble.com/shots/27234445-Daily-UI-019-M7-Arena-eSports-Leaderboard)

- Năm ảnh WebP tạo riêng cho Arena nằm trong thư mục public của Web và Student. Cảnh Battle, Live dọc, Boss, Champion và chuyển vòng tải từ asset cục bộ. Tách ảnh nền, tint, haze, hạt, vùng sáng, vignette và lớp chuyển cảnh. CPU chỉ cập nhật parallax theo khung hình trên thiết bị có con trỏ chính xác. Cài đặt giảm chuyển động giữ nguyên hình nền tĩnh.
- `AstralFrames.tsx` cung cấp biến thể khung HUD và vai trò hình học. `astral-arena.css` giữ palette, góc cắt, nét khung, chuyển động và cách dàn trang. Battle tách điểm cá nhân, câu hỏi và Top 5. Desktop Live hiển thị đồng thời câu hỏi, bình luận hợp lệ, phần trăm, Top 3 và điểm tích lũy. Mobile chạy theo pha hiện có.
- Cả hai bảng vàng lấy dữ liệu xếp hạng của chính chế độ đó. Bảng điểm có avatar và dấu tăng giảm hạng. Live cho mở danh sách người trả lời gần đây theo nhóm từ sau khi khóa. Tỷ lệ vẫn dùng tổng phiếu hợp lệ do máy chủ cấp.
- Kiểm tra bản build Web và Student qua Chromium ở đủ 10 kích thước. Chụp Battle đang chơi, đáp án đúng, Top 5 và bảng vàng Battle. Chụp Live desktop, bình luận mobile, biểu đồ, Top 3, chi tiết đáp án điền từ và bảng vàng Live. Hai backend qua typecheck, 183 test Web và 2 test gateway qua. Typecheck toàn frontend có lỗi hiện hữu ngoài các tệp Arena.
- TasteSkill qua ở 1440, 768 và 390px, với ngoại lệ lớp khí quyển và nét kết cấu được brief yêu cầu. Còn một cảnh báo về chữ phụ ở mỗi chế độ. Test trình duyệt dùng Socket.IO cục bộ do nguồn bình luận TikTok thật chưa được nối.

### Đối chiếu ảnh và chỉnh sửa

ROUND 2

- Seen in one second: Battle đứng giữa sân hình vòng, Live nghiêng cyan với cụm dữ liệu khán giả, bảng vàng có bục cao thấp.
- Idea: Câu hỏi trở thành nội dung chiếu trước lõi tri thức, trong cùng không gian với phần thi và lễ vinh danh.
- Live thing: Phiếu hợp lệ chuyển thành biểu đồ và sau đó thành podium khi đồng hồ phòng đi hết từng pha.
- Layout: sân đấu mở rộng / bảng điểm lệch hai bên / Live dùng cụm 2×2 / bảng vàng có bục giữa cao hơn.
- Scores: design 8 · usability 8 · creativity 8 · content 8 → 8.0. Caps applied: none.
- Vòng đầu có giao nhau giữa hiệu ứng hiện câu hỏi và hàng đáp án tại 390×844. Chuyển câu hỏi sang fade để giữ nguyên biên. Khung câu hỏi Battle ở 1440px từng chia ba dòng cho câu mẫu. Mở vùng chữ và chỉnh tỷ lệ font. Ba vị trí podium từng gần như ngang nhau. Tách chiều cao và mở nhiều diện tích ảnh sân ở màn kết quả.
- Hạn chế còn lại: người chơi cuối danh sách cần cuộn trong panel ở viewport 320px. Chú thích trạng thái và thời gian vẫn nhỏ hơn chữ câu hỏi để các nút đáp án vừa màn hình.

[Ảnh trước và sau](/tmp/astral-verified/before-after.jpg) · [Các trạng thái kiểm tra](/tmp/astral-verified/overview-review.jpg)

## Cập nhật triển khai — 23/11/2026

Phần bên dưới ghi lại thiết kế và kiểm toán trước đợt chỉnh sửa này. Hành vi hiện tại theo phần cập nhật này.

- **Route thi đấu** — Web và Student dùng `/games/room/:roomId` cho mọi kích thước. Các nút đổi tỷ lệ, sao chép link, QR và hướng dẫn phát sóng đã được gỡ khỏi giao diện phòng. Màn đang đấu dùng header riêng, khoảng cách co theo chiều cao và vùng cuộn trong panel khi cần.
- **Battle** — Câu hỏi và đáp án ưu tiên không gian. Các trạng thái đã chọn, đúng và sai dùng chung bộ điều khiển 44px trở lên. A–D, 1–4, Space và Enter đi qua một luồng gửi đáp án. Máy chủ xác thực và tính `max(0, 100 − floor(elapsedSeconds))` cho đáp án đúng. Khi mọi người chơi hợp lệ đã trả lời hoặc hết giờ, phòng tự tiến sang phần kết quả rồi sang câu tiếp theo.
- **Live** — Dùng mốc khóa ở giây 20 theo các pha chi tiết trong mục E của yêu cầu. Mobile ưu tiên bình luận ở 0–10s, thu gọn hoạt động ở 10–20s, hiển thị biểu đồ 0% đến tỷ lệ thực ở 20–25s và bật Top 3 ở 25–30s. Desktop có đồng thời câu hỏi, bình luận, biểu đồ, Top 3 và xếp hạng cộng dồn. Tablet dùng hai cột.
- **Dữ liệu Live** — Máy chủ nhận một đáp án hợp lệ đầu tiên cho mỗi người và mỗi câu. Server gom nhóm lựa chọn A–D hoặc chuỗi điền từ chuẩn hóa Unicode, bỏ qua bình luận không khớp định dạng. Điểm Live giữ quy tắc đang dùng trên máy chủ là 30, 20 và 15 cho ba người trả lời đúng đầu tiên. Biểu đồ và podium lấy cùng dữ liệu đã xác thực.
- **Kết quả trận** — Live có podium cộng dồn riêng. Battle giữ phần vinh danh hiện có. Các điểm và phiếu theo câu ở bộ nhớ của phòng. Máy chủ phát kết quả một lần khi kết thúc. Hàng đợi lưu kết quả cho tài khoản VocalFlow có khóa ngoại hợp lệ. Bảng khán giả Live vẫn là dữ liệu trong bộ nhớ của phòng.
- **Kết nối nguồn** — Adapter TikTok trong repo chỉ có đầu nhận sự kiện. Đăng ký kênh hiển thị trạng thái chờ đến khi nguồn gửi sự kiện thật. Kiểm thử trình duyệt sử dụng Socket.IO cục bộ với các đáp án kiểm thử có chủ đích. Luồng TikTok bên ngoài chưa được xác thực.

### Thiết kế và kiểm chứng

- Hướng thiết kế **True-black flat**, seed `934076273`. Giữ phân cấp bằng cao độ màu và dùng navy, cobalt, tím theo nhận diện VocalFlow. Dùng lại logo và ảnh sân đấu hiện có của dự án. Các trường hợp màn nhỏ ưu tiên chữ câu hỏi và bốn đáp án trước danh sách.
- Đối chiếu bản build trước và sau tại 1280×720, 1366×768, 1440×900, 1920×1080, 768×1024, 1024×768, 320×640, 360×740, 390×844 và 430×932. Bản trước mất đáp án cuối ở Battle 320×640 và đẩy panel Live xuống dưới câu hỏi ở 390×844.
- Kiểm thử máy chủ bao phủ điểm Battle theo đồng hồ, bỏ qua, bình luận trùng sau đáp án sai, khóa ở 20s, phát lại sự kiện cũ, Top 3 và nhóm câu trả lời điền từ.
- Chromium chạy trên bản build Web và Student qua cả 10 viewport. Kiểm tra biên trang, kích thước nút, vị trí câu hỏi và đáp án, phím tắt, số lần gửi, chuyển pha Live, biểu đồ từ 0% và podium Live cuối trận.
- `npm --workspace apps/web test` qua 183 kiểm thử. Test đồng hồ gateway riêng chạy bằng `node_modules/.bin/vitest run --root apps/api test/arenaGateway.test.ts`, xác nhận mốc khóa 20s, chuyển vòng ở 30s và chỉ chốt trận một lần.
- Build Web và Student, typecheck hai backend và lint giao diện Arena đều qua. Typecheck toàn frontend còn lỗi ngoài Arena, gồm kiểu dữ liệu handwriting, MyWordBank và ReviewSession.
- TasteSkill đo bản build tại 1440, 768 và 390px. Battle và Live đạt 0 lỗi. Các cảnh báo còn lại liên quan đến chữ phụ, khoảng cách mép, độ cao khác nhau giữa panel và bảng màu thương hiệu. Bình luận giữ vùng cố định để thêm dòng mà không làm xê dịch câu hỏi.
- Ảnh đối chiếu và ảnh các pha Live được lưu tại `/tmp/vocalflow-final-web`. Ảnh Student ở `/tmp/vocalflow-final-student`.


### Tinh chỉnh giao diện sân đấu

- Lấy bản sân đấu trong commit `6a76266` lúc 20:55 ngày 19/11 làm mốc hình ảnh gần nhất tìm được. Dùng hướng **Data terminal**, seed `120686883`, để giữ ba nhóm thông tin rõ ràng gồm câu hỏi, diễn biến vòng và xếp hạng. Tham chiếu cách đặt đồng hồ và điểm số trong [VCT Broadcast HUD](https://valorantesports.com/en-GB/news/vct-2025-season-wrap-up).
- Hai ảnh WebP mới `signal-stadium` và `signal-alloy` được tạo riêng cho sân đấu, sảnh chờ và các khung dữ liệu. Chữ, đường viền đáp án và tỷ lệ bình chọn được hiển thị bằng component để giữ khả năng đọc và co giãn. Dùng `PlayerAvatar` của hệ thống cùng dấu hạng vàng, bạc, đồng.
- Sảnh có ba phòng dựng sẵn theo ngôn ngữ gồm Phản xạ từ vựng, Nghe và chọn, Dịch nhanh. Danh sách ưu tiên phòng Live, thứ tự preset dùng cho vòng quay cũ được giữ. Nút tạo phòng mở thẳng biểu mẫu tương ứng.
- Điều hướng, điểm số, luật nhận đáp án và thời gian trong trận tiếp tục dùng logic hiện tại.
- Hai bản build qua Chromium ở 10 kích thước, biểu mẫu tạo phòng Live qua kiểm tra tại sảnh với dữ liệu thử, 183 test Web và 2 test gateway qua. TasteSkill ghi 0 lỗi ở cả hai màn, còn cảnh báo chữ phụ và độ cao panel. [Ảnh kiểm tra](/tmp/arena-refresh-web/review.jpg).

## 1. TỔNG QUAN HIỆN TRẠNG (EXISTING IMPLEMENTATION AUDIT)

### 1.1 Routes & Navigation
- **Frontend App**: Cả `apps/student` và `apps/web` đều sở hữu hai route chính:
  - `/games`: `GameLobbyPage.tsx` – Sảnh chờ danh sách phòng đấu, các chế độ game, tạo phòng đấu.
  - `/games/room/:roomId`: `RealtimeGameRoomPage.tsx` – Màn hình đấu trường thời gian thực.
  - Admin & Kids routes: `/admin/games` (`AdminGamesPage.tsx`), `/kids/games` (`KidsGamesPage.tsx`).
- **Phân tách hiện tại**:
  - `RealtimeGameRoomPage.tsx` là một monolithic component (3,772 dòng code) đang cố gắng gộp cả hai chế độ (Study/PVP và TikTok Live) vào cùng một file, dẫn đến việc render conditional phức tạp, dễ vỡ giao diện và khó duy trì.

### 1.2 Component Breakdown & Tái sử dụng
- **Các thành phần hiện có trong `pages/games/arena/`**:
  - `ArenaBangVangCeremony.tsx` (37KB): Lễ vinh danh Bảng Vàng Podium (Top 1, 2, 3 + Bảng xếp hạng 4-10). Đang bị nhầm lẫn hiển thị trong lúc đang thi đấu (lines 2231, 3150 trong `RealtimeGameRoomPage.tsx`).
  - `ArenaInGameHeader.tsx`: Thanh header trận đấu (tên phòng, tiến độ câu hỏi, timer, âm thanh).
  - `ArenaPillOptionButton.tsx`: Nút đáp án phong cách esports với hotkey pill (A, B, C, D).
  - `ArenaDynamicBackground.tsx`: Background cyberpunk neon procedural.
  - `ArenaExplanationCard.tsx`: Card giải thích đáp án sau khi hết vòng.
  - `ArenaCommentPanel.tsx`: Khung hiển thị bình luận TikTok Live streaming.
  - `ArenaRankingPanel.tsx`: Panel BXH người chơi và khán giả.
  - `AnswerDistributionChart.tsx`: Biểu đồ cột phân bố tỉ lệ bình chọn đáp án A, B, C, D.
  - `QuestionAnalyticsPanel.tsx`: Phân tích thống kê câu hỏi.
  - `TopAnswersThisRound.tsx`: Hiển thị top người trả lời nhanh nhất vòng.
  - `CreateCustomRoomModal.tsx`: Modal tạo phòng đấu tự chọn.

### 1.3 Game State Management
- WebSocket Socket.IO kết nối tới NestJS backend Gateway (`apps/api/src/modules/games/games.gateway.ts`).
- Event Socket.IO: `submit_answer`, `answer_result`, `live_ranking_update`, `round_started`, `round_ended`, `game_finished`.
- Điểm yếu hiện tại:
  - Chưa phân tách triệt để state của Normal Battle (tính điểm giảm dần 1 điểm/giây) và TikTok Live (tính điểm theo tier tốc độ 0-5s, 5-10s, 10-15s, 15-20s + Fast Token).
  - Bảng Vàng (Champion Podium) vô tình bị render trong lúc trận đấu đang diễn ra ở một số viewport.

### 1.4 Scoring Logic
- **Yêu cầu Normal Battle**:
  - Base Score = 100.
  - Công thức: `Score = max(0, 100 - floor(elapsedSeconds))`. Cứ mỗi giây trôi qua giảm đúng 1 điểm.
  - Đúng: Nhận số điểm còn lại.
  - Sai / Skip / Timeout: 0 điểm.
  - Mỗi câu chỉ tính điểm 1 lần duy nhất.
- **Yêu cầu TikTok Live**:
  - Thời gian mỗi câu: 20s.
  - Tiers: 0-5s = 100đ, 5-10s = 80đ, 10-15s = 60đ, 15-20s = 40đ.
  - Sai / duplicate / muộn: 0đ.
  - Fast Response Wins: 3 người đầu tiên trả lời đúng và nhanh nhất mỗi câu nhận 1 Fast Token.
  - Kết thúc live session: Fast Champion (+300đ), Fast Runner-up (+200đ), Fast Third (+100đ).
  - Công thức cuối cùng: `Live Score = Question Points + Fast Bonus`.

### 1.5 Leaderboard & Podium Display
- **Bất biến**: Tuyệt đối không hiển thị Bảng Vàng Podium trong lúc thi đấu!
- Chỉ khi toàn bộ phiên đấu kết thúc (`FINISHED`), hiển thị:
  - Normal Battle: Champion, Runner-up, Third Place, Arena Top 10, Thành tích cá nhân.
  - TikTok Live: Fast Champion, Live Third, Live Runner-up, Live Champion, Live Top 10.
  - Hai bảng vàng hoàn toàn riêng biệt, không gộp lẫn điểm.

### 1.6 Database Schema & Persistence (Memory-only Invariant)
- **Database tables hiện có**:
  - `GameQuestion`: Ngân hàng câu hỏi dùng chung (chỉ đọc).
  - `CustomGameRoom`: Lưu cấu hình phòng đấu (`isLiveMode: boolean`).
  - `GameResult`: Lưu kết quả sau khi kết thúc trận đấu.
- **Bất biến tải Server**:
  - Trong lúc diễn ra trận đấu: Tuyệt đối không ghi database trên mỗi câu trả lời hay mỗi comment! Mọi tính toán điểm, rank, deduplication đều giữ trong Frontend In-Memory State.
  - Khi hoàn thành phiên đấu: Gửi 1 bản tổng kết duy nhất lên server để persist.
  - Nếu người dùng rời phòng giữa chừng: Hiển thị cảnh báo xác nhận, hủy toàn bộ điểm trong memory, không lưu dở dang, không khôi phục.

### 1.7 Lỗi Tag Overflow trong Modal Tạo Phòng
- **Nguyên nhân**: Trong `CreateCustomRoomModal.tsx` và `CustomSelect.tsx`:
  - `CustomSelect` render badge (`SelectOption.badge`) dạng `shrink-0` nằm cạnh nhãn text trong button trigger.
  - Khi đặt trong lưới hẹp 2 hoặc 4 cột (`grid grid-cols-2 sm:grid-cols-4`), các option như `DIFFICULTY_OPTIONS` (có nhãn "Cơ bản (A1-A2)" kèm badge "A1-A2") và các bộ đề cộng đồng (badge "Chờ Admin duyệt") bị ép tràn ra ngoài đường viền nút chọn (button container).
  - Thẻ HOT trong nút chọn loại phòng bị co cụm trên mobile.

---

## 2. KIẾN TRÚC THIẾT KẾ MỚI (NEW ARCHITECTURE)

```
┌─────────────────────────────────────────────────────────────┐
│                    MODE SELECTION / LOBBY                   │
│   ┌─────────────────────────────┐ ┌─────────────────────┐   │
│   │     ARENA BATTLE (PVP)      │ │     TIKTOK LIVE     │   │
│   │  • Esports Midnight Navy    │ │  • VocalFlow Arena  │   │
│   │  • Keyboard-First (A-D,1-4) │ │  • Comment Engine   │   │
│   │  • 1s = -1 point decay      │ │  • Speed Tiers      │   │
│   │  • Compact Top 5 In-game    │ │  • Fast Tokens      │   │
│   │  • Arena Gold Board at End  │ │  • Live Gold Board  │   │
│   └──────────────┬──────────────┘ └──────────┬──────────┘   │
└──────────────────┼───────────────────────────┼──────────────┘
                   │                           │
                   ▼                           ▼
        ┌─────────────────────┐     ┌─────────────────────┐
        │  ArenaBattleStage   │     │   TikTokLiveStage   │
        │  (Dedicated Engine  │     │  (Dedicated Engine  │
        │   & Layout)         │     │   & 9:16/16:9 View) │
        └──────────┬──────────┘     └──────────┬──────────┘
                   │                           │
                   ▼                           ▼
        ┌─────────────────────────────────────────────────┐
        │        Shared Primitives & Data Layer           │
        │  • Question Bank (GameQuestion)                 │
        │  • Audio Engine & Pronunciation                 │
        │  • In-Memory State (Zero DB writes in-round)   │
        │  • End-Game Bulk Persistence                    │
        └─────────────────────────────────────────────────┘
```

---

## 3. CÁC THÀNH PHẦN TÁI CẤU TRÚC (REFACTORING BREAKDOWN)

1. **`apps/student/src/components/ui/CustomSelect.tsx` & `apps/web/src/components/ui/CustomSelect.tsx`**:
   - Khắc phục triệt để lỗi tràn tag: Trong button trigger, chỉ hiển thị nhãn `label` được cắt tỉa an toàn bằng `truncate`. Ẩn badge trong button trigger hẹp hoặc giới hạn max-width, chỉ hiển thị badge đầy đủ trong danh sách dropdown popover portal.
2. **`apps/student/src/components/games/CreateCustomRoomModal.tsx` & `apps/web/...`**:
   - Chuẩn hóa options: Bỏ các badge trùng lặp với text label trong `DIFFICULTY_OPTIONS` và `MAX_PLAYERS_OPTIONS`.
   - Đảm bảo thẻ HOT và các header tag có `flex-wrap` và `shrink-0` hợp lý, không bao giờ tràn khung.
3. **Tách biệt 2 Gameplay Layouts**:
   - `ArenaBattleView.tsx`: Màn đấu phản xạ Esports dành cho học viên / thi đấu thường.
     - Header 64px, Question Stage (65-70%), Sidebar (30-35%).
     - Tự động focus ô input khi gặp câu hỏi tự luận, phím Enter nộp bài & auto next câu.
     - Phím A/B/C/D hoặc 1/2/3/4 để chọn đáp án trắc nghiệm & auto next câu.
     - Phím Space để bỏ qua câu (skip) không nhận điểm & auto next câu (không kích hoạt khi đang gõ text input).
     - Bảng hướng dẫn phím tắt có thể mở bất kỳ lúc nào.
     - Scoring: Base 100, trừ 1 điểm mỗi giây. Hiển thị popup `+XX điểm` trực quan.
     - In-game Leaderboard: Rút gọn Top 5, vị trí cá nhân, khoảng cách điểm với người liền kề.
     - Kết thúc trận: Hiện Lễ Trao Giải Bảng Vàng (Arena Champion Podium) trang trọng.
   - `TikTokLiveView.tsx`: Màn đấu tương tác Livestream TikTok.
     - Tăng cường nhận diện thương hiệu `vocalflow.site` & `VOCALFLOW ARENA`.
     - Tuân thủ chính sách: Không nhái logo chính thức của TikTok, không cam kết quan hệ đối tác giả mạo, câu lệnh comment rõ ràng (`Comment A, B, C hoặc D để trả lời`), không spam.
     - Adapter comment: Hỗ trợ cả chế độ TikTok Live thật qua webhook/adapter và MANUAL TEST INPUT sandbox rõ ràng.
     - Scoring: Tiers 0-5s (100đ), 5-10s (80đ), 10-15s (60đ), 15-20s (40đ).
     - Fast Response Wins: 3 người đầu tiên nhận Fast Token mỗi câu. Kết thúc tặng +300đ, +200đ, +100đ.
     - BXH Live Top 3 & Top 10 khán giả riêng biệt.
     - Kết thúc trận: Hiện Lễ Trao Giải Bảng Vàng TikTok Live riêng biệt.
4. **`RealtimeGameRoomPage.tsx`**:
   - Đóng vai trò Router / Orchestrator thông minh, điều hướng sạch sẽ vào `ArenaBattleView` hoặc `TikTokLiveView` dựa trên `isLiveMode` / `roomType`.

---

## 4. KẾ HOẠCH THỰC HIỆN TỪNG BƯỚC (PHASES)

- **Phase 0**: Audit và tạo `process.md` (Hoàn thành).
- **Phase 1**: Sửa lỗi tag overflow trong `CreateCustomRoomModal.tsx` và `CustomSelect.tsx`.
- **Phase 2**: Xây dựng `ArenaBattleView.tsx` với toàn bộ logic phím tắt (A/B/C/D, 1/2/3/4, Space, Enter auto-focus), cơ chế trừ 1đ/giây, và popup cộng điểm.
- **Phase 3**: Xây dựng `TikTokLiveView.tsx` với giao diện 9:16 / 16:9, nhận diện thương hiệu `vocalflow.site`, engine tính điểm theo tốc độ (0-5s, 5-10s, 10-15s, 15-20s), cơ chế Fast Token và BXH Live độc lập.
- **Phase 4**: Đảm bảo Bảng Vàng (ArenaBangVangCeremony) chỉ hiển thị khi `roomStatus === 'FINISHED'`, tách riêng dữ liệu Bảng Vàng Arena vs Bảng Vàng Live.
- **Phase 5**: Đảm bảo cơ chế In-Memory state: Không ghi database từng câu/comment, xác nhận cảnh báo khi thoát phòng, lưu 1 lần duy nhất khi kết thúc phiên.
- **Phase 6**: Đồng bộ code giữa `apps/student` và `apps/web`.
- **Phase 7**: Chạy verification test & build kiểm chứng không lỗi.
