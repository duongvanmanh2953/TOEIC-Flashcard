# AGENTS.md — Frontend Web Workspace (`apps/web`)

> **Phạm vi áp dụng**: Tất cả các thao tác trên mã nguồn giao diện học viên tại `apps/web/`.

---

## 1. Tổng quan & Lệnh Thực thi (Commands)

- **Framework**: React 18.2.0 + Vite 5.1.6 + Tailwind CSS 3.4.3
- **Chạy môi trường phát triển (Dev Server)**:
  ```bash
  npm --workspace=apps/web run dev
  # hoặc từ thư mục apps/web: npm run dev
  ```
  Truy cập tại: `http://localhost:3000` (đã cấu hình proxy `/api` sang `http://localhost:4000`).
- **Build Production**:
  ```bash
  npm --workspace=apps/web run build
  ```
- **Kiểm thử Vitest**:
  ```bash
  npx vitest run
  ```

---

## 2. Quy chuẩn Kỹ thuật Bắt buộc (Frontend Invariants)

### A. Tối ưu Hiệu năng React (Vercel React Best Practices)
1. **Không tạo object/function tĩnh trong render loop**:
   - Trích xuất các class names tĩnh, style hằng số ra ngoài component lifecycle.
   - Bọc các hàm callback truyền xuống component con bằng `useCallback`.
2. **Memoization có chọn lọc**:
   - Bọc `React.memo` cho các component lá (Leaf components) hoặc các item trong danh sách dài (`Flashcard`, `TableRow`, `Button`).
3. **Lazy Loading cho các gói thư viện nặng**:
   - Thư viện `three`, `pdfjs-dist`, `mammoth`, `xlsx` bắt buộc phải được import động (`import(...)`) hoặc tải qua `React.lazy()` để tránh phình bundle chính.
4. **Hỗ trợ Forwarding Ref**:
   - Mọi UI primitive component (Button, Input, Select, Dropdown) phải hỗ trợ `React.forwardRef` và kế thừa đầy đủ HTML props tương ứng.

### B. Thiết kế UI/UX & Khả năng Tiếp cận (Accessibility & Touch Targets)
1. **Touch Target**: Mọi phần tử có thể click trên mobile phải đạt kích thước tối thiểu **44x44px** (theo chuẩn WCAG 2.5.5).
2. **Tương phản Màu sắc**: Text phải đạt tỷ lệ tương phản tối thiểu **4.5:1** so với nền (WCAG AA). Tuyệt đối không dùng chữ trắng trên nền xám/xanh nhạt.
3. **Bàn phím & Focus Ring**: Giữ nguyên hoặc tùy biến class `focus-visible:ring-2 focus-visible:ring-offset-2`. Không được triệt tiêu outline mà không có style thay thế.

---

## 3. Các Tệp Tin Trọng Yếu Cần Đọc Trước Khi Sửa
- `src/config/languages.ts`: Bảng cấu hình toàn bộ ngôn ngữ hệ thống.
- `src/components/flashcard/LanguageFlashcard.tsx`: Logic thẻ học từ vựng cốt lõi.
- `src/components/common/SpeechButton.tsx`: Logic phát âm thanh TTS.
- `src/test/setup.ts`: File mock môi trường DOM cho Vitest.
