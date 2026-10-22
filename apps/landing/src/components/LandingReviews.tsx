import React from 'react';
import { Star } from 'lucide-react';

const REVIEWS = [
  {
    rating: 5,
    comment:
      'Tính năng bôi đen câu hỏi trong đề thi TOEIC rồi lưu thẳng vào ghi chú đã cứu cánh mình! Trước đây làm xong đề phải mở sổ ghi chép lại rất mất thời gian. Mình đã tăng từ 650 lên 895 TOEIC sau 2 tháng.',
    author: 'Minh Nhật',
    role: 'TOEIC 895 • Sinh viên ĐH Ngoại Thương',
    avatarBg: 'from-indigo-500 to-sky-400',
    initials: 'MN',
  },
  {
    rating: 5,
    comment:
      'Học tiếng Nhật với chế độ Furigana và đấu trường 1v1 cực kỳ lôi cuốn. Thuật toán SRS nhắc đúng những từ mình hay quên, giúp mình đỗ JLPT N2 ngay trong lần thi đầu tiên.',
    author: 'Hoàng Anh',
    role: 'JLPT N2 • Kỹ sư phần mềm Tokyo',
    avatarBg: 'from-rose-500 to-amber-400',
    initials: 'HA',
  },
  {
    rating: 5,
    comment:
      'Kho từ vựng HSK 5 có phát âm chuẩn thanh điệu và ví dụ sát đề thi thực tế. Bảng tiến độ theo dõi rất chi tiết, tạo động lực duy trì chuỗi học 45 ngày liên tục.',
    author: 'Thùy Linh',
    role: 'HSK 5 (268 pts) • Biên phiên dịch',
    avatarBg: 'from-amber-500 to-emerald-400',
    initials: 'TL',
  },
];

export const LandingReviews: React.FC = React.memo(() => {
  return (
    <section id="reviews" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto w-full border-t border-white/[0.06]">
      <div data-aos="fade-up" className="text-center max-w-3xl mx-auto mb-12">
        <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-400/20 inline-block mb-3">
          Cộng Đồng Tin Dùng
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight mb-3">
          Học Viên Đã Bứt Phá Điểm Số Cùng LetStuN
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Hơn 12,000 học viên đã chinh phục thành công chứng chỉ TOEIC, JLPT và HSK mục tiêu.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5" data-aos="fade-up">
        {REVIEWS.map((rev, idx) => (
          <div key={idx} className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] space-y-4">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(rev.rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-300 italic leading-relaxed">
              "{rev.comment}"
            </p>
            <div className="pt-2 border-t border-white/10 flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full bg-gradient-to-tr ${rev.avatarBg} text-white flex items-center justify-center font-bold text-xs`}
              >
                {rev.initials}
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">{rev.author}</h4>
                <span className="text-[10px] text-slate-400">{rev.role}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});

LandingReviews.displayName = 'LandingReviews';
