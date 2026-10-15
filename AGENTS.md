# AGENTS.md — VocabFlow AI Engineering & Orchestration Protocol

> **Quy chuẩn điều phối trung tâm cho AI Coding Agents (Antigravity, Gemini CLI, Claude Code)**  
> **Repository**: `VocabFlow AI` (Monorepo TOEIC & Spaced Repetition Platform)  
> **Phiên bản**: 2.0.0 — Cập nhật lần cuối: 15/10/2026

---

## 1. Tổng quan Dự án (Project Overview — Verified)

VocabFlow AI là nền tảng học từ vựng tiếng Anh và đa ngôn ngữ chuyên sâu tích hợp thuật toán Spaced Repetition (FSRS/SM-2), Flashcard 3D, hệ thống bảo mật đa thiết bị và game giáo dục cho trẻ em.

- **Mô hình kiến trúc**: Monorepo quản lý bằng `npm workspaces` (`apps/*`, `services/*`, `packages/*`).
- **Frontend Stack**: React 18, Vite 5, Tailwind CSS 3.4 (`apps/web`, `apps/student`, `apps/kid`, `apps/admin`, `apps/landing`).
- **Backend Stack**: NestJS 10, Prisma ORM 5.14, PostgreSQL 16, Redis 7 (`apps/api`, `services/*-api`).
- **Shared Code**: `@vocabflow/shared` tại `packages/shared`.

---

## 2. Các Lệnh Thực thi Chuẩn (Verified Commands)

```bash
# 1. Khởi động toàn bộ hệ thống bằng Docker (Khuyến nghị):
docker compose up -d

# 2. Khởi chạy Development cục bộ:
npm run dev                  # Chạy đồng thời toàn bộ frontend & backend
npm run dev:api              # Chạy riêng Backend NestJS (:4000)
npm run dev:web              # Chạy riêng Frontend Web App (:3000)

# 3. Thao tác Cơ sở dữ liệu Prisma:
npm run prisma:generate      # Sinh mã Prisma Client
npm run prisma:migrate       # Chạy migration an toàn

# 4. Kiểm thử tự động (Automated Testing):
npx vitest run               # Chạy Unit Tests Frontend (apps/web)
```

---

## 3. Quy trình 4 Bước Bắt buộc khi Thay đổi Mã nguồn

1. **Khảo sát trước khi sửa (Investigation First)**:
   - Luôn đọc file liên quan bằng `view_file` trước khi sửa. Không giả định cấu trúc thư mục hoặc tên biến.
   - Kiểm tra `git status`. Tuyệt đối không xóa hoặc ghi đè các thay đổi chưa commit của người dùng.
2. **Tuân thủ ranh giới Module (Boundary Rules)**:
   - Frontend (`apps/web`, `apps/student`) tuyệt đối không kết nối trực tiếp database.
   - Sửa schema database phải cập nhật `apps/api/prisma/schema.prisma` rồi chạy `prisma:generate`.
   - Các kiểu dữ liệu dùng chung phải đặt tại `packages/shared/src/index.ts`.
3. **Sửa đổi Tối thiểu & Bảo toàn Chức năng (Minimal Safe Diff)**:
   - Chỉ chỉnh sửa đúng phạm vi task yêu cầu. Giữ nguyên toàn bộ comments và tính năng hiện hữu.
4. **Kiểm tra An toàn & Xác minh (Verification Gate)**:
   - Kích hoạt kỹ năng `code-review-expert` để kiểm toán diff trước khi bàn giao.
   - Chạy test kiểm chứng và báo cáo trung thực kết quả thực tế.

---

## 4. Bất biến Bảo mật Bắt buộc (Security Invariants)

- 🔒 **SEC-001 (Critical Invariant)**: Tuyệt đối không cấp phát JWT trong endpoint OAuth (`/auth/oauth`) mà không xác thực `idToken` hợp lệ từ nhà cung cấp danh tính (Google/Facebook).
- 🔒 **SEC-002 (Master Password Invariant)**: Không sử dụng mật khẩu fallback cứng trong các script vận hành bảo trì.
- 🔒 **Device Limit Invariant**: Duy trì nghiêm ngặt giới hạn tối đa 3 thiết bị hoạt động đồng thời cho mỗi tài khoản học viên thông qua `DeviceSecurityService`.
- 🔒 **Secret Hygiene**: Cấm đưa khóa bí mật, JWT secret, mật khẩu DB, hay nội dung `.env` vào log, commit, hoặc file tài liệu.

---

## 5. Bản đồ Kích hoạt Kỹ năng (Skill Routing)

| Mục tiêu nhiệm vụ | Kỹ năng được gọi | Đường dẫn hướng dẫn |
| :--- | :--- | :--- |
| **Review Code & Phát hiện Lỗi/SOLID** | `code-review-expert` | [code-review-expert](file:///c:/Users/manhd/Downloads/TOEIC-Flashcard-1/.agents/skills/code-review-expert/SKILL.md) |
| **Tối ưu Giao diện Mobile & Touch Layout** | `sleek-design-mobile-apps` | [sleek-design-mobile-apps](file:///c:/Users/manhd/Downloads/TOEIC-Flashcard-1/.agents/skills/sleek-design-mobile-apps/SKILL.md) |
| **Hướng dẫn & Giải thích Thuật toán** | `sigma` | [sigma](file:///c:/Users/manhd/Downloads/TOEIC-Flashcard-1/.agents/skills/sigma/SKILL.md) |
| **Tổng hợp Tri thức & Đọc Tài liệu** | `wiki-ingest` / `book-study` | [wiki-ingest](file:///c:/Users/manhd/Downloads/TOEIC-Flashcard-1/.agents/skills/wiki-ingest/SKILL.md) |
| **Tối ưu Hiệu năng React** | Quy chuẩn Vercel React | Tham khảo chi tiết trong [apps/web/AGENTS.md](file:///c:/Users/manhd/Downloads/TOEIC-Flashcard-1/apps/web/AGENTS.md) |

---

## 6. Danh mục Tài liệu Kỹ thuật Chi tiết (Documentation References)

Các báo cáo kiểm toán kỹ thuật toàn diện được lưu trữ tại `docs/engineering/`:

1. 🏛️ **Kiến trúc Hệ thống**: [docs/engineering/architecture.md](file:///c:/Users/manhd/Downloads/TOEIC-Flashcard-1/docs/engineering/architecture.md)
2. 🗺️ **Bản đồ Thư mục & Mã nguồn**: [docs/engineering/directory-map.md](file:///c:/Users/manhd/Downloads/TOEIC-Flashcard-1/docs/engineering/directory-map.md)
3. 📋 **Danh mục Tính năng Đã Xác minh**: [docs/engineering/feature-inventory.md](file:///c:/Users/manhd/Downloads/TOEIC-Flashcard-1/docs/engineering/feature-inventory.md)
4. 🔄 **Luồng Nghiệp vụ End-to-End**: [docs/engineering/business-flows.md](file:///c:/Users/manhd/Downloads/TOEIC-Flashcard-1/docs/engineering/business-flows.md)
5. 🛡️ **Báo cáo Kiểm toán Bảo mật (STRIDE/OWASP)**: [docs/engineering/security-review.md](file:///c:/Users/manhd/Downloads/TOEIC-Flashcard-1/docs/engineering/security-review.md)
6. ⚡ **Báo cáo Hiệu năng & Tối ưu CSDL**: [docs/engineering/performance-review.md](file:///c:/Users/manhd/Downloads/TOEIC-Flashcard-1/docs/engineering/performance-review.md)
7. 🧪 **Chiến lược Kiểm thử Tự động**: [docs/engineering/testing-strategy.md](file:///c:/Users/manhd/Downloads/TOEIC-Flashcard-1/docs/engineering/testing-strategy.md)
8. ⚠️ **Sổ theo dõi Nợ Kỹ thuật (Technical Debt)**: [docs/engineering/technical-debt.md](file:///c:/Users/manhd/Downloads/TOEIC-Flashcard-1/docs/engineering/technical-debt.md)
9. 🤖 **Quy chuẩn Điều phối Agent**: [docs/engineering/agent-workflows.md](file:///c:/Users/manhd/Downloads/TOEIC-Flashcard-1/docs/engineering/agent-workflows.md)
10. 🌐 **Quy chuẩn Không gian làm việc Frontend**: [apps/web/AGENTS.md](file:///c:/Users/manhd/Downloads/TOEIC-Flashcard-1/apps/web/AGENTS.md)
11. ⚙️ **Quy chuẩn Không gian làm việc Backend**: [apps/api/AGENTS.md](file:///c:/Users/manhd/Downloads/TOEIC-Flashcard-1/apps/api/AGENTS.md)

---

## 7. Các Hành vi Nghiêm cấm Khi Chưa có Phê duyệt Cụ thể

- ❌ Cấm thực thi `prisma migrate reset` hoặc các câu lệnh SQL xóa dữ liệu (`DROP`, `TRUNCATE`).
- ❌ Cấm tự ý đổi framework (Vite -> Next.js, NestJS -> Express thuần, PostgreSQL -> MongoDB).
- ❌ Cấm thay đổi cấu trúc API contract mà không cập nhật đồng bộ các ứng dụng frontend.
- ❌ Cấm xóa hoặc ghi đè mã nguồn do người dùng đang sửa đổi dở dang.
