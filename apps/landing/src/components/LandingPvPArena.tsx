import React from 'react';
import { Swords, CheckCircle2, Mic } from 'lucide-react';

export const LandingPvPArena: React.FC = React.memo(() => {
  return (
    <section id="pvp-arena" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto w-full border-t border-white/[0.06]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div data-aos="fade-right" className="text-left space-y-5">
          <span className="text-xs font-black uppercase tracking-widest text-violet-400 bg-violet-500/10 px-3 py-1.5 rounded-full border border-violet-400/20 inline-block">
            Gamification & Realtime Multiplay
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            Đấu Trường Từ Vựng 1v1 <br />
            <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-sky-300 bg-clip-text text-transparent">
              Thi Đấu Thời Gian Thực Socket.IO
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Biến việc học từ vựng thành trò chơi kịch tính! Thách đấu bạn bè hoặc so tài ngẫu nhiên
            cùng người học trên toàn thế giới qua các chế độ mini-game hấp dẫn.
          </p>

          <ul className="space-y-3 pt-1">
            <li className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
              <Swords className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Word Match & Speed Scramble:</strong> Tranh đua tốc độ nối từ với nghĩa trong 60 giây nghẹt thở.
              </span>
            </li>
            <li className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                <strong>Bảng Xếp Hạng & Rank Tiers:</strong> Tích lũy EXP, thăng cấp từ Đồng (Bronze) lên Thách Đấu (Grandmaster).
              </span>
            </li>
            <li className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
              <Mic className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Gia Sư AI Luyện Nói 24/7:</strong> Đối thoại trực tiếp, sửa lỗi phát âm và phản hồi ngữ cảnh với độ trễ siêu thấp dưới 150ms.
              </span>
            </li>
          </ul>

          <div className="pt-2">
            <a
              href="https://app.vocalflow.site/pvp"
              className="btn-glass-primary !py-2.5 !px-5 text-xs font-bold inline-flex items-center gap-2 card-hover-smooth"
            >
              <Swords className="w-4 h-4" />
              <span>Tham gia đấu trường ngay</span>
            </a>
          </div>
        </div>

        {/* Right: Mockup PvP Arena Match */}
        <div data-aos="fade-left" className="w-full">
          <div className="p-6 rounded-3xl bg-slate-900 border border-white/15 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-white">Trận Đấu Xếp Hạng Rank Vàng</span>
              </div>
              <span className="font-mono text-cyan-400 font-extrabold bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-500/30">
                Thời gian: 00:42
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/[0.08] space-y-3 text-xs">
              <div className="text-center space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Từ vựng TOEIC Part 5</span>
                <p className="text-slate-300">
                  Từ khóa: <strong className="text-white font-black text-base">"pragmatic"</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400 text-xs font-bold text-emerald-200 text-center">
                  ✓ realistic / practical
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-white/[0.08] text-xs font-bold text-slate-400 text-center">
                  theoretical
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/[0.08] flex items-center justify-between text-xs">
                <span className="text-slate-300">Tỉ số hiện tại:</span>
                <div className="flex items-center gap-3 font-black">
                  <span className="text-cyan-400">Bạn: 2,450 pts</span>
                  <span className="text-slate-500">VS</span>
                  <span className="text-amber-400">Đối thủ: 2,120 pts</span>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400">
              <span>Kết nối Socket.IO P2P</span>
              <span className="text-cyan-400 font-bold">Độ trễ: 18ms</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

LandingPvPArena.displayName = 'LandingPvPArena';
