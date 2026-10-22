# PROJECT UI RULE & DESIGN SYSTEM
## LetStuN AI & Competitive Gaming SaaS Platform

> **Phiên bản:** 2.0 (High-End SaaS Standard)  
> **Cập nhật:** 2026-09-09  
> **Nguyên tắc cốt lõi:** Professional • Modern • Consistent • Data-Driven • Glass UI Tinh Tế

---

## 1. Hệ Thống Màu Sắc (Color Tokens)

Hệ thống màu sắc tuân thủ triết lý bán trong suốt (translucent / subtle glass), tránh màu solid chói lọi và tuyệt đối không dùng neon:

| Nhóm Màu | Tên Token | Hex / HSL | Ứng Dụng |
|---|---|---|---|
| **Primary** | `indigo-500` | `#6366f1` (`opacity: 15% - 30%`) | Hành động chính, Active Nav, Selection Badge |
| **Secondary** | `slate-800` | `#1e293b` (`opacity: 60% - 80%`) | Nền Card phụ, Nút Secondary, Toolbar |
| **Success** | `emerald-400` | `#34d399` (`opacity: 15% - 25%`) | Doanh thu dương, Tỷ lệ thắng, Trạng thái ACTIVE |
| **Warning** | `amber-400` | `#fbbf24` (`opacity: 15% - 25%`) | Trạng thái Chờ, Cảnh báo biên lợi nhuận, Needs Attention |
| **Danger** | `rose-400` | `#f87171` (`opacity: 15% - 25%`) | Nút Xóa, Chi phí vượt định mức, Tài khoản bị khóa |
| **Surface** | `slate-900/60` | `rgba(15, 23, 42, 0.6)` | Nền Card, Table, Drawer với `backdrop-blur-md` |
| **Border** | `slate-800` / `var(--card-border)` | `rgba(255, 255, 255, 0.08)` | Viền thẻ kính đồng bộ theo độ tương phản |

---

## 2. Typography & Font Rules

### ⚠️ QUY TẮC BẮT BUỘC: TUYỆT ĐỐI LOẠI BỎ `font-mono`
- **CẤM** sử dụng font monospace (`font-mono`, Courier, Consolas) trên toàn bộ UI, Button, Badge, Card, Table, Input, Heading hay Statistic.
- **Giải pháp căn chỉnh số học**: Sử dụng thuộc tính `tabular-nums` trên font sans-serif chuẩn (`font-sans font-semibold tracking-tight tabular-nums`). Các con số sẽ có chiều rộng ký tự đồng đều, thẳng hàng hoàn hảo mà không bị thô ráp dạng code-like.

### Typography Hierarchy:
- **Display / Hero**: `text-2xl` - `text-4xl` • `font-extrabold` • `tracking-tight`
- **Section Heading (H2/H3)**: `text-base` - `text-xl` • `font-bold`
- **Card Title / Table Header**: `text-xs` - `text-sm` • `font-bold` • `uppercase tracking-wider`
- **Body Text**: `text-xs` - `text-sm` • `font-medium` • `text-slate-300`
- **Caption / Metadata**: `text-[10px]` - `text-[11px]` • `text-slate-400`

---

## 3. Spacing Scale

Hệ số căn chỉnh dựa trên chuẩn 4px:
- `4px` (`gap-1`, `p-1`): Khoảng cách giữa icon và chữ nhỏ.
- `8px` (`gap-2`, `p-2`): Khoảng cách giữa các chip, badge hoặc trường nội bộ.
- `12px` (`gap-3`, `p-3`): Khoảng cách các thành phần trong card, toolbar filter.
- `16px` (`gap-4`, `p-4`): Padding card tiêu chuẩn, khoảng cách giữa các khối.
- `24px` (`gap-6`, `p-6`): Khoảng cách giữa các section lớn trên dashboard.
- `32px` - `48px`: Padding trang và container chính.

---

## 4. Border Radius & Shadows

### Border Radius:
- `rounded-md` (`6px`): Checkbox, mini badge.
- `rounded-xl` (`12px`): Button, Input, Select, Toggle, Dropdown item.
- `rounded-2xl` (`16px`): Card dữ liệu, Table container, Filter bar, Modal.
- `rounded-3xl` (`24px`): Hero banner, Command Center wrapper.
- `rounded-full`: Switch toggle, Avatar, Pill status.

### ⚠️ QUY TẮC SHADOWS:
- **TUYỆT ĐỐI KHÔNG DÙNG `box-shadow`** đậm hay tạo bóng đen thô ráp (`shadow-lg`, `shadow-xl`, `shadow-2xl`).
- Mọi chiều sâu không gian (depth) được tạo bởi:
  1. Nền kính mờ: `backdrop-blur-md` hoặc `backdrop-blur-xl`.
  2. Viền bán trong suốt: `border border-slate-800` hoặc `border-white/10`.
  3. Lớp nền phân tầng: `bg-slate-900/60` trên `bg-slate-950`.

---

## 5. Chuẩn Hóa Thành Phần Điều Khiển (Components Standard)

### 5.1. AdminSelect
- Một chuẩn Select duy nhất hỗ trợ: Single Select, Multi-Select (hiển thị tag chips), Search nội bộ, Clear button, Keyboard interaction, Dropdown portal.
- 3 kích thước: `sm` (32px), `md` (38px), `lg` (44px).

### 5.2. AdminToggle vs AdminCheckbox
- **`AdminToggle`**: Dành riêng cho trạng thái **Bật / Tắt (ON/OFF) tức thì** (Active game, Test mode, Maintenance). Chuyển động switch mềm mại.
- **`AdminCheckbox`**: Dành riêng cho việc **Chọn nhiều item trong bảng/danh sách (Multi-select)**. Hỗ trợ 3 trạng thái: Checked, Unchecked, Indeterminate (`-`).

### 5.3. AdminButton
- Phân cấp 5 cấp độ rõ ràng:
  - **Primary**: `bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25`
  - **Secondary**: `bg-slate-800/60 text-slate-200 border border-slate-700/60 hover:bg-slate-700/60`
  - **Ghost**: Nền trong suốt, chỉ hiện khi hover.
  - **Destructive**: `bg-rose-500/15 text-rose-300 border border-rose-500/30`
  - **Icon Button**: Kích thước vuông đồng bộ (h-8 w-8, h-9 w-9).

### 5.4. AdminFilterBar
- Tích hợp ô tìm kiếm từ khóa với nút Xóa nhanh (Clear).
- Bộ chọn khoảng thời gian đa năng: Hôm nay, Hôm qua, 7 ngày, 30 ngày, Tháng này, Tháng trước, Quý này, Năm nay, Tùy chỉnh.
- Dynamic dropdown filters (Status, Category, Room, Game) và nút Reset.

### 5.5. AdminDrawer & AdminModal
- Dùng **AdminDrawer** trượt từ cạnh phải cho các form dài hoặc sửa chi tiết (Sửa game, Sửa phòng, Chi tiết học viên) để không làm mất ngữ cảnh bảng dữ liệu.
- Dùng **AdminModal** cho các xác nhận xóa hoặc tác vụ ngắn.

---

## 6. Triết Lý Sản Phẩm (Core Philosophy)

> **"Admin nhìn ➔ Hiểu ➔ Phân tích ➔ Quyết định ➔ Hành động"**  
> **"User mở app ➔ Hiểu ngay ➔ Thao tác nhanh ➔ Ít friction ➔ Quay lại sử dụng"**
