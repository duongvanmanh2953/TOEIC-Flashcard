# LetStuN AI — Advanced English Vocabulary Learning Platform

> **"Học ít từ hơn. Ghi nhớ trọn đời."**  
> Nền tảng học từ vựng tiếng Anh cá nhân hóa với thuật toán Lặp lại Ngắt quãng Thích ứng (Adaptive Spaced Repetition) và Gia sư AI tương tác.

---

## 🚀 Tính Năng Nổi Bật

1. **Adaptive Spaced Repetition Engine**:
   - Tính toán độ bền trí nhớ (Stability $S$), xác suất nhớ hiện tại (Retrievability $R$), và độ khó cá nhân hóa (Difficulty $D$).
   - Phân tích 4 tín hiệu phản hồi: độ chính xác, thời gian làm bài (`responseTimeMs`), mức độ tự tin (1-5), và việc sử dụng gợi ý (hints).
   - Tự động lập lịch ôn tập chính xác thời điểm người học chuẩn bị quên từ.
2. **Onboarding & Placement Test**:
   - Bài kiểm tra đầu vào đa dạng (định nghĩa, collocations, phrasal verbs, ngữ cảnh).
   - Tính toán trình độ CEFR ước lượng (A2–C1), dung lượng vốn từ (Vocabulary Size) và đề xuất kế hoạch học tập hàng ngày.
3. **Smart Review Room**:
   - Nhiều hình thức bài tập: Trắc nghiệm, Điền từ vào câu ví dụ, Gõ từ vựng.
   - Hỗ trợ phím tắt (`1`-`4` chọn đáp án, `Space` phát âm audio, `H` xem gợi ý, `Enter` tiếp tục).
   - Phản hồi sư phạm tức thì kèm câu ví dụ ngữ cảnh song ngữ Anh - Việt.
4. **Vocabulary Explorer**:
   - Khám phá hơn 600 từ vựng TOEIC thực chiến kèm audio phát âm bản xứ US/UK, phiên âm chuẩn IPA, và hình ảnh minh họa.
   - Bộ lọc theo khung CEFR (A1-C2) và danh mục chủ đề (Salaries & Benefits, Renting & Leasing, Contracts, v.v.).
5. **Interactive AI Tutor & Sentence Generator**:
   - Trợ lý gia sư AI phân tích sắc thái từ vựng, phân biệt các cặp từ dễ nhầm lẫn (*affect / effect*).
   - Sinh câu ví dụ phân tầng theo 4 cấp độ CEFR: A2, B1, B2, C1.
6. **Gamification & Analytics**:
   - Theo dõi chuỗi học tập (Streak), điểm kinh nghiệm (XP), thăng hạng cấp độ (Level).
   - Biểu đồ nhiệt hoạt động học tập 30 ngày (GitHub-style Heatmap).
   - Danh hiệu huy chương (Achievements) mở khóa theo từng mốc tiến độ.

---

## 🛠 Tech Stack

- **Backend**: NestJS (TypeScript), Prisma ORM, PostgreSQL, Redis, Passport JWT, Swagger OpenAPI.
- **Frontend**: React 18, Vite, TypeScript, TailwindCSS, Lucide Icons, Axios.
- **Data Source**: Cơ sở dữ liệu từ vựng 600+ từ TOEIC kèm audio, phiên âm IPA và hình ảnh minh họa chuẩn hóa trong PostgreSQL.

---

## 📦 Hướng Dẫn Cài Đặt & Khởi Chạy

### Cách 1: Chạy trực tiếp qua NPM

#### Bước 1: Khởi tạo Backend (NestJS)
```bash
cd apps/api
npm install
npx prisma generate
# (Đảm bảo PostgreSQL đang chạy trên cổng 5432)
npx prisma migrate dev --name init
npm run prisma:seed    # Nạp 600+ từ vựng TOEIC và tài khoản demo
npm run start:dev
```
Backend API sẽ khởi chạy tại: `http://localhost:4000/api/v1`  
Swagger OpenAPI Documentation: `http://localhost:4000/api/docs`

#### Bước 2: Khởi tạo Frontend (React + Vite)
```bash
cd apps/web
npm install
npm run dev
```
Giao diện ứng dụng sẽ chạy tại: `http://localhost:3000`

---

### Cách 2: Chạy toàn bộ hệ thống bằng Docker Compose

```bash
docker-compose up -d --build
```
Hệ thống sẽ tự động khởi tạo PostgreSQL, Redis, NestJS Backend và React Frontend.

---

## 🔑 Tài Khoản Trải Nghiệm Mẫu

- **Tài khoản Học viên (Learner)**:
  - Email: `learner@letstun.com`
  - Mật khẩu: `password123`
  - Đã có sẵn dữ liệu học tập: Cấp độ B1, 5-day streak, các từ đến hạn ôn tập.
- **Tài khoản Quản trị viên (Admin)**:
  - Email: `admin@letstun.com`
  - Mật khẩu: `admin123`

---

## 📚 Tài Liệu Kỹ Thuật

- [Kiến trúc hệ thống (ARCHITECTURE.md)](file:///c:/Users/manhd/Downloads/TOEIC-Flashcard/ARCHITECTURE.md)
- [Đặc tả API (API.md)](file:///c:/Users/manhd/Downloads/TOEIC-Flashcard/API.md)
- [Thuật toán Spaced Repetition (LEARNING_ENGINE.md)](file:///c:/Users/manhd/Downloads/TOEIC-Flashcard/LEARNING_ENGINE.md)
