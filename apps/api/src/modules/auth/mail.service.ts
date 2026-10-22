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
   * Locate the official LetStuN logo file
   */
  private getLogoAttachment(): { path: string; cid: string } | null {
    const possiblePaths = [
      path.resolve(process.cwd(), 'assets/letstun-logo.png'),
      path.resolve(__dirname, '../../../assets/letstun-logo.png'),
      path.resolve(__dirname, '../../../../assets/letstun-logo.png'),
      path.resolve(__dirname, '../../../../web/public/letstun-logo-256.png'),
      path.resolve(process.cwd(), '../web/public/letstun-logo-256.png'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return {
          path: p,
          cid: 'letstun-logo',
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
    const recipientName = displayName || 'Học viên LetStuN';
    const transporter = this.getTransporter();

    if (!transporter) {
      this.logger.error(`SMTP chưa được cấu hình trong .env. Không thể gửi email tới: ${email}`);
      throw new BadRequestException(
        'Hệ thống máy chủ gửi email (SMTP) chưa được cấu hình. Vui lòng cấu hình SMTP_HOST, SMTP_USER, SMTP_PASS trong file .env.',
      );
    }

    const fromAddress = process.env.SMTP_FROM || `LetStuN AI <${process.env.SMTP_USER}>`;

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
        filename: 'letstun-logo.png',
        path: logoAttachment.path,
        cid: logoAttachment.cid,
      });
      logoImgTag = `<img src="cid:${logoAttachment.cid}" width="64" height="64" alt="LetStuN AI Logo" style="border-radius: 16px; display: block; margin: 0 auto; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3); border: 2px solid rgba(255, 255, 255, 0.25);" />`;
    } else {
      logoImgTag = `<div style="width: 56px; height: 56px; border-radius: 16px; background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.4); margin: 0 auto; line-height: 56px; text-align: center; font-size: 28px;">⚡</div>`;
    }

    const htmlContent = `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="vi">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Xác Thực Bảo Mật Đặt Lại Mật Khẩu - LetStuN AI</title>
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap" rel="stylesheet" />
      <style type="text/css">
        body, table, td, p, a, li, blockquote {
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
        }
        body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          font-family: Roboto, 'Google Sans', Arial, sans-serif !important;
          background-color: #f1f5f9;
        }
        img {
          border: 0;
          height: auto;
          line-height: 100%;
          outline: none;
          text-decoration: none;
        }
        table {
          border-collapse: collapse !important;
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: Roboto, 'Google Sans', Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      <div style="width: 100%; background-color: #f1f5f9; padding: 32px 12px; font-family: Roboto, 'Google Sans', Arial, sans-serif;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.1);">
          <!-- Header with Project Identity -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 75%, #6366f1 100%); background-color: #312e81; padding: 36px 24px 28px; text-align: center; color: #ffffff;">
              ${logoImgTag}
              <div style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-top: 12px; color: #ffffff; font-family: Roboto, 'Google Sans', Arial, sans-serif; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                LETSTUN AI
              </div>
              <div style="font-size: 13px; color: #c7d2fe; font-weight: 500; margin-top: 4px; font-family: Roboto, 'Google Sans', Arial, sans-serif;">
                Nền Tảng Luyện Từ Vựng TOEIC &amp; Luyện Thi Thông Minh Với AI
              </div>
              <div style="margin-top: 14px;">
                <span style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 9999px; padding: 5px 16px; font-size: 11px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; color: #ffffff; font-family: Roboto, 'Google Sans', Arial, sans-serif;">
                  🔐 XÁC THỰC BẢO MẬT &amp; ĐẶT LẠI MẬT KHẨU
                </span>
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 28px; font-family: Roboto, 'Google Sans', Arial, sans-serif;">
              <div style="font-size: 16px; font-weight: bold; color: #0f172a; margin-bottom: 12px; font-family: Roboto, 'Google Sans', Arial, sans-serif;">
                Xin chào ${recipientName},
              </div>
              <p style="font-size: 14px; color: #334155; margin-top: 0; margin-bottom: 20px; line-height: 1.65; font-family: Roboto, 'Google Sans', Arial, sans-serif;">
                Hệ thống bảo mật LetStuN AI đã nhận được yêu cầu cấp lại mật khẩu cho tài khoản học viên của bạn. Dưới đây là thông tin chi tiết phiên yêu cầu và <strong style="color: #0f172a;">Mã Khóa Xác Thực (OTP)</strong>:
              </p>

              <!-- Project & Request Metadata Table -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 12px 18px; margin-bottom: 24px; border-collapse: collapse; font-family: Roboto, 'Google Sans', Arial, sans-serif;">
                <tr>
                  <td style="padding: 8px 12px; font-size: 12px; color: #64748b; font-weight: bold; font-family: Roboto, 'Google Sans', Arial, sans-serif; border-bottom: 1px dashed #e2e8f0;">📧 Tài khoản email:</td>
                  <td align="right" style="padding: 8px 12px; font-size: 12px; color: #0f172a; font-weight: bold; font-family: Roboto, 'Google Sans', Arial, sans-serif; text-align: right; border-bottom: 1px dashed #e2e8f0;">${email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; font-size: 12px; color: #64748b; font-weight: bold; font-family: Roboto, 'Google Sans', Arial, sans-serif; border-bottom: 1px dashed #e2e8f0;">👤 Học viên:</td>
                  <td align="right" style="padding: 8px 12px; font-size: 12px; color: #0f172a; font-weight: bold; font-family: Roboto, 'Google Sans', Arial, sans-serif; text-align: right; border-bottom: 1px dashed #e2e8f0;">${recipientName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; font-size: 12px; color: #64748b; font-weight: bold; font-family: Roboto, 'Google Sans', Arial, sans-serif; border-bottom: 1px dashed #e2e8f0;">⏱️ Thời gian gửi yêu cầu:</td>
                  <td align="right" style="padding: 8px 12px; font-size: 12px; color: #0f172a; font-weight: bold; font-family: Roboto, 'Google Sans', Arial, sans-serif; text-align: right; border-bottom: 1px dashed #e2e8f0;">${requestTimeStr}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; font-size: 12px; color: #64748b; font-weight: bold; font-family: Roboto, 'Google Sans', Arial, sans-serif;">🎯 Mục tiêu hệ thống:</td>
                  <td align="right" style="padding: 8px 12px; font-size: 12px; color: #4338ca; font-weight: bold; font-family: Roboto, 'Google Sans', Arial, sans-serif; text-align: right;">Bảo vệ dữ liệu học tập &amp; Spaced Repetition</td>
                </tr>
              </table>

              <!-- High-Tech 6-Box OTP Key Section -->
              <div style="background-color: #090d16; border: 2px solid #3730a3; border-radius: 20px; padding: 26px 16px; text-align: center; margin: 24px 0;">
                <div style="display: inline-block; background-color: rgba(99, 102, 241, 0.25); border: 1px solid rgba(99, 102, 241, 0.4); color: #818cf8; font-size: 11px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; padding: 4px 14px; border-radius: 9999px; margin-bottom: 16px; font-family: Roboto, 'Google Sans', Arial, sans-serif;">
                  MÃ KHÓA BẢO MẬT XÁC THỰC 1 LẦN (OTP)
                </div>

                <!-- OTP 6-Box Table -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="6" align="center" style="margin: 0 auto; border-collapse: separate; border-spacing: 6px;">
                  <tr>
                    <td align="center" valign="middle" style="width: 44px; height: 56px; background-color: #1e1b4b; border: 2px solid #6366f1; border-radius: 12px; font-family: Roboto, Consolas, Monaco, monospace; font-size: 28px; font-weight: bold; color: #38bdf8; text-align: center; vertical-align: middle; line-height: 56px; mso-line-height-rule: exactly; padding: 0;">${digits[0]}</td>
                    <td align="center" valign="middle" style="width: 44px; height: 56px; background-color: #1e1b4b; border: 2px solid #6366f1; border-radius: 12px; font-family: Roboto, Consolas, Monaco, monospace; font-size: 28px; font-weight: bold; color: #38bdf8; text-align: center; vertical-align: middle; line-height: 56px; mso-line-height-rule: exactly; padding: 0;">${digits[1]}</td>
                    <td align="center" valign="middle" style="width: 44px; height: 56px; background-color: #1e1b4b; border: 2px solid #6366f1; border-radius: 12px; font-family: Roboto, Consolas, Monaco, monospace; font-size: 28px; font-weight: bold; color: #38bdf8; text-align: center; vertical-align: middle; line-height: 56px; mso-line-height-rule: exactly; padding: 0;">${digits[2]}</td>
                    <td align="center" valign="middle" style="width: 44px; height: 56px; background-color: #1e1b4b; border: 2px solid #6366f1; border-radius: 12px; font-family: Roboto, Consolas, Monaco, monospace; font-size: 28px; font-weight: bold; color: #38bdf8; text-align: center; vertical-align: middle; line-height: 56px; mso-line-height-rule: exactly; padding: 0;">${digits[3]}</td>
                    <td align="center" valign="middle" style="width: 44px; height: 56px; background-color: #1e1b4b; border: 2px solid #6366f1; border-radius: 12px; font-family: Roboto, Consolas, Monaco, monospace; font-size: 28px; font-weight: bold; color: #38bdf8; text-align: center; vertical-align: middle; line-height: 56px; mso-line-height-rule: exactly; padding: 0;">${digits[4]}</td>
                    <td align="center" valign="middle" style="width: 44px; height: 56px; background-color: #1e1b4b; border: 2px solid #6366f1; border-radius: 12px; font-family: Roboto, Consolas, Monaco, monospace; font-size: 28px; font-weight: bold; color: #38bdf8; text-align: center; vertical-align: middle; line-height: 56px; mso-line-height-rule: exactly; padding: 0;">${digits[5]}</td>
                  </tr>
                </table>

                <div style="font-size: 12px; color: #94a3b8; margin-top: 14px; font-family: Roboto, 'Google Sans', Arial, sans-serif;">
                  Sao chép 6 chữ số trên và nhập vào màn hình "Xác Thực Mã Khóa OTP" trên ứng dụng.
                </div>
                <div style="display: inline-block; margin-top: 10px; background-color: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.35); color: #fbbf24; font-size: 12px; font-weight: bold; padding: 5px 14px; border-radius: 8px; font-family: Roboto, 'Google Sans', Arial, sans-serif;">
                  ⏳ Có hiệu lực trong vòng 15 phút (Hết hạn lúc: ${expireTimeStr})
                </div>
              </div>

              <!-- Detailed 3-Step Procedure Guide (Cross-client Table Layout with Perfectly Centered Number Badges) -->
              <div style="background-color: #fdf4ff; border: 1px solid #f0abfc; border-radius: 18px; padding: 20px; margin: 24px 0; font-family: Roboto, 'Google Sans', Arial, sans-serif;">
                <div style="font-size: 13px; font-weight: bold; color: #86198f; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.5px; font-family: Roboto, 'Google Sans', Arial, sans-serif;">
                  📋 Hướng Dẫn Quy Trình Đổi Mật Khẩu 3 Bước:
                </div>

                <!-- Step 1 -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 12px; border-collapse: collapse;">
                  <tr>
                    <td width="30" valign="top" style="width: 30px; vertical-align: top; padding-top: 1px;">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="22" height="22" style="width: 22px; height: 22px; background-color: #c026d3; border-radius: 11px; border-collapse: separate;">
                        <tr>
                          <td align="center" valign="middle" style="width: 22px; height: 22px; text-align: center; vertical-align: middle; color: #ffffff; font-family: Roboto, 'Google Sans', Arial, sans-serif; font-size: 11px; font-weight: bold; line-height: 22px; mso-line-height-rule: exactly; padding: 0; margin: 0;">
                            1
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td valign="top" style="vertical-align: top; padding-left: 8px; color: #701a75; font-family: Roboto, 'Google Sans', Arial, sans-serif; font-size: 13px; line-height: 20px;">
                      <strong style="color: #701a75; font-family: Roboto, 'Google Sans', Arial, sans-serif;">Nhập mã OTP:</strong> Nhập chính xác mã 6 chữ số bên trên vào Bước 2 trên màn hình ứng dụng LetStuN.
                    </td>
                  </tr>
                </table>

                <!-- Step 2 -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 12px; border-collapse: collapse;">
                  <tr>
                    <td width="30" valign="top" style="width: 30px; vertical-align: top; padding-top: 1px;">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="22" height="22" style="width: 22px; height: 22px; background-color: #c026d3; border-radius: 11px; border-collapse: separate;">
                        <tr>
                          <td align="center" valign="middle" style="width: 22px; height: 22px; text-align: center; vertical-align: middle; color: #ffffff; font-family: Roboto, 'Google Sans', Arial, sans-serif; font-size: 11px; font-weight: bold; line-height: 22px; mso-line-height-rule: exactly; padding: 0; margin: 0;">
                            2
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td valign="top" style="vertical-align: top; padding-left: 8px; color: #701a75; font-family: Roboto, 'Google Sans', Arial, sans-serif; font-size: 13px; line-height: 20px;">
                      <strong style="color: #701a75; font-family: Roboto, 'Google Sans', Arial, sans-serif;">Hệ thống chứng thực:</strong> Hệ thống xác thực mã khóa hợp lệ trước khi cho phép mở khóa màn hình tạo mật khẩu mới.
                    </td>
                  </tr>
                </table>

                <!-- Step 3 -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                  <tr>
                    <td width="30" valign="top" style="width: 30px; vertical-align: top; padding-top: 1px;">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="22" height="22" style="width: 22px; height: 22px; background-color: #c026d3; border-radius: 11px; border-collapse: separate;">
                        <tr>
                          <td align="center" valign="middle" style="width: 22px; height: 22px; text-align: center; vertical-align: middle; color: #ffffff; font-family: Roboto, 'Google Sans', Arial, sans-serif; font-size: 11px; font-weight: bold; line-height: 22px; mso-line-height-rule: exactly; padding: 0; margin: 0;">
                            3
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td valign="top" style="vertical-align: top; padding-left: 8px; color: #701a75; font-family: Roboto, 'Google Sans', Arial, sans-serif; font-size: 13px; line-height: 20px;">
                      <strong style="color: #701a75; font-family: Roboto, 'Google Sans', Arial, sans-serif;">Thiết lập mật khẩu an toàn:</strong> Nhập mật khẩu mới tuân thủ quy chuẩn bảo mật bắt buộc của LetStuN.
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Password Standards Criteria -->
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 18px; padding: 20px; margin: 24px 0; font-family: Roboto, 'Google Sans', Arial, sans-serif;">
                <div style="font-size: 13px; font-weight: bold; color: #1e40af; margin-bottom: 10px; font-family: Roboto, 'Google Sans', Arial, sans-serif;">
                  🔒 Quy chuẩn mật khẩu mới bắt buộc (Được kiểm tra 2 đầu FE &amp; BE):
                </div>
                <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #1e3a8a; line-height: 1.8; font-family: Roboto, 'Google Sans', Arial, sans-serif;">
                  <li>Độ dài tối thiểu từ <strong style="color: #1e3a8a;">8 đến 64 ký tự</strong></li>
                  <li>Chứa ít nhất <strong style="color: #1e3a8a;">1 chữ cái in hoa</strong> (A-Z) và <strong style="color: #1e3a8a;">1 chữ cái in thường</strong> (a-z)</li>
                  <li>Chứa ít nhất <strong style="color: #1e3a8a;">1 chữ số</strong> (0-9)</li>
                  <li>Chứa ít nhất <strong style="color: #1e3a8a;">1 ký tự đặc biệt</strong> (ví dụ: ! @ # $ % ^ &amp; * _ -)</li>
                  <li>Không chứa khoảng trắng (dấu cách)</li>
                </ul>
              </div>

              <!-- Security Warning -->
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 0 14px 14px 0; padding: 14px 18px; font-size: 12px; color: #92400e; line-height: 1.6; margin-top: 24px; font-family: Roboto, 'Google Sans', Arial, sans-serif;">
                <strong style="color: #92400e; font-family: Roboto, 'Google Sans', Arial, sans-serif;">⚠️ Cảnh báo an toàn thông tin:</strong> LetStuN AI <strong style="color: #92400e;">tuyệt đối không bao giờ</strong> yêu cầu bạn cung cấp mã OTP này qua điện thoại, tin nhắn hay bất kỳ người nào khác. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc đổi mật khẩu tài khoản ngay để phòng ngừa rủi ro.
              </div>
            </td>
          </tr>

          <!-- Footer with Comprehensive Project Information -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 28px 28px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.7; font-family: Roboto, 'Google Sans', Arial, sans-serif;">
              <div style="font-weight: bold; color: #334155; font-size: 13px; font-family: Roboto, 'Google Sans', Arial, sans-serif;">LetStuN AI - Intelligent TOEIC Vocabulary Platform</div>
              <div style="margin: 6px 0; color: #475569; font-family: Roboto, 'Google Sans', Arial, sans-serif;">
                Dự án học từ vựng TOEIC với thuật toán Spaced Repetition (Lặp lại ngắt quãng SM-2/FSRS), Trợ giảng AI Tutor 24/7 và Đấu trường tương tác Realtime Vocabulary Arena.
              </div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 12px; font-family: Roboto, 'Google Sans', Arial, sans-serif;">
                Email này được phát hành tự động qua máy chủ Resend SMTP của LetStuN AI.<br />
                Cần hỗ trợ? Liên hệ bộ phận kỹ thuật: <a href="mailto:support@letstun.com" style="color: #4f46e5; text-decoration: none; font-weight: bold;">support@letstun.com</a><br />
                © 2026 LetStuN AI Platform. All rights reserved.
              </div>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
    `;

    try {
      const mailOptions: any = {
        from: fromAddress,
        to: email,
        subject: `[LetStuN AI] Mã xác thực bảo mật đặt lại mật khẩu: ${otp}`,
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

  /**
   * Send Device Logout Confirmation OTP to account owner
   */
  async sendDeviceLogoutOtp(
    email: string,
    otp: string,
    targetDeviceName: string,
    displayName?: string,
  ): Promise<{ delivered: boolean; message: string }> {
    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(`[DEV SIMULATION] Device Logout OTP for ${email} (Target: ${targetDeviceName}): ${otp}`);
      return {
        delivered: false,
        message: `[MÔ PHỎNG DEV] Mã OTP xác nhận đăng xuất thiết bị của bạn là: ${otp}`,
      };
    }

    const fromAddress = process.env.SMTP_FROM || 'LetStuN Security <onboarding@resend.dev>';
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <h2 style="color: #4338ca;">Xác nhận đăng xuất thiết bị - LetStuN AI</h2>
      <p>Xin chào <strong>${displayName || 'Học viên'}</strong>,</p>
      <p>Hệ thống nhận được yêu cầu đăng xuất thiết bị <strong>"${targetDeviceName}"</strong> khỏi tài khoản LetStuN của bạn.</p>
      <p>Để hoàn tất xác minh chủ sở hữu tài khoản, vui lòng nhập mã OTP sau:</p>
      <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-radius: 12px; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #4338ca; margin: 20px 0;">
        ${otp}
      </div>
      <p style="color: #64748b; font-size: 13px;">Mã xác thực có hiệu lực trong <strong>10 phút</strong> và chỉ sử dụng một lần.</p>
      <p style="color: #dc2626; font-size: 13px;">⚠️ Nếu bạn không thực hiện hành động này, vui lòng bỏ qua email và đổi mật khẩu ngay lập tức để bảo vệ tài khoản.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center;">© 2026 LetStuN AI Security. All rights reserved.</p>
    </div>
    `;

    try {
      await transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: `[LetStuN Security] Mã xác thực đăng xuất thiết bị: ${otp}`,
        html: htmlContent,
      });
      return {
        delivered: true,
        message: 'Mã OTP xác thực đã được gửi đến email của bạn.',
      };
    } catch (err: any) {
      this.logger.error(`Failed to send logout OTP email: ${err.message}`);
      throw new BadRequestException(`Không thể gửi email OTP: ${err.message}`);
    }
  }

  /**
   * Send New Device / Risk Event Notification to account owner
   */
  async sendNewDeviceRiskAlert(
    email: string,
    deviceMeta: {
      deviceName: string;
      os?: string;
      browser?: string;
      ip?: string;
      time?: string;
    },
    displayName?: string,
  ): Promise<void> {
    const transporter = this.getTransporter();
    const timeStr = deviceMeta.time || new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    if (!transporter) {
      this.logger.warn(`[DEV SIMULATION] New device risk alert sent to ${email} for device ${deviceMeta.deviceName}`);
      return;
    }

    const fromAddress = process.env.SMTP_FROM || 'LetStuN Security <onboarding@resend.dev>';
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fee2e2; border-radius: 16px; background-color: #fffafb;">
      <h2 style="color: #b91c1c;">Cảnh báo bảo mật: Thiết bị mới đăng nhập</h2>
      <p>Xin chào <strong>${displayName || 'Học viên'}</strong>,</p>
      <p>Hệ thống LetStuN AI phát hiện một lần đăng nhập từ thiết bị mới hoặc tài khoản của bạn đã đạt giới hạn thiết bị cho phép:</p>
      <div style="background-color: #ffffff; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 13px; line-height: 1.8;">
        <div>📱 <strong>Thiết bị:</strong> ${deviceMeta.deviceName}</div>
        <div>💻 <strong>Hệ điều hành / Trình duyệt:</strong> ${deviceMeta.os || 'Unknown'} / ${deviceMeta.browser || 'Unknown'}</div>
        <div>🌐 <strong>Địa chỉ IP:</strong> ${deviceMeta.ip || 'Unknown'}</div>
        <div>⏰ <strong>Thời gian:</strong> ${timeStr}</div>
      </div>
      <p style="color: #b91c1c; font-size: 13px; font-weight: bold;">
        Nếu đây không phải là bạn, vui lòng đăng nhập ngay và vào mục Cài đặt &gt; Bảo mật &gt; Thiết bị để kiểm tra và đăng xuất thiết bị lạ, đồng thời đổi mật khẩu tài khoản ngay lập tức.
      </p>
      <hr style="border: none; border-top: 1px solid #fee2e2; margin: 20px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center;">© 2026 LetStuN AI Security Defense System.</p>
    </div>
    `;

    try {
      await transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: `[LetStuN Security] Cảnh báo đăng nhập từ thiết bị mới: ${deviceMeta.deviceName}`,
        html: htmlContent,
      });
    } catch (err: any) {
      this.logger.warn(`Failed to send risk alert email: ${err.message}`);
    }
  }
}

