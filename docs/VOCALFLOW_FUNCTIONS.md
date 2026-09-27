# VocabFlow — System Architecture & Functions Audit Report (2026)

*Trạng thái: Đã thực hiện đợt Full System Audit.*

## 1. Product Overview
VocabFlow là nền tảng học ngoại ngữ đa ngôn ngữ tập trung vào Từ vựng (Vocabulary), Kho câu hỏi (Question Bank), Bộ đề thi (Test Sets - TOEIC, JLPT...), Review thông minh qua AI (Smart Spaced Repetition), cộng đồng học tập (Community), và không gian học trẻ em (Kids Mode).

## 2. User Roles & Authentication
Hệ thống sử dụng cơ chế bảo vệ Route, API, UI với các Role:
- **GUEST**: Không đăng nhập, chỉ xem các trang công khai (Landing Page).
- **LEARNER**: Học viên thông thường, chịu giới hạn Quota của gói (Free / Pro / VIP).
- **ADMIN / SUPER_ADMIN**: Quản trị viên, có toàn quyền quản lý User, Package, Data và Settings.
- **Trạng thái**: Đã dọn dẹp hoàn toàn luồng giả lập Demo Account, đảm bảo tính bảo mật.

## 3. Quota & Package Entitlements
Quota media và giới hạn chức năng được phân luồng chặt chẽ từ phía Backend (API) tới Frontend (UI):
- **FREE**: Giới hạn tạo bộ đề/từ vựng, hỗ trợ ảnh < 2MB, audio < 5MB (tổng quota ~100MB). Giới hạn số lượt dùng AI/TTS.
- **PRO / ENTRY**: Tăng cường giới hạn media (~500MB), kích thước file (ảnh 5MB, audio 10MB), nâng mức giới hạn AI/TTS.
- **VIP**: Tài nguyên tối đa (~5GB), hỗ trợ upload số lượng lớn, không giới hạn tính năng đề thi nâng cao.

## 4. Vocabulary & Question Bank Model
Hỗ trợ kiến trúc Generic thay vì Hard-code:
```
Exam / Test Set
    └── Part / Section (e.g. JLPT N2, TOEIC Part 1..7)
          └── Question
                ├── Choices
                ├── Answer
                ├── Explanation
                ├── Audio (File or URL)
                ├── Image (File or URL)
                └── Metadata / Tags
```

## 5. Media & Text-to-Speech (TTS)
- **Audio/Image**: Hỗ trợ upload qua server và External URL (đã loại trừ URL lỗi phá layout). Có giới hạn/nén theo chuẩn gói cước.
- **Auto TTS Engine**: 
  - Ưu tiên Voice Neural Native từ hệ điều hành.
  - Fallback linh hoạt sang Server Edge Neural (Vietnamese).
  - Tự động chuyển hướng Google Translate TTS Streaming (Miễn phí) đối với các ngôn ngữ hiếm (zh, ja, de...) trên trình duyệt thiếu gói âm thanh. Không sử dụng giọng đọc mặc định sai ngữ điệu.

## 6. Layout & Sidebar UI/UX
- **Desktop Sidebar**: Sidebar không bị unmount, luôn giữ nguyên trạng thái Active/Expanded Groups, Scroll State trong lúc điều hướng. Cuộn trang được giới hạn ở khu vực Main Content.
- **Mobile Drawer**: Tự động reset và đóng drawer khi chuyển trang.
- Đã đồng bộ các UI Buttons `+ Thêm`, `Icon` và làm mượt giao diện (thay thế text cứng bằng Icon Lucide-React).

## 7. Smart Pricing / Định Giá Thông Minh
- Được cấu trúc lại Information Architecture để tối ưu tính so sánh (Plan cards, features matrix), phân chia rõ theo khu vực Learning, Media, Analytics, Community thay vì dàn trải bảng dài.

## 8. Admin & Security
- **Tài khoản Admin**: Đã đổi sang mật khẩu tự tạo an toàn, ngẫu nhiên với Base64 hash.
- **Admin Statistics**: Có công cụ giải thích Metric (`?` hover state tooltip cung cấp Định nghĩa, Timeframe, Nguồn).
- **Reset All (Danger Zone)**: Tính năng reset toàn bộ hệ thống được bảo vệ qua Server-side Secret Key thay vì hardcode ở Frontend, chỉ dọn dẹp các data liên quan đến learning/history/community (không reset System Config/Secrets).

## 9. Known Limitations
- Cần tiếp tục theo dõi hiệu năng đối với các bộ đề thi có trên 500+ câu hỏi hiển thị cùng lúc (có thể cần Virtualized List cho ExamEditor).
- Dữ liệu âm thanh tải lên đôi khi yêu cầu chờ xử lý nén (Compression pipeline) nên có độ trễ UI nhất định.
