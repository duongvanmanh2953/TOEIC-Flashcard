# Ngân Hàng Bộ Đề Đa Ngôn Ngữ & Đa Kỳ Thi (Multilingual Question Bank)

> **VocabFlow Universal Question Bank Architecture**  
> Phiên bản: 2.0 — Cập nhật: 10/2026

---

## 1. Loại Bỏ Tư Duy TOEIC-centric

Ngân hàng bộ đề của VocabFlow được tái cấu trúc thành hệ thống đa ngôn ngữ:
- TOEIC chỉ là một loại chứng chỉ thuộc không gian Tiếng Anh.
- Bộ đề và câu hỏi phân cấp theo cấu trúc:
  $$\text{Language Space} \rightarrow \text{Skill / Subject} \rightarrow \text{Exam Type} \rightarrow \text{Collection} \rightarrow \text{Question}$$
- Hệ thống hỗ trợ phong phú các kỳ thi tiêu chuẩn quốc tế:
  - **English Space**: TOEIC, IELTS, TOEFL, Cambridge, CEFR Practice, General Quiz.
  - **Japanese Space**: JLPT (N5, N4, N3, N2, N1), BJT, NAT-TEST, Đề luyện thi tổng hợp.
  - **Korean Space**: TOPIK (I & II, Cấp 1 -> 6), KLAT, Đề tự luyện tiếng Hàn.
  - **Chinese Space**: HSK (Cấp 1 -> 6), TOCFL, Đề ngữ pháp - từ vựng tiếng Trung.

---

## 2. Dynamic Exam Filter & Data Isolation

- Mọi truy vấn bộ đề (`/exams`) truyền tham số `languageId: activeLanguage.id`.
- Bộ lọc `examType` trên giao diện người dùng được sinh động dựa trên danh mục chứng chỉ chuẩn của không gian ngôn ngữ đang kích hoạt (`getCertificatesForLanguage`).
- Khi người dùng tải file đề thi lên (Excel, PowerPoint, CSV), hệ thống tự động gắn `languageId` hiện hành và loại kỳ thi phù hợp thay vì gán cứng TOEIC.
