# VocabFlow Arena — Live Game Arena, Bảng Vàng, Tích Điểm & Auto-Rotation Implementation

> **Quy chuẩn điều phối trung tâm cho VOCABFLOW LIVE GAME ARENA (TikTok Live 9:16 + Web & Student)**  
> **Repository**: `VocabFlow AI` (Monorepo TOEIC & Spaced Repetition Platform)  
> **Cập nhật ngày**: 20/11/2026

---

## 📌 Master Checklist & Execution Tracker

| Phase | Hạng mục | Trạng Thái | File liên quan | Ghi chú & Tiêu chí nghiệm thu |
| :---: | :--- | :---: | :--- | :--- |
| **0** | **Audit kiến trúc, state machine & data flow** | [x] | `game-room.manager.ts`, `games.gateway.ts`, `RealtimeGameRoomPage.tsx` | Hoàn thành audit Socket.IO, LiveIntegration, Scoring và Leaderboards |
| **1** | **Backend Scoring TikTok 30/20/15/0 & Two Leaderboards** | [x] | `game-room.manager.ts`, `games.gateway.ts`, `games.service.ts` | Chấm điểm tốc độ TikTok (1st: 30đ, 2nd: 20đ, 3rd: 15đ, 4th+: 0đ) per round; Idempotent per question; Tách bạch In-App Top 3 vs TikTok Top 3 |
| **2** | **Live Stage 9:16 Canvas & Bỏ CTA Comment** | [x] | `RealtimeGameRoomPage.tsx` (web & student), `ArenaInGameHeader.tsx` | Bỏ CTA "nhấn để trả lời bằng comment"; Thay bằng 2 BXH compact realtime; Responsive 9:16 dọc không cuộn |
| **3** | **Inline Reveal & Match Celebration Bảng Vàng (20s)** | [x] | `ArenaBangVangCeremony.tsx`, `RealtimeGameRoomPage.tsx` | Bỏ popup modal đáp án; Giải thích inline dưới options; Chữ "BẢNG VÀNG VOCABFLOW" màu vàng kim trang trọng; 20s countdown, pháo hoa canvas & âm thanh chiến thắng |
| **4** | **Auto-continuous Rotation sang Public Game kế tiếp** | [x] | `games.gateway.ts`, `games.service.ts`, `RealtimeGameRoomPage.tsx` | Tự động chuyển room public sau 20s celebration không reload trang; Server chọn phòng kế tiếp, fallback preset luân phiên; Branded waiting state khi chờ |
| **5** | **User Overview & Platform Leaderboards (Streak & Points)** | [x] | `LeaderboardPage.tsx`, `games.service.ts`, `games.controller.ts` | Banner User Overview (Rank, Lifetime Points, Season Points, Daily Streak, Matches, Badges, Lịch sử 10 trận); Tab "Top Comment TikTok"; CountryFlag chuẩn (không hiển thị mã text VN/US/CN) |
| **6** | **Tối ưu Sửa Topbar Artwork, QA & Automated Verification** | [x] | `topbar-arena-banner.svg`, `apps/web/src/test/arenaPanels.test.tsx` | Tạo asset SVG topbar chất lượng cao; 17/17 arena tests PASS; NestJS API build PASS (0 errors); Web & Student build PASS (0 errors) |

---

## 1. State Machine Trận Đấu (Match Lifecycle State Machine)

1. `LOBBY / WAITING`: Phòng chờ public/private, đếm số người tham gia.
2. `QUESTION_ACTIVE`: Server phát câu hỏi, timer chạy (15s mặc định), player trong app trả lời, TikTok comments được thu nhận.
3. `ANSWER_LOCKED`: Hết giờ, server khóa nhận câu trả lời cho câu hiện tại.
4. `ANSWER_REVEAL`: Hiển thị đáp án đúng (Xanh), đáp án sai (Đỏ), đáp án đang chọn chờ reveal (Vàng) và giải thích inline trong 4s. Không bật modal đáp án.
5. `NEXT_QUESTION`: Chuyển câu, reset bảng thưởng câu hỏi, giữ điểm tích lũy của trận.
6. `MATCH_FINALIZING`: Chốt kết quả trận, deduplicate event, ghi snapshot `GameResult` và cập nhật XP/Streak.
7. `MATCH_CELEBRATION`: Hiển thị Bảng Vàng tổng kết 20 giây:
   - "BẢNG VÀNG VOCABFLOW" màu vàng kim trang trọng (độ tương phản cao trên nền dark theme).
   - Podium Top 3 In-App Players & Top 3 TikTok Commenters riêng biệt.
   - Vương miện vàng cho Quán quân (#1), huy hiệu Bạc (#2) và Đồng (#3).
   - Hiệu ứng pháo hoa canvas + âm thanh chiến thắng (chơi 1 lần, tôn trọng trạng thái mute).
8. `AUTO_NEXT_RESOLVING`: Server tự động chọn game public kế tiếp hợp lệ.
9. `NEXT_MATCH_LOADING`: Tải metadata game mới, reset state trận đấu, giữ nguyên lifetime points & streak.
10. Quay lại `QUESTION_ACTIVE` hoặc `WAITING` nếu chưa có game sẵn sàng.

---

## 2. Kết Quả Kiểm Thử Tự Động (Verification Results)

- **Unit Tests Frontend (Vitest)**:
  - `npx vitest run apps/web/src/test/arenaPanels.test.tsx apps/web/src/test/upgradeFeatures.test.ts`: **31/31 passed (100%)**
  - Bao gồm: Question analytics, speed tiers, Ranking panel, Dynamic backgrounds, AnswerCard states, Celebration overlay, AnswerDistribution, Comment panel, Podium, Bảng Vàng real data ceremony, Explanation card inline.
- **Backend Build (NestJS)**:
  - `npm --workspace=apps/api run build`: **Exit code 0 (Hoàn thành không lỗi)**
- **Frontend Web App Build (Vite 5)**:
  - `npm --workspace=apps/web run build`: **Exit code 0 (1955 modules transformed, built in 14.2s)**
- **Frontend Student App Build (Vite 5)**:
  - `npm --workspace=apps/student run build`: **Exit code 0 (2175 modules transformed, built in 13.4s)**
