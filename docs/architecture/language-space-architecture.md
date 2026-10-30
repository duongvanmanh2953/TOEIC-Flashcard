# Kiến Trúc Không Gian Ngôn Ngữ (Language Space Centric Architecture)

> **VocabFlow Multilingual System Architecture**  
> Phiên bản: 2.0 — Cập nhật: 10/2026

---

## 1. Nguyên Tắc Cốt Lõi

VocabFlow hỗ trợ đa không gian ngôn ngữ với nguyên tắc **Language Space Centric**:
- Mọi tài nguyên học tập: **Vocabulary Collections**, **Flashcards**, **Practice Sessions**, **Grammar Curriculum**, **Question Bank**, **Exams**, và **Writing Units** đều trực thuộc một Không gian Ngôn ngữ xác định (`languageId`).
- **Không có fallback ngầm định sang tiếng Anh**: Khi người dùng đang ở Không gian Tiếng Nhật (`ja`), Tiếng Hàn (`ko`), hoặc Tiếng Trung (`zh`), hệ thống hiển thị dữ liệu chính xác của ngôn ngữ đó hoặc trạng thái chờ phát triển của không gian đó. Tuyệt đối không tự ý hiển thị nội dung tiếng Anh để lấp chỗ trống.
- **Data Ownership**: Mọi thực thể trong cơ sở dữ liệu (`GrammarCategory`, `Exam`, `VocabularyDeck`, `VocabularyItem`) lưu trữ `languageId` làm khóa phân vùng ngữ cảnh nghiệp vụ.

---

## 2. Bản Đồ Không Gian Ngôn Ngữ (Language Space Matrix)

| Language Space | Scripts Hỗ Trợ | Handwriting Engine | Grammar Curriculum | Question Bank Certificates |
| :--- | :--- | :--- | :--- | :--- |
| **English (`en`)** | Latin | Không áp dụng (Typing/Recognition) | A1 -> C2 (150+ Topics) | TOEIC, IELTS, TOEFL, Cambridge, CEFR |
| **Japanese (`ja`)** | Kanji, Hiragana, Katakana | Vector KanjiVG + Smooth Morph (220ms) | 助詞, 動詞活用, 敬語, 文型 | JLPT (N5 - N1), BJT, NAT-TEST |
| **Korean (`ko`)** | Hangul (Jamo/Syllable) | Stroke Sequence & Bounding Normalization | 조사, 어미, 시제, 높임법 | TOPIK (I & II), KLAT |
| **Chinese (`zh`)** | Hanzi (Giản thể / Phồn thể) | HanziWriter / Tian-zi-ge + Vector Cosine | 词序, 量词, 补语, 把字句 | HSK (1 - 6), TOCFL |

---

## 3. Quản Lý Ngữ Cảnh Trên Frontend

Context trung tâm quản lý Không gian Ngôn ngữ là `LearningContext` (`useLearningContext()`):
- Lưu trữ `activeLanguage: { id, name, flag, nativeName, scriptId, ... }`.
- Đồng bộ hóa qua LocalStorage và User Profile Preference.
- Header chung hiển thị bộ chuyển Không gian Ngôn ngữ trực quan (`LanguageSwitcherModal`).
- Khi chuyển đổi không gian:
  1. Toàn bộ danh sách bộ đề (`ExamBankPage`) tự động lọc theo `languageId`.
  2. Toàn bộ danh mục ngữ pháp (`GrammarMasteryPage`) tải đúng `languageId`.
  3. Luyện từ vựng và bảng vẽ nét (`VocabularyHandwritingPractice`) tự động kích hoạt font chữ, lưới Tian-zi-ge, và bộ đánh giá nét tương ứng.
