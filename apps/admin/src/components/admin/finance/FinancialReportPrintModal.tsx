import React, { useState } from 'react';
import {
  Printer,
  X,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { FinancialReportPrintDocument } from './FinancialReportPrintDocument';
import { ReportType } from '../../../pages/admin/AdminFinancialReportsPage';

interface FinancialReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: ReportType | string;
  datePreset: string;
  startDate?: string;
  endDate?: string;
  reportData: any;
  transactions?: any[];
  currentUser?: any;
}

export const FinancialReportPrintModal: React.FC<FinancialReportPrintModalProps> = ({
  isOpen,
  onClose,
  reportType: initialReportType,
  datePreset,
  startDate,
  endDate,
  reportData,
  transactions,
  currentUser,
}) => {
  const [selectedType, setSelectedType] = useState<string>(initialReportType || 'ALL');
  const [preparedBy, setPreparedBy] = useState<string>(
    currentUser?.displayName || 'Quản Trị Viên LetStuN'
  );
  const [chiefAccountant, setChiefAccountant] = useState<string>('Trần Thị Minh Hằng');
  const [director, setDirector] = useState<string>('Ban Giám Đốc LetStuN');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [showConfig, setShowConfig] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleExecutePrint = () => {
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const REPORT_SCOPE_OPTIONS: { id: string; label: string; desc: string }[] = [
    { id: 'ALL', label: 'Báo Cáo Tổng Hợp Toàn Diện', desc: 'Đầy đủ P&L, Chi phí, Dòng tiền và Giao dịch' },
    { id: 'PNL', label: 'Báo Cáo Lãi & Lỗ (P&L)', desc: 'Chỉ tiêu Doanh thu thuần, Chi phí và Lợi nhuận ròng' },
    { id: 'REVENUE', label: 'Báo Cáo Doanh Thu', desc: 'Bóc tách doanh thu các gói Pro tháng, năm và token' },
    { id: 'EXPENSE', label: 'Báo Cáo Chi Phí Vận Hành', desc: 'Chi tiết bóc tách chi phí kỹ thuật, cloud và AI' },
    { id: 'CASH_FLOW', label: 'Báo Cáo Dòng Tiền (Cash Flow)', desc: 'Lưu chuyển tiền tệ trực tiếp CFO, CFI, CFF' },
    { id: 'TRANSACTIONS', label: 'Sổ Cái Giao Dịch', desc: 'Báo cáo kê khai sổ nhật ký thanh toán thực tế' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col h-screen max-h-screen overflow-hidden print:hidden animate-fade-in">
      {/* 1. Rigid Top Header (Never scrolls away) */}
      <header className="h-14 shrink-0 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3 shadow-md z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Printer className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Xem Trước & In Báo Cáo Tài Chính
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-black uppercase border border-slate-700">
                Khổ A4 Đen Trắng
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Định dạng chuẩn đen trắng (Black & White), độ tương phản cao, tối ưu máy in văn phòng
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
              showConfig
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tùy Chọn Chữ Ký & Phạm Vi</span>
            {showConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleExecutePrint}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md hover:shadow-indigo-500/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In Báo Cáo / Lưu PDF</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. Optional Configuration Drawer */}
      {showConfig && (
        <div className="shrink-0 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-4 z-20 animate-in slide-in-from-top-2 duration-150">
          <div className="max-w-5xl mx-auto space-y-3.5">
            <div>
              <label className="text-[11px] font-black text-slate-300 uppercase tracking-wider block mb-1.5">
                Phạm Vi Văn Bản Cần In:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {REPORT_SCOPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedType(opt.id)}
                    className={`p-2 rounded-xl border text-left transition flex flex-col justify-between ${
                      selectedType === opt.id
                        ? 'bg-indigo-600/30 border-indigo-500 text-white'
                        : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xs font-bold truncate block">{opt.label}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-800">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Người Lập Biểu:
                </label>
                <input
                  type="text"
                  value={preparedBy}
                  onChange={(e) => setPreparedBy(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Kế Toán Trưởng:
                </label>
                <input
                  type="text"
                  value={chiefAccountant}
                  onChange={(e) => setChiefAccountant(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Giám Đốc / Đại Diện Phê Duyệt:
                </label>
                <input
                  type="text"
                  value={director}
                  onChange={(e) => setDirector(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Ghi Chú Thuyết Minh Bổ Sung (Audit Notes):
              </label>
              <input
                type="text"
                placeholder="VD: Số liệu đã đối soát với báo cáo quyết toán ngân hàng tháng 09/2026..."
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Paper Document Simulation Viewport — Strictly Contained, Scrolls Comfortably */}
      <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8 flex justify-center items-start bg-slate-950/70">
        <div className="w-full max-w-[210mm] bg-white rounded-sm shadow-2xl p-8 sm:p-12 text-black border border-slate-300 my-2 print:my-0 print:p-0 print:border-none print:shadow-none">
          <FinancialReportPrintDocument
            reportType={selectedType}
            datePreset={datePreset}
            startDate={startDate}
            endDate={endDate}
            reportData={reportData}
            transactions={transactions}
            preparedBy={preparedBy}
            chiefAccountant={chiefAccountant}
            director={director}
            notes={customNotes}
          />
        </div>
      </main>

      {/* 4. Rigid Bottom Helper Bar (Never overlapped by preview paper) */}
      <footer className="h-12 shrink-0 bg-slate-900 border-t border-slate-800 px-6 flex items-center justify-between text-xs text-slate-400 z-20">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Văn bản sẵn sàng in: Khổ A4 Portrait (210mm x 297mm) • Bố cục đơn sắc tương phản cao</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExecutePrint}
            className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In Ngay (Ctrl + P)</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
export default FinancialReportPrintModal;
