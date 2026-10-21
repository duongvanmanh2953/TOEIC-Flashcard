import React, { useEffect } from 'react';
import { PolicyLayout, TocItem } from '../../components/layout/PolicyLayout';
import { LEGAL_CONFIG } from '../../config/legalConfig';
import { Shield, Lock, Database, Eye, Share2, UserCheck, AlertTriangle, HelpCircle } from 'lucide-react';
import { VocabFlowLogo } from '@vocabflow/shared';

const TOC_ITEMS: TocItem[] = [
  { id: 'section-1', title: '1. Đơn vị kiểm soát và xử lý dữ liệu' },
  { id: 'section-2', title: '2. Các loại dữ liệu cá nhân thu thập' },
  { id: 'section-3', title: '3. Mục đích thu thập và sử dụng dữ liệu' },
  { id: 'section-4', title: '4. Biện pháp lưu trữ và bảo mật dữ liệu' },
  { id: 'section-5', title: '5. Sử dụng Cookie và công nghệ lưu trữ trình duyệt' },
  { id: 'section-6', title: '6. Chia sẻ dữ liệu với bên thứ ba' },
  { id: 'section-7', title: '7. Thời hạn lưu trữ và quy trình xóa dữ liệu' },
  { id: 'section-8', title: '8. Quyền và nghĩa vụ của chủ thể dữ liệu' },
  { id: 'section-9', title: '9. Quy trình ứng phó và thông báo sự cố dữ liệu' },
  { id: 'section-10', title: '10. Kênh liên hệ và tiếp nhận yêu cầu về quyền riêng tư' },
];

export const PrivacyPolicyPage: React.FC = () => {
  useEffect(() => {
    document.title = `Chính Sách Bảo Mật Thông Tin — ${LEGAL_CONFIG.platformName}`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        `Chính sách bảo mật thông tin cá nhân của ${LEGAL_CONFIG.platformName} theo quy định pháp luật Việt Nam và Nghị định 13/2023/NĐ-CP.`
      );
    }
  }, []);

  return (
    <PolicyLayout
      title="Chính Sách Bảo Mật Thông Tin Cá Nhân"
      subtitle="Cam kết minh bạch về thu thập, sử dụng, lưu trữ và bảo vệ dữ liệu học viên theo Nghị định 52/2013/NĐ-CP và Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân."
      currentPath="/privacy-policy"
      toc={TOC_ITEMS}
      lastUpdated="15/10/2026"
      effectiveDate="15/10/2026"
    >
      {/* Intro box */}
      <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
        <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-400">
          <VocabFlowLogo size="xs" showContainer={false} className="w-5 h-5 object-contain shrink-0" />
          <span>Cam kết bảo vệ quyền riêng tư của học viên</span>
        </div>
        <p>
          {LEGAL_CONFIG.platformName} tôn trọng và cam kết bảo vệ dữ liệu cá nhân của mọi học viên tham gia học tập trên nền tảng.
          Chính sách này công khai rõ ràng cách thức thu thập, mục đích sử dụng, phạm vi chia sẻ và cơ chế bảo vệ thông tin
          theo đúng quy định của pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.
        </p>
      </div>

      {/* Section 1 */}
      <section id="section-1" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>1. Đơn vị kiểm soát và xử lý dữ liệu</span>
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Đơn vị trực tiếp quản lý, vận hành và chịu trách nhiệm bảo mật dữ liệu trên nền tảng {LEGAL_CONFIG.platformName}:
        </p>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs space-y-2">
          <p>
            <strong>Chủ sở hữu / Đơn vị vận hành:</strong>{' '}
            <span className="text-slate-800 dark:text-slate-200">{LEGAL_CONFIG.ownerName}</span>
          </p>
          <p>
            <strong>Địa chỉ liên hệ:</strong>{' '}
            <span className="text-slate-800 dark:text-slate-200">{LEGAL_CONFIG.ownerAddress}</span>
          </p>
          <p>
            <strong>Số điện thoại:</strong>{' '}
            <span className="text-slate-800 dark:text-slate-200">{LEGAL_CONFIG.ownerPhone}</span>
          </p>
          <p>
            <strong>Email tiếp nhận pháp lý & bảo mật:</strong>{' '}
            <a href={`mailto:${LEGAL_CONFIG.ownerEmail}`} className="text-indigo-600 dark:text-indigo-400 font-semibold underline">
              {LEGAL_CONFIG.ownerEmail}
            </a>
          </p>
          <p>
            <strong>Mã số thuế:</strong>{' '}
            <span className="text-slate-800 dark:text-slate-200">{LEGAL_CONFIG.ownerTaxCode}</span>
          </p>
        </div>
      </section>

      {/* Section 2 */}
      <section id="section-2" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>2. Các loại dữ liệu cá nhân thu thập thực tế</span>
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Nền tảng chỉ thu thập các trường dữ liệu cần thiết tối thiểu nhằm phục vụ tính năng học tập và quản lý dịch vụ:
        </p>
        <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
          <li>
            <strong>Thông tin tài khoản định danh:</strong> Họ và tên hiển thị, địa chỉ email, mật khẩu truy cập (được băm bảo mật một chiều bằng thuật toán mã hóa bcrypt; hệ thống không thể đọc được mật khẩu dạng văn bản gốc), ảnh đại diện (nếu học viên đồng bộ từ tài khoản Google/Facebook).
          </li>
          <li>
            <strong>Dữ liệu học tập & tiến độ tiếp thu:</strong> Danh sách từ vựng cá nhân đã lưu trữ, trạng thái ghi nhớ của từ (New, Learning, Familiar, Review, Strong, Mastered), các hệ số thuật toán Spaced Repetition (SRS), chuỗi ngày học Streak, điểm kinh nghiệm XP, lịch sử làm đề thi thử (Exam Bank) và ghi chú học tập.
          </li>
          <li>
            <strong>Dữ liệu tương tác AI Tutor:</strong> Các câu hỏi ngữ pháp, câu lệnh trích xuất từ vựng và đoạn hội thoại trao đổi giữa học viên với trợ lý AI Tutor trong khuôn khổ nội dung học tập.
          </li>
          <li>
            <strong>Dữ liệu giao dịch và đơn hàng:</strong> Mã đơn thanh toán (<code>orderCode</code>), gói dịch vụ chọn mua (Plus hoặc Pro), số tiền thanh toán, thời gian giao dịch, trạng thái đơn hàng. <em>Lưu ý: Hệ thống không lưu trữ bất kỳ thông tin số thẻ tín dụng, mã CVV hay mật khẩu ngân hàng của học viên.</em>
          </li>
          <li>
            <strong>Dữ liệu kỹ thuật & nhật ký bảo mật:</strong> Địa chỉ IP truy cập, định danh phiên làm việc, loại trình duyệt, hệ điều hành nhằm phát hiện đăng nhập trái phép và đảm bảo an toàn tài khoản.
          </li>
        </ul>
      </section>

      {/* Section 3 */}
      <section id="section-3" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>3. Mục đích thu thập và sử dụng dữ liệu</span>
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Dữ liệu thu thập được sử dụng riêng cho các mục đích hợp pháp sau:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 block">Cung cấp dịch vụ cốt lõi</span>
            <p className="text-slate-600 dark:text-slate-300">
              Tạo và duy trì tài khoản học viên, đồng bộ tiến độ học tập trên các thiết bị, cá nhân hóa thuật toán Spaced Repetition (SRS).
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 block">Quản trị giao dịch & Nâng cấp Pro</span>
            <p className="text-slate-600 dark:text-slate-300">
              Xác thực thanh toán gói cước Plus/Pro, kích hoạt quyền lợi tài khoản và đối soát đơn hàng khi học viên cần hỗ trợ.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 block">Hỗ trợ & Giải quyết khiếu nại</span>
            <p className="text-slate-600 dark:text-slate-300">
              Tiếp nhận thắc mắc, khắc phục lỗi kỹ thuật, tra soát biến động số dư và phản hồi ý kiến đóng góp của học viên.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 block">An toàn và tuân thủ pháp luật</span>
            <p className="text-slate-600 dark:text-slate-300">
              Ngăn chặn các hành vi tấn công DDoS, quét dữ liệu trái phép (scraping) và tuân thủ nghĩa vụ theo pháp luật Việt Nam.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4 */}
      <section id="section-4" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>4. Biện pháp lưu trữ và bảo mật dữ liệu</span>
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Chúng tôi áp dụng các tiêu chuẩn an toàn kỹ thuật phù hợp với thực tế hạ tầng của hệ thống:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
          <li>
            <strong>Mã hóa đường truyền:</strong> Toàn bộ dữ liệu giao tiếp giữa trình duyệt của học viên và máy chủ đều được mã hóa bằng giao thức HTTPS/TLS tiêu chuẩn cao.
          </li>
          <li>
            <strong>Bảo vệ mật khẩu:</strong> Mật khẩu người dùng được băm (hash) một chiều bằng thư viện bcrypt trước khi lưu vào cơ sở dữ liệu PostgreSQL. Nhân viên kỹ thuật và quản trị viên không thể giải mã để xem mật khẩu thật.
          </li>
          <li>
            <strong>Phân quyền truy cập nội bộ (RBAC):</strong> Cơ sở dữ liệu và API quản trị được phân tầng nghiêm ngặt (USER, ADMIN, SUPER_ADMIN). Chỉ các yêu cầu được xác thực với JSON Web Token (JWT) hợp lệ mới có quyền truy cập dữ liệu tương ứng.
          </li>
          <li>
            <strong>Lưu trữ cách ly:</strong> Cơ sở dữ liệu vận hành trong phân vùng mạng nội bộ được kiểm soát tường lửa chặt chẽ.
          </li>
        </ul>
      </section>

      {/* Section 5 */}
      <section id="section-5" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>5. Sử dụng Cookie và công nghệ lưu trữ trình duyệt</span>
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Website sử dụng cơ chế lưu trữ cục bộ của trình duyệt (<code>localStorage</code>) nhằm duy trì phiên đăng nhập và ghi nhớ tùy chọn cá nhân:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <thead className="bg-slate-100 dark:bg-slate-800/80 font-bold text-slate-700 dark:text-slate-300">
              <tr>
                <th className="p-2.5 border-b border-slate-200 dark:border-slate-800">Khóa lưu trữ</th>
                <th className="p-2.5 border-b border-slate-200 dark:border-slate-800">Mục đích</th>
                <th className="p-2.5 border-b border-slate-200 dark:border-slate-800">Thời hạn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-400">
              <tr>
                <td className="p-2.5 font-mono text-[11px]">vocabflow_token</td>
                <td className="p-2.5">Lưu trữ JWT token để xác thực phiên đăng nhập an toàn</td>
                <td className="p-2.5">Cho đến khi đăng xuất hoặc hết hạn phiên</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono text-[11px]">vocabflow_theme</td>
                <td className="p-2.5">Ghi nhớ giao diện Sáng (Light) hoặc Tối (Dark) theo mắt học viên</td>
                <td className="p-2.5">Vĩnh viễn trên trình duyệt</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono text-[11px]">vocabflow_locale</td>
                <td className="p-2.5">Ghi nhớ lựa chọn ngôn ngữ hiển thị (Tiếng Việt / Tiếng Anh)</td>
                <td className="p-2.5">Vĩnh viễn trên trình duyệt</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 italic">
          * Website cam kết không sử dụng cookie theo dõi hành vi xuyên nền tảng (third-party tracking cookies) để bán dữ liệu cho các mạng lưới quảng cáo thương mại.
        </p>
      </section>

      {/* Section 6 */}
      <section id="section-6" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>6. Chia sẻ dữ liệu với bên thứ ba</span>
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {LEGAL_CONFIG.platformName} tuyệt đối không bán hoặc trao đổi dữ liệu cá nhân của học viên cho bất kỳ bên thứ ba nào vì mục đích quảng cáo. Dữ liệu chỉ được chia sẻ trong phạm vi kỹ thuật cần thiết để vận hành dịch vụ:
        </p>
        <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
          <li>
            <strong>Firebase Authentication (Google LLC):</strong> Hỗ trợ quy trình đăng nhập nhanh qua tài khoản Google OAuth an toàn.
          </li>
          <li>
            <strong>Hạ tầng thanh toán ngân hàng (Cổng PayOS / Mạng lưới VietQR NAPAS):</strong> Tiếp nhận thông tin mã đơn hàng, số tiền và nội dung chuyển khoản để đối soát trạng thái giao dịch tự động qua webhook an toàn.
          </li>
          <li>
            <strong>Nhà cung cấp mô hình Trí tuệ Nhân tạo (Google AI Gemini, OpenAI, DeepSeek, Anthropic):</strong> Nhận dữ liệu câu hỏi học tập, từ vựng và câu lệnh để tạo phản hồi giải thích ngữ pháp hoặc dệt câu chuyện. Chúng tôi chỉ gửi nội dung truy vấn học tập, <em>tuyệt đối không gửi thông tin định danh cá nhân, email hoặc mật khẩu sang các dịch vụ AI</em>.
          </li>
          <li>
            <strong>Cơ quan nhà nước có thẩm quyền:</strong> Khi có yêu cầu bằng văn bản hợp pháp từ cơ quan điều tra hoặc cơ quan quản lý nhà nước theo luật định.
          </li>
        </ul>
      </section>

      {/* Section 7 */}
      <section id="section-7" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>7. Thời hạn lưu trữ và quy trình xóa dữ liệu</span>
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          - Dữ liệu cá nhân và tiến độ học tập được lưu trữ trong suốt thời gian học viên duy trì tài khoản trên hệ thống.
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          - Khi học viên có nhu cầu chấm dứt sử dụng và xóa bỏ vĩnh viễn dữ liệu, học viên có thể gửi yêu cầu về email{' '}
          <a href={`mailto:${LEGAL_CONFIG.ownerEmail}`} className="text-indigo-600 dark:text-indigo-400 font-semibold underline">
            {LEGAL_CONFIG.ownerEmail}
          </a>
          . Sau khi xác minh quyền sở hữu tài khoản, hệ thống sẽ tiến hành xóa hoặc ẩn danh hóa toàn bộ thông tin cá nhân trong vòng tối đa 30 ngày làm việc.
        </p>
      </section>

      {/* Section 8 */}
      <section id="section-8" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>8. Quyền và nghĩa vụ của chủ thể dữ liệu</span>
        </h2>
        <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Căn cứ theo Nghị định số 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân, học viên có đầy đủ các quyền:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-1">
            <li>Quyền được biết về hoạt động xử lý dữ liệu cá nhân của mình.</li>
            <li>Quyền đồng ý hoặc không đồng ý cho phép xử lý dữ liệu cá nhân.</li>
            <li>Quyền truy cập để xem, chỉnh sửa thông tin cá nhân trong mục Cài đặt tài khoản.</li>
            <li>Quyền rút lại sự đồng ý hoặc yêu cầu xóa dữ liệu cá nhân.</li>
            <li>Quyền khiếu nại, tố cáo khi phát hiện hành vi xâm phạm dữ liệu.</li>
          </ul>
        </div>
      </section>

      {/* Section 9 */}
      <section id="section-9" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>9. Quy trình ứng phó và thông báo sự cố dữ liệu</span>
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Trong trường hợp phát hiện sự cố an ninh mạng dẫn đến nguy cơ rò rỉ dữ liệu cá nhân của học viên, ban quản trị {LEGAL_CONFIG.platformName} sẽ:
        </p>
        <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
          <li>Lập tức kích hoạt quy trình cô lập hệ thống, khóa phiên truy cập đáng ngờ và khắc phục lỗ hổng kỹ thuật.</li>
          <li>Thông báo cho Cục An toàn thông tin (Bộ Thông tin và Truyền thông) và Cục An ninh mạng (Bộ Công an) theo thời hạn luật định (trong vòng 72 giờ).</li>
          <li>Gửi thông báo cảnh báo qua email cho các học viên bị ảnh hưởng, kèm hướng dẫn thay đổi mật khẩu và bảo vệ tài khoản.</li>
        </ol>
      </section>

      {/* Section 10 */}
      <section id="section-10" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>10. Kênh liên hệ và tiếp nhận yêu cầu về quyền riêng tư</span>
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Mọi thắc mắc, đề nghị truy cập, chỉnh sửa hoặc khiếu nại về bảo vệ dữ liệu cá nhân, vui lòng liên hệ trực tiếp:
        </p>
        <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs space-y-1.5">
          <p>
            <strong>Bộ phận Bảo vệ Dữ liệu & Hỗ trợ Khách hàng:</strong> {LEGAL_CONFIG.platformName}
          </p>
          <p>
            <strong>Email:</strong>{' '}
            <a href={`mailto:${LEGAL_CONFIG.ownerEmail}`} className="text-indigo-600 dark:text-indigo-400 font-bold underline">
              {LEGAL_CONFIG.ownerEmail}
            </a>
          </p>
          <p>
            <strong>Hotline hỗ trợ:</strong> {LEGAL_CONFIG.ownerPhone}
          </p>
          <p>
            <strong>Địa chỉ tiếp nhận văn bản:</strong> {LEGAL_CONFIG.ownerAddress}
          </p>
        </div>
      </section>
    </PolicyLayout>
  );
};
export default PrivacyPolicyPage;
