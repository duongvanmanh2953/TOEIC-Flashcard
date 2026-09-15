# Kế Hoạch Nâng Cấp Quản Lý Kho Từ Vựng: IndexedDB -> Cloud VIP -> Cộng Đồng Kiểm Duyệt & Mật Khẩu Mã Hóa

Tài liệu này phân tích nguyên nhân sự cố "up kho từ vựng thành công nhưng không thấy", đồng thời đề xuất giải pháp toàn diện cho quy trình quản trị kho từ: lưu trữ IndexedDB, đẩy lên Cloud cho gói trả phí, chia sẻ lên Cộng đồng qua kiểm duyệt Admin, và tính năng đặt mật khẩu bảo vệ mã hóa an toàn (Admin xem được nội dung kho nhưng không xem được mật khẩu).

---

## 1. Phân Tích Nguyên Nhân "Up kho thành công nhưng không thấy đâu / không đọc được"

Khi người dùng (Learner) tạo/up một bộ từ vựng:
- **Backend logic**: Trong `CommunityService.createDeck`, nếu người dùng không phải là `ADMIN`, hệ thống tự động gán `status = ModerationStatus.PENDING` (Chờ duyệt).
- **Truy vấn danh sách công khai**: API `GET /community/decks` chỉ lọc các kho từ có `status: ModerationStatus.APPROVED`.
- **Thiếu giao diện theo dõi**: Trang Cộng đồng trước đây chưa có tab **"Kho từ của tôi" (My Decks)**, không hiển thị trạng thái `⏳ Đang chờ Admin duyệt`. Do đó, người dùng up xong bị quay lại danh sách công khai và không thấy kho của mình đâu.

---

## 2. Các Thay Đổi Kiến Trúc & Tính Năng Được Đề Xuất

### A. Quản lý Kho Từ (Tên kho & Trình độ kèm "Tất cả")
- Bổ sung giá trị `ALL` vào enum `CefrLevel` (A1, A2, B1, B2, C1, C2, **ALL - Tất cả trình độ**).
- Form tạo kho từ có đầy đủ:
  - **Tên kho từ** (Bắt buộc).
  - **Mô tả kho từ**.
  - **Trình độ CEFR**: A1, A2, B1, B2, C1, C2 và **Tất cả trình độ (ALL)**.
  - **Chủ đề / Danh mục**.

### B. Lưu Trữ IndexedDB Cục Bộ -> Đẩy Lên Cloud (Bản Trả Phí Mới Có)
- **IndexedDB**: Kho từ cá nhân và dữ liệu tạo mới được lưu trữ cục bộ, tức thì trong IndexedDB của trình duyệt (`vocabflow_offline_db`).
- **Nút "Đồng bộ / Đẩy lên Cloud" (Sync to Cloud)**:
  - Kiểm tra hạng tài khoản (`user.tier`: `PLUS`, `PRO`, `ENTERPRISE`, hoặc `user.role === 'ADMIN' | 'PREMIUM_USER'`).
  - Nếu là tài khoản Miễn phí (`FREE`): Hiển thị modal VIP thông báo *"Tính năng Lưu trữ & Đồng bộ Đám mây Không giới hạn dành riêng cho gói Trả phí (Plus/Pro). Dữ liệu hiện tại của bạn vẫn được lưu an toàn trên máy (IndexedDB)."* kèm nút nâng cấp gói.
  - Nếu là tài khoản Trả phí: Thực hiện đẩy toàn bộ kho từ lên Cloud cá nhân.

### C. Đẩy Lên Cộng Đồng -> Cần Admin Duyệt Mới Public
- Người dùng từ kho cá nhân/Cloud có thể chọn **"Chia sẻ lên Cộng đồng"**.
- Trạng thái được chuyển thành `PENDING` (Chờ phê duyệt).
- Trang `CommunityDecksPage` sẽ có 2 Tab:
  1. **Khám phá cộng đồng**: Chỉ hiển thị các kho từ đã được Admin phê duyệt (`APPROVED`).
  2. **Kho từ của tôi (My Decks)**: Hiển thị toàn bộ kho từ do chính người dùng tạo kèm trạng thái thời gian thực:
     - `⏳ Chờ phê duyệt (Pending)`
     - `✅ Đã công khai (Approved)`
     - `❌ Bị từ chối (Rejected)` (kèm lý do góp ý từ Admin)
- Admin vào trang `AdminSharedVocabularyPage` để xem danh sách từ và bấm Phê duyệt / Từ chối. Khi Admin duyệt, kho từ lập tức xuất hiện ở tab Cộng đồng công khai.

### D. Khóa Mật Khẩu Cho Kho Từ (Mã Hóa - Admin Xem Kho Nhưng Không Xem Được Khóa)
- Khi chia sẻ lên cộng đồng, người dùng có tùy chọn: **"Đặt mật khẩu bảo vệ kho từ"**.
- **Mã hóa an toàn**: Mật khẩu được băm (hash) bằng `bcrypt` trước khi lưu vào cơ sở dữ liệu (`CommunityDeck.passwordHash`). Không bao giờ lưu hay trả về mật khẩu gốc.
- **Admin được phép xem kho nhưng không xem được khóa**:
  - Giao diện Admin (`AdminSharedVocabularyPage`): Admin xem đầy đủ danh sách các thẻ từ, nghĩa, phát âm, ví dụ để thẩm định chất lượng, nhưng **không hiển thị mật khẩu** (chỉ hiển thị huy hiệu `🔒 Kho có mã bảo vệ (Đã mã hóa bcrypt)`).
- **Mở khóa trên Cộng đồng**:
  - Khi thành viên khác muốn xem chi tiết hoặc clone bộ từ có khóa, hệ thống hiển thị popup yêu cầu: *"Nhập mật khẩu do tác giả chia sẻ để mở khóa kho từ này"*.
  - Kiểm tra mật khẩu qua API backend `POST /community/decks/:id/unlock` an toàn. Nếu đúng, cho phép xem từ và sao chép.

---

## 3. Danh Sách Files Cần Sửa Đổi

### Backend (`apps/api`)
#### [MODIFY] [schema.prisma](file:///c:/Users/manhd/Downloads/ToeicFlashCard/apps/api/prisma/schema.prisma)
- Thêm `ALL` vào `CefrLevel`.
- Thêm `isProtected Boolean @default(false)` và `passwordHash String?` vào model `CommunityDeck`.

#### [MODIFY] [create-deck.dto.ts](file:///c:/Users/manhd/Downloads/ToeicFlashCard/apps/api/src/modules/community/dto/create-deck.dto.ts)
- Bổ sung trường `password` (tùy chọn, string).

#### [MODIFY] [community.controller.ts](file:///c:/Users/manhd/Downloads/ToeicFlashCard/apps/api/src/modules/community/community.controller.ts)
- Thêm route `GET /community/my-decks`: Lấy danh sách kho từ của người dùng hiện tại (kèm trạng thái PENDING/APPROVED/REJECTED).
- Thêm route `POST /community/decks/:id/unlock`: Xác thực mật khẩu kho từ mà không để lộ mật khẩu trong DB.
- Thêm route `POST /community/sync-cloud`: Đồng bộ từ IndexedDB lên Cloud với kiểm tra quyền VIP.

#### [MODIFY] [community.service.ts](file:///c:/Users/manhd/Downloads/ToeicFlashCard/apps/api/src/modules/community/community.service.ts)
- Xử lý hash mật khẩu với `bcrypt` khi tạo kho.
- Ẩn trường `passwordHash` khỏi tất cả các response công khai và response admin.
- Hỗ trợ lấy chi tiết kho từ có khóa sau khi xác thực thành công.
- Cung cấp phương thức `getMyDecks` cho người dùng quản lý kho cá nhân.

#### [MODIFY] [admin.service.ts](file:///c:/Users/manhd/Downloads/ToeicFlashCard/apps/api/src/modules/admin/admin.service.ts)
- Đảm bảo endpoint `getSharedVocabularyDecks` của Admin lấy được đầy đủ danh từ để duyệt nhưng luôn ẩn `passwordHash`.

---

### Frontend (`apps/web`)
#### [MODIFY] [idb.ts](file:///c:/Users/manhd/Downloads/ToeicFlashCard/apps/web/src/lib/idb.ts)
- Bổ sung object store / hàm tiện ích `idbSaveLocalDeck`, `idbGetLocalDecks` để lưu trữ kho từ cục bộ trong IndexedDB.

#### [MODIFY] [CommunityDecksPage.tsx](file:///c:/Users/manhd/Downloads/ToeicFlashCard/apps/web/src/pages/CommunityDecksPage.tsx)
- Thêm Tabs: **Khám phá cộng đồng** & **Kho từ của tôi**.
- Ở Tab **Kho từ của tôi**: Hiển thị thẻ các kho từ của người dùng với huy hiệu trạng thái rõ ràng (`Chờ duyệt`, `Đã duyệt`, `Bị từ chối`).
- Modal Tạo Kho Từ:
  - Nhập **Tên kho**
  - Chọn **Trình độ** (Bao gồm A1, A2, B1, B2, C1, C2 và **Tất cả trình độ**)
  - Tùy chọn đặt **Mật khẩu bảo vệ** (kèm ghi chú: *Mật khẩu được mã hóa an toàn, Admin kiểm duyệt nội dung từ vựng nhưng không xem được mật khẩu của bạn*).
- Modal Mở Khóa Mật Khẩu: Popup nhập mật khẩu khi xem/clone kho từ có biểu tượng ổ khóa.
- Nút **Đồng bộ IndexedDB lên Cloud (VIP)** với popup kiểm tra gói trả phí.

#### [MODIFY] [MyWordBankPage.tsx](file:///c:/Users/manhd/Downloads/ToeicFlashCard/apps/web/src/pages/MyWordBankPage.tsx)
- Bổ sung nút **Đẩy lên Cloud (VIP)** và huy hiệu trạng thái lưu trữ IndexedDB.

#### [MODIFY] [AdminSharedVocabularyPage.tsx](file:///c:/Users/manhd/Downloads/ToeicFlashCard/apps/web/src/pages/admin/AdminSharedVocabularyPage.tsx)
- Hiển thị nhãn `🔒 Có mật khẩu bảo vệ (Đã mã hóa)` cho các kho từ có đặt khóa, cho phép Admin xem duyệt từ ngữ mà không hiển thị mật khẩu.

---

## 4. Kế Hoạch Kiểm Tra & Xác Minh (Verification Plan)

### Kiểm Tra Tự Động & Build
1. Chạy `npx prisma generate` để cập nhật client.
2. Build frontend: `npm run build` trong `apps/web`.
3. Build backend: `npm run build` trong `apps/api`.

### Kiểm Tra Thực Tế (End-to-End)
1. Đăng nhập tài khoản Learner -> Tạo kho từ mới có Tên kho, Trình độ "Tất cả", và đặt mật khẩu bảo vệ.
2. Kiểm tra tab "Kho từ của tôi": Kho từ mới xuất hiện ngay với trạng thái `⏳ Đang chờ Admin duyệt`, giải quyết triệt để vấn đề "up xong không thấy đâu".
3. Đăng nhập tài khoản Admin -> Vào `/admin/shared-vocabulary`:
   - Admin nhìn thấy kho từ mới được gửi lên.
   - Admin xem được danh sách từ vựng, định nghĩa, ví dụ câu.
   - Admin **KHÔNG** thấy mật khẩu (chỉ thấy thông báo đã được mã hóa).
   - Admin bấm Duyệt (Approve).
4. Quay lại trang Cộng đồng công khai: Kho từ xuất hiện với biểu tượng ổ khóa. Nhập mật khẩu để mở khóa và clone kho từ.
5. Kiểm tra nút "Đẩy lên Cloud (VIP)": Tài khoản miễn phí nhận được thông báo nâng cấp gói, tài khoản trả phí đồng bộ thành công.
