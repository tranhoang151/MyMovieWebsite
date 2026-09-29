import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as Record<string, unknown>).message || exception.message;

      return response.status(status).json({
        success: false,
        error: Array.isArray(message) ? message : [message],
        statusCode: status,
      });
    }

    // Log unexpected errors
    console.error('Unhandled exception:', exception);

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ['Lỗi server nội bộ'],
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
}