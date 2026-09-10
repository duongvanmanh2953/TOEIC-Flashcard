import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  /**
   * Check whether real SMTP settings are configured in environment
   */
  isConfigured(): boolean {
    const host = process.env.SMTP_HOST?.trim();
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();
    return Boolean(host && user && pass);
  }

  /**
   * Create Nodemailer transporter
   */
  private getTransporter(): nodemailer.Transporter | null {
    if (!this.isConfigured()) return null;

    const host = process.env.SMTP_HOST?.trim();
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  /**
   * Verify SMTP connection status for Admin System Diagnostics
   */
  async verifyConnection(): Promise<{
    configured: boolean;
    status: 'READY' | 'FAILED' | 'UNCONFIGURED';
    message: string;
    details?: any;
  }> {
    if (!this.isConfigured()) {
      return {
        configured: false,
        status: 'UNCONFIGURED',
        message: 'Chưa cấu hình thông tin SMTP (SMTP_HOST, SMTP_USER, SMTP_PASS trong .env).',
      };
    }

    try {
      const transporter = this.getTransporter();
      if (!transporter) throw new Error('Không thể khởi tạo Nodemailer transporter');
      await transporter.verify();
      return {
        configured: true,
        status: 'READY',
        message: `Kết nối máy chủ SMTP thành công (${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 465})`,
        details: {
          host: process.env.SMTP_HOST,
          user: process.env.SMTP_USER,
        },
      };
    } catch (err: any) {
      return {
        configured: true,
        status: 'FAILED',
        message: `Kết nối SMTP thất bại: ${err.message}`,
        details: { error: err.message },
      };
    }
  }

  /**
   * Locate the official VocabFlow logo file
   */
  private getLogoAttachment(): { path: string; cid: string } | null {
    const possiblePaths = [
      path.resolve(process.cwd(), 'assets/vocabflow-logo.png'),
      path.resolve(__dirname, '../../../assets/vocabflow-logo.png'),
      path.resolve(__dirname, '../../../../assets/vocabflow-logo.png'),
      path.resolve(__dirname, '../../../../web/public/vocabflow-logo-256.png'),
      path.resolve(process.cwd(), '../web/public/vocabflow-logo-256.png'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return {
          path: p,
          cid: 'vocabflow-logo',
        };
      }
    }
    return null;
  }

  /**
   * Send Password Reset Email with official project branding, detailed project info, and 6-box OTP card
   */
  async sendPasswordResetOtp(email: string, otp: string, displayName?: string): Promise<{
    delivered: boolean;
    message: string;
  }> {
    const recipientName = displayName || 'Học viên VocabFlow';
    const transporter = this.getTransporter();

    if (!transporter) {
      this.logger.error(`SMTP chưa được cấu hình trong .env. Không thể gửi email tới: ${email}`);
      throw new BadRequestException(
        'Hệ thống máy chủ gửi email (SMTP) chưa được cấu hình. Vui lòng cấu hình SMTP_HOST, SMTP_USER, SMTP_PASS trong file .env.',
      );
    }

    const fromAddress = process.env.SMTP_FROM || `VocabFlow AI <${process.env.SMTP_USER}>`;

    // Time calculations (GMT+7 Vietnam timezone)
    const now = new Date();
    const expireDate = new Date(now.getTime() + 15 * 60 * 1000);
    const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const requestTimeStr = timeFormatter.format(now);
    const expireTimeStr = timeFormatter.format(expireDate);

    // Split 6-digit OTP for 6-box pin layout
    const digits = otp.padEnd(6, '0').split('');

    // Check logo attachment
    const logoAttachment = this.getLogoAttachment();
    const attachments: any[] = [];
    let logoImgTag = '';

    if (logoAttachment) {
      attachments.push({
        filename: 'vocabflow-logo.png',
        path: logoAttachment.path,
        cid: logoAttachment.cid,
      });
      logoImgTag = `<img src="cid:${logoAttachment.cid}" width="64" height="64" alt="VocabFlow AI Logo" style="border-radius: 16px; display: block; margin: 0 auto; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3); border: 2px solid rgba(255, 255, 255, 0.25);" />`;
    } else {
      logoImgTag = `<div style="width: 56px; height: 56px; border-radius: 16px; background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.4); margin: 0 auto; line-height: 56px; text-align: center; font-size: 28px;">⚡</div>`;
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Xác Thực Bảo Mật Đặt Lại Mật Khẩu - VocabFlow AI</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f1f5f9;
          color: #0f172a;
          line-height: 1.6;
        }
        .wrapper {
          width: 100%;
          background-color: #f1f5f9;
          padding: 40px 12px;
        }
        .container {
          max-width: 620px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 28px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.12), 0 8px 12px -4px rgba(15, 23, 42, 0.04);
        }
        .header {
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 75%, #6366f1 100%);
          padding: 36px 32px 30px;
          text-align: center;
          color: #ffffff;
        }
        .brand-title {
          font-size: 24px;
          font-weight: 900;
          letter-spacing: -0.5px;
          margin-top: 14px;
          color: #ffffff;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .brand-tagline {
          font-size: 13px;
          color: #c7d2fe;
          font-weight: 500;
          margin-top: 4px;
          letter-spacing: 0.2px;
        }
        .header-pill {
          display: inline-block;
          margin-top: 16px;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 9999px;
          padding: 6px 18px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #ffffff;
        }
        .body-card {
          padding: 36px 32px;
        }
        .greeting-lead {
          font-size: 17px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 12px;
        }
        .project-desc-box {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 18px 20px;
          margin-bottom: 26px;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 12px;
          border-bottom: 1px dashed #e2e8f0;
        }
        .meta-label {
          color: #64748b;
          font-weight: 600;
        }
        .meta-value {
          color: #0f172a;
          font-weight: 700;
          text-align: right;
        }
        .otp-section {
          background: #090d16;
          border: 2px solid #3730a3;
          border-radius: 24px;
          padding: 28px 20px;
          text-align: center;
          margin: 26px 0;
          box-shadow: 0 10px 25px -5px rgba(67, 56, 202, 0.25);
        }
        .otp-badge {
          display: inline-block;
          background: rgba(99, 102, 241, 0.25);
          border: 1px solid rgba(99, 102, 241, 0.4);
          color: #818cf8;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          padding: 4px 14px;
          border-radius: 9999px;
          margin-bottom: 16px;
        }
        .otp-boxes-table {
          margin: 0 auto;
          border-collapse: separate;
          border-spacing: 8px;
        }
        .otp-digit-box {
          width: 48px;
          height: 60px;
          background: #1e1b4b;
          border: 2px solid #6366f1;
          border-radius: 14px;
          font-family: 'SF Mono', Monaco, Menlo, Consolas, monospace;
          font-size: 32px;
          font-weight: 900;
          color: #38bdf8;
          text-align: center;
          vertical-align: middle;
          box-shadow: 0 4px 12px rgba(56, 189, 248, 0.2);
        }
        .otp-instruction {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 14px;
        }
        .otp-timer-tag {
          display: inline-block;
          margin-top: 10px;
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.35);
          color: #fbbf24;
          font-size: 12px;
          font-weight: 700;
          padding: 5px 14px;
          border-radius: 8px;
        }
        .steps-card {
          background-color: #fdf4ff;
          border: 1px solid #f0abfc;
          border-radius: 18px;
          padding: 20px;
          margin: 24px 0;
        }
        .steps-title {
          font-size: 13px;
          font-weight: 800;
          color: #86198f;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .step-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 8px;
          font-size: 13px;
          color: #701a75;
          line-height: 1.5;
        }
        .step-num {
          background: #c026d3;
          color: #ffffff;
          font-weight: 800;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .standards-box {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 18px;
          padding: 20px;
          margin: 24px 0;
        }
        .standards-title {
          font-size: 13px;
          font-weight: 800;
          color: #1e40af;
          margin-bottom: 10px;
        }
        .standards-list {
          margin: 0;
          padding-left: 20px;
          font-size: 12px;
          color: #1e3a8a;
          line-height: 1.7;
        }
        .alert-box {
          background-color: #fffbeb;
          border-left: 4px solid #f59e0b;
          border-radius: 0 14px 14px 0;
          padding: 14px 18px;
          font-size: 12px;
          color: #92400e;
          line-height: 1.6;
          margin-top: 24px;
        }
        .footer {
          background-color: #f8fafc;
          border-top: 1px solid #f1f5f9;
          padding: 28px 32px;
          text-align: center;
          font-size: 12px;
          color: #64748b;
          line-height: 1.7;
        }
        .footer-brand {
          font-weight: 800;
          color: #334155;
          font-size: 13px;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <!-- Header with Project Identity -->
          <div class="header">
            ${logoImgTag}
            <div class="brand-title">VOCABFLOW AI</div>
            <div class="brand-tagline">Nền Tảng Luyện Từ Vựng TOEIC & Luyện Thi Thông Minh Với AI</div>
            <div>
              <span class="header-pill">🔐 XÁC THỰC BẢO MẬT & ĐẶT LẠI MẬT KHẨU</span>
            </div>
          </div>

          <!-- Body Content -->
          <div class="body-card">
            <div class="greeting-lead">Xin chào ${recipientName},</div>
            <p style="font-size: 14px; color: #334155; margin-top: 0; margin-bottom: 18px; line-height: 1.65;">
              Hệ thống bảo mật VocabFlow AI đã nhận được yêu cầu cấp lại mật khẩu cho tài khoản học viên của bạn. Dưới đây là thông tin chi tiết phiên yêu cầu và <strong>Mã Khóa Xác Thực (OTP)</strong>:
            </p>

            <!-- Project & Request Metadata Table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px 18px; margin-bottom: 24px;">
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #64748b; font-weight: 600;">📧 Tài khoản email:</td>
                <td style="padding: 6px 0; font-size: 12px; color: #0f172a; font-weight: 700; text-align: right;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #64748b; font-weight: 600; border-top: 1px dashed #e2e8f0;">👤 Học viên:</td>
                <td style="padding: 6px 0; font-size: 12px; color: #0f172a; font-weight: 700; text-align: right; border-top: 1px dashed #e2e8f0;">${recipientName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #64748b; font-weight: 600; border-top: 1px dashed #e2e8f0;">⏱️ Thời gian gửi yêu cầu:</td>
                <td style="padding: 6px 0; font-size: 12px; color: #0f172a; font-weight: 700; text-align: right; border-top: 1px dashed #e2e8f0;">${requestTimeStr}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #64748b; font-weight: 600; border-top: 1px dashed #e2e8f0;">🎯 Mục tiêu hệ thống:</td>
                <td style="padding: 6px 0; font-size: 12px; color: #4338ca; font-weight: 700; text-align: right; border-top: 1px dashed #e2e8f0;">Bảo vệ dữ liệu học tập & Spaced Repetition</td>
              </tr>
            </table>

            <!-- High-Tech 6-Box OTP Key Section -->
            <div class="otp-section">
              <div class="otp-badge">MÃ KHÓA BẢO MẬT XÁC THỰC 1 LẦN (OTP)</div>

              <table class="otp-boxes-table" align="center">
                <tr>
                  <td class="otp-digit-box">${digits[0]}</td>
                  <td class="otp-digit-box">${digits[1]}</td>
                  <td class="otp-digit-box">${digits[2]}</td>
                  <td class="otp-digit-box">${digits[3]}</td>
                  <td class="otp-digit-box">${digits[4]}</td>
                  <td class="otp-digit-box">${digits[5]}</td>
                </tr>
              </table>

              <div class="otp-instruction">Sao chép 6 chữ số trên và nhập vào màn hình "Xác Thực Mã Khóa OTP" trên ứng dụng.</div>
              <div class="otp-timer-tag">⏳ Có hiệu lực trong vòng 15 phút (Hết hạn lúc: ${expireTimeStr})</div>
            </div>

            <!-- Detailed 3-Step Procedure Guide -->
            <div class="steps-card">
              <div class="steps-title">📋 Hướng Dẫn Quy Trình Đổi Mật Khẩu 3 Bước:</div>
              <div class="step-item">
                <span class="step-num">1</span>
                <span><strong>Nhập mã OTP</strong>: Nhập chính xác mã 6 chữ số bên trên vào Bước 2 trên màn hình ứng dụng VocabFlow.</span>
              </div>
              <div class="step-item">
                <span class="step-num">2</span>
                <span><strong>Hệ thống chứng thực</strong>: Hệ thống xác thực mã khóa hợp lệ trước khi cho phép mở khóa màn hình tạo mật khẩu mới.</span>
              </div>
              <div class="step-item">
                <span class="step-num">3</span>
                <span><strong>Thiết lập mật khẩu an toàn</strong>: Nhập mật khẩu mới tuân thủ quy chuẩn bảo mật bắt buộc của VocabFlow.</span>
              </div>
            </div>

            <!-- Password Standards Criteria -->
            <div class="standards-box">
              <div class="standards-title">🔒 Quy chuẩn mật khẩu mới bắt buộc (Được kiểm tra 2 đầu FE & BE):</div>
              <ul class="standards-list">
                <li>Độ dài tối thiểu từ <strong>8 đến 64 ký tự</strong></li>
                <li>Chứa ít nhất <strong>1 chữ cái in hoa</strong> (A-Z) và <strong>1 chữ cái in thường</strong> (a-z)</li>
                <li>Chứa ít nhất <strong>1 chữ số</strong> (0-9)</li>
                <li>Chứa ít nhất <strong>1 ký tự đặc biệt</strong> (ví dụ: ! @ # $ % ^ & * _ -)</li>
                <li>Không chứa khoảng trắng (dấu cách)</li>
              </ul>
            </div>

            <!-- Security Warning -->
            <div class="alert-box">
              <strong>⚠️ Cảnh báo an toàn thông tin:</strong> VocabFlow AI <strong>tuyệt đối không bao giờ</strong> yêu cầu bạn cung cấp mã OTP này qua điện thoại, tin nhắn hay bất kỳ người nào khác. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc đổi mật khẩu tài khoản ngay để phòng ngừa rủi ro.
            </div>
          </div>

          <!-- Footer with Comprehensive Project Information -->
          <div class="footer">
            <div class="footer-brand">VocabFlow AI - Intelligent TOEIC Vocabulary Platform</div>
            <div style="margin: 6px 0; color: #475569;">
              Dự án học từ vựng TOEIC với thuật toán Spaced Repetition (Lặp lại ngắt quãng SM-2/FSRS), Trợ giảng AI Tutor 24/7 và Đấu trường tương tác Realtime Vocabulary Arena.
            </div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 12px;">
              Email này được phát hành tự động qua máy chủ Resend SMTP của VocabFlow AI.<br>
              Cần hỗ trợ? Liên hệ bộ phận kỹ thuật: <a href="mailto:support@vocabflow.ai" style="color: #4f46e5; text-decoration: none; font-weight: 600;">support@vocabflow.ai</a><br>
              © 2026 VocabFlow AI Platform. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    try {
      const mailOptions: any = {
        from: fromAddress,
        to: email,
        subject: `[VocabFlow AI] Mã xác thực bảo mật đặt lại mật khẩu: ${otp}`,
        html: htmlContent,
      };

      if (attachments.length > 0) {
        mailOptions.attachments = attachments;
      }

      const info = await transporter.sendMail(mailOptions);

      this.logger.log(`Email OTP sent successfully to: ${email}, messageId: ${info.messageId}`);
      return {
        delivered: true,
        message: 'Mã xác thực OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư đến.',
      };
    } catch (err: any) {
      this.logger.error(`Lỗi khi gửi email tới ${email}: ${err.message}`);
      throw new BadRequestException(
        `Không thể gửi email xác thực qua Resend: ${err.message}. Vui lòng kiểm tra địa chỉ email.`,
      );
    }
  }
}
