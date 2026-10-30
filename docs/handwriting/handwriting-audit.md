# BÁO CÁO KIỂM TOÁN HỆ THỐNG VIẾT TAY & NHẬN DIỆN KÝ TỰ (HANDWRITING AUDIT REPORT)

> **Mã tài liệu:** `VF-HW-AUDIT-2026-V1`  
> **Dự án:** VocabFlow — Multi-Language Learning Platform  
> **Thời điểm thẩm định:** 30/10/2026  
> **Người thẩm định:** Senior Frontend Engineer & Graphics/Handwriting Recognition Architect  

---

## 1. TỔNG QUAN HỆ THỐNG HIỆN TẠI (CURRENT SYSTEM REVIEW)

Tính năng tập viết chữ viết tay hiện tại được phát triển dưới dạng nguyên mẫu (prototype) ban đầu tại `apps/web/src/pages/handwriting/HandwritingStudioPage.tsx` và `apps/api/src/modules/scripts/`.

Qua kiểm tra toàn bộ mã nguồn thực tế, hệ thống hiện tồn tại các đặc điểm kỹ thuật sau:

### 1.1. Cơ Chế Vẽ (Current Drawing Mechanism)
- **Renderer:** Sử dụng thẻ `<canvas>` HTML5 tĩnh (kích thước cố định $500 \times 500$ px trong internal buffer, scaled qua CSS `aspect-square max-w-[420px]`).
- **Xử lý sự kiện (Pointer Events):** Sử dụng các event handlers riêng rẽ của React: `onMouseDown`, `onMouseMove`, `onMouseUp`, `onTouchStart`, `onTouchMove`, `onTouchEnd`.
- **Lưu trữ tọa độ:** Tọa độ từng điểm được lưu vào React state:
  ```typescript
  const [strokes, setStrokes] = useState<Array<Array<{ x: number; y: number }>>>([]);
  const [currentStroke, setCurrentStroke] = useState<Array<{ x: number; y: number }>>([]);
  ```
- **Chu kỳ vẽ lại (Rendering Pipeline):** Mỗi khi phát sinh sự kiện `onMouseMove` / `onTouchMove`, component kích hoạt:
  ```typescript
  setCurrentStroke((prev) => [...prev, coords]);
  redrawCanvas([...strokes, [...currentStroke, coords]]);
  ```
  Hàm `redrawCanvas` gọi `ctx.clearRect()`, vẽ lại lưới điền tự (Tian-zi-ge) và duyệt vẽ lại toàn bộ tất cả các nét từ đầu đến cuối (`for` loop lặp qua mảng điểm).

### 1.2. Cơ Chế Nhận Diện & Đánh Giá Nét (Current Recognition & Scoring Mechanism)
- **Ở Frontend:** Không có cơ chế nhận diện hình học, không kiểm tra thứ tự nét (stroke order), không kiểm tra hướng nét (stroke direction), không so sánh độ tương đồng dáng nét (shape similarity).
- **Ở Backend (`scripts.service.ts` dòng 263-277):**
  ```typescript
  // Đoạn mã thực tế trong ScriptsService.verifyStroke():
  const startPoint = drawnPoints[0];
  const endPoint = drawnPoints[drawnPoints.length - 1];
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const strokeLength = Math.hypot(dx, dy);
  let accuracy = 75;
  if (strokeLength > 50) {
    accuracy = Math.min(98, 80 + Math.floor(Math.random() * 18));
  } else {
    accuracy = 65;
  }
  ```
  **Phát hiện nghiêm trọng:** Hệ thống backend đang sử dụng thuật toán giả mạo (`Math.random()`) chỉ dựa trên độ dài khoảng cách điểm đầu - điểm cuối ($> 50\text{px}$). Bất kỳ nét vẽ nguệch ngoạc nào dài hơn 50px đều được hệ thống trả về điểm ngẫu nhiên từ 80% đến 98% và kết luận là *"Nét vẽ rất chuẩn xác! Đúng thứ tự và hướng nét quy chuẩn"*.

### 1.3. Cơ Chế Hiệu Ứng Nét Mẫu & Chuyển Nét (Ghost Guide & Morphing)
- Nét mẫu được hiển thị bằng một thẻ SVG đè dưới Canvas với độ mờ `opacity-25`.
- **Hoàn toàn không có cơ chế Stroke Morphing:** Nét vẽ của người dùng vẫn là các đoạn thẳng thô ráp vẽ bằng `ctx.lineTo()`, không tự căn chỉnh, không làm mịn, không có hiệu ứng chuyển đổi mượt mà sang nét chuẩn.

---

## 2. NHỮNG VẤN ĐỀ KỸ THUẬT & BOTTLENECK CẦN GIẢI QUYẾT

| Hạng mục | Thực trạng hiện tại | Hậu quả kỹ thuật |
| :--- | :--- | :--- |
| **Logic chấm điểm** | Dùng `Math.random()` dựa trên chiều dài nét $> 50$px. | Chấm điểm giả (False Acceptance cực cao). Người dùng vẽ một đường chéo bất kỳ vẫn được 98% điểm. |
| **Hiệu năng Canvas** | Gọi `setState()` và `redrawCanvas()` trên **mỗi tọa độ move** của chuột/ngón tay. | Gây giật lag nghiêm trọng, tụt khung hình (dropped frames) trên mobile và máy tính cấu hình yếu vì React re-render liên tục. |
| **Xử lý cử chỉ cảm ứng** | Không có thuộc tính CSS `touch-action: none` và không chặn cuộn trang chuyên biệt. | Khi người dùng viết trên điện thoại/máy tính bảng, thao tác kéo nét thường xuyên bị nhận diện thành cử chỉ cuộn trang (scroll), làm đứt gãy nét viết. |
| **Chất lượng nét vẽ** | Nét vẽ vẽ bằng `ctx.lineTo` kích thước cố định `14px`, không làm mượt (smoothing). | Nét vẽ gãy khúc, thô cứng, không có cảm giác thư pháp (calligraphy/brush feel), không hỗ trợ áp lực bút (stylus pressure). |
| **Phụ thuộc Ngôn ngữ** | Danh sách Script (`HIRAGANA`, `KANJI`, `HANZI`) bị **hardcode cứng** trong UI component. | Học tiếng Anh hoặc tiếng Đức vẫn hiển thị danh sách viết chữ Hiragana/Kanji/Hán tự; không tuân theo Language Learning Capability của ngôn ngữ đang học. |
| **Hiệu ứng Morph nét** | Chưa được triển khai. Nét người dùng giữ nguyên dạng pixel thô. | Trải nghiệm học tập kém, không tạo được cảm giác thành tựu khi vẽ gần đúng nét. |
| **Dataset Ký tự** | Chỉ có 8 ký tự mẫu được seed tạm trong cơ sở dữ liệu với SVG thô. | Không có dữ liệu thứ tự nét, không có hướng nét, không đủ bao phủ các bộ chữ tiêu chuẩn (HSK1, N5, Hangul). |

---

## 3. ĐÁNH GIÁ THƯ VIỆN & CÔNG NGHỆ KHẢ THI (TECH STACK EVALUATION)

### 3.1. Thư viện Render Nét Vẽ: `perfect-freehand`
- **Tác giả / Repo:** Steve Ruiz (tldraw) / `steveruizok/perfect-freehand`.
- **Ưu điểm:** Nhẹ (~3KB gzipped), thuật toán tính toán đa giác nét vẽ tự nhiên dựa trên áp lực bút (pressure), tốc độ di chuyển và góc vẽ. Tạo ra nét bút lông (brush stroke) cực đẹp cho chữ tượng hình (Hanzi/Kanji).
- **Lưu ý:** Đây là công cụ tạo vector nét vẽ, **không phải** công cụ nhận diện chữ. Sẽ tích hợp làm lớp `StrokeRenderer` cho canvas.

### 3.2. Thư viện Nhận Diện & Dữ Liệu Nét Chữ: `Hanzi Writer` & `Hanzi Writer Data`
- **Tác giả / Repo:** Chanind / `chanind/hanzi-writer` & `chanind/hanzi-writer-data`.
- **License:** MIT cho code engine; Arphic Public License / MakeMeAHanzi cho dữ liệu ký tự.
- **Khả năng:**
  - Hỗ trợ đầy đủ hơn 9,000 chữ Hán giản thể/phồn thể và Kanji tiếng Nhật.
  - Tích hợp sẵn quiz engine client-side cực kỳ chính xác: kiểm tra thứ tự nét (`stroke order`), kiểm tra hướng nét (`stroke direction`), đo độ lệch khoảng cách (`leniency`).
  - Hỗ trợ animation thứ tự nét từng nét một, render qua SVG hoặc Canvas.
  - Cho phép hook các sự kiện: `onCorrectStroke`, `onMistake`, `onComplete`.
- **Kết luận:** Lựa chọn hoàn hảo và chuẩn xác nhất cho Tiếng Trung (Hanzi) và Tiếng Nhật (Kanji).

### 3.3. Thuật toán Geometric Path Matching & Dynamic Time Warping (DTW)
- Xây dựng cho hệ thống chữ ngữ âm (Hiragana, Katakana, Hangul cơ bản):
  - Chuẩn hóa hệ tọa độ về khung $[0, 1000] \times [0, 1000]$.
  - Resampling nét vẽ thành $N = 32$ điểm cách đều theo cung chiều dài (arc-length parameterization).
  - So sánh vector hướng $(\Delta x_i, \Delta y_i)$ và khoảng cách Euclidean giữa nét người dùng và nét mẫu chuẩn.
  - Ngưỡng phạt vi phạm thứ tự nét và hướng vẽ ngược nét.

### 3.4. Cơ Chế Smooth Stroke Morphing
- Sử dụng thuật toán **Vector Path Interpolation**:
  - Khi nét vẽ đạt điểm tương đồng $\ge 75\%$ (Confidence cao):
  - Resample cả nét vẽ người dùng và nét mẫu chuẩn thành cùng số điểm $K = 60$.
  - Sử dụng hàm điều phối chuyển động `requestAnimationFrame` kết hợp cubic easing function trong thời lượng $220\text{ms}$.
  - Mỗi frame tính toán tọa độ điểm nội suy:
    $$P_i(t) = (1 - t) \cdot P_{\text{user}, i} + t \cdot P_{\text{canonical}, i}$$
  - Sau $220\text{ms}$, chuyển hẳn sang nét chuẩn mượt mà không gây giật màn hình.

---

## 4. MA TRẬN TÁI SỬ DỤNG VÀ THAY THẾ (REUSE VS REPLACE MATRIX)

| Thành phần | Trạng thái | Giải pháp chi tiết |
| :--- | :--- | :--- |
| `Prisma: ScriptSystem, CharacterData, UserCharacterProgress` | **TÁI SỬ DỤNG** | Giữ nguyên schema, không thay đổi cấu trúc bảng, bổ sung metadata stroke order trong `svgPaths` và `readingsJson`. |
| `API GET /scripts/:code/characters` | **TÁI SỬ DỤNG & MỞ RỘNG** | Bổ sung filter theo `languageId`, trả về capability metadata của từng hệ chữ. |
| `API POST /scripts/characters/:id/verify-stroke` | **THAY THẾ TOÀN BỘ** | Xóa bỏ hoàn toàn hàm `Math.random()`. Triển khai thuật toán kiểm tra hướng nét, độ lệch tọa độ chuẩn xác và lưu lịch sử học tập thực tế. |
| `Language Capability Registry` | **XÂY DỰNG MỚI** | Xây dựng cấu hình phân quyền tính năng độc lập theo `Language -> Script -> Dataset -> Capabilities`. |
| `HandwritingStudioPage.tsx` | **REDESIGN TOÀN DIỆN** | Tái cấu trúc Canvas theo kiến trúc Ref-based (không re-render liên tục), tích hợp Hanzi Writer / Vector Morphing Engine, hỗ trợ 5 chế độ: Learn, Trace, Guided Writing, Free Writing, Writing Challenge. |
| `Global Performance Mode (Ultra-Efficient)` | **TÍCH HỢP** | Tự động tắt blur/shadow và hạ tầng animation nặng khi thiết bị yếu hoặc người dùng kích hoạt tiết kiệm năng lượng. |

---

## 5. KIẾN TRÚC MỚI ĐỀ XUẤT (PROPOSED ARCHITECTURE)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VOCABFLOW WRITING ENGINE                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  [Language Capability Registry] (Language -> Script -> Capabilities)   │
│         │                                                              │
│         ▼                                                              │
│  [Writing Mode Controller] (Learn | Trace | Guided | Free | Challenge) │
│         │                                                              │
│         ▼                                                              │
│  ┌───────────────────────────┐      ┌───────────────────────────────┐  │
│  │     Canvas Input Layer    │      │    Reference Data Provider    │  │
│  │ (Pointer Events, Pressure,│      │  (Hanzi Writer SVG / KanjiVG  │  │
│  │  touch-action: none, RAF) │      │   / Hiragana Vector Paths)    │  │
│  └─────────────┬─────────────┘      └───────────────┬───────────────┘  │
│                │                                    │                  │
│                ▼                                    ▼                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                 Stroke Geometric Evaluator                       │  │
│  │  - Stroke Count & Order Verification                             │  │
│  │  - Direction Vector & Start/End Tolerance Check                  │  │
│  │  - Normalized Path Resampling (32 points)                        │  │
│  │  - Distance & Shape Similarity Metric                            │  │
│  └─────────────────────────────────┬────────────────────────────────┘  │
│                                    │                                   │
│                        Confidence Score >= 75%?                        │
│                                   / \                                  │
│                            YES   /   \   NO                            │
│                                 ▼     ▼                                │
│                ┌──────────────────┐  ┌──────────────────────────────┐  │
│                │  Stroke Morphing │  │    Highlight Mistake Error   │  │
│                │  (220ms Bezier)  │  │     (Direction / Position)   │  │
│                └──────────────────┘  └──────────────────────────────┘  │
│                                    │                                   │
│                                    ▼                                   │
│            [Learning Progress & FSRS Spaced Repetition Sync]           │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```
