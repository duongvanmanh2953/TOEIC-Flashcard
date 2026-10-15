# VocabFlow AI Application Security Review

> **Phương pháp tiếp cận**: Threat-Modeling Mindset (STRIDE / OWASP Top 10)  
> **Nguyên tắc**: Mọi lỗ hổng đều có file/path chính xác, bằng chứng từ code, phân tích tác động và phương án khắc phục chi tiết. Không suy diễn.

---

## 1. Bảng Tổng hợp Lỗ hổng Bảo mật (Vulnerability Summary Table)

| ID | Mức độ (Severity) | Phân loại (Category) | Tệp tin & Dòng liên quan | Trạng thái xác minh |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-001** | **CRITICAL** | Broken Authentication / Account Takeover | `apps/api/src/modules/auth/oauth.service.ts` (L26-L36)<br/>`apps/api/src/modules/auth/auth.controller.ts` (L175-L192) | **Verified (Chắc chắn)** |
| **SEC-002** | **HIGH** | Hardcoded Credentials / Backdoor | `apps/api/updateAdminPass.ts` (L59)<br/>`services/admin-api/updateAdminPass.ts` | **Verified (Chắc chắn)** |
| **SEC-003** | **MEDIUM** | Insecure Session Management | `apps/api/src/modules/auth/auth.service.ts` (L332-L340)<br/>`apps/api/src/modules/auth/auth.controller.ts` (L49-L64) | **Verified (Chắc chắn)** |
| **SEC-004** | **LOW** | Missing Rate Limiting on Sensitive Public Endpoints | `apps/api/src/modules/auth/auth.controller.ts` (L74, L87, L216) | **Likely (Cần thêm Throttle)** |
| **SEC-005** | **INFORMATIONAL** | Cookie SameSite None in Production without Domain check | `apps/api/src/modules/auth/auth.controller.ts` (L35-L44) | **Verified** |

---

## 2. Chi tiết Từng Phát hiện Bảo mật

### SEC-001 [CRITICAL]: Chiếm quyền Tài khoản (Account Takeover) qua Endpoint OAuth Không Xác thực Token
- **Tệp tin**: `apps/api/src/modules/auth/oauth.service.ts`, dòng 26-36.
- **Bằng chứng mã nguồn**:
  ```typescript
  async handleOAuthUser(profile: OAuthUserProfile) {
    if (!profile.email) {
      throw new UnauthorizedException('OAuth provider did not supply a valid verified email address.');
    }
    const email = profile.email.toLowerCase();
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true, streak: true, xp: true },
    });
    // ... Cấp phát tokens của user này mà KHÔNG kiểm tra chữ ký hay token từ Google/Facebook!
    const tokens = await this.authService.generateTokens(user.id, user.email, user.role);
    return { user, ...tokens };
  }
  ```
- **Nguyên nhân cốt lõi**: Controller chấp nhận JSON body trực tiếp từ client (`{ provider: 'google', email: 'admin@vocabflow.ai' }`) và chuyển thẳng cho service mà không yêu cầu Google `id_token` hoặc Firebase Auth Token để xác thực với Google Identity Server.
- **Tác động (Impact)**: Kẻ tấn công chỉ cần biết email của bất kỳ người dùng hoặc Quản trị viên (Admin/SuperAdmin) nào là có thể gửi request `POST /api/v1/auth/oauth` và ngay lập tức nhận về Access Token có quyền cao nhất mà không cần mật khẩu.
- **Đề xuất khắc phục (Proposed Fix)**:
  1. Client phải gửi `idToken` (Google JWT) hoặc `accessToken` được cấp từ OAuth provider.
  2. Backend sử dụng thư viện chính thức `google-auth-library` (`oauth2Client.verifyIdToken({ idToken, audience: CLIENT_ID })`) để giải mã và xác minh tính toàn vẹn của payload do Google ký số.
  3. Chỉ trích xuất email từ payload đã được Google xác thực (`payload.email_verified === true`).

---

### SEC-002 [HIGH]: Mật khẩu Chủ Mặc định Cứng (Hardcoded Master Password) trong Script Cập nhật Admin
- **Tệp tin**: `apps/api/updateAdminPass.ts`, dòng 59.
- **Bằng chứng mã nguồn**:
  ```typescript
  const masterPass = process.env.SERVER_MASTER_PASSWORD || 'vocabflow2026';
  const inputPass = await promptPassword('🔑 Nhập mật khẩu máy chủ (Master Password) để tiếp tục: ');
  ```
- **Nguyên nhân**: Script cung cấp giá trị dự phòng mặc định `'vocabflow2026'` nếu biến môi trường `SERVER_MASTER_PASSWORD` không được thiết lập.
- **Tác động**: Nếu máy chủ production chạy mà thiếu biến môi trường, bất kỳ ai có quyền truy cập shell hoặc console có thể sử dụng chuỗi `'vocabflow2026'` để reset mật khẩu toàn bộ Super Admin.
- **Đề xuất khắc phục**: Loại bỏ hoàn toàn fallback. Nếu `!process.env.SERVER_MASTER_PASSWORD`, ném lỗi và dừng script ngay lập tức.

---

### SEC-003 [MEDIUM]: Thời hạn Access Token Quá Dài (15 Ngày)
- **Tệp tin**: `apps/api/src/modules/auth/auth.service.ts`, dòng 332-340.
- **Bằng chứng mã nguồn**:
  ```typescript
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const accessExpiresInStr = isAdmin ? '1d' : '15d';
  ```
- **Nguyên nhân**: Access token cho học viên thông thường có thời hạn lên tới **15 ngày** (`15d`).
- **Tác động**: Access token là stateless JWT. Nếu token bị lộ (qua browser extension độc hại, XSS, hoặc proxy log), kẻ tấn công có thể sử dụng nó trong 15 ngày mà không thể thu hồi ngoại trừ việc xóa `refreshToken` trong database (chỉ chặn được khi JWT guard có truy vấn DB mỗi request).
- **Đề xuất khắc phục**:
  - Giảm thời hạn của Access Token xuống chuẩn an toàn: **15 phút - 1 giờ**.
  - Sử dụng Refresh Token (lưu mã hash trong `UserSession`) để xin cấp lại Access Token mới tự động.

---

### SEC-004 [LOW]: Thiếu Bộ điều tiết Tần suất (Rate Limiting) trên các Endpoint Công khai
- **Tệp tin**: `apps/api/src/modules/auth/auth.controller.ts` (`/login`, `/register`, `/forgot-password`).
- **Tác động**: Nguy cơ bị tấn công Brute-force mật khẩu hoặc Spam gửi OTP email làm cạn kiệt hạn ngạch email của dịch vụ Nodemailer/SendGrid.
- **Đề xuất khắc phục**: Tích hợp `@nestjs/throttler` với Redis Storage (`ThrottlerStorageRedisService`) để giới hạn tối đa 5 requests / phút đối với các endpoint xác thực.
