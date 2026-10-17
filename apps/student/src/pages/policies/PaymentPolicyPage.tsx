import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PolicyLayout, TocItem } from '../../components/layout/PolicyLayout';
import { LEGAL_CONFIG } from '../../config/legalConfig';
import { CreditCard, QrCode, CheckCircle2, AlertCircle, RefreshCw, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { VocabFlowLogo } from '@vocabflow/shared';

const TOC_ITEMS: TocItem[] = [
  { id: 'section-1', title: '1. Danh mục các gói dịch vụ và biểu phí niêm yết' },
  { id: 'section-2', title: '2. Đơn vị tiền tệ và cấu trúc giá' },
  { id: 'section-3', title: '3. Quy trình chọn gói và thanh toán thực tế' },
  { id: 'section-4', title: '4. Phương thức thanh toán được hỗ trợ' },
  { id: 'section-5', title: '5. Thời gian kích hoạt và xác nhận giao dịch' },
  { id: 'section-6', title: '6. Xử lý sự cố thanh toán thành công nhưng chưa kích hoạt' },
  { id: 'section-7', title: '7. Quy định về giao dịch thất bại, chuyển nhầm và hoàn tiền' },
  { id: 'section-8', title: '8. Hóa đơn, chứng từ giao dịch điện tử và liên hệ hỗ trợ' },
];

export const PaymentPolicyPage: React.FC = () => {
  useEffect(() => {
    document.title = `Chính Sách Thanh Toán — ${LEGAL_CONFIG.platformName}`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        `Chính sách thanh toán, quy trình mua gói cước Plus/Pro, phương thức VietQR và xử lý giao dịch tại ${LEGAL_CONFIG.platformName}.`
      );
    }
  }, []);

  return (
    <PolicyLayout
      title="Chính Sách & Quy Trình Thanh Toán"
      subtitle="Quy định minh bạch về biểu phí niêm yết, phương thức thanh toán VietQR / PayOS và quy trình kích hoạt gói học trực tuyến."
      currentPath="/payment-policy"
      toc={TOC_ITEMS}
      lastUpdated="15/10/2026"
      effectiveDate="15/10/2026"
    >
      {/* Overview Alert */}
      <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
        <div className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-400">
          <VocabFlowLogo size="xs" showContainer={false} className="w-5 h-5 object-contain shrink-0" />
          <span>Thanh toán an toàn, tự động kích hoạt 24/7</span>
        </div>
        <p>
          {LEGAL_CONFIG.platformName} hỗ trợ thanh toán trực tuyến tiện lợi qua chuẩn VietQR chuyển khoản nhanh liên ngân hàng NAPAS 24/7
          và cổng thanh toán PayOS. Hệ thống tự động đối soát giao dịch qua mã chuyển khoản chuyên biệt, kích hoạt ngay lập tức
          mà không cần chờ duyệt thủ công.
        </p>
      </div>

      {/* Section 1 */}
      <section id="section-1" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>1. Danh mục các gói dịch vụ và biểu phí niêm yết</span>
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Hiện tại {LEGAL_CONFIG.platformName} cung cấp các gói dịch vụ học tập với quyền lợi và mức giá công khai như sau:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200">
              <tr>
                <th className="p-3 border-b border-slate-200 dark:border-slate-800">Tên gói cước</th>
                <th className="p-3 border-b border-slate-200 dark:border-slate-800">Gói Tháng (30 ngày)</th>
                <th className="p-3 border-b border-slate-200 dark:border-slate-800">Gói Năm (365 ngày)</th>
                <th className="p-3 border-b border-slate-200 dark:border-slate-800">Quyền lợi nổi bật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
              <tr>
                <td className="p-3 font-bold text-slate-900 dark:text-white">Learner Free</td>
                <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">0 VNĐ</td>
                <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">0 VNĐ</td>
                <td className="p-3">
                  600+ từ vựng TOEIC tiêu chuẩn, thuật toán Spaced Repetition (SRS), phát âm US/UK, 10 lượt AI Tutor/ngày, tối đa 3 bộ thẻ cá nhân.
                </td>
              </tr>
              <tr className="bg-indigo-50/30 dark:bg-indigo-950/20">
                <td className="p-3 font-bold text-indigo-700 dark:text-indigo-400">VocabFlow Plus</td>
                <td className="p-3 font-semibold text-slate-900 dark:text-white">99.000 VNĐ / tháng</td>
                <td className="p-3 font-semibold text-slate-900 dark:text-white">
                  828.000 VNĐ / năm <br />
                  <span className="text-[11px] text-emerald-600 font-normal">(Tiết kiệm ~30%)</span>
                </td>
                <td className="p-3">
                  50 lượt AI Tutor/ngày, tối đa 20 bộ thẻ cá nhân, cảnh báo từ vựng sắp quên (Memory Rescue), 5 lượt AI Story/ngày, bảo lưu chuỗi Streak 3 ngày/tháng, ôn tập không giới hạn.
                </td>
              </tr>
              <tr className="bg-purple-50/30 dark:bg-purple-950/20">
                <td className="p-3 font-bold text-purple-700 dark:text-purple-400">VocabFlow Pro</td>
                <td className="p-3 font-semibold text-slate-900 dark:text-white">199.000 VNĐ / tháng</td>
                <td className="p-3 font-semibold text-slate-900 dark:text-white">
                  1.548.000 VNĐ / năm <br />
                  <span className="text-[11px] text-emerald-600 font-normal">(Tiết kiệm ~35%)</span>
                </td>
                <td className="p-3">
                  200 lượt AI Chuyên Sâu/ngày, 999 bộ thẻ cá nhân, chuẩn đoán năng lực CEFR & AI Coach cá nhân hóa, 20 lượt AI Story/ngày, 50 lượt trích xuất Text-to-Vocab, không giới hạn phục hồi streak, ưu tiên băng thông và hỗ trợ 24/7.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-500 italic">
          * Chi tiết và tính năng các gói có thể xem trực tiếp tại trang{' '}
          <Link to="/upgrade" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">
            Nâng cấp tài khoản (/upgrade)
          </Link>
          .
        </p>
      </section>

      {/* Section 2 */}
      <section id="section-2" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>2. Đơn vị tiền tệ và cấu trúc giá</span>
        </h2>
        <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
          <li><strong>Đơn vị tiền tệ:</strong> Việt Nam Đồng (ký hiệu: VNĐ hoặc đ).</li>
          <li><strong>Thời hạn sử dụng gói:</strong> Gói Tháng có hiệu lực 30 ngày kể từ ngày kích hoạt thành công. Gói Năm có hiệu lực 365 ngày kể từ ngày kích hoạt thành công.</li>
          <li><strong>Cấu trúc giá:</strong> Mức giá niêm yết trên website là giá trọn gói cuối cùng cho kỳ hạn học tập tương ứng. Nền tảng cam kết không phát sinh bất kỳ phụ phí ẩn nào ngoài biểu phí đã công bố.</li>
        </ul>
      </section>

      {/* Section 3 */}
      <section id="section-3" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>3. Quy trình chọn gói và thanh toán thực tế</span>
        </h2>
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>Quy trình mua và kích hoạt gói cước trên website gồm 5 bước:</p>
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>
              <strong>Bước 1 - Đăng nhập tài khoản:</strong> Học viên đăng nhập vào tài khoản {LEGAL_CONFIG.platformName} (hoặc đăng ký tài khoản mới miễn phí).
            </li>
            <li>
              <strong>Bước 2 - Lựa chọn gói dịch vụ:</strong> Truy cập mục <em>Nâng cấp tài khoản</em>, chọn gói cước mong muốn (VocabFlow Plus hoặc VocabFlow Pro) và chọn chu kỳ thanh toán (Theo tháng hoặc Theo năm).
            </li>
            <li>
              <strong>Bước 3 - Xác nhận đơn hàng & Tạo mã thanh toán:</strong> Nhấn nút <em>Nâng cấp ngay</em>. Hệ thống sẽ tạo một đơn hàng thanh toán duy nhất với Mã đơn hàng (<code>orderCode</code>), số tiền chính xác, thông tin tài khoản ngân hàng thụ hưởng và mã QR chuyển khoản VietQR. Đơn hàng có thời gian hiệu lực đếm ngược trong vòng <strong>15 phút</strong>.
            </li>
            <li>
              <strong>Bước 4 - Thực hiện chuyển khoản:</strong> Học viên mở ứng dụng Ngân hàng trên điện thoại (Mobile Banking), quét mã VietQR hoặc chuyển khoản đúng Số tài khoản, Ngân hàng và <em>Nội dung chuyển khoản (transfer memo)</em> theo đúng cú pháp hiển thị.
            </li>
            <li>
              <strong>Bước 5 - Kích hoạt tự động:</strong> Ngay khi ngân hàng ghi nhận giao dịch thành công, Webhook thông minh sẽ tự động cập nhật trạng thái đơn hàng thành <code>PAID</code>, nâng cấp gói và gia hạn ngày hết hạn (<code>currentPeriodEnd</code>) cho tài khoản của học viên trong vòng 10 giây đến 2 phút.
            </li>
          </ol>
        </div>
      </section>

      {/* Section 4 */}
      <section id="section-4" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>4. Phương thức thanh toán được hỗ trợ</span>
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Nền tảng hỗ trợ các phương thức thanh toán an toàn, không lưu trữ thông tin thẻ bảo mật của người dùng:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <QrCode className="w-4 h-4 text-indigo-500" />
              <span>Chuyển khoản nhanh qua VietQR (NAPAS 24/7)</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Hỗ trợ 100% ứng dụng Mobile Banking của tất cả các ngân hàng thương mại tại Việt Nam (Vietcombank, MB Bank, Techcombank, VPBank, ACB, BIDV, Agribank...). Học viên quét mã QR tự động điền đúng số tiền và nội dung chuyển khoản.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <CreditCard className="w-4 h-4 text-indigo-500" />
              <span>Cổng thanh toán PayOS</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Giải pháp cổng thanh toán chuẩn quốc gia hỗ trợ tạo link thanh toán động, thanh toán quét mã QR chuẩn Open Banking với đối soát tự động theo thời gian thực.
            </p>
          </div>
        </div>
      </section>

      {/* Section 5 */}
      <section id="section-5" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>5. Thời gian kích hoạt và xác nhận giao dịch</span>
        </h2>
        <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
          <li><strong>Thời gian kích hoạt thông thường:</strong> Tức thì sau khi hệ thống nhận webhook xác nhận từ ngân hàng (thông thường từ 10 giây đến tối đa 3 phút).</li>
          <li><strong>Xác nhận giao dịch:</strong> Màn hình thanh toán sẽ tự động chuyển sang thông báo <em>Thanh toán thành công</em>, huy hiệu tài khoản chuyển sang PLUS hoặc PRO và ngày hết hạn được cập nhật trong mục Cài đặt tài khoản.</li>
          <li><strong>Cơ chế trả trước (Không tự động trừ tiền):</strong> Các gói dịch vụ tại {LEGAL_CONFIG.platformName} hoạt động theo hình thức trả trước cho từng kỳ hạn (30 ngày hoặc 365 ngày). Hệ thống <strong>không lưu thông tin thẻ để tự động trừ tiền định kỳ (No Auto-Debit)</strong>. Khi hết hạn, học viên hoàn toàn chủ động quyết định việc mua tiếp gói cước mới hay chuyển về gói Learner Free.</li>
        </ul>
      </section>

      {/* Section 6 */}
      <section id="section-6" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>6. Xử lý sự cố thanh toán thành công nhưng chưa kích hoạt</span>
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Trong trường hợp học viên đã hoàn tất chuyển khoản nhưng sau 5 phút tài khoản chưa được nâng cấp:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-2">
          <li>
            <strong>Nhấn nút kiểm tra lại:</strong> Nhấn nút <em>Kiểm tra thanh toán</em> trên modal thanh toán để hệ thống truy vấn lại trạng thái đơn hàng từ ngân hàng.
          </li>
          <li>
            <strong>Kiểm tra nội dung chuyển khoản:</strong> Nếu học viên quên điền hoặc điền sai cú pháp nội dung chuyển khoản, ngân hàng sẽ không thể tự động khớp mã đơn.
          </li>
          <li>
            <strong>Liên hệ hỗ trợ khẩn cấp:</strong> Học viên gửi ảnh chụp màn hình biên lai chuyển khoản thành công kèm Mã đơn hàng (<code>orderCode</code>) hoặc Email đăng ký tài khoản tới email{' '}
            <a href={`mailto:${LEGAL_CONFIG.ownerEmail}`} className="text-indigo-600 dark:text-indigo-400 font-semibold underline">
              {LEGAL_CONFIG.ownerEmail}
            </a>{' '}
            hoặc hotline <strong>{LEGAL_CONFIG.ownerPhone}</strong>. Đội ngũ kỹ thuật sẽ xác minh biến động tài khoản và kích hoạt tài khoản thủ công trong vòng <strong>30 phút - 2 giờ làm việc</strong>.
          </li>
        </ol>
      </section>

      {/* Section 7 */}
      <section id="section-7" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>7. Quy định về giao dịch thất bại, chuyển nhầm và hoàn tiền</span>
        </h2>
        <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            <strong>Trường hợp giao dịch trùng lặp:</strong> Nếu học viên thực hiện chuyển khoản 2 lần cho cùng 1 đơn hàng, học viên có quyền chọn:
          </p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>Quy đổi số tiền trùng lặp để kéo dài thêm thời hạn gói dịch vụ tương ứng.</li>
            <li>Hoàn trả 100% số tiền đã chuyển dư về số tài khoản ngân hàng của học viên trong vòng 3 - 5 ngày làm việc.</li>
          </ul>
          <p className="pt-2">
            <strong>Trường hợp lỗi hệ thống không thể cung cấp dịch vụ:</strong> Nếu sau 48 giờ kể từ khi thanh toán thành công mà hệ thống gặp sự cố kỹ thuật không thể cung cấp dịch vụ cho học viên, chúng tôi sẽ hoàn trả 100% số tiền học viên đã thanh toán.
          </p>
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300">
            <strong>[LƯU Ý CẦN CHỦ WEBSITE XÁC NHẬN - BLOCKED: OWNER INPUT]:</strong> Chính sách hoàn tiền thương mại trong trường hợp học viên đổi ý sau khi đã kích hoạt dịch vụ (ví dụ: thời hạn yêu cầu hoàn tiền trong 3 ngày đầu nếu không hài lòng, mức khấu trừ phí giao dịch nếu có) cần được Chủ website phê duyệt văn bản trước khi công bố áp dụng chính thức.
          </div>
        </div>
      </section>

      {/* Section 8 */}
      <section id="section-8" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>8. Chứng từ giao dịch điện tử và liên hệ hỗ trợ</span>
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Mỗi giao dịch thanh toán thành công đều được gán mã giao dịch điện tử duy nhất và lưu vết trong cơ sở dữ liệu hệ thống. Học viên có thể yêu cầu cung cấp xác nhận thanh toán điện tử qua email.
        </p>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs space-y-1.5">
          <p><strong>Bộ phận hỗ trợ thanh toán:</strong> {LEGAL_CONFIG.platformName}</p>
          <p><strong>Hotline tiếp nhận:</strong> {LEGAL_CONFIG.ownerPhone}</p>
          <p>
            <strong>Email:</strong>{' '}
            <a href={`mailto:${LEGAL_CONFIG.ownerEmail}`} className="text-indigo-600 dark:text-indigo-400 font-bold underline">
              {LEGAL_CONFIG.ownerEmail}
            </a>
          </p>
          <p><strong>Khung giờ hỗ trợ giao dịch:</strong> {LEGAL_CONFIG.supportHours}</p>
        </div>
      </section>
    </PolicyLayout>
  );
};
export default PaymentPolicyPage;
