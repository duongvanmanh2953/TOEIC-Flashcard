# Hệ Thống Luyện Tập Từ Vựng (Vocabulary Practice Architecture)

> **VocabFlow Learning Session Engine**  
> Phiên bản: 2.0 — Cập nhật: 10/2026

---

## 1. Kiến Trúc Tập Trung

Toàn bộ các chế độ luyện từ vựng của VocabFlow được quy tụ dưới một phễu luyện tập duy nhất (`ReviewSessionPage.tsx`):
- **Recognition**: Nhận diện mặt chữ, thẻ flashcard lật 3D.
- **Typing**: Gõ từ vựng qua bàn phím với thuật toán so khớp mờ Levenshtein distance ($\le 2$ ký tự).
- **Listening**: Luyện nghe phát âm chuẩn bản ngữ (Web Speech API / Cloud TTS) kết hợp chọn nghĩa / gõ chính tả.
- **Multiple Choice**: Trắc nghiệm 4 lựa chọn ngữ cảnh.
- **Context Practice**: Điền từ vào chỗ trống trong đoạn văn thực tế.
- **Handwriting Practice**: Vẽ nét chữ trực tiếp trên canvas (chỉ xuất hiện đối với ngôn ngữ hỗ trợ nét viết như Tiếng Nhật, Tiếng Hàn, Tiếng Trung).

---

## 2. Quản Lý Session Luyện Tập (Multi-word Learning Session)

Phiên luyện tập được quản lý tập trung với trạng thái:
- `sessionId`: Định danh phiên làm việc.
- `vocabularyItems`: Danh sách từ vựng cần ôn (ví dụ 20 từ).
- `currentIndex`: Chỉ số từ hiện tại đang tương tác.
- `completedCount`, `correctCount`, `incorrectCount`, `skippedCount`.
- **Cơ chế chống gian lận & Refresh Safety**: Trạng thái phiên được duy trì qua storage; khi người dùng refresh trang, phiên tiếp tục tại từ hiện tại mà không bị ghi nhận kết quả trùng lặp.
- **Chuyển từ tự động**: Khi hoàn thành một từ (dù là gõ, chọn hay viết nét), kết quả được lưu vào mastery score và chuyển ngay sang từ tiếp theo trong session.
