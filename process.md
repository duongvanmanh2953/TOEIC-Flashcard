# VocabFlow Arena — Premium Competitive Quiz Game Implementation Process

> **Quy chuẩn điều phối trung tâm cho VOCABFLOW ARENA**  
> Hệ thống thi đấu từ vựng trực tuyến đỉnh cao, chuẩn Esports + Modern EdTech.

---

## 📌 Phase Overview & Status Tracker

| Phase | Nội Dung Triển Khai | Trạng Thái |
| :--- | :--- | :--- |
| **Phase 0** | **Dọn dẹp Game Tạm & Chuẩn hóa Kho Từ Vựng Hệ Thống** (Xóa WordMatch/WordScramble tạm, kết nối 100% kho từ vựng đa ngữ hệ thống cho mọi language space: ZH, JA, KO, EN, DE, FR, ES, TH, VI) | ✅ Completed |
| **Phase 1** | **Arena Design System & Core Components** (`ArenaHeader`, `QuestionCard`, `AnswerCard`, `CountdownRing`, `MatchProgress`, `PlayerAvatar`, `RankBadge`, `StreakIndicator`, `MultiplierBadge`, Palette chuẩn #090D1B, #12182B, #2041F6) | ✅ Completed |
| **Phase 2** | **Arena Lobby, Match State Machine & Classic Quiz** (Lobby Esports, Match lifecycle: WAITING -> COUNTDOWN -> QUESTION_ACTIVE -> QUESTION_LOCKED -> SHOWING_RESULT -> ROUND_TRANSITION -> MATCH_COMPLETED) | ✅ Completed |
| **Phase 3** | **Scoring Engine, Countdown Ring & Streak Multipliers** (Base 700 + Speed 0-300 + Streak 0-200) × RoundMultiplier, Backend authoritative & Idempotent) | ✅ Completed |
| **Phase 4** | **Live Leaderboard & Realtime Activity Feed** (Podium Top 3, Top 10, Rank change deltas, Throttled event feed: streak, rank up, joined) | ✅ Completed |
| **Phase 5** | **Competitive Modes: Survival, Duel & Team Battle** (Survival 3 lives/hearts, 1vs1 Duel, Red vs Blue Team Battle chuẩn hóa điểm) | ✅ Completed |
| **Phase 6** | **Competitive Modes: Word Rush, Boss Round & Final Showdown** (Word Rush sắp xếp ký tự/typing Unicode, Boss Round x2 điểm, Final Showdown x3 điểm quyết định) | ✅ Completed |
| **Phase 7** | **Player Progression, Achievements & Daily Missions** (`MissionCard`, `AchievementCard`, XP, Level, Badges) | ✅ Completed |
| **Phase 8** | **Match Result & Post-Game Learning Notebook** (`WinnerCelebration`, Champion podium, personal stats, Vocabulary Review card, lưu từ sai vào Sổ tay Spaced Repetition FSRS) | ✅ Completed |
| **Phase 9** | **Optimization, Fairness, Automated Testing & Verification** (Anti-cheat, Deduplication, Unit & Integration Tests, Vitest Pass 122/122 tests 100%) | ✅ Completed |

---

## 🚀 Chi Tiết Các Hạng Mục Đã Triển Khai

### 1. Dọn Dẹp Game Tạm & Chuẩn Hóa Dữ Liệu Ngôn Ngữ (Phase 0)
- Đã xóa sạch các game tạm làm sai không gian ngôn ngữ: `WordMatchGame.tsx`, `WordScrambleGame.tsx` ở cả `apps/web` và `apps/student`.
- Đã gỡ bỏ toàn bộ routes `/games/word-match` và `/games/scramble` khỏi `App.tsx` của Web và Student app.
- Đã gỡ bỏ block "MINI GAMES LUYỆN PHẢN XẠ 24/7" trên giao diện Lobby (`GameLobbyPage.tsx`).
- Chuẩn hóa Backend `getSystemPresetRooms` và `QuestionProviderService`: Khi phòng thuộc ngôn ngữ nào (Tiếng Trung, Tiếng Nhật, Tiếng Hàn, Tiếng Anh, Tiếng Đức, Tiếng Pháp, Tiếng Tây Ban Nha, Tiếng Thái, Tiếng Việt), 100% câu hỏi, đáp án, phiên âm (Pinyin, Romaji, Hangul, IPA) và giải thích lấy chính xác từ kho từ vựng hệ thống theo ngôn ngữ đó, tuyệt đối không bị trộn lẫn hay fallback sai sang tiếng Anh.

### 2. Bộ Design System Esports Riêng Biệt Cho Arena (Phase 1)
- Color Palette chuẩn:
  - Dark background: `#090D1B`
  - Surface: `#12182B`
  - Elevated surface: `#19213A`
  - Primary: `#2041F6`
  - Primary highlight: `#8B75FF`
  - Gold: `#F6C453`
  - Success: `#25C98A`
  - Error: `#F26B76`
  - Secondary text: `#929CB4`
  - Main text: `#F4F6FF`
- Bộ 16 components UI độc lập, không dùng emoji làm icon (sử dụng 100% vector SVG sắc nét):
  - `ArenaHeader`: Header cố định hiển thị Room Code, Language, Game Mode, nút bật/tắt BGM, toàn màn hình và thoát phòng.
  - `QuestionCard`: Khung hiển thị câu hỏi lớn, rõ nét với thẻ cấp độ, phát âm audio, phiên âm và ví dụ ngữ cảnh.
  - `AnswerCard`: Đáp án lớn với 6 trạng thái rõ ràng (`idle`, `selected`, `correct`, `incorrect`, `locked`, `disabled`) cùng tỷ lệ bình luận thời gian thực.
  - `CountdownRing`: Đồng hồ đếm ngược SVG mượt mà, đổi màu cảnh báo khẩn cấp khi dưới 3 giây.
  - `MatchProgress`: Thanh tiến trình câu hỏi kèm chỉ báo hệ số điểm vòng.
  - `PlayerAvatar`: Avatar học viên với khung xếp hạng (Đồng, Bạc, Vàng, Kim Cương, Quán Quân) và trạng thái bị loại (OUT).
  - `RankBadge`: Huy hiệu bậc xếp hạng (Đồng đến Thách Đấu).
  - `StreakIndicator`: Ngọn lửa streak với hiệu ứng bùng nổ khi đạt chuỗi 2, 3, 5, 7, 10.
  - `MultiplierBadge`: Huy hiệu hệ số nhân điểm (1x, 2x, 3x).
  - `ArenaPodium`: Bục vinh quang Esports Top 3 (Quán quân Vàng 🥇, Hạng nhì Bạc 🥈, Hạng ba Đồng 🥉).
  - `ArenaLeaderboard`: Bảng xếp hạng Top 10 trực tiếp kèm chỉ báo tăng/giảm hạng (▲ +2, ▼ -1).
  - `ActivityFeed`: Luồng hoạt động trực tiếp được điều tiết tốc độ (throttle).
  - `RoundResultModal`: Modal tổng kết sau mỗi câu (Screen D).
  - `WinnerCelebration`: Màn hình vinh danh toàn trận kèm thẻ ôn tập từ vựng (Screen E).
  - `MissionCard`: Nhiệm vụ hàng ngày tích lũy XP.
  - `AchievementCard`: Danh hiệu thành tích học viên.

### 3. Động Cơ Tính Điểm Chuẩn Esports (Phase 3)
- Công thức: `FinalPoints = (BasePoints + SpeedBonus + StreakBonus) × RoundMultiplier`
- Base: 700
- Speed bonus theo tiers:
  - `< 2.0s`: +300 pts
  - `< 4.5s`: +220 pts
  - `< 8.0s`: +140 pts
  - `< 12.0s`: +80 pts
  - `>= 12.0s`: +40 pts
- Streak bonus:
  - Streak 2: +50 pts
  - Streak 3: +100 pts
  - Streak 5: +150 pts
  - Streak 7+: +200 pts
- Multipliers:
  - Vòng thông thường: 1.0x
  - Boss Round: 2.0x
  - Final Showdown: 3.0x
- Tie-breaker: Ưu tiên điểm cao nhất -> Chuỗi cao nhất -> Thời gian phản xạ sớm nhất -> Tổng câu đúng.

### 4. Bảy Chế Độ Thi Đấu Chuyên Biệt (Phase 5 & 6)
- `CLASSIC_QUIZ`: Trắc nghiệm 4 lựa chọn phản xạ tốc độ cao.
- `SURVIVAL`: Cơ chế 3 mạng tim. Sai 1 câu mất 1 tim, hết tim chuyển sang Spectator mode.
- `DUEL`: Song đấu 1vs1 đối kháng trực diện.
- `TEAM_BATTLE`: Đại chiến bang hội Red vs Blue, điểm chuẩn hóa theo tỷ lệ người chơi.
- `WORD_RUSH`: Sắp xếp ký tự / điền khuyết / gõ từ vựng với chuẩn hóa Unicode theo ngôn ngữ.
- `BOSS_ROUND`: Câu hỏi độ khó Expert, nhân đôi điểm x2.
- `FINAL_SHOWDOWN`: 3 câu hỏi quyết định ngôi vị Quán Quân với hệ số nhân x3.

### 5. Học Tập Sau Trận & Báo Cáo Ôn Luyện (Phase 8)
- Hiển thị danh sách đầy đủ toàn bộ từ vựng đã xuất hiện trong trận đấu (từ, nghĩa, phát âm, ví dụ).
- Nút "Lưu từ vào Sổ Tay FSRS" đồng bộ ngay lập tức vào thuật toán Spaced Repetition của học viên.

### 6. Kiểm Thử Toàn Diện (Phase 9)
- Đã chạy `vitest run` kiểm chứng toàn bộ 122 tests trên hệ thống bao gồm 15 tests mới của `arenaCompetitiveSystem.test.ts`: **PASS 122/122 (100%)**.
