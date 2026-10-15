# VocabFlow AI Feature Inventory

> **Trạng thái**: Đã xác minh qua mã nguồn Frontend và Controller/Service Backend (Verified)  
> **Nguyên tắc**: Không suy diễn tính năng hoàn thiện chỉ vì có giao diện; đánh giá đúng mức độ hoàn thiện thực tế.

---

## 1. Danh mục Tính năng Hệ thống (Feature Matrix)

| ID | Tính năng (Feature) | Mục đích nghiệp vụ | Giao diện chính (UI Component) | Backend Endpoint & Service | Thực thể CSDL (Prisma) | Mức độ hoàn thiện (Status) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FEAT-01** | **Authentication & Multi-Device Security** | Đăng ký, đăng nhập email/mật khẩu, quản lý phiên và giới hạn tối đa 3 thiết bị đồng thời | `ContextualLoginModal.tsx`, `ForgotPasswordModal.tsx` | `POST /api/v1/auth/login`<br/>`POST /api/v1/auth/register`<br/>`AuthService`, `DeviceSecurityService` | `User`, `UserDevice`, `UserSession`, `DeviceRiskEvent` | **Verified - Production Ready** |
| **FEAT-02** | **OAuth Account Linking** | Đăng nhập một chạm bằng Google / Facebook | `ContextualLoginModal.tsx` | `POST /api/v1/auth/oauth`<br/>`OAuthService` | `User`, `UserProfile` | **Verified - Cần vá bảo mật (SEC-001)** |
| **FEAT-03** | **Spaced Repetition & Flashcard Flip** | Lật thẻ flashcard 3D, nghe audio, chấm điểm ghi nhớ 1-5 sao, tính toán lịch lặp lại ngắt quãng | `LanguageFlashcard.tsx`, `SpeechButton.tsx` | `POST /api/v1/study-sessions/:id/review`<br/>`MemoryEngineService`, `ReviewsService` | `UserVocabulary`, `StudySession`, `ReviewEvent` | **Verified - Core Active** |
| **FEAT-04** | **Vocabulary X-Ray Diagnostics** | Chẩn đoán đa chiều não bộ ngôn ngữ: tỷ lệ ghi nhớ, nhận diện, ngữ cảnh, phân bổ cấp độ CEFR (A1-C2) | `VocabularyXRay.tsx`, `WordDiagnosticModal.tsx` | `GET /api/v1/vocabulary/x-ray`<br/>`MemoryEngineService.getVocabularyXRay` | `UserVocabulary`, `Vocabulary`, `VocabularyMeaning` | **Verified - Hoạt động tốt** |
| **FEAT-05** | **Smart Queue & Memory Rescue** | Tự động xếp hàng các từ vựng có nguy cơ quên cao (At-risk / Forgotten) vào hàng chờ khẩn cấp | `SmartQueueBar.tsx`, `MemoryRescueCard.tsx` | `GET /api/v1/vocabulary/smart-queue`<br/>`MemoryEngineService` | `UserVocabulary` | **Verified - Hoạt động tốt** |
| **FEAT-06** | **Vocabulary Capture Engine** | Trích xuất từ vựng mới tự động từ văn bản, PDF hoặc tệp Word tải lên | `VocabularyCaptureModal.tsx` | `POST /api/v1/vocabulary/capture`<br/>`MemoryEngineService` | `VocabularyCapture`, `Vocabulary` | **Verified - Đang chạy** |
| **FEAT-07** | **Multi-Language Support & Switcher** | Hỗ trợ 15+ ngôn ngữ đích (Anh, Nhật, Trung, Hàn, Đức, Pháp, Tây Ban Nha,...), định vị cờ, TTS locale | `LanguageSelector.tsx`, `LanguageBadge.tsx` | `GET /api/v1/languages`<br/>`apps/web/src/config/languages.ts` | Model `Vocabulary.languageId` | **Verified - Hoạt động tốt** |
| **FEAT-08** | **Community Deck Marketplace** | Chia sẻ bộ thẻ từ vựng cộng đồng, sao chép (clone) deck, bình luận và đánh giá | `CommunityCommentSection.tsx`, `AccessKeyManagementModal.tsx` | `GET /api/v1/community/decks`<br/>`POST /api/v1/community/decks/:id/clone` | `CommunityDeck`, `DeckClone`, `DeckComment`, `DeckLike` | **Verified - Hoạt động tốt** |
| **FEAT-09** | **Kids Vocabulary Learning Game** | Chế độ giao diện game hóa cho học viên nhỏ tuổi với mô hình Three.js và Swiper cards | `apps/kid/src/...`<br/>`GameButton.tsx` | `services/kid-api` (:4100) | `GameResult`, `UserVocabulary` | **Verified - Microservice riêng** |
| **FEAT-10** | **Admin Operations & Finance** | Dashboard quản lý người dùng, duyệt deck, in báo cáo tài chính, gán quyền và cấp key | `AdminLayout.tsx`, `FinancialReportPrintModal.tsx`, `AdminTable.tsx` | `services/admin-api` (:4200)<br/>`AdminController` | `User`, `Subscription`, `PaymentOrder`, `AuditLog` | **Verified - Role Guarded** |

---

## 2. Chi tiết Kỹ thuật Các Tính năng Trọng yếu

### FEAT-01: Authentication & Device Limiting Engine
- **Mục đích**: Bảo vệ bản quyền nội dung TOEIC/Từ vựng, ngăn chặn chia sẻ tài khoản cho nhiều người.
- **Cơ chế**: Khi người dùng đăng nhập, client gửi `x-device-id`, thông tin `os`, `browser`. Hệ thống kiểm tra số thiết bị `ACTIVE` trong bảng `UserDevice`. Nếu vượt quá 3 thiết bị, kích hoạt `DeviceRiskEvent`, trả về HTTP 403 `DEVICE_LIMIT_EXCEEDED` và yêu cầu gỡ thiết bị cũ hoặc xác thực OTP qua email.

### FEAT-03: Memory Engine & Spaced Repetition (FSRS/SM-2)
- **Mục đích**: Tối ưu hóa thời gian học bằng cách chỉ nhắc lại từ vựng đúng thời điểm người học sắp quên.
- **Biến số cốt lõi**:
  - `stability` (đơn vị: ngày): Khả năng duy trì ký ức của từ vựng.
  - `retrievability` (từ 0.0 đến 1.0): Xác suất nhớ lại được tính theo hàm suy giảm đường cong Ebbinghaus: $R = e^{-t / S}$.
  - Khi người dùng đánh giá kết quả ôn tập (`Again` = 1, `Hard` = 2, `Good` = 3, `Easy` = 4), hệ thống tính toán lại `stability` mới và đặt giá trị `nextReviewAt`.
