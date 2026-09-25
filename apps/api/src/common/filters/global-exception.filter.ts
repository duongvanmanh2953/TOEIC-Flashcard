import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Đã xảy ra lỗi hệ thống cục bộ. Vui lòng thử lại sau.';
    let errorCode = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;

      if (typeof res === 'object' && res.message) {
        // ValidationPipe returns an array of messages
        message = Array.isArray(res.message) ? res.message.join(', ') : res.message;
      } else if (typeof res === 'string') {
        message = res;
      }

      // Map common HTTP status to Vietnamese messages
      switch (status) {
        case 400:
          errorCode = 'BAD_REQUEST';
          message = message === 'Bad Request' ? 'Dữ liệu đầu vào không hợp lệ.' : message;
          break;
        case 401:
          errorCode = 'UNAUTHORIZED';
          message = 'Email hoặc mật khẩu không chính xác, hoặc phiên đăng nhập đã hết hạn.';
          break;
        case 403:
          errorCode = 'FORBIDDEN';
          message = 'Bạn không có quyền truy cập vào tính năng này.';
          break;
        case 404:
          errorCode = 'NOT_FOUND';
          message = 'Không tìm thấy tài nguyên yêu cầu.';
          break;
        case 409:
          errorCode = 'CONFLICT';
          message = message === 'Conflict' ? 'Dữ liệu đã tồn tại trong hệ thống.' : message;
          break;
      }
    } else {
      this.logger.error(`[Unhandled Exception] ${exception}`, exception instanceof Error ? exception.stack : '');
    }

    // Translating common NestJS English messages
    if (message.includes('Invalid email or password')) message = 'Email hoặc mật khẩu không chính xác.';
    if (message.includes('Email is already registered')) message = 'Email này đã được đăng ký trong hệ thống.';

    response.status(status).json({
      success: false,
      error: {
        code: errorCode,
        message: message,
        statusCode: status,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
