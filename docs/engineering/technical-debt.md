# LetStuN AI Technical Debt & Architecture Refactoring Log

> **Mục tiêu**: Liệt kê các khoản nợ kỹ thuật (Technical Debt) đã phát hiện trong quá trình khảo sát thực tế, phân loại mức độ rủi ro và giải pháp khắc phục.

---

## 1. Danh mục Nợ Kỹ thuật (Technical Debt Register)

| ID | Vấn đề kỹ thuật (Debt Item) | Vị trí / Tệp tin | Mức độ rủi ro | Tác động hệ thống | Phương án khắc phục đề xuất |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DEBT-01** | **Trùng lặp mã nguồn giữa `apps/api` và `services/*-api`** | `apps/api/src`<br/>`services/app-api/src`<br/>`services/admin-api/src`<br/>`services/kid-api/src` | **CAO** | Sửa bug ở một nơi nhưng quên sửa ở các microservices khác dẫn tới phân mảnh logic và rủi ro bảo mật | Hợp nhất mã nguồn backend thành 1 package NestJS duy nhất, các microservices chỉ là các Docker entry point nạp configuration/module khác nhau |
| **DEBT-02** | **Trùng lặp giữa `apps/web` và `apps/student`** | `apps/web`<br/>`apps/student` | **TRUNG BÌNH** | Gây lãng phí dung lượng lưu trữ và thời gian build Docker; dễ dẫn tới lệch giao diện | Xác định `apps/student` hay `apps/web` là nguồn chuẩn duy nhất, loại bỏ hoặc liên kết symlink ứng dụng còn lại |
| **DEBT-03** | **Thiếu composite index cho truy vấn học tập** | `apps/api/prisma/schema.prisma` (`UserVocabulary`) | **TRUNG BÌNH** | Làm chậm tốc độ truy vấn `smart-review` khi tập dữ liệu người học tăng lên hàng trăm ngàn dòng | Thêm migration: `@@index([userId, nextReviewAt])` |
| **DEBT-04** | **Nhiều file audit rải rác chưa chuẩn hóa trong `docs/`** | `docs/*.md` (24 files) | **THẤP** | Khiến AI Agents đọc thông tin mâu thuẫn, khó nắm bắt quy chuẩn hệ thống hiện tại | Hợp nhất các audit cũ vào bộ `docs/engineering/` chuẩn hóa |
| **DEBT-05** | **Xung đột phiên bản Vitest / Vite trong npm workspaces** | `apps/web/package.json` | **TRUNG BÌNH** | Gây lỗi khi cài đặt công cụ kiểm thử tự động trực tiếp bằng lệnh `npm install` | Khóa phiên bản `vitest@^1.6.0` tương thích chuẩn với `vite@5.x` |
