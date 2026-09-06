import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Users,
  BookOpen,
  BrainCircuit,
  Headphones,
  MessageSquarePlus,
  Bell,
  Cpu,
  CreditCard,
  Activity,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  GraduationCap,
} from 'lucide-react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const commands = [
    { title: 'Bảng Điều Khiển Tổng Quan (Overview)', desc: 'KPI, Needs Attention, Live Activity', route: '/admin/dashboard', icon: LayoutDashboard },
    { title: 'Quản Lý Người Dùng (Users)', desc: 'Danh sách học viên, phân quyền, trạng thái', route: '/admin/users', icon: Users },
    { title: 'Sức Khỏe Kho Từ Vựng (Vocabulary Health)', desc: 'Từ có tỷ lệ sai cao, hiệu chuẩn CEFR', route: '/admin/vocabulary', icon: BookOpen },
    { title: 'Phân Tích Học Tập (Learning Analytics)', desc: 'Phiên học, độ chính xác SRS, Cohort', route: '/admin/learning', icon: GraduationCap },
    { title: 'Hộp Thư Hỗ Trợ Khách Hàng (Support Inbox)', desc: 'Xử lý ticket CSKH, trả lời realtime, ghi chú nội bộ', route: '/admin/support', icon: Headphones },
    { title: 'Ban Quản Lý Góp Ý (Feedback & Roadmap)', desc: 'Kanban board, duyệt đề xuất tính năng, trả lời công khai', route: '/admin/feedback', icon: MessageSquarePlus },
    { title: 'Trung Tâm Thông Báo & Phát Sóng (Notifications)', desc: 'Soạn thông báo broadcast, chọn tệp đối tượng', route: '/admin/notifications', icon: Bell },
    { title: 'Giám Sát Mô Hình AI (AI Telemetry)', desc: 'Latency, token usage, tỷ lệ thành công', route: '/admin/ai', icon: Cpu },
    { title: 'Doanh Thu & Gói Cước (Billing & MRR)', desc: 'Gói Pro/Plus, đơn hàng VietQR, PayOS, MRR', route: '/admin/billing', icon: CreditCard },
    { title: 'Hạ Tầng & Sức Khỏe Hệ Thống (System Health)', desc: 'PostgreSQL, Redis, RAM heap, lỗi gần đây', route: '/admin/system', icon: Activity },
    { title: 'Bảo Mật & Phân Quyền (Security & Audit)', desc: 'Ma trận quyền hạn, nhật ký kiểm toán Audit Logs', route: '/admin/security', icon: ShieldCheck },
    { title: 'Quay Lại Giao Diện Học Tập (User Learning App)', desc: 'Trở về màn hình Dashboard của học viên', route: '/dashboard', icon: ExternalLink },
  ];

  const filtered = commands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.desc.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[550px]">
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm phân hệ quản trị hoặc phím tắt... (VD: users, support, ai)"
            className="flex-1 bg-transparent border-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8">Không tìm thấy phân hệ phù hợp.</p>
          ) : (
            filtered.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <div
                  key={cmd.route}
                  onClick={() => {
                    navigate(cmd.route);
                    onClose();
                  }}
                  className="p-3 rounded-2xl hover:bg-indigo-500/10 dark:hover:bg-indigo-500/15 cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                        {cmd.title}
                      </h4>
                      <p className="text-[11px] text-slate-400">{cmd.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition shrink-0" />
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[10px] text-slate-400 flex items-center justify-between px-4">
          <span>VocabFlow Command Center v7.0</span>
          <span>Bấm phím mũi tên hoặc click để điều hướng</span>
        </div>
      </div>
    </div>
  );
};
