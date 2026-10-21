import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PolicyLayout, TocItem } from '../../components/layout/PolicyLayout';
import { LEGAL_CONFIG } from '../../config/legalConfig';
import { FileText, ShieldAlert, CheckCircle2, Lock, Scale, AlertTriangle, BookOpen } from 'lucide-react';
import { VocabFlowLogo } from '@vocabflow/shared';

const TOC_ITEMS: TocItem[] = [
  { id: 'section-1', title: '1. Chấp thuận điều khoản & điều kiện sử dụng' },
  { id: 'section-2', title: '2. Phạm vi dịch vụ và đăng ký tài khoản học viên' },
  { id: 'section-3', title: '3. Trách nhiệm bảo mật tài khoản của học viên' },
  { id: 'section-4', title: '4. Quy định về tài khoản miễn phí và tài khoản trả phí Plus/Pro' },
  { id: 'section-5', title: '5. Các hành vi bị nghiêm cấm trên nền tảng' },
  { id: 'section-6', title: '6. Quyền sở hữu trí tuệ và bảo hộ nội dung số' },
  { id: 'section-7', title: '7. Giới hạn trách nhiệm của các bên' },
  { id: 'section-8', title: '8. Sửa đổi, tạm ngừng hoặc chấm dứt cung cấp dịch vụ' },
  { id: 'section-9', title: '9. Luật áp dụng và cơ quan giải quyết tranh chấp' },
  { id: 'section-10', title: '10. Thông tin liên hệ giải đáp điều khoản' },
];

export const TermsOfServicePage: React.FC = () => {
  useEffect(() => {
    document.title = `Điều Khoản Sử Dụng Dịch Vụ — ${LEGAL_CONFIG.platformName}`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        `Điều khoản sử dụng dịch vụ nền tảng học tiếng Anh trực tuyến ${LEGAL_CONFIG.platformName}.`
      );
    }
  }, []);

  return (
    <PolicyLayout
      title="Điều Khoản Sử Dụng Dịch Vụ"
      subtitle="Quy định pháp lý điều chỉnh quyền, nghĩa vụ và trách nhiệm của học viên khi tham gia học tập trên nền tảng VocabFlow."
      currentPath="/terms-of-service"
      toc={TOC_ITEMS}
      lastUpdated="15/10/2026"
      effectiveDate="15/10/2026"
    >
      {/* Intro alert */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
        <div className="flex items-center gap-2 font-bold text-indigo-800 dark:text-indigo-400">
          <VocabFlowLogo size="xs" showContainer={false} className="w-5 h-5 object-contain shrink-0" />
          <span>Thỏa thuận người dùng dịch vụ học tập trực tuyến</span>
        </div>
        <p>
          Chào mừng bạn đến với {LEGAL_CONFIG.platformName}. Bằng việc đăng ký tài khoản, đăng nhập hoặc sử dụng bất kỳ tính năng nào
          trên website, bạn xác nhận đã đọc, hiểu rõ và đồng ý bị ràng buộc bởi các điều khoản sử dụng dưới đây.
          Nếu không đồng ý với bất kỳ phần nào của điều khoản này, vui lòng ngừng sử dụng dịch vụ.
        </p>
      </div>

      {/* Section 1 */}
      <section id="section-1" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>1. Chấp thuận điều khoản & điều kiện sử dụng</span>
        </h2>
        <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Văn bản này cấu thành thỏa thuận pháp lý có giá trị ràng buộc giữa học viên (người sử dụng dịch vụ) và chủ quản nền tảng {LEGAL_CONFIG.platformName}.
          </p>
          <p>
            Đối tượng sử dụng dịch vụ: Mọi cá nhân từ đủ 13 tuổi trở lên có nhu cầu học tiếng Anh. Đối với học sinh dưới 13 tuổi (hoặc người chưa thành niên theo quy định pháp luật), việc đăng ký tài khoản và thanh toán phải có sự giám sát, đồng ý từ cha mẹ hoặc người đại diện hợp pháp (có thể thông qua phân hệ Trải nghiệm trẻ em / Kids Portal).
          </p>
        </div>
      </section>

      {/* Section 2 */}
      <section id="section-2" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>2. Phạm vi dịch vụ và đăng ký tài khoản học viên</span>
        </h2>
        <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            {LEGAL_CONFIG.platformName} cung cấp các dịch vụ học tập số cá nhân hóa thông qua trình duyệt web, bao gồm:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Thư viện từ vựng tiếng Anh theo các chuẩn quốc tế (TOEIC, IELTS, CEFR).</li>
            <li>Thuật toán lặp lại ngắt quãng thích ứng (Adaptive Spaced Repetition System - SRS).</li>
            <li>Trợ lý Gia sư AI Tutor hỗ trợ phân tích ngữ pháp, luyện phát âm và dệt câu chuyện nhớ từ vựng.</li>
            <li>Hệ thống luyện thi mô phỏng và phân tích điểm yếu (Exam Bank).</li>
          </ul>
          <p>
            Khi đăng ký tài khoản, học viên cam kết cung cấp thông tin trung thực, chính xác (đặc biệt là email) để đảm bảo quyền lợi khi nhận hỗ trợ kỹ thuật hoặc khôi phục mật khẩu.
          </p>
        </div>
      </section>

      {/* Section 3 */}
      <section id="section-3" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>3. Trách nhiệm bảo mật tài khoản của học viên</span>
        </h2>
        <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
          <li>
            <strong>Bảo mật mật khẩu:</strong> Học viên có trách nhiệm tự bảo vệ mật khẩu truy cập của mình. Không chia sẻ thông tin đăng nhập cho bất kỳ cá nhân hay tổ chức nào khác.
          </li>
          <li>
            <strong>Chịu trách nhiệm về hành vi:</strong> Mọi hoạt động diễn ra thông qua tài khoản của học viên sẽ được xem là do chính học viên thực hiện hoặc ủy quyền thực hiện.
          </li>
          <li>
            <strong>Thông báo khẩn cấp:</strong> Nếu phát hiện tài khoản bị xâm nhập trái phép hoặc có lỗ hổng bảo mật, học viên phải lập tức thông báo cho ban quản trị {LEGAL_CONFIG.platformName} qua email {LEGAL_CONFIG.ownerEmail} để kịp thời phong tỏa và hỗ trợ.
          </li>
        </ul>
      </section>

      {/* Section 4 */}
      <section id="section-4" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>4. Quy định về tài khoản miễn phí và tài khoản trả phí Plus/Pro</span>
        </h2>
        <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            <strong>Tài khoản Learner Free:</strong> Cung cấp miễn phí trọn đời với các quyền lợi cơ bản được công bố, giới hạn hạn mức AI Tutor là 10 lượt/ngày và tối đa 3 bộ thẻ cá nhân.
          </p>
          <p>
            <strong>Tài khoản trả phí VocabFlow Plus & Pro:</strong> Được mở khóa các tính năng nâng cao sau khi hoàn tất thanh toán thành công theo <Link to="/payment-policy" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">Chính sách thanh toán</Link>. Quyền sử dụng có hiệu lực theo kỳ cước đã mua (30 ngày hoặc 365 ngày), không tự động gia hạn trừ tiền và sẽ tự động chuyển về tài khoản miễn phí khi hết hạn kỳ cước.
          </p>
        </div>
      </section>

      {/* Section 5 */}
      <section id="section-5" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>5. Các hành vi bị nghiêm cấm trên nền tảng</span>
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Học viên tuyệt đối không được thực hiện các hành vi sau:
        </p>
        <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
          <li>
            Sử dụng các công cụ tự động (robot, crawler, scraper, spider) để thu thập dữ liệu bộ từ vựng, tài liệu học tập hoặc mã nguồn của hệ thống mà không có sự đồng ý bằng văn bản.
          </li>
          <li>
            Thực hiện các hành vi tấn công từ chối dịch vụ (DDoS), can thiệp, phá hoại mã nguồn hoặc xâm nhập bất hợp pháp vào máy chủ và cơ sở dữ liệu.
          </li>
          <li>
            Bán lại, cho thuê lại hoặc chia sẻ tài khoản trả phí Plus/Pro cho nhiều người cùng sử dụng đồng thời vì mục đích trục lợi thương mại trái quy định.
          </li>
          <li>
            Lạm dụng trợ lý AI Tutor để tạo ra nội dung vi phạm pháp luật Việt Nam, ngôn từ thù địch, khiêu dâm, bạo lực hoặc vi phạm thuần phong mỹ tục.
          </li>
        </ul>
        <p className="text-xs text-red-600 dark:text-red-400 font-semibold pt-1">
          * Biện pháp chế tài: Tài khoản vi phạm các điều khoản trên có thể bị khóa tạm thời hoặc xóa bỏ vĩnh viễn quyền truy cập mà không được bồi hoàn chi phí, đồng thời chúng tôi bảo lưu quyền yêu cầu cơ quan pháp luật xử lý theo quy định hiện hành.
        </p>
      </section>

      {/* Section 6 */}
      <section id="section-6" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>6. Quyền sở hữu trí tuệ và bảo hộ nội dung số</span>
        </h2>
        <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Toàn bộ nhãn hiệu, logo, thiết kế giao diện, cấu trúc bài học, file âm thanh phát âm bản xứ, thuật toán Spaced Repetition và mã nguồn phần mềm trên {LEGAL_CONFIG.platformName} đều thuộc quyền sở hữu trí tuệ độc quyền của đơn vị vận hành hoặc được cấp phép hợp pháp.
          </p>
          <p>
            Học viên chỉ được cấp quyền sử dụng cá nhân, phi thương mại. Nghiêm cấm sao chép, trích xuất, phân phối lại hoặc thương mại hóa bất kỳ phần nào của nội dung học tập khi chưa có sự chấp thuận bằng văn bản.
          </p>
        </div>
      </section>

      {/* Section 7 */}
      <section id="section-7" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>7. Giới hạn trách nhiệm của các bên</span>
        </h2>
        <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            <strong>Nguyên tắc cung cấp dịch vụ:</strong> Dịch vụ được cung cấp trên cơ sở nỗ lực tối đa về mặt kỹ thuật ("as is" và "as available"). Ban quản trị cam kết nỗ lực cao nhất nhằm duy trì tính ổn định, liên tục và chính xác của nội dung học tập.
          </p>
          <p>
            <strong>Miễn trừ trong trường hợp bất khả kháng:</strong> Chúng tôi không chịu trách nhiệm trong các tình huống phát sinh do sự cố mạng viễn thông quốc tế (đứt cáp quang biển), thiên tai, dịch bệnh, sự cố hạ tầng điện lực quốc gia hoặc quyết định can thiệp từ cơ quan nhà nước có thẩm quyền.
          </p>
        </div>
      </section>

      {/* Section 8 */}
      <section id="section-8" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>8. Sửa đổi, tạm ngừng hoặc chấm dứt cung cấp dịch vụ</span>
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Ban quản trị có quyền cập nhật, điều chỉnh các điều khoản này nhằm đáp ứng sự phát triển của nền tảng và tuân thủ các quy định pháp luật mới nhất.
          Các thay đổi có hiệu lực kể từ ngày được công bố chính thức trên website kèm ngày cập nhật. Việc học viên tiếp tục sử dụng dịch vụ sau thời điểm sửa đổi đồng nghĩa với việc chấp thuận điều khoản cập nhật.
        </p>
      </section>

      {/* Section 9 */}
      <section id="section-9" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>9. Luật áp dụng và cơ quan giải quyết tranh chấp</span>
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Điều khoản sử dụng này được điều chỉnh và giải thích theo pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.
          Mọi tranh chấp nếu không thể giải quyết thông qua thương lượng hòa giải sẽ được đưa ra giải quyết tại Tòa án nhân dân có thẩm quyền tại Việt Nam.
        </p>
      </section>

      {/* Section 10 */}
      <section id="section-10" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>10. Thông tin liên hệ giải đáp điều khoản</span>
        </h2>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs space-y-1.5">
          <p><strong>Đơn vị vận hành:</strong> {LEGAL_CONFIG.ownerName}</p>
          <p><strong>Hotline giải đáp:</strong> {LEGAL_CONFIG.ownerPhone}</p>
          <p>
            <strong>Email tiếp nhận:</strong>{' '}
            <a href={`mailto:${LEGAL_CONFIG.ownerEmail}`} className="text-indigo-600 dark:text-indigo-400 font-bold underline">
              {LEGAL_CONFIG.ownerEmail}
            </a>
          </p>
          <p><strong>Địa chỉ:</strong> {LEGAL_CONFIG.ownerAddress}</p>
        </div>
      </section>
    </PolicyLayout>
  );
};
export default TermsOfServicePage;
