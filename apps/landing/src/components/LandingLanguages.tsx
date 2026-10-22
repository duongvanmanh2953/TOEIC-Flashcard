import React from 'react';
import { ChevronRight } from 'lucide-react';
import { CountryFlag } from './CountryFlag';

/**
 * LandingLanguages - Modular Section for Multi-Language Mastery
 * Clean, high-contrast, beautiful grid with country flags and certification badges
 */
export const LandingLanguages: React.FC = React.memo(() => {
  return (
    <section id="languages" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto w-full border-t border-white/[0.06]">
      <div data-aos="fade-up" className="text-center max-w-3xl mx-auto mb-12">
        <span className="text-xs font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-full border border-cyan-400/20 inline-block mb-3">
          Không Giới Hạn TOEIC • Hệ Sinh Thái Đa Ngôn Ngữ
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight mb-3">
          Làm Chủ 7+ Ngôn Ngữ Toàn Cầu <br />
          <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
            Với Công Nghệ Flashcard Cá Nhân Hóa
          </span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Mỗi ngôn ngữ sở hữu không gian học tập riêng biệt: từ điển chuyên ngành, phát âm bản xứ chuẩn ngữ điệu,
          toggle phiên âm Pinyin / Romaji / Furigana và phân cấp chứng chỉ quốc tế.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" data-aos="fade-up">
        {/* 1. Tiếng Anh */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] hover:border-blue-400/40 card-hover-smooth flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CountryFlag countryCode="gb" size="lg" />
                <div>
                  <h3 className="text-lg font-black text-white">Tiếng Anh</h3>
                  <span className="text-[10px] text-slate-400">English Language</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30">
                TOEIC • IELTS • CEFR
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ngân hàng 600+ từ vựng TOEIC ETS, bộ đề thi bấm giờ thực tế, trắc nghiệm Part 5 & 7 và giải thích chi tiết.
            </p>
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/[0.06] text-xs space-y-1">
              <div className="font-bold text-blue-300 flex items-center justify-between">
                <span>Mẫu từ vựng:</span>
                <span className="text-[11px] text-slate-400">/əˈkɑːmədeɪt/</span>
              </div>
              <p className="text-white font-semibold">accommodate</p>
              <p className="text-[11px] text-slate-400">Đáp ứng, cung cấp chỗ ở cho 2,500 khách tham quan.</p>
            </div>
          </div>
          <a
            href="https://app.letstun.site/vocabulary"
            className="pt-2 text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <span>Học từ vựng Tiếng Anh</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* 2. Tiếng Nhật */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] hover:border-rose-400/40 card-hover-smooth flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CountryFlag countryCode="jp" size="lg" />
                <div>
                  <h3 className="text-lg font-black text-white">Tiếng Nhật</h3>
                  <span className="text-[10px] text-slate-400">日本語 (Nihongo)</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30">
                JLPT N5 → N1
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Hỗ trợ Kanji, Hiragana, Katakana cùng Furigana linh hoạt. Luyện phản xạ từ vựng kinh doanh và giao tiếp thực tế.
            </p>
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/[0.06] text-xs space-y-1">
              <div className="font-bold text-rose-300 flex items-center justify-between">
                <span>Mẫu từ vựng:</span>
                <span className="text-[11px] text-slate-400">かいぜん • Kaizen</span>
              </div>
              <p className="text-white font-semibold">改善 (Cải tiến)</p>
              <p className="text-[11px] text-slate-400">Cải tiến liên tục quy trình sản xuất để nâng cao năng suất.</p>
            </div>
          </div>
          <a
            href="https://app.letstun.site/vocabulary"
            className="pt-2 text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
          >
            <span>Học từ vựng Tiếng Nhật</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* 3. Tiếng Trung */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] hover:border-amber-400/40 card-hover-smooth flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CountryFlag countryCode="cn" size="lg" />
                <div>
                  <h3 className="text-lg font-black text-white">Tiếng Trung</h3>
                  <span className="text-[10px] text-slate-400">中文 (Zhongwen)</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
                HSK 1 → HSK 6
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Hiển thị chữ Hán giản thể/phồn thể kèm Pinyin chuẩn thanh điệu và thứ tự nét viết chuẩn giáo trình HSK quốc tế.
            </p>
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/[0.06] text-xs space-y-1">
              <div className="font-bold text-amber-300 flex items-center justify-between">
                <span>Mẫu từ vựng:</span>
                <span className="text-[11px] text-slate-400">jiān chí • Thanh 1-2</span>
              </div>
              <p className="text-white font-semibold">坚持 (Kiên trì)</p>
              <p className="text-[11px] text-slate-400">Chỉ cần kiên trì học mỗi ngày, vốn từ sẽ bứt phá mạnh mẽ.</p>
            </div>
          </div>
          <a
            href="https://app.letstun.site/vocabulary"
            className="pt-2 text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <span>Học từ vựng Tiếng Trung</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* 4. Tiếng Hàn */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] hover:border-sky-400/40 card-hover-smooth flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CountryFlag countryCode="kr" size="lg" />
                <div>
                  <h3 className="text-lg font-black text-white">Tiếng Hàn</h3>
                  <span className="text-[10px] text-slate-400">한국어 (Hangugeo)</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-400 border border-sky-500/30">
                TOPIK I & II
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bảng chữ cái Hangul, cách biến âm và kính ngữ tiếng Hàn trong giao tiếp thường nhật và đề thi học thuật.
            </p>
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/[0.06] text-xs space-y-1">
              <div className="font-bold text-sky-300 flex items-center justify-between">
                <span>Mẫu từ vựng:</span>
                <span className="text-[11px] text-slate-400">do-jeon</span>
              </div>
              <p className="text-white font-semibold">도전 (Thử thách)</p>
              <p className="text-[11px] text-slate-400">Học ngôn ngữ mới luôn là một thử thách vô cùng xứng đáng.</p>
            </div>
          </div>
          <a
            href="https://app.letstun.site/vocabulary"
            className="pt-2 text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
          >
            <span>Học từ vựng Tiếng Hàn</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* 5. Tiếng Đức */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] hover:border-yellow-400/40 card-hover-smooth flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CountryFlag countryCode="de" size="lg" />
                <div>
                  <h3 className="text-lg font-black text-white">Tiếng Đức</h3>
                  <span className="text-[10px] text-slate-400">Deutsch</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                Goethe A1 → B2
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Học quán từ der/die/das chuẩn xác, cách chia đuôi tính từ và các cấu trúc ngữ pháp thi cử B1-B2.
            </p>
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/[0.06] text-xs space-y-1">
              <div className="font-bold text-yellow-300 flex items-center justify-between">
                <span>Mẫu từ vựng:</span>
                <span className="text-[11px] text-slate-400">zuverlässig</span>
              </div>
              <p className="text-white font-semibold">Zuverlässig (Tin cậy)</p>
              <p className="text-[11px] text-slate-400">Đối tác cực kỳ đáng tin cậy trong các dự án phức tạp.</p>
            </div>
          </div>
          <a
            href="https://app.letstun.site/vocabulary"
            className="pt-2 text-xs font-bold text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
          >
            <span>Học từ vựng Tiếng Đức</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* 6. Tiếng Pháp & Tây Ban Nha */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] hover:border-purple-400/40 card-hover-smooth flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <CountryFlag countryCode="fr" size="lg" />
                  <CountryFlag countryCode="es" size="lg" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Pháp & Tây Ban Nha</h3>
                  <span className="text-[10px] text-slate-400">DELF & DELE</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/30">
                B1 - C1 Chuẩn
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tiếp cận hai ngôn ngữ lãng mạn phổ biến nhất thế giới với hệ thống chia động từ và phát âm ngữ điệu chuẩn.
            </p>
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/[0.06] text-xs space-y-1">
              <div className="font-bold text-purple-300 flex items-center justify-between">
                <span>Mẫu từ vựng:</span>
                <span className="text-[11px] text-slate-400">Persévérance • Desarrollo</span>
              </div>
              <p className="text-white font-semibold">Kiên trì & Phát triển</p>
              <p className="text-[11px] text-slate-400">Chìa khóa cốt lõi để thành công trong mọi hành trình học tập.</p>
            </div>
          </div>
          <a
            href="https://app.letstun.site/vocabulary"
            className="pt-2 text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            <span>Khám phá ngôn ngữ mới</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
});

LandingLanguages.displayName = 'LandingLanguages';
