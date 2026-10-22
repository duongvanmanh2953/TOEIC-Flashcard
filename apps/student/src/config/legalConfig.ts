/**
 * CẤU HÌNH TẬP TRUNG THÔNG TIN PHÁP LÝ & CHỦ SỞ HỮU WEBSITE
 *
 * Phục vụ yêu cầu hồ sơ Thông báo website Thương mại điện tử với Bộ Công Thương
 * (theo Nghị định 52/2013/NĐ-CP và Nghị định 85/2021/NĐ-CP).
 *
 * QUY TẮC BẢO MẬT & PHÁP LÝ:
 * 1. Không tự ý bịa đặt tên cá nhân/tổ chức, mã số thuế, địa chỉ hoặc số điện thoại.
 * 2. Các trường chưa có thông tin chính thức từ chủ sở hữu được đánh dấu rõ [BLOCKED: OWNER INPUT].
 * 3. Hỗ trợ đọc từ biến môi trường Vite (VITE_LEGAL_*) để triển khai an toàn theo từng môi trường.
 */

export interface LegalContactConfig {
  /** Tên cá nhân hoặc tổ chức/doanh nghiệp sở hữu website (Bắt buộc theo Nghị định 52) */
  ownerName: string;

  /** Địa chỉ liên hệ / trụ sở của chủ sở hữu (Bắt buộc theo Nghị định 52) */
  ownerAddress: string;

  /** Số điện thoại liên hệ chính thức (Bắt buộc theo Nghị định 52) */
  ownerPhone: string;

  /** Email liên hệ & tiếp nhận khiếu nại (Bắt buộc theo Nghị định 52) */
  ownerEmail: string;

  /** Mã số thuế doanh nghiệp hoặc mã số thuế cá nhân (nếu thuộc đối tượng phải có) */
  ownerTaxCode: string;

  /** Người đại diện theo pháp luật (đối với tổ chức/công ty) */
  representative?: string;

  /** Tên nền tảng / dịch vụ thương mại */
  platformName: string;

  /** Tên thương hiệu phụ / ứng dụng liên quan */
  brandNames: string[];

  /** Tên miền chính thức */
  domain: string;

  /** Website URL đầy đủ */
  websiteUrl: string;

  /** Khung giờ làm việc tiếp nhận hỗ trợ & khiếu nại */
  supportHours: string;

  /** Thời hạn cam kết phản hồi khiếu nại ban đầu (giờ làm việc) */
  initialResponseHours: number;

  /** Trạng thái hoàn thiện dữ liệu pháp lý */
  isVerifiedByOwner: boolean;
}

// Giá trị placeholder hiển thị rõ ràng khi chưa có thông tin xác nhận từ Chủ sở hữu
export const LEGAL_PLACEHOLDERS = {
  OWNER_NAME: '[Chưa cập nhật: Tên cá nhân / Đơn vị sở hữu website - BLOCKED: OWNER INPUT]',
  OWNER_ADDRESS: '[Chưa cập nhật: Địa chỉ liên hệ / Trụ sở chính thức - BLOCKED: OWNER INPUT]',
  OWNER_PHONE: '[Chưa cập nhật: Số điện thoại liên hệ chính thức - BLOCKED: OWNER INPUT]',
  OWNER_EMAIL: 'support@letstun.site',
  OWNER_TAX_CODE: '[Chưa cập nhật: Mã số thuế - BLOCKED: OWNER INPUT]',
  REPRESENTATIVE: '[Chưa cập nhật: Người đại diện pháp luật - BLOCKED: OWNER INPUT]',
};

// Đọc từ biến môi trường nếu có
const env = (import.meta as any).env || {};

export const LEGAL_CONFIG: LegalContactConfig = {
  ownerName: env.VITE_LEGAL_OWNER_NAME || LEGAL_PLACEHOLDERS.OWNER_NAME,
  ownerAddress: env.VITE_LEGAL_OWNER_ADDRESS || LEGAL_PLACEHOLDERS.OWNER_ADDRESS,
  ownerPhone: env.VITE_LEGAL_OWNER_PHONE || LEGAL_PLACEHOLDERS.OWNER_PHONE,
  ownerEmail: env.VITE_LEGAL_OWNER_EMAIL || LEGAL_PLACEHOLDERS.OWNER_EMAIL,
  ownerTaxCode: env.VITE_LEGAL_OWNER_TAX_CODE || LEGAL_PLACEHOLDERS.OWNER_TAX_CODE,
  representative: env.VITE_LEGAL_REPRESENTATIVE || LEGAL_PLACEHOLDERS.REPRESENTATIVE,
  platformName: 'LetStuN',
  brandNames: ['LetStuN', 'LetStuN', 'LexiMind'],
  domain: 'letstun.site',
  websiteUrl: env.VITE_CLIENT_URL || 'https://app.letstun.site',
  supportHours: 'Thứ Hai – Thứ Sáu: 08:30 – 17:30 | Thứ Bảy: 08:30 – 12:00 (Nghỉ Chủ Nhật & Lễ, Tết)',
  initialResponseHours: 24,
  isVerifiedByOwner: Boolean(
    env.VITE_LEGAL_OWNER_NAME &&
    env.VITE_LEGAL_OWNER_ADDRESS &&
    env.VITE_LEGAL_OWNER_PHONE &&
    env.VITE_LEGAL_OWNER_TAX_CODE
  ),
};

/**
 * Kiểm tra xem một trường thông tin có phải là placeholder chờ nhập hay không
 */
export const isLegalPlaceholder = (value?: string | null): boolean => {
  if (!value) return true;
  return value.includes('BLOCKED: OWNER INPUT') || value.includes('Chưa cập nhật');
};

/**
 * Danh mục các trang chính sách bắt buộc phục vụ thông báo Bộ Công Thương
 */
export interface PolicyRouteItem {
  path: string;
  titleVi: string;
  titleEn: string;
  descriptionVi: string;
  descriptionEn: string;
  badge?: string;
}

export const MANDATORY_POLICIES: PolicyRouteItem[] = [
  {
    path: '/terms-of-service',
    titleVi: 'Điều khoản sử dụng dịch vụ',
    titleEn: 'Terms of Service',
    descriptionVi: 'Quy định quyền và trách nhiệm của học viên khi tham gia nền tảng LetStuN.',
    descriptionEn: 'Rights and responsibilities of learners when participating in the LetStuN platform.',
  },
  {
    path: '/privacy-policy',
    titleVi: 'Chính sách bảo mật thông tin',
    titleEn: 'Privacy Policy',
    descriptionVi: 'Mục đích thu thập, bảo vệ và xử lý dữ liệu cá nhân theo quy định pháp luật Việt Nam.',
    descriptionEn: 'Purpose of collection, protection, and processing of personal data under Vietnamese regulations.',
  },
  {
    path: '/payment-policy',
    titleVi: 'Chính sách thanh toán',
    titleEn: 'Payment Policy',
    descriptionVi: 'Quy trình mua, biểu phí, xác nhận thanh toán gói cước Plus/Pro qua VietQR & PayOS.',
    descriptionEn: 'Purchasing process, pricing, payment confirmation for Plus/Pro plans via VietQR & PayOS.',
  },
  {
    path: '/delivery-refund-policy',
    titleVi: 'Chính sách giao nhận & hoàn trả',
    titleEn: 'Delivery & Refund Policy',
    descriptionVi: 'Quy thức cung cấp dịch vụ số, kích hoạt quyền lợi tài khoản và điều kiện hoàn tiền.',
    descriptionEn: 'Digital service delivery, account entitlement activation, and refund terms.',
  },
  {
    path: '/complaint-resolution',
    titleVi: 'Cơ chế giải quyết khiếu nại',
    titleEn: 'Complaint Resolution Policy',
    descriptionVi: 'Quy trình 6 bước tiếp nhận, xử lý thắc mắc, sự cố giao dịch và bảo vệ quyền lợi học viên.',
    descriptionEn: '6-step procedure for receiving, verifying, handling grievances and protecting learner rights.',
  },
];
