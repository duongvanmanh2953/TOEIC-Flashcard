import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PolicyLayout, TocItem } from '../../components/layout/PolicyLayout';
import { LEGAL_CONFIG } from '../../config/legalConfig';
import { AlertCircle, CheckCircle2, Clock, Mail, Phone, MessageSquare, ShieldAlert, Scale, HelpCircle } from 'lucide-react';
import { LetStuNLogo } from '@letstun/shared';

const TOC_ITEMS: TocItem[] = [
  { id: 'section-1', title: '1. Nguyên tắc giải quyết khiếu nại & tranh chấp' },
  { id: 'section-2', title: '2. Các tình huống tiếp nhận khiếu nại' },
  { id: 'section-3', title: '3. Kênh tiếp nhận và thông tin cần cung cấp' },
  { id: 'section-4', title: '4. Quy trình 6 bước tiếp nhận và xử lý khiếu nại' },
  { id: 'section-5', title: '5. Thời hạn xử lý cam kết theo từng giai đoạn' },
  { id: 'section-6', title: '6. Bảo mật thông tin khiếu nại' },
  { id: 'section-7', title: '7. Thẩm quyền và cơ chế giải quyết tranh chấp pháp lý' },
];

export const ComplaintResolutionPage: React.FC = () => {
  useEffect(() => {
    document.title = `Cơ Chế Giải Quyết Khiếu Nại — ${LEGAL_CONFIG.platformName}`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        `Chính sách và quy trình tiếp nhận, xử lý khiếu nại của học viên trên nền tảng ${LEGAL_CONFIG.platformName} theo quy định pháp luật Việt Nam.`
      );
    }
  }, []);

  return (
    <PolicyLayout
      title="Chính Sách & Quy Trình Giải Quyết Khiếu Nại"
      subtitle="Quy trình 6 bước minh bạch, công bằng nhằm tiếp nhận, xác minh và giải quyết thỏa đáng mọi khiếu nại của học viên."
      currentPath="/complaint-resolution"
      toc={TOC_ITEMS}
      lastUpdated="15/10/2026"
      effectiveDate="15/10/2026"
    >
      {/* Overview Alert */}
      <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-400">
          <LetStuNLogo size="xs" showContainer={false} className="w-5 h-5 object-contain shrink-0" />
          <span>Cam kết bảo vệ quyền lợi chính đáng của học viên</span>
        </div>
        <p>
          {LEGAL_CONFIG.platformName} luôn đặt trải nghiệm học tập và quyền lợi của học viên lên hàng đầu.
          Mọi thắc mắc, khiếu nại hoặc tranh chấp phát sinh trong quá trình sử dụng dịch vụ đều được tiếp nhận,
          lắng nghe và xử lý trên tinh thần thương lượng, thiện chí, tôn trọng pháp luật và bảo đảm sự công bằng.
        </p>
      </div>

      {/* Section 1 */}
      <section id="section-1" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>1. Nguyên tắc giải quyết khiếu nại & tranh chấp</span>
        </h2>
        <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
          <li><strong>Bình đẳng và tôn trọng:</strong> Mọi ý kiến phản hồi và khiếu nại của học viên đều được ghi nhận nghiêm túc, đối xử bình đẳng và phản hồi kịp thời.</li>
          <li><strong>Minh bạch và có căn cứ:</strong> Quá trình xác minh dựa trên nhật ký hệ thống (system logs), dữ liệu giao dịch ngân hàng và đối chiếu trực tiếp với các điều khoản đã công bố.</li>
          <li><strong>Bảo vệ quyền lợi người tiêu dùng:</strong> Tuân thủ nghiêm túc các quy định của Luật Bảo vệ quyền lợi người tiêu dùng và Nghị định 52/2013/NĐ-CP về Thương mại điện tử.</li>
        </ul>
      </section>

      {/* Section 2 */}
      <section id="section-2" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>2. Các tình huống tiếp nhận khiếu nại</span>
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Chúng tôi tiếp nhận và giải quyết toàn bộ các vấn đề phát sinh bao gồm:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">Lỗi tài khoản & đăng nhập</span>
            <p className="text-slate-600 dark:text-slate-400">
              Không đăng nhập được, lỗi xác thực email, không khôi phục được mật khẩu hoặc tài khoản bị khóa không rõ lý do.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">Sự cố thanh toán & kích hoạt Pro</span>
            <p className="text-slate-600 dark:text-slate-400">
              Đã chuyển khoản thành công nhưng tài khoản chưa được kích hoạt, chuyển tiền trùng lặp hoặc sai nội dung chuyển khoản.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">Nội dung học tập & Tính năng</span>
            <p className="text-slate-600 dark:text-slate-400">
              Lỗi hiển thị bộ thẻ từ vựng, lỗi thuật toán lặp lại Spaced Repetition (SRS), mất dữ liệu chuỗi Streak hoặc điểm XP.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">Dữ liệu cá nhân & Hoàn tiền</span>
            <p className="text-slate-600 dark:text-slate-400">
              Yêu cầu hoàn trả chi phí do lỗi kỹ thuật không thể khắc phục, hoặc khiếu nại về thu thập và xử lý dữ liệu cá nhân.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3 */}
      <section id="section-3" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>3. Kênh tiếp nhận và thông tin cần cung cấp</span>
        </h2>
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>Học viên có thể gửi khiếu nại qua các kênh chính thức sau:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>
              <strong>Email hỗ trợ:</strong>{' '}
              <a href={`mailto:${LEGAL_CONFIG.ownerEmail}`} className="text-indigo-600 dark:text-indigo-400 font-semibold underline">
                {LEGAL_CONFIG.ownerEmail}
              </a>
            </li>
            <li>
              <strong>Cổng góp ý & khiếu nại trực tuyến:</strong> Truy cập{' '}
              <Link to="/feedback" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">
                Cổng phản hồi (/feedback)
              </Link>{' '}
              để gửi phiếu yêu cầu có mã ticket theo dõi.
            </li>
            <li>
              <strong>Hotline hỗ trợ:</strong> {LEGAL_CONFIG.ownerPhone} (trong giờ làm việc: {LEGAL_CONFIG.supportHours}).
            </li>
          </ul>

          <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Lưu ý quan trọng về thông tin cần cung cấp</span>
            </div>
            <p>
              Để được hỗ trợ nhanh nhất, học viên vui lòng cung cấp: <strong>Email đăng ký tài khoản</strong>, <strong>Mô tả chi tiết sự cố gặp phải</strong>, <strong>Ảnh chụp màn hình lỗi</strong> và <strong>Mã đơn hàng (nếu khiếu nại thanh toán)</strong>.
            </p>
            <p className="font-bold text-red-600 dark:text-red-400">
              TUYỆT ĐỐI KHÔNG GỬI MẬT KHẨU TÀI KHOẢN HOẶC MÃ OTP NGÂN HÀNG. Nhân viên hỗ trợ không bao giờ yêu cầu học viên cung cấp mật khẩu.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4 */}
      <section id="section-4" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>4. Quy trình 6 bước tiếp nhận và xử lý khiếu nại</span>
        </h2>
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <ol className="list-decimal list-inside space-y-2.5 pl-2">
            <li>
              <strong>Bước 1 - Gửi yêu cầu khiếu nại:</strong> Học viên gửi thông tin qua email hoặc form hỗ trợ trên website kèm bằng chứng liên quan.
            </li>
            <li>
              <strong>Bước 2 - Xác nhận tiếp nhận:</strong> Trong vòng <strong>24 giờ làm việc</strong>, hệ thống tự động hoặc nhân viên chăm sóc khách hàng gửi văn bản/email xác nhận đã tiếp nhận khiếu nại, cung cấp mã hồ sơ để theo dõi.
            </li>
            <li>
              <strong>Bước 3 - Xác minh và kiểm tra kỹ thuật:</strong> Bộ phận phụ trách tiến hành đối soát lịch sử tài khoản, log hệ thống và biến động ngân hàng liên quan để làm rõ nguyên nhân.
            </li>
            <li>
              <strong>Bước 4 - Đề xuất phương án giải quyết:</strong> Trong vòng <strong>24 - 48 giờ tiếp theo</strong>, nhân viên gửi email thông báo kết quả kiểm tra kèm phương án giải quyết (Kích hoạt bổ sung, gia hạn bù thời gian, điều chỉnh dữ liệu học tập hoặc thực hiện hoàn tiền).
            </li>
            <li>
              <strong>Bước 5 - Triển khai thực hiện:</strong> Sau khi học viên thống nhất phương án, kỹ thuật viên tiến hành khắc phục lỗi hoặc thực hiện thủ tục chuyển tiền hoàn trả.
            </li>
            <li>
              <strong>Bước 6 - Đóng hồ sơ và tiếp nhận đánh giá:</strong> Xác nhận lại sự hài lòng của học viên và chính thức đóng phiếu hỗ trợ. Nếu học viên chưa đồng thuận, hồ sơ sẽ được chuyển lên cấp quản lý cao hơn để xem xét lại.
            </li>
          </ol>
        </div>
      </section>

      {/* Section 5 */}
      <section id="section-5" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>5. Thời hạn xử lý cam kết theo từng giai đoạn</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200">
              <tr>
                <th className="p-2.5 border-b border-slate-200 dark:border-slate-800">Giai đoạn xử lý</th>
                <th className="p-2.5 border-b border-slate-200 dark:border-slate-800">Thời hạn xử lý dự kiến</th>
                <th className="p-2.5 border-b border-slate-200 dark:border-slate-800">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
              <tr>
                <td className="p-2.5 font-semibold">Xác nhận tiếp nhận khiếu nại</td>
                <td className="p-2.5 font-bold text-indigo-600 dark:text-indigo-400">Tối đa 24 giờ</td>
                <td className="p-2.5">Gửi email thông báo hoặc cập nhật trạng thái phiếu hỗ trợ</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">Xác minh lỗi thanh toán / kích hoạt</td>
                <td className="p-2.5 font-bold text-indigo-600 dark:text-indigo-400">1 - 4 giờ làm việc</td>
                <td className="p-2.5">Xử lý ngay trong ca trực khi có đủ biên lai ngân hàng</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">Thông báo phương án giải quyết dứt điểm</td>
                <td className="p-2.5 font-bold text-indigo-600 dark:text-indigo-400">24 - 72 giờ làm việc</td>
                <td className="p-2.5">[BLOCKED: OWNER INPUT - Cần chủ website phê duyệt thời hạn SLA]</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">Thực hiện hoàn tiền (nếu đủ điều kiện)</td>
                <td className="p-2.5 font-bold text-indigo-600 dark:text-indigo-400">3 - 7 ngày làm việc</td>
                <td className="p-2.5">Phụ thuộc vào thời gian xử lý lệnh của ngân hàng tiếp nhận</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 6 */}
      <section id="section-6" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>6. Bảo mật thông tin khiếu nại</span>
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Toàn bộ thông tin cá nhân, nội dung khiếu nại và chứng từ giao dịch do học viên cung cấp trong quá trình giải quyết khiếu nại
          được bảo mật tuyệt đối, chỉ phục vụ mục đích kiểm tra và xử lý sự cố, không cung cấp cho bất kỳ bên thứ ba nào khi chưa có sự đồng ý của học viên
          (trừ trường hợp cơ quan nhà nước có thẩm quyền yêu cầu).
        </p>
      </section>

      {/* Section 7 */}
      <section id="section-7" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>7. Thẩm quyền và cơ chế giải quyết tranh chấp pháp lý</span>
        </h2>
        <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Mọi tranh chấp phát sinh từ hoặc liên quan đến việc sử dụng dịch vụ trên website {LEGAL_CONFIG.platformName} trước hết sẽ được giải quyết thông qua thương lượng và hòa giải giữa các bên.
          </p>
          <p>
            Trong trường hợp tranh chấp không thể giải quyết thông qua thương lượng hòa giải trong vòng <strong>60 ngày</strong> kể từ ngày một bên đưa ra thông báo tranh chấp, bất kỳ bên nào cũng có quyền đưa vụ việc ra Tòa án nhân dân có thẩm quyền tại Việt Nam để giải quyết theo quy định của pháp luật Việt Nam.
          </p>
        </div>
      </section>
    </PolicyLayout>
  );
};
export default ComplaintResolutionPage;
