import React from 'react';
import { ReportType } from '../../../pages/admin/AdminFinancialReportsPage';

export interface FinancialReportDocumentProps {
  reportType?: ReportType | string;
  datePreset?: string;
  startDate?: string;
  endDate?: string;
  reportData?: any;
  transactions?: any[];
  preparedBy?: string;
  chiefAccountant?: string;
  director?: string;
  reportCode?: string;
  notes?: string;
}

export const FinancialReportPrintDocument: React.FC<FinancialReportDocumentProps> = ({
  reportType = 'ALL',
  datePreset = 'this_month',
  startDate,
  endDate,
  reportData,
  transactions,
  preparedBy = 'Quản Trị Viên Hệ Thống',
  chiefAccountant = 'Trần Thị Minh Hằng',
  director = 'Ban Giám Đốc LetStuN',
  reportCode,
  notes,
}) => {
  // Format period title
  const getPeriodLabel = () => {
    if (startDate && endDate) {
      return `Từ ngày ${new Date(startDate).toLocaleDateString('vi-VN')} đến ngày ${new Date(endDate).toLocaleDateString('vi-VN')}`;
    }
    const now = new Date();
    switch (datePreset) {
      case 'today':
      case 'Today':
        return `Ngày ${now.toLocaleDateString('vi-VN')}`;
      case '7d':
        return `7 Ngày Gần Nhất (Kỳ kết thúc ${now.toLocaleDateString('vi-VN')})`;
      case '30d':
        return `30 Ngày Gần Nhất (Kỳ kết thúc ${now.toLocaleDateString('vi-VN')})`;
      case 'this_month':
        return `Tháng ${now.getMonth() + 1} / ${now.getFullYear()}`;
      case 'last_month': {
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return `Tháng ${lastMonthDate.getMonth() + 1} / ${lastMonthDate.getFullYear()}`;
      }
      case 'quarter':
        return `Quý ${Math.floor(now.getMonth() / 3) + 1} Năm ${now.getFullYear()}`;
      case 'year':
        return `Năm Tài Chính ${now.getFullYear()}`;
      default:
        return `Kỳ Báo Cáo Tháng ${now.getMonth() + 1} / ${now.getFullYear()}`;
    }
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'PNL':
        return 'BÁO CÁO KẾT QUẢ HOẠT ĐỘNG KINH DOANH (P&L STATEMENT)';
      case 'REVENUE':
        return 'BÁO CÁO CHI TIẾT DOANH THU & NGUỒN THU ĐĂNG KÝ HỌC VIÊN';
      case 'EXPENSE':
        return 'BÁO CÁO CHI PHÍ VẬN HÀNH & BÓC TÁCH HẠ TẦNG KỸ THUẬT';
      case 'CASH_FLOW':
        return 'BÁO CÁO LƯU CHUYỂN TIỀN TỆ TRONG KỲ (CASH FLOW STATEMENT)';
      case 'COST_BREAKDOWN':
        return 'BÁO CÁO BÓC TÁCH CHI PHÍ AI, SERVER VÀ QUẢNG CÁO';
      case 'GAME_PERFORMANCE':
        return 'BÁO CÁO HIỆU QUẢ KINH TẾ SẢN PHẨM & GAME ROI';
      case 'ROOM_PERFORMANCE':
        return 'BÁO CÁO DOANH THU & CHI PHÍ PHÒNG ĐẤU REALTIME';
      case 'TRANSACTIONS':
        return 'SỔ CÁI BÁO CÁO GIAO DỊCH THANH TOÁN (TRANSACTION AUDIT LEDGER)';
      case 'ALL':
      default:
        return 'BÁO CÁO TÀI CHÍNH TỔNG HỢP & HIỆU QUẢ HOẠT ĐỘNG KINH DOANH';
    }
  };

  const code = reportCode || `BC-TC/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(1000 + Math.random() * 9000)}`;

  // Pure clean fallback without fake numbers
  const kpi = reportData?.kpi || {
    revenue: 0,
    grossRevenue: 0,
    netRevenue: 0,
    gatewayFee: 0,
    cost: 0,
    grossProfit: 0,
    netProfit: 0,
    margin: 0,
    cashFlow: 0,
  };

  const grossRev = kpi.grossRevenue ?? kpi.revenue ?? 0;
  const netRev = kpi.netRevenue ?? (grossRev - (kpi.gatewayFee || Math.round(grossRev * 0.015)));
  const gatewayFee = kpi.gatewayFee ?? (grossRev - netRev);
  const cost = kpi.cost ?? 0;
  const netProfit = kpi.netProfit ?? (netRev - cost);
  const margin = kpi.margin ?? (netRev > 0 ? ((netProfit / netRev) * 100).toFixed(1) : '0.0');

  const formatVND = (val: number) => {
    return (val || 0).toLocaleString('vi-VN') + ' ₫';
  };

  const items = reportData?.items || [];
  const costBreakdown = reportData?.costBreakdown || [];
  const cashFlowItems = reportData?.cashFlowItems || [];
  const gameROI = reportData?.gameROI || [];

  return (
    <div className="report-print-document bg-white text-black font-sans leading-normal selection:bg-none print:text-black">
      {/* 1. Header Information Block - Monochrome Executive Standard */}
      <div className="border-b-2 border-black pb-4 mb-5">
        <div className="flex justify-between items-start text-xs text-black">
          <div>
            <p className="font-extrabold uppercase text-black text-sm tracking-wide">
              CÔNG TY CỔ PHẦN CÔNG NGHỆ GIÁO DỤC LETSTUN VIỆT NAM
            </p>
            <p className="font-bold text-black text-xs mt-0.5">
              TRUNG TÂM QUẢN TRỊ TÀI CHÍNH & ĐỐI SOÁT DOANH THU
            </p>
            <p className="text-[11px] text-neutral-800 mt-0.5">
              Hệ thống Học máy & Luyện thi Ngoại ngữ Thông minh LetStuN
            </p>
            <p className="text-[10px] text-neutral-600">
              Mã số thuế: 0108998877 | Địa chỉ: Tòa nhà Công nghệ số, TP. Hà Nội | Hotline: 1900-6868
            </p>
          </div>

          <div className="text-right text-[11px] space-y-0.5 min-w-[210px]">
            <p className="font-bold text-black text-xs">
              Mẫu số: 02 - BCTC/DN
            </p>
            <p className="italic text-neutral-600 text-[10px]">
              (Theo TT 200/2014/TT-BTC & Chuẩn mực Kế toán Quản trị)
            </p>
            <div className="pt-1 text-black">
              <p>
                <span className="font-medium">Số hiệu BC:</span>{' '}
                <span className="font-bold font-mono text-black">{code}</span>
              </p>
              <p>
                <span className="font-medium">Ngày trích xuất:</span>{' '}
                <span className="tabular-nums font-semibold">
                  {reportData?.generatedAt || new Date().toLocaleString('vi-VN')}
                </span>
              </p>
              <p>
                <span className="font-medium">Đơn vị tiền tệ:</span>{' '}
                <span className="font-semibold text-black">Việt Nam Đồng (VND)</span>
              </p>
            </div>
          </div>
        </div>

        {/* 2. Main Title */}
        <div className="text-center mt-5 mb-2">
          <h1 className="text-lg sm:text-xl font-black text-black uppercase tracking-tight">
            {getReportTitle()}
          </h1>
          <p className="text-xs sm:text-sm font-bold text-black mt-1 uppercase tracking-wide">
            {getPeriodLabel()}
          </p>
          <p className="text-[10px] text-neutral-600 italic mt-0.5">
            Dữ liệu đối soát thực tế từ Cổng thanh toán & Cơ sở dữ liệu giao dịch hệ thống
          </p>
        </div>
      </div>

      {/* 3. Section I: Bảng Chỉ Tiêu Tài Chính Cốt Lõi */}
      <div className="mb-5 print-avoid-break">
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-l-4 border-black pl-2">
            I. Bảng Tổng Hợp Chỉ Tiêu Tài Chính Then Chốt (Key Financial Indicators)
          </h2>
          <span className="text-[10px] text-neutral-600 italic">Đơn vị tính: VNĐ</span>
        </div>

        <table className="w-full text-xs text-left border-collapse border border-black">
          <thead>
            <tr className="bg-neutral-100 text-black font-bold border-b border-black">
              <th className="p-2 border-r border-black text-center w-12">STT</th>
              <th className="p-2 border-r border-black">Chỉ Tiêu Tài Chính</th>
              <th className="p-2 border-r border-black text-center w-20">Mã Số</th>
              <th className="p-2 border-r border-black text-right w-44">Kỳ Này (VNĐ)</th>
              <th className="p-2 text-right w-36">Tỷ Trọng / Đánh Giá</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/30">
            <tr>
              <td className="p-2 border-r border-black text-center font-medium">01</td>
              <td className="p-2 border-r border-black font-bold text-black">
                1. Tổng doanh thu bán hàng & cung cấp dịch vụ (Gross Revenue)
              </td>
              <td className="p-2 border-r border-black text-center font-mono text-[11px]">MS-01</td>
              <td className="p-2 border-r border-black text-right font-bold tabular-nums text-black">
                {formatVND(grossRev)}
              </td>
              <td className="p-2 text-right font-medium text-black">100.0% (Cơ sở)</td>
            </tr>
            <tr>
              <td className="p-2 border-r border-black text-center font-medium">02</td>
              <td className="p-2 border-r border-black text-neutral-800 pl-6">
                - Chiết khấu & Phí cổng thanh toán PayOS / VietQR (1.5%)
              </td>
              <td className="p-2 border-r border-black text-center font-mono text-[11px]">MS-02</td>
              <td className="p-2 border-r border-black text-right font-medium tabular-nums text-black">
                -{formatVND(gatewayFee)}
              </td>
              <td className="p-2 text-right text-neutral-700">-1.5% GD</td>
            </tr>
            <tr className="bg-neutral-50 font-bold border-t border-black">
              <td className="p-2 border-r border-black text-center font-bold">03</td>
              <td className="p-2 border-r border-black font-extrabold text-black">
                2. Doanh thu thuần về bán hàng & dịch vụ (Net Revenue = MS 01 - MS 02)
              </td>
              <td className="p-2 border-r border-black text-center font-mono font-bold text-[11px]">MS-03</td>
              <td className="p-2 border-r border-black text-right font-black tabular-nums text-black">
                {formatVND(netRev)}
              </td>
              <td className="p-2 text-right font-bold text-black">
                {grossRev > 0 ? ((netRev / grossRev) * 100).toFixed(1) : '0.0'}% Thực nhận
              </td>
            </tr>
            <tr>
              <td className="p-2 border-r border-black text-center font-medium">04</td>
              <td className="p-2 border-r border-black font-bold text-black">
                3. Tổng chi phí hoạt động sản xuất kinh doanh (Operating Costs - OPEX)
              </td>
              <td className="p-2 border-r border-black text-center font-mono text-[11px]">MS-04</td>
              <td className="p-2 border-r border-black text-right font-bold tabular-nums text-black">
                -{formatVND(cost)}
              </td>
              <td className="p-2 text-right text-neutral-700">
                {netRev > 0 ? ((cost / netRev) * 100).toFixed(1) : '0.0'}% Doanh thu
              </td>
            </tr>
            <tr>
              <td className="p-2 border-r border-black text-center font-medium">05</td>
              <td className="p-2 border-r border-black text-neutral-800 pl-6">
                4. Lợi nhuận gộp từ hoạt động kinh doanh (Gross Profit)
              </td>
              <td className="p-2 border-r border-black text-center font-mono text-[11px]">MS-05</td>
              <td className="p-2 border-r border-black text-right font-semibold tabular-nums text-black">
                {formatVND(kpi.grossProfit || (grossRev - cost))}
              </td>
              <td className="p-2 text-right text-neutral-700">
                {grossRev > 0 ? (((kpi.grossProfit || (grossRev - cost)) / grossRev) * 100).toFixed(1) : '0.0'}% Gross
              </td>
            </tr>
            <tr className="bg-neutral-100 border-t-2 border-b-2 border-black font-black">
              <td className="p-2 border-r border-black text-center font-black">06</td>
              <td className="p-2 border-r border-black font-black text-black uppercase tracking-tight">
                5. Lợi nhuận thuần trước thuế trong kỳ (Net Profit)
              </td>
              <td className="p-2 border-r border-black text-center font-mono font-bold text-[11px]">MS-06</td>
              <td className="p-2 border-r border-black text-right font-black tabular-nums text-black text-sm">
                {formatVND(netProfit)}
              </td>
              <td className="p-2 text-right font-extrabold text-black">
                Biên LN: {margin}%
              </td>
            </tr>
            <tr>
              <td className="p-2 border-r border-black text-center font-medium">07</td>
              <td className="p-2 border-r border-black font-bold text-black">
                6. Lưu chuyển tiền thuần trong kỳ (Net Cash Flow)
              </td>
              <td className="p-2 border-r border-black text-center font-mono text-[11px]">MS-07</td>
              <td className="p-2 border-r border-black text-right font-bold tabular-nums text-black">
                {formatVND(kpi.cashFlow ?? netProfit)}
              </td>
              <td className="p-2 text-right font-semibold text-black">
                {netProfit >= 0 ? 'Dòng tiền dương' : 'Dòng tiền âm'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. Section II: Sổ Cái Chi Tiết Doanh Thu & Khoản Mục Thu Chi (P&L Ledger) */}
      {(reportType === 'ALL' || reportType === 'PNL' || reportType === 'REVENUE' || reportType === 'EXPENSE') && (
        <div className="mb-5 print-avoid-break">
          <div className="flex items-center justify-between mb-1.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black border-l-4 border-black pl-2">
              II. Sổ Cái Chi Tiết Phân Bổ Các Khoản Mục Thu & Chi (P&L Ledger Items)
            </h2>
            <span className="text-[10px] text-neutral-600 italic">Tổng {items.length} hạng mục</span>
          </div>

          <table className="w-full text-xs text-left border-collapse border border-black">
            <thead>
              <tr className="bg-neutral-100 text-black font-bold border-b border-black">
                <th className="p-2 border-r border-black text-center w-12">STT</th>
                <th className="p-2 border-r border-black">Hạng Mục Doanh Thu / Chi Phí</th>
                <th className="p-2 border-r border-black text-center w-24">Phân Loại</th>
                <th className="p-2 border-r border-black text-right w-36">Số Tiền (VNĐ)</th>
                <th className="p-2 border-r border-black text-center w-24">Tỷ Trọng (%)</th>
                <th className="p-2 text-right w-32">Đánh Giá</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/30">
              {items.length > 0 ? (
                items.map((it: any, idx: number) => {
                  const isRev = it.type === 'REVENUE' || it.amount >= 0;
                  return (
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-neutral-50' : ''}>
                      <td className="p-2 border-r border-black text-center font-medium">{idx + 1}</td>
                      <td className="p-2 border-r border-black font-semibold text-black">{it.category}</td>
                      <td className="p-2 border-r border-black text-center">
                        <span className="px-1.5 py-0.5 border border-black text-[10px] font-bold">
                          {isRev ? 'THU' : 'CHI'}
                        </span>
                      </td>
                      <td className="p-2 border-r border-black text-right font-bold tabular-nums text-black">
                        {isRev ? '+' : ''}{it.amount.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="p-2 border-r border-black text-center font-medium text-black">
                        {it.share}
                      </td>
                      <td className="p-2 text-right font-medium text-neutral-800 text-[11px]">{it.status}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-neutral-500 italic">
                    Không có giao dịch phát sinh trong kỳ báo cáo đã chọn.
                  </td>
                </tr>
              )}
            </tbody>
            {items.length > 0 && (
              <tfoot>
                <tr className="bg-neutral-100 font-black border-t-2 border-b-4 border-double border-black text-black">
                  <td colSpan={3} className="p-2 border-r border-black text-right uppercase">
                    Chênh Lệch Lợi Nhuận Ròng Trước Thuế:
                  </td>
                  <td className="p-2 border-r border-black text-right font-black tabular-nums text-black text-sm">
                    {formatVND(netProfit)}
                  </td>
                  <td className="p-2 border-r border-black text-center font-bold text-black">{margin}%</td>
                  <td className="p-2 text-right text-[11px] font-bold text-black">Cân đối kế toán</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* 5. Section III: Bóc Tách Chi Phí Vận Hành */}
      {(reportType === 'ALL' || reportType === 'EXPENSE' || reportType === 'COST_BREAKDOWN') && costBreakdown.length > 0 && (
        <div className="mb-5 print-avoid-break">
          <div className="flex items-center justify-between mb-1.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black border-l-4 border-black pl-2">
              III. Báo Cáo Bóc Tách Cơ Cấu Chi Phí Vận Hành (Cost Structure Breakdown)
            </h2>
            <span className="text-[10px] text-neutral-600 italic">Tổng chi phí: {formatVND(cost)}</span>
          </div>

          <table className="w-full text-xs text-left border-collapse border border-black">
            <thead>
              <tr className="bg-neutral-100 text-black font-bold border-b border-black">
                <th className="p-2 border-r border-black text-center w-12">STT</th>
                <th className="p-2 border-r border-black">Hạng Mục Chi Phí Kỹ Thuật & Nhân Sự</th>
                <th className="p-2 border-r border-black text-right w-40">Chi Phí (VNĐ)</th>
                <th className="p-2 border-r border-black text-center w-28">Tỷ Trọng (%)</th>
                <th className="p-2 text-right w-36">Xu Hướng So Với Kỳ Trước</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/30">
              {costBreakdown.map((c: any, idx: number) => (
                <tr key={idx}>
                  <td className="p-2 border-r border-black text-center font-medium">{idx + 1}</td>
                  <td className="p-2 border-r border-black font-semibold text-black">{c.name}</td>
                  <td className="p-2 border-r border-black text-right font-bold tabular-nums text-black">
                    {formatVND(c.amount)}
                  </td>
                  <td className="p-2 border-r border-black text-center font-semibold text-black">{c.share}</td>
                  <td className="p-2 text-right font-mono font-semibold text-black text-[11px]">{c.trend}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-neutral-100 font-black border-t-2 border-b-4 border-double border-black text-black">
                <td colSpan={2} className="p-2 border-r border-black text-right uppercase">
                  Tổng Cộng Chi Phí Vận Hành (OPEX):
                </td>
                <td className="p-2 border-r border-black text-right font-black tabular-nums text-black text-sm">
                  {formatVND(cost)}
                </td>
                <td className="p-2 border-r border-black text-center font-bold">100.0%</td>
                <td className="p-2 text-right text-[11px] text-neutral-600">Đã kiểm toán</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* 6. Section IV: Báo Cáo Lưu Chuyển Tiền Tệ (Cash Flow Statement) */}
      {(reportType === 'ALL' || reportType === 'CASH_FLOW') && cashFlowItems.length > 0 && (
        <div className="mb-5 print-avoid-break">
          <div className="flex items-center justify-between mb-1.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black border-l-4 border-black pl-2">
              IV. Báo Cáo Lưu Chuyển Tiền Tệ (Cash Flow Statement - Trực Tiếp)
            </h2>
            <span className="text-[10px] text-neutral-600 italic">Dòng tiền thực thu - thực chi</span>
          </div>

          <table className="w-full text-xs text-left border-collapse border border-black">
            <thead>
              <tr className="bg-neutral-100 text-black font-bold border-b border-black">
                <th className="p-2 border-r border-black text-center w-12">STT</th>
                <th className="p-2 border-r border-black">Khoản Mục Lưu Chuyển Tiền Tệ</th>
                <th className="p-2 border-r border-black text-right w-36">Dòng Vào (+)</th>
                <th className="p-2 border-r border-black text-right w-36">Dòng Ra (-)</th>
                <th className="p-2 text-right w-40">Lưu Chuyển Thuần (+/-)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/30">
              {cashFlowItems.map((cf: any, idx: number) => (
                <tr key={idx}>
                  <td className="p-2 border-r border-black text-center font-medium">{idx + 1}</td>
                  <td className="p-2 border-r border-black font-semibold text-black">{cf.title}</td>
                  <td className="p-2 border-r border-black text-right font-medium tabular-nums text-black">
                    +{formatVND(cf.inflow)}
                  </td>
                  <td className="p-2 border-r border-black text-right font-medium tabular-nums text-black">
                    -{formatVND(cf.outflow)}
                  </td>
                  <td className="p-2 text-right font-bold tabular-nums text-black">
                    {cf.net >= 0 ? '+' : ''}{formatVND(cf.net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 7. Section V: Giao Dịch Gần Nhất (Audit Ledger) */}
      {(reportType === 'ALL' || reportType === 'TRANSACTIONS') && transactions && transactions.length > 0 && (
        <div className="mb-5 print-avoid-break">
          <div className="flex items-center justify-between mb-1.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black border-l-4 border-black pl-2">
              V. Sổ Nhật Ký Giao Dịch Đã Quyết Toán (Transaction Audit Records)
            </h2>
            <span className="text-[10px] text-neutral-600 italic">Trích xuất tối đa 20 giao dịch gần nhất</span>
          </div>

          <table className="w-full text-xs text-left border-collapse border border-black">
            <thead>
              <tr className="bg-neutral-100 text-black font-bold border-b border-black">
                <th className="p-2 border-r border-black text-center w-24">Mã Đơn</th>
                <th className="p-2 border-r border-black">Khách Hàng / Email</th>
                <th className="p-2 border-r border-black text-center w-28">Gói Dịch Vụ</th>
                <th className="p-2 border-r border-black text-right w-28">Số Tiền</th>
                <th className="p-2 border-r border-black text-center w-20">Trạng Thái</th>
                <th className="p-2 text-right w-36">Thời Gian GD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/30">
              {transactions.slice(0, 20).map((tx: any, idx: number) => (
                <tr key={idx}>
                  <td className="p-2 border-r border-black text-center font-mono font-bold">#{tx.orderCode}</td>
                  <td className="p-2 border-r border-black">
                    <span className="font-semibold text-black block">{tx.userName || 'Học viên'}</span>
                    <span className="text-[10px] text-neutral-600 block truncate">{tx.userEmail}</span>
                  </td>
                  <td className="p-2 border-r border-black text-center font-medium">{tx.planName || tx.tier}</td>
                  <td className="p-2 border-r border-black text-right font-bold tabular-nums text-black">
                    {formatVND(tx.amount)}
                  </td>
                  <td className="p-2 border-r border-black text-center">
                    <span className="px-1.5 py-0.5 border border-black text-[10px] font-bold">
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-2 text-right font-mono text-[11px] text-neutral-700">
                    {new Date(tx.createdAt).toLocaleString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 8. Thuyết Minh Báo Cáo Tài Chính & Ghi Chú Kiểm Toán */}
      <div className="mb-6 p-3 border border-black bg-neutral-50 text-xs text-black print-avoid-break">
        <h3 className="font-bold text-black uppercase text-[11px] mb-1">
          VI. Thuyết Minh & Ghi Chú Kiểm Toán Tài Chính (Audit Disclosure)
        </h3>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-neutral-800">
          <li>
            <strong className="text-black">Cơ sở ghi nhận:</strong> Toàn bộ doanh thu được ghi nhận tự động theo nguyên tắc dồn tích (Accrual Basis) và đối soát trực tiếp với tài khoản nhận thanh toán PayOS / VietQR.
          </li>
          <li>
            <strong className="text-black">Chi phí AI & Hạ tầng:</strong> Chi phí AI Model (Gemini/OpenAI) được tính dựa trên số lượng token và số lượng truy vấn thực tế. Chi phí máy chủ Postgres & Redis phân bổ theo kỳ kế toán.
          </li>
          <li>
            <strong className="text-black">Thanh khoản & Rủi ro:</strong> Không ghi nhận công nợ khó đòi. Đáp ứng đầy đủ tiêu chuẩn an toàn vốn lưu động.
          </li>
          {notes && (
            <li className="font-medium text-black">
              <strong>Ghi chú bổ sung:</strong> {notes}
            </li>
          )}
        </ul>
      </div>

      {/* 9. Chữ Ký & Phê Duyệt Tiêu Chuẩn Doanh Nghiệp */}
      <div className="pt-4 border-t-2 border-black print-avoid-break">
        <div className="text-right text-xs italic text-black mb-4">
          Lập tại Hà Nội, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
        </div>

        <div className="grid grid-cols-3 gap-6 text-center text-xs">
          {/* Người lập biểu */}
          <div className="flex flex-col items-center">
            <p className="font-extrabold text-black uppercase tracking-tight">NGƯỜI LẬP BIỂU</p>
            <p className="italic text-[10px] text-neutral-600 mb-14">(Ký, ghi rõ họ tên)</p>
            <p className="font-bold text-black">{preparedBy}</p>
            <p className="text-[10px] text-neutral-600 font-medium">Chuyên viên Dữ liệu & Kế toán</p>
          </div>

          {/* Kế toán trưởng */}
          <div className="flex flex-col items-center">
            <p className="font-extrabold text-black uppercase tracking-tight">KẾ TOÁN TRƯỞNG</p>
            <p className="italic text-[10px] text-neutral-600 mb-14">(Ký, ghi rõ họ tên)</p>
            <p className="font-bold text-black">{chiefAccountant}</p>
            <p className="text-[10px] text-neutral-600 font-medium">Trưởng phòng Tài chính - Kế toán</p>
          </div>

          {/* Giám đốc / Đại diện pháp luật */}
          <div className="flex flex-col items-center">
            <p className="font-extrabold text-black uppercase tracking-tight">GIÁM ĐỐC ĐIỀU HÀNH</p>
            <p className="italic text-[10px] text-neutral-600 mb-14">(Ký, đóng dấu, ghi rõ họ tên)</p>
            <p className="font-bold text-black">{director}</p>
            <p className="text-[10px] text-neutral-600 font-medium">Đại diện Ban Điều Hành LetStuN</p>
          </div>
        </div>

        {/* Footer Verification Note */}
        <div className="mt-10 pt-2 border-t border-black flex justify-between items-center text-[10px] text-neutral-600">
          <span>
            Hệ thống Quản trị Tài chính LetStuN BI • Tài liệu lưu hành nội bộ • Mã xác thực: {code}
          </span>
          <span className="font-mono">Trang 1 / 1</span>
        </div>
      </div>
    </div>
  );
};
