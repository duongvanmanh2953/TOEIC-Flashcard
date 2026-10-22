# LetStuN AI End-to-End Business Flows

> **Trạng thái**: Đã trace chi tiết từ UI Component đến Database Transaction (Verified)

---

## 1. Luồng 1: Đăng nhập & Xác thực Thiết bị (Authentication & Device Risk Flow)

```mermaid
sequenceDiagram
    autonumber
    actor User as Học viên
    participant UI as ContextualLoginModal (apps/web)
    participant Ctrl as AuthController (POST /auth/login)
    participant AuthSvc as AuthService
    participant DevSvc as DeviceSecurityService
    participant DB as PostgreSQL (Prisma)
    participant Redis as Redis Cache

    User->>UI: Nhập Email + Password
    UI->>UI: Thu thập Device ID (x-device-id), Browser, OS
    UI->>Ctrl: POST /api/v1/auth/login {email, password, deviceId, ...}
    Ctrl->>AuthSvc: login(enrichedDto)
    AuthSvc->>DB: findUnique({ where: { email } })
    DB-->>AuthSvc: Trả về User & passwordHash
    AuthSvc->>AuthSvc: bcrypt.compare(password, passwordHash)
    alt Mật khẩu không khớp
        AuthSvc-->>Ctrl: 401 Unauthorized ('Invalid email or password')
        Ctrl-->>UI: Hiển thị lỗi đăng nhập
    else Mật khẩu hợp lệ
        AuthSvc->>AuthSvc: generateTokens(userId, email, role)
        AuthSvc->>DevSvc: registerOrValidateDevice(userId, role, meta, refreshToken)
        DevSvc->>DB: Đếm số thiết bị ACTIVE của user
        alt Số thiết bị > 3 (Vượt quá giới hạn)
            DevSvc->>DB: Ghi nhận DeviceRiskEvent (PENDING)
            DevSvc-->>AuthSvc: allowed: false, code: DEVICE_LIMIT_EXCEEDED
            AuthSvc-->>Ctrl: 403 Forbidden {code, limit: 3, activeCount}
            Ctrl-->>UI: Hiển thị Modal Quản lý / Hủy thiết bị cũ
        else Thiết bị hợp lệ (<= 3 thiết bị)
            DevSvc->>DB: Upsert UserDevice & Tạo UserSession (Lưu hash SHA-256)
            AuthSvc->>DB: Cập nhật lastActiveAt
            AuthSvc-->>Ctrl: { user, accessToken, refreshToken }
            Ctrl->>Ctrl: setAuthCookies(res, accessToken, refreshToken)
            Ctrl-->>UI: 200 OK + Payload người dùng & Session Cookie
            UI->>UI: Điều hướng vào Dashboard
        end
    end
```

---

## 2. Luồng 2: Phiên Học Flashcard & Cập nhật Trí nhớ (Spaced Repetition Review Flow)

```mermaid
sequenceDiagram
    autonumber
    actor User as Học viên
    participant Flashcard as LanguageFlashcard.tsx
    participant StudyCtrl as ReviewsController / StudySessionController
    participant Engine as MemoryEngineService
    participant DB as PostgreSQL (UserVocabulary, ReviewEvent)

    User->>Flashcard: Xem mặt trước từ vựng (Từ, Phiên âm, Audio)
    User->>Flashcard: Click Lật thẻ (Xem nghĩa, ví dụ câu, CEFR)
    User->>Flashcard: Chọn mức độ nhớ (1: Again, 2: Hard, 3: Good, 4: Easy)
    Flashcard->>StudyCtrl: POST /api/v1/study-sessions/:id/review {vocabId, rating, timeSpentMs}
    StudyCtrl->>Engine: calculateNextReview(userId, vocabId, rating)
    Engine->>DB: Lấy UserVocabulary (stability cũ, repetitionCount, streak)
    Engine->>Engine: Thuật toán FSRS/SM-2:<br/>1. Tính Retrievability R = exp(-delta_t / S)<br/>2. Cập nhật Stability S' = S * (1 + factor * rating)<br/>3. Tính Interval: I = S' * ln(desired_retention) / ln(0.9)<br/>4. Xác định nextReviewAt = now() + I days
    Engine->>DB: Transaction: Cập nhật UserVocabulary & Thêm ReviewEvent
    Engine->>DB: Cập nhật UserStreak & cộng XP vào UserXP
    DB-->>Engine: Xác nhận ghi thành công
    Engine-->>StudyCtrl: { nextReviewAt, stability, currentStreak, xpEarned }
    StudyCtrl-->>Flashcard: 200 OK (Chuyển sang thẻ từ tiếp theo)
```

---

## 3. Luồng 3: Trích xuất Từ vựng Thông minh (Vocabulary Capture Flow)

1. **Trigger**: Người dùng tải lên tệp tài liệu PDF, DOCX hoặc dán đoạn văn bản vào `VocabularyCaptureModal.tsx`.
2. **Parsing**:
   - Tệp DOCX được phân tích bởi `mammoth` tại trình duyệt hoặc backend.
   - Tệp PDF được phân tích bởi thư viện `pdfjs-dist`.
3. **API Call**: Gửi `POST /api/v1/vocabulary/capture` với danh sách từ vựng trích xuất.
4. **Backend Processing**: `MemoryEngineService` thực hiện chuẩn hóa từ (`normalizedWord`), truy vấn đối chiếu với từ điển `Vocabulary` trong database.
5. **Enrichment**: Lấy cấp độ CEFR, các quan hệ từ vựng (Synonym, Collocation, Example).
6. **Persistence**: Ghi vào bảng `VocabularyCapture` và liên kết `UserVocabulary` ở trạng thái ban đầu `NEW` / `LEARNING`.
