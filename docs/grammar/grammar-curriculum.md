# Khung Chương Trình Ngữ Pháp Đa Ngôn Ngữ (Grammar Curriculum)

> **VocabFlow CEFR Multilingual Grammar System**  
> Phiên bản: 2.0 — Cập nhật: 10/2026

---

## 1. Kiến Trúc Không Gian Ngữ Pháp

- Toàn bộ danh mục ngữ pháp (`GrammarCategory`) được liên kết với `languageId`.
- Ngữ pháp Tiếng Anh hoàn thiện từ cấp độ **A1 đến C2** với hơn 150 chủ đề có cấu trúc chuẩn mực:
  - **A1 — Beginner**: 30 chủ đề (Đại từ nhân xưng, Thì hiện tại đơn, Hiện tại tiếp diễn, Mạo từ a/an/the, Danh từ đếm được/không đếm được, There is/are, Câu hỏi Wh-, Tính từ so sánh hơn/nhất, Can/Can't, V-ing...).
  - **A2 — Elementary**: 30 chủ đề (Quá khứ đơn, Quá khứ tiếp diễn, Tương lai đơn/Be going to, Hiện tại hoàn thành, Câu điều kiện loại 0 & 1, Động từ khuyết thiếu, Mệnh đề quan hệ cơ bản...).
  - **B1 — Intermediate**: 36 chủ đề (Hiện tại hoàn thành tiếp diễn, Quá khứ hoàn thành, Tương lai tiếp diễn/hoàn thành, Câu điều kiện loại 2 & 3, Câu bị động nâng cao, Câu tường thuật, Used to / Get used to, Mệnh đề phân từ...).
  - **B2 — Upper Intermediate**: 32 chủ đề (Câu điều kiện hỗn hợp, Đảo ngữ sau trạng từ phủ định, Câu chẻ Cleft sentences, Bị động thể truyền khiến, Thể giả định, Noun phrases, Danh từ hóa...).
  - **C1 — Advanced**: 24 chủ đề (Đảo ngữ nâng cao, Fronting, Ngữ thức và thể văn bản học thuật/chuyên nghiệp, Mệnh đề danh ngữ phức hợp, Cấu trúc quan hệ phức hợp...).
  - **C2 — Mastery**: 16 chủ đề (Sắc thái thời-thể-thức tinh tế, Ngữ pháp tu từ và phong cách, Tinh giản và thế ngữ trong văn học, Phân tích lỗi ngữ pháp bản ngữ tinh vi...).
- **Không fallback sang tiếng Anh**: Các không gian Tiếng Nhật, Tiếng Hàn, Tiếng Trung sở hữu danh mục ngữ pháp riêng biệt (조사/어미, 助詞/敬語/文型, 量词/把字句). Khi một ngôn ngữ chưa có curriculum, hệ thống hiển thị màn hình thông tin đặc thù của không gian đó, không tự ý nạp đề cương tiếng Anh.
