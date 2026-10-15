# VocabFlow AI Automated Testing Strategy

> **Mục tiêu**: Xây dựng hàng rào kiểm thử tự động đa tầng, đảm bảo không hồi quy (Zero Regression) cho các luồng nghiệp vụ lõi.

---

## 1. Kim tự tháp Kiểm thử (Testing Pyramid)

```
       /\
      /  \     E2E Tests (Playwright)
     /----\    - Luồng Đăng nhập & Học từ vựng Flashcard
    /      \   Integration & API Tests (NestJS Test + Supertest)
   /--------\  - Auth Service, Memory Engine, Prisma Transactions
  /          \ Unit & Component Tests (Vitest + Testing Library)
 /------------\ - UI Components, Helpers, Spaced Repetition Math
```

---

## 2. Chiến lược từng Phân tầng

### 2.1. Frontend Testing (`apps/web` & `apps/student`)
- **Công cụ**: `Vitest` + `@testing-library/react` + `jsdom`.
- **Cấu hình**: `apps/web/vite.config.ts` tích hợp setup file `src/test/setup.ts` (mocking Web Speech API, IntersectionObserver, Audio).
- **Phạm vi bắt buộc**:
  - Các UI components có tương tác phức tạp: `LanguageFlashcard.tsx`, `SpeechButton.tsx`, `AdminButton.tsx`.
  - Logic phân loại và tính toán ngôn ngữ: `src/config/languages.ts`.

### 2.2. Backend Testing (`apps/api`)
- **Công cụ**: `@nestjs/testing`, `jest` / `vitest`, `supertest`.
- **Nguyên tắc Mock**:
  - Không kết nối database trực tiếp trong unit tests.
  - Sử dụng Mock Provider cho `PrismaService` mô phỏng các phương thức `findUnique`, `findMany`, `create`, `update`.
- **Phạm vi bắt buộc**:
  - `AuthService`: Kiểm tra hash bcrypt, cấp phát token JWT, logic từ chối khi vượt quá 3 thiết bị.
  - `MemoryEngineService`: Kiểm tra tính toán công thức Spaced Repetition (FSRS/SM-2) không bị tràn số (NaN / Infinity).

### 2.3. End-to-End Testing (`e2e/`)
- **Công cụ**: `@playwright/test`.
- **Môi trường**: Chạy với Chromium / Firefox headless.
- **Kịch bản Trọng yếu**:
  1. **Authentication Flow**: Đăng ký học viên -> Nhập OTP / Xác thực -> Đăng nhập thành công -> Lưu session cookie.
  2. **Study Flashcard Flow**: Vào bộ thẻ "600 Essential Words for TOEIC" -> Lật thẻ mặt trước/sau -> Chọn nút "Good" -> Thanh tiến độ tăng.
