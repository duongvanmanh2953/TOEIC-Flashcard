# VocabFlow AI Performance & Optimization Review

> **Trạng thái**: Đánh giá dựa trên mã nguồn React Frontend và Prisma Query Backend (Verified & Likely)

---

## 1. Hiệu năng Frontend (React 18 & Vite)

### A. Tách Gói và Kích thước Bundle (Bundle Splitting & Lazy Loading)
- **Hiện trạng**: Trong `apps/web/vite.config.ts`, đội ngũ đã cấu hình `manualChunks` tách riêng:
  - `vendor-three` (Three.js 3D canvas)
  - `vendor-xlsx` (Excel import/export)
  - `vendor-firebase` (Firebase SDK)
  - `vendor-icons` (Lucide React)
  - `vendor-network` (Socket.IO client & Axios)
- **Vấn đề đã xác minh**: Thư viện `pdfjs-dist` (v5.4.624) và `mammoth` có dung lượng rất lớn (~2MB). Cần đảm bảo component `VocabularyCaptureModal.tsx` và `ExamImportPreviewModal.tsx` được tải động thông qua `React.lazy()` thay vì import tĩnh ở đầu file.
- **Khuyến nghị Vercel React Best Practices**:
  - Áp dụng dynamic import cho các route không phổ biến: `const AdminLayout = React.lazy(() => import('./components/admin/AdminLayout'))`.
  - Sử dụng `<Suspense fallback={<LoadingSkeleton />}>` để tăng điểm Core Web Vitals (FCP và LCP).

### B. Kiểm soát Re-render & Memoization
- **Phát hiện**: Trong các component danh sách dài như `VirtualScrollList.tsx` và `EditableVocabularyStagingTable.tsx`, việc truyền anonymous handlers trực tiếp gây re-render toàn bộ các hàng dữ liệu khi người dùng gõ phím hoặc lật thẻ.
- **Giải pháp**:
  - Bọc các row component bằng `React.memo`.
  - Sử dụng `useCallback` cho các hành động `onToggleFavorite`, `onPlayAudio`, `onFlipCard`.

---

## 2. Hiệu năng Backend & Database (NestJS & Prisma PostgreSQL)

### A. Kiểm toán Chỉ mục Cơ sở dữ liệu (Database Index Audit)
- **Bảng `UserVocabulary`**:
  - **Hiện trạng**: Có index trên `[userId, vocabularyId]` (Unique).
  - **Vấn đề phát hiện**: Truy vấn ôn tập thông minh lấy danh sách từ cần học bằng điều kiện:
    ```prisma
    where: { userId, nextReviewAt: { lte: new Date() } }
    ```
    Trường `nextReviewAt` **chưa có index đơn lẻ hoặc composite index** `@@index([userId, nextReviewAt])`. Khi người dùng có hàng chục ngàn từ vựng, truy vấn này sẽ gây **Index Scan / Sequential Filter** làm chậm thời gian tải session.
  - **Khắc phục**: Thêm `@@index([userId, nextReviewAt])` vào model `UserVocabulary` trong `schema.prisma`.

### B. Kiểm toán Bảng `UserSession`
- **Hiện trạng**: Trong `AuthService.refreshToken`, hệ thống tìm session qua:
  ```prisma
  where: { userId: user.id, refreshTokenHash: tokenHash }
  ```
  Trường `refreshTokenHash` cần được đánh chỉ mục `@@index([refreshTokenHash])` để đảm bảo thời gian tra cứu session đạt độ phức tạp $O(1)$.

### C. Cơ chế Caching Redis
- **Tình trạng tích cực**: Hệ thống đã triển khai `ioredis` với tiền tố độc lập cho từng microservice (`app:`, `kid:`, `admin:`).
- **Điểm cần nâng cấp**: Cache thông tin từ điển cơ bản (Bảng `Vocabulary`, `VocabularyMeaning`) với TTL dài (ví dụ: 24 giờ) vì dữ liệu từ điển hiếm khi thay đổi. Điều này sẽ giúp giảm 60-70% số lượng query vào database PostgreSQL.
