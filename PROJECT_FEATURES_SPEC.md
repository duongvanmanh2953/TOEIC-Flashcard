# 📘 LETSTUN AI – TÀI LIỆU TOÀN DIỆN VỀ KIẾN TRÚC & TÍNH NĂNG HỆ THỐNG
> **Dành cho:** AI Assistant (Context Loading), Lập trình viên mới (Onboarding) và Quản trị viên hệ thống.  
> **Phiên bản:** `4.2.0 (Full-Stack Production Ready)`  
> **Mục tiêu:** Cung cấp bản đặc tả kiến trúc, luồng nghiệp vụ (Business Rules), hệ thống Database Schema, danh mục API Endpoints và hướng dẫn vận hành toàn diện nhất của dự án.

---

## 📑 MỤC LỤC
1. [Tổng Quan & Tech Stack](#1-tổng-quan--tech-stack)
2. [Cấu Trúc Thư Mục Toàn Dự Án](#2-cấu-trúc-thư-mục-toàn-dự-án)
3. [Hệ Thống Bảo Mật & Quản Lý Thiết Bị (Device Security)](#3-hệ-thống-bảo-mật--quản-lý-thiết-bị-device-security)
4. [LetStuN AI – Động Cơ Trí Nhớ 5 Chiều (Cognitive 5D Engine)](#4-letstun-ai--động-cơ-trí-nhớ-5-chiều-cognitive-5d-engine)
5. [Thuật Toán Lặp Lại Ngắt Quãng FSRS (Spaced Repetition)](#5-thuật-toán-lặp-lại-ngắt-quãng-fsrs-spaced-repetition)
6. [Hệ Thống Luyện Thi TOEIC Chuẩn Quốc Tế](#6-hệ-thống-luyện-thi-toeic-chuẩn-quốc-tế)
7. [AI Tutor, Roleplay & Luyện Âm Chuẩn](#7-ai-tutor-roleplay--luyện-âm-chuẩn)
8. [Học Đa Ngôn Ngữ (Multi-Language Architecture)](#8-học-đa-ngôn-ngữ-multi-language-architecture)
9. [Gamification & Đấu Từ Vựng Real-time (Socket.IO)](#9-gamification--đấu-từ-vựng-real-time-socketio)
10. [Hệ Thống Kids English (Giao diện dành riêng cho trẻ em)](#10-hệ-thống-kids-english-giao-diện-dành-riêng-cho-trẻ-em)
11. [Admin Command Center (Trung tâm điều hành)](#11-admin-command-center-trung-tâm-điều-hành)
12. [Cơ Sở Dữ Liệu (Database Schema Mapping)](#12-cơ-sở-dữ-liệu-database-schema-mapping)
13. [Danh Mục API Endpoints Chuẩn](#13-danh-mục-api-endpoints-chuẩn)

---

## 1. TỔNG QUAN & TECH STACK

LetStuN AI là nền tảng học từ vựng, luyện thi chứng chỉ (TOEIC) và rèn luyện kỹ năng ngôn ngữ tích hợp AI thông minh.

* **Frontend (`apps/web`)**:
  * **Framework**: React 18, Vite 5, TypeScript.
  * **Styling**: TailwindCSS 3, Glassmorphism, CSS Custom Properties (Light/Dark mode).
  * **Icons**: `lucide-react`.
  * **Routing**: `react-router-dom` v6.
  * **Local State / Storage**: IndexedDB (`lib/idb.ts`) cho khả năng học offline, `localStorage` lưu cấu hình và persistent token.
  * **Realtime**: `socket.io-client`.
  * **Audio / TTS**: Microsoft Edge TTS, Web Speech API.
* **Backend API (`apps/api`)**:
  * **Framework**: NestJS 10 (Node.js), TypeScript.
  * **ORM & Database**: Prisma ORM 5.x kết nối PostgreSQL.
  * **Authentication**: Passport-JWT, Bcrypt băm mật khẩu và mã OTP.
  * **Email**: Nodemailer (Gửi cảnh báo rủi ro thiết bị và mã OTP 6 số).
  * **Realtime Gateway**: `@nestjs/websockets` + `socket.io` (Phòng đấu từ vựng thời gian thực).
  * **Caching & Queue**: In-memory / Redis hỗ trợ telemetry và rate-limiting.
* **DevOps / Deployment**:
  * Docker đa tầng (`multi-stage build`), Nginx phục vụ frontend SPA, Docker Compose tự động chạy DB, API và Web.

---

## 2. CẤU TRÚC THƯ MỤC TOÀN DỰ ÁN

```text
ToeicFlashCard/
├── apps/
│   ├── api/                           # NestJS Backend API
│   │   ├── prisma/
│   │   │   ├── schema.prisma          # Database schema chính (PostgreSQL)
│   │   │   ├── seed.ts                # Dữ liệu khởi tạo mẫu
│   │   │   └── migrations/            # Lịch sử các migration SQL
│   │   └── src/
│   │       ├── common/                # Guards, Interceptors, Decorators (JWT, Roles)
│   │       ├── modules/
│   │       │   ├── auth/              # Auth, JWT, DeviceSecurityService, MailService
│   │       │   ├── admin/             # AdminService, AdminController (Audit, Settings, Reset)
│   │       │   ├── vocabulary/        # VocabularyService, MemoryEngineService (X-Ray, Capture)
│   │       │   ├── ai/                # AIService, AI Tutor, Roleplay, Audio analysis
│   │       │   ├── exams/             # Quản lý đề thi TOEIC, chấm điểm tự động
│   │       │   ├── games/             # GameGateway (Socket.IO) đấu từ vựng 1v1
│   │       │   └── support/           # CSKH, tickets, báo lỗi, feedback
│   │       ├── app.module.ts
│   │       └── main.ts
│   └── web/                           # React + Vite Frontend App
│       ├── src/
│       │   ├── components/
│       │   │   ├── admin/             # UI Quản trị viên (RBAC, Audit, Settings)
│       │   │   ├── common/            # GlassCard, ModalPortal, ConfirmDialog
│       │   │   ├── flashcard/         # Thẻ học đa chiều 3D Flip
│       │   │   ├── letstun/         # X-Ray, Capture, Diagnostic, Queue
│       │   │   ├── language/          # Bộ chọn ngôn ngữ, Quốc kỳ
│       │   │   └── layout/            # AppShell, Navbar, Sidebar
│       │   ├── contexts/              # AuthContext, LearningContext
│       │   ├── kids/                  # Hệ thống học tiếng Anh cho trẻ em
│       │   ├── pages/                 # Toàn bộ trang giao diện người dùng
│       │   ├── lib/                   # api.ts (Axios + Device ID interceptor), idb.ts
│       │   ├── App.tsx                # Khai báo React Router
│       │   └── main.tsx
│       └── package.json
├── docker-compose.yml
└── README.md
```

---

## 3. HỆ THỐNG BẢO MẬT & QUẢN LÝ THIẾT BỊ (DEVICE SECURITY)

### 3.1. Giới Hạn Thiết Bị Nghiêm Ngặt (Device Limits)
* **Học viên (`STUDENT / PRO`)**: Tối đa **3 thiết bị** hoạt động đồng thời.
* **Quản trị viên (`ADMIN / SUPER_ADMIN`)**: Nghiêm ngặt **1 thiết bị duy nhất**.
* **Đăng nhập trên thiết bị vượt giới hạn (Thiết bị thứ 4 của học viên, hoặc thứ 2 của Admin)**:
  * **KHÔNG ĐƯỢC PHÉP tự động xóa thiết bị cũ**.
  * Thiết bị mới sẽ bị chuyển vào trạng thái `PENDING_REVIEW` và **bị chặn đăng nhập** (`403 DEVICE_LIMIT_EXCEEDED`).
  * Hệ thống tự động ghi nhật ký cảnh báo `DeviceRiskEvent`, gửi email thông báo bảo mật đến hòm thư người dùng và đẩy lên danh sách **Tài khoản rủi ro** của Admin.

### 3.2. Thu Hồi Thiết Bị Phải Có OTP Qua Email
* Người dùng có thể xem danh sách thiết bị đang đăng nhập tại trang Cài đặt (`/settings`).
* Khi muốn đăng xuất một thiết bị khác từ xa:
  1. Gửi yêu cầu mã OTP (`POST /api/v1/security/device-logout/request-otp`).
  2. Hệ thống tạo mã OTP 6 chữ số ngẫu nhiên, **mã hóa băm một chiều (bcrypt)** lưu vào bảng `DeviceLogoutOtp` và gửi mã qua email người dùng.
  3. Mã OTP có hiệu lực trong **10 phút**, tối đa 5 lần thử.
  4. Người dùng nhập mã OTP trên modal xác thực (`POST /api/v1/security/device-logout/verify-otp`).
  5. Hệ thống xác thực và thu hồi thiết bị mục tiêu mà **không làm gián đoạn thiết bị hiện tại**.

### 3.3. Đổi Mật Khẩu Thu Hồi Toàn Bộ Phiên Làm Việc
* Khi người dùng hoặc Admin đổi mật khẩu (`POST /api/v1/auth/change-password` hoặc `POST /api/v1/admin/security/change-password`):
  * Cập nhật mật khẩu mới.
  * **Hủy toàn bộ các phiên `UserSession` và thiết bị `UserDevice`** trên mọi nền tảng.
  * Bắt buộc người dùng phải đăng nhập lại từ đầu để loại trừ nguy cơ bị lộ session token cũ.

### 3.4. Admin Security Keypass (Mã Bảo Mật Tối Cao Cấp 2)
* Quản trị viên có một mã bảo mật cấp 2 gọi là **Admin Keypass**.
* Mã này được băm bằng bcrypt lưu độc lập tại bảng `AdminSecurity`.
* **Tính bất biến:** Khi Admin đổi mật khẩu đăng nhập, **Admin Keypass KHÔNG bao giờ bị thay đổi hay xóa**.

### 3.5. Xóa Sạch Toàn Bộ Dữ Liệu Hệ Thống ("Reset All Data")
* Tính năng tối cao dành cho Admin tại trang Cài đặt Hệ thống (`POST /api/v1/admin/system/reset-all-data`).
* **Tiền kiểm tra 3 yếu tố bắt buộc (3-Factor Preflight)**:
  1. Người dùng phải nhập chính xác chữ: `RESET`.
  2. Phải nhập đúng **Mật khẩu Admin hiện tại**.
  3. Phải nhập đúng **Admin Security Keypass**.
* **Phạm vi thực thi:**
  * Xóa sạch 100% dữ liệu phát sinh của học viên: Tài khoản người dùng (non-admin), hồ sơ, tiến độ từ vựng, chuỗi học, lịch sử thi cử, đơn hàng, bộ từ cộng đồng, tin nhắn hỗ trợ.
  * **Bảo lưu an toàn tuyệt đối:** Tài khoản Quản trị viên (Admin/Super Admin), Quyền hạn, Từ điển chuẩn (`Vocabulary`), Gói cước (`Plan`), Cấu hình hệ thống (`SystemConfig`).
  * Thực thi bên trong một Prisma Transaction có bước hậu kiểm đếm số bản ghi đảm bảo sạch 100%.

---

## 4. LETSTUN AI – ĐỘNG CƠ TRÍ NHỚ 5 CHIỀU (COGNITIVE 5D ENGINE)

LetStuN AI giải quyết triệt để vấn đề lớn nhất của người học ngoại ngữ: **"Nhận ra từ khi đọc bài thi nhưng không thể mở miệng nói hay tự viết thành câu"** (Khoảng cách giữa Trí nhớ Thụ động - Passive và Trí nhớ Chủ động - Active).

### 4.1. Mô Hình Nhận Thức 5 Chiều (Cognitive 5D Scores: 0 - 100%)
Mỗi từ vựng được theo dõi độc lập qua 5 chỉ số:
1. **`recognitionScore` (Nhận diện mặt chữ):** Khả năng chọn đúng nghĩa khi nhìn thấy từ trong câu hỏi trắc nghiệm.
2. **`recallScore` (Hồi tưởng ngữ nghĩa):** Khả năng nhớ ra từ khi chỉ thấy gợi ý nghĩa tiếng Việt hoặc định nghĩa tiếng Anh.
3. **`contextScore` (Ngữ cảnh sử dụng):** Khả năng hiểu đúng sắc thái nghĩa của từ trong các ngữ cảnh câu khác nhau.
4. **`productionScore` (Tự đặt câu & viết):** Khả năng chủ động dùng từ để viết câu mới chuẩn ngữ pháp.
5. **`speakingScore` (Phát âm & nói):** Khả năng phát âm chuẩn xác và vận dụng từ trong giao tiếp nói.

### 4.2. Trạng Thái Vòng Đời Từ Vựng (Vocabulary Lifecycle)
* `NEW`: Từ vựng mới nạp, chưa làm bài tập.
* `LEARNING`: Đang học các chu kỳ ôn tập ban đầu.
* `STABLE`: Điểm nhận diện và hồi tưởng tốt, độ bền trí nhớ > 7 ngày.
* `WEAK`: Điểm nhận diện cao nhưng điểm vận dụng (Production/Speaking) thấp.
* `AT_RISK`: Đã lâu không gặp lại, xác suất quên cao theo đường cong Ebbinghaus.
* `FORGOTTEN`: Bị quên hoặc trả lời sai trong lượt ôn tập gần nhất.
* `CONFUSED`: Thường xuyên nhầm lẫn với một từ vựng tương tự.
* `MASTERED`: Thành thạo toàn diện cả 5 chiều nhận thức.

### 4.3. Vocabulary X-Ray
* Giao diện phân tích chất lượng trí nhớ tại `/analytics`:
  * **Phổ chất lượng:** Tỷ lệ % từ vựng Bền vững (Strong), Chưa ổn định (Unstable), Có nguy cơ quên (At Risk), Đã quên (Forgotten).
  * **Biểu đồ 5 chiều:** Trực quan hóa điểm trung bình Recognition, Recall, Context, Production, Speaking.
  * **Phân bố CEFR:** Số lượng từ vựng đạt các chuẩn A1, A2, B1, B2, C1, C2.
  * **Lĩnh vực cần củng cố:** Liệt kê các chủ đề từ vựng có độ bền trí nhớ thấp nhất.

### 4.4. Chẩn Đoán "Tại Sao Tôi Hay Quên Từ Này?" & Word Journey Timeline
* Nút bấm tích hợp trực tiếp trên thẻ học Flashcard (`/review`) và bảng phân tích.
* Bóc tách nguyên nhân cốt lõi (ví dụ: *"Bạn đạt 90% nhận diện nhưng Production chỉ 20% do chưa từng tự đặt câu với từ này"*).
* Hiển thị dòng thời gian **Word Journey**: Từ ngày đầu tiên lưu từ -> Lịch sử ôn tập -> Các buổi chat với AI Tutor có dùng từ -> Lỗi sai ghi nhận.

### 4.5. Real-World Vocabulary Capture (Thu Thập Từ Vựng Đời Thực)
* Học viên dán bất kỳ bài báo, email công việc, video transcript tiếng Anh nào vào hệ thống.
* AI tự động phân tích:
  * Loại bỏ các từ học viên đã thành thạo trong cơ sở dữ liệu.
  * Trích xuất các từ vựng đắt giá theo ngữ cảnh bài đọc.
  * Dịch nghĩa tiếng Việt chuẩn theo đúng câu văn gốc.
  * Xác định cấp độ CEFR và các cụm từ kết hợp tự nhiên (Collocations).
  * Cho phép chọn từ và nạp thẳng vào hàng đợi học tập FSRS.

### 4.6. Smart Review Queue (Hàng Đợi Trí Nhớ Vi Học Tập)
* Cho phép chọn nhanh thời lượng học siêu ngắn (Micro-learning): **3 phút** (ôn nhanh 5 từ), **5 phút** (cân bằng 10 từ), **10 phút** (luyện viết câu sâu 15 từ).
* Bộ lọc điểm yếu: `Tất cả`, `Tới hạn SRS`, `Yếu ngữ cảnh`, `Yếu tạo câu (Active)`, `Vừa mới quên`.

### 4.7. Confusion Engine (Động Cơ Phân Biệt Từ Dễ Nhầm)
* Thống kê và so sánh trực quan các cặp từ vựng hay gây nhầm lẫn nhất (ví dụ: `affect` vs `effect`, `principal` vs `principle`, `complement` vs `compliment`).
* Hiển thị bảng so sánh nghĩa, phát âm, câu ví dụ phân biệt và mẹo mẹo nhớ nhanh (Distinction Tips).

---

## 5. THUẬT TOÁN LẶP LẠI NGẮT QUÃNG FSRS (SPACED REPETITION)

Hệ thống triển khai thuật toán **FSRS (Free Spaced Repetition Scheduler)** kết hợp dữ liệu Ebbinghaus:
* **Tham số tính toán:**
  * `stability` ($S$): Độ bền trí nhớ (số ngày dự kiến trước khi xác suất nhớ giảm xuống dưới 90%).
  * `difficulty` ($D$): Độ khó nội tại của từ vựng (từ 1.0 đến 10.0).
  * `retrievability` ($R$): Khả năng gợi nhớ hiện tại, suy giảm theo thời gian:
    $$R(t) = (1 + t / (9 \times S))^{-1}$$
* **Đánh giá 4 nút bấm:**
  * `AGAIN`: Quên từ -> Hạ stability, tăng difficulty, đưa vào ôn lại ngay trong phiên.
  * `HARD`: Khó nhớ -> Tăng nhẹ interval ($1.2\times$).
  * `GOOD`: Nhớ tốt -> Chu kỳ giãn nở chuẩn ($2.5\times$).
  * `EASY`: Quá dễ -> Nhảy vọt interval ($4.0\times$), giảm độ khó.
* **Offline-First Synchronization:** Dữ liệu lượt học được lưu đệm tức thời vào IndexedDB trên trình duyệt, tự động đồng bộ lên Server khi có mạng.

---

## 6. HỆ THỐNG LUYỆN THI TOEIC CHUẨN QUỐC TẾ

* **Ngân hàng đề thi (`/exams`)**:
  * Đề thi Full Test 200 câu (100 câu Listening Part 1-4 + 100 câu Reading Part 5-7).
  * Đề thi rút gọn Mini Test (30 - 50 câu) dành cho người bận rộn.
  * Đề thi theo từng Part chuyên biệt (Part 1, 2, 3, 4, 5, 6, 7).
* **Môi trường thi mô phỏng thực chiến**:
  * Đồng hồ đếm ngược 120 phút chuẩn ETS.
  * Bộ nghe Audio chất lượng cao, chia đoạn mượt mà.
  * Bảng Answer Sheet trực quan: Theo dõi câu đã làm, câu đánh dấu xem lại (Flagged).
* **Chấm điểm tự động & Báo cáo kết quả (`/exams/:id/result`)**:
  * Bảng quy đổi điểm TOEIC chuẩn (thang điểm 10 - 990).
  * Bóc tách điểm Listening và Reading riêng biệt.
  * Phân tích điểm mạnh, điểm yếu theo từng phần thi.
  * Lời giải chi tiết tiếng Việt cho 100% câu hỏi kèm transcript audio.
  * **Wrong Answer Review:** Chế độ luyện lại riêng các câu làm sai để ghi nhớ lỗ hổng kiến thức.

---

## 7. AI TUTOR, ROLEPLAY & LUYỆN ÂM CHUẨN

* **AI Tutor Chatbot (`/ai-tutor`)**:
  * Đóng vai gia sư luyện thi TOEIC và giao tiếp bản xứ.
  * **Memory Injection:** Tự động chèn mục tiêu học tập và danh sách các từ vựng đang yếu của học viên vào System Prompt để AI chủ động gợi ý người học dùng từ trong cuộc trò chuyện.
  * **Post-Conversation Analysis:** Khi kết thúc phiên chat, AI tự động quét lại toàn bộ tin nhắn để cập nhật điểm `productionScore` và `contextScore` cho người dùng.
* **Roleplay Scenarios (`/ai-coach`)**:
  * Hơn 20 kịch bản công sở mô phỏng: Phỏng vấn xin việc, đàm phán hợp đồng, thuyết trình dự án, gọi điện CSKH quốc tế.
* **Luyện Phát Âm Trực Tiếp (Voice Practice)**:
  * Sử dụng Web Speech API / Microsoft Edge TTS để nghe phát âm chuẩn giọng Anh-Mỹ (en-US), Anh-Anh (en-GB), Anh-Úc (en-AU).
  * Thu âm giọng đọc học viên, so sánh độ chính xác phát âm (Phonetic Accuracy).

---

## 8. HỌC ĐA NGÔN NGỮ (MULTI-LANGUAGE ARCHITECTURE)

Hệ thống được thiết kế mở rộng đa ngôn ngữ (`apps/web/src/config/languages.ts`):
* **Tiếng Anh (English):** Chuẩn CEFR (A1, A2, B1, B2, C1, C2), TOEIC.
* **Tiếng Nhật (Japanese):** Chuẩn JLPT (N5, N4, N3, N2, N1), phiên âm Romaji, chữ Hán (Kanji).
* **Tiếng Trung (Chinese):** Chuẩn HSK (HSK 1 - HSK 6), phiên âm Pinyin, chữ Hán giản thể/phồn thể.
* **Tiếng Hàn (Korean):** Chuẩn TOPIK (TOPIK 1 - TOPIK 6), chữ Hangul.
* **Ngôn ngữ Châu Âu:** Tiếng Pháp, Tiếng Đức, Tiếng Tây Ban Nha có hỗ trợ giống của danh từ (Gender: m/f/n) và mạo từ (Article).

---

## 9. GAMIFICATION & ĐẤU TỪ VỰNG REAL-TIME (SOCKET.IO)

* **Chuỗi ngày học (Daily Streak & Freeze):** Đếm số ngày học liên tục, hỗ trợ "Khiên bảo vệ chuỗi" khi bận rộn.
* **Kinh nghiệm (XP) & Cấp độ (Levels):** Tích lũy XP qua từng lượt lật flashcard, hoàn thành bài thi thử, chuỗi thắng game.
* **Đấu Trường Từ Vựng 1v1 (`/games/room/:id`)**:
  * Kết nối thời gian thực qua WebSockets (Socket.IO).
  * Tìm đối thủ ngẫu nhiên hoặc tạo phòng đấu bạn bè.
  * Thi đấu 10 câu hỏi tốc độ cao: Ai trả lời đúng và nhanh hơn sẽ giành điểm cao hơn.
* **Game rèn luyện:**
  * **Word Match Game:** Nối từ tiếng Anh với nghĩa tiếng Việt tương ứng.
  * **Word Scramble Game:** Sắp xếp lại các ký tự bị xáo trộn để tạo thành từ đúng.
* **Bảng Xếp Hạng Toàn Cầu (`/leaderboard`)**: Xếp hạng theo tuần, tháng và chuỗi ngày học bền bỉ nhất.

---

## 10. HỆ THỐNG KIDS ENGLISH (GIAO DIỆN DÀNH RIÊNG CHO TRẺ EM)

Được đóng gói tại thư mục `apps/web/src/kids/` với phong cách thiết kế tươi sáng, âm thanh vui nhộn:
* **Kids Journey:** Lộ trình bài học theo bản đồ phiêu lưu thế giới hoạt hình.
* **Kids Flashcards:** Thẻ học khổ lớn kèm hình ảnh minh họa sinh động và âm thanh tự động.
* **Kids My World:** Nông trại từ vựng, sở thú và bộ sưu tập huy hiệu động vật.
* **Kids Parent Dashboard:** Màn hình dành cho phụ huynh theo dõi thời lượng học, giới hạn thời gian màn hình và từ vựng con đã tiếp thu.

---

## 11. ADMIN COMMAND CENTER (TRUNG TÂM ĐIỀU HÀNH)

Được quản lý tại `/admin` dành riêng cho tài khoản có vai trò `ADMIN` hoặc `SUPER_ADMIN`:
1. **Tổng quan Telemetry (`/admin`):** Biểu đồ tăng trưởng người dùng, doanh thu MRR, lượt thi thử, dung lượng DB.
2. **Quản lý Học viên (`/admin/users`):** Xem danh sách, thăng cấp/hạ cấp vai trò, khóa tài khoản, mở tài khoản.
3. **Bảo mật & Rủi ro Thiết bị (`/admin/security`):** Theo dõi thiết bị vượt hạn mức (Risk Events), duyệt/chặn thiết bị, đổi mật khẩu Admin, cập nhật Admin Keypass.
4. **Cấu hình 13 Nhóm Hệ Thống (`/admin/settings`):**
   * Chung (Tên site, bảo trì, cho phép đăng ký)
   * Thương hiệu & Bảng màu
   * Ngôn ngữ & Vùng miền
   * Cấu hình FSRS & Mục tiêu học
   * Hạn mức AI Token & Model
   * Thông báo & Chuông cảnh báo
   * Hỗ trợ CSKH & SLA
   * Tiếp nhận Góp ý & Báo lỗi
   * Cổng thanh toán & Thuế
   * Chính sách bảo mật & Thời hạn phiên
   * Phân quyền vai trò người dùng (RBAC)
   * Công tắc tính năng (Feature Flags bật/tắt tức thời)
   * Hệ thống, Dọn dẹp Cache & **Reset All Data**.
5. **Quản lý Kho Từ Vựng Chuẩn (`/admin/vocabulary`):** Nhập/xuất file Excel/CSV, chỉnh sửa từ điển mẫu.
6. **Học liệu & Đề thi (`/admin/resources` & `/admin/learning`):** Quản lý bài đọc, file âm thanh, đề thi thử.

---

## 12. CƠ SỞ DỮ LIỆU (DATABASE SCHEMA MAPPING)

| Tên Bảng (Model) | Mục Đích Lưu Trữ | Trường Dữ Liệu Quan Trọng |
| :--- | :--- | :--- |
| `User` | Thông tin tài khoản người dùng | `id`, `email`, `passwordHash`, `role`, `tier`, `riskStatus` |
| `UserProfile` | Hồ sơ cá nhân & tiến độ | `userId`, `displayName`, `streak`, `xp`, `primaryGoal`, `secondaryGoal` |
| `UserDevice` | Danh sách thiết bị đăng nhập | `userId`, `deviceId`, `deviceName`, `deviceType`, `status`, `ipAddress` |
| `UserSession` | Phiên đăng nhập thời gian thực | `userId`, `deviceId`, `tokenHash`, `status`, `expiresAt` |
| `DeviceRiskEvent` | Nhật ký thiết bị vượt giới hạn | `userId`, `deviceId`, `eventType`, `status`, `riskScore`, `metadata` |
| `DeviceLogoutOtp` | Mã OTP băm bcrypt để thu hồi thiết bị | `userId`, `targetDeviceId`, `otpHash`, `attempts`, `expiresAt` |
| `AdminSecurity` | Mã Keypass bảo mật tối cao cấp 2 | `adminId`, `keypassHash`, `lastRotatedAt` |
| `Vocabulary` | Kho từ điển gốc chuẩn | `word`, `meaningVi`, `phonetic`, `partOfSpeech`, `cefrLevel`, `topic` |
| `UserVocabulary` | Tiến độ trí nhớ 5D cá nhân hóa | `userId`, `vocabularyId`, `recognitionScore`, `recallScore`, `contextScore`, `productionScore`, `speakingScore`, `stability`, `difficulty`, `status` |
| `WordJourneyEvent` | Dòng thời gian gắn bó với từ vựng | `userId`, `vocabularyId`, `eventType`, `description`, `createdAt` |
| `VocabularyConfusionPair`| Các cặp từ hay bị nhầm lẫn | `wordA`, `wordB`, `meaningA`, `meaningB`, `distinctionTip` |
| `VocabularyCapture` | Lịch sử quét tài liệu thực tế | `userId`, `sourceText`, `sourceType`, `sourceTitle` |
| `Exam` | Đề thi TOEIC chuẩn | `title`, `description`, `type`, `timeMinutes`, `totalQuestions` |
| `ExamQuestion` | Câu hỏi trong đề thi | `examId`, `part`, `questionText`, `options`, `correctAnswer`, `explanation` |
| `ExamAttempt` | Kết quả làm bài thi của học viên | `userId`, `examId`, `score`, `listeningScore`, `readingScore`, `timeSpent` |

---

## 13. DANH MỤC API ENDPOINTS CHUẨN

### 🔐 1. Xác thực & Thiết bị (`/api/v1/auth` & `/api/v1/security`)
* `POST /auth/register`: Đăng ký tài khoản mới.
* `POST /auth/login`: Đăng nhập (kèm header `x-device-id`, kiểm tra giới hạn 3 thiết bị).
* `POST /auth/refresh`: Cấp lại JWT access token mới.
* `POST /auth/change-password`: Đổi mật khẩu & thu hồi toàn bộ thiết bị.
* `GET /security/devices`: Lấy danh sách thiết bị đang dùng kèm quota `X / 3`.
* `POST /security/device-logout/request-otp`: Yêu cầu mã OTP qua Email để đăng xuất thiết bị khác.
* `POST /security/device-logout/verify-otp`: Xác thực mã OTP và thu hồi thiết bị.

### 🧠 2. Động cơ Trí nhớ LetStuN AI (`/api/v1/vocabulary`)
* `GET /vocabulary/x-ray`: Quét toàn diện phổ chất lượng trí nhớ và 5 chiều nhận thức.
* `GET /vocabulary/:id/diagnostic`: Chẩn đoán nguyên nhân hay quên và lấy Word Journey Timeline.
* `POST /vocabulary/capture/analyze`: Phân tích bài đọc tiếng Anh, lọc từ đã biết, bóc tách nghĩa ngữ cảnh.
* `POST /vocabulary/capture/save`: Lưu các từ vựng đã chọn vào hàng đợi học tập FSRS.
* `GET /vocabulary/smart-queue`: Lấy hàng đợi vi học tập (3m, 5m, 10m) theo điểm yếu nhận thức.
* `POST /vocabulary/production-practice`: Nộp bài tập tự đặt câu để AI chấm điểm độ tự nhiên.
* `GET /vocabulary/confusion-pairs`: Lấy danh sách các cặp từ dễ nhầm lẫn.

### 📝 3. Đề thi & Kết quả TOEIC (`/api/v1/exams`)
* `GET /exams`: Lấy danh sách đề thi (Full Test, Mini Test, Part chuyên biệt).
* `GET /exams/:id`: Lấy chi tiết nội dung đề thi và audio.
* `POST /exams/:id/submit`: Nộp bài thi, tự động tính điểm TOEIC 990 và phân tích kết quả.
* `GET /exams/attempts/:id`: Xem lại chi tiết bài làm, đáp án đúng và lời giải thích.

### 🛡️ 4. Quản trị viên (`/api/v1/admin`)
* `GET /admin/dashboard`: Dữ liệu thống kê tổng quan.
* `GET /admin/security/risky-accounts`: Danh sách thiết bị rủi ro / vượt giới hạn.
* `POST /admin/security/risky-accounts/:id/approve`: Duyệt thiết bị vượt hạn mức.
* `POST /admin/security/risky-accounts/:id/block`: Chặn thiết bị vĩnh viễn.
* `POST /admin/security/risky-accounts/:id/block-account`: Khóa toàn bộ tài khoản người dùng.
* `POST /admin/security/change-password`: Đổi mật khẩu Admin (thu hồi mọi phiên, giữ nguyên Keypass).
* `POST /admin/security/keypass`: Cập nhật mã Admin Security Keypass cấp 2.
* `POST /admin/system/reset-all-data`: Xóa sạch 100% data học viên (yêu cầu "RESET" + Mật khẩu + Keypass).
