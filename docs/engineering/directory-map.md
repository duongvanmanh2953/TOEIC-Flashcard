# LetStuN AI Directory & File Map

> **Trạng thái**: Đã xác minh cấu trúc thực tế của Monorepo (Verified)  
> **Mục tiêu**: Giúp AI Coding Agents và Kỹ sư định vị chính xác vị trí mã nguồn cần đọc và sửa.

---

## 1. Cấu trúc Tổng thể Monorepo

```
TOEIC-Flashcard-1/
├── apps/                         # Các ứng dụng giao diện (Vite/React) & Backend chính (NestJS)
│   ├── admin/                    # Admin Portal Dashboard (Port 3200)
│   ├── api/                      # NestJS Core Backend (Port 4000)
│   ├── kid/                      # Kid Learning Game Portal (Port 3100)
│   ├── landing/                  # Landing Marketing Page (Port 3080)
│   ├── student/                  # Student Learning Portal độc lập (Port 3000)
│   └── web/                      # Web App chính tích hợp (Port 3000)
├── services/                     # Microservices đóng gói chạy Docker
│   ├── admin-api/                # Backend riêng cho Admin (Port 4200)
│   ├── app-api/                  # Backend riêng cho Student App (Port 4000)
│   ├── assets/                   # Nginx Static File Server phục vụ media/audio (Port 3300)
│   └── kid-api/                  # Backend riêng cho Kid App (Port 4100)
├── packages/                     # Thư viện dùng chung nội bộ
│   └── shared/                   # @letstun/shared: Types, Locales, Config
├── infra/                        # Cấu hình hạ tầng
│   └── cloudflared/              # Cloudflare Tunnel credentials & configuration
├── assets/                       # Thư mục chứa tài nguyên tĩnh (Audio pronunciation, images)
├── docs/                         # Tài liệu đặc tả và kiểm toán kỹ thuật
│   └── engineering/              # Bộ tài liệu kỹ thuật chuẩn hoá cho AI Agents
├── .agents/                      # Agent Customizations (Skills đã cài đặt)
│   └── skills/                   # code-review-expert, sleek-design-mobile-apps, sigma,...
├── docker-compose.yml            # Docker orchestration file (Postgres, Redis, 5 Apps, 4 Services)
├── package.json                  # Root package.json điều phối npm workspaces
└── skills-lock.json              # Khóa phiên bản các AI skills đã cài đặt
```

---

## 2. Chi tiết từng Không gian làm việc (Workspaces)

### 2.1. Backend API (`apps/api`)
- **Entry point**: `src/main.ts` (Khởi tạo NestJS application, Global ValidationPipe, Cookie Parser, Swagger `/api/docs`, CORS).
- **Module gốc**: `src/app.module.ts` (Đăng ký 20 feature modules, PrismaModule, CacheModule, WebSocketModule).
- **Core Database & Schema**:
  - `prisma/schema.prisma`: Định nghĩa 1763 dòng schema PostgreSQL, 50+ models (`User`, `Vocabulary`, `UserVocabulary`, `StudySession`, `ReviewEvent`, `UserDevice`, `UserSession`,...).
  - `src/prisma/prisma.service.ts`: PrismaClient wrapper lifecycle hook.
- **Bảo mật & Phân quyền**:
  - `src/modules/auth/auth.controller.ts`: Endpoints `/register`, `/login`, `/refresh`, `/logout`, `/me`, `/oauth`, `/forgot-password`.
  - `src/modules/auth/auth.service.ts`: Mã hóa mật khẩu (`bcrypt`), cấp phát JWT (Access/Refresh), Device Risk Engine.
  - `src/modules/auth/jwt.strategy.ts`: Passport JWT extraction từ Bearer header hoặc Cookie `token`.
  - `src/common/guards/jwt-auth.guard.ts`: Global authentication guard kết hợp decorator `@Public()`.
  - `src/common/guards/roles.guard.ts`: Role-based access control kết hợp decorator `@Roles(Role.ADMIN)`.
- **Hạt nhân học tập & Trí nhớ (Core Business)**:
  - `src/modules/vocabulary/memory-engine.service.ts`: Tính toán chỉ số Retrievability, Stability, Vocabulary X-Ray diagnostic.
  - `src/modules/vocabulary/vocabulary.service.ts`: CRUD từ vựng, từ đồng nghĩa/trái nghĩa, topic decks.
  - `src/modules/reviews/`: Xử lý sự kiện ôn tập, cập nhật thuật toán lặp lại ngắt quãng (SM-2/FSRS).

---

### 2.2. Frontend Web App (`apps/web`)
- **Entry point**: `src/main.tsx` và `src/App.tsx`.
- **Cấu hình Build**: `vite.config.ts` (Proxy `/api` -> `http://localhost:4000`, Rollup manualChunks chia nhỏ vendor Three.js, Firebase, Lucide, React).
- **Routing & Navigation**: `src/routes.tsx` hoặc `App.tsx` (Bọc bởi `BrowserRouter`, Route guards theo trạng thái đăng nhập).
- **Component Trọng yếu (`src/components/`)**:
  - `flashcard/LanguageFlashcard.tsx`: Thẻ học từ vựng 3D flip hiệu ứng, hiển thị phiên âm, phát âm thanh.
  - `common/SpeechButton.tsx`: Nút phát âm TTS tích hợp đa ngôn ngữ.
  - `language/LanguageBadge.tsx` & `CountryFlag.tsx`: Hiển thị quốc kỳ, mã CEFR và tên ngôn ngữ mục tiêu.
  - `letstun/VocabularyXRay.tsx`: Biểu đồ radar chẩn đoán năng lực từ vựng của học viên.
  - `admin/ui/AdminButton.tsx`: Component button chuẩn hóa của backoffice.
- **Quản lý Ngôn ngữ**:
  - `src/config/languages.ts`: Bảng đăng ký 15+ ngôn ngữ, hướng viết (LTR/RTL), bảng chữ cái (Latin, Hanzi, Kana, Hangul, Cyrillic, Arabic).

---

### 2.3. Shared Package (`packages/shared`)
- **Entry point**: `src/index.ts`
- **Mục đích**: Xuất khẩu kiểu dữ liệu `LanguageDefinition`, `CefrLevel`, `VocabStatus` để các ứng dụng `apps/web`, `apps/student`, `apps/kid`, `apps/admin` tái sử dụng, tránh sai lệch schema giữa các frontend.

---

### 2.4. Microservices Container (`services/`)
- `services/app-api`: Clone mã nguồn của `apps/api` đóng gói Docker cho cổng Student, chạy cổng 4000 với tiền tố Redis `app:`.
- `services/kid-api`: Microservice chuyên biệt cho cổng Kid Game, chạy cổng 4100 với tiền tố Redis `kid:`.
- `services/admin-api`: Microservice chuyên biệt cho Admin Portal, chạy cổng 4200 với tiền tố Redis `admin:`.
- `services/assets`: Container Nginx phục vụ tĩnh toàn bộ âm thanh và hình ảnh của từ vựng từ thư mục `assets/` qua cổng 3300.
