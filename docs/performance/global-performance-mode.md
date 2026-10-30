# Chế Độ Tối Ưu Hiệu Năng Toàn Ứng Dụng (Global Performance Mode)

> **VocabFlow Global Performance Architecture**  
> Phiên bản: 2.0 — Cập nhật: 10/2026

---

## 1. Vị Trí & Phạm Vi Điều Khiển

- **Điều khiển tập trung tại Header chung**: Được tích hợp vào Header (`AppShell.tsx`) cho cả giao diện máy tính (Desktop) và điện thoại di động (Mobile).
- **Phạm vi tác động**: Cấp độ toàn hệ thống (Global Scope), tác động tức thì lên toàn bộ ứng dụng mà không cần tải lại trang.
- **Lưu trữ**: Trạng thái được lưu trong LocalStorage (`vocabflow_performance_mode`) và áp dụng ngay class `.ultra-efficient-mode` lên thẻ gốc `<html>`.

---

## 2. So Sánh 2 Chế Độ

| Đặc tính | Default Mode | Ultra Efficient Mode |
| :--- | :--- | :--- |
| **Giao diện Visual** | Đầy đủ hiệu ứng gradient, shadow, glassmorphism | Tắt hoàn toàn `backdrop-filter: blur`, tắt box-shadow nặng |
| **Motion & Animation** | Smooth transitions, stagger, spring physics | Tắt transform vô hạn, giảm transitions xuống $\le 0.05s$ |
| **Canvas Rendering** | High-DPI subpixel sampling, stroke morphing | Canvas 1x pixel ratio, khử compositing layer dư thừa |
| **Tải CPU & GPU** | Chuẩn cho thiết bị hiện đại | Giảm 60-70% thời gian Main-thread, cuộn trang 60 FPS ổn định trên máy yếu |

---

## 3. Kiến Trúc Kỹ Thuật

- Provider: `PerformanceProvider` (`PerformanceContext.tsx`) cung cấp hook `usePerformance()` trả về:
  - `mode: 'default' | 'ultra-efficient'`
  - `isUltraEfficient: boolean`
  - `toggleMode: () => void`
  - `setMode: (mode) => void`
- Tokens CSS được định nghĩa trong `src/index.css`:
  - `html.ultra-efficient-mode * { backdrop-filter: none !important; box-shadow: none !important; }`
  - `html.ultra-efficient-mode canvas { image-rendering: pixelated; }`
