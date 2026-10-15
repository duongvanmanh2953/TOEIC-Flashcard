# AGENTS.md — Backend API Workspace (`apps/api`)

> **Phạm vi áp dụng**: Tất cả các thao tác trên mã nguồn backend API tại `apps/api/` và các microservices tương ứng tại `services/*-api`.

---

## 1. Tổng quan & Lệnh Thực thi (Commands)

- **Framework**: NestJS 10.3.0 + Prisma ORM 5.14.0 + PostgreSQL 16 + Redis 7
- **Chạy môi trường phát triển (Dev Watch)**:
  ```bash
  npm --workspace=apps/api run start:dev
  # hoặc từ thư mục apps/api: npm run start:dev
  ```
  Truy cập Swagger API Document tại: `http://localhost:4000/api/docs`.
- **Thao tác Cơ sở Dữ liệu Prisma**:
  ```bash
  # Sinh Prisma Client sau khi sửa schema.prisma:
  npm --workspace=apps/api run prisma:generate

  # Tạo và áp dụng Migration mới an toàn:
  npm --workspace=apps/api run prisma:migrate
  ```
- **Build Production**:
  ```bash
  npm --workspace=apps/api run build
  ```

---

## 2. Quy chuẩn Kỹ thuật & Bất biến Bảo mật (Backend Invariants)

### A. Quy tắc Xác thực & Phân quyền (Authentication & Authorization)
1. **Toàn bộ Endpoints mặc định được bảo vệ**: Mọi route phải qua `JwtAuthGuard` trừ khi được đánh dấu tường minh bằng decorator `@Public()`.
2. **Kiểm tra quyền hạn tại Tầng Dịch vụ (Object-Level Authorization)**:
   - Khi thao tác trên tài nguyên của người dùng (`UserVocabulary`, `StudySession`, `Note`), luôn lọc theo `userId` trích xuất từ `@CurrentUser('id')`, không bao giờ tin cậy `userId` truyền từ URL params hoặc request body.
3. **Cảnh báo Lỗ hổng OAuth (SEC-001)**:
   - Tuyệt đối không được cấp phát token đăng nhập chỉ dựa vào email gửi lên từ request body mà chưa kiểm tra tính hợp lệ của `idToken` từ Google/Facebook Identity Server.
4. **Bảo tồn Giới hạn Thiết bị (Device Limit Invariant)**:
   - Mỗi người dùng chỉ được phép duy trì tối đa **3 thiết bị hoạt động đồng thời**. Khi đăng nhập mới vượt quá hạn ngạch, bắt buộc phải qua `DeviceSecurityService` để trả về HTTP 403 `DEVICE_LIMIT_EXCEEDED`.

### B. Quy chuẩn Cơ sở Dữ liệu & Transaction (Prisma Guidelines)
1. **Sử dụng Prisma Transaction cho các Thao tác Liên hoàn**:
   - Khi ghi nhận kết quả học tập (`ReviewEvent`), cập nhật `UserVocabulary`, tăng `streak`, và cộng `XP`, bắt buộc phải gom vào `$prisma.$transaction([...])` để đảm bảo tính toàn vẹn dữ liệu.
2. **Tránh N+1 Queries**:
   - Tận dụng `include` và `select` có chọn lọc của Prisma. Không duyệt vòng lặp `for` để gọi `this.prisma.xyz.findUnique()` từng phần tử.
3. **Tuyệt đối không chạy lệnh phá hủy**:
   - Cấm chạy `npx prisma migrate reset` hoặc `DROP TABLE` trong bất kỳ tình huống nào.

---

## 3. Các Tệp Tin Trọng Yếu Cần Đọc Trước Khi Sửa
- `prisma/schema.prisma`: Schema cơ sở dữ liệu gốc (1763 dòng).
- `src/modules/auth/auth.service.ts`: Xử lý logic đăng nhập, tạo JWT, phân quyền thiết bị.
- `src/modules/auth/jwt.strategy.ts`: Cơ chế trích xuất token từ Bearer / Cookie.
- `src/modules/vocabulary/memory-engine.service.ts`: Thuật toán tính toán trí nhớ và chẩn đoán X-Ray.
