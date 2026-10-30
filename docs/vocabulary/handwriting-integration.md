# Tích Hợp Bảng Vẽ Vào Phiên Ôn Từ Vựng (Handwriting Integration)

> **VocabFlow Handwriting Recognition & Stroke Engine**  
> Phiên bản: 2.0 — Cập nhật: 10/2026

---

## 1. Nguyên Tắc Thiết Kế

- **Không tạo module hoặc tab riêng**: Handwriting không phải là một khu vực độc lập, mà là một phương thức luyện từ vựng trong `VocabularyPractice` (`mode: 'handwriting'`).
- **Phân đoạn đa ký tự (Multi-Character Word Segmentation)**: Từ vựng có thể gồm một hoặc nhiều ký tự (ví dụ: 学, 学生, 今日は, 学习汉语, 안녕하세요). Hệ thống phân tách thành mảng writing units, hiển thị chỉ mục hiện tại, cho phép chuyển đổi linh hoạt và tổng hợp điểm cho toàn bộ từ.
- **Không gợi ý tự động (No intrusive hints)**: Không hiện pop-up làm phiền, người dùng chủ động bật nét mẫu hoặc phát lại thứ tự nét nếu cần.

---

## 2. Bố Cục Vùng Vẽ & Thanh Công Cụ (Bottom Toolbar)

Toolbar được đặt gọn gàng ngay dưới Canvas (320x320 hoặc 360x360), chia thành 3 nhóm chức năng:
1. **Nhóm Thao Tác (Action Group)**:
   - `Undo` (Hoàn tác nét vừa vẽ) — Phím tắt: `Ctrl + Z` / `Cmd + Z`.
   - `Redo` (Làm lại) — Phím tắt: `Ctrl + Shift + Z` / `Cmd + Shift + Z` / `Ctrl + Y`.
   - `Clear` (Xóa canvas) — Phím tắt: `Delete` / `Backspace`.
   - `Reset` (Làm lại toàn bộ từ).
2. **Nhóm Hỗ Trợ Nét (Guide Group)**:
   - Hiện/ẩn nét mẫu mờ (Ghost guide).
   - Thanh trượt độ mờ nét mẫu (10% - 70%).
   - Hiện/ẩn lưới Tian-zi-ge (Cross & Diagonal guidelines).
   - Nút phát lại thứ tự nét chuẩn (Replay stroke animation).
3. **Nhóm Hiển Thị (Display Group)**:
   - Chế độ tập trung (Focus mode).
   - Thanh chọn nhanh writing unit đối với từ nhiều ký tự (`['今', '日', 'は']`).

---

## 3. Thuật Toán Nhận Diện & Đánh Giá Nét Thật (Vector Stroke Evaluation)

- **Vector Cosine Similarity**: So sánh hướng vector trung bình giữa nét người dùng vẽ ($\vec{u}$) và nét chuẩn tham chiếu ($\vec{v}$).
- **Sai số điểm đầu/cuối (Tolerance)**: Đo khoảng cách Euclidean giữa điểm bắt đầu và kết thúc của nét vẽ so với bounding box chuẩn.
- **Tự động Căn Chỉnh Nét (Smooth Morph Animation)**:
  - Khi người dùng vẽ đúng nét (Confidence $\ge 75\%$, góc vector tương thích), hệ thống kích hoạt hiệu ứng Morphing mượt mà trong 220ms thông qua `requestAnimationFrame` và hàm nội suy Hermite cubic.
  - **Bất biến cốt lõi**: Điểm số thành thạo (Mastery Score) được tính toán và lưu lại từ **nét vẽ gốc trước khi morph**. Không bao giờ lấy nét đã qua tự căn chỉnh để chấm điểm.
