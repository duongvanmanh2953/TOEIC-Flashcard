import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

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
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
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
        message: 'Chưa cấu hình thông tin SMTP (SMTP_HOST, SMTP_USER, SMTP_PASS). Đang dùng chế độ Safe Dev Mode (in OTP ra console/API).',
      };
    }

    try {
      const transporter = this.getTransporter();
      if (!transporter) throw new Error('Cannot create transporter');
      await transporter.verify();
      return {
        configured: true,
        status: 'READY',
        message: `Kết nối máy chủ SMTP thành công (${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587})`,
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
   * Send Password Reset Email with 6-digit OTP
   */
  async sendPasswordResetOtp(email: string, otp: string, displayName?: string): Promise<{
    delivered: boolean;
    devOtp?: string;
    message: string;
  }> {
    const recipientName = displayName || 'Học viên VocabFlow';
    const transporter = this.getTransporter();

    if (!transporter) {
      // Safe fallback mode: User will provide key later, so we print to console and return OTP
      this.logger.warn(`[DEV SAFE MODE] Mã khôi phục mật khẩu cho [${email}]: ${otp} (Hết hạn sau 15 phút)`);
      return {
        delivered: false,
        devOtp: otp,
        message: `Hệ thống đang ở chế độ phát triển (Chưa cấu hình SMTP). Mã OTP của bạn là: ${otp}`,
      };
    }

    const fromAddress = process.env.SMTP_FROM || `VocabFlow Security <${process.env.SMTP_USER}>`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
        .header { text-align: center; margin-bottom: 24px; }
        .logo { font-size: 24px; font-weight: 900; color: #4f46e5; letter-spacing: -0.5px; }
        .title { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 12px; margin-bottom: 8px; }
        .otp-box { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border-radius: 16px; padding: 20px; text-align: center; margin: 28px 0; color: #ffffff; }
        .otp-code { font-size: 34px; font-weight: 900; letter-spacing: 8px; font-family: monospace; }
        .expire-note { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 8px; }
        .footer { text-align: center; font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo">⚡ VocabFlow AI</div>
          <div class="title">Yêu Cầu Đặt Lại Mật Khẩu</div>
          <p style="font-size: 14px; color: #64748b; margin: 0;">Xin chào <strong>${recipientName}</strong>,</p>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ <strong>${email}</strong>. Vui lòng sử dụng mã xác thực bảo mật bên dưới để hoàn tất:
        </p>
        <div class="otp-box">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; opacity: 0.8; margin-bottom: 4px;">MÃ XÁC THỰC BẢO MẬT (OTP)</div>
          <div class="otp-code">${otp}</div>
        </div>
        <div class="expire-note">⏳ Mã xác thực có hiệu lực trong vòng <strong>15 phút</strong>. Tuyệt đối không chia sẻ mã này cho người khác.</div>
        <div class="footer">
          Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc liên hệ với bộ phận hỗ trợ.<br>
          © 2026 VocabFlow AI. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    `;

    try {
      await transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: `[VocabFlow] Mã xác thực đặt lại mật khẩu: ${otp}`,
        html: htmlContent,
      });

      this.logger.log(`Email reset password sent successfully to: ${email}`);
      return {
        delivered: true,
        message: 'Mã xác thực đã được gửi tới địa chỉ email của bạn.',
      };
    } catch (err: any) {
      this.logger.error(`Failed to send email to ${email}: ${err.message}`);
      // Fallback in case SMTP sends an error
      return {
        delivered: false,
        devOtp: otp,
        message: `Lỗi khi gửi mail qua SMTP (${err.message}). Mã OTP dự phòng: ${otp}`,
      };
    }
  }
}
