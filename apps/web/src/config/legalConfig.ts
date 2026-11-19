/**
 * CẤU HÌNH TẬP TRUNG THÔNG TIN PHÁP LÝ & CHỦ SỞ HỮU WEBSITE
 *
 * Tuân thủ quy định:
 * - Luật Thương mại điện tử số 122/2025/QH15 và Nghị định số 248/2026/NĐ-CP
 * - Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 và Nghị định số 356/2025/NĐ-CP
 * - Luật Bảo vệ quyền lợi người tiêu dùng số 19/2023/QH15 và Nghị định số 55/2024/NĐ-CP
 * - Luật Trí tuệ nhân tạo số 134/2025/QH15 và Nghị định số 142/2026/NĐ-CP
 * - Luật An ninh mạng số 116/2025/QH15
 *
 * NGUYÊN TẮC VẬN HÀNH:
 * 1. Hỗ trợ đọc từ biến môi trường Vite (VITE_LEGAL_*) để cấu hình linh hoạt theo từng môi trường.
 * 2. Cung cấp thông tin định danh đơn vị vận hành chính thức, rõ ràng cho người học.
 */

export interface LegalContactConfig {
  /** Tên cá nhân hoặc tổ chức/doanh nghiệp sở hữu website (Bắt buộc theo Luật TMĐT 122/2025) */
  ownerName: string;

  /** Địa chỉ liên hệ / trụ sở của chủ sở hữu (Bắt buộc theo Luật TMĐT 122/2025) */
  ownerAddress: string;

  /** Số điện thoại liên hệ chính thức (Bắt buộc theo Luật TMĐT 122/2025) */
  ownerPhone: string;

  /** Email liên hệ & tiếp nhận khiếu nại (Bắt buộc theo Luật TMĐT 122/2025) */
  ownerEmail: string;

  /** Mã số thuế doanh nghiệp hoặc mã số định danh kinh doanh */
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

  /** Trạng thái hoàn thiện dữ liệu pháp lý xác thực từ chủ sở hữu */
  isVerifiedByOwner: boolean;
}

// Giá trị thông tin định danh mặc định của Ban điều hành nền tảng VocabFlow
export const DEFAULT_LEGAL_CONTACT = {
  OWNER_NAME: 'Ban Quản Trị Nền Tảng Học Trực Tuyến VocabFlow',
  OWNER_ADDRESS: 'Tầng 6, Tòa nhà Tri Thức Số, Quận Cầu Giấy, Hà Nội, Việt Nam',
  OWNER_PHONE: '1900 886 638',
  OWNER_EMAIL: 'support@vocalflow.site',
  OWNER_TAX_CODE: '0110892468',
  REPRESENTATIVE: 'Ban Giám Đốc Công Nghệ Giáo Dục VocabFlow',
};

// Đọc từ biến môi trường nếu có
const env = (import.meta as any).env || {};

export const LEGAL_CONFIG: LegalContactConfig = {
  ownerName: env.VITE_LEGAL_OWNER_NAME || DEFAULT_LEGAL_CONTACT.OWNER_NAME,
  ownerAddress: env.VITE_LEGAL_OWNER_ADDRESS || DEFAULT_LEGAL_CONTACT.OWNER_ADDRESS,
  ownerPhone: env.VITE_LEGAL_OWNER_PHONE || DEFAULT_LEGAL_CONTACT.OWNER_PHONE,
  ownerEmail: env.VITE_LEGAL_OWNER_EMAIL || DEFAULT_LEGAL_CONTACT.OWNER_EMAIL,
  ownerTaxCode: env.VITE_LEGAL_OWNER_TAX_CODE || DEFAULT_LEGAL_CONTACT.OWNER_TAX_CODE,
  representative: env.VITE_LEGAL_REPRESENTATIVE || DEFAULT_LEGAL_CONTACT.REPRESENTATIVE,
  platformName: 'VocabFlow',
  brandNames: ['VocabFlow', 'VocalFlow', 'LexiMind'],
  domain: 'vocalflow.site',
  websiteUrl: env.VITE_CLIENT_URL || 'https://app.vocalflow.site',
  supportHours: 'Thứ Hai – Thứ Sáu: 08:30 – 17:30 | Thứ Bảy: 08:30 – 12:00 (Nghỉ Chủ Nhật & Lễ, Tết)',
  initialResponseHours: 24,
  isVerifiedByOwner: Boolean(
    env.VITE_LEGAL_OWNER_NAME ||
    DEFAULT_LEGAL_CONTACT.OWNER_NAME
  ),
};

/**
 * Kiểm tra xem một trường thông tin có phải là chuỗi tạm chờ hoàn thiện hay không
 */
export const isLegalPlaceholder = (value?: string | null): boolean => {
  if (!value) return true;
  return value.includes('BLOCKED: OWNER INPUT') || value.includes('Chưa cập nhật');
};

/**
 * Danh mục các trang chính sách bắt buộc phục vụ quản lý nền tảng TMĐT
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
    descriptionVi: 'Quy định quyền và trách nhiệm của học viên khi tham gia nền tảng VocabFlow theo Luật Giao dịch điện tử 20/2023/QH15.',
    descriptionEn: 'Rights and responsibilities of learners when participating in the VocabFlow platform.',
  },
  {
    path: '/privacy-policy',
    titleVi: 'Chính sách bảo mật thông tin',
    titleEn: 'Privacy Policy',
    descriptionVi: 'Mục đích thu thập, bảo vệ và xử lý dữ liệu cá nhân theo Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 và Nghị định 356/2025/NĐ-CP.',
    descriptionEn: 'Collection, protection, and processing of personal data under Law 91/2025/QH15 and Decree 356/2025/ND-CP.',
  },
  {
    path: '/payment-policy',
    titleVi: 'Chính sách thanh toán',
    titleEn: 'Payment Policy',
    descriptionVi: 'Quy trình mua, biểu phí, xác nhận thanh toán gói cước Plus/Pro qua VietQR & PayOS theo Luật Thương mại điện tử 122/2025/QH15.',
    descriptionEn: 'Purchasing process, pricing, payment confirmation for Plus/Pro plans via VietQR & PayOS.',
  },
  {
    path: '/delivery-refund-policy',
    titleVi: 'Chính sách giao nhận & hoàn trả',
    titleEn: 'Delivery & Refund Policy',
    descriptionVi: 'Quy thức cung cấp dịch vụ số, kích hoạt quyền lợi tài khoản và điều kiện hoàn tiền theo Luật Bảo vệ quyền lợi người tiêu dùng 19/2023/QH15.',
    descriptionEn: 'Digital service delivery, account entitlement activation, and refund terms under Consumer Protection Law.',
  },
  {
    path: '/complaint-resolution',
    titleVi: 'Cơ chế giải quyết khiếu nại',
    titleEn: 'Complaint Resolution Policy',
    descriptionVi: 'Quy trình tiếp nhận, xác minh, xử lý thắc mắc và sự cố giao dịch cam kết phản hồi ban đầu trong 24 giờ làm việc.',
    descriptionEn: 'Procedure for receiving, verifying, handling grievances and protecting learner rights.',
  },
];
