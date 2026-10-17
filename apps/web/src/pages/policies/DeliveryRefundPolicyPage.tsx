import React, { useEffect } from 'react';
import { PolicyLayout, TocItem } from '../../components/layout/PolicyLayout';
import { LEGAL_CONFIG } from '../../config/legalConfig';
import { Truck, CheckCircle, RefreshCcw, AlertTriangle, ShieldCheck, Clock, FileCheck } from 'lucide-react';
import { VocabFlowLogo } from '@vocabflow/shared';

const TOC_ITEMS: TocItem[] = [
  { id: 'section-1', title: '1. Bản chất dịch vụ số và phương thức cung cấp' },
  { id: 'section-2', title: '2. Quy trình và thời gian kích hoạt quyền truy cập' },
  { id: 'section-3', title: '3. Phương thức thông báo giao nhận dịch vụ hoàn tất' },
  { id: 'section-4', title: '4. Xử lý sự cố chậm trễ hoặc lỗi truy cập tính năng' },
  { id: 'section-5', title: '5. Cơ chế kết thúc kỳ cước và không tự động gia hạn' },
  { id: 'section-6', title: '6. Điều kiện và trường hợp được hoàn tiền' },
  { id: 'section-7', title: '7. Các trường hợp không áp dụng hoàn tiền' },
  { id: 'section-8', title: '8. Quy trình, phương thức và thời hạn xử lý hoàn tiền' },
];

export const DeliveryRefundPolicyPage: React.FC = () => {
  useEffect(() => {
    document.title = `Chính Sách Giao Nhận & Hoàn Trả — ${LEGAL_CONFIG.platformName}`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        `Chính sách cung cấp dịch vụ số trực tuyến, kích hoạt gói Pro và điều kiện hoàn tiền tại ${LEGAL_CONFIG.platformName}.`
      );
    }
  }, []);

  return (
    <PolicyLayout
      title="Chính Sách Giao Nhận & Hoàn Trả Dịch Vụ Số"
      subtitle="Mô tả phương thức cung cấp dịch vụ trực tuyến, điều kiện kích hoạt tài khoản Plus/Pro và cơ chế hoàn tiền minh bạch."
      currentPath="/delivery-refund-policy"
      toc={TOC_ITEMS}
      lastUpdated="15/10/2026"
      effectiveDate="15/10/2026"
    >
      {/* Intro Alert Box */}
      <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
        <div className="flex items-center gap-2 font-bold text-purple-800 dark:text-purple-400">
          <VocabFlowLogo size="xs" showContainer={false} className="w-5 h-5 object-contain shrink-0" />
          <span>Phương thức cung cấp sản phẩm số trực tuyến (Digital Access Service)</span>
        </div>
        <p>
          {LEGAL_CONFIG.platformName} cung cấp dịch vụ học tiếng Anh trực tuyến và nội dung số dưới hình thức cấp quyền truy cập tính năng tài khoản đám mây.
          Chúng tôi <strong>không kinh doanh hàng hóa vật lý và không sử dụng dịch vụ vận chuyển giao nhận bằng đường bưu chính</strong>.
        </p>
      </div>

      {/* Section 1 */}
      <section id="section-1" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>1. Bản chất dịch vụ số và phương thức cung cấp</span>
        </h2>
        <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Sản phẩm được cung cấp trên nền tảng {LEGAL_CONFIG.platformName} là dịch vụ học tập số (Digital Learning Service) bao gồm:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Quyền sử dụng thuật toán Spaced Repetition (SRS) tối ưu hóa khả năng ghi nhớ dài hạn từ vựng.</li>
            <li>Hạn mức tương tác với Gia sư trí tuệ nhân tạo (AI Tutor Assistant) theo ngày.</li>
            <li>Kho từ vựng chuyên ngành, ngân hàng đề thi chuẩn hóa (Exam Bank) và các bài kiểm tra thích ứng.</li>
            <li>Quyền lưu trữ kho từ vựng cá nhân, tạo bộ thẻ tùy chỉnh và bảo lưu chuỗi Streak.</li>
          </ul>
          <p>
            Quyền lợi được gán trực tiếp vào định danh tài khoản người dùng trên máy chủ của hệ thống thông qua mạng Internet ngay sau khi giao dịch hợp lệ.
          </p>
        </div>
      </section>

      {/* Section 2 */}
      <section id="section-2" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>2. Quy trình và thời gian kích hoạt quyền truy cập</span>
        </h2>
        <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
          <li>
            <strong>Điều kiện kích hoạt:</strong> Giao dịch thanh toán của học viên được ngân hàng xác nhận thành công và hệ thống ghi nhận đúng mã đơn hàng (<code>orderCode</code>).
          </li>
          <li>
            <strong>Thời gian kích hoạt thông thường:</strong> Tức thì sau khi nhận dữ liệu webhook từ ngân hàng hoặc cổng PayOS (thông thường từ <strong>10 giây đến 3 phút</strong>).
          </li>
          <li>
            <strong>Trường hợp phát sinh chậm trễ:</strong> Do nghẽn mạng truyền dẫn liên ngân hàng NAPAS hoặc cổng thanh toán tiến hành kiểm tra đột xuất, thời gian kích hoạt có thể kéo dài tối đa <strong>24 giờ làm việc</strong> kể từ khi học viên cung cấp chứng từ chuyển khoản hợp lệ.
          </li>
        </ul>
      </section>

      {/* Section 3 */}
      <section id="section-3" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>3. Phương thức thông báo giao nhận dịch vụ hoàn tất</span>
        </h2>
        <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>Hệ thống thông báo kết quả kích hoạt dịch vụ tới học viên qua các kênh sau:</p>
          <ol className="list-decimal list-inside space-y-1.5 pl-2">
            <li>
              <strong>Màn hình thanh toán trực tiếp:</strong> Modal thanh toán tự động chuyển sang trạng thái <em>Đã thanh toán thành công</em> và mở khóa toàn bộ quyền lợi ngay lập tức.
            </li>
            <li>
              <strong>Giao diện hồ sơ học viên:</strong> Huy hiệu tài khoản được cập nhật thành <strong>PLUS</strong> hoặc <strong>PRO</strong>, ngày hết hạn được gia hạn chính xác (cộng thêm 30 ngày cho gói tháng hoặc 365 ngày cho gói năm).
            </li>
            <li>
              <strong>Mục Quản lý tài khoản:</strong> Lưu trữ lịch sử giao dịch và trạng thái gói cước để học viên tra cứu bất kỳ lúc nào.
            </li>
          </ol>
        </div>
      </section>

      {/* Section 4 */}
      <section id="section-4" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>4. Xử lý sự cố chậm trễ hoặc lỗi truy cập tính năng</span>
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Nếu học viên đã thanh toán thành công nhưng chưa truy cập được tính năng gói Pro/Plus:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 block">1. Tải lại trang (F5)</span>
            <p className="text-slate-600 dark:text-slate-400">
              Làm mới trang web để trình duyệt cập nhật lại thông tin quyền hạn (Entitlements) mới nhất từ máy chủ.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 block">2. Đăng xuất & Đăng nhập lại</span>
            <p className="text-slate-600 dark:text-slate-400">
              Đăng xuất khỏi tài khoản để cấp mới Access Token mang quyền lợi của gói Plus/Pro.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 block">3. Liên hệ hỗ trợ</span>
            <p className="text-slate-600 dark:text-slate-400">
              Gửi mã đơn hàng (orderCode) về email {LEGAL_CONFIG.ownerEmail} để bộ phận kỹ thuật kích hoạt thủ công.
            </p>
          </div>
        </div>
      </section>

      {/* Section 5 */}
      <section id="section-5" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>5. Cơ chế kết thúc kỳ cước và không tự động gia hạn</span>
        </h2>
        <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            <strong>Đặc tính gói cước:</strong> Toàn bộ các gói dịch vụ tại {LEGAL_CONFIG.platformName} hoạt động trên mô hình <em>trả trước theo từng kỳ hạn sử dụng nhất định</em>.
          </p>
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/70 text-xs space-y-1">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              HỆ THỐNG KHÔNG CÓ CƠ CHẾ TỰ ĐỘNG TRỪ TIỀN GIA HẠN ĐỊNH KỲ (NO AUTO-DEBIT):
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              Hệ thống không lưu trữ bất kỳ thông tin số thẻ tín dụng hoặc quyền trích nợ tự động nào từ tài khoản ngân hàng của học viên.
              Khi hết thời hạn 30 ngày hoặc 365 ngày, tài khoản sẽ tự động chuyển về gói miễn phí (Learner Free) mà không phát sinh bất kỳ khoản nợ nào.
              Học viên hoàn toàn chủ động quyết định việc mua tiếp gói cước mới hay không.
            </p>
          </div>
          <p className="text-xs text-slate-500">
            * <em>Phân biệt rõ:</em> <strong>Hết hạn dịch vụ</strong> là khi gói cước kết thúc thời gian hiệu lực và chuyển về gói Free; <strong>Hủy tài khoản</strong> là khi người dùng yêu cầu đóng vĩnh viễn tài khoản; <strong>Hoàn tiền</strong> là việc gửi trả lại số tiền đã thanh toán theo các điều kiện quy định tại Mục 6.
          </p>
        </div>
      </section>

      {/* Section 6 */}
      <section id="section-6" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>6. Điều kiện và trường hợp được hoàn tiền</span>
        </h2>
        <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>Học viên được xem xét giải quyết hoàn trả 100% chi phí trong các trường hợp cụ thể sau:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>
              <strong>Lỗi hệ thống kỹ thuật từ phía nền tảng:</strong> Học viên đã thanh toán thành công nhưng không thể truy cập hoặc kích hoạt tính năng của gói cước trong vòng <strong>48 giờ liên tục</strong> kể từ thời điểm gửi thông báo sự cố mà đội ngũ kỹ thuật không thể khắc phục.
            </li>
            <li>
              <strong>Thanh toán trùng lặp:</strong> Do nhầm lẫn thao tác hoặc lỗi truyền tín hiệu mạng ngân hàng khiến học viên bị trừ tiền nhiều lần cho cùng một kỳ sử dụng của gói cước.
            </li>
            <li>
              <strong>Chuyển thừa số tiền so với đơn hàng:</strong> Hệ thống sẽ hoàn trả lại số tiền chênh lệch sau khi đã kích hoạt gói cước tương ứng.
            </li>
          </ul>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 mt-2">
            <strong>[LƯU Ý CẦN CHỦ WEBSITE XÁC NHẬN - BLOCKED: OWNER INPUT]:</strong> Chính sách hoàn tiền thương mại khi học viên đổi ý vì lý do cá nhân (Ví dụ: cho phép học viên yêu cầu hoàn tiền trong vòng 03 ngày kể từ ngày thanh toán lần đầu nếu cảm thấy nội dung học tập không phù hợp, với điều kiện mức độ sử dụng chưa vượt quá 10 lượt AI Tutor) cần được Chủ website phê duyệt trước khi chính thức áp dụng.
          </div>
        </div>
      </section>

      {/* Section 7 */}
      <section id="section-7" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>7. Các trường hợp không áp dụng hoàn tiền</span>
        </h2>
        <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
          <li>Yêu cầu hoàn tiền được gửi sau khi thời hạn của gói cước đã hết hoặc vượt quá thời hạn cho phép theo quy định chính sách.</li>
          <li>Học viên chia sẻ tài khoản cho bên thứ ba, cho thuê lại hoặc sử dụng công cụ tự động (bot/crawler) khai thác tài nguyên vi phạm Điều khoản dịch vụ dẫn đến việc tài khoản bị đình chỉ.</li>
          <li>Sự cố xuất phát từ phía thiết bị cá nhân của học viên (thiết bị không có kết nối Internet, trình duyệt lỗi thời không đáp ứng tiêu chuẩn web hiện đại, nhiễm mã độc cá nhân).</li>
        </ul>
      </section>

      {/* Section 8 */}
      <section id="section-8" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>8. Quy trình, phương thức và thời hạn xử lý hoàn tiền</span>
        </h2>
        <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>Khi đủ điều kiện hoàn tiền, quy trình thực hiện như sau:</p>
          <ol className="list-decimal list-inside space-y-1.5 pl-2">
            <li>
              <strong>Gửi yêu cầu:</strong> Học viên gửi email tới <strong>{LEGAL_CONFIG.ownerEmail}</strong> với tiêu đề <code>[Yêu cầu hoàn tiền] - Mã đơn hàng - Email tài khoản</code>, kèm ảnh chụp sao kê hoặc biên lai chuyển khoản.
            </li>
            <li>
              <strong>Tiếp nhận & Xác minh:</strong> Trong vòng <strong>24 - 48 giờ làm việc</strong>, bộ phận hỗ trợ sẽ kiểm tra dữ liệu và phản hồi kết luận xử lý.
            </li>
            <li>
              <strong>Thực hiện chuyển trả:</strong> Tiền hoàn sẽ được chuyển khoản trực tiếp về chính số tài khoản ngân hàng mà học viên đã dùng để chuyển khoản thanh toán trong vòng <strong>3 - 7 ngày làm việc</strong>.
            </li>
          </ol>
        </div>
      </section>
    </PolicyLayout>
  );
};
export default DeliveryRefundPolicyPage;
