# Sổ Tay Kỹ Thuật UI/UX & Quy Chuẩn Layout (LetStuN Web)

> **Tài liệu ghi chú kỹ thuật, quy chuẩn thiết kế và lưu ý sửa đổi giao diện**  
> **Cập nhật lần cuối**: 18/10/2026

---

## 1. Các Vấn Đề Đã Sửa & Rút Kinh Nghiệm (Change Log & Lessons Learned)

### 1.1. Xóa Vệt Sáng Chói Ngang Đỉnh Màn Hình (Top Ambient Glare)
- **Vị trí**: [LiquidBackground.tsx](file:///home/duong/Downloads/TOEIC-Flashcard/apps/web/src/components/common/LiquidBackground.tsx)
- **Hiện tượng**: Trước đó có một vệt sáng oval lớn (`absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-white/90 ... blur-3xl`) tạo dải sáng trắng chói ngang qua phía trên cùng trang web gây khó chịu cho mắt và làm giảm độ tương phản của header.
- **Giải pháp**: Loại bỏ triệt để orb uplight đỉnh này, bảo toàn các vệt sáng góc (top-left indigo, top-right cyan) để giữ hiệu ứng gradient mượt mà mà không gây chói.

---

### 1.2. Cơ Chế Giới Hạn Cỡ Chữ Tối Thiểu (Browser Minimum Font Size Invariant)
- **Vấn đề gặp phải**: Khi dùng thử `<p class="text-[5px] ..." style="font-size: 9px;">Gói tài khoản</p>`, chữ không nhỏ hơn được nữa mà vẫn giữ nguyên kích thước.
- **Nguyên nhân kỹ thuật**: Các trình duyệt nhân Chromium (Google Chrome, Microsoft Edge, Brave, Cốc Cốc) và WebKit/Safari đều kích hoạt tính năng **Minimum Font Size** (mặc định là `9px` hoặc `10px`) nhằm tuân thủ tiêu chuẩn Tiếp cận Người dùng (WCAG 2.1 Accessibility). Bất kỳ thuộc tính CSS nào đặt font nhỏ hơn (ví dụ `font-size: 5px;`) đều bị trình duyệt tự động ép (clamp) về ngưỡng sàn 9px.
- **Quy chuẩn sửa**:
  1. Không cố gắng ép `font-size < 9px` bằng CSS trực tiếp hoặc micro-font inline styles.
  2. Áp dụng hệ phân cấp thị giác chuẩn:
     - Nhãn phụ / Sub-badge: `text-[10px] font-black uppercase tracking-wider leading-tight`
     - Tên gói / Tier title: `text-xs font-black leading-tight mt-0.5`
     - Nút / Action pill: `text-[10px] font-black uppercase px-2 py-0.5 rounded-lg whitespace-nowrap`
  3. Bổ sung `whitespace-nowrap shrink-0 truncate` để đảm bảo văn bản không bao giờ bị rớt dòng trên các màn hình hẹp.

---

### 1.3. Đồng Bộ Thẻ Gói Tài Khoản & Giao Diện Sidebar Theo Từng Cấp Độ (Tier-Adaptive Sidebar)
- **Vị trí**: [AppShell.tsx](file:///home/duong/Downloads/TOEIC-Flashcard/apps/web/src/components/layout/AppShell.tsx)
- **Hiện tượng trước đây**:
  - Người dùng khách (Guest / Anonymous) chỉ thấy hộp thông báo đăng nhập, hoàn toàn không thấy thẻ "Gói tài khoản" ở thanh bên trái.
  - Sidebar và footer footer container không thay đổi nhận diện theo hạng tài khoản.
- **Giải pháp**:
  - **Vị trí**: Luôn hiển thị thẻ "Gói tài khoản" lên đầu tiên trong footer sidebar (ngay trên nút "Đăng nhập 1-chạm" cho khách).
  - **Phân nhánh 4 cấp bậc tài khoản**:
    1. **Khách (Guest)**: Viền và nền ánh tím/indigo frosted glass nhẹ, nhãn "GÓI TRẢI NGHIỆM", tên "Khách Khám Phá", nút bấm `[👑 LÊN PRO]` (hoặc Mở Khóa). Ngay bên dưới là card đồng bộ tiến độ với nút `[Đăng nhập 1-chạm]`.
    2. **Miễn Phí (Free)**: Viền và nền amber/slate nhẹ, nhãn "GÓI TÀI KHOẢN", tên "Tài khoản Free", nút bấm `[👑 LÊN PRO]`. Bên dưới là thông tin Profile cá nhân.
    3. **Nâng Cao (Plus)**: Viền neon cyan luminous, gradient slate-cyan, icon `Zap`, nhãn "GÓI NÂNG CAO", tên "LetStuN Plus", nút bấm `[⚡ LÊN VIP]`.
    4. **VIP (Pro)**: Viền mạ vàng obsidian `border-amber-400/60`, dải phản quang lỏng (specular sheen), icon `Crown` vàng hoàng gia, nhãn "ĐẶC QUYỀN PRO", tên "LetStuN VIP", badge `[👑 VIP]`.
  - **Viền Sidebar & Footer**: Đường phân cách `border-t` và `border-r` của `<aside>` tự động phát sáng nhẹ theo màu sắc của từng tier (Amber Gold cho Pro, Cyan Luminous cho Plus, Indigo cho Guest, Slate cho Free).

---

### 1.4. Xử Lý Nút Bị Rớt Dòng (Button Wrapping) Trong Modal Kho Từ
- **Vị trí**: [CommunityDecksPage.tsx](file:///home/duong/Downloads/TOEIC-Flashcard/apps/web/src/pages/CommunityDecksPage.tsx)
- **Hiện tượng**: Nút "HỌC BỘ TỪ NGAY (SRS)" dài 22 ký tự bị chèn ép cùng 4 nút tiện ích khác trên cùng 1 hàng, gây rớt dòng thành 2 dòng lộn xộn trên mobile và màn hình hẹp.
- **Giải pháp**:
  1. Tối ưu câu chữ: Chuyển thành `"Học ngay (SRS)"` ngắn gọn, súc tích và hiện đại.
  2. Tách cấu trúc nút thành 2 hàng phân cấp rõ rệt:
     - **Hàng chính (Primary Row)**: Gồm `[✨ Học ngay (SRS)]` (chiếm `flex-1`) và `[📖 Xem kho từ]`.
     - **Hàng phụ (Secondary Row)**: Gồm các nút tính năng phụ `[Liên hệ chủ kho]`, `[Lưu về kho]`, `[Xuất file]`, `[Xóa kho]` với chiều cao chuẩn `h-9` và `whitespace-nowrap`.
  3. Đảm bảo toàn bộ thẻ `<button>` đều có thuộc tính `whitespace-nowrap shrink-0` và quy chuẩn toàn cục trong `index.css`.

---

### 1.5. Cân Bằng Chiều Cao 2 Icon Phát Âm (Audio Pronunciation Buttons)
- **Vị trí**: [SpeechButton.tsx](file:///home/duong/Downloads/TOEIC-Flashcard/apps/web/src/components/common/SpeechButton.tsx)
- **Hiện tượng**: Nút loa phát âm chuẩn có chiều cao `min-h-[44px]` trong khi nút đọc chậm `0.75x` bên cạnh chỉ có `min-h-[36px]`, dẫn tới việc hai nút nằm cạnh nhau bị lệch chiều cao rõ rệt.
- **Giải pháp**:
  - Tạo cấu hình kích thước đồng bộ `SIZE_CONFIGS` (`sm`, `md`, `lg`).
  - Cả hai nút (Loa chuẩn & Đồng hồ 0.75x) luôn sử dụng chung `heightClass` (`h-8`, `h-9`, hoặc `h-10`) và `rounded` tương ứng.
  - Trong danh sách xem trước từ vựng của modal, gán `size="sm"` (`h-8`) giúp bố cục thẻ từ thanh thoát và đồng đều 100%.

---

## 2. Kết Quả Kiểm Tra Tự Động (Verification Gate)
- **Vite Build**: `npm run build --workspace=apps/web` hoàn tất thành công (`exit code 0`, build time: 16.86s).
- **TypeScript**: Không có lỗi type checking.
- **Tương thích Responsive**: Kiểm tra trên cả viewport di động (360px - 414px) và desktop (1024px+).
